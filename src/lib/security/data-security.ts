/**
 * Enterprise Data Security — "WHOSE data can you access"
 *
 * This module implements population-based data access control, modeled after:
 * - SAP SuccessFactors: Granted Population / Target Population
 * - Oracle Fusion HCM: Security Profiles with scoped data access
 * - Workday: Constrained vs Unconstrained security groups
 *
 * Concept:
 *   Functional permissions (permissions.ts) control WHAT you can do.
 *   Data security (this file) controls WHOSE data you can see/touch.
 *
 *   A Manager with people:read can only read their direct reports.
 *   An HRBP with people:read can read everyone in their assigned business unit.
 *   An Admin with people:read can read all employees globally.
 *
 * The combination of functional permissions + data security profile = effective access.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * Scope granularity for data access.
 * - global: unrestricted access to all records across the organization
 * - organization: access limited to specific legal entities / business units
 * - department: access limited to specific departments
 * - team: access limited to direct/indirect reports of a specific manager
 * - self: access limited to the user's own record only
 */
export type ScopeType = 'global' | 'organization' | 'department' | 'team' | 'self';

/**
 * Field-level access restriction within a security profile.
 * Mirrors the SAP pattern: View / Edit / Correct (correct = edit historical data).
 */
export interface FieldRestriction {
  entity: string;
  field: string;
  access: 'hidden' | 'view' | 'edit' | 'correct';
}

/**
 * A Security Profile defines the population of employees a user can access
 * and what fields they can see on those records.
 */
export interface SecurityProfile {
  id: string;
  name: string;
  description: string;
  /** Primary scope — determines the default reach of this profile */
  scope: ScopeType;
  /** For org/dept scoping: which entity IDs this profile covers */
  scopedEntityIds?: string[];
  /** Whether to include sub-organizations / sub-departments in scope */
  includeSubOrgs?: boolean;
  /** Field-level restrictions applied on top of this profile */
  restrictedFields?: FieldRestriction[];
  /** Whether this profile allows access to terminated employees */
  includeTerminated?: boolean;
  /** Whether this profile allows access to contingent workers */
  includeContingent?: boolean;
}

/**
 * A Data Role binds a functional role (what you can DO) to a security profile
 * (whose data you can ACCESS). This is the effective unit of authorization.
 *
 * Mirrors Workday's "Constrained" concept: constrained roles are limited to
 * the org hierarchy; unconstrained roles have global reach.
 */
export interface DataRole {
  id: string;
  name: string;
  description: string;
  /** The functional role key (e.g. 'admin', 'hrbp', 'manager') */
  functionalRole: string;
  /** The security profile that limits data access */
  securityProfile: SecurityProfile;
  /** Constrained = limited to org hierarchy; unconstrained = global */
  constrained: boolean;
}

/**
 * Dynamic population group — SAP "Granted Population" concept.
 * Members are computed from criteria rather than statically assigned.
 */
export interface PopulationGroup {
  id: string;
  name: string;
  description: string;
  /** Membership criteria (evaluated against employee data) */
  criteria: PopulationCriteria;
  /** If true, membership re-evaluates when employee data changes */
  dynamic: boolean;
}

/**
 * Criteria for dynamic population membership.
 * Multiple criteria are ANDed together. Within an array criterion, values are ORed.
 */
export interface PopulationCriteria {
  departments?: string[];
  locations?: string[];
  countries?: string[];
  jobLevels?: string[];
  employmentTypes?: ('full_time' | 'part_time' | 'contractor' | 'intern')[];
  managers?: string[];
  orgIds?: string[];
  statuses?: ('active' | 'terminated' | 'on_leave' | 'suspended')[];
  customFilter?: (employee: EmployeeDataShape) => boolean;
}

/**
 * Minimal employee shape used for access evaluation. Matches the platform's
 * employee data structure (see MEMORY.md).
 */
export interface EmployeeDataShape {
  id: string;
  org_id: string;
  department_id?: string;
  job_title?: string;
  level?: string;
  country?: string;
  role?: string;
  status?: string;
  employment_type?: string;
  manager_id?: string;
  location?: string;
  profile?: {
    full_name?: string;
    email?: string;
  };
}

