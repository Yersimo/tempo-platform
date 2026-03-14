/**
 * Role-Based Access Control (RBAC) — Permissions System
 *
 * Supports the existing DB enum roles (owner, admin, hrbp, manager, employee)
 * plus virtual "capability" roles (finance, it_admin, recruiter) that extend
 * permissions without requiring a DB migration.
 *
 * Usage:
 *   const perms = getPermissionsForRole('hrbp')
 *   hasPermission(perms, 'payroll:read') // false
 *
 *   // With capabilities:
 *   const perms = getPermissionsForRoles(['manager'], ['finance_approver'])
 *   hasPermission(perms, 'finance:read') // true
 */

// ── Permission type ────────────────────────────────────────────────────────

export type Permission =
  // People
  | 'people:read' | 'people:write' | 'people:delete'
  | 'performance:read' | 'performance:write' | 'performance:manage'
  | 'compensation:read' | 'compensation:write'
  // Operations
  | 'payroll:read' | 'payroll:run' | 'payroll:approve'
  | 'expense:read' | 'expense:submit' | 'expense:approve'
  | 'leave:read' | 'leave:submit' | 'leave:approve'
  | 'benefits:read' | 'benefits:manage'
  | 'time:read' | 'time:manage'
  | 'onboarding:read' | 'onboarding:manage'
  | 'offboarding:read' | 'offboarding:manage'
  // Finance
  | 'finance:read' | 'finance:write' | 'finance:approve'
  | 'invoices:read' | 'invoices:write'
  | 'budgets:read' | 'budgets:write'
  // IT
  | 'it:read' | 'it:manage' | 'it:admin'
  | 'identity:read' | 'identity:manage'
  // Recruiting
  | 'recruiting:read' | 'recruiting:write'
  | 'headcount:read' | 'headcount:write'
  // Compliance & Security
  | 'compliance:read' | 'compliance:manage'
  | 'documents:read' | 'documents:write'
  // Settings & Admin
  | 'settings:read' | 'settings:manage'
  | 'workflows:read' | 'workflows:manage'
  | 'analytics:read'
  | 'admin:full'

// ── All permissions (used for owner) ───────────────────────────────────────

const ALL_PERMISSIONS: Permission[] = [
  'people:read', 'people:write', 'people:delete',
  'performance:read', 'performance:write', 'performance:manage',
  'compensation:read', 'compensation:write',
  'payroll:read', 'payroll:run', 'payroll:approve',
  'expense:read', 'expense:submit', 'expense:approve',
  'leave:read', 'leave:submit', 'leave:approve',
  'benefits:read', 'benefits:manage',
  'time:read', 'time:manage',
  'onboarding:read', 'onboarding:manage',
  'offboarding:read', 'offboarding:manage',
  'finance:read', 'finance:write', 'finance:approve',
  'invoices:read', 'invoices:write',
  'budgets:read', 'budgets:write',
  'it:read', 'it:manage', 'it:admin',
  'identity:read', 'identity:manage',
  'recruiting:read', 'recruiting:write',
  'headcount:read', 'headcount:write',
  'compliance:read', 'compliance:manage',
  'documents:read', 'documents:write',
  'settings:read', 'settings:manage',
  'workflows:read', 'workflows:manage',
  'analytics:read',
  'admin:full',
]

// ── Role → Permission mapping ──────────────────────────────────────────────

/**
 * DB-backed roles. These match the `employee_role` pgEnum:
 *   owner | admin | hrbp | manager | employee
 */
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  owner: [...ALL_PERMISSIONS],

  admin: ALL_PERMISSIONS.filter(p => p !== 'admin:full'),

  hrbp: [
    'people:read', 'people:write',
    'performance:read', 'performance:write', 'performance:manage',
    'compensation:read', 'compensation:write',
    'recruiting:read', 'recruiting:write',
    'headcount:read', 'headcount:write',
    'onboarding:read', 'onboarding:manage',
    'offboarding:read', 'offboarding:manage',
    'leave:read', 'leave:approve',
    'expense:read',
    'benefits:read', 'benefits:manage',
    'time:read',
    'analytics:read',
    'compliance:read', 'compliance:manage',
    'documents:read', 'documents:write',
    'expense:submit',
    'leave:submit',
  ],

  manager: [
    'people:read',
    'performance:read', 'performance:write',
    'expense:read', 'expense:submit', 'expense:approve',
    'leave:read', 'leave:submit', 'leave:approve',
    'time:read',
    'onboarding:read',
    'analytics:read',
    'documents:read',
  ],

  employee: [
    'expense:submit',
    'leave:submit',
    'time:read',
    'documents:read',
    'performance:read',
  ],
}

