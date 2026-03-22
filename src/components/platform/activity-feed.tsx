'use client'

import React, { useMemo } from 'react'
import { useTempo } from '@/lib/store'
import { formatRelativeTime } from '@/lib/services/platform-bot'
import { NOTIFICATION_CHANNELS, type PlatformEventType } from '@/lib/services/notification-config'
import Link from 'next/link'
import { Activity } from 'lucide-react'

interface ActivityFeedProps {
  maxItems?: number
  compact?: boolean
  className?: string
}

export function ActivityFeed({ maxItems = 10, compact = false, className = '' }: ActivityFeedProps) {
  const { platformEvents } = useTempo() as any

  const events = useMemo(() => {
    if (!platformEvents || !Array.isArray(platformEvents)) return []
    return [...platformEvents]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, maxItems)
  }, [platformEvents, maxItems])

  if (events.length === 0) {
    return (
      <div className={`${className}`}>
        {!compact && (
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-tempo-600" />
            <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Recent Activity</h3>
          </div>
        )}
        <div className="text-center py-6">
          <p className="text-xs text-t3">No platform activity yet.</p>
          <p className="text-[0.65rem] text-t3 mt-1">Events will appear here as actions are taken across the platform.</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {!compact && (
        <div className="flex items-center gap-2 mb-3">
          <Activity size={14} className="text-tempo-600" />
          <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Recent Activity</h3>
        </div>
      )}
      <div className="divide-y divide-divider">
        {events.map((event) => {
          const config = NOTIFICATION_CHANNELS[event.type as PlatformEventType]
          const feedIcon = config?.feedIcon || '\u26A1'
          const link = config?.link || '#'
          const relTime = formatRelativeTime(event.timestamp)

          return (
            <Link
              key={event.id}
              href={link}
              className="flex items-start gap-2.5 py-2.5 px-1 hover:bg-canvas/50 transition-colors group"
            >
              <span className="text-sm flex-shrink-0 mt-0.5 w-5 text-center" aria-hidden="true">
                {feedIcon}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-t1 font-medium truncate group-hover:text-tempo-600 transition-colors">
                  {event.title}
                </p>
                {!compact && event.data && (
                  <p className="text-[0.65rem] text-t3 line-clamp-1 mt-0.5">
                    {buildSummary(event)}
                  </p>
                )}
              </div>
              <span className="text-[0.6rem] text-t3 whitespace-nowrap flex-shrink-0 mt-0.5">
                {relTime}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// ---- Build short summary from event data ----
function buildSummary(event: { type: string; data: Record<string, unknown> }): string {
  const d = event.data || {}
  switch (event.type) {
    case 'payroll.completed':
      return `${d.employeeCount || 0} employees processed`
    case 'payroll.approved':
      return `Approved by ${d.approverName || 'management'}`
    case 'employee.hired':
      return `${d.name || 'New hire'} joined ${d.department || 'the team'}`
    case 'employee.terminated':
      return `Last day: ${d.lastDate || 'TBD'}`
    case 'employee.promoted':
      return `${d.name || 'Employee'} promoted to ${d.newTitle || 'new role'}`
    case 'expense.submitted':
      return `${d.employeeName || 'Employee'} - ${d.title || 'Expense report'}`
    case 'expense.policy_violation':
      return `${d.violationCount || 0} violation(s) detected`
    case 'leave.approved':
      return `${d.employeeName || 'Employee'} - ${d.days || 0} day(s)`
    case 'leave.conflict':
      return `${d.absentPercent || '>30'}% team out`
    case 'compliance.alert':
      return `${d.count || 0} issue(s) require attention`
    case 'compliance.deadline':
      return `Due in ${d.daysRemaining || 0} days`
    case 'security.access_revoked':
      return `${d.employeeName || 'Employee'} - access revoked`
    case 'performance.review_completed':
      return `${d.reviewerName || 'Manager'} reviewed ${d.employeeName || 'employee'}`
    case 'performance.review_cycle_started':
      return `${d.employeeCount || 0} employees in cycle`
    case 'budget.threshold_exceeded':
      return `${d.departmentName || 'Department'} at ${d.percent || 0}%`
    case 'onboarding.started':
      return `${d.name || 'New hire'} starts today`
    case 'offboarding.initiated':
      return `${d.name || 'Employee'} departing`
    default:
      return ''
  }
}
