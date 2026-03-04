// Tempo Device Store & Buyback Service
// Device catalog management, role-based eligibility, multi-level order approval,
// shipping tracking, buyback program with condition assessment, and analytics.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, gte, lte } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export type DeviceCatalogStatus = 'available' | 'out_of_stock' | 'discontinued' | 'coming_soon'
export type DeviceOrderStatus = 'pending_approval' | 'approved' | 'ordered' | 'shipped' | 'delivered' | 'cancelled'
export type BuybackStatus = 'submitted' | 'evaluating' | 'quote_sent' | 'accepted' | 'rejected' | 'completed'
export type DeviceCondition = 'new' | 'good' | 'fair' | 'poor'

export interface CatalogItemData {
  name: string
  manufacturer: string
  model: string
  category: string // laptop | desktop | phone | tablet | monitor | accessories
  platform?: string
  specs?: {
    cpu?: string
    ram?: string
    storage?: string
    display?: string
    battery?: string
    [key: string]: string | undefined
  }
  price: number // cents
  currency?: string
  imageUrl?: string
  status?: DeviceCatalogStatus
  stockCount?: number
  supplier?: string
  warrantyMonths?: number
  isApproved?: boolean
  allowedRoles?: string[] // null means all roles
}

export interface OrderData {
  catalogItemId: string
  requesterId: string
  forEmployeeId: string
  quantity?: number
  shippingAddress?: string
  notes?: string
}

export interface BuybackRequestData {
  deviceId?: string
  deviceName: string
  condition: DeviceCondition
  originalPrice?: number
  photos?: string[]
  employeeNotes?: string
}

export interface StoreAnalytics {
  catalog: {
    totalItems: number
    availableItems: number
    outOfStock: number
    discontinued: number
    averagePrice: number
    priceRange: { min: number; max: number }
  }
  orders: {
    totalOrders: number
    pendingApproval: number
    inProgress: number
    delivered: number
    cancelled: number
    totalSpend: number
    averageOrderValue: number
    ordersByMonth: Array<{ month: string; count: number; spend: number }>
  }
  buyback: {
    totalRequests: number
    completed: number
    pending: number
    totalBuybackValue: number
    averageBuybackValue: number
    byCondition: Record<string, number>
  }
  popularDevices: Array<{ itemId: string; name: string; orderCount: number }>
  spendByDepartment: Array<{ departmentId: string; departmentName: string; totalSpend: number }>
}

// ============================================================
// Depreciation Constants for Buyback Valuation
// ============================================================

const CONDITION_MULTIPLIER: Record<DeviceCondition, number> = {
  new: 0.90,
  good: 0.65,
  fair: 0.40,
  poor: 0.15,
}

// Annual depreciation rate for fair market value
const ANNUAL_DEPRECIATION_RATE = 0.25

// ============================================================
// Catalog Management
// ============================================================

/**
 * Add a new item to the device store catalog.
 */
export async function addCatalogItem(
  orgId: string,
  data: CatalogItemData
): Promise<{ success: boolean; item?: typeof schema.deviceStoreCatalog.$inferSelect; error?: string }> {
  try {
    if (!data.name || !data.manufacturer || !data.model || !data.category) {
      return { success: false, error: 'name, manufacturer, model, and category are required' }
    }

    if (data.price < 0) {
      return { success: false, error: 'Price cannot be negative' }
    }

    const [item] = await db
      .insert(schema.deviceStoreCatalog)
      .values({
        orgId,
        name: data.name,
        manufacturer: data.manufacturer,
        model: data.model,
        category: data.category,
        platform: data.platform ?? null,
        specs: data.specs ?? null,
        price: data.price,
        currency: data.currency ?? 'USD',
        imageUrl: data.imageUrl ?? null,
        status: data.status ?? 'available',
        stockCount: data.stockCount ?? 0,
        supplier: data.supplier ?? null,
        warrantyMonths: data.warrantyMonths ?? 12,
        isApproved: data.isApproved ?? true,
        allowedRoles: data.allowedRoles ?? null,
      })
      .returning()

    return { success: true, item }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to add catalog item',
    }
  }
}

/**
 * Update an existing catalog item.
 */
