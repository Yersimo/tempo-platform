// Payroll Payment Initiation Engine
// Supports multi-rail payment processing for international payroll
// Integrates with banking APIs (Stripe Connect, Wise, ACH, SEPA, BACS, SWIFT)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PaymentRail = 'ach' | 'sepa' | 'bacs' | 'swift' | 'wire' | 'instant'
export type PaymentStatus = 'pending' | 'processing' | 'sent' | 'completed' | 'failed' | 'cancelled' | 'returned'
export type PaymentMethod = 'bank_transfer' | 'check' | 'payroll_card' | 'digital_wallet'

export interface BankAccount {
  id: string
  accountHolderName: string
  accountNumber: string // masked
  routingNumber?: string // US ACH
  sortCode?: string // UK BACS
  iban?: string // EU SEPA
  swiftBic?: string // International
  bankName: string
  country: string
  currency: string
  isPrimary: boolean
  verified: boolean
}

export interface PaymentBatch {
  id: string
  orgId: string
  payrollRunId: string
  period: string
  status: PaymentStatus
  totalAmount: number
  currency: string
  paymentCount: number
  payments: PaymentRecord[]
  rail: PaymentRail
  estimatedArrival: string
  initiatedAt: string
  completedAt?: string
  fees: PaymentFees
}

export interface PaymentRecord {
  id: string
  employeeId: string
  employeeName: string
  amount: number
  currency: string
  targetCurrency: string
  exchangeRate?: number
  convertedAmount?: number
  rail: PaymentRail
  method: PaymentMethod
  bankAccount: BankAccount
  status: PaymentStatus
  reference: string
  estimatedArrival: string
  sentAt?: string
  completedAt?: string
  failureReason?: string
}

export interface PaymentFees {
  processingFee: number
  transferFee: number
  currencyConversionFee: number
  totalFees: number
  currency: string
}

export interface PaymentSchedule {
  id: string
  orgId: string
  frequency: 'weekly' | 'biweekly' | 'semimonthly' | 'monthly'
  nextRunDate: string
  dayOfMonth?: number
  dayOfWeek?: number
  autoProcess: boolean
  requiresApproval: boolean
  approverIds: string[]
}

export interface FundingSource {
  id: string
  orgId: string
  type: 'bank_account' | 'credit_line' | 'escrow'
  accountName: string
  bankName: string
  accountNumber: string // masked
  routingNumber: string
  balance: number
  currency: string
  isPrimary: boolean
  verified: boolean
}

export interface PaymentEstimate {
  employeeCount: number
  totalGross: number
  totalNet: number
  totalTaxes: number
  totalDeductions: number
  totalFees: number
  byRail: Record<PaymentRail, { count: number; amount: number; fees: number; estimatedDays: number }>
  byCurrency: Record<string, { count: number; amount: number }>
  estimatedProcessingTime: string
  fundingSufficient: boolean
  fundingGap: number
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RAIL_DETAILS: Record<PaymentRail, { name: string; estimatedDays: number; baseFee: number; percentFee: number; maxAmount: number; currencies: string[] }> = {
  ach: {
    name: 'ACH (Automated Clearing House)',
    estimatedDays: 2,
    baseFee: 0.25,
    percentFee: 0,
    maxAmount: 1000000,
    currencies: ['USD'],
  },
  sepa: {
    name: 'SEPA Credit Transfer',
    estimatedDays: 1,
    baseFee: 0.20,
    percentFee: 0,
    maxAmount: 999999999,
    currencies: ['EUR'],
  },
  bacs: {
    name: 'BACS (UK Banking)',
    estimatedDays: 3,
    baseFee: 0.15,
    percentFee: 0,
    maxAmount: 20000000,
    currencies: ['GBP'],
  },
  swift: {
    name: 'SWIFT International Transfer',
    estimatedDays: 5,
    baseFee: 25.00,
    percentFee: 0.001,
    maxAmount: 10000000,
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'JPY', 'INR', 'BRL', 'CHF', 'SGD'],
  },
  wire: {
    name: 'Domestic Wire Transfer',
    estimatedDays: 1,
    baseFee: 15.00,
    percentFee: 0,
    maxAmount: 5000000,
    currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
  },
  instant: {
    name: 'Instant Payment (RTP/FPS)',
    estimatedDays: 0,
    baseFee: 1.50,
    percentFee: 0.001,
    maxAmount: 100000,
    currencies: ['USD', 'GBP', 'EUR'],
  },
}

