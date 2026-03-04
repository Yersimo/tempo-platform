import { NextRequest, NextResponse } from 'next/server'
import {
  addCatalogItem,
  updateCatalogItem,
  removeCatalogItem,
  createOrder,
  approveOrder,
  fulfillOrder,
  cancelOrder,
  getOrderStatus,
  trackShipment,
  submitBuybackRequest,
  evaluateDevice,
  sendBuybackQuote,
  acceptBuyback,
  rejectBuyback,
  completeBuyback,
  getStoreCatalog,
  getDeviceRecommendations,
  getStoreAnalytics,
  checkRoleEligibility,
  estimateBuybackValue,
} from '@/lib/services/device-store'

// GET /api/device-store - Catalog, order status, analytics, recommendations
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'catalog'

    switch (action) {
      case 'catalog': {
        const category = url.searchParams.get('category') || undefined
        const platform = url.searchParams.get('platform') || undefined
        const status = url.searchParams.get('status') as any || undefined
        const employeeRole = url.searchParams.get('employeeRole') || undefined
        const minPrice = url.searchParams.get('minPrice') ? parseInt(url.searchParams.get('minPrice')!) : undefined
        const maxPrice = url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!) : undefined
        const result = await getStoreCatalog(orgId, { category, platform, status, employeeRole, minPrice, maxPrice })
        return NextResponse.json(result)
      }

      case 'order-status': {
        const orderId = url.searchParams.get('orderId')
        if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        const result = await getOrderStatus(orgId, orderId)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const result = await getStoreAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'recommendations': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await getDeviceRecommendations(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'eligibility': {
        const catalogItemId = url.searchParams.get('catalogItemId')
        const employeeId = url.searchParams.get('employeeId')
        if (!catalogItemId || !employeeId) return NextResponse.json({ error: 'catalogItemId and employeeId are required' }, { status: 400 })
        const result = await checkRoleEligibility(orgId, catalogItemId, employeeId)
        return NextResponse.json(result)
      }

      case 'estimate-buyback': {
        const originalPrice = parseInt(url.searchParams.get('originalPrice') || '0')
        const condition = (url.searchParams.get('condition') || 'good') as any
        const ageMonths = parseInt(url.searchParams.get('ageMonths') || '12')
        const result = await estimateBuybackValue(originalPrice, condition, ageMonths)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/device-store] Error:', error)
    return NextResponse.json({ error: error?.message || 'Device store query failed' }, { status: 500 })
  }
}

// POST /api/device-store - Catalog CRUD, orders, buyback lifecycle
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      // Catalog
      case 'add-catalog-item': {
        const { item } = body
        if (!item) return NextResponse.json({ error: 'item data is required' }, { status: 400 })
        const result = await addCatalogItem(orgId, item)
        return NextResponse.json(result)
      }

      case 'update-catalog-item': {
        const { itemId, updates } = body
        if (!itemId || !updates) return NextResponse.json({ error: 'itemId and updates are required' }, { status: 400 })
        const result = await updateCatalogItem(orgId, itemId, updates)
        return NextResponse.json(result)
      }

      case 'remove-catalog-item': {
        const { itemId } = body
        if (!itemId) return NextResponse.json({ error: 'itemId is required' }, { status: 400 })
        const result = await removeCatalogItem(orgId, itemId)
        return NextResponse.json(result)
      }

      // Orders
      case 'create-order': {
        const { order } = body
        if (!order) return NextResponse.json({ error: 'order data is required' }, { status: 400 })
        const result = await createOrder(orgId, order)
        return NextResponse.json(result)
      }

      case 'approve-order': {
        const { orderId, approverId } = body
        if (!orderId || !approverId) return NextResponse.json({ error: 'orderId and approverId are required' }, { status: 400 })
        const result = await approveOrder(orgId, orderId, approverId)
        return NextResponse.json(result)
      }

      case 'fulfill-order': {
        const { orderId, trackingNumber } = body
        if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        const result = await fulfillOrder(orgId, orderId, trackingNumber)
        return NextResponse.json(result)
      }

      case 'cancel-order': {
        const { orderId, reason } = body
        if (!orderId) return NextResponse.json({ error: 'orderId is required' }, { status: 400 })
        const result = await cancelOrder(orgId, orderId, reason)
        return NextResponse.json(result)
      }

      case 'track-shipment': {
        const { orderId, trackingNumber, status } = body
        if (!orderId || !trackingNumber) return NextResponse.json({ error: 'orderId and trackingNumber are required' }, { status: 400 })
        const result = await trackShipment(orgId, orderId, trackingNumber, status)
        return NextResponse.json(result)
      }

      // Buyback
      case 'submit-buyback': {
        const { employeeId, request: reqData } = body
        if (!employeeId || !reqData) return NextResponse.json({ error: 'employeeId and request are required' }, { status: 400 })
        const result = await submitBuybackRequest(orgId, employeeId, reqData)
        return NextResponse.json(result)
      }

      case 'evaluate-device': {
        const { requestId, evaluatorId, evaluationNotes } = body
        if (!requestId || !evaluatorId) return NextResponse.json({ error: 'requestId and evaluatorId are required' }, { status: 400 })
        const result = await evaluateDevice(orgId, requestId, evaluatorId, evaluationNotes ?? '')
        return NextResponse.json(result)
      }

      case 'send-buyback-quote': {
        const { requestId, buybackPrice } = body
        if (!requestId || buybackPrice === undefined) return NextResponse.json({ error: 'requestId and buybackPrice are required' }, { status: 400 })
        const result = await sendBuybackQuote(orgId, requestId, buybackPrice)
        return NextResponse.json(result)
      }

      case 'accept-buyback': {
        const { requestId } = body
        if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
        const result = await acceptBuyback(orgId, requestId)
        return NextResponse.json(result)
      }

      case 'reject-buyback': {
        const { requestId, reason } = body
        if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
        const result = await rejectBuyback(orgId, requestId, reason)
        return NextResponse.json(result)
      }

      case 'complete-buyback': {
        const { requestId } = body
        if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
        const result = await completeBuyback(orgId, requestId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/device-store] Error:', error)
    return NextResponse.json({ error: error?.message || 'Device store operation failed' }, { status: 500 })
  }
}
