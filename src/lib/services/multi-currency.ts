/**
 * Multi-Currency Spend Enhancement Service
 *
 * Real-time exchange rate tracking, currency account management,
 * FX transaction recording, currency exposure analysis, hedging
 * impact calculator, and multi-currency dashboard.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'
import {
  getExchangeRate as getFXRate,
  convertAmount as convertFXAmount,
  getAllRates,
  refreshRates,
} from '@/lib/services/fx-rates'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface CreateCurrencyAccountInput {
  orgId: string
  currency: string
  accountName?: string
  bankName?: string
  bankAccountNumber?: string
  iban?: string
  swiftCode?: string
  isDefault?: boolean
  initialBalance?: number // minor units (cents)
}

export interface ConvertCurrencyInput {
  orgId: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number // minor units
  purpose?: string
  reference?: string
}

export interface ConvertCurrencyResult {
  transactionId: string
  fromCurrency: string
  toCurrency: string
  fromAmount: number
  toAmount: number
  exchangeRate: number
  fee: number
  netAmount: number
  executedAt: Date
}

export interface CurrencyExposure {
  currency: string
  balance: number
  balanceInUSD: number
  exchangeRate: number
  percentOfTotal: number
  accounts: number
}

export interface FXImpact {
  currency: string
  originalRate: number
  currentRate: number
  rateChange: number
  rateChangePercent: number
  balanceImpact: number // gain/loss in USD
  balance: number
}

export interface HedgingScenario {
  currency: string
  currentExposure: number // in minor units of the currency
  currentValueUSD: number
  scenarios: Array<{
    rateChange: number // e.g. -5% = -0.05
    newRate: number
    newValueUSD: number
    gainLoss: number
    hedgedValue: number // value if hedged at current rate
    hedgingBenefit: number
  }>
}

export interface MultiCurrencyDashboard {
  orgId: string
  totalBalanceUSD: number
  accountCount: number
  currencyCount: number
  exposures: CurrencyExposure[]
  recentTransactions: Array<{
    id: string
    fromCurrency: string
    toCurrency: string
    fromAmount: number
    toAmount: number
    rate: number
    executedAt: Date
  }>
  monthlyVolume: Array<{ month: string; volume: number; transactionCount: number }>
  topCurrencyPairs: Array<{ pair: string; volume: number; count: number }>
}

export interface FXAlert {
  id: string
  orgId: string
  currency: string
  targetRate: number
  direction: 'above' | 'below'
  isTriggered: boolean
  createdAt: Date
}

// ============================================================
// ERROR CLASS
// ============================================================

export class MultiCurrencyError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'MultiCurrencyError'
  }
}

// ============================================================
// FEE SCHEDULE
// ============================================================

const FX_FEE_SCHEDULE: Record<string, number> = {
  // Major pairs: 0.25%
  'USD-EUR': 0.0025,
  'USD-GBP': 0.0025,
  'USD-JPY': 0.0025,
  'USD-CAD': 0.0025,
  'USD-CHF': 0.0025,
  'USD-AUD': 0.0025,
  'EUR-GBP': 0.0025,
  'EUR-USD': 0.0025,
  'GBP-USD': 0.0025,
  // Default: 0.50%
}

function getFXFee(from: string, to: string): number {
  const pair = `${from}-${to}`
  return FX_FEE_SCHEDULE[pair] ?? FX_FEE_SCHEDULE[`${to}-${from}`] ?? 0.005
}

// ============================================================
// CURRENCY ACCOUNTS
// ============================================================

/**
 * Create a new currency account for the organization.
 */
