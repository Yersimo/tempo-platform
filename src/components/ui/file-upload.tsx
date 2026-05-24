'use client'

import { useRef, useState, type DragEvent } from 'react'
import { Upload, X, FileText, Image, File as FileIcon, CheckCircle } from 'lucide-react'
import { useUpload } from '@/lib/use-upload'

interface FileUploadProps {
  entityType?: string
  entityId?: string
  accept?: string
  maxSizeMB?: number
  onUploaded?: (result: { url: string; name: string; size: number; type: string }) => void
  className?: string
  compact?: boolean
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return Image
  if (type.includes('pdf') || type.includes('word') || type.includes('document')) return FileText
  return FileIcon
}

export function FileUpload({
  entityType,
  entityId,
  accept,
  maxSizeMB = 10,
  onUploaded,
  className = '',
  compact = false,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const { upload, isUploading, progress, error, lastResult } = useUpload({
    entityType,
    entityId,
    onSuccess: onUploaded,
  })

  const handleFile = (file: File) => {
    if (file.size > maxSizeMB * 1024 * 1024) {
      return
    }
    upload(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleClick = () => inputRef.current?.click()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset input so same file can be re-selected
    if (inputRef.current) inputRef.current.value = ''
  }

  if (compact) {
    return (
      <div className={className}>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={handleClick}
          disabled={isUploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-t2 bg-fog rounded-[var(--radius-button)] hover:bg-birch hover:text-t1 border border-border transition-colors disabled:opacity-50"
        >
          {isUploading ? (
            <>
              <div className="w-3 h-3 border-2 border-tempo-700 border-t-transparent rounded-full animate-spin" />
              {progress}%
            </>
          ) : lastResult ? (
            <>
              <CheckCircle size={12} className="text-success" />
              Uploaded
            </>
          ) : (
            <>
              <Upload size={12} />
              Upload
            </>
          )}
        </button>
        {error && <p className="text-[10px] text-red-600 mt-0.5">{error}</p>}
      </div>
    )
  }

  const IconComponent = lastResult ? getFileIcon(lastResult.type) : Upload

  return (
    <div className={className}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`
          relative flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-[var(--radius-card)] cursor-pointer transition-all
          ${isDragging
            ? 'border-tempo-600 bg-tempo-50'
            : 'border-border bg-birch/35 hover:border-stone hover:bg-birch/60'
          }
          ${isUploading ? 'pointer-events-none opacity-70' : ''}
        `}
      >
        {isUploading ? (
          <>
            <div className="w-8 h-8 border-3 border-tempo-700 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-t2">Uploading... {progress}%</p>
            <div className="w-full max-w-48 h-1.5 bg-stone/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-tempo-700 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </>
        ) : lastResult ? (
          <>
            <IconComponent size={24} className="text-success" />
            <div className="text-center">
              <p className="text-sm font-medium text-t1">{lastResult.name}</p>
              <p className="text-xs text-t3">{formatSize(lastResult.size)}</p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                // Clear to allow re-upload
                handleClick()
              }}
              className="text-xs text-tempo-700 hover:text-tempo-900 hover:underline"
            >
              Replace file
            </button>
          </>
        ) : (
          <>
            <Upload size={24} className="text-t3" />
            <div className="text-center">
              <p className="text-sm text-t2">
                <span className="font-medium text-tempo-700">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-t3 mt-1">
                PDF, images, documents up to {maxSizeMB}MB
              </p>
            </div>
          </>
        )}
      </div>
      {error && (
        <div className="flex items-center gap-1 mt-2 text-xs text-red-600">
          <X size={12} />
          {error}
        </div>
      )}
    </div>
  )
}
