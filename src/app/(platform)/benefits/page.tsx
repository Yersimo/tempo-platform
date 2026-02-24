'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Shield, Heart, Eye, Wallet, Plus, Pencil } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard, AIRecommendationList } from '@/components/ai'
import { recommendBenefitPlan, optimizeBenefitsCost } from '@/lib/ai-engine'

const iconMap: Record<string, React.ReactNode> = {
  medical: <Heart size={20} />,
  vision: <Eye size={20} />,
  retirement: <Wallet size={20} />,
  life: <Shield size={20} />,
  dental: <Heart size={20} />,
}

export default function BenefitsPage() {
  const t = useTranslations('benefits')
  const tc = useTranslations('common')
  const {
    benefitPlans, employees,
    addBenefitPlan, updateBenefitPlan,
  } = useTempo()

  const benefitRecs = useMemo(() => recommendBenefitPlan(benefitPlans, employees), [benefitPlans, employees])
  const costInsight = useMemo(() => optimizeBenefitsCost(benefitPlans, employees), [benefitPlans, employees])

  // Add Plan modal
  const [showPlanModal, setShowPlanModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState<string | null>(null)
  const [planForm, setPlanForm] = useState({
    name: '',
    type: 'medical' as string,
    provider: '',
    cost_employee: 0,
    cost_employer: 0,
    description: '',
    is_active: true,
    currency: 'USD',
  })

  const activePlans = benefitPlans.filter(p => p.is_active)
  const totalEmployerCost = benefitPlans.reduce((a, p) => a + p.cost_employer, 0)
  const uniqueProviders = [...new Set(benefitPlans.map(p => p.provider))].length
  const enrollmentRate = employees.length > 0
    ? Math.round((Math.min(employees.length - 2, employees.length) / employees.length) * 100)
    : 0

  // ---- Plan CRUD ----
  function openNewPlan() {
    setEditingPlan(null)
    setPlanForm({
      name: '',
      type: 'medical',
      provider: '',
      cost_employee: 0,
      cost_employer: 0,
      description: '',
      is_active: true,
      currency: 'USD',
    })
    setShowPlanModal(true)
  }

  function openEditPlan(id: string) {
    const plan = benefitPlans.find(p => p.id === id)
    if (!plan) return
    setEditingPlan(id)
    setPlanForm({
      name: plan.name,
      type: plan.type,
      provider: plan.provider,
      cost_employee: plan.cost_employee,
      cost_employer: plan.cost_employer,
      description: plan.description || '',
      is_active: plan.is_active,
      currency: plan.currency || 'USD',
    })
    setShowPlanModal(true)
  }

  function submitPlan() {
    if (!planForm.name || !planForm.provider) return
    const data = {
      name: planForm.name,
      type: planForm.type,
      provider: planForm.provider,
      cost_employee: Number(planForm.cost_employee) || 0,
      cost_employer: Number(planForm.cost_employer) || 0,
      description: planForm.description,
      is_active: planForm.is_active,
      currency: planForm.currency,
    }
    if (editingPlan) {
      updateBenefitPlan(editingPlan, data)
    } else {
      addBenefitPlan(data)
    }
    setShowPlanModal(false)
  }

  function togglePlanStatus(id: string, currentStatus: boolean) {
    updateBenefitPlan(id, { is_active: !currentStatus })
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button size="sm" onClick={openNewPlan}>
            <Plus size={14} /> {t('addPlan')}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('activePlans')} value={activePlans.length} icon={<Shield size={20} />} />
        <StatCard label={t('enrollmentRate')} value={`${enrollmentRate}%`} change="Above target" changeType="positive" />
        <StatCard label={t('monthlyEmployerCost')} value={`$${totalEmployerCost.toLocaleString()}`} change={tc('perEmployee')} changeType="neutral" href="/finance/budgets" />
        <StatCard label={t('providers')} value={uniqueProviders} change={t('activePartnerships')} changeType="neutral" />
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AIInsightCard
          insight={costInsight}
        />
        <AIRecommendationList
          title={t('benefitRecommendations')}
          recommendations={benefitRecs}
        />
      </div>

      {/* Benefit Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {benefitPlans.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-t3">
            {t('noBenefitPlans')}
          </div>
        )}
        {benefitPlans.map(plan => {
          // Deterministic enrollment based on plan index
          const planIndex = benefitPlans.indexOf(plan)
          const enrolledCount = Math.max(employees.length - (planIndex * 3 + 2), 0)
          const enrollPct = employees.length > 0 ? Math.round((enrolledCount / employees.length) * 100) : 0
          return (
            <Card key={plan.id}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600">
                  {iconMap[plan.type] || <Shield size={20} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-t1">{plan.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.is_active ? 'success' : 'default'}>
                        {plan.is_active ? tc('active') : tc('inactive')}
                      </Badge>
                      <button
                        onClick={() => openEditPlan(plan.id)}
                        className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-t3 mb-3">{plan.description}</p>
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <p className="text-[0.6rem] text-t3 uppercase">{t('provider')}</p>
                      <p className="text-xs font-medium text-t1">{plan.provider}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] text-t3 uppercase">{t('employeeCost')}</p>
                      <p className="text-xs font-medium text-t1">${plan.cost_employee}/mo</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] text-t3 uppercase">{t('employerCost')}</p>
                      <p className="text-xs font-medium text-t1">${plan.cost_employer}/mo</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t3">{t('enrollment')}</span>
                      <span className="text-t2">{t('enrollmentCount', { enrolled: enrolledCount, total: employees.length })}</span>
                    </div>
                    <Progress value={enrollPct} color="success" />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant={plan.is_active ? 'ghost' : 'primary'}
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? tc('deactivate') : tc('activate')}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Benefit Cost Summary Table */}
      <Card padding="none">
        <CardHeader><CardTitle>{t('benefitCostSummary')}</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tablePlan')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableStatus')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableEmployeeMo')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableEmployerMo')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableTotalMo')}</th>
                <th className="tempo-th text-right px-4 py-3">{t('tableAnnualCost')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {benefitPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3 text-sm font-medium text-t1">{plan.name}</td>
                  <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={plan.is_active ? 'success' : 'default'}>
                      {plan.is_active ? tc('active') : tc('inactive')}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employee}</td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employer}</td>
                  <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${plan.cost_employee + plan.cost_employer}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-t1 text-right">
                    ${((plan.cost_employee + plan.cost_employer) * employees.length * 12).toLocaleString()}
                  </td>
                </tr>
              ))}
              {benefitPlans.length > 0 && (
                <tr className="bg-canvas font-semibold">
                  <td className="px-6 py-3 text-sm text-t1" colSpan={3}>{tc('total')}</td>
                  <td className="px-4 py-3 text-sm text-t1 text-right">
                    ${benefitPlans.reduce((a, p) => a + p.cost_employee, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-t1 text-right">
                    ${benefitPlans.reduce((a, p) => a + p.cost_employer, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-t1 text-right">
                    ${benefitPlans.reduce((a, p) => a + p.cost_employee + p.cost_employer, 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-t1 text-right">
                    ${(benefitPlans.reduce((a, p) => a + p.cost_employee + p.cost_employer, 0) * employees.length * 12).toLocaleString()}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ---- MODALS ---- */}

      {/* Add/Edit Plan Modal */}
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? t('editPlanModal') : t('addPlanModal')}>
        <div className="space-y-4">
          <Input
            label={t('planName')}
            placeholder={t('planNamePlaceholder')}
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={tc('type')}
              value={planForm.type}
              onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
              options={[
                { value: 'medical', label: t('typeMedical') },
                { value: 'dental', label: t('typeDental') },
                { value: 'vision', label: t('typeVision') },
                { value: 'life', label: t('typeLife') },
                { value: 'retirement', label: t('typeRetirement') },
              ]}
            />
            <Input
              label={t('providerLabel')}
              placeholder={t('providerPlaceholder')}
              value={planForm.provider}
              onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label={t('employeeCostMo')}
              type="number"
              min={0}
              value={planForm.cost_employee}
              onChange={(e) => setPlanForm({ ...planForm, cost_employee: Number(e.target.value) })}
            />
            <Input
              label={t('employerCostMo')}
              type="number"
              min={0}
              value={planForm.cost_employer}
              onChange={(e) => setPlanForm({ ...planForm, cost_employer: Number(e.target.value) })}
            />
            <Select
              label={tc('currency')}
              value={planForm.currency}
              onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: tc('currencyUSD') },
                { value: 'NGN', label: tc('currencyNGN') },
                { value: 'GHS', label: tc('currencyGHS') },
                { value: 'KES', label: tc('currencyKES') },
                { value: 'XOF', label: tc('currencyXOF') },
              ]}
            />
          </div>
          <Textarea
            label={tc('description')}
            placeholder={t('descriptionPlaceholder')}
            rows={3}
            value={planForm.description}
            onChange={(e) => setPlanForm({ ...planForm, description: e.target.value })}
          />
          <label className="flex items-center gap-2 text-sm text-t2">
            <input
              type="checkbox"
              checked={planForm.is_active}
              onChange={(e) => setPlanForm({ ...planForm, is_active: e.target.checked })}
              className="rounded border-divider"
            />
            {t('planIsActive')}
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPlan}>{editingPlan ? tc('saveChanges') : t('addPlan')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
