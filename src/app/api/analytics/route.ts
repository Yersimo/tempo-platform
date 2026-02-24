import { NextRequest, NextResponse } from 'next/server'
import { executeReport, executeCrossModuleReport, REPORT_TEMPLATES } from '@/lib/analytics-engine'

// GET /api/analytics - List templates or run cross-module report
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'templates'

    switch (action) {
      case 'templates':
        return NextResponse.json({
          templates: REPORT_TEMPLATES.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description,
            modules: t.modules,
            visualization: t.visualization,
          })),
        })

      case 'overview':
        const result = await executeCrossModuleReport(orgId)
        return NextResponse.json(result)

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/analytics] Error:', error)
    return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 })
  }
}

// POST /api/analytics - Execute a report
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { reportId } = body

    if (!reportId) {
      return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
    }

    const result = await executeReport(orgId, reportId)
    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[POST /api/analytics] Error:', error)
    return NextResponse.json({ error: error?.message || 'Report execution failed' }, { status: 500 })
  }
}
