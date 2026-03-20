/**
 * Offboarding → Payroll Integration
 *
 * When offboarding is initiated:
 * - Calculate final pay (prorated salary, unused PTO payout)
 * - Factor in any outstanding expense reimbursements
 * - Calculate COBRA/benefits termination
 * - Schedule final paycheck
 *
 * Uses the existing final-pay.ts calculator — does NOT duplicate logic.
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

import { calculateFinalPay, type FinalPayInput, type FinalPayResult } from './final-pay'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Offboarding process as stored in the store */
export interface OffboardingProcess {
  id: string
  org_id: string
  employee_id: string
  status: string
  reason?: string
  last_day?: string
  end_date?: string
  initiated_by?: string
  started_at: string
}

/** Leave balance for PTO payout calculation */
export interface LeaveBalance {
  employee_id: string
  leave_type: string
  balance: number  // days
  entitlement: number // annual days
}

/** Benefit enrollment for COBRA/termination calculation */
export interface ActiveBenefitEnrollment {
  id: string
  employee_id: string
  plan_id: string
  plan_name: string
  plan_type: string
  employee_contribution: number // cents per month
  employer_contribution: number // cents per month
  effective_date: string
}

/** Final paycheck schedule entry */
export interface FinalPaycheckEntry {
  employee_id: string
  employee_name: string
  type: 'final_pay'
  scheduled_date: string
  gross_amount: number    // cents
  net_amount: number      // cents
  breakdown: FinalPayResult
  outstanding_expenses: number // cents
  benefits_termination: {
    plans_terminated: number
    cobra_eligible: boolean
    final_deductions: number // cents
  }
  metadata: Record<string, unknown>
}

/** Result of processing offboarding for payroll */
export interface OffboardingPayrollResult {
  employeeId: string
  employeeName: string
  finalPay: FinalPayResult
  finalPaycheckEntry: FinalPaycheckEntry
  outstandingExpenses: number // cents
  benefitsTerminated: number
  cobraEligible: boolean
}

/** Store slice needed for offboarding→payroll operations */
export interface OffboardingPayrollStoreSlice {
  employees: Array<{
    id: string
    org_id: string
    department_id: string
    job_title: string
    level: string
    country: string
    salary?: number       // cents (monthly)
    currency?: string
    hire_date?: string
    profile?: { full_name: string; email: string }
  }>
  offboardingProcesses: Array<Record<string, unknown>>
  leaveBalances?: Array<Record<string, unknown>>
  leaveRequests?: Array<Record<string, unknown>>
  expenseReports?: Array<Record<string, unknown>>
  benefitEnrollments?: Array<Record<string, unknown>>
  benefitPlans?: Array<Record<string, unknown>>
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  addPayrollRun?: (data: Record<string, unknown>) => void
  updateOffboardingProcess?: (id: string, data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate years of service from hire date to last day.
 */
function calculateYearsOfService(hireDate: string, lastDay: string): number {
  const hire = new Date(hireDate)
  const end = new Date(lastDay)
  const diffMs = end.getTime() - hire.getTime()
  return Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)))
}

/**
 * Get unused PTO days for an employee.
 */
function getUnusedPTODays(
  employeeId: string,
  leaveBalances: Array<Record<string, unknown>>,
): { days: number; entitlement: number } {
  const ptoBalance = leaveBalances.find(
    b => (b as Record<string, unknown>).employee_id === employeeId
      && ((b as Record<string, unknown>).leave_type === 'annual' || (b as Record<string, unknown>).leave_type === 'pto'),
  )

  if (!ptoBalance) return { days: 0, entitlement: 20 }

  return {
    days: ((ptoBalance as Record<string, unknown>).balance as number) || 0,
    entitlement: ((ptoBalance as Record<string, unknown>).entitlement as number) || 20,
  }
}

/**
 * Get outstanding approved expense reimbursements for an employee.
 */
