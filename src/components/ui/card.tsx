import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use "none" for tables/flush content. All other values (or omitting) give the standard p-6 (24px) padding. */
  padding?: 'none' | 'sm' | 'md' | 'lg'
  /** When true (or when onClick is provided), adds hover lift + pointer cursor. */
  clickable?: boolean
}

export function Card({ className, padding = 'md', clickable, children, onClick, ...props }: CardProps) {
  const isClickable = clickable || !!onClick
  return (
    <div
      className={cn(
        'bg-card border border-border rounded-[var(--radius-card)]',
        padding === 'none' ? 'p-0' : 'p-6',
        isClickable && 'cursor-pointer hover:shadow-md hover:border-tempo-200 transition-all duration-200',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('px-6 py-4 border-b border-divider', className)} {...props}>
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3 className={cn('tempo-card-title', className)} {...props}>
      {children}
    </h3>
  )
}

export function CardDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs text-t3 mt-0.5', className)} {...props}>
      {children}
    </p>
  )
}
