/**
 * Cross-Module Event Bus
 * ----------------------
 * Foundation for all cross-module integrations in the Tempo platform.
 * Modules publish typed events; other modules subscribe to react.
 *
 * Design decisions:
 *  - Handlers run asynchronously (fire-and-forget) so publishers are never blocked.
 *  - Every emitted event is appended to an in-memory audit log with timestamps.
 *  - Compatible with the existing `notifyEvent()` helper in store.tsx — the bus
 *    can optionally forward events to `/api/notifications/dispatch`.
 *  - Wildcard subscriptions (`*`) receive every event for cross-cutting concerns
 *    like logging or analytics.
 *  - Singleton pattern: import `eventBus` from this module everywhere.
 */

// ---------------------------------------------------------------------------
// Event payload types
// ---------------------------------------------------------------------------

export interface PerformanceReviewCompletedPayload {
  employeeId: string
  reviewId: string
  rating: number
  cycleId: string
  reviewerId?: string
  completedAt?: string
}

export interface OffboardingInitiatedPayload {
  employeeId: string
  offboardingId: string
  lastDay: string
  reason?: string
  initiatedBy?: string
}

export interface OffboardingTaskCompletedPayload {
  employeeId: string
  offboardingId: string
  taskId: string
  taskName: string
  completedBy?: string
}

export interface TravelBookingApprovedPayload {
  employeeId: string
  bookingId: string
  destination: string
  departureDate: string
  returnDate: string
  approvedBy?: string
  totalCostCents?: number
  currency?: string
}

export interface TravelBookingCompletedPayload {
  employeeId: string
  bookingId: string
  destination: string
  returnDate: string
  actualCostCents?: number
  currency?: string
}

export interface TimeTimesheetApprovedPayload {
  employeeId: string
  timesheetId: string
  periodStart: string
  periodEnd: string
  totalHours: number
  approvedBy?: string
}

export interface TimeOvertimeLoggedPayload {
  employeeId: string
  timesheetId: string
  date: string
  overtimeHours: number
  reason?: string
}

export interface PayrollRunApprovedPayload {
  payrollRunId: string
  orgId: string
  periodStart: string
  periodEnd: string
  totalAmountCents: number
  currency: string
  employeeCount: number
  approvedBy?: string
}

export interface PayrollRunPaidPayload {
  payrollRunId: string
  orgId: string
  periodStart: string
  periodEnd: string
  totalAmountCents: number
  currency: string
  employeeCount: number
  paidAt: string
}

export interface LeaveRequestApprovedPayload {
  employeeId: string
  leaveRequestId: string
  leaveType: string
  startDate: string
  endDate: string
  totalDays: number
  approvedBy?: string
}

export interface ExpenseReportSubmittedPayload {
  employeeId: string
  reportId: string
  totalAmountCents: number
  currency: string
  itemCount: number
  submittedAt?: string
}

export interface ExpenseReportApprovedPayload {
  employeeId: string
  reportId: string
  totalAmountCents: number
  currency: string
  approvedBy?: string
  approvedAt?: string
}

export interface LearningCourseCompletedPayload {
  employeeId: string
  courseId: string
  courseName: string
  score?: number
  certificateUrl?: string
  completedAt?: string
}

export interface RecruitingCandidateHiredPayload {
  employeeId?: string
  candidateName: string
  applicationId: string
  jobPostingId: string
  departmentId: string
  jobTitle: string
  level?: string
  startDate?: string
  hiredBy?: string
}

export interface OnboardingInitiatedPayload {
  employeeId: string
  onboardingId: string
  employeeName: string
  departmentId: string
  jobTitle: string
  startDate: string
  managerId?: string
}

export interface HeadcountPositionApprovedPayload {
  positionId: string
  planId: string
  departmentId: string
  jobTitle: string
  level: string
  location?: string
  budgetCents: number
  currency: string
  approvedBy?: string
}

