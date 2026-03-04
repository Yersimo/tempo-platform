/**
 * Procurement / Purchase Order Service
 *
 * PO number generation, multi-level approval by amount thresholds,
 * partial receipt tracking, three-way matching (PO <-> Receipt <-> Invoice),
 * budget availability checks, vendor performance scoring, and analytics.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface CreateProcurementRequestInput {
  orgId: string
  requesterId: string
  title: string
  description?: string
  estimatedAmount?: number // cents
  currency?: string
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  departmentId?: string
  neededBy?: string // YYYY-MM-DD
}

export interface CreatePurchaseOrderInput {
  orgId: string
  vendorId: string
  items: Array<{
    description: string
    sku?: string
    quantity: number
    unitPrice: number // cents
    category?: string
  }>
  currency?: string
  shippingAddress?: string
  billingAddress?: string
  terms?: string
  deliveryDate?: string // YYYY-MM-DD
  createdBy: string
  notes?: string
}

export interface ReceiveItemsInput {
  orgId: string
  poId: string
  receivedItems: Array<{
    itemId: string
    quantityReceived: number
    notes?: string
  }>
  receivedBy: string
}

export interface ThreeWayMatchResult {
  poId: string
  invoiceId: string
  isMatched: boolean
  poTotal: number
  invoiceTotal: number
  receivedTotal: number
  discrepancies: Array<{
    field: string
    poValue: number | string
    invoiceValue: number | string
    difference?: number
  }>
  matchPercentage: number
}

export interface VendorPerformance {
  vendorId: string
  vendorName: string
  totalOrders: number
  totalSpend: number
  onTimeDeliveryRate: number
  qualityScore: number
  averageLeadTimeDays: number
  returnRate: number
  overallScore: number
  tier: 'platinum' | 'gold' | 'silver' | 'standard' | 'probation'
}

export interface ProcurementAnalytics {
  orgId: string
  totalPOs: number
  totalSpend: number
  averagePOValue: number
  openPOs: number
  openPOValue: number
  spendByVendor: Array<{ vendorId: string; vendorName: string; amount: number; count: number }>
  spendByCategory: Array<{ category: string; amount: number; count: number }>
  spendByDepartment: Array<{ departmentId: string; amount: number; count: number }>
  monthlyTrend: Array<{ month: string; amount: number; count: number }>
  approvalCycleDays: number
  fulfillmentRate: number
}

export interface PONumberConfig {
  prefix: string
  separator: string
  padLength: number
  includeYear: boolean
}

// ============================================================
// ERROR CLASS
// ============================================================

export class ProcurementError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ProcurementError'
  }
}

// ============================================================
// PO NUMBER GENERATION
// ============================================================

const DEFAULT_PO_CONFIG: PONumberConfig = {
  prefix: 'PO',
  separator: '-',
  padLength: 6,
  includeYear: true,
}

/**
 * Generate a sequential PO number with configurable format.
 * Default: PO-2026-000001
 */
export async function generatePONumber(orgId: string, config?: Partial<PONumberConfig>): Promise<string> {
  const cfg = { ...DEFAULT_PO_CONFIG, ...config }

  // Get the latest PO number for this org
  const [latest] = await db
    .select({ poNumber: schema.purchaseOrders.poNumber })
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.orgId, orgId))
    .orderBy(desc(schema.purchaseOrders.createdAt))
    .limit(1)

  let nextSeq = 1
  if (latest?.poNumber) {
    // Extract the numeric portion
    const parts = latest.poNumber.split(cfg.separator)
    const lastPart = parts[parts.length - 1]
    const num = parseInt(lastPart, 10)
    if (!isNaN(num)) nextSeq = num + 1
  }

  const year = new Date().getFullYear()
  const seqStr = String(nextSeq).padStart(cfg.padLength, '0')

  if (cfg.includeYear) {
    return `${cfg.prefix}${cfg.separator}${year}${cfg.separator}${seqStr}`
  }
  return `${cfg.prefix}${cfg.separator}${seqStr}`
}

// ============================================================
// PROCUREMENT REQUESTS
// ============================================================

