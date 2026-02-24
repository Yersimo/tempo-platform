'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AIEnhancingIndicatorProps {
  isLoading: boolean
  className?: string
}

export function AIEnhancingIndicator({ isLoading, className }: AIEnhancingIndicatorProps) {
  // Render a subtle, absolutely-positioned indicator that does NOT cause
  // layout shift or blinking.  The parent must have `position: relative`.
  return (
    <span
      className={cn(
        'absolute top-2 right-10 z-10 inline-flex items-center gap-1 text-tempo-400/70 text-[0.65rem] transition-opacity duration-500',
        isLoading ? 'opacity-100' : 'opacity-0 pointer-events-none',
        className,
      )}
    >
      <Sparkles size={10} className="animate-spin" style={{ animationDuration: '3s' }} />
    </span>
  )
}