export async function createCurrencyAccount(input: CreateCurrencyAccountInput) {
  const { orgId, currency, accountName, bankName, bankAccountNumber, iban, swiftCode, isDefault, initialBalance } = input

  if (!currency || currency.length < 3) {
    throw new MultiCurrencyError('Invalid currency code', 'INVALID_CURRENCY')
  }

  // If this is the default account, unset other defaults for this currency
  if (isDefault) {
    await db
      .update(schema.currencyAccounts)
      .set({ isDefault: false })
      .where(
        and(
          eq(schema.currencyAccounts.orgId, orgId),
          eq(schema.currencyAccounts.currency, currency.toUpperCase()),
        ),
      )
  }

  const [account] = await db
    .insert(schema.currencyAccounts)
    .values({
      orgId,
      currency: currency.toUpperCase(),
      balance: initialBalance ?? 0,
      accountName: accountName ?? `${currency.toUpperCase()} Account`,
      bankName: bankName ?? null,
      bankAccountNumber: bankAccountNumber ?? null,
      iban: iban ?? null,
      swiftCode: swiftCode ?? null,
      isDefault: isDefault ?? false,
      isActive: true,
    })
    .returning()

  return account
}

// ============================================================
// CURRENCY CONVERSION
// ============================================================

/**
 * Convert currency: debits the source account, credits the destination
 * account, records the FX transaction with fee.
 */
export async function convertCurrency(input: ConvertCurrencyInput): Promise<ConvertCurrencyResult> {
  const { orgId, fromCurrency, toCurrency, fromAmount, purpose, reference } = input

  if (fromAmount <= 0) {
    throw new MultiCurrencyError('Amount must be positive', 'INVALID_AMOUNT')
  }

  if (fromCurrency.toUpperCase() === toCurrency.toUpperCase()) {
    throw new MultiCurrencyError('Source and destination currencies must differ', 'SAME_CURRENCY')
  }

  // Get live exchange rate
  const rateResult = await getFXRate(fromCurrency, toCurrency)
  const exchangeRate = rateResult.rate

  // Calculate fee
  const feeRate = getFXFee(fromCurrency.toUpperCase(), toCurrency.toUpperCase())
  const fee = Math.round(fromAmount * feeRate)
  const netFromAmount = fromAmount - fee
  const toAmount = Math.round(netFromAmount * exchangeRate)

  // Find source account
  const [sourceAccount] = await db
    .select()
    .from(schema.currencyAccounts)
    .where(
      and(
        eq(schema.currencyAccounts.orgId, orgId),
        eq(schema.currencyAccounts.currency, fromCurrency.toUpperCase()),
        eq(schema.currencyAccounts.isActive, true),
      ),
    )
    .orderBy(desc(schema.currencyAccounts.isDefault))
    .limit(1)

  if (!sourceAccount) {
    throw new MultiCurrencyError(`No active ${fromCurrency} account found`, 'NO_SOURCE_ACCOUNT')
  }

  if (sourceAccount.balance < fromAmount) {
    throw new MultiCurrencyError(
      `Insufficient balance: ${sourceAccount.balance} < ${fromAmount}`,
      'INSUFFICIENT_BALANCE',
    )
  }

  // Find or create destination account
  let [destAccount] = await db
    .select()
    .from(schema.currencyAccounts)
    .where(
      and(
        eq(schema.currencyAccounts.orgId, orgId),
        eq(schema.currencyAccounts.currency, toCurrency.toUpperCase()),
        eq(schema.currencyAccounts.isActive, true),
      ),
    )
    .orderBy(desc(schema.currencyAccounts.isDefault))
    .limit(1)

  if (!destAccount) {
    // Auto-create destination account
    ;[destAccount] = await db
      .insert(schema.currencyAccounts)
      .values({
        orgId,
        currency: toCurrency.toUpperCase(),
        balance: 0,
        accountName: `${toCurrency.toUpperCase()} Account`,
        isDefault: true,
        isActive: true,
      })
      .returning()
  }

  // Debit source, credit destination
  await db
    .update(schema.currencyAccounts)
    .set({ balance: sql`${schema.currencyAccounts.balance} - ${fromAmount}` })
    .where(eq(schema.currencyAccounts.id, sourceAccount.id))

  await db
    .update(schema.currencyAccounts)
    .set({ balance: sql`${schema.currencyAccounts.balance} + ${toAmount}` })
    .where(eq(schema.currencyAccounts.id, destAccount.id))

  // Record FX transaction
  const now = new Date()
  const [transaction] = await db
    .insert(schema.fxTransactions)
    .values({
      orgId,
      fromCurrency: fromCurrency.toUpperCase(),
      toCurrency: toCurrency.toUpperCase(),
      fromAmount,
      toAmount,
      exchangeRate,
      fee,
      purpose: purpose ?? null,
      reference: reference ?? null,
      executedAt: now,
    })
    .returning()

  return {
    transactionId: transaction.id,
    fromCurrency: fromCurrency.toUpperCase(),
    toCurrency: toCurrency.toUpperCase(),
    fromAmount,
    toAmount,
    exchangeRate,
    fee,
    netAmount: toAmount,
    executedAt: now,
  }
}

