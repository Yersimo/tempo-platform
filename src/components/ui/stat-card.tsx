'use client'

import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { Card } from './card'
import { ArrowRight } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  change?: string
  changeType?: 'positive' | 'negative' | 'neutral'
  icon?: React.ReactNode
  className?: string
  /** When provided, the card becomes a clickable link */
  href?: string
}

export function StatCard({ label, value, change, changeType = 'neutral', icon, className, href }: StatCardProps) {
  const router = useRouter()

  return (
    <Card
      className={cn(
        'relative overflow-hidden',
        href && 'group hover:shadow-md hover:border-tempo-200 transition-all cursor-pointer',
        className
      )}
      onClick={href ? () => router.push(href) : undefined}
      role={href ? 'link' : undefined}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="tempo-th mb-1">{label}</p>
          <p className="tempo-stat text-2xl text-t1">{value}</p>
          {change && (
            <p className={cn(
              'tempo-small mt-1 font-medium',
              changeType === 'positive' && 'text-success',
              changeType === 'negative' && 'text-error',
              changeType === 'neutral' && 'text-t3',
            )}>
              {change}
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          {icon && (
            <div className="text-tempo-400 opacity-50">
              {icon}
            </div>
          )}
          {href && (
            <ArrowRight size={14} className="text-t3 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
    </Card>
  )
}
