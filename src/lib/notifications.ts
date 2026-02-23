// Notification service - handles creation, delivery, and email sending
// Email integration ready for Resend/SendGrid (env var based)

import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

export interface CreateNotificationInput {
  orgId: string
  recipientId: string
  senderId?: string
  type?: 'info' | 'success' | 'warning' | 'action_required' | 'mention' | 'approval' | 'reminder'
  channel?: 'in_app' | 'email' | 'both'
  title: string
  message: string
  link?: string
  entityType?: string
  entityId?: string
}

export interface NotificationPayload {
  id: string
  type: string
  channel: string
  title: string
  message: string
  link: string | null
  entity_type: string | null
  entity_id: string | null
  is_read: boolean
  read_at: string | null
  sender_id: string | null
  created_at: string
}

// Send a notification (in-app + optionally email)
export async function sendNotification(input: CreateNotificationInput): Promise<NotificationPayload | null> {
  try {
    const [notification] = await db.insert(schema.notifications).values({
      orgId: input.orgId,
      recipientId: input.recipientId,
      senderId: input.senderId || null,
      type: input.type || 'info',
      channel: input.channel || 'in_app',
      title: input.title,
      message: input.message,
      link: input.link || null,
      entityType: input.entityType || null,
      entityId: input.entityId || null,
    }).returning()

    // If channel includes email, attempt email delivery
    if (input.channel === 'email' || input.channel === 'both') {
      await sendEmailNotification(notification.id, input)
    }

    return transformNotification(notification)
  } catch (error) {
    console.error('Failed to send notification:', error)
    return null
  }
}

// Send bulk notifications (e.g., to all managers)
export async function sendBulkNotifications(
  recipientIds: string[],
  baseInput: Omit<CreateNotificationInput, 'recipientId'>
): Promise<number> {
  let sent = 0
  for (const recipientId of recipientIds) {
    const result = await sendNotification({ ...baseInput, recipientId })
    if (result) sent++
  }
  return sent
}

// Get notifications for a user
export async function getNotifications(
  recipientId: string,
  options: { limit?: number; unreadOnly?: boolean } = {}
): Promise<NotificationPayload[]> {
  const { limit = 50, unreadOnly = false } = options

  const conditions = [eq(schema.notifications.recipientId, recipientId)]
  if (unreadOnly) {
    conditions.push(eq(schema.notifications.isRead, false))
  }

  const rows = await db.select()
    .from(schema.notifications)
    .where(and(...conditions))
    .orderBy(desc(schema.notifications.createdAt))
    .limit(limit)

  return rows.map(transformNotification)
}

// Get unread count
export async function getUnreadCount(recipientId: string): Promise<number> {
  const rows = await db.select()
    .from(schema.notifications)
    .where(
      and(
        eq(schema.notifications.recipientId, recipientId),
        eq(schema.notifications.isRead, false)
      )
    )
  return rows.length
}

// Mark notification as read
export async function markAsRead(notificationId: string): Promise<void> {
  await db.update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(eq(schema.notifications.id, notificationId))
}

// Mark all as read for a user
export async function markAllAsRead(recipientId: string): Promise<void> {
  await db.update(schema.notifications)
    .set({ isRead: true, readAt: new Date() })
    .where(
      and(
        eq(schema.notifications.recipientId, recipientId),
        eq(schema.notifications.isRead, false)
      )
    )
}

// Email sending (pluggable - supports Resend, SendGrid, or SMTP)
async function sendEmailNotification(notificationId: string, input: CreateNotificationInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY
  if (!apiKey) {
    console.log('[Notifications] No email provider configured (set RESEND_API_KEY or SENDGRID_API_KEY)')
    return
  }

  try {
    // Get recipient email
    const [recipient] = await db.select({ email: schema.employees.email, fullName: schema.employees.fullName })
      .from(schema.employees)
      .where(eq(schema.employees.id, input.recipientId))

    if (!recipient) return

    const fromEmail = process.env.EMAIL_FROM || 'notifications@tempo.app'

    if (process.env.RESEND_API_KEY) {
      // Resend
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `Tempo <${fromEmail}>`,
          to: [recipient.email],
          subject: input.title,
          html: buildEmailHTML(input.title, input.message, input.link),
        }),
      })
    } else if (process.env.SENDGRID_API_KEY) {
      // SendGrid
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: recipient.email }] }],
          from: { email: fromEmail, name: 'Tempo' },
          subject: input.title,
          content: [{ type: 'text/html', value: buildEmailHTML(input.title, input.message, input.link) }],
        }),
      })
    }

    // Mark email as sent
    await db.update(schema.notifications)
      .set({ emailSentAt: new Date() })
      .where(eq(schema.notifications.id, notificationId))

  } catch (error) {
    console.error('[Notifications] Email delivery failed:', error)
  }
}

