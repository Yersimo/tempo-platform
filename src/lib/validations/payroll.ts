import { z } from 'zod'
import { uuid, periodString, currencyCode, positiveAmount } from './common'

export const processPayrollBody = z.object({
  action: z.literal('process'),
  period: periodString,
  overtime: z.record(z.string(), z.object({
    hours: z.number().min(0),
    rate: z.number().min(1).optional(),
  })).optional(),
  bonuses: z.record(z.string(), z.array(z.object({
    type: z.string(),
    amount: z.number().positive(),
    description: z.string().optional(),
  }))).optional(),
  garnishments: z.record(z.string(), z.array(z.object({
    type: z.string(),
    amount: z.number().positive(),
    caseNumber: z.string().optional(),
    priority: z.number().int().min(1),
  }))).optional(),
})

export const generatePayStubBody = z.object({
  action: z.literal('pay-stub'),
  employeeId: uuid,
  payrollRunId: uuid,
})

export const approvePayrollBody = z.object({
  action: z.literal('approve'),
  payrollRunId: uuid,
  approverId: uuid,
  approverRole: z.string(),
})

export const markProcessingBody = z.object({
  action: z.literal('mark-processing'),
  payrollRunId: uuid,
})

export const markPaidBody = z.object({
  action: z.literal('mark-paid'),
  payrollRunId: uuid,
  paymentReference: z.string().min(1),
})

export const cancelPayrollBody = z.object({
  action: z.literal('cancel'),
  payrollRunId: uuid,
  reason: z.string().min(1),
})

export const payrollPostBody = z.discriminatedUnion('action', [
  processPayrollBody,
  generatePayStubBody,
  approvePayrollBody,
  markProcessingBody,
  markPaidBody,
  cancelPayrollBody,
])

// GET query param validation
export const calculateTaxParams = z.object({
  country: z.string().min(2).max(2).toUpperCase(),
  salary: z.coerce.number().int().positive('Salary must be a positive number'),
  state: z.string().optional(),
  filingStatus: z.enum(['single', 'married_joint', 'married_separate', 'head_of_household']).optional(),
})

export const convertCurrencyParams = z.object({
  amount: z.coerce.number().positive('Amount must be positive'),
  from: currencyCode,
  to: currencyCode,
})
