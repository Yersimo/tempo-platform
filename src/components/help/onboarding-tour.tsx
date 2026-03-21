'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils/cn'

interface TourStep {
  /** CSS selector for the element to highlight */
  target: string
  /** Title shown in the tooltip */
  title: string
  /** Description shown in the tooltip */
  description: string
  /** Preferred position of the tooltip */
  position?: 'top' | 'bottom' | 'left' | 'right'
}

interface TourConfig {
  /** Unique ID for the tour (used for localStorage tracking) */
  id: string
  /** Which page path triggers this tour */
  path: string
  /** Steps in the tour */
  steps: TourStep[]
}

const TOURS: TourConfig[] = [
  {
    id: 'dashboard-tour',
    path: '/dashboard',
    steps: [
      {
        target: '[data-tour="sidebar"]',
        title: 'Navigation Sidebar',
        description: 'Use the sidebar to navigate between modules. All your HR, Finance, IT, and strategic tools are organized into clear categories.',
        position: 'right',
      },
      {
        target: '[data-tour="stats-grid"], .grid',
        title: 'KPI Overview Cards',
        description: 'These cards show your key workforce metrics at a glance: headcount, attrition, open requisitions, and payroll spend. Click any card to drill down.',
        position: 'bottom',
      },
      {
        target: '[data-tour="main-content"], main',
        title: 'Main Content Area',
        description: 'The main area displays detailed data, charts, and tables. Each module has its own specialized views and tools.',
        position: 'bottom',
      },
      {
        target: '[data-tour="help-button"]',
        title: 'Get Help Anytime',
        description: 'Click this button or press "?" on your keyboard to open contextual help for the current page. You\'ll find workflows, tips, and FAQs.',
        position: 'left',
      },
    ],
  },
  {
    id: 'people-tour',
    path: '/people',
    steps: [
      {
        target: 'input[type="text"], input[type="search"], [data-tour="search"]',
        title: 'Employee Search',
        description: 'Search for employees by name, email, job title, or department. Results update as you type.',
        position: 'bottom',
      },
      {
        target: 'table, [data-tour="employee-table"]',
        title: 'Employee Directory',
        description: 'View and manage your workforce directory. Click any row to open an employee profile with full details.',
        position: 'bottom',
      },
    ],
  },
  {
    id: 'recruiting-tour',
    path: '/recruiting',
    steps: [
      {
        target: '[data-tour="pipeline"], .grid',
        title: 'Recruiting Pipeline',
        description: 'Track candidates through your hiring pipeline. View open requisitions, candidates in each stage, and hiring progress.',
        position: 'bottom',
      },
    ],
  },
]

const STORAGE_PREFIX = 'tempo_tour_completed_'

