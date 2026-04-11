/**
 * Academy Email Service — Handles all email communication for external academies.
 *
 * Trigger functions: enrollment confirmation, session reminders, assignment due,
 * certificate issued, cohort start, and broadcast.
 *
 * Uses the existing sendEmail/sendBulkEmail infrastructure from src/lib/email.ts.
 * Logs every communication to the academy_communications table for audit.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, inArray } from 'drizzle-orm'
import { sendEmail, sendBulkEmail, type BulkEmailResult } from '@/lib/email'

// ============================================================
// TYPES
// ============================================================

interface ParticipantEmailData {
  id: string
  fullName: string
  email: string
  language: string
  academyId: string
  cohortId: string | null
}

interface AcademyEmailData {
  id: string
  name: string
  slug: string
  brandColor: string
  logoUrl: string | null
  welcomeMessage: string | null
}

interface SessionEmailData {
  id: string
  title: string
  description: string | null
  type: string
  scheduledDate: string
  scheduledTime: string | null
  durationMinutes: number
  instructor: string | null
  meetingUrl: string | null
}

interface AssignmentEmailData {
  id: string
  title: string
  description: string | null
  dueDate: string | null
  maxScore: number
}

interface CertificateEmailData {
  id: string
  name: string
  certificateNumber: string
  certificateUrl: string | null
}

interface CohortEmailData {
  id: string
  name: string
  startDate: string
  endDate: string
  facilitatorName: string | null
  facilitatorEmail: string | null
}

// ============================================================
// TEMPLATE HELPERS
// ============================================================

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Replace {{variable}} tokens in a template string with actual values.
 */
export function interpolateTemplate(
  template: string,
  variables: Record<string, string | number | null | undefined>
): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
    const value = variables[key]
    return value != null ? String(value) : ''
  })
}

/**
 * Build a full responsive HTML email with academy branding.
 */
function buildAcademyEmail(opts: {
  brandColor: string
  academyName: string
  logoUrl: string | null
  heading: string
  body: string
  ctaLabel?: string
  ctaUrl?: string
  footerText?: string
}): string {
  const {
    brandColor,
    academyName,
    logoUrl,
    heading,
    body,
    ctaLabel,
    ctaUrl,
    footerText,
  } = opts

  const logoBlock = logoUrl
    ? `<img src="${logoUrl}" alt="${academyName}" style="max-height:32px;max-width:160px;display:block" />`
    : `<span style="color:#fff;font-size:18px;font-weight:600;letter-spacing:-0.02em">${academyName}</span>`

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<div style="text-align:center;margin-top:28px">
           <a href="${ctaUrl}" style="display:inline-block;padding:14px 32px;background:${brandColor};color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">${ctaLabel}</a>
         </div>`
      : ''

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${heading}</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f5f7;margin:0;padding:40px 16px">
  <div style="max-width:580px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08)">
    <!-- Header -->
    <div style="background:${brandColor};padding:24px 32px">
      ${logoBlock}
    </div>
    <!-- Body -->
    <div style="padding:32px">
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#111;line-height:1.3">${heading}</h1>
      <div style="font-size:14px;line-height:1.7;color:#444">
        ${body}
      </div>
      ${ctaBlock}
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">${academyName} &mdash; Powered by Tempo</p>
      ${footerText ? `<p style="margin:6px 0 0;font-size:11px;color:#bbb">${footerText}</p>` : ''}
    </div>
  </div>
</body>
</html>`
}

// ============================================================
// COMMUNICATION LOGGING
// ============================================================

async function logCommunication(opts: {
  orgId: string
  academyId: string
  type: 'broadcast' | 'automated'
  triggerName: string
  subject: string
  body: string
  recipientCount: number
  status: 'sent' | 'failed'
}): Promise<void> {
  try {
    await db.insert(schema.academyCommunications).values({
      orgId: opts.orgId,
      academyId: opts.academyId,
      type: opts.type as never,
      triggerName: opts.triggerName,
      subject: opts.subject,
      body: opts.body,
      recipientCount: opts.recipientCount,
      status: opts.status as never,
      sentAt: opts.status === 'sent' ? new Date() : null,
    })
  } catch (err) {
    console.error('[AcademyEmail] Failed to log communication:', err)
  }
}

// ============================================================
// TRIGGER: ENROLLMENT CONFIRMATION
// ============================================================

