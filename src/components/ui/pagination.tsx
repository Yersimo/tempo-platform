'use client'

import { cn } from '@/lib/utils/cn'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  totalItems?: number
  itemsPerPage?: number
  className?: string
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, itemsPerPage, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i)
    }
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  const start = totalItems ? (currentPage - 1) * (itemsPerPage || 10) + 1 : 0
  const end = totalItems ? Math.min(currentPage * (itemsPerPage || 10), totalItems) : 0

  return (
    <div className={cn('flex items-center justify-between px-6 py-3', className)}>
      {totalItems ? (
        <span className="text-xs text-t3">
          Showing {start}-{end} of {totalItems}
        </span>
      ) : <span />}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          className="p-1.5 rounded-md text-t3 hover:text-t1 hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={14} />
        </button>
        {pages.map((page, i) => (
          page === 'ellipsis' ? (
            <span key={`e-${i}`} className="px-1 text-xs text-t3">...</span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'min-w-[28px] h-7 rounded-md text-xs font-medium transition-colors',
                page === currentPage
                  ? 'bg-tempo-600 text-white'
                  : 'text-t2 hover:text-t1 hover:bg-canvas'
              )}
            >
              {page}
            </button>
          )
        ))}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          className="p-1.5 rounded-md text-t3 hover:text-t1 hover:bg-canvas disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}
