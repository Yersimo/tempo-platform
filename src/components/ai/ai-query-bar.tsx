'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Sparkles, Search, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface AIQueryBarProps {
  onQuery: (query: string) => void
  placeholder?: string
  suggestions?: string[]
  className?: string
}

export function AIQueryBar({ onQuery, placeholder, suggestions, className }: AIQueryBarProps) {
  const t = useTranslations('ai')
  const resolvedPlaceholder = placeholder ?? t('queryPlaceholder')
  const resolvedSuggestions = suggestions ?? [
    t('suggestionHighPerformers'),
    t('suggestionGoalsAtRisk'),
    t('suggestionNoMentors'),
    t('suggestionLearning'),
  ]
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleSubmit = (q?: string) => {
    const finalQuery = q || query
    if (!finalQuery.trim()) return
    onQuery(finalQuery.trim())
    setQuery(finalQuery)
    setFocused(false)
    inputRef.current?.blur()
  }

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-card)] border bg-white transition-all duration-200',
        focused ? 'border-tempo-500 shadow-[0_0_0_3px_rgba(234,88,12,0.08)]' : 'border-border'
      )}>
        <Sparkles size={16} className="text-tempo-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          placeholder={resolvedPlaceholder}
          className="flex-1 text-sm text-t1 bg-transparent outline-none placeholder:text-t3"
        />
        <button
          onClick={() => handleSubmit()}
          className={cn(
            'shrink-0 p-1.5 rounded-lg transition-colors',
            query.trim() ? 'bg-tempo-600 text-white hover:bg-tempo-700' : 'bg-canvas text-t3'
          )}
        >
          {query.trim() ? <ArrowRight size={12} /> : <Search size={12} />}
        </button>
      </div>

      {focused && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-[var(--radius-card)] shadow-sm z-10 overflow-hidden">
          <div className="px-3 py-2">
            <p className="text-[0.55rem] text-t3 uppercase tracking-wider font-semibold mb-1.5">{t('tryAsking')}</p>
            {resolvedSuggestions.map((s, i) => (
              <button
                key={i}
                onMouseDown={e => { e.preventDefault(); handleSubmit(s) }}
                className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded-md text-xs text-t2 hover:bg-canvas hover:text-t1 transition-colors"
              >
                <Search size={10} className="text-t3" />
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
