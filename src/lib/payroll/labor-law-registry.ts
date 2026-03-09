/**
 * Labor Law Registry
 *
 * Single source of truth for labor law data across 36 countries:
 * 35 African countries + France.
 *
 * Covers minimum wage, working hours, overtime rules, leave entitlements,
 * employment terms, mandatory bonuses, and pay frequency.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MinimumWage {
  monthly: number
  annual: number
  currency: string
  notes?: string
}

export interface OvertimeRules {
  standardWeeklyHours: number
  maxWeeklyHours: number
  overtimeMultiplier: number     // Tier 1 (e.g. 1.25x, 1.35x, 1.5x)
  overtimeMultiplierTier2?: number // Tier 2 for extended hours
  tier2ThresholdHours?: number    // Weekly hours at which tier 2 kicks in
  sundayPremium?: number          // e.g. 2.0 for double pay
  holidayPremium?: number         // e.g. 2.0 for double pay
  nightPremium?: number           // e.g. 1.15 for 15% night bonus
}

export interface LeaveEntitlements {
  annualLeaveDays: number
  sickLeaveDays: number          // per year, 0 = unlimited/as-needed
  maternityLeaveWeeks: number
  paternityLeaveDays: number
  publicHolidays: number
}

export interface EmploymentTerms {
  probationMonths: number
  noticeWeeks: number            // minimum notice period
  severanceWeeksPerYear: number  // weeks of pay per year of service
}

export interface MandatoryBonuses {
  thirteenthMonth: boolean
  thirteenthMonthAmount: 'full_month' | 'half_month' | 'none'
  paymentMonth: number           // month number (12 = December)
}

export interface LaborLaw {
  country: string
  countryName: string
  currency: string
  minimumWage: MinimumWage
  overtime: OvertimeRules
  leave: LeaveEntitlements
  employment: EmploymentTerms
  bonuses: MandatoryBonuses
  payFrequency: 'monthly' | 'biweekly' | 'weekly'
}

// ---------------------------------------------------------------------------
// Registry: 36 countries
// ---------------------------------------------------------------------------

const LABOR_LAW_REGISTRY: Record<string, LaborLaw> = {
  // ═══ CEMAC Zone (Central Africa, XAF) ═══════════════════════════════════

  CM: {
    country: 'CM', countryName: 'Cameroon', currency: 'XAF',
    minimumWage: { monthly: 36270, annual: 435240, currency: 'XAF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.2, overtimeMultiplierTier2: 1.4, tier2ThresholdHours: 48, sundayPremium: 1.4, holidayPremium: 1.5, nightPremium: 1.15 },
    leave: { annualLeaveDays: 18, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 11 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  TD: {
    country: 'TD', countryName: 'Chad', currency: 'XAF',
    minimumWage: { monthly: 59995, annual: 719940, currency: 'XAF' },
    overtime: { standardWeeklyHours: 39, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  CF: {
    country: 'CF', countryName: 'Central African Republic', currency: 'XAF',
    minimumWage: { monthly: 35000, annual: 420000, currency: 'XAF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  CG: {
    country: 'CG', countryName: 'Republic of Congo', currency: 'XAF',
    minimumWage: { monthly: 90000, annual: 1080000, currency: 'XAF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 2.0, nightPremium: 1.1 },
    leave: { annualLeaveDays: 26, sickLeaveDays: 30, maternityLeaveWeeks: 15, paternityLeaveDays: 3, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GA: {
    country: 'GA', countryName: 'Gabon', currency: 'XAF',
    minimumWage: { monthly: 150000, annual: 1800000, currency: 'XAF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 2.0, nightPremium: 1.15 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 10, publicHolidays: 12 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 3 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GQ: {
    country: 'GQ', countryName: 'Equatorial Guinea', currency: 'XAF',
    minimumWage: { monthly: 129035, annual: 1548420, currency: 'XAF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 48, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 26, maternityLeaveWeeks: 12, paternityLeaveDays: 3, publicHolidays: 12 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ WAEMU Zone (West Africa, XOF) ═══════════════════════════════════

  BJ: {
    country: 'BJ', countryName: 'Benin', currency: 'XOF',
    minimumWage: { monthly: 52000, annual: 624000, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 56, overtimeMultiplier: 1.12, overtimeMultiplierTier2: 1.35, tier2ThresholdHours: 48, sundayPremium: 1.4, holidayPremium: 1.5 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 10 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  BF: {
    country: 'BF', countryName: 'Burkina Faso', currency: 'XOF',
    minimumWage: { monthly: 34664, annual: 415968, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.15, overtimeMultiplierTier2: 1.35, tier2ThresholdHours: 46, sundayPremium: 1.6, holidayPremium: 1.6 },
    leave: { annualLeaveDays: 30, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 12 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  CI: {
    country: 'CI', countryName: "Côte d'Ivoire", currency: 'XOF',
    minimumWage: { monthly: 75000, annual: 900000, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.15, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 46, sundayPremium: 1.75, holidayPremium: 2.0, nightPremium: 1.5 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 14 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  ML: {
    country: 'ML', countryName: 'Mali', currency: 'XOF',
    minimumWage: { monthly: 40000, annual: 480000, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.1, overtimeMultiplierTier2: 1.35, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 1.5 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 3, publicHolidays: 13 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  NE: {
    country: 'NE', countryName: 'Niger', currency: 'XOF',
    minimumWage: { monthly: 30047, annual: 360564, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.1, overtimeMultiplierTier2: 1.35, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 1.6 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 1, publicHolidays: 10 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  SN: {
    country: 'SN', countryName: 'Senegal', currency: 'XOF',
    minimumWage: { monthly: 58900, annual: 706800, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.1, overtimeMultiplierTier2: 1.35, tier2ThresholdHours: 48, sundayPremium: 1.5, holidayPremium: 1.6 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 1, publicHolidays: 14 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  TG: {
    country: 'TG', countryName: 'Togo', currency: 'XOF',
    minimumWage: { monthly: 52500, annual: 630000, currency: 'XOF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.2, overtimeMultiplierTier2: 1.4, tier2ThresholdHours: 48, sundayPremium: 1.65, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 2, publicHolidays: 10 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GW: {
    country: 'GW', countryName: 'Guinea-Bissau', currency: 'XOF',
    minimumWage: { monthly: 19030, annual: 228360, currency: 'XOF' },
    overtime: { standardWeeklyHours: 45, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 12, paternityLeaveDays: 1, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ East Africa ═══════════════════════════════════════════════════════

  RW: {
    country: 'RW', countryName: 'Rwanda', currency: 'RWF',
    minimumWage: { monthly: 0, annual: 0, currency: 'RWF', notes: 'No statutory minimum wage; sector-specific rates apply' },
    overtime: { standardWeeklyHours: 45, maxWeeklyHours: 50, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 18, sickLeaveDays: 30, maternityLeaveWeeks: 12, paternityLeaveDays: 4, publicHolidays: 12 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  KE: {
    country: 'KE', countryName: 'Kenya', currency: 'KES',
    minimumWage: { monthly: 15201, annual: 182412, currency: 'KES', notes: 'General labourer rate (Nairobi)' },
    overtime: { standardWeeklyHours: 45, maxWeeklyHours: 52, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 21, sickLeaveDays: 30, maternityLeaveWeeks: 13, paternityLeaveDays: 14, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  BI: {
    country: 'BI', countryName: 'Burundi', currency: 'BIF',
    minimumWage: { monthly: 3120, annual: 37440, currency: 'BIF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 45, overtimeMultiplier: 1.35, sundayPremium: 2.0, holidayPremium: 2.0, nightPremium: 1.35 },
    leave: { annualLeaveDays: 18, sickLeaveDays: 30, maternityLeaveWeeks: 12, paternityLeaveDays: 3, publicHolidays: 13 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  UG: {
    country: 'UG', countryName: 'Uganda', currency: 'UGX',
    minimumWage: { monthly: 130000, annual: 1560000, currency: 'UGX', notes: 'Sector-specific; no general statutory minimum since 1984' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 21, sickLeaveDays: 30, maternityLeaveWeeks: 13, paternityLeaveDays: 4, publicHolidays: 11 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  TZ: {
    country: 'TZ', countryName: 'Tanzania', currency: 'TZS',
    minimumWage: { monthly: 400000, annual: 4800000, currency: 'TZS', notes: 'Private sector general rate' },
    overtime: { standardWeeklyHours: 45, maxWeeklyHours: 50, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 28, sickLeaveDays: 63, maternityLeaveWeeks: 12, paternityLeaveDays: 3, publicHolidays: 15 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  ET: {
    country: 'ET', countryName: 'Ethiopia', currency: 'ETB',
    minimumWage: { monthly: 0, annual: 0, currency: 'ETB', notes: 'No statutory minimum wage for private sector; government servants min ~ETB 420/month' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 52, sundayPremium: 2.0, holidayPremium: 2.5, nightPremium: 1.5 },
    leave: { annualLeaveDays: 16, sickLeaveDays: 30, maternityLeaveWeeks: 16, paternityLeaveDays: 3, publicHolidays: 13 },
    employment: { probationMonths: 2, noticeWeeks: 4, severanceWeeksPerYear: 4 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  SS: {
    country: 'SS', countryName: 'South Sudan', currency: 'SSP',
    minimumWage: { monthly: 600, annual: 7200, currency: 'SSP' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 20, sickLeaveDays: 30, maternityLeaveWeeks: 12, paternityLeaveDays: 3, publicHolidays: 10 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ Central/Great Lakes ═══════════════════════════════════════════════

  CD: {
    country: 'CD', countryName: 'DR Congo', currency: 'CDF',
    minimumWage: { monthly: 7075, annual: 84900, currency: 'CDF' },
    overtime: { standardWeeklyHours: 45, maxWeeklyHours: 48, overtimeMultiplier: 1.3, overtimeMultiplierTier2: 1.6, tier2ThresholdHours: 48, sundayPremium: 2.0, holidayPremium: 2.0, nightPremium: 1.25 },
    leave: { annualLeaveDays: 12, sickLeaveDays: 30, maternityLeaveWeeks: 14, paternityLeaveDays: 2, publicHolidays: 9 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ Southern Africa ═══════════════════════════════════════════════════

  MW: {
    country: 'MW', countryName: 'Malawi', currency: 'MWK',
    minimumWage: { monthly: 50000, annual: 600000, currency: 'MWK' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 18, sickLeaveDays: 30, maternityLeaveWeeks: 8, paternityLeaveDays: 0, publicHolidays: 12 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  ZM: {
    country: 'ZM', countryName: 'Zambia', currency: 'ZMW',
    minimumWage: { monthly: 2100, annual: 25200, currency: 'ZMW', notes: 'General workers minimum' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 24, sickLeaveDays: 26, maternityLeaveWeeks: 12, paternityLeaveDays: 5, publicHolidays: 11 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  ZW: {
    country: 'ZW', countryName: 'Zimbabwe', currency: 'ZWL',
    minimumWage: { monthly: 85000, annual: 1020000, currency: 'ZWL', notes: 'Varies by industry/NEC' },
    overtime: { standardWeeklyHours: 44, maxWeeklyHours: 54, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 90, maternityLeaveWeeks: 14, paternityLeaveDays: 0, publicHolidays: 12 },
    employment: { probationMonths: 3, noticeWeeks: 12, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'half_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  MZ: {
    country: 'MZ', countryName: 'Mozambique', currency: 'MZN',
    minimumWage: { monthly: 6050, annual: 72600, currency: 'MZN', notes: 'Varies by sector; general commerce rate' },
    overtime: { standardWeeklyHours: 44, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 12, sickLeaveDays: 30, maternityLeaveWeeks: 8, paternityLeaveDays: 1, publicHolidays: 9 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ West Africa (non-WAEMU) ═══════════════════════════════════════════

  NG: {
    country: 'NG', countryName: 'Nigeria', currency: 'NGN',
    minimumWage: { monthly: 30000, annual: 360000, currency: 'NGN' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 6, sickLeaveDays: 12, maternityLeaveWeeks: 12, paternityLeaveDays: 0, publicHolidays: 11 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 0 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GH: {
    country: 'GH', countryName: 'Ghana', currency: 'GHS',
    minimumWage: { monthly: 530, annual: 6360, currency: 'GHS', notes: 'Daily rate: GHS 18.15 × 29.25 working days' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 15, sickLeaveDays: 0, maternityLeaveWeeks: 12, paternityLeaveDays: 0, publicHolidays: 13 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GN: {
    country: 'GN', countryName: 'Guinea', currency: 'GNF',
    minimumWage: { monthly: 440000, annual: 5280000, currency: 'GNF' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.3, overtimeMultiplierTier2: 1.6, tier2ThresholdHours: 48, sundayPremium: 1.6, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 26, maternityLeaveWeeks: 14, paternityLeaveDays: 2, publicHolidays: 11 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  LR: {
    country: 'LR', countryName: 'Liberia', currency: 'LRD',
    minimumWage: { monthly: 6000, annual: 72000, currency: 'LRD' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 15, sickLeaveDays: 0, maternityLeaveWeeks: 12, paternityLeaveDays: 0, publicHolidays: 11 },
    employment: { probationMonths: 3, noticeWeeks: 2, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  SL: {
    country: 'SL', countryName: 'Sierra Leone', currency: 'SLL',
    minimumWage: { monthly: 600000, annual: 7200000, currency: 'SLL' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 19, sickLeaveDays: 0, maternityLeaveWeeks: 12, paternityLeaveDays: 0, publicHolidays: 10 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  GM: {
    country: 'GM', countryName: 'Gambia', currency: 'GMD',
    minimumWage: { monthly: 3000, annual: 36000, currency: 'GMD' },
    overtime: { standardWeeklyHours: 48, maxWeeklyHours: 56, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 21, sickLeaveDays: 14, maternityLeaveWeeks: 12, paternityLeaveDays: 0, publicHolidays: 13 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  CV: {
    country: 'CV', countryName: 'Cape Verde', currency: 'CVE',
    minimumWage: { monthly: 14000, annual: 168000, currency: 'CVE' },
    overtime: { standardWeeklyHours: 44, maxWeeklyHours: 48, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 9, paternityLeaveDays: 5, publicHolidays: 9 },
    employment: { probationMonths: 6, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  ST: {
    country: 'ST', countryName: 'São Tomé and Príncipe', currency: 'STN',
    minimumWage: { monthly: 2500, annual: 30000, currency: 'STN' },
    overtime: { standardWeeklyHours: 40, maxWeeklyHours: 44, overtimeMultiplier: 1.5, sundayPremium: 2.0, holidayPremium: 2.0 },
    leave: { annualLeaveDays: 22, sickLeaveDays: 30, maternityLeaveWeeks: 10, paternityLeaveDays: 3, publicHolidays: 7 },
    employment: { probationMonths: 3, noticeWeeks: 4, severanceWeeksPerYear: 2 },
    bonuses: { thirteenthMonth: true, thirteenthMonthAmount: 'full_month', paymentMonth: 12 },
    payFrequency: 'monthly',
  },

  // ═══ France ═══════════════════════════════════════════════════════════

  FR: {
    country: 'FR', countryName: 'France', currency: 'EUR',
    minimumWage: { monthly: 1766, annual: 21192, currency: 'EUR', notes: 'SMIC 2025: €11.65/hour brut' },
    overtime: { standardWeeklyHours: 35, maxWeeklyHours: 48, overtimeMultiplier: 1.25, overtimeMultiplierTier2: 1.5, tier2ThresholdHours: 43, sundayPremium: 2.0, holidayPremium: 2.0, nightPremium: 1.25 },
    leave: { annualLeaveDays: 25, sickLeaveDays: 0, maternityLeaveWeeks: 16, paternityLeaveDays: 25, publicHolidays: 11 },
    employment: { probationMonths: 4, noticeWeeks: 4, severanceWeeksPerYear: 3 },
    bonuses: { thirteenthMonth: false, thirteenthMonthAmount: 'none', paymentMonth: 12 },
    payFrequency: 'monthly',
  },
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Get the full labor law data for a country.
 */
