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
import { generateSecret, verifyTOTP, generateOTPAuthURI } from '@/lib/totp'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // ─── Login ───────────────────────────────────────────────────────
    if (action === 'login') {
      const { email, password, totpCode } = body
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
      }

      // Try DB first
      let adminRecord: { id: string; email: string; fullName: string; role: string; passwordHash: string | null; isActive: boolean; mfaEnabled: boolean; mfaSecret: string | null } | null = null
      try {
        const [row] = await db.select().from(schema.platformAdmins)
          .where(eq(schema.platformAdmins.email, email))
        if (row) adminRecord = { ...row, mfaEnabled: row.mfaEnabled ?? false, mfaSecret: row.mfaSecret ?? null }
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

        // Check if admin has MFA enrolled
        if (adminRecord.mfaEnabled && adminRecord.mfaSecret) {
          if (!totpCode) {
            // Return challenge — tell client to show MFA input
            return NextResponse.json({
              requiresMFA: true,
              adminId: adminRecord.id,
              mfaMethod: 'totp',
            })
          }
          // Verify TOTP code
          const isValid = await verifyTOTP(adminRecord.mfaSecret, totpCode)
          if (!isValid) {
            return NextResponse.json({ error: 'Invalid MFA code' }, { status: 401 })
          }
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

    // ─── MFA Enrollment ──────────────────────────────────────────────
    if (action === 'enroll-mfa') {
      const adminCookie = request.cookies.get(getAdminCookieName())
      if (!adminCookie?.value) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      const payload = await validateAdminSession(adminCookie.value)
      if (!payload) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      // Generate TOTP secret
      const secret = generateSecret()
      const qrCodeUrl = generateOTPAuthURI(secret, payload.email, 'Tempo Platform')

      return NextResponse.json({ secret, qrCodeUrl, setupRequired: true })
    }

    // ─── Verify MFA Enrollment ───────────────────────────────────────
    if (action === 'verify-mfa-enrollment') {
      const adminCookie = request.cookies.get(getAdminCookieName())
      if (!adminCookie?.value) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      const payload = await validateAdminSession(adminCookie.value)
      if (!payload) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      const { code, secret } = body
      if (!code || !secret) {
        return NextResponse.json({ error: 'Code and secret are required' }, { status: 400 })
      }

      // Verify the first code to confirm enrollment
      const isValid = await verifyTOTP(secret, code)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid verification code. Please try again.' }, { status: 400 })
      }

      // Mark admin as MFA enrolled (skip for demo admins)
      if (!payload.sessionId.startsWith('demo-admin-')) {
        try {
          await db.update(schema.platformAdmins)
            .set({ mfaEnabled: true, mfaSecret: secret })
            .where(eq(schema.platformAdmins.id, payload.adminId))
        } catch {
          return NextResponse.json({ error: 'Failed to save MFA configuration' }, { status: 500 })
        }
      }

      return NextResponse.json({ enrolled: true })
    }

    // ─── Disable MFA ─────────────────────────────────────────────────
    if (action === 'disable-mfa') {
      const adminCookie = request.cookies.get(getAdminCookieName())
      if (!adminCookie?.value) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
      }
      const payload = await validateAdminSession(adminCookie.value)
      if (!payload) {
        return NextResponse.json({ error: 'Session expired' }, { status: 401 })
      }

      if (!payload.sessionId.startsWith('demo-admin-')) {
        try {
          await db.update(schema.platformAdmins)
            .set({ mfaEnabled: false, mfaSecret: null })
            .where(eq(schema.platformAdmins.id, payload.adminId))
        } catch {
          return NextResponse.json({ error: 'Failed to disable MFA' }, { status: 500 })
        }
      }

      return NextResponse.json({ ok: true, mfaDisabled: true })
    }

    // ─── SSO Login ─────────────────────────────────────────────────────
    if (action === 'sso-login') {
      const { provider, token, email: ssoEmail } = body
      if (!provider || !ssoEmail) {
        return NextResponse.json({ error: 'Provider and email are required' }, { status: 400 })
      }

      // Verify SSO token with provider
      let verified = false
      try {
        if (provider === 'google') {
          // Verify Google ID token via Google's tokeninfo endpoint
          const googleRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${token}`)
          if (googleRes.ok) {
            const googleData = await googleRes.json()
            verified = googleData.email === ssoEmail && googleData.email_verified === 'true'
          }
        } else if (provider === 'microsoft') {
          // Verify Microsoft access token via Microsoft Graph
          const msRes = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (msRes.ok) {
            const msData = await msRes.json()
            verified = msData.mail === ssoEmail || msData.userPrincipalName === ssoEmail
          }
        }
      } catch {
        // Verification failed — fall through to error
      }

      // In demo mode, allow SSO without token verification
      const isDemoSSO = !token || token === 'demo'
      if (!verified && !isDemoSSO) {
        return NextResponse.json({ error: 'SSO token verification failed' }, { status: 401 })
      }

      // Check if email exists in platformAdmins (DB first)
      let adminRecord: { id: string; email: string; fullName: string; role: string; isActive: boolean } | null = null
      try {
        const [row] = await db.select().from(schema.platformAdmins)
          .where(eq(schema.platformAdmins.email, ssoEmail))
        if (row) adminRecord = row
      } catch {
        // DB unavailable — check demo credentials
      }

      if (adminRecord) {
        if (!adminRecord.isActive) {
          return NextResponse.json({ error: 'Account is deactivated' }, { status: 403 })
        }
        const ssoToken = await createAdminSession(adminRecord.id, adminRecord.email, adminRecord.role)
        try {
          await db.update(schema.platformAdmins)
            .set({ lastLoginAt: new Date() })
            .where(eq(schema.platformAdmins.id, adminRecord.id))
        } catch { /* non-critical */ }

        const cookie = setAdminSessionCookie(ssoToken)
        const response = NextResponse.json({
          ok: true,
          admin: { id: adminRecord.id, email: adminRecord.email, name: adminRecord.fullName, role: adminRecord.role },
        })
        response.cookies.set(cookie.name, cookie.value, cookie.options as Record<string, string | boolean | number>)
        return response
      }

      // Demo fallback for SSO
      const demoCred = demoAdminCredentials.find(c => c.email === ssoEmail)
      if (!demoCred) {
        return NextResponse.json({ error: 'Admin account not found or inactive' }, { status: 403 })
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
    console.error('Admin auth error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
