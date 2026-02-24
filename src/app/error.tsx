'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertOctagon, RefreshCw } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-6">
          <AlertOctagon size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold text-t1 mb-3">Something Went Wrong</h1>
        <p className="text-sm text-t3 mb-8 leading-relaxed">
          An unexpected error occurred. Our team has been notified.
          Please try again or go back to the dashboard.
        </p>
        {error.digest && (
          <p className="text-xs text-t3 font-mono bg-surface rounded-lg px-3 py-2 mb-6">
            Error ID: {error.digest}
          </p>
        )}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={reset}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-tempo-600 hover:bg-tempo-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            <RefreshCw size={14} /> Try Again
          </button>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-canvas border border-border hover:bg-surface text-t1 rounded-lg text-sm font-medium transition-colors"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
