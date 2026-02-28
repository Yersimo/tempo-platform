import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { createHmac } from 'crypto'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface WebhookPayload {
  event: string           // e.g., 'payroll.approved', 'expense.submitted'
  orgId: string
  data: Record<string, unknown>
  timestamp: string
}

export type DeliveryStatus = 'pending' | 'delivered' | 'failed' | 'retrying'

export type CircuitState = 'closed' | 'circuit_open' | 'circuit_half_open'

export interface WebhookDeliveryLog {
  id: string
  endpointId: string
  orgId: string
  event: string
  payload: string          // JSON stringified
  httpStatus: number | null
  responseBody: string | null  // first 1000 chars
  latencyMs: number
  success: boolean
  errorMessage: string | null
  attempt: number
  status: DeliveryStatus
  createdAt: Date
}

export interface RetryEntry {
  deliveryLogId: string
  endpointId: string
  orgId: string
  event: string
  payload: string
  attempt: number          // next attempt number (1-5)
  scheduledAt: Date
  createdAt: Date
}

export interface EndpointCircuitState {
  endpointId: string
  state: CircuitState
  consecutiveFailures: number
  lastFailureAt: Date | null
  circuitOpenedAt: Date | null
  nextTestAt: Date | null
}

export interface EndpointHealth {
  endpointId: string
  url: string
  isActive: boolean
  circuitState: CircuitState
  totalDeliveries: number
  successCount: number
  failureCount: number
  successRate: number      // 0-100
  avgLatencyMs: number
  last24h: {
    total: number
    success: number
    failed: number
    avgLatencyMs: number
  }
  lastDeliveryAt: Date | null
  consecutiveFailures: number
}

export interface WebhookStats {
  totalSent: number
  totalFailed: number
  successRate: number      // 0-100
  avgLatencyMs: number
  activeEndpoints: number
  failingEndpoints: number
  topEvents: { event: string; count: number }[]
  last24h: {
    total: number
    success: number
    failed: number
    avgLatencyMs: number
  }
}

// ============================================================
// IN-MEMORY STORES
// ============================================================

// Delivery logs store (in-memory since schema lacks a delivery logs table)
const deliveryLogs: WebhookDeliveryLog[] = []

// Retry queue
const retryQueue: RetryEntry[] = []

// Circuit breaker state per endpoint
const circuitStates = new Map<string, EndpointCircuitState>()

// Exponential backoff delays for retries (in milliseconds)
const RETRY_DELAYS_MS = [
  1 * 60 * 1000,       // 1 minute
  5 * 60 * 1000,       // 5 minutes
  30 * 60 * 1000,      // 30 minutes
  2 * 60 * 60 * 1000,  // 2 hours
  12 * 60 * 60 * 1000, // 12 hours
]

const MAX_RETRIES = 5
const CIRCUIT_OPEN_DURATION_MS = 30 * 60 * 1000  // 30 minutes
const CONSECUTIVE_FAILURES_THRESHOLD = 5
const MAX_DELIVERY_LOGS = 10000  // Cap in-memory store

// ============================================================
// CIRCUIT BREAKER
// ============================================================

function getCircuitState(endpointId: string): EndpointCircuitState {
  let state = circuitStates.get(endpointId)
  if (!state) {
    state = {
      endpointId,
      state: 'closed',
      consecutiveFailures: 0,
      lastFailureAt: null,
      circuitOpenedAt: null,
      nextTestAt: null,
    }
    circuitStates.set(endpointId, state)
  }
  return state
}

function recordCircuitSuccess(endpointId: string): void {
  const state = getCircuitState(endpointId)
  state.consecutiveFailures = 0
  state.state = 'closed'
  state.circuitOpenedAt = null
  state.nextTestAt = null
  state.lastFailureAt = null
}

function recordCircuitFailure(endpointId: string): void {
  const state = getCircuitState(endpointId)
  state.consecutiveFailures++
  state.lastFailureAt = new Date()

  if (state.consecutiveFailures >= CONSECUTIVE_FAILURES_THRESHOLD) {
    state.state = 'circuit_open'
    state.circuitOpenedAt = new Date()
    state.nextTestAt = new Date(Date.now() + CIRCUIT_OPEN_DURATION_MS)
  }
}

/**
 * Check if an endpoint's circuit breaker allows delivery.
 * If the circuit is open and the test window has passed, transition to half-open.
 */
