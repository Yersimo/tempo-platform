/**
 * Bank Feed Service — Plaid integration & reconciliation engine
 *
 * Handles:
 * - Plaid Link token creation & public token exchange
 * - Transaction sync via Plaid /transactions/sync
 * - Manual CSV import as fallback
 * - Auto-matching engine (rules → exact → fuzzy → scoring)
 * - Reconciliation summary generation
 * - Balance verification
 *
 * All amounts in CENTS. Negative amount = outflow, positive = inflow.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm'

// ============================================================
// PLAID CLIENT
// ============================================================

const PLAID_ENV = process.env.PLAID_ENV || 'sandbox'
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID || ''
const PLAID_SECRET = process.env.PLAID_SECRET || ''

const PLAID_BASE_URLS: Record<string, string> = {
  sandbox: 'https://sandbox.plaid.com',
  development: 'https://development.plaid.com',
  production: 'https://production.plaid.com',
}

function getPlaidBaseUrl(): string {
  return PLAID_BASE_URLS[PLAID_ENV] || PLAID_BASE_URLS.sandbox
}

function isPlaidConfigured(): boolean {
  return !!(PLAID_CLIENT_ID && PLAID_SECRET)
}

async function plaidRequest<T>(endpoint: string, body: Record<string, any>): Promise<T> {
  const url = `${getPlaidBaseUrl()}${endpoint}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: PLAID_CLIENT_ID,
      secret: PLAID_SECRET,
      ...body,
    }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error_message: 'Plaid API error' }))
    throw new Error(err.error_message || `Plaid ${endpoint} failed: ${res.status}`)
  }
  return res.json()
}

// ============================================================
// MOCK DATA (used when Plaid API keys are not configured)
// ============================================================

function generateMockLinkToken(): string {
  return `link-sandbox-${crypto.randomUUID().slice(0, 8)}`
}

function generateMockTransactions(accountId: string, count: number = 30): Array<{
  transaction_id: string
  date: string
  amount: number
  name: string
  merchant_name: string | null
  category: string[]
  pending: boolean
}> {
  const merchants = [
    { name: 'Amazon Web Services', merchant: 'AWS', category: ['Cloud Services'] },
    { name: 'Stripe', merchant: 'Stripe Inc', category: ['Payment Processing'] },
    { name: 'Google Cloud Platform', merchant: 'Google', category: ['Cloud Services'] },
    { name: 'Gusto Payroll', merchant: 'Gusto', category: ['Payroll'] },
    { name: 'WeWork', merchant: 'WeWork', category: ['Office Space'] },
    { name: 'United Airlines', merchant: 'United Airlines', category: ['Travel', 'Airlines'] },
    { name: 'Uber for Business', merchant: 'Uber', category: ['Travel', 'Rideshare'] },
    { name: 'Slack Technologies', merchant: 'Slack', category: ['Software'] },
    { name: 'Zoom Video', merchant: 'Zoom', category: ['Software'] },
    { name: 'ADP Payroll', merchant: 'ADP', category: ['Payroll'] },
    { name: 'Delta Airlines', merchant: 'Delta', category: ['Travel', 'Airlines'] },
    { name: 'Hilton Hotels', merchant: 'Hilton', category: ['Travel', 'Hotels'] },
    { name: 'Office Depot', merchant: 'Office Depot', category: ['Office Supplies'] },
    { name: 'FedEx Shipping', merchant: 'FedEx', category: ['Shipping'] },
    { name: 'Salesforce', merchant: 'Salesforce', category: ['Software'] },
  ]

  const txns = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const m = merchants[i % merchants.length]
    const daysAgo = Math.floor(Math.random() * 60)
    const d = new Date(now)
    d.setDate(d.getDate() - daysAgo)
    const amountDollars = -(Math.floor(Math.random() * 500000) + 1000) // negative = outflow, in cents
    txns.push({
      transaction_id: `mock-txn-${crypto.randomUUID().slice(0, 8)}`,
      date: d.toISOString().slice(0, 10),
      amount: amountDollars,
      name: m.name,
      merchant_name: m.merchant,
      category: m.category,
      pending: i < 3, // first 3 are pending
    })
  }
  return txns.sort((a, b) => b.date.localeCompare(a.date))
}

// ============================================================
// LINK TOKEN & AUTH
// ============================================================

export async function createLinkToken(orgId: string, userId: string): Promise<{ linkToken: string }> {
  if (!isPlaidConfigured()) {
    return { linkToken: generateMockLinkToken() }
  }

  const result = await plaidRequest<{ link_token: string }>('/link/token/create', {
    user: { client_user_id: userId },
    client_name: 'Tempo Platform',
    products: ['transactions'],
    country_codes: ['US', 'CA', 'GB'],
    language: 'en',
    redirect_uri: process.env.PLAID_REDIRECT_URI,
  })

  return { linkToken: result.link_token }
}

export async function exchangePublicToken(
  orgId: string,
  publicToken: string,
  institutionId: string,
  institutionName: string
): Promise<{ connectionId: string; accounts: any[] }> {
  if (!isPlaidConfigured()) {
    // Mock: create connection + accounts without Plaid
    const [conn] = await db.insert(schema.bankConnections).values({
      orgId,
      institutionId,
      institutionName,
      plaidItemId: `mock-item-${crypto.randomUUID().slice(0, 8)}`,
      plaidAccessToken: 'mock-access-token',
      status: 'active',
      lastSyncAt: new Date(),
      consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    }).returning()

    const mockAccounts = [
      { name: 'Business Checking', officialName: 'Business Premium Checking', type: 'depository', subtype: 'checking', mask: '4521', currentBalance: 28450000, availableBalance: 27800000 },
      { name: 'Business Savings', officialName: 'High Yield Business Savings', type: 'depository', subtype: 'savings', mask: '8834', currentBalance: 125000000, availableBalance: 125000000 },
    ]

    const insertedAccounts = await db.insert(schema.bankAccounts).values(
      mockAccounts.map(a => ({
        orgId,
        connectionId: conn.id,
        plaidAccountId: `mock-acct-${crypto.randomUUID().slice(0, 8)}`,
        name: a.name,
        officialName: a.officialName,
        type: a.type,
        subtype: a.subtype,
        mask: a.mask,
        currency: 'USD',
        currentBalance: a.currentBalance,
        availableBalance: a.availableBalance,
        lastSyncAt: new Date(),
      }))
    ).returning()

    return { connectionId: conn.id, accounts: insertedAccounts }
  }

  // Real Plaid flow
  const exchangeResult = await plaidRequest<{ access_token: string; item_id: string }>(
    '/item/public_token/exchange',
    { public_token: publicToken }
  )

  const [conn] = await db.insert(schema.bankConnections).values({
    orgId,
    institutionId,
    institutionName,
    plaidItemId: exchangeResult.item_id,
    plaidAccessToken: exchangeResult.access_token,
    status: 'active',
    lastSyncAt: new Date(),
    consentExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
  }).returning()

  // Fetch accounts
  const accountsResult = await plaidRequest<{ accounts: any[] }>('/accounts/get', {
    access_token: exchangeResult.access_token,
  })

  const insertedAccounts = await db.insert(schema.bankAccounts).values(
    accountsResult.accounts.map((a: any) => ({
      orgId,
      connectionId: conn.id,
      plaidAccountId: a.account_id,
      name: a.name,
      officialName: a.official_name,
      type: a.type,
      subtype: a.subtype,
      mask: a.mask,
      currency: a.balances?.iso_currency_code || 'USD',
      currentBalance: Math.round((a.balances?.current || 0) * 100),
      availableBalance: Math.round((a.balances?.available || 0) * 100),
      lastSyncAt: new Date(),
    }))
  ).returning()

  return { connectionId: conn.id, accounts: insertedAccounts }
}

// ============================================================
// TRANSACTION SYNC
// ============================================================

export async function syncTransactions(orgId: string, connectionId: string): Promise<{
  added: number
  modified: number
  removed: number
}> {
  const [conn] = await db.select().from(schema.bankConnections)
    .where(and(eq(schema.bankConnections.id, connectionId), eq(schema.bankConnections.orgId, orgId)))

  if (!conn) throw new Error('Connection not found')

  const accounts = await db.select().from(schema.bankAccounts)
    .where(eq(schema.bankAccounts.connectionId, connectionId))

  if (!isPlaidConfigured() || conn.plaidAccessToken === 'mock-access-token') {
    // Mock: generate transactions for each account
    let totalAdded = 0
    for (const account of accounts) {
      const existing = await db.select({ count: sql<number>`count(*)` })
        .from(schema.bankTransactions)
        .where(eq(schema.bankTransactions.accountId, account.id))
      const existingCount = Number(existing[0]?.count || 0)

      if (existingCount < 5) {
        const mockTxns = generateMockTransactions(account.id, 30)
        await db.insert(schema.bankTransactions).values(
          mockTxns.map(t => ({
            orgId,
            accountId: account.id,
            plaidTransactionId: t.transaction_id,
            date: t.date,
            amount: t.amount,
            currency: account.currency || 'USD',
            name: t.name,
            merchantName: t.merchant_name,
            category: t.category[0] || null,
            subcategory: t.category[1] || null,
            pending: t.pending,
            matchStatus: 'unmatched' as const,
          }))
        )
        totalAdded += mockTxns.length
      }
    }

    await db.update(schema.bankConnections)
      .set({ lastSyncAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.bankConnections.id, connectionId))

    return { added: totalAdded, modified: 0, removed: 0 }
  }

  // Real Plaid sync
  let cursor: string | undefined
  let added = 0, modified = 0, removed = 0
  let hasMore = true

  while (hasMore) {
    const syncResult = await plaidRequest<{
      added: any[]; modified: any[]; removed: any[]
      next_cursor: string; has_more: boolean
    }>('/transactions/sync', {
      access_token: conn.plaidAccessToken,
      cursor,
    })

    // Process added
    for (const txn of syncResult.added) {
      const account = accounts.find(a => a.plaidAccountId === txn.account_id)
      if (!account) continue

      await db.insert(schema.bankTransactions).values({
        orgId,
        accountId: account.id,
        plaidTransactionId: txn.transaction_id,
        date: txn.date,
        amount: Math.round(txn.amount * -100), // Plaid: positive = debit; we negate for outflow = negative
        currency: txn.iso_currency_code || 'USD',
        name: txn.name || txn.merchant_name || 'Unknown',
        merchantName: txn.merchant_name,
        category: txn.personal_finance_category?.primary || null,
        subcategory: txn.personal_finance_category?.detailed || null,
        pending: txn.pending,
        matchStatus: 'unmatched',
      }).onConflictDoNothing()

      added++
    }

    // Process modified
    for (const txn of syncResult.modified) {
      await db.update(schema.bankTransactions)
        .set({
          date: txn.date,
          amount: Math.round(txn.amount * -100),
          name: txn.name || txn.merchant_name || 'Unknown',
          merchantName: txn.merchant_name,
          pending: txn.pending,
        })
        .where(eq(schema.bankTransactions.plaidTransactionId, txn.transaction_id))
      modified++
    }

    // Process removed
    for (const txn of syncResult.removed) {
      await db.delete(schema.bankTransactions)
        .where(eq(schema.bankTransactions.plaidTransactionId, txn.transaction_id))
      removed++
    }

    cursor = syncResult.next_cursor
    hasMore = syncResult.has_more
  }

  // Update connection sync timestamp
  await db.update(schema.bankConnections)
    .set({ lastSyncAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.bankConnections.id, connectionId))

  // Update account balances
  try {
    const balancesResult = await plaidRequest<{ accounts: any[] }>('/accounts/balance/get', {
      access_token: conn.plaidAccessToken,
    })
    for (const bal of balancesResult.accounts) {
      const account = accounts.find(a => a.plaidAccountId === bal.account_id)
      if (!account) continue
      await db.update(schema.bankAccounts)
        .set({
          currentBalance: Math.round((bal.balances?.current || 0) * 100),
          availableBalance: Math.round((bal.balances?.available || 0) * 100),
          lastSyncAt: new Date(),
        })
        .where(eq(schema.bankAccounts.id, account.id))
    }
  } catch {
    // Balance fetch is best-effort
  }

  return { added, modified, removed }
}

// ============================================================
// CSV IMPORT (fallback for banks without Plaid support)
// ============================================================

export interface CSVTransaction {
  date: string
  amount: number // in cents
  description: string
  merchant?: string
  category?: string
}

export async function importTransactionsFromCSV(
  orgId: string,
  accountId: string,
  transactions: CSVTransaction[]
): Promise<{ imported: number; skipped: number }> {
  // Validate account belongs to org
  const [account] = await db.select().from(schema.bankAccounts)
    .where(and(eq(schema.bankAccounts.id, accountId), eq(schema.bankAccounts.orgId, orgId)))
  if (!account) throw new Error('Account not found')

  let imported = 0
  let skipped = 0

  for (const txn of transactions) {
    // Simple dedup: same date + amount + name
    const existing = await db.select({ count: sql<number>`count(*)` })
      .from(schema.bankTransactions)
      .where(and(
        eq(schema.bankTransactions.accountId, accountId),
        eq(schema.bankTransactions.date, txn.date),
        eq(schema.bankTransactions.amount, txn.amount),
        eq(schema.bankTransactions.name, txn.description)
      ))

    if (Number(existing[0]?.count || 0) > 0) {
      skipped++
      continue
    }

    await db.insert(schema.bankTransactions).values({
      orgId,
      accountId,
      date: txn.date,
      amount: txn.amount,
      currency: account.currency || 'USD',
      name: txn.description,
      merchantName: txn.merchant || null,
      category: txn.category || null,
      pending: false,
      matchStatus: 'unmatched',
    })
    imported++
  }

  return { imported, skipped }
}

// ============================================================
// MATCHING ENGINE
// ============================================================

interface MatchCandidate {
  entityType: 'invoice' | 'expense' | 'payroll' | 'bill'
  entityId: string
  amount: number // cents
  date: string
  name: string
  confidence?: number
}

/**
 * Compute string similarity using Dice coefficient (trigram-based).
 * Returns 0–1 where 1 is exact match.
 */
