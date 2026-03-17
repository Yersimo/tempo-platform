import { NextRequest, NextResponse } from 'next/server'
import {
  registerWebhook,
  updateWebhook,
  deleteWebhook,
  getWebhooks,
  getWebhookLogs,
  sendTestPing,
  WEBHOOK_EVENTS,
} from '@/lib/academy-webhooks'

// ============================================================
// GET /api/academy/webhooks?action=list|logs
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'
    const academyId = url.searchParams.get('academyId') || ''
    const webhookId = url.searchParams.get('webhookId') || ''
    const limit = parseInt(url.searchParams.get('limit') || '50')

    switch (action) {
      case 'list': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const webhooks = await getWebhooks(orgId, academyId)
        // Strip secrets from response
        const safe = webhooks.map((wh) => ({
          ...wh,
          secret: wh.secret.slice(0, 8) + '...',
        }))
        return NextResponse.json({ data: safe })
      }

      case 'logs': {
        if (!webhookId) return NextResponse.json({ error: 'webhookId required' }, { status: 400 })
        const logs = await getWebhookLogs(orgId, webhookId, limit)
        return NextResponse.json({ data: logs })
      }

      case 'events': {
        return NextResponse.json({ data: WEBHOOK_EVENTS })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy Webhooks GET]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// ============================================================
// POST /api/academy/webhooks
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create': {
        if (!data.academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        if (!data.url?.trim()) return NextResponse.json({ error: 'url required' }, { status: 400 })
        if (!data.events?.length) return NextResponse.json({ error: 'At least one event required' }, { status: 400 })

        // Basic URL validation
        try {
          const parsed = new URL(data.url)
          if (!['http:', 'https:'].includes(parsed.protocol)) {
            return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
          }
        } catch {
          return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
        }

        const webhook = await registerWebhook(orgId, data.academyId, data.url, data.events, data.secret)
        return NextResponse.json(
          {
            data: {
              ...webhook,
              // Return full secret only on creation so the client can store it
              secret: webhook.secret,
            },
          },
          { status: 201 },
        )
      }

      case 'update': {
        if (!data.webhookId) return NextResponse.json({ error: 'webhookId required' }, { status: 400 })

        if (data.url) {
          try {
            const parsed = new URL(data.url)
            if (!['http:', 'https:'].includes(parsed.protocol)) {
              return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
            }
          } catch {
            return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
          }
        }

        const webhook = await updateWebhook(orgId, data.webhookId, {
          url: data.url,
          events: data.events,
          status: data.status,
          secret: data.secret,
        })
        if (!webhook) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({
          data: { ...webhook, secret: webhook.secret.slice(0, 8) + '...' },
        })
      }

      case 'delete': {
        if (!data.webhookId) return NextResponse.json({ error: 'webhookId required' }, { status: 400 })
        const deleted = await deleteWebhook(orgId, data.webhookId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: { id: deleted.id } })
      }

      case 'test': {
        if (!data.webhookId) return NextResponse.json({ error: 'webhookId required' }, { status: 400 })
        const result = await sendTestPing(orgId, data.webhookId)
        return NextResponse.json({ data: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy Webhooks POST]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
