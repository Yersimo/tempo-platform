'use client'

import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, LineChart, Line,
  RadialBarChart, RadialBar,
} from 'recharts'
import { cn } from '@/lib/utils/cn'

// ═══════════════════════════════════════════════════════════
//  COLOR SYSTEM — Professional analytics palette
// ═══════════════════════════════════════════════════════════

export const CHART_COLORS = {
  primary: '#ea580c',
  blue: '#3b82f6',
  emerald: '#10b981',
  violet: '#8b5cf6',
  amber: '#f59e0b',
  slate: '#64748b',
  rose: '#ef4444',
  cyan: '#06b6d4',
  lime: '#84cc16',
  pink: '#ec4899',
} as const

export const CHART_SERIES = [
  '#ea580c', '#3b82f6', '#10b981', '#8b5cf6',
  '#f59e0b', '#64748b', '#ef4444', '#06b6d4',
  '#84cc16', '#ec4899', '#14b8a6', '#a855f7',
]

export const STATUS_COLORS = {
  success: '#10b981',
  warning: '#f59e0b',
  error: '#ef4444',
  info: '#3b82f6',
  neutral: '#94a3b8',
} as const

// ═══════════════════════════════════════════════════════════
//  SHARED CONSTANTS
// ═══════════════════════════════════════════════════════════

const AXIS_TICK = {
  fontSize: 11,
  fill: '#94a3b8',
  fontFamily: 'system-ui, -apple-system, sans-serif',
}

const GRID_PROPS = {
  strokeDasharray: '3 3',
  stroke: '#e2e8f0',
  strokeOpacity: 0.5,
}

