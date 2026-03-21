'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Building2, Users, DollarSign, Activity, AlertTriangle,
  Search, Server, Database, Clock,
  CheckCircle2, XCircle, RefreshCw, Send, ChevronRight,
  HeadphonesIcon, BarChart3, Shield,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalOrgs: number
  totalEmployees: number
  activeOrgs: number
  mrr: number
  planDistribution: { plan: string; count: number }[]
  unresolvedAlerts: number
  openTickets: number
  healthStatus: 'ok' | 'degraded' | 'down'
}

interface Tenant {
  id: string
  name: string
  slug: string
  plan: string
  industry: string | null
  country: string | null
  isActive: boolean
  stripeCustomerId: string | null
  createdAt: string
  updatedAt: string
  employeeCount: number
}

interface SupportTicket {
  id: string
  orgId: string
  subject: string
  description: string
  category: string
  priority: string
  status: string
  submittedBy: string
  assignedTo: string | null
  resolution: string | null
  createdAt: string
  updatedAt: string
  resolvedAt: string | null
}

interface TicketMessage {
  id: string
  ticketId: string
  senderType: 'customer' | 'support'
  senderId: string
  message: string
  createdAt: string
}

interface SystemHealth {
  status: 'ok' | 'degraded' | 'down'
  latencyMs: number
  database: { status: string; latencyMs: number; tableCount: number; size: string }
  uptime: number
  nodeVersion: string
  env: string
}

// ─── Demo Data ──────────────────────────────────────────────────────────────

const DEMO_STATS: DashboardStats = {
  totalOrgs: 47,
  totalEmployees: 12_340,
  activeOrgs: 42,
  mrr: 284_100,
  planDistribution: [
    { plan: 'free', count: 8 },
    { plan: 'starter', count: 14 },
    { plan: 'professional', count: 18 },
    { plan: 'enterprise', count: 7 },
  ],
  unresolvedAlerts: 3,
  openTickets: 12,
  healthStatus: 'ok',
}

const DEMO_TENANTS: Tenant[] = [
  { id: '1', name: 'Acme Corp', slug: 'acme', plan: 'enterprise', industry: 'Technology', country: 'US', isActive: true, stripeCustomerId: 'cus_abc', createdAt: '2024-01-15', updatedAt: '2026-03-20', employeeCount: 2450 },
  { id: '2', name: 'Globex Inc', slug: 'globex', plan: 'professional', industry: 'Finance', country: 'UK', isActive: true, stripeCustomerId: 'cus_def', createdAt: '2024-03-22', updatedAt: '2026-03-19', employeeCount: 890 },
  { id: '3', name: 'Initech', slug: 'initech', plan: 'starter', industry: 'Manufacturing', country: 'US', isActive: true, stripeCustomerId: 'cus_ghi', createdAt: '2024-06-01', updatedAt: '2026-03-18', employeeCount: 320 },
  { id: '4', name: 'Umbrella Corp', slug: 'umbrella', plan: 'professional', industry: 'Healthcare', country: 'DE', isActive: false, stripeCustomerId: null, createdAt: '2024-08-10', updatedAt: '2026-02-15', employeeCount: 560 },
  { id: '5', name: 'Stark Industries', slug: 'stark', plan: 'enterprise', industry: 'Defense', country: 'US', isActive: true, stripeCustomerId: 'cus_jkl', createdAt: '2024-02-28', updatedAt: '2026-03-21', employeeCount: 4100 },
  { id: '6', name: 'Wayne Enterprises', slug: 'wayne', plan: 'enterprise', industry: 'Conglomerate', country: 'US', isActive: true, stripeCustomerId: 'cus_mno', createdAt: '2024-04-12', updatedAt: '2026-03-20', employeeCount: 1870 },
  { id: '7', name: 'Hooli', slug: 'hooli', plan: 'professional', industry: 'Technology', country: 'US', isActive: true, stripeCustomerId: 'cus_pqr', createdAt: '2024-09-05', updatedAt: '2026-03-17', employeeCount: 410 },
  { id: '8', name: 'Pied Piper', slug: 'pied-piper', plan: 'starter', industry: 'Technology', country: 'US', isActive: true, stripeCustomerId: 'cus_stu', createdAt: '2025-01-20', updatedAt: '2026-03-16', employeeCount: 28 },
]