export async function sendEnrollmentConfirmation(
  orgId: string,
  participant: ParticipantEmailData,
  academy: AcademyEmailData
): Promise<boolean> {
  const subject = `Welcome to ${academy.name}!`

  const welcomeNote = academy.welcomeMessage
    ? `<p style="margin:16px 0;padding:16px;background:#f0f9ff;border-left:4px solid ${academy.brandColor};border-radius:4px;font-style:italic;color:#555">${academy.welcomeMessage}</p>`
    : ''

  const body = `
    <p>Hi ${participant.fullName},</p>
    <p>You have been successfully enrolled in <strong>${academy.name}</strong>. We're excited to have you join us!</p>
    ${welcomeNote}
    <p>Here's what to expect:</p>
    <ul style="padding-left:20px;margin:12px 0;color:#555">
      <li style="margin-bottom:8px">Access your courses and learning materials through the academy portal</li>
      <li style="margin-bottom:8px">Join live sessions and community discussions</li>
      <li style="margin-bottom:8px">Complete assignments and earn your certificate</li>
    </ul>
    <p>If you have any questions, don't hesitate to reach out to your facilitator.</p>
  `

  const html = buildAcademyEmail({
    brandColor: academy.brandColor,
    academyName: academy.name,
    logoUrl: academy.logoUrl,
    heading: `Welcome to ${academy.name}`,
    body,
    ctaLabel: 'Go to Academy Portal',
    ctaUrl: `${APP_URL}/academy/${academy.slug}`,
    footerText: 'You received this because you were enrolled in this academy.',
  })

  const success = await sendEmail(participant.email, subject, html)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: 'enrollment_confirmation',
    subject,
    body: html,
    recipientCount: 1,
    status: success ? 'sent' : 'failed',
  })

  return success
}

// ============================================================
// TRIGGER: SESSION REMINDER
// ============================================================

export async function sendSessionReminder(
  orgId: string,
  participants: ParticipantEmailData[],
  academy: AcademyEmailData,
  session: SessionEmailData,
  reminderType: '24h' | '1h'
): Promise<BulkEmailResult> {
  const timeLabel = reminderType === '24h' ? 'tomorrow' : 'in 1 hour'
  const subject = `Reminder: ${session.title} starts ${timeLabel}`

  const recipients = participants.map((p) => {
    const meetingLink = session.meetingUrl
      ? `<p style="margin:16px 0"><strong>Meeting Link:</strong> <a href="${session.meetingUrl}" style="color:${academy.brandColor};text-decoration:underline">${session.meetingUrl}</a></p>`
      : ''

    const body = `
      <p>Hi ${p.fullName},</p>
      <p>This is a reminder that your session is starting <strong>${timeLabel}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;background:#f9fafb;border-radius:8px;overflow:hidden">
        <tr>
          <td style="padding:12px 16px;border-bottom:1px solid #eee">
            <strong style="color:#111">${session.title}</strong>
          </td>
        </tr>
        <tr>
          <td style="padding:10px 16px;font-size:13px;color:#555">
            <strong>Date:</strong> ${session.scheduledDate}${session.scheduledTime ? ` at ${session.scheduledTime}` : ''}<br>
            <strong>Duration:</strong> ${session.durationMinutes} minutes<br>
            <strong>Type:</strong> ${session.type}${session.instructor ? `<br><strong>Instructor:</strong> ${session.instructor}` : ''}
          </td>
        </tr>
      </table>
      ${meetingLink}
      ${session.description ? `<p style="font-size:13px;color:#666">${session.description}</p>` : ''}
    `

    const html = buildAcademyEmail({
      brandColor: academy.brandColor,
      academyName: academy.name,
      logoUrl: academy.logoUrl,
      heading: `Session Reminder`,
      body,
      ctaLabel: session.meetingUrl ? 'Join Session' : 'View Session Details',
      ctaUrl: session.meetingUrl || `${APP_URL}/academy/${academy.slug}`,
      footerText: 'You received this because you are enrolled in this academy.',
    })

    return { to: p.email, subject, html }
  })

  const result = await sendBulkEmail(recipients)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: `session_reminder_${reminderType}`,
    subject,
    body: `Session: ${session.title} | Reminder: ${reminderType}`,
    recipientCount: result.sent,
    status: result.sent > 0 ? 'sent' : 'failed',
  })

  return result
}

// ============================================================
// TRIGGER: ASSIGNMENT DUE REMINDER
// ============================================================

