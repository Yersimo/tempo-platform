'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { HelpCircle, X, ExternalLink } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface HelpTooltipProps {
  content: string
  title?: string
  learnMoreLink?: string
  side?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export function HelpTooltip({ content, title, learnMoreLink, side = 'bottom', className }: HelpTooltipProps) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  const handleOpen = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    setOpen(true)
  }, [])

  const handleClose = useCallback(() => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150)
  }, [])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [open])

  const positionClasses: Record<string, string> = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  }

  return (
    <div ref={containerRef} className={cn('relative inline-flex', className)}>
      <button
        onClick={() => setOpen(!open)}
        onMouseEnter={handleOpen}
        onMouseLeave={handleClose}
        className="inline-flex items-center justify-center w-4 h-4 rounded-full text-t3 hover:text-tempo-600 hover:bg-tempo-50 transition-colors"
        aria-label={title ? `Help: ${title}` : 'Help'}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <HelpCircle size={13} />
      </button>

      {open && (
        <div
          role="tooltip"
          onMouseEnter={handleOpen}
          onMouseLeave={handleClose}
          className={cn(
            'absolute z-50 w-64 bg-card border border-border rounded-lg shadow-lg',
            'animate-in fade-in zoom-in-95 duration-150',
            positionClasses[side],
          )}
        >
          <div className="px-3 py-2">
            {title && (
              <div className="flex items-center justify-between mb-1">
                <h4 className="text-xs font-semibold text-t1">{title}</h4>
                <button
                  onClick={() => setOpen(false)}
                  className="p-0.5 rounded text-t3 hover:text-t1 transition-colors"
                  aria-label="Close tooltip"
                >
                  <X size={10} />
                </button>
              </div>
            )}
            <p className="text-[11px] text-t2 leading-relaxed">{content}</p>
            {learnMoreLink && (
              <button
                onClick={() => {
                  setOpen(false)
                  // Could open help panel to that topic
                }}
                className="mt-1.5 flex items-center gap-1 text-[10px] text-tempo-600 hover:text-tempo-700 font-medium"
              >
                Learn more <ExternalLink size={9} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
