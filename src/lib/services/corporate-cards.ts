/**
 * Corporate Card Management Service
 *
 * Virtual and physical card issuance, spend limits, cashback,
 * real-time transaction monitoring, receipt matching, suspicious
 * activity detection, and monthly statement generation.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface IssueCardInput {
  orgId: string
  employeeId: string
  cardType: 'virtual' | 'physical'
  cardName: string
  spendLimit: number // cents
  monthlyLimit?: number // cents
  allowedCategories?: string[]
  currency?: string
}

export interface SetSpendLimitsInput {
  cardId: string
  orgId: string
  category?: string
  dailyLimit?: number
  weeklyLimit?: number
  monthlyLimit?: number
  perTransactionLimit?: number
}

export interface ProcessTransactionInput {
  orgId: string
  cardId: string
  amount: number // cents
  currency?: string
  merchantName: string
  merchantCategory?: string
  mcc?: string
  transactedAt: Date
  notes?: string
}

export interface CardStatement {
  cardId: string
  cardName: string
  last4: string
  period: string
  openingBalance: number
  closingBalance: number
  totalSpend: number
  totalCashback: number
  transactionCount: number
  transactions: Array<{
    id: string
    date: Date
    merchantName: string
    merchantCategory: string | null
    amount: number
    currency: string
    status: string
    cashbackAmount: number | null
  }>
}

export interface SpendAnalytics {
  orgId: string
  totalSpend: number
  totalCashback: number
  activeCards: number
  transactionCount: number
  averageTransactionSize: number
  spendByCategory: Array<{ category: string; amount: number; count: number }>
  spendByEmployee: Array<{ employeeId: string; amount: number; count: number }>
  topMerchants: Array<{ merchantName: string; amount: number; count: number }>
  monthlyTrend: Array<{ month: string; amount: number; count: number }>
}

export interface SuspiciousFlag {
  transactionId: string
  cardId: string
  reason: string
  severity: 'low' | 'medium' | 'high'
  details: Record<string, unknown>
}

// ============================================================
// ERROR CLASS
// ============================================================

export class CorporateCardError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'CorporateCardError'
  }
}

// ============================================================
// HELPERS
// ============================================================

function generateLast4(): string {
  return Math.floor(1000 + Math.random() * 9000).toString()
}

function generateExpiryDate(): { month: number; year: number } {
  const now = new Date()
  return {
    month: now.getMonth() + 1,
    year: now.getFullYear() + 3,
  }
}

// ============================================================
// CARD LIFECYCLE
// ============================================================

/**
 * Issue a new corporate card (virtual or physical) for an employee.
 */
export async function issueCard(input: IssueCardInput) {
  const { orgId, employeeId, cardType, cardName, spendLimit, monthlyLimit, allowedCategories, currency } = input

  if (spendLimit <= 0) {
    throw new CorporateCardError('Spend limit must be positive', 'INVALID_SPEND_LIMIT')
  }
  if (monthlyLimit !== undefined && monthlyLimit <= 0) {
    throw new CorporateCardError('Monthly limit must be positive', 'INVALID_MONTHLY_LIMIT')
  }

  // Verify employee exists in the org
  const [employee] = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))

  if (!employee) {
    throw new CorporateCardError('Employee not found in organization', 'EMPLOYEE_NOT_FOUND')
  }

  const last4 = generateLast4()
  const expiry = generateExpiryDate()

  const [card] = await db
    .insert(schema.corporateCards)
    .values({
      orgId,
      employeeId,
      cardType,
      cardName,
      last4,
      spendLimit,
      monthlyLimit: monthlyLimit ?? null,
      currentBalance: 0,
      currency: currency ?? 'USD',
      allowedCategories: allowedCategories ?? null,
      expiryMonth: expiry.month,
      expiryYear: expiry.year,
      cashbackRate: 1.75,
      totalCashback: 0,
      status: cardType === 'virtual' ? 'active' : 'pending_activation',
    })
    .returning()

  return card
}

/**
 * Activate a pending physical card.
 */
