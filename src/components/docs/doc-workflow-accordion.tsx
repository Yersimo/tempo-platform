'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { ChevronDown, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { DocStepList } from './doc-step-list'
import type { DocWorkflow } from '@/lib/docs/types'

const ROLE_LABELS: Record<string, string> = {
  owner: 'Owner',
  admin: 'Admin',
  hrbp: 'HRBP',
  manager: 'Manager',
  employee: 'Employee',
}

interface DocWorkflowAccordionProps {
  workflow: DocWorkflow
  defaultOpen?: boolean
  className?: string
}

export function DocWorkflowAccordion({
  workflow,
  defaultOpen = false,
  className,
}: DocWorkflowAccordionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      className={cn(
        'border border-border rounded-[var(--radius-card)] overflow-hidden transition-colors',
        isOpen && 'border-tempo-200/60',
        className
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-canvas/50 transition-colors"
        aria-expanded={isOpen}
      >
        <ChevronDown
          size={16}
          className={cn(
            'text-t3 flex-shrink-0 transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
        />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-t1">{workflow.title}</h3>
          <p className="text-xs text-t3 mt-0.5 line-clamp-1">
            {workflow.description}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {workflow.estimatedTime && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[0.65rem] text-t3">
              <Clock size={11} />
              {workflow.estimatedTime}
            </span>
          )}
          {workflow.roles?.map((role) => (
            <Badge key={role} variant="info" className="hidden sm:inline-flex">
              {ROLE_LABELS[role] || role}
            </Badge>
          ))}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pt-1 border-t border-divider">
          {workflow.prerequisites && workflow.prerequisites.length > 0 && (
            <div className="mb-4 p-3 rounded-lg bg-canvas border border-divider">
              <p className="text-xs font-medium text-t2 mb-1.5">Prerequisites</p>
              <ul className="space-y-1">
                {workflow.prerequisites.map((prereq, i) => (
                  <li key={i} className="text-xs text-t3 flex items-start gap-2">
                    <span className="text-tempo-600 mt-px">&#8226;</span>
                    {prereq}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Mobile-only role and time badges */}
          <div className="flex items-center gap-2 mb-4 sm:hidden">
            {workflow.estimatedTime && (
              <span className="inline-flex items-center gap-1 text-[0.65rem] text-t3">
                <Clock size={11} />
                {workflow.estimatedTime}
              </span>
            )}
            {workflow.roles?.map((role) => (
              <Badge key={role} variant="info">
                {ROLE_LABELS[role] || role}
              </Badge>
            ))}
          </div>

          <DocStepList steps={workflow.steps} />
        </div>
      )}
    </div>
  )
}
