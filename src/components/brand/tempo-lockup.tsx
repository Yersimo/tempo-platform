'use client'

import { TempoMark } from './tempo-mark'

interface TempoLockupProps {
  variant?: 'color' | 'white' | 'mono'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: { mark: 16, text: 'text-sm', gap: 'gap-1' },
  md: { mark: 24, text: 'text-xl', gap: 'gap-1.5' },
  lg: { mark: 32, text: 'text-2xl', gap: 'gap-2' },
  xl: { mark: 48, text: 'text-4xl', gap: 'gap-3' },
}

export function TempoLockup({ variant = 'color', size = 'md', className = '' }: TempoLockupProps) {
  const s = sizes[size]
  const textColor = variant === 'white' ? 'text-white' : variant === 'mono' ? 'text-t1' : 'text-t1'
  const showCrossbar = size !== 'sm'

  return (
    <div className={`inline-flex items-end ${s.gap} ${className}`}>
      <TempoMark variant={variant} size={s.mark} showCrossbar={showCrossbar} />
      <span className={`tempo-wordmark ${s.text} ${textColor} leading-none`}>
        tempo
      </span>
    </div>
  )
}