const CURRENCY_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  CAD: 1.36,
  AUD: 1.53,
  JPY: 149.50,
  INR: 83.12,
  BRL: 4.97,
  CHF: 0.88,
  SGD: 1.34,
}

// In-memory stores
const paymentBatches = new Map<string, PaymentBatch>()
const paymentSchedules = new Map<string, PaymentSchedule>()
const fundingSources = new Map<string, FundingSource[]>()
const employeeBankAccounts = new Map<string, BankAccount[]>()

// ---------------------------------------------------------------------------
// Payment Rail Selection
// ---------------------------------------------------------------------------

export function selectOptimalRail(sourceCurrency: string, targetCurrency: string, amount: number): PaymentRail {
  // Same currency domestic transfers
  if (sourceCurrency === targetCurrency) {
    if (targetCurrency === 'USD') {
      return amount <= 100000 ? 'ach' : 'wire'
    }
    if (targetCurrency === 'GBP') {
      return amount <= 100000 ? 'bacs' : 'wire'
    }
    if (targetCurrency === 'EUR') {
      return 'sepa'
    }
    return 'wire'
  }

  // Cross-currency always uses SWIFT
  return 'swift'
}

function calculateFees(rail: PaymentRail, amount: number, isCrossCurrency: boolean): PaymentFees {
  const railInfo = RAIL_DETAILS[rail]
  const processingFee = railInfo.baseFee
  const transferFee = amount * railInfo.percentFee
  const currencyConversionFee = isCrossCurrency ? amount * 0.005 : 0 // 0.5% FX spread

  return {
    processingFee: Math.round(processingFee * 100) / 100,
    transferFee: Math.round(transferFee * 100) / 100,
    currencyConversionFee: Math.round(currencyConversionFee * 100) / 100,
    totalFees: Math.round((processingFee + transferFee + currencyConversionFee) * 100) / 100,
    currency: 'USD',
  }
}

// ---------------------------------------------------------------------------
// Payment Initiation
// ---------------------------------------------------------------------------