function stringSimilarity(a: string, b: string): number {
  if (!a || !b) return 0
  const s1 = a.toLowerCase().trim()
  const s2 = b.toLowerCase().trim()
  if (s1 === s2) return 1

  const trigrams = (s: string): Set<string> => {
    const set = new Set<string>()
    for (let i = 0; i < s.length - 2; i++) set.add(s.slice(i, i + 3))
    return set
  }
  const t1 = trigrams(s1)
  const t2 = trigrams(s2)
  if (t1.size === 0 || t2.size === 0) return 0

  let intersection = 0
  for (const t of t1) if (t2.has(t)) intersection++
  return (2 * intersection) / (t1.size + t2.size)
}

/**
 * Score a match candidate against a bank transaction.
 * Returns 0–100 based on: amount accuracy (40pts), date proximity (30pts), name similarity (30pts).
 */
function scoreMatch(txn: { amount: number; date: string; name: string; merchantName: string | null }, candidate: MatchCandidate): number {
  // Amount accuracy (40 pts) — exact = 40, within 5% = 20, else 0
  const txnAmt = Math.abs(txn.amount)
  const candAmt = Math.abs(candidate.amount)
  let amountScore = 0
  if (txnAmt === candAmt) {
    amountScore = 40
  } else if (candAmt > 0) {
    const pctDiff = Math.abs(txnAmt - candAmt) / candAmt
    if (pctDiff <= 0.05) {
      amountScore = Math.round(20 * (1 - pctDiff / 0.05))
    }
  }

  // Date proximity (30 pts) — same day = 30, within 3 days = 20, within 7 = 10
  const txnDate = new Date(txn.date)
  const candDate = new Date(candidate.date)
  const daysDiff = Math.abs(Math.round((txnDate.getTime() - candDate.getTime()) / (1000 * 60 * 60 * 24)))
  let dateScore = 0
  if (daysDiff === 0) dateScore = 30
  else if (daysDiff <= 3) dateScore = 20
  else if (daysDiff <= 7) dateScore = 10

  // Name similarity (30 pts) — trigram similarity
  const nameToCompare = txn.merchantName || txn.name
  const similarity = stringSimilarity(nameToCompare, candidate.name)
  const nameScore = Math.round(similarity * 30)

  return amountScore + dateScore + nameScore
}