export async function updateCatalogItem(
  orgId: string,
  itemId: string,
  updates: Partial<CatalogItemData>
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.deviceStoreCatalog)
      .where(and(eq(schema.deviceStoreCatalog.id, itemId), eq(schema.deviceStoreCatalog.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Catalog item not found' }
    }

    const setValues: Record<string, any> = {}
    if (updates.name !== undefined) setValues.name = updates.name
    if (updates.manufacturer !== undefined) setValues.manufacturer = updates.manufacturer
    if (updates.model !== undefined) setValues.model = updates.model
    if (updates.category !== undefined) setValues.category = updates.category
    if (updates.platform !== undefined) setValues.platform = updates.platform
    if (updates.specs !== undefined) setValues.specs = updates.specs
    if (updates.price !== undefined) setValues.price = updates.price
    if (updates.currency !== undefined) setValues.currency = updates.currency
    if (updates.imageUrl !== undefined) setValues.imageUrl = updates.imageUrl
    if (updates.status !== undefined) setValues.status = updates.status
    if (updates.stockCount !== undefined) setValues.stockCount = updates.stockCount
    if (updates.supplier !== undefined) setValues.supplier = updates.supplier
    if (updates.warrantyMonths !== undefined) setValues.warrantyMonths = updates.warrantyMonths
    if (updates.isApproved !== undefined) setValues.isApproved = updates.isApproved
    if (updates.allowedRoles !== undefined) setValues.allowedRoles = updates.allowedRoles

    if (Object.keys(setValues).length === 0) {
      return { success: false, error: 'No update fields provided' }
    }

    await db
      .update(schema.deviceStoreCatalog)
      .set(setValues)
      .where(eq(schema.deviceStoreCatalog.id, itemId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update catalog item',
    }
  }
}

/**
 * Remove an item from the catalog. Sets status to discontinued rather than hard delete.
 */
export async function removeCatalogItem(
  orgId: string,
  itemId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [item] = await db
      .select()
      .from(schema.deviceStoreCatalog)
      .where(and(eq(schema.deviceStoreCatalog.id, itemId), eq(schema.deviceStoreCatalog.orgId, orgId)))
      .limit(1)

    if (!item) {
      return { success: false, error: 'Catalog item not found' }
    }

    // Check for pending orders
    const [pendingOrders] = await db
      .select({ cnt: count() })
      .from(schema.deviceOrders)
      .where(and(
        eq(schema.deviceOrders.catalogItemId, itemId),
        sql`${schema.deviceOrders.status} IN ('pending_approval', 'approved', 'ordered')`
      ))

    if (Number(pendingOrders?.cnt ?? 0) > 0) {
      return { success: false, error: `Cannot remove item: ${pendingOrders.cnt} pending order(s) reference this item. Set to discontinued instead.` }
    }

    await db
      .update(schema.deviceStoreCatalog)
      .set({ status: 'discontinued' })
      .where(eq(schema.deviceStoreCatalog.id, itemId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to remove catalog item',
    }
  }
}

/**
 * Get the full store catalog with optional filtering.
 */
export async function getStoreCatalog(
  orgId: string,
  options?: {
    category?: string
    platform?: string
    status?: DeviceCatalogStatus
    minPrice?: number
    maxPrice?: number
    employeeRole?: string // For role-based eligibility filtering
  }
): Promise<{
  items: Array<typeof schema.deviceStoreCatalog.$inferSelect>
  totalItems: number
}> {
  const conditions = [eq(schema.deviceStoreCatalog.orgId, orgId)]

  if (options?.status) {
    conditions.push(eq(schema.deviceStoreCatalog.status, options.status))
  }

  if (options?.category) {
    conditions.push(eq(schema.deviceStoreCatalog.category, options.category))
  }

  if (options?.minPrice !== undefined) {
    conditions.push(gte(schema.deviceStoreCatalog.price, options.minPrice))
  }

  if (options?.maxPrice !== undefined) {
    conditions.push(lte(schema.deviceStoreCatalog.price, options.maxPrice))
  }

  let items = await db
    .select()
    .from(schema.deviceStoreCatalog)
    .where(and(...conditions))
    .orderBy(schema.deviceStoreCatalog.name)

  // Filter by role eligibility
  if (options?.employeeRole) {
    items = items.filter(item => {
      const allowedRoles = item.allowedRoles as string[] | null
      if (!allowedRoles || allowedRoles.length === 0) return true // No restrictions
      return allowedRoles.includes(options.employeeRole!)
    })
  }

  // Filter by platform
  if (options?.platform) {
    items = items.filter(item => item.platform === options.platform)
  }

  return { items, totalItems: items.length }
}

/**
 * Check if an employee is eligible to order a specific catalog item based on role.
 */
export async function checkRoleEligibility(
  orgId: string,
  catalogItemId: string,
  employeeId: string
): Promise<{ eligible: boolean; reason?: string }> {
  const [item] = await db
    .select()
    .from(schema.deviceStoreCatalog)
    .where(and(eq(schema.deviceStoreCatalog.id, catalogItemId), eq(schema.deviceStoreCatalog.orgId, orgId)))
    .limit(1)

  if (!item) {
    return { eligible: false, reason: 'Catalog item not found' }
  }

  if (item.status !== 'available') {
    return { eligible: false, reason: `Item is not available (status: ${item.status})` }
  }

  if (item.stockCount <= 0) {
    return { eligible: false, reason: 'Item is out of stock' }
  }

  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
    .limit(1)

  if (!employee) {
    return { eligible: false, reason: 'Employee not found' }
  }

  const allowedRoles = item.allowedRoles as string[] | null
  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(employee.role)) {
    return {
      eligible: false,
      reason: `Your role (${employee.role}) is not eligible for this device. Allowed roles: ${allowedRoles.join(', ')}`,
    }
  }

  return { eligible: true }
}

