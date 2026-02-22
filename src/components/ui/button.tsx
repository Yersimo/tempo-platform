'use client'

import { cn } from '@/lib/utils/cn'
import { forwardRef } from 'react'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors rounded-[var(--radius-button)] focus:outline-none focus:ring-2 focus:ring-tempo-600/20 disabled:opacity-50 disabled:pointer-events-none',
          {
            'bg-tempo-600 text-white hover:bg-tempo-700': variant === 'primary',
            'bg-canvas text-t2 hover:bg-gray-200 border border-divider': variant === 'secondary',
            'bg-error text-white hover:bg-red-700': variant === 'danger',
            'text-t2 hover:text-t1 hover:bg-canvas': variant === 'ghost',
            'border border-divider text-t2 hover:text-t1 hover:bg-canvas': variant === 'outline',
          },
          {
            'text-xs px-3 py-1.5 gap-1.5': size === 'sm',
            'text-sm px-4 py-2 gap-2': size === 'md',
            'text-base px-6 py-2.5 gap-2': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
