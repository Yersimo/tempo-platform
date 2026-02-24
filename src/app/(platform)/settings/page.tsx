'use client'

import { useState, useCallback, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import {
  Building, Users, Shield, Bell, Palette, Globe, Search, Clock, Plug,
  ShieldCheck, Mail, Banknote, Building2, MessageSquare, Video,
  CheckCircle, XCircle, RefreshCw, Loader2, AlertCircle, Wifi, WifiOff,
  CreditCard, ExternalLink, Check, Sparkles, Crown, Zap
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import { INTEGRATION_CATALOG, type ConfigField } from '@/lib/integrations'
import { MFASettings } from '@/components/settings/mfa-settings'

// Icon map for integration cards
const ICON_MAP: Record<string, React.ReactNode> = {
  Shield: <ShieldCheck size={24} />,
  Mail: <Mail size={24} />,
  Banknote: <Banknote size={24} />,
  Building2: <Building2 size={24} />,
  MessageSquare: <MessageSquare size={24} />,
  Video: <Video size={24} />,
}

const CATEGORY_COLORS: Record<string, string> = {
  identity: 'bg-blue-50 text-blue-700',
  productivity: 'bg-green-50 text-green-700',
  payroll: 'bg-amber-50 text-amber-700',
  communication: 'bg-purple-50 text-purple-700',
  storage: 'bg-teal-50 text-teal-700',
}

interface ConnectedIntegration {
  id: string
  provider: string
  name: string
  status: string
  lastSyncAt: string | null
  lastSyncStatus: string | null
  syncDirection: string
}

interface IntegrationLog {
  id: string
  action: string
  status: string
  recordsProcessed: number
  recordsFailed: number
  details: string | null
  errorMessage: string | null
  duration: number | null
  createdAt: string
}

interface BillingPlan {
  id: string
  name: string
  pricePerEmployee: number
  features: string[]
  maxEmployees: number | null
  tier: string
}

interface BillingSubscription {
  plan: string
  status: string
  currentPeriodEnd: string
  employeeCount: number
  monthlyAmount: number
  currency: string
  cancelAtPeriodEnd: boolean
  trialEnd: string | null
}

export default function SettingsPage() {
  const t = useTranslations('settings')
  const ti = useTranslations('integrations')
  const tc = useTranslations('common')
  const searchParams = useSearchParams()
  const { org, employees, departments, auditLog, updateOrg, addDepartment, addToast, getEmployeeName, getDepartmentName } = useTempo()
  const initialTab = searchParams.get('tab') || 'general'
  const [activeTab, setActiveTab] = useState(initialTab)
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: org.name, industry: org.industry, size: org.size, country: org.country })
  const [deptForm, setDeptForm] = useState({ name: '', parent_id: null as string | null, head_id: '' })
  const [auditSearch, setAuditSearch] = useState('')

  // Integration state
  const [connectedIntegrations, setConnectedIntegrations] = useState<ConnectedIntegration[]>([])
  const [showConnectModal, setShowConnectModal] = useState(false)
  const [showLogsModal, setShowLogsModal] = useState(false)
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null)
  const [connectForm, setConnectForm] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<boolean | null>(null)
  const [syncing, setSyncing] = useState<string | null>(null)
  const [integrationLogs, setIntegrationLogs] = useState<IntegrationLog[]>([])
  const [integrationsLoaded, setIntegrationsLoaded] = useState(false)

  // Billing state
  const [billingSubscription, setBillingSubscription] = useState<BillingSubscription | null>(null)
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([])
  const [billingLoading, setBillingLoading] = useState(false)
  const [billingActionLoading, setBillingActionLoading] = useState<string | null>(null)

  // Load billing data
  const loadBilling = useCallback(async () => {
    setBillingLoading(true)
    try {
      const res = await fetch('/api/billing')
      if (res.ok) {
        const data = await res.json()
        setBillingSubscription(data.subscription || null)
        setBillingPlans(data.plans || [])
      }
    } catch {
      // Use empty state on error
    }
    setBillingLoading(false)
  }, [])

  // Handle billing query params (success / canceled)
  useEffect(() => {
    const billingSuccess = searchParams.get('billing') || searchParams.get('success')
    const billingCanceled = searchParams.get('canceled')
    if (billingSuccess === 'true' || billingSuccess === 'success') {
      addToast('Subscription updated successfully!', 'success')
    }
    if (billingCanceled === 'true' || billingCanceled === 'canceled') {
      addToast('Checkout was canceled.', 'info')
    }
  }, [searchParams, addToast])

  // Load billing when tab is activated
  useEffect(() => {
    if (activeTab === 'billing' && !billingSubscription && !billingLoading) {
      loadBilling()
    }
  }, [activeTab, billingSubscription, billingLoading, loadBilling])

  // Billing actions
  const handleBillingUpgrade = async (planId: string) => {
    setBillingActionLoading(planId)
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'checkout', planId }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.demo) {
        addToast('Stripe is not configured. This is a demo environment.', 'info')
      } else {
        addToast(data.error || 'Failed to start checkout', 'error')
      }
    } catch {
      addToast('Failed to start checkout', 'error')
    }
    setBillingActionLoading(null)
  }

  const handleManageSubscription = async () => {
    setBillingActionLoading('portal')
    try {
      const res = await fetch('/api/billing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'portal' }),
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.demo) {
        addToast('Stripe is not configured. This is a demo environment.', 'info')
      } else {
        addToast(data.error || 'Failed to open billing portal', 'error')
      }
    } catch {
      addToast('Failed to open billing portal', 'error')
    }
    setBillingActionLoading(null)
  }

  // Load integrations from API
  const loadIntegrations = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'list' }),
      })
      if (res.ok) {
        const data = await res.json()
        setConnectedIntegrations(data.connected || [])
      }
    } catch {
      // Use empty state on error
    }
    setIntegrationsLoaded(true)
  }, [])

  // Load integrations on mount if tab is integrations
  useEffect(() => {
    if (initialTab === 'integrations' && !integrationsLoaded) {
      loadIntegrations()
    }
  }, [initialTab, integrationsLoaded, loadIntegrations])

  // Load integrations when tab is activated
  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    if (tab === 'integrations' && !integrationsLoaded) {
      loadIntegrations()
    }
    if (tab === 'billing' && !billingSubscription && !billingLoading) {
      loadBilling()
    }
  }, [integrationsLoaded, loadIntegrations, billingSubscription, billingLoading, loadBilling])

  // Get connector config schema
  const getConfigSchema = (providerId: string): ConfigField[] => {
    // Import config schemas from connectors
    const schemas: Record<string, ConfigField[]> = {
      'active-directory': [
        { key: 'tenant_id', label: ti('tenantId'), type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        { key: 'client_id', label: ti('clientId'), type: 'text', required: true, placeholder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx' },
        { key: 'client_secret', label: ti('clientSecret'), type: 'password', required: true, placeholder: ti('enterClientSecret') },
        { key: 'domain', label: ti('domain'), type: 'text', required: false, placeholder: 'ecobank.com' },
        { key: 'sync_mode', label: ti('syncMode'), type: 'select', required: true, options: [
          { label: ti('usersOnly'), value: 'users' },
          { label: ti('usersAndGroups'), value: 'users_groups' },
          { label: ti('fullDirectory'), value: 'full' },
        ] },
      ],
      'google-workspace': [
        { key: 'service_account_email', label: ti('serviceAccountEmail'), type: 'text', required: true, placeholder: 'service-account@project.iam.gserviceaccount.com' },
        { key: 'admin_email', label: ti('adminEmail'), type: 'text', required: true, placeholder: 'admin@company.com' },
        { key: 'private_key', label: ti('privateKey'), type: 'password', required: true, placeholder: '-----BEGIN PRIVATE KEY-----...' },
        { key: 'domain', label: ti('domain'), type: 'text', required: true, placeholder: 'company.com' },
        { key: 'customer_id', label: ti('customerId'), type: 'text', required: false, placeholder: 'Cxxxxxxx' },
      ],
      'payroll-api': [
        { key: 'api_url', label: ti('apiUrl'), type: 'url', required: true, placeholder: 'https://payroll.example.com/api/v1' },
        { key: 'api_key', label: ti('apiKey'), type: 'password', required: true, placeholder: ti('enterApiKey') },
        { key: 'api_secret', label: ti('apiSecret'), type: 'password', required: false, placeholder: ti('optionalForBasicAuth') },
        { key: 'auth_type', label: ti('authType'), type: 'select', required: true, options: [
          { label: ti('bearerToken'), value: 'bearer' },
          { label: ti('basicAuth'), value: 'basic' },
          { label: ti('apiKeyHeader'), value: 'api_key' },
        ] },
        { key: 'employees_endpoint', label: ti('employeesEndpoint'), type: 'text', required: false, placeholder: '/employees' },
        { key: 'payroll_endpoint', label: ti('payrollEndpoint'), type: 'text', required: false, placeholder: '/payroll' },
      ],
    }
    return schemas[providerId] || []
  }

  // Connect integration
  const handleConnect = async () => {
    if (!selectedProvider) return
    setConnecting(true)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'connect', provider: selectedProvider, config: connectForm }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(ti('connectionSuccess'), 'success')
        setShowConnectModal(false)
        setConnectForm({})
        setSelectedProvider(null)
        setTestResult(null)
        loadIntegrations()
      } else {
        addToast(data.error || ti('connectionFailed'), 'error')
      }
    } catch {
      addToast(ti('connectionFailed'), 'error')
    }
    setConnecting(false)
  }

  // Test connection
  const handleTestConnection = async () => {
    if (!selectedProvider) return
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', provider: selectedProvider, config: connectForm }),
      })
      const data = await res.json()
      setTestResult(data.success)
    } catch {
      setTestResult(false)
    }
    setTesting(false)
  }

  // Disconnect integration
  const handleDisconnect = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'disconnect', integrationId }),
      })
      if (res.ok) {
        addToast(ti('disconnected'), 'success')
        loadIntegrations()
      }
    } catch {
      addToast(ti('disconnectFailed'), 'error')
    }
  }

  // Sync integration
  const handleSync = async (integrationId: string) => {
    setSyncing(integrationId)
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'sync', integrationId }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        addToast(ti('syncSuccess'), 'success')
      } else {
        addToast(ti('syncFailed'), 'error')
      }
      loadIntegrations()
    } catch {
      addToast(ti('syncFailed'), 'error')
    }
    setSyncing(null)
  }

  // Load sync logs
  const handleViewLogs = async (integrationId: string) => {
    try {
      const res = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logs', integrationId }),
      })
      if (res.ok) {
        const data = await res.json()
        setIntegrationLogs(data.logs || [])
      }
    } catch {
      setIntegrationLogs([])
    }
    setShowLogsModal(true)
  }

  const openConnectModal = (providerId: string) => {
    setSelectedProvider(providerId)
    setConnectForm({})
    setTestResult(null)
    setShowConnectModal(true)
  }

  const isConnected = (providerId: string) => {
    return connectedIntegrations.some(c => c.provider === providerId && c.status === 'connected')
  }

  const getConnection = (providerId: string) => {
    return connectedIntegrations.find(c => c.provider === providerId)
  }

  const tabs = [
    { id: 'general', label: t('tabGeneral') },
    { id: 'team', label: t('tabTeam'), count: employees.length },
    { id: 'departments', label: t('tabDepartments'), count: departments.length },
    { id: 'billing', label: 'Billing' },
    { id: 'integrations', label: ti('title') },
    { id: 'audit', label: t('tabAuditLog'), count: auditLog.length },
    { id: 'security', label: t('tabSecurity') },
  ]

  const admins = employees.filter(e => e.role === 'admin' || e.role === 'owner')
  const managers = employees.filter(e => e.role === 'manager')
  const regularEmployees = employees.filter(e => e.role === 'employee')

  const filteredAudit = auditLog.filter(entry =>
    !auditSearch ||
    entry.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  )

  function submitOrg() {
    updateOrg(orgForm)
    setShowOrgModal(false)
  }

  function submitDept() {
    if (!deptForm.name) return
    addDepartment({ name: deptForm.name, parent_id: deptForm.parent_id, head_id: deptForm.head_id || null })
    setShowDeptModal(false)
    setDeptForm({ name: '', parent_id: null, head_id: '' })
  }

  return (
    <>
      <Header title={t('title')} subtitle={t('subtitle')} />

      <Tabs tabs={tabs} active={activeTab} onChange={handleTabChange} className="mb-6" />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Building size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('organization')}</h3>
                <p className="text-xs text-t3">{t('manageCompanyDetails')}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('companyName')}</span><span className="text-sm font-medium text-t1">{org.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('industry')}</span><span className="text-sm text-t1">{org.industry}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('plan')}</span><Badge variant="orange">{org.plan}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('size')}</span><span className="text-sm text-t1">{org.size}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{tc('country')}</span><span className="text-sm text-t1">{org.country}</span></div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setOrgForm({ name: org.name, industry: org.industry, size: org.size, country: org.country }); setShowOrgModal(true) }}>{t('editOrganization')}</Button>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Globe size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('regionsCountries')}</h3>
                <p className="text-xs text-t3">{t('multiCountryConfig')}</p>
              </div>
            </div>
            <div className="space-y-2">
              {[{ region: 'UEMOA', countries: 8 }, { region: 'CESA', countries: 10 }, { region: 'AWA', countries: 7 }, { region: 'Nigeria', countries: 1 }].map(item => (
                <div key={item.region} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <div><p className="text-xs font-medium text-t1">{item.region}</p><p className="text-[0.6rem] text-t3">{t('countriesCount', { count: item.countries })}</p></div>
                  <Badge variant="success">{tc('active')}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Bell size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">{t('notifications')}</h3><p className="text-xs text-t3">{t('notifPreferences')}</p></div>
            </div>
            <div className="space-y-2">
              {[t('notifLeaveApprovals'), t('notifExpenseSubmissions'), t('notifPerformanceReviews'), t('notifPayrollProcessing'), t('notifItRequests')].map(item => (
                <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <span className="text-xs text-t1">{item}</span><Badge variant="info">{t('emailPush')}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Palette size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">{t('branding')}</h3><p className="text-xs text-t3">{t('customizeAppearance')}</p></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('primaryColor')}</span><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-tempo-600" /><span className="text-xs text-t1 font-mono">#ea580c</span></div></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('logo')}</span><span className="text-xs text-t1">{t('logoValue')}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">{t('theme')}</span><Badge>{t('themeLight')}</Badge></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{t('teamMembers', { count: employees.length })}</CardTitle>
              <div className="flex gap-2">
                <Badge variant="orange">{t('admins', { count: admins.length })}</Badge>
                <Badge variant="info">{t('managers', { count: managers.length })}</Badge>
                <Badge>{t('employeesCount', { count: regularEmployees.length })}</Badge>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableMember')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableDepartment')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableTitle')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableRole')}</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3"><div className="flex items-center gap-3"><Avatar name={emp.profile?.full_name || ''} size="sm" /><div><p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p><p className="text-xs text-t3">{emp.profile?.email}</p></div></div></td>
                    <td className="px-4 py-3 text-sm text-t2">{getDepartmentName(emp.department_id)}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp.job_title}</td>
                    <td className="px-4 py-3"><Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>{emp.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowDeptModal(true)}>{t('addDepartment')}</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const empCount = employees.filter(e => e.department_id === dept.id).length
              const head = dept.head_id ? getEmployeeName(dept.head_id) : t('unassigned')
              return (
                <Card key={dept.id}>
                  <h3 className="text-sm font-semibold text-t1 mb-1">{dept.name}</h3>
                  <p className="text-xs text-t3 mb-3">{t('head', { name: head })}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-t2">{t('employeesCount', { count: empCount })}</span>
                    <Badge variant="success">{tc('active')}</Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'billing' && (
        <div>
          {billingLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-tempo-600" />
              <span className="ml-2 text-sm text-t3">Loading billing information...</span>
            </div>
          ) : (
            <>
              {/* Current Subscription */}
              {billingSubscription && (
                <div className="bg-card rounded-[14px] border border-border p-6 mb-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                      <CreditCard size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-t1">Current Subscription</h3>
                      <p className="text-xs text-t3">Manage your plan and billing details</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleManageSubscription}
                      disabled={billingActionLoading === 'portal'}
                    >
                      {billingActionLoading === 'portal' ? (
                        <Loader2 size={14} className="animate-spin mr-1.5" />
                      ) : (
                        <ExternalLink size={14} className="mr-1.5" />
                      )}
                      Manage Subscription
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Plan</p>
                      <p className="text-sm font-semibold text-t1">{billingSubscription.plan}</p>
                    </div>
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Status</p>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          billingSubscription.status === 'active' ? 'bg-green-500' :
                          billingSubscription.status === 'trialing' ? 'bg-blue-500' :
                          billingSubscription.status === 'past_due' ? 'bg-amber-500' :
                          'bg-red-500'
                        }`} />
                        <p className="text-sm font-semibold text-t1 capitalize">{billingSubscription.status}</p>
                      </div>
                    </div>
                    <div className="bg-canvas rounded-lg px-4 py-3">
                      <p className="text-xs text-t3 mb-1">Next Billing Date</p>
                      <p className="text-sm font-semibold text-t1">
                        {billingSubscription.currentPeriodEnd
                          ? new Date(billingSubscription.currentPeriodEnd).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                  {billingSubscription.trialEnd && billingSubscription.status === 'trialing' && (
                    <div className="mt-3 flex items-center gap-2 bg-blue-50 text-blue-700 rounded-lg px-3 py-2 text-xs">
                      <Sparkles size={14} />
                      <span>
                        Your trial ends on{' '}
                        {new Date(billingSubscription.trialEnd).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </span>
                    </div>
                  )}
                  {billingSubscription.cancelAtPeriodEnd && (
                    <div className="mt-3 flex items-center gap-2 bg-amber-50 text-amber-700 rounded-lg px-3 py-2 text-xs">
                      <AlertCircle size={14} />
                      <span>Your subscription will cancel at the end of the current billing period.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Pricing Tier Cards */}
              <h3 className="text-sm font-semibold text-t1 mb-3">Available Plans</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {(billingPlans.length > 0 ? billingPlans : [
                  { id: 'free', name: 'Free', pricePerEmployee: 0, maxEmployees: 10, tier: 'free', features: ['Up to 10 employees', 'Core HR', 'Basic Analytics'] },
                  { id: 'starter', name: 'Starter', pricePerEmployee: 800, maxEmployees: 100, tier: 'starter', features: ['Up to 100 employees', 'Core HR & People', 'Performance Management', 'Time & Attendance', 'Email Support'] },
                  { id: 'professional', name: 'Professional', pricePerEmployee: 1500, maxEmployees: 5000, tier: 'professional', features: ['Up to 5,000 employees', 'All Starter features', 'Payroll & Benefits', 'Recruiting & Expense', 'Learning & Engagement', 'API Access', 'Priority Support'] },
                  { id: 'enterprise', name: 'Enterprise', pricePerEmployee: 2500, maxEmployees: null, tier: 'enterprise', features: ['Unlimited employees', 'All Professional features', 'Multi-country Payroll', 'Advanced Analytics & AI', 'SSO & SCIM', 'Dedicated CSM', 'SLA Guarantee'] },
                ]).map((plan) => {
                  const isCurrentPlan = billingSubscription?.plan?.toLowerCase() === plan.name.toLowerCase()
                  const priceDisplay = plan.pricePerEmployee === 0
                    ? '$0'
                    : plan.tier === 'enterprise'
                      ? 'Custom'
                      : `$${(plan.pricePerEmployee / 100).toFixed(0)}`

                  const tierIcons: Record<string, React.ReactNode> = {
                    free: <Zap size={20} />,
                    starter: <CreditCard size={20} />,
                    professional: <Sparkles size={20} />,
                    enterprise: <Crown size={20} />,
                  }

                  return (
                    <div
                      key={plan.id}
                      className={`bg-card rounded-[14px] border p-5 flex flex-col ${
                        isCurrentPlan
                          ? 'border-tempo-600 ring-2 ring-tempo-600/20'
                          : 'border-border'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isCurrentPlan
                            ? 'bg-tempo-600 text-white'
                            : 'bg-canvas text-t1'
                        }`}>
                          {tierIcons[plan.tier] || <CreditCard size={20} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-t1">{plan.name}</h4>
                          {isCurrentPlan && (
                            <span className="text-[0.6rem] font-medium text-tempo-600">Current Plan</span>
                          )}
                        </div>
                      </div>

                      <div className="mb-4">
                        <span className="text-2xl font-bold text-t1">{priceDisplay}</span>
                        {plan.pricePerEmployee > 0 && plan.tier !== 'enterprise' && (
                          <span className="text-xs text-t3 ml-1">/user/mo</span>
                        )}
                        {plan.tier === 'enterprise' && (
                          <span className="text-xs text-t3 ml-1">pricing</span>
                        )}
                      </div>

                      <ul className="space-y-2 mb-5 flex-1">
                        {plan.features.map((feature) => (
                          <li key={feature} className="flex items-start gap-2 text-xs text-t2">
                            <Check size={14} className="text-green-500 mt-0.5 shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {isCurrentPlan ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          <Check size={14} className="mr-1.5" />
                          Current Plan
                        </Button>
                      ) : plan.tier === 'free' ? (
                        <Button variant="outline" size="sm" className="w-full" disabled>
                          Free Forever
                        </Button>
                      ) : plan.tier === 'enterprise' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          onClick={() => handleBillingUpgrade(plan.id)}
                          disabled={billingActionLoading === plan.id}
                        >
                          {billingActionLoading === plan.id ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : null}
                          Contact Sales
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-full bg-tempo-600 hover:bg-tempo-700 text-white"
                          onClick={() => handleBillingUpgrade(plan.id)}
                          disabled={billingActionLoading === plan.id}
                        >
                          {billingActionLoading === plan.id ? (
                            <Loader2 size={14} className="animate-spin mr-1.5" />
                          ) : null}
                          Upgrade
                        </Button>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      )}

      {activeTab === 'integrations' && (
        <div>
          {/* Integration Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Plug size={20} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('available')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{INTEGRATION_CATALOG.filter(c => c.status === 'available').length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center text-green-600"><Wifi size={18} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('connected')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{connectedIntegrations.filter(c => c.status === 'connected').length}</p>
                </div>
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600"><Clock size={18} /></div>
                <div>
                  <p className="text-xs text-t3">{ti('comingSoon')}</p>
                  <p className="text-xl font-bold text-t1 tracking-tight">{INTEGRATION_CATALOG.filter(c => c.status === 'coming_soon').length}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Available Integrations */}
          <h3 className="text-sm font-semibold text-t1 mb-3">{ti('availableIntegrations')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {INTEGRATION_CATALOG.filter(c => c.status === 'available').map(integration => {
              const connected = isConnected(integration.id)
              const connection = getConnection(integration.id)
              return (
                <Card key={integration.id}>
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t1 shrink-0">
                      {ICON_MAP[integration.icon] || <Plug size={24} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h4 className="text-sm font-semibold text-t1 truncate">{integration.name}</h4>
                        {connected && <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />}
                      </div>
                      <p className="text-xs text-t3 line-clamp-2">{integration.description}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mb-3">
                    <span className={`text-[0.6rem] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[integration.category] || 'bg-gray-50 text-gray-700'}`}>
                      {ti(`category_${integration.category}`)}
                    </span>
                    {integration.capabilities.slice(0, 3).map(cap => (
                      <span key={cap} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-canvas text-t2">{cap}</span>
                    ))}
                  </div>

                  {connected && connection ? (
                    <div>
                      <div className="flex items-center gap-1.5 mb-2">
                        <CheckCircle size={12} className="text-green-600" />
                        <span className="text-xs text-green-700 font-medium">{ti('connected')}</span>
                        {connection.lastSyncAt && (
                          <span className="text-[0.6rem] text-t3 ml-auto">
                            {ti('lastSync')}: {new Date(connection.lastSyncAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => handleSync(connection.id)}
                          disabled={syncing === connection.id}
                        >
                          {syncing === connection.id ? <Loader2 size={12} className="animate-spin mr-1" /> : <RefreshCw size={12} className="mr-1" />}
                          {ti('syncNow')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewLogs(connection.id)}
                        >
                          <Clock size={12} className="mr-1" />
                          {ti('syncHistory')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDisconnect(connection.id)}
                        >
                          <WifiOff size={12} />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full" onClick={() => openConnectModal(integration.id)}>
                      <Plug size={12} className="mr-1.5" />
                      {ti('connect')}
                    </Button>
                  )}
                </Card>
              )
            })}
          </div>

          {/* Coming Soon */}
          <h3 className="text-sm font-semibold text-t1 mb-3">{ti('comingSoon')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {INTEGRATION_CATALOG.filter(c => c.status === 'coming_soon').map(integration => (
              <Card key={integration.id} className="opacity-60">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t3 shrink-0">
                    {ICON_MAP[integration.icon] || <Plug size={24} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="text-sm font-semibold text-t1 truncate">{integration.name}</h4>
                      <Badge>{ti('comingSoon')}</Badge>
                    </div>
                    <p className="text-xs text-t3 line-clamp-2">{integration.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`text-[0.6rem] font-medium px-1.5 py-0.5 rounded ${CATEGORY_COLORS[integration.category] || 'bg-gray-50 text-gray-700'}`}>
                    {ti(`category_${integration.category}`)}
                  </span>
                  {integration.capabilities.slice(0, 3).map(cap => (
                    <span key={cap} className="text-[0.6rem] px-1.5 py-0.5 rounded bg-canvas text-t3">{cap}</span>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="relative mb-4 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input type="text" placeholder={t('searchAuditLog')} className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableTimestamp')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableUser')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableAction')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableEntity')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableDetails')}</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filteredAudit.length > 0 ? filteredAudit.slice(0, 50).map(entry => (
                    <tr key={entry.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t3 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock size={12} />{new Date(entry.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t1">{entry.user}</td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.action === 'create' ? 'success' : entry.action === 'update' ? 'info' : 'error'}>{entry.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{entry.entity_type}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[300px] truncate">{entry.details}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-t3">
                      {auditLog.length === 0 ? t('noAuditEntries') : t('noMatchingEntries')}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="space-y-4">
          {/* MFA Settings */}
          <Card>
            <MFASettings />
          </Card>

          {/* Other Security Features */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Shield size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">Security & Access</h3><p className="text-xs text-t3">Roles, permissions, and audit</p></div>
            </div>
            <div className="space-y-2">
              {['Role-Based Access Control (RBAC)', 'Audit Logging', 'Session Management', 'IP Allowlisting'].map(item => (
                <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <span className="text-xs text-t1">{item}</span><Badge variant="success">Enabled</Badge>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Edit Org Modal */}
      <Modal open={showOrgModal} onClose={() => setShowOrgModal(false)} title="Edit Organization">
        <div className="space-y-4">
          <Input label="Company Name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
          <Input label="Industry" value={orgForm.industry || ''} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Size" value={orgForm.size || ''} onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })} />
            <Input label="Country" value={orgForm.country || ''} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOrgModal(false)}>Cancel</Button>
            <Button onClick={submitOrg}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Department Modal */}
      <Modal open={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <div className="space-y-4">
          <Input label="Department Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
          <Select label="Department Head" value={deptForm.head_id} onChange={(e) => setDeptForm({ ...deptForm, head_id: e.target.value })} options={[{ value: '', label: 'Select head...' }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDeptModal(false)}>Cancel</Button>
            <Button onClick={submitDept}>Add Department</Button>
          </div>
        </div>
      </Modal>

      {/* Connect Integration Modal */}
      <Modal
        open={showConnectModal}
        onClose={() => { setShowConnectModal(false); setSelectedProvider(null); setConnectForm({}); setTestResult(null) }}
        title={`${ti('connect')}: ${INTEGRATION_CATALOG.find(c => c.id === selectedProvider)?.name || ''}`}
      >
        {selectedProvider && (
          <div className="space-y-4">
            <p className="text-xs text-t3 mb-2">
              {INTEGRATION_CATALOG.find(c => c.id === selectedProvider)?.description}
            </p>

            {getConfigSchema(selectedProvider).map(field => (
              <div key={field.key}>
                {field.type === 'select' ? (
                  <Select
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    value={connectForm[field.key] || ''}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    options={[
                      { value: '', label: `${ti('select')}...` },
                      ...(field.options || []),
                    ]}
                  />
                ) : (
                  <Input
                    label={`${field.label}${field.required ? ' *' : ''}`}
                    type={field.type === 'password' ? 'password' : 'text'}
                    value={connectForm[field.key] || ''}
                    onChange={(e) => setConnectForm(prev => ({ ...prev, [field.key]: e.target.value }))}
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}

            {testResult !== null && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${testResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {testResult ? <CheckCircle size={14} /> : <XCircle size={14} />}
                {testResult ? ti('testSuccess') : ti('testFailed')}
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestConnection}
                disabled={testing}
              >
                {testing ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <AlertCircle size={12} className="mr-1.5" />}
                {ti('testConnection')}
              </Button>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => { setShowConnectModal(false); setSelectedProvider(null); setConnectForm({}); setTestResult(null) }}>
                  {tc('cancel')}
                </Button>
                <Button onClick={handleConnect} disabled={connecting}>
                  {connecting ? <Loader2 size={14} className="animate-spin mr-1.5" /> : <Plug size={14} className="mr-1.5" />}
                  {ti('connect')}
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Sync Logs Modal */}
      <Modal
        open={showLogsModal}
        onClose={() => { setShowLogsModal(false); setIntegrationLogs([]) }}
        title={ti('syncHistory')}
      >
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {integrationLogs.length === 0 ? (
            <p className="text-sm text-t3 text-center py-8">{ti('noLogs')}</p>
          ) : (
            integrationLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 bg-canvas rounded-lg px-3 py-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${log.status === 'success' ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-t1 capitalize">{log.action}</span>
                    <Badge variant={log.status === 'success' ? 'success' : 'error'}>{log.status}</Badge>
                    {log.duration && <span className="text-[0.6rem] text-t3">{log.duration}ms</span>}
                  </div>
                  <div className="flex items-center gap-3 text-[0.6rem] text-t3">
                    <span>{new Date(log.createdAt).toLocaleString()}</span>
                    {(log.recordsProcessed || 0) > 0 && (
                      <span>{ti('recordsProcessed')}: {log.recordsProcessed}</span>
                    )}
                    {(log.recordsFailed || 0) > 0 && (
                      <span className="text-red-600">{ti('recordsFailed')}: {log.recordsFailed}</span>
                    )}
                  </div>
                  {log.errorMessage && (
                    <p className="text-[0.6rem] text-red-600 mt-1 truncate">{log.errorMessage}</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </>
  )
}
