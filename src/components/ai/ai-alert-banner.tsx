'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
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
    <div className={cn('space-y-1.5', className)}>
      {visible.map(insight => (
        <div
          key={insight.id}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs bg-gray-50/60"
        >
          <div className={cn(
            'w-[5px] h-[5px] rounded-full shrink-0',
            insight.severity === 'critical' ? 'bg-red-300' : 'bg-amber-300'
          )} />
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-t1">{insight.title}:</span>{' '}
            <span className="text-t2">{insight.description}</span>
          </div>
          <button onClick={() => handleDismiss(insight.id)} className="shrink-0 text-t3 hover:text-t1 transition-colors">
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
