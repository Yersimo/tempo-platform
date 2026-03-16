'use client'

import { cn } from '@/lib/utils/cn'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

/* ------------------------------------------------------------------ */
/*  Helpers (pure, no external deps)                                  */
/* ------------------------------------------------------------------ */

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const SHORT_MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]
const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function toDate(v: string | Date | undefined | null): Date | null {
  if (!v) return null
  if (v instanceof Date) return isNaN(v.getTime()) ? null : v
  const d = new Date(v + 'T00:00:00')
  return isNaN(d.getTime()) ? null : d
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function formatDisplay(d: Date | null): string {
  if (!d) return ''
  return `${SHORT_MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function startDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

/** Build the 6-row calendar grid including leading/trailing days */
function buildCalendarGrid(year: number, month: number) {
  const totalDays = daysInMonth(year, month)
  const firstDay = startDayOfWeek(year, month)
  const prevMonthDays = daysInMonth(year, month - 1)

  const cells: { day: number; month: number; year: number; outside: boolean }[] = []

  // leading days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevMonthDays - i
    const m = month === 0 ? 11 : month - 1
    const y = month === 0 ? year - 1 : year
    cells.push({ day: d, month: m, year: y, outside: true })
  }

  // current month
  for (let d = 1; d <= totalDays; d++) {
    cells.push({ day: d, month, year, outside: false })
  }

  // trailing days to fill 42 cells (6 rows)
  const remaining = 42 - cells.length
  for (let d = 1; d <= remaining; d++) {
    const m = month === 11 ? 0 : month + 1
    const y = month === 11 ? year + 1 : year
    cells.push({ day: d, month: m, year: y, outside: true })
  }

  return cells
}

/* ------------------------------------------------------------------ */
/*  CalendarPanel (shared between DatePicker and DateRangePicker)      */
/* ------------------------------------------------------------------ */

interface CalendarPanelProps {
  viewMonth: number
  viewYear: number
  onPrevMonth: () => void
  onNextMonth: () => void
  selected?: Date | null
  rangeStart?: Date | null
  rangeEnd?: Date | null
  onSelectDate: (d: Date) => void
  minDate?: Date | null
  maxDate?: Date | null
  focusedIndex: number
  onFocusedIndexChange: (i: number) => void
}

function CalendarPanel({
  viewMonth, viewYear, onPrevMonth, onNextMonth,
  selected, rangeStart, rangeEnd,
  onSelectDate, minDate, maxDate,
  focusedIndex, onFocusedIndexChange,
}: CalendarPanelProps) {
  const today = useMemo(() => new Date(), [])
  const grid = useMemo(() => buildCalendarGrid(viewYear, viewMonth), [viewYear, viewMonth])
  const gridRef = useRef<HTMLDivElement>(null)

  const isDisabled = useCallback((cell: typeof grid[0]) => {
    const d = new Date(cell.year, cell.month, cell.day)
    if (minDate && d < minDate) return true
    if (maxDate && d > maxDate) return true
    return false
  }, [minDate, maxDate])

  const isInRange = useCallback((cell: typeof grid[0]) => {
    if (!rangeStart || !rangeEnd) return false
    const d = new Date(cell.year, cell.month, cell.day)
    return d > rangeStart && d < rangeEnd
  }, [rangeStart, rangeEnd])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    let next = focusedIndex
    switch (e.key) {
      case 'ArrowLeft': next = Math.max(0, focusedIndex - 1); break
      case 'ArrowRight': next = Math.min(41, focusedIndex + 1); break
      case 'ArrowUp': next = Math.max(0, focusedIndex - 7); break
      case 'ArrowDown': next = Math.min(41, focusedIndex + 7); break
      case 'Enter':
      case ' ': {
        e.preventDefault()
        const cell = grid[focusedIndex]
        if (cell && !isDisabled(cell)) {
          onSelectDate(new Date(cell.year, cell.month, cell.day))
        }
        return
      }
      default: return
    }
    e.preventDefault()
    onFocusedIndexChange(next)
  }, [focusedIndex, grid, isDisabled, onSelectDate, onFocusedIndexChange])

  return (
    <div className="p-3">
      {/* Month/Year Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={onPrevMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-t2 transition-colors"
          aria-label="Previous month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <span className="text-sm font-semibold text-t1">
          {MONTHS[viewMonth]} {viewYear}
        </span>
        <button
          type="button"
          onClick={onNextMonth}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-t2 transition-colors"
          aria-label="Next month"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map(d => (
          <div key={d} className="h-8 flex items-center justify-center text-[11px] font-medium text-t3 select-none">
            {d}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div
        ref={gridRef}
        className="grid grid-cols-7"
        role="grid"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        aria-label={`${MONTHS[viewMonth]} ${viewYear}`}
      >
        {grid.map((cell, i) => {
          const cellDate = new Date(cell.year, cell.month, cell.day)
          const isToday = isSameDay(cellDate, today)
          const isSelected = selected ? isSameDay(cellDate, selected) : false
          const isRangeStart = rangeStart ? isSameDay(cellDate, rangeStart) : false
          const isRangeEnd = rangeEnd ? isSameDay(cellDate, rangeEnd) : false
          const inRange = isInRange(cell)
          const disabled = isDisabled(cell)
          const isFocused = i === focusedIndex

          return (
            <button
              key={`${cell.year}-${cell.month}-${cell.day}-${i}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelectDate(cellDate)}
              tabIndex={-1}
              className={cn(
                'h-8 w-8 mx-auto flex items-center justify-center text-[13px] rounded-lg transition-all relative',
                cell.outside && 'text-t3/40',
                !cell.outside && !isSelected && !isRangeStart && !isRangeEnd && !disabled && 'text-t1 hover:bg-gray-100',
                (isSelected || isRangeStart || isRangeEnd) && 'bg-tempo-600 text-white font-medium hover:bg-tempo-700',
                inRange && !isRangeStart && !isRangeEnd && 'bg-tempo-100 text-tempo-800',
                isToday && !isSelected && !isRangeStart && !isRangeEnd && 'ring-1 ring-tempo-400 ring-inset font-medium',
                disabled && 'opacity-30 cursor-not-allowed',
                isFocused && 'outline outline-2 outline-tempo-500 outline-offset-[-2px]',
              )}
              aria-label={`${MONTHS[cell.month]} ${cell.day}, ${cell.year}`}
              aria-selected={isSelected || isRangeStart || isRangeEnd}
            >
              {cell.day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Dropdown wrapper with outside-click & positioning                  */
/* ------------------------------------------------------------------ */

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [ref, handler])
}

