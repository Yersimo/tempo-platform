/**
 * Cross-Module Integration Wiring
 *
 * Connects the event bus to all cross-module integrations.
 * Call `registerAllIntegrations()` once at app boot to activate
 * automatic workflows between modules.
 *
 * Integrations:
 * 1. Performance → Compensation: review completion auto-generates merit proposals
 * 2. Offboarding → Revocation: offboarding initiation auto-revokes access
 * 3. Travel → Expense: approved travel auto-generates expense drafts
 * 4. Time → Payroll: timesheet approval feeds into payroll calculations
 * 5. Cross-module notifications: all events forward to notification system
 * 6. Learning → Performance: course completion updates competency scores and goal progress
 */

import { eventBus } from '@/lib/services/event-bus'
import {
  syncReviewsToCompensation,
  type PerformanceReview,
  type ReviewCycle,
  type Employee,
} from './performance-compensation'
import {
  executeAutoRevocation,
} from './offboarding-revocation'
import {
  generateExpenseFromTravel,
  type TravelRequest,
  type TravelBooking,
} from './travel-expense'
import {
  calculateTimesheetPayrollImpact,
  deriveHourlyRate,
  type TimeEntry,
} from '@/lib/payroll/timesheet-integration'
import {
  calculateCompetencyBoostFromCourse,
  calculateGoalProgressFromCourse,
  applyCompetencyUpdates,
  applyGoalProgressUpdates,
  completeLearningAssignments,
  type Course,
  type Goal,
  type CompetencyDefinition,
  type CompetencyRating,
  type LearningAssignment,
} from './learning-performance'

// ── Types ────────────────────────────────────────────────────────────────────

/** Store slice needed for cross-module operations */
interface IntegrationStoreSlice {
  // People
  employees: Employee[]
  departments: Array<{ id: string; name: string }>

  // Performance
  reviews: PerformanceReview[]
  reviewCycles: ReviewCycle[]

  // Compensation
  addMeritRecommendation?: (data: Record<string, unknown>) => void
  addSalaryReview?: (data: Record<string, unknown>) => void

  // Offboarding
  devices: Array<Record<string, unknown>>
  softwareLicenses: Array<Record<string, unknown>>
  appAssignments?: Array<Record<string, unknown>>
  ssoApps?: Array<Record<string, unknown>>
  identityProviders?: Array<Record<string, unknown>>
  appCatalog?: Array<Record<string, unknown>>
  samlApps?: Array<Record<string, unknown>>
  idpConfigurations?: Array<Record<string, unknown>>
  offboardingProcesses?: Array<Record<string, unknown>>
  offboardingTasks?: Array<Record<string, unknown>>
  updateDevice?: (id: string, data: Record<string, unknown>) => void
  updateSoftwareLicense?: (id: string, data: Record<string, unknown>) => void
  updateAppAssignment?: (id: string, data: Record<string, unknown>) => void
  addOffboardingTask?: (data: Record<string, unknown>) => void
  updateOffboardingProcess?: (id: string, data: Record<string, unknown>) => void
  updateOffboardingTask?: (id: string, data: Record<string, unknown>) => void
  getEmployeeName?: (id: string) => string

  // Travel & Expense
  travelRequests?: TravelRequest[]
  travelBookings?: TravelBooking[]
  addExpenseReport?: (data: Record<string, unknown>) => void

  // Time & Attendance
  timeEntries?: TimeEntry[]

  // Learning
  courses?: Course[]
  enrollments?: Array<Record<string, unknown>>
  learningAssignments?: LearningAssignment[]
  updateEnrollment?: (id: string, data: Record<string, unknown>) => void
  updateLearningAssignment?: (id: string, data: Record<string, unknown>) => void

  // Performance (competencies & goals)
  goals?: Goal[]
  competencyFramework?: CompetencyDefinition[]
  competencyRatings?: CompetencyRating[]
  updateGoal?: (id: string, data: Record<string, unknown>) => void
  addCompetencyRating?: (data: Record<string, unknown>) => void
  updateCompetencyRating?: (id: string, data: Record<string, unknown>) => void

