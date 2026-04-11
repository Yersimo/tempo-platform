'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { TempoDonutChart, TempoBarChart, CHART_COLORS } from '@/components/ui/charts'
import { useTempo } from '@/lib/store'
import { cn } from '@/lib/utils/cn'
import {
  Route, Play, CheckCircle, Clock, Plus, Search, ChevronRight,
  Layers, FileText, ArrowRight,
  Shield, Heart, TrendingUp, UserPlus, UserMinus,
  Trash2, Edit3, Eye, ListChecks, X, ChevronDown, ChevronUp,
  Calendar, Target, Zap, Award, Send, Sparkles, AlertTriangle, Bell,
} from 'lucide-react'
import type { JourneyStep } from '@/lib/demo-data'

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  onboarding: <UserPlus size={18} />,
  performance: <TrendingUp size={18} />,
  benefits: <Heart size={18} />,
  compliance: <Shield size={18} />,
  career: <Award size={18} />,
  offboarding: <UserMinus size={18} />,
  custom: <Layers size={18} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  onboarding: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  performance: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  benefits: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  compliance: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  career: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  offboarding: 'bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300',
  custom: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
}

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'info'> = {
  not_started: 'info',
  in_progress: 'warning',
  completed: 'success',
}

const STEP_TYPE_ICONS: Record<string, React.ReactNode> = {
  task: <ListChecks size={14} />,
  form: <FileText size={14} />,
  review: <Eye size={14} />,
  approval: <CheckCircle size={14} />,
  info: <Sparkles size={14} />,
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'completed', label: 'Completed' },
]

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'All Categories' },
  { value: 'onboarding', label: 'Onboarding' },
  { value: 'performance', label: 'Performance' },
  { value: 'benefits', label: 'Benefits' },
  { value: 'compliance', label: 'Compliance' },
  { value: 'career', label: 'Career' },
  { value: 'offboarding', label: 'Offboarding' },
]

const CATEGORY_OPTIONS = CATEGORY_FILTER_OPTIONS.filter(o => o.value !== 'all').concat([{ value: 'custom', label: 'Custom' }])

const STEP_TYPE_OPTIONS = [
  { value: 'task', label: 'Task' },
  { value: 'form', label: 'Form' },
  { value: 'review', label: 'Review' },
  { value: 'approval', label: 'Approval' },
  { value: 'info', label: 'Info' },
]

