'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin-store'
import {
  Building2, Users, TrendingUp, ArrowRight, Activity,
  Plus, Upload, Package, Settings, LogIn, Shield,
} from 'lucide-react'

export default function AdminDashboard() {
  const { stats, organizations, fetchStats, fetchOrganizations } = useAdmin()

  useEffect(() => {
    fetchStats()
    fetchOrganizations()
  }, [fetchStats, fetchOrganizations])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-t1">Platform Dashboard</h1>
        <p className="text-sm text-t3 mt-1">Overview of all organizations and platform metrics</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Building2 size={20} />}
          label="Total Organizations"
          value={stats?.totalOrgs ?? '—'}
          color="amber"
        />
        <StatCard
          icon={<Activity size={20} />}
          label="Active Organizations"
          value={stats?.activeOrgs ?? '—'}
          color="green"
        />
        <StatCard
          icon={<Users size={20} />}
          label="Total Employees"
          value={stats?.totalEmployees ?? '—'}
          color="blue"
        />
        <StatCard
          icon={<TrendingUp size={20} />}
          label="Active Employees"
          value={stats?.activeEmployees ?? '—'}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-border p-6">
        <h2 className="text-sm font-semibold text-t1 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Create Org', href: '/admin/organizations/new', icon: <Plus size={18} />, color: 'text-amber-600 bg-amber-50' },
            { label: 'Upload Users', href: '/admin/users', icon: <Upload size={18} />, color: 'text-blue-600 bg-blue-50' },
            { label: 'Manage Orgs', href: '/admin/organizations', icon: <Building2 size={18} />, color: 'text-purple-600 bg-purple-50' },
            { label: 'All Users', href: '/admin/users', icon: <Users size={18} />, color: 'text-green-600 bg-green-50' },
            { label: 'Licenses', href: '/admin/licenses', icon: <Package size={18} />, color: 'text-rose-600 bg-rose-50' },
            { label: 'Settings', href: '/admin/settings', icon: <Settings size={18} />, color: 'text-gray-600 bg-gray-50' },
          ].map(action => (
            <Link
              key={action.label}
              href={action.href}
              className="flex flex-col items-center gap-2 p-4 rounded-lg border border-border hover:border-amber-200 hover:bg-amber-50/30 transition-colors"
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${action.color}`}>
                {action.icon}
              </div>
              <span className="text-xs font-medium text-t2">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Plan Breakdown */}
      {stats?.orgsByPlan && (
        <div className="bg-white rounded-xl border border-border p-6">
          <h2 className="text-sm font-semibold text-t1 mb-4">Organizations by Plan</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {['free', 'starter', 'professional', 'enterprise'].map(plan => (
              <div key={plan} className="text-center p-3 rounded-lg bg-surface">
                <p className="text-2xl font-semibold text-t1">{stats.orgsByPlan[plan] || 0}</p>
                <p className="text-xs text-t3 capitalize mt-1">{plan}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Organizations Preview */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-t1">Organizations</h2>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/organizations/new"
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              <Plus size={12} /> New
            </Link>
            <Link
              href="/admin/organizations"
              className="flex items-center gap-1 text-xs text-amber-600 hover:text-amber-700 font-medium"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>
        </div>
        <div className="divide-y divide-border">
          {organizations.length === 0 ? (
            <div className="px-6 py-8 text-center text-sm text-t3">Loading organizations...</div>
          ) : (
            organizations.slice(0, 5).map((org) => (
              <Link
                key={org.id}
                href={`/admin/organizations/${org.slug}`}
                className="flex items-center gap-4 px-6 py-3 hover:bg-surface/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-sm">
                  {org.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-t1">{org.name}</span>
                    {!org.isActive && (
                      <span className="text-[0.6rem] font-semibold px-1.5 py-0.5 rounded bg-red-100 text-red-600">INACTIVE</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-t3 mt-0.5">
                    <span>{org.industry}</span>
                    <span>&bull;</span>
                    <span>{org.country}</span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-t1">{org.employeeCount}</p>
                  <p className="text-xs text-t3">employees</p>
                </div>
                <span className="text-[0.6rem] font-semibold px-2 py-0.5 rounded-full bg-surface text-t3 capitalize">
                  {org.plan}
                </span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: 'amber' | 'green' | 'blue' | 'purple'
}) {
  const colorMap = {
    amber: 'bg-amber-50 text-amber-600',
    green: 'bg-green-50 text-green-600',
    blue: 'bg-blue-50 text-blue-600',
    purple: 'bg-purple-50 text-purple-600',
  }

  return (
    <div className="bg-white rounded-xl border border-border p-5">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-semibold text-t1">{value}</p>
      <p className="text-xs text-t3 mt-1">{label}</p>
    </div>
  )
}
