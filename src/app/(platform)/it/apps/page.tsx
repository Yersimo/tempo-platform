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
import { Tabs } from '@/components/ui/tabs'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { AppWindow, Plus, Key, AlertTriangle, CheckCircle, BarChart3, ShieldAlert, Calendar, DollarSign, Search, Users, Building2, Globe, ShieldCheck, ShieldX } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useTempo } from '@/lib/store'
import { AIRecommendationList, AIInsightCard } from '@/components/ai'
import { optimizeLicenses, detectShadowIT } from '@/lib/ai-engine'

export default function AppsPage() {
  const {
    softwareLicenses, itRequests, employees, departments,
    addSoftwareLicense, updateSoftwareLicense,
    addITRequest, updateITRequest,
    getEmployeeName, getDepartmentName, addToast,
    ensureModulesLoaded,
    shadowITDetections, updateShadowITDetection: storeUpdateShadowIT,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: string; id: string; label: string } | null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['devices', 'softwareLicenses', 'itRequests', 'appCatalog', 'appAssignments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const t = useTranslations('apps')
  const tc = useTranslations('common')

  const licenseRecs = useMemo(() => optimizeLicenses(softwareLicenses), [softwareLicenses])
  const shadowITInsights = useMemo(() => detectShadowIT(softwareLicenses), [softwareLicenses])

  const totalLicenses = softwareLicenses.reduce((a, l) => a + l.total_licenses, 0)
  const usedLicenses = softwareLicenses.reduce((a, l) => a + l.used_licenses, 0)
  const monthlyCost = softwareLicenses.reduce((a, l) => a + l.used_licenses * l.cost_per_license, 0)
  const openRequests = itRequests.filter(r => r.status === 'open').length

  // Usage analytics computed data
  const unusedLicenseCount = softwareLicenses.reduce((a, l) => a + (l.total_licenses - l.used_licenses), 0)
  const potentialSavings = softwareLicenses.reduce((a, l) => a + (l.total_licenses - l.used_licenses) * l.cost_per_license, 0)
  const avgCostPerUser = usedLicenses > 0 ? monthlyCost / usedLicenses : 0

  // Add License modal
  const [showLicenseModal, setShowLicenseModal] = useState(false)
  const [licenseForm, setLicenseForm] = useState({
    name: '',
    vendor: '',
    total_licenses: '',
    used_licenses: '',
    cost_per_license: '',
    renewal_date: '',
    currency: 'USD',
  })

  // Add IT Request modal
  const [showRequestModal, setShowRequestModal] = useState(false)
  const [requestForm, setRequestForm] = useState({
    requester_id: '',
    type: 'software',
    title: '',
    description: '',
    priority: 'medium',
  })

  // Bulk license provisioning state
  const [showBulkLicenseModal, setShowBulkLicenseModal] = useState(false)
  const [bulkLicStep, setBulkLicStep] = useState<1 | 2>(1)
  const [bulkLicMode, setBulkLicMode] = useState<'individual' | 'department' | 'country' | 'all'>('department')
  const [bulkLicSearch, setBulkLicSearch] = useState('')
  const [bulkLicSelectedEmpIds, setBulkLicSelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkLicSelectedDepts, setBulkLicSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkLicSelectedCountries, setBulkLicSelectedCountries] = useState<Set<string>>(new Set())
  const [bulkLicSelectedLicenseIds, setBulkLicSelectedLicenseIds] = useState<Set<string>>(new Set())

  // Bulk license computed memos
  const uniqueCountries = useMemo(() => {
    const countries = new Set<string>()
    employees.forEach(e => { if (e.country) countries.add(e.country) })
    return Array.from(countries).sort()
  }, [employees])

  const bulkLicTargetEmployees = useMemo(() => {
    if (bulkLicMode === 'all') return employees
    if (bulkLicMode === 'department') {
      return employees.filter(e => bulkLicSelectedDepts.has(e.department_id || ''))
    }
    if (bulkLicMode === 'country') {
      return employees.filter(e => bulkLicSelectedCountries.has(e.country || ''))
    }
    // individual mode - show all, filter by search
    const q = bulkLicSearch.toLowerCase()
    if (!q) return employees
    return employees.filter(e =>
      (e.profile?.full_name || '').toLowerCase().includes(q) ||
      (e.profile?.email || '').toLowerCase().includes(q) ||
      (e.job_title || '').toLowerCase().includes(q)
    )
  }, [employees, bulkLicMode, bulkLicSelectedDepts, bulkLicSelectedCountries, bulkLicSearch])

  const bulkLicSelectedEmployees = useMemo(() => {
    if (bulkLicMode === 'all') return employees
    if (bulkLicMode === 'department') {
      return employees.filter(e => bulkLicSelectedDepts.has(e.department_id || ''))
    }
    if (bulkLicMode === 'country') {
      return employees.filter(e => bulkLicSelectedCountries.has(e.country || ''))
    }
    return employees.filter(e => bulkLicSelectedEmpIds.has(e.id))
  }, [employees, bulkLicMode, bulkLicSelectedDepts, bulkLicSelectedCountries, bulkLicSelectedEmpIds])

  const bulkLicSelectedLicenses = useMemo(() => {
    return softwareLicenses.filter(l => bulkLicSelectedLicenseIds.has(l.id))
  }, [softwareLicenses, bulkLicSelectedLicenseIds])

  const bulkLicTotalMonthlyCost = useMemo(() => {
    return bulkLicSelectedLicenses.reduce((sum, l) => sum + l.cost_per_license, 0) * bulkLicSelectedEmployees.length
  }, [bulkLicSelectedLicenses, bulkLicSelectedEmployees])

  // Bulk license helpers
  function toggleBulkLicSet<T>(set: Set<T>, value: T, setter: (s: Set<T>) => void) {
    const next = new Set(set)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    setter(next)
  }

  function resetBulkLicense() {
    setBulkLicStep(1)
    setBulkLicMode('department')
    setBulkLicSearch('')
    setBulkLicSelectedEmpIds(new Set())
    setBulkLicSelectedDepts(new Set())
    setBulkLicSelectedCountries(new Set())
    setBulkLicSelectedLicenseIds(new Set())
    setShowBulkLicenseModal(false)
  }

  function submitBulkLicense() {
    const empCount = bulkLicSelectedEmployees.length
    const licCount = bulkLicSelectedLicenses.length
    addToast(`Successfully provisioned ${licCount} license${licCount !== 1 ? 's' : ''} for ${empCount} employee${empCount !== 1 ? 's' : ''}`)
    resetBulkLicense()
  }

  // Tab state
  const [activeTab, setActiveTab] = useState('apps')

  // Shadow IT detections from store
  const shadowITList = shadowITDetections as Array<{
    id: string
    app_name: string
    detected_users: number
    risk_level: 'high' | 'medium' | 'low'
    category: string
    detected_date: string
    recommended_alternative: string
    data_risk: string
    status: 'flagged' | 'under_review' | 'accepted' | 'approved' | 'blocked'
  }>

  function handleShadowITAction(id: string, status: 'approved' | 'blocked') {
    storeUpdateShadowIT(id, { status })
    const detection = shadowITList.find(d => d.id === id)
    addToast(`${detection?.app_name || 'App'} has been ${status}`)
  }

  function openAddLicense() {
    setLicenseForm({ name: '', vendor: '', total_licenses: '', used_licenses: '', cost_per_license: '', renewal_date: '', currency: 'USD' })
    setShowLicenseModal(true)
  }

  function submitLicense() {
    if (!licenseForm.name) { addToast('License name is required', 'error'); return }
    if (!licenseForm.vendor) { addToast('Vendor is required', 'error'); return }
    setSaving(true)
    try {
      addSoftwareLicense({
        name: licenseForm.name,
        vendor: licenseForm.vendor,
        total_licenses: Number(licenseForm.total_licenses) || 10,
        used_licenses: Number(licenseForm.used_licenses) || 0,
        cost_per_license: Number(licenseForm.cost_per_license) || 0,
        renewal_date: licenseForm.renewal_date || '2027-01-01',
        currency: licenseForm.currency,
      })
      addToast('License added successfully')
      setShowLicenseModal(false)
    } finally { setSaving(false) }
  }

  function revokeLicense(id: string) {
    const license = softwareLicenses.find(l => l.id === id)
    setConfirmAction({ show: true, type: 'revoke', id, label: license?.name || 'this license' })
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    try {
      if (confirmAction.type === 'revoke') {
        updateSoftwareLicense(confirmAction.id, { used_licenses: 0 })
        addToast('All license seats revoked')
      } else if (confirmAction.type === 'resolve') {
        updateITRequest(confirmAction.id, { status: 'resolved' })
        addToast('Request resolved')
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  function openAddRequest() {
    setRequestForm({ requester_id: employees[0]?.id || '', type: 'software', title: '', description: '', priority: 'medium' })
    setShowRequestModal(true)
  }

  function submitRequest() {
    if (!requestForm.title) { addToast('Request title is required', 'error'); return }
    if (!requestForm.requester_id) { addToast('Requester is required', 'error'); return }
    setSaving(true)
    try {
      addITRequest({
        requester_id: requestForm.requester_id,
        type: requestForm.type,
        title: requestForm.title,
        description: requestForm.description,
        priority: requestForm.priority,
        status: 'open',
        assigned_to: null,
      })
      addToast('IT request submitted')
      setShowRequestModal(false)
    } finally { setSaving(false) }
  }

  function resolveRequest(id: string) {
    const req = itRequests.find(r => r.id === id)
    setConfirmAction({ show: true, type: 'resolve', id, label: req?.title || 'this request' })
  }

  function startRequest(id: string) {
    updateITRequest(id, { status: 'in_progress' })
  }

  // Days until renewal
  function daysUntilRenewal(dateStr: string): number {
    const diff = new Date(dateStr).getTime() - new Date().getTime()
    return Math.max(0, Math.round(diff / 86400000))
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} actions={<div className="flex gap-2"><Button size="sm" variant="secondary" disabled><Users size={14} /> Bulk Provision</Button><Button size="sm" variant="secondary" disabled><Plus size={14} /> {t('itRequest')}</Button><Button size="sm" disabled><Plus size={14} /> {t('addLicense')}</Button></div>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowBulkLicenseModal(true)}><Users size={14} /> Bulk Provision</Button>
            <Button size="sm" variant="secondary" onClick={openAddRequest}><Plus size={14} /> {t('itRequest')}</Button>
            <Button size="sm" onClick={openAddLicense}><Plus size={14} /> {t('addLicense')}</Button>
          </div>
        }
      />

      <Tabs
        tabs={[
          { id: 'apps', label: 'Apps & Licenses', count: softwareLicenses.length },
          { id: 'shadow-it', label: 'Shadow IT', count: shadowITList.filter(d => d.status === 'flagged' || d.status === 'under_review').length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-6"
      />

      {activeTab === 'apps' && (<>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalLicenses')} value={totalLicenses} icon={<Key size={20} />} />
        <StatCard label={t('utilization')} value={totalLicenses > 0 ? `${Math.round(usedLicenses / totalLicenses * 100)}%` : '0%'} change={t('inUse', { count: usedLicenses })} changeType="neutral" />
        <StatCard label={t('monthlyCost')} value={`$${Math.round(monthlyCost).toLocaleString()}`} icon={<AppWindow size={20} />} href="/finance/budgets" />
        <StatCard label={t('openItRequests')} value={openRequests} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {softwareLicenses.map(license => {
          const utilPct = license.total_licenses > 0 ? Math.round(license.used_licenses / license.total_licenses * 100) : 0
          return (
            <Card key={license.id}>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{license.name}</h3>
                  <p className="text-xs text-t3">{license.vendor}</p>
                </div>
                <Badge variant="success">{tc('active')}</Badge>
              </div>
              <div className="grid grid-cols-3 gap-3 mb-3">
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('used')}</p>
                  <p className="text-sm font-semibold text-t1">{license.used_licenses} / {license.total_licenses}</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('costPerLicense')}</p>
                  <p className="text-sm font-semibold text-t1">${license.cost_per_license}/mo</p>
                </div>
                <div>
                  <p className="text-[0.6rem] text-t3 uppercase">{t('renewal')}</p>
                  <p className="text-sm font-semibold text-t1">{license.renewal_date}</p>
                </div>
              </div>
              <Progress value={utilPct} showLabel color={utilPct > 90 ? 'error' : 'orange'} />
            </Card>
          )
        })}
      </div>

      {/* AI Insights */}
      <div className="mb-6">
        <AIRecommendationList
          title={t('licenseOptimization')}
          recommendations={licenseRecs}
        />
      </div>

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('itSupportRequests')}</CardTitle>
            <Button size="sm" variant="secondary" onClick={openAddRequest}><Plus size={14} /> {t('newRequest')}</Button>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {itRequests.length === 0 && (
            <div className="px-6 py-12 text-center text-sm text-t3">{t('noItRequests')}</div>
          )}
          {itRequests.map(req => (
            <div key={req.id} className="px-6 py-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t2">
                <AppWindow size={18} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-t1">{req.title}</p>
                <p className="text-xs text-t3">{getEmployeeName(req.requester_id)} - {req.description}</p>
              </div>
              <Badge variant={req.priority === 'high' ? 'error' : req.priority === 'medium' ? 'warning' : 'default'}>
                {req.priority}
              </Badge>
              <Badge variant={req.status === 'resolved' ? 'success' : req.status === 'in_progress' ? 'info' : 'warning'}>
                {req.status.replace('_', ' ')}
              </Badge>
              <div className="flex gap-1">
                {req.status === 'open' && (
                  <Button size="sm" variant="secondary" onClick={() => startRequest(req.id)}>
                    {tc('start')}
                  </Button>
                )}
                {(req.status === 'open' || req.status === 'in_progress') && (
                  <Button size="sm" variant="primary" onClick={() => resolveRequest(req.id)}>
                    <CheckCircle size={12} /> {tc('resolve')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── Section 1: Usage Analytics ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <BarChart3 size={20} /> {t('usageAnalytics')}
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatCard label={t('licenseUtilization')} value={totalLicenses > 0 ? `${Math.round(usedLicenses / totalLicenses * 100)}%` : '0%'} icon={<Key size={20} />} />
          <StatCard label={t('totalUnused')} value={unusedLicenseCount} change={t('flaggedForReclamation')} changeType="negative" />
          <StatCard label={t('costPerUser')} value={`$${avgCostPerUser.toFixed(2)}/mo`} icon={<DollarSign size={20} />} />
          <StatCard label={t('potentialSavings')} value={`$${Math.round(potentialSavings).toLocaleString()}/mo`} change={`$${Math.round(potentialSavings * 12).toLocaleString()}/yr`} changeType="positive" />
        </div>

        {/* License utilization details */}
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('licenseUtilization')}</CardTitle>
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-t3" />
                <span className="text-xs text-t3">{t('renewalCalendar')}</span>
              </div>
            </div>
          </CardHeader>
          <div className="divide-y divide-divider">
            {softwareLicenses.map(license => {
              const utilPct = license.total_licenses > 0 ? Math.round(license.used_licenses / license.total_licenses * 100) : 0
              const unused = license.total_licenses - license.used_licenses
              const wastedCost = unused * license.cost_per_license
              const renewalDays = daysUntilRenewal(license.renewal_date)
              return (
                <div key={license.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-t2">
                        <AppWindow size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-t1">{license.name}</p>
                        <p className="text-xs text-t3">{license.vendor}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-t1">{license.used_licenses} / {license.total_licenses}</p>
                        <p className="text-xs text-t3">{t('unusedLicenses')}: {unused}</p>
                      </div>
                      {unused > 0 && (
                        <Badge variant="warning">${wastedCost.toLocaleString()}/mo</Badge>
                      )}
                      <Badge variant={renewalDays < 90 ? 'warning' : 'default'}>
                        {t('renewsIn', { days: renewalDays })}
                      </Badge>
                    </div>
                  </div>
                  <Progress value={utilPct} showLabel color={utilPct > 90 ? 'error' : utilPct < 60 ? 'warning' : 'success'} />
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* ── Section 2: Shadow IT Detection ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
          <ShieldAlert size={20} /> {t('shadowItDetection')}
        </h2>
        <p className="text-sm text-t3 mb-4">{t('shadowItDesc')}</p>

        {/* AI Shadow IT Insights */}
        {shadowITInsights.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {shadowITInsights.map(insight => (
              <AIInsightCard key={insight.id} insight={insight} compact />
            ))}
          </div>
        )}

        <Card padding="none">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">App</th>
                  <th className="tempo-th text-center px-4 py-3">{t('detectedUsers')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('riskLevel')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('dataRisk')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('recommendedAlt')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {shadowITList.map(detection => (
                  <tr key={detection.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div>
                        <p className="text-xs font-medium text-t1">{detection.app_name}</p>
                        <p className="text-xs text-t3">{detection.category}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-medium text-t1">{detection.detected_users}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        detection.risk_level === 'high' ? 'error' :
                        detection.risk_level === 'medium' ? 'warning' : 'default'
                      }>
                        {detection.risk_level === 'high' ? t('highRisk') :
                         detection.risk_level === 'medium' ? t('mediumRisk') : t('lowRisk')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2 max-w-[200px]">{detection.data_risk}</td>
                    <td className="px-4 py-3 text-xs text-tempo-600 font-medium">{detection.recommended_alternative}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        detection.status === 'flagged' ? 'error' :
                        detection.status === 'under_review' ? 'warning' : 'success'
                      }>
                        {detection.status === 'under_review' ? t('underReview') :
                         detection.status === 'flagged' ? t('flagged') : t('accepted')}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
      </>)}

      {activeTab === 'shadow-it' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Detected Shadow Apps" value={shadowITList.length} icon={<ShieldAlert size={20} />} />
            <StatCard label="High Risk" value={shadowITList.filter(d => d.risk_level === 'high').length} icon={<AlertTriangle size={20} />} changeType="negative" />
            <StatCard label="Pending Review" value={shadowITList.filter(d => d.status === 'flagged' || d.status === 'under_review').length} icon={<Search size={20} />} />
            <StatCard label="Total Exposed Users" value={shadowITList.reduce((a, d) => a + d.detected_users, 0)} icon={<Users size={20} />} />
          </div>

          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Shadow IT Detections</CardTitle>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">App Name</th>
                    <th className="tempo-th text-left px-4 py-3">Category</th>
                    <th className="tempo-th text-center px-4 py-3">Risk Level</th>
                    <th className="tempo-th text-left px-4 py-3">First Detected</th>
                    <th className="tempo-th text-center px-4 py-3">Users</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {shadowITList.map(detection => (
                    <tr key={detection.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-xs font-medium text-t1">{detection.app_name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{detection.category}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          detection.risk_level === 'high' ? 'error' :
                          detection.risk_level === 'medium' ? 'warning' : 'default'
                        }>
                          {detection.risk_level === 'high' ? t('highRisk') :
                           detection.risk_level === 'medium' ? t('mediumRisk') : t('lowRisk')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{detection.detected_date}</td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-t1">{detection.detected_users}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          detection.status === 'flagged' ? 'error' :
                          detection.status === 'under_review' ? 'warning' :
                          detection.status === 'approved' || detection.status === 'accepted' ? 'success' :
                          detection.status === 'blocked' ? 'error' : 'default'
                        }>
                          {detection.status === 'under_review' ? 'Under Review' :
                           detection.status === 'flagged' ? 'Flagged' :
                           detection.status === 'approved' || detection.status === 'accepted' ? 'Approved' :
                           detection.status === 'blocked' ? 'Blocked' : detection.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {(detection.status === 'flagged' || detection.status === 'under_review') && (
                          <div className="flex items-center justify-center gap-1">
                            <Button size="sm" variant="secondary" onClick={() => handleShadowITAction(detection.id, 'approved')}>
                              <ShieldCheck size={12} /> Approve
                            </Button>
                            <Button size="sm" variant="danger" onClick={() => handleShadowITAction(detection.id, 'blocked')}>
                              <ShieldX size={12} /> Block
                            </Button>
                          </div>
                        )}
                        {(detection.status === 'approved' || detection.status === 'accepted') && (
                          <span className="text-xs text-green-600 font-medium">Approved</span>
                        )}
                        {detection.status === 'blocked' && (
                          <span className="text-xs text-red-600 font-medium">Blocked</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Shadow IT Insights */}
          {shadowITInsights.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
                <ShieldAlert size={16} /> Shadow IT Risk Analysis
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shadowITInsights.map(insight => (
                  <AIInsightCard key={insight.id} insight={insight} compact />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Add License Modal */}
      <Modal open={showLicenseModal} onClose={() => setShowLicenseModal(false)} title={t('addLicenseModal')}>
        <div className="space-y-4">
          <Input label={t('softwareName')} placeholder={t('softwareNamePlaceholder')} value={licenseForm.name} onChange={(e) => setLicenseForm({ ...licenseForm, name: e.target.value })} />
          <Input label={t('vendor')} placeholder={t('vendorPlaceholder')} value={licenseForm.vendor} onChange={(e) => setLicenseForm({ ...licenseForm, vendor: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('totalLicensesLabel')} type="number" placeholder="50" value={licenseForm.total_licenses} onChange={(e) => setLicenseForm({ ...licenseForm, total_licenses: e.target.value })} />
            <Input label={t('usedLicenses')} type="number" placeholder="0" value={licenseForm.used_licenses} onChange={(e) => setLicenseForm({ ...licenseForm, used_licenses: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('costPerLicenseLabel')} type="number" placeholder="12.50" value={licenseForm.cost_per_license} onChange={(e) => setLicenseForm({ ...licenseForm, cost_per_license: e.target.value })} />
            <Select label={tc('currency')} value={licenseForm.currency} onChange={(e) => setLicenseForm({ ...licenseForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' },
              { value: 'EUR', label: 'EUR' },
              { value: 'GBP', label: 'GBP' },
              { value: 'XOF', label: 'XOF' },
              { value: 'NGN', label: 'NGN' },
            ]} />
          </div>
          <Input label={t('renewalDate')} type="date" value={licenseForm.renewal_date} onChange={(e) => setLicenseForm({ ...licenseForm, renewal_date: e.target.value })} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLicenseModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitLicense}>{t('addLicense')}</Button>
          </div>
        </div>
      </Modal>

      {/* Create IT Request Modal */}
      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title={t('createItRequestModal')}>
        <div className="space-y-4">
          <Select label={t('requester')} value={requestForm.requester_id} onChange={(e) => setRequestForm({ ...requestForm, requester_id: e.target.value })} options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))} />
          <Select label={t('requestType')} value={requestForm.type} onChange={(e) => setRequestForm({ ...requestForm, type: e.target.value })} options={[
            { value: 'software', label: t('typeSoftware') },
            { value: 'hardware', label: t('typeHardware') },
            { value: 'access', label: t('typeAccess') },
            { value: 'network', label: t('typeNetwork') },
            { value: 'other', label: t('typeOther') },
          ]} />
          <Input label={t('requestTitleLabel')} placeholder={t('requestTitlePlaceholder')} value={requestForm.title} onChange={(e) => setRequestForm({ ...requestForm, title: e.target.value })} />
          <Textarea label={tc('description')} placeholder={t('requestDescPlaceholder')} rows={3} value={requestForm.description} onChange={(e) => setRequestForm({ ...requestForm, description: e.target.value })} />
          <Select label={t('priority')} value={requestForm.priority} onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value })} options={[
            { value: 'low', label: t('priorityLow') },
            { value: 'medium', label: t('priorityMedium') },
            { value: 'high', label: t('priorityHigh') },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitRequest}>{t('submitRequest')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk License Provisioning Modal */}
      <Modal open={showBulkLicenseModal} onClose={resetBulkLicense} title="Bulk License Provisioning" size="xl">
        <div>
          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`flex items-center gap-2 text-xs font-medium ${bulkLicStep === 1 ? 'text-tempo-600' : 'text-t3'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${bulkLicStep === 1 ? 'bg-tempo-600 text-white' : 'bg-canvas text-t3'}`}>1</div>
              Select Employees
            </div>
            <div className="flex-1 h-px bg-divider" />
            <div className={`flex items-center gap-2 text-xs font-medium ${bulkLicStep === 2 ? 'text-tempo-600' : 'text-t3'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold ${bulkLicStep === 2 ? 'bg-tempo-600 text-white' : 'bg-canvas text-t3'}`}>2</div>
              Select Licenses
            </div>
          </div>

          {/* Step 1: Select Employees */}
          {bulkLicStep === 1 && (
            <div>
              {/* Mode tabs */}
              <div className="flex gap-1 p-1 bg-canvas rounded-lg mb-4">
                {([
                  { key: 'individual' as const, label: 'Individual', icon: <Search size={14} /> },
                  { key: 'department' as const, label: 'Department', icon: <Building2 size={14} /> },
                  { key: 'country' as const, label: 'Country', icon: <Globe size={14} /> },
                  { key: 'all' as const, label: 'Entire Company', icon: <Users size={14} /> },
                ]).map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setBulkLicMode(tab.key)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium rounded-md transition-colors ${
                      bulkLicMode === tab.key ? 'bg-card text-t1 shadow-sm' : 'text-t3 hover:text-t2'
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>

              {/* Individual mode */}
              {bulkLicMode === 'individual' && (
                <div>
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
                    <input
                      type="text"
                      placeholder="Search employees by name, email, or title..."
                      value={bulkLicSearch}
                      onChange={(e) => setBulkLicSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm bg-canvas border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-tempo-500 text-t1 placeholder:text-t3"
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-divider">
                    {bulkLicTargetEmployees.map(emp => {
                      const selected = bulkLicSelectedEmpIds.has(emp.id)
                      return (
                        <label key={emp.id} className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-canvas/50 ${selected ? 'bg-tempo-50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBulkLicSet(bulkLicSelectedEmpIds, emp.id, setBulkLicSelectedEmpIds)}
                            className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                          />
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-t1 truncate">{emp.profile?.full_name}</p>
                            <p className="text-[0.65rem] text-t3 truncate">{emp.job_title} {emp.department_id ? `- ${getDepartmentName(emp.department_id)}` : ''}</p>
                          </div>
                          <span className="text-[0.65rem] text-t3">{emp.country}</span>
                        </label>
                      )
                    })}
                    {bulkLicTargetEmployees.length === 0 && (
                      <div className="px-4 py-8 text-center text-sm text-t3">No employees match your search.</div>
                    )}
                  </div>
                  <p className="text-xs text-t3 mt-2">{bulkLicSelectedEmpIds.size} employee{bulkLicSelectedEmpIds.size !== 1 ? 's' : ''} selected</p>
                </div>
              )}

              {/* Department mode */}
              {bulkLicMode === 'department' && (
                <div>
                  <div className="border border-border rounded-lg divide-y divide-divider">
                    {departments.map(dept => {
                      const deptEmployees = employees.filter(e => e.department_id === dept.id)
                      const selected = bulkLicSelectedDepts.has(dept.id)
                      return (
                        <label key={dept.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-canvas/50 ${selected ? 'bg-tempo-50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBulkLicSet(bulkLicSelectedDepts, dept.id, setBulkLicSelectedDepts)}
                            className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                          />
                          <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center">
                            <Building2 size={16} className="text-t2" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-t1">{dept.name}</p>
                            <p className="text-xs text-t3">{deptEmployees.length} employee{deptEmployees.length !== 1 ? 's' : ''}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-t3 mt-2">
                    {bulkLicSelectedDepts.size} department{bulkLicSelectedDepts.size !== 1 ? 's' : ''} selected
                    ({bulkLicSelectedEmployees.length} employee{bulkLicSelectedEmployees.length !== 1 ? 's' : ''})
                  </p>
                </div>
              )}

              {/* Country mode */}
              {bulkLicMode === 'country' && (
                <div>
                  <div className="border border-border rounded-lg divide-y divide-divider">
                    {uniqueCountries.map(country => {
                      const countryEmployees = employees.filter(e => e.country === country)
                      const selected = bulkLicSelectedCountries.has(country)
                      return (
                        <label key={country} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-canvas/50 ${selected ? 'bg-tempo-50' : ''}`}>
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleBulkLicSet(bulkLicSelectedCountries, country, setBulkLicSelectedCountries)}
                            className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                          />
                          <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center">
                            <Globe size={16} className="text-t2" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-t1">{country}</p>
                            <p className="text-xs text-t3">{countryEmployees.length} employee{countryEmployees.length !== 1 ? 's' : ''}</p>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                  <p className="text-xs text-t3 mt-2">
                    {bulkLicSelectedCountries.size} countr{bulkLicSelectedCountries.size !== 1 ? 'ies' : 'y'} selected
                    ({bulkLicSelectedEmployees.length} employee{bulkLicSelectedEmployees.length !== 1 ? 's' : ''})
                  </p>
                </div>
              )}

              {/* Entire company mode */}
              {bulkLicMode === 'all' && (
                <div className="border border-border rounded-lg p-6 text-center">
                  <Users size={32} className="mx-auto mb-3 text-tempo-600" />
                  <p className="text-sm font-medium text-t1 mb-1">Entire Company</p>
                  <p className="text-xs text-t3">All {employees.length} employees will receive the selected licenses.</p>
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Licenses */}
          {bulkLicStep === 2 && (
            <div>
              <p className="text-xs text-t3 mb-3">
                Provisioning for {bulkLicSelectedEmployees.length} employee{bulkLicSelectedEmployees.length !== 1 ? 's' : ''}. Select the licenses to assign:
              </p>
              <div className="max-h-64 overflow-y-auto border border-border rounded-lg divide-y divide-divider">
                {softwareLicenses.map(license => {
                  const available = license.total_licenses - license.used_licenses
                  const selected = bulkLicSelectedLicenseIds.has(license.id)
                  return (
                    <label key={license.id} className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-canvas/50 ${selected ? 'bg-tempo-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleBulkLicSet(bulkLicSelectedLicenseIds, license.id, setBulkLicSelectedLicenseIds)}
                        className="rounded border-border text-tempo-600 focus:ring-tempo-500"
                      />
                      <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center">
                        <AppWindow size={16} className="text-t2" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-t1">{license.name}</p>
                        <p className="text-xs text-t3">{license.vendor}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-t1">${license.cost_per_license}/mo</p>
                        <p className="text-xs text-t3">{available} seat{available !== 1 ? 's' : ''} available</p>
                      </div>
                    </label>
                  )
                })}
              </div>

              {/* Cost summary */}
              {bulkLicSelectedLicenseIds.size > 0 && (
                <div className="mt-4 p-4 bg-canvas rounded-lg border border-border">
                  <h4 className="text-xs font-semibold text-t1 mb-2">Cost Summary</h4>
                  <div className="space-y-1">
                    {bulkLicSelectedLicenses.map(l => (
                      <div key={l.id} className="flex justify-between text-xs">
                        <span className="text-t2">{l.name} x {bulkLicSelectedEmployees.length}</span>
                        <span className="text-t1 font-medium">${(l.cost_per_license * bulkLicSelectedEmployees.length).toLocaleString()}/mo</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm font-semibold pt-2 border-t border-divider mt-2">
                      <span className="text-t1">Total Monthly Cost</span>
                      <span className="text-tempo-600">${bulkLicTotalMonthlyCost.toLocaleString()}/mo</span>
                    </div>
                    <div className="flex justify-between text-xs text-t3">
                      <span>Annual Estimate</span>
                      <span>${(bulkLicTotalMonthlyCost * 12).toLocaleString()}/yr</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center mt-6 pt-4 border-t border-divider">
            <div>
              {bulkLicStep === 2 && (
                <Button variant="secondary" size="sm" onClick={() => setBulkLicStep(1)}>Back</Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={resetBulkLicense}>Cancel</Button>
              {bulkLicStep === 1 && (
                <Button
                  size="sm"
                  disabled={bulkLicSelectedEmployees.length === 0}
                  onClick={() => setBulkLicStep(2)}
                >
                  Next
                </Button>
              )}
              {bulkLicStep === 2 && (
                <Button
                  size="sm"
                  disabled={bulkLicSelectedLicenseIds.size === 0}
                  onClick={submitBulkLicense}
                >
                  <Key size={14} /> Provision {bulkLicSelectedLicenseIds.size} License{bulkLicSelectedLicenseIds.size !== 1 ? 's' : ''}
                </Button>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-lg border border-warning/30 bg-warning/5">
            <AlertTriangle size={20} className="text-warning mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-t1">
                {confirmAction?.type === 'revoke' && `Revoke all seats for ${confirmAction?.label}?`}
                {confirmAction?.type === 'resolve' && `Resolve request "${confirmAction?.label}"?`}
              </p>
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'revoke' && 'All assigned license seats will be revoked. Users will lose access.'}
                {confirmAction?.type === 'resolve' && 'This request will be marked as resolved and closed.'}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button variant="danger" disabled={saving} onClick={executeConfirmAction}>
              {saving ? 'Processing...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
