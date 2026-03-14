/**
 * Final Pay Calculator
 *
 * Calculates the final pay for an employee leaving the organization.
 * Handles pro-rated salary, unused leave payout, notice pay,
 * severance, and final deductions.
 */

import { getWorkingDaysPerMonth } from './leave-integration'

export interface FinalPayInput {
  employeeId: string
  employeeName: string
  lastWorkingDate: string    // YYYY-MM-DD
  terminationDate: string    // YYYY-MM-DD
  monthlySalary: number      // cents
  country: string            // ISO code
  currency: string
  terminationType: 'resignation' | 'termination' | 'redundancy' | 'retirement' | 'end_of_contract' | 'mutual_agreement'
  // Leave
  unusedLeaveDays: number
  annualLeaveEntitlement: number // total annual days
  // Notice
  noticePeriodDays: number
  noticePeriodServed: number  // days served
  payInLieuOfNotice: boolean
  // Service
  yearsOfService: number
  // Deductions
  outstandingLoans: number    // cents
  outstandingAdvances: number // cents
  assetRecovery: number      // cents (unreturned equipment etc.)
  otherDeductions: number    // cents
  otherDeductionNotes: string
}

export interface FinalPayResult {
  employeeId: string
  employeeName: string

  // Earnings
  proRatedSalary: number     // cents
  proRatedDays: number
  unusedLeavePayout: number  // cents
  unusedLeaveDays: number
  noticePayAmount: number    // cents
  noticePayDays: number
  severancePay: number       // cents
  severanceWeeks: number
  gratuitySSSF: number       // cents (Ghanaian end-of-service gratuity)
  repatriationAllowance: number // cents
  totalEarnings: number      // cents

  // Deductions
  proRatedTax: number        // cents
  proRatedPension: number    // cents
  outstandingLoans: number   // cents
  outstandingAdvances: number
  assetRecovery: number
  otherDeductions: number
  totalDeductions: number    // cents

  // Net
  netFinalPay: number        // cents
  currency: string
  country: string
  calculationDate: string
  breakdown: FinalPayLineItem[]
}

export interface FinalPayLineItem {
  category: 'earning' | 'deduction'
  label: string
  days?: number
  rate?: number
  amount: number // cents
  notes?: string
}

/**
 * Severance rules per country (weeks per year of service)
 */
const SEVERANCE_RULES: Record<string, { weeksPerYear: number; minYears: number; cap?: number; types: string[] }> = {
  GH: { weeksPerYear: 2, minYears: 0, types: ['redundancy', 'termination'] },
  NG: { weeksPerYear: 2, minYears: 1, types: ['redundancy', 'termination'] },
  KE: { weeksPerYear: 2, minYears: 1, types: ['redundancy'] },
  ZA: { weeksPerYear: 1, minYears: 1, types: ['redundancy', 'termination'] },
  CI: { weeksPerYear: 2, minYears: 1, types: ['redundancy', 'termination'] },
  SN: { weeksPerYear: 2, minYears: 1, types: ['redundancy', 'termination'] },
  CM: { weeksPerYear: 2, minYears: 2, types: ['redundancy'] },
  UK: { weeksPerYear: 1, minYears: 2, cap: 30, types: ['redundancy'] },
  US: { weeksPerYear: 0, minYears: 0, types: [] }, // No federal requirement
}

/**
 * Gratuity rules (e.g., Ghana SSNF Tier 3 gratuity)
 */
const GRATUITY_RULES: Record<string, { rate: number; minYears: number }> = {
  GH: { rate: 0.05, minYears: 0 },  // 5% of total earnings over service period (simplified)
  NG: { rate: 0, minYears: 0 },
}

/**
 * Calculate final pay for a departing employee.
 */
