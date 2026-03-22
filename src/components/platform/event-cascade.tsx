'use client'

import { useState } from 'react'
import {
  UserPlus, UserMinus, TrendingUp, DollarSign, Star, Receipt, Globe,
  Zap, Check, X, Loader2, ChevronDown, ChevronUp,
} from 'lucide-react'
import { useEventCascade, type CascadeInstance, type ActionStatus } from '@/lib/event-cascade-context'

// ---------------------------------------------------------------------------
// Icon resolver
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  UserPlus, UserMinus, TrendingUp, DollarSign, Star, Receipt, Globe,
}

function EventIcon({ name, size = 16, className }: { name: string; size?: number; className?: string }) {
  const Icon = ICON_MAP[name] || Zap
  return <Icon size={size} className={className} />
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const COLOR_MAP: Record<string, { bg: string; border: string; text: string; accent: string; headerBg: string }> = {
  green:  { bg: 'bg-white',   border: 'border-emerald-200', text: 'text-emerald-700', accent: 'text-emerald-500', headerBg: 'bg-emerald-50' },
  red:    { bg: 'bg-white',   border: 'border-red-200',     text: 'text-red-700',     accent: 'text-red-500',     headerBg: 'bg-red-50' },
  blue:   { bg: 'bg-white',   border: 'border-blue-200',    text: 'text-blue-700',    accent: 'text-blue-500',    headerBg: 'bg-blue-50' },
  amber:  { bg: 'bg-white',   border: 'border-amber-200',   text: 'text-amber-700',   accent: 'text-amber-500',   headerBg: 'bg-amber-50' },
  orange: { bg: 'bg-white',   border: 'border-orange-200',  text: 'text-orange-700',  accent: 'text-orange-500',  headerBg: 'bg-orange-50' },
  purple: { bg: 'bg-white',   border: 'border-purple-200',  text: 'text-purple-700',  accent: 'text-purple-500',  headerBg: 'bg-purple-50' },
}

// ---------------------------------------------------------------------------
// Status icon per action step
// ---------------------------------------------------------------------------

function StatusIcon({ status }: { status: ActionStatus }) {
  switch (status) {
    case 'pending':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-gray-400">
          <span className="h-1.5 w-1.5 rounded-full bg-gray-300" />
        </span>
      )
    case 'running':
      return (
        <span className="flex h-5 w-5 items-center justify-center">
          <Loader2 size={16} className="text-amber-500 animate-spin" />
        </span>
      )
    case 'completed':
      return (
        <span
          className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-emerald-600"
          style={{ animation: 'cascade-pop 0.25s ease-out' }}
        >
          <Check size={12} strokeWidth={3} />
        </span>
      )
    case 'failed':
      return (
        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-red-600">
          <X size={12} strokeWidth={3} />
        </span>
      )
  }
}

// ---------------------------------------------------------------------------
// Single Cascade Panel
// ---------------------------------------------------------------------------

function CascadePanel({ cascade, index }: { cascade: CascadeInstance; index: number }) {
  const { dismissCascade } = useEventCascade()
  const [expanded, setExpanded] = useState(true)
  const colors = COLOR_MAP[cascade.color] || COLOR_MAP.green

  const completedCount = cascade.actions.filter(a => a.status === 'completed').length
  const totalCount = cascade.actions.length
  const allDone = completedCount === totalCount
  const elapsed = cascade.completedAt
    ? ((cascade.completedAt - cascade.startedAt) / 1000).toFixed(1)
    : null

  const contextStr = cascade.context.employeeName
    ? ` - ${cascade.context.employeeName}`
    : ''

  return (
    <div
      className={`
        ${colors.bg} ${colors.border} border rounded-xl shadow-lg overflow-hidden
        w-[360px] max-w-[calc(100vw-2rem)]
        ${cascade.dismissed ? 'animate-cascade-out' : 'animate-cascade-in'}
      `}
      style={{
        marginBottom: index > 0 ? '0.5rem' : 0,
      }}
    >
      {/* Header */}
      <div
        className={`${colors.headerBg} px-4 py-2.5 flex items-center gap-2 cursor-pointer select-none`}
        onClick={() => setExpanded(e => !e)}
      >
        <Zap size={14} className={colors.accent} />
        <EventIcon name={cascade.icon} size={14} className={colors.text} />
        <span className={`text-sm font-semibold ${colors.text} flex-1 truncate`}>
          {cascade.label}{contextStr}
        </span>
        <span className="text-xs text-gray-500 tabular-nums">
          {completedCount}/{totalCount}
        </span>
        {expanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
      </div>

      {/* Action list */}
      {expanded && (
        <div className="px-4 py-2 space-y-1">
          {cascade.actions.map((action) => {
            const isVisible = action.status !== 'pending'
            return (
              <div
                key={action.id}
                className={`
                  flex items-center gap-2.5 py-1 transition-all duration-300 ease-out
                  ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 h-0 overflow-hidden py-0'}
                `}
              >
                <StatusIcon status={action.status} />
                <span className={`text-xs flex-1 ${action.status === 'completed' ? 'text-gray-700' : action.status === 'running' ? 'text-amber-700 font-medium' : 'text-gray-400'}`}>
                  {action.label}
                </span>
                <span className="text-[10px] text-gray-400 tabular-nums w-10 text-right">
                  {action.status === 'completed' ? `${(action.delay / 1000).toFixed(1)}s` : action.status === 'running' ? '...' : ''}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 border-t border-gray-100 flex items-center justify-between">
        <span className="text-[11px] text-gray-500">
          {allDone
            ? `${totalCount} actions completed${elapsed ? ` in ${elapsed}s` : ''}`
            : `${completedCount} of ${totalCount} actions...`
          }
        </span>
        <button
          onClick={() => dismissCascade(cascade.id)}
          className={`
            text-xs font-medium px-2.5 py-1 rounded-md transition-colors
            ${allDone
              ? `${colors.text} hover:bg-gray-100`
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }
          `}
        >
          {allDone ? 'Done' : 'Dismiss'}
        </button>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ease-out ${
            cascade.color === 'red' ? 'bg-red-400' :
            cascade.color === 'blue' ? 'bg-blue-400' :
            cascade.color === 'amber' ? 'bg-amber-400' :
            cascade.color === 'orange' ? 'bg-orange-400' :
            cascade.color === 'purple' ? 'bg-purple-400' :
            'bg-emerald-400'
          }`}
          style={{ width: `${(completedCount / totalCount) * 100}%` }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Display container — fixed bottom-right
// ---------------------------------------------------------------------------

export function EventCascadeDisplay() {
  const { cascades } = useEventCascade()
  const visible = cascades.filter(c => !c.dismissed)

  if (visible.length === 0) return null

  return (
    <>
      {/* Keyframe animations injected via style tag */}
      <style>{`
        @keyframes cascade-in {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes cascade-out {
          from { opacity: 1; transform: translateY(0) scale(1); }
          to   { opacity: 0; transform: translateY(20px) scale(0.95); }
        }
        @keyframes cascade-pop {
          0%   { transform: scale(0); }
          60%  { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
        .animate-cascade-in {
          animation: cascade-in 0.35s ease-out forwards;
        }
        .animate-cascade-out {
          animation: cascade-out 0.3s ease-in forwards;
          pointer-events: none;
        }
      `}</style>
      <div className="fixed bottom-20 right-4 z-50 flex flex-col-reverse gap-2 items-end">
        {visible.map((cascade, i) => (
          <CascadePanel key={cascade.id} cascade={cascade} index={i} />
        ))}
      </div>
    </>
  )
}
