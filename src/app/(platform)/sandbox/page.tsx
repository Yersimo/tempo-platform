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
import { FlaskConical, Copy, RefreshCw, Trash2, Play, Pause, Shield, Database, Clock, Plus, Settings, Calendar, AlertTriangle, ExternalLink, CheckCircle2, XCircle, Activity } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'

export default function SandboxPage() {
  const tc = useTranslations('common')
  const { sandboxEnvironments, employees, addSandboxEnvironment, updateSandboxEnvironment, deleteSandboxEnvironment, addToast, ensureModulesLoaded } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['sandboxEnvironments', 'employees'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [])

  const [showEnvDetailModal, setShowEnvDetailModal] = useState(false)
  const [detailEnv, setDetailEnv] = useState<any>(null)
  const [activeTab, setActiveTab] = useState<'environments' | 'configuration' | 'activity'>('environments')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    name: '',
    type: 'full_clone' as 'full_clone' | 'partial_clone' | 'empty',
    data_masking: true,
    expires_at: '',
  })

  // Configuration state
  const [cloneSettings, setCloneSettings] = useState({
    employees: true,
    payroll: true,
    benefits: true,
    time_tracking: true,
    documents: false,
    performance: true,
    recruiting: false,
    expenses: true,
  })
  const [retentionDays, setRetentionDays] = useState('30')

  // Computed stats
  const activeCount = sandboxEnvironments.filter(s => s.status === 'active').length
  const maskingCount = sandboxEnvironments.filter(s => s.data_masking).length
  const totalClones = sandboxEnvironments.filter(s => s.type !== 'empty').length

  const daysUntilNearestExpiry = useMemo(() => {
    const now = new Date()
    const activeEnvs = sandboxEnvironments.filter(s => s.status === 'active' && s.expires_at)
    if (activeEnvs.length === 0) return null
    const nearest = activeEnvs.reduce((min, s) => {
      const diff = Math.ceil((new Date(s.expires_at).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return diff < min ? diff : min
    }, Infinity)
    return nearest === Infinity ? null : nearest
  }, [sandboxEnvironments])

  function getEmployeeName(empId: string) {
    const emp = employees.find(e => e.id === empId)
    return emp?.profile?.full_name || tc('unknown')
  }

  function getDaysRemaining(expiresAt: string) {
    const now = new Date()
    const exp = new Date(expiresAt)
    return Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }

  function formatDate(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDateTime(dateStr: string) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function openCreateModal() {
    setCreateForm({
      name: '',
      type: 'full_clone',
      data_masking: true,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    })
    setShowCreateModal(true)
  }

  function submitCreate() {
    if (!createForm.name) return
    addSandboxEnvironment({
      name: createForm.name,
      type: createForm.type,
      data_masking: createForm.data_masking,
      expires_at: createForm.expires_at ? `${createForm.expires_at}T00:00:00Z` : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      source_org_id: 'org-1',
      created_by: employees[0]?.id || 'emp-1',
      last_refreshed_at: new Date().toISOString(),
    })
    setShowCreateModal(false)
  }

  function refreshEnvironment(id: string) {
    updateSandboxEnvironment(id, { last_refreshed_at: new Date().toISOString() })
  }

  function extendEnvironment(id: string) {
    const env = sandboxEnvironments.find(s => s.id === id)
    if (!env) return
    const current = new Date(env.expires_at)
    current.setDate(current.getDate() + 14)
    updateSandboxEnvironment(id, { expires_at: current.toISOString() })
  }

  function openEnvironment(env: any) {
    setDetailEnv(env)
    setShowEnvDetailModal(true)
  }

  function saveRetentionPolicy() {
    addToast(`Retention policy updated to ${retentionDays} days`, 'success')
  }

  // Static activity log data
  const activityLog = [
    { id: 'act-1', action: 'created', target: 'Staging - Q1 Config Test', user: 'emp-1', timestamp: '2026-02-01T09:15:00Z', details: 'Full clone with data masking enabled' },
    { id: 'act-2', action: 'refreshed', target: 'Staging - Q1 Config Test', user: 'emp-1', timestamp: '2026-02-15T06:00:00Z', details: 'Data refreshed from production' },
    { id: 'act-3', action: 'created', target: 'Benefits Config Preview', user: 'emp-17', timestamp: '2026-02-15T10:30:00Z', details: 'Partial clone - benefits module only' },
    { id: 'act-4', action: 'config_changed', target: 'Staging - Q1 Config Test', user: 'emp-1', timestamp: '2026-02-18T14:22:00Z', details: 'Updated payroll settings for Q2 preview' },
    { id: 'act-5', action: 'refreshed', target: 'Benefits Config Preview', user: 'emp-17', timestamp: '2026-02-20T06:00:00Z', details: 'Data refreshed from production' },
    { id: 'act-6', action: 'refreshed', target: 'Staging - Q1 Config Test', user: 'emp-1', timestamp: '2026-02-25T06:00:00Z', details: 'Data refreshed from production' },
    { id: 'act-7', action: 'extended', target: 'Benefits Config Preview', user: 'emp-17', timestamp: '2026-02-26T11:00:00Z', details: 'Expiry extended by 14 days' },
    { id: 'act-8', action: 'deleted', target: 'Payroll Test Dec 2025', user: 'emp-1', timestamp: '2026-01-15T16:00:00Z', details: 'Environment expired and auto-deleted' },
  ]

  const tabs = [
    { key: 'environments' as const, label: 'Environments' },
    { key: 'configuration' as const, label: 'Configuration' },
    { key: 'activity' as const, label: 'Activity Log' },
  ]

  const statusVariant = (status: string) => {
    switch (status) {
      case 'active': return 'success' as const
      case 'provisioning': return 'warning' as const
      case 'expired': return 'error' as const
      default: return 'default' as const
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'full_clone': return 'Full Clone'
      case 'partial_clone': return 'Partial Clone'
      case 'empty': return 'Empty'
      default: return type
    }
  }

  const actionIcon = (action: string) => {
    switch (action) {
      case 'created': return <Plus size={14} className="text-success" />
      case 'refreshed': return <RefreshCw size={14} className="text-info" />
      case 'config_changed': return <Settings size={14} className="text-warning" />
      case 'deleted': return <Trash2 size={14} className="text-error" />
      case 'extended': return <Clock size={14} className="text-info" />
      default: return <Activity size={14} className="text-t3" />
    }
  }

  const actionLabel = (action: string) => {
    switch (action) {
      case 'created': return 'Created'
      case 'refreshed': return 'Refreshed'
      case 'config_changed': return 'Configuration Changed'
      case 'deleted': return 'Deleted'
      case 'extended': return 'Extended'
      default: return action
    }
  }

  if (pageLoading) {
    return (
      <>
        <Header
          title="Sandbox Environments"
          subtitle="Test configurations safely before deploying to production"
          actions={<Button size="sm" disabled><Plus size={14} /> Create Sandbox</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Sandbox Environments"
        subtitle="Test configurations safely before deploying to production"
        actions={<Button size="sm" onClick={openCreateModal}><Plus size={14} /> Create Sandbox</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Sandboxes" value={activeCount} icon={<FlaskConical size={20} />} />
        <StatCard
          label="Days Until Nearest Expiry"
          value={daysUntilNearestExpiry !== null ? daysUntilNearestExpiry : '-'}
          icon={<Clock size={20} />}
          change={daysUntilNearestExpiry !== null && daysUntilNearestExpiry < 7 ? 'Expiring soon' : undefined}
          changeType={daysUntilNearestExpiry !== null && daysUntilNearestExpiry < 7 ? 'negative' : 'neutral'}
        />
        <StatCard label="Data Masking Enabled" value={maskingCount} icon={<Shield size={20} />} />
        <StatCard label="Total Clones" value={totalClones} icon={<Database size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-tempo-600 text-tempo-600'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Environments Tab ── */}
      {activeTab === 'environments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {sandboxEnvironments.length === 0 && (
            <div className="col-span-full">
              <Card>
                <div className="text-center py-8">
                  <FlaskConical size={32} className="mx-auto text-t3 mb-3" />
                  <p className="text-sm font-medium text-t1 mb-1">No sandbox environments</p>
                  <p className="text-xs text-t3 mb-4">Create a sandbox to test configurations safely</p>
                  <Button size="sm" onClick={openCreateModal}><Plus size={14} /> Create Sandbox</Button>
                </div>
              </Card>
            </div>
          )}
          {sandboxEnvironments.map(env => {
            const daysLeft = getDaysRemaining(env.expires_at)
            const isExpiringSoon = daysLeft > 0 && daysLeft < 7
            const expiryProgress = Math.max(0, Math.min(100, ((30 - daysLeft) / 30) * 100))
            return (
              <Card key={env.id}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-t1 truncate">{env.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={statusVariant(env.status)}>{env.status}</Badge>
                      <Badge variant="default">{typeLabel(env.type)}</Badge>
                      {env.data_masking && (
                        <span className="flex items-center gap-1 text-xs text-t3">
                          <Shield size={12} className="text-success" /> Masked
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-t2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-t3">Created by</span>
                    <span className="font-medium">{getEmployeeName(env.created_by)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-t3">Created</span>
                    <span>{formatDate(env.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-t3">Last refreshed</span>
                    <span>{formatDate(env.last_refreshed_at)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-t3">Expires</span>
                    <div className="flex items-center gap-1.5">
                      {isExpiringSoon && <AlertTriangle size={12} className="text-warning" />}
                      <span className={isExpiringSoon ? 'text-warning font-medium' : ''}>
                        {formatDate(env.expires_at)} ({daysLeft > 0 ? `${daysLeft}d left` : 'Expired'})
                      </span>
                    </div>
                  </div>
                  {env.status === 'active' && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-t3">Lifetime</span>
                        <span className="text-t3">{Math.round(expiryProgress)}%</span>
                      </div>
                      <Progress value={expiryProgress} color={isExpiringSoon ? 'warning' : 'orange'} />
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-3 border-t border-divider">
                  <Button size="sm" variant="secondary" onClick={() => refreshEnvironment(env.id)}>
                    <RefreshCw size={12} /> Refresh
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => extendEnvironment(env.id)}>
                    <Clock size={12} /> Extend
                  </Button>
                  <Button size="sm" variant="ghost" className="text-error hover:text-error" onClick={() => deleteSandboxEnvironment(env.id)}>
                    <Trash2 size={12} />
                  </Button>
                  <div className="flex-1" />
                  <Button size="sm" variant="primary" onClick={() => openEnvironment(env)}>
                    <ExternalLink size={12} /> Open
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* ── Configuration Tab ── */}
      {activeTab === 'configuration' && (
        <div className="space-y-6">
          {/* Clone Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Clone Settings</CardTitle>
            </CardHeader>
            <p className="text-xs text-t3 mb-4">Select which modules to include when cloning data to a sandbox environment.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(cloneSettings).map(([key, enabled]) => (
                <button
                  key={key}
                  onClick={() => setCloneSettings(prev => ({ ...prev, [key]: !prev[key as keyof typeof prev] }))}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                    enabled
                      ? 'border-tempo-300 bg-tempo-50'
                      : 'border-divider bg-canvas hover:bg-white'
                  }`}
                >
                  <div className={`w-8 h-5 rounded-full relative transition-colors ${enabled ? 'bg-tempo-600' : 'bg-gray-300'}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'left-3.5' : 'left-0.5'}`} />
                  </div>
                  <span className="text-sm font-medium text-t1 capitalize">{key.replace('_', ' ')}</span>
                </button>
              ))}
            </div>
          </Card>

          {/* Data Masking Rules */}
          <Card>
            <CardHeader>
              <CardTitle>Data Masking Rules</CardTitle>
            </CardHeader>
            <p className="text-xs text-t3 mb-4">PII fields are automatically masked in sandbox environments to protect sensitive data.</p>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Field</th>
                    <th className="tempo-th text-left px-4 py-3">Original Value</th>
                    <th className="tempo-th text-left px-4 py-3">Masked Value</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {[
                    { field: 'Full Name', original: 'John Doe', masked: 'John D.', active: true },
                    { field: 'Email Address', original: 'john.doe@company.com', masked: 'j***@***.com', active: true },
                    { field: 'SSN', original: '123-45-6789', masked: '***-**-6789', active: true },
                    { field: 'Phone Number', original: '+1 (555) 123-4567', masked: '+1 (***) ***-4567', active: true },
                    { field: 'Bank Account', original: '9876543210', masked: '******3210', active: true },
                    { field: 'Home Address', original: '123 Main St, City, ST', masked: '*** Main St, City, ST', active: true },
                    { field: 'Date of Birth', original: '1990-05-15', masked: '1990-**-**', active: true },
                    { field: 'Salary', original: '$125,000', masked: '$***,***', active: true },
                  ].map(rule => (
                    <tr key={rule.field} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{rule.field}</td>
                      <td className="px-4 py-3 text-xs text-t2 font-mono">{rule.original}</td>
                      <td className="px-4 py-3 text-xs text-t2 font-mono">{rule.masked}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="success">Active</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Retention Policy */}
          <Card>
            <CardHeader>
              <CardTitle>Retention Policy</CardTitle>
            </CardHeader>
            <p className="text-xs text-t3 mb-4">Sandbox environments are automatically deleted after the specified retention period.</p>
            <div className="flex items-end gap-4 max-w-md">
              <Select
                label="Auto-delete after"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                options={[
                  { value: '7', label: '7 days' },
                  { value: '14', label: '14 days' },
                  { value: '30', label: '30 days' },
                  { value: '60', label: '60 days' },
                  { value: '90', label: '90 days' },
                ]}
              />
              <Button size="sm" variant="secondary" onClick={saveRetentionPolicy}>Save Policy</Button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Activity Log Tab ── */}
      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
            <CardTitle>Activity Log</CardTitle>
          </CardHeader>
          <div className="space-y-0">
            {activityLog.map((entry, idx) => (
              <div key={entry.id} className="flex gap-4 py-3 border-b border-divider last:border-0">
                {/* Timeline dot & line */}
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-canvas border border-divider flex items-center justify-center">
                    {actionIcon(entry.action)}
                  </div>
                  {idx < activityLog.length - 1 && (
                    <div className="w-px flex-1 bg-divider mt-1" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 min-w-0 pb-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-t1">{actionLabel(entry.action)}</span>
                    <Badge variant="default">{entry.target}</Badge>
                  </div>
                  <p className="text-xs text-t2 mb-1">{entry.details}</p>
                  <div className="flex items-center gap-2 text-xs text-t3">
                    <span>{getEmployeeName(entry.user)}</span>
                    <span>-</span>
                    <span>{formatDateTime(entry.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ── Environment Detail Modal ── */}
      <Modal open={showEnvDetailModal} onClose={() => setShowEnvDetailModal(false)} title={detailEnv?.name || 'Environment Details'}>
        {detailEnv && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant(detailEnv.status)}>{detailEnv.status}</Badge>
              <Badge variant="default">{typeLabel(detailEnv.type)}</Badge>
              {detailEnv.data_masking && (
                <span className="flex items-center gap-1 text-xs text-t3">
                  <Shield size={12} className="text-success" /> Data Masking Enabled
                </span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-t3">Created by</span>
                <span className="text-t1 font-medium">{getEmployeeName(detailEnv.created_by)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Created</span>
                <span className="text-t1">{formatDate(detailEnv.created_at)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Last Refreshed</span>
                <span className="text-t1">{formatDate(detailEnv.last_refreshed_at)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Expires</span>
                <span className="text-t1">{formatDate(detailEnv.expires_at)} ({getDaysRemaining(detailEnv.expires_at)}d remaining)</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-t3">Source Org</span>
                <span className="text-t1 font-mono">{detailEnv.source_org_id}</span>
              </div>
            </div>

            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs text-t3 mb-1">Environment URL</p>
              <p className="text-xs font-mono text-t1">https://sandbox-{detailEnv.id}.tempo.dev</p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button size="sm" variant="secondary" onClick={() => { refreshEnvironment(detailEnv.id); addToast('Environment refreshed', 'success') }}>
                <RefreshCw size={14} /> Refresh Data
              </Button>
              <Button size="sm" variant="secondary" onClick={() => { extendEnvironment(detailEnv.id); addToast('Environment extended by 14 days', 'success') }}>
                <Clock size={14} /> Extend
              </Button>
              <Button variant="secondary" onClick={() => setShowEnvDetailModal(false)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Sandbox Modal ── */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Sandbox Environment">
        <div className="space-y-4">
          <Input
            label="Environment Name"
            placeholder="e.g., Staging - Q2 Benefits Preview"
            value={createForm.name}
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
          />
          <Select
            label="Environment Type"
            value={createForm.type}
            onChange={(e) => setCreateForm({ ...createForm, type: e.target.value as 'full_clone' | 'partial_clone' | 'empty' })}
            options={[
              { value: 'full_clone', label: 'Full Clone - Complete copy of production data' },
              { value: 'partial_clone', label: 'Partial Clone - Selected modules only' },
              { value: 'empty', label: 'Empty - Clean environment with no data' },
            ]}
          />
          <div className="space-y-1">
            <label className="block text-xs font-medium text-t1">Data Masking</label>
            <button
              onClick={() => setCreateForm(prev => ({ ...prev, data_masking: !prev.data_masking }))}
              className="flex items-center gap-3 w-full p-3 rounded-lg border border-divider bg-canvas hover:bg-white transition-colors"
            >
              <div className={`w-8 h-5 rounded-full relative transition-colors ${createForm.data_masking ? 'bg-tempo-600' : 'bg-gray-300'}`}>
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${createForm.data_masking ? 'left-3.5' : 'left-0.5'}`} />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-t1">Enable data masking</p>
                <p className="text-xs text-t3">PII fields will be automatically masked (recommended)</p>
              </div>
            </button>
          </div>
          <Input
            label="Expiry Date"
            type="date"
            value={createForm.expires_at}
            onChange={(e) => setCreateForm({ ...createForm, expires_at: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitCreate}><FlaskConical size={14} /> Create Sandbox</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
