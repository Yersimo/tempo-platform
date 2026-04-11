import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { sendPasswordResetEmail, verifyPasswordResetToken } from '@/lib/email'
import { validatePasswordPolicy } from '@/lib/auth'
import { checkPasswordBreach } from '@/lib/security/breach-detection'

// POST /api/auth/reset-password
// Actions: request (send reset email), reset (change password with token)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'request') {
      // Send password reset email
      const { email } = body
      if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 })
      }

      // Find employee by email
      const [employee] = await db.select({ id: schema.employees.id, email: schema.employees.email })
        .from(schema.employees)
        .where(eq(schema.employees.email, email))

      // Always return success (don't leak whether email exists)
      if (employee) {
        await sendPasswordResetEmail(employee.email, employee.id)
      }

      return NextResponse.json({ success: true, message: 'If an account with that email exists, a reset link has been sent.' })
    }

    if (action === 'reset') {
      // Reset password using token
      const { token, newPassword } = body
      if (!token || !newPassword) {
        return NextResponse.json({ error: 'Token and newPassword are required' }, { status: 400 })
      }

      // Validate password policy
      const policyResult = validatePasswordPolicy(newPassword)
      if (!policyResult.valid) {
        return NextResponse.json(
          { error: policyResult.errors.join('. '), passwordErrors: policyResult.errors, strength: policyResult.strength },
          { status: 400 }
        )
      }

      // Check HIBP breach database
      try {
        const breachResult = await checkPasswordBreach(newPassword)
        if (breachResult.breached && !body.acknowledgeBreachWarning) {
          return NextResponse.json(
            {
              error: `This password has appeared in ${breachResult.count.toLocaleString()} data breaches. Please choose a different password or set acknowledgeBreachWarning to proceed.`,
              breached: true,
              breachCount: breachResult.count,
            },
            { status: 400 }
          )
        }
      } catch {
        // Fail open
      }

      const employeeId = await verifyPasswordResetToken(token)
      if (!employeeId) {
        return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 })
      }

      // Hash the new password using the same PBKDF2 method as auth.ts
      const salt = crypto.getRandomValues(new Uint8Array(32))
      const encoder = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey('raw', encoder.encode(newPassword), 'PBKDF2', false, ['deriveBits'])
      const derivedBits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 100_000 },
        keyMaterial,
        256
      )

      const toHex = (buf: ArrayBuffer | Uint8Array) => {
        const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
        return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      }

      const passwordHash = `pbkdf2:${toHex(salt)}:${toHex(derivedBits)}`

      await db.update(schema.employees)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(schema.employees.id, employeeId))

      // Audit the password reset
      const [employee] = await db.select({ orgId: schema.employees.orgId })
        .from(schema.employees)
        .where(eq(schema.employees.id, employeeId))

      if (employee) {
        await db.insert(schema.auditLog).values({
          orgId: employee.orgId,
          userId: employeeId,
          action: 'update',
          entityType: 'password_reset',
          entityId: employeeId,
          details: JSON.stringify({ method: 'email_token' }),
        })
      }

      return NextResponse.json({ success: true, message: 'Password has been reset. Please log in with your new password.' })
    }

    return NextResponse.json({ error: 'Invalid action. Use "request" or "reset".' }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/auth/reset-password] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Password reset failed' }, { status: 500 })
  }
}
