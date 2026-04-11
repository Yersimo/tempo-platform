/**
 * Academy Participant Auth API
 *
 * Separate auth flow for external participants accessing the academy portal.
 * Uses a different cookie (tempo_academy_session) from the platform auth.
 *
 * Actions:
 * - login: Email + password authentication
 * - verify-invite: Verify invitation token and set password
 * - me: Get current participant session
 * - logout: Clear session cookie
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import * as crypto from 'crypto'
import {
  verifyInvitationToken,
  setParticipantPassword,
  getParticipantById,
} from '@/lib/academy-engine'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || 'tempo-dev-secret-change-me')
const COOKIE_NAME = 'tempo_academy_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 days

const SALT_LENGTH = 16
const KEY_LENGTH = 64
const ITERATIONS = 100000

function hashPassword(password: string, salt?: string): string {
  const s = salt || crypto.randomBytes(SALT_LENGTH).toString('hex')
  const hash = crypto.pbkdf2Sync(password, s, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex')
  return `${s}:${hash}`
}

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha512').toString('hex')
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(derived, 'hex'))
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'login': {
        const { email, password } = body
        if (!email || !password) {
          return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
        }

        // Look up active participant by email
        const [participant] = await db.select().from(schema.academyParticipants)
          .where(and(
            eq(schema.academyParticipants.email, email),
            eq(schema.academyParticipants.status, 'active'),
          ))
          .limit(1)

        if (!participant || !participant.passwordHash) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Verify password with timing-safe comparison
        if (!verifyPassword(password, participant.passwordHash)) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }

        // Update last active
        await db.update(schema.academyParticipants)
          .set({ lastActiveAt: new Date() })
          .where(eq(schema.academyParticipants.id, participant.id))

        // Fetch academy slug for redirect
        let academySlug = ''
        try {
          const [acad] = await db.select({ slug: schema.academies.slug })
            .from(schema.academies)
            .where(eq(schema.academies.id, participant.academyId))
            .limit(1)
          if (acad) academySlug = acad.slug
        } catch { /* ignore */ }

        // Create JWT
        const token = await new SignJWT({
          participantId: participant.id,
          orgId: participant.orgId,
          academyId: participant.academyId,
          academySlug,
          email: participant.email,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('30d')
          .setIssuedAt()
          .sign(JWT_SECRET)

        const response = NextResponse.json({
          participant: {
            id: participant.id,
            fullName: participant.fullName,
            email: participant.email,
            academyId: participant.academyId,
            academySlug,
            cohortId: participant.cohortId,
            progress: participant.progress,
          },
        })

        response.cookies.set(COOKIE_NAME, token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        })

        return response
      }

      case 'verify-invite': {
        const { token, password } = body
        if (!token || !password) {
          return NextResponse.json({ error: 'Token and password required' }, { status: 400 })
        }

        if (password.length < 8) {
          return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
        }

        const participant = await verifyInvitationToken(token)
        if (!participant) {
          return NextResponse.json({ error: 'Invalid or expired invitation token' }, { status: 400 })
        }

        // Set password
        const passwordHash = hashPassword(password)
        await setParticipantPassword(participant.id, passwordHash)

        // Clear invitation token
        await db.update(schema.academyParticipants)
          .set({ invitationToken: null, lastActiveAt: new Date() })
          .where(eq(schema.academyParticipants.id, participant.id))

        // Fetch academy slug for redirect
        let inviteAcademySlug = ''
        try {
          const [acad] = await db.select({ slug: schema.academies.slug })
            .from(schema.academies)
            .where(eq(schema.academies.id, participant.academyId))
            .limit(1)
          if (acad) inviteAcademySlug = acad.slug
        } catch { /* ignore */ }

        // Auto-login: create JWT
        const jwt = await new SignJWT({
          participantId: participant.id,
          orgId: participant.orgId,
          academyId: participant.academyId,
          academySlug: inviteAcademySlug,
          email: participant.email,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('30d')
          .setIssuedAt()
          .sign(JWT_SECRET)

        const response = NextResponse.json({
          participant: {
            id: participant.id,
            fullName: participant.fullName,
            email: participant.email,
            academyId: participant.academyId,
            academySlug: inviteAcademySlug,
            cohortId: participant.cohortId,
            progress: participant.progress,
          },
        })

        response.cookies.set(COOKIE_NAME, jwt, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: COOKIE_MAX_AGE,
          path: '/',
        })

        return response
      }

      case 'logout': {
        const response = NextResponse.json({ success: true })
        response.cookies.delete(COOKIE_NAME)
        return response
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy Auth POST]', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// GET /api/academy/auth — Verify session and return participant info
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get(COOKIE_NAME)
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { payload } = await jwtVerify(sessionCookie.value, JWT_SECRET)
    const participantId = payload.participantId as string
    const orgId = payload.orgId as string

    if (!participantId || !orgId) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    const participant = await getParticipantById(orgId, participantId)
    if (!participant || participant.status !== 'active') {
      const response = NextResponse.json({ error: 'Session expired' }, { status: 401 })
      response.cookies.delete(COOKIE_NAME)
      return response
    }

    // Fetch academy slug
    const academySlug = (payload.academySlug as string) || ''

    return NextResponse.json({
      participant: {
        id: participant.id,
        fullName: participant.fullName,
        email: participant.email,
        avatarUrl: participant.avatarUrl,
        academyId: participant.academyId,
        academySlug,
        cohortId: participant.cohortId,
        progress: participant.progress,
        language: participant.language,
        businessName: participant.businessName,
        country: participant.country,
      },
    })
  } catch (error: any) {
    console.error('[Academy Auth GET]', error instanceof Error ? error.message : 'Unknown error')
    const response = NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    response.cookies.delete(COOKIE_NAME)
    return response
  }
}