  // Notifications
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ── Integration Registry ─────────────────────────────────────────────────────

let _store: IntegrationStoreSlice | null = null
let _registered = false

/**
 * Set the store reference for integrations.
 * Call this from the main TempoProvider after store initialization.
 */
export function setIntegrationStore(store: IntegrationStoreSlice): void {
  _store = store
}

/**
 * Register all cross-module event handlers.
 * Idempotent — safe to call multiple times.
 */
export function registerAllIntegrations(): void {
  if (_registered) return
  _registered = true

  registerPerformanceToCompensation()
  registerOffboardingRevocation()
  registerTravelToExpense()
  registerTimesheetToPayroll()
  registerLearningToPerformance()
  registerCrossModuleNotifications()

  console.info('[Integrations] All cross-module integrations registered')
}

// ── 1. Performance → Compensation ────────────────────────────────────────────

function registerPerformanceToCompensation(): void {
  eventBus.on('performance:review_completed', async (payload) => {
    if (!_store) return

    const { cycleId, employeeId } = payload

    // Find the review cycle
    const cycle = _store.reviewCycles?.find(c => c.id === cycleId)
    if (!cycle) return

    // Find all completed reviews in this cycle
    const cycleReviews = _store.reviews.filter(
      r => r.cycle_id === cycleId && r.status === 'completed'
    )

    // Only auto-generate merit recs if ALL reviews in the cycle are completed
    const totalReviewsInCycle = _store.reviews.filter(
      r => r.cycle_id === cycleId
    ).length

    if (cycleReviews.length < totalReviewsInCycle) {
      // Not all reviews done yet — just log
      console.info(
        `[Integration] Review completed for employee ${employeeId} in cycle ${cycleId} ` +
        `(${cycleReviews.length}/${totalReviewsInCycle} complete)`
      )
      return
    }

    // All reviews complete — generate merit recommendations
    console.info(`[Integration] All reviews complete for cycle "${cycle.title}" — generating merit recommendations`)

    const result = syncReviewsToCompensation(
      cycleId,
      _store.reviewCycles,
      cycleReviews,
      _store.employees,
    )

    // Persist via store if available
    if (_store.addSalaryReview && result.proposals.length > 0) {
      for (const proposal of result.proposals) {
        _store.addSalaryReview(proposal as unknown as Record<string, unknown>)
      }
    }

    _store.addToast?.({
      type: 'success',
      title: 'Merit Recommendations Generated',
      description: `${result.proposals.length} salary review proposals created from "${cycle.title}"`,
    })
  })
}

// ── 2. Offboarding → Revocation ──────────────────────────────────────────────

function registerOffboardingRevocation(): void {
  eventBus.on('offboarding:initiated', async (payload) => {
    if (!_store) return

    const { employeeId, offboardingId } = payload
    const processId = offboardingId

    console.info(`[Integration] Offboarding initiated for employee ${employeeId} — executing auto-revocation`)

    // Execute auto-revocation (pass store slice — types are duck-typed internally)
    try {
      const storeSlice = _store as unknown as Parameters<typeof executeAutoRevocation>[2]
      const result = await executeAutoRevocation(employeeId, processId, storeSlice)

      _store.addToast?.({
        type: 'success',
        title: 'Auto-Revocation Complete',
        description: `${result.totalActions} items processed: ${result.completedActions} completed, ${result.failedActions} failed`,
      })
    } catch (err) {
      console.error('[Integration] Auto-revocation failed:', err)
      _store.addToast?.({
        type: 'error',
        title: 'Auto-Revocation Failed',
        description: 'Some revocation actions failed. Check the offboarding tasks for details.',
      })
    }
  })
}

// ── 3. Travel → Expense ──────────────────────────────────────────────────────

function registerTravelToExpense(): void {
  eventBus.on('travel:booking_approved', async (payload) => {
    if (!_store) return

    const { bookingId, employeeId, destination } = payload

    console.info(`[Integration] Travel booking ${bookingId} approved for ${destination} — will generate expense draft when completed`)

    // We only create expense drafts when travel is completed (not just approved)
    // This is logged for audit trail purposes
  })

  eventBus.on('travel:booking_completed', async (payload) => {
    if (!_store) return

    const { bookingId, employeeId, destination } = payload

    console.info(`[Integration] Travel completed to ${destination} — generating expense report draft`)

    // Find the travel request linked to this booking
    const booking = _store.travelBookings?.find(b => b.id === bookingId)
    const requestId = booking?.travel_request_id || bookingId
    const request = _store.travelRequests?.find(r => r.id === requestId)
    if (!request) {
      console.warn(`[Integration] Travel request ${requestId} not found`)
      return
    }

    const bookings = (_store.travelBookings || []).filter(
      b => b.travel_request_id === requestId
    )

    try {
      const expense = generateExpenseFromTravel(request, bookings, {
        includePerDiem: true,
      })

      if (_store.addExpenseReport) {
        _store.addExpenseReport(expense as unknown as Record<string, unknown>)
      }

      _store.addToast?.({
        type: 'success',
        title: 'Expense Draft Created',
        description: `Travel to ${destination}: expense report drafted with ${expense.items.length} items. Review and submit.`,
      })
    } catch (err) {
      console.error('[Integration] Travel→Expense generation failed:', err)
    }
  })
}

// ── 4. Time → Payroll ────────────────────────────────────────────────────────

function registerTimesheetToPayroll(): void {
  eventBus.on('time:timesheet_approved', async (payload) => {
    if (!_store) return

    const { employeeId, timesheetId, periodStart, periodEnd, totalHours } = payload

    console.info(
      `[Integration] Timesheet ${timesheetId} approved for employee ${employeeId}: ` +
      `${totalHours}h total (${periodStart} to ${periodEnd})`
    )

    // Find employee's time entries for the period
    const entries = (_store.timeEntries || []).filter(e => {
      const entryDate = typeof e.date === 'string' ? e.date : ''
      return e.employee_id === employeeId && entryDate >= periodStart && entryDate <= periodEnd
    })

    if (entries.length === 0) return

    // Find employee for hourly rate calculation
    const employee = _store.employees.find(e => e.id === employeeId)
    if (!employee) return

    // Derive hourly rate from employee salary
    const country = employee.country || 'GH'
    const monthlyGross = employee.salary || 0
    const hourlyRate = monthlyGross > 0
      ? deriveHourlyRate(monthlyGross, country)
      : 0

    // Calculate payroll impact
    const impact = calculateTimesheetPayrollImpact(
      entries,
      hourlyRate,
      country,
      periodStart,
      periodEnd,
    )

    console.info(
      `[Integration] Payroll impact calculated for ${employeeId}: ` +
      `regular=${impact.totalRegularHours}h, OT=${impact.totalOvertimeHours}h, ` +
      `DT=${impact.totalDoubleTimeHours}h, OT pay=${impact.overtimePay / 100}`
    )
  })

  eventBus.on('time:overtime_logged', async (payload) => {
    if (!_store) return

    const { employeeId, overtimeHours, date } = payload

    // Overtime exceeding thresholds triggers a validation warning
    if (overtimeHours > 4) {
      console.warn(
        `[Integration] High overtime detected: employee ${employeeId} logged ${overtimeHours}h on ${date}`
      )

      _store.addToast?.({
        type: 'warning',
        title: 'High Overtime Alert',
        description: `${overtimeHours} hours of overtime logged. This may require manager approval.`,
      })
    }
  })
}

// ── 5. Learning → Performance ────────────────────────────────────────────────

function registerLearningToPerformance(): void {
  eventBus.on('learning:course_completed', async (payload) => {
    if (!_store) return

    const { employeeId, courseId, courseName, score } = payload

    console.info(
      `[Integration] Course "${courseName}" completed by employee ${employeeId}` +
      (score != null ? ` (score: ${score})` : ''),
    )

    // Find the course in the catalog
    const course = (_store.courses || []).find(c => c.id === courseId)
    if (!course) {
      console.warn(`[Integration] Course ${courseId} not found in catalog — skipping competency/goal updates`)
      return
    }

    const results: string[] = []

    // 1. Update competency scores based on course category
    if (_store.competencyRatings && _store.competencyFramework) {
      const competencyResult = calculateCompetencyBoostFromCourse(
        employeeId,
        course,
        _store.competencyRatings,
        _store.competencyFramework,
      )

      if (competencyResult.updatedCompetencies.length > 0) {
        // Apply to store using the LearningPerformanceStoreSlice interface
        const lpStore = _store as unknown as Parameters<typeof applyCompetencyUpdates>[1]
        applyCompetencyUpdates(competencyResult, lpStore)

        const names = competencyResult.updatedCompetencies
          .map(c => `${c.competencyName} (+${c.boost})`)
          .join(', ')
        results.push(`Competencies updated: ${names}`)

        const gapsClosed = competencyResult.updatedCompetencies.filter(c => c.gapClosed).length
        if (gapsClosed > 0) {
          results.push(`${gapsClosed} competency gap(s) fully closed`)
        }
      }
    }

    // 2. Advance development goals linked to this course's topic
    if (_store.goals) {
      const goalUpdates = calculateGoalProgressFromCourse(
        employeeId,
        course,
        _store.goals,
      )

      if (goalUpdates.length > 0) {
        const lpStore = _store as unknown as Parameters<typeof applyGoalProgressUpdates>[1]
        applyGoalProgressUpdates(goalUpdates, lpStore)

        for (const update of goalUpdates) {
          results.push(
            `Goal "${update.goalTitle}" → ${update.newProgress}%` +
            (update.completed ? ' ✓ COMPLETED' : ''),
          )
        }
      }
    }

    // 3. Mark any linked learning assignments as completed
    const lpStore = _store as unknown as Parameters<typeof completeLearningAssignments>[2]
    const assignmentsCompleted = completeLearningAssignments(employeeId, courseId, lpStore)
    if (assignmentsCompleted > 0) {
      results.push(`${assignmentsCompleted} learning assignment(s) marked complete`)
    }

    // Notify user
    if (results.length > 0) {
      _store.addToast?.({
        type: 'success',
        title: 'Learning Impact Applied',
        description: results.join('. ') + '.',
      })

      console.info(
        `[Integration] Learning→Performance for ${employeeId}: ${results.join('; ')}`,
      )
    }
  })
}

// ── 6. Cross-Module Notifications ────────────────────────────────────────────

function registerCrossModuleNotifications(): void {
  // Forward all events to notification system
  eventBus.onAny(async (event, payload, meta) => {
    try {
      await fetch('/api/notifications/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          entityId: (payload as unknown as Record<string, unknown>).employeeId ||
                    (payload as unknown as Record<string, unknown>).requestId ||
                    (payload as unknown as Record<string, unknown>).processId || 'unknown',
          entityType: event.split(':')[0],
          metadata: payload,
          _eventId: meta.eventId,
        }),
      })
    } catch {
      // Silent — notification delivery is best-effort
    }
  })
}
