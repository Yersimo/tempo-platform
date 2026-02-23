export const locales = ['en', 'fr', 'pt', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'en'
export const localeNames: Record<Locale, string> = {
  en: 'English',
  fr: 'Francais',
  pt: 'Portugues',
  es: 'Espanol',
}
