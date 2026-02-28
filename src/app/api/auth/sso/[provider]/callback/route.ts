import { NextRequest, NextResponse } from 'next/server'
import { handleSSOCallback } from '@/lib/services/sso-handler'

// GET /api/auth/sso/google/callback?code=xxx&state=xxx
// GET /api/auth/sso/azure/callback?code=xxx&state=xxx
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    
    if (provider !== 'google' && provider !== 'azure') {
      return NextResponse.redirect(new URL('/login?error=unsupported_provider', request.url))
    }

    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(
        new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/login?error=missing_sso_params', request.url))
    }

    const redirectUri = `${url.origin}/api/auth/sso/${provider}/callback`

    const result = await handleSSOCallback(provider, code, state, redirectUri)

    // Set the session cookie and redirect to the app
    const redirectUrl = new URL(result.returnUrl, request.url)
    if (result.isNewUser) {
      redirectUrl.searchParams.set('welcome', 'true')
    }

    const response = NextResponse.redirect(redirectUrl)
    response.cookies.set(
      result.cookie.name,
      result.cookie.value,
      result.cookie.options as Parameters<typeof response.cookies.set>[2]
    )

    return response
  } catch (error: any) {
    console.error('[SSO Callback] Error:', error)

    const errorCode = error?.code || 'sso_failed'
    const errorMessage = encodeURIComponent(error?.message || 'SSO authentication failed')
    
    return NextResponse.redirect(
      new URL(`/login?error=${errorCode}&message=${errorMessage}`, request.url)
    )
  }
}
