/**
 * Custom Roles — Admin-Creatable Role Definitions
 *
 * Follows the enterprise HRIS pattern where administrators can create
 * custom roles by cloning a base role and modifying its permissions.
 *
 * Modeled after:
 * - Oracle Fusion: "Copy and Modify" role creation
 * - SAP SuccessFactors: Permission Role builder
 * - Workday: Configurable Security Groups
 *
 * Custom roles support:
 * - Inheriting from a base (system) role
 * - Granting additional permissions
 * - Denying specific permissions (override base)
 * - Binding to a data security profile
 * - Field-level permission overrides
 *
 * Usage:
 *   const role = createCustomRole({ name: 'Payroll Specialist', baseRole: 'employee', ... })
 *   const resolved = resolveCustomRole(role)  // computes effective permissions
 */

import type { FieldAccess } from './field-permissions'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CustomRole {
  id: string;
  /** Organization that owns this custom role */
  orgId: string;
  /** Display name (must be unique within org) */
  name: string;
  /** Description of the role's purpose */
  description: string;
  /** Base system role to inherit from (Oracle "copy and modify" pattern) */
  baseRole?: string;
  /** Permissions granted in addition to the base role */
  grantedPermissions: string[];
  /** Permissions explicitly denied (overrides base role grants) */
  deniedPermissions: string[];
  /** ID of the data security profile bound to this role */
  securityProfileId: string;
  /** Per-entity, per-field access overrides (layered on top of defaults) */
  fieldPermissionOverrides?: Record<string, Record<string, FieldAccess>>;
  /** Whether this is a system-defined role (cannot be deleted by admins) */
  isSystem: boolean;
  /** ISO 8601 creation timestamp */
  createdAt: string;
  /** User who created this role */
  createdBy: string;
  /** ISO 8601 last-update timestamp */
  updatedAt: string;
}

export interface CreateCustomRoleInput {
  orgId: string;
  name: string;
  description: string;
  baseRole?: string;
  grantedPermissions?: string[];
  deniedPermissions?: string[];
  securityProfileId: string;
  fieldPermissionOverrides?: Record<string, Record<string, FieldAccess>>;
  createdBy: string;
}

export interface UpdateCustomRoleInput {
  name?: string;
  description?: string;
  grantedPermissions?: string[];
  deniedPermissions?: string[];
  securityProfileId?: string;
  fieldPermissionOverrides?: Record<string, Record<string, FieldAccess>>;
}

export interface ResolvedRole {
  /** The custom role ID */
  roleId: string;
  /** Effective permissions after inheritance + grants - denials */
  effectivePermissions: string[];
  /** Security profile ID */
  securityProfileId: string;
  /** Effective field overrides */
  fieldPermissionOverrides: Record<string, Record<string, FieldAccess>>;
}

export interface CustomRoleValidationError {
  code: string;
  message: string;
}

// ── In-Memory Store ───────────────────────────────────────────────────────────

let roleStore: CustomRole[] = [];
let roleIdCounter = 1;

function generateRoleId(): string {
  return `cr_${Date.now()}_${roleIdCounter++}`;
}

// ── Pre-Built Role Templates ──────────────────────────────────────────────────

/**
 * Templates for commonly needed custom roles. Admins can use these as
 * starting points via cloneRole().
 */
export const ROLE_TEMPLATES: Record<string, Omit<CreateCustomRoleInput, 'orgId' | 'createdBy'>> = {
  department_head: {
    name: 'Department Head',
    description: 'Department-level authority with hiring, budget, and performance management permissions.',
    baseRole: 'manager',
    grantedPermissions: [
      'headcount:read', 'headcount:write',
      'budgets:read', 'budgets:write',
      'compensation:read',
      'recruiting:read', 'recruiting:write',
      'onboarding:read', 'onboarding:manage',
      'offboarding:read',
    ],
    deniedPermissions: [],
    securityProfileId: 'sp_manager',
  },

  regional_hr: {
    name: 'Regional HR',
    description: 'HR business partner scoped to a specific region or country.',
    baseRole: 'hrbp',
    grantedPermissions: [],
    deniedPermissions: [
      'compliance:manage',
      'settings:manage',
    ],
    securityProfileId: 'sp_hrbp',
  },

  payroll_specialist: {
    name: 'Payroll Specialist',
    description: 'Payroll processing and reporting without broader HR access.',
    baseRole: 'employee',
    grantedPermissions: [
      'payroll:read', 'payroll:run',
      'compensation:read',
      'people:read',
      'finance:read',
      'analytics:read',
    ],
    deniedPermissions: [],
    securityProfileId: 'sp_finance',
  },

  benefits_admin: {
    name: 'Benefits Administrator',
    description: 'Manages employee benefits enrollment, plans, and compliance.',
    baseRole: 'employee',
    grantedPermissions: [
      'benefits:read', 'benefits:manage',
      'people:read',
      'compliance:read',
      'analytics:read',
    ],
    deniedPermissions: [],
    securityProfileId: 'sp_hrbp',
  },

  compliance_officer: {
    name: 'Compliance Officer',
    description: 'Read-only access to compliance, audit, and regulatory data across all modules.',
    baseRole: 'employee',
    grantedPermissions: [
      'compliance:read', 'compliance:manage',
      'people:read',
      'payroll:read',
      'finance:read',
      'benefits:read',
      'analytics:read',
      'documents:read',
    ],
    deniedPermissions: [],
    securityProfileId: 'sp_global_admin',
  },

  external_auditor: {
    name: 'External Auditor (Read-Only)',
    description: 'Strictly read-only access for external audit firms. Time-limited.',
    baseRole: 'employee',
    grantedPermissions: [
      'compliance:read',
      'payroll:read',
      'finance:read',
      'people:read',
      'analytics:read',
      'documents:read',
    ],
    deniedPermissions: [
      'expense:submit',
      'leave:submit',
    ],
    securityProfileId: 'sp_finance',
  },
};

