'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { PieChart, Plus, DollarSign } from 'lucide-react'
import { demoBudgets, demoDepartments } from '@/lib/demo-data'

export default function BudgetsPage() {
  const totalBudget = demoBudgets.reduce((a, b) => a + b.total_amount, 0)
  const totalSpent = demoBudgets.reduce((a, b) => a + b.spent_amount, 0)
  const utilization = Math.round(totalSpent / totalBudget * 100)

  return (
    <>
      <Header title="Budgets" subtitle="Budget management and tracking" actions={<Button size="sm"><Plus size={14} /> New Budget</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Budget" value={`$${(totalBudget / 1000000).toFixed(1)}M`} change="FY 2026" changeType="neutral" icon={<PieChart size={20} />} />
        <StatCard label="Spent" value={`$${(totalSpent / 1000000).toFixed(1)}M`} change={`${utilization}% utilized`} changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Remaining" value={`$${((totalBudget - totalSpent) / 1000000).toFixed(1)}M`} change="Available" changeType="positive" />
        <StatCard label="Active Budgets" value={demoBudgets.filter(b => b.status === 'active').length} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {demoBudgets.map(budget => {
          const dept = demoDepartments.find(d => d.id === budget.department_id)
          const pct = Math.round(budget.spent_amount / budget.total_amount * 100)
          return (
            <Card key={budget.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{budget.name}</h3>
                  <p className="text-xs text-t3">{dept?.name} - FY {budget.fiscal_year}</p>
                </div>
                <Badge variant={budget.status === 'active' ? 'success' : 'default'}>{budget.status}</Badge>
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
            </Card>
          )
        })}
      </div>
    </>
  )
}
