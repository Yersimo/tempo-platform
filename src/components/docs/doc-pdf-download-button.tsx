'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import { Download, Loader2 } from 'lucide-react'

interface DocPdfDownloadButtonProps {
  slug: string
  title: string
  className?: string
}

export function DocPdfDownloadButton({
  slug,
  title,
  className,
}: DocPdfDownloadButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handleDownload() {
    if (loading) return
    setLoading(true)

    try {
      const res = await fetch(`/api/help/pdf?module=${encodeURIComponent(slug)}`)
      if (!res.ok) throw new Error('Failed to generate PDF')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `${slug}-guide.pdf`
      document.body.appendChild(anchor)
      anchor.click()

      // Cleanup
      setTimeout(() => {
        URL.revokeObjectURL(url)
        document.body.removeChild(anchor)
      }, 100)
    } catch {
      // Silently fail -- could add toast notification here
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className={cn(
        'inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-[var(--radius-button)]',
        'border border-divider text-t2 hover:text-t1 hover:bg-canvas',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-tempo-600/20',
        'disabled:opacity-50 disabled:pointer-events-none',
        className
      )}
      title={`Download ${title} as PDF`}
    >
      {loading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {loading ? 'Generating...' : 'Download PDF'}
    </button>
  )
}
