'use client'

import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showReconnected, setShowReconnected] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)

    const handleOnline = () => {
      setIsOnline(true)
      if (wasOffline) {
        setShowReconnected(true)
        setTimeout(() => setShowReconnected(false), 3000)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setWasOffline(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [wasOffline])

  // Reconnected toast
  if (showReconnected) {
    return (
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[300] animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center gap-2 px-4 py-2.5 bg-green-600/90 backdrop-blur-sm text-white text-sm rounded-full shadow-lg">
          <Wifi size={14} />
          Back online
        </div>
      </div>
    )
  }

  // Offline banner
  if (!isOnline) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[300] bg-red-600/95 backdrop-blur-sm">
        <div className="flex items-center justify-center gap-2 py-2 text-white text-xs font-medium">
          <WifiOff size={13} />
          You&apos;re offline — some features may be limited
        </div>
      </div>
    )
  }

  return null
}
