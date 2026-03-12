'use client'

import { useTranslations } from 'next-intl'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AIInsight } from '@/lib/ai-engine'

// ─── Minimal AI icon — geometric radial, not cliché sparkles ────────
function AIIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
  )
}

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
    <span className="inline-flex items-center gap-[3px]" title={t('confidence', { level })}>
      {[0, 1, 2].map(i => (
        <span key={i} className={cn('w-[5px] h-[5px] rounded-full', i < filled ? 'bg-tempo-500' : 'bg-gray-200')} />
      ))}
    </span>
  )
}

const SEVERITY_ACCENT = {
  critical: 'border-l-red-400',
  warning: 'border-l-amber-400',
  positive: 'border-l-emerald-400',
  info: 'border-l-tempo-400',
} as const

export function AIInsightCard({ insight, onDismiss, onAction, compact = false, className }: AIInsightCardProps) {
  const accent = SEVERITY_ACCENT[insight.severity as keyof typeof SEVERITY_ACCENT] || SEVERITY_ACCENT.info

  if (compact) {
    return (
      <div className={cn('flex items-start gap-2.5 py-2 px-3 rounded-xl bg-white/60 border-l-[3px]', accent, className)}>
        <AIIcon size={12} className="text-tempo-500 mt-0.5 shrink-0" />
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
      'bg-white border border-border/80 rounded-2xl overflow-hidden border-l-[3px]',
      accent,
      className
    )}>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <AIIcon size={14} className="text-tempo-500" />
            <h4 className="text-[13px] font-semibold text-t1 tracking-[-0.01em]">{insight.title}</h4>
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
        <p className="text-[11px] text-t2 leading-relaxed mb-3">{insight.description}</p>
        {insight.suggestedAction && onAction && (
          <button
            onClick={() => onAction(insight.id)}
            className="text-[11px] text-tempo-600 font-medium hover:text-tempo-700 transition-colors tracking-[-0.01em]"
          >
            {insight.actionLabel || insight.suggestedAction} →
          </button>
        )}
        {insight.suggestedAction && !onAction && (
          <p className="text-[11px] text-tempo-600 font-medium tracking-[-0.01em]">
            {insight.suggestedAction}
          </p>
        )}
      </div>
    </div>
  )
}
