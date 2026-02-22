import { cn } from '@/lib/utils/cn'
import { Card } from './card'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
}

export function StatCard({ label, value, change, changeType = 'neutral', icon, className }: StatCardProps) {
  return (
    <Card className={cn('relative overflow-hidden', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="tempo-th text-t3 mb-1">{label}</p>
          <p className="tempo-stat text-2xl text-t1">{value}</p>
          {change && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-error',
              changeType === 'neutral' && 'text-t3',
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className="text-tempo-400 opacity-50">
            {icon}
          </div>
        )}
      </div>
    </Card>
  )
}
