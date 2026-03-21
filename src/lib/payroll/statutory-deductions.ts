/**
 * Statutory Deductions Engine
 *
 * Calculates mandatory employer and employee contributions for
 * pension, health insurance, and social insurance across 53 African countries.
 * This complements the income tax calculations in tax-calculator.ts.
 *
 * When orgId is provided, rates are loaded from the tax_configs DB table
 * with hardcoded STATUTORY_REGISTRY as fallback.
 */

import { getStatutoryDeductionOverrides } from './tax-config-cache'

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

// Full registry of statutory deductions for all 53 African countries
const STATUTORY_REGISTRY: Record<string, StatutoryDeduction[]> = {
  // ─── Nigeria ─────────────────────────────────────────────
  // Rates effective from: January 2024 | Source: FIRS (Federal Inland Revenue Service) / PenCom / NHF | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: GRA (Ghana Revenue Authority) / SSNIT | Last verified: March 2024
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
      employeeRate: 0.025,
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
  // Rates effective from: January 2024 | Source: KRA (Kenya Revenue Authority) / NSSF / NHIF | Last verified: March 2024
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
  // Rates effective from: March 2024 | Source: SARS (South African Revenue Service) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNPS (Caisse Nationale de Prévoyance Sociale, Côte d'Ivoire) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CSS / IPRES (Senegal) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNPS (Caisse Nationale de Prévoyance Sociale, Cameroon) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NSSF / NHIF (Tanzania) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NSSF (Uganda) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: RSSB (Rwanda Social Security Board) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, DRC) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Republic of Congo) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS / CNAMGS (Gabon) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Togo) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Benin) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Burkina Faso) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Niger) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INPS (Institut National de Prévoyance Sociale, Mali) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INSS (Instituto Nacional de Segurança Social, Guinea-Bissau) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNPS (Caisse Nationale de Prévoyance Sociale, Chad) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, CAR) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INSESO (Instituto Nacional de Seguridad Social, Equatorial Guinea) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INSS (Instituto Nacional de Segurança Social, Mozambique) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NAPSA / NHIMA (Zambia) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NSSA (National Social Security Authority, Zimbabwe) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NASSIT (National Social Security and Insurance Trust, Sierra Leone) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Guinea) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: SDF (Social Development Fund, Gambia) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: NASSCORP (National Social Security Corporation, Liberia) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INPS (Instituto Nacional de Previdência Social, Cape Verde) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: CNSS (Caisse Nationale de Sécurité Sociale, Mauritania) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INSS (Instituto Nacional de Segurança Social, São Tomé) | Last verified: March 2024
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
  // Rates effective from: January 2024 | Source: INSS (Institut National de Sécurité Sociale, Burundi) | Last verified: March 2024
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

  // ─── Ethiopia ──────────────────────────────────────────
  // Rates effective from: January 2024 | Source: POESSA (Private Organizations Employees Social Security Agency, Ethiopia) | Last verified: March 2024
  ET: [
    {
      name: 'Pension (Private Organizations)',
      type: 'pension',
      employeeRate: 0.07,
      employerRate: 0.11,
      currency: 'ETB',
      mandatory: true,
    },
  ],

  // ─── South Sudan ──────────────────────────────────────
  // Rates effective from: January 2024 | Source: Ministry of Labour (South Sudan) | Last verified: March 2024
  SS: [
    {
      name: 'Social Insurance Fund',
      type: 'social_insurance',
      employeeRate: 0.04,
      employerRate: 0.08,
      currency: 'SSP',
      mandatory: true,
    },
  ],

  // ─── Malawi ────────────────────────────────────────────
  // Rates effective from: January 2024 | Source: Ministry of Labour (Malawi) | Last verified: March 2024
  MW: [
    {
      name: 'Pension Fund',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.10,
      currency: 'MWK',
      mandatory: true,
    },
  ],

  // ─── Algeria ──────────────────────────────────────────
  // Source: Caisse Nationale des Assurances Sociales (CNAS)
  DZ: [
    {
      name: 'CNAS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.09,
      employerRate: 0.26,
      currency: 'DZD',
      mandatory: true,
    },
    {
      name: 'Retirement Pension',
      type: 'pension',
      employeeRate: 0.0675,
      employerRate: 0.115,
      currency: 'DZD',
      mandatory: true,
    },
    {
      name: 'Unemployment Insurance',
      type: 'social_insurance',
      employeeRate: 0.015,
      employerRate: 0.015,
      currency: 'DZD',
      mandatory: true,
    },
  ],

  // ─── Angola ───────────────────────────────────────────
  // Source: Instituto Nacional de Segurança Social (INSS)
  AO: [
    {
      name: 'INSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.03,
      employerRate: 0.08,
      currency: 'AOA',
      mandatory: true,
    },
  ],

  // ─── Botswana ─────────────────────────────────────────
  // Source: Botswana Unified Revenue Service / Motor Vehicle Accident Fund
  // Botswana has no mandatory social security; pension is typically employer-arranged
  BW: [
    {
      name: 'Pension Fund', // Estimated - verify with local authority
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.05,
      currency: 'BWP',
      mandatory: false,
    },
    {
      name: 'Motor Vehicle Accident Fund',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.0005,
      currency: 'BWP',
      mandatory: true,
    },
  ],

  // ─── Comoros ───────────────────────────────────────────
  // Source: Caisse de Retraite des Comores / Estimated - verify with local authority
  KM: [
    {
      name: 'Pension Fund',
      type: 'pension',
      employeeRate: 0.02,
      employerRate: 0.06,
      currency: 'KMF',
      mandatory: true,
    },
    {
      name: 'Social Security', // Estimated - verify with local authority
      type: 'social_insurance',
      employeeRate: 0.01,
      employerRate: 0.04,
      currency: 'KMF',
      mandatory: true,
    },
  ],

  // ─── Djibouti ─────────────────────────────────────────
  // Source: Caisse Nationale de Sécurité Sociale (CNSS) / Organisme de Protection Sociale (OPS)
  DJ: [
    {
      name: 'CNSS (Pension)',
      type: 'pension',
      employeeRate: 0.04,
      employerRate: 0.04,
      currency: 'DJF',
      mandatory: true,
    },
    {
      name: 'OPS (Health)',
      type: 'health',
      employeeRate: 0.02,
      employerRate: 0.04,
      currency: 'DJF',
      mandatory: true,
    },
    {
      name: 'Family Allowances',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.055,
      currency: 'DJF',
      mandatory: true,
    },
  ],

  // ─── Eritrea ──────────────────────────────────────────
  // Estimated - verify with local authority
  // Eritrea has limited formal social security infrastructure
  ER: [
    {
      name: 'Social Security', // Estimated - verify with local authority
      type: 'social_insurance',
      employeeRate: 0.03,
      employerRate: 0.06,
      currency: 'ERN',
      mandatory: true,
    },
  ],

  // ─── Eswatini (Swaziland) ─────────────────────────────
  // Source: Eswatini National Provident Fund (ENPF)
  SZ: [
    {
      name: 'ENPF (Provident Fund)',
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.05,
      currency: 'SZL',
      mandatory: true,
    },
    {
      name: 'Grading Levy', // Estimated - verify with local authority
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'SZL',
      mandatory: true,
    },
  ],

  // ─── Lesotho ──────────────────────────────────────────
  // Source: Lesotho National General Insurance Fund / Labour Code Order 1992
  // Lesotho does not have a comprehensive mandatory social security scheme
  LS: [
    {
      name: 'Pension Fund', // Estimated - verify with local authority
      type: 'pension',
      employeeRate: 0.05,
      employerRate: 0.05,
      currency: 'LSL',
      mandatory: false,
    },
    {
      name: 'Workers Compensation', // Estimated - verify with local authority
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.015,
      currency: 'LSL',
      mandatory: true,
    },
  ],

  // ─── Libya ────────────────────────────────────────────
  // Source: Social Security Fund of Libya
  LY: [
    {
      name: 'Social Security Fund',
      type: 'social_insurance',
      employeeRate: 0.0375,
      employerRate: 0.1125,
      currency: 'LYD',
      mandatory: true,
    },
  ],

  // ─── Madagascar ───────────────────────────────────────
  // Source: Caisse Nationale de Prévoyance Sociale (CNaPS)
  MG: [
    {
      name: 'CNaPS (Pension)',
      type: 'pension',
      employeeRate: 0.01,
      employerRate: 0.13,
      cap: 8 * 180000 * 12, // 8x minimum wage annually
      currency: 'MGA',
      mandatory: true,
    },
    {
      name: 'OSTIE (Health)',
      type: 'health',
      employeeRate: 0.01,
      employerRate: 0.05,
      currency: 'MGA',
      mandatory: true,
    },
  ],

  // ─── Mauritius ────────────────────────────────────────
  // Source: Mauritius Revenue Authority / National Pensions Act
  MU: [
    {
      name: 'CSG (Contribution Sociale Généralisée)',
      type: 'pension',
      employeeRate: 0.015,
      employerRate: 0.03,
      currency: 'MUR',
      mandatory: true,
    },
    {
      name: 'NSF (National Savings Fund)',
      type: 'social_insurance',
      employeeRate: 0.025,
      employerRate: 0.025,
      currency: 'MUR',
      mandatory: true,
    },
    {
      name: 'Training Levy (HRDC)',
      type: 'training_levy',
      employeeRate: 0,
      employerRate: 0.015,
      currency: 'MUR',
      mandatory: true,
    },
  ],

  // ─── Namibia ──────────────────────────────────────────
  // Source: Social Security Commission (SSC) of Namibia
  NA: [
    {
      name: 'SSC (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.009,
      employerRate: 0.009,
      cap: 108000, // annual cap NAD 9,000/month
      currency: 'NAD',
      mandatory: true,
    },
    {
      name: 'Workers Compensation (ECC)',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.01,
      currency: 'NAD',
      mandatory: true,
    },
  ],

  // ─── Seychelles ───────────────────────────────────────
  // Source: Seychelles Pension Fund (SPF)
  SC: [
    {
      name: 'SPF (Pension Fund)',
      type: 'pension',
      employeeRate: 0.02,
      employerRate: 0.02,
      currency: 'SCR',
      mandatory: true,
    },
    {
      name: 'SIF (Social Insurance)',
      type: 'social_insurance',
      employeeRate: 0,
      employerRate: 0.025,
      currency: 'SCR',
      mandatory: true,
    },
  ],

  // ─── Somalia ──────────────────────────────────────────
  // Estimated - verify with local authority
  // Somalia has very limited formal social security infrastructure
  SO: [
    {
      name: 'Social Security', // Estimated - verify with local authority
      type: 'social_insurance',
      employeeRate: 0.04,
      employerRate: 0.06,
      currency: 'SOS',
      mandatory: true,
    },
  ],

  // ─── Sudan ────────────────────────────────────────────
  // Source: National Social Insurance Fund (NSIF)
  SD: [
    {
      name: 'NSIF (Social Insurance)',
      type: 'social_insurance',
      employeeRate: 0.08,
      employerRate: 0.17,
      currency: 'SDG',
      mandatory: true,
    },
    {
      name: 'National Health Insurance',
      type: 'health',
      employeeRate: 0.04,
      employerRate: 0.06,
      currency: 'SDG',
      mandatory: true,
    },
  ],

  // ─── Tunisia ──────────────────────────────────────────
  // Source: Caisse Nationale de Sécurité Sociale (CNSS)
  TN: [
    {
      name: 'CNSS (Social Security)',
      type: 'social_insurance',
      employeeRate: 0.0918,
      employerRate: 0.1657,
      currency: 'TND',
      mandatory: true,
    },
    {
      name: 'CNAM (Health Insurance)',
      type: 'health',
      employeeRate: 0.0632,
      employerRate: 0.0532,
      currency: 'TND',
      mandatory: true,
    },
  ],

  // ─── Western Sahara ───────────────────────────────────
  // Administered under Moroccan law (CNSS/CIMR)
  // Estimated - verify with local authority
  EH: [
    {
      name: 'CNSS (Social Security)', // Moroccan CNSS rates applied - verify with local authority
      type: 'social_insurance',
      employeeRate: 0.0448,
      employerRate: 0.0898,
      currency: 'MAD',
      mandatory: true,
    },
    {
      name: 'AMO (Health Insurance)', // Moroccan AMO rates applied - verify with local authority
      type: 'health',
      employeeRate: 0.0226,
      employerRate: 0.0452,
      currency: 'MAD',
      mandatory: true,
    },
  ],
}

