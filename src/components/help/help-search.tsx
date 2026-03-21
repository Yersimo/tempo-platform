'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Search, FileText, Lightbulb, HelpCircle, Workflow, Star } from 'lucide-react'
import type { SearchResult } from '@/lib/docs/search'
import type { ModuleDoc } from '@/lib/docs/types'
import { searchDocs } from '@/lib/docs/search'

interface HelpSearchProps {
  docs: ModuleDoc[]
  onSelectResult: (slug: string, matchType: string) => void
}

const MATCH_ICONS: Record<string, typeof FileText> = {
  title: FileText,
  feature: Star,
  workflow: Workflow,
  faq: HelpCircle,
  tip: Lightbulb,
}

const MATCH_LABELS: Record<string, string> = {
  title: 'Module',
  feature: 'Feature',
  workflow: 'Workflow',
  faq: 'FAQ',
  tip: 'Tip',
}

function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || query.length < 2) return text
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return text
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-tempo-100 text-tempo-700 rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
      {text.slice(idx + query.length)}
    </>
  )
}

export function HelpSearch({ docs, onSelectResult }: HelpSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const inputRef = useRef<HTMLInputElement>(null)
  const resultsRef = useRef<HTMLDivElement>(null)

  const handleSearch = useCallback((value: string) => {
    setQuery(value)
    setSelectedIndex(-1)
    if (value.length >= 2) {
      setResults(searchDocs(docs, value))
    } else {
      setResults([])
    }
  }, [docs])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && selectedIndex >= 0 && results[selectedIndex]) {
      e.preventDefault()
      onSelectResult(results[selectedIndex].slug, results[selectedIndex].matchType)
    }
  }, [results, selectedIndex, onSelectResult])

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const items = resultsRef.current.querySelectorAll('[data-result-item]')
      items[selectedIndex]?.scrollIntoView({ block: 'nearest' })
    }
  }, [selectedIndex])

  return (
    <div className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search help topics..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500 placeholder:text-t3"
          aria-label="Search help topics"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-activedescendant={selectedIndex >= 0 ? `help-result-${selectedIndex}` : undefined}
        />
      </div>

      {results.length > 0 && (
        <div
          ref={resultsRef}
          className="mt-2 max-h-64 overflow-y-auto space-y-1"
          role="listbox"
          aria-label="Search results"
        >
          {results.map((result, i) => {
            const Icon = MATCH_ICONS[result.matchType] || FileText
            return (
              <button
                key={`${result.slug}-${result.matchType}`}
                id={`help-result-${i}`}
                data-result-item
                role="option"
                aria-selected={i === selectedIndex}
                onClick={() => onSelectResult(result.slug, result.matchType)}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors flex items-start gap-2 ${
                  i === selectedIndex
                    ? 'bg-tempo-50 text-tempo-700'
                    : 'hover:bg-canvas text-t1'
                }`}
              >
                <Icon size={14} className="mt-0.5 shrink-0 text-t3" />
                <div className="min-w-0 flex-1">
                  <div className="font-medium text-xs">
                    {highlightMatch(result.title, query)}
                    <span className="ml-2 text-[10px] font-normal text-t3 uppercase">
                      {MATCH_LABELS[result.matchType]}
                    </span>
                  </div>
                  <div className="text-xs text-t3 truncate mt-0.5">
                    {highlightMatch(result.matchText, query)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && (
        <div className="mt-2 text-center py-4 text-xs text-t3">
          No results found for &ldquo;{query}&rdquo;
        </div>
      )}
    </div>
  )
}
