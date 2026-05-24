/**
 * Expense Anomaly Detection
 *
 * Continuous statistical scoring of new expenses against the employee's
 * (and org's) baseline. Surfaces unusual expenses to approvers and CFO
 * month-end review — without requiring an ML model. Pure statistics
 * over historical expense data.
 *
 * Each anomaly check produces a signal in [0, 1]. The overall score is
 * a weighted blend. Every flag is explainable — no black-box risk
 * scores, per BRAND.md commitment.
 */

export interface HistoricalExpenseBaseline {
  /** Employee's expense history (last 90d, same category) */
  employeeCategoryAvg: number // cents
  employeeCategoryStdDev: number // cents
  employeeCategoryCount: number
  /** Employee's typical vendors for this category */
  knownVendors: Set<string>
  /** Org-wide median for same category */
  orgCategoryMedian: number
  /** Day-of-week and time-of-day pattern */
  typicalDayOfWeek: number[] // [0=Sun..6=Sat], normalized [0,1]
}

export interface AnomalyInput {
  expense: {
    amount: number // cents
    currency: string
    category: string
    vendor: string | null
    date: string // ISO 8601
    location?: {
      country?: string
      city?: string
    }
  }
  employee: {
    id: string
    homeCountry: string
  }
  baseline: HistoricalExpenseBaseline
}

export interface AnomalyResult {
  /** Composite score 0.0-1.0 — higher means more anomalous */
  score: number
  /** Human-readable flags that triggered */
  flags: string[]
  /** Per-signal scores for transparency */
  signals: {
    amountOutlier: number // z-score-based
    newVendor: number
    weekendExpense: number
    foreignCountry: number
    velocitySpike: number
    categoryDrift: number
  }
  /** Plain-English summary for approver and CFO */
  summary: string
}

// ─── Signal computations ─────────────────────────────────────────────

/**
 * Amount outlier: z-score against employee's historical category mean.
 * Returns normalized [0, 1] where 1 = >3 standard deviations away.
 */
function scoreAmountOutlier(input: AnomalyInput): number {
  const { employeeCategoryAvg, employeeCategoryStdDev, employeeCategoryCount } =
    input.baseline

  // Not enough history to score — treat as moderately unusual
  if (employeeCategoryCount < 5) return 0.3
  if (employeeCategoryStdDev === 0) {
    // History exists but no variance — anything different is unusual
    return input.expense.amount > employeeCategoryAvg * 1.5 ? 0.6 : 0
  }

  const zScore =
    Math.abs(input.expense.amount - employeeCategoryAvg) /
    employeeCategoryStdDev

  // Normalize to [0, 1]: <1 SD → 0, >3 SD → 1
  return Math.min(1, Math.max(0, (zScore - 1) / 2))
}

function scoreNewVendor(input: AnomalyInput): number {
  if (!input.expense.vendor) return 0
  return input.baseline.knownVendors.has(input.expense.vendor) ? 0 : 0.4
}

function scoreWeekendExpense(input: AnomalyInput): number {
  const date = new Date(input.expense.date)
  const day = date.getDay() // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6

  // Only flag if weekend AND employee rarely expenses on weekends
  const weekendProbability =
    (input.baseline.typicalDayOfWeek[0] ?? 0) +
    (input.baseline.typicalDayOfWeek[6] ?? 0)

  if (!isWeekend) return 0
  return weekendProbability < 0.1 ? 0.5 : 0.2
}

function scoreForeignCountry(input: AnomalyInput): number {
  if (!input.expense.location?.country) return 0
  if (input.expense.location.country === input.employee.homeCountry) return 0
  return 0.4 // foreign expenses are common but worth surfacing
}

function scoreVelocitySpike(input: AnomalyInput): number {
  // If this is the Nth expense from this employee today and >3, that's velocity
  // Simplified here — production tracks daily count via baseline metadata
  void input
  return 0
}

function scoreCategoryDrift(input: AnomalyInput): number {
  // Employee rarely expenses this category? Flag it.
  if (input.baseline.employeeCategoryCount === 0) return 0.5
  if (input.baseline.employeeCategoryCount < 3) return 0.25
  return 0
}

// ─── Composite scoring ───────────────────────────────────────────────

const WEIGHTS = {
  amountOutlier: 0.35,
  newVendor: 0.15,
  weekendExpense: 0.1,
  foreignCountry: 0.1,
  velocitySpike: 0.15,
  categoryDrift: 0.15,
}

