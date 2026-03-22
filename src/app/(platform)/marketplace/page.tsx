'use client'

import { useState, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import {
  AppWindow, Search, Star, Download, Trash2, RefreshCw,
  Filter, ExternalLink, Check, X, ChevronRight, Package,
  Code, CreditCard, Globe, Shield, MessageSquare, Zap,
  BarChart3, Headphones, Settings, AlertTriangle,
  Key, Plus, Copy, Eye, EyeOff, Webhook, Activity,
  ArrowLeftRight, ArrowDown, ArrowUp, Clock, Unplug,
  Plug, CheckCircle, XCircle, RotateCw, FileCode,
  Hash, Lock, Clipboard, GripVertical, ArrowRight,
  Play, TestTube2, History, Map,
} from 'lucide-react'
import {
  getMarketplaceApps,
  getAppDetails,
  getCategories,
  installApp,
  uninstallApp,
  getInstalledApps,
  syncAppData,
  getMarketplaceStats,
  getSyncHistory,
} from '@/lib/marketplace'
import type { AppCategory, AppPricing, MarketplaceApp, InstalledApp } from '@/lib/marketplace'
import { useTempo } from '@/lib/store'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// ORG_ID is resolved from the org context at runtime (see component body)

const CATEGORY_ICONS: Record<AppCategory, React.ReactNode> = {
  HRIS: <Package size={14} />,
  Payroll: <CreditCard size={14} />,
  Benefits: <Shield size={14} />,
  Communication: <MessageSquare size={14} />,
  Productivity: <Zap size={14} />,
  Security: <Shield size={14} />,
  Finance: <BarChart3 size={14} />,
  'Developer Tools': <Code size={14} />,
  CRM: <Globe size={14} />,
  Support: <Headphones size={14} />,
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={
            s <= Math.round(rating)
              ? 'fill-amber-400 text-amber-400'
              : 'text-gray-300'
          }
        />
      ))}
    </div>
  )
}

function pricingBadge(pricing: AppPricing, details?: string) {
  const variant = pricing === 'free' ? 'success' : pricing === 'paid' ? 'error' : 'warning'
  const label = pricing === 'free' ? 'Free' : pricing === 'paid' ? 'Paid' : 'Freemium'
  return (
    <Badge variant={variant} title={details}>
      {label}
    </Badge>
  )
}

function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

// ---------------------------------------------------------------------------
// Connector Field Mapping Presets (used in Field Mapping Configuration UI)
// ---------------------------------------------------------------------------

interface ConnectorFieldPreset {
  source: string
  destination: string
  direction: 'inbound' | 'outbound' | 'bidirectional'
  required?: boolean
}

