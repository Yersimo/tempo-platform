/**
 * Revenue Recognition Service — ASC 606 Five-Step Model
 *
 * 1. Identify the contract
 * 2. Identify performance obligations
 * 3. Determine transaction price
 * 4. Allocate transaction price (relative SSP)
 * 5. Recognize revenue (point-in-time or over-time)
 *
 * Generates revenue schedule entries and deferred revenue tracking.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

export interface CreateRevenueContractInput {
  orgId: string
  contractNumber: string
  customerName: string
  startDate: string // YYYY-MM-DD
  endDate: string
  totalValue: number // cents
  currency?: string
}

export interface AddPerformanceObligationInput {
  contractId: string
  description: string
  type: 'point_in_time' | 'over_time'
  standaloneSellingPrice: number // cents
  recognitionMethod: 'straight_line' | 'percentage_of_completion' | 'output' | 'input'
  startDate: string
  endDate: string
}

export interface RevenueWaterfallEntry {
  period: string // YYYY-MM
  newBookings: number
  recognized: number
  deferredBalance: number
}

export interface RevenueRecognitionSummary {
  totalContractValue: number
  totalRecognized: number
  totalDeferred: number
  activeContracts: number
  completedContracts: number
  avgContractLength: number
  recognitionByMethod: Record<string, number>
}

// ============================================================
// STEP 1: IDENTIFY THE CONTRACT
// ============================================================

export async function createRevenueContract(input: CreateRevenueContractInput) {
  const [contract] = await db
    .insert(schema.revenueContracts)
    .values({
      orgId: input.orgId,
      contractNumber: input.contractNumber,
      customerName: input.customerName,
      startDate: input.startDate,
      endDate: input.endDate,
      totalValue: input.totalValue,
      currency: input.currency ?? 'USD',
      status: 'active',
    })
    .returning()

  return contract
}

// ============================================================
// STEP 2: IDENTIFY PERFORMANCE OBLIGATIONS
// ============================================================

export async function addPerformanceObligation(input: AddPerformanceObligationInput) {
  // Initially set allocatedPrice = standaloneSellingPrice; will be recalculated on allocation
  const [obligation] = await db
    .insert(schema.performanceObligations)
    .values({
      contractId: input.contractId,
      description: input.description,
      type: input.type,
      standaloneSellingPrice: input.standaloneSellingPrice,
      allocatedPrice: input.standaloneSellingPrice, // placeholder until allocation
      recognitionMethod: input.recognitionMethod,
      startDate: input.startDate,
      endDate: input.endDate,
      percentComplete: 0,
      isSatisfied: false,
    })
    .returning()

  return obligation
}

// ============================================================
// STEP 3: DETERMINE TRANSACTION PRICE
// ============================================================

export async function calculateTransactionPrice(
  contractId: string,
  adjustments?: { discount?: number; variableConsideration?: number },
) {
  const [contract] = await db
    .select()
    .from(schema.revenueContracts)
    .where(eq(schema.revenueContracts.id, contractId))

  if (!contract) throw new Error('Contract not found')

  let transactionPrice = contract.totalValue
  if (adjustments?.discount) transactionPrice -= adjustments.discount
  if (adjustments?.variableConsideration) transactionPrice += adjustments.variableConsideration

  return { contractId, originalValue: contract.totalValue, transactionPrice }
}

// ============================================================
// STEP 4: ALLOCATE TRANSACTION PRICE (Relative SSP)
// ============================================================

export async function allocateTransactionPrice(contractId: string) {
  const [contract] = await db
    .select()
    .from(schema.revenueContracts)
    .where(eq(schema.revenueContracts.id, contractId))

  if (!contract) throw new Error('Contract not found')

  const obligations = await db
    .select()
    .from(schema.performanceObligations)
    .where(eq(schema.performanceObligations.contractId, contractId))

  if (obligations.length === 0) throw new Error('No performance obligations defined')

  // Calculate total standalone selling prices
  const totalSSP = obligations.reduce((s, o) => s + o.standaloneSellingPrice, 0)

  if (totalSSP === 0) throw new Error('Total standalone selling price cannot be zero')

  // Allocate based on relative SSP
  const transactionPrice = contract.totalValue
  const allocated: Array<{ id: string; allocatedPrice: number }> = []

  let remaining = transactionPrice
  for (let i = 0; i < obligations.length; i++) {
    const ob = obligations[i]
    let alloc: number
    if (i === obligations.length - 1) {
      // Last obligation gets remainder to avoid rounding issues
      alloc = remaining
    } else {
      alloc = Math.round((ob.standaloneSellingPrice / totalSSP) * transactionPrice)
      remaining -= alloc
    }

    await db
      .update(schema.performanceObligations)
      .set({ allocatedPrice: alloc })
      .where(eq(schema.performanceObligations.id, ob.id))

    allocated.push({ id: ob.id, allocatedPrice: alloc })
  }

  return { contractId, transactionPrice, totalSSP, obligations: allocated }
}

// ============================================================
// STEP 5: RECOGNIZE REVENUE
// ============================================================

/**
 * Generate revenue schedule entries for a performance obligation.
 * Handles both point-in-time and over-time recognition.
 */
