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
