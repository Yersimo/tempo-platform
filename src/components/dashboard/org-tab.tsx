'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useAI } from '@/lib/use-ai'
import { useTranslations } from 'next-intl'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { TempoBarChart, TempoDonutChart, TempoSparkArea, CHART_COLORS, STATUS_COLORS, CHART_SERIES } from '@/components/ui/charts'
import {
  Users, TrendingUp, Banknote, GraduationCap, Briefcase,
  Receipt, UserCheck, Clock, ArrowRight, CheckCircle2,
  AlertTriangle, FileText, CalendarCheck, ChevronRight,
  Megaphone, PartyPopper, Cake, Award, Zap, PlusCircle,
  Send, BarChart3, Heart, Pencil, Trash2, Pin
} from 'lucide-react'
import { useTempo } from '@/lib/store'

// ---- Company Updates CRUD (persisted in localStorage) ----
interface CompanyUpdate {
  id: string
  title: string
  content: string
  category: 'announcement' | 'news' | 'policy' | 'event' | 'kudos'
  pinned: boolean
  author_name: string
  author_id: string
  created_at: string
  updated_at: string
}

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  announcement: { label: 'Announcement', icon: <Megaphone size={14} />, color: 'bg-tempo-100 text-tempo-600' },
  news: { label: 'News', icon: <FileText size={14} />, color: 'bg-blue-100 text-blue-600' },
  policy: { label: 'Policy Update', icon: <FileText size={14} />, color: 'bg-purple-100 text-purple-600' },
  event: { label: 'Event', icon: <PartyPopper size={14} />, color: 'bg-green-100 text-green-600' },
  kudos: { label: 'Kudos', icon: <Heart size={14} />, color: 'bg-pink-100 text-pink-600' },
}

