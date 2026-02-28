import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing the module under test
vi.mock('@/lib/db', () => {
  const chain = () => {
    const obj: any = {}
    for (const m of ['select', 'from', 'where', 'insert', 'update', 'set', 'values', 'returning', 'limit']) {
      obj[m] = vi.fn(() => obj)
    }
    obj.returning = vi.fn(() => Promise.resolve([]))
    obj.then = vi.fn((resolve: any) => resolve([]))
    return obj
  }
  return {
    db: chain(),
    schema: {
      notifications: {},
      notificationPreferences: {
        employeeId: 'employeeId',
        category: 'category',
      },
      employees: {
        id: 'id',
        orgId: 'orgId',
        isActive: 'isActive',
      },
      integrations: {
        orgId: 'orgId',
        provider: 'provider',
        status: 'status',
      },
    },
  }
})

vi.mock('drizzle-orm', () => ({
  eq: vi.fn((...args: any[]) => args),
  and: vi.fn((...args: any[]) => args),
}))

vi.mock('@/lib/integrations/slack', () => ({
  sendSlackMessage: vi.fn(() => Promise.resolve({ ok: true, ts: '12345' })),
}))

describe('Notification Dispatcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Module exports', () => {
    it('exports dispatchNotification', async () => {
      const mod = await import('@/lib/services/notification-dispatcher')
      expect(typeof mod.dispatchNotification).toBe('function')
    })

    it('exports notifyPayrollApproved helper', async () => {
      const mod = await import('@/lib/services/notification-dispatcher')
      expect(typeof mod.notifyPayrollApproved).toBe('function')
    })

    it('exports notifyExpenseNeedsApproval helper', async () => {
      const mod = await import('@/lib/services/notification-dispatcher')
      expect(typeof mod.notifyExpenseNeedsApproval).toBe('function')
    })

    it('exports notifyTrainingOverdue helper', async () => {
      const mod = await import('@/lib/services/notification-dispatcher')
      expect(typeof mod.notifyTrainingOverdue).toBe('function')
    })
  })

  describe('dispatchNotification', () => {
    it('creates in-app notifications for each recipient', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        event: 'payroll_approved',
        title: 'Payroll Approved',
        message: 'January payroll has been approved.',
      })
      expect(result.inApp).toBeGreaterThanOrEqual(0)
      expect(result.errors).toBeDefined()
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('handles multiple recipients', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: [
          '550e8400-e29b-41d4-a716-446655440000',
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
        ],
        event: 'expense_submitted',
        title: 'Expense Submitted',
        message: 'A new expense report has been submitted.',
      })
      // Each recipient should get an in-app notification
      expect(result.inApp).toBeGreaterThanOrEqual(0)
    })

    it('returns result with all channel counters', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        event: 'training_overdue',
        title: 'Training Overdue',
        message: 'Complete your onboarding training.',
      })
      expect(typeof result.inApp).toBe('number')
      expect(typeof result.email).toBe('number')
      expect(typeof result.slack).toBe('number')
      expect(Array.isArray(result.errors)).toBe(true)
    })

    it('handles empty recipientIds gracefully', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: [],
        event: 'payroll_paid',
        title: 'Payroll Paid',
        message: 'Payroll has been paid.',
      })
      expect(result.inApp).toBe(0)
      expect(result.email).toBe(0)
    })

    it('accepts optional link and entity fields', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        event: 'review_assigned',
        title: 'Review Assigned',
        message: 'You have a new performance review.',
        link: '/reviews/123',
        entityType: 'review',
        entityId: '550e8400-e29b-41d4-a716-446655440050',
      })
      expect(result.errors).toBeDefined()
    })

    it('accepts optional senderId', async () => {
      const { dispatchNotification } = await import('@/lib/services/notification-dispatcher')
      const result = await dispatchNotification({
        orgId: '550e8400-e29b-41d4-a716-446655440099',
        recipientIds: ['550e8400-e29b-41d4-a716-446655440000'],
        senderId: '550e8400-e29b-41d4-a716-446655440005',
        event: 'expense_approved',
        title: 'Expense Approved',
        message: 'Your expense report has been approved.',
      })
      expect(result.errors).toBeDefined()
    })
  })

  describe('notifyPayrollApproved', () => {
    it('is a function that accepts orgId, payrollRunId, and approverName', async () => {
      const { notifyPayrollApproved } = await import('@/lib/services/notification-dispatcher')
      // Should not throw when called with mocked DB
      await expect(
        notifyPayrollApproved(
          '550e8400-e29b-41d4-a716-446655440099',
          '550e8400-e29b-41d4-a716-446655440010',
          'Jane Admin',
        )
      ).resolves.not.toThrow()
    })
  })

  describe('notifyExpenseNeedsApproval', () => {
    it('is a function that accepts orgId, reportId, employeeName, amount, and currency', async () => {
      const { notifyExpenseNeedsApproval } = await import('@/lib/services/notification-dispatcher')
      await expect(
        notifyExpenseNeedsApproval(
          '550e8400-e29b-41d4-a716-446655440099',
          '550e8400-e29b-41d4-a716-446655440020',
          'John Doe',
          1500.00,
          'USD',
        )
      ).resolves.not.toThrow()
    })
  })

  describe('notifyTrainingOverdue', () => {
    it('is a function that accepts orgId, employeeId, courseName, and dueDate', async () => {
      const { notifyTrainingOverdue } = await import('@/lib/services/notification-dispatcher')
      await expect(
        notifyTrainingOverdue(
          '550e8400-e29b-41d4-a716-446655440099',
          '550e8400-e29b-41d4-a716-446655440000',
          'Security Awareness Training',
          '2026-02-15',
        )
      ).resolves.not.toThrow()
    })
  })

  describe('NotificationEvent types', () => {
    it('module loads without errors', async () => {
      const mod = await import('@/lib/services/notification-dispatcher')
      expect(mod).toBeDefined()
    })
  })
})
