'use client'

import { useTranslations } from 'next-intl'
import { Sparkles, X, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AIInsight } from '@/lib/ai-engine'

interface AIInsightCardProps {
  insight: AIInsight
  onDismiss?: (id: string) => void
  onAction?: (id: string) => void
  compact?: boolean
  className?: string
}

function ConfidenceDots({ level }: { level: 'high' | 'medium' | 'low' }) {
  const t = useTranslations('ai')
  const filled = level === 'high' ? 3 : level === 'medium' ? 2 : 1
  return (
    <span className="inline-flex items-center gap-0.5" title={t('confidence', { level })}>
      {[0, 1, 2].map(i => (
        <span key={i} className={cn('w-1 h-1 rounded-full', i < filled ? 'bg-tempo-500' : 'bg-tempo-200')} />
      ))}
    </span>
  )
}

export function AIInsightCard({ insight, onDismiss, onAction, compact = false, className }: AIInsightCardProps) {
  if (compact) {
    return (
      <div className={cn('flex items-start gap-2 py-2 px-3 rounded-lg bg-white/60', className)}>
        <Sparkles size={12} className="text-tempo-500 mt-0.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-t1 font-medium truncate">{insight.title}</p>
          <p className="text-[0.6rem] text-t3 truncate">{insight.description}</p>
        </div>
        <ConfidenceDots level={insight.confidence} />
        {onDismiss && (
          <button onClick={() => onDismiss(insight.id)} className="text-t3 hover:text-t2 transition-colors shrink-0">
            <X size={10} />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className={cn(
      'bg-white border border-border rounded-[var(--radius-card)] ai-gradient-border overflow-hidden',
      className
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Sparkles size={14} className="text-tempo-500" />
            <h4 className="text-sm font-semibold text-t1">{insight.title}</h4>
          </div>
          <div className="flex items-center gap-2">
            <ConfidenceDots level={insight.confidence} />
            {onDismiss && (
              <button onClick={() => onDismiss(insight.id)} className="text-t3 hover:text-t2 transition-colors">
                <X size={12} />
              </button>
            )}
          </div>
        </div>
        <p className="text-xs text-t2 leading-relaxed mb-3">{insight.description}</p>
        {insight.suggestedAction && (
          <button
            onClick={() => onAction?.(insight.id)}
            className="inline-flex items-center gap-1 text-xs text-tempo-600 font-medium hover:text-tempo-700 transition-colors"
          >
            {insight.actionLabel || insight.suggestedAction}
            <ArrowRight size={11} />
          </button>
        )}
      </div>
    </div>
  )
}
