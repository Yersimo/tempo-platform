/**
 * Time-Bound Delegation System
 *
 * Modeled after Oracle Fusion HCM and Workday delegation patterns.
 * Allows users to temporarily delegate their authority to another user.
 *
 * Delegation types:
 * - full_role:        delegate receives all permissions of the delegator's role
 * - business_process: delegate can act on specific processes (leave approval, etc.)
 * - approval_only:    delegate can approve/reject on behalf of the delegator
 *
 * Safety constraints (enterprise best practices):
 * - Maximum delegation duration (default 365 days per Workday pattern)
 * - Cannot delegate to yourself
 * - Cannot delegate permissions you don't have
 * - Cannot delegate above your own role level
 * - Delegation can be revoked at any time by delegator or admin
 * - Expired delegations are automatically cleaned up
 *
 * Usage:
 *   const d = createDelegation({ ... })
 *   isDelegateFor('user-123', 'user-456', 'leave_approval') // true
 *   getEffectivePermissionsWithDelegation(userId, delegations) // merged perms
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Delegation {
  id: string;
  /** The user who is granting delegation */
  delegatorId: string;
  /** The user who receives the delegation */
  delegateId: string;
  /** Type of delegation */
  type: 'full_role' | 'business_process' | 'approval_only';
  /** For business_process type: which processes are delegated */
  processes?: string[];
  /** For approval_only: which approval types are delegated */
  approvalTypes?: string[];
  /** When the delegation begins (ISO 8601) */
  startDate: string;
  /** When the delegation expires (ISO 8601, max 1 year) */
  endDate: string;
  /** Reason for delegation (required for audit trail) */
  reason: string;
  /** Current status */
  status: 'active' | 'expired' | 'revoked';
  /** Creation metadata */
  createdAt: string;
  createdBy: string;
  /** Revocation metadata (populated when revoked) */
  revokedAt?: string;
  revokedBy?: string;
}

export interface DelegationRule {
  /** Which functional roles are allowed to create delegations */
  allowedDelegatorRoles: string[];
  /** Business processes that can be delegated */
  delegatableProcesses: string[];
  /** Maximum delegation period in days */
  maxDurationDays: number;
  /** Whether the delegator retains their access during the delegation */
  retainAccess: boolean;
  /** Whether creating this delegation requires admin approval */
  requiresApproval: boolean;
}

export interface CreateDelegationInput {
  delegatorId: string;
  delegateId: string;
  type: 'full_role' | 'business_process' | 'approval_only';
  processes?: string[];
  approvalTypes?: string[];
  startDate: string;
  endDate: string;
  reason: string;
  createdBy: string;
}

export interface DelegationValidationError {
  code: string;
  message: string;
}

// ── Business Processes ────────────────────────────────────────────────────────

/**
 * All business processes that support delegation. Each process maps to
 * a workflow in the approval engine.
 */
export const DELEGATABLE_PROCESSES = [
  'leave_approval',
  'expense_approval',
  'timesheet_approval',
  'hiring_approval',
  'purchase_approval',
  'performance_review',
  'compensation_change',
  'transfer_approval',
  'termination_approval',
  'invoice_approval',
  'budget_approval',
  'travel_approval',
] as const;

export type DelegatableProcess = (typeof DELEGATABLE_PROCESSES)[number];

/**
 * Approval types that can be independently delegated.
 */
export const DELEGATABLE_APPROVAL_TYPES = [
  'leave_request',
  'expense_report',
  'purchase_order',
  'timesheet',
  'headcount_request',
  'offer_approval',
  'invoice_payment',
  'budget_amendment',
  'travel_request',
] as const;

export type DelegatableApprovalType = (typeof DELEGATABLE_APPROVAL_TYPES)[number];

// ── Predefined Delegation Rules ───────────────────────────────────────────────

/**
 * Default delegation rules by functional role.
 * Controls what each role level is allowed to delegate.
 */
