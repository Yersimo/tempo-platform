'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils/cn'
import { Search } from 'lucide-react'

interface DocSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  className?: string
}

export function DocSearchBar({
  value,
  onChange,
  placeholder = 'Search documentation...',
  className,
}: DocSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className={cn('relative', className)}>
      <Search
        size={16}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none"
      />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'w-full pl-9 pr-16 py-2.5 text-sm bg-card border border-border rounded-[var(--radius-input)] text-t1 placeholder:text-t3',
          'focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600',
          'transition-colors'
        )}
      />
      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[0.6rem] font-medium text-t3 bg-canvas border border-divider rounded">
        <span className="text-[0.65rem]">&#8984;</span>K
      </kbd>
    </div>
  )
}
