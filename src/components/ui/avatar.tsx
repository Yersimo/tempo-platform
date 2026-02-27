import { cn } from '@/lib/utils/cn'

interface AvatarProps {
  src?: string | null
  name: string
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[0.5rem]',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-14 h-14 text-lg',
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function getColor(name: string) {
  const colors = [
    'bg-tempo-100 text-tempo-700',
    'bg-gray-100 text-gray-600',
    'bg-gray-200 text-gray-700',
    'bg-stone-100 text-stone-600',
    'bg-zinc-100 text-zinc-600',
    'bg-neutral-200 text-neutral-700',
    'bg-slate-100 text-slate-600',
  ]
  const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn('rounded-full object-cover', sizeClasses[size], className)}
      />
    )
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold',
        sizeClasses[size],
        getColor(name),
        className
      )}
    >
      {getInitials(name)}
    </div>
  )
}
