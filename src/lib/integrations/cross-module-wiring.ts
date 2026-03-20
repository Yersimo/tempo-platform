/**
 * Cross-Module Integration Wiring
 *
 * Connects the event bus to all cross-module integrations.
 * Call `registerAllIntegrations()` once at app boot to activate
 * automatic workflows between modules.
 *
 * Integrations:
 *  1. Performance → Compensation: review completion auto-generates merit proposals
 *  2. Offboarding → Revocation: offboarding initiation auto-revokes access
 *  3. Travel → Expense: approved travel auto-generates expense drafts
 *  4. Time → Payroll: timesheet approval feeds into payroll calculations
 *  5. Cross-module notifications: all events forward to notification system
 *  6. Learning → Performance: course completion updates competency scores and goal progress
 *  7. Recruiting → Onboarding: hired candidates get auto-generated onboarding checklists
 *  8. Onboarding → Learning: new hires auto-enrolled in mandatory/dept courses
 *  9. Headcount → Recruiting: approved positions auto-create job postings
 * 10. Expense → Payroll: approved expenses queued for payroll reimbursement
 * 11. Benefits → Payroll: enrollment changes create payroll deduction adjustments
 * 12. Compensation → Payroll: salary changes create payroll rate change entries
 * 13. Offboarding → Payroll: offboarding triggers final pay calculation
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
import {
  generateOnboardingChecklist,
  applyOnboardingChecklist,
} from './recruiting-onboarding'
import {
  determineOnboardingEnrollments,
  applyOnboardingEnrollments,
} from './onboarding-learning'
import {
  generateJobPostingFromHeadcount,
  applyJobPostingFromHeadcount,
  type HeadcountPosition,
} from './headcount-recruiting'
import {
  processApprovedExpenseForPayroll,
  applyExpenseReimbursements,
  batchProcessExpensesForPayroll,
} from './expense-payroll'
import {
  processEnrollmentChange,
  applyBenefitDeductions,
} from './benefits-payroll'
import {
  processSalaryChangeForPayroll,
  applySalaryChangeToPayroll,
} from './compensation-payroll'
import {
  processOffboardingForPayroll,
  applyOffboardingPayroll,
} from '@/lib/payroll/offboarding-payroll'

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

  // Recruiting & Onboarding
  jobPostings?: Array<Record<string, unknown>>
  headcountPositions?: Array<Record<string, unknown>>
  addJobPosting?: (data: Record<string, unknown>) => void
  updateHeadcountPosition?: (id: string, data: Record<string, unknown>) => void
  addPreboardingTask?: (data: Record<string, unknown>) => void
  addOnboardingProcess?: (data: Record<string, unknown>) => void
  addEnrollment?: (data: Record<string, unknown>) => void

  // Expenses & Payroll
  expenseReports?: Array<Record<string, unknown>>
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  updateExpenseReport?: (id: string, data: Record<string, unknown>) => void

  // Benefits & Payroll
  benefitPlans?: Array<Record<string, unknown>>
  benefitEnrollments?: Array<Record<string, unknown>>

  // Compensation & Payroll
  salaryReviews?: Array<Record<string, unknown>>
  updateEmployee?: (id: string, data: Record<string, unknown>) => void
  updateSalaryReview?: (id: string, data: Record<string, unknown>) => void

  // Offboarding Payroll
  leaveBalances?: Array<Record<string, unknown>>
  leaveRequests?: Array<Record<string, unknown>>
  addPayrollRun?: (data: Record<string, unknown>) => void

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
  registerRecruitingToOnboarding()
  registerOnboardingToLearning()
  registerHeadcountToRecruiting()
  registerExpenseToPayroll()
  registerBenefitsToPayroll()
  registerCompensationToPayroll()
  registerOffboardingToPayroll()
  registerCrossModuleNotifications()

  console.info('[Integrations] All cross-module integrations registered (13 integration handlers)')
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

// ── 7. Recruiting → Onboarding ────────────────────────────────────────────────

function registerRecruitingToOnboarding(): void {
  eventBus.on('recruiting:candidate_hired', async (payload) => {
    if (!_store) return

    const { candidateName, departmentId, jobTitle, startDate } = payload

    console.info(`[Integration] Candidate "${candidateName}" hired for ${jobTitle} — generating onboarding checklist`)

    // Resolve department name
    const dept = _store.departments.find(d => d.id === departmentId)
    const departmentName = dept?.name || 'General'

    // Generate the checklist
    const checklist = generateOnboardingChecklist(
      candidateName,
      departmentId,
      departmentName,
      jobTitle,
    )

    // If we have an employee ID (already created), apply the checklist
    const employeeId = payload.employeeId
    if (employeeId) {
      const storeSlice = _store as unknown as Parameters<typeof applyOnboardingChecklist>[3]
      const tasksCreated = applyOnboardingChecklist(
        checklist,
        employeeId,
        startDate || new Date().toISOString().split('T')[0],
        storeSlice,
      )

      console.info(`[Integration] Onboarding checklist created: ${tasksCreated} tasks across ${Object.keys(checklist.byCategory).length} categories`)

      _store.addToast?.({
        type: 'success',
        title: 'Onboarding Checklist Created',
        description: `${checklist.totalTasks} tasks generated for ${candidateName} (IT: ${checklist.byCategory['it_setup'] || 0}, HR: ${checklist.byCategory['hr'] || 0}, Manager: ${checklist.byCategory['manager'] || 0}, Dept: ${checklist.byCategory['department'] || 0})`,
      })
    } else {
      console.info(`[Integration] Onboarding checklist prepared (${checklist.totalTasks} tasks) — will be applied when employee record is created`)
    }
  })
}

// ── 8. Onboarding → Learning ──────────────────────────────────────────────────

function registerOnboardingToLearning(): void {
  eventBus.on('onboarding:initiated', async (payload) => {
    if (!_store) return

    const { employeeId, employeeName, departmentId, startDate } = payload

    console.info(`[Integration] Onboarding initiated for ${employeeName} — determining learning enrollments`)

    // Resolve department name
    const dept = _store.departments.find(d => d.id === departmentId)
    const departmentName = dept?.name || 'General'

    const courses = (_store.courses || []) as Parameters<typeof determineOnboardingEnrollments>[4]

    // Determine enrollments
    const result = determineOnboardingEnrollments(
      employeeId,
      employeeName,
      departmentId,
      departmentName,
      courses,
      _store.enrollments || [],
    )

    if (result.totalEnrollments > 0) {
      const storeSlice = _store as unknown as Parameters<typeof applyOnboardingEnrollments>[2]
      const created = applyOnboardingEnrollments(result, startDate, storeSlice)

      console.info(
        `[Integration] Auto-enrolled ${employeeName} in ${created} courses ` +
        `(${result.mandatoryCount} mandatory, ${result.totalEnrollments - result.mandatoryCount} recommended)`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Learning Auto-Enrollment',
        description: `${created} courses assigned to ${employeeName}: ${result.mandatoryCount} mandatory, ${result.totalEnrollments - result.mandatoryCount} recommended`,
      })
    } else {
      console.info(`[Integration] No matching courses found for ${employeeName} onboarding enrollment`)
    }
  })
}

// ── 9. Headcount → Recruiting ─────────────────────────────────────────────────

function registerHeadcountToRecruiting(): void {
  eventBus.on('headcount:position_approved', async (payload) => {
    if (!_store) return

    const { positionId, departmentId, jobTitle, level } = payload

    console.info(`[Integration] Headcount position approved: ${jobTitle} (${level}) — auto-creating job posting`)

    // Find the position in the store
    const position = (_store.headcountPositions || []).find(
      p => (p as Record<string, unknown>).id === positionId,
    ) as unknown as HeadcountPosition | undefined

    if (!position) {
      console.warn(`[Integration] Headcount position ${positionId} not found — skipping job posting creation`)
      return
    }

    // Resolve department name
    const dept = _store.departments.find(d => d.id === departmentId)
    const departmentName = dept?.name || 'Unknown Department'

    // Generate the job posting
    const result = generateJobPostingFromHeadcount(position, departmentName)

    // Apply to store
    const storeSlice = _store as unknown as Parameters<typeof applyJobPostingFromHeadcount>[1]
    const created = applyJobPostingFromHeadcount(result, storeSlice)

    if (created) {
      const salaryRange = result.salaryRange
      console.info(
        `[Integration] Job posting created for "${jobTitle}" — salary range: ${(salaryRange.min / 100).toFixed(0)}-${(salaryRange.max / 100).toFixed(0)} ${salaryRange.currency}`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Job Posting Auto-Created',
        description: `Draft job posting for "${jobTitle}" created from headcount approval. Review and publish when ready.`,
      })
    }
  })
}

// ── 10. Expense → Payroll ─────────────────────────────────────────────────────

function registerExpenseToPayroll(): void {
  eventBus.on('expense:report_approved', async (payload) => {
    if (!_store) return

    const { employeeId, reportId, totalAmountCents, currency } = payload

    console.info(
      `[Integration] Expense report ${reportId} approved for employee ${employeeId}: ` +
      `${(totalAmountCents / 100).toFixed(2)} ${currency} — queuing for payroll`,
    )

    const storeSlice = _store as unknown as Parameters<typeof processApprovedExpenseForPayroll>[1]
    const entry = processApprovedExpenseForPayroll(reportId, storeSlice)

    if (entry) {
      // Create the payroll entry and mark the expense as queued
      const result = {
        reimbursementEntries: [entry],
        totalReimbursementCents: entry.amount,
        reportsProcessed: 1,
        employeeCount: 1,
        skipped: [],
      }
      const applyStore = _store as unknown as Parameters<typeof applyExpenseReimbursements>[1]
      const created = applyExpenseReimbursements(result, applyStore)

      if (created > 0) {
        console.info(`[Integration] Expense reimbursement queued for payroll: ${(entry.amount / 100).toFixed(2)} ${currency}`)

        _store.addToast?.({
          type: 'success',
          title: 'Expense Queued for Payroll',
          description: `Reimbursement of ${(totalAmountCents / 100).toFixed(2)} ${currency} added to next payroll run.`,
        })
      }
    }
  })
}

// ── 11. Benefits → Payroll ────────────────────────────────────────────────────

function registerBenefitsToPayroll(): void {
  eventBus.on('benefits:enrollment_changed', async (payload) => {
    if (!_store) return

    const { employeeId, enrollmentId, planName, action, effectiveDate } = payload

    console.info(
      `[Integration] Benefit enrollment ${action} for employee ${employeeId}: ${planName} — updating payroll deductions`,
    )

    const storeSlice = _store as unknown as Parameters<typeof processEnrollmentChange>[3]
    const result = processEnrollmentChange(
      employeeId,
      enrollmentId,
      action,
      storeSlice,
      {
        previousPlanId: payload.previousPlanId,
        effectiveDate,
      },
    )

    if (result.adjustments.length > 0) {
      const applyStore = _store as unknown as Parameters<typeof applyBenefitDeductions>[1]
      const created = applyBenefitDeductions(result, applyStore)

      const netChangeStr = result.netChange >= 0
        ? `+${(result.netChange / 100).toFixed(2)}`
        : `${(result.netChange / 100).toFixed(2)}`

      console.info(
        `[Integration] Payroll deductions updated: ${result.adjustments.length} adjustment(s), net change: ${netChangeStr}/month` +
        (result.prorationApplied ? ' (prorated)' : ''),
      )

      _store.addToast?.({
        type: 'success',
        title: 'Payroll Deductions Updated',
        description: `${planName} enrollment ${action}: ${result.adjustments.length} payroll adjustment(s) created${result.prorationApplied ? ' (prorated for mid-period change)' : ''}.`,
      })
    }
  })
}

// ── 12. Compensation → Payroll ────────────────────────────────────────────────

function registerCompensationToPayroll(): void {
  eventBus.on('compensation:salary_approved', async (payload) => {
    if (!_store) return

    const { employeeId, salaryReviewId, previousSalaryCents, newSalaryCents, currency } = payload

    const increasePercent = previousSalaryCents > 0
      ? Math.round(((newSalaryCents - previousSalaryCents) / previousSalaryCents) * 10000) / 100
      : 0

    console.info(
      `[Integration] Salary change approved for employee ${employeeId}: ` +
      `${(previousSalaryCents / 100).toFixed(2)} → ${(newSalaryCents / 100).toFixed(2)} ${currency} (${increasePercent >= 0 ? '+' : ''}${increasePercent}%) — updating payroll`,
    )

    const storeSlice = _store as unknown as Parameters<typeof processSalaryChangeForPayroll>[1]
    const result = processSalaryChangeForPayroll(salaryReviewId, storeSlice, {
      effectiveDate: payload.effectiveDate,
    })

    if (result) {
      const applyStore = _store as unknown as Parameters<typeof applySalaryChangeToPayroll>[1]
      applySalaryChangeToPayroll(result, applyStore)

      console.info(
        `[Integration] Payroll rate change applied for ${employeeId}: new monthly rate ${(result.rateChange.new_monthly_rate / 100).toFixed(2)} ${currency}` +
        (result.prorationApplied ? ` (prorated adjustment: ${((result.prorationDetails?.adjustmentAmount || 0) / 100).toFixed(2)})` : ''),
      )

      _store.addToast?.({
        type: 'success',
        title: 'Payroll Rate Updated',
        description: `Salary change applied: ${(newSalaryCents / 100).toFixed(2)} ${currency}/year. Tax withholding adjusted.${result.prorationApplied ? ' Mid-period proration applied.' : ''}`,
      })
    }
  })
}

// ── 13. Offboarding → Payroll ─────────────────────────────────────────────────

function registerOffboardingToPayroll(): void {
  eventBus.on('offboarding:initiated', async (payload) => {
    if (!_store) return

    const { employeeId, offboardingId, lastDay, reason } = payload

    console.info(`[Integration] Offboarding initiated for ${employeeId} (last day: ${lastDay}) — calculating final pay`)

    try {
      const storeSlice = _store as unknown as Parameters<typeof processOffboardingForPayroll>[1]
      const result = processOffboardingForPayroll(offboardingId, storeSlice, {
        terminationType: (reason as any) || 'resignation',
      })

      if (result) {
        const applyStore = _store as unknown as Parameters<typeof applyOffboardingPayroll>[1]
        applyOffboardingPayroll(result, applyStore)

        console.info(
          `[Integration] Final pay calculated for ${result.employeeName}: ` +
          `net ${(result.finalPay.netFinalPay / 100).toFixed(2)} ${result.finalPay.currency}` +
          (result.outstandingExpenses > 0 ? ` + ${(result.outstandingExpenses / 100).toFixed(2)} expense reimbursements` : '') +
          (result.benefitsTerminated > 0 ? ` (${result.benefitsTerminated} benefit plan(s) terminated)` : ''),
        )

        _store.addToast?.({
          type: 'success',
          title: 'Final Pay Calculated',
          description: `Final paycheck for ${result.employeeName}: net ${(result.finalPay.netFinalPay / 100).toFixed(2)} ${result.finalPay.currency}. Scheduled for ${lastDay}.`,
        })
      }
    } catch (err) {
      console.error('[Integration] Offboarding→Payroll calculation failed:', err)
    }
  })
}

// ── 14. Cross-Module Notifications ────────────────────────────────────────────

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
