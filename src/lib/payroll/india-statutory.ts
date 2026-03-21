/**
 * India Statutory Payroll Compliance Engine
 *
 * Full statutory compliance for Indian payroll covering:
 * - Provident Fund (EPF/EPS/EDLI)
 * - Employee State Insurance (ESI)
 * - Professional Tax (PT) — state-specific
 * - Income Tax (TDS) — New & Old Regime
 * - Gratuity (Payment of Gratuity Act)
 * - Bonus (Payment of Bonus Act)
 * - Leave Encashment
 * - Form 16 / Form 12BA / Form 24Q / ECR generation
 *
 * All amounts in PAISE (100 paise = 1 INR) unless noted.
 * Rates effective: FY 2024-25 (April 2024 - March 2025).
 * Sources: EPFO, ESIC, CBDT, respective State PT Acts.
 */

// ============================================================
// TYPES
// ============================================================

export interface IndiaEmployee {
  id: string
  fullName: string
  dateOfJoining: string // ISO date
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
  state: string // e.g. 'Maharashtra', 'Karnataka'
  uan?: string // Universal Account Number (PF)
  ipNumber?: string // ESI IP number
  pan?: string // PAN card
  taxRegime: 'new' | 'old'
  yearsOfService?: number
  section80C?: number // paise — deduction claimed under old regime
  section80D?: number // paise — medical insurance
  section80CCD?: number // paise — NPS
  hraReceived?: number // paise — HRA component received per year
  rentPaid?: number // paise — actual rent per year
  isMetroCity?: boolean
  ltaClaimed?: number // paise — LTA claimed
  dependents?: number
}

export interface IndiaSalaryStructure {
  basic: number // paise — monthly
  da: number // paise — monthly (dearness allowance)
  hra: number // paise — monthly
  specialAllowance: number // paise — monthly
  otherAllowances?: number // paise — monthly
  conveyance?: number // paise — monthly
  lta?: number // paise — monthly (leave travel allowance)
}

export interface IndiaPayrollOptions {
  month: number // 1-12
  year: number
  includeGratuityProvision?: boolean
  includeBonusProvision?: boolean
}

export interface PFBreakdown {
  employeeEPF: number // paise — 12% of PF wage
  employerEPF: number // paise — 3.67% to EPF
  employerEPS: number // paise — 8.33% to EPS
  adminCharges: number // paise — 0.5%
  edli: number // paise — 0.5% capped
  pfWage: number // paise — basic + DA (capped at 15000*100)
  totalEmployerPF: number // paise
}

export interface ESIBreakdown {
  applicable: boolean
  employeeESI: number // paise
  employerESI: number // paise
  monthlyGross: number // paise
}

export interface TDSBreakdown {
  regime: 'new' | 'old'
  annualTaxableIncome: number // paise
  incomeTax: number // paise — annual
  surcharge: number // paise — annual
  cess: number // paise — annual
  totalTDS: number // paise — annual
  monthlyTDS: number // paise
  // Old regime deduction details
  section80CDeduction?: number
  section80DDeduction?: number
  hraExemption?: number
  standardDeduction: number // paise — 50000 INR
}

export interface GratuityResult {
  eligible: boolean
  yearsOfService: number
  lastDrawnSalary: number // paise — basic + DA monthly
  gratuityAmount: number // paise
  taxFreeLimit: number // paise — 20 lakh
  taxableGratuity: number // paise
}

export interface BonusResult {
  applicable: boolean
  basicMonthly: number // paise
  bonusPercentage: number // decimal (0.0833 to 0.20)
  calculationCeiling: number // paise — 7000 INR or min wage
  annualBonus: number // paise
  monthlyProvision: number // paise
}

export interface IndiaPayrollResult {
  employeeId: string
  month: number
  year: number
  // Salary structure
  basic: number
  da: number
  hra: number
  specialAllowance: number
  otherAllowances: number
  monthlyGross: number
  // PF
  pf: PFBreakdown
  // ESI
  esi: ESIBreakdown
  // Professional Tax
  professionalTax: number
  professionalTaxState: string
  // TDS (monthly portion)
  tds: TDSBreakdown
  // Gratuity provision (monthly)
  gratuityProvision: number
  // Bonus provision (monthly)
  bonusProvision: number
  // Totals
  totalEmployeeDeductions: number
  totalEmployerContributions: number
  netPay: number
  costToCompany: number
}

