import { NextRequest, NextResponse } from 'next/server'
import { processWebhook, AVAILABLE_TRIGGERS, AVAILABLE_ACTIONS } from '@/lib/workflow-triggers'
import {
  getDeliveryLogs,
  getEndpointHealth,
  retryDelivery,
  getWebhookStats,
  getRetryQueue,
  getCircuitBreakerState,
} from '@/lib/services/webhook-dispatcher'

// GET /api/webhooks - List triggers/actions, or handle action-based queries
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id')
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  // ── action: delivery-logs ──────────────────────────────────────────
  if (action === 'delivery-logs') {
    try {
      const endpointId = searchParams.get('endpointId') || undefined
      const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

      const logs = getDeliveryLogs(orgId, endpointId, limit)

      return NextResponse.json({
        logs,
        total: logs.length,
        limit,
      })
    } catch (error) {
      console.error('[GET /api/webhooks?action=delivery-logs] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch delivery logs' }, { status: 500 })
    }
  }

  // ── action: endpoint-health ────────────────────────────────────────
  if (action === 'endpoint-health') {
    try {
      const endpointId = searchParams.get('endpointId')
      if (!endpointId) {
        return NextResponse.json({ error: 'endpointId is required' }, { status: 400 })
      }

      const health = await getEndpointHealth(orgId, endpointId)
      if (!health) {
        return NextResponse.json({ error: 'Endpoint not found' }, { status: 404 })
      }

      return NextResponse.json(health)
    } catch (error) {
      console.error('[GET /api/webhooks?action=endpoint-health] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch endpoint health' }, { status: 500 })
    }
  }

  // ── action: stats ──────────────────────────────────────────────────
  if (action === 'stats') {
    try {
      const stats = await getWebhookStats(orgId)
      return NextResponse.json(stats)
    } catch (error) {
      console.error('[GET /api/webhooks?action=stats] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch webhook stats' }, { status: 500 })
    }
  }

  // ── action: retry-queue ────────────────────────────────────────────
  if (action === 'retry-queue') {
    try {
      const queue = getRetryQueue(orgId)
      return NextResponse.json({ queue, total: queue.length })
    } catch (error) {
      console.error('[GET /api/webhooks?action=retry-queue] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch retry queue' }, { status: 500 })
    }
  }

  // ── action: circuit-state ──────────────────────────────────────────
  if (action === 'circuit-state') {
    try {
      const endpointId = searchParams.get('endpointId')
      if (!endpointId) {
        return NextResponse.json({ error: 'endpointId is required' }, { status: 400 })
      }

      const state = getCircuitBreakerState(endpointId)
      return NextResponse.json(state)
    } catch (error) {
      console.error('[GET /api/webhooks?action=circuit-state] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch circuit state' }, { status: 500 })
    }
  }

  // ── Default: list available triggers and actions ───────────────────
  return NextResponse.json({
    triggers: AVAILABLE_TRIGGERS,
    actions: AVAILABLE_ACTIONS,
  })
}

// POST /api/webhooks - Receive webhook from third-party, or handle action-based mutations
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // ── action: retry ──────────────────────────────────────────────────
    if (action === 'retry') {
      const { deliveryLogId } = body
      if (!deliveryLogId) {
        return NextResponse.json({ error: 'deliveryLogId is required' }, { status: 400 })
      }

      const result = await retryDelivery(deliveryLogId)

      if (!result.success && result.error) {
        return NextResponse.json({ error: result.error, success: false }, { status: 400 })
      }

      return NextResponse.json({
        success: result.success,
        newLogId: result.newLogId,
        error: result.error || null,
      })
    }

    // ── Default: receive webhook from third-party ────────────────────
    const { source, event, data, metadata } = body

    if (!source || !event) {
      return NextResponse.json({ error: 'source and event are required' }, { status: 400 })
    }

    const result = await processWebhook(orgId, source, {
      event,
      source,
      timestamp: new Date().toISOString(),
      data: data || {},
      metadata,
    })

    return NextResponse.json({
      received: true,
      triggered: result.triggered,
      workflowIds: result.workflowIds,
    })
  } catch (error) {
    console.error('[POST /api/webhooks] Error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
