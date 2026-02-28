import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the database module before importing the module under test
vi.mock('@/lib/db', () => {
  const mockDb = {
    select: vi.fn(() => mockDb),
    from: vi.fn(() => mockDb),
    where: vi.fn(() => mockDb),
    insert: vi.fn(() => mockDb),
    update: vi.fn(() => mockDb),
    set: vi.fn(() => mockDb),
    values: vi.fn(() => mockDb),
    returning: vi.fn(() => []),
    innerJoin: vi.fn(() => mockDb),
    then: vi.fn(() => Promise.resolve([])),
    limit: vi.fn(() => mockDb),
    orderBy: vi.fn(() => mockDb),
  }
  return {
    db: mockDb,
    schema: {
      approvalChains: { id: 'id', orgId: 'org_id', entityType: 'entity_type', minAmount: 'min_amount', maxAmount: 'max_amount', approverRoles: 'approver_roles', approverIds: 'approver_ids', requiredApprovals: 'required_approvals', isActive: 'is_active' },
      approvalSteps: { id: 'id', chainId: 'chain_id', entityType: 'entity_type', entityId: 'entity_id', stepOrder: 'step_order', approverId: 'approver_id', status: 'status', comments: 'comments', decidedAt: 'decided_at', createdAt: 'created_at' },
      employees: { id: 'id', orgId: 'org_id', role: 'role', fullName: 'full_name', email: 'email', isActive: 'is_active' },
    },
  }
})

describe('Approval Engine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('ApprovalEngineError', () => {
    it('should have correct error codes', async () => {
      // Import after mocking
      const { ApprovalEngineError } = await import('@/lib/services/approval-engine')
      const error = new ApprovalEngineError('Test error', 'CHAIN_NOT_FOUND')
      expect(error.name).toBe('ApprovalEngineError')
      expect(error.code).toBe('CHAIN_NOT_FOUND')
      expect(error.message).toBe('Test error')
    })
  })

  describe('Error class properties', () => {
    it('supports all error codes', async () => {
      const { ApprovalEngineError } = await import('@/lib/services/approval-engine')
      
      const codes = [
        'CHAIN_NOT_FOUND',
        'STEP_NOT_FOUND',
        'ALREADY_DECIDED',
        'NOT_AUTHORIZED',
        'INVALID_DECISION',
      ] as const

      for (const code of codes) {
        const error = new ApprovalEngineError(`Error: ${code}`, code)
        expect(error.code).toBe(code)
        expect(error instanceof Error).toBe(true)
      }
    })
  })
})
