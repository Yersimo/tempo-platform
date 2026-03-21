import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Transfer Pricing Documentation Service
// OECD-compliant TP documentation: Master File, Local File, CbCR
// ---------------------------------------------------------------------------

export type PolicyInput = {
  name: string
  description?: string
  pricingMethod: string
  entityFrom: string
  entityTo: string
  transactionType: string
  markup?: number
  benchmarkRange?: string // JSON
  effectiveDate: string
  expiryDate?: string
  status?: string
}

export type TransactionInput = {
  policyId: string
  period: string
  amount: number // cents
  currency: string
  markupApplied?: number
  armLengthCompliant?: boolean
  notes?: string
}

export type ReportInput = {
  fiscalYear: string
  reportType: string
  status?: string
  content?: string
}

// ---- Policy CRUD ----

export async function createPolicy(orgId: string, input: PolicyInput) {
  const [policy] = await db.insert(schema.transferPricingPolicies).values({
    orgId,
    name: input.name,
    description: input.description || null,
    pricingMethod: input.pricingMethod,
    entityFrom: input.entityFrom,
    entityTo: input.entityTo,
    transactionType: input.transactionType,
    markup: input.markup ?? null,
    benchmarkRange: input.benchmarkRange || null,
    effectiveDate: input.effectiveDate,
    expiryDate: input.expiryDate || null,
    status: input.status || 'active',
  }).returning()
  return policy
}

export async function updatePolicy(policyId: string, input: Partial<PolicyInput>) {
  const updates: Record<string, unknown> = {}
  if (input.name !== undefined) updates.name = input.name
  if (input.description !== undefined) updates.description = input.description
  if (input.pricingMethod !== undefined) updates.pricingMethod = input.pricingMethod
  if (input.entityFrom !== undefined) updates.entityFrom = input.entityFrom
  if (input.entityTo !== undefined) updates.entityTo = input.entityTo
  if (input.transactionType !== undefined) updates.transactionType = input.transactionType
  if (input.markup !== undefined) updates.markup = input.markup
  if (input.benchmarkRange !== undefined) updates.benchmarkRange = input.benchmarkRange
  if (input.effectiveDate !== undefined) updates.effectiveDate = input.effectiveDate
  if (input.expiryDate !== undefined) updates.expiryDate = input.expiryDate
  if (input.status !== undefined) updates.status = input.status

  const [policy] = await db.update(schema.transferPricingPolicies)
    .set(updates)
    .where(eq(schema.transferPricingPolicies.id, policyId))
    .returning()
  return policy
}

export async function listPolicies(orgId: string) {
  return db.select().from(schema.transferPricingPolicies)
    .where(eq(schema.transferPricingPolicies.orgId, orgId))
}

export async function deletePolicy(policyId: string) {
  await db.delete(schema.transferPricingTransactions)
    .where(eq(schema.transferPricingTransactions.policyId, policyId))
  await db.delete(schema.transferPricingPolicies)
    .where(eq(schema.transferPricingPolicies.id, policyId))
}

// ---- Transaction CRUD ----

export async function createTransaction(orgId: string, input: TransactionInput) {
  const [txn] = await db.insert(schema.transferPricingTransactions).values({
    orgId,
    policyId: input.policyId,
    period: input.period,
    amount: input.amount,
    currency: input.currency,
    markupApplied: input.markupApplied ?? null,
    armLengthCompliant: input.armLengthCompliant ?? true,
    notes: input.notes || null,
  }).returning()
  return txn
}

export async function listTransactions(orgId: string, policyId?: string) {
  if (policyId) {
    return db.select().from(schema.transferPricingTransactions)
      .where(and(
        eq(schema.transferPricingTransactions.orgId, orgId),
        eq(schema.transferPricingTransactions.policyId, policyId),
      ))
  }
  return db.select().from(schema.transferPricingTransactions)
    .where(eq(schema.transferPricingTransactions.orgId, orgId))
}

export async function deleteTransaction(txnId: string) {
  await db.delete(schema.transferPricingTransactions)
    .where(eq(schema.transferPricingTransactions.id, txnId))
}

// ---- Arm's Length Test ----