// Build email HTML template
function buildEmailHTML(title: string, message: string, link?: string | null): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#ea580c;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    <div style="padding:32px">
      <h2 style="margin:0 0 12px;font-size:18px;font-weight:600;color:#111">${title}</h2>
      <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#555">${message}</p>
      ${link ? `<a href="${link}" style="display:inline-block;padding:10px 24px;background:#ea580c;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:500">View in Tempo</a>` : ''}
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Sent by Tempo - Unified Workforce Platform</p>
    </div>
  </div>
</body>
</html>`
}

// Transform DB row to API payload
function transformNotification(row: typeof schema.notifications.$inferSelect): NotificationPayload {
  return {
    id: row.id,
    type: row.type,
    channel: row.channel,
    title: row.title,
    message: row.message,
    link: row.link,
    entity_type: row.entityType,
    entity_id: row.entityId,
    is_read: row.isRead,
    read_at: row.readAt?.toISOString() || null,
    sender_id: row.senderId,
    created_at: row.createdAt.toISOString(),
  }
}

// Notification triggers - called from CRUD operations
export const NotificationTriggers = {
  // Leave request submitted
  async leaveRequested(orgId: string, employeeId: string, employeeName: string, managerId: string) {
    await sendNotification({
      orgId,
      recipientId: managerId,
      senderId: employeeId,
      type: 'action_required',
      title: 'Leave Request Pending',
      message: `${employeeName} has submitted a leave request that requires your approval.`,
      link: '/time-attendance',
      entityType: 'leave_request',
    })
  },

  // Review assigned
  async reviewAssigned(orgId: string, reviewerId: string, revieweeName: string, cycleTitle: string) {
    await sendNotification({
      orgId,
      recipientId: reviewerId,
      type: 'action_required',
      title: 'Performance Review Assigned',
      message: `You have been assigned to review ${revieweeName} for "${cycleTitle}".`,
      link: '/performance',
      entityType: 'review',
    })
  },

  // Expense submitted
  async expenseSubmitted(orgId: string, employeeId: string, employeeName: string, managerId: string, amount: string) {
    await sendNotification({
      orgId,
      recipientId: managerId,
      senderId: employeeId,
      type: 'approval',
      title: 'Expense Report Submitted',
      message: `${employeeName} submitted an expense report for ${amount}.`,
      link: '/expense',
      entityType: 'expense_report',
    })
  },

  // Goal deadline approaching
  async goalDeadlineApproaching(orgId: string, employeeId: string, goalTitle: string, daysLeft: number) {
    await sendNotification({
      orgId,
      recipientId: employeeId,
      type: 'reminder',
      title: 'Goal Deadline Approaching',
      message: `Your goal "${goalTitle}" is due in ${daysLeft} days.`,
      link: '/performance',
      entityType: 'goal',
    })
  },

  // Salary review approved
  async salaryReviewApproved(orgId: string, employeeId: string, newSalary: string) {
    await sendNotification({
      orgId,
      recipientId: employeeId,
      type: 'success',
      title: 'Compensation Update',
      message: `Your compensation has been updated. New salary: ${newSalary}.`,
      link: '/compensation',
      entityType: 'salary_review',
    })
  },

  // Mentoring pair matched
  async mentoringPairMatched(orgId: string, mentorId: string, menteeId: string, menteeName: string, mentorName: string) {
    await sendNotification({
      orgId,
      recipientId: mentorId,
      type: 'info',
      title: 'New Mentoring Match',
      message: `You have been matched with ${menteeName} as their mentor.`,
      link: '/mentoring',
      entityType: 'mentoring_pair',
    })
    await sendNotification({
      orgId,
      recipientId: menteeId,
      type: 'info',
      title: 'New Mentoring Match',
      message: `You have been matched with ${mentorName} as your mentor.`,
      link: '/mentoring',
      entityType: 'mentoring_pair',
    })
  },

  // Workflow step assigned
  async workflowStepAssigned(orgId: string, assigneeId: string, workflowTitle: string, stepTitle: string) {
    await sendNotification({
      orgId,
      recipientId: assigneeId,
      type: 'action_required',
      title: 'Workflow Action Required',
      message: `Step "${stepTitle}" in workflow "${workflowTitle}" requires your action.`,
      link: '/workflow-studio',
      entityType: 'workflow',
    })
  },
}