export interface BenefitsEnrollmentChangedPayload {
  employeeId: string
  enrollmentId: string
  planId: string
  planType: string
  planName: string
  action: 'enrolled' | 'changed' | 'cancelled'
  previousPlanId?: string
  effectiveDate: string
  employeeCostCents?: number
  employerCostCents?: number
}

export interface CompensationSalaryApprovedPayload {
  employeeId: string
  salaryReviewId: string
  previousSalaryCents: number
  newSalaryCents: number
  currency: string
  effectiveDate: string
  approvedBy?: string
  reason?: string
}

export interface RecruitingOfferExtendedPayload {
  employeeId?: string
  candidateName: string
  applicationId: string
  jobPostingId: string
  departmentId: string
  jobTitle: string
  level?: string
  proposedSalaryCents: number
  currency: string
  extendedBy?: string
}

export interface WorkersCompClaimFiledPayload {
  employeeId: string
  claimId: string
  injuryType: string
  injuryDate: string
  restrictionType?: 'light_duty' | 'modified_schedule' | 'no_work'
  maxHoursPerDay?: number
  expectedReturnDate?: string
}

export interface EngagementSurveyCompletedPayload {
  surveyId: string
  surveyTitle: string
  departmentId?: string
  responseCount: number
  averageScore: number
  completedAt?: string
}

export interface ComplianceRequirementChangedPayload {
  requirementId: string
  requirementTitle: string
  regulationType: string
  affectedDepartments?: string[]
  affectedLocations?: string[]
  deadlineDate: string
  severity: 'critical' | 'high' | 'medium' | 'low'
}

export interface GeofenceEventPayload {
  employeeId: string
  zoneId: string
  zoneName: string
  eventType: 'enter' | 'exit'
  timestamp: string
  latitude?: number
  longitude?: number
}

export interface ShadowITDetectedPayload {
  detectionId: string
  appName: string
  appCategory: string
  detectedBy: string
  employeeCount: number
  dataAccessLevel: 'none' | 'read' | 'write' | 'admin'
  detectedAt?: string
}

export interface HeadcountPositionFilledPayload {
  positionId: string
  planId: string
  departmentId: string
  jobTitle: string
  level: string
  candidateName: string
  applicationId: string
  hireDate: string
  actualSalaryCents: number
  budgetCents: number
  currency: string
}

export interface ProjectAssignmentChangedPayload {
  projectId: string
  projectName: string
  employeeId: string
  role: string
  allocationPercent: number
  action: 'assigned' | 'updated' | 'removed'
  startDate?: string
  endDate?: string
}

export interface EORDataChangedPayload {
  eorEntityId: string
  employeeId: string
  country: string
  changeType: 'onboarded' | 'salary_changed' | 'terminated' | 'contract_renewed'
  localSalaryCents: number
  localCurrency: string
  effectiveDate: string
}

export interface MentoringSessionCompletedPayload {
  employeeId: string
  mentorId: string
  menteeId: string
  sessionId: string
  relationshipId: string
  sessionType: 'regular' | 'milestone' | 'final'
  topicsCovered?: string[]
  milestoneReached?: boolean
  milestoneName?: string
  completedAt?: string
}

export interface DeviceProvisionedPayload {
  employeeId: string
  deviceId: string
  deviceType: 'laptop' | 'desktop' | 'monitor' | 'phone' | 'tablet' | 'accessory'
  deviceName: string
  serialNumber?: string
  orderId?: string
  costCents?: number
  currency?: string
  provisionedAt?: string
}

export interface LifeEventReportedPayload {
  employeeId: string
  eventId: string
  eventType: 'marriage' | 'divorce' | 'birth' | 'adoption' | 'death_of_dependent' | 'disability' | 'relocation' | 'other'
  eventDate: string
  description?: string
  affectsBenefits: boolean
  affectsTax: boolean
  reportedAt?: string
}

