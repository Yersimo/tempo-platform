'use client'

import { cn } from '@/lib/utils/cn'
import { Sparkles, AlertTriangle, TrendingUp, Info, CheckCircle, ChevronRight, Lightbulb, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import type { AIInsight, AIAnomaly, AIRecommendation, AIScore } from '@/lib/ai-engine'

// ---- Insight Item ----

function severityConfig(severity: string) {
  switch (severity) {
    case 'critical': return { icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', dot: 'bg-red-500' }
    case 'warning': return { icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', dot: 'bg-amber-500' }
    case 'positive': return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200', dot: 'bg-green-500' }
    default: return { icon: Info, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', dot: 'bg-blue-500' }
  }
}

function InsightItem({ insight }: { insight: AIInsight }) {
  const cfg = severityConfig(insight.severity)
  const Icon = cfg.icon
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', cfg.bg, cfg.border)}>
      <div className={cn('mt-0.5 shrink-0', cfg.color)}><Icon size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-t1 leading-snug">{insight.title}</p>
        <p className="text-[11px] text-t3 mt-0.5 leading-relaxed">{insight.description}</p>
        {insight.suggestedAction && (
          <p className="text-[11px] text-tempo-600 mt-1.5 flex items-center gap-1 font-medium">
            <Lightbulb size={10} /> {insight.suggestedAction}
          </p>
        )}
      </div>
      <div className={cn('w-1.5 h-1.5 rounded-full mt-1.5 shrink-0', cfg.dot)} />
    </div>
  )
}

// ---- Anomaly Item ----

function AnomalyItem({ anomaly }: { anomaly: AIAnomaly }) {
  const cfg = severityConfig(anomaly.severity)
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-lg border', cfg.bg, cfg.border)}>
      <div className={cn('mt-0.5 shrink-0', cfg.color)}><AlertTriangle size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-t1">{anomaly.metric}</p>
        <p className="text-[11px] text-t3 mt-0.5">{anomaly.explanation}</p>
        <div className="flex gap-3 mt-1.5">
          <span className="text-[10px] text-t3">Expected: {typeof anomaly.expectedValue === 'number' ? anomaly.expectedValue.toLocaleString() : anomaly.expectedValue}</span>
          <span className="text-[10px] font-medium text-red-600">Actual: {typeof anomaly.currentValue === 'number' ? anomaly.currentValue.toLocaleString() : anomaly.currentValue}</span>
          <span className="text-[10px] text-amber-600">({anomaly.deviationPercent > 0 ? '+' : ''}{anomaly.deviationPercent.toFixed(0)}%)</span>
        </div>
      </div>
    </div>
  )
}

// ---- Recommendation Item ----

function RecommendationItem({ rec }: { rec: AIRecommendation }) {
  const impactColors = { high: 'text-green-600 bg-green-50', medium: 'text-amber-600 bg-amber-50', low: 'text-gray-600 bg-gray-50' }
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg border border-tempo-200 bg-tempo-50/50">
      <div className="mt-0.5 shrink-0 text-tempo-600"><Lightbulb size={14} /></div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-t1">{rec.title}</p>
        <p className="text-[11px] text-t3 mt-0.5 leading-relaxed">{rec.rationale}</p>
        <div className="flex gap-2 mt-1.5">
          <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', impactColors[rec.impact])}>
            {rec.impact} impact
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-medium">
            {rec.effort} effort
          </span>
        </div>
      </div>
    </div>
  )
}

// ---- Score Ring ----

export function AIScoreRing({ score, label, size = 48 }: { score: AIScore; label?: string; size?: number }) {
  const val = Math.round(score.value)
  const r = (size - 6) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (val / 100) * circ
  const color = val >= 75 ? '#16a34a' : val >= 50 ? '#d97706' : '#dc2626'
  return (
    <div className="flex items-center gap-3">
      <svg width={size} height={size} className="shrink-0">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={3} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`} className="transition-all duration-700" />
        <text x={size / 2} y={size / 2} textAnchor="middle" dominantBaseline="central"
          className="text-xs font-bold" fill={color}>{val}</text>
      </svg>
      <div>
        <p className="text-xs font-medium text-t1">{label || score.label}</p>
        {score.trend && (
          <p className={cn('text-[10px] flex items-center gap-0.5', score.trend === 'up' ? 'text-green-600' : score.trend === 'down' ? 'text-red-600' : 'text-gray-500')}>
            <TrendingUp size={10} className={score.trend === 'down' ? 'rotate-180' : score.trend === 'stable' ? 'rotate-0' : ''} />
            {score.trend === 'up' ? 'Trending up' : score.trend === 'down' ? 'Trending down' : 'Stable'}
          </p>
        )}
      </div>
    </div>
  )
}

// ---- Main Card ----

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
      'rounded-[var(--radius-card)] border border-tempo-200 bg-gradient-to-br from-tempo-50/80 via-white to-purple-50/40 overflow-hidden',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-tempo-100">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-tempo-500 to-purple-600 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <h3 className="text-xs font-semibold text-t1">{title}</h3>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-tempo-100 text-tempo-700 font-semibold tracking-wide uppercase">AI</span>
        </div>
        {totalItems > 0 && (
          <span className="text-[10px] text-t3">
            {insights.filter(i => i.severity === 'critical').length > 0 && (
              <span className="text-red-600 font-medium mr-2">{insights.filter(i => i.severity === 'critical').length} critical</span>
            )}
            {totalItems} insight{totalItems !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Scores row */}
      {scores.length > 0 && (
        <div className="flex items-center gap-6 px-4 py-3 border-b border-tempo-100 overflow-x-auto">
          {scores.map((s, i) => (
            <AIScoreRing key={i} score={s.score} label={s.label} />
          ))}
        </div>
      )}

      {/* Items */}
      <div className="p-3 space-y-2">
        {visibleInsights.map(insight => <InsightItem key={insight.id} insight={insight} />)}
        {visibleAnomalies.map(anomaly => <AnomalyItem key={anomaly.id} anomaly={anomaly} />)}
        {visibleRecs.map(rec => <RecommendationItem key={rec.id} rec={rec} />)}
      </div>

      {/* Show more / less */}
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full px-4 py-2 text-[11px] font-medium text-tempo-600 hover:bg-tempo-50 transition-colors flex items-center justify-center gap-1 border-t border-tempo-100"
        >
          {expanded ? 'Show less' : `Show all ${totalItems} insights`}
          <ChevronRight size={12} className={cn('transition-transform', expanded && 'rotate-90')} />
        </button>
      )}
    </div>
  )
}
