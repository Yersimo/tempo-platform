/**
 * Global Payroll Tax Engine
 *
 * Comprehensive multi-country payroll processing, tax calculation,
 * pay stub generation, compliance validation, and analytics.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, sum, avg } from 'drizzle-orm'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type SupportedCountry = 'US' | 'UK' | 'DE' | 'FR' | 'CA' | 'AU'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'BRL'

export interface TaxBracket {
  min: number
  max: number
  rate: number
}

export interface TaxCalculationOptions {
  state?: string
  province?: string
  filingStatus?: 'single' | 'married_joint' | 'married_separate' | 'head_of_household'
  allowances?: number
  additionalDeductions?: number
  pensionContributionRate?: number
  isAnnual?: boolean
}

export interface TaxBreakdown {
  country: SupportedCountry
  grossSalary: number
  federalTax: number
  stateOrProvincialTax: number
  socialSecurity: number
  medicare: number
  pension: number
  additionalTaxes: Record<string, number>
  totalTax: number
  effectiveTaxRate: number
  netPay: number
  currency: CurrencyCode
}

export interface EmployeePayrollEntry {
  employeeId: string
  employeeName: string
  country: string | null
  grossPay: number
  federalTax: number
  stateOrProvincialTax: number
  socialSecurity: number
  medicare: number
  pension: number
  additionalTaxes: Record<string, number>
  totalDeductions: number
  netPay: number
  currency: CurrencyCode
}

export interface PayrollRunSummary {
  payrollRunId: string
  orgId: string
  period: string
  status: string
  employeeCount: number
  totalGross: number
  totalDeductions: number
  totalNet: number
  currency: string
  entries: EmployeePayrollEntry[]
  createdAt: Date
}

export interface PayStub {
  employeeId: string
  employeeName: string
  employeeEmail: string
  jobTitle: string | null
  department: string | null
  country: string | null
  payrollRunId: string
  period: string
  earnings: {
    baseSalary: number
    overtime: number
    bonuses: number
    totalEarnings: number
  }
  deductions: {
    federalTax: number
    stateOrProvincialTax: number
    socialSecurity: number
    medicare: number
    pension: number
    healthInsurance: number
    otherDeductions: number
    totalDeductions: number
  }
  netPay: number
  ytd: {
    grossEarnings: number
    totalDeductions: number
    netPay: number
    federalTax: number
    socialSecurity: number
    medicare: number
  }
  currency: CurrencyCode
  payDate: string
}

export interface TaxFilingRequirement {
  country: SupportedCountry
  formName: string
  description: string
  deadline: string
  frequency: 'annual' | 'quarterly' | 'monthly'
  applicableTo: 'employer' | 'employee' | 'both'
  penaltyForLateSubmission: string
}

export interface PayrollAnalytics {
  orgId: string
  totalLaborCost: number
  averageSalary: number
  medianSalary: number
  taxBurdenPercentage: number
  costByDepartment: Array<{
    departmentId: string
    departmentName: string
    totalCost: number
    employeeCount: number
    averageSalary: number
  }>
  costByCountry: Array<{
    country: string
    totalCost: number
    employeeCount: number
    averageSalary: number
    currency: CurrencyCode
  }>
  payrollHistory: Array<{
    period: string
    totalGross: number
    totalNet: number
    totalDeductions: number
    employeeCount: number
  }>
  currency: string
}

export interface ComplianceIssue {
  severity: 'critical' | 'warning' | 'info'
  category: string
  country: string
  employeeId?: string
  employeeName?: string
  description: string
  recommendation: string
}

export interface ComplianceReport {
  orgId: string
  checkedAt: string
  totalEmployeesChecked: number
  issues: ComplianceIssue[]
  isCompliant: boolean
  complianceScore: number
}

// ============================================================
// TAX BRACKET DATA
// ============================================================

/**
 * US Federal Income Tax Brackets (2024, Single filer)
 */
const US_FEDERAL_BRACKETS: Record<string, TaxBracket[]> = {
  single: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
  married_joint: [
    { min: 0, max: 23200, rate: 0.10 },
    { min: 23200, max: 94300, rate: 0.12 },
    { min: 94300, max: 201050, rate: 0.22 },
    { min: 201050, max: 383900, rate: 0.24 },
    { min: 383900, max: 487450, rate: 0.32 },
    { min: 487450, max: 731200, rate: 0.35 },
    { min: 731200, max: Infinity, rate: 0.37 },
  ],
  married_separate: [
    { min: 0, max: 11600, rate: 0.10 },
    { min: 11600, max: 47150, rate: 0.12 },
    { min: 47150, max: 100525, rate: 0.22 },
    { min: 100525, max: 191950, rate: 0.24 },
    { min: 191950, max: 243725, rate: 0.32 },
    { min: 243725, max: 365600, rate: 0.35 },
    { min: 365600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16550, rate: 0.10 },
    { min: 16550, max: 63100, rate: 0.12 },
    { min: 63100, max: 100500, rate: 0.22 },
    { min: 100500, max: 191950, rate: 0.24 },
    { min: 191950, max: 243700, rate: 0.32 },
    { min: 243700, max: 609350, rate: 0.35 },
    { min: 609350, max: Infinity, rate: 0.37 },
  ],
}

/**
 * US State Income Tax Rates (simplified flat/top marginal rates for common states)
 */
const US_STATE_TAX_RATES: Record<string, TaxBracket[]> = {
  CA: [
    { min: 0, max: 10412, rate: 0.01 },
    { min: 10412, max: 24684, rate: 0.02 },
    { min: 24684, max: 38959, rate: 0.04 },
    { min: 38959, max: 54081, rate: 0.06 },
    { min: 54081, max: 68350, rate: 0.08 },
    { min: 68350, max: 349137, rate: 0.093 },
    { min: 349137, max: 418961, rate: 0.103 },
    { min: 418961, max: 698271, rate: 0.113 },
    { min: 698271, max: 1000000, rate: 0.123 },
    { min: 1000000, max: Infinity, rate: 0.133 },
  ],
  NY: [
    { min: 0, max: 8500, rate: 0.04 },
    { min: 8500, max: 11700, rate: 0.045 },
    { min: 11700, max: 13900, rate: 0.0525 },
    { min: 13900, max: 80650, rate: 0.0585 },
    { min: 80650, max: 215400, rate: 0.0625 },
    { min: 215400, max: 1077550, rate: 0.0685 },
    { min: 1077550, max: 5000000, rate: 0.0965 },
    { min: 5000000, max: 25000000, rate: 0.103 },
    { min: 25000000, max: Infinity, rate: 0.109 },
  ],
  TX: [], // No state income tax
  FL: [], // No state income tax
  WA: [], // No state income tax
  IL: [{ min: 0, max: Infinity, rate: 0.0495 }],
  PA: [{ min: 0, max: Infinity, rate: 0.0307 }],
  MA: [{ min: 0, max: 1000000, rate: 0.05 }, { min: 1000000, max: Infinity, rate: 0.09 }],
  NJ: [
    { min: 0, max: 20000, rate: 0.014 },
    { min: 20000, max: 35000, rate: 0.0175 },
    { min: 35000, max: 40000, rate: 0.035 },
    { min: 40000, max: 75000, rate: 0.05525 },
    { min: 75000, max: 500000, rate: 0.0637 },
    { min: 500000, max: 1000000, rate: 0.0897 },
    { min: 1000000, max: Infinity, rate: 0.1075 },
  ],
  CO: [{ min: 0, max: Infinity, rate: 0.044 }],
}

