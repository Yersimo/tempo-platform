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
import { AppWindow, Plus, Key, AlertTriangle, CheckCircle } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIRecommendationList } from '@/components/ai'
import { optimizeLicenses } from '@/lib/ai-engine'

export default function AppsPage() {
  const {
    softwareLicenses, itRequests, employees,
    addSoftwareLicense, updateSoftwareLicense,
    addITRequest, updateITRequest,
    getEmployeeName,
  } = useTempo()

  const t = useTranslations('apps')
  const tc = useTranslations('common')

  const licenseRecs = useMemo(() => optimizeLicenses(softwareLicenses), [softwareLicenses])

  const totalLicenses = softwareLicenses.reduce((a, l) => a + l.total_licenses, 0)
  const usedLicenses = softwareLicenses.reduce((a, l) => a + l.used_licenses, 0)
  const monthlyCost = softwareLicenses.reduce((a, l) => a + l.used_licenses * l.cost_per_license, 0)
  const openRequests = itRequests.filter(r => r.status === 'open').length

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

  function openAddLicense() {
    setLicenseForm({ name: '', vendor: '', total_licenses: '', used_licenses: '', cost_per_license: '', renewal_date: '', currency: 'USD' })
    setShowLicenseModal(true)
  }

  function submitLicense() {
    if (!licenseForm.name || !licenseForm.vendor) return
    addSoftwareLicense({
      name: licenseForm.name,
      vendor: licenseForm.vendor,
      total_licenses: Number(licenseForm.total_licenses) || 10,
      used_licenses: Number(licenseForm.used_licenses) || 0,
      cost_per_license: Number(licenseForm.cost_per_license) || 0,
      renewal_date: licenseForm.renewal_date || '2027-01-01',
      currency: licenseForm.currency,
    })
    setShowLicenseModal(false)
  }

  function openAddRequest() {
    setRequestForm({ requester_id: employees[0]?.id || '', type: 'software', title: '', description: '', priority: 'medium' })
    setShowRequestModal(true)
  }

  function submitRequest() {
    if (!requestForm.title || !requestForm.requester_id) return
    addITRequest({
      requester_id: requestForm.requester_id,
      type: requestForm.type,
      title: requestForm.title,
      description: requestForm.description,
      priority: requestForm.priority,
      status: 'open',
      assigned_to: null,
    })
    setShowRequestModal(false)
  }

  function resolveRequest(id: string) {
    updateITRequest(id, { status: 'resolved' })
  }

  function startRequest(id: string) {
    updateITRequest(id, { status: 'in_progress' })
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={openAddRequest}><Plus size={14} /> {t('itRequest')}</Button>
            <Button size="sm" onClick={openAddLicense}><Plus size={14} /> {t('addLicense')}</Button>
          </div>
        }
      />

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
    </>
  )
}
