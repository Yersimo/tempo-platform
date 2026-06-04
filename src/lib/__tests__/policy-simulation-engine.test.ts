import { describe, expect, it } from 'vitest'
import { simulatePolicyChanges } from '../policy-simulation-engine'

describe('policy simulation engine', () => {
  it('simulates expense policy limit and receipt threshold impacts', () => {
    const report = simulatePolicyChanges({
      proposals: [{ id: 'expense-tighten-meals', domain: 'expense', title: 'Tighten meals policy', change: { category: 'Meals', daily_limit: 75, receipt_threshold: 25 } }],
      expenseReports: [
        { id: 'exp-1', items: [{ id: 'item-1', category: 'Meals', amount: 120 }] },
        { id: 'exp-2', items: [{ id: 'item-2', category: 'Travel', amount: 500 }] },
      ],
    })

    expect(report.impacts).toEqual([
      expect.objectContaining({
        domain: 'expense',
        severity: 'high',
        affectedEntityIds: ['exp-1'],
        projectedImpact: expect.stringContaining('1 report would breach'),
      }),
    ])
    expect(report.impacts[0].safetyChecks).toContain('Do not auto-reject existing submitted reports')
  })

  it('simulates payroll and travel cost changes', () => {
    const report = simulatePolicyChanges({
      proposals: [
        { id: 'payroll-benefit', domain: 'payroll', title: 'Employer pension contribution', change: { employer_cost_pct: 5 } },
        { id: 'travel-rate', domain: 'travel', title: 'Mileage rate update', change: { rate_per_km: 1 } },
      ],
      employees: [
        { id: 'emp-1', annual_salary: 80000, country: 'Ghana' },
        { id: 'emp-2', annual_salary: 50000, country: 'Kenya' },
      ],
      mileageLogs: [
        { id: 'ml-1', distance_km: 100, amount: 50 },
        { id: 'ml-2', distance_km: 50, amount: 25 },
      ],
    })

    expect(report.impacts.map(impact => impact.domain)).toEqual(['payroll', 'travel'])
    expect(report.impacts[0].requiredApprovals).toContain('Country compliance owner')
    expect(report.impacts.find(impact => impact.domain === 'travel')?.projectedImpact).toContain('75')
  })

  it('simulates workforce freeze and budget constraints', () => {
    const report = simulatePolicyChanges({
      proposals: [{ id: 'workforce-freeze', domain: 'workforce', title: 'Hiring freeze', change: { hiring_freeze: true, max_budget_utilization: 85 } }],
      headcountPlans: [
        { id: 'hc-1', status: 'pending_approval' },
        { id: 'hc-2', status: 'planned' },
      ],
      budgets: [
        { id: 'bud-1', total_amount: 1000, spent_amount: 900 },
        { id: 'bud-2', total_amount: 1000, spent_amount: 300 },
      ],
    })

    expect(report.impacts).toEqual([
      expect.objectContaining({
        domain: 'workforce',
        affectedEntityIds: ['hc-1', 'hc-2', 'bud-1'],
        requiredApprovals: expect.arrayContaining(['Executive sponsor']),
      }),
    ])
  })

  it('caps and sorts impacts by score', () => {
    const report = simulatePolicyChanges({
      maxImpacts: 2,
      proposals: [
        { id: 'expense', domain: 'expense', title: 'Expense policy', change: { category: 'Meals', daily_limit: 10 } },
        { id: 'payroll', domain: 'payroll', title: 'Payroll policy', change: { employerCostPct: 5 } },
        { id: 'workforce', domain: 'workforce', title: 'Workforce policy', change: { hiringFreeze: true } },
      ],
      expenseReports: [{ id: 'exp-1', items: [{ category: 'Meals', amount: 100 }] }],
      employees: [{ id: 'emp-1', annualSalary: 3000000, country: 'Ghana' }],
      headcountPlans: [{ id: 'hc-1', status: 'open' }],
    })

    expect(report.impacts).toHaveLength(2)
    expect(report.impacts.map(impact => impact.score)).toEqual([82, 78])
    expect(report.decisionSummary).toContain('highest impact')
  })

  it('returns an empty report when proposals have no material data', () => {
    const report = simulatePolicyChanges({
      proposals: [{ id: 'travel-empty', domain: 'travel', title: 'Travel rate', change: { rate_per_km: 0.7 } }],
      mileageLogs: [],
    })

    expect(report.totalImpacts).toBe(0)
    expect(report.impacts).toEqual([])
    expect(report.decisionSummary).toContain('No material')
  })
})
