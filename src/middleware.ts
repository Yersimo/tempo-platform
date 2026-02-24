import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const jwtSecretRaw = process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'tempo-dev-secret-change-in-production-2026' : '')
if (!jwtSecretRaw && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: JWT_SECRET environment variable is not set in production!')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw)
const COOKIE_NAME = 'tempo_session'
const ADMIN_COOKIE_NAME = 'tempo_admin_session'

// Simple in-memory rate limiter for middleware
const rateLimitStore = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(key: string, max: number, windowMs: number): { limited: boolean } {
  const now = Date.now()
  const entry = rateLimitStore.get(key)
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false }
  }
  entry.count++
  return { limited: entry.count > max }
}

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/api/auth', '/api/health', '/api/docs', '/api/billing/webhook', '/privacy', '/terms', '/cookies', '/gdpr', '/security', '/reset-password', '/invite', '/api/employees/accept-invite']

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

  // ─── Rate Limiting (lightweight, in-memory) ──────────────────────────
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'

  // Rate limit login attempts
  if (pathname === '/api/auth' && request.method === 'POST') {
    const { limited } = checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many attempts. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // Rate limit signup
  if (pathname === '/api/auth' && request.method === 'POST') {
    // We can't read the body in middleware, but we rate limit all auth POSTs per IP
  }

  // Rate limit password reset
  if (pathname === '/api/auth/reset-password' && request.method === 'POST') {
    const { limited } = checkRateLimit(`reset:${ip}`, 5, 15 * 60 * 1000)
    if (limited) {
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      )
    }
  }

  // ─── Employee Routes (existing logic) ─────────────────────────────────

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    // If user is already authenticated and tries to access login/signup, redirect to dashboard
    if (pathname === '/login' || pathname === '/signup') {
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
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/data') && !pathname.startsWith('/api/ai') && !pathname.startsWith('/api/search') && !pathname.startsWith('/api/workflow') && !pathname.startsWith('/api/notifications') && !pathname.startsWith('/api/integrations')) {
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