/**
 * UK PAYE Income Tax Bands (2024/25)
 */
const UK_PAYE_BRACKETS: TaxBracket[] = [
  { min: 0, max: 12570, rate: 0.00 },       // Personal allowance
  { min: 12570, max: 50270, rate: 0.20 },    // Basic rate
  { min: 50270, max: 125140, rate: 0.40 },   // Higher rate
  { min: 125140, max: Infinity, rate: 0.45 }, // Additional rate
]

/**
 * UK National Insurance (Class 1 employee contributions, 2024/25)
 */
const UK_NI_BRACKETS: TaxBracket[] = [
  { min: 0, max: 12570, rate: 0.00 },
  { min: 12570, max: 50270, rate: 0.08 },
  { min: 50270, max: Infinity, rate: 0.02 },
]

/**
 * Germany Income Tax Brackets (2024) - simplified progressive zones
 */
const DE_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11604, rate: 0.00 },       // Grundfreibetrag (basic allowance)
  { min: 11604, max: 17005, rate: 0.14 },    // Progressive zone 1 (starts at 14%)
  { min: 17005, max: 66760, rate: 0.2397 },  // Progressive zone 2 (average ~24%)
  { min: 66760, max: 277825, rate: 0.42 },   // Proportional zone 1
  { min: 277825, max: Infinity, rate: 0.45 }, // Proportional zone 2 (Reichensteuer)
]

/** Germany solidarity surcharge: 5.5% of income tax (with Freigrenze) */
const DE_SOLIDARITY_SURCHARGE_RATE = 0.055
const DE_SOLIDARITY_SURCHARGE_THRESHOLD = 18130 // No surcharge if tax below this

/** Germany social insurance rates (employee share) */
const DE_SOCIAL_INSURANCE = {
  healthInsurance: 0.073,        // ~7.3% employee share (general)
  nursingCare: 0.01525,          // 1.525% employee share (childless surcharge: +0.6%)
  pension: 0.093,                // 9.3% employee share
  unemployment: 0.013,           // 1.3% employee share
  assessmentCeilingWest: 90600,  // Beitragsbemessungsgrenze (pension/unemployment)
  assessmentCeilingHealth: 62100, // BBG for health/nursing
}

/**
 * France Income Tax Brackets (2024, per unit - quotient familial)
 */
const FR_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11294, rate: 0.00 },
  { min: 11294, max: 28797, rate: 0.11 },
  { min: 28797, max: 82341, rate: 0.30 },
  { min: 82341, max: 177106, rate: 0.41 },
  { min: 177106, max: Infinity, rate: 0.45 },
]

/** France social contributions (employee share, approximate) */
const FR_SOCIAL_CONTRIBUTIONS = {
  csg: 0.098,           // CSG (9.2% + 0.5% CRDS on 98.25% of gross)
  healthInsurance: 0.0,  // Employer-paid since 2018
  pension: 0.0690,       // Base + complementary
  unemployment: 0.0,     // Employer-paid since 2018
  trancheACeiling: 46368, // Plafond Securite Sociale annuel
}

/**
 * Canada Federal Income Tax Brackets (2024)
 */
const CA_FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 154906, rate: 0.26 },
  { min: 154906, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
]

/**
 * Canadian Provincial Tax Rates (simplified, selected provinces)
 */
const CA_PROVINCIAL_TAX_RATES: Record<string, TaxBracket[]> = {
  ON: [
    { min: 0, max: 51446, rate: 0.0505 },
    { min: 51446, max: 102894, rate: 0.0915 },
    { min: 102894, max: 150000, rate: 0.1116 },
    { min: 150000, max: 220000, rate: 0.1216 },
    { min: 220000, max: Infinity, rate: 0.1316 },
  ],
  BC: [
    { min: 0, max: 45654, rate: 0.0506 },
    { min: 45654, max: 91310, rate: 0.077 },
    { min: 91310, max: 104835, rate: 0.105 },
    { min: 104835, max: 127299, rate: 0.1229 },
    { min: 127299, max: 172602, rate: 0.147 },
    { min: 172602, max: 240716, rate: 0.168 },
    { min: 240716, max: Infinity, rate: 0.205 },
  ],
  QC: [
    { min: 0, max: 51780, rate: 0.14 },
    { min: 51780, max: 103545, rate: 0.19 },
    { min: 103545, max: 126000, rate: 0.24 },
    { min: 126000, max: Infinity, rate: 0.2575 },
  ],
  AB: [
    { min: 0, max: 148269, rate: 0.10 },
    { min: 148269, max: 177922, rate: 0.12 },
    { min: 177922, max: 237230, rate: 0.13 },
    { min: 237230, max: 355845, rate: 0.14 },
    { min: 355845, max: Infinity, rate: 0.15 },
  ],
}

/** Canada CPP / EI rates (employee share, 2024) */
const CA_SOCIAL_INSURANCE = {
  cppRate: 0.0595,
  cppMaxPensionableEarnings: 68500,
  cppBasicExemption: 3500,
  eiRate: 0.0166,
  eiMaxInsurableEarnings: 63200,
}

/**
 * Australia Income Tax Brackets (2024-25, resident)
 */
const AU_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0.00 },
  { min: 18200, max: 45000, rate: 0.16 },
  { min: 45000, max: 135000, rate: 0.30 },
  { min: 135000, max: 190000, rate: 0.37 },
  { min: 190000, max: Infinity, rate: 0.45 },
]

/** Australia Medicare Levy */
const AU_MEDICARE_LEVY_RATE = 0.02

/** Australia Superannuation Guarantee rate */
const AU_SUPER_GUARANTEE_RATE = 0.115

// ============================================================
// CURRENCY CONVERSION
// ============================================================

/**
 * Exchange rates relative to USD (approximate mid-market rates).
 * In production, these should be fetched from a live FX data provider.
 */
const EXCHANGE_RATES: Record<CurrencyCode, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  INR: 83.12,
  BRL: 4.97,
}

const COUNTRY_CURRENCY_MAP: Record<SupportedCountry, CurrencyCode> = {
  US: 'USD',
  UK: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
}

/**
 * Convert an amount from one currency to another using stored exchange rates.
 */
export function convertCurrency(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (from === to) return amount

  const fromRate = EXCHANGE_RATES[from]
  const toRate = EXCHANGE_RATES[to]

  if (!fromRate || !toRate) {
    throw new Error(`Unsupported currency pair: ${from} -> ${to}`)
  }

  // Convert to USD first, then to target currency
  const amountInUSD = amount / fromRate
  const converted = amountInUSD * toRate

  return Math.round(converted * 100) / 100
}

