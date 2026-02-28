import { describe, it, expect } from 'vitest'
import { payrollPostBody } from '@/lib/validations/payroll'
import { expensePostBody } from '@/lib/validations/expense'
import { learningPostBody } from '@/lib/validations/learning'

describe('Payroll Validations', () => {
  describe('process action', () => {
    it('accepts valid process payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-01',
      })
      expect(result.success).toBe(true)
    })

    it('rejects process without period', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
      })
      expect(result.success).toBe(false)
    })

    it('rejects process with invalid period format', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-1',
      })
      expect(result.success).toBe(false)
    })

    it('accepts process with overtime data', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-01',
        overtime: {
          '550e8400-e29b-41d4-a716-446655440000': { hours: 10, rate: 1.5 },
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects process with negative overtime hours', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-01',
        overtime: {
          '550e8400-e29b-41d4-a716-446655440000': { hours: -5 },
        },
      })
      expect(result.success).toBe(false)
    })

    it('accepts process with bonuses', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-01',
        bonuses: {
          '550e8400-e29b-41d4-a716-446655440000': [
            { type: 'performance', amount: 500 },
          ],
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects process with non-positive bonus amount', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-01',
        bonuses: {
          '550e8400-e29b-41d4-a716-446655440000': [
            { type: 'performance', amount: 0 },
          ],
        },
      })
      expect(result.success).toBe(false)
    })

    it('accepts process with garnishments', () => {
      const result = payrollPostBody.safeParse({
        action: 'process',
        period: '2026-02',
        garnishments: {
          '550e8400-e29b-41d4-a716-446655440000': [
            { type: 'child_support', amount: 200, priority: 1 },
          ],
        },
      })
      expect(result.success).toBe(true)
    })
  })

  describe('approve action', () => {
    it('accepts valid approve payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'approve',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'owner',
      })
      expect(result.success).toBe(true)
    })

    it('rejects approve without payrollRunId', () => {
      const result = payrollPostBody.safeParse({
        action: 'approve',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'admin',
      })
      expect(result.success).toBe(false)
    })

    it('rejects approve without approverId', () => {
      const result = payrollPostBody.safeParse({
        action: 'approve',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        approverRole: 'owner',
      })
      expect(result.success).toBe(false)
    })

    it('rejects approve with invalid UUID', () => {
      const result = payrollPostBody.safeParse({
        action: 'approve',
        payrollRunId: 'not-a-uuid',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'owner',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('mark-paid action', () => {
    it('accepts valid mark-paid payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'mark-paid',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        paymentReference: 'NIBSS-2026-0001',
      })
      expect(result.success).toBe(true)
    })

    it('rejects mark-paid without payment reference', () => {
      const result = payrollPostBody.safeParse({
        action: 'mark-paid',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects mark-paid with empty payment reference', () => {
      const result = payrollPostBody.safeParse({
        action: 'mark-paid',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        paymentReference: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('cancel action', () => {
    it('accepts valid cancel payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'cancel',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        reason: 'Incorrect employee list',
      })
      expect(result.success).toBe(true)
    })

    it('rejects cancel without reason', () => {
      const result = payrollPostBody.safeParse({
        action: 'cancel',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('rejects cancel with empty reason', () => {
      const result = payrollPostBody.safeParse({
        action: 'cancel',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
        reason: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('pay-stub action', () => {
    it('accepts valid pay-stub payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'pay-stub',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('rejects pay-stub without employeeId', () => {
      const result = payrollPostBody.safeParse({
        action: 'pay-stub',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('mark-processing action', () => {
    it('accepts valid mark-processing payload', () => {
      const result = payrollPostBody.safeParse({
        action: 'mark-processing',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('unknown action', () => {
    it('rejects unknown action', () => {
      const result = payrollPostBody.safeParse({
        action: 'unknown-action',
        payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Expense Validations', () => {
  describe('create-report action', () => {
    it('accepts valid create-report payload', () => {
      const result = expensePostBody.safeParse({
        action: 'create-report',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Q1 Travel Expenses',
        currency: 'USD',
      })
      expect(result.success).toBe(true)
    })

    it('rejects create-report without title', () => {
      const result = expensePostBody.safeParse({
        action: 'create-report',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })

    it('accepts create-report with default currency', () => {
      const result = expensePostBody.safeParse({
        action: 'create-report',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Q1 Travel Expenses',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('add-item action', () => {
    it('accepts valid add-item payload', () => {
      const result = expensePostBody.safeParse({
        action: 'add-item',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'Travel',
        amount: 250.50,
        description: 'Flight to Lagos',
      })
      expect(result.success).toBe(true)
    })

    it('rejects add-item with negative amount', () => {
      const result = expensePostBody.safeParse({
        action: 'add-item',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'Travel',
        amount: -100,
      })
      expect(result.success).toBe(false)
    })

    it('rejects add-item with zero amount', () => {
      const result = expensePostBody.safeParse({
        action: 'add-item',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'Travel',
        amount: 0,
      })
      expect(result.success).toBe(false)
    })

    it('rejects add-item without category', () => {
      const result = expensePostBody.safeParse({
        action: 'add-item',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        amount: 100,
      })
      expect(result.success).toBe(false)
    })

    it('accepts add-item with optional receipt URL', () => {
      const result = expensePostBody.safeParse({
        action: 'add-item',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        category: 'Travel',
        amount: 100,
        receiptUrl: 'https://storage.example.com/receipts/abc.pdf',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('approve action', () => {
    it('accepts valid approve payload', () => {
      const result = expensePostBody.safeParse({
        action: 'approve',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('reject action', () => {
    it('accepts valid reject payload', () => {
      const result = expensePostBody.safeParse({
        action: 'reject',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        reason: 'Missing receipts',
      })
      expect(result.success).toBe(true)
    })

    it('rejects reject without reason', () => {
      const result = expensePostBody.safeParse({
        action: 'reject',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })

    it('rejects reject with empty reason', () => {
      const result = expensePostBody.safeParse({
        action: 'reject',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        reason: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('mark-reimbursed action', () => {
    it('accepts valid mark-reimbursed payload', () => {
      const result = expensePostBody.safeParse({
        action: 'mark-reimbursed',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        reference: 'BANK-TXN-12345',
      })
      expect(result.success).toBe(true)
    })

    it('rejects mark-reimbursed without reference', () => {
      const result = expensePostBody.safeParse({
        action: 'mark-reimbursed',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('create-policy action', () => {
    it('accepts valid create-policy payload', () => {
      const result = expensePostBody.safeParse({
        action: 'create-policy',
        name: 'Travel Policy',
        category: 'Travel',
        maxAmount: 5000,
        requiresReceipt: true,
        requiresApproval: true,
        autoApproveBelow: 100,
      })
      expect(result.success).toBe(true)
    })

    it('rejects create-policy without name', () => {
      const result = expensePostBody.safeParse({
        action: 'create-policy',
        category: 'Travel',
      })
      expect(result.success).toBe(false)
    })

    it('rejects create-policy without category', () => {
      const result = expensePostBody.safeParse({
        action: 'create-policy',
        name: 'Travel Policy',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('submit action', () => {
    it('accepts valid submit payload', () => {
      const result = expensePostBody.safeParse({
        action: 'submit',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('upload-receipt action', () => {
    it('accepts valid upload-receipt payload', () => {
      const result = expensePostBody.safeParse({
        action: 'upload-receipt',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        receiptUrl: 'https://storage.example.com/receipt.pdf',
      })
      expect(result.success).toBe(true)
    })

    it('rejects upload-receipt with invalid URL', () => {
      const result = expensePostBody.safeParse({
        action: 'upload-receipt',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
        itemId: '550e8400-e29b-41d4-a716-446655440001',
        receiptUrl: 'not-a-url',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('unknown action', () => {
    it('rejects unknown action', () => {
      const result = expensePostBody.safeParse({
        action: 'unknown-action',
        reportId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })
})

describe('Learning Validations', () => {
  describe('enroll action', () => {
    it('accepts valid enroll payload', () => {
      const result = learningPostBody.safeParse({
        action: 'enroll',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('rejects enroll without employeeId', () => {
      const result = learningPostBody.safeParse({
        action: 'enroll',
        courseId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })

    it('rejects enroll with invalid UUID', () => {
      const result = learningPostBody.safeParse({
        action: 'enroll',
        employeeId: 'not-a-uuid',
        courseId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('update-progress action', () => {
    it('accepts valid update-progress payload', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: 75,
      })
      expect(result.success).toBe(true)
    })

    it('accepts progress at 0 (minimum)', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: 0,
      })
      expect(result.success).toBe(true)
    })

    it('accepts progress at 100 (maximum)', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: 100,
      })
      expect(result.success).toBe(true)
    })

    it('rejects progress > 100', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: 150,
      })
      expect(result.success).toBe(false)
    })

    it('rejects negative progress', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: -5,
      })
      expect(result.success).toBe(false)
    })

    it('rejects non-integer progress', () => {
      const result = learningPostBody.safeParse({
        action: 'update-progress',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
        progress: 50.5,
      })
      expect(result.success).toBe(false)
    })
  })

  describe('submit-quiz action', () => {
    it('accepts valid submit-quiz payload', () => {
      const result = learningPostBody.safeParse({
        action: 'submit-quiz',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseContentId: '550e8400-e29b-41d4-a716-446655440001',
        answers: [
          { questionId: '550e8400-e29b-41d4-a716-446655440002', answer: 'A' },
          { questionId: '550e8400-e29b-41d4-a716-446655440003', answer: 'B' },
        ],
      })
      expect(result.success).toBe(true)
    })

    it('rejects submit-quiz with empty answers', () => {
      const result = learningPostBody.safeParse({
        action: 'submit-quiz',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseContentId: '550e8400-e29b-41d4-a716-446655440001',
        answers: [],
      })
      expect(result.success).toBe(false)
    })

    it('rejects submit-quiz with empty answer string', () => {
      const result = learningPostBody.safeParse({
        action: 'submit-quiz',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseContentId: '550e8400-e29b-41d4-a716-446655440001',
        answers: [
          { questionId: '550e8400-e29b-41d4-a716-446655440002', answer: '' },
        ],
      })
      expect(result.success).toBe(false)
    })
  })

  describe('issue-certificate action', () => {
    it('accepts valid issue-certificate payload', () => {
      const result = learningPostBody.safeParse({
        action: 'issue-certificate',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseId: '550e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('accepts issue-certificate with optional enrollmentId', () => {
      const result = learningPostBody.safeParse({
        action: 'issue-certificate',
        employeeId: '550e8400-e29b-41d4-a716-446655440000',
        courseId: '550e8400-e29b-41d4-a716-446655440001',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440002',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('create-rule action', () => {
    it('accepts valid create-rule payload', () => {
      const result = learningPostBody.safeParse({
        action: 'create-rule',
        rule: {
          name: 'New Hire Onboarding',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          triggerEvent: 'new_hire',
          isActive: true,
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects create-rule with empty courseIds', () => {
      const result = learningPostBody.safeParse({
        action: 'create-rule',
        rule: {
          name: 'Empty Rule',
          courseIds: [],
          triggerEvent: 'new_hire',
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects create-rule with invalid triggerEvent', () => {
      const result = learningPostBody.safeParse({
        action: 'create-rule',
        rule: {
          name: 'Bad Rule',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          triggerEvent: 'invalid_event',
        },
      })
      expect(result.success).toBe(false)
    })

    it('accepts all valid trigger events', () => {
      for (const event of ['new_hire', 'role_change', 'department_change', 'manual']) {
        const result = learningPostBody.safeParse({
          action: 'create-rule',
          rule: {
            name: `Rule for ${event}`,
            courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
            triggerEvent: event,
          },
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('create-path action', () => {
    it('accepts valid create-path payload', () => {
      const result = learningPostBody.safeParse({
        action: 'create-path',
        path: {
          name: 'Engineering Onboarding',
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
          estimatedHours: 40,
        },
      })
      expect(result.success).toBe(true)
    })

    it('rejects create-path with empty courseIds', () => {
      const result = learningPostBody.safeParse({
        action: 'create-path',
        path: {
          name: 'Empty Path',
          courseIds: [],
        },
      })
      expect(result.success).toBe(false)
    })

    it('rejects create-path without name', () => {
      const result = learningPostBody.safeParse({
        action: 'create-path',
        path: {
          courseIds: ['550e8400-e29b-41d4-a716-446655440000'],
        },
      })
      expect(result.success).toBe(false)
    })
  })

  describe('drop action', () => {
    it('accepts valid drop payload', () => {
      const result = learningPostBody.safeParse({
        action: 'drop',
        enrollmentId: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('process-auto-enroll action', () => {
    it('accepts valid process-auto-enroll payload', () => {
      const result = learningPostBody.safeParse({
        action: 'process-auto-enroll',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('unknown action', () => {
    it('rejects unknown action', () => {
      const result = learningPostBody.safeParse({
        action: 'unknown-action',
      })
      expect(result.success).toBe(false)
    })
  })
})
