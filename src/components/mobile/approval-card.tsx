'use client'

import { useState, useRef, useCallback } from 'react'
import { Check, X, ChevronDown, ChevronUp, Clock, DollarSign, Calendar, User } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

export interface ApprovalItem {
  id: string
  type: 'leave' | 'expense' | 'timesheet' | 'payroll'
  requester: {
    name: string
    avatar_url?: string | null
    department?: string
  }
  title: string
  subtitle: string
  amount?: number
  currency?: string
  dates?: { start: string; end: string }
  submitted: string
  details?: string
  status?: string
}

interface ApprovalCardProps {
  item: ApprovalItem
  onApprove: (id: string, comment?: string) => void
  onReject: (id: string, comment?: string) => void
}

const TYPE_COLORS: Record<string, string> = {
  leave: 'bg-blue-500/15 text-blue-400',
  expense: 'bg-emerald-500/15 text-emerald-400',
  timesheet: 'bg-purple-500/15 text-purple-400',
  payroll: 'bg-orange-500/15 text-orange-400',
}

const TYPE_LABELS: Record<string, string> = {
  leave: 'Leave Request',
  expense: 'Expense Report',
  timesheet: 'Timesheet',
  payroll: 'Payroll',
}

export function ApprovalCard({ item, onApprove, onReject }: ApprovalCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [comment, setComment] = useState('')
  const [swiping, setSwiping] = useState(false)
  const [swipeX, setSwipeX] = useState(0)
  const [actionTaken, setActionTaken] = useState<'approved' | 'rejected' | null>(null)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const isHorizontalSwipe = useRef(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const SWIPE_THRESHOLD = 100

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
    isHorizontalSwipe.current = false
    setSwiping(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!swiping) return
    const deltaX = e.touches[0].clientX - touchStartX.current
    const deltaY = e.touches[0].clientY - touchStartY.current

    // Determine swipe direction on first significant movement
    if (!isHorizontalSwipe.current && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) return
    if (!isHorizontalSwipe.current) {
      isHorizontalSwipe.current = Math.abs(deltaX) > Math.abs(deltaY)
      if (!isHorizontalSwipe.current) {
        setSwiping(false)
        return
      }
    }

    e.preventDefault()
    // Dampen the swipe beyond threshold
    const dampened = Math.abs(deltaX) > SWIPE_THRESHOLD
      ? SWIPE_THRESHOLD + (deltaX > 0 ? 1 : -1) * Math.sqrt(Math.abs(deltaX) - SWIPE_THRESHOLD) * 5
      : deltaX
    setSwipeX(dampened)
  }, [swiping])

  const handleTouchEnd = useCallback(() => {
    setSwiping(false)
    if (swipeX > SWIPE_THRESHOLD) {
      setActionTaken('approved')
      setTimeout(() => onApprove(item.id, comment || undefined), 300)
    } else if (swipeX < -SWIPE_THRESHOLD) {
      setActionTaken('rejected')
      setTimeout(() => onReject(item.id, comment || undefined), 300)
    }
    setSwipeX(0)
  }, [swipeX, item.id, comment, onApprove, onReject])

  if (actionTaken) {
    return (
      <div className={cn(
        'rounded-2xl p-4 mb-3 flex items-center justify-center gap-2 text-sm font-medium transition-all duration-300',
        actionTaken === 'approved'
          ? 'bg-green-500/10 text-green-400 animate-in slide-in-from-left-4'
          : 'bg-red-500/10 text-red-400 animate-in slide-in-from-right-4'
      )}>
        {actionTaken === 'approved' ? <Check size={18} /> : <X size={18} />}
        {actionTaken === 'approved' ? 'Approved' : 'Rejected'}
      </div>
    )
  }

  const formatAmount = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount / 100)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="relative mb-3 overflow-hidden rounded-2xl">
      {/* Swipe backgrounds */}
      <div className="absolute inset-0 flex">
        <div className={cn(
          'flex-1 flex items-center pl-6 rounded-l-2xl transition-opacity',
          swipeX > 30 ? 'bg-green-600/30 opacity-100' : 'bg-green-600/10 opacity-0'
        )}>
          <Check size={24} className="text-green-400" />
          <span className="ml-2 text-sm font-medium text-green-400">Approve</span>
        </div>
        <div className={cn(
          'flex-1 flex items-center justify-end pr-6 rounded-r-2xl transition-opacity',
          swipeX < -30 ? 'bg-red-600/30 opacity-100' : 'bg-red-600/10 opacity-0'
        )}>
          <span className="mr-2 text-sm font-medium text-red-400">Reject</span>
          <X size={24} className="text-red-400" />
        </div>
      </div>

      {/* Card content */}
      <div
        ref={cardRef}
        className="relative bg-[#1a1d27] border border-white/[0.06] rounded-2xl touch-pan-y"
        style={{
          transform: `translateX(${swipeX}px)`,
          transition: swiping ? 'none' : 'transform 0.3s ease-out',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4">
          {/* Header row */}
          <div className="flex items-start gap-3 mb-3">
            <Avatar name={item.requester.name} src={item.requester.avatar_url} size="md" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold text-white truncate">{item.requester.name}</span>
                <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', TYPE_COLORS[item.type])}>
                  {TYPE_LABELS[item.type]}
                </span>
              </div>
              <p className="text-xs text-white/40 truncate">{item.title}</p>
            </div>
            <span className="text-[10px] text-white/25 whitespace-nowrap">{timeAgo(item.submitted)}</span>
          </div>

          {/* Details row */}
          <div className="flex items-center gap-4 text-xs text-white/50 mb-3">
            {item.amount != null && (
              <span className="flex items-center gap-1">
                <DollarSign size={12} className="text-white/30" />
                {formatAmount(item.amount, item.currency)}
              </span>
            )}
            {item.dates && (
              <span className="flex items-center gap-1">
                <Calendar size={12} className="text-white/30" />
                {formatDate(item.dates.start)} - {formatDate(item.dates.end)}
              </span>
            )}
            {item.subtitle && (
              <span className="flex items-center gap-1">
                <Clock size={12} className="text-white/30" />
                {item.subtitle}
              </span>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => onApprove(item.id, comment || undefined)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600/20 text-green-400 text-sm font-medium rounded-xl active:bg-green-600/30 transition-colors min-h-[44px]"
            >
              <Check size={16} />
              Approve
            </button>
            <button
              onClick={() => onReject(item.id, comment || undefined)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-600/15 text-red-400 text-sm font-medium rounded-xl active:bg-red-600/25 transition-colors min-h-[44px]"
            >
              <X size={16} />
              Reject
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="px-3 py-2.5 bg-white/[0.04] text-white/40 rounded-xl active:bg-white/[0.08] transition-colors min-h-[44px]"
            >
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {/* Expanded details */}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-white/[0.06] animate-in slide-in-from-top-2 duration-200">
              {item.details && (
                <p className="text-xs text-white/40 mb-3">{item.details}</p>
              )}
              {item.requester.department && (
                <div className="flex items-center gap-1 text-xs text-white/30 mb-3">
                  <User size={12} />
                  {item.requester.department}
                </div>
              )}
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment (optional)..."
                className="w-full bg-white/[0.04] border border-white/[0.06] rounded-xl p-3 text-xs text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-orange-500/30 min-h-[44px]"
                rows={2}
              />
            </div>
          )}
        </div>

        {/* Swipe hint indicator */}
        <div className="flex justify-center pb-2">
          <div className="w-8 h-1 rounded-full bg-white/[0.06]" />
        </div>
      </div>
    </div>
  )
}
