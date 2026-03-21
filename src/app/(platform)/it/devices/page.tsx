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
import { Input, Select } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Laptop, Plus, Monitor, Smartphone, Wrench, UserCheck, UserX, Shield, CheckCircle, XCircle, Clock, FileCheck, ArrowRight, Users, Search, Building2, Globe, Store, Truck, RotateCcw, Trash2, Package, ShieldCheck, Leaf, FileWarning, AlertTriangle } from 'lucide-react'
import { Avatar } from '@/components/ui/avatar'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'
import { exportToCSV } from '@/lib/export-import'
import { AIInsightCard } from '@/components/ai'
import { predictDeviceRefresh, scoreSecurityPosture } from '@/lib/ai-engine'
import { demoComplianceFrameworks, demoSecurityPosture, demoProvisioningEvents } from '@/lib/demo-data'

export default function DevicesPage() {
  const t = useTranslations('devices')
  const tc = useTranslations('common')
  const { devices, employees, departments, addDevice, updateDevice, getEmployeeName, getDepartmentName, addToast, deviceStoreCatalog, deviceOrders, buybackRequests, ensureModulesLoaded } = useTempo()
  const defaultCurrency = useOrgCurrency()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: string; id: string; label: string } | null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['devices', 'deviceActions', 'deviceInventory', 'deviceStoreCatalog', 'deviceOrders', 'employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const deviceInsights = useMemo(() => predictDeviceRefresh(devices), [devices])
  const securityScore = useMemo(() => scoreSecurityPosture(devices), [devices])

  const assignedCount = devices.filter(d => d.status === 'assigned').length
  const availableCount = devices.filter(d => d.status === 'available').length
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length

  // Add Device modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [deviceForm, setDeviceForm] = useState({
    type: 'laptop',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_end: '',
  })

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignDeviceId, setAssignDeviceId] = useState<string | null>(null)
  const [assignEmployeeId, setAssignEmployeeId] = useState('')

  // Bulk Assign modal state
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false)
  const [bulkStep, setBulkStep] = useState<1 | 2>(1)
  const [deviceSelectMode, setDeviceSelectMode] = useState<'individual' | 'type' | 'all'>('individual')
  const [deviceSearch, setDeviceSearch] = useState('')
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<string>>(new Set())
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<Set<string>>(new Set())
  const [empAssignMode, setEmpAssignMode] = useState<'individual' | 'department' | 'country'>('individual')
  const [empSearch, setEmpSearch] = useState('')
  const [selectedEmpIds, setSelectedEmpIds] = useState<Set<string>>(new Set())
  const [selectedDepts, setSelectedDepts] = useState<Set<string>>(new Set())
  const [selectedCountries, setSelectedCountries] = useState<Set<string>>(new Set())

  const availableDevices = useMemo(() => devices.filter(d => d.status === 'available'), [devices])
  const deviceTypes = useMemo(() => [...new Set(devices.map(d => d.type))].sort(), [devices])
  const uniqueCountries = useMemo(() => [...new Set(employees.map(e => e.country))].filter(Boolean).sort(), [employees])

  const bulkTargetDevices = useMemo(() => {
    switch (deviceSelectMode) {
      case 'individual':
        return availableDevices.filter(d => {
          if (!deviceSearch) return true
          const q = deviceSearch.toLowerCase()
          return (d.brand?.toLowerCase().includes(q) || d.model?.toLowerCase().includes(q) || d.serial_number?.toLowerCase().includes(q))
        })
      case 'type':
        return selectedDeviceTypes.size > 0 ? availableDevices.filter(d => selectedDeviceTypes.has(d.type)) : []
      case 'all':
        return availableDevices
      default: return []
    }
  }, [availableDevices, deviceSelectMode, deviceSearch, selectedDeviceTypes])

  const bulkSelectedDevices = useMemo(() => {
    if (deviceSelectMode === 'individual') return availableDevices.filter(d => selectedDeviceIds.has(d.id))
    return bulkTargetDevices
  }, [deviceSelectMode, availableDevices, selectedDeviceIds, bulkTargetDevices])

  const bulkTargetEmployees = useMemo(() => {
    switch (empAssignMode) {
      case 'individual':
        return employees.filter(emp => {
          if (!empSearch) return true
          const q = empSearch.toLowerCase()
          const name = emp.profile?.full_name?.toLowerCase() || ''
          const email = emp.profile?.email?.toLowerCase() || ''
          const title = emp.job_title?.toLowerCase() || ''
          return name.includes(q) || email.includes(q) || title.includes(q)
        })
      case 'department':
        return selectedDepts.size > 0 ? employees.filter(e => selectedDepts.has(e.department_id)) : []
      case 'country':
        return selectedCountries.size > 0 ? employees.filter(e => selectedCountries.has(e.country)) : []
      default: return []
    }
  }, [employees, empAssignMode, empSearch, selectedDepts, selectedCountries])

  const bulkSelectedEmployees = useMemo(() => {
    if (empAssignMode === 'individual') return employees.filter(e => selectedEmpIds.has(e.id))
    return bulkTargetEmployees
  }, [empAssignMode, employees, selectedEmpIds, bulkTargetEmployees])

  // Detect employees who already have an assigned device of the same type(s) as selected
  const selectedDeviceTypeSet = useMemo(() => new Set(bulkSelectedDevices.map(d => d.type)), [bulkSelectedDevices])
  const alreadyHaveDeviceIds = useMemo(() => {
    const assigned = devices.filter(d => d.status === 'assigned' && d.assigned_to)
    return new Set(bulkSelectedEmployees.filter(emp =>
      assigned.some(d => d.assigned_to === emp.id && selectedDeviceTypeSet.has(d.type))
    ).map(e => e.id))
  }, [devices, bulkSelectedEmployees, selectedDeviceTypeSet])

  const assignableCount = Math.min(
    bulkSelectedDevices.length,
    bulkSelectedEmployees.filter(e => !alreadyHaveDeviceIds.has(e.id)).length
  )

  function toggleSet<T>(set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next })
  }

  function resetBulkAssign() {
    setShowBulkAssignModal(false); setBulkStep(1); setDeviceSelectMode('individual')
    setDeviceSearch(''); setSelectedDeviceIds(new Set()); setSelectedDeviceTypes(new Set())
    setEmpAssignMode('individual'); setEmpSearch(''); setSelectedEmpIds(new Set())
    setSelectedDepts(new Set()); setSelectedCountries(new Set())
  }

  function submitBulkAssign() {
    const eligibleEmps = bulkSelectedEmployees.filter(e => !alreadyHaveDeviceIds.has(e.id))
    const devicesToAssign = bulkSelectedDevices.slice(0, eligibleEmps.length)
    let assigned = 0
    devicesToAssign.forEach((device, i) => {
      if (eligibleEmps[i]) {
        updateDevice(device.id, { assigned_to: eligibleEmps[i].id, status: 'assigned' })
        assigned++
      }
    })
    addToast(t('bulkAssignSuccess', { count: assigned }))
    resetBulkAssign()
  }

  const [activeTab, setActiveTab] = useState('overview')

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Laptop },
    { id: 'store', label: 'Store', icon: Store },
    { id: 'orders', label: 'Orders', icon: Truck },
    { id: 'buyback', label: 'Buyback', icon: RotateCcw },
    { id: 'disposal', label: 'Disposal', icon: Trash2 },
  ]

  const iconMap: Record<string, React.ReactNode> = {
    laptop: <Laptop size={16} />,
    phone: <Smartphone size={16} />,
    monitor: <Monitor size={16} />,
  }

  function openAddDevice() {
    setDeviceForm({ type: 'laptop', brand: '', model: '', serial_number: '', purchase_date: '', warranty_end: '' })
    setShowAddModal(true)
  }

  function submitDevice() {
    if (!deviceForm.brand) { addToast('Brand is required', 'error'); return }
    if (!deviceForm.model) { addToast('Model is required', 'error'); return }
    if (!deviceForm.serial_number) { addToast('Serial number is required', 'error'); return }
    setSaving(true)
    try {
      addDevice({
        type: deviceForm.type,
        brand: deviceForm.brand,
        model: deviceForm.model,
        serial_number: deviceForm.serial_number,
        status: 'available',
        assigned_to: null,
        purchase_date: deviceForm.purchase_date || new Date().toISOString().split('T')[0],
        warranty_end: deviceForm.warranty_end || '2028-12-31',
      })
      addToast('Device added successfully')
      setShowAddModal(false)
    } finally { setSaving(false) }
  }

  function openAssign(deviceId: string) {
    setAssignDeviceId(deviceId)
    setAssignEmployeeId(employees[0]?.id || '')
    setShowAssignModal(true)
  }

  function submitAssign() {
    if (!assignDeviceId) { addToast('No device selected', 'error'); return }
    if (!assignEmployeeId) { addToast('Please select an employee', 'error'); return }
    setSaving(true)
    try {
      updateDevice(assignDeviceId, { assigned_to: assignEmployeeId, status: 'assigned' })
      addToast('Device assigned successfully')
      setShowAssignModal(false)
      setAssignDeviceId(null)
    } finally { setSaving(false) }
  }

  function unassignDevice(deviceId: string) {
    const device = devices.find(d => d.id === deviceId)
    setConfirmAction({ show: true, type: 'unassign', id: deviceId, label: `${device?.brand || ''} ${device?.model || 'this device'}` })
  }

  function setMaintenance(deviceId: string) {
    const device = devices.find(d => d.id === deviceId)
    setConfirmAction({ show: true, type: 'maintenance', id: deviceId, label: `${device?.brand || ''} ${device?.model || 'this device'}` })
  }

  function setAvailable(deviceId: string) {
    updateDevice(deviceId, { assigned_to: null, status: 'available' })
    addToast('Device marked as available')
  }

  function executeConfirmAction() {
    if (!confirmAction) return
    setSaving(true)
    try {
      if (confirmAction.type === 'unassign') {
        updateDevice(confirmAction.id, { assigned_to: null, status: 'available' })
        addToast('Device unassigned')
      } else if (confirmAction.type === 'maintenance') {
        updateDevice(confirmAction.id, { status: 'maintenance' })
        addToast('Device sent to maintenance')
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} actions={<div className="flex gap-2"><Button size="sm" variant="secondary" disabled><Users size={14} /> {t('bulkAssign')}</Button><Button size="sm" disabled><Plus size={14} /> {t('addDevice')}</Button></div>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => setShowBulkAssignModal(true)}><Users size={14} /> {t('bulkAssign')}</Button><Button size="sm" onClick={openAddDevice}><Plus size={14} /> {t('addDevice')}</Button></div>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalDevices')} value={devices.length} icon={<Laptop size={20} />} />
        <StatCard label={t('assigned')} value={assignedCount} change={t('available', { count: availableCount })} changeType="neutral" href="/people" />
        <StatCard label={t('inMaintenance')} value={maintenanceCount} icon={<Wrench size={20} />} />
        <StatCard label={t('availableLabel')} value={availableCount} change={t('readyToAssign')} changeType="positive" />
      </div>

      {/* AI Insights */}
      {deviceInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {deviceInsights.slice(0, 2).map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => {
          const Icon = tab.icon
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab.id
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

      {activeTab === 'overview' && (<>
      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('deviceInventory')}</CardTitle>
            <Button variant="secondary" size="sm" onClick={() => exportToCSV(
              devices,
              [
                { header: 'Type', accessor: (d: any) => d.type || '' },
                { header: 'Brand', accessor: (d: any) => d.brand || '' },
                { header: 'Model', accessor: (d: any) => d.model || '' },
                { header: 'Serial', accessor: (d: any) => d.serial_number || '' },
                { header: 'Status', accessor: (d: any) => d.status || '' },
                { header: 'Assigned To', accessor: (d: any) => d.assigned_to || '' },
              ],
              'devices-export'
            )}>{tc('export')}</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableDevice')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableSerial')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableAssignedTo')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableWarranty')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map(device => (
                <tr key={device.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-t2">
                        {iconMap[device.type] || <Laptop size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">{device.brand} {device.model}</p>
                        <p className="text-xs text-t3">{t('purchased', { date: device.purchase_date })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge>{device.type}</Badge></td>
                  <td className="px-4 py-3 text-xs text-t3 font-mono">{device.serial_number}</td>
                  <td className="px-4 py-3 text-xs text-t2">
                    {device.assigned_to ? getEmployeeName(device.assigned_to) : '-'}
                  </td>
                  <td className="px-4 py-3 text-xs text-t2">{device.warranty_end}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={
                      device.status === 'assigned' ? 'success' :
                      device.status === 'available' ? 'info' :
                      device.status === 'maintenance' ? 'warning' : 'default'
                    }>
                      {device.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      {device.status === 'available' && (
                        <Button size="sm" variant="primary" onClick={() => openAssign(device.id)}>
                          <UserCheck size={12} /> {tc('assign')}
                        </Button>
                      )}
                      {device.status === 'assigned' && (
                        <Button size="sm" variant="ghost" onClick={() => unassignDevice(device.id)}>
                          <UserX size={12} /> {tc('unassign')}
                        </Button>
                      )}
                      {device.status !== 'maintenance' && (
                        <Button size="sm" variant="ghost" onClick={() => setMaintenance(device.id)}>
                          <Wrench size={12} />
                        </Button>
                      )}
                      {device.status === 'maintenance' && (
                        <Button size="sm" variant="secondary" onClick={() => setAvailable(device.id)}>
                          {t('markAvailable')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section 1: Security Posture Dashboard ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <Shield size={20} /> {t('securityPosture')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Overall Score */}
          <Card>
            <div className="text-center">
              <p className="text-[0.6rem] text-t3 uppercase mb-1">{t('securityScore')}</p>
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" className="text-canvas" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${securityScore.value}, 100`}
                    className={securityScore.value >= 80 ? 'text-success' : securityScore.value >= 60 ? 'text-warning' : 'text-error'} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-t1">{securityScore.value}</span>
              </div>
              <Badge variant={securityScore.value >= 80 ? 'success' : securityScore.value >= 60 ? 'warning' : 'error'}>
                {securityScore.label}
              </Badge>
            </div>
          </Card>

          {/* OS Currency */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('osCurrency')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('upToDate')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.os_currency.up_to_date}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('outdated')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.os_currency.outdated}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.os_currency.up_to_date / demoSecurityPosture.os_currency.total * 100)} showLabel color="success" />
            </div>
          </Card>

          {/* Encryption */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('encryptionStatus')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('encrypted')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.encryption_status.encrypted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('unencrypted')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.encryption_status.unencrypted}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.encryption_status.encrypted / demoSecurityPosture.encryption_status.total * 100)} showLabel color="success" />
            </div>
          </Card>

          {/* Endpoint Protection */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('endpointProtection')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('protected')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.endpoint_protection.protected}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('unprotected')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.endpoint_protection.unprotected}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.endpoint_protection.protected / demoSecurityPosture.endpoint_protection.total * 100)} showLabel color={demoSecurityPosture.endpoint_protection.unprotected > 1 ? 'warning' : 'success'} />
            </div>
          </Card>

          {/* Last Check-in */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('lastCheckin')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><Clock size={12} /> {t('within24h')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.within_24h}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-warning"><Clock size={12} /> {t('within7d')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.within_7d}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><Clock size={12} /> {t('older')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.older}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Section 2: Compliance Templates ── */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <FileCheck size={20} /> {t('complianceTemplates')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoComplianceFrameworks.map(framework => (
            <Card key={framework.id}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-t1">{framework.name}</h3>
                <Badge variant={
                  framework.status === 'compliant' ? 'success' :
                  framework.status === 'partial' ? 'warning' :
                  framework.status === 'not_applicable' ? 'default' : 'error'
                }>
                  {framework.status === 'compliant' ? t('compliant') :
                   framework.status === 'partial' ? t('partial') : t('notApplicable')}
                </Badge>
              </div>
              <p className="text-xs text-t3 mb-3">{framework.description}</p>

              {framework.status !== 'not_applicable' && (
                <>
                  <div className="mb-3">
                    <Progress value={framework.compliance_score} showLabel color={framework.compliance_score >= 90 ? 'success' : framework.compliance_score >= 70 ? 'warning' : 'error'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-success/5 rounded-lg">
                      <p className="text-xs text-success font-medium">{framework.passed_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('passed')}</p>
                    </div>
                    <div className="p-2 bg-error/5 rounded-lg">
                      <p className="text-xs text-error font-medium">{framework.failed_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('failed')}</p>
                    </div>
                    <div className="p-2 bg-warning/5 rounded-lg">
                      <p className="text-xs text-warning font-medium">{framework.pending_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('pending')}</p>
                    </div>
                  </div>
                  {framework.last_audit && (
                    <div className="mt-3 pt-3 border-t border-divider grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-t3">{t('lastAudit')}</p>
                        <p className="text-t1 font-medium">{framework.last_audit}</p>
                      </div>
                      <div>
                        <p className="text-t3">{t('nextAudit')}</p>
                        <p className="text-t1 font-medium">{framework.next_audit}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 3: Provisioning Workflows ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <ArrowRight size={20} /> {t('provisioningWorkflows')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Onboarding flow */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck size={18} className="text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('onboarding')}</h3>
                <p className="text-xs text-t3">Employee joins → Auto-assign device + apps</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-t3 mb-3">
              <Badge variant="info">New Employee</Badge>
              <ArrowRight size={12} />
              <Badge>Assign Device</Badge>
              <ArrowRight size={12} />
              <Badge>Provision Apps</Badge>
              <ArrowRight size={12} />
              <Badge variant="success">Ready</Badge>
            </div>
          </Card>

          {/* Offboarding flow */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <UserX size={18} className="text-error" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('offboarding')}</h3>
                <p className="text-xs text-t3">Employee leaves → Auto-revoke access + recover device</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-t3 mb-3">
              <Badge variant="warning">Departing</Badge>
              <ArrowRight size={12} />
              <Badge>Revoke Apps</Badge>
              <ArrowRight size={12} />
              <Badge>Recover Device</Badge>
              <ArrowRight size={12} />
              <Badge variant="default">Completed</Badge>
            </div>
          </Card>
        </div>

        {/* Recent Provisioning Events */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t('recentEvents')}</CardTitle>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoProvisioningEvents.map(event => (
              <div key={event.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${event.type === 'onboarding' ? 'bg-success/10' : 'bg-error/10'}`}>
                  {event.type === 'onboarding' ? <UserCheck size={18} className="text-success" /> : <UserX size={18} className="text-error" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{event.employee_name}</p>
                  <p className="text-xs text-t3">{event.date} - {event.type === 'onboarding' ? t('onboarding') : t('offboarding')}</p>
                </div>
                <div className="text-xs text-t3">
                  {event.devices_assigned.length > 0 && (
                    <span className="mr-2">{t('devicesAssigned')}: {event.devices_assigned.join(', ')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-t3">
                    {t('provisioningSteps')}: {event.completed_steps}/{event.total_steps}
                  </div>
                  <Badge variant={
                    event.status === 'completed' ? 'success' :
                    event.status === 'in_progress' ? 'info' : 'warning'
                  }>
                    {event.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
      </>)}

      {/* ── Store Tab ── */}
      {activeTab === 'store' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deviceStoreCatalog.map((item: any) => (
              <Card key={item.id}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{item.name}</h3>
                    <p className="text-xs text-t3">{item.brand}</p>
                  </div>
                  <Badge>{item.category}</Badge>
                </div>
                <div className="text-2xl font-bold text-t1 mb-3">
                  {formatCurrency(item.price / 100, item.currency || defaultCurrency)}
                  <span className="text-xs font-normal text-t3 ml-1">{item.currency || defaultCurrency}</span>
                </div>
                {item.specs && (
                  <div className="space-y-1.5 mb-4">
                    {Object.entries(item.specs).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex items-center justify-between text-xs">
                        <span className="text-t3 capitalize">{key.replace(/_/g, ' ')}</span>
                        <span className="text-t1 font-medium">{Array.isArray(value) ? value.join(', ') : String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-divider">
                  <div className="flex items-center gap-1.5">
                    <Package size={14} className="text-t3" />
                    <span className="text-xs text-t2">{item.in_stock} in stock</span>
                  </div>
                  <Button size="sm" disabled={item.in_stock === 0}>
                    <Store size={12} /> Order
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          {deviceStoreCatalog.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Store size={32} className="mx-auto mb-2 text-t3" />
                <p className="text-sm text-t3">No items in the device store catalog.</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Orders Tab ── */}
      {activeTab === 'orders' && (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Device Orders</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Employee</th>
                  <th className="tempo-th text-left px-4 py-3">Device</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-left px-4 py-3">Ordered</th>
                  <th className="tempo-th text-left px-4 py-3">Shipped</th>
                  <th className="tempo-th text-left px-4 py-3">Delivered</th>
                  <th className="tempo-th text-left px-4 py-3">Tracking #</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {deviceOrders.map((order: any) => {
                  const catalogItem = deviceStoreCatalog.find((c: any) => c.id === order.catalog_item_id)
                  return (
                    <tr key={order.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t1 font-medium">{getEmployeeName(order.employee_id)}</td>
                      <td className="px-4 py-3 text-xs text-t2">{catalogItem?.name || order.catalog_item_id}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          order.status === 'delivered' ? 'success' :
                          order.status === 'shipped' ? 'info' : 'default'
                        }>
                          {order.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t3">{order.ordered_at ? new Date(order.ordered_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-xs text-t3">{order.shipped_at ? new Date(order.shipped_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-xs text-t3">{order.delivered_at ? new Date(order.delivered_at).toLocaleDateString() : '-'}</td>
                      <td className="px-4 py-3 text-xs text-t3 font-mono">{order.tracking_number || '-'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {deviceOrders.length === 0 && (
              <div className="text-center py-8">
                <Truck size={32} className="mx-auto mb-2 text-t3" />
                <p className="text-sm text-t3">No device orders yet.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Buyback Tab ── */}
      {activeTab === 'buyback' && (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Buyback Requests</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Employee</th>
                  <th className="tempo-th text-left px-4 py-3">Device Name</th>
                  <th className="tempo-th text-center px-4 py-3">Condition</th>
                  <th className="tempo-th text-right px-4 py-3">Estimated Value</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-left px-4 py-3">Submitted</th>
                  <th className="tempo-th text-left px-4 py-3">Approved</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {buybackRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs text-t1 font-medium">{getEmployeeName(req.employee_id)}</td>
                    <td className="px-4 py-3 text-xs text-t2">{req.device_name}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        req.condition === 'good' ? 'success' :
                        req.condition === 'fair' ? 'warning' : 'error'
                      }>
                        {req.condition}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t1 font-medium text-right">{formatCurrency(req.estimated_value / 100, defaultCurrency)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        req.status === 'approved' ? 'success' :
                        req.status === 'pending' ? 'warning' : 'error'
                      }>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t3">{req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3 text-xs text-t3">{req.approved_at ? new Date(req.approved_at).toLocaleDateString() : '-'}</td>
                    <td className="px-4 py-3">
                      {req.status === 'pending' ? (
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="primary" onClick={() => addToast('Buyback request approved')}>
                            <CheckCircle size={12} /> Approve
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => addToast('Buyback request rejected')}>
                            <XCircle size={12} /> Reject
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-t3 flex justify-center">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {buybackRequests.length === 0 && (
              <div className="text-center py-8">
                <RotateCcw size={32} className="mx-auto mb-2 text-t3" />
                <p className="text-sm text-t3">No buyback requests yet.</p>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* ── Disposal Tab ── */}
      {activeTab === 'disposal' && (
        <div className="space-y-6">
          {/* ITAD Compliance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-success" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-t1">Certified Data Wiping</h3>
                  <p className="text-xs text-t3">NIST 800-88 compliant</p>
                </div>
              </div>
              <p className="text-xs text-t2">All devices undergo certified data sanitization using DoD 5220.22-M standard before disposal. Verification reports are generated for each device.</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <span className="text-xs text-t3">Last audit: Jan 2026</span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
                  <FileWarning size={20} className="text-info" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-t1">Certificate of Destruction</h3>
                  <p className="text-xs text-t3">R2 / e-Stewards certified</p>
                </div>
              </div>
              <p className="text-xs text-t2">Physical destruction certificates issued for all storage media. Chain of custody documentation maintained throughout the disposal process.</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success">Active</Badge>
                <span className="text-xs text-t3">Partner: SecureDisposal Inc.</span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <Leaf size={20} className="text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-t1">Environmental Compliance</h3>
                  <p className="text-xs text-t3">EPA / WEEE directive</p>
                </div>
              </div>
              <p className="text-xs text-t2">All e-waste processed through EPA-approved facilities. Zero-landfill policy with 95%+ material recovery rate for recycled components.</p>
              <div className="mt-3 flex items-center gap-2">
                <Badge variant="success">Compliant</Badge>
                <span className="text-xs text-t3">Recovery rate: 97%</span>
              </div>
            </Card>
          </div>

          {/* Disposed Devices Table */}
          <Card padding="none">
            <CardHeader>
              <CardTitle>Disposed Devices</CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Device</th>
                    <th className="tempo-th text-left px-4 py-3">Serial Number</th>
                    <th className="tempo-th text-center px-4 py-3">Method</th>
                    <th className="tempo-th text-left px-4 py-3">Disposed Date</th>
                    <th className="tempo-th text-left px-4 py-3">Certificate #</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { id: 'disp-1', device: 'Dell Latitude 5520', serial: 'DL-2021-4892', method: 'Data Wipe + Recycle', date: '2026-01-15', certificate: 'COD-2026-0042', status: 'completed' },
                    { id: 'disp-2', device: 'iPhone 12 Pro', serial: 'AP-2020-7731', method: 'Physical Destruction', date: '2026-01-22', certificate: 'COD-2026-0051', status: 'completed' },
                    { id: 'disp-3', device: 'ThinkPad X1 Carbon Gen 9', serial: 'LN-2021-3345', method: 'Data Wipe + Donate', date: '2026-02-05', certificate: 'COD-2026-0063', status: 'completed' },
                    { id: 'disp-4', device: 'Samsung Galaxy S21', serial: 'SM-2021-9012', method: 'Physical Destruction', date: '2026-02-18', certificate: 'COD-2026-0078', status: 'completed' },
                    { id: 'disp-5', device: 'HP EliteBook 840 G7', serial: 'HP-2020-5567', method: 'Data Wipe + Recycle', date: '2026-02-25', certificate: 'pending', status: 'in_progress' },
                  ].map(item => (
                    <tr key={item.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t1 font-medium">{item.device}</td>
                      <td className="px-4 py-3 text-xs text-t3 font-mono">{item.serial}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="default">{item.method}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t3">{item.date}</td>
                      <td className="px-4 py-3 text-xs text-t3 font-mono">{item.certificate === 'pending' ? '-' : item.certificate}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={item.status === 'completed' ? 'success' : 'warning'}>
                          {item.status === 'completed' ? 'Completed' : 'In Progress'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Add Device Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('addDeviceModal')}>
        <div className="space-y-4">
          <Select
            label={t('deviceType')}
            value={deviceForm.type}
            onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
            options={[
              { value: 'laptop', label: t('typeLaptop') },
              { value: 'phone', label: t('typeSmartphone') },
              { value: 'monitor', label: t('typeMonitor') },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('brand')} placeholder={t('brandPlaceholder')} value={deviceForm.brand} onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })} />
            <Input label={t('model')} placeholder={t('modelPlaceholder')} value={deviceForm.model} onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })} />
          </div>
          <Input label={t('serialNumber')} placeholder={t('serialPlaceholder')} value={deviceForm.serial_number} onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('purchaseDate')} type="date" value={deviceForm.purchase_date} onChange={(e) => setDeviceForm({ ...deviceForm, purchase_date: e.target.value })} />
            <Input label={t('warrantyEnd')} type="date" value={deviceForm.warranty_end} onChange={(e) => setDeviceForm({ ...deviceForm, warranty_end: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDevice}>{t('addDevice')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title={t('assignDeviceModal')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-t2">{t('assignDeviceDesc')}</p>
          <Select
            label={tc('employee')}
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAssign}>{tc('assign')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal open={showBulkAssignModal} onClose={resetBulkAssign} title={t('bulkAssignTitle')} size="xl">
        <p className="text-xs text-t3 mb-4">{t('bulkAssignDesc')}</p>
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkStep === 1 ? 'bg-tempo-500 text-white' : 'bg-success/20 text-success'}`}>
              {bulkStep > 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs font-medium ${bulkStep === 1 ? 'text-t1' : 'text-success'}`}>{t('stepDevices')}</span>
          </div>
          <div className="flex-1 h-px bg-divider" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkStep === 2 ? 'bg-tempo-500 text-white' : 'bg-canvas text-t3'}`}>2</div>
            <span className={`text-xs font-medium ${bulkStep === 2 ? 'text-t1' : 'text-t3'}`}>{t('stepEmployees')}</span>
          </div>
        </div>

        {bulkStep === 1 && (
          <>
            {/* Mode toggle */}
            <div className="flex gap-2 mb-4">
              {(['individual', 'type', 'all'] as const).map(mode => (
                <button key={mode} onClick={() => setDeviceSelectMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${deviceSelectMode === mode ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                  {mode === 'individual' && <><Search size={12} className="inline mr-1" />{t('selectModeIndividual')}</>}
                  {mode === 'type' && <><Laptop size={12} className="inline mr-1" />{t('selectModeType')}</>}
                  {mode === 'all' && <><CheckCircle size={12} className="inline mr-1" />{t('selectModeStatus')}</>}
                </button>
              ))}
            </div>

            {deviceSelectMode === 'individual' && (
              <>
                <Input placeholder={t('searchDevicesPlaceholder')} value={deviceSearch} onChange={e => setDeviceSearch(e.target.value)} />
                <div className="mt-2 flex items-center gap-2 px-2 py-1.5 border-b border-divider">
                  <input type="checkbox" className="rounded border-border"
                    checked={bulkTargetDevices.length > 0 && bulkTargetDevices.every(d => selectedDeviceIds.has(d.id))}
                    onChange={() => {
                      if (bulkTargetDevices.every(d => selectedDeviceIds.has(d.id))) setSelectedDeviceIds(new Set())
                      else setSelectedDeviceIds(new Set(bulkTargetDevices.map(d => d.id)))
                    }} />
                  <span className="text-xs text-t2 font-medium">{t('selectAllDevices')} ({bulkTargetDevices.length})</span>
                </div>
                <div className="max-h-[240px] overflow-y-auto divide-y divide-divider">
                  {bulkTargetDevices.map(device => (
                    <label key={device.id} className="flex items-center gap-3 px-2 py-2.5 hover:bg-canvas cursor-pointer">
                      <input type="checkbox" className="rounded border-border"
                        checked={selectedDeviceIds.has(device.id)}
                        onChange={() => toggleSet(selectedDeviceIds, setSelectedDeviceIds, device.id)} />
                      <div className="w-7 h-7 rounded bg-canvas flex items-center justify-center text-t3">
                        {iconMap[device.type] || <Laptop size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-t1">{device.brand} {device.model}</p>
                        <p className="text-[0.65rem] text-t3 font-mono">{device.serial_number}</p>
                      </div>
                      <Badge>{device.type}</Badge>
                    </label>
                  ))}
                  {bulkTargetDevices.length === 0 && <p className="p-4 text-xs text-t3 text-center">{t('noDevicesMatch')}</p>}
                </div>
              </>
            )}

            {deviceSelectMode === 'type' && (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {deviceTypes.map(type => {
                    const count = availableDevices.filter(d => d.type === type).length
                    return (
                      <button key={type} onClick={() => toggleSet(selectedDeviceTypes, setSelectedDeviceTypes, type)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedDeviceTypes.has(type) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                        {iconMap[type] && <span className="inline mr-1">{iconMap[type]}</span>}
                        {type} ({count})
                      </button>
                    )
                  })}
                </div>
                {selectedDeviceTypes.size > 0 && (
                  <div className="max-h-[200px] overflow-y-auto divide-y divide-divider border border-border rounded-lg">
                    {bulkTargetDevices.slice(0, 8).map(device => (
                      <div key={device.id} className="flex items-center gap-3 px-3 py-2">
                        <div className="w-6 h-6 rounded bg-canvas flex items-center justify-center text-t3">{iconMap[device.type] || <Laptop size={12} />}</div>
                        <span className="text-xs text-t1 font-medium">{device.brand} {device.model}</span>
                        <span className="text-[0.65rem] text-t3 ml-auto font-mono">{device.serial_number}</span>
                      </div>
                    ))}
                    {bulkTargetDevices.length > 8 && <p className="px-3 py-2 text-xs text-t3">+{bulkTargetDevices.length - 8} more</p>}
                  </div>
                )}
              </div>
            )}

            {deviceSelectMode === 'all' && (
              <div className="border border-border rounded-lg p-6 text-center">
                <Laptop size={32} className="mx-auto mb-2 text-tempo-500" />
                <h3 className="text-sm font-semibold text-t1">{t('allAvailableSelected')}</h3>
                <p className="text-xs text-t3 mt-1">{t('allAvailableDesc', { count: availableDevices.length })}</p>
              </div>
            )}
          </>
        )}

        {bulkStep === 2 && (
          <>
            {/* Employee selection modes */}
            <div className="flex gap-2 mb-4">
              {(['individual', 'department', 'country'] as const).map(mode => (
                <button key={mode} onClick={() => setEmpAssignMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${empAssignMode === mode ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                  {mode === 'individual' && <><Users size={12} className="inline mr-1" />{t('assignModeIndividual')}</>}
                  {mode === 'department' && <><Building2 size={12} className="inline mr-1" />{t('assignModeDepartment')}</>}
                  {mode === 'country' && <><Globe size={12} className="inline mr-1" />{t('assignModeCountry')}</>}
                </button>
              ))}
            </div>

            {empAssignMode === 'individual' && (
              <>
                <Input placeholder={t('searchEmployeesPlaceholder')} value={empSearch} onChange={e => setEmpSearch(e.target.value)} />
                <div className="mt-2 max-h-[180px] overflow-y-auto divide-y divide-divider">
                  {bulkTargetEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 px-2 py-2 hover:bg-canvas cursor-pointer">
                      <input type="checkbox" className="rounded border-border"
                        checked={selectedEmpIds.has(emp.id)}
                        onChange={() => toggleSet(selectedEmpIds, setSelectedEmpIds, emp.id)} />
                      <Avatar name={emp.profile?.full_name || ''} size="xs" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-t1">{emp.profile?.full_name}</p>
                        <p className="text-[0.65rem] text-t3">{emp.job_title}</p>
                      </div>
                      <span className="text-[0.65rem] text-t3">{emp.country}</span>
                    </label>
                  ))}
                </div>
              </>
            )}

            {empAssignMode === 'department' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {departments.map(dept => {
                  const count = employees.filter(e => e.department_id === dept.id).length
                  return (
                    <button key={dept.id} onClick={() => toggleSet(selectedDepts, setSelectedDepts, dept.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedDepts.has(dept.id) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {dept.name} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {empAssignMode === 'country' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {uniqueCountries.map(country => {
                  const count = employees.filter(e => e.country === country).length
                  return (
                    <button key={country} onClick={() => toggleSet(selectedCountries, setSelectedCountries, country)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${selectedCountries.has(country) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {country} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {(empAssignMode !== 'individual' && bulkSelectedEmployees.length > 0) && (
              <div className="max-h-[120px] overflow-y-auto divide-y divide-divider border border-border rounded-lg mt-2">
                {bulkSelectedEmployees.slice(0, 6).map(emp => (
                  <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar name={emp.profile?.full_name || ''} size="xs" />
                    <span className="text-xs text-t1">{emp.profile?.full_name}</span>
                    <span className="text-[0.65rem] text-t3 ml-auto">{getDepartmentName(emp.department_id)}</span>
                  </div>
                ))}
                {bulkSelectedEmployees.length > 6 && <p className="px-3 py-1.5 text-xs text-t3">+{bulkSelectedEmployees.length - 6} more</p>}
              </div>
            )}

            {/* Assignment Summary */}
            {bulkSelectedEmployees.length > 0 && (
              <div className="mt-4 border border-border rounded-lg p-4">
                <h4 className="text-xs font-semibold text-t1 mb-3">{t('assignmentSummary')}</h4>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-lg font-bold text-t1">{bulkSelectedDevices.length}</p>
                    <p className="text-[0.65rem] text-t3">{t('devicesToAssign')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-success">{assignableCount}</p>
                    <p className="text-[0.65rem] text-t3">{t('employeesToReceive')}</p>
                  </div>
                  <div>
                    <p className="text-lg font-bold text-warning">{alreadyHaveDeviceIds.size}</p>
                    <p className="text-[0.65rem] text-t3">{t('alreadyHaveDevice')}</p>
                  </div>
                </div>
                {alreadyHaveDeviceIds.size > 0 && (
                  <div className="mt-3 p-2 bg-warning/5 rounded-lg">
                    <p className="text-[0.65rem] text-warning mb-1">{t('willBeSkippedDevice')}</p>
                    {bulkSelectedEmployees.filter(e => alreadyHaveDeviceIds.has(e.id)).map(emp => (
                      <span key={emp.id} className="inline-block text-xs text-warning font-medium mr-2">{emp.profile?.full_name}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider">
          <p className="text-xs text-t3">
            {bulkStep === 1 ? t('devicesSelected', { count: bulkSelectedDevices.length }) : t('selectEmployeesFirst')}
          </p>
          <div className="flex gap-2">
            {bulkStep === 2 && <Button variant="secondary" size="sm" onClick={() => setBulkStep(1)}>{tc('back')}</Button>}
            <Button variant="secondary" size="sm" onClick={resetBulkAssign}>{tc('cancel')}</Button>
            {bulkStep === 1 && (
              <Button size="sm" disabled={bulkSelectedDevices.length === 0} onClick={() => setBulkStep(2)}>
                {t('nextSelectEmployees')} →
              </Button>
            )}
            {bulkStep === 2 && (
              <Button size="sm" disabled={assignableCount === 0} onClick={submitBulkAssign}>
                {t('assignDevicesCount', { count: assignableCount })}
              </Button>
            )}
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
                {confirmAction?.type === 'unassign' && `Unassign ${confirmAction?.label}?`}
                {confirmAction?.type === 'maintenance' && `Send ${confirmAction?.label} to maintenance?`}
              </p>
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'unassign' && 'The device will be unassigned from the current employee and marked as available.'}
                {confirmAction?.type === 'maintenance' && 'The device will be taken offline and marked for maintenance.'}
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
