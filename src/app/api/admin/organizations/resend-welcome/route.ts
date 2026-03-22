import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { hashPassword } from '@/lib/auth'
import { sendEmail } from '@/lib/email'

function generateTempPassword(): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghjkmnpqrstuvwxyz'
  const digits = '23456789'
  const special = '!@#$%&*'
  const all = upper + lower + digits + special

  let password = ''
  password += upper[Math.floor(Math.random() * upper.length)]
  password += lower[Math.floor(Math.random() * lower.length)]
  password += digits[Math.floor(Math.random() * digits.length)]
  password += special[Math.floor(Math.random() * special.length)]

  for (let i = 0; i < 12; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  return password.split('').sort(() => Math.random() - 0.5).join('')
}

// POST /api/admin/organizations/resend-welcome — resend welcome email with new temp password
export async function POST(request: NextRequest) {
  const adminRole = request.headers.get('x-admin-role')
  if (!adminRole) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { employeeId, orgId, orgName, email, fullName } = body

    if (!employeeId || !email || !fullName || !orgName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate a new temporary password
    const tempPassword = generateTempPassword()
    const passwordHash = await hashPassword(tempPassword)

    // Update the employee's password
    await db.update(schema.employees)
      .set({ passwordHash })
      .where(eq(schema.employees.id, employeeId))

    // Send welcome email
    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Welcome to Tempo, ${fullName}!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        Your login credentials for <strong>${orgName}</strong> on Tempo have been reset.
      </p>
      <div style="background:#f9fafb;border:1px solid #eee;border-radius:8px;padding:20px;margin-bottom:20px">
        <p style="margin:0 0 12px;font-size:13px;font-weight:600;color:#333">Your Login Details</p>
        <table style="width:100%;font-size:13px;color:#555">
          <tr><td style="padding:4px 0;font-weight:500;width:120px">Login URL</td><td><a href="https://theworktempo.com/login" style="color:#ea580c">https://theworktempo.com/login</a></td></tr>
          <tr><td style="padding:4px 0;font-weight:500">Email</td><td>${email}</td></tr>
          <tr><td style="padding:4px 0;font-weight:500">Temp Password</td><td style="font-family:monospace;background:#fff3e0;padding:2px 8px;border-radius:4px;font-size:14px">${tempPassword}</td></tr>
        </table>
      </div>
      <p style="margin:0 0 20px;font-size:13px;color:#888">
        You'll be asked to change your password on first login.
      </p>
      <a href="https://theworktempo.com/login" style="display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">Sign In to Tempo</a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
    </div>
  </div>
</body>
</html>`

    const sent = await sendEmail(email, `Your Tempo login credentials for ${orgName}`, emailHtml)

    // Audit log
    try {
      await db.insert(schema.auditLog).values({
        orgId,
        userId: employeeId,
        action: 'create',
        entityType: 'email',
        entityId: employeeId,
        details: `Welcome email resent by platform admin`,
      })
    } catch {
      // Non-critical
    }

    return NextResponse.json({ ok: true, sent })
  } catch (error) {
    console.error('Resend welcome email error:', error)
    return NextResponse.json({ error: 'Failed to resend welcome email' }, { status: 500 })
  }
}
