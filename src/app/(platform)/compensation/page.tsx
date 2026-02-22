'use client'

import { useState } from 'react'
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
import { useTempo } from '@/lib/store'

export default function CompensationPage() {
  const { compBands, salaryReviews, employees, addCompBand, deleteCompBand, addSalaryReview, updateSalaryReview } = useTempo()
  const [activeTab, setActiveTab] = useState('benchmarking')
  const [showBandModal, setShowBandModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [bandForm, setBandForm] = useState({ role_title: '', level: 'Mid', country: '', min_salary: 0, mid_salary: 0, max_salary: 0, currency: 'USD', p25: 0, p50: 0, p75: 0, effective_date: '2026-01-01' })
  const [reviewForm, setReviewForm] = useState({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: '2026 Annual' })
  const [stipForm, setStipForm] = useState({ base: 72000, multiplier: 1.2, raroc: 0.95, target: 20 })

  const tabs = [
    { id: 'benchmarking', label: 'Benchmarking', count: compBands.length },
    { id: 'salary-reviews', label: 'Salary Reviews', count: salaryReviews.length },
    { id: 'stip', label: 'STIP Calculator' },
    { id: 'bands', label: 'Comp Bands' },
  ]

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
    addSalaryReview({ ...reviewForm, proposed_by: 'emp-17', status: 'pending_approval', approved_by: null, currency: 'USD' })
    setShowReviewModal(false)
    setReviewForm({ employee_id: '', current_salary: 0, proposed_salary: 0, justification: '', cycle: '2026 Annual' })
  }

  return (
    <>
      <Header title="Compensation" subtitle="Benchmarking, salary reviews, and incentive planning"
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setShowBandModal(true)}><Plus size={14} /> Add Band</Button>
            <Button size="sm" onClick={() => setShowReviewModal(true)}><Plus size={14} /> Propose Review</Button>
          </div>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Avg Compa Ratio" value={compBands.length > 0 ? (compBands.reduce((a, b) => a + (b.p50 ? b.mid_salary / b.p50 : 1), 0) / compBands.length).toFixed(2) : '-'} change="At market" changeType="neutral" icon={<TrendingUp size={20} />} />
        <StatCard label="Below Market" value={belowMarket} change="Roles below P50" changeType={belowMarket > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
        <StatCard label="Pending Reviews" value={pendingReviews} />
        <StatCard label="Total Staff Cost" value={`$${(employees.length * 72000 / 1000000).toFixed(1)}M`} change="Annual" changeType="neutral" icon={<Banknote size={20} />} />
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
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Role</th>
                  <th className="tempo-th text-right px-4 py-3">P50 Internal</th>
                  <th className="tempo-th text-right px-4 py-3">P50 Market</th>
                  <th className="tempo-th text-right px-4 py-3">CR</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compBands.map(band => {
                  const cr = band.p50 ? (band.mid_salary / band.p50).toFixed(2) : 'N/A'
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
            {salaryReviews.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-t3">No salary reviews yet. Click &quot;Propose Review&quot; to create one.</div>
            ) : salaryReviews.map(sr => {
              const emp = employees.find(e => e.id === sr.employee_id)
              const increase = ((sr.proposed_salary - sr.current_salary) / sr.current_salary * 100).toFixed(1)
              return (
                <div key={sr.id} className="px-6 py-4 flex items-center gap-4">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{emp?.profile?.full_name || 'Unknown'}</p>
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
                      <Button size="sm" variant="primary" onClick={() => updateSalaryReview(sr.id, { status: 'approved', approved_by: 'emp-17' })}>Approve</Button>
                      <Button size="sm" variant="ghost" onClick={() => updateSalaryReview(sr.id, { status: 'rejected' })}>Reject</Button>
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
              <Input label="Base Salary" type="number" value={stipForm.base} onChange={(e) => setStipForm({ ...stipForm, base: Number(e.target.value) })} />
              <Input label="Performance Multiplier" type="number" step="0.1" value={stipForm.multiplier} onChange={(e) => setStipForm({ ...stipForm, multiplier: Number(e.target.value) })} />
              <Input label="RAROC Factor" type="number" step="0.01" value={stipForm.raroc} onChange={(e) => setStipForm({ ...stipForm, raroc: Number(e.target.value) })} />
              <Input label="Target Bonus %" type="number" value={stipForm.target} onChange={(e) => setStipForm({ ...stipForm, target: Number(e.target.value) })} />
            </div>
            <div className="md:col-span-2 bg-canvas rounded-xl p-6">
              <h4 className="text-xs font-semibold text-t3 uppercase tracking-wider mb-4">Calculation Result</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-t3">Target Bonus</p>
                  <p className="tempo-stat text-2xl text-t1">${targetBonus.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Adjusted Bonus</p>
                  <p className="tempo-stat text-2xl text-tempo-600">${Math.round(adjustedBonus).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-t3">Performance Impact</p>
                  <p className={`text-sm font-medium ${perfImpact >= 0 ? 'text-success' : 'text-error'}`}>
                    {perfImpact >= 0 ? '+' : ''}${Math.round(perfImpact).toLocaleString()} ({perfImpact >= 0 ? '+' : ''}{((stipForm.multiplier - 1) * 100).toFixed(0)}%)
                  </p>
                </div>
                <div>
                  <p className="text-xs text-t3">RAROC Adjustment</p>
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
              <CardTitle>Compensation Bands</CardTitle>
              <Button size="sm" onClick={() => setShowBandModal(true)}><Plus size={14} /> Add Band</Button>
            </div>
          </CardHeader>
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
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {compBands.map(band => (
                  <tr key={band.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-sm font-medium text-t1">{band.role_title}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.level}</td>
                    <td className="px-4 py-3 text-sm text-t2">{band.country || 'Global'}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.min_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm font-medium text-t1 text-right">${band.mid_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-sm text-t2 text-right">${band.max_salary.toLocaleString()}</td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="ghost" onClick={() => deleteCompBand(band.id)}>Remove</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal open={showBandModal} onClose={() => setShowBandModal(false)} title="Add Compensation Band">
        <div className="space-y-4">
          <Input label="Role Title" value={bandForm.role_title} onChange={(e) => setBandForm({ ...bandForm, role_title: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Level" value={bandForm.level} onChange={(e) => setBandForm({ ...bandForm, level: e.target.value })} options={['Associate', 'Mid', 'Senior', 'Manager', 'Senior Manager', 'Director', 'Executive'].map(l => ({ value: l, label: l }))} />
            <Input label="Country" value={bandForm.country} onChange={(e) => setBandForm({ ...bandForm, country: e.target.value })} placeholder="e.g. Nigeria" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Min Salary" type="number" value={bandForm.min_salary || ''} onChange={(e) => setBandForm({ ...bandForm, min_salary: Number(e.target.value) })} />
            <Input label="Mid Salary" type="number" value={bandForm.mid_salary || ''} onChange={(e) => setBandForm({ ...bandForm, mid_salary: Number(e.target.value) })} />
            <Input label="Max Salary" type="number" value={bandForm.max_salary || ''} onChange={(e) => setBandForm({ ...bandForm, max_salary: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="P25 Market" type="number" value={bandForm.p25 || ''} onChange={(e) => setBandForm({ ...bandForm, p25: Number(e.target.value) })} />
            <Input label="P50 Market" type="number" value={bandForm.p50 || ''} onChange={(e) => setBandForm({ ...bandForm, p50: Number(e.target.value) })} />
            <Input label="P75 Market" type="number" value={bandForm.p75 || ''} onChange={(e) => setBandForm({ ...bandForm, p75: Number(e.target.value) })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBandModal(false)}>Cancel</Button>
            <Button onClick={submitBand}>Add Band</Button>
          </div>
        </div>
      </Modal>

      <Modal open={showReviewModal} onClose={() => setShowReviewModal(false)} title="Propose Salary Review">
        <div className="space-y-4">
          <Select label="Employee" value={reviewForm.employee_id} onChange={(e) => {
            const emp = employees.find(em => em.id === e.target.value)
            const band = compBands.find(b => b.level === emp?.level)
            setReviewForm({ ...reviewForm, employee_id: e.target.value, current_salary: band?.mid_salary || 60000 })
          }} options={[{ value: '', label: 'Select employee...' }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Current Salary" type="number" value={reviewForm.current_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, current_salary: Number(e.target.value) })} />
            <Input label="Proposed Salary" type="number" value={reviewForm.proposed_salary || ''} onChange={(e) => setReviewForm({ ...reviewForm, proposed_salary: Number(e.target.value) })} />
          </div>
          <Input label="Justification" value={reviewForm.justification} onChange={(e) => setReviewForm({ ...reviewForm, justification: e.target.value })} placeholder="Reason for salary adjustment..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowReviewModal(false)}>Cancel</Button>
            <Button onClick={submitReview}>Submit Proposal</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
