/**
 * Recruiting → Headcount Integration
 *
 * When a position is filled (candidate hired):
 * - Update headcount plan position status to 'filled'
 * - Record actual hire date and hired candidate
 * - Calculate time-to-fill metrics
 * - Update budget utilization
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Time-to-fill metrics for a position */
export interface TimeToFillMetrics {
  positionId: string
  jobTitle: string
  departmentName: string
  daysToFill: number
  dateOpened: string
  dateFilled: string
  averageForRole?: number
  performance: 'fast' | 'average' | 'slow'
}

/** Budget utilization after filling a position */
export interface BudgetUtilization {
  positionId: string
  budgetCents: number
  actualSalaryCents: number
  utilizationPercent: number
  variance: 'under_budget' | 'on_budget' | 'over_budget'
  varianceAmountCents: number
  currency: string
}

/** Result of fulfilling a headcount position */
export interface HeadcountFulfillmentResult {
  positionId: string
  jobTitle: string
  candidateName: string
  departmentId: string
  hireDate: string
  timeToFill: TimeToFillMetrics
  budgetUtilization: BudgetUtilization
  positionUpdated: boolean
}

/** Store slice needed for recruiting→headcount operations */
export interface RecruitingHeadcountStoreSlice {
  headcountPositions: Array<Record<string, unknown>>
  departments: Array<{ id: string; name: string }>
  employees: Array<{ id: string; profile?: { full_name: string } }>
  updateHeadcountPosition?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Average time-to-fill benchmarks by level (days)
// ---------------------------------------------------------------------------

const TIME_TO_FILL_BENCHMARKS: Record<string, number> = {
  intern: 21,
  junior: 30,
  mid: 40,
  senior: 50,
  lead: 60,
  manager: 55,
  director: 70,
  vp: 90,
  'c-level': 120,
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Fulfill a headcount position when a candidate is hired.
 * Updates position status, calculates time-to-fill, and budget utilization.
 *
 * @param positionId       - ID of the headcount position
 * @param candidateName    - Name of the hired candidate
 * @param applicationId    - Application ID that led to the hire
 * @param hireDate         - Actual hire date
 * @param actualSalaryCents - Actual salary of the hire (in cents)
 * @param store            - Store slice with headcount data
 * @returns Fulfillment result with metrics
 */
export function fulfillHeadcountPosition(
  positionId: string,
  candidateName: string,
  applicationId: string,
  hireDate: string,
  actualSalaryCents: number,
  store: RecruitingHeadcountStoreSlice,
): HeadcountFulfillmentResult | null {
  const position = store.headcountPositions.find(
    p => (p as Record<string, unknown>).id === positionId,
  ) as Record<string, unknown> | undefined

  if (!position) {
    console.info(`[Integration] Headcount position ${positionId} not found`)
    return null
  }

  const jobTitle = (position.job_title as string) || (position.title as string) || 'Unknown'
  const level = ((position.level as string) || 'mid').toLowerCase()
  const departmentId = (position.department_id as string) || ''
  const budgetCents = (position.budget as number) || (position.budget_cents as number) || 0
  const currency = (position.currency as string) || 'USD'
  const dateOpened = (position.created_at as string) || (position.approved_date as string) || hireDate

  // Resolve department name
  const dept = store.departments.find(d => d.id === departmentId)
  const departmentName = dept?.name || 'Unknown'

  // Calculate time-to-fill
  const timeToFill = calculateTimeToFill(
    positionId,
    jobTitle,
    departmentName,
    level,
    dateOpened,
    hireDate,
  )

  // Calculate budget utilization
  const varianceAmount = budgetCents - actualSalaryCents
  const utilizationPercent = budgetCents > 0
    ? Math.round((actualSalaryCents / budgetCents) * 100)
    : 100

  let variance: BudgetUtilization['variance']
  if (utilizationPercent <= 95) variance = 'under_budget'
  else if (utilizationPercent <= 105) variance = 'on_budget'
  else variance = 'over_budget'

  const budgetUtilization: BudgetUtilization = {
    positionId,
    budgetCents,
    actualSalaryCents,
    utilizationPercent,
    variance,
    varianceAmountCents: Math.abs(varianceAmount),
    currency,
  }

  // Update position in store
  let positionUpdated = false
  if (store.updateHeadcountPosition) {
    store.updateHeadcountPosition(positionId, {
      status: 'filled',
      filled_date: hireDate,
      hired_candidate: candidateName,
      application_id: applicationId,
      actual_salary: actualSalaryCents,
      time_to_fill_days: timeToFill.daysToFill,
      budget_utilization_percent: utilizationPercent,
    })
    positionUpdated = true
  }

  return {
    positionId,
    jobTitle,
    candidateName,
    departmentId,
    hireDate,
    timeToFill,
    budgetUtilization,
    positionUpdated,
  }
}

/**
 * Calculate time-to-fill metrics for a position.
 *
 * @param positionId    - Position ID
 * @param jobTitle      - Job title
 * @param departmentName - Department name
 * @param level         - Job level (e.g. 'senior', 'mid')
 * @param dateOpened    - Date the position was opened/approved
 * @param dateFilled    - Date the position was filled
 * @returns Time-to-fill metrics
 */
export function calculateTimeToFill(
  positionId: string,
  jobTitle: string,
  departmentName: string,
  level: string,
  dateOpened: string,
  dateFilled: string,
): TimeToFillMetrics {
  const openDate = new Date(dateOpened)
  const fillDate = new Date(dateFilled)
  const diffMs = fillDate.getTime() - openDate.getTime()
  const daysToFill = Math.max(0, Math.round(diffMs / (1000 * 60 * 60 * 24)))

  const benchmark = TIME_TO_FILL_BENCHMARKS[level.toLowerCase()] ||
    TIME_TO_FILL_BENCHMARKS['mid']

  let performance: TimeToFillMetrics['performance']
  if (daysToFill <= benchmark * 0.75) performance = 'fast'
  else if (daysToFill <= benchmark * 1.25) performance = 'average'
  else performance = 'slow'

  return {
    positionId,
    jobTitle,
    departmentName,
    daysToFill,
    dateOpened: dateOpened.split('T')[0],
    dateFilled: dateFilled.split('T')[0],
    averageForRole: benchmark,
    performance,
  }
}
