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
    )
  }

  return (
    <div className={cn('flex gap-1 border-b border-divider', className)}>
      {visibleTabs.map(tab => renderTab(tab))}
      {needsOverflow && (
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(prev => !prev)}
            className={cn(
              'px-4 py-2.5 text-xs font-medium transition-colors relative flex items-center gap-1',
              activeOverflowTab
                ? 'text-tempo-600'
                : 'text-t3 hover:text-t1'
            )}
          >
            {activeOverflowTab ? activeOverflowTab.label : 'More'} &#9662;
            {activeOverflowTab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-tempo-600 rounded-full" />
            )}
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 min-w-[180px] max-h-64 overflow-y-auto bg-white border border-border rounded-xl shadow-lg z-50 py-1 animate-in fade-in slide-in-from-top-1 duration-150">
              {overflowTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    onChange(tab.id)
                    setDropdownOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-4 py-2 text-xs font-medium transition-colors flex items-center gap-2',
                    active === tab.id
                      ? 'text-tempo-600 bg-tempo-50'
                      : 'text-t2 hover:bg-canvas hover:text-t1'
                  )}
                >
                  {tab.label}
                  {tab.count !== undefined && (
                    <span className={cn(
                      'text-[0.6rem] px-1.5 py-0.5 rounded-full ml-auto',
                      active === tab.id ? 'bg-tempo-100 text-tempo-700' : 'bg-canvas text-t3'
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