export async function sendAssignmentDueReminder(
  orgId: string,
  participants: ParticipantEmailData[],
  academy: AcademyEmailData,
  assignment: AssignmentEmailData
): Promise<BulkEmailResult> {
  const subject = `Assignment Due Soon: ${assignment.title}`

  const recipients = participants.map((p) => {
    const body = `
      <p>Hi ${p.fullName},</p>
      <p>This is a reminder that the following assignment is due in <strong>48 hours</strong>.</p>
      <div style="margin:16px 0;padding:16px;background:#E0F2F1;border:1px solid #80CBC4;border-radius:8px">
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111">${assignment.title}</p>
        ${assignment.description ? `<p style="margin:0 0 8px;font-size:13px;color:#666">${assignment.description}</p>` : ''}
        <p style="margin:0;font-size:13px;color:#555">
          <strong>Due Date:</strong> ${assignment.dueDate || 'Not specified'}<br>
          <strong>Max Score:</strong> ${assignment.maxScore} points
        </p>
      </div>
      <p>Make sure to submit your work before the deadline to avoid late penalties.</p>
    `

    const html = buildAcademyEmail({
      brandColor: academy.brandColor,
      academyName: academy.name,
      logoUrl: academy.logoUrl,
      heading: 'Assignment Due Reminder',
      body,
      ctaLabel: 'Submit Assignment',
      ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      footerText: 'You received this because you have a pending assignment.',
    })

    return { to: p.email, subject, html }
  })

  const result = await sendBulkEmail(recipients)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: 'assignment_due_48h',
    subject,
    body: `Assignment: ${assignment.title} | Due: ${assignment.dueDate}`,
    recipientCount: result.sent,
    status: result.sent > 0 ? 'sent' : 'failed',
  })

  return result
}

// ============================================================
// TRIGGER: CERTIFICATE ISSUED
// ============================================================

export async function sendCertificateIssued(
  orgId: string,
  participant: ParticipantEmailData,
  academy: AcademyEmailData,
  certificate: CertificateEmailData
): Promise<boolean> {
  const subject = `Congratulations! Your Certificate for ${academy.name}`

  const certLink = certificate.certificateUrl
    ? `<p style="margin:16px 0"><a href="${certificate.certificateUrl}" style="color:${academy.brandColor};text-decoration:underline;font-weight:600">Download Your Certificate (PDF)</a></p>`
    : ''

  const body = `
    <p>Hi ${participant.fullName},</p>
    <p>Congratulations on completing <strong>${academy.name}</strong>! Your certificate has been issued.</p>
    <div style="margin:20px 0;padding:24px;background:linear-gradient(135deg,#fefce8,#fef3c7);border:2px solid #fbbf24;border-radius:12px;text-align:center">
      <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#92400e">Certificate of Completion</p>
      <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111">${certificate.name}</p>
      <p style="margin:0;font-size:13px;color:#78716c">Awarded to <strong>${participant.fullName}</strong></p>
      <p style="margin:8px 0 0;font-size:11px;color:#a8a29e">Certificate #${certificate.certificateNumber}</p>
    </div>
    ${certLink}
    <p>We hope you enjoyed the learning experience. Keep up the great work!</p>
  `

  const html = buildAcademyEmail({
    brandColor: academy.brandColor,
    academyName: academy.name,
    logoUrl: academy.logoUrl,
    heading: 'Certificate Issued',
    body,
    ctaLabel: 'View Your Certificate',
    ctaUrl: certificate.certificateUrl || `${APP_URL}/academy/${academy.slug}`,
    footerText: 'You received this because you completed the academy program.',
  })

  const success = await sendEmail(participant.email, subject, html)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: 'certificate_issued',
    subject,
    body: html,
    recipientCount: 1,
    status: success ? 'sent' : 'failed',
  })

  return success
}

// ============================================================
// TRIGGER: COHORT START REMINDER
// ============================================================

