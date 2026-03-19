import { z } from 'zod'
import { uuid, periodString, currencyCode, positiveAmount } from './common'

export const processPayrollBody = z.object({
  action: z.literal('process'),
  period: periodString,
  country: z.string().min(2).max(3).optional(), // Fix 5: country filter
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

// Fix 2: New submit action
export const submitPayrollBody = z.object({
  action: z.literal('submit'),
  payrollRunId: uuid,
  submitterId: uuid,
})

// Fix 2: HR approve
export const approveHRBody = z.object({
  action: z.literal('approve-hr'),
  payrollRunId: uuid,
  approverId: uuid,
  comment: z.string().optional(),
})

// Fix 2: Finance approve
export const approveFinanceBody = z.object({
  action: z.literal('approve-finance'),
  payrollRunId: uuid,
  approverId: uuid,
  comment: z.string().optional(),
})

// Fix 2: Reject
export const rejectPayrollBody = z.object({
  action: z.literal('reject'),
  payrollRunId: uuid,
  rejectorId: uuid,
  rejectorRole: z.string(),
  reason: z.string().min(1, 'Rejection reason is required'),
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

export const updateTaxConfigBody = z.object({
  action: z.literal('update-tax-config'),
  configId: z.string().optional(),  // existing config to supersede
  country: z.string().min(2),
  taxType: z.string().min(1),
  rate: z.number().min(0),
  description: z.string().optional(),
  employerContribution: z.number().min(0).optional(),
  employeeContribution: z.number().min(0).optional(),
  effectiveDate: z.string().optional(),
})

// Feature B: Update bank details
export const updateBankDetailsBody = z.object({
  action: z.literal('update-bank-details'),
  employeeId: z.string().min(1),
  bankName: z.string().optional(),
  bankCode: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  bankCountry: z.string().optional(),
  mobileMoneyProvider: z.string().optional(),
  mobileMoneyNumber: z.string().optional(),
})

// Feature C: Adjust payroll entry
export const adjustEntryBody = z.object({
  action: z.literal('adjust-entry'),
  entryId: z.string().min(1),
  adHocBonus: z.number().optional(),
  additionalDeductionName: z.string().optional(),
  additionalDeductionAmount: z.number().optional(),
  overrideBenefitsAmount: z.number().optional(),
})

// Feature D: Save reconciliation notes
export const saveReconNotesBody = z.object({
  action: z.literal('save-reconciliation-notes'),
  comments: z.record(z.string(), z.string()).optional(),
  verified: z.record(z.string(), z.boolean()).optional(),
})

// Feature F: Authorize payment
export const authorizePaymentBody = z.object({
  action: z.literal('authorize-payment'),
  payrollRunId: z.string().min(1),
  paymentReference: z.string().min(1),
  authorizationCode: z.string().optional(),
  authorizerId: z.string().optional(),
})

export const payrollPostBody = z.discriminatedUnion('action', [
  processPayrollBody,
  generatePayStubBody,
  approvePayrollBody,
  submitPayrollBody,
  approveHRBody,
  approveFinanceBody,
  rejectPayrollBody,
  markProcessingBody,
  markPaidBody,
  cancelPayrollBody,
  updateTaxConfigBody,
  updateBankDetailsBody,
  adjustEntryBody,
  saveReconNotesBody,
  authorizePaymentBody,
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