// ── Capability → Permission mapping ────────────────────────────────────────

/**
 * Capability tags extend any role with additional permissions without
 * requiring a DB migration. Store as a JSON array on the employee record
 * or resolve via business logic.
 */
export const CAPABILITY_PERMISSIONS: Record<string, Permission[]> = {
  finance_approver: [
    'payroll:read', 'payroll:approve',
    'finance:read', 'finance:write', 'finance:approve',
    'invoices:read', 'invoices:write',
    'budgets:read', 'budgets:write',
    'expense:read', 'expense:approve',
    'compensation:read',
    'analytics:read',
  ],

  it_manager: [
    'it:read', 'it:manage', 'it:admin',
    'identity:read', 'identity:manage',
    'settings:read',
    'workflows:read', 'workflows:manage',
    'analytics:read',
  ],

  recruiter: [
    'recruiting:read', 'recruiting:write',
    'headcount:read', 'headcount:write',
    'people:read',
    'onboarding:read', 'onboarding:manage',
    'analytics:read',
  ],
}

// ── Human-readable labels ──────────────────────────────────────────────────

export const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  hrbp: 'HR Business Partner',
  manager: 'Manager',
  employee: 'Employee',
}

export const CAPABILITY_LABELS: Record<string, string> = {
  finance_approver: 'Finance Approver',
  it_manager: 'IT Manager',
  recruiter: 'Recruiter',
}

export const ALL_ROLES = Object.keys(ROLE_PERMISSIONS)
export const ALL_CAPABILITIES = Object.keys(CAPABILITY_PERMISSIONS)

// ── Helper functions ───────────────────────────────────────────────────────

/** Get permissions for a single role. Unknown roles return empty set. */
export function getPermissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role] ?? []
}

/**
 * Get the union of permissions for one or more roles plus optional capability
 * tags. Deduplicates automatically.
 */
export function getPermissionsForRoles(
  roles: string[],
  capabilities: string[] = [],
): Permission[] {
  const set = new Set<Permission>()
  for (const role of roles) {
    for (const p of getPermissionsForRole(role)) set.add(p)
  }
  for (const cap of capabilities) {
    for (const p of (CAPABILITY_PERMISSIONS[cap] ?? [])) set.add(p)
  }
  return Array.from(set)
}

/** Check if a single permission is present. */
export function hasPermission(
  userPermissions: Permission[],
  required: Permission,
): boolean {
  return userPermissions.includes(required)
}

/** Check if at least one of the required permissions is present. */
export function hasAnyPermission(
  userPermissions: Permission[],
  required: Permission[],
): boolean {
  return required.length === 0 || required.some(p => userPermissions.includes(p))
}

/** Check if ALL of the required permissions are present. */
export function hasAllPermissions(
  userPermissions: Permission[],
  required: Permission[],
): boolean {
  return required.every(p => userPermissions.includes(p))
}

// ── Role Hierarchy (Oracle pattern) ──────────────────────────────────────────

/**
 * Role hierarchy defines inheritance. A higher role inherits all permissions
 * of roles below it. Ordered from highest (owner) to lowest (employee).
 *
 * owner > admin > hrbp > manager > employee
 *
 * This follows Oracle Fusion's role hierarchy model where each role level
 * inherits the permissions of all subordinate levels.
 */
export const ROLE_HIERARCHY: readonly string[] = [
  'owner',
  'admin',
  'hrbp',
  'manager',
  'employee',
] as const

/**
 * Check whether role1 is higher than role2 in the hierarchy.
 * Returns true if role1 has a higher rank (lower index) than role2.
 * Unknown roles are treated as below employee.
 */
