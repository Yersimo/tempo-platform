import { cn } from '@/lib/utils/cn'

interface ProgressProps {
  value: number
  max?: number
  size?: 'sm' | 'md'
  color?: 'orange' | 'success' | 'warning' | 'error'
  showLabel?: boolean
  className?: string
}

const colorClasses = {
  orange: 'bg-tempo-600',
  success: 'bg-success',
  warning: 'bg-warning',
  error: 'bg-error',
}

export function Progress({ value, max = 100, size = 'sm', color = 'orange', showLabel, className }: ProgressProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100)

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className={cn(
        'flex-1 bg-canvas rounded-full overflow-hidden',
        size === 'sm' ? 'h-1.5' : 'h-2.5'
      )}>
        <div
          className={cn('h-full rounded-full transition-all duration-500', colorClasses[color])}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-t2 tabular-nums">{percentage}%</span>
      )}
    </div>
  )
}
