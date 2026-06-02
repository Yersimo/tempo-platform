'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles, Target, TrendingUp } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

type Tone = 'neutral' | 'success' | 'warning' | 'ai'

interface CommandCenterMetric {
  label: string
  value: string | number
  tone?: Tone
}

interface CommandCenterAction {
  label: string
  description: string
  onClick?: () => void
  href?: string
}

interface ModuleCommandCenterProps {
  moduleName: string
  benchmark: string
  score: number
  scoreLabel: string
  summary: string
  metrics: CommandCenterMetric[]
  focusAreas: string[]
  actions: CommandCenterAction[]
  className?: string
}

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-birch/60 text-t2 border-border',
  success: 'bg-green-50 text-green-700 border-green-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  ai: 'bg-tempo-50 text-tempo-800 border-tempo-200',
}

export function ModuleCommandCenter({
  moduleName,
  benchmark,
  score,
  scoreLabel,
  summary,
  metrics,
  focusAreas,
  actions,
  className,
}: ModuleCommandCenterProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))
  const progressColor = normalizedScore >= 80 ? 'success' : normalizedScore >= 60 ? 'warning' : 'orange'

  return (
    <section className={cn('mb-6 rounded-[var(--radius-card)] border border-border bg-card/96 shadow-[var(--shadow-card)]', className)}>
      <div className="grid gap-0 lg:grid-cols-[1.25fr_0.75fr]">
        <div className="p-5 md:p-6">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <Badge variant="ai"><Sparkles size={12} /> Benchmark-led</Badge>
            <Badge variant="default">{moduleName}</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-start">
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-t3 font-semibold mb-2">
                Target experience
              </p>
              <h2 className="text-xl md:text-2xl font-semibold text-t1 leading-tight">
                {benchmark}
              </h2>
              <p className="text-sm text-t3 mt-2 max-w-2xl">
                {summary}
              </p>
            </div>
            <div className="rounded-[var(--radius-card)] border border-divider bg-birch/35 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-t3">{scoreLabel}</span>
                <span className="text-2xl font-semibold text-t1 tabular-nums">{normalizedScore}%</span>
              </div>
              <Progress value={normalizedScore} color={progressColor} className="mt-3" />
              <p className="text-[11px] text-t3 mt-3">
                A directional readiness score based on visible demo data and workflow coverage.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5">
            {metrics.map((metric) => (
              <div key={metric.label} className={cn('rounded-[var(--radius-card)] border px-3 py-2.5', toneClasses[metric.tone || 'neutral'])}>
                <div className="text-lg font-semibold leading-none tabular-nums">{metric.value}</div>
                <div className="text-[11px] mt-1 opacity-80">{metric.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t lg:border-t-0 lg:border-l border-divider bg-birch/25 p-5 md:p-6">
          <div className="flex items-center gap-2 mb-3">
            <Target size={16} className="text-tempo-700" />
            <h3 className="text-sm font-semibold text-t1">Next best moves</h3>
          </div>
          <div className="space-y-2.5">
            {actions.map((action) => {
              const content = (
                <>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-t1">{action.label}</div>
                    <div className="text-[11px] text-t3 mt-0.5">{action.description}</div>
                  </div>
                  <ArrowRight size={15} className="text-t3 flex-shrink-0" />
                </>
              )

              if (action.href) {
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-card px-3 py-2.5 hover:border-tempo-200 hover:bg-snow transition-colors"
                  >
                    {content}
                  </Link>
                )
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  onClick={action.onClick}
                  className="w-full flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-card px-3 py-2.5 text-left hover:border-tempo-200 hover:bg-snow transition-colors"
                >
                  {content}
                </button>
              )
            })}
          </div>

          <div className="mt-5 pt-4 border-t border-divider">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={15} className="text-tempo-700" />
              <h4 className="text-xs font-semibold text-t2">Quality focus</h4>
            </div>
            <ul className="space-y-1.5">
              {focusAreas.map((area) => (
                <li key={area} className="flex items-start gap-2 text-[11px] text-t3">
                  <CheckCircle2 size={13} className="text-green-600 mt-0.5 flex-shrink-0" />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