export async function sendCohortStartReminder(
  orgId: string,
  participants: ParticipantEmailData[],
  academy: AcademyEmailData,
  cohort: CohortEmailData
): Promise<BulkEmailResult> {
  const subject = `${cohort.name} starts tomorrow!`

  const recipients = participants.map((p) => {
    const facilitatorBlock = cohort.facilitatorName
      ? `<p style="margin:12px 0;font-size:13px;color:#555"><strong>Your Facilitator:</strong> ${cohort.facilitatorName}${cohort.facilitatorEmail ? ` (<a href="mailto:${cohort.facilitatorEmail}" style="color:${academy.brandColor}">${cohort.facilitatorEmail}</a>)` : ''}</p>`
      : ''

    const body = `
      <p>Hi ${p.fullName},</p>
      <p>Your cohort <strong>${cohort.name}</strong> in <strong>${academy.name}</strong> starts <strong>tomorrow</strong>!</p>
      <div style="margin:16px 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px">
        <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#111">${cohort.name}</p>
        <p style="margin:0;font-size:13px;color:#555">
          <strong>Start Date:</strong> ${cohort.startDate}<br>
          <strong>End Date:</strong> ${cohort.endDate}
        </p>
      </div>
      ${facilitatorBlock}
      <p>Make sure you're prepared and ready to go. Check the academy portal for your first session and course materials.</p>
    `

    const html = buildAcademyEmail({
      brandColor: academy.brandColor,
      academyName: academy.name,
      logoUrl: academy.logoUrl,
      heading: 'Your Cohort Starts Tomorrow',
      body,
      ctaLabel: 'Open Academy Portal',
      ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      footerText: 'You received this because you are enrolled in this cohort.',
    })

    return { to: p.email, subject, html }
  })

  const result = await sendBulkEmail(recipients)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: 'cohort_start_24h',
    subject,
    body: `Cohort: ${cohort.name} | Start: ${cohort.startDate}`,
    recipientCount: result.sent,
    status: result.sent > 0 ? 'sent' : 'failed',
  })

  return result
}

// ============================================================
// TRIGGER: BROADCAST EMAIL
// ============================================================

export async function sendBroadcastEmail(
  orgId: string,
  academy: AcademyEmailData,
  participants: ParticipantEmailData[],
  opts: {
    subject: string
    body: string
    ctaLabel?: string
    ctaUrl?: string
  }
): Promise<BulkEmailResult> {
  const recipients = participants.map((p) => {
    // Interpolate participant-specific variables in subject and body
    const variables: Record<string, string> = {
      participant_name: p.fullName,
      participant_email: p.email,
      academy_name: academy.name,
      academy_slug: academy.slug,
    }

    const personalizedSubject = interpolateTemplate(opts.subject, variables)
    const personalizedBody = interpolateTemplate(opts.body, variables)

    const html = buildAcademyEmail({
      brandColor: academy.brandColor,
      academyName: academy.name,
      logoUrl: academy.logoUrl,
      heading: personalizedSubject,
      body: `<p>Hi ${p.fullName},</p>${personalizedBody}`,
      ctaLabel: opts.ctaLabel,
      ctaUrl: opts.ctaUrl,
      footerText: 'You received this broadcast from your academy administrator.',
    })

    return { to: p.email, subject: personalizedSubject, html }
  })

  const result = await sendBulkEmail(recipients)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'broadcast',
    triggerName: 'broadcast',
    subject: opts.subject,
    body: opts.body,
    recipientCount: result.sent,
    status: result.sent > 0 ? 'sent' : 'failed',
  })

  return result
}

// ============================================================
// CUSTOM TRIGGER (from academy_comm_triggers templates)
// ============================================================

export async function sendFromTriggerTemplate(
  orgId: string,
  academy: AcademyEmailData,
  participants: ParticipantEmailData[],
  trigger: {
    name: string
    triggerEvent: string
    subjectTemplate: string
    bodyTemplate: string | null
  },
  extraVariables?: Record<string, string | number | null>
): Promise<BulkEmailResult> {
  const recipients = participants.map((p) => {
    const variables: Record<string, string | number | null | undefined> = {
      participant_name: p.fullName,
      participant_email: p.email,
      academy_name: academy.name,
      academy_slug: academy.slug,
      ...extraVariables,
    }

    const subject = interpolateTemplate(trigger.subjectTemplate, variables)
    const bodyContent = trigger.bodyTemplate
      ? interpolateTemplate(trigger.bodyTemplate, variables)
      : `<p>Hi ${p.fullName},</p><p>This is a notification from ${academy.name}.</p>`

    const html = buildAcademyEmail({
      brandColor: academy.brandColor,
      academyName: academy.name,
      logoUrl: academy.logoUrl,
      heading: subject,
      body: bodyContent,
      ctaLabel: 'Go to Academy',
      ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      footerText: `Automated notification: ${trigger.name}`,
    })

    return { to: p.email, subject, html }
  })

  const result = await sendBulkEmail(recipients)

  await logCommunication({
    orgId,
    academyId: academy.id,
    type: 'automated',
    triggerName: trigger.triggerEvent,
    subject: trigger.subjectTemplate,
    body: trigger.bodyTemplate || '',
    recipientCount: result.sent,
    status: result.sent > 0 ? 'sent' : 'failed',
  })

  return result
}

