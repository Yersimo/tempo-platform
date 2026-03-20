/**
 * Performance -> Compensation Integration
 *
 * Bridges the performance review system with compensation management by:
 * 1. Generating merit recommendations from completed performance reviews
 * 2. Syncing review cycles into salary review proposals
 * 3. Calculating budget impact of merit recommendations
 *
 * All salary/amount values are in CENTS (e.g. 500000 = $5,000).
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Performance review as stored in the store / DB */
export interface PerformanceReview {
  id: string
  org_id: string
  cycle_id: string | null
  employee_id: string
  reviewer_id: string | null
  type: 'annual' | 'mid_year' | 'quarterly' | 'probation' | 'manager' | 'peer' | 'self'
  status: 'pending' | 'in_progress' | 'submitted' | 'completed'
  overall_rating: number | null
  ratings: Record<string, number> | null
  comments: string | null
  submitted_at: string | null
  acknowledged_at: string | null
  created_at: string
}

/** Review cycle record */
export interface ReviewCycle {
  id: string
  org_id: string
  title: string
  type: 'annual' | 'mid_year' | 'quarterly' | 'probation'
  status: 'draft' | 'active' | 'completed'
  start_date: string | null
  end_date: string | null
  created_at: string
}

/** Employee record (subset of fields needed here) */
export interface Employee {
  id: string
  org_id: string
  department_id: string
  job_title: string
  level: string
  country: string
  salary?: number          // in cents
  currency?: string
  profile?: {
    full_name: string
    email: string
    avatar_url?: string
    phone?: string
  }
}

/** Merit recommendation as expected by addMeritRecommendation / DB schema */
export interface MeritRecommendation {
  cycle_id: string
  employee_id: string
  manager_id?: string | null
  current_salary: number   // cents
  proposed_salary: number  // cents
  increase_percent: number // e.g. 6.0
  increase_amount: number  // cents
  rating: number | null
  justification: string
  status: 'pending' | 'manager_approved' | 'hr_approved' | 'final_approved' | 'rejected'
}

/** Salary review as expected by addSalaryReview / DB schema */
export interface SalaryReviewProposal {
  employee_id: string
  proposed_by?: string | null
  current_salary: number   // cents
  proposed_salary: number  // cents
  currency: string
  justification: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  cycle: string
}

/** Budget impact analysis returned by calculateMeritBudgetImpact */
export interface BudgetImpactAnalysis {
  /** Total annual cost increase in cents */
  totalCostIncrease: number
  /** Average raise percentage across all recommendations */
  averageIncreasePercent: number
  /** Median raise percentage */
  medianIncreasePercent: number
  /** Number of employees receiving a raise */
  employeesWithRaise: number
  /** Number of employees with 0% raise */
  employeesWithNoRaise: number
  /** Total current payroll of affected employees in cents */
  totalCurrentPayroll: number
  /** Total new payroll of affected employees in cents */
  totalNewPayroll: number
  /** Breakdown by department */
  byDepartment: DepartmentBudgetBreakdown[]
  /** Breakdown by raise tier */
  byRaiseTier: RaiseTierBreakdown[]
}

export interface DepartmentBudgetBreakdown {
  departmentId: string
  departmentName: string
  headcount: number
  totalCurrentPayroll: number   // cents
  totalCostIncrease: number     // cents
  averageIncreasePercent: number
}

export interface RaiseTierBreakdown {
  /** e.g. "9% (Exceptional)", "6% (Exceeds)", "3% (Meets)", "0% (Below)" */
  label: string
  percent: number
  employeeCount: number
  totalCostIncrease: number // cents
}

/** Store actions needed by the integration */
export interface CompensationStoreActions {
  addMeritRecommendation: (data: Record<string, unknown>) => void
  addSalaryReview: (data: Record<string, unknown>) => void
}

/** Result of generateMeritRecommendationsFromReviews */
export interface MeritGenerationResult {
  recommendations: MeritRecommendation[]
  skipped: { employeeId: string; reason: string }[]
  summary: {
    total: number
    created: number
    skipped: number
  }
}