function getOutstandingExpenses(
  employeeId: string,
  expenseReports: Array<Record<string, unknown>>,
): number {
  return expenseReports
    .filter(r =>
      (r as Record<string, unknown>).employee_id === employeeId
      && ((r as Record<string, unknown>).status === 'approved' || (r as Record<string, unknown>).status === 'queued_for_payroll'),
    )
    .reduce((sum, r) => sum + (((r as Record<string, unknown>).total_amount as number) || 0), 0)
}

/**
 * Get active benefit enrollments for an employee.
 */
function getActiveBenefitEnrollments(
  employeeId: string,
  enrollments: Array<Record<string, unknown>>,
  plans: Array<Record<string, unknown>>,
): ActiveBenefitEnrollment[] {
  const planMap = new Map(plans.map(p => [(p as Record<string, unknown>).id as string, p]))

  return enrollments
    .filter(e =>
      (e as Record<string, unknown>).employee_id === employeeId
      && (e as Record<string, unknown>).status === 'active',
    )
    .map(e => {
      const enrollment = e as Record<string, unknown>
      const plan = planMap.get(enrollment.plan_id as string)
      return {
        id: enrollment.id as string,
        employee_id: employeeId,
        plan_id: enrollment.plan_id as string,
        plan_name: (plan as Record<string, unknown>)?.name as string || 'Unknown Plan',
        plan_type: (plan as Record<string, unknown>)?.type as string || 'other',
        employee_contribution: (enrollment.employee_contribution as number) || (plan as Record<string, unknown>)?.employee_cost as number || 0,
        employer_contribution: (enrollment.employer_contribution as number) || (plan as Record<string, unknown>)?.employer_cost as number || 0,
        effective_date: enrollment.effective_date as string || '',
      }
    })
}

/**
 * Determine COBRA eligibility based on country.
 * COBRA is US-specific; other countries have different continuation rules.
 */