export function OnboardingTour() {
  const pathname = usePathname()
  const [activeTour, setActiveTour] = useState<TourConfig | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  const [spotlightRect, setSpotlightRect] = useState<DOMRect | null>(null)
  const [tooltipPos, setTooltipPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 })
  const tooltipRef = useRef<HTMLDivElement>(null)


  // Check if tour should activate for current page
  useEffect(() => {
    const tour = TOURS.find(t => t.path === pathname)
    if (!tour) {
      setActiveTour(null)
      return
    }

    try {
      const completed = localStorage.getItem(STORAGE_PREFIX + tour.id)
      if (completed) {
        setActiveTour(null)
        return
      }
    } catch {
      // localStorage not available
    }

    // Delay to let the page render
    const timeout = setTimeout(() => {
      // Check if target element exists
      const firstTarget = document.querySelector(tour.steps[0].target)
      if (firstTarget) {
        setActiveTour(tour)
        setCurrentStep(0)
      }
    }, 1500)

    return () => clearTimeout(timeout)
  }, [pathname])

  // Position the spotlight and tooltip
  const updatePosition = useCallback(() => {
    if (!activeTour) return

    const step = activeTour.steps[currentStep]
    if (!step) return

    const el = document.querySelector(step.target)
    if (!el) {
      // Skip to next step if target not found
      if (currentStep < activeTour.steps.length - 1) {
        setCurrentStep(prev => prev + 1)
      } else {
        completeTour()
      }
      return
    }

    const rect = el.getBoundingClientRect()
    setSpotlightRect(rect)

    // Calculate tooltip position
    const padding = 16
    const tooltipWidth = 320
    const tooltipHeight = 180
    const pos = step.position || 'bottom'

    let top = 0
    let left = 0

    switch (pos) {
      case 'bottom':
        top = rect.bottom + padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'top':
        top = rect.top - tooltipHeight - padding
        left = rect.left + rect.width / 2 - tooltipWidth / 2
        break
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.right + padding
        break
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2
        left = rect.left - tooltipWidth - padding
        break
    }

    // Clamp to viewport
    left = Math.max(padding, Math.min(left, window.innerWidth - tooltipWidth - padding))
    top = Math.max(padding, Math.min(top, window.innerHeight - tooltipHeight - padding))

    setTooltipPos({ top, left })
  }, [activeTour, currentStep])

  useEffect(() => {
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)

    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [updatePosition])

  const completeTour = useCallback(() => {
    if (activeTour) {
      try {
        localStorage.setItem(STORAGE_PREFIX + activeTour.id, 'true')
      } catch { /* ignore */ }
    }
    setActiveTour(null)
    setCurrentStep(0)
  }, [activeTour])

  const handleNext = useCallback(() => {
    if (!activeTour) return
    if (currentStep < activeTour.steps.length - 1) {
      setCurrentStep(prev => prev + 1)
    } else {
      completeTour()
    }
  }, [activeTour, currentStep, completeTour])

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1)
    }
  }, [currentStep])

  const handleSkip = useCallback(() => {
    completeTour()
  }, [completeTour])

  if (!activeTour || !spotlightRect) return null

  const step = activeTour.steps[currentStep]
  const isLastStep = currentStep === activeTour.steps.length - 1

  return (
    <div className="fixed inset-0 z-[60]" aria-label="Onboarding tour" role="dialog" aria-modal="true">
      {/* Overlay with spotlight cutout using CSS */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={handleSkip}>
        <defs>
          <mask id="tour-spotlight-mask">
            <rect width="100%" height="100%" fill="white" />
            <rect
              x={spotlightRect.left - 6}
              y={spotlightRect.top - 6}
              width={spotlightRect.width + 12}
              height={spotlightRect.height + 12}
              rx="8"
              fill="black"
            />
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.5)"
          mask="url(#tour-spotlight-mask)"
        />
      </svg>

      {/* Spotlight ring */}
      <div
        className="absolute border-2 border-tempo-400 rounded-lg pointer-events-none animate-pulse"
        style={{
          left: spotlightRect.left - 6,
          top: spotlightRect.top - 6,
          width: spotlightRect.width + 12,
          height: spotlightRect.height + 12,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute w-80 bg-card border border-border rounded-xl shadow-2xl pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
        style={{ top: tooltipPos.top, left: tooltipPos.left }}
      >
        <div className="px-4 py-3">
          {/* Header */}
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-tempo-600" />
              <h3 className="text-sm font-semibold text-t1">{step.title}</h3>
            </div>
            <button
              onClick={handleSkip}
              className="p-1 rounded text-t3 hover:text-t1 hover:bg-canvas transition-colors"
              aria-label="Skip tour"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <p className="text-xs text-t2 leading-relaxed">{step.description}</p>

          {/* Progress and navigation */}
          <div className="flex items-center justify-between mt-4">
            {/* Progress dots */}
            <div className="flex items-center gap-1">
              {activeTour.steps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'w-1.5 h-1.5 rounded-full transition-colors',
                    i === currentStep ? 'bg-tempo-600' : i < currentStep ? 'bg-tempo-300' : 'bg-border',
                  )}
                />
              ))}
              <span className="text-[10px] text-t3 ml-2">
                {currentStep + 1} of {activeTour.steps.length}
              </span>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2">
              {currentStep > 0 && (
                <button
                  onClick={handlePrev}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-t2 hover:text-t1 rounded hover:bg-canvas transition-colors"
                >
                  <ChevronLeft size={12} />
                  Back
                </button>
              )}
              <button
                onClick={handleNext}
                className="flex items-center gap-1 px-3 py-1 text-xs font-medium text-white bg-tempo-600 hover:bg-tempo-700 rounded-lg transition-colors"
              >
                {isLastStep ? 'Done' : 'Next'}
                {!isLastStep && <ChevronRight size={12} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/** Reset a specific tour so it shows again */
export function resetTour(tourId: string) {
  try {
    localStorage.removeItem(STORAGE_PREFIX + tourId)
  } catch {
    // ignore
  }
}

/** Reset all tours */
export function resetAllTours() {
  TOURS.forEach(tour => resetTour(tour.id))
}