export async function autoMatchTransactions(orgId: string, accountId?: string): Promise<{
  matched: number
  total: number
}> {
  // Fetch unmatched transactions
  const conditions = [eq(schema.bankTransactions.orgId, orgId), eq(schema.bankTransactions.matchStatus, 'unmatched')]
  if (accountId) conditions.push(eq(schema.bankTransactions.accountId, accountId))

  const unmatchedTxns = await db.select().from(schema.bankTransactions)
    .where(and(...conditions))
    .orderBy(desc(schema.bankTransactions.date))

  if (unmatchedTxns.length === 0) return { matched: 0, total: 0 }

  // Fetch reconciliation rules
  const rules = await db.select().from(schema.reconciliationRules)
    .where(and(eq(schema.reconciliationRules.orgId, orgId), eq(schema.reconciliationRules.isActive, true)))
    .orderBy(desc(schema.reconciliationRules.priority))

  // Fetch candidate entities for matching
  const invoices = await db.select().from(schema.invoices)
    .where(eq(schema.invoices.orgId, orgId))

  const expenses = await db.select().from(schema.expenseReports)
    .where(eq(schema.expenseReports.orgId, orgId))

  const payrollRuns = await db.select().from(schema.payrollRuns)
    .where(eq(schema.payrollRuns.orgId, orgId))

  const billPayments = await db.select().from(schema.billPayments)
    .where(eq(schema.billPayments.orgId, orgId))

  let matchedCount = 0

  for (const txn of unmatchedTxns) {
    let bestMatch: { entityType: string; entityId: string; confidence: number } | null = null

    // 1. Check reconciliation rules first (highest priority)
    for (const rule of rules) {
      const fieldValue = rule.matchField === 'amount'
        ? String(txn.amount)
        : rule.matchField === 'merchant'
          ? (txn.merchantName || '')
          : txn.name

      let ruleMatches = false
      switch (rule.matchOperator) {
        case 'exact':
          ruleMatches = fieldValue === rule.matchValue
          break
        case 'contains':
          ruleMatches = fieldValue.toLowerCase().includes(rule.matchValue.toLowerCase())
          break
        case 'regex':
          try { ruleMatches = new RegExp(rule.matchValue, 'i').test(fieldValue) } catch { ruleMatches = false }
          break
        case 'range': {
          const [min, max] = rule.matchValue.split(',').map(Number)
          const val = Number(fieldValue)
          ruleMatches = val >= min && val <= max
          break
        }
      }

      if (ruleMatches) {
        // Find best entity of the rule's target type by amount
        let candidates: MatchCandidate[] = []
        if (rule.targetEntityType === 'invoice') {
          candidates = invoices.map(inv => ({
            entityType: 'invoice' as const,
            entityId: inv.id,
            amount: (inv as any).amount || (inv as any).totalCents || 0,
            date: String((inv as any).dueDate || (inv as any).due_date || (inv as any).createdAt || ''),
            name: (inv as any).clientName || (inv as any).client_name || '',
            confidence: 0,
          })).filter(c => c.amount !== 0).map(c => ({ ...c, confidence: scoreMatch(txn as any, c) }))
        }
        if (candidates.length > 0) {
          candidates.sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
          if ((candidates[0].confidence || 0) >= 30) {
            bestMatch = { entityType: candidates[0].entityType, entityId: candidates[0].entityId, confidence: Math.min(100, (candidates[0].confidence || 0) + 10) }
          }
        }
        break // First matching rule wins
      }
    }

    // 2. Exact amount match against invoices
    if (!bestMatch) {
      for (const inv of invoices) {
        const invAmount = (inv as any).amount || (inv as any).totalCents || 0
        if (Math.abs(txn.amount) === Math.abs(invAmount) && invAmount !== 0) {
          const candidate: MatchCandidate = {
            entityType: 'invoice',
            entityId: inv.id,
            amount: invAmount,
            date: String((inv as any).dueDate || (inv as any).due_date || (inv as any).createdAt || ''),
            name: (inv as any).clientName || (inv as any).client_name || '',
            confidence: 0,
          }
          candidate.confidence = scoreMatch(txn as any, candidate)
          if (candidate.confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { entityType: 'invoice', entityId: inv.id, confidence: candidate.confidence }
          }
        }
      }
    }

    // 3. Exact amount match against expense reports
    if (!bestMatch) {
      for (const exp of expenses) {
        const expAmount = (exp as any).total || (exp as any).totalCents || (exp as any).amount || 0
        if (Math.abs(txn.amount) === Math.abs(expAmount) && expAmount !== 0) {
          const candidate: MatchCandidate = {
            entityType: 'expense',
            entityId: exp.id,
            amount: expAmount,
            date: String((exp as any).submittedAt || (exp as any).submitted_at || (exp as any).createdAt || ''),
            name: (exp as any).title || (exp as any).description || '',
            confidence: 0,
          }
          candidate.confidence = scoreMatch(txn as any, candidate)
          if (candidate.confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { entityType: 'expense', entityId: exp.id, confidence: candidate.confidence }
          }
        }
      }
    }

    // 4. Exact amount match against payroll run totals
    if (!bestMatch) {
      for (const run of payrollRuns) {
        const runTotal = (run as any).totalNetPay || (run as any).total_net_pay || (run as any).totalGross || 0
        if (Math.abs(txn.amount) === Math.abs(runTotal) && runTotal !== 0) {
          const candidate: MatchCandidate = {
            entityType: 'payroll',
            entityId: run.id,
            amount: runTotal,
            date: String((run as any).payDate || (run as any).pay_date || (run as any).createdAt || ''),
            name: `Payroll ${(run as any).name || (run as any).period || ''}`.trim(),
            confidence: 0,
          }
          candidate.confidence = scoreMatch(txn as any, candidate)
          if (candidate.confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { entityType: 'payroll', entityId: run.id, confidence: candidate.confidence }
          }
        }
      }
    }

    // 5. Exact amount match against bill payments
    if (!bestMatch) {
      for (const bill of billPayments) {
        const billAmount = (bill as any).amount || (bill as any).amountCents || 0
        if (Math.abs(txn.amount) === Math.abs(billAmount) && billAmount !== 0) {
          const candidate: MatchCandidate = {
            entityType: 'bill',
            entityId: bill.id,
            amount: billAmount,
            date: String((bill as any).scheduledDate || (bill as any).scheduled_date || (bill as any).createdAt || ''),
            name: (bill as any).vendorName || (bill as any).vendor_name || (bill as any).memo || '',
            confidence: 0,
          }
          candidate.confidence = scoreMatch(txn as any, candidate)
          if (candidate.confidence > (bestMatch?.confidence || 0)) {
            bestMatch = { entityType: 'bill', entityId: bill.id, confidence: candidate.confidence }
          }
        }
      }
    }

    // 6. Fuzzy match: merchant name + amount range (±5%)
    if (!bestMatch || bestMatch.confidence < 50) {
      const allCandidates: MatchCandidate[] = [
        ...invoices.map(inv => ({
          entityType: 'invoice' as const,
          entityId: inv.id,
          amount: (inv as any).amount || (inv as any).totalCents || 0,
          date: String((inv as any).dueDate || (inv as any).due_date || (inv as any).createdAt || ''),
          name: (inv as any).clientName || (inv as any).client_name || '',
          confidence: 0,
        })),
        ...expenses.map(exp => ({
          entityType: 'expense' as const,
          entityId: exp.id,
          amount: (exp as any).total || (exp as any).totalCents || (exp as any).amount || 0,
          date: String((exp as any).submittedAt || (exp as any).submitted_at || (exp as any).createdAt || ''),
          name: (exp as any).title || (exp as any).description || '',
          confidence: 0,
        })),
        ...billPayments.map(bill => ({
          entityType: 'bill' as const,
          entityId: bill.id,
          amount: (bill as any).amount || (bill as any).amountCents || 0,
          date: String((bill as any).scheduledDate || (bill as any).scheduled_date || (bill as any).createdAt || ''),
          name: (bill as any).vendorName || (bill as any).vendor_name || (bill as any).memo || '',
          confidence: 0,
        })),
      ].filter(c => c.amount !== 0)

      for (const candidate of allCandidates) {
        const score = scoreMatch(txn as any, candidate)
        if (score > (bestMatch?.confidence || 40)) {
          bestMatch = { entityType: candidate.entityType, entityId: candidate.entityId, confidence: score }
        }
      }
    }

    // Apply match if confidence >= 40
    if (bestMatch && bestMatch.confidence >= 40) {
      await db.update(schema.bankTransactions)
        .set({
          matchStatus: 'matched',
          matchedEntityType: bestMatch.entityType,
          matchedEntityId: bestMatch.entityId,
          matchConfidence: bestMatch.confidence,
        })
        .where(eq(schema.bankTransactions.id, txn.id))
      matchedCount++
    }
  }

  return { matched: matchedCount, total: unmatchedTxns.length }
}