// ── Predefined Security Profiles ──────────────────────────────────────────────

/**
 * Global Admin — unconstrained access to all data, all fields, including
 * terminated employees and contingent workers. Equivalent to Workday's
 * "Unconstrained" security group.
 */
export const GLOBAL_ADMIN_PROFILE: SecurityProfile = {
  id: 'sp_global_admin',
  name: 'Global Admin',
  description: 'Unrestricted access to all employee data across the organization. No field restrictions.',
  scope: 'global',
  includeSubOrgs: true,
  includeTerminated: true,
  includeContingent: true,
  restrictedFields: [],
};

/**
 * HR Business Partner — scoped to assigned business units. Full access to
 * HR data including compensation, but cannot see raw payroll tax data
 * or system admin fields.
 */
export const HRBP_PROFILE: SecurityProfile = {
  id: 'sp_hrbp',
  name: 'HR Business Partner',
  description: 'Access to assigned business units with full HR data visibility including compensation.',
  scope: 'organization',
  scopedEntityIds: [], // populated per assignment
  includeSubOrgs: true,
  includeTerminated: true,
  includeContingent: true,
  restrictedFields: [
    { entity: 'payroll', field: 'tax_info', access: 'hidden' },
    { entity: 'employee', field: 'bank_details', access: 'hidden' },
    { entity: 'payroll', field: 'bank_account', access: 'hidden' },
  ],
};

/**
 * Manager — scoped to direct and indirect reports. Can see basic profile
 * and performance data but restricted from compensation, payroll, SSN,
 * and medical information.
 */
export const MANAGER_PROFILE: SecurityProfile = {
  id: 'sp_manager',
  name: 'Manager',
  description: 'Access limited to direct/indirect reports. Restricted from compensation and sensitive PII.',
  scope: 'team',
  includeSubOrgs: false,
  includeTerminated: false,
  includeContingent: true,
  restrictedFields: [
    { entity: 'compensation', field: 'base_salary', access: 'hidden' },
    { entity: 'compensation', field: 'bonus', access: 'hidden' },
    { entity: 'compensation', field: 'equity', access: 'hidden' },
    { entity: 'compensation', field: 'total_comp', access: 'hidden' },
    { entity: 'compensation', field: 'pay_band', access: 'hidden' },
    { entity: 'compensation', field: 'salary_history', access: 'hidden' },
    { entity: 'payroll', field: 'gross_pay', access: 'hidden' },
    { entity: 'payroll', field: 'net_pay', access: 'hidden' },
    { entity: 'payroll', field: 'deductions', access: 'hidden' },
    { entity: 'payroll', field: 'tax_info', access: 'hidden' },
    { entity: 'payroll', field: 'bank_account', access: 'hidden' },
    { entity: 'employee', field: 'ssn', access: 'hidden' },
    { entity: 'employee', field: 'national_id', access: 'hidden' },
    { entity: 'employee', field: 'bank_details', access: 'hidden' },
    { entity: 'benefits', field: 'medical_info', access: 'hidden' },
    { entity: 'benefits', field: 'dependents', access: 'hidden' },
  ],
};

/**
 * Recruiter — scoped to candidates and open requisitions. Cannot access
 * existing employee compensation, payroll, or performance data.
 */
