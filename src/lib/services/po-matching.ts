/**
 * Three-Way PO Matching Service
 *
 * Compares Purchase Order ↔ Goods Receipt ↔ Invoice to verify
 * quantity and price alignment. Auto-approves within tolerance,
 * flags exceptions for manual review.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

export interface CreateGoodsReceiptInput {
  orgId: string
  poId: string
  receivedBy: string
  receivedDate: string
  notes?: string
  lines: Array<{
    poLineId: string
    receivedQuantity: number
    acceptedQuantity: number
    rejectedQuantity?: number
    notes?: string
  }>
}

export interface ThreeWayMatchInput {
  orgId: string
  poId: string
  receiptId: string
  invoiceId: string
  toleranceThreshold?: number // percentage, default 2
}

export interface MatchResult {
  matchStatus: 'full_match' | 'partial_match' | 'mismatch' | 'exception'
  priceVariance: number
  quantityVariance: number
  variancePercentage: number
  autoApproved: boolean
}

export interface MatchDashboard {
  totalMatches: number
  fullMatches: number
  partialMatches: number
  exceptions: number
  unmatchedInvoices: number
  matchRate: number
  exceptionsPending: number
}

export interface MatchSuggestion {
  poId: string
  poNumber: string
  vendorId: string
  totalAmount: number
  receiptId: string | null
  receiptNumber: string | null
  confidence: number
}

// ============================================================
// GOODS RECEIPT NUMBER GENERATION
// ============================================================

async function generateReceiptNumber(orgId: string): Promise<string> {
  const [latest] = await db
    .select({ receiptNumber: schema.goodsReceipts.receiptNumber })
    .from(schema.goodsReceipts)
    .where(eq(schema.goodsReceipts.orgId, orgId))
    .orderBy(desc(schema.goodsReceipts.createdAt))
    .limit(1)

  let nextSeq = 1
  if (latest?.receiptNumber) {
    const parts = latest.receiptNumber.split('-')
    const num = parseInt(parts[parts.length - 1], 10)
    if (!isNaN(num)) nextSeq = num + 1
  }

  const year = new Date().getFullYear()
  return `GR-${year}-${String(nextSeq).padStart(6, '0')}`
}

// ============================================================
// CREATE GOODS RECEIPT
// ============================================================

export async function createGoodsReceipt(input: CreateGoodsReceiptInput) {
  const { orgId, poId, receivedBy, receivedDate, notes, lines } = input

  // Verify PO exists and is in receivable state
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) throw new Error('Purchase order not found')
  if (!['approved', 'sent_to_vendor', 'partially_received'].includes(po.status)) {
    throw new Error(`Cannot receive against PO in status: ${po.status}`)
  }

  const receiptNumber = await generateReceiptNumber(orgId)

  // Create the receipt
  const [receipt] = await db
    .insert(schema.goodsReceipts)
    .values({
      orgId,
      poId,
      receiptNumber,
      receivedBy,
      receivedDate,
      status: 'pending',
      notes: notes ?? null,
    })
    .returning()

  // Create receipt lines and update PO item received quantities
  for (const line of lines) {
    await db.insert(schema.goodsReceiptLines).values({
      receiptId: receipt.id,
      poLineId: line.poLineId,
      receivedQuantity: line.receivedQuantity,
      acceptedQuantity: line.acceptedQuantity,
      rejectedQuantity: line.rejectedQuantity ?? 0,
      notes: line.notes ?? null,
    })

    // Update PO line received quantity
    await db
      .update(schema.purchaseOrderItems)
      .set({
        receivedQuantity: sql`${schema.purchaseOrderItems.receivedQuantity} + ${line.acceptedQuantity}`,
      })
      .where(eq(schema.purchaseOrderItems.id, line.poLineId))
  }

  // Check if all PO items are fully received
  const poItems = await db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.poId, poId))

  const allFullyReceived = poItems.every(item => item.receivedQuantity >= item.quantity)
  const anyReceived = poItems.some(item => item.receivedQuantity > 0)

  if (allFullyReceived) {
    await db.update(schema.purchaseOrders).set({ status: 'received' }).where(eq(schema.purchaseOrders.id, poId))
  } else if (anyReceived) {
    await db.update(schema.purchaseOrders).set({ status: 'partially_received' }).where(eq(schema.purchaseOrders.id, poId))
  }

  return receipt
}

// ============================================================
// THREE-WAY MATCH
// ============================================================

export async function performThreeWayMatch(input: ThreeWayMatchInput): Promise<MatchResult & { id: string }> {
  const { orgId, poId, receiptId, invoiceId, toleranceThreshold = 2 } = input

  // 1. Fetch PO with lines
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))
  if (!po) throw new Error('Purchase order not found')

  const poLines = await db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.poId, poId))

  // 2. Fetch receipt with lines
  const [receipt] = await db
    .select()
    .from(schema.goodsReceipts)
    .where(and(eq(schema.goodsReceipts.id, receiptId), eq(schema.goodsReceipts.orgId, orgId)))
  if (!receipt) throw new Error('Goods receipt not found')

  const receiptLines = await db
    .select()
    .from(schema.goodsReceiptLines)
    .where(eq(schema.goodsReceiptLines.receiptId, receiptId))

  // 3. Fetch invoice
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, orgId)))
  if (!invoice) throw new Error('Invoice not found')

  // 4. Compare quantities: PO ordered vs receipt accepted vs invoice
  const poTotalQty = poLines.reduce((s, l) => s + l.quantity, 0)
  const receiptTotalQty = receiptLines.reduce((s, l) => s + l.acceptedQuantity, 0)
  const quantityVariance = Math.abs(poTotalQty - receiptTotalQty)

  // 5. Compare prices: PO total vs invoice total
  const poTotal = po.totalAmount
  const invoiceTotal = invoice.amount
  const priceVariance = Math.abs(poTotal - invoiceTotal)

  // 6. Calculate variance percentage
  const variancePercentage = poTotal > 0 ? (priceVariance / poTotal) * 100 : 0

  // 7. Determine match status
  let matchStatus: MatchResult['matchStatus']
  let autoApproved = false

  if (priceVariance === 0 && quantityVariance === 0) {
    matchStatus = 'full_match'
    autoApproved = true
  } else if (variancePercentage <= toleranceThreshold && quantityVariance === 0) {
    matchStatus = 'full_match'
    autoApproved = true
  } else if (variancePercentage <= toleranceThreshold * 2) {
    matchStatus = 'partial_match'
  } else if (quantityVariance > 0 && variancePercentage <= toleranceThreshold) {
    matchStatus = 'partial_match'
  } else {
    matchStatus = 'exception'
  }

  // 8. Store the match result
  const [match] = await db
    .insert(schema.threeWayMatches)
    .values({
      orgId,
      poId,
      receiptId,
      invoiceId,
      matchStatus,
      priceVariance,
      quantityVariance,
      variancePercentage,
      toleranceThreshold,
      autoApproved,
    })
    .returning()

  return {
    id: match.id,
    matchStatus,
    priceVariance,
    quantityVariance,
    variancePercentage,
    autoApproved,
  }
}

// ============================================================
// MATCHING SUGGESTIONS
// ============================================================

export async function getMatchingSuggestions(orgId: string, invoiceId: string): Promise<MatchSuggestion[]> {
  // Fetch the invoice
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, orgId)))
  if (!invoice) throw new Error('Invoice not found')

  if (!invoice.vendorId) return []

  // Find POs for the same vendor with similar amounts
  const pos = await db
    .select()
    .from(schema.purchaseOrders)
    .where(
      and(
        eq(schema.purchaseOrders.orgId, orgId),
        eq(schema.purchaseOrders.vendorId, invoice.vendorId!),
      ),
    )
    .orderBy(desc(schema.purchaseOrders.createdAt))
    .limit(20)

  const suggestions: MatchSuggestion[] = []

  for (const po of pos) {
    // Skip already-matched POs
    const existingMatches = await db
      .select()
      .from(schema.threeWayMatches)
      .where(and(eq(schema.threeWayMatches.poId, po.id), eq(schema.threeWayMatches.orgId, orgId)))

    if (existingMatches.length > 0) continue

    // Find any receipt for this PO
    const [latestReceipt] = await db
      .select()
      .from(schema.goodsReceipts)
      .where(and(eq(schema.goodsReceipts.poId, po.id), eq(schema.goodsReceipts.orgId, orgId)))
      .orderBy(desc(schema.goodsReceipts.createdAt))
      .limit(1)

    // Calculate confidence based on amount proximity
    const amountDiff = Math.abs(po.totalAmount - invoice.amount)
    const maxAmount = Math.max(po.totalAmount, invoice.amount)
    const confidence = maxAmount > 0 ? Math.max(0, 100 - (amountDiff / maxAmount) * 100) : 0

    if (confidence >= 50) {
      suggestions.push({
        poId: po.id,
        poNumber: po.poNumber,
        vendorId: po.vendorId,
        totalAmount: po.totalAmount,
        receiptId: latestReceipt?.id ?? null,
        receiptNumber: latestReceipt?.receiptNumber ?? null,
        confidence: Math.round(confidence * 100) / 100,
      })
    }
  }

  return suggestions.sort((a, b) => b.confidence - a.confidence)
}

// ============================================================
// MATCH DASHBOARD
// ============================================================

export async function getMatchDashboard(orgId: string): Promise<MatchDashboard> {
  const matches = await db
    .select()
    .from(schema.threeWayMatches)
    .where(eq(schema.threeWayMatches.orgId, orgId))

  const totalMatches = matches.length
  const fullMatches = matches.filter(m => m.matchStatus === 'full_match').length
  const partialMatches = matches.filter(m => m.matchStatus === 'partial_match').length
  const exceptions = matches.filter(m => m.matchStatus === 'exception').length
  const exceptionsPending = matches.filter(m => m.matchStatus === 'exception' && !m.approvedBy).length

  // Count unmatched invoices (invoices that don't have a match record)
  const matchedInvoiceIds = new Set(matches.map(m => m.invoiceId))
  const allInvoices = await db
    .select({ id: schema.invoices.id })
    .from(schema.invoices)
    .where(eq(schema.invoices.orgId, orgId))

  const unmatchedInvoices = allInvoices.filter(inv => !matchedInvoiceIds.has(inv.id)).length
  const matchRate = allInvoices.length > 0 ? (matchedInvoiceIds.size / allInvoices.length) * 100 : 0

  return {
    totalMatches,
    fullMatches,
    partialMatches,
    exceptions,
    unmatchedInvoices,
    matchRate: Math.round(matchRate * 100) / 100,
    exceptionsPending,
  }
}

// ============================================================
// APPROVE / REJECT EXCEPTION
// ============================================================

export async function approveMatchException(matchId: string, orgId: string, approvedBy: string, notes?: string) {
  const [match] = await db
    .select()
    .from(schema.threeWayMatches)
    .where(and(eq(schema.threeWayMatches.id, matchId), eq(schema.threeWayMatches.orgId, orgId)))

  if (!match) throw new Error('Match not found')
  if (match.matchStatus !== 'exception' && match.matchStatus !== 'partial_match') {
    throw new Error('Only exceptions and partial matches can be manually approved')
  }

  const [updated] = await db
    .update(schema.threeWayMatches)
    .set({
      matchStatus: 'full_match',
      approvedBy,
      autoApproved: false,
      notes: notes ?? null,
    })
    .where(eq(schema.threeWayMatches.id, matchId))
    .returning()

  return updated
}

export async function rejectMatchException(matchId: string, orgId: string, notes?: string) {
  const [match] = await db
    .select()
    .from(schema.threeWayMatches)
    .where(and(eq(schema.threeWayMatches.id, matchId), eq(schema.threeWayMatches.orgId, orgId)))

  if (!match) throw new Error('Match not found')

  const [updated] = await db
    .update(schema.threeWayMatches)
    .set({
      matchStatus: 'mismatch',
      notes: notes ?? null,
    })
    .where(eq(schema.threeWayMatches.id, matchId))
    .returning()

  return updated
}
