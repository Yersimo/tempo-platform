/**
 * Statutory Deductions Engine
 *
 * Calculates mandatory employer and employee contributions for
 * pension, health insurance, and social insurance across 33 African countries.
 * This complements the income tax calculations in tax-calculator.ts.
 */

export interface StatutoryDeduction {
  name: string // e.g., "NHIF", "SSNIT", "Pension Fund"
  type:
    | 'pension'
    | 'health'
    | 'social_insurance'
    | 'housing'
    | 'training_levy'
    | 'other'
  employeeRate: number // as decimal (0.08 = 8%)
  employerRate: number // as decimal
  cap?: number // max annual salary for contribution
  fixedAmount?: number // if flat amount instead of percentage
  currency: string
  mandatory: boolean
}

export interface StatutoryResult {
  country: string
  currency: string
  grossSalary: number
  deductions: Array<{
    name: string
    type: string
    employeeAmount: number
    employerAmount: number
    totalAmount: number
  }>
  totalEmployeeDeductions: number
  totalEmployerContributions: number
  totalStatutoryCost: number // employee + employer combined
}

// Full registry of statutory deductions for all 33 Ecobank countries
const STATUTORY_REGISTRY: Record<string, StatutoryDeduction[]> = {
  // ─── Nigeria ─────────────────────────────────────────────
  NG: [
    {
      name: 'Pension (PFA)',
      type: 'pension',
      employeeRate: 0.08,
      employerRate: 0.1,
      currency: 'NGN',
      mandatory: true,
    },
    {
      name: 'NHF (Housing)',
      type: 'housing',
      employeeRate: 0.025,
      employerRate: 0,
      currency: 'NGN',
      mandatory: true,
    },
    {
      name: 'NHIS (Health)',
      type: 'health',
      employeeRate: 0.05,
      employerRate: 0.1,
      currency: 'NGN',
      mandatory: true,
    },
    {
      name: 'ITF (Training Levy)',
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'NGN',
      mandatory: true,
    },
    {
      name: 'NSITF (Employee Compensation)',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'NGN',
      mandatory: true,
    },
  ],

  // ─── Ghana ───────────────────────────────────────────────
  GH: [
    {
      name: 'SSNIT (Pension)',
      type: 'pension',
      employeeRate: 0.055,
      employerRate: 0.13,
      currency: 'GHS',
      mandatory: true,
    },
    {
      name: 'NHIS (Health)',
      type: 'health',
      employeeRate: 0,
      employerRate: 0.025,
      currency: 'GHS',
      mandatory: true,
    },
    {
      name: 'Tier 2 Pension',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0,
      currency: 'GHS',
      mandatory: true,
    },
  ],

  // ─── Kenya ───────────────────────────────────────────────
  KE: [
    {
      name: 'NSSF (Pension)',
      type: 'pension',
      employeeRate: 0.06,
      employerRate: 0.06,
      cap: 216000,
      currency: 'KES',
      mandatory: true,
    },
    {
      name: 'NHIF (Health)',
      type: 'health',
      employeeRate: 0.025,
      employerRate: 0,
      currency: 'KES',
      mandatory: true,
    },
    {
      name: 'Housing Levy',
      type: 'housing',
      employeeRate: 0.015,
      employerRate: 0.015,
      currency: 'KES',
      mandatory: true,
    },
    {
      name: 'NITA (Training)',
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.0005,
      currency: 'KES',
      mandatory: true,
      fixedAmount: 50,
    },
  ],

  // ─── South Africa ────────────────────────────────────────
  ZA: [
    {
      name: 'UIF (Unemployment)',
      type: 'social_insurance',
      employeeRate: 0.01,
      employerRate: 0.01,
      cap: 177120,
      currency: 'ZAR',
      mandatory: true,
    },
    {
      name: 'SDL (Skills Development)',
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'ZAR',
      mandatory: true,
    },
    {
      name: 'Retirement Fund',
      type: 'pension',
      employeeRate: 0.075,
      employerRate: 0.075,
      currency: 'ZAR',
      mandatory: false,
    },
  ],

  // ─── Côte d'Ivoire ──────────────────────────────────────
  CI: [
    {
      name: 'CNPS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.063,
      employerRate: 0.075,
      cap: 70000 * 12,
      currency: 'XOF',
      mandatory: true,
    },
    {
      name: 'CNPS (Pension)',
      type: 'pension',
      employeeRate: 0.032,
      employerRate: 0.048,
      currency: 'XOF',
      mandatory: true,
    },
    {
      name: 'CMU (Health)',
      type: 'health',
      employeeRate: 0.0,
      employerRate: 0.035,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Senegal ─────────────────────────────────────────────
  SN: [
    {
      name: 'CSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.0,
      employerRate: 0.07,
      cap: 63000 * 12,
      currency: 'XOF',
      mandatory: true,
    },
    {
      name: 'IPRES (Pension)',
      type: 'pension',
      employeeRate: 0.056,
      employerRate: 0.084,
      currency: 'XOF',
      mandatory: true,
    },
    {
      name: 'IPM (Health)',
      type: 'health',
      employeeRate: 0.03,
      employerRate: 0.03,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Cameroon ────────────────────────────────────────────
  CM: [
    {
      name: 'CNPS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.028,
      employerRate: 0.042,
      currency: 'XAF',
      mandatory: true,
    },
    {
      name: 'CNPS (Pension)',
      type: 'pension',
      employeeRate: 0.042,
      employerRate: 0.042,
      currency: 'XAF',
      mandatory: true,
    },
    {
      name: 'FNE (Employment Fund)',
      type: 'training_levy',
      employeeRate: 0.01,
      employerRate: 0.01,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Tanzania ────────────────────────────────────────────
  TZ: [
    {
      name: 'NSSF (Pension)',
      type: 'pension',
      employeeRate: 0.1,
      employerRate: 0.1,
      currency: 'TZS',
      mandatory: true,
    },
    {
      name: 'NHIF (Health)',
      type: 'health',
      employeeRate: 0.03,
      employerRate: 0.03,
      currency: 'TZS',
      mandatory: true,
    },
    {
      name: 'WCF (Workers Comp)',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'TZS',
      mandatory: true,
    },
    {
      name: 'SDL (Skills Dev)',
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.045,
      currency: 'TZS',
      mandatory: true,
    },
  ],

  // ─── Uganda ──────────────────────────────────────────────
  UG: [
    {
      name: 'NSSF (Pension)',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.1,
      currency: 'UGX',
      mandatory: true,
    },
  ],

  // ─── Rwanda ──────────────────────────────────────────────
  RW: [
    {
      name: 'RSSB (Pension)',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.05,
      currency: 'RWF',
      mandatory: true,
    },
    {
      name: 'RAMA/CBHI (Health)',
      type: 'health',
      employeeRate: 0.005,
      employerRate: 0.005,
      currency: 'RWF',
      mandatory: true,
    },
    {
      name: 'Maternity Leave',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.003,
      currency: 'RWF',
      mandatory: true,
    },
  ],

  // ─── DRC (Democratic Republic of the Congo) ──────────────
  CD: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.05,
      employerRate: 0.09,
      currency: 'CDF',
      mandatory: true,
    },
    {
      name: 'INPP (Training)',
      type: 'training_levy',
      employeeRate: 0.0,
      employerRate: 0.02,
      currency: 'CDF',
      mandatory: true,
    },
  ],

  // ─── Congo (Brazzaville) ─────────────────────────────────
  CG: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.04,
      employerRate: 0.158,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Gabon ───────────────────────────────────────────────
  GA: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.025,
      employerRate: 0.165,
      currency: 'XAF',
      mandatory: true,
    },
    {
      name: 'CNAMGS (Health)',
      type: 'health',
      employeeRate: 0.02,
      employerRate: 0.042,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Togo ────────────────────────────────────────────────
  TG: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.04,
      employerRate: 0.175,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Benin ───────────────────────────────────────────────
  BJ: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.036,
      employerRate: 0.154,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Burkina Faso ────────────────────────────────────────
  BF: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.055,
      employerRate: 0.16,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Niger ───────────────────────────────────────────────
  NE: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.017,
      employerRate: 0.158,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Mali ────────────────────────────────────────────────
  ML: [
    {
      name: 'INPS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.036,
      employerRate: 0.174,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Guinea-Bissau ──────────────────────────────────────
  GW: [
    {
      name: 'INSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.08,
      employerRate: 0.15,
      currency: 'XOF',
      mandatory: true,
    },
  ],

  // ─── Chad ────────────────────────────────────────────────
  TD: [
    {
      name: 'CNPS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.035,
      employerRate: 0.165,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Central African Republic ────────────────────────────
  CF: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.03,
      employerRate: 0.14,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Equatorial Guinea ──────────────────────────────────
  GQ: [
    {
      name: 'INSESO (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.045,
      employerRate: 0.215,
      currency: 'XAF',
      mandatory: true,
    },
  ],

  // ─── Mozambique ──────────────────────────────────────────
  MZ: [
    {
      name: 'INSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.03,
      employerRate: 0.04,
      currency: 'MZN',
      mandatory: true,
    },
  ],

  // ─── Zambia ──────────────────────────────────────────────
  ZM: [
    {
      name: 'NAPSA (Pension)',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.05,
      cap: 1221264,
      currency: 'ZMW',
      mandatory: true,
    },
    {
      name: 'NHIMA (Health)',
      type: 'health',
      employeeRate: 0.01,
      employerRate: 0.01,
      currency: 'ZMW',
      mandatory: true,
    },
  ],

  // ─── Zimbabwe ────────────────────────────────────────────
  ZW: [
    {
      name: 'NSSA (Pension)',
      type: 'pension',
      employeeRate: 0.045,
      employerRate: 0.045,
      currency: 'ZWL',
      mandatory: true,
    },
    {
      name: 'NEC (Workers Comp)',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'ZWL',
      mandatory: true,
    },
  ],

  // ─── Sierra Leone ───────────────────────────────────────
  SL: [
    {
      name: 'NASSIT (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.05,
      employerRate: 0.1,
      currency: 'SLL',
      mandatory: true,
    },
  ],

  // ─── Guinea ──────────────────────────────────────────────
  GN: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.05,
      employerRate: 0.18,
      currency: 'GNF',
      mandatory: true,
    },
  ],

  // ─── Gambia ──────────────────────────────────────────────
  GM: [
    {
      name: 'SDF (Social Dev Fund)',
      type: 'social_insurance',
      employeeRate: 0.01,
      employerRate: 0.01,
      currency: 'GMD',
      mandatory: true,
    },
  ],

  // ─── Liberia ─────────────────────────────────────────────
  LR: [
    {
      name: 'NASSCORP (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.03,
      employerRate: 0.03,
      currency: 'LRD',
      mandatory: true,
    },
  ],

  // ─── Cape Verde ──────────────────────────────────────────
  CV: [
    {
      name: 'INPS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.085,
      employerRate: 0.15,
      currency: 'CVE',
      mandatory: true,
    },
  ],

  // ─── Mauritania ──────────────────────────────────────────
  MR: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.01,
      employerRate: 0.14,
      currency: 'MRU',
      mandatory: true,
    },
  ],

  // ─── São Tomé and Príncipe ──────────────────────────────
  ST: [
    {
      name: 'INSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.06,
      employerRate: 0.08,
      currency: 'STN',
      mandatory: true,
    },
  ],

  // ─── Burundi ─────────────────────────────────────────────
  BI: [
    {
      name: 'INSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.04,
      employerRate: 0.06,
      currency: 'BIF',
      mandatory: true,
    },
  ],
}

/**
 * Calculate all statutory deductions for an employee in a given country.
 *
 * @param country - ISO 3166-1 alpha-2 country code
 * @param annualGrossSalary - Annual gross salary in local currency
 * @param options - Optional overrides
 * @returns Detailed breakdown of all statutory deductions
 */
export function calculateStatutoryDeductions(
  country: string,
  annualGrossSalary: number,
  options?: {
    includeOptional?: boolean // include non-mandatory deductions (default true)
    employerOnly?: boolean // only calculate employer side
  }
): StatutoryResult {
  const deductions = STATUTORY_REGISTRY[country]
  if (!deductions) {
    // Country not in registry - return zero deductions
    return {
      country,
      currency: 'USD',
      grossSalary: annualGrossSalary,
      deductions: [],
      totalEmployeeDeductions: 0,
      totalEmployerContributions: 0,
      totalStatutoryCost: 0,
    }
  }

  const includeOptional = options?.includeOptional !== false
  const filtered = deductions.filter((d) => d.mandatory || includeOptional)

  const results = filtered.map((deduction) => {
    const applicableSalary = deduction.cap
      ? Math.min(annualGrossSalary, deduction.cap)
      : annualGrossSalary

    let employeeAmount: number
    let employerAmount: number

    if (deduction.fixedAmount !== undefined) {
      // Fixed amount per period (e.g., Kenya NITA levy)
      employeeAmount = deduction.employeeRate > 0 ? deduction.fixedAmount : 0
      employerAmount = deduction.employerRate > 0 ? deduction.fixedAmount : 0
    } else {
      employeeAmount = options?.employerOnly
        ? 0
        : Math.round(applicableSalary * deduction.employeeRate * 100) / 100
      employerAmount =
        Math.round(applicableSalary * deduction.employerRate * 100) / 100
    }

    return {
      name: deduction.name,
      type: deduction.type,
      employeeAmount,
      employerAmount,
      totalAmount: employeeAmount + employerAmount,
    }
  })

  const totalEmployee = results.reduce((sum, d) => sum + d.employeeAmount, 0)
  const totalEmployer = results.reduce((sum, d) => sum + d.employerAmount, 0)

  return {
    country,
    currency: deductions[0]?.currency || 'USD',
    grossSalary: annualGrossSalary,
    deductions: results,
    totalEmployeeDeductions: Math.round(totalEmployee * 100) / 100,
    totalEmployerContributions: Math.round(totalEmployer * 100) / 100,
    totalStatutoryCost: Math.round((totalEmployee + totalEmployer) * 100) / 100,
  }
}

/**
 * Get all statutory requirements for a country (for compliance display).
 */
export function getStatutoryRequirements(
  country: string
): StatutoryDeduction[] {
  return STATUTORY_REGISTRY[country] || []
}

/**
 * Get list of all supported countries.
 */
export function getSupportedCountries(): string[] {
  return Object.keys(STATUTORY_REGISTRY)
}

/**
 * Calculate total employer cost (salary + employer contributions).
 * This is the TRUE cost of an employee, not just their gross salary.
 */
export function calculateTotalEmployerCost(
  country: string,
  annualGrossSalary: number
): {
  grossSalary: number
  employerContributions: number
  totalCost: number
  costMultiplier: number // e.g., 1.22 means employer pays 22% above gross
} {
  const result = calculateStatutoryDeductions(country, annualGrossSalary)
  const totalCost = annualGrossSalary + result.totalEmployerContributions
  return {
    grossSalary: annualGrossSalary,
    employerContributions: result.totalEmployerContributions,
    totalCost: Math.round(totalCost * 100) / 100,
    costMultiplier:
      Math.round((totalCost / annualGrossSalary) * 1000) / 1000,
  }
}
