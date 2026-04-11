import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'
import { getPermissionsForRoles, hasAnyPermission } from '@/lib/security/permissions'
import { getRequiredPermissions } from '@/lib/security/route-permissions'

const jwtSecretRaw = process.env.JWT_SECRET || 'tempo-dev-secret-change-in-production-2026'
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL SECURITY: JWT_SECRET is not set. Using fallback secret. This is insecure in production!')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw)
const COOKIE_NAME = 'tempo_session'
const ADMIN_COOKIE_NAME = 'tempo_admin_session'
const ACADEMY_COOKIE_NAME = 'tempo_academy_session'

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
const userRateLimiter = redis
  ? new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(200, '1 m'), prefix: 'rl:user' })
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
const PUBLIC_ROUTES = ['/login', '/signup', '/demo', '/demo-request', '/contact', '/trial', '/products/hr', '/products/payroll', '/products/finance', '/products/ai', '/products/operations', '/products/it', '/products/platform', '/why-tempo', '/customer-journeys', '/api/demo-request', '/api/auth', '/api/health', '/api/docs', '/api/billing/webhook', '/privacy', '/terms', '/cookies', '/gdpr', '/security', '/reset-password', '/invite', '/api/employees/accept-invite', '/api/integrations/slack/events', '/api/academy/auth', '/academy/login', '/verify', '/solutions', '/api/academy/certificate', '/about', '/careers', '/social-impact', '/newsroom']

// ─── Security Headers ────────────────────────────────────────────────────
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
}

function applySecurityHeaders(response: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value)
  }
  return response
}

// ─── IP Allowlisting for Admin Access ────────────────────────────────────
const ADMIN_IP_ALLOWLIST = (process.env.ADMIN_IP_ALLOWLIST || '').split(',').filter(Boolean)

function checkAdminIPAllowlist(request: NextRequest): boolean {
  if (ADMIN_IP_ALLOWLIST.length === 0) return true // No allowlist = allow all (dev mode)

  const clientIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || '127.0.0.1'

  // Always allow localhost for local development
  if (clientIP === '127.0.0.1' || clientIP === '::1') return true

  // Check exact match or CIDR range
  return ADMIN_IP_ALLOWLIST.some(allowed => {
    if (allowed.includes('/')) {
      return isIPInCIDR(clientIP, allowed)
    }
    return clientIP === allowed.trim()
  })
}

function isIPInCIDR(ip: string, cidr: string): boolean {
  const [range, bits] = cidr.split('/')
  const mask = ~(2 ** (32 - parseInt(bits)) - 1)
  const ipNum = ip.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0)
  const rangeNum = range.split('.').reduce((acc, oct) => (acc << 8) + parseInt(oct), 0)
  return (ipNum & mask) === (rangeNum & mask)
}

export async function middleware(request: NextRequest) {
  const response = await _middlewareInner(request)
  applySecurityHeaders(response)

  // Apply CORS headers to all API responses
  const { pathname } = request.nextUrl
  if (pathname.startsWith('/api/')) {
    applyCorsHeaders(response, request.headers.get('origin'))
  }

  return response
}

// ─── CORS Configuration ──────────────────────────────────────────────────
const CORS_ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || 'https://theworktempo.com',
  'https://app.theworktempo.com',
  ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3002'] : []),
]

function getCorsHeaders(origin: string | null): Record<string, string> {
  const isAllowed = !origin || CORS_ALLOWED_ORIGINS.includes(origin)
  const allowedOrigin = isAllowed ? (origin || CORS_ALLOWED_ORIGINS[0]) : ''
  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-org-id, x-employee-id',
    'Access-Control-Max-Age': '86400',
  }
}

function applyCorsHeaders(response: NextResponse, origin: string | null): NextResponse {
  const headers = getCorsHeaders(origin)
  for (const [key, value] of Object.entries(headers)) {
    if (value) response.headers.set(key, value)
  }
  return response
}

