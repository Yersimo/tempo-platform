/**
 * EOR → Payroll Integration
 *
 * When EOR (Employer of Record) data changes:
 * - Sync country-specific payroll rules
 * - Apply local tax rates and mandatory contributions
 * - Handle currency conversion for multi-country payroll
 * - Calculate employer cost differentials
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Country-specific payroll rules */
export interface CountryPayrollRules {
  country: string
  incomeTaxRate: number // percentage (e.g. 25 = 25%)
  socialSecurityRate: number // employee contribution %
  employerSocialSecurityRate: number // employer contribution %
  pensionRate: number // mandatory pension %
  healthInsuranceRate: number // mandatory health %
  otherMandatoryRate: number // other mandatory contributions %
  currency: string
  payFrequency: 'monthly' | 'biweekly' | 'weekly'
  thirteenthMonthPay: boolean
  severanceWeeksPerYear: number
}

/** Payroll cost calculation for a country */
export interface CountryPayrollCost {
  employeeId: string
  country: string
  localSalaryCents: number
  localCurrency: string
  grossSalaryCents: number
  employeeTaxCents: number
  employeeSocialSecurityCents: number
  employeePensionCents: number
  netSalaryCents: number
  employerSocialSecurityCents: number
  employerHealthInsuranceCents: number
  employerOtherCents: number
  totalEmployerCostCents: number
  eorManagementFeeCents: number
  totalCostCents: number
  currency: string
}

/** Result of syncing EOR payroll rules */
export interface EORPayrollSyncResult {
  eorEntityId: string
  employeeId: string
  country: string
  rules: CountryPayrollRules
  cost: CountryPayrollCost
  changeType: string
  previousCostCents?: number
  costDifferenceCents?: number
}

