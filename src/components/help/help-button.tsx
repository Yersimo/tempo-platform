'use client'

import { useState, useEffect } from 'react'
import { HelpCircle, X } from 'lucide-react'
import { useHelp } from '@/lib/help-context'
import { cn } from '@/lib/utils/cn'

const STORAGE_KEY = 'tempo_help_button_seen'

export function HelpButton() {
  const { isHelpOpen, toggleHelp } = useHelp()
  const [showPulse, setShowPulse] = useState(false)
  const [minimized, setMinimized] = useState(false)

  // Show pulse animation for first-time users
  useEffect(() => {
    try {
      const seen = localStorage.getItem(STORAGE_KEY)
      if (!seen) {
        setShowPulse(true)
        // Stop pulse after 10 seconds
        const timeout = setTimeout(() => {
          setShowPulse(false)
          localStorage.setItem(STORAGE_KEY, 'true')
        }, 10000)
        return () => clearTimeout(timeout)
      }
    } catch {
      // localStorage not available
    }
  }, [])

  // Mark as seen when clicked
  const handleClick = () => {
    setShowPulse(false)
    try { localStorage.setItem(STORAGE_KEY, 'true') } catch { /* ignore */ }
    toggleHelp()
  }

  const handleMinimize = (e: React.MouseEvent) => {
    e.stopPropagation()
    setMinimized(true)
  }

  if (minimized) {
    return (
      <button
        onClick={() => setMinimized(false)}
        className="fixed bottom-6 right-6 z-30 w-6 h-6 rounded-full bg-card border border-border shadow-sm text-t3 hover:text-tempo-600 flex items-center justify-center transition-all hover:scale-110"
        aria-label="Show help button"
      >
        <HelpCircle size={12} />
      </button>
    )
  }

  // Hide FAB when panel is open
  if (isHelpOpen) return null

  return (
    <div className="fixed bottom-6 right-6 z-30 flex items-center gap-2">
      {showPulse && (
        <div className="hidden sm:block bg-card border border-border rounded-lg shadow-lg px-3 py-2 animate-in fade-in slide-in-from-right duration-300">
          <div className="flex items-center gap-2">
            <p className="text-xs text-t2">
              Need help? Press <kbd className="px-1 py-0.5 bg-canvas border border-border rounded text-[10px] font-mono">?</kbd> anytime
            </p>
            <button
              onClick={handleMinimize}
              className="text-t3 hover:text-t1 p-0.5 rounded"
              aria-label="Dismiss help hint"
            >
              <X size={12} />
            </button>
          </div>
        </div>
      )}
      <div className="relative">
        {showPulse && (
          <span className="absolute inset-0 rounded-full bg-tempo-400 animate-ping opacity-30" />
        )}
        <button
          onClick={handleClick}
          className={cn(
            'relative w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all',
            'bg-tempo-600 text-white hover:bg-tempo-700 hover:shadow-xl hover:scale-105',
            'focus:outline-none focus:ring-2 focus:ring-tempo-500/30 focus:ring-offset-2',
          )}
          aria-label="Open help"
        >
          <HelpCircle size={20} />
        </button>
      </div>
    </div>
  )
}
