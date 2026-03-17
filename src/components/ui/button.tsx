'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center font-medium rounded-xl',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
          'disabled:opacity-50 disabled:pointer-events-none',
          'active:scale-[0.97]',
          // Variants
          {
            'bg-tempo-600 text-white hover:bg-tempo-700 shadow-sm shadow-tempo-600/25 hover:shadow-md hover:shadow-tempo-600/30 focus-visible:ring-tempo-500': variant === 'primary',
            'bg-white text-t1 hover:bg-gray-50 border border-gray-200 shadow-sm hover:shadow-md hover:border-gray-300 focus-visible:ring-gray-300': variant === 'secondary',
            'bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-600/25 hover:shadow-md focus-visible:ring-red-500': variant === 'danger',
            'text-t2 hover:text-t1 hover:bg-gray-100 focus-visible:ring-gray-300': variant === 'ghost',
            'border border-gray-200 text-t2 hover:text-t1 hover:bg-gray-50 hover:border-gray-300 shadow-sm focus-visible:ring-gray-300': variant === 'outline',
          },
          // Sizes
          {
            'text-xs px-3 py-1.5 gap-1.5 rounded-lg': size === 'sm',
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