export function detectAnomaly(input: AnomalyInput): AnomalyResult {
  const signals = {
    amountOutlier: scoreAmountOutlier(input),
    newVendor: scoreNewVendor(input),
    weekendExpense: scoreWeekendExpense(input),
    foreignCountry: scoreForeignCountry(input),
    velocitySpike: scoreVelocitySpike(input),
    categoryDrift: scoreCategoryDrift(input),
  }

  // Weighted composite
  const score =
    signals.amountOutlier * WEIGHTS.amountOutlier +
    signals.newVendor * WEIGHTS.newVendor +
    signals.weekendExpense * WEIGHTS.weekendExpense +
    signals.foreignCountry * WEIGHTS.foreignCountry +
    signals.velocitySpike * WEIGHTS.velocitySpike +
    signals.categoryDrift * WEIGHTS.categoryDrift

  const flags: string[] = []
  if (signals.amountOutlier > 0.4) {
    const multiple = (
      input.expense.amount / Math.max(1, input.baseline.employeeCategoryAvg)
    ).toFixed(1)
    flags.push(`${multiple}× typical ${input.expense.category} spend`)
  }
  if (signals.newVendor > 0) {
    flags.push(`new vendor "${input.expense.vendor}"`)
  }
  if (signals.weekendExpense > 0.3) {
    flags.push('weekend expense (unusual for this employee)')
  }
  if (signals.foreignCountry > 0) {
    flags.push(
      `foreign country (${input.expense.location?.country}, not ${input.employee.homeCountry})`,
    )
  }
  if (signals.categoryDrift > 0.2) {
    flags.push(`first ${input.expense.category} expense from this employee in 90d`)
  }

  const summary = composeSummary(score, flags, input)

  return { score, flags, signals, summary }
}

function composeSummary(
  score: number,
  flags: string[],
  input: AnomalyInput,
): string {
  if (score < 0.2) {
    return `Routine ${input.expense.category} expense. Within typical range for this employee.`
  }
  if (score < 0.5) {
    return `Mildly unusual: ${flags.join('; ')}. Likely fine, worth a glance.`
  }
  if (score < 0.75) {
    return `Anomalous: ${flags.join('; ')}. Recommend approver review.`
  }
  return `Strong anomaly: ${flags.join('; ')}. Recommend manual review and follow-up with employee.`
}

// ─── Helpers for building baselines from raw history ─────────────────

/**
 * Build a baseline from raw historical expenses. Used at scoring time
 * (cached per-employee per-category, refreshed daily).
 */
export function buildBaseline(
  historicalExpenses: Array<{
    amount: number
    category: string
    vendor: string | null
    date: string
  }>,
  targetCategory: string,
): HistoricalExpenseBaseline {
  const categoryExpenses = historicalExpenses.filter(
    (e) => e.category === targetCategory,
  )

  const amounts = categoryExpenses.map((e) => e.amount)
  const sum = amounts.reduce((a, b) => a + b, 0)
  const avg = amounts.length > 0 ? sum / amounts.length : 0
  const variance =
    amounts.length > 0
      ? amounts.reduce((acc, x) => acc + Math.pow(x - avg, 2), 0) / amounts.length
      : 0
  const stdDev = Math.sqrt(variance)

  const knownVendors = new Set(
    categoryExpenses
      .map((e) => e.vendor)
      .filter((v): v is string => Boolean(v)),
  )

  // Day-of-week distribution (normalized)
  const dayCounts = new Array(7).fill(0)
  for (const e of categoryExpenses) {
    dayCounts[new Date(e.date).getDay()]++
  }
  const totalDays = dayCounts.reduce((a, b) => a + b, 0) || 1
  const typicalDayOfWeek = dayCounts.map((c) => c / totalDays)

  // Org-wide median (placeholder — production queries across org)
  const sortedAmounts = [...amounts].sort((a, b) => a - b)
  const orgCategoryMedian =
    sortedAmounts.length > 0
      ? sortedAmounts[Math.floor(sortedAmounts.length / 2)]!
      : 0

  return {
    employeeCategoryAvg: avg,
    employeeCategoryStdDev: stdDev,
    employeeCategoryCount: categoryExpenses.length,
    knownVendors,
    orgCategoryMedian,
    typicalDayOfWeek,
  }
}
