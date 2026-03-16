import { cn } from '@/lib/utils/cn'
import { Check, X } from 'lucide-react'

export interface ValidationCheckItem {
  label: string
  passed: boolean
  description?: string
}

interface ValidationChecklistProps {
  items: ValidationCheckItem[]
  className?: string
}

export function ValidationChecklist({ items, className }: ValidationChecklistProps) {
  return (
    <div className={cn('flex flex-col', className)}>
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          {/* Icon column with connecting line */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex items-center justify-center w-6 h-6 rounded-full shrink-0',
                item.passed
                  ? 'bg-green-100 text-green-600'
                  : 'bg-red-100 text-red-500'
              )}
            >
              {item.passed ? (
                <Check size={14} strokeWidth={2.5} />
              ) : (
                <X size={14} strokeWidth={2.5} />
              )}
            </div>
            {/* Connecting line (not on the last item) */}
            {index < items.length - 1 && (
              <div className="w-px h-6 bg-border" />
            )}
          </div>
          {/* Text content */}
          <div className={cn('pt-0.5', index < items.length - 1 ? 'pb-3' : '')}>
            <p className="text-sm font-medium text-t1">{item.label}</p>
            {item.description && (
              <p className="text-xs text-t3 mt-0.5">{item.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