export function isRoleHigherThan(role1: string, role2: string): boolean {
  const idx1 = ROLE_HIERARCHY.indexOf(role1)
  const idx2 = ROLE_HIERARCHY.indexOf(role2)
  // Unknown roles get index -1, which we treat as the lowest
  const rank1 = idx1 === -1 ? ROLE_HIERARCHY.length : idx1
  const rank2 = idx2 === -1 ? ROLE_HIERARCHY.length : idx2
  return rank1 < rank2
}

/**
 * Get the numeric rank of a role (0 = highest). Returns -1 for unknown roles.
 */
export function getRoleRank(role: string): number {
  return ROLE_HIERARCHY.indexOf(role)
}

// ── Composable Roles ────────────────────────────────────────────────────────

/**
 * Composable role architecture following enterprise HRIS patterns:
 *
 * 1. Abstract Roles — broad access categories (Employee, Manager, Admin)
 * 2. Job Roles — domain-specific bundles (HR Admin, Payroll Admin, IT Admin)
 * 3. Duty Roles — atomic permission bundles that can be mixed and matched
 *
 * A user's effective permissions = union of all assigned roles at every tier.
 */

/** Abstract roles: the base layer of access */
export const ABSTRACT_ROLES: Record<string, { label: string; description: string; inherits?: string }> = {
  employee: {
    label: 'Employee',
    description: 'Base access for all employees. Self-service capabilities.',
  },
  manager: {
    label: 'Manager',
    description: 'People management. Inherits Employee.',
    inherits: 'employee',
  },
  admin: {
    label: 'Administrator',
    description: 'Full platform administration. Inherits Manager.',
    inherits: 'manager',
  },
}

/** Job roles: domain-specific permission bundles */
export const JOB_ROLES: Record<string, { label: string; description: string; permissions: Permission[] }> = {
  hr_admin: {
    label: 'HR Administrator',
    description: 'Full HR operations including onboarding, offboarding, and compliance.',
    permissions: [
      'people:read', 'people:write', 'people:delete',
      'performance:read', 'performance:write', 'performance:manage',
      'compensation:read', 'compensation:write',
      'onboarding:read', 'onboarding:manage',
      'offboarding:read', 'offboarding:manage',
      'benefits:read', 'benefits:manage',
      'compliance:read', 'compliance:manage',
      'documents:read', 'documents:write',
    ],
  },
  payroll_admin: {
    label: 'Payroll Administrator',
    description: 'Payroll processing, tax management, and financial reporting.',
    permissions: [
      'payroll:read', 'payroll:run', 'payroll:approve',
      'compensation:read',
      'finance:read',
      'people:read',
      'analytics:read',
    ],
  },
  it_admin: {
    label: 'IT Administrator',
    description: 'IT infrastructure, identity management, and device management.',
    permissions: [
      'it:read', 'it:manage', 'it:admin',
      'identity:read', 'identity:manage',
      'settings:read', 'settings:manage',
      'workflows:read', 'workflows:manage',
    ],
  },
  recruiting_lead: {
    label: 'Recruiting Lead',
    description: 'Talent acquisition, headcount planning, and candidate management.',
    permissions: [
      'recruiting:read', 'recruiting:write',
      'headcount:read', 'headcount:write',
      'people:read',
      'onboarding:read', 'onboarding:manage',
    ],
  },
  finance_controller: {
    label: 'Finance Controller',
    description: 'Financial oversight including budgets, invoices, and expense approvals.',
    permissions: [
      'finance:read', 'finance:write', 'finance:approve',
      'invoices:read', 'invoices:write',
      'budgets:read', 'budgets:write',
      'expense:read', 'expense:approve',
      'payroll:read',
      'compensation:read',
      'analytics:read',
    ],
  },
}

