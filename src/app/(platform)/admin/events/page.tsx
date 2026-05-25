'use client'

/**
 * /admin/events — Event log viewer.
 *
 * The canonical CDC log, browsable in the UI. Filter by event_type,
 * entity_type, entity_id, correlation_id, or time range. Each event
 * expands to show the full payload + before/after diff.
 *
 * This is the audit + debugging tool that proves the moat.
 */

import { useEffect, useMemo, useState } from 'react'
import './events.css'

interface PersistedEvent {
  id: string
  orgId: string
  eventType: string
  eventVersion: number
  entityType: string
  entityId: string
  actorId: string | null
  payload: Record<string, unknown>
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  correlationId: string | null
  causedByEventId: string | null
  occurredAt: string
  recordedAt: string
}

interface QueryResponse {
  events: PersistedEvent[]
  total: number
  degraded: boolean
  reason?: string
}

const EVENT_TYPE_COLORS: Record<string, string> = {
  expense: '#637D4B',
  employee: '#285B7A',
  approval: '#A77A32',
  onboarding: '#4FA5C5',
  auth: '#52616A',
  ai: '#3F789A',
  policy: '#637D4B',
}

function categoryOf(eventType: string): string {
  return eventType.split('.')[0] ?? 'other'
}

function colorOf(eventType: string): string {
  return EVENT_TYPE_COLORS[categoryOf(eventType)] ?? '#52616A'
}

export default function EventsViewerPage() {
  const [data, setData] = useState<QueryResponse | null>(null)
  const [filter, setFilter] = useState({
    eventType: '',
    entityType: '',
    entityId: '',
    correlationId: '',
  })
  const [selected, setSelected] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    const params = new URLSearchParams()
    Object.entries(filter).forEach(([k, v]) => {
      if (v) params.set(k, v)
    })
    try {
      const r = await fetch(`/api/admin/events?${params.toString()}`)
      const d = (await r.json()) as QueryResponse
      setData(d)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selectedEvent = useMemo(
    () => (selected ? data?.events.find((e) => e.id === selected) ?? null : null),
    [selected, data],
  )

  // Tally by event type
  const tally = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const e of data?.events ?? []) {
      counts[e.eventType] = (counts[e.eventType] ?? 0) + 1
    }
    return Object.entries(counts).sort((a, b) => b[1] - a[1])
  }, [data])

  return (
    <main className="events-pg">
      <header className="events-pg-header">
        <div>
          <p className="events-pg-eyebrow">Admin · Event log</p>
          <h1 className="events-pg-title">Canonical change-data-capture</h1>
          <p className="events-pg-sub">
            Every meaningful state change in Tempo emits a typed event here. Foundation for
            time-travel queries, cross-module fan-out, and outbound webhooks.
          </p>
        </div>
        <button type="button" className="events-pg-refresh" onClick={load} disabled={loading}>
          {loading ? 'Loading…' : 'Refresh'}
        </button>
      </header>

      {data?.degraded && (
        <div className="events-pg-banner">
          <strong>Degraded:</strong> {data.reason}
        </div>
      )}

      <section className="events-pg-stats">
        <div className="events-pg-stat">
          <strong>{data?.total ?? 0}</strong>
          <span>events in window</span>
        </div>
        {tally.slice(0, 6).map(([type, count]) => (
          <div key={type} className="events-pg-stat events-pg-stat-type" style={{ '--c': colorOf(type) } as React.CSSProperties}>
            <strong>{count}</strong>
            <span>{type}</span>
          </div>
        ))}
      </section>

      <section className="events-pg-filters">
        <input
          placeholder="event type (e.g., expense.submitted)"
          value={filter.eventType}
          onChange={(e) => setFilter({ ...filter, eventType: e.target.value })}
          className="events-pg-input"
        />
        <input
          placeholder="entity type"
          value={filter.entityType}
          onChange={(e) => setFilter({ ...filter, entityType: e.target.value })}
          className="events-pg-input"
        />
        <input
          placeholder="entity id"
          value={filter.entityId}
          onChange={(e) => setFilter({ ...filter, entityId: e.target.value })}
          className="events-pg-input"
        />
        <input
          placeholder="correlation id"
          value={filter.correlationId}
          onChange={(e) => setFilter({ ...filter, correlationId: e.target.value })}
          className="events-pg-input"
        />
        <button type="button" className="events-pg-apply" onClick={load}>Apply</button>
      </section>

      <section className="events-pg-pane">
        <div className="events-pg-list">
          {(data?.events ?? []).map((e) => (
            <button
              key={e.id}
              type="button"
              className={`events-pg-row ${selected === e.id ? 'is-selected' : ''}`}
              onClick={() => setSelected(e.id)}
            >
              <span className="events-pg-row-dot" style={{ background: colorOf(e.eventType) }} />
              <span className="events-pg-row-type">{e.eventType}</span>
              <span className="events-pg-row-entity">{e.entityType} · {e.entityId.slice(0, 8)}</span>
              <span className="events-pg-row-time">{formatTime(e.occurredAt)}</span>
            </button>
          ))}
          {data && data.events.length === 0 && !data.degraded && (
            <p className="events-pg-empty">
              No events yet. Snap a receipt at <code>/expenses/snap</code> to generate the first events.
            </p>
          )}
        </div>

        <div className="events-pg-detail">
          {selectedEvent ? (
            <EventDetail event={selectedEvent} />
          ) : (
            <p className="events-pg-empty">Select an event to see its payload.</p>
          )}
        </div>
      </section>
    </main>
  )
}

function EventDetail({ event }: { event: PersistedEvent }) {
  return (
    <article className="events-pg-card">
      <header className="events-pg-card-head">
        <span
          className="events-pg-card-type"
          style={{ background: colorOf(event.eventType) }}
        >
          {event.eventType}
        </span>
        <span className="events-pg-card-id">{event.id}</span>
      </header>
      <dl className="events-pg-card-meta">
        <div><dt>Entity</dt><dd>{event.entityType} · <code>{event.entityId}</code></dd></div>
        <div><dt>Actor</dt><dd>{event.actorId ?? '(system)'}</dd></div>
        <div><dt>Occurred</dt><dd>{new Date(event.occurredAt).toLocaleString()}</dd></div>
        <div><dt>Recorded</dt><dd>{new Date(event.recordedAt).toLocaleString()}</dd></div>
        {event.correlationId && (
          <div><dt>Correlation</dt><dd><code>{event.correlationId}</code></dd></div>
        )}
        {event.causedByEventId && (
          <div><dt>Caused by</dt><dd><code>{event.causedByEventId}</code></dd></div>
        )}
        <div><dt>Version</dt><dd>{event.eventVersion}</dd></div>
      </dl>
      <section className="events-pg-card-section">
        <h3>Payload</h3>
        <pre>{JSON.stringify(event.payload, null, 2)}</pre>
      </section>
      {event.before && (
        <section className="events-pg-card-section">
          <h3>Before</h3>
          <pre>{JSON.stringify(event.before, null, 2)}</pre>
        </section>
      )}
      {event.after && (
        <section className="events-pg-card-section">
          <h3>After</h3>
          <pre>{JSON.stringify(event.after, null, 2)}</pre>
        </section>
      )}
    </article>
  )
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit', second: '2-digit',
    hour12: false,
  })
}
