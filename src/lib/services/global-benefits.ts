/**
 * Global Benefits Service
 *
 * Manages country-specific mandatory and supplementary benefits,
 * statutory requirement tracking, cost comparison, enrollment,
 * compliance reporting, market benchmarking, and total compensation estimation.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export interface CountryBenefitRequirement {
  country: string
  countryCode: string
  mandatoryBenefits: MandatoryBenefit[]
  supplementaryBenefits: SupplementaryBenefit[]
  statutoryRequirements: StatutoryRequirement[]
  taxImplications: TaxImplication
  lastReviewed: string
}

export interface MandatoryBenefit {
  name: string
  category: BenefitCategory
  description: string
  employerCostPercent: number
  employeeCostPercent: number
  basis: 'gross_salary' | 'fixed' | 'capped'
  cap?: number
  capCurrency?: string
  effectiveDate?: string
  governingLaw: string
}

export interface SupplementaryBenefit {
  name: string
  category: BenefitCategory
  description: string
  marketPrevalence: number // percentage of employers offering
  typicalEmployerCost: number // monthly in USD
  typicalCoverage: string
  isRecommended: boolean
  competitiveAdvantage: 'essential' | 'competitive' | 'premium'
}

export interface StatutoryRequirement {
  name: string
  description: string
  authority: string
  deadlineType: 'recurring' | 'event_driven'
  frequency?: string
  penaltyForNonCompliance: string
  documentationRequired: string[]
}

export interface TaxImplication {
  benefitsTaxable: boolean
  employerDeductible: boolean
  thresholds: Array<{ benefit: string; threshold: number; currency: string; description: string }>
  specialRules: string[]
}

export type BenefitCategory =
  | 'health' | 'retirement' | 'life_insurance' | 'disability'
  | 'wellness' | 'meal_allowance' | 'transportation' | 'housing'
  | 'education' | 'childcare' | 'statutory'

export interface CreateGlobalPlanInput {
  name: string
  category: BenefitCategory
  country: string
  countryCode: string
  provider?: string
  description?: string
  isStatutory?: boolean
  statutoryReference?: string
  costEmployee?: number
  costEmployer?: number
  currency: string
  coverageDetails?: Record<string, unknown>
  eligibilityCriteria?: EligibilityCriteria
  effectiveDate?: string
}

export interface UpdateGlobalPlanInput {
  name?: string
  provider?: string
  description?: string
  costEmployee?: number
  costEmployer?: number
  coverageDetails?: Record<string, unknown>
  eligibilityCriteria?: EligibilityCriteria
  isActive?: boolean
}

export interface EligibilityCriteria {
  minTenureMonths?: number
  employmentTypes?: string[]
  roles?: string[]
  departments?: string[]
  minAge?: number
  maxAge?: number
}

export interface EnrollEmployeeInput {
  planId: string
  employeeId: string
  country: string
  coverageLevel?: 'employee_only' | 'employee_spouse' | 'employee_children' | 'family'
  dependentCount?: number
  employeeContribution?: number
  employerContribution?: number
  currency: string
  enrolledAt: string
}

export interface BenefitComparison {
  countries: string[]
  categories: BenefitCategory[]
  comparison: Array<{
    category: BenefitCategory
    items: Array<{
      country: string
      benefits: string[]
      employerCostPercent: number
      mandatoryCount: number
      supplementaryCount: number
    }>
  }>
  costSummary: Array<{
    country: string
    totalMandatoryCostPercent: number
    estimatedMonthlyPerEmployee: number
    currency: string
  }>
}

export interface ComplianceReport {
  orgId: string
  generatedAt: string
  countries: Array<{
    country: string
    countryCode: string
    totalEmployees: number
    mandatoryBenefitsOffered: number
    mandatoryBenefitsRequired: number
    complianceRate: number
    issues: string[]
    recommendations: string[]
  }>
  overallComplianceRate: number
  urgentActions: string[]
}

export interface MarketBenchmark {
  country: string
  category: BenefitCategory
  marketMedian: number
  percentile25: number
  percentile75: number
  yourCost: number
  yourPercentile: number
  recommendation: string
}

export interface TotalCompensation {
  employeeId: string
  country: string
  baseSalary: number
  currency: string
  mandatoryBenefits: Array<{ name: string; employerCost: number; employeeCost: number }>
  supplementaryBenefits: Array<{ name: string; employerCost: number; employeeCost: number }>
  totalEmployerCost: number
  totalEmployeeDeductions: number
  totalCompensationValue: number
  breakdown: {
    baseSalaryPercent: number
    mandatoryBenefitsPercent: number
    supplementaryBenefitsPercent: number
  }
}

// ============================================================
// Country Benefits Database
// ============================================================

const COUNTRY_BENEFITS: Record<string, CountryBenefitRequirement> = {
  US: {
    country: 'United States',
    countryCode: 'US',
    mandatoryBenefits: [
      { name: 'Social Security (FICA)', category: 'retirement', description: 'Federal retirement and disability insurance', employerCostPercent: 6.2, employeeCostPercent: 6.2, basis: 'capped', cap: 168600, capCurrency: 'USD', governingLaw: 'Federal Insurance Contributions Act' },
      { name: 'Medicare', category: 'health', description: 'Federal health insurance for elderly', employerCostPercent: 1.45, employeeCostPercent: 1.45, basis: 'gross_salary', governingLaw: 'Federal Insurance Contributions Act' },
      { name: 'Federal Unemployment (FUTA)', category: 'statutory', description: 'Federal unemployment insurance', employerCostPercent: 0.6, employeeCostPercent: 0, basis: 'capped', cap: 7000, capCurrency: 'USD', governingLaw: 'Federal Unemployment Tax Act' },
      { name: 'State Unemployment (SUTA)', category: 'statutory', description: 'State unemployment insurance (varies by state)', employerCostPercent: 2.7, employeeCostPercent: 0, basis: 'capped', cap: 40000, capCurrency: 'USD', governingLaw: 'State Unemployment Laws' },
      { name: 'Workers Compensation', category: 'disability', description: 'Work injury insurance', employerCostPercent: 1.0, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'State Workers Compensation Laws' },
    ],
    supplementaryBenefits: [
      { name: 'Health Insurance', category: 'health', description: 'Employer-sponsored medical coverage', marketPrevalence: 92, typicalEmployerCost: 450, typicalCoverage: 'PPO or HMO plan with deductible', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Dental Insurance', category: 'health', description: 'Dental care coverage', marketPrevalence: 88, typicalEmployerCost: 35, typicalCoverage: 'Preventive and restorative dental care', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Vision Insurance', category: 'health', description: 'Vision care coverage', marketPrevalence: 75, typicalEmployerCost: 12, typicalCoverage: 'Annual eye exam and corrective lenses', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: '401(k) Plan', category: 'retirement', description: 'Tax-advantaged retirement savings with employer match', marketPrevalence: 85, typicalEmployerCost: 250, typicalCoverage: '3-6% salary match', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Life Insurance', category: 'life_insurance', description: 'Basic life and AD&D insurance', marketPrevalence: 80, typicalEmployerCost: 15, typicalCoverage: '1-2x annual salary', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Wellness Program', category: 'wellness', description: 'Gym membership, mental health, EAP', marketPrevalence: 65, typicalEmployerCost: 50, typicalCoverage: 'Gym stipend, counseling sessions', isRecommended: false, competitiveAdvantage: 'premium' },
    ],
    statutoryRequirements: [
      { name: 'ACA Reporting', description: 'Affordable Care Act employer reporting for 50+ employees', authority: 'IRS', deadlineType: 'recurring', frequency: 'Annual (Forms 1094-C, 1095-C by March 2)', penaltyForNonCompliance: '$310 per return for late filing', documentationRequired: ['Form 1094-C', 'Form 1095-C'] },
      { name: 'COBRA Administration', description: 'Continuing health coverage for terminated employees', authority: 'DOL', deadlineType: 'event_driven', penaltyForNonCompliance: '$110/day per affected individual', documentationRequired: ['COBRA election notices', 'Premium payment records'] },
    ],
    taxImplications: {
      benefitsTaxable: false,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Health Insurance', threshold: 0, currency: 'USD', description: 'Employer contributions are tax-free to employees' },
        { benefit: 'Group Term Life', threshold: 50000, currency: 'USD', description: 'Coverage over $50,000 is taxable income to employee' },
      ],
      specialRules: ['Section 125 cafeteria plans allow pre-tax deductions', 'HSA contributions are tax-deductible up to annual limits'],
    },
    lastReviewed: '2025-01-15',
  },
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    mandatoryBenefits: [
      { name: 'Employer National Insurance', category: 'statutory', description: 'National Insurance contributions', employerCostPercent: 13.8, employeeCostPercent: 12, basis: 'gross_salary', governingLaw: 'National Insurance Contributions Act 2014' },
      { name: 'Auto-Enrollment Pension', category: 'retirement', description: 'Workplace pension scheme', employerCostPercent: 3.0, employeeCostPercent: 5.0, basis: 'gross_salary', governingLaw: 'Pensions Act 2008' },
      { name: 'Statutory Sick Pay', category: 'health', description: 'Paid sick leave (up to 28 weeks)', employerCostPercent: 0.5, employeeCostPercent: 0, basis: 'fixed', governingLaw: 'Social Security Contributions and Benefits Act 1992' },
      { name: 'Statutory Maternity Pay', category: 'statutory', description: '39 weeks maternity pay', employerCostPercent: 1.0, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Employment Rights Act 1996' },
    ],
    supplementaryBenefits: [
      { name: 'Private Medical Insurance', category: 'health', description: 'Private health coverage', marketPrevalence: 55, typicalEmployerCost: 120, typicalCoverage: 'Outpatient and inpatient private care', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Income Protection', category: 'disability', description: 'Long-term disability insurance', marketPrevalence: 45, typicalEmployerCost: 40, typicalCoverage: '60-75% salary replacement', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Enhanced Pension', category: 'retirement', description: 'Above-statutory pension contribution', marketPrevalence: 60, typicalEmployerCost: 200, typicalCoverage: '5-10% employer match', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Cycle to Work Scheme', category: 'wellness', description: 'Tax-efficient bicycle purchase', marketPrevalence: 70, typicalEmployerCost: 5, typicalCoverage: 'Salary sacrifice for bicycle and equipment', isRecommended: true, competitiveAdvantage: 'competitive' },
    ],
    statutoryRequirements: [
      { name: 'Pension Auto-Enrollment', description: 'All eligible workers must be enrolled in workplace pension', authority: 'The Pensions Regulator', deadlineType: 'event_driven', penaltyForNonCompliance: 'Fixed penalty from £400, escalating daily penalties', documentationRequired: ['Declaration of compliance', 'Enrollment records'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Private Medical Insurance', threshold: 0, currency: 'GBP', description: 'PMI is a Benefit in Kind, taxable on employee' },
      ],
      specialRules: ['P11D reporting required for benefits in kind', 'Salary sacrifice arrangements may be tax-efficient for certain benefits'],
    },
    lastReviewed: '2025-01-15',
  },
  DE: {
    country: 'Germany',
    countryCode: 'DE',
    mandatoryBenefits: [
      { name: 'Health Insurance (Krankenversicherung)', category: 'health', description: 'Statutory health insurance', employerCostPercent: 7.3, employeeCostPercent: 7.3, basis: 'capped', cap: 62100, capCurrency: 'EUR', governingLaw: 'Social Code Book V' },
      { name: 'Pension Insurance (Rentenversicherung)', category: 'retirement', description: 'Statutory pension', employerCostPercent: 9.3, employeeCostPercent: 9.3, basis: 'capped', cap: 90600, capCurrency: 'EUR', governingLaw: 'Social Code Book VI' },
      { name: 'Unemployment Insurance (Arbeitslosenversicherung)', category: 'statutory', description: 'Unemployment insurance', employerCostPercent: 1.3, employeeCostPercent: 1.3, basis: 'capped', cap: 90600, capCurrency: 'EUR', governingLaw: 'Social Code Book III' },
      { name: 'Long-term Care Insurance (Pflegeversicherung)', category: 'health', description: 'Long-term care insurance', employerCostPercent: 1.7, employeeCostPercent: 1.7, basis: 'capped', cap: 62100, capCurrency: 'EUR', governingLaw: 'Social Code Book XI' },
      { name: 'Accident Insurance (Unfallversicherung)', category: 'disability', description: 'Work accident insurance', employerCostPercent: 1.3, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Social Code Book VII' },
    ],
    supplementaryBenefits: [
      { name: 'Company Pension (bAV)', category: 'retirement', description: 'Employer-funded pension beyond statutory', marketPrevalence: 65, typicalEmployerCost: 200, typicalCoverage: 'Direct insurance or pension fund', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Supplementary Health Insurance', category: 'health', description: 'Dental, vision, and alternative medicine', marketPrevalence: 40, typicalEmployerCost: 50, typicalCoverage: 'Private room, dental prosthetics', isRecommended: false, competitiveAdvantage: 'competitive' },
      { name: 'Meal Vouchers', category: 'meal_allowance', description: 'Tax-advantaged meal allowances', marketPrevalence: 55, typicalEmployerCost: 100, typicalCoverage: 'Daily meal subsidy', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Public Transport Ticket', category: 'transportation', description: 'Jobticket for public transportation', marketPrevalence: 60, typicalEmployerCost: 50, typicalCoverage: 'Monthly transit pass', isRecommended: true, competitiveAdvantage: 'competitive' },
    ],
    statutoryRequirements: [
      { name: 'Social Insurance Reporting', description: 'Monthly reporting of social insurance contributions', authority: 'Deutsche Rentenversicherung', deadlineType: 'recurring', frequency: 'Monthly by the 5th of following month', penaltyForNonCompliance: 'Late payment surcharges and penalties', documentationRequired: ['Social insurance notifications', 'Contribution statements'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Company Pension (bAV)', threshold: 7248, currency: 'EUR', description: 'Up to 8% of contribution ceiling tax-free via salary sacrifice' },
        { benefit: 'Meal Vouchers', threshold: 6.90, currency: 'EUR', description: 'Daily tax-free limit per meal' },
      ],
      specialRules: ['Salary sacrifice (Entgeltumwandlung) has employer co-funding obligation', 'Sachbezug up to EUR 50/month tax-free'],
    },
    lastReviewed: '2025-01-15',
  },
  FR: {
    country: 'France',
    countryCode: 'FR',
    mandatoryBenefits: [
      { name: 'Social Security (Securite Sociale)', category: 'statutory', description: 'Comprehensive social security', employerCostPercent: 30, employeeCostPercent: 11, basis: 'gross_salary', governingLaw: 'Code de la Securite Sociale' },
      { name: 'Complementary Health (Mutuelle)', category: 'health', description: 'Mandatory complementary health insurance', employerCostPercent: 1.5, employeeCostPercent: 1.5, basis: 'fixed', governingLaw: 'ANI Agreement 2013' },
      { name: 'Prevoyance', category: 'life_insurance', description: 'Death and disability insurance', employerCostPercent: 1.5, employeeCostPercent: 0.5, basis: 'gross_salary', governingLaw: 'Collective Bargaining Agreements' },
      { name: 'Transport Allowance', category: 'transportation', description: '50% of public transport costs', employerCostPercent: 0.5, employeeCostPercent: 0, basis: 'fixed', governingLaw: 'Labour Code Article L3261-2' },
      { name: 'Profit Sharing (Participation)', category: 'statutory', description: 'Mandatory for 50+ employees', employerCostPercent: 3.0, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Labour Code' },
    ],
    supplementaryBenefits: [
      { name: 'Meal Vouchers (Titres-Restaurant)', category: 'meal_allowance', description: 'Tax-advantaged daily meal allowance', marketPrevalence: 85, typicalEmployerCost: 150, typicalCoverage: 'Up to EUR 13.00 per day (employer share 50-60%)', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Enhanced Retirement', category: 'retirement', description: 'Supplementary pension beyond statutory', marketPrevalence: 50, typicalEmployerCost: 200, typicalCoverage: 'PERCO or PER company retirement plan', isRecommended: false, competitiveAdvantage: 'competitive' },
      { name: 'Cesu (Childcare Vouchers)', category: 'childcare', description: 'Tax-free childcare support', marketPrevalence: 30, typicalEmployerCost: 100, typicalCoverage: 'Subsidized childcare services', isRecommended: false, competitiveAdvantage: 'premium' },
    ],
    statutoryRequirements: [
      { name: 'DSN (Social Declaration)', description: 'Unified monthly social declaration', authority: 'URSSAF', deadlineType: 'recurring', frequency: 'Monthly by the 5th or 15th', penaltyForNonCompliance: '1.5% penalty per month of delay', documentationRequired: ['DSN filing', 'Payslip records'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Meal Vouchers', threshold: 7.18, currency: 'EUR', description: 'Maximum employer contribution exempt from tax' },
      ],
      specialRules: ['CSG/CRDS applies to most employer contributions', 'Forfait social (20%) on profit sharing'],
    },
    lastReviewed: '2025-01-15',
  },
  JP: {
    country: 'Japan',
    countryCode: 'JP',
    mandatoryBenefits: [
      { name: 'Health Insurance (Kenko Hoken)', category: 'health', description: 'Statutory health insurance', employerCostPercent: 5.0, employeeCostPercent: 5.0, basis: 'capped', cap: 13900000, capCurrency: 'JPY', governingLaw: 'Health Insurance Act' },
      { name: 'Welfare Pension (Kosei Nenkin)', category: 'retirement', description: 'National pension', employerCostPercent: 9.15, employeeCostPercent: 9.15, basis: 'capped', cap: 6500000, capCurrency: 'JPY', governingLaw: 'Employees Pension Insurance Act' },
      { name: 'Employment Insurance (Koyo Hoken)', category: 'statutory', description: 'Unemployment insurance', employerCostPercent: 0.95, employeeCostPercent: 0.6, basis: 'gross_salary', governingLaw: 'Employment Insurance Act' },
      { name: 'Workers Compensation (Rosai Hoken)', category: 'disability', description: 'Work injury insurance', employerCostPercent: 0.3, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Workers Accident Compensation Insurance Act' },
      { name: 'Long-term Care Insurance', category: 'health', description: 'For employees 40+', employerCostPercent: 0.9, employeeCostPercent: 0.9, basis: 'gross_salary', governingLaw: 'Long-Term Care Insurance Act' },
    ],
    supplementaryBenefits: [
      { name: 'Transportation Allowance', category: 'transportation', description: 'Commuting cost reimbursement', marketPrevalence: 98, typicalEmployerCost: 200, typicalCoverage: 'Full commuting cost up to JPY 150,000/month', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Housing Allowance', category: 'housing', description: 'Rent subsidy or company housing', marketPrevalence: 55, typicalEmployerCost: 500, typicalCoverage: 'Monthly housing allowance', isRecommended: false, competitiveAdvantage: 'competitive' },
      { name: 'Company Pension (DB/DC)', category: 'retirement', description: 'Employer-sponsored pension', marketPrevalence: 45, typicalEmployerCost: 300, typicalCoverage: 'Defined benefit or defined contribution plan', isRecommended: true, competitiveAdvantage: 'competitive' },
    ],
    statutoryRequirements: [
      { name: 'Social Insurance Monthly Report', description: 'Monthly social insurance premium reporting', authority: 'Japan Pension Service', deadlineType: 'recurring', frequency: 'Monthly by end of month', penaltyForNonCompliance: 'Surcharge of 14.6% on unpaid premiums', documentationRequired: ['Monthly remuneration reports', 'Insurance enrollment records'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Transportation Allowance', threshold: 150000, currency: 'JPY', description: 'Monthly commuting allowance tax-free up to JPY 150,000' },
      ],
      specialRules: ['Year-end tax adjustment (Nenmatsu Chosei) reconciles withholding', 'Housing allowance is generally taxable income'],
    },
    lastReviewed: '2025-01-15',
  },
  AU: {
    country: 'Australia',
    countryCode: 'AU',
    mandatoryBenefits: [
      { name: 'Superannuation', category: 'retirement', description: 'Mandatory employer pension contribution', employerCostPercent: 11.5, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Superannuation Guarantee Act 1992' },
      { name: 'Workers Compensation', category: 'disability', description: 'State-based work injury insurance', employerCostPercent: 1.5, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'State Workers Compensation Acts' },
      { name: 'Long Service Leave', category: 'statutory', description: 'Leave accrual for long-serving employees', employerCostPercent: 1.7, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Long Service Leave Acts (State-based)' },
    ],
    supplementaryBenefits: [
      { name: 'Private Health Insurance', category: 'health', description: 'Private hospital and extras cover', marketPrevalence: 50, typicalEmployerCost: 200, typicalCoverage: 'Hospital and extras coverage', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Income Protection', category: 'disability', description: 'Salary continuance insurance', marketPrevalence: 40, typicalEmployerCost: 50, typicalCoverage: '75% salary for up to 2 years', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Additional Super', category: 'retirement', description: 'Above-SG superannuation', marketPrevalence: 30, typicalEmployerCost: 200, typicalCoverage: 'Additional 2-5% contribution', isRecommended: false, competitiveAdvantage: 'premium' },
      { name: 'Novated Lease', category: 'transportation', description: 'Tax-efficient vehicle leasing', marketPrevalence: 45, typicalEmployerCost: 0, typicalCoverage: 'Salary sacrifice car lease', isRecommended: true, competitiveAdvantage: 'competitive' },
    ],
    statutoryRequirements: [
      { name: 'SG Compliance', description: 'Quarterly superannuation guarantee payments', authority: 'ATO', deadlineType: 'recurring', frequency: 'Quarterly by 28th of following month', penaltyForNonCompliance: 'SG Charge = unpaid amount + interest + admin fee (non-deductible)', documentationRequired: ['SuperStream reporting', 'Payment evidence'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Superannuation', threshold: 30000, currency: 'AUD', description: 'Concessional contribution cap per year' },
        { benefit: 'FBT Exempt Items', threshold: 300, currency: 'AUD', description: 'Minor benefits exemption per occasion' },
      ],
      specialRules: ['Fringe Benefits Tax (FBT) at 47% on most non-cash benefits', 'Salary sacrifice arrangements reduce income tax but may attract FBT'],
    },
    lastReviewed: '2025-01-15',
  },
  SG: {
    country: 'Singapore',
    countryCode: 'SG',
    mandatoryBenefits: [
      { name: 'CPF - Ordinary Account', category: 'retirement', description: 'Housing, insurance, education', employerCostPercent: 10.0, employeeCostPercent: 12.0, basis: 'capped', cap: 102000, capCurrency: 'SGD', governingLaw: 'Central Provident Fund Act' },
      { name: 'CPF - Special Account', category: 'retirement', description: 'Retirement savings', employerCostPercent: 4.0, employeeCostPercent: 6.0, basis: 'capped', cap: 102000, capCurrency: 'SGD', governingLaw: 'Central Provident Fund Act' },
      { name: 'CPF - Medisave', category: 'health', description: 'Medical savings', employerCostPercent: 3.0, employeeCostPercent: 2.0, basis: 'capped', cap: 102000, capCurrency: 'SGD', governingLaw: 'Central Provident Fund Act' },
      { name: 'Skills Development Levy', category: 'statutory', description: 'Workforce training fund', employerCostPercent: 0.25, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Skills Development Levy Act' },
    ],
    supplementaryBenefits: [
      { name: 'Group Health Insurance', category: 'health', description: 'Hospitalization and surgical', marketPrevalence: 85, typicalEmployerCost: 100, typicalCoverage: 'Inpatient and outpatient coverage', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Dental Benefits', category: 'health', description: 'Dental care coverage', marketPrevalence: 60, typicalEmployerCost: 20, typicalCoverage: 'Annual dental allowance', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Annual Wage Supplement', category: 'statutory', description: '13th month bonus', marketPrevalence: 75, typicalEmployerCost: 400, typicalCoverage: 'One month bonus salary', isRecommended: true, competitiveAdvantage: 'essential' },
    ],
    statutoryRequirements: [
      { name: 'CPF Monthly Contribution', description: 'Monthly CPF contributions for citizens and PRs', authority: 'CPF Board', deadlineType: 'recurring', frequency: 'Monthly by 14th of following month', penaltyForNonCompliance: '1.5% monthly interest on late payment', documentationRequired: ['CPF submission form', 'Payment records'] },
    ],
    taxImplications: {
      benefitsTaxable: false,
      employerDeductible: true,
      thresholds: [
        { benefit: 'CPF', threshold: 102000, currency: 'SGD', description: 'Annual ordinary wage ceiling' },
      ],
      specialRules: ['No personal income tax on CPF contributions', 'Benefits generally not taxable if provided on a group basis'],
    },
    lastReviewed: '2025-01-15',
  },
  IN: {
    country: 'India',
    countryCode: 'IN',
    mandatoryBenefits: [
      { name: 'Employee Provident Fund (EPF)', category: 'retirement', description: 'Retirement savings scheme', employerCostPercent: 12.0, employeeCostPercent: 12.0, basis: 'capped', cap: 180000, capCurrency: 'INR', governingLaw: 'Employees Provident Funds Act 1952' },
      { name: 'Employee State Insurance (ESI)', category: 'health', description: 'Medical and disability benefits', employerCostPercent: 3.25, employeeCostPercent: 0.75, basis: 'capped', cap: 252000, capCurrency: 'INR', governingLaw: 'ESI Act 1948' },
      { name: 'Gratuity', category: 'retirement', description: 'End-of-service benefit (5+ years)', employerCostPercent: 4.17, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Payment of Gratuity Act 1972' },
      { name: 'Professional Tax', category: 'statutory', description: 'State-level professional tax', employerCostPercent: 0, employeeCostPercent: 0.2, basis: 'capped', cap: 2500, capCurrency: 'INR', governingLaw: 'State Professional Tax Acts' },
    ],
    supplementaryBenefits: [
      { name: 'Group Health Insurance', category: 'health', description: 'Comprehensive family medical coverage', marketPrevalence: 90, typicalEmployerCost: 30, typicalCoverage: 'INR 3-5 lakh family floater', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Meal Coupons', category: 'meal_allowance', description: 'Tax-efficient meal allowance', marketPrevalence: 70, typicalEmployerCost: 40, typicalCoverage: 'Up to INR 2,200/month tax-free', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'NPS (National Pension)', category: 'retirement', description: 'Additional pension contribution', marketPrevalence: 35, typicalEmployerCost: 50, typicalCoverage: 'Up to 10% of salary employer contribution', isRecommended: false, competitiveAdvantage: 'competitive' },
    ],
    statutoryRequirements: [
      { name: 'PF Monthly Remittance', description: 'Monthly PF contribution filing', authority: 'EPFO', deadlineType: 'recurring', frequency: 'Monthly by 15th of following month', penaltyForNonCompliance: '12% interest + damages up to 100% of contribution', documentationRequired: ['ECR (Electronic Challan cum Return)', 'Monthly contribution statements'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'EPF', threshold: 250000, currency: 'INR', description: 'Employee contribution exempt up to INR 2.5 lakh per year' },
        { benefit: 'NPS', threshold: 750000, currency: 'INR', description: 'Employer contribution up to 10% of salary deductible (14% for government)' },
      ],
      specialRules: ['HRA exemption available for rented accommodation', 'Standard deduction of INR 50,000 from salary income'],
    },
    lastReviewed: '2025-01-15',
  },
  BR: {
    country: 'Brazil',
    countryCode: 'BR',
    mandatoryBenefits: [
      { name: 'INSS (Social Security)', category: 'retirement', description: 'Social security contributions', employerCostPercent: 20.0, employeeCostPercent: 14.0, basis: 'gross_salary', governingLaw: 'Federal Constitution / Social Security Law' },
      { name: 'FGTS', category: 'statutory', description: 'Severance indemnity fund', employerCostPercent: 8.0, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'FGTS Law (Lei 8.036/90)' },
      { name: '13th Salary', category: 'statutory', description: 'Mandatory 13th month salary', employerCostPercent: 8.33, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'Federal Law 4.090/1962' },
      { name: 'Vacation Pay (1/3 bonus)', category: 'statutory', description: 'Vacation pay includes 1/3 bonus', employerCostPercent: 2.78, employeeCostPercent: 0, basis: 'gross_salary', governingLaw: 'CLT Article 142-145' },
      { name: 'Transportation Voucher', category: 'transportation', description: 'Commuting subsidy', employerCostPercent: 2.0, employeeCostPercent: 6.0, basis: 'fixed', governingLaw: 'Federal Law 7.418/1985' },
      { name: 'Meal Voucher', category: 'meal_allowance', description: 'Worker food program', employerCostPercent: 3.0, employeeCostPercent: 0, basis: 'fixed', governingLaw: 'Worker Food Program (PAT)' },
    ],
    supplementaryBenefits: [
      { name: 'Private Health Plan', category: 'health', description: 'Group medical and dental plan', marketPrevalence: 75, typicalEmployerCost: 150, typicalCoverage: 'Comprehensive medical with dental', isRecommended: true, competitiveAdvantage: 'essential' },
      { name: 'Life Insurance', category: 'life_insurance', description: 'Group life and disability', marketPrevalence: 60, typicalEmployerCost: 20, typicalCoverage: '12-24x monthly salary', isRecommended: true, competitiveAdvantage: 'competitive' },
      { name: 'Private Pension (PGBL/VGBL)', category: 'retirement', description: 'Supplementary private pension', marketPrevalence: 35, typicalEmployerCost: 100, typicalCoverage: 'Matching contribution up to 5%', isRecommended: false, competitiveAdvantage: 'premium' },
    ],
    statutoryRequirements: [
      { name: 'eSocial Monthly', description: 'Unified digital social obligations platform', authority: 'Federal Government', deadlineType: 'recurring', frequency: 'Monthly by 7th of following month', penaltyForNonCompliance: 'Fines ranging from R$ 200 to R$ 180,000+', documentationRequired: ['eSocial events', 'FGTS GRRF', 'DIRF'] },
    ],
    taxImplications: {
      benefitsTaxable: true,
      employerDeductible: true,
      thresholds: [
        { benefit: 'Meal Voucher', threshold: 0, currency: 'BRL', description: 'PAT-enrolled companies get income tax deduction' },
      ],
      specialRules: ['FGTS is not deducted from employee salary - 100% employer cost', 'Transportation voucher capped at 6% of employee salary deduction'],
    },
    lastReviewed: '2025-01-15',
  },
}

// ============================================================
// Market Benchmark Data (simplified)
// ============================================================

const MARKET_BENCHMARKS: Record<string, Record<BenefitCategory, { median: number; p25: number; p75: number }>> = {
  US: { health: { median: 500, p25: 350, p75: 700 }, retirement: { median: 280, p25: 150, p75: 450 }, life_insurance: { median: 15, p25: 10, p75: 25 }, disability: { median: 30, p25: 15, p75: 50 }, wellness: { median: 50, p25: 25, p75: 100 }, meal_allowance: { median: 0, p25: 0, p75: 0 }, transportation: { median: 30, p25: 0, p75: 100 }, housing: { median: 0, p25: 0, p75: 0 }, education: { median: 200, p25: 0, p75: 500 }, childcare: { median: 0, p25: 0, p75: 100 }, statutory: { median: 0, p25: 0, p75: 0 } },
  GB: { health: { median: 120, p25: 80, p75: 200 }, retirement: { median: 200, p25: 100, p75: 350 }, life_insurance: { median: 15, p25: 8, p75: 25 }, disability: { median: 40, p25: 20, p75: 60 }, wellness: { median: 30, p25: 15, p75: 50 }, meal_allowance: { median: 0, p25: 0, p75: 0 }, transportation: { median: 50, p25: 30, p75: 100 }, housing: { median: 0, p25: 0, p75: 0 }, education: { median: 150, p25: 50, p75: 300 }, childcare: { median: 50, p25: 0, p75: 150 }, statutory: { median: 0, p25: 0, p75: 0 } },
  DE: { health: { median: 50, p25: 25, p75: 100 }, retirement: { median: 200, p25: 100, p75: 350 }, life_insurance: { median: 10, p25: 5, p75: 20 }, disability: { median: 0, p25: 0, p75: 0 }, wellness: { median: 25, p25: 10, p75: 50 }, meal_allowance: { median: 100, p25: 60, p75: 150 }, transportation: { median: 50, p25: 30, p75: 80 }, housing: { median: 0, p25: 0, p75: 0 }, education: { median: 100, p25: 50, p75: 200 }, childcare: { median: 50, p25: 0, p75: 100 }, statutory: { median: 0, p25: 0, p75: 0 } },
}

// ============================================================
// Service Functions
// ============================================================

export function getCountryBenefitRequirements(countryCode: string): CountryBenefitRequirement {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) {
    throw new Error(`Country "${countryCode}" not found. Available: ${Object.keys(COUNTRY_BENEFITS).join(', ')}`)
  }
  return data
}

export async function createGlobalPlan(orgId: string, input: CreateGlobalPlanInput) {
  const [plan] = await db
    .insert(schema.globalBenefitPlans)
    .values({
      orgId,
      name: input.name,
      category: input.category,
      country: input.country,
      countryCode: input.countryCode,
      provider: input.provider || null,
      description: input.description || null,
      isStatutory: input.isStatutory || false,
      statutoryReference: input.statutoryReference || null,
      costEmployee: input.costEmployee || 0,
      costEmployer: input.costEmployer || 0,
      currency: input.currency,
      coverageDetails: input.coverageDetails || null,
      eligibilityCriteria: input.eligibilityCriteria || null,
      isActive: true,
      effectiveDate: input.effectiveDate || null,
    })
    .returning()

  return plan
}

export async function updateGlobalPlan(orgId: string, planId: string, input: UpdateGlobalPlanInput) {
  const [existing] = await db
    .select()
    .from(schema.globalBenefitPlans)
    .where(and(eq(schema.globalBenefitPlans.id, planId), eq(schema.globalBenefitPlans.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`Plan "${planId}" not found`)

  const updateData: Record<string, unknown> = {}
  if (input.name !== undefined) updateData.name = input.name
  if (input.provider !== undefined) updateData.provider = input.provider
  if (input.description !== undefined) updateData.description = input.description
  if (input.costEmployee !== undefined) updateData.costEmployee = input.costEmployee
  if (input.costEmployer !== undefined) updateData.costEmployer = input.costEmployer
  if (input.coverageDetails !== undefined) updateData.coverageDetails = input.coverageDetails
  if (input.eligibilityCriteria !== undefined) updateData.eligibilityCriteria = input.eligibilityCriteria
  if (input.isActive !== undefined) updateData.isActive = input.isActive

  const [updated] = await db
    .update(schema.globalBenefitPlans)
    .set(updateData)
    .where(eq(schema.globalBenefitPlans.id, planId))
    .returning()

  return updated
}

export async function enrollEmployee(orgId: string, input: EnrollEmployeeInput) {
  // Verify plan exists
  const [plan] = await db
    .select()
    .from(schema.globalBenefitPlans)
    .where(and(eq(schema.globalBenefitPlans.id, input.planId), eq(schema.globalBenefitPlans.orgId, orgId)))
    .limit(1)

  if (!plan) throw new Error(`Plan "${input.planId}" not found`)
  if (!plan.isActive) throw new Error('Cannot enroll in inactive plan')

  // Check eligibility
  const criteria = plan.eligibilityCriteria as EligibilityCriteria | null
  if (criteria) {
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, input.employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) throw new Error(`Employee "${input.employeeId}" not found`)

    if (criteria.minTenureMonths && employee.hireDate) {
      const hireDate = new Date(employee.hireDate)
      const monthsSinceHire = (Date.now() - hireDate.getTime()) / (1000 * 60 * 60 * 24 * 30)
      if (monthsSinceHire < criteria.minTenureMonths) {
        throw new Error(`Employee does not meet minimum tenure requirement of ${criteria.minTenureMonths} months`)
      }
    }

    if (criteria.roles && criteria.roles.length > 0 && !criteria.roles.includes(employee.role)) {
      throw new Error(`Employee role "${employee.role}" is not eligible for this plan`)
    }
  }

  // Check for existing enrollment
  const existing = await db
    .select()
    .from(schema.globalBenefitEnrollments)
    .where(and(
      eq(schema.globalBenefitEnrollments.planId, input.planId),
      eq(schema.globalBenefitEnrollments.employeeId, input.employeeId),
      eq(schema.globalBenefitEnrollments.orgId, orgId),
    ))
    .limit(1)

  if (existing.length > 0 && !existing[0].terminatedAt) {
    throw new Error('Employee is already enrolled in this plan')
  }

  // Calculate contributions based on coverage level
  const coverageMultiplier = input.coverageLevel === 'family' ? 2.5
    : input.coverageLevel === 'employee_spouse' ? 1.8
    : input.coverageLevel === 'employee_children' ? 2.0
    : 1.0

  const employeeContribution = input.employeeContribution || Math.round((plan.costEmployee || 0) * coverageMultiplier)
  const employerContribution = input.employerContribution || Math.round((plan.costEmployer || 0) * coverageMultiplier)

  const [enrollment] = await db
    .insert(schema.globalBenefitEnrollments)
    .values({
      orgId,
      planId: input.planId,
      employeeId: input.employeeId,
      country: input.country,
      coverageLevel: input.coverageLevel || 'employee_only',
      dependentCount: input.dependentCount || 0,
      employeeContribution,
      employerContribution,
      currency: input.currency,
      enrolledAt: input.enrolledAt,
    })
    .returning()

  return enrollment
}

export async function getCountryConfig(orgId: string, countryCode: string) {
  const configs = await db
    .select()
    .from(schema.countryBenefitConfigs)
    .where(and(
      eq(schema.countryBenefitConfigs.orgId, orgId),
      eq(schema.countryBenefitConfigs.countryCode, countryCode.toUpperCase()),
    ))

  if (configs.length > 0) return configs[0]

  // Return default from database
  const countryData = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!countryData) throw new Error(`Country "${countryCode}" not found`)

  return {
    country: countryData.country,
    countryCode: countryData.countryCode,
    mandatoryBenefits: countryData.mandatoryBenefits,
    supplementaryBenefits: countryData.supplementaryBenefits,
    taxImplications: countryData.taxImplications,
  }
}

export async function updateCountryConfig(orgId: string, countryCode: string, config: {
  mandatoryBenefits?: any
  supplementaryBenefits?: any
  taxImplications?: any
  complianceNotes?: string
}) {
  const existing = await db
    .select()
    .from(schema.countryBenefitConfigs)
    .where(and(
      eq(schema.countryBenefitConfigs.orgId, orgId),
      eq(schema.countryBenefitConfigs.countryCode, countryCode.toUpperCase()),
    ))
    .limit(1)

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.countryBenefitConfigs)
      .set({
        ...config,
        lastReviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(schema.countryBenefitConfigs.id, existing[0].id))
      .returning()
    return updated
  }

  const countryData = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  const [created] = await db
    .insert(schema.countryBenefitConfigs)
    .values({
      orgId,
      country: countryData?.country || countryCode,
      countryCode: countryCode.toUpperCase(),
      mandatoryBenefits: config.mandatoryBenefits || countryData?.mandatoryBenefits || [],
      supplementaryBenefits: config.supplementaryBenefits || countryData?.supplementaryBenefits || [],
      taxImplications: config.taxImplications || countryData?.taxImplications || {},
      complianceNotes: config.complianceNotes || null,
      lastReviewedAt: new Date(),
    })
    .returning()

  return created
}

export function getMandatoryBenefits(countryCode: string) {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) throw new Error(`Country "${countryCode}" not found`)
  return data.mandatoryBenefits
}

export function getSupplementaryOptions(countryCode: string) {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) throw new Error(`Country "${countryCode}" not found`)
  return data.supplementaryBenefits
}

export function calculateBenefitCost(countryCode: string, annualSalary: number, currency: string, options?: {
  includeSupplementary?: boolean
  supplementaryCategories?: BenefitCategory[]
}) {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) throw new Error(`Country "${countryCode}" not found`)

  const monthlySalary = annualSalary / 12
  const mandatoryCosts: Array<{ name: string; employerMonthly: number; employeeMonthly: number }> = []

  for (const benefit of data.mandatoryBenefits) {
    let employerCost: number
    let employeeCost: number

    if (benefit.basis === 'capped' && benefit.cap) {
      const cappedSalary = Math.min(annualSalary, benefit.cap)
      employerCost = (cappedSalary / 12) * (benefit.employerCostPercent / 100)
      employeeCost = (cappedSalary / 12) * (benefit.employeeCostPercent / 100)
    } else if (benefit.basis === 'fixed') {
      employerCost = monthlySalary * (benefit.employerCostPercent / 100)
      employeeCost = monthlySalary * (benefit.employeeCostPercent / 100)
    } else {
      employerCost = monthlySalary * (benefit.employerCostPercent / 100)
      employeeCost = monthlySalary * (benefit.employeeCostPercent / 100)
    }

    mandatoryCosts.push({
      name: benefit.name,
      employerMonthly: Math.round(employerCost * 100) / 100,
      employeeMonthly: Math.round(employeeCost * 100) / 100,
    })
  }

  const totalMandatoryEmployer = mandatoryCosts.reduce((s, c) => s + c.employerMonthly, 0)
  const totalMandatoryEmployee = mandatoryCosts.reduce((s, c) => s + c.employeeMonthly, 0)

  let supplementaryCosts: Array<{ name: string; employerMonthly: number }> = []
  let totalSupplementary = 0

  if (options?.includeSupplementary) {
    const categories = options.supplementaryCategories || []
    const filtered = categories.length > 0
      ? data.supplementaryBenefits.filter(b => categories.includes(b.category))
      : data.supplementaryBenefits.filter(b => b.isRecommended)

    supplementaryCosts = filtered.map(b => ({
      name: b.name,
      employerMonthly: b.typicalEmployerCost,
    }))
    totalSupplementary = supplementaryCosts.reduce((s, c) => s + c.employerMonthly, 0)
  }

  return {
    country: data.country,
    baseSalary: { monthly: monthlySalary, annual: annualSalary, currency },
    mandatory: {
      items: mandatoryCosts,
      totalEmployerMonthly: Math.round(totalMandatoryEmployer * 100) / 100,
      totalEmployerAnnual: Math.round(totalMandatoryEmployer * 12 * 100) / 100,
      totalEmployeeMonthly: Math.round(totalMandatoryEmployee * 100) / 100,
      percentOfSalary: Math.round((totalMandatoryEmployer / monthlySalary) * 10000) / 100,
    },
    supplementary: {
      items: supplementaryCosts,
      totalMonthly: totalSupplementary,
      totalAnnual: totalSupplementary * 12,
    },
    totalEmployerCost: {
      monthly: Math.round((monthlySalary + totalMandatoryEmployer + totalSupplementary) * 100) / 100,
      annual: Math.round((monthlySalary + totalMandatoryEmployer + totalSupplementary) * 12 * 100) / 100,
    },
  }
}

export function getBenefitComparison(countryCodes: string[], categories?: BenefitCategory[]): BenefitComparison {
  const targetCategories: BenefitCategory[] = categories || ['health', 'retirement', 'life_insurance', 'disability', 'statutory']

  const comparison = targetCategories.map(category => ({
    category,
    items: countryCodes.map(code => {
      const data = COUNTRY_BENEFITS[code.toUpperCase()]
      if (!data) return { country: code, benefits: [], employerCostPercent: 0, mandatoryCount: 0, supplementaryCount: 0 }

      const mandatoryInCategory = data.mandatoryBenefits.filter(b => b.category === category)
      const suppInCategory = data.supplementaryBenefits.filter(b => b.category === category)
      const totalEmployerCost = mandatoryInCategory.reduce((s, b) => s + b.employerCostPercent, 0)

      return {
        country: data.country,
        benefits: mandatoryInCategory.map(b => b.name),
        employerCostPercent: Math.round(totalEmployerCost * 100) / 100,
        mandatoryCount: mandatoryInCategory.length,
        supplementaryCount: suppInCategory.length,
      }
    }),
  }))

  const costSummary = countryCodes.map(code => {
    const data = COUNTRY_BENEFITS[code.toUpperCase()]
    if (!data) return { country: code, totalMandatoryCostPercent: 0, estimatedMonthlyPerEmployee: 0, currency: 'USD' }

    const totalPercent = data.mandatoryBenefits.reduce((s, b) => s + b.employerCostPercent, 0)

    return {
      country: data.country,
      totalMandatoryCostPercent: Math.round(totalPercent * 100) / 100,
      estimatedMonthlyPerEmployee: Math.round(5000 * (totalPercent / 100)), // Based on $5000/mo salary
      currency: data.mandatoryBenefits[0]?.capCurrency || 'USD',
    }
  })

  return {
    countries: countryCodes.map(c => COUNTRY_BENEFITS[c.toUpperCase()]?.country || c),
    categories: targetCategories,
    comparison,
    costSummary,
  }
}

export async function generateComplianceReport(orgId: string): Promise<ComplianceReport> {
  const plans = await db
    .select()
    .from(schema.globalBenefitPlans)
    .where(eq(schema.globalBenefitPlans.orgId, orgId))

  const enrollments = await db
    .select()
    .from(schema.globalBenefitEnrollments)
    .where(eq(schema.globalBenefitEnrollments.orgId, orgId))

  const employees = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

  // Group employees by country
  const countryEmployees = new Map<string, number>()
  for (const emp of employees) {
    const country = emp.country || 'Unknown'
    countryEmployees.set(country, (countryEmployees.get(country) || 0) + 1)
  }

  const countries: ComplianceReport['countries'] = []
  const urgentActions: string[] = []

  for (const [country, empCount] of countryEmployees) {
    // Find matching country data
    const countryData = Object.values(COUNTRY_BENEFITS).find(c =>
      c.country.toLowerCase() === country.toLowerCase() || c.countryCode.toLowerCase() === country.toLowerCase()
    )

    if (!countryData) {
      countries.push({
        country,
        countryCode: country,
        totalEmployees: empCount,
        mandatoryBenefitsOffered: 0,
        mandatoryBenefitsRequired: 0,
        complianceRate: 0,
        issues: ['Country benefits data not configured'],
        recommendations: ['Set up country benefit configuration'],
      })
      continue
    }

    const requiredCount = countryData.mandatoryBenefits.length
    const offeredPlans = plans.filter(p =>
      p.isStatutory && p.isActive &&
      (p.countryCode === countryData.countryCode || p.country === countryData.country)
    )
    const offeredCount = Math.min(offeredPlans.length, requiredCount)
    const complianceRate = requiredCount > 0 ? Math.round((offeredCount / requiredCount) * 100) : 100

    const issues: string[] = []
    const recommendations: string[] = []

    if (complianceRate < 100) {
      const missingBenefits = countryData.mandatoryBenefits
        .filter(mb => !offeredPlans.some(p => p.name === mb.name))
        .map(mb => mb.name)

      issues.push(`Missing mandatory benefits: ${missingBenefits.join(', ')}`)
      recommendations.push(`Set up the following mandatory benefits: ${missingBenefits.join(', ')}`)

      if (complianceRate < 50) {
        urgentActions.push(`${countryData.country}: ${missingBenefits.length} mandatory benefits not configured (${empCount} employees affected)`)
      }
    }

    // Check enrollment rates
    const countryEnrollments = enrollments.filter(e => e.country === countryData.country || e.country === countryData.countryCode)
    if (countryEnrollments.length < empCount * 0.8) {
      recommendations.push('Enrollment rate below 80% - consider reviewing employee communications')
    }

    countries.push({
      country: countryData.country,
      countryCode: countryData.countryCode,
      totalEmployees: empCount,
      mandatoryBenefitsOffered: offeredCount,
      mandatoryBenefitsRequired: requiredCount,
      complianceRate,
      issues,
      recommendations,
    })
  }

  const overallComplianceRate = countries.length > 0
    ? Math.round(countries.reduce((s, c) => s + c.complianceRate, 0) / countries.length)
    : 100

  return {
    orgId,
    generatedAt: new Date().toISOString(),
    countries,
    overallComplianceRate,
    urgentActions,
  }
}

export function benchmarkAgainstMarket(countryCode: string, category: BenefitCategory, yourMonthlyCost: number): MarketBenchmark {
  const benchmarks = MARKET_BENCHMARKS[countryCode.toUpperCase()]
  if (!benchmarks) {
    throw new Error(`No benchmark data available for country "${countryCode}". Available: ${Object.keys(MARKET_BENCHMARKS).join(', ')}`)
  }

  const categoryBenchmark = benchmarks[category]
  if (!categoryBenchmark) {
    throw new Error(`No benchmark data for category "${category}" in ${countryCode}`)
  }

  let percentile: number
  if (yourMonthlyCost <= categoryBenchmark.p25) percentile = 25
  else if (yourMonthlyCost >= categoryBenchmark.p75) percentile = 75
  else {
    const range = categoryBenchmark.p75 - categoryBenchmark.p25
    percentile = 25 + Math.round(((yourMonthlyCost - categoryBenchmark.p25) / range) * 50)
  }

  let recommendation: string
  if (percentile < 25) {
    recommendation = 'Your spending is below market norms. Consider increasing benefits to remain competitive for talent attraction and retention.'
  } else if (percentile > 75) {
    recommendation = 'Your spending is above market norms. Your benefits package is premium and competitive. Review for cost optimization opportunities.'
  } else {
    recommendation = 'Your spending is in line with market norms. Your benefits package is competitive.'
  }

  return {
    country: COUNTRY_BENEFITS[countryCode.toUpperCase()]?.country || countryCode,
    category,
    marketMedian: categoryBenchmark.median,
    percentile25: categoryBenchmark.p25,
    percentile75: categoryBenchmark.p75,
    yourCost: yourMonthlyCost,
    yourPercentile: percentile,
    recommendation,
  }
}

export async function getGlobalBenefitsDashboard(orgId: string) {
  const plans = await db
    .select()
    .from(schema.globalBenefitPlans)
    .where(eq(schema.globalBenefitPlans.orgId, orgId))

  const enrollments = await db
    .select()
    .from(schema.globalBenefitEnrollments)
    .where(eq(schema.globalBenefitEnrollments.orgId, orgId))

  const activePlans = plans.filter(p => p.isActive)
  const countries = new Set(plans.map(p => p.country))
  const totalEmployerCost = enrollments.reduce((s, e) => s + (e.employerContribution || 0), 0)
  const totalEmployeeCost = enrollments.reduce((s, e) => s + (e.employeeContribution || 0), 0)

  const enrollmentsByCountry = new Map<string, number>()
  for (const e of enrollments) {
    enrollmentsByCountry.set(e.country, (enrollmentsByCountry.get(e.country) || 0) + 1)
  }

  const plansByCategory = new Map<string, number>()
  for (const p of activePlans) {
    plansByCategory.set(p.category, (plansByCategory.get(p.category) || 0) + 1)
  }

  return {
    summary: {
      totalPlans: plans.length,
      activePlans: activePlans.length,
      statutoryPlans: plans.filter(p => p.isStatutory).length,
      totalCountries: countries.size,
      totalEnrollments: enrollments.length,
      activeEnrollments: enrollments.filter(e => !e.terminatedAt).length,
      totalMonthlyEmployerCost: totalEmployerCost / 100,
      totalMonthlyEmployeeCost: totalEmployeeCost / 100,
    },
    byCountry: Array.from(enrollmentsByCountry.entries()).map(([country, count]) => ({
      country,
      enrollments: count,
    })),
    byCategory: Array.from(plansByCategory.entries()).map(([category, count]) => ({
      category,
      planCount: count,
    })),
    availableCountries: Object.keys(COUNTRY_BENEFITS),
  }
}

export async function syncWithLocalCarrier(orgId: string, planId: string) {
  const [plan] = await db
    .select()
    .from(schema.globalBenefitPlans)
    .where(and(eq(schema.globalBenefitPlans.id, planId), eq(schema.globalBenefitPlans.orgId, orgId)))
    .limit(1)

  if (!plan) throw new Error(`Plan "${planId}" not found`)

  const enrollments = await db
    .select()
    .from(schema.globalBenefitEnrollments)
    .where(and(eq(schema.globalBenefitEnrollments.planId, planId), eq(schema.globalBenefitEnrollments.orgId, orgId)))

  return {
    planId,
    planName: plan.name,
    provider: plan.provider,
    country: plan.country,
    syncedAt: new Date().toISOString(),
    enrollmentsSynced: enrollments.filter(e => !e.terminatedAt).length,
    status: 'completed',
  }
}

export function getStatutoryRequirements(countryCode: string) {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) throw new Error(`Country "${countryCode}" not found`)

  return {
    country: data.country,
    countryCode: data.countryCode,
    requirements: data.statutoryRequirements,
    mandatoryBenefits: data.mandatoryBenefits,
    taxImplications: data.taxImplications,
    lastReviewed: data.lastReviewed,
  }
}

export function estimateTotalCompensation(countryCode: string, annualSalary: number, currency: string, supplementaryBenefits?: string[]): TotalCompensation {
  const data = COUNTRY_BENEFITS[countryCode.toUpperCase()]
  if (!data) throw new Error(`Country "${countryCode}" not found`)

  const monthlySalary = annualSalary / 12

  const mandatoryItems = data.mandatoryBenefits.map(b => {
    let employerCost: number
    let employeeCost: number

    if (b.basis === 'capped' && b.cap) {
      const cappedSalary = Math.min(annualSalary, b.cap)
      employerCost = Math.round((cappedSalary / 12) * (b.employerCostPercent / 100))
      employeeCost = Math.round((cappedSalary / 12) * (b.employeeCostPercent / 100))
    } else {
      employerCost = Math.round(monthlySalary * (b.employerCostPercent / 100))
      employeeCost = Math.round(monthlySalary * (b.employeeCostPercent / 100))
    }

    return { name: b.name, employerCost, employeeCost }
  })

  const suppItems = supplementaryBenefits
    ? data.supplementaryBenefits
        .filter(b => supplementaryBenefits.includes(b.name) || supplementaryBenefits.includes(b.category))
        .map(b => ({ name: b.name, employerCost: b.typicalEmployerCost, employeeCost: 0 }))
    : []

  const totalEmployerMandatory = mandatoryItems.reduce((s, i) => s + i.employerCost, 0)
  const totalEmployeeMandatory = mandatoryItems.reduce((s, i) => s + i.employeeCost, 0)
  const totalEmployerSupp = suppItems.reduce((s, i) => s + i.employerCost, 0)
  const totalEmployerCost = monthlySalary + totalEmployerMandatory + totalEmployerSupp
  const totalCompensation = totalEmployerCost

  return {
    employeeId: '',
    country: data.country,
    baseSalary: monthlySalary,
    currency,
    mandatoryBenefits: mandatoryItems,
    supplementaryBenefits: suppItems,
    totalEmployerCost: Math.round(totalEmployerCost),
    totalEmployeeDeductions: Math.round(totalEmployeeMandatory),
    totalCompensationValue: Math.round(totalCompensation),
    breakdown: {
      baseSalaryPercent: Math.round((monthlySalary / totalCompensation) * 10000) / 100,
      mandatoryBenefitsPercent: Math.round((totalEmployerMandatory / totalCompensation) * 10000) / 100,
      supplementaryBenefitsPercent: Math.round((totalEmployerSupp / totalCompensation) * 10000) / 100,
    },
  }
}
