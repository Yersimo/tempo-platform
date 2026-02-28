import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import { withSentryConfig } from '@sentry/nextjs'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
}

const sentryConfig = {
  // Sentry organization and project (set via env vars)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Only upload source maps when Sentry is configured
  silent: !process.env.SENTRY_AUTH_TOKEN,

  // Upload source maps for better error debugging
  widenClientFileUpload: true,

  // Hide source maps from client bundles
  hideSourceMaps: true,

  // Tree-shake Sentry logger to reduce bundle size
  disableLogger: true,

  // Automatically instrument API routes and server components
  automaticVercelMonitors: true,
}

// Apply plugins: first next-intl, then Sentry
const configWithIntl = withNextIntl(nextConfig)

export default withSentryConfig(configWithIntl, sentryConfig)