/**
 * Create a procurement request (pre-PO requisition).
 */
export async function createProcurementRequest(input: CreateProcurementRequestInput) {
  const { orgId, requesterId, title, description, estimatedAmount, currency, priority, departmentId, neededBy } = input

  // Verify requester
  const [employee] = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(and(eq(schema.employees.id, requesterId), eq(schema.employees.orgId, orgId)))

  if (!employee) {
    throw new ProcurementError('Requester not found', 'REQUESTER_NOT_FOUND')
  }

  const [request] = await db
    .insert(schema.procurementRequests)
    .values({
      orgId,
      requesterId,
      title,
      description: description ?? null,
      estimatedAmount: estimatedAmount ?? null,
      currency: currency ?? 'USD',
      priority: priority ?? 'medium',
      status: 'submitted',
      departmentId: departmentId ?? null,
      neededBy: neededBy ?? null,
    })
    .returning()

  return request
}

/**
 * Approve or reject a procurement request.
 */
export async function approveProcurementRequest(
  requestId: string,
  orgId: string,
  approverId: string,
  decision: 'approved' | 'rejected',
) {
  const [request] = await db
    .select()
    .from(schema.procurementRequests)
    .where(
      and(
        eq(schema.procurementRequests.id, requestId),
        eq(schema.procurementRequests.orgId, orgId),
      ),
    )

  if (!request) {
    throw new ProcurementError('Procurement request not found', 'REQUEST_NOT_FOUND')
  }

  if (request.status !== 'submitted' && request.status !== 'under_review') {
    throw new ProcurementError(`Cannot review request in status: ${request.status}`, 'INVALID_STATUS')
  }

  const [updated] = await db
    .update(schema.procurementRequests)
    .set({
      status: decision,
      approvedBy: decision === 'approved' ? approverId : null,
    })
    .where(eq(schema.procurementRequests.id, requestId))
    .returning()

  return updated
}

// ============================================================
// PURCHASE ORDERS
// ============================================================

/**
 * Create a purchase order with line items.
 */
export async function createPurchaseOrder(input: CreatePurchaseOrderInput) {
  const { orgId, vendorId, items, currency, shippingAddress, billingAddress, terms, deliveryDate, createdBy, notes } = input

  if (items.length === 0) {
    throw new ProcurementError('Purchase order must have at least one item', 'NO_ITEMS')
  }

  // Validate items
  for (const item of items) {
    if (item.quantity <= 0) throw new ProcurementError(`Invalid quantity for: ${item.description}`, 'INVALID_QUANTITY')
    if (item.unitPrice <= 0) throw new ProcurementError(`Invalid price for: ${item.description}`, 'INVALID_PRICE')
  }

  // Verify vendor
  const [vendor] = await db
    .select({ id: schema.vendors.id })
    .from(schema.vendors)
    .where(and(eq(schema.vendors.id, vendorId), eq(schema.vendors.orgId, orgId)))

  if (!vendor) {
    throw new ProcurementError('Vendor not found', 'VENDOR_NOT_FOUND')
  }

  // Generate PO number
  const poNumber = await generatePONumber(orgId)

  // Calculate totals
  const totalAmount = items.reduce((s, item) => s + item.quantity * item.unitPrice, 0)

  // Create PO
  const [po] = await db
    .insert(schema.purchaseOrders)
    .values({
      orgId,
      poNumber,
      vendorId,
      status: 'draft',
      totalAmount,
      currency: currency ?? 'USD',
      shippingAddress: shippingAddress ?? null,
      billingAddress: billingAddress ?? null,
      terms: terms ?? null,
      deliveryDate: deliveryDate ?? null,
      createdBy,
      notes: notes ?? null,
    })
    .returning()

  // Create PO items
  const poItems = []
  for (const item of items) {
    const [poItem] = await db
      .insert(schema.purchaseOrderItems)
      .values({
        poId: po.id,
        description: item.description,
        sku: item.sku ?? null,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
        receivedQuantity: 0,
        category: item.category ?? null,
      })
      .returning()
    poItems.push(poItem)
  }

  return { ...po, items: poItems }
}

