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
 * 14. Recruiting → Compensation: offer validation against salary bands
 * 15. Workers' Comp → Time: work restrictions and modified schedules
 * 16. Engagement → Performance: survey results map to performance flags
 * 17. Compliance → Learning: regulation changes auto-assign training
 * 18. Geofencing → Time: geofence events auto clock-in/out
 * 19. Shadow IT → Compliance: detected apps create risk assessments
 * 20. Recruiting → Headcount: hired candidates fulfill headcount positions
 * 21. Projects → Time: assignment changes generate time entry templates
 * 22. EOR → Payroll: EOR data changes sync country payroll rules
 * 23. Mentoring → Performance: session completion updates soft-skill competencies and goals
 * 24. Device Store → IT Asset: provisioned devices auto-create asset records
 * 25. Life Events → Multiple: life events trigger benefits windows, tax suggestions, HR tasks
 * 26. Strategy → Projects: initiative milestones generate project tasks and KPI linkages
 * 27. Compliance Training → Compliance: training status changes update compliance records
 * 28. Expense → Finance: approved expenses generate GL journal entries
 * 29. Payroll → Finance: completed payroll runs generate GL journal entries
 * 30. Academy → Learning: published courses auto-create learning catalog entries
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
import {
  validateOfferAgainstBands,
  getCompensationBandForRole,
} from './recruiting-compensation'
import {
  applyWorkRestrictions,
  generateModifiedSchedule,
} from './workers-comp-time'
import {
  mapEngagementToPerformance,
  generateEngagementAlerts,
} from './engagement-performance'
import {
  assignComplianceTraining,
  checkComplianceTrainingStatus,
} from './compliance-learning'
import {
  processGeofenceEvent,
  reconcileGeofenceWithTimeEntries,
  type GeofenceTimeEntry,
} from './geofencing-time'
import {
  assessShadowITRisk,
  generateRemediationPlan,
} from './shadow-it-compliance'
import {
  fulfillHeadcountPosition,
  calculateTimeToFill,
} from './recruiting-headcount'
import {
  syncProjectAssignments,
  generateTimeEntryTemplates,
} from './projects-time'
import {
  syncEORPayrollRules,
  calculateCountryPayrollCost,
} from '@/lib/payroll/eor-payroll'
import {
  calculateMentoringCompetencyBoost,
  calculateMentoringGoalProgress,
  applyMentoringCompetencyUpdates,
  applyMentoringGoalUpdates,
} from './mentoring-performance'
import {
  generateITAssetFromProvision,
  applyITAssetCreation,
} from './device-store-asset'
import {
  processLifeEvent,
  applyLifeEventActions,
  type LifeEventType,
} from './life-events-multi'
import {
  generateProjectTasksFromStrategy,
  applyStrategyProjectTasks,
} from './strategy-projects'
import {
  processComplianceTrainingChange,
  applyComplianceTrainingAlerts,
} from './compliance-training'
import {
  generateExpenseJournalEntry,
  applyExpenseJournalEntry,
} from './expense-finance'
import {
  generatePayrollJournalEntries,
  applyPayrollJournalEntry,
} from './payroll-finance'
import {
  processAcademyCoursePublication,
  applyAcademyCatalogEntry,
} from './academy-learning'

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

  // Compensation bands
  compBands?: Array<Record<string, unknown>>

  // Workers' Comp
  workersCompClaims?: Array<Record<string, unknown>>

  // Engagement
  surveys?: Array<Record<string, unknown>>
  surveyResponses?: Array<Record<string, unknown>>
  engagementScores?: Array<Record<string, unknown>>
  addActionPlan?: (data: Record<string, unknown>) => void

  // Compliance
  complianceRequirements?: Array<Record<string, unknown>>
  addLearningAssignment?: (data: Record<string, unknown>) => void
  addComplianceAlert?: (data: Record<string, unknown>) => void

  // Geofencing
  geofenceZones?: Array<Record<string, unknown>>
  geofenceEvents?: Array<Record<string, unknown>>
  addGeofenceEvent?: (data: Record<string, unknown>) => void

  // Shadow IT
  shadowITDetections?: Array<Record<string, unknown>>

  // Projects
  projects?: Array<Record<string, unknown>>
  tasks?: Array<Record<string, unknown>>
  addTask?: (data: Record<string, unknown>) => void

  // EOR
  eorEntities?: Array<Record<string, unknown>>
  eorEmployees?: Array<Record<string, unknown>>
  eorContracts?: Array<Record<string, unknown>>

  // Time entries (extended)
  addTimeEntry?: (data: Record<string, unknown>) => void
  updateTimeEntry?: (id: string, data: Record<string, unknown>) => void

  // Finance / GL
  addJournalEntry?: (data: Record<string, unknown>) => void

  // Academy / Learning catalog
  addCourse?: (data: Record<string, unknown>) => void

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
  registerRecruitingToCompensation()
  registerWorkersCompToTime()
  registerEngagementToPerformance()
  registerComplianceToLearning()
  registerGeofencingToTime()
  registerShadowITToCompliance()
  registerRecruitingToHeadcount()
  registerProjectsToTime()
  registerEORToPayroll()
  registerMentoringToPerformance()
  registerDeviceStoreToAsset()
  registerLifeEventsMulti()
  registerStrategyToProjects()
  registerComplianceTrainingToCompliance()
  registerExpenseToFinance()
  registerPayrollToFinance()
  registerAcademyToLearning()
  registerCrossModuleNotifications()

  console.info('[Integrations] All cross-module integrations registered (30 integration handlers)')
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

