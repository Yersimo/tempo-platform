'use client'

import { useState, useRef, useEffect } from 'react'
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
  maxVisible?: number
}

export function Tabs({ tabs, active, onChange, className, maxVisible = 5 }: TabsProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!dropdownOpen) return
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [dropdownOpen])

  const needsOverflow = tabs.length > maxVisible
  const visibleTabs = needsOverflow ? tabs.slice(0, maxVisible - 1) : tabs
  const overflowTabs = needsOverflow ? tabs.slice(maxVisible - 1) : []
  const activeOverflowTab = overflowTabs.find(t => t.id === active)

  function renderTab(tab: Tab) {
    return (
      <button
        key={tab.id}
        role="tab"
        aria-selected={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'px-3.5 py-2 text-xs font-medium transition-all relative rounded-[var(--radius-button)] min-h-9',
          active === tab.id
            ? 'text-tempo-800 bg-white shadow-sm border border-border'
            : 'text-t3 hover:text-t1 hover:bg-white/65 border border-transparent'
        )}
      >
        <span className="flex items-center gap-2">
          {tab.label}
          {tab.count !== undefined && (
            <span className={cn(
              'text-[0.6rem] px-1.5 py-0.5 rounded-full',
              active === tab.id ? 'bg-tempo-50 text-tempo-700' : 'bg-white/70 text-t3'
            )}>
              {tab.count}
            </span>
          )}
        </span>
      </button>
    )
  }

  return (
    <div role="tablist" className={cn('flex gap-1.5 p-1 bg-fog/75 border border-border rounded-[var(--radius-card)] overflow-x-auto shadow-sm shadow-stone/10', className)}>
      {visibleTabs.map(tab => renderTab(tab))}
      {needsOverflow && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            aria-label={activeOverflowTab ? `More tabs, selected ${activeOverflowTab.label}` : 'More tabs'}
            aria-expanded={dropdownOpen}
            className={cn(
              'px-3.5 py-2 text-xs font-medium transition-all relative flex items-center gap-1 rounded-[var(--radius-button)] min-h-9',
              activeOverflowTab
                ? 'text-tempo-800 bg-white shadow-sm border border-border'
                : 'text-t3 hover:text-t1 hover:bg-white/65 border border-transparent'
            )}
          >
            {activeOverflowTab ? activeOverflowTab.label : 'More'} &#9662;
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-[180px] max-h-64 overflow-y-auto bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--shadow-popover)] z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {overflowTabs.map(tab => (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={active === tab.id}
                  onClick={() => {
                    onChange(tab.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2',
                    active === tab.id
                      ? 'text-tempo-700 bg-tempo-50'
                      : 'text-t2 hover:bg-fog hover:text-t1'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      'text-[0.6rem] px-1.5 py-0.5 rounded-full ml-auto',
                      active === tab.id ? 'bg-tempo-50 text-tempo-700' : 'bg-fog text-t3'
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