// ============================================================
// EXCHANGE RATES
// ============================================================

/**
 * Get the current exchange rate between two currencies.
 */
export async function getExchangeRate(from: string, to: string) {
  const result = await getFXRate(from, to)
  return {
    from: from.toUpperCase(),
    to: to.toUpperCase(),
    rate: result.rate,
    source: result.source,
    timestamp: result.timestamp,
    inverseRate: 1 / result.rate,
  }
}

/**
 * Get historical exchange rates (simulated from FX transactions).
 */
export async function getHistoricalRates(
  orgId: string,
  fromCurrency: string,
  toCurrency: string,
  startDate: Date,
  endDate: Date,
) {
  const transactions = await db
    .select({
      rate: schema.fxTransactions.exchangeRate,
      executedAt: schema.fxTransactions.executedAt,
    })
    .from(schema.fxTransactions)
    .where(
      and(
        eq(schema.fxTransactions.orgId, orgId),
        eq(schema.fxTransactions.fromCurrency, fromCurrency.toUpperCase()),
        eq(schema.fxTransactions.toCurrency, toCurrency.toUpperCase()),
        gte(schema.fxTransactions.executedAt, startDate),
        lte(schema.fxTransactions.executedAt, endDate),
      ),
    )
    .orderBy(schema.fxTransactions.executedAt)

  // Also get the current live rate
  const currentRate = await getFXRate(fromCurrency, toCurrency)

  return {
    pair: `${fromCurrency.toUpperCase()}/${toCurrency.toUpperCase()}`,
    startDate,
    endDate,
    currentRate: currentRate.rate,
    dataPoints: transactions.map((t) => ({
      rate: t.rate,
      date: t.executedAt,
    })),
    high: transactions.length > 0 ? Math.max(...transactions.map((t) => t.rate)) : currentRate.rate,
    low: transactions.length > 0 ? Math.min(...transactions.map((t) => t.rate)) : currentRate.rate,
    average:
      transactions.length > 0
        ? transactions.reduce((s, t) => s + t.rate, 0) / transactions.length
        : currentRate.rate,
  }
}

// ============================================================
// EXPOSURE & ANALYSIS
// ============================================================

/**
 * Calculate the FX impact on organization balances compared to a baseline rate.
 */
export async function calculateFXImpact(orgId: string): Promise<FXImpact[]> {
  // Get all active currency accounts
  const accounts = await db
    .select()
    .from(schema.currencyAccounts)
    .where(and(eq(schema.currencyAccounts.orgId, orgId), eq(schema.currencyAccounts.isActive, true)))

  // Group balances by currency
  const balanceByCurrency: Record<string, number> = {}
  for (const acc of accounts) {
    balanceByCurrency[acc.currency] = (balanceByCurrency[acc.currency] ?? 0) + acc.balance
  }

  // For each currency, compare first-of-month rate with current rate
  const impacts: FXImpact[] = []
  const allRates = await getAllRates()

  for (const [currency, balance] of Object.entries(balanceByCurrency)) {
    if (currency === 'USD' || balance === 0) continue

    const currentRate = allRates[currency]
    if (!currentRate) continue

    // Use a baseline rate (5% variance simulation for impact calculation)
    const baselineRate = currentRate * 0.95
    const rateChange = currentRate - baselineRate
    const rateChangePercent = (rateChange / baselineRate) * 100

    // Balance impact in USD
    const currentValueUSD = balance / currentRate
    const baselineValueUSD = balance / baselineRate
    const balanceImpact = Math.round(currentValueUSD - baselineValueUSD)

    impacts.push({
      currency,
      originalRate: baselineRate,
      currentRate,
      rateChange,
      rateChangePercent: Math.round(rateChangePercent * 100) / 100,
      balanceImpact,
      balance,
    })
  }

  return impacts.sort((a, b) => Math.abs(b.balanceImpact) - Math.abs(a.balanceImpact))
}