export async function performArmLengthTest(policyId: string) {
  const [policy] = await db.select().from(schema.transferPricingPolicies)
    .where(eq(schema.transferPricingPolicies.id, policyId))
  if (!policy) return null

  const benchmark = policy.benchmarkRange ? JSON.parse(policy.benchmarkRange) : null
  const actualMarkup = policy.markup ?? 0

  if (!benchmark) {
    return { policyId, compliant: true, reason: 'No benchmark range defined', actualMarkup, benchmark: null }
  }

  const low = benchmark.low ?? 0
  const high = benchmark.high ?? 100
  const median = benchmark.median ?? (low + high) / 2
  const compliant = actualMarkup >= low && actualMarkup <= high

  return {
    policyId,
    compliant,
    actualMarkup,
    benchmark: { low, median, high },
    deviation: compliant ? 0 : (actualMarkup < low ? actualMarkup - low : actualMarkup - high),
    reason: compliant
      ? `Markup of ${actualMarkup}% is within the arm's length range [${low}%-${high}%]`
      : `Markup of ${actualMarkup}% is outside the arm's length range [${low}%-${high}%]`,
  }
}

// ---- Report Generation ----

export async function generateMasterFile(orgId: string, fiscalYear: string) {
  const policies = await listPolicies(orgId)
  const transactions = await listTransactions(orgId)

  const yearTxns = transactions.filter(t => t.period.startsWith(fiscalYear))
  const totalVolume = yearTxns.reduce((sum, t) => sum + t.amount, 0)
  const entities = new Set([...policies.map(p => p.entityFrom), ...policies.map(p => p.entityTo)])
  const methods = [...new Set(policies.map(p => p.pricingMethod))]

  const content = JSON.stringify({
    type: 'master_file',
    fiscalYear,
    sections: {
      organizationalOverview: {
        entityCount: entities.size,
        entities: Array.from(entities),
        activePolicies: policies.filter(p => p.status === 'active').length,
      },
      transferPricingPolicies: {
        totalPolicies: policies.length,
        methodsUsed: methods,
        policyBreakdown: policies.map(p => ({
          name: p.name,
          entityFrom: p.entityFrom,
          entityTo: p.entityTo,
          method: p.pricingMethod,
          transactionType: p.transactionType,
          markup: p.markup,
        })),
      },
      financialAllocation: {
        totalIntercompanyVolume: totalVolume,
        transactionCount: yearTxns.length,
        byEntity: Array.from(entities).map(entity => ({
          entity,
          outbound: yearTxns.filter(t => {
            const pol = policies.find(p => p.id === t.policyId)
            return pol?.entityFrom === entity
          }).reduce((s, t) => s + t.amount, 0),
          inbound: yearTxns.filter(t => {
            const pol = policies.find(p => p.id === t.policyId)
            return pol?.entityTo === entity
          }).reduce((s, t) => s + t.amount, 0),
        })),
      },
    },
  })

  const [report] = await db.insert(schema.transferPricingReports).values({
    orgId,
    fiscalYear,
    reportType: 'master_file',
    status: 'draft',
    content,
    generatedAt: new Date(),
  }).returning()
  return report
}

export async function generateLocalFile(orgId: string, fiscalYear: string, entity: string) {
  const policies = await listPolicies(orgId)
  const transactions = await listTransactions(orgId)

  const entityPolicies = policies.filter(p => p.entityFrom === entity || p.entityTo === entity)
  const entityTxns = transactions.filter(t => {
    const pol = policies.find(p => p.id === t.policyId)
    return pol && (pol.entityFrom === entity || pol.entityTo === entity) && t.period.startsWith(fiscalYear)
  })

  const content = JSON.stringify({
    type: 'local_file',
    fiscalYear,
    entity,
    sections: {
      entityProfile: {
        name: entity,
        relatedPolicies: entityPolicies.length,
        transactionVolume: entityTxns.reduce((s, t) => s + t.amount, 0),
      },
      controlledTransactions: entityTxns.map(t => {
        const pol = policies.find(p => p.id === t.policyId)
        return {
          period: t.period,
          amount: t.amount,
          currency: t.currency,
          counterparty: pol?.entityFrom === entity ? pol.entityTo : pol?.entityFrom,
          method: pol?.pricingMethod,
          markupApplied: t.markupApplied,
          armLengthCompliant: t.armLengthCompliant,
        }
      }),
      comparablesAnalysis: entityPolicies.map(p => ({
        policy: p.name,
        method: p.pricingMethod,
        benchmark: p.benchmarkRange ? JSON.parse(p.benchmarkRange) : null,
        actualMarkup: p.markup,
      })),
    },
  })

  const [report] = await db.insert(schema.transferPricingReports).values({
    orgId,
    fiscalYear,
    reportType: 'local_file',
    status: 'draft',
    content,
    generatedAt: new Date(),
  }).returning()
  return report
}

