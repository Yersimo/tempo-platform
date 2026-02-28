'use client'

import { WifiOff, RefreshCw, Home } from 'lucide-react'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-[#0f1117] flex flex-col items-center justify-center p-6 text-center">
      {/* Brand mark */}
      <svg viewBox="0 0 80 100" fill="none" className="w-10 h-12 mb-8 opacity-40">
        <line x1="2" y1="3" x2="78" y2="3" stroke="#ea580c" strokeWidth="4" strokeLinecap="round" opacity=".18"/>
        <path d="M4,82 C14,78 28,68 42,50 C56,32 68,14 76,6" stroke="#fb923c" strokeWidth="12" strokeLinecap="round" opacity=".5"/>
        <path d="M4,96 C14,90 28,76 44,56 C58,38 70,20 78,10" stroke="#ea580c" strokeWidth="12" strokeLinecap="round" opacity="1"/>
      </svg>

      {/* Offline icon */}
      <div className="w-20 h-20 rounded-full bg-white/[0.04] border border-white/[0.06] flex items-center justify-center mb-6">
        <WifiOff size={36} className="text-orange-400/60" />
      </div>

      {/* Message */}
      <h1 className="text-2xl font-light text-white/90 tracking-tight mb-2">
        You&apos;re offline
      </h1>
      <p className="text-sm text-white/30 max-w-sm leading-relaxed mb-8">
        It looks like you&apos;ve lost your internet connection.
        Check your network settings and try again.
      </p>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 text-white text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
        >
          <RefreshCw size={15} />
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="flex items-center gap-2 px-5 py-2.5 bg-white/[0.06] text-white/50 text-sm rounded-lg border border-white/[0.08] hover:bg-white/[0.1] hover:text-white/70 transition-colors"
        >
          <Home size={15} />
          Dashboard
        </button>
      </div>

      {/* Status indicator */}
      <div className="mt-12 flex items-center gap-2 text-xs text-white/15">
        <div className="w-1.5 h-1.5 rounded-full bg-red-500/60 animate-pulse" />
        No network connection
      </div>
    </div>
  )
}
