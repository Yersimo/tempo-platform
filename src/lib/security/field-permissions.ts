/**
 * Field-Level Permission System
 *
 * Modeled after SAP SuccessFactors' per-field View/Edit/Correct/Delete granularity.
 * Each sensitive field on each entity has explicit access levels per role.
 *
 * Access levels (ordered from least to most permissive):
 * - hidden: field is not returned in API responses
 * - view:   field is visible but read-only
 * - edit:   field can be modified (current value only)
 * - correct: field can be modified including historical data (SAP "Correct" pattern)
 * - full:   unrestricted access including delete capability
 *
 * Usage:
 *   canViewField('manager', 'compensation', 'base_salary') // false
 *   canEditField('hrbp', 'employee', 'phone')              // true
 *   getVisibleFields('employee', 'compensation')            // ['base_salary', 'total_comp'] (own data only)
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type FieldAccess = 'hidden' | 'view' | 'edit' | 'correct' | 'full';

export interface FieldPermission {
  /** Entity this field belongs to (e.g. 'employee', 'compensation') */
  entity: string;
  /** Field name on the entity */
  field: string;
  /** Human-readable label for admin UIs */
  label: string;
  /** Whether this field contains PII, compensation, or other sensitive data */
  sensitive: boolean;
  /** Access level per functional role */
  accessByRole: Record<string, FieldAccess>;
}

/** Ordered access levels from least to most permissive */
const ACCESS_HIERARCHY: FieldAccess[] = ['hidden', 'view', 'edit', 'correct', 'full'];

// ── All Roles Referenced ──────────────────────────────────────────────────────

/**
 * Canonical role keys used in accessByRole mappings.
 * - owner:            organization owner
 * - admin:            platform administrator
 * - hrbp:             HR business partner
 * - manager:          people manager (sees direct reports)
 * - employee:         standard employee (sees own data)
 * - finance_approver: finance / payroll role
 * - it_manager:       IT administrator
 * - recruiter:        talent acquisition
 */
const ROLES = ['owner', 'admin', 'hrbp', 'manager', 'employee', 'finance_approver', 'it_manager', 'recruiter'] as const;
type RoleKey = (typeof ROLES)[number];

// ── Helper to build a permission entry ────────────────────────────────────────

function fp(
  entity: string,
  field: string,
  label: string,
  sensitive: boolean,
  access: Record<RoleKey, FieldAccess>,
): FieldPermission {
  return { entity, field, label, sensitive, accessByRole: access };
}

// ── Field Permission Definitions ──────────────────────────────────────────────

/**
 * Complete field permission registry for all sensitive entities.
 * Each entry defines per-role access for a single field.
 */
