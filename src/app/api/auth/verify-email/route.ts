import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { verifyEmailToken } from '@/lib/email'

// GET /api/auth/verify-email?token=xxx - Verify email address from link
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')
    if (!token) {
      return NextResponse.redirect(new URL('/login?error=missing_token', request.url))
    }

    const result = await verifyEmailToken(token)
    if (!result) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url))
    }

    // Mark email as verified (update employee record)
    await db.update(schema.employees)
      .set({ updatedAt: new Date() })
      .where(eq(schema.employees.id, result.employeeId))

    // Audit
    const [employee] = await db.select({ orgId: schema.employees.orgId })
      .from(schema.employees)
      .where(eq(schema.employees.id, result.employeeId))

    if (employee) {
      await db.insert(schema.auditLog).values({
        orgId: employee.orgId,
        userId: result.employeeId,
        action: 'update',
        entityType: 'email_verification',
        entityId: result.employeeId,
        details: JSON.stringify({ email: result.email, verified: true }),
      })
    }

    return NextResponse.redirect(new URL('/login?verified=true', request.url))
  } catch (error) {
    console.error('[GET /api/auth/verify-email] Error:', error)
    return NextResponse.redirect(new URL('/login?error=verification_failed', request.url))
  }
}