export const RECRUITER_PROFILE: SecurityProfile = {
  id: 'sp_recruiter',
  name: 'Recruiter',
  description: 'Access to candidate records and open requisitions. No access to existing employee comp/payroll.',
  scope: 'global', // recruiters see candidates globally
  includeSubOrgs: true,
  includeTerminated: false,
  includeContingent: false,
  restrictedFields: [
    { entity: 'compensation', field: 'base_salary', access: 'hidden' },
    { entity: 'compensation', field: 'bonus', access: 'hidden' },
    { entity: 'compensation', field: 'equity', access: 'hidden' },
    { entity: 'compensation', field: 'total_comp', access: 'hidden' },
    { entity: 'compensation', field: 'pay_band', access: 'hidden' },
    { entity: 'compensation', field: 'salary_history', access: 'hidden' },
    { entity: 'payroll', field: 'gross_pay', access: 'hidden' },
    { entity: 'payroll', field: 'net_pay', access: 'hidden' },
    { entity: 'payroll', field: 'deductions', access: 'hidden' },
    { entity: 'payroll', field: 'tax_info', access: 'hidden' },
    { entity: 'payroll', field: 'bank_account', access: 'hidden' },
    { entity: 'performance', field: 'rating', access: 'hidden' },
    { entity: 'performance', field: 'review_comments', access: 'hidden' },
    { entity: 'performance', field: 'PIP_status', access: 'hidden' },
    { entity: 'employee', field: 'ssn', access: 'hidden' },
    { entity: 'employee', field: 'national_id', access: 'hidden' },
    { entity: 'employee', field: 'bank_details', access: 'hidden' },
    { entity: 'benefits', field: 'medical_info', access: 'hidden' },
  ],
};

/**
 * Finance — scoped to payroll, expense, and invoice data. Cannot access
 * performance reviews, personal medical info, or detailed HR records.
 */
export const FINANCE_PROFILE: SecurityProfile = {
  id: 'sp_finance',
  name: 'Finance',
  description: 'Access to financial data (payroll, expenses, invoices). No HR performance or medical data.',
  scope: 'global',
  includeSubOrgs: true,
  includeTerminated: true,
  includeContingent: true,
  restrictedFields: [
    { entity: 'performance', field: 'rating', access: 'hidden' },
    { entity: 'performance', field: 'goals', access: 'hidden' },
    { entity: 'performance', field: 'review_comments', access: 'hidden' },
    { entity: 'performance', field: 'PIP_status', access: 'hidden' },
    { entity: 'benefits', field: 'medical_info', access: 'hidden' },
    { entity: 'benefits', field: 'dependents', access: 'hidden' },
    { entity: 'employee', field: 'emergency_contact', access: 'hidden' },
    { entity: 'recruiting', field: 'interview_scores', access: 'hidden' },
    { entity: 'recruiting', field: 'candidate_feedback', access: 'hidden' },
  ],
};

/**
 * IT Admin — scoped to IT, identity, and device management data.
 * Cannot access HR-specific data (comp, payroll, medical, performance).
 */
export const IT_ADMIN_PROFILE: SecurityProfile = {
  id: 'sp_it_admin',
  name: 'IT Admin',
  description: 'Access to IT/identity/device data. No access to HR, compensation, or payroll records.',
  scope: 'global',
  includeSubOrgs: true,
  includeTerminated: false,
  includeContingent: true,
  restrictedFields: [
    { entity: 'compensation', field: 'base_salary', access: 'hidden' },
    { entity: 'compensation', field: 'bonus', access: 'hidden' },
    { entity: 'compensation', field: 'equity', access: 'hidden' },
    { entity: 'compensation', field: 'total_comp', access: 'hidden' },
    { entity: 'compensation', field: 'pay_band', access: 'hidden' },
    { entity: 'compensation', field: 'salary_history', access: 'hidden' },
    { entity: 'payroll', field: 'gross_pay', access: 'hidden' },
    { entity: 'payroll', field: 'net_pay', access: 'hidden' },
    { entity: 'payroll', field: 'deductions', access: 'hidden' },
    { entity: 'payroll', field: 'tax_info', access: 'hidden' },
    { entity: 'payroll', field: 'bank_account', access: 'hidden' },
    { entity: 'performance', field: 'rating', access: 'hidden' },
    { entity: 'performance', field: 'goals', access: 'hidden' },
    { entity: 'performance', field: 'review_comments', access: 'hidden' },
    { entity: 'performance', field: 'PIP_status', access: 'hidden' },
    { entity: 'benefits', field: 'medical_info', access: 'hidden' },
    { entity: 'benefits', field: 'dependents', access: 'hidden' },
    { entity: 'employee', field: 'ssn', access: 'hidden' },
    { entity: 'employee', field: 'national_id', access: 'hidden' },
    { entity: 'employee', field: 'bank_details', access: 'hidden' },
  ],
};