const CONNECTOR_FIELD_PRESETS: Record<string, ConnectorFieldPreset[]> = {
  'quickbooks-online': [
    { source: 'invoice_number', destination: 'DocNumber', direction: 'bidirectional', required: true },
    { source: 'total_amount', destination: 'TotalAmt', direction: 'bidirectional', required: true },
    { source: 'due_date', destination: 'DueDate', direction: 'bidirectional', required: true },
    { source: 'vendor.name', destination: 'DisplayName', direction: 'bidirectional', required: true },
    { source: 'vendor.email', destination: 'PrimaryEmailAddr.Address', direction: 'bidirectional' },
    { source: 'bill.amount', destination: 'TotalAmt', direction: 'inbound' },
    { source: 'gl_account.name', destination: 'Name', direction: 'inbound' },
    { source: 'gl_account.type', destination: 'AccountType', direction: 'inbound' },
  ],
  'xero-accounting': [
    { source: 'invoice_number', destination: 'InvoiceNumber', direction: 'bidirectional', required: true },
    { source: 'contact.name', destination: 'Name', direction: 'bidirectional', required: true },
    { source: 'contact.email', destination: 'EmailAddress', direction: 'bidirectional' },
    { source: 'total_amount', destination: 'Total', direction: 'inbound', required: true },
    { source: 'bank_txn.amount', destination: 'Total', direction: 'inbound' },
    { source: 'bank_txn.date', destination: 'DateString', direction: 'inbound' },
  ],
  'slack-workspace': [
    { source: 'department.name', destination: 'channel.name', direction: 'inbound', required: true },
    { source: 'department.member_count', destination: 'channel.num_members', direction: 'inbound' },
    { source: 'leave.type', destination: 'user.status_text', direction: 'outbound', required: true },
    { source: 'leave.end_date', destination: 'user.status_expiration', direction: 'outbound' },
    { source: 'notification.text', destination: 'message.text', direction: 'outbound', required: true },
  ],
  'bamboo-hr': [
    { source: 'profile.full_name', destination: 'displayName', direction: 'bidirectional', required: true },
    { source: 'profile.email', destination: 'workEmail', direction: 'bidirectional', required: true },
    { source: 'job_title', destination: 'jobTitle', direction: 'bidirectional' },
    { source: 'department_id', destination: 'department', direction: 'bidirectional' },
    { source: 'country', destination: 'location', direction: 'bidirectional' },
    { source: 'leave.type', destination: 'timeOff.type', direction: 'bidirectional', required: true },
    { source: 'leave.start_date', destination: 'timeOff.start', direction: 'bidirectional' },
    { source: 'leave.end_date', destination: 'timeOff.end', direction: 'bidirectional' },
  ],
  'default': [
    { source: 'profile.email', destination: 'email', direction: 'bidirectional', required: true },
    { source: 'profile.full_name', destination: 'full_name', direction: 'bidirectional', required: true },
    { source: 'department_id', destination: 'department', direction: 'bidirectional' },
    { source: 'job_title', destination: 'title', direction: 'bidirectional' },
    { source: 'country', destination: 'location', direction: 'bidirectional' },
    { source: 'profile.phone', destination: 'phone', direction: 'bidirectional' },
  ],
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function MarketplacePage() {
  const { addToast, org } = useTempo()
  const ORG_ID = org?.id || 'org-1'

  // State
  const [activeTab, setActiveTab] = useState('browse')
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<AppCategory | 'all'>('all')
  const [pricingFilter, setPricingFilter] = useState<AppPricing | 'all'>('all')
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null)
  const [, setRefreshKey] = useState(0)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: 'uninstall'; appId: string; appName: string } | null>(null)

  // Force re-render helper (needed because marketplace functions mutate in-memory state)
  const refresh = () => setRefreshKey((k) => k + 1)

  // Data
  const categories = getCategories()
  const stats = getMarketplaceStats(ORG_ID)
  const installedApps = getInstalledApps(ORG_ID)
  const installedIds = new Set(installedApps.map((i) => i.appId))

  // Filtered apps for browse tab
  const filteredApps = useMemo(() => {
    return getMarketplaceApps({
      category: categoryFilter !== 'all' ? categoryFilter : undefined,
      pricing: pricingFilter !== 'all' ? pricingFilter : undefined,
      search: searchTerm || undefined,
    })
  }, [categoryFilter, pricingFilter, searchTerm])

  // Selected app detail
  const selectedApp = selectedAppId ? getAppDetails(selectedAppId) : null
  const selectedInstallation = selectedAppId
    ? installedApps.find((i) => i.appId === selectedAppId) ?? null
    : null

  // Handlers
  function handleInstall(appId: string) {
    if (!appId) { addToast('No app selected', 'error'); return }
    if (installedIds.has(appId)) { addToast('App is already installed', 'error'); return }
    const app = getAppDetails(appId)
    if (!app) { addToast('App not found', 'error'); return }
    if (app.status === 'coming_soon') { addToast('This app is not yet available for installation', 'error'); return }
    setSaving(true)
    try {
      const result = installApp(ORG_ID, appId, { autoSync: true })
      if (result.success) {
        addToast(`${app.name} installed successfully`)
        refresh()
      } else {
        addToast('Failed to install app', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  function requestUninstall(appId: string, appName: string) {
    setConfirmAction({ show: true, type: 'uninstall', appId, appName })
  }

  function executeUninstall() {
    if (!confirmAction) return
    setSaving(true)
    try {
      const result = uninstallApp(ORG_ID, confirmAction.appId)
      if (result.success) {
        addToast('App uninstalled successfully')
        setSelectedAppId(null)
        refresh()
      } else {
        addToast('Failed to uninstall app', 'error')
      }
    } finally {
      setSaving(false)
      setConfirmAction(null)
    }
  }

  function handleSync(appId: string) {
    setSaving(true)
    try {
      syncAppData(ORG_ID, appId)
      addToast('Sync completed')
      refresh()
    } finally {
      setSaving(false)
    }
  }

  // ── New tab state ──
  const [configAppId, setConfigAppId] = useState<string | null>(null)
  const [configSyncSchedule, setConfigSyncSchedule] = useState('daily')
  const [configFieldMappings, setConfigFieldMappings] = useState<Array<{ source: string; destination: string }>>([
    { source: 'email', destination: 'email' },
    { source: 'name', destination: 'full_name' },
    { source: 'department', destination: 'department_id' },
  ])

  // API Keys state
  const [apiKeys, setApiKeys] = useState<Array<{
    id: string; name: string; keyPrefix: string; scopes: string[];
    lastUsedAt: string | null; expiresAt: string | null; isActive: boolean;
    createdAt: string; rawKey?: string
  }>>([
    { id: 'key-1', name: 'Production API', keyPrefix: 'tempo_8f3a2b', scopes: ['employees:read', 'payroll:read', 'departments:read'], lastUsedAt: new Date(Date.now() - 3600000).toISOString(), expiresAt: null, isActive: true, createdAt: new Date(Date.now() - 86400000 * 30).toISOString() },
    { id: 'key-2', name: 'Staging API', keyPrefix: 'tempo_c7d91e', scopes: ['employees:read'], lastUsedAt: new Date(Date.now() - 86400000 * 7).toISOString(), expiresAt: new Date(Date.now() + 86400000 * 60).toISOString(), isActive: true, createdAt: new Date(Date.now() - 86400000 * 15).toISOString() },
  ])
  const [showCreateKey, setShowCreateKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [newKeyScopes, setNewKeyScopes] = useState('employees:read')
  const [createdKeyRaw, setCreatedKeyRaw] = useState<string | null>(null)

  // Webhooks state
  const [webhooks, setWebhooks] = useState<Array<{
    id: string; url: string; secret: string; events: string[];
    isActive: boolean; lastDeliveryAt: string | null; failureCount: number; createdAt: string
  }>>([
    { id: 'wh-1', url: 'https://hooks.example.com/tempo', secret: 'whsec_abc123', events: ['employee.created', 'employee.updated', 'payroll.completed'], isActive: true, lastDeliveryAt: new Date(Date.now() - 1800000).toISOString(), failureCount: 0, createdAt: new Date(Date.now() - 86400000 * 20).toISOString() },
  ])
  const [showCreateWebhook, setShowCreateWebhook] = useState(false)
  const [newWebhookUrl, setNewWebhookUrl] = useState('')
  const [newWebhookEvents, setNewWebhookEvents] = useState('employee.created')

  // Health state
  const healthData = useMemo(() => {
    return installedApps.map((inst) => {
      const isHealthy = inst.status === 'active'
      return {
        appId: inst.appId,
        app: inst.app,
        status: isHealthy ? 'healthy' as const : inst.status === 'error' ? 'down' as const : 'degraded' as const,
        lastCheck: new Date(Date.now() - Math.floor(Math.random() * 300000)).toISOString(),
        errorCount: isHealthy ? 0 : Math.floor(Math.random() * 10) + 1,
        successRate: isHealthy ? 99.5 + Math.random() * 0.5 : 75 + Math.random() * 20,
        avgResponseTime: Math.floor(50 + Math.random() * 200),
        recordsSynced: Math.floor(Math.random() * 10000) + 100,
        recordsFailed: isHealthy ? 0 : Math.floor(Math.random() * 50),
        recordsSkipped: Math.floor(Math.random() * 20),
        retryQueueSize: isHealthy ? 0 : Math.floor(Math.random() * 5),
        recentErrors: isHealthy ? [] : [
          { timestamp: new Date(Date.now() - 60000).toISOString(), message: 'Connection timeout after 30s', code: 'TIMEOUT' },
          { timestamp: new Date(Date.now() - 120000).toISOString(), message: 'Rate limit exceeded (429)', code: 'RATE_LIMIT' },
        ],
      }
    })
  }, [installedApps])

  // API usage analytics demo
  const apiUsage = useMemo(() => ({
    totalCalls: 34521,
    callsToday: 423,
    callsThisWeek: 2847,
    callsThisMonth: 11203,
    rateLimit: { limit: 10000, remaining: 7634, resetAt: new Date(Date.now() + 3600000).toISOString() },
    topEndpoints: [
      { path: '/api/v1/employees', calls: 4821, avgLatency: 45 },
      { path: '/api/v1/payroll', calls: 2340, avgLatency: 120 },
      { path: '/api/v1/leave-requests', calls: 1823, avgLatency: 65 },
      { path: '/api/v1/departments', calls: 892, avgLatency: 30 },
    ],
    errorRate: '1.2',
  }), [])

  function handleCreateApiKey() {
    if (!newKeyName.trim()) { addToast('Key name is required', 'error'); return }
    const rawKey = 'tempo_' + Math.random().toString(36).substring(2, 26) + Math.random().toString(36).substring(2, 10)
    const newKey = {
      id: 'key-' + Date.now(),
      name: newKeyName,
      keyPrefix: rawKey.substring(0, 12),
      scopes: newKeyScopes.split(',').map(s => s.trim()),
      lastUsedAt: null,
      expiresAt: null,
      isActive: true,
      createdAt: new Date().toISOString(),
      rawKey,
    }
    setApiKeys(prev => [...prev, newKey])
    setCreatedKeyRaw(rawKey)
    setNewKeyName('')
    addToast('API key created')
  }

  function handleRevokeApiKey(keyId: string) {
    setApiKeys(prev => prev.map(k => k.id === keyId ? { ...k, isActive: false } : k))
    addToast('API key revoked')
  }

  function handleCreateWebhook() {
    if (!newWebhookUrl.trim()) { addToast('Webhook URL is required', 'error'); return }
    const newHook = {
      id: 'wh-' + Date.now(),
      url: newWebhookUrl,
      secret: 'whsec_' + Math.random().toString(36).substring(2, 18),
      events: newWebhookEvents.split(',').map(s => s.trim()),
      isActive: true,
      lastDeliveryAt: null,
      failureCount: 0,
      createdAt: new Date().toISOString(),
    }
    setWebhooks(prev => [...prev, newHook])
    setShowCreateWebhook(false)
    setNewWebhookUrl('')
    addToast('Webhook created')
  }

  function handleDeleteWebhook(whId: string) {
    setWebhooks(prev => prev.filter(w => w.id !== whId))
    addToast('Webhook deleted')
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    addToast('Copied to clipboard')
  }

  // Tabs config
  const tabs = [
    { id: 'browse', label: 'Catalog', count: stats.totalAppsAvailable },
    { id: 'installed', label: 'Installed', count: stats.totalInstalled },
    { id: 'api', label: 'API' },
    { id: 'health', label: 'Health' },
  ]

  return (
    <>
      <Header
        title="App Marketplace"
        subtitle="Browse, install, and manage integrations for your organization"
        actions={
          <Button size="sm" variant="outline" onClick={() => setActiveTab('installed')}>
            <Settings size={14} /> Manage Installed ({stats.totalInstalled})
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          label="Available Apps"
          value={stats.totalAppsAvailable}
          icon={<AppWindow size={20} />}
        />
        <StatCard
          label="Installed"
          value={stats.totalInstalled}
          change={`${stats.activeIntegrations} active`}
          changeType="positive"
          icon={<Download size={20} />}
          href="/it/apps"
        />
        <StatCard
          label="Categories"
          value={categories.length}
          change="across all integrations"
          changeType="neutral"
          icon={<Filter size={20} />}
        />
        <StatCard
          label="Error Integrations"
          value={stats.errorIntegrations}
          change={stats.errorIntegrations > 0 ? 'needs attention' : 'all healthy'}
          changeType={stats.errorIntegrations > 0 ? 'negative' : 'positive'}
          icon={<RefreshCw size={20} />}
        />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================= */}
      {/* BROWSE TAB                                                     */}
      {/* ============================================================= */}
      {activeTab === 'browse' && (
        <>
          {/* Search & pricing filter */}
          <div className="flex flex-col md:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                placeholder="Search apps by name, category, or developer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-[var(--radius-input)] text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
              />
            </div>
            <Select
              value={pricingFilter}
              onChange={(e) => setPricingFilter(e.target.value as AppPricing | 'all')}
              options={[
                { value: 'all', label: 'All Pricing' },
                { value: 'free', label: 'Free' },
                { value: 'freemium', label: 'Freemium' },
                { value: 'paid', label: 'Paid' },
              ]}
              className="w-40"
            />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-tempo-600 text-white'
                  : 'bg-canvas text-t2 hover:bg-gray-200'
              }`}
            >
              <AppWindow size={12} />
              All ({stats.totalAppsAvailable})
            </button>
            {categories.map(({ category, count }) => (
              <button
                key={category}
                onClick={() => setCategoryFilter(category)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  categoryFilter === category
                    ? 'bg-tempo-600 text-white'
                    : 'bg-canvas text-t2 hover:bg-gray-200'
                }`}
              >
                {CATEGORY_ICONS[category]}
                {category} ({count})
              </button>
            ))}
          </div>

          {/* App Grid */}
          {filteredApps.length === 0 ? (
            <div className="text-center py-16">
              <AppWindow size={40} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2">No apps match your filters</p>
              <p className="text-xs text-t3 mt-1">Try adjusting your search or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredApps.map((app) => {
                const isInstalled = installedIds.has(app.id)
                return (
                  <Card key={app.id} className="flex flex-col hover:border-tempo-300 transition-colors cursor-pointer" onClick={() => setSelectedAppId(app.id)}>
                    <div className="flex items-start gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-lg flex-shrink-0">
                        {app.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-t1 truncate">{app.name}</h3>
                          {isInstalled && (
                            <Badge variant="success">
                              <Check size={10} className="mr-0.5" /> Installed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-t3 truncate">{app.developer}</p>
                      </div>
                      {pricingBadge(app.pricing, app.pricingDetails)}
                    </div>

                    <p className="text-xs text-t2 mb-3 line-clamp-2 flex-1">{app.description}</p>

                    <div className="flex items-center justify-between pt-3 border-t border-divider">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {renderStars(app.rating)}
                          <span className="text-xs text-t3 ml-1">{app.rating}</span>
                        </div>
                        <span className="text-xs text-t3">
                          <Download size={10} className="inline mr-0.5" />
                          {formatNumber(app.installCount)}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        variant={isInstalled ? 'secondary' : 'primary'}
                        disabled={saving}
                        onClick={(e) => {
                          e.stopPropagation()
                          if (isInstalled) {
                            requestUninstall(app.id, app.name)
                          } else {
                            handleInstall(app.id)
                          }
                        }}
                      >
                        {isInstalled ? (
                          <><Trash2 size={12} /> Remove</>
                        ) : (
                          <><Download size={12} /> Install</>
                        )}
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ============================================================= */}
      {/* INSTALLED TAB                                                  */}
      {/* ============================================================= */}
      {activeTab === 'installed' && (
        <>
          {installedApps.length === 0 ? (
            <div className="text-center py-16">
              <Package size={40} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2">No apps installed yet</p>
              <p className="text-xs text-t3 mt-1">Browse the marketplace to find integrations for your organization</p>
              <Button size="sm" className="mt-4" onClick={() => setActiveTab('browse')}>
                Browse Apps
              </Button>
            </div>
          ) : (
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Installed Integrations ({installedApps.length})</CardTitle>
                  <Badge variant="success">{stats.activeIntegrations} active</Badge>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {installedApps.map((inst) => {
                  const app = inst.app
                  const statusVariant =
                    inst.status === 'active' ? 'success' :
                    inst.status === 'error' ? 'error' :
                    inst.status === 'paused' ? 'warning' : 'default'
                  // Determine sync direction for display
                  const syncDirections = ['bidirectional', 'inbound', 'outbound'] as const
                  const syncDir = syncDirections[Math.abs(app.name.charCodeAt(0)) % 3]
                  const SyncIcon = syncDir === 'bidirectional' ? ArrowLeftRight : syncDir === 'inbound' ? ArrowDown : ArrowUp
                  return (
                    <div key={inst.appId} className="px-6 py-4 hover:bg-canvas/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-lg flex-shrink-0">
                          {app.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-t1">{app.name}</p>
                            <Badge variant={statusVariant}>
                              {inst.status === 'active' ? <><span className="w-1.5 h-1.5 rounded-full bg-white inline-block mr-1" />connected</> : inst.status.replace('_', ' ')}
                            </Badge>
                            <Badge variant="default">
                              <SyncIcon size={10} className="mr-0.5" /> {syncDir}
                            </Badge>
                          </div>
                          <p className="text-xs text-t3">
                            {app.category} &middot; {app.developer}
                            {inst.lastSyncAt && <> &middot; Last sync: {timeAgo(inst.lastSyncAt)}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {inst.status === 'error' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={saving}
                              onClick={() => { handleSync(app.id); addToast('Reconnecting...') }}
                            >
                              <Plug size={12} /> Reconnect
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedAppId(app.id)}
                          >
                            <Settings size={12} /> Configure
                          </Button>
                          {inst.status === 'active' && (
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={saving}
                              onClick={() => handleSync(app.id)}
                            >
                              <RefreshCw size={12} /> Sync Now
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            disabled={saving}
                            onClick={() => requestUninstall(app.id, app.name)}
                          >
                            <Unplug size={12} className="text-error" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* Category Coverage */}
          {installedApps.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">Category Coverage</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {stats.categoryCoverage.map(({ category, installed, available }) => (
                  <div key={category} className="bg-canvas rounded-lg p-3 text-center">
                    <div className="flex items-center justify-center mb-2 text-tempo-600">
                      {CATEGORY_ICONS[category]}
                    </div>
                    <p className="text-xs font-medium text-t1">{category}</p>
                    <p className="text-[0.6rem] text-t3 mt-0.5">
                      {installed} / {available} installed
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Recent Syncs */}
          {stats.recentSyncs.length > 0 && (
            <Card className="mt-6">
              <h3 className="text-sm font-semibold text-t1 mb-4">Recent Sync Activity</h3>
              <div className="space-y-2">
                {stats.recentSyncs.slice(0, 5).map((sync) => {
                  const app = getAppDetails(sync.appId)
                  const syncVariant =
                    sync.status === 'success' ? 'success' :
                    sync.status === 'partial' ? 'warning' :
                    sync.status === 'failed' ? 'error' : 'info'
                  return (
                    <div key={sync.id} className="flex items-center justify-between bg-canvas rounded-lg px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{app?.icon || '?'}</span>
                        <div>
                          <p className="text-xs font-medium text-t1">{app?.name || sync.appId}</p>
                          <p className="text-[0.6rem] text-t3">{timeAgo(sync.startedAt)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-t3">{sync.recordsSynced} records</span>
                        <Badge variant={syncVariant}>{sync.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {/* ── Field Mapping & Sync Configuration ── */}
          {installedApps.length > 0 && (
            <Card className="mt-6" padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Map size={16} /> Field Mapping Configuration
                  </CardTitle>
                  <Badge variant="info">{installedApps.length} connectors</Badge>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {installedApps.map((inst) => {
                  const app = inst.app
                  const isExpanded = configAppId === inst.appId
                  const connectorMappings = CONNECTOR_FIELD_PRESETS[inst.appId] || CONNECTOR_FIELD_PRESETS['default']
                  const syncHistoryData = getSyncHistory(ORG_ID, inst.appId)
                  const syncHistoryRecords = syncHistoryData.records

                  return (
                    <div key={`mapping-${inst.appId}`} className="px-6 py-4">
                      {/* Connector row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-base flex-shrink-0">
                            {app.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-t1">{app.name}</p>
                            <p className="text-[0.6rem] text-t3">
                              {connectorMappings.length} field mappings &middot;
                              Schedule: {configSyncSchedule}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              addToast(`Running dry-run sync for ${app.name}...`)
                              setTimeout(() => {
                                addToast(`Dry run complete: 0 errors, ${Math.floor(Math.random() * 50) + 10} records would be synced`)
                              }, 1200)
                            }}
                          >
                            <TestTube2 size={12} /> Test Sync
                          </Button>
                          <Button
                            size="sm"
                            variant={isExpanded ? 'primary' : 'outline'}
                            onClick={() => setConfigAppId(isExpanded ? null : inst.appId)}
                          >
                            <Settings size={12} /> {isExpanded ? 'Close' : 'Configure'}
                          </Button>
                        </div>
                      </div>

                      {/* Expanded field mapping panel */}
                      {isExpanded && (
                        <div className="mt-4 space-y-4">
                          {/* Sync schedule */}
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <Clock size={12} className="text-t3" />
                              <span className="text-xs text-t2">Sync Schedule:</span>
                            </div>
                            <Select
                              value={configSyncSchedule}
                              onChange={(e) => setConfigSyncSchedule(e.target.value)}
                              options={[
                                { value: 'realtime', label: 'Real-time (webhook)' },
                                { value: '5min', label: 'Every 5 minutes' },
                                { value: '15min', label: 'Every 15 minutes' },
                                { value: 'hourly', label: 'Hourly' },
                                { value: 'daily', label: 'Daily' },
                              ]}
                              className="w-48"
                            />
                          </div>

                          {/* Field mapping table */}
                          <div className="border border-divider rounded-lg overflow-hidden">
                            <div className="grid grid-cols-[1fr_40px_1fr_80px] gap-0 bg-canvas px-4 py-2 text-[0.65rem] font-semibold text-t3 uppercase tracking-wider">
                              <span>Tempo Field</span>
                              <span></span>
                              <span>{app.name} Field</span>
                              <span className="text-center">Direction</span>
                            </div>
                            {connectorMappings.map((mapping, idx) => (
                              <div
                                key={`${inst.appId}-map-${idx}`}
                                className="grid grid-cols-[1fr_40px_1fr_80px] gap-0 items-center px-4 py-2.5 border-t border-divider hover:bg-canvas/50 transition-colors"
                              >
                                <div className="flex items-center gap-2">
                                  <GripVertical size={12} className="text-t3 cursor-grab" />
                                  <span className="text-xs font-mono text-t1">{mapping.source}</span>
                                  {mapping.required && <span className="text-[0.55rem] text-error">*</span>}
                                </div>
                                <div className="flex justify-center">
                                  {mapping.direction === 'bidirectional'
                                    ? <ArrowLeftRight size={14} className="text-tempo-600" />
                                    : mapping.direction === 'inbound'
                                    ? <ArrowDown size={14} className="text-blue-500" />
                                    : <ArrowUp size={14} className="text-green-500" />
                                  }
                                </div>
                                <span className="text-xs font-mono text-t1">{mapping.destination}</span>
                                <div className="flex justify-center">
                                  <Badge variant={
                                    mapping.direction === 'bidirectional' ? 'info' :
                                    mapping.direction === 'inbound' ? 'default' : 'success'
                                  }>
                                    {mapping.direction === 'bidirectional' ? 'both' : mapping.direction}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Add mapping row */}
                          <div className="flex items-center gap-3">
                            <Button size="sm" variant="outline" onClick={() => {
                              setConfigFieldMappings(prev => [
                                ...prev,
                                { source: '', destination: '' },
                              ])
                              addToast('Add field mapping above and save')
                            }}>
                              <Plus size={12} /> Add Field Mapping
                            </Button>
                            <Button size="sm" variant="primary" onClick={() => {
                              addToast(`Field mappings saved for ${app.name}`)
                            }}>
                              <Check size={12} /> Save Mappings
                            </Button>
                          </div>

                          {/* Sync History */}
                          {syncHistoryRecords.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5">
                                <History size={12} /> Sync History
                              </h4>
                              <div className="space-y-1.5">
                                {syncHistoryRecords.slice(0, 5).map((sh) => (
                                  <div key={sh.id} className="flex items-center justify-between bg-canvas rounded px-3 py-2">
                                    <div className="flex items-center gap-3">
                                      <Badge variant={sh.status === 'success' ? 'success' : sh.status === 'partial' ? 'warning' : 'error'}>
                                        {sh.status}
                                      </Badge>
                                      <span className="text-[0.65rem] text-t3">{timeAgo(sh.startedAt)}</span>
                                    </div>
                                    <div className="flex items-center gap-4 text-[0.65rem]">
                                      <span className="text-success">{sh.recordsSynced} synced</span>
                                      {sh.errors.length > 0 && (
                                        <span className="text-error">{sh.errors.length} errors</span>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================= */}
      {/* API TAB                                                         */}
      {/* ============================================================= */}
      {activeTab === 'api' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label="Total API Calls" value={apiUsage.totalCalls.toLocaleString()} icon={<Activity size={20} />} />
            <StatCard label="Calls Today" value={apiUsage.callsToday} change={`${apiUsage.errorRate}% error rate`} changeType="neutral" icon={<BarChart3 size={20} />} />
            <StatCard label="Active Keys" value={apiKeys.filter(k => k.isActive).length} icon={<Key size={20} />} />
            <StatCard label="Webhooks" value={webhooks.length} change={`${webhooks.filter(w => w.isActive).length} active`} changeType="positive" icon={<Webhook size={20} />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* API Keys Management */}
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Key size={16} /> API Keys</CardTitle>
                  <Button size="sm" onClick={() => { setShowCreateKey(true); setCreatedKeyRaw(null) }}>
                    <Plus size={12} /> Create Key
                  </Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {apiKeys.map((key) => (
                  <div key={key.id} className="px-6 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${key.isActive ? 'bg-success' : 'bg-gray-300'}`} />
                      <div>
                        <p className="text-xs font-medium text-t1">{key.name}</p>
                        <p className="text-[0.65rem] text-t3 font-mono">{key.keyPrefix}...{key.isActive ? '' : ' (revoked)'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex flex-wrap gap-1">
                        {key.scopes.slice(0, 2).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-canvas rounded text-[0.6rem] text-t3">{s}</span>
                        ))}
                        {key.scopes.length > 2 && <span className="text-[0.6rem] text-t3">+{key.scopes.length - 2}</span>}
                      </div>
                      {key.isActive && (
                        <Button size="sm" variant="ghost" onClick={() => handleRevokeApiKey(key.id)}>
                          <XCircle size={12} className="text-error" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {apiKeys.length === 0 && (
                  <div className="px-6 py-8 text-center text-xs text-t3">No API keys created yet</div>
                )}
              </div>
            </Card>

            {/* Webhook Subscriptions */}
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2"><Webhook size={16} /> Webhooks</CardTitle>
                  <Button size="sm" onClick={() => setShowCreateWebhook(true)}>
                    <Plus size={12} /> Add Webhook
                  </Button>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {webhooks.map((wh) => (
                  <div key={wh.id} className="px-6 py-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${wh.isActive ? 'bg-success' : 'bg-gray-300'}`} />
                        <p className="text-xs font-medium text-t1 truncate max-w-[220px]">{wh.url}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => copyToClipboard(wh.secret)}>
                          <Copy size={10} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteWebhook(wh.id)}>
                          <Trash2 size={10} className="text-error" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-1">
                      {wh.events.map(ev => (
                        <span key={ev} className="px-1.5 py-0.5 bg-canvas rounded text-[0.6rem] text-t3">{ev}</span>
                      ))}
                    </div>
                    <p className="text-[0.6rem] text-t3">
                      {wh.lastDeliveryAt ? `Last delivery: ${timeAgo(wh.lastDeliveryAt)}` : 'No deliveries yet'}
                      {wh.failureCount > 0 && <span className="text-error ml-2">{wh.failureCount} failures</span>}
                    </p>
                  </div>
                ))}
                {webhooks.length === 0 && (
                  <div className="px-6 py-8 text-center text-xs text-t3">No webhooks configured</div>
                )}
              </div>
            </Card>
          </div>

          {/* Rate Limit & Usage */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
                <BarChart3 size={16} /> Rate Limit Status
              </h3>
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-t2">Usage</span>
                  <span className="text-xs font-medium text-t1">
                    {(apiUsage.rateLimit.limit - apiUsage.rateLimit.remaining).toLocaleString()} / {apiUsage.rateLimit.limit.toLocaleString()}
                  </span>
                </div>
                <Progress value={((apiUsage.rateLimit.limit - apiUsage.rateLimit.remaining) / apiUsage.rateLimit.limit) * 100} color="orange" />
              </div>
              <p className="text-xs text-t3">
                <Clock size={10} className="inline mr-1" />
                Resets at {new Date(apiUsage.rateLimit.resetAt).toLocaleTimeString()}
              </p>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
                <Activity size={16} /> Top Endpoints
              </h3>
              <div className="space-y-3">
                {apiUsage.topEndpoints.map((ep) => (
                  <div key={ep.path} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileCode size={12} className="text-t3" />
                      <span className="text-xs font-mono text-t1">{ep.path}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-t3">{ep.calls.toLocaleString()} calls</span>
                      <Badge variant="default">{ep.avgLatency}ms</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Available Events */}
          <Card className="mt-6">
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <FileCode size={16} /> Available Webhook Events
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                'employee.created', 'employee.updated', 'employee.terminated',
                'payroll.completed', 'payroll.approved', 'leave.requested',
                'leave.approved', 'leave.rejected', 'expense.submitted',
                'expense.approved', 'review.completed', 'onboarding.started',
                'offboarding.started', 'device.assigned', 'integration.synced',
                'integration.error',
              ].map(ev => (
                <div key={ev} className="flex items-center gap-2 px-3 py-2 bg-canvas rounded-lg">
                  <Hash size={10} className="text-t3 flex-shrink-0" />
                  <span className="text-xs font-mono text-t2">{ev}</span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      {/* ============================================================= */}
      {/* HEALTH TAB                                                      */}
      {/* ============================================================= */}
      {activeTab === 'health' && (
        <>
          {healthData.length === 0 ? (
            <div className="text-center py-16">
              <Activity size={40} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t2">No integrations installed</p>
              <p className="text-xs text-t3 mt-1">Install integrations to see their health status</p>
              <Button size="sm" className="mt-4" onClick={() => setActiveTab('browse')}>Browse Apps</Button>
            </div>
          ) : (
            <>
              {/* Health summary cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <StatCard
                  label="Healthy"
                  value={healthData.filter(h => h.status === 'healthy').length}
                  icon={<CheckCircle size={20} className="text-success" />}
                />
                <StatCard
                  label="Degraded"
                  value={healthData.filter(h => h.status === 'degraded').length}
                  change={healthData.filter(h => h.status === 'degraded').length > 0 ? 'needs attention' : 'none'}
                  changeType={healthData.filter(h => h.status === 'degraded').length > 0 ? 'negative' : 'positive'}
                  icon={<AlertTriangle size={20} className="text-warning" />}
                />
                <StatCard
                  label="Down"
                  value={healthData.filter(h => h.status === 'down').length}
                  change={healthData.filter(h => h.status === 'down').length > 0 ? 'critical' : 'all up'}
                  changeType={healthData.filter(h => h.status === 'down').length > 0 ? 'negative' : 'positive'}
                  icon={<XCircle size={20} className="text-error" />}
                />
                <StatCard
                  label="Total Records Synced"
                  value={healthData.reduce((a, h) => a + h.recordsSynced, 0).toLocaleString()}
                  icon={<RefreshCw size={20} />}
                />
              </div>

              {/* Integration Health List */}
              <Card padding="none">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity size={16} /> Integration Health Dashboard
                  </CardTitle>
                </CardHeader>
                <div className="divide-y divide-divider">
                  {healthData.map((h) => (
                    <div key={h.appId} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-lg">
                            {h.app.icon}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-t1">{h.app.name}</p>
                              <Badge variant={h.status === 'healthy' ? 'success' : h.status === 'degraded' ? 'warning' : 'error'}>
                                {h.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-t3">Last checked: {timeAgo(h.lastCheck)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-xs font-medium text-t1">{h.successRate.toFixed(1)}%</p>
                            <p className="text-[0.6rem] text-t3">success rate</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-medium text-t1">{h.avgResponseTime}ms</p>
                            <p className="text-[0.6rem] text-t3">avg latency</p>
                          </div>
                        </div>
                      </div>

                      {/* Data quality metrics */}
                      <div className="grid grid-cols-4 gap-3 mb-2">
                        <div className="bg-canvas rounded px-3 py-2 text-center">
                          <p className="text-xs font-bold text-success">{h.recordsSynced.toLocaleString()}</p>
                          <p className="text-[0.6rem] text-t3">synced</p>
                        </div>
                        <div className="bg-canvas rounded px-3 py-2 text-center">
                          <p className="text-xs font-bold text-error">{h.recordsFailed}</p>
                          <p className="text-[0.6rem] text-t3">failed</p>
                        </div>
                        <div className="bg-canvas rounded px-3 py-2 text-center">
                          <p className="text-xs font-bold text-t2">{h.recordsSkipped}</p>
                          <p className="text-[0.6rem] text-t3">skipped</p>
                        </div>
                        <div className="bg-canvas rounded px-3 py-2 text-center">
                          <p className="text-xs font-bold text-warning">{h.retryQueueSize}</p>
                          <p className="text-[0.6rem] text-t3">retry queue</p>
                        </div>
                      </div>

                      {/* Error logs */}
                      {h.recentErrors.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {h.recentErrors.map((err, i) => (
                            <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded text-xs">
                              <AlertTriangle size={10} className="text-error flex-shrink-0" />
                              <span className="text-error font-mono text-[0.65rem]">[{err.code}]</span>
                              <span className="text-t2">{err.message}</span>
                              <span className="text-t3 ml-auto">{timeAgo(err.timestamp)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </>
          )}
        </>
      )}

      {/* ============================================================= */}
      {/* CREATE API KEY MODAL                                            */}
      {/* ============================================================= */}
      <Modal open={showCreateKey} onClose={() => { setShowCreateKey(false); setCreatedKeyRaw(null) }} title="Create API Key" size="sm">
        {createdKeyRaw ? (
          <div className="space-y-4">
            <div className="bg-green-50 rounded-lg p-4">
              <p className="text-xs font-medium text-success mb-2">API key created successfully!</p>
              <p className="text-xs text-t2 mb-2">Copy this key now. You will not be able to see it again.</p>
              <div className="flex items-center gap-2 bg-white rounded p-2 border border-divider">
                <code className="text-xs font-mono text-t1 flex-1 break-all">{createdKeyRaw}</code>
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(createdKeyRaw)}>
                  <Copy size={12} />
                </Button>
              </div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => { setShowCreateKey(false); setCreatedKeyRaw(null) }}>Done</Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              label="Key Name"
              placeholder="e.g. Production API Key"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
            />
            <Input
              label="Scopes (comma-separated)"
              placeholder="employees:read, payroll:read"
              value={newKeyScopes}
              onChange={e => setNewKeyScopes(e.target.value)}
            />
            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs text-t2 flex items-center gap-1">
                <Shield size={12} />
                Available scopes: employees:read, employees:write, payroll:read, departments:read, leave:read, leave:write, expenses:read
              </p>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" onClick={() => setShowCreateKey(false)}>Cancel</Button>
              <Button onClick={handleCreateApiKey}><Key size={14} /> Create Key</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ============================================================= */}
      {/* CREATE WEBHOOK MODAL                                            */}
      {/* ============================================================= */}
      <Modal open={showCreateWebhook} onClose={() => setShowCreateWebhook(false)} title="Add Webhook" size="sm">
        <div className="space-y-4">
          <Input
            label="Endpoint URL"
            placeholder="https://your-app.com/webhooks/tempo"
            value={newWebhookUrl}
            onChange={e => setNewWebhookUrl(e.target.value)}
          />
          <Input
            label="Events (comma-separated)"
            placeholder="employee.created, payroll.completed"
            value={newWebhookEvents}
            onChange={e => setNewWebhookEvents(e.target.value)}
          />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t2 flex items-center gap-1">
              <Lock size={12} />
              A signing secret will be generated automatically to verify webhook payloads.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateWebhook(false)}>Cancel</Button>
            <Button onClick={handleCreateWebhook}><Webhook size={14} /> Create Webhook</Button>
          </div>
        </div>
      </Modal>

      {/* ============================================================= */}
      {/* APP DETAIL MODAL                                               */}
      {/* ============================================================= */}
      <Modal
        open={!!selectedApp}
        onClose={() => setSelectedAppId(null)}
        title={selectedApp?.name || ''}
        size="lg"
      >
        {selectedApp && (
          <div className="space-y-6">
            {/* Header section */}
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-xl bg-canvas flex items-center justify-center text-2xl flex-shrink-0">
                {selectedApp.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-t1">{selectedApp.name}</h3>
                  {selectedApp.status === 'beta' && <Badge variant="warning">Beta</Badge>}
                  {selectedApp.status === 'coming_soon' && <Badge>Coming Soon</Badge>}
                  {pricingBadge(selectedApp.pricing, selectedApp.pricingDetails)}
                </div>
                <p className="text-xs text-t3 mb-2">by {selectedApp.developer}</p>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    {renderStars(selectedApp.rating)}
                    <span className="text-xs text-t2 ml-1">{selectedApp.rating}</span>
                    <span className="text-xs text-t3">({selectedApp.reviewCount} reviews)</span>
                  </div>
                  <span className="text-xs text-t3">
                    <Download size={10} className="inline mr-0.5" />
                    {formatNumber(selectedApp.installCount)} installs
                  </span>
                </div>
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <Button size="sm" variant="outline" onClick={() => window.open(selectedApp.website, '_blank')}>
                  <ExternalLink size={12} /> Website
                </Button>
                {installedIds.has(selectedApp.id) ? (
                  <Button size="sm" variant="danger" disabled={saving} onClick={() => requestUninstall(selectedApp.id, selectedApp.name)}>
                    <Trash2 size={12} /> Uninstall
                  </Button>
                ) : (
                  <Button size="sm" disabled={saving} onClick={() => handleInstall(selectedApp.id)}>
                    <Download size={12} /> Install
                  </Button>
                )}
              </div>
            </div>

            {/* Installed status banner */}
            {selectedInstallation && (
              <div className={`rounded-lg px-4 py-3 text-xs ${
                selectedInstallation.status === 'active'
                  ? 'bg-green-50 text-success'
                  : selectedInstallation.status === 'error'
                  ? 'bg-red-50 text-error'
                  : 'bg-amber-50 text-warning'
              }`}>
                <div className="flex items-center justify-between">
                  <span>
                    <Check size={12} className="inline mr-1" />
                    Installed &middot; Status: {selectedInstallation.status.replace('_', ' ')}
                    {selectedInstallation.lastSyncAt && <> &middot; Last sync: {timeAgo(selectedInstallation.lastSyncAt)}</>}
                  </span>
                  {selectedInstallation.status === 'active' && (
                    <Button size="sm" variant="outline" disabled={saving} onClick={() => handleSync(selectedApp.id)}>
                      <RefreshCw size={12} /> Sync Now
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">About</h4>
              <p className="text-xs text-t2 leading-relaxed">{selectedApp.longDescription}</p>
            </div>

            {/* Pricing details */}
            {selectedApp.pricingDetails && (
              <div>
                <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Pricing</h4>
                <p className="text-xs text-t2">{selectedApp.pricingDetails}</p>
              </div>
            )}

            {/* Features */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Features</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {selectedApp.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <Check size={14} className="text-success flex-shrink-0 mt-0.5" />
                    <span className="text-xs text-t2">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup instructions */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Setup Instructions</h4>
              <ol className="space-y-2">
                {selectedApp.setupInstructions.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-tempo-100 text-tempo-700 text-[0.6rem] font-semibold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-xs text-t2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Required permissions */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Required Permissions</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApp.requiredScopes.map((scope) => (
                  <span key={scope} className="px-2.5 py-1 bg-canvas rounded-full text-[0.65rem] font-medium text-t2">
                    <Shield size={10} className="inline mr-1" />
                    {scope}
                  </span>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <h4 className="text-xs font-semibold text-t1 mb-2 uppercase tracking-wide">Tags</h4>
              <div className="flex flex-wrap gap-2">
                {selectedApp.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 bg-canvas rounded-full text-[0.65rem] text-t3">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-full bg-error/10">
              <AlertTriangle size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">Uninstall App</p>
              <p className="text-xs text-t3 mt-1">
                Are you sure you want to uninstall <span className="font-medium text-t1">{confirmAction?.appName}</span>? This will remove all synced data and cannot be undone.
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="danger" disabled={saving} onClick={executeUninstall}>Uninstall</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
