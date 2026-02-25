/**
 * Webhook Delivery Engine
 *
 * Reliable outbound webhook delivery with retry logic, signature verification,
 * and delivery tracking. Used by workflow automation and integration connectors.
 */

import { db, schema } from '@/lib/db'

// ============================================================
// TYPES
// ============================================================

export interface WebhookConfig {
  id: string
  org_id: string
  url: string
  secret: string
  events: string[]
  is_active: boolean
  description?: string
  headers?: Record<string, string>
  created_at: string
}

export interface WebhookPayload {
  event: string
  timestamp: string
  org_id: string
  data: Record<string, unknown>
  webhook_id?: string
}

export interface WebhookDelivery {
  id: string
  webhook_id: string
  event: string
  payload: string
  status: 'pending' | 'delivered' | 'failed' | 'retrying'
  response_status?: number
  response_body?: string
  attempts: number
  max_attempts: number
  next_retry_at?: string
  created_at: string
  delivered_at?: string
}

export interface WebhookStats {
  total_deliveries: number
  successful: number
  failed: number
  pending: number
  avg_response_time_ms: number
}

// ============================================================
// CONSTANTS
// ============================================================

const MAX_RETRY_ATTEMPTS = 5
const RETRY_DELAYS_MS = [1000, 5000, 30000, 120000, 600000] // 1s, 5s, 30s, 2m, 10m
const DELIVERY_TIMEOUT_MS = 10000 // 10 seconds
const MAX_PAYLOAD_SIZE = 256 * 1024 // 256KB

// ============================================================
// SIGNATURE GENERATION
// ============================================================

/**
 * Generate HMAC-SHA256 signature for webhook payload verification.
 * Recipients can verify: signature = HMAC-SHA256(secret, payload_json)
 */
async function generateSignature(payload: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Generate a cryptographically random webhook secret.
 */
export function generateWebhookSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return 'whsec_' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================================
// DELIVERY ENGINE
// ============================================================

/**
 * Dispatch a webhook event to all matching subscriptions.
 */
export async function dispatchWebhookEvent(
  orgId: string,
  event: string,
  data: Record<string, unknown>,
  webhooks: WebhookConfig[]
): Promise<{ dispatched: number; errors: string[] }> {
  const matchingWebhooks = webhooks.filter(
    w => w.is_active && w.org_id === orgId && w.events.includes(event)
  )

  if (matchingWebhooks.length === 0) {
    return { dispatched: 0, errors: [] }
  }

  const errors: string[] = []
  let dispatched = 0

  for (const webhook of matchingWebhooks) {
    try {
      await deliverWebhook(webhook, event, data)
      dispatched++
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      errors.push(`Webhook ${webhook.id}: ${msg}`)
    }
  }

  return { dispatched, errors }
}

/**
 * Deliver a single webhook with retry logic.
 */
async function deliverWebhook(
  webhook: WebhookConfig,
  event: string,
  data: Record<string, unknown>,
  attempt: number = 1
): Promise<{ status: number; body: string }> {
  const payload: WebhookPayload = {
    event,
    timestamp: new Date().toISOString(),
    org_id: webhook.org_id,
    data,
    webhook_id: webhook.id,
  }

  const payloadJson = JSON.stringify(payload)

  // Check payload size
  if (payloadJson.length > MAX_PAYLOAD_SIZE) {
    throw new Error(`Payload exceeds maximum size of ${MAX_PAYLOAD_SIZE} bytes`)
  }

  // Generate signature
  const signature = await generateSignature(payloadJson, webhook.secret)

  // Build headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'Tempo-Webhooks/1.0',
    'X-Tempo-Signature': `sha256=${signature}`,
    'X-Tempo-Event': event,
    'X-Tempo-Delivery': crypto.randomUUID(),
    'X-Tempo-Timestamp': payload.timestamp,
    ...(webhook.headers || {}),
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS)

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers,
      body: payloadJson,
      signal: controller.signal,
    })

    clearTimeout(timeout)

    const responseBody = await response.text().catch(() => '')

    if (response.ok) {
      return { status: response.status, body: responseBody.slice(0, 1024) }
    }

    // Retry on 5xx errors
    if (response.status >= 500 && attempt < MAX_RETRY_ATTEMPTS) {
      const delay = RETRY_DELAYS_MS[attempt - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
      await new Promise(resolve => setTimeout(resolve, delay))
      return deliverWebhook(webhook, event, data, attempt + 1)
    }

    throw new Error(`HTTP ${response.status}: ${responseBody.slice(0, 256)}`)
  } catch (err) {
    clearTimeout(timeout)

    if (err instanceof Error && err.name === 'AbortError') {
      // Timeout - retry
      if (attempt < MAX_RETRY_ATTEMPTS) {
        const delay = RETRY_DELAYS_MS[attempt - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
        await new Promise(resolve => setTimeout(resolve, delay))
        return deliverWebhook(webhook, event, data, attempt + 1)
      }
      throw new Error('Webhook delivery timed out after all retries')
    }

    throw err
  }
}

