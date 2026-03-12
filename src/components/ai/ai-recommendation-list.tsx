'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Check, X } from 'lucide-react'
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

export function AIRecommendationList({ recommendations, onAccept, onDismiss, title, maxVisible = 5, className }: AIRecommendationListProps) {
  const t = useTranslations('ai')
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
    <div className={cn('bg-white border border-border/80 rounded-2xl overflow-hidden', className)}>
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-border/60">
        <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-tempo-500 to-tempo-600 flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <h4 className="text-[13px] font-semibold text-t1 flex-1 tracking-[-0.01em]">{title ?? t('recommendations')}</h4>
        <span className="text-[9px] px-1.5 py-[2px] rounded-md bg-tempo-50 text-tempo-600 font-semibold tracking-widest uppercase">AI</span>
      </div>
      <div className="divide-y divide-border/40">
        {visible.map(rec => {
          const isAccepted = accepted.has(rec.id)
          return (
            <div key={rec.id} className={cn('flex items-start gap-3 px-5 py-3 transition-opacity', isAccepted && 'opacity-50')}>
              <span className={cn('w-[6px] h-[6px] rounded-full mt-1.5 shrink-0', impactColors[rec.impact])}
                title={t(`${rec.impact}Impact`)} />
              <div className="flex-1 min-w-0">
                <p className={cn('text-[13px] font-medium text-t1', isAccepted && 'line-through')}>{rec.title}</p>
                <p className="text-[11px] text-t3 mt-0.5 leading-relaxed">{rec.rationale}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isAccepted ? (
                  <span className="text-emerald-500"><Check size={14} /></span>
                ) : (
                  <>
                    <button
                      onClick={() => handleAccept(rec.id)}
                      className="p-1.5 rounded-lg text-tempo-600 hover:bg-tempo-50 transition-colors"
                      title={t('accept')}
                    >
                      <Check size={12} />
                    </button>
                    <button
                      onClick={() => handleDismiss(rec.id)}
                      className="p-1.5 rounded-lg text-t3 hover:bg-canvas transition-colors"
                      title={t('dismiss')}
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
