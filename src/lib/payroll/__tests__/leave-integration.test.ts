import { describe, it, expect } from 'vitest'
import {
  calculateLeavePayrollImpact,
  getStatutoryPayRates,
  getWorkingDaysPerMonth,
  type LeaveRecord,
} from '../leave-integration'

const MONTHLY_GROSS = 1_000_000 // 10,000 in cents (GHS)

function makeLeave(overrides: Partial<LeaveRecord> & { type: LeaveRecord['type'] }): LeaveRecord {
  return {
    id: 'leave-1',
    employeeId: 'emp-1',
    startDate: '2025-03-03',
    endDate: '2025-03-07',
    days: 5,
    status: 'approved',
    ...overrides,
  }
}

describe('calculateLeavePayrollImpact', () => {
  const period = { start: '2025-03-01', end: '2025-03-31' }

  describe('annual / personal / bereavement leave', () => {
    it('is fully paid with no deduction', () => {
      const leaves = [makeLeave({ type: 'annual' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.leaveDeduction).toBe(0)
      expect(result.paidLeaveDays).toBeGreaterThan(0)
      expect(result.payType).toBe('full_month')
    })
  })

  describe('unpaid leave', () => {
    it('deducts daily rate for each business day', () => {
      const leaves = [makeLeave({ type: 'unpaid' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.unpaidLeaveDays).toBeGreaterThan(0)
      expect(result.leaveDeduction).toBeGreaterThan(0)
      expect(result.payType).toBe('unpaid_leave')
    })
  })

  describe('sick leave — Ghana (full pay)', () => {
    it('applies no deduction when statutory rate is 100%', () => {
      const leaves = [makeLeave({ type: 'sick' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.leaveDeduction).toBe(0)
      expect(result.paidLeaveDays).toBeGreaterThan(0)
    })
  })

  describe('sick leave — Kenya (50% pay)', () => {
    it('deducts 50% of daily rate', () => {
      const leaves = [makeLeave({ type: 'sick' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'KE', period.start, period.end)
      expect(result.leaveDeduction).toBeGreaterThan(0)
      expect(result.statutoryPayDays).toBeGreaterThan(0)
      // Deduction should be roughly half the full daily cost
      const dailyRate = MONTHLY_GROSS / 22
      const businessDays = result.statutoryPayDays
      const expectedDeduction = Math.round(dailyRate * businessDays * 0.5)
      expect(result.leaveDeduction).toBe(expectedDeduction)
    })
  })

  describe('sick leave — US (no statutory pay)', () => {
    it('deducts full daily rate', () => {
      const leaves = [makeLeave({ type: 'sick' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'US', period.start, period.end)
      expect(result.unpaidLeaveDays).toBeGreaterThan(0)
      expect(result.leaveDeduction).toBeGreaterThan(0)
    })
  })

  describe('maternity leave', () => {
    it('applies full pay for Ghana', () => {
      const leaves = [makeLeave({ type: 'maternity', startDate: '2025-03-01', endDate: '2025-03-31' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.leaveDeduction).toBe(0)
      expect(result.payType).toBe('maternity')
    })

    it('applies 50% for Nigeria', () => {
      const leaves = [makeLeave({ type: 'maternity', startDate: '2025-03-01', endDate: '2025-03-31' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'NG', period.start, period.end)
      expect(result.leaveDeduction).toBeGreaterThan(0)
      expect(result.payType).toBe('maternity')
    })
  })

  describe('paternity leave — Kenya (full pay)', () => {
    it('applies no deduction', () => {
      const leaves = [makeLeave({ type: 'paternity' })]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'KE', period.start, period.end)
      expect(result.leaveDeduction).toBe(0)
      expect(result.payType).toBe('paternity')
    })
  })

  describe('non-approved leaves', () => {
    it('ignores pending and rejected leaves', () => {
      const leaves = [
        makeLeave({ type: 'unpaid', status: 'pending' }),
        makeLeave({ type: 'unpaid', status: 'rejected' }),
      ]
      const result = calculateLeavePayrollImpact(leaves, MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.totalLeaveDays).toBe(0)
      expect(result.leaveDeduction).toBe(0)
      expect(result.payType).toBe('full_month')
    })
  })

  describe('no leave records', () => {
    it('returns full_month with zero deductions', () => {
      const result = calculateLeavePayrollImpact([], MONTHLY_GROSS, 'GH', period.start, period.end)
      expect(result.payType).toBe('full_month')
      expect(result.leaveDeduction).toBe(0)
      expect(result.totalLeaveDays).toBe(0)
    })
  })
})

describe('getStatutoryPayRates', () => {
  it('returns rates for Ghana', () => {
    const rates = getStatutoryPayRates('GH')
    expect(rates.sick).toBe(1.0)
    expect(rates.maternity).toBe(1.0)
  })

  it('returns zero rates for unknown country', () => {
    const rates = getStatutoryPayRates('XX')
    expect(rates.sick).toBe(0)
    expect(rates.maternity).toBe(0)
  })
})

describe('getWorkingDaysPerMonth', () => {
  it('returns 22 for Ghana', () => {
    expect(getWorkingDaysPerMonth('GH')).toBe(22)
  })

  it('returns 21.67 for South Africa', () => {
    expect(getWorkingDaysPerMonth('ZA')).toBe(21.67)
  })

  it('defaults to 22 for unknown countries', () => {
    expect(getWorkingDaysPerMonth('XX')).toBe(22)
  })
})
