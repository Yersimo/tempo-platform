'use client'

import { createContext, useContext, useCallback, useState, useRef } from 'react'
import { PLATFORM_EVENTS, type PlatformEventKey, type CascadeAction } from './platform-events'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActionStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface CascadeActionState extends CascadeAction {
  status: ActionStatus
  startedAt?: number
  completedAt?: number
}

export interface CascadeInstance {
  id: string
  eventKey: PlatformEventKey
  label: string
  icon: string
  color: string
  context: Record<string, string>
  actions: CascadeActionState[]
  startedAt: number
  completedAt?: number
  dismissed: boolean
}

interface EventCascadeContextValue {
  cascades: CascadeInstance[]
  triggerCascade: (eventKey: PlatformEventKey, context?: Record<string, string>) => string
  dismissCascade: (id: string) => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const EventCascadeContext = createContext<EventCascadeContextValue | null>(null)

export function useEventCascade() {
  const ctx = useContext(EventCascadeContext)
  if (!ctx) throw new Error('useEventCascade must be used within EventCascadeProvider')
  return ctx
}

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

let _cascadeSeq = 0

export function EventCascadeProvider({ children }: { children: React.ReactNode }) {
  const [cascades, setCascades] = useState<CascadeInstance[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>[]>>(new Map())

  const dismissCascade = useCallback((id: string) => {
    // Clear any pending timers for this cascade
    const timers = timersRef.current.get(id)
    if (timers) {
      timers.forEach(clearTimeout)
      timersRef.current.delete(id)
    }
    setCascades(prev => prev.map(c => c.id === id ? { ...c, dismissed: true } : c))
    // Remove from state after exit animation
    setTimeout(() => {
      setCascades(prev => prev.filter(c => c.id !== id))
    }, 400)
  }, [])

  const triggerCascade = useCallback((eventKey: PlatformEventKey, context: Record<string, string> = {}) => {
    _cascadeSeq += 1
    const id = `cascade_${Date.now()}_${_cascadeSeq}`
    const eventDef = PLATFORM_EVENTS[eventKey]

    const instance: CascadeInstance = {
      id,
      eventKey,
      label: eventDef.label,
      icon: eventDef.icon,
      color: eventDef.color,
      context,
      actions: eventDef.actions.map(a => ({
        ...a,
        status: 'pending' as ActionStatus,
      })),
      startedAt: Date.now(),
      dismissed: false,
    }

    setCascades(prev => [instance, ...prev].slice(0, 5)) // Max 5 stacked

    // Schedule each action to transition: pending -> running -> completed
    const actionTimers: ReturnType<typeof setTimeout>[] = []

    eventDef.actions.forEach((action, idx) => {
      // Start running
      const runTimer = setTimeout(() => {
        setCascades(prev =>
          prev.map(c => {
            if (c.id !== id) return c
            const newActions = [...c.actions]
            newActions[idx] = { ...newActions[idx], status: 'running', startedAt: Date.now() }
            return { ...c, actions: newActions }
          })
        )
      }, action.delay)
      actionTimers.push(runTimer)

      // Complete after a short "processing" period
      const completeTimer = setTimeout(() => {
        setCascades(prev =>
          prev.map(c => {
            if (c.id !== id) return c
            const newActions = [...c.actions]
            newActions[idx] = { ...newActions[idx], status: 'completed', completedAt: Date.now() }
            // Check if all done
            const allDone = newActions.every(a => a.status === 'completed' || a.status === 'failed')
            return { ...c, actions: newActions, completedAt: allDone ? Date.now() : undefined }
          })
        )
      }, action.delay + 180) // 180ms "processing" time per action
      actionTimers.push(completeTimer)
    })

    timersRef.current.set(id, actionTimers)

    // Auto-dismiss after 8 seconds from the last action completing
    const lastDelay = eventDef.actions[eventDef.actions.length - 1].delay + 180
    const autoDismiss = setTimeout(() => {
      dismissCascade(id)
    }, lastDelay + 8000)
    actionTimers.push(autoDismiss)

    return id
  }, [dismissCascade])

  return (
    <EventCascadeContext.Provider value={{ cascades, triggerCascade, dismissCascade }}>
      {children}
    </EventCascadeContext.Provider>
  )
}