/**
 * Get device recommendations for an employee based on their role, department, and history.
 */
export async function getDeviceRecommendations(
  orgId: string,
  employeeId: string
): Promise<Array<{
  item: typeof schema.deviceStoreCatalog.$inferSelect
  reason: string
  score: number
}>> {
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
    .limit(1)

  if (!employee) return []

  // Get available catalog items
  const items = await db
    .select()
    .from(schema.deviceStoreCatalog)
    .where(and(
      eq(schema.deviceStoreCatalog.orgId, orgId),
      eq(schema.deviceStoreCatalog.status, 'available')
    ))

  const recommendations: Array<{ item: typeof schema.deviceStoreCatalog.$inferSelect; reason: string; score: number }> = []

  for (const item of items) {
    let score = 50 // Base score
    let reason = ''

    // Role eligibility
    const allowedRoles = item.allowedRoles as string[] | null
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(employee.role)) {
      continue // Skip ineligible items
    }

    // Category matching based on role
    if (employee.role === 'admin' || employee.role === 'owner') {
      if (item.category === 'laptop' && item.price > 150000) {
        score += 20
        reason = 'Premium laptop recommended for leadership role'
      }
    }

    if (employee.jobTitle?.toLowerCase().includes('engineer') || employee.jobTitle?.toLowerCase().includes('developer')) {
      if (item.category === 'laptop' && (item.specs as any)?.ram?.includes('32')) {
        score += 25
        reason = 'High-performance device recommended for engineering'
      } else if (item.category === 'monitor' && (item.specs as any)?.display?.includes('4K')) {
        score += 15
        reason = 'High-resolution display recommended for development'
      }
    }

    if (employee.jobTitle?.toLowerCase().includes('design')) {
      if (item.manufacturer?.toLowerCase() === 'apple' && item.category === 'laptop') {
        score += 20
        reason = 'Recommended for design workflows'
      }
    }

    // Stock availability bonus
    if (item.stockCount > 10) score += 5
    if (item.stockCount <= 0) continue // Skip out of stock

    // Approved items bonus
    if (item.isApproved) score += 10

    // Popular items (by existing orders)
    const [orderCount] = await db
      .select({ cnt: count() })
      .from(schema.deviceOrders)
      .where(eq(schema.deviceOrders.catalogItemId, item.id))
    if (Number(orderCount?.cnt ?? 0) > 5) {
      score += 10
      if (!reason) reason = 'Popular choice in your organization'
    }

    if (!reason) reason = 'Available and eligible for your role'

    recommendations.push({ item, reason, score })
  }

  // Sort by score, take top 5
  recommendations.sort((a, b) => b.score - a.score)
  return recommendations.slice(0, 5)
}

// ============================================================
// Order Management
// ============================================================

/**
 * Create a new device order. Starts in 'pending_approval' status.
 */