export const FIELD_PERMISSIONS: FieldPermission[] = [

  // ── Employee Profile ──────────────────────────────────────────────────────

  fp('employee', 'name', 'Full Name', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'view', finance_approver: 'view', it_manager: 'view', recruiter: 'view',
  }),
  fp('employee', 'email', 'Email Address', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'edit', finance_approver: 'view', it_manager: 'view', recruiter: 'view',
  }),
  fp('employee', 'phone', 'Phone Number', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'address', 'Home Address', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'ssn', 'SSN / National ID', true, {
    owner: 'full', admin: 'view', hrbp: 'hidden', manager: 'hidden',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'national_id', 'National ID Number', true, {
    owner: 'full', admin: 'view', hrbp: 'hidden', manager: 'hidden',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'date_of_birth', 'Date of Birth', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'emergency_contact', 'Emergency Contact', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('employee', 'bank_details', 'Bank Account Details', true, {
    owner: 'full', admin: 'view', hrbp: 'hidden', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),

  // ── Compensation ──────────────────────────────────────────────────────────

  fp('compensation', 'base_salary', 'Base Salary', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('compensation', 'bonus', 'Bonus', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('compensation', 'equity', 'Equity / Stock Options', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('compensation', 'total_comp', 'Total Compensation', true, {
    owner: 'full', admin: 'full', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('compensation', 'pay_band', 'Pay Band / Grade', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'hidden', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('compensation', 'salary_history', 'Salary History', true, {
    owner: 'full', admin: 'correct', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),

  // ── Payroll ───────────────────────────────────────────────────────────────

  fp('payroll', 'gross_pay', 'Gross Pay', true, {
    owner: 'full', admin: 'full', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('payroll', 'net_pay', 'Net Pay', true, {
    owner: 'full', admin: 'full', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('payroll', 'deductions', 'Deductions', true, {
    owner: 'full', admin: 'full', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('payroll', 'tax_info', 'Tax Information', true, {
    owner: 'full', admin: 'full', hrbp: 'hidden', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('payroll', 'bank_account', 'Payroll Bank Account', true, {
    owner: 'full', admin: 'view', hrbp: 'hidden', manager: 'hidden',
    employee: 'view', finance_approver: 'view', it_manager: 'hidden', recruiter: 'hidden',
  }),

  // ── Performance ───────────────────────────────────────────────────────────

  fp('performance', 'rating', 'Performance Rating', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'edit',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('performance', 'goals', 'Goals & Objectives', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'edit',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('performance', 'review_comments', 'Review Comments', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'edit',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('performance', 'PIP_status', 'PIP Status', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),

  // ── Benefits ──────────────────────────────────────────────────────────────

  fp('benefits', 'enrollment', 'Benefits Enrollment', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('benefits', 'plan_details', 'Plan Details', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('benefits', 'dependents', 'Dependents', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'hidden',
    employee: 'edit', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),
  fp('benefits', 'medical_info', 'Medical Information', true, {
    owner: 'full', admin: 'view', hrbp: 'view', manager: 'hidden',
    employee: 'view', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'hidden',
  }),

  // ── Recruiting ────────────────────────────────────────────────────────────

  fp('recruiting', 'offer_amount', 'Offer Amount', true, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'view',
    employee: 'hidden', finance_approver: 'view', it_manager: 'hidden', recruiter: 'edit',
  }),
  fp('recruiting', 'candidate_feedback', 'Candidate Feedback', false, {
    owner: 'full', admin: 'full', hrbp: 'edit', manager: 'edit',
    employee: 'hidden', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'edit',
  }),
  fp('recruiting', 'interview_scores', 'Interview Scores', true, {
    owner: 'full', admin: 'full', hrbp: 'view', manager: 'view',
    employee: 'hidden', finance_approver: 'hidden', it_manager: 'hidden', recruiter: 'edit',
  }),
];

// ── Indexed Lookups ───────────────────────────────────────────────────────────

/** Fast lookup: entity:field -> FieldPermission */
const permissionIndex = new Map<string, FieldPermission>();
for (const fp of FIELD_PERMISSIONS) {
  permissionIndex.set(`${fp.entity}:${fp.field}`, fp);
}

/** Index by entity for quick entity-level queries */
const entityIndex = new Map<string, FieldPermission[]>();
for (const fp of FIELD_PERMISSIONS) {
  const list = entityIndex.get(fp.entity) ?? [];
  list.push(fp);
  entityIndex.set(fp.entity, list);
}

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Get the access level for a specific role on a specific entity field.
 * Returns 'hidden' if no permission is defined (fail-closed).
 */
export function getFieldAccess(role: string, entity: string, field: string): FieldAccess {
  const perm = permissionIndex.get(`${entity}:${field}`);
  if (!perm) return 'hidden';
  return perm.accessByRole[role] ?? 'hidden';
}

/**
 * Get all field names on an entity that are visible (not hidden) for a role.
 */
export function getVisibleFields(role: string, entity: string): string[] {
  const perms = entityIndex.get(entity) ?? [];
  return perms
    .filter((p) => {
      const access = p.accessByRole[role] ?? 'hidden';
      return access !== 'hidden';
    })
    .map((p) => p.field);
}

/**
 * Get all field names on an entity that are editable (edit, correct, or full) for a role.
 */
export function getEditableFields(role: string, entity: string): string[] {
  const editableLevels: FieldAccess[] = ['edit', 'correct', 'full'];
  const perms = entityIndex.get(entity) ?? [];
  return perms
    .filter((p) => {
      const access = p.accessByRole[role] ?? 'hidden';
      return editableLevels.includes(access);
    })
    .map((p) => p.field);
}

/**
 * Get all fields marked as sensitive for a given entity.
 */
export function getSensitiveFields(entity: string): FieldPermission[] {
  const perms = entityIndex.get(entity) ?? [];
  return perms.filter((p) => p.sensitive);
}

/**
 * Check whether a role can view (i.e. access is not 'hidden') a specific field.
 */
export function canViewField(role: string, entity: string, field: string): boolean {
  const access = getFieldAccess(role, entity, field);
  return access !== 'hidden';
}

/**
 * Check whether a role can edit a specific field.
 * Edit access includes 'edit', 'correct', and 'full'.
 */
export function canEditField(role: string, entity: string, field: string): boolean {
  const access = getFieldAccess(role, entity, field);
  return access === 'edit' || access === 'correct' || access === 'full';
}

/**
 * Check whether a role can correct (edit historical data) a specific field.
 * Only 'correct' and 'full' levels allow this.
 */
export function canCorrectField(role: string, entity: string, field: string): boolean {
  const access = getFieldAccess(role, entity, field);
  return access === 'correct' || access === 'full';
}

/**
 * Compare two access levels. Returns:
 *   negative if a < b, 0 if equal, positive if a > b
 */
export function compareAccess(a: FieldAccess, b: FieldAccess): number {
  return ACCESS_HIERARCHY.indexOf(a) - ACCESS_HIERARCHY.indexOf(b);
}

/**
 * Get the more permissive of two access levels.
 */
export function mergeAccess(a: FieldAccess, b: FieldAccess): FieldAccess {
  return compareAccess(a, b) >= 0 ? a : b;
}

/**
 * Get all field permissions for an entity, keyed by field name.
 */
export function getEntityFieldPermissions(entity: string): Record<string, FieldPermission> {
  const perms = entityIndex.get(entity) ?? [];
  const result: Record<string, FieldPermission> = {};
  for (const p of perms) {
    result[p.field] = p;
  }
  return result;
}

/**
 * Get a summary of all entities that have field-level permissions defined.
 */
export function getEntitiesWithPermissions(): string[] {
  return Array.from(entityIndex.keys());
}

/**
 * Sanitize a data record by removing fields that the role cannot view.
 * Returns a new object with hidden fields stripped out.
 */
export function sanitizeRecord(
  role: string,
  entity: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const perms = entityIndex.get(entity);
  if (!perms || perms.length === 0) return data;

  const result = { ...data };
  for (const perm of perms) {
    const access = perm.accessByRole[role] ?? 'hidden';
    if (access === 'hidden' && perm.field in result) {
      delete result[perm.field];
    }
  }
  return result;
}

/**
 * Get a human-readable access summary for a role across all entities.
 * Useful for admin UIs that display "what can this role see?"
 */
export function getRoleAccessSummary(role: string): Record<string, Record<string, FieldAccess>> {
  const summary: Record<string, Record<string, FieldAccess>> = {};
  for (const [entity, perms] of entityIndex) {
    summary[entity] = {};
    for (const perm of perms) {
      summary[entity][perm.field] = perm.accessByRole[role] ?? 'hidden';
    }
  }
  return summary;
}
