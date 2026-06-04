import { describe, expect, it } from 'vitest'
import { buildWorkflowTemplatePlan } from '../workflow-template-planner'

describe('workflow template planner', () => {
  it('recommends lifecycle and finance templates from operational signals', () => {
    const plan = buildWorkflowTemplatePlan({
      onboardingTasks: [{ id: 'on-1', status: 'pending' }, { id: 'on-2', status: 'in_progress' }],
      appAssignments: [{ id: 'app-1', status: 'failed' }],
      offboardingTasks: [{ id: 'off-1', status: 'overdue' }],
      devices: [{ id: 'dev-1', status: 'assigned', lifecycle_status: 'offboarding' }],
      expenseReports: [{ id: 'exp-1', status: 'pending_approval', total_amount: 2200 }],
    })

    expect(plan.recommendations).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: 'tpl-leaver-closure-control', category: 'lifecycle' }),
      expect.objectContaining({ id: 'tpl-joiner-launch-readiness', category: 'lifecycle' }),
      expect.objectContaining({ id: 'tpl-expense-reimbursement-control', category: 'finance' }),
    ]))
    expect(plan.recommendations.every(rec => rec.steps.some(step => step.type === 'approval'))).toBe(true)
  })

  it('adds payroll, learning, compliance, support, and performance templates with safety gates', () => {
    const plan = buildWorkflowTemplatePlan({
      payrollRuns: [{ id: 'pay-1', status: 'pending_finance' }],
      courses: [{ id: 'course-1', is_mandatory: true }],
      learningEnrollments: [{ id: 'enr-1', course_id: 'course-1', status: 'in_progress' }],
      complianceRequirements: [{ id: 'comp-1', status: 'overdue' }],
      supportTickets: [{ id: 'sup-1', status: 'waiting_on_customer' }],
      performanceReviews: [{ id: 'rev-1', status: 'pending' }],
      goals: [{ id: 'goal-1', progress: 40, status: 'active' }],
    })

    expect(plan.recommendations.map(rec => rec.id)).toEqual(expect.arrayContaining([
      'tpl-payroll-preflight-approval',
      'tpl-mandatory-learning-nudge',
      'tpl-compliance-evidence-chase',
      'tpl-support-ticket-sla',
      'tpl-performance-manager-followup',
    ]))
    expect(plan.recommendations.every(rec => rec.safetyGates.length > 0)).toBe(true)
    expect(plan.recommendations.every(rec => rec.dryRunChecks.length > 0)).toBe(true)
  })

  it('skips templates that already exist and returns a review table', () => {
    const plan = buildWorkflowTemplatePlan({
      existingTemplates: [{ id: 'tpl-payroll-preflight-approval', name: 'Payroll Preflight Approval' }],
      payrollRuns: [{ id: 'pay-1', status: 'pending_hr' }],
      complianceRequirements: [{ id: 'comp-1', status: 'at_risk' }],
    })

    expect(plan.recommendations.map(rec => rec.id)).not.toContain('tpl-payroll-preflight-approval')
    expect(plan.recommendations.map(rec => rec.id)).toContain('tpl-compliance-evidence-chase')
    expect(plan.reviewTable).toEqual([
      expect.objectContaining({
        template: 'Compliance Evidence Chase',
        howToTest: expect.stringContaining('Evidence fields'),
        risk: expect.stringContaining('Never mark requirements complete'),
      }),
    ])
  })

  it('caps recommendations and sorts by score', () => {
    const plan = buildWorkflowTemplatePlan({
      maxRecommendations: 2,
      complianceRequirements: [{ id: 'comp-1', status: 'failed' }],
      offboardingTasks: [{ id: 'off-1', status: 'overdue' }],
      payrollRuns: [{ id: 'pay-1', status: 'pending_finance' }],
      supportTickets: [{ id: 'sup-1', status: 'open' }],
    })

    expect(plan.recommendations).toHaveLength(2)
    expect(plan.recommendations.map(rec => rec.score)).toEqual([90, 84])
    expect(plan.evidence[0]).toContain('2 workflow template recommendations')
  })
})