// ── 14. Recruiting → Compensation ──────────────────────────────────────────────

function registerRecruitingToCompensation(): void {
  eventBus.on('recruiting:offer_extended', async (payload) => {
    if (!_store) return

    const { candidateName, jobTitle, level, departmentId, proposedSalaryCents, currency } = payload

    console.info(`[Integration] Offer being extended to "${candidateName}" for ${jobTitle} — validating against compensation bands`)

    const compBands = (_store.compBands || []) as unknown as Parameters<typeof validateOfferAgainstBands>[5]

    const result = validateOfferAgainstBands(
      candidateName,
      jobTitle,
      level,
      departmentId,
      proposedSalaryCents,
      compBands,
    )

    if (!result.bandFound) {
      console.info(`[Integration] No compensation band found for "${jobTitle}" — skipping validation`)
      _store.addToast?.({
        type: 'warning',
        title: 'No Compensation Band',
        description: `No salary band found for "${jobTitle}". Consider setting one up before extending the offer.`,
      })
      return
    }

    const salaryFormatted = (proposedSalaryCents / 100).toFixed(0)

    if (result.status === 'within_band') {
      console.info(`[Integration] Offer of ${salaryFormatted} ${currency} is within band (${result.percentile}th percentile)`)
      _store.addToast?.({
        type: 'success',
        title: 'Offer Within Band',
        description: `${salaryFormatted} ${currency} for "${jobTitle}" is at the ${result.percentile}th percentile.`,
      })
    } else {
      console.warn(`[Integration] Offer of ${salaryFormatted} ${currency} is ${result.status}: ${result.recommendation}`)
      _store.addToast?.({
        type: result.riskLevel === 'high' ? 'error' : 'warning',
        title: result.status === 'below_band' ? 'Offer Below Band' : 'Offer Above Band',
        description: result.recommendation,
      })
    }
  })
}

// ── 15. Workers' Comp → Time ──────────────────────────────────────────────────

function registerWorkersCompToTime(): void {
  eventBus.on('workers_comp:claim_filed', async (payload) => {
    if (!_store) return

    const { employeeId, claimId, injuryType, injuryDate, restrictionType, maxHoursPerDay, expectedReturnDate } = payload

    const employee = _store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId

    console.info(`[Integration] Workers' comp claim ${claimId} filed for ${employeeName} (${injuryType}) — applying work restrictions`)

    const result = applyWorkRestrictions(
      employeeId,
      claimId,
      injuryDate,
      restrictionType || 'light_duty',
      maxHoursPerDay,
      expectedReturnDate,
    )

    console.info(
      `[Integration] Work restrictions applied for ${employeeName}: ` +
      `${result.restriction.restriction_type}, max ${result.newMaxHours}h/day, ` +
      `${result.daysAffected} work days affected`,
    )

    _store.addToast?.({
      type: 'warning',
      title: 'Work Restrictions Applied',
      description: `${employeeName}: ${result.restriction.restriction_type} duty, max ${result.newMaxHours}h/day for ${result.daysAffected} days.`,
    })
  })
}

