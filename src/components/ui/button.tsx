'use client'

import { cn } from '@/lib/utils/cn'
import { Children, forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const hasTextChild = Children.toArray(children).some(child => typeof child === 'string' && child.trim().length > 0)
    const accessibleLabel = props['aria-label'] || props.title || (!hasTextChild && Children.count(children) > 0 ? 'Icon action' : undefined)

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        aria-label={accessibleLabel}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-[var(--radius-button)]',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-tempo-500/25 focus-visible:ring-offset-1 focus-visible:ring-offset-canvas',
          'disabled:opacity-50 disabled:pointer-events-none',
          'active:translate-y-px whitespace-nowrap',
          // Variants
          {
            'bg-tempo-700 text-white hover:bg-tempo-800 shadow-sm shadow-tempo-900/15 hover:shadow-md hover:shadow-tempo-900/20': variant === 'primary',
            'bg-card text-t1 hover:bg-birch border border-border shadow-sm hover:border-stone': variant === 'secondary',
            'bg-error text-white hover:bg-red-700 shadow-sm shadow-red-700/20 hover:shadow-md': variant === 'danger',
            'text-t2 hover:text-t1 hover:bg-fog': variant === 'ghost',
            'border border-border text-t2 hover:text-t1 hover:bg-birch hover:border-stone shadow-sm': variant === 'outline',
          },
          // Sizes
          {
            'text-xs px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2.5 gap-2': size === 'md',
            'text-base px-6 py-3 gap-2.5': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading && (
          <svg className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        )}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
