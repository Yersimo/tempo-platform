'use client'

import { useTempo } from '@/lib/store'
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react'

const icons = {
  success: <CheckCircle2 size={16} className="text-success" />,
  error: <AlertCircle size={16} className="text-error" />,
  info: <Info size={16} className="text-info" />,
}

export function ToastContainer() {
  const { toasts, removeToast } = useTempo()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3 animate-in slide-in-from-right duration-200"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        >
          {icons[toast.type]}
          <span className="text-sm text-t1 flex-1">{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="text-t3 hover:text-t1 transition-colors">
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
