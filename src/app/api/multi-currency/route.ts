import { NextRequest, NextResponse } from 'next/server'
import {
  createCurrencyAccount,
  convertCurrency,
  getExchangeRate,
  getHistoricalRates,
  calculateFXImpact,
  getMultiCurrencyDashboard,
  reconcileFXTransactions,
  hedgingCalculator,
  getCurrencyExposure,
  generateFXReport,
  setFXAlerts,
  getRealtimeRates,
} from '@/lib/services/multi-currency'

// ---------------------------------------------------------------------------
// GET /api/multi-currency — query currency data by action
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
        const result = await getMultiCurrencyDashboard(orgId)
        return NextResponse.json(result)
      }

      case 'rate': {
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        if (!from || !to) {
          return NextResponse.json({ error: 'Missing required params: from, to' }, { status: 400 })
        }
        const result = await getExchangeRate(from, to)
        return NextResponse.json(result)
      }

      case 'rates': {
        const result = await getRealtimeRates()
        return NextResponse.json(result)
      }

      case 'historical': {
        const from = url.searchParams.get('from')
        const to = url.searchParams.get('to')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!from || !to || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required params: from, to, startDate, endDate' },
            { status: 400 },
          )
        }
        const result = await getHistoricalRates(orgId, from, to, new Date(startDate), new Date(endDate))
        return NextResponse.json(result)
      }

      case 'exposure': {
        const result = await getCurrencyExposure(orgId)
        return NextResponse.json({ exposures: result })
      }

      case 'fx-impact': {
        const result = await calculateFXImpact(orgId)
        return NextResponse.json({ impacts: result })
      }

      case 'hedging': {
        const currency = url.searchParams.get('currency')
        if (!currency) {
          return NextResponse.json({ error: 'Missing required param: currency' }, { status: 400 })
        }
        const result = await hedgingCalculator(orgId, currency)
        return NextResponse.json(result)
      }

      case 'reconcile': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required params: startDate, endDate' }, { status: 400 })
        }
        const result = await reconcileFXTransactions(orgId, new Date(startDate), new Date(endDate))
        return NextResponse.json(result)
      }

      case 'report': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required params: startDate, endDate' }, { status: 400 })
        }
        const result = await generateFXReport(orgId, new Date(startDate), new Date(endDate))
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
// POST /api/multi-currency — mutate currency data by action
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
      case 'create-account': {
        if (!data.currency) {
          return NextResponse.json({ error: 'Missing required field: currency' }, { status: 400 })
        }
        const result = await createCurrencyAccount({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'convert': {
        if (!data.fromCurrency || !data.toCurrency || !data.fromAmount) {
          return NextResponse.json(
            { error: 'Missing required fields: fromCurrency, toCurrency, fromAmount' },
            { status: 400 },
          )
        }
        const result = await convertCurrency({ orgId, ...data })
        return NextResponse.json(result)
      }

      case 'set-alerts': {
        if (!data.alerts || !Array.isArray(data.alerts)) {
          return NextResponse.json(
            { error: 'Missing required field: alerts (array of { currency, targetRate, direction })' },
            { status: 400 },
          )
        }
        const result = await setFXAlerts(orgId, data.alerts)
        return NextResponse.json({ alerts: result }, { status: 201 })
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
