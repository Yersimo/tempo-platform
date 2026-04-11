import { NextRequest, NextResponse } from 'next/server'
import {
  reportAcademyUsage,
  getAcademyUsageSummary,
  checkAcademyLimits,
  getAcademyPlanLimits,
} from '@/lib/academy-billing'

// GET /api/academy/billing?action=usage-summary
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'usage-summary'

    switch (action) {
      case 'usage-summary': {
        const data = await getAcademyUsageSummary(orgId)
        return NextResponse.json({ data })
      }

      case 'plan-limits': {
        const data = await getAcademyPlanLimits(orgId)
        return NextResponse.json({ data })
      }

      case 'check-limits': {
        const data = await checkAcademyLimits(orgId)
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: usage-summary, plan-limits, check-limits` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[Academy Billing] GET Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Billing query failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

// POST /api/academy/billing
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'report-usage': {
        const { academyId } = body
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }

        // Check limits before reporting
        const limits = await checkAcademyLimits(orgId)
        const result = await reportAcademyUsage(orgId, academyId)

        return NextResponse.json({
          data: {
            ...result,
            limitsCheck: limits,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: report-usage` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[Academy Billing] POST Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json(
      { error: 'Billing operation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