// ============================================================
// WEBHOOK EVENT TYPES
// ============================================================

/**
 * All supported webhook event types, organized by module.
 */
export const WEBHOOK_EVENTS = {
  // Employee events
  'employee.created': 'Triggered when a new employee is added',
  'employee.updated': 'Triggered when an employee profile is updated',
  'employee.terminated': 'Triggered when an employee is terminated',
  'employee.promoted': 'Triggered when an employee is promoted',

  // Performance events
  'review.started': 'Triggered when a review cycle starts',
  'review.completed': 'Triggered when a review is submitted',
  'goal.created': 'Triggered when a new goal is created',
  'goal.completed': 'Triggered when a goal is marked complete',
  'feedback.given': 'Triggered when feedback is submitted',

  // Payroll events
  'payroll.processed': 'Triggered when a payroll run is processed',
  'payroll.approved': 'Triggered when a payroll run is approved',
  'payroll.paid': 'Triggered when payments are disbursed',

  // Leave events
  'leave.requested': 'Triggered when leave is requested',
  'leave.approved': 'Triggered when leave is approved',
  'leave.rejected': 'Triggered when leave is rejected',

  // Recruiting events
  'application.received': 'Triggered when a new application is submitted',
  'application.status_changed': 'Triggered when application status changes',
  'interview.scheduled': 'Triggered when an interview is scheduled',
  'offer.sent': 'Triggered when an offer letter is sent',
  'offer.accepted': 'Triggered when an offer is accepted',

  // Expense events
  'expense.submitted': 'Triggered when an expense report is submitted',
  'expense.approved': 'Triggered when an expense report is approved',

  // Benefit events
  'benefit.enrolled': 'Triggered when an employee enrolls in a benefit',
  'benefit.life_event': 'Triggered when a life event is reported',

  // Learning events
  'course.completed': 'Triggered when a course is completed',
  'enrollment.created': 'Triggered when an enrollment is created',

  // Compliance events
  'compliance.issue_detected': 'Triggered when a compliance issue is found',
  'compliance.issue_resolved': 'Triggered when a compliance issue is resolved',

  // System events
  'org.settings_changed': 'Triggered when organization settings change',
  'integration.connected': 'Triggered when an integration is connected',
  'integration.disconnected': 'Triggered when an integration is disconnected',
} as const

export type WebhookEventType = keyof typeof WEBHOOK_EVENTS

// ============================================================
// IN-MEMORY DELIVERY LOG (for demo/development)
// ============================================================

const deliveryLog: WebhookDelivery[] = []

export function getDeliveryLog(webhookId?: string): WebhookDelivery[] {
  if (webhookId) {
    return deliveryLog.filter(d => d.webhook_id === webhookId)
  }
  return [...deliveryLog]
}

export function getWebhookStats(webhookId: string): WebhookStats {
  const deliveries = deliveryLog.filter(d => d.webhook_id === webhookId)
  return {
    total_deliveries: deliveries.length,
    successful: deliveries.filter(d => d.status === 'delivered').length,
    failed: deliveries.filter(d => d.status === 'failed').length,
    pending: deliveries.filter(d => d.status === 'pending' || d.status === 'retrying').length,
    avg_response_time_ms: 0, // would need timing data
  }
}

/**
 * Log a delivery attempt to the in-memory store.
 */
export function logDelivery(delivery: Omit<WebhookDelivery, 'id' | 'created_at'>): string {
  const id = `wd_${crypto.randomUUID().split('-')[0]}`
  deliveryLog.push({
    ...delivery,
    id,
    created_at: new Date().toISOString(),
  })
  // Keep only last 1000 entries
  if (deliveryLog.length > 1000) {
    deliveryLog.splice(0, deliveryLog.length - 1000)
  }
  return id
}

// ============================================================
// HELPER: VERIFY INCOMING WEBHOOK
// ============================================================

/**
 * Verify an incoming webhook signature (for receiving webhooks from external services).
 */
export async function verifyIncomingWebhook(
  body: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expected = await generateSignature(body, secret)
  // Constant-time comparison
  if (signature.length !== expected.length) return false
  let result = 0
  for (let i = 0; i < signature.length; i++) {
    result |= signature.charCodeAt(i) ^ expected.charCodeAt(i)
  }
  return result === 0
}
