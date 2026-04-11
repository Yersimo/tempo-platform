'use client'

import { cn } from '@/lib/utils/cn'

interface MiniBarChartProps {
  data: { label: string; value: number; color?: string }[]
  maxValue?: number
  className?: string
  showLabels?: boolean
  height?: number
}

export function MiniBarChart({ data, maxValue, className, showLabels = true, height = 120 }: MiniBarChartProps) {
  const max = maxValue || Math.max(...data.map(d => d.value))
  const barWidth = Math.min(32, Math.floor((100 - data.length * 2) / data.length))

  return (
    <div className={cn('flex items-end justify-center gap-2', className)} style={{ height }}>
      {data.map((item, i) => {
        const barHeight = max > 0 ? Math.max(4, (item.value / max) * (height - (showLabels ? 24 : 0))) : 4
        return (
          <div key={i} className="flex flex-col items-center gap-1" style={{ width: `${barWidth}px` }}>
            <span className="text-[0.55rem] font-semibold text-t2">{item.value}</span>
            <div
              className={cn('w-full rounded-t-sm transition-all', item.color || 'bg-tempo-500')}
              style={{ height: barHeight }}
            />
            {showLabels && (
              <span className="text-[0.5rem] text-t3 truncate w-full text-center">{item.label}</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

interface MiniDonutChartProps {
  data: { label: string; value: number; color: string }[]
  size?: number
  className?: string
}

export function MiniDonutChart({ data, size = 100, className }: MiniDonutChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  if (total === 0) return null

  const strokeWidth = size * 0.15
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  let currentOffset = 0

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {data.map((item, i) => {
          const segmentLength = (item.value / total) * circumference
          const offset = currentOffset
          currentOffset += segmentLength
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
              strokeDashoffset={-offset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              className="transition-all duration-500"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="tempo-stat text-lg text-t1">{total}</span>
        <span className="text-[0.5rem] text-t3">Total</span>
      </div>
    </div>
  )
}

interface SparklineProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}

export function Sparkline({ data, color = '#004D40', width = 80, height = 24, className }: SparklineProps) {
  if (data.length < 2) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const padding = 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * (width - padding * 2)
    const y = height - padding - ((v - min) / range) * (height - padding * 2)
    return `${x},${y}`
  }).join(' ')

  return (
    <svg width={width} height={height} className={className}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