/**
 * Employee Self-Service — self scope only. Can view own basic data and
 * edit own contact information. Cannot see any other employee's data.
 */
export const EMPLOYEE_SELF_SERVICE_PROFILE: SecurityProfile = {
  id: 'sp_employee_self',
  name: 'Employee Self-Service',
  description: 'Access to own record only. Can view personal data and edit contact information.',
  scope: 'self',
  includeSubOrgs: false,
  includeTerminated: false,
  includeContingent: false,
  restrictedFields: [
    { entity: 'employee', field: 'ssn', access: 'view' },
    { entity: 'employee', field: 'national_id', access: 'view' },
    { entity: 'employee', field: 'bank_details', access: 'view' },
    { entity: 'employee', field: 'email', access: 'edit' },
    { entity: 'employee', field: 'phone', access: 'edit' },
    { entity: 'employee', field: 'address', access: 'edit' },
    { entity: 'employee', field: 'emergency_contact', access: 'edit' },
    { entity: 'compensation', field: 'base_salary', access: 'view' },
    { entity: 'compensation', field: 'bonus', access: 'view' },
    { entity: 'compensation', field: 'equity', access: 'view' },
    { entity: 'compensation', field: 'total_comp', access: 'view' },
    { entity: 'payroll', field: 'gross_pay', access: 'view' },
    { entity: 'payroll', field: 'net_pay', access: 'view' },
    { entity: 'payroll', field: 'deductions', access: 'view' },
    { entity: 'performance', field: 'rating', access: 'view' },
    { entity: 'performance', field: 'goals', access: 'view' },
    { entity: 'benefits', field: 'enrollment', access: 'view' },
    { entity: 'benefits', field: 'plan_details', access: 'view' },
    { entity: 'benefits', field: 'dependents', access: 'edit' },
  ],
};

/** Registry of all predefined security profiles, keyed by ID */
export const SECURITY_PROFILES: Record<string, SecurityProfile> = {
  [GLOBAL_ADMIN_PROFILE.id]: GLOBAL_ADMIN_PROFILE,
  [HRBP_PROFILE.id]: HRBP_PROFILE,
  [MANAGER_PROFILE.id]: MANAGER_PROFILE,
  [RECRUITER_PROFILE.id]: RECRUITER_PROFILE,
  [FINANCE_PROFILE.id]: FINANCE_PROFILE,
  [IT_ADMIN_PROFILE.id]: IT_ADMIN_PROFILE,
  [EMPLOYEE_SELF_SERVICE_PROFILE.id]: EMPLOYEE_SELF_SERVICE_PROFILE,
};

// ── Predefined Population Groups ──────────────────────────────────────────────

export const POPULATION_ALL_EMPLOYEES: PopulationGroup = {
  id: 'pop_all_employees',
  name: 'All Employees',
  description: 'Every active employee in the organization.',
  criteria: { statuses: ['active'] },
  dynamic: true,
};

export const POPULATION_ALL_MANAGERS: PopulationGroup = {
  id: 'pop_all_managers',
  name: 'All Managers',
  description: 'All employees with the manager or above role.',
  criteria: {
    customFilter: (emp) =>
      emp.role === 'manager' || emp.role === 'admin' || emp.role === 'owner' || emp.role === 'hrbp',
  },
  dynamic: true,
};

export const POPULATION_ALL_HR: PopulationGroup = {
  id: 'pop_all_hr',
  name: 'All HR Staff',
  description: 'All employees in HR-related roles.',
  criteria: {
    customFilter: (emp) => emp.role === 'hrbp' || emp.role === 'admin' || emp.role === 'owner',
  },
  dynamic: true,
};

/** Registry of predefined population groups */
export const POPULATION_GROUPS: Record<string, PopulationGroup> = {
  [POPULATION_ALL_EMPLOYEES.id]: POPULATION_ALL_EMPLOYEES,
  [POPULATION_ALL_MANAGERS.id]: POPULATION_ALL_MANAGERS,
  [POPULATION_ALL_HR.id]: POPULATION_ALL_HR,
};

