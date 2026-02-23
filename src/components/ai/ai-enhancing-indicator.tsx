'use client'

import { Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AIEnhancingIndicatorProps {
  isLoading: boolean
  className?: string
}

export function AIEnhancingIndicator({ isLoading, className }: AIEnhancingIndicatorProps) {
  if (!isLoading) return null

  return (
    <span className={cn('inline-flex items-center gap-1 text-tempo-400 text-xs', className)}>
      <Sparkles size={12} className="animate-pulse" />
      <span className="animate-pulse">Enhancing with AI...</span>
    </span>
  )
}
