'use client'

import { useTempo } from '@/lib/store'
import { useEffect, useState } from 'react'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-error" />,
  info: <Info size={16} className="text-info" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useTempo()
  const [exiting, setExiting] = useState<Set<string>>(new Set())

  // Only show the latest toast (prevent stacking)
  const latest = toasts[toasts.length - 1]

  // Auto-dismiss older toasts immediately when a new one arrives
  useEffect(() => {
    if (toasts.length > 1) {
      toasts.slice(0, -1).forEach(t => removeToast(t.id))
    }
  }, [toasts, removeToast])

  // Animate out before removing
  const dismiss = (id: string) => {
    setExiting(prev => new Set(prev).add(id))
    setTimeout(() => {
      removeToast(id)
      setExiting(prev => { const next = new Set(prev); next.delete(id); return next })
    }, 200)
  }

  // Auto-dismiss after 2.5s
  useEffect(() => {
    if (!latest) return
    const timer = setTimeout(() => dismiss(latest.id), 2500)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latest?.id])

  if (!latest) return null

  const isExiting = exiting.has(latest.id)

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-6 z-[100]">
      <div
        key={latest.id}
        className={`flex items-center gap-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 shadow-lg shadow-gray-200/40 dark:shadow-gray-900/40 transition-all duration-200 ${
          isExiting ? 'opacity-0 translate-y-2 scale-95' : 'opacity-100 translate-y-0 scale-100 animate-in slide-in-from-bottom-4'
        }`}
      >
        {icons[latest.type]}
        <span className="text-sm font-medium text-t1">{latest.message}</span>
        <button
          onClick={() => dismiss(latest.id)}
          className="ml-1 text-t3 hover:text-t1 transition-colors p-0.5 rounded-md hover:bg-gray-100"
        >
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