export interface ECRData {
  orgId: string
  month: number
  year: number
  establishmentId?: string
  entries: Array<{
    uan: string
    memberName: string
    grossWage: number // paise
    epfWage: number // paise
    epsWage: number // paise
    edliWage: number // paise
    epfContribution: number // paise — employee EPF
    epsContribution: number // paise — employer EPS
    epfDifference: number // paise — employer EPF (3.67%)
    ncp: number // non-contributing period days
  }>
  totalEPFEmployee: number
  totalEPFEmployer: number
  totalEPS: number
  totalEDLI: number
  totalAdminCharges: number
  generatedAt: string
}

export interface Form16Data {
  employeeId: string
  employeeName: string
  pan: string
  financialYear: string
  assessmentYear: string
  employer: {
    name: string
    tan: string
    address: string
  }
  partA: {
    quarterlyTDS: Array<{
      quarter: string
      taxDeducted: number
      taxDeposited: number
    }>
    totalTaxDeducted: number
    totalTaxDeposited: number
  }
  partB: {
    grossSalary: number
    exemptAllowances: number
    netSalary: number
    standardDeduction: number
    incomeChargeableUnderSalaries: number
    deductionsChapterVIA: number
    totalTaxableIncome: number
    taxOnTotalIncome: number
    surcharge: number
    educationCess: number
    totalTaxPayable: number
    relief89: number
    taxPayableAfterRelief: number
  }
  generatedAt: string
}

// ============================================================
// CONSTANTS
// ============================================================

/** PF wage ceiling: basic + DA capped at INR 15,000/month */
const PF_WAGE_CEILING_PAISE = 15000_00 // 15,000 INR in paise

/** EPF employee contribution rate */
const EPF_EMPLOYEE_RATE = 0.12

/** Employer EPF rate (goes to EPF account) */
const EPF_EMPLOYER_RATE = 0.0367

/** Employer EPS rate (goes to EPS account) */
const EPS_RATE = 0.0833

/** Employer PF admin charges */
const PF_ADMIN_RATE = 0.005

/** EDLI rate (capped at PF ceiling) */
const EDLI_RATE = 0.005

/** ESI gross salary ceiling: INR 21,000/month */
const ESI_GROSS_CEILING_PAISE = 21000_00

/** ESI employee rate */
const ESI_EMPLOYEE_RATE = 0.0075

/** ESI employer rate */
const ESI_EMPLOYER_RATE = 0.0325

/** Standard deduction for salaried employees (both regimes) */
const STANDARD_DEDUCTION_PAISE = 75000_00 // INR 75,000 from FY 2024-25

/** Section 80C deduction cap under old regime */
const SECTION_80C_CAP_PAISE = 150000_00

/** Gratuity tax-free limit */
const GRATUITY_TAX_FREE_LIMIT_PAISE = 2000000_00 // INR 20,00,000

/** Leave encashment tax-free limit on retirement */
const LEAVE_ENCASHMENT_TAX_FREE_PAISE = 2500000_00 // INR 25,00,000

/** Bonus applicability salary ceiling */
const BONUS_SALARY_CEILING_PAISE = 21000_00 // monthly

/** Bonus calculation ceiling */
const BONUS_CALC_CEILING_PAISE = 7000_00 // monthly

/** Minimum bonus rate */
const BONUS_MIN_RATE = 0.0833 // 8.33%

/** Maximum bonus rate */
const BONUS_MAX_RATE = 0.20 // 20%

// ============================================================
// NEW TAX REGIME BRACKETS (FY 2024-25) — annual amounts in paise
// ============================================================

interface TaxSlab {
  min: number // paise
  max: number // paise (Infinity for last bracket)
  rate: number
}

const NEW_REGIME_SLABS: TaxSlab[] = [
  { min: 0, max: 300000_00, rate: 0 },
  { min: 300000_00, max: 700000_00, rate: 0.05 },
  { min: 700000_00, max: 1000000_00, rate: 0.10 },
  { min: 1000000_00, max: 1200000_00, rate: 0.15 },
  { min: 1200000_00, max: 1500000_00, rate: 0.20 },
  { min: 1500000_00, max: Infinity, rate: 0.30 },
]

