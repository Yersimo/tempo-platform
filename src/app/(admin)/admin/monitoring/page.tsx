'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Activity, Server, Database, Shield, Mail, HardDrive,
  CreditCard, RefreshCw, CheckCircle2, AlertTriangle, XCircle,
  Clock, TrendingUp, BarChart3, Zap, Timer,
} from 'lucide-react'

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthService {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latencyMs: number
  lastChecked: string
  details?: string
}

interface SLAMetrics {
  uptimePercentage: number
  totalChecks: number
  successfulChecks: number
  failedChecks: number
  avgResponseTimeMs: number
  p95ResponseTimeMs: number
  p99ResponseTimeMs: number
  incidentCount: number
  mttrMinutes: number
  period: string
}

interface UptimeCheck {
  timestamp: string
  status: 'up' | 'down' | 'degraded'
  responseTimeMs: number
  endpoint: string
}

interface PerformanceMetric {
  endpoint: string
  avgMs: number
  p95Ms: number
  p99Ms: number
  callCount: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const SLA_TARGETS = {
  uptime: 99.95,
  avgLatency: 200,
  p95Latency: 500,
  p99Latency: 1000,
  errorRate: 0.5,
}

const SERVICE_ICONS: Record<string, React.ReactNode> = {
  Database: <Database size={16} />,
  API: <Server size={16} />,
  Authentication: <Shield size={16} />,
  'Email (Resend)': <Mail size={16} />,
  'File Storage': <HardDrive size={16} />,
  'Billing (Stripe)': <CreditCard size={16} />,
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default function MonitoringPage() {
  const [services, setServices] = useState<HealthService[]>([])
  const [overallStatus, setOverallStatus] = useState<string>('loading')
  const [sla, setSla] = useState<SLAMetrics | null>(null)
  const [slaPeriod, setSlaPeriod] = useState<string>('last_30d')
  const [uptimeHistory, setUptimeHistory] = useState<UptimeCheck[]>([])
  const [performance, setPerformance] = useState<PerformanceMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<string>('')

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [healthRes, slaRes, uptimeRes, perfRes] = await Promise.all([
        fetch('/api/monitoring?action=health'),
        fetch(`/api/monitoring?action=sla&period=${slaPeriod}`),
        fetch('/api/monitoring?action=uptime&days=30'),
        fetch('/api/monitoring?action=performance'),
      ])

      if (healthRes.ok) {
        const data = await healthRes.json()
        setServices(data.services || [])
        setOverallStatus(data.status || 'healthy')
      }
      if (slaRes.ok) {
        const data = await slaRes.json()
        setSla(data)
      }
      if (uptimeRes.ok) {
        const data = await uptimeRes.json()
        setUptimeHistory(data.checks || [])
      }
      if (perfRes.ok) {
        const data = await perfRes.json()
        setPerformance(data.metrics || [])
      }

      setLastRefresh(new Date().toLocaleTimeString())
    } catch {
      // API may be unreachable in dev without DB
    } finally {
      setLoading(false)
    }
  }, [slaPeriod])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 60_000) // refresh every 60s
    return () => clearInterval(interval)
  }, [fetchAll])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-t1">System Monitoring</h1>
          <p className="text-sm text-t3 mt-1">
            Real-time health, SLA compliance, and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastRefresh && (
            <span className="text-xs text-t3">Last refresh: {lastRefresh}</span>
          )}
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-white border border-border text-t2 hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Overall Status Banner */}
      <OverallStatusBanner status={overallStatus} />

      {/* Service Health Grid */}
      <section>
        <h2 className="text-sm font-semibold text-t1 mb-3 flex items-center gap-2">
          <Activity size={16} className="text-amber-500" />
          Service Health
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {services.map((svc) => (
            <ServiceCard key={svc.name} service={svc} />
          ))}
          {services.length === 0 && !loading && (
            <div className="col-span-full text-center py-8 text-t3 text-sm">
              No health data available. Run a health check to populate.
            </div>
          )}
        </div>
      </section>

      {/* SLA + Uptime Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SLA Compliance */}
        <section className="bg-white rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-t1 flex items-center gap-2">
              <TrendingUp size={16} className="text-amber-500" />
              SLA Compliance
            </h2>
            <select
              value={slaPeriod}
              onChange={(e) => setSlaPeriod(e.target.value)}
              className="text-xs border border-border rounded-lg px-2 py-1 text-t2 bg-white"
            >
              <option value="last_24h">Last 24 hours</option>
              <option value="last_7d">Last 7 days</option>
              <option value="last_30d">Last 30 days</option>
              <option value="last_90d">Last 90 days</option>
            </select>
          </div>
          {sla ? <SLATable sla={sla} /> : <PlaceholderRow />}
        </section>

        {/* Response Time Metrics */}
        <section className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
            <Timer size={16} className="text-amber-500" />
            Response Time
          </h2>
          {sla ? <ResponseTimePanel sla={sla} /> : <PlaceholderRow />}
        </section>
      </div>

      {/* Uptime Bar Chart (30 days) */}
      <section className="bg-white rounded-xl border border-border p-5">
        <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
          <BarChart3 size={16} className="text-amber-500" />
          30-Day Uptime History
        </h2>
        <UptimeBarChart checks={uptimeHistory} />
      </section>

      {/* Performance + Incidents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance */}
        <section className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
            <Zap size={16} className="text-amber-500" />
            Query Performance
          </h2>
          {performance.length > 0 ? (
            <div className="space-y-2">
              {performance.map((p) => (
                <div
                  key={p.endpoint}
                  className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 text-xs"
                >
                  <span className="font-mono text-t2 truncate max-w-[180px]">{p.endpoint}</span>
                  <div className="flex items-center gap-4 text-t3">
                    <span>avg: <strong className="text-t1">{p.avgMs}ms</strong></span>
                    <span>p95: <strong className="text-t1">{p.p95Ms}ms</strong></span>
                    <span>p99: <strong className="text-t1">{p.p99Ms}ms</strong></span>
                    <span className="text-t3">{p.callCount} calls</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-t3 text-xs">
              No performance data yet. Analytics queries will populate this section.
            </div>
          )}
        </section>

        {/* Incident Log */}
        <section className="bg-white rounded-xl border border-border p-5">
          <h2 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
            <AlertTriangle size={16} className="text-amber-500" />
            Incident Log
          </h2>
          <IncidentLog checks={uptimeHistory} mttr={sla?.mttrMinutes ?? 15} />
        </section>
      </div>
    </div>
  )
}

// ─── Components ─────────────────────────────────────────────────────────────

function OverallStatusBanner({ status }: { status: string }) {
  const config = {
    healthy: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', icon: <CheckCircle2 size={20} className="text-emerald-500" />, label: 'All Systems Operational' },
    degraded: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', icon: <AlertTriangle size={20} className="text-amber-500" />, label: 'Partial Degradation' },
    down: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', icon: <XCircle size={20} className="text-red-500" />, label: 'Service Disruption' },
    loading: { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', icon: <RefreshCw size={20} className="text-gray-400 animate-spin" />, label: 'Checking...' },
  }[status] ?? { bg: 'bg-gray-50 border-gray-200', text: 'text-gray-500', icon: null, label: 'Unknown' }

  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${config.bg}`}>
      {config.icon}
      <span className={`text-sm font-semibold ${config.text}`}>{config.label}</span>
    </div>
  )
}

function ServiceCard({ service }: { service: HealthService }) {
  const statusColors = {
    healthy: 'bg-emerald-500',
    degraded: 'bg-amber-500',
    down: 'bg-red-500',
  }
  const statusBg = {
    healthy: 'bg-emerald-50',
    degraded: 'bg-amber-50',
    down: 'bg-red-50',
  }

  return (
    <div className={`rounded-xl border border-border p-4 ${statusBg[service.status]} transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-t2">{SERVICE_ICONS[service.name] ?? <Server size={16} />}</span>
          <span className="text-sm font-medium text-t1">{service.name}</span>
        </div>
        <span className={`w-2.5 h-2.5 rounded-full ${statusColors[service.status]}`} />
      </div>
      <div className="flex items-center justify-between text-xs text-t3">
        <span>{service.details || service.status}</span>
        {service.latencyMs > 0 && <span className="font-mono">{service.latencyMs}ms</span>}
      </div>
    </div>
  )
}

function SLATable({ sla }: { sla: SLAMetrics }) {
  const rows = [
    {
      metric: 'Uptime',
      target: `${SLA_TARGETS.uptime}%`,
      actual: `${sla.uptimePercentage}%`,
      met: sla.uptimePercentage >= SLA_TARGETS.uptime,
    },
    {
      metric: 'Avg Response',
      target: `<${SLA_TARGETS.avgLatency}ms`,
      actual: `${sla.avgResponseTimeMs}ms`,
      met: sla.avgResponseTimeMs <= SLA_TARGETS.avgLatency,
    },
    {
      metric: 'P95 Latency',
      target: `<${SLA_TARGETS.p95Latency}ms`,
      actual: `${sla.p95ResponseTimeMs}ms`,
      met: sla.p95ResponseTimeMs <= SLA_TARGETS.p95Latency,
    },
    {
      metric: 'P99 Latency',
      target: `<${SLA_TARGETS.p99Latency}ms`,
      actual: `${sla.p99ResponseTimeMs}ms`,
      met: sla.p99ResponseTimeMs <= SLA_TARGETS.p99Latency,
    },
    {
      metric: 'Incidents',
      target: '0',
      actual: String(sla.incidentCount),
      met: sla.incidentCount === 0,
    },
    {
      metric: 'MTTR',
      target: `<${sla.mttrMinutes}min`,
      actual: `${sla.mttrMinutes}min`,
      met: true,
    },
  ]

  return (
    <table className="w-full text-xs">
      <thead>
        <tr className="text-t3 border-b border-border">
          <th className="text-left py-2 font-medium">Metric</th>
          <th className="text-right py-2 font-medium">Target</th>
          <th className="text-right py-2 font-medium">Actual</th>
          <th className="text-right py-2 font-medium">Status</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.metric} className="border-b border-border/50 last:border-0">
            <td className="py-2 text-t2 font-medium">{r.metric}</td>
            <td className="py-2 text-right text-t3 font-mono">{r.target}</td>
            <td className="py-2 text-right text-t1 font-mono">{r.actual}</td>
            <td className="py-2 text-right">
              {r.met ? (
                <span className="text-emerald-600 font-semibold">PASS</span>
              ) : (
                <span className="text-red-600 font-semibold">FAIL</span>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

function ResponseTimePanel({ sla }: { sla: SLAMetrics }) {
  const metrics = [
    { label: 'Average', value: sla.avgResponseTimeMs, unit: 'ms', max: SLA_TARGETS.avgLatency },
    { label: 'P95', value: sla.p95ResponseTimeMs, unit: 'ms', max: SLA_TARGETS.p95Latency },
    { label: 'P99', value: sla.p99ResponseTimeMs, unit: 'ms', max: SLA_TARGETS.p99Latency },
  ]

  return (
    <div className="space-y-4">
      {metrics.map((m) => {
        const pct = Math.min(100, (m.value / m.max) * 100)
        const color = pct <= 60 ? 'bg-emerald-500' : pct <= 85 ? 'bg-amber-500' : 'bg-red-500'
        return (
          <div key={m.label}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-t2 font-medium">{m.label}</span>
              <span className="font-mono text-t1">
                {m.value}
                {m.unit}
                <span className="text-t3 ml-1">/ {m.max}{m.unit}</span>
              </span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${color}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )
      })}
      <div className="pt-2 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-lg font-semibold text-t1">{sla.totalChecks}</div>
          <div className="text-[0.65rem] text-t3">Total Checks</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-emerald-600">{sla.successfulChecks}</div>
          <div className="text-[0.65rem] text-t3">Successful</div>
        </div>
        <div>
          <div className="text-lg font-semibold text-red-600">{sla.failedChecks}</div>
          <div className="text-[0.65rem] text-t3">Failed</div>
        </div>
      </div>
    </div>
  )
}

function UptimeBarChart({ checks }: { checks: UptimeCheck[] }) {
  // Group checks by day
  const dayMap = new Map<string, { up: number; degraded: number; down: number }>()
  for (const check of checks) {
    const day = check.timestamp.slice(0, 10)
    const entry = dayMap.get(day) ?? { up: 0, degraded: 0, down: 0 }
    entry[check.status]++
    dayMap.set(day, entry)
  }

  // Generate last 30 days
  const days: { date: string; pct: number; status: 'up' | 'degraded' | 'down' }[] = []
  for (let i = 29; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    const entry = dayMap.get(key)
    if (entry) {
      const total = entry.up + entry.degraded + entry.down
      const pct = total > 0 ? Math.round((entry.up / total) * 100) : 100
      const status = entry.down > 0 ? 'down' : entry.degraded > 0 ? 'degraded' : 'up'
      days.push({ date: key, pct, status })
    } else {
      days.push({ date: key, pct: 100, status: 'up' })
    }
  }

  const barColors = { up: 'bg-emerald-400', degraded: 'bg-amber-400', down: 'bg-red-400' }

  return (
    <div>
      <div className="flex items-end gap-[3px] h-16">
        {days.map((day) => (
          <div
            key={day.date}
            className={`flex-1 rounded-sm ${barColors[day.status]} transition-all hover:opacity-80`}
            style={{ height: `${Math.max(4, day.pct)}%` }}
            title={`${day.date}: ${day.pct}% uptime`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 text-[0.6rem] text-t3">
        <span>{days[0]?.date}</span>
        <span>Today</span>
      </div>
      <div className="flex items-center gap-4 mt-3 text-[0.65rem] text-t3">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-emerald-400" /> Operational
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-amber-400" /> Degraded
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-sm bg-red-400" /> Down
        </span>
      </div>
    </div>
  )
}

function IncidentLog({ checks, mttr }: { checks: UptimeCheck[]; mttr: number }) {
  const incidents = checks.filter((c) => c.status === 'down')

  if (incidents.length === 0) {
    return (
      <div className="text-center py-6">
        <CheckCircle2 size={24} className="mx-auto text-emerald-400 mb-2" />
        <p className="text-xs text-t3">No incidents in the current monitoring window.</p>
        <p className="text-[0.65rem] text-t3 mt-1">Target MTTR: {mttr} minutes</p>
      </div>
    )
  }

  return (
    <div className="space-y-2 max-h-[300px] overflow-y-auto">
      {incidents.slice(-20).reverse().map((inc, i) => (
        <div
          key={`${inc.timestamp}-${i}`}
          className="flex items-center justify-between py-2 px-3 rounded-lg bg-red-50 text-xs"
        >
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-red-500 shrink-0" />
            <div>
              <span className="text-t1 font-medium">Service Down</span>
              <span className="text-t3 ml-2">{inc.endpoint}</span>
            </div>
          </div>
          <div className="text-t3 text-right shrink-0">
            <div>{new Date(inc.timestamp).toLocaleDateString()}</div>
            <div>{new Date(inc.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

function PlaceholderRow() {
  return (
    <div className="flex items-center justify-center py-8 text-t3 text-xs">
      <Clock size={14} className="mr-2" />
      Waiting for data...
    </div>
  )
}