export async function activateCard(cardId: string, orgId: string) {
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }
  if (card.status !== 'pending_activation') {
    throw new CorporateCardError(
      `Cannot activate card in status: ${card.status}`,
      'INVALID_CARD_STATUS',
    )
  }

  const [updated] = await db
    .update(schema.corporateCards)
    .set({ status: 'active' })
    .where(eq(schema.corporateCards.id, cardId))
    .returning()

  return updated
}

/**
 * Freeze a card temporarily (e.g. suspected fraud or employee request).
 */
export async function freezeCard(cardId: string, orgId: string) {
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }
  if (card.status !== 'active') {
    throw new CorporateCardError('Only active cards can be frozen', 'INVALID_CARD_STATUS')
  }

  const [updated] = await db
    .update(schema.corporateCards)
    .set({ status: 'frozen' })
    .where(eq(schema.corporateCards.id, cardId))
    .returning()

  return updated
}

/**
 * Permanently cancel a corporate card.
 */
export async function cancelCard(cardId: string, orgId: string) {
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }
  if (card.status === 'cancelled') {
    throw new CorporateCardError('Card is already cancelled', 'ALREADY_CANCELLED')
  }

  const [updated] = await db
    .update(schema.corporateCards)
    .set({ status: 'cancelled' })
    .where(eq(schema.corporateCards.id, cardId))
    .returning()

  return updated
}

// ============================================================
// SPEND LIMITS
// ============================================================

/**
 * Set granular spend limits for a card: per-category, daily, weekly,
 * monthly, and per-transaction.
 */
export async function setSpendLimits(input: SetSpendLimitsInput) {
  const { cardId, orgId, category, dailyLimit, weeklyLimit, monthlyLimit, perTransactionLimit } = input

  // Verify card belongs to org
  const [card] = await db
    .select({ id: schema.corporateCards.id })
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }

  // Upsert: look for existing rule matching this card + category
  const existingConditions = [
    eq(schema.cardSpendLimits.cardId, cardId),
    eq(schema.cardSpendLimits.orgId, orgId),
  ]
  if (category) {
    existingConditions.push(eq(schema.cardSpendLimits.category, category))
  }

  const existing = await db
    .select()
    .from(schema.cardSpendLimits)
    .where(and(...existingConditions))

  if (existing.length > 0) {
    const [updated] = await db
      .update(schema.cardSpendLimits)
      .set({
        dailyLimit: dailyLimit ?? existing[0].dailyLimit,
        weeklyLimit: weeklyLimit ?? existing[0].weeklyLimit,
        monthlyLimit: monthlyLimit ?? existing[0].monthlyLimit,
        perTransactionLimit: perTransactionLimit ?? existing[0].perTransactionLimit,
      })
      .where(eq(schema.cardSpendLimits.id, existing[0].id))
      .returning()
    return updated
  }

  const [created] = await db
    .insert(schema.cardSpendLimits)
    .values({
      orgId,
      cardId,
      category: category ?? null,
      dailyLimit: dailyLimit ?? null,
      weeklyLimit: weeklyLimit ?? null,
      monthlyLimit: monthlyLimit ?? null,
      perTransactionLimit: perTransactionLimit ?? null,
      isActive: true,
    })
    .returning()

  return created
}

/**
 * Get all category-level limits for a specific card.
 */
export async function getCategoryLimits(cardId: string, orgId: string) {
  const limits = await db
    .select()
    .from(schema.cardSpendLimits)
    .where(
      and(
        eq(schema.cardSpendLimits.cardId, cardId),
        eq(schema.cardSpendLimits.orgId, orgId),
        eq(schema.cardSpendLimits.isActive, true),
      ),
    )

  return limits
}

// ============================================================
// TRANSACTIONS
// ============================================================

/**
 * Process a card transaction: validates against limits, records the
 * transaction, updates the card balance, and calculates cashback.
 */
