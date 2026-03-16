'use client'

import React from 'react'

interface Tab {
  id: string
  label: string
  count?: number
  icon?: React.ReactNode
}

interface PageTabsProps {
  tabs: Tab[]
  activeTab: string
  onChange: (tabId: string) => void
  className?: string
}

export function PageTabs({ tabs, activeTab, onChange, className = '' }: PageTabsProps) {
  return (
    <div className={`flex items-center gap-1 border-b border-divider overflow-x-auto ${className}`}>
      {tabs.map(tab => {
        const isActive = tab.id === activeTab
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`relative flex items-center gap-1.5 px-3 py-2.5 text-[13px] font-medium whitespace-nowrap transition-colors ${
              isActive
                ? 'text-tempo-600'
                : 'text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count !== undefined && (
              <span className={`text-[11px] font-medium ${
                isActive ? 'text-tempo-500' : 'text-t3'
              }`}>
                {tab.count}
              </span>
            )}
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-tempo-600 rounded-full" />
            )}
          </button>
        )
      })}
    </div>
  )
}