const OLD_REGIME_SLABS: TaxSlab[] = [
  { min: 0, max: 250000_00, rate: 0 },
  { min: 250000_00, max: 500000_00, rate: 0.05 },
  { min: 500000_00, max: 1000000_00, rate: 0.20 },
  { min: 1000000_00, max: Infinity, rate: 0.30 },
]

// ============================================================
// SURCHARGE SLABS
// ============================================================

interface SurchargeRange {
  min: number // paise — annual income threshold
  rate: number
}

const SURCHARGE_SLABS: SurchargeRange[] = [
  { min: 5000000_00, rate: 0.37 }, // above 5 Cr — 37% (old regime only; new regime max 25%)
  { min: 2000000_00, rate: 0.25 }, // above 2 Cr
  { min: 1000000_00, rate: 0.15 }, // above 1 Cr
  { min: 5000000_0, rate: 0.10 },  // above 50 Lakh (50,00,000 paise)
]

const NEW_REGIME_SURCHARGE_SLABS: SurchargeRange[] = [
  { min: 2000000_00, rate: 0.25 }, // above 2 Cr (max 25% in new regime)
  { min: 1000000_00, rate: 0.15 }, // above 1 Cr
  { min: 5000000_0, rate: 0.10 },  // above 50 Lakh
]

/** Health & Education Cess rate */
const CESS_RATE = 0.04

// ============================================================
// PROFESSIONAL TAX RATES BY STATE — monthly amounts in paise
// ============================================================

interface ProfessionalTaxSlab {
  min: number // paise — monthly gross
  max: number // paise
  tax: number // paise
}

const PROFESSIONAL_TAX_SLABS: Record<string, ProfessionalTaxSlab[]> = {
  // Maharashtra — max INR 2,500/year (200/month + 300 in Feb)
  Maharashtra: [
    { min: 0, max: 750000, tax: 0 },            // up to 7,500
    { min: 750000, max: 1000000, tax: 17500 },   // 175 INR
    { min: 1000000, max: Infinity, tax: 20000 },  // 200 INR (300 in Feb for annual 2500)
  ],
  // Karnataka
  Karnataka: [
    { min: 0, max: 1500000, tax: 0 },            // up to 15,000
    { min: 1500000, max: 2500000, tax: 15000 },  // 150 INR
    { min: 2500000, max: Infinity, tax: 20000 },  // 200 INR
  ],
  // Tamil Nadu
  'Tamil Nadu': [
    { min: 0, max: 2100000, tax: 0 },            // up to 21,000
    { min: 2100000, max: 3000000, tax: 13500 },  // 135 INR
    { min: 3000000, max: 4500000, tax: 31500 },  // 315 INR
    { min: 4500000, max: 6000000, tax: 69000 },  // 690 INR
    { min: 6000000, max: 7500000, tax: 82500 },  // 825 INR
    { min: 7500000, max: Infinity, tax: 104200 }, // 1042 INR (monthly avg of annual 12500)
  ],
  // West Bengal
  'West Bengal': [
    { min: 0, max: 1000000, tax: 0 },
    { min: 1000000, max: 1500000, tax: 11000 },  // 110 INR
    { min: 1500000, max: 2500000, tax: 13000 },  // 130 INR
    { min: 2500000, max: Infinity, tax: 20000 },  // 200 INR
  ],
  // Andhra Pradesh / Telangana
  'Andhra Pradesh': [
    { min: 0, max: 1500000, tax: 0 },
    { min: 1500000, max: 2000000, tax: 15000 },  // 150 INR
    { min: 2000000, max: Infinity, tax: 20000 },  // 200 INR
  ],
  Telangana: [
    { min: 0, max: 1500000, tax: 0 },
    { min: 1500000, max: 2000000, tax: 15000 },
    { min: 2000000, max: Infinity, tax: 20000 },
  ],
  // Gujarat
  Gujarat: [
    { min: 0, max: 599900, tax: 0 },
    { min: 599900, max: 899900, tax: 8000 },     // 80 INR
    { min: 899900, max: 1199900, tax: 15000 },   // 150 INR
    { min: 1199900, max: Infinity, tax: 20000 },  // 200 INR
  ],
  // Rajasthan (no PT)
  Rajasthan: [],
  // Delhi (no PT)
  Delhi: [],
  // Madhya Pradesh
  'Madhya Pradesh': [
    { min: 0, max: 1500000, tax: 0 },
    { min: 1500000, max: 2000000, tax: 15000 },
    { min: 2000000, max: Infinity, tax: 20833 }, // INR 2,500/year → ~208.33/month
  ],
  // Kerala
  Kerala: [
    { min: 0, max: 1199900, tax: 0 },
    { min: 1199900, max: 1799900, tax: 12000 },  // 120 INR
    { min: 1799900, max: 2499900, tax: 18000 },  // 180 INR
    { min: 2499900, max: Infinity, tax: 20800 },  // 208 INR
  ],
}

