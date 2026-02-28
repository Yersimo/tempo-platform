import { z } from 'zod'
import { uuid, positiveAmount, nonNegativeAmount, currencyCode } from './common'

// ---------------------------------------------------------------------------
// Shared field schemas
// ---------------------------------------------------------------------------

export const expenseCategory = z.string().min(1, 'Category is required').max(100)

export const expenseStatus = z.enum([
  'draft',
  'submitted',
  'pending_approval',
  'approved',
  'rejected',
  'reimbursed',
])

// ---------------------------------------------------------------------------
// Standalone schemas (used by generic /api/data and legacy code)
// ---------------------------------------------------------------------------

export const expenseReportCreate = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  currency: currencyCode.default('USD'),
})

export const expenseItemCreate = z.object({
  reportId: uuid,
  category: expenseCategory,
  description: z.string().max(2000).optional(),
  amount: positiveAmount,
  receiptUrl: z.string().url().optional(),
})

export const expenseStatusUpdate = z.object({
  status: expenseStatus,
  rejectionReason: z.string().max(1000).optional(),
  reimbursementReference: z.string().max(200).optional(),
}).refine(
  (val) => {
    if (val.status === 'rejected' && !val.rejectionReason) {
      return false
    }
    return true
  },
  { message: 'Rejection reason is required when rejecting an expense report' }
)

// ---------------------------------------------------------------------------
// POST body: discriminated union on `action`
// ---------------------------------------------------------------------------

export const createReportBody = z.object({
  action: z.literal('create-report'),
  employeeId: uuid,
  title: z.string().min(1, 'Title is required').max(500),
  currency: currencyCode.default('USD'),
})

export const addItemBody = z.object({
  action: z.literal('add-item'),
  reportId: uuid,
  category: expenseCategory,
  description: z.string().max(2000).optional(),
  amount: positiveAmount,
  receiptUrl: z.string().url().optional(),
})

export const uploadReceiptBody = z.object({
  action: z.literal('upload-receipt'),
  reportId: uuid,
  itemId: uuid,
  receiptUrl: z.string().url('Receipt URL must be a valid URL'),
})

export const submitReportBody = z.object({
  action: z.literal('submit'),
  reportId: uuid,
})

export const approveReportBody = z.object({
  action: z.literal('approve'),
  reportId: uuid,
  approverId: uuid,
})

export const rejectReportBody = z.object({
  action: z.literal('reject'),
  reportId: uuid,
  approverId: uuid,
  reason: z.string().min(1, 'Rejection reason is required').max(1000),
})

export const markReimbursedBody = z.object({
  action: z.literal('mark-reimbursed'),
  reportId: uuid,
  reference: z.string().min(1, 'Payment reference is required').max(200),
})

export const createPolicyBody = z.object({
  action: z.literal('create-policy'),
  name: z.string().min(1, 'Policy name is required').max(255),
  category: expenseCategory,
  maxAmount: z.number().int().positive().optional(),
  maxDailyAmount: z.number().int().positive().optional(),
  requiresReceipt: z.boolean().optional(),
  requiresApproval: z.boolean().optional(),
  autoApproveBelow: z.number().int().positive().optional(),
  allowedRoles: z.array(z.string()).optional(),
})

export const expensePostBody = z.discriminatedUnion('action', [
  createReportBody,
  addItemBody,
  uploadReceiptBody,
  submitReportBody,
  approveReportBody,
  rejectReportBody,
  markReimbursedBody,
  createPolicyBody,
])

export type ExpensePostBody = z.infer<typeof expensePostBody>