export function calculateFinalPay(input: FinalPayInput): FinalPayResult {
  const workingDays = getWorkingDaysPerMonth(input.country)
  const dailyRate = input.monthlySalary / workingDays
  const weeklyRate = dailyRate * 5
  const breakdown: FinalPayLineItem[] = []

  // ─── 1. Pro-rated salary ───────────────────────────────────────────
  const lastDay = new Date(input.lastWorkingDate)
  const monthStart = new Date(lastDay.getFullYear(), lastDay.getMonth(), 1)
  const daysInMonth = new Date(lastDay.getFullYear(), lastDay.getMonth() + 1, 0).getDate()
  const dayOfMonth = lastDay.getDate()
  const proRatedDays = Math.min(dayOfMonth, workingDays)
  const proRatedSalary = Math.round(dailyRate * proRatedDays)

  breakdown.push({
    category: 'earning',
    label: 'Pro-rated salary',
    days: proRatedDays,
    rate: Math.round(dailyRate),
    amount: proRatedSalary,
    notes: `${proRatedDays} working days in final month`,
  })

  // ─── 2. Unused leave payout ────────────────────────────────────────
  const unusedLeavePayout = Math.round(dailyRate * input.unusedLeaveDays)
  if (input.unusedLeaveDays > 0) {
    breakdown.push({
      category: 'earning',
      label: 'Unused annual leave payout',
      days: input.unusedLeaveDays,
      rate: Math.round(dailyRate),
      amount: unusedLeavePayout,
      notes: `${input.unusedLeaveDays} days unused of ${input.annualLeaveEntitlement} entitlement`,
    })
  }

  // ─── 3. Notice pay (pay in lieu of notice) ─────────────────────────
  let noticePayDays = 0
  let noticePayAmount = 0
  if (input.payInLieuOfNotice && input.noticePeriodDays > input.noticePeriodServed) {
    noticePayDays = input.noticePeriodDays - input.noticePeriodServed
    noticePayAmount = Math.round(dailyRate * noticePayDays)
    breakdown.push({
      category: 'earning',
      label: 'Pay in lieu of notice',
      days: noticePayDays,
      rate: Math.round(dailyRate),
      amount: noticePayAmount,
      notes: `${input.noticePeriodDays} day notice period, ${input.noticePeriodServed} days served`,
    })
  }

  // ─── 4. Severance pay ─────────────────────────────────────────────
  let severanceWeeks = 0
  let severancePay = 0
  const sevRule = SEVERANCE_RULES[input.country]
  if (sevRule && sevRule.types.includes(input.terminationType) && input.yearsOfService >= sevRule.minYears) {
    severanceWeeks = sevRule.weeksPerYear * input.yearsOfService
    if (sevRule.cap && severanceWeeks > sevRule.cap) severanceWeeks = sevRule.cap
    severancePay = Math.round(weeklyRate * severanceWeeks)
    breakdown.push({
      category: 'earning',
      label: 'Severance pay',
      days: severanceWeeks * 5,
      amount: severancePay,
      notes: `${severanceWeeks} weeks (${sevRule.weeksPerYear}/year × ${input.yearsOfService} years)`,
    })
  }

  // ─── 5. Gratuity (Ghana SSNF Tier 3, etc.) ────────────────────────
  let gratuitySSSF = 0
  const gratRule = GRATUITY_RULES[input.country]
  if (gratRule && gratRule.rate > 0 && input.yearsOfService >= gratRule.minYears) {
    gratuitySSSF = Math.round(input.monthlySalary * 12 * input.yearsOfService * gratRule.rate)
    breakdown.push({
      category: 'earning',
      label: 'End-of-service gratuity',
      amount: gratuitySSSF,
      notes: `${(gratRule.rate * 100).toFixed(1)}% of total earnings over ${input.yearsOfService} years`,
    })
  }

  // ─── 6. Repatriation allowance (for expats) ───────────────────────
  const repatriationAllowance = 0 // Placeholder — would come from contract terms

  const totalEarnings = proRatedSalary + unusedLeavePayout + noticePayAmount + severancePay + gratuitySSSF + repatriationAllowance

  // ─── 7. Deductions ─────────────────────────────────────────────────
  // Pro-rated tax (simplified: apply effective rate to pro-rated earnings)
  const effectiveTaxRate = 0.15 // Simplified; real impl would use statutory engine
  const proRatedTax = Math.round(proRatedSalary * effectiveTaxRate)
  breakdown.push({ category: 'deduction', label: 'Pro-rated income tax', amount: proRatedTax, notes: `${(effectiveTaxRate * 100).toFixed(0)}% effective rate` })

  // Pro-rated pension
  const pensionRate = input.country === 'GH' ? 0.055 : input.country === 'KE' ? 0.06 : input.country === 'NG' ? 0.08 : 0.05
  const proRatedPension = Math.round(proRatedSalary * pensionRate)
  breakdown.push({ category: 'deduction', label: 'Pro-rated pension contribution', amount: proRatedPension, notes: `${(pensionRate * 100).toFixed(1)}% employee contribution` })

  // Outstanding balances
  if (input.outstandingLoans > 0) {
    breakdown.push({ category: 'deduction', label: 'Outstanding loan balance', amount: input.outstandingLoans })
  }
  if (input.outstandingAdvances > 0) {
    breakdown.push({ category: 'deduction', label: 'Outstanding salary advance', amount: input.outstandingAdvances })
  }
  if (input.assetRecovery > 0) {
    breakdown.push({ category: 'deduction', label: 'Unreturned asset recovery', amount: input.assetRecovery, notes: 'Equipment, access cards, etc.' })
  }
  if (input.otherDeductions > 0) {
    breakdown.push({ category: 'deduction', label: 'Other deductions', amount: input.otherDeductions, notes: input.otherDeductionNotes })
  }

  const totalDeductions = proRatedTax + proRatedPension + input.outstandingLoans + input.outstandingAdvances + input.assetRecovery + input.otherDeductions

  return {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    proRatedSalary,
    proRatedDays,
    unusedLeavePayout,
    unusedLeaveDays: input.unusedLeaveDays,
    noticePayAmount,
    noticePayDays,
    severancePay,
    severanceWeeks,
    gratuitySSSF,
    repatriationAllowance,
    totalEarnings,
    proRatedTax,
    proRatedPension,
    outstandingLoans: input.outstandingLoans,
    outstandingAdvances: input.outstandingAdvances,
    assetRecovery: input.assetRecovery,
    otherDeductions: input.otherDeductions,
    totalDeductions,
    netFinalPay: totalEarnings - totalDeductions,
    currency: input.currency,
    country: input.country,
    calculationDate: new Date().toISOString().split('T')[0],
    breakdown,
  }
}

/**
 * Get severance rules for a country (for display in UI)
 */
export function getSeveranceRules(countryCode: string) {
  return SEVERANCE_RULES[countryCode] || { weeksPerYear: 0, minYears: 0, types: [] }
}
