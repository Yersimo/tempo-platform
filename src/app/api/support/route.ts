import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Support Ticket API — Tenant-facing ticket management
// Uses standard x-org-id / x-employee-id headers for auth
// ---------------------------------------------------------------------------

function getHeaders(req: NextRequest) {
  return {
    orgId: req.headers.get('x-org-id') || '',
    employeeId: req.headers.get('x-employee-id') || '',
  }
}

// ---------------------------------------------------------------------------
// GET — List my org's tickets
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest) {
  const { orgId } = getHeaders(req)
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const tickets = await db
      .select()
      .from(schema.supportTickets)
      .where(eq(schema.supportTickets.orgId, orgId))
      .orderBy(desc(schema.supportTickets.createdAt))
      .limit(50)

    return NextResponse.json({ tickets })
  } catch (error: any) {
    console.error('[support] GET error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST — Create ticket, reply, view messages
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const { orgId, employeeId } = getHeaders(req)
  if (!orgId || !employeeId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { subject, description, category, priority } = body
        if (!subject || !description) {
          return NextResponse.json({ error: 'subject and description required' }, { status: 400 })
        }

        const [ticket] = await db
          .insert(schema.supportTickets)
          .values({
            orgId,
            submittedBy: employeeId,
            subject,
            description,
            category: category || 'general',
            priority: priority || 'medium',
          })
          .returning()

        // Also add the description as the first message
        await db.insert(schema.supportTicketMessages).values({
          ticketId: ticket.id,
          senderType: 'customer',
          senderId: employeeId,
          message: description,
        })

        return NextResponse.json({ ticket })
      }

      case 'reply': {
        const { ticketId, message } = body
        if (!ticketId || !message) {
          return NextResponse.json({ error: 'ticketId and message required' }, { status: 400 })
        }

        // Verify ticket belongs to this org
        const [ticket] = await db
          .select()
          .from(schema.supportTickets)
          .where(and(eq(schema.supportTickets.id, ticketId), eq(schema.supportTickets.orgId, orgId)))

        if (!ticket) {
          return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        await db.insert(schema.supportTicketMessages).values({
          ticketId,
          senderType: 'customer',
          senderId: employeeId,
          message,
        })

        await db
          .update(schema.supportTickets)
          .set({ updatedAt: new Date() })
          .where(eq(schema.supportTickets.id, ticketId))

        return NextResponse.json({ ok: true })
      }

      case 'messages': {
        const { ticketId } = body
        if (!ticketId) {
          return NextResponse.json({ error: 'ticketId required' }, { status: 400 })
        }

        // Verify ticket belongs to this org
        const [ticket] = await db
          .select()
          .from(schema.supportTickets)
          .where(and(eq(schema.supportTickets.id, ticketId), eq(schema.supportTickets.orgId, orgId)))

        if (!ticket) {
          return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
        }

        const messages = await db
          .select()
          .from(schema.supportTicketMessages)
          .where(eq(schema.supportTicketMessages.ticketId, ticketId))
          .orderBy(schema.supportTicketMessages.createdAt)

        return NextResponse.json({ ticket, messages })
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[support] POST error:', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
