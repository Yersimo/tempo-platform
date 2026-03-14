/**
 * Leave Integration for Payroll
 *
 * Links Time & Attendance leave data to payroll calculations.
 * Calculates unpaid leave deductions, pro-rated pay for partial months,
 * statutory sick pay, maternity/paternity pay, and holiday accruals.
 */

export interface LeaveRecord {
  id: string
  employeeId: string
  type: 'annual' | 'sick' | 'personal' | 'parental' | 'bereavement' | 'unpaid' | 'maternity' | 'paternity' | 'study'
  startDate: string
  endDate: string
  days: number
  status: 'approved' | 'pending' | 'rejected'
}

export interface LeavePayrollImpact {
  employeeId: string
  totalLeaveDays: number
  unpaidLeaveDays: number
  paidLeaveDays: number
  statutoryPayDays: number // SSP, SMP, etc.
  leaveDeduction: number   // cents to deduct
  statutoryPayAmount: number // cents to add (e.g., maternity pay)
  payType: 'full_month' | 'pro_rata_leave' | 'maternity' | 'paternity' | 'unpaid_leave'
  breakdown: LeaveBreakdownItem[]
}

export interface LeaveBreakdownItem {
  type: string
  days: number
  impact: 'no_deduction' | 'statutory_rate' | 'unpaid'
  amount: number // cents (negative = deduction, positive = payment)
  description: string
}

/**
 * Standard working days per month by country
 */
const WORKING_DAYS_PER_MONTH: Record<string, number> = {
  GH: 22, NG: 22, KE: 22, ZA: 21.67, CI: 22, SN: 22, CM: 22,
  TZ: 22, UG: 22, RW: 22, ET: 22, EG: 22, MA: 22,
  US: 21.67, UK: 21.67, DE: 21, FR: 21, CA: 21.67, AU: 21.67,
}

/**
 * Statutory daily rates as fraction of normal daily pay
 */
const STATUTORY_PAY_RATES: Record<string, Record<string, number>> = {
  GH: { sick: 1.0, maternity: 1.0, paternity: 0 },      // Ghana: full pay for sick, 12 weeks maternity at full pay
  NG: { sick: 1.0, maternity: 0.5, paternity: 0 },       // Nigeria: full sick pay, 50% maternity
  KE: { sick: 0.5, maternity: 1.0, paternity: 1.0 },     // Kenya: half pay after 30 days, full maternity
  ZA: { sick: 1.0, maternity: 0.67, paternity: 0.67 },   // SA: UIF covers 67% maternity
  CI: { sick: 1.0, maternity: 1.0, paternity: 0 },
  SN: { sick: 1.0, maternity: 1.0, paternity: 0 },
  US: { sick: 0, maternity: 0, paternity: 0 },            // US: no federal statutory pay
  UK: { sick: 0.25, maternity: 0.9, paternity: 0.9 },     // UK: SSP, SMP rates (simplified)
}

/**
 * Maximum statutory pay days by country and type
 */
const STATUTORY_MAX_DAYS: Record<string, Record<string, number>> = {
  GH: { sick: 365, maternity: 84, paternity: 5 },
  NG: { sick: 12, maternity: 84, paternity: 14 },
  KE: { sick: 30, maternity: 90, paternity: 14 },
  ZA: { sick: 30, maternity: 120, paternity: 10 },
  US: { sick: 0, maternity: 0, paternity: 0 },
  UK: { sick: 196, maternity: 273, paternity: 14 },
}

/**
 * Calculate the payroll impact of leave records for a given employee and period.
 *
 * @param leaves - Approved leave records overlapping the pay period
 * @param monthlyGross - Employee's monthly gross salary in cents
 * @param countryCode - ISO country code
 * @param periodStart - Start of pay period (YYYY-MM-DD)
 * @param periodEnd - End of pay period (YYYY-MM-DD)
 */
