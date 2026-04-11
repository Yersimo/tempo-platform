import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import { sendSlackMessage } from '@/lib/integrations/slack'
import { sendEmail } from '@/lib/email'
import {
  payrollApprovedEmail,
  payrollPaidEmail,
  payrollProcessedEmail,
  payrollApprovalEmail,
  expenseApprovalEmail,
  expenseRejectedEmail,
  leaveRequestApprovalEmail,
  trainingOverdueEmail,
  trainingCompletedEmail,
  reviewAssignedEmail,
  approvalNeededEmail,
} from '@/lib/email-templates'

// ---------------------------------------------------------------------------
// Notification event types that trigger dispatches
// ---------------------------------------------------------------------------

export type NotificationEvent =
  | 'payroll_approved'
  | 'payroll_paid'
  | 'expense_submitted'
  | 'expense_approved'
  | 'expense_rejected'
  | 'leave_requested'
  | 'leave_approved'
  | 'leave_rejected'
  | 'training_overdue'
  | 'training_completed'
  | 'review_assigned'
  | 'approval_needed'

export interface NotificationPayload {
  orgId: string
  recipientIds: string[] // employee IDs
  senderId?: string
  event: NotificationEvent
  title: string
  message: string
  link?: string
  entityType?: string
  entityId?: string
  slackChannel?: string // override default channel
  metadata?: Record<string, unknown> // extra data for email templates
}

export interface DispatchResult {
  inApp: number
  email: number
  slack: number
  errors: string[]
}

// ---------------------------------------------------------------------------
// Email delivery tracking
// ---------------------------------------------------------------------------

interface EmailDeliveryRecord {
  recipientId: string
  recipientEmail: string
  event: NotificationEvent
  status: 'sent' | 'failed' | 'skipped'
  error?: string
  timestamp: Date
  orgId: string
}

// In-memory delivery log (in production, persist to a table)
const emailDeliveryLog: EmailDeliveryRecord[] = []

// ---------------------------------------------------------------------------
// Event → preference category mapping
// ---------------------------------------------------------------------------

const EVENT_CATEGORY_MAP: Record<NotificationEvent, string> = {
  payroll_approved: 'payroll',
  payroll_paid: 'payroll',
  expense_submitted: 'expenses',
  expense_approved: 'expenses',
  expense_rejected: 'expenses',
  leave_requested: 'time_off',
  leave_approved: 'time_off',
  leave_rejected: 'time_off',
  training_overdue: 'learning',
  training_completed: 'learning',
  review_assigned: 'performance',
  approval_needed: 'approvals',
}

// ---------------------------------------------------------------------------
// Event → notification_type enum mapping
// Valid enum values: 'info' | 'success' | 'warning' | 'action_required'
//                  | 'mention' | 'approval' | 'reminder'
// ---------------------------------------------------------------------------

type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'action_required'
  | 'mention'
  | 'approval'
  | 'reminder'

const EVENT_TYPE_MAP: Record<NotificationEvent, NotificationType> = {
  payroll_approved: 'success',
  payroll_paid: 'success',
  expense_submitted: 'info',
  expense_approved: 'success',
  expense_rejected: 'warning',
  leave_requested: 'info',
  leave_approved: 'success',
  leave_rejected: 'warning',
  training_overdue: 'warning',
  training_completed: 'success',
  review_assigned: 'action_required',
  approval_needed: 'approval',
}

function mapEventToNotificationType(event: NotificationEvent): NotificationType {
  return EVENT_TYPE_MAP[event] ?? 'info'
}

// ---------------------------------------------------------------------------
// Event → email template mapping
// ---------------------------------------------------------------------------