export async function recognizeRevenue(obligationId: string, orgId: string) {
  const [obligation] = await db
    .select()
    .from(schema.performanceObligations)
    .where(eq(schema.performanceObligations.id, obligationId))

  if (!obligation) throw new Error('Performance obligation not found')

  const allocatedPrice = obligation.allocatedPrice

  if (obligation.type === 'point_in_time') {
    // Recognize full amount at the satisfied date or end date
    const recognitionDate = obligation.satisfiedDate ?? obligation.endDate
    const period = recognitionDate.substring(0, 7) // YYYY-MM

    const [entry] = await db
      .insert(schema.revenueScheduleEntries)
      .values({
        obligationId,
        orgId,
        period,
        amount: allocatedPrice,
        isRecognized: obligation.isSatisfied ?? false,
        recognizedDate: obligation.isSatisfied ? recognitionDate : null,
      })
      .returning()

    return [entry]
  }

  // Over-time recognition
  const startDate = new Date(obligation.startDate + 'T00:00:00')
  const endDate = new Date(obligation.endDate + 'T00:00:00')

  if (obligation.recognitionMethod === 'straight_line') {
    // Divide evenly across months
    const months = getMonthsBetween(startDate, endDate)
    if (months.length === 0) return []

    const monthlyAmount = Math.floor(allocatedPrice / months.length)
    const remainder = allocatedPrice - monthlyAmount * months.length

    const entries = []
    for (let i = 0; i < months.length; i++) {
      const amount = i === months.length - 1 ? monthlyAmount + remainder : monthlyAmount
      const [entry] = await db
        .insert(schema.revenueScheduleEntries)
        .values({
          obligationId,
          orgId,
          period: months[i],
          amount,
          isRecognized: false,
        })
        .returning()
      entries.push(entry)
    }
    return entries
  }

  if (obligation.recognitionMethod === 'percentage_of_completion') {
    // Recognize based on current percentComplete
    const months = getMonthsBetween(startDate, endDate)
    if (months.length === 0) return []

    const totalToRecognize = Math.round(allocatedPrice * (obligation.percentComplete ?? 0) / 100)
    const perMonth = Math.floor(totalToRecognize / months.length)
    const rem = totalToRecognize - perMonth * months.length

    const entries = []
    for (let i = 0; i < months.length; i++) {
      const amount = i === months.length - 1 ? perMonth + rem : perMonth
      const [entry] = await db
        .insert(schema.revenueScheduleEntries)
        .values({
          obligationId,
          orgId,
          period: months[i],
          amount,
          isRecognized: false,
        })
        .returning()
      entries.push(entry)
    }
    return entries
  }

  // Default: straight-line for output/input methods
  const months = getMonthsBetween(startDate, endDate)
  if (months.length === 0) return []
  const monthlyAmount = Math.floor(allocatedPrice / months.length)
  const rem = allocatedPrice - monthlyAmount * months.length
  const entries = []
  for (let i = 0; i < months.length; i++) {
    const amount = i === months.length - 1 ? monthlyAmount + rem : monthlyAmount
    const [entry] = await db
      .insert(schema.revenueScheduleEntries)
      .values({
        obligationId,
        orgId,
        period: months[i],
        amount,
        isRecognized: false,
      })
      .returning()
    entries.push(entry)
  }
  return entries
}

// ============================================================
// WATERFALL REPORT
// ============================================================

