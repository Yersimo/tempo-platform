import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { validateSession, verifyPassword, getSessionCookieName } from '@/lib/auth'
import { generateSecret, verifyTOTP, generateOTPAuthURI, generateBackupCodes } from '@/lib/totp'

// POST /api/auth/mfa - MFA management endpoints
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    // All MFA actions require an active session (except verify during login, which uses mfaToken)
    const sessionCookie = request.cookies.get(getSessionCookieName())
    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = await validateSession(sessionCookie.value)
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 })
    }

    // ─── Enroll ─────────────────────────────────────────────────────
    if (action === 'enroll') {
      // Check if already enrolled
      const existing = await db.select()
        .from(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, session.employeeId),
            eq(schema.mfaEnrollments.isVerified, true)
          )
        )

      if (existing.length > 0) {
        return NextResponse.json({ error: 'MFA is already enabled' }, { status: 409 })
      }

      // Remove any unverified enrollments
      await db.delete(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, session.employeeId),
            eq(schema.mfaEnrollments.isVerified, false)
          )
        )

      // Generate secret and backup codes
      const secret = generateSecret()
      const backupCodes = generateBackupCodes()

      // Get employee email for the OTP URI
      const [employee] = await db.select()
        .from(schema.employees)
        .where(eq(schema.employees.id, session.employeeId))

      if (!employee) {
        return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
      }

      const otpAuthUri = generateOTPAuthURI(secret, employee.email)

      // Store enrollment (unverified until first code is confirmed)
      await db.insert(schema.mfaEnrollments).values({
        employeeId: session.employeeId,
        method: 'totp',
        secret,
        isVerified: false,
        backupCodes: backupCodes,
      })

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: session.orgId,
        userId: session.employeeId,
        action: 'create',
        entityType: 'mfa_enrollment',
        entityId: session.employeeId,
        details: 'MFA enrollment initiated (TOTP)',
      })

      return NextResponse.json({
        secret,
        otpAuthUri,
        backupCodes,
      })
    }

    // ─── Verify Enrollment ──────────────────────────────────────────
    if (action === 'verify_enrollment') {
      const { code } = body
      if (!code || code.length !== 6) {
        return NextResponse.json({ error: 'A valid 6-digit code is required' }, { status: 400 })
      }

      // Find unverified enrollment
      const [enrollment] = await db.select()
        .from(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, session.employeeId),
            eq(schema.mfaEnrollments.isVerified, false)
          )
        )

      if (!enrollment) {
        return NextResponse.json({ error: 'No pending MFA enrollment found' }, { status: 404 })
      }

      // Verify the TOTP code
      const valid = await verifyTOTP(enrollment.secret, code)
      if (!valid) {
        return NextResponse.json({ error: 'Invalid code. Please try again.' }, { status: 400 })
      }

      // Mark enrollment as verified
      await db.update(schema.mfaEnrollments)
        .set({ isVerified: true, lastUsedAt: new Date() })
        .where(eq(schema.mfaEnrollments.id, enrollment.id))

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: session.orgId,
        userId: session.employeeId,
        action: 'update',
        entityType: 'mfa_enrollment',
        entityId: session.employeeId,
        details: 'MFA enrollment verified and activated (TOTP)',
      })

      return NextResponse.json({ success: true })
    }

    // ─── Status ─────────────────────────────────────────────────────
    if (action === 'status') {
      const [enrollment] = await db.select()
        .from(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, session.employeeId),
            eq(schema.mfaEnrollments.isVerified, true)
          )
        )

      return NextResponse.json({
        enabled: !!enrollment,
        method: enrollment?.method || null,
        enrolledAt: enrollment?.createdAt || null,
        lastUsedAt: enrollment?.lastUsedAt || null,
      })
    }

    // ─── Disable ────────────────────────────────────────────────────
    if (action === 'disable') {
      const { password } = body
      if (!password) {
        return NextResponse.json({ error: 'Password is required to disable MFA' }, { status: 400 })
      }

      // Verify password
      const [employee] = await db.select()
        .from(schema.employees)
        .where(eq(schema.employees.id, session.employeeId))

      if (!employee || !employee.passwordHash) {
        return NextResponse.json({ error: 'Could not verify identity' }, { status: 401 })
      }

      const passwordValid = await verifyPassword(password, employee.passwordHash)
      if (!passwordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }

      // Delete all MFA enrollments for this employee
      await db.delete(schema.mfaEnrollments)
        .where(eq(schema.mfaEnrollments.employeeId, session.employeeId))

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: session.orgId,
        userId: session.employeeId,
        action: 'delete',
        entityType: 'mfa_enrollment',
        entityId: session.employeeId,
        details: 'MFA disabled',
      })

      return NextResponse.json({ success: true })
    }

    // ─── Regenerate Backup Codes ────────────────────────────────────
    if (action === 'backup_codes') {
      const { password } = body
      if (!password) {
        return NextResponse.json({ error: 'Password is required to regenerate backup codes' }, { status: 400 })
      }

      // Verify password
      const [employee] = await db.select()
        .from(schema.employees)
        .where(eq(schema.employees.id, session.employeeId))

      if (!employee || !employee.passwordHash) {
        return NextResponse.json({ error: 'Could not verify identity' }, { status: 401 })
      }

      const passwordValid = await verifyPassword(password, employee.passwordHash)
      if (!passwordValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }

      // Find verified enrollment
      const [enrollment] = await db.select()
        .from(schema.mfaEnrollments)
        .where(
          and(
            eq(schema.mfaEnrollments.employeeId, session.employeeId),
            eq(schema.mfaEnrollments.isVerified, true)
          )
        )

      if (!enrollment) {
        return NextResponse.json({ error: 'MFA is not enabled' }, { status: 404 })
      }

      const newCodes = generateBackupCodes()

      await db.update(schema.mfaEnrollments)
        .set({ backupCodes: newCodes })
        .where(eq(schema.mfaEnrollments.id, enrollment.id))

      // Audit log
      await db.insert(schema.auditLog).values({
        orgId: session.orgId,
        userId: session.employeeId,
        action: 'update',
        entityType: 'mfa_enrollment',
        entityId: session.employeeId,
        details: 'MFA backup codes regenerated',
      })

      return NextResponse.json({ backupCodes: newCodes })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error) {
    console.error('MFA error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