export async function generateCbCR(orgId: string, fiscalYear: string) {
  const policies = await listPolicies(orgId)
  const transactions = await listTransactions(orgId)
  const yearTxns = transactions.filter(t => t.period.startsWith(fiscalYear))

  // Group by jurisdiction (entity) for CbCR
  const entities = [...new Set([...policies.map(p => p.entityFrom), ...policies.map(p => p.entityTo)])]

  const jurisdictionData = entities.map(entity => {
    const outbound = yearTxns.filter(t => {
      const pol = policies.find(p => p.id === t.policyId)
      return pol?.entityFrom === entity
    })
    const inbound = yearTxns.filter(t => {
      const pol = policies.find(p => p.id === t.policyId)
      return pol?.entityTo === entity
    })

    return {
      jurisdiction: entity,
      revenue: inbound.reduce((s, t) => s + t.amount, 0),
      relatedPartyRevenue: inbound.reduce((s, t) => s + t.amount, 0),
      unrelatedPartyRevenue: 0,
      profitBeforeTax: inbound.reduce((s, t) => s + t.amount, 0) - outbound.reduce((s, t) => s + t.amount, 0),
      taxPaid: 0,
      taxAccrued: 0,
      statedCapital: 0,
      accumulatedEarnings: 0,
      numberOfEmployees: 0,
      tangibleAssets: 0,
    }
  })

  const content = JSON.stringify({
    type: 'cbcr',
    fiscalYear,
    jurisdictions: jurisdictionData,
    summary: {
      totalJurisdictions: entities.length,
      totalRevenue: jurisdictionData.reduce((s, j) => s + j.revenue, 0),
      totalProfit: jurisdictionData.reduce((s, j) => s + j.profitBeforeTax, 0),
    },
  })

  const [report] = await db.insert(schema.transferPricingReports).values({
    orgId,
    fiscalYear,
    reportType: 'cbcr',
    status: 'draft',
    content,
    generatedAt: new Date(),
  }).returning()
  return report
}

// ---- Reports CRUD ----

export async function listReports(orgId: string) {
  return db.select().from(schema.transferPricingReports)
    .where(eq(schema.transferPricingReports.orgId, orgId))
}

export async function getReport(reportId: string) {
  const [report] = await db.select().from(schema.transferPricingReports)
    .where(eq(schema.transferPricingReports.id, reportId))
  return report || null
}

export async function updateReportStatus(reportId: string, status: string) {
  const [report] = await db.update(schema.transferPricingReports)
    .set({ status })
    .where(eq(schema.transferPricingReports.id, reportId))
    .returning()
  return report
}

export async function deleteReport(reportId: string) {
  await db.delete(schema.transferPricingReports)
    .where(eq(schema.transferPricingReports.id, reportId))
}

// ---- Compliance Summary ----

export async function getComplianceSummary(orgId: string) {
  const policies = await listPolicies(orgId)
  const results = await Promise.all(policies.map(p => performArmLengthTest(p.id)))

  const compliant = results.filter(r => r?.compliant).length
  const nonCompliant = results.filter(r => r && !r.compliant).length
  const noData = results.filter(r => !r).length

  return {
    totalPolicies: policies.length,
    compliant,
    nonCompliant,
    noData,
    complianceRate: policies.length > 0 ? Math.round((compliant / policies.length) * 100) : 100,
    details: results.filter(Boolean),
  }
}