// ============================================================
// HELPER: PROGRESSIVE TAX CALCULATION
// ============================================================

/**
 * Applies progressive (marginal) tax brackets to a taxable amount.
 */
function applyBrackets(taxableIncome: number, brackets: TaxBracket[]): number {
  let totalTax = 0

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break

    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min
    totalTax += taxableInBracket * bracket.rate
  }

  return Math.round(totalTax * 100) / 100
}

// ============================================================
// 1. TAX CALCULATION ENGINE
// ============================================================

/**
 * Calculate taxes for a given country and gross annual salary.
 * Returns a detailed breakdown of all taxes and net pay.
 */
export function calculateTax(
  country: SupportedCountry,
  grossSalary: number,
  options: TaxCalculationOptions = {}
): TaxBreakdown {
  const currency = COUNTRY_CURRENCY_MAP[country]

  switch (country) {
    case 'US':
      return calculateUSTax(grossSalary, currency, options)
    case 'UK':
      return calculateUKTax(grossSalary, currency, options)
    case 'DE':
      return calculateDETax(grossSalary, currency, options)
    case 'FR':
      return calculateFRTax(grossSalary, currency, options)
    case 'CA':
      return calculateCATax(grossSalary, currency, options)
    case 'AU':
      return calculateAUTax(grossSalary, currency, options)
    default:
      throw new Error(`Unsupported country: ${country}`)
  }
}