export interface StrategyInitiativeUpdatedPayload {
  initiativeId: string
  orgId: string
  title: string
  status: 'draft' | 'active' | 'on_hold' | 'completed'
  action: 'created' | 'updated' | 'milestones_changed'
  milestones?: Array<{
    id: string
    title: string
    targetDate: string
    status: string
  }>
  okrs?: Array<{
    id: string
    objective: string
    keyResults: Array<{ id: string; title: string; target: number; current: number }>
  }>
  ownerId?: string
  departmentId?: string
}

export interface ComplianceTrainingStatusChangedPayload {
  employeeId: string
  trainingId: string
  courseId: string
  courseName: string
  requirementId: string
  status: 'completed' | 'overdue' | 'expiring_soon' | 'assigned'
  completedAt?: string
  dueDate?: string
  regulationType?: string
}

export interface PayrollRunCompletedPayload {
  payrollRunId: string
  orgId: string
  periodStart: string
  periodEnd: string
  totalGrossCents: number
  totalNetCents: number
  totalDeductionsCents: number
  totalTaxCents: number
  currency: string
  employeeCount: number
  departmentBreakdown?: Array<{
    departmentId: string
    departmentName: string
    totalGrossCents: number
    headcount: number
  }>
  completedAt: string
}

export interface AcademyCoursePublishedPayload {
  courseId: string
  orgId: string
  title: string
  description?: string
  category: string
  durationHours?: number
  format?: 'online' | 'classroom' | 'blended'
  level?: 'beginner' | 'intermediate' | 'advanced'
  targetDepartments?: string[]
  targetRoles?: string[]
  publishedBy?: string
  publishedAt?: string
}

// ---------------------------------------------------------------------------
// Event map — single source of truth for event name -> payload type
// ---------------------------------------------------------------------------

export interface EventMap {
  'performance:review_completed': PerformanceReviewCompletedPayload
  'offboarding:initiated': OffboardingInitiatedPayload
  'offboarding:task_completed': OffboardingTaskCompletedPayload
  'travel:booking_approved': TravelBookingApprovedPayload
  'travel:booking_completed': TravelBookingCompletedPayload
  'time:timesheet_approved': TimeTimesheetApprovedPayload
  'time:overtime_logged': TimeOvertimeLoggedPayload
  'payroll:run_approved': PayrollRunApprovedPayload
  'payroll:run_paid': PayrollRunPaidPayload
  'leave:request_approved': LeaveRequestApprovedPayload
  'expense:report_submitted': ExpenseReportSubmittedPayload
  'expense:report_approved': ExpenseReportApprovedPayload
  'learning:course_completed': LearningCourseCompletedPayload
  'recruiting:candidate_hired': RecruitingCandidateHiredPayload
  'onboarding:initiated': OnboardingInitiatedPayload
  'headcount:position_approved': HeadcountPositionApprovedPayload
  'benefits:enrollment_changed': BenefitsEnrollmentChangedPayload
  'compensation:salary_approved': CompensationSalaryApprovedPayload
  'recruiting:offer_extended': RecruitingOfferExtendedPayload
  'workers_comp:claim_filed': WorkersCompClaimFiledPayload
  'engagement:survey_completed': EngagementSurveyCompletedPayload
  'compliance:requirement_changed': ComplianceRequirementChangedPayload
  'geofencing:event_detected': GeofenceEventPayload
  'shadow_it:app_detected': ShadowITDetectedPayload
  'headcount:position_filled': HeadcountPositionFilledPayload
  'project:assignment_changed': ProjectAssignmentChangedPayload
  'eor:data_changed': EORDataChangedPayload
  'mentoring:session_completed': MentoringSessionCompletedPayload
  'device:provisioned': DeviceProvisionedPayload
  'employee:life_event_reported': LifeEventReportedPayload
  'strategy:initiative_updated': StrategyInitiativeUpdatedPayload
  'compliance:training_status_changed': ComplianceTrainingStatusChangedPayload
  'payroll:run_completed': PayrollRunCompletedPayload
  'academy:course_published': AcademyCoursePublishedPayload
}