export async function createOrder(
  orgId: string,
  data: OrderData
): Promise<{ success: boolean; order?: typeof schema.deviceOrders.$inferSelect; error?: string }> {
  try {
    // Validate catalog item
    const [catalogItem] = await db
      .select()
      .from(schema.deviceStoreCatalog)
      .where(and(eq(schema.deviceStoreCatalog.id, data.catalogItemId), eq(schema.deviceStoreCatalog.orgId, orgId)))
      .limit(1)

    if (!catalogItem) {
      return { success: false, error: 'Catalog item not found' }
    }

    if (catalogItem.status !== 'available') {
      return { success: false, error: `Item is not available for ordering (status: ${catalogItem.status})` }
    }

    const quantity = data.quantity ?? 1
    if (quantity < 1) {
      return { success: false, error: 'Quantity must be at least 1' }
    }

    if (catalogItem.stockCount < quantity) {
      return { success: false, error: `Insufficient stock. Available: ${catalogItem.stockCount}, Requested: ${quantity}` }
    }

    // Validate requester and recipient
    const [requester] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, data.requesterId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!requester) {
      return { success: false, error: 'Requester not found' }
    }

    const [recipient] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, data.forEmployeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!recipient) {
      return { success: false, error: 'Recipient employee not found' }
    }

    if (!recipient.isActive) {
      return { success: false, error: 'Cannot order a device for an inactive employee' }
    }

    // Check role eligibility
    const eligibility = await checkRoleEligibility(orgId, data.catalogItemId, data.forEmployeeId)
    if (!eligibility.eligible) {
      return { success: false, error: eligibility.reason }
    }

    const totalPrice = catalogItem.price * quantity

    const [order] = await db
      .insert(schema.deviceOrders)
      .values({
        orgId,
        catalogItemId: data.catalogItemId,
        requesterId: data.requesterId,
        forEmployeeId: data.forEmployeeId,
        quantity,
        totalPrice,
        currency: catalogItem.currency,
        status: 'pending_approval',
        shippingAddress: data.shippingAddress ?? null,
        notes: data.notes ?? null,
      })
      .returning()

    return { success: true, order }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create order',
    }
  }
}

/**
 * Approve a device order. Moves status from 'pending_approval' to 'approved'.
 */
export async function approveOrder(
  orgId: string,
  orderId: string,
  approverId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [order] = await db
      .select()
      .from(schema.deviceOrders)
      .where(and(eq(schema.deviceOrders.id, orderId), eq(schema.deviceOrders.orgId, orgId)))
      .limit(1)

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status !== 'pending_approval') {
      return { success: false, error: `Order cannot be approved (current status: ${order.status})` }
    }

    // Validate approver exists and has appropriate role
    const [approver] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, approverId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!approver) {
      return { success: false, error: 'Approver not found' }
    }

    if (!['admin', 'owner', 'manager', 'hrbp'].includes(approver.role)) {
      return { success: false, error: 'Approver does not have sufficient permissions' }
    }

    // Self-approval check
    if (order.requesterId === approverId && order.forEmployeeId === approverId) {
      return { success: false, error: 'Cannot approve your own order for yourself' }
    }

    // Update stock
    const [catalogItem] = await db
      .select()
      .from(schema.deviceStoreCatalog)
      .where(eq(schema.deviceStoreCatalog.id, order.catalogItemId))
      .limit(1)

    if (catalogItem && catalogItem.stockCount < order.quantity) {
      return { success: false, error: `Insufficient stock to fulfill order. Available: ${catalogItem.stockCount}` }
    }

    await db
      .update(schema.deviceOrders)
      .set({
        status: 'approved',
        approvedBy: approverId,
        approvedAt: new Date(),
      })
      .where(eq(schema.deviceOrders.id, orderId))

    // Decrement stock
    if (catalogItem) {
      const newStock = Math.max(0, catalogItem.stockCount - order.quantity)
      await db
        .update(schema.deviceStoreCatalog)
        .set({
          stockCount: newStock,
          status: newStock === 0 ? 'out_of_stock' : catalogItem.status,
        })
        .where(eq(schema.deviceStoreCatalog.id, catalogItem.id))
    }

    // Audit log
    try {
      await db.insert(schema.auditLog).values({
        orgId,
        userId: approverId,
        action: 'approve',
        entityType: 'device_order',
        entityId: orderId,
        details: `Device order approved for ${order.forEmployeeId}`,
      })
    } catch { /* non-critical */ }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to approve order',
    }
  }
}

/**
 * Fulfill a device order (mark as ordered with the supplier).
 */