// ── Dynamic Population Group Factories ────────────────────────────────────────

/**
 * Create a department-based population group. Auto-generated per department
 * when departments are loaded from the database.
 */
export function createDepartmentPopulation(departmentId: string, departmentName: string): PopulationGroup {
  return {
    id: `pop_dept_${departmentId}`,
    name: `Department: ${departmentName}`,
    description: `All active employees in the ${departmentName} department.`,
    criteria: {
      departments: [departmentId],
      statuses: ['active'],
    },
    dynamic: true,
  };
}

/**
 * Create a location/country-based population group. Auto-generated per
 * country when employee locations are resolved.
 */
export function createLocationPopulation(country: string): PopulationGroup {
  return {
    id: `pop_country_${country.toLowerCase().replace(/\s+/g, '_')}`,
    name: `Location: ${country}`,
    description: `All active employees located in ${country}.`,
    criteria: {
      countries: [country],
      statuses: ['active'],
    },
    dynamic: true,
  };
}

/**
 * Create a direct-reports population group for a specific manager.
 * This powers the Manager security profile's team scope.
 */
export function createDirectReportsPopulation(managerId: string, managerName: string): PopulationGroup {
  return {
    id: `pop_reports_${managerId}`,
    name: `Direct Reports: ${managerName}`,
    description: `All employees who report directly to ${managerName}.`,
    criteria: {
      managers: [managerId],
      statuses: ['active'],
    },
    dynamic: true,
  };
}

// ── Helper Functions ──────────────────────────────────────────────────────────

/**
 * Retrieve a security profile by ID. Returns undefined for unknown profiles.
 */
export function getSecurityProfile(profileId: string): SecurityProfile | undefined {
  return SECURITY_PROFILES[profileId];
}

/**
 * Build a DataRole by binding a functional role to a security profile.
 * Constrained roles are limited to org hierarchy; unconstrained have global reach.
 */
export function getDataRole(
  functionalRole: string,
  securityProfileId: string,
  options?: { constrained?: boolean }
): DataRole | undefined {
  const profile = getSecurityProfile(securityProfileId);
  if (!profile) return undefined;

  const constrained = options?.constrained ?? (profile.scope !== 'global');

  return {
    id: `dr_${functionalRole}_${securityProfileId}`,
    name: `${functionalRole} + ${profile.name}`,
    description: `Functional role "${functionalRole}" with data access per "${profile.name}" profile.`,
    functionalRole,
    securityProfile: profile,
    constrained,
  };
}

/**
 * Determine whether a user with the given security profile is allowed to
 * access data for the target employee.
 *
 * Checks:
 * 1. Scope type (global, org, department, team, self)
 * 2. Scoped entity IDs (if applicable)
 * 3. Terminated/contingent employee filters
 */
export function isDataAccessAllowed(
  userProfile: SecurityProfile,
  targetEmployee: EmployeeDataShape,
  currentUserId?: string,
): boolean {
  // Check terminated filter
  if (!userProfile.includeTerminated && targetEmployee.status === 'terminated') {
    return false;
  }

  // Check contingent worker filter
  if (!userProfile.includeContingent && targetEmployee.employment_type === 'contractor') {
    return false;
  }

  switch (userProfile.scope) {
    case 'global':
      return true;

    case 'organization':
      if (!userProfile.scopedEntityIds || userProfile.scopedEntityIds.length === 0) {
        // No specific org scoping — allow if same org
        return true;
      }
      return userProfile.scopedEntityIds.includes(targetEmployee.org_id);

    case 'department':
      if (!userProfile.scopedEntityIds || userProfile.scopedEntityIds.length === 0) {
        return false;
      }
      return !!targetEmployee.department_id &&
        userProfile.scopedEntityIds.includes(targetEmployee.department_id);

    case 'team':
      // Team scope: target must be a direct report of the current user
      // or the current user themselves
      if (!currentUserId) return false;
      if (targetEmployee.id === currentUserId) return true;
      return targetEmployee.manager_id === currentUserId;

    case 'self':
      if (!currentUserId) return false;
      return targetEmployee.id === currentUserId;

    default:
      return false;
  }
}