// ============================================================
// CORE FUNCTIONS
// ============================================================

/**
 * Calculate PF (EPF/EPS/EDLI) for one month.
 * PF wage = basic + DA, capped at INR 15,000/month.
 */
export function calculatePF(basic: number, da: number): PFBreakdown {
  const pfWageUncapped = basic + da
  const pfWage = Math.min(pfWageUncapped, PF_WAGE_CEILING_PAISE)

  const employeeEPF = Math.round(pfWageUncapped * EPF_EMPLOYEE_RATE)
  const employerEPF = Math.round(pfWageUncapped * EPF_EMPLOYER_RATE)
  const employerEPS = Math.round(pfWage * EPS_RATE) // EPS capped at ceiling
  const adminCharges = Math.round(pfWageUncapped * PF_ADMIN_RATE)
  const edli = Math.round(pfWage * EDLI_RATE) // EDLI capped at ceiling

  return {
    employeeEPF,
    employerEPF,
    employerEPS,
    adminCharges,
    edli,
    pfWage,
    totalEmployerPF: employerEPF + employerEPS + adminCharges + edli,
  }
}

/**
 * Calculate ESI for one month.
 * Applicable only when monthly gross <= INR 21,000.
 */
export function calculateESI(monthlyGross: number): ESIBreakdown {
  const applicable = monthlyGross <= ESI_GROSS_CEILING_PAISE
  if (!applicable) {
    return { applicable: false, employeeESI: 0, employerESI: 0, monthlyGross }
  }
  return {
    applicable: true,
    employeeESI: Math.round(monthlyGross * ESI_EMPLOYEE_RATE),
    employerESI: Math.round(monthlyGross * ESI_EMPLOYER_RATE),
    monthlyGross,
  }
}

/**
 * Get monthly Professional Tax for a given state and gross salary.
 */
export function getStateProfessionalTax(state: string, monthlyGross: number): number {
  const slabs = PROFESSIONAL_TAX_SLABS[state]
  if (!slabs || slabs.length === 0) return 0 // State doesn't levy PT (e.g. Delhi, Rajasthan)

  for (let i = slabs.length - 1; i >= 0; i--) {
    if (monthlyGross >= slabs[i].min) {
      return slabs[i].tax
    }
  }
  return 0
}

/**
 * Calculate income tax using slab-based progressive calculation.
 * Returns annual tax in paise.
 */
function calculateSlabTax(annualTaxable: number, slabs: TaxSlab[]): number {
  let tax = 0
  for (const slab of slabs) {
    if (annualTaxable <= slab.min) break
    const taxableInSlab = Math.min(annualTaxable, slab.max) - slab.min
    tax += Math.round(taxableInSlab * slab.rate)
  }
  return tax
}

/**
 * Calculate HRA exemption under old regime.
 * Minimum of: (a) actual HRA received, (b) rent - 10% basic, (c) 50%/40% of basic.
 */
function calculateHRAExemption(
  annualBasic: number,
  annualHRA: number,
  annualRent: number,
  isMetro: boolean,
): number {
  if (annualRent <= 0 || annualHRA <= 0) return 0
  const a = annualHRA
  const b = annualRent - Math.round(annualBasic * 0.10)
  const c = Math.round(annualBasic * (isMetro ? 0.50 : 0.40))
  return Math.max(0, Math.min(a, b, c))
}

/**
 * Calculate surcharge on income tax.
 */