export async function processTransaction(input: ProcessTransactionInput) {
  const { orgId, cardId, amount, currency, merchantName, merchantCategory, mcc, transactedAt, notes } = input

  if (amount <= 0) {
    throw new CorporateCardError('Transaction amount must be positive', 'INVALID_AMOUNT')
  }

  // Fetch card
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }
  if (card.status !== 'active') {
    throw new CorporateCardError(`Card is ${card.status}; transactions not allowed`, 'CARD_NOT_ACTIVE')
  }

  // Check per-transaction limit
  if (amount > card.spendLimit) {
    throw new CorporateCardError(
      `Transaction amount ${amount} exceeds card spend limit ${card.spendLimit}`,
      'EXCEEDS_SPEND_LIMIT',
    )
  }

  // Check category-specific limits
  const categoryLimits = await db
    .select()
    .from(schema.cardSpendLimits)
    .where(
      and(
        eq(schema.cardSpendLimits.cardId, cardId),
        eq(schema.cardSpendLimits.orgId, orgId),
        eq(schema.cardSpendLimits.isActive, true),
      ),
    )

  for (const limit of categoryLimits) {
    // If limit is for a specific category, only check if this transaction matches
    if (limit.category && limit.category !== merchantCategory) continue

    // Per-transaction limit
    if (limit.perTransactionLimit && amount > limit.perTransactionLimit) {
      throw new CorporateCardError(
        `Amount exceeds per-transaction limit of ${limit.perTransactionLimit} for category ${limit.category ?? 'all'}`,
        'EXCEEDS_PER_TRANSACTION_LIMIT',
      )
    }

    // Daily limit check
    if (limit.dailyLimit) {
      const startOfDay = new Date(transactedAt)
      startOfDay.setHours(0, 0, 0, 0)
      const dailySpendResult = await db
        .select({ total: sum(schema.cardTransactions.amount) })
        .from(schema.cardTransactions)
        .where(
          and(
            eq(schema.cardTransactions.cardId, cardId),
            gte(schema.cardTransactions.transactedAt, startOfDay),
            sql`${schema.cardTransactions.status} NOT IN ('declined', 'refunded')`,
          ),
        )
      const dailyTotal = Number(dailySpendResult[0]?.total ?? 0)
      if (dailyTotal + amount > limit.dailyLimit) {
        throw new CorporateCardError(
          `Transaction would exceed daily limit of ${limit.dailyLimit}`,
          'EXCEEDS_DAILY_LIMIT',
        )
      }
    }

    // Monthly limit check
    if (limit.monthlyLimit) {
      const startOfMonth = new Date(transactedAt.getFullYear(), transactedAt.getMonth(), 1)
      const monthlySpendResult = await db
        .select({ total: sum(schema.cardTransactions.amount) })
        .from(schema.cardTransactions)
        .where(
          and(
            eq(schema.cardTransactions.cardId, cardId),
            gte(schema.cardTransactions.transactedAt, startOfMonth),
            sql`${schema.cardTransactions.status} NOT IN ('declined', 'refunded')`,
          ),
        )
      const monthlyTotal = Number(monthlySpendResult[0]?.total ?? 0)
      if (monthlyTotal + amount > limit.monthlyLimit) {
        throw new CorporateCardError(
          `Transaction would exceed monthly limit of ${limit.monthlyLimit}`,
          'EXCEEDS_MONTHLY_LIMIT',
        )
      }
    }
  }

  // Check card-level monthly limit
  if (card.monthlyLimit) {
    const startOfMonth = new Date(transactedAt.getFullYear(), transactedAt.getMonth(), 1)
    const monthlySpendResult = await db
      .select({ total: sum(schema.cardTransactions.amount) })
      .from(schema.cardTransactions)
      .where(
        and(
          eq(schema.cardTransactions.cardId, cardId),
          gte(schema.cardTransactions.transactedAt, startOfMonth),
          sql`${schema.cardTransactions.status} NOT IN ('declined', 'refunded')`,
        ),
      )
    const monthlyTotal = Number(monthlySpendResult[0]?.total ?? 0)
    if (monthlyTotal + amount > card.monthlyLimit) {
      throw new CorporateCardError(
        `Transaction would exceed card monthly limit of ${card.monthlyLimit}`,
        'EXCEEDS_CARD_MONTHLY_LIMIT',
      )
    }
  }

  // Check allowed categories
  if (card.allowedCategories && merchantCategory) {
    const allowed = card.allowedCategories as string[]
    if (allowed.length > 0 && !allowed.includes(merchantCategory)) {
      throw new CorporateCardError(
        `Category "${merchantCategory}" is not allowed on this card`,
        'CATEGORY_NOT_ALLOWED',
      )
    }
  }

  // Calculate cashback (default 1.75%)
  const cashbackRate = card.cashbackRate ?? 1.75
  const cashbackAmount = Math.round(amount * (cashbackRate / 100))

  // Insert transaction
  const [transaction] = await db
    .insert(schema.cardTransactions)
    .values({
      orgId,
      cardId,
      amount,
      currency: currency ?? card.currency,
      merchantName,
      merchantCategory: merchantCategory ?? null,
      mcc: mcc ?? null,
      status: 'pending',
      cashbackAmount,
      transactedAt,
      notes: notes ?? null,
    })
    .returning()

  // Update card balance and cashback
  await db
    .update(schema.corporateCards)
    .set({
      currentBalance: sql`${schema.corporateCards.currentBalance} + ${amount}`,
      totalCashback: sql`${schema.corporateCards.totalCashback} + ${cashbackAmount}`,
    })
    .where(eq(schema.corporateCards.id, cardId))

  return transaction
}

