import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange' | 'ai'
}

const variants = {
  default: 'bg-canvas text-t2',
  success: 'bg-green-50 text-success',
  warning: 'bg-amber-50 text-warning',
  error: 'bg-red-50 text-error',
  info: 'bg-gray-100 text-gray-600',
  orange: 'bg-tempo-100 text-tempo-700',
  ai: 'bg-tempo-50 text-tempo-600 border border-tempo-200',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)] text-[0.65rem] font-medium',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
