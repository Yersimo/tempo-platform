import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Skip Supabase auth when not configured (demo mode)
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
    return NextResponse.next()
  }

  // When Supabase is configured, use the session middleware
  const { updateSession } = await import('@/lib/supabase/middleware')
  return await updateSession(request)
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