export async function fulfillOrder(
  orgId: string,
  orderId: string,
  trackingNumber?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [order] = await db
      .select()
      .from(schema.deviceOrders)
      .where(and(eq(schema.deviceOrders.id, orderId), eq(schema.deviceOrders.orgId, orgId)))
      .limit(1)

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (order.status !== 'approved') {
      return { success: false, error: `Order cannot be fulfilled (current status: ${order.status}). Must be approved first.` }
    }

    await db
      .update(schema.deviceOrders)
      .set({
        status: trackingNumber ? 'shipped' : 'ordered',
        trackingNumber: trackingNumber ?? null,
        orderedAt: new Date(),
      })
      .where(eq(schema.deviceOrders.id, orderId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to fulfill order',
    }
  }
}

/**
 * Cancel a device order. Only possible before fulfillment.
 */
export async function cancelOrder(
  orgId: string,
  orderId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [order] = await db
      .select()
      .from(schema.deviceOrders)
      .where(and(eq(schema.deviceOrders.id, orderId), eq(schema.deviceOrders.orgId, orgId)))
      .limit(1)

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (['shipped', 'delivered'].includes(order.status)) {
      return { success: false, error: `Cannot cancel order that is already ${order.status}` }
    }

    if (order.status === 'cancelled') {
      return { success: false, error: 'Order is already cancelled' }
    }

    // Restore stock if order was approved
    if (order.status === 'approved' || order.status === 'ordered') {
      const [catalogItem] = await db
        .select()
        .from(schema.deviceStoreCatalog)
        .where(eq(schema.deviceStoreCatalog.id, order.catalogItemId))
        .limit(1)

      if (catalogItem) {
        await db
          .update(schema.deviceStoreCatalog)
          .set({
            stockCount: catalogItem.stockCount + order.quantity,
            status: 'available',
          })
          .where(eq(schema.deviceStoreCatalog.id, catalogItem.id))
      }
    }

    await db
      .update(schema.deviceOrders)
      .set({
        status: 'cancelled',
        notes: reason ? `${order.notes ? order.notes + ' | ' : ''}Cancelled: ${reason}` : order.notes,
      })
      .where(eq(schema.deviceOrders.id, orderId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to cancel order',
    }
  }
}

/**
 * Get the status of a specific order.
 */
export async function getOrderStatus(
  orgId: string,
  orderId: string
): Promise<{
  order: {
    id: string
    status: string
    catalogItemName: string
    requesterName: string
    recipientName: string
    quantity: number
    totalPrice: number
    currency: string
    trackingNumber: string | null
    shippingAddress: string | null
    approvedBy: string | null
    approvedAt: Date | null
    orderedAt: Date | null
    deliveredAt: Date | null
    createdAt: Date
  } | null
}> {
  const [order] = await db
    .select()
    .from(schema.deviceOrders)
    .where(and(eq(schema.deviceOrders.id, orderId), eq(schema.deviceOrders.orgId, orgId)))
    .limit(1)

  if (!order) {
    return { order: null }
  }

  // Get related names
  const [catalogItem] = await db
    .select({ name: schema.deviceStoreCatalog.name })
    .from(schema.deviceStoreCatalog)
    .where(eq(schema.deviceStoreCatalog.id, order.catalogItemId))
    .limit(1)

  const [requester] = await db
    .select({ fullName: schema.employees.fullName })
    .from(schema.employees)
    .where(eq(schema.employees.id, order.requesterId))
    .limit(1)

  const [recipient] = await db
    .select({ fullName: schema.employees.fullName })
    .from(schema.employees)
    .where(eq(schema.employees.id, order.forEmployeeId))
    .limit(1)

  return {
    order: {
      id: order.id,
      status: order.status,
      catalogItemName: catalogItem?.name ?? 'Unknown',
      requesterName: requester?.fullName ?? 'Unknown',
      recipientName: recipient?.fullName ?? 'Unknown',
      quantity: order.quantity,
      totalPrice: order.totalPrice,
      currency: order.currency,
      trackingNumber: order.trackingNumber,
      shippingAddress: order.shippingAddress,
      approvedBy: order.approvedBy,
      approvedAt: order.approvedAt,
      orderedAt: order.orderedAt,
      deliveredAt: order.deliveredAt,
      createdAt: order.createdAt,
    },
  }
}

/**
 * Track shipment for an order (update tracking info).
 */
