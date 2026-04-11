import type { Metadata, Viewport } from 'next'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'
import { CookieConsent } from '@/components/cookie-consent'
import { PWAInstallPrompt } from '@/components/pwa/install-prompt'
import { NetworkStatus } from '@/components/pwa/network-status'
import './globals.css'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#004D40' },
    { media: '(prefers-color-scheme: dark)', color: '#0f1117' },
  ],
}

export const metadata: Metadata = {
  title: 'tempo - People & Performance Platform',
  description: 'The unified workforce platform. Performance, compensation, learning, engagement, mentoring, analytics, payroll, and more. One platform, zero silos.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32' },
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-64.png', sizes: '64x64', type: 'image/png' },
      { url: '/icon-128.png', sizes: '128x128', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180' },
    ],
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Tempo',
    startupImage: [
      { url: '/icon-512.png' },
    ],
  },
  openGraph: {
    title: 'Tempo - Unified Workforce Platform',
    description: 'Performance, compensation, learning, engagement, mentoring, analytics. One platform, zero silos.',
    images: [{ url: '/favicons/og-image.png', width: 1200, height: 630 }],
    type: 'website',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale}>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,200;0,300;0,400;0,500;0,600;0,700;0,800;1,300;1,400;1,500&display=swap"
          rel="stylesheet"
        />
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        {/* PWA Service Worker Registration */}
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', function() {
              fetch('/sw.js', { method: 'HEAD' }).then(function(res) {
                if (res.ok && !res.redirected) {
                  navigator.serviceWorker.register('/sw.js', { scope: '/' })
                    .then(function(reg) {
                      setInterval(function() { reg.update(); }, 60 * 60 * 1000);
                    })
                    .catch(function() {});
                }
              }).catch(function() {});
            });
          }
        `}} />
      </head>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          <NetworkStatus />
          {children}
          <PWAInstallPrompt />
          <CookieConsent />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