// ============================================================
// PREVIEW — Returns rendered HTML without sending
// ============================================================

export function previewEmailTemplate(opts: {
  type: 'enrollment' | 'session_reminder' | 'assignment_due' | 'certificate' | 'cohort_start' | 'broadcast'
  academy: AcademyEmailData
  variables?: Record<string, string>
}): { subject: string; html: string } {
  const { type, academy, variables } = opts

  const sampleName = variables?.participant_name || 'Jane Doe'
  const brandColor = academy.brandColor

  switch (type) {
    case 'enrollment': {
      const subject = `Welcome to ${academy.name}!`
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: `Welcome to ${academy.name}`,
        body: `
          <p>Hi ${sampleName},</p>
          <p>You have been successfully enrolled in <strong>${academy.name}</strong>. We're excited to have you join us!</p>
          <p>Access your courses through the portal and start your learning journey.</p>
        `,
        ctaLabel: 'Go to Academy Portal',
        ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      })
      return { subject, html }
    }

    case 'session_reminder': {
      const sessionTitle = variables?.session_title || 'Introduction Webinar'
      const subject = `Reminder: ${sessionTitle} starts tomorrow`
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: 'Session Reminder',
        body: `
          <p>Hi ${sampleName},</p>
          <p>This is a reminder that your session is starting <strong>tomorrow</strong>.</p>
          <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px">
            <p style="margin:0;font-weight:600;color:#111">${sessionTitle}</p>
            <p style="margin:8px 0 0;font-size:13px;color:#555">Date: ${variables?.session_date || '2026-04-01'} | Duration: ${variables?.session_duration || '60'} min</p>
          </div>
        `,
        ctaLabel: 'Join Session',
        ctaUrl: variables?.meeting_url || `${APP_URL}/academy/${academy.slug}`,
      })
      return { subject, html }
    }

    case 'assignment_due': {
      const assignmentTitle = variables?.assignment_title || 'Final Project'
      const subject = `Assignment Due Soon: ${assignmentTitle}`
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: 'Assignment Due Reminder',
        body: `
          <p>Hi ${sampleName},</p>
          <p>Your assignment <strong>${assignmentTitle}</strong> is due in <strong>48 hours</strong>.</p>
          <p>Due Date: ${variables?.due_date || '2026-04-15'}</p>
          <p>Make sure to submit your work before the deadline.</p>
        `,
        ctaLabel: 'Submit Assignment',
        ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      })
      return { subject, html }
    }

    case 'certificate': {
      const subject = `Congratulations! Your Certificate for ${academy.name}`
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: 'Certificate Issued',
        body: `
          <p>Hi ${sampleName},</p>
          <p>Congratulations on completing <strong>${academy.name}</strong>!</p>
          <div style="margin:20px 0;padding:24px;background:linear-gradient(135deg,#fefce8,#fef3c7);border:2px solid #fbbf24;border-radius:12px;text-align:center">
            <p style="margin:0 0 4px;font-size:12px;text-transform:uppercase;letter-spacing:0.1em;color:#92400e">Certificate of Completion</p>
            <p style="margin:0 0 8px;font-size:20px;font-weight:700;color:#111">${variables?.certificate_name || academy.name}</p>
            <p style="margin:0;font-size:13px;color:#78716c">Awarded to <strong>${sampleName}</strong></p>
          </div>
        `,
        ctaLabel: 'View Certificate',
        ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      })
      return { subject, html }
    }

    case 'cohort_start': {
      const cohortName = variables?.cohort_name || 'Spring 2026 Cohort'
      const subject = `${cohortName} starts tomorrow!`
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: 'Your Cohort Starts Tomorrow',
        body: `
          <p>Hi ${sampleName},</p>
          <p>Your cohort <strong>${cohortName}</strong> in <strong>${academy.name}</strong> starts tomorrow!</p>
          <p>Start Date: ${variables?.start_date || '2026-04-01'}<br>End Date: ${variables?.end_date || '2026-06-30'}</p>
          <p>Check the academy portal for your first session and course materials.</p>
        `,
        ctaLabel: 'Open Academy Portal',
        ctaUrl: `${APP_URL}/academy/${academy.slug}`,
      })
      return { subject, html }
    }

    case 'broadcast': {
      const subject = variables?.subject || 'Academy Update'
      const bodyContent = variables?.body || '<p>This is a sample broadcast message from your academy administrator.</p>'
      const html = buildAcademyEmail({
        brandColor,
        academyName: academy.name,
        logoUrl: academy.logoUrl,
        heading: subject,
        body: `<p>Hi ${sampleName},</p>${bodyContent}`,
        ctaLabel: variables?.cta_label || undefined,
        ctaUrl: variables?.cta_url || undefined,
        footerText: 'This is a preview of a broadcast email.',
      })
      return { subject, html }
    }

    default: {
      const _exhaustive: never = type
      return { subject: 'Preview', html: '<p>Unknown template type</p>' }
    }
  }
}