function calculateUSTax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  const filingStatus = options.filingStatus || 'single'
  const brackets = US_FEDERAL_BRACKETS[filingStatus] || US_FEDERAL_BRACKETS.single

  // Standard deduction
  const standardDeduction: Record<string, number> = {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_of_household: 21900,
  }
  const deduction = standardDeduction[filingStatus] || 14600
  const taxableIncome = Math.max(0, grossSalary - deduction - (options.additionalDeductions || 0))

  // Federal income tax
  const federalTax = applyBrackets(taxableIncome, brackets)

  // State tax
  let stateOrProvincialTax = 0
  if (options.state && US_STATE_TAX_RATES[options.state]) {
    stateOrProvincialTax = applyBrackets(taxableIncome, US_STATE_TAX_RATES[options.state])
  }

  // FICA: Social Security (6.2% up to $168,600 wage base)
  const ssWageBase = 168600
  const socialSecurity = Math.round(Math.min(grossSalary, ssWageBase) * 0.062 * 100) / 100

  // FICA: Medicare (1.45% + 0.9% additional above $200k)
  let medicare = grossSalary * 0.0145
  if (grossSalary > 200000) {
    medicare += (grossSalary - 200000) * 0.009
  }
  medicare = Math.round(medicare * 100) / 100

  const additionalTaxes: Record<string, number> = {}

  const totalTax = Math.round((federalTax + stateOrProvincialTax + socialSecurity + medicare) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'US',
    grossSalary,
    federalTax,
    stateOrProvincialTax,
    socialSecurity,
    medicare,
    pension: 0,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

function calculateUKTax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  // Personal allowance tapers above 100k: reduced by 1 for every 2 earned over 100k
  let personalAllowance = 12570
  if (grossSalary > 100000) {
    personalAllowance = Math.max(0, personalAllowance - Math.floor((grossSalary - 100000) / 2))
  }

  // Adjust brackets for tapered personal allowance
  const adjustedBrackets: TaxBracket[] = [
    { min: 0, max: personalAllowance, rate: 0.00 },
    { min: personalAllowance, max: 50270, rate: 0.20 },
    { min: 50270, max: 125140, rate: 0.40 },
    { min: 125140, max: Infinity, rate: 0.45 },
  ]

  const federalTax = applyBrackets(grossSalary, adjustedBrackets)

  // National Insurance
  const socialSecurity = applyBrackets(grossSalary, UK_NI_BRACKETS)

  // UK has employer pension obligations but employee auto-enrollment minimum is 5%
  const pensionRate = options.pensionContributionRate ?? 0.05
  const pension = Math.round(grossSalary * pensionRate * 100) / 100

  const additionalTaxes: Record<string, number> = {
    nationalInsurance: socialSecurity,
  }

  const totalTax = Math.round((federalTax + socialSecurity + pension) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'UK',
    grossSalary,
    federalTax,
    stateOrProvincialTax: 0,
    socialSecurity,
    medicare: 0,
    pension,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

function calculateDETax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  // German income tax (progressive)
  const federalTax = applyBrackets(grossSalary, DE_INCOME_TAX_BRACKETS)

  // Solidarity surcharge: 5.5% of income tax if above threshold
  let solidaritySurcharge = 0
  if (federalTax > DE_SOLIDARITY_SURCHARGE_THRESHOLD) {
    solidaritySurcharge = Math.round(federalTax * DE_SOLIDARITY_SURCHARGE_RATE * 100) / 100
  }

  // Social insurance contributions (employee share, capped at assessment ceilings)
  const pensionBase = Math.min(grossSalary, DE_SOCIAL_INSURANCE.assessmentCeilingWest)
  const healthBase = Math.min(grossSalary, DE_SOCIAL_INSURANCE.assessmentCeilingHealth)

  const pension = Math.round(pensionBase * DE_SOCIAL_INSURANCE.pension * 100) / 100
  const healthInsurance = Math.round(healthBase * DE_SOCIAL_INSURANCE.healthInsurance * 100) / 100
  const nursingCare = Math.round(healthBase * DE_SOCIAL_INSURANCE.nursingCare * 100) / 100
  const unemployment = Math.round(pensionBase * DE_SOCIAL_INSURANCE.unemployment * 100) / 100

  const socialSecurity = Math.round((healthInsurance + nursingCare + unemployment) * 100) / 100

  const additionalTaxes: Record<string, number> = {
    solidaritySurcharge,
    healthInsurance,
    nursingCare,
    unemployment,
  }

  const totalTax = Math.round((federalTax + solidaritySurcharge + socialSecurity + pension) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'DE',
    grossSalary,
    federalTax,
    stateOrProvincialTax: 0,
    socialSecurity,
    medicare: 0,
    pension,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

function calculateFRTax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  // CSG/CRDS base: 98.25% of gross
  const csgBase = grossSalary * 0.9825
  const csgCrds = Math.round(csgBase * FR_SOCIAL_CONTRIBUTIONS.csg * 100) / 100

  // Taxable income for income tax: gross minus deductible CSG (6.8%)
  const deductibleCsg = grossSalary * 0.9825 * 0.068
  const taxableIncome = Math.max(0, grossSalary - deductibleCsg)

  // French income tax (per-unit system, assuming 1 part for single)
  const federalTax = applyBrackets(taxableIncome, FR_INCOME_TAX_BRACKETS)

  // Pension contributions (employee share)
  const pensionBase = Math.min(grossSalary, FR_SOCIAL_CONTRIBUTIONS.trancheACeiling)
  const pension = Math.round(pensionBase * FR_SOCIAL_CONTRIBUTIONS.pension * 100) / 100

  const socialSecurity = csgCrds

  const additionalTaxes: Record<string, number> = {
    csgCrds,
  }

  const totalTax = Math.round((federalTax + socialSecurity + pension) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'FR',
    grossSalary,
    federalTax,
    stateOrProvincialTax: 0,
    socialSecurity,
    medicare: 0,
    pension,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

function calculateCATax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  // Basic personal amount (federal)
  const basicPersonalAmount = 15705
  const taxableIncome = Math.max(0, grossSalary - basicPersonalAmount)

  // Federal income tax
  const federalTax = applyBrackets(taxableIncome, CA_FEDERAL_BRACKETS)

  // Provincial income tax
  let stateOrProvincialTax = 0
  const province = options.province || 'ON'
  if (CA_PROVINCIAL_TAX_RATES[province]) {
    stateOrProvincialTax = applyBrackets(taxableIncome, CA_PROVINCIAL_TAX_RATES[province])
  }

  // CPP (Canada Pension Plan)
  const cppPensionableEarnings = Math.min(grossSalary, CA_SOCIAL_INSURANCE.cppMaxPensionableEarnings)
  const cppContribution = Math.round(
    Math.max(0, cppPensionableEarnings - CA_SOCIAL_INSURANCE.cppBasicExemption) *
    CA_SOCIAL_INSURANCE.cppRate * 100
  ) / 100

  // EI (Employment Insurance)
  const eiInsurableEarnings = Math.min(grossSalary, CA_SOCIAL_INSURANCE.eiMaxInsurableEarnings)
  const eiContribution = Math.round(eiInsurableEarnings * CA_SOCIAL_INSURANCE.eiRate * 100) / 100

  const socialSecurity = eiContribution
  const pension = cppContribution

  const additionalTaxes: Record<string, number> = {
    cpp: cppContribution,
    ei: eiContribution,
  }

  const totalTax = Math.round((federalTax + stateOrProvincialTax + socialSecurity + pension) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'CA',
    grossSalary,
    federalTax,
    stateOrProvincialTax,
    socialSecurity,
    medicare: 0,
    pension,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

function calculateAUTax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  // Australian income tax
  const federalTax = applyBrackets(grossSalary, AU_INCOME_TAX_BRACKETS)

  // Medicare Levy (2% of taxable income, with low-income thresholds)
  let medicare = 0
  const medicareLowThreshold = 24276
  const medicareShadeInThreshold = 30345
  if (grossSalary > medicareShadeInThreshold) {
    medicare = Math.round(grossSalary * AU_MEDICARE_LEVY_RATE * 100) / 100
  } else if (grossSalary > medicareLowThreshold) {
    // Shade-in: 10% of excess over threshold
    medicare = Math.round((grossSalary - medicareLowThreshold) * 0.10 * 100) / 100
  }

  // Superannuation Guarantee (employer obligation, but tracked here for completeness)
  const superannuation = Math.round(grossSalary * AU_SUPER_GUARANTEE_RATE * 100) / 100

  const additionalTaxes: Record<string, number> = {
    superannuationGuarantee: superannuation,
  }

  // Super is an employer cost, not deducted from employee gross
  const totalTax = Math.round((federalTax + medicare) * 100) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country: 'AU',
    grossSalary,
    federalTax,
    stateOrProvincialTax: 0,
    socialSecurity: 0,
    medicare,
    pension: superannuation,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency,
  }
}

// ============================================================
// 2. PAYROLL PROCESSING
// ============================================================

/**
 * Map a country string (from the employees table) to a SupportedCountry code.
 * Returns 'US' as default if the country is unrecognized.
 */
function resolveCountryCode(country: string | null): SupportedCountry {
  if (!country) return 'US'

  const normalized = country.trim().toUpperCase()
  const mapping: Record<string, SupportedCountry> = {
    US: 'US', USA: 'US', 'UNITED STATES': 'US',
    UK: 'UK', GB: 'UK', 'UNITED KINGDOM': 'UK', 'GREAT BRITAIN': 'UK',
    DE: 'DE', GERMANY: 'DE', DEUTSCHLAND: 'DE',
    FR: 'FR', FRANCE: 'FR',
    CA: 'CA', CANADA: 'CA',
    AU: 'AU', AUSTRALIA: 'AU',
  }

  return mapping[normalized] || 'US'
}

/**
 * Retrieve an employee's current annual salary from the most recent salary review.
 * Falls back to 0 if no salary review record exists.
 */
async function getEmployeeSalary(employeeId: string, orgId: string): Promise<{ salary: number; currency: CurrencyCode }> {
  const latestReview = await db
    .select({
      currentSalary: schema.salaryReviews.currentSalary,
      proposedSalary: schema.salaryReviews.proposedSalary,
      status: schema.salaryReviews.status,
      currency: schema.salaryReviews.currency,
    })
    .from(schema.salaryReviews)
    .where(
      and(
        eq(schema.salaryReviews.employeeId, employeeId),
        eq(schema.salaryReviews.orgId, orgId)
      )
    )
    .orderBy(desc(schema.salaryReviews.createdAt))
    .limit(1)

  if (latestReview.length === 0) {
    return { salary: 0, currency: 'USD' }
  }

  const review = latestReview[0]
  // Use proposedSalary if approved, otherwise currentSalary
  const salary = review.status === 'approved' ? review.proposedSalary : review.currentSalary
  const currency = (review.currency || 'USD') as CurrencyCode

  return { salary, currency }
}

/**
 * Process payroll for all active employees in an organization for a given period.
 * Creates a payroll run record and returns a complete summary.
 */
export async function processPayroll(orgId: string, period: string): Promise<PayrollRunSummary> {
  // Fetch all active employees
  const activeEmployees = await db
    .select()
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.orgId, orgId),
        eq(schema.employees.isActive, true)
      )
    )

  if (activeEmployees.length === 0) {
    throw new Error('No active employees found for this organization')
  }

  const entries: EmployeePayrollEntry[] = []
  let totalGross = 0
  let totalDeductions = 0
  let totalNet = 0

  for (const employee of activeEmployees) {
    const countryCode = resolveCountryCode(employee.country)
    const { salary: annualSalary, currency } = await getEmployeeSalary(employee.id, orgId)

    // Calculate monthly gross pay (annual / 12)
    const monthlyGross = Math.round((annualSalary / 12) * 100) / 100

    if (monthlyGross === 0) {
      // Skip employees with no salary record
      continue
    }

    // Calculate taxes on annualized basis, then prorate to monthly
    const annualTax = calculateTax(countryCode, annualSalary)
    const monthlyFederal = Math.round((annualTax.federalTax / 12) * 100) / 100
    const monthlyState = Math.round((annualTax.stateOrProvincialTax / 12) * 100) / 100
    const monthlySS = Math.round((annualTax.socialSecurity / 12) * 100) / 100
    const monthlyMedicare = Math.round((annualTax.medicare / 12) * 100) / 100
    const monthlyPension = Math.round((annualTax.pension / 12) * 100) / 100
    const monthlyTotalDeductions = Math.round((annualTax.totalTax / 12) * 100) / 100
    const monthlyNet = Math.round((monthlyGross - monthlyTotalDeductions) * 100) / 100

    // Convert to USD for aggregation in the payroll run record
    const grossInUSD = convertCurrency(monthlyGross, currency, 'USD')
    const deductionsInUSD = convertCurrency(monthlyTotalDeductions, currency, 'USD')
    const netInUSD = convertCurrency(monthlyNet, currency, 'USD')

    totalGross += grossInUSD
    totalDeductions += deductionsInUSD
    totalNet += netInUSD

    entries.push({
      employeeId: employee.id,
      employeeName: employee.fullName,
      country: employee.country,
      grossPay: monthlyGross,
      federalTax: monthlyFederal,
      stateOrProvincialTax: monthlyState,
      socialSecurity: monthlySS,
      medicare: monthlyMedicare,
      pension: monthlyPension,
      additionalTaxes: {},
      totalDeductions: monthlyTotalDeductions,
      netPay: monthlyNet,
      currency,
    })
  }

  // Round aggregated totals (stored as integers in cents in the DB)
  const roundedTotalGross = Math.round(totalGross)
  const roundedTotalDeductions = Math.round(totalDeductions)
  const roundedTotalNet = Math.round(totalNet)

  // Create payroll run record
  const [payrollRun] = await db
    .insert(schema.payrollRuns)
    .values({
      orgId,
      period,
      status: 'draft',
      totalGross: roundedTotalGross,
      totalNet: roundedTotalNet,
      totalDeductions: roundedTotalDeductions,
      currency: 'USD',
      employeeCount: entries.length,
      runDate: new Date(),
    })
    .returning()

  return {
    payrollRunId: payrollRun.id,
    orgId,
    period,
    status: payrollRun.status,
    employeeCount: entries.length,
    totalGross: roundedTotalGross,
    totalDeductions: roundedTotalDeductions,
    totalNet: roundedTotalNet,
    currency: 'USD',
    entries,
    createdAt: payrollRun.createdAt,
  }
}

