import * as Sentry from '@sentry/nextjs'

/**
 * Capture an error with optional extra context.
 */
export function trackError(
  error: unknown,
  context?: Record<string, unknown>
): string | undefined {
  return Sentry.captureException(error, {
    extra: context,
  })
}

/**
 * Track a custom event/message.
 */
export function trackEvent(
  name: string,
  data?: Record<string, unknown>
): void {
  Sentry.captureMessage(name, {
    level: 'info',
    extra: data,
  })
}

/**
 * Set the current user context for all subsequent error reports.
 * Pass null to clear the user.
 */
export function setUser(
  user: { id: string; email?: string; name?: string } | null
): void {
  if (user) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.name,
    })
  } else {
    Sentry.setUser(null)
  }
}

/**
 * Add a breadcrumb for tracing user actions leading up to errors.
 */
export function addBreadcrumb(
  message: string,
  category?: string,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    message,
    category: category || 'app',
    level: 'info',
    data,
  })
}