// ============================================================
// RENDER EMAIL TEMPLATE — Simple {{variable}} replacement
// ============================================================

/**
 * Render an email template string with variable replacement.
 * Public alias for interpolateTemplate.
 */
export function renderEmailTemplate(
  template: string,
  variables: Record<string, string>
): string {
  return interpolateTemplate(template, variables)
}

// ============================================================
// SEND SINGLE ACADEMY EMAIL — Core send with logging
// ============================================================

/**
 * Send a single academy email and log it to the communications table.
 */
export async function sendAcademyEmail(
  orgId: string,
  to: string,
  subject: string,
  htmlBody: string,
  options?: {
    academyId?: string
    triggerName?: string
    type?: 'broadcast' | 'automated'
  }
): Promise<boolean> {
  const success = await sendEmail(to, subject, htmlBody)

  if (options?.academyId) {
    await logCommunication({
      orgId,
      academyId: options.academyId,
      type: options.type || 'automated',
      triggerName: options.triggerName || 'manual',
      subject,
      body: htmlBody,
      recipientCount: success ? 1 : 0,
      status: success ? 'sent' : 'failed',
    })
  }

  return success
}

// ============================================================
// SEND BULK ACADEMY EMAIL — Batch sending with logging
// ============================================================

/**
 * Send bulk academy emails to a list of recipients with logging.
 */
export async function sendBulkAcademyEmail(
  orgId: string,
  recipients: Array<{ to: string; name?: string }>,
  subject: string,
  htmlBody: string,
  options?: {
    academyId?: string
    triggerName?: string
    type?: 'broadcast' | 'automated'
  }
): Promise<BulkEmailResult> {
  const emailRecipients = recipients.map((r) => ({
    to: r.to,
    subject,
    html: r.name
      ? htmlBody.replace(/\{\{participant_name\}\}/g, r.name)
      : htmlBody,
  }))

  const result = await sendBulkEmail(emailRecipients)

  if (options?.academyId) {
    await logCommunication({
      orgId,
      academyId: options.academyId,
      type: options.type || 'broadcast',
      triggerName: options.triggerName || 'bulk_send',
      subject,
      body: htmlBody,
      recipientCount: result.sent,
      status: result.sent > 0 ? 'sent' : 'failed',
    })
  }

  return result
}

// ============================================================
// GET TRIGGERS FOR EVENT — Fetch active triggers for an event
// ============================================================

/**
 * Fetch all active communication triggers for a given event in an academy.
 */
export async function getTriggersForEvent(
  orgId: string,
  academyId: string,
  event: string
): Promise<Array<{
  id: string
  name: string
  triggerEvent: string
  subjectTemplate: string
  bodyTemplate: string | null
  isActive: boolean
}>> {
  const triggers = await db
    .select()
    .from(schema.academyCommTriggers)
    .where(
      and(
        eq(schema.academyCommTriggers.orgId, orgId),
        eq(schema.academyCommTriggers.academyId, academyId),
        eq(schema.academyCommTriggers.triggerEvent, event),
        eq(schema.academyCommTriggers.isActive, true)
      )
    )

  return triggers.map((t) => ({
    id: t.id,
    name: t.name,
    triggerEvent: t.triggerEvent,
    subjectTemplate: t.subjectTemplate,
    bodyTemplate: t.bodyTemplate,
    isActive: t.isActive,
  }))
}

// ============================================================
// PROCESS EMAIL TRIGGER — High-level trigger processor
// ============================================================

export type TriggerEvent =
  | 'enrollment_confirmed'
  | 'course_completed'
  | 'assignment_due'
  | 'session_reminder'
  | 'certificate_earned'
  | 'welcome'
  | 'progress_milestone'
  | 'cohort_start_24h'
  | 'session_reminder_24h'
  | 'session_reminder_1h'
  | 'assignment_due_48h'
  | string

