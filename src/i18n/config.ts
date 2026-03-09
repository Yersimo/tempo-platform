export const locales = ['en', 'fr', 'pt', 'es', 'de', 'sw', 'ar', 'ha', 'am', 'zh', 'hi', 'ja', 'ko', 'ru', 'it', 'nl', 'pl', 'tr', 'th', 'vi', 'id', 'yo', 'zu'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Francais',
  pt: 'Portugues',
  es: 'Espanol',
  de: 'Deutsch',
  sw: 'Kiswahili',
  ar: 'العربية',
  ha: 'Hausa',
  am: 'አማርኛ',
  zh: '中文',
  hi: 'हिन्दी',
  ja: '日本語',
  ko: '한국어',
  ru: 'Русский',
  it: 'Italiano',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  th: 'ภาษาไทย',
  vi: 'Tiếng Việt',
  id: 'Bahasa Indonesia',
  yo: 'Yorùbá',
  zu: 'isiZulu',
}
export const localeDirections: Partial<Record<Locale, 'rtl'>> = {
  ar: 'rtl',
}
