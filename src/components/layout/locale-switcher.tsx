'use client'

import { useLocale } from 'next-intl'
import { Globe } from 'lucide-react'
import { locales, localeNames, type Locale } from '@/i18n/config'

export function LocaleSwitcher() {
  const currentLocale = useLocale()

  const switchLocale = (locale: Locale) => {
    document.cookie = `tempo_locale=${locale};path=/;max-age=${60 * 60 * 24 * 365}`
    window.location.reload()
  }

  const otherLocale = locales.find(l => l !== currentLocale) || locales[0]

  return (
    <button
      onClick={() => switchLocale(otherLocale)}
      className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
      title={`Switch to ${localeNames[otherLocale]}`}
    >
      <Globe size={14} />
      <span className="uppercase font-medium">{currentLocale}</span>
    </button>
  )
}