/**
 * Process an email trigger event for an academy.
 *
 * Looks up active triggers for the given event, fetches participants,
 * renders templates, and sends emails. Returns aggregated results.
 */
export async function processEmailTrigger(
  orgId: string,
  academyId: string,
  triggerEvent: TriggerEvent,
  participantIds?: string[]
): Promise<{
  triggered: number
  totalSent: number
  totalFailed: number
  results: Array<{ triggerName: string; sent: number; failed: number }>
}> {
  const output = {
    triggered: 0,
    totalSent: 0,
    totalFailed: 0,
    results: [] as Array<{ triggerName: string; sent: number; failed: number }>,
  }

  const [academy] = await db
    .select()
    .from(schema.academies)
    .where(
      and(eq(schema.academies.id, academyId), eq(schema.academies.orgId, orgId))
    )
  if (!academy) {
    console.warn(`[AcademyEmail] processEmailTrigger: academy ${academyId} not found`)
    return output
  }

  const academyData: AcademyEmailData = {
    id: academy.id,
    name: academy.name,
    slug: academy.slug,
    brandColor: academy.brandColor,
    logoUrl: academy.logoUrl,
    welcomeMessage: academy.welcomeMessage,
  }

  const triggers = await getTriggersForEvent(orgId, academyId, triggerEvent)
  if (triggers.length === 0) {
    return output
  }

  // Build participant query conditions
  const baseConds = [
    eq(schema.academyParticipants.orgId, orgId),
    eq(schema.academyParticipants.academyId, academyId),
    eq(schema.academyParticipants.status, 'active' as never),
  ]

  const rows =
    participantIds && participantIds.length > 0
      ? await db
          .select()
          .from(schema.academyParticipants)
          .where(and(...baseConds, inArray(schema.academyParticipants.id, participantIds)))
      : await db
          .select()
          .from(schema.academyParticipants)
          .where(and(...baseConds))
          .limit(500)

  const participants: ParticipantEmailData[] = rows.map((p) => ({
    id: p.id,
    fullName: p.fullName,
    email: p.email,
    language: p.language,
    academyId: p.academyId,
    cohortId: p.cohortId,
  }))

  if (participants.length === 0) {
    return output
  }

  for (const trigger of triggers) {
    output.triggered++

    const result = await sendFromTriggerTemplate(
      orgId,
      academyData,
      participants,
      {
        name: trigger.name,
        triggerEvent: trigger.triggerEvent,
        subjectTemplate: trigger.subjectTemplate,
        bodyTemplate: trigger.bodyTemplate,
      }
    )

    output.totalSent += result.sent
    output.totalFailed += result.failed
    output.results.push({
      triggerName: trigger.name,
      sent: result.sent,
      failed: result.failed,
    })
  }

  console.log(
    `[AcademyEmail] processEmailTrigger: event=${triggerEvent} academy=${academyId} ` +
      `triggers=${output.triggered} sent=${output.totalSent} failed=${output.totalFailed}`
  )

  return output
}

// ============================================================
// GET EMAIL LOG — Fetch sent communications for an academy
// ============================================================