export async function trackShipment(
  orgId: string,
  orderId: string,
  trackingNumber: string,
  status?: 'shipped' | 'delivered'
): Promise<{ success: boolean; error?: string }> {
  try {
    const [order] = await db
      .select()
      .from(schema.deviceOrders)
      .where(and(eq(schema.deviceOrders.id, orderId), eq(schema.deviceOrders.orgId, orgId)))
      .limit(1)

    if (!order) {
      return { success: false, error: 'Order not found' }
    }

    if (!['approved', 'ordered', 'shipped'].includes(order.status)) {
      return { success: false, error: `Cannot update tracking for order with status: ${order.status}` }
    }

    const updates: Record<string, any> = { trackingNumber }

    if (status === 'shipped' || (!status && !order.trackingNumber)) {
      updates.status = 'shipped'
    }

    if (status === 'delivered') {
      updates.status = 'delivered'
      updates.deliveredAt = new Date()
    }

    await db
      .update(schema.deviceOrders)
      .set(updates)
      .where(eq(schema.deviceOrders.id, orderId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update tracking',
    }
  }
}

// ============================================================
// Buyback Program
// ============================================================

/**
 * Submit a device buyback request.
 */
export async function submitBuybackRequest(
  orgId: string,
  employeeId: string,
  data: BuybackRequestData
): Promise<{ success: boolean; request?: typeof schema.buybackRequests.$inferSelect; error?: string }> {
  try {
    // Validate employee
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) {
      return { success: false, error: 'Employee not found' }
    }

    if (!data.deviceName) {
      return { success: false, error: 'Device name is required' }
    }

    const [request] = await db
      .insert(schema.buybackRequests)
      .values({
        orgId,
        deviceId: data.deviceId ?? null,
        employeeId,
        deviceName: data.deviceName,
        condition: data.condition,
        originalPrice: data.originalPrice ?? null,
        currency: 'USD',
        status: 'submitted',
        photos: data.photos ?? null,
        employeeNotes: data.employeeNotes ?? null,
      })
      .returning()

    return { success: true, request }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit buyback request',
    }
  }
}

/**
 * Evaluate a buyback request and update its status to 'evaluating'.
 */
export async function evaluateDevice(
  orgId: string,
  requestId: string,
  evaluatorId: string,
  evaluationNotes: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(schema.buybackRequests)
      .where(and(eq(schema.buybackRequests.id, requestId), eq(schema.buybackRequests.orgId, orgId)))
      .limit(1)

    if (!request) {
      return { success: false, error: 'Buyback request not found' }
    }

    if (request.status !== 'submitted') {
      return { success: false, error: `Cannot evaluate request with status: ${request.status}` }
    }

    await db
      .update(schema.buybackRequests)
      .set({
        status: 'evaluating',
        evaluatedBy: evaluatorId,
        evaluationNotes,
      })
      .where(eq(schema.buybackRequests.id, requestId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to evaluate device',
    }
  }
}

/**
 * Estimate the buyback value for a device based on condition, age, and model.
 */
export async function estimateBuybackValue(
  originalPrice: number,
  condition: DeviceCondition,
  ageMonths: number
): Promise<{
  estimatedValue: number
  conditionMultiplier: number
  depreciationFactor: number
  fairMarketValue: number
}> {
  const conditionMultiplier = CONDITION_MULTIPLIER[condition]
  const ageYears = ageMonths / 12
  const depreciationFactor = Math.max(0.05, 1 - (ANNUAL_DEPRECIATION_RATE * ageYears))

  const fairMarketValue = Math.round(originalPrice * depreciationFactor)
  const estimatedValue = Math.round(fairMarketValue * conditionMultiplier)

  return {
    estimatedValue,
    conditionMultiplier,
    depreciationFactor: Math.round(depreciationFactor * 100) / 100,
    fairMarketValue,
  }
}

/**
 * Send a buyback quote to the employee.
 */
export async function sendBuybackQuote(
  orgId: string,
  requestId: string,
  buybackPrice: number
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(schema.buybackRequests)
      .where(and(eq(schema.buybackRequests.id, requestId), eq(schema.buybackRequests.orgId, orgId)))
      .limit(1)

    if (!request) {
      return { success: false, error: 'Buyback request not found' }
    }

    if (!['submitted', 'evaluating'].includes(request.status)) {
      return { success: false, error: `Cannot send quote for request with status: ${request.status}` }
    }

    if (buybackPrice < 0) {
      return { success: false, error: 'Buyback price cannot be negative' }
    }

    await db
      .update(schema.buybackRequests)
      .set({
        status: 'quote_sent',
        buybackPrice,
      })
      .where(eq(schema.buybackRequests.id, requestId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to send buyback quote',
    }
  }
}

