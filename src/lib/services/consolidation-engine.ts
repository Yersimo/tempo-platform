import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, gte, lte, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Multi-Entity Consolidation Engine
// Handles parent-subsidiary financial consolidation, IC elimination, FX
// ---------------------------------------------------------------------------

export type EntityGroupInput = {
  name: string
  description?: string
  consolidationCurrency?: string
  fiscalYearEnd?: string
}

export type EntityMemberInput = {
  orgId: string
  entityName: string
  entityType: 'parent' | 'subsidiary' | 'branch' | 'joint_venture'
  country: string
  localCurrency: string
  ownershipPercent?: number
  consolidationMethod?: 'full' | 'proportional' | 'equity'
}

export type IntercompanyTxnInput = {
  fromOrgId: string
  toOrgId: string
  transactionType: 'service_fee' | 'loan' | 'dividend' | 'transfer_pricing' | 'cost_allocation'
  description: string
  amount: number // cents
  currency: string
  date: string
  referenceNumber?: string
}

export type FxRateInput = {
  fromCurrency: string
  toCurrency: string
  rate: string
  rateType: 'spot' | 'average' | 'closing'
  effectiveDate: string
  source?: string
}

// Per-entity financial summary used during consolidation
type EntityFinancials = {
  orgId: string
  entityName: string
  localCurrency: string
  ownershipPercent: number
  consolidationMethod: string
  revenue: number       // cents
  payrollCosts: number  // cents
  operatingExpenses: number // cents
  otherIncome: number   // cents
  headcount: number
}

type EliminationEntry = {
  description: string
  debit: number   // cents in consolidation currency
  credit: number  // cents in consolidation currency
  fromEntity: string
  toEntity: string
  originalAmount: number
  originalCurrency: string
}

type ConsolidatedLineItem = {
  label: string
  entities: Record<string, number> // orgId -> amount in consolidation currency
  eliminations: number
  consolidated: number
}

type ConsolidatedReport = {
  groupId: string
  groupName: string
  reportType: string
  periodStart: string
  periodEnd: string
  consolidationCurrency: string
  lineItems: ConsolidatedLineItem[]
  eliminationEntries: EliminationEntry[]
  fxRatesUsed: Record<string, number>
  entityBreakdown: EntityFinancials[]
  totals: {
    revenue: number
    payrollCosts: number
    operatingExpenses: number
    intercompanyEliminations: number
    netIncome: number
    headcount: number
  }
}

// ---- Group management ----

export async function createEntityGroup(parentOrgId: string, input: EntityGroupInput) {
  const [group] = await db.insert(schema.entityGroups).values({
    name: input.name,
    description: input.description || null,
    parentOrgId,
    consolidationCurrency: input.consolidationCurrency || 'USD',
    fiscalYearEnd: input.fiscalYearEnd || '12-31',
  }).returning()
  return group
}

export async function updateEntityGroup(groupId: string, input: Partial<EntityGroupInput>) {
  const updates: Record<string, unknown> = { updatedAt: new Date() }
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.consolidationCurrency !== undefined) updates.consolidationCurrency = input.consolidationCurrency
  if (input.fiscalYearEnd !== undefined) updates.fiscalYearEnd = input.fiscalYearEnd

  const [group] = await db.update(schema.entityGroups)
    .set(updates)
    .where(eq(schema.entityGroups.id, groupId))
    .returning()
  return group
}

export async function getEntityGroup(groupId: string) {
  const [group] = await db.select().from(schema.entityGroups)
    .where(eq(schema.entityGroups.id, groupId))
  return group || null
}

export async function listEntityGroups(parentOrgId: string) {
  return db.select().from(schema.entityGroups)
    .where(eq(schema.entityGroups.parentOrgId, parentOrgId))
}

