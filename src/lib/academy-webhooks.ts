/**
 * Academy Webhooks — Dispatch and manage webhook subscriptions for academy events.
 *
 * Supports HMAC-SHA256 signed payloads, automatic retries (up to 3 attempts),
 * and auto-deactivation after 10 consecutive failures.
 *
 * Events:
 *   participant.enrolled, participant.completed, course.completed,
 *   assignment.submitted, assignment.graded, certificate.issued, session.attended
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import * as crypto from 'crypto'

// ============================================================
// CONSTANTS
// ============================================================

export const WEBHOOK_EVENTS = [
  'participant.enrolled',
  'participant.completed',
  'course.completed',
  'assignment.submitted',
  'assignment.graded',
  'certificate.issued',
  'session.attended',
] as const

export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number]

const MAX_CONSECUTIVE_FAILURES = 10
const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAYS_MS = [1000, 5000, 15000] // backoff: 1s, 5s, 15s

// ============================================================
// CRUD
// ============================================================

/**
 * Register a new webhook subscription for an academy.
 * Auto-generates HMAC secret if not provided.
 */
export async function registerWebhook(
  orgId: string,
  academyId: string,
  url: string,
  events: string[],
  secret?: string,
) {
  const validEvents = events.filter((e) => WEBHOOK_EVENTS.includes(e as WebhookEvent))
  if (validEvents.length === 0) {
    throw new Error('At least one valid event is required')
  }

  const webhookSecret = secret || crypto.randomBytes(32).toString('hex')

  const [webhook] = await db
    .insert(schema.academyWebhooks)
    .values({
      orgId,
      academyId,
      url,
      secret: webhookSecret,
      events: validEvents,
      status: 'active',
      failCount: 0,
    })
    .returning()

  return webhook
}

/**
 * Update an existing webhook's url, events, status, or secret.
 */
export async function updateWebhook(
  orgId: string,
  webhookId: string,
  updates: {
    url?: string
    events?: string[]
    status?: 'active' | 'inactive' | 'failed'
    secret?: string
  },
) {
  const setValues: Record<string, unknown> = { updatedAt: new Date() }

  if (updates.url !== undefined) setValues.url = updates.url
  if (updates.secret !== undefined) setValues.secret = updates.secret
  if (updates.status !== undefined) {
    setValues.status = updates.status
    // Reset fail count when reactivating
    if (updates.status === 'active') setValues.failCount = 0
  }
  if (updates.events !== undefined) {
    const validEvents = updates.events.filter((e) => WEBHOOK_EVENTS.includes(e as WebhookEvent))
    if (validEvents.length === 0) throw new Error('At least one valid event is required')
    setValues.events = validEvents
  }

  const [webhook] = await db
    .update(schema.academyWebhooks)
    .set(setValues)
    .where(and(eq(schema.academyWebhooks.id, webhookId), eq(schema.academyWebhooks.orgId, orgId)))
    .returning()

  return webhook || null
}

/**
 * Delete a webhook and its logs.
 */
export async function deleteWebhook(orgId: string, webhookId: string) {
  const [deleted] = await db
    .delete(schema.academyWebhooks)
    .where(and(eq(schema.academyWebhooks.id, webhookId), eq(schema.academyWebhooks.orgId, orgId)))
    .returning()

  return deleted || null
}

/**
 * List all webhooks for an academy.
 */
export async function getWebhooks(orgId: string, academyId: string) {
  return db
    .select()
    .from(schema.academyWebhooks)
    .where(and(eq(schema.academyWebhooks.orgId, orgId), eq(schema.academyWebhooks.academyId, academyId)))
    .orderBy(desc(schema.academyWebhooks.createdAt))
}

/**
 * Get delivery logs for a specific webhook.
 */
export async function getWebhookLogs(orgId: string, webhookId: string, limit = 50) {
  return db
    .select()
    .from(schema.academyWebhookLogs)
    .where(and(eq(schema.academyWebhookLogs.orgId, orgId), eq(schema.academyWebhookLogs.webhookId, webhookId)))
    .orderBy(desc(schema.academyWebhookLogs.createdAt))
    .limit(Math.min(limit, 200))
}

// ============================================================
// DISPATCH
// ============================================================

/**
 * Dispatch an event to all active webhooks for an academy that are subscribed to the event.
 * Returns an array of delivery results.
 */
export async function dispatchWebhookEvent(
  orgId: string,
  academyId: string,
  event: WebhookEvent,
  payload: Record<string, unknown>,
) {
  const webhooks = await db
    .select()
    .from(schema.academyWebhooks)
    .where(
      and(
        eq(schema.academyWebhooks.orgId, orgId),
        eq(schema.academyWebhooks.academyId, academyId),
        eq(schema.academyWebhooks.status, 'active'),
      ),
    )

  // Filter to webhooks subscribed to this event
  const subscribedWebhooks = webhooks.filter((wh) => {
    const events = (wh.events as string[]) || []
    return events.includes(event)
  })

  const results = await Promise.allSettled(
    subscribedWebhooks.map((wh) => sendWebhookWithRetry(orgId, wh, event, payload)),
  )

  return results.map((r, i) => {
    if (r.status === 'fulfilled') {
      return { webhookId: subscribedWebhooks[i].id, ...r.value }
    }
    return {
      webhookId: subscribedWebhooks[i].id,
      success: false,
      error: (r as PromiseRejectedResult).reason?.message,
    }
  })
}