export function getLaborLaw(countryCode: string): LaborLaw | null {
  return LABOR_LAW_REGISTRY[countryCode] ?? null
}

/**
 * Get minimum wage for a country. Returns null if country not in registry.
 */
export function getMinimumWage(countryCode: string): MinimumWage | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  return law?.minimumWage ?? null
}

/**
 * Get overtime rules for a country.
 */
export function getOvertimeRules(countryCode: string): OvertimeRules | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  return law?.overtime ?? null
}

/**
 * Get leave entitlements for a country.
 */
export function getLeaveEntitlements(countryCode: string): LeaveEntitlements | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  return law?.leave ?? null
}

/**
 * Get mandatory bonus rules (e.g. 13th month) for a country.
 */
export function getMandatoryBonuses(countryCode: string): MandatoryBonuses | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  return law?.bonuses ?? null
}

/**
 * Generate a leave policy configuration for a country (for time-off module integration).
 */
export function generateCountryLeavePolicy(countryCode: string): {
  annualLeave: { days: number; accrualPeriod: 'monthly' | 'yearly' }
  sickLeave: { days: number }
  maternityLeave: { weeks: number }
  paternityLeave: { days: number }
  publicHolidays: number
} | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  if (!law) return null

  return {
    annualLeave: {
      days: law.leave.annualLeaveDays,
      accrualPeriod: 'monthly',
    },
    sickLeave: { days: law.leave.sickLeaveDays },
    maternityLeave: { weeks: law.leave.maternityLeaveWeeks },
    paternityLeave: { days: law.leave.paternityLeaveDays },
    publicHolidays: law.leave.publicHolidays,
  }
}

