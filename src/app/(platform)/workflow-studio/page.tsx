'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  Plus, Zap, Play, Pause, CheckCircle2, XCircle,
  Pencil, Trash2, ArrowDown, LayoutTemplate, Clock, ChevronRight,
  GitBranch, Bell, Timer, Shield, Loader2, Eye, ThumbsUp, ThumbsDown,
  Search,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIScoreBadge, AIRecommendationList, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { analyzeWorkflowEfficiency, suggestWorkflowOptimizations, predictWorkflowFailure } from '@/lib/ai-engine'
import { useAI } from '@/lib/use-ai'
import type { WorkflowContext, StepResult } from '@/lib/workflow-engine'

export default function WorkflowStudioPage() {
  const {
    workflows, workflowSteps, workflowRuns, workflowTemplates,
    addWorkflow, updateWorkflow, deleteWorkflow,
    addWorkflowStep, updateWorkflowStep, deleteWorkflowStep,
    addWorkflowRun, updateWorkflowRun,
    getEmployeeName, currentEmployeeId,
    ensureModulesLoaded, addToast,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => { ensureModulesLoaded?.(['workflows', 'workflowSteps', 'workflowRuns', 'workflowTemplates'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false)) }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const t = useTranslations('workflowStudio')
  const tc = useTranslations('common')

  const [activeTab, setActiveTab] = useState('list')
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null)

  // Workflow modal
  const [showWorkflowModal, setShowWorkflowModal] = useState(false)
  const [editingWorkflow, setEditingWorkflow] = useState<string | null>(null)
  const [workflowForm, setWorkflowForm] = useState({
    title: '', description: '', status: 'draft' as string, trigger_type: 'manual' as string, trigger_config: '{}',
  })

  // Step modal
  const [showStepModal, setShowStepModal] = useState(false)
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [stepForm, setStepForm] = useState({
    step_type: 'action' as string, title: '', config: '{}',
  })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)

  // Workflow execution state
  const [executingId, setExecutingId] = useState<string | null>(null)
  const [viewingRunId, setViewingRunId] = useState<string | null>(null)

  // Execute a workflow via the API
  const runWorkflowById = useCallback(async (workflowId: string) => {
    const wf = workflows.find(w => w.id === workflowId)
    if (!wf) return
    const steps = workflowSteps.filter(s => s.workflow_id === workflowId)

    setExecutingId(workflowId)
    try {
      const res = await fetch('/api/workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          workflow: wf,
          steps,
          triggerData: {},
        }),
      })
      const data = await res.json()
      if (data.success) {
        // Add the run to the client-side store
        addWorkflowRun({
          id: data.run_id,
          workflow_id: workflowId,
          status: data.status,
          started_at: data.context?.started_at || new Date().toISOString(),
          completed_at: data.status === 'completed' || data.status === 'failed' ? new Date().toISOString() : null,
          triggered_by: currentEmployeeId,
          context: data.context,
        })
        setViewingRunId(data.run_id)
        setActiveTab('history')
      }
    } catch {
      // Execution failed at network level
    } finally {
      setExecutingId(null)
    }
  }, [workflows, workflowSteps, currentEmployeeId, addWorkflowRun])

  const tabs = [
    { id: 'list', label: t('tabList'), count: workflows.length },
    { id: 'builder', label: t('tabBuilder') },
    { id: 'history', label: t('tabRunHistory'), count: workflowRuns.length },
    { id: 'templates', label: t('tabTemplates'), count: workflowTemplates.length },
  ]

  // Stats
  const activeWorkflows = workflows.filter(w => w.status === 'active').length
  const runsThisMonth = workflowRuns.filter(r => {
    const d = new Date(r.started_at)
    const now = new Date()
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const successRate = workflowRuns.length > 0
    ? Math.round((workflowRuns.filter(r => r.status === 'completed').length / workflowRuns.length) * 100)
    : 0

  // Selected workflow data
  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId)
  const selectedSteps = workflowSteps.filter(s => s.workflow_id === selectedWorkflowId).sort((a, b) => a.position - b.position)
  const selectedRuns = workflowRuns.filter(r => r.workflow_id === selectedWorkflowId)

  // AI insights
  const aiEfficiencyScores = useMemo(() => {
    const scores: Record<string, ReturnType<typeof analyzeWorkflowEfficiency>> = {}
    for (const wf of workflows) {
      const steps = workflowSteps.filter(s => s.workflow_id === wf.id)
      const runs = workflowRuns.filter(r => r.workflow_id === wf.id)
      scores[wf.id] = analyzeWorkflowEfficiency(wf, steps, runs)
    }
    return scores
  }, [workflows, workflowSteps, workflowRuns])

  const aiOptimizations = useMemo(() => {
    if (!selectedWorkflow) return []
    return suggestWorkflowOptimizations(selectedWorkflow, selectedSteps, selectedRuns)
  }, [selectedWorkflow, selectedSteps, selectedRuns])

  // Search/filter
  const filteredWorkflows = useMemo(() => {
    if (!searchQuery.trim()) return workflows
    const q = searchQuery.toLowerCase()
    return workflows.filter(wf =>
      wf.title.toLowerCase().includes(q) ||
      (wf.description && wf.description.toLowerCase().includes(q)) ||
      wf.status.toLowerCase().includes(q) ||
      wf.trigger_type.toLowerCase().includes(q)
    )
  }, [workflows, searchQuery])

  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) return workflowTemplates
    const q = searchQuery.toLowerCase()
    return workflowTemplates.filter(tmpl =>
      tmpl.title.toLowerCase().includes(q) ||
      (tmpl.description && tmpl.description.toLowerCase().includes(q)) ||
      (tmpl.category && tmpl.category.toLowerCase().includes(q))
    )
  }, [workflowTemplates, searchQuery])

  const filteredRuns = useMemo(() => {
    if (!searchQuery.trim()) return workflowRuns
    const q = searchQuery.toLowerCase()
    return workflowRuns.filter(run => {
      const wf = workflows.find(w => w.id === run.workflow_id)
      return run.status.toLowerCase().includes(q) ||
        (wf?.title && wf.title.toLowerCase().includes(q))
    })
  }, [workflowRuns, workflows, searchQuery])

  // Claude AI enhancement
  const { result: enhancedOptimizations, isLoading: optimizationsLoading } = useAI({
    action: 'enhanceWorkflowOptimization',
    data: { workflow: selectedWorkflow?.title, steps: selectedSteps.length, runs: selectedRuns.length },
    fallback: aiOptimizations,
    enabled: aiOptimizations.length > 0 && !!selectedWorkflow,
    cacheKey: `wf-optimize-${selectedWorkflowId}`,
  })

  // Step type icons/colors
  const stepTypeIcon = (type: string) => {
    switch (type) {
      case 'action': return <Play size={14} />
      case 'condition': return <GitBranch size={14} />
      case 'delay': return <Timer size={14} />
      case 'notification': return <Bell size={14} />
      case 'approval': return <Shield size={14} />
      default: return <Zap size={14} />
    }
  }
  const stepTypeBg = (type: string) =>
    type === 'condition' ? 'bg-blue-50 border-blue-200' : type === 'delay' ? 'bg-amber-50 border-amber-200' : type === 'notification' ? 'bg-green-50 border-green-200' : type === 'approval' ? 'bg-purple-50 border-purple-200' : 'bg-canvas border-border'

  // CRUD handlers
  function openNewWorkflow() {
    setEditingWorkflow(null)
    setWorkflowForm({ title: '', description: '', status: 'draft', trigger_type: 'manual', trigger_config: '{}' })
    setShowWorkflowModal(true)
  }

  function openEditWorkflow(id: string) {
    const w = workflows.find(x => x.id === id)
    if (!w) return
    setEditingWorkflow(id)
    setWorkflowForm({
      title: w.title, description: w.description || '', status: w.status,
      trigger_type: w.trigger_type, trigger_config: JSON.stringify(w.trigger_config || {}),
    })
    setShowWorkflowModal(true)
  }

  async function submitWorkflow() {
    if (!workflowForm.title.trim()) { addToast('Workflow title is required', 'error'); return }
    let triggerConfig = {}
    try { triggerConfig = JSON.parse(workflowForm.trigger_config) } catch { addToast('Invalid trigger config JSON', 'error'); return }
    setSaving(true)
    try {
      const data = {
        title: workflowForm.title,
        description: workflowForm.description || null,
        status: workflowForm.status,
        trigger_type: workflowForm.trigger_type,
        trigger_config: triggerConfig,
        created_by: currentEmployeeId,
      }
      if (editingWorkflow) {
        updateWorkflow(editingWorkflow, data)
        addToast('Workflow updated', 'success')
      } else {
        const newId = addWorkflow(data)
        setSelectedWorkflowId(typeof newId === 'string' ? newId : null)
        addToast(`Workflow "${workflowForm.title}" created`, 'success')
      }
      setShowWorkflowModal(false)
    } finally {
      setSaving(false)
    }
  }

  function openNewStep() {
    if (!selectedWorkflowId) return
    setEditingStep(null)
    setStepForm({ step_type: 'action', title: '', config: '{}' })
    setShowStepModal(true)
  }

  function openEditStep(id: string) {
    const s = workflowSteps.find(x => x.id === id)
    if (!s) return
    setEditingStep(id)
    setStepForm({
      step_type: s.step_type, title: s.title,
      config: JSON.stringify(s.config || {}),
    })
    setShowStepModal(true)
  }

  async function submitStep() {
    if (!stepForm.title.trim()) { addToast('Step title is required', 'error'); return }
    if (!selectedWorkflowId) { addToast('No workflow selected', 'error'); return }
    let config = {}
    try { config = JSON.parse(stepForm.config) } catch { addToast('Invalid step config JSON', 'error'); return }
    setSaving(true)
    try {
      const data = {
        workflow_id: selectedWorkflowId,
        step_type: stepForm.step_type,
        title: stepForm.title,
        config,
        position: selectedSteps.length,
        next_step_id: null,
      }
      if (editingStep) {
        updateWorkflowStep(editingStep, data)
        addToast('Step updated', 'success')
      } else {
        addWorkflowStep(data)
        addToast(`Step "${stepForm.title}" added`, 'success')
      }
      setShowStepModal(false)
    } finally {
      setSaving(false)
    }
  }

  function useTemplate(templateId: string) {
    const template = workflowTemplates.find(t => t.id === templateId)
    if (!template) return
    const config = template.config as Record<string, unknown> || {}
    addWorkflow({
      title: template.title,
      description: template.description || null,
      status: 'draft',
      trigger_type: (config.trigger_type as string) || 'manual',
      trigger_config: (config.trigger_config as Record<string, unknown>) || {},
      created_by: currentEmployeeId,
    })
  }

  function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'workflow') {
      deleteWorkflow(deleteConfirm.id)
      if (selectedWorkflowId === deleteConfirm.id) setSelectedWorkflowId(null)
    }
    if (deleteConfirm.type === 'step') deleteWorkflowStep(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  function formatDuration(start: string, end?: string | null) {
    if (!end) return t('running')
    const ms = new Date(end).getTime() - new Date(start).getTime()
    if (ms < 60_000) return `${Math.round(ms / 1000)}s`
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
    return `${(ms / 3_600_000).toFixed(1)}h`
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} actions={<Button size="sm" disabled><Plus size={14} /> {t('newWorkflow')}</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button size="sm" onClick={openNewWorkflow}><Plus size={14} /> {t('newWorkflow')}</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalWorkflows')} value={workflows.length} change={`${activeWorkflows} ${t('active')}`} changeType="neutral" icon={<Zap size={20} />} />
        <StatCard label={t('activeWorkflows')} value={activeWorkflows} icon={<Play size={20} />} />
        <StatCard label={t('runsThisMonth')} value={runsThisMonth} change={`${workflowRuns.length} ${t('totalRuns')}`} changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label={t('successRate')} value={`${successRate}%`} changeType={successRate >= 80 ? 'positive' : 'negative'} icon={<CheckCircle2 size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Search */}
      {(activeTab === 'list' || activeTab === 'history' || activeTab === 'templates') && (
        <div className="relative mb-4">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <input
            type="text"
            placeholder={activeTab === 'list' ? 'Search workflows...' : activeTab === 'templates' ? 'Search templates...' : 'Search runs...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-border rounded-lg bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
          />
        </div>
      )}

      {/* ==================== WORKFLOW LIST ==================== */}
      {activeTab === 'list' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('workflows')}</CardTitle>
              <Button size="sm" onClick={openNewWorkflow}><Plus size={14} /> {t('newWorkflow')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {filteredWorkflows.length === 0 && (
              <div className="px-6 py-16 text-center">
                <Zap size={32} className="mx-auto mb-3 text-t3 opacity-40" />
                <p className="text-sm font-medium text-t2 mb-1">{workflows.length === 0 ? 'No workflows yet' : 'No workflows match your search'}</p>
                <p className="text-xs text-t3 mb-4">{workflows.length === 0 ? 'Create your first workflow to automate processes' : 'Try adjusting your search terms'}</p>
                {workflows.length === 0 && (
                  <Button size="sm" onClick={openNewWorkflow}><Plus size={14} /> {t('newWorkflow')}</Button>
                )}
              </div>
            )}
            {filteredWorkflows.map(wf => {
              const steps = workflowSteps.filter(s => s.workflow_id === wf.id)
              const runs = workflowRuns.filter(r => r.workflow_id === wf.id)
              const lastRun = runs.length > 0 ? runs[runs.length - 1] : null
              const score = aiEfficiencyScores[wf.id]

              return (
                <div
                  key={wf.id}
                  className={`px-6 py-4 hover:bg-canvas/50 transition-colors cursor-pointer ${selectedWorkflowId === wf.id ? 'bg-tempo-50/30 border-l-2 border-l-tempo-600' : ''}`}
                  onClick={() => { setSelectedWorkflowId(wf.id); if (activeTab === 'list') setActiveTab('builder') }}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-9 h-9 rounded-lg bg-tempo-50 flex items-center justify-center shrink-0">
                      <Zap size={16} className="text-tempo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-t1">{wf.title}</p>
                        <Badge variant={wf.status === 'active' ? 'success' : wf.status === 'draft' ? 'default' : 'warning'}>
                          {wf.status}
                        </Badge>
                        <Badge variant="info">{wf.trigger_type}</Badge>
                      </div>
                      {wf.description && <p className="text-xs text-t2 mb-2 line-clamp-1">{wf.description}</p>}
                      <div className="flex items-center gap-4 text-xs text-t3">
                        <span>{steps.length} {t('steps')}</span>
                        <span>{runs.length} {t('runs')}</span>
                        {lastRun && (
                          <span className="flex items-center gap-1">
                            <Badge variant={lastRun.status === 'completed' ? 'success' : lastRun.status === 'running' ? 'info' : 'error'}>
                              {lastRun.status}
                            </Badge>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {score && <AIScoreBadge score={score} />}
                      <button
                        onClick={(e) => { e.stopPropagation(); runWorkflowById(wf.id) }}
                        disabled={executingId === wf.id || steps.length === 0}
                        className="p-1.5 text-t3 hover:text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                        title={t('executeWorkflow')}
                      >
                        {executingId === wf.id ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); openEditWorkflow(wf.id) }} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg"><Pencil size={14} /></button>
                      <button onClick={(e) => { e.stopPropagation(); setDeleteConfirm({ type: 'workflow', id: wf.id }) }} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                      <ChevronRight size={14} className="text-t3" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ==================== BUILDER TAB ==================== */}
      {activeTab === 'builder' && (
        <div className="space-y-4">
          {!selectedWorkflowId ? (
            <Card>
              <div className="py-12 text-center">
                <Zap size={32} className="mx-auto mb-3 text-t3 opacity-40" />
                <p className="text-sm text-t3">{t('selectWorkflow')}</p>
                <p className="text-xs text-t3 mt-1">{t('selectWorkflowHint')}</p>
              </div>
            </Card>
          ) : (
            <>
              {/* Workflow header */}
              <Card>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{selectedWorkflow?.title}</h3>
                    <p className="text-xs text-t3 mt-0.5">{selectedWorkflow?.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => runWorkflowById(selectedWorkflowId)}
                      disabled={executingId === selectedWorkflowId || selectedSteps.length === 0}
                    >
                      {executingId === selectedWorkflowId ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                      {' '}{t('executeWorkflow')}
                    </Button>
                    <Badge variant={selectedWorkflow?.status === 'active' ? 'success' : 'default'}>{selectedWorkflow?.status}</Badge>
                    {aiEfficiencyScores[selectedWorkflowId] && <AIScoreBadge score={aiEfficiencyScores[selectedWorkflowId]} />}
                  </div>
                </div>
              </Card>

              {/* AI Optimizations */}
              {enhancedOptimizations.length > 0 && (
                <div className="relative">
                  {optimizationsLoading && <AIEnhancingIndicator isLoading />}
                  <AIRecommendationList recommendations={enhancedOptimizations} title={t('aiOptimizations')} />
                </div>
              )}

              {/* Step chain - visual builder */}
              <Card>
                <div className="flex flex-col items-center">
                  {selectedSteps.length === 0 && (
                    <div className="py-8 text-center">
                      <p className="text-sm text-t3 mb-3">{t('noSteps')}</p>
                      <Button size="sm" onClick={openNewStep}><Plus size={14} /> {t('addFirstStep')}</Button>
                    </div>
                  )}

                  {selectedSteps.map((step, idx) => (
                    <div key={step.id} className="w-full max-w-md">
                      {idx > 0 && (
                        <div className="flex justify-center py-1">
                          <div className="flex flex-col items-center">
                            <div className="w-px h-4 bg-divider" />
                            <ArrowDown size={12} className="text-t3 -mt-0.5" />
                          </div>
                        </div>
                      )}
                      <div className={`border rounded-[var(--radius-card)] p-4 ${stepTypeBg(step.step_type)} transition-colors`}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/60 flex items-center justify-center shrink-0">
                            {stepTypeIcon(step.step_type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-xs font-semibold text-t1">{step.title}</span>
                              <Badge>{step.step_type}</Badge>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button onClick={() => openEditStep(step.id)} className="p-1 rounded hover:bg-white/40"><Pencil size={12} /></button>
                            <button onClick={() => setDeleteConfirm({ type: 'step', id: step.id })} className="p-1 rounded hover:bg-white/40"><Trash2 size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {selectedSteps.length > 0 && (
                    <div className="flex flex-col items-center mt-1">
                      <div className="w-px h-4 bg-divider" />
                      <Button size="sm" variant="secondary" onClick={openNewStep} className="mt-1">
                        <Plus size={14} /> {t('addStep')}
                      </Button>
                    </div>
                  )}
                </div>
              </Card>

              {/* AI Failure Prediction */}
              {(() => {
                const prediction = predictWorkflowFailure(selectedWorkflow, selectedRuns)
                if (!prediction) return null
                return <AIInsightCard insight={prediction} className="mt-4" />
              })()}
            </>
          )}
        </div>
      )}

      {/* ==================== RUN HISTORY ==================== */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <Card padding="none">
            <CardHeader><CardTitle>{t('runHistory')}</CardTitle></CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('tableStatus')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableWorkflow')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableStarted')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableDuration')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableTriggeredBy')}</th>
                    <th className="tempo-th text-left px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredRuns.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-16 text-center">
                      <Clock size={32} className="mx-auto mb-3 text-t3 opacity-40" />
                      <p className="text-sm font-medium text-t2 mb-1">{workflowRuns.length === 0 ? 'No workflow runs yet' : 'No runs match your search'}</p>
                      <p className="text-xs text-t3">{workflowRuns.length === 0 ? 'Execute a workflow to see its run history here' : 'Try adjusting your search terms'}</p>
                    </td></tr>
                  )}
                  {[...filteredRuns].reverse().map(run => {
                    const wf = workflows.find(w => w.id === run.workflow_id)
                    const isViewing = viewingRunId === run.id
                    return (
                      <tr key={run.id} className={`hover:bg-canvas/50 cursor-pointer ${isViewing ? 'bg-tempo-50/20' : ''}`} onClick={() => setViewingRunId(isViewing ? null : run.id)}>
                        <td className="px-6 py-3">
                          <Badge variant={run.status === 'completed' ? 'success' : run.status === 'running' ? 'info' : run.status === 'failed' ? 'error' : 'warning'}>
                            {run.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t1">{wf?.title || run.workflow_id}</td>
                        <td className="px-4 py-3 text-xs text-t2">{new Date(run.started_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-medium text-t1">{formatDuration(run.started_at, run.completed_at)}</td>
                        <td className="px-4 py-3 text-xs text-t2">{run.triggered_by}</td>
                        <td className="px-4 py-3">
                          <button className="p-1 text-t3 hover:text-t1" title={t('viewRunDetails')} onClick={(e) => { e.stopPropagation(); setViewingRunId(isViewing ? null : run.id) }}>
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Run Detail / Execution Log */}
          {viewingRunId && (() => {
            const run = workflowRuns.find(r => r.id === viewingRunId)
            if (!run) return null
            const wf = workflows.find(w => w.id === run.workflow_id)
            const ctx = (run.context || {}) as unknown as WorkflowContext
            const stepResults = ctx.step_results || {}
            const runSteps = workflowSteps.filter(s => s.workflow_id === run.workflow_id).sort((a, b) => a.position - b.position)

            return (
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{t('executionLog')}: {wf?.title}</h3>
                    <p className="text-xs text-t3 mt-0.5">{t('runStarted')}: {new Date(run.started_at).toLocaleString()}</p>
                  </div>
                  <Badge variant={run.status === 'completed' ? 'success' : run.status === 'running' ? 'info' : run.status === 'failed' ? 'error' : 'warning'}>
                    {run.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {runSteps.map((step) => {
                    const result = stepResults[step.id] as StepResult | undefined
                    const status = result?.status || 'pending'
                    const statusColor = status === 'completed' ? 'bg-green-500' : status === 'failed' ? 'bg-red-500' : status === 'waiting' ? 'bg-amber-500' : 'bg-zinc-300'
                    const statusIcon = status === 'completed' ? <CheckCircle2 size={14} className="text-green-600" />
                      : status === 'failed' ? <XCircle size={14} className="text-red-600" />
                      : status === 'waiting' ? <Clock size={14} className="text-amber-600" />
                      : <div className="w-3.5 h-3.5 rounded-full border-2 border-zinc-300" />

                    return (
                      <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                        <div className="mt-0.5">{statusIcon}</div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-t1">{step.title}</span>
                            <Badge>{step.step_type}</Badge>
                            <Badge variant={status === 'completed' ? 'success' : status === 'failed' ? 'error' : status === 'waiting' ? 'warning' : 'default'}>
                              {status === 'waiting' ? t('waitingApproval') : status}
                            </Badge>
                          </div>
                          {result?.output && (
                            <p className="text-xs text-t3 mt-1 truncate">
                              {(result.output as Record<string, unknown>).message as string || JSON.stringify(result.output).slice(0, 120)}
                            </p>
                          )}
                          {result?.error && (
                            <p className="text-xs text-red-600 mt-1">{result.error}</p>
                          )}
                          {result?.started_at && result?.completed_at && (
                            <p className="text-xs text-t3 mt-0.5">{formatDuration(result.started_at, result.completed_at)}</p>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full mt-1.5 ${statusColor}`} />
                      </div>
                    )
                  })}
                  {runSteps.length === 0 && (
                    <p className="text-xs text-t3 py-4 text-center">{t('noSteps')}</p>
                  )}
                </div>
                {ctx.error && (
                  <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-xs font-medium text-red-700">{t('runFailed')}: {ctx.error}</p>
                  </div>
                )}
              </Card>
            )
          })()}
        </div>
      )}

      {/* ==================== TEMPLATES ==================== */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <LayoutTemplate size={32} className="mx-auto mb-3 text-t3 opacity-40" />
              <p className="text-sm font-medium text-t2 mb-1">{workflowTemplates.length === 0 ? 'No templates available' : 'No templates match your search'}</p>
              <p className="text-xs text-t3">{workflowTemplates.length === 0 ? 'Templates will appear here as they become available' : 'Try adjusting your search terms'}</p>
            </div>
          )}
          {filteredTemplates.map(template => (
            <Card key={template.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-tempo-50 flex items-center justify-center">
                  <LayoutTemplate size={16} className="text-tempo-600" />
                </div>
                <Badge variant="info">{template.category}</Badge>
              </div>
              <h3 className="text-sm font-semibold text-t1 mb-1">{template.title}</h3>
              <p className="text-xs text-t2 mb-4 line-clamp-2">{template.description}</p>
              <Button size="sm" variant="secondary" onClick={() => useTemplate(template.id)} className="w-full">
                <Plus size={14} /> {t('useTemplate')}
              </Button>
            </Card>
          ))}
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Create/Edit Workflow */}
      <Modal open={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} title={editingWorkflow ? t('editWorkflow') : t('createWorkflow')}>
        <div className="space-y-4">
          <Input label={t('workflowTitle')} placeholder={t('workflowTitlePlaceholder')} value={workflowForm.title} onChange={(e) => setWorkflowForm({ ...workflowForm, title: e.target.value })} />
          <Textarea label={t('description')} rows={3} value={workflowForm.description} onChange={(e) => setWorkflowForm({ ...workflowForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('status')} value={workflowForm.status} onChange={(e) => setWorkflowForm({ ...workflowForm, status: e.target.value })} options={[
              { value: 'draft', label: t('statusDraft') },
              { value: 'active', label: t('statusActive') },
              { value: 'paused', label: t('statusPaused') },
            ]} />
            <Select label={t('triggerType')} value={workflowForm.trigger_type} onChange={(e) => setWorkflowForm({ ...workflowForm, trigger_type: e.target.value })} options={[
              { value: 'manual', label: t('triggerManual') },
              { value: 'event', label: t('triggerEvent') },
              { value: 'schedule', label: t('triggerSchedule') },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowWorkflowModal(false)} disabled={saving}>{tc('cancel')}</Button>
            <Button onClick={submitWorkflow} disabled={saving}>{saving ? 'Saving...' : editingWorkflow ? tc('saveChanges') : t('createWorkflow')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit Step */}
      <Modal open={showStepModal} onClose={() => setShowStepModal(false)} title={editingStep ? t('editStep') : t('addStep')}>
        <div className="space-y-4">
          <Select label={t('stepType')} value={stepForm.step_type} onChange={(e) => setStepForm({ ...stepForm, step_type: e.target.value })} options={[
            { value: 'action', label: t('typeAction') },
            { value: 'condition', label: t('typeCondition') },
            { value: 'delay', label: t('typeDelay') },
            { value: 'notification', label: t('typeNotification') },
            { value: 'approval', label: t('typeApproval') },
          ]} />
          <Input label={t('stepTitle')} placeholder={t('stepTitlePlaceholder')} value={stepForm.title} onChange={(e) => setStepForm({ ...stepForm, title: e.target.value })} />
          <Textarea label={t('stepConfig')} placeholder='{"action": "send_email", "to": "manager"}' rows={3} value={stepForm.config} onChange={(e) => setStepForm({ ...stepForm, config: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowStepModal(false)} disabled={saving}>{tc('cancel')}</Button>
            <Button onClick={submitStep} disabled={saving}>{saving ? 'Saving...' : editingStep ? tc('saveChanges') : t('addStep')}</Button>
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