// ============================================================
// MANUAL MATCH / CONFIRM / EXCLUDE
// ============================================================

export async function confirmMatch(
  orgId: string,
  transactionId: string,
  entityType: string,
  entityId: string
): Promise<void> {
  await db.update(schema.bankTransactions)
    .set({
      matchStatus: 'confirmed',
      matchedEntityType: entityType,
      matchedEntityId: entityId,
      matchConfidence: 100,
    })
    .where(and(eq(schema.bankTransactions.id, transactionId), eq(schema.bankTransactions.orgId, orgId)))
}

export async function excludeTransaction(orgId: string, transactionId: string): Promise<void> {
  await db.update(schema.bankTransactions)
    .set({
      matchStatus: 'excluded',
      matchedEntityType: null,
      matchedEntityId: null,
      matchConfidence: null,
    })
    .where(and(eq(schema.bankTransactions.id, transactionId), eq(schema.bankTransactions.orgId, orgId)))
}

export async function unmatchTransaction(orgId: string, transactionId: string): Promise<void> {
  await db.update(schema.bankTransactions)
    .set({
      matchStatus: 'unmatched',
      matchedEntityType: null,
      matchedEntityId: null,
      matchConfidence: null,
    })
    .where(and(eq(schema.bankTransactions.id, transactionId), eq(schema.bankTransactions.orgId, orgId)))
}

