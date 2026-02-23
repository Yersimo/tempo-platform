'use client'

import { useState, useCallback } from 'react'

interface UploadResult {
  url: string
  key: string
  name: string
  size: number
  type: string
}

interface UseUploadOptions {
  entityType?: string
  entityId?: string
  onSuccess?: (result: UploadResult) => void
  onError?: (error: string) => void
}

interface UseUploadReturn {
  upload: (file: File) => Promise<UploadResult | null>
  isUploading: boolean
  progress: number
  error: string | null
  lastResult: UploadResult | null
}

export function useUpload(options: UseUploadOptions = {}): UseUploadReturn {
  const { entityType, entityId, onSuccess, onError } = options
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastResult, setLastResult] = useState<UploadResult | null>(null)

  const upload = useCallback(async (file: File): Promise<UploadResult | null> => {
    setIsUploading(true)
    setProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      if (entityType) formData.append('entityType', entityType)
      if (entityId) formData.append('entityId', entityId)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || 'Upload failed')
      }

      const result: UploadResult = await res.json()
      setProgress(100)
      setLastResult(result)
      onSuccess?.(result)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed'
      setError(msg)
      onError?.(msg)
      return null
    } finally {
      setIsUploading(false)
    }
  }, [entityType, entityId, onSuccess, onError])

  return { upload, isUploading, progress, error, lastResult }
}
