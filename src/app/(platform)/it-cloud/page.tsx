'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { TempoDonutChart, TempoBarChart, CHART_COLORS } from '@/components/ui/charts'
import {
  Monitor, Laptop, Smartphone, Tablet, Shield, ShieldCheck, AppWindow,
  Lock, Trash2, RotateCcw, Download, Plus, Search, Settings,
  CheckCircle, XCircle, Clock, AlertTriangle, Package, Warehouse, Truck,
  KeyRound, Users, Globe, ToggleLeft, ToggleRight,
  HardDrive, Server, Cpu, Box,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo } from '@/lib/store'

// ─── Helper ──────────────────────────────────────────────────────────────────
function timeAgo(dateStr: string | null) {
  if (!dateStr) return 'Never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function platformIcon(platform: string) {
  switch (platform) {
    case 'macos': case 'ios': return <Laptop size={14} className="text-gray-400" />
    case 'windows': return <Monitor size={14} className="text-blue-400" />
    case 'android': return <Smartphone size={14} className="text-green-400" />
    case 'linux': return <Server size={14} className="text-orange-400" />
    default: return <HardDrive size={14} className="text-gray-400" />
  }
}

function deviceTypeIcon(type: string) {
  switch (type) {
    case 'laptop': return <Laptop size={16} />
    case 'desktop': return <Monitor size={16} />
    case 'tablet': return <Tablet size={16} />
    case 'phone': return <Smartphone size={16} />
    default: return <HardDrive size={16} />
  }
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function ITCloudPage() {
  const {
    managedDevices, deviceActions, appCatalog, appAssignments,
    securityPoliciesIT, deviceInventory, employees,
    addManagedDevice, updateManagedDevice,
    addDeviceAction, updateDeviceAction,
    addAppCatalogItem, updateAppCatalogItem,
    addAppAssignment, deleteAppAssignment,
    addSecurityPolicyIT, updateSecurityPolicyIT, deleteSecurityPolicyIT,
    addDeviceInventoryItem, updateDeviceInventoryItem,
    getEmployeeName, addToast,
  } = useTempo()

  // ---- Tab State ----
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Monitor },
    { id: 'devices', label: 'Device Management', icon: Laptop },
    { id: 'apps', label: 'App Management', icon: AppWindow },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'inventory', label: 'Inventory', icon: Package },
    { id: 'identity', label: 'Identity & Access', icon: KeyRound },
  ]
  const [activeTab, setActiveTab] = useState('dashboard')

  // ---- Search/Filter ----
  const [searchQuery, setSearchQuery] = useState('')
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterCompliance, setFilterCompliance] = useState('')

  // ---- Modals ----
  const [showDeviceDetail, setShowDeviceDetail] = useState<string | null>(null)
  const [showDeviceActionModal, setShowDeviceActionModal] = useState(false)
  const [actionDeviceId, setActionDeviceId] = useState<string | null>(null)
  const [actionType, setActionType] = useState('lock')
  const [actionNotes, setActionNotes] = useState('')

  const [showAddAppModal, setShowAddAppModal] = useState(false)
  const [appForm, setAppForm] = useState({ name: '', vendor: '', category: 'productivity', platform: 'cross-platform', version: '', licenseType: 'per_seat', licenseCost: 0, licenseCount: 0, isRequired: false, autoInstall: false })

  const [showAssignAppModal, setShowAssignAppModal] = useState(false)
  const [assignAppId, setAssignAppId] = useState<string | null>(null)
  const [assignEmployeeIds, setAssignEmployeeIds] = useState<Set<string>>(new Set())

  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editPolicyId, setEditPolicyId] = useState<string | null>(null)
  const [policyForm, setPolicyForm] = useState({ name: '', type: 'password', appliesTo: 'all', isActive: true, settings: {} as Record<string, unknown> })

  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [invForm, setInvForm] = useState({ name: '', type: 'laptop', platform: 'windows', serialNumber: '', status: 'in_warehouse', condition: 'new', purchaseDate: '', purchaseCost: 0, warrantyExpiry: '', warehouseLocation: '', notes: '' })

  // ---- Computed Stats ----
  const activeDevices = managedDevices.filter(d => d.status === 'active')
  const compliantDevices = managedDevices.filter(d => d.isCompliant)
  const encryptedDevices = managedDevices.filter(d => d.isEncrypted)
  const compliantPct = managedDevices.length > 0 ? Math.round((compliantDevices.length / managedDevices.length) * 100) : 0
  const totalApps = appCatalog.length
  const totalMonthlyCost = appCatalog.reduce((a, app) => a + (app.licenseCost * app.assignedCount), 0)

  // Security score: composite of encryption, compliance, MDM installed, policies active
  const securityScore = useMemo(() => {
    if (managedDevices.length === 0) return 0
    const encPct = encryptedDevices.length / managedDevices.length
    const compPct = compliantDevices.length / managedDevices.length
    const mdmPct = managedDevices.filter(d => d.mdmProfileInstalled).length / managedDevices.length
    const activePolicies = securityPoliciesIT.filter(p => p.isActive).length
    const policyScore = Math.min(activePolicies / 4, 1)
    return Math.round(((encPct + compPct + mdmPct + policyScore) / 4) * 100)
  }, [managedDevices, encryptedDevices, compliantDevices, securityPoliciesIT])

  // OS distribution
  const osDistribution = useMemo(() => {
    const map: Record<string, number> = {}
    managedDevices.forEach(d => { map[d.platform] = (map[d.platform] || 0) + 1 })
    return Object.entries(map).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }))
  }, [managedDevices])

  // Device health
  const deviceHealth = useMemo(() => [
    { name: 'Compliant', value: compliantDevices.length },
    { name: 'Non-Compliant', value: managedDevices.filter(d => !d.isCompliant && d.status === 'active').length },
    { name: 'Inactive', value: managedDevices.filter(d => d.status !== 'active').length },
  ], [managedDevices, compliantDevices])

  // Recent actions
  const recentActions = useMemo(() =>
    [...deviceActions].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 8)
  , [deviceActions])

  // Alerts
  const alerts = useMemo(() => {
    const list: { type: string; message: string; severity: 'warning' | 'error' | 'info' }[] = []
    const nonEncrypted = managedDevices.filter(d => !d.isEncrypted && d.status === 'active')
    if (nonEncrypted.length > 0) list.push({ type: 'encryption', message: `${nonEncrypted.length} device(s) without encryption`, severity: 'error' })
    const nonCompliant = managedDevices.filter(d => !d.isCompliant && d.status === 'active')
    if (nonCompliant.length > 0) list.push({ type: 'compliance', message: `${nonCompliant.length} device(s) non-compliant`, severity: 'warning' })
    const staleDevices = managedDevices.filter(d => {
      if (!d.lastSeen || d.status !== 'active') return false
      return (Date.now() - new Date(d.lastSeen).getTime()) > 7 * 24 * 60 * 60 * 1000
    })
    if (staleDevices.length > 0) list.push({ type: 'checkin', message: `${staleDevices.length} device(s) not seen in 7+ days`, severity: 'warning' })
    const pendingSetup = managedDevices.filter(d => d.status === 'pending_setup')
    if (pendingSetup.length > 0) list.push({ type: 'setup', message: `${pendingSetup.length} device(s) pending setup`, severity: 'info' })
    return list
  }, [managedDevices])

  // Filtered devices
  const filteredDevices = useMemo(() => {
    let list = [...managedDevices]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(d =>
        d.name.toLowerCase().includes(q) ||
        d.model?.toLowerCase().includes(q) ||
        d.serialNumber?.toLowerCase().includes(q) ||
        (d.employee_id && getEmployeeName(d.employee_id).toLowerCase().includes(q))
      )
    }
    if (filterPlatform) list = list.filter(d => d.platform === filterPlatform)
    if (filterStatus) list = list.filter(d => d.status === filterStatus)
    if (filterCompliance === 'compliant') list = list.filter(d => d.isCompliant)
    if (filterCompliance === 'non-compliant') list = list.filter(d => !d.isCompliant)
    return list
  }, [managedDevices, searchQuery, filterPlatform, filterStatus, filterCompliance, getEmployeeName])

  // Inventory stats
  const inventoryStats = useMemo(() => {
    const inWarehouse = deviceInventory.filter(i => i.status === 'in_warehouse').length
    const assigned = deviceInventory.filter(i => i.status === 'assigned').length
    const inTransit = deviceInventory.filter(i => i.status === 'in_transit').length
    const totalValue = deviceInventory.reduce((a, i) => a + (i.purchaseCost || 0), 0)
    return { inWarehouse, assigned, inTransit, totalValue }
  }, [deviceInventory])

  // App categories for filter
  const appCategories = useMemo(() => [...new Set(appCatalog.map(a => a.category))].sort(), [appCatalog])
  const [filterAppCategory, setFilterAppCategory] = useState('')
  const filteredApps = useMemo(() => {
    let list = [...appCatalog]
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      list = list.filter(a => a.name.toLowerCase().includes(q) || a.vendor?.toLowerCase().includes(q))
    }
    if (filterAppCategory) list = list.filter(a => a.category === filterAppCategory)
    return list
  }, [appCatalog, searchQuery, filterAppCategory])

  // ---- Action Handlers ----
  function executeDeviceAction() {
    if (!actionDeviceId) return
    addDeviceAction({
      deviceId: actionDeviceId,
      actionType,
      status: 'pending',
      initiatedBy: 'emp-1',
      notes: actionNotes || `${actionType} initiated from IT Cloud`,
      completedAt: null,
    })
    setShowDeviceActionModal(false)
    setActionNotes('')
  }

  function submitApp() {
    if (!appForm.name) return
    addAppCatalogItem({
      ...appForm,
      licenseCost: Number(appForm.licenseCost),
      licenseCount: Number(appForm.licenseCount),
      assignedCount: 0,
      icon: 'AppWindow',
    })
    setShowAddAppModal(false)
    setAppForm({ name: '', vendor: '', category: 'productivity', platform: 'cross-platform', version: '', licenseType: 'per_seat', licenseCost: 0, licenseCount: 0, isRequired: false, autoInstall: false })
  }

  function submitAssignApp() {
    if (!assignAppId || assignEmployeeIds.size === 0) return
    assignEmployeeIds.forEach(empId => {
      addAppAssignment({ appId: assignAppId, employeeId: empId, status: 'assigned', installedAt: null })
    })
    addToast(`App assigned to ${assignEmployeeIds.size} employee(s)`)
    setShowAssignAppModal(false)
    setAssignEmployeeIds(new Set())
  }

  function submitPolicy() {
    if (!policyForm.name) return
    if (editPolicyId) {
      updateSecurityPolicyIT(editPolicyId, policyForm)
    } else {
      addSecurityPolicyIT(policyForm)
    }
    setShowPolicyModal(false)
    setEditPolicyId(null)
    setPolicyForm({ name: '', type: 'password', appliesTo: 'all', isActive: true, settings: {} })
  }

  function submitInventoryItem() {
    if (!invForm.name) return
    addDeviceInventoryItem({
      ...invForm,
      purchaseCost: Number(invForm.purchaseCost),
      assignedTo: null,
    })
    setShowInventoryModal(false)
    setInvForm({ name: '', type: 'laptop', platform: 'windows', serialNumber: '', status: 'in_warehouse', condition: 'new', purchaseDate: '', purchaseCost: 0, warrantyExpiry: '', warehouseLocation: '', notes: '' })
  }

  // Selected device for detail
  const selectedDevice = managedDevices.find(d => d.id === showDeviceDetail)
  const selectedDeviceActions = deviceActions.filter(a => a.deviceId === showDeviceDetail)
  const selectedDeviceApps = appAssignments
    .filter(a => {
      if (!selectedDevice?.employee_id) return false
      return a.employeeId === selectedDevice.employee_id
    })
    .map(a => ({ ...a, app: appCatalog.find(ap => ap.id === a.appId) }))

  // Identity tab data
  const ssoApps = appCatalog.filter(a => a.isRequired)
  const employeeAppAccess = useMemo(() => {
    return employees.slice(0, 20).map(emp => {
      const assignments = appAssignments.filter(a => a.employeeId === emp.id)
      return { ...emp, appCount: assignments.length, apps: assignments.map(a => appCatalog.find(ap => ap.id === a.appId)?.name).filter(Boolean) }
    })
  }, [employees, appAssignments, appCatalog])

  // ────────────────────────────── RENDER ──────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <Header title="IT Cloud" subtitle="Device management, application catalog, security policies and asset inventory" />

      {/* Tabs */}
      <div className="border-b border-white/10 px-6">
        <div className="flex gap-1 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setSearchQuery('') }}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-white text-white'
                    : 'border-transparent text-gray-400 hover:text-gray-200'
                )}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* ──────────────── DASHBOARD TAB ──────────────── */}
        {activeTab === 'dashboard' && (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Devices" value={managedDevices.length} icon={<Monitor size={20} />} change={`${activeDevices.length} active`} changeType="neutral" />
              <StatCard label="Compliant" value={`${compliantPct}%`} icon={<ShieldCheck size={20} />} change={`${compliantDevices.length} of ${managedDevices.length}`} changeType={compliantPct >= 80 ? 'positive' : 'negative'} />
              <StatCard label="Apps Managed" value={totalApps} icon={<AppWindow size={20} />} change={`$${totalMonthlyCost.toLocaleString()}/mo`} changeType="neutral" />
              <StatCard label="Security Score" value={`${securityScore}/100`} icon={<Shield size={20} />} change={securityScore >= 80 ? 'Good' : securityScore >= 60 ? 'Needs attention' : 'Critical'} changeType={securityScore >= 80 ? 'positive' : 'negative'} />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#111] border-white/10">
                <CardHeader><CardTitle className="text-white text-sm">Device Health Overview</CardTitle></CardHeader>
                <div className="p-4 pt-0">
                  <TempoDonutChart data={deviceHealth} colors={['#22c55e', '#ef4444', '#6b7280']} height={220} />
                </div>
              </Card>
              <Card className="bg-[#111] border-white/10">
                <CardHeader><CardTitle className="text-white text-sm">OS Distribution</CardTitle></CardHeader>
                <div className="p-4 pt-0">
                  <TempoBarChart data={osDistribution} bars={[{ dataKey: 'value', name: 'Devices', color: CHART_COLORS.primary }]} xKey="name" height={220} />
                </div>
              </Card>
            </div>

            {/* Recent Actions + Alerts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#111] border-white/10">
                <CardHeader><CardTitle className="text-white text-sm">Recent Device Actions</CardTitle></CardHeader>
                <div className="p-4 pt-0 space-y-2 max-h-80 overflow-y-auto">
                  {recentActions.length === 0 && <p className="text-sm text-gray-500">No recent actions</p>}
                  {recentActions.map(action => {
                    const device = managedDevices.find(d => d.id === action.deviceId)
                    return (
                      <div key={action.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                        <div className="flex items-center gap-3">
                          <div className={cn('w-2 h-2 rounded-full',
                            action.status === 'completed' ? 'bg-green-500' :
                            action.status === 'failed' ? 'bg-red-500' :
                            action.status === 'in_progress' ? 'bg-blue-500' : 'bg-yellow-500'
                          )} />
                          <div>
                            <p className="text-sm text-white">{action.actionType.replace(/_/g, ' ')} — {device?.name || 'Unknown'}</p>
                            <p className="text-xs text-gray-500">{action.notes?.slice(0, 60)}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant={action.status === 'completed' ? 'success' : action.status === 'failed' ? 'error' : 'info'} className="text-xs">
                            {action.status}
                          </Badge>
                          <p className="text-xs text-gray-500 mt-1">{timeAgo(action.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </Card>
              <Card className="bg-[#111] border-white/10">
                <CardHeader><CardTitle className="text-white text-sm">Alerts</CardTitle></CardHeader>
                <div className="p-4 pt-0 space-y-3">
                  {alerts.length === 0 && <p className="text-sm text-gray-500">No active alerts</p>}
                  {alerts.map((alert, i) => (
                    <div key={i} className={cn('flex items-start gap-3 p-3 rounded-lg border',
                      alert.severity === 'error' ? 'border-red-500/30 bg-red-500/5' :
                      alert.severity === 'warning' ? 'border-yellow-500/30 bg-yellow-500/5' :
                      'border-blue-500/30 bg-blue-500/5'
                    )}>
                      {alert.severity === 'error' ? <XCircle size={16} className="text-red-400 mt-0.5" /> :
                       alert.severity === 'warning' ? <AlertTriangle size={16} className="text-yellow-400 mt-0.5" /> :
                       <Clock size={16} className="text-blue-400 mt-0.5" />}
                      <p className="text-sm text-gray-300">{alert.message}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}

        {/* ──────────────── DEVICE MANAGEMENT TAB ──────────────── */}
        {activeTab === 'devices' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <Input placeholder="Search devices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
              </div>
              <Select value={filterPlatform} onChange={e => setFilterPlatform(e.target.value)} options={[
                { value: '', label: 'All Platforms' }, { value: 'macos', label: 'macOS' }, { value: 'windows', label: 'Windows' },
                { value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }, { value: 'linux', label: 'Linux' },
              ]} />
              <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} options={[
                { value: '', label: 'All Statuses' }, { value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' },
                { value: 'lost', label: 'Lost' }, { value: 'retired', label: 'Retired' }, { value: 'pending_setup', label: 'Pending Setup' },
              ]} />
              <Select value={filterCompliance} onChange={e => setFilterCompliance(e.target.value)} options={[
                { value: '', label: 'All Compliance' }, { value: 'compliant', label: 'Compliant' }, { value: 'non-compliant', label: 'Non-Compliant' },
              ]} />
            </div>

            {/* Device Table */}
            <Card className="bg-[#111] border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left p-3 font-medium">Device</th>
                      <th className="text-left p-3 font-medium">Employee</th>
                      <th className="text-left p-3 font-medium">Platform</th>
                      <th className="text-left p-3 font-medium">OS Version</th>
                      <th className="text-left p-3 font-medium">Last Seen</th>
                      <th className="text-left p-3 font-medium">Compliance</th>
                      <th className="text-left p-3 font-medium">Encrypted</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredDevices.map(device => (
                      <tr key={device.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => setShowDeviceDetail(device.id)}>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            {deviceTypeIcon(device.type)}
                            <div>
                              <p className="text-white font-medium">{device.name}</p>
                              <p className="text-xs text-gray-500">{device.manufacturer} {device.model}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {device.employee_id ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={getEmployeeName(device.employee_id)} size="xs" />
                              <span className="text-gray-300">{getEmployeeName(device.employee_id)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-500">Unassigned</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            {platformIcon(device.platform)}
                            <span className="text-gray-300 capitalize">{device.platform}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-300">{device.osVersion || '—'}</td>
                        <td className="p-3">
                          <span className={cn('text-xs', device.lastSeen && (Date.now() - new Date(device.lastSeen).getTime()) < 86400000 ? 'text-green-400' : 'text-yellow-400')}>
                            {timeAgo(device.lastSeen)}
                          </span>
                        </td>
                        <td className="p-3">
                          {device.isCompliant
                            ? <Badge variant="success" className="text-xs">Compliant</Badge>
                            : <Badge variant="error" className="text-xs">Non-Compliant</Badge>
                          }
                        </td>
                        <td className="p-3">
                          {device.isEncrypted
                            ? <CheckCircle size={16} className="text-green-400" />
                            : <XCircle size={16} className="text-red-400" />
                          }
                        </td>
                        <td className="p-3">
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            <button className="p-1 rounded hover:bg-white/10" title="Lock" onClick={() => { setActionDeviceId(device.id); setActionType('lock'); setShowDeviceActionModal(true) }}>
                              <Lock size={14} className="text-gray-400" />
                            </button>
                            <button className="p-1 rounded hover:bg-white/10" title="Restart" onClick={() => { setActionDeviceId(device.id); setActionType('restart'); setShowDeviceActionModal(true) }}>
                              <RotateCcw size={14} className="text-gray-400" />
                            </button>
                            <button className="p-1 rounded hover:bg-white/10" title="Push Update" onClick={() => { setActionDeviceId(device.id); setActionType('update_os'); setShowDeviceActionModal(true) }}>
                              <Download size={14} className="text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredDevices.length === 0 && (
                <p className="text-center text-gray-500 py-8 text-sm">No devices match your filters</p>
              )}
            </Card>

            {/* Device Detail Panel */}
            <Modal open={!!showDeviceDetail} onClose={() => setShowDeviceDetail(null)} title={selectedDevice?.name || 'Device Details'} size="lg">
              {selectedDevice && (
                <div className="space-y-6">
                  {/* Device Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500">Manufacturer</p>
                      <p className="text-sm text-white">{selectedDevice.manufacturer} {selectedDevice.model}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Serial Number</p>
                      <p className="text-sm text-white font-mono">{selectedDevice.serialNumber}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Platform</p>
                      <p className="text-sm text-white capitalize">{selectedDevice.platform} — {selectedDevice.osVersion}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Storage</p>
                      <p className="text-sm text-white">{selectedDevice.storageCapacityGb} GB</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Enrolled</p>
                      <p className="text-sm text-white">{new Date(selectedDevice.enrolledAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Last Seen</p>
                      <p className="text-sm text-white">{timeAgo(selectedDevice.lastSeen)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <Badge variant={selectedDevice.status === 'active' ? 'success' : 'info'}>{selectedDevice.status}</Badge>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">MDM Profile</p>
                      <p className="text-sm">{selectedDevice.mdmProfileInstalled ? <span className="text-green-400">Installed</span> : <span className="text-red-400">Not Installed</span>}</p>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Quick Actions</p>
                    <div className="flex flex-wrap gap-2">
                      {['lock', 'wipe', 'restart', 'update_os', 'install_app', 'push_config'].map(at => (
                        <Button key={at} variant="outline" size="sm" onClick={() => { setActionDeviceId(selectedDevice.id); setActionType(at); setShowDeviceActionModal(true); setShowDeviceDetail(null) }}>
                          {at === 'lock' && <Lock size={14} className="mr-1" />}
                          {at === 'wipe' && <Trash2 size={14} className="mr-1" />}
                          {at === 'restart' && <RotateCcw size={14} className="mr-1" />}
                          {at === 'update_os' && <Download size={14} className="mr-1" />}
                          {at === 'install_app' && <AppWindow size={14} className="mr-1" />}
                          {at === 'push_config' && <Settings size={14} className="mr-1" />}
                          {at.replace(/_/g, ' ')}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action History */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Action History</p>
                    {selectedDeviceActions.length === 0 ? (
                      <p className="text-sm text-gray-500">No actions recorded</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDeviceActions.map(action => (
                          <div key={action.id} className="flex items-center justify-between p-2 rounded bg-white/5">
                            <div>
                              <p className="text-sm text-white capitalize">{action.actionType.replace(/_/g, ' ')}</p>
                              <p className="text-xs text-gray-500">{action.notes?.slice(0, 80)}</p>
                            </div>
                            <Badge variant={action.status === 'completed' ? 'success' : action.status === 'failed' ? 'error' : 'info'} className="text-xs">{action.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Installed Apps */}
                  <div>
                    <p className="text-xs text-gray-500 mb-2">Installed Apps</p>
                    {selectedDeviceApps.length === 0 ? (
                      <p className="text-sm text-gray-500">No apps tracked for this user</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {selectedDeviceApps.map(a => (
                          <Badge key={a.id} variant="default" className="text-xs">{a.app?.name || a.appId}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Modal>
          </>
        )}

        {/* ──────────────── APP MANAGEMENT TAB ──────────────── */}
        {activeTab === 'apps' && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <Input placeholder="Search apps..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9" />
                </div>
                <Select value={filterAppCategory} onChange={e => setFilterAppCategory(e.target.value)} options={[
                  { value: '', label: 'All Categories' },
                  ...appCategories.map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) })),
                ]} />
              </div>
              <Button onClick={() => setShowAddAppModal(true)}><Plus size={16} className="mr-1" /> Add App</Button>
            </div>

            {/* App Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="Total Apps" value={totalApps} icon={<AppWindow size={20} />} change={`${appCatalog.filter(a => a.isRequired).length} required`} />
              <StatCard label="Monthly License Cost" value={`$${totalMonthlyCost.toLocaleString()}`} icon={<Cpu size={20} />} change={`${appCatalog.reduce((a, app) => a + app.assignedCount, 0)} seats assigned`} />
              <StatCard label="License Utilization" value={`${Math.round((appCatalog.reduce((a, c) => a + c.assignedCount, 0) / Math.max(appCatalog.reduce((a, c) => a + c.licenseCount, 0), 1)) * 100)}%`} icon={<Users size={20} />} change="Overall utilization" />
            </div>

            {/* App Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredApps.map(app => {
                const utilPct = app.licenseCount > 0 ? Math.round((app.assignedCount / app.licenseCount) * 100) : 0
                const monthlyCost = app.licenseCost * app.assignedCount
                return (
                  <Card key={app.id} className="bg-[#111] border-white/10 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center">
                          <AppWindow size={20} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{app.name}</p>
                          <p className="text-xs text-gray-500">{app.vendor} &middot; v{app.version}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {app.isRequired && <Badge variant="default" className="text-[10px]">Required</Badge>}
                        <Badge variant="default" className="text-[10px] capitalize">{app.category}</Badge>
                      </div>
                    </div>

                    <div className="space-y-2 mb-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">License Utilization</span>
                        <span className="text-gray-300">{app.assignedCount}/{app.licenseCount}</span>
                      </div>
                      <Progress value={utilPct} className="h-1.5" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Monthly Cost</p>
                        <p className="text-sm text-white font-medium">{app.licenseType === 'free' ? 'Free' : `$${monthlyCost.toLocaleString()}`}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button variant="outline" size="sm" onClick={() => { setAssignAppId(app.id); setShowAssignAppModal(true) }}>
                          <Users size={14} className="mr-1" /> Assign
                        </Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* ──────────────── SECURITY TAB ──────────────── */}
        {activeTab === 'security' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Security Policies</h3>
                <p className="text-sm text-gray-500">Manage endpoint security enforcement</p>
              </div>
              <Button onClick={() => { setEditPolicyId(null); setPolicyForm({ name: '', type: 'password', appliesTo: 'all', isActive: true, settings: {} }); setShowPolicyModal(true) }}>
                <Plus size={16} className="mr-1" /> Create Policy
              </Button>
            </div>

            {/* Security Score Card */}
            <Card className="bg-[#111] border-white/10 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Overall Security Score</p>
                  <p className="text-4xl font-bold text-white">{securityScore}<span className="text-lg text-gray-500">/100</span></p>
                </div>
                <div className="w-20 h-20 rounded-full border-4 flex items-center justify-center" style={{ borderColor: securityScore >= 80 ? '#22c55e' : securityScore >= 60 ? '#eab308' : '#ef4444' }}>
                  <ShieldCheck size={32} style={{ color: securityScore >= 80 ? '#22c55e' : securityScore >= 60 ? '#eab308' : '#ef4444' }} />
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{encryptedDevices.length}/{managedDevices.length}</p>
                  <p className="text-xs text-gray-500">Encrypted</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{compliantDevices.length}/{managedDevices.length}</p>
                  <p className="text-xs text-gray-500">Compliant</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{managedDevices.filter(d => d.mdmProfileInstalled).length}/{managedDevices.length}</p>
                  <p className="text-xs text-gray-500">MDM Installed</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{securityPoliciesIT.filter(p => p.isActive).length}/{securityPoliciesIT.length}</p>
                  <p className="text-xs text-gray-500">Policies Active</p>
                </div>
              </div>
            </Card>

            {/* Policies List */}
            <div className="space-y-3">
              {securityPoliciesIT.map(policy => {
                // Calculate compliance per-policy
                let policyCompliantCount = 0
                let policyTotalCount = managedDevices.filter(d => d.status === 'active').length
                if (policy.type === 'encryption') {
                  policyCompliantCount = managedDevices.filter(d => d.status === 'active' && d.isEncrypted).length
                } else if (policy.type === 'password' || policy.type === 'screensaver' || policy.type === 'firewall') {
                  policyCompliantCount = managedDevices.filter(d => d.status === 'active' && d.mdmProfileInstalled).length
                } else if (policy.type === 'os_update') {
                  policyCompliantCount = managedDevices.filter(d => d.status === 'active' && d.isCompliant).length
                } else {
                  policyCompliantCount = managedDevices.filter(d => d.status === 'active' && d.isCompliant).length
                }
                const policyPct = policyTotalCount > 0 ? Math.round((policyCompliantCount / policyTotalCount) * 100) : 0
                const nonCompliantDevices = managedDevices.filter(d => {
                  if (d.status !== 'active') return false
                  if (policy.type === 'encryption') return !d.isEncrypted
                  return !d.isCompliant
                })

                return (
                  <Card key={policy.id} className="bg-[#111] border-white/10 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', policy.isActive ? 'bg-green-500/10' : 'bg-gray-500/10')}>
                          <ShieldCheck size={20} className={policy.isActive ? 'text-green-400' : 'text-gray-500'} />
                        </div>
                        <div>
                          <p className="text-white font-medium">{policy.name}</p>
                          <p className="text-xs text-gray-500 capitalize">{policy.type.replace(/_/g, ' ')} &middot; Applies to {policy.appliesTo}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateSecurityPolicyIT(policy.id, { isActive: !policy.isActive })}
                          className="p-1 rounded hover:bg-white/10"
                          title={policy.isActive ? 'Disable' : 'Enable'}
                        >
                          {policy.isActive
                            ? <ToggleRight size={24} className="text-green-400" />
                            : <ToggleLeft size={24} className="text-gray-500" />
                          }
                        </button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          setEditPolicyId(policy.id)
                          setPolicyForm({ name: policy.name, type: policy.type, appliesTo: policy.appliesTo, isActive: policy.isActive, settings: (policy.settings || {}) as Record<string, unknown> })
                          setShowPolicyModal(true)
                        }}>
                          <Settings size={14} />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Compliance</span>
                        <span className={policyPct >= 90 ? 'text-green-400' : policyPct >= 70 ? 'text-yellow-400' : 'text-red-400'}>{policyPct}% ({policyCompliantCount}/{policyTotalCount})</span>
                      </div>
                      <Progress value={policyPct} className="h-1.5" />
                    </div>
                    {nonCompliantDevices.length > 0 && policy.isActive && (
                      <div className="mt-3 pt-3 border-t border-white/5">
                        <p className="text-xs text-gray-500 mb-2">Non-compliant devices:</p>
                        <div className="flex flex-wrap gap-1">
                          {nonCompliantDevices.slice(0, 5).map(d => (
                            <Badge key={d.id} variant="error" className="text-[10px] cursor-pointer" onClick={() => { setActiveTab('devices'); setShowDeviceDetail(d.id) }}>
                              {d.name}
                            </Badge>
                          ))}
                          {nonCompliantDevices.length > 5 && <Badge variant="info" className="text-[10px]">+{nonCompliantDevices.length - 5} more</Badge>}
                        </div>
                      </div>
                    )}
                  </Card>
                )
              })}
            </div>
          </>
        )}

        {/* ──────────────── INVENTORY TAB ──────────────── */}
        {activeTab === 'inventory' && (
          <>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-medium">Asset Inventory</h3>
                <p className="text-sm text-gray-500">Track device lifecycle from purchase to retirement</p>
              </div>
              <Button onClick={() => setShowInventoryModal(true)}><Plus size={16} className="mr-1" /> Add Asset</Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <StatCard label="In Warehouse" value={inventoryStats.inWarehouse} icon={<Warehouse size={20} />} change="Ready to deploy" />
              <StatCard label="Assigned" value={inventoryStats.assigned} icon={<Users size={20} />} change="In use" />
              <StatCard label="In Transit" value={inventoryStats.inTransit} icon={<Truck size={20} />} change="Shipping" />
              <StatCard label="Total Asset Value" value={`$${inventoryStats.totalValue.toLocaleString()}`} icon={<Box size={20} />} change={`${deviceInventory.length} items`} />
            </div>

            <Card className="bg-[#111] border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left p-3 font-medium">Asset</th>
                      <th className="text-left p-3 font-medium">Serial Number</th>
                      <th className="text-left p-3 font-medium">Status</th>
                      <th className="text-left p-3 font-medium">Condition</th>
                      <th className="text-left p-3 font-medium">Assigned To</th>
                      <th className="text-left p-3 font-medium">Purchase Date</th>
                      <th className="text-left p-3 font-medium">Cost</th>
                      <th className="text-left p-3 font-medium">Warranty</th>
                      <th className="text-left p-3 font-medium">Location</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deviceInventory.map(item => {
                      const warrantyExpired = item.warrantyExpiry && new Date(item.warrantyExpiry) < new Date()
                      return (
                        <tr key={item.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {deviceTypeIcon(item.type)}
                              <div>
                                <p className="text-white">{item.name}</p>
                                <p className="text-xs text-gray-500 capitalize">{item.platform}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 text-gray-300 font-mono text-xs">{item.serialNumber}</td>
                          <td className="p-3">
                            <Badge
                              variant={item.status === 'assigned' ? 'success' : item.status === 'in_warehouse' ? 'info' : item.status === 'in_transit' ? 'default' : 'error'}
                              className="text-xs capitalize"
                            >
                              {item.status === 'in_warehouse' ? 'In Warehouse' : item.status === 'in_transit' ? 'In Transit' : item.status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            <Badge variant={item.condition === 'new' ? 'success' : item.condition === 'good' ? 'info' : item.condition === 'fair' ? 'default' : 'error'} className="text-xs capitalize">
                              {item.condition}
                            </Badge>
                          </td>
                          <td className="p-3 text-gray-300">{item.assignedTo ? getEmployeeName(item.assignedTo) : '—'}</td>
                          <td className="p-3 text-gray-300">{item.purchaseDate || '—'}</td>
                          <td className="p-3 text-gray-300">{item.purchaseCost ? `$${item.purchaseCost.toLocaleString()}` : '—'}</td>
                          <td className="p-3">
                            {item.warrantyExpiry ? (
                              <span className={cn('text-xs', warrantyExpired ? 'text-red-400' : 'text-gray-300')}>
                                {item.warrantyExpiry} {warrantyExpired && '(expired)'}
                              </span>
                            ) : '—'}
                          </td>
                          <td className="p-3 text-gray-300 text-xs">{item.warehouseLocation || '—'}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}

        {/* ──────────────── IDENTITY & ACCESS TAB ──────────────── */}
        {activeTab === 'identity' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard label="SSO-Enabled Apps" value={ssoApps.length} icon={<KeyRound size={20} />} change="Required for all users" />
              <StatCard label="Provisioned Users" value={employees.length} icon={<Users size={20} />} change="Active employees" />
              <StatCard label="App Assignments" value={appAssignments.length} icon={<Globe size={20} />} change="Across all apps" />
            </div>

            {/* Auto-Provision Rules */}
            <Card className="bg-[#111] border-white/10 p-4">
              <CardHeader className="p-0 pb-4"><CardTitle className="text-white text-sm">Auto-Provisioning Rules</CardTitle></CardHeader>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center"><CheckCircle size={16} className="text-green-400" /></div>
                    <div>
                      <p className="text-sm text-white">On Hire — Auto-assign core apps</p>
                      <p className="text-xs text-gray-500">Slack, Zoom, 1Password, Chrome, Microsoft 365, CrowdStrike</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center"><CheckCircle size={16} className="text-green-400" /></div>
                    <div>
                      <p className="text-sm text-white">Engineering Dept — Dev tools</p>
                      <p className="text-xs text-gray-500">VS Code, GitHub Enterprise, Postman</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-green-500/10 flex items-center justify-center"><CheckCircle size={16} className="text-green-400" /></div>
                    <div>
                      <p className="text-sm text-white">Design Dept — Design tools</p>
                      <p className="text-xs text-gray-500">Figma</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-red-500/10 flex items-center justify-center"><XCircle size={16} className="text-red-400" /></div>
                    <div>
                      <p className="text-sm text-white">On Offboard — Revoke all access</p>
                      <p className="text-xs text-gray-500">Remove all app assignments, wipe device, disable accounts</p>
                    </div>
                  </div>
                  <Badge variant="success" className="text-xs">Active</Badge>
                </div>
              </div>
            </Card>

            {/* User Access Review */}
            <Card className="bg-[#111] border-white/10 overflow-hidden">
              <CardHeader><CardTitle className="text-white text-sm">User Access Review</CardTitle></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-gray-400">
                      <th className="text-left p-3 font-medium">Employee</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Apps Assigned</th>
                      <th className="text-left p-3 font-medium">Application Access</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employeeAppAccess.map(emp => (
                      <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Avatar name={emp.profile?.full_name || 'Unknown'} size="xs" />
                            <span className="text-gray-300">{emp.profile?.full_name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="p-3 text-gray-300 capitalize">{emp.job_title || '—'}</td>
                        <td className="p-3 text-gray-300">{emp.appCount}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {emp.apps.slice(0, 5).map((name, i) => (
                              <Badge key={i} variant="default" className="text-[10px]">{name}</Badge>
                            ))}
                            {emp.apps.length > 5 && <Badge variant="info" className="text-[10px]">+{emp.apps.length - 5}</Badge>}
                            {emp.apps.length === 0 && <span className="text-xs text-gray-500">None</span>}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </>
        )}
      </div>

      {/* ──────────────── MODALS ──────────────── */}

      {/* Device Action Modal */}
      <Modal open={showDeviceActionModal} onClose={() => setShowDeviceActionModal(false)} title="Execute Device Action">
        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Device</p>
            <p className="text-sm text-white">{managedDevices.find(d => d.id === actionDeviceId)?.name || '—'}</p>
          </div>
          <Select label="Action Type" value={actionType} onChange={e => setActionType(e.target.value)} options={[
            { value: 'lock', label: 'Lock Device' }, { value: 'wipe', label: 'Remote Wipe' }, { value: 'restart', label: 'Restart' },
            { value: 'update_os', label: 'Push OS Update' }, { value: 'install_app', label: 'Install App' },
            { value: 'remove_app', label: 'Remove App' }, { value: 'push_config', label: 'Push Config' },
          ]} />
          <Textarea label="Notes" value={actionNotes} onChange={e => setActionNotes(e.target.value)} placeholder="Reason for action..." />
          {actionType === 'wipe' && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/5">
              <p className="text-sm text-red-400 font-medium">Warning: Remote wipe will permanently erase all data on this device.</p>
            </div>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowDeviceActionModal(false)}>Cancel</Button>
            <Button variant={actionType === 'wipe' ? 'danger' : 'primary'} onClick={executeDeviceAction}>Execute {actionType.replace(/_/g, ' ')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add App Modal */}
      <Modal open={showAddAppModal} onClose={() => setShowAddAppModal(false)} title="Add App to Catalog">
        <div className="space-y-4">
          <Input label="App Name" value={appForm.name} onChange={e => setAppForm({ ...appForm, name: e.target.value })} placeholder="e.g. Slack" />
          <Input label="Vendor" value={appForm.vendor} onChange={e => setAppForm({ ...appForm, vendor: e.target.value })} placeholder="e.g. Salesforce" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Category" value={appForm.category} onChange={e => setAppForm({ ...appForm, category: e.target.value })} options={[
              { value: 'productivity', label: 'Productivity' }, { value: 'communication', label: 'Communication' },
              { value: 'security', label: 'Security' }, { value: 'development', label: 'Development' },
              { value: 'design', label: 'Design' }, { value: 'finance', label: 'Finance' },
              { value: 'hr', label: 'HR' }, { value: 'custom', label: 'Custom' },
            ]} />
            <Select label="License Type" value={appForm.licenseType} onChange={e => setAppForm({ ...appForm, licenseType: e.target.value })} options={[
              { value: 'free', label: 'Free' }, { value: 'per_seat', label: 'Per Seat' },
              { value: 'enterprise', label: 'Enterprise' }, { value: 'site', label: 'Site License' },
            ]} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Cost / Seat / Month" type="number" value={String(appForm.licenseCost)} onChange={e => setAppForm({ ...appForm, licenseCost: Number(e.target.value) })} />
            <Input label="Total Licenses" type="number" value={String(appForm.licenseCount)} onChange={e => setAppForm({ ...appForm, licenseCount: Number(e.target.value) })} />
          </div>
          <Input label="Version" value={appForm.version} onChange={e => setAppForm({ ...appForm, version: e.target.value })} placeholder="e.g. 1.0.0" />
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={appForm.isRequired} onChange={e => setAppForm({ ...appForm, isRequired: e.target.checked })} className="rounded" />
              Required for all users
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-300">
              <input type="checkbox" checked={appForm.autoInstall} onChange={e => setAppForm({ ...appForm, autoInstall: e.target.checked })} className="rounded" />
              Auto-install on enrollment
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddAppModal(false)}>Cancel</Button>
            <Button onClick={submitApp}>Add App</Button>
          </div>
        </div>
      </Modal>

      {/* Assign App Modal */}
      <Modal open={showAssignAppModal} onClose={() => { setShowAssignAppModal(false); setAssignEmployeeIds(new Set()) }} title={`Assign ${appCatalog.find(a => a.id === assignAppId)?.name || 'App'}`} size="lg">
        <div className="space-y-4">
          <p className="text-sm text-gray-400">Select employees to assign this app to:</p>
          <div className="max-h-[400px] overflow-y-auto space-y-1 border border-white/10 rounded-lg p-2">
            {employees.map(emp => {
              const alreadyAssigned = appAssignments.some(a => a.appId === assignAppId && a.employeeId === emp.id)
              return (
                <label key={emp.id} className={cn('flex items-center gap-3 p-2 rounded hover:bg-white/5 cursor-pointer', alreadyAssigned && 'opacity-50')}>
                  <input
                    type="checkbox"
                    disabled={alreadyAssigned}
                    checked={assignEmployeeIds.has(emp.id)}
                    onChange={() => {
                      const next = new Set(assignEmployeeIds)
                      next.has(emp.id) ? next.delete(emp.id) : next.add(emp.id)
                      setAssignEmployeeIds(next)
                    }}
                    className="rounded"
                  />
                  <Avatar name={emp.profile?.full_name || 'Unknown'} size="xs" />
                  <div>
                    <p className="text-sm text-white">{emp.profile?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-500">{emp.job_title}</p>
                  </div>
                  {alreadyAssigned && <Badge variant="info" className="text-[10px] ml-auto">Already assigned</Badge>}
                </label>
              )
            })}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-400">{assignEmployeeIds.size} selected</p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setShowAssignAppModal(false); setAssignEmployeeIds(new Set()) }}>Cancel</Button>
              <Button onClick={submitAssignApp} disabled={assignEmployeeIds.size === 0}>Assign to {assignEmployeeIds.size} Employee{assignEmployeeIds.size !== 1 ? 's' : ''}</Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Policy Modal */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={editPolicyId ? 'Edit Security Policy' : 'Create Security Policy'}>
        <div className="space-y-4">
          <Input label="Policy Name" value={policyForm.name} onChange={e => setPolicyForm({ ...policyForm, name: e.target.value })} placeholder="e.g. Password Complexity" />
          <Select label="Type" value={policyForm.type} onChange={e => setPolicyForm({ ...policyForm, type: e.target.value })} options={[
            { value: 'password', label: 'Password' }, { value: 'encryption', label: 'Encryption' },
            { value: 'firewall', label: 'Firewall' }, { value: 'screensaver', label: 'Screensaver / Lock' },
            { value: 'os_update', label: 'OS Update' }, { value: 'app_restriction', label: 'App Restriction' },
          ]} />
          <Select label="Applies To" value={policyForm.appliesTo} onChange={e => setPolicyForm({ ...policyForm, appliesTo: e.target.value })} options={[
            { value: 'all', label: 'All Devices' }, { value: 'department', label: 'Department' }, { value: 'role', label: 'Role' },
          ]} />
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={policyForm.isActive} onChange={e => setPolicyForm({ ...policyForm, isActive: e.target.checked })} className="rounded" />
            Policy Active
          </label>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPolicyModal(false)}>Cancel</Button>
            <Button onClick={submitPolicy}>{editPolicyId ? 'Update' : 'Create'} Policy</Button>
          </div>
        </div>
      </Modal>

      {/* Inventory Modal */}
      <Modal open={showInventoryModal} onClose={() => setShowInventoryModal(false)} title="Add Inventory Asset">
        <div className="space-y-4">
          <Input label="Device Name" value={invForm.name} onChange={e => setInvForm({ ...invForm, name: e.target.value })} placeholder="e.g. MacBook Pro 16" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Type" value={invForm.type} onChange={e => setInvForm({ ...invForm, type: e.target.value })} options={[
              { value: 'laptop', label: 'Laptop' }, { value: 'desktop', label: 'Desktop' },
              { value: 'tablet', label: 'Tablet' }, { value: 'phone', label: 'Phone' },
            ]} />
            <Select label="Platform" value={invForm.platform} onChange={e => setInvForm({ ...invForm, platform: e.target.value })} options={[
              { value: 'macos', label: 'macOS' }, { value: 'windows', label: 'Windows' },
              { value: 'ios', label: 'iOS' }, { value: 'android', label: 'Android' }, { value: 'linux', label: 'Linux' },
            ]} />
          </div>
          <Input label="Serial Number" value={invForm.serialNumber} onChange={e => setInvForm({ ...invForm, serialNumber: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Condition" value={invForm.condition} onChange={e => setInvForm({ ...invForm, condition: e.target.value })} options={[
              { value: 'new', label: 'New' }, { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' }, { value: 'poor', label: 'Poor' },
            ]} />
            <Input label="Purchase Cost ($)" type="number" value={String(invForm.purchaseCost)} onChange={e => setInvForm({ ...invForm, purchaseCost: Number(e.target.value) })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Purchase Date" type="date" value={invForm.purchaseDate} onChange={e => setInvForm({ ...invForm, purchaseDate: e.target.value })} />
            <Input label="Warranty Expiry" type="date" value={invForm.warrantyExpiry} onChange={e => setInvForm({ ...invForm, warrantyExpiry: e.target.value })} />
          </div>
          <Input label="Warehouse Location" value={invForm.warehouseLocation} onChange={e => setInvForm({ ...invForm, warehouseLocation: e.target.value })} placeholder="e.g. Lagos HQ - IT Store Room A" />
          <Textarea label="Notes" value={invForm.notes} onChange={e => setInvForm({ ...invForm, notes: e.target.value })} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowInventoryModal(false)}>Cancel</Button>
            <Button onClick={submitInventoryItem}>Add Asset</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
