// Simple in-memory rate limiter for API endpoints
// Uses a Map with automatic cleanup of expired entries

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
let lastCleanup = Date.now()
const CLEANUP_INTERVAL = 5 * 60 * 1000

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now

  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g., IP address, session ID, or combined key)
 * @param maxRequests - Maximum number of requests allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns Object with `limited` boolean and `remaining` count
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { limited: boolean; remaining: number; resetAt: number } {
  cleanup()

  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: maxRequests - 1, resetAt: now + windowMs }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { limited: true, remaining: 0, resetAt: entry.resetAt }
  }

  return { limited: false, remaining: maxRequests - entry.count, resetAt: entry.resetAt }
}

// Preset rate limiters for common use cases
export const rateLimiters = {
  /** Login: 5 attempts per 15 minutes per IP */
  login: (ip: string) => rateLimit(`login:${ip}`, 5, 15 * 60 * 1000),

  /** Signup: 3 attempts per hour per IP */
  signup: (ip: string) => rateLimit(`signup:${ip}`, 3, 60 * 60 * 1000),

  /** Password reset: 3 attempts per 15 minutes per IP */
  passwordReset: (ip: string) => rateLimit(`reset:${ip}`, 3, 15 * 60 * 1000),

  /** API: 200 requests per minute per session */
  api: (sessionId: string) => rateLimit(`api:${sessionId}`, 200, 60 * 1000),

  /** Invitation: 20 invites per hour per org */
  invite: (orgId: string) => rateLimit(`invite:${orgId}`, 20, 60 * 60 * 1000),
}