/**
 * Reconcile pending transactions by marking them as posted.
 */
export async function reconcileTransactions(orgId: string, transactionIds: string[]) {
  if (transactionIds.length === 0) return []

  const now = new Date()
  const results = []

  for (const txId of transactionIds) {
    const [updated] = await db
      .update(schema.cardTransactions)
      .set({ status: 'posted', postedAt: now })
      .where(
        and(
          eq(schema.cardTransactions.id, txId),
          eq(schema.cardTransactions.orgId, orgId),
          eq(schema.cardTransactions.status, 'pending'),
        ),
      )
      .returning()

    if (updated) results.push(updated)
  }

  return results
}

/**
 * Match a receipt URL to a transaction, optionally linking to an expense report.
 */
export async function matchReceipt(
  orgId: string,
  transactionId: string,
  receiptUrl: string,
  expenseReportId?: string,
) {
  const [transaction] = await db
    .select()
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.id, transactionId),
        eq(schema.cardTransactions.orgId, orgId),
      ),
    )

  if (!transaction) {
    throw new CorporateCardError('Transaction not found', 'TRANSACTION_NOT_FOUND')
  }

  const [updated] = await db
    .update(schema.cardTransactions)
    .set({
      receiptUrl,
      receiptMatched: true,
      expenseReportId: expenseReportId ?? transaction.expenseReportId,
    })
    .where(eq(schema.cardTransactions.id, transactionId))
    .returning()

  return updated
}

// ============================================================
// STATEMENTS & ANALYTICS
// ============================================================

/**
 * Generate a monthly statement for a specific card.
 */
export async function getCardStatement(
  cardId: string,
  orgId: string,
  year: number,
  month: number,
): Promise<CardStatement> {
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }

  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0, 23, 59, 59) // last day of month

  const transactions = await db
    .select()
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.cardId, cardId),
        eq(schema.cardTransactions.orgId, orgId),
        gte(schema.cardTransactions.transactedAt, startDate),
        lte(schema.cardTransactions.transactedAt, endDate),
      ),
    )
    .orderBy(desc(schema.cardTransactions.transactedAt))

  const validTxns = transactions.filter((t) => t.status !== 'declined' && t.status !== 'refunded')
  const totalSpend = validTxns.reduce((s, t) => s + t.amount, 0)
  const totalCashback = validTxns.reduce((s, t) => s + (t.cashbackAmount ?? 0), 0)

  // Calculate opening balance as the balance from previous period
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59)
  const prevTransactions = await db
    .select({ total: sum(schema.cardTransactions.amount) })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.cardId, cardId),
        lte(schema.cardTransactions.transactedAt, prevMonthEnd),
        sql`${schema.cardTransactions.status} NOT IN ('declined', 'refunded')`,
      ),
    )
  const openingBalance = Number(prevTransactions[0]?.total ?? 0)

  return {
    cardId: card.id,
    cardName: card.cardName,
    last4: card.last4,
    period: `${year}-${String(month).padStart(2, '0')}`,
    openingBalance,
    closingBalance: openingBalance + totalSpend,
    totalSpend,
    totalCashback,
    transactionCount: transactions.length,
    transactions: transactions.map((t) => ({
      id: t.id,
      date: t.transactedAt,
      merchantName: t.merchantName,
      merchantCategory: t.merchantCategory,
      amount: t.amount,
      currency: t.currency,
      status: t.status,
      cashbackAmount: t.cashbackAmount,
    })),
  }
}