// ============================================================
// 3. PAY STUB GENERATION
// ============================================================

/**
 * Generate an individual pay stub for an employee within a specific payroll run.
 */
export async function generatePayStub(
  orgId: string,
  employeeId: string,
  payrollRunId: string
): Promise<PayStub> {
  // Fetch the employee
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.id, employeeId),
        eq(schema.employees.orgId, orgId)
      )
    )
    .limit(1)

  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`)
  }

  // Fetch the payroll run
  const [payrollRun] = await db
    .select()
    .from(schema.payrollRuns)
    .where(
      and(
        eq(schema.payrollRuns.id, payrollRunId),
        eq(schema.payrollRuns.orgId, orgId)
      )
    )
    .limit(1)

  if (!payrollRun) {
    throw new Error(`Payroll run not found: ${payrollRunId}`)
  }

  // Fetch department name
  let departmentName: string | null = null
  if (employee.departmentId) {
    const [dept] = await db
      .select({ name: schema.departments.name })
      .from(schema.departments)
      .where(eq(schema.departments.id, employee.departmentId))
      .limit(1)
    departmentName = dept?.name || null
  }

  // Get salary and compute taxes
  const countryCode = resolveCountryCode(employee.country)
  const { salary: annualSalary, currency } = await getEmployeeSalary(employeeId, orgId)
  const monthlyGross = Math.round((annualSalary / 12) * 100) / 100

  const annualTax = calculateTax(countryCode, annualSalary)

  const monthlyFederal = Math.round((annualTax.federalTax / 12) * 100) / 100
  const monthlyState = Math.round((annualTax.stateOrProvincialTax / 12) * 100) / 100
  const monthlySS = Math.round((annualTax.socialSecurity / 12) * 100) / 100
  const monthlyMedicare = Math.round((annualTax.medicare / 12) * 100) / 100
  const monthlyPension = Math.round((annualTax.pension / 12) * 100) / 100
  const monthlyTotalDeductions = Math.round((annualTax.totalTax / 12) * 100) / 100
  const monthlyNet = Math.round((monthlyGross - monthlyTotalDeductions) * 100) / 100

  // Estimate benefit deductions for this employee
  const benefitEnrollments = await db
    .select({
      costEmployee: schema.benefitPlans.costEmployee,
    })
    .from(schema.benefitEnrollments)
    .innerJoin(schema.benefitPlans, eq(schema.benefitEnrollments.planId, schema.benefitPlans.id))
    .where(
      and(
        eq(schema.benefitEnrollments.employeeId, employeeId),
        eq(schema.benefitEnrollments.orgId, orgId)
      )
    )

  const monthlyHealthInsurance = benefitEnrollments.reduce(
    (sum, b) => sum + Math.round(((b.costEmployee || 0) / 12) * 100) / 100,
    0
  )

  // YTD totals: determine the number of months elapsed in the current year
  // from the payroll run period (format expected: "YYYY-MM" or similar)
  const periodMatch = payrollRun.period.match(/(\d{4})-(\d{2})/)
  const periodMonth = periodMatch ? parseInt(periodMatch[2], 10) : 1

  // Count completed payroll runs for this org in the same year
  const periodYear = periodMatch ? periodMatch[1] : new Date().getFullYear().toString()
  const completedRuns = await db
    .select({ count: count() })
    .from(schema.payrollRuns)
    .where(
      and(
        eq(schema.payrollRuns.orgId, orgId),
        sql`${schema.payrollRuns.period} LIKE ${periodYear + '%'}`,
        sql`${schema.payrollRuns.status} IN ('paid', 'processing', 'approved')`
      )
    )

  const monthsProcessed = Math.max(completedRuns[0]?.count ?? 0, 1)

  const ytdGross = Math.round(monthlyGross * monthsProcessed * 100) / 100
  const ytdDeductions = Math.round(monthlyTotalDeductions * monthsProcessed * 100) / 100
  const ytdNet = Math.round(monthlyNet * monthsProcessed * 100) / 100
  const ytdFederal = Math.round(monthlyFederal * monthsProcessed * 100) / 100
  const ytdSS = Math.round(monthlySS * monthsProcessed * 100) / 100
  const ytdMedicare = Math.round(monthlyMedicare * monthsProcessed * 100) / 100

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    employeeEmail: employee.email,
    jobTitle: employee.jobTitle,
    department: departmentName,
    country: employee.country,
    payrollRunId,
    period: payrollRun.period,
    earnings: {
      baseSalary: monthlyGross,
      overtime: 0,
      bonuses: 0,
      totalEarnings: monthlyGross,
    },
    deductions: {
      federalTax: monthlyFederal,
      stateOrProvincialTax: monthlyState,
      socialSecurity: monthlySS,
      medicare: monthlyMedicare,
      pension: monthlyPension,
      healthInsurance: monthlyHealthInsurance,
      otherDeductions: 0,
      totalDeductions: Math.round((monthlyTotalDeductions + monthlyHealthInsurance) * 100) / 100,
    },
    netPay: Math.round((monthlyNet - monthlyHealthInsurance) * 100) / 100,
    ytd: {
      grossEarnings: ytdGross,
      totalDeductions: ytdDeductions,
      netPay: ytdNet,
      federalTax: ytdFederal,
      socialSecurity: ytdSS,
      medicare: ytdMedicare,
    },
    currency,
    payDate: payrollRun.runDate?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
  }
}

// ============================================================
// 4. TAX FILING HELPERS
// ============================================================

/**
 * Returns the required tax filings for the given countries, including
 * form names, deadlines, frequencies, and penalty information.
 */
export function getTaxFilingRequirements(countries: SupportedCountry[]): TaxFilingRequirement[] {
  const allRequirements: Record<SupportedCountry, TaxFilingRequirement[]> = {
    US: [
      {
        country: 'US',
        formName: 'W-2',
        description: 'Wage and Tax Statement - report employee compensation and tax withholdings',
        deadline: 'January 31',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: '$50-$280 per form depending on lateness; $570 for intentional disregard',
      },
      {
        country: 'US',
        formName: 'W-4',
        description: 'Employee Withholding Certificate - employee completes for tax withholding elections',
        deadline: 'Upon hire or change of status',
        frequency: 'annual',
        applicableTo: 'employee',
        penaltyForLateSubmission: 'Employer must withhold at highest rate if not provided',
      },
      {
        country: 'US',
        formName: 'Form 941',
        description: 'Quarterly Federal Tax Return - report income taxes, Social Security, and Medicare',
        deadline: 'Last day of month following quarter end',
        frequency: 'quarterly',
        applicableTo: 'employer',
        penaltyForLateSubmission: '5% of unpaid tax per month, max 25%; plus interest',
      },
      {
        country: 'US',
        formName: 'Form 940',
        description: 'Annual Federal Unemployment Tax Return (FUTA)',
        deadline: 'January 31',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: '5% of unpaid tax per month, max 25%',
      },
      {
        country: 'US',
        formName: '1099-NEC',
        description: 'Nonemployee Compensation - for independent contractors paid $600+',
        deadline: 'January 31',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: '$50-$280 per form depending on lateness',
      },
    ],
    UK: [
      {
        country: 'UK',
        formName: 'P60',
        description: 'End of Year Certificate - summary of pay and deductions for the tax year',
        deadline: 'May 31',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Up to GBP 3,000 fine per occurrence',
      },
      {
        country: 'UK',
        formName: 'P45',
        description: 'Details of employee leaving - issued when employment ends',
        deadline: 'Upon termination',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'HMRC penalties for non-compliance',
      },
      {
        country: 'UK',
        formName: 'FPS (Full Payment Submission)',
        description: 'Real Time Information submission to HMRC each pay run',
        deadline: 'On or before each payday',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'GBP 100-400 per month depending on number of employees',
      },
      {
        country: 'UK',
        formName: 'P11D',
        description: 'Report expenses and benefits provided to employees',
        deadline: 'July 6',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'GBP 300 per form plus GBP 60 per day',
      },
    ],
    DE: [
      {
        country: 'DE',
        formName: 'Lohnsteuerbescheinigung',
        description: 'Annual wage tax certificate - electronic submission to tax authorities',
        deadline: 'February 28',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Up to EUR 25,000 fine',
      },
      {
        country: 'DE',
        formName: 'Lohnsteueranmeldung',
        description: 'Wage tax return - report and remit withheld wage tax',
        deadline: '10th of following month',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Late payment surcharge of 1% per month of the tax amount',
      },
      {
        country: 'DE',
        formName: 'SV-Meldung (DEÜV)',
        description: 'Social insurance reporting to Krankenkasse',
        deadline: '15th of following month',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Fines up to EUR 25,000 for repeated non-compliance',
      },
      {
        country: 'DE',
        formName: 'Jahresmeldung',
        description: 'Annual social insurance report for each employee',
        deadline: 'February 15',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Administrative fines per missing report',
      },
    ],
    FR: [
      {
        country: 'FR',
        formName: 'DSN (Déclaration Sociale Nominative)',
        description: 'Unified monthly social declaration replacing multiple legacy filings',
        deadline: '5th or 15th of following month (based on company size)',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'EUR 7.50 per employee per month of delay (min EUR 150)',
      },
      {
        country: 'FR',
        formName: 'Bulletin de Paie',
        description: 'Pay slip - mandatory detailed pay stub for each employee',
        deadline: 'Each pay period',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'EUR 450 per missing pay slip',
      },
      {
        country: 'FR',
        formName: 'Attestation Fiscale',
        description: 'Annual tax attestation for employee income declaration',
        deadline: 'January 31',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Administrative fines',
      },
    ],
    CA: [
      {
        country: 'CA',
        formName: 'T4',
        description: 'Statement of Remuneration Paid - annual summary of employment income and deductions',
        deadline: 'Last day of February',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'CAD 100-7,500 depending on number of slips and lateness',
      },
      {
        country: 'CA',
        formName: 'PD7A',
        description: 'Statement of Account for Current Source Deductions (remittance form)',
        deadline: '15th of following month',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: '3-10% of amount owing depending on days late',
      },
      {
        country: 'CA',
        formName: 'ROE (Record of Employment)',
        description: 'Record of Employment - issued when employee has interruption of earnings',
        deadline: '5 calendar days after end of pay period with interruption',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Up to CAD 2,000 fine and/or 6 months imprisonment',
      },
      {
        country: 'CA',
        formName: 'T4 Summary',
        description: 'Summary of all T4 slips filed by the employer',
        deadline: 'Last day of February',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Same penalties as individual T4 slips',
      },
    ],
    AU: [
      {
        country: 'AU',
        formName: 'STP (Single Touch Payroll)',
        description: 'Real-time payroll reporting to ATO with each pay run',
        deadline: 'On or before each payday',
        frequency: 'monthly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'AUD 210 per 28-day period per statement (up to AUD 1,050)',
      },
      {
        country: 'AU',
        formName: 'STP Finalisation',
        description: 'Annual finalisation declaration confirming all payroll data is correct',
        deadline: 'July 14',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Failure to lodge penalty up to AUD 1,110 per 28-day period',
      },
      {
        country: 'AU',
        formName: 'PAYG Withholding Summary',
        description: 'Pay As You Go withholding annual report to ATO',
        deadline: 'August 14',
        frequency: 'annual',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Administrative penalties from ATO',
      },
      {
        country: 'AU',
        formName: 'Superannuation Guarantee Charge Statement',
        description: 'Report unpaid or late super contributions to ATO',
        deadline: '28th day after end of each quarter',
        frequency: 'quarterly',
        applicableTo: 'employer',
        penaltyForLateSubmission: 'Super Guarantee Charge includes interest (10% p.a.) + admin fee of AUD 20 per employee per quarter',
      },
    ],
  }

  const results: TaxFilingRequirement[] = []
  for (const country of countries) {
    const requirements = allRequirements[country]
    if (requirements) {
      results.push(...requirements)
    }
  }

  return results
}

// ============================================================
// 5. PAYROLL ANALYTICS
// ============================================================

/**
 * Generate comprehensive payroll analytics for an organization.
 */
export async function getPayrollAnalytics(orgId: string): Promise<PayrollAnalytics> {
  // Fetch all active employees with department info
  const activeEmployees = await db
    .select({
      id: schema.employees.id,
      fullName: schema.employees.fullName,
      country: schema.employees.country,
      departmentId: schema.employees.departmentId,
    })
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.orgId, orgId),
        eq(schema.employees.isActive, true)
      )
    )

  // Fetch all departments for this org
  const departments = await db
    .select({
      id: schema.departments.id,
      name: schema.departments.name,
    })
    .from(schema.departments)
    .where(eq(schema.departments.orgId, orgId))

  const deptMap = new Map<string, string>(departments.map(d => [d.id, d.name]))

  // Gather salary data for all active employees
  const employeeSalaries: Array<{
    employeeId: string
    departmentId: string | null
    country: string | null
    salary: number
    currency: CurrencyCode
  }> = []

  for (const emp of activeEmployees) {
    const { salary, currency } = await getEmployeeSalary(emp.id, orgId)
    employeeSalaries.push({
      employeeId: emp.id,
      departmentId: emp.departmentId,
      country: emp.country,
      salary,
      currency,
    })
  }

  // Convert all salaries to USD for aggregation
  const salariesInUSD = employeeSalaries
    .filter(e => e.salary > 0)
    .map(e => ({
      ...e,
      salaryUSD: convertCurrency(e.salary, e.currency, 'USD'),
    }))

  const totalLaborCost = salariesInUSD.reduce((sum, e) => sum + e.salaryUSD, 0)
  const averageSalary = salariesInUSD.length > 0 ? Math.round(totalLaborCost / salariesInUSD.length) : 0

  // Median salary
  const sortedSalaries = salariesInUSD.map(e => e.salaryUSD).sort((a, b) => a - b)
  const medianSalary = sortedSalaries.length > 0
    ? sortedSalaries.length % 2 === 0
      ? Math.round((sortedSalaries[sortedSalaries.length / 2 - 1] + sortedSalaries[sortedSalaries.length / 2]) / 2)
      : Math.round(sortedSalaries[Math.floor(sortedSalaries.length / 2)])
    : 0

  // Estimated total tax burden
  let totalTaxBurden = 0
  for (const emp of salariesInUSD) {
    const countryCode = resolveCountryCode(emp.country)
    const tax = calculateTax(countryCode, emp.salary)
    const taxInUSD = convertCurrency(tax.totalTax, COUNTRY_CURRENCY_MAP[countryCode], 'USD')
    totalTaxBurden += taxInUSD
  }
  const taxBurdenPercentage = totalLaborCost > 0
    ? Math.round((totalTaxBurden / totalLaborCost) * 10000) / 100
    : 0

  // Cost by department
  const deptGroups = new Map<string, { totalCost: number; count: number; salaries: number[] }>()
  for (const emp of salariesInUSD) {
    const deptId = emp.departmentId || 'unassigned'
    const existing = deptGroups.get(deptId) || { totalCost: 0, count: 0, salaries: [] }
    existing.totalCost += emp.salaryUSD
    existing.count += 1
    existing.salaries.push(emp.salaryUSD)
    deptGroups.set(deptId, existing)
  }

  const costByDepartment = Array.from(deptGroups.entries()).map(([deptId, data]): PayrollAnalytics['costByDepartment'][number] => ({
    departmentId: deptId,
    departmentName: deptMap.get(deptId) ?? 'Unassigned',
    totalCost: Math.round(data.totalCost),
    employeeCount: data.count,
    averageSalary: Math.round(data.totalCost / data.count),
  }))

  // Cost by country
  const countryGroups = new Map<string, { totalCost: number; count: number; currency: CurrencyCode }>()
  for (const emp of employeeSalaries) {
    if (emp.salary === 0) continue
    const country = emp.country || 'Unknown'
    const existing = countryGroups.get(country) || { totalCost: 0, count: 0, currency: emp.currency }
    existing.totalCost += emp.salary
    existing.count += 1
    countryGroups.set(country, existing)
  }

  const costByCountry = Array.from(countryGroups.entries()).map(([country, data]) => ({
    country,
    totalCost: Math.round(data.totalCost),
    employeeCount: data.count,
    averageSalary: Math.round(data.totalCost / data.count),
    currency: data.currency,
  }))

  // Payroll run history
  const payrollHistory = await db
    .select({
      period: schema.payrollRuns.period,
      totalGross: schema.payrollRuns.totalGross,
      totalNet: schema.payrollRuns.totalNet,
      totalDeductions: schema.payrollRuns.totalDeductions,
      employeeCount: schema.payrollRuns.employeeCount,
    })
    .from(schema.payrollRuns)
    .where(eq(schema.payrollRuns.orgId, orgId))
    .orderBy(desc(schema.payrollRuns.createdAt))
    .limit(12)

  return {
    orgId,
    totalLaborCost: Math.round(totalLaborCost),
    averageSalary,
    medianSalary,
    taxBurdenPercentage,
    costByDepartment,
    costByCountry,
    payrollHistory: payrollHistory.map(run => ({
      period: run.period,
      totalGross: run.totalGross,
      totalNet: run.totalNet,
      totalDeductions: run.totalDeductions,
      employeeCount: run.employeeCount,
    })),
    currency: 'USD',
  }
}

// ============================================================
// 6. COMPLIANCE CHECKS
// ============================================================

/** Minimum wage data by country (annual, in local currency) */
const MINIMUM_WAGES: Record<string, { hourly: number; annual: number; currency: CurrencyCode; hoursPerWeek: number }> = {
  US: { hourly: 7.25, annual: 15080, currency: 'USD', hoursPerWeek: 40 },
  UK: { hourly: 11.44, annual: 23795, currency: 'GBP', hoursPerWeek: 40 },
  DE: { hourly: 12.41, annual: 25813, currency: 'EUR', hoursPerWeek: 40 },
  FR: { hourly: 11.65, annual: 21203, currency: 'EUR', hoursPerWeek: 35 },
  CA: { hourly: 17.20, annual: 35776, currency: 'CAD', hoursPerWeek: 40 },
  AU: { hourly: 23.23, annual: 48318, currency: 'AUD', hoursPerWeek: 38 },
}

/** Maximum standard working hours per week by country */
const MAX_WEEKLY_HOURS: Record<string, number> = {
  US: 40,  // Overtime after 40
  UK: 48,  // Working Time Directive
  DE: 48,  // Arbeitszeitgesetz (8h/day * 6 days, avg 48)
  FR: 35,  // Legal working week
  CA: 40,  // Standard, varies by province
  AU: 38,  // National Employment Standards
}

/**
 * Validate payroll compliance across all active employees in an organization.
 * Checks minimum wage, overtime rules, and benefit deductions per country.
 */
export async function validatePayrollCompliance(orgId: string): Promise<ComplianceReport> {
  const issues: ComplianceIssue[] = []

  // Fetch all active employees
  const activeEmployees = await db
    .select()
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.orgId, orgId),
        eq(schema.employees.isActive, true)
      )
    )

  // Fetch benefit plans for the org
  const orgBenefitPlans = await db
    .select()
    .from(schema.benefitPlans)
    .where(
      and(
        eq(schema.benefitPlans.orgId, orgId),
        eq(schema.benefitPlans.isActive, true)
      )
    )

  for (const employee of activeEmployees) {
    const countryCode = resolveCountryCode(employee.country)
    const { salary, currency } = await getEmployeeSalary(employee.id, orgId)

    // --- Minimum Wage Check ---
    const minWage = MINIMUM_WAGES[countryCode]
    if (minWage && salary > 0) {
      // Convert employee salary to the country's local currency for comparison
      const salaryInLocal = currency === minWage.currency
        ? salary
        : convertCurrency(salary, currency, minWage.currency)

      if (salaryInLocal < minWage.annual) {
        issues.push({
          severity: 'critical',
          category: 'Minimum Wage',
          country: countryCode,
          employeeId: employee.id,
          employeeName: employee.fullName,
          description: `Annual salary (${salaryInLocal.toLocaleString()} ${minWage.currency}) is below the minimum wage threshold (${minWage.annual.toLocaleString()} ${minWage.currency}) for ${countryCode}.`,
          recommendation: `Increase salary to at least ${minWage.annual.toLocaleString()} ${minWage.currency} per year (${minWage.hourly} ${minWage.currency}/hr) to comply with ${countryCode} minimum wage law.`,
        })
      }
    }

    if (salary === 0) {
      issues.push({
        severity: 'warning',
        category: 'Missing Salary Data',
        country: countryCode,
        employeeId: employee.id,
        employeeName: employee.fullName,
        description: `No salary record found for active employee ${employee.fullName}.`,
        recommendation: 'Create a salary review record with the current compensation for this employee.',
      })
    }

    // --- Benefit Enrollment Check ---
    // Check if employee is enrolled in mandatory health benefits (for countries that require it)
    if (['US', 'DE', 'FR'].includes(countryCode)) {
      const enrollments = await db
        .select({ planId: schema.benefitEnrollments.planId })
        .from(schema.benefitEnrollments)
        .where(
          and(
            eq(schema.benefitEnrollments.employeeId, employee.id),
            eq(schema.benefitEnrollments.orgId, orgId)
          )
        )

      const hasHealthPlan = enrollments.some(e => {
        const plan = orgBenefitPlans.find(p => p.id === e.planId)
        return plan && plan.type === 'medical'
      })

      if (!hasHealthPlan && orgBenefitPlans.some(p => p.type === 'medical')) {
        issues.push({
          severity: 'warning',
          category: 'Benefits Compliance',
          country: countryCode,
          employeeId: employee.id,
          employeeName: employee.fullName,
          description: `Employee is not enrolled in a medical/health benefit plan. In ${countryCode}, employer-sponsored health coverage may be mandatory.`,
          recommendation: 'Ensure the employee is enrolled in an eligible health plan or has a documented waiver.',
        })
      }
    }

    // --- Pension/Retirement Check ---
    if (['UK', 'AU'].includes(countryCode)) {
      const enrollments = await db
        .select({ planId: schema.benefitEnrollments.planId })
        .from(schema.benefitEnrollments)
        .where(
          and(
            eq(schema.benefitEnrollments.employeeId, employee.id),
            eq(schema.benefitEnrollments.orgId, orgId)
          )
        )

      const hasRetirement = enrollments.some(e => {
        const plan = orgBenefitPlans.find(p => p.id === e.planId)
        return plan && plan.type === 'retirement'
      })

      if (!hasRetirement) {
        const label = countryCode === 'UK' ? 'auto-enrollment pension' : 'superannuation guarantee'
        issues.push({
          severity: 'critical',
          category: 'Pension Compliance',
          country: countryCode,
          employeeId: employee.id,
          employeeName: employee.fullName,
          description: `Employee is not enrolled in a retirement/pension benefit. ${countryCode} mandates ${label} contributions.`,
          recommendation: `Enroll the employee in a qualifying ${label} scheme immediately.`,
        })
      }
    }

    // --- Country-Specific Contract/Working Hours Check ---
    const maxHours = MAX_WEEKLY_HOURS[countryCode]
    if (maxHours && countryCode === 'FR') {
      // France: legal work week is 35 hours. If employee is classified as full-time, flag for awareness.
      issues.push({
        severity: 'info',
        category: 'Working Hours',
        country: countryCode,
        employeeId: employee.id,
        employeeName: employee.fullName,
        description: `France enforces a 35-hour legal work week. Hours beyond 35 must be compensated as overtime (heures supplementaires).`,
        recommendation: 'Verify that overtime hours are tracked and compensated according to the Code du Travail.',
      })
    }
  }

  // --- Organization-Level Checks ---

  // Check for payroll runs with missing data
  const recentRuns = await db
    .select()
    .from(schema.payrollRuns)
    .where(eq(schema.payrollRuns.orgId, orgId))
    .orderBy(desc(schema.payrollRuns.createdAt))
    .limit(3)

  for (const run of recentRuns) {
    if (run.totalGross === 0 && run.employeeCount > 0) {
      issues.push({
        severity: 'warning',
        category: 'Payroll Data Integrity',
        country: 'ALL',
        description: `Payroll run for period ${run.period} shows zero gross pay with ${run.employeeCount} employees. This may indicate a processing error.`,
        recommendation: 'Review and reprocess the payroll run to ensure accurate calculations.',
      })
    }

    if (run.status === 'draft') {
      issues.push({
        severity: 'info',
        category: 'Payroll Status',
        country: 'ALL',
        description: `Payroll run for period ${run.period} is still in draft status.`,
        recommendation: 'Review and approve the payroll run before the payment deadline.',
      })
    }
  }

  // Check for multi-country compliance awareness
  const countriesInOrg = new Set(
    activeEmployees
      .map(e => resolveCountryCode(e.country))
      .filter(c => c !== 'US')
  )

  if (countriesInOrg.size > 0) {
    issues.push({
      severity: 'info',
      category: 'Multi-Country Compliance',
      country: 'ALL',
      description: `Organization has employees in ${countriesInOrg.size + 1} countries (including US). Each jurisdiction has distinct payroll tax, labor law, and reporting requirements.`,
      recommendation: 'Ensure you have local tax advisors or payroll partners in each country to maintain compliance.',
    })
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const totalChecked = activeEmployees.length

  // Compliance score: start at 100, deduct 15 per critical, 5 per warning
  const complianceScore = Math.max(0, 100 - (criticalCount * 15) - (warningCount * 5))

  return {
    orgId,
    checkedAt: new Date().toISOString(),
    totalEmployeesChecked: totalChecked,
    issues,
    isCompliant: criticalCount === 0,
    complianceScore,
  }
}
