'use client'

import { usePermissions, type ScopeType } from '@/lib/hooks/use-permissions'
import { useTempo } from '@/lib/store'

const SCOPE_CONFIG: Record<ScopeType, { icon: string; label: string; color: string }> = {
  global: {
    icon: '\uD83C\uDF10',
    label: 'Global Access',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-300 dark:border-emerald-800',
  },
  organization: {
    icon: '\uD83C\uDFE2',
    label: 'Organization',
    color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/30 dark:text-blue-300 dark:border-blue-800',
  },
  department: {
    icon: '\uD83C\uDFE2',
    label: 'Department',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/30 dark:text-indigo-300 dark:border-indigo-800',
  },
  team: {
    icon: '\uD83D\uDC65',
    label: 'Your Team',
    color: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/30 dark:text-violet-300 dark:border-violet-800',
  },
  self: {
    icon: '\uD83D\uDC64',
    label: 'Your Profile',
    color: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700',
  },
}

export function DataScopeIndicator() {
  const { dataScope, effectiveRole } = usePermissions()
  const { currentUser, employees, departments } = useTempo()
  const config = SCOPE_CONFIG[dataScope]

  // Build contextual label
  let label = config.label
  if (dataScope === 'department' && currentUser?.department_id) {
    const dept = Array.isArray(departments)
      ? departments.find((d: Record<string, unknown>) => d.id === currentUser.department_id)
      : null
    if (dept) label = String((dept as Record<string, unknown>).name ?? 'Department')
  }
  if (dataScope === 'team' && Array.isArray(employees)) {
    const reportCount = employees.filter(
      (e: Record<string, unknown>) =>
        e.manager_id === currentUser?.employee_id || e.reports_to === currentUser?.employee_id,
    ).length
    label = `Your Team (${reportCount} report${reportCount !== 1 ? 's' : ''})`
  }

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${config.color}`}
      title={`Data scope: ${dataScope} | Effective role: ${effectiveRole}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      <span>{label}</span>
    </div>
  )
}
