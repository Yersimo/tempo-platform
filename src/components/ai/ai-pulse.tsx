import { cn } from '@/lib/utils/cn'

interface AIPulseProps {
  active?: boolean
  size?: 'sm' | 'md'
  className?: string
}

export function AIPulse({ active = true, size = 'sm', className }: AIPulseProps) {
  if (!active) return null
  return (
    <span
      className={cn(
        'inline-block rounded-full bg-tempo-500 ai-pulse',
        size === 'sm' ? 'w-2 h-2' : 'w-3 h-3',
        className
      )}
      title="AI is analyzing this data"
    />
  )
}
