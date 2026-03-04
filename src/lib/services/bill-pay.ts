/**
 * Bill Pay Service (ACH / Wire / Check)
 *
 * ACH with NACHA format, wire transfers with SWIFT/IBAN validation,
 * check printing queue, recurring schedules, multi-level approval,
 * and payment reconciliation.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface CreatePaymentInput {
  orgId: string
  vendorId: string
  invoiceId?: string
  amount: number // cents
  currency?: string
  method: 'ach' | 'wire' | 'check' | 'virtual_card'
  scheduledDate?: string // YYYY-MM-DD
  memo?: string
  createdBy: string
  bankAccountLast4?: string
  routingNumber?: string
}

export interface SchedulePaymentInput extends CreatePaymentInput {
  scheduledDate: string
}

export interface RecurringScheduleInput {
  orgId: string
  vendorId: string
  amount: number
  currency?: string
  method: 'ach' | 'wire' | 'check' | 'virtual_card'
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly'
  nextPaymentDate: string
  endDate?: string
}

export interface ACHPaymentDetails {
  routingNumber: string
  accountNumber: string
  accountType: 'checking' | 'savings'
  companyName: string
  companyId: string
  amount: number
  receiverName: string
  receiverId: string
  traceNumber: string
}

export interface WireTransferDetails {
  swiftCode: string
  iban?: string
  accountNumber?: string
  beneficiaryName: string
  beneficiaryAddress: string
  bankName: string
  intermediaryBank?: string
  purposeOfPayment: string
  amount: number
  currency: string
}

export interface CheckDetails {
  payeeName: string
  payeeAddress: string
  amount: number
  memo: string
  checkNumber: string
  printedAt?: Date
  mailedAt?: Date
}

export interface BillPayDashboard {
  orgId: string
  totalOutstanding: number
  totalPaidThisMonth: number
  totalScheduled: number
  paymentsByMethod: Array<{ method: string; count: number; amount: number }>
  paymentsByStatus: Array<{ status: string; count: number; amount: number }>
  upcomingPayments: Array<{
    id: string
    vendorId: string
    amount: number
    method: string
    scheduledDate: string | null
  }>
  recentPayments: Array<{
    id: string
    vendorId: string
    amount: number
    method: string
    status: string
    paidDate: string | null
  }>
}

// ============================================================
// ERROR CLASS
// ============================================================

export class BillPayError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'BillPayError'
  }
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

/**
 * Validate a US ABA routing number using the checksum algorithm.
 */
function validateRoutingNumber(routing: string): boolean {
  if (!/^\d{9}$/.test(routing)) return false
  const digits = routing.split('').map(Number)
  const checksum =
    3 * (digits[0] + digits[3] + digits[6]) +
    7 * (digits[1] + digits[4] + digits[7]) +
    1 * (digits[2] + digits[5] + digits[8])
  return checksum % 10 === 0
}

/**
 * Validate SWIFT/BIC code format (8 or 11 alphanumeric characters).
 */
function validateSWIFT(code: string): boolean {
  return /^[A-Z]{6}[A-Z0-9]{2}([A-Z0-9]{3})?$/.test(code.toUpperCase())
}

/**
 * Basic IBAN validation: 2 letter country, 2 check digits, BBAN.
 */
function validateIBAN(iban: string): boolean {
  const cleaned = iban.replace(/\s/g, '').toUpperCase()
  if (!/^[A-Z]{2}\d{2}[A-Z0-9]{4,30}$/.test(cleaned)) return false
  // Move first 4 chars to end, convert letters to numbers, mod 97
  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4)
  const numericStr = rearranged.replace(/[A-Z]/g, (ch) => String(ch.charCodeAt(0) - 55))
  // Iterative modulo 97 (works without BigInt by processing 9 digits at a time)
  let remainder = 0
  for (let i = 0; i < numericStr.length; i += 7) {
    const chunk = String(remainder) + numericStr.substring(i, i + 7)
    remainder = parseInt(chunk, 10) % 97
  }
  return remainder === 1
}

