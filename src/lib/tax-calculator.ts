/**
 * Client-safe Tax Calculator
 *
 * Pure functions extracted from payroll-engine.ts for use in client components.
 * No database imports — safe for 'use client' pages.
 *
 * Supports 100+ countries:
 * - US, UK, DE, FR, CA, AU: full custom calculators with state/provincial taxes
 * - All other countries: registry-based generic calculator
 */

// ============================================================
// TYPES & INTERFACES
// ============================================================

export type SupportedCountry =
  // Original 6
  | 'US' | 'UK' | 'DE' | 'FR' | 'CA' | 'AU'
  // EU countries (excluding DE, FR which are above)
  | 'NL' | 'BE' | 'ES' | 'IT' | 'PT' | 'IE' | 'AT' | 'PL' | 'SE' | 'DK'
  | 'FI' | 'GR' | 'CZ' | 'RO' | 'HU' | 'BG' | 'HR' | 'SK' | 'LU' | 'EE'
  | 'LV' | 'LT' | 'SI' | 'CY' | 'MT'
  // African countries
  | 'NG' | 'GH' | 'KE' | 'ZA' | 'EG' | 'MA' | 'TN' | 'SN' | 'CI' | 'TZ'
  | 'ET' | 'RW' | 'UG' | 'CM' | 'CD' | 'DZ' | 'AO' | 'MZ' | 'ZM' | 'ZW'
  | 'BW' | 'MU' | 'NA' | 'ML' | 'BF' | 'NE' | 'TD' | 'GN' | 'BJ' | 'TG'
  | 'SL' | 'LR' | 'CF' | 'CG' | 'GA' | 'GQ' | 'MR' | 'DJ' | 'ER' | 'SO'
  | 'SS' | 'SD' | 'LY' | 'MW' | 'MG' | 'SZ' | 'LS' | 'SC' | 'CV' | 'ST'
  | 'KM' | 'GM' | 'GW' | 'BI'
  // Other major markets
  | 'JP' | 'KR' | 'SG' | 'HK' | 'IN' | 'BR' | 'MX' | 'AE' | 'SA' | 'IL'
  | 'NZ' | 'CH' | 'NO' | 'IS'

export type CurrencyCode =
  | 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'JPY' | 'INR' | 'BRL'
  | 'NGN' | 'GHS' | 'KES' | 'ZAR' | 'EGP' | 'MAD' | 'TND' | 'XOF' | 'TZS'
  | 'ETB' | 'RWF' | 'UGX' | 'XAF' | 'CDF' | 'DZD' | 'AOA' | 'MZN' | 'ZMW'
  | 'ZWL' | 'BWP' | 'MUR' | 'NAD' | 'PLN' | 'SEK' | 'DKK' | 'CZK' | 'RON'
  | 'HUF' | 'BGN' | 'CHF' | 'NOK' | 'ISK' | 'KRW' | 'SGD' | 'HKD' | 'MXN'
  | 'AED' | 'SAR' | 'ILS' | 'NZD' | 'MWK' | 'MGA' | 'SZL' | 'LSL' | 'SCR'
  | 'CVE' | 'STN' | 'KMF' | 'GMD' | 'GNF' | 'BIF' | 'LRD' | 'SLL' | 'SOS'
  | 'SSP' | 'SDG' | 'LYD' | 'ERN' | 'DJF' | 'MRU'

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
  // DB-backed rate overrides (used by payroll engine when org has custom tax configs)
  socialSecurityRateOverride?: number
  pensionRateOverride?: number
  medicareRateOverride?: number
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

// ============================================================
// REGISTRY: COUNTRY TAX CONFIG
// ============================================================

interface CountryTaxConfig {
  currency: CurrencyCode
  incomeTaxBrackets: TaxBracket[]
  socialSecurityRate: number
  socialSecurityCap?: number
  pensionRate: number
  pensionCap?: number
  medicareRate?: number
  additionalTaxes?: Record<string, number>
  personalAllowance?: number
}

