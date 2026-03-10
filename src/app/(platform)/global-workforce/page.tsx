'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Globe, Users, Building2, MapPin, Shield, FileText, DollarSign, Plus, CheckCircle, AlertTriangle, Briefcase, Clock, Scale, Heart } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

const countryFlags: Record<string, string> = {
  'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'Germany': '🇩🇪', 'France': '🇫🇷', 'Canada': '🇨🇦',
  'Australia': '🇦🇺', 'Japan': '🇯🇵', 'Brazil': '🇧🇷', 'India': '🇮🇳', 'Nigeria': '🇳🇬',
  'South Africa': '🇿🇦', 'Kenya': '🇰🇪', 'Singapore': '🇸🇬', 'Netherlands': '🇳🇱', 'Spain': '🇪🇸',
  'Italy': '🇮🇹', 'Mexico': '🇲🇽', 'Colombia': '🇨🇴', 'Argentina': '🇦🇷', 'Ghana': '🇬🇭',
  'Egypt': '🇪🇬', 'UAE': '🇦🇪', 'Ireland': '🇮🇪', 'Poland': '🇵🇱', 'Portugal': '🇵🇹',
  'Sweden': '🇸🇪', 'Norway': '🇳🇴', 'Denmark': '🇩🇰', 'Philippines': '🇵🇭', 'Indonesia': '🇮🇩',
}

function getFlag(country: string) {
  return countryFlags[country] || '🌍'
}