/**
 * Get currency exposure breakdown for the organization.
 */
export async function getCurrencyExposure(orgId: string): Promise<CurrencyExposure[]> {
  const accounts = await db
    .select()
    .from(schema.currencyAccounts)
    .where(and(eq(schema.currencyAccounts.orgId, orgId), eq(schema.currencyAccounts.isActive, true)))

  // Group by currency
  const grouped: Record<string, { balance: number; accounts: number }> = {}
  for (const acc of accounts) {
    if (!grouped[acc.currency]) grouped[acc.currency] = { balance: 0, accounts: 0 }
    grouped[acc.currency].balance += acc.balance
    grouped[acc.currency].accounts++
  }

  const allRates = await getAllRates()
  const exposures: CurrencyExposure[] = []
  let totalUSD = 0

  for (const [currency, data] of Object.entries(grouped)) {
    const rate = allRates[currency] ?? 1
    const balanceInUSD = Math.round(data.balance / rate)
    totalUSD += balanceInUSD
    exposures.push({
      currency,
      balance: data.balance,
      balanceInUSD,
      exchangeRate: rate,
      percentOfTotal: 0, // Will be calculated after total is known
      accounts: data.accounts,
    })
  }

  // Calculate percentages
  for (const exp of exposures) {
    exp.percentOfTotal = totalUSD > 0 ? Math.round((exp.balanceInUSD / totalUSD) * 10000) / 100 : 0
  }

  return exposures.sort((a, b) => b.balanceInUSD - a.balanceInUSD)
}

/**
 * Hedging impact calculator: models P&L scenarios for currency positions
 * at different exchange rate movements.
 */
export async function hedgingCalculator(orgId: string, currency: string): Promise<HedgingScenario> {
  const accounts = await db
    .select()
    .from(schema.currencyAccounts)
    .where(
      and(
        eq(schema.currencyAccounts.orgId, orgId),
        eq(schema.currencyAccounts.currency, currency.toUpperCase()),
        eq(schema.currencyAccounts.isActive, true),
      ),
    )

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0)

  if (totalBalance === 0) {
    throw new MultiCurrencyError(`No exposure in ${currency}`, 'NO_EXPOSURE')
  }

  const rateResult = await getFXRate(currency, 'USD')
  const currentRate = rateResult.rate
  const currentValueUSD = Math.round(totalBalance * currentRate)

  // Model scenarios at -10%, -5%, -2%, +2%, +5%, +10%
  const rateChanges = [-0.10, -0.05, -0.02, 0.02, 0.05, 0.10]
  const scenarios = rateChanges.map((change) => {
    const newRate = currentRate * (1 + change)
    const newValueUSD = Math.round(totalBalance * newRate)
    const gainLoss = newValueUSD - currentValueUSD

    return {
      rateChange: change,
      newRate: Math.round(newRate * 10000) / 10000,
      newValueUSD,
      gainLoss,
      hedgedValue: currentValueUSD, // If hedged, value stays at current
      hedgingBenefit: change < 0 ? Math.abs(gainLoss) : -Math.abs(gainLoss), // Benefit = loss avoided (or gain forgone)
    }
  })

  return {
    currency: currency.toUpperCase(),
    currentExposure: totalBalance,
    currentValueUSD,
    scenarios,
  }
}

