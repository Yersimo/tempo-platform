'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { HeartPulse, TrendingUp, Plus, BarChart3 } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIAlertBanner } from '@/components/ai'
import { identifyEngagementDrivers } from '@/lib/ai-engine'

export default function EngagementPage() {
  const t = useTranslations('engagement')
  const tc = useTranslations('common')
  const { surveys, engagementScores, addSurvey, updateSurvey, getDepartmentName } = useTempo()
  const [activeTab, setActiveTab] = useState('surveys')
  const [showSurveyModal, setShowSurveyModal] = useState(false)
  const [viewResultsSurveyId, setViewResultsSurveyId] = useState<string | null>(null) // toggle results
  const [surveyForm, setSurveyForm] = useState({
    title: '',
    type: 'pulse' as 'pulse' | 'enps' | 'annual',
    status: 'active' as 'active' | 'closed',
    start_date: '',
    end_date: '',
    anonymous: true,
  })

  const tabs = [
    { id: 'surveys', label: t('tabSurveys'), count: surveys.length },
    { id: 'enps', label: t('tabEnps') },
    { id: 'heatmap', label: t('tabHeatmap') },
  ]

  const avgScore = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.overall_score, 0) / engagementScores.length) : 0
  const avgENPS = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.enps_score, 0) / engagementScores.length) : 0
  const avgResponse = engagementScores.length > 0 ? Math.round(engagementScores.reduce((a, s) => a + s.response_rate, 0) / engagementScores.length) : 0
  const activeSurveys = surveys.filter(s => s.status === 'active').length

  // AI-powered engagement insights
  const driverInsights = useMemo(() => identifyEngagementDrivers(engagementScores), [engagementScores])

  function submitSurvey() {
    if (!surveyForm.title || !surveyForm.start_date || !surveyForm.end_date) return
    addSurvey(surveyForm)
    setShowSurveyModal(false)
    setSurveyForm({ title: '', type: 'pulse', status: 'active', start_date: '', end_date: '', anonymous: true })
  }

  function closeSurvey(surveyId: string) {
    updateSurvey(surveyId, { status: 'closed' })
  }

  function reopenSurvey(surveyId: string) {
    updateSurvey(surveyId, { status: 'active' })
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={() => setShowSurveyModal(true)}><Plus size={14} /> {t('newSurvey')}</Button>}
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('engagementScore')} value={avgScore} change={t('orgAverage')} changeType="neutral" icon={<HeartPulse size={20} />} />
        <StatCard label={t('enps')} value={`+${avgENPS}`} change={t('vsLastQuarter')} changeType="positive" icon={<TrendingUp size={20} />} />
        <StatCard label={t('responseRate')} value={`${avgResponse}%`} change={t('aboveTarget')} changeType="positive" />
        <StatCard label={t('activeSurveys')} value={activeSurveys} icon={<BarChart3 size={20} />} />
      </div>
      {/* AI Engagement Insights */}
      {driverInsights.length > 0 && (
        <div className="mb-6 space-y-3">
          {driverInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'surveys' && (
        <Card padding="none">
          <CardHeader><CardTitle>{t('surveyManagement')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {surveys.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noSurveys')}</div>
            ) : surveys.map(survey => (
              <div key={survey.id}>
                <div className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                    <HeartPulse size={18} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{survey.title}</p>
                    <p className="text-xs text-t3">{survey.start_date} {tc('to')} {survey.end_date} {survey.anonymous ? t('anonymous') : ''}</p>
                  </div>
                  <Badge variant={survey.type === 'enps' ? 'info' : survey.type === 'pulse' ? 'orange' : 'default'}>
                    {survey.type.toUpperCase()}
                  </Badge>
                  <Badge variant={survey.status === 'active' ? 'success' : 'default'}>
                    {survey.status}
                  </Badge>
                  <div className="flex gap-1">
                    {survey.status === 'active' && (
                      <Button size="sm" variant="outline" onClick={() => closeSurvey(survey.id)}>{tc('close')}</Button>
                    )}
                    {survey.status === 'closed' && (
                      <Button size="sm" variant="ghost" onClick={() => reopenSurvey(survey.id)}>{tc('reopen')}</Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setViewResultsSurveyId(viewResultsSurveyId === survey.id ? null : survey.id)}>{t('viewResults')}</Button>
                  </div>
                </div>
                {viewResultsSurveyId === survey.id && (
                  <div className="px-6 pb-4 bg-canvas/50 border-t border-divider">
                    <div className="grid grid-cols-3 gap-4 py-4">
                      <div>
                        <p className="text-xs text-t3 mb-1">Responses</p>
                        <p className="text-lg font-semibold text-t1">{Math.floor(Math.random() * 20) + 10}</p>
                        <Progress value={avgResponse} showLabel color="success" />
                      </div>
                      <div>
                        <p className="text-xs text-t3 mb-1">Avg Score</p>
                        <p className="text-lg font-semibold text-tempo-600">{avgScore}/100</p>
                        <Progress value={avgScore} showLabel />
                      </div>
                      <div>
                        <p className="text-xs text-t3 mb-1">eNPS</p>
                        <p className="text-lg font-semibold text-green-600">+{avgENPS}</p>
                        <p className="text-[0.6rem] text-t3">Promoters outweigh detractors</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-divider">
                      <p className="text-xs text-t3 w-full mb-1">Top themes:</p>
                      {engagementScores.flatMap(s => s.themes).filter((v, i, a) => a.indexOf(v) === i).slice(0, 6).map(theme => (
                        <Badge key={theme} variant="default">{theme}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === 'enps' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {engagementScores.map(score => {
            const deptName = getDepartmentName(score.department_id)
            return (
              <Card key={score.id}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{deptName}</h3>
                    <p className="text-xs text-t3">{score.country_id} - {score.period}</p>
                  </div>
                  <div className="text-right">
                    <p className="tempo-stat text-2xl text-tempo-600">+{score.enps_score}</p>
                    <p className="text-[0.6rem] text-t3">{t('enpsLabel')}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <p className="text-xs text-t3">{t('overallScore')}</p>
                    <Progress value={score.overall_score} showLabel />
                  </div>
                  <div>
                    <p className="text-xs text-t3">{t('responseRate')}</p>
                    <Progress value={score.response_rate} showLabel color="success" />
                  </div>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {score.themes.map(theme => (
                    <Badge key={theme} variant="default">{theme}</Badge>
                  ))}
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'heatmap' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('heatmapTitle')}</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider">
                  <th className="tempo-th text-left px-4 py-3">{t('tableDepartment')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableOverall')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableEnps')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableResponse')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableTopThemes')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {engagementScores.map(score => {
                  const deptName = getDepartmentName(score.department_id)
                  const color = score.overall_score >= 80 ? 'bg-success/10 text-success' : score.overall_score >= 70 ? 'bg-warning/10 text-warning' : 'bg-error/10 text-error'
                  return (
                    <tr key={score.id}>
                      <td className="px-4 py-3 text-sm font-medium text-t1">{deptName}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${color}`}>{score.overall_score}</span>
                      </td>
                      <td className="px-4 py-3 text-center text-sm font-semibold text-t1">+{score.enps_score}</td>
                      <td className="px-4 py-3 text-center text-sm text-t2">{score.response_rate}%</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {score.themes.map(theme => <Badge key={theme} variant="default">{theme}</Badge>)}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* New Survey Modal */}
      <Modal open={showSurveyModal} onClose={() => setShowSurveyModal(false)} title={t('createSurveyModal')}>
        <div className="space-y-4">
          <Input label={t('surveyTitle')} value={surveyForm.title} onChange={(e) => setSurveyForm({ ...surveyForm, title: e.target.value })} placeholder={t('surveyTitlePlaceholder')} />
          <Select label={t('surveyType')} value={surveyForm.type} onChange={(e) => setSurveyForm({ ...surveyForm, type: e.target.value as 'pulse' | 'enps' | 'annual' })} options={[
            { value: 'pulse', label: t('typePulse') },
            { value: 'enps', label: t('typeEnps') },
            { value: 'annual', label: t('typeAnnual') },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('startDate')} type="date" value={surveyForm.start_date} onChange={(e) => setSurveyForm({ ...surveyForm, start_date: e.target.value })} />
            <Input label={t('endDate')} type="date" value={surveyForm.end_date} onChange={(e) => setSurveyForm({ ...surveyForm, end_date: e.target.value })} />
          </div>
          <label className="flex items-center gap-2 text-xs text-t1">
            <input type="checkbox" checked={surveyForm.anonymous} onChange={(e) => setSurveyForm({ ...surveyForm, anonymous: e.target.checked })} className="rounded border-divider" />
            {t('anonymousResponses')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowSurveyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitSurvey}>{t('createSurvey')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
