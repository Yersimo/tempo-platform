import { cn } from '@/lib/utils/cn'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 px-4 text-center', className)}>
      {icon && <div className="text-t3 mb-4">{icon}</div>}
      <h3 className="text-sm font-semibold text-t1 mb-1">{title}</h3>
      {description && <p className="text-xs text-t3 max-w-sm mb-4">{description}</p>}
      {action}
    </div>
  )
}
