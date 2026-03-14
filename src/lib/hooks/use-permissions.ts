/**
 * React hook for RBAC permission checks.
 *
 * Usage:
 *   const { can, canAny, isAdmin, moduleAccess } = usePermissions()
 *   if (can('payroll:read')) { ... }
 */

'use client'

import { useMemo } from 'react'
import { useTempo } from '@/lib/store'
import {
  type Permission,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getModuleAccess,
} from '@/lib/security/permissions'

export function usePermissions() {
  const { currentUser } = useTempo()
  const role = currentUser?.role || 'employee'

  const permissions = useMemo(
    () => getPermissionsForRole(role),
    [role],
  )

  const moduleAccess = useMemo(
    () => getModuleAccess(permissions),
    [permissions],
  )

  return {
    /** The user's current role */
    role,
    /** Full list of effective permissions */
    permissions,
    /** Check a single permission */
    can: (permission: Permission) => hasPermission(permissions, permission),
    /** Check if user has at least one of the listed permissions */
    canAny: (perms: Permission[]) => hasAnyPermission(permissions, perms),
    /** Check if user has ALL of the listed permissions */
    canAll: (perms: Permission[]) => hasAllPermissions(permissions, perms),
    /** Module-level read/write/manage flags (for sidebar filtering) */
    moduleAccess,
    // ── Convenience role checks ──
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isHR: role === 'hrbp' || role === 'admin' || role === 'owner',
    isManager: role === 'manager' || role === 'admin' || role === 'owner',
    isFinance: role === 'admin' || role === 'owner',
    isIT: role === 'admin' || role === 'owner',
  }
}
