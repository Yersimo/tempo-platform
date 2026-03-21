'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckSquare, ChevronLeft, RefreshCw, Filter,
  CheckCircle, XCircle, Calendar, Receipt, Clock, Banknote,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Avatar } from '@/components/ui/avatar'
import { ApprovalCard, type ApprovalItem } from '@/components/mobile/approval-card'
import { cn } from '@/lib/utils/cn'

type FilterType = 'all' | 'leave' | 'expense' | 'timesheet' | 'payroll'

export default function MobileApprovalsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterType>('all')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)
  const [batchMode, setBatchMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const {
    currentUser,
    employees,
    departments,
    leaveRequests,
    expenseReports,
    payrollRuns,
    ensureModulesLoaded,
    updateLeaveRequest,
    updateExpenseReport,
  } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'expenseReports', 'payrollRuns'])
  }, [ensureModulesLoaded])

  // Build approval items
  const allApprovals = useMemo((): ApprovalItem[] => {
    const items: ApprovalItem[] = []

    leaveRequests
      .filter((lr: Record<string, unknown>) => lr.status === 'pending')
      .forEach((lr: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === lr.employee_id)
        const dept = departments.find((d: Record<string, unknown>) => d.id === (emp as any)?.department_id)
        const empName = emp?.profile
          ? ((emp as any).profile as any)?.full_name
          : (emp as any)?.full_name || 'Unknown'
        items.push({
          id: lr.id as string,
          type: 'leave',
          requester: {
            name: empName,
            avatar_url: emp?.profile ? ((emp as any).profile as any)?.avatar_url : null,
            department: (dept as any)?.name,
          },
          title: `${(lr.leave_type as string || lr.type as string || 'Leave').replace(/_/g, ' ')} request`,
          subtitle: `${lr.days || lr.total_days || '-'} day(s)`,
          dates: lr.start_date ? { start: lr.start_date as string, end: (lr.end_date || lr.start_date) as string } : undefined,
          submitted: (lr.submitted_at || lr.created_at || new Date().toISOString()) as string,
          details: lr.reason as string || lr.notes as string,
        })
      })

    expenseReports
      .filter((er: Record<string, unknown>) => er.status === 'pending' || er.status === 'submitted')
      .forEach((er: Record<string, unknown>) => {
        const emp = employees.find((e: Record<string, unknown>) => e.id === er.employee_id)
        const empName = emp?.profile
          ? ((emp as any).profile as any)?.full_name
          : (emp as any)?.full_name || 'Unknown'
        items.push({
          id: er.id as string,
          type: 'expense',
          requester: {
            name: empName,
            avatar_url: emp?.profile ? ((emp as any).profile as any)?.avatar_url : null,
          },
          title: (er.title || er.description || 'Expense Report') as string,
          subtitle: er.category as string || 'General',
          amount: (er.total_amount || er.amount) as number,
          currency: (er.currency || 'USD') as string,
          submitted: (er.submitted_at || er.created_at || new Date().toISOString()) as string,
          details: er.description as string,
        })
      })

    return items.sort((a, b) => new Date(b.submitted).getTime() - new Date(a.submitted).getTime())
  }, [leaveRequests, expenseReports, employees, departments])

  const filteredApprovals = useMemo(() => {
    if (filter === 'all') return allApprovals
    return allApprovals.filter((a) => a.type === filter)
  }, [allApprovals, filter])

  const handleApprove = useCallback((id: string, comment?: string) => {
    const leave = leaveRequests.find((lr: Record<string, unknown>) => lr.id === id)
    if (leave) { updateLeaveRequest?.(id, { status: 'approved', reviewer_comment: comment }); return }
    const expense = expenseReports.find((er: Record<string, unknown>) => er.id === id)
    if (expense) { updateExpenseReport?.(id, { status: 'approved', reviewer_comment: comment }) }
  }, [leaveRequests, expenseReports, updateLeaveRequest, updateExpenseReport])

  const handleReject = useCallback((id: string, comment?: string) => {
    const leave = leaveRequests.find((lr: Record<string, unknown>) => lr.id === id)
    if (leave) { updateLeaveRequest?.(id, { status: 'rejected', reviewer_comment: comment }); return }
    const expense = expenseReports.find((er: Record<string, unknown>) => er.id === id)
    if (expense) { updateExpenseReport?.(id, { status: 'rejected', reviewer_comment: comment }) }
  }, [leaveRequests, expenseReports, updateLeaveRequest, updateExpenseReport])

  const handleBatchApprove = useCallback(() => {
    selectedIds.forEach((id) => handleApprove(id))
    setSelectedIds(new Set())
    setBatchMode(false)
  }, [selectedIds, handleApprove])

  const handleBatchReject = useCallback(() => {
    selectedIds.forEach((id) => handleReject(id))
    setSelectedIds(new Set())
    setBatchMode(false)
  }, [selectedIds, handleReject])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  // Pull to refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) setPullStartY(e.touches[0].clientY)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY === 0) return
    const d = e.touches[0].clientY - pullStartY
    if (d > 0 && d < 150) setPullDistance(d)
  }, [pullStartY])

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 80) {
      setIsRefreshing(true)
      ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'expenseReports', 'payrollRuns'])
        .then(() => setTimeout(() => setIsRefreshing(false), 500))
    }
    setPullStartY(0)
    setPullDistance(0)
  }, [pullDistance, ensureModulesLoaded])

  const FILTER_OPTIONS: { value: FilterType; label: string; icon: React.ReactNode }[] = [
    { value: 'all', label: 'All', icon: <Filter size={14} /> },
    { value: 'leave', label: 'Leave', icon: <Calendar size={14} /> },
    { value: 'expense', label: 'Expense', icon: <Receipt size={14} /> },
    { value: 'payroll', label: 'Payroll', icon: <Banknote size={14} /> },
  ]

  return (
    <div
      className="min-h-screen bg-canvas pb-8 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex items-center justify-center py-3 text-white/40 transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance * 0.5 }}
        >
          <RefreshCw size={18} className={cn(isRefreshing && 'animate-spin')} style={{ transform: `rotate(${pullDistance * 2}deg)` }} />
        </div>
      )}

      {/* Header */}
      <div className="sticky top-0 z-30 bg-canvas/95 backdrop-blur-xl border-b border-white/[0.04] px-5 pt-[env(safe-area-inset-top)] pb-4">
        <div className="flex items-center gap-3 pt-4">
          <button
            onClick={() => router.push('/mobile')}
            className="p-2 rounded-xl bg-white/[0.04] text-white/50 active:bg-white/[0.08] min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-white">Approvals</h1>
            <p className="text-[11px] text-white/30">
              {filteredApprovals.length} pending {filter !== 'all' ? filter : ''} approval{filteredApprovals.length !== 1 ? 's' : ''}
            </p>
          </div>
          {filteredApprovals.length > 1 && (
            <button
              onClick={() => { setBatchMode(!batchMode); setSelectedIds(new Set()) }}
              className={cn(
                'px-3 py-2 rounded-xl text-xs font-medium min-h-[44px] transition-colors',
                batchMode ? 'bg-orange-500/15 text-orange-400' : 'bg-white/[0.04] text-white/40'
              )}
            >
              {batchMode ? 'Cancel' : 'Batch'}
            </button>
          )}
        </div>
      </div>

      {/* Filter chips */}
      <div className="px-5 pt-4 pb-2">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTER_OPTIONS.map((opt) => {
            const count = opt.value === 'all' ? allApprovals.length : allApprovals.filter((a) => a.type === opt.value).length
            return (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-medium whitespace-nowrap min-h-[36px] transition-colors',
                  filter === opt.value
                    ? 'bg-orange-500/15 text-orange-400 border border-orange-500/20'
                    : 'bg-white/[0.04] text-white/40 active:bg-white/[0.08]'
                )}
              >
                {opt.icon}
                {opt.label}
                {count > 0 && (
                  <span className={cn(
                    'ml-1 text-[10px] min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1',
                    filter === opt.value ? 'bg-orange-500/20 text-orange-400' : 'bg-white/[0.06] text-white/30'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* Batch actions bar */}
      {batchMode && selectedIds.size > 0 && (
        <div className="sticky top-[90px] z-20 mx-5 mb-3 p-3 rounded-2xl bg-[#1a1d27] border border-white/[0.06] flex items-center justify-between">
          <span className="text-xs text-white/50">{selectedIds.size} selected</span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchReject}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-500/15 text-red-400 text-xs font-medium min-h-[36px] active:bg-red-500/25"
            >
              <XCircle size={14} /> Reject
            </button>
            <button
              onClick={handleBatchApprove}
              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-500/15 text-green-400 text-xs font-medium min-h-[36px] active:bg-green-500/25"
            >
              <CheckCircle size={14} /> Approve
            </button>
          </div>
        </div>
      )}

      {/* Approval cards */}
      <div className="px-5 space-y-3">
        {filteredApprovals.length > 0 && !batchMode && (
          <p className="text-[10px] text-white/15 text-center mb-1">Swipe right to approve, left to reject</p>
        )}

        {filteredApprovals.map((item) => (
          <div key={item.id} className="relative">
            {batchMode && (
              <button
                onClick={() => toggleSelect(item.id)}
                className={cn(
                  'absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors',
                  selectedIds.has(item.id)
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'border-white/20 bg-transparent'
                )}
              >
                {selectedIds.has(item.id) && <CheckCircle size={14} />}
              </button>
            )}
            <div className={cn(batchMode && 'ml-8')}>
              <ApprovalCard item={item} onApprove={handleApprove} onReject={handleReject} />
            </div>
          </div>
        ))}

        {filteredApprovals.length === 0 && (
          <div className="text-center py-20">
            <CheckSquare size={48} className="text-white/10 mx-auto mb-3" />
            <p className="text-base font-medium text-white/30">All caught up!</p>
            <p className="text-xs text-white/15 mt-1">No pending approvals</p>
          </div>
        )}
      </div>
    </div>
  )
}