export async function getEmailLog(
  orgId: string,
  academyId: string,
  opts?: { page?: number; limit?: number }
): Promise<{
  data: Array<{
    id: string
    type: string
    triggerName: string | null
    subject: string
    recipientCount: number
    status: string
    sentAt: Date | null
    createdAt: Date
  }>
  pagination: { page: number; limit: number; total: number; totalPages: number }
}> {
  const page = Math.max(1, opts?.page || 1)
  const limit = Math.min(100, Math.max(1, opts?.limit || 25))
  const offset = (page - 1) * limit

  const where = and(
    eq(schema.academyCommunications.orgId, orgId),
    eq(schema.academyCommunications.academyId, academyId)
  )

  const [rows, countResult] = await Promise.all([
    db
      .select()
      .from(schema.academyCommunications)
      .where(where)
      .orderBy(desc(schema.academyCommunications.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.academyCommunications)
      .where(where),
  ])

  const total = countResult[0]?.count || 0

  return {
    data: rows.map((r) => ({
      id: r.id,
      type: r.type,
      triggerName: r.triggerName,
      subject: r.subject,
      recipientCount: r.recipientCount,
      status: r.status,
      sentAt: r.sentAt,
      createdAt: r.createdAt,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }
}

// ============================================================
// CRON HELPERS — Find pending time-based triggers
// ============================================================

/**
 * Find sessions starting within a time window (for cron-based reminders).
 */
export async function findSessionsInWindow(
  hoursAhead: number,
  windowMinutes: number = 60
): Promise<
  Array<{
    session: {
      id: string
      title: string
      description: string | null
      type: string
      scheduledDate: string
      scheduledTime: string | null
      durationMinutes: number
      instructor: string | null
      meetingUrl: string | null
    }
    academyId: string
    orgId: string
    cohortId: string | null
  }>
> {
  const now = new Date()
  const targetStart = new Date(
    now.getTime() + hoursAhead * 60 * 60 * 1000 - (windowMinutes / 2) * 60 * 1000
  )
  const targetEnd = new Date(
    now.getTime() + hoursAhead * 60 * 60 * 1000 + (windowMinutes / 2) * 60 * 1000
  )

  const targetStartDate = targetStart.toISOString().split('T')[0]
  const targetEndDate = targetEnd.toISOString().split('T')[0]

  const sessions = await db
    .select()
    .from(schema.academySessions)
    .where(
      and(
        gte(schema.academySessions.scheduledDate, targetStartDate),
        lte(schema.academySessions.scheduledDate, targetEndDate)
      )
    )

  return sessions.map((s) => ({
    session: {
      id: s.id,
      title: s.title,
      description: s.description,
      type: s.type,
      scheduledDate: s.scheduledDate,
      scheduledTime: s.scheduledTime,
      durationMinutes: s.durationMinutes,
      instructor: s.instructor,
      meetingUrl: s.meetingUrl,
    },
    academyId: s.academyId,
    orgId: s.orgId,
    cohortId: s.cohortId,
  }))
}

/**
 * Find assignments due within a time window (for cron-based reminders).
 */
export async function findAssignmentsDueInWindow(
  hoursAhead: number,
  windowMinutes: number = 60
): Promise<
  Array<{
    assignment: {
      id: string
      title: string
      description: string | null
      dueDate: string | null
      maxScore: number
    }
    academyId: string
    orgId: string
  }>
> {
  const now = new Date()
  const targetStart = new Date(
    now.getTime() + hoursAhead * 60 * 60 * 1000 - (windowMinutes / 2) * 60 * 1000
  )
  const targetEnd = new Date(
    now.getTime() + hoursAhead * 60 * 60 * 1000 + (windowMinutes / 2) * 60 * 1000
  )

  const targetStartDate = targetStart.toISOString().split('T')[0]
  const targetEndDate = targetEnd.toISOString().split('T')[0]

  const assignments = await db
    .select()
    .from(schema.academyAssignments)
    .where(
      and(
        gte(schema.academyAssignments.dueDate, targetStartDate),
        lte(schema.academyAssignments.dueDate, targetEndDate)
      )
    )

  return assignments.map((a) => ({
    assignment: {
      id: a.id,
      title: a.title,
      description: a.description,
      dueDate: a.dueDate,
      maxScore: a.maxScore,
    },
    academyId: a.academyId,
    orgId: a.orgId,
  }))
}

/**
 * Find scheduled communications that are due to be sent.
 */
export async function findScheduledCommunications(): Promise<
  Array<{
    id: string
    orgId: string
    academyId: string
    subject: string
    body: string | null
    type: string
    triggerName: string | null
  }>
> {
  const now = new Date()

  const rows = await db
    .select()
    .from(schema.academyCommunications)
    .where(
      and(
        eq(schema.academyCommunications.status, 'scheduled' as never),
        lte(schema.academyCommunications.scheduledAt, now)
      )
    )
    .limit(50)

  return rows.map((r) => ({
    id: r.id,
    orgId: r.orgId,
    academyId: r.academyId,
    subject: r.subject,
    body: r.body,
    type: r.type,
    triggerName: r.triggerName,
  }))
}

/**
 * Mark a scheduled communication as sent.
 */
export async function markCommunicationSent(
  communicationId: string,
  recipientCount: number
): Promise<void> {
  await db
    .update(schema.academyCommunications)
    .set({
      status: 'sent' as never,
      sentAt: new Date(),
      recipientCount,
    })
    .where(eq(schema.academyCommunications.id, communicationId))
}

/**
 * Mark a scheduled communication as failed.
 */
export async function markCommunicationFailed(communicationId: string): Promise<void> {
  await db
    .update(schema.academyCommunications)
    .set({ status: 'failed' as never })
    .where(eq(schema.academyCommunications.id, communicationId))
}
