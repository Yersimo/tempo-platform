'use client'

interface TempoMarkProps {
  variant?: 'color' | 'white' | 'mono'
  size?: number
  className?: string
  showCrossbar?: boolean
}

export function TempoMark({ variant = 'color', size = 40, className = '', showCrossbar = true }: TempoMarkProps) {
  const colors = {
    color: { crossbar: '#ea580c', trail: '#fb923c', lead: '#ea580c', crossbarOpacity: 0.6, trailOpacity: 0.5 },
    white: { crossbar: '#fb923c', trail: 'white', lead: 'white', crossbarOpacity: 0.85, trailOpacity: 0.4 },
    mono: { crossbar: '#111', trail: '#111', lead: '#111', crossbarOpacity: 0.35, trailOpacity: 0.2 },
  }

  const c = colors[variant]
  const strokeWidth = size < 20 ? 13 : 10

  return (
    <svg
      width={size * 0.8}
      height={size}
      viewBox="0 0 80 100"
      fill="none"
      className={className}
    >
      {showCrossbar && (
        <line
          x1="2" y1="3" x2="78" y2="3"
          stroke={c.crossbar}
          strokeWidth={size < 20 ? 6 : 5}
          strokeLinecap="round"
          opacity={c.crossbarOpacity}
        />
      )}
      <path
        d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6"
        stroke={c.trail}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        opacity={c.trailOpacity}
      />
      <path
        d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10"
        stroke={c.lead}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />
    </svg>
  )
}
