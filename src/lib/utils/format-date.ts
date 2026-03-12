/**
 * Locale-aware date formatting for Africa-first display.
 * Uses Intl.DateTimeFormat with the app's locale.
 * Default: dd MMM yyyy (e.g., "10 Feb 2026") — preferred in Africa.
 */

type DateStyle = 'short' | 'medium' | 'long' | 'full'

export function formatDate(
  date: string | Date | null | undefined,
  style: DateStyle = 'medium',
  locale?: string
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  const loc = locale || (typeof window !== 'undefined' ? document.documentElement.lang : '') || 'en-GB'

  const options: Record<DateStyle, Intl.DateTimeFormatOptions> = {
    short: { day: '2-digit', month: '2-digit', year: 'numeric' },
    medium: { day: 'numeric', month: 'short', year: 'numeric' },
    long: { day: 'numeric', month: 'long', year: 'numeric' },
    full: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' },
  }

  return new Intl.DateTimeFormat(loc, options[style]).format(d)
}

export function formatDateTime(
  date: string | Date | null | undefined,
  locale?: string
): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  const loc = locale || (typeof window !== 'undefined' ? document.documentElement.lang : '') || 'en-GB'

  return new Intl.DateTimeFormat(loc, {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(d)
}

export function formatRelative(date: string | Date | null | undefined): string {
  if (!date) return '—'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '—'

  const now = Date.now()
  const diff = now - d.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)
  const days = Math.floor(hours / 24)

  if (seconds < 60) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return formatDate(d, 'medium')
}