function isCircuitAllowingDelivery(endpointId: string): boolean {
  const state = getCircuitState(endpointId)

  if (state.state === 'closed') return true

  if (state.state === 'circuit_open' && state.nextTestAt) {
    if (new Date() >= state.nextTestAt) {
      // Transition to half-open: allow one test delivery
      state.state = 'circuit_half_open'
      return true
    }
    return false
  }

  // circuit_half_open: allow one test delivery (already transitioned)
  if (state.state === 'circuit_half_open') return true

  return false
}

// ============================================================
// DELIVERY LOG RECORDING
// ============================================================

function createDeliveryLog(params: {
  endpointId: string
  orgId: string
  event: string
  payload: string
  httpStatus: number | null
  responseBody: string | null
  latencyMs: number
  success: boolean
  errorMessage: string | null
  attempt: number
  status: DeliveryStatus
}): WebhookDeliveryLog {
  const log: WebhookDeliveryLog = {
    id: crypto.randomUUID(),
    endpointId: params.endpointId,
    orgId: params.orgId,
    event: params.event,
    payload: params.payload,
    httpStatus: params.httpStatus,
    responseBody: params.responseBody ? params.responseBody.slice(0, 1000) : null,
    latencyMs: params.latencyMs,
    success: params.success,
    errorMessage: params.errorMessage,
    attempt: params.attempt,
    status: params.status,
    createdAt: new Date(),
  }

  deliveryLogs.push(log)

  // Evict old entries if over the cap
  if (deliveryLogs.length > MAX_DELIVERY_LOGS) {
    deliveryLogs.splice(0, deliveryLogs.length - MAX_DELIVERY_LOGS)
  }

  return log
}

// ============================================================
// RETRY QUEUE
// ============================================================

function scheduleRetry(params: {
  deliveryLogId: string
  endpointId: string
  orgId: string
  event: string
  payload: string
  attempt: number
}): void {
  if (params.attempt > MAX_RETRIES) return

  const delayMs = RETRY_DELAYS_MS[params.attempt - 1] || RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]
  const scheduledAt = new Date(Date.now() + delayMs)

  retryQueue.push({
    deliveryLogId: params.deliveryLogId,
    endpointId: params.endpointId,
    orgId: params.orgId,
    event: params.event,
    payload: params.payload,
    attempt: params.attempt,
    scheduledAt,
    createdAt: new Date(),
  })

  // Update the delivery log status to retrying
  const log = deliveryLogs.find(l => l.id === params.deliveryLogId)
  if (log) {
    log.status = 'retrying'
  }
}

/**
 * Process due retries in the queue.
 * Call this periodically (e.g., from a cron job) to process scheduled retries.
 */
export async function processRetryQueue(): Promise<{ processed: number; succeeded: number; failed: number }> {
  const now = new Date()
  const result = { processed: 0, succeeded: 0, failed: 0 }

  // Find all due retries
  const dueRetries = retryQueue.filter(r => r.scheduledAt <= now)

  for (const retry of dueRetries) {
    // Remove from queue
    const idx = retryQueue.indexOf(retry)
    if (idx !== -1) retryQueue.splice(idx, 1)

    result.processed++

    // Fetch the endpoint to ensure it still exists and get the secret
    const endpoints = await db.select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, retry.endpointId))

    if (endpoints.length === 0) continue

    const endpoint = endpoints[0]

    // Check circuit breaker
    if (!isCircuitAllowingDelivery(endpoint.id)) {
      // Re-schedule for later if circuit is still open
      scheduleRetry({
        deliveryLogId: retry.deliveryLogId,
        endpointId: retry.endpointId,
        orgId: retry.orgId,
        event: retry.event,
        payload: retry.payload,
        attempt: retry.attempt, // same attempt number, just rescheduled
      })
      continue
    }

    // Attempt delivery
    const deliveryResult = await attemptDelivery(
      endpoint,
      retry.event,
      retry.orgId,
      retry.payload,
      retry.attempt,
    )

    if (deliveryResult.success) {
      result.succeeded++
    } else {
      result.failed++
      // Schedule next retry if under max
      if (retry.attempt < MAX_RETRIES) {
        scheduleRetry({
          deliveryLogId: retry.deliveryLogId,
          endpointId: retry.endpointId,
          orgId: retry.orgId,
          event: retry.event,
          payload: retry.payload,
          attempt: retry.attempt + 1,
        })
      } else {
        // Max retries exceeded - mark endpoint as failing and pause
        await db.update(schema.webhookEndpoints)
          .set({ isActive: false })
          .where(eq(schema.webhookEndpoints.id, endpoint.id))
      }
    }
  }

  return result
}

// ============================================================
// CORE DELIVERY
// ============================================================