// ── 16. Engagement → Performance ──────────────────────────────────────────────

function registerEngagementToPerformance(): void {
  eventBus.on('engagement:survey_completed', async (payload) => {
    if (!_store) return

    const { surveyId, surveyTitle, averageScore } = payload

    console.info(`[Integration] Engagement survey "${surveyTitle}" completed (avg score: ${averageScore}) — mapping to performance`)

    const storeSlice = _store as unknown as Parameters<typeof mapEngagementToPerformance>[2]
    const result = mapEngagementToPerformance(surveyId, surveyTitle, storeSlice)

    if (result.actionItems.length > 0) {
      const alertStore = _store as unknown as Parameters<typeof generateEngagementAlerts>[1]
      const created = generateEngagementAlerts(result, alertStore)

      console.info(
        `[Integration] Engagement→Performance for "${surveyTitle}": ` +
        `${result.departmentsAtRisk} dept(s) at risk, ${result.performanceFlags.length} flag(s), ` +
        `${created} action item(s) created`,
      )

      _store.addToast?.({
        type: result.departmentsAtRisk > 0 ? 'warning' : 'success',
        title: 'Engagement Analysis Complete',
        description: `${result.departmentsAtRisk} department(s) at risk. ${created} action item(s) created for managers.`,
      })
    } else {
      console.info(`[Integration] Engagement survey "${surveyTitle}": all departments within healthy range (overall: ${result.overallScore}/100)`)
    }
  })
}

// ── 17. Compliance → Learning ─────────────────────────────────────────────────

function registerComplianceToLearning(): void {
  eventBus.on('compliance:requirement_changed', async (payload) => {
    if (!_store) return

    const { requirementId, requirementTitle, regulationType, affectedDepartments, affectedLocations, deadlineDate, severity } = payload

    console.info(
      `[Integration] Compliance requirement changed: "${requirementTitle}" (${regulationType}, ${severity}) — assigning training`,
    )

    const storeSlice = _store as unknown as Parameters<typeof assignComplianceTraining>[6]
    const result = assignComplianceTraining(
      requirementId,
      requirementTitle,
      regulationType,
      affectedDepartments || [],
      affectedLocations || [],
      deadlineDate,
      storeSlice,
    )

    if (result.totalAssignments > 0 && _store.addLearningAssignment) {
      for (const assignment of result.assignments) {
        _store.addLearningAssignment({
          employee_id: assignment.employee_id,
          course_id: assignment.course_id,
          requirement_id: assignment.requirement_id,
          compliance_requirement_id: assignment.requirement_id,
          deadline: assignment.deadline,
          priority: assignment.priority,
          mandatory: assignment.mandatory,
          status: 'assigned',
          source: 'compliance-learning-integration',
          auto_generated: true,
        })
      }

      console.info(
        `[Integration] Compliance training assigned: ${result.totalAssignments} assignment(s) ` +
        `across ${result.affectedEmployees} employee(s), ${result.coursesMapped} course(s) matched`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Compliance Training Assigned',
        description: `${result.totalAssignments} training assignment(s) for "${requirementTitle}". Deadline: ${deadlineDate}.`,
      })
    } else if (result.coursesMapped === 0) {
      console.warn(`[Integration] No courses found matching regulation type "${regulationType}" — manual assignment needed`)

      _store.addToast?.({
        type: 'warning',
        title: 'No Matching Courses',
        description: `No training courses found for "${regulationType}". Please create or assign courses manually.`,
      })
    }
  })
}

// ── 18. Geofencing → Time ─────────────────────────────────────────────────────

