'use client'

import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const currentLocale = useLocale() as Locale

  const switchLocale = (locale: Locale) => {
    document.cookie = `tempo_locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
    window.location.reload()
  }

  // Cycle to the next locale in the list
  const currentIndex = locales.indexOf(currentLocale)
  const nextIndex = (currentIndex + 1) % locales.length
  const nextLocale = locales[nextIndex]

  return (
    <button
      onClick={() => switchLocale(nextLocale)}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
      title={`Switch to ${localeNames[nextLocale]}`}
    >
      <Globe size={14} />
      <span className="uppercase font-medium">{currentLocale}</span>
    </button>
  )
}