export type EventName = keyof EventMap

// ---------------------------------------------------------------------------
// Handler & audit types
// ---------------------------------------------------------------------------

export type EventHandler<T extends EventName> = (
  payload: EventMap[T],
  meta: EventMeta
) => void | Promise<void>

export type WildcardHandler = (
  event: EventName,
  payload: EventMap[EventName],
  meta: EventMeta
) => void | Promise<void>

export interface EventMeta {
  /** Unique ID for this specific event firing */
  eventId: string
  /** ISO-8601 timestamp */
  timestamp: string
  /** Optional org context (injected automatically when available) */
  orgId?: string
}

export interface AuditEntry {
  eventId: string
  event: EventName
  payload: EventMap[EventName]
  timestamp: string
  orgId?: string
  handlerCount: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Utility — lightweight UUID-like ID (no crypto dependency needed)
// ---------------------------------------------------------------------------

let _seq = 0
function makeEventId(): string {
  _seq += 1
  const ts = Date.now().toString(36)
  const seq = _seq.toString(36).padStart(4, '0')
  const rand = Math.random().toString(36).slice(2, 8)
  return `evt_${ts}_${seq}_${rand}`
}

// ---------------------------------------------------------------------------
// EventBus class
// ---------------------------------------------------------------------------

const MAX_AUDIT_LOG_SIZE = 10_000

export class EventBus {
  private handlers: Map<EventName, Set<EventHandler<any>>> = new Map()
  private wildcardHandlers: Set<WildcardHandler> = new Set()
  private auditLog: AuditEntry[] = []
  private _orgId: string | undefined

  // ---- Configuration ----

  /** Set the org context that will be attached to every emitted event. */
  setOrgId(orgId: string) {
    this._orgId = orgId
  }

  // ---- Subscribe ----

  /**
   * Register a handler for a specific event type.
   * Returns an unsubscribe function.
   */
  on<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    let set = this.handlers.get(event)
    if (!set) {
      set = new Set()
      this.handlers.set(event, set)
    }
    set.add(handler)
    return () => {
      set!.delete(handler)
      if (set!.size === 0) this.handlers.delete(event)
    }
  }

  /**
   * Register a handler that fires exactly once, then auto-unsubscribes.
   */
  once<T extends EventName>(event: T, handler: EventHandler<T>): () => void {
    const wrapped: EventHandler<T> = (payload, meta) => {
      unsub()
      return handler(payload, meta)
    }
    const unsub = this.on(event, wrapped)
    return unsub
  }

  /**
   * Register a wildcard handler that receives every event.
   * Useful for logging, analytics, or forwarding to external systems.
   * Returns an unsubscribe function.
   */
  onAny(handler: WildcardHandler): () => void {
    this.wildcardHandlers.add(handler)
    return () => {
      this.wildcardHandlers.delete(handler)
    }
  }

  // ---- Publish ----