function buildEmailForEvent(
  event: NotificationEvent,
  recipientName: string,
  payload: NotificationPayload
): { subject: string; html: string } | null {
  const meta = payload.metadata ?? {}

  switch (event) {
    case 'payroll_approved':
      return payrollApprovedEmail({
        employeeName: recipientName,
        period: (meta.period as string) ?? 'Current Period',
        approverName: (meta.approverName as string) ?? 'Management',
        approvedAt: (meta.approvedAt as string) ?? new Date().toLocaleDateString(),
        payDate: (meta.payDate as string) ?? 'TBD',
      })

    case 'payroll_paid':
      return payrollPaidEmail({
        employeeName: recipientName,
        period: (meta.period as string) ?? 'Current Period',
        netPay: (meta.netPay as number) ?? 0,
        grossPay: (meta.grossPay as number) ?? 0,
        deductions: (meta.deductions as number) ?? 0,
        currency: (meta.currency as string) ?? 'USD',
        payDate: (meta.payDate as string) ?? new Date().toLocaleDateString(),
        payStubId: meta.payStubId as string | undefined,
      })

    case 'expense_submitted':
      return expenseApprovalEmail({
        managerName: recipientName,
        employeeName: (meta.employeeName as string) ?? 'An employee',
        reportTitle: (meta.reportTitle as string) ?? 'Expense Report',
        amount: (meta.amount as number) ?? 0,
        currency: (meta.currency as string) ?? 'USD',
        itemCount: (meta.itemCount as number) ?? 1,
      })

    case 'expense_approved':
      // Re-use the payroll processed template structure for a simple success notification
      return payrollProcessedEmail({
        employeeName: recipientName,
        period: (meta.reportTitle as string) ?? 'Expense Report',
        netPay: (meta.amount as number) ?? 0,
        currency: (meta.currency as string) ?? 'USD',
        payDate: (meta.approvedAt as string) ?? new Date().toLocaleDateString(),
      })

    case 'expense_rejected':
      return expenseRejectedEmail({
        employeeName: recipientName,
        reportTitle: (meta.reportTitle as string) ?? 'Expense Report',
        amount: (meta.amount as number) ?? 0,
        currency: (meta.currency as string) ?? 'USD',
        rejectedBy: (meta.rejectedBy as string) ?? 'Management',
        reason: (meta.reason as string) ?? 'No reason provided',
        reportId: (meta.reportId as string) ?? payload.entityId ?? '',
      })

    case 'leave_requested':
      return leaveRequestApprovalEmail({
        managerName: recipientName,
        employeeName: (meta.employeeName as string) ?? 'An employee',
        leaveType: (meta.leaveType as string) ?? 'Time Off',
        startDate: (meta.startDate as string) ?? '',
        endDate: (meta.endDate as string) ?? '',
        days: (meta.days as number) ?? 1,
        reason: meta.reason as string | undefined,
      })

    case 'leave_approved':
      // Simple success notification using a generic structure
      return {
        subject: `Leave Request Approved`,
        html: buildGenericNotificationHtml(
          recipientName,
          'Leave Request Approved',
          payload.message,
          payload.link ?? '/time-attendance',
          'success'
        ),
      }

    case 'leave_rejected':
      return {
        subject: `Leave Request Declined`,
        html: buildGenericNotificationHtml(
          recipientName,
          'Leave Request Declined',
          payload.message,
          payload.link ?? '/time-attendance',
          'warning'
        ),
      }

    case 'training_overdue':
      return trainingOverdueEmail({
        employeeName: recipientName,
        courses: (meta.courses as Array<{ name: string; dueDate: string; module?: string }>) ?? [
          { name: (meta.courseName as string) ?? 'Training Course', dueDate: (meta.dueDate as string) ?? '' },
        ],
      })

    case 'training_completed':
      return trainingCompletedEmail({
        employeeName: recipientName,
        courseName: (meta.courseName as string) ?? 'Training Course',
        completedAt: (meta.completedAt as string) ?? new Date().toLocaleDateString(),
        score: meta.score as number | undefined,
        certificateUrl: meta.certificateUrl as string | undefined,
        duration: meta.duration as string | undefined,
      })

    case 'review_assigned':
      return reviewAssignedEmail({
        employeeName: recipientName,
        reviewerName: recipientName,
        cycleName: (meta.cycleName as string) ?? 'Performance Review',
        reviewType: (meta.reviewType as string) ?? 'Self Assessment',
        dueDate: (meta.dueDate as string) ?? '',
        revieweeNames: meta.revieweeNames as string[] | undefined,
      })

    case 'approval_needed':
      return approvalNeededEmail({
        approverName: recipientName,
        requesterName: (meta.requesterName as string) ?? 'A team member',
        entityType: (meta.entityType as string) ?? payload.entityType ?? 'Request',
        entityTitle: (meta.entityTitle as string) ?? payload.title,
        entityDetails: (meta.entityDetails as Array<{ label: string; value: string }>) ?? [],
        urgency: meta.urgency as 'normal' | 'high' | 'critical' | undefined,
        link: payload.link ?? '/',
      })

    default:
      return null
  }
}

