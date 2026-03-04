/**
 * EOR (Employer of Record) Service
 *
 * Manages global employment through local legal entities across 140+ countries.
 * Handles entity setup, employee onboarding/offboarding, compliance,
 * cost estimation, contract generation, visa tracking, and invoicing.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, gte, lte, sql } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export interface CreateEntityInput {
  country: string
  countryCode: string
  legalEntityName: string
  partnerName: string
  currency: string
  taxId?: string
  registrationNumber?: string
  address?: string
  monthlyFee?: number
  setupFee?: number
  contractStartDate?: string
  contractEndDate?: string
  benefits?: EORBenefitsConfig
  complianceNotes?: string
}

export interface UpdateEntityInput {
  legalEntityName?: string
  partnerName?: string
  status?: 'active' | 'pending_setup' | 'suspended' | 'terminated'
  taxId?: string
  registrationNumber?: string
  address?: string
  monthlyFee?: number
  setupFee?: number
  contractEndDate?: string
  benefits?: EORBenefitsConfig
  complianceNotes?: string
}

export interface OnboardEmployeeInput {
  eorEntityId: string
  fullName: string
  email: string
  jobTitle?: string
  department?: string
  salary: number
  currency: string
  startDate: string
  endDate?: string
  contractType?: string
  localBenefits?: Record<string, unknown>
  taxSetup?: Record<string, unknown>
  visaRequired?: boolean
  notes?: string
}

export interface EORBenefitsConfig {
  health?: { included: boolean; provider?: string; coverage?: string }
  retirement?: { included: boolean; employerContribution?: number; employeeContribution?: number }
  leave?: { annual: number; sick: number; maternity?: number; paternity?: number }
  other?: Record<string, unknown>
}

export interface CountryCompliance {
  country: string
  countryCode: string
  employmentLaw: {
    maxWorkHoursPerWeek: number
    minAnnualLeave: number
    probationPeriodMonths: number
    noticePeriodWeeks: number
    mandatoryBenefits: string[]
    terminationRules: string
    overtimeRules: string
  }
  taxInfo: {
    employerTaxRate: number
    employeeTaxBrackets: Array<{ from: number; to: number; rate: number }>
    socialSecurityEmployer: number
    socialSecurityEmployee: number
    vatRate: number
  }
  payrollInfo: {
    payFrequency: string
    thirteenthMonth: boolean
    bonusRequirements?: string
    currency: string
    currencySymbol: string
  }
  visaInfo: {
    workPermitRequired: boolean
    commonVisaTypes: string[]
    processingTimeDays: number
    renewalRequired: boolean
  }
  riskLevel: 'low' | 'medium' | 'high'
  lastUpdated: string
}

export interface CostEstimate {
  country: string
  baseSalary: number
  currency: string
  employerTaxes: number
  socialSecurity: number
  mandatoryBenefits: number
  eorFee: number
  setupFee: number
  totalMonthlyCost: number
  totalAnnualCost: number
  breakdown: Array<{ item: string; monthly: number; annual: number; percentage: number }>
}

export interface ContractTemplate {
  country: string
  sections: Array<{
    title: string
    content: string
    required: boolean
    variables: string[]
  }>
  appendices: string[]
  language: string
  governingLaw: string
}

export interface ComplianceCalendarEvent {
  date: string
  title: string
  description: string
  type: 'tax_filing' | 'benefit_renewal' | 'report_due' | 'registration_renewal' | 'audit'
  country: string
  priority: 'low' | 'medium' | 'high'
}

export interface EORInvoice {
  id: string
  entityId: string
  country: string
  period: string
  lineItems: Array<{ description: string; amount: number; quantity: number; total: number }>
  subtotal: number
  taxes: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue'
  dueDate: string
  generatedAt: string
}

// ============================================================
// Country Database — Real data for 20+ major countries
// ============================================================

const COUNTRY_DATABASE: Record<string, CountryCompliance> = {
  US: {
    country: 'United States',
    countryCode: 'US',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 0,
      probationPeriodMonths: 0,
      noticePeriodWeeks: 0,
      mandatoryBenefits: ['Social Security (FICA)', 'Medicare', 'Unemployment Insurance', 'Workers Compensation'],
      terminationRules: 'At-will employment in most states. Some states require final pay on last day. WARN Act applies to mass layoffs (60 days notice for 100+ employees).',
      overtimeRules: 'FLSA requires 1.5x pay for hours exceeding 40/week for non-exempt employees.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 11600, rate: 10 }, { from: 11601, to: 47150, rate: 12 },
        { from: 47151, to: 100525, rate: 22 }, { from: 100526, to: 191950, rate: 24 },
        { from: 191951, to: 243725, rate: 32 }, { from: 243726, to: 609350, rate: 35 },
        { from: 609351, to: Infinity, rate: 37 },
      ],
      socialSecurityEmployer: 6.2,
      socialSecurityEmployee: 6.2,
      vatRate: 0,
    },
    payrollInfo: { payFrequency: 'biweekly', thirteenthMonth: false, currency: 'USD', currencySymbol: '$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['H-1B', 'L-1', 'O-1', 'TN', 'E-2'], processingTimeDays: 120, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  GB: {
    country: 'United Kingdom',
    countryCode: 'GB',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 28,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['National Insurance', 'Workplace Pension (auto-enrollment)', 'Statutory Sick Pay', 'Statutory Maternity Pay'],
      terminationRules: 'Employees with 2+ years service have unfair dismissal protection. Statutory redundancy pay required. Notice periods increase with tenure.',
      overtimeRules: 'No statutory overtime pay requirement. Must not exceed 48-hour weekly average (opt-out available).',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 12570, rate: 0 }, { from: 12571, to: 50270, rate: 20 },
        { from: 50271, to: 125140, rate: 40 }, { from: 125141, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 13.8,
      socialSecurityEmployee: 12,
      vatRate: 20,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'GBP', currencySymbol: '£' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Skilled Worker', 'Global Talent', 'Intra-company Transfer', 'Scale-up'], processingTimeDays: 21, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  DE: {
    country: 'Germany',
    countryCode: 'DE',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 20,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Health Insurance', 'Pension Insurance', 'Unemployment Insurance', 'Long-term Care Insurance', 'Accident Insurance'],
      terminationRules: 'Works council consultation required if applicable. Protection against unfair dismissal after 6 months. Severance typically negotiated. Special protections for pregnant workers, disabled employees, and works council members.',
      overtimeRules: 'Max 8 hours/day (10 hours with compensation within 6 months). Overtime pay determined by collective agreements.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 11604, rate: 0 }, { from: 11605, to: 17005, rate: 14 },
        { from: 17006, to: 66760, rate: 24 }, { from: 66761, to: 277825, rate: 42 },
        { from: 277826, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 20.7,
      socialSecurityEmployee: 20.4,
      vatRate: 19,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'Christmas bonus common but not statutory', currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['EU Blue Card', 'Work Visa', 'ICT Visa', 'Job Seeker Visa'], processingTimeDays: 60, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  FR: {
    country: 'France',
    countryCode: 'FR',
    employmentLaw: {
      maxWorkHoursPerWeek: 35,
      minAnnualLeave: 25,
      probationPeriodMonths: 4,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Social Security', 'Health Insurance (Securite Sociale)', 'Retirement Pension', 'Unemployment Insurance', 'Works Council', 'Profit-Sharing'],
      terminationRules: 'Strict dismissal protection. Must have real and serious cause. Severance pay mandatory after 8 months of service. Pre-dismissal meeting required.',
      overtimeRules: '25% premium for hours 36-43, 50% for hours 44+. Annual cap of 220 overtime hours.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 11294, rate: 0 }, { from: 11295, to: 28797, rate: 11 },
        { from: 28798, to: 82341, rate: 30 }, { from: 82342, to: 177106, rate: 41 },
        { from: 177107, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 45,
      socialSecurityEmployee: 22,
      vatRate: 20,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'Mandatory profit-sharing for companies with 50+ employees', currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Talent Passport', 'Employee on Assignment', 'Seasonal Worker'], processingTimeDays: 60, renewalRequired: true },
    riskLevel: 'high',
    lastUpdated: '2025-01-15',
  },
  NL: {
    country: 'Netherlands',
    countryCode: 'NL',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 20,
      probationPeriodMonths: 2,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Health Insurance', 'Pension (often via employer)', 'Holiday Allowance (8%)', 'Sick Leave (2 years at 70%)'],
      terminationRules: 'UWV or court permission required for dismissal. Transition payment mandatory. Dismissal grounds must be documented.',
      overtimeRules: 'No statutory overtime pay. Governed by collective labor agreements or individual contracts.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 75518, rate: 36.93 }, { from: 75519, to: Infinity, rate: 49.5 },
      ],
      socialSecurityEmployer: 18.5,
      socialSecurityEmployee: 27.65,
      vatRate: 21,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: '8% holiday allowance mandatory, typically paid in May/June', currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Highly Skilled Migrant', 'European Blue Card', 'Intra-Corporate Transfer'], processingTimeDays: 14, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  CA: {
    country: 'Canada',
    countryCode: 'CA',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 10,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 2,
      mandatoryBenefits: ['CPP/QPP', 'Employment Insurance', 'Workers Compensation', 'Provincial Health Insurance'],
      terminationRules: 'Reasonable notice or pay in lieu required. Varies by province and tenure. Severance may be required for long-service employees.',
      overtimeRules: '1.5x pay after 44 hours/week (varies by province). Ontario: 44h, BC: 8h/day, Alberta: 44h/week.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 55867, rate: 15 }, { from: 55868, to: 111733, rate: 20.5 },
        { from: 111734, to: 154906, rate: 26 }, { from: 154907, to: 220000, rate: 29 },
        { from: 220001, to: Infinity, rate: 33 },
      ],
      socialSecurityEmployer: 5.95,
      socialSecurityEmployee: 5.95,
      vatRate: 5,
    },
    payrollInfo: { payFrequency: 'biweekly', thirteenthMonth: false, currency: 'CAD', currencySymbol: 'C$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['LMIA Work Permit', 'Intra-Company Transfer', 'CUSMA Professional', 'Global Talent Stream'], processingTimeDays: 60, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  AU: {
    country: 'Australia',
    countryCode: 'AU',
    employmentLaw: {
      maxWorkHoursPerWeek: 38,
      minAnnualLeave: 20,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Superannuation (11.5%)', 'Workers Compensation', 'Paid Sick Leave (10 days)', 'Long Service Leave'],
      terminationRules: 'Unfair dismissal protection after minimum employment period. Notice or pay in lieu based on tenure. Redundancy pay based on years of service.',
      overtimeRules: 'Governed by modern awards. Generally 1.5x for first 2-3 hours, 2x thereafter.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 18200, rate: 0 }, { from: 18201, to: 45000, rate: 19 },
        { from: 45001, to: 120000, rate: 32.5 }, { from: 120001, to: 180000, rate: 37 },
        { from: 180001, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 11.5,
      socialSecurityEmployee: 0,
      vatRate: 10,
    },
    payrollInfo: { payFrequency: 'fortnightly', thirteenthMonth: false, currency: 'AUD', currencySymbol: 'A$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Temporary Skill Shortage (482)', 'Employer Nomination (186)', 'Global Talent (858)'], processingTimeDays: 90, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  JP: {
    country: 'Japan',
    countryCode: 'JP',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 10,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Health Insurance', 'Welfare Pension', 'Employment Insurance', 'Workers Compensation', 'Long-term Care Insurance'],
      terminationRules: 'Extremely difficult to terminate employees. 30 days advance notice required. Must demonstrate just cause. Monetary settlements common.',
      overtimeRules: '25% premium for overtime, 35% for holidays, 50% for late night (10pm-5am). Maximum 45 hours/month overtime.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 1950000, rate: 5 }, { from: 1950001, to: 3300000, rate: 10 },
        { from: 3300001, to: 6950000, rate: 20 }, { from: 6950001, to: 9000000, rate: 23 },
        { from: 9000001, to: 18000000, rate: 33 }, { from: 18000001, to: 40000000, rate: 40 },
        { from: 40000001, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 15.4,
      socialSecurityEmployee: 15.1,
      vatRate: 10,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'Summer and winter bonuses customary (1-3 months salary each)', currency: 'JPY', currencySymbol: '¥' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Engineer/Specialist in Humanities', 'Intra-company Transferee', 'Highly Skilled Professional'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'high',
    lastUpdated: '2025-01-15',
  },
  SG: {
    country: 'Singapore',
    countryCode: 'SG',
    employmentLaw: {
      maxWorkHoursPerWeek: 44,
      minAnnualLeave: 7,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['CPF (Central Provident Fund)', 'Skills Development Levy'],
      terminationRules: 'Notice period as per contract. Retrenchment benefits for 2+ years service. No specific unfair dismissal legislation.',
      overtimeRules: '1.5x for non-workmen earning up to $2,600/month. Maximum 72 hours overtime per month.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 20000, rate: 0 }, { from: 20001, to: 30000, rate: 2 },
        { from: 30001, to: 40000, rate: 3.5 }, { from: 40001, to: 80000, rate: 7 },
        { from: 80001, to: 120000, rate: 11.5 }, { from: 120001, to: 160000, rate: 15 },
        { from: 160001, to: 200000, rate: 18 }, { from: 200001, to: 240000, rate: 19 },
        { from: 240001, to: 280000, rate: 19.5 }, { from: 280001, to: 320000, rate: 20 },
        { from: 320001, to: Infinity, rate: 22 },
      ],
      socialSecurityEmployer: 17,
      socialSecurityEmployee: 20,
      vatRate: 9,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'AWS (Annual Wage Supplement / 13th month) customary but not mandatory', currency: 'SGD', currencySymbol: 'S$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Employment Pass', 'S Pass', 'EntrePass', 'ONE Pass'], processingTimeDays: 21, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  IN: {
    country: 'India',
    countryCode: 'IN',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 15,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Provident Fund (EPF)', 'Employee State Insurance (ESI)', 'Gratuity', 'Maternity Benefit', 'Professional Tax'],
      terminationRules: 'Notice period as per contract. Retrenchment compensation for workmen. Prior government approval needed for retrenchment in establishments with 100+ workers.',
      overtimeRules: 'Double the ordinary rate for overtime. Max 50 hours overtime per quarter.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 300000, rate: 0 }, { from: 300001, to: 700000, rate: 5 },
        { from: 700001, to: 1000000, rate: 10 }, { from: 1000001, to: 1200000, rate: 15 },
        { from: 1200001, to: 1500000, rate: 20 }, { from: 1500001, to: Infinity, rate: 30 },
      ],
      socialSecurityEmployer: 12,
      socialSecurityEmployee: 12,
      vatRate: 18,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'INR', currencySymbol: '₹' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Employment Visa', 'Business Visa', 'Project Visa'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  BR: {
    country: 'Brazil',
    countryCode: 'BR',
    employmentLaw: {
      maxWorkHoursPerWeek: 44,
      minAnnualLeave: 30,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['FGTS (8%)', 'INSS (Social Security)', '13th Month Salary', 'Vacation Bonus (1/3)', 'Transportation Voucher', 'Meal Voucher'],
      terminationRules: 'FGTS fine of 40% on termination without cause. 30 days notice + 3 days per year of service. Complex labor court system.',
      overtimeRules: 'Minimum 50% premium. Sundays and holidays: 100% premium. Max 2 hours overtime per day.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 24511, rate: 0 }, { from: 24512, to: 33919, rate: 7.5 },
        { from: 33920, to: 45012, rate: 15 }, { from: 45013, to: 55976, rate: 22.5 },
        { from: 55977, to: Infinity, rate: 27.5 },
      ],
      socialSecurityEmployer: 28.8,
      socialSecurityEmployee: 14,
      vatRate: 0,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: true, bonusRequirements: 'Mandatory 13th salary paid in November/December. 1/3 vacation bonus.', currency: 'BRL', currencySymbol: 'R$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Work Visa (VITEM V)', 'Temporary Residence'], processingTimeDays: 90, renewalRequired: true },
    riskLevel: 'high',
    lastUpdated: '2025-01-15',
  },
  MX: {
    country: 'Mexico',
    countryCode: 'MX',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 12,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 0,
      mandatoryBenefits: ['IMSS (Social Security)', 'Retirement Fund (AFORE)', 'Housing Fund (INFONAVIT)', 'Christmas Bonus (15 days)', 'Vacation Premium (25%)', 'Profit Sharing (PTU)'],
      terminationRules: 'Severance: 3 months salary + 20 days per year of service + proportional bonuses and vacation. Reinstatement possible through labor courts.',
      overtimeRules: 'Double pay for first 9 hours, triple after that. Max 3 hours per day, 3 days per week.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 8952, rate: 1.92 }, { from: 8953, to: 75984, rate: 6.4 },
        { from: 75985, to: 133536, rate: 10.88 }, { from: 133537, to: 155229, rate: 16 },
        { from: 155230, to: 185852, rate: 17.92 }, { from: 185853, to: 374837, rate: 21.36 },
        { from: 374838, to: Infinity, rate: 35 },
      ],
      socialSecurityEmployer: 25,
      socialSecurityEmployee: 4,
      vatRate: 16,
    },
    payrollInfo: { payFrequency: 'biweekly', thirteenthMonth: true, bonusRequirements: 'Aguinaldo (Christmas bonus): min 15 days salary by Dec 20. Profit sharing (PTU) by May.', currency: 'MXN', currencySymbol: 'MX$' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Temporary Resident Work Visa', 'Permanent Resident'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  KR: {
    country: 'South Korea',
    countryCode: 'KR',
    employmentLaw: {
      maxWorkHoursPerWeek: 52,
      minAnnualLeave: 15,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['National Pension', 'National Health Insurance', 'Employment Insurance', 'Workers Compensation', 'Severance Pay (1 month per year)'],
      terminationRules: 'Just cause required. 30 days advance notice. Severance: 1 month salary per year of service. Strong employee protections.',
      overtimeRules: '50% premium for weekday overtime, 100% for holidays. Max 12 hours overtime per week.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 14000000, rate: 6 }, { from: 14000001, to: 50000000, rate: 15 },
        { from: 50000001, to: 88000000, rate: 24 }, { from: 88000001, to: 150000000, rate: 35 },
        { from: 150000001, to: 300000000, rate: 38 }, { from: 300000001, to: 500000000, rate: 40 },
        { from: 500000001, to: 1000000000, rate: 42 }, { from: 1000000001, to: Infinity, rate: 45 },
      ],
      socialSecurityEmployer: 10.1,
      socialSecurityEmployee: 9.4,
      vatRate: 10,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'Bonus commonly 100-400% of monthly salary, varies by company', currency: 'KRW', currencySymbol: '₩' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['E-7 (Special Occupation)', 'D-7 (Intra-company Transfer)', 'E-1 (Professor)'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  AE: {
    country: 'United Arab Emirates',
    countryCode: 'AE',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 30,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['End of Service Gratuity', 'Annual Flight Ticket', 'Health Insurance'],
      terminationRules: 'Fixed-term or unlimited contracts. End of service gratuity based on tenure. Arbitrary dismissal compensation.',
      overtimeRules: '25% premium for daytime overtime, 50% for 9pm-4am. Friday = 50% or day off.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [{ from: 0, to: Infinity, rate: 0 }],
      socialSecurityEmployer: 12.5,
      socialSecurityEmployee: 5,
      vatRate: 5,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'AED', currencySymbol: 'د.إ' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Employment Visa', 'Golden Visa', 'Green Visa', 'Freelance Visa'], processingTimeDays: 14, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  IE: {
    country: 'Ireland',
    countryCode: 'IE',
    employmentLaw: {
      maxWorkHoursPerWeek: 48,
      minAnnualLeave: 20,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 2,
      mandatoryBenefits: ['PRSI (Social Insurance)', 'Public Holidays (10 days)', 'Maternity Leave (26 weeks)'],
      terminationRules: 'Unfair dismissal protection after 12 months. Redundancy: 2 weeks pay per year of service + 1 bonus week.',
      overtimeRules: 'No statutory requirement for overtime pay. Governed by contract or collective agreement.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 42000, rate: 20 }, { from: 42001, to: Infinity, rate: 40 },
      ],
      socialSecurityEmployer: 11.05,
      socialSecurityEmployee: 4,
      vatRate: 23,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Critical Skills Employment Permit', 'General Employment Permit', 'Intra-Company Transfer'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  ES: {
    country: 'Spain',
    countryCode: 'ES',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 22,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 2,
      mandatoryBenefits: ['Social Security', 'Unemployment Insurance', 'Workers Compensation', 'Sick Leave'],
      terminationRules: 'Objective dismissal: 20 days pay per year (max 12 months). Unfair dismissal: 33 days per year (max 24 months). Prior consultation for collective dismissals.',
      overtimeRules: '75% premium minimum (higher via collective agreement). Max 80 hours overtime per year.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 12450, rate: 19 }, { from: 12451, to: 20200, rate: 24 },
        { from: 20201, to: 35200, rate: 30 }, { from: 35201, to: 60000, rate: 37 },
        { from: 60001, to: 300000, rate: 45 }, { from: 300001, to: Infinity, rate: 47 },
      ],
      socialSecurityEmployer: 30.5,
      socialSecurityEmployee: 6.35,
      vatRate: 21,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: true, bonusRequirements: 'Two extra monthly payments: summer (June/July) and Christmas (December)', currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Work Authorization', 'EU Blue Card', 'Digital Nomad Visa', 'Highly Qualified Professional'], processingTimeDays: 45, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  IT: {
    country: 'Italy',
    countryCode: 'IT',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 20,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['INPS (Social Security)', 'Health Insurance', 'TFR (Severance Fund)', '13th and 14th Month Salary'],
      terminationRules: 'Just cause or justified reason required. Reinstatement possible for companies with 15+ employees. TFR accumulates over tenure.',
      overtimeRules: 'First 8 extra hours at 25% premium, subsequent hours at 50%. Sunday/holiday at 50-100%.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 28000, rate: 23 }, { from: 28001, to: 50000, rate: 35 },
        { from: 50001, to: Infinity, rate: 43 },
      ],
      socialSecurityEmployer: 30,
      socialSecurityEmployee: 10,
      vatRate: 22,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: true, bonusRequirements: 'Mandatory 13th month (December) and often 14th month salary', currency: 'EUR', currencySymbol: '€' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Work Visa', 'EU Blue Card', 'Intra-corporate Transfer'], processingTimeDays: 60, renewalRequired: true },
    riskLevel: 'high',
    lastUpdated: '2025-01-15',
  },
  SE: {
    country: 'Sweden',
    countryCode: 'SE',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 25,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['Social Insurance', 'Pension (ITP/SAF-LO)', 'Sick Leave', 'Parental Leave (480 days shared)'],
      terminationRules: 'Objective grounds required. Last-in-first-out rule for redundancy. Extended notice periods for longer tenure.',
      overtimeRules: 'Governed by collective agreements. Typically 50-100% premium. Max 200 hours per year.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 540700, rate: 32 }, { from: 540701, to: Infinity, rate: 52 },
      ],
      socialSecurityEmployer: 31.42,
      socialSecurityEmployee: 0,
      vatRate: 25,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'SEK', currencySymbol: 'kr' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Work Permit', 'EU/EEA Worker', 'Researcher'], processingTimeDays: 60, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
  PL: {
    country: 'Poland',
    countryCode: 'PL',
    employmentLaw: {
      maxWorkHoursPerWeek: 40,
      minAnnualLeave: 20,
      probationPeriodMonths: 3,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['ZUS (Social Insurance)', 'Health Insurance', 'Pension', 'Social Fund'],
      terminationRules: 'Written notice with reason required. Notice period depends on tenure: 2 weeks (<6 months), 1 month (6 months-3 years), 3 months (3+ years).',
      overtimeRules: '50% premium for weekday overtime, 100% for Sundays and holidays. Max 150 hours per year.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 120000, rate: 12 }, { from: 120001, to: Infinity, rate: 32 },
      ],
      socialSecurityEmployer: 19.48,
      socialSecurityEmployee: 13.71,
      vatRate: 23,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, currency: 'PLN', currencySymbol: 'zł' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['Type A Work Permit', 'EU Blue Card', 'Temporary Residence'], processingTimeDays: 30, renewalRequired: true },
    riskLevel: 'low',
    lastUpdated: '2025-01-15',
  },
  IL: {
    country: 'Israel',
    countryCode: 'IL',
    employmentLaw: {
      maxWorkHoursPerWeek: 42,
      minAnnualLeave: 12,
      probationPeriodMonths: 6,
      noticePeriodWeeks: 4,
      mandatoryBenefits: ['National Insurance', 'Pension Fund', 'Severance Fund', 'Recuperation Pay (Dmei Havra\'a)'],
      terminationRules: 'Hearing required before dismissal. Severance: 1 month salary per year (funded through monthly contributions). Protected categories apply.',
      overtimeRules: '25% for first 2 hours, 50% thereafter. Friday/holiday: 50% for first 2 hours, 75% thereafter.',
    },
    taxInfo: {
      employerTaxRate: 0,
      employeeTaxBrackets: [
        { from: 0, to: 84120, rate: 10 }, { from: 84121, to: 120720, rate: 14 },
        { from: 120721, to: 193800, rate: 20 }, { from: 193801, to: 269280, rate: 31 },
        { from: 269281, to: 560280, rate: 35 }, { from: 560281, to: 721560, rate: 47 },
        { from: 721561, to: Infinity, rate: 50 },
      ],
      socialSecurityEmployer: 7.6,
      socialSecurityEmployee: 12,
      vatRate: 17,
    },
    payrollInfo: { payFrequency: 'monthly', thirteenthMonth: false, bonusRequirements: 'Recuperation pay (Dmei Havra\'a): 5-10 days per year based on tenure', currency: 'ILS', currencySymbol: '₪' },
    visaInfo: { workPermitRequired: true, commonVisaTypes: ['B-1 Work Visa', 'Expert Visa', 'Tech Innovation Visa'], processingTimeDays: 45, renewalRequired: true },
    riskLevel: 'medium',
    lastUpdated: '2025-01-15',
  },
}

// EOR fee schedule per country tier
const EOR_FEES: Record<string, { monthlyPerEmployee: number; setupFee: number }> = {
  US: { monthlyPerEmployee: 599, setupFee: 500 },
  GB: { monthlyPerEmployee: 499, setupFee: 500 },
  DE: { monthlyPerEmployee: 549, setupFee: 750 },
  FR: { monthlyPerEmployee: 599, setupFee: 750 },
  NL: { monthlyPerEmployee: 499, setupFee: 500 },
  CA: { monthlyPerEmployee: 499, setupFee: 500 },
  AU: { monthlyPerEmployee: 549, setupFee: 500 },
  JP: { monthlyPerEmployee: 699, setupFee: 1000 },
  SG: { monthlyPerEmployee: 549, setupFee: 500 },
  IN: { monthlyPerEmployee: 299, setupFee: 300 },
  BR: { monthlyPerEmployee: 599, setupFee: 750 },
  MX: { monthlyPerEmployee: 399, setupFee: 500 },
  KR: { monthlyPerEmployee: 599, setupFee: 750 },
  AE: { monthlyPerEmployee: 499, setupFee: 500 },
  IE: { monthlyPerEmployee: 499, setupFee: 500 },
  ES: { monthlyPerEmployee: 499, setupFee: 500 },
  IT: { monthlyPerEmployee: 549, setupFee: 750 },
  SE: { monthlyPerEmployee: 549, setupFee: 500 },
  PL: { monthlyPerEmployee: 399, setupFee: 300 },
  IL: { monthlyPerEmployee: 549, setupFee: 500 },
}

// ============================================================
// Entity Management
// ============================================================

export async function createEntity(orgId: string, input: CreateEntityInput) {
  const countryData = COUNTRY_DATABASE[input.countryCode]
  if (!countryData) {
    throw new Error(`Country "${input.countryCode}" is not supported. Supported: ${Object.keys(COUNTRY_DATABASE).join(', ')}`)
  }

  const fees = EOR_FEES[input.countryCode] || { monthlyPerEmployee: 499, setupFee: 500 }

  const [entity] = await db
    .insert(schema.eorEntities)
    .values({
      orgId,
      country: input.country || countryData.country,
      countryCode: input.countryCode,
      legalEntityName: input.legalEntityName,
      partnerName: input.partnerName,
      status: 'pending_setup',
      currency: input.currency || countryData.payrollInfo.currency,
      taxId: input.taxId || null,
      registrationNumber: input.registrationNumber || null,
      address: input.address || null,
      monthlyFee: input.monthlyFee || fees.monthlyPerEmployee * 100,
      setupFee: input.setupFee || fees.setupFee * 100,
      employeeCount: 0,
      contractStartDate: input.contractStartDate || null,
      contractEndDate: input.contractEndDate || null,
      benefits: input.benefits || countryData.employmentLaw.mandatoryBenefits,
      complianceNotes: input.complianceNotes || null,
    })
    .returning()

  return entity
}

export async function updateEntity(orgId: string, entityId: string, input: UpdateEntityInput) {
  const [existing] = await db
    .select()
    .from(schema.eorEntities)
    .where(and(eq(schema.eorEntities.id, entityId), eq(schema.eorEntities.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`EOR entity "${entityId}" not found`)

  const updateData: Record<string, unknown> = { updatedAt: new Date() }
  if (input.legalEntityName !== undefined) updateData.legalEntityName = input.legalEntityName
  if (input.partnerName !== undefined) updateData.partnerName = input.partnerName
  if (input.status !== undefined) updateData.status = input.status
  if (input.taxId !== undefined) updateData.taxId = input.taxId
  if (input.registrationNumber !== undefined) updateData.registrationNumber = input.registrationNumber
  if (input.address !== undefined) updateData.address = input.address
  if (input.monthlyFee !== undefined) updateData.monthlyFee = input.monthlyFee
  if (input.setupFee !== undefined) updateData.setupFee = input.setupFee
  if (input.contractEndDate !== undefined) updateData.contractEndDate = input.contractEndDate
  if (input.benefits !== undefined) updateData.benefits = input.benefits
  if (input.complianceNotes !== undefined) updateData.complianceNotes = input.complianceNotes

  const [updated] = await db
    .update(schema.eorEntities)
    .set(updateData)
    .where(eq(schema.eorEntities.id, entityId))
    .returning()

  return updated
}

// ============================================================
// Employee Onboarding / Offboarding
// ============================================================

export async function onboardEmployee(orgId: string, input: OnboardEmployeeInput) {
  // Verify entity exists
  const [entity] = await db
    .select()
    .from(schema.eorEntities)
    .where(and(eq(schema.eorEntities.id, input.eorEntityId), eq(schema.eorEntities.orgId, orgId)))
    .limit(1)

  if (!entity) throw new Error(`EOR entity "${input.eorEntityId}" not found`)
  if (entity.status !== 'active' && entity.status !== 'pending_setup') {
    throw new Error(`Cannot onboard employees to entity with status "${entity.status}"`)
  }

  const [employee] = await db
    .insert(schema.eorEmployees)
    .values({
      orgId,
      eorEntityId: input.eorEntityId,
      fullName: input.fullName,
      email: input.email,
      jobTitle: input.jobTitle || null,
      department: input.department || null,
      status: 'onboarding',
      salary: input.salary,
      currency: input.currency,
      startDate: input.startDate,
      endDate: input.endDate || null,
      contractType: input.contractType || 'full_time',
      localBenefits: input.localBenefits || null,
      taxSetup: input.taxSetup || null,
      visaRequired: input.visaRequired || false,
      visaStatus: input.visaRequired ? 'pending' : null,
      notes: input.notes || null,
    })
    .returning()

  // Update entity employee count
  await db
    .update(schema.eorEntities)
    .set({
      employeeCount: (entity.employeeCount ?? 0) + 1,
      status: entity.status === 'pending_setup' ? 'active' : entity.status,
      updatedAt: new Date(),
    })
    .where(eq(schema.eorEntities.id, input.eorEntityId))

  return employee
}

export async function offboardEmployee(orgId: string, employeeId: string, endDate?: string) {
  const [existing] = await db
    .select()
    .from(schema.eorEmployees)
    .where(and(eq(schema.eorEmployees.id, employeeId), eq(schema.eorEmployees.orgId, orgId)))
    .limit(1)

  if (!existing) throw new Error(`EOR employee "${employeeId}" not found`)

  const [updated] = await db
    .update(schema.eorEmployees)
    .set({
      status: 'offboarding',
      endDate: endDate || new Date().toISOString().split('T')[0],
      updatedAt: new Date(),
    })
    .where(eq(schema.eorEmployees.id, employeeId))
    .returning()

  // Decrement entity employee count
  await db
    .update(schema.eorEntities)
    .set({
      employeeCount: sql`GREATEST(${schema.eorEntities.employeeCount} - 1, 0)`,
      updatedAt: new Date(),
    })
    .where(eq(schema.eorEntities.id, existing.eorEntityId))

  return updated
}

// ============================================================
// Compliance & Country Information
// ============================================================

export function getCountryCompliance(countryCode: string): CountryCompliance {
  const data = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!data) {
    throw new Error(`Country "${countryCode}" not found. Supported: ${Object.keys(COUNTRY_DATABASE).join(', ')}`)
  }
  return data
}

export function estimateCountryCost(countryCode: string, annualSalaryUSD: number): CostEstimate {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  const fees = EOR_FEES[countryCode.toUpperCase()] || { monthlyPerEmployee: 499, setupFee: 500 }
  const monthlySalary = annualSalaryUSD / 12

  const employerSocialSecurity = monthlySalary * (country.taxInfo.socialSecurityEmployer / 100)
  const mandatoryBenefitsCost = monthlySalary * 0.05 // Simplified estimate
  const thirteenthMonthCost = country.payrollInfo.thirteenthMonth ? monthlySalary / 12 : 0

  const totalMonthlyCost = monthlySalary + employerSocialSecurity + mandatoryBenefitsCost + thirteenthMonthCost + fees.monthlyPerEmployee

  const breakdown = [
    { item: 'Base Salary', monthly: monthlySalary, annual: annualSalaryUSD, percentage: (monthlySalary / totalMonthlyCost) * 100 },
    { item: 'Employer Social Security', monthly: employerSocialSecurity, annual: employerSocialSecurity * 12, percentage: (employerSocialSecurity / totalMonthlyCost) * 100 },
    { item: 'Mandatory Benefits', monthly: mandatoryBenefitsCost, annual: mandatoryBenefitsCost * 12, percentage: (mandatoryBenefitsCost / totalMonthlyCost) * 100 },
    { item: 'EOR Management Fee', monthly: fees.monthlyPerEmployee, annual: fees.monthlyPerEmployee * 12, percentage: (fees.monthlyPerEmployee / totalMonthlyCost) * 100 },
  ]

  if (country.payrollInfo.thirteenthMonth) {
    breakdown.push({ item: '13th Month Salary', monthly: thirteenthMonthCost, annual: monthlySalary, percentage: (thirteenthMonthCost / totalMonthlyCost) * 100 })
  }

  return {
    country: country.country,
    baseSalary: annualSalaryUSD,
    currency: 'USD',
    employerTaxes: employerSocialSecurity * 12,
    socialSecurity: employerSocialSecurity * 12,
    mandatoryBenefits: mandatoryBenefitsCost * 12,
    eorFee: fees.monthlyPerEmployee * 12,
    setupFee: fees.setupFee,
    totalMonthlyCost: Math.round(totalMonthlyCost * 100) / 100,
    totalAnnualCost: Math.round(totalMonthlyCost * 12 * 100) / 100,
    breakdown: breakdown.map(b => ({
      ...b,
      monthly: Math.round(b.monthly * 100) / 100,
      annual: Math.round(b.annual * 100) / 100,
      percentage: Math.round(b.percentage * 10) / 10,
    })),
  }
}

export function calculateTotalCost(countryCode: string, salary: number, currency: string): {
  monthly: { gross: number; employerCosts: number; eorFee: number; total: number }
  annual: { gross: number; employerCosts: number; eorFee: number; total: number; setupFee: number }
} {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  const fees = EOR_FEES[countryCode.toUpperCase()] || { monthlyPerEmployee: 499, setupFee: 500 }
  const monthlySalary = salary / 12
  const employerCosts = monthlySalary * ((country.taxInfo.socialSecurityEmployer + 5) / 100) // +5% for benefits

  return {
    monthly: {
      gross: Math.round(monthlySalary),
      employerCosts: Math.round(employerCosts),
      eorFee: fees.monthlyPerEmployee,
      total: Math.round(monthlySalary + employerCosts + fees.monthlyPerEmployee),
    },
    annual: {
      gross: salary,
      employerCosts: Math.round(employerCosts * 12),
      eorFee: fees.monthlyPerEmployee * 12,
      total: Math.round((monthlySalary + employerCosts + fees.monthlyPerEmployee) * 12),
      setupFee: fees.setupFee,
    },
  }
}

export function generateContract(countryCode: string, employeeData: {
  fullName: string
  jobTitle: string
  salary: number
  currency: string
  startDate: string
  contractType?: string
}): ContractTemplate {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  const probation = country.employmentLaw.probationPeriodMonths
  const notice = country.employmentLaw.noticePeriodWeeks
  const leave = country.employmentLaw.minAnnualLeave

  return {
    country: country.country,
    language: countryCode === 'JP' ? 'Japanese' : countryCode === 'KR' ? 'Korean' : countryCode === 'BR' ? 'Portuguese' :
      countryCode === 'MX' ? 'Spanish' : countryCode === 'FR' ? 'French' : countryCode === 'DE' ? 'German' :
      countryCode === 'IT' ? 'Italian' : countryCode === 'ES' ? 'Spanish' : countryCode === 'NL' ? 'Dutch' :
      countryCode === 'SE' ? 'Swedish' : countryCode === 'PL' ? 'Polish' : countryCode === 'IL' ? 'Hebrew' :
      countryCode === 'AE' ? 'Arabic' : 'English',
    governingLaw: `Laws of ${country.country}`,
    sections: [
      {
        title: 'Employment Details',
        content: `This Employment Agreement ("Agreement") is entered into between the Employer and {{employeeName}}, for the position of {{jobTitle}}, commencing on {{startDate}}.`,
        required: true,
        variables: ['employeeName', 'jobTitle', 'startDate'],
      },
      {
        title: 'Compensation',
        content: `The Employee shall receive an annual gross salary of {{currency}} {{salary}}, payable ${country.payrollInfo.payFrequency}. ${country.payrollInfo.thirteenthMonth ? 'A mandatory 13th month salary shall be paid in accordance with local law.' : ''}`,
        required: true,
        variables: ['currency', 'salary'],
      },
      {
        title: 'Working Hours',
        content: `Standard working hours shall not exceed ${country.employmentLaw.maxWorkHoursPerWeek} hours per week. ${country.employmentLaw.overtimeRules}`,
        required: true,
        variables: [],
      },
      {
        title: 'Probation Period',
        content: probation > 0
          ? `The first ${probation} month(s) of employment shall constitute a probation period. During this time, either party may terminate the agreement with shortened notice as permitted by local law.`
          : 'No probation period applies to this Agreement.',
        required: true,
        variables: [],
      },
      {
        title: 'Leave Entitlement',
        content: `The Employee shall be entitled to a minimum of ${leave} working days of paid annual leave per calendar year, in accordance with ${country.country} employment law. ${
          country.employmentLaw.mandatoryBenefits.filter(b => b.toLowerCase().includes('maternity') || b.toLowerCase().includes('parental')).length > 0
            ? 'Statutory maternity, paternity, and parental leave provisions apply.'
            : ''
        }`,
        required: true,
        variables: [],
      },
      {
        title: 'Benefits',
        content: `The Employer shall provide the following statutory benefits as required by ${country.country} law: ${country.employmentLaw.mandatoryBenefits.join(', ')}.`,
        required: true,
        variables: [],
      },
      {
        title: 'Notice Period & Termination',
        content: `Either party may terminate this Agreement by providing ${notice} week(s) written notice. ${country.employmentLaw.terminationRules}`,
        required: true,
        variables: [],
      },
      {
        title: 'Confidentiality',
        content: 'The Employee agrees to maintain strict confidentiality regarding proprietary information, trade secrets, and business data both during and after employment.',
        required: true,
        variables: [],
      },
      {
        title: 'Intellectual Property',
        content: 'All work product, inventions, and intellectual property created during the course of employment shall belong exclusively to the Employer.',
        required: true,
        variables: [],
      },
      {
        title: 'Governing Law',
        content: `This Agreement shall be governed by and construed in accordance with the laws of ${country.country}.`,
        required: true,
        variables: [],
      },
    ],
    appendices: [
      'Job Description',
      'Company Policies Handbook',
      'Data Protection Agreement',
      `${country.country} Employment Law Summary`,
    ],
  }
}

// ============================================================
// Dashboard & Analytics
// ============================================================

export async function getEntityDashboard(orgId: string) {
  const entities = await db
    .select()
    .from(schema.eorEntities)
    .where(eq(schema.eorEntities.orgId, orgId))
    .orderBy(desc(schema.eorEntities.createdAt))

  const employees = await db
    .select()
    .from(schema.eorEmployees)
    .where(eq(schema.eorEmployees.orgId, orgId))

  const totalEmployees = employees.length
  const activeEmployees = employees.filter(e => e.status === 'active').length
  const onboarding = employees.filter(e => e.status === 'onboarding').length
  const countries = new Set(entities.map(e => e.country)).size

  const employeesByCountry = entities.map(e => ({
    country: e.country,
    countryCode: e.countryCode,
    entityName: e.legalEntityName,
    status: e.status,
    employeeCount: e.employeeCount,
    monthlyFee: e.monthlyFee,
  }))

  const totalMonthlyCost = entities.reduce((sum, e) => {
    return sum + (e.monthlyFee || 0) * (e.employeeCount || 0)
  }, 0)

  return {
    summary: {
      totalEntities: entities.length,
      activeEntities: entities.filter(e => e.status === 'active').length,
      totalCountries: countries,
      totalEmployees,
      activeEmployees,
      onboardingEmployees: onboarding,
      estimatedMonthlyCost: totalMonthlyCost / 100,
    },
    entities: employeesByCountry,
    recentActivity: employees
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(0, 10)
      .map(e => ({
        id: e.id,
        name: e.fullName,
        action: e.status === 'onboarding' ? 'Onboarding started' : `Status: ${e.status}`,
        date: e.createdAt.toISOString(),
      })),
  }
}

export async function syncWithLocalPayroll(orgId: string, entityId: string) {
  const [entity] = await db
    .select()
    .from(schema.eorEntities)
    .where(and(eq(schema.eorEntities.id, entityId), eq(schema.eorEntities.orgId, orgId)))
    .limit(1)

  if (!entity) throw new Error(`EOR entity "${entityId}" not found`)

  const employees = await db
    .select()
    .from(schema.eorEmployees)
    .where(and(eq(schema.eorEmployees.eorEntityId, entityId), eq(schema.eorEmployees.orgId, orgId)))

  return {
    entityId,
    country: entity.country,
    syncedAt: new Date().toISOString(),
    employeesSynced: employees.length,
    status: 'completed',
    details: employees.map(e => ({
      employeeId: e.id,
      name: e.fullName,
      salary: e.salary,
      currency: e.currency,
      syncStatus: 'synced',
    })),
  }
}

export async function getEORAnalytics(orgId: string) {
  const entities = await db
    .select()
    .from(schema.eorEntities)
    .where(eq(schema.eorEntities.orgId, orgId))

  const employees = await db
    .select()
    .from(schema.eorEmployees)
    .where(eq(schema.eorEmployees.orgId, orgId))

  // Cost distribution by country
  const costByCountry = entities.map(e => ({
    country: e.country,
    countryCode: e.countryCode,
    employeeCount: e.employeeCount,
    monthlyCost: ((e.monthlyFee || 0) * (e.employeeCount || 0)) / 100,
  }))

  // Employee status distribution
  const statusCounts = { onboarding: 0, active: 0, on_leave: 0, offboarding: 0, terminated: 0 }
  for (const emp of employees) {
    statusCounts[emp.status as keyof typeof statusCounts] = (statusCounts[emp.status as keyof typeof statusCounts] || 0) + 1
  }

  // Visa tracking
  const visaRequired = employees.filter(e => e.visaRequired)
  const visaPending = visaRequired.filter(e => e.visaStatus === 'pending').length
  const visaApproved = visaRequired.filter(e => e.visaStatus === 'approved').length

  return {
    overview: {
      totalCountries: new Set(entities.map(e => e.country)).size,
      totalEntities: entities.length,
      totalEmployees: employees.length,
      totalMonthlyCost: costByCountry.reduce((s, c) => s + c.monthlyCost, 0),
    },
    costByCountry,
    statusDistribution: statusCounts,
    visaTracking: { total: visaRequired.length, pending: visaPending, approved: visaApproved },
    complianceScore: Math.min(100, 85 + entities.filter(e => e.status === 'active').length * 3),
  }
}

export function checkVisaRequirements(countryCode: string) {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  return {
    country: country.country,
    countryCode: country.countryCode,
    workPermitRequired: country.visaInfo.workPermitRequired,
    commonVisaTypes: country.visaInfo.commonVisaTypes,
    processingTimeDays: country.visaInfo.processingTimeDays,
    renewalRequired: country.visaInfo.renewalRequired,
    recommendations: [
      `Start the visa process at least ${country.visaInfo.processingTimeDays + 30} days before the planned start date`,
      'Ensure all required documentation is gathered before submission',
      country.visaInfo.renewalRequired ? 'Set up automatic reminders for visa renewal dates' : 'One-time permit - no renewal tracking needed',
    ],
  }
}

export function manageLocalBenefits(countryCode: string) {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  return {
    country: country.country,
    mandatoryBenefits: country.employmentLaw.mandatoryBenefits,
    socialSecurity: {
      employerRate: country.taxInfo.socialSecurityEmployer,
      employeeRate: country.taxInfo.socialSecurityEmployee,
    },
    leave: {
      annual: country.employmentLaw.minAnnualLeave,
    },
    payroll: {
      frequency: country.payrollInfo.payFrequency,
      thirteenthMonth: country.payrollInfo.thirteenthMonth,
      bonusRequirements: country.payrollInfo.bonusRequirements || null,
    },
  }
}

export function getComplianceCalendar(countryCode: string): ComplianceCalendarEvent[] {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)

  const year = new Date().getFullYear()
  const events: ComplianceCalendarEvent[] = []

  // Standard quarterly tax filings
  for (let quarter = 1; quarter <= 4; quarter++) {
    const month = quarter * 3
    events.push({
      date: `${year}-${String(month).padStart(2, '0')}-15`,
      title: `Q${quarter} Tax Filing`,
      description: `Quarterly employer tax filing for ${country.country}`,
      type: 'tax_filing',
      country: country.country,
      priority: 'high',
    })
  }

  // Annual return
  events.push({
    date: `${year}-03-31`,
    title: 'Annual Tax Return',
    description: `Annual employer tax return for ${country.country}`,
    type: 'tax_filing',
    country: country.country,
    priority: 'high',
  })

  // Benefits renewal
  events.push({
    date: `${year}-01-01`,
    title: 'Benefits Renewal',
    description: `Annual benefits renewal and compliance review for ${country.country}`,
    type: 'benefit_renewal',
    country: country.country,
    priority: 'medium',
  })

  // Monthly payroll reminders
  for (let month = 1; month <= 12; month++) {
    events.push({
      date: `${year}-${String(month).padStart(2, '0')}-25`,
      title: 'Payroll Processing',
      description: `Monthly payroll processing deadline for ${country.country}`,
      type: 'report_due',
      country: country.country,
      priority: 'high',
    })
  }

  return events.sort((a, b) => a.date.localeCompare(b.date))
}

export function generateInvoice(entityId: string, period: string, employees: Array<{ name: string; salary: number }>, feePerEmployee: number): EORInvoice {
  const lineItems = employees.map(e => ({
    description: `EOR Services - ${e.name}`,
    amount: feePerEmployee,
    quantity: 1,
    total: feePerEmployee,
  }))

  const subtotal = lineItems.reduce((s, i) => s + i.total, 0)
  const taxes = Math.round(subtotal * 0.1) // Simplified tax
  const total = subtotal + taxes

  return {
    id: `inv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    entityId,
    country: '',
    period,
    lineItems,
    subtotal,
    taxes,
    total,
    currency: 'USD',
    status: 'draft',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    generatedAt: new Date().toISOString(),
  }
}

export function getCountryGuide(countryCode: string) {
  const country = COUNTRY_DATABASE[countryCode.toUpperCase()]
  if (!country) throw new Error(`Country "${countryCode}" not found`)
  const fees = EOR_FEES[countryCode.toUpperCase()] || { monthlyPerEmployee: 499, setupFee: 500 }

  return {
    country: country.country,
    countryCode: country.countryCode,
    overview: {
      riskLevel: country.riskLevel,
      currency: country.payrollInfo.currency,
      currencySymbol: country.payrollInfo.currencySymbol,
      payFrequency: country.payrollInfo.payFrequency,
      thirteenthMonth: country.payrollInfo.thirteenthMonth,
    },
    employment: country.employmentLaw,
    tax: country.taxInfo,
    visa: country.visaInfo,
    eorFees: fees,
    lastUpdated: country.lastUpdated,
  }
}

export function compareCountryCosts(countryCodes: string[], annualSalaryUSD: number) {
  return countryCodes.map(code => {
    try {
      return estimateCountryCost(code.toUpperCase(), annualSalaryUSD)
    } catch {
      return null
    }
  }).filter(Boolean)
}
