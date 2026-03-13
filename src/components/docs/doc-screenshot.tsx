'use client'

import { cn } from '@/lib/utils/cn'
import { Camera } from 'lucide-react'
import Image from 'next/image'

interface DocScreenshotProps {
  screenshotKey?: string
  alt: string
  className?: string
}

export function DocScreenshot({ screenshotKey, alt, className }: DocScreenshotProps) {
  if (screenshotKey) {
    return (
      <div
        className={cn(
          'rounded-lg border border-border overflow-hidden bg-canvas',
          className
        )}
      >
        <Image
          src={`/docs/screenshots/${screenshotKey}.png`}
          alt={alt}
          width={800}
          height={450}
          className="w-full h-auto"
        />
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-canvas flex flex-col items-center justify-center py-10 gap-2',
        className
      )}
    >
      <Camera size={24} className="text-t3" />
      <p className="text-xs text-t3">Screenshot coming soon</p>
    </div>
  )
}
