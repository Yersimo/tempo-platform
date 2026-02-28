import { NextRequest, NextResponse } from 'next/server'

// GET /api/headcount - Retrieve headcount plans, positions, budget items
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview': {
        return NextResponse.json({
          message: 'Headcount planning overview',
          orgId,
        })
      }

      case 'plans': {
        return NextResponse.json({
          message: 'Headcount plans list',
          orgId,
        })
      }

      case 'positions': {
        const planId = url.searchParams.get('planId')
        return NextResponse.json({
          message: 'Headcount positions',
          orgId,
          planId,
        })
      }

      case 'budget': {
        const positionId = url.searchParams.get('positionId')
        return NextResponse.json({
          message: 'Budget items',
          orgId,
          positionId,
        })
      }

      case 'forecast': {
        const planId = url.searchParams.get('planId')
        const months = parseInt(url.searchParams.get('months') || '12')
        return NextResponse.json({
          message: 'Headcount forecast',
          orgId,
          planId,
          months,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/headcount] Error:', error)
    return NextResponse.json({ error: 'Headcount query failed' }, { status: 500 })
  }
}

// POST /api/headcount - Create/update plans, positions, budget items, approvals
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-plan': {
        const { name, fiscalYear, totalBudget, currency } = body
        if (!name || !fiscalYear) {
          return NextResponse.json({ error: 'name and fiscalYear are required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Plan created',
          plan: { name, fiscalYear, totalBudget, currency },
        })
      }

      case 'create-position': {
        const { planId, departmentId, jobTitle, level, type, priority } = body
        if (!planId || !departmentId || !jobTitle) {
          return NextResponse.json({ error: 'planId, departmentId, and jobTitle are required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Position created',
          position: { planId, departmentId, jobTitle, level, type, priority },
        })
      }

      case 'approve-position': {
        const { positionId, approvedBy, comments } = body
        if (!positionId) {
          return NextResponse.json({ error: 'positionId is required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Position approved',
          positionId,
          approvedBy,
          comments,
        })
      }

      case 'reject-position': {
        const { positionId: rejectId, rejectedBy, reason } = body
        if (!rejectId) {
          return NextResponse.json({ error: 'positionId is required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Position rejected',
          positionId: rejectId,
          rejectedBy,
          reason,
        })
      }

      case 'update-budget': {
        const { positionId: budgetPosId, items } = body
        if (!budgetPosId || !items?.length) {
          return NextResponse.json({ error: 'positionId and items are required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Budget updated',
          positionId: budgetPosId,
          itemCount: items.length,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/headcount] Error:', error)
    return NextResponse.json({ error: 'Headcount operation failed' }, { status: 500 })
  }
}
