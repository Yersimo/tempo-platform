import { NextRequest, NextResponse } from 'next/server'
import {
  getConnections,
  getAccounts,
  getTransactions,
  autoMatchTransactions,
  confirmMatch,
  excludeTransaction,
  unmatchTransaction,
  disconnectBank,
  getReconciliationSummary,
  importTransactionsFromCSV,
  createMatchingRule,
  updateMatchingRule,
  deleteMatchingRule,
} from '@/lib/services/bank-feed'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/bank-feed — query bank feed data by action
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
      case 'connections': {
        const connections = await getConnections(orgId)
        return NextResponse.json({ data: connections })
      }

      case 'accounts': {
        const connectionId = url.searchParams.get('connectionId') || undefined
        const accounts = await getAccounts(orgId, connectionId)
        return NextResponse.json({ data: accounts })
      }

      case 'transactions': {
        const accountId = url.searchParams.get('accountId') || undefined
        const matchStatus = url.searchParams.get('matchStatus') || undefined
        const limit = parseInt(url.searchParams.get('limit') || '100')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const result = await getTransactions(orgId, accountId, { matchStatus, limit, offset })
        return NextResponse.json(result)
      }

      case 'summary': {
        const accountId = url.searchParams.get('accountId') || undefined
        const from = url.searchParams.get('from') || undefined
        const to = url.searchParams.get('to') || undefined
        const dateRange = from && to ? { from, to } : undefined
        const summary = await getReconciliationSummary(orgId, accountId, dateRange)
        return NextResponse.json(summary)
      }

      case 'rules': {
        const rules = await db.select().from(schema.reconciliationRules)
          .where(eq(schema.reconciliationRules.orgId, orgId))
        return NextResponse.json({ data: rules })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/bank-feed] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/bank-feed — mutations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      case 'auto-match': {
        const result = await autoMatchTransactions(orgId, body.accountId)
        return NextResponse.json(result)
      }

      case 'confirm-match': {
        if (!body.transactionId || !body.entityType || !body.entityId) {
          return NextResponse.json({ error: 'Missing transactionId, entityType, or entityId' }, { status: 400 })
        }
        await confirmMatch(orgId, body.transactionId, body.entityType, body.entityId)
        return NextResponse.json({ success: true })
      }

      case 'exclude': {
        if (!body.transactionId) {
          return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
        }
        await excludeTransaction(orgId, body.transactionId)
        return NextResponse.json({ success: true })
      }

      case 'unmatch': {
        if (!body.transactionId) {
          return NextResponse.json({ error: 'Missing transactionId' }, { status: 400 })
        }
        await unmatchTransaction(orgId, body.transactionId)
        return NextResponse.json({ success: true })
      }

      case 'disconnect': {
        if (!body.connectionId) {
          return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }
        await disconnectBank(orgId, body.connectionId)
        return NextResponse.json({ success: true })
      }

      case 'import-csv': {
        if (!body.accountId || !body.transactions) {
          return NextResponse.json({ error: 'Missing accountId or transactions' }, { status: 400 })
        }
        const result = await importTransactionsFromCSV(orgId, body.accountId, body.transactions)
        return NextResponse.json(result)
      }

      case 'create-rule': {
        const rule = await createMatchingRule(orgId, {
          name: body.name,
          description: body.description,
          matchField: body.matchField,
          matchOperator: body.matchOperator,
          matchValue: body.matchValue,
          targetEntityType: body.targetEntityType,
          priority: body.priority,
        })
        return NextResponse.json({ data: rule })
      }

      case 'update-rule': {
        if (!body.ruleId) {
          return NextResponse.json({ error: 'Missing ruleId' }, { status: 400 })
        }
        await updateMatchingRule(orgId, body.ruleId, body.data || {})
        return NextResponse.json({ success: true })
      }

      case 'delete-rule': {
        if (!body.ruleId) {
          return NextResponse.json({ error: 'Missing ruleId' }, { status: 400 })
        }
        await deleteMatchingRule(orgId, body.ruleId)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/bank-feed] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