export function calculateLeavePayrollImpact(
  leaves: LeaveRecord[],
  monthlyGross: number,
  countryCode: string,
  periodStart: string,
  periodEnd: string,
): LeavePayrollImpact {
  const workingDays = WORKING_DAYS_PER_MONTH[countryCode] || 22
  const dailyRate = monthlyGross / workingDays
  const breakdown: LeaveBreakdownItem[] = []

  let unpaidLeaveDays = 0
  let paidLeaveDays = 0
  let statutoryPayDays = 0
  let leaveDeduction = 0
  let statutoryPayAmount = 0
  let payType: LeavePayrollImpact['payType'] = 'full_month'

  // Only process approved leaves
  const approvedLeaves = leaves.filter(l => l.status === 'approved')

  for (const leave of approvedLeaves) {
    // Calculate days overlapping with pay period
    const leaveStart = new Date(leave.startDate)
    const leaveEnd = new Date(leave.endDate)
    const pStart = new Date(periodStart)
    const pEnd = new Date(periodEnd)

    const overlapStart = leaveStart > pStart ? leaveStart : pStart
    const overlapEnd = leaveEnd < pEnd ? leaveEnd : pEnd

    if (overlapStart > overlapEnd) continue // No overlap

    // Calculate business days in overlap (simplified: use leave.days pro-rated)
    const totalLeaveDays = Math.max(1, Math.round((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const businessDays = Math.round(totalLeaveDays * 5 / 7) // Approximate

    const rates = STATUTORY_PAY_RATES[countryCode] || { sick: 0, maternity: 0, paternity: 0 }

    switch (leave.type) {
      case 'annual':
      case 'personal':
      case 'bereavement':
      case 'study': {
        // Paid leave — no deduction
        paidLeaveDays += businessDays
        breakdown.push({
          type: leave.type,
          days: businessDays,
          impact: 'no_deduction',
          amount: 0,
          description: `${leave.type.charAt(0).toUpperCase() + leave.type.slice(1)} leave — fully paid`,
        })
        break
      }

      case 'sick': {
        const sickRate = rates.sick || 0
        if (sickRate >= 1) {
          // Full pay
          paidLeaveDays += businessDays
          breakdown.push({
            type: 'sick',
            days: businessDays,
            impact: 'no_deduction',
            amount: 0,
            description: 'Sick leave — full pay per statutory requirements',
          })
        } else if (sickRate > 0) {
          // Partial pay (statutory rate)
          statutoryPayDays += businessDays
          const deduction = Math.round(dailyRate * businessDays * (1 - sickRate))
          leaveDeduction += deduction
          statutoryPayAmount += Math.round(dailyRate * businessDays * sickRate)
          breakdown.push({
            type: 'sick',
            days: businessDays,
            impact: 'statutory_rate',
            amount: -deduction,
            description: `Sick leave — ${(sickRate * 100).toFixed(0)}% statutory pay`,
          })
        } else {
          // Unpaid
          unpaidLeaveDays += businessDays
          const deduction = Math.round(dailyRate * businessDays)
          leaveDeduction += deduction
          breakdown.push({
            type: 'sick',
            days: businessDays,
            impact: 'unpaid',
            amount: -deduction,
            description: 'Sick leave — no statutory pay entitlement',
          })
        }
        break
      }

      case 'maternity': {
        payType = 'maternity'
        const matRate = rates.maternity || 0
        if (matRate >= 1) {
          paidLeaveDays += businessDays
          breakdown.push({
            type: 'maternity',
            days: businessDays,
            impact: 'no_deduction',
            amount: 0,
            description: 'Maternity leave — full pay per statutory requirements',
          })
        } else if (matRate > 0) {
          statutoryPayDays += businessDays
          const deduction = Math.round(dailyRate * businessDays * (1 - matRate))
          leaveDeduction += deduction
          breakdown.push({
            type: 'maternity',
            days: businessDays,
            impact: 'statutory_rate',
            amount: -deduction,
            description: `Maternity leave — ${(matRate * 100).toFixed(0)}% statutory pay`,
          })
        } else {
          unpaidLeaveDays += businessDays
          const deduction = Math.round(dailyRate * businessDays)
          leaveDeduction += deduction
          breakdown.push({
            type: 'maternity',
            days: businessDays,
            impact: 'unpaid',
            amount: -deduction,
            description: 'Maternity leave — unpaid (no federal statutory pay)',
          })
        }
        break
      }

      case 'paternity': {
        payType = 'paternity'
        const patRate = rates.paternity || 0
        if (patRate >= 1) {
          paidLeaveDays += businessDays
          breakdown.push({
            type: 'paternity',
            days: businessDays,
            impact: 'no_deduction',
            amount: 0,
            description: 'Paternity leave — full pay',
          })
        } else if (patRate > 0) {
          statutoryPayDays += businessDays
          const deduction = Math.round(dailyRate * businessDays * (1 - patRate))
          leaveDeduction += deduction
          breakdown.push({
            type: 'paternity',
            days: businessDays,
            impact: 'statutory_rate',
            amount: -deduction,
            description: `Paternity leave — ${(patRate * 100).toFixed(0)}% statutory pay`,
          })
        } else {
          unpaidLeaveDays += businessDays
          const deduction = Math.round(dailyRate * businessDays)
          leaveDeduction += deduction
          breakdown.push({
            type: 'paternity',
            days: businessDays,
            impact: 'unpaid',
            amount: -deduction,
            description: 'Paternity leave — unpaid',
          })
        }
        break
      }

      case 'unpaid': {
        payType = 'unpaid_leave'
        unpaidLeaveDays += businessDays
        const deduction = Math.round(dailyRate * businessDays)
        leaveDeduction += deduction
        breakdown.push({
          type: 'unpaid',
          days: businessDays,
          impact: 'unpaid',
          amount: -deduction,
          description: 'Unpaid leave — full deduction',
        })
        break
      }
    }
  }

  const totalLeaveDays = unpaidLeaveDays + paidLeaveDays + statutoryPayDays

  // Determine overall pay type
  if (totalLeaveDays === 0) {
    payType = 'full_month'
  } else if (payType === 'full_month' && unpaidLeaveDays > 0) {
    payType = 'pro_rata_leave'
  }

  return {
    employeeId: approvedLeaves[0]?.employeeId || '',
    totalLeaveDays,
    unpaidLeaveDays,
    paidLeaveDays,
    statutoryPayDays,
    leaveDeduction,
    statutoryPayAmount,
    payType,
    breakdown,
  }
}

/**
 * Get the statutory pay rates for display purposes
 */
export function getStatutoryPayRates(countryCode: string) {
  return STATUTORY_PAY_RATES[countryCode] || { sick: 0, maternity: 0, paternity: 0 }
}

/**
 * Get working days per month for a country
 */
export function getWorkingDaysPerMonth(countryCode: string): number {
  return WORKING_DAYS_PER_MONTH[countryCode] || 22
}
