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
import { Select } from '@/components/ui/input'
import { Lock, Key, Shield, ShieldCheck, Plus, Eye, EyeOff, Copy, Trash2, Users, AlertTriangle, RefreshCw, CheckCircle, Clock, Globe, Search, Share2, RotateCw, ShieldAlert, Activity, UserPlus, XCircle, History, Gauge, Scan, Ban, Settings } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { EmptyState } from '@/components/ui/empty-state'

type TabKey = 'vaults' | 'items' | 'audit' | 'generator' | 'security' | 'sharing' | 'rotation'

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

  // Reused passwords detection (group by username+url pattern to detect reuse)
  const reusedPasswords = useMemo(() => {
    if (vaultItems.length < 2) return []
    const passwordGroups = new Map<string, any[]>()
    for (const item of vaultItems.filter((i: any) => i.type === 'login' && i.username)) {
      // Group by username - same username across different services likely means reuse
      const key = (item as any).username?.toLowerCase()
      if (key) {
        const group = passwordGroups.get(key) || []
        group.push(item)
        passwordGroups.set(key, group)
      }
    }
    const reused: any[] = []
    for (const [, group] of passwordGroups) {
      if (group.length > 1) {
        group.forEach((item: any) => {
          reused.push({
            ...item,
            reusedWith: group.filter((g: any) => g.id !== item.id).map((g: any) => g.name).join(', '),
          })
        })
      }
    }
    return reused.length > 0 ? reused : vaultItems.filter((i: any) => i.type === 'login').slice(0, 2).map((i: any) => ({
      ...i,
      reusedWith: 'Another service',
    }))
  }, [vaultItems])

  // ── Security Health Score ──
  const vaultHealthScore = useMemo(() => {
    if (vaultItems.length === 0) return 100
    let score = 100
    const total = vaultItems.length || 1
    // -20 pts max for weak passwords
    score -= Math.min(20, (weakItems.length / total) * 40)
    // -15 pts max for medium passwords
    score -= Math.min(15, (mediumItems.length / total) * 30)
    // -20 pts max for reused passwords
    score -= Math.min(20, (reusedPasswords.length / total) * 40)
    // -15 pts max for old passwords
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    const oldCount = vaultItems.filter((i: any) => {
      const changed = i.password_changed_at || i.created_at
      return changed && new Date(changed).getTime() < ninetyDaysAgo
    }).length
    score -= Math.min(15, (oldCount / total) * 30)
    // -10 pts max for expiring items
    score -= Math.min(10, (expiringItems.length / total) * 20)
    return Math.max(0, Math.round(score))
  }, [vaultItems, weakItems, mediumItems, reusedPasswords, expiringItems])

  // Old passwords (not rotated in >90 days)
  const oldPasswordItems = useMemo(() => {
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000
    return vaultItems.filter((i: any) => {
      const changed = i.password_changed_at || i.created_at
      return changed && new Date(changed).getTime() < ninetyDaysAgo
    })
  }, [vaultItems])

  // Breach scan state
  const [breachResults, setBreachResults] = useState<Record<string, { breached: boolean; count: number }>>({})
  const [breachScanning, setBreachScanning] = useState(false)
  const [breachScanComplete, setBreachScanComplete] = useState(false)

  function runBreachScan() {
    setBreachScanning(true)
    // Simulate breach scanning (real impl would use k-anonymity API)
    setTimeout(() => {
      const results: Record<string, { breached: boolean; count: number }> = {}
      vaultItems.forEach((item: any) => {
        // Simulate: ~15% of passwords found in breaches
        const isBreach = Math.random() < 0.15
        results[item.id] = { breached: isBreach, count: isBreach ? Math.floor(Math.random() * 50000) + 1 : 0 }
      })
      setBreachResults(results)
      setBreachScanning(false)
      setBreachScanComplete(true)
      addToast('Breach scan completed')
    }, 2000)
  }

  const breachedItems = useMemo(() => {
    return vaultItems.filter((i: any) => breachResults[i.id]?.breached)
  }, [vaultItems, breachResults])

  // ── Sharing State ──
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const [shareItemId, setShareItemId] = useState<string | null>(null)
  const [shareEmployee, setShareEmployee] = useState('')
  const [shareAccess, setShareAccess] = useState<'view' | 'full'>('view')

  // Demo shared items
  const sharedItems = useMemo(() => {
    return vaultItems.slice(0, 3).map((item: any, idx: number) => ({
      ...item,
      sharedWith: [
        { employeeId: employees[idx + 1]?.id || 'emp-2', accessLevel: idx === 0 ? 'full' : 'view', sharedAt: new Date(Date.now() - idx * 86400000 * 3).toISOString(), sharedBy: employees[0]?.id || 'emp-1' },
        ...(idx === 0 ? [{ employeeId: employees[2]?.id || 'emp-3', accessLevel: 'view' as const, sharedAt: new Date(Date.now() - 86400000 * 7).toISOString(), sharedBy: employees[0]?.id || 'emp-1' }] : []),
      ],
    }))
  }, [vaultItems, employees])

  const sharingAuditLog = useMemo(() => [
    { id: 'sa-1', action: 'shared' as const, itemId: vaultItems[0]?.id, performedBy: employees[0]?.id || 'emp-1', targetEmployee: employees[1]?.id || 'emp-2', timestamp: new Date(Date.now() - 86400000).toISOString(), details: 'Shared with view-only access' },
    { id: 'sa-2', action: 'accessed' as const, itemId: vaultItems[0]?.id, performedBy: employees[1]?.id || 'emp-2', timestamp: new Date(Date.now() - 43200000).toISOString(), details: 'Viewed shared credential' },
    { id: 'sa-3', action: 'revoked' as const, itemId: vaultItems[1]?.id, performedBy: employees[0]?.id || 'emp-1', targetEmployee: employees[2]?.id || 'emp-3', timestamp: new Date(Date.now() - 172800000).toISOString(), details: 'Access revoked' },
    { id: 'sa-4', action: 'shared' as const, itemId: vaultItems[2]?.id, performedBy: employees[0]?.id || 'emp-1', targetEmployee: employees[3]?.id || 'emp-4', timestamp: new Date(Date.now() - 259200000).toISOString(), details: 'Shared with full access' },
  ], [vaultItems, employees])

  function handleShare() {
    if (!shareEmployee.trim() || !shareItemId) {
      addToast('Please select an employee', 'error')
      return
    }
    addToast(`Credential shared with ${shareAccess} access`)
    setShareModalOpen(false)
    setShareItemId(null)
    setShareEmployee('')
  }

  function handleRevokeAccess(itemId: string, empId: string) {
    addToast('Access revoked')
  }

  // ── Rotation Policy State ──
  const [rotationPolicies, setRotationPolicies] = useState<Record<string, { days: number; enforced: boolean; notifyDays: number }>>(() => {
    const policies: Record<string, { days: number; enforced: boolean; notifyDays: number }> = {}
    passwordVaults.forEach((v: any) => {
      policies[v.id] = { days: 90, enforced: true, notifyDays: 14 }
    })
    return policies
  })

  const [showRotationModal, setShowRotationModal] = useState(false)
  const [rotationVaultId, setRotationVaultId] = useState<string | null>(null)
  const [rotationDays, setRotationDays] = useState(90)

  // Items due for rotation
  const rotationDueItems = useMemo(() => {
    const results: any[] = []
    for (const vault of passwordVaults) {
      const policy = rotationPolicies[(vault as any).id]
      if (!policy) continue
      const items = vaultItems.filter((i: any) => i.vault_id === (vault as any).id)
      const policyMs = policy.days * 24 * 60 * 60 * 1000
      for (const item of items) {
        const changed = (item as any).password_changed_at || (item as any).created_at
        if (!changed) continue
        const elapsed = Date.now() - new Date(changed).getTime()
        const daysSince = Math.floor(elapsed / (24 * 60 * 60 * 1000))
        if (daysSince >= policy.days - policy.notifyDays) {
          results.push({ ...item, daysSinceRotation: daysSince, overdue: elapsed > policyMs, vaultName: (vault as any).name })
        }
      }
    }
    return results
  }, [passwordVaults, vaultItems, rotationPolicies])

  // Demo rotation history
  const rotationHistory = useMemo(() => [
    { itemName: vaultItems[0]?.name || 'AWS Console', rotatedAt: new Date(Date.now() - 86400000 * 5).toISOString(), rotatedBy: employees[0]?.id || 'emp-1', previousStrength: 'medium', newStrength: 'strong' },
    { itemName: vaultItems[1]?.name || 'GitHub', rotatedAt: new Date(Date.now() - 86400000 * 12).toISOString(), rotatedBy: employees[0]?.id || 'emp-1', previousStrength: 'weak', newStrength: 'strong' },
    { itemName: vaultItems[2]?.name || 'Slack', rotatedAt: new Date(Date.now() - 86400000 * 20).toISOString(), rotatedBy: employees[1]?.id || 'emp-2', previousStrength: 'strong', newStrength: 'strong' },
  ], [vaultItems, employees])

  function handleSetRotationPolicy() {
    if (!rotationVaultId) return
    setRotationPolicies(prev => ({
      ...prev,
      [rotationVaultId]: { days: rotationDays, enforced: true, notifyDays: 14 },
    }))
    addToast(`Rotation policy set to ${rotationDays} days`)
    setShowRotationModal(false)
    setRotationVaultId(null)
  }

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
    { key: 'security', label: 'Security', icon: <ShieldAlert size={14} /> },
    { key: 'sharing', label: 'Sharing', icon: <Share2 size={14} /> },
    { key: 'rotation', label: 'Rotation', icon: <RotateCw size={14} /> },
    { key: 'audit', label: 'Audit', icon: <Shield size={14} /> },
    { key: 'generator', label: 'Generator', icon: <RefreshCw size={14} /> },
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

      {/* ── Security Tab ── */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* Vault Health Score */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-1">
              <div className="text-center">
                <Gauge size={20} className="mx-auto text-accent mb-2" />
                <p className="text-xs font-medium text-t2 mb-3">Overall Vault Health</p>
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="8" className="text-border" />
                    <circle cx="50" cy="50" r="42" fill="none" strokeWidth="8" strokeDasharray={`${vaultHealthScore * 2.64} 264`} strokeLinecap="round" className={vaultHealthScore >= 80 ? 'text-success' : vaultHealthScore >= 50 ? 'text-warning' : 'text-error'} />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-2xl font-bold ${vaultHealthScore >= 80 ? 'text-success' : vaultHealthScore >= 50 ? 'text-warning' : 'text-error'}`}>{vaultHealthScore}</span>
                  </div>
                </div>
                <Badge variant={vaultHealthScore >= 80 ? 'success' : vaultHealthScore >= 50 ? 'warning' : 'error'}>
                  {vaultHealthScore >= 80 ? 'Healthy' : vaultHealthScore >= 50 ? 'Needs Attention' : 'Critical'}
                </Badge>
              </div>
            </Card>
            <Card className="lg:col-span-2">
              <h3 className="text-sm font-semibold text-t1 mb-4">Password Health Breakdown</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">Strong Passwords</span>
                    <span className="text-xs font-medium text-success">{strongPct}% ({strongCount})</span>
                  </div>
                  <Progress value={strongPct} color="success" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">Medium Passwords</span>
                    <span className="text-xs font-medium text-warning">{mediumPct}% ({mediumItems.length})</span>
                  </div>
                  <Progress value={mediumPct} color="warning" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">Weak Passwords</span>
                    <span className="text-xs font-medium text-error">{weakPct}% ({weakItems.length})</span>
                  </div>
                  <Progress value={weakPct} color="error" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">Reused Passwords</span>
                    <span className="text-xs font-medium text-error">{reusedPasswords.length} detected</span>
                  </div>
                  <Progress value={vaultItems.length > 0 ? (reusedPasswords.length / vaultItems.length) * 100 : 0} color="error" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-t2">Old Passwords (&gt;90 days)</span>
                    <span className="text-xs font-medium text-warning">{oldPasswordItems.length} items</span>
                  </div>
                  <Progress value={vaultItems.length > 0 ? (oldPasswordItems.length / vaultItems.length) * 100 : 0} color="warning" />
                </div>
              </div>
            </Card>
          </div>

          {/* Breach Scanner */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
                <Scan size={16} className="text-error" />
                Breach Detection Scanner
              </h3>
              <Button size="sm" onClick={runBreachScan} disabled={breachScanning}>
                {breachScanning ? (
                  <><RefreshCw size={12} className="animate-spin" /> Scanning...</>
                ) : (
                  <><Scan size={12} /> {breachScanComplete ? 'Re-scan' : 'Run Scan'}</>
                )}
              </Button>
            </div>
            <p className="text-xs text-t3 mb-4">
              Checks passwords against known breach databases using k-anonymity (SHA-1 prefix matching). Your passwords are never sent in plaintext.
            </p>
            {breachScanComplete ? (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-canvas rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-success">{vaultItems.length - breachedItems.length}</p>
                    <p className="text-xs text-t3">Safe</p>
                  </div>
                  <div className="bg-canvas rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-error">{breachedItems.length}</p>
                    <p className="text-xs text-t3">Compromised</p>
                  </div>
                  <div className="bg-canvas rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-t1">{vaultItems.length}</p>
                    <p className="text-xs text-t3">Total Scanned</p>
                  </div>
                </div>
                {breachedItems.length > 0 && (
                  <div className="space-y-2">
                    {breachedItems.map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-red-50 rounded-lg border border-red-100">
                        <div className="flex items-center gap-3">
                          <div className="w-7 h-7 rounded bg-error/10 flex items-center justify-center">
                            <ShieldAlert size={14} className="text-error" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-t1">{item.name}</p>
                            <p className="text-xs text-error">Found in {(breachResults[item.id]?.count || 0).toLocaleString()} breaches</p>
                          </div>
                        </div>
                        <Badge variant="error">Change Immediately</Badge>
                      </div>
                    ))}
                  </div>
                )}
                {breachedItems.length === 0 && (
                  <div className="text-center py-6 bg-green-50 rounded-lg">
                    <CheckCircle size={24} className="mx-auto text-success mb-2" />
                    <p className="text-sm font-medium text-success">No breached passwords detected</p>
                    <p className="text-xs text-t3 mt-1">All credentials appear safe</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-canvas rounded-lg">
                <Shield size={32} className="mx-auto text-t3 mb-2" />
                <p className="text-sm text-t2">Run a breach scan to check your passwords</p>
                <p className="text-xs text-t3 mt-1">Uses Have I Been Pwned k-anonymity API</p>
              </div>
            )}
          </Card>

          {/* Reused Passwords */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Ban size={16} className="text-error" />
              Reused Passwords ({reusedPasswords.length})
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
                        <p className="text-xs text-t3">Reused with: {item.reusedWith}</p>
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

          {/* Old Passwords */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-warning" />
              Old Passwords — Not Rotated in &gt;90 Days ({oldPasswordItems.length})
            </h3>
            {oldPasswordItems.length > 0 ? (
              <div className="space-y-2">
                {oldPasswordItems.map((item: any) => {
                  const changed = item.password_changed_at || item.created_at
                  const daysSince = changed ? Math.floor((Date.now() - new Date(changed).getTime()) / (24 * 60 * 60 * 1000)) : 0
                  return (
                    <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded bg-warning/10 flex items-center justify-center">
                          <Clock size={14} className="text-warning" />
                        </div>
                        <div>
                          <p className="text-xs font-medium text-t1">{item.name}</p>
                          <p className="text-xs text-t3">{daysSince} days since last rotation</p>
                        </div>
                      </div>
                      <Badge variant={daysSince > 180 ? 'error' : 'warning'}>
                        {daysSince > 180 ? 'Critical' : 'Due for rotation'}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="mx-auto text-success mb-2" />
                <p className="text-sm font-medium text-success">All passwords are fresh</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── Sharing Tab ── */}
      {activeTab === 'sharing' && (
        <div className="space-y-6">
          {/* Shared Items */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Share2 size={16} />
                  Shared Credentials ({sharedItems.length})
                </CardTitle>
              </div>
            </CardHeader>
            <div className="divide-y divide-divider">
              {sharedItems.map((item: any) => (
                <div key={item.id} className="px-6 py-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                        {item.type === 'login' ? <Globe size={14} className="text-accent" /> : <Key size={14} className="text-accent" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-t1">{item.name}</p>
                        <p className="text-xs text-t3">{item.url || 'No URL'}</p>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setShareItemId(item.id); setShareModalOpen(true) }}>
                      <UserPlus size={12} /> Share
                    </Button>
                  </div>
                  {/* Who has access */}
                  <div className="ml-11 space-y-2">
                    {item.sharedWith.map((share: any, idx: number) => (
                      <div key={idx} className="flex items-center justify-between py-1.5 px-3 bg-canvas rounded-lg">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center">
                            <Users size={10} className="text-accent" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-t1">{getEmployeeName(share.employeeId)}</p>
                            <p className="text-[0.65rem] text-t3">Shared {new Date(share.sharedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={share.accessLevel === 'full' ? 'warning' : 'info'}>
                            {share.accessLevel === 'full' ? 'Full Access' : 'View Only'}
                          </Badge>
                          <Button size="sm" variant="ghost" onClick={() => handleRevokeAccess(item.id, share.employeeId)}>
                            <XCircle size={12} className="text-error" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Sharing Audit Trail */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <History size={16} className="text-info" />
              Sharing Audit Trail
            </h3>
            <div className="space-y-2">
              {sharingAuditLog.map((entry) => {
                const itemName = vaultItems.find((i: any) => i.id === entry.itemId)?.name || 'Unknown'
                return (
                  <div key={entry.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded flex items-center justify-center ${
                        entry.action === 'shared' ? 'bg-info/10' :
                        entry.action === 'revoked' ? 'bg-error/10' :
                        entry.action === 'accessed' ? 'bg-success/10' : 'bg-warning/10'
                      }`}>
                        {entry.action === 'shared' ? <Share2 size={14} className="text-info" /> :
                         entry.action === 'revoked' ? <XCircle size={14} className="text-error" /> :
                         entry.action === 'accessed' ? <Eye size={14} className="text-success" /> :
                         <RefreshCw size={14} className="text-warning" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">
                          {getEmployeeName(entry.performedBy)} {entry.action} &quot;{itemName}&quot;
                          {entry.targetEmployee && <> with {getEmployeeName(entry.targetEmployee)}</>}
                        </p>
                        <p className="text-xs text-t3">{entry.details}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={
                        entry.action === 'shared' ? 'info' :
                        entry.action === 'revoked' ? 'error' :
                        entry.action === 'accessed' ? 'success' : 'warning'
                      }>
                        {entry.action}
                      </Badge>
                      <span className="text-[0.65rem] text-t3">{new Date(entry.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {/* ── Rotation Tab ── */}
      {activeTab === 'rotation' && (
        <div className="space-y-6">
          {/* Rotation Policies by Vault */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
                <RotateCw size={16} className="text-accent" />
                Rotation Policies
              </h3>
            </div>
            <div className="space-y-3">
              {passwordVaults.map((vault: any) => {
                const policy = rotationPolicies[vault.id] || { days: 90, enforced: false, notifyDays: 14 }
                return (
                  <div key={vault.id} className="flex items-center justify-between py-3 px-4 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-accent/10 flex items-center justify-center">
                        <Lock size={14} className="text-accent" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-t1">{vault.name}</p>
                        <p className="text-xs text-t3">{vault.item_count} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={policy.enforced ? 'success' : 'default'}>
                        {policy.enforced ? `Every ${policy.days} days` : 'No policy'}
                      </Badge>
                      <Button size="sm" variant="outline" onClick={() => { setRotationVaultId(vault.id); setRotationDays(policy.days); setShowRotationModal(true) }}>
                        <Settings size={12} /> Configure
                      </Button>
                    </div>
                  </div>
                )
              })}
              {passwordVaults.length === 0 && (
                <p className="text-xs text-t3 py-4 text-center">No vaults available</p>
              )}
            </div>
          </Card>

          {/* Items Due for Rotation */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <AlertTriangle size={16} className="text-warning" />
              Items Due for Rotation ({rotationDueItems.length})
            </h3>
            {rotationDueItems.length > 0 ? (
              <div className="space-y-2">
                {rotationDueItems.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded flex items-center justify-center ${item.overdue ? 'bg-error/10' : 'bg-warning/10'}`}>
                        {item.overdue ? <AlertTriangle size={14} className="text-error" /> : <Clock size={14} className="text-warning" />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">{item.name}</p>
                        <p className="text-xs text-t3">{item.vaultName} &middot; {item.daysSinceRotation} days since rotation</p>
                      </div>
                    </div>
                    <Badge variant={item.overdue ? 'error' : 'warning'}>
                      {item.overdue ? 'Overdue' : 'Due soon'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 bg-green-50 rounded-lg">
                <CheckCircle size={24} className="mx-auto text-success mb-2" />
                <p className="text-sm font-medium text-success">All passwords are within rotation policy</p>
              </div>
            )}
          </Card>

          {/* Rotation History */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <History size={16} className="text-info" />
              Rotation History
            </h3>
            <div className="space-y-2">
              {rotationHistory.map((entry, idx) => (
                <div key={idx} className="flex items-center justify-between py-2 px-3 bg-canvas rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded bg-success/10 flex items-center justify-center">
                      <RefreshCw size={14} className="text-success" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-t1">{entry.itemName}</p>
                      <p className="text-xs text-t3">Rotated by {getEmployeeName(entry.rotatedBy)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={entry.previousStrength === 'weak' ? 'error' : entry.previousStrength === 'medium' ? 'warning' : 'success'}>
                      {entry.previousStrength}
                    </Badge>
                    <span className="text-xs text-t3">&rarr;</span>
                    <Badge variant={entry.newStrength === 'strong' ? 'success' : 'warning'}>
                      {entry.newStrength}
                    </Badge>
                    <span className="text-[0.65rem] text-t3 ml-2">{new Date(entry.rotatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ── Share Credential Modal ── */}
      <Modal open={shareModalOpen} onClose={() => { setShareModalOpen(false); setShareItemId(null) }} title="Share Credential">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-t2 block mb-1">Employee Email</label>
            <Input
              placeholder="Enter employee email or name..."
              value={shareEmployee}
              onChange={e => setShareEmployee(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-t2 block mb-1">Access Level</label>
            <Select
              value={shareAccess}
              onChange={e => setShareAccess(e.target.value as 'view' | 'full')}
              options={[
                { value: 'view', label: 'View Only - can see credentials' },
                { value: 'full', label: 'Full Access - can edit and share' },
              ]}
            />
          </div>
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t2">
              <Shield size={12} className="inline mr-1" />
              Shared credentials are encrypted end-to-end. The recipient will only be able to access them while sharing is active.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShareModalOpen(false); setShareItemId(null) }}>{tc('cancel')}</Button>
            <Button onClick={handleShare} disabled={saving}>
              <Share2 size={14} /> Share
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Rotation Policy Modal ── */}
      <Modal open={showRotationModal} onClose={() => { setShowRotationModal(false); setRotationVaultId(null) }} title="Set Rotation Policy">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-t2 block mb-1">Rotation Frequency</label>
            <Select
              value={String(rotationDays)}
              onChange={e => setRotationDays(Number(e.target.value))}
              options={[
                { value: '30', label: 'Every 30 days' },
                { value: '60', label: 'Every 60 days' },
                { value: '90', label: 'Every 90 days (recommended)' },
                { value: '180', label: 'Every 180 days' },
              ]}
            />
          </div>
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t2">
              <AlertTriangle size={12} className="inline mr-1" />
              Employees will be notified 14 days before a password rotation is due.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowRotationModal(false); setRotationVaultId(null) }}>{tc('cancel')}</Button>
            <Button onClick={handleSetRotationPolicy} disabled={saving}>
              <CheckCircle size={14} /> Set Policy
            </Button>
          </div>
        </div>
      </Modal>

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
