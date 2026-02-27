'use client'

import { useState } from 'react'
import { useTempo } from '@/lib/store'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Compass, ChevronRight, CheckCircle2, Clock, Play
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { JourneyWizard } from '@/components/dashboard/journey-wizard'
import type { Journey } from '@/lib/demo-data'

export function ActiveJourneysCard() {
  const { journeys, getEmployeeName } = useTempo()
  const [selectedJourney, setSelectedJourney] = useState<Journey | null>(null)

  const activeJourneys = journeys.filter(j => j.status !== 'completed')

  return (
    <>
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={14} className="text-tempo-600" />
              <CardTitle>Active Journeys</CardTitle>
              {activeJourneys.length > 0 && (
                <Badge variant="info">{activeJourneys.length}</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {activeJourneys.length === 0 ? (
            <div className="px-6 py-8 text-center">
              <Compass size={24} className="mx-auto text-t3 mb-2" />
              <p className="text-sm text-t3">No active journeys</p>
            </div>
          ) : (
            activeJourneys.map(journey => {
              const completedSteps = journey.steps.filter(s => s.status === 'completed').length
              const totalSteps = journey.steps.length
              const progressPercent = Math.round((completedSteps / totalSteps) * 100)
              const currentStep = journey.steps.find(s => s.status === 'in_progress' || s.status === 'pending')

              return (
                <div
                  key={journey.id}
                  onClick={() => setSelectedJourney(journey)}
                  className="px-6 py-4 hover:bg-canvas/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <p className="text-xs font-semibold text-t1">{journey.title}</p>
                        <Badge variant={
                          journey.status === 'in_progress' ? 'orange' :
                          journey.status === 'not_started' ? 'default' : 'success'
                        }>
                          {journey.status === 'in_progress' ? 'In Progress' :
                           journey.status === 'not_started' ? 'Not Started' : 'Completed'}
                        </Badge>
                      </div>
                      <p className="text-[0.65rem] text-t3">
                        {getEmployeeName(journey.employee_id)}
                        {journey.due_date && ` · Due ${new Date(journey.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`}
                      </p>
                    </div>
                    <ChevronRight size={14} className="text-t3 group-hover:text-t1 transition-colors flex-shrink-0 mt-1" />
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1">
                      <Progress value={progressPercent} size="sm" />
                    </div>
                    <span className="text-[0.6rem] font-medium text-t3 whitespace-nowrap">{completedSteps}/{totalSteps}</span>
                  </div>

                  {/* Step indicators */}
                  <div className="flex items-center gap-1">
                    {journey.steps.map((step, i) => (
                      <div
                        key={step.id}
                        className={cn(
                          'h-1.5 flex-1 rounded-full transition-all',
                          step.status === 'completed' ? 'bg-green-400' :
                          step.status === 'in_progress' ? 'bg-tempo-400 animate-pulse' :
                          step.status === 'skipped' ? 'bg-gray-300' :
                          'bg-gray-200'
                        )}
                      />
                    ))}
                  </div>

                  {/* Current step hint */}
                  {currentStep && (
                    <p className="text-[0.6rem] text-t3 mt-2 flex items-center gap-1">
                      <Play size={8} className="text-tempo-500" />
                      Next: {currentStep.title}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      </Card>

      {/* Journey Wizard Modal */}
      {selectedJourney && (
        <JourneyWizard
          journey={selectedJourney}
          open={!!selectedJourney}
          onClose={() => setSelectedJourney(null)}
        />
      )}
    </>
  )
}
