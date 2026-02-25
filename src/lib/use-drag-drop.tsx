'use client'

import { useState, useCallback, useRef, type DragEvent, type ReactNode } from 'react'

// ─── Types ──────────────────────────────────────────────────────────

export interface DragItem {
  id: string
  type: string
  data: Record<string, unknown>
}

interface UseDragOptions {
  item: DragItem
  onDragStart?: (item: DragItem) => void
  onDragEnd?: (item: DragItem) => void
}

interface UseDropOptions {
  accept: string | string[]
  onDrop: (item: DragItem) => void
  onDragOver?: (item: DragItem) => void
  onDragLeave?: () => void
}

export interface DragHandlers {
  draggable: true
  onDragStart: (e: DragEvent) => void
  onDragEnd: (e: DragEvent) => void
}

export interface DropHandlers {
  onDragOver: (e: DragEvent) => void
  onDragEnter: (e: DragEvent) => void
  onDragLeave: (e: DragEvent) => void
  onDrop: (e: DragEvent) => void
}

// ─── Module-level drag state ────────────────────────────────────────

let currentDragItem: DragItem | null = null

export const DragDropManager = {
  setDragging: (item: DragItem | null) => {
    currentDragItem = item
  },
  getDragging: () => currentDragItem,
}

// ─── useDrag ────────────────────────────────────────────────────────

export function useDrag(options: UseDragOptions): {
  dragHandlers: DragHandlers
  isDragging: boolean
} {
  const { item, onDragStart, onDragEnd } = options
  const [isDragging, setIsDragging] = useState(false)

  const handleDragStart = useCallback(
    (e: DragEvent) => {
      e.dataTransfer.setData('application/json', JSON.stringify(item))
      e.dataTransfer.effectAllowed = 'move'

      // Set drag ghost opacity
      if (e.currentTarget instanceof HTMLElement) {
        const el = e.currentTarget
        requestAnimationFrame(() => {
          el.style.opacity = '0.5'
        })
      }

      DragDropManager.setDragging(item)
      setIsDragging(true)
      onDragStart?.(item)
    },
    [item, onDragStart],
  )

  const handleDragEnd = useCallback(
    (e: DragEvent) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '1'
      }
      DragDropManager.setDragging(null)
      setIsDragging(false)
      onDragEnd?.(item)
    },
    [item, onDragEnd],
  )

  return {
    dragHandlers: {
      draggable: true,
      onDragStart: handleDragStart,
      onDragEnd: handleDragEnd,
    },
    isDragging,
  }
}

// ─── useDrop ────────────────────────────────────────────────────────

export function useDrop(options: UseDropOptions): {
  dropHandlers: DropHandlers
  isOver: boolean
  canDrop: boolean
} {
  const { accept, onDrop, onDragOver, onDragLeave: onDragLeaveCallback } = options
  const [isOver, setIsOver] = useState(false)
  const [canDrop, setCanDrop] = useState(false)
  const enterCountRef = useRef(0)

  const acceptTypes = Array.isArray(accept) ? accept : [accept]

  const isAccepted = useCallback(
    (item: DragItem | null): boolean => {
      if (!item) return false
      return acceptTypes.includes(item.type)
    },
    [acceptTypes],
  )

  const parseDragItem = useCallback((e: DragEvent): DragItem | null => {
    try {
      const data = e.dataTransfer.getData('application/json')
      if (data) return JSON.parse(data) as DragItem
    } catch {
      // Fall back to module-level state
    }
    return DragDropManager.getDragging()
  }, [])

  const handleDragOver = useCallback(
    (e: DragEvent) => {
      const item = DragDropManager.getDragging()
      if (isAccepted(item)) {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        setCanDrop(true)
        if (item) onDragOver?.(item)
      }
    },
    [isAccepted, onDragOver],
  )

  const handleDragEnter = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      enterCountRef.current++
      const item = DragDropManager.getDragging()
      if (isAccepted(item)) {
        setIsOver(true)
        setCanDrop(true)
      }
    },
    [isAccepted],
  )

  const handleDragLeave = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      enterCountRef.current--
      if (enterCountRef.current <= 0) {
        enterCountRef.current = 0
        setIsOver(false)
        setCanDrop(false)
        onDragLeaveCallback?.()
      }
    },
    [onDragLeaveCallback],
  )

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault()
      enterCountRef.current = 0
      setIsOver(false)
      setCanDrop(false)

      const item = parseDragItem(e)
      if (item && isAccepted(item)) {
        onDrop(item)
      }
    },
    [parseDragItem, isAccepted, onDrop],
  )

  return {
    dropHandlers: {
      onDragOver: handleDragOver,
      onDragEnter: handleDragEnter,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
    isOver,
    canDrop,
  }
}

// ─── DropZoneIndicator ──────────────────────────────────────────────

interface DropZoneIndicatorProps {
  isOver: boolean
  canDrop: boolean
  children: ReactNode
  className?: string
}

export function DropZoneIndicator({
  isOver,
  canDrop,
  children,
  className = '',
}: DropZoneIndicatorProps) {
  const dropClasses = isOver && canDrop
    ? 'ring-2 ring-tempo-500 bg-tempo-600/5'
    : canDrop
      ? 'border-dashed border-2 border-tempo-300'
      : ''

  return (
    <div
      className={`transition-all duration-200 rounded-xl ${dropClasses} ${className}`}
    >
      {children}
    </div>
  )
}

// ─── Sortable helper for lists ──────────────────────────────────────

interface UseSortableOptions {
  items: { id: string }[]
  type: string
  onReorder: (fromIndex: number, toIndex: number) => void
}

export function useSortable(options: UseSortableOptions) {
  const { items, type, onReorder } = options
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const getItemHandlers = useCallback(
    (index: number) => {
      const item: DragItem = {
        id: items[index].id,
        type,
        data: { index },
      }

      return {
        draggable: true as const,
        onDragStart: (e: DragEvent) => {
          e.dataTransfer.setData('application/json', JSON.stringify(item))
          e.dataTransfer.effectAllowed = 'move'
          DragDropManager.setDragging(item)
          setDragIndex(index)
          if (e.currentTarget instanceof HTMLElement) {
            requestAnimationFrame(() => {
              (e.currentTarget as HTMLElement).style.opacity = '0.4'
            })
          }
        },
        onDragEnd: (e: DragEvent) => {
          if (e.currentTarget instanceof HTMLElement) {
            e.currentTarget.style.opacity = '1'
          }
          DragDropManager.setDragging(null)
          setDragIndex(null)
          setOverIndex(null)
        },
        onDragOver: (e: DragEvent) => {
          e.preventDefault()
          e.dataTransfer.dropEffect = 'move'
          setOverIndex(index)
        },
        onDrop: (e: DragEvent) => {
          e.preventDefault()
          const data = DragDropManager.getDragging()
          if (data && typeof data.data.index === 'number') {
            onReorder(data.data.index as number, index)
          }
          setDragIndex(null)
          setOverIndex(null)
        },
      }
    },
    [items, type, onReorder],
  )

  return {
    getItemHandlers,
    dragIndex,
    overIndex,
    isDragging: dragIndex !== null,
  }
}