function registerGeofencingToTime(): void {
  eventBus.on('geofencing:event_detected', async (payload) => {
    if (!_store) return

    const { employeeId, zoneId, zoneName, eventType, timestamp } = payload

    const employee = _store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId
    const eventDate = timestamp.split('T')[0]

    // Get recent geofence events for this employee today
    const recentEvents = ((_store.geofenceEvents || []) as Array<Record<string, unknown>>)
      .filter(e => {
        const ev = e as Record<string, unknown>
        return ev.employee_id === employeeId &&
          (ev.timestamp as string || '').startsWith(eventDate)
      })
      .map(e => {
        const ev = e as Record<string, unknown>
        return {
          employee_id: ev.employee_id as string,
          zone_id: ev.zone_id as string,
          zone_name: ev.zone_name as string,
          event_type: ev.event_type as 'enter' | 'exit',
          timestamp: ev.timestamp as string,
        }
      })

    // Get existing geofence time entries for today
    const existingEntries = ((_store.timeEntries || []) as unknown as Array<Record<string, unknown>>)
      .filter(e => {
        return (e as Record<string, unknown>).employee_id === employeeId &&
          (e as Record<string, unknown>).date === eventDate &&
          (e as Record<string, unknown>).source === 'geofence'
      })
      .map(e => e as unknown as GeofenceTimeEntry)

    const result = processGeofenceEvent(
      { employee_id: employeeId, zone_id: zoneId, zone_name: zoneName, event_type: eventType, timestamp },
      recentEvents,
      existingEntries,
    )

    if (result.action === 'clock_in' && result.timeEntry && _store.addTimeEntry) {
      _store.addTimeEntry(result.timeEntry as unknown as Record<string, unknown>)
      console.info(`[Integration] Geofence auto clock-in: ${employeeName} entered ${zoneName}`)
    } else if (result.action === 'clock_out' && result.timeEntry) {
      // Find the active entry to update
      const activeEntry = existingEntries.find(e => e.clock_out === null)
      if (activeEntry && _store.updateTimeEntry) {
        _store.updateTimeEntry((activeEntry as unknown as Record<string, unknown>).id as string, {
          clock_out: timestamp,
          total_hours: result.hoursLogged,
          needs_review: result.timeEntry.needs_review,
          review_reason: result.timeEntry.review_reason,
        })
        console.info(`[Integration] Geofence auto clock-out: ${employeeName} left ${zoneName} (${result.hoursLogged}h)`)
      }
    } else {
      console.info(`[Integration] Geofence event ignored for ${employeeName}: ${result.reason}`)
    }
  })
}

// ── 19. Shadow IT → Compliance ────────────────────────────────────────────────

function registerShadowITToCompliance(): void {
  eventBus.on('shadow_it:app_detected', async (payload) => {
    if (!_store) return

    const { detectionId, appName, appCategory, dataAccessLevel, employeeCount } = payload

    console.info(`[Integration] Shadow IT detected: "${appName}" (${appCategory}) — ${employeeCount} user(s), ${dataAccessLevel} access`)

    const assessment = assessShadowITRisk(
      detectionId,
      appName,
      appCategory,
      dataAccessLevel,
      employeeCount,
    )

    const plan = generateRemediationPlan(assessment)

    // Create compliance alerts for each remediation task
    if (_store.addComplianceAlert) {
      for (const task of plan.tasks) {
        _store.addComplianceAlert({
          title: task.title,
          description: task.description,
          type: 'shadow_it',
          severity: task.priority,
          status: 'open',
          source: 'shadow-it-compliance-integration',
          detection_id: detectionId,
          app_name: appName,
          action: task.action,
          auto_generated: true,
        })
      }
    }

    console.info(
      `[Integration] Shadow IT risk assessment for "${appName}": ` +
      `score ${assessment.riskScore}/100 (${assessment.riskLevel}), ` +
      `${plan.totalTasks} remediation task(s), recommended action: ${plan.recommendedAction}`,
    )

    _store.addToast?.({
      type: assessment.riskLevel === 'critical' || assessment.riskLevel === 'high' ? 'error' : 'warning',
      title: `Shadow IT: ${appName}`,
      description: `Risk: ${assessment.riskLevel} (${assessment.riskScore}/100). ${plan.totalTasks} remediation task(s) created. Action: ${plan.recommendedAction}.`,
    })
  })
}

// ── 20. Recruiting → Headcount ────────────────────────────────────────────────

