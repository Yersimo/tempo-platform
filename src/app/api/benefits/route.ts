import { NextRequest, NextResponse } from 'next/server'
import {
  getAvailablePlans,
  comparePlans,
  generateBenefitsQuote,
  getQuote,
  selectOrgPlans,
  getOrgSelectedPlans,
  enrollEmployee,
  getEnrollmentSummary,
  getBenefitsAnalytics,
} from '@/lib/benefits-engine'

// GET /api/benefits - Browse plans, quotes, enrollments, analytics
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'plans'

    switch (action) {
      case 'plans': {
        const category = url.searchParams.get('category') || undefined
        const network = url.searchParams.get('network') || undefined
        const state = url.searchParams.get('state') || undefined
        const carrier = url.searchParams.get('carrier') || undefined
        const hsaEligible = url.searchParams.get('hsa') === 'true'
        const maxCost = url.searchParams.get('maxCost')
        const result = await getAvailablePlans({
          category: category as any,
          network: network as any,
          state: state || undefined,
          carrier: carrier || undefined,
          hsaEligible: hsaEligible || undefined,
          maxEmployeeCost: maxCost ? parseInt(maxCost) : undefined,
        })
        return NextResponse.json({ plans: result, total: result.length })
      }

      case 'selected': {
        const result = await getOrgSelectedPlans(orgId)
        return NextResponse.json({ plans: result })
      }

      case 'quote': {
        const quoteId = url.searchParams.get('quoteId')
        if (!quoteId) return NextResponse.json({ error: 'quoteId is required' }, { status: 400 })
        const result = await getQuote(orgId, quoteId)
        if (!result) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
        return NextResponse.json(result)
      }

      case 'enrollment': {
        const result = await getEnrollmentSummary(orgId)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const result = await getBenefitsAnalytics(orgId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/benefits] Error:', error)
    return NextResponse.json({ error: 'Benefits query failed' }, { status: 500 })
  }
}

// POST /api/benefits - Compare, quote, select plans, enroll
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'compare': {
        const { planIds, employeeCount, tier } = body
        if (!planIds?.length || !employeeCount) {
          return NextResponse.json({ error: 'planIds and employeeCount are required' }, { status: 400 })
        }
        const result = await comparePlans(planIds, employeeCount, tier)
        return NextResponse.json(result)
      }

      case 'generate-quote': {
        const { employeeCount, zipCode, state, industryCode, averageAge, categories } = body
        if (!employeeCount || !zipCode || !state) {
          return NextResponse.json({ error: 'employeeCount, zipCode, and state are required' }, { status: 400 })
        }
        const result = await generateBenefitsQuote(orgId, {
          employeeCount, zipCode, state, industryCode, averageAge, categories,
        })
        return NextResponse.json(result)
      }

      case 'select-plans': {
        const { planIds } = body
        if (!planIds?.length) {
          return NextResponse.json({ error: 'planIds is required' }, { status: 400 })
        }
        const result = await selectOrgPlans(orgId, planIds)
        return NextResponse.json(result)
      }

      case 'enroll': {
        const { employeeId, planId, tier } = body
        if (!employeeId || !planId || !tier) {
          return NextResponse.json({ error: 'employeeId, planId, and tier are required' }, { status: 400 })
        }
        const result = await enrollEmployee(orgId, employeeId, planId, tier)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/benefits] Error:', error)
    return NextResponse.json({ error: error?.message || 'Benefits operation failed' }, { status: 500 })
  }
}
