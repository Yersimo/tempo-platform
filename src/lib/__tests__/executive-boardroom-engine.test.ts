import { describe, expect, it } from 'vitest'
import { buildExecutiveBoardroomPack } from '../executive-boardroom-engine'

const now = '2026-03-01T09:00:00Z'

describe('executive boardroom engine', () => {
  it('builds board-ready risks and decision asks across workforce, finance, and compliance', () => {
    const pack = buildExecutiveBoardroomPack({
      now,
      period: '2026-Q1',
      employees: [
        { id: 'emp-1', is_active: true, attrition_risk: 'critical' },
        { id: 'emp-2', is_active: true, attrition_risk: 'high' },
        { id: 'emp-3', is_active: true },
      ],
      budgets: [{ id: 'bud-1', status: 'active', total_amount: 1000, spent_amount: 1200 }],
      payrollRuns: [{ id: 'pay-1', status: 'pending_finance' }],
      complianceRequirements: [{ id: 'comp-1', requirement: 'AML filing', status: 'overdue', due_date: '2026-02-28' }],
    })

    expect(pack.period).toBe('2026-Q1')
    expect(pack.totalSignals).toBeGreaterThanOrEqual(4)
    expect(pack.criticalCount).toBeGreaterThanOrEqual(2)
    expect(pack.sections.map(section => section.domain)).toEqual(expect.arrayContaining(['workforce', 'finance', 'compliance']))
    expect(pack.topRisks[0]).toEqual(expect.objectContaining({ domain: 'compliance', drillThroughRoute: '/compliance' }))
    expect(pack.decisionAsks.length).toBeGreaterThan(0)
  })

  it('creates narratives for performance, learning, expense, and execution risks', () => {
    const pack = buildExecutiveBoardroomPack({
      now,
      performanceReviews: [{ id: 'rev-1', status: 'pending', due_date: '2026-03-03' }],
      goals: [{ id: 'goal-1', progress: 40, due_date: '2026-03-20' }],
      courses: [{ id: 'course-aml', title: 'AML', is_mandatory: true }],
      learningEnrollments: [{ id: 'enr-1', course_id: 'course-aml', status: 'in_progress' }],
      expenseReports: [{ id: 'exp-1', status: 'pending_approval', total_amount: 12000 }],
      projects: [{ id: 'proj-1', status: 'at_risk', progress: 45, due_date: '2026-03-25' }],
    })

    expect(pack.sections).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'performance' }),
      expect.objectContaining({ domain: 'learning' }),
      expect.objectContaining({ domain: 'expense' }),
      expect.objectContaining({ domain: 'execution' }),
    ]))
    expect(pack.sections.flatMap(section => section.signals).every(signal => signal.narrative.length > 0)).toBe(true)
    expect(pack.sections.flatMap(section => section.signals).every(signal => signal.operationalFollowUp.length > 0)).toBe(true)
  })

  it('limits signals per section and sorts top risks by score', () => {
    const pack = buildExecutiveBoardroomPack({
      now,
      maxSignalsPerSection: 1,
      budgets: [{ id: 'bud-1', status: 'active', total_amount: 1000, spent_amount: 1200 }],
      invoices: [{ id: 'inv-1', status: 'overdue', amount: 60000, due_date: '2026-02-20' }],
      payrollRuns: [{ id: 'pay-1', status: 'pending_hr' }],
      complianceRequirements: [{ id: 'comp-1', status: 'at_risk', due_date: '2026-03-05' }],
    })

    const finance = pack.sections.find(section => section.domain === 'finance')
    expect(finance?.signals).toHaveLength(1)
    expect(pack.topRisks.map(signal => signal.score)).toEqual([...pack.topRisks.map(signal => signal.score)].sort((a, b) => b - a))
  })

  it('returns an empty pack when there are no material signals', () => {
    const pack = buildExecutiveBoardroomPack({
      now,
      employees: [{ id: 'emp-1', is_active: true, attrition_risk: 'low' }],
      budgets: [{ id: 'bud-1', status: 'active', total_amount: 1000, spent_amount: 100 }],
      performanceReviews: [{ id: 'rev-1', status: 'completed' }],
      complianceRequirements: [{ id: 'comp-1', status: 'completed' }],
    })

    expect(pack.totalSignals).toBe(0)
    expect(pack.sections).toEqual([])
    expect(pack.topRisks).toEqual([])
    expect(pack.executiveSummary).toContain('No material')
  })
})
