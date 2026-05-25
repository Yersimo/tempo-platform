/**
 * Canonical event types — typed union of every event Tempo emits.
 *
 * Adding a new event:
 *   1. Add it to the EventTypeName union below.
 *   2. Add its payload shape to the EventPayloads map.
 *   3. Bump the version if the schema changes.
 *
 * The union enforces that emitEvent() callers and subscriber handlers
 * agree on the payload shape — drift becomes a compile error.
 */

// ─── Event type catalog ─────────────────────────────────────────────

export type EventTypeName =
  // Expense flow
  | 'expense.submitted'
  | 'expense.auto_approved'
  | 'expense.approval_routed'
  | 'expense.approved'
  | 'expense.rejected'
  | 'expense.reimbursed'
  // Employee lifecycle
  | 'employee.created'
  | 'employee.role_changed'
  | 'employee.compensation_changed'
  | 'employee.terminated'
  // Approval engine
  | 'approval.step_created'
  | 'approval.step_decided'
  | 'approval.chain_completed'
  // Onboarding
  | 'onboarding.day_one_ready'
  | 'onboarding.provisioning_completed'
  // Auth / access
  | 'auth.login_succeeded'
  | 'auth.login_failed'
  | 'auth.access_granted'
  | 'auth.access_revoked'
  // AI surfaces
  | 'ai.inference_run'
  | 'ai.confidence_below_threshold'
  // Policy
  | 'policy.applied'
  | 'policy.violated'

// ─── Per-event payload shapes ───────────────────────────────────────

export interface EventPayloads {
  // Expense
  'expense.submitted': {
    expenseReportId: string
    amount: number
    currency: string
    vendor: string | null
    autoApprovalEligible: boolean
    policyId: string
  }
  'expense.auto_approved': {
    expenseReportId: string
    appliedRuleId: string
    confidence: number
  }
  'expense.approval_routed': {
    expenseReportId: string
    approverId: string
    requiredSignatures: number
  }
  'expense.approved': {
    expenseReportId: string
    approvedBy: string
    approvalStepId: string
  }
  'expense.rejected': {
    expenseReportId: string
    rejectedBy: string
    reason: string
  }
  'expense.reimbursed': {
    expenseReportId: string
    batchId: string | null
    amount: number
    currency: string
  }

  // Employee
  'employee.created': {
    employeeId: string
    fullName: string
    department: string
    role: string
    country: string
  }
  'employee.role_changed': {
    employeeId: string
    fromRole: string
    toRole: string
    effectiveDate: string
  }
  'employee.compensation_changed': {
    employeeId: string
    fromAmount: number
    toAmount: number
    currency: string
    changeType: 'merit' | 'promotion' | 'off_cycle' | 'market_correction'
    effectiveDate: string
  }
  'employee.terminated': {
    employeeId: string
    reason: 'voluntary' | 'involuntary' | 'redundancy' | 'end_of_contract'
    lastDay: string
  }

  // Approval
  'approval.step_created': {
    stepId: string
    chainId: string
    entityType: string
    entityId: string
    approverId: string
    stepOrder: number
  }
  'approval.step_decided': {
    stepId: string
    decision: 'approved' | 'rejected'
    decidedBy: string
    comments: string | null
  }
  'approval.chain_completed': {
    chainId: string
    entityType: string
    entityId: string
    outcome: 'approved' | 'rejected'
  }

  // Onboarding
  'onboarding.day_one_ready': {
    employeeId: string
    systemsReady: number
    systemsTotal: number
    blockers: string[]
  }
  'onboarding.provisioning_completed': {
    employeeId: string
    systems: string[]
  }

  // Auth
  'auth.login_succeeded': {
    employeeId: string
    method: 'password' | 'sso' | 'mfa'
    ip: string | null
  }
  'auth.login_failed': {
    email: string
    reason: 'invalid_password' | 'locked' | 'unknown_user'
    ip: string | null
  }
  'auth.access_granted': {
    employeeId: string
    resource: string
    grantedBy: string
  }
  'auth.access_revoked': {
    employeeId: string
    resource: string
    revokedBy: string
    reason: string
  }

  // AI
  'ai.inference_run': {
    surface: 'expense_scan' | 'cost_center' | 'business_purpose' | 'assistant' | 'anomaly'
    model: string
    durationMs: number
    confidence: number | null
    inputTokens?: number
    outputTokens?: number
  }
  'ai.confidence_below_threshold': {
    surface: string
    confidence: number
    threshold: number
    fallback: string
  }

  // Policy
  'policy.applied': {
    policyId: string
    policyVersion: string
    appliedRuleId: string
    entityType: string
    entityId: string
  }
  'policy.violated': {
    policyId: string
    section: string
    severity: 'block' | 'warn' | 'info'
    message: string
    entityType: string
    entityId: string
  }
}

// ─── Generic typed event ────────────────────────────────────────────

/** A typed event ready to be persisted. */
export interface TempoEvent<T extends EventTypeName = EventTypeName> {
  eventType: T
  eventVersion?: number
  entityType: string
  entityId: string
  actorId?: string | null
  payload: EventPayloads[T]
  before?: Record<string, unknown> | null
  after?: Record<string, unknown> | null
  correlationId?: string | null
  causedByEventId?: string | null
  occurredAt?: Date
}

/** The persisted shape — what comes back from the events table. */
export interface PersistedEvent {
  id: string
  orgId: string
  eventType: string
  eventVersion: number
  entityType: string
  entityId: string
  actorId: string | null
  payload: unknown
  before: unknown | null
  after: unknown | null
  correlationId: string | null
  causedByEventId: string | null
  occurredAt: Date
  recordedAt: Date
}
