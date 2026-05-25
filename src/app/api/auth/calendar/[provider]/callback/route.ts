/**
 * GET /api/auth/calendar/{provider}/callback
 *
 * The OAuth provider redirects here with ?code and ?state. We verify
 * the state cookie matches, exchange the code for tokens, persist the
 * tokens against the authenticated employee, and redirect back to the
 * originating page.
 */

import { NextResponse, type NextRequest } from 'next/server'
import {
  getProviderConfig,
  exchangeCodeForTokens,
  saveCalendarToken,
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

  const url = new URL(request.url)
  const code = url.searchParams.get('code')
  const stateParam = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  if (error) {
    return NextResponse.redirect(`${url.origin}/expenses/snap?cal_error=${encodeURIComponent(error)}`, 302)
  }
  if (!code || !stateParam) {
    return NextResponse.json({ error: 'missing_code_or_state' }, { status: 400 })
  }

  const cookieState = request.cookies.get('cal_oauth_state')?.value
  const cookieVerifier = request.cookies.get('cal_oauth_verifier')?.value
  const returnTo = request.cookies.get('cal_oauth_return')?.value ?? '/expenses/snap'

  if (!cookieState || !cookieVerifier || cookieState !== stateParam) {
    return NextResponse.json({ error: 'state_mismatch' }, { status: 400 })
  }

  const config = getProviderConfig(provider as CalendarProviderName)
  if (!config) {
    return NextResponse.json({ error: 'provider_not_configured' }, { status: 503 })
  }

  const redirectUri = `${url.origin}${config.callbackPath}`

  try {
    const tokens = await exchangeCodeForTokens(config, code, cookieVerifier, redirectUri)

    // Resolve the employee from auth middleware (x-employee-id header)
    const employeeId = request.headers.get('x-employee-id')
    if (!employeeId) {
      return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
    }

    await saveCalendarToken({
      employeeId,
      provider: provider as CalendarProviderName,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken ?? '',
      expiresAt: new Date(Date.now() + tokens.expiresIn * 1000).toISOString(),
      scope: tokens.scope,
    })

    const res = NextResponse.redirect(`${url.origin}${returnTo}?cal_connected=${provider}`, 302)
    // Clear OAuth cookies
    res.cookies.delete('cal_oauth_state')
    res.cookies.delete('cal_oauth_verifier')
    res.cookies.delete('cal_oauth_return')
    return res
  } catch (err) {
    console.error('[calendar-oauth callback] exchange failed:', err)
    return NextResponse.redirect(
      `${url.origin}/expenses/snap?cal_error=${encodeURIComponent(err instanceof Error ? err.message : 'exchange_failed')}`,
      302,
    )
  }
}
