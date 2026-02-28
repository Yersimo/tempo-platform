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
// Core email sending (public)
// ---------------------------------------------------------------------------

export async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
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
// Bulk email sending with rate limiting (10 emails/second)
// ---------------------------------------------------------------------------

export interface BulkEmailRecipient {
  to: string
  subject: string
  html: string
}

export interface BulkEmailResult {
  total: number
  sent: number
  failed: number
  errors: Array<{ to: string; error: string }>
}

const BULK_RATE_LIMIT = 10 // emails per second

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function sendBulkEmail(
  recipients: BulkEmailRecipient[]
): Promise<BulkEmailResult> {
  const result: BulkEmailResult = {
    total: recipients.length,
    sent: 0,
    failed: 0,
    errors: [],
  }

  for (let i = 0; i < recipients.length; i++) {
    const recipient = recipients[i]

    try {
      const success = await sendEmail(recipient.to, recipient.subject, recipient.html)
      if (success) {
        result.sent++
      } else {
        result.failed++
        result.errors.push({ to: recipient.to, error: 'Send returned false' })
      }
    } catch (error) {
      result.failed++
      result.errors.push({
        to: recipient.to,
        error: error instanceof Error ? error.message : String(error),
      })
    }

    // Rate limit: pause after every BULK_RATE_LIMIT emails
    if ((i + 1) % BULK_RATE_LIMIT === 0 && i + 1 < recipients.length) {
      await sleep(1000)
    }
  }

  console.log(
    `[Email] Bulk send complete: ${result.sent}/${result.total} sent, ${result.failed} failed`
  )

  return result
}

// ---------------------------------------------------------------------------
// Daily digest email
// ---------------------------------------------------------------------------

export interface DigestItem {
  icon?: string
  title: string
  description: string
  link?: string
  timestamp?: string
  category?: string
}

export async function sendDigestEmail(
  to: string,
  name: string,
  items: DigestItem[]
): Promise<boolean> {
  if (items.length === 0) {
    return false // No items, skip sending
  }

  const categoryOrder = ['approvals', 'payroll', 'expenses', 'time_off', 'learning', 'performance', 'general']

  // Group items by category
  const grouped: Record<string, DigestItem[]> = {}
  for (const item of items) {
    const cat = item.category ?? 'general'
    if (!grouped[cat]) grouped[cat] = []
    grouped[cat].push(item)
  }

  // Build category sections
  const sections = categoryOrder
    .filter(cat => grouped[cat] && grouped[cat].length > 0)
    .map(cat => {
      const categoryLabels: Record<string, string> = {
        approvals: 'Pending Approvals',
        payroll: 'Payroll',
        expenses: 'Expenses',
        time_off: 'Time Off',
        learning: 'Learning & Training',
        performance: 'Performance',
        general: 'Other Notifications',
      }
      const label = categoryLabels[cat] ?? cat
      const catItems = grouped[cat]

      const rows = catItems.map(item => `
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0">
            <p style="margin:0 0 2px;font-size:13px;font-weight:600;color:#111">${item.icon ?? ''} ${item.title}</p>
            <p style="margin:0;font-size:12px;color:#888;line-height:1.4">${item.description}</p>
            ${item.timestamp ? `<p style="margin:2px 0 0;font-size:11px;color:#bbb">${item.timestamp}</p>` : ''}
          </td>
          <td style="padding:10px 12px;border-bottom:1px solid #f0f0f0;text-align:right;vertical-align:middle">
            ${item.link ? `<a href="${APP_URL}${item.link}" style="font-size:12px;color:#ea580c;text-decoration:none;font-weight:500">View</a>` : ''}
          </td>
        </tr>
      `).join('')

      return `
        <div style="margin-bottom:16px">
          <p style="margin:0 0 8px;font-size:12px;font-weight:600;color:#666;text-transform:uppercase;letter-spacing:0.05em">${label} (${catItems.length})</p>
          <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden">
            ${rows}
          </table>
        </div>
      `
    }).join('')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
      <span style="color:#666;font-size:13px;float:right;line-height:24px">Daily Digest</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 4px;font-size:20px;font-weight:600;color:#111">Good morning, ${name}</h2>
      <p style="margin:0 0 24px;font-size:13px;color:#888">${today} &middot; ${items.length} notification${items.length !== 1 ? 's' : ''}</p>
      ${sections}
      <div style="text-align:center;margin-top:24px">
        <a href="${APP_URL}/notifications" style="display:inline-block;padding:12px 28px;background:#ea580c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">View All Notifications</a>
      </div>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">Manage digest preferences in Settings &gt; Notifications.</p>
    </div>
  </div>
</body>
</html>`

  return sendEmail(to, `Your Daily Digest - ${items.length} notification${items.length !== 1 ? 's' : ''}`, html)
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
