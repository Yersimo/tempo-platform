import { describe, it, expect } from 'vitest'

// Test the RBAC permission matrix in isolation
// (Extracted from the inline definition in the API route)

const ROLE_PERMISSIONS: Record<string, Set<string> | 'all'> = {
  owner: 'all',
  admin: 'all',
  hrbp: new Set([
    'employees', 'goals', 'reviewCycles', 'reviews', 'feedback',
    'compBands', 'salaryReviews', 'courses', 'enrollments',
    'surveys', 'engagementScores', 'mentoringPrograms', 'mentoringPairs',
    'leaveRequests', 'benefitPlans', 'benefitEnrollments',
    'expenseReports', 'expenseItems', 'jobPostings', 'applications',
    'projects', 'milestones', 'tasks', 'taskDependencies',
    'strategicObjectives', 'keyResults', 'initiatives',
    'kpiDefinitions', 'kpiMeasurements',
    'workflows', 'workflowSteps', 'workflowRuns', 'workflowTemplates',
  ]),
  manager: new Set([
    'goals', 'reviews', 'feedback', 'enrollments', 'leaveRequests',
    'tasks', 'milestones', 'taskDependencies',
    'kpiMeasurements', 'workflowRuns',
  ]),
  employee: new Set([
    'goals', 'feedback', 'enrollments', 'leaveRequests', 'tasks',
  ]),
}

function hasPermission(role: string, entity: string): boolean {
  const perms = ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS['employee']
  return perms === 'all' || perms.has(entity)
}

describe('RBAC Permissions', () => {
  describe('Owner role', () => {
    it('has access to all entities', () => {
      expect(hasPermission('owner', 'employees')).toBe(true)
      expect(hasPermission('owner', 'organizations')).toBe(true)
      expect(hasPermission('owner', 'salaryReviews')).toBe(true)
      expect(hasPermission('owner', 'workflows')).toBe(true)
      expect(hasPermission('owner', 'anything')).toBe(true)
    })
  })

  describe('Admin role', () => {
    it('has access to all entities', () => {
      expect(hasPermission('admin', 'employees')).toBe(true)
      expect(hasPermission('admin', 'goals')).toBe(true)
      expect(hasPermission('admin', 'workflows')).toBe(true)
    })
  })

  describe('HRBP role', () => {
    it('can manage HR entities', () => {
      expect(hasPermission('hrbp', 'employees')).toBe(true)
      expect(hasPermission('hrbp', 'reviews')).toBe(true)
      expect(hasPermission('hrbp', 'compBands')).toBe(true)
      expect(hasPermission('hrbp', 'salaryReviews')).toBe(true)
      expect(hasPermission('hrbp', 'surveys')).toBe(true)
    })

    it('can manage Phase 3 entities', () => {
      expect(hasPermission('hrbp', 'projects')).toBe(true)
      expect(hasPermission('hrbp', 'strategicObjectives')).toBe(true)
      expect(hasPermission('hrbp', 'workflows')).toBe(true)
    })

    it('cannot manage IT/Finance infrastructure', () => {
      expect(hasPermission('hrbp', 'devices')).toBe(false)
      expect(hasPermission('hrbp', 'softwareLicenses')).toBe(false)
      expect(hasPermission('hrbp', 'invoices')).toBe(false)
      expect(hasPermission('hrbp', 'budgets')).toBe(false)
      expect(hasPermission('hrbp', 'vendors')).toBe(false)
    })
  })

  describe('Manager role', () => {
    it('can manage team-relevant entities', () => {
      expect(hasPermission('manager', 'goals')).toBe(true)
      expect(hasPermission('manager', 'reviews')).toBe(true)
      expect(hasPermission('manager', 'feedback')).toBe(true)
      expect(hasPermission('manager', 'tasks')).toBe(true)
      expect(hasPermission('manager', 'leaveRequests')).toBe(true)
    })

    it('cannot manage HR-wide entities', () => {
      expect(hasPermission('manager', 'employees')).toBe(false)
      expect(hasPermission('manager', 'compBands')).toBe(false)
      expect(hasPermission('manager', 'salaryReviews')).toBe(false)
      expect(hasPermission('manager', 'courses')).toBe(false)
      expect(hasPermission('manager', 'surveys')).toBe(false)
    })

    it('cannot manage projects or strategy (only tasks)', () => {
      expect(hasPermission('manager', 'projects')).toBe(false)
      expect(hasPermission('manager', 'strategicObjectives')).toBe(false)
      expect(hasPermission('manager', 'workflows')).toBe(false)
    })
  })

  describe('Employee role', () => {
    it('can manage personal entities', () => {
      expect(hasPermission('employee', 'goals')).toBe(true)
      expect(hasPermission('employee', 'feedback')).toBe(true)
      expect(hasPermission('employee', 'enrollments')).toBe(true)
      expect(hasPermission('employee', 'leaveRequests')).toBe(true)
      expect(hasPermission('employee', 'tasks')).toBe(true)
    })

    it('cannot manage any org-wide entities', () => {
      expect(hasPermission('employee', 'employees')).toBe(false)
      expect(hasPermission('employee', 'reviews')).toBe(false)
      expect(hasPermission('employee', 'compBands')).toBe(false)
      expect(hasPermission('employee', 'projects')).toBe(false)
      expect(hasPermission('employee', 'workflows')).toBe(false)
      expect(hasPermission('employee', 'organizations')).toBe(false)
    })
  })

  describe('Unknown role', () => {
    it('defaults to employee permissions', () => {
      expect(hasPermission('unknown', 'goals')).toBe(true)
      expect(hasPermission('unknown', 'employees')).toBe(false)
    })
  })

  describe('Role hierarchy completeness', () => {
    const allEntities = [
      'employees', 'goals', 'reviewCycles', 'reviews', 'feedback',
      'compBands', 'salaryReviews', 'courses', 'enrollments',
      'surveys', 'engagementScores', 'mentoringPrograms', 'mentoringPairs',
      'leaveRequests', 'benefitPlans', 'benefitEnrollments',
      'expenseReports', 'expenseItems', 'jobPostings', 'applications',
      'projects', 'milestones', 'tasks', 'taskDependencies',
      'strategicObjectives', 'keyResults', 'initiatives',
      'kpiDefinitions', 'kpiMeasurements',
      'workflows', 'workflowSteps', 'workflowRuns', 'workflowTemplates',
      'devices', 'softwareLicenses', 'itRequests',
      'invoices', 'budgets', 'vendors',
    ]

    it('owner has superset of all role permissions', () => {
      for (const entity of allEntities) {
        expect(hasPermission('owner', entity)).toBe(true)
      }
    })

    it('hrbp permissions are superset of manager permissions', () => {
      const managerPerms = ROLE_PERMISSIONS['manager'] as Set<string>
      const hrbpPerms = ROLE_PERMISSIONS['hrbp'] as Set<string>
      for (const entity of managerPerms) {
        expect(hrbpPerms.has(entity)).toBe(true)
      }
    })

    it('manager permissions are superset of employee permissions', () => {
      const employeePerms = ROLE_PERMISSIONS['employee'] as Set<string>
      const managerPerms = ROLE_PERMISSIONS['manager'] as Set<string>
      for (const entity of employeePerms) {
        expect(managerPerms.has(entity)).toBe(true)
      }
    })
  })
})
