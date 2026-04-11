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
  const textColor = variant === 'white' ? 'text-white' : 'text-[#1a1a1a]'
  const dotColor = variant === 'mono' ? 'text-[#1a1a1a]/40' : 'text-[#00897B]'

  return (
    <span className={`font-bold tracking-[-0.02em] ${sizes[size]} ${textColor} ${className}`}>
      tempo<span className={dotColor}>.</span>
    </span>
  )
}
