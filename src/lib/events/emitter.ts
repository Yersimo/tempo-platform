/**
 * emitEvent() — the canonical write path for every meaningful state change.
 *
 * Usage:
 *   await emitEvent({
 *     orgId,
 *     actorId: employeeId,
 *     eventType: 'expense.submitted',
 *     entityType: 'expense_report',
 *     entityId: report.id,
 *     payload: { expenseReportId, amount, currency, ... },
 *     correlationId: requestId,
 *   })
 *
 * Two-phase:
 *   1. Persist to `events` table (durable, queryable, audit-grade)
 *   2. Dispatch to in-process subscribers
 *
 * If DB write fails, dispatch is skipped — events table is the source
 * of truth. If a subscriber fails, the event is still persisted.
 *
 * Graceful degradation: if DATABASE_URL is missing, returns null so
 * dev / test flows don't break.
 */

import { db, withRetry } from '@/lib/db'
import { events } from '@/lib/db/schema'
import type { EventTypeName, TempoEvent, PersistedEvent } from './types'
import { dispatch } from './registry'

export interface EmitOptions {
  orgId: string
  /** Skip dispatch — useful for backfill / replay. Default false. */
  skipDispatch?: boolean
}

export async function emitEvent<T extends EventTypeName>(
  event: TempoEvent<T> & { orgId: string },
  options: Omit<EmitOptions, 'orgId'> = {},
): Promise<PersistedEvent | null> {
  if (!process.env.DATABASE_URL) {
    // Dev fallback — log to console, skip persistence
    console.log('[events] (no DB) emit:', event.eventType, event.payload)
    return null
  }

  const occurredAt = event.occurredAt ?? new Date()

  try {
    const persisted = await withRetry(async () => {
      const [row] = await db
        .insert(events)
        .values({
          orgId: event.orgId,
          eventType: event.eventType,
          eventVersion: event.eventVersion ?? 1,
          entityType: event.entityType,
          entityId: event.entityId,
          actorId: event.actorId ?? null,
          payload: event.payload as unknown as object,
          before: (event.before ?? null) as unknown as object | null,
          after: (event.after ?? null) as unknown as object | null,
          correlationId: event.correlationId ?? null,
          causedByEventId: event.causedByEventId ?? null,
          occurredAt,
        })
        .returning()
      return row
    })

    if (!persisted) {
      console.error('[events] insert returned no row for', event.eventType)
      return null
    }

    const result: PersistedEvent = {
      id: persisted.id,
      orgId: persisted.orgId,
      eventType: persisted.eventType,
      eventVersion: persisted.eventVersion,
      entityType: persisted.entityType,
      entityId: persisted.entityId,
      actorId: persisted.actorId,
      payload: persisted.payload,
      before: persisted.before,
      after: persisted.after,
      correlationId: persisted.correlationId,
      causedByEventId: persisted.causedByEventId,
      occurredAt: persisted.occurredAt,
      recordedAt: persisted.recordedAt,
    }

    if (!options.skipDispatch) {
      // Fire-and-forget — dispatch runs sequentially through subscribers,
      // but emitEvent() resolves once persistence is durable.
      void dispatch(result)
    }

    return result
  } catch (err) {
    // Persistence failure is not silent — surface it.
    console.error('[events] emit failed for', event.eventType, err)
    return null
  }
}

/** Lightweight helper for the common case of generating a correlation ID. */
export function newCorrelationId(prefix = 'corr'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}
