// Email service for transactional emails
// Supports password reset, welcome emails, email verification, and invitations
// Uses Resend or SendGrid (configured via environment variables)

import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || (process.env.NODE_ENV === 'development' ? 'tempo-dev-secret-change-in-production-2026' : '')
)
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
const FROM_EMAIL = process.env.EMAIL_FROM || 'notifications@tempo.app'

// ---------------------------------------------------------------------------
// Core email sending
// ---------------------------------------------------------------------------

async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.log(`[Email] No provider configured. Would send to ${to}: ${subject}`)
    return false
  }

  try {
    if (process.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: `Tempo <${FROM_EMAIL}>`, to: [to], subject, html }),
      })
      return res.ok
    } else if (process.env.SENDGRID_API_KEY) {
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: FROM_EMAIL, name: 'Tempo' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      })
      return res.ok || res.status === 202
    }
    return false
  } catch (error) {
    console.error('[Email] Send failed:', error)
    return false
  }
}

// ---------------------------------------------------------------------------
// Token generation
// ---------------------------------------------------------------------------

async function generateToken(payload: Record<string, unknown>, expiresIn: string): Promise<string> {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(JWT_SECRET)
}

async function verifyToken(token: string): Promise<Record<string, unknown> | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as Record<string, unknown>
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function wrapTemplate(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    ${content}
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">If you didn't request this email, please ignore it.</p>
    </div>
  </div>
</body>
</html>`
}

function buttonStyle(): string {
  return 'display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600'
}

// ---------------------------------------------------------------------------
// Welcome Email
// ---------------------------------------------------------------------------

export async function sendWelcomeEmail(to: string, name: string, orgName: string): Promise<boolean> {
  const html = wrapTemplate(`
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Welcome to Tempo!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        Hi ${name}, you've been added to <strong>${orgName}</strong> on Tempo.
        Your unified workforce platform is ready.
      </p>
      <a href="${APP_URL}/login" style="${buttonStyle()}">Sign In to Tempo</a>
      <div style="margin-top:24px;padding-top:20px;border-top:1px solid #eee">
        <p style="margin:0;font-size:13px;font-weight:600;color:#333">Getting Started:</p>
        <ul style="margin:8px 0 0;padding-left:20px;font-size:13px;color:#555;line-height:1.8">
          <li>Complete your profile with photo and contact details</li>
          <li>Review your goals and performance objectives</li>
          <li>Explore the module sidebar to see all available tools</li>
        </ul>
      </div>
    </div>`)

  return sendEmail(to, `Welcome to ${orgName} on Tempo`, html)
}

// ---------------------------------------------------------------------------
// Password Reset
// ---------------------------------------------------------------------------

export async function sendPasswordResetEmail(to: string, employeeId: string): Promise<boolean> {
  const token = await generateToken({ employeeId, purpose: 'password_reset' }, '1h')
  const resetUrl = `${APP_URL}/reset-password?token=${token}`

  const html = wrapTemplate(`
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Reset Your Password</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        We received a request to reset your password. Click the button below to set a new password.
        This link expires in 1 hour.
      </p>
      <a href="${resetUrl}" style="${buttonStyle()}">Reset Password</a>
      <p style="margin:20px 0 0;font-size:12px;color:#999">
        If you didn't request this, your account is safe. No changes have been made.
      </p>
    </div>`)

  return sendEmail(to, 'Reset Your Tempo Password', html)
}

export async function verifyPasswordResetToken(token: string): Promise<string | null> {
  const payload = await verifyToken(token)
  if (!payload || payload.purpose !== 'password_reset') return null
  return payload.employeeId as string
}

// ---------------------------------------------------------------------------
// Email Verification
// ---------------------------------------------------------------------------

export async function sendVerificationEmail(to: string, employeeId: string): Promise<boolean> {
  const token = await generateToken({ employeeId, email: to, purpose: 'email_verification' }, '24h')
  const verifyUrl = `${APP_URL}/api/auth/verify-email?token=${token}`

  const html = wrapTemplate(`
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">Verify Your Email</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        Please verify your email address by clicking the button below. This link expires in 24 hours.
      </p>
      <a href="${verifyUrl}" style="${buttonStyle()}">Verify Email Address</a>
    </div>`)

  return sendEmail(to, 'Verify Your Tempo Email', html)
}

export async function verifyEmailToken(token: string): Promise<{ employeeId: string; email: string } | null> {
  const payload = await verifyToken(token)
  if (!payload || payload.purpose !== 'email_verification') return null
  return { employeeId: payload.employeeId as string, email: payload.email as string }
}

// ---------------------------------------------------------------------------
// Team Invitation
// ---------------------------------------------------------------------------

export async function sendInvitationEmail(
  to: string,
  orgName: string,
  invitationToken: string,
): Promise<boolean> {
  const inviteUrl = `${APP_URL}/invite/${encodeURIComponent(invitationToken)}`

  const html = wrapTemplate(`
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">You're Invited!</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        You've been invited to join <strong>${orgName}</strong> on Tempo — a unified workforce platform for your team.
      </p>
      <a href="${inviteUrl}" style="${buttonStyle()}">Accept Invitation</a>
      <p style="margin:20px 0 0;font-size:12px;color:#999">This invitation expires in 7 days.</p>
    </div>`)

  return sendEmail(to, `You're invited to join ${orgName} on Tempo`, html)
}
