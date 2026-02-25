export const locales = ['en', 'fr', 'pt', 'es', 'de', 'sw', 'ar', 'ha', 'am'] as const
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
}
export const localeDirections: Partial<Record<Locale, 'rtl'>> = {
  ar: 'rtl',
}