function isCobraEligible(country: string): boolean {
  return country === 'US'
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process offboarding for payroll: calculate final pay, outstanding expenses,
 * and benefits termination.
 *
 * Delegates the core final pay calculation to final-pay.ts.
 *
 * @param offboardingProcessId - ID of the offboarding process
 * @param store                - Store slice with all needed data
 * @param options              - Optional configuration
 * @returns Complete offboarding payroll result
 */
export function processOffboardingForPayroll(
  offboardingProcessId: string,
  store: OffboardingPayrollStoreSlice,
  options: {
    terminationType?: FinalPayInput['terminationType']
    payInLieuOfNotice?: boolean
    noticePeriodDays?: number
    noticePeriodServed?: number
  } = {},
): OffboardingPayrollResult | null {
  const process = store.offboardingProcesses.find(
    p => (p as Record<string, unknown>).id === offboardingProcessId,
  ) as Record<string, unknown> | undefined
  if (!process) return null

  const employeeId = process.employee_id as string
  const employee = store.employees.find(e => e.id === employeeId)
  if (!employee) return null

  const lastDay = (process.last_day || process.end_date || new Date().toISOString().split('T')[0]) as string
  const terminationDate = lastDay
  const employeeName = employee.profile?.full_name || employeeId
  const country = employee.country || 'GH'
  const monthlySalary = employee.salary || 0
  const currency = employee.currency || 'USD'

  // Calculate years of service
  const hireDate = employee.hire_date || employee.profile?.email ? new Date().toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
  const yearsOfService = employee.hire_date
    ? calculateYearsOfService(employee.hire_date, lastDay)
    : 1

  // Get PTO balance
  const pto = getUnusedPTODays(employeeId, store.leaveBalances || [])

  // Get outstanding expenses
  const outstandingExpenses = getOutstandingExpenses(employeeId, store.expenseReports || [])

  // Get active benefits
  const activeBenefits = getActiveBenefitEnrollments(
    employeeId,
    store.benefitEnrollments || [],
    store.benefitPlans || [],
  )

  const cobraEligible = isCobraEligible(country)

  // Calculate final benefit deductions (prorated for final month)
  const finalBenefitDeductions = activeBenefits.reduce(
    (sum, b) => sum + b.employee_contribution, 0,
  )

  // Build final pay input
  const finalPayInput: FinalPayInput = {
    employeeId,
    employeeName,
    lastWorkingDate: lastDay,
    terminationDate,
    monthlySalary,
    country,
    currency,
    terminationType: options.terminationType || (process.reason as FinalPayInput['terminationType']) || 'resignation',
    unusedLeaveDays: pto.days,
    annualLeaveEntitlement: pto.entitlement,
    noticePeriodDays: options.noticePeriodDays ?? 30,
    noticePeriodServed: options.noticePeriodServed ?? 30,
    payInLieuOfNotice: options.payInLieuOfNotice ?? false,
    yearsOfService,
    outstandingLoans: 0,
    outstandingAdvances: 0,
    assetRecovery: 0,
    otherDeductions: finalBenefitDeductions,
    otherDeductionNotes: `Final benefit deductions from ${activeBenefits.length} active plan(s)`,
  }

  // Calculate final pay using the existing calculator
  const finalPay = calculateFinalPay(finalPayInput)

  // Add outstanding expenses to total (not part of the standard final pay calc)
  const adjustedNetPay = finalPay.netFinalPay + outstandingExpenses

  // Build the final paycheck entry
  const scheduledDate = lastDay // Final paycheck on last day

  const finalPaycheckEntry: FinalPaycheckEntry = {
    employee_id: employeeId,
    employee_name: employeeName,
    type: 'final_pay',
    scheduled_date: scheduledDate,
    gross_amount: finalPay.totalEarnings + outstandingExpenses,
    net_amount: adjustedNetPay,
    breakdown: finalPay,
    outstanding_expenses: outstandingExpenses,
    benefits_termination: {
      plans_terminated: activeBenefits.length,
      cobra_eligible: cobraEligible,
      final_deductions: finalBenefitDeductions,
    },
    metadata: {
      source: 'offboarding-payroll-integration',
      auto_generated: true,
      offboarding_process_id: offboardingProcessId,
      termination_type: finalPayInput.terminationType,
      years_of_service: yearsOfService,
      generated_at: new Date().toISOString(),
    },
  }

  return {
    employeeId,
    employeeName,
    finalPay,
    finalPaycheckEntry,
    outstandingExpenses,
    benefitsTerminated: activeBenefits.length,
    cobraEligible,
  }
}

/**
 * Apply the offboarding payroll result to the store.
 *
 * @param result - Output from processOffboardingForPayroll
 * @param store  - Store actions for persisting
 * @returns True if the final paycheck was scheduled
 */
export function applyOffboardingPayroll(
  result: OffboardingPayrollResult,
  store: OffboardingPayrollStoreSlice,
): boolean {
  if (!store.addEmployeePayrollEntry) return false

  // Create the final pay payroll entry
  store.addEmployeePayrollEntry({
    employee_id: result.employeeId,
    type: 'final_pay',
    category: 'earnings',
    gross_amount: result.finalPaycheckEntry.gross_amount,
    net_amount: result.finalPaycheckEntry.net_amount,
    currency: result.finalPay.currency,
    scheduled_date: result.finalPaycheckEntry.scheduled_date,
    description: `Final paycheck for ${result.employeeName}: net ${(result.finalPaycheckEntry.net_amount / 100).toFixed(2)} ${result.finalPay.currency}`,
    status: 'pending',
    ...result.finalPaycheckEntry.metadata,
  })

  // If there are outstanding expenses, create a separate reimbursement entry
  if (result.outstandingExpenses > 0) {
    store.addEmployeePayrollEntry({
      employee_id: result.employeeId,
      type: 'expense_reimbursement',
      category: 'reimbursement',
      amount: result.outstandingExpenses,
      currency: result.finalPay.currency,
      description: `Outstanding expense reimbursements included in final pay`,
      status: 'pending',
      source: 'offboarding-payroll-integration',
    })
  }

  return true
}