/**
 * Calculate total cashback earned for a card.
 */
export async function calculateCashback(cardId: string, orgId: string) {
  const [card] = await db
    .select()
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.id, cardId), eq(schema.corporateCards.orgId, orgId)))

  if (!card) {
    throw new CorporateCardError('Card not found', 'CARD_NOT_FOUND')
  }

  const [result] = await db
    .select({ total: sum(schema.cardTransactions.cashbackAmount) })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.cardId, cardId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )

  return {
    cardId,
    totalCashback: Number(result?.total ?? 0),
    cashbackRate: card.cashbackRate ?? 1.75,
  }
}

/**
 * Get spend analytics across all cards in an organization.
 */
export async function getSpendAnalytics(orgId: string): Promise<SpendAnalytics> {
  // Total spend
  const [spendResult] = await db
    .select({
      total: sum(schema.cardTransactions.amount),
      txCount: count(),
      totalCashback: sum(schema.cardTransactions.cashbackAmount),
    })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )

  const totalSpend = Number(spendResult?.total ?? 0)
  const transactionCount = Number(spendResult?.txCount ?? 0)
  const totalCashback = Number(spendResult?.totalCashback ?? 0)
  const averageTransactionSize = transactionCount > 0 ? Math.round(totalSpend / transactionCount) : 0

  // Active cards
  const [activeResult] = await db
    .select({ count: count() })
    .from(schema.corporateCards)
    .where(and(eq(schema.corporateCards.orgId, orgId), eq(schema.corporateCards.status, 'active')))
  const activeCards = Number(activeResult?.count ?? 0)

  // Spend by category
  const categoryRows = await db
    .select({
      category: schema.cardTransactions.merchantCategory,
      amount: sum(schema.cardTransactions.amount),
      txCount: count(),
    })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )
    .groupBy(schema.cardTransactions.merchantCategory)

  const spendByCategory = categoryRows.map((r) => ({
    category: r.category ?? 'Uncategorized',
    amount: Number(r.amount ?? 0),
    count: Number(r.txCount),
  }))

  // Spend by employee (via card)
  const employeeRows = await db
    .select({
      employeeId: schema.corporateCards.employeeId,
      amount: sum(schema.cardTransactions.amount),
      txCount: count(),
    })
    .from(schema.cardTransactions)
    .innerJoin(schema.corporateCards, eq(schema.cardTransactions.cardId, schema.corporateCards.id))
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )
    .groupBy(schema.corporateCards.employeeId)

  const spendByEmployee = employeeRows.map((r) => ({
    employeeId: r.employeeId,
    amount: Number(r.amount ?? 0),
    count: Number(r.txCount),
  }))

  // Top merchants
  const merchantRows = await db
    .select({
      merchantName: schema.cardTransactions.merchantName,
      amount: sum(schema.cardTransactions.amount),
      txCount: count(),
    })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )
    .groupBy(schema.cardTransactions.merchantName)
    .orderBy(desc(sum(schema.cardTransactions.amount)))
    .limit(20)

  const topMerchants = merchantRows.map((r) => ({
    merchantName: r.merchantName,
    amount: Number(r.amount ?? 0),
    count: Number(r.txCount),
  }))

  // Monthly trend (last 12 months)
  const monthlyRows = await db
    .select({
      month: sql<string>`TO_CHAR(${schema.cardTransactions.transactedAt}, 'YYYY-MM')`,
      amount: sum(schema.cardTransactions.amount),
      txCount: count(),
    })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
        gte(
          schema.cardTransactions.transactedAt,
          sql`NOW() - INTERVAL '12 months'`,
        ),
      ),
    )
    .groupBy(sql`TO_CHAR(${schema.cardTransactions.transactedAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${schema.cardTransactions.transactedAt}, 'YYYY-MM')`)

  const monthlyTrend = monthlyRows.map((r) => ({
    month: r.month,
    amount: Number(r.amount ?? 0),
    count: Number(r.txCount),
  }))

  return {
    orgId,
    totalSpend,
    totalCashback,
    activeCards,
    transactionCount,
    averageTransactionSize,
    spendByCategory,
    spendByEmployee,
    topMerchants,
    monthlyTrend,
  }
}