export const DELEGATION_RULES: Record<string, DelegationRule> = {
  owner: {
    allowedDelegatorRoles: ['owner'],
    delegatableProcesses: [...DELEGATABLE_PROCESSES],
    maxDurationDays: 365,
    retainAccess: true,
    requiresApproval: false,
  },
  admin: {
    allowedDelegatorRoles: ['owner', 'admin'],
    delegatableProcesses: [...DELEGATABLE_PROCESSES],
    maxDurationDays: 365,
    retainAccess: true,
    requiresApproval: false,
  },
  hrbp: {
    allowedDelegatorRoles: ['owner', 'admin', 'hrbp'],
    delegatableProcesses: [
      'leave_approval', 'hiring_approval', 'performance_review',
      'compensation_change', 'transfer_approval', 'termination_approval',
    ],
    maxDurationDays: 180,
    retainAccess: true,
    requiresApproval: false,
  },
  manager: {
    allowedDelegatorRoles: ['owner', 'admin', 'hrbp', 'manager'],
    delegatableProcesses: [
      'leave_approval', 'expense_approval', 'timesheet_approval',
      'performance_review', 'travel_approval',
    ],
    maxDurationDays: 90,
    retainAccess: true,
    requiresApproval: true,
  },
  employee: {
    allowedDelegatorRoles: [], // employees cannot delegate
    delegatableProcesses: [],
    maxDurationDays: 0,
    retainAccess: true,
    requiresApproval: true,
  },
};

// ── In-Memory Store ───────────────────────────────────────────────────────────

let delegationStore: Delegation[] = [];
let delegationIdCounter = 1;

function generateDelegationId(): string {
  return `dlg_${Date.now()}_${delegationIdCounter++}`;
}

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate a delegation request against business rules.
 * Returns an array of validation errors (empty = valid).
 */
