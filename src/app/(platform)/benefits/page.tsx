'use client'

import { useState, useMemo } from 'react'
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
        title="Benefits"
        subtitle="Benefit plans, enrollment, and provider management"
        actions={
          <Button size="sm" onClick={openNewPlan}>
            <Plus size={14} /> Add Plan
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Plans" value={activePlans.length} icon={<Shield size={20} />} />
        <StatCard label="Enrollment Rate" value={`${enrollmentRate}%`} change="Above target" changeType="positive" />
        <StatCard label="Monthly Employer Cost" value={`$${totalEmployerCost.toLocaleString()}`} change="Per employee" changeType="neutral" />
        <StatCard label="Providers" value={uniqueProviders} change="Active partnerships" changeType="neutral" />
      </div>

      {/* AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <AIInsightCard
          insight={costInsight}
        />
        <AIRecommendationList
          title="Benefit Recommendations"
          recommendations={benefitRecs}
        />
      </div>

      {/* Benefit Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {benefitPlans.length === 0 && (
          <div className="col-span-2 text-center py-12 text-sm text-t3">
            No benefit plans yet. Click &quot;Add Plan&quot; to create one.
          </div>
        )}
        {benefitPlans.map(plan => {
          const enrolledCount = Math.max(employees.length - Math.floor(Math.random() * 4), 0)
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
                        {plan.is_active ? 'Active' : 'Inactive'}
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
                      <p className="text-[0.6rem] text-t3 uppercase">Provider</p>
                      <p className="text-xs font-medium text-t1">{plan.provider}</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] text-t3 uppercase">Employee Cost</p>
                      <p className="text-xs font-medium text-t1">${plan.cost_employee}/mo</p>
                    </div>
                    <div>
                      <p className="text-[0.6rem] text-t3 uppercase">Employer Cost</p>
                      <p className="text-xs font-medium text-t1">${plan.cost_employer}/mo</p>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-t3">Enrollment</span>
                      <span className="text-t2">{enrolledCount}/{employees.length} employees</span>
                    </div>
                    <Progress value={enrollPct} color="success" />
                  </div>
                  <div className="flex justify-end mt-3">
                    <Button
                      size="sm"
                      variant={plan.is_active ? 'ghost' : 'primary'}
                      onClick={() => togglePlanStatus(plan.id, plan.is_active)}
                    >
                      {plan.is_active ? 'Deactivate' : 'Activate'}
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
        <CardHeader><CardTitle>Benefit Cost Summary</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Plan</th>
                <th className="tempo-th text-left px-4 py-3">Type</th>
                <th className="tempo-th text-left px-4 py-3">Status</th>
                <th className="tempo-th text-right px-4 py-3">Employee/mo</th>
                <th className="tempo-th text-right px-4 py-3">Employer/mo</th>
                <th className="tempo-th text-right px-4 py-3">Total/mo</th>
                <th className="tempo-th text-right px-4 py-3">Annual Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {benefitPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3 text-sm font-medium text-t1">{plan.name}</td>
                  <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                  <td className="px-4 py-3">
                    <Badge variant={plan.is_active ? 'success' : 'default'}>
                      {plan.is_active ? 'Active' : 'Inactive'}
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
                  <td className="px-6 py-3 text-sm text-t1" colSpan={3}>Total</td>
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
      <Modal open={showPlanModal} onClose={() => setShowPlanModal(false)} title={editingPlan ? 'Edit Benefit Plan' : 'Add Benefit Plan'}>
        <div className="space-y-4">
          <Input
            label="Plan Name"
            placeholder="e.g., Gold Medical Plan"
            value={planForm.name}
            onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Type"
              value={planForm.type}
              onChange={(e) => setPlanForm({ ...planForm, type: e.target.value })}
              options={[
                { value: 'medical', label: 'Medical' },
                { value: 'dental', label: 'Dental' },
                { value: 'vision', label: 'Vision' },
                { value: 'life', label: 'Life Insurance' },
                { value: 'retirement', label: 'Retirement' },
              ]}
            />
            <Input
              label="Provider"
              placeholder="e.g., AXA Mansard"
              value={planForm.provider}
              onChange={(e) => setPlanForm({ ...planForm, provider: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input
              label="Employee Cost/mo"
              type="number"
              min={0}
              value={planForm.cost_employee}
              onChange={(e) => setPlanForm({ ...planForm, cost_employee: Number(e.target.value) })}
            />
            <Input
              label="Employer Cost/mo"
              type="number"
              min={0}
              value={planForm.cost_employer}
              onChange={(e) => setPlanForm({ ...planForm, cost_employer: Number(e.target.value) })}
            />
            <Select
              label="Currency"
              value={planForm.currency}
              onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'NGN', label: 'NGN' },
                { value: 'GHS', label: 'GHS' },
                { value: 'KES', label: 'KES' },
                { value: 'XOF', label: 'XOF' },
              ]}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Describe the benefit plan coverage and details..."
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
            Plan is active
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPlanModal(false)}>Cancel</Button>
            <Button onClick={submitPlan}>{editingPlan ? 'Save Changes' : 'Add Plan'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