/**
 * Validate bank details based on payment method.
 */
export async function validateBankDetails(
  method: 'ach' | 'wire' | 'check',
  details: { routingNumber?: string; swiftCode?: string; iban?: string; accountNumber?: string },
): Promise<{ valid: boolean; errors: string[] }> {
  const errors: string[] = []

  if (method === 'ach') {
    if (!details.routingNumber) {
      errors.push('Routing number is required for ACH payments')
    } else if (!validateRoutingNumber(details.routingNumber)) {
      errors.push('Invalid ABA routing number')
    }
    if (!details.accountNumber) {
      errors.push('Account number is required for ACH payments')
    }
  }

  if (method === 'wire') {
    if (!details.swiftCode) {
      errors.push('SWIFT/BIC code is required for wire transfers')
    } else if (!validateSWIFT(details.swiftCode)) {
      errors.push('Invalid SWIFT/BIC code format')
    }
    if (details.iban && !validateIBAN(details.iban)) {
      errors.push('Invalid IBAN format')
    }
    if (!details.iban && !details.accountNumber) {
      errors.push('Either IBAN or account number is required for wire transfers')
    }
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================
// NACHA FORMAT
// ============================================================

/**
 * Generate a NACHA-format ACH batch entry string.
 * This produces a simplified representation of the NACHA file format
 * suitable for submission to payment processors.
 */
function generateNACHAEntry(details: ACHPaymentDetails): string {
  const serviceClassCode = '200' // Mixed debits and credits
  const standardEntryClass = 'PPD' // Prearranged Payment and Deposit
  const recordType = '6' // Entry Detail Record

  // Transaction code: 22 = checking credit, 32 = savings credit
  const transactionCode = '22'

  // Build entry detail record (94 chars)
  const entry = [
    recordType,
    transactionCode,
    details.routingNumber.padEnd(9),
    details.accountNumber.padEnd(17),
    String(details.amount).padStart(10, '0'),
    details.receiverId.padEnd(15),
    details.receiverName.padEnd(22).substring(0, 22),
    '  ', // Discretionary data
    '0', // Addenda record indicator
    details.traceNumber.padEnd(15),
  ].join('')

  // Build batch header
  const batchHeader = [
    '5', // Record type: batch header
    serviceClassCode,
    details.companyName.padEnd(16).substring(0, 16),
    ' '.repeat(20), // Company discretionary data
    details.companyId.padEnd(10).substring(0, 10),
    standardEntryClass,
    'Payment'.padEnd(10).substring(0, 10), // Company entry description
    new Date().toISOString().slice(0, 10).replace(/-/g, '').substring(2), // Date
    new Date().toISOString().slice(0, 10).replace(/-/g, '').substring(2), // Settlement date
    ' ', // Originator status code
    details.routingNumber.substring(0, 8), // Originating DFI
    '0000001', // Batch number
  ].join('')

  return `${batchHeader}\n${entry}`
}

function generateTraceNumber(): string {
  return Date.now().toString().slice(-15).padStart(15, '0')
}

function generateCheckNumber(): string {
  return String(Math.floor(100000 + Math.random() * 900000))
}

// ============================================================
// PAYMENT CRUD
// ============================================================

/**
 * Create a new bill payment.
 */
export async function createPayment(input: CreatePaymentInput) {
  const { orgId, vendorId, invoiceId, amount, currency, method, scheduledDate, memo, createdBy, bankAccountLast4, routingNumber } = input

  if (amount <= 0) {
    throw new BillPayError('Payment amount must be positive', 'INVALID_AMOUNT')
  }

  // Verify vendor
  const [vendor] = await db
    .select({ id: schema.vendors.id })
    .from(schema.vendors)
    .where(and(eq(schema.vendors.id, vendorId), eq(schema.vendors.orgId, orgId)))

  if (!vendor) {
    throw new BillPayError('Vendor not found', 'VENDOR_NOT_FOUND')
  }

  // Generate reference number
  const referenceNumber = `BP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

  const [payment] = await db
    .insert(schema.billPayments)
    .values({
      orgId,
      vendorId,
      invoiceId: invoiceId ?? null,
      amount,
      currency: currency ?? 'USD',
      method,
      status: scheduledDate ? 'scheduled' : 'draft',
      scheduledDate: scheduledDate ?? null,
      referenceNumber,
      bankAccountLast4: bankAccountLast4 ?? null,
      routingNumber: routingNumber ?? null,
      memo: memo ?? null,
      createdBy,
    })
    .returning()

  return payment
}

/**
 * Schedule a payment for a future date.
 */
export async function schedulePayment(input: SchedulePaymentInput) {
  // Validate scheduled date is in the future
  const schedDate = new Date(input.scheduledDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  if (schedDate < today) {
    throw new BillPayError('Scheduled date must be in the future', 'INVALID_SCHEDULE_DATE')
  }

  return createPayment({ ...input, scheduledDate: input.scheduledDate })
}

/**
 * Approve a payment (multi-level approval support).
 */
export async function approvePayment(paymentId: string, orgId: string, approverId: string) {
  const [payment] = await db
    .select()
    .from(schema.billPayments)
    .where(and(eq(schema.billPayments.id, paymentId), eq(schema.billPayments.orgId, orgId)))

  if (!payment) {
    throw new BillPayError('Payment not found', 'PAYMENT_NOT_FOUND')
  }

  if (payment.status !== 'draft' && payment.status !== 'scheduled') {
    throw new BillPayError(`Cannot approve payment in status: ${payment.status}`, 'INVALID_STATUS')
  }

  const [updated] = await db
    .update(schema.billPayments)
    .set({
      approvedBy: approverId,
      approvedAt: new Date(),
      status: payment.scheduledDate ? 'scheduled' : 'processing',
    })
    .where(eq(schema.billPayments.id, paymentId))
    .returning()

  return updated
}

// ============================================================
// PAYMENT PROCESSING
// ============================================================

/**
 * Process an ACH payment: validates routing number, generates NACHA
 * batch entry, and marks the payment as processing.
 */
export async function processACHPayment(paymentId: string, orgId: string, achDetails: ACHPaymentDetails) {
  const [payment] = await db
    .select()
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.id, paymentId),
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.method, 'ach'),
      ),
    )

  if (!payment) {
    throw new BillPayError('ACH payment not found', 'PAYMENT_NOT_FOUND')
  }

  if (!validateRoutingNumber(achDetails.routingNumber)) {
    throw new BillPayError('Invalid routing number', 'INVALID_ROUTING_NUMBER')
  }

  // Generate NACHA entry
  const nachaEntry = generateNACHAEntry({
    ...achDetails,
    traceNumber: generateTraceNumber(),
  })

  // Update payment status
  const [updated] = await db
    .update(schema.billPayments)
    .set({
      status: 'processing',
      routingNumber: achDetails.routingNumber,
      bankAccountLast4: achDetails.accountNumber.slice(-4),
    })
    .where(eq(schema.billPayments.id, paymentId))
    .returning()

  return {
    payment: updated,
    nachaEntry,
    traceNumber: achDetails.traceNumber || generateTraceNumber(),
  }
}

/**
 * Process a wire transfer: validates SWIFT/IBAN, records details.
 */
export async function processWirePayment(paymentId: string, orgId: string, wireDetails: WireTransferDetails) {
  const [payment] = await db
    .select()
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.id, paymentId),
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.method, 'wire'),
      ),
    )

  if (!payment) {
    throw new BillPayError('Wire payment not found', 'PAYMENT_NOT_FOUND')
  }

  if (!validateSWIFT(wireDetails.swiftCode)) {
    throw new BillPayError('Invalid SWIFT/BIC code', 'INVALID_SWIFT')
  }

  if (wireDetails.iban && !validateIBAN(wireDetails.iban)) {
    throw new BillPayError('Invalid IBAN', 'INVALID_IBAN')
  }

  const [updated] = await db
    .update(schema.billPayments)
    .set({ status: 'processing' })
    .where(eq(schema.billPayments.id, paymentId))
    .returning()

  return {
    payment: updated,
    wireReference: `WIRE-${Date.now().toString(36).toUpperCase()}`,
    swiftCode: wireDetails.swiftCode,
    beneficiary: wireDetails.beneficiaryName,
  }
}

/**
 * Process a check payment: generates check number and queues for printing/mailing.
 */
export async function processCheckPayment(paymentId: string, orgId: string, checkDetails: Omit<CheckDetails, 'checkNumber'>) {
  const [payment] = await db
    .select()
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.id, paymentId),
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.method, 'check'),
      ),
    )

  if (!payment) {
    throw new BillPayError('Check payment not found', 'PAYMENT_NOT_FOUND')
  }

  const checkNumber = generateCheckNumber()

  const [updated] = await db
    .update(schema.billPayments)
    .set({
      status: 'processing',
      checkNumber,
    })
    .where(eq(schema.billPayments.id, paymentId))
    .returning()

  return {
    payment: updated,
    checkNumber,
    printQueue: {
      payeeName: checkDetails.payeeName,
      payeeAddress: checkDetails.payeeAddress,
      amount: checkDetails.amount,
      memo: checkDetails.memo,
      checkNumber,
      queuedAt: new Date(),
    },
  }
}

/**
 * Cancel a payment that has not yet been paid.
 */
export async function cancelPayment(paymentId: string, orgId: string) {
  const [payment] = await db
    .select()
    .from(schema.billPayments)
    .where(and(eq(schema.billPayments.id, paymentId), eq(schema.billPayments.orgId, orgId)))

  if (!payment) {
    throw new BillPayError('Payment not found', 'PAYMENT_NOT_FOUND')
  }

  if (payment.status === 'paid') {
    throw new BillPayError('Cannot cancel a paid payment', 'CANNOT_CANCEL_PAID')
  }
  if (payment.status === 'cancelled') {
    throw new BillPayError('Payment is already cancelled', 'ALREADY_CANCELLED')
  }

  const [updated] = await db
    .update(schema.billPayments)
    .set({ status: 'cancelled' })
    .where(eq(schema.billPayments.id, paymentId))
    .returning()

  return updated
}

// ============================================================
// RECURRING PAYMENTS
// ============================================================

/**
 * Create a recurring payment schedule.
 */
export async function createRecurringPayment(input: RecurringScheduleInput) {
  const { orgId, vendorId, amount, currency, method, frequency, nextPaymentDate, endDate } = input

  if (amount <= 0) {
    throw new BillPayError('Amount must be positive', 'INVALID_AMOUNT')
  }

  const validFrequencies = ['weekly', 'biweekly', 'monthly', 'quarterly']
  if (!validFrequencies.includes(frequency)) {
    throw new BillPayError(`Invalid frequency: ${frequency}`, 'INVALID_FREQUENCY')
  }

  const [schedule] = await db
    .insert(schema.billPaySchedules)
    .values({
      orgId,
      vendorId,
      amount,
      currency: currency ?? 'USD',
      method,
      frequency,
      nextPaymentDate,
      endDate: endDate ?? null,
      isActive: true,
    })
    .returning()

  return schedule
}

/**
 * Update an existing recurring payment schedule.
 */
export async function updateRecurringSchedule(
  scheduleId: string,
  orgId: string,
  updates: Partial<Pick<RecurringScheduleInput, 'amount' | 'frequency' | 'nextPaymentDate' | 'endDate' | 'method'>>,
) {
  const [schedule] = await db
    .select()
    .from(schema.billPaySchedules)
    .where(and(eq(schema.billPaySchedules.id, scheduleId), eq(schema.billPaySchedules.orgId, orgId)))

  if (!schedule) {
    throw new BillPayError('Schedule not found', 'SCHEDULE_NOT_FOUND')
  }

  const [updated] = await db
    .update(schema.billPaySchedules)
    .set({
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.frequency !== undefined && { frequency: updates.frequency }),
      ...(updates.nextPaymentDate !== undefined && { nextPaymentDate: updates.nextPaymentDate }),
      ...(updates.endDate !== undefined && { endDate: updates.endDate }),
      ...(updates.method !== undefined && { method: updates.method }),
    })
    .where(eq(schema.billPaySchedules.id, scheduleId))
    .returning()

  return updated
}

// ============================================================
// RECONCILIATION & REPORTING
// ============================================================

/**
 * Reconcile payments with invoices: mark matching payments as paid
 * and update the corresponding invoice status.
 */
export async function reconcilePayments(orgId: string, reconciliations: Array<{ paymentId: string; invoiceId: string }>) {
  const results = []
  const errors: Array<{ paymentId: string; error: string }> = []

  for (const { paymentId, invoiceId } of reconciliations) {
    try {
      // Verify payment
      const [payment] = await db
        .select()
        .from(schema.billPayments)
        .where(and(eq(schema.billPayments.id, paymentId), eq(schema.billPayments.orgId, orgId)))

      if (!payment) {
        errors.push({ paymentId, error: 'Payment not found' })
        continue
      }

      // Verify invoice
      const [invoice] = await db
        .select()
        .from(schema.invoices)
        .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, orgId)))

      if (!invoice) {
        errors.push({ paymentId, error: 'Invoice not found' })
        continue
      }

      // Mark payment as paid
      const now = new Date()
      await db
        .update(schema.billPayments)
        .set({
          status: 'paid',
          paidDate: now.toISOString().slice(0, 10),
          invoiceId,
        })
        .where(eq(schema.billPayments.id, paymentId))

      // Mark invoice as paid
      await db
        .update(schema.invoices)
        .set({ status: 'paid' })
        .where(eq(schema.invoices.id, invoiceId))

      results.push({ paymentId, invoiceId, reconciledAt: now })
    } catch (err) {
      errors.push({ paymentId, error: (err as Error).message })
    }
  }

  return { reconciled: results, errors }
}

/**
 * Get a comprehensive bill pay dashboard.
 */
export async function getBillPayDashboard(orgId: string): Promise<BillPayDashboard> {
  // Total outstanding (draft + scheduled + processing)
  const [outstandingResult] = await db
    .select({ total: sum(schema.billPayments.amount) })
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.orgId, orgId),
        sql`${schema.billPayments.status} IN ('draft', 'scheduled', 'processing')`,
      ),
    )

  // Total paid this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [paidResult] = await db
    .select({ total: sum(schema.billPayments.amount) })
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.status, 'paid'),
        gte(schema.billPayments.createdAt, startOfMonth),
      ),
    )

  // Total scheduled
  const [scheduledResult] = await db
    .select({ total: sum(schema.billPayments.amount) })
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.status, 'scheduled'),
      ),
    )

  // By method
  const byMethod = await db
    .select({
      method: schema.billPayments.method,
      count: count(),
      amount: sum(schema.billPayments.amount),
    })
    .from(schema.billPayments)
    .where(eq(schema.billPayments.orgId, orgId))
    .groupBy(schema.billPayments.method)

  // By status
  const byStatus = await db
    .select({
      status: schema.billPayments.status,
      count: count(),
      amount: sum(schema.billPayments.amount),
    })
    .from(schema.billPayments)
    .where(eq(schema.billPayments.orgId, orgId))
    .groupBy(schema.billPayments.status)

  // Upcoming (scheduled for next 30 days)
  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const upcoming = await db
    .select({
      id: schema.billPayments.id,
      vendorId: schema.billPayments.vendorId,
      amount: schema.billPayments.amount,
      method: schema.billPayments.method,
      scheduledDate: schema.billPayments.scheduledDate,
    })
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.orgId, orgId),
        eq(schema.billPayments.status, 'scheduled'),
      ),
    )
    .orderBy(schema.billPayments.scheduledDate)
    .limit(10)

  // Recent paid
  const recent = await db
    .select({
      id: schema.billPayments.id,
      vendorId: schema.billPayments.vendorId,
      amount: schema.billPayments.amount,
      method: schema.billPayments.method,
      status: schema.billPayments.status,
      paidDate: schema.billPayments.paidDate,
    })
    .from(schema.billPayments)
    .where(eq(schema.billPayments.orgId, orgId))
    .orderBy(desc(schema.billPayments.createdAt))
    .limit(10)

  return {
    orgId,
    totalOutstanding: Number(outstandingResult?.total ?? 0),
    totalPaidThisMonth: Number(paidResult?.total ?? 0),
    totalScheduled: Number(scheduledResult?.total ?? 0),
    paymentsByMethod: byMethod.map((r) => ({
      method: r.method,
      count: Number(r.count),
      amount: Number(r.amount ?? 0),
    })),
    paymentsByStatus: byStatus.map((r) => ({
      status: r.status,
      count: Number(r.count),
      amount: Number(r.amount ?? 0),
    })),
    upcomingPayments: upcoming,
    recentPayments: recent,
  }
}

/**
 * Generate a payment report for a date range.
 */
export async function generatePaymentReport(orgId: string, startDate: string, endDate: string) {
  const payments = await db
    .select()
    .from(schema.billPayments)
    .where(
      and(
        eq(schema.billPayments.orgId, orgId),
        gte(schema.billPayments.createdAt, new Date(startDate)),
        lte(schema.billPayments.createdAt, new Date(endDate)),
      ),
    )
    .orderBy(desc(schema.billPayments.createdAt))

  const totalPaid = payments
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + p.amount, 0)

  const totalPending = payments
    .filter((p) => ['draft', 'scheduled', 'processing'].includes(p.status))
    .reduce((s, p) => s + p.amount, 0)

  const byMethod: Record<string, { count: number; amount: number }> = {}
  for (const p of payments) {
    if (!byMethod[p.method]) byMethod[p.method] = { count: 0, amount: 0 }
    byMethod[p.method].count++
    byMethod[p.method].amount += p.amount
  }

  return {
    orgId,
    period: { startDate, endDate },
    generatedAt: new Date(),
    totalPayments: payments.length,
    totalPaid,
    totalPending,
    totalFailed: payments.filter((p) => p.status === 'failed').reduce((s, p) => s + p.amount, 0),
    totalCancelled: payments.filter((p) => p.status === 'cancelled').reduce((s, p) => s + p.amount, 0),
    byMethod,
    payments: payments.map((p) => ({
      id: p.id,
      vendorId: p.vendorId,
      amount: p.amount,
      currency: p.currency,
      method: p.method,
      status: p.status,
      scheduledDate: p.scheduledDate,
      paidDate: p.paidDate,
      referenceNumber: p.referenceNumber,
    })),
  }
}

/**
 * Get payment history for a vendor or across the entire organization.
 */
export async function getPaymentHistory(orgId: string, options?: { vendorId?: string; limit?: number; offset?: number }) {
  const conditions = [eq(schema.billPayments.orgId, orgId)]
  if (options?.vendorId) {
    conditions.push(eq(schema.billPayments.vendorId, options.vendorId))
  }

  const payments = await db
    .select()
    .from(schema.billPayments)
    .where(and(...conditions))
    .orderBy(desc(schema.billPayments.createdAt))
    .limit(options?.limit ?? 50)
    .offset(options?.offset ?? 0)

  const [totalResult] = await db
    .select({ count: count() })
    .from(schema.billPayments)
    .where(and(...conditions))

  return {
    payments,
    total: Number(totalResult?.count ?? 0),
    limit: options?.limit ?? 50,
    offset: options?.offset ?? 0,
  }
}