  /**
   * Emit an event. All matching handlers run asynchronously — the caller is
   * never blocked. Errors in individual handlers are caught, logged to the
   * audit trail, and reported via `console.error`; they never propagate.
   */
  emit<T extends EventName>(event: T, payload: EventMap[T]): EventMeta {
    const meta: EventMeta = {
      eventId: makeEventId(),
      timestamp: new Date().toISOString(),
      orgId: this._orgId,
    }

    const specificHandlers = this.handlers.get(event)
    const handlerCount =
      (specificHandlers?.size ?? 0) + this.wildcardHandlers.size

    const auditEntry: AuditEntry = {
      eventId: meta.eventId,
      event,
      payload,
      timestamp: meta.timestamp,
      orgId: this._orgId,
      handlerCount,
      errors: [],
    }

    // Fire all handlers asynchronously — never block the publisher
    const runHandlers = async () => {
      const tasks: Promise<void>[] = []

      if (specificHandlers) {
        for (const handler of specificHandlers) {
          tasks.push(
            Promise.resolve()
              .then(() => handler(payload, meta))
              .catch((err) => {
                const msg =
                  err instanceof Error ? err.message : String(err)
                auditEntry.errors.push(msg)
                console.error(
                  `[EventBus] Handler error for "${event}" (${meta.eventId}):`,
                  err
                )
              })
          )
        }
      }

      for (const handler of this.wildcardHandlers) {
        tasks.push(
          Promise.resolve()
            .then(() => handler(event, payload as EventMap[EventName], meta))
            .catch((err) => {
              const msg =
                err instanceof Error ? err.message : String(err)
              auditEntry.errors.push(msg)
              console.error(
                `[EventBus] Wildcard handler error for "${event}" (${meta.eventId}):`,
                err
              )
            })
        )
      }

      await Promise.allSettled(tasks)
    }

    // Schedule async — intentionally not awaited
    void runHandlers()

    // Append to audit log (ring buffer)
    this.auditLog.push(auditEntry)
    if (this.auditLog.length > MAX_AUDIT_LOG_SIZE) {
      this.auditLog = this.auditLog.slice(-MAX_AUDIT_LOG_SIZE)
    }

    return meta
  }

  // ---- Audit ----

  /** Return the full audit log (most recent entries last). */
  getAuditLog(): readonly AuditEntry[] {
    return this.auditLog
  }

  /** Return audit entries for a specific event type. */
  getAuditLogForEvent(event: EventName): AuditEntry[] {
    return this.auditLog.filter((e) => e.event === event)
  }

  /** Return the last N audit entries. */
  getRecentAuditEntries(count: number): AuditEntry[] {
    return this.auditLog.slice(-count)
  }

  /** Clear the audit log. Primarily useful in tests. */
  clearAuditLog() {
    this.auditLog = []
  }

  // ---- Teardown ----

  /** Remove all handlers. Does not clear the audit log. */
  removeAllHandlers() {
    this.handlers.clear()
    this.wildcardHandlers.clear()
  }

  /** Full reset — handlers + audit log. Useful in tests. */
  reset() {
    this.removeAllHandlers()
    this.clearAuditLog()
    this._orgId = undefined
    _seq = 0
  }

  // ---- Introspection (useful for debugging / dev tools) ----

  /** Number of registered handlers for a given event. */
  listenerCount(event: EventName): number {
    return (this.handlers.get(event)?.size ?? 0) + this.wildcardHandlers.size
  }

  /** All event names that currently have at least one specific handler. */
  activeEvents(): EventName[] {
    return Array.from(this.handlers.keys())
  }
}

// ---------------------------------------------------------------------------
// Singleton — use this throughout the application
// ---------------------------------------------------------------------------

export const eventBus = new EventBus()

// ---------------------------------------------------------------------------
// Helper: bridge to the existing notifyEvent() pattern in store.tsx
//
// Register this once at app boot to forward every event bus emission to the
// notifications dispatch API, maintaining backwards compatibility.
// ---------------------------------------------------------------------------

export function bridgeToNotifications(
  options: { baseUrl?: string } = {}
): () => void {
  const base = options.baseUrl ?? ''
  return eventBus.onAny((event, payload, meta) => {
    // Derive entityId and entityType from the payload shape
    const entityId =
      ('employeeId' in payload ? (payload as any).employeeId : undefined) ??
      ('payrollRunId' in payload ? (payload as any).payrollRunId : undefined) ??
      meta.eventId
    const entityType = event.split(':')[0] // e.g. "performance", "payroll"

    fetch(`${base}/api/notifications/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event,
        entityId,
        entityType,
        metadata: { ...payload, _eventId: meta.eventId },
      }),
    }).catch(() => {
      // Silently ignore — notification failure should never affect UX
      // (mirrors the existing notifyEvent() behaviour in store.tsx)
    })
  })
}
