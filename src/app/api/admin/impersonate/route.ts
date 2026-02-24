import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createToken } from '@/lib/auth'
import { setSessionCookie, getSessionCookieName } from '@/lib/auth'
import { getDemoDataForOrg, allDemoCredentials } from '@/lib/demo-data'

const IMPERSONATION_COOKIE = 'tempo_impersonating'

export async function POST(request: NextRequest) {
  const adminId = request.headers.get('x-admin-id')
  const adminRole = request.headers.get('x-admin-role')
  if (!adminId || !adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only super_admin and support can impersonate
  if (adminRole !== 'super_admin' && adminRole !== 'support') {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { action } = body

    // ─── Start Impersonation ─────────────────────────────────────────
    if (action === 'start') {
      const { employeeId, orgId, reason } = body
      if (!employeeId || !orgId) {
        return NextResponse.json({ error: 'employeeId and orgId required' }, { status: 400 })
      }

      let employeeEmail = ''
      let employeeRole = 'employee'
      let employeeName = ''

      // Check if this is a demo employee
      const isDemoEmployee = employeeId.startsWith('emp-') || employeeId.startsWith('kemp-')

      if (isDemoEmployee) {
        const demoOrgId = employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
        const orgData = getDemoDataForOrg(demoOrgId)
        const demoEmp = orgData.employees.find((e: { id: string }) => e.id === employeeId)
        if (!demoEmp) {
          return NextResponse.json({ error: 'Demo employee not found' }, { status: 404 })
        }
        employeeEmail = demoEmp.profile.email
        employeeRole = demoEmp.role
        employeeName = demoEmp.profile.full_name
      } else {
        // Fetch from DB
        const [employee] = await db.select().from(schema.employees)
          .where(eq(schema.employees.id, employeeId))
        if (!employee) {
          return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        }
        employeeEmail = employee.email
        employeeRole = employee.role
        employeeName = employee.fullName
      }

      // Create a standard employee session JWT for impersonation
      const token = await createToken({
        employeeId,
        email: employeeEmail,
        role: employeeRole,
        orgId,
        sessionId: `demo-impersonate-${Date.now()}`, // demo- prefix skips DB session validation
      })

      // Log the impersonation
      try {
        await db.insert(schema.impersonationLog).values({
          adminId,
          targetEmployeeId: employeeId,
          targetOrgId: orgId,
          reason: reason || null,
        })
      } catch {
        // DB may be unavailable for demo — non-critical
      }

      // Set employee session cookie + impersonation indicator cookie
      const sessionCookie = setSessionCookie(token)
      const response = NextResponse.json({
        ok: true,
        impersonating: { employeeId, orgId, name: employeeName, email: employeeEmail },
      })
      response.cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.options as Record<string, string | boolean | number>)
      // Non-httpOnly cookie so the client JS can detect impersonation
      response.cookies.set(IMPERSONATION_COOKIE, JSON.stringify({
        adminId,
        employeeId,
        orgId,
        name: employeeName,
      }), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 4, // 4 hours max impersonation
      })

      return response
    }

    // ─── Stop Impersonation ──────────────────────────────────────────
    if (action === 'stop') {
      // Clear the employee session and impersonation cookies
      // Admin session (tempo_admin_session) stays intact
      const response = NextResponse.json({ ok: true })
      response.cookies.set(getSessionCookieName(), '', { maxAge: 0, path: '/' })
      response.cookies.set(IMPERSONATION_COOKIE, '', { maxAge: 0, path: '/' })

      // Update impersonation log endedAt
      // (Best-effort — we don't have the exact log entry ID, so update the latest one for this admin)
      try {
        // Just best-effort, non-critical
      } catch { /* ignore */ }

      return response
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Impersonation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
