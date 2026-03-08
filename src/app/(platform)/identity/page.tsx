'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { KeyRound, Shield, ShieldCheck, Users, Globe, Plus, Settings, CheckCircle, AlertTriangle, Lock, RefreshCw, Clock, Link2, Fingerprint, Smartphone, Key, Loader2 } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

// API helper — calls go through middleware which injects x-org-id from JWT
async function idpAPI(method: 'GET' | 'POST', params?: Record<string, string>, body?: any) {
  const url = new URL('/api/identity-provider', window.location.origin)
  if (params) for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString(), {
    method,
    headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'include',
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(err.error || `IdP API error ${res.status}`)
  }
  return res.json()
}

export default function IdentityPage() {
  const tc = useTranslations('common')
  const {
    idpConfigurations,
    samlApps,
    mfaPolicies,
    scimProviders,
    employees,
    addIdpConfiguration,
    updateIdpConfiguration,
    addSamlApp,
    updateSamlApp,
    addMfaPolicy,
    updateMfaPolicy,
    addScimProvider,
    updateScimProvider,
    deleteScimProvider,
    addToast,
    ensureModulesLoaded,
  } = useTempo()

  // Lazy-load identity modules from DB on mount
  const [pageLoading, setPageLoading] = useState(true)
  const [dashboardData, setDashboardData] = useState<any>(null)
  useEffect(() => {
    ensureModulesLoaded?.(['idpConfigurations', 'samlApps', 'mfaPolicies', 'scimProviders'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    // Also fetch the real dashboard data from the IdP API
    idpAPI('GET', { action: 'dashboard' })
      .then(data => setDashboardData(data))
      .catch(() => {}) // non-critical, fall back to computed stats
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  const [activeTab, setActiveTab] = useState<'sso' | 'idp' | 'mfa' | 'scim'>('sso')

  // Stat calculations
  const ssoAppCount = samlApps.length
  const enrollmentRate = mfaPolicies[0]?.enrollment_rate ?? 0
  const activeUsers = idpConfigurations[0]?.user_count ?? 0
  const certExpiry = useMemo(() => {
    if (!idpConfigurations[0]?.certificate_expires_at) return null
    const diff = new Date(idpConfigurations[0].certificate_expires_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }, [idpConfigurations])

  // Add SSO App Modal
  const [showAppModal, setShowAppModal] = useState(false)
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configApp, setConfigApp] = useState<any>(null)
  const [configForm, setConfigForm] = useState({
    name: '',
    sso_url: '',
    idp_id: '',
    status: 'active',
  })
  const [appForm, setAppForm] = useState({
    name: '',
    sso_url: '',
    idp_id: '',
    status: 'active',
  })

  function openAddApp() {
    setAppForm({
      name: '',
      sso_url: '',
      idp_id: idpConfigurations[0]?.id || '',
      status: 'active',
    })
    setShowAppModal(true)
  }

  async function submitApp() {
    if (!appForm.name || !appForm.sso_url) return
    try {
      // Try real API first
      await idpAPI('POST', undefined, {
        action: 'register-app',
        name: appForm.name,
        acsUrl: appForm.sso_url,
        idpConfigId: appForm.idp_id,
        status: appForm.status,
      })
      addToast(`Application "${appForm.name}" added`)
    } catch {
      addToast('Failed to register app via API, applying locally', 'error')
    }
    addSamlApp({
      name: appForm.name,
      sso_url: appForm.sso_url,
      idp_id: appForm.idp_id,
      status: appForm.status,
      user_count: 0,
      last_login_at: null,
      logo_url: '',
    })
    setShowAppModal(false)
  }

  async function toggleAppStatus(app: any) {
    const newStatus = app.status === 'active' ? 'inactive' : 'active'
    try {
      await idpAPI('POST', undefined, {
        action: 'register-app',
        id: app.id,
        name: app.name,
        acsUrl: app.sso_url,
        idpConfigId: app.idp_id,
        status: newStatus,
      })
      addToast(`Application ${app.name} ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
    } catch {
      addToast(`Failed to update via API, applying locally`, 'error')
    }
    updateSamlApp(app.id, { status: newStatus })
  }

  function openConfigureApp(app: any) {
    setConfigApp(app)
    setConfigForm({
      name: app.name,
      sso_url: app.sso_url,
      idp_id: app.idp_id,
      status: app.status,
    })
    setShowConfigModal(true)
  }

  async function submitConfigApp() {
    if (!configApp || !configForm.name || !configForm.sso_url) return
    try {
      await idpAPI('POST', undefined, {
        action: 'register-app',
        id: configApp.id,
        name: configForm.name,
        acsUrl: configForm.sso_url,
        idpConfigId: configForm.idp_id,
        status: configForm.status,
      })
      addToast(`Application "${configForm.name}" updated`)
    } catch {
      addToast('Failed to update app via API, applying locally', 'error')
    }
    updateSamlApp(configApp.id, {
      name: configForm.name,
      sso_url: configForm.sso_url,
      idp_id: configForm.idp_id,
      status: configForm.status,
    })
    setShowConfigModal(false)
  }

  async function toggleMfaPolicy(policy: any) {
    const newActive = !policy.is_active
    try {
      await idpAPI('POST', undefined, {
        action: 'configure-mfa',
        id: policy.id,
        name: policy.name,
        methods: policy.methods,
        applies_to: policy.applies_to,
        grace_period_days: policy.grace_period_days,
        is_active: newActive,
      })
      addToast(`MFA policy "${policy.name}" ${newActive ? 'enabled' : 'disabled'}`)
    } catch {
      addToast(`Failed to update MFA policy via API, applying locally`, 'error')
    }
    updateMfaPolicy(policy.id, { is_active: newActive })
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  function formatDateTime(dateStr: string | null) {
    if (!dateStr) return 'Never'
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  function getDaysUntil(dateStr: string) {
    const diff = new Date(dateStr).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function getIdpName(idpId: string) {
    const idp = idpConfigurations.find(c => c.id === idpId)
    return idp?.name || 'Unknown'
  }

  const methodIcons: Record<string, React.ReactNode> = {
    authenticator: <Smartphone size={12} />,
    sms: <Smartphone size={12} />,
    hardware_key: <Key size={12} />,
    biometric: <Fingerprint size={12} />,
  }

  const tabs = [
    { id: 'sso', label: 'SSO Applications', icon: Globe },
    { id: 'idp', label: 'Identity Providers', icon: KeyRound },
    { id: 'mfa', label: 'MFA Policies', icon: Shield },
    { id: 'scim', label: 'SCIM Provisioning', icon: RefreshCw },
  ]

  if (pageLoading) {
    return (
      <>
        <Header
          title="Identity & Access"
          subtitle="SSO, MFA & SCIM provisioning"
          actions={<Button size="sm" disabled><Plus size={14} /> Add Application</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Identity & Access"
        subtitle="SSO, MFA & SCIM provisioning"
        actions={<Button size="sm" onClick={openAddApp}><Plus size={14} /> Add Application</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="SSO Apps" value={ssoAppCount} icon={<Globe size={20} />} />
        <StatCard
          label="MFA Enrollment"
          value={`${enrollmentRate}%`}
          icon={<ShieldCheck size={20} />}
          change={enrollmentRate >= 90 ? 'On target' : 'Below target'}
          changeType={enrollmentRate >= 90 ? 'positive' : 'negative'}
        />
        <StatCard label="Active Users" value={activeUsers} icon={<Users size={20} />} />
        <StatCard
          label="Certificate Expiry"
          value={certExpiry !== null ? `${certExpiry} days` : 'N/A'}
          icon={certExpiry !== null && certExpiry < 90 ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
          change={certExpiry !== null && certExpiry < 90 ? 'Renew soon' : 'Valid'}
          changeType={certExpiry !== null && certExpiry < 90 ? 'negative' : 'positive'}
        />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={(id) => setActiveTab(id as typeof activeTab)} className="mb-6" />

      {/* ── Tab: SSO Applications ── */}
      {activeTab === 'sso' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {samlApps.map(app => (
            <Card key={app.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center">
                    <Globe size={20} className="text-t3" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-t1">{app.name}</p>
                    <p className="text-xs text-t3">via {getIdpName(app.idp_id)}</p>
                  </div>
                </div>
                <Badge variant={app.status === 'active' ? 'success' : 'default'}>
                  {app.status}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-t3 flex items-center gap-1"><Users size={12} /> Users</span>
                  <span className="text-t1 font-medium">{app.user_count}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-t3 flex items-center gap-1"><Clock size={12} /> Last Login</span>
                  <span className="text-t1">{formatDateTime(app.last_login_at)}</span>
                </div>
                <div className="flex items-center gap-1 text-xs text-t3 mt-1">
                  <Link2 size={12} />
                  <span className="truncate max-w-[220px]">{app.sso_url}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-3 border-t border-divider">
                <Button variant="secondary" size="sm" className="flex-1" onClick={() => openConfigureApp(app)}>
                  <Settings size={12} /> Configure
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => toggleAppStatus(app)}
                >
                  {app.status === 'active' ? 'Disable' : 'Enable'}
                </Button>
              </div>
            </Card>
          ))}

          {samlApps.length === 0 && (
            <Card className="col-span-full">
              <div className="text-center py-8">
                <Globe size={32} className="text-t3 mx-auto mb-3" />
                <p className="text-sm font-medium text-t1">No SSO applications configured</p>
                <p className="text-xs text-t3 mt-1">Add your first SSO application to enable single sign-on</p>
                <Button size="sm" className="mt-4" onClick={openAddApp}>
                  <Plus size={14} /> Add Application
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Identity Providers ── */}
      {activeTab === 'idp' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Identity Provider Configurations</CardTitle>
              <Button variant="secondary" size="sm" onClick={async () => {
                const config = {
                  name: 'New Identity Provider',
                  protocol: 'saml',
                  entity_id: '',
                  sso_url: '',
                  certificate_expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                  user_count: 0,
                }
                try {
                  await idpAPI('POST', undefined, { action: 'configure-idp', ...config })
                  addToast('Identity provider added')
                } catch {
                  addToast('Failed to add provider via API, applying locally', 'error')
                }
                addIdpConfiguration(config)
              }}>
                <Plus size={14} /> Add Provider
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Provider</th>
                  <th className="tempo-th text-left px-4 py-3">Protocol</th>
                  <th className="tempo-th text-left px-4 py-3">Entity ID</th>
                  <th className="tempo-th text-left px-4 py-3">SSO URL</th>
                  <th className="tempo-th text-center px-4 py-3">Certificate</th>
                  <th className="tempo-th text-center px-4 py-3">Users</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {idpConfigurations.map(idp => {
                  const daysUntilExpiry = getDaysUntil(idp.certificate_expires_at)
                  const certWarning = daysUntilExpiry < 90
                  return (
                    <tr key={idp.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div>
                          <p className="text-xs font-medium text-t1">{idp.name}</p>
                          <p className="text-xs text-t3">Created {formatDate(idp.created_at)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={idp.protocol === 'saml' ? 'info' : 'default'}>
                          {idp.protocol.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[180px] truncate font-mono">{idp.entity_id}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[180px] truncate">{idp.sso_url}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {certWarning ? (
                            <AlertTriangle size={14} className="text-warning" />
                          ) : (
                            <CheckCircle size={14} className="text-success" />
                          )}
                          <span className={`text-xs font-medium ${certWarning ? 'text-warning' : 'text-success'}`}>
                            {daysUntilExpiry}d
                          </span>
                        </div>
                        <p className="text-xs text-t3 mt-0.5">{formatDate(idp.certificate_expires_at)}</p>
                      </td>
                      <td className="px-4 py-3 text-center text-xs font-medium text-t1">{idp.user_count}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={idp.status === 'active' ? 'success' : 'default'}>
                          {idp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          <Button size="sm" variant="secondary" onClick={async () => {
                            const newStatus = idp.status === 'active' ? 'inactive' : 'active'
                            try {
                              await idpAPI('POST', undefined, {
                                action: 'configure-idp',
                                id: idp.id,
                                name: idp.name,
                                protocol: idp.protocol,
                                entity_id: idp.entity_id,
                                sso_url: idp.sso_url,
                                status: newStatus,
                              })
                              addToast(`Provider "${idp.name}" ${newStatus === 'active' ? 'enabled' : 'disabled'}`)
                            } catch {
                              addToast('Failed to update provider via API, applying locally', 'error')
                            }
                            updateIdpConfiguration(idp.id, { status: newStatus })
                          }}>
                            <Settings size={12} /> {tc('edit')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          {idpConfigurations.length === 0 && (
            <div className="text-center py-12">
              <KeyRound size={32} className="text-t3 mx-auto mb-3" />
              <p className="text-sm font-medium text-t1">No identity providers configured</p>
              <p className="text-xs text-t3 mt-1">Set up SAML or OIDC to enable single sign-on</p>
            </div>
          )}
        </Card>
      )}

      {/* ── Tab: MFA Policies ── */}
      {activeTab === 'mfa' && (
        <div className="space-y-4">
          {mfaPolicies.map(policy => (
            <Card key={policy.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${policy.is_active ? 'bg-success/10' : 'bg-canvas'}`}>
                    <Shield size={20} className={policy.is_active ? 'text-success' : 'text-t3'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-t1">{policy.name}</p>
                    <p className="text-xs text-t3">
                      Applies to: <span className="capitalize font-medium text-t2">{policy.applies_to}</span>
                       {' '}employees
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={policy.is_active ? 'success' : 'default'}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button
                    size="sm"
                    variant={policy.is_active ? 'ghost' : 'primary'}
                    onClick={() => toggleMfaPolicy(policy)}
                  >
                    {policy.is_active ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Methods */}
                <div>
                  <p className="text-xs text-t3 mb-2 font-medium">Allowed Methods</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(policy.methods || []).map((method: string) => (
                      <Badge key={method} variant="info">
                        <span className="flex items-center gap-1">
                          {methodIcons[method] || <Lock size={12} />}
                          {method.replace('_', ' ')}
                        </span>
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Grace Period */}
                <div>
                  <p className="text-xs text-t3 mb-2 font-medium">Grace Period</p>
                  <p className="text-sm font-semibold text-t1">{policy.grace_period_days} days</p>
                  <p className="text-xs text-t3 mt-0.5">for new enrollments</p>
                </div>

                {/* Enrollment Rate */}
                <div>
                  <p className="text-xs text-t3 mb-2 font-medium">Enrollment Rate</p>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-t1">{policy.enrollment_rate}%</span>
                    <span className="text-xs text-t3">
                      ({Math.round((policy.enrollment_rate / 100) * employees.length)}/{employees.length} users)
                    </span>
                  </div>
                  <Progress
                    value={policy.enrollment_rate}
                    color={policy.enrollment_rate >= 90 ? 'orange' : 'warning'}
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="flex items-center gap-4 pt-3 border-t border-divider text-xs text-t3">
                <span className="flex items-center gap-1"><Clock size={12} /> Created {formatDate(policy.created_at)}</span>
                {policy.enrollment_rate < 100 && (
                  <span className="flex items-center gap-1 text-warning">
                    <AlertTriangle size={12} /> {100 - policy.enrollment_rate}% unenrolled
                  </span>
                )}
              </div>
            </Card>
          ))}

          {mfaPolicies.length === 0 && (
            <Card>
              <div className="text-center py-12">
                <Shield size={32} className="text-t3 mx-auto mb-3" />
                <p className="text-sm font-medium text-t1">No MFA policies configured</p>
                <p className="text-xs text-t3 mt-1">Create a policy to enforce multi-factor authentication</p>
                <Button size="sm" className="mt-4" onClick={async () => {
                  const policy = {
                    name: 'Default MFA Policy',
                    methods: ['authenticator'],
                    grace_period_days: 14,
                    applies_to: 'all',
                    enrollment_rate: 0,
                  }
                  try {
                    await idpAPI('POST', undefined, { action: 'configure-mfa', ...policy })
                    addToast('MFA policy created')
                  } catch {
                    addToast('Failed to create MFA policy via API, applying locally', 'error')
                  }
                  addMfaPolicy(policy)
                }}>
                  <Plus size={14} /> Create Policy
                </Button>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: SCIM Provisioning ── */}
      {activeTab === 'scim' && (
        <div className="space-y-4">
          {/* SCIM Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
            <StatCard label="Provisioned Users" value={48} icon={<Users size={20} />} />
            <StatCard label="Synced Groups" value={6} icon={<Shield size={20} />} />
            <StatCard label="Last Sync" value="3 min ago" icon={<RefreshCw size={20} />} change="Healthy" changeType="positive" />
            <StatCard label="Sync Errors" value={0} icon={<CheckCircle size={20} />} change="No issues" changeType="positive" />
          </div>

          {scimProviders.map(provider => (
            <Card key={provider.id}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${provider.status === 'active' ? 'bg-primary/10' : 'bg-canvas'}`}>
                    <RefreshCw size={20} className={provider.status === 'active' ? 'text-primary' : 'text-t3'} />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-t1">{provider.name}</p>
                    <p className="text-xs text-t3 font-mono">{provider.endpoint}</p>
                  </div>
                </div>
                <Badge variant={provider.status === 'active' ? 'success' : 'default'}>
                  {provider.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-t3 mb-1">Synced Users</p>
                  <p className="text-sm font-semibold text-t1">{provider.syncedUsers}</p>
                </div>
                <div>
                  <p className="text-xs text-t3 mb-1">Synced Groups</p>
                  <p className="text-sm font-semibold text-t1">{provider.syncedGroups}</p>
                </div>
                <div>
                  <p className="text-xs text-t3 mb-1">Last Sync</p>
                  <p className="text-sm font-medium text-t1">{formatDateTime(provider.lastSync)}</p>
                </div>
                <div>
                  <p className="text-xs text-t3 mb-1">Sync Interval</p>
                  <p className="text-sm font-medium text-t1">Every {provider.syncInterval} min</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                  <div className="flex items-center gap-2">
                    <Users size={14} className="text-t3" />
                    <span className="text-xs text-t2">Auto-provision new users</span>
                  </div>
                  <Badge variant={provider.autoProvision ? 'success' : 'default'}>
                    {provider.autoProvision ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                  <div className="flex items-center gap-2">
                    <Lock size={14} className="text-t3" />
                    <span className="text-xs text-t2">Auto-deprovision on removal</span>
                  </div>
                  <Badge variant={provider.autoDeprovision ? 'success' : 'default'}>
                    {provider.autoDeprovision ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>

              {provider.status === 'active' && (
                <div className="pt-3 border-t border-divider">
                  <p className="text-xs text-t3 mb-2 font-medium">Recent Sync Activity</p>
                  <div className="space-y-1.5">
                    {[
                      { action: 'User provisioned', detail: 'amara.diop@ecobank.com', time: '3 min ago', type: 'success' },
                      { action: 'Group updated', detail: 'Engineering Team - 2 members added', time: '15 min ago', type: 'info' },
                      { action: 'User attribute updated', detail: 'kwame.mensah@ecobank.com - department changed', time: '1 hr ago', type: 'info' },
                      { action: 'User deprovisioned', detail: 'former.employee@ecobank.com', time: '2 hrs ago', type: 'warning' },
                    ].map((event, i) => (
                      <div key={i} className="flex items-center justify-between py-1.5 text-xs">
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            event.type === 'success' ? 'bg-success' :
                            event.type === 'warning' ? 'bg-warning' : 'bg-info'
                          }`} />
                          <span className="text-t2 font-medium">{event.action}</span>
                          <span className="text-t3">{event.detail}</span>
                        </div>
                        <span className="text-t3">{event.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Add SSO App Modal */}
      <Modal open={showAppModal} onClose={() => setShowAppModal(false)} title="Add SSO Application">
        <div className="space-y-4">
          <Input
            label="Application Name"
            placeholder="e.g. Slack, GitHub, Jira"
            value={appForm.name}
            onChange={(e) => setAppForm({ ...appForm, name: e.target.value })}
          />
          <Input
            label="SSO URL"
            placeholder="https://your-app.com/sso"
            value={appForm.sso_url}
            onChange={(e) => setAppForm({ ...appForm, sso_url: e.target.value })}
          />
          <Select
            label="Identity Provider"
            value={appForm.idp_id}
            onChange={(e) => setAppForm({ ...appForm, idp_id: e.target.value })}
            options={idpConfigurations.map(idp => ({ value: idp.id, label: idp.name }))}
          />
          <Select
            label={tc('status')}
            value={appForm.status}
            onChange={(e) => setAppForm({ ...appForm, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAppModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitApp}>Add Application</Button>
          </div>
        </div>
      </Modal>

      {/* Configure SSO App Modal */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title={`Configure ${configApp?.name || 'Application'}`}>
        <div className="space-y-4">
          <Input
            label="Application Name"
            placeholder="e.g. Slack, GitHub, Jira"
            value={configForm.name}
            onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
          />
          <Input
            label="SSO URL"
            placeholder="https://your-app.com/sso"
            value={configForm.sso_url}
            onChange={(e) => setConfigForm({ ...configForm, sso_url: e.target.value })}
          />
          <Select
            label="Identity Provider"
            value={configForm.idp_id}
            onChange={(e) => setConfigForm({ ...configForm, idp_id: e.target.value })}
            options={idpConfigurations.map(idp => ({ value: idp.id, label: idp.name }))}
          />
          <Select
            label={tc('status')}
            value={configForm.status}
            onChange={(e) => setConfigForm({ ...configForm, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowConfigModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitConfigApp}><Settings size={14} /> Save Configuration</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
