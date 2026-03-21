import { NextRequest, NextResponse } from 'next/server'
import {
  createLinkToken,
  exchangePublicToken,
  syncTransactions,
} from '@/lib/services/bank-feed'

// ---------------------------------------------------------------------------
// POST /api/bank-feed/plaid — Plaid-specific operations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      case 'link-token': {
        const userId = employeeId || orgId
        const result = await createLinkToken(orgId, userId)
        return NextResponse.json(result)
      }

      case 'exchange': {
        if (!body.publicToken || !body.institutionId || !body.institutionName) {
          return NextResponse.json(
            { error: 'Missing publicToken, institutionId, or institutionName' },
            { status: 400 }
          )
        }
        const result = await exchangePublicToken(
          orgId,
          body.publicToken,
          body.institutionId,
          body.institutionName
        )
        return NextResponse.json(result)
      }

      case 'sync': {
        if (!body.connectionId) {
          return NextResponse.json({ error: 'Missing connectionId' }, { status: 400 })
        }
        const result = await syncTransactions(orgId, body.connectionId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/bank-feed/plaid] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
