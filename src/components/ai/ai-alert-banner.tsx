'use client'

import { useState } from 'react'
import { AlertTriangle, AlertCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AIInsight } from '@/lib/ai-engine'

interface AIAlertBannerProps {
  insights: AIInsight[]
  onDismiss?: (id: string) => void
  maxVisible?: number
  className?: string
}

export function AIAlertBanner({ insights, onDismiss, maxVisible = 3, className }: AIAlertBannerProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = insights
    .filter(i => !dismissed.has(i.id) && (i.severity === 'critical' || i.severity === 'warning'))
    .slice(0, maxVisible)

  if (visible.length === 0) return null

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    onDismiss?.(id)
  }

  return (
    <div className={cn('space-y-1', className)}>
      {visible.map(insight => (
        <div
          key={insight.id}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 rounded-[var(--radius-card)] text-xs',
            insight.severity === 'critical'
              ? 'bg-red-50 text-error border border-red-100'
              : 'bg-amber-50 text-warning border border-amber-100'
          )}
        >
          {insight.severity === 'critical'
            ? <AlertCircle size={14} className="shrink-0" />
            : <AlertTriangle size={14} className="shrink-0" />
          }
          <div className="flex-1 min-w-0">
            <span className="font-semibold">{insight.title}:</span>{' '}
            <span className="opacity-90">{insight.description}</span>
          </div>
          <button onClick={() => handleDismiss(insight.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
