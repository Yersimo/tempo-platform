'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Textarea } from '@/components/ui/input'
import {
  Code, Key, Webhook, Shield, Plus, Trash2, Copy, Check, Eye, EyeOff,
  RefreshCw, Terminal, Globe, Lock, AlertTriangle, ExternalLink,
  ChevronRight, Hash, Zap, BookOpen, Package, Search,
} from 'lucide-react'
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  registerWebhookEndpoint,
  listWebhookEndpoints,
  deleteWebhookEndpoint,
  registerOAuthApp,
  listOAuthApps,
  revokeOAuthApp,
  getSDKConfig,
  AVAILABLE_SCOPES,
  WEBHOOK_EVENTS,
  SDK_LANGUAGES,
} from '@/lib/developer-portal'
import type {
  ApiKeyListItem,
  ApiKeyCreateResult,
  ApiScope,
  WebhookEvent,
  WebhookEndpointRecord,
  OAuthAppListItem,
  OAuthAppCreateResult,
  SDKConfig,
  SDKLanguage,
  SDKEndpoint,
} from '@/lib/developer-portal'
import { useTempo } from '@/lib/store'

export default function DeveloperPortalPage() {
  const { org, addToast } = useTempo()
  const ORG_ID = org?.id || 'org-1'
  const [activeTab, setActiveTab] = useState('api-keys')
  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; type: string; id: string; label: string } | null>(null)

  // ---- API Keys state ----
  const [apiKeys, setApiKeys] = useState<ApiKeyListItem[]>([])
  const [apiKeysLoading, setApiKeysLoading] = useState(true)
  const [showCreateKeyModal, setShowCreateKeyModal] = useState(false)
  const [showKeySuccessModal, setShowKeySuccessModal] = useState(false)
  const [createdKey, setCreatedKey] = useState<ApiKeyCreateResult | null>(null)
  const [keyForm, setKeyForm] = useState({ name: '', scopes: [] as ApiScope[], expiresInDays: '' })
  const [keyCreating, setKeyCreating] = useState(false)
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null)
  const [copiedFullKey, setCopiedFullKey] = useState(false)

  // ---- Webhooks state ----
  const [webhooks, setWebhooks] = useState<WebhookEndpointRecord[]>([])
  const [webhooksLoading, setWebhooksLoading] = useState(true)
  const [showWebhookModal, setShowWebhookModal] = useState(false)
  const [webhookForm, setWebhookForm] = useState({ url: '', events: [] as WebhookEvent[] })
  const [webhookCreating, setWebhookCreating] = useState(false)

  // ---- OAuth Apps state ----
  const [oauthApps, setOauthApps] = useState<OAuthAppListItem[]>([])
  const [oauthLoading, setOauthLoading] = useState(true)
  const [showOAuthModal, setShowOAuthModal] = useState(false)
  const [showOAuthSecretModal, setShowOAuthSecretModal] = useState(false)
  const [createdOAuthApp, setCreatedOAuthApp] = useState<OAuthAppCreateResult | null>(null)
  const [oauthForm, setOauthForm] = useState({ appName: '', redirectUris: '', scopes: [] as ApiScope[] })
  const [oauthCreating, setOauthCreating] = useState(false)
  const [copiedClientSecret, setCopiedClientSecret] = useState(false)
  const [copiedClientId, setCopiedClientId] = useState(false)

  // ---- SDK & Docs state ----
  const [sdkConfig, setSdkConfig] = useState<SDKConfig | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState(0)
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null)
  const [showFullKey, setShowFullKey] = useState(false)

  // ---- Load data ----
  const loadApiKeys = useCallback(async () => {
    setApiKeysLoading(true)
    try {
      const keys = await listApiKeys(ORG_ID)
      setApiKeys(keys)
    } catch (e) {
      console.error('Failed to load API keys:', e)
    } finally {
      setApiKeysLoading(false)
    }
  }, [])

  const loadWebhooks = useCallback(async () => {
    setWebhooksLoading(true)
    try {
      const endpoints = await listWebhookEndpoints(ORG_ID)
      setWebhooks(endpoints)
    } catch (e) {
      console.error('Failed to load webhooks:', e)
    } finally {
      setWebhooksLoading(false)
    }
  }, [])

  const loadOAuthApps = useCallback(async () => {
    setOauthLoading(true)
    try {
      const apps = await listOAuthApps(ORG_ID)
      setOauthApps(apps)
    } catch (e) {
      console.error('Failed to load OAuth apps:', e)
    } finally {
      setOauthLoading(false)
    }
  }, [])

  const loadSDKConfig = useCallback(() => {
    try {
      const config = getSDKConfig(ORG_ID)
      setSdkConfig(config)
    } catch (e) {
      console.error('Failed to load SDK config:', e)
    }
  }, [])

  useEffect(() => {
    loadApiKeys()
    loadWebhooks()
    loadOAuthApps()
    loadSDKConfig()
  }, [loadApiKeys, loadWebhooks, loadOAuthApps, loadSDKConfig])

  // ---- Computed stats ----
  const totalKeys = apiKeys.length
  const activeKeys = apiKeys.filter(k => k.isActive).length
  const totalRequests = apiKeys.reduce((sum, k) => sum + k.totalRequests, 0)

  // ---- Clipboard helpers ----
  async function copyToClipboard(text: string, id: string, setter: (v: string | null) => void) {
    try {
      await navigator.clipboard.writeText(text)
      setter(id)
      setTimeout(() => setter(null), 2000)
    } catch {
      // fallback
    }
  }

  async function copyBoolToClipboard(text: string, setter: (v: boolean) => void) {
    try {
      await navigator.clipboard.writeText(text)
      setter(true)
      setTimeout(() => setter(false), 2000)
    } catch {
      // fallback
    }
  }

  // ---- API Key actions ----
  async function handleCreateKey() {
    if (!keyForm.name.trim()) { addToast('Key name is required', 'error'); return }
    if (keyForm.scopes.length === 0) { addToast('Select at least one scope', 'error'); return }
    setKeyCreating(true)
    setSaving(true)
    try {
      const expiresIn = keyForm.expiresInDays ? parseInt(keyForm.expiresInDays, 10) : undefined
      const result = await createApiKey(ORG_ID, keyForm.name, keyForm.scopes, expiresIn)
      setCreatedKey(result)
      setShowCreateKeyModal(false)
      setShowKeySuccessModal(true)
      setKeyForm({ name: '', scopes: [], expiresInDays: '' })
      await loadApiKeys()
      addToast('API key created successfully')
    } catch (e) {
      console.error('Failed to create API key:', e)
      addToast('Failed to create API key', 'error')
    } finally {
      setKeyCreating(false)
      setSaving(false)
    }
  }

  async function handleRevokeKey(keyId: string) {
    setSaving(true)
    try {
      await revokeApiKey(ORG_ID, keyId)
      await loadApiKeys()
      addToast('API key revoked')
    } catch (e) {
      console.error('Failed to revoke API key:', e)
      addToast('Failed to revoke API key', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleKeyScope(scope: ApiScope) {
    setKeyForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }))
  }

  // ---- Webhook actions ----
  async function handleRegisterWebhook() {
    if (!webhookForm.url.trim()) { addToast('Endpoint URL is required', 'error'); return }
    try { new URL(webhookForm.url) } catch { addToast('Enter a valid URL', 'error'); return }
    if (webhookForm.events.length === 0) { addToast('Select at least one event', 'error'); return }
    setWebhookCreating(true)
    setSaving(true)
    try {
      await registerWebhookEndpoint(ORG_ID, webhookForm.url, webhookForm.events)
      setShowWebhookModal(false)
      setWebhookForm({ url: '', events: [] })
      await loadWebhooks()
      addToast('Webhook endpoint registered')
    } catch (e) {
      console.error('Failed to register webhook:', e)
      addToast('Failed to register webhook', 'error')
    } finally {
      setWebhookCreating(false)
      setSaving(false)
    }
  }

  async function handleDeleteWebhook(endpointId: string) {
    setSaving(true)
    try {
      await deleteWebhookEndpoint(ORG_ID, endpointId)
      await loadWebhooks()
      addToast('Webhook endpoint deleted')
    } catch (e) {
      console.error('Failed to delete webhook:', e)
      addToast('Failed to delete webhook', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleWebhookEvent(event: WebhookEvent) {
    setWebhookForm(prev => ({
      ...prev,
      events: prev.events.includes(event)
        ? prev.events.filter(e => e !== event)
        : [...prev.events, event],
    }))
  }

  // Group webhook events by category
  const webhookEventsByCategory = useMemo(() => {
    const grouped: Record<string, typeof WEBHOOK_EVENTS> = {}
    for (const item of WEBHOOK_EVENTS) {
      if (!grouped[item.category]) grouped[item.category] = []
      grouped[item.category].push(item)
    }
    return grouped
  }, [])

  // ---- OAuth App actions ----
  async function handleRegisterOAuth() {
    if (!oauthForm.appName.trim()) { addToast('App name is required', 'error'); return }
    if (!oauthForm.redirectUris.trim()) { addToast('At least one redirect URI is required', 'error'); return }
    if (oauthForm.scopes.length === 0) { addToast('Select at least one scope', 'error'); return }
    setOauthCreating(true)
    setSaving(true)
    try {
      const uris = oauthForm.redirectUris.split('\n').map(u => u.trim()).filter(Boolean)
      const result = await registerOAuthApp(ORG_ID, oauthForm.appName, uris, oauthForm.scopes)
      setCreatedOAuthApp(result)
      setShowOAuthModal(false)
      setShowOAuthSecretModal(true)
      setOauthForm({ appName: '', redirectUris: '', scopes: [] })
      await loadOAuthApps()
      addToast('OAuth app registered successfully')
    } catch (e) {
      console.error('Failed to register OAuth app:', e)
      addToast('Failed to register OAuth app', 'error')
    } finally {
      setOauthCreating(false)
      setSaving(false)
    }
  }

  async function handleRevokeOAuth(appId: string) {
    setSaving(true)
    try {
      await revokeOAuthApp(ORG_ID, appId)
      await loadOAuthApps()
      addToast('OAuth app revoked')
    } catch (e) {
      console.error('Failed to revoke OAuth app:', e)
      addToast('Failed to revoke OAuth app', 'error')
    } finally {
      setSaving(false)
    }
  }

  function toggleOAuthScope(scope: ApiScope) {
    setOauthForm(prev => ({
      ...prev,
      scopes: prev.scopes.includes(scope)
        ? prev.scopes.filter(s => s !== scope)
        : [...prev.scopes, scope],
    }))
  }

  const currentLanguage: SDKLanguage | undefined = sdkConfig?.sdkLanguages[selectedLanguage] ?? SDK_LANGUAGES[selectedLanguage]
  const endpoints: SDKEndpoint[] = sdkConfig?.availableEndpoints ?? []

  // ---- Confirmation handler ----
  function executeConfirmAction() {
    if (!confirmAction) return
    if (confirmAction.type === 'revoke-key') {
      handleRevokeKey(confirmAction.id)
    } else if (confirmAction.type === 'delete-webhook') {
      handleDeleteWebhook(confirmAction.id)
    } else if (confirmAction.type === 'revoke-oauth') {
      handleRevokeOAuth(confirmAction.id)
    }
    setConfirmAction(null)
  }

  // ---- Search / filter ----
  const q = searchQuery.toLowerCase()
  const filteredApiKeys = useMemo(() =>
    apiKeys.filter(k => !q || k.name.toLowerCase().includes(q) || k.prefix.toLowerCase().includes(q) || k.scopes.some(s => s.toLowerCase().includes(q))),
    [apiKeys, q]
  )
  const filteredWebhooks = useMemo(() =>
    webhooks.filter(w => !q || w.url.toLowerCase().includes(q) || w.events.some(e => e.toLowerCase().includes(q))),
    [webhooks, q]
  )
  const filteredOAuthApps = useMemo(() =>
    oauthApps.filter(a => !q || a.appName.toLowerCase().includes(q) || a.clientId.toLowerCase().includes(q) || a.scopes.some(s => s.toLowerCase().includes(q))),
    [oauthApps, q]
  )
  const filteredEndpoints = useMemo(() =>
    endpoints.filter(ep => !q || ep.path.toLowerCase().includes(q) || ep.description.toLowerCase().includes(q) || ep.method.toLowerCase().includes(q)),
    [endpoints, q]
  )

  // ---- Tabs config ----
  const tabs = [
    { id: 'api-keys', label: 'API Keys', count: activeKeys },
    { id: 'webhooks', label: 'Webhooks', count: webhooks.filter(w => w.isActive).length },
    { id: 'oauth', label: 'OAuth Apps', count: oauthApps.filter(a => a.isActive).length },
    { id: 'sdk-docs', label: 'SDK & Docs' },
  ]

  // Method color helper
  function methodColor(method: string): 'success' | 'info' | 'warning' | 'error' | 'orange' {
    switch (method) {
      case 'GET': return 'success'
      case 'POST': return 'info'
      case 'PUT': return 'warning'
      case 'PATCH': return 'orange'
      case 'DELETE': return 'error'
      default: return 'info'
    }
  }

  return (
    <>
      <Header
        title="Developer Portal"
        subtitle="API keys, webhooks, OAuth apps, and SDK documentation"
        actions={
          <div className="flex gap-2">
            {activeTab === 'api-keys' && (
              <Button size="sm" onClick={() => { setKeyForm({ name: '', scopes: [], expiresInDays: '' }); setShowCreateKeyModal(true) }}>
                <Plus size={14} /> Create API Key
              </Button>
            )}
            {activeTab === 'webhooks' && (
              <Button size="sm" onClick={() => { setWebhookForm({ url: '', events: [] }); setShowWebhookModal(true) }}>
                <Plus size={14} /> Register Endpoint
              </Button>
            )}
            {activeTab === 'oauth' && (
              <Button size="sm" onClick={() => { setOauthForm({ appName: '', redirectUris: '', scopes: [] }); setShowOAuthModal(true) }}>
                <Plus size={14} /> Register App
              </Button>
            )}
            {activeTab === 'sdk-docs' && (
              <Button size="sm" variant="outline" onClick={() => window.open('https://docs.tempo-platform.com', '_blank')}>
                <ExternalLink size={14} /> Full Docs
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total API Keys" value={totalKeys} icon={<Key size={20} />} />
        <StatCard label="Active Keys" value={activeKeys} change={totalKeys > 0 ? `${Math.round((activeKeys / totalKeys) * 100)}% active` : 'No keys yet'} changeType="positive" icon={<Shield size={20} />} />
        <StatCard label="Total Requests" value={totalRequests.toLocaleString()} icon={<Zap size={20} />} />
        <StatCard label="Webhook Endpoints" value={webhooks.filter(w => w.isActive).length} icon={<Webhook size={20} />} />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Search bar */}
      <div className="relative mb-6">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
        <input
          type="text"
          placeholder={activeTab === 'api-keys' ? 'Search keys by name, prefix, or scope...' : activeTab === 'webhooks' ? 'Search webhooks by URL or event...' : activeTab === 'oauth' ? 'Search apps by name, client ID, or scope...' : 'Search endpoints by path, method, or description...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs border border-divider rounded-lg bg-surface text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20 focus:border-tempo-600"
        />
      </div>

      {/* ==================== TAB 1: API Keys ==================== */}
      {activeTab === 'api-keys' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>API Keys</CardTitle>
              <Button size="sm" onClick={() => { setKeyForm({ name: '', scopes: [], expiresInDays: '' }); setShowCreateKeyModal(true) }}>
                <Plus size={14} /> Create Key
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Name</th>
                  <th className="tempo-th text-left px-4 py-3">Key Prefix</th>
                  <th className="tempo-th text-left px-4 py-3">Scopes</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Requests</th>
                  <th className="tempo-th text-left px-4 py-3">Last Used</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {apiKeysLoading && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">
                      <RefreshCw size={16} className="inline animate-spin mr-2" />
                      Loading API keys...
                    </td>
                  </tr>
                )}
                {!apiKeysLoading && apiKeys.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                          <Key size={24} className="text-t3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">No API keys yet</p>
                          <p className="text-xs text-t3 mt-1">Create an API key to start integrating with the Tempo platform.</p>
                        </div>
                        <Button size="sm" onClick={() => { setKeyForm({ name: '', scopes: [], expiresInDays: '' }); setShowCreateKeyModal(true) }}>
                          <Plus size={14} /> Create API Key
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!apiKeysLoading && apiKeys.length > 0 && filteredApiKeys.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">
                      No API keys match your search.
                    </td>
                  </tr>
                )}
                {!apiKeysLoading && filteredApiKeys.map(key => (
                  <tr key={key.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-t1">{key.name}</p>
                      <p className="text-xs text-t3">{key.tier} tier</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <code className="text-xs font-mono bg-canvas px-2 py-0.5 rounded text-t2">{key.prefix}...</code>
                        <button
                          onClick={() => copyToClipboard(key.prefix, key.id, setCopiedKeyId)}
                          className="p-1 text-t3 hover:text-t1 rounded transition-colors"
                          title="Copy prefix"
                        >
                          {copiedKeyId === key.id ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {key.scopes.slice(0, 3).map(scope => (
                          <Badge key={scope} variant="default">{scope}</Badge>
                        ))}
                        {key.scopes.length > 3 && (
                          <Badge variant="default">+{key.scopes.length - 3}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={key.isActive ? 'success' : 'error'}>
                        {key.isActive ? 'Active' : key.revokedAt ? 'Revoked' : 'Expired'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs font-medium text-t1">{key.totalRequests.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-t3">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {key.isActive && (
                        <Button size="sm" variant="danger" onClick={() => setConfirmAction({ show: true, type: 'revoke-key', id: key.id, label: key.name })}>
                          <Trash2 size={12} /> Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==================== TAB 2: Webhooks ==================== */}
      {activeTab === 'webhooks' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Webhook Endpoints</CardTitle>
              <Button size="sm" onClick={() => { setWebhookForm({ url: '', events: [] }); setShowWebhookModal(true) }}>
                <Plus size={14} /> Register Endpoint
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">URL</th>
                  <th className="tempo-th text-left px-4 py-3">Events</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Deliveries</th>
                  <th className="tempo-th text-left px-4 py-3">Last Delivered</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {webhooksLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">
                      <RefreshCw size={16} className="inline animate-spin mr-2" />
                      Loading webhooks...
                    </td>
                  </tr>
                )}
                {!webhooksLoading && webhooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                          <Webhook size={24} className="text-t3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">No webhook endpoints</p>
                          <p className="text-xs text-t3 mt-1">Register a webhook endpoint to receive real-time event notifications.</p>
                        </div>
                        <Button size="sm" onClick={() => { setWebhookForm({ url: '', events: [] }); setShowWebhookModal(true) }}>
                          <Plus size={14} /> Register Endpoint
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!webhooksLoading && webhooks.length > 0 && filteredWebhooks.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">
                      No webhooks match your search.
                    </td>
                  </tr>
                )}
                {!webhooksLoading && filteredWebhooks.map(wh => (
                  <tr key={wh.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-t3 shrink-0" />
                        <code className="text-xs font-mono text-t1 truncate max-w-[280px]">{wh.url}</code>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {wh.events.slice(0, 2).map(ev => (
                          <Badge key={ev} variant="default">{ev}</Badge>
                        ))}
                        {wh.events.length > 2 && (
                          <Badge variant="default">+{wh.events.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={wh.isActive ? 'success' : 'error'}>
                        {wh.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <span className="text-xs text-success font-medium">{wh.successCount} ok</span>
                        <span className="text-xs text-error font-medium">{wh.failureCount} fail</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-t3">
                        {wh.lastDeliveredAt
                          ? new Date(wh.lastDeliveredAt).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {wh.isActive && (
                        <Button size="sm" variant="danger" onClick={() => setConfirmAction({ show: true, type: 'delete-webhook', id: wh.id, label: wh.url })}>
                          <Trash2 size={12} /> Delete
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==================== TAB 3: OAuth Apps ==================== */}
      {activeTab === 'oauth' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>OAuth Applications</CardTitle>
              <Button size="sm" onClick={() => { setOauthForm({ appName: '', redirectUris: '', scopes: [] }); setShowOAuthModal(true) }}>
                <Plus size={14} /> Register App
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">App Name</th>
                  <th className="tempo-th text-left px-4 py-3">Client ID</th>
                  <th className="tempo-th text-left px-4 py-3">Redirect URIs</th>
                  <th className="tempo-th text-left px-4 py-3">Scopes</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {oauthLoading && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">
                      <RefreshCw size={16} className="inline animate-spin mr-2" />
                      Loading OAuth apps...
                    </td>
                  </tr>
                )}
                {!oauthLoading && oauthApps.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-canvas flex items-center justify-center">
                          <Shield size={24} className="text-t3" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">No OAuth applications</p>
                          <p className="text-xs text-t3 mt-1">Register an OAuth application to enable third-party integrations.</p>
                        </div>
                        <Button size="sm" onClick={() => { setOauthForm({ appName: '', redirectUris: '', scopes: [] }); setShowOAuthModal(true) }}>
                          <Plus size={14} /> Register App
                        </Button>
                      </div>
                    </td>
                  </tr>
                )}
                {!oauthLoading && oauthApps.length > 0 && filteredOAuthApps.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">
                      No OAuth apps match your search.
                    </td>
                  </tr>
                )}
                {!oauthLoading && filteredOAuthApps.map(app => (
                  <tr key={app.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <p className="text-xs font-medium text-t1">{app.appName}</p>
                      <p className="text-xs text-t3">Created {new Date(app.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono bg-canvas px-2 py-0.5 rounded text-t2 truncate block max-w-[180px]">
                        {app.clientId}
                      </code>
                    </td>
                    <td className="px-4 py-3">
                      <div className="space-y-0.5 max-w-[200px]">
                        {app.redirectUris.slice(0, 2).map((uri, i) => (
                          <p key={i} className="text-xs text-t3 truncate">{uri}</p>
                        ))}
                        {app.redirectUris.length > 2 && (
                          <p className="text-xs text-t3">+{app.redirectUris.length - 2} more</p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-[180px]">
                        {app.scopes.slice(0, 2).map(scope => (
                          <Badge key={scope} variant="default">{scope}</Badge>
                        ))}
                        {app.scopes.length > 2 && (
                          <Badge variant="default">+{app.scopes.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={app.isActive ? 'success' : 'error'}>
                        {app.isActive ? 'Active' : 'Revoked'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {app.isActive && (
                        <Button size="sm" variant="danger" onClick={() => setConfirmAction({ show: true, type: 'revoke-oauth', id: app.id, label: app.appName })}>
                          <Trash2 size={12} /> Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ==================== TAB 4: SDK & Docs ==================== */}
      {activeTab === 'sdk-docs' && (
        <div className="space-y-6">
          {/* Language selector */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">
              <Package size={16} className="inline mr-2 -mt-0.5" />
              SDK Installation
            </h3>
            <div className="flex flex-wrap gap-2 mb-6">
              {(sdkConfig?.sdkLanguages ?? SDK_LANGUAGES).map((lang, idx) => (
                <button
                  key={lang.language}
                  onClick={() => setSelectedLanguage(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    selectedLanguage === idx
                      ? 'bg-tempo-600 text-white'
                      : 'bg-canvas text-t2 hover:text-t1 hover:bg-gray-200'
                  }`}
                >
                  {lang.language}
                </button>
              ))}
            </div>

            {currentLanguage && (
              <div className="space-y-4">
                {/* Install command */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-t2">
                      <Terminal size={12} className="inline mr-1 -mt-0.5" />
                      Installation
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentLanguage.installCommand, 'install', setCopiedSnippet)}
                      className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors"
                    >
                      {copiedSnippet === 'install' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copiedSnippet === 'install' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                    <code>{currentLanguage.installCommand}</code>
                  </pre>
                </div>

                {/* Init snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-t2">
                      <Code size={12} className="inline mr-1 -mt-0.5" />
                      Initialization
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentLanguage.initSnippet, 'init', setCopiedSnippet)}
                      className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors"
                    >
                      {copiedSnippet === 'init' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copiedSnippet === 'init' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                    <code>{currentLanguage.initSnippet}</code>
                  </pre>
                </div>

                {/* Example snippet */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-t2">
                      <BookOpen size={12} className="inline mr-1 -mt-0.5" />
                      Example Usage
                    </span>
                    <button
                      onClick={() => copyToClipboard(currentLanguage.exampleSnippet, 'example', setCopiedSnippet)}
                      className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors"
                    >
                      {copiedSnippet === 'example' ? <Check size={12} className="text-success" /> : <Copy size={12} />}
                      {copiedSnippet === 'example' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 text-xs font-mono overflow-x-auto">
                    <code>{currentLanguage.exampleSnippet}</code>
                  </pre>
                </div>
              </div>
            )}
          </Card>

          {/* API Endpoint Reference */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  <Hash size={14} className="inline mr-1.5 -mt-0.5" />
                  API Endpoint Reference
                </CardTitle>
                <Badge variant="info">{sdkConfig?.apiVersion ?? 'v1'}</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Method</th>
                    <th className="tempo-th text-left px-4 py-3">Path</th>
                    <th className="tempo-th text-left px-4 py-3">Description</th>
                    <th className="tempo-th text-left px-4 py-3">Scopes</th>
                    <th className="tempo-th text-center px-4 py-3">Rate Limit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEndpoints.map((ep, idx) => (
                    <tr key={`${ep.method}-${ep.path}-${idx}`} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <Badge variant={methodColor(ep.method)}>
                          {ep.method}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono text-t1">{ep.path}</code>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-t2">{ep.description}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {ep.requiredScopes.map(scope => (
                            <Badge key={scope} variant="default">
                              <Lock size={8} className="mr-0.5" />
                              {scope}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-xs text-t3">
                          {ep.rateLimit ? `${ep.rateLimit}/min` : 'Standard'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ==================== MODALS ==================== */}

      {/* Create API Key Modal */}
      <Modal open={showCreateKeyModal} onClose={() => setShowCreateKeyModal(false)} title="Create API Key" size="lg">
        <div className="space-y-4">
          <Input
            label="Key Name"
            placeholder="e.g. Production Backend, CI/CD Pipeline"
            value={keyForm.name}
            onChange={(e) => setKeyForm({ ...keyForm, name: e.target.value })}
          />
          <Input
            label="Expires In (days, optional)"
            placeholder="Leave blank for no expiration"
            type="number"
            min={1}
            value={keyForm.expiresInDays}
            onChange={(e) => setKeyForm({ ...keyForm, expiresInDays: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-t1 mb-2">
              Scopes ({keyForm.scopes.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-divider rounded-lg p-3">
              {AVAILABLE_SCOPES.map(({ scope, label, description }) => (
                <label
                  key={scope}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-canvas cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={keyForm.scopes.includes(scope)}
                    onChange={() => toggleKeyScope(scope)}
                    className="mt-0.5 rounded border-divider text-tempo-600 focus:ring-tempo-600"
                  />
                  <div>
                    <p className="text-xs font-medium text-t1">{label}</p>
                    <p className="text-[0.65rem] text-t3">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateKeyModal(false)}>Cancel</Button>
            <Button onClick={handleCreateKey} disabled={keyCreating || !keyForm.name.trim() || keyForm.scopes.length === 0}>
              {keyCreating ? <><RefreshCw size={14} className="animate-spin" /> Creating...</> : 'Create Key'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* API Key Created Success Modal */}
      <Modal open={showKeySuccessModal} onClose={() => { setShowKeySuccessModal(false); setCreatedKey(null); setShowFullKey(false); setCopiedFullKey(false) }} title="API Key Created" size="lg">
        {createdKey && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Save your API key now</p>
                <p className="text-xs text-amber-700 mt-1">
                  This is the only time the full API key will be displayed. Copy it now and store it securely. You will not be able to see it again.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Key Name</label>
              <p className="text-sm text-t2">{createdKey.name}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">API Key</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-gray-900 text-gray-100 px-3 py-2 rounded-lg break-all">
                  {showFullKey ? createdKey.key : createdKey.prefix + '************************************'}
                </code>
                <button
                  onClick={() => setShowFullKey(!showFullKey)}
                  className="p-2 text-t3 hover:text-t1 rounded-lg hover:bg-canvas transition-colors"
                  title={showFullKey ? 'Hide key' : 'Show key'}
                >
                  {showFullKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
                <button
                  onClick={() => copyBoolToClipboard(createdKey.key, setCopiedFullKey)}
                  className="p-2 text-t3 hover:text-t1 rounded-lg hover:bg-canvas transition-colors"
                  title="Copy key"
                >
                  {copiedFullKey ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Key ID</label>
                <p className="text-xs text-t3 font-mono">{createdKey.keyId}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-t1 mb-1">Expires</label>
                <p className="text-xs text-t3">{createdKey.expiresAt ? new Date(createdKey.expiresAt).toLocaleDateString() : 'Never'}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Scopes</label>
              <div className="flex flex-wrap gap-1">
                {createdKey.scopes.map(scope => (
                  <Badge key={scope} variant="default">{scope}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => { setShowKeySuccessModal(false); setCreatedKey(null); setShowFullKey(false); setCopiedFullKey(false) }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Register Webhook Modal */}
      <Modal open={showWebhookModal} onClose={() => setShowWebhookModal(false)} title="Register Webhook Endpoint" size="lg">
        <div className="space-y-4">
          <Input
            label="Endpoint URL"
            placeholder="https://your-server.com/webhooks/tempo"
            value={webhookForm.url}
            onChange={(e) => setWebhookForm({ ...webhookForm, url: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-t1 mb-2">
              Events ({webhookForm.events.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto border border-divider rounded-lg p-3 space-y-4">
              {Object.entries(webhookEventsByCategory).map(([category, events]) => (
                <div key={category}>
                  <p className="text-[0.65rem] font-semibold text-t3 uppercase tracking-wider mb-2">{category}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {events.map(({ event, label }) => (
                      <label
                        key={event}
                        className="flex items-center gap-2 p-1.5 rounded hover:bg-canvas cursor-pointer transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={webhookForm.events.includes(event)}
                          onChange={() => toggleWebhookEvent(event)}
                          className="rounded border-divider text-tempo-600 focus:ring-tempo-600"
                        />
                        <span className="text-xs text-t1">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowWebhookModal(false)}>Cancel</Button>
            <Button onClick={handleRegisterWebhook} disabled={webhookCreating || !webhookForm.url.trim() || webhookForm.events.length === 0}>
              {webhookCreating ? <><RefreshCw size={14} className="animate-spin" /> Registering...</> : 'Register Endpoint'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Register OAuth App Modal */}
      <Modal open={showOAuthModal} onClose={() => setShowOAuthModal(false)} title="Register OAuth Application" size="lg">
        <div className="space-y-4">
          <Input
            label="Application Name"
            placeholder="e.g. My Integration App"
            value={oauthForm.appName}
            onChange={(e) => setOauthForm({ ...oauthForm, appName: e.target.value })}
          />
          <Textarea
            label="Redirect URIs (one per line)"
            placeholder={"https://your-app.com/callback\nhttp://localhost:3000/callback"}
            rows={3}
            value={oauthForm.redirectUris}
            onChange={(e) => setOauthForm({ ...oauthForm, redirectUris: e.target.value })}
          />
          <div>
            <label className="block text-xs font-medium text-t1 mb-2">
              Scopes ({oauthForm.scopes.length} selected)
            </label>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border border-divider rounded-lg p-3">
              {AVAILABLE_SCOPES.map(({ scope, label, description }) => (
                <label
                  key={scope}
                  className="flex items-start gap-2 p-2 rounded-lg hover:bg-canvas cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={oauthForm.scopes.includes(scope)}
                    onChange={() => toggleOAuthScope(scope)}
                    className="mt-0.5 rounded border-divider text-tempo-600 focus:ring-tempo-600"
                  />
                  <div>
                    <p className="text-xs font-medium text-t1">{label}</p>
                    <p className="text-[0.65rem] text-t3">{description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOAuthModal(false)}>Cancel</Button>
            <Button onClick={handleRegisterOAuth} disabled={oauthCreating || !oauthForm.appName.trim() || !oauthForm.redirectUris.trim() || oauthForm.scopes.length === 0}>
              {oauthCreating ? <><RefreshCw size={14} className="animate-spin" /> Registering...</> : 'Register App'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} className="text-error" />
            </div>
            <div>
              <p className="text-sm font-medium text-t1">
                {confirmAction?.type === 'revoke-key' && 'Revoke this API key?'}
                {confirmAction?.type === 'delete-webhook' && 'Delete this webhook endpoint?'}
                {confirmAction?.type === 'revoke-oauth' && 'Revoke this OAuth application?'}
              </p>
              <p className="text-xs text-t3 mt-1">
                {confirmAction?.type === 'revoke-key' && `"${confirmAction.label}" will be permanently revoked and any integrations using it will stop working.`}
                {confirmAction?.type === 'delete-webhook' && `The endpoint "${confirmAction?.label}" will be removed and will no longer receive events.`}
                {confirmAction?.type === 'revoke-oauth' && `"${confirmAction.label}" will be revoked and all users will lose access through this application.`}
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button variant="danger" onClick={executeConfirmAction}>
              {confirmAction?.type === 'revoke-key' && 'Revoke Key'}
              {confirmAction?.type === 'delete-webhook' && 'Delete Endpoint'}
              {confirmAction?.type === 'revoke-oauth' && 'Revoke App'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* OAuth App Created Success Modal */}
      <Modal open={showOAuthSecretModal} onClose={() => { setShowOAuthSecretModal(false); setCreatedOAuthApp(null); setCopiedClientSecret(false); setCopiedClientId(false) }} title="OAuth App Registered" size="lg">
        {createdOAuthApp && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <AlertTriangle size={20} className="text-warning shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">Save your client secret now</p>
                <p className="text-xs text-amber-700 mt-1">
                  This is the only time the client secret will be displayed. Copy it now and store it securely. You will not be able to see it again.
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">App Name</label>
              <p className="text-sm text-t2">{createdOAuthApp.appName}</p>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Client ID</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-canvas px-3 py-2 rounded-lg text-t1 break-all">
                  {createdOAuthApp.clientId}
                </code>
                <button
                  onClick={() => copyBoolToClipboard(createdOAuthApp.clientId, setCopiedClientId)}
                  className="p-2 text-t3 hover:text-t1 rounded-lg hover:bg-canvas transition-colors"
                  title="Copy Client ID"
                >
                  {copiedClientId ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Client Secret</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-gray-900 text-gray-100 px-3 py-2 rounded-lg break-all">
                  {createdOAuthApp.clientSecret}
                </code>
                <button
                  onClick={() => copyBoolToClipboard(createdOAuthApp.clientSecret, setCopiedClientSecret)}
                  className="p-2 text-t3 hover:text-t1 rounded-lg hover:bg-canvas transition-colors"
                  title="Copy Client Secret"
                >
                  {copiedClientSecret ? <Check size={16} className="text-success" /> : <Copy size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Redirect URIs</label>
              <div className="space-y-1">
                {createdOAuthApp.redirectUris.map((uri, i) => (
                  <p key={i} className="text-xs text-t3 font-mono">{uri}</p>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-t1 mb-1">Scopes</label>
              <div className="flex flex-wrap gap-1">
                {createdOAuthApp.scopes.map(scope => (
                  <Badge key={scope} variant="default">{scope}</Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={() => { setShowOAuthSecretModal(false); setCreatedOAuthApp(null); setCopiedClientSecret(false); setCopiedClientId(false) }}>
                Done
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