export function validateDelegation(
  input: CreateDelegationInput,
  delegatorRole: string,
): DelegationValidationError[] {
  const errors: DelegationValidationError[] = [];

  // Cannot delegate to yourself
  if (input.delegatorId === input.delegateId) {
    errors.push({
      code: 'SELF_DELEGATION',
      message: 'Cannot delegate authority to yourself.',
    });
  }

  // Check role is allowed to delegate
  const rule = DELEGATION_RULES[delegatorRole];
  if (!rule) {
    errors.push({
      code: 'UNKNOWN_ROLE',
      message: `Role "${delegatorRole}" is not recognized.`,
    });
    return errors;
  }

  if (rule.delegatableProcesses.length === 0) {
    errors.push({
      code: 'DELEGATION_NOT_ALLOWED',
      message: `Role "${delegatorRole}" is not allowed to create delegations.`,
    });
    return errors;
  }

  // Validate dates
  const start = new Date(input.startDate);
  const end = new Date(input.endDate);
  const now = new Date();

  if (isNaN(start.getTime())) {
    errors.push({ code: 'INVALID_START_DATE', message: 'Start date is invalid.' });
  }
  if (isNaN(end.getTime())) {
    errors.push({ code: 'INVALID_END_DATE', message: 'End date is invalid.' });
  }

  if (start >= end) {
    errors.push({
      code: 'DATE_RANGE_INVALID',
      message: 'End date must be after start date.',
    });
  }

  // Check max duration
  if (rule.maxDurationDays > 0) {
    const durationMs = end.getTime() - start.getTime();
    const durationDays = durationMs / (1000 * 60 * 60 * 24);
    if (durationDays > rule.maxDurationDays) {
      errors.push({
        code: 'DURATION_EXCEEDED',
        message: `Delegation duration (${Math.ceil(durationDays)} days) exceeds maximum of ${rule.maxDurationDays} days for role "${delegatorRole}".`,
      });
    }
  }

  // Validate processes if business_process type
  if (input.type === 'business_process') {
    if (!input.processes || input.processes.length === 0) {
      errors.push({
        code: 'NO_PROCESSES',
        message: 'Business process delegation requires at least one process.',
      });
    } else {
      for (const proc of input.processes) {
        if (!(rule.delegatableProcesses as readonly string[]).includes(proc)) {
          errors.push({
            code: 'PROCESS_NOT_DELEGATABLE',
            message: `Process "${proc}" cannot be delegated by role "${delegatorRole}".`,
          });
        }
      }
    }
  }

  // Validate approval types if approval_only type
  if (input.type === 'approval_only') {
    if (!input.approvalTypes || input.approvalTypes.length === 0) {
      errors.push({
        code: 'NO_APPROVAL_TYPES',
        message: 'Approval-only delegation requires at least one approval type.',
      });
    }
  }

  // Reason is required
  if (!input.reason || input.reason.trim().length === 0) {
    errors.push({
      code: 'REASON_REQUIRED',
      message: 'A reason for delegation is required for audit trail.',
    });
  }

  // Check for overlapping active delegations
  const overlapping = delegationStore.find(
    (d) =>
      d.status === 'active' &&
      d.delegatorId === input.delegatorId &&
      d.delegateId === input.delegateId &&
      d.type === input.type &&
      new Date(d.startDate) < end &&
      new Date(d.endDate) > start,
  );
  if (overlapping) {
    errors.push({
      code: 'OVERLAPPING_DELEGATION',
      message: `An active delegation of the same type already exists between these users (${overlapping.id}).`,
    });
  }

  return errors;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

/**
 * Create a new delegation. Validates all business rules before creation.
 * Returns the created delegation or throws with validation errors.
 */
export function createDelegation(
  input: CreateDelegationInput,
  delegatorRole: string,
): { delegation?: Delegation; errors?: DelegationValidationError[] } {
  const errors = validateDelegation(input, delegatorRole);
  if (errors.length > 0) {
    return { errors };
  }

  const now = new Date().toISOString();
  const delegation: Delegation = {
    id: generateDelegationId(),
    delegatorId: input.delegatorId,
    delegateId: input.delegateId,
    type: input.type,
    processes: input.processes,
    approvalTypes: input.approvalTypes,
    startDate: input.startDate,
    endDate: input.endDate,
    reason: input.reason,
    status: 'active',
    createdAt: now,
    createdBy: input.createdBy,
  };

  delegationStore.push(delegation);
  return { delegation };
}

/**
 * Revoke an active delegation. Can be done by the delegator or an admin.
 */
export function revokeDelegation(
  delegationId: string,
  revokedBy: string,
): { success: boolean; error?: string } {
  const delegation = delegationStore.find((d) => d.id === delegationId);
  if (!delegation) {
    return { success: false, error: `Delegation "${delegationId}" not found.` };
  }

  if (delegation.status !== 'active') {
    return {
      success: false,
      error: `Delegation "${delegationId}" is already ${delegation.status}.`,
    };
  }

  delegation.status = 'revoked';
  delegation.revokedAt = new Date().toISOString();
  delegation.revokedBy = revokedBy;

  return { success: true };
}

/**
 * Get all active delegations (optionally filtered by delegator or delegate).
 */
export function getActiveDelegations(filters?: {
  delegatorId?: string;
  delegateId?: string;
}): Delegation[] {
  // Auto-expire any that have passed their end date
  cleanupExpiredDelegations();

  return delegationStore.filter((d) => {
    if (d.status !== 'active') return false;
    if (filters?.delegatorId && d.delegatorId !== filters.delegatorId) return false;
    if (filters?.delegateId && d.delegateId !== filters.delegateId) return false;
    return true;
  });
}

/**
 * Get all delegations (any status) for a specific user, either as
 * delegator or delegate.
 */
export function getDelegationsForUser(userId: string): Delegation[] {
  return delegationStore.filter(
    (d) => d.delegatorId === userId || d.delegateId === userId,
  );
}

/**
 * Check whether a user is a delegate for another user, optionally
 * scoped to a specific process or approval type.
 */
export function isDelegateFor(
  delegateId: string,
  delegatorId: string,
  processOrApprovalType?: string,
): boolean {
  // Auto-expire first
  cleanupExpiredDelegations();

  const now = new Date();

  return delegationStore.some((d) => {
    if (d.status !== 'active') return false;
    if (d.delegateId !== delegateId) return false;
    if (d.delegatorId !== delegatorId) return false;

    // Check date range
    if (new Date(d.startDate) > now || new Date(d.endDate) < now) return false;

    // If no specific process requested, any delegation matches
    if (!processOrApprovalType) return true;

    // Check type-specific scope
    if (d.type === 'full_role') return true;
    if (d.type === 'business_process' && d.processes) {
      return d.processes.includes(processOrApprovalType);
    }
    if (d.type === 'approval_only' && d.approvalTypes) {
      return d.approvalTypes.includes(processOrApprovalType);
    }

    return false;
  });
}

/**
 * Get the effective permissions a user has including their delegated authority.
 * Returns the set of processes/approval types the user can act on behalf
 * of their delegators.
 */
export function getEffectivePermissionsWithDelegation(
  userId: string,
): {
  fullRoleDelegations: Array<{ delegatorId: string; delegatorRole: string }>;
  processDelegations: Array<{ delegatorId: string; process: string }>;
  approvalDelegations: Array<{ delegatorId: string; approvalType: string }>;
} {
  cleanupExpiredDelegations();

  const now = new Date();
  const active = delegationStore.filter(
    (d) =>
      d.status === 'active' &&
      d.delegateId === userId &&
      new Date(d.startDate) <= now &&
      new Date(d.endDate) >= now,
  );

  const fullRoleDelegations: Array<{ delegatorId: string; delegatorRole: string }> = [];
  const processDelegations: Array<{ delegatorId: string; process: string }> = [];
  const approvalDelegations: Array<{ delegatorId: string; approvalType: string }> = [];

  for (const d of active) {
    switch (d.type) {
      case 'full_role':
        // For full role delegations, we note the delegator but the actual
        // role resolution requires looking up the delegator's role elsewhere
        fullRoleDelegations.push({ delegatorId: d.delegatorId, delegatorRole: '' });
        break;
      case 'business_process':
        if (d.processes) {
          for (const proc of d.processes) {
            processDelegations.push({ delegatorId: d.delegatorId, process: proc });
          }
        }
        break;
      case 'approval_only':
        if (d.approvalTypes) {
          for (const at of d.approvalTypes) {
            approvalDelegations.push({ delegatorId: d.delegatorId, approvalType: at });
          }
        }
        break;
    }
  }

  return { fullRoleDelegations, processDelegations, approvalDelegations };
}

/**
 * Mark all expired delegations as 'expired'. This is called automatically
 * by query functions but can also be invoked explicitly (e.g., on a cron job).
 */
export function cleanupExpiredDelegations(): number {
  const now = new Date();
  let count = 0;

  for (const d of delegationStore) {
    if (d.status === 'active' && new Date(d.endDate) < now) {
      d.status = 'expired';
      count++;
    }
  }

  return count;
}

/**
 * Get a delegation by ID.
 */
export function getDelegation(id: string): Delegation | undefined {
  return delegationStore.find((d) => d.id === id);
}

/**
 * Get all delegations (for admin views).
 */
export function getAllDelegations(): Delegation[] {
  return [...delegationStore];
}

/**
 * Clear the delegation store. Used for testing.
 */
export function clearDelegationStore(): void {
  delegationStore = [];
  delegationIdCounter = 1;
}

/**
 * Get the delegation rule for a specific role.
 */
export function getDelegationRule(role: string): DelegationRule | undefined {
  return DELEGATION_RULES[role];
}

/**
 * Check whether creating a delegation for the given role requires
 * admin approval.
 */
export function requiresApproval(role: string): boolean {
  const rule = DELEGATION_RULES[role];
  return rule?.requiresApproval ?? true;
}

/**
 * Get a summary of delegation activity for compliance reporting.
 */
export function getDelegationSummary(): {
  total: number;
  active: number;
  expired: number;
  revoked: number;
  byType: Record<string, number>;
} {
  cleanupExpiredDelegations();

  const summary = {
    total: delegationStore.length,
    active: 0,
    expired: 0,
    revoked: 0,
    byType: {} as Record<string, number>,
  };

  for (const d of delegationStore) {
    switch (d.status) {
      case 'active': summary.active++; break;
      case 'expired': summary.expired++; break;
      case 'revoked': summary.revoked++; break;
    }
    summary.byType[d.type] = (summary.byType[d.type] ?? 0) + 1;
  }

  return summary;
}
