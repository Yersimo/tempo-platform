'use client'

import React, { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser, Undo2, Check, X, PenTool } from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────

interface Point {
  x: number
  y: number
}

interface SignaturePadProps {
  width?: number
  height?: number
  penColor?: string
  penWidth?: number
  onSave?: (dataUrl: string) => void
  onClear?: () => void
  className?: string
}

interface SignatureModalProps {
  isOpen: boolean
  onClose: () => void
  onSign: (signatureDataUrl: string) => void
  signerName: string
  documentTitle: string
}

// ─── SignaturePad Component ─────────────────────────────────────────

export function SignaturePad({
  width = 500,
  height = 200,
  penColor = '#111118',
  penWidth = 2.5,
  onSave,
  onClear,
  className = '',
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [strokes, setStrokes] = useState<Point[][]>([])
  const [currentStroke, setCurrentStroke] = useState<Point[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [isEmpty, setIsEmpty] = useState(true)
  const [canvasSize, setCanvasSize] = useState({ width, height })

  // Responsive sizing
  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = Math.min(entry.contentRect.width, width)
        setCanvasSize({ width: w, height })
      }
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [width, height])

  // Redraw everything
  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw "sign here" guide line
    ctx.save()
    ctx.setLineDash([4, 4])
    ctx.strokeStyle = '#d4d4d8'
    ctx.lineWidth = 1
    const guideY = canvas.height * 0.72
    ctx.beginPath()
    ctx.moveTo(20, guideY)
    ctx.lineTo(canvas.width - 20, guideY)
    ctx.stroke()
    ctx.fillStyle = '#a1a1aa'
    ctx.font = '10px system-ui, sans-serif'
    ctx.fillText('Sign here', 20, guideY + 16)
    ctx.restore()

    // Draw all strokes with smooth curves
    const allStrokes = [...strokes, ...(currentStroke.length > 0 ? [currentStroke] : [])]

    for (const stroke of allStrokes) {
      if (stroke.length < 2) continue

      ctx.beginPath()
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      ctx.moveTo(stroke[0].x, stroke[0].y)

      if (stroke.length === 2) {
        ctx.lineTo(stroke[1].x, stroke[1].y)
      } else {
        // Smooth curve using midpoint quadratic bezier
        for (let i = 1; i < stroke.length - 1; i++) {
          const midX = (stroke[i].x + stroke[i + 1].x) / 2
          const midY = (stroke[i].y + stroke[i + 1].y) / 2
          ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY)
        }
        // Last point
        const last = stroke[stroke.length - 1]
        const secondLast = stroke[stroke.length - 2]
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y)
      }

      ctx.stroke()
    }
  }, [strokes, currentStroke, penColor, penWidth])

  useEffect(() => {
    redraw()
  }, [redraw, canvasSize])

  // Get point from event
  const getPoint = useCallback((e: React.MouseEvent | React.TouchEvent): Point => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    if ('touches' in e) {
      const touch = e.touches[0]
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }, [])

  const handleStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const point = getPoint(e)
    setIsDrawing(true)
    setCurrentStroke([point])
    setIsEmpty(false)
  }, [getPoint])

  const handleMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    e.preventDefault()
    const point = getPoint(e)
    setCurrentStroke(prev => [...prev, point])
  }, [isDrawing, getPoint])

  const handleEnd = useCallback(() => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentStroke.length > 0) {
      setStrokes(prev => [...prev, currentStroke])
      setCurrentStroke([])
    }
  }, [isDrawing, currentStroke])

  const handleUndo = useCallback(() => {
    setStrokes(prev => {
      const next = prev.slice(0, -1)
      if (next.length === 0) setIsEmpty(true)
      return next
    })
  }, [])

  const handleClear = useCallback(() => {
    setStrokes([])
    setCurrentStroke([])
    setIsEmpty(true)
    onClear?.()
  }, [onClear])

  const handleSave = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || isEmpty) return
    // Create clean export (without guide line)
    const exportCanvas = document.createElement('canvas')
    exportCanvas.width = canvas.width
    exportCanvas.height = canvas.height
    const ctx = exportCanvas.getContext('2d')
    if (!ctx) return

    // Transparent background
    ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height)

    // Redraw strokes only
    for (const stroke of strokes) {
      if (stroke.length < 2) continue
      ctx.beginPath()
      ctx.strokeStyle = penColor
      ctx.lineWidth = penWidth
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.moveTo(stroke[0].x, stroke[0].y)
      for (let i = 1; i < stroke.length - 1; i++) {
        const midX = (stroke[i].x + stroke[i + 1].x) / 2
        const midY = (stroke[i].y + stroke[i + 1].y) / 2
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, midX, midY)
      }
      if (stroke.length >= 2) {
        const last = stroke[stroke.length - 1]
        const secondLast = stroke[stroke.length - 2]
        ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y)
      }
      ctx.stroke()
    }

    const dataUrl = exportCanvas.toDataURL('image/png')
    onSave?.(dataUrl)
  }, [isEmpty, strokes, penColor, penWidth, onSave])

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      <div className="border-2 border-dashed border-border rounded-xl overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: '100%', height: canvasSize.height, touchAction: 'none' }}
          className="cursor-crosshair"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        />
      </div>
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          <button
            onClick={handleUndo}
            disabled={strokes.length === 0}
            className="flex items-center gap-1 text-xs text-t3 hover:text-t1 disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg hover:bg-canvas transition-colors"
            title="Undo last stroke"
          >
            <Undo2 size={13} />
            Undo
          </button>
          <button
            onClick={handleClear}
            disabled={isEmpty}
            className="flex items-center gap-1 text-xs text-t3 hover:text-error disabled:opacity-30 disabled:cursor-not-allowed px-2 py-1.5 rounded-lg hover:bg-canvas transition-colors"
            title="Clear signature"
          >
            <Eraser size={13} />
            Clear
          </button>
        </div>
        {!isEmpty && (
          <span className="text-[0.65rem] text-success flex items-center gap-1">
            <PenTool size={10} />
            Signature captured
          </span>
        )}
      </div>
    </div>
  )
}

// ─── SignatureModal Component ───────────────────────────────────────

export function SignatureModal({
  isOpen,
  onClose,
  onSign,
  signerName,
  documentTitle,
}: SignatureModalProps) {
  const [signatureData, setSignatureData] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSign = () => {
    if (signatureData) {
      onSign(signatureData)
      setSignatureData(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl w-full max-w-lg mx-4 overflow-hidden" style={{ boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
          <div>
            <h2 className="text-base font-semibold text-t1">Sign Document</h2>
            <p className="text-xs text-t3 mt-0.5">{documentTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-t3 hover:text-t1 p-1.5 rounded-lg hover:bg-canvas transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-canvas rounded-lg">
            <span className="text-xs text-t3">Signing as:</span>
            <span className="text-xs font-medium text-t1">{signerName}</span>
          </div>

          <SignaturePad
            onSave={setSignatureData}
            onClear={() => setSignatureData(null)}
          />

          <p className="text-[0.65rem] text-t3 mt-3 leading-relaxed">
            By signing, you agree to the terms outlined in this document. This electronic
            signature is legally binding and has the same effect as a handwritten signature.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-divider bg-canvas/50">
          <button
            onClick={onClose}
            className="text-t3 hover:text-t1 px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSign}
            disabled={!signatureData}
            className="flex items-center gap-2 bg-tempo-600 hover:bg-tempo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Check size={14} />
            Sign & Accept
          </button>
        </div>
      </div>
    </div>
  )
}
