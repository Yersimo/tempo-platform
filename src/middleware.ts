import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const jwtSecretRaw = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'tempo-dev-secret-change-in-production-2026' : '')
if (!jwtSecretRaw && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: JWT_SECRET environment variable is not set in production!')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw)
const COOKIE_NAME = 'tempo_session'
const ADMIN_COOKIE_NAME = 'tempo_admin_session'

// ─── Rate Limiting ────────────────────────────────────────────────────────
// Use Upstash Redis when configured (persists across cold starts),
// fall back to in-memory for development.
const hasRedis = !!(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)

// Upstash Redis rate limiters (production)
const redis = hasRedis
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null

const loginRateLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(10, '15 m'), prefix: 'rl:login' })
  : null
const adminLoginRateLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl:admin-login' })
  : null
const resetRateLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15 m'), prefix: 'rl:reset' })
  : null
const apiRateLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(100, '1 m'), prefix: 'rl:api' })
  : null

// In-memory fallback rate limiter (development / when Redis is not configured)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
function checkRateLimitInMemory(key: string, max: number, windowMs: number): { limited: boolean } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }
  entry.count++
  return { limited: entry.count > max }
}

// Unified rate limit check: Redis if available, else in-memory
async function checkRateLimit(
  key: string,
  max: number,
  windowMs: number,
  redisLimiter?: Ratelimit | null
): Promise<{ limited: boolean }> {
  if (redisLimiter) {
    try {
      const { success } = await redisLimiter.limit(key)
      return { limited: !success }
    } catch {
      // Redis failure → fall back to in-memory (don't block requests)
      return checkRateLimitInMemory(key, max, windowMs)
    }
  }
  return checkRateLimitInMemory(key, max, windowMs)
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/demo', '/api/auth', '/api/health', '/api/docs', '/api/billing/webhook', '/privacy', '/terms', '/cookies', '/gdpr', '/security', '/reset-password', '/invite', '/api/employees/accept-invite', '/api/integrations/slack/events']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow marketing landing page
  if (pathname === '/') {
    return NextResponse.next()
  }

  // ─── Admin Routes ─────────────────────────────────────────────────────
  // Admin login page is public
  if (pathname === '/admin/login') {
    // If admin already authenticated, redirect to admin dashboard
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    if (adminCookie?.value) {
      try {
        const { payload } = await jwtVerify(adminCookie.value, JWT_SECRET)
        if (payload.isAdmin) {
          return NextResponse.redirect(new URL('/admin', request.url))
        }
      } catch {
        // Invalid token, let them access the login page
      }
    }
    return NextResponse.next()
  }

  // Admin auth API is public (login/logout/me handle their own auth)
  // But rate limit admin login attempts
  if (pathname.startsWith('/api/admin/auth') && request.method === 'POST') {
    const adminIp = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const { limited } = await checkRateLimit(`admin-login:${adminIp}`, 5, 15 * 60 * 1000, adminLoginRateLimiter)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many admin login attempts. Please try again later.' },
        { status: 429 }
      )
    }
    return NextResponse.next()
  }
  if (pathname.startsWith('/api/admin/auth')) {
    return NextResponse.next()
  }

  // Admin API routes — require admin session
  if (pathname.startsWith('/api/admin/')) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    if (!adminCookie?.value) {
      return NextResponse.json({ error: 'Admin unauthorized' }, { status: 401 })
    }
    try {
      const { payload } = await jwtVerify(adminCookie.value, JWT_SECRET)
      if (!payload.isAdmin) {
        return NextResponse.json({ error: 'Not an admin token' }, { status: 403 })
      }
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-admin-id', payload.adminId as string)
      requestHeaders.set('x-admin-role', payload.role as string)
      requestHeaders.set('x-admin-session-id', payload.sessionId as string)
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch {
      const response = NextResponse.json({ error: 'Admin session expired' }, { status: 401 })
      response.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' })
      return response
    }
  }

  // Admin pages (except login, handled above) — require admin session
  if (pathname.startsWith('/admin')) {
    const adminCookie = request.cookies.get(ADMIN_COOKIE_NAME)
    if (!adminCookie?.value) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
    try {
      const { payload } = await jwtVerify(adminCookie.value, JWT_SECRET)
      if (!payload.isAdmin) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-admin-id', payload.adminId as string)
      requestHeaders.set('x-admin-role', payload.role as string)
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch {
      const response = NextResponse.redirect(new URL('/admin/login', request.url))
      response.cookies.set(ADMIN_COOKIE_NAME, '', { maxAge: 0, path: '/' })
      return response
    }
  }

  // ─── SSO Routes (public - handle their own auth) ─────────────────────
  if (pathname.startsWith('/api/auth/sso/')) {
    return NextResponse.next()
  }

  // ─── Integration OAuth Callbacks (public) ───────────────────────────
  if (pathname.startsWith('/api/integrations/') && pathname.includes('/callback')) {
    return NextResponse.next()
  }

  // ─── Rate Limiting (Redis-backed in production, in-memory in dev) ───
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit login attempts only (not session checks, logout, etc.)
  if (pathname === '/api/auth' && request.method === 'POST') {
    try {
      const clonedBody = await request.clone().json()
      if (clonedBody?.action === 'login' || clonedBody?.action === 'signup') {
        const { limited } = await checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000, loginRateLimiter)
        if (limited) {
          return NextResponse.json(
            { error: 'Too many login attempts. Please try again later.' },
            { status: 429 }
          )
        }
      }
    } catch {
      // If body parsing fails, skip rate limiting (don't block valid requests)
    }
  }

  // Rate limit password reset
  if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
    const { limited } = await checkRateLimit(`reset:${ip}`, 5, 15 * 60 * 1000, resetRateLimiter)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // General API rate limiting (100 requests/minute per IP)
  if (pathname.startsWith('/api/') && apiRateLimiter) {
    const { limited } = await checkRateLimit(`api:${ip}`, 100, 60 * 1000, apiRateLimiter)
    if (limited) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // ─── Employee Routes (existing logic) ─────────────────────────────────

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // If user is already authenticated and tries to access login/signup, redirect to dashboard
    if (pathname === '/login' || pathname === '/signup' || pathname === '/demo') {
      const sessionCookie = request.cookies.get(COOKIE_NAME)
      if (sessionCookie?.value) {
        try {
          await jwtVerify(sessionCookie.value, JWT_SECRET)
          return NextResponse.redirect(new URL('/dashboard', request.url))
        } catch {
          // Invalid token, let them access the page
        }
      }
    }
    return NextResponse.next()
  }

  // Allow API routes except protected ones
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/data') && !pathname.startsWith('/api/ai') && !pathname.startsWith('/api/search') && !pathname.startsWith('/api/workflow') && !pathname.startsWith('/api/notifications') && !pathname.startsWith('/api/integrations') && !pathname.startsWith('/api/payroll')) {
    return NextResponse.next()
  }

  // Check session cookie
  const sessionCookie = request.cookies.get(COOKIE_NAME)
  if (!sessionCookie?.value) {
    // No session - redirect to login
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Verify JWT (lightweight check - no DB hit in middleware)
  try {
    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)

    // Forward auth context as REQUEST headers (not response headers)
    // so API route handlers can read them via request.headers.get()
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-employee-id', payload.employeeId as string)
    requestHeaders.set('x-employee-role', payload.role as string)
    requestHeaders.set('x-org-id', payload.orgId as string)
    requestHeaders.set('x-session-id', payload.sessionId as string)

    return NextResponse.next({
      request: { headers: requestHeaders },
    })
  } catch {
    // Invalid/expired JWT - clear cookie and redirect to login
    if (pathname.startsWith('/api/')) {
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 })
      response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
      return response
    }
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    const response = NextResponse.redirect(loginUrl)
    response.cookies.set(COOKIE_NAME, '', { maxAge: 0, path: '/' })
    return response
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