// ============================================================
// RECONCILIATION RULES
// ============================================================

export async function createMatchingRule(orgId: string, rule: {
  name: string
  description?: string
  matchField: string
  matchOperator: string
  matchValue: string
  targetEntityType: string
  priority?: number
}): Promise<any> {
  const [created] = await db.insert(schema.reconciliationRules).values({
    orgId,
    name: rule.name,
    description: rule.description || null,
    matchField: rule.matchField,
    matchOperator: rule.matchOperator,
    matchValue: rule.matchValue,
    targetEntityType: rule.targetEntityType,
    isActive: true,
    priority: rule.priority || 0,
  }).returning()

  return created
}

export async function updateMatchingRule(orgId: string, ruleId: string, data: Partial<{
  name: string
  description: string
  matchField: string
  matchOperator: string
  matchValue: string
  targetEntityType: string
  isActive: boolean
  priority: number
}>): Promise<void> {
  await db.update(schema.reconciliationRules)
    .set(data)
    .where(and(eq(schema.reconciliationRules.id, ruleId), eq(schema.reconciliationRules.orgId, orgId)))
}

export async function deleteMatchingRule(orgId: string, ruleId: string): Promise<void> {
  await db.delete(schema.reconciliationRules)
    .where(and(eq(schema.reconciliationRules.id, ruleId), eq(schema.reconciliationRules.orgId, orgId)))
}