function registerRecruitingToHeadcount(): void {
  eventBus.on('headcount:position_filled', async (payload) => {
    if (!_store) return

    const { positionId, candidateName, applicationId, hireDate, actualSalaryCents, budgetCents, currency, jobTitle } = payload

    console.info(`[Integration] Headcount position filled: "${jobTitle}" by ${candidateName} — updating position and calculating metrics`)

    const storeSlice = _store as unknown as Parameters<typeof fulfillHeadcountPosition>[5]
    const result = fulfillHeadcountPosition(
      positionId,
      candidateName,
      applicationId,
      hireDate,
      actualSalaryCents,
      storeSlice,
    )

    if (result) {
      const ttf = result.timeToFill
      const budget = result.budgetUtilization

      console.info(
        `[Integration] Position "${jobTitle}" fulfilled: ` +
        `time-to-fill ${ttf.daysToFill} days (${ttf.performance}), ` +
        `budget utilization ${budget.utilizationPercent}% (${budget.variance})`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Headcount Position Filled',
        description: `${candidateName} hired for "${jobTitle}". Time-to-fill: ${ttf.daysToFill} days. Budget: ${budget.utilizationPercent}%.`,
      })
    }
  })
}

// ── 21. Projects → Time ───────────────────────────────────────────────────────

function registerProjectsToTime(): void {
  eventBus.on('project:assignment_changed', async (payload) => {
    if (!_store) return

    const { projectId, projectName, employeeId, role, allocationPercent, action, startDate, endDate } = payload

    const employee = _store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId

    console.info(
      `[Integration] Project assignment ${action}: ${employeeName} ${action === 'removed' ? 'from' : 'to'} "${projectName}" ` +
      `(${allocationPercent}% allocation)`,
    )

    const storeSlice = _store as unknown as Parameters<typeof syncProjectAssignments>[6]
    const result = syncProjectAssignments(
      projectId,
      projectName,
      employeeId,
      role,
      allocationPercent,
      action,
      storeSlice,
      { startDate, endDate },
    )

    if (action === 'removed') {
      _store.addToast?.({
        type: 'info',
        title: 'Project Assignment Removed',
        description: `${employeeName} removed from "${projectName}".`,
      })
      return
    }

    if (result.templates.length > 0) {
      console.info(
        `[Integration] ${result.templates.length} time entry template(s) created for ${employeeName} on "${projectName}"`,
      )
    }

    if (result.hoursTracker) {
      console.info(
        `[Integration] Project hours tracker for ${employeeName}: ` +
        `${result.hoursTracker.loggedHours}/${result.hoursTracker.budgetHours}h (${result.hoursTracker.utilizationPercent}%)`,
      )
    }

    _store.addToast?.({
      type: 'success',
      title: action === 'assigned' ? 'Project Assignment' : 'Assignment Updated',
      description: `${employeeName} ${action} to "${projectName}" at ${allocationPercent}% allocation. ${result.templates.length} time template(s) ready.`,
    })
  })
}

// ── 22. EOR → Payroll ─────────────────────────────────────────────────────────

function registerEORToPayroll(): void {
  eventBus.on('eor:data_changed', async (payload) => {
    if (!_store) return

    const { eorEntityId, employeeId, country, changeType, localSalaryCents, localCurrency, effectiveDate } = payload

    const employee = _store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId

    console.info(
      `[Integration] EOR data changed for ${employeeName} (${country}): ${changeType} — syncing payroll rules`,
    )

    const result = syncEORPayrollRules(
      eorEntityId,
      employeeId,
      country,
      localSalaryCents,
      localCurrency,
      changeType,
    )

    const totalCostFormatted = (result.cost.totalCostCents / 100).toFixed(2)
    const netSalaryFormatted = (result.cost.netSalaryCents / 100).toFixed(2)

    console.info(
      `[Integration] EOR payroll sync for ${employeeName} (${country}): ` +
      `gross ${(localSalaryCents / 100).toFixed(2)} ${localCurrency}, ` +
      `net ${netSalaryFormatted}, total employer cost ${totalCostFormatted} ${localCurrency}`,
    )

    if (_store.addEmployeePayrollEntry) {
      _store.addEmployeePayrollEntry({
        employee_id: employeeId,
        type: 'eor_payroll_sync',
        country,
        local_salary: localSalaryCents,
        local_currency: localCurrency,
        net_salary: result.cost.netSalaryCents,
        total_employer_cost: result.cost.totalCostCents,
        eor_fee: result.cost.eorManagementFeeCents,
        effective_date: effectiveDate,
        change_type: changeType,
        source: 'eor-payroll-integration',
        auto_generated: true,
      })
    }

    _store.addToast?.({
      type: 'success',
      title: 'EOR Payroll Synced',
      description: `${employeeName} (${country}): total employer cost ${totalCostFormatted} ${localCurrency}/month (includes EOR fee).`,
    })
  })
}