// ---------------------------------------------------------------------------
// Generic notification HTML builder (for events without dedicated templates)
// ---------------------------------------------------------------------------

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

function buildGenericNotificationHtml(
  recipientName: string,
  title: string,
  message: string,
  link: string,
  variant: 'success' | 'warning' | 'info' = 'info'
): string {
  const variantConfig = {
    success: { bg: '#f0fdf4', text: '#16a34a', label: 'SUCCESS' },
    warning: { bg: '#fffbeb', text: '#d97706', label: 'NOTICE' },
    info: { bg: '#eff6ff', text: '#2563eb', label: 'NOTIFICATION' },
  }
  const v = variantConfig[variant]

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f5f5f7;margin:0;padding:40px 20px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1)">
    <div style="background:#0f1117;padding:24px 32px">
      <span style="color:#004D40;font-size:20px;font-weight:500;letter-spacing:-0.035em">tempo</span>
    </div>
    <div style="padding:32px">
      <div style="background:${v.bg};color:${v.text};display:inline-block;padding:4px 12px;border-radius:4px;font-size:11px;font-weight:700;letter-spacing:0.05em;margin-bottom:12px">${v.label}</div>
      <h2 style="margin:0 0 12px;font-size:20px;font-weight:600;color:#111">${title}</h2>
      <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#555">
        Hi ${recipientName}, ${message}
      </p>
      <a href="${APP_URL}${link}" style="display:inline-block;padding:12px 28px;background:#004D40;color:#fff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600">View Details</a>
    </div>
    <div style="padding:16px 32px;background:#f9fafb;border-top:1px solid #eee">
      <p style="margin:0;font-size:12px;color:#999">Tempo - Unified Workforce Platform</p>
      <p style="margin:4px 0 0;font-size:11px;color:#bbb">Manage notification preferences in Settings.</p>
    </div>
  </div>
