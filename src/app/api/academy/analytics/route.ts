import { NextRequest, NextResponse } from 'next/server'
import {
  getAcademyAnalytics,
  getCohortComparison,
  getParticipantAnalytics,
  getCourseAnalytics,
  getEngagementTimeline,
  getTopPerformers,
  getAtRiskParticipants,
  exportAnalyticsCSV,
} from '@/lib/academy-analytics'

// GET /api/academy/analytics?action=overview&academyId=...
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'overview'
    const academyId = url.searchParams.get('academyId') || ''
    const participantId = url.searchParams.get('participantId') || ''
    const courseId = url.searchParams.get('courseId') || ''
    const from = url.searchParams.get('from') || undefined
    const to = url.searchParams.get('to') || undefined
    const period = (url.searchParams.get('period') || 'daily') as 'daily' | 'weekly' | 'monthly'
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const reportType = (url.searchParams.get('reportType') || 'overview') as any

    const dateRange = (from || to) ? { from, to } : undefined

    switch (action) {
      // ─── Full analytics overview ───────────────────────────────
      case 'overview': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const data = await getAcademyAnalytics(orgId, academyId, dateRange)
        return NextResponse.json({ data })
      }

      // ─── Cohort comparison ─────────────────────────────────────
      case 'cohort-comparison': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const data = await getCohortComparison(orgId, academyId)
        return NextResponse.json({ data })
      }

      // ─── Individual participant deep dive ──────────────────────
      case 'participant-detail': {
        if (!participantId) {
          return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        }
        const data = await getParticipantAnalytics(orgId, participantId)
        if (!data) {
          return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
        }
        return NextResponse.json({ data })
      }

      // ─── Per-course analytics ──────────────────────────────────
      case 'course-detail': {
        if (!academyId || !courseId) {
          return NextResponse.json({ error: 'academyId and courseId required' }, { status: 400 })
        }
        const data = await getCourseAnalytics(orgId, academyId, courseId)
        if (!data) {
          return NextResponse.json({ error: 'Course not found in academy' }, { status: 404 })
        }
        return NextResponse.json({ data })
      }

      // ─── Engagement timeline ───────────────────────────────────
      case 'engagement-timeline': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
          return NextResponse.json({ error: 'period must be daily, weekly, or monthly' }, { status: 400 })
        }
        const data = await getEngagementTimeline(orgId, academyId, period)
        return NextResponse.json({ data })
      }

      // ─── Top performers ────────────────────────────────────────
      case 'top-performers': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const data = await getTopPerformers(orgId, academyId, Math.min(limit, 100))
        return NextResponse.json({ data })
      }

      // ─── At-risk participants ──────────────────────────────────
      case 'at-risk': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const data = await getAtRiskParticipants(orgId, academyId)
        return NextResponse.json({ data })
      }

      // ─── CSV export ────────────────────────────────────────────
      case 'export-csv': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }
        const validTypes = ['overview', 'participants', 'progress', 'submissions', 'cohorts']
        if (!validTypes.includes(reportType)) {
          return NextResponse.json(
            { error: `reportType must be one of: ${validTypes.join(', ')}` },
            { status: 400 },
          )
        }
        const csvData = await exportAnalyticsCSV(orgId, academyId, reportType)

        // Build CSV string
        const escapeCsv = (val: string) => {
          if (val.includes(',') || val.includes('"') || val.includes('\n')) {
            return `"${val.replace(/"/g, '""')}"`
          }
          return val
        }

        const csvLines = [
          csvData.headers.map(escapeCsv).join(','),
          ...csvData.rows.map(row => row.map(escapeCsv).join(',')),
        ]
        const csvString = csvLines.join('\n')

        return new NextResponse(csvString, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv; charset=utf-8',
            'Content-Disposition': `attachment; filename="${csvData.filename}"`,
          },
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: overview, cohort-comparison, participant-detail, course-detail, engagement-timeline, top-performers, at-risk, export-csv` },
          { status: 400 },
        )
    }
  } catch (error) {
    console.error('[Academy Analytics] Error:', error)
    return NextResponse.json(
      { error: 'Analytics query failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    )
  }
}