/**
 * Accept a buyback quote.
 */
export async function acceptBuyback(
  orgId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(schema.buybackRequests)
      .where(and(eq(schema.buybackRequests.id, requestId), eq(schema.buybackRequests.orgId, orgId)))
      .limit(1)

    if (!request) {
      return { success: false, error: 'Buyback request not found' }
    }

    if (request.status !== 'quote_sent') {
      return { success: false, error: `Cannot accept request with status: ${request.status}. Must be in quote_sent status.` }
    }

    await db
      .update(schema.buybackRequests)
      .set({ status: 'accepted' })
      .where(eq(schema.buybackRequests.id, requestId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to accept buyback',
    }
  }
}

/**
 * Reject a buyback quote.
 */
export async function rejectBuyback(
  orgId: string,
  requestId: string,
  reason?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(schema.buybackRequests)
      .where(and(eq(schema.buybackRequests.id, requestId), eq(schema.buybackRequests.orgId, orgId)))
      .limit(1)

    if (!request) {
      return { success: false, error: 'Buyback request not found' }
    }

    if (!['quote_sent', 'submitted', 'evaluating'].includes(request.status)) {
      return { success: false, error: `Cannot reject request with status: ${request.status}` }
    }

    await db
      .update(schema.buybackRequests)
      .set({
        status: 'rejected',
        evaluationNotes: reason
          ? `${request.evaluationNotes ? request.evaluationNotes + ' | ' : ''}Rejected: ${reason}`
          : request.evaluationNotes,
      })
      .where(eq(schema.buybackRequests.id, requestId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to reject buyback',
    }
  }
}

/**
 * Complete a buyback (device received, payment processed).
 */
export async function completeBuyback(
  orgId: string,
  requestId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [request] = await db
      .select()
      .from(schema.buybackRequests)
      .where(and(eq(schema.buybackRequests.id, requestId), eq(schema.buybackRequests.orgId, orgId)))
      .limit(1)

    if (!request) {
      return { success: false, error: 'Buyback request not found' }
    }

    if (request.status !== 'accepted') {
      return { success: false, error: `Cannot complete buyback with status: ${request.status}. Must be accepted first.` }
    }

    await db
      .update(schema.buybackRequests)
      .set({
        status: 'completed',
        completedAt: new Date(),
      })
      .where(eq(schema.buybackRequests.id, requestId))

    // If the buyback is linked to a managed device, retire it
    if (request.deviceId) {
      try {
        await db
          .update(schema.managedDevices)
          .set({ status: 'retired' })
          .where(eq(schema.managedDevices.id, request.deviceId))
      } catch { /* Device may not exist or different schema */ }
    }

    // Audit log
    try {
      await db.insert(schema.auditLog).values({
        orgId,
        userId: request.employeeId,
        action: 'update',
        entityType: 'buyback_request',
        entityId: requestId,
        details: `Buyback completed for "${request.deviceName}" at ${request.buybackPrice} ${request.currency}`,
      })
    } catch { /* non-critical */ }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to complete buyback',
    }
  }
}

// ============================================================
// Analytics
// ============================================================

/**
 * Get comprehensive store and buyback analytics.
 */