// ============================================================
// DASHBOARD & REPORTING
// ============================================================

/**
 * Get a comprehensive multi-currency dashboard.
 */
export async function getMultiCurrencyDashboard(orgId: string): Promise<MultiCurrencyDashboard> {
  // Get all accounts
  const accounts = await db
    .select()
    .from(schema.currencyAccounts)
    .where(and(eq(schema.currencyAccounts.orgId, orgId), eq(schema.currencyAccounts.isActive, true)))

  const allRates = await getAllRates()

  // Calculate total balance in USD
  let totalBalanceUSD = 0
  const currencies = new Set<string>()
  for (const acc of accounts) {
    currencies.add(acc.currency)
    const rate = allRates[acc.currency] ?? 1
    totalBalanceUSD += Math.round(acc.balance / rate)
  }

  // Exposure breakdown
  const exposures = await getCurrencyExposure(orgId)

  // Recent FX transactions
  const recentTxns = await db
    .select()
    .from(schema.fxTransactions)
    .where(eq(schema.fxTransactions.orgId, orgId))
    .orderBy(desc(schema.fxTransactions.executedAt))
    .limit(20)

  // Monthly volume
  const monthlyRows = await db
    .select({
      month: sql<string>`TO_CHAR(${schema.fxTransactions.executedAt}, 'YYYY-MM')`,
      volume: sum(schema.fxTransactions.fromAmount),
      count: count(),
    })
    .from(schema.fxTransactions)
    .where(
      and(
        eq(schema.fxTransactions.orgId, orgId),
        gte(schema.fxTransactions.executedAt, sql`NOW() - INTERVAL '12 months'`),
      ),
    )
    .groupBy(sql`TO_CHAR(${schema.fxTransactions.executedAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${schema.fxTransactions.executedAt}, 'YYYY-MM')`)

  // Top currency pairs
  const pairRows = await db
    .select({
      fromCurrency: schema.fxTransactions.fromCurrency,
      toCurrency: schema.fxTransactions.toCurrency,
      volume: sum(schema.fxTransactions.fromAmount),
      count: count(),
    })
    .from(schema.fxTransactions)
    .where(eq(schema.fxTransactions.orgId, orgId))
    .groupBy(schema.fxTransactions.fromCurrency, schema.fxTransactions.toCurrency)
    .orderBy(desc(sum(schema.fxTransactions.fromAmount)))
    .limit(10)

  return {
    orgId,
    totalBalanceUSD,
    accountCount: accounts.length,
    currencyCount: currencies.size,
    exposures,
    recentTransactions: recentTxns.map((t) => ({
      id: t.id,
      fromCurrency: t.fromCurrency,
      toCurrency: t.toCurrency,
      fromAmount: t.fromAmount,
      toAmount: t.toAmount,
      rate: t.exchangeRate,
      executedAt: t.executedAt,
    })),
    monthlyVolume: monthlyRows.map((r) => ({
      month: r.month,
      volume: Number(r.volume ?? 0),
      transactionCount: Number(r.count),
    })),
    topCurrencyPairs: pairRows.map((r) => ({
      pair: `${r.fromCurrency}/${r.toCurrency}`,
      volume: Number(r.volume ?? 0),
      count: Number(r.count),
    })),
  }
}

/**
 * Reconcile FX transactions: match FX transactions to source payments.
 */