// ═══════════════════════════════════════════════════════════
//  CUSTOM TOOLTIP
// ═══════════════════════════════════════════════════════════

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean
  payload?: any[]
  label?: string
  formatter?: (v: number) => string
}) {
  if (!active || !payload?.length) return null
  const fmt = formatter || ((v: number) => v.toLocaleString())

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2.5 shadow-lg min-w-[140px] backdrop-blur-sm">
      {label != null && (
        <p className="text-[11px] font-medium text-t3 mb-1.5 pb-1.5 border-b border-divider">
          {label}
        </p>
      )}
      <div className="space-y-1">
        {payload.map((entry: any, i: number) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ background: entry.color || entry.fill }}
              />
              <span className="text-[11px] text-t3">{entry.name}</span>
            </span>
            <span className="text-[11px] font-semibold text-t1 tabular-nums">
              {fmt(entry.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  BAR CHART
// ═══════════════════════════════════════════════════════════

interface BarDef {
  dataKey: string
  name: string
  color?: string
  stackId?: string
  radius?: [number, number, number, number]
}

interface TempoBarChartProps {
  data: Record<string, any>[]
  bars: BarDef[]
  xKey?: string
  height?: number
  layout?: 'vertical' | 'horizontal'
  showGrid?: boolean
  showLegend?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  barSize?: number
  formatter?: (v: number) => string
  className?: string
}

export function TempoBarChart({
  data, bars, xKey = 'name', height = 280,
  layout = 'vertical', showGrid = true, showLegend = false,
  showXAxis = true, showYAxis = true, barSize, formatter, className,
}: TempoBarChartProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const isH = layout === 'horizontal'

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout={isH ? 'vertical' : 'horizontal'}
          margin={{ top: 4, right: 12, left: isH ? 0 : -12, bottom: 4 }}
        >
          {showGrid && (
            <CartesianGrid {...GRID_PROPS} vertical={!isH} horizontal={isH} />
          )}

          {isH ? (
            <>
              <YAxis
                type="category" dataKey={xKey}
                tick={AXIS_TICK} axisLine={false} tickLine={false}
                width={90} hide={!showXAxis}
              />
              <XAxis
                type="number"
                tick={AXIS_TICK} axisLine={false} tickLine={false}
                tickFormatter={formatter} hide={!showYAxis}
              />
            </>
          ) : (
            <>
              <XAxis
                dataKey={xKey}
                tick={AXIS_TICK} axisLine={false} tickLine={false}
                hide={!showXAxis}
              />
              <YAxis
                tick={AXIS_TICK} axisLine={false} tickLine={false}
                tickFormatter={formatter} hide={!showYAxis}
              />
            </>
          )}

          <Tooltip
            content={<ChartTooltip formatter={formatter} />}
            cursor={{ fill: '#f1f5f9', opacity: 0.5 }}
          />
          {showLegend && (
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          )}

          {bars.map((bar, i) => (
            <Bar
              key={bar.dataKey}
              dataKey={bar.dataKey}
              name={bar.name}
              fill={bar.color || CHART_SERIES[i % CHART_SERIES.length]}
              radius={bar.radius ?? (isH ? [0, 4, 4, 0] : [4, 4, 0, 0])}
              barSize={barSize}
              stackId={bar.stackId}
              isAnimationActive={ready}
              animationDuration={800}
              animationBegin={i * 80}
              animationEasing="ease-out"
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  DONUT CHART
// ═══════════════════════════════════════════════════════════

interface DonutItem { name: string; value: number; color?: string }

interface TempoDonutChartProps {
  data: DonutItem[]
  colors?: string[]
  height?: number
  innerRadius?: number | string
  outerRadius?: number | string
  centerLabel?: string
  centerSub?: string
  showLegend?: boolean
  formatter?: (v: number) => string
  className?: string
}

export function TempoDonutChart({
  data, colors, height = 220,
  innerRadius = '58%', outerRadius = '82%',
  centerLabel, centerSub, showLegend = true,
  formatter, className,
}: TempoDonutChartProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  const total = data.reduce((s, d) => s + d.value, 0)
  const palette = colors || data.map((d, i) => d.color || CHART_SERIES[i % CHART_SERIES.length])
  const defaultFmt = (v: number) => `${v} (${total > 0 ? Math.round((v / total) * 100) : 0}%)`

  return (
    <div className={cn('relative w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={2}
            isAnimationActive={ready}
            animationDuration={1000}
            animationEasing="ease-out"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={palette[i]} stroke="none" />
            ))}
          </Pie>
          <Tooltip content={<ChartTooltip formatter={formatter || defaultFmt} />} />
        </PieChart>
      </ResponsiveContainer>
      {(centerLabel || centerSub) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          {centerLabel && <span className="text-2xl font-bold text-t1 tabular-nums">{centerLabel}</span>}
          {centerSub && <span className="text-[10px] text-t3 uppercase tracking-wider mt-0.5">{centerSub}</span>}
        </div>
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  AREA CHART
// ═══════════════════════════════════════════════════════════

interface AreaDef {
  dataKey: string
  name: string
  color?: string
  type?: 'monotone' | 'linear' | 'step'
  fillOpacity?: number
  strokeWidth?: number
}

interface TempoAreaChartProps {
  data: Record<string, any>[]
  areas: AreaDef[]
  xKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showXAxis?: boolean
  showYAxis?: boolean
  gradient?: boolean
  formatter?: (v: number) => string
  className?: string
}

export function TempoAreaChart({
  data, areas, xKey = 'name', height = 280,
  showGrid = true, showLegend = false,
  showXAxis = true, showYAxis = true,
  gradient = true, formatter, className,
}: TempoAreaChartProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 4 }}>
          {gradient && (
            <defs>
              {areas.map((area, i) => {
                const color = area.color || CHART_SERIES[i]
                return (
                  <linearGradient key={area.dataKey} id={`area-grad-${area.dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={color} stopOpacity={0.02} />
                  </linearGradient>
                )
              })}
            </defs>
          )}
          {showGrid && <CartesianGrid {...GRID_PROPS} vertical={false} />}
          <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} hide={!showXAxis} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={formatter} hide={!showYAxis} />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {areas.map((area, i) => {
            const color = area.color || CHART_SERIES[i]
            return (
              <Area
                key={area.dataKey}
                type={area.type || 'monotone'}
                dataKey={area.dataKey}
                name={area.name}
                stroke={color}
                strokeWidth={area.strokeWidth ?? 2}
                fill={gradient ? `url(#area-grad-${area.dataKey})` : color}
                fillOpacity={area.fillOpacity ?? (gradient ? 1 : 0.1)}
                isAnimationActive={ready}
                animationDuration={1200}
                animationBegin={i * 100}
                animationEasing="ease-out"
              />
            )
          })}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  SPARK AREA — compact inline chart
// ═══════════════════════════════════════════════════════════

interface TempoSparkAreaProps {
  data: number[]
  color?: string
  width?: number
  height?: number
  className?: string
}

export function TempoSparkArea({
  data, color = CHART_COLORS.primary,
  width = 100, height = 28, className,
}: TempoSparkAreaProps) {
  if (data.length < 2) return null
  const chartData = data.map((value, i) => ({ i, value }))
  const gradId = `spark-${color.replace('#', '')}-${data.length}`

  return (
    <div className={cn('inline-block', className)} style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 2, right: 2, left: 2, bottom: 2 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 2.5, strokeWidth: 0, fill: color }}
            isAnimationActive={true}
            animationDuration={800}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  LINE CHART
// ═══════════════════════════════════════════════════════════

interface LineDef {
  dataKey: string
  name: string
  color?: string
  strokeWidth?: number
  strokeDasharray?: string
  type?: 'monotone' | 'linear' | 'step'
}

interface TempoLineChartProps {
  data: Record<string, any>[]
  lines: LineDef[]
  xKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showDots?: boolean
  formatter?: (v: number) => string
  className?: string
}

export function TempoLineChart({
  data, lines, xKey = 'name', height = 280,
  showGrid = true, showLegend = false, showDots = false,
  formatter, className,
}: TempoLineChartProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  return (
    <div className={cn('w-full', className)} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 4, right: 12, left: -12, bottom: 4 }}>
          {showGrid && <CartesianGrid {...GRID_PROPS} vertical={false} />}
          <XAxis dataKey={xKey} tick={AXIS_TICK} axisLine={false} tickLine={false} />
          <YAxis tick={AXIS_TICK} axisLine={false} tickLine={false} tickFormatter={formatter} />
          <Tooltip content={<ChartTooltip formatter={formatter} />} />
          {showLegend && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {lines.map((line, i) => {
            const color = line.color || CHART_SERIES[i]
            return (
              <Line
                key={line.dataKey}
                type={line.type || 'monotone'}
                dataKey={line.dataKey}
                name={line.name}
                stroke={color}
                strokeWidth={line.strokeWidth ?? 2}
                strokeDasharray={line.strokeDasharray}
                dot={showDots ? { r: 3, fill: color, strokeWidth: 0 } : false}
                activeDot={{ r: 4, fill: color, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={ready}
                animationDuration={1200}
                animationBegin={i * 150}
                animationEasing="ease-out"
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  GAUGE — radial score visualization
// ═══════════════════════════════════════════════════════════

interface TempoGaugeProps {
  value: number
  max?: number
  color?: string
  size?: number
  label?: string
  className?: string
}

export function TempoGauge({
  value, max = 100, color, size = 120, label, className,
}: TempoGaugeProps) {
  const pct = Math.min(Math.max(value / max, 0), 1)
  const displayColor = color || (pct >= 0.75 ? STATUS_COLORS.success : pct >= 0.5 ? STATUS_COLORS.warning : STATUS_COLORS.error)
  const data = [{ name: 'score', value: pct * 100, fill: displayColor }]

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadialBarChart
          cx="50%" cy="50%"
          innerRadius="70%" outerRadius="90%"
          startAngle={90} endAngle={-270}
          data={data}
        >
          <RadialBar
            dataKey="value"
            cornerRadius={10}
            isAnimationActive
            animationDuration={1200}
            animationEasing="ease-out"
            background={{ fill: '#f1f5f9' }}
          />
        </RadialBarChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-bold text-t1 tabular-nums">{value}</span>
        {label && <span className="text-[9px] text-t3 uppercase tracking-wider">{label}</span>}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  CHART LEGEND — standalone legend component
// ═══════════════════════════════════════════════════════════

interface LegendItem { label: string; color: string; value?: string | number }

export function ChartLegend({ items, className }: { items: LegendItem[]; className?: string }) {
  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1.5 justify-center', className)}>
      {items.map(item => (
        <span key={item.label} className="flex items-center gap-1.5 text-[11px] text-t3">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
          {item.label}
          {item.value != null && <span className="font-semibold text-t1 ml-0.5">{item.value}</span>}
        </span>
      ))}
    </div>
  )
}
