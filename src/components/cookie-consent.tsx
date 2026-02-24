'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Cookie, X } from 'lucide-react'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // Check if user has already consented
    const consent = document.cookie.split(';').find(c => c.trim().startsWith('tempo_consent='))
    if (!consent) {
      // Small delay so it doesn't flash on load
      const timer = setTimeout(() => setVisible(true), 1000)
      return () => clearTimeout(timer)
    }
  }, [])

  const accept = (level: 'essential' | 'all') => {
    const value = level === 'all' ? 'all' : 'essential'
    document.cookie = `tempo_consent=${value}; path=/; max-age=${365 * 86400}; SameSite=Lax`
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 animate-in slide-in-from-bottom duration-300">
      <div className="max-w-2xl mx-auto bg-card rounded-[14px] border border-border shadow-lg p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 shrink-0 mt-0.5">
            <Cookie size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-t1 mb-1">Cookie Preferences</h3>
            <p className="text-xs text-t3 leading-relaxed mb-3">
              We use essential cookies for authentication and language preferences. No tracking cookies are used by default.
              Read our <Link href="/cookies" className="text-tempo-600 hover:underline">Cookie Policy</Link> for details.
            </p>
            <div className="flex items-center gap-2">
              <Button size="sm" onClick={() => accept('essential')}>
                Essential Only
              </Button>
              <Button size="sm" variant="outline" onClick={() => accept('all')}>
                Accept All
              </Button>
            </div>
          </div>
          <button
            onClick={() => accept('essential')}
            className="text-t3 hover:text-t1 transition-colors p-1"
            aria-label="Dismiss cookie banner"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