// ============================================================
// RECONCILIATION SUMMARY
// ============================================================

export async function getReconciliationSummary(orgId: string, accountId?: string, dateRange?: {
  from: string
  to: string
}): Promise<{
  totalTransactions: number
  matched: number
  confirmed: number
  unmatched: number
  excluded: number
  matchedPercent: number
  totalInflow: number
  totalOutflow: number
  netAmount: number
  unmatchedAmount: number
  byEntityType: Record<string, { count: number; amount: number }>
}> {
  const conditions: any[] = [eq(schema.bankTransactions.orgId, orgId)]
  if (accountId) conditions.push(eq(schema.bankTransactions.accountId, accountId))
  if (dateRange?.from) conditions.push(gte(schema.bankTransactions.date, dateRange.from))
  if (dateRange?.to) conditions.push(lte(schema.bankTransactions.date, dateRange.to))

  const txns = await db.select().from(schema.bankTransactions)
    .where(and(...conditions))

  const matched = txns.filter(t => t.matchStatus === 'matched')
  const confirmed = txns.filter(t => t.matchStatus === 'confirmed')
  const unmatched = txns.filter(t => t.matchStatus === 'unmatched')
  const excluded = txns.filter(t => t.matchStatus === 'excluded')

  const totalInflow = txns.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0)
  const totalOutflow = txns.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)
  const unmatchedAmount = unmatched.reduce((s, t) => s + Math.abs(t.amount), 0)

  const reconciledCount = matched.length + confirmed.length
  const activeCount = txns.length - excluded.length

  const byEntityType: Record<string, { count: number; amount: number }> = {}
  for (const t of [...matched, ...confirmed]) {
    const type = t.matchedEntityType || 'unknown'
    if (!byEntityType[type]) byEntityType[type] = { count: 0, amount: 0 }
    byEntityType[type].count++
    byEntityType[type].amount += Math.abs(t.amount)
  }

  return {
    totalTransactions: txns.length,
    matched: matched.length,
    confirmed: confirmed.length,
    unmatched: unmatched.length,
    excluded: excluded.length,
    matchedPercent: activeCount > 0 ? Math.round((reconciledCount / activeCount) * 100) : 0,
    totalInflow,
    totalOutflow,
    netAmount: totalInflow + totalOutflow,
    unmatchedAmount,
    byEntityType,
  }
}

