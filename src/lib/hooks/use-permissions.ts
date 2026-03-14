/**
 * React hook for RBAC permission checks.
 *
 * Usage:
 *   const { can, canAny, isAdmin, moduleAccess } = usePermissions()
 *   if (can('payroll:read')) { ... }
 *
 *   // Enterprise features:
 *   const { canAccessData, canViewField, dataScope, effectiveRole } = usePermissions()
 *   if (canAccessData(targetEmployeeId)) { ... }
 *   if (canViewField('compensation', 'base_salary')) { ... }
 */

'use client'

import { useMemo, useCallback } from 'react'
import { useTempo } from '@/lib/store'
import {
  type Permission,
  getPermissionsForRole,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getModuleAccess,
} from '@/lib/security/permissions'
import { isDataAccessAllowed, type SecurityProfile } from '@/lib/security/data-security'
import { getVisibleFields as getVisibleFieldsFn, getEditableFields as getEditableFieldsFn, canViewField, canEditField } from '@/lib/security/field-permissions'
import { type Delegation } from '@/lib/security/delegation'

// ── Types ────────────────────────────────────────────────────────────────────

export type ScopeType = 'global' | 'organization' | 'department' | 'team' | 'self'

/** Numeric hierarchy for role comparison (higher = more privileged). */
const ROLE_HIERARCHY: Record<string, number> = {
  employee: 10,
  manager: 20,
  hrbp: 30,
  admin: 40,
  owner: 50,
}

/** Map DB roles to their default data scope. */
const ROLE_SCOPE: Record<string, ScopeType> = {
  owner: 'global',
  admin: 'global',
  hrbp: 'organization',
  manager: 'team',
  employee: 'self',
}

/** Process types that can be delegated by each role level. */
const DELEGATABLE_PROCESSES: Record<string, string[]> = {
  owner: ['expense:approve', 'leave:approve', 'payroll:approve', 'finance:approve', 'recruiting:write', 'onboarding:manage', 'offboarding:manage', 'performance:manage'],
  admin: ['expense:approve', 'leave:approve', 'payroll:approve', 'finance:approve', 'recruiting:write', 'onboarding:manage', 'offboarding:manage', 'performance:manage'],
  hrbp: ['leave:approve', 'onboarding:manage', 'offboarding:manage', 'performance:manage'],
  manager: ['expense:approve', 'leave:approve'],
  employee: [],
}

