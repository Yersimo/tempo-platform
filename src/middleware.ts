import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tempo-dev-secret-change-in-production-2026'
)
const COOKIE_NAME = 'tempo_session'

// Public routes that don't require authentication
const PUBLIC_ROUTES = ['/login', '/signup', '/api/auth']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

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
