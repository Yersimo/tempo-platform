import { describe, expect, it } from 'vitest'
import { buildWorkdayBriefing } from '../workday-briefing-engine'

const now = '2026-03-01T09:00:00Z'

describe('workday briefing engine', () => {
  it('prioritizes payroll, compliance, and people risks across modules', () => {
    const briefing = buildWorkdayBriefing({
      now,
      employees: [
        { id: 'emp-joiner', full_name: 'Amina Diallo', start_date: '2026-03-02', is_active: true },
        { id: 'emp-leaver', full_name: 'Kojo Mensah', termination_date: '2026-03-03', is_active: true },
      ],
      payrollRuns: [{ id: 'pay-1', period: 'February 2026', status: 'pending_finance' }],
      complianceRequirements: [{ id: 'comp-1', requirement: 'AML filing', status: 'overdue', due_date: '2026-02-27' }],
      maxItems: 5,
    })

    expect(briefing.totalSignals).toBe(4)
    expect(briefing.criticalCount).toBeGreaterThanOrEqual(2)
    expect(briefing.topFocus).toEqual(expect.objectContaining({
      domain: 'compliance',
      route: '/compliance',
      safeNextAction: expect.stringContaining('Open compliance'),
    }))
    expect(briefing.items.map(item => item.domain)).toEqual(expect.arrayContaining(['payroll', 'people']))
  })

  it('turns expenses, learning, performance, IT, finance, and workflow data into routed next actions', () => {
    const briefing = buildWorkdayBriefing({
      now,
      expenseReports: [{ id: 'exp-1', title: 'Client travel', total_amount: 3200, status: 'submitted' }],
      courses: [{ id: 'course-aml', title: 'AML Compliance', is_mandatory: true }],
      learningEnrollments: [{ id: 'enr-1', course_id: 'course-aml', status: 'in_progress', progress: 20 }],
      performanceReviews: [{ id: 'rev-1', title: 'Q1 Review', status: 'pending', due_date: '2026-03-02' }],
      devices: [{ id: 'dev-1', asset_tag: 'MBP-44', status: 'non_compliant' }],
      invoices: [{ id: 'inv-1', invoice_number: 'INV-1', amount: 1000, status: 'overdue', due_date: '2026-02-25' }],
      workflows: [{ id: 'wf-1', name: 'Joiner provisioning', status: 'failed' }],
      maxItems: 10,
    })

    expect(briefing.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'expense', route: '/expense?tab=reports' }),
      expect.objectContaining({ domain: 'learning', route: '/learning' }),
      expect.objectContaining({ domain: 'performance', route: '/performance?tab=reviews' }),
      expect.objectContaining({ domain: 'it', route: '/it/devices' }),
      expect.objectContaining({ domain: 'finance', route: '/invoices' }),
      expect.objectContaining({ domain: 'workflow', route: '/workflows' }),
    ]))
    expect(briefing.items.every(item => item.whyThisMatters.length > 0)).toBe(true)
    expect(briefing.items.every(item => item.safeNextAction.length > 0)).toBe(true)
  })

  it('caps results and sorts by score descending', () => {
    const briefing = buildWorkdayBriefing({
      now,
      maxItems: 3,
      payrollRuns: [
        { id: 'pay-1', status: 'pending_finance' },
        { id: 'pay-2', status: 'draft' },
      ],
      expenseReports: [
        { id: 'exp-1', total_amount: 5000, status: 'submitted' },
        { id: 'exp-2', total_amount: 50, status: 'submitted' },
      ],
      workflows: [{ id: 'wf-1', status: 'failed' }],
    })

    expect(briefing.items).toHaveLength(3)
    expect(briefing.items.map(item => item.score)).toEqual([88, 82, 76])
    expect(briefing.evidence[0]).toContain('3 prioritized')
  })

  it('returns an empty briefing when there are no actionable signals', () => {
    const briefing = buildWorkdayBriefing({
      now,
      employees: [{ id: 'emp-1', full_name: 'No Action', is_active: true }],
      expenseReports: [{ id: 'exp-paid', status: 'reimbursed', total_amount: 100 }],
      courses: [{ id: 'course-1', title: 'Optional Course' }],
      learningEnrollments: [{ id: 'enr-complete', course_id: 'course-1', status: 'completed', progress: 100 }],
    })

    expect(briefing.totalSignals).toBe(0)
    expect(briefing.topFocus).toBeNull()
    expect(briefing.items).toEqual([])
  })
})