/** Duty roles: atomic permission bundles for fine-grained assignment */
export const DUTY_ROLES: Record<string, { label: string; description: string; permissions: Permission[] }> = {
  leave_approver: {
    label: 'Leave Approver',
    description: 'Can approve or reject leave requests.',
    permissions: ['leave:read', 'leave:approve'],
  },
  expense_approver: {
    label: 'Expense Approver',
    description: 'Can approve or reject expense reports.',
    permissions: ['expense:read', 'expense:approve'],
  },
  timesheet_manager: {
    label: 'Timesheet Manager',
    description: 'Can view and manage team timesheets.',
    permissions: ['time:read', 'time:manage'],
  },
  report_viewer: {
    label: 'Report Viewer',
    description: 'Read-only access to analytics and reporting.',
    permissions: ['analytics:read'],
  },
  document_manager: {
    label: 'Document Manager',
    description: 'Can upload, manage, and organize documents.',
    permissions: ['documents:read', 'documents:write'],
  },
  workflow_admin: {
    label: 'Workflow Administrator',
    description: 'Can create and manage approval workflows.',
    permissions: ['workflows:read', 'workflows:manage'],
  },
  compliance_viewer: {
    label: 'Compliance Viewer',
    description: 'Read-only access to compliance and audit data.',
    permissions: ['compliance:read'],
  },
  benefits_enrollee: {
    label: 'Benefits Self-Service',
    description: 'Can view and manage own benefits enrollment.',
    permissions: ['benefits:read'],
  },
}

/**
 * Resolve effective permissions from a composable role set.
 * Combines abstract role + job roles + duty roles into a single permission set.
 */
export function resolveComposablePermissions(
  abstractRole: string,
  jobRoles: string[] = [],
  dutyRoles: string[] = [],
): Permission[] {
  const perms = new Set<Permission>()

  // Abstract role permissions (with inheritance)
  let current: string | undefined = abstractRole
  while (current) {
    const rolePerms = ROLE_PERMISSIONS[current]
    if (rolePerms) {
      for (const p of rolePerms) perms.add(p)
    }
    current = ABSTRACT_ROLES[current]?.inherits
  }

  // Job role permissions
  for (const jr of jobRoles) {
    const jobRole = JOB_ROLES[jr]
    if (jobRole) {
      for (const p of jobRole.permissions) perms.add(p)
    }
  }

  // Duty role permissions
  for (const dr of dutyRoles) {
    const dutyRole = DUTY_ROLES[dr]
    if (dutyRole) {
      for (const p of dutyRole.permissions) perms.add(p)
    }
  }

  return Array.from(perms)
}

// ── Module access map (for sidebar filtering) ──────────────────────────────

export interface ModuleAccessFlags {
  read: boolean
  write: boolean
  manage: boolean
}

const MODULE_PERMISSION_PREFIXES = [
  'people', 'performance', 'compensation', 'payroll', 'expense', 'leave',
  'benefits', 'time', 'onboarding', 'offboarding', 'finance', 'invoices',
  'budgets', 'it', 'identity', 'recruiting', 'headcount', 'compliance',
  'documents', 'settings', 'workflows', 'analytics', 'admin',
] as const

/**
 * Build a record mapping each module prefix to its read/write/manage flags
 * based on the user's effective permissions.
 */
export function getModuleAccess(
  permissions: Permission[],
): Record<string, ModuleAccessFlags> {
  const result: Record<string, ModuleAccessFlags> = {}
  const permSet = new Set(permissions)

  for (const mod of MODULE_PERMISSION_PREFIXES) {
    result[mod] = {
      read: permSet.has(`${mod}:read` as Permission) ||
            permSet.has(`${mod}:write` as Permission) ||
            permSet.has(`${mod}:manage` as Permission) ||
            permSet.has(`${mod}:admin` as Permission) ||
            permSet.has(`${mod}:submit` as Permission) ||
            permSet.has(`${mod}:approve` as Permission) ||
            permSet.has(`${mod}:run` as Permission) ||
            permSet.has('admin:full'),
      write: permSet.has(`${mod}:write` as Permission) ||
             permSet.has(`${mod}:manage` as Permission) ||
             permSet.has('admin:full'),
      manage: permSet.has(`${mod}:manage` as Permission) ||
              permSet.has(`${mod}:admin` as Permission) ||
              permSet.has('admin:full'),
    }
  }

  return result
}