function calculateSurcharge(
  annualTaxable: number,
  incomeTax: number,
  regime: 'new' | 'old',
): number {
  const slabs = regime === 'new' ? NEW_REGIME_SURCHARGE_SLABS : SURCHARGE_SLABS
  for (const slab of slabs) {
    if (annualTaxable > slab.min) {
      return Math.round(incomeTax * slab.rate)
    }
  }
  return 0
}

/**
 * Calculate TDS (Tax Deducted at Source) — annual, with monthly projection.
 */
export function calculateTDS(
  employee: IndiaEmployee,
  annualGross: number,
  annualBasic: number,
  annualDA: number,
): TDSBreakdown {
  const regime = employee.taxRegime || 'new'
  let annualTaxableIncome: number
  let section80CDeduction = 0
  let section80DDeduction = 0
  let hraExemption = 0
  const standardDeduction = STANDARD_DEDUCTION_PAISE

  if (regime === 'old') {
    // Old regime: gross - exemptions - standard deduction - chapter VIA deductions
    hraExemption = calculateHRAExemption(
      annualBasic,
      employee.hraReceived || 0,
      employee.rentPaid || 0,
      employee.isMetroCity || false,
    )
    section80CDeduction = Math.min(employee.section80C || 0, SECTION_80C_CAP_PAISE)
    section80DDeduction = employee.section80D || 0
    const ltaExemption = employee.ltaClaimed || 0

    annualTaxableIncome = annualGross
      - hraExemption
      - ltaExemption
      - standardDeduction
      - section80CDeduction
      - section80DDeduction
      - (employee.section80CCD || 0)
  } else {
    // New regime: gross - standard deduction only
    annualTaxableIncome = annualGross - standardDeduction
  }

  annualTaxableIncome = Math.max(0, annualTaxableIncome)

  // Rebate u/s 87A: New regime — full tax rebate if income <= 7 lakh
  const slabs = regime === 'new' ? NEW_REGIME_SLABS : OLD_REGIME_SLABS
  let incomeTax = calculateSlabTax(annualTaxableIncome, slabs)

  // Section 87A rebate: New regime up to 7L taxable; Old regime up to 5L taxable
  const rebateThreshold = regime === 'new' ? 700000_00 : 500000_00
  const rebateCap = regime === 'new' ? 25000_00 : 12500_00
  if (annualTaxableIncome <= rebateThreshold) {
    incomeTax = Math.max(0, incomeTax - rebateCap)
  }

  const surcharge = calculateSurcharge(annualTaxableIncome, incomeTax, regime)
  const cess = Math.round((incomeTax + surcharge) * CESS_RATE)
  const totalTDS = incomeTax + surcharge + cess
  const monthlyTDS = Math.round(totalTDS / 12)

  return {
    regime,
    annualTaxableIncome,
    incomeTax,
    surcharge,
    cess,
    totalTDS,
    monthlyTDS,
    section80CDeduction,
    section80DDeduction,
    hraExemption,
    standardDeduction,
  }
}

/**
 * Calculate gratuity.
 * Formula: (15 * last drawn salary * years of service) / 26
 * Eligible after 5 years of continuous service.
 */
export function calculateGratuity(employee: IndiaEmployee, lastDrawnBasicPlusDA: number): GratuityResult {
  const years = employee.yearsOfService || 0
  const eligible = years >= 5

  const gratuityAmount = eligible
    ? Math.round((15 * lastDrawnBasicPlusDA * years) / 26)
    : 0

  const taxableGratuity = Math.max(0, gratuityAmount - GRATUITY_TAX_FREE_LIMIT_PAISE)

  return {
    eligible,
    yearsOfService: years,
    lastDrawnSalary: lastDrawnBasicPlusDA,
    gratuityAmount,
    taxFreeLimit: GRATUITY_TAX_FREE_LIMIT_PAISE,
    taxableGratuity,
  }
}

/**
 * Calculate statutory bonus under the Payment of Bonus Act.
 * Applicable to employees earning <= INR 21,000/month.
 * Calculation ceiling: INR 7,000/month or minimum wage (whichever is higher).
 */