const DEMO_TICKETS: SupportTicket[] = [
  { id: 't1', orgId: '1', subject: 'SSO login failing for some users', description: 'About 10% of users cannot authenticate via SAML SSO since yesterday.', category: 'authentication', priority: 'high', status: 'open', submittedBy: 'emp1', assignedTo: null, resolution: null, createdAt: '2026-03-21T10:30:00Z', updatedAt: '2026-03-21T10:30:00Z', resolvedAt: null },
  { id: 't2', orgId: '2', subject: 'Payroll export wrong format', description: 'CSV payroll export has missing columns for UK tax codes.', category: 'payroll', priority: 'medium', status: 'in_progress', submittedBy: 'emp2', assignedTo: 'admin1', resolution: null, createdAt: '2026-03-20T14:20:00Z', updatedAt: '2026-03-21T09:00:00Z', resolvedAt: null },
  { id: 't3', orgId: '5', subject: 'Need to increase user limit', description: 'We are approaching our 5000 user limit and need expansion.', category: 'billing', priority: 'low', status: 'open', submittedBy: 'emp3', assignedTo: null, resolution: null, createdAt: '2026-03-19T08:45:00Z', updatedAt: '2026-03-19T08:45:00Z', resolvedAt: null },
  { id: 't4', orgId: '3', subject: 'Data import stuck', description: 'Bulk employee import has been processing for 3 hours.', category: 'general', priority: 'high', status: 'in_progress', submittedBy: 'emp4', assignedTo: 'admin2', resolution: null, createdAt: '2026-03-18T16:10:00Z', updatedAt: '2026-03-19T11:30:00Z', resolvedAt: null },
  { id: 't5', orgId: '6', subject: 'Custom report not loading', description: 'The quarterly headcount report returns a blank page.', category: 'general', priority: 'medium', status: 'resolved', submittedBy: 'emp5', assignedTo: 'admin1', resolution: 'Cache cleared, report regenerated.', createdAt: '2026-03-17T12:00:00Z', updatedAt: '2026-03-18T14:00:00Z', resolvedAt: '2026-03-18T14:00:00Z' },
]

const DEMO_ALERTS = [
  { id: 'a1', type: 'error', title: 'High error rate on /api/payroll', message: 'Error rate exceeded 5% threshold in the last 15 minutes.', isResolved: false, createdAt: '2026-03-21T09:15:00Z' },
  { id: 'a2', type: 'warning', title: 'Database connection pool near limit', message: 'Pool usage at 85% (170/200 connections).', isResolved: false, createdAt: '2026-03-21T08:30:00Z' },
  { id: 'a3', type: 'info', title: 'Scheduled maintenance window', message: 'Neon PostgreSQL maintenance scheduled for March 22 02:00-03:00 UTC.', isResolved: false, createdAt: '2026-03-20T15:00:00Z' },
]

const DEMO_SYSTEM_HEALTH: SystemHealth = {
  status: 'ok',
  latencyMs: 42,
  database: { status: 'ok', latencyMs: 8, tableCount: 156, size: '2.4 GB' },
  uptime: 432000,
  nodeVersion: 'v22.14.0',
  env: 'production',
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatCurrency(cents: number): string {
  return '$' + (cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0 })
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDatetime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  return `${d}d ${h}h`
}

const planColors: Record<string, string> = {
  free: 'bg-gray-700 text-gray-300',
  starter: 'bg-blue-900/50 text-blue-300',
  professional: 'bg-purple-900/50 text-purple-300',
  enterprise: 'bg-amber-900/50 text-amber-300',
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-900/50 text-yellow-300',
  in_progress: 'bg-blue-900/50 text-blue-300',
  resolved: 'bg-green-900/50 text-green-300',
  closed: 'bg-gray-700 text-gray-400',
}

