// ─── Design Tokens ───────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for all design constants across the Tempo platform.
// Import from '@/lib/design-tokens' — never hardcode these values in pages.

// Icon sizes — use these EVERYWHERE
export const ICON_SIZE = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 20,
  xl: 24,
} as const

// Standard icon size for page headers/actions
export const HEADER_ICON = ICON_SIZE.sm  // 14px
// Standard icon size for sidebar nav
export const NAV_ICON = ICON_SIZE.lg     // 20px
// Standard icon size for stat cards
export const STAT_ICON = ICON_SIZE.lg    // 20px
// Standard icon size for table rows
export const TABLE_ICON = ICON_SIZE.sm   // 14px
// Standard icon size for buttons
export const BUTTON_ICON = ICON_SIZE.sm  // 14px
// Standard icon size for badges/pills
export const BADGE_ICON = ICON_SIZE.xs   // 12px

// Spacing scale (in Tailwind units)
export const SECTION_GAP = 'gap-6'       // Between major sections
export const CARD_GAP = 'gap-4'          // Between cards in a grid
export const ELEMENT_GAP = 'gap-3'       // Between elements in a card
export const TIGHT_GAP = 'gap-2'         // Tight spacing

// Page content margins
export const PAGE_SECTION_MB = 'mb-6'    // Between page sections
export const CARD_SECTION_MB = 'mb-4'    // Between card sections

// Status/severity color mapping — SINGLE SOURCE
export const STATUS_COLORS = {
  active: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  completed: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  success: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  approved: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  in_progress: { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  draft: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  inactive: { bg: 'bg-gray-50', text: 'text-gray-600', dot: 'bg-gray-400' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  failed: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  overdue: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  critical: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
} as const

export type StatusKey = keyof typeof STATUS_COLORS

// Get status colors with fallback
export function getStatusColor(status: string) {
  const key = status.toLowerCase().replace(/[\s-]/g, '_') as StatusKey
  return STATUS_COLORS[key] || STATUS_COLORS.draft
}
