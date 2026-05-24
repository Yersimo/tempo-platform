'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef, useState, useRef, useEffect, useCallback } from 'react'
import { ChevronDown, ChevronUp, Check } from 'lucide-react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, icon, type, ...props }, ref) => {
    const errorId = error && id ? `${id}-error` : undefined
    const isNumber = type === 'number'
    const innerRef = useRef<HTMLInputElement | null>(null)

    const setRefs = useCallback((el: HTMLInputElement | null) => {
      innerRef.current = el
      if (typeof ref === 'function') ref(el)
      else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = el
    }, [ref])

    const stepUp = () => {
      innerRef.current?.stepUp()
      innerRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
      innerRef.current?.dispatchEvent(new Event('change', { bubbles: true }))
    }
    const stepDown = () => {
      innerRef.current?.stepDown()
      innerRef.current?.dispatchEvent(new Event('input', { bubbles: true }))
      innerRef.current?.dispatchEvent(new Event('change', { bubbles: true }))
    }

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-t2 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 group-focus-within:text-tempo-700 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={setRefs}
            id={id}
            type={type}
            aria-invalid={error ? true : undefined}
            aria-describedby={errorId}
            className={cn(
              'w-full h-10 px-3.5 text-sm bg-card dark:bg-card border border-border rounded-[var(--radius-input)] text-t1 placeholder:text-t3',
              'shadow-sm shadow-stone/15',
              'transition-all duration-200 ease-out',
              'hover:border-stone hover:bg-snow',
              'focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-600 focus:bg-white focus:shadow-md focus:shadow-tempo-900/5',
              'disabled:opacity-50 disabled:bg-fog disabled:cursor-not-allowed',
              error && 'border-error focus:ring-error/20 focus:border-error',
              icon && 'pl-10',
              isNumber && 'pr-10 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
              className
            )}
            {...props}
          />
          {isNumber && (
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex flex-col">
              <button
                type="button"
                tabIndex={-1}
                onClick={stepUp}
                className="flex items-center justify-center w-7 h-4 rounded-t-md text-t3 hover:text-tempo-700 hover:bg-tempo-50 transition-colors"
              >
                <ChevronUp size={12} strokeWidth={2.5} />
              </button>
              <button
                type="button"
                tabIndex={-1}
                onClick={stepDown}
                className="flex items-center justify-center w-7 h-4 rounded-b-md text-t3 hover:text-tempo-700 hover:bg-tempo-50 transition-colors"
              >
                <ChevronDown size={12} strokeWidth={2.5} />
              </button>
            </div>
          )}
        </div>
        {error && <p id={errorId} role="alert" className="text-xs text-error mt-1">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'

// --- Modern Custom Select ---

interface SelectOption {
  value: string
  label: string
  icon?: React.ReactNode
  description?: string
}

interface SelectProps {
  label?: string
  error?: string
  options: SelectOption[]
  value?: string
  onChange?: (e: { target: { value: string } }) => void
  placeholder?: string
  className?: string
  id?: string
  disabled?: boolean
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  ({ className, label, error, id, options, value, onChange, placeholder, disabled }, ref) => {
    const [isOpen, setIsOpen] = useState(false)
    const [highlightedIndex, setHighlightedIndex] = useState(-1)
    const containerRef = useRef<HTMLDivElement>(null)
    const listRef = useRef<HTMLUListElement>(null)

    const selected = options.find(o => o.value === value)

    // Close on outside click
    useEffect(() => {
      if (!isOpen) return
      const handler = (e: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false)
        }
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [isOpen])

    // Keyboard navigation
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (disabled) return
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        if (isOpen && highlightedIndex >= 0) {
          selectOption(options[highlightedIndex])
        } else {
          setIsOpen(!isOpen)
        }
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        if (!isOpen) { setIsOpen(true); setHighlightedIndex(0) }
        else setHighlightedIndex(prev => Math.min(prev + 1, options.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlightedIndex(prev => Math.max(prev - 1, 0))
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    const selectOption = (opt: SelectOption) => {
      onChange?.({ target: { value: opt.value } })
      setIsOpen(false)
      setHighlightedIndex(-1)
    }

    // Scroll highlighted into view
    useEffect(() => {
      if (highlightedIndex >= 0 && listRef.current) {
        const items = listRef.current.children
        if (items[highlightedIndex]) {
          (items[highlightedIndex] as HTMLElement).scrollIntoView({ block: 'nearest' })
        }
      }
    }, [highlightedIndex])

    return (
      <div className="space-y-1.5" ref={containerRef}>
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-t2 tracking-wide uppercase">
            {label}
          </label>
        )}
        <div className="relative" ref={ref}>
          <button
            type="button"
            id={id}
            disabled={disabled}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            onKeyDown={handleKeyDown}
            className={cn(
              'w-full h-10 px-3.5 pr-10 text-sm text-left bg-card dark:bg-card border rounded-[var(--radius-input)]',
              'shadow-sm shadow-stone/15',
              'transition-all duration-200 ease-out',
              'focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-600 focus:bg-white focus:shadow-md focus:shadow-tempo-900/5',
              'disabled:opacity-50 disabled:bg-fog disabled:cursor-not-allowed',
              isOpen
                ? 'border-tempo-600 ring-2 ring-tempo-500/20 shadow-md shadow-tempo-900/5'
                : 'border-border hover:border-stone',
              error && 'border-error focus:ring-error/20 focus:border-error',
              className
            )}
          >
            <span className={cn(
              'block truncate',
              selected ? 'text-t1' : 'text-gray-400'
            )}>
              {selected?.label || placeholder || 'Select...'}
            </span>
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-200',
              isOpen && 'rotate-180'
            )}>
              <ChevronDown size={16} className="text-t3" />
            </div>
          </button>

          {isOpen && (
            <ul
              ref={listRef}
              role="listbox"
              className={cn(
                'absolute z-50 w-full mt-1.5 py-1 bg-card border border-border rounded-[var(--radius-card)] shadow-[var(--shadow-popover)]',
                'max-h-60 overflow-auto',
                'animate-in fade-in slide-in-from-top-1 duration-150'
              )}
            >
              {options.map((opt, i) => (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={opt.value === value}
                  onClick={() => selectOption(opt)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  className={cn(
                    'flex items-center gap-2.5 px-3.5 py-2.5 text-sm cursor-pointer transition-colors duration-100',
                    i === highlightedIndex && 'bg-fog',
                    opt.value === value && 'text-tempo-700 font-medium',
                    opt.value !== value && 'text-t1'
                  )}
                >
                  {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{opt.label}</div>
                    {opt.description && (
                      <div className="text-xs text-t3 truncate mt-0.5">{opt.description}</div>
                    )}
                  </div>
                  {opt.value === value && (
                    <Check size={14} className="shrink-0 text-tempo-700" />
                  )}
                </li>
              ))}
              {options.length === 0 && (
                <li className="px-3.5 py-3 text-sm text-t3 text-center">No options</li>
              )}
            </ul>
          )}
        </div>
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={id} className="block text-xs font-medium text-t2 tracking-wide uppercase">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn(
            'w-full px-3.5 py-2.5 text-sm bg-card dark:bg-card border border-border rounded-[var(--radius-input)] text-t1 placeholder:text-t3 resize-none',
            'shadow-sm shadow-stone/15',
            'transition-all duration-200 ease-out',
            'hover:border-stone hover:bg-snow',
            'focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-600 focus:bg-white focus:shadow-md focus:shadow-tempo-900/5',
            'disabled:opacity-50 disabled:bg-fog',
            error && 'border-error focus:ring-error/20 focus:border-error',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </div>
    )
  }
)

Textarea.displayName = 'Textarea'