const COUNTRY_TAX_REGISTRY: Record<string, CountryTaxConfig> = {
  // ──────────────────────────────────────────────────────────
  // EU COUNTRIES (excluding DE, FR which have custom calculators)
  // ──────────────────────────────────────────────────────────
  NL: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 75518, rate: 0.3693 },
      { min: 75518, max: Infinity, rate: 0.495 },
    ],
    socialSecurityRate: 0.2765,
    socialSecurityCap: 38098,
    pensionRate: 0,
    personalAllowance: 0,
  },
  BE: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 15200, rate: 0.25 },
      { min: 15200, max: 26830, rate: 0.40 },
      { min: 26830, max: 46440, rate: 0.45 },
      { min: 46440, max: Infinity, rate: 0.50 },
    ],
    socialSecurityRate: 0.1307,
    pensionRate: 0,
    personalAllowance: 10160,
  },
  ES: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 12450, rate: 0.19 },
      { min: 12450, max: 20200, rate: 0.24 },
      { min: 20200, max: 35200, rate: 0.30 },
      { min: 35200, max: 60000, rate: 0.37 },
      { min: 60000, max: 300000, rate: 0.45 },
      { min: 300000, max: Infinity, rate: 0.47 },
    ],
    socialSecurityRate: 0.0635,
    socialSecurityCap: 56844,
    pensionRate: 0,
    personalAllowance: 5550,
  },
  IT: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 28000, rate: 0.23 },
      { min: 28000, max: 50000, rate: 0.25 },
      { min: 50000, max: 100000, rate: 0.35 },
      { min: 100000, max: Infinity, rate: 0.43 },
    ],
    socialSecurityRate: 0.0919,
    pensionRate: 0,
    personalAllowance: 8174,
  },
  PT: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 7703, rate: 0.145 },
      { min: 7703, max: 11623, rate: 0.21 },
      { min: 11623, max: 16472, rate: 0.265 },
      { min: 16472, max: 21321, rate: 0.285 },
      { min: 21321, max: 27146, rate: 0.35 },
      { min: 27146, max: 39791, rate: 0.37 },
      { min: 39791, max: 51997, rate: 0.435 },
      { min: 51997, max: 81199, rate: 0.45 },
      { min: 81199, max: Infinity, rate: 0.48 },
    ],
    socialSecurityRate: 0.11,
    pensionRate: 0,
    personalAllowance: 4104,
  },
  IE: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 42000, rate: 0.20 },
      { min: 42000, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0,
    personalAllowance: 1875,
    additionalTaxes: { usc: 0.045 },
  },
  AT: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 11693, rate: 0.00 },
      { min: 11693, max: 19134, rate: 0.20 },
      { min: 19134, max: 32075, rate: 0.30 },
      { min: 32075, max: 62080, rate: 0.41 },
      { min: 62080, max: 93120, rate: 0.48 },
      { min: 93120, max: 1000000, rate: 0.50 },
      { min: 1000000, max: Infinity, rate: 0.55 },
    ],
    socialSecurityRate: 0.1812,
    socialSecurityCap: 78540,
    pensionRate: 0,
    personalAllowance: 0,
  },
  PL: {
    currency: 'PLN',
    incomeTaxBrackets: [
      { min: 0, max: 120000, rate: 0.12 },
      { min: 120000, max: Infinity, rate: 0.32 },
    ],
    socialSecurityRate: 0.1371,
    pensionRate: 0.0976,
    pensionCap: 234720,
    medicareRate: 0.09,
    personalAllowance: 30000,
  },
  SE: {
    currency: 'SEK',
    incomeTaxBrackets: [
      { min: 0, max: 614000, rate: 0.30 },
      { min: 614000, max: Infinity, rate: 0.50 },
    ],
    socialSecurityRate: 0.0700,
    pensionRate: 0,
    personalAllowance: 57400,
  },
  DK: {
    currency: 'DKK',
    incomeTaxBrackets: [
      { min: 0, max: 588900, rate: 0.3726 },
      { min: 588900, max: Infinity, rate: 0.5226 },
    ],
    socialSecurityRate: 0.08,
    pensionRate: 0,
    personalAllowance: 48000,
  },
  FI: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 19900, rate: 0.1264 },
      { min: 19900, max: 29700, rate: 0.19 },
      { min: 29700, max: 49000, rate: 0.3025 },
      { min: 49000, max: 85800, rate: 0.34 },
      { min: 85800, max: Infinity, rate: 0.44 },
    ],
    socialSecurityRate: 0.0715,
    pensionRate: 0.0715,
    medicareRate: 0.0168,
    personalAllowance: 0,
  },
  GR: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 10000, rate: 0.09 },
      { min: 10000, max: 20000, rate: 0.22 },
      { min: 20000, max: 30000, rate: 0.28 },
      { min: 30000, max: 40000, rate: 0.36 },
      { min: 40000, max: Infinity, rate: 0.44 },
    ],
    socialSecurityRate: 0.1412,
    pensionRate: 0,
    personalAllowance: 0,
  },
  CZ: {
    currency: 'CZK',
    incomeTaxBrackets: [
      { min: 0, max: 1935552, rate: 0.15 },
      { min: 1935552, max: Infinity, rate: 0.23 },
    ],
    socialSecurityRate: 0.065,
    pensionRate: 0.065,
    medicareRate: 0.045,
    personalAllowance: 30840,
  },
  RO: {
    currency: 'RON',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.10 },
    ],
    socialSecurityRate: 0.25,
    pensionRate: 0,
    medicareRate: 0.10,
    personalAllowance: 0,
  },
  HU: {
    currency: 'HUF',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.15 },
    ],
    socialSecurityRate: 0.185,
    pensionRate: 0,
    personalAllowance: 0,
  },
  BG: {
    currency: 'BGN',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.10 },
    ],
    socialSecurityRate: 0.1258,
    pensionRate: 0.0498,
    medicareRate: 0.032,
    personalAllowance: 0,
  },
  HR: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 50400, rate: 0.20 },
      { min: 50400, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.165,
    pensionRate: 0.05,
    personalAllowance: 5400,
  },
  SK: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 41445, rate: 0.19 },
      { min: 41445, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.094,
    pensionRate: 0.04,
    medicareRate: 0.04,
    personalAllowance: 4922,
  },
  LU: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 11265, rate: 0.00 },
      { min: 11265, max: 13173, rate: 0.08 },
      { min: 13173, max: 15081, rate: 0.10 },
      { min: 15081, max: 16989, rate: 0.12 },
      { min: 16989, max: 18897, rate: 0.14 },
      { min: 18897, max: 20805, rate: 0.16 },
      { min: 20805, max: 22713, rate: 0.18 },
      { min: 22713, max: 24621, rate: 0.20 },
      { min: 24621, max: 26529, rate: 0.22 },
      { min: 26529, max: 28437, rate: 0.24 },
      { min: 28437, max: 30345, rate: 0.26 },
      { min: 30345, max: 32253, rate: 0.28 },
      { min: 32253, max: 34161, rate: 0.30 },
      { min: 34161, max: 36069, rate: 0.32 },
      { min: 36069, max: 37977, rate: 0.34 },
      { min: 37977, max: 39885, rate: 0.36 },
      { min: 39885, max: 41793, rate: 0.38 },
      { min: 41793, max: 100000, rate: 0.39 },
      { min: 100000, max: 150000, rate: 0.40 },
      { min: 150000, max: 200004, rate: 0.41 },
      { min: 200004, max: Infinity, rate: 0.42 },
    ],
    socialSecurityRate: 0.1265,
    pensionRate: 0.08,
    pensionCap: 132312,
    medicareRate: 0.028,
    personalAllowance: 0,
  },
  EE: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.20 },
    ],
    socialSecurityRate: 0.016,
    pensionRate: 0.02,
    personalAllowance: 7848,
  },
  LV: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 20004, rate: 0.20 },
      { min: 20004, max: 78100, rate: 0.23 },
      { min: 78100, max: Infinity, rate: 0.31 },
    ],
    socialSecurityRate: 0.105,
    pensionRate: 0,
    personalAllowance: 3000,
  },
  LT: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 101094, rate: 0.20 },
      { min: 101094, max: Infinity, rate: 0.32 },
    ],
    socialSecurityRate: 0.1252,
    pensionRate: 0.028,
    medicareRate: 0.0698,
    personalAllowance: 5400,
  },
  SI: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 8755, rate: 0.16 },
      { min: 8755, max: 25750, rate: 0.26 },
      { min: 25750, max: 51500, rate: 0.33 },
      { min: 51500, max: 74160, rate: 0.39 },
      { min: 74160, max: Infinity, rate: 0.50 },
    ],
    socialSecurityRate: 0.2206,
    pensionRate: 0,
    personalAllowance: 3500,
  },
  CY: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 19500, rate: 0.00 },
      { min: 19500, max: 28000, rate: 0.20 },
      { min: 28000, max: 36300, rate: 0.25 },
      { min: 36300, max: 60000, rate: 0.30 },
      { min: 60000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.088,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MT: {
    currency: 'EUR',
    incomeTaxBrackets: [
      { min: 0, max: 9100, rate: 0.00 },
      { min: 9100, max: 14500, rate: 0.15 },
      { min: 14500, max: 60000, rate: 0.25 },
      { min: 60000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.10,
    socialSecurityCap: 26446,
    pensionRate: 0,
    personalAllowance: 0,
  },

  // ──────────────────────────────────────────────────────────
  // AFRICAN COUNTRIES (54 countries)
  // ──────────────────────────────────────────────────────────
  NG: {
    currency: 'NGN',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.07 },
      { min: 300000, max: 600000, rate: 0.11 },
      { min: 600000, max: 1100000, rate: 0.15 },
      { min: 1100000, max: 1600000, rate: 0.19 },
      { min: 1600000, max: 3200000, rate: 0.21 },
      { min: 3200000, max: Infinity, rate: 0.24 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0.08,
    medicareRate: 0.05,
    personalAllowance: 200000,
  },
  GH: {
    currency: 'GHS',
    incomeTaxBrackets: [
      { min: 0, max: 4380, rate: 0.00 },
      { min: 4380, max: 5580, rate: 0.05 },
      { min: 5580, max: 6780, rate: 0.10 },
      { min: 6780, max: 42780, rate: 0.175 },
      { min: 42780, max: 282780, rate: 0.25 },
      { min: 282780, max: 582780, rate: 0.30 },
      { min: 582780, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.055,
    pensionRate: 0,
    personalAllowance: 0,
  },
  KE: {
    currency: 'KES',
    incomeTaxBrackets: [
      { min: 0, max: 288000, rate: 0.10 },
      { min: 288000, max: 388000, rate: 0.25 },
      { min: 388000, max: 6000000, rate: 0.30 },
      { min: 6000000, max: 9600000, rate: 0.325 },
      { min: 9600000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.06,
    socialSecurityCap: 216000,
    pensionRate: 0,
    medicareRate: 0.025,
    personalAllowance: 28800,
  },
  ZA: {
    currency: 'ZAR',
    incomeTaxBrackets: [
      { min: 0, max: 237100, rate: 0.18 },
      { min: 237100, max: 370500, rate: 0.26 },
      { min: 370500, max: 512800, rate: 0.31 },
      { min: 512800, max: 673000, rate: 0.36 },
      { min: 673000, max: 857900, rate: 0.39 },
      { min: 857900, max: 1817000, rate: 0.41 },
      { min: 1817000, max: Infinity, rate: 0.45 },
    ],
    socialSecurityRate: 0.01,
    socialSecurityCap: 212544,
    pensionRate: 0,
    personalAllowance: 95750,
    additionalTaxes: { uif: 0.01 },
  },
  EG: {
    currency: 'EGP',
    incomeTaxBrackets: [
      { min: 0, max: 40000, rate: 0.00 },
      { min: 40000, max: 55000, rate: 0.10 },
      { min: 55000, max: 70000, rate: 0.15 },
      { min: 70000, max: 200000, rate: 0.20 },
      { min: 200000, max: 400000, rate: 0.225 },
      { min: 400000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.14,
    socialSecurityCap: 112200,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MA: {
    currency: 'MAD',
    incomeTaxBrackets: [
      { min: 0, max: 30000, rate: 0.00 },
      { min: 30000, max: 50000, rate: 0.10 },
      { min: 50000, max: 60000, rate: 0.20 },
      { min: 60000, max: 80000, rate: 0.30 },
      { min: 80000, max: 180000, rate: 0.34 },
      { min: 180000, max: Infinity, rate: 0.38 },
    ],
    socialSecurityRate: 0.0448,
    socialSecurityCap: 72000,
    pensionRate: 0.0396,
    pensionCap: 72000,
    personalAllowance: 0,
  },
  TN: {
    currency: 'TND',
    incomeTaxBrackets: [
      { min: 0, max: 5000, rate: 0.00 },
      { min: 5000, max: 20000, rate: 0.15 },
      { min: 20000, max: 30000, rate: 0.25 },
      { min: 30000, max: 50000, rate: 0.30 },
      { min: 50000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.0918,
    pensionRate: 0,
    personalAllowance: 0,
  },
  SN: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 630000, rate: 0.00 },
      { min: 630000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: 4000000, rate: 0.30 },
      { min: 4000000, max: 8000000, rate: 0.40 },
      { min: 8000000, max: 13500000, rate: 0.43 },
      { min: 13500000, max: Infinity, rate: 0.50 },
    ],
    socialSecurityRate: 0.0836,
    pensionRate: 0.056,
    personalAllowance: 0,
  },
  CI: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.015 },
      { min: 300000, max: 547000, rate: 0.10 },
      { min: 547000, max: 979000, rate: 0.15 },
      { min: 979000, max: 1519000, rate: 0.20 },
      { min: 1519000, max: 2644000, rate: 0.25 },
      { min: 2644000, max: 4669000, rate: 0.30 },
      { min: 4669000, max: Infinity, rate: 0.36 },
    ],
    socialSecurityRate: 0.063,
    pensionRate: 0.032,
    personalAllowance: 0,
  },
  TZ: {
    currency: 'TZS',
    incomeTaxBrackets: [
      { min: 0, max: 3960000, rate: 0.00 },
      { min: 3960000, max: 5880000, rate: 0.08 },
      { min: 5880000, max: 8160000, rate: 0.20 },
      { min: 8160000, max: 10800000, rate: 0.25 },
      { min: 10800000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.10,
    pensionRate: 0.10,
    personalAllowance: 0,
  },
  ET: {
    currency: 'ETB',
    incomeTaxBrackets: [
      { min: 0, max: 7200, rate: 0.00 },
      { min: 7200, max: 19800, rate: 0.10 },
      { min: 19800, max: 38400, rate: 0.15 },
      { min: 38400, max: 63000, rate: 0.20 },
      { min: 63000, max: 93600, rate: 0.25 },
      { min: 93600, max: 130800, rate: 0.30 },
      { min: 130800, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.07,
    pensionRate: 0.07,
    personalAllowance: 0,
  },
  RW: {
    currency: 'RWF',
    incomeTaxBrackets: [
      { min: 0, max: 360000, rate: 0.00 },
      { min: 360000, max: 1200000, rate: 0.20 },
      { min: 1200000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.03,
    pensionRate: 0.03,
    medicareRate: 0.005,
    personalAllowance: 0,
  },
  UG: {
    currency: 'UGX',
    incomeTaxBrackets: [
      { min: 0, max: 2820000, rate: 0.00 },
      { min: 2820000, max: 4020000, rate: 0.10 },
      { min: 4020000, max: 4920000, rate: 0.20 },
      { min: 4920000, max: 120000000, rate: 0.30 },
      { min: 120000000, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  CM: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 2000000, rate: 0.10 },
      { min: 2000000, max: 3000000, rate: 0.15 },
      { min: 3000000, max: 5000000, rate: 0.25 },
      { min: 5000000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.042,
    pensionRate: 0.042,
    personalAllowance: 500000,
  },
  CD: {
    currency: 'CDF',
    incomeTaxBrackets: [
      { min: 0, max: 524160, rate: 0.00 },
      { min: 524160, max: 1572480, rate: 0.05 },
      { min: 1572480, max: 3144960, rate: 0.10 },
      { min: 3144960, max: 5241600, rate: 0.15 },
      { min: 5241600, max: 7862400, rate: 0.20 },
      { min: 7862400, max: 10483200, rate: 0.25 },
      { min: 10483200, max: 15724800, rate: 0.30 },
      { min: 15724800, max: 20966400, rate: 0.35 },
      { min: 20966400, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.035,
    personalAllowance: 0,
  },
  DZ: {
    currency: 'DZD',
    incomeTaxBrackets: [
      { min: 0, max: 240000, rate: 0.00 },
      { min: 240000, max: 480000, rate: 0.20 },
      { min: 480000, max: 960000, rate: 0.30 },
      { min: 960000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.09,
    pensionRate: 0,
    personalAllowance: 0,
  },
  AO: {
    currency: 'AOA',
    incomeTaxBrackets: [
      { min: 0, max: 100000, rate: 0.00 },
      { min: 100000, max: 150000, rate: 0.10 },
      { min: 150000, max: 200000, rate: 0.13 },
      { min: 200000, max: 300000, rate: 0.16 },
      { min: 300000, max: 500000, rate: 0.18 },
      { min: 500000, max: 1000000, rate: 0.19 },
      { min: 1000000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: 2000000, rate: 0.21 },
      { min: 2000000, max: 2500000, rate: 0.22 },
      { min: 2500000, max: 5000000, rate: 0.23 },
      { min: 5000000, max: 10000000, rate: 0.24 },
      { min: 10000000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.03,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MZ: {
    currency: 'MZN',
    incomeTaxBrackets: [
      { min: 0, max: 42000, rate: 0.10 },
      { min: 42000, max: 168000, rate: 0.15 },
      { min: 168000, max: 504000, rate: 0.20 },
      { min: 504000, max: 1512000, rate: 0.25 },
      { min: 1512000, max: Infinity, rate: 0.32 },
    ],
    socialSecurityRate: 0.03,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  ZM: {
    currency: 'ZMW',
    incomeTaxBrackets: [
      { min: 0, max: 57600, rate: 0.00 },
      { min: 57600, max: 81600, rate: 0.20 },
      { min: 81600, max: 105600, rate: 0.30 },
      { min: 105600, max: Infinity, rate: 0.375 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  ZW: {
    currency: 'ZWL',
    incomeTaxBrackets: [
      { min: 0, max: 3600000, rate: 0.00 },
      { min: 3600000, max: 12000000, rate: 0.20 },
      { min: 12000000, max: 24000000, rate: 0.25 },
      { min: 24000000, max: 36000000, rate: 0.30 },
      { min: 36000000, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.045,
    pensionRate: 0.045,
    personalAllowance: 0,
  },
  BW: {
    currency: 'BWP',
    incomeTaxBrackets: [
      { min: 0, max: 48000, rate: 0.00 },
      { min: 48000, max: 84000, rate: 0.05 },
      { min: 84000, max: 120000, rate: 0.125 },
      { min: 120000, max: 156000, rate: 0.1875 },
      { min: 156000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MU: {
    currency: 'MUR',
    incomeTaxBrackets: [
      { min: 0, max: 390000, rate: 0.00 },
      { min: 390000, max: 650000, rate: 0.10 },
      { min: 650000, max: Infinity, rate: 0.15 },
    ],
    socialSecurityRate: 0.03,
    pensionRate: 0.03,
    personalAllowance: 0,
  },
  NA: {
    currency: 'NAD',
    incomeTaxBrackets: [
      { min: 0, max: 50000, rate: 0.00 },
      { min: 50000, max: 100000, rate: 0.18 },
      { min: 100000, max: 300000, rate: 0.25 },
      { min: 300000, max: 500000, rate: 0.28 },
      { min: 500000, max: 800000, rate: 0.30 },
      { min: 800000, max: 1500000, rate: 0.32 },
      { min: 1500000, max: Infinity, rate: 0.37 },
    ],
    socialSecurityRate: 0.009,
    socialSecurityCap: 108000,
    pensionRate: 0,
    personalAllowance: 0,
  },
  // Remaining African countries with simplified brackets
  ML: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 330000, rate: 0.00 },
      { min: 330000, max: 630000, rate: 0.10 },
      { min: 630000, max: 1500000, rate: 0.18 },
      { min: 1500000, max: 3600000, rate: 0.26 },
      { min: 3600000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.036,
    pensionRate: 0.036,
    personalAllowance: 0,
  },
  BF: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 360000, rate: 0.00 },
      { min: 360000, max: 720000, rate: 0.12 },
      { min: 720000, max: 1440000, rate: 0.18 },
      { min: 1440000, max: 2880000, rate: 0.25 },
      { min: 2880000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.055,
    pensionRate: 0.055,
    personalAllowance: 0,
  },
  NE: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 600000, rate: 0.10 },
      { min: 600000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 2400000, rate: 0.25 },
      { min: 2400000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  TD: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 600000, rate: 0.10 },
      { min: 600000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 2400000, rate: 0.20 },
      { min: 2400000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.035,
    pensionRate: 0.035,
    personalAllowance: 0,
  },
  GN: {
    currency: 'GNF',
    incomeTaxBrackets: [
      { min: 0, max: 5000000, rate: 0.00 },
      { min: 5000000, max: 10000000, rate: 0.10 },
      { min: 10000000, max: 20000000, rate: 0.15 },
      { min: 20000000, max: 40000000, rate: 0.20 },
      { min: 40000000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  BJ: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 600000, rate: 0.10 },
      { min: 600000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 2400000, rate: 0.20 },
      { min: 2400000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.036,
    pensionRate: 0.036,
    personalAllowance: 0,
  },
  TG: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 900000, rate: 0.00 },
      { min: 900000, max: 2400000, rate: 0.07 },
      { min: 2400000, max: 4800000, rate: 0.15 },
      { min: 4800000, max: 7200000, rate: 0.25 },
      { min: 7200000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  SL: {
    currency: 'SLL',
    incomeTaxBrackets: [
      { min: 0, max: 6000000, rate: 0.00 },
      { min: 6000000, max: 12000000, rate: 0.15 },
      { min: 12000000, max: 24000000, rate: 0.20 },
      { min: 24000000, max: 36000000, rate: 0.25 },
      { min: 36000000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  LR: {
    currency: 'LRD',
    incomeTaxBrackets: [
      { min: 0, max: 70000, rate: 0.00 },
      { min: 70000, max: 200000, rate: 0.05 },
      { min: 200000, max: 500000, rate: 0.15 },
      { min: 500000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.035,
    pensionRate: 0.035,
    personalAllowance: 0,
  },
  CF: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 500000, rate: 0.00 },
      { min: 500000, max: 1000000, rate: 0.10 },
      { min: 1000000, max: 3000000, rate: 0.20 },
      { min: 3000000, max: 5000000, rate: 0.30 },
      { min: 5000000, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.03,
    pensionRate: 0.03,
    personalAllowance: 0,
  },
  CG: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 464000, rate: 0.01 },
      { min: 464000, max: 1000000, rate: 0.10 },
      { min: 1000000, max: 3000000, rate: 0.25 },
      { min: 3000000, max: 8000000, rate: 0.40 },
      { min: 8000000, max: Infinity, rate: 0.45 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  GA: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 1500000, rate: 0.00 },
      { min: 1500000, max: 1920000, rate: 0.05 },
      { min: 1920000, max: 2700000, rate: 0.10 },
      { min: 2700000, max: 3600000, rate: 0.15 },
      { min: 3600000, max: 5160000, rate: 0.20 },
      { min: 5160000, max: 7500000, rate: 0.25 },
      { min: 7500000, max: 11000000, rate: 0.30 },
      { min: 11000000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.025,
    pensionRate: 0.025,
    personalAllowance: 0,
  },
  GQ: {
    currency: 'XAF',
    incomeTaxBrackets: [
      { min: 0, max: 1000000, rate: 0.00 },
      { min: 1000000, max: 3000000, rate: 0.10 },
      { min: 3000000, max: 5000000, rate: 0.15 },
      { min: 5000000, max: 10000000, rate: 0.20 },
      { min: 10000000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.045,
    pensionRate: 0.045,
    personalAllowance: 0,
  },
  MR: {
    currency: 'MRU',
    incomeTaxBrackets: [
      { min: 0, max: 60000, rate: 0.00 },
      { min: 60000, max: 180000, rate: 0.15 },
      { min: 180000, max: 360000, rate: 0.25 },
      { min: 360000, max: 600000, rate: 0.30 },
      { min: 600000, max: Infinity, rate: 0.40 },
    ],
    socialSecurityRate: 0.01,
    pensionRate: 0.01,
    personalAllowance: 0,
  },
  DJ: {
    currency: 'DJF',
    incomeTaxBrackets: [
      { min: 0, max: 50000, rate: 0.00 },
      { min: 50000, max: 150000, rate: 0.02 },
      { min: 150000, max: 600000, rate: 0.15 },
      { min: 600000, max: 1200000, rate: 0.20 },
      { min: 1200000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  ER: {
    currency: 'ERN',
    incomeTaxBrackets: [
      { min: 0, max: 6000, rate: 0.00 },
      { min: 6000, max: 18000, rate: 0.10 },
      { min: 18000, max: 36000, rate: 0.15 },
      { min: 36000, max: 60000, rate: 0.20 },
      { min: 60000, max: 84000, rate: 0.25 },
      { min: 84000, max: 120000, rate: 0.30 },
      { min: 120000, max: Infinity, rate: 0.34 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0,
    personalAllowance: 0,
  },
  SO: {
    currency: 'SOS',
    incomeTaxBrackets: [
      { min: 0, max: 500000, rate: 0.00 },
      { min: 500000, max: 1500000, rate: 0.10 },
      { min: 1500000, max: 3000000, rate: 0.15 },
      { min: 3000000, max: 5000000, rate: 0.20 },
      { min: 5000000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0,
    personalAllowance: 0,
  },
  SS: {
    currency: 'SSP',
    incomeTaxBrackets: [
      { min: 0, max: 50000, rate: 0.00 },
      { min: 50000, max: 200000, rate: 0.10 },
      { min: 200000, max: 500000, rate: 0.15 },
      { min: 500000, max: Infinity, rate: 0.20 },
    ],
    socialSecurityRate: 0.08,
    pensionRate: 0,
    personalAllowance: 0,
  },
  SD: {
    currency: 'SDG',
    incomeTaxBrackets: [
      { min: 0, max: 50000, rate: 0.00 },
      { min: 50000, max: 100000, rate: 0.05 },
      { min: 100000, max: 200000, rate: 0.10 },
      { min: 200000, max: 400000, rate: 0.15 },
      { min: 400000, max: Infinity, rate: 0.20 },
    ],
    socialSecurityRate: 0.08,
    pensionRate: 0,
    personalAllowance: 0,
  },
  LY: {
    currency: 'LYD',
    incomeTaxBrackets: [
      { min: 0, max: 12000, rate: 0.00 },
      { min: 12000, max: 24000, rate: 0.05 },
      { min: 24000, max: 36000, rate: 0.10 },
      { min: 36000, max: 48000, rate: 0.15 },
      { min: 48000, max: Infinity, rate: 0.20 },
    ],
    socialSecurityRate: 0.0375,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MW: {
    currency: 'MWK',
    incomeTaxBrackets: [
      { min: 0, max: 1200000, rate: 0.00 },
      { min: 1200000, max: 3600000, rate: 0.25 },
      { min: 3600000, max: 12000000, rate: 0.30 },
      { min: 12000000, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  MG: {
    currency: 'MGA',
    incomeTaxBrackets: [
      { min: 0, max: 350000, rate: 0.00 },
      { min: 350000, max: 400000, rate: 0.05 },
      { min: 400000, max: 500000, rate: 0.10 },
      { min: 500000, max: 600000, rate: 0.15 },
      { min: 600000, max: Infinity, rate: 0.20 },
    ],
    socialSecurityRate: 0.01,
    pensionRate: 0.01,
    personalAllowance: 0,
  },
  SZ: {
    currency: 'SZL',
    incomeTaxBrackets: [
      { min: 0, max: 100000, rate: 0.00 },
      { min: 100000, max: 150000, rate: 0.20 },
      { min: 150000, max: 200000, rate: 0.25 },
      { min: 200000, max: 300000, rate: 0.30 },
      { min: 300000, max: Infinity, rate: 0.33 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0,
    personalAllowance: 0,
  },
  LS: {
    currency: 'LSL',
    incomeTaxBrackets: [
      { min: 0, max: 72000, rate: 0.00 },
      { min: 72000, max: 180000, rate: 0.20 },
      { min: 180000, max: 300000, rate: 0.25 },
      { min: 300000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0,
    personalAllowance: 0,
  },
  SC: {
    currency: 'SCR',
    incomeTaxBrackets: [
      { min: 0, max: 75600, rate: 0.00 },
      { min: 75600, max: 600000, rate: 0.15 },
      { min: 600000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.025,
    pensionRate: 0.025,
    personalAllowance: 0,
  },
  CV: {
    currency: 'CVE',
    incomeTaxBrackets: [
      { min: 0, max: 648000, rate: 0.00 },
      { min: 648000, max: 1128000, rate: 0.165 },
      { min: 1128000, max: 1728000, rate: 0.235 },
      { min: 1728000, max: Infinity, rate: 0.275 },
    ],
    socialSecurityRate: 0.08,
    pensionRate: 0,
    personalAllowance: 0,
  },
  ST: {
    currency: 'STN',
    incomeTaxBrackets: [
      { min: 0, max: 1500000, rate: 0.00 },
      { min: 1500000, max: 5000000, rate: 0.10 },
      { min: 5000000, max: 10000000, rate: 0.15 },
      { min: 10000000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.06,
    pensionRate: 0,
    personalAllowance: 0,
  },
  KM: {
    currency: 'KMF',
    incomeTaxBrackets: [
      { min: 0, max: 240000, rate: 0.00 },
      { min: 240000, max: 960000, rate: 0.10 },
      { min: 960000, max: 2400000, rate: 0.20 },
      { min: 2400000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.025,
    pensionRate: 0.025,
    personalAllowance: 0,
  },
  GM: {
    currency: 'GMD',
    incomeTaxBrackets: [
      { min: 0, max: 24000, rate: 0.00 },
      { min: 24000, max: 34000, rate: 0.05 },
      { min: 34000, max: 44000, rate: 0.10 },
      { min: 44000, max: 54000, rate: 0.15 },
      { min: 54000, max: 64000, rate: 0.20 },
      { min: 64000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  GW: {
    currency: 'XOF',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 750000, rate: 0.10 },
      { min: 750000, max: 1500000, rate: 0.15 },
      { min: 1500000, max: 3000000, rate: 0.20 },
      { min: 3000000, max: Infinity, rate: 0.25 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },
  BI: {
    currency: 'BIF',
    incomeTaxBrackets: [
      { min: 0, max: 150000, rate: 0.00 },
      { min: 150000, max: 600000, rate: 0.20 },
      { min: 600000, max: 1200000, rate: 0.25 },
      { min: 1200000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 0,
  },

  // ──────────────────────────────────────────────────────────
  // OTHER MAJOR MARKETS
  // ──────────────────────────────────────────────────────────
  JP: {
    currency: 'JPY',
    incomeTaxBrackets: [
      { min: 0, max: 1950000, rate: 0.05 },
      { min: 1950000, max: 3300000, rate: 0.10 },
      { min: 3300000, max: 6950000, rate: 0.20 },
      { min: 6950000, max: 9000000, rate: 0.23 },
      { min: 9000000, max: 18000000, rate: 0.33 },
      { min: 18000000, max: 40000000, rate: 0.40 },
      { min: 40000000, max: Infinity, rate: 0.45 },
    ],
    socialSecurityRate: 0.0915,
    pensionRate: 0.0915,
    medicareRate: 0.05,
    personalAllowance: 480000,
    additionalTaxes: { residentTax: 0.10 },
  },
  KR: {
    currency: 'KRW',
    incomeTaxBrackets: [
      { min: 0, max: 14000000, rate: 0.06 },
      { min: 14000000, max: 50000000, rate: 0.15 },
      { min: 50000000, max: 88000000, rate: 0.24 },
      { min: 88000000, max: 150000000, rate: 0.35 },
      { min: 150000000, max: 300000000, rate: 0.38 },
      { min: 300000000, max: 500000000, rate: 0.40 },
      { min: 500000000, max: 1000000000, rate: 0.42 },
      { min: 1000000000, max: Infinity, rate: 0.45 },
    ],
    socialSecurityRate: 0.045,
    pensionRate: 0.045,
    medicareRate: 0.03545,
    personalAllowance: 1500000,
    additionalTaxes: { localIncomeTax: 0.10 },
  },
  SG: {
    currency: 'SGD',
    incomeTaxBrackets: [
      { min: 0, max: 20000, rate: 0.00 },
      { min: 20000, max: 30000, rate: 0.02 },
      { min: 30000, max: 40000, rate: 0.035 },
      { min: 40000, max: 80000, rate: 0.07 },
      { min: 80000, max: 120000, rate: 0.115 },
      { min: 120000, max: 160000, rate: 0.15 },
      { min: 160000, max: 200000, rate: 0.18 },
      { min: 200000, max: 240000, rate: 0.19 },
      { min: 240000, max: 280000, rate: 0.195 },
      { min: 280000, max: 320000, rate: 0.20 },
      { min: 320000, max: Infinity, rate: 0.22 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.20,
    pensionCap: 102000,
    personalAllowance: 0,
  },
  HK: {
    currency: 'HKD',
    incomeTaxBrackets: [
      { min: 0, max: 50000, rate: 0.02 },
      { min: 50000, max: 100000, rate: 0.06 },
      { min: 100000, max: 150000, rate: 0.10 },
      { min: 150000, max: 200000, rate: 0.14 },
      { min: 200000, max: Infinity, rate: 0.17 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0.05,
    pensionCap: 360000,
    personalAllowance: 132000,
  },
  IN: {
    currency: 'INR',
    incomeTaxBrackets: [
      { min: 0, max: 300000, rate: 0.00 },
      { min: 300000, max: 700000, rate: 0.05 },
      { min: 700000, max: 1000000, rate: 0.10 },
      { min: 1000000, max: 1200000, rate: 0.15 },
      { min: 1200000, max: 1500000, rate: 0.20 },
      { min: 1500000, max: 2000000, rate: 0.25 },
      { min: 2000000, max: Infinity, rate: 0.30 },
    ],
    socialSecurityRate: 0.12,
    socialSecurityCap: 1800000,
    pensionRate: 0.12,
    pensionCap: 1800000,
    personalAllowance: 0,
    additionalTaxes: { surchargeApprox: 0.04 },
  },
  BR: {
    currency: 'BRL',
    incomeTaxBrackets: [
      { min: 0, max: 26963.52, rate: 0.00 },
      { min: 26963.52, max: 33919.80, rate: 0.075 },
      { min: 33919.80, max: 45012.60, rate: 0.15 },
      { min: 45012.60, max: 55976.16, rate: 0.225 },
      { min: 55976.16, max: Infinity, rate: 0.275 },
    ],
    socialSecurityRate: 0.09,
    socialSecurityCap: 88786.02,
    pensionRate: 0,
    personalAllowance: 0,
  },
  MX: {
    currency: 'MXN',
    incomeTaxBrackets: [
      { min: 0, max: 8952.49, rate: 0.0192 },
      { min: 8952.49, max: 75984.55, rate: 0.0640 },
      { min: 75984.55, max: 133536.07, rate: 0.1088 },
      { min: 133536.07, max: 155229.80, rate: 0.16 },
      { min: 155229.80, max: 185852.57, rate: 0.1792 },
      { min: 185852.57, max: 374837.88, rate: 0.2136 },
      { min: 374837.88, max: 590795.99, rate: 0.2352 },
      { min: 590795.99, max: 1127926.84, rate: 0.30 },
      { min: 1127926.84, max: 1503902.46, rate: 0.32 },
      { min: 1503902.46, max: 4511707.37, rate: 0.34 },
      { min: 4511707.37, max: Infinity, rate: 0.35 },
    ],
    socialSecurityRate: 0.025,
    pensionRate: 0.01125,
    personalAllowance: 0,
    additionalTaxes: { imss: 0.025 },
  },
  AE: {
    currency: 'AED',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.00 },
    ],
    socialSecurityRate: 0.05,
    pensionRate: 0.05,
    personalAllowance: 0,
  },
  SA: {
    currency: 'SAR',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.00 },
    ],
    socialSecurityRate: 0.10,
    pensionRate: 0,
    personalAllowance: 0,
  },
  IL: {
    currency: 'ILS',
    incomeTaxBrackets: [
      { min: 0, max: 84120, rate: 0.10 },
      { min: 84120, max: 120720, rate: 0.14 },
      { min: 120720, max: 193800, rate: 0.20 },
      { min: 193800, max: 269280, rate: 0.31 },
      { min: 269280, max: 560280, rate: 0.35 },
      { min: 560280, max: 721560, rate: 0.47 },
      { min: 721560, max: Infinity, rate: 0.50 },
    ],
    socialSecurityRate: 0.0350,
    socialSecurityCap: 721560,
    pensionRate: 0.06,
    medicareRate: 0.031,
    personalAllowance: 0,
  },
  NZ: {
    currency: 'NZD',
    incomeTaxBrackets: [
      { min: 0, max: 14000, rate: 0.105 },
      { min: 14000, max: 48000, rate: 0.175 },
      { min: 48000, max: 70000, rate: 0.30 },
      { min: 70000, max: 180000, rate: 0.33 },
      { min: 180000, max: Infinity, rate: 0.39 },
    ],
    socialSecurityRate: 0,
    pensionRate: 0.03,
    personalAllowance: 0,
    additionalTaxes: { acc: 0.0139 },
  },
  CH: {
    currency: 'CHF',
    incomeTaxBrackets: [
      { min: 0, max: 14500, rate: 0.00 },
      { min: 14500, max: 31600, rate: 0.0077 },
      { min: 31600, max: 41400, rate: 0.0088 },
      { min: 41400, max: 55200, rate: 0.0264 },
      { min: 55200, max: 72500, rate: 0.0297 },
      { min: 72500, max: 78100, rate: 0.0566 },
      { min: 78100, max: 103600, rate: 0.0604 },
      { min: 103600, max: 134600, rate: 0.0804 },
      { min: 134600, max: 176000, rate: 0.0896 },
      { min: 176000, max: 755200, rate: 0.1100 },
      { min: 755200, max: Infinity, rate: 0.1350 },
    ],
    socialSecurityRate: 0.05275,
    pensionRate: 0.0725,
    personalAllowance: 0,
    additionalTaxes: { cantonalTaxApprox: 0.15 },
  },
  NO: {
    currency: 'NOK',
    incomeTaxBrackets: [
      { min: 0, max: Infinity, rate: 0.22 },
    ],
    socialSecurityRate: 0.078,
    pensionRate: 0.02,
    personalAllowance: 79950,
    additionalTaxes: { bracketTaxStep1: 0.017, bracketTaxStep2: 0.04, bracketTaxStep3: 0.136, bracketTaxStep4: 0.166 },
  },
  IS: {
    currency: 'ISK',
    incomeTaxBrackets: [
      { min: 0, max: 4803372, rate: 0.3145 },
      { min: 4803372, max: 13495776, rate: 0.3795 },
      { min: 13495776, max: Infinity, rate: 0.4625 },
    ],
    socialSecurityRate: 0.04,
    pensionRate: 0.04,
    personalAllowance: 960708,
  },
}

// ============================================================
// TAX BRACKET DATA (Original 6 countries)
// ============================================================

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
  TX: [],
  FL: [],
  WA: [],
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

const UK_NI_BRACKETS: TaxBracket[] = [
  { min: 0, max: 12570, rate: 0.00 },
  { min: 12570, max: 50270, rate: 0.08 },
  { min: 50270, max: Infinity, rate: 0.02 },
]

const DE_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11604, rate: 0.00 },
  { min: 11604, max: 17005, rate: 0.14 },
  { min: 17005, max: 66760, rate: 0.2397 },
  { min: 66760, max: 277825, rate: 0.42 },
  { min: 277825, max: Infinity, rate: 0.45 },
]

const DE_SOLIDARITY_SURCHARGE_RATE = 0.055
const DE_SOLIDARITY_SURCHARGE_THRESHOLD = 18130

const DE_SOCIAL_INSURANCE = {
  healthInsurance: 0.073,
  nursingCare: 0.01525,
  pension: 0.093,
  unemployment: 0.013,
  assessmentCeilingWest: 90600,
  assessmentCeilingHealth: 62100,
}

const FR_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 11294, rate: 0.00 },
  { min: 11294, max: 28797, rate: 0.11 },
  { min: 28797, max: 82341, rate: 0.30 },
  { min: 82341, max: 177106, rate: 0.41 },
  { min: 177106, max: Infinity, rate: 0.45 },
]

const FR_SOCIAL_CONTRIBUTIONS = {
  csg: 0.098,
  healthInsurance: 0.0,
  pension: 0.0690,
  unemployment: 0.0,
  trancheACeiling: 46368,
}

const CA_FEDERAL_BRACKETS: TaxBracket[] = [
  { min: 0, max: 55867, rate: 0.15 },
  { min: 55867, max: 111733, rate: 0.205 },
  { min: 111733, max: 154906, rate: 0.26 },
  { min: 154906, max: 220000, rate: 0.29 },
  { min: 220000, max: Infinity, rate: 0.33 },
]

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

const CA_SOCIAL_INSURANCE = {
  cppRate: 0.0595,
  cppMaxPensionableEarnings: 68500,
  cppBasicExemption: 3500,
  eiRate: 0.0166,
  eiMaxInsurableEarnings: 63200,
}

const AU_INCOME_TAX_BRACKETS: TaxBracket[] = [
  { min: 0, max: 18200, rate: 0.00 },
  { min: 18200, max: 45000, rate: 0.16 },
  { min: 45000, max: 135000, rate: 0.30 },
  { min: 135000, max: 190000, rate: 0.37 },
  { min: 190000, max: Infinity, rate: 0.45 },
]

const AU_MEDICARE_LEVY_RATE = 0.02
const AU_SUPER_GUARANTEE_RATE = 0.115

const COUNTRY_CURRENCY_MAP: Record<string, CurrencyCode> = {
  US: 'USD',
  UK: 'GBP',
  DE: 'EUR',
  FR: 'EUR',
  CA: 'CAD',
  AU: 'AUD',
}

// ============================================================
// HELPER: PROGRESSIVE TAX CALCULATION
// ============================================================

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
// GENERIC TAX CALCULATOR (Registry-based)
// ============================================================

function calculateGenericTax(
  country: SupportedCountry,
  grossSalary: number,
  config: CountryTaxConfig,
  options: TaxCalculationOptions = {}
): TaxBreakdown {
  // 1. Personal allowance deduction
  const personalAllowance = config.personalAllowance ?? 0
  const additionalDeductions = options.additionalDeductions ?? 0
  const taxableIncome = Math.max(0, grossSalary - personalAllowance - additionalDeductions)

  // 2. Progressive income tax brackets
  const federalTax = applyBrackets(taxableIncome, config.incomeTaxBrackets)

  // 3. Social security (flat rate with optional cap) — DB override if available
  const ssRate = options.socialSecurityRateOverride ?? config.socialSecurityRate
  const ssBase = config.socialSecurityCap
    ? Math.min(grossSalary, config.socialSecurityCap)
    : grossSalary
  const socialSecurity = Math.round(ssBase * ssRate * 100) / 100

  // 4. Pension (flat rate with optional cap) — DB override if available
  const penRate = options.pensionRateOverride ?? config.pensionRate
  const pensionBase = config.pensionCap
    ? Math.min(grossSalary, config.pensionCap)
    : grossSalary
  const pension = Math.round(pensionBase * penRate * 100) / 100

  // 5. Medicare/health levy (flat rate) — DB override if available
  const medRate = options.medicareRateOverride ?? config.medicareRate
  const medicare = medRate
    ? Math.round(grossSalary * medRate * 100) / 100
    : 0

  // 6. Additional taxes (flat rates)
  const additionalTaxes: Record<string, number> = {}
  let additionalTaxTotal = 0
  if (config.additionalTaxes) {
    for (const [name, rate] of Object.entries(config.additionalTaxes)) {
      const amount = Math.round(grossSalary * rate * 100) / 100
      additionalTaxes[name] = amount
      additionalTaxTotal += amount
    }
  }

  const totalTax = Math.round(
    (federalTax + socialSecurity + pension + medicare + additionalTaxTotal) * 100
  ) / 100
  const netPay = Math.round((grossSalary - totalTax) * 100) / 100

  return {
    country,
    grossSalary,
    federalTax,
    stateOrProvincialTax: 0,
    socialSecurity,
    medicare,
    pension,
    additionalTaxes,
    totalTax,
    effectiveTaxRate: grossSalary > 0 ? Math.round((totalTax / grossSalary) * 10000) / 100 : 0,
    netPay,
    currency: config.currency,
  }
}

// ============================================================
// TAX CALCULATION ENGINE
// ============================================================

export function calculateTax(
  country: SupportedCountry,
  grossSalary: number,
  options: TaxCalculationOptions = {}
): TaxBreakdown {
  // Custom calculators for original 6 countries
  switch (country) {
    case 'US':
      return calculateUSTax(grossSalary, COUNTRY_CURRENCY_MAP.US, options)
    case 'UK':
      return calculateUKTax(grossSalary, COUNTRY_CURRENCY_MAP.UK, options)
    case 'DE':
      return calculateDETax(grossSalary, COUNTRY_CURRENCY_MAP.DE, options)
    case 'FR':
      return calculateFRTax(grossSalary, COUNTRY_CURRENCY_MAP.FR, options)
    case 'CA':
      return calculateCATax(grossSalary, COUNTRY_CURRENCY_MAP.CA, options)
    case 'AU':
      return calculateAUTax(grossSalary, COUNTRY_CURRENCY_MAP.AU, options)
  }

  // Registry-based generic calculator for all other countries
  const config = COUNTRY_TAX_REGISTRY[country]
  if (config) {
    return calculateGenericTax(country, grossSalary, config, options)
  }

  throw new Error(`Unsupported country: ${country}`)
}

// ============================================================
// COUNTRY-SPECIFIC CALCULATORS (Original 6)
// ============================================================

function calculateUSTax(
  grossSalary: number,
  currency: CurrencyCode,
  options: TaxCalculationOptions
): TaxBreakdown {
  const filingStatus = options.filingStatus || 'single'
  const brackets = US_FEDERAL_BRACKETS[filingStatus] || US_FEDERAL_BRACKETS.single

  const standardDeduction: Record<string, number> = {
    single: 14600,
    married_joint: 29200,
    married_separate: 14600,
    head_of_household: 21900,
  }
  const deduction = standardDeduction[filingStatus] || 14600
  const taxableIncome = Math.max(0, grossSalary - deduction - (options.additionalDeductions || 0))

  const federalTax = applyBrackets(taxableIncome, brackets)

  let stateOrProvincialTax = 0
  if (options.state && US_STATE_TAX_RATES[options.state]) {
    stateOrProvincialTax = applyBrackets(taxableIncome, US_STATE_TAX_RATES[options.state])
  }

  const ssWageBase = 168600
  const socialSecurity = Math.round(Math.min(grossSalary, ssWageBase) * 0.062 * 100) / 100

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
  let personalAllowance = 12570
  if (grossSalary > 100000) {
    personalAllowance = Math.max(0, personalAllowance - Math.floor((grossSalary - 100000) / 2))
  }

  const adjustedBrackets: TaxBracket[] = [
    { min: 0, max: personalAllowance, rate: 0.00 },
    { min: personalAllowance, max: 50270, rate: 0.20 },
    { min: 50270, max: 125140, rate: 0.40 },
    { min: 125140, max: Infinity, rate: 0.45 },
  ]

  const federalTax = applyBrackets(grossSalary, adjustedBrackets)
  const socialSecurity = applyBrackets(grossSalary, UK_NI_BRACKETS)

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
  const federalTax = applyBrackets(grossSalary, DE_INCOME_TAX_BRACKETS)

  let solidaritySurcharge = 0
  if (federalTax > DE_SOLIDARITY_SURCHARGE_THRESHOLD) {
    solidaritySurcharge = Math.round(federalTax * DE_SOLIDARITY_SURCHARGE_RATE * 100) / 100
  }

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
  const csgBase = grossSalary * 0.9825
  const csgCrds = Math.round(csgBase * FR_SOCIAL_CONTRIBUTIONS.csg * 100) / 100

  const deductibleCsg = grossSalary * 0.9825 * 0.068
  const taxableIncome = Math.max(0, grossSalary - deductibleCsg)

  const federalTax = applyBrackets(taxableIncome, FR_INCOME_TAX_BRACKETS)

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
  const basicPersonalAmount = 15705
  const taxableIncome = Math.max(0, grossSalary - basicPersonalAmount)

  const federalTax = applyBrackets(taxableIncome, CA_FEDERAL_BRACKETS)

  let stateOrProvincialTax = 0
  const province = options.province || 'ON'
  if (CA_PROVINCIAL_TAX_RATES[province]) {
    stateOrProvincialTax = applyBrackets(taxableIncome, CA_PROVINCIAL_TAX_RATES[province])
  }

  const cppPensionableEarnings = Math.min(grossSalary, CA_SOCIAL_INSURANCE.cppMaxPensionableEarnings)
  const cppContribution = Math.round(
    Math.max(0, cppPensionableEarnings - CA_SOCIAL_INSURANCE.cppBasicExemption) *
    CA_SOCIAL_INSURANCE.cppRate * 100
  ) / 100

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
  const federalTax = applyBrackets(grossSalary, AU_INCOME_TAX_BRACKETS)

  let medicare = 0
  const medicareLowThreshold = 24276
  const medicareShadeInThreshold = 30345
  if (grossSalary > medicareShadeInThreshold) {
    medicare = Math.round(grossSalary * AU_MEDICARE_LEVY_RATE * 100) / 100
  } else if (grossSalary > medicareLowThreshold) {
    medicare = Math.round((grossSalary - medicareLowThreshold) * 0.10 * 100) / 100
  }

  const superannuation = Math.round(grossSalary * AU_SUPER_GUARANTEE_RATE * 100) / 100

  const additionalTaxes: Record<string, number> = {
    superannuationGuarantee: superannuation,
  }

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
