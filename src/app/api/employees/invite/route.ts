import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sendInvitationEmail } from '@/lib/email'
import { SignJWT } from 'jose'

const jwtSecretRaw = process.env.JWT_SECRET || 'tempo-dev-secret-change-in-production-2026'
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('CRITICAL SECURITY: JWT_SECRET is not set for invitation tokens. Using fallback secret. This is insecure in production!')
}
const JWT_SECRET = new TextEncoder().encode(jwtSecretRaw)

// POST /api/employees/invite — Invite employees by email
export async function POST(request: NextRequest) {
  const employeeRole = request.headers.get('x-employee-role')
  const orgId = request.headers.get('x-org-id')
  const inviterId = request.headers.get('x-employee-id')

  if (!orgId || !inviterId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only owners and admins can invite
  if (employeeRole !== 'owner' && employeeRole !== 'admin') {
    return NextResponse.json({ error: 'Only owners and admins can invite employees' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { emails, role = 'employee' } = body

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required' }, { status: 400 })
    }

    if (emails.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 invitations at a time' }, { status: 400 })
    }

    // Get org name for the invitation email
    const [org] = await db.select({ name: schema.organizations.name })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, orgId))

    const orgName = org?.name || 'your organization'

    const results: { email: string; status: 'invited' | 'already_exists' | 'error' }[] = []

    for (const email of emails) {
      const trimmed = email.trim().toLowerCase()
      if (!trimmed || !trimmed.includes('@')) {
        results.push({ email: trimmed, status: 'error' })
        continue
      }

      try {
        // Check if employee already exists in this org
        const [existing] = await db.select({ id: schema.employees.id })
          .from(schema.employees)
          .where(and(
            eq(schema.employees.email, trimmed),
            eq(schema.employees.orgId, orgId)
          ))

        if (existing) {
          results.push({ email: trimmed, status: 'already_exists' })
          continue
        }

        // Generate invitation token (JWT, 7 days)
        const invitationToken = await new SignJWT({
          purpose: 'invitation',
          email: trimmed,
          orgId,
          role,
          invitedBy: inviterId,
        })
          .setProtectedHeader({ alg: 'HS256' })
          .setExpirationTime('7d')
          .setIssuedAt()
          .sign(JWT_SECRET)

        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        // Create inactive employee record
        await db.insert(schema.employees).values({
          orgId,
          fullName: trimmed.split('@')[0], // Placeholder name, updated on accept
          email: trimmed,
          role: role as 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee',
          isActive: false,
          invitedBy: inviterId,
          invitationToken,
          invitationExpiresAt: expiresAt,
        })

        // Send invitation email (non-blocking)
        sendInvitationEmail(trimmed, orgName, invitationToken).catch(err =>
          console.error(`[Invite] Email failed for ${trimmed}:`, err)
        )

        // Audit log
        await db.insert(schema.auditLog).values({
          orgId,
          userId: inviterId,
          action: 'create',
          entityType: 'employee',
          entityId: trimmed,
          details: `Invited ${trimmed} as ${role}`,
        })

        results.push({ email: trimmed, status: 'invited' })
      } catch (err) {
        console.error(`[Invite] Error for ${trimmed}:`, err)
        results.push({ email: trimmed, status: 'error' })
      }
    }

    const invited = results.filter(r => r.status === 'invited').length
    return NextResponse.json({
      ok: true,
      invited,
      total: emails.length,
      results,
    })
  } catch (error) {
    console.error('Invite error:', error)
    return NextResponse.json({ error: 'Failed to send invitations' }, { status: 500 })
  }
}
