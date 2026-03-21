import { NextRequest, NextResponse } from 'next/server'
import {
  createRevenueContract,
  addPerformanceObligation,
  calculateTransactionPrice,
  allocateTransactionPrice,
  recognizeRevenue,
  generateRevenueWaterfall,
  getDeferredRevenueBalance,
  getRevenueRecognitionSummary,
} from '@/lib/services/revenue-recognition'

// ---------------------------------------------------------------------------
// GET /api/revenue — query revenue recognition data by action
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
      case 'summary': {
        const result = await getRevenueRecognitionSummary(orgId)
        return NextResponse.json(result)
      }

      case 'waterfall': {
        const startPeriod = url.searchParams.get('startPeriod')
        const endPeriod = url.searchParams.get('endPeriod')
        if (!startPeriod || !endPeriod) {
          return NextResponse.json({ error: 'Missing required params: startPeriod, endPeriod' }, { status: 400 })
        }
        const result = await generateRevenueWaterfall(orgId, startPeriod, endPeriod)
        return NextResponse.json(result)
      }

      case 'deferred-balance': {
        const period = url.searchParams.get('period')
        if (!period) {
          return NextResponse.json({ error: 'Missing required param: period' }, { status: 400 })
        }
        const result = await getDeferredRevenueBalance(orgId, period)
        return NextResponse.json(result)
      }

      case 'transaction-price': {
        const contractId = url.searchParams.get('contractId')
        if (!contractId) {
          return NextResponse.json({ error: 'Missing required param: contractId' }, { status: 400 })
        }
        const result = await calculateTransactionPrice(contractId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/revenue — mutate revenue data by action
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
      case 'create-contract': {
        if (!data.contractNumber || !data.customerName || !data.startDate || !data.endDate || !data.totalValue) {
          return NextResponse.json(
            { error: 'Missing required fields: contractNumber, customerName, startDate, endDate, totalValue' },
            { status: 400 },
          )
        }
        const result = await createRevenueContract({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'add-obligation': {
        if (!data.contractId || !data.description || !data.type || !data.standaloneSellingPrice || !data.recognitionMethod || !data.startDate || !data.endDate) {
          return NextResponse.json(
            { error: 'Missing required fields for performance obligation' },
            { status: 400 },
          )
        }
        const result = await addPerformanceObligation(data)
        return NextResponse.json(result, { status: 201 })
      }

      case 'allocate-price': {
        if (!data.contractId) {
          return NextResponse.json({ error: 'Missing required field: contractId' }, { status: 400 })
        }
        const result = await allocateTransactionPrice(data.contractId)
        return NextResponse.json(result)
      }

      case 'recognize': {
        if (!data.obligationId) {
          return NextResponse.json({ error: 'Missing required field: obligationId' }, { status: 400 })
        }
        const result = await recognizeRevenue(data.obligationId, orgId)
        return NextResponse.json(result, { status: 201 })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
