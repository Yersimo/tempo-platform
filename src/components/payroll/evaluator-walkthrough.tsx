'use client'

import { cn } from '@/lib/utils/cn'
import { Check, ChevronRight, X, Play } from 'lucide-react'

// ─── Step definitions ────────────────────────────────────────────────
// Hardcoded 10-step Ghana payroll evaluation walkthrough.

interface WalkthroughStep {
  number: number
  title: string
  shortTitle: string
  description: string
}

const WALKTHROUGH_STEPS: WalkthroughStep[] = [
  {
    number: 1,
    title: 'Create Pay Run',
    shortTitle: 'Create',
    description:
      "Navigate to New Pay Run. Select 'Ghana — Ecobank Evaluation Group' (25 employees). Select period: April 2026.",
  },
  {
    number: 2,
    title: 'Review the Register',
    shortTitle: 'Register',
    description:
      "Review each employee's gross pay, SSNIT contributions (13% employer, 5.5% employee per Act 766), PAYE tax, and net pay.",
  },
  {
    number: 3,
    title: 'Review AI Compliance Flags',
    shortTitle: 'Flags',
    description:
      'The AI compliance layer will surface 3 items requiring your attention before submission.',
  },
  {
    number: 4,
    title: 'Resolve Flags',
    shortTitle: 'Resolve',
    description:
      'Address each flagged item. You can acknowledge, override with a reason, or pause the run.',
  },
  {
    number: 5,
    title: 'Submit for HR Approval',
    shortTitle: 'Submit',
    description:
      'Submit the run. Status changes to Pending HR Approval.',
  },
  {
    number: 6,
    title: 'Approve as HR',
    shortTitle: 'HR',
    description:
      'Switch to the HR approval view. Review and approve with a comment.',
  },
  {
    number: 7,
    title: 'Approve as Finance',
    shortTitle: 'Finance',
    description:
      'Switch to the Finance approval view. Review total cost impact and approve.',
  },
  {
    number: 8,
    title: 'Export GhIPSS Bank File',
    shortTitle: 'Export',
    description:
      'Export the payment file in GhIPSS format accepted by Ghanaian banks.',
  },
  {
    number: 9,
    title: 'Mark as Paid',
    shortTitle: 'Paid',
    description:
      'Confirm bank file submission. Mark the run as Paid.',
  },
  {
    number: 10,
    title: 'Review Payslips',
    shortTitle: 'Payslips',
    description:
      'Navigate to any employee payslip. Then open Reconciliation for period comparison.',
  },
]

// ─── Pulsing keyframes (injected once via style tag alternative: Tailwind arbitrary) ──

const PULSE_ANIMATION_STYLE = `
@keyframes evaluator-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.35); }
  50% { box-shadow: 0 0 0 6px rgba(99, 102, 241, 0); }
}
`

// ─── Props ───────────────────────────────────────────────────────────

interface EvaluatorWalkthroughProps {
  evaluatorName: string
  payrollGroupName: string
  currentStep: number
  completedSteps: Set<number>
  onStepComplete?: (step: number) => void
  onStepClick?: (step: number) => void
  onDismiss: () => void
  onResumeRequest?: () => void
  className?: string
}

// ─── Step Indicator ──────────────────────────────────────────────────

function StepIndicator({
  step,
  isCompleted,
  isCurrent,
  isClickable,
  onClick,
}: {
  step: WalkthroughStep
  isCompleted: boolean
  isCurrent: boolean
  isClickable: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!isClickable}
      className={cn(
        'flex flex-col items-center gap-1.5 min-w-0 bg-transparent border-none p-0',
        isClickable && 'cursor-pointer group'
      )}
      title={isClickable ? `Go to Step ${step.number}: ${step.title}` : step.title}
    >
      {/* Circle */}
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-300 shrink-0',
          isCompleted &&
            'bg-indigo-500 text-white',
          isCurrent &&
            'bg-indigo-100 text-indigo-600 ring-2 ring-indigo-400/50',
          !isCompleted &&
            !isCurrent &&
            'bg-gray-100 text-gray-400',
          isClickable && !isCurrent &&
            'group-hover:ring-2 group-hover:ring-indigo-300/50 group-hover:scale-110'
        )}
        style={
          isCurrent
            ? { animation: 'evaluator-pulse 2.2s ease-in-out infinite' }
            : undefined
        }
      >
        {isCompleted ? <Check size={14} strokeWidth={2.5} /> : step.number}
      </div>
      {/* Label */}
      <span
        className={cn(
          'text-[9px] font-medium tracking-wide text-center leading-tight truncate max-w-[52px]',
          isCompleted && 'text-indigo-600',
          isCurrent && 'text-indigo-600',
          !isCompleted && !isCurrent && 'text-gray-400'
        )}
      >
        {step.shortTitle}
      </span>
    </button>
  )
}

// ─── Connector Line ──────────────────────────────────────────────────

