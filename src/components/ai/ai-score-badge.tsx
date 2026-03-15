'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { AIScore } from '@/lib/ai-engine'

interface AIScoreBadgeProps {
  score: AIScore
  size?: 'sm' | 'md' | 'lg'
  showBreakdown?: boolean
  showTrend?: boolean
  className?: string
}

export function AIScoreBadge({ score, size = 'sm', showBreakdown = false, showTrend = true, className }: AIScoreBadgeProps) {
  const t = useTranslations('ai')
  const [expanded, setExpanded] = useState(false)

  const colorClass = score.value >= 75 ? 'text-success' : score.value >= 50 ? 'text-tempo-600' : score.value >= 30 ? 'text-warning' : 'text-error'
  const bgClass = score.value >= 75 ? 'bg-green-50' : score.value >= 50 ? 'bg-tempo-50' : score.value >= 30 ? 'bg-amber-50' : 'bg-red-50'

  const TrendIcon = score.trend === 'up' ? TrendingUp : score.trend === 'down' ? TrendingDown : Minus

  if (size === 'sm') {
    return (
      <span className={cn('inline-flex items-center gap-1 px-1.5 py-0.5 rounded-[var(--radius-pill)] text-[0.6rem] font-semibold', bgClass, colorClass, className)}>
        <Sparkles size={9} className="text-tempo-400" />
        {score.value}
        {showTrend && score.trend && score.trend !== 'stable' && <TrendIcon size={9} />}
      </span>
    )
  }

  if (size === 'md') {
    return (
      <div className={cn('inline-flex flex-col items-center', className)}>
        <div className="relative w-14 h-14">
          <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
            <circle cx="28" cy="28" r="24" stroke="rgba(0,0,0,0.06)" strokeWidth="4" fill="none" />
            <circle cx="28" cy="28" r="24" stroke="currentColor" strokeWidth="4" fill="none"
              className={colorClass}
              strokeDasharray={`${(score.value / 100) * 150.8} 150.8`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 600ms ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-sm font-bold', colorClass)}>{score.value}</span>
          </div>
        </div>
        <span className="text-[0.55rem] text-t3 mt-1">{typeof score.label === 'string' ? score.label : String(score.label ?? '')}</span>
        {showTrend && score.trend && (
          <span className={cn('flex items-center gap-0.5 text-[0.5rem] mt-0.5',
            score.trend === 'up' ? 'text-success' : score.trend === 'down' ? 'text-error' : 'text-t3'
          )}>
            <TrendIcon size={8} /> {score.trend === 'up' ? t('trendingUp') : score.trend === 'down' ? t('trendingDown') : t('trendingStable')}
          </span>
        )}
      </div>
    )
  }

  // Large: ring + breakdown
  return (
    <div className={cn('flex flex-col', className)}>
      <div className="flex items-center gap-3">
        <div className="relative w-16 h-16">
          <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" stroke="rgba(0,0,0,0.06)" strokeWidth="4" fill="none" />
            <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="4" fill="none"
              className={colorClass}
              strokeDasharray={`${(score.value / 100) * 175.9} 175.9`}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 600ms ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={cn('text-lg font-bold', colorClass)}>{score.value}</span>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-t1">{score.label}</p>
          {showTrend && score.trend && (
            <p className={cn('flex items-center gap-1 text-xs',
              score.trend === 'up' ? 'text-success' : score.trend === 'down' ? 'text-error' : 'text-t3'
            )}>
              <TrendIcon size={12} /> {score.trend === 'up' ? t('trendingUp') : score.trend === 'down' ? t('trendingDown') : t('trendingStable')}
            </p>
          )}
        </div>
      </div>
      {showBreakdown && score.breakdown && (
        <div className="mt-2">
          <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-1 text-[0.6rem] text-t3 hover:text-t2 transition-colors">
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            {expanded ? t('hideBreakdown') : t('showBreakdown')}
          </button>
          {expanded && (
            <div className="mt-2 space-y-1.5">
              {score.breakdown.map((f, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[0.55rem] text-t3 w-24 truncate">{f.factor}</span>
                  <div className="flex-1 h-1.5 bg-canvas rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500',
                        f.score >= 70 ? 'bg-success' : f.score >= 40 ? 'bg-tempo-400' : 'bg-warning'
                      )}
                      style={{ width: `${f.score}%` }}
                    />
                  </div>
                  <span className="text-[0.55rem] text-t2 font-medium w-8 text-right">{f.score}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
