import { describe, it, expect } from 'vitest'
import { calculateFinalPay, getSeveranceRules, type FinalPayInput } from '../final-pay'

function makeInput(overrides: Partial<FinalPayInput> = {}): FinalPayInput {
  return {
    employeeId: 'emp-1',
    employeeName: 'Kwame Asante',
    lastWorkingDate: '2025-03-15',
    terminationDate: '2025-03-31',
    monthlySalary: 500_000, // GHS 5,000 in cents
    country: 'GH',
    currency: 'GHS',
    terminationType: 'resignation',
    unusedLeaveDays: 10,
    annualLeaveEntitlement: 21,
    noticePeriodDays: 30,
    noticePeriodServed: 30,
    payInLieuOfNotice: false,
    yearsOfService: 3,
    outstandingLoans: 0,
    outstandingAdvances: 0,
    assetRecovery: 0,
    otherDeductions: 0,
    otherDeductionNotes: '',
    ...overrides,
  }
}

describe('calculateFinalPay', () => {
  describe('pro-rated salary', () => {
    it('calculates based on working days in final month', () => {
      const result = calculateFinalPay(makeInput())
      expect(result.proRatedSalary).toBeGreaterThan(0)
      expect(result.proRatedDays).toBeLessThanOrEqual(22) // Ghana working days
    })
  })

  describe('unused leave payout', () => {
    it('pays out unused leave at daily rate', () => {
      const result = calculateFinalPay(makeInput({ unusedLeaveDays: 10 }))
      const dailyRate = 500_000 / 22 // Ghana
      expect(result.unusedLeavePayout).toBe(Math.round(dailyRate * 10))
      expect(result.unusedLeaveDays).toBe(10)
    })

    it('handles zero unused days', () => {
      const result = calculateFinalPay(makeInput({ unusedLeaveDays: 0 }))
      expect(result.unusedLeavePayout).toBe(0)
    })
  })

  describe('notice pay', () => {
    it('calculates pay in lieu when notice not fully served', () => {
      const result = calculateFinalPay(makeInput({
        noticePeriodDays: 30,
        noticePeriodServed: 10,
        payInLieuOfNotice: true,
      }))
      expect(result.noticePayDays).toBe(20)
      expect(result.noticePayAmount).toBeGreaterThan(0)
    })

    it('zero notice pay when fully served', () => {
      const result = calculateFinalPay(makeInput({
        noticePeriodDays: 30,
        noticePeriodServed: 30,
        payInLieuOfNotice: true,
      }))
      expect(result.noticePayDays).toBe(0)
      expect(result.noticePayAmount).toBe(0)
    })

    it('zero notice pay when payInLieuOfNotice is false', () => {
      const result = calculateFinalPay(makeInput({
        noticePeriodDays: 30,
        noticePeriodServed: 10,
        payInLieuOfNotice: false,
      }))
      expect(result.noticePayAmount).toBe(0)
    })
  })

  describe('severance — Ghana redundancy', () => {
    it('calculates 2 weeks per year of service', () => {
      const result = calculateFinalPay(makeInput({
        terminationType: 'redundancy',
        yearsOfService: 5,
      }))
      expect(result.severanceWeeks).toBe(10) // 2 * 5
      expect(result.severancePay).toBeGreaterThan(0)
    })

    it('no severance for resignation', () => {
      const result = calculateFinalPay(makeInput({
        terminationType: 'resignation',
        yearsOfService: 5,
      }))
      expect(result.severancePay).toBe(0)
      expect(result.severanceWeeks).toBe(0)
    })
  })

  describe('severance — Nigeria', () => {
    it('requires minimum 1 year of service', () => {
      const noSev = calculateFinalPay(makeInput({
        country: 'NG', currency: 'NGN',
        terminationType: 'redundancy', yearsOfService: 0,
      }))
      expect(noSev.severancePay).toBe(0)

      const withSev = calculateFinalPay(makeInput({
        country: 'NG', currency: 'NGN',
        terminationType: 'redundancy', yearsOfService: 3,
      }))
      expect(withSev.severancePay).toBeGreaterThan(0)
      expect(withSev.severanceWeeks).toBe(6) // 2 * 3
    })
  })

  describe('severance — UK cap', () => {
    it('caps at 30 weeks for long service', () => {
      const result = calculateFinalPay(makeInput({
        country: 'UK', currency: 'GBP',
        terminationType: 'redundancy', yearsOfService: 40,
      }))
      // UK: 1 week/year, cap 30 => 40 years capped to 30 weeks
      expect(result.severanceWeeks).toBe(30)
    })

    it('does not cap when below limit', () => {
      const result = calculateFinalPay(makeInput({
        country: 'UK', currency: 'GBP',
        terminationType: 'redundancy', yearsOfService: 25,
      }))
      // UK: 1 week/year * 25 = 25, under cap of 30
      expect(result.severanceWeeks).toBe(25)
    })
  })

  describe('Ghana gratuity (SSNF Tier 3)', () => {
    it('calculates 5% of total earnings over service period', () => {
      const result = calculateFinalPay(makeInput({
        yearsOfService: 5, monthlySalary: 500_000,
      }))
      // 500000 * 12 * 5 * 0.05 = 1,500,000
      expect(result.gratuitySSSF).toBe(1_500_000)
    })
  })

  describe('deductions', () => {
    it('subtracts tax, pension, loans, and other deductions', () => {
      const result = calculateFinalPay(makeInput({
        outstandingLoans: 100_000,
        outstandingAdvances: 50_000,
        assetRecovery: 25_000,
        otherDeductions: 10_000,
      }))
      expect(result.outstandingLoans).toBe(100_000)
      expect(result.outstandingAdvances).toBe(50_000)
      expect(result.assetRecovery).toBe(25_000)
      expect(result.otherDeductions).toBe(10_000)
      expect(result.totalDeductions).toBeGreaterThan(185_000) // 100k+50k+25k+10k + tax + pension
      expect(result.netFinalPay).toBe(result.totalEarnings - result.totalDeductions)
    })
  })

  describe('net final pay', () => {
    it('equals totalEarnings minus totalDeductions', () => {
      const result = calculateFinalPay(makeInput())
      expect(result.netFinalPay).toBe(result.totalEarnings - result.totalDeductions)
    })
  })

  describe('breakdown', () => {
    it('contains earning and deduction line items', () => {
      const result = calculateFinalPay(makeInput({ terminationType: 'redundancy' }))
      const earnings = result.breakdown.filter(b => b.category === 'earning')
      const deductions = result.breakdown.filter(b => b.category === 'deduction')
      expect(earnings.length).toBeGreaterThanOrEqual(1)
      expect(deductions.length).toBeGreaterThanOrEqual(2) // tax + pension
    })
  })
})

describe('getSeveranceRules', () => {
  it('returns rules for Ghana', () => {
    const rules = getSeveranceRules('GH')
    expect(rules.weeksPerYear).toBe(2)
    expect(rules.types).toContain('redundancy')
  })

  it('returns zero for US (no federal requirement)', () => {
    const rules = getSeveranceRules('US')
    expect(rules.weeksPerYear).toBe(0)
    expect(rules.types).toHaveLength(0)
  })

  it('returns default for unknown country', () => {
    const rules = getSeveranceRules('XX')
    expect(rules.weeksPerYear).toBe(0)
  })
})
