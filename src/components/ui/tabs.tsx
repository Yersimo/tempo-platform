'use client'

import { cn } from '@/lib/utils/cn'

interface Tab {
  id: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn('flex gap-1 border-b border-divider', className)}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={cn(
            'px-4 py-2.5 text-xs font-medium transition-colors relative',
            active === tab.id
              ? 'text-tempo-600'
              : 'text-t3 hover:text-t1'
          )}
        >
          <span className="flex items-center gap-2">
            {tab.label}
            {tab.count !== undefined && (
              <span className={cn(
                'text-[0.6rem] px-1.5 py-0.5 rounded-full',
                active === tab.id ? 'bg-tempo-100 text-tempo-700' : 'bg-canvas text-t3'
              )}>
                {tab.count}
              </span>
            )}
          </span>
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tempo-600 rounded-full" />
          )}
        </button>
      ))}
    </div>
  )
}