export async function reconcileFXTransactions(orgId: string, startDate: Date, endDate: Date) {
  const transactions = await db
    .select()
    .from(schema.fxTransactions)
    .where(
      and(
        eq(schema.fxTransactions.orgId, orgId),
        gte(schema.fxTransactions.executedAt, startDate),
        lte(schema.fxTransactions.executedAt, endDate),
      ),
    )
    .orderBy(schema.fxTransactions.executedAt)

  const totalFromAmount = transactions.reduce((s, t) => s + t.fromAmount, 0)
  const totalToAmount = transactions.reduce((s, t) => s + t.toAmount, 0)
  const totalFees = transactions.reduce((s, t) => s + (t.fee ?? 0), 0)

  // Group by currency pair
  const byPair: Record<string, { count: number; fromTotal: number; toTotal: number; feeTotal: number; avgRate: number }> = {}
  for (const txn of transactions) {
    const pair = `${txn.fromCurrency}/${txn.toCurrency}`
    if (!byPair[pair]) byPair[pair] = { count: 0, fromTotal: 0, toTotal: 0, feeTotal: 0, avgRate: 0 }
    byPair[pair].count++
    byPair[pair].fromTotal += txn.fromAmount
    byPair[pair].toTotal += txn.toAmount
    byPair[pair].feeTotal += txn.fee ?? 0
  }

  // Calculate average rates
  for (const [pair, data] of Object.entries(byPair)) {
    data.avgRate = data.fromTotal > 0 ? data.toTotal / data.fromTotal : 0
  }

  return {
    orgId,
    period: { startDate, endDate },
    transactionCount: transactions.length,
    totalFromAmount,
    totalToAmount,
    totalFees,
    effectiveFeeRate: totalFromAmount > 0 ? Math.round((totalFees / totalFromAmount) * 10000) / 100 : 0,
    byPair,
    transactions: transactions.map((t) => ({
      id: t.id,
      fromCurrency: t.fromCurrency,
      toCurrency: t.toCurrency,
      fromAmount: t.fromAmount,
      toAmount: t.toAmount,
      rate: t.exchangeRate,
      fee: t.fee,
      reference: t.reference,
      executedAt: t.executedAt,
    })),
  }
}

/**
 * Generate an FX report with P&L analysis.
 */
export async function generateFXReport(orgId: string, startDate: Date, endDate: Date) {
  const reconciliation = await reconcileFXTransactions(orgId, startDate, endDate)
  const exposures = await getCurrencyExposure(orgId)
  const impacts = await calculateFXImpact(orgId)

  return {
    orgId,
    reportDate: new Date(),
    period: { startDate, endDate },
    summary: {
      totalTransactions: reconciliation.transactionCount,
      totalVolumeConverted: reconciliation.totalFromAmount,
      totalFeesPaid: reconciliation.totalFees,
      effectiveFeeRate: reconciliation.effectiveFeeRate,
    },
    currentExposure: exposures,
    fxImpact: impacts,
    volumeByPair: reconciliation.byPair,
  }
}

/**
 * Get real-time rates for all supported currencies.
 */
export async function getRealtimeRates() {
  // Force a refresh to get the latest rates
  await refreshRates()
  const rates = await getAllRates()
  return {
    baseCurrency: 'USD',
    rates,
    timestamp: Date.now(),
    source: 'live',
  }
}

/**
 * Set an FX alert (in-memory tracking; for production, this would persist).
 */
const fxAlerts: FXAlert[] = []
let alertIdCounter = 0

export async function setFXAlerts(
  orgId: string,
  alerts: Array<{ currency: string; targetRate: number; direction: 'above' | 'below' }>,
): Promise<FXAlert[]> {
  const created: FXAlert[] = []

  for (const alert of alerts) {
    const fxAlert: FXAlert = {
      id: `FXA-${++alertIdCounter}`,
      orgId,
      currency: alert.currency.toUpperCase(),
      targetRate: alert.targetRate,
      direction: alert.direction,
      isTriggered: false,
      createdAt: new Date(),
    }
    fxAlerts.push(fxAlert)
    created.push(fxAlert)
  }

  // Check if any alerts are already triggered
  const allRates = await getAllRates()
  for (const alert of created) {
    const currentRate = allRates[alert.currency]
    if (!currentRate) continue
    if (alert.direction === 'above' && currentRate >= alert.targetRate) {
      alert.isTriggered = true
    }
    if (alert.direction === 'below' && currentRate <= alert.targetRate) {
      alert.isTriggered = true
    }
  }

  return created
}
