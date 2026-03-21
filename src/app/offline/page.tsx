'use client'

import { useState, useEffect } from 'react'
import { WifiOff, RefreshCw, Home, Clock, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react'

interface PendingAction {
  id: number
  url: string
  method: string
  timestamp: number
}

function openPendingDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('tempo-pending-sync', 1)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('actions')) {
        db.createObjectStore('actions', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function parseActionType(url: string, method: string): string {
  if (url.includes('leaveRequests')) return 'Leave Request'
  if (url.includes('expenseReports')) return 'Expense Report'
  if (url.includes('timeEntries')) return 'Time Entry'
  if (url.includes('payroll')) return 'Payroll Action'
  return `${method} Request`
}

function formatTime(timestamp: number): string {
  const diff = Date.now() - timestamp
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      triggerSync()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    loadPendingActions()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  async function loadPendingActions() {
    try {
      const db = await openPendingDB()
      const tx = db.transaction('actions', 'readonly')
      const store = tx.objectStore('actions')
      const request = store.getAll()
      request.onsuccess = () => {
        setPendingActions(request.result || [])
      }
    } catch {
      // IndexedDB not available
    }
  }

  async function triggerSync() {
    if (!('serviceWorker' in navigator)) return
    setIsSyncing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      if ('sync' in registration) {
        await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-actions')
      }
    } catch {
      // Sync not supported
    }
    setTimeout(() => {
      setIsSyncing(false)
      loadPendingActions()
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6 text-center">
      {/* Brand mark */}
      <svg viewBox="0 0 80 100" fill="none" className="w-10 h-12 mb-8 opacity-40">
        <line x1="2" y1="3" x2="78" y2="3" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" opacity=".18"/>
        <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5"/>
        <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" opacity="1"/>
      </svg>

      {/* Status icon */}
      <div className={`w-20 h-20 rounded-full border flex items-center justify-center mb-6 ${
        isOnline
          ? 'bg-green-500/[0.04] border-green-500/20'
          : 'bg-white/[0.04] border-white/[0.06]'
      }`}>
        {isOnline ? (
          <CheckCircle size={36} className="text-green-400/60" />
        ) : (
          <WifiOff size={36} className="text-orange-400/60" />
        )}
      </div>

      {/* Message */}
      <h1 className="text-2xl font-light text-white/90 tracking-tight mb-2">
        {isOnline ? 'Back Online' : "You're offline"}
      </h1>
      <p className="text-sm text-white/30 max-w-sm leading-relaxed mb-8">
        {isOnline
          ? 'Your connection has been restored. Pending actions are being synced.'
          : "Check your network settings and try again. Any actions you've taken will be synced when you reconnect."}
      </p>

      {/* Actions */}
      <div className="flex gap-3 mb-8">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors min-h-[44px]"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/mobile'}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] text-white/50 text-sm rounded-lg border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-colors min-h-[44px]"
        >
          <Home size={15} />
          Manager Hub
        </button>
      </div>

      {/* Pending actions queue */}
      {pendingActions.length > 0 && (
        <div className="w-full max-w-sm text-left mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">
              Pending Actions ({pendingActions.length})
            </h2>
            {isOnline && (
              <button
                onClick={triggerSync}
                disabled={isSyncing}
                className="text-xs text-orange-400 flex items-center gap-1 min-h-[44px] disabled:opacity-50"
              >
                <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
                {isSyncing ? 'Syncing...' : 'Sync now'}
              </button>
            )}
          </div>
          <div className="space-y-2">
            {pendingActions.map((action) => (
              <div key={action.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Clock size={14} className="text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/60 truncate">
                    {parseActionType(action.url, action.method)}
                  </p>
                  <p className="text-[10px] text-white/25">{formatTime(action.timestamp)}</p>
                </div>
                <span className="text-[10px] text-amber-400/60 bg-amber-500/10 px-2 py-0.5 rounded-full shrink-0">
                  Queued
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Offline info */}
      <div className="w-full max-w-sm p-4 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-left">
        <div className="flex items-start gap-3">
          <AlertCircle size={16} className="text-white/20 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs font-medium text-white/40 mb-1">Offline Mode</p>
            <p className="text-[11px] text-white/20 leading-relaxed">
              Tempo saves your actions locally and syncs them when you reconnect.
              Approval decisions, time entries, and expense submissions are
              queued automatically.
            </p>
          </div>
        </div>
      </div>

      {/* Status indicator */}
      <div className="mt-8 flex items-center gap-2 text-xs text-white/15">
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500/60' : 'bg-red-500/60 animate-pulse'}`} />
        {isOnline ? 'Connected' : 'No network connection'}
      </div>
    </div>
  )
}