// ============================================================
// FRAUD DETECTION
// ============================================================

/**
 * Flag suspicious activity by analysing recent transactions for anomalies:
 *   - Unusual merchant (first-time vendor with high amount)
 *   - Amount outlier (>3x average for this card)
 *   - Off-hours transaction (between midnight and 5 AM local)
 *   - Rapid sequential transactions (>3 in 10 minutes)
 */
export async function flagSuspiciousActivity(orgId: string, cardId: string): Promise<SuspiciousFlag[]> {
  const flags: SuspiciousFlag[] = []

  // Fetch recent transactions (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const recentTxns = await db
    .select()
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.cardId, cardId),
        eq(schema.cardTransactions.orgId, orgId),
        gte(schema.cardTransactions.transactedAt, thirtyDaysAgo),
        sql`${schema.cardTransactions.status} NOT IN ('declined', 'refunded')`,
      ),
    )
    .orderBy(desc(schema.cardTransactions.transactedAt))

  if (recentTxns.length === 0) return flags

  // Calculate average transaction amount
  const avgAmount = recentTxns.reduce((s, t) => s + t.amount, 0) / recentTxns.length

  // Collect unique merchants from older transactions (for first-time detection)
  const olderTxns = await db
    .select({ merchantName: schema.cardTransactions.merchantName })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.cardId, cardId),
        lte(schema.cardTransactions.transactedAt, thirtyDaysAgo),
      ),
    )
  const knownMerchants = new Set(olderTxns.map((t) => t.merchantName))

  for (const txn of recentTxns) {
    // Amount outlier: >3x average
    if (txn.amount > avgAmount * 3 && avgAmount > 0) {
      flags.push({
        transactionId: txn.id,
        cardId,
        reason: 'Amount significantly exceeds average',
        severity: 'high',
        details: { amount: txn.amount, average: Math.round(avgAmount), ratio: (txn.amount / avgAmount).toFixed(2) },
      })
    }

    // First-time merchant with high amount (>$500)
    if (!knownMerchants.has(txn.merchantName) && txn.amount > 50000) {
      flags.push({
        transactionId: txn.id,
        cardId,
        reason: 'Large transaction at first-time merchant',
        severity: 'medium',
        details: { merchantName: txn.merchantName, amount: txn.amount },
      })
    }

    // Off-hours (midnight to 5 AM)
    const hour = txn.transactedAt.getHours()
    if (hour >= 0 && hour < 5) {
      flags.push({
        transactionId: txn.id,
        cardId,
        reason: 'Transaction during off-hours (midnight to 5 AM)',
        severity: 'low',
        details: { hour, merchantName: txn.merchantName },
      })
    }
  }

  // Rapid sequential transactions (>3 within 10 minutes)
  for (let i = 0; i < recentTxns.length - 3; i++) {
    const windowEnd = recentTxns[i].transactedAt.getTime()
    const windowStart = windowEnd - 10 * 60 * 1000 // 10 min window
    const inWindow = recentTxns.filter(
      (t) => t.transactedAt.getTime() >= windowStart && t.transactedAt.getTime() <= windowEnd,
    )
    if (inWindow.length > 3) {
      flags.push({
        transactionId: recentTxns[i].id,
        cardId,
        reason: 'Rapid sequential transactions detected',
        severity: 'high',
        details: { transactionsInWindow: inWindow.length, windowMinutes: 10 },
      })
      break // Only flag once
    }
  }

  return flags
}

// ============================================================
// EXPORT & BULK
// ============================================================

/**
 * Export transactions for a date range in a structured format.
 */
