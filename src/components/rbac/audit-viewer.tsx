'use client'

import { useState, useMemo, useCallback } from 'react'
import { type AuditEntry } from '@/lib/security/audit-log'

// ── Types ────────────────────────────────────────────────────────────────────

type AuditOutcome = 'success' | 'denied' | 'error'
type AuditTab = 'all' | 'denied'

interface LocalAuditEntry {
  id: string
  timestamp: string
  actor: string
  actorRole: string
  action: string
  resource: string
  outcome: AuditOutcome
  details: string
  ipAddress?: string
  userAgent?: string
}

// ── Demo data ────────────────────────────────────────────────────────────────

const DEMO_ENTRIES: LocalAuditEntry[] = [
  { id: 'a1', timestamp: '2026-03-14T09:23:11Z', actor: 'Sarah Chen', actorRole: 'admin', action: 'user.login', resource: 'auth/session', outcome: 'success', details: 'SSO login via Google Workspace' },
  { id: 'a2', timestamp: '2026-03-14T09:24:05Z', actor: 'Sarah Chen', actorRole: 'admin', action: 'payroll.view', resource: 'payroll/march-2026', outcome: 'success', details: 'Viewed March 2026 payroll run' },
  { id: 'a3', timestamp: '2026-03-14T09:25:33Z', actor: 'James Wilson', actorRole: 'employee', action: 'compensation.view', resource: 'compensation/emp-42', outcome: 'denied', details: 'Attempted to view another employee\'s compensation' },
  { id: 'a4', timestamp: '2026-03-14T09:30:12Z', actor: 'Maria Garcia', actorRole: 'hrbp', action: 'employee.update', resource: 'employees/emp-15', outcome: 'success', details: 'Updated job title to Senior Engineer' },
  { id: 'a5', timestamp: '2026-03-14T09:31:00Z', actor: 'James Wilson', actorRole: 'employee', action: 'admin.settings', resource: 'settings/security', outcome: 'denied', details: 'Attempted to access security settings' },
  { id: 'a6', timestamp: '2026-03-14T09:35:22Z', actor: 'Alex Kim', actorRole: 'manager', action: 'leave.approve', resource: 'leave/req-88', outcome: 'success', details: 'Approved 5 days PTO for direct report' },
  { id: 'a7', timestamp: '2026-03-14T09:40:10Z', actor: 'Sarah Chen', actorRole: 'admin', action: 'role.create', resource: 'roles/custom-regional-hr', outcome: 'success', details: 'Created custom role: Regional HR Manager' },
  { id: 'a8', timestamp: '2026-03-14T09:42:55Z', actor: 'James Wilson', actorRole: 'employee', action: 'payroll.view', resource: 'payroll/march-2026', outcome: 'denied', details: 'Insufficient permissions to view payroll data' },
  { id: 'a9', timestamp: '2026-03-14T09:45:30Z', actor: 'Maria Garcia', actorRole: 'hrbp', action: 'delegation.create', resource: 'delegations/del-12', outcome: 'success', details: 'Delegated leave approval to Alex Kim for 2 weeks' },
  { id: 'a10', timestamp: '2026-03-14T09:50:00Z', actor: 'System', actorRole: 'system', action: 'delegation.expire', resource: 'delegations/del-08', outcome: 'success', details: 'Auto-expired delegation: expense approval for Tom Harris' },
]

// ── Component ────────────────────────────────────────────────────────────────

