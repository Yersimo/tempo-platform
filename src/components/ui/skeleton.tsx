import { cn } from '@/lib/utils/cn'

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular' | 'card'
  width?: string | number
  height?: string | number
}

export function Skeleton({ className, variant = 'rectangular', width, height }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-border/60',
        variant === 'text' && 'h-3.5 rounded',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-lg',
        variant === 'card' && 'rounded-[var(--radius-card)]',
        className
      )}
      style={{ width, height }}
    />
  )
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-card border border-border rounded-[var(--radius-card)] p-6', className)}>
      <Skeleton variant="text" className="w-24 mb-2" />
      <Skeleton variant="text" className="w-16 h-6 mb-2" />
      <Skeleton variant="text" className="w-32" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-[var(--radius-card)]">
      <div className="px-6 py-4 border-b border-divider">
        <Skeleton variant="text" className="w-32 h-4" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-3 flex items-center gap-4 border-b border-divider last:border-b-0">
          <Skeleton variant="circular" className="w-8 h-8 shrink-0" />
          {Array.from({ length: cols - 1 }).map((_, j) => (
            <Skeleton key={j} variant="text" className="flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}