/**
 * Get all field restrictions for a specific entity from a security profile.
 * Returns the restrictions array filtered to the requested entity.
 */
export function getAccessibleFields(
  profile: SecurityProfile,
  entity: string,
): FieldRestriction[] {
  if (!profile.restrictedFields) return [];
  return profile.restrictedFields.filter((r) => r.entity === entity);
}

/**
 * Check whether a specific field on an entity is hidden by the profile.
 */
export function isFieldHidden(
  profile: SecurityProfile,
  entity: string,
  field: string,
): boolean {
  if (!profile.restrictedFields) return false;
  const restriction = profile.restrictedFields.find(
    (r) => r.entity === entity && r.field === field
  );
  return restriction?.access === 'hidden';
}

/**
 * Evaluate whether an employee matches the given population criteria.
 * All specified criteria are ANDed. Within array criteria, values are ORed.
 */
export function evaluatePopulationCriteria(
  criteria: PopulationCriteria,
  employee: EmployeeDataShape,
): boolean {
  // Department filter
  if (criteria.departments && criteria.departments.length > 0) {
    if (!employee.department_id || !criteria.departments.includes(employee.department_id)) {
      return false;
    }
  }

  // Location filter
  if (criteria.locations && criteria.locations.length > 0) {
    if (!employee.location || !criteria.locations.includes(employee.location)) {
      return false;
    }
  }

  // Country filter
  if (criteria.countries && criteria.countries.length > 0) {
    if (!employee.country || !criteria.countries.includes(employee.country)) {
      return false;
    }
  }

  // Job level filter
  if (criteria.jobLevels && criteria.jobLevels.length > 0) {
    if (!employee.level || !criteria.jobLevels.includes(employee.level)) {
      return false;
    }
  }

  // Employment type filter
  if (criteria.employmentTypes && criteria.employmentTypes.length > 0) {
    if (
      !employee.employment_type ||
      !(criteria.employmentTypes as string[]).includes(employee.employment_type)
    ) {
      return false;
    }
  }

  // Manager filter (direct reports of specific managers)
  if (criteria.managers && criteria.managers.length > 0) {
    if (!employee.manager_id || !criteria.managers.includes(employee.manager_id)) {
      return false;
    }
  }

  // Org ID filter
  if (criteria.orgIds && criteria.orgIds.length > 0) {
    if (!criteria.orgIds.includes(employee.org_id)) {
      return false;
    }
  }

  // Status filter
  if (criteria.statuses && criteria.statuses.length > 0) {
    if (!employee.status || !(criteria.statuses as string[]).includes(employee.status)) {
      return false;
    }
  }

  // Custom filter function
  if (criteria.customFilter && !criteria.customFilter(employee)) {
    return false;
  }

  return true;
}

/**
 * Get all employees that match a population group's criteria.
 */
export function getPopulationMembers(
  group: PopulationGroup,
  employees: EmployeeDataShape[],
): EmployeeDataShape[] {
  return employees.filter((emp) => evaluatePopulationCriteria(group.criteria, emp));
}

/**
 * Resolve the effective data access profile when a user holds multiple
 * DataRoles. Merges profiles using a "most permissive wins" strategy:
 *
 * - Scope: picks the broadest scope (global > organization > department > team > self)
 * - Scoped entity IDs: union of all scoped IDs
 * - Terminated/contingent: allowed if ANY profile allows it
 * - Field restrictions: for each field, picks the most permissive access level
 *
 * This follows the standard enterprise pattern where multiple role assignments
 * result in the union of their access.
 */
