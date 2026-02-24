import { getRequestConfig } from 'next-intl/server'
import { cookies } from 'next/headers'
import { defaultLocale, locales, type Locale } from './config'

export default getRequestConfig(async () => {
  const cookieStore = await cookies()
  const localeCookie = cookieStore.get('tempo_locale')?.value
  const locale: Locale = locales.includes(localeCookie as Locale)
    ? (localeCookie as Locale)
    : defaultLocale

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
    onError(error) {
      // Log missing translations in dev, silently ignore in prod
      if (process.env.NODE_ENV === 'development') {
        console.warn(error.message)
      }
    },
    getMessageFallback({ namespace, key }) {
      // Return the key itself as fallback instead of crashing
      return namespace ? `${namespace}.${key}` : key
    },
  }
})
