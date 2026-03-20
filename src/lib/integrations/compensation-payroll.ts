/**
 * Compensation → Payroll Integration
 *
 * When salary changes are approved:
 * - Calculate new pay rate
 * - Create payroll rate change entry
 * - Handle effective date logic
 * - Prorate if mid-period
 * - Update tax withholding estimates
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Salary review record as stored in the store */
export interface SalaryReview {
  id: string
  org_id: string
  employee_id: string
  current_salary: number   // cents (annual)
  proposed_salary: number  // cents (annual)
  currency: string
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected' | 'applied'
  justification?: string
  approved_by?: string
  effective_date?: string
  created_at: string
}

/** Payroll rate change entry */
export interface PayrollRateChangeEntry {
  employee_id: string
  type: 'salary_change'
  previous_annual_salary: number  // cents
  new_annual_salary: number       // cents
  previous_monthly_rate: number   // cents
  new_monthly_rate: number        // cents
  increase_amount: number         // cents (annual)
  increase_percent: number
  effective_date: string
  prorated_adjustment?: number    // cents (for mid-period changes)
  estimated_tax_impact?: {
    previous_monthly_tax: number  // cents
    new_monthly_tax: number       // cents
    monthly_difference: number    // cents
  }
  currency: string
  description: string
  metadata: Record<string, unknown>
}

/** Result of processing a salary change for payroll */
export interface CompensationPayrollResult {
  employeeId: string
  rateChange: PayrollRateChangeEntry
  prorationApplied: boolean
  prorationDetails?: {
    daysRemaining: number
    daysInPeriod: number
    factor: number
    adjustmentAmount: number // cents
  }
  taxImpact: {
    previousMonthlyTax: number  // cents
    newMonthlyTax: number       // cents
    monthlyDifference: number   // cents
    annualDifference: number    // cents
  }
}