export async function deleteEntityGroup(groupId: string) {
  await db.delete(schema.entityGroupMembers).where(eq(schema.entityGroupMembers.groupId, groupId))
  await db.delete(schema.intercompanyTransactions).where(eq(schema.intercompanyTransactions.groupId, groupId))
  await db.delete(schema.consolidationReports).where(eq(schema.consolidationReports.groupId, groupId))
  await db.delete(schema.fxRateHistory).where(eq(schema.fxRateHistory.groupId, groupId))
  await db.delete(schema.entityGroups).where(eq(schema.entityGroups.id, groupId))
}

// ---- Entity members ----

export async function addEntityToGroup(groupId: string, input: EntityMemberInput) {
  const [member] = await db.insert(schema.entityGroupMembers).values({
    groupId,
    orgId: input.orgId,
    entityName: input.entityName,
    entityType: input.entityType,
    country: input.country,
    localCurrency: input.localCurrency,
    ownershipPercent: input.ownershipPercent ?? 100,
    consolidationMethod: input.consolidationMethod || 'full',
  }).returning()
  return member
}

export async function updateEntityMember(memberId: string, updates: Partial<EntityMemberInput>) {
  const vals: Record<string, unknown> = {}
  if (updates.entityName !== undefined) vals.entityName = updates.entityName
  if (updates.entityType !== undefined) vals.entityType = updates.entityType
  if (updates.country !== undefined) vals.country = updates.country
  if (updates.localCurrency !== undefined) vals.localCurrency = updates.localCurrency
  if (updates.ownershipPercent !== undefined) vals.ownershipPercent = updates.ownershipPercent
  if (updates.consolidationMethod !== undefined) vals.consolidationMethod = updates.consolidationMethod

  const [member] = await db.update(schema.entityGroupMembers)
    .set(vals)
    .where(eq(schema.entityGroupMembers.id, memberId))
    .returning()
  return member
}

export async function removeEntityFromGroup(memberId: string) {
  await db.update(schema.entityGroupMembers)
    .set({ isActive: false })
    .where(eq(schema.entityGroupMembers.id, memberId))
}

export async function listGroupMembers(groupId: string) {
  return db.select().from(schema.entityGroupMembers)
    .where(and(
      eq(schema.entityGroupMembers.groupId, groupId),
      eq(schema.entityGroupMembers.isActive, true),
    ))
}

// ---- Intercompany transactions ----

export async function recordIntercompanyTransaction(groupId: string, input: IntercompanyTxnInput) {
  const refNum = input.referenceNumber || `IC-${Date.now().toString(36).toUpperCase()}`
  const [txn] = await db.insert(schema.intercompanyTransactions).values({
    groupId,
    fromOrgId: input.fromOrgId,
    toOrgId: input.toOrgId,
    transactionType: input.transactionType,
    description: input.description,
    amount: input.amount,
    currency: input.currency,
    date: input.date,
    referenceNumber: refNum,
    status: 'pending',
  }).returning()
  return txn
}

export async function confirmIntercompanyTransaction(txnId: string, side: 'from' | 'to') {
  const field = side === 'from' ? 'fromEntityConfirmed' : 'toEntityConfirmed'
  const [txn] = await db.update(schema.intercompanyTransactions)
    .set({ [field]: true })
    .where(eq(schema.intercompanyTransactions.id, txnId))
    .returning()

  // Auto-update status to confirmed when both sides confirm
  if (txn && txn.fromEntityConfirmed && txn.toEntityConfirmed) {
    const [updated] = await db.update(schema.intercompanyTransactions)
      .set({ status: 'confirmed' })
      .where(eq(schema.intercompanyTransactions.id, txnId))
      .returning()
    return updated
  }
  return txn
}

export async function listIntercompanyTransactions(groupId: string, periodStart?: string, periodEnd?: string) {
  const conditions = [eq(schema.intercompanyTransactions.groupId, groupId)]
  if (periodStart) conditions.push(gte(schema.intercompanyTransactions.date, periodStart))
  if (periodEnd) conditions.push(lte(schema.intercompanyTransactions.date, periodEnd))
  return db.select().from(schema.intercompanyTransactions)
    .where(and(...conditions))
}