function useCompanyUpdates() {
  const [updates, setUpdates] = useState<CompanyUpdate[]>([])

  useEffect(() => {
    try {
      const stored = localStorage.getItem('tempo_company_updates')
      if (stored) setUpdates(JSON.parse(stored))
    } catch { /* ignore */ }
  }, [])

  const persist = useCallback((next: CompanyUpdate[]) => {
    setUpdates(next)
    try { localStorage.setItem('tempo_company_updates', JSON.stringify(next)) } catch { /* ignore */ }
  }, [])

  const addUpdate = useCallback((data: Omit<CompanyUpdate, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString()
    const item: CompanyUpdate = { ...data, id: `upd-${Date.now()}`, created_at: now, updated_at: now }
    setUpdates((prev: CompanyUpdate[]) => {
      const next = [item, ...prev]
      try { localStorage.setItem('tempo_company_updates', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
    return item
  }, [])

  const editUpdate = useCallback((id: string, data: Partial<CompanyUpdate>) => {
    setUpdates((prev: CompanyUpdate[]) => {
      const next = prev.map(u => u.id === id ? { ...u, ...data, updated_at: new Date().toISOString() } : u)
      try { localStorage.setItem('tempo_company_updates', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const deleteUpdate = useCallback((id: string) => {
    setUpdates((prev: CompanyUpdate[]) => {
      const next = prev.filter(u => u.id !== id)
      try { localStorage.setItem('tempo_company_updates', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  const togglePin = useCallback((id: string) => {
    setUpdates((prev: CompanyUpdate[]) => {
      const next = prev.map(u => u.id === id ? { ...u, pinned: !u.pinned } : u)
      try { localStorage.setItem('tempo_company_updates', JSON.stringify(next)) } catch { /* ignore */ }
      return next
    })
  }, [])

  // Sort: pinned first, then by date
  const sorted = useMemo(() =>
    [...updates].sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }),
  [updates])

  return { updates: sorted, addUpdate, editUpdate, deleteUpdate, togglePin }
}
import { AIInsightCard, AIRecommendationList, AIAlertBanner } from '@/components/ai'
import { generateExecutiveSummary, identifyNextBestActions, detectCrossModuleAnomalies } from '@/lib/ai-engine'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils/cn'
import { LiveWorkflowActivity } from '@/components/dashboard/live-workflow-activity'
import { ActiveJourneysCard } from '@/components/dashboard/active-journeys-card'

export function OrgTab() {
  const {
    employees, goals, feedback, leaveRequests, jobPostings,
    enrollments, mentoringPairs, expenseReports, payrollRuns,
    reviews, auditLog, getEmployeeName, departments,
    updateLeaveRequest, reviewCycles, salaryReviews, surveys,
    engagementScores, applications, currentUser, currentEmployeeId,
    addToast, workflows, workflowRuns,
  } = useTempo()

  const router = useRouter()
  const t = useTranslations('dashboard')
  const tc = useTranslations('common')

  // ---- Company Updates CRUD ----
  const { updates: companyUpdates, addUpdate, editUpdate, deleteUpdate, togglePin } = useCompanyUpdates()
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState<CompanyUpdate | null>(null)
  const [updateForm, setUpdateForm] = useState({ title: '', content: '', category: 'announcement' as CompanyUpdate['category'] })
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const isAdmin = currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.role === 'hrbp'

  function openNewUpdate() {
    setEditingUpdate(null)
    setUpdateForm({ title: '', content: '', category: 'announcement' })
    setShowUpdateModal(true)
  }

  function openEditUpdate(upd: CompanyUpdate) {
    setEditingUpdate(upd)
    setUpdateForm({ title: upd.title, content: upd.content, category: upd.category })
    setShowUpdateModal(true)
  }

  function handleSaveUpdate() {
    if (!updateForm.title.trim() || !updateForm.content.trim()) return
    if (editingUpdate) {
      editUpdate(editingUpdate.id, { title: updateForm.title, content: updateForm.content, category: updateForm.category })
      addToast('Update saved')
    } else {
      addUpdate({
        title: updateForm.title,
        content: updateForm.content,
        category: updateForm.category,
        pinned: false,
        author_name: currentUser?.full_name || 'Admin',
        author_id: currentEmployeeId || '',
      })
      addToast('Company update published')
    }
    setShowUpdateModal(false)
  }

  function handleDeleteUpdate(id: string) {
    deleteUpdate(id)
    setDeleteConfirmId(null)
    addToast('Update deleted')
  }

  // Live KPIs
  const headcount = employees.length
  const activeGoals = goals.filter(g => g.status === 'on_track' || g.status === 'at_risk').length
  const ratedReviews = reviews.filter(r => r.overall_rating)
  const reviewCompletion = reviews.length > 0 ? Math.round((reviews.filter(r => r.status === 'submitted').length / reviews.length) * 100) : 0
  const activeLearners = new Set(enrollments.filter(e => e.status === 'in_progress' || e.status === 'enrolled').map(e => e.employee_id)).size
  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const pendingExpenses = expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').length
  const activeMentoringPairs = mentoringPairs.filter(p => p.status === 'active').length
  const pendingLeave = leaveRequests.filter(l => l.status === 'pending')
  const lastPayroll = payrollRuns[payrollRuns.length - 1]

  // Action items (Rippling-style "needs your attention")
  const actionItems = useMemo(() => {
    const items: { id: string; type: string; title: string; subtitle: string; href: string; icon: React.ReactNode; urgency: 'critical' | 'warning' | 'info' }[] = []

    if (pendingLeave.length > 0) {
      items.push({
        id: 'leave',
        type: 'Leave',
        title: `${pendingLeave.length} leave request${pendingLeave.length > 1 ? 's' : ''} pending approval`,
        subtitle: pendingLeave.map(l => getEmployeeName(l.employee_id)).slice(0, 2).join(', ') + (pendingLeave.length > 2 ? ` +${pendingLeave.length - 2} more` : ''),
        href: '/time-attendance',
        icon: <CalendarCheck size={16} />,
        urgency: 'warning',
      })
    }

    if (pendingExpenses > 0) {
      items.push({
        id: 'expenses',
        type: 'Expense',
        title: `${pendingExpenses} expense report${pendingExpenses > 1 ? 's' : ''} awaiting review`,
        subtitle: `$${expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').reduce((a, e) => a + e.total_amount, 0).toLocaleString()} total`,
        href: '/expense',
        icon: <Receipt size={16} />,
        urgency: 'warning',
      })
    }

    const incompleteReviews = reviews.filter(r => r.status === 'in_progress' || r.status === 'draft')
    if (incompleteReviews.length > 0) {
      items.push({
        id: 'reviews',
        type: 'Performance',
        title: `${incompleteReviews.length} performance review${incompleteReviews.length > 1 ? 's' : ''} in progress`,
        subtitle: 'Ensure timely completion of the review cycle',
        href: '/performance',
        icon: <FileText size={16} />,
        urgency: 'info',
      })
    }

    const atRiskGoals = goals.filter(g => g.status === 'at_risk' || g.status === 'behind')
    if (atRiskGoals.length > 0) {
      items.push({
        id: 'goals',
        type: 'Goals',
        title: `${atRiskGoals.length} goal${atRiskGoals.length > 1 ? 's' : ''} at risk or behind`,
        subtitle: 'Review progress and provide support',
        href: '/performance',
        icon: <AlertTriangle size={16} />,
        urgency: atRiskGoals.some(g => g.status === 'behind') ? 'critical' : 'warning',
      })
    }

    return items
  }, [pendingLeave, pendingExpenses, reviews, goals, expenseReports, getEmployeeName])

  // Department distribution for donut chart
  const deptDistribution = useMemo(() => {
    const colors = ['#ea580c', '#94a3b8', '#64748b', '#a1a1aa', '#78716c', '#71717a', '#6b7280', '#9ca3af']
    const counts: Record<string, number> = {}
    employees.forEach(emp => {
      const deptId = emp.department_id
      const dept = departments.find(d => d.id === deptId)
      const name = dept?.name || 'Other'
      counts[name] = (counts[name] || 0) + 1
    })
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([label, value], i) => ({ label, value, color: colors[i % colors.length] }))
  }, [employees, departments])

  // Headcount sparkline data (simulated monthly trend)
  const headcountTrend = useMemo(() => {
    const base = Math.max(0, headcount - 12)
    return Array.from({ length: 6 }, (_, i) => base + Math.floor(Math.random() * 4) + i * 2)
  }, [headcount])

  // AI-powered insights
  const execSummary = useMemo(() => generateExecutiveSummary({ employees, goals, reviews, reviewCycles, salaryReviews, surveys, engagementScores, expenseReports, leaveRequests, jobPostings, applications, payrollRuns, mentoringPairs }), [employees, goals, reviews, payrollRuns])
  const nextActions = useMemo(() => identifyNextBestActions({ reviews, leaveRequests, expenseReports, salaryReviews, goals, jobPostings, applications }), [reviews, leaveRequests, expenseReports])
  const aiAnomalies = useMemo(() => detectCrossModuleAnomalies({ employees, reviews, engagementScores, salaryReviews, goals, mentoringPairs, leaveRequests }), [employees, reviews, goals])

  // Claude AI enhancement - executive summary
  const { result: enhancedSummary, isLoading: summaryLoading } = useAI({
    action: 'enhanceNarrative',
    data: { summary: execSummary, employees: employees.length, goals: goals.length, reviews: reviews.length },
    fallback: execSummary,
    enabled: !!execSummary.summary,
    cacheKey: `dashboard-summary-${employees.length}-${goals.length}`,
  })

  return (
    <>
      {/* Quick Actions Bar - Workday/BambooHR style */}
      <div className="mb-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[
            { label: 'Submit PTO', icon: <Clock size={14} />, href: '/time-attendance', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'Run Payroll', icon: <Banknote size={14} />, href: '/payroll', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'Post a Job', icon: <Briefcase size={14} />, href: '/recruiting', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'Give Kudos', icon: <Heart size={14} />, href: '/performance', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'File Expense', icon: <Receipt size={14} />, href: '/expense', color: 'bg-gray-50 text-gray-600 border-gray-200' },
            { label: 'View Reports', icon: <BarChart3 size={14} />, href: '/analytics', color: 'bg-gray-50 text-gray-600 border-gray-200' },
          ].map(action => (
            <button
              key={action.label}
              onClick={() => router.push(action.href)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium whitespace-nowrap hover:shadow-sm transition-all', action.color)}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Company Updates - admin-posted + auto-generated from activity */}
      {(() => {
        // Auto-generated system updates
        const systemUpdates: { id: string; icon: React.ReactNode; title: string; content: string; author: string; date: string; color: string; isSystem: true }[] = []

        if (lastPayroll) {
          systemUpdates.push({
            id: 'sys-payroll',
            icon: <Banknote size={14} />,
            title: `${lastPayroll.period} Payroll Processed`,
            content: `Payroll for ${lastPayroll.employee_count || employees.length} employees has been processed. Total net: $${(lastPayroll.total_net / 100).toLocaleString()}.`,
            author: 'Payroll System',
            date: lastPayroll.run_date ? new Date(lastPayroll.run_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '',
            color: 'bg-gray-100 text-gray-500',
            isSystem: true,
          })
        }

        if (openPositions > 0) {
          systemUpdates.push({
            id: 'sys-recruiting',
            icon: <Briefcase size={14} />,
            title: `${openPositions} Open Position${openPositions > 1 ? 's' : ''}`,
            content: `Currently hiring for ${jobPostings.filter(j => j.status === 'open').map(j => j.title).slice(0, 3).join(', ')}${openPositions > 3 ? ` and ${openPositions - 3} more` : ''}.`,
            author: 'Recruiting',
            date: 'Active',
            color: 'bg-gray-100 text-gray-500',
            isSystem: true,
          })
        }

        const totalCount = companyUpdates.length + systemUpdates.length

        return (
          <>
            <Card padding="none" className="mb-6">
              <div className="px-6 py-3 flex items-center justify-between border-b border-divider">
                <div className="flex items-center gap-2">
                  <Megaphone size={14} className="text-tempo-600" />
                  <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Company Updates</h3>
                  {totalCount > 0 && <Badge variant="default">{totalCount}</Badge>}
                </div>
                {isAdmin && (
                  <Button variant="ghost" size="sm" onClick={openNewUpdate}><PlusCircle size={14} /> Post Update</Button>
                )}
              </div>

              {/* Admin-posted updates */}
              {companyUpdates.length > 0 && (
                <div className="divide-y divide-divider">
                  {companyUpdates.map(upd => {
                    const cat = CATEGORY_CONFIG[upd.category] || CATEGORY_CONFIG.announcement
                    return (
                      <div key={upd.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', cat.color)}>
                            {cat.icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <p className="text-xs font-semibold text-t1">{upd.title}</p>
                              {upd.pinned && <Pin size={10} className="text-tempo-600" />}
                              <Badge variant="default">{cat.label}</Badge>
                            </div>
                            <p className="text-xs text-t2 whitespace-pre-line">{upd.content}</p>
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[0.65rem] text-t3">{upd.author_name}</span>
                              <span className="text-[0.65rem] text-t3">{new Date(upd.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              {upd.updated_at !== upd.created_at && <span className="text-[0.65rem] text-t3 italic">(edited)</span>}
                            </div>
                          </div>
                          {isAdmin && (
                            <div className="flex-shrink-0 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => togglePin(upd.id)} className="p-1 rounded hover:bg-gray-100" title={upd.pinned ? 'Unpin' : 'Pin'}>
                                <Pin size={12} className={upd.pinned ? 'text-tempo-600' : 'text-t3'} />
                              </button>
                              <button onClick={() => openEditUpdate(upd)} className="p-1 rounded hover:bg-gray-100" title="Edit">
                                <Pencil size={12} className="text-t3" />
                              </button>
                              <button onClick={() => setDeleteConfirmId(upd.id)} className="p-1 rounded hover:bg-red-50" title="Delete">
                                <Trash2 size={12} className="text-red-400" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* System auto-generated updates */}
              {systemUpdates.length > 0 && (
                <div className={cn('divide-y divide-divider', companyUpdates.length > 0 && 'border-t border-divider')}>
                  {companyUpdates.length > 0 && systemUpdates.length > 0 && (
                    <div className="px-6 py-2 bg-gray-50/50">
                      <span className="text-[0.6rem] uppercase tracking-wider text-t3 font-medium">System Activity</span>
                    </div>
                  )}
                  {systemUpdates.map(ann => (
                    <div key={ann.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                      <div className="flex items-start gap-3">
                        <div className={cn('flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center mt-0.5', ann.color)}>
                          {ann.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-t1">{ann.title}</p>
                          <p className="text-xs text-t2 line-clamp-2">{ann.content}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[0.65rem] text-t3">{ann.author}</span>
                            <span className="text-[0.65rem] text-t3">{ann.date}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalCount === 0 && (
                <div className="px-6 py-10 text-center">
                  <Megaphone size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-xs font-medium text-t2">No company updates yet</p>
                  <p className="text-[0.65rem] text-t3 mt-1">Post an update to share news with your team.</p>
                  {isAdmin && (
                    <Button variant="primary" size="sm" className="mt-3" onClick={openNewUpdate}>Post First Update</Button>
                  )}
                </div>
              )}
            </Card>

            {/* Post / Edit Update Modal */}
            {showUpdateModal && (
              <Modal open onClose={() => setShowUpdateModal(false)} title={editingUpdate ? 'Edit Update' : 'Post Company Update'} size="md">
                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={updateForm.title}
                    onChange={e => setUpdateForm(f => ({ ...f, title: e.target.value }))}
                    placeholder="e.g. Q1 All-Hands Meeting this Friday"
                  />
                  <Textarea
                    label="Content"
                    value={updateForm.content}
                    onChange={e => setUpdateForm(f => ({ ...f, content: e.target.value }))}
                    placeholder="Write your update here..."
                    rows={4}
                  />
                  <Select
                    label="Category"
                    value={updateForm.category}
                    onChange={e => setUpdateForm(f => ({ ...f, category: e.target.value as CompanyUpdate['category'] }))}
                    options={[
                      { value: 'announcement', label: 'Announcement' },
                      { value: 'news', label: 'News' },
                      { value: 'policy', label: 'Policy Update' },
                      { value: 'event', label: 'Event' },
                      { value: 'kudos', label: 'Kudos' },
                    ]}
                  />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                  <Button variant="secondary" onClick={() => setShowUpdateModal(false)}>Cancel</Button>
                  <Button variant="primary" onClick={handleSaveUpdate} disabled={!updateForm.title.trim() || !updateForm.content.trim()}>
                    {editingUpdate ? 'Save Changes' : 'Publish Update'}
                  </Button>
                </div>
              </Modal>
            )}

            {/* Delete Confirmation */}
            {deleteConfirmId && (
              <Modal open onClose={() => setDeleteConfirmId(null)} title="Delete Update" size="sm">
                <p className="text-sm text-t2">Are you sure you want to delete this update? This action cannot be undone.</p>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
                  <Button variant="primary" className="!bg-red-600 hover:!bg-red-700" onClick={() => handleDeleteUpdate(deleteConfirmId)}>Delete</Button>
                </div>
              </Modal>
            )}
          </>
        )
      })()}

      {/* Action Required Section - Rippling-style "Needs Your Attention" */}
      {actionItems.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <h2 className="text-xs font-semibold text-t1 uppercase tracking-wider">Needs Your Attention</h2>
            <Badge variant="warning">{actionItems.length}</Badge>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {actionItems.map((item) => (
              <div key={item.id} onClick={() => router.push(item.href)} role="link" className={cn(
                  'group flex items-center gap-4 bg-card border rounded-[var(--radius-card)] px-5 py-4 hover:shadow-sm transition-all cursor-pointer',
                  item.urgency === 'critical' ? 'border-red-200 bg-red-50/30' :
                  item.urgency === 'warning' ? 'border-amber-200 bg-amber-50/30' :
                  'border-border'
                )}>
                  <div className={cn(
                    'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center',
                    item.urgency === 'critical' ? 'bg-red-100 text-red-600' :
                    item.urgency === 'warning' ? 'bg-amber-100 text-amber-600' :
                    'bg-gray-100 text-gray-500'
                  )}>
                    {item.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{item.title}</p>
                    <p className="text-xs text-t3 mt-0.5 truncate">{item.subtitle}</p>
                  </div>
                  <ChevronRight size={16} className="text-t3 group-hover:text-t1 transition-colors flex-shrink-0" />
                </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Grid with Sparklines */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        <Card className="relative overflow-hidden group hover:shadow-md hover:border-tempo-200 transition-all cursor-pointer" onClick={() => router.push('/people')} role="link">
            <div className="flex items-start justify-between">
              <div>
                <p className="tempo-th text-t3 mb-1">{t('headcount')}</p>
                <div className="flex items-baseline gap-2">
                  <p className="tempo-stat text-2xl text-t1">{headcount}</p>
                  <TempoSparkArea data={headcountTrend} height={20} width={60} />
                </div>
                <p className="text-xs mt-1 font-medium text-t3">{activeGoals} {t('activeGoals').toLowerCase()}</p>
              </div>
              <div className="text-tempo-400 opacity-50"><Users size={24} /></div>
            </div>
          </Card>
        <StatCard href="/performance" label={t('reviewCompletion')} value={`${reviewCompletion}%`} change={`${ratedReviews.length} ${t('rated')}`} changeType="positive" icon={<TrendingUp size={24} />} />
        <StatCard href="/learning" label={t('activeLearners')} value={activeLearners} change={`${enrollments.length} ${t('enrollments')}`} changeType="neutral" icon={<GraduationCap size={24} />} />
        <StatCard href="/recruiting" label={t('openPositions')} value={openPositions} change={`${jobPostings.filter(j => j.status === 'open').reduce((a, j) => a + (j.application_count || 0), 0)} ${t('totalApplicants')}`} changeType="neutral" icon={<Briefcase size={24} />} />
        <StatCard href="/expense" label={t('pendingExpenses')} value={pendingExpenses} change={`$${expenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').reduce((a, e) => a + e.total_amount, 0).toLocaleString()}`} changeType="neutral" icon={<Receipt size={24} />} />
        <StatCard href="/mentoring" label={t('mentoringPairs')} value={activeMentoringPairs} change={`${mentoringPairs.length} ${t('total')}`} changeType="positive" icon={<UserCheck size={24} />} />
        <StatCard href="/time-attendance" label={t('pendingLeave')} value={pendingLeave.length} change={t('awaitingApproval')} changeType={pendingLeave.length > 0 ? 'negative' : 'neutral'} icon={<Clock size={24} />} />
        <StatCard href="/payroll" label={t('lastPayroll')} value={lastPayroll ? `$${(lastPayroll.total_net / 1000).toFixed(0)}K` : '-'} change={lastPayroll?.period || t('noRuns')} changeType="neutral" icon={<Banknote size={24} />} />
      </div>

      {/* AI Insights Section */}
      {aiAnomalies.length > 0 && (
        <AIAlertBanner insights={aiAnomalies} className="mb-4" />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="relative transition-opacity duration-500 ease-in-out" style={{ opacity: summaryLoading ? 0.9 : 1 }}>
          <AIInsightCard
            insight={{ id: 'ai-exec-summary', category: 'trend', severity: 'info', title: t('executiveSummary'), description: enhancedSummary.summary, confidence: 'high', confidenceScore: 90, suggestedAction: `${employees.length} active employees across the organization`, actionLabel: `${employees.length} active employees across the organization`, module: 'dashboard' }}
            onAction={() => router.push('/people')}
          />
        </div>
        <AIRecommendationList title={t('recommendedActions')} recommendations={nextActions} />
      </div>

      {/* Live Workflow Activity & Guided Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <LiveWorkflowActivity />
        <ActiveJourneysCard />
      </div>

      {/* Analytics Row - Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {/* Department Distribution */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Department Distribution</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/people')}>{tc('viewAll')}</Button>
            </div>
          </CardHeader>
          <div className="px-6 py-4 flex items-center gap-6">
            <div className="w-[130px] flex-shrink-0">
              <TempoDonutChart data={deptDistribution.map(d => ({ name: d.label, value: d.value, color: d.color }))} height={130} innerRadius="50%" outerRadius="80%" showLegend={false} />
            </div>
            <div className="flex-1 space-y-1.5">
              {deptDistribution.slice(0, 5).map((d) => (
                <div key={d.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                  <span className="text-[0.65rem] text-t2 flex-1 truncate">{d.label}</span>
                  <span className="text-[0.65rem] font-semibold text-t1">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Performance Overview */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Performance Overview</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/performance')}>{tc('viewAll')}</Button>
            </div>
          </CardHeader>
          <div className="px-6 py-4">
            <TempoBarChart
              data={[
                { name: 'On Track', count: goals.filter(g => g.status === 'on_track').length },
                { name: 'At Risk', count: goals.filter(g => g.status === 'at_risk').length },
                { name: 'Behind', count: goals.filter(g => g.status === 'behind').length },
                { name: 'Complete', count: goals.filter(g => g.status === 'completed').length },
              ]}
              bars={[{ dataKey: 'count', name: 'Goals', color: CHART_COLORS.primary }]}
              xKey="name"
              height={120}
              showGrid={false}
              showYAxis={false}
            />
          </div>
        </Card>

        {/* Quick Stats */}
        <Card padding="none">
          <CardHeader><CardTitle>Workforce Snapshot</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {[
              { label: 'Active Employees', value: employees.length, total: employees.length, color: 'bg-gray-400', href: '/people' },
              { label: 'Enrolled in Learning', value: activeLearners, total: employees.length, color: 'bg-gray-500', href: '/learning' },
              { label: 'In Mentoring', value: activeMentoringPairs * 2, total: employees.length, color: 'bg-gray-300', href: '/mentoring' },
              { label: 'Open Applications', value: applications.filter(a => a.status === 'applied' || a.status === 'screening' || a.status === 'interview').length, total: applications.length, color: 'bg-tempo-500', href: '/recruiting' },
            ].map((stat) => (
              <div key={stat.label} onClick={() => router.push(stat.href)} role="link" className="px-6 py-3 flex items-center gap-3 hover:bg-canvas/50 transition-colors cursor-pointer">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-t2">{stat.label}</span>
                      <span className="text-xs font-semibold text-t1">{stat.value}/{stat.total}</span>
                    </div>
                    <div className="w-full h-1.5 bg-canvas rounded-full overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all', stat.color)} style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-t3 flex-shrink-0" />
                </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Goals Progress */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('goalsTitle')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/performance')}>{tc('viewAll')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {goals.slice(0, 5).map((goal) => (
              <div key={goal.id} onClick={() => router.push('/performance')} role="link" className="px-6 py-3 flex items-center gap-4 hover:bg-canvas/50 transition-colors cursor-pointer">
                  <Avatar name={getEmployeeName(goal.employee_id)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-t1 truncate">{goal.title}</p>
                    <p className="text-[0.65rem] text-t3">{getEmployeeName(goal.employee_id)}</p>
                  </div>
                  <div className="w-32">
                    <Progress value={goal.progress} showLabel />
                  </div>
                  <Badge variant={goal.status === 'on_track' ? 'success' : goal.status === 'at_risk' ? 'warning' : 'error'}>
                    {goal.status.replace(/_/g, ' ')}
                  </Badge>
                  <ChevronRight size={14} className="text-t3 flex-shrink-0" />
                </div>
            ))}
            {goals.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noGoals')}</div>}
          </div>
        </Card>

        {/* Activity Feed (with automation entries) */}
        <Card padding="none">
          <CardHeader><CardTitle>{t('recentActivity')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {/* Automation entries - latest 3 workflow runs */}
            {workflowRuns
              .slice()
              .sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime())
              .slice(0, 3)
              .map(run => {
                const wf = workflows.find(w => w.id === run.workflow_id)
                const diffMs = run.completed_at
                  ? new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
                  : new Date().getTime() - new Date(run.started_at).getTime()
                const mins = Math.floor(diffMs / 60000)
                return (
                  <div key={`auto-${run.id}`} onClick={() => router.push('/workflow-studio')} role="link" className="px-6 py-3 hover:bg-canvas/50 transition-colors cursor-pointer">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Zap size={12} className="text-tempo-600" />
                      <span className="text-xs font-medium text-t1">{wf?.title || 'Workflow'}</span>
                      <Badge variant={
                        run.status === 'completed' ? 'success' :
                        run.status === 'running' ? 'info' :
                        run.status === 'failed' ? 'error' : 'default'
                      }>{run.status}</Badge>
                    </div>
                    <p className="text-[0.7rem] text-t2 ml-5">
                      {run.status === 'completed' ? `Completed in ${mins}m` :
                       run.status === 'running' ? `Running for ${mins}m` :
                       run.status === 'failed' ? 'Failed' : run.status}
                      {(run.context as unknown as Record<string, string>)?.employee_name && ` — ${(run.context as unknown as Record<string, string>).employee_name}`}
                    </p>
                    <p className="text-[0.6rem] text-t3 mt-0.5 ml-5">{new Date(run.started_at).toLocaleString()}</p>
                  </div>
                )
              })}
            {/* Standard audit log entries */}
            {auditLog.length > 0 ? auditLog.slice(0, 5).map((entry) => {
              const et = entry.entity_type.toLowerCase()
              const entryHref = et.includes('review') || et.includes('goal') || et.includes('feedback') ? '/performance' : et.includes('payroll') || et.includes('payrun') ? '/payroll' : et.includes('leave') ? '/time-attendance' : et.includes('expense') ? '/expense' : et.includes('job') || et.includes('candidate') || et.includes('application') ? '/recruiting' : null
              const Inner = (
                <div className={cn('px-6 py-3', entryHref && 'hover:bg-canvas/50 transition-colors cursor-pointer')}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-t1">{entry.user}</span>
                    <Badge variant="default">{entry.action}</Badge>
                  </div>
                  <p className="text-[0.7rem] text-t2 line-clamp-1">{entry.details}</p>
                  <p className="text-[0.6rem] text-t3 mt-0.5">{new Date(entry.timestamp).toLocaleString()}</p>
                </div>
              )
              return entryHref ? <div key={entry.id} onClick={() => router.push(entryHref)} role="link">{Inner}</div> : <div key={entry.id}>{Inner}</div>
            }) : feedback.slice(0, 5).map((fb) => (
              <div key={fb.id} onClick={() => router.push('/performance')} role="link" className="cursor-pointer">
                <div className="px-6 py-3 hover:bg-canvas/50 transition-colors cursor-pointer">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar name={getEmployeeName(fb.from_id)} size="xs" />
                    <span className="text-xs font-medium text-t1">{getEmployeeName(fb.from_id)}</span>
                    <span className="text-[0.65rem] text-t3">
                      {fb.type === 'recognition' ? t('recognized') : fb.type === 'feedback' ? t('gaveFeedback') : t('checkedIn')}
                    </span>
                    <span className="text-xs font-medium text-t1">{getEmployeeName(fb.to_id)}</span>
                  </div>
                  <p className="text-[0.7rem] text-t2 line-clamp-2 ml-8">{fb.content}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Leave Requests */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('pendingLeaveRequests')}</CardTitle>
              <Badge variant="warning">{pendingLeave.length}</Badge>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {pendingLeave.map((lr) => (
              <div key={lr.id} className="px-6 py-3 flex items-center gap-3">
                <Avatar name={getEmployeeName(lr.employee_id)} size="sm" />
                <div className="flex-1">
                  <p className="text-xs font-medium text-t1">{getEmployeeName(lr.employee_id)}</p>
                  <p className="text-[0.65rem] text-t3">{lr.type} - {lr.days} days ({lr.start_date})</p>
                </div>
                <div className="flex gap-1">
                  <Button variant="primary" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'approved', approved_by: currentEmployeeId })}>{tc('approve')}</Button>
                  <Button variant="ghost" size="sm" onClick={() => updateLeaveRequest(lr.id, { status: 'rejected' })}>{tc('deny')}</Button>
                </div>
              </div>
            ))}
            {pendingLeave.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noPending')}</div>}
          </div>
        </Card>

        {/* Open Positions */}
        <Card padding="none" className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('openPositionsTitle')}</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push('/recruiting')}>{tc('viewAll')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {jobPostings.filter(j => j.status === 'open').map((job) => (
              <div key={job.id} onClick={() => router.push('/recruiting')} role="link" className="px-6 py-3 flex items-center gap-4 hover:bg-canvas/50 transition-colors cursor-pointer">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <Briefcase size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-medium text-t1">{job.title}</p>
                    <p className="text-[0.65rem] text-t3">{job.location}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-t1">{job.application_count} {t('applicants')}</p>
                    <p className="text-[0.65rem] text-t3">{job.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Badge variant="orange">{tc('open')}</Badge>
                  <ChevronRight size={14} className="text-t3 flex-shrink-0" />
                </div>
            ))}
            {jobPostings.filter(j => j.status === 'open').length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">{t('noOpenPositions')}</div>}
          </div>
        </Card>
      </div>

      {/* Team Celebrations - HiBob style */}
      <div className="mt-6">
        <Card padding="none">
          <div className="px-6 py-3 flex items-center justify-between border-b border-divider">
            <div className="flex items-center gap-2">
              <PartyPopper size={14} className="text-tempo-600" />
              <h3 className="text-xs font-semibold text-t1 uppercase tracking-wider">Celebrations & Milestones</h3>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-divider">
            {/* Birthdays */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Cake size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-t1">Upcoming Birthdays</span>
              </div>
              {(() => {
                const empsWithBirthdays = employees.filter((emp: Record<string, unknown>) => emp.date_of_birth)
                if (empsWithBirthdays.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Cake size={20} className="mx-auto text-t3 mb-2" />
                      <p className="text-xs text-t3">No upcoming birthdays</p>
                      <p className="text-[0.6rem] text-t3 mt-0.5">Employee birth dates are not yet configured.</p>
                    </div>
                  )
                }
                const now = new Date()
                const currentMonth = now.getMonth()
                const currentDay = now.getDate()
                return (
                  <div className="space-y-2">
                    {empsWithBirthdays.slice(0, 3).map((emp: Record<string, unknown>) => {
                      const bd = new Date(emp.date_of_birth as string)
                      const month = bd.toLocaleDateString('en-US', { month: 'short' })
                      const day = bd.getDate()
                      return (
                        <div key={`bday-${emp.id}`} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                          <Avatar name={(emp.profile as Record<string, string>)?.full_name || (emp.id as string)} size="sm" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-t1">{(emp.profile as Record<string, string>)?.full_name}</p>
                            <p className="text-[0.65rem] text-t3">{month} {day}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
            {/* Work Anniversaries */}
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award size={14} className="text-gray-400" />
                <span className="text-xs font-semibold text-t1">Work Anniversaries</span>
              </div>
              {(() => {
                const empsWithHireDate = employees.filter((emp: Record<string, unknown>) => emp.hire_date)
                if (empsWithHireDate.length === 0) {
                  return (
                    <div className="text-center py-6">
                      <Award size={20} className="mx-auto text-t3 mb-2" />
                      <p className="text-xs text-t3">No upcoming work anniversaries</p>
                      <p className="text-[0.6rem] text-t3 mt-0.5">Employee hire dates are not yet configured.</p>
                    </div>
                  )
                }
                const now = new Date()
                return (
                  <div className="space-y-2">
                    {empsWithHireDate.slice(0, 3).map((emp: Record<string, unknown>) => {
                      const hd = new Date(emp.hire_date as string)
                      const years = Math.floor((now.getTime() - hd.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
                      return (
                        <div key={`anni-${emp.id}`} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                          <Avatar name={(emp.profile as Record<string, string>)?.full_name || (emp.id as string)} size="sm" />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-t1">{(emp.profile as Record<string, string>)?.full_name}</p>
                            <p className="text-[0.65rem] text-t3">{years > 0 ? `${years} year${years > 1 ? 's' : ''}` : 'Less than a year'}</p>
                          </div>
                          {years > 0 && <Badge variant="success">{years}y</Badge>}
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>
        </Card>
      </div>
    </>
  )
}