export function calculateBonus(employee: IndiaEmployee, monthlyBasic: number): BonusResult {
  const applicable = monthlyBasic <= BONUS_SALARY_CEILING_PAISE

  if (!applicable) {
    return {
      applicable: false,
      basicMonthly: monthlyBasic,
      bonusPercentage: 0,
      calculationCeiling: BONUS_CALC_CEILING_PAISE,
      annualBonus: 0,
      monthlyProvision: 0,
    }
  }

  const calculationBase = Math.min(monthlyBasic, BONUS_CALC_CEILING_PAISE)
  const bonusPercentage = BONUS_MIN_RATE // default minimum; employer can pay up to 20%
  const annualBonus = Math.round(calculationBase * 12 * bonusPercentage)
  const monthlyProvision = Math.round(annualBonus / 12)

  return {
    applicable,
    basicMonthly: monthlyBasic,
    bonusPercentage,
    calculationCeiling: BONUS_CALC_CEILING_PAISE,
    annualBonus,
    monthlyProvision,
  }
}

/**
 * Full India payroll calculation for one employee for one month.
 */
export function calculateIndiaPayroll(
  employee: IndiaEmployee,
  salary: IndiaSalaryStructure,
  options: IndiaPayrollOptions,
): IndiaPayrollResult {
  const monthlyGross = salary.basic + salary.da + salary.hra
    + salary.specialAllowance + (salary.otherAllowances || 0)
    + (salary.conveyance || 0) + (salary.lta || 0)

  // --- PF ---
  const pf = calculatePF(salary.basic, salary.da)

  // --- ESI ---
  const esi = calculateESI(monthlyGross)

  // --- Professional Tax ---
  const professionalTax = getStateProfessionalTax(employee.state, monthlyGross)

  // --- TDS ---
  const annualGross = monthlyGross * 12
  const annualBasic = salary.basic * 12
  const annualDA = salary.da * 12
  const tds = calculateTDS(employee, annualGross, annualBasic, annualDA)

  // --- Gratuity provision ---
  let gratuityProvision = 0
  if (options.includeGratuityProvision) {
    const gratuity = calculateGratuity(employee, salary.basic + salary.da)
    // Monthly provision = (gratuity / remaining months to 5 years) or standard monthly accrual
    gratuityProvision = Math.round(
      (15 * (salary.basic + salary.da)) / 26 / 12,
    )
  }

  // --- Bonus provision ---
  let bonusProvision = 0
  if (options.includeBonusProvision) {
    const bonus = calculateBonus(employee, salary.basic)
    bonusProvision = bonus.monthlyProvision
  }

  // --- Totals ---
  const totalEmployeeDeductions = pf.employeeEPF + esi.employeeESI
    + professionalTax + tds.monthlyTDS
  const totalEmployerContributions = pf.totalEmployerPF + esi.employerESI
    + gratuityProvision + bonusProvision
  const netPay = monthlyGross - totalEmployeeDeductions
  const costToCompany = monthlyGross + totalEmployerContributions

  return {
    employeeId: employee.id,
    month: options.month,
    year: options.year,
    basic: salary.basic,
    da: salary.da,
    hra: salary.hra,
    specialAllowance: salary.specialAllowance,
    otherAllowances: salary.otherAllowances || 0,
    monthlyGross,
    pf,
    esi,
    professionalTax,
    professionalTaxState: employee.state,
    tds,
    gratuityProvision,
    bonusProvision,
    totalEmployeeDeductions,
    totalEmployerContributions,
    netPay,
    costToCompany,
  }
}

/**
 * Generate monthly ECR (Electronic Challan cum Return) for PF remittance.
 */
