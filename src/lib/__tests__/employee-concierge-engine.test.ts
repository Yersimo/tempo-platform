import { describe, expect, it } from 'vitest'
import { buildEmployeeConciergeBrief } from '../employee-concierge-engine'

const now = '2026-03-01T09:00:00Z'

describe('employee concierge engine', () => {
  it('prioritizes urgent document, expense, profile, and learning actions for one employee', () => {
    const brief = buildEmployeeConciergeBrief({
      employeeId: 'emp-1',
      now,
      employees: [{ id: 'emp-1', full_name: 'Amina Diallo', country: 'Ghana' }],
      expenseReports: [{ id: 'exp-1', employee_id: 'emp-1', title: 'Client travel', total_amount: 1200, status: 'rejected' }],
      courses: [{ id: 'course-aml', title: 'AML Compliance', is_mandatory: true }],
      learningEnrollments: [{ id: 'enr-1', employee_id: 'emp-1', course_id: 'course-aml', status: 'not_started', progress: 0 }],
      documents: [{ id: 'doc-1', title: 'Policy acknowledgement', status: 'needs_signature', due_date: '2026-03-02', employee_id: 'emp-1' }],
    })

    expect(brief.employeeName).toBe('Amina Diallo')
    expect(brief.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'documents', route: '/documents', title: 'Document signature due soon' }),
      expect.objectContaining({ domain: 'expense', route: '/expense?tab=reports', title: 'Expense report needs correction' }),
      expect.objectContaining({ domain: 'learning', route: '/learning', title: 'Mandatory learning still open' }),
      expect.objectContaining({ domain: 'profile', route: '/profile' }),
    ]))
    expect(brief.topFocus).toEqual(expect.objectContaining({ domain: 'documents' }))
  })

  it('surfaces benefits, support, time off, and payslip items with safe next actions', () => {
    const brief = buildEmployeeConciergeBrief({
      employeeId: 'emp-2',
      now,
      employees: [{ id: 'emp-2', full_name: 'Kojo Mensah', phone: '+233 1', country: 'Ghana', bankDetailsComplete: true, taxDetailsComplete: true }],
      payslips: [{ id: 'ps-1', employee_id: 'emp-2', period: 'February 2026', status: 'available' }],
      benefitPlans: [{ id: 'plan-1', name: 'Medical Plus', status: 'active', is_open_enrollment: true, enrollment_deadline: '2026-03-03' }],
      benefitEnrollments: [{ id: 'ben-1', employee_id: 'emp-2', plan_id: 'plan-2', status: 'needs_evidence' }],
      timeOffRequests: [{ id: 'pto-1', employee_id: 'emp-2', type: 'vacation', status: 'rejected' }],
      supportTickets: [{ id: 'sup-1', submitted_by: 'emp-2', subject: 'Cannot access app', status: 'waiting_on_customer' }],
    })

    expect(brief.items).toEqual(expect.arrayContaining([
      expect.objectContaining({ domain: 'benefits', route: '/benefits' }),
      expect.objectContaining({ domain: 'support', route: '/support', safeNextAction: expect.stringContaining('reply') }),
      expect.objectContaining({ domain: 'time', route: '/time-attendance' }),
      expect.objectContaining({ domain: 'payroll', route: '/payslips' }),
    ]))
  })

  it('ignores records belonging to other employees', () => {
    const brief = buildEmployeeConciergeBrief({
      employeeId: 'emp-1',
      now,
      employees: [{ id: 'emp-1', full_name: 'Amina Diallo', phone: '+233 1', country: 'Ghana', bankDetailsComplete: true, taxDetailsComplete: true }],
      expenseReports: [{ id: 'exp-other', employee_id: 'emp-2', total_amount: 9999, status: 'rejected' }],
      supportTickets: [{ id: 'sup-other', submitted_by: 'emp-2', status: 'waiting_on_customer' }],
      learningEnrollments: [{ id: 'enr-other', employee_id: 'emp-2', course_id: 'course-1', status: 'not_started' }],
    })

    expect(brief.totalItems).toBe(0)
    expect(brief.items).toEqual([])
    expect(brief.topFocus).toBeNull()
  })

  it('caps and sorts self-service items by score', () => {
    const brief = buildEmployeeConciergeBrief({
      employeeId: 'emp-1',
      now,
      maxItems: 2,
      employees: [{ id: 'emp-1', full_name: 'Amina Diallo' }],
      documents: [{ id: 'doc-1', title: 'Sign now', status: 'needs_signature', due_date: '2026-03-01', employee_id: 'emp-1' }],
      expenseReports: [{ id: 'exp-1', employee_id: 'emp-1', total_amount: 100, status: 'draft' }],
      supportTickets: [{ id: 'sup-1', submitted_by: 'emp-1', status: 'waiting_on_customer' }],
    })

    expect(brief.items).toHaveLength(2)
    expect(brief.items.map(item => item.score)).toEqual([86, 78])
    expect(brief.evidence[0]).toContain('2 employee self-service items')
  })
})
