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
import { Building2, Plus, FileText, Shield, DollarSign, AlertTriangle, CheckCircle, XCircle, Clock, Phone, Mail, Edit } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { demoVendorContracts } from '@/lib/demo-data'

type TabKey = 'directory' | 'contracts' | 'compliance' | 'spend'

const CATEGORY_OPTIONS = [
  { value: 'Software', label: 'Software' },
  { value: 'Cloud Infrastructure', label: 'Cloud Infrastructure' },
  { value: 'Consulting', label: 'Consulting' },
  { value: 'Training', label: 'Training' },
  { value: 'Hardware', label: 'Hardware' },
  { value: 'Telecommunications', label: 'Telecommunications' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Office Supplies', label: 'Office Supplies' },
]

const PAYMENT_TERMS_OPTIONS = [
  { value: 'Net 15', label: 'Net 15' },
  { value: 'Net 30', label: 'Net 30' },
  { value: 'Net 45', label: 'Net 45' },
  { value: 'Net 60', label: 'Net 60' },
  { value: 'Due on Receipt', label: 'Due on Receipt' },
]

export default function VendorsPage() {
  const tc = useTranslations('common')
  const { vendors, invoices, addVendor, updateVendor } = useTempo()

  const [activeTab, setActiveTab] = useState<TabKey>('directory')
  const [showVendorModal, setShowVendorModal] = useState(false)
  const [editingVendor, setEditingVendor] = useState<string | null>(null)
  const [vendorForm, setVendorForm] = useState({
    name: '',
    category: 'Software',
    contact_email: '',
    contact_phone: '',
    payment_terms: 'Net 30',
    tax_id: '',
  })

  // Vendor spend aggregation from invoices (amounts in cents)
  const vendorSpendMap = useMemo(() => {
    const map: Record<string, number> = {}
    invoices.forEach(inv => {
      map[inv.vendor_id] = (map[inv.vendor_id] || 0) + inv.amount
    })
    return map
  }, [invoices])

  const totalSpend = Object.values(vendorSpendMap).reduce((a, b) => a + b, 0)
  const activeContracts = demoVendorContracts.filter(c => c.status === 'active').length
  const complianceRate = vendors.length > 0
    ? Math.round((vendors.filter(v => v.tax_id).length / vendors.length) * 100)
    : 0

  // Spend by category
  const spendByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    vendors.forEach(v => {
      const spend = vendorSpendMap[v.id] || 0
      if (spend > 0) {
        map[v.category] = (map[v.category] || 0) + spend
      }
    })
    return Object.entries(map)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)
  }, [vendors, vendorSpendMap])

  const maxCategorySpend = spendByCategory.length > 0
    ? Math.max(...spendByCategory.map(c => c.amount))
    : 1

  // Top vendors by spend
  const topVendors = useMemo(() => {
    return vendors
      .map(v => ({ ...v, spend: vendorSpendMap[v.id] || 0 }))
      .sort((a, b) => b.spend - a.spend)
  }, [vendors, vendorSpendMap])

  function getRiskLevel(vendor: any): string {
    if (vendor.risk_level) return vendor.risk_level
    const spend = vendorSpendMap[vendor.id] || 0
    if (spend > 30000) return 'high'
    if (spend > 10000) return 'medium'
    return 'low'
  }

  function getRiskBadgeVariant(risk: string) {
    switch (risk) {
      case 'high': return 'error' as const
      case 'medium': return 'warning' as const
      case 'low': return 'success' as const
      default: return 'default' as const
    }
  }

  function getCategoryBadgeVariant(category: string) {
    switch (category) {
      case 'Software': return 'info' as const
      case 'Cloud Infrastructure': return 'warning' as const
      case 'Consulting': return 'default' as const
      case 'Training': return 'success' as const
      default: return 'default' as const
    }
  }

  function getContractForVendor(vendorId: string) {
    return demoVendorContracts.find(c => c.vendor_id === vendorId)
  }

  function openNewVendor() {
    setEditingVendor(null)
    setVendorForm({
      name: '',
      category: 'Software',
      contact_email: '',
      contact_phone: '',
      payment_terms: 'Net 30',
      tax_id: '',
    })
    setShowVendorModal(true)
  }

  function openEditVendor(vendor: any) {
    setEditingVendor(vendor.id)
    setVendorForm({
      name: vendor.name || '',
      category: vendor.category || 'Software',
      contact_email: vendor.contact_email || '',
      contact_phone: vendor.contact_phone || '',
      payment_terms: vendor.payment_terms || 'Net 30',
      tax_id: vendor.tax_id || '',
    })
    setShowVendorModal(true)
  }

  function submitVendor() {
    if (!vendorForm.name || !vendorForm.contact_email) return
    if (editingVendor) {
      updateVendor(editingVendor, { ...vendorForm, status: 'active' })
    } else {
      addVendor({ ...vendorForm, status: 'active' })
    }
    setShowVendorModal(false)
    setEditingVendor(null)
  }

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'directory', label: 'Directory', icon: Building2 },
    { key: 'contracts', label: 'Contracts', icon: FileText },
    { key: 'compliance', label: 'Compliance', icon: Shield },
    { key: 'spend', label: 'Spend Analysis', icon: DollarSign },
  ]

  return (
    <>
      <Header
        title="Vendor Management"
        subtitle="Vendor directory, compliance & spend tracking"
        actions={<Button size="sm" onClick={openNewVendor}><Plus size={14} /> Add Vendor</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Vendors" value={vendors.length} icon={<Building2 size={20} />} />
        <StatCard label="Active Contracts" value={activeContracts} icon={<FileText size={20} />} />
        <StatCard label="Total Spend" value={`$${totalSpend.toLocaleString()}`} icon={<DollarSign size={20} />} />
        <StatCard
          label="Compliance Rate"
          value={`${complianceRate}%`}
          icon={<Shield size={20} />}
          change={complianceRate >= 80 ? 'Good standing' : 'Needs attention'}
          changeType={complianceRate >= 80 ? 'positive' : 'negative'}
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-t3 hover:text-t1'
              }`}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* ── Directory Tab ── */}
      {activeTab === 'directory' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendor Directory</CardTitle>
              <span className="text-xs text-t3">{vendors.length} vendors</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Name</th>
                  <th className="tempo-th text-left px-4 py-3">Category</th>
                  <th className="tempo-th text-left px-4 py-3">Contact</th>
                  <th className="tempo-th text-right px-4 py-3">Total Spend</th>
                  <th className="tempo-th text-left px-4 py-3">Payment Terms</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">Risk Level</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {vendors.map(vendor => {
                  const spend = vendorSpendMap[vendor.id] || 0
                  const risk = getRiskLevel(vendor)
                  return (
                    <tr key={vendor.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-xs font-medium text-t1">{vendor.name}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={getCategoryBadgeVariant(vendor.category)}>
                          {vendor.category}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-xs text-t2 flex items-center gap-1">
                            <Mail size={10} /> {vendor.contact_email}
                          </span>
                          {vendor.contact_phone && (
                            <span className="text-xs text-t3 flex items-center gap-1">
                              <Phone size={10} /> {vendor.contact_phone}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        ${spend.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">
                        {vendor.payment_terms || 'Net 30'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={vendor.status === 'active' ? 'success' : 'default'}>
                          {vendor.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getRiskBadgeVariant(risk)}>
                          {risk}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="secondary" onClick={() => openEditVendor(vendor)}>
                          <Edit size={12} /> {tc('edit')}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Contracts Tab ── */}
      {activeTab === 'contracts' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Vendor Contracts</CardTitle>
              <span className="text-xs text-t3">{demoVendorContracts.length} contracts</span>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Vendor</th>
                  <th className="tempo-th text-left px-4 py-3">Contract #</th>
                  <th className="tempo-th text-left px-4 py-3">Start Date</th>
                  <th className="tempo-th text-left px-4 py-3">End Date</th>
                  <th className="tempo-th text-right px-4 py-3">Annual Value</th>
                  <th className="tempo-th text-center px-4 py-3">Renewal</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoVendorContracts.map(contract => {
                  const vendor = vendors.find(v => v.id === contract.vendor_id)
                  const isExpiringSoon = contract.status === 'expiring_soon'
                  const endDate = new Date(contract.end_date)
                  const now = new Date()
                  const daysUntilEnd = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                  return (
                    <tr key={contract.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">{vendor?.name || contract.contract_number}</p>
                          <p className="text-xs text-t3">{vendor?.category}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-t2">{contract.contract_number}</td>
                      <td className="px-4 py-3 text-xs text-t2">{contract.start_date}</td>
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-xs text-t2">{contract.end_date}</p>
                          {daysUntilEnd <= 180 && daysUntilEnd > 0 && (
                            <p className="text-xs text-warning flex items-center gap-1">
                              <Clock size={10} /> {daysUntilEnd} days remaining
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                        ${contract.annual_value.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={contract.renewal_type === 'auto' ? 'info' : 'default'}>
                          {contract.renewal_type === 'auto' ? 'Auto-Renew' : 'Manual'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          contract.status === 'active' ? 'success' :
                          isExpiringSoon ? 'warning' : 'default'
                        }>
                          {isExpiringSoon ? 'Expiring Soon' : contract.status}
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

      {/* ── Compliance Tab ── */}
      {activeTab === 'compliance' && (
        <div className="space-y-4">
          {/* Compliance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle size={20} className="text-success" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-t1">{vendors.filter(v => v.tax_id).length}</p>
                  <p className="text-xs text-t3">W-9 / Tax ID on File</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                  <XCircle size={20} className="text-error" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-t1">{vendors.filter(v => !v.tax_id).length}</p>
                  <p className="text-xs text-t3">Missing Tax Documentation</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Shield size={20} className="text-accent" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-t1">{complianceRate}%</p>
                  <p className="text-xs text-t3">Overall Compliance Rate</p>
                </div>
              </div>
              <Progress value={complianceRate} color={complianceRate >= 80 ? 'orange' : 'orange'} className="mt-3" />
            </Card>
          </div>

          {/* Compliance Table */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Tax Compliance Status</CardTitle>
                <Badge variant={complianceRate >= 80 ? 'success' : 'warning'}>
                  {complianceRate}% compliant
                </Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Vendor</th>
                    <th className="tempo-th text-left px-4 py-3">Category</th>
                    <th className="tempo-th text-left px-4 py-3">Tax ID / W-9</th>
                    <th className="tempo-th text-center px-4 py-3">Compliance Status</th>
                    <th className="tempo-th text-right px-4 py-3">Total Spend</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {vendors.map(vendor => {
                    const hasTaxId = Boolean(vendor.tax_id)
                    const spend = vendorSpendMap[vendor.id] || 0
                    return (
                      <tr key={vendor.id} className={`hover:bg-canvas/50 ${!hasTaxId ? 'bg-error/5' : ''}`}>
                        <td className="px-6 py-3">
                          <p className="text-xs font-medium text-t1">{vendor.name}</p>
                          <p className="text-xs text-t3">{vendor.contact_email}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{vendor.category}</td>
                        <td className="px-4 py-3">
                          {hasTaxId ? (
                            <span className="text-xs font-mono text-t1">{vendor.tax_id}</span>
                          ) : (
                            <span className="text-xs text-error flex items-center gap-1">
                              <AlertTriangle size={10} /> Missing
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge variant={hasTaxId ? 'success' : 'error'}>
                            {hasTaxId ? 'Compliant' : 'Non-Compliant'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                          ${spend.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {!hasTaxId && (
                            <Button size="sm" variant="secondary" onClick={() => openEditVendor(vendor)}>
                              <FileText size={12} /> Add Tax ID
                            </Button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── Spend Analysis Tab ── */}
      {activeTab === 'spend' && (
        <div className="space-y-4">
          {/* Top Vendors by Spend */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Top Vendors by Spend</h3>
            <div className="space-y-3">
              {topVendors.map((vendor, idx) => {
                const pct = totalSpend > 0 ? Math.round((vendor.spend / totalSpend) * 100) : 0
                return (
                  <div key={vendor.id} className="flex items-center gap-4">
                    <span className="text-xs font-medium text-t3 w-6 text-right">{idx + 1}.</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-t1 font-medium truncate">{vendor.name}</span>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="font-semibold text-t1">${vendor.spend.toLocaleString()}</span>
                          <span className="text-xs text-t3">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-canvas rounded-full h-2">
                        <div
                          className="bg-accent rounded-full h-2 transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Spend by Category */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Spend by Category</h3>
            {spendByCategory.length > 0 ? (
              <div className="space-y-3">
                {spendByCategory.map(cat => {
                  const totalCatSpend = spendByCategory.reduce((a, c) => a + c.amount, 0)
                  const pct = totalCatSpend > 0 ? Math.round((cat.amount / totalCatSpend) * 100) : 0
                  const barWidth = maxCategorySpend > 0 ? Math.round((cat.amount / maxCategorySpend) * 100) : 0
                  return (
                    <div key={cat.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-t2">{cat.category}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-t1">${cat.amount.toLocaleString()}</span>
                          <span className="text-xs text-t3">({pct}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-canvas rounded-full h-2.5">
                        <div
                          className="bg-accent/80 rounded-full h-2.5 transition-all"
                          style={{ width: `${barWidth}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-t3">No spend data available.</p>
            )}
          </Card>

          {/* Vendor Spend Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topVendors.map(vendor => {
              const pct = totalSpend > 0 ? Math.round((vendor.spend / totalSpend) * 100) : 0
              const contract = getContractForVendor(vendor.id)
              return (
                <Card key={vendor.id}>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-t1 truncate">{vendor.name}</p>
                    <p className="text-xs text-t3">{vendor.category}</p>
                    <p className="text-lg font-bold text-t1">${vendor.spend.toLocaleString()}</p>
                    <Progress value={pct} color="orange" />
                    <div className="flex justify-between text-xs text-t3">
                      <span>{pct}% of total</span>
                      {contract && (
                        <span>Ends {contract.end_date}</span>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Add / Edit Vendor Modal */}
      <Modal open={showVendorModal} onClose={() => setShowVendorModal(false)} title={editingVendor ? 'Edit Vendor' : 'Add Vendor'}>
        <div className="space-y-4">
          <Input
            label="Vendor Name"
            placeholder="Enter vendor name"
            value={vendorForm.name}
            onChange={(e) => setVendorForm({ ...vendorForm, name: e.target.value })}
          />
          <Select
            label="Category"
            value={vendorForm.category}
            onChange={(e) => setVendorForm({ ...vendorForm, category: e.target.value })}
            options={CATEGORY_OPTIONS}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Contact Email"
              type="email"
              placeholder="vendor@example.com"
              value={vendorForm.contact_email}
              onChange={(e) => setVendorForm({ ...vendorForm, contact_email: e.target.value })}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={vendorForm.contact_phone}
              onChange={(e) => setVendorForm({ ...vendorForm, contact_phone: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Payment Terms"
              value={vendorForm.payment_terms}
              onChange={(e) => setVendorForm({ ...vendorForm, payment_terms: e.target.value })}
              options={PAYMENT_TERMS_OPTIONS}
            />
            <Input
              label="Tax ID / W-9"
              placeholder="XX-XXXXXXX"
              value={vendorForm.tax_id}
              onChange={(e) => setVendorForm({ ...vendorForm, tax_id: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowVendorModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitVendor}>{editingVendor ? tc('save') : 'Add Vendor'}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
