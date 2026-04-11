'use client'

/**
 * SVG Chart Components for Predictive Analytics
 * Pure React + SVG, no external chart libraries required.
 */

import { cn } from '@/lib/utils/cn'
import { useMemo } from 'react'
import { linearRegression as lr } from '@/lib/ml/statistics'

// ────────────────────────────────────────────────────────────
//  Shared constants
// ────────────────────────────────────────────────────────────

const COLORS = {
  primary: '#004D40',
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  rose: '#ef4444',
  cyan: '#06b6d4',
  slate: '#64748b',
}

const SERIES_COLORS = [COLORS.primary, COLORS.blue, COLORS.emerald, COLORS.violet, COLORS.amber, COLORS.rose, COLORS.cyan, COLORS.slate]

// ────────────────────────────────────────────────────────────
//  LineChart
// ────────────────────────────────────────────────────────────

export interface LineChartSeries {
  label: string
  data: number[]
  color?: string
  dashed?: boolean
}

export interface ConfidenceBand {
  upper: number[]
  lower: number[]
  color?: string
}

interface LineChartProps {
  labels: string[]
  series: LineChartSeries[]
  confidence?: ConfidenceBand
  height?: number
  className?: string
  yLabel?: string
  formatY?: (v: number) => string
  /** Index where forecast starts (vertical divider line) */
  forecastStartIndex?: number
}