// ── Validation ────────────────────────────────────────────────────────────────

/**
 * Validate a custom role definition.
 * Returns an array of errors (empty = valid).
 */
export function validateCustomRole(
  input: CreateCustomRoleInput,
  creatorPermissions?: string[],
): CustomRoleValidationError[] {
  const errors: CustomRoleValidationError[] = [];

  // Name is required
  if (!input.name || input.name.trim().length === 0) {
    errors.push({ code: 'NAME_REQUIRED', message: 'Role name is required.' });
  }

  // Name length
  if (input.name && input.name.length > 100) {
    errors.push({ code: 'NAME_TOO_LONG', message: 'Role name must be 100 characters or fewer.' });
  }

  // Name uniqueness within org
  const existing = roleStore.find(
    (r) => r.orgId === input.orgId && r.name.toLowerCase() === input.name.toLowerCase(),
  );
  if (existing) {
    errors.push({
      code: 'NAME_NOT_UNIQUE',
      message: `A role named "${input.name}" already exists in this organization.`,
    });
  }

  // Description is required
  if (!input.description || input.description.trim().length === 0) {
    errors.push({ code: 'DESCRIPTION_REQUIRED', message: 'Role description is required.' });
  }

  // Security profile is required
  if (!input.securityProfileId) {
    errors.push({
      code: 'SECURITY_PROFILE_REQUIRED',
      message: 'A data security profile must be assigned to the role.',
    });
  }

  // Cannot grant permissions the creator doesn't have (escalation prevention)
  if (creatorPermissions && input.grantedPermissions) {
    const creatorSet = new Set(creatorPermissions);
    for (const perm of input.grantedPermissions) {
      if (!creatorSet.has(perm) && !creatorSet.has('admin:full')) {
        errors.push({
          code: 'PERMISSION_ESCALATION',
          message: `Cannot grant permission "${perm}" — you do not have this permission yourself.`,
        });
      }
    }
  }

  // Cannot deny a permission that isn't in the base role (harmless but noisy)
  // This is a warning-level check; we don't block on it.

  return errors;
}

// ── CRUD Operations ───────────────────────────────────────────────────────────

/**
 * Create a new custom role. Validates before creation.
 */
export function createCustomRole(
  input: CreateCustomRoleInput,
  creatorPermissions?: string[],
): { role?: CustomRole; errors?: CustomRoleValidationError[] } {
  const errors = validateCustomRole(input, creatorPermissions);
  if (errors.length > 0) {
    return { errors };
  }

  const now = new Date().toISOString();
  const role: CustomRole = {
    id: generateRoleId(),
    orgId: input.orgId,
    name: input.name.trim(),
    description: input.description.trim(),
    baseRole: input.baseRole,
    grantedPermissions: input.grantedPermissions ?? [],
    deniedPermissions: input.deniedPermissions ?? [],
    securityProfileId: input.securityProfileId,
    fieldPermissionOverrides: input.fieldPermissionOverrides,
    isSystem: false,
    createdAt: now,
    createdBy: input.createdBy,
    updatedAt: now,
  };

  roleStore.push(role);
  return { role };
}

/**
 * Update an existing custom role. System roles cannot be updated.
 */
export function updateCustomRole(
  roleId: string,
  updates: UpdateCustomRoleInput,
): { role?: CustomRole; error?: string } {
  const role = roleStore.find((r) => r.id === roleId);
  if (!role) {
    return { error: `Custom role "${roleId}" not found.` };
  }

  if (role.isSystem) {
    return { error: 'System roles cannot be modified.' };
  }

  if (updates.name !== undefined) {
    // Check uniqueness
    const existing = roleStore.find(
      (r) => r.id !== roleId && r.orgId === role.orgId && r.name.toLowerCase() === updates.name!.toLowerCase(),
    );
    if (existing) {
      return { error: `A role named "${updates.name}" already exists in this organization.` };
    }
    role.name = updates.name.trim();
  }

  if (updates.description !== undefined) role.description = updates.description.trim();
  if (updates.grantedPermissions !== undefined) role.grantedPermissions = updates.grantedPermissions;
  if (updates.deniedPermissions !== undefined) role.deniedPermissions = updates.deniedPermissions;
  if (updates.securityProfileId !== undefined) role.securityProfileId = updates.securityProfileId;
  if (updates.fieldPermissionOverrides !== undefined) role.fieldPermissionOverrides = updates.fieldPermissionOverrides;

  role.updatedAt = new Date().toISOString();

  return { role };
}

