import { NextRequest, NextResponse } from 'next/server'
import {
  computeHeadcountAnalytics,
  computePayrollAnalytics,
  computeTurnoverAnalytics,
  computeRecruitingAnalytics,
  computeCompensationAnalytics,
  computeAllAnalytics,
} from '@/lib/analytics/data-warehouse'

// ---------------------------------------------------------------------------
// GET /api/analytics/warehouse
//
// Server-side analytics queries that run directly against the database.
//
// Query params:
//   metric  = headcount | payroll | turnover | recruiting | compensation | all
//   start   = ISO date string  (default: 12 months ago)
//   end     = ISO date string  (default: today)
//
// Examples:
//   GET /api/analytics/warehouse?metric=headcount&start=2025-01-01&end=2026-03-22
//   GET /api/analytics/warehouse?metric=payroll&start=2025-01-01&end=2026-03-22
//   GET /api/analytics/warehouse?metric=turnover&start=2025-01-01&end=2026-03-22
//   GET /api/analytics/warehouse?metric=recruiting
//   GET /api/analytics/warehouse?metric=compensation
//   GET /api/analytics/warehouse?metric=all
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized — missing x-org-id header' }, { status: 401 })
    }

    const url = new URL(request.url)
    const metric = url.searchParams.get('metric') || 'all'

    // Default date range: last 12 months
    const now = new Date()
    const twelveMonthsAgo = new Date(now)
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)

    const startParam = url.searchParams.get('start') || twelveMonthsAgo.toISOString().slice(0, 10)
    const endParam = url.searchParams.get('end') || now.toISOString().slice(0, 10)
    const dateRange = { start: startParam, end: endParam }

    switch (metric) {
      case 'headcount': {
        const result = await computeHeadcountAnalytics(orgId, dateRange)
        return NextResponse.json(result)
      }
      case 'payroll': {
        const result = await computePayrollAnalytics(orgId, dateRange)
        return NextResponse.json(result)
      }
      case 'turnover': {
        const result = await computeTurnoverAnalytics(orgId, dateRange)
        return NextResponse.json(result)
      }
      case 'recruiting': {
        const result = await computeRecruitingAnalytics(orgId)
        return NextResponse.json(result)
      }
      case 'compensation': {
        const result = await computeCompensationAnalytics(orgId)
        return NextResponse.json(result)
      }
      case 'all': {
        const results = await computeAllAnalytics(orgId, dateRange)
        return NextResponse.json({
          dateRange,
          metrics: results,
          computedAt: new Date().toISOString(),
        })
      }
      default:
        return NextResponse.json(
          {
            error: `Unknown metric: ${metric}`,
            validMetrics: ['headcount', 'payroll', 'turnover', 'recruiting', 'compensation', 'all'],
          },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('[analytics/warehouse] Error:', error)
    return NextResponse.json(
      { error: 'Analytics query failed', details: error.message },
      { status: 500 },
    )
  }
}
