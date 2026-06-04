import { describe, expect, it } from 'vitest'

import {
  buildJoinerPlan,
  buildLeaverPlan,
  buildLifecyclePlan,
  buildMoverPlan,
} from '@/lib/lifecycle-workflow-engine'

const worker = {
  id: 'emp-123',
  name: 'Amina Doe',
  managerId: 'mgr-old',
  department: 'Operations',
}

describe('Lifecycle Workflow Engine', () => {
  it('exports a dispatcher that builds the requested event plan', () => {
    const plan = buildLifecyclePlan({
      eventType: 'joiner',
      eventId: 'evt-joiner',
      worker,
      startDate: '2026-06-15',
      payrollProfile: { country: 'GH' },
      learningAssignments: [{ courseId: 'security-101' }],
      managerId: 'mgr-1',
      accessTemplateId: 'operations-standard',
    })

    expect(plan.planId).toBe('lifecycle-joiner-evt-joiner')
    expect(plan.eventType).toBe('joiner')
    expect(plan.waves).toHaveLength(2)
    expect(plan.blockers).toEqual([])
  })

  it('flags missing payroll and learning readiness on a joiner plan', () => {
    const plan = buildJoinerPlan({
      eventId: 'evt-missing-joiner',
      worker,
      startDate: '2026-06-15',
      managerId: 'mgr-1',
      accessTemplateId: 'operations-standard',
    })

    expect(plan.blockers.map(blocker => blocker.id)).toEqual([
      'missing-payroll-profile',
      'missing-learning-assignments',
    ])
    expect(plan.evidence.find(item => item.id === 'payroll-profile')?.present).toBe(false)
    expect(plan.evidence.find(item => item.id === 'learning-assignments')?.present).toBe(false)
    expect(plan.safeNextActions.map(action => action.id)).not.toContain('prepare-payroll-profile')
    expect(plan.safeNextActions.map(action => action.id)).not.toContain('enroll-learning')
    expect(plan.readinessScore).toBeLessThan(100)
  })

  it('captures manager and access deltas on a mover plan', () => {
    const plan = buildMoverPlan({
      eventId: 'evt-mover',
      worker,
      effectiveDate: '2026-07-01',
      fromManagerId: 'mgr-old',
      toManagerId: 'mgr-new',
      fromAccessGroups: ['sales-crm', 'region-west'],
      toAccessGroups: ['region-west', 'finance-readonly'],
      fromCostCenter: 'ops-001',
      toCostCenter: 'finance-002',
    })

    expect(plan.blockers).toEqual([])
    expect(plan.evidence.find(item => item.id === 'manager-delta')?.present).toBe(true)
    expect(plan.evidence.find(item => item.id === 'access-delta')?.present).toBe(true)
    expect(plan.waves[1].actions.find(action => action.id === 'add-new-access')?.label).toContain('finance-readonly')
    expect(plan.waves[1].actions.find(action => action.id === 'remove-old-access')?.label).toContain('sales-crm')
  })

  it('blocks leaver plans when critical closure controls are missing', () => {
    const plan = buildLeaverPlan({
      eventId: 'evt-leaver',
      worker,
      terminationDate: '2026-06-30',
      managerAcknowledged: false,
      accessRevocationScheduled: false,
      finalPayrollReady: false,
      deviceReturnScheduled: true,
      openCriticalTasks: 2,
    })

    expect(plan.blockers.map(blocker => blocker.id)).toEqual([
      'missing-manager-acknowledgement',
      'missing-access-revocation',
      'missing-final-payroll',
      'open-critical-tasks',
    ])
    expect(plan.blockers.every(blocker => blocker.severity === 'critical')).toBe(true)
    expect(plan.safeNextActions.map(action => action.id)).toContain('schedule-device-return')
    expect(plan.safeNextActions.map(action => action.id)).not.toContain('revoke-access')
    expect(plan.readinessScore).toBe(0)
  })

  it('groups owners and scores readiness from evidence and blockers', () => {
    const plan = buildJoinerPlan({
      eventId: 'evt-owner-score',
      worker,
      startDate: '2026-06-15',
      managerId: 'mgr-1',
      accessTemplateId: 'operations-standard',
      payrollProfile: { country: 'GH' },
      equipmentRequestId: 'device-123',
    })

    expect(plan.readinessScore).toBe(82)
    expect(plan.owners).toEqual(
      expect.arrayContaining([
        { owner: 'hr', actions: 2, blockers: 0, readyActions: 2 },
        { owner: 'learning', actions: 1, blockers: 1, readyActions: 0 },
        { owner: 'payroll', actions: 1, blockers: 0, readyActions: 1 },
      ])
    )
  })
})
