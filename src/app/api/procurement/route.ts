import { NextRequest, NextResponse } from 'next/server'
import {
  createProcurementRequest,
  approveProcurementRequest,
  createPurchaseOrder,
  updatePurchaseOrder,
  approvePurchaseOrder,
  sendPOToVendor,
  receiveItems,
  partialReceive,
  closePO,
  cancelPO,
  generatePONumber,
  getProcurementAnalytics,
  getVendorPerformance,
  checkBudgetAvailability,
  createFromTemplate,
  threeWayMatch,
} from '@/lib/services/procurement'

// ---------------------------------------------------------------------------
// GET /api/procurement — query procurement data by action
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Missing required query param: action' }, { status: 400 })
    }

    switch (action) {
      case 'analytics': {
        const result = await getProcurementAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'vendor-performance': {
        const vendorId = url.searchParams.get('vendorId')
        if (!vendorId) {
          return NextResponse.json({ error: 'Missing required param: vendorId' }, { status: 400 })
        }
        const result = await getVendorPerformance(orgId, vendorId)
        return NextResponse.json(result)
      }

      case 'budget-check': {
        const departmentId = url.searchParams.get('departmentId')
        const amount = url.searchParams.get('amount')
        if (!departmentId || !amount) {
          return NextResponse.json({ error: 'Missing required params: departmentId, amount' }, { status: 400 })
        }
        const result = await checkBudgetAvailability(orgId, departmentId, parseInt(amount))
        return NextResponse.json(result)
      }

      case 'three-way-match': {
        const poId = url.searchParams.get('poId')
        const invoiceId = url.searchParams.get('invoiceId')
        if (!poId || !invoiceId) {
          return NextResponse.json({ error: 'Missing required params: poId, invoiceId' }, { status: 400 })
        }
        const result = await threeWayMatch(orgId, poId, invoiceId)
        return NextResponse.json(result)
      }

      case 'generate-po-number': {
        const result = await generatePONumber(orgId)
        return NextResponse.json({ poNumber: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = (error as any)?.code ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// ---------------------------------------------------------------------------
// POST /api/procurement — mutate procurement data by action
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      case 'create-request': {
        if (!data.requesterId || !data.title) {
          return NextResponse.json(
            { error: 'Missing required fields: requesterId, title' },
            { status: 400 },
          )
        }
        const result = await createProcurementRequest({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'approve-request': {
        if (!data.requestId || !data.approverId || !data.decision) {
          return NextResponse.json(
            { error: 'Missing required fields: requestId, approverId, decision' },
            { status: 400 },
          )
        }
        const result = await approveProcurementRequest(data.requestId, orgId, data.approverId, data.decision)
        return NextResponse.json(result)
      }

      case 'create-po': {
        if (!data.vendorId || !data.items || !data.createdBy) {
          return NextResponse.json(
            { error: 'Missing required fields: vendorId, items, createdBy' },
            { status: 400 },
          )
        }
        const result = await createPurchaseOrder({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'update-po': {
        if (!data.poId) {
          return NextResponse.json({ error: 'Missing required field: poId' }, { status: 400 })
        }
        const { poId, ...updates } = data
        const result = await updatePurchaseOrder(poId, orgId, updates)
        return NextResponse.json(result)
      }

      case 'approve-po': {
        if (!data.poId || !data.approverId) {
          return NextResponse.json({ error: 'Missing required fields: poId, approverId' }, { status: 400 })
        }
        const result = await approvePurchaseOrder(data.poId, orgId, data.approverId)
        return NextResponse.json(result)
      }

      case 'send-to-vendor': {
        if (!data.poId) {
          return NextResponse.json({ error: 'Missing required field: poId' }, { status: 400 })
        }
        const result = await sendPOToVendor(data.poId, orgId)
        return NextResponse.json(result)
      }

      case 'receive-items': {
        if (!data.poId || !data.receivedItems || !data.receivedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: poId, receivedItems, receivedBy' },
            { status: 400 },
          )
        }
        const result = await receiveItems({ orgId, ...data })
        return NextResponse.json(result)
      }

      case 'partial-receive': {
        if (!data.poId || !data.itemId || !data.quantity || !data.receivedBy) {
          return NextResponse.json(
            { error: 'Missing required fields: poId, itemId, quantity, receivedBy' },
            { status: 400 },
          )
        }
        const result = await partialReceive(orgId, data.poId, data.itemId, data.quantity, data.receivedBy)
        return NextResponse.json(result)
      }

      case 'close-po': {
        if (!data.poId) {
          return NextResponse.json({ error: 'Missing required field: poId' }, { status: 400 })
        }
        const result = await closePO(data.poId, orgId)
        return NextResponse.json(result)
      }

      case 'cancel-po': {
        if (!data.poId) {
          return NextResponse.json({ error: 'Missing required field: poId' }, { status: 400 })
        }
        const result = await cancelPO(data.poId, orgId)
        return NextResponse.json(result)
      }

      case 'create-from-template': {
        if (!data.vendorId || !data.templateItems || !data.createdBy) {
          return NextResponse.json(
            { error: 'Missing required fields: vendorId, templateItems, createdBy' },
            { status: 400 },
          )
        }
        const result = await createFromTemplate(
          orgId,
          data.vendorId,
          data.templateItems,
          data.createdBy,
          data.overrides,
        )
        return NextResponse.json(result, { status: 201 })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = (error as any)?.code ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
