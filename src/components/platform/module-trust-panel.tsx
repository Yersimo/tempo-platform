'use client'

import { type ReactNode } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, Database, FileSearch, ShieldCheck } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils/cn'

type TrustTone = 'success' | 'warning' | 'neutral'

interface TrustCheck {
  label: string
  detail: string
  tone?: TrustTone
}

interface TrustAction {
  label: string
  description: string
  onClick?: () => void
  href?: string
}

interface ModuleTrustPanelProps {
  title: string
  score: number
  summary: string
  checks: TrustCheck[]
  evidence: string[]
  actions: TrustAction[]
  icon?: ReactNode
  className?: string
}

const checkToneClasses: Record<TrustTone, string> = {
  success: 'border-green-200 bg-green-50 text-green-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  neutral: 'border-border bg-birch/35 text-t2',
}

export function ModuleTrustPanel({
  title,
  score,
  summary,
  checks,
  evidence,
  actions,
  icon,
  className,
}: ModuleTrustPanelProps) {
  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)))
  const progressColor = normalizedScore >= 80 ? 'success' : normalizedScore >= 60 ? 'warning' : 'orange'

  return (
    <section className={cn('mb-6 rounded-[var(--radius-card)] border border-border bg-card shadow-[var(--shadow-card)]', className)}>
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="p-5 md:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Badge variant="default"><ShieldCheck size={12} /> Trust layer</Badge>
            <Badge variant="info">Review mode</Badge>
          </div>
          <div className="grid gap-5 md:grid-cols-[1fr_220px] md:items-start">
            <div className="min-w-0">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-card)] border border-border bg-birch/50 text-tempo-700">
                  {icon || <FileSearch size={18} />}
                </div>
                <h2 className="text-lg font-semibold leading-tight text-t1">{title}</h2>
              </div>
              <p className="max-w-3xl text-sm leading-6 text-t2">{summary}</p>
            </div>

            <div className="rounded-[var(--radius-card)] border border-divider bg-birch/35 p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-xs font-medium text-t3">Confidence</span>
                <span className="text-2xl font-semibold text-t1 tabular-nums">{normalizedScore}%</span>
              </div>
              <Progress value={normalizedScore} color={progressColor} className="mt-3" />
              <p className="mt-3 text-[11px] text-t3">
                Directional readiness based on visible checks, evidence coverage, and safe next actions.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {checks.map((check) => (
              <div key={check.label} className={cn('rounded-[var(--radius-card)] border p-3', checkToneClasses[check.tone || 'neutral'])}>
                <div className="flex items-start gap-2">
                  {check.tone === 'warning' ? (
                    <AlertTriangle size={15} className="mt-0.5 shrink-0" />
                  ) : (
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{check.label}</div>
                    <div className="mt-1 text-[11px] leading-5 opacity-80">{check.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-divider bg-birch/25 p-5 md:p-6 lg:border-l lg:border-t-0">
          <div className="mb-3 flex items-center gap-2">
            <Database size={15} className="text-tempo-700" />
            <h3 className="text-sm font-semibold text-t1">Evidence to trust</h3>
          </div>
          <ul className="space-y-2">
            {evidence.map((item) => (
              <li key={item} className="flex items-start gap-2 text-[11px] leading-5 text-t3">
                <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-green-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>

          <div className="mt-5 border-t border-divider pt-4">
            <h4 className="mb-2 text-xs font-semibold text-t2">Safe next actions</h4>
            <div className="space-y-2">
              {actions.map((action) => {
                const content = (
                  <>
                    <div className="min-w-0 flex-1 text-left">
                      <div className="text-sm font-medium text-t1">{action.label}</div>
                      <div className="mt-0.5 text-[11px] leading-4 text-t3">{action.description}</div>
                    </div>
                    <ArrowRight size={14} className="shrink-0 text-t3" />
                  </>
                )

                if (action.href) {
                  return (
                    <a
                      key={action.label}
                      href={action.href}
                      className="flex items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-card px-3 py-2.5 transition-colors hover:border-tempo-200 hover:bg-snow"
                    >
                      {content}
                    </a>
                  )
                }

                return (
                  <Button
                    key={action.label}
                    type="button"
                    variant="ghost"
                    className="h-auto w-full justify-between gap-3 border border-border bg-card px-3 py-2.5 hover:border-tempo-200 hover:bg-snow"
                    onClick={action.onClick}
                  >
                    {content}
                  </Button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