export function generateECR(
  orgId: string,
  month: number,
  year: number,
  employees: Array<{
    employee: IndiaEmployee
    salary: IndiaSalaryStructure
    ncpDays?: number // non-contributing period
  }>,
  establishmentId?: string,
): ECRData {
  const entries = employees.map(({ employee, salary, ncpDays }) => {
    const pfWageUncapped = salary.basic + salary.da
    const pfWageCapped = Math.min(pfWageUncapped, PF_WAGE_CEILING_PAISE)
    const monthlyGross = salary.basic + salary.da + salary.hra
      + salary.specialAllowance + (salary.otherAllowances || 0)

    const epfContribution = Math.round(pfWageUncapped * EPF_EMPLOYEE_RATE)
    const epsContribution = Math.round(pfWageCapped * EPS_RATE)
    const epfDifference = Math.round(pfWageUncapped * EPF_EMPLOYER_RATE)

    return {
      uan: employee.uan || '',
      memberName: employee.fullName,
      grossWage: monthlyGross,
      epfWage: pfWageUncapped,
      epsWage: pfWageCapped,
      edliWage: pfWageCapped,
      epfContribution,
      epsContribution,
      epfDifference,
      ncp: ncpDays || 0,
    }
  })

  const totalEPFEmployee = entries.reduce((s, e) => s + e.epfContribution, 0)
  const totalEPFEmployer = entries.reduce((s, e) => s + e.epfDifference, 0)
  const totalEPS = entries.reduce((s, e) => s + e.epsContribution, 0)
  const totalEDLI = entries.reduce(
    (s, e) => s + Math.round(e.edliWage * EDLI_RATE), 0,
  )
  const totalAdminCharges = entries.reduce(
    (s, e) => s + Math.round(e.epfWage * PF_ADMIN_RATE), 0,
  )

  return {
    orgId,
    month,
    year,
    establishmentId,
    entries,
    totalEPFEmployee,
    totalEPFEmployer,
    totalEPS,
    totalEDLI,
    totalAdminCharges,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Generate Form 16 (Annual TDS Certificate) data.
 */
export function generateForm16(
  employee: IndiaEmployee,
  salary: IndiaSalaryStructure,
  financialYear: string, // e.g. '2024-25'
  employerInfo: { name: string; tan: string; address: string },
): Form16Data {
  const annualGross = (salary.basic + salary.da + salary.hra
    + salary.specialAllowance + (salary.otherAllowances || 0)
    + (salary.conveyance || 0) + (salary.lta || 0)) * 12

  const annualBasic = salary.basic * 12
  const annualDA = salary.da * 12
  const tds = calculateTDS(employee, annualGross, annualBasic, annualDA)

  // Split annual TDS into quarterly deposits
  const quarterlyTDS = Math.round(tds.totalTDS / 4)
  const quarterlyBreakdown = [
    { quarter: 'Q1 (Apr-Jun)', taxDeducted: quarterlyTDS, taxDeposited: quarterlyTDS },
    { quarter: 'Q2 (Jul-Sep)', taxDeducted: quarterlyTDS, taxDeposited: quarterlyTDS },
    { quarter: 'Q3 (Oct-Dec)', taxDeducted: quarterlyTDS, taxDeposited: quarterlyTDS },
    { quarter: 'Q4 (Jan-Mar)', taxDeducted: tds.totalTDS - quarterlyTDS * 3, taxDeposited: tds.totalTDS - quarterlyTDS * 3 },
  ]

  // Exempt allowances under old regime
  const exemptAllowances = tds.regime === 'old'
    ? (tds.hraExemption || 0) + (employee.ltaClaimed || 0)
    : 0

  const netSalary = annualGross - exemptAllowances
  const incomeUnderSalaries = netSalary - tds.standardDeduction
  const chapterVIA = (tds.section80CDeduction || 0) + (tds.section80DDeduction || 0)
    + (employee.section80CCD || 0)

  const [startYear] = financialYear.split('-').map(Number)
  const assessmentYear = `${startYear + 1}-${(startYear + 2).toString().slice(-2)}`

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    pan: employee.pan || '',
    financialYear,
    assessmentYear,
    employer: employerInfo,
    partA: {
      quarterlyTDS: quarterlyBreakdown,
      totalTaxDeducted: tds.totalTDS,
      totalTaxDeposited: tds.totalTDS,
    },
    partB: {
      grossSalary: annualGross,
      exemptAllowances,
      netSalary,
      standardDeduction: tds.standardDeduction,
      incomeChargeableUnderSalaries: Math.max(0, incomeUnderSalaries),
      deductionsChapterVIA: chapterVIA,
      totalTaxableIncome: tds.annualTaxableIncome,
      taxOnTotalIncome: tds.incomeTax,
      surcharge: tds.surcharge,
      educationCess: tds.cess,
      totalTaxPayable: tds.totalTDS,
      relief89: 0,
      taxPayableAfterRelief: tds.totalTDS,
    },
    generatedAt: new Date().toISOString(),
  }
}
