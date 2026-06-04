import { describe, expect, it } from 'vitest'
import { buildManagerMissionControl } from '../manager-mission-control-engine'

const employees = [
  { id: 'mgr-1', full_name: 'Manager One', role: 'manager' },
  { id: 'emp-1', full_name: 'Amina Diallo', manager_id: 'mgr-1' },
  { id: 'emp-2', full_name: 'Kojo Mensah', manager_id: 'mgr-1' },
  { id: 'emp-3', full_name: 'Outside Team', manager_id: 'mgr-2' },
]

describe('manager mission control engine', () => {
  it('creates a direct-report-only manager queue across approvals and performance', () => {
    const mission = buildManagerMissionControl({
      managerId: 'mgr-1',
      now: '2026-03-01T09:00:00Z',
      employees,
      expenseReports: [
        { id: 'exp-1', employee_id: 'emp-1', title: 'Client travel', total_amount: 1800, status: 'submitted' },
        { id: 'exp-outside', employee_id: 'emp-3', title: 'Ignore me', total_amount: 5000, status: 'submitted' },
      ],
      timeEntries: [
        { id: 'time-1', employee_id: 'emp-2', status: 'submitted', overtime_hours: 5 },
      ],
      performanceReviews: [
        { id: 'rev-1', employee_id: 'emp-1', reviewer_id: 'mgr-1', status: 'pending', due_date: '2026-03-02' },
      ],
    })

    expect(mission.teamSize).toBe(2)
    expect(mission.items.map(item => item.id)).not.toContain('manager-expense-exp-outside')
    expect(mission.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'performance', route: '/performance?tab=reviews' }),
      expect.objectContaining({ domain: 'time', route: '/time-attendance' }),
      expect.objectContaining({ domain: 'expense', route: '/expense?tab=reports' }),
    ]))
    expect(mission.topFocus).toEqual(expect.objectContaining({ title: 'Performance review due soon' }))
  })

  it('surfaces mandatory learning and at-risk goals with next actions', () => {
    const mission = buildManagerMissionControl({
      managerId: 'mgr-1',
      now: '2026-03-01T09:00:00Z',
      employees,
      courses: [{ id: 'course-aml', title: 'AML Compliance', is_mandatory: true }],
      learningEnrollments: [{ id: 'enr-1', employee_id: 'emp-2', course_id: 'course-aml', status: 'in_progress', progress: 30 }],
      goals: [{ id: 'goal-1', employee_id: 'emp-1', title: 'Launch onboarding flow', progress: 40, due_date: '2026-03-08' }],
    })

    expect(mission.items).toEqual(expect.arrayContaining([
      expect.objectContaining({
        domain: 'performance',
        title: 'Direct report goal is at risk',
        safeNextAction: expect.stringContaining('Confirm blockers'),
      }),
      expect.objectContaining({
        domain: 'learning',
        title: 'Mandatory learning gap on team',
        whyThisMatters: expect.stringContaining('Mandatory learning gaps'),
      }),
    ]))
  })

  it('includes unresolved 1:1 and time-off requests in the manager queue', () => {
    const mission = buildManagerMissionControl({
      managerId: 'mgr-1',
      employees,
      oneOnOnes: [{
        id: 'ooo-1',
        employee_id: 'emp-1',
        status: 'completed',
        action_items: [{ title: 'Follow up', status: 'open' }],
      }],
      timeOffRequests: [{ id: 'pto-1', employee_id: 'emp-2', type: 'vacation', status: 'pending' }],
    })

    expect(mission.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'manager-one-on-one-ooo-1', route: '/performance?tab=one-on-ones' }),
      expect.objectContaining({ id: 'manager-timeoff-pto-1', route: '/time-attendance' }),
    ]))
  })

  it('caps and sorts manager items by score', () => {
    const mission = buildManagerMissionControl({
      managerId: 'mgr-1',
      now: '2026-03-01T09:00:00Z',
      maxItems: 2,
      employees,
      performanceReviews: [{ id: 'rev-1', employee_id: 'emp-1', reviewer_id: 'mgr-1', status: 'pending', due_date: '2026-03-01' }],
      timeEntries: [{ id: 'time-1', employee_id: 'emp-2', status: 'submitted', overtime_hours: 6 }],
      expenseReports: [{ id: 'exp-1', employee_id: 'emp-1', title: 'Small expense', total_amount: 100, status: 'submitted' }],
    })

    expect(mission.items).toHaveLength(2)
    expect(mission.items.map(item => item.score)).toEqual([84, 76])
    expect(mission.evidence[0]).toContain('2 direct reports')
  })
})
