/**
 * API route protection wrapper (Higher-Order Function).
 *
 * Combines auth verification, rate limiting, CSRF validation, and
 * request logging into a single composable guard.
 *
 * Usage:
 *   import { withApiGuard } from '@/lib/security/api-guard'
 *
 *   export const POST = withApiGuard(async (request, context) => {
 *     // request is guaranteed authenticated at this point
 *     const orgId = context.orgId
 *     const employeeId = context.employeeId
 *     return NextResponse.json({ ok: true })
 *   }, { csrf: true, rateLimit: { max: 20, window: 60_000 } })
 */

import { type NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, DEFAULT_RATE_LIMIT, AUTH_RATE_LIMIT } from './rate-limiter'
import { validateCsrfToken, generateCsrfToken, CSRF_COOKIE } from './csrf'

// ── Types ────────────────────────────────────────────────────────────────

export interface GuardContext {
  /** Employee ID from JWT (set by middleware) */
  employeeId: string
  /** Organisation ID from JWT (set by middleware) */
  orgId: string
  /** Employee role from JWT */
  role: string
  /** Session ID from JWT */
  sessionId: string
  /** Whether the request is from a demo org */
  isDemo: boolean
  /** Client IP address */
  ip: string
}

export interface GuardOptions {
  /** Require CSRF token on mutation methods (POST/PUT/PATCH/DELETE). Default: false */
  csrf?: boolean
  /** Rate limit configuration. Pass `true` for defaults, or a config object. Default: true */
  rateLimit?: boolean | { max?: number; window?: number }
  /** Skip authentication check (for public-ish routes that still want rate limiting). Default: false */
  skipAuth?: boolean
  /** Restrict to specific HTTP methods. If set, other methods return 405. */
  methods?: string[]
  /** Use stricter auth rate limiting preset. Default: false */
  authRateLimit?: boolean
}

type GuardedHandler = (
  request: NextRequest,
  context: GuardContext
) => Promise<NextResponse> | NextResponse

// ── Implementation ───────────────────────────────────────────────────────

export function withApiGuard(
  handler: GuardedHandler,
  options: GuardOptions = {}
) {
  return async function guardedHandler(request: NextRequest): Promise<NextResponse> {
    const startTime = Date.now()
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

    try {
      // ── Method check ─────────────────────────────────────────────────
      if (options.methods && !options.methods.includes(request.method)) {
        return NextResponse.json(
          { error: `Method ${request.method} not allowed` },
          { status: 405 }
        )
      }

      // ── Rate limiting ────────────────────────────────────────────────
      if (options.rateLimit !== false) {
        const rlConfig = options.authRateLimit
          ? AUTH_RATE_LIMIT
          : typeof options.rateLimit === 'object'
            ? { ...DEFAULT_RATE_LIMIT, ...options.rateLimit }
            : DEFAULT_RATE_LIMIT

        const rlKey = `guard:${request.nextUrl.pathname}:${ip}`
        const result = checkRateLimit(rlKey, rlConfig)

        if (!result.allowed) {
          return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
              status: 429,
              headers: {
                'Retry-After': String(Math.ceil((result.resetAt - Date.now()) / 1000)),
                'X-RateLimit-Remaining': '0',
                'X-RateLimit-Reset': String(result.resetAt),
              },
            }
          )
        }
      }

      // ── Authentication ───────────────────────────────────────────────
      const employeeId = request.headers.get('x-employee-id') || ''
      const orgId = request.headers.get('x-org-id') || ''
      const role = request.headers.get('x-employee-role') || ''
      const sessionId = request.headers.get('x-session-id') || ''
      const isDemo = request.headers.get('x-demo-mode') === 'true'

      if (!options.skipAuth && (!employeeId || !orgId)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }

      // ── CSRF validation ──────────────────────────────────────────────
      const MUTATION_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE']
      if (options.csrf && MUTATION_METHODS.includes(request.method)) {
        const valid = validateCsrfToken(request)
        if (!valid) {
          return NextResponse.json(
            { error: 'Invalid or missing CSRF token' },
            { status: 403 }
          )
        }
      }

      // ── Execute handler ──────────────────────────────────────────────
      const context: GuardContext = {
        employeeId,
        orgId,
        role,
        sessionId,
        isDemo,
        ip,
      }

      const response = await handler(request, context)

      // ── CSRF token rotation ──────────────────────────────────────────
      if (options.csrf && MUTATION_METHODS.includes(request.method)) {
        const newToken = generateCsrfToken()
        response.cookies.set(CSRF_COOKIE, newToken, {
          httpOnly: true,
          sameSite: 'strict',
          path: '/',
          secure: process.env.NODE_ENV === 'production',
        })
      }

      // ── Request logging ──────────────────────────────────────────────
      const duration = Date.now() - startTime
      if (process.env.NODE_ENV === 'development' || process.env.API_LOGGING === 'true') {
        console.log(
          `[API] ${request.method} ${request.nextUrl.pathname} → ${response.status} (${duration}ms) [${ip}] [org:${orgId || 'none'}]`
        )
      }

      return response
    } catch (error) {
      const duration = Date.now() - startTime
      console.error(
        `[API ERROR] ${request.method} ${request.nextUrl.pathname} (${duration}ms) [${ip}]:`,
        error
      )
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  }
}