// ---- FX rates ----

export async function setFxRate(groupId: string, input: FxRateInput) {
  const [rate] = await db.insert(schema.fxRateHistory).values({
    groupId,
    fromCurrency: input.fromCurrency,
    toCurrency: input.toCurrency,
    rate: input.rate,
    rateType: input.rateType,
    effectiveDate: input.effectiveDate,
    source: input.source || 'manual',
  }).returning()
  return rate
}

export async function getFxRate(
  groupId: string,
  fromCurrency: string,
  toCurrency: string,
  rateType: string,
  asOfDate: string,
): Promise<number> {
  if (fromCurrency === toCurrency) return 1

  // Find the most recent rate on or before the given date
  const rows = await db.select().from(schema.fxRateHistory)
    .where(and(
      eq(schema.fxRateHistory.groupId, groupId),
      eq(schema.fxRateHistory.fromCurrency, fromCurrency),
      eq(schema.fxRateHistory.toCurrency, toCurrency),
      eq(schema.fxRateHistory.rateType, rateType),
      lte(schema.fxRateHistory.effectiveDate, asOfDate),
    ))
    .orderBy(sql`${schema.fxRateHistory.effectiveDate} DESC`)
    .limit(1)

  if (rows.length > 0) return parseFloat(rows[0].rate)

  // Try inverse
  const inverse = await db.select().from(schema.fxRateHistory)
    .where(and(
      eq(schema.fxRateHistory.groupId, groupId),
      eq(schema.fxRateHistory.fromCurrency, toCurrency),
      eq(schema.fxRateHistory.toCurrency, fromCurrency),
      eq(schema.fxRateHistory.rateType, rateType),
      lte(schema.fxRateHistory.effectiveDate, asOfDate),
    ))
    .orderBy(sql`${schema.fxRateHistory.effectiveDate} DESC`)
    .limit(1)

  if (inverse.length > 0) return 1 / parseFloat(inverse[0].rate)

  // Default to 1 (same currency assumption or no rate available)
  return 1
}

export async function listFxRates(groupId: string) {
  return db.select().from(schema.fxRateHistory)
    .where(eq(schema.fxRateHistory.groupId, groupId))
    .orderBy(sql`${schema.fxRateHistory.effectiveDate} DESC`)
}

// ---- Financial data extraction per entity ----

