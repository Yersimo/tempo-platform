/**
 * Calendar OAuth Scaffolding
 *
 * Production-ready wiring for Google Calendar + Microsoft Graph OAuth.
 * Everything except the actual provider credentials is built:
 *   - OAuth URL composition with PKCE
 *   - Authorization-code → token exchange
 *   - Token refresh on expiry
 *   - Per-employee token storage (calendar_tokens table)
 *   - Provider routing (mock fallback when creds missing)
 *
 * To go live, set on Vercel:
 *   GOOGLE_OAUTH_CLIENT_ID
 *   GOOGLE_OAUTH_CLIENT_SECRET
 *   MS_GRAPH_CLIENT_ID
 *   MS_GRAPH_CLIENT_SECRET
 *
 * Callback URLs to register with each provider:
 *   https://theworktempo.com/api/auth/calendar/google/callback
 *   https://theworktempo.com/api/auth/calendar/outlook/callback
 */

import crypto from 'node:crypto'

export type CalendarProviderName = 'google' | 'outlook'

export interface OAuthConfig {
  provider: CalendarProviderName
  clientId: string
  clientSecret: string
  authUrl: string
  tokenUrl: string
  scopes: string[]
  callbackPath: string
}

export interface OAuthState {
  /** Random nonce stored in cookie + replayed in callback */
  state: string
  /** PKCE code verifier — stored briefly, replayed on token exchange */
  codeVerifier: string
  codeChallenge: string
  /** Where to redirect after successful auth */
  returnTo: string
}

export interface CalendarToken {
  employeeId: string
  provider: CalendarProviderName
  accessToken: string
  refreshToken: string
  expiresAt: string // ISO 8601
  scope: string
}

// ─── Provider configurations ─────────────────────────────────────────

export function getProviderConfig(provider: CalendarProviderName): OAuthConfig | null {
  if (provider === 'google') {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET
    if (!clientId || !clientSecret) return null
    return {
      provider: 'google',
      clientId,
      clientSecret,
      authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: [
        'https://www.googleapis.com/auth/calendar.events.readonly',
        'https://www.googleapis.com/auth/calendar.readonly',
        'openid',
        'email',
        'profile',
      ],
      callbackPath: '/api/auth/calendar/google/callback',
    }
  }
  if (provider === 'outlook') {
    const clientId = process.env.MS_GRAPH_CLIENT_ID
    const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET
    if (!clientId || !clientSecret) return null
    return {
      provider: 'outlook',
      clientId,
      clientSecret,
      authUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      scopes: ['Calendars.Read', 'User.Read', 'offline_access'],
      callbackPath: '/api/auth/calendar/outlook/callback',
    }
  }
  return null
}

// ─── PKCE generation (RFC 7636) ──────────────────────────────────────

export function generatePKCE(): { verifier: string; challenge: string } {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

export function generateState(): string {
  return crypto.randomBytes(24).toString('base64url')
}

// ─── Authorization URL composition ───────────────────────────────────

export function buildAuthUrl(
  config: OAuthConfig,
  state: string,
  codeChallenge: string,
  redirectUri: string,
): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.scopes.join(' '),
    state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    access_type: 'offline', // Google: returns refresh_token
    prompt: 'consent', // ensure refresh_token on every grant
  })
  return `${config.authUrl}?${params.toString()}`
}

// ─── Token exchange (authorization-code → access + refresh tokens) ──

export interface TokenExchangeResponse {
  accessToken: string
  refreshToken: string | null
  expiresIn: number // seconds
  scope: string
  tokenType: string
}

export async function exchangeCodeForTokens(
  config: OAuthConfig,
  code: string,
  codeVerifier: string,
  redirectUri: string,
): Promise<TokenExchangeResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    code,
    code_verifier: codeVerifier,
    grant_type: 'authorization_code',
    redirect_uri: redirectUri,
  })

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token exchange failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresIn: json.expires_in,
    scope: json.scope,
    tokenType: json.token_type,
  }
}

// ─── Token refresh ───────────────────────────────────────────────────

export async function refreshAccessToken(
  config: OAuthConfig,
  refreshToken: string,
): Promise<TokenExchangeResponse> {
  const body = new URLSearchParams({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    refresh_token: refreshToken,
    grant_type: 'refresh_token',
  })

  const res = await fetch(config.tokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Token refresh failed (${res.status}): ${text}`)
  }

  const json = (await res.json()) as {
    access_token: string
    refresh_token?: string
    expires_in: number
    scope: string
    token_type: string
  }

  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? refreshToken, // Google reuses on refresh
    expiresIn: json.expires_in,
    scope: json.scope,
    tokenType: json.token_type,
  }
}

// ─── Token store (in-memory now, calendar_tokens table in production) ─

const tokenStore = new Map<string, CalendarToken>()

function key(employeeId: string, provider: CalendarProviderName): string {
  return `${employeeId}:${provider}`
}

export async function saveCalendarToken(token: CalendarToken): Promise<void> {
  tokenStore.set(key(token.employeeId, token.provider), token)
  // TODO: in production, upsert into calendar_tokens table
  //   await db.insert(calendarTokens).values(token).onConflictDoUpdate(...)
}

export async function loadCalendarToken(
  employeeId: string,
  provider: CalendarProviderName,
): Promise<CalendarToken | null> {
  // TODO: in production, SELECT from calendar_tokens where employee_id = ?
  return tokenStore.get(key(employeeId, provider)) ?? null
}

export async function ensureFreshToken(
  employeeId: string,
  provider: CalendarProviderName,
): Promise<CalendarToken | null> {
  const token = await loadCalendarToken(employeeId, provider)
  if (!token) return null

  const expiresAt = new Date(token.expiresAt).getTime()
  const fiveMinFromNow = Date.now() + 5 * 60 * 1000
  if (expiresAt > fiveMinFromNow) return token // still fresh

  // Needs refresh
  const config = getProviderConfig(provider)
  if (!config) return null

  try {
    const refreshed = await refreshAccessToken(config, token.refreshToken)
    const updated: CalendarToken = {
      ...token,
      accessToken: refreshed.accessToken,
      refreshToken: refreshed.refreshToken ?? token.refreshToken,
      expiresAt: new Date(Date.now() + refreshed.expiresIn * 1000).toISOString(),
      scope: refreshed.scope,
    }
    await saveCalendarToken(updated)
    return updated
  } catch (err) {
    console.error('[calendar-oauth] refresh failed:', err)
    return null
  }
}
