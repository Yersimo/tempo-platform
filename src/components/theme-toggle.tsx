'use client'

import { Sun, Moon, Monitor } from 'lucide-react'
import { useTheme, type Theme } from '@/lib/use-theme'
import { cn } from '@/lib/utils/cn'

const cycleOrder: Theme[] = ['light', 'dark', 'system']

const themeConfig: Record<Theme, { icon: typeof Sun; label: string }> = {
  light: { icon: Sun, label: 'Light mode' },
  dark: { icon: Moon, label: 'Dark mode' },
  system: { icon: Monitor, label: 'System theme' },
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme()

  const handleCycle = () => {
    const currentIndex = cycleOrder.indexOf(theme)
    const nextIndex = (currentIndex + 1) % cycleOrder.length
    setTheme(cycleOrder[nextIndex])
  }

  const { icon: Icon, label } = themeConfig[theme]

  return (
    <button
      onClick={handleCycle}
      aria-label={label}
      title={label}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-[0.75rem] transition-colors',
        'text-white/50 hover:text-white/80 hover:bg-white/[0.06]',
        className
      )}
    >
      <Icon size={15} />
      <span className="capitalize">{theme}</span>
    </button>
  )
}