// ============================================================
// CONNECTION MANAGEMENT
// ============================================================

export async function disconnectBank(orgId: string, connectionId: string): Promise<void> {
  const [conn] = await db.select().from(schema.bankConnections)
    .where(and(eq(schema.bankConnections.id, connectionId), eq(schema.bankConnections.orgId, orgId)))
  if (!conn) throw new Error('Connection not found')

  // Attempt Plaid item removal
  if (isPlaidConfigured() && conn.plaidAccessToken && conn.plaidAccessToken !== 'mock-access-token') {
    try {
      await plaidRequest('/item/remove', { access_token: conn.plaidAccessToken })
    } catch {
      // Best-effort removal
    }
  }

  await db.update(schema.bankConnections)
    .set({ status: 'disconnected', updatedAt: new Date() })
    .where(eq(schema.bankConnections.id, connectionId))
}

export async function getConnections(orgId: string): Promise<any[]> {
  return db.select().from(schema.bankConnections)
    .where(eq(schema.bankConnections.orgId, orgId))
    .orderBy(desc(schema.bankConnections.createdAt))
}

export async function getAccounts(orgId: string, connectionId?: string): Promise<any[]> {
  const conditions = [eq(schema.bankAccounts.orgId, orgId)]
  if (connectionId) conditions.push(eq(schema.bankAccounts.connectionId, connectionId))
  return db.select().from(schema.bankAccounts).where(and(...conditions))
}

export async function getTransactions(orgId: string, accountId?: string, opts?: {
  matchStatus?: string
  limit?: number
  offset?: number
}): Promise<{ data: any[]; total: number }> {
  const conditions: any[] = [eq(schema.bankTransactions.orgId, orgId)]
  if (accountId) conditions.push(eq(schema.bankTransactions.accountId, accountId))
  if (opts?.matchStatus) conditions.push(eq(schema.bankTransactions.matchStatus, opts.matchStatus))

  const countResult = await db.select({ count: sql<number>`count(*)` })
    .from(schema.bankTransactions)
    .where(and(...conditions))

  const data = await db.select().from(schema.bankTransactions)
    .where(and(...conditions))
    .orderBy(desc(schema.bankTransactions.date))
    .limit(opts?.limit || 100)
    .offset(opts?.offset || 0)

  return { data, total: Number(countResult[0]?.count || 0) }
}
