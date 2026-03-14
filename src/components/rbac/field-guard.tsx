'use client'

import { type ReactNode, useEffect } from 'react'
import { usePermissions } from '@/lib/hooks/use-permissions'

interface FieldGuardProps {
  /** Entity type (e.g. 'compensation', 'employee') */
  entity: string
  /** Field name (e.g. 'base_salary', 'ssn') */
  field: string
  /** Display mode: 'display' renders text, 'input' handles form fields */
  mode?: 'display' | 'input'
  /** Value to show when view is denied (default: masked dots) */
  maskedValue?: string
  /** Callback fired when access is denied */
  onAccessDenied?: () => void
  children: ReactNode
}

function MaskedDisplay({ value }: { value: string }) {
  return (
    <span
      className="inline-block select-none rounded bg-gray-100 px-2 py-0.5 font-mono text-sm tracking-widest text-gray-400 dark:bg-gray-800 dark:text-gray-500"
      title="You do not have permission to view this field"
      aria-label="Restricted field"
    >
      {value}
    </span>
  )
}

function DisabledOverlay({ children }: { children: ReactNode }) {
  return (
    <div className="pointer-events-none relative opacity-60" aria-disabled="true">
      {children}
      <div className="absolute inset-0 cursor-not-allowed" title="Read-only: you do not have edit permission" />
    </div>
  )
}

export function FieldGuard({
  entity,
  field,
  mode = 'display',
  maskedValue = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022',
  onAccessDenied,
  children,
}: FieldGuardProps) {
  const { canViewField, canEditField } = usePermissions()

  const canView = canViewField(entity, field)
  const canEdit = canEditField(entity, field)

  useEffect(() => {
    if (!canView && onAccessDenied) {
      onAccessDenied()
    }
  }, [canView, onAccessDenied])

  // No view access at all — hide or mask
  if (!canView) {
    if (mode === 'input') {
      return null
    }
    return <MaskedDisplay value={maskedValue} />
  }

  // Can view but not edit — display mode shows children, input mode shows disabled
  if (!canEdit && mode === 'input') {
    return <DisabledOverlay>{children}</DisabledOverlay>
  }

  // Full access
  return <>{children}</>
}
