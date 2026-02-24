'use client'

import { useEffect, useState } from 'react'
import { Shield, X } from 'lucide-react'

interface ImpersonationInfo {
  adminId: string
  employeeId: string
  orgId: string
  name: string
}

export function ImpersonationBanner() {
  const [info, setInfo] = useState<ImpersonationInfo | null>(null)
  const [ending, setEnding] = useState(false)

  useEffect(() => {
    // Read the non-httpOnly impersonation cookie
    try {
      const cookies = document.cookie.split(';').map(c => c.trim())
      const impCookie = cookies.find(c => c.startsWith('tempo_impersonating='))
      if (impCookie) {
        const value = decodeURIComponent(impCookie.split('=').slice(1).join('='))
        const parsed = JSON.parse(value)
        setInfo(parsed)
      }
    } catch {
      // No impersonation cookie or invalid — that's fine
    }
  }, [])

  if (!info) return null

  const handleEndSession = async () => {
    setEnding(true)
    try {
      await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'stop' }),
      })
    } catch { /* ignore */ }
    // Clear client-side cookie as well
    document.cookie = 'tempo_impersonating=;path=/;max-age=0'
    document.cookie = 'tempo_session=;path=/;max-age=0'
    // Redirect back to admin console
    window.location.href = '/admin/organizations'
  }

  return (
    <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-center gap-3 text-sm relative z-50">
      <Shield size={16} className="flex-shrink-0" />
      <span className="font-medium">
        Impersonating <strong>{info.name}</strong>
      </span>
      <span className="text-white/70">|</span>
      <button
        onClick={handleEndSession}
        disabled={ending}
        className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 disabled:bg-white/10 font-medium text-xs transition-colors"
      >
        <X size={12} />
        {ending ? 'Ending...' : 'End Session'}
      </button>
    </div>
  )
}