const priorityColors: Record<string, string> = {
  low: 'bg-gray-700 text-gray-300',
  medium: 'bg-yellow-900/50 text-yellow-300',
  high: 'bg-red-900/50 text-red-300',
  critical: 'bg-red-800 text-red-200',
}

const healthColors: Record<string, string> = {
  ok: 'text-green-400',
  degraded: 'text-yellow-400',
  down: 'text-red-400',
}

// ─── Badge Component (dark theme) ──────────────────────────────────────────

function AdminBadge({ children, colorClass }: { children: React.ReactNode; colorClass: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[0.65rem] font-medium ${colorClass}`}>
      {children}
    </span>
  )
}

// ─── Tab Definitions ────────────────────────────────────────────────────────

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tenants', label: 'Tenants' },
  { id: 'support', label: 'Support' },
  { id: 'system', label: 'System' },
] as const

type TabId = (typeof TABS)[number]['id']

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PlatformOpsPage() {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab') as TabId | null
  const [activeTab, setActiveTab] = useState<TabId>(tabParam && TABS.some(t => t.id === tabParam) ? tabParam : 'overview')

  const [stats, setStats] = useState<DashboardStats>(DEMO_STATS)
  const [tenants, setTenants] = useState<Tenant[]>(DEMO_TENANTS)
  const [tickets, setTickets] = useState<SupportTicket[]>(DEMO_TICKETS)
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(DEMO_SYSTEM_HEALTH)
  const [loading, setLoading] = useState(false)

  // Tenant detail modal
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)
  // Ticket detail
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null)
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([])
  const [replyText, setReplyText] = useState('')

  // Search
  const [tenantSearch, setTenantSearch] = useState('')
  const [ticketSearch, setTicketSearch] = useState('')

  // Sync tab from URL
  useEffect(() => {
    if (tabParam && TABS.some(t => t.id === tabParam)) {
      setActiveTab(tabParam)
    }
  }, [tabParam])

  // Fetch data (fallback to demo)
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const headers: Record<string, string> = {}
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('platform_admin_token') : null
      if (adminToken) headers['x-platform-admin-token'] = adminToken

      const [dashRes, tenantRes, ticketRes, healthRes] = await Promise.allSettled([
        fetch('/api/platform-admin?action=dashboard', { headers }),
        fetch('/api/platform-admin?action=tenants', { headers }),
        fetch('/api/platform-admin?action=tickets', { headers }),
        fetch('/api/platform-admin?action=system-health', { headers }),
      ])

      if (dashRes.status === 'fulfilled' && dashRes.value.ok) {
        setStats(await dashRes.value.json())
      }
      if (tenantRes.status === 'fulfilled' && tenantRes.value.ok) {
        const data = await tenantRes.value.json()
        setTenants(data.tenants || [])
      }
      if (ticketRes.status === 'fulfilled' && ticketRes.value.ok) {
        const data = await ticketRes.value.json()
        setTickets(data.tickets || [])
      }
      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setSystemHealth(await healthRes.value.json())
      }
    } catch {
      // Keep demo data
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  // Load ticket messages
  const loadTicketMessages = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket)
    setTicketMessages([])
    setReplyText('')
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('platform_admin_token') : null
      const headers: Record<string, string> = {}
      if (adminToken) headers['x-platform-admin-token'] = adminToken
      const res = await fetch(`/api/platform-admin?action=ticket-detail&ticketId=${ticket.id}`, { headers })
      if (res.ok) {
        const data = await res.json()
        setTicketMessages(data.messages || [])
      }
    } catch {
      // Demo fallback
      setTicketMessages([
        { id: 'm1', ticketId: ticket.id, senderType: 'customer', senderId: ticket.submittedBy, message: ticket.description, createdAt: ticket.createdAt },
      ])
    }
  }

  // Send reply
  const sendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return
    try {
      const adminToken = typeof window !== 'undefined' ? localStorage.getItem('platform_admin_token') : null
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (adminToken) headers['x-platform-admin-token'] = adminToken
      await fetch('/api/platform-admin', {
        method: 'POST',
        headers,
        body: JSON.stringify({ action: 'respond-ticket', ticketId: selectedTicket.id, message: replyText }),
      })
    } catch { /* ignore */ }
    setTicketMessages(prev => [...prev, {
      id: `m-${Date.now()}`,
      ticketId: selectedTicket.id,
      senderType: 'support',
      senderId: 'admin',
      message: replyText,
      createdAt: new Date().toISOString(),
    }])
    setReplyText('')
  }

  // Filter helpers
  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.slug.toLowerCase().includes(tenantSearch.toLowerCase()) ||
    t.plan.toLowerCase().includes(tenantSearch.toLowerCase())
  )

  const filteredTickets = tickets.filter(t =>
    t.subject.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.category.toLowerCase().includes(ticketSearch.toLowerCase()) ||
    t.status.toLowerCase().includes(ticketSearch.toLowerCase())
  )

  return (
    <div className="p-6 lg:p-8 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <Shield size={20} className="text-amber-400" />
            Platform Operations
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage tenants, support, and system health</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 border border-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-800 pb-px">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-gray-800 text-white border-b-2 border-amber-400'
                : 'text-gray-500 hover:text-gray-300 hover:bg-gray-800/50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <OverviewTab stats={stats} alerts={DEMO_ALERTS} tickets={tickets} />
      )}
      {activeTab === 'tenants' && (
        <TenantsTab
          tenants={filteredTenants}
          search={tenantSearch}
          onSearchChange={setTenantSearch}
          onSelectTenant={setSelectedTenant}
        />
      )}
      {activeTab === 'support' && (
        <SupportTab
          tickets={filteredTickets}
          search={ticketSearch}
          onSearchChange={setTicketSearch}
          onSelectTicket={loadTicketMessages}
          selectedTicket={selectedTicket}
          messages={ticketMessages}
          replyText={replyText}
          onReplyChange={setReplyText}
          onSendReply={sendReply}
          onCloseDetail={() => setSelectedTicket(null)}
        />
      )}
      {activeTab === 'system' && (
        <SystemTab health={systemHealth} />
      )}

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedTenant(null)}>
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
              <div>
                <h2 className="text-sm font-semibold text-white">{selectedTenant.name}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{selectedTenant.slug} &middot; {selectedTenant.industry || 'Unknown industry'}</p>
              </div>
              <button onClick={() => setSelectedTenant(null)} className="text-gray-500 hover:text-white p-1 rounded-lg hover:bg-gray-800">
                <XCircle size={16} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <InfoRow label="Plan" value={<AdminBadge colorClass={planColors[selectedTenant.plan] || planColors.free}>{selectedTenant.plan}</AdminBadge>} />
                <InfoRow label="Status" value={selectedTenant.isActive ? <span className="text-green-400">Active</span> : <span className="text-red-400">Disabled</span>} />
                <InfoRow label="Employees" value={selectedTenant.employeeCount.toLocaleString()} />
                <InfoRow label="Country" value={selectedTenant.country || 'N/A'} />
                <InfoRow label="Created" value={formatDate(selectedTenant.createdAt)} />
                <InfoRow label="Last Updated" value={formatDate(selectedTenant.updatedAt)} />
                <InfoRow label="Stripe ID" value={selectedTenant.stripeCustomerId || 'None'} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[0.65rem] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-gray-200 mt-0.5">{value}</p>
    </div>
  )
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ stats, alerts, tickets }: { stats: DashboardStats; alerts: typeof DEMO_ALERTS; tickets: SupportTicket[] }) {
  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress')

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<Building2 size={18} />} label="Total Tenants" value={stats.totalOrgs.toString()} sub={`${stats.activeOrgs} active`} color="text-blue-400" />
        <StatCard icon={<Users size={18} />} label="Total Employees" value={stats.totalEmployees.toLocaleString()} sub="across all tenants" color="text-purple-400" />
        <StatCard icon={<DollarSign size={18} />} label="Monthly Revenue" value={formatCurrency(stats.mrr)} sub="MRR" color="text-green-400" />
        <StatCard icon={<Activity size={18} />} label="System Health" value={stats.healthStatus.toUpperCase()} sub={`${stats.unresolvedAlerts} unresolved alerts`} color={healthColors[stats.healthStatus]} />
      </div>

      {/* Plan Distribution */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
          <BarChart3 size={15} className="text-gray-500" />
          Plan Distribution
        </h3>
        <div className="flex gap-3">
          {stats.planDistribution.map(p => (
            <div key={p.plan} className="flex-1 bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-lg font-semibold text-white">{p.count}</p>
              <p className="text-[0.65rem] text-gray-500 uppercase mt-0.5">{p.plan}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Alerts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <AlertTriangle size={15} className="text-yellow-400" />
            Recent Alerts
          </h3>
          <div className="space-y-2">
            {alerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
                <div className={`mt-0.5 ${alert.type === 'error' ? 'text-red-400' : alert.type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
                  <AlertTriangle size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200">{alert.title}</p>
                  <p className="text-[0.65rem] text-gray-500 mt-0.5">{alert.message}</p>
                  <p className="text-[0.6rem] text-gray-600 mt-1">{formatDatetime(alert.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Open Tickets Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
            <HeadphonesIcon size={15} className="text-purple-400" />
            Open Tickets ({openTickets.length})
          </h3>
          <div className="space-y-2">
            {openTickets.slice(0, 5).map(ticket => (
              <div key={ticket.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-gray-200 truncate">{ticket.subject}</p>
                  <p className="text-[0.6rem] text-gray-500 mt-0.5">{formatDatetime(ticket.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <AdminBadge colorClass={priorityColors[ticket.priority] || priorityColors.medium}>{ticket.priority}</AdminBadge>
                  <AdminBadge colorClass={statusColors[ticket.status] || statusColors.open}>{ticket.status.replace('_', ' ')}</AdminBadge>
                </div>
              </div>
            ))}
            {openTickets.length === 0 && (
              <p className="text-xs text-gray-600 text-center py-4">No open tickets</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[0.65rem] text-gray-500 uppercase tracking-wider">{label}</span>
        <span className={color}>{icon}</span>
      </div>
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="text-[0.65rem] text-gray-500 mt-0.5">{sub}</p>
    </div>
  )
}

// ─── Tenants Tab ────────────────────────────────────────────────────────────

function TenantsTab({ tenants, search, onSearchChange, onSelectTenant }: {
  tenants: Tenant[]
  search: string
  onSearchChange: (s: string) => void
  onSelectTenant: (t: Tenant) => void
}) {
  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search tenants by name, slug, or plan..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-xs bg-gray-900 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-3 font-medium">Organization</th>
              <th className="text-left px-4 py-3 font-medium">Plan</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Employees</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Country</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Last Updated</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tenants.map(tenant => (
              <tr
                key={tenant.id}
                onClick={() => onSelectTenant(tenant)}
                className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-200">{tenant.name}</p>
                  <p className="text-[0.6rem] text-gray-600">{tenant.slug}</p>
                </td>
                <td className="px-4 py-3">
                  <AdminBadge colorClass={planColors[tenant.plan] || planColors.free}>{tenant.plan}</AdminBadge>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{tenant.employeeCount.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">{tenant.country || '\u2014'}</td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDate(tenant.updatedAt)}</td>
                <td className="px-4 py-3">
                  {tenant.isActive
                    ? <span className="flex items-center gap-1 text-green-400"><CheckCircle2 size={12} /> Active</span>
                    : <span className="flex items-center gap-1 text-red-400"><XCircle size={12} /> Disabled</span>
                  }
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <ChevronRight size={14} />
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-600">No tenants found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Support Tab ────────────────────────────────────────────────────────────

function SupportTab({ tickets, search, onSearchChange, onSelectTicket, selectedTicket, messages, replyText, onReplyChange, onSendReply, onCloseDetail }: {
  tickets: SupportTicket[]
  search: string
  onSearchChange: (s: string) => void
  onSelectTicket: (t: SupportTicket) => void
  selectedTicket: SupportTicket | null
  messages: TicketMessage[]
  replyText: string
  onReplyChange: (s: string) => void
  onSendReply: () => void
  onCloseDetail: () => void
}) {
  if (selectedTicket) {
    return (
      <div className="space-y-4">
        <button onClick={onCloseDetail} className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors">
          <ChevronRight size={13} className="rotate-180" /> Back to tickets
        </button>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-sm font-medium text-white">{selectedTicket.subject}</h3>
              <p className="text-[0.6rem] text-gray-500 mt-1">
                {formatDatetime(selectedTicket.createdAt)} &middot; {selectedTicket.category}
              </p>
            </div>
            <div className="flex gap-2">
              <AdminBadge colorClass={priorityColors[selectedTicket.priority]}>{selectedTicket.priority}</AdminBadge>
              <AdminBadge colorClass={statusColors[selectedTicket.status]}>{selectedTicket.status.replace('_', ' ')}</AdminBadge>
            </div>
          </div>

          {/* Message Thread */}
          <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`p-3 rounded-lg text-xs ${msg.senderType === 'support' ? 'bg-amber-900/20 border border-amber-800/30 ml-8' : 'bg-gray-800 mr-8'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${msg.senderType === 'support' ? 'text-amber-300' : 'text-gray-300'}`}>
                    {msg.senderType === 'support' ? 'Support Agent' : 'Customer'}
                  </span>
                  <span className="text-[0.6rem] text-gray-600">{formatDatetime(msg.createdAt)}</span>
                </div>
                <p className="text-gray-300 whitespace-pre-wrap">{msg.message}</p>
              </div>
            ))}
            {messages.length === 0 && (
              <div className="p-3 bg-gray-800 rounded-lg text-xs text-gray-400 mr-8">
                <p>{selectedTicket.description}</p>
              </div>
            )}
          </div>

          {/* Reply Form */}
          {(selectedTicket.status === 'open' || selectedTicket.status === 'in_progress') && (
            <div className="flex gap-2">
              <input
                type="text"
                value={replyText}
                onChange={e => onReplyChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onSendReply()}
                placeholder="Type a reply..."
                className="flex-1 h-9 px-3 text-xs bg-gray-800 border border-gray-700 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-500"
              />
              <button
                onClick={onSendReply}
                disabled={!replyText.trim()}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-amber-600 text-white rounded-lg hover:bg-amber-500 transition-colors disabled:opacity-50 disabled:hover:bg-amber-600"
              >
                <Send size={12} />
                Reply
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
        <input
          type="text"
          placeholder="Search tickets by subject, category, or status..."
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full h-9 pl-9 pr-3 text-xs bg-gray-900 border border-gray-800 rounded-lg text-white placeholder:text-gray-600 focus:outline-none focus:border-gray-600"
        />
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500">
              <th className="text-left px-4 py-3 font-medium">Subject</th>
              <th className="text-left px-4 py-3 font-medium hidden md:table-cell">Category</th>
              <th className="text-left px-4 py-3 font-medium">Priority</th>
              <th className="text-left px-4 py-3 font-medium">Status</th>
              <th className="text-left px-4 py-3 font-medium hidden lg:table-cell">Created</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {tickets.map(ticket => (
              <tr
                key={ticket.id}
                onClick={() => onSelectTicket(ticket)}
                className="border-b border-gray-800/50 hover:bg-gray-800/50 cursor-pointer transition-colors"
              >
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-200 truncate max-w-[280px]">{ticket.subject}</p>
                </td>
                <td className="px-4 py-3 text-gray-400 hidden md:table-cell capitalize">{ticket.category}</td>
                <td className="px-4 py-3">
                  <AdminBadge colorClass={priorityColors[ticket.priority] || priorityColors.medium}>{ticket.priority}</AdminBadge>
                </td>
                <td className="px-4 py-3">
                  <AdminBadge colorClass={statusColors[ticket.status] || statusColors.open}>{ticket.status.replace('_', ' ')}</AdminBadge>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">{formatDatetime(ticket.createdAt)}</td>
                <td className="px-4 py-3 text-gray-600">
                  <ChevronRight size={14} />
                </td>
              </tr>
            ))}
            {tickets.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-600">No tickets found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── System Tab ─────────────────────────────────────────────────────────────

function SystemTab({ health }: { health: SystemHealth }) {
  return (
    <div className="space-y-6">
      {/* Overall Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-300 flex items-center gap-2">
            <Server size={15} className="text-gray-500" />
            System Status
          </h3>
          <div className={`flex items-center gap-1.5 text-sm font-medium ${healthColors[health.status]}`}>
            {health.status === 'ok' ? <CheckCircle2 size={16} /> : health.status === 'degraded' ? <AlertTriangle size={16} /> : <XCircle size={16} />}
            {health.status.toUpperCase()}
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SystemMetric label="Response Latency" value={`${health.latencyMs}ms`} />
          <SystemMetric label="Uptime" value={formatUptime(health.uptime)} />
          <SystemMetric label="Node Version" value={health.nodeVersion} />
          <SystemMetric label="Environment" value={health.env} />
        </div>
      </div>

      {/* Database */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Database size={15} className="text-gray-500" />
          Database
        </h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SystemMetric
            label="Status"
            value={
              <span className={`flex items-center gap-1 ${healthColors[health.database.status] || 'text-gray-400'}`}>
                {health.database.status === 'ok' ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                {health.database.status.toUpperCase()}
              </span>
            }
          />
          <SystemMetric label="Latency" value={`${health.database.latencyMs}ms`} />
          <SystemMetric label="Tables" value={health.database.tableCount.toString()} />
          <SystemMetric label="Size" value={health.database.size} />
        </div>
      </div>

      {/* Health Checks */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Activity size={15} className="text-gray-500" />
          Service Health Checks
        </h3>
        <div className="space-y-2">
          {[
            { name: 'API Server', status: 'ok', latency: `${health.latencyMs}ms` },
            { name: 'PostgreSQL (Neon)', status: health.database.status, latency: `${health.database.latencyMs}ms` },
            { name: 'Auth Service', status: 'ok', latency: '12ms' },
            { name: 'Stripe Integration', status: 'ok', latency: '45ms' },
            { name: 'Email (Resend)', status: 'ok', latency: '89ms' },
            { name: 'File Storage', status: 'ok', latency: '23ms' },
          ].map(svc => (
            <div key={svc.name} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${svc.status === 'ok' ? 'bg-green-400' : svc.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'}`} />
                <span className="text-xs text-gray-300">{svc.name}</span>
              </div>
              <span className="text-xs text-gray-500">{svc.latency}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Deployment Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-sm font-medium text-gray-300 mb-4 flex items-center gap-2">
          <Clock size={15} className="text-gray-500" />
          Deployment Info
        </h3>
        <div className="grid grid-cols-2 gap-4 text-xs">
          <InfoRow label="Platform" value="Vercel Edge" />
          <InfoRow label="Region" value="iad1 (US East)" />
          <InfoRow label="Runtime" value={health.nodeVersion} />
          <InfoRow label="Framework" value="Next.js 16.1.6" />
          <InfoRow label="Database" value="Neon PostgreSQL" />
          <InfoRow label="CDN" value="Vercel Edge Network" />
        </div>
      </div>
    </div>
  )
}

function SystemMetric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3">
      <p className="text-[0.6rem] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-medium text-white mt-1">{typeof value === 'string' ? value : value}</p>
    </div>
  )
}
