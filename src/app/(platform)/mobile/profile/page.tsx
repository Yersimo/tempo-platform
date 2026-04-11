'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft, RefreshCw, User, Calendar, DollarSign,
  Clock, BookOpen, Target, Award, ChevronRight, FileText,
  Briefcase, MapPin, Mail, Phone, TrendingUp,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Avatar } from '@/components/ui/avatar'
import { cn } from '@/lib/utils/cn'

export default function MobileProfilePage() {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullStartY, setPullStartY] = useState(0)
  const [pullDistance, setPullDistance] = useState(0)

  const {
    currentUser,
    employees,
    departments,
    leaveRequests,
    payrollRuns,
    goals,
    enrollments,
    courses,
    timeOffBalances,
    ensureModulesLoaded,
  } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.([
      'employees', 'departments', 'leaveRequests', 'payrollRuns',
      'goals', 'enrollments', 'courses', 'timeOffBalances',
    ])
  }, [ensureModulesLoaded])

  const currentEmployee = useMemo(() => {
    return employees.find((e: Record<string, unknown>) => e.id === currentUser?.employee_id)
  }, [employees, currentUser])

  const profile = useMemo(() => {
    if (!currentEmployee) return null
    const emp = currentEmployee as Record<string, unknown>
    const prof = emp.profile as Record<string, unknown> | undefined
    return {
      name: prof?.full_name || emp.full_name || currentUser?.full_name || 'User',
      email: prof?.email || emp.email || currentUser?.email || '',
      avatar: prof?.avatar_url || null,
      phone: prof?.phone || null,
      jobTitle: emp.job_title || '',
      level: emp.level || '',
      country: emp.country || '',
      department: departments.find((d: any) => d.id === emp.department_id),
      hireDate: emp.hire_date || '',
    }
  }, [currentEmployee, departments, currentUser])

  // Leave balances
  const leaveBalance = useMemo(() => {
    if (!currentUser?.employee_id) return { annual: 0, sick: 0, personal: 0, used: 0 }
    const balances = timeOffBalances.filter((b: any) => b.employee_id === currentUser.employee_id)
    if (balances.length > 0) {
      const annual = balances.find((b: any) => b.leave_type === 'annual' || b.type === 'annual')
      const sick = balances.find((b: any) => b.leave_type === 'sick' || b.type === 'sick')
      const personal = balances.find((b: any) => b.leave_type === 'personal' || b.type === 'personal')
      return {
        annual: (annual as any)?.remaining || (annual as any)?.balance || 15,
        sick: (sick as any)?.remaining || (sick as any)?.balance || 8,
        personal: (personal as any)?.remaining || (personal as any)?.balance || 3,
        used: leaveRequests.filter((lr: any) => lr.employee_id === currentUser.employee_id && lr.status === 'approved').length,
      }
    }
    // Fallback
    const used = leaveRequests.filter((lr: any) => lr.employee_id === currentUser.employee_id && lr.status === 'approved').length
    return { annual: 15, sick: 8, personal: 3, used }
  }, [currentUser, timeOffBalances, leaveRequests])

  // Recent payslips (from payroll runs)
  const recentPayslips = useMemo(() => {
    return payrollRuns
      .filter((pr: any) => pr.status === 'paid' || pr.status === 'completed')
      .sort((a: any, b: any) => new Date(b.pay_date || b.created_at || '').getTime() - new Date(a.pay_date || a.created_at || '').getTime())
      .slice(0, 3)
      .map((pr: any) => ({
        id: pr.id,
        period: pr.period || pr.pay_period || 'N/A',
        amount: pr.total_net || pr.total_amount || pr.net_pay || 0,
        date: pr.pay_date || pr.created_at || '',
      }))
  }, [payrollRuns])

  // My goals
  const myGoals = useMemo(() => {
    if (!currentUser?.employee_id) return []
    return goals
      .filter((g: any) => g.employee_id === currentUser.employee_id || g.owner_id === currentUser.employee_id)
      .slice(0, 3)
      .map((g: any) => ({
        id: g.id,
        title: g.title || g.name || 'Untitled Goal',
        progress: g.progress || g.completion || 0,
        status: g.status || 'on_track',
      }))
  }, [goals, currentUser])

  // My courses
  const myEnrollments = useMemo(() => {
    if (!currentUser?.employee_id) return []
    return enrollments
      .filter((e: any) => e.employee_id === currentUser.employee_id)
      .slice(0, 3)
      .map((e: any) => {
        const course = courses.find((c: any) => c.id === e.course_id)
        return {
          id: e.id,
          courseName: (course as any)?.title || (course as any)?.name || 'Course',
          progress: e.progress || 0,
          status: e.status || 'in_progress',
        }
      })
  }, [enrollments, courses, currentUser])

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
      ensureModulesLoaded?.(['employees', 'departments', 'leaveRequests', 'payrollRuns', 'goals', 'enrollments', 'courses', 'timeOffBalances'])
        .then(() => setTimeout(() => setIsRefreshing(false), 500))
    }
    setPullStartY(0)
    setPullDistance(0)
  }, [pullDistance, ensureModulesLoaded])

  const STATUS_COLORS: Record<string, string> = {
    on_track: 'text-green-400',
    at_risk: 'text-amber-400',
    behind: 'text-red-400',
    completed: 'text-green-400',
    not_started: 'text-white/30',
    in_progress: 'text-blue-400',
  }

  return (
    <div
      className="min-h-screen bg-canvas pb-8 -mx-6 -mt-6 lg:-mx-8 lg:-mt-8"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {(pullDistance > 0 || isRefreshing) && (
        <div className="flex items-center justify-center py-3 text-white/40 transition-all"
          style={{ height: isRefreshing ? 48 : pullDistance * 0.5 }}
        >
          <RefreshCw size={18} className={cn(isRefreshing && 'animate-spin')} />
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
          <h1 className="text-lg font-bold text-white">My Profile</h1>
        </div>
      </div>

      <div className="px-5 pt-5 space-y-6">
        {/* Profile card */}
        <div className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-5">
          <div className="flex items-center gap-4 mb-4">
            <Avatar name={profile?.name as string || 'User'} src={profile?.avatar as string} size="lg" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-bold text-white truncate">{profile?.name as string || 'User'}</h2>
              <p className="text-xs text-white/40 truncate">{profile?.jobTitle as string}</p>
              {profile?.level && (
                <span className="inline-block text-[10px] bg-teal-700/10 text-teal-400 px-2 py-0.5 rounded-full mt-1 font-medium">
                  {profile?.level as string}
                </span>
              )}
            </div>
          </div>
          <div className="space-y-2 text-xs text-white/40">
            {profile?.email && (
              <div className="flex items-center gap-2"><Mail size={12} /> {profile.email as string}</div>
            )}
            {(profile?.department as any)?.name && (
              <div className="flex items-center gap-2"><Briefcase size={12} /> {(profile?.department as any)?.name}</div>
            )}
            {profile?.country && (
              <div className="flex items-center gap-2"><MapPin size={12} /> {profile.country as string}</div>
            )}
          </div>
        </div>

        {/* Leave balance */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Leave Balance</h2>
            <a href="/time-attendance" className="text-xs text-teal-400 flex items-center gap-1 min-h-[44px]">
              Request Leave <ChevronRight size={14} />
            </a>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Annual', value: leaveBalance.annual, color: 'text-blue-400', bg: 'bg-blue-500/10' },
              { label: 'Sick', value: leaveBalance.sick, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              { label: 'Personal', value: leaveBalance.personal, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-4 text-center">
                <p className={cn('text-2xl font-bold', item.color)}>{item.value}</p>
                <p className="text-[10px] text-white/30 mt-0.5">{item.label} days</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent payslips */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Recent Payslips</h2>
            <a href="/payroll" className="text-xs text-teal-400 flex items-center gap-1 min-h-[44px]">
              View All <ChevronRight size={14} />
            </a>
          </div>
          {recentPayslips.length > 0 ? (
            <div className="space-y-2">
              {recentPayslips.map((ps) => (
                <div key={ps.id} className="flex items-center gap-3 p-3 rounded-xl bg-[#1a1d27] border border-white/[0.04]">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <DollarSign size={16} className="text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white font-medium">{ps.period}</p>
                    <p className="text-[10px] text-white/30">{ps.date ? new Date(ps.date).toLocaleDateString() : 'N/A'}</p>
                  </div>
                  <p className="text-sm font-bold text-emerald-400">
                    ${(ps.amount / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-6 text-center">
              <DollarSign size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">No payslip data available</p>
            </div>
          )}
        </div>

        {/* My Goals / Development */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">My Goals</h2>
            <a href="/performance" className="text-xs text-teal-400 flex items-center gap-1 min-h-[44px]">
              View All <ChevronRight size={14} />
            </a>
          </div>
          {myGoals.length > 0 ? (
            <div className="space-y-2">
              {myGoals.map((goal) => (
                <div key={goal.id} className="p-3 rounded-xl bg-[#1a1d27] border border-white/[0.04]">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs text-white font-medium truncate flex-1 mr-2">{goal.title}</p>
                    <span className={cn('text-[10px] font-medium', STATUS_COLORS[goal.status] || 'text-white/30')}>
                      {goal.status.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                      <div
                        className="h-full bg-teal-700 rounded-full transition-all"
                        style={{ width: `${goal.progress}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/30">{goal.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-6 text-center">
              <Target size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">No goals set</p>
            </div>
          )}
        </div>

        {/* My Learning */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider">Learning Progress</h2>
            <a href="/learning" className="text-xs text-teal-400 flex items-center gap-1 min-h-[44px]">
              Browse Courses <ChevronRight size={14} />
            </a>
          </div>
          {myEnrollments.length > 0 ? (
            <div className="space-y-2">
              {myEnrollments.map((enr) => (
                <div key={enr.id} className="p-3 rounded-xl bg-[#1a1d27] border border-white/[0.04]">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen size={14} className="text-blue-400 flex-shrink-0" />
                    <p className="text-xs text-white font-medium truncate">{enr.courseName}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/[0.04] rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${enr.progress}%` }} />
                    </div>
                    <span className="text-[10px] text-white/30">{enr.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl bg-[#1a1d27] border border-white/[0.04] p-6 text-center">
              <BookOpen size={24} className="text-white/10 mx-auto mb-2" />
              <p className="text-xs text-white/30">No courses enrolled</p>
            </div>
          )}
        </div>

        {/* Quick links */}
        <div>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">Quick Links</h2>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/compensation', label: 'Compensation', icon: <DollarSign size={16} />, color: 'text-emerald-400' },
              { href: '/benefits', label: 'Benefits', icon: <Award size={16} />, color: 'text-purple-400' },
              { href: '/documents', label: 'Documents', icon: <FileText size={16} />, color: 'text-blue-400' },
              { href: '/settings', label: 'Settings', icon: <User size={16} />, color: 'text-white/40' },
            ].map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="flex items-center gap-2.5 p-3.5 rounded-xl bg-[#1a1d27] border border-white/[0.04] active:bg-white/[0.04] transition-colors min-h-[44px]"
              >
                <span className={link.color}>{link.icon}</span>
                <span className="text-xs text-white/50">{link.label}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