function StepConnector({ filled }: { filled: boolean }) {
  return (
    <div
      className={cn(
        'flex-1 h-[2px] rounded-full mt-[-14px] min-w-[8px] transition-colors duration-300',
        filled ? 'bg-indigo-400' : 'bg-gray-200'
      )}
    />
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function EvaluatorWalkthrough({
  evaluatorName,
  payrollGroupName,
  currentStep,
  completedSteps,
  onStepComplete,
  onStepClick,
  onDismiss,
  className,
}: EvaluatorWalkthroughProps) {
  const current = WALKTHROUGH_STEPS.find((s) => s.number === currentStep) || WALKTHROUGH_STEPS[0]
  const totalCompleted = completedSteps.size
  const progressPercent = Math.round((totalCompleted / WALKTHROUGH_STEPS.length) * 100)

  return (
    <>
      {/* Inject pulse animation */}
      <style dangerouslySetInnerHTML={{ __html: PULSE_ANIMATION_STYLE }} />

      <div
        className={cn(
          'rounded-2xl border border-border/80 bg-white overflow-hidden',
          className
        )}
      >
        {/* ── Header ──────────────────────────────────────────── */}
        <div className="relative px-5 py-4 border-b border-border/60">
          {/* Dismiss button */}
          <button
            onClick={onDismiss}
            className="absolute top-3.5 right-3.5 w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Dismiss walkthrough"
          >
            <X size={16} />
          </button>

          <div className="pr-8">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-7 h-7 rounded-[10px] bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                <Play size={13} fill="white" stroke="white" />
              </div>
              <h3 className="text-[13px] font-semibold text-t1 tracking-[-0.01em]">
                {payrollGroupName} — April 2026
              </h3>
              <span className="text-[9px] px-1.5 py-[2px] rounded-md bg-indigo-50 text-indigo-600 font-semibold tracking-widest uppercase">
                Guide
              </span>
            </div>
            <p className="text-[12px] text-t3 leading-relaxed max-w-[640px]">
              Welcome, {evaluatorName}. This walkthrough guides you through a
              complete Ghana payroll cycle. All data reflects realistic statutory
              calculations for your review.
            </p>
          </div>

          {/* Progress summary */}
          <div className="flex items-center gap-3 mt-3">
            <div className="flex-1 h-[3px] rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[10px] font-medium text-t3 tabular-nums shrink-0">
              {totalCompleted}/{WALKTHROUGH_STEPS.length}
            </span>
          </div>
        </div>

        {/* ── Horizontal Stepper ──────────────────────────────── */}
        <div className="px-5 py-4 border-b border-border/60 overflow-x-auto">
          <div className="flex items-start gap-1 min-w-max">
            {WALKTHROUGH_STEPS.map((step, idx) => {
              const isCompleted = completedSteps.has(step.number)
              const isCurrent = step.number === currentStep
              // Allow clicking completed steps, the current step, and the next available step
              const maxReachable = Math.max(1, ...Array.from(completedSteps)) + 1
              const isClickable = !!(onStepClick && (isCompleted || isCurrent || step.number <= maxReachable))
              // Connector is "filled" if the step before it is completed
              const showConnector = idx > 0
              const connectorFilled = idx > 0 && completedSteps.has(WALKTHROUGH_STEPS[idx - 1].number)

              return (
                <div key={step.number} className="flex items-start">
                  {showConnector && (
                    <div className="flex items-center pt-[13px] px-0.5">
                      <StepConnector filled={connectorFilled} />
                    </div>
                  )}
                  <StepIndicator
                    step={step}
                    isCompleted={isCompleted}
                    isCurrent={isCurrent}
                    isClickable={isClickable}
                    onClick={isClickable ? () => onStepClick(step.number) : undefined}
                  />
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Current Step Detail ─────────────────────────────── */}
        <div className="px-5 py-4">
          <div className="rounded-xl bg-gray-50/60 px-4 py-3.5">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-semibold text-indigo-500 tracking-wider uppercase">
                Step {current.number} of {WALKTHROUGH_STEPS.length}
              </span>
              {completedSteps.has(current.number) && (
                <span className="text-[9px] px-1.5 py-[1px] rounded-full bg-emerald-50 text-emerald-600 font-medium">
                  Completed
                </span>
              )}
            </div>
            <h4 className="text-[14px] font-semibold text-t1 tracking-[-0.01em] mb-1">
              {current.title}
            </h4>
            <p className="text-[12px] text-t3 leading-relaxed">
              {current.description}
            </p>

            {/* Mark Complete button — hidden if already completed */}
            {onStepComplete && !completedSteps.has(current.number) && (
              <button
                onClick={() => onStepComplete(current.number)}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-indigo-500 text-white text-[12px] font-medium hover:bg-indigo-600 transition-colors"
              >
                <Check size={13} strokeWidth={2.5} />
                Mark Complete
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// ─── Resume Button ───────────────────────────────────────────────────
// Small button for the payroll page header when the walkthrough is dismissed.

export function ResumeWalkthroughButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-600 text-[12px] font-medium hover:bg-indigo-100 transition-colors"
    >
      <Play size={12} fill="currentColor" stroke="currentColor" />
      Resume Walkthrough
      <ChevronRight size={13} />
    </button>
  )
}
