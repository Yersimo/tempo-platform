'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Banknote, TrendingUp, AlertTriangle } from 'lucide-react'
import { demoCompBands, demoSalaryReviews, demoEmployees } from '@/lib/demo-data'

export default function CompensationPage() {
  const [activeTab, setActiveTab] = useState('benchmarking')

  const tabs = [
    { id: 'benchmarking', label: 'Benchmarking', count: demoCompBands.length },
    { id: 'salary-reviews', label: 'Salary Reviews', count: demoSalaryReviews.length },
    { id: 'stip', label: 'STIP Calculator' },
    { id: 'bands', label: 'Comp Bands' },
  ]

  return (
    <>
      <Header title="Compensation" subtitle="Benchmarking, salary reviews, and incentive planning" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg Compa Ratio" value="1.04" change="At market" changeType="neutral" icon={<TrendingUp size={20} />} />
        <StatCard label="Below Market" value="4" change="Roles below P50" changeType="negative" icon={<AlertTriangle size={20} />} />
        <StatCard label="Pending Reviews" value={demoSalaryReviews.filter(s => s.status === 'pending_approval').length} />
        <StatCard label="Total Staff Cost" value="$54.2M" change="Annual" changeType="neutral" icon={<Banknote size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'benchmarking' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Compensation Benchmarking</CardTitle>
                <p className="text-xs text-t3 mt-0.5">UEMOA Region / Q1 2026</p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" size="sm">Export</Button>
                <Button variant="primary" size="sm">Filter</Button>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Role</th>
                  <th className="tempo-th text-right px-4 py-3">HC</th>
                  <th className="tempo-th text-right px-4 py-3">P50 Internal</th>
                  <th className="tempo-th text-right px-4 py-3">P50 Market</th>
                  <th className="tempo-th text-right px-4 py-3">CR</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoCompBands.map(band => {
                  const cr = band.p50 ? (band.mid_salary / band.p50).toFixed(2) : 'N/A'
                  const crNum = parseFloat(cr as string)
                  return (
                    <tr key={band.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">{Math.floor(Math.random() * 500 + 100)}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${band.mid_salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-right">${(band.p50 || 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-semibold ${crNum >= 1 ? 'text-success' : crNum >= 0.95 ? 'text-warning' : 'text-error'}`}>
                          {cr}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={crNum >= 1 ? 'success' : crNum >= 0.95 ? 'warning' : 'error'}>
                          {crNum >= 1 ? 'At market' : crNum >= 0.95 ? 'Below market' : 'Below P25'}
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
          <CardHeader><CardTitle>Salary Review Proposals</CardTitle></CardHeader>
          <div className="divide-y divide-divider">
            {demoSalaryReviews.map(sr => {
              const emp = demoEmployees.find(e => e.id === sr.employee_id)
              const increase = ((sr.proposed_salary - sr.current_salary) / sr.current_salary * 100).toFixed(1)
              return (
                <div key={sr.id} className="px-6 py-4 flex items-center gap-4">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{emp?.profile?.full_name}</p>
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
                      <Button size="sm" variant="primary">Approve</Button>
                      <Button size="sm" variant="ghost">Reject</Button>
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
          <h3 className="text-sm font-semibold text-t1 mb-4">Short-Term Incentive Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Base Salary</label>
                <input type="number" className="w-full px-3 py-2 text-sm border border-divider rounded-lg" defaultValue={72000} />
              </div>
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Performance Multiplier</label>
                <input type="number" step="0.1" className="w-full px-3 py-2 text-sm border border-divider rounded-lg" defaultValue={1.2} />
              </div>
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">RAROC Factor</label>
                <input type="number" step="0.01" className="w-full px-3 py-2 text-sm border border-divider rounded-lg" defaultValue={0.95} />
              </div>
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Target Bonus %</label>
                <input type="number" className="w-full px-3 py-2 text-sm border border-divider rounded-lg" defaultValue={20} />
              </div>
            </div>
            <div className="md:col-span-2 bg-canvas rounded-xl p-6">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-4">Calculation Result</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-t3">Target Bonus</p>
                  <p className="tempo-stat text-2xl text-t1">$14,400</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Adjusted Bonus</p>
                  <p className="tempo-stat text-2xl text-tempo-600">$16,416</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Performance Impact</p>
                  <p className="text-sm font-medium text-success">+$2,880 (+20%)</p>
                </div>
                <div>
                  <p className="text-xs text-t3">RAROC Adjustment</p>
                  <p className="text-sm font-medium text-warning">-$864 (-5%)</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'bands' && (
        <Card padding="none">
          <CardHeader><CardTitle>Compensation Bands</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Role</th>
                  <th className="tempo-th text-left px-4 py-3">Level</th>
                  <th className="tempo-th text-left px-4 py-3">Country</th>
                  <th className="tempo-th text-right px-4 py-3">Min</th>
                  <th className="tempo-th text-right px-4 py-3">Mid</th>
                  <th className="tempo-th text-right px-4 py-3">Max</th>
                  <th className="tempo-th text-right px-4 py-3">P25</th>
                  <th className="tempo-th text-right px-4 py-3">P50</th>
                  <th className="tempo-th text-right px-4 py-3">P75</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoCompBands.map(band => (
                  <tr key={band.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.level}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.country || 'Global'}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.min_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${band.mid_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.max_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t3 text-right">${(band.p25 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t3 text-right">${(band.p50 || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t3 text-right">${(band.p75 || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
