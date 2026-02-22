'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Shield, Heart, Eye, Wallet, Plus } from 'lucide-react'
import { demoBenefitPlans } from '@/lib/demo-data'

const iconMap: Record<string, React.ReactNode> = {
  medical: <Heart size={20} />,
  vision: <Eye size={20} />,
  retirement: <Wallet size={20} />,
  life: <Shield size={20} />,
}

export default function BenefitsPage() {
  const totalEmployerCost = demoBenefitPlans.reduce((a, p) => a + p.cost_employer, 0)

  return (
    <>
      <Header title="Benefits" subtitle="Benefit plans, enrollment, and provider management" actions={<Button size="sm"><Plus size={14} /> Add Plan</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Plans" value={demoBenefitPlans.filter(p => p.is_active).length} icon={<Shield size={20} />} />
        <StatCard label="Enrollment Rate" value="94%" change="Above target" changeType="positive" />
        <StatCard label="Monthly Employer Cost" value={`$${totalEmployerCost.toLocaleString()}`} change="Per employee" changeType="neutral" />
        <StatCard label="Providers" value={3} change="Active partnerships" changeType="neutral" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {demoBenefitPlans.map(plan => (
          <Card key={plan.id}>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-tempo-50 flex items-center justify-center text-tempo-600">
                {iconMap[plan.type] || <Shield size={20} />}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-t1">{plan.name}</h3>
                  <Badge variant={plan.is_active ? 'success' : 'default'}>{plan.is_active ? 'Active' : 'Inactive'}</Badge>
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
                    <span className="text-t2">28/30 employees</span>
                  </div>
                  <Progress value={93} color="success" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="none">
        <CardHeader><CardTitle>Benefit Cost Summary</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Plan</th>
                <th className="tempo-th text-left px-4 py-3">Type</th>
                <th className="tempo-th text-right px-4 py-3">Employee/mo</th>
                <th className="tempo-th text-right px-4 py-3">Employer/mo</th>
                <th className="tempo-th text-right px-4 py-3">Total/mo</th>
                <th className="tempo-th text-right px-4 py-3">Annual Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demoBenefitPlans.map(plan => (
                <tr key={plan.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3 text-sm font-medium text-t1">{plan.name}</td>
                  <td className="px-4 py-3"><Badge>{plan.type}</Badge></td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employee}</td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">${plan.cost_employer}</td>
                  <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${plan.cost_employee + plan.cost_employer}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-t1 text-right">${((plan.cost_employee + plan.cost_employer) * 30 * 12).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
