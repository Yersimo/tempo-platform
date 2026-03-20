/**
 * Benefits → Payroll Integration
 *
 * When benefit enrollment changes:
 * - Calculate new deduction amounts
 * - Create payroll deduction adjustments
 * - Handle mid-period proration
 * - Support multiple benefit types (health, dental, vision, 401k, life insurance)
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Benefit plan as stored in the store */
export interface BenefitPlan {
  id: string
  org_id: string
  name: string
  type: 'health' | 'dental' | 'vision' | 'life' | 'disability' | '401k' | 'hsa' | 'fsa' | 'other'
  provider?: string
  employee_cost: number  // cents per month (employee contribution)
  employer_cost: number  // cents per month (employer contribution)
  coverage_type?: 'individual' | 'individual_plus_spouse' | 'family'
  status: 'active' | 'inactive'
}

/** Benefit enrollment record */
export interface BenefitEnrollment {
  id: string
  org_id: string
  employee_id: string
  plan_id: string
  status: 'active' | 'pending' | 'cancelled' | 'waived'
  coverage_level?: string
  effective_date: string
  end_date?: string
  employee_contribution?: number // cents per month
  employer_contribution?: number // cents per month
  created_at: string
}

/** Payroll deduction adjustment to be created */
export interface PayrollDeductionAdjustment {
  employee_id: string
  type: 'benefit_deduction'
  benefit_type: string
  plan_id: string
  plan_name: string
  action: 'add' | 'update' | 'remove'
  previous_amount: number  // cents per period
  new_amount: number       // cents per period
  prorated_amount?: number // cents (for mid-period changes)
  effective_date: string
  description: string
  metadata: Record<string, unknown>
}

/** Result of processing a benefit enrollment change */
export interface BenefitPayrollResult {
  employeeId: string
  adjustments: PayrollDeductionAdjustment[]
  totalNewDeductions: number   // cents per month
  totalPreviousDeductions: number // cents per month
  netChange: number            // cents per month (positive = more deductions)
  prorationApplied: boolean
  prorationDetails?: {
    daysRemaining: number
    daysInPeriod: number
    factor: number
  }
}