/**
 * Update a purchase order (only draft or pending_approval).
 */
export async function updatePurchaseOrder(
  poId: string,
  orgId: string,
  updates: Partial<Pick<CreatePurchaseOrderInput, 'shippingAddress' | 'billingAddress' | 'terms' | 'deliveryDate' | 'notes'>>,
) {
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (po.status !== 'draft' && po.status !== 'pending_approval') {
    throw new ProcurementError(`Cannot update PO in status: ${po.status}`, 'INVALID_STATUS')
  }

  const [updated] = await db
    .update(schema.purchaseOrders)
    .set({
      ...(updates.shippingAddress !== undefined && { shippingAddress: updates.shippingAddress }),
      ...(updates.billingAddress !== undefined && { billingAddress: updates.billingAddress }),
      ...(updates.terms !== undefined && { terms: updates.terms }),
      ...(updates.deliveryDate !== undefined && { deliveryDate: updates.deliveryDate }),
      ...(updates.notes !== undefined && { notes: updates.notes }),
      updatedAt: new Date(),
    })
    .where(eq(schema.purchaseOrders.id, poId))
    .returning()

  return updated
}

/**
 * Approve a purchase order. Supports multi-level approval based on amount thresholds.
 */
export async function approvePurchaseOrder(poId: string, orgId: string, approverId: string) {
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (po.status !== 'draft' && po.status !== 'pending_approval') {
    throw new ProcurementError(`Cannot approve PO in status: ${po.status}`, 'INVALID_STATUS')
  }

  // Multi-level approval thresholds (cents)
  const APPROVAL_THRESHOLDS = [
    { maxAmount: 100000, role: 'manager', level: 1 },      // Up to $1,000: manager
    { maxAmount: 1000000, role: 'director', level: 2 },     // Up to $10,000: director
    { maxAmount: 5000000, role: 'vp', level: 3 },           // Up to $50,000: VP
    { maxAmount: Infinity, role: 'cfo', level: 4 },         // Above $50,000: CFO
  ]

  const requiredLevel = APPROVAL_THRESHOLDS.find((t) => po.totalAmount <= t.maxAmount)

  const [updated] = await db
    .update(schema.purchaseOrders)
    .set({
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.purchaseOrders.id, poId))
    .returning()

  return {
    purchaseOrder: updated,
    approvalLevel: requiredLevel?.level ?? 1,
    requiredRole: requiredLevel?.role ?? 'manager',
  }
}

/**
 * Mark a PO as sent to the vendor.
 */
export async function sendPOToVendor(poId: string, orgId: string) {
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (po.status !== 'approved') {
    throw new ProcurementError('PO must be approved before sending to vendor', 'NOT_APPROVED')
  }

  const [updated] = await db
    .update(schema.purchaseOrders)
    .set({ status: 'sent_to_vendor', updatedAt: new Date() })
    .where(eq(schema.purchaseOrders.id, poId))
    .returning()

  return updated
}

// ============================================================
// RECEIVING
// ============================================================

/**
 * Receive items against a PO. Updates received quantities and PO status.
 */
