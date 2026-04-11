'use client'

interface TempoMarkProps {
  variant?: 'color' | 'white' | 'mono'
  size?: number
  className?: string
  showCrossbar?: boolean
}

export function TempoMark({ variant = 'color', size = 40, className = '' }: TempoMarkProps) {
  const bgColor = variant === 'white' ? '#ffffff' : '#1a1a1a'
  const textColor = variant === 'white' ? '#1a1a1a' : '#ffffff'
  const dotColor = variant === 'mono' ? '#666666' : '#00897B'
  const rx = Math.round(size * 0.21)

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      className={className}
    >
      <rect width="512" height="512" rx={rx * (512 / size)} fill={bgColor} />
      <text
        x="100"
        y="380"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="800"
        fontSize="400"
        fill={textColor}
        letterSpacing="-15"
      >
        t
      </text>
      <circle cx="395" cy="370" r="40" fill={dotColor} />
    </svg>
  )
}
