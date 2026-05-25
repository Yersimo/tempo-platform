/**
 * GET /api/auth/calendar/{provider}/start
 *
 * Begins the OAuth dance. Generates state + PKCE, sets cookies,
 * returns 302 redirect to provider's authorization URL.
 *
 * Provider is 'google' or 'outlook'.
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  getProviderConfig,
  generatePKCE,
  generateState,
  buildAuthUrl,
  type CalendarProviderName,
} from '@/lib/services/calendar-oauth'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params
  if (provider !== 'google' && provider !== 'outlook') {
    return NextResponse.json({ error: 'invalid_provider' }, { status: 400 })
  }

  const config = getProviderConfig(provider as CalendarProviderName)
  if (!config) {
    return NextResponse.json(
      {
        error: 'provider_not_configured',
        message: `${provider} OAuth client credentials not set. Configure on Vercel: ${provider === 'google' ? 'GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET' : 'MS_GRAPH_CLIENT_ID + MS_GRAPH_CLIENT_SECRET'}`,
      },
      { status: 503 },
    )
  }

  const state = generateState()
  const { verifier, challenge } = generatePKCE()
  const returnTo = request.nextUrl.searchParams.get('returnTo') ?? '/expenses/snap'

  const origin = request.nextUrl.origin
  const redirectUri = `${origin}${config.callbackPath}`
  const authUrl = buildAuthUrl(config, state, challenge, redirectUri)

  const res = NextResponse.redirect(authUrl, 302)
  // Short-lived cookies (10 min) — enough for the OAuth dance to complete
  const maxAge = 600
  const opts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  }
  res.cookies.set('cal_oauth_state', state, opts)
  res.cookies.set('cal_oauth_verifier', verifier, opts)
  res.cookies.set('cal_oauth_return', returnTo, opts)

  return res
}
