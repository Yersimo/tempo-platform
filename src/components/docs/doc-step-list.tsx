'use client'

import { cn } from '@/lib/utils/cn'
import { Lightbulb } from 'lucide-react'
import { DocScreenshot } from './doc-screenshot'
import type { DocStep } from '@/lib/docs/types'

interface DocStepListProps {
  steps: DocStep[]
  className?: string
}

export function DocStepList({ steps, className }: DocStepListProps) {
  return (
    <ol className={cn('space-y-6', className)}>
      {steps.map((step) => (
        <li key={step.number} className="relative pl-10">
          {/* Step number circle */}
          <div className="absolute left-0 top-0.5 w-7 h-7 rounded-full bg-tempo-50 text-tempo-600 flex items-center justify-center text-xs font-bold">
            {step.number}
          </div>

          {/* Connector line between steps */}
          {step.number < steps.length && (
            <div className="absolute left-[13px] top-8 bottom-0 w-px bg-border" />
          )}

          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-t1">{step.title}</h4>
            <p className="text-sm text-t2 leading-relaxed">{step.description}</p>

            {step.screenshotKey && (
              <DocScreenshot
                screenshotKey={step.screenshotKey}
                alt={`Step ${step.number}: ${step.title}`}
                className="mt-3"
              />
            )}

            {step.tip && (
              <div className="mt-3 flex items-start gap-2.5 p-3 rounded-lg bg-tempo-50/50 border border-tempo-200/50">
                <Lightbulb size={14} className="text-tempo-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-t2 leading-relaxed">{step.tip}</p>
              </div>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
