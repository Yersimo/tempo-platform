'use client'

import React, { useState, useMemo } from 'react'
import { Card } from './card'
import { cn } from '@/lib/utils/cn'
import { ChevronUp, ChevronDown, Search } from 'lucide-react'

// ─── Column definition ───────────────────────────────────────────────────────
export interface DataTableColumn<T> {
  key: string
  label: string
  sortable?: boolean
  width?: string
  render?: (row: T, index: number) => React.ReactNode
}

// ─── Props ───────────────────────────────────────────────────────────────────
interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  data: T[]
  rowKey?: (row: T, index: number) => string
  onRowClick?: (row: T) => void
  searchable?: boolean
  searchPlaceholder?: string
  searchKeys?: string[]
  emptyMessage?: string
  emptyIcon?: React.ReactNode
  maxHeight?: string
  className?: string
  compact?: boolean
}

// ─── Sorting helper ──────────────────────────────────────────────────────────
function defaultSort<T>(a: T, b: T, key: string): number {
  const av = (a as any)[key]
  const bv = (b as any)[key]
  if (av == null && bv == null) return 0
  if (av == null) return 1
  if (bv == null) return -1
  if (typeof av === 'number' && typeof bv === 'number') return av - bv
  return String(av).localeCompare(String(bv))
}

// ─── DataTable component ─────────────────────────────────────────────────────
export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  onRowClick,
  searchable = false,
  searchPlaceholder = 'Search...',
  searchKeys,
  emptyMessage = 'No data',
  emptyIcon,
  maxHeight,
  className,
  compact = false,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [query, setQuery] = useState('')

  // ── Search filtering ─────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!searchable || !query.trim()) return data
    const q = query.toLowerCase()
    const keys = searchKeys ?? columns.map(c => c.key)
    return data.filter(row =>
      keys.some(k => String((row as any)[k] ?? '').toLowerCase().includes(q)),
    )
  }, [data, query, searchable, searchKeys, columns])

  // ── Sorting ──────────────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    if (!sortKey) return filtered
    const copy = [...filtered]
    copy.sort((a, b) => {
      const cmp = defaultSort(a, b, sortKey)
      return sortDir === 'asc' ? cmp : -cmp
    })
    return copy
  }, [filtered, sortKey, sortDir])

  function handleHeaderClick(col: DataTableColumn<T>) {
    if (!col.sortable) return
    if (sortKey === col.key) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(col.key)
      setSortDir('asc')
    }
  }

  // ── Cell value helper ────────────────────────────────────────────────────
  function cellValue(row: T, col: DataTableColumn<T>, idx: number) {
    if (col.render) return col.render(row, idx)
    return (row as any)[col.key] ?? ''
  }

  // ── Padding classes ──────────────────────────────────────────────────────
  const cellPx = compact ? 'px-3' : 'px-4'
  const cellPy = compact ? 'py-2.5' : 'py-3.5'
  const headerPy = compact ? 'py-2' : 'py-3'

  // ── Empty state ──────────────────────────────────────────────────────────
  const isEmpty = sorted.length === 0

  return (
    <Card padding="none" className={cn(className)}>
      {/* Search bar */}
      {searchable && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-t3"
            />
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-2 text-[13px] bg-canvas border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600 transition-all"
            />
          </div>
        </div>
      )}

      {/* ── Desktop table ─────────────────────────────────────────────────── */}
      <div className="hidden lg:block">
        <div
          className={cn('overflow-x-auto', maxHeight && 'overflow-y-auto')}
          style={maxHeight ? { maxHeight } : undefined}
        >
          <table className="w-full">
            <thead className="sticky top-0 z-[1]">
              <tr className="bg-gray-50/50">
                {columns.map(col => (
                  <th
                    key={col.key}
                    style={col.width ? { width: col.width } : undefined}
                    onClick={() => handleHeaderClick(col)}
                    className={cn(
                      'text-left text-[11px] font-medium uppercase tracking-wider text-t3',
                      headerPy,
                      cellPx,
                      'border-b border-divider',
                      col.sortable && 'cursor-pointer select-none hover:text-t2 transition-colors',
                    )}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && sortKey === col.key && (
                        sortDir === 'asc'
                          ? <ChevronUp size={12} className="text-t2" />
                          : <ChevronDown size={12} className="text-t2" />
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={cn(
                    'border-b border-divider last:border-b-0 transition-colors',
                    'hover:bg-black/[0.015]',
                    onRowClick && 'cursor-pointer',
                  )}
                >
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={cn(
                        'text-[13px] text-t1',
                        cellPy,
                        cellPx,
                      )}
                    >
                      {cellValue(row, col, i)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Desktop empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            {emptyIcon && <div className="mb-3 text-t3">{emptyIcon}</div>}
            <p className="text-sm text-t3">{emptyMessage}</p>
          </div>
        )}
      </div>

      {/* ── Mobile card stack ─────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {isEmpty && (
          <div className="flex flex-col items-center justify-center py-12 text-center px-4">
            {emptyIcon && <div className="mb-3 text-t3">{emptyIcon}</div>}
            <p className="text-sm text-t3">{emptyMessage}</p>
          </div>
        )}
        <div className="divide-y divide-divider">
          {sorted.map((row, i) => (
            <div
              key={rowKey ? rowKey(row, i) : i}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'px-4 py-4 space-y-2 transition-colors',
                'hover:bg-black/[0.015]',
                onRowClick && 'cursor-pointer',
              )}
            >
              {columns.map(col => (
                <div key={col.key}>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-t3">
                    {col.label}
                  </p>
                  <div className="text-[13px] text-t1 mt-0.5">
                    {cellValue(row, col, i)}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}

// ─── Re-export ResponsiveTable types for backward compatibility ──────────────
export type { DataTableColumn as ResponsiveTableColumn }

/** @deprecated Use DataTable instead */
export { ResponsiveTable } from './responsive-table'
