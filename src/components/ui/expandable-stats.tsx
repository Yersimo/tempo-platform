'use client'

import { useState, type ReactNode, Children } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface ExpandableStatsProps {
  /** How many stat cards to show before collapsing. Defaults to 3. */
  visibleCount?: number
  children: ReactNode
  className?: string
}

/**
 * Renders stat cards in a responsive grid. Shows the first `visibleCount` cards,
 * and collapses the rest behind a "Show more metrics" toggle.
 */
export function ExpandableStats({ visibleCount = 3, children, className }: ExpandableStatsProps) {
  const [expanded, setExpanded] = useState(false)
  const items = Children.toArray(children)

  if (items.length <= visibleCount) {
    return (
      <div className={className || `grid grid-cols-2 md:grid-cols-3 gap-4 mb-6`}>
        {items}
      </div>
    )
  }

  const visible = items.slice(0, visibleCount)
  const hidden = items.slice(visibleCount)

  return (
    <div className="mb-6 space-y-2">
      <div className={className || `grid grid-cols-2 md:grid-cols-3 gap-4`}>
        {visible}
        {expanded && hidden}
      </div>
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors ml-1"
      >
        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {expanded ? 'Show fewer metrics' : `Show ${hidden.length} more metric${hidden.length > 1 ? 's' : ''}`}
      </button>
    </div>
  )
}
