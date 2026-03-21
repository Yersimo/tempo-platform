import { NextRequest, NextResponse } from 'next/server'
import {
  executeReport,
  executeCrossModuleReport,
  buildCustomReport,
  executePivotReport,
  analyzeTrends,
  analyzeCohorts,
  generateBenchmarks,
  exportReportData,
  REPORT_TEMPLATES,
} from '@/lib/analytics-engine'
import type { ReportDefinition, PivotConfig, TrendConfig, CohortConfig } from '@/lib/analytics-engine'

// GET /api/analytics - List templates, run cross-module report, trends, benchmarks, cohorts
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
        const overviewResult = await executeCrossModuleReport(orgId)
        return NextResponse.json(overviewResult)

      case 'trends': {
        const metric = url.searchParams.get('metric')
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        const granularity = url.searchParams.get('granularity') || 'month'

        if (!metric || !startDate || !endDate) {
          return NextResponse.json(
            { error: 'Missing required params: metric, startDate, endDate' },
            { status: 400 }
          )
        }

        const trendConfig: TrendConfig = {
          metric,
          startDate,
          endDate,
          granularity: granularity as TrendConfig['granularity'],
        }
        const trendResult = await analyzeTrends(orgId, trendConfig)
        return NextResponse.json(trendResult)
      }

      case 'benchmarks': {
        const benchmarkResult = await generateBenchmarks(orgId)
        return NextResponse.json(benchmarkResult)
      }

      case 'cohorts': {
        const cohortType = (url.searchParams.get('cohortType') || 'quarterly') as CohortConfig['cohortType']
        const metric = (url.searchParams.get('metric') || 'retention') as CohortConfig['metric']
        const periodsToTrack = url.searchParams.get('periodsToTrack')

        const cohortConfig: CohortConfig = {
          cohortType,
          metric,
          ...(periodsToTrack ? { periodsToTrack: parseInt(periodsToTrack, 10) } : {}),
        }
        const cohortResult = await analyzeCohorts(orgId, cohortConfig)
        return NextResponse.json(cohortResult)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/analytics] Error:', error)
    return NextResponse.json({ error: 'Analytics query failed' }, { status: 500 })
  }
}

// POST /api/analytics - Execute report, custom report, pivot, export
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const action = body.action || 'execute'

    switch (action) {
      case 'execute': {
        const { reportId } = body
        if (!reportId) {
          return NextResponse.json({ error: 'reportId is required' }, { status: 400 })
        }
        const result = await executeReport(orgId, reportId)
        return NextResponse.json(result)
      }

      case 'custom-report': {
        const { definition } = body
        if (!definition) {
          return NextResponse.json({ error: 'definition is required' }, { status: 400 })
        }
        const result = await buildCustomReport(orgId, definition as ReportDefinition)
        return NextResponse.json(result)
      }

      case 'pivot': {
        const { config } = body
        if (!config) {
          return NextResponse.json({ error: 'config is required' }, { status: 400 })
        }
        const result = await executePivotReport(orgId, config as PivotConfig)
        return NextResponse.json(result)
      }

      case 'export': {
        const { reportId, format } = body
        if (!reportId || !format) {
          return NextResponse.json({ error: 'reportId and format are required' }, { status: 400 })
        }
        // Execute the report first, then export
        const reportResult = await executeReport(orgId, reportId)
        const exported = exportReportData(reportResult, format)

        // For CSV, return as downloadable file
        if (format === 'csv') {
          return new NextResponse(exported, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="${reportId}-${new Date().toISOString().split('T')[0]}.csv"`,
            },
          })
        }

        return NextResponse.json({ data: exported, format })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/analytics] Error:', error)
    return NextResponse.json({ error: error?.message || 'Report execution failed' }, { status: 500 })
  }
}