export async function generateRevenueWaterfall(
  orgId: string,
  startPeriod: string, // YYYY-MM
  endPeriod: string,
): Promise<RevenueWaterfallEntry[]> {
  const scheduleEntries = await db
    .select()
    .from(schema.revenueScheduleEntries)
    .where(
      and(
        eq(schema.revenueScheduleEntries.orgId, orgId),
        gte(schema.revenueScheduleEntries.period, startPeriod),
        lte(schema.revenueScheduleEntries.period, endPeriod),
      ),
    )

  const deferredEntries = await db
    .select()
    .from(schema.deferredRevenue)
    .where(
      and(
        eq(schema.deferredRevenue.orgId, orgId),
        gte(schema.deferredRevenue.period, startPeriod),
        lte(schema.deferredRevenue.period, endPeriod),
      ),
    )

  // Aggregate by period
  const periodMap = new Map<string, RevenueWaterfallEntry>()

  // Generate all months in range
  const months = getMonthRange(startPeriod, endPeriod)
  for (const m of months) {
    periodMap.set(m, { period: m, newBookings: 0, recognized: 0, deferredBalance: 0 })
  }

  for (const entry of scheduleEntries) {
    const existing = periodMap.get(entry.period)
    if (existing) {
      if (entry.isRecognized) {
        existing.recognized += entry.amount
      } else {
        existing.newBookings += entry.amount
      }
    }
  }

  for (const d of deferredEntries) {
    const existing = periodMap.get(d.period)
    if (existing) {
      existing.deferredBalance = d.balance
    }
  }

  return Array.from(periodMap.values()).sort((a, b) => a.period.localeCompare(b.period))
}

// ============================================================
// DEFERRED REVENUE BALANCE
// ============================================================

export async function getDeferredRevenueBalance(orgId: string, period: string) {
  const entries = await db
    .select()
    .from(schema.deferredRevenue)
    .where(and(eq(schema.deferredRevenue.orgId, orgId), eq(schema.deferredRevenue.period, period)))

  const totalDeferred = entries.reduce((s, e) => s + e.deferredAmount, 0)
  const totalRecognized = entries.reduce((s, e) => s + e.recognizedAmount, 0)
  const totalBalance = entries.reduce((s, e) => s + e.balance, 0)

  return { period, totalDeferred, totalRecognized, totalBalance, entries }
}

// ============================================================
// RECOGNITION SUMMARY (DASHBOARD)
// ============================================================

export async function getRevenueRecognitionSummary(orgId: string): Promise<RevenueRecognitionSummary> {
  const contracts = await db
    .select()
    .from(schema.revenueContracts)
    .where(eq(schema.revenueContracts.orgId, orgId))

  const totalContractValue = contracts.reduce((s, c) => s + c.totalValue, 0)
  const activeContracts = contracts.filter(c => c.status === 'active').length
  const completedContracts = contracts.filter(c => c.status === 'completed').length

  // Avg contract length in months
  let totalMonths = 0
  for (const c of contracts) {
    const start = new Date(c.startDate + 'T00:00:00')
    const end = new Date(c.endDate + 'T00:00:00')
    totalMonths += getMonthsBetween(start, end).length
  }
  const avgContractLength = contracts.length > 0 ? Math.round(totalMonths / contracts.length) : 0

  // Get schedule entries for recognized amounts
  const scheduleEntries = await db
    .select()
    .from(schema.revenueScheduleEntries)
    .where(eq(schema.revenueScheduleEntries.orgId, orgId))

  const totalRecognized = scheduleEntries.filter(e => e.isRecognized).reduce((s, e) => s + e.amount, 0)
  const totalDeferred = totalContractValue - totalRecognized

  // Recognition by method
  const obligations = await db
    .select()
    .from(schema.performanceObligations)

  const contractIds = new Set(contracts.map(c => c.id))
  const relevantObs = obligations.filter(o => contractIds.has(o.contractId))

  const recognitionByMethod: Record<string, number> = {}
  for (const ob of relevantObs) {
    recognitionByMethod[ob.recognitionMethod] = (recognitionByMethod[ob.recognitionMethod] || 0) + ob.allocatedPrice
  }

  return {
    totalContractValue,
    totalRecognized,
    totalDeferred,
    activeContracts,
    completedContracts,
    avgContractLength,
    recognitionByMethod,
  }
}

// ============================================================
// HELPERS
// ============================================================

function getMonthsBetween(start: Date, end: Date): string[] {
  const months: string[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endMonth = new Date(end.getFullYear(), end.getMonth(), 1)

  while (current <= endMonth) {
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    months.push(`${y}-${m}`)
    current.setMonth(current.getMonth() + 1)
  }
  return months
}

function getMonthRange(start: string, end: string): string[] {
  const [sy, sm] = start.split('-').map(Number)
  const [ey, em] = end.split('-').map(Number)
  const months: string[] = []
  let y = sy
  let m = sm
  while (y < ey || (y === ey && m <= em)) {
    months.push(`${y}-${String(m).padStart(2, '0')}`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return months
}
