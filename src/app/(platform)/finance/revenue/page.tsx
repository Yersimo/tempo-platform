'use client'

import { useState, useMemo, useEffect } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import {
  DollarSign, Plus, FileText, TrendingUp, Clock, BarChart3,
  Calendar, CheckCircle2, AlertCircle, BookOpen, Search,
} from 'lucide-react'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'

type Tab = 'contracts' | 'schedule' | 'deferred' | 'journal-entries'

const statusBadge = (status: string) => {
  const map: Record<string, { variant: 'default' | 'success' | 'warning' | 'error' | 'info' | 'orange'; label: string }> = {
    draft: { variant: 'default', label: 'Draft' },
    active: { variant: 'success', label: 'Active' },
    completed: { variant: 'info', label: 'Completed' },
    terminated: { variant: 'error', label: 'Terminated' },
  }
  const cfg = map[status] || { variant: 'default' as const, label: status }
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>
}

const recognitionMethodLabel = (method: string) => {
  const labels: Record<string, string> = {
    straight_line: 'Straight Line',
    percentage_of_completion: '% Completion',
    output: 'Output Method',
    input: 'Input Method',
  }
  return labels[method] || method
}

const obligationTypeLabel = (type: string) => {
  return type === 'point_in_time' ? 'Point in Time' : 'Over Time'
}