async function _middlewareInner(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl
  const origin = request.headers.get('origin')

  // ─── CORS Preflight (OPTIONS) for API routes ───────────────────────
  if (pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    const corsHeaders = getCorsHeaders(origin)
    return new NextResponse(null, {
      status: 204,
      headers: corsHeaders,
    })
  }

  // Allow marketing landing page
  if (pathname === '/') {
    return NextResponse.next()
  }

  // ─── Admin Routes ─────────────────────────────────────────────────────
  // IP Allowlist check for all admin routes (API + pages, including login)
  if (pathname.startsWith('/api/admin/') || pathname.startsWith('/admin')) {
    if (!checkAdminIPAllowlist(request)) {
      if (pathname.startsWith('/api/')) {
        return new NextResponse(JSON.stringify({ error: 'Access denied: IP not in allowlist' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new NextResponse('Access denied: IP not in allowlist', { status: 403 })
    }
  }

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

  // ─── Academy Routes ──────────────────────────────────────────────────────
  // Academy marketing pages are public (landing page + diagnostic)
  // Academy participant pages require tempo_academy_session JWT

  const publicAcademyPages = ['/academy', '/academy/login', '/academy/diagnostic', '/academy/get-started']
  if (publicAcademyPages.includes(pathname)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/academy/') && !publicAcademyPages.includes(pathname)) {
    const academyCookie = request.cookies.get(ACADEMY_COOKIE_NAME)
    if (!academyCookie?.value) {
      return NextResponse.redirect(new URL('/academy/login', request.url))
    }
    try {
      const { payload } = await jwtVerify(academyCookie.value, JWT_SECRET)
      if (!payload.participantId) {
        return NextResponse.redirect(new URL('/academy/login', request.url))
      }
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-participant-id', payload.participantId as string)
      requestHeaders.set('x-academy-id', payload.academyId as string)
      requestHeaders.set('x-org-id', payload.orgId as string)
      if (payload.academySlug) {
        requestHeaders.set('x-academy-slug', payload.academySlug as string)
      }
      return NextResponse.next({ request: { headers: requestHeaders } })
    } catch {
      const response = NextResponse.redirect(new URL('/academy/login', request.url))
      response.cookies.set(ACADEMY_COOKIE_NAME, '', { maxAge: 0, path: '/' })
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

    // ─── Per-User Rate Limiting ──────────────────────────────────────────
    if (pathname.startsWith('/api/') && payload.employeeId) {
      const userKey = `user:${payload.employeeId}`
      const { limited: userLimited } = await checkRateLimit(userKey, 200, 60_000, userRateLimiter)
      if (userLimited) {
        const entry = rateLimitStore.get(userKey)
        const retryAfter = entry ? Math.ceil((entry.resetAt - Date.now()) / 1000) : 60
        const remaining = entry ? Math.max(0, 200 - entry.count) : 0
        const resetAt = entry ? Math.ceil(entry.resetAt / 1000) : Math.ceil((Date.now() + 60_000) / 1000)
        return NextResponse.json(
          { error: 'User rate limit exceeded' },
          {
            status: 429,
            headers: {
              'Retry-After': String(retryAfter),
              'X-RateLimit-Limit': '200',
              'X-RateLimit-Remaining': String(remaining),
              'X-RateLimit-Reset': String(resetAt),
            },
          }
        )
      }
    }

    // ─── RBAC Authorization ──────────────────────────────────────────────
    const employeeRole = (payload.role as string) || 'employee'
    const capabilitiesStr = (payload.capabilities as string) || ''
    const capabilities = capabilitiesStr ? capabilitiesStr.split(',').map(c => c.trim()).filter(Boolean) : []
    const userPermissions = getPermissionsForRoles([employeeRole], capabilities)

    // Forward permissions so API routes can perform their own checks
    requestHeaders.set('x-employee-permissions', userPermissions.join(','))

    // Check route-level permissions (only for page routes, not API routes —
    // API routes should use the forwarded permissions header for granular checks)
    if (!pathname.startsWith('/api/')) {
      const required = getRequiredPermissions(pathname)
      // `null` means route is not mapped → open to all authenticated users
      // empty array means explicitly open to all authenticated users
      if (required !== null && required.length > 0) {
        if (!hasAnyPermission(userPermissions, required)) {
          const accessDeniedUrl = new URL('/access-denied', request.url)
          accessDeniedUrl.searchParams.set('path', pathname)
          accessDeniedUrl.searchParams.set('permission', required.join(', '))
          return NextResponse.redirect(accessDeniedUrl)
        }
      }
    }

    // ─── Demo Org Guard ────────────────────────────────────────────────
    // Demo orgs use IDs like 'org-1' (not valid UUIDs). If a demo org
    // hits any /api/ route that queries the DB, PostgreSQL will crash with
    // "invalid input syntax for type uuid". Intercept here so NO demo org
    // request ever reaches a DB query.
    const orgId = payload.orgId as string
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    const isDemoOrg = !UUID_RE.test(orgId)

    if (isDemoOrg) {
      requestHeaders.set('x-demo-mode', 'true')

      // For API routes (except auth, which handles demo internally),
      // return empty JSON to prevent DB crashes
      if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth') && !pathname.startsWith('/api/admin')) {
        // Routes that already handle demo mode internally — let them through
        const DEMO_AWARE_ROUTES = ['/api/data', '/api/payroll', '/api/chat']
        const isDemoAware = DEMO_AWARE_ROUTES.some(r => pathname.startsWith(r))
        if (!isDemoAware) {
          return NextResponse.json([], { status: 200 })
        }
      }
    }

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
