'use client'

import { cn } from '@/lib/utils/cn'
import { TrendingUp, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { AIInsight, AIAnomaly, AIRecommendation, AIScore } from '@/lib/ai-engine'

// ─── Jony Ive–inspired AI severity system ───────────────────────────
// No cliché icons. Severity communicated through subtle accent lines
// and restrained color. The insight is the content, not the chrome.

const SEVERITY_STYLES = {
  critical: {
    accent: 'border-l-red-400',
    dot: 'bg-red-400',
    text: 'text-red-500',
    bg: 'bg-white',
  },
  warning: {
    accent: 'border-l-amber-400',
    dot: 'bg-amber-400',
    text: 'text-amber-500',
    bg: 'bg-white',
  },
  positive: {
    accent: 'border-l-emerald-400',
    dot: 'bg-emerald-400',
    text: 'text-emerald-500',
    bg: 'bg-white',
  },
  info: {
    accent: 'border-l-blue-400',
    dot: 'bg-blue-400',
    text: 'text-blue-500',
    bg: 'bg-white',
  },
} as const

function getSeverity(severity: string) {
  return SEVERITY_STYLES[severity as keyof typeof SEVERITY_STYLES] || SEVERITY_STYLES.info
}

// ─── Insight Item ───────────────────────────────────────────────────

function InsightItem({ insight }: { insight: AIInsight }) {
  const s = getSeverity(insight.severity)
  return (
    <div className={cn(
      'px-4 py-3 rounded-xl border border-border/60 border-l-[3px]',
      s.accent, s.bg,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-t1 leading-snug">{insight.title}</p>
          <p className="text-[11px] text-t3 mt-1 leading-relaxed">{insight.description}</p>
          {insight.suggestedAction && (
            <p className="text-[11px] text-tempo-600 mt-2 font-medium tracking-[-0.01em]">
              {insight.suggestedAction}
            </p>
          )}
        </div>
        <div className={cn('w-[6px] h-[6px] rounded-full mt-1 shrink-0', s.dot)} />
      </div>
    </div>
  )
}

// ─── Anomaly Item ───────────────────────────────────────────────────

function AnomalyItem({ anomaly }: { anomaly: AIAnomaly }) {
  const s = getSeverity(anomaly.severity)
  return (
    <div className={cn(
      'px-4 py-3 rounded-xl border border-border/60 border-l-[3px]',
      s.accent, s.bg,
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-t1">{anomaly.metric}</p>
          <p className="text-[11px] text-t3 mt-1 leading-relaxed">{anomaly.explanation}</p>
          <div className="flex items-center gap-4 mt-2">
            <span className="text-[10px] text-t3 tracking-wide">
              Expected <span className="font-medium text-t2">{typeof anomaly.expectedValue === 'number' ? anomaly.expectedValue.toLocaleString() : anomaly.expectedValue}</span>
            </span>
            <span className="text-[10px] tracking-wide">
              Actual <span className={cn('font-semibold', s.text)}>{typeof anomaly.currentValue === 'number' ? anomaly.currentValue.toLocaleString() : anomaly.currentValue}</span>
            </span>
            <span className={cn('text-[10px] font-medium', anomaly.deviationPercent > 0 ? 'text-red-500' : 'text-emerald-500')}>
              {anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent.toFixed(0)}%
            </span>
          </div>
        </div>
        <div className={cn('w-[6px] h-[6px] rounded-full mt-1 shrink-0', s.dot)} />
      </div>
    </div>
  )
}

// ─── Recommendation Item ────────────────────────────────────────────

function RecommendationItem({ rec }: { rec: AIRecommendation }) {
  return (
    <div className="px-4 py-3 rounded-xl border border-border/60 border-l-[3px] border-l-tempo-400 bg-white">
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-medium text-t1">{rec.title}</p>
        <p className="text-[11px] text-t3 mt-1 leading-relaxed">{rec.rationale}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className={cn(
            'text-[10px] px-2 py-[2px] rounded-full font-medium tracking-wide',
            rec.impact === 'high' ? 'bg-emerald-50 text-emerald-600' :
            rec.impact === 'medium' ? 'bg-amber-50 text-amber-600' :
            'bg-gray-50 text-gray-500'
          )}>
            {rec.impact} impact
          </span>
          <span className="text-[10px] px-2 py-[2px] rounded-full bg-gray-50 text-gray-500 font-medium tracking-wide">
            {rec.effort} effort
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Score Ring ──────────────────────────────────────────────────────
// Clean, monochrome ring. Color is an accent, not a statement.

export function AIScoreRing({ score, label, size = 48 }: { score: AIScore; label?: string; size?: number }) {
  const val = Math.round(score.value)
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (val / 100) * circ
  // Ive approach: single brand color at varying opacity instead of traffic lights
  const color = val >= 75 ? 'var(--color-tempo-600, #e16b3a)' : val >= 50 ? 'var(--color-tempo-500, #e8845a)' : 'var(--color-tempo-400, #edaa8a)'
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f3f4f6" strokeWidth={2.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={2.5}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          className="text-[11px] font-semibold" fill="#1a1a1a">{val}</text>
      </svg>
      <div>
        <p className="text-xs font-medium text-t1">{label || score.label}</p>
        {score.trend && (
          <p className={cn('text-[10px] flex items-center gap-0.5 text-t3')}>
            <TrendingUp size={10} className={cn(
              score.trend === 'down' ? 'rotate-180' : '',
              score.trend === 'up' ? 'text-emerald-500' : score.trend === 'down' ? 'text-red-400' : ''
            )} />
            {score.trend === 'up' ? 'Trending up' : score.trend === 'down' ? 'Trending down' : 'Stable'}
          </p>
        )}
      </div>
    </div>
  )
}

// ─── Main Card ──────────────────────────────────────────────────────
// Clean container. The gradient is barely perceptible — a whisper of
// brand color, not a shout. Header uses spacing and weight, not chrome.

interface AIInsightsCardProps {
  insights?: AIInsight[]
  anomalies?: AIAnomaly[]
  recommendations?: AIRecommendation[]
  scores?: Array<{ score: AIScore; label: string }>
  title?: string
  maxVisible?: number
  className?: string
}

export function AIInsightsCard({
  insights = [],
  anomalies = [],
  recommendations = [],
  scores = [],
  title = 'AI Insights',
  maxVisible = 3,
  className,
}: AIInsightsCardProps) {
  const [expanded, setExpanded] = useState(false)
  const totalItems = insights.length + anomalies.length + recommendations.length
  if (totalItems === 0 && scores.length === 0) return null

  const sortedInsights = [...insights].sort((a, b) => {
    const order = { critical: 0, warning: 1, positive: 2, info: 3 }
    return (order[a.severity] ?? 3) - (order[b.severity] ?? 3)
  })
  const visibleInsights = expanded ? sortedInsights : sortedInsights.slice(0, maxVisible)
  const visibleAnomalies = expanded ? anomalies : anomalies.slice(0, Math.max(0, maxVisible - visibleInsights.length))
  const visibleRecs = expanded ? recommendations : recommendations.slice(0, Math.max(0, maxVisible - visibleInsights.length - visibleAnomalies.length))
  const hasMore = totalItems > maxVisible

  return (
    <div className={cn(
      'rounded-2xl border border-border/80 bg-white overflow-hidden',
      className
    )}>
      {/* Header — clean, typographic, no gradient noise */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-tempo-500 to-tempo-600 flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
            </svg>
          </div>
          <h3 className="text-[13px] font-semibold text-t1 tracking-[-0.01em]">{title}</h3>
          <span className="text-[9px] px-1.5 py-[2px] rounded-md bg-tempo-50 text-tempo-600 font-semibold tracking-widest uppercase">AI</span>
        </div>
        {totalItems > 0 && (
          <span className="text-[11px] text-t3 tabular-nums">
            {totalItems} insight{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Scores row */}
      {scores.length > 0 && (
        <div className="flex items-center gap-6 px-5 py-3 border-b border-border/60 overflow-x-auto">
          {scores.map((s, i) => (
            <AIScoreRing key={i} score={s.score} label={s.label} />
          ))}
        </div>
      )}

      {/* Items */}
      <div className="p-4 space-y-2">
        {visibleInsights.map(insight => <InsightItem key={insight.id} insight={insight} />)}
        {visibleAnomalies.map(anomaly => <AnomalyItem key={anomaly.id} anomaly={anomaly} />)}
        {visibleRecs.map(rec => <RecommendationItem key={rec.id} rec={rec} />)}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-5 py-2.5 text-[11px] font-medium text-tempo-600 hover:bg-tempo-50/50 transition-colors flex items-center justify-center gap-1 border-t border-border/60"
        >
          {expanded ? 'Show less' : `Show all ${totalItems} insights`}
          <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
      )}
    </div>
  )
}
