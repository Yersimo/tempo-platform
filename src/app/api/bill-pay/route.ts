import { NextRequest, NextResponse } from 'next/server'
import {
  createPayment,
  schedulePayment,
  approvePayment,
  processACHPayment,
  processWirePayment,
  processCheckPayment,
  cancelPayment,
  createRecurringPayment,
  updateRecurringSchedule,
  reconcilePayments,
  getBillPayDashboard,
  generatePaymentReport,
  validateBankDetails,
  getPaymentHistory,
} from '@/lib/services/bill-pay'

// ---------------------------------------------------------------------------
// GET /api/bill-pay — query bill pay data by action
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
      case 'dashboard': {
        const result = await getBillPayDashboard(orgId)
        return NextResponse.json(result)
      }

      case 'history': {
        const vendorId = url.searchParams.get('vendorId') ?? undefined
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
        const offset = url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined
        const result = await getPaymentHistory(orgId, { vendorId, limit, offset })
        return NextResponse.json(result)
      }

      case 'report': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required params: startDate, endDate' }, { status: 400 })
        }
        const result = await generatePaymentReport(orgId, startDate, endDate)
        return NextResponse.json(result)
      }

      case 'validate-bank': {
        const method = url.searchParams.get('method') as 'ach' | 'wire' | 'check'
        if (!method) {
          return NextResponse.json({ error: 'Missing required param: method' }, { status: 400 })
        }
        const details = {
          routingNumber: url.searchParams.get('routingNumber') ?? undefined,
          swiftCode: url.searchParams.get('swiftCode') ?? undefined,
          iban: url.searchParams.get('iban') ?? undefined,
          accountNumber: url.searchParams.get('accountNumber') ?? undefined,
        }
        const result = await validateBankDetails(method, details)
        return NextResponse.json(result)
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
// POST /api/bill-pay — mutate bill pay data by action
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
      case 'create': {
        if (!data.vendorId || !data.amount || !data.method || !data.createdBy) {
          return NextResponse.json(
            { error: 'Missing required fields: vendorId, amount, method, createdBy' },
            { status: 400 },
          )
        }
        const result = await createPayment({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'schedule': {
        if (!data.vendorId || !data.amount || !data.method || !data.createdBy || !data.scheduledDate) {
          return NextResponse.json(
            { error: 'Missing required fields: vendorId, amount, method, createdBy, scheduledDate' },
            { status: 400 },
          )
        }
        const result = await schedulePayment({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'approve': {
        if (!data.paymentId || !data.approverId) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, approverId' }, { status: 400 })
        }
        const result = await approvePayment(data.paymentId, orgId, data.approverId)
        return NextResponse.json(result)
      }

      case 'process-ach': {
        if (!data.paymentId || !data.achDetails) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, achDetails' }, { status: 400 })
        }
        const result = await processACHPayment(data.paymentId, orgId, data.achDetails)
        return NextResponse.json(result)
      }

      case 'process-wire': {
        if (!data.paymentId || !data.wireDetails) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, wireDetails' }, { status: 400 })
        }
        const result = await processWirePayment(data.paymentId, orgId, data.wireDetails)
        return NextResponse.json(result)
      }

      case 'process-check': {
        if (!data.paymentId || !data.checkDetails) {
          return NextResponse.json({ error: 'Missing required fields: paymentId, checkDetails' }, { status: 400 })
        }
        const result = await processCheckPayment(data.paymentId, orgId, data.checkDetails)
        return NextResponse.json(result)
      }

      case 'cancel': {
        if (!data.paymentId) {
          return NextResponse.json({ error: 'Missing required field: paymentId' }, { status: 400 })
        }
        const result = await cancelPayment(data.paymentId, orgId)
        return NextResponse.json(result)
      }

      case 'create-recurring': {
        if (!data.vendorId || !data.amount || !data.method || !data.frequency || !data.nextPaymentDate) {
          return NextResponse.json(
            { error: 'Missing required fields: vendorId, amount, method, frequency, nextPaymentDate' },
            { status: 400 },
          )
        }
        const result = await createRecurringPayment({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'update-recurring': {
        if (!data.scheduleId) {
          return NextResponse.json({ error: 'Missing required field: scheduleId' }, { status: 400 })
        }
        const { scheduleId, ...updates } = data
        const result = await updateRecurringSchedule(scheduleId, orgId, updates)
        return NextResponse.json(result)
      }

      case 'reconcile': {
        if (!data.reconciliations || !Array.isArray(data.reconciliations)) {
          return NextResponse.json(
            { error: 'Missing required field: reconciliations (array of { paymentId, invoiceId })' },
            { status: 400 },
          )
        }
        const result = await reconcilePayments(orgId, data.reconciliations)
        return NextResponse.json(result)
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
