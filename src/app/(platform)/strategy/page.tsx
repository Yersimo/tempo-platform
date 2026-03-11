'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea, Select } from '@/components/ui/input'
import {
  Plus, Compass, Target, TrendingUp, BarChart3,
  Pencil, Trash2, ChevronRight, ArrowUpRight
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AIScoreBadge, AIAlertBanner, AIInsightCard, AIEnhancingIndicator } from '@/components/ai'
import { scoreOKRQuality, analyzeStrategyAlignment, forecastKPITrend } from '@/lib/ai-engine'
import { useAI } from '@/lib/use-ai'

export default function StrategyPage() {
  const {
    strategicObjectives, keyResults, initiatives, kpiDefinitions, kpiMeasurements,
    goals, employees,
    addStrategicObjective, updateStrategicObjective, deleteStrategicObjective,
    addKeyResult, updateKeyResult, deleteKeyResult,
    addInitiative, updateInitiative, deleteInitiative,
    addKPIDefinition, addKPIMeasurement,
    getEmployeeName, currentEmployeeId, departments, getDepartmentName,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['strategicObjectives', 'keyResults', 'initiatives', 'kpiDefinitions', 'kpiMeasurements', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const t = useTranslations('strategy')
  const tc = useTranslations('common')

  const [activeTab, setActiveTab] = useState('map')

  // Objective modal
  const [showObjModal, setShowObjModal] = useState(false)
  const [editingObj, setEditingObj] = useState<string | null>(null)
  const [objForm, setObjForm] = useState({
    title: '', description: '', status: 'active' as string, owner_id: '', period: String(new Date().getFullYear()), progress: 0,
  })

  // Key Result modal
  const [showKRModal, setShowKRModal] = useState(false)
  const [krForm, setKRForm] = useState({
    title: '', objective_id: '', target_value: 100, current_value: 0, unit: '%', owner_id: '', due_date: '',
  })

  // Initiative modal
  const [showInitModal, setShowInitModal] = useState(false)
  const [editingInit, setEditingInit] = useState<string | null>(null)
  const [initForm, setInitForm] = useState({
    title: '', description: '', status: 'planned' as string, objective_id: '', owner_id: '',
    start_date: '', end_date: '', progress: 0, budget: 0, currency: 'USD',
  })

  // KPI modal
  const [showKPIModal, setShowKPIModal] = useState(false)
  const [kpiForm, setKPIForm] = useState({
    name: '', description: '', unit: '%', target_value: 100, frequency: 'monthly' as string, department_id: '', owner_id: '',
  })

  // Delete confirmation
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string } | null>(null)

  const tabs = [
    { id: 'map', label: t('tabStrategyMap') },
    { id: 'okrs', label: t('tabOKRs'), count: strategicObjectives.length },
    { id: 'initiatives', label: t('tabInitiatives'), count: initiatives.length },
    { id: 'kpis', label: t('tabKPIs'), count: kpiDefinitions.length },
  ]

  // Stats
  const activeObjectives = strategicObjectives.filter(o => o.status === 'active').length
  const avgKRProgress = keyResults.length > 0
    ? Math.round(keyResults.reduce((a, kr) => a + (kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0), 0) / keyResults.length)
    : 0
  const activeInitiatives = initiatives.filter(i => i.status === 'in_progress').length
  const kpisOnTrack = kpiDefinitions.filter(kpi => {
    const latest = kpiMeasurements.filter(m => m.kpi_id === kpi.id).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())[0]
    return latest && kpi.target_value && (latest.value / kpi.target_value) >= 0.7
  }).length

  // AI insights
  const okrScores = useMemo(() => {
    const scores: Record<string, ReturnType<typeof scoreOKRQuality>> = {}
    for (const obj of strategicObjectives) {
      const krs = keyResults.filter(kr => kr.objective_id === obj.id)
      scores[obj.id] = scoreOKRQuality(obj, krs)
    }
    return scores
  }, [strategicObjectives, keyResults])

  const alignmentInsights = useMemo(() =>
    analyzeStrategyAlignment(strategicObjectives, goals, initiatives),
    [strategicObjectives, goals, initiatives]
  )

  const kpiTrends = useMemo(() => {
    const trends: Record<string, ReturnType<typeof forecastKPITrend>> = {}
    for (const kpi of kpiDefinitions) {
      const measurements = kpiMeasurements.filter(m => m.kpi_id === kpi.id)
      trends[kpi.id] = forecastKPITrend(kpi, measurements)
    }
    return trends
  }, [kpiDefinitions, kpiMeasurements])

  // Claude AI enhancement - OKR quality
  const { result: enhancedAlignment, isLoading: alignmentLoading } = useAI({
    action: 'enhanceOKRQuality',
    data: { objectives: strategicObjectives.length, keyResults: keyResults.length, initiatives: initiatives.length },
    fallback: alignmentInsights,
    enabled: alignmentInsights.length > 0,
    cacheKey: `strategy-alignment-${strategicObjectives.length}`,
  })

  // CRUD handlers
  function openNewObjective() {
    setEditingObj(null)
    setObjForm({ title: '', description: '', status: 'active', owner_id: employees[0]?.id || '', period: String(new Date().getFullYear()), progress: 0 })
    setShowObjModal(true)
  }

  function openEditObjective(id: string) {
    const o = strategicObjectives.find(x => x.id === id)
    if (!o) return
    setEditingObj(id)
    setObjForm({
      title: o.title, description: o.description || '', status: o.status,
      owner_id: o.owner_id, period: o.period, progress: o.progress,
    })
    setShowObjModal(true)
  }

  function submitObjective() {
    if (!objForm.title) return
    const data = {
      title: objForm.title,
      description: objForm.description || null,
      status: objForm.status,
      owner_id: objForm.owner_id || currentEmployeeId,
      period: objForm.period,
      progress: objForm.progress,
    }
    if (editingObj) {
      updateStrategicObjective(editingObj, data)
    } else {
      addStrategicObjective(data)
    }
    setShowObjModal(false)
  }

  function submitKeyResult() {
    if (!krForm.title || !krForm.objective_id) return
    addKeyResult({
      title: krForm.title,
      objective_id: krForm.objective_id,
      target_value: krForm.target_value,
      current_value: krForm.current_value,
      unit: krForm.unit,
      owner_id: krForm.owner_id || currentEmployeeId,
      due_date: krForm.due_date || `${new Date().getFullYear()}-12-31`,
    })
    setShowKRModal(false)
  }

  function openNewInitiative() {
    setEditingInit(null)
    setInitForm({ title: '', description: '', status: 'planned', objective_id: '', owner_id: '', start_date: '', end_date: '', progress: 0, budget: 0, currency: 'USD' })
    setShowInitModal(true)
  }

  function openEditInitiative(id: string) {
    const i = initiatives.find(x => x.id === id)
    if (!i) return
    setEditingInit(id)
    setInitForm({
      title: i.title, description: i.description || '', status: i.status,
      objective_id: i.objective_id || '', owner_id: i.owner_id,
      start_date: i.start_date || '', end_date: i.end_date || '',
      progress: i.progress, budget: i.budget || 0, currency: i.currency || 'USD',
    })
    setShowInitModal(true)
  }

  function submitInitiative() {
    if (!initForm.title) return
    const data = {
      title: initForm.title,
      description: initForm.description || null,
      status: initForm.status,
      objective_id: initForm.objective_id || null,
      owner_id: initForm.owner_id || currentEmployeeId,
      start_date: initForm.start_date || new Date().toISOString().split('T')[0],
      end_date: initForm.end_date || `${new Date().getFullYear()}-12-31`,
      progress: initForm.progress,
      budget: initForm.budget || null,
      currency: initForm.currency,
    }
    if (editingInit) {
      updateInitiative(editingInit, data)
    } else {
      addInitiative(data)
    }
    setShowInitModal(false)
  }

  function submitKPI() {
    if (!kpiForm.name) return
    addKPIDefinition({
      name: kpiForm.name,
      description: kpiForm.description || null,
      unit: kpiForm.unit,
      target_value: kpiForm.target_value,
      frequency: kpiForm.frequency,
      department_id: kpiForm.department_id || null,
      owner_id: kpiForm.owner_id || currentEmployeeId,
    })
    setShowKPIModal(false)
  }

  function confirmDelete() {
    if (!deleteConfirm) return
    if (deleteConfirm.type === 'objective') deleteStrategicObjective(deleteConfirm.id)
    if (deleteConfirm.type === 'keyResult') deleteKeyResult(deleteConfirm.id)
    if (deleteConfirm.type === 'initiative') deleteInitiative(deleteConfirm.id)
    setDeleteConfirm(null)
  }

  const objStatusColor = (s: string) =>
    s === 'active' ? 'success' : s === 'completed' ? 'info' : s === 'at_risk' ? 'warning' : 'default'
  const initStatusColor = (s: string) =>
    s === 'in_progress' ? 'info' : s === 'completed' ? 'success' : s === 'on_hold' ? 'warning' : s === 'cancelled' ? 'error' : 'default'

  if (pageLoading) {
    return (
      <>
        <Header
          title={t('title')}
          subtitle={t('subtitle')}
          actions={<Button size="sm" disabled><Plus size={14} /> {t('newObjective')}</Button>}
        />
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
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={openNewInitiative}><Plus size={14} /> {t('newInitiative')}</Button>
            <Button size="sm" onClick={openNewObjective}><Plus size={14} /> {t('newObjective')}</Button>
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('strategicObjectives')} value={strategicObjectives.length} change={`${activeObjectives} ${t('active')}`} changeType="neutral" icon={<Compass size={20} />} />
        <StatCard label={t('keyResultsProgress')} value={`${avgKRProgress}%`} change={`${keyResults.length} ${t('keyResults')}`} changeType={avgKRProgress >= 60 ? 'positive' : 'neutral'} icon={<Target size={20} />} />
        <StatCard label={t('activeInitiatives')} value={activeInitiatives} change={`${initiatives.length} ${t('total')}`} changeType="neutral" icon={<TrendingUp size={20} />} />
        <StatCard label={t('kpisOnTrack')} value={`${kpisOnTrack}/${kpiDefinitions.length}`} changeType={kpisOnTrack >= kpiDefinitions.length * 0.7 ? 'positive' : 'negative'} icon={<BarChart3 size={20} />} />
      </div>

      {/* AI Alignment Alerts */}
      {enhancedAlignment.length > 0 && (
        <div className="relative mb-4">
          {alignmentLoading && <AIEnhancingIndicator isLoading />}
          <AIAlertBanner insights={enhancedAlignment} />
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ==================== STRATEGY MAP ==================== */}
      {activeTab === 'map' && (
        <div className="space-y-6">
          {strategicObjectives.length === 0 && (
            <div className="py-12 text-center text-sm text-t3">{t('noObjectives')}</div>
          )}
          {strategicObjectives.map(obj => {
            const objKRs = keyResults.filter(kr => kr.objective_id === obj.id)
            const objInits = initiatives.filter(i => i.objective_id === obj.id)
            const score = okrScores[obj.id]

            return (
              <Card key={obj.id}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center">
                      <Compass size={18} className="text-tempo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-t1">{obj.title}</h3>
                        <Badge variant={objStatusColor(obj.status)}>{obj.status}</Badge>
                        {score && <AIScoreBadge score={score} />}
                      </div>
                      <p className="text-xs text-t3">{getEmployeeName(obj.owner_id)} - {obj.period}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEditObjective(obj.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors"><Pencil size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ type: 'objective', id: obj.id })} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                  </div>
                </div>

                {obj.description && <p className="text-xs text-t2 mb-3">{obj.description}</p>}
                <Progress value={obj.progress} showLabel className="mb-4" />

                {/* Key Results */}
                {objKRs.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-semibold text-t1 mb-2">{t('keyResults')}</p>
                    <div className="space-y-2">
                      {objKRs.map(kr => {
                        const pct = kr.target_value > 0 ? Math.round((kr.current_value / kr.target_value) * 100) : 0
                        return (
                          <div key={kr.id} className="flex items-center gap-3 bg-canvas rounded-lg px-3 py-2">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-t1">{kr.title}</p>
                              <p className="text-[0.65rem] text-t3">
                                {kr.current_value} / {kr.target_value} {kr.unit}
                              </p>
                            </div>
                            <div className="w-24">
                              <Progress value={pct} showLabel />
                            </div>
                            <button onClick={() => setDeleteConfirm({ type: 'keyResult', id: kr.id })} className="p-1 text-t3 hover:text-error"><Trash2 size={12} /></button>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Linked Initiatives */}
                {objInits.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-t1 mb-2">{t('linkedInitiatives')}</p>
                    <div className="flex flex-wrap gap-2">
                      {objInits.map(init => (
                        <Badge key={init.id} variant={initStatusColor(init.status)}>
                          {init.title} ({init.progress}%)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-3 pt-3 border-t border-divider">
                  <Button size="sm" variant="ghost" onClick={() => { setKRForm({ title: '', objective_id: obj.id, target_value: 100, current_value: 0, unit: '%', owner_id: '', due_date: '' }); setShowKRModal(true) }}>
                    <Plus size={12} /> {t('addKeyResult')}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ==================== OKRs TAB ==================== */}
      {activeTab === 'okrs' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('objectivesAndKeyResults')}</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => { setKRForm({ title: '', objective_id: strategicObjectives[0]?.id || '', target_value: 100, current_value: 0, unit: '%', owner_id: '', due_date: '' }); setShowKRModal(true) }}>
                  <Plus size={14} /> {t('addKeyResult')}
                </Button>
                <Button size="sm" onClick={openNewObjective}><Plus size={14} /> {t('newObjective')}</Button>
              </div>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {strategicObjectives.map(obj => {
              const objKRs = keyResults.filter(kr => kr.objective_id === obj.id)
              const score = okrScores[obj.id]
              return (
                <div key={obj.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-t1">{obj.title}</p>
                      <Badge variant={objStatusColor(obj.status)}>{obj.status}</Badge>
                      {score && <AIScoreBadge score={score} />}
                    </div>
                    <span className="text-xs text-t3">{obj.period}</span>
                  </div>
                  <Progress value={obj.progress} showLabel className="mb-2" />
                  {objKRs.map(kr => (
                    <div key={kr.id} className="ml-6 mt-2 flex items-center gap-3">
                      <Target size={12} className="text-tempo-600 shrink-0" />
                      <span className="text-xs text-t1 flex-1">{kr.title}</span>
                      <span className="text-xs text-t3">{kr.current_value}/{kr.target_value} {kr.unit}</span>
                      <Progress value={kr.target_value > 0 ? (kr.current_value / kr.target_value) * 100 : 0} className="w-20" />
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ==================== INITIATIVES TAB ==================== */}
      {activeTab === 'initiatives' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('initiatives')}</CardTitle>
              <Button size="sm" onClick={openNewInitiative}><Plus size={14} /> {t('newInitiative')}</Button>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {initiatives.length === 0 && (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noInitiatives')}</div>
            )}
            {initiatives.map(init => {
              const obj = strategicObjectives.find(o => o.id === init.objective_id)
              return (
                <div key={init.id} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-t1">{init.title}</p>
                        <Badge variant={initStatusColor(init.status)}>{init.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      {obj && <p className="text-xs text-t3">{t('linkedTo')}: {obj.title}</p>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditInitiative(init.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg"><Pencil size={14} /></button>
                      <button onClick={() => setDeleteConfirm({ type: 'initiative', id: init.id })} className="p-1.5 text-t3 hover:text-error hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
                    </div>
                  </div>
                  {init.description && <p className="text-xs text-t2 mb-2">{init.description}</p>}
                  <div className="flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <Progress value={init.progress} showLabel />
                    </div>
                    <span className="text-xs text-t3">{getEmployeeName(init.owner_id)}</span>
                    {init.budget && <span className="text-xs text-t3">{init.currency} {init.budget.toLocaleString()}</span>}
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* ==================== KPIs TAB ==================== */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => { setKPIForm({ name: '', description: '', unit: '%', target_value: 100, frequency: 'monthly', department_id: '', owner_id: '' }); setShowKPIModal(true) }}>
              <Plus size={14} /> {t('addKPI')}
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kpiDefinitions.map(kpi => {
              const measurements = kpiMeasurements.filter(m => m.kpi_id === kpi.id).sort((a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime())
              const latest = measurements[0]
              const pct = kpi.target_value && latest ? Math.round((latest.value / kpi.target_value) * 100) : 0
              const trend = kpiTrends[kpi.id]

              return (
                <Card key={kpi.id}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{kpi.name}</h3>
                      <p className="text-xs text-t3">{kpi.frequency} - {getDepartmentName(kpi.department_id || '')}</p>
                    </div>
                    <Badge variant={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error'}>
                      {pct}% {t('ofTarget')}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mb-3">
                    <div className="text-center">
                      <p className="tempo-stat text-2xl text-t1">{latest?.value ?? '-'}</p>
                      <p className="text-[0.6rem] text-t3">{t('current')} ({kpi.unit})</p>
                    </div>
                    <ArrowUpRight size={16} className={pct >= 70 ? 'text-success' : 'text-warning'} />
                    <div className="text-center">
                      <p className="tempo-stat text-2xl text-t3">{kpi.target_value}</p>
                      <p className="text-[0.6rem] text-t3">{t('target')} ({kpi.unit})</p>
                    </div>
                  </div>
                  <Progress value={pct} color={pct >= 70 ? 'success' : pct >= 40 ? 'warning' : 'error'} />
                  {trend && <AIInsightCard insight={trend} className="mt-3" />}
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Objective Modal */}
      <Modal open={showObjModal} onClose={() => setShowObjModal(false)} title={editingObj ? t('editObjective') : t('createObjective')}>
        <div className="space-y-4">
          <Input label={t('objectiveTitle')} placeholder={t('objectiveTitlePlaceholder')} value={objForm.title} onChange={(e) => setObjForm({ ...objForm, title: e.target.value })} />
          <Textarea label={t('description')} rows={3} value={objForm.description} onChange={(e) => setObjForm({ ...objForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('status')} value={objForm.status} onChange={(e) => setObjForm({ ...objForm, status: e.target.value })} options={[
              { value: 'active', label: t('statusActive') },
              { value: 'completed', label: t('statusCompleted') },
              { value: 'at_risk', label: t('statusAtRisk') },
              { value: 'draft', label: t('statusDraft') },
            ]} />
            <Select label={t('owner')} value={objForm.owner_id} onChange={(e) => setObjForm({ ...objForm, owner_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('period')} value={objForm.period} onChange={(e) => setObjForm({ ...objForm, period: e.target.value })} />
            {editingObj && <Input label={t('progress')} type="number" min={0} max={100} value={objForm.progress} onChange={(e) => setObjForm({ ...objForm, progress: Number(e.target.value) })} />}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowObjModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitObjective}>{editingObj ? tc('saveChanges') : t('createObjective')}</Button>
          </div>
        </div>
      </Modal>

      {/* Key Result Modal */}
      <Modal open={showKRModal} onClose={() => setShowKRModal(false)} title={t('addKeyResult')}>
        <div className="space-y-4">
          <Input label={t('keyResultTitle')} placeholder={t('keyResultTitlePlaceholder')} value={krForm.title} onChange={(e) => setKRForm({ ...krForm, title: e.target.value })} />
          <Select label={t('objective')} value={krForm.objective_id} onChange={(e) => setKRForm({ ...krForm, objective_id: e.target.value })} options={strategicObjectives.map(o => ({ value: o.id, label: o.title }))} />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('targetValue')} type="number" value={krForm.target_value} onChange={(e) => setKRForm({ ...krForm, target_value: Number(e.target.value) })} />
            <Input label={t('currentValue')} type="number" value={krForm.current_value} onChange={(e) => setKRForm({ ...krForm, current_value: Number(e.target.value) })} />
            <Input label={t('unit')} value={krForm.unit} onChange={(e) => setKRForm({ ...krForm, unit: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('owner')} value={krForm.owner_id} onChange={(e) => setKRForm({ ...krForm, owner_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
            <Input label={t('dueDate')} type="date" value={krForm.due_date} onChange={(e) => setKRForm({ ...krForm, due_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowKRModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitKeyResult}>{t('addKeyResult')}</Button>
          </div>
        </div>
      </Modal>

      {/* Initiative Modal */}
      <Modal open={showInitModal} onClose={() => setShowInitModal(false)} title={editingInit ? t('editInitiative') : t('createInitiative')} size="lg">
        <div className="space-y-4">
          <Input label={t('initiativeTitle')} placeholder={t('initiativeTitlePlaceholder')} value={initForm.title} onChange={(e) => setInitForm({ ...initForm, title: e.target.value })} />
          <Textarea label={t('description')} rows={3} value={initForm.description} onChange={(e) => setInitForm({ ...initForm, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('status')} value={initForm.status} onChange={(e) => setInitForm({ ...initForm, status: e.target.value })} options={[
              { value: 'planned', label: t('statusPlanned') },
              { value: 'in_progress', label: t('statusInProgress') },
              { value: 'completed', label: t('statusCompleted') },
              { value: 'on_hold', label: t('statusOnHold') },
            ]} />
            <Select label={t('linkedObjective')} value={initForm.objective_id} onChange={(e) => setInitForm({ ...initForm, objective_id: e.target.value })} options={[{ value: '', label: t('none') }, ...strategicObjectives.map(o => ({ value: o.id, label: o.title }))]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('owner')} value={initForm.owner_id} onChange={(e) => setInitForm({ ...initForm, owner_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
            {editingInit && <Input label={t('progress')} type="number" min={0} max={100} value={initForm.progress} onChange={(e) => setInitForm({ ...initForm, progress: Number(e.target.value) })} />}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={initForm.start_date} onChange={(e) => setInitForm({ ...initForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={initForm.end_date} onChange={(e) => setInitForm({ ...initForm, end_date: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowInitModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitInitiative}>{editingInit ? tc('saveChanges') : t('createInitiative')}</Button>
          </div>
        </div>
      </Modal>

      {/* KPI Modal */}
      <Modal open={showKPIModal} onClose={() => setShowKPIModal(false)} title={t('addKPI')}>
        <div className="space-y-4">
          <Input label={t('kpiName')} placeholder={t('kpiNamePlaceholder')} value={kpiForm.name} onChange={(e) => setKPIForm({ ...kpiForm, name: e.target.value })} />
          <Textarea label={t('description')} rows={2} value={kpiForm.description} onChange={(e) => setKPIForm({ ...kpiForm, description: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('unit')} value={kpiForm.unit} onChange={(e) => setKPIForm({ ...kpiForm, unit: e.target.value })} />
            <Input label={t('targetValue')} type="number" value={kpiForm.target_value} onChange={(e) => setKPIForm({ ...kpiForm, target_value: Number(e.target.value) })} />
            <Select label={t('frequency')} value={kpiForm.frequency} onChange={(e) => setKPIForm({ ...kpiForm, frequency: e.target.value })} options={[
              { value: 'daily', label: t('frequencyDaily') },
              { value: 'weekly', label: t('frequencyWeekly') },
              { value: 'monthly', label: t('frequencyMonthly') },
              { value: 'quarterly', label: t('frequencyQuarterly') },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowKPIModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitKPI}>{t('addKPI')}</Button>
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