// ============================================================
// SEND + RETRY
// ============================================================

/**
 * Send a webhook event with HMAC-SHA256 signature and retry logic.
 */
async function sendWebhookWithRetry(
  orgId: string,
  webhook: typeof schema.academyWebhooks.$inferSelect,
  event: WebhookEvent,
  payload: Record<string, unknown>,
) {
  let lastResult: { success: boolean; status?: number; body?: string } = { success: false }

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    if (attempt > 1) {
      await sleep(RETRY_DELAYS_MS[attempt - 1] || 15000)
    }

    const result = await sendWebhook(webhook, event, payload)

    // Log every attempt
    await db.insert(schema.academyWebhookLogs).values({
      orgId,
      webhookId: webhook.id,
      event,
      payload,
      responseStatus: result.status,
      responseBody: result.body?.slice(0, 2000) || null,
      success: result.success,
      attemptNumber: attempt,
    })

    lastResult = result

    if (result.success) {
      // Reset fail count on success and update lastTriggeredAt
      await db
        .update(schema.academyWebhooks)
        .set({
          failCount: 0,
          lastTriggeredAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(schema.academyWebhooks.id, webhook.id))

      return { success: true, status: result.status, attempts: attempt }
    }
  }

  // All retries exhausted — increment fail count
  const newFailCount = (webhook.failCount || 0) + 1
  const newStatus = newFailCount >= MAX_CONSECUTIVE_FAILURES ? 'failed' : webhook.status

  await db
    .update(schema.academyWebhooks)
    .set({
      failCount: newFailCount,
      status: newStatus as 'active' | 'inactive' | 'failed',
      lastTriggeredAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.academyWebhooks.id, webhook.id))

  return {
    success: false,
    status: lastResult.status,
    attempts: MAX_RETRY_ATTEMPTS,
    deactivated: newFailCount >= MAX_CONSECUTIVE_FAILURES,
  }
}

/**
 * Execute a single webhook delivery with HMAC-SHA256 signature.
 *
 * Headers sent:
 *   Content-Type: application/json
 *   X-Webhook-Event: <event name>
 *   X-Webhook-Signature: sha256=<hex digest>
 *   X-Webhook-Timestamp: <unix epoch seconds>
 *   X-Webhook-Id: <delivery uuid>
 */
export async function sendWebhook(
  webhook: typeof schema.academyWebhooks.$inferSelect,
  event: string,
  payload: Record<string, unknown>,
): Promise<{ success: boolean; status?: number; body?: string }> {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const deliveryId = crypto.randomUUID()

  const body = JSON.stringify({
    event,
    timestamp: Number(timestamp),
    deliveryId,
    data: payload,
  })

  // HMAC-SHA256: sign "timestamp.body" with the webhook secret
  const signaturePayload = `${timestamp}.${body}`
  const signature = crypto.createHmac('sha256', webhook.secret).update(signaturePayload).digest('hex')

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Event': event,
        'X-Webhook-Signature': `sha256=${signature}`,
        'X-Webhook-Timestamp': timestamp,
        'X-Webhook-Id': deliveryId,
        'User-Agent': 'Tempo-Academy-Webhooks/1.0',
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const responseBody = await response.text().catch(() => '')
    const success = response.status >= 200 && response.status < 300

    return { success, status: response.status, body: responseBody }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, body: message }
  }
}

/**
 * Send a test ping to verify webhook connectivity. Does not count toward fail count.
 */
export async function sendTestPing(
  orgId: string,
  webhookId: string,
): Promise<{ success: boolean; status?: number; body?: string }> {
  const [webhook] = await db
    .select()
    .from(schema.academyWebhooks)
    .where(and(eq(schema.academyWebhooks.id, webhookId), eq(schema.academyWebhooks.orgId, orgId)))

  if (!webhook) throw new Error('Webhook not found')

  const result = await sendWebhook(webhook, 'ping', {
    message: 'Test ping from Tempo Academy',
    timestamp: new Date().toISOString(),
  })

  // Log the test ping
  await db.insert(schema.academyWebhookLogs).values({
    orgId,
    webhookId: webhook.id,
    event: 'ping',
    payload: { message: 'Test ping from Tempo Academy' },
    responseStatus: result.status,
    responseBody: result.body?.slice(0, 2000) || null,
    success: result.success,
    attemptNumber: 1,
  })

  return result
}

// ============================================================
// HELPERS
// ============================================================

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
