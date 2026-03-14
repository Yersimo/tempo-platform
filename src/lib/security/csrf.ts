/**
 * CSRF (Cross-Site Request Forgery) protection utilities.
 *
 * Tokens are generated server-side, stored in a cookie, and validated
 * against a header or body value on mutation requests.
 *
 * Usage in API routes:
 *   import { generateCsrfToken, validateCsrfToken, CSRF_COOKIE, CSRF_HEADER } from '@/lib/security/csrf'
 *
 *   // On GET (or page render): set the cookie
 *   const token = generateCsrfToken()
 *   response.cookies.set(CSRF_COOKIE, token, { httpOnly: true, sameSite: 'strict', path: '/' })
 *
 *   // On POST/PUT/PATCH/DELETE: validate
 *   const valid = validateCsrfToken(request)
 *   if (!valid) return NextResponse.json({ error: 'Invalid CSRF token' }, { status: 403 })
 */

import { type NextRequest } from 'next/server'
import { randomBytes, createHmac } from 'crypto'

// ── Constants ────────────────────────────────────────────────────────────

export const CSRF_COOKIE = 'tempo_csrf'
export const CSRF_HEADER = 'x-csrf-token'

const CSRF_SECRET =
  process.env.CSRF_SECRET ||
  (process.env.NODE_ENV === 'development'
    ? 'tempo-csrf-dev-secret-2026'
    : '')

if (!CSRF_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL: CSRF_SECRET environment variable is not set in production!')
}

// ── Token generation ─────────────────────────────────────────────────────

/**
 * Generate a new CSRF token.
 *
 * The token consists of `nonce.signature` where the signature is an HMAC
 * of the nonce using the server secret. This allows stateless validation
 * without storing tokens server-side.
 */
export function generateCsrfToken(): string {
  const nonce = randomBytes(32).toString('hex')
  const signature = createHmac('sha256', CSRF_SECRET).update(nonce).digest('hex')
  return `${nonce}.${signature}`
}

// ── Token validation ─────────────────────────────────────────────────────

/**
 * Verify that a token string is structurally valid and correctly signed.
 */
export function verifyCsrfToken(token: string): boolean {
  if (!token || typeof token !== 'string') return false

  const dotIndex = token.indexOf('.')
  if (dotIndex === -1) return false

  const nonce = token.substring(0, dotIndex)
  const signature = token.substring(dotIndex + 1)

  if (!nonce || !signature) return false

  const expectedSignature = createHmac('sha256', CSRF_SECRET)
    .update(nonce)
    .digest('hex')

  // Constant-time comparison to prevent timing attacks
  if (signature.length !== expectedSignature.length) return false
  let mismatch = 0
  for (let i = 0; i < signature.length; i++) {
    mismatch |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Validate the CSRF token on an incoming mutation request.
 *
 * The token is read from the `x-csrf-token` header and compared against
 * the cookie value. Both must be present and valid.
 */
export function validateCsrfToken(request: NextRequest): boolean {
  const headerToken = request.headers.get(CSRF_HEADER)
  const cookieToken = request.cookies.get(CSRF_COOKIE)?.value

  if (!headerToken || !cookieToken) return false

  // Both tokens must be valid signatures
  if (!verifyCsrfToken(headerToken) || !verifyCsrfToken(cookieToken)) return false

  // The header token must match the cookie token
  if (headerToken.length !== cookieToken.length) return false
  let mismatch = 0
  for (let i = 0; i < headerToken.length; i++) {
    mismatch |= headerToken.charCodeAt(i) ^ cookieToken.charCodeAt(i)
  }
  return mismatch === 0
}

/**
 * Generate a fresh CSRF token for token rotation.
 * Call this after a successful validation to issue a new token.
 */
export function rotateCsrfToken(): string {
  return generateCsrfToken()
}
