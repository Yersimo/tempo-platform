'use client'
import React from 'react'
import { cn } from '@/lib/utils/cn'
import { Button } from './button'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  /** Pass a ReactNode for simple content, or { label, onClick } for a styled primary button */
  action?: React.ReactNode | { label: string; onClick: () => void }
  secondaryAction?: { label: string; onClick: () => void }
  className?: string
  compact?: boolean // for inline/smaller empty states
}

function isActionObject(action: unknown): action is { label: string; onClick: () => void } {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action
}

export function EmptyState({ icon, title, description, action, secondaryAction, className, compact = false }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center text-center', compact ? 'py-8 px-4' : 'py-16 px-6', className)}>
      {icon && (
        <div className={cn('flex items-center justify-center rounded-2xl bg-gray-100', compact ? 'w-12 h-12 mb-3' : 'w-16 h-16 mb-4')}>
          <div className="text-t3">{icon}</div>
        </div>
      )}
      <h3 className={cn('font-semibold text-t1', compact ? 'text-xs' : 'text-sm')}>{title}</h3>
      {description && (
        <p className={cn('text-t3 mt-1.5 max-w-sm', compact ? 'text-[11px]' : 'text-xs')}>{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-3 mt-4">
          {action && (
            isActionObject(action)
              ? <Button variant="primary" size="sm" onClick={action.onClick}>{action.label}</Button>
              : action
          )}
          {secondaryAction && (
            <button onClick={secondaryAction.onClick} className="text-xs text-tempo-600 font-medium hover:text-tempo-700">
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
