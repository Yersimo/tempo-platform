import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { hashPassword, createSession, setSessionCookie } from '@/lib/auth'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'tempo-jwt-secret-k9x2m7p4q8w1n6v3b5j0h'
)

// POST /api/employees/accept-invite — Accept an invitation and set password
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, fullName, password } = body

    if (!token || !fullName || !password) {
      return NextResponse.json({ error: 'Token, full name, and password are required' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
    }

    // Verify the invitation token
    let payload
    try {
      const result = await jwtVerify(token, JWT_SECRET)
      payload = result.payload as {
        purpose: string
        email: string
        orgId: string
        role: string
        invitedBy: string
      }
    } catch {
      return NextResponse.json({ error: 'Invalid or expired invitation link' }, { status: 400 })
    }

    if (payload.purpose !== 'invitation') {
      return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // Find the employee with this invitation token
    const [employee] = await db.select()
      .from(schema.employees)
      .where(eq(schema.employees.invitationToken, token))

    if (!employee) {
      return NextResponse.json({ error: 'Invitation not found or already accepted' }, { status: 404 })
    }

    if (employee.isActive) {
      return NextResponse.json({ error: 'This invitation has already been accepted' }, { status: 400 })
    }

    // Hash password and activate the employee
    const passwordHash = await hashPassword(password)

    await db.update(schema.employees)
      .set({
        fullName,
        passwordHash,
        isActive: true,
        emailVerified: true,
        invitationToken: null,
        invitationExpiresAt: null,
        updatedAt: new Date(),
      })
      .where(eq(schema.employees.id, employee.id))

    // Create a session
    const sessionToken = await createSession(
      employee.id,
      employee.orgId,
      employee.email,
      employee.role
    )

    // Get org info
    const [org] = await db.select({ id: schema.organizations.id, name: schema.organizations.name, slug: schema.organizations.slug })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, employee.orgId))

    // Audit log
    await db.insert(schema.auditLog).values({
      orgId: employee.orgId,
      userId: employee.id,
      action: 'create',
      entityType: 'employee',
      entityId: employee.id,
      details: `Accepted invitation and joined as ${employee.role}`,
    })

    const user = {
      id: `user-${employee.id}`,
      email: employee.email,
      full_name: fullName,
      avatar_url: null,
      role: employee.role,
      department_id: employee.departmentId,
      employee_id: employee.id,
      job_title: employee.jobTitle,
      department_name: '',
      org_id: employee.orgId,
    }

    const cookie = setSessionCookie(sessionToken)
    const response = NextResponse.json({
      ok: true,
      user,
      org: org ? { id: org.id, name: org.name, slug: org.slug } : null,
    })
    response.cookies.set(cookie.name, cookie.value, cookie.options as Parameters<typeof response.cookies.set>[2])

    return response
  } catch (error) {
    console.error('Accept invite error:', error)
    return NextResponse.json({ error: 'Failed to accept invitation' }, { status: 500 })
  }
}
