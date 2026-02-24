import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import {
  verifyPassword,
  hashPassword,
  createSession,
  createToken,
  validateSession,
  revokeSession,
  setSessionCookie,
  getSessionCookieName,
  getEmployeeFromSession,
  createMFAToken,
  verifyMFAToken,
} from '@/lib/auth'
import { verifyTOTP } from '@/lib/totp'
import { allDemoCredentials, getDemoDataForOrg } from '@/lib/demo-data'
import { sendWelcomeEmail } from '@/lib/email'
import { seedNewOrg } from '@/lib/org-seed'

// POST /api/auth - Authentication endpoints
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

      // Find employee by email
      const [employee] = await db.select().from(schema.employees)
        .where(eq(schema.employees.email, email))

      if (!employee) {
        // Demo fallback: check hardcoded demo credentials when DB has no match
        const demoCred = allDemoCredentials.find(c => c.email === email && c.password === password)
        if (!demoCred) {
          return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
        }
        // Build a JWT session for the demo user (no DB session needed — middleware only checks JWT)
        const demoOrgId = demoCred.employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
        const orgData = getDemoDataForOrg(demoOrgId)
        const demoEmp = orgData.employees.find((e: { id: string }) => e.id === demoCred.employeeId)
        const demoToken = await createToken({
          employeeId: demoCred.employeeId,
          email: demoCred.email,
          role: demoCred.role,
          orgId: demoOrgId,
          sessionId: `demo-${Date.now()}`,
        })
        const demoUser = {
          id: `user-${demoCred.employeeId}`,
          email: demoCred.email,
          full_name: demoEmp?.profile?.full_name || demoCred.label,
          avatar_url: demoEmp?.profile?.avatar_url || null,
          role: demoCred.role,
          department_id: demoEmp?.department_id || null,
          employee_id: demoCred.employeeId,
          job_title: demoEmp?.job_title || demoCred.title,
          department_name: demoCred.department,
        }
        const demoCookie = setSessionCookie(demoToken)
        const demoResponse = NextResponse.json({ user: demoUser })
        demoResponse.cookies.set(demoCookie.name, demoCookie.value, demoCookie.options as Parameters<typeof demoResponse.cookies.set>[2])
        return demoResponse
      }

      // Verify password (supports both legacy demo: and new pbkdf2: formats)
      const storedHash = employee.passwordHash
      if (!storedHash) {
        return NextResponse.json({ error: 'No password set for this account' }, { status: 401 })
      }

      const valid = await verifyPassword(password, storedHash)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
      }

      // Progressive password upgrade: migrate legacy demo: to pbkdf2:
      if (storedHash.startsWith('demo:')) {
        const newHash = await hashPassword(password)
        await db.update(schema.employees)
          .set({ passwordHash: newHash })
          .where(eq(schema.employees.id, employee.id))
      }

      // Check if employee has MFA enabled (gracefully handle if table doesn't exist)
      let mfaEnrollment = null
      try {
        const [enrollment] = await db.select()
          .from(schema.mfaEnrollments)
          .where(
            and(
              eq(schema.mfaEnrollments.employeeId, employee.id),
              eq(schema.mfaEnrollments.isVerified, true)
            )
          )
        mfaEnrollment = enrollment || null
      } catch {
        // MFA table may not exist yet — skip MFA check
      }

      if (mfaEnrollment) {
        // MFA is enabled - issue a temporary token instead of a session
        const mfaToken = await createMFAToken({
          employeeId: employee.id,
          email: employee.email,
          role: employee.role,
          orgId: employee.orgId,
        })

        return NextResponse.json({
          requiresMFA: true,
          mfaToken,
        })
      }

      // No MFA - create session directly
      const token = await createSession(
        employee.id,
        employee.orgId,
        employee.email,
        employee.role
      )

      // Get department name
      let departmentName = ''
      if (employee.departmentId) {
        const [dept] = await db.select().from(schema.departments)
          .where(eq(schema.departments.id, employee.departmentId))
        departmentName = dept?.name || ''
      }

      // Build user response
      const user = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: departmentName,
      }

      // Log the login to audit (non-blocking)
      try {
        await db.insert(schema.auditLog).values({
          orgId: employee.orgId,
          userId: employee.id,
          action: 'login',
          entityType: 'session',
          entityId: employee.id,
          details: `Login: ${employee.fullName} (${employee.email})`,
        })
      } catch {
        // Audit logging is non-critical
      }

      // Set httpOnly session cookie
      const cookie = setSessionCookie(token)
      const response = NextResponse.json({ user })
      response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])

      return response
    }

    // ─── Verify MFA ─────────────────────────────────────────────────
    if (action === 'verify_mfa') {
      const { mfaToken, code } = body
      if (!mfaToken || !code) {
        return NextResponse.json({ error: 'MFA token and code are required' }, { status: 400 })
      }

      // Verify the temporary MFA token
      const mfaPayload = await verifyMFAToken(mfaToken)
      if (!mfaPayload) {
        return NextResponse.json({ error: 'MFA session expired. Please log in again.' }, { status: 401 })
      }

      // Find MFA enrollment
      const [enrollment] = await db.select()
        .from(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, mfaPayload.employeeId),
            eq(schema.mfaEnrollments.isVerified, true)
          )
        )

      if (!enrollment) {
        return NextResponse.json({ error: 'MFA enrollment not found' }, { status: 400 })
      }

      // Try TOTP verification first
      let codeValid = await verifyTOTP(enrollment.secret, code)

      // If TOTP fails, check backup codes
      if (!codeValid) {
        const backupCodes = (enrollment.backupCodes as string[]) || []
        const codeIndex = backupCodes.indexOf(code)
        if (codeIndex >= 0) {
          // Remove used backup code
          const updatedCodes = [...backupCodes]
          updatedCodes.splice(codeIndex, 1)
          await db.update(schema.mfaEnrollments)
            .set({ backupCodes: updatedCodes })
            .where(eq(schema.mfaEnrollments.id, enrollment.id))
          codeValid = true
        }
      }

      if (!codeValid) {
        return NextResponse.json({ error: 'Invalid verification code' }, { status: 401 })
      }

      // Update last used timestamp
      await db.update(schema.mfaEnrollments)
        .set({ lastUsedAt: new Date() })
        .where(eq(schema.mfaEnrollments.id, enrollment.id))

      // MFA verified - create full session
      const [employee] = await db.select().from(schema.employees)
        .where(eq(schema.employees.id, mfaPayload.employeeId))

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      const token = await createSession(
        employee.id,
        employee.orgId,
        employee.email,
        employee.role
      )

      let departmentName = ''
      if (employee.departmentId) {
        const [dept] = await db.select().from(schema.departments)
          .where(eq(schema.departments.id, employee.departmentId))
        departmentName = dept?.name || ''
      }

      const mfaUser = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: departmentName,
      }

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: employee.orgId,
        userId: employee.id,
        action: 'login',
        entityType: 'session',
        entityId: employee.id,
        details: `Login with MFA: ${employee.fullName} (${employee.email})`,
      })

      const cookie = setSessionCookie(token)
      const response = NextResponse.json({ user: mfaUser })
      response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])

      return response
    }

    // ─── Logout ──────────────────────────────────────────────────────
    if (action === 'logout') {
      // Get session from cookie
      const sessionCookie = request.cookies.get(getSessionCookieName())
      if (sessionCookie?.value) {
        const session = await validateSession(sessionCookie.value)
        if (session) {
          // Revoke the session in DB
          await revokeSession(session.sessionId)

          // Log the logout (skip for demo sessions — no DB records)
          if (!session.sessionId.startsWith('demo-')) {
            const [employee] = await db.select().from(schema.employees)
              .where(eq(schema.employees.id, session.employeeId))

            if (employee) {
              await db.insert(schema.auditLog).values({
                orgId: employee.orgId,
                userId: employee.id,
                action: 'logout',
                entityType: 'session',
                entityId: employee.id,
                details: `Logout: ${employee.fullName}`,
              })
            }
          }
        }
      }

      // Clear the session cookie
      const response = NextResponse.json({ success: true })
      response.cookies.set(getSessionCookieName(), '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0,
      })

      return response
    }

    // ─── Get Current User (from session cookie) ─────────────────────
    if (action === 'me') {
      const sessionCookie = request.cookies.get(getSessionCookieName())
      if (!sessionCookie?.value) {
        return NextResponse.json({ user: null }, { status: 401 })
      }

      const session = await validateSession(sessionCookie.value)
      if (!session) {
        // Invalid/expired session, clear cookie
        const response = NextResponse.json({ user: null }, { status: 401 })
        response.cookies.set(getSessionCookieName(), '', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 0,
        })
        return response
      }

      // Demo sessions: return user from demo data instead of DB
      if (session.sessionId.startsWith('demo-')) {
        const demoOrgId = session.employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
        const orgData = getDemoDataForOrg(demoOrgId)
        const demoEmp = orgData.employees.find((e: { id: string }) => e.id === session.employeeId)
        if (!demoEmp) {
          return NextResponse.json({ user: null }, { status: 401 })
        }
        const demoCred = allDemoCredentials.find(c => c.employeeId === session.employeeId)
        return NextResponse.json({
          user: {
            id: `user-${demoEmp.id}`,
            email: demoEmp.profile?.email || session.email,
            full_name: demoEmp.profile?.full_name || demoCred?.label || '',
            avatar_url: demoEmp.profile?.avatar_url || null,
            role: demoEmp.role,
            department_id: demoEmp.department_id,
            employee_id: demoEmp.id,
            job_title: demoEmp.job_title,
            department_name: demoCred?.department || '',
            org_id: demoOrgId,
          }
        })
      }

      const user = await getEmployeeFromSession(session)
      if (!user) {
        return NextResponse.json({ user: null }, { status: 401 })
      }

      return NextResponse.json({ user })
    }

    // ─── Switch User (demo feature, requires active session + same org) ─────────
    if (action === 'switch_user') {
      const { employeeId } = body
      if (!employeeId) {
        return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
      }

      // Verify caller has an active session and get their org
      const sessionCookie = request.cookies.get(getSessionCookieName())
      let callerOrgId: string | null = null
      if (sessionCookie?.value) {
        const currentSession = await validateSession(sessionCookie.value)
        if (currentSession) {
          callerOrgId = currentSession.orgId
          await revokeSession(currentSession.sessionId)
        }
      }

      if (!callerOrgId) {
        return NextResponse.json({ error: 'Active session required' }, { status: 401 })
      }

      // Only allow switching to employees within the SAME org
      const [employee] = await db.select().from(schema.employees)
        .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, callerOrgId)))

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      // Create new session for switched user
      const token = await createSession(
        employee.id,
        employee.orgId,
        employee.email,
        employee.role
      )

      let departmentName = ''
      if (employee.departmentId) {
        const [dept] = await db.select().from(schema.departments)
          .where(eq(schema.departments.id, employee.departmentId))
        departmentName = dept?.name || ''
      }

      const user = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: departmentName,
      }

      // Audit log (uses 'login' action since switch_user is not in the enum)
      await db.insert(schema.auditLog).values({
        orgId: employee.orgId,
        userId: employee.id,
        action: 'login',
        entityType: 'session',
        entityId: employee.id,
        details: `Switch to user: ${employee.fullName} (${employee.email})`,
      })

      const cookie = setSessionCookie(token)
      const response = NextResponse.json({ user })
      response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])

      return response
    }

    // ─── Get Credentials (for demo login page — scoped to demo org only) ──────────────────────
    if (action === 'credentials') {
      // Only return credentials for the demo organization
      const [demoOrg] = await db.select().from(schema.organizations).limit(1)
      if (!demoOrg) {
        return NextResponse.json({ credentials: [] })
      }

      const employees = await db.select().from(schema.employees)
        .where(and(eq(schema.employees.isActive, true), eq(schema.employees.orgId, demoOrg.id)))

      const withPasswords = employees.filter(e => e.passwordHash)

      const departments = await db.select().from(schema.departments)
      const deptMap = new Map(departments.map(d => [d.id, d.name]))

      const credentials = withPasswords.map(e => ({
        email: e.email,
        password: 'demo1234',
        employeeId: e.id,
        role: e.role,
        label: e.role === 'owner' ? `${e.jobTitle} (Owner)` :
               e.role === 'hrbp' ? 'HR Business Partner' :
               e.jobTitle,
        title: e.jobTitle,
        department: e.departmentId ? deptMap.get(e.departmentId) || '' : '',
        description: e.role === 'owner' ? 'Full platform access. Sees all modules, AI insights, and executive dashboards.' :
                     e.role === 'admin' ? 'Department admin. Manages team performance, approvals, and recruiting.' :
                     e.role === 'hrbp' ? 'HR operations. Manages people, performance reviews, compensation, and engagement.' :
                     e.role === 'manager' ? 'Team manager. Reviews team goals, approves leave, manages direct reports.' :
                     'Individual contributor. Views own profile, goals, learning, and submits requests.',
      }))

      return NextResponse.json({ credentials })
    }

    // ─── Signup (create org + first admin) ─────────────────────────
    if (action === 'signup') {
      const { fullName, email, password, companyName, industry, size, country } = body

      // Validate required fields
      if (!fullName || !email || !password || !companyName) {
        return NextResponse.json(
          { error: 'Full name, email, password, and company name are required' },
          { status: 400 }
        )
      }
      if (password.length < 8) {
        return NextResponse.json(
          { error: 'Password must be at least 8 characters' },
          { status: 400 }
        )
      }

      // Check if email already exists
      const [existing] = await db.select({ id: schema.employees.id })
        .from(schema.employees)
        .where(eq(schema.employees.email, email))
      if (existing) {
        return NextResponse.json(
          { error: 'An account with this email already exists' },
          { status: 409 }
        )
      }

      // Generate slug from company name
      const slug = companyName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      // Create organization
      const [org] = await db.insert(schema.organizations).values({
        name: companyName,
        slug,
        plan: 'free',
        industry: industry || null,
        size: size || null,
        country: country || null,
      }).returning()

      // Hash password
      const passwordHashValue = await hashPassword(password)

      // Create first employee (owner/admin)
      const [employee] = await db.insert(schema.employees).values({
        orgId: org.id,
        fullName,
        email,
        passwordHash: passwordHashValue,
        role: 'owner',
        jobTitle: 'Founder',
        isActive: true,
      }).returning()

      // Create session
      const token = await createSession(
        employee.id,
        org.id,
        employee.email,
        employee.role
      )

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: org.id,
        userId: employee.id,
        action: 'create',
        entityType: 'organization',
        entityId: org.id,
        details: `Organization created: ${companyName}`,
      })

      // Send welcome email (non-blocking — don't await)
      sendWelcomeEmail(email, fullName, companyName).catch(err =>
        console.error('[Signup] Welcome email failed:', err)
      )

      // Seed default data for the new org (non-blocking)
      seedNewOrg(org.id, industry).catch(err =>
        console.error('[Signup] Org seed failed:', err)
      )

      const user = {
        id: `user-${employee.id}`,
        email: employee.email,
        full_name: employee.fullName,
        avatar_url: employee.avatarUrl,
        role: employee.role,
        department_id: employee.departmentId,
        employee_id: employee.id,
        job_title: employee.jobTitle,
        department_name: '',
        org_id: org.id,
      }

      const cookie = setSessionCookie(token)
      const response = NextResponse.json(
        { user, org: { id: org.id, name: org.name, slug: org.slug }, needsOnboarding: true },
        { status: 201 }
      )
      response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])

      return response
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
