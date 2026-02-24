'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Banknote, TrendingUp, AlertTriangle, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useTempo } from '@/lib/store'
import { AIInsightPanel, AIAlertBanner } from '@/components/ai'
import { detectPayEquityGaps, detectCompAnomalies, modelBudgetImpact } from '@/lib/ai-engine'

export default function CompensationPage() {
  const { compBands, salaryReviews, employees, addCompBand, deleteCompBand, addSalaryReview, updateSalaryReview, currentEmployeeId } = useTempo()
  const t = useTranslations('compensation')
  const tc = useTranslations('common')
  const [activeTab, setActiveTab] = useState('benchmarking')
  const [showBandModal, setShowBandModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [bandForm, setBandForm] = useState({ role_title: '', level: 'Mid', country: '', min_salary: 0, mid_salary: 0, max_salary: 0, currency: 'USD', p25: 0, p50: 0, p75: 0, effective_date: '2026-01-01' })
  const [reviewForm, setReviewForm] = useState({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: '2026 Annual' })
  const [stipForm, setStipForm] = useState({ base: 72000, multiplier: 1.2, raroc: 0.95, target: 20 })

  const tabs = [
    { id: 'benchmarking', label: t('tabBenchmarking'), count: compBands.length },
    { id: 'salary-reviews', label: t('tabSalaryReviews'), count: salaryReviews.length },
    { id: 'stip', label: t('tabStipCalculator') },
    { id: 'bands', label: t('tabCompBands') },
  ]

  // AI-powered insights
  const equityInsights = useMemo(() => detectPayEquityGaps(employees, compBands), [employees, compBands])
  const compAnomaliesRaw = useMemo(() => detectCompAnomalies(salaryReviews, compBands), [salaryReviews, compBands])
  const compAnomalies = useMemo(() => compAnomaliesRaw.map(a => ({ id: a.id, category: 'anomaly' as const, severity: a.severity, title: a.metric, description: a.explanation, confidence: 'high' as const, confidenceScore: 80, suggestedAction: `Expected ${a.expectedValue}, got ${a.currentValue} (${a.deviationPercent}% deviation)`, module: 'compensation' })), [compAnomaliesRaw])
  const budgetImpact = useMemo(() => modelBudgetImpact(salaryReviews), [salaryReviews])

  const pendingReviews = salaryReviews.filter(s => s.status === 'pending_approval').length
  const belowMarket = compBands.filter(b => b.p50 && b.mid_salary / b.p50 < 0.95).length

  const targetBonus = stipForm.base * (stipForm.target / 100)
  const adjustedBonus = targetBonus * stipForm.multiplier * stipForm.raroc
  const perfImpact = targetBonus * (stipForm.multiplier - 1)
  const rarocAdj = targetBonus * stipForm.multiplier * (1 - stipForm.raroc)

  function submitBand() {
    if (!bandForm.role_title) return
    addCompBand(bandForm)
    setShowBandModal(false)
    setBandForm({ role_title: '', level: 'Mid', country: '', min_salary: 0, mid_salary: 0, max_salary: 0, currency: 'USD', p25: 0, p50: 0, p75: 0, effective_date: '2026-01-01' })
  }

  function submitReview() {
    if (!reviewForm.employee_id || !reviewForm.proposed_salary) return
    addSalaryReview({ ...reviewForm, proposed_by: currentEmployeeId, status: 'pending_approval', approved_by: null, currency: 'USD' })
    setShowReviewModal(false)
    setReviewForm({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: '2026 Annual' })
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBandModal(true)}><Plus size={14} /> {t('addBand')}</Button>
            <Button size="sm" onClick={() => setShowReviewModal(true)}><Plus size={14} /> {t('proposeReview')}</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('avgCompaRatio')} value={compBands.length > 0 ? (compBands.reduce((a, b) => a + (b.p50 ? b.mid_salary / b.p50 : 1), 0) / compBands.length).toFixed(2) : '-'} change={t('atMarket')} changeType="neutral" icon={<TrendingUp size={20} />} />
        <StatCard label={t('belowMarket')} value={belowMarket} change={t('rolesBelowP50')} changeType={belowMarket > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} href="/people" />
        <StatCard label={t('pendingReviews')} value={pendingReviews} />
        <StatCard label={t('totalStaffCost')} value={`$${(employees.length * 72000 / 1000000).toFixed(1)}M`} change={tc('annual')} changeType="neutral" icon={<Banknote size={20} />} href="/payroll" />
      </div>

      {/* AI Compensation Insights */}
      {compAnomalies.length > 0 && (
        <AIAlertBanner insights={compAnomalies} className="mb-4" />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <AIInsightPanel title={t('payEquityAnalysis')} insights={equityInsights} />
        <AIInsightPanel title={t('budgetImpactModeling')} narrative={{ summary: t('budgetImpactSummary', { count: budgetImpact.count, totalImpact: Math.round(budgetImpact.totalAnnualImpact).toLocaleString(), avgIncrease: Math.round(budgetImpact.avgIncrease).toLocaleString() }), bulletPoints: [t('budgetImpactReviewCount', { count: budgetImpact.count }), t('budgetImpactTotal', { amount: Math.round(budgetImpact.totalAnnualImpact).toLocaleString() }), t('budgetImpactAvg', { amount: Math.round(budgetImpact.avgIncrease).toLocaleString() })] }} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'benchmarking' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{t('benchmarkingTitle')}</CardTitle>
                <p className="text-xs text-t3 mt-0.5">{t('benchmarkingRegion')}</p>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableRole')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableP50Internal')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableP50Market')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableCR')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compBands.map(band => {
                  const cr = band.p50 ? (band.mid_salary / band.p50).toFixed(2) : tc('notAvailable')
                  const crNum = parseFloat(cr as string)
                  return (
                    <tr key={band.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${(band.p50 || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${crNum >= 1 ? 'text-success' : crNum >= 0.95 ? 'text-warning' : 'text-error'}`}>
                          {cr}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={crNum >= 1 ? 'success' : crNum >= 0.95 ? 'warning' : 'error'}>
                          {crNum >= 1 ? t('atMarketBadge') : crNum >= 0.95 ? t('belowMarketBadge') : t('belowP25Badge')}
                        </Badge>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'salary-reviews' && (
        <Card padding="none">
          <CardHeader><CardTitle>{t('salaryReviewProposals')}</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {salaryReviews.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">{t('noSalaryReviews')}</div>
            ) : salaryReviews.map(sr => {
              const emp = employees.find(e => e.id === sr.employee_id)
              const increase = ((sr.proposed_salary - sr.current_salary) / sr.current_salary * 100).toFixed(1)
              return (
                <div key={sr.id} className="px-6 py-4 flex items-center gap-4">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{emp?.profile?.full_name || tc('unknown')}</p>
                    <p className="text-xs text-t3">{emp?.job_title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-t3">${sr.current_salary.toLocaleString()} &rarr; ${sr.proposed_salary.toLocaleString()}</p>
                    <p className="text-xs font-medium text-success">+{increase}%</p>
                  </div>
                  <Badge variant={sr.status === 'approved' ? 'success' : sr.status === 'pending_approval' ? 'warning' : 'error'}>
                    {sr.status.replace('_', ' ')}
                  </Badge>
                  {sr.status === 'pending_approval' && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="primary" onClick={() => updateSalaryReview(sr.id, { status: 'approved', approved_by: currentEmployeeId })}>{tc('approve')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateSalaryReview(sr.id, { status: 'rejected' })}>{tc('reject')}</Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {activeTab === 'stip' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('stipTitle')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <Input label={t('baseSalary')} type="number" value={stipForm.base} onChange={(e) => setStipForm({ ...stipForm, base: Number(e.target.value) })} />
              <Input label={t('performanceMultiplier')} type="number" step="0.1" value={stipForm.multiplier} onChange={(e) => setStipForm({ ...stipForm, multiplier: Number(e.target.value) })} />
              <Input label={t('rarocFactor')} type="number" step="0.01" value={stipForm.raroc} onChange={(e) => setStipForm({ ...stipForm, raroc: Number(e.target.value) })} />
              <Input label={t('targetBonusPct')} type="number" value={stipForm.target} onChange={(e) => setStipForm({ ...stipForm, target: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2 bg-canvas rounded-xl p-6">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-4">{t('calculationResult')}</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-t3">{t('targetBonus')}</p>
                  <p className="tempo-stat text-2xl text-t1">${targetBonus.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('adjustedBonus')}</p>
                  <p className="tempo-stat text-2xl text-tempo-600">${Math.round(adjustedBonus).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('performanceImpact')}</p>
                  <p className={`text-sm font-medium ${perfImpact >= 0 ? 'text-success' : 'text-error'}`}>
                    {perfImpact >= 0 ? '+' : ''}${Math.round(perfImpact).toLocaleString()} ({perfImpact >= 0 ? '+' : ''}{((stipForm.multiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-t3">{t('rarocAdjustment')}</p>
                  <p className="text-sm font-medium text-warning">-${Math.round(rarocAdj).toLocaleString()} (-{((1 - stipForm.raroc) * 100).toFixed(0)}%)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'bands' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('compBandsTitle')}</CardTitle>
              <Button size="sm" onClick={() => setShowBandModal(true)}><Plus size={14} /> {t('addBand')}</Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableRole')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableLevel')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableCountry')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableMin')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableMid')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableMax')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compBands.map(band => (
                  <tr key={band.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.level}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.country || t('global')}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.min_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${band.mid_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.max_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="ghost" onClick={() => deleteCompBand(band.id)}>{tc('remove')}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showBandModal} onClose={() => setShowBandModal(false)} title={t('addBandModal')}>
        <div className="space-y-4">
          <Input label={t('roleTitle')} value={bandForm.role_title} onChange={(e) => setBandForm({ ...bandForm, role_title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label={t('tableLevel')} value={bandForm.level} onChange={(e) => setBandForm({ ...bandForm, level: e.target.value })} options={['Associate', 'Mid', 'Senior', 'Manager', 'Senior Manager', 'Director', 'Executive'].map(l => ({ value: l, label: l }))} />
            <Input label={t('tableCountry')} value={bandForm.country} onChange={(e) => setBandForm({ ...bandForm, country: e.target.value })} placeholder={t('countryPlaceholder')} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('minSalary')} type="number" value={bandForm.min_salary || ''} onChange={(e) => setBandForm({ ...bandForm, min_salary: Number(e.target.value) })} />
            <Input label={t('midSalary')} type="number" value={bandForm.mid_salary || ''} onChange={(e) => setBandForm({ ...bandForm, mid_salary: Number(e.target.value) })} />
            <Input label={t('maxSalary')} type="number" value={bandForm.max_salary || ''} onChange={(e) => setBandForm({ ...bandForm, max_salary: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label={t('p25Market')} type="number" value={bandForm.p25 || ''} onChange={(e) => setBandForm({ ...bandForm, p25: Number(e.target.value) })} />
            <Input label={t('p50Market')} type="number" value={bandForm.p50 || ''} onChange={(e) => setBandForm({ ...bandForm, p50: Number(e.target.value) })} />
            <Input label={t('p75Market')} type="number" value={bandForm.p75 || ''} onChange={(e) => setBandForm({ ...bandForm, p75: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBandModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBand}>{t('addBandButton')}</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title={t('proposeSalaryReview')}>
        <div className="space-y-4">
          <Select label={tc('employee')} value={reviewForm.employee_id} onChange={(e) => {
            const emp = employees.find(em => em.id === e.target.value)
            const band = compBands.find(b => b.level === emp?.level)
            setReviewForm({ ...reviewForm, employee_id: e.target.value, current_salary: band?.mid_salary || 60000 })
          }} options={[{ value: '', label: t('selectEmployee') }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('currentSalary')} type="number" value={reviewForm.current_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, current_salary: Number(e.target.value) })} />
            <Input label={t('proposedSalary')} type="number" value={reviewForm.proposed_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, proposed_salary: Number(e.target.value) })} />
          </div>
          <Input label={t('justification')} value={reviewForm.justification} onChange={(e) => setReviewForm({ ...reviewForm, justification: e.target.value })} placeholder={t('justificationPlaceholder')} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitReview}>{t('submitProposal')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