// ── 23. Mentoring → Performance ────────────────────────────────────────────────

function registerMentoringToPerformance(): void {
  eventBus.on('mentoring:session_completed', async (payload) => {
    if (!_store) return

    const { menteeId, sessionId, sessionType, milestoneReached, milestoneName } = payload

    console.info(
      `[Integration] Mentoring session ${sessionId} completed (${sessionType})` +
      (milestoneReached ? ` — milestone reached: "${milestoneName}"` : ''),
    )

    const results: string[] = []

    // 1. Update soft-skill competencies
    if (_store.competencyRatings) {
      const competencyResult = calculateMentoringCompetencyBoost(
        menteeId,
        sessionId,
        sessionType,
        _store.competencyRatings as any,
      )

      if (competencyResult.updatedCompetencies.length > 0) {
        const mpStore = _store as unknown as Parameters<typeof applyMentoringCompetencyUpdates>[1]
        applyMentoringCompetencyUpdates(competencyResult, mpStore)

        const names = competencyResult.updatedCompetencies
          .map(c => `${c.competencyName} (+${c.boost})`)
          .join(', ')
        results.push(`Competencies updated: ${names}`)
      }
    }

    // 2. Advance mentoring-related development goals
    if (_store.goals) {
      const goalUpdates = calculateMentoringGoalProgress(
        menteeId,
        sessionType,
        _store.goals as any,
      )

      if (goalUpdates.length > 0) {
        const mpStore = _store as unknown as Parameters<typeof applyMentoringGoalUpdates>[1]
        applyMentoringGoalUpdates(goalUpdates, mpStore)

        for (const update of goalUpdates) {
          results.push(
            `Goal "${update.goalTitle}" → ${update.newProgress}%` +
            (update.completed ? ' COMPLETED' : ''),
          )
        }
      }
    }

    if (results.length > 0) {
      _store.addToast?.({
        type: 'success',
        title: 'Mentoring Impact Applied',
        description: results.join('. ') + '.',
      })

      console.info(`[Integration] Mentoring→Performance for mentee ${menteeId}: ${results.join('; ')}`)
    }
  })
}

// ── 24. Device Store → IT Asset ───────────────────────────────────────────────

function registerDeviceStoreToAsset(): void {
  eventBus.on('device:provisioned', async (payload) => {
    if (!_store) return

    const { employeeId, deviceId, deviceType, deviceName, serialNumber, costCents, currency, orderId } = payload

    console.info(`[Integration] Device provisioned: "${deviceName}" (${deviceType}) for employee ${employeeId} — creating IT asset record`)

    const result = generateITAssetFromProvision(
      employeeId,
      deviceId,
      deviceType,
      deviceName,
      { serialNumber, costCents, currency, orderId },
    )

    const dsStore = _store as unknown as Parameters<typeof applyITAssetCreation>[1]
    const created = applyITAssetCreation(result, dsStore)

    if (created) {
      const costStr = costCents ? ` ($${(costCents / 100).toFixed(2)})` : ''
      console.info(
        `[Integration] IT asset created: "${deviceName}"${costStr}, ` +
        `warranty: ${result.warrantyMonths} months, assigned to ${employeeId}`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'IT Asset Created',
        description: `${deviceName} assigned to employee. Warranty: ${result.warrantyMonths} months.`,
      })
    }
  })
}

// ── 25. Life Events → Multiple ────────────────────────────────────────────────

