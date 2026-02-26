'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  Plus, FolderKanban, ListChecks, Target, AlertTriangle,
  Calendar, Pencil, Trash2, ChevronRight, Clock, Users,
  Zap, Play, Pause, CheckCircle2, XCircle, ArrowRight, Lightbulb
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { scoreProjectHealth, predictTimelineRisk, detectResourceBottlenecks, suggestAutomationRules } from '@/lib/ai-engine'
import { demoAutomationLog } from '@/lib/demo-data'
import { useAI } from '@/lib/use-ai'

export default function ProjectsPage() {
  const {
    projects, milestones, tasks, taskDependencies, employees,
    automationRules, automationLog,
    addProject, updateProject, deleteProject,
    addMilestone, addTask, updateTask, deleteTask,
    addAutomationRule, updateAutomationRule, toggleAutomationRule,
    getEmployeeName, currentEmployeeId,
  } = useTempo()

  const t = useTranslations('projects')
  const tc = useTranslations('common')

  const [activeTab, setActiveTab] = useState('list')

  // Project modal
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [editingProject, setEditingProject] = useState<string | null>(null)
  const [projectForm, setProjectForm] = useState({
    title: '', description: '', status: 'planning' as string, owner_id: '',
    start_date: '', end_date: '', budget: 0, currency: 'USD',
  })

  // Task modal
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editingTask, setEditingTask] = useState<string | null>(null)
  const [taskForm, setTaskForm] = useState({
    title: '', description: '', status: 'todo' as string, priority: 'medium' as string,
    assignee_id: '', project_id: '', due_date: '', estimated_hours: 0,
  })

  // Milestone modal
  const [showMilestoneModal, setShowMilestoneModal] = useState(false)
  const [milestoneForm, setMilestoneForm] = useState({
    title: '', project_id: '', due_date: '', status: 'pending' as string,
  })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)

  // Automation rule modal
  const [showRuleModal, setShowRuleModal] = useState(false)
  const [ruleForm, setRuleForm] = useState({
    name: '', description: '', project_id: '' as string | null,
    triggerType: 'status_change' as string, triggerValue: '',
    actionType: 'assign_to' as string, actionValue: '', actionLabel: '',
  })

  const tabs = [
    { id: 'list', label: t('tabList'), count: projects.length },
    { id: 'kanban', label: t('tabKanban') },
    { id: 'timeline', label: t('tabTimeline'), count: milestones.length },
    { id: 'tasks', label: t('tabMyTasks'), count: tasks.filter(t => t.assignee_id === currentEmployeeId).length },
    { id: 'sprints', label: 'Sprints' },
    { id: 'capacity', label: 'Capacity' },
    { id: 'automations', label: t('tabAutomations'), count: automationRules.filter(r => r.is_active).length },
  ]

  // Stats
  const activeProjects = projects.filter(p => p.status === 'active' || p.status === 'planning').length
  const activeTasks = tasks.filter(t => t.status !== 'done').length
  const completedTasks = tasks.filter(t => t.status === 'done').length
  const completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
  const overdueTasks = tasks.filter(t => t.status !== 'done' && t.due_date && new Date(t.due_date) < new Date()).length

  // AI insights
  const projectHealthScores = useMemo(() => {
    const scores: Record<string, ReturnType<typeof scoreProjectHealth>> = {}
    for (const project of projects) {
      const projectMilestones = milestones.filter(m => m.project_id === project.id)
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      scores[project.id] = scoreProjectHealth(project, projectMilestones, projectTasks)
    }
    return scores
  }, [projects, milestones, tasks])

  const timelineRisks = useMemo(() => {
    const risks: Record<string, ReturnType<typeof predictTimelineRisk>> = {}
    for (const project of projects) {
      const projectTasks = tasks.filter(t => t.project_id === project.id)
      risks[project.id] = predictTimelineRisk(project, projectTasks)
    }
    return risks
  }, [projects, tasks])

  const resourceBottlenecks = useMemo(() =>
    detectResourceBottlenecks(tasks, employees),
    [tasks, employees]
  )

  const automationSuggestions = useMemo(() =>
    suggestAutomationRules(tasks, automationLog),
    [tasks, automationLog]
  )

  // Claude AI enhancement
  const { result: enhancedBottlenecks, isLoading: bottlenecksLoading } = useAI({
    action: 'enhanceProjectHealth',
    data: { projects: projects.length, tasks: tasks.length, overdue: overdueTasks },
    fallback: resourceBottlenecks,
    enabled: resourceBottlenecks.length > 0,
    cacheKey: `projects-bottlenecks-${tasks.length}`,
  })

  // Kanban columns
  const kanbanStatuses = ['todo', 'in_progress', 'review', 'done'] as const

  // CRUD handlers
  function openNewProject() {
    setEditingProject(null)
    setProjectForm({ title: '', description: '', status: 'planning', owner_id: employees[0]?.id || '', start_date: '', end_date: '', budget: 0, currency: 'USD' })
    setShowProjectModal(true)
  }

  function openEditProject(id: string) {
    const p = projects.find(x => x.id === id)
    if (!p) return
    setEditingProject(id)
    setProjectForm({
      title: p.title, description: p.description || '', status: p.status,
      owner_id: p.owner_id, start_date: p.start_date, end_date: p.end_date,
      budget: p.budget || 0, currency: p.currency || 'USD',
    })
    setShowProjectModal(true)
  }

  function submitProject() {
    if (!projectForm.title) return
    const data = {
      title: projectForm.title,
      description: projectForm.description || null,
      status: projectForm.status,
      owner_id: projectForm.owner_id || currentEmployeeId,
      start_date: projectForm.start_date || new Date().toISOString().split('T')[0],
      end_date: projectForm.end_date || `${new Date().getFullYear()}-12-31`,
      budget: projectForm.budget || null,
      currency: projectForm.currency,
    }
    if (editingProject) {
      updateProject(editingProject, data)
    } else {
      addProject(data)
    }
    setShowProjectModal(false)
  }

  function openNewTask() {
    setEditingTask(null)
    setTaskForm({ title: '', description: '', status: 'todo', priority: 'medium', assignee_id: '', project_id: projects[0]?.id || '', due_date: '', estimated_hours: 0 })
    setShowTaskModal(true)
  }

  function openEditTask(id: string) {
    const t = tasks.find(x => x.id === id)
    if (!t) return
    setEditingTask(id)
    setTaskForm({
      title: t.title, description: t.description || '', status: t.status,
      priority: t.priority, assignee_id: t.assignee_id, project_id: t.project_id,
      due_date: t.due_date || '', estimated_hours: t.estimated_hours || 0,
    })
    setShowTaskModal(true)
  }

  function submitTask() {
    if (!taskForm.title || !taskForm.project_id) return
    const data = {
      title: taskForm.title,
      description: taskForm.description || null,
      status: taskForm.status,
      priority: taskForm.priority,
      assignee_id: taskForm.assignee_id || currentEmployeeId,
      project_id: taskForm.project_id,
      due_date: taskForm.due_date || null,
      estimated_hours: taskForm.estimated_hours || null,
      actual_hours: null,
      milestone_id: null,
    }
    if (editingTask) {
      updateTask(editingTask, data)
    } else {
      addTask(data)
    }
    setShowTaskModal(false)
  }

  function submitMilestone() {
    if (!milestoneForm.title || !milestoneForm.project_id) return
    addMilestone({
      title: milestoneForm.title,
      project_id: milestoneForm.project_id,
      due_date: milestoneForm.due_date || `${new Date().getFullYear()}-12-31`,
      status: milestoneForm.status,
    })
    setShowMilestoneModal(false)
  }

  function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'project') deleteProject(deleteConfirm.id)
    if (deleteConfirm.type === 'task') deleteTask(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  function openNewRule() {
    setRuleForm({ name: '', description: '', project_id: null, triggerType: 'status_change', triggerValue: '', actionType: 'assign_to', actionValue: '', actionLabel: '' })
    setShowRuleModal(true)
  }

  function submitRule() {
    if (!ruleForm.name || !ruleForm.triggerType || !ruleForm.actionType) return
    addAutomationRule({
      name: ruleForm.name,
      description: ruleForm.description || null,
      project_id: ruleForm.project_id || null,
      trigger: { type: ruleForm.triggerType, value: ruleForm.triggerValue },
      action: { type: ruleForm.actionType, value: ruleForm.actionValue, label: ruleForm.actionLabel || ruleForm.actionValue },
      is_active: true,
    })
    setShowRuleModal(false)
  }

  function applyTemplate(template: { name: string; description: string; triggerType: string; triggerValue: string; actionType: string; actionValue: string; actionLabel: string }) {
    setRuleForm({ ...template, project_id: null })
    setShowRuleModal(true)
  }

  const ruleTemplates = [
    { name: 'Auto-assign QA on review', description: 'Assign QA reviewer when task moves to review', triggerType: 'status_change', triggerValue: 'review', actionType: 'assign_to', actionValue: '', actionLabel: '' },
    { name: 'Notify on overdue', description: 'Send notification when task passes due date', triggerType: 'due_date_passed', triggerValue: '', actionType: 'send_notification', actionValue: '', actionLabel: '' },
    { name: 'Escalate blocked tasks', description: 'Change priority to critical when blocked label added', triggerType: 'label_added', triggerValue: 'blocked', actionType: 'change_priority', actionValue: 'critical', actionLabel: 'Critical' },
  ]

  const triggerLabel = (type: string) => {
    const map: Record<string, string> = { status_change: t('triggerStatusChange'), assignee_change: t('triggerAssigneeChange'), due_date_passed: t('triggerDueDatePassed'), label_added: t('triggerLabelAdded'), priority_changed: t('triggerPriorityChanged') }
    return map[type] || type
  }
  const actionLabel = (type: string) => {
    const map: Record<string, string> = { assign_to: t('actionAssignTo'), send_notification: t('actionSendNotification'), change_priority: t('actionChangePriority'), add_label: t('actionAddLabel'), create_subtask: t('actionCreateSubtask') }
    return map[type] || type
  }

  const statusColor = (s: string) =>
    s === 'active' ? 'success' : s === 'completed' ? 'info' : s === 'on_hold' ? 'warning' : 'default'
  const priorityColor = (p: string) =>
    p === 'critical' ? 'error' : p === 'high' ? 'warning' : p === 'medium' ? 'info' : 'default'
  const taskStatusColor = (s: string) =>
    s === 'done' ? 'success' : s === 'in_progress' ? 'info' : s === 'review' ? 'warning' : 'default'

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={openNewTask}><Plus size={14} /> {t('newTask')}</Button>
            <Button size="sm" onClick={openNewProject}><Plus size={14} /> {t('newProject')}</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalProjects')} value={projects.length} change={`${activeProjects} ${t('active')}`} changeType="neutral" icon={<FolderKanban size={20} />} />
        <StatCard label={t('activeTasks')} value={activeTasks} change={`${tasks.filter(t => t.status === 'in_progress').length} ${t('inProgress')}`} changeType="neutral" icon={<ListChecks size={20} />} />
        <StatCard label={t('completionRate')} value={`${completionRate}%`} change={`${completedTasks} ${t('completed')}`} changeType="positive" icon={<Target size={20} />} />
        <StatCard label={t('overdueItems')} value={overdueTasks} change={overdueTasks > 0 ? t('needsAttention') : t('allOnTrack')} changeType={overdueTasks > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
      </div>

      {/* AI Alerts */}
      {enhancedBottlenecks.length > 0 && (
        <div className="relative mb-4">
          {bottlenecksLoading && <AIEnhancingIndicator isLoading />}
          <AIAlertBanner insights={enhancedBottlenecks} />
        </div>
      )}

      {/* Timeline risk AI cards */}
      {(() => {
        const highRiskProjects = projects.filter(p => {
          const risk = timelineRisks[p.id]
          return risk && risk.severity === 'warning'
        })
        if (highRiskProjects.length === 0) return null
        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
            {highRiskProjects.slice(0, 3).map(p => {
              const risk = timelineRisks[p.id]
              if (!risk) return null
              return <AIInsightCard key={p.id} insight={risk} />
            })}
          </div>
        )
      })()}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ==================== PROJECTS LIST ==================== */}
      {activeTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {projects.length === 0 && (
            <div className="col-span-2 py-12 text-center text-sm text-t3">{t('noProjects')}</div>
          )}
          {projects.map(project => {
            const projectTasks = tasks.filter(t => t.project_id === project.id)
            const projectMilestones = milestones.filter(m => m.project_id === project.id)
            const done = projectTasks.filter(t => t.status === 'done').length
            const progress = projectTasks.length > 0 ? Math.round((done / projectTasks.length) * 100) : 0
            const health = projectHealthScores[project.id]

            return (
              <Card key={project.id} className="hover:border-tempo-200 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center">
                      <FolderKanban size={18} className="text-tempo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{project.title}</h3>
                      <p className="text-xs text-t3">{getEmployeeName(project.owner_id)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {health && <AIScoreBadge score={health} />}
                    <Badge variant={statusColor(project.status)}>{project.status.replace(/_/g, ' ')}</Badge>
                  </div>
                </div>
                {project.description && (
                  <p className="text-xs text-t2 mb-3 line-clamp-2">{project.description}</p>
                )}
                <Progress value={progress} showLabel className="mb-3" />
                <div className="flex items-center justify-between text-xs text-t3">
                  <span>{projectTasks.length} {t('tasks')} - {projectMilestones.length} {t('milestones')}</span>
                  <span>{project.start_date} - {project.end_date}</span>
                </div>
                {project.budget && (
                  <p className="text-xs text-t3 mt-1">{t('budget')}: {project.currency} {project.budget.toLocaleString()}</p>
                )}
                <div className="flex gap-1 mt-3 pt-3 border-t border-divider">
                  <Button size="sm" variant="ghost" onClick={() => openEditProject(project.id)}><Pencil size={12} /> {tc('edit')}</Button>
                  <Button size="sm" variant="ghost" onClick={() => setDeleteConfirm({ type: 'project', id: project.id })}><Trash2 size={12} /></Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ==================== KANBAN ==================== */}
      {activeTab === 'kanban' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {kanbanStatuses.map(status => {
            const colTasks = tasks.filter(t => t.status === status)
            const color = status === 'todo' ? '#6b7280' : status === 'in_progress' ? '#2563eb' : status === 'review' ? '#d97706' : '#16a34a'
            return (
              <div key={status} className="flex flex-col gap-2">
                <div className="flex items-center gap-2 px-1 mb-1">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="text-xs font-semibold text-t1 uppercase">{t(`status_${status}`)}</span>
                  <Badge>{colTasks.length}</Badge>
                </div>
                <div className="flex flex-col gap-2 min-h-[200px] p-2 rounded-xl bg-canvas border border-border">
                  {colTasks.map(task => (
                    <Card key={task.id} padding="sm" className="cursor-pointer hover:border-tempo-200" onClick={() => openEditTask(task.id)}>
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant={priorityColor(task.priority)}>{task.priority}</Badge>
                        {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done' && (
                          <span className="text-[0.6rem] text-error font-medium">{t('overdue')}</span>
                        )}
                      </div>
                      <p className="text-xs font-medium text-t1 mb-1">{task.title}</p>
                      <div className="flex items-center gap-2">
                        <Avatar name={getEmployeeName(task.assignee_id)} size="xs" />
                        <span className="text-[0.6rem] text-t3">{getEmployeeName(task.assignee_id)}</span>
                      </div>
                    </Card>
                  ))}
                  {colTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-t3">{t('noTasks')}</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ==================== TIMELINE ==================== */}
      {activeTab === 'timeline' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('milestones')}</CardTitle>
              <Button size="sm" variant="secondary" onClick={() => { setMilestoneForm({ title: '', project_id: projects[0]?.id || '', due_date: '', status: 'pending' }); setShowMilestoneModal(true) }}>
                <Plus size={14} /> {t('addMilestone')}
              </Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {milestones.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noMilestones')}</div>
            )}
            {[...milestones].sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map(ms => {
              const project = projects.find(p => p.id === ms.project_id)
              const isPast = new Date(ms.due_date) < new Date()
              return (
                <div key={ms.id} className="px-6 py-4 flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${ms.status === 'completed' ? 'bg-success' : isPast ? 'bg-error' : 'bg-warning'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-t1">{ms.title}</p>
                    <p className="text-xs text-t3">{project?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-t1">{ms.due_date}</p>
                    <Badge variant={ms.status === 'completed' ? 'success' : isPast ? 'error' : 'warning'}>
                      {ms.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ==================== MY TASKS ==================== */}
      {activeTab === 'tasks' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('myTasks')}</CardTitle>
              <Button size="sm" onClick={openNewTask}><Plus size={14} /> {t('newTask')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {tasks.filter(t => t.assignee_id === currentEmployeeId).length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noAssignedTasks')}</div>
            )}
            {tasks.filter(t => t.assignee_id === currentEmployeeId).sort((a, b) => {
              if (a.status === 'done' && b.status !== 'done') return 1
              if (a.status !== 'done' && b.status === 'done') return -1
              return 0
            }).map(task => {
              const project = projects.find(p => p.id === task.project_id)
              return (
                <div key={task.id} className="px-6 py-4 flex items-center gap-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-t1">{task.title}</p>
                      <Badge variant={priorityColor(task.priority)}>{task.priority}</Badge>
                    </div>
                    <p className="text-xs text-t3">{project?.title}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {task.due_date && (
                      <span className="text-xs text-t3 flex items-center gap-1">
                        <Clock size={12} /> {task.due_date}
                      </span>
                    )}
                    <Badge variant={taskStatusColor(task.status)}>{task.status.replace(/_/g, ' ')}</Badge>
                    <button onClick={() => openEditTask(task.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors"><Pencil size={14} /></button>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Sprint Planning - Linear style */}
      {activeTab === 'sprints' && (() => {
        const now = new Date()
        const sprintStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 1)
        const sprintEnd = new Date(sprintStart.getTime() + 13 * 24 * 60 * 60 * 1000)
        const sprintTasks = tasks.filter(t => t.status !== 'done')
        const sprintDone = tasks.filter(t => t.status === 'done')
        const velocity = sprintDone.length > 0 ? Math.round(sprintDone.reduce((a, t) => a + (t.estimated_hours || 4), 0)) : 0
        const totalEstimate = sprintTasks.reduce((a, t) => a + (t.estimated_hours || 4), 0)
        const daysLeft = Math.max(0, Math.ceil((sprintEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))

        return (
          <div className="space-y-4">
            {/* Sprint Header */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-t1">Sprint {Math.ceil((now.getMonth() * 2 + (now.getDate() > 15 ? 2 : 1)))}</h3>
                  <p className="text-xs text-t3">{sprintStart.toLocaleDateString()} — {sprintEnd.toLocaleDateString()} · {daysLeft} days remaining</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="text-lg font-bold text-t1">{sprintTasks.length}</p>
                    <p className="text-[0.6rem] text-t3 uppercase">Open</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-success">{sprintDone.length}</p>
                    <p className="text-[0.6rem] text-t3 uppercase">Done</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-bold text-tempo-600">{velocity}h</p>
                    <p className="text-[0.6rem] text-t3 uppercase">Velocity</p>
                  </div>
                </div>
              </div>
              <Progress value={tasks.length > 0 ? (sprintDone.length / tasks.length) * 100 : 0} showLabel />
            </Card>

            {/* Burndown Chart (simulated) */}
            <Card>
              <h4 className="text-xs font-semibold text-t1 uppercase tracking-wide mb-3">Burndown</h4>
              <div className="flex items-end gap-1 h-32">
                {Array.from({ length: 14 }, (_, i) => {
                  const ideal = totalEstimate - (totalEstimate / 14) * i
                  const actual = Math.max(0, totalEstimate - (totalEstimate / 14) * i * (0.7 + Math.random() * 0.5))
                  const maxH = totalEstimate || 1
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                      <div className="w-full flex gap-0.5">
                        <div className="flex-1 bg-gray-200 rounded-t" style={{ height: `${(ideal / maxH) * 100}px` }} />
                        <div className="flex-1 bg-tempo-500 rounded-t" style={{ height: `${(actual / maxH) * 100}px` }} />
                      </div>
                      {i % 3 === 0 && <span className="text-[0.5rem] text-t3">D{i + 1}</span>}
                    </div>
                  )
                })}
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1 text-[0.6rem] text-t3"><span className="w-2 h-2 bg-gray-200 rounded-sm" /> Ideal</span>
                <span className="flex items-center gap-1 text-[0.6rem] text-t3"><span className="w-2 h-2 bg-tempo-500 rounded-sm" /> Actual</span>
              </div>
            </Card>

            {/* Sprint Backlog */}
            <Card padding="none">
              <CardHeader><CardTitle>Sprint Backlog</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {['in_progress', 'todo', 'in_review', 'done'].map(status => {
                  const statusTasks = tasks.filter(t => t.status === status)
                  if (statusTasks.length === 0) return null
                  return (
                    <div key={status}>
                      <div className="px-6 py-2 bg-canvas flex items-center gap-2">
                        <Badge variant={status === 'done' ? 'success' : status === 'in_progress' ? 'warning' : 'default'}>{status.replace(/_/g, ' ')}</Badge>
                        <span className="text-xs text-t3">{statusTasks.length} tasks</span>
                      </div>
                      {statusTasks.map(task => (
                        <div key={task.id} className="px-6 py-3 flex items-center gap-3 hover:bg-canvas/30 transition-colors">
                          <Avatar name={getEmployeeName(task.assignee_id)} size="xs" />
                          <p className="text-xs font-medium text-t1 flex-1">{task.title}</p>
                          <Badge variant={task.priority === 'critical' || task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>{task.priority}</Badge>
                          <span className="text-xs text-t3">{task.estimated_hours || 4}h</span>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* Capacity / Resource Management - Asana/Monday style */}
      {activeTab === 'capacity' && (() => {
        const teamMembers = [...new Set(tasks.map(t => t.assignee_id))].filter(Boolean)
        const maxCapacity = 40 // hours per sprint per person

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="Team Members" value={teamMembers.length} icon={<Users size={20} />} />
              <StatCard label="Total Capacity" value={`${teamMembers.length * maxCapacity}h`} icon={<Clock size={20} />} />
              <StatCard label="Allocated" value={`${tasks.filter(t => t.status !== 'done').reduce((a, t) => a + (t.estimated_hours || 4), 0)}h`} icon={<Target size={20} />} />
              <StatCard label="Utilization" value={`${teamMembers.length > 0 ? Math.round(tasks.filter(t => t.status !== 'done').reduce((a, t) => a + (t.estimated_hours || 4), 0) / (teamMembers.length * maxCapacity) * 100) : 0}%`} icon={<AlertTriangle size={20} />} />
            </div>

            {/* Team Workload */}
            <Card>
              <h4 className="text-xs font-semibold text-t1 uppercase tracking-wide mb-4">Team Workload</h4>
              <div className="space-y-4">
                {teamMembers.map(memberId => {
                  const memberTasks = tasks.filter(t => t.assignee_id === memberId && t.status !== 'done')
                  const allocated = memberTasks.reduce((a, t) => a + (t.estimated_hours || 4), 0)
                  const utilPct = Math.min(100, Math.round((allocated / maxCapacity) * 100))
                  const isOver = allocated > maxCapacity

                  return (
                    <div key={memberId}>
                      <div className="flex items-center gap-3 mb-1">
                        <Avatar name={getEmployeeName(memberId)} size="xs" />
                        <span className="text-xs font-medium text-t1 flex-1">{getEmployeeName(memberId)}</span>
                        <span className="text-xs text-t3">{memberTasks.length} tasks</span>
                        <span className={`text-xs font-semibold ${isOver ? 'text-error' : utilPct > 80 ? 'text-warning' : 'text-success'}`}>{allocated}h / {maxCapacity}h</span>
                      </div>
                      <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${isOver ? 'bg-red-500' : utilPct > 80 ? 'bg-amber-500' : 'bg-green-500'}`} style={{ width: `${Math.min(100, utilPct)}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Unassigned Tasks */}
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Unassigned Tasks</CardTitle>
                  <Badge variant="warning">{tasks.filter(t => !t.assignee_id && t.status !== 'done').length}</Badge>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {tasks.filter(t => !t.assignee_id && t.status !== 'done').map(task => (
                  <div key={task.id} className="px-6 py-3 flex items-center gap-3">
                    <p className="text-xs font-medium text-t1 flex-1">{task.title}</p>
                    <Badge variant={task.priority === 'critical' || task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'}>{task.priority}</Badge>
                    <span className="text-xs text-t3">{task.estimated_hours || 4}h</span>
                    <Button size="sm" variant="ghost" onClick={() => openEditTask(task.id)}>Assign</Button>
                  </div>
                ))}
                {tasks.filter(t => !t.assignee_id && t.status !== 'done').length === 0 && (
                  <div className="px-6 py-8 text-center text-xs text-t3">All tasks are assigned</div>
                )}
              </div>
            </Card>
          </div>
        )
      })()}

      {/* ==================== AUTOMATIONS ==================== */}
      {activeTab === 'automations' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-t1 flex items-center gap-2"><Zap size={20} /> {t('automationRules')}</h2>
              <p className="text-sm text-t3 mt-0.5">{t('automationRulesDesc')}</p>
            </div>
            <Button size="sm" onClick={openNewRule}><Plus size={14} /> {t('newRule')}</Button>
          </div>

          {/* Rules List */}
          <div className="space-y-3">
            {automationRules.length === 0 && (
              <Card><p className="text-sm text-t3 text-center py-8">{t('noRules')}</p></Card>
            )}
            {automationRules.map(rule => {
              const projectName = rule.project_id ? projects.find(p => p.id === rule.project_id)?.title : t('allProjects')
              return (
                <Card key={rule.id} className={`transition-colors ${!rule.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${rule.is_active ? 'bg-tempo-50 dark:bg-tempo-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                        <Zap size={18} className={rule.is_active ? 'text-tempo-600' : 'text-t3'} />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-t1">{rule.name}</h3>
                        <p className="text-xs text-t3">{projectName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rule.is_active ? 'success' : 'default'}>
                        {rule.is_active ? t('ruleActive') : t('ruleInactive')}
                      </Badge>
                      <button
                        onClick={() => toggleAutomationRule(rule.id)}
                        className="p-1.5 rounded-lg text-t3 hover:text-t1 hover:bg-canvas transition-colors"
                        title={rule.is_active ? 'Pause' : 'Activate'}
                      >
                        {rule.is_active ? <Pause size={14} /> : <Play size={14} />}
                      </button>
                    </div>
                  </div>

                  {rule.description && (
                    <p className="text-xs text-t2 mb-3">{rule.description}</p>
                  )}

                  {/* WHEN -> THEN */}
                  <div className="flex items-center gap-2 flex-wrap mb-3">
                    <Badge variant="info">{t('trigger')}</Badge>
                    <span className="text-xs text-t1">{triggerLabel(rule.trigger.type)}</span>
                    {rule.trigger.value && <Badge>{rule.trigger.value}</Badge>}
                    <ArrowRight size={14} className="text-t3" />
                    <Badge variant="warning">{t('action')}</Badge>
                    <span className="text-xs text-t1">{actionLabel(rule.action.type)}</span>
                    {rule.action.label && <Badge>{rule.action.label}</Badge>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-t3 pt-2 border-t border-divider">
                    <span>{rule.executions} {t('executions')}</span>
                    <span>{t('lastExecuted')}: {rule.last_executed ? new Date(rule.last_executed).toLocaleDateString() : t('never')}</span>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Templates */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Lightbulb size={16} /> {t('ruleTemplates')}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ruleTemplates.map((tmpl, idx) => (
                <div key={idx} className="p-3 bg-canvas rounded-lg border border-border">
                  <h4 className="text-xs font-semibold text-t1 mb-1">{tmpl.name}</h4>
                  <p className="text-[0.65rem] text-t3 mb-2">{tmpl.description}</p>
                  <Button size="sm" variant="secondary" onClick={() => applyTemplate(tmpl)}>{t('useTemplate')}</Button>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Suggestions */}
          {automationSuggestions.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2"><Lightbulb size={16} className="text-tempo-600" /> {t('aiSuggestions')}</h3>
              <div className="space-y-3">
                {automationSuggestions.map(suggestion => (
                  <div key={suggestion.id} className="p-3 bg-tempo-50/50 dark:bg-tempo-900/20 rounded-lg border border-tempo-200/50">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="text-xs font-semibold text-t1">{suggestion.title}</h4>
                      <div className="flex items-center gap-1">
                        <Badge variant={suggestion.impact === 'high' ? 'success' : 'default'}>{suggestion.impact} impact</Badge>
                        <Badge>{suggestion.effort} effort</Badge>
                      </div>
                    </div>
                    <p className="text-[0.65rem] text-t2">{suggestion.rationale}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Execution Log */}
          <Card padding="none">
            <div className="px-6 py-4 border-b border-divider">
              <h3 className="text-sm font-semibold text-t1">{t('executionLog')}</h3>
            </div>
            <div className="divide-y divide-divider">
              {automationLog.length === 0 && (
                <div className="px-6 py-8 text-center text-sm text-t3">{t('noExecutions')}</div>
              )}
              {[...automationLog].sort((a, b) => new Date(b.executed_at).getTime() - new Date(a.executed_at).getTime()).map(log => (
                <div key={log.id} className="px-6 py-3 flex items-center gap-3">
                  {log.status === 'success' ? (
                    <CheckCircle2 size={16} className="text-success shrink-0" />
                  ) : (
                    <XCircle size={16} className="text-error shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-t1">{log.rule_name}</p>
                    <p className="text-[0.65rem] text-t3">{log.task_title}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant={log.status === 'success' ? 'success' : 'error'}>{log.status}</Badge>
                    <p className="text-[0.6rem] text-t3 mt-0.5">{new Date(log.executed_at).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Create Automation Rule */}
      <Modal open={showRuleModal} onClose={() => setShowRuleModal(false)} title={t('createRule')}>
        <div className="space-y-4">
          <Input label={t('ruleName')} placeholder={t('ruleNamePlaceholder')} value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} />
          <Input label={t('ruleDescription')} placeholder={t('ruleDescPlaceholder')} value={ruleForm.description} onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })} />
          <Select label={t('project')} value={ruleForm.project_id || ''} onChange={(e) => setRuleForm({ ...ruleForm, project_id: e.target.value || null })} options={[{ value: '', label: t('allProjects') }, ...projects.map(p => ({ value: p.id, label: p.title }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('trigger')} value={ruleForm.triggerType} onChange={(e) => setRuleForm({ ...ruleForm, triggerType: e.target.value })} options={[
              { value: 'status_change', label: t('triggerStatusChange') },
              { value: 'assignee_change', label: t('triggerAssigneeChange') },
              { value: 'due_date_passed', label: t('triggerDueDatePassed') },
              { value: 'label_added', label: t('triggerLabelAdded') },
              { value: 'priority_changed', label: t('triggerPriorityChanged') },
            ]} />
            <Input label={`${t('trigger')} value`} placeholder="e.g., review, blocked" value={ruleForm.triggerValue} onChange={(e) => setRuleForm({ ...ruleForm, triggerValue: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('action')} value={ruleForm.actionType} onChange={(e) => setRuleForm({ ...ruleForm, actionType: e.target.value })} options={[
              { value: 'assign_to', label: t('actionAssignTo') },
              { value: 'send_notification', label: t('actionSendNotification') },
              { value: 'change_priority', label: t('actionChangePriority') },
              { value: 'add_label', label: t('actionAddLabel') },
              { value: 'create_subtask', label: t('actionCreateSubtask') },
            ]} />
            <Input label={`${t('action')} value`} placeholder="e.g., person, label" value={ruleForm.actionValue} onChange={(e) => setRuleForm({ ...ruleForm, actionValue: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRuleModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitRule}>{t('createRule')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Project */}
      <Modal open={showProjectModal} onClose={() => setShowProjectModal(false)} title={editingProject ? t('editProject') : t('createProject')}>
        <div className="space-y-4">
          <Input label={t('projectTitle')} placeholder={t('projectTitlePlaceholder')} value={projectForm.title} onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })} />
          <Textarea label={t('description')} placeholder={t('descriptionPlaceholder')} rows={3} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('status')} value={projectForm.status} onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })} options={[
              { value: 'planning', label: t('statusPlanning') },
              { value: 'active', label: t('statusActive') },
              { value: 'on_hold', label: t('statusOnHold') },
              { value: 'completed', label: t('statusCompleted') },
            ]} />
            <Select label={t('owner')} value={projectForm.owner_id} onChange={(e) => setProjectForm({ ...projectForm, owner_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={projectForm.start_date} onChange={(e) => setProjectForm({ ...projectForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={projectForm.end_date} onChange={(e) => setProjectForm({ ...projectForm, end_date: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('budget')} type="number" value={projectForm.budget} onChange={(e) => setProjectForm({ ...projectForm, budget: Number(e.target.value) })} />
            <Select label={t('currency')} value={projectForm.currency} onChange={(e) => setProjectForm({ ...projectForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'XOF', label: 'XOF' }, { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowProjectModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitProject}>{editingProject ? tc('saveChanges') : t('createProject')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create/Edit Task */}
      <Modal open={showTaskModal} onClose={() => setShowTaskModal(false)} title={editingTask ? t('editTask') : t('createTask')}>
        <div className="space-y-4">
          <Input label={t('taskTitle')} placeholder={t('taskTitlePlaceholder')} value={taskForm.title} onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })} />
          <Textarea label={t('description')} rows={2} value={taskForm.description} onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('project')} value={taskForm.project_id} onChange={(e) => setTaskForm({ ...taskForm, project_id: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.title }))} />
            <Select label={t('assignee')} value={taskForm.assignee_id} onChange={(e) => setTaskForm({ ...taskForm, assignee_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label={t('status')} value={taskForm.status} onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })} options={[
              { value: 'todo', label: t('statusTodo') }, { value: 'in_progress', label: t('statusInProgress') },
              { value: 'review', label: t('statusReview') }, { value: 'done', label: t('statusDone') },
            ]} />
            <Select label={t('priority')} value={taskForm.priority} onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })} options={[
              { value: 'low', label: t('priorityLow') }, { value: 'medium', label: t('priorityMedium') },
              { value: 'high', label: t('priorityHigh') }, { value: 'critical', label: t('priorityCritical') },
            ]} />
            <Input label={t('dueDate')} type="date" value={taskForm.due_date} onChange={(e) => setTaskForm({ ...taskForm, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitTask}>{editingTask ? tc('saveChanges') : t('createTask')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Milestone */}
      <Modal open={showMilestoneModal} onClose={() => setShowMilestoneModal(false)} title={t('addMilestone')}>
        <div className="space-y-4">
          <Input label={t('milestoneTitle')} placeholder={t('milestoneTitlePlaceholder')} value={milestoneForm.title} onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })} />
          <Select label={t('project')} value={milestoneForm.project_id} onChange={(e) => setMilestoneForm({ ...milestoneForm, project_id: e.target.value })} options={projects.map(p => ({ value: p.id, label: p.title }))} />
          <Input label={t('dueDate')} type="date" value={milestoneForm.due_date} onChange={(e) => setMilestoneForm({ ...milestoneForm, due_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowMilestoneModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitMilestone}>{t('addMilestone')}</Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title={t('deleteConfirmTitle')} size="sm">
        <p className="text-sm text-t2 mb-4">{t('deleteConfirmMessage')}</p>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setDeleteConfirm(null)}>{tc('cancel')}</Button>
          <Button variant="danger" onClick={confirmDelete}>{tc('delete')}</Button>
        </div>
      </Modal>
    </>
  )
}
