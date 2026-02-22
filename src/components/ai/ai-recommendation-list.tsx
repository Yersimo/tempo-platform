'use client'

import { useState } from 'react'
import { Sparkles, Check, X, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AIRecommendation } from '@/lib/ai-engine'

interface AIRecommendationListProps {
  recommendations: AIRecommendation[]
  onAccept?: (id: string) => void
  onDismiss?: (id: string) => void
  title?: string
  maxVisible?: number
  className?: string
}

const impactColors = {
  high: 'bg-tempo-500',
  medium: 'bg-tempo-300',
  low: 'bg-tempo-200',
}

export function AIRecommendationList({ recommendations, onAccept, onDismiss, title = 'Recommendations', maxVisible = 5, className }: AIRecommendationListProps) {
  const [accepted, setAccepted] = useState<Set<string>>(new Set())
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const visible = recommendations
    .filter(r => !dismissed.has(r.id))
    .slice(0, maxVisible)

  if (visible.length === 0) return null

  const handleAccept = (id: string) => {
    setAccepted(prev => new Set([...prev, id]))
    onAccept?.(id)
  }

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]))
    onDismiss?.(id)
  }

  return (
    <div className={cn('bg-white border border-border rounded-[var(--radius-card)]', className)}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-divider">
        <Lightbulb size={14} className="text-tempo-500" />
        <h4 className="text-xs font-semibold text-t1 flex-1">{title}</h4>
        <span className="inline-flex items-center gap-1 text-[0.55rem] text-t3">
          <Sparkles size={9} className="text-tempo-400" /> AI-powered
        </span>
      </div>
      <div className="divide-y divide-divider">
        {visible.map(rec => {
          const isAccepted = accepted.has(rec.id)
          return (
            <div key={rec.id} className={cn('flex items-start gap-3 px-4 py-3 transition-opacity', isAccepted && 'opacity-50')}>
              <span className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', impactColors[rec.impact])}
                title={`${rec.impact} impact`} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-xs font-medium text-t1', isAccepted && 'line-through')}>{rec.title}</p>
                <p className="text-[0.6rem] text-t3 mt-0.5">{rec.rationale}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isAccepted ? (
                  <span className="text-success"><Check size={14} /></span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAccept(rec.id)}
                      className="p-1 rounded-md text-tempo-600 hover:bg-tempo-50 transition-colors"
                      title="Accept"
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="p-1 rounded-md text-t3 hover:bg-canvas transition-colors"
                      title="Dismiss"
                    >
                      <X size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
