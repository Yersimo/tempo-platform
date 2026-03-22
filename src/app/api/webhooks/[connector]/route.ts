import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/services/integration-sync'
import { handleWebhook as handleQBWebhook } from '@/lib/integrations/quickbooks'
import { handleXeroWebhook } from '@/lib/integrations/xero'
import { handleSlackEvent } from '@/lib/integrations/slack'
import { handleBambooWebhook } from '@/lib/integrations/bamboohr'

// ============================================================
// Generic Webhook Receiver for Integration Connectors
//
// POST /api/webhooks/[connector]
//   Validates signatures and routes to correct connector handler
//
// Supports: QuickBooks, Xero, Slack, BambooHR
// ============================================================

// In-memory webhook log (production would use DB)
interface WebhookLog {
  id: string
  connector: string
  receivedAt: string
  verified: boolean
  eventCount: number
  events: Array<{ type: string; id: string }>
  headers: Record<string, string>
  error?: string
}

const webhookLogs: WebhookLog[] = []

function logWebhook(entry: Omit<WebhookLog, 'id' | 'receivedAt'>): void {
  webhookLogs.push({
    id: `whlog-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    receivedAt: new Date().toISOString(),
    ...entry,
  })
  // Keep only last 200 logs in memory
  if (webhookLogs.length > 200) {
    webhookLogs.splice(0, webhookLogs.length - 200)
  }
}

// Connector-specific webhook secrets (would come from DB in production)
function getWebhookSecret(connector: string, orgId: string): string | null {
  // In production, this would query the database for the org's webhook secret
  // for the given connector. For now, check environment variables.
  const envKey = `${connector.toUpperCase().replace(/-/g, '_')}_WEBHOOK_SECRET`
  return process.env[envKey] || null
}

// ── POST handler ─────────────────────────────────────────────

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ connector: string }> }
) {
  const { connector } = await params
  const orgId = request.headers.get('x-org-id') || 'default'

  try {
    const rawBody = await request.text()
    const webhookSecret = getWebhookSecret(connector, orgId)

    // Route to the correct connector handler
    switch (connector) {
      // ── QuickBooks ───────────────────────────────────────
      case 'quickbooks': {
        const signature = request.headers.get('intuit-signature') || ''
        if (!webhookSecret) {
          // Acknowledge without verification in demo mode
          logWebhook({
            connector, verified: false, eventCount: 0, events: [],
            headers: { 'intuit-signature': signature },
            error: 'No webhook secret configured - demo mode',
          })
          return NextResponse.json({ received: true, demo: true })
        }

        const result = await handleQBWebhook(rawBody, signature, webhookSecret)
        logWebhook({
          connector,
          verified: result.verified,
          eventCount: result.events.length,
          events: result.events.map(e => ({ type: `${e.entity}.${e.operation}`, id: e.id })),
          headers: { 'intuit-signature': signature },
        })

        if (!result.verified) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        return NextResponse.json({
          received: true,
          eventsProcessed: result.events.length,
          events: result.events,
        })
      }

      // ── Xero ─────────────────────────────────────────────
      case 'xero': {
        const signature = request.headers.get('x-xero-signature') || ''

        // Xero sends an Intent to Receive check first
        if (request.headers.get('x-xero-signature') === null && rawBody) {
          // This is likely a verification challenge
          return new NextResponse(rawBody, { status: 200 })
        }

        if (!webhookSecret) {
          logWebhook({
            connector, verified: false, eventCount: 0, events: [],
            headers: { 'x-xero-signature': signature },
            error: 'No webhook secret configured - demo mode',
          })
          return NextResponse.json({ received: true, demo: true })
        }

        const result = await handleXeroWebhook(rawBody, signature, webhookSecret)
        logWebhook({
          connector,
          verified: result.verified,
          eventCount: result.events.length,
          events: result.events.map(e => ({ type: `${e.category}.${e.type}`, id: e.resourceId })),
          headers: { 'x-xero-signature': signature },
        })

        if (!result.verified) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        return NextResponse.json({
          received: true,
          eventsProcessed: result.events.length,
        })
      }

      // ── Slack ────────────────────────────────────────────
      case 'slack': {
        const signature = request.headers.get('x-slack-signature') || ''
        const timestamp = request.headers.get('x-slack-request-timestamp') || ''

        // Check for replay attacks (timestamp older than 5 minutes)
        const requestTime = parseInt(timestamp)
        if (Math.abs(Math.floor(Date.now() / 1000) - requestTime) > 300) {
          return NextResponse.json({ error: 'Request too old' }, { status: 403 })
        }

        if (!webhookSecret) {
          // Check for URL verification challenge even without secret
          try {
            const body = JSON.parse(rawBody)
            if (body.type === 'url_verification') {
              return NextResponse.json({ challenge: body.challenge })
            }
          } catch {
            // Not JSON, ignore
          }

          logWebhook({
            connector, verified: false, eventCount: 0, events: [],
            headers: { 'x-slack-signature': signature, 'x-slack-request-timestamp': timestamp },
            error: 'No webhook secret configured - demo mode',
          })
          return NextResponse.json({ received: true, demo: true })
        }

        const result = await handleSlackEvent(rawBody, signature, timestamp, webhookSecret)

        // Handle URL verification challenge
        if (result.challenge) {
          return NextResponse.json({ challenge: result.challenge })
        }

        logWebhook({
          connector,
          verified: result.verified,
          eventCount: result.event ? 1 : 0,
          events: result.event ? [{ type: result.event.type, id: result.event.ts || '' }] : [],
          headers: { 'x-slack-signature': signature, 'x-slack-request-timestamp': timestamp },
        })

        if (!result.verified) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        return NextResponse.json({
          received: true,
          event: result.event?.type,
        })
      }

      // ── BambooHR ─────────────────────────────────────────
      case 'bamboohr': {
        const signature = request.headers.get('x-bamboohr-signature') || ''

        if (!webhookSecret) {
          logWebhook({
            connector, verified: false, eventCount: 0, events: [],
            headers: { 'x-bamboohr-signature': signature },
            error: 'No webhook secret configured - demo mode',
          })
          return NextResponse.json({ received: true, demo: true })
        }

        const result = await handleBambooWebhook(rawBody, signature, webhookSecret)
        logWebhook({
          connector,
          verified: result.verified,
          eventCount: result.events.length,
          events: result.events.map(e => ({ type: `employee.${e.action}`, id: e.employeeId })),
          headers: { 'x-bamboohr-signature': signature },
        })

        if (!result.verified) {
          return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
        }

        return NextResponse.json({
          received: true,
          eventsProcessed: result.events.length,
          events: result.events,
        })
      }

      // ── Unknown Connector ────────────────────────────────
      default: {
        logWebhook({
          connector,
          verified: false,
          eventCount: 0,
          events: [],
          headers: {},
          error: `Unknown connector: ${connector}`,
        })
        return NextResponse.json(
          { error: `Unknown connector: ${connector}. Supported: quickbooks, xero, slack, bamboohr` },
          { status: 404 }
        )
      }
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook processing failed'
    console.error(`[POST /api/webhooks/${connector}] Error:`, error)

    logWebhook({
      connector,
      verified: false,
      eventCount: 0,
      events: [],
      headers: {},
      error: message,
    })

    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ── GET handler (webhook logs for debugging) ─────────────────

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ connector: string }> }
) {
  const { connector } = await params
  const orgId = request.headers.get('x-org-id')
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200)

  const connectorLogs = connector === 'all'
    ? webhookLogs.slice(-limit).reverse()
    : webhookLogs.filter(l => l.connector === connector).slice(-limit).reverse()

  return NextResponse.json({
    connector,
    logs: connectorLogs,
    total: connectorLogs.length,
  })
}
