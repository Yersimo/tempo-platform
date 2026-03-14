/**
 * In-memory rate limiter with TTL cleanup.
 *
 * This is a standalone utility that can be used in API route handlers
 * (the middleware already has its own rate limiting via Upstash Redis).
 *
 * Usage:
 *   import { checkRateLimit, AUTH_RATE_LIMIT } from '@/lib/security/rate-limiter'
 *   const result = checkRateLimit(ip, AUTH_RATE_LIMIT)
 *   if (!result.allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

interface RateLimitConfig {
  /** Time window in milliseconds */
  window?: number
  /** Maximum requests allowed per window */
  max?: number
}

interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

// ── Default configs ──────────────────────────────────────────────────────

/** Default: 100 requests per 60 seconds */
export const DEFAULT_RATE_LIMIT: Required<RateLimitConfig> = {
  window: 60_000,
  max: 100,
}

/** Stricter limit for auth endpoints: 10 attempts per 5 minutes */
export const AUTH_RATE_LIMIT: Required<RateLimitConfig> = {
  window: 5 * 60_000,
  max: 10,
}

// ── Store ────────────────────────────────────────────────────────────────

const store = new Map<string, RateLimitEntry>()

// Periodic cleanup of expired entries (every 60 seconds)
let cleanupInterval: ReturnType<typeof setInterval> | null = null

function ensureCleanup() {
  if (cleanupInterval) return
  cleanupInterval = setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store) {
      if (now > entry.resetAt) {
        store.delete(key)
      }
    }
    // Stop the interval if the store is empty to avoid leaking timers
    if (store.size === 0 && cleanupInterval) {
      clearInterval(cleanupInterval)
      cleanupInterval = null
    }
  }, 60_000)
  // Allow the process to exit even if the timer is still active
  if (cleanupInterval && typeof cleanupInterval === 'object' && 'unref' in cleanupInterval) {
    cleanupInterval.unref()
  }
}

// ── Public API ───────────────────────────────────────────────────────────

/**
 * Check whether `identifier` (typically an IP address or user ID) is within
 * its rate limit. Returns whether the request is allowed, how many requests
 * remain, and when the window resets (epoch ms).
 */
export function checkRateLimit(
  identifier: string,
  config?: RateLimitConfig
): RateLimitResult {
  const { window: windowMs, max } = { ...DEFAULT_RATE_LIMIT, ...config }
  const now = Date.now()

  ensureCleanup()

  const entry = store.get(identifier)

  // No entry or window expired — start fresh
  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs
    store.set(identifier, { count: 1, resetAt })
    return { allowed: true, remaining: max - 1, resetAt }
  }

  // Within window
  entry.count++
  const allowed = entry.count <= max
  const remaining = Math.max(0, max - entry.count)
  return { allowed, remaining, resetAt: entry.resetAt }
}

/**
 * Reset the rate limit for a specific identifier (useful in tests).
 */
export function resetRateLimit(identifier: string): void {
  store.delete(identifier)
}

/**
 * Clear all rate limit entries (useful in tests).
 */
export function clearAllRateLimits(): void {
  store.clear()
}
