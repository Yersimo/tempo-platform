import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import {
  verifyPassword,
  createAdminSession,
  createDemoAdminToken,
  validateAdminSession,
  revokeAdminSession,
  setAdminSessionCookie,
  getAdminCookieName,
} from '@/lib/admin-auth'
import { demoAdminCredentials } from '@/lib/demo-data'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // ─── Login ───────────────────────────────────────────────────────
    if (action === 'login') {
      const { email, password } = body
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      // Try DB first
      let adminRecord: { id: string; email: string; fullName: string; role: string; passwordHash: string | null; isActive: boolean } | null = null
      try {
        const [row] = await db.select().from(schema.platformAdmins)
          .where(eq(schema.platformAdmins.email, email))
        if (row) adminRecord = row
      } catch {
        // DB unavailable — will fall through to demo
      }

      if (adminRecord) {
        if (!adminRecord.isActive) {
          return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
        }
        if (!adminRecord.passwordHash) {
          return NextResponse.json({ error: 'Password not set' }, { status: 401 })
        }
        const valid = await verifyPassword(password, adminRecord.passwordHash)
        if (!valid) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }
        // Create DB-backed session
        const token = await createAdminSession(adminRecord.id, adminRecord.email, adminRecord.role)
        // Update last login
        try {
          await db.update(schema.platformAdmins)
            .set({ lastLoginAt: new Date() })
            .where(eq(schema.platformAdmins.id, adminRecord.id))
        } catch { /* non-critical */ }

        const cookie = setAdminSessionCookie(token)
        const response = NextResponse.json({
          ok: true,
          admin: { id: adminRecord.id, email: adminRecord.email, name: adminRecord.fullName, role: adminRecord.role },
        })
        response.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, string | boolean | number>)
        return response
      }

      // Demo fallback
      const demoCred = demoAdminCredentials.find(c => c.email === email && c.password === password)
      if (!demoCred) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      const demoToken = await createDemoAdminToken(demoCred.email, demoCred.name, demoCred.role)
      const cookie = setAdminSessionCookie(demoToken)
      const response = NextResponse.json({
        ok: true,
        admin: { id: 'admin-demo-1', email: demoCred.email, name: demoCred.name, role: demoCred.role },
      })
      response.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, string | boolean | number>)
      return response
    }

    // ─── Me ──────────────────────────────────────────────────────────
    if (action === 'me') {
      const adminCookie = request.cookies.get(getAdminCookieName())
      if (!adminCookie?.value) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      const payload = await validateAdminSession(adminCookie.value)
      if (!payload) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      // For demo admin, return from demo data
      if (payload.sessionId.startsWith('demo-admin-')) {
        const demoCred = demoAdminCredentials.find(c => c.email === payload.email)
        return NextResponse.json({
          ok: true,
          admin: {
            id: payload.adminId,
            email: payload.email,
            name: demoCred?.name || 'Tempo Admin',
            role: payload.role,
          },
        })
      }

      // Fetch from DB
      try {
        const [admin] = await db.select().from(schema.platformAdmins)
          .where(eq(schema.platformAdmins.id, payload.adminId))
        if (!admin) {
          return NextResponse.json({ error: 'Admin not found' }, { status: 404 })
        }
        return NextResponse.json({
          ok: true,
          admin: { id: admin.id, email: admin.email, name: admin.fullName, role: admin.role },
        })
      } catch {
        // DB unavailable — use JWT payload
        return NextResponse.json({
          ok: true,
          admin: { id: payload.adminId, email: payload.email, name: 'Admin', role: payload.role },
        })
      }
    }

    // ─── Logout ──────────────────────────────────────────────────────
    if (action === 'logout') {
      const adminCookie = request.cookies.get(getAdminCookieName())
      if (adminCookie?.value) {
        const payload = await validateAdminSession(adminCookie.value)
        if (payload) {
          await revokeAdminSession(payload.sessionId)
        }
      }
      const response = NextResponse.json({ ok: true })
      response.cookies.set(getAdminCookieName(), '', { maxAge: 0, path: '/' })
      return response
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
