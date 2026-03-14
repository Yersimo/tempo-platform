'use client'

import { type ReactNode } from 'react'
import { usePermissions } from '@/lib/hooks/use-permissions'
import { type Permission } from '@/lib/security/permissions'

interface PermissionGuardProps {
  /** Any of these permissions grants access */
  requires?: string | string[]
  /** ALL of these permissions are required */
  requiresAll?: string[]
  /** One of these roles grants access */
  requiresRole?: string[]
  /** Content to render when access is denied (default: null) */
  fallback?: ReactNode
  /** If true, show a "restricted" placeholder instead of hiding */
  showRestricted?: boolean
  children: ReactNode
}

function RestrictedPlaceholder() {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
      <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 9v3m9 3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span>You do not have permission to view this content. Contact your administrator for access.</span>
    </div>
  )
}

export function PermissionGuard({
  requires,
  requiresAll,
  requiresRole,
  fallback,
  showRestricted = false,
  children,
}: PermissionGuardProps) {
  const { can, canAny, canAll, role } = usePermissions()

  let allowed = true

  // Check permission-based access
  if (requires) {
    const permList = Array.isArray(requires) ? requires : [requires]
    allowed = canAny(permList as Permission[])
  }

  // Check all-permissions requirement
  if (allowed && requiresAll) {
    allowed = canAll(requiresAll as Permission[])
  }

  // Check role-based access
  if (allowed && requiresRole) {
    allowed = requiresRole.includes(role)
  }

  if (allowed) {
    return <>{children}</>
  }

  // Access denied
  if (fallback) {
    return <>{fallback}</>
  }

  if (showRestricted) {
    return <RestrictedPlaceholder />
  }

  return null
}