interface DeliveryResult {
  success: boolean
  httpStatus: number | null
  responseBody: string | null
  latencyMs: number
  errorMessage: string | null
}

/**
 * Attempt a single webhook delivery to an endpoint.
 * Records the delivery log and updates circuit breaker state.
 */
async function attemptDelivery(
  endpoint: { id: string; url: string; secret: string },
  event: string,
  orgId: string,
  body: string,
  attempt: number,
): Promise<DeliveryResult & { logId: string }> {
  const startTime = Date.now()
  let httpStatus: number | null = null
  let responseBody: string | null = null
  let success = false
  let errorMessage: string | null = null

  try {
    const signature = signPayload(body, endpoint.secret)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout

    const response = await fetch(endpoint.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tempo-Signature': signature,
        'X-Tempo-Event': event,
        'X-Tempo-Timestamp': new Date().toISOString(),
        'X-Tempo-Delivery-Attempt': String(attempt),
        'User-Agent': 'Tempo-Webhooks/1.0',
      },
      body,
      signal: controller.signal,
    })

    clearTimeout(timeout)
    httpStatus = response.status

    try {
      responseBody = await response.text()
    } catch {
      responseBody = null
    }

    success = response.ok || response.status < 300
    if (!success) {
      errorMessage = `HTTP ${response.status}`
    }
  } catch (err) {
    errorMessage = err instanceof Error ? err.message : String(err)
  }

  const latencyMs = Date.now() - startTime

  // Record delivery log
  const status: DeliveryStatus = success ? 'delivered' : 'failed'
  const log = createDeliveryLog({
    endpointId: endpoint.id,
    orgId,
    event,
    payload: body,
    httpStatus,
    responseBody,
    latencyMs,
    success,
    errorMessage,
    attempt,
    status,
  })

  // Update circuit breaker
  if (success) {
    recordCircuitSuccess(endpoint.id)
  } else {
    recordCircuitFailure(endpoint.id)
  }

  // Update endpoint in DB
  if (success) {
    await db.update(schema.webhookEndpoints)
      .set({ lastCalledAt: new Date(), failureCount: 0 })
      .where(eq(schema.webhookEndpoints.id, endpoint.id))
  } else {
    const endpoints = await db.select()
      .from(schema.webhookEndpoints)
      .where(eq(schema.webhookEndpoints.id, endpoint.id))
    const currentFailures = endpoints[0]?.failureCount || 0

    await db.update(schema.webhookEndpoints)
      .set({
        lastCalledAt: new Date(),
        failureCount: currentFailures + 1,
      })
      .where(eq(schema.webhookEndpoints.id, endpoint.id))
  }

  return { success, httpStatus, responseBody, latencyMs, errorMessage, logId: log.id }
}

// ============================================================
// MAIN DISPATCH FUNCTION
// ============================================================

/**
 * Dispatch a webhook event to all registered endpoints for an org.
 * Signs the payload with HMAC-SHA256 using the endpoint's secret.
 * Records delivery logs, handles circuit breaker, and schedules retries on failure.
 */
export async function dispatchWebhook(
  event: string,
  orgId: string,
  data: Record<string, unknown>,
): Promise<{ sent: number; failed: number; errors: string[]; deliveryLogIds: string[] }> {
  const result = { sent: 0, failed: 0, errors: [] as string[], deliveryLogIds: [] as string[] }

  // Find all active webhook endpoints for this org that subscribe to this event
  const endpoints = await db.select()
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.orgId, orgId),
      eq(schema.webhookEndpoints.isActive, true),
    ))

  // Filter endpoints that subscribe to this event
  const matchingEndpoints = endpoints.filter(ep => {
    const events = ep.events as string[] | null
    if (!events || events.length === 0) return true // subscribe to all
    return events.some(e => event.startsWith(e) || e === '*')
  })

  const payload: WebhookPayload = {
    event,
    orgId,
    data,
    timestamp: new Date().toISOString(),
  }

  const body = JSON.stringify(payload)

  for (const endpoint of matchingEndpoints) {
    // Check circuit breaker before attempting delivery
    if (!isCircuitAllowingDelivery(endpoint.id)) {
      const log = createDeliveryLog({
        endpointId: endpoint.id,
        orgId,
        event,
        payload: body,
        httpStatus: null,
        responseBody: null,
        latencyMs: 0,
        success: false,
        errorMessage: 'Circuit breaker open - delivery skipped',
        attempt: 1,
        status: 'failed',
      })
      result.failed++
      result.errors.push(`${endpoint.url}: circuit breaker open`)
      result.deliveryLogIds.push(log.id)

      // Schedule retry for when the circuit may re-open
      scheduleRetry({
        deliveryLogId: log.id,
        endpointId: endpoint.id,
        orgId,
        event,
        payload: body,
        attempt: 1,
      })
      continue
    }

    const deliveryResult = await attemptDelivery(endpoint, event, orgId, body, 1)
    result.deliveryLogIds.push(deliveryResult.logId)

    if (deliveryResult.success) {
      result.sent++
    } else {
      result.failed++
      result.errors.push(`${endpoint.url}: ${deliveryResult.errorMessage || 'unknown error'}`)

      // Schedule first retry
      scheduleRetry({
        deliveryLogId: deliveryResult.logId,
        endpointId: endpoint.id,
        orgId,
        event,
        payload: body,
        attempt: 2, // next attempt is #2
      })
    }
  }

  return result
}

