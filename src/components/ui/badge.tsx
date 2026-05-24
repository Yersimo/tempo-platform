import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange' | 'ai'
}

const variants = {
  default: 'bg-fog text-t2 border border-border',
  success: 'bg-[#F0F4EA] text-success border border-[#DCE8D1]',
  warning: 'bg-[#F8F0DF] text-warning border border-[#EADBBE]',
  error: 'bg-[#F9ECEE] text-error border border-[#E9CDD1]',
  info: 'bg-tempo-50 text-info border border-tempo-100',
  orange: 'bg-birch text-brass border border-[#E7D8BA]',
  ai: 'bg-tempo-50 text-tempo-700 border border-tempo-200',
}

export function Badge({ variant = 'default', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-[var(--radius-pill)] text-[0.65rem] font-medium leading-none ring-1 ring-black/[0.02]',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
