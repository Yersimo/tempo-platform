'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { AIInsightCard } from './ai-insight-card'
import { AIScoreBadge } from './ai-score-badge'
import { AIRecommendationList } from './ai-recommendation-list'
import type { AIInsight, AIScore, AINarrative, AIRecommendation } from '@/lib/ai-engine'

interface AIInsightPanelProps {
  title?: string
  insights?: AIInsight[]
  scores?: Record<string, AIScore>
  narrative?: AINarrative
  recommendations?: AIRecommendation[]
  collapsible?: boolean
  defaultExpanded?: boolean
  onDismissInsight?: (id: string) => void
  onAcceptRecommendation?: (id: string) => void
  className?: string
}

export function AIInsightPanel({
  title,
  insights = [],
  scores = {},
  narrative,
  recommendations = [],
  collapsible = true,
  defaultExpanded = true,
  onDismissInsight,
  onAcceptRecommendation,
  className,
}: AIInsightPanelProps) {
  const t = useTranslations('ai')
  const [expanded, setExpanded] = useState(defaultExpanded)
  const totalItems = insights.length + recommendations.length + Object.keys(scores).length + (narrative ? 1 : 0)

  if (totalItems === 0) return null

  return (
    <div className={cn('rounded-2xl border border-border/80 bg-white overflow-hidden', className)}>
      <button
        onClick={() => collapsible && setExpanded(!expanded)}
        className={cn(
          'flex items-center gap-2.5 w-full px-5 py-3.5 text-left',
          collapsible && 'hover:bg-canvas/50 transition-colors cursor-pointer',
          !collapsible && 'cursor-default'
        )}
      >
        <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-tempo-500 to-tempo-600 flex items-center justify-center shrink-0">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
          </svg>
        </div>
        <span className="text-[13px] font-semibold text-t1 flex-1 tracking-[-0.01em]">{title ?? t('insightsTitle')}</span>
        {!expanded && (
          <span className="text-[0.55rem] text-t3 bg-canvas px-2 py-0.5 rounded-[var(--radius-pill)]">
            {totalItems !== 1 ? t('insightCountPlural', { count: totalItems }) : t('insightCount', { count: totalItems })}
          </span>
        )}
        {collapsible && (
          expanded ? <ChevronUp size={12} className="text-t3" /> : <ChevronDown size={12} className="text-t3" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-divider">
          {/* Narrative */}
          {narrative && (
            <div className="px-4 py-3 border-b border-divider bg-tempo-50/30">
              <p className="text-xs text-t1 leading-relaxed">{typeof narrative.summary === 'string' ? narrative.summary : JSON.stringify(narrative.summary)}</p>
              {Array.isArray(narrative.bulletPoints) && narrative.bulletPoints.length > 0 && (
                <ul className="mt-2 space-y-1">
                  {narrative.bulletPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-[0.6rem] text-t2">
                      <span className="w-1 h-1 rounded-full bg-tempo-400 mt-1.5 shrink-0" />
                      {typeof point === 'string' ? point : JSON.stringify(point)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Scores */}
          {Object.keys(scores).length > 0 && (
            <div className="px-4 py-3 border-b border-divider">
              <div className="flex items-center gap-4 overflow-x-auto">
                {Object.entries(scores).map(([key, score]) => (
                  <div key={key} className="flex flex-col items-center shrink-0">
                    <AIScoreBadge score={score} size="md" />
                    <span className="text-[0.5rem] text-t3 mt-1">{key}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="px-4 py-3 space-y-2 border-b border-divider last:border-b-0">
              {insights.map(insight => (
                <AIInsightCard key={insight.id} insight={insight} compact onDismiss={onDismissInsight} />
              ))}
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="p-0">
              <AIRecommendationList
                recommendations={recommendations}
                onAccept={onAcceptRecommendation}
                className="border-0 rounded-none"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
