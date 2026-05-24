'use client'

import React from 'react'

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  // Green family
  active: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  completed: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  approved: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  verified: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  compliant: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  success: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  paid: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  matched: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  enrolled: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
  on_track: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },

  // Amber family
  pending: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  warning: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  in_review: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  pending_review: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  pending_hr: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  processing: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  partial: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  expiring: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  at_risk: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },
  medium: { bg: 'bg-[#F8F0DF]', text: 'text-warning', dot: 'bg-warning' },

  // Blue family
  in_progress: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },
  open: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },
  running: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },
  scheduled: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },
  pending_finance: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },
  low: { bg: 'bg-tempo-50', text: 'text-tempo-700', dot: 'bg-tempo-500' },

  // Orange family
  high: { bg: 'bg-birch', text: 'text-brass', dot: 'bg-brass' },
  no_show: { bg: 'bg-birch', text: 'text-brass', dot: 'bg-brass' },

  // Red family
  failed: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  rejected: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  overdue: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  expired: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  critical: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  error: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  non_compliant: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },
  cancelled: { bg: 'bg-[#F9ECEE]', text: 'text-error', dot: 'bg-error' },

  // Gray family (default)
  draft: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  inactive: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  archived: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  unknown: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  not_applicable: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  swapped: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  dismissed: { bg: 'bg-fog', text: 'text-t2', dot: 'bg-t3' },
  auto_resolved: { bg: 'bg-[#F0F4EA]', text: 'text-success', dot: 'bg-success' },
}

function normalizeStatus(status: string): string {
  return status.toLowerCase().replace(/[\s-]/g, '_')
}

function getStatusStyle(status: string) {
  return STATUS_MAP[normalizeStatus(status)] || STATUS_MAP.draft
}

interface StatusBadgeProps {
  status: string
  label?: string // override display text
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, label, size = 'sm', showDot = true, className = '' }: StatusBadgeProps) {
  const style = getStatusStyle(status)
  const displayText = label || status.replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset ring-black/[0.04] ${style.bg} ${style.text} ${
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    } ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {displayText}
    </span>
  )
}

// Export the map for pages that need direct access
export { STATUS_MAP, getStatusStyle, normalizeStatus }
