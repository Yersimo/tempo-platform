'use client'

import { useTempo } from '@/lib/store'
import { Modal } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  CheckCircle2, Circle, ArrowRight, FileText,
  ClipboardCheck, Eye, Shield, Info
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import type { Journey, JourneyStep } from '@/lib/demo-data'

interface JourneyWizardProps {
  journey: Journey
  open: boolean
  onClose: () => void
}

function stepTypeIcon(type: JourneyStep['type']) {
  switch (type) {
    case 'task': return <ClipboardCheck size={14} />
    case 'form': return <FileText size={14} />
    case 'review': return <Eye size={14} />
    case 'approval': return <Shield size={14} />
    case 'info': return <Info size={14} />
    default: return <Circle size={14} />
  }
}

export function JourneyWizard({ journey, open, onClose }: JourneyWizardProps) {
  const { updateJourneyStep } = useTempo()
  const router = useRouter()

  const completedSteps = journey.steps.filter(s => s.status === 'completed').length
  const totalSteps = journey.steps.length
  const progressPercent = Math.round((completedSteps / totalSteps) * 100)

  // Find current active step
  const activeStepIndex = journey.steps.findIndex(s => s.status === 'in_progress' || s.status === 'pending')
  const activeStep = activeStepIndex >= 0 ? journey.steps[activeStepIndex] : null

  return (
    <Modal open={open} onClose={onClose} title={journey.title} size="lg">
      {/* Journey header */}
      <div className="mb-6">
        <p className="text-xs text-t2 mb-3">{journey.description}</p>
        <div className="flex items-center gap-4 mb-2">
          <Progress value={progressPercent} showLabel />
          <span className="text-xs text-t3 whitespace-nowrap">{completedSteps}/{totalSteps} steps</span>
        </div>
        {journey.due_date && (
          <p className="text-[0.65rem] text-t3">Due: {new Date(journey.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        )}
      </div>

      {/* Step list with wizard layout */}
      <div className="flex gap-6">
        {/* Left: vertical step list */}
        <div className="w-56 flex-shrink-0">
          <div className="space-y-1">
            {journey.steps.map((step, i) => {
              const isActive = i === activeStepIndex
              const isCompleted = step.status === 'completed'
              const isSkipped = step.status === 'skipped'

              return (
                <div
                  key={step.id}
                  className={cn(
                    'flex items-start gap-3 px-3 py-2.5 rounded-lg transition-all text-left',
                    isActive ? 'bg-tempo-50 border border-tempo-200' :
                    isCompleted ? 'bg-green-50/50' :
                    'hover:bg-canvas'
                  )}
                >
                  {/* Step indicator */}
                  <div className={cn(
                    'flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5',
                    isCompleted ? 'bg-green-100 text-green-600' :
                    isActive ? 'bg-tempo-100 text-tempo-600' :
                    isSkipped ? 'bg-gray-100 text-gray-400 line-through' :
                    'bg-gray-100 text-gray-400'
                  )}>
                    {isCompleted ? <CheckCircle2 size={14} /> : <span className="text-[0.6rem] font-semibold">{i + 1}</span>}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      'text-xs font-medium truncate',
                      isCompleted ? 'text-green-700' :
                      isActive ? 'text-tempo-700' :
                      isSkipped ? 'text-t3 line-through' :
                      'text-t2'
                    )}>
                      {step.title}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <span className="text-[0.6rem] text-t3">{stepTypeIcon(step.type)}</span>
                      <Badge variant={
                        isCompleted ? 'success' :
                        isActive ? 'orange' :
                        isSkipped ? 'default' :
                        'default'
                      } className="text-[0.55rem]">
                        {step.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: active step content */}
        <div className="flex-1 border-l border-divider pl-6">
          {activeStep ? (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-tempo-600">{stepTypeIcon(activeStep.type)}</span>
                <h3 className="text-sm font-semibold text-t1">{activeStep.title}</h3>
              </div>
              <p className="text-xs text-t2 mb-6 leading-relaxed">{activeStep.description}</p>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    updateJourneyStep(journey.id, activeStep.id, 'completed')
                  }}
                >
                  <CheckCircle2 size={14} /> Mark Complete
                </Button>
                {activeStep.action_href && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      router.push(activeStep.action_href!)
                      onClose()
                    }}
                  >
                    <ArrowRight size={14} /> Go to Module
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    updateJourneyStep(journey.id, activeStep.id, 'skipped')
                  }}
                >
                  Skip
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2 size={32} className="mx-auto text-green-500 mb-3" />
              <h3 className="text-sm font-semibold text-t1 mb-1">Journey Complete!</h3>
              <p className="text-xs text-t3">All steps have been completed or skipped.</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t border-divider mt-6">
        <Button variant="secondary" onClick={onClose}>Close</Button>
      </div>
    </Modal>
  )
}