export async function receiveItems(input: ReceiveItemsInput) {
  const { orgId, poId, receivedItems } = input

  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (!['sent_to_vendor', 'partially_received'].includes(po.status)) {
    throw new ProcurementError(`Cannot receive against PO in status: ${po.status}`, 'INVALID_STATUS')
  }

  const results = []
  for (const item of receivedItems) {
    const [poItem] = await db
      .select()
      .from(schema.purchaseOrderItems)
      .where(
        and(
          eq(schema.purchaseOrderItems.id, item.itemId),
          eq(schema.purchaseOrderItems.poId, poId),
        ),
      )

    if (!poItem) {
      throw new ProcurementError(`PO item not found: ${item.itemId}`, 'ITEM_NOT_FOUND')
    }

    const newReceivedQty = poItem.receivedQuantity + item.quantityReceived
    if (newReceivedQty > poItem.quantity) {
      throw new ProcurementError(
        `Cannot receive more than ordered: ${item.quantityReceived} + ${poItem.receivedQuantity} > ${poItem.quantity}`,
        'EXCEEDS_ORDERED_QUANTITY',
      )
    }

    const [updated] = await db
      .update(schema.purchaseOrderItems)
      .set({ receivedQuantity: newReceivedQty })
      .where(eq(schema.purchaseOrderItems.id, item.itemId))
      .returning()

    results.push(updated)
  }

  // Determine PO status: fully received or partially received
  const allItems = await db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.poId, poId))

  const fullyReceived = allItems.every((item) => item.receivedQuantity >= item.quantity)
  const anyReceived = allItems.some((item) => item.receivedQuantity > 0)

  const newStatus = fullyReceived ? 'received' : anyReceived ? 'partially_received' : po.status

  await db
    .update(schema.purchaseOrders)
    .set({ status: newStatus, updatedAt: new Date() })
    .where(eq(schema.purchaseOrders.id, poId))

  return {
    poId,
    status: newStatus,
    receivedItems: results,
    fullyReceived,
  }
}

/**
 * Partially receive items (convenience wrapper for receiveItems).
 */
export async function partialReceive(
  orgId: string,
  poId: string,
  itemId: string,
  quantity: number,
  receivedBy: string,
) {
  return receiveItems({
    orgId,
    poId,
    receivedItems: [{ itemId, quantityReceived: quantity }],
    receivedBy,
  })
}

/**
 * Close a PO (all items received or manually closed).
 */
export async function closePO(poId: string, orgId: string) {
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (po.status === 'closed' || po.status === 'cancelled') {
    throw new ProcurementError(`PO is already ${po.status}`, 'INVALID_STATUS')
  }

  const [updated] = await db
    .update(schema.purchaseOrders)
    .set({ status: 'closed', updatedAt: new Date() })
    .where(eq(schema.purchaseOrders.id, poId))
    .returning()

  return updated
}

/**
 * Cancel a PO.
 */
export async function cancelPO(poId: string, orgId: string) {
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  if (['received', 'closed'].includes(po.status)) {
    throw new ProcurementError(`Cannot cancel PO in status: ${po.status}`, 'CANNOT_CANCEL')
  }

  const [updated] = await db
    .update(schema.purchaseOrders)
    .set({ status: 'cancelled', updatedAt: new Date() })
    .where(eq(schema.purchaseOrders.id, poId))
    .returning()

  return updated
}

// ============================================================
// THREE-WAY MATCHING
// ============================================================

/**
 * Three-way matching: compare PO, receiving records, and invoice.
 * Returns match status and any discrepancies.
 */