// ============================================================
// QUERY FUNCTIONS
// ============================================================

/**
 * Get delivery logs for an org, optionally filtered by endpoint.
 */
export function getDeliveryLogs(
  orgId: string,
  endpointId?: string,
  limit: number = 50,
): WebhookDeliveryLog[] {
  let filtered = deliveryLogs.filter(l => l.orgId === orgId)

  if (endpointId) {
    filtered = filtered.filter(l => l.endpointId === endpointId)
  }

  // Return most recent first
  return filtered
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit)
}

/**
 * Get health metrics for a specific webhook endpoint.
 */
export async function getEndpointHealth(
  orgId: string,
  endpointId: string,
): Promise<EndpointHealth | null> {
  // Fetch the endpoint from DB
  const endpoints = await db.select()
    .from(schema.webhookEndpoints)
    .where(and(
      eq(schema.webhookEndpoints.id, endpointId),
      eq(schema.webhookEndpoints.orgId, orgId),
    ))

  if (endpoints.length === 0) return null
  const endpoint = endpoints[0]

  // Get all logs for this endpoint
  const logs = deliveryLogs.filter(l => l.endpointId === endpointId)
  const totalDeliveries = logs.length
  const successCount = logs.filter(l => l.success).length
  const failureCount = totalDeliveries - successCount
  const successRate = totalDeliveries > 0 ? Math.round((successCount / totalDeliveries) * 100) : 100
  const avgLatencyMs = totalDeliveries > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / totalDeliveries)
    : 0

  // Last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentLogs = logs.filter(l => l.createdAt >= twentyFourHoursAgo)
  const recentSuccess = recentLogs.filter(l => l.success).length
  const recentFailed = recentLogs.length - recentSuccess
  const recentAvgLatency = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, l) => sum + l.latencyMs, 0) / recentLogs.length)
    : 0

  const circuitState = getCircuitState(endpointId)
  const lastLog = logs.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0]

  return {
    endpointId,
    url: endpoint.url,
    isActive: endpoint.isActive,
    circuitState: circuitState.state,
    totalDeliveries,
    successCount,
    failureCount,
    successRate,
    avgLatencyMs,
    last24h: {
      total: recentLogs.length,
      success: recentSuccess,
      failed: recentFailed,
      avgLatencyMs: recentAvgLatency,
    },
    lastDeliveryAt: lastLog?.createdAt ?? null,
    consecutiveFailures: circuitState.consecutiveFailures,
  }
}

/**
 * Manually retry a failed delivery by its log ID.
 */
export async function retryDelivery(
  deliveryLogId: string,
): Promise<{ success: boolean; newLogId: string | null; error?: string }> {
  const originalLog = deliveryLogs.find(l => l.id === deliveryLogId)
  if (!originalLog) {
    return { success: false, newLogId: null, error: 'Delivery log not found' }
  }

  if (originalLog.success) {
    return { success: false, newLogId: null, error: 'Delivery was already successful' }
  }

  // Fetch the endpoint
  const endpoints = await db.select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.id, originalLog.endpointId))

  if (endpoints.length === 0) {
    return { success: false, newLogId: null, error: 'Endpoint no longer exists' }
  }

  const endpoint = endpoints[0]

  // Attempt delivery with incremented attempt number
  const result = await attemptDelivery(
    endpoint,
    originalLog.event,
    originalLog.orgId,
    originalLog.payload,
    originalLog.attempt + 1,
  )

  // If original log was retrying, update its status based on outcome
  if (result.success) {
    originalLog.status = 'delivered'
  }

  return {
    success: result.success,
    newLogId: result.logId,
    error: result.errorMessage || undefined,
  }
}

/**
 * Get org-wide webhook statistics.
 */
