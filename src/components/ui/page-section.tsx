'use client'

import React from 'react'

interface PageSectionProps {
  children: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

/** Consistent section wrapper with standardized spacing. */
export function PageSection({ children, title, description, action, className = '' }: PageSectionProps) {
  return (
    <section className={`mb-6 ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between mb-3">
          <div>
            {title && <h3 className="tempo-section-title">{title}</h3>}
            {description && <p className="tempo-small mt-0.5">{description}</p>}
          </div>
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {children}
    </section>
  )
}