export function LineChart({
  labels, series, confidence, height = 280, className, yLabel, formatY, forecastStartIndex,
}: LineChartProps) {
  const padding = { top: 20, right: 20, bottom: 40, left: yLabel ? 70 : 60 }
  const chartW = 600
  const chartH = height
  const innerW = chartW - padding.left - padding.right
  const innerH = chartH - padding.top - padding.bottom

  const { minY, maxY, yTicks, points, bandPoints } = useMemo(() => {
    // Collect all values
    const allVals: number[] = []
    for (const s of series) allVals.push(...s.data)
    if (confidence) { allVals.push(...confidence.upper, ...confidence.lower) }

    let minY = Math.min(...allVals)
    let maxY = Math.max(...allVals)
    const range = maxY - minY || 1
    minY = minY - range * 0.05
    maxY = maxY + range * 0.05

    // Y-axis ticks (5 steps)
    const yStep = (maxY - minY) / 5
    const yTicks = Array.from({ length: 6 }, (_, i) => minY + yStep * i)

    // Map data to SVG coordinates
    const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW / 2
    const mapX = (i: number) => padding.left + i * xStep
    const mapY = (v: number) => padding.top + innerH - ((v - minY) / (maxY - minY)) * innerH

    const points = series.map(s => s.data.map((v, i) => ({ x: mapX(i), y: mapY(v) })))

    // Confidence band polygon
    let bandPoints = ''
    if (confidence) {
      const upperPts = confidence.upper.map((v, i) => `${mapX(i + (series[0]?.data.length || 0) - confidence.upper.length)},${mapY(v)}`)
      const lowerPts = confidence.lower.map((v, i) => `${mapX(i + (series[0]?.data.length || 0) - confidence.lower.length)},${mapY(v)}`).reverse()
      bandPoints = [...upperPts, ...lowerPts].join(' ')
    }

    return { minY, maxY, yTicks, points, bandPoints }
  }, [labels, series, confidence, innerW, innerH, padding.left, padding.top])

  const xStep = labels.length > 1 ? innerW / (labels.length - 1) : innerW / 2
  const fmtY = formatY || ((v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0))

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = padding.top + innerH - ((tick - minY) / (maxY - minY)) * innerH
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" strokeOpacity={0.5} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize={10}>{fmtY(tick)}</text>
            </g>
          )
        })}

        {/* Y-axis label */}
        {yLabel && (
          <text x={14} y={chartH / 2} textAnchor="middle" transform={`rotate(-90, 14, ${chartH / 2})`} className="fill-slate-400" fontSize={10}>{yLabel}</text>
        )}

        {/* X-axis labels */}
        {labels.map((label, i) => {
          const showLabel = labels.length <= 12 || i % Math.ceil(labels.length / 12) === 0
          if (!showLabel) return null
          return (
            <text key={i} x={padding.left + i * xStep} y={chartH - 8} textAnchor="middle" className="fill-slate-400" fontSize={9}>{label}</text>
          )
        })}

        {/* Forecast divider */}
        {forecastStartIndex !== undefined && forecastStartIndex > 0 && (
          <>
            <line
              x1={padding.left + forecastStartIndex * xStep}
              y1={padding.top}
              x2={padding.left + forecastStartIndex * xStep}
              y2={padding.top + innerH}
              stroke="#94a3b8"
              strokeDasharray="6,4"
              strokeWidth={1.5}
            />
            <text x={padding.left + forecastStartIndex * xStep + 6} y={padding.top + 12} className="fill-slate-400" fontSize={9} fontStyle="italic">Forecast</text>
          </>
        )}

        {/* Confidence band */}
        {bandPoints && (
          <polygon points={bandPoints} fill={confidence?.color || COLORS.primary} fillOpacity={0.1} />
        )}

        {/* Series lines */}
        {series.map((s, si) => {
          const pts = points[si]
          if (pts.length === 0) return null
          const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
          return (
            <g key={si}>
              <path
                d={pathD}
                fill="none"
                stroke={s.color || SERIES_COLORS[si % SERIES_COLORS.length]}
                strokeWidth={2}
                strokeDasharray={s.dashed ? '6,4' : undefined}
              />
              {/* Data points */}
              {pts.map((p, i) => (
                <circle key={i} cx={p.x} cy={p.y} r={3} fill={s.color || SERIES_COLORS[si % SERIES_COLORS.length]} />
              ))}
            </g>
          )
        })}
      </svg>

      {/* Legend */}
      {series.length > 1 && (
        <div className="flex items-center gap-4 justify-center mt-2">
          {series.map((s, i) => (
            <div key={i} className="flex items-center gap-1.5 text-xs text-t2">
              <div className="w-3 h-0.5" style={{ backgroundColor: s.color || SERIES_COLORS[i % SERIES_COLORS.length], borderTop: s.dashed ? '2px dashed' : undefined }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  BarChart
// ────────────────────────────────────────────────────────────

interface BarChartProps {
  labels: string[]
  values: number[]
  colors?: string[]
  height?: number
  className?: string
  horizontal?: boolean
  formatValue?: (v: number) => string
  /** Optional secondary values (for grouped bars) */
  secondaryValues?: number[]
  secondaryLabel?: string
  barLabel?: string
}

export function BarChart({
  labels, values, colors, height = 240, className, horizontal = false, formatValue, secondaryValues, secondaryLabel, barLabel,
}: BarChartProps) {
  const fmtV = formatValue || ((v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(v))

  if (horizontal) {
    const maxVal = Math.max(...values, ...(secondaryValues || []), 1)
    const barH = Math.min(28, (height - 20) / labels.length)
    const svgH = labels.length * (barH + 12) + 20

    return (
      <div className={cn('w-full overflow-x-auto', className)}>
        <svg viewBox={`0 0 500 ${svgH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
          {labels.map((label, i) => {
            const barW = (values[i] / maxVal) * 320
            const y = i * (barH + 12) + 10
            const color = colors?.[i] || SERIES_COLORS[i % SERIES_COLORS.length]
            return (
              <g key={i}>
                <text x={120} y={y + barH / 2 + 4} textAnchor="end" className="fill-slate-500" fontSize={10}>{label}</text>
                <rect x={130} y={y} width={Math.max(2, barW)} height={barH * 0.6} rx={3} fill={color} opacity={0.85} />
                {secondaryValues && (
                  <rect x={130} y={y + barH * 0.6 + 2} width={Math.max(2, (secondaryValues[i] / maxVal) * 320)} height={barH * 0.35} rx={2} fill={COLORS.slate} opacity={0.5} />
                )}
                <text x={135 + Math.max(2, barW)} y={y + barH / 2 + 4} className="fill-slate-500" fontSize={9}>{fmtV(values[i])}</text>
              </g>
            )
          })}
        </svg>
      </div>
    )
  }

  // Vertical bars
  const padding = { top: 15, right: 10, bottom: 40, left: 50 }
  const chartW = 600
  const innerW = chartW - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const maxVal = Math.max(...values, ...(secondaryValues || []), 1)
  const barW = Math.min(40, innerW / labels.length * 0.6)
  const gap = innerW / labels.length

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${chartW} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Y grid */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
          const y = padding.top + innerH * (1 - pct)
          return (
            <g key={i}>
              <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" strokeOpacity={0.5} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize={10}>{fmtV(maxVal * pct)}</text>
            </g>
          )
        })}

        {labels.map((label, i) => {
          const x = padding.left + i * gap + gap / 2
          const barH = (values[i] / maxVal) * innerH
          const color = colors?.[i] || COLORS.primary
          return (
            <g key={i}>
              <rect x={x - barW / 2} y={padding.top + innerH - barH} width={secondaryValues ? barW * 0.55 : barW} height={Math.max(1, barH)} rx={3} fill={color} opacity={0.85} />
              {secondaryValues && (
                <rect x={x + barW * 0.1} y={padding.top + innerH - (secondaryValues[i] / maxVal) * innerH} width={barW * 0.45} height={Math.max(1, (secondaryValues[i] / maxVal) * innerH)} rx={3} fill={COLORS.slate} opacity={0.5} />
              )}
              <text x={x} y={height - 8} textAnchor="middle" className="fill-slate-400" fontSize={9}>{label}</text>
            </g>
          )
        })}
      </svg>

      {secondaryValues && (
        <div className="flex items-center gap-4 justify-center mt-1">
          <div className="flex items-center gap-1.5 text-xs text-t2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS.primary, opacity: 0.85 }} />
            {barLabel || 'Primary'}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-t2">
            <div className="w-3 h-3 rounded-sm bg-slate-400 opacity-50" />
            {secondaryLabel || 'Secondary'}
          </div>
        </div>
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  ScatterPlot
// ────────────────────────────────────────────────────────────

interface ScatterPoint {
  x: number
  y: number
  label?: string
  color?: string
}

interface ScatterPlotProps {
  points: ScatterPoint[]
  height?: number
  className?: string
  xLabel?: string
  yLabel?: string
  showTrendLine?: boolean
  formatX?: (v: number) => string
  formatY?: (v: number) => string
}

export function ScatterPlot({
  points, height = 280, className, xLabel, yLabel, showTrendLine = false, formatX, formatY,
}: ScatterPlotProps) {
  const padding = { top: 20, right: 20, bottom: 45, left: 65 }
  const chartW = 600
  const innerW = chartW - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const fmtX = formatX || ((v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v)))
  const fmtY = formatY || ((v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : String(Math.round(v)))

  const { mapped, trendLine, xTicks, yTicks } = useMemo(() => {
    if (points.length === 0) return { mapped: [], trendLine: null, xTicks: [] as number[], yTicks: [] as number[] }

    const xs = points.map(p => p.x)
    const ys = points.map(p => p.y)
    let minX = Math.min(...xs), maxX = Math.max(...xs)
    let minY = Math.min(...ys), maxY = Math.max(...ys)
    const rx = maxX - minX || 1
    const ry = maxY - minY || 1
    minX -= rx * 0.05; maxX += rx * 0.05
    minY -= ry * 0.05; maxY += ry * 0.05

    const mapX = (v: number) => padding.left + ((v - minX) / (maxX - minX)) * innerW
    const mapY = (v: number) => padding.top + innerH - ((v - minY) / (maxY - minY)) * innerH

    const mapped = points.map(p => ({ ...p, cx: mapX(p.x), cy: mapY(p.y) }))

    let trendLine: { x1: number; y1: number; x2: number; y2: number } | null = null
    if (showTrendLine && points.length >= 2) {
      const regData = points.map(p => ({ x: p.x, y: p.y }))
      const reg = lr(regData)
      trendLine = {
        x1: mapX(minX), y1: mapY(reg.predict(minX)),
        x2: mapX(maxX), y2: mapY(reg.predict(maxX)),
      }
    }

    const xStep = (maxX - minX) / 5
    const xTicks = Array.from({ length: 6 }, (_, i) => minX + xStep * i)
    const yStep = (maxY - minY) / 5
    const yTicks = Array.from({ length: 6 }, (_, i) => minY + yStep * i)

    return { mapped, trendLine, xTicks, yTicks }
  }, [points, showTrendLine, innerW, innerH, padding.left, padding.top])

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${chartW} ${height}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Grid */}
        {yTicks.map((tick, i) => {
          const y = padding.top + innerH - ((tick - (yTicks[0] ?? 0)) / ((yTicks[yTicks.length - 1] ?? 1) - (yTicks[0] ?? 0) || 1)) * innerH
          return (
            <g key={`y${i}`}>
              <line x1={padding.left} y1={y} x2={chartW - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3,3" strokeOpacity={0.4} />
              <text x={padding.left - 8} y={y + 4} textAnchor="end" className="fill-slate-400" fontSize={9}>{fmtY(tick)}</text>
            </g>
          )
        })}
        {xTicks.map((tick, i) => {
          const x = padding.left + ((tick - (xTicks[0] ?? 0)) / ((xTicks[xTicks.length - 1] ?? 1) - (xTicks[0] ?? 0) || 1)) * innerW
          return <text key={`x${i}`} x={x} y={height - 8} textAnchor="middle" className="fill-slate-400" fontSize={9}>{fmtX(tick)}</text>
        })}

        {/* Axis labels */}
        {xLabel && <text x={chartW / 2} y={height - 0} textAnchor="middle" className="fill-slate-400" fontSize={10}>{xLabel}</text>}
        {yLabel && <text x={12} y={height / 2} textAnchor="middle" transform={`rotate(-90, 12, ${height / 2})`} className="fill-slate-400" fontSize={10}>{yLabel}</text>}

        {/* Trend line */}
        {trendLine && <line {...trendLine} stroke={COLORS.slate} strokeWidth={1.5} strokeDasharray="6,4" />}

        {/* Points */}
        {mapped.map((p, i) => (
          <circle key={i} cx={p.cx} cy={p.cy} r={5} fill={p.color || COLORS.primary} opacity={0.7} stroke="white" strokeWidth={1} />
        ))}
      </svg>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  HeatmapGrid
// ────────────────────────────────────────────────────────────

interface HeatmapGridProps {
  rows: string[]
  columns: string[]
  values: number[][]      // rows x columns
  className?: string
  colorScale?: 'risk' | 'positive' | 'neutral'
  formatValue?: (v: number) => string
}

function getHeatmapColor(value: number, min: number, max: number, scale: 'risk' | 'positive' | 'neutral'): string {
  const pct = max === min ? 0.5 : (value - min) / (max - min)
  if (scale === 'risk') {
    // Green (low) -> Yellow -> Red (high)
    if (pct < 0.33) return `rgba(16, 185, 129, ${0.2 + pct * 1.5})`
    if (pct < 0.66) return `rgba(245, 158, 11, ${0.3 + (pct - 0.33) * 1.5})`
    return `rgba(239, 68, 68, ${0.3 + (pct - 0.66) * 1.5})`
  }
  if (scale === 'positive') {
    // Low = light, High = deep green
    return `rgba(16, 185, 129, ${0.15 + pct * 0.7})`
  }
  // Neutral
  return `rgba(59, 130, 246, ${0.1 + pct * 0.6})`
}

export function HeatmapGrid({
  rows, columns, values, className, colorScale = 'neutral', formatValue,
}: HeatmapGridProps) {
  const fmtV = formatValue || ((v: number) => v.toFixed(0))
  const allVals = values.flat()
  const minVal = Math.min(...allVals)
  const maxVal = Math.max(...allVals)

  const cellW = 72
  const cellH = 36
  const labelW = 130
  const headerH = 36

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <svg viewBox={`0 0 ${labelW + columns.length * cellW} ${headerH + rows.length * cellH}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {/* Column headers */}
        {columns.map((col, j) => (
          <text key={j} x={labelW + j * cellW + cellW / 2} y={headerH - 8} textAnchor="middle" className="fill-slate-500" fontSize={9} fontWeight={500}>{col}</text>
        ))}

        {/* Rows */}
        {rows.map((row, i) => (
          <g key={i}>
            <text x={labelW - 8} y={headerH + i * cellH + cellH / 2 + 4} textAnchor="end" className="fill-slate-500" fontSize={10}>{row}</text>
            {columns.map((_, j) => {
              const val = values[i]?.[j] ?? 0
              const color = getHeatmapColor(val, minVal, maxVal, colorScale)
              return (
                <g key={j}>
                  <rect x={labelW + j * cellW + 1} y={headerH + i * cellH + 1} width={cellW - 2} height={cellH - 2} rx={4} fill={color} />
                  <text x={labelW + j * cellW + cellW / 2} y={headerH + i * cellH + cellH / 2 + 4} textAnchor="middle" className="fill-slate-700" fontSize={10} fontWeight={500}>{fmtV(val)}</text>
                </g>
              )
            })}
          </g>
        ))}
      </svg>
    </div>
  )
}

// ────────────────────────────────────────────────────────────
//  MiniGauge (for KPI cards)
// ────────────────────────────────────────────────────────────

interface MiniGaugeProps {
  value: number    // 0-100
  label: string
  color?: string
  size?: number
}

export function MiniGauge({ value, label, color = COLORS.primary, size = 80 }: MiniGaugeProps) {
  const r = (size - 10) / 2
  const circumference = Math.PI * r // half circle
  const offset = circumference * (1 - Math.min(100, Math.max(0, value)) / 100)

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size / 2 + 10} viewBox={`0 0 ${size} ${size / 2 + 10}`}>
        {/* Background arc */}
        <path
          d={`M 5 ${size / 2} A ${r} ${r} 0 0 1 ${size - 5} ${size / 2}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={6}
          strokeLinecap="round"
        />
        {/* Value arc */}
        <path
          d={`M 5 ${size / 2} A ${r} ${r} 0 0 1 ${size - 5} ${size / 2}`}
          fill="none"
          stroke={color}
          strokeWidth={6}
          strokeLinecap="round"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={offset}
        />
        <text x={size / 2} y={size / 2 - 2} textAnchor="middle" className="fill-slate-800" fontSize={16} fontWeight={700}>{Math.round(value)}</text>
      </svg>
      <span className="text-[10px] text-t2 -mt-1">{label}</span>
    </div>
  )
}