/* ------------------------------------------------------------------ */
/*  DatePicker                                                        */
/* ------------------------------------------------------------------ */

export interface DatePickerProps {
  value?: string | Date | null
  onChange?: (date: Date) => void
  label?: string
  placeholder?: string
  minDate?: string | Date
  maxDate?: string | Date
  className?: string
  error?: string
  disabled?: boolean
}

export function DatePicker({
  value,
  onChange,
  label,
  placeholder = 'Select date',
  minDate: minDateProp,
  maxDate: maxDateProp,
  className,
  error,
  disabled,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = useMemo(() => toDate(value), [value])
  const minDate = useMemo(() => toDate(minDateProp ?? null), [minDateProp])
  const maxDate = useMemo(() => toDate(maxDateProp ?? null), [maxDateProp])

  const [viewMonth, setViewMonth] = useState(() => selected ? selected.getMonth() : new Date().getMonth())
  const [viewYear, setViewYear] = useState(() => selected ? selected.getFullYear() : new Date().getFullYear())
  const [focusedIndex, setFocusedIndex] = useState(14)

  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, () => setOpen(false))

  // Sync view when value changes externally
  useEffect(() => {
    if (selected) {
      setViewMonth(selected.getMonth())
      setViewYear(selected.getFullYear())
    }
  }, [selected])

  const handlePrevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const handleSelect = useCallback((d: Date) => {
    onChange?.(d)
    setOpen(false)
  }, [onChange])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(o => !o)
    }
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-t1 mb-1">{label}</label>
      )}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full flex items-center gap-2 px-3 py-2 text-sm bg-white border rounded-[var(--radius-input)] text-left transition-all',
          'focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600',
          'disabled:opacity-50 disabled:bg-canvas disabled:cursor-not-allowed',
          error ? 'border-error focus:ring-error/20 focus:border-error' : 'border-divider',
          open && !error && 'ring-2 ring-tempo-600/20 border-tempo-600',
        )}
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-t3 shrink-0">
          <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M2 7H14" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M5.5 1.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M10.5 1.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
        <span className={cn('flex-1 truncate', selected ? 'text-t1' : 'text-t3')}>
          {selected ? formatDisplay(selected) : placeholder}
        </span>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className={cn('text-t3 shrink-0 transition-transform', open && 'rotate-180')}>
          <path d="M3.5 5.25L7 8.75L10.5 5.25" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {error && <p className="text-xs text-error mt-1">{error}</p>}

      {open && (
        <div
          className="absolute z-50 mt-1 bg-white border border-divider rounded-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ minWidth: 280 }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose date"
        >
          <CalendarPanel
            viewMonth={viewMonth}
            viewYear={viewYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            selected={selected}
            onSelectDate={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            focusedIndex={focusedIndex}
            onFocusedIndexChange={setFocusedIndex}
          />
        </div>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  DateRangePicker                                                   */
/* ------------------------------------------------------------------ */

export interface DateRangePickerProps {
  startDate?: string | Date | null
  endDate?: string | Date | null
  onChangeStart?: (date: Date) => void
  onChangeEnd?: (date: Date) => void
  labelStart?: string
  labelEnd?: string
  placeholderStart?: string
  placeholderEnd?: string
  minDate?: string | Date
  maxDate?: string | Date
  className?: string
  error?: string
  disabled?: boolean
}

export function DateRangePicker({
  startDate: startDateProp,
  endDate: endDateProp,
  onChangeStart,
  onChangeEnd,
  labelStart,
  labelEnd,
  placeholderStart = 'Start date',
  placeholderEnd = 'End date',
  minDate: minDateProp,
  maxDate: maxDateProp,
  className,
  error,
  disabled,
}: DateRangePickerProps) {
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState<'start' | 'end'>('start')
  const startDate = useMemo(() => toDate(startDateProp), [startDateProp])
  const endDate = useMemo(() => toDate(endDateProp), [endDateProp])
  const minDate = useMemo(() => toDate(minDateProp ?? null), [minDateProp])
  const maxDate = useMemo(() => toDate(maxDateProp ?? null), [maxDateProp])

  const [viewMonth, setViewMonth] = useState(() => startDate ? startDate.getMonth() : new Date().getMonth())
  const [viewYear, setViewYear] = useState(() => startDate ? startDate.getFullYear() : new Date().getFullYear())
  const [focusedIndex, setFocusedIndex] = useState(14)

  const containerRef = useRef<HTMLDivElement>(null)
  useClickOutside(containerRef, () => setOpen(false))

  useEffect(() => {
    const d = picking === 'start' ? startDate : endDate
    if (d) {
      setViewMonth(d.getMonth())
      setViewYear(d.getFullYear())
    }
  }, [startDate, endDate, picking])

  const handlePrevMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11 }
      return m - 1
    })
  }, [])

  const handleNextMonth = useCallback(() => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0 }
      return m + 1
    })
  }, [])

  const handleSelect = useCallback((d: Date) => {
    if (picking === 'start') {
      onChangeStart?.(d)
      // If end date is before new start, clear it
      if (endDate && d > endDate) {
        onChangeEnd?.(d)
      }
      setPicking('end')
    } else {
      // If selected end is before start, swap
      if (startDate && d < startDate) {
        onChangeStart?.(d)
        setPicking('end')
      } else {
        onChangeEnd?.(d)
        setOpen(false)
        setPicking('start')
      }
    }
  }, [picking, startDate, endDate, onChangeStart, onChangeEnd])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { setOpen(false); return }
  }, [])

  const openWithTarget = useCallback((target: 'start' | 'end') => {
    setPicking(target)
    setOpen(true)
  }, [])

  return (
    <div ref={containerRef} className={cn('relative', className)} onKeyDown={handleKeyDown}>
      {(labelStart || labelEnd) && (
        <div className="flex gap-4 mb-1">
          {labelStart && <label className="flex-1 block text-xs font-medium text-t1">{labelStart}</label>}
          {labelEnd && <label className="flex-1 block text-xs font-medium text-t1">{labelEnd}</label>}
        </div>
      )}
      <div className={cn(
        'flex items-center bg-white border rounded-[var(--radius-input)] transition-all overflow-hidden',
        'focus-within:ring-2 focus-within:ring-tempo-600/20 focus-within:border-tempo-600',
        disabled && 'opacity-50 bg-canvas cursor-not-allowed',
        error ? 'border-error' : 'border-divider',
        open && !error && 'ring-2 ring-tempo-600/20 border-tempo-600',
      )}>
        <button
          type="button"
          disabled={disabled}
          onClick={() => openWithTarget('start')}
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
            'hover:bg-gray-50 focus:outline-none',
            picking === 'start' && open && 'bg-tempo-50',
          )}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="text-t3 shrink-0">
            <rect x="2" y="3" width="12" height="11" rx="2" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M2 7H14" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5.5 1.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
            <path d="M10.5 1.5V4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          <span className={cn('truncate', startDate ? 'text-t1' : 'text-t3')}>
            {startDate ? formatDisplay(startDate) : placeholderStart}
          </span>
        </button>

        <div className="flex items-center px-1 text-t3 select-none">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M4 8H12M12 8L9 5M12 8L9 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => openWithTarget('end')}
          className={cn(
            'flex-1 flex items-center gap-2 px-3 py-2 text-sm text-left transition-colors',
            'hover:bg-gray-50 focus:outline-none',
            picking === 'end' && open && 'bg-tempo-50',
          )}
        >
          <span className={cn('truncate', endDate ? 'text-t1' : 'text-t3')}>
            {endDate ? formatDisplay(endDate) : placeholderEnd}
          </span>
        </button>
      </div>
      {error && <p className="text-xs text-error mt-1">{error}</p>}

      {open && (
        <div
          className="absolute z-50 mt-1 bg-white border border-divider rounded-xl shadow-xl animate-in fade-in slide-in-from-top-1 duration-150"
          style={{ minWidth: 280 }}
          role="dialog"
          aria-modal="true"
          aria-label="Choose date range"
        >
          <div className="flex items-center gap-2 px-3 pt-3 pb-1">
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
              picking === 'start' ? 'bg-tempo-100 text-tempo-700' : 'text-t3',
            )}>
              Start
            </span>
            <span className={cn(
              'text-xs font-medium px-2 py-0.5 rounded-full transition-colors',
              picking === 'end' ? 'bg-tempo-100 text-tempo-700' : 'text-t3',
            )}>
              End
            </span>
          </div>
          <CalendarPanel
            viewMonth={viewMonth}
            viewYear={viewYear}
            onPrevMonth={handlePrevMonth}
            onNextMonth={handleNextMonth}
            rangeStart={startDate}
            rangeEnd={endDate}
            onSelectDate={handleSelect}
            minDate={minDate}
            maxDate={maxDate}
            focusedIndex={focusedIndex}
            onFocusedIndexChange={setFocusedIndex}
          />
        </div>
      )}
    </div>
  )
}