function centsToDisplay(cents: number) {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

// Static compliance data for the Compliance tab
const complianceData = [
  { country: 'United States', status: 'compliant', filings: ['W-2 Annual Filing', 'ACA Reporting', 'State Tax Withholding'], nextDeadline: '2026-04-15', notes: 'All filings current' },
  { country: 'United Kingdom', status: 'compliant', filings: ['PAYE Real Time Info', 'P11D Benefits', 'Gender Pay Gap'], nextDeadline: '2026-07-06', notes: 'RTI submissions up to date' },
  { country: 'Germany', status: 'attention', filings: ['Social Insurance', 'Wage Tax Declaration', 'Works Council Report'], nextDeadline: '2026-03-31', notes: 'Wage tax due soon' },
  { country: 'France', status: 'compliant', filings: ['DSN Monthly Filing', 'DADS Annual', 'Training Levy'], nextDeadline: '2026-05-15', notes: 'DSN filings automated' },
  { country: 'Brazil', status: 'attention', filings: ['eSocial Events', 'FGTS Contributions', 'DIRF Annual'], nextDeadline: '2026-03-15', notes: 'eSocial deadline approaching' },
  { country: 'India', status: 'compliant', filings: ['PF Remittance', 'ESI Contributions', 'TDS Quarterly'], nextDeadline: '2026-06-30', notes: 'All remittances current' },
  { country: 'Singapore', status: 'compliant', filings: ['CPF Contributions', 'IR8A Filing', 'Skills Levy'], nextDeadline: '2026-03-01', notes: 'CPF auto-submitted' },
  { country: 'Nigeria', status: 'attention', filings: ['PAYE Remittance', 'Pension Contributions', 'NHF'], nextDeadline: '2026-03-10', notes: 'Pension review pending' },
]

type Tab = 'eor' | 'contractors' | 'peo' | 'benefits' | 'compliance'

export default function GlobalWorkforcePage() {
  const tc = useTranslations('common')
  const {
    org,
    eorEntities, eorEmployees, eorContracts,
    corContractors, corContracts, corPayments,
    peoConfigurations, coEmploymentRecords,
    globalBenefitPlans, countryBenefitConfigs,
    addEorEntity, addEorEmployee,
    addCorContractor, addCorContract,
    addPeoConfiguration,
    addGlobalBenefitPlan,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['eorEntities', 'eorEmployees', 'eorContracts', 'corContractors', 'corContracts', 'corPayments', 'peoConfigurations', 'coEmploymentRecords', 'globalBenefitPlans', 'countryBenefitConfigs', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  async function eorAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/eor', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  const [activeTab, setActiveTab] = useState<Tab>('eor')

  // --- Stat computations ---
  const eorEntityCount = eorEntities.length
  const contractorCount = corContractors.length
  const peoCountryCount = peoConfigurations.length
  const totalGlobalWorkers = useMemo(() => {
    const eorWorkers = eorEmployees.length
    const contractors = corContractors.length
    const coEmployed = coEmploymentRecords.length
    return eorWorkers + contractors + coEmployed
  }, [eorEmployees, corContractors, coEmploymentRecords])

  // --- Add EOR Entity modal ---
  const [showEntityModal, setShowEntityModal] = useState(false)
  const [entityForm, setEntityForm] = useState({ country: '', legal_name: '', currency: 'USD' })

  function openEntityModal() {
    setEntityForm({ country: '', legal_name: '', currency: 'USD' })
    setShowEntityModal(true)
  }

  async function submitEntity() {
    if (!entityForm.country || !entityForm.legal_name) return
    const payload = {
      country: entityForm.country,
      legal_name: entityForm.legal_name,
      status: 'active',
      employee_count: 0,
      currency: entityForm.currency,
      established_at: new Date().toISOString().split('T')[0],
    }
    try {
      await eorAPI('create-entity', payload)
      addToast('EOR entity created')
    } catch {
      addEorEntity(payload)
      addToast('Entity saved locally', 'info')
    }
    setShowEntityModal(false)
  }

  // --- Add Contractor modal ---
  const [showContractorModal, setShowContractorModal] = useState(false)
  const [contractorForm, setContractorForm] = useState({ name: '', country: '', specialty: '', hourly_rate: '', currency: 'USD' })

  function openContractorModal() {
    setContractorForm({ name: '', country: '', specialty: '', hourly_rate: '', currency: 'USD' })
    setShowContractorModal(true)
  }

  async function submitContractor() {
    if (!contractorForm.name || !contractorForm.country) return
    const payload = {
      name: contractorForm.name,
      country: contractorForm.country,
      specialty: contractorForm.specialty,
      hourly_rate: Number(contractorForm.hourly_rate),
      currency: contractorForm.currency,
      status: 'active',
      contract_start: new Date().toISOString().split('T')[0],
      contract_end: '',
      total_paid: 0,
    }
    try {
      await eorAPI('onboard-employee', payload)
      addToast('Contractor added')
    } catch {
      addCorContractor(payload)
      addToast('Contractor saved locally', 'info')
    }
    setShowContractorModal(false)
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'eor', label: 'EOR', icon: <Building2 size={14} /> },
    { key: 'contractors', label: 'Contractors', icon: <Briefcase size={14} /> },
    { key: 'peo', label: 'PEO', icon: <Users size={14} /> },
    { key: 'benefits', label: 'Benefits', icon: <Heart size={14} /> },
    { key: 'compliance', label: 'Compliance', icon: <Shield size={14} /> },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Global Workforce"
          subtitle="EOR, Contractor of Record & PEO management"
          actions={<Button size="sm" disabled><Plus size={14} /> Add Entity</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Global Workforce"
        subtitle="EOR, Contractor of Record & PEO management"
        actions={
          <div className="flex gap-2">
            {activeTab === 'eor' && (
              <Button size="sm" onClick={openEntityModal}><Plus size={14} /> Add Entity</Button>
            )}
            {activeTab === 'contractors' && (
              <Button size="sm" onClick={openContractorModal}><Plus size={14} /> Add Contractor</Button>
            )}
          </div>
        }
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="EOR Entities" value={eorEntityCount} icon={<Building2 size={20} />} />
        <StatCard label="Global Contractors" value={contractorCount} icon={<Briefcase size={20} />} />
        <StatCard label="PEO Countries" value={peoCountryCount} icon={<MapPin size={20} />} />
        <StatCard label="Total Global Workers" value={totalGlobalWorkers} icon={<Globe size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── EOR Tab ── */}
      {activeTab === 'eor' && (
        <div className="space-y-6">
          {/* Entity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {eorEntities.map((entity: any) => (
              <Card key={entity.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFlag(entity.country)}</span>
                    <div>
                      <p className="text-sm font-semibold text-t1">{entity.legal_name}</p>
                      <p className="text-xs text-t3">{entity.country}</p>
                    </div>
                  </div>
                  <Badge variant={entity.status === 'active' ? 'success' : entity.status === 'pending' ? 'warning' : 'default'}>
                    {entity.status}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-divider">
                  <div>
                    <p className="text-xs text-t3">Employees</p>
                    <p className="text-sm font-semibold text-t1">{entity.employee_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-t3">Currency</p>
                    <p className="text-sm font-semibold text-t1">{entity.currency}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-t3">Established</p>
                    <p className="text-sm text-t2">{entity.established_at}</p>
                  </div>
                </div>
              </Card>
            ))}
            {eorEntities.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Building2 size={32} className="text-t3 mx-auto mb-2" />
                  <p className="text-sm text-t3">No EOR entities yet. Click &quot;Add Entity&quot; to create one.</p>
                </div>
              </Card>
            )}
          </div>

          {/* EOR Employees Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>EOR Employees</CardTitle>
                <Badge variant="info">{eorEmployees.length} employees</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Name</th>
                    <th className="tempo-th text-left px-4 py-3">Country</th>
                    <th className="tempo-th text-left px-4 py-3">Job Title</th>
                    <th className="tempo-th text-right px-4 py-3">Salary</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-left px-4 py-3">Contract Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {eorEmployees.map((emp: any) => (
                    <tr key={emp.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{emp.employee_name}</td>
                      <td className="px-4 py-3 text-xs text-t2">
                        <span className="mr-1">{getFlag(emp.country)}</span>{emp.country}
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{emp.job_title}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {centsToDisplay(emp.salary)} <span className="text-t3 font-normal">{emp.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={emp.status === 'active' ? 'success' : emp.status === 'onboarding' ? 'info' : 'default'}>
                          {emp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{emp.contract_type}</td>
                    </tr>
                  ))}
                  {eorEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-t3">No EOR employees found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Contractors Tab ── */}
      {activeTab === 'contractors' && (
        <div className="space-y-6">
          {/* Contractors Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Contractor Directory</CardTitle>
                <Badge variant="info">{corContractors.filter((c: any) => c.status === 'active').length} active</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Name</th>
                    <th className="tempo-th text-left px-4 py-3">Country</th>
                    <th className="tempo-th text-left px-4 py-3">Specialty</th>
                    <th className="tempo-th text-right px-4 py-3">Rate</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-right px-4 py-3">Total Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {corContractors.map((c: any) => (
                    <tr key={c.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{c.name}</td>
                      <td className="px-4 py-3 text-xs text-t2">
                        <span className="mr-1">{getFlag(c.country)}</span>{c.country}
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{c.specialty}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {centsToDisplay(c.hourly_rate)}/hr <span className="text-t3 font-normal">{c.currency}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={c.status === 'active' ? 'success' : c.status === 'paused' ? 'warning' : 'default'}>
                          {c.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{centsToDisplay(c.total_paid || 0)}</td>
                    </tr>
                  ))}
                  {corContractors.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-t3">No contractors found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Active Contracts Sub-section */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Active Contracts</CardTitle>
                <Badge variant="default">{corContracts.filter((c: any) => c.status === 'active').length} contracts</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Project</th>
                    <th className="tempo-th text-left px-4 py-3">Contractor</th>
                    <th className="tempo-th text-right px-4 py-3">Hourly Rate</th>
                    <th className="tempo-th text-right px-4 py-3">Hours Logged</th>
                    <th className="tempo-th text-right px-4 py-3">Total Value</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {corContracts.map((contract: any) => {
                    const contractor = corContractors.find((c: any) => c.id === contract.contractor_id)
                    const totalValue = (contract.hourly_rate || 0) * (contract.hours_logged || 0)
                    return (
                      <tr key={contract.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-medium text-t1">{contract.project}</td>
                        <td className="px-4 py-3 text-xs text-t2">{contractor?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          {centsToDisplay(contract.hourly_rate)} <span className="text-t3 font-normal">{contract.currency}</span>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Clock size={12} className="text-t3" />
                            {contract.hours_logged || 0}h
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{centsToDisplay(totalValue)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={contract.status === 'active' ? 'success' : contract.status === 'completed' ? 'info' : 'default'}>
                            {contract.status}
                          </Badge>
                        </td>
                      </tr>
                    )
                  })}
                  {corContracts.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-t3">No contracts found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Recent Payments Summary */}
          {corPayments.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <DollarSign size={16} /> Recent Payments
              </h3>
              <div className="space-y-2">
                {corPayments.slice(0, 5).map((payment: any) => {
                  const contractor = corContractors.find((c: any) => c.id === payment.contractor_id)
                  return (
                    <div key={payment.id} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                      <div>
                        <p className="text-xs font-medium text-t1">{contractor?.name || 'Unknown'}</p>
                        <p className="text-xs text-t3">{payment.period}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-t1">{centsToDisplay(payment.amount)}</span>
                        <Badge variant={payment.status === 'paid' ? 'success' : 'warning'}>{payment.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── PEO Tab ── */}
      {activeTab === 'peo' && (
        <div className="space-y-6">
          {/* PEO Configuration Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {peoConfigurations.map((config: any) => (
              <Card key={config.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFlag(config.country)}</span>
                    <div>
                      <p className="text-sm font-semibold text-t1">{config.country}</p>
                      <p className="text-xs text-t3">{config.peo_partner}</p>
                    </div>
                  </div>
                  <Badge variant={config.status === 'active' ? 'success' : config.status === 'setup' ? 'warning' : 'default'}>
                    {config.status}
                  </Badge>
                </div>
                {/* Services as badges */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {(Array.isArray(config.services) ? config.services : []).map((svc: string, i: number) => (
                    <Badge key={i} variant="default">{svc}</Badge>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-divider">
                  <div>
                    <p className="text-xs text-t3">Employees</p>
                    <p className="text-sm font-semibold text-t1">{config.employee_count || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-t3">Monthly Fee</p>
                    <p className="text-sm font-semibold text-t1">
                      {centsToDisplay(config.monthly_fee || 0)} <span className="text-t3 font-normal text-xs">{config.currency}</span>
                    </p>
                  </div>
                </div>
              </Card>
            ))}
            {peoConfigurations.length === 0 && (
              <Card>
                <div className="text-center py-8">
                  <Users size={32} className="text-t3 mx-auto mb-2" />
                  <p className="text-sm text-t3">No PEO configurations found</p>
                </div>
              </Card>
            )}
          </div>

          {/* Co-Employment Records Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Co-Employment Records</CardTitle>
                <Badge variant="info">{coEmploymentRecords.length} records</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Employee ID</th>
                    <th className="tempo-th text-left px-4 py-3">PEO Config</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-left px-4 py-3">Start Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {coEmploymentRecords.map((rec: any) => {
                    const config = peoConfigurations.find((p: any) => p.id === rec.peo_config_id)
                    return (
                      <tr key={rec.id} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{rec.employee_id}</td>
                        <td className="px-4 py-3 text-xs text-t2">
                          {config ? `${config.country} - ${config.peo_partner}` : rec.peo_config_id}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={rec.status === 'active' ? 'success' : 'default'}>
                            {rec.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{rec.start_date}</td>
                      </tr>
                    )
                  })}
                  {coEmploymentRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-xs text-t3">No co-employment records found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Benefits Tab ── */}
      {activeTab === 'benefits' && (
        <div className="space-y-6">
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Global Benefits Plans</CardTitle>
                <Badge variant="info">{globalBenefitPlans.length} plans</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Country</th>
                    <th className="tempo-th text-left px-4 py-3">Benefit Type</th>
                    <th className="tempo-th text-left px-4 py-3">Provider</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-right px-4 py-3">Enrolled</th>
                    <th className="tempo-th text-right px-4 py-3">Cost / Employee</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {globalBenefitPlans.map((benefit: any) => (
                    <tr key={benefit.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t1">
                        <span className="mr-1">{getFlag(benefit.country)}</span>
                        <span className="font-medium">{benefit.country}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">
                        <Badge variant="default">{benefit.benefit_type || benefit.name}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{benefit.provider}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={benefit.status === 'active' ? 'success' : benefit.status === 'pending' ? 'warning' : 'default'}>
                          {benefit.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">{benefit.enrolled_count || 0}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        {centsToDisplay(benefit.cost_per_employee || 0)} <span className="text-t3 font-normal">{benefit.currency}</span>
                      </td>
                    </tr>
                  ))}
                  {globalBenefitPlans.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-xs text-t3">No global benefits configured</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Country Benefit Configs Summary */}
          {countryBenefitConfigs.length > 0 && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">Country Benefit Configurations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {countryBenefitConfigs.map((cfg: any) => (
                  <div key={cfg.id} className="p-3 bg-canvas rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span>{getFlag(cfg.country)}</span>
                      <span className="text-xs font-medium text-t1">{cfg.country}</span>
                    </div>
                    <Badge variant={cfg.status === 'active' ? 'success' : 'default'}>{cfg.status}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Compliance Tab ── */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <StatCard label="Compliant Countries" value={complianceData.filter(c => c.status === 'compliant').length} icon={<CheckCircle size={20} />} />
            <StatCard label="Needs Attention" value={complianceData.filter(c => c.status === 'attention').length} change="Action required" changeType="negative" icon={<AlertTriangle size={20} />} />
            <StatCard label="Total Filings" value={complianceData.reduce((a, c) => a + c.filings.length, 0)} icon={<FileText size={20} />} />
            <StatCard label="Next Deadline" value={[...complianceData].sort((a, b) => a.nextDeadline.localeCompare(b.nextDeadline))[0]?.nextDeadline || '---'} icon={<Clock size={20} />} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {complianceData.map((item, idx) => (
              <Card key={idx}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{getFlag(item.country)}</span>
                    <div>
                      <p className="text-sm font-semibold text-t1">{item.country}</p>
                      <p className="text-xs text-t3">Employment Compliance</p>
                    </div>
                  </div>
                  <Badge variant={item.status === 'compliant' ? 'success' : 'warning'}>
                    {item.status === 'compliant' ? 'Compliant' : 'Attention'}
                  </Badge>
                </div>

                <div className="space-y-2 mb-3">
                  <p className="text-xs font-medium text-t2">Required Filings</p>
                  <div className="flex flex-wrap gap-1">
                    {item.filings.map((filing, fi) => (
                      <Badge key={fi} variant="default">{filing}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-divider">
                  <div>
                    <p className="text-xs text-t3">Next Deadline</p>
                    <p className="text-sm font-semibold text-t1">{item.nextDeadline}</p>
                  </div>
                  <div>
                    <p className="text-xs text-t3">Status</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {item.status === 'compliant' ? (
                        <CheckCircle size={14} className="text-success" />
                      ) : (
                        <AlertTriangle size={14} className="text-warning" />
                      )}
                      <p className="text-xs text-t2">{item.notes}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Add EOR Entity Modal ── */}
      <Modal open={showEntityModal} onClose={() => setShowEntityModal(false)} title="Add EOR Entity">
        <div className="space-y-4">
          <Input
            label="Legal Name"
            placeholder="Entity legal name"
            value={entityForm.legal_name}
            onChange={(e) => setEntityForm({ ...entityForm, legal_name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Country"
              value={entityForm.country}
              onChange={(e) => setEntityForm({ ...entityForm, country: e.target.value })}
              options={Object.keys(countryFlags).map(c => ({ value: c, label: c }))}
            />
            <Select
              label={tc('currency')}
              value={entityForm.currency}
              onChange={(e) => setEntityForm({ ...entityForm, currency: e.target.value })}
              options={['USD','EUR','GBP','BRL','INR','NGN','JPY','AUD','CAD','SGD'].map(c => ({ value: c, label: c }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEntityModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitEntity}>Create Entity</Button>
          </div>
        </div>
      </Modal>

      {/* ── Add Contractor Modal ── */}
      <Modal open={showContractorModal} onClose={() => setShowContractorModal(false)} title="Add Contractor">
        <div className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Contractor name"
            value={contractorForm.name}
            onChange={(e) => setContractorForm({ ...contractorForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Country"
              value={contractorForm.country}
              onChange={(e) => setContractorForm({ ...contractorForm, country: e.target.value })}
              options={Object.keys(countryFlags).map(c => ({ value: c, label: c }))}
            />
            <Input
              label="Specialty"
              placeholder="e.g. Software Engineering"
              value={contractorForm.specialty}
              onChange={(e) => setContractorForm({ ...contractorForm, specialty: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Hourly Rate (cents)"
              type="number"
              placeholder="5000"
              value={contractorForm.hourly_rate}
              onChange={(e) => setContractorForm({ ...contractorForm, hourly_rate: e.target.value })}
            />
            <Select
              label={tc('currency')}
              value={contractorForm.currency}
              onChange={(e) => setContractorForm({ ...contractorForm, currency: e.target.value })}
              options={['USD','EUR','GBP','BRL','INR','NGN'].map(c => ({ value: c, label: c }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowContractorModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitContractor}>Add Contractor</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
