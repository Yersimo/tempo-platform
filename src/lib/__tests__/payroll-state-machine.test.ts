import { describe, it, expect } from 'vitest'
import {
  transitionPayrollStatus,
  getAvailableTransitions,
  type PayrollRun,
  type TransitionContext,
} from '@/lib/payroll/state-machine'

// ---------------------------------------------------------------------------
// Helpers to build PayrollRun and TransitionContext fixtures
// ---------------------------------------------------------------------------

function makeRun(overrides: Partial<PayrollRun> = {}): PayrollRun {
  return {
    payrollRunId: '550e8400-e29b-41d4-a716-446655440000',
    status: 'draft',
    entryCount: 5,
    ...overrides,
  }
}

function makeCtx(overrides: Partial<TransitionContext> = {}): TransitionContext {
  return { ...overrides }
}

describe('Payroll State Machine', () => {
  describe('transitionPayrollStatus', () => {
    // ---------------------------------------------------------------
    // Draft -> Approved
    // ---------------------------------------------------------------
    it('allows draft -> approved with valid context', () => {
      const run = makeRun({ status: 'draft', entryCount: 5 })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'owner',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.newStatus).toBe('approved')
      }
    })

    it('allows draft -> approved with admin role', () => {
      const run = makeRun({ status: 'draft', entryCount: 3 })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'admin',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(true)
    })

    it('rejects draft -> approved without owner/admin role', () => {
      const run = makeRun({ status: 'draft', entryCount: 5 })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'employee',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toBeDefined()
      }
    })

    it('rejects draft -> approved with manager role', () => {
      const run = makeRun({ status: 'draft', entryCount: 5 })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'manager',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects draft -> approved with zero entries', () => {
      const run = makeRun({ status: 'draft', entryCount: 0 })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'owner',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects draft -> approved without approverId', () => {
      const run = makeRun({ status: 'draft', entryCount: 5 })
      const ctx = makeCtx({ approverRole: 'owner' })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects draft -> approved without approverRole', () => {
      const run = makeRun({ status: 'draft', entryCount: 5 })
      const ctx = makeCtx({ approverId: '550e8400-e29b-41d4-a716-446655440001' })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
    })

    // ---------------------------------------------------------------
    // Approved -> Processing
    // ---------------------------------------------------------------
    it('allows approved -> processing with timestamp', () => {
      const run = makeRun({ status: 'approved', entryCount: 5 })
      const ctx = makeCtx({ processingTimestamp: new Date() })
      const result = transitionPayrollStatus(run, 'processing', ctx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.newStatus).toBe('processing')
      }
    })

    it('rejects approved -> processing without timestamp', () => {
      const run = makeRun({ status: 'approved', entryCount: 5 })
      const ctx = makeCtx()
      const result = transitionPayrollStatus(run, 'processing', ctx)
      expect(result.success).toBe(false)
    })

    // ---------------------------------------------------------------
    // Processing -> Paid
    // ---------------------------------------------------------------
    it('allows processing -> paid with payment reference', () => {
      const run = makeRun({ status: 'processing', entryCount: 5 })
      const ctx = makeCtx({ paymentReference: 'BANK-TXN-001' })
      const result = transitionPayrollStatus(run, 'paid', ctx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.newStatus).toBe('paid')
      }
    })

    it('rejects processing -> paid without payment reference', () => {
      const run = makeRun({ status: 'processing', entryCount: 5 })
      const ctx = makeCtx()
      const result = transitionPayrollStatus(run, 'paid', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects processing -> paid with empty payment reference', () => {
      const run = makeRun({ status: 'processing', entryCount: 5 })
      const ctx = makeCtx({ paymentReference: '   ' })
      const result = transitionPayrollStatus(run, 'paid', ctx)
      expect(result.success).toBe(false)
    })

    // ---------------------------------------------------------------
    // Cancellation
    // ---------------------------------------------------------------
    it('allows draft -> cancelled with reason', () => {
      const run = makeRun({ status: 'draft' })
      const ctx = makeCtx({ cancellationReason: 'Wrong employee list' })
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.newStatus).toBe('cancelled')
      }
    })

    it('allows approved -> cancelled with reason', () => {
      const run = makeRun({ status: 'approved' })
      const ctx = makeCtx({ cancellationReason: 'Budget issue' })
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(true)
    })

    it('rejects cancellation without reason', () => {
      const run = makeRun({ status: 'draft' })
      const ctx = makeCtx()
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects cancellation with empty reason', () => {
      const run = makeRun({ status: 'draft' })
      const ctx = makeCtx({ cancellationReason: '   ' })
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects cancellation from processing state', () => {
      const run = makeRun({ status: 'processing' })
      const ctx = makeCtx({ cancellationReason: 'Too late' })
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects cancellation from paid state', () => {
      const run = makeRun({ status: 'paid' })
      const ctx = makeCtx({ cancellationReason: 'Error found' })
      const result = transitionPayrollStatus(run, 'cancelled', ctx)
      expect(result.success).toBe(false)
    })

    // ---------------------------------------------------------------
    // Invalid transitions
    // ---------------------------------------------------------------
    it('rejects draft -> paid (skip approved & processing)', () => {
      const run = makeRun({ status: 'draft' })
      const ctx = makeCtx({ paymentReference: 'BANK-001' })
      const result = transitionPayrollStatus(run, 'paid', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects draft -> processing (skip approved)', () => {
      const run = makeRun({ status: 'draft' })
      const ctx = makeCtx({ processingTimestamp: new Date() })
      const result = transitionPayrollStatus(run, 'processing', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects paid -> draft (backwards)', () => {
      const run = makeRun({ status: 'paid' })
      const ctx = makeCtx()
      const result = transitionPayrollStatus(run, 'draft', ctx)
      expect(result.success).toBe(false)
    })

    it('rejects self-transition (same status)', () => {
      const run = makeRun({ status: 'draft' })
      const result = transitionPayrollStatus(run, 'draft')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('already')
      }
    })

    it('rejects processing -> approved (backwards)', () => {
      const run = makeRun({ status: 'processing' })
      const ctx = makeCtx({
        approverId: '550e8400-e29b-41d4-a716-446655440001',
        approverRole: 'owner',
      })
      const result = transitionPayrollStatus(run, 'approved', ctx)
      expect(result.success).toBe(false)
    })

    // ---------------------------------------------------------------
    // Error messages include hints
    // ---------------------------------------------------------------
    it('includes valid transitions hint in error for invalid transition', () => {
      const run = makeRun({ status: 'draft' })
      const result = transitionPayrollStatus(run, 'paid', {})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('not allowed')
      }
    })

    it('reports no valid transitions from terminal states', () => {
      const run = makeRun({ status: 'paid' })
      const result = transitionPayrollStatus(run, 'draft', {})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error).toContain('no valid transitions')
      }
    })
  })

  describe('getAvailableTransitions', () => {
    it('returns approved and cancelled for draft', () => {
      const transitions = getAvailableTransitions('draft')
      expect(transitions).toContain('approved')
      expect(transitions).toContain('cancelled')
      expect(transitions).not.toContain('processing')
      expect(transitions).not.toContain('paid')
    })

    it('returns processing and cancelled for approved', () => {
      const transitions = getAvailableTransitions('approved')
      expect(transitions).toContain('processing')
      expect(transitions).toContain('cancelled')
      expect(transitions).not.toContain('paid')
      expect(transitions).not.toContain('draft')
    })

    it('returns paid for processing', () => {
      const transitions = getAvailableTransitions('processing')
      expect(transitions).toContain('paid')
      expect(transitions).not.toContain('cancelled')
      expect(transitions).not.toContain('draft')
    })

    it('returns empty array for paid (terminal state)', () => {
      const transitions = getAvailableTransitions('paid')
      expect(transitions).toHaveLength(0)
    })

    it('returns empty array for cancelled (terminal state)', () => {
      const transitions = getAvailableTransitions('cancelled')
      expect(transitions).toHaveLength(0)
    })
  })
})
