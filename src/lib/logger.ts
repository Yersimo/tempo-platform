// Structured logging utility
// Provides consistent log format for monitoring and observability

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  service: string
  [key: string]: unknown
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  fatal: 4,
}

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info'

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= LOG_LEVELS[currentLevel]
}

function formatEntry(level: LogLevel, message: string, meta?: Record<string, unknown>): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: 'tempo-platform',
    ...meta,
  }
}

function emit(entry: LogEntry): void {
  const output = JSON.stringify(entry)
  switch (entry.level) {
    case 'error':
    case 'fatal':
      console.error(output)
      break
    case 'warn':
      console.warn(output)
      break
    default:
      console.log(output)
  }

  // If Sentry is configured, capture errors
  if ((entry.level === 'error' || entry.level === 'fatal') && typeof globalThis !== 'undefined') {
    captureToSentry(entry)
  }
}

// Sentry integration (lazy-loaded)
async function captureToSentry(entry: LogEntry): Promise<void> {
  const dsn = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN
  if (!dsn) return

  try {
    // Minimal Sentry capture via HTTP API (no SDK dependency)
    const projectId = dsn.split('/').pop()
    const key = dsn.match(/\/\/([^@]+)@/)?.[1]
    if (!projectId || !key) return

    const host = dsn.match(/@([^/]+)/)?.[1]
    if (!host) return

    const envelope = JSON.stringify({
      event_id: crypto.randomUUID().replace(/-/g, ''),
      sent_at: new Date().toISOString(),
      dsn,
    }) + '\n' +
    JSON.stringify({ type: 'event' }) + '\n' +
    JSON.stringify({
      level: entry.level === 'fatal' ? 'fatal' : 'error',
      message: { formatted: entry.message },
      timestamp: Date.now() / 1000,
      platform: 'node',
      server_name: 'tempo-platform',
      tags: { service: 'tempo-platform' },
      extra: entry,
    })

    await fetch(`https://${host}/api/${projectId}/envelope/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_key=${key}`,
      },
      body: envelope,
    }).catch(() => {}) // Fire and forget
  } catch {
    // Don't let Sentry errors crash the app
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('debug')) emit(formatEntry('debug', message, meta))
  },
  info(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('info')) emit(formatEntry('info', message, meta))
  },
  warn(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('warn')) emit(formatEntry('warn', message, meta))
  },
  error(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('error')) emit(formatEntry('error', message, meta))
  },
  fatal(message: string, meta?: Record<string, unknown>) {
    if (shouldLog('fatal')) emit(formatEntry('fatal', message, meta))
  },
}
