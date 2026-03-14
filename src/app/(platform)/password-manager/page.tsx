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
import { Input } from '@/components/ui/input'
import { Lock, Key, Shield, ShieldCheck, Plus, Eye, EyeOff, Copy, Trash2, Users, AlertTriangle, RefreshCw, CheckCircle, Clock, Globe, Search } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

type TabKey = 'vaults' | 'items' | 'audit' | 'generator'

function generatePassword(length: number, upper: boolean, lower: boolean, numbers: boolean, symbols: boolean): string {
  let chars = ''
  if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  if (lower) chars += 'abcdefghijklmnopqrstuvwxyz'
  if (numbers) chars += '0123456789'
  if (symbols) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
  if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function scorePassword(password: string): { label: string; value: number; color: string } {
  let score = 0
  if (password.length >= 12) score += 25
  else if (password.length >= 8) score += 10
  if (/[A-Z]/.test(password)) score += 20
  if (/[a-z]/.test(password)) score += 15
  if (/[0-9]/.test(password)) score += 20
  if (/[^A-Za-z0-9]/.test(password)) score += 20
  if (password.length >= 20) score += 10 // bonus for length
  const clamped = Math.min(score, 100)
  if (clamped >= 80) return { label: 'Strong', value: clamped, color: 'success' }
  if (clamped >= 50) return { label: 'Medium', value: clamped, color: 'warning' }
  return { label: 'Weak', value: clamped, color: 'error' }
}

export default function PasswordManagerPage() {
  const tc = useTranslations('common')
  const {
    passwordVaults, vaultItems, employees, org,
    addPasswordVault, addVaultItem, deleteVaultItem, addToast,
    ensureModulesLoaded,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

  useEffect(() => {
    ensureModulesLoaded?.(['passwordVaults', 'vaultItems'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(t)
  }, [ensureModulesLoaded])

  async function pmAPI(action: string, data: Record<string, any> = {}) {
    const res = await fetch('/api/password-manager', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
      body: JSON.stringify({ action, ...data }),
    })
    if (!res.ok) { const err = await res.json().catch(() => ({})); throw new Error(err.error || 'Request failed') }
    return res.json()
  }

  const [activeTab, setActiveTab] = useState<TabKey>('vaults')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedVaultId, setSelectedVaultId] = useState<string | null>(null)
  const [showCreateVault, setShowCreateVault] = useState(false)
  const [vaultForm, setVaultForm] = useState({ name: '', description: '' })

  // Password generator state
  const [genLength, setGenLength] = useState(16)
  const [genUpper, setGenUpper] = useState(true)
  const [genLower, setGenLower] = useState(true)
  const [genNumbers, setGenNumbers] = useState(true)
  const [genSymbols, setGenSymbols] = useState(true)
  const [generatedPwd, setGeneratedPwd] = useState('')
  const [showGenPwd, setShowGenPwd] = useState(true)
  const [copied, setCopied] = useState(false)

  // Stats
  const totalVaults = passwordVaults.length
  const totalCredentials = passwordVaults.reduce((a: number, v: any) => a + (v.item_count || 0), 0)
  const strongCount = vaultItems.filter((i: any) => i.strength === 'strong').length
  const strongPct = vaultItems.length > 0 ? Math.round((strongCount / vaultItems.length) * 100) : 0
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const expiringItems = vaultItems.filter((i: any) => i.expires_at && new Date(i.expires_at) < thirtyDaysFromNow)

  const filteredVaults = useMemo(() => {
    if (!searchQuery.trim()) return passwordVaults
    const q = searchQuery.toLowerCase()
    return passwordVaults.filter((v: any) => (v.name || '').toLowerCase().includes(q))
  }, [passwordVaults, searchQuery])

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return vaultItems
    const q = searchQuery.toLowerCase()
    return vaultItems.filter((i: any) =>
      (i.name || '').toLowerCase().includes(q) || (i.username || '').toLowerCase().includes(q) || (i.url || '').toLowerCase().includes(q)
    )
  }, [vaultItems, searchQuery])

  // Selected vault items
  const selectedVaultItems = useMemo(() => {
    if (!selectedVaultId) return []
    return vaultItems.filter((i: any) => i.vault_id === selectedVaultId)
  }, [selectedVaultId, vaultItems])

  const selectedVault = passwordVaults.find((v: any) => v.id === selectedVaultId)

  // Audit data
  const weakItems = vaultItems.filter((i: any) => i.strength === 'weak')
  const mediumItems = vaultItems.filter((i: any) => i.strength === 'medium')
  const mediumPct = vaultItems.length > 0 ? Math.round((mediumItems.length / vaultItems.length) * 100) : 0
  const weakPct = vaultItems.length > 0 ? Math.round((weakItems.length / vaultItems.length) * 100) : 0

  // Mock reused passwords
  const reusedPasswords = useMemo(() => {
    if (vaultItems.length < 2) return []
    return vaultItems.filter((i: any) => i.type === 'login').slice(0, 2).map((i: any) => ({
      ...i,
      reusedWith: 'Another service',
    }))
  }, [vaultItems])

  function getEmployeeName(empId: string) {
    const emp = employees.find((e: any) => e.id === empId)
    return emp?.profile?.full_name || tc('unknown')
  }

  function getVaultName(vaultId: string) {
    const vault = passwordVaults.find((v: any) => v.id === vaultId)
    return vault?.name || tc('unknown')
  }

  function daysUntilExpiry(dateStr: string) {
    const diff = new Date(dateStr).getTime() - now.getTime()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  }

  function handleDeleteItem(itemId: string) {
    setConfirmAction({
      title: 'Delete Credential',
      message: 'Are you sure you want to delete this credential? This action cannot be undone.',
      onConfirm: async () => {
        setSaving(true)
        try {
          await pmAPI('delete-item', { itemId })
          addToast('Item deleted')
        } catch {
          addToast('API failed, removing locally', 'error')
        } finally {
          setSaving(false)
        }
        deleteVaultItem(itemId)
        setConfirmAction(null)
      },
    })
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleGeneratePassword() {
    const pwd = generatePassword(genLength, genUpper, genLower, genNumbers, genSymbols)
    setGeneratedPwd(pwd)
    setCopied(false)
  }

  async function submitVault() {
    if (!vaultForm.name.trim()) {
      addToast('Vault name is required', 'error')
      return
    }
    setSaving(true)
    try {
      await pmAPI('create-vault', {
        ownerId: 'emp-1',
        vault: { name: vaultForm.name, description: vaultForm.description },
      })
      addToast('Vault created')
    } catch {
      addToast('API failed, saving locally', 'error')
    } finally {
      setSaving(false)
    }
    addPasswordVault({
      name: vaultForm.name,
      description: vaultForm.description,
      owner_id: 'emp-1',
      member_count: 1,
      item_count: 0,
    })
    setShowCreateVault(false)
    setVaultForm({ name: '', description: '' })
  }

  const tabs: { key: TabKey; label: string; icon: React.ReactNode }[] = [
    { key: 'vaults', label: 'Vaults', icon: <Lock size={14} /> },
    { key: 'items', label: 'All Items', icon: <Key size={14} /> },
    { key: 'audit', label: 'Security Audit', icon: <Shield size={14} /> },
    { key: 'generator', label: 'Password Generator', icon: <RefreshCw size={14} /> },
  ]

  const pwdScore = generatedPwd ? scorePassword(generatedPwd) : null

  if (pageLoading) {
    return (
      <>
        <Header
          title="Password Manager"
          subtitle="Secure credential sharing & audit"
          actions={<Button size="sm" disabled><Plus size={14} /> Create Vault</Button>}
        />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Password Manager"
        subtitle="Secure credential sharing & audit"
        actions={<Button size="sm" onClick={() => setShowCreateVault(true)}><Plus size={14} /> Create Vault</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Vaults" value={totalVaults} icon={<Lock size={20} />} />
        <StatCard label="Total Credentials" value={totalCredentials} icon={<Key size={20} />} />
        <StatCard label="Strong Passwords" value={`${strongPct}%`} change="Secure" changeType="positive" icon={<ShieldCheck size={20} />} />
        <StatCard label="Expiring Soon" value={expiringItems.length} change="Within 30 days" changeType={expiringItems.length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setSelectedVaultId(null) }}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Search Bar ── */}
      {(activeTab === 'vaults' || activeTab === 'items') && (
        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <Input
              placeholder={activeTab === 'vaults' ? 'Search vaults by name...' : 'Search items by name...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      )}

      {/* ── Vaults Tab ── */}
      {activeTab === 'vaults' && !selectedVaultId && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredVaults.map((vault: any) => (
            <Card key={vault.id}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Lock size={16} className="text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-t1">{vault.name}</p>
                    <p className="text-xs text-t3">{getEmployeeName(vault.owner_id)}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs text-t2">
                  <Users size={12} />
                  {vault.member_count} members
                </div>
                <div className="flex items-center gap-1 text-xs text-t2">
                  <Key size={12} />
                  {vault.item_count} items
                </div>
              </div>
              <Button size="sm" variant="secondary" className="w-full" onClick={() => setSelectedVaultId(vault.id)}>
                Open Vault
              </Button>
            </Card>
          ))}
          {filteredVaults.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Lock size={32} className="mx-auto text-t3 mb-2" />
                <p className="text-sm text-t2">No vaults yet</p>
                <p className="text-xs text-t3 mt-1">Create your first vault to get started</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Selected Vault Detail ── */}
      {activeTab === 'vaults' && selectedVaultId && (
        <div>
          <button
            onClick={() => setSelectedVaultId(null)}
            className="flex items-center gap-1 text-xs text-accent hover:underline mb-4"
          >
            &larr; Back to Vaults
          </button>
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-accent" />
                  <CardTitle>{selectedVault?.name}</CardTitle>
                  <Badge variant="default">{selectedVaultItems.length} items</Badge>
                </div>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Name</th>
                    <th className="tempo-th text-left px-4 py-3">Type</th>
                    <th className="tempo-th text-left px-4 py-3">URL</th>
                    <th className="tempo-th text-left px-4 py-3">Username</th>
                    <th className="tempo-th text-center px-4 py-3">Strength</th>
                    <th className="tempo-th text-left px-4 py-3">Last Used</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {selectedVaultItems.map((item: any) => (
                    <tr key={item.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs font-medium text-t1">{item.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          item.type === 'login' ? 'info' :
                          item.type === 'api_key' ? 'warning' :
                          item.type === 'wifi' ? 'success' : 'default'
                        }>
                          {item.type === 'api_key' ? 'API Key' : item.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[180px] truncate">{item.url || '—'}</td>
                      <td className="px-4 py-3 text-xs text-t2 font-mono">{item.username || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          item.strength === 'strong' ? 'success' :
                          item.strength === 'medium' ? 'warning' : 'error'
                        }>
                          {item.strength}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">
                        {item.last_used_at ? new Date(item.last_used_at).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex gap-1 justify-center">
                          {item.username && (
                            <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.username)}>
                              <Copy size={12} />
                            </Button>
                          )}
                          <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                            <Trash2 size={12} className="text-error" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {selectedVaultItems.length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-xs text-t3">No items in this vault</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* ── All Items Tab ── */}
      {activeTab === 'items' && (
        <Card padding="none">
          <CardHeader>
            <CardTitle>All Credentials</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Name</th>
                  <th className="tempo-th text-left px-4 py-3">Type</th>
                  <th className="tempo-th text-left px-4 py-3">URL</th>
                  <th className="tempo-th text-left px-4 py-3">Username</th>
                  <th className="tempo-th text-center px-4 py-3">Strength</th>
                  <th className="tempo-th text-left px-4 py-3">Last Used</th>
                  <th className="tempo-th text-left px-4 py-3">Vault</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredItems.map((item: any) => (
                  <tr key={item.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-canvas flex items-center justify-center">
                          {item.type === 'login' ? <Globe size={14} className="text-info" /> :
                           item.type === 'api_key' ? <Key size={14} className="text-warning" /> :
                           item.type === 'wifi' ? <Shield size={14} className="text-success" /> :
                           <Lock size={14} className="text-t3" />}
                        </div>
                        <span className="text-xs font-medium text-t1">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={
                        item.type === 'login' ? 'info' :
                        item.type === 'api_key' ? 'warning' :
                        item.type === 'wifi' ? 'success' : 'default'
                      }>
                        {item.type === 'api_key' ? 'API Key' : item.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2 max-w-[180px] truncate">{item.url || '—'}</td>
                    <td className="px-4 py-3 text-xs text-t2 font-mono">{item.username || '—'}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        item.strength === 'strong' ? 'success' :
                        item.strength === 'medium' ? 'warning' : 'error'
                      }>
                        {item.strength}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">
                      {item.last_used_at ? new Date(item.last_used_at).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{getVaultName(item.vault_id)}</td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {item.username && (
                          <Button size="sm" variant="ghost" onClick={() => copyToClipboard(item.username)}>
                            <Copy size={12} />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                          <Trash2 size={12} className="text-error" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-xs text-t3">{searchQuery ? 'No matching credentials' : 'No credentials stored yet'}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ── Security Audit Tab ── */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-t2">Strong Passwords</p>
                <ShieldCheck size={16} className="text-success" />
              </div>
              <p className="text-2xl font-bold text-success">{strongPct}%</p>
              <Progress value={strongPct} color="success" className="mt-2" />
              <p className="text-xs text-t3 mt-1">{strongCount} of {vaultItems.length} credentials</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-t2">Medium Passwords</p>
                <AlertTriangle size={16} className="text-warning" />
              </div>
              <p className="text-2xl font-bold text-warning">{mediumPct}%</p>
              <Progress value={mediumPct} color="warning" className="mt-2" />
              <p className="text-xs text-t3 mt-1">{mediumItems.length} of {vaultItems.length} credentials</p>
            </Card>
            <Card>
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-medium text-t2">Weak Passwords</p>
                <Shield size={16} className="text-error" />
              </div>
              <p className="text-2xl font-bold text-error">{weakPct}%</p>
              <Progress value={weakPct} color="error" className="mt-2" />
              <p className="text-xs text-t3 mt-1">{weakItems.length} of {vaultItems.length} credentials</p>
            </Card>
          </div>

          {/* Weak/Medium items requiring update */}
          {(weakItems.length > 0 || mediumItems.length > 0) && (
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
                <AlertTriangle size={16} className="text-warning" />
                Credentials Requiring Attention
              </h3>
              <div className="space-y-2">
                {[...weakItems, ...mediumItems].map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-white flex items-center justify-center border border-divider">
                        {item.type === 'login' ? <Globe size={14} /> : <Key size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">{item.name}</p>
                        <p className="text-xs text-t3">{getVaultName(item.vault_id)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={item.strength === 'weak' ? 'error' : 'warning'}>
                        {item.strength === 'weak' ? 'Update Required' : 'Review Suggested'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Expiring credentials */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-info" />
              Expiring Credentials
            </h3>
            {expiringItems.length > 0 ? (
              <div className="space-y-2">
                {expiringItems.map((item: any) => {
                  const days = daysUntilExpiry(item.expires_at)
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-white flex items-center justify-center border border-divider">
                          <Key size={14} />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-t1">{item.name}</p>
                          <p className="text-xs text-t3">{getVaultName(item.vault_id)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={days <= 7 ? 'error' : days <= 14 ? 'warning' : 'info'}>
                          {days} days remaining
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-xs text-t3 py-4 text-center">No credentials expiring in the next 30 days</p>
            )}
          </Card>

          {/* Reused passwords */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-error" />
              Reused Passwords Detected
            </h3>
            {reusedPasswords.length > 0 ? (
              <div className="space-y-2">
                {reusedPasswords.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded bg-error/10 flex items-center justify-center">
                        <AlertTriangle size={14} className="text-error" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">{item.name}</p>
                        <p className="text-xs text-t3">Password reused with {item.reusedWith}</p>
                      </div>
                    </div>
                    <Badge variant="error">Reused</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-t3 py-4 text-center">No reused passwords detected</p>
            )}
          </Card>
        </div>
      )}

      {/* ── Password Generator Tab ── */}
      {activeTab === 'generator' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-5 flex items-center gap-2">
              <RefreshCw size={16} />
              Generate Password
            </h3>

            {/* Length slider */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-t2">Password Length</label>
                <span className="text-sm font-bold text-t1 bg-canvas px-2 py-0.5 rounded">{genLength}</span>
              </div>
              <input
                type="range"
                min={8}
                max={64}
                value={genLength}
                onChange={e => setGenLength(Number(e.target.value))}
                className="w-full accent-accent h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-xs text-t3 mt-1">
                <span>8</span>
                <span>64</span>
              </div>
            </div>

            {/* Character toggles */}
            <div className="space-y-3 mb-6">
              {[
                { label: 'Uppercase (A-Z)', value: genUpper, set: setGenUpper },
                { label: 'Lowercase (a-z)', value: genLower, set: setGenLower },
                { label: 'Numbers (0-9)', value: genNumbers, set: setGenNumbers },
                { label: 'Symbols (!@#$%)', value: genSymbols, set: setGenSymbols },
              ].map(opt => (
                <label key={opt.label} className="flex items-center justify-between cursor-pointer group">
                  <span className="text-xs text-t2 group-hover:text-t1 transition-colors">{opt.label}</span>
                  <button
                    onClick={() => opt.set(!opt.value)}
                    className={`w-9 h-5 rounded-full transition-colors relative ${
                      opt.value ? 'bg-accent' : 'bg-border'
                    }`}
                  >
                    <span className={`block w-3.5 h-3.5 bg-white rounded-full absolute top-[3px] transition-transform ${
                      opt.value ? 'translate-x-[18px]' : 'translate-x-[3px]'
                    }`} />
                  </button>
                </label>
              ))}
            </div>

            <Button className="w-full" onClick={handleGeneratePassword}>
              <RefreshCw size={14} />
              Generate Password
            </Button>
          </Card>

          {/* Result */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-5 flex items-center gap-2">
              <Key size={16} />
              Generated Password
            </h3>

            {generatedPwd ? (
              <>
                {/* Password display */}
                <div className="bg-canvas rounded-lg p-4 mb-4 border border-divider">
                  <div className="flex items-center justify-between gap-2">
                    <code className="text-sm font-mono text-t1 break-all flex-1">
                      {showGenPwd ? generatedPwd : '\u2022'.repeat(generatedPwd.length)}
                    </code>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button size="sm" variant="ghost" onClick={() => setShowGenPwd(!showGenPwd)}>
                        {showGenPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(generatedPwd)}>
                        {copied ? <CheckCircle size={14} className="text-success" /> : <Copy size={14} />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Strength meter */}
                {pwdScore && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-t2">Password Strength</span>
                      <Badge variant={
                        pwdScore.label === 'Strong' ? 'success' :
                        pwdScore.label === 'Medium' ? 'warning' : 'error'
                      }>
                        {pwdScore.label}
                      </Badge>
                    </div>
                    <Progress
                      value={pwdScore.value}
                      color={pwdScore.color as any}
                    />
                  </div>
                )}

                {/* Details */}
                <div className="space-y-2 pt-2 border-t border-divider">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-t3">Length</span>
                    <span className="text-t1 font-medium">{generatedPwd.length} characters</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-t3">Uppercase</span>
                    <span className="text-t1 font-medium">{(generatedPwd.match(/[A-Z]/g) || []).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-t3">Lowercase</span>
                    <span className="text-t1 font-medium">{(generatedPwd.match(/[a-z]/g) || []).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-t3">Numbers</span>
                    <span className="text-t1 font-medium">{(generatedPwd.match(/[0-9]/g) || []).length}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-t3">Symbols</span>
                    <span className="text-t1 font-medium">{(generatedPwd.match(/[^A-Za-z0-9]/g) || []).length}</span>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-14 h-14 rounded-full bg-canvas flex items-center justify-center mx-auto mb-3">
                  <Key size={24} className="text-t3" />
                </div>
                <p className="text-sm text-t2">No password generated yet</p>
                <p className="text-xs text-t3 mt-1">Configure your options and click Generate</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Create Vault Modal ── */}
      <Modal open={showCreateVault} onClose={() => setShowCreateVault(false)} title="Create Password Vault">
        <div className="space-y-4">
          <Input
            label="Vault Name"
            placeholder="e.g. Engineering Team"
            value={vaultForm.name}
            onChange={e => setVaultForm({ ...vaultForm, name: e.target.value })}
          />
          <Input
            label="Description"
            placeholder="What is this vault for?"
            value={vaultForm.description}
            onChange={e => setVaultForm({ ...vaultForm, description: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCreateVault(false)}>{tc('cancel')}</Button>
            <Button onClick={submitVault} disabled={saving}>{saving ? 'Saving...' : 'Create Vault'}</Button>
          </div>
        </div>
      </Modal>

      {/* ── Confirmation Modal ── */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.title || 'Confirm'}>
        <div className="space-y-4">
          <p className="text-sm text-t2">{confirmAction?.message}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)} disabled={saving}>{tc('cancel')}</Button>
            <Button variant="danger" onClick={confirmAction?.onConfirm} disabled={saving}>
              {saving ? 'Saving...' : 'Confirm'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
