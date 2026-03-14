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
} from './permissions'

export {
  ROUTE_PERMISSIONS,
  getRequiredPermissions,
} from './route-permissions'
