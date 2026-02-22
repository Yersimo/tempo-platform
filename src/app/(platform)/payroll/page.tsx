'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Wallet, DollarSign, Users, Plus, FileText } from 'lucide-react'
import { demoPayrollRuns } from '@/lib/demo-data'

export default function PayrollPage() {
  return (
    <>
      <Header title="Payroll" subtitle="Pay runs, payslips, and tax configuration" actions={<Button size="sm"><Plus size={14} /> New Pay Run</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Payroll" value="$54.2M" change="Annual" changeType="neutral" icon={<Wallet size={20} />} />
        <StatCard label="Last Pay Run" value="$2.48M" change="February 2026" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Employees" value={30} change="On payroll" changeType="neutral" icon={<Users size={20} />} />
        <StatCard label="Deductions" value="$570K" change="This month" changeType="neutral" icon={<FileText size={20} />} />
      </div>

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Pay Run History</CardTitle>
            <Button variant="secondary" size="sm">Export All</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Period</th>
                <th className="tempo-th text-right px-4 py-3">Gross</th>
                <th className="tempo-th text-right px-4 py-3">Deductions</th>
                <th className="tempo-th text-right px-4 py-3">Net</th>
                <th className="tempo-th text-right px-4 py-3">Employees</th>
                <th className="tempo-th text-center px-4 py-3">Status</th>
                <th className="tempo-th text-center px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demoPayrollRuns.map(run => (
                <tr key={run.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3">
                    <p className="text-sm font-medium text-t1">{run.period}</p>
                    <p className="text-xs text-t3">Run: {new Date(run.run_date).toLocaleDateString()}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-t1 text-right font-medium">${run.total_gross.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-error text-right">-${run.total_deductions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-t1 text-right font-semibold">${run.total_net.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-t2 text-right">{run.employee_count}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={run.status === 'paid' ? 'success' : run.status === 'approved' ? 'info' : 'warning'}>
                      {run.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex gap-1 justify-center">
                      <Button size="sm" variant="ghost">View</Button>
                      {run.status !== 'paid' && <Button size="sm" variant="primary">Process</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Payroll by Country</h3>
          <div className="space-y-3">
            {[
              { country: 'Nigeria', amount: 1250000, pct: 50 },
              { country: 'Ghana', amount: 480000, pct: 19 },
              { country: "Cote d'Ivoire", amount: 380000, pct: 15 },
              { country: 'Kenya', amount: 250000, pct: 10 },
              { country: 'Senegal', amount: 120000, pct: 6 },
            ].map(item => (
              <div key={item.country}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-t1 font-medium">{item.country}</span>
                  <span className="text-t2">${(item.amount / 1000).toFixed(0)}K ({item.pct}%)</span>
                </div>
                <div className="w-full h-2 bg-canvas rounded-full overflow-hidden">
                  <div className="h-full bg-tempo-600 rounded-full" style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Tax Configuration</h3>
          <div className="space-y-2">
            {[
              { country: 'Nigeria', rate: '24%', type: 'PAYE + NHF + Pension' },
              { country: 'Ghana', rate: '25%', type: 'PAYE + SSNIT + Tier 2' },
              { country: "Cote d'Ivoire", rate: '22%', type: 'IRPP + CNPS' },
              { country: 'Kenya', rate: '30%', type: 'PAYE + NSSF + NHIF' },
              { country: 'Senegal', rate: '20%', type: 'IR + CSS' },
            ].map(item => (
              <div key={item.country} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-t1">{item.country}</p>
                  <p className="text-xs text-t3">{item.type}</p>
                </div>
                <Badge variant="default">{item.rate}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </>
  )
}
