'use client'

import React from 'react'

interface StatsGridProps {
  children: React.ReactNode
  className?: string
}

/** Standard 3-column stat card grid. Always 1 col on mobile, 2 on sm, 3 on md+. */
export function StatsGrid({ children, className = '' }: StatsGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {children}
    </div>
  )
}