export function usePermissions() {
  const { currentUser, employees } = useTempo()
  const role = currentUser?.role || 'employee'
  const userId = currentUser?.employee_id || ''
  const departmentId = currentUser?.department_id || ''

  const permissions = useMemo(
    () => getPermissionsForRole(role),
    [role],
  )

  const moduleAccess = useMemo(
    () => getModuleAccess(permissions),
    [permissions],
  )

  // ── Data scope ───────────────────────────────────────────────────────────

  const dataScope: ScopeType = useMemo(() => ROLE_SCOPE[role] ?? 'self', [role])
  const roleLevel: number = useMemo(() => ROLE_HIERARCHY[role] ?? 0, [role])
  const isConstrained: boolean = dataScope !== 'global'

  // ── Direct reports (for team scope checks) ─────────────────────────────

  const directReportIds = useMemo(() => {
    if (!employees || !Array.isArray(employees)) return new Set<string>()
    const reports = employees.filter(
      (e: Record<string, unknown>) => e.manager_id === userId || e.reports_to === userId,
    )
    return new Set(reports.map((e: Record<string, unknown>) => String(e.id)))
  }, [employees, userId])

  // ── Delegation state (stub — reads from store or context when available)

  const activeDelegations = useMemo((): Delegation[] => {
    // In production this would come from the store / API.
    // For now, return empty — delegation functions still work structurally.
    return []
  }, [])

  const effectiveRole = useMemo(() => {
    // If someone delegated a higher-privilege process to us, role stays
    // the same but effective permissions expand. For display purposes we
    // show the highest role whose scope we effectively have.
    const delegatedToMe = activeDelegations.filter(
      d => d.delegateId === userId && d.status === 'active',
    )
    if (delegatedToMe.length === 0) return role
    // Effective role is the max of our role and any delegator's role
    let maxLevel = roleLevel
    for (const d of delegatedToMe) {
      const delegatorRole = (d as unknown as Record<string, unknown>).delegatorRole as string | undefined
      const level = ROLE_HIERARCHY[delegatorRole ?? ''] ?? 0
      if (level > maxLevel) maxLevel = level
    }
    const entry = Object.entries(ROLE_HIERARCHY).find(([, v]) => v === maxLevel)
    return entry ? entry[0] : role
  }, [role, roleLevel, activeDelegations, userId])

  // ── Data access check ──────────────────────────────────────────────────

  const canAccessData = useCallback(
    (targetEmployeeId: string): boolean => {
      if (dataScope === 'global') return true
      if (dataScope === 'self') return targetEmployeeId === userId
      if (dataScope === 'team') {
        return targetEmployeeId === userId || directReportIds.has(targetEmployeeId)
      }
      if (dataScope === 'organization' || dataScope === 'department') {
        // HR/org-scoped: can see anyone in the same department or below
        if (targetEmployeeId === userId) return true
        if (!employees || !Array.isArray(employees)) return false
        const target = employees.find((e: Record<string, unknown>) => e.id === targetEmployeeId)
        if (!target) return false
        return (target as Record<string, unknown>).department_id === departmentId || roleLevel >= ROLE_HIERARCHY.hrbp
      }
      return false
    },
    [dataScope, userId, directReportIds, employees, departmentId, roleLevel],
  )

  // ── Field-level access ─────────────────────────────────────────────────

  const canViewFieldFn = useCallback(
    (entity: string, field: string): boolean => {
      try {
        return canViewField(role, entity, field)
      } catch {
        // If field-permissions module isn't loaded yet, fall back to role-based
        return roleLevel >= ROLE_HIERARCHY.manager
      }
    },
    [role, roleLevel],
  )

  const canEditFieldFn = useCallback(
    (entity: string, field: string): boolean => {
      try {
        return canEditField(role, entity, field)
      } catch {
        return roleLevel >= ROLE_HIERARCHY.hrbp
      }
    },
    [role, roleLevel],
  )

  const getVisibleFields = useCallback(
    (entity: string): string[] => {
      try {
        return getVisibleFieldsFn(role, entity)
      } catch {
        return []
      }
    },
    [role],
  )

  const getEditableFields = useCallback(
    (entity: string): string[] => {
      try {
        return getEditableFieldsFn(role, entity)
      } catch {
        return []
      }
    },
    [role],
  )

  // ── Delegation helpers ─────────────────────────────────────────────────

  const isDelegateFor = useCallback(
    (targetUserId: string): boolean => {
      return activeDelegations.some(
        d => d.delegatorId === targetUserId && d.delegateId === userId && d.status === 'active',
      )
    },
    [activeDelegations, userId],
  )

  const canDelegate = useCallback(
    (processType: string): boolean => {
      const allowed = DELEGATABLE_PROCESSES[role] ?? []
      return allowed.includes(processType)
    },
    [role],
  )

  return {
    // ── Original API (backward-compatible) ───────────────────────────────
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
    // ── Convenience role checks ──────────────────────────────────────────
    isOwner: role === 'owner',
    isAdmin: role === 'admin' || role === 'owner',
    isHR: role === 'hrbp' || role === 'admin' || role === 'owner',
    isManager: role === 'manager' || role === 'admin' || role === 'owner',
    isFinance: role === 'admin' || role === 'owner',
    isIT: role === 'admin' || role === 'owner',

    // ── Enterprise additions ─────────────────────────────────────────────
    /** Check if current user can access a specific employee's data */
    canAccessData,
    /** Check if current user can view a specific field on an entity */
    canViewField: canViewFieldFn,
    /** Check if current user can edit a specific field on an entity */
    canEditField: canEditFieldFn,
    /** Get all visible fields for an entity */
    getVisibleFields,
    /** Get all editable fields for an entity */
    getEditableFields,
    /** Check if current user is a delegate for a given user */
    isDelegateFor,
    /** Role including delegation overrides */
    effectiveRole,
    /** Current user's data scope */
    dataScope,
    /** Whether access is org-hierarchy-scoped (not global) */
    isConstrained,
    /** Numeric role hierarchy level for comparison */
    roleLevel,
    /** Whether user can delegate a specific process type */
    canDelegate,
  }
}