/**
 * Get maternity/paternity statutory pay rules for a country.
 * Returns weeks and pay rate (as a fraction of normal salary).
 */
export interface MaternityPaternityRules {
  maternityWeeks: number
  maternityPayRate: number   // 1.0 = full pay, 0.67 = 2/3 pay
  paternityDays: number
  paternityPayRate: number
}

const MATERNITY_PAY_OVERRIDES: Record<string, { maternityPayRate: number; paternityPayRate: number }> = {
  KE: { maternityPayRate: 1.0, paternityPayRate: 1.0 },        // 3 months full pay
  NG: { maternityPayRate: 1.0, paternityPayRate: 1.0 },        // 12 weeks full pay
  GH: { maternityPayRate: 1.0, paternityPayRate: 1.0 },        // 12 weeks full pay
  ZA: { maternityPayRate: 0.67, paternityPayRate: 1.0 },       // UIF covers ~67%
  TZ: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  UG: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  RW: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  ET: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  EG: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  CM: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  CI: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  SN: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
  FR: { maternityPayRate: 1.0, paternityPayRate: 1.0 },
}

export function getMaternityPaternityRules(countryCode: string): MaternityPaternityRules | null {
  const law = LABOR_LAW_REGISTRY[countryCode]
  if (!law) return null

  const overrides = MATERNITY_PAY_OVERRIDES[countryCode]
  return {
    maternityWeeks: law.leave.maternityLeaveWeeks,
    maternityPayRate: overrides?.maternityPayRate ?? 1.0,
    paternityDays: law.leave.paternityLeaveDays,
    paternityPayRate: overrides?.paternityPayRate ?? 1.0,
  }
}

/**
 * Get all country codes in the labor law registry.
 */
export function getAllLaborLawCountries(): string[] {
  return Object.keys(LABOR_LAW_REGISTRY)
}