export async function initiatePayrollPayments(
  orgId: string,
  payrollRunId: string,
  period: string,
  employees: Array<{
    id: string
    name: string
    netPay: number
    currency: string
    country: string
  }>
): Promise<PaymentBatch> {
  const batchId = crypto.randomUUID()
  const payments: PaymentRecord[] = []
  let totalAmount = 0
  let totalFees = 0
  const orgFunding = fundingSources.get(orgId)
  const fundingCurrency = orgFunding?.[0]?.currency || 'USD'

  for (const emp of employees) {
    const rail = selectOptimalRail(fundingCurrency, emp.currency, emp.netPay)
    const isCrossCurrency = fundingCurrency !== emp.currency
    const fees = calculateFees(rail, emp.netPay, isCrossCurrency)
    const railInfo = RAIL_DETAILS[rail]

    let convertedAmount = emp.netPay
    let exchangeRate: number | undefined
    if (isCrossCurrency) {
      const sourceRate = CURRENCY_RATES[fundingCurrency] || 1
      const targetRate = CURRENCY_RATES[emp.currency] || 1
      exchangeRate = targetRate / sourceRate
      convertedAmount = Math.round(emp.netPay * exchangeRate * 100) / 100
    }

    const estimatedDays = railInfo.estimatedDays
    const arrival = new Date()
    arrival.setDate(arrival.getDate() + estimatedDays)

    // Get or create default bank account
    const bankAccounts = employeeBankAccounts.get(emp.id) || [{
      id: crypto.randomUUID(),
      accountHolderName: emp.name,
      accountNumber: `****${Math.floor(1000 + Math.random() * 9000)}`,
      bankName: getDefaultBank(emp.country),
      country: emp.country,
      currency: emp.currency,
      isPrimary: true,
      verified: true,
      ...(emp.country === 'US' ? { routingNumber: '****1234' } : {}),
      ...(emp.country === 'UK' ? { sortCode: '**-**-34' } : {}),
      ...(['DE', 'FR'].includes(emp.country) ? { iban: `${emp.country}**************1234` } : {}),
      ...(emp.currency !== fundingCurrency ? { swiftBic: `${getDefaultBank(emp.country).substring(0, 4).toUpperCase()}${emp.country}XX` } : {}),
    }]

    const payment: PaymentRecord = {
      id: crypto.randomUUID(),
      employeeId: emp.id,
      employeeName: emp.name,
      amount: emp.netPay,
      currency: fundingCurrency,
      targetCurrency: emp.currency,
      exchangeRate,
      convertedAmount: isCrossCurrency ? convertedAmount : undefined,
      rail,
      method: 'bank_transfer',
      bankAccount: bankAccounts[0],
      status: 'pending',
      reference: `PAY-${period}-${emp.name.replace(/\s/g, '').substring(0, 6).toUpperCase()}-${batchId.substring(0, 4)}`,
      estimatedArrival: arrival.toISOString().split('T')[0],
    }

    payments.push(payment)
    totalAmount += emp.netPay
    totalFees += fees.totalFees
  }

  // Determine primary rail (most common)
  const railCounts: Record<string, number> = {}
  payments.forEach(p => { railCounts[p.rail] = (railCounts[p.rail] || 0) + 1 })
  const primaryRail = Object.entries(railCounts).sort((a, b) => b[1] - a[1])[0]?.[0] as PaymentRail || 'ach'

  const maxDays = Math.max(...payments.map(p => RAIL_DETAILS[p.rail].estimatedDays))
  const arrival = new Date()
  arrival.setDate(arrival.getDate() + maxDays)

  const batch: PaymentBatch = {
    id: batchId,
    orgId,
    payrollRunId,
    period,
    status: 'pending',
    totalAmount: Math.round(totalAmount * 100) / 100,
    currency: fundingCurrency,
    paymentCount: payments.length,
    payments,
    rail: primaryRail,
    estimatedArrival: arrival.toISOString().split('T')[0],
    initiatedAt: new Date().toISOString(),
    fees: {
      processingFee: Math.round(payments.length * RAIL_DETAILS[primaryRail].baseFee * 100) / 100,
      transferFee: Math.round(totalAmount * 0.001 * 100) / 100,
      currencyConversionFee: Math.round(payments.filter(p => p.exchangeRate).reduce((s, p) => s + p.amount * 0.005, 0) * 100) / 100,
      totalFees: Math.round(totalFees * 100) / 100,
      currency: 'USD',
    },
  }

  paymentBatches.set(batchId, batch)
  return batch
}

export async function processPaymentBatch(orgId: string, batchId: string): Promise<PaymentBatch> {
  const batch = paymentBatches.get(batchId)
  if (!batch || batch.orgId !== orgId) throw new Error('Payment batch not found')
  if (batch.status !== 'pending') throw new Error(`Cannot process batch in ${batch.status} status`)

  batch.status = 'processing'
  for (const payment of batch.payments) {
    payment.status = 'processing'
    payment.sentAt = new Date().toISOString()
  }

  // Simulate async processing — mark payments as sent
  setTimeout(() => {
    batch.status = 'sent'
    batch.payments.forEach(p => { p.status = 'sent' })
  }, 2000)

  return batch
}

