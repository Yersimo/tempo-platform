import { SignJWT, jwtVerify } from 'jose'
import { db, schema } from '@/lib/db'
import { eq, and, gt } from 'drizzle-orm'
import { verifyPassword, hashPassword } from '@/lib/auth'

// ─── Config ───────────────────────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'tempo-dev-secret-change-in-production-2026' : '')
)
const SESSION_DURATION_MS = 24 * 60 * 60 * 1000 // 24 hours (shorter than employee sessions)
const COOKIE_NAME = 'tempo_admin_session'

// ─── JWT Token Management ─────────────────────────────────────────────────

export interface AdminSessionPayload {
  adminId: string
  email: string
  role: string
  sessionId: string
  isAdmin: true // discriminator to distinguish from employee tokens
}

export async function createAdminToken(payload: AdminSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(JWT_SECRET)
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    // Must have the isAdmin discriminator
    if (!payload.isAdmin) return null
    return payload as unknown as AdminSessionPayload
  } catch {
    return null
  }
}

// ─── Session Management (DB-backed) ──────────────────────────────────────

export async function createAdminSession(adminId: string, email: string, role: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  // Create session record
  const [session] = await db.insert(schema.adminSessions).values({
    adminId,
    token: crypto.randomUUID(), // placeholder, will update with JWT
    expiresAt,
  }).returning()

  // Create JWT with session ID
  const token = await createAdminToken({
    adminId,
    email,
    role,
    sessionId: session.id,
    isAdmin: true,
  })

  // Update session with actual JWT token
  await db.update(schema.adminSessions)
    .set({ token })
    .where(eq(schema.adminSessions.id, session.id))

  return token
}

export async function validateAdminSession(token: string): Promise<AdminSessionPayload | null> {
  const payload = await verifyAdminToken(token)
  if (!payload) return null

  // Demo admin sessions (created by fallback login) don't have DB records — JWT-only validation
  if (payload.sessionId.startsWith('demo-admin-')) {
    return payload
  }

  // Verify session exists in DB and hasn't been revoked
  try {
    const [session] = await db.select()
      .from(schema.adminSessions)
      .where(
        and(
          eq(schema.adminSessions.id, payload.sessionId),
          gt(schema.adminSessions.expiresAt, new Date())
        )
      )

    if (!session) return null
  } catch {
    // DB unavailable — fallback to JWT-only validation if session looks like a demo
    if (!payload.sessionId.startsWith('demo-admin-')) return null
  }

  return payload
}

export async function revokeAdminSession(sessionId: string): Promise<void> {
  if (sessionId.startsWith('demo-admin-')) return
  await db.delete(schema.adminSessions)
    .where(eq(schema.adminSessions.id, sessionId))
}

// ─── Cookie Helpers ──────────────────────────────────────────────────────

export function setAdminSessionCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
  return {
    name: COOKIE_NAME,
    value: token,
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: SESSION_DURATION_MS / 1000,
    },
  }
}

export function getAdminCookieName(): string {
  return COOKIE_NAME
}

// ─── Demo Admin Token (for fallback when DB is unavailable) ──────────────

export async function createDemoAdminToken(email: string, name: string, role: string): Promise<string> {
  const sessionId = `demo-admin-${crypto.randomUUID()}`
  return createAdminToken({
    adminId: 'admin-demo-1',
    email,
    role,
    sessionId,
    isAdmin: true,
  })
}

// Re-export password utilities for admin use
export { verifyPassword, hashPassword }
