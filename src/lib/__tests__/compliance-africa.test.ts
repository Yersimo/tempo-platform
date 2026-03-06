import { describe, it, expect, vi } from 'vitest'

// Mock the database module before importing compliance
vi.mock('@/lib/db', () => ({
  db: {},
  schema: {
    employees: { id: 'id', orgId: 'org_id', country: 'country', jobTitle: 'job_title', isActive: 'is_active' },
    leaveRequests: { orgId: 'org_id', status: 'status' },
    salaryReviews: { orgId: 'org_id', status: 'status', employeeId: 'employee_id', currentSalary: 'current_salary', proposedSalary: 'proposed_salary', currency: 'currency', createdAt: 'created_at' },
    departments: { orgId: 'org_id' },
  },
}))

import { getApplicableRules } from '../compliance'

const AFRICAN_COUNTRIES = [
  'CM', 'TD', 'CF', 'CG', 'GA', 'GQ',
  'BJ', 'BF', 'CI', 'ML', 'NE', 'SN', 'TG', 'GW',
  'RW', 'KE', 'BI', 'UG', 'TZ', 'ET', 'SS',
  'CD',
  'MW', 'ZM', 'ZW', 'MZ',
  'NG', 'GH', 'GN', 'LR', 'SL', 'GM', 'CV', 'ST',
]

describe('Compliance - African Country Rules', () => {
  it.each(AFRICAN_COUNTRIES)(
    'getApplicableRules returns rules for %s',
    (code) => {
      const rules = getApplicableRules([code])
      expect(rules.length).toBeGreaterThan(0)
      // Every returned rule should match the country's jurisdiction
      for (const rule of rules) {
        expect(rule.jurisdiction).toBe(code)
      }
    }
  )

  it('returns rules for all 35 African countries at once', () => {
    const rules = getApplicableRules(AFRICAN_COUNTRIES)
    // Should have at least 2 rules per country (overtime + annual leave at minimum)
    expect(rules.length).toBeGreaterThanOrEqual(AFRICAN_COUNTRIES.length * 2)

    // Check that all countries have representation
    const jurisdictions = new Set(rules.map(r => r.jurisdiction))
    for (const code of AFRICAN_COUNTRIES) {
      expect(jurisdictions.has(code)).toBe(true)
    }
  })

  it('includes France rules when FR is included', () => {
    const rules = getApplicableRules(['FR', 'NG'])
    const frRules = rules.filter(r => r.jurisdiction === 'FR')
    const ngRules = rules.filter(r => r.jurisdiction === 'NG')
    expect(frRules.length).toBeGreaterThan(0)
    expect(ngRules.length).toBeGreaterThan(0)
  })

  it('maps country names to ISO codes', () => {
    const rules = getApplicableRules(['NIGERIA', 'CAMEROON', 'KENYA'])
    const jurisdictions = new Set(rules.map(r => r.jurisdiction))
    expect(jurisdictions.has('NG')).toBe(true)
    expect(jurisdictions.has('CM')).toBe(true)
    expect(jurisdictions.has('KE')).toBe(true)
  })

  it('returns empty for unknown country', () => {
    const rules = getApplicableRules(['XX', 'ZZ'])
    expect(rules.length).toBe(0)
  })

  it('covers key rule categories per country', () => {
    // Nigeria should have minimum_wage, overtime, leave, termination
    const ngRules = getApplicableRules(['NG'])
    const categories = new Set(ngRules.map(r => r.category))
    expect(categories.has('minimum_wage')).toBe(true)
    expect(categories.has('overtime')).toBe(true)
    expect(categories.has('leave')).toBe(true)
    expect(categories.has('termination')).toBe(true)
  })
})