/**
 * Calculate all statutory deductions for an employee in a given country.
 *
 * When orgId is provided, rates are loaded from the tax_configs DB table
 * (matched by deduction type and position within type). If no DB configs
 * exist for the country, hardcoded STATUTORY_REGISTRY rates are used as fallback.
 *
 * @param country - ISO 3166-1 alpha-2 country code
 * @param annualGrossSalary - Annual gross salary in local currency
 * @param options - Optional overrides
 * @returns Detailed breakdown of all statutory deductions
 */
export async function calculateStatutoryDeductions(
  country: string,
  annualGrossSalary: number,
  options?: {
    includeOptional?: boolean // include non-mandatory deductions (default true)
    employerOnly?: boolean // only calculate employer side
    orgId?: string // if provided, use DB-backed rates with hardcoded fallback
  }
): Promise<StatutoryResult> {
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

  // Fetch DB rate overrides if orgId is provided
  let dbOverrides: Map<string, { employeeRate: number; employerRate: number }> | null = null
  if (options?.orgId) {
    dbOverrides = await getStatutoryDeductionOverrides(options.orgId, country)
  }

  // Build a type-counter to match hardcoded entries to DB entries by (type, position)
  const typeCounter = new Map<string, number>()

  const includeOptional = options?.includeOptional !== false
  const filtered = deductions.filter((d) => d.mandatory || includeOptional)

  const results = filtered.map((deduction) => {
    // Track position within type for DB matching
    const typeIdx = typeCounter.get(deduction.type) || 0
    typeCounter.set(deduction.type, typeIdx + 1)

    // Use DB rate if available, otherwise use hardcoded rate
    let employeeRate = deduction.employeeRate
    let employerRate = deduction.employerRate
    if (dbOverrides) {
      const overrideKey = `${deduction.type}:${typeIdx}`
      const override = dbOverrides.get(overrideKey)
      if (override) {
        employeeRate = override.employeeRate
        employerRate = override.employerRate
      }
    }

    const applicableSalary = deduction.cap
      ? Math.min(annualGrossSalary, deduction.cap)
      : annualGrossSalary

    let employeeAmount: number
    let employerAmount: number

    if (deduction.fixedAmount !== undefined) {
      // Fixed amount per period (e.g., Kenya NITA levy)
      employeeAmount = employeeRate > 0 ? deduction.fixedAmount : 0
      employerAmount = employerRate > 0 ? deduction.fixedAmount : 0
    } else {
      employeeAmount = options?.employerOnly
        ? 0
        : Math.round(applicableSalary * employeeRate * 100) / 100
      employerAmount =
        Math.round(applicableSalary * employerRate * 100) / 100
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
export async function calculateTotalEmployerCost(
  country: string,
  annualGrossSalary: number,
  orgId?: string
): Promise<{
  grossSalary: number
  employerContributions: number
  totalCost: number
  costMultiplier: number // e.g., 1.22 means employer pays 22% above gross
}> {
  const result = await calculateStatutoryDeductions(country, annualGrossSalary, { orgId })
  const totalCost = annualGrossSalary + result.totalEmployerContributions
  return {
    grossSalary: annualGrossSalary,
    employerContributions: result.totalEmployerContributions,
    totalCost: Math.round(totalCost * 100) / 100,
    costMultiplier:
      Math.round((totalCost / annualGrossSalary) * 1000) / 1000,
  }
}