</body>
</html>`
}

// ---------------------------------------------------------------------------
// Slack Block Kit message builder
// ---------------------------------------------------------------------------

function buildSlackBlocks(
  payload: NotificationPayload
): Array<Record<string, unknown>> {
  const blocks: Array<Record<string, unknown>> = [
    {
      type: 'header',
      text: { type: 'plain_text', text: payload.title, emoji: true },
    },
    {
      type: 'section',
      text: { type: 'mrkdwn', text: payload.message },
    },
  ]

  if (payload.link) {
    blocks.push({
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'View in Tempo' },
          url: payload.link,
          style: 'primary',
        },
      ],
    })
  }

  return blocks
}

// ---------------------------------------------------------------------------
// Core dispatcher
// ---------------------------------------------------------------------------

export async function dispatchNotification(
  payload: NotificationPayload
): Promise<DispatchResult> {
  const result: DispatchResult = { inApp: 0, email: 0, slack: 0, errors: [] }
  const category = EVENT_CATEGORY_MAP[payload.event] ?? 'general'

  // ------------------------------------------------------------------
  // 1. Per-recipient: create in-app notifications & send emails
  // ------------------------------------------------------------------
  for (const recipientId of payload.recipientIds) {
    try {
      // Fetch the recipient's preference for this category
      const [pref] = await db
        .select()
        .from(schema.notificationPreferences)
        .where(
          and(
            eq(schema.notificationPreferences.employeeId, recipientId),
            eq(schema.notificationPreferences.category, category)
          )
        )

      // Both channels default to enabled when no explicit preference exists
      const shouldInApp = !pref || pref.inApp !== false
      const shouldEmail = !pref || pref.email !== false

      if (shouldInApp) {
        await db.insert(schema.notifications).values({
          orgId: payload.orgId,
          recipientId,
          senderId: payload.senderId ?? null,
          type: mapEventToNotificationType(payload.event),
          channel: shouldEmail ? 'both' : 'in_app',
          title: payload.title,
          message: payload.message,
          link: payload.link ?? null,
          entityType: payload.entityType ?? null,
          entityId: payload.entityId ?? null,
        })
        result.inApp++
      }

      if (shouldEmail) {
        // Fetch recipient email and name for the email template
        const [recipient] = await db
          .select({
            email: schema.employees.email,
            fullName: schema.employees.fullName,
          })
          .from(schema.employees)
          .where(eq(schema.employees.id, recipientId))

        if (recipient?.email) {
          const emailContent = buildEmailForEvent(
            payload.event,
            recipient.fullName,
            payload
          )

          if (emailContent) {
            try {
              const sent = await sendEmail(
                recipient.email,
                emailContent.subject,
                emailContent.html
              )

              emailDeliveryLog.push({
                recipientId,
                recipientEmail: recipient.email,
                event: payload.event,
                status: sent ? 'sent' : 'failed',
                error: sent ? undefined : 'Email provider returned failure',
                timestamp: new Date(),
                orgId: payload.orgId,
              })

              if (sent) {
                result.email++
              } else {
                result.errors.push(
                  `Email send failed for ${recipient.email} (${payload.event})`
                )
              }
            } catch (emailErr) {
              const errorMsg = emailErr instanceof Error ? emailErr.message : String(emailErr)
              emailDeliveryLog.push({
                recipientId,
                recipientEmail: recipient.email,
                event: payload.event,
                status: 'failed',
                error: errorMsg,
                timestamp: new Date(),
                orgId: payload.orgId,
              })
              result.errors.push(
                `Email error for ${recipient.email}: ${errorMsg}`
              )
            }
          } else {
            // No template for this event, log as skipped
            emailDeliveryLog.push({
              recipientId,
              recipientEmail: recipient.email,
              event: payload.event,
              status: 'skipped',
              error: 'No email template for event',
              timestamp: new Date(),
              orgId: payload.orgId,
            })
          }
        } else {
          result.errors.push(
            `No email address found for recipient ${recipientId}`
          )
        }
      }
    } catch (err) {
      result.errors.push(
        `Failed for recipient ${recipientId}: ${err instanceof Error ? err.message : String(err)}`
      )
    }
  }

  // ------------------------------------------------------------------
  // 2. Org-level Slack notification (single message, not per-recipient)
  // ------------------------------------------------------------------
  try {
    const [slackIntegration] = await db
      .select()
      .from(schema.integrations)
      .where(
        and(
          eq(schema.integrations.orgId, payload.orgId),
          eq(schema.integrations.provider, 'slack'),
          eq(schema.integrations.status, 'connected')
        )
      )

    if (slackIntegration) {
      const credentials = slackIntegration.credentials as {
        bot_token?: string
      } | null
      const config = slackIntegration.config as {
        default_channel?: string
      } | null

      const botToken = credentials?.bot_token
      const channel = payload.slackChannel ?? config?.default_channel

      if (botToken && channel) {
        const blocks = buildSlackBlocks(payload)
        const slackResult = await sendSlackMessage(
          botToken,
          channel,
          payload.message,
          blocks
        )

        if (slackResult.ok) {
          result.slack++
        } else {
          result.errors.push(`Slack send failed: ${slackResult.error}`)
        }
      }
    }
  } catch (err) {
    result.errors.push(
      `Slack dispatch failed: ${err instanceof Error ? err.message : String(err)}`
    )
  }

  return result
}

// ---------------------------------------------------------------------------
// Email Delivery Stats
// ---------------------------------------------------------------------------

export interface EmailDeliveryStats {
  sent: number
  failed: number
  skipped: number
  bounceRate: number
  topEvents: Array<{ event: NotificationEvent; count: number }>
}

export function getEmailDeliveryStats(orgId: string): EmailDeliveryStats {
  const orgRecords = emailDeliveryLog.filter(r => r.orgId === orgId)

  const sent = orgRecords.filter(r => r.status === 'sent').length
  const failed = orgRecords.filter(r => r.status === 'failed').length
  const skipped = orgRecords.filter(r => r.status === 'skipped').length
  const total = sent + failed
  const bounceRate = total > 0 ? (failed / total) * 100 : 0

  // Count events for sent emails
  const eventCounts: Record<string, number> = {}
  for (const record of orgRecords.filter(r => r.status === 'sent')) {
    eventCounts[record.event] = (eventCounts[record.event] ?? 0) + 1
  }

  const topEvents = Object.entries(eventCounts)
    .map(([event, count]) => ({ event: event as NotificationEvent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    sent,
    failed,
    skipped,
    bounceRate: Math.round(bounceRate * 100) / 100,
    topEvents,
  }
}

// ---------------------------------------------------------------------------
// Domain-specific helpers
// ---------------------------------------------------------------------------

/**
 * Notify the finance team that a payroll run has been approved.
 */
export async function notifyPayrollApproved(
  orgId: string,
  payrollRunId: string,
  approverName: string,
  metadata?: { period?: string; payDate?: string }
): Promise<void> {
  const financeEmployees = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.orgId, orgId),
        eq(schema.employees.isActive, true)
      )
    )

  const recipientIds = financeEmployees.map((e) => e.id)

  if (recipientIds.length > 0) {
    await dispatchNotification({
      orgId,
      recipientIds,
      event: 'payroll_approved',
      title: '\u2705 Payroll Run Approved',
      message: `Payroll run has been approved by ${approverName}. Ready for processing.`,
      link: `/payroll?runId=${payrollRunId}`,
      entityType: 'payroll_run',
      entityId: payrollRunId,
      metadata: {
        approverName,
        approvedAt: new Date().toLocaleDateString(),
        period: metadata?.period ?? 'Current Period',
        payDate: metadata?.payDate ?? 'TBD',
      },
    })
  }
}

/**
 * Notify approvers that an expense report needs review.
 */
export async function notifyExpenseNeedsApproval(
  orgId: string,
  reportId: string,
  employeeName: string,
  amount: number,
  currency: string,
  metadata?: { reportTitle?: string; itemCount?: number }
): Promise<void> {
  const approvers = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(
      and(
        eq(schema.employees.orgId, orgId),
        eq(schema.employees.isActive, true)
      )
    )

  // Simplified: in production this would follow the org's approval chain
  const approverIds = approvers.map((e) => e.id).slice(0, 5)

  if (approverIds.length > 0) {
    await dispatchNotification({
      orgId,
      recipientIds: approverIds,
      event: 'approval_needed',
      title: '\ud83d\udccb Expense Report Pending Approval',
      message: `${employeeName} submitted an expense report for ${currency} ${amount.toLocaleString()}`,
      link: `/expenses?reportId=${reportId}`,
      entityType: 'expense_report',
      entityId: reportId,
      metadata: {
        requesterName: employeeName,
        entityType: 'Expense Report',
        entityTitle: metadata?.reportTitle ?? `Expense Report - ${currency} ${amount.toLocaleString()}`,
        entityDetails: [
          { label: 'Amount', value: `${currency} ${amount.toLocaleString()}` },
          { label: 'Items', value: `${metadata?.itemCount ?? 1} line item(s)` },
        ],
        amount,
        currency,
        reportTitle: metadata?.reportTitle ?? 'Expense Report',
        itemCount: metadata?.itemCount ?? 1,
      },
    })
  }
}

/**
 * Notify an employee that a compliance training is overdue.
 */
export async function notifyTrainingOverdue(
  orgId: string,
  employeeId: string,
  courseName: string,
  dueDate: string
): Promise<void> {
  await dispatchNotification({
    orgId,
    recipientIds: [employeeId],
    event: 'training_overdue',
    title: '\u26a0\ufe0f Training Overdue',
    message: `Your compliance training "${courseName}" was due on ${dueDate}. Please complete it as soon as possible.`,
    link: '/learning',
    entityType: 'course',
    metadata: {
      courses: [{ name: courseName, dueDate }],
      courseName,
      dueDate,
    },
  })
}

/**
 * Notify an employee that they completed a training course.
 */
export async function notifyTrainingCompleted(
  orgId: string,
  employeeId: string,
  courseName: string,
  metadata?: { score?: number; certificateUrl?: string; duration?: string }
): Promise<void> {
  await dispatchNotification({
    orgId,
    recipientIds: [employeeId],
    event: 'training_completed',
    title: '\ud83c\udf89 Training Completed',
    message: `Congratulations! You have completed "${courseName}".`,
    link: '/learning',
    entityType: 'course',
    metadata: {
      courseName,
      completedAt: new Date().toLocaleDateString(),
      ...metadata,
    },
  })
}

/**
 * Notify an employee that their expense report was rejected.
 */
export async function notifyExpenseRejected(
  orgId: string,
  employeeId: string,
  reportId: string,
  reportTitle: string,
  amount: number,
  currency: string,
  rejectedBy: string,
  reason: string
): Promise<void> {
  await dispatchNotification({
    orgId,
    recipientIds: [employeeId],
    event: 'expense_rejected',
    title: '\u274c Expense Report Rejected',
    message: `Your expense report "${reportTitle}" for ${currency} ${amount.toLocaleString()} has been rejected. Reason: ${reason}`,
    link: `/expense?reportId=${reportId}`,
    entityType: 'expense_report',
    entityId: reportId,
    metadata: {
      reportTitle,
      amount,
      currency,
      rejectedBy,
      reason,
      reportId,
    },
  })
}

/**
 * Notify an employee that they have been assigned a performance review.
 */
export async function notifyReviewAssigned(
  orgId: string,
  employeeId: string,
  cycleName: string,
  reviewType: string,
  dueDate: string,
  metadata?: { revieweeNames?: string[] }
): Promise<void> {
  await dispatchNotification({
    orgId,
    recipientIds: [employeeId],
    event: 'review_assigned',
    title: '\ud83d\udcdd Performance Review Assigned',
    message: `You have been assigned a ${reviewType} review for the "${cycleName}" cycle. Due by ${dueDate}.`,
    link: '/performance',
    entityType: 'review_cycle',
    metadata: {
      cycleName,
      reviewType,
      dueDate,
      ...metadata,
    },
  })
}

/**
 * Notify employees that a payroll payment has been processed.
 */
export async function notifyPayrollPaid(
  orgId: string,
  recipientIds: string[],
  metadata: {
    period: string
    payDate: string
    currency: string
    // Per-recipient overrides can be handled by calling dispatchNotification per-employee
    // For bulk, these are org-level defaults
    netPay?: number
    grossPay?: number
    deductions?: number
  }
): Promise<void> {
  if (recipientIds.length > 0) {
    await dispatchNotification({
      orgId,
      recipientIds,
      event: 'payroll_paid',
      title: '\ud83d\udcb0 Payment Processed',
      message: `Your payment for ${metadata.period} has been processed.`,
      link: '/payroll',
      entityType: 'payroll_run',
      metadata: {
        period: metadata.period,
        payDate: metadata.payDate,
        currency: metadata.currency,
        netPay: metadata.netPay ?? 0,
        grossPay: metadata.grossPay ?? 0,
        deductions: metadata.deductions ?? 0,
      },
    })
  }
}
