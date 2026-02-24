import { NextRequest, NextResponse } from 'next/server'
import { processWebhook, AVAILABLE_TRIGGERS, AVAILABLE_ACTIONS } from '@/lib/workflow-triggers'

// GET /api/webhooks - List available triggers and actions
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id')
  if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json({
    triggers: AVAILABLE_TRIGGERS,
    actions: AVAILABLE_ACTIONS,
  })
}

// POST /api/webhooks - Receive webhook from third-party
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
    }

    const body = await request.json()
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
