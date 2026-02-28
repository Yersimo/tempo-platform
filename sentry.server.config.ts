// Sentry Server-Side Configuration
// This file configures Sentry for error monitoring on the server (API routes, SSR).
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Only enable when DSN is configured
  enabled: !!(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN),

  // Environment tag
  environment: process.env.NODE_ENV || 'development',

  // Attach server name for debugging multi-region deployments
  serverName: process.env.VERCEL_REGION || 'local',
})
