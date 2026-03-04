import { NextRequest, NextResponse } from 'next/server'
import {
  issueCard,
  activateCard,
  freezeCard,
  cancelCard,
  setSpendLimits,
  getCategoryLimits,
  processTransaction,
  reconcileTransactions,
  matchReceipt,
  getCardStatement,
  calculateCashback,
  getSpendAnalytics,
  flagSuspiciousActivity,
  exportTransactions,
  bulkIssueCards,
  getCompanySpendOverview,
} from '@/lib/services/corporate-cards'

// ---------------------------------------------------------------------------
// GET /api/corporate-cards — query card data by action
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
      case 'overview': {
        const result = await getCompanySpendOverview(orgId)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const result = await getSpendAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'statement': {
        const cardId = url.searchParams.get('cardId')
        const year = url.searchParams.get('year')
        const month = url.searchParams.get('month')
        if (!cardId || !year || !month) {
          return NextResponse.json({ error: 'Missing required params: cardId, year, month' }, { status: 400 })
        }
        const result = await getCardStatement(cardId, orgId, parseInt(year), parseInt(month))
        return NextResponse.json(result)
      }

      case 'cashback': {
        const cardId = url.searchParams.get('cardId')
        if (!cardId) {
          return NextResponse.json({ error: 'Missing required param: cardId' }, { status: 400 })
        }
        const result = await calculateCashback(cardId, orgId)
        return NextResponse.json(result)
      }

      case 'limits': {
        const cardId = url.searchParams.get('cardId')
        if (!cardId) {
          return NextResponse.json({ error: 'Missing required param: cardId' }, { status: 400 })
        }
        const result = await getCategoryLimits(cardId, orgId)
        return NextResponse.json({ limits: result })
      }

      case 'suspicious': {
        const cardId = url.searchParams.get('cardId')
        if (!cardId) {
          return NextResponse.json({ error: 'Missing required param: cardId' }, { status: 400 })
        }
        const result = await flagSuspiciousActivity(orgId, cardId)
        return NextResponse.json({ flags: result })
      }

      case 'export': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const cardId = url.searchParams.get('cardId') ?? undefined
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required params: startDate, endDate' }, { status: 400 })
        }
        const result = await exportTransactions(orgId, new Date(startDate), new Date(endDate), cardId)
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
// POST /api/corporate-cards — mutate card data by action
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
      case 'issue': {
        const result = await issueCard({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'activate': {
        if (!data.cardId) {
          return NextResponse.json({ error: 'Missing required field: cardId' }, { status: 400 })
        }
        const result = await activateCard(data.cardId, orgId)
        return NextResponse.json(result)
      }

      case 'freeze': {
        if (!data.cardId) {
          return NextResponse.json({ error: 'Missing required field: cardId' }, { status: 400 })
        }
        const result = await freezeCard(data.cardId, orgId)
        return NextResponse.json(result)
      }

      case 'cancel': {
        if (!data.cardId) {
          return NextResponse.json({ error: 'Missing required field: cardId' }, { status: 400 })
        }
        const result = await cancelCard(data.cardId, orgId)
        return NextResponse.json(result)
      }

      case 'set-limits': {
        if (!data.cardId) {
          return NextResponse.json({ error: 'Missing required field: cardId' }, { status: 400 })
        }
        const result = await setSpendLimits({ orgId, ...data })
        return NextResponse.json(result)
      }

      case 'process-transaction': {
        if (!data.cardId || !data.amount || !data.merchantName) {
          return NextResponse.json(
            { error: 'Missing required fields: cardId, amount, merchantName' },
            { status: 400 },
          )
        }
        const result = await processTransaction({
          orgId,
          ...data,
          transactedAt: data.transactedAt ? new Date(data.transactedAt) : new Date(),
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'reconcile': {
        if (!data.transactionIds || !Array.isArray(data.transactionIds)) {
          return NextResponse.json({ error: 'Missing required field: transactionIds (array)' }, { status: 400 })
        }
        const result = await reconcileTransactions(orgId, data.transactionIds)
        return NextResponse.json({ reconciled: result })
      }

      case 'match-receipt': {
        if (!data.transactionId || !data.receiptUrl) {
          return NextResponse.json(
            { error: 'Missing required fields: transactionId, receiptUrl' },
            { status: 400 },
          )
        }
        const result = await matchReceipt(orgId, data.transactionId, data.receiptUrl, data.expenseReportId)
        return NextResponse.json(result)
      }

      case 'bulk-issue': {
        if (!data.cards || !Array.isArray(data.cards)) {
          return NextResponse.json({ error: 'Missing required field: cards (array)' }, { status: 400 })
        }
        const inputs = data.cards.map((c: any) => ({ orgId, ...c }))
        const result = await bulkIssueCards(inputs)
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
