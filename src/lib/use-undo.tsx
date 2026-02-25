'use client'

import { useRef, useCallback, useState, useEffect } from 'react'

// ─── Types ──────────────────────────────────────────────────────────

interface PendingAction {
  id: string
  entity: string
  entityId: string
  displayName: string
  snapshot: Record<string, unknown>
  execute: () => void
  restore: (snapshot: Record<string, unknown>) => void
  timer: ReturnType<typeof setTimeout>
}

interface UseUndoOptions {
  delayMs?: number
  onUndo?: (entity: string, entityId: string) => void
  onExecute?: (entity: string, entityId: string) => void
}

// ─── Undo Toast State (module-level for cross-component reactivity) ─

interface UndoToastItem {
  id: string
  message: string
  onUndo: () => void
  duration: number
  createdAt: number
}

type UndoToastListener = (toasts: UndoToastItem[]) => void

let undoToasts: UndoToastItem[] = []
const listeners = new Set<UndoToastListener>()

function notifyListeners() {
  const snapshot = [...undoToasts]
  listeners.forEach(fn => fn(snapshot))
}

export function showUndoToast(
  message: string,
  onUndo: () => void,
  duration = 8000
): string {
  const id = crypto.randomUUID()
  const item: UndoToastItem = { id, message, onUndo, duration, createdAt: Date.now() }
  undoToasts = [...undoToasts, item]
  notifyListeners()

  // Auto-dismiss after duration
  setTimeout(() => {
    dismissUndoToast(id)
  }, duration)

  return id
}

export function dismissUndoToast(id: string): void {
  undoToasts = undoToasts.filter(t => t.id !== id)
  notifyListeners()
}

// ─── useUndo Hook ───────────────────────────────────────────────────

export function useUndo(options: UseUndoOptions = {}) {
  const { delayMs = 8000, onUndo, onExecute } = options
  const pendingRef = useRef<Map<string, PendingAction>>(new Map())

  const scheduleDelete = useCallback((params: {
    entity: string
    entityId: string
    snapshot: Record<string, unknown>
    displayName: string
    execute: () => void
    restore: (snapshot: Record<string, unknown>) => void
  }) => {
    const { entity, entityId, snapshot, displayName, execute, restore } = params
    const id = crypto.randomUUID()

    const timer = setTimeout(() => {
      execute()
      pendingRef.current.delete(id)
      onExecute?.(entity, entityId)
    }, delayMs)

    const action: PendingAction = {
      id, entity, entityId, displayName, snapshot, execute, restore, timer,
    }
    pendingRef.current.set(id, action)

    // Show undo toast
    showUndoToast(
      `${displayName} deleted`,
      () => cancelDelete(id),
      delayMs
    )

    return id
  }, [delayMs, onExecute])

  const cancelDelete = useCallback((actionId: string) => {
    const action = pendingRef.current.get(actionId)
    if (!action) return

    clearTimeout(action.timer)
    action.restore(action.snapshot)
    pendingRef.current.delete(actionId)
    onUndo?.(action.entity, action.entityId)

    // Dismiss the toast
    dismissUndoToast(actionId)
  }, [onUndo])

  // On unmount, execute all pending deletes immediately
  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps
      for (const action of pendingRef.current.values()) {
        clearTimeout(action.timer)
        action.execute()
      }
      pendingRef.current.clear()
    }
  }, [])

  return {
    scheduleDelete,
    cancelDelete,
    hasPending: pendingRef.current.size > 0,
    pendingCount: pendingRef.current.size,
  }
}

// ─── UndoToastContainer ─────────────────────────────────────────────

export function UndoToastContainer() {
  const [toasts, setToasts] = useState<UndoToastItem[]>([])

  useEffect(() => {
    const listener: UndoToastListener = (newToasts) => setToasts(newToasts)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[101] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <UndoToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}

function UndoToastItem({ toast }: { toast: UndoToastItem }) {
  const [progress, setProgress] = useState(100)

  useEffect(() => {
    const startTime = toast.createdAt
    const endTime = startTime + toast.duration

    const interval = setInterval(() => {
      const now = Date.now()
      const remaining = Math.max(0, endTime - now)
      const pct = (remaining / toast.duration) * 100
      setProgress(pct)
      if (pct <= 0) clearInterval(interval)
    }, 50)

    return () => clearInterval(interval)
  }, [toast.createdAt, toast.duration])

  const handleUndo = () => {
    toast.onUndo()
    dismissUndoToast(toast.id)
  }

  return (
    <div
      className="relative overflow-hidden bg-zinc-900 text-white rounded-xl px-4 py-3 animate-in slide-in-from-right duration-200"
      style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.25)' }}
    >
      <div className="flex items-center gap-3">
        <span className="text-sm flex-1">{toast.message}</span>
        <button
          onClick={handleUndo}
          className="text-tempo-400 hover:text-tempo-300 text-sm font-medium underline underline-offset-2 transition-colors whitespace-nowrap"
        >
          Undo
        </button>
        <button
          onClick={() => dismissUndoToast(toast.id)}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {/* Countdown progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-zinc-700">
        <div
          className="h-full bg-tempo-500 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