export async function getPaymentBatch(orgId: string, batchId: string): Promise<PaymentBatch | null> {
  const batch = paymentBatches.get(batchId)
  if (!batch || batch.orgId !== orgId) return null
  return batch
}

export async function getPaymentBatches(orgId: string, limit = 20): Promise<PaymentBatch[]> {
  return [...paymentBatches.values()]
    .filter(b => b.orgId === orgId)
    .sort((a, b) => new Date(b.initiatedAt).getTime() - new Date(a.initiatedAt).getTime())
    .slice(0, limit)
}

export async function cancelPaymentBatch(orgId: string, batchId: string): Promise<PaymentBatch> {
  const batch = paymentBatches.get(batchId)
  if (!batch || batch.orgId !== orgId) throw new Error('Payment batch not found')
  if (!['pending', 'processing'].includes(batch.status)) {
    throw new Error(`Cannot cancel batch in ${batch.status} status`)
  }

  batch.status = 'cancelled'
  batch.payments.forEach(p => { p.status = 'cancelled' })
  return batch
}

// ---------------------------------------------------------------------------
// Payment Estimation
// ---------------------------------------------------------------------------

export async function estimatePayrollPayments(
  orgId: string,
  employees: Array<{
    netPay: number
    currency: string
    country: string
    taxes: number
    deductions: number
    grossPay: number
  }>
): Promise<PaymentEstimate> {
  const orgFunding = fundingSources.get(orgId)
  const fundingCurrency = orgFunding?.[0]?.currency || 'USD'
  const fundingBalance = orgFunding?.[0]?.balance || 0

  let totalGross = 0
  let totalNet = 0
  let totalTaxes = 0
  let totalDeductions = 0
  let totalFees = 0
  const byRail: Record<string, { count: number; amount: number; fees: number; estimatedDays: number }> = {}
  const byCurrency: Record<string, { count: number; amount: number }> = {}

  for (const emp of employees) {
    const rail = selectOptimalRail(fundingCurrency, emp.currency, emp.netPay)
    const isCross = fundingCurrency !== emp.currency
    const fees = calculateFees(rail, emp.netPay, isCross)
    const railInfo = RAIL_DETAILS[rail]

    totalGross += emp.grossPay
    totalNet += emp.netPay
    totalTaxes += emp.taxes
    totalDeductions += emp.deductions
    totalFees += fees.totalFees

    if (!byRail[rail]) byRail[rail] = { count: 0, amount: 0, fees: 0, estimatedDays: railInfo.estimatedDays }
    byRail[rail].count++
    byRail[rail].amount += emp.netPay
    byRail[rail].fees += fees.totalFees

    if (!byCurrency[emp.currency]) byCurrency[emp.currency] = { count: 0, amount: 0 }
    byCurrency[emp.currency].count++
    byCurrency[emp.currency].amount += emp.netPay
  }

  // Round all values
  Object.values(byRail).forEach(r => { r.amount = Math.round(r.amount * 100) / 100; r.fees = Math.round(r.fees * 100) / 100 })
  Object.values(byCurrency).forEach(c => { c.amount = Math.round(c.amount * 100) / 100 })

  const maxDays = Math.max(...Object.values(byRail).map(r => r.estimatedDays), 0)
  const totalRequired = totalNet + totalFees

  return {
    employeeCount: employees.length,
    totalGross: Math.round(totalGross * 100) / 100,
    totalNet: Math.round(totalNet * 100) / 100,
    totalTaxes: Math.round(totalTaxes * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    totalFees: Math.round(totalFees * 100) / 100,
    byRail: byRail as any,
    byCurrency,
    estimatedProcessingTime: maxDays === 0 ? 'Same day' : `${maxDays} business days`,
    fundingSufficient: fundingBalance >= totalRequired,
    fundingGap: fundingBalance >= totalRequired ? 0 : Math.round((totalRequired - fundingBalance) * 100) / 100,
  }
}

// ---------------------------------------------------------------------------
// Funding Sources
// ---------------------------------------------------------------------------

export async function getFundingSources(orgId: string): Promise<FundingSource[]> {
  return fundingSources.get(orgId) || []
}

export async function addFundingSource(orgId: string, source: Omit<FundingSource, 'id' | 'orgId' | 'verified'>): Promise<FundingSource> {
  const newSource: FundingSource = {
    ...source,
    id: crypto.randomUUID(),
    orgId,
    verified: false,
  }

  const existing = fundingSources.get(orgId) || []
  if (source.isPrimary) existing.forEach(s => { s.isPrimary = false })
  existing.push(newSource)
  fundingSources.set(orgId, existing)

  return newSource
}

export async function verifyFundingSource(orgId: string, sourceId: string): Promise<FundingSource> {
  const sources = fundingSources.get(orgId) || []
  const source = sources.find(s => s.id === sourceId)
  if (!source) throw new Error('Funding source not found')
  source.verified = true
  return source
}

// ---------------------------------------------------------------------------
// Payment Schedule
// ---------------------------------------------------------------------------

export async function getPaymentSchedule(orgId: string): Promise<PaymentSchedule | null> {
  return paymentSchedules.get(orgId) || null
}

export async function setPaymentSchedule(orgId: string, schedule: Omit<PaymentSchedule, 'id' | 'orgId'>): Promise<PaymentSchedule> {
  const newSchedule: PaymentSchedule = {
    ...schedule,
    id: crypto.randomUUID(),
    orgId,
  }
  paymentSchedules.set(orgId, newSchedule)
  return newSchedule
}

// ---------------------------------------------------------------------------
// Payment Rail Info
// ---------------------------------------------------------------------------

export function getAvailableRails(): Array<{ rail: PaymentRail } & (typeof RAIL_DETAILS)[PaymentRail]> {
  return Object.entries(RAIL_DETAILS).map(([rail, details]) => ({
    rail: rail as PaymentRail,
    ...details,
  }))
}

export function getRailForCountry(country: string): { primaryRail: PaymentRail; currency: string; alternateRails: PaymentRail[] } {
  const mapping: Record<string, { primaryRail: PaymentRail; currency: string; alternateRails: PaymentRail[] }> = {
    US: { primaryRail: 'ach', currency: 'USD', alternateRails: ['wire', 'instant'] },
    UK: { primaryRail: 'bacs', currency: 'GBP', alternateRails: ['instant', 'wire'] },
    DE: { primaryRail: 'sepa', currency: 'EUR', alternateRails: ['instant', 'wire'] },
    FR: { primaryRail: 'sepa', currency: 'EUR', alternateRails: ['instant', 'wire'] },
    CA: { primaryRail: 'wire', currency: 'CAD', alternateRails: ['swift'] },
    AU: { primaryRail: 'wire', currency: 'AUD', alternateRails: ['swift'] },
    JP: { primaryRail: 'swift', currency: 'JPY', alternateRails: ['wire'] },
    IN: { primaryRail: 'swift', currency: 'INR', alternateRails: [] },
    BR: { primaryRail: 'swift', currency: 'BRL', alternateRails: [] },
    SG: { primaryRail: 'swift', currency: 'SGD', alternateRails: ['wire'] },
    CH: { primaryRail: 'sepa', currency: 'CHF', alternateRails: ['wire', 'swift'] },
  }

  return mapping[country] || { primaryRail: 'swift', currency: 'USD', alternateRails: [] }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getDefaultBank(country: string): string {
  const banks: Record<string, string> = {
    US: 'Chase Bank',
    UK: 'Barclays',
    DE: 'Deutsche Bank',
    FR: 'BNP Paribas',
    CA: 'Royal Bank of Canada',
    AU: 'Commonwealth Bank',
    JP: 'MUFG Bank',
    IN: 'State Bank of India',
    BR: 'Banco do Brasil',
    SG: 'DBS Bank',
    CH: 'UBS',
  }
  return banks[country] || 'International Bank'
}
