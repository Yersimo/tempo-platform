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
  Calendar, Pencil, Trash2, ChevronRight, Clock
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { scoreProjectHealth, predictTimelineRisk, detectResourceBottlenecks } from '@/lib/ai-engine'
import { useAI } from '@/lib/use-ai'

export default function ProjectsPage() {
  const {
    projects, milestones, tasks, taskDependencies, employees,
    addProject, updateProject, deleteProject,
    addMilestone, addTask, updateTask, deleteTask,
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

  const tabs = [
    { id: 'list', label: t('tabList'), count: projects.length },
    { id: 'kanban', label: t('tabKanban') },
    { id: 'timeline', label: t('tabTimeline'), count: milestones.length },
    { id: 'tasks', label: t('tabMyTasks'), count: tasks.filter(t => t.assignee_id === currentEmployeeId).length },
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
      end_date: projectForm.end_date || '2026-12-31',
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
      due_date: milestoneForm.due_date || '2026-12-31',
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

      {/* ==================== MODALS ==================== */}

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