export async function getWebhookStats(orgId: string): Promise<WebhookStats> {
  const logs = deliveryLogs.filter(l => l.orgId === orgId)
  const totalSent = logs.filter(l => l.success).length
  const totalFailed = logs.length - totalSent
  const successRate = logs.length > 0 ? Math.round((totalSent / logs.length) * 100) : 100
  const avgLatencyMs = logs.length > 0
    ? Math.round(logs.reduce((sum, l) => sum + l.latencyMs, 0) / logs.length)
    : 0

  // Count active and failing endpoints
  const endpoints = await db.select()
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.orgId, orgId))

  const activeEndpoints = endpoints.filter(e => e.isActive).length
  const failingEndpoints = endpoints.filter(e => {
    const cs = circuitStates.get(e.id)
    return cs && (cs.state === 'circuit_open' || cs.state === 'circuit_half_open')
  }).length

  // Top events by count
  const eventCounts = new Map<string, number>()
  for (const log of logs) {
    eventCounts.set(log.event, (eventCounts.get(log.event) || 0) + 1)
  }
  const topEvents = Array.from(eventCounts.entries())
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  // Last 24 hours
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentLogs = logs.filter(l => l.createdAt >= twentyFourHoursAgo)
  const recentSuccess = recentLogs.filter(l => l.success).length
  const recentFailed = recentLogs.length - recentSuccess
  const recentAvgLatency = recentLogs.length > 0
    ? Math.round(recentLogs.reduce((sum, l) => sum + l.latencyMs, 0) / recentLogs.length)
    : 0

  return {
    totalSent,
    totalFailed,
    successRate,
    avgLatencyMs,
    activeEndpoints,
    failingEndpoints,
    topEvents,
    last24h: {
      total: recentLogs.length,
      success: recentSuccess,
      failed: recentFailed,
      avgLatencyMs: recentAvgLatency,
    },
  }
}

// ============================================================
// RETRY QUEUE INSPECTION
// ============================================================

/**
 * Get the current retry queue entries for an org.
 */
export function getRetryQueue(orgId: string): RetryEntry[] {
  return retryQueue
    .filter(r => r.orgId === orgId)
    .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
}

/**
 * Get the circuit breaker state for a specific endpoint.
 */
export function getCircuitBreakerState(endpointId: string): EndpointCircuitState {
  return getCircuitState(endpointId)
}

// ============================================================
// SIGNATURE UTILITIES
// ============================================================

/**
 * Sign a payload with HMAC-SHA256 for webhook verification.
 * Recipients can verify: hmac(body, secret) === X-Tempo-Signature header
 */
function signPayload(body: string, secret: string): string {
  return createHmac('sha256', secret).update(body).digest('hex')
}

/**
 * Verify a webhook signature (for incoming webhooks from other services).
 */
export function verifyWebhookSignature(body: string, signature: string, secret: string): boolean {
  const expected = signPayload(body, secret)
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ signature.charCodeAt(i)
  }
  return diff === 0
}

// ============================================================
// ENDPOINT MANAGEMENT
// ============================================================

/**
 * Register a new webhook endpoint for an org.
 */
export async function registerWebhookEndpoint(
  orgId: string,
  url: string,
  events: string[],
  integrationId?: string,
): Promise<{ id: string; secret: string }> {
  // Generate a random secret for HMAC signing
  const secret = `whsec_${crypto.randomUUID().replace(/-/g, '')}`

  const [endpoint] = await db.insert(schema.webhookEndpoints).values({
    orgId,
    integrationId: integrationId || null,
    url,
    secret,
    events,
    isActive: true,
  }).returning()

  return { id: endpoint.id, secret }
}

/**
 * Get all webhook endpoints for an org, including circuit breaker state.
 */
export async function getWebhookEndpoints(orgId: string) {
  const endpoints = await db.select({
    id: schema.webhookEndpoints.id,
    url: schema.webhookEndpoints.url,
    events: schema.webhookEndpoints.events,
    isActive: schema.webhookEndpoints.isActive,
    lastCalledAt: schema.webhookEndpoints.lastCalledAt,
    failureCount: schema.webhookEndpoints.failureCount,
    createdAt: schema.webhookEndpoints.createdAt,
  })
    .from(schema.webhookEndpoints)
    .where(eq(schema.webhookEndpoints.orgId, orgId))

  return endpoints.map(ep => ({
    ...ep,
    circuitState: getCircuitState(ep.id).state,
    consecutiveFailures: getCircuitState(ep.id).consecutiveFailures,
  }))
}