async function getEntityFinancials(
  orgId: string,
  periodStart: string,
  periodEnd: string,
): Promise<{ revenue: number; payrollCosts: number; operatingExpenses: number; otherIncome: number; headcount: number }> {
  // Payroll costs: sum of payroll runs in the period
  const payrollRows = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.payrollRuns.totalGross}), 0)`
  }).from(schema.payrollRuns)
    .where(and(
      eq(schema.payrollRuns.orgId, orgId),
      gte(schema.payrollRuns.period, periodStart),
      lte(schema.payrollRuns.period, periodEnd),
    ))
  const payrollCosts = Number(payrollRows[0]?.total || 0)

  // Operating expenses: sum of approved expense reports
  const expenseRows = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.expenseReports.totalAmount}), 0)`
  }).from(schema.expenseReports)
    .where(and(
      eq(schema.expenseReports.orgId, orgId),
      eq(schema.expenseReports.status, 'approved'),
      sql`${schema.expenseReports.submittedAt} >= ${periodStart}::timestamp`,
      sql`${schema.expenseReports.submittedAt} <= ${periodEnd}::timestamp`,
    ))
  const operatingExpenses = Number(expenseRows[0]?.total || 0)

  // Revenue: sum of paid invoices (incoming)
  const invoiceRows = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.invoices.amount}), 0)`
  }).from(schema.invoices)
    .where(and(
      eq(schema.invoices.orgId, orgId),
      eq(schema.invoices.status, 'paid'),
      gte(schema.invoices.issuedDate, periodStart),
      lte(schema.invoices.issuedDate, periodEnd),
    ))
  const revenue = Number(invoiceRows[0]?.total || 0)

  // Headcount: active employees
  const headcountRows = await db.select({
    count: sql<number>`COUNT(*)`
  }).from(schema.employees)
    .where(and(
      eq(schema.employees.orgId, orgId),
      eq(schema.employees.isActive, true),
    ))
  const headcount = Number(headcountRows[0]?.count || 0)

  return { revenue, payrollCosts, operatingExpenses, otherIncome: 0, headcount }
}

// ---- Consolidation report generation ----

export async function eliminateIntercompanyTransactions(groupId: string, periodStart: string, periodEnd: string) {
  // Mark all confirmed IC transactions in the period as eliminated
  const txns = await db.select().from(schema.intercompanyTransactions)
    .where(and(
      eq(schema.intercompanyTransactions.groupId, groupId),
      eq(schema.intercompanyTransactions.status, 'confirmed'),
      gte(schema.intercompanyTransactions.date, periodStart),
      lte(schema.intercompanyTransactions.date, periodEnd),
    ))

  for (const txn of txns) {
    await db.update(schema.intercompanyTransactions)
      .set({ status: 'eliminated' })
      .where(eq(schema.intercompanyTransactions.id, txn.id))
  }
  return txns
}

export async function generateConsolidatedReport(
  groupId: string,
  reportType: string,
  periodStart: string,
  periodEnd: string,
  generatedBy?: string,
): Promise<ConsolidatedReport> {
  const group = await getEntityGroup(groupId)
  if (!group) throw new Error('Entity group not found')

  const members = await listGroupMembers(groupId)
  if (members.length === 0) throw new Error('No active members in group')

  const consolidationCurrency = group.consolidationCurrency
  const isBalanceSheet = reportType === 'balance_sheet'
  const rateType = isBalanceSheet ? 'closing' : 'average'

  // Collect FX rates
  const fxRatesUsed: Record<string, number> = {}

  // Gather financials for each entity
  const entityBreakdown: EntityFinancials[] = []
  for (const member of members) {
    const financials = await getEntityFinancials(member.orgId, periodStart, periodEnd)
    const fxRate = await getFxRate(groupId, member.localCurrency, consolidationCurrency, rateType, periodEnd)
    const rateKey = `${member.localCurrency}/${consolidationCurrency}`
    fxRatesUsed[rateKey] = fxRate

    // Apply FX conversion
    const converted: EntityFinancials = {
      orgId: member.orgId,
      entityName: member.entityName,
      localCurrency: member.localCurrency,
      ownershipPercent: member.ownershipPercent,
      consolidationMethod: member.consolidationMethod,
      revenue: Math.round(financials.revenue * fxRate),
      payrollCosts: Math.round(financials.payrollCosts * fxRate),
      operatingExpenses: Math.round(financials.operatingExpenses * fxRate),
      otherIncome: Math.round(financials.otherIncome * fxRate),
      headcount: financials.headcount,
    }

    // Apply ownership percentage for proportional/equity methods
    if (member.consolidationMethod === 'proportional' || member.consolidationMethod === 'equity') {
      const factor = member.ownershipPercent / 100
      converted.revenue = Math.round(converted.revenue * factor)
      converted.payrollCosts = Math.round(converted.payrollCosts * factor)
      converted.operatingExpenses = Math.round(converted.operatingExpenses * factor)
      converted.otherIncome = Math.round(converted.otherIncome * factor)
    }

    entityBreakdown.push(converted)
  }

  // IC eliminations
  const icTxns = await listIntercompanyTransactions(groupId, periodStart, periodEnd)
  const confirmedOrEliminated = icTxns.filter(t => t.status === 'confirmed' || t.status === 'eliminated')
  const eliminationEntries: EliminationEntry[] = []
  let totalEliminations = 0

  for (const txn of confirmedOrEliminated) {
    const fromMember = members.find(m => m.orgId === txn.fromOrgId)
    const toMember = members.find(m => m.orgId === txn.toOrgId)
    const fxRate = await getFxRate(groupId, txn.currency, consolidationCurrency, rateType, periodEnd)
    const convertedAmount = Math.round(txn.amount * fxRate)
    totalEliminations += convertedAmount

    eliminationEntries.push({
      description: txn.description,
      debit: convertedAmount,
      credit: convertedAmount,
      fromEntity: fromMember?.entityName || txn.fromOrgId,
      toEntity: toMember?.entityName || txn.toOrgId,
      originalAmount: txn.amount,
      originalCurrency: txn.currency,
    })
  }

  // Build consolidated line items
  const revenueItem: ConsolidatedLineItem = {
    label: 'Revenue',
    entities: {},
    eliminations: 0,
    consolidated: 0,
  }
  const payrollItem: ConsolidatedLineItem = {
    label: 'Payroll Costs',
    entities: {},
    eliminations: 0,
    consolidated: 0,
  }
  const opexItem: ConsolidatedLineItem = {
    label: 'Operating Expenses',
    entities: {},
    eliminations: 0,
    consolidated: 0,
  }
  const icElimItem: ConsolidatedLineItem = {
    label: 'Intercompany Eliminations',
    entities: {},
    eliminations: -totalEliminations,
    consolidated: -totalEliminations,
  }

  let totalRevenue = 0
  let totalPayroll = 0
  let totalOpex = 0
  let totalHeadcount = 0

  for (const ef of entityBreakdown) {
    revenueItem.entities[ef.orgId] = ef.revenue
    payrollItem.entities[ef.orgId] = ef.payrollCosts
    opexItem.entities[ef.orgId] = ef.operatingExpenses
    totalRevenue += ef.revenue
    totalPayroll += ef.payrollCosts
    totalOpex += ef.operatingExpenses
    totalHeadcount += ef.headcount
  }

  revenueItem.consolidated = totalRevenue
  payrollItem.consolidated = totalPayroll
  opexItem.consolidated = totalOpex

  const netIncome = totalRevenue - totalPayroll - totalOpex - totalEliminations

  const netIncomeItem: ConsolidatedLineItem = {
    label: 'Net Income',
    entities: {},
    eliminations: -totalEliminations,
    consolidated: netIncome,
  }
  for (const ef of entityBreakdown) {
    netIncomeItem.entities[ef.orgId] = ef.revenue - ef.payrollCosts - ef.operatingExpenses
  }

  const lineItems = [revenueItem, payrollItem, opexItem, icElimItem, netIncomeItem]

  const report: ConsolidatedReport = {
    groupId,
    groupName: group.name,
    reportType,
    periodStart,
    periodEnd,
    consolidationCurrency,
    lineItems,
    eliminationEntries,
    fxRatesUsed,
    entityBreakdown,
    totals: {
      revenue: totalRevenue,
      payrollCosts: totalPayroll,
      operatingExpenses: totalOpex,
      intercompanyEliminations: totalEliminations,
      netIncome,
      headcount: totalHeadcount,
    },
  }

  // Persist the report
  const [saved] = await db.insert(schema.consolidationReports).values({
    groupId,
    reportType,
    periodStart,
    periodEnd,
    status: 'draft',
    reportData: JSON.stringify(report),
    eliminationEntries: JSON.stringify(eliminationEntries),
    fxRates: JSON.stringify(fxRatesUsed),
    generatedBy: generatedBy || null,
  }).returning()

  return { ...report, ...({ id: saved.id } as any) }
}

// ---- Summary / Dashboard ----

export async function getConsolidationSummary(groupId: string) {
  const group = await getEntityGroup(groupId)
  if (!group) return null

  const members = await listGroupMembers(groupId)
  const currencies = [...new Set(members.map(m => m.localCurrency))]
  const countries = [...new Set(members.map(m => m.country))]

  // Get total headcount across all member orgs
  let totalHeadcount = 0
  for (const member of members) {
    const rows = await db.select({ count: sql<number>`COUNT(*)` })
      .from(schema.employees)
      .where(and(
        eq(schema.employees.orgId, member.orgId),
        eq(schema.employees.isActive, true),
      ))
    totalHeadcount += Number(rows[0]?.count || 0)
  }

  // Count IC transactions
  const icRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.intercompanyTransactions)
    .where(eq(schema.intercompanyTransactions.groupId, groupId))
  const icCount = Number(icRows[0]?.count || 0)

  // Pending IC transactions
  const pendingRows = await db.select({ count: sql<number>`COUNT(*)` })
    .from(schema.intercompanyTransactions)
    .where(and(
      eq(schema.intercompanyTransactions.groupId, groupId),
      eq(schema.intercompanyTransactions.status, 'pending'),
    ))
  const pendingIcCount = Number(pendingRows[0]?.count || 0)

  return {
    group,
    totalEntities: members.length,
    currencies,
    countries,
    totalHeadcount,
    intercompanyTransactionCount: icCount,
    pendingConfirmations: pendingIcCount,
    members,
  }
}

// ---- Trial Balance ----

export async function getTrialBalance(groupId: string, periodStart: string, periodEnd: string) {
  const group = await getEntityGroup(groupId)
  if (!group) throw new Error('Entity group not found')

  const members = await listGroupMembers(groupId)
  const consolidationCurrency = group.consolidationCurrency

  const accounts: Record<string, { debit: number; credit: number }> = {
    'Revenue': { debit: 0, credit: 0 },
    'Payroll Costs': { debit: 0, credit: 0 },
    'Operating Expenses': { debit: 0, credit: 0 },
    'Intercompany Receivables': { debit: 0, credit: 0 },
    'Intercompany Payables': { debit: 0, credit: 0 },
  }

  for (const member of members) {
    const financials = await getEntityFinancials(member.orgId, periodStart, periodEnd)
    const fxRate = await getFxRate(groupId, member.localCurrency, consolidationCurrency, 'closing', periodEnd)
    const factor = (member.consolidationMethod === 'full') ? 1 : member.ownershipPercent / 100

    accounts['Revenue'].credit += Math.round(financials.revenue * fxRate * factor)
    accounts['Payroll Costs'].debit += Math.round(financials.payrollCosts * fxRate * factor)
    accounts['Operating Expenses'].debit += Math.round(financials.operatingExpenses * fxRate * factor)
  }

  // IC balances
  const icTxns = await listIntercompanyTransactions(groupId, periodStart, periodEnd)
  for (const txn of icTxns.filter(t => t.status === 'confirmed')) {
    const fxRate = await getFxRate(groupId, txn.currency, consolidationCurrency, 'closing', periodEnd)
    const convertedAmount = Math.round(txn.amount * fxRate)
    accounts['Intercompany Receivables'].debit += convertedAmount
    accounts['Intercompany Payables'].credit += convertedAmount
  }

  return {
    groupId,
    periodStart,
    periodEnd,
    consolidationCurrency,
    accounts: Object.entries(accounts).map(([name, balances]) => ({
      account: name,
      debit: balances.debit,
      credit: balances.credit,
      net: balances.debit - balances.credit,
    })),
  }
}

// ---- Report management ----

export async function listConsolidationReports(groupId: string) {
  return db.select().from(schema.consolidationReports)
    .where(eq(schema.consolidationReports.groupId, groupId))
    .orderBy(sql`${schema.consolidationReports.createdAt} DESC`)
}

export async function getConsolidationReport(reportId: string) {
  const [report] = await db.select().from(schema.consolidationReports)
    .where(eq(schema.consolidationReports.id, reportId))
  return report || null
}

export async function updateReportStatus(reportId: string, status: string, approvedBy?: string) {
  const updates: Record<string, unknown> = { status, updatedAt: new Date() }
  if (approvedBy) updates.approvedBy = approvedBy
  const [report] = await db.update(schema.consolidationReports)
    .set(updates)
    .where(eq(schema.consolidationReports.id, reportId))
    .returning()
  return report
}
