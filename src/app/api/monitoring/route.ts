import { NextRequest, NextResponse } from 'next/server'
import {
  performHealthCheck,
  calculateSLA,
  getUptimeHistory,
  getPerformanceMetrics,
} from '@/lib/services/monitoring'

// ---------------------------------------------------------------------------
// GET /api/monitoring
//
// Query params:
//   action = health | sla | uptime | performance
//   period = last_24h | last_7d | last_30d | last_90d   (for action=sla)
//   days   = number                                      (for action=uptime)
//
// Examples:
//   GET /api/monitoring?action=health
//   GET /api/monitoring?action=sla&period=last_30d
//   GET /api/monitoring?action=uptime&days=30
//   GET /api/monitoring?action=performance
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'health'

    switch (action) {
      case 'health': {
        const metrics = await performHealthCheck()
        const overallStatus = metrics.some((m) => m.status === 'down')
          ? 'down'
          : metrics.some((m) => m.status === 'degraded')
            ? 'degraded'
            : 'healthy'
        return NextResponse.json({
          status: overallStatus,
          services: metrics,
          checkedAt: new Date().toISOString(),
        })
      }

      case 'sla': {
        const period = (url.searchParams.get('period') || 'last_30d') as
          | 'last_24h'
          | 'last_7d'
          | 'last_30d'
          | 'last_90d'
        const validPeriods = ['last_24h', 'last_7d', 'last_30d', 'last_90d']
        if (!validPeriods.includes(period)) {
          return NextResponse.json({ error: `Invalid period. Use: ${validPeriods.join(', ')}` }, { status: 400 })
        }
        const sla = calculateSLA(period)
        return NextResponse.json(sla)
      }

      case 'uptime': {
        const days = parseInt(url.searchParams.get('days') || '30', 10)
        const history = getUptimeHistory(Math.min(days, 90))
        return NextResponse.json({ days, checks: history, count: history.length })
      }

      case 'performance': {
        const metrics = getPerformanceMetrics()
        return NextResponse.json({ metrics, measuredAt: new Date().toISOString() })
      }

      default:
        return NextResponse.json(
          {
            error: `Unknown action: ${action}`,
            validActions: ['health', 'sla', 'uptime', 'performance'],
          },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('[monitoring] Error:', error)
    return NextResponse.json(
      { error: 'Monitoring check failed', details: error.message },
      { status: 500 },
    )
  }
}
