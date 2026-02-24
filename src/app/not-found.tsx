import Link from 'next/link'
import { FileQuestion } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-2xl bg-tempo-50 flex items-center justify-center mx-auto mb-6">
          <FileQuestion size={40} className="text-tempo-600" />
        </div>
        <h1 className="text-6xl font-light text-t1 tracking-tight mb-2">404</h1>
        <h2 className="text-xl font-semibold text-t1 mb-3">Page Not Found</h2>
        <p className="text-sm text-t3 mb-8 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Check the URL and try again, or go back to the dashboard.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-tempo-600 hover:bg-tempo-700 text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-canvas border border-border hover:bg-surface text-t1 rounded-lg text-sm font-medium transition-colors"
          >
            Home
          </Link>
        </div>
      </div>
    </div>
  )
}
