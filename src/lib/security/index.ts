/**
 * Security utilities barrel export.
 */

export {
  checkRateLimit,
  resetRateLimit,
  clearAllRateLimits,
  DEFAULT_RATE_LIMIT,
  AUTH_RATE_LIMIT,
} from './rate-limiter'

export {
  sanitizeInput,
  sanitizeObject,
  validateEmail,
  validateURL,
  escapeSQL,
} from './sanitize'

export {
  generateCsrfToken,
  verifyCsrfToken,
  validateCsrfToken,
  rotateCsrfToken,
  CSRF_COOKIE,
  CSRF_HEADER,
} from './csrf'

export {
  withApiGuard,
  type GuardContext,
  type GuardOptions,
} from './api-guard'

export {
  type Permission,
  ROLE_PERMISSIONS,
  CAPABILITY_PERMISSIONS,
  ROLE_LABELS,
  CAPABILITY_LABELS,
  ALL_ROLES,
  ALL_CAPABILITIES,
  getPermissionsForRole,
  getPermissionsForRoles,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getModuleAccess,
  type ModuleAccessFlags,
  ROLE_HIERARCHY,
  isRoleHigherThan,
  getRoleRank,
  ABSTRACT_ROLES,
  JOB_ROLES,
  DUTY_ROLES,
  resolveComposablePermissions,
} from './permissions'

export {
  ROUTE_PERMISSIONS,
  getRequiredPermissions,
} from './route-permissions'

// ── Data Security (population-based access control) ─────────────────────────
export {
  type ScopeType,
  type SecurityProfile,
  type FieldRestriction,
  type DataRole,
  type PopulationGroup,
  type PopulationCriteria,
  type EmployeeDataShape,
  GLOBAL_ADMIN_PROFILE,
  HRBP_PROFILE,
  MANAGER_PROFILE,
  RECRUITER_PROFILE,
  FINANCE_PROFILE,
  IT_ADMIN_PROFILE,
  EMPLOYEE_SELF_SERVICE_PROFILE,
  SECURITY_PROFILES,
  POPULATION_ALL_EMPLOYEES,
  POPULATION_ALL_MANAGERS,
  POPULATION_ALL_HR,
  POPULATION_GROUPS,
  DEFAULT_ROLE_PROFILES,
  createDepartmentPopulation,
  createLocationPopulation,
  createDirectReportsPopulation,
  getSecurityProfile,
  getDataRole,
  getDefaultDataRole,
  isDataAccessAllowed,
  getAccessibleFields,
  isFieldHidden,
  evaluatePopulationCriteria,
  getPopulationMembers,
  resolveEffectiveDataAccess,
  filterAccessibleEmployees,
  sanitizeEmployeeData,
} from './data-security'

// ── Field Permissions (per-field view/edit/correct granularity) ──────────────
export {
  type FieldAccess,
  type FieldPermission,
  FIELD_PERMISSIONS,
  getFieldAccess,
  getVisibleFields,
  getEditableFields,
  getSensitiveFields,
  canViewField,
  canEditField,
  canCorrectField,
  compareAccess,
  mergeAccess,
  getEntityFieldPermissions,
  getEntitiesWithPermissions,
  sanitizeRecord,
  getRoleAccessSummary,
} from './field-permissions'

// ── Delegation (time-bound authority delegation) ────────────────────────────
export {
  type Delegation,
  type DelegationRule,
  type CreateDelegationInput,
  type DelegationValidationError,
  type DelegatableProcess,
  type DelegatableApprovalType,
  DELEGATABLE_PROCESSES,
  DELEGATABLE_APPROVAL_TYPES,
  DELEGATION_RULES,
  createDelegation,
  revokeDelegation,
  getActiveDelegations,
  getDelegationsForUser,
  getDelegation,
  getAllDelegations,
  isDelegateFor,
  getEffectivePermissionsWithDelegation,
  cleanupExpiredDelegations,
  getDelegationRule,
  requiresApproval,
  getDelegationSummary,
  validateDelegation,
  clearDelegationStore,
} from './delegation'

// ── Custom Roles (admin-creatable roles) ────────────────────────────────────
export {
  type CustomRole,
  type CreateCustomRoleInput,
  type UpdateCustomRoleInput,
  type ResolvedRole,
  type CustomRoleValidationError,
  ROLE_TEMPLATES,
  createCustomRole,
  updateCustomRole,
  deleteCustomRole,
  getCustomRoles,
  getCustomRole,
  resolveCustomRole,
  cloneRole,
  createFromTemplate,
  getAvailableTemplates,
  validateCustomRole,
  clearCustomRoleStore,
} from './custom-roles'

// ── Audit Log (enterprise compliance trail) ─────────────────────────────────
export {
  type AuditAction,
  type AuditOutcome,
  type AuditEntry,
  type AuditQueryFilters,
  type ComplianceReport,
  type AuditConfig,
  configureAuditLog,
  logAudit,
  logRecordView,
  logAccessDenied,
  logSensitiveDataAccess,
  getAuditLog,
  getAuditLogForUser,
  getAuditLogForResource,
  getAccessDeniedLog,
  getLoginHistory,
  generateComplianceReport,
  pruneOldEntries,
  getAuditLogSize,
  clearAuditLog,
  exportAuditLog,
  getEntriesForDataSubject,
  anonymizeDataSubject,
} from './audit-log'