/** Store slice needed for benefits→payroll operations */
export interface BenefitsPayrollStoreSlice {
  benefitPlans: BenefitPlan[]
  benefitEnrollments: BenefitEnrollment[]
  employees: Array<{ id: string; profile?: { full_name: string } }>
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Benefit type display labels */
const BENEFIT_TYPE_LABELS: Record<string, string> = {
  health: 'Health Insurance',
  dental: 'Dental Insurance',
  vision: 'Vision Insurance',
  life: 'Life Insurance',
  disability: 'Disability Insurance',
  '401k': '401(k) Retirement',
  hsa: 'Health Savings Account',
  fsa: 'Flexible Spending Account',
  other: 'Other Benefits',
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Calculate proration factor for a mid-period enrollment change.
 *
 * @param effectiveDate - Date the change takes effect
 * @returns Proration details
 */
function calculateProration(effectiveDate: string): {
  daysRemaining: number
  daysInPeriod: number
  factor: number
} {
  const effective = new Date(effectiveDate)
  const year = effective.getFullYear()
  const month = effective.getMonth()

  // Days in the current month
  const daysInPeriod = new Date(year, month + 1, 0).getDate()
  // Days remaining including the effective date
  const dayOfMonth = effective.getDate()
  const daysRemaining = daysInPeriod - dayOfMonth + 1

  const factor = daysRemaining / daysInPeriod

  return {
    daysRemaining,
    daysInPeriod,
    factor: Math.round(factor * 1000) / 1000, // 3 decimal places
  }
}

/**
 * Check if a date is mid-period (not the 1st of the month).
 */
function isMidPeriod(dateStr: string): boolean {
  const d = new Date(dateStr)
  return d.getDate() > 1
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process a benefit enrollment change and generate payroll deduction adjustments.
 *
 * Handles:
 * - New enrollment (add deduction)
 * - Plan change (update deduction)
 * - Cancellation (remove deduction)
 * - Mid-period proration
 *
 * @param employeeId    - The employee whose enrollment changed
 * @param enrollmentId  - The enrollment that changed
 * @param action        - What happened: enrolled, changed, or cancelled
 * @param store         - Store slice with benefits and payroll data
 * @param options       - Optional configuration
 * @returns Adjustment result with payroll deduction entries
 */
export function processEnrollmentChange(
  employeeId: string,
  enrollmentId: string,
  action: 'enrolled' | 'changed' | 'cancelled',
  store: BenefitsPayrollStoreSlice,
  options: {
    previousPlanId?: string
    effectiveDate?: string
  } = {},
): BenefitPayrollResult {
  const enrollment = store.benefitEnrollments.find(e => e.id === enrollmentId)
  const adjustments: PayrollDeductionAdjustment[] = []
  let totalNewDeductions = 0
  let totalPreviousDeductions = 0
  let prorationApplied = false
  let prorationDetails: BenefitPayrollResult['prorationDetails']

  const effectiveDate = options.effectiveDate || enrollment?.effective_date || new Date().toISOString().split('T')[0]
  const midPeriod = isMidPeriod(effectiveDate)

  if (midPeriod) {
    prorationApplied = true
    prorationDetails = calculateProration(effectiveDate)
  }

  if (action === 'cancelled' || action === 'changed') {
    // Handle removal of previous plan deduction
    const prevPlanId = options.previousPlanId || enrollment?.plan_id
    if (prevPlanId) {
      const prevPlan = store.benefitPlans.find(p => p.id === prevPlanId)
      if (prevPlan) {
        const prevAmount = enrollment?.employee_contribution || prevPlan.employee_cost
        const proratedRefund = midPeriod && prorationDetails
          ? Math.round(prevAmount * prorationDetails.factor)
          : 0

        totalPreviousDeductions += prevAmount

        adjustments.push({
          employee_id: employeeId,
          type: 'benefit_deduction',
          benefit_type: prevPlan.type,
          plan_id: prevPlan.id,
          plan_name: prevPlan.name,
          action: 'remove',
          previous_amount: prevAmount,
          new_amount: 0,
          prorated_amount: proratedRefund > 0 ? -proratedRefund : undefined,
          effective_date: effectiveDate,
          description: `Remove ${BENEFIT_TYPE_LABELS[prevPlan.type] || prevPlan.type} deduction: ${prevPlan.name}${proratedRefund > 0 ? ` (prorated refund: ${(proratedRefund / 100).toFixed(2)})` : ''}`,
          metadata: {
            source: 'benefits-payroll-integration',
            auto_generated: true,
            enrollment_id: enrollmentId,
            action,
            generated_at: new Date().toISOString(),
          },
        })
      }
    }
  }

  if (action === 'enrolled' || action === 'changed') {
    // Handle addition of new plan deduction
    if (enrollment) {
      const plan = store.benefitPlans.find(p => p.id === enrollment.plan_id)
      if (plan) {
        const newAmount = enrollment.employee_contribution || plan.employee_cost
        const proratedAmount = midPeriod && prorationDetails
          ? Math.round(newAmount * prorationDetails.factor)
          : undefined

        totalNewDeductions += newAmount

        adjustments.push({
          employee_id: employeeId,
          type: 'benefit_deduction',
          benefit_type: plan.type,
          plan_id: plan.id,
          plan_name: plan.name,
          action: action === 'enrolled' ? 'add' : 'update',
          previous_amount: action === 'changed' ? totalPreviousDeductions : 0,
          new_amount: newAmount,
          prorated_amount: proratedAmount,
          effective_date: effectiveDate,
          description: `${action === 'enrolled' ? 'Add' : 'Update'} ${BENEFIT_TYPE_LABELS[plan.type] || plan.type} deduction: ${plan.name} - ${(newAmount / 100).toFixed(2)}/month${proratedAmount ? ` (prorated first month: ${(proratedAmount / 100).toFixed(2)})` : ''}`,
          metadata: {
            source: 'benefits-payroll-integration',
            auto_generated: true,
            enrollment_id: enrollmentId,
            plan_type: plan.type,
            coverage_level: enrollment.coverage_level,
            employer_contribution: enrollment.employer_contribution || plan.employer_cost,
            action,
            generated_at: new Date().toISOString(),
          },
        })
      }
    }
  }

  return {
    employeeId,
    adjustments,
    totalNewDeductions,
    totalPreviousDeductions,
    netChange: totalNewDeductions - totalPreviousDeductions,
    prorationApplied,
    prorationDetails,
  }
}

/**
 * Apply benefit payroll adjustments to the store.
 *
 * @param result - Output from processEnrollmentChange
 * @param store  - Store actions for persisting
 * @returns Number of payroll entries created
 */
export function applyBenefitDeductions(
  result: BenefitPayrollResult,
  store: BenefitsPayrollStoreSlice,
): number {
  let created = 0

  for (const adjustment of result.adjustments) {
    if (store.addEmployeePayrollEntry) {
      store.addEmployeePayrollEntry({
        employee_id: adjustment.employee_id,
        type: adjustment.type,
        category: 'deduction',
        amount: adjustment.action === 'remove' ? -(adjustment.prorated_amount || adjustment.previous_amount) : (adjustment.prorated_amount || adjustment.new_amount),
        currency: 'USD',
        description: adjustment.description,
        effective_date: adjustment.effective_date,
        benefit_plan_id: adjustment.plan_id,
        benefit_type: adjustment.benefit_type,
        status: 'pending',
        ...adjustment.metadata,
      })
      created++
    }
  }

  return created
}