/**
 * Delete a custom role. System roles cannot be deleted.
 */
export function deleteCustomRole(roleId: string): { success: boolean; error?: string } {
  const index = roleStore.findIndex((r) => r.id === roleId);
  if (index === -1) {
    return { success: false, error: `Custom role "${roleId}" not found.` };
  }

  if (roleStore[index].isSystem) {
    return { success: false, error: 'System roles cannot be deleted.' };
  }

  roleStore.splice(index, 1);
  return { success: true };
}

/**
 * Get all custom roles for an organization.
 */
export function getCustomRoles(orgId: string): CustomRole[] {
  return roleStore.filter((r) => r.orgId === orgId);
}

/**
 * Get a specific custom role by ID.
 */
export function getCustomRole(roleId: string): CustomRole | undefined {
  return roleStore.find((r) => r.id === roleId);
}

// ── Resolution ────────────────────────────────────────────────────────────────

/**
 * Resolve a custom role's effective permissions by applying inheritance.
 *
 * Algorithm:
 * 1. Start with the base role's permissions (if any)
 * 2. Add granted permissions (union)
 * 3. Remove denied permissions (subtract)
 *
 * This follows Oracle's "Copy and Modify" pattern.
 */
export function resolveCustomRole(
  role: CustomRole,
  baseRolePermissions?: string[],
): ResolvedRole {
  // Start with base role permissions
  const permSet = new Set<string>(baseRolePermissions ?? []);

  // Add granted permissions
  for (const perm of role.grantedPermissions) {
    permSet.add(perm);
  }

  // Remove denied permissions
  for (const perm of role.deniedPermissions) {
    permSet.delete(perm);
  }

  return {
    roleId: role.id,
    effectivePermissions: Array.from(permSet),
    securityProfileId: role.securityProfileId,
    fieldPermissionOverrides: role.fieldPermissionOverrides ?? {},
  };
}

/**
 * Clone an existing custom role or template to create a new one.
 * The clone gets a new ID and name suffix.
 */
export function cloneRole(
  sourceRoleId: string,
  orgId: string,
  createdBy: string,
  newName?: string,
): { role?: CustomRole; error?: string } {
  const source = roleStore.find((r) => r.id === sourceRoleId);
  if (!source) {
    return { error: `Source role "${sourceRoleId}" not found.` };
  }

  const name = newName ?? `${source.name} (Copy)`;

  // Check uniqueness
  const existing = roleStore.find(
    (r) => r.orgId === orgId && r.name.toLowerCase() === name.toLowerCase(),
  );
  if (existing) {
    return { error: `A role named "${name}" already exists in this organization.` };
  }

  const now = new Date().toISOString();
  const clone: CustomRole = {
    id: generateRoleId(),
    orgId,
    name,
    description: source.description,
    baseRole: source.baseRole,
    grantedPermissions: [...source.grantedPermissions],
    deniedPermissions: [...source.deniedPermissions],
    securityProfileId: source.securityProfileId,
    fieldPermissionOverrides: source.fieldPermissionOverrides
      ? JSON.parse(JSON.stringify(source.fieldPermissionOverrides))
      : undefined,
    isSystem: false,
    createdAt: now,
    createdBy,
    updatedAt: now,
  };

  roleStore.push(clone);
  return { role: clone };
}

/**
 * Create a custom role from a predefined template.
 */
export function createFromTemplate(
  templateKey: string,
  orgId: string,
  createdBy: string,
  overrides?: Partial<CreateCustomRoleInput>,
): { role?: CustomRole; errors?: CustomRoleValidationError[]; error?: string } {
  const template = ROLE_TEMPLATES[templateKey];
  if (!template) {
    return { error: `Template "${templateKey}" not found. Available: ${Object.keys(ROLE_TEMPLATES).join(', ')}` };
  }

  const input: CreateCustomRoleInput = {
    orgId,
    createdBy,
    name: overrides?.name ?? template.name,
    description: overrides?.description ?? template.description,
    baseRole: overrides?.baseRole ?? template.baseRole,
    grantedPermissions: overrides?.grantedPermissions ?? template.grantedPermissions,
    deniedPermissions: overrides?.deniedPermissions ?? template.deniedPermissions,
    securityProfileId: overrides?.securityProfileId ?? template.securityProfileId,
    fieldPermissionOverrides: overrides?.fieldPermissionOverrides,
  };

  return createCustomRole(input);
}

/**
 * Get all available template keys and their descriptions.
 */
export function getAvailableTemplates(): Array<{ key: string; name: string; description: string }> {
  return Object.entries(ROLE_TEMPLATES).map(([key, tmpl]) => ({
    key,
    name: tmpl.name,
    description: tmpl.description,
  }));
}

/**
 * Clear the role store. Used for testing.
 */
export function clearCustomRoleStore(): void {
  roleStore = [];
  roleIdCounter = 1;
}