export default function JourneysPage() {
  const {
    journeys, addJourney, deleteJourney, updateJourneyStep,
    journeyTemplates, addJourneyTemplate, updateJourneyTemplate, deleteJourneyTemplate,
    employees, getEmployeeName, currentEmployeeId, addToast,
    addPlatformEvent,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('active')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')

  const [showAssignModal, setShowAssignModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<any>(null)
  const [showBuilderModal, setShowBuilderModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<any>(null)

  const [assignForm, setAssignForm] = useState({
    template_id: '', employee_ids: [] as string[], due_date: '',
  })

  const [templateForm, setTemplateForm] = useState({
    title: '', description: '', category: 'custom' as string, type: '',
    estimated_days: 14, auto_assign: false, trigger_event: '',
    steps: [{ id: 'new-1', title: '', description: '', type: 'task' as string, action_href: '' }],
  })

  const allJourneys = journeys || []
  const allTemplates = journeyTemplates || []

  const active = allJourneys.filter(j => j.status === 'in_progress')
  const completed = allJourneys.filter(j => j.status === 'completed')
  const notStarted = allJourneys.filter(j => j.status === 'not_started')
  const avgCompletion = allJourneys.length > 0
    ? Math.round(allJourneys.reduce((sum, j) => {
        const done = j.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length
        return sum + (done / j.steps.length) * 100
      }, 0) / allJourneys.length)
    : 0

  const filtered = useMemo(() => {
    return allJourneys.filter(j => {
      if (search && !j.title.toLowerCase().includes(search.toLowerCase())) return false
      if (statusFilter !== 'all' && j.status !== statusFilter) return false
      if (categoryFilter !== 'all' && j.category !== categoryFilter) return false
      return true
    })
  }, [allJourneys, search, statusFilter, categoryFilter])

  const handleAssign = () => {
    const template = allTemplates.find(t => t.id === assignForm.template_id)
    if (!template || assignForm.employee_ids.length === 0) return

    assignForm.employee_ids.forEach(empId => {
      addJourney({
        type: template.type,
        title: `${template.title} — ${getEmployeeName(empId)}`,
        description: template.description,
        employee_id: empId,
        assigned_by: currentEmployeeId,
        template_id: template.id,
        category: template.category,
        due_date: assignForm.due_date || null,
        steps: template.steps.map((s: any, i: number) => ({
          ...s, id: `js-new-${Date.now()}-${i}`, status: 'pending',
        })),
      })
    })

    addToast(`Journey assigned to ${assignForm.employee_ids.length} employee(s)`)
    setShowAssignModal(false)
    setAssignForm({ template_id: '', employee_ids: [], due_date: '' })
  }

  const handleSaveTemplate = () => {
    if (!templateForm.title) return
    const steps = templateForm.steps.filter(s => s.title.trim())
    if (steps.length === 0) return

    if (editingTemplate) {
      updateJourneyTemplate(editingTemplate.id, { ...templateForm, steps })
    } else {
      addJourneyTemplate({ ...templateForm, steps, created_by: currentEmployeeId })
    }

    setShowBuilderModal(false)
    setEditingTemplate(null)
    resetTemplateForm()
  }

  const resetTemplateForm = () => {
    setTemplateForm({
      title: '', description: '', category: 'custom', type: '',
      estimated_days: 14, auto_assign: false, trigger_event: '',
      steps: [{ id: 'new-1', title: '', description: '', type: 'task', action_href: '' }],
    })
  }

  const openEditTemplate = (t: any) => {
    setEditingTemplate(t)
    setTemplateForm({
      title: t.title, description: t.description, category: t.category, type: t.type,
      estimated_days: t.estimated_days, auto_assign: t.auto_assign, trigger_event: t.trigger_event || '',
      steps: t.steps.map((s: any) => ({ ...s })),
    })
    setShowBuilderModal(true)
  }

  const addStep = () => {
    setTemplateForm(f => ({
      ...f,
      steps: [...f.steps, { id: `new-${Date.now()}`, title: '', description: '', type: 'task', action_href: '' }],
    }))
  }

  const removeStep = (idx: number) => {
    setTemplateForm(f => ({ ...f, steps: f.steps.filter((_, i) => i !== idx) }))
  }

  const updateStep = (idx: number, key: string, value: string) => {
    setTemplateForm(f => ({
      ...f,
      steps: f.steps.map((s, i) => i === idx ? { ...s, [key]: value } : s),
    }))
  }

  const moveStep = (idx: number, dir: 'up' | 'down') => {
    setTemplateForm(f => {
      const steps = [...f.steps]
      const target = dir === 'up' ? idx - 1 : idx + 1
      if (target < 0 || target >= steps.length) return f
      ;[steps[idx], steps[target]] = [steps[target], steps[idx]]
      return { ...f, steps }
    })
  }

  const toggleEmployeeSelection = (empId: string) => {
    setAssignForm(f => ({
      ...f,
      employee_ids: f.employee_ids.includes(empId)
        ? f.employee_ids.filter(id => id !== empId)
        : [...f.employee_ids, empId],
    }))
  }

  const statusDistribution = useMemo(() => [
    { name: 'In Progress', value: active.length },
    { name: 'Completed', value: completed.length },
    { name: 'Not Started', value: notStarted.length },
  ], [active.length, completed.length, notStarted.length])

  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {}
    allJourneys.forEach(j => {
      const cat = j.category || j.type.replace(/_/g, ' ')
      counts[cat] = (counts[cat] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [allJourneys])

  const templateOptions = useMemo(() =>
    [{ value: '', label: 'Select template...' }, ...allTemplates.filter(t => t.is_active).map(t => ({ value: t.id, label: `${t.title} (${t.steps.length} steps, ~${t.estimated_days}d)` }))],
  [allTemplates])

  const tabs = [
    { id: 'active', label: 'Active Journeys', count: active.length + notStarted.length },
    { id: 'completed', label: 'Completed', count: completed.length },
    { id: 'templates', label: 'Templates', count: allTemplates.length },
    { id: 'analytics', label: 'Analytics' },
  ]

  // Compute overdue tasks across active journeys
  const overdueItems = useMemo(() => {
    const now = new Date()
    const items: { journeyId: string; journeyTitle: string; employeeId: string; stepTitle: string; dueDate: string; daysOverdue: number }[] = []
    allJourneys.forEach(j => {
      if (j.status === 'completed') return
      if (!j.due_date) return
      j.steps.forEach((s: any) => {
        if (s.status === 'completed' || s.status === 'skipped') return
        const dueDate = new Date(j.due_date as string)
        if (dueDate < now) {
          const daysOverdue = Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          items.push({
            journeyId: j.id,
            journeyTitle: j.title,
            employeeId: j.employee_id,
            stepTitle: s.title,
            dueDate: j.due_date as string,
            daysOverdue,
          })
        }
      })
    })
    return items.sort((a, b) => b.daysOverdue - a.daysOverdue)
  }, [allJourneys])

  const displayJourneys = activeTab === 'completed'
    ? allJourneys.filter(j => j.status === 'completed')
    : activeTab === 'active'
    ? filtered.filter(j => j.status !== 'completed')
    : filtered

  return (
    <div className="p-6 space-y-6">
      <Header
        title="Guided Journeys"
        subtitle="Design, assign, and track guided employee journeys across the lifecycle"
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => { resetTemplateForm(); setEditingTemplate(null); setShowBuilderModal(true) }} className="gap-2">
              <Plus size={16} /> New Template
            </Button>
            <Button onClick={() => setShowAssignModal(true)} className="gap-2">
              <Send size={16} /> Assign Journey
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Journeys" value={active.length} icon={<Play size={20} />} />
        <StatCard label="Not Started" value={notStarted.length} icon={<Clock size={20} />} />
        <StatCard label="Completed" value={completed.length} icon={<CheckCircle size={20} />} />
        <StatCard label="Avg. Completion" value={`${avgCompletion}%`} icon={<Target size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'templates' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {allTemplates.map(t => (
            <Card key={t.id} className="hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', CATEGORY_COLORS[t.category] || CATEGORY_COLORS.custom)}>
                    {CATEGORY_ICONS[t.category] || CATEGORY_ICONS.custom}
                  </div>
                  <div className="flex items-center gap-1">
                    {t.auto_assign && <Badge variant="info" className="text-xs gap-1"><Zap size={10} /> Auto</Badge>}
                    <Badge variant={t.is_active ? 'success' : 'default'}>
                      {t.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
                <h4 className="font-semibold text-sm">{t.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{t.description}</p>
                <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><ListChecks size={12} /> {t.steps.length} steps</span>
                  <span className="flex items-center gap-1"><Calendar size={12} /> {t.estimated_days}d</span>
                  <span className="capitalize">{t.category}</span>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" className="flex-1 h-8 text-xs gap-1" onClick={() => { setAssignForm(f => ({ ...f, template_id: t.id })); setShowAssignModal(true) }}>
                    <Send size={12} /> Assign
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => openEditTemplate(t)}>
                    <Edit3 size={14} />
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500" onClick={() => deleteJourneyTemplate(t.id)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          <Card className="border-dashed hover:shadow-md transition-shadow cursor-pointer flex items-center justify-center min-h-[200px]" onClick={() => { resetTemplateForm(); setEditingTemplate(null); setShowBuilderModal(true) }}>
            <div className="text-center p-6">
              <Plus size={32} className="mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-medium">Create Template</p>
              <p className="text-xs text-muted-foreground">Build a reusable journey blueprint</p>
            </div>
          </Card>
        </div>
      ) : activeTab === 'analytics' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Journey Status Distribution</CardTitle></CardHeader>
            <div className="p-4">
              <TempoDonutChart data={statusDistribution} height={250} />
            </div>
          </Card>
          <Card>
            <CardHeader><CardTitle>Journeys by Category</CardTitle></CardHeader>
            <div className="p-4">
              <TempoBarChart
                data={categoryDistribution}
                bars={[{ dataKey: 'value', name: 'Journeys', color: CHART_COLORS.primary }]}
                xKey="name"
                height={250}
              />
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Completion Metrics</CardTitle></CardHeader>
            <div className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-4 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                  <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{allJourneys.length}</p>
                  <p className="text-sm text-muted-foreground">Total Journeys</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/20">
                  <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">{completed.length}</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-teal-50 dark:bg-teal-950/20">
                  <p className="text-2xl font-bold text-teal-800 dark:text-teal-300">{active.length}</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-slate-50 dark:bg-slate-950/20">
                  <p className="text-2xl font-bold">{notStarted.length}</p>
                  <p className="text-sm text-muted-foreground">Not Started</p>
                </div>
                <div className="text-center p-4 rounded-lg bg-violet-50 dark:bg-violet-950/20">
                  <p className="text-2xl font-bold text-violet-700 dark:text-violet-300">{avgCompletion}%</p>
                  <p className="text-sm text-muted-foreground">Avg Completion</p>
                </div>
              </div>
            </div>
          </Card>
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Template Usage</CardTitle></CardHeader>
            <div className="p-4">
              <div className="space-y-3">
                {allTemplates.map(t => {
                  const usage = allJourneys.filter(j => j.template_id === t.id || j.type === t.type).length
                  const completedUsage = allJourneys.filter(j => (j.template_id === t.id || j.type === t.type) && j.status === 'completed').length
                  return (
                    <div key={t.id} className="flex items-center gap-4">
                      <div className={cn('w-8 h-8 rounded flex items-center justify-center shrink-0', CATEGORY_COLORS[t.category] || CATEGORY_COLORS.custom)}>
                        {CATEGORY_ICONS[t.category] || CATEGORY_ICONS.custom}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium truncate">{t.title}</p>
                          <span className="text-xs text-muted-foreground">{usage} assigned, {completedUsage} completed</span>
                        </div>
                        <Progress value={usage > 0 ? (completedUsage / usage) * 100 : 0} className="mt-1 h-2" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input placeholder="Search journeys..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} options={STATUS_FILTER_OPTIONS} />
            <Select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} options={CATEGORY_FILTER_OPTIONS} />
          </div>

          {/* Overdue Alerts */}
          {activeTab === 'active' && overdueItems.length > 0 && (
            <Card className="border-red-200 dark:border-red-900/50 bg-red-50/50 dark:bg-red-950/10 mb-4">
              <div className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={16} className="text-red-600 dark:text-red-400" />
                  <h3 className="text-sm font-semibold text-red-700 dark:text-red-300">Overdue Alerts</h3>
                  <Badge variant="error">{overdueItems.length} overdue task{overdueItems.length !== 1 ? 's' : ''}</Badge>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {overdueItems.slice(0, 10).map((item, idx) => (
                    <div key={`${item.journeyId}-${idx}`} className="flex items-center justify-between gap-3 p-2 rounded-lg bg-white dark:bg-gray-900/50 border border-red-100 dark:border-red-900/30">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <Avatar name={getEmployeeName(item.employeeId)} size="xs" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-t1 truncate">{getEmployeeName(item.employeeId)}</p>
                          <p className="text-xs text-t3 truncate">{item.stepTitle} &middot; {item.journeyTitle}</p>
                        </div>
                      </div>
                      <Badge variant="error" className="shrink-0">{item.daysOverdue}d overdue</Badge>
                      <div className="flex gap-1 shrink-0">
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => {
                          addToast(`Reminder sent to ${getEmployeeName(item.employeeId)}`)
                          addPlatformEvent?.({
                            type: 'journey.reminder',
                            title: 'Overdue Task Reminder',
                            summary: `Reminder sent for "${item.stepTitle}" to ${getEmployeeName(item.employeeId)}`,
                            link: '/journeys',
                          })
                        }}>
                          <Send size={12} /> Send Reminder
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 text-teal-700 dark:text-teal-400" onClick={() => {
                          addToast(`Task escalated to manager for ${getEmployeeName(item.employeeId)}`)
                          addPlatformEvent?.({
                            type: 'journey.escalation',
                            title: 'Overdue Task Escalated',
                            summary: `"${item.stepTitle}" escalated to manager for ${getEmployeeName(item.employeeId)} (${item.daysOverdue} days overdue)`,
                            link: '/journeys',
                          })
                        }}>
                          <Bell size={12} /> Escalate to Manager
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          )}

          <div className="space-y-4">
            {displayJourneys.length === 0 ? (
              <Card className="p-12 text-center">
                <Route size={48} className="mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No journeys found</p>
                <Button variant="outline" className="mt-4 gap-2" onClick={() => setShowAssignModal(true)}>
                  <Plus size={16} /> Assign a Journey
                </Button>
              </Card>
            ) : (
              displayJourneys.map(j => {
                const completedSteps = j.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length
                const progress = Math.round((completedSteps / j.steps.length) * 100)
                const nextStep = j.steps.find((s: any) => s.status !== 'completed' && s.status !== 'skipped')
                const category = j.category || j.type.split('_')[0]

                return (
                  <Card key={j.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setShowDetailModal(j)}>
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                          <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center shrink-0', CATEGORY_COLORS[category] || CATEGORY_COLORS.custom)}>
                            {CATEGORY_ICONS[category] || CATEGORY_ICONS.custom}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-semibold text-sm">{j.title}</h4>
                              <Badge variant={STATUS_VARIANT[j.status] || 'info'}>
                                {j.status.replace(/_/g, ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <Avatar name={getEmployeeName(j.employee_id)} size="xs" />
                              <span className="text-sm text-muted-foreground">{getEmployeeName(j.employee_id)}</span>
                              {j.due_date && (
                                <span className="text-xs text-muted-foreground">Due: {new Date(j.due_date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{j.description}</p>
                            <div className="flex items-center gap-3 mt-3">
                              <Progress value={progress} className="flex-1 h-2" />
                              <span className="text-xs font-medium">{completedSteps}/{j.steps.length}</span>
                            </div>
                            {nextStep && j.status !== 'completed' && (
                              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                <ArrowRight size={12} /> Next: {nextStep.title}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); deleteJourney(j.id) }}>
                            <Trash2 size={14} className="text-red-500" />
                          </Button>
                          <ChevronRight size={16} className="text-muted-foreground" />
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        </>
      )}

      {/* Journey Detail Modal */}
      <Modal open={!!showDetailModal} title={showDetailModal?.title} onClose={() => setShowDetailModal(null)} size="lg">
        {showDetailModal && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Avatar name={getEmployeeName(showDetailModal.employee_id)} size="md" />
              <div>
                <p className="font-medium">{getEmployeeName(showDetailModal.employee_id)}</p>
                <p className="text-sm text-muted-foreground">Assigned by {getEmployeeName(showDetailModal.assigned_by)}</p>
                {showDetailModal.due_date && (
                  <p className="text-sm text-muted-foreground">Due: {new Date(showDetailModal.due_date).toLocaleDateString()}</p>
                )}
              </div>
              <Badge variant={STATUS_VARIANT[showDetailModal.status] || 'info'} className="ml-auto">
                {showDetailModal.status.replace(/_/g, ' ')}
              </Badge>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Progress</span>
                <span>{showDetailModal.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length}/{showDetailModal.steps.length} steps</span>
              </div>
              <Progress value={(showDetailModal.steps.filter((s: any) => s.status === 'completed' || s.status === 'skipped').length / showDetailModal.steps.length) * 100} className="h-3" />
            </div>

            <div className="space-y-3">
              {showDetailModal.steps.map((step: JourneyStep, idx: number) => (
                <div key={step.id} className={cn(
                  'flex items-start gap-3 p-3 rounded-lg border',
                  step.status === 'completed' ? 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900' :
                  step.status === 'in_progress' ? 'bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900' :
                  step.status === 'skipped' ? 'bg-slate-50 dark:bg-slate-950/20 border-slate-200 dark:border-slate-800 opacity-60' :
                  'border-border'
                )}>
                  <div className="flex items-center gap-2 shrink-0 mt-0.5">
                    <span className="text-xs font-medium text-muted-foreground w-5 text-right">{idx + 1}</span>
                    {step.status === 'completed' ? <CheckCircle size={18} className="text-emerald-600" /> :
                     step.status === 'in_progress' ? <Play size={18} className="text-blue-600" /> :
                     step.status === 'skipped' ? <X size={18} className="text-slate-400" /> :
                     <Clock size={18} className="text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{step.title}</p>
                      <Badge variant="info" className="text-xs gap-1">
                        {STEP_TYPE_ICONS[step.type]} {step.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                  {step.status !== 'completed' && step.status !== 'skipped' && (
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                        updateJourneyStep(showDetailModal.id, step.id, 'completed')
                        setShowDetailModal({
                          ...showDetailModal,
                          steps: showDetailModal.steps.map((s: any) => s.id === step.id ? { ...s, status: 'completed' } : s),
                        })
                      }}>Complete</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                        updateJourneyStep(showDetailModal.id, step.id, 'skipped')
                        setShowDetailModal({
                          ...showDetailModal,
                          steps: showDetailModal.steps.map((s: any) => s.id === step.id ? { ...s, status: 'skipped' } : s),
                        })
                      }}>Skip</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Assign Journey Modal */}
      <Modal open={showAssignModal} title="Assign Journey" onClose={() => setShowAssignModal(false)}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Journey Template</label>
            <Select value={assignForm.template_id} onChange={e => setAssignForm(f => ({ ...f, template_id: e.target.value }))} options={templateOptions} />
          </div>
          <div>
            <label className="text-sm font-medium">Select Employees ({assignForm.employee_ids.length} selected)</label>
            <div className="border rounded-lg max-h-48 overflow-y-auto mt-1">
              {(employees || []).map((emp: any) => (
                <label key={emp.id} className="flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer border-b last:border-b-0">
                  <input
                    type="checkbox"
                    checked={assignForm.employee_ids.includes(emp.id)}
                    onChange={() => toggleEmployeeSelection(emp.id)}
                    className="rounded"
                  />
                  <Avatar name={emp.profile?.full_name} size="xs" />
                  <span className="text-sm">{emp.profile?.full_name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">{emp.job_title}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Due Date (optional)</label>
            <Input type="date" value={assignForm.due_date} onChange={e => setAssignForm(f => ({ ...f, due_date: e.target.value }))} />
          </div>
          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleAssign} disabled={!assignForm.template_id || assignForm.employee_ids.length === 0}>
              Assign to {assignForm.employee_ids.length} Employee{assignForm.employee_ids.length !== 1 ? 's' : ''}
            </Button>
            <Button variant="outline" onClick={() => setShowAssignModal(false)}>Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Template Builder Modal */}
      <Modal open={showBuilderModal} title={editingTemplate ? 'Edit Journey Template' : 'Create Journey Template'} onClose={() => { setShowBuilderModal(false); setEditingTemplate(null) }} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input value={templateForm.title} onChange={e => setTemplateForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g., New Hire Onboarding" />
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <Select value={templateForm.category} onChange={e => setTemplateForm(f => ({ ...f, category: e.target.value }))} options={CATEGORY_OPTIONS} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea value={templateForm.description} onChange={e => setTemplateForm(f => ({ ...f, description: e.target.value }))} rows={2} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Type Key</label>
              <Input value={templateForm.type} onChange={e => setTemplateForm(f => ({ ...f, type: e.target.value }))} placeholder="e.g., new_hire_onboarding" />
            </div>
            <div>
              <label className="text-sm font-medium">Est. Duration (days)</label>
              <Input type="number" value={templateForm.estimated_days} onChange={e => setTemplateForm(f => ({ ...f, estimated_days: parseInt(e.target.value) || 14 }))} />
            </div>
            <div>
              <label className="text-sm font-medium">Trigger Event</label>
              <Input value={templateForm.trigger_event} onChange={e => setTemplateForm(f => ({ ...f, trigger_event: e.target.value }))} placeholder="e.g., employee_hired" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="auto-assign" checked={templateForm.auto_assign} onChange={e => setTemplateForm(f => ({ ...f, auto_assign: e.target.checked }))} className="rounded" />
            <label htmlFor="auto-assign" className="text-sm">Auto-assign when trigger event occurs</label>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium">Steps ({templateForm.steps.length})</label>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={addStep}>
                <Plus size={12} /> Add Step
              </Button>
            </div>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {templateForm.steps.map((step, idx) => (
                <div key={step.id} className="flex items-start gap-2 p-3 rounded-lg border">
                  <div className="flex flex-col gap-1 shrink-0 mt-1">
                    <button onClick={() => moveStep(idx, 'up')} disabled={idx === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronUp size={14} />
                    </button>
                    <span className="text-xs text-center font-medium text-muted-foreground">{idx + 1}</span>
                    <button onClick={() => moveStep(idx, 'down')} disabled={idx === templateForm.steps.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input placeholder="Step title" value={step.title} onChange={e => updateStep(idx, 'title', e.target.value)} />
                    <Input placeholder="Step description" value={step.description} onChange={e => updateStep(idx, 'description', e.target.value)} />
                    <div className="flex gap-2">
                      <Select value={step.type} onChange={e => updateStep(idx, 'type', e.target.value)} className="w-32" options={STEP_TYPE_OPTIONS} />
                      <Input placeholder="Link (e.g., /learning)" value={step.action_href || ''} onChange={e => updateStep(idx, 'action_href', e.target.value)} className="flex-1" />
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-red-500 shrink-0 mt-1" onClick={() => removeStep(idx)}>
                    <Trash2 size={14} />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button className="flex-1" onClick={handleSaveTemplate} disabled={!templateForm.title || templateForm.steps.filter(s => s.title.trim()).length === 0}>
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
            <Button variant="outline" onClick={() => { setShowBuilderModal(false); setEditingTemplate(null) }}>Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
