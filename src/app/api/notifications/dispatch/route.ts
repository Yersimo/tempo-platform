import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import {
  dispatchNotification,
  type NotificationEvent,
} from '@/lib/services/notification-dispatcher'

// ---------------------------------------------------------------------------
// POST /api/notifications/dispatch
//
// Fire-and-forget notification dispatch endpoint.
// Called by the client store after state changes (leave approved, expense
// rejected, etc.). Looks up the entity in DB to find the recipient, then
// delegates to the notification dispatcher which handles in-app, email,
// and Slack delivery.
//
// Body: {
//   event: NotificationEvent,     // e.g. 'leave_approved'
//   entityId: string,             // ID of the entity (leave request, expense, etc.)
//   entityType: string,           // 'leave_request' | 'expense_report' | ...
//   metadata?: Record<string, unknown>  // extra context for email templates
// }
// ---------------------------------------------------------------------------

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-/i

// Map entity types to their DB table + how to find the recipient
type EntityLookup = {
  table: 'leaveRequests' | 'expenseReports' | 'payrollRuns' | 'reviews' | 'enrollments'
  recipientField: string // field on the entity that contains the employee_id
}

const ENTITY_LOOKUP: Record<string, EntityLookup> = {
  leave_request: { table: 'leaveRequests', recipientField: 'employeeId' },
  expense_report: { table: 'expenseReports', recipientField: 'employeeId' },
  payroll_run: { table: 'payrollRuns', recipientField: '' }, // broadcast to org
  review: { table: 'reviews', recipientField: 'employeeId' },
}

const EVENT_TITLES: Record<string, string> = {
  leave_approved: 'Leave Request Approved',
  leave_rejected: 'Leave Request Declined',
  expense_approved: 'Expense Report Approved',
  expense_rejected: 'Expense Report Rejected',
  payroll_approved: 'Payroll Run Approved',
  review_assigned: 'Performance Review Assigned',
  training_completed: 'Training Completed',
}

const EVENT_MESSAGES: Record<string, string> = {
  leave_approved: 'your leave request has been approved.',
  leave_rejected: 'your leave request has been declined. Please check the details.',
  expense_approved: 'your expense report has been approved for reimbursement.',
  expense_rejected: 'your expense report has been declined. Please review the feedback.',
  payroll_approved: 'the payroll run has been approved and is ready for processing.',
  review_assigned: 'you have been assigned a new performance review.',
  training_completed: 'congratulations on completing your training!',
}

const EVENT_LINKS: Record<string, string> = {
  leave_approved: '/time-attendance',
  leave_rejected: '/time-attendance',
  expense_approved: '/expenses',
  expense_rejected: '/expenses',
  payroll_approved: '/payroll',
  review_assigned: '/performance',
  training_completed: '/learning',
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only dispatch for real users (UUID org IDs), not demo users
    if (!UUID_RE.test(orgId)) {
      return NextResponse.json({ success: true, demo: true })
    }

    const body = await request.json()
    const { event, entityId, entityType, metadata } = body as {
      event: NotificationEvent
      entityId: string
      entityType: string
      metadata?: Record<string, unknown>
    }

    if (!event || !entityId || !entityType) {
      return NextResponse.json(
        { error: 'event, entityId, and entityType are required' },
        { status: 400 }
      )
    }

    const senderId = request.headers.get('x-employee-id') || undefined

    // -------------------------------------------------------------------
    // Look up the entity to find recipient(s)
    // -------------------------------------------------------------------
    let recipientIds: string[] = []

    const lookup = ENTITY_LOOKUP[entityType]

    if (entityType === 'payroll_run') {
      // Broadcast payroll notifications to all active employees in the org
      const employees = await db
        .select({ id: schema.employees.id })
        .from(schema.employees)
        .where(
          and(
            eq(schema.employees.orgId, orgId),
            eq(schema.employees.isActive, true)
          )
        )
      recipientIds = employees.map(e => e.id)
    } else if (lookup) {
      // Look up the entity to find the specific recipient
      try {
        const tableKey = lookup.table as keyof typeof schema
        const table = schema[tableKey] as any
        if (table) {
          const [entity] = await db
            .select()
            .from(table)
            .where(
              and(
                eq(table.id, entityId),
                ...(table.orgId ? [eq(table.orgId, orgId)] : [])
              )
            )
          if (entity) {
            const recipientId = (entity as any)[lookup.recipientField]
              || (entity as any).employee_id
              || (entity as any).employeeId
            if (recipientId) {
              recipientIds = [recipientId]
            }
          }
        }
      } catch {
        // If entity lookup fails, try to proceed with metadata
        if (metadata?.recipientId) {
          recipientIds = [metadata.recipientId as string]
        }
      }
    }

    // Fallback: use metadata.recipientId if no recipients found
    if (recipientIds.length === 0 && metadata?.recipientId) {
      recipientIds = [metadata.recipientId as string]
    }

    if (recipientIds.length === 0) {
      // No recipients found — not an error, just nothing to send
      return NextResponse.json({ success: true, dispatched: false, reason: 'no_recipients' })
    }

    // Filter out the sender from recipients (don't notify yourself)
    if (senderId) {
      recipientIds = recipientIds.filter(id => id !== senderId)
    }

    if (recipientIds.length === 0) {
      return NextResponse.json({ success: true, dispatched: false, reason: 'self_action' })
    }

    // -------------------------------------------------------------------
    // Dispatch the notification
    // -------------------------------------------------------------------
    const result = await dispatchNotification({
      orgId,
      recipientIds,
      senderId,
      event,
      title: EVENT_TITLES[event] || 'Notification',
      message: EVENT_MESSAGES[event] || 'You have a new notification.',
      link: EVENT_LINKS[event] || '/dashboard',
      entityType,
      entityId,
      metadata: metadata ?? {},
    })

    return NextResponse.json({
      success: true,
      dispatched: true,
      ...result,
    })
  } catch (error: any) {
    console.error('[POST /api/notifications/dispatch] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Failed to dispatch notification' },
      { status: 500 }
    )
  }
}
