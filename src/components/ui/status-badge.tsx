'use client'

import React from 'react'

const STATUS_MAP: Record<string, { bg: string; text: string; dot: string }> = {
  // Green family
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  verified: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  compliant: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  paid: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  matched: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  enrolled: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  on_track: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },

  // Amber family
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  in_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  pending_review: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  pending_hr: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  processing: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  partial: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  expiring: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  at_risk: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },

  // Blue family
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  open: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  running: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  scheduled: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  pending_finance: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  low: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },

  // Orange family
  high: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  no_show: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },

  // Red family
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  expired: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  non_compliant: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  cancelled: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },

  // Gray family (default)
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  archived: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  unknown: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  not_applicable: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  swapped: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  dismissed: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  auto_resolved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
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
    <span className={`inline-flex items-center gap-1.5 rounded-full font-medium ${style.bg} ${style.text} ${
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
    } ${className}`}>
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />}
      {displayText}
    </span>
  )
}

// Export the map for pages that need direct access
export { STATUS_MAP, getStatusStyle, normalizeStatus }