export function AuditViewer() {
  const [entries] = useState<LocalAuditEntry[]>(DEMO_ENTRIES)
  const [activeTab, setActiveTab] = useState<AuditTab>('all')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  // Filters
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterAction, setFilterAction] = useState('')
  const [filterActor, setFilterActor] = useState('')
  const [filterOutcome, setFilterOutcome] = useState<'' | AuditOutcome>('')

  const uniqueActions = useMemo(
    () => Array.from(new Set(entries.map(e => e.action))).sort(),
    [entries],
  )

  const uniqueActors = useMemo(
    () => Array.from(new Set(entries.map(e => e.actor))).sort(),
    [entries],
  )

  const filtered = useMemo(() => {
    let result = entries
    if (activeTab === 'denied') {
      result = result.filter(e => e.outcome === 'denied')
    }
    if (filterDateFrom) {
      result = result.filter(e => e.timestamp >= filterDateFrom)
    }
    if (filterDateTo) {
      const to = filterDateTo + 'T23:59:59Z'
      result = result.filter(e => e.timestamp <= to)
    }
    if (filterAction) {
      result = result.filter(e => e.action === filterAction)
    }
    if (filterActor) {
      result = result.filter(e => e.actor === filterActor)
    }
    if (filterOutcome) {
      result = result.filter(e => e.outcome === filterOutcome)
    }
    return result
  }, [entries, activeTab, filterDateFrom, filterDateTo, filterAction, filterActor, filterOutcome])

  const deniedCount = useMemo(() => entries.filter(e => e.outcome === 'denied').length, [entries])

  const formatTimestamp = (iso: string) => {
    try {
      const d = new Date(iso)
      return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    } catch {
      return iso
    }
  }

  const outcomeStyle = (outcome: AuditOutcome) => {
    if (outcome === 'success') return 'bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-300'
    if (outcome === 'denied') return 'bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-300'
    return 'bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'
  }

  const handleExportCSV = useCallback(() => {
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Resource', 'Outcome', 'Details']
    const rows = filtered.map(e => [
      e.timestamp,
      e.actor,
      e.actorRole,
      e.action,
      e.resource,
      e.outcome,
      `"${e.details.replace(/"/g, '""')}"`,
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [filtered])

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Audit Log</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Security audit trail for permission checks, access attempts, and administrative actions.
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
        >
          Export CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('all')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'all'
              ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          All Events ({entries.length})
        </button>
        <button
          onClick={() => setActiveTab('denied')}
          className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'denied'
              ? 'border-red-600 text-red-600 dark:border-red-400 dark:text-red-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          Access Denied ({deniedCount})
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <input
          type="date"
          value={filterDateFrom}
          onChange={e => setFilterDateFrom(e.target.value)}
          placeholder="From"
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={e => setFilterDateTo(e.target.value)}
          placeholder="To"
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <select
          value={filterAction}
          onChange={e => setFilterAction(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Actions</option>
          {uniqueActions.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterActor}
          onChange={e => setFilterActor(e.target.value)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Actors</option>
          {uniqueActors.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <select
          value={filterOutcome}
          onChange={e => setFilterOutcome(e.target.value as '' | AuditOutcome)}
          className="rounded-lg border border-gray-300 px-2 py-1.5 text-xs dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">All Outcomes</option>
          <option value="success">Success</option>
          <option value="denied">Denied</option>
          <option value="error">Error</option>
        </select>
        {(filterDateFrom || filterDateTo || filterAction || filterActor || filterOutcome) && (
          <button
            onClick={() => {
              setFilterDateFrom('')
              setFilterDateTo('')
              setFilterAction('')
              setFilterActor('')
              setFilterOutcome('')
            }}
            className="rounded-lg px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50">
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Timestamp</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Actor</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Action</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Resource</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Outcome</th>
              <th className="px-4 py-2.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Details</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-gray-400">
                  No audit entries match the current filters.
                </td>
              </tr>
            ) : (
              filtered.map(entry => (
                <>
                  <tr
                    key={entry.id}
                    onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
                    className="cursor-pointer border-b border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/30"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                      {formatTimestamp(entry.timestamp)}
                    </td>
                    <td className="px-4 py-2.5">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">{entry.actor}</div>
                      <div className="text-[10px] text-gray-400">{entry.actorRole}</div>
                    </td>
                    <td className="px-4 py-2.5">
                      <code className="rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        {entry.action}
                      </code>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-gray-600 dark:text-gray-400">{entry.resource}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ${outcomeStyle(entry.outcome)}`}>
                        {entry.outcome}
                      </span>
                    </td>
                    <td className="max-w-[200px] truncate px-4 py-2.5 text-xs text-gray-500 dark:text-gray-400">
                      {entry.details}
                    </td>
                  </tr>
                  {expandedRow === entry.id && (
                    <tr key={`${entry.id}-details`} className="bg-gray-50/50 dark:bg-gray-800/20">
                      <td colSpan={6} className="px-6 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Full Timestamp</span>
                            <p className="mt-0.5 text-gray-700 dark:text-gray-300">{entry.timestamp}</p>
                          </div>
                          <div>
                            <span className="font-medium text-gray-500 dark:text-gray-400">Actor Role</span>
                            <p className="mt-0.5 text-gray-700 dark:text-gray-300">{entry.actorRole}</p>
                          </div>
                          <div className="col-span-2">
                            <span className="font-medium text-gray-500 dark:text-gray-400">Details</span>
                            <p className="mt-0.5 text-gray-700 dark:text-gray-300">{entry.details}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 dark:text-gray-500">
        Showing {filtered.length} of {entries.length} entries
      </p>
    </div>
  )
}
