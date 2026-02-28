'use client'

import { useState, useEffect } from 'react'
import { X, Download, Smartphone, Share, Plus } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true)
      return
    }

    // Check if previously dismissed within last 7 days
    const dismissed = localStorage.getItem('tempo-pwa-dismissed')
    if (dismissed) {
      const dismissedAt = parseInt(dismissed, 10)
      if (Date.now() - dismissedAt < 7 * 24 * 60 * 60 * 1000) return
    }

    // Listen for Chrome/Edge/Android install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Show after a 3-second delay so user engages with the app first
      setTimeout(() => setShowBanner(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handler)

    // For iOS Safari — detect and show manual guide
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent)
    if (isIOS && isSafari) {
      setTimeout(() => {
        setShowIOSGuide(true)
        setShowBanner(true)
      }, 5000)
    }

    // Detect successful install
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true)
      setShowBanner(false)
      setDeferredPrompt(null)
    })

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    localStorage.setItem('tempo-pwa-dismissed', Date.now().toString())
  }

  if (isInstalled || !showBanner) return null

  // iOS Safari guide
  if (showIOSGuide) {
    return (
      <div className="fixed bottom-20 left-4 right-4 z-[200] lg:left-auto lg:right-6 lg:bottom-6 lg:w-[360px] animate-in slide-in-from-bottom-4 duration-500">
        <div className="bg-[#161821] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-600/15 flex items-center justify-center">
                <Smartphone size={20} className="text-orange-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Install Tempo</p>
                <p className="text-xs text-white/30">Add to your home screen</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="text-white/20 hover:text-white/50 transition-colors p-1"
            >
              <X size={16} />
            </button>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-3 text-xs text-white/50">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-semibold text-orange-400 shrink-0">1</div>
              <span>Tap the <Share size={13} className="inline text-blue-400 mx-0.5" /> Share button in Safari</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-semibold text-orange-400 shrink-0">2</div>
              <span>Scroll down and tap <Plus size={13} className="inline text-white/60 mx-0.5" /> <strong className="text-white/70">Add to Home Screen</strong></span>
            </div>
            <div className="flex items-center gap-3 text-xs text-white/50">
              <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-semibold text-orange-400 shrink-0">3</div>
              <span>Tap <strong className="text-white/70">Add</strong> to install Tempo</span>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="w-full text-center text-xs text-white/20 hover:text-white/40 transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    )
  }

  // Chrome / Android / Edge install prompt
  return (
    <div className="fixed bottom-20 left-4 right-4 z-[200] lg:left-auto lg:right-6 lg:bottom-6 lg:w-[360px] animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-[#161821] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/40 p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600/15 flex items-center justify-center">
              <svg viewBox="0 0 80 100" fill="none" className="w-5 h-6">
                <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5"/>
                <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" opacity="1"/>
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Install Tempo</p>
              <p className="text-xs text-white/30">Quick access from your home screen</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-white/20 hover:text-white/50 transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-2 text-xs text-white/30 mb-4">
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500/60" />
            Works offline
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500/60" />
            Push notifications
          </span>
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.04]">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-500/60" />
            Fast
          </span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleInstall}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download size={15} />
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-2.5 text-white/30 text-sm rounded-lg border border-white/[0.08] hover:bg-white/[0.04] hover:text-white/50 transition-colors"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  )
}
