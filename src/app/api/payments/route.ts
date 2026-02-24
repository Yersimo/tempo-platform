import { NextRequest, NextResponse } from 'next/server'
import {
  initiatePayrollPayments,
  processPaymentBatch,
  getPaymentBatch,
  getPaymentBatches,
  cancelPaymentBatch,
  estimatePayrollPayments,
  getFundingSources,
  addFundingSource,
  verifyFundingSource,
  getPaymentSchedule,
  setPaymentSchedule,
  getAvailableRails,
  getRailForCountry,
} from '@/lib/payment-initiation'

// GET /api/payments - Batches, funding, schedule, rails
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'batches'

    switch (action) {
      case 'batches': {
        const result = await getPaymentBatches(orgId)
        return NextResponse.json({ batches: result })
      }

      case 'batch': {
        const batchId = url.searchParams.get('batchId')
        if (!batchId) return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
        const result = await getPaymentBatch(orgId, batchId)
        if (!result) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        return NextResponse.json(result)
      }

      case 'funding': {
        const result = await getFundingSources(orgId)
        return NextResponse.json({ sources: result })
      }

      case 'schedule': {
        const result = await getPaymentSchedule(orgId)
        return NextResponse.json({ schedule: result })
      }

      case 'rails': {
        return NextResponse.json({ rails: getAvailableRails() })
      }

      case 'country-rail': {
        const country = url.searchParams.get('country') || 'US'
        return NextResponse.json(getRailForCountry(country))
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/payments] Error:', error)
    return NextResponse.json({ error: 'Payments query failed' }, { status: 500 })
  }
}

// POST /api/payments - Initiate, process, cancel, estimate, funding, schedule
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'initiate': {
        const { payrollRunId, period, employees } = body
        if (!payrollRunId || !period || !employees?.length) {
          return NextResponse.json({ error: 'payrollRunId, period, and employees are required' }, { status: 400 })
        }
        const result = await initiatePayrollPayments(orgId, payrollRunId, period, employees)
        return NextResponse.json(result)
      }

      case 'process': {
        const { batchId } = body
        if (!batchId) return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
        const result = await processPaymentBatch(orgId, batchId)
        return NextResponse.json(result)
      }

      case 'cancel': {
        const { batchId } = body
        if (!batchId) return NextResponse.json({ error: 'batchId is required' }, { status: 400 })
        const result = await cancelPaymentBatch(orgId, batchId)
        return NextResponse.json(result)
      }

      case 'estimate': {
        const { employees } = body
        if (!employees?.length) {
          return NextResponse.json({ error: 'employees array is required' }, { status: 400 })
        }
        const result = await estimatePayrollPayments(orgId, employees)
        return NextResponse.json(result)
      }

      case 'add-funding': {
        const { source } = body
        if (!source) return NextResponse.json({ error: 'source is required' }, { status: 400 })
        const result = await addFundingSource(orgId, source)
        return NextResponse.json(result)
      }

      case 'verify-funding': {
        const { sourceId } = body
        if (!sourceId) return NextResponse.json({ error: 'sourceId is required' }, { status: 400 })
        const result = await verifyFundingSource(orgId, sourceId)
        return NextResponse.json(result)
      }

      case 'set-schedule': {
        const { schedule } = body
        if (!schedule) return NextResponse.json({ error: 'schedule is required' }, { status: 400 })
        const result = await setPaymentSchedule(orgId, schedule)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/payments] Error:', error)
    return NextResponse.json({ error: error?.message || 'Payment operation failed' }, { status: 500 })
  }
}
