/**
 * Subscriber registry.
 *
 * Handlers register at module load via subscribe(). When emitEvent()
 * is called, every matching subscriber is invoked in sequence.
 *
 * Today: in-process, synchronous. Same-request execution.
 * Tomorrow: swap to a queue (Redpanda/Kafka) without changing the
 * registry interface.
 */

import type { EventTypeName, EventPayloads, PersistedEvent } from './types'

export type EventHandler<T extends EventTypeName> = (
  event: PersistedEvent & { eventType: T; payload: EventPayloads[T] },
) => void | Promise<void>

interface SubscriptionEntry {
  eventType: EventTypeName | '*'
  handler: EventHandler<EventTypeName>
  /** Optional name for debugging / removal */
  name?: string
}

const subscribers: SubscriptionEntry[] = []

/**
 * Register a handler for one event type.
 * Returns an unsubscribe function for tests or hot-reload.
 */
export function subscribe<T extends EventTypeName>(
  eventType: T,
  handler: EventHandler<T>,
  name?: string,
): () => void {
  const entry: SubscriptionEntry = {
    eventType,
    handler: handler as EventHandler<EventTypeName>,
    name,
  }
  subscribers.push(entry)
  return () => {
    const i = subscribers.indexOf(entry)
    if (i >= 0) subscribers.splice(i, 1)
  }
}

/** Subscribe to every event — useful for audit log / analytics sink. */
export function subscribeAll(
  handler: EventHandler<EventTypeName>,
  name?: string,
): () => void {
  const entry: SubscriptionEntry = { eventType: '*', handler, name }
  subscribers.push(entry)
  return () => {
    const i = subscribers.indexOf(entry)
    if (i >= 0) subscribers.splice(i, 1)
  }
}

/**
 * Invoked by emitEvent() — runs all matching handlers.
 * Failures in one handler do not block others. They are logged and
 * surfaced through the ai.inference_run / system.error pipeline later.
 */
export async function dispatch(event: PersistedEvent): Promise<void> {
  const matching = subscribers.filter(
    (s) => s.eventType === '*' || s.eventType === event.eventType,
  )
  for (const sub of matching) {
    try {
      await sub.handler(event as never)
    } catch (err) {
      console.error(`[events] handler "${sub.name ?? 'anonymous'}" failed for ${event.eventType}:`, err)
    }
  }
}

/** Test helper — clears all subscribers. */
export function _resetSubscribers(): void {
  subscribers.length = 0
}