export async function getStoreAnalytics(
  orgId: string
): Promise<StoreAnalytics> {
  // Catalog stats
  const catalogItems = await db
    .select()
    .from(schema.deviceStoreCatalog)
    .where(eq(schema.deviceStoreCatalog.orgId, orgId))

  const availableItems = catalogItems.filter(i => i.status === 'available').length
  const outOfStock = catalogItems.filter(i => i.status === 'out_of_stock').length
  const discontinued = catalogItems.filter(i => i.status === 'discontinued').length
  const prices = catalogItems.map(i => i.price).filter(p => p > 0)
  const averagePrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0

  // Order stats
  const orders = await db
    .select()
    .from(schema.deviceOrders)
    .where(eq(schema.deviceOrders.orgId, orgId))
    .orderBy(desc(schema.deviceOrders.createdAt))

  const pendingApproval = orders.filter(o => o.status === 'pending_approval').length
  const inProgress = orders.filter(o => ['approved', 'ordered', 'shipped'].includes(o.status)).length
  const delivered = orders.filter(o => o.status === 'delivered').length
  const cancelled = orders.filter(o => o.status === 'cancelled').length
  const totalSpend = orders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.totalPrice, 0)
  const averageOrderValue = orders.length > 0 ? Math.round(totalSpend / orders.filter(o => o.status !== 'cancelled').length) : 0

  // Orders by month (last 6 months)
  const ordersByMonth: Array<{ month: string; count: number; spend: number }> = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)
    const monthStr = monthStart.toISOString().slice(0, 7)

    const monthOrders = orders.filter(o => {
      const created = new Date(o.createdAt)
      return created >= monthStart && created <= monthEnd && o.status !== 'cancelled'
    })

    ordersByMonth.push({
      month: monthStr,
      count: monthOrders.length,
      spend: monthOrders.reduce((sum, o) => sum + o.totalPrice, 0),
    })
  }

  // Buyback stats
  const buybackRequests = await db
    .select()
    .from(schema.buybackRequests)
    .where(eq(schema.buybackRequests.orgId, orgId))

  const completedBuybacks = buybackRequests.filter(r => r.status === 'completed')
  const pendingBuybacks = buybackRequests.filter(r => ['submitted', 'evaluating', 'quote_sent', 'accepted'].includes(r.status))
  const totalBuybackValue = completedBuybacks.reduce((sum, r) => sum + (r.buybackPrice ?? 0), 0)
  const averageBuybackValue = completedBuybacks.length > 0 ? Math.round(totalBuybackValue / completedBuybacks.length) : 0

  const byCondition: Record<string, number> = {}
  for (const req of buybackRequests) {
    byCondition[req.condition] = (byCondition[req.condition] ?? 0) + 1
  }

  // Popular devices
  const orderCountByItem = new Map<string, number>()
  for (const order of orders.filter(o => o.status !== 'cancelled')) {
    const current = orderCountByItem.get(order.catalogItemId) ?? 0
    orderCountByItem.set(order.catalogItemId, current + order.quantity)
  }

  const popularDevices: Array<{ itemId: string; name: string; orderCount: number }> = []
  for (const [itemId, orderCount] of orderCountByItem.entries()) {
    const item = catalogItems.find(i => i.id === itemId)
    popularDevices.push({
      itemId,
      name: item?.name ?? 'Unknown',
      orderCount,
    })
  }
  popularDevices.sort((a, b) => b.orderCount - a.orderCount)

  // Spend by department
  const spendByDept = new Map<string, number>()
  for (const order of orders.filter(o => o.status !== 'cancelled')) {
    const [recipient] = await db
      .select({ departmentId: schema.employees.departmentId })
      .from(schema.employees)
      .where(eq(schema.employees.id, order.forEmployeeId))
      .limit(1)

    const deptId = recipient?.departmentId ?? 'unassigned'
    const current = spendByDept.get(deptId) ?? 0
    spendByDept.set(deptId, current + order.totalPrice)
  }

  const spendByDepartment: Array<{ departmentId: string; departmentName: string; totalSpend: number }> = []
  for (const [deptId, totalSpendVal] of spendByDept.entries()) {
    let deptName = 'Unassigned'
    if (deptId !== 'unassigned') {
      const [dept] = await db
        .select({ name: schema.departments.name })
        .from(schema.departments)
        .where(eq(schema.departments.id, deptId))
        .limit(1)
      deptName = dept?.name ?? 'Unknown'
    }
    spendByDepartment.push({ departmentId: deptId, departmentName: deptName, totalSpend: totalSpendVal })
  }
  spendByDepartment.sort((a, b) => b.totalSpend - a.totalSpend)

  return {
    catalog: {
      totalItems: catalogItems.length,
      availableItems,
      outOfStock,
      discontinued,
      averagePrice,
      priceRange: {
        min: prices.length > 0 ? Math.min(...prices) : 0,
        max: prices.length > 0 ? Math.max(...prices) : 0,
      },
    },
    orders: {
      totalOrders: orders.length,
      pendingApproval,
      inProgress,
      delivered,
      cancelled,
      totalSpend,
      averageOrderValue,
      ordersByMonth,
    },
    buyback: {
      totalRequests: buybackRequests.length,
      completed: completedBuybacks.length,
      pending: pendingBuybacks.length,
      totalBuybackValue,
      averageBuybackValue,
      byCondition,
    },
    popularDevices: popularDevices.slice(0, 10),
    spendByDepartment,
  }
}
