/**
 * GET /api/admin/events
 *
 * Query the canonical event log. Filterable by event_type, entity_type,
 * entity_id, actor_id, correlation_id, and time range. Ordered desc by
 * occurred_at.
 *
 * Default: last 100 events for the requester's org.
 */

import { NextResponse, type NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { events } from '@/lib/db/schema'
import { desc, and, eq, gte, lte, type SQL } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({
      events: [],
      total: 0,
      degraded: true,
      reason: 'DATABASE_URL not configured',
    })
  }

  const { searchParams } = new URL(request.url)
  const orgId =
    searchParams.get('orgId') ??
    request.headers.get('x-org-id') ??
    'org-1' // demo fallback

  const limit = Math.min(parseInt(searchParams.get('limit') ?? '100', 10), 500)

  const conditions: SQL[] = [eq(events.orgId, orgId)]
  const eventType = searchParams.get('eventType')
  if (eventType) conditions.push(eq(events.eventType, eventType))
  const entityType = searchParams.get('entityType')
  if (entityType) conditions.push(eq(events.entityType, entityType))
  const entityId = searchParams.get('entityId')
  if (entityId) conditions.push(eq(events.entityId, entityId))
  const correlationId = searchParams.get('correlationId')
  if (correlationId) conditions.push(eq(events.correlationId, correlationId))
  const since = searchParams.get('since')
  if (since) conditions.push(gte(events.occurredAt, new Date(since)))
  const until = searchParams.get('until')
  if (until) conditions.push(lte(events.occurredAt, new Date(until)))

  try {
    const rows = await db
      .select()
      .from(events)
      .where(and(...conditions))
      .orderBy(desc(events.occurredAt))
      .limit(limit)

    return NextResponse.json({
      events: rows,
      total: rows.length,
      degraded: false,
    })
  } catch (err) {
    console.error('[/api/admin/events] query failed:', err)
    return NextResponse.json({
      events: [],
      total: 0,
      degraded: true,
      reason:
        err instanceof Error && err.message.includes('does not exist')
          ? 'events table not yet created — run drizzle migrations'
          : 'query failed',
      error: err instanceof Error ? err.message : String(err),
    })
  }
}