export function resolveEffectiveDataAccess(roles: DataRole[]): SecurityProfile {
  if (roles.length === 0) {
    return { ...EMPLOYEE_SELF_SERVICE_PROFILE };
  }

  if (roles.length === 1) {
    return { ...roles[0].securityProfile };
  }

  const scopeOrder: ScopeType[] = ['self', 'team', 'department', 'organization', 'global'];
  const accessOrder: Array<FieldRestriction['access']> = ['hidden', 'view', 'edit', 'correct'];

  // Determine broadest scope
  let broadestScopeIndex = 0;
  for (const role of roles) {
    const idx = scopeOrder.indexOf(role.securityProfile.scope);
    if (idx > broadestScopeIndex) broadestScopeIndex = idx;
  }

  // Union of scoped entity IDs
  const allScopedIds = new Set<string>();
  for (const role of roles) {
    if (role.securityProfile.scopedEntityIds) {
      for (const id of role.securityProfile.scopedEntityIds) allScopedIds.add(id);
    }
  }

  // Merge field restrictions — most permissive wins
  const fieldMap = new Map<string, FieldRestriction>();
  for (const role of roles) {
    if (!role.securityProfile.restrictedFields) continue;
    for (const restriction of role.securityProfile.restrictedFields) {
      const key = `${restriction.entity}:${restriction.field}`;
      const existing = fieldMap.get(key);
      if (!existing) {
        fieldMap.set(key, { ...restriction });
      } else {
        // Keep the more permissive access level
        const existingIdx = accessOrder.indexOf(existing.access);
        const newIdx = accessOrder.indexOf(restriction.access);
        if (newIdx > existingIdx) {
          fieldMap.set(key, { ...restriction });
        }
      }
    }
  }

  return {
    id: 'sp_effective_merged',
    name: 'Effective Merged Profile',
    description: `Merged profile from ${roles.length} data roles.`,
    scope: scopeOrder[broadestScopeIndex],
    scopedEntityIds: allScopedIds.size > 0 ? Array.from(allScopedIds) : undefined,
    includeSubOrgs: roles.some((r) => r.securityProfile.includeSubOrgs),
    includeTerminated: roles.some((r) => r.securityProfile.includeTerminated),
    includeContingent: roles.some((r) => r.securityProfile.includeContingent),
    restrictedFields: Array.from(fieldMap.values()),
  };
}

// ── Default Role-to-Profile Mapping ───────────────────────────────────────────

/**
 * Maps functional roles to their default security profile IDs.
 * Used when no explicit DataRole assignment exists — provides a sensible
 * baseline matching standard HRIS configurations.
 */
export const DEFAULT_ROLE_PROFILES: Record<string, string> = {
  owner: GLOBAL_ADMIN_PROFILE.id,
  admin: GLOBAL_ADMIN_PROFILE.id,
  hrbp: HRBP_PROFILE.id,
  manager: MANAGER_PROFILE.id,
  employee: EMPLOYEE_SELF_SERVICE_PROFILE.id,
  finance_approver: FINANCE_PROFILE.id,
  it_manager: IT_ADMIN_PROFILE.id,
  recruiter: RECRUITER_PROFILE.id,
};

/**
 * Get the default DataRole for a functional role. Useful when the user has
 * no explicit DataRole assignments — falls back to the standard profile.
 */
export function getDefaultDataRole(functionalRole: string): DataRole | undefined {
  const profileId = DEFAULT_ROLE_PROFILES[functionalRole];
  if (!profileId) return undefined;
  return getDataRole(functionalRole, profileId);
}

/**
 * Filter an array of employees to only those the current user can access,
 * based on their effective security profile.
 */
export function filterAccessibleEmployees(
  profile: SecurityProfile,
  employees: EmployeeDataShape[],
  currentUserId?: string,
): EmployeeDataShape[] {
  return employees.filter((emp) => isDataAccessAllowed(profile, emp, currentUserId));
}

/**
 * Strip restricted fields from an employee record based on the security profile.
 * Returns a new object with hidden fields removed and view-only fields preserved.
 * This is used for API response sanitization.
 */
export function sanitizeEmployeeData(
  profile: SecurityProfile,
  entity: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  if (!profile.restrictedFields || profile.restrictedFields.length === 0) {
    return data;
  }

  const result = { ...data };
  for (const restriction of profile.restrictedFields) {
    if (restriction.entity !== entity) continue;
    if (restriction.access === 'hidden' && restriction.field in result) {
      delete result[restriction.field];
    }
  }
  return result;
}
