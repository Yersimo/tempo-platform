import { SignJWT, jwtVerify } from 'jose'
import { db, schema } from '@/lib/db'
import { eq, and, gt } from 'drizzle-orm'
import { cookies } from 'next/headers'

// ─── Config ───────────────────────────────────────────────────────────────
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tempo-dev-secret-change-in-production-2026'
)
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000 // 7 days
const COOKIE_NAME = 'tempo_session'

// ─── Password Hashing (Web Crypto - works in Edge Runtime) ────────────────
// PBKDF2 with SHA-256, 100k iterations, 32-byte salt

async function deriveKey(password: string, salt: Uint8Array): Promise<ArrayBuffer> {
  const encoder = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  )
  return crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      hash: 'SHA-256',
      salt: salt as unknown as BufferSource,
      iterations: 100_000,
    },
    keyMaterial,
    256
  )
}

function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function fromHex(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  }
  return bytes
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(32))
  const derived = await deriveKey(password, salt)
  return `pbkdf2:${toHex(salt)}:${toHex(derived)}`
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy demo:password format during migration
  if (hash.startsWith('demo:')) {
    return hash === `demo:${password}`
  }

  // PBKDF2 format: pbkdf2:salt_hex:hash_hex
  if (!hash.startsWith('pbkdf2:')) return false
  const parts = hash.split(':')
  if (parts.length !== 3) return false

  const salt = fromHex(parts[1])
  const expectedHash = parts[2]
  const derived = await deriveKey(password, salt)
  const actualHash = toHex(derived)

  // Constant-time comparison
  if (expectedHash.length !== actualHash.length) return false
  let diff = 0
  for (let i = 0; i < expectedHash.length; i++) {
    diff |= expectedHash.charCodeAt(i) ^ actualHash.charCodeAt(i)
  }
  return diff === 0
}

// ─── JWT Token Management ─────────────────────────────────────────────────

export interface SessionPayload {
  employeeId: string
  email: string
  role: string
  orgId: string
  sessionId: string
}

export async function createToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as SessionPayload
  } catch {
    return null
  }
}

// ─── Session Management (DB-backed) ──────────────────────────────────────

export async function createSession(employeeId: string, orgId: string, email: string, role: string): Promise<string> {
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)

  // Create session record
  const [session] = await db.insert(schema.sessions).values({
    employeeId,
    token: crypto.randomUUID(), // placeholder, will update with JWT
    expiresAt,
  }).returning()

  // Create JWT with session ID
  const token = await createToken({
    employeeId,
    email,
    role,
    orgId,
    sessionId: session.id,
  })

  // Update session with actual JWT token
  await db.update(schema.sessions)
    .set({ token })
    .where(eq(schema.sessions.id, session.id))

  return token
}

export async function validateSession(token: string): Promise<SessionPayload | null> {
  // Verify JWT signature and expiry
  const payload = await verifyToken(token)
  if (!payload) return null

  // Verify session exists in DB and hasn't been revoked
  const [session] = await db.select()
    .from(schema.sessions)
    .where(
      and(
        eq(schema.sessions.id, payload.sessionId),
        gt(schema.sessions.expiresAt, new Date())
      )
    )

  if (!session) return null
  return payload
}

export async function revokeSession(sessionId: string): Promise<void> {
  await db.delete(schema.sessions)
    .where(eq(schema.sessions.id, sessionId))
}

export async function revokeAllSessions(employeeId: string): Promise<void> {
  await db.delete(schema.sessions)
    .where(eq(schema.sessions.employeeId, employeeId))
}

// ─── MFA Temporary Token ─────────────────────────────────────────────────
// Short-lived JWT (5 min) issued after password verification when MFA is required.
// Contains employeeId, email, role, orgId - but NOT a session. Must be exchanged
// for a full session after MFA code verification.

export interface MFATokenPayload {
  employeeId: string
  email: string
  role: string
  orgId: string
  purpose: 'mfa_challenge'
}

export async function createMFAToken(payload: Omit<MFATokenPayload, 'purpose'>): Promise<string> {
  return new SignJWT({ ...payload, purpose: 'mfa_challenge' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(JWT_SECRET)
}

export async function verifyMFAToken(token: string): Promise<MFATokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    if (payload.purpose !== 'mfa_challenge') return null
    return payload as unknown as MFATokenPayload
  } catch {
    return null
  }
}

// ─── Cookie Helpers (for use in API routes) ───────────────────────────────

export function setSessionCookie(token: string): { name: string; value: string; options: Record<string, unknown> } {
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

export function getSessionCookieName(): string {
  return COOKIE_NAME
}

// ─── Server-side Auth Helpers ─────────────────────────────────────────────

export async function getServerSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const sessionCookie = cookieStore.get(COOKIE_NAME)
    if (!sessionCookie?.value) return null
    return validateSession(sessionCookie.value)
  } catch {
    return null
  }
}

export async function getEmployeeFromSession(session: SessionPayload) {
  const [employee] = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.id, session.employeeId))

  if (!employee) return null

  let departmentName = ''
  if (employee.departmentId) {
    const [dept] = await db.select()
      .from(schema.departments)
      .where(eq(schema.departments.id, employee.departmentId))
    departmentName = dept?.name || ''
  }

  return {
    id: `user-${employee.id}`,
    email: employee.email,
    full_name: employee.fullName,
    avatar_url: employee.avatarUrl,
    role: employee.role,
    department_id: employee.departmentId,
    employee_id: employee.id,
    job_title: employee.jobTitle,
    department_name: departmentName,
    org_id: employee.orgId,
  }
}
