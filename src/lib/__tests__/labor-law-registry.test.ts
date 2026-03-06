import { describe, it, expect } from 'vitest'
import {
  getLaborLaw,
  getMinimumWage,
  getOvertimeRules,
  getLeaveEntitlements,
  getMandatoryBonuses,
  generateCountryLeavePolicy,
  getAllLaborLawCountries,
} from '../payroll/labor-law-registry'

// All 35 countries (34 unique African + France; Nigeria was listed twice in original spec)
const ALL_COUNTRIES = [
  'CM', 'TD', 'CF', 'CG', 'GA', 'GQ', // CEMAC
  'BJ', 'BF', 'CI', 'ML', 'NE', 'SN', 'TG', 'GW', // WAEMU
  'RW', 'KE', 'BI', 'UG', 'TZ', 'ET', 'SS', // East Africa
  'CD', // Great Lakes
  'MW', 'ZM', 'ZW', 'MZ', // Southern Africa
  'NG', 'GH', 'GN', 'LR', 'SL', 'GM', 'CV', 'ST', // West Africa (non-WAEMU)
  'FR', // France
]

describe('Labor Law Registry', () => {
  describe('Coverage - all 35 countries present', () => {
    it('has all 35 target countries in the registry', () => {
      const registeredCountries = getAllLaborLawCountries()
      expect(registeredCountries).toHaveLength(35)
      for (const code of ALL_COUNTRIES) {
        expect(registeredCountries).toContain(code)
      }
    })

    it.each(ALL_COUNTRIES)('getLaborLaw(%s) returns complete entry', (code) => {
      const law = getLaborLaw(code)
      expect(law).not.toBeNull()
      expect(law!.country).toBe(code)
      expect(law!.currency).toBeTruthy()
      expect(law!.countryName).toBeTruthy()
      // Verify all sub-objects exist
      expect(law!.minimumWage).toBeDefined()
      expect(law!.overtime).toBeDefined()
      expect(law!.leave).toBeDefined()
      expect(law!.employment).toBeDefined()
      expect(law!.bonuses).toBeDefined()
      expect(law!.payFrequency).toBe('monthly')
    })
  })

  describe('France (FR) - spot checks', () => {
    it('has 35-hour work week', () => {
      const ot = getOvertimeRules('FR')
      expect(ot).not.toBeNull()
      expect(ot!.standardWeeklyHours).toBe(35)
      expect(ot!.maxWeeklyHours).toBe(48)
    })

    it('has 1.25x overtime, 1.5x tier 2', () => {
      const ot = getOvertimeRules('FR')
      expect(ot!.overtimeMultiplier).toBe(1.25)
      expect(ot!.overtimeMultiplierTier2).toBe(1.5)
      expect(ot!.tier2ThresholdHours).toBe(43)
    })

    it('has 25 days annual leave', () => {
      const leave = getLeaveEntitlements('FR')
      expect(leave).not.toBeNull()
      expect(leave!.annualLeaveDays).toBe(25)
    })

    it('has 25 days paternity leave', () => {
      const leave = getLeaveEntitlements('FR')
      expect(leave!.paternityLeaveDays).toBe(25)
    })

    it('has SMIC minimum wage ~21K EUR', () => {
      const mw = getMinimumWage('FR')
      expect(mw).not.toBeNull()
      expect(mw!.currency).toBe('EUR')
      expect(mw!.annual).toBeGreaterThan(20000)
      expect(mw!.annual).toBeLessThan(25000)
    })

    it('has no mandatory 13th month', () => {
      const bonuses = getMandatoryBonuses('FR')
      expect(bonuses!.thirteenthMonth).toBe(false)
    })
  })

  describe('Nigeria (NG) - spot checks', () => {
    it('has NGN 30,000 monthly minimum wage', () => {
      const mw = getMinimumWage('NG')
      expect(mw).not.toBeNull()
      expect(mw!.monthly).toBe(30000)
      expect(mw!.annual).toBe(360000)
      expect(mw!.currency).toBe('NGN')
    })

    it('has 1.5x overtime multiplier', () => {
      const ot = getOvertimeRules('NG')
      expect(ot!.overtimeMultiplier).toBe(1.5)
      expect(ot!.standardWeeklyHours).toBe(40)
    })

    it('has 6 days annual leave', () => {
      const leave = getLeaveEntitlements('NG')
      expect(leave!.annualLeaveDays).toBe(6)
    })

    it('has mandatory 13th month salary', () => {
      const bonuses = getMandatoryBonuses('NG')
      expect(bonuses!.thirteenthMonth).toBe(true)
      expect(bonuses!.thirteenthMonthAmount).toBe('full_month')
      expect(bonuses!.paymentMonth).toBe(12)
    })
  })

  describe('Kenya (KE) - spot checks', () => {
    it('has 21 days annual leave', () => {
      const leave = getLeaveEntitlements('KE')
      expect(leave!.annualLeaveDays).toBe(21)
    })

    it('has 14 days paternity leave', () => {
      const leave = getLeaveEntitlements('KE')
      expect(leave!.paternityLeaveDays).toBe(14)
    })

    it('has 1.5x overtime', () => {
      const ot = getOvertimeRules('KE')
      expect(ot!.overtimeMultiplier).toBe(1.5)
      expect(ot!.standardWeeklyHours).toBe(45)
    })
  })

  describe('Gabon (GA) - 13th month required', () => {
    it('has mandatory 13th month', () => {
      const bonuses = getMandatoryBonuses('GA')
      expect(bonuses!.thirteenthMonth).toBe(true)
      expect(bonuses!.thirteenthMonthAmount).toBe('full_month')
    })
  })

  describe('Zimbabwe (ZW) - half month 13th', () => {
    it('has half-month 13th month bonus', () => {
      const bonuses = getMandatoryBonuses('ZW')
      expect(bonuses!.thirteenthMonth).toBe(true)
      expect(bonuses!.thirteenthMonthAmount).toBe('half_month')
    })
  })

  describe('generateCountryLeavePolicy()', () => {
    it('returns null for unknown country', () => {
      expect(generateCountryLeavePolicy('XX')).toBeNull()
    })

    it('returns correct structure for KE', () => {
      const policy = generateCountryLeavePolicy('KE')
      expect(policy).not.toBeNull()
      expect(policy!.annualLeave.days).toBe(21)
      expect(policy!.annualLeave.accrualPeriod).toBe('monthly')
      expect(policy!.maternityLeave.weeks).toBe(13)
      expect(policy!.paternityLeave.days).toBe(14)
      expect(policy!.publicHolidays).toBe(10)
    })
  })

  describe('Data integrity', () => {
    it.each(ALL_COUNTRIES)('%s has positive weekly hours', (code) => {
      const ot = getOvertimeRules(code)
      expect(ot!.standardWeeklyHours).toBeGreaterThan(0)
      expect(ot!.maxWeeklyHours).toBeGreaterThanOrEqual(ot!.standardWeeklyHours)
    })

    it.each(ALL_COUNTRIES)('%s has overtime multiplier >= 1.0', (code) => {
      const ot = getOvertimeRules(code)
      expect(ot!.overtimeMultiplier).toBeGreaterThanOrEqual(1.0)
    })

    it.each(ALL_COUNTRIES)('%s has non-negative annual leave', (code) => {
      const leave = getLeaveEntitlements(code)
      expect(leave!.annualLeaveDays).toBeGreaterThanOrEqual(0)
    })

    it.each(ALL_COUNTRIES)('%s has maternity leave >= 8 weeks', (code) => {
      const leave = getLeaveEntitlements(code)
      expect(leave!.maternityLeaveWeeks).toBeGreaterThanOrEqual(8)
    })
  })
})
