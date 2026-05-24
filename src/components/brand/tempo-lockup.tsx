'use client'

interface TempoLockupProps {
  variant?: 'color' | 'white' | 'mono'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

const sizes = {
  sm: 'text-[16px]',
  md: 'text-[20px]',
  lg: 'text-[26px]',
  xl: 'text-[36px]',
}

export function TempoLockup({ variant = 'color', size = 'md', className = '' }: TempoLockupProps) {
  const textColor = variant === 'white' ? 'text-white' : 'text-[#121A20]'
  const dotColor = variant === 'mono' ? 'text-[#121A20]/40' : 'text-tempo-600'

  return (
    <span className={`font-semibold tracking-[-0.01em] ${sizes[size]} ${textColor} ${className}`}>
      tempo<span className={dotColor}>.</span>
    </span>
  )
}