export default function RevenuePage() {
  const defaultCurrency = useOrgCurrency()
  const {
    revenueContracts, performanceObligations, revenueScheduleEntries, deferredRevenue,
    addRevenueContract, updateRevenueContract,
    addPerformanceObligation, updatePerformanceObligation,
    addRevenueScheduleEntry,
    ensureModulesLoaded, addToast,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('contracts')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    ensureModulesLoaded?.(['revenueContracts', 'performanceObligations', 'revenueScheduleEntries', 'deferredRevenue'])
      ?.then?.(() => setPageLoading(false))
      ?.catch?.(() => setPageLoading(false))
  }, [])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  // ---- Stats ----
  const totalContractValue = revenueContracts.reduce((s: number, c: any) => s + (c.total_value || 0), 0)
  const activeContracts = revenueContracts.filter((c: any) => c.status === 'active').length
  const totalRecognized = revenueScheduleEntries.filter((e: any) => e.is_recognized).reduce((s: number, e: any) => s + (e.amount || 0), 0)
  const totalDeferred = totalContractValue - totalRecognized
  const totalObligations = performanceObligations.length
  const satisfiedObligations = performanceObligations.filter((o: any) => o.is_satisfied).length

  // ---- Create Contract Modal ----
  const [showContractModal, setShowContractModal] = useState(false)
  const [contractForm, setContractForm] = useState({
    contract_number: '', customer_name: '', start_date: '', end_date: '', total_value: '', currency: 'USD',
  })

  function openNewContract() {
    setContractForm({
      contract_number: `RC-${Date.now().toString().slice(-6)}`,
      customer_name: '', start_date: '', end_date: '', total_value: '', currency: defaultCurrency,
    })
    setShowContractModal(true)
  }

  function submitContract() {
    if (!contractForm.customer_name.trim()) { addToast('Customer name is required', 'error'); return }
    if (!contractForm.start_date || !contractForm.end_date) { addToast('Start and end dates are required', 'error'); return }
    if (!contractForm.total_value || Number(contractForm.total_value) <= 0) { addToast('Total value must be greater than zero', 'error'); return }
    addRevenueContract({
      contract_number: contractForm.contract_number,
      customer_name: contractForm.customer_name,
      start_date: contractForm.start_date,
      end_date: contractForm.end_date,
      total_value: Math.round(Number(contractForm.total_value) * 100),
      currency: contractForm.currency,
      status: 'active',
    })
    setShowContractModal(false)
  }

  // ---- Add Obligation Modal ----
  const [showObligationModal, setShowObligationModal] = useState(false)
  const [obligationForm, setObligationForm] = useState({
    contract_id: '', description: '', type: 'over_time', standalone_selling_price: '',
    recognition_method: 'straight_line', start_date: '', end_date: '',
  })

  function openAddObligation(contractId?: string) {
    const contract = contractId ? revenueContracts.find((c: any) => c.id === contractId) : null
    setObligationForm({
      contract_id: contractId || revenueContracts[0]?.id || '',
      description: '',
      type: 'over_time',
      standalone_selling_price: '',
      recognition_method: 'straight_line',
      start_date: contract?.start_date || '',
      end_date: contract?.end_date || '',
    })
    setShowObligationModal(true)
  }

  function submitObligation() {
    if (!obligationForm.contract_id) { addToast('Please select a contract', 'error'); return }
    if (!obligationForm.description.trim()) { addToast('Description is required', 'error'); return }
    if (!obligationForm.standalone_selling_price || Number(obligationForm.standalone_selling_price) <= 0) { addToast('SSP must be greater than zero', 'error'); return }
    if (!obligationForm.start_date || !obligationForm.end_date) { addToast('Start and end dates are required', 'error'); return }

    const sspCents = Math.round(Number(obligationForm.standalone_selling_price) * 100)
    addPerformanceObligation({
      contract_id: obligationForm.contract_id,
      description: obligationForm.description,
      type: obligationForm.type,
      standalone_selling_price: sspCents,
      allocated_price: sspCents, // Placeholder, will be recalculated on allocation
      recognition_method: obligationForm.recognition_method,
      start_date: obligationForm.start_date,
      end_date: obligationForm.end_date,
      percent_complete: 0,
      is_satisfied: false,
    })
    setShowObligationModal(false)
  }

  // ---- Generate Revenue Schedule ----
  function generateSchedule(contractId: string) {
    const contract = revenueContracts.find((c: any) => c.id === contractId)
    if (!contract) return

    const obligations = performanceObligations.filter((o: any) => o.contract_id === contractId)
    if (obligations.length === 0) {
      addToast('Add performance obligations before generating schedule', 'info')
      return
    }

    // Step 4: Allocate transaction price using relative SSP
    const totalSSP = obligations.reduce((s: number, o: any) => s + (o.standalone_selling_price || 0), 0)
    if (totalSSP === 0) { addToast('Total SSP is zero', 'error'); return }

    let remaining = contract.total_value
    const allocated: { id: string; allocatedPrice: number }[] = []
    for (let i = 0; i < obligations.length; i++) {
      const ob = obligations[i]
      let alloc: number
      if (i === obligations.length - 1) {
        alloc = remaining
      } else {
        alloc = Math.round((ob.standalone_selling_price / totalSSP) * contract.total_value)
        remaining -= alloc
      }
      updatePerformanceObligation(ob.id, { allocated_price: alloc })
      allocated.push({ id: ob.id, allocatedPrice: alloc })
    }

    // Step 5: Generate schedule entries for each obligation
    for (const alloc of allocated) {
      const ob = obligations.find((o: any) => o.id === alloc.id)
      if (!ob) continue

      if (ob.type === 'point_in_time') {
        addRevenueScheduleEntry({
          obligation_id: ob.id,
          period: ob.end_date?.substring(0, 7) || contract.end_date.substring(0, 7),
          amount: alloc.allocatedPrice,
          is_recognized: false,
        })
        continue
      }

      // Over time: straight-line
      const startDate = new Date((ob.start_date || contract.start_date) + 'T00:00:00')
      const endDate = new Date((ob.end_date || contract.end_date) + 'T00:00:00')
      const months: string[] = []
      const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1)
      const endMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 1)
      while (current <= endMonth) {
        const y = current.getFullYear()
        const m = String(current.getMonth() + 1).padStart(2, '0')
        months.push(`${y}-${m}`)
        current.setMonth(current.getMonth() + 1)
      }
      if (months.length === 0) continue

      const monthlyAmount = Math.floor(alloc.allocatedPrice / months.length)
      const rem = alloc.allocatedPrice - monthlyAmount * months.length

      months.forEach((period, idx) => {
        addRevenueScheduleEntry({
          obligation_id: ob.id,
          period,
          amount: idx === months.length - 1 ? monthlyAmount + rem : monthlyAmount,
          is_recognized: false,
        })
      })
    }

    addToast('Revenue schedule generated successfully', 'success')
  }

  // ---- Filtered contracts ----
  const filteredContracts = useMemo(() => {
    if (!searchQuery) return revenueContracts
    const q = searchQuery.toLowerCase()
    return revenueContracts.filter((c: any) =>
      c.contract_number?.toLowerCase().includes(q) ||
      c.customer_name?.toLowerCase().includes(q)
    )
  }, [revenueContracts, searchQuery])

  // ---- Waterfall data ----
  const waterfallData = useMemo(() => {
    const periodMap: Record<string, { period: string; amount: number; recognized: number }> = {}
    for (const entry of revenueScheduleEntries) {
      if (!periodMap[entry.period]) {
        periodMap[entry.period] = { period: entry.period, amount: 0, recognized: 0 }
      }
      periodMap[entry.period].amount += entry.amount || 0
      if (entry.is_recognized) {
        periodMap[entry.period].recognized += entry.amount || 0
      }
    }
    return Object.values(periodMap).sort((a, b) => a.period.localeCompare(b.period))
  }, [revenueScheduleEntries])

  // ---- Deferred revenue by contract ----
  const deferredByContract = useMemo(() => {
    const map: Record<string, { contractId: string; customerName: string; totalValue: number; recognized: number; deferred: number }> = {}
    for (const contract of revenueContracts) {
      const obligations = performanceObligations.filter((o: any) => o.contract_id === contract.id)
      const obligationIds = new Set(obligations.map((o: any) => o.id))
      const scheduleForContract = revenueScheduleEntries.filter((e: any) => obligationIds.has(e.obligation_id))
      const recognized = scheduleForContract.filter((e: any) => e.is_recognized).reduce((s: number, e: any) => s + (e.amount || 0), 0)
      map[contract.id] = {
        contractId: contract.id,
        customerName: contract.customer_name,
        totalValue: contract.total_value || 0,
        recognized,
        deferred: (contract.total_value || 0) - recognized,
      }
    }
    return Object.values(map)
  }, [revenueContracts, performanceObligations, revenueScheduleEntries])

  // ---- Journal Entries (derived from schedule) ----
  const journalEntries = useMemo(() => {
    return revenueScheduleEntries.filter((e: any) => e.is_recognized).map((e: any) => ({
      id: e.id,
      period: e.period,
      amount: e.amount,
      recognizedDate: e.recognized_date,
      obligationId: e.obligation_id,
    }))
  }, [revenueScheduleEntries])

  if (pageLoading) return <PageSkeleton />

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'contracts', label: 'Contracts', icon: <FileText size={16} /> },
    { key: 'schedule', label: 'Revenue Schedule', icon: <Calendar size={16} /> },
    { key: 'deferred', label: 'Deferred Revenue', icon: <Clock size={16} /> },
    { key: 'journal-entries', label: 'Journal Entries', icon: <BookOpen size={16} /> },
  ]

  const maxWaterfallAmount = Math.max(...waterfallData.map(d => d.amount), 1)

  return (
    <>
      <Header title="Revenue Recognition" subtitle="ASC 606 five-step model for revenue recognition" />

      <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Contract Value" value={formatCurrency(totalContractValue, defaultCurrency)} change={`${activeContracts} active`} icon={<DollarSign size={20} />} />
          <StatCard label="Recognized" value={formatCurrency(totalRecognized, defaultCurrency)} change="Revenue recognized" icon={<TrendingUp size={20} />} />
          <StatCard label="Deferred" value={formatCurrency(totalDeferred, defaultCurrency)} change="Remaining" icon={<Clock size={20} />} />
          <StatCard label="Obligations" value={`${satisfiedObligations}/${totalObligations}`} change="Satisfied" icon={<CheckCircle2 size={20} />} />
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 border-b border-gray-200">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-tempo-600 text-tempo-700'
                  : 'border-transparent text-t3 hover:text-t1 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search + Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-tempo-500/20 focus:border-tempo-500"
            />
          </div>
          <div className="flex gap-2">
            {activeTab === 'contracts' && (
              <>
                <Button variant="secondary" onClick={() => openAddObligation()}>
                  <Plus size={16} className="mr-1" /> Add Obligation
                </Button>
                <Button onClick={openNewContract}>
                  <Plus size={16} className="mr-1" /> New Contract
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {filteredContracts.length === 0 ? (
              <Card>
                <div className="p-12 text-center">
                  <FileText size={40} className="mx-auto mb-3 text-t3" />
                  <h3 className="text-lg font-semibold mb-1">No revenue contracts</h3>
                  <p className="text-sm text-t3 mb-4">Create a contract to start tracking revenue recognition.</p>
                  <Button onClick={openNewContract}><Plus size={16} className="mr-1" /> New Contract</Button>
                </div>
              </Card>
            ) : (
              filteredContracts.map((contract: any) => {
                const obligations = performanceObligations.filter((o: any) => o.contract_id === contract.id)
                const hasSchedule = revenueScheduleEntries.some((e: any) =>
                  obligations.some((o: any) => o.id === e.obligation_id)
                )
                return (
                  <Card key={contract.id}>
                    <div className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold">{contract.contract_number}</span>
                            {statusBadge(contract.status)}
                          </div>
                          <div className="text-sm text-t3 mt-0.5">{contract.customer_name}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">{formatCurrency(contract.total_value || 0, contract.currency || defaultCurrency)}</div>
                          <div className="text-xs text-t3">{contract.start_date} to {contract.end_date}</div>
                        </div>
                      </div>

                      {/* Performance Obligations */}
                      {obligations.length > 0 && (
                        <div className="border-t border-gray-100 pt-3 mt-3">
                          <div className="text-xs font-medium text-t3 uppercase tracking-wide mb-2">Performance Obligations ({obligations.length})</div>
                          <div className="space-y-2">
                            {obligations.map((ob: any) => (
                              <div key={ob.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2 text-sm">
                                <div className="flex items-center gap-3">
                                  {ob.is_satisfied ? (
                                    <CheckCircle2 size={16} className="text-green-500" />
                                  ) : (
                                    <AlertCircle size={16} className="text-amber-500" />
                                  )}
                                  <span>{ob.description}</span>
                                  <Badge variant="info">{obligationTypeLabel(ob.type)}</Badge>
                                  <Badge variant="default">{recognitionMethodLabel(ob.recognition_method)}</Badge>
                                </div>
                                <div className="flex items-center gap-4">
                                  <div className="text-right">
                                    <div className="text-xs text-t3">SSP</div>
                                    <div className="font-medium">{formatCurrency(ob.standalone_selling_price || 0, defaultCurrency)}</div>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-xs text-t3">Allocated</div>
                                    <div className="font-medium">{formatCurrency(ob.allocated_price || 0, defaultCurrency)}</div>
                                  </div>
                                  {ob.type === 'over_time' && (
                                    <div className="w-20">
                                      <div className="text-xs text-t3 mb-0.5">{ob.percent_complete || 0}%</div>
                                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                        <div className="h-full bg-tempo-500 rounded-full" style={{ width: `${ob.percent_complete || 0}%` }} />
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-gray-100">
                        <Button variant="secondary" size="sm" onClick={() => openAddObligation(contract.id)}>
                          <Plus size={14} className="mr-1" /> Add Obligation
                        </Button>
                        {obligations.length > 0 && !hasSchedule && (
                          <Button size="sm" onClick={() => generateSchedule(contract.id)}>
                            <BarChart3 size={14} className="mr-1" /> Generate Schedule
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            {/* Waterfall Chart */}
            {waterfallData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Waterfall</CardTitle>
                </CardHeader>
                <div className="p-4 pt-0">
                  <div className="flex items-end gap-1 h-48">
                    {waterfallData.map((entry) => (
                      <div key={entry.period} className="flex-1 flex flex-col items-center gap-1">
                        <div className="w-full flex flex-col justify-end" style={{ height: '160px' }}>
                          <div
                            className="w-full bg-tempo-200 rounded-t"
                            style={{ height: `${Math.max(2, (entry.amount / maxWaterfallAmount) * 160)}px` }}
                          >
                            {entry.recognized > 0 && (
                              <div
                                className="w-full bg-tempo-500 rounded-t"
                                style={{ height: `${Math.max(1, (entry.recognized / entry.amount) * 100)}%` }}
                              />
                            )}
                          </div>
                        </div>
                        <div className="text-[10px] text-t3 whitespace-nowrap rotate-[-45deg] origin-top-left translate-y-2">
                          {entry.period}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-6 mt-8 text-xs text-t3">
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-tempo-500" /> Recognized</span>
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-tempo-200" /> Scheduled</span>
                  </div>
                </div>
              </Card>
            )}

            {/* Schedule Table */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Revenue Schedule</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 font-medium text-t3">Period</th>
                      <th className="text-left p-3 font-medium text-t3">Obligation</th>
                      <th className="text-right p-3 font-medium text-t3">Amount</th>
                      <th className="text-left p-3 font-medium text-t3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {revenueScheduleEntries.length === 0 ? (
                      <tr><td colSpan={4} className="p-8 text-center text-t3">No schedule entries yet. Generate a schedule from a contract.</td></tr>
                    ) : (
                      revenueScheduleEntries
                        .sort((a: any, b: any) => (a.period || '').localeCompare(b.period || ''))
                        .map((entry: any) => {
                          const ob = performanceObligations.find((o: any) => o.id === entry.obligation_id)
                          return (
                            <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                              <td className="p-3 font-medium">{entry.period}</td>
                              <td className="p-3 text-t3">{ob?.description || '-'}</td>
                              <td className="p-3 text-right font-medium">{formatCurrency(entry.amount || 0, defaultCurrency)}</td>
                              <td className="p-3">
                                {entry.is_recognized ? (
                                  <Badge variant="success">Recognized</Badge>
                                ) : (
                                  <Badge variant="warning">Pending</Badge>
                                )}
                              </td>
                            </tr>
                          )
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'deferred' && (
          <div className="space-y-4">
            {/* Summary Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs font-medium text-t3 uppercase tracking-wide mb-1">Total Contract Value</div>
                  <div className="text-2xl font-bold">{formatCurrency(totalContractValue, defaultCurrency)}</div>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs font-medium text-t3 uppercase tracking-wide mb-1">Recognized to Date</div>
                  <div className="text-2xl font-bold text-green-600">{formatCurrency(totalRecognized, defaultCurrency)}</div>
                </div>
              </Card>
              <Card>
                <div className="p-4 text-center">
                  <div className="text-xs font-medium text-t3 uppercase tracking-wide mb-1">Deferred Balance</div>
                  <div className="text-2xl font-bold text-amber-600">{formatCurrency(totalDeferred, defaultCurrency)}</div>
                </div>
              </Card>
            </div>

            {/* Deferred by Contract */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Deferred Revenue by Contract</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      <th className="text-left p-3 font-medium text-t3">Customer</th>
                      <th className="text-right p-3 font-medium text-t3">Contract Value</th>
                      <th className="text-right p-3 font-medium text-t3">Recognized</th>
                      <th className="text-right p-3 font-medium text-t3">Deferred</th>
                      <th className="text-left p-3 font-medium text-t3">Progress</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deferredByContract.length === 0 ? (
                      <tr><td colSpan={5} className="p-8 text-center text-t3">No deferred revenue data available</td></tr>
                    ) : (
                      deferredByContract.map((item) => {
                        const pct = item.totalValue > 0 ? Math.round((item.recognized / item.totalValue) * 100) : 0
                        return (
                          <tr key={item.contractId} className="border-b border-gray-50 hover:bg-gray-50/50">
                            <td className="p-3 font-medium">{item.customerName}</td>
                            <td className="p-3 text-right">{formatCurrency(item.totalValue, defaultCurrency)}</td>
                            <td className="p-3 text-right text-green-600">{formatCurrency(item.recognized, defaultCurrency)}</td>
                            <td className="p-3 text-right text-amber-600">{formatCurrency(item.deferred, defaultCurrency)}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                  <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="text-xs text-t3 w-8 text-right">{pct}%</span>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}

        {activeTab === 'journal-entries' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen size={18} />
                Auto-Generated Journal Entries
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left p-3 font-medium text-t3">Date</th>
                    <th className="text-left p-3 font-medium text-t3">Description</th>
                    <th className="text-right p-3 font-medium text-t3">Debit (Revenue)</th>
                    <th className="text-right p-3 font-medium text-t3">Credit (Deferred)</th>
                  </tr>
                </thead>
                <tbody>
                  {journalEntries.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-t3">
                        No journal entries yet. Entries are created when revenue is recognized.
                      </td>
                    </tr>
                  ) : (
                    journalEntries.map((entry: any) => {
                      const ob = performanceObligations.find((o: any) => o.id === entry.obligationId)
                      return (
                        <tr key={entry.id} className="border-b border-gray-50 hover:bg-gray-50/50">
                          <td className="p-3">{entry.period}</td>
                          <td className="p-3">Revenue recognition: {ob?.description || 'N/A'}</td>
                          <td className="p-3 text-right font-medium text-green-600">{formatCurrency(entry.amount || 0, defaultCurrency)}</td>
                          <td className="p-3 text-right font-medium text-red-600">{formatCurrency(entry.amount || 0, defaultCurrency)}</td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Create Contract Modal */}
      <Modal open={showContractModal} onClose={() => setShowContractModal(false)} title="Create Revenue Contract">
        <div className="space-y-4">
          <Input
            label="Contract Number"
            value={contractForm.contract_number}
            onChange={e => setContractForm(prev => ({ ...prev, contract_number: e.target.value }))}
          />
          <Input
            label="Customer Name"
            value={contractForm.customer_name}
            onChange={e => setContractForm(prev => ({ ...prev, customer_name: e.target.value }))}
            placeholder="Acme Corp"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={contractForm.start_date}
              onChange={e => setContractForm(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={contractForm.end_date}
              onChange={e => setContractForm(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <Input
            label="Total Contract Value"
            type="number"
            value={contractForm.total_value}
            onChange={e => setContractForm(prev => ({ ...prev, total_value: e.target.value }))}
            placeholder="0.00"
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContractModal(false)}>Cancel</Button>
            <Button onClick={submitContract}>Create Contract</Button>
          </div>
        </div>
      </Modal>

      {/* Add Obligation Modal */}
      <Modal open={showObligationModal} onClose={() => setShowObligationModal(false)} title="Add Performance Obligation" size="lg">
        <div className="space-y-4">
          <Select
            label="Contract"
            options={revenueContracts.map((c: any) => ({ value: c.id, label: `${c.contract_number} - ${c.customer_name}` }))}
            value={obligationForm.contract_id}
            onChange={e => setObligationForm(prev => ({ ...prev, contract_id: e.target.value }))}
            placeholder="Select contract"
          />
          <Input
            label="Description"
            value={obligationForm.description}
            onChange={e => setObligationForm(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g., Software License, Implementation Services"
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Obligation Type"
              options={[
                { value: 'point_in_time', label: 'Point in Time' },
                { value: 'over_time', label: 'Over Time' },
              ]}
              value={obligationForm.type}
              onChange={e => setObligationForm(prev => ({ ...prev, type: e.target.value }))}
            />
            <Select
              label="Recognition Method"
              options={[
                { value: 'straight_line', label: 'Straight Line' },
                { value: 'percentage_of_completion', label: '% of Completion' },
                { value: 'output', label: 'Output Method' },
                { value: 'input', label: 'Input Method' },
              ]}
              value={obligationForm.recognition_method}
              onChange={e => setObligationForm(prev => ({ ...prev, recognition_method: e.target.value }))}
            />
          </div>
          <Input
            label="Standalone Selling Price (SSP)"
            type="number"
            value={obligationForm.standalone_selling_price}
            onChange={e => setObligationForm(prev => ({ ...prev, standalone_selling_price: e.target.value }))}
            placeholder="0.00"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={obligationForm.start_date}
              onChange={e => setObligationForm(prev => ({ ...prev, start_date: e.target.value }))}
            />
            <Input
              label="End Date"
              type="date"
              value={obligationForm.end_date}
              onChange={e => setObligationForm(prev => ({ ...prev, end_date: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowObligationModal(false)}>Cancel</Button>
            <Button onClick={submitObligation}>Add Obligation</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