function registerLifeEventsMulti(): void {
  eventBus.on('employee:life_event_reported', async (payload) => {
    if (!_store) return

    const { employeeId, eventType, eventDate, description, affectsBenefits, affectsTax } = payload

    const employee = _store.employees.find(e => e.id === employeeId)
    const employeeName = employee?.profile?.full_name || employeeId

    console.info(`[Integration] Life event reported by ${employeeName}: ${eventType} (${eventDate})`)

    const result = processLifeEvent(
      employeeId,
      eventType as LifeEventType,
      eventDate,
      { description },
    )

    // Apply HR task
    const leStore = _store as unknown as Parameters<typeof applyLifeEventActions>[1]
    applyLifeEventActions(result, leStore)

    const actions: string[] = []

    // Log benefits window
    if (affectsBenefits) {
      actions.push(`Benefits enrollment window opened (${result.benefitsWindow.windowStartDate} to ${result.benefitsWindow.windowEndDate})`)
      console.info(`[Integration] Benefits window opened for ${employeeName}: ${result.benefitsWindow.eligiblePlanTypes.join(', ')}`)
    }

    // Log tax suggestion
    if (affectsTax) {
      actions.push(`Tax withholding review: ${result.taxSuggestion.suggestedAction}`)
      console.info(`[Integration] Tax suggestion for ${employeeName}: ${result.taxSuggestion.suggestedAction}`)
    }

    actions.push(`HR task created: ${result.hrTask.title}`)
    console.info(`[Integration] HR task created for ${employeeName}: ${result.hrTask.requiredDocuments.length} document(s) required`)

    _store.addToast?.({
      type: 'success',
      title: 'Life Event Processed',
      description: actions.join('. ') + '.',
    })
  })
}

// ── 26. Strategy → Projects ───────────────────────────────────────────────────

function registerStrategyToProjects(): void {
  eventBus.on('strategy:initiative_updated', async (payload) => {
    if (!_store) return

    const { initiativeId, title, action, milestones, okrs, departmentId, ownerId } = payload

    if (!milestones || milestones.length === 0) {
      console.info(`[Integration] Strategy initiative "${title}" ${action} — no milestones to process`)
      return
    }

    console.info(`[Integration] Strategy initiative "${title}" ${action} — generating ${milestones.length} project task(s)`)

    const result = generateProjectTasksFromStrategy(
      initiativeId,
      title,
      milestones,
      okrs || [],
      { departmentId, ownerId },
    )

    if (result.tasksGenerated.length > 0) {
      const spStore = _store as unknown as Parameters<typeof applyStrategyProjectTasks>[1]
      const created = applyStrategyProjectTasks(result, spStore)

      console.info(
        `[Integration] Strategy→Projects for "${title}": ${created} task(s) created, ${result.kpiLinkages.length} KPI linkage(s)`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Strategy Tasks Generated',
        description: `${created} project task(s) created from "${title}" milestones. ${result.kpiLinkages.length} KPI(s) linked.`,
      })
    }
  })
}

// ── 27. Compliance Training → Compliance ──────────────────────────────────────

function registerComplianceTrainingToCompliance(): void {
  eventBus.on('compliance:training_status_changed', async (payload) => {
    if (!_store) return

    const { employeeId, trainingId, courseId, courseName, requirementId, status, completedAt, dueDate, regulationType } = payload

    console.info(`[Integration] Compliance training status changed: "${courseName}" → ${status} for employee ${employeeId}`)

    const result = processComplianceTrainingChange({
      employeeId,
      trainingId,
      courseId,
      courseName,
      requirementId,
      status,
      completedAt,
      dueDate,
      regulationType,
    })

    if (result.reportEntries.length > 0 || result.riskFlags.length > 0) {
      const ctStore = _store as unknown as Parameters<typeof applyComplianceTrainingAlerts>[1]
      const created = applyComplianceTrainingAlerts(result, ctStore)

      if (result.riskFlags.length > 0) {
        console.warn(
          `[Integration] Compliance risk: ${result.riskFlags.length} flag(s) for "${courseName}" — ` +
          result.riskFlags.map(f => `${f.severity}: ${f.daysOverdue} days overdue`).join(', '),
        )

        _store.addToast?.({
          type: 'error',
          title: 'Compliance Training Overdue',
          description: `"${courseName}" is overdue. ${created} compliance alert(s) created.`,
        })
      } else if (status === 'completed') {
        console.info(`[Integration] Compliance training completed: "${courseName}" by employee ${employeeId}`)

        _store.addToast?.({
          type: 'success',
          title: 'Compliance Training Complete',
          description: `"${courseName}" completed. Compliance record updated.`,
        })
      }
    }
  })
}

// ── 28. Expense → Finance ─────────────────────────────────────────────────────