/** Store slice needed for compensation→payroll operations */
export interface CompensationPayrollStoreSlice {
  employees: Array<{
    id: string
    country: string
    salary?: number
    currency?: string
    profile?: { full_name: string }
  }>
  salaryReviews: SalaryReview[]
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  updateEmployee?: (id: string, data: Record<string, unknown>) => void
  updateSalaryReview?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Tax Estimation
// ---------------------------------------------------------------------------

/**
 * Simplified effective tax rate by country and income bracket.
 * In production, this would use the full statutory tax engine.
 */
const EFFECTIVE_TAX_RATES: Record<string, Array<{ maxAnnual: number; rate: number }>> = {
  GH: [
    { maxAnnual: 408000, rate: 0 },      // 0-4,080 GHS
    { maxAnnual: 528000, rate: 0.05 },
    { maxAnnual: 648000, rate: 0.10 },
    { maxAnnual: 3384000, rate: 0.175 },
    { maxAnnual: Infinity, rate: 0.25 },
  ],
  NG: [
    { maxAnnual: 30000000, rate: 0.07 },
    { maxAnnual: 60000000, rate: 0.11 },
    { maxAnnual: 110000000, rate: 0.15 },
    { maxAnnual: Infinity, rate: 0.24 },
  ],
  US: [
    { maxAnnual: 1100000, rate: 0.10 },
    { maxAnnual: 4467500, rate: 0.12 },
    { maxAnnual: 9537500, rate: 0.22 },
    { maxAnnual: 16763500, rate: 0.24 },
    { maxAnnual: Infinity, rate: 0.32 },
  ],
  KE: [
    { maxAnnual: 28800000, rate: 0.10 },
    { maxAnnual: 38880000, rate: 0.25 },
    { maxAnnual: Infinity, rate: 0.30 },
  ],
}

/** Default tax rate when country is not found */
const DEFAULT_TAX_RATE = 0.15

/**
 * Estimate effective monthly tax for an annual salary in a given country.
 * Returns amount in cents.
 */
function estimateMonthlyTax(annualSalaryCents: number, countryCode: string): number {
  const brackets = EFFECTIVE_TAX_RATES[countryCode]
  if (!brackets) {
    return Math.round((annualSalaryCents / 12) * DEFAULT_TAX_RATE)
  }

  const bracket = brackets.find(b => annualSalaryCents <= b.maxAnnual) || brackets[brackets.length - 1]
  return Math.round((annualSalaryCents / 12) * bracket.rate)
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate proration for mid-period salary changes.
 */
function calculateProration(effectiveDate: string, newMonthlyRate: number, previousMonthlyRate: number): {
  daysRemaining: number
  daysInPeriod: number
  factor: number
  adjustmentAmount: number
} {
  const effective = new Date(effectiveDate)
  const year = effective.getFullYear()
  const month = effective.getMonth()
  const daysInPeriod = new Date(year, month + 1, 0).getDate()
  const dayOfMonth = effective.getDate()
  const daysRemaining = daysInPeriod - dayOfMonth + 1
  const factor = daysRemaining / daysInPeriod

  // The adjustment is the difference for the remaining days of the period
  const monthlyDifference = newMonthlyRate - previousMonthlyRate
  const adjustmentAmount = Math.round(monthlyDifference * factor)

  return {
    daysRemaining,
    daysInPeriod,
    factor: Math.round(factor * 1000) / 1000,
    adjustmentAmount,
  }
}

function isMidPeriod(dateStr: string): boolean {
  return new Date(dateStr).getDate() > 1
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process an approved salary change for payroll.
 *
 * @param salaryReviewId - ID of the approved salary review
 * @param store          - Store slice with compensation and payroll data
 * @param options        - Optional configuration
 * @returns Processing result with rate change entry and tax impact
 */
export function processSalaryChangeForPayroll(
  salaryReviewId: string,
  store: CompensationPayrollStoreSlice,
  options: {
    effectiveDate?: string
  } = {},
): CompensationPayrollResult | null {
  const review = store.salaryReviews.find(r => r.id === salaryReviewId)
  if (!review || review.status !== 'approved') return null

  const employee = store.employees.find(e => e.id === review.employee_id)
  if (!employee) return null

  const effectiveDate = options.effectiveDate || review.effective_date || new Date().toISOString().split('T')[0]
  const currency = review.currency || employee.currency || 'USD'
  const country = employee.country || 'GH'

  const previousAnnual = review.current_salary
  const newAnnual = review.proposed_salary
  const previousMonthly = Math.round(previousAnnual / 12)
  const newMonthly = Math.round(newAnnual / 12)
  const increaseAmount = newAnnual - previousAnnual
  const increasePercent = previousAnnual > 0
    ? Math.round((increaseAmount / previousAnnual) * 10000) / 100
    : 0

  // Tax impact estimation
  const previousMonthlyTax = estimateMonthlyTax(previousAnnual, country)
  const newMonthlyTax = estimateMonthlyTax(newAnnual, country)
  const monthlyTaxDiff = newMonthlyTax - previousMonthlyTax

  // Proration
  const midPeriod = isMidPeriod(effectiveDate)
  let prorationApplied = false
  let prorationDetails: CompensationPayrollResult['prorationDetails']
  let proratedAdjustment: number | undefined

  if (midPeriod) {
    prorationApplied = true
    prorationDetails = calculateProration(effectiveDate, newMonthly, previousMonthly)
    proratedAdjustment = prorationDetails.adjustmentAmount
  }

  const employeeName = employee.profile?.full_name || review.employee_id

  const rateChange: PayrollRateChangeEntry = {
    employee_id: review.employee_id,
    type: 'salary_change',
    previous_annual_salary: previousAnnual,
    new_annual_salary: newAnnual,
    previous_monthly_rate: previousMonthly,
    new_monthly_rate: newMonthly,
    increase_amount: increaseAmount,
    increase_percent: increasePercent,
    effective_date: effectiveDate,
    prorated_adjustment: proratedAdjustment,
    estimated_tax_impact: {
      previous_monthly_tax: previousMonthlyTax,
      new_monthly_tax: newMonthlyTax,
      monthly_difference: monthlyTaxDiff,
    },
    currency,
    description: `Salary change for ${employeeName}: ${(previousAnnual / 100).toFixed(2)} → ${(newAnnual / 100).toFixed(2)} ${currency}/year (${increasePercent >= 0 ? '+' : ''}${increasePercent}%)${proratedAdjustment ? ` — prorated adjustment: ${(proratedAdjustment / 100).toFixed(2)}` : ''}`,
    metadata: {
      source: 'compensation-payroll-integration',
      auto_generated: true,
      salary_review_id: salaryReviewId,
      approved_by: review.approved_by,
      justification: review.justification,
      generated_at: new Date().toISOString(),
    },
  }

  return {
    employeeId: review.employee_id,
    rateChange,
    prorationApplied,
    prorationDetails,
    taxImpact: {
      previousMonthlyTax,
      newMonthlyTax,
      monthlyDifference: monthlyTaxDiff,
      annualDifference: monthlyTaxDiff * 12,
    },
  }
}

/**
 * Apply salary change to the payroll system and update employee records.
 *
 * @param result - Output from processSalaryChangeForPayroll
 * @param store  - Store actions for persisting
 * @returns True if the change was applied
 */
export function applySalaryChangeToPayroll(
  result: CompensationPayrollResult,
  store: CompensationPayrollStoreSlice,
): boolean {
  // Create payroll adjustment entry
  if (store.addEmployeePayrollEntry) {
    store.addEmployeePayrollEntry({
      employee_id: result.rateChange.employee_id,
      type: 'salary_change',
      category: 'rate_change',
      previous_amount: result.rateChange.previous_monthly_rate,
      new_amount: result.rateChange.new_monthly_rate,
      adjustment: result.rateChange.prorated_adjustment || 0,
      currency: result.rateChange.currency,
      effective_date: result.rateChange.effective_date,
      description: result.rateChange.description,
      status: 'pending',
      ...result.rateChange.metadata,
    })
  }

  // Update employee salary
  if (store.updateEmployee) {
    store.updateEmployee(result.employeeId, {
      salary: result.rateChange.new_annual_salary,
    })
  }

  // Mark the salary review as applied
  const reviewId = result.rateChange.metadata.salary_review_id as string
  if (reviewId && store.updateSalaryReview) {
    store.updateSalaryReview(reviewId, {
      status: 'applied',
      applied_at: new Date().toISOString(),
    })
  }

  return true
}
