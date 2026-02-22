'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { PieChart, Plus, DollarSign, Pencil } from 'lucide-react'
import { useTempo } from '@/lib/store'

export default function BudgetsPage() {
  const { budgets, departments, addBudget, updateBudget, getDepartmentName } = useTempo()

  const totalBudget = budgets.reduce((a, b) => a + b.total_amount, 0)
  const totalSpent = budgets.reduce((a, b) => a + b.spent_amount, 0)
  const utilization = totalBudget > 0 ? Math.round(totalSpent / totalBudget * 100) : 0
  const activeBudgets = budgets.filter(b => b.status === 'active').length

  // New Budget modal
  const [showBudgetModal, setShowBudgetModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState<string | null>(null)
  const [budgetForm, setBudgetForm] = useState({
    name: '',
    department_id: '',
    total_amount: '',
    spent_amount: '',
    fiscal_year: '2026',
    currency: 'USD',
  })

  function openNewBudget() {
    setEditingBudget(null)
    setBudgetForm({
      name: '',
      department_id: departments[0]?.id || '',
      total_amount: '',
      spent_amount: '',
      fiscal_year: '2026',
      currency: 'USD',
    })
    setShowBudgetModal(true)
  }

  function openEditBudget(id: string) {
    const b = budgets.find(x => x.id === id)
    if (!b) return
    setEditingBudget(id)
    setBudgetForm({
      name: b.name,
      department_id: b.department_id,
      total_amount: String(b.total_amount),
      spent_amount: String(b.spent_amount),
      fiscal_year: String(b.fiscal_year),
      currency: b.currency || 'USD',
    })
    setShowBudgetModal(true)
  }

  function submitBudget() {
    if (!budgetForm.name || !budgetForm.department_id || !budgetForm.total_amount) return
    const data = {
      name: budgetForm.name,
      department_id: budgetForm.department_id,
      total_amount: Number(budgetForm.total_amount),
      spent_amount: Number(budgetForm.spent_amount) || 0,
      fiscal_year: Number(budgetForm.fiscal_year) || 2026,
      status: 'active' as string,
      currency: budgetForm.currency,
    }
    if (editingBudget) {
      updateBudget(editingBudget, data)
    } else {
      addBudget(data)
    }
    setShowBudgetModal(false)
  }

  function closeBudget(id: string) {
    updateBudget(id, { status: 'closed' })
  }

  function reactivateBudget(id: string) {
    updateBudget(id, { status: 'active' })
  }

  return (
    <>
      <Header
        title="Budgets"
        subtitle="Budget management and tracking"
        actions={<Button size="sm" onClick={openNewBudget}><Plus size={14} /> New Budget</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Budget" value={`$${(totalBudget / 1000000).toFixed(1)}M`} change={`FY 2026`} changeType="neutral" icon={<PieChart size={20} />} />
        <StatCard label="Spent" value={`$${(totalSpent / 1000000).toFixed(1)}M`} change={`${utilization}% utilized`} changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Remaining" value={`$${((totalBudget - totalSpent) / 1000000).toFixed(1)}M`} change="Available" changeType="positive" />
        <StatCard label="Active Budgets" value={activeBudgets} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {budgets.map(budget => {
          const pct = budget.total_amount > 0 ? Math.round(budget.spent_amount / budget.total_amount * 100) : 0
          return (
            <Card key={budget.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{budget.name}</h3>
                  <p className="text-xs text-t3">{getDepartmentName(budget.department_id)} - FY {budget.fiscal_year}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={budget.status === 'active' ? 'success' : 'default'}>{budget.status}</Badge>
                  <button onClick={() => openEditBudget(budget.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">Budget</p>
                  <p className="text-sm font-semibold text-t1">${(budget.total_amount / 1000000).toFixed(1)}M</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">Spent</p>
                  <p className="text-sm font-semibold text-tempo-600">${(budget.spent_amount / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">Remaining</p>
                  <p className="text-sm font-semibold text-success">${((budget.total_amount - budget.spent_amount) / 1000000).toFixed(1)}M</p>
                </div>
              </div>
              <Progress value={pct} showLabel color={pct > 80 ? 'error' : pct > 50 ? 'warning' : 'success'} />
              <div className="flex justify-end mt-3 gap-2">
                {budget.status === 'active' && (
                  <Button size="sm" variant="ghost" onClick={() => closeBudget(budget.id)}>Close Budget</Button>
                )}
                {budget.status === 'closed' && (
                  <Button size="sm" variant="secondary" onClick={() => reactivateBudget(budget.id)}>Reactivate</Button>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* New/Edit Budget Modal */}
      <Modal open={showBudgetModal} onClose={() => setShowBudgetModal(false)} title={editingBudget ? 'Edit Budget' : 'Create New Budget'}>
        <div className="space-y-4">
          <Input label="Budget Name" placeholder="e.g., Engineering Q3 OpEx" value={budgetForm.name} onChange={(e) => setBudgetForm({ ...budgetForm, name: e.target.value })} />
          <Select label="Department" value={budgetForm.department_id} onChange={(e) => setBudgetForm({ ...budgetForm, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Total Amount" type="number" placeholder="5000000" value={budgetForm.total_amount} onChange={(e) => setBudgetForm({ ...budgetForm, total_amount: e.target.value })} />
            {editingBudget && (
              <Input label="Spent Amount" type="number" placeholder="0" value={budgetForm.spent_amount} onChange={(e) => setBudgetForm({ ...budgetForm, spent_amount: e.target.value })} />
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select label="Fiscal Year" value={budgetForm.fiscal_year} onChange={(e) => setBudgetForm({ ...budgetForm, fiscal_year: e.target.value })} options={[
              { value: '2025', label: '2025' },
              { value: '2026', label: '2026' },
              { value: '2027', label: '2027' },
            ]} />
            <Select label="Currency" value={budgetForm.currency} onChange={(e) => setBudgetForm({ ...budgetForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBudgetModal(false)}>Cancel</Button>
            <Button onClick={submitBudget}>{editingBudget ? 'Save Changes' : 'Create Budget'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