/** Result of syncReviewsToCompensation */
export interface SyncResult {
  proposals: SalaryReviewProposal[]
  skipped: { employeeId: string; reason: string }[]
  summary: {
    totalReviews: number
    proposalsCreated: number
    skipped: number
    cycleTitle: string
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Rating-to-raise mapping matching the existing getRecommendedRaise logic */
const RAISE_TIERS = [
  { minRating: 4.5, percent: 9, label: 'Exceptional' },
  { minRating: 4.0, percent: 6, label: 'Exceeds Expectations' },
  { minRating: 3.0, percent: 3, label: 'Meets Expectations' },
  { minRating: 0,   percent: 0, label: 'Below Expectations' },
] as const

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate recommended raise percentage based on an overall rating.
 * Mirrors the existing `getRecommendedRaise` in performance/page.tsx.
 */
export function getRecommendedRaisePercent(rating: number): number {
  if (rating >= 4.5) return 9
  if (rating >= 4.0) return 6
  if (rating >= 3.0) return 3
  return 0
}

/**
 * Get the human-readable tier label for a raise percentage.
 */
function getRaiseTierLabel(percent: number): string {
  const tier = RAISE_TIERS.find(t => t.percent === percent)
  return tier ? `${tier.percent}% (${tier.label})` : `${percent}% (Custom)`
}

/**
 * Compute average rating for an employee across a set of reviews.
 * Only considers reviews with a non-null overall_rating.
 */
function computeAverageRating(reviews: PerformanceReview[]): number | null {
  const rated = reviews.filter(r => r.overall_rating != null)
  if (rated.length === 0) return null
  const sum = rated.reduce((acc, r) => acc + (r.overall_rating ?? 0), 0)
  return Math.round((sum / rated.length) * 10) / 10
}

/**
 * Compute the median of an array of numbers.
 */
function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0
    ? sorted[mid]
    : (sorted[mid - 1] + sorted[mid]) / 2
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate merit recommendations from completed performance reviews.
 *
 * Takes a list of completed reviews (with ratings), looks up each employee's
 * current salary, calculates the recommended raise using the standard
 * rating-to-raise formula, and produces merit recommendation records ready
 * to be persisted via `addMeritRecommendation`.
 *
 * @param reviews - Performance reviews to base recommendations on. Only
 *   reviews with status 'completed' or 'submitted' and a non-null
 *   overall_rating will be processed. When multiple reviews exist for the
 *   same employee, their ratings are averaged.
 * @param employees - Full employee list for salary lookups.
 * @param meritCycleId - The merit cycle these recommendations belong to.
 * @param options - Optional overrides.
 * @returns A result object containing the created recommendations and a
 *   summary of what was skipped.
 */
export function generateMeritRecommendationsFromReviews(
  reviews: PerformanceReview[],
  employees: Employee[],
  meritCycleId: string,
  options?: {
    /** Only process reviews from a specific review cycle */
    reviewCycleId?: string
    /** Override the default raise formula with a custom mapper */
    customRaiseMapper?: (rating: number) => number
    /** ID of the proposing manager / HR user */
    proposedBy?: string
  },
): MeritGenerationResult {
  const { reviewCycleId, customRaiseMapper, proposedBy } = options ?? {}
  const raiseMapper = customRaiseMapper ?? getRecommendedRaisePercent

  // Filter to actionable reviews
  const eligibleReviews = reviews.filter(r => {
    if (r.status !== 'completed' && r.status !== 'submitted') return false
    if (r.overall_rating == null) return false
    if (reviewCycleId && r.cycle_id !== reviewCycleId) return false
    return true
  })

  // Build employee lookup
  const employeeMap = new Map(employees.map(e => [e.id, e]))

  // Group reviews by employee and average their ratings
  const reviewsByEmployee = new Map<string, PerformanceReview[]>()
  for (const review of eligibleReviews) {
    const existing = reviewsByEmployee.get(review.employee_id) ?? []
    existing.push(review)
    reviewsByEmployee.set(review.employee_id, existing)
  }

  const recommendations: MeritRecommendation[] = []
  const skipped: { employeeId: string; reason: string }[] = []

  for (const [employeeId, empReviews] of reviewsByEmployee) {
    const employee = employeeMap.get(employeeId)

    // Skip if employee not found
    if (!employee) {
      skipped.push({ employeeId, reason: 'Employee not found in employee list' })
      continue
    }

    // Skip if no salary data
    const currentSalary = employee.salary ?? 0
    if (currentSalary <= 0) {
      skipped.push({ employeeId, reason: 'No salary data available' })
      continue
    }

    const avgRating = computeAverageRating(empReviews)
    if (avgRating == null) {
      skipped.push({ employeeId, reason: 'No valid ratings found' })
      continue
    }

    const raisePercent = raiseMapper(avgRating)
    const increaseAmount = Math.round(currentSalary * raisePercent / 100)
    const proposedSalary = currentSalary + increaseAmount

    const ratingLabel = RAISE_TIERS.find(t => avgRating >= t.minRating)?.label ?? 'Unrated'

    recommendations.push({
      cycle_id: meritCycleId,
      employee_id: employeeId,
      manager_id: proposedBy ?? empReviews[0]?.reviewer_id ?? null,
      current_salary: currentSalary,
      proposed_salary: proposedSalary,
      increase_percent: raisePercent,
      increase_amount: increaseAmount,
      rating: Math.round(avgRating),
      justification: `Performance-based merit increase: ${ratingLabel} rating (${avgRating}/5) -> ${raisePercent}% raise`,
      status: 'pending',
    })
  }

  return {
    recommendations,
    skipped,
    summary: {
      total: reviewsByEmployee.size + skipped.length,
      created: recommendations.length,
      skipped: skipped.length,
    },
  }
}

/**
 * Sync a completed review cycle into salary review proposals.
 *
 * Finds all reviews belonging to the given cycle, computes recommended
 * raises, and creates salary review records marked as 'pending_approval'
 * for HR / manager sign-off.
 *
 * @param reviewCycleId - The ID of the review cycle to sync from.
 * @param reviewCycles - All review cycles (to look up the cycle title).
 * @param reviews - All performance reviews.
 * @param employees - All employees.
 * @param options - Optional overrides.
 * @returns A summary of proposals created and anything skipped.
 */
export function syncReviewsToCompensation(
  reviewCycleId: string,
  reviewCycles: ReviewCycle[],
  reviews: PerformanceReview[],
  employees: Employee[],
  options?: {
    /** Override the default raise formula */
    customRaiseMapper?: (rating: number) => number
    /** ID of the person proposing these reviews */
    proposedBy?: string
    /** Currency override (defaults to employee currency or 'USD') */
    defaultCurrency?: string
  },
): SyncResult {
  const { customRaiseMapper, proposedBy, defaultCurrency = 'USD' } = options ?? {}
  const raiseMapper = customRaiseMapper ?? getRecommendedRaisePercent

  const cycle = reviewCycles.find(c => c.id === reviewCycleId)
  if (!cycle) {
    return {
      proposals: [],
      skipped: [],
      summary: {
        totalReviews: 0,
        proposalsCreated: 0,
        skipped: 0,
        cycleTitle: 'Unknown Cycle',
      },
    }
  }

  // Get completed reviews for this cycle
  const cycleReviews = reviews.filter(
    r => r.cycle_id === reviewCycleId
      && (r.status === 'completed' || r.status === 'submitted')
      && r.overall_rating != null,
  )

  const employeeMap = new Map(employees.map(e => [e.id, e]))

  // Group by employee and average ratings
  const reviewsByEmployee = new Map<string, PerformanceReview[]>()
  for (const review of cycleReviews) {
    const existing = reviewsByEmployee.get(review.employee_id) ?? []
    existing.push(review)
    reviewsByEmployee.set(review.employee_id, existing)
  }

  const proposals: SalaryReviewProposal[] = []
  const skipped: { employeeId: string; reason: string }[] = []

  for (const [employeeId, empReviews] of reviewsByEmployee) {
    const employee = employeeMap.get(employeeId)

    if (!employee) {
      skipped.push({ employeeId, reason: 'Employee not found' })
      continue
    }

    const currentSalary = employee.salary ?? 0
    if (currentSalary <= 0) {
      skipped.push({ employeeId, reason: 'No salary data' })
      continue
    }

    const avgRating = computeAverageRating(empReviews)
    if (avgRating == null) {
      skipped.push({ employeeId, reason: 'No valid ratings' })
      continue
    }

    const raisePercent = raiseMapper(avgRating)
    if (raisePercent <= 0) {
      // Still create a record for visibility, but with same salary
      proposals.push({
        employee_id: employeeId,
        proposed_by: proposedBy ?? null,
        current_salary: currentSalary,
        proposed_salary: currentSalary,
        currency: employee.currency ?? defaultCurrency,
        justification: `Performance review (${cycle.title}): Rating ${avgRating}/5 - No raise recommended`,
        status: 'pending_approval',
        cycle: cycle.title,
      })
      continue
    }

    const increaseAmount = Math.round(currentSalary * raisePercent / 100)
    const proposedSalary = currentSalary + increaseAmount

    proposals.push({
      employee_id: employeeId,
      proposed_by: proposedBy ?? null,
      current_salary: currentSalary,
      proposed_salary: proposedSalary,
      currency: employee.currency ?? defaultCurrency,
      justification: `Performance review (${cycle.title}): Rating ${avgRating}/5 -> ${raisePercent}% merit increase`,
      status: 'pending_approval',
      cycle: cycle.title,
    })
  }

  return {
    proposals,
    skipped,
    summary: {
      totalReviews: cycleReviews.length,
      proposalsCreated: proposals.length,
      skipped: skipped.length,
      cycleTitle: cycle.title,
    },
  }
}

/**
 * Calculate the budget impact of a set of merit recommendations.
 *
 * Provides a comprehensive analysis including total cost, averages,
 * department-level breakdowns, and distribution by raise tier.
 *
 * @param recommendations - The merit recommendations to analyze.
 * @param employees - All employees (for department lookups).
 * @param getDepartmentName - Function to resolve department IDs to names.
 * @returns A budget impact analysis object.
 */
export function calculateMeritBudgetImpact(
  recommendations: MeritRecommendation[],
  employees: Employee[],
  getDepartmentName: (departmentId: string) => string,
): BudgetImpactAnalysis {
  if (recommendations.length === 0) {
    return {
      totalCostIncrease: 0,
      averageIncreasePercent: 0,
      medianIncreasePercent: 0,
      employeesWithRaise: 0,
      employeesWithNoRaise: 0,
      totalCurrentPayroll: 0,
      totalNewPayroll: 0,
      byDepartment: [],
      byRaiseTier: [],
    }
  }

  const employeeMap = new Map(employees.map(e => [e.id, e]))

  // Aggregate totals
  let totalCostIncrease = 0
  let totalCurrentPayroll = 0
  let totalNewPayroll = 0
  let employeesWithRaise = 0
  let employeesWithNoRaise = 0
  const allPercents: number[] = []

  // Department accumulators
  const deptAccum = new Map<string, {
    departmentId: string
    headcount: number
    totalCurrentPayroll: number
    totalCostIncrease: number
    percentSum: number
  }>()

  // Tier accumulators
  const tierAccum = new Map<string, {
    label: string
    percent: number
    employeeCount: number
    totalCostIncrease: number
  }>()

  // Initialize tier buckets
  for (const tier of RAISE_TIERS) {
    const label = getRaiseTierLabel(tier.percent)
    tierAccum.set(label, {
      label,
      percent: tier.percent,
      employeeCount: 0,
      totalCostIncrease: 0,
    })
  }

  for (const rec of recommendations) {
    const increase = rec.increase_amount
    totalCostIncrease += increase
    totalCurrentPayroll += rec.current_salary
    totalNewPayroll += rec.proposed_salary
    allPercents.push(rec.increase_percent)

    if (rec.increase_percent > 0) {
      employeesWithRaise++
    } else {
      employeesWithNoRaise++
    }

    // Department breakdown
    const employee = employeeMap.get(rec.employee_id)
    const deptId = employee?.department_id ?? 'unknown'
    const existing = deptAccum.get(deptId)
    if (existing) {
      existing.headcount++
      existing.totalCurrentPayroll += rec.current_salary
      existing.totalCostIncrease += increase
      existing.percentSum += rec.increase_percent
    } else {
      deptAccum.set(deptId, {
        departmentId: deptId,
        headcount: 1,
        totalCurrentPayroll: rec.current_salary,
        totalCostIncrease: increase,
        percentSum: rec.increase_percent,
      })
    }

    // Tier breakdown
    const tierLabel = getRaiseTierLabel(rec.increase_percent)
    const tierBucket = tierAccum.get(tierLabel)
    if (tierBucket) {
      tierBucket.employeeCount++
      tierBucket.totalCostIncrease += increase
    } else {
      // Custom percentage not matching standard tiers
      tierAccum.set(tierLabel, {
        label: tierLabel,
        percent: rec.increase_percent,
        employeeCount: 1,
        totalCostIncrease: increase,
      })
    }
  }

  const averageIncreasePercent =
    allPercents.length > 0
      ? Math.round((allPercents.reduce((a, b) => a + b, 0) / allPercents.length) * 100) / 100
      : 0

  const byDepartment: DepartmentBudgetBreakdown[] = Array.from(deptAccum.values())
    .map(d => ({
      departmentId: d.departmentId,
      departmentName: getDepartmentName(d.departmentId),
      headcount: d.headcount,
      totalCurrentPayroll: d.totalCurrentPayroll,
      totalCostIncrease: d.totalCostIncrease,
      averageIncreasePercent:
        d.headcount > 0
          ? Math.round((d.percentSum / d.headcount) * 100) / 100
          : 0,
    }))
    .sort((a, b) => b.totalCostIncrease - a.totalCostIncrease)

  const byRaiseTier: RaiseTierBreakdown[] = Array.from(tierAccum.values())
    .filter(t => t.employeeCount > 0)
    .sort((a, b) => b.percent - a.percent)

  return {
    totalCostIncrease,
    averageIncreasePercent,
    medianIncreasePercent: median(allPercents),
    employeesWithRaise,
    employeesWithNoRaise,
    totalCurrentPayroll,
    totalNewPayroll,
    byDepartment,
    byRaiseTier,
  }
}

// ---------------------------------------------------------------------------
// Store Dispatch Helpers
// ---------------------------------------------------------------------------

/**
 * Persist generated merit recommendations to the store.
 *
 * Calls `addMeritRecommendation` for each recommendation in the result set.
 *
 * @param result - Output from generateMeritRecommendationsFromReviews.
 * @param store - Store actions (addMeritRecommendation).
 * @returns The number of records persisted.
 */
export function persistMeritRecommendations(
  result: MeritGenerationResult,
  store: Pick<CompensationStoreActions, 'addMeritRecommendation'>,
): number {
  for (const rec of result.recommendations) {
    store.addMeritRecommendation(rec as unknown as Record<string, unknown>)
  }
  return result.recommendations.length
}

/**
 * Persist salary review proposals to the store.
 *
 * Calls `addSalaryReview` for each proposal in the sync result.
 *
 * @param result - Output from syncReviewsToCompensation.
 * @param store - Store actions (addSalaryReview).
 * @returns The number of records persisted.
 */
export function persistSalaryReviewProposals(
  result: SyncResult,
  store: Pick<CompensationStoreActions, 'addSalaryReview'>,
): number {
  for (const proposal of result.proposals) {
    store.addSalaryReview(proposal as unknown as Record<string, unknown>)
  }
  return result.proposals.length
}