function registerExpenseToFinance(): void {
  eventBus.on('expense:report_approved', async (payload) => {
    if (!_store) return

    const { employeeId, reportId, totalAmountCents, currency } = payload

    console.info(
      `[Integration] Expense report ${reportId} approved — generating GL journal entry (${(totalAmountCents / 100).toFixed(2)} ${currency})`,
    )

    const efStore = _store as unknown as Parameters<typeof generateExpenseJournalEntry>[4]
    const result = generateExpenseJournalEntry(
      reportId,
      employeeId,
      totalAmountCents,
      currency,
      efStore,
    )

    const applyStore = _store as unknown as Parameters<typeof applyExpenseJournalEntry>[1]
    const created = applyExpenseJournalEntry(result, applyStore)

    if (created) {
      const costCenters = result.costCenterBreakdown.map(c => c.costCenter).join(', ')
      console.info(
        `[Integration] Expense GL journal entry created: ${(totalAmountCents / 100).toFixed(2)} ${currency}, ` +
        `${result.journalEntry.lines.length} line(s), cost center(s): ${costCenters}`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'GL Journal Entry Created',
        description: `Expense report ${reportId}: ${(totalAmountCents / 100).toFixed(2)} ${currency} posted to general ledger.`,
      })
    }
  })
}

// ── 29. Payroll → Finance ─────────────────────────────────────────────────────

function registerPayrollToFinance(): void {
  eventBus.on('payroll:run_completed', async (payload) => {
    if (!_store) return

    const { payrollRunId, periodStart, periodEnd, totalGrossCents, totalNetCents, totalDeductionsCents, totalTaxCents, currency, employeeCount, departmentBreakdown } = payload

    console.info(
      `[Integration] Payroll run ${payrollRunId} completed — generating GL journal entries ` +
      `(${employeeCount} employees, ${(totalGrossCents / 100).toFixed(2)} ${currency} gross)`,
    )

    const result = generatePayrollJournalEntries(
      payrollRunId,
      periodStart,
      periodEnd,
      totalGrossCents,
      totalNetCents,
      totalDeductionsCents,
      totalTaxCents,
      currency,
      departmentBreakdown,
    )

    const pfStore = _store as unknown as Parameters<typeof applyPayrollJournalEntry>[1]
    const created = applyPayrollJournalEntry(result, pfStore)

    if (created) {
      console.info(
        `[Integration] Payroll GL journal entry created: ` +
        `gross ${(totalGrossCents / 100).toFixed(2)}, net ${(totalNetCents / 100).toFixed(2)}, ` +
        `tax ${(totalTaxCents / 100).toFixed(2)}, deductions ${(totalDeductionsCents / 100).toFixed(2)} ${currency}` +
        (result.departmentBreakdown.length > 0 ? ` across ${result.departmentBreakdown.length} department(s)` : ''),
      )

      _store.addToast?.({
        type: 'success',
        title: 'Payroll GL Entry Created',
        description: `Payroll run ${payrollRunId}: ${(totalGrossCents / 100).toFixed(2)} ${currency} gross posted to general ledger (${employeeCount} employees).`,
      })
    }
  })
}

// ── 30. Academy → Learning ────────────────────────────────────────────────────

function registerAcademyToLearning(): void {
  eventBus.on('academy:course_published', async (payload) => {
    if (!_store) return

    const { courseId, title, description, category, durationHours, format, level, targetDepartments, targetRoles, publishedBy } = payload

    console.info(`[Integration] Academy course published: "${title}" (${category}) — creating learning catalog entry`)

    const alStore = _store as unknown as Parameters<typeof processAcademyCoursePublication>[4]
    const result = processAcademyCoursePublication(
      courseId,
      title,
      description,
      category,
      alStore,
      { durationHours, format, level, targetDepartments, targetRoles, publishedBy },
    )

    const applyStore = _store as unknown as Parameters<typeof applyAcademyCatalogEntry>[1]
    const created = applyAcademyCatalogEntry(result, applyStore)

    if (created) {
      console.info(
        `[Integration] Learning catalog entry created for "${title}". ` +
        `${result.enrollmentSuggestions.length} department(s) suggested for enrollment ` +
        `(${result.summary.totalEstimatedEnrollees} estimated enrollees)`,
      )

      _store.addToast?.({
        type: 'success',
        title: 'Learning Catalog Updated',
        description: `"${title}" added to learning catalog. ${result.enrollmentSuggestions.length} department(s) recommended for enrollment.`,
      })
    }
  })
}

// ── 31. Cross-Module Notifications ────────────────────────────────────────────

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
