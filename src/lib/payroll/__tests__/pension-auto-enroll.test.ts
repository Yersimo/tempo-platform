import { describe, it, expect } from 'vitest'
import {
  checkAutoEnrolmentEligibility,
  getAutoEnrolmentRules,
  getAutoEnrolmentCountries,
} from '../pension-auto-enroll'

function makeEmployee(overrides: Partial<Parameters<typeof checkAutoEnrolmentEligibility>[0][0]> = {}) {
  return {
    id: 'emp-1',
    name: 'Test Employee',
    country: 'GH',
    dateOfBirth: '1990-05-15',
    startDate: '2022-01-01',
    monthlySalary: 500_000, // GHS 5,000 in cents
    pensionEnrolled: false,
    pensionOptedOut: false,
    ...overrides,
  }
}

const AS_OF = '2025-03-01'

describe('checkAutoEnrolmentEligibility', () => {
  describe('Ghana — mandatory SSNIT', () => {
    it('marks eligible employee for mandatory enrolment', () => {
      const result = checkAutoEnrolmentEligibility([makeEmployee()], AS_OF)
      expect(result.totalEligible).toBe(1)
      expect(result.newEnrolments).toBe(1)
      expect(result.employees[0].eligible).toBe(true)
      expect(result.employees[0].schemeName).toContain('SSNIT')
      expect(result.employees[0].reason).toContain('Mandatory')
    })

    it('does not allow opt-out for Ghana', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ pensionOptedOut: true })],
        AS_OF,
      )
      // Ghana does not allow opt-out, so employee is still eligible
      expect(result.employees[0].eligible).toBe(true)
      expect(result.employees[0].reason).toContain('Mandatory')
    })

    it('reports already enrolled employees', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ pensionEnrolled: true })],
        AS_OF,
      )
      expect(result.alreadyEnrolled).toBe(1)
      expect(result.newEnrolments).toBe(0)
      expect(result.employees[0].alreadyEnrolled).toBe(true)
    })
  })

  describe('age checks', () => {
    it('rejects employee below minimum age (Ghana: 15)', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ dateOfBirth: '2015-06-01' })], // ~9 years old
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(false)
      expect(result.employees[0].reason).toContain('Age')
    })

    it('rejects employee above maximum age (Ghana: 60)', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ dateOfBirth: '1960-01-01' })], // ~65 years old
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(false)
      expect(result.employees[0].reason).toContain('Age')
    })
  })

  describe('UK — earnings threshold and opt-out', () => {
    it('rejects employee below earnings threshold', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'UK', monthlySalary: 50_000, dateOfBirth: '1990-01-01' })], // below 83334
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(false)
      expect(result.employees[0].reason).toContain('earnings')
    })

    it('allows opt-out for UK employees', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'UK', pensionOptedOut: true, monthlySalary: 200_000, dateOfBirth: '1990-01-01' })],
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(true)
      expect(result.employees[0].reason).toContain('opted out')
    })

    it('sets opt-out deadline for eligible UK employee', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'UK', monthlySalary: 200_000, dateOfBirth: '1990-01-01' })],
        AS_OF,
      )
      expect(result.employees[0].optOutDeadline).toBeDefined()
    })
  })

  describe('US — tenure requirement', () => {
    it('rejects employee with insufficient tenure', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'US', startDate: '2025-01-01', dateOfBirth: '1990-01-01' })], // ~60 days tenure
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(false)
      expect(result.employees[0].reason).toContain('Tenure')
    })

    it('accepts employee with sufficient tenure', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'US', startDate: '2023-01-01', dateOfBirth: '1990-01-01' })],
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(true)
    })
  })

  describe('unknown country', () => {
    it('marks as ineligible with no rules configured', () => {
      const result = checkAutoEnrolmentEligibility(
        [makeEmployee({ country: 'XX' })],
        AS_OF,
      )
      expect(result.employees[0].eligible).toBe(false)
      expect(result.employees[0].reason).toContain('No auto-enrolment rules')
    })
  })

  describe('multiple employees', () => {
    it('processes batch and returns correct counts', () => {
      const employees = [
        makeEmployee({ id: 'emp-1', name: 'Alice', pensionEnrolled: true }),
        makeEmployee({ id: 'emp-2', name: 'Bob', pensionEnrolled: false }),
        makeEmployee({ id: 'emp-3', name: 'Charlie', country: 'XX' }),
      ]
      const result = checkAutoEnrolmentEligibility(employees, AS_OF)
      expect(result.alreadyEnrolled).toBe(1)
      expect(result.newEnrolments).toBe(1)
      expect(result.ineligible).toBe(1)
      expect(result.employees).toHaveLength(3)
    })
  })
})

describe('getAutoEnrolmentRules', () => {
  it('returns rules for Ghana', () => {
    const rules = getAutoEnrolmentRules('GH')!
    expect(rules).not.toBeNull()
    expect(rules.schemeName).toContain('SSNIT')
    expect(rules.mandatory).toBe(true)
    expect(rules.optOutAllowed).toBe(false)
  })

  it('returns null for unsupported country', () => {
    expect(getAutoEnrolmentRules('XX')).toBeNull()
  })
})

describe('getAutoEnrolmentCountries', () => {
  it('includes major African and international markets', () => {
    const countries = getAutoEnrolmentCountries()
    expect(countries).toContain('GH')
    expect(countries).toContain('NG')
    expect(countries).toContain('KE')
    expect(countries).toContain('UK')
    expect(countries).toContain('US')
  })
})