export async function threeWayMatch(
  orgId: string,
  poId: string,
  invoiceId: string,
): Promise<ThreeWayMatchResult> {
  // Fetch PO with items
  const [po] = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.id, poId), eq(schema.purchaseOrders.orgId, orgId)))

  if (!po) {
    throw new ProcurementError('Purchase order not found', 'PO_NOT_FOUND')
  }

  const poItems = await db
    .select()
    .from(schema.purchaseOrderItems)
    .where(eq(schema.purchaseOrderItems.poId, poId))

  // Fetch invoice
  const [invoice] = await db
    .select()
    .from(schema.invoices)
    .where(and(eq(schema.invoices.id, invoiceId), eq(schema.invoices.orgId, orgId)))

  if (!invoice) {
    throw new ProcurementError('Invoice not found', 'INVOICE_NOT_FOUND')
  }

  const discrepancies: ThreeWayMatchResult['discrepancies'] = []

  // PO total vs Invoice total
  const poTotal = po.totalAmount
  const invoiceTotal = invoice.amount
  const receivedTotal = poItems.reduce((s, item) => s + item.receivedQuantity * item.unitPrice, 0)

  if (poTotal !== invoiceTotal) {
    discrepancies.push({
      field: 'total_amount',
      poValue: poTotal,
      invoiceValue: invoiceTotal,
      difference: Math.abs(poTotal - invoiceTotal),
    })
  }

  // Received value vs PO total
  if (receivedTotal !== poTotal) {
    discrepancies.push({
      field: 'received_value',
      poValue: poTotal,
      invoiceValue: receivedTotal,
      difference: Math.abs(poTotal - receivedTotal),
    })
  }

  // Received value vs Invoice
  if (receivedTotal !== invoiceTotal) {
    discrepancies.push({
      field: 'received_vs_invoice',
      poValue: receivedTotal,
      invoiceValue: invoiceTotal,
      difference: Math.abs(receivedTotal - invoiceTotal),
    })
  }

  // Check quantity discrepancies
  for (const item of poItems) {
    if (item.receivedQuantity < item.quantity) {
      discrepancies.push({
        field: `item_quantity_${item.id}`,
        poValue: `${item.description}: ordered ${item.quantity}`,
        invoiceValue: `received ${item.receivedQuantity}`,
        difference: item.quantity - item.receivedQuantity,
      })
    }
  }

  // Match percentage: based on amount tolerance (within 2% = full match)
  const amountDiff = Math.abs(poTotal - invoiceTotal)
  const tolerance = poTotal * 0.02 // 2% tolerance
  const matchPercentage =
    amountDiff === 0 ? 100 : amountDiff <= tolerance ? 95 : Math.max(0, Math.round((1 - amountDiff / poTotal) * 100))

  return {
    poId,
    invoiceId,
    isMatched: discrepancies.length === 0 || matchPercentage >= 95,
    poTotal,
    invoiceTotal,
    receivedTotal,
    discrepancies,
    matchPercentage,
  }
}

// ============================================================
// BUDGET & ANALYTICS
// ============================================================

/**
 * Check budget availability for a purchase before approval.
 */
export async function checkBudgetAvailability(orgId: string, departmentId: string, amount: number) {
  const budgets = await db
    .select()
    .from(schema.budgets)
    .where(
      and(
        eq(schema.budgets.orgId, orgId),
        eq(schema.budgets.departmentId, departmentId),
        eq(schema.budgets.status, 'active'),
      ),
    )

  if (budgets.length === 0) {
    return {
      available: false,
      reason: 'No active budget found for this department',
      remainingBudget: 0,
    }
  }

  // Use the budget for the current fiscal year
  const currentYear = new Date().getFullYear().toString()
  const currentBudget = budgets.find((b) => b.fiscalYear === currentYear) ?? budgets[0]

  const remaining = currentBudget.totalAmount - currentBudget.spentAmount
  const available = remaining >= amount

  return {
    available,
    budgetId: currentBudget.id,
    budgetName: currentBudget.name,
    totalBudget: currentBudget.totalAmount,
    spentAmount: currentBudget.spentAmount,
    remainingBudget: remaining,
    requestedAmount: amount,
    shortfall: available ? 0 : amount - remaining,
    utilizationPercent: Math.round((currentBudget.spentAmount / currentBudget.totalAmount) * 100),
  }
}

/**
 * Create a purchase order from a template (predefined items).
 */
export async function createFromTemplate(
  orgId: string,
  vendorId: string,
  templateItems: Array<{ description: string; sku?: string; quantity: number; unitPrice: number; category?: string }>,
  createdBy: string,
  overrides?: Partial<Pick<CreatePurchaseOrderInput, 'shippingAddress' | 'billingAddress' | 'terms' | 'deliveryDate' | 'notes'>>,
) {
  return createPurchaseOrder({
    orgId,
    vendorId,
    items: templateItems,
    createdBy,
    ...overrides,
  })
}

/**
 * Get vendor performance scoring based on order history.
 */