/** Store slice needed for EOR→payroll operations */
export interface EORPayrollStoreSlice {
  employees: Array<{ id: string; country?: string; salary?: number; profile?: { full_name: string } }>
  eorEntities: Array<Record<string, unknown>>
  eorEmployees: Array<Record<string, unknown>>
  eorContracts: Array<Record<string, unknown>>
  addEmployeePayrollEntry?: (data: Record<string, unknown>) => void
  addPayrollRun?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Country payroll rules database
// ---------------------------------------------------------------------------

const COUNTRY_RULES: Record<string, CountryPayrollRules> = {
  US: { country: 'US', incomeTaxRate: 22, socialSecurityRate: 6.2, employerSocialSecurityRate: 6.2, pensionRate: 0, healthInsuranceRate: 0, otherMandatoryRate: 1.45, currency: 'USD', payFrequency: 'biweekly', thirteenthMonthPay: false, severanceWeeksPerYear: 0 },
  GB: { country: 'GB', incomeTaxRate: 20, socialSecurityRate: 12, employerSocialSecurityRate: 13.8, pensionRate: 5, healthInsuranceRate: 0, otherMandatoryRate: 0, currency: 'GBP', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 1 },
  DE: { country: 'DE', incomeTaxRate: 25, socialSecurityRate: 9.3, employerSocialSecurityRate: 9.3, pensionRate: 9.3, healthInsuranceRate: 7.3, otherMandatoryRate: 1.5, currency: 'EUR', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 0.5 },
  FR: { country: 'FR', incomeTaxRate: 30, socialSecurityRate: 11, employerSocialSecurityRate: 30, pensionRate: 6.9, healthInsuranceRate: 0.75, otherMandatoryRate: 3, currency: 'EUR', payFrequency: 'monthly', thirteenthMonthPay: true, severanceWeeksPerYear: 0.33 },
  NL: { country: 'NL', incomeTaxRate: 36.93, socialSecurityRate: 27.65, employerSocialSecurityRate: 18, pensionRate: 5, healthInsuranceRate: 5.43, otherMandatoryRate: 0, currency: 'EUR', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 0.33 },
  IN: { country: 'IN', incomeTaxRate: 20, socialSecurityRate: 12, employerSocialSecurityRate: 13, pensionRate: 0, healthInsuranceRate: 1.75, otherMandatoryRate: 0, currency: 'INR', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 2 },
  BR: { country: 'BR', incomeTaxRate: 27.5, socialSecurityRate: 11, employerSocialSecurityRate: 26.8, pensionRate: 0, healthInsuranceRate: 0, otherMandatoryRate: 8, currency: 'BRL', payFrequency: 'monthly', thirteenthMonthPay: true, severanceWeeksPerYear: 0 },
  SG: { country: 'SG', incomeTaxRate: 15, socialSecurityRate: 20, employerSocialSecurityRate: 17, pensionRate: 0, healthInsuranceRate: 0, otherMandatoryRate: 0, currency: 'SGD', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 0 },
  AU: { country: 'AU', incomeTaxRate: 32.5, socialSecurityRate: 0, employerSocialSecurityRate: 0, pensionRate: 0, healthInsuranceRate: 2, otherMandatoryRate: 0, currency: 'AUD', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 1 },
  GH: { country: 'GH', incomeTaxRate: 25, socialSecurityRate: 5.5, employerSocialSecurityRate: 13, pensionRate: 0, healthInsuranceRate: 2.5, otherMandatoryRate: 0, currency: 'GHS', payFrequency: 'monthly', thirteenthMonthPay: false, severanceWeeksPerYear: 0 },
}

/** Default EOR management fee percentage */
const EOR_MANAGEMENT_FEE_PERCENT = 15

// ---------------------------------------------------------------------------
// Currency conversion rates (simplified — in production use live rates)
// ---------------------------------------------------------------------------

const USD_EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  GBP: 0.79,
  EUR: 0.92,
  INR: 83.5,
  BRL: 4.97,
  SGD: 1.34,
  AUD: 1.53,
  GHS: 12.5,
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Get country-specific payroll rules.
 * Falls back to a generic rule set if country not in database.
 */
function getCountryRules(country: string): CountryPayrollRules {
  return COUNTRY_RULES[country.toUpperCase()] || {
    country,
    incomeTaxRate: 25,
    socialSecurityRate: 8,
    employerSocialSecurityRate: 10,
    pensionRate: 5,
    healthInsuranceRate: 3,
    otherMandatoryRate: 2,
    currency: 'USD',
    payFrequency: 'monthly',
    thirteenthMonthPay: false,
    severanceWeeksPerYear: 0,
  }
}

/**
 * Sync EOR payroll rules and calculate country-specific payroll costs.
 *
 * @param eorEntityId     - EOR entity ID
 * @param employeeId      - Employee ID
 * @param country         - Country code (e.g. 'DE', 'FR')
 * @param localSalaryCents - Local salary in cents (local currency)
 * @param localCurrency   - Local currency code
 * @param changeType      - Type of change that triggered the sync
 * @returns Sync result with calculated costs
 */
export function syncEORPayrollRules(
  eorEntityId: string,
  employeeId: string,
  country: string,
  localSalaryCents: number,
  localCurrency: string,
  changeType: string,
): EORPayrollSyncResult {
  const rules = getCountryRules(country)

  const cost = calculateCountryPayrollCost(
    employeeId,
    country,
    localSalaryCents,
    localCurrency,
  )

  return {
    eorEntityId,
    employeeId,
    country,
    rules,
    cost,
    changeType,
  }
}

/**
 * Calculate total payroll cost for an employee in a specific country.
 * Includes employee deductions, employer contributions, and EOR fees.
 *
 * @param employeeId       - Employee ID
 * @param country          - Country code
 * @param localSalaryCents - Gross salary in cents (local currency)
 * @param localCurrency    - Local currency code
 * @returns Detailed payroll cost breakdown
 */
export function calculateCountryPayrollCost(
  employeeId: string,
  country: string,
  localSalaryCents: number,
  localCurrency: string,
): CountryPayrollCost {
  const rules = getCountryRules(country)

  // Employee deductions
  const employeeTax = Math.round(localSalaryCents * (rules.incomeTaxRate / 100))
  const employeeSS = Math.round(localSalaryCents * (rules.socialSecurityRate / 100))
  const employeePension = Math.round(localSalaryCents * (rules.pensionRate / 100))
  const netSalary = localSalaryCents - employeeTax - employeeSS - employeePension

  // Employer contributions
  const employerSS = Math.round(localSalaryCents * (rules.employerSocialSecurityRate / 100))
  const employerHealth = Math.round(localSalaryCents * (rules.healthInsuranceRate / 100))
  const employerOther = Math.round(localSalaryCents * (rules.otherMandatoryRate / 100))

  // Total employer cost before EOR fee
  const totalEmployerContributions = employerSS + employerHealth + employerOther
  const grossEmployerCost = localSalaryCents + totalEmployerContributions

  // Add 13th month pay if applicable (amortized monthly)
  let adjustedGross = grossEmployerCost
  if (rules.thirteenthMonthPay) {
    adjustedGross += Math.round(localSalaryCents / 12) // extra month spread over 12
  }

  // EOR management fee
  const eorFee = Math.round(adjustedGross * (EOR_MANAGEMENT_FEE_PERCENT / 100))

  const totalCost = adjustedGross + eorFee

  return {
    employeeId,
    country,
    localSalaryCents,
    localCurrency,
    grossSalaryCents: localSalaryCents,
    employeeTaxCents: employeeTax,
    employeeSocialSecurityCents: employeeSS,
    employeePensionCents: employeePension,
    netSalaryCents: netSalary,
    employerSocialSecurityCents: employerSS,
    employerHealthInsuranceCents: employerHealth,
    employerOtherCents: employerOther,
    totalEmployerCostCents: totalEmployerContributions,
    eorManagementFeeCents: eorFee,
    totalCostCents: totalCost,
    currency: localCurrency || rules.currency,
  }
}
