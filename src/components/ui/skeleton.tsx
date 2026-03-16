import { cn } from '@/lib/utils/cn'

/* ─── Base Skeleton ─── */

interface SkeletonProps {
  className?: string
  /** Width as Tailwind class (e.g. "w-24", "w-full") */
  width?: string
  /** Height as Tailwind class (e.g. "h-4", "h-8") */
  height?: string
}

export function Skeleton({ className, width = 'w-full', height = 'h-4' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-[var(--radius-button)] bg-gray-200/60',
        width,
        height,
        className
      )}
    />
  )
}

/* ─── Text Line ─── */

interface SkeletonTextProps {
  /** Number of lines */
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 1, className }: SkeletonTextProps) {
  const widths = ['w-full', 'w-5/6', 'w-4/6', 'w-3/4', 'w-2/3']
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-3.5"
          width={i === lines - 1 && lines > 1 ? widths[i % widths.length] : 'w-full'}
        />
      ))}
    </div>
  )
}

/* ─── Avatar ─── */

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizeMap = { sm: 'w-8 h-8', md: 'w-10 h-10', lg: 'w-12 h-12' }
  return (
    <div
      className={cn(
        'skeleton-shimmer rounded-full bg-gray-200/60 shrink-0',
        sizeMap[size],
        className
      )}
    />
  )
}

/* ─── Card ─── */

interface SkeletonCardProps {
  lines?: number
  className?: string
}

export function SkeletonCard({ lines = 3, className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-[var(--radius-card)] p-6',
        className
      )}
    >
      <Skeleton height="h-4" width="w-1/3" className="mb-4" />
      <SkeletonText lines={lines} />
    </div>
  )
}

/* ─── Stat Card (mirrors StatCard layout) ─── */

interface SkeletonStatCardProps {
  showChange?: boolean
  showIcon?: boolean
  className?: string
}

export function SkeletonStatCard({ showChange = true, showIcon = true, className }: SkeletonStatCardProps) {
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-[var(--radius-card)] p-6',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {/* Label */}
          <Skeleton height="h-3" width="w-20" className="mb-2" />
          {/* Value */}
          <Skeleton height="h-7" width="w-28" className="mb-1" />
          {/* Change */}
          {showChange && <Skeleton height="h-3" width="w-16" className="mt-1" />}
        </div>
        {showIcon && (
          <Skeleton height="h-5" width="w-5" className="rounded opacity-50" />
        )}
      </div>
    </div>
  )
}

/* ─── Table ─── */

interface SkeletonTableProps {
  /** Number of columns */
  columns?: number
  /** Number of body rows */
  rows?: number
  className?: string
}

export function SkeletonTable({ columns = 5, rows = 6, className }: SkeletonTableProps) {
  const colWidths = ['w-1/4', 'w-1/3', 'w-1/5', 'w-2/5', 'w-1/6']
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-[var(--radius-card)] overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-divider flex items-center gap-6">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton
            key={i}
            height="h-3"
            width={colWidths[i % colWidths.length]}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className={cn(
            'px-6 py-4 flex items-center gap-6',
            rowIdx < rows - 1 && 'border-b border-divider'
          )}
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton
              key={colIdx}
              height="h-3.5"
              width={colWidths[colIdx % colWidths.length]}
            />
          ))}
        </div>
      ))}
    </div>
  )
}

/* ─── Full Page Skeleton ─── */

interface SkeletonPageProps {
  /** Number of stat cards across the top */
  statCards?: number
  /** Number of table rows */
  tableRows?: number
  className?: string
}

export function SkeletonPage({ statCards = 3, tableRows = 6, className }: SkeletonPageProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Page title */}
      <div className="space-y-2">
        <Skeleton height="h-7" width="w-48" />
        <Skeleton height="h-4" width="w-72" className="opacity-60" />
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: statCards }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      {/* Table */}
      <SkeletonTable rows={tableRows} />
    </div>
  )
}
