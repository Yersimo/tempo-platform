import { NextRequest, NextResponse } from 'next/server'
import {
  createBoardReport, updateBoardReport, listBoardReports, getBoardReport, deleteBoardReport,
  generateQuarterlyBoardPack, generateAnnualReview, generateKPIDashboard, generateCompensationReview,
} from '@/lib/services/board-reporting'

// ---------------------------------------------------------------------------
// POST /api/board-reports — Board Reporting operations
// GET  /api/board-reports — Query board reports
// ---------------------------------------------------------------------------

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: [] })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'
    const reportId = url.searchParams.get('reportId') || ''

    switch (action) {
      case 'list': {
        const reports = await listBoardReports(orgId)
        return NextResponse.json({ data: reports })
      }
      case 'get': {
        if (!reportId) return NextResponse.json({ error: 'reportId required' }, { status: 400 })
        const report = await getBoardReport(reportId)
        return NextResponse.json({ data: report })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/board-reports]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: null })

    const body = await request.json()
    const { action, ...payload } = body

    switch (action) {
      case 'create': {
        const report = await createBoardReport(orgId, payload)
        return NextResponse.json({ data: report })
      }
      case 'update': {
        const report = await updateBoardReport(payload.reportId, payload)
        return NextResponse.json({ data: report })
      }
      case 'delete': {
        await deleteBoardReport(payload.reportId)
        return NextResponse.json({ data: { success: true } })
      }
      case 'generate-quarterly': {
        const report = await generateQuarterlyBoardPack(orgId, payload.quarter, payload.year)
        return NextResponse.json({ data: report })
      }
      case 'generate-annual': {
        const report = await generateAnnualReview(orgId, payload.year)
        return NextResponse.json({ data: report })
      }
      case 'generate-kpi': {
        const report = await generateKPIDashboard(orgId, payload.period)
        return NextResponse.json({ data: report })
      }
      case 'generate-compensation': {
        const report = await generateCompensationReview(orgId, payload.year)
        return NextResponse.json({ data: report })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/board-reports]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