export async function exportTransactions(
  orgId: string,
  startDate: Date,
  endDate: Date,
  cardId?: string,
) {
  const conditions = [
    eq(schema.cardTransactions.orgId, orgId),
    gte(schema.cardTransactions.transactedAt, startDate),
    lte(schema.cardTransactions.transactedAt, endDate),
  ]
  if (cardId) {
    conditions.push(eq(schema.cardTransactions.cardId, cardId))
  }

  const transactions = await db
    .select({
      id: schema.cardTransactions.id,
      cardId: schema.cardTransactions.cardId,
      amount: schema.cardTransactions.amount,
      currency: schema.cardTransactions.currency,
      merchantName: schema.cardTransactions.merchantName,
      merchantCategory: schema.cardTransactions.merchantCategory,
      mcc: schema.cardTransactions.mcc,
      status: schema.cardTransactions.status,
      receiptMatched: schema.cardTransactions.receiptMatched,
      cashbackAmount: schema.cardTransactions.cashbackAmount,
      transactedAt: schema.cardTransactions.transactedAt,
      postedAt: schema.cardTransactions.postedAt,
      notes: schema.cardTransactions.notes,
      cardLast4: schema.corporateCards.last4,
      cardName: schema.corporateCards.cardName,
      employeeId: schema.corporateCards.employeeId,
    })
    .from(schema.cardTransactions)
    .innerJoin(schema.corporateCards, eq(schema.cardTransactions.cardId, schema.corporateCards.id))
    .where(and(...conditions))
    .orderBy(desc(schema.cardTransactions.transactedAt))

  return {
    orgId,
    exportedAt: new Date(),
    startDate,
    endDate,
    transactionCount: transactions.length,
    totalAmount: transactions
      .filter((t) => t.status !== 'declined' && t.status !== 'refunded')
      .reduce((s, t) => s + t.amount, 0),
    transactions,
  }
}

/**
 * Issue multiple cards in a single batch (e.g. for new hires or department rollout).
 */
export async function bulkIssueCards(inputs: IssueCardInput[]) {
  const results = []
  const errors: Array<{ index: number; error: string }> = []

  for (let i = 0; i < inputs.length; i++) {
    try {
      const card = await issueCard(inputs[i])
      results.push(card)
    } catch (err) {
      errors.push({ index: i, error: (err as Error).message })
    }
  }

  return { issued: results, errors, total: inputs.length, successCount: results.length, errorCount: errors.length }
}

/**
 * Get a high-level overview of corporate card spend for the entire company.
 */
export async function getCompanySpendOverview(orgId: string) {
  // Total cards by status
  const cardsByStatus = await db
    .select({
      status: schema.corporateCards.status,
      count: count(),
    })
    .from(schema.corporateCards)
    .where(eq(schema.corporateCards.orgId, orgId))
    .groupBy(schema.corporateCards.status)

  // Total spend this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const [monthlySpend] = await db
    .select({
      total: sum(schema.cardTransactions.amount),
      txCount: count(),
    })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        gte(schema.cardTransactions.transactedAt, startOfMonth),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )

  // Unmatched receipts
  const [unmatchedResult] = await db
    .select({ count: count() })
    .from(schema.cardTransactions)
    .where(
      and(
        eq(schema.cardTransactions.orgId, orgId),
        eq(schema.cardTransactions.receiptMatched, false),
        sql`${schema.cardTransactions.status} IN ('pending', 'posted')`,
      ),
    )

  // Total cashback
  const [cashbackResult] = await db
    .select({ total: sum(schema.corporateCards.totalCashback) })
    .from(schema.corporateCards)
    .where(eq(schema.corporateCards.orgId, orgId))

  return {
    orgId,
    cardsByStatus: cardsByStatus.map((r) => ({ status: r.status, count: Number(r.count) })),
    monthlySpend: Number(monthlySpend?.total ?? 0),
    monthlyTransactions: Number(monthlySpend?.txCount ?? 0),
    unmatchedReceipts: Number(unmatchedResult?.count ?? 0),
    totalCashbackEarned: Number(cashbackResult?.total ?? 0),
  }
}