export async function getVendorPerformance(orgId: string, vendorId: string): Promise<VendorPerformance> {
  // Fetch vendor
  const [vendor] = await db
    .select()
    .from(schema.vendors)
    .where(and(eq(schema.vendors.id, vendorId), eq(schema.vendors.orgId, orgId)))

  if (!vendor) {
    throw new ProcurementError('Vendor not found', 'VENDOR_NOT_FOUND')
  }

  // Get all POs for this vendor
  const pos = await db
    .select()
    .from(schema.purchaseOrders)
    .where(and(eq(schema.purchaseOrders.orgId, orgId), eq(schema.purchaseOrders.vendorId, vendorId)))

  const totalOrders = pos.length
  const totalSpend = pos.reduce((s, p) => s + p.totalAmount, 0)

  // On-time delivery rate: POs with delivery date where received before or on delivery date
  const posWithDelivery = pos.filter((p) => p.deliveryDate)
  const onTimePOs = posWithDelivery.filter((p) => {
    if (!p.deliveryDate) return false
    if (p.status === 'received' || p.status === 'closed') {
      // Compare updatedAt (when received) with delivery date
      return new Date(p.updatedAt) <= new Date(p.deliveryDate + 'T23:59:59')
    }
    return false
  })
  const onTimeRate = posWithDelivery.length > 0 ? Math.round((onTimePOs.length / posWithDelivery.length) * 100) : 100

  // Average lead time (days from creation to receipt)
  const completedPOs = pos.filter((p) => p.status === 'received' || p.status === 'closed')
  const leadTimes = completedPOs.map((p) => {
    const created = new Date(p.createdAt)
    const completed = new Date(p.updatedAt)
    return Math.ceil((completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  })
  const avgLeadTime = leadTimes.length > 0 ? Math.round(leadTimes.reduce((s, l) => s + l, 0) / leadTimes.length) : 0

  // Get PO items to check quality (received vs ordered)
  let totalOrdered = 0
  let totalShort = 0
  for (const po of completedPOs) {
    const items = await db
      .select()
      .from(schema.purchaseOrderItems)
      .where(eq(schema.purchaseOrderItems.poId, po.id))

    for (const item of items) {
      totalOrdered += item.quantity
      totalShort += Math.max(0, item.quantity - item.receivedQuantity)
    }
  }

  const qualityScore = totalOrdered > 0 ? Math.round(((totalOrdered - totalShort) / totalOrdered) * 100) : 100
  const returnRate = totalOrdered > 0 ? Math.round((totalShort / totalOrdered) * 100) : 0

  // Overall score (weighted average)
  const overallScore = Math.round(onTimeRate * 0.35 + qualityScore * 0.35 + Math.min(100, (completedPOs.length / Math.max(1, totalOrders)) * 100) * 0.3)

  // Tier assignment
  let tier: VendorPerformance['tier']
  if (overallScore >= 95) tier = 'platinum'
  else if (overallScore >= 85) tier = 'gold'
  else if (overallScore >= 70) tier = 'silver'
  else if (overallScore >= 50) tier = 'standard'
  else tier = 'probation'

  return {
    vendorId,
    vendorName: vendor.name,
    totalOrders,
    totalSpend,
    onTimeDeliveryRate: onTimeRate,
    qualityScore,
    averageLeadTimeDays: avgLeadTime,
    returnRate,
    overallScore,
    tier,
  }
}

/**
 * Get procurement analytics for the organization.
 */
export async function getProcurementAnalytics(orgId: string): Promise<ProcurementAnalytics> {
  const pos = await db
    .select()
    .from(schema.purchaseOrders)
    .where(eq(schema.purchaseOrders.orgId, orgId))

  const totalPOs = pos.length
  const totalSpend = pos
    .filter((p) => !['draft', 'cancelled'].includes(p.status))
    .reduce((s, p) => s + p.totalAmount, 0)
  const averagePOValue = totalPOs > 0 ? Math.round(totalSpend / totalPOs) : 0

  const openStatuses = ['draft', 'pending_approval', 'approved', 'sent_to_vendor', 'partially_received']
  const openPOs = pos.filter((p) => openStatuses.includes(p.status))
  const openPOValue = openPOs.reduce((s, p) => s + p.totalAmount, 0)

  // Spend by vendor
  const vendorGroups: Record<string, { amount: number; count: number }> = {}
  for (const po of pos) {
    if (['draft', 'cancelled'].includes(po.status)) continue
    if (!vendorGroups[po.vendorId]) vendorGroups[po.vendorId] = { amount: 0, count: 0 }
    vendorGroups[po.vendorId].amount += po.totalAmount
    vendorGroups[po.vendorId].count++
  }

  // Get vendor names
  const vendorIds = Object.keys(vendorGroups)
  const vendors = vendorIds.length > 0
    ? await db
        .select({ id: schema.vendors.id, name: schema.vendors.name })
        .from(schema.vendors)
        .where(sql`${schema.vendors.id} IN ${vendorIds}`)
    : []

  const vendorNameMap = new Map(vendors.map((v) => [v.id, v.name]))

  // Spend by category (from PO items)
  const categoryRows = await db
    .select({
      category: schema.purchaseOrderItems.category,
      amount: sum(schema.purchaseOrderItems.totalPrice),
      count: count(),
    })
    .from(schema.purchaseOrderItems)
    .innerJoin(schema.purchaseOrders, eq(schema.purchaseOrderItems.poId, schema.purchaseOrders.id))
    .where(
      and(
        eq(schema.purchaseOrders.orgId, orgId),
        sql`${schema.purchaseOrders.status} NOT IN ('draft', 'cancelled')`,
      ),
    )
    .groupBy(schema.purchaseOrderItems.category)

  // Spend by department (from procurement requests)
  const deptRows = await db
    .select({
      departmentId: schema.procurementRequests.departmentId,
      amount: sum(schema.procurementRequests.estimatedAmount),
      count: count(),
    })
    .from(schema.procurementRequests)
    .where(eq(schema.procurementRequests.orgId, orgId))
    .groupBy(schema.procurementRequests.departmentId)

  // Monthly trend
  const monthlyRows = await db
    .select({
      month: sql<string>`TO_CHAR(${schema.purchaseOrders.createdAt}, 'YYYY-MM')`,
      amount: sum(schema.purchaseOrders.totalAmount),
      count: count(),
    })
    .from(schema.purchaseOrders)
    .where(
      and(
        eq(schema.purchaseOrders.orgId, orgId),
        sql`${schema.purchaseOrders.status} NOT IN ('draft', 'cancelled')`,
      ),
    )
    .groupBy(sql`TO_CHAR(${schema.purchaseOrders.createdAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${schema.purchaseOrders.createdAt}, 'YYYY-MM')`)

  // Approval cycle (average days from draft to approved)
  const approvedPOs = pos.filter((p) => p.approvedAt)
  const approvalDays = approvedPOs.map((p) => {
    const created = new Date(p.createdAt)
    const approved = new Date(p.approvedAt!)
    return Math.ceil((approved.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
  })
  const avgApprovalDays = approvalDays.length > 0
    ? Math.round(approvalDays.reduce((s, d) => s + d, 0) / approvalDays.length)
    : 0

  // Fulfillment rate
  const fulfilledPOs = pos.filter((p) => ['received', 'closed'].includes(p.status)).length
  const fulfillmentRate = totalPOs > 0 ? Math.round((fulfilledPOs / totalPOs) * 100) : 0

  return {
    orgId,
    totalPOs,
    totalSpend,
    averagePOValue,
    openPOs: openPOs.length,
    openPOValue,
    spendByVendor: Object.entries(vendorGroups)
      .map(([vendorId, data]) => ({
        vendorId,
        vendorName: vendorNameMap.get(vendorId) ?? 'Unknown',
        ...data,
      }))
      .sort((a, b) => b.amount - a.amount),
    spendByCategory: categoryRows.map((r) => ({
      category: r.category ?? 'Uncategorized',
      amount: Number(r.amount ?? 0),
      count: Number(r.count),
    })),
    spendByDepartment: deptRows
      .filter((r) => r.departmentId)
      .map((r) => ({
        departmentId: r.departmentId!,
        amount: Number(r.amount ?? 0),
        count: Number(r.count),
      })),
    monthlyTrend: monthlyRows.map((r) => ({
      month: r.month,
      amount: Number(r.amount ?? 0),
      count: Number(r.count),
    })),
    approvalCycleDays: avgApprovalDays,
    fulfillmentRate,
  }
}
