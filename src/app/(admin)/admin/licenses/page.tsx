'use client'

import { useEffect, useState } from 'react'
import { useAdmin } from '@/lib/admin-store'
import { Package, Check, X, Building2, Crown, Zap, Star, Shield } from 'lucide-react'

const PLATFORM_MODULES = [
  { id: 'core', name: 'Core HR', description: 'People directory, departments, org chart', alwaysOn: true, icon: '👥' },
  { id: 'recruiting', name: 'Recruiting', description: 'Job postings, applications, pipeline', icon: '💼' },
  { id: 'performance', name: 'Performance', description: 'Goals, reviews, feedback cycles', icon: '📈' },
  { id: 'compensation', name: 'Compensation', description: 'Bands, salary reviews, equity', icon: '💰' },
  { id: 'learning', name: 'Learning & Development', description: 'Courses, enrollments, certifications', icon: '🎓' },
  { id: 'engagement', name: 'Engagement', description: 'Surveys, eNPS, pulse checks', icon: '💚' },
  { id: 'mentoring', name: 'Mentoring', description: 'Programs, pairs, matching', icon: '🤝' },
  { id: 'payroll', name: 'Payroll', description: 'Runs, deductions, tax, net pay', icon: '💳' },
  { id: 'time', name: 'Time & Attendance', description: 'Leave requests, attendance tracking', icon: '⏰' },
  { id: 'benefits', name: 'Benefits', description: 'Plans, enrollment, dependents', icon: '🛡️' },
  { id: 'expense', name: 'Expense Management', description: 'Reports, approvals, reimbursement', icon: '🧾' },
  { id: 'devices', name: 'IT — Devices', description: 'Asset tracking, assignments, lifecycle', icon: '💻' },
  { id: 'apps', name: 'IT — Apps', description: 'License management, provisioning', icon: '📱' },
  { id: 'finance', name: 'Finance', description: 'Invoices, budgets, vendors', icon: '📊' },
  { id: 'projects', name: 'Projects', description: 'Tasks, milestones, kanban', icon: '📋' },
  { id: 'strategy', name: 'Strategy', description: 'OKRs, KPIs, initiatives', icon: '🎯' },
  { id: 'workflows', name: 'Workflow Studio', description: 'Custom workflows, automations', icon: '⚡' },
  { id: 'analytics', name: 'Analytics', description: 'Reports, dashboards, insights', icon: '📉' },
]

const PLAN_TIERS = {
  free: { label: 'Free', maxEmployees: 10, maxModules: 1, icon: <Star size={16} />, color: 'text-gray-600 bg-gray-100', modules: ['core'] },
  starter: { label: 'Starter', maxEmployees: 50, maxModules: 5, icon: <Zap size={16} />, color: 'text-blue-600 bg-blue-100', modules: ['core', 'recruiting', 'performance', 'time', 'expense'] },
  professional: { label: 'Professional', maxEmployees: 500, maxModules: 999, icon: <Crown size={16} />, color: 'text-purple-600 bg-purple-100', modules: PLATFORM_MODULES.map(m => m.id) },
  enterprise: { label: 'Enterprise', maxEmployees: 99999, maxModules: 999, icon: <Shield size={16} />, color: 'text-amber-600 bg-amber-100', modules: PLATFORM_MODULES.map(m => m.id) },
}

type PlanKey = keyof typeof PLAN_TIERS

export default function LicensesPage() {
  const { organizations, fetchOrganizations } = useAdmin()
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null)
  const [orgModules, setOrgModules] = useState<Record<string, string[]>>({})

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // Initialize module states from plan defaults
  useEffect(() => {
    const defaults: Record<string, string[]> = {}
    for (const org of organizations) {
      const planKey = (org.plan || 'free') as PlanKey
      const tier = PLAN_TIERS[planKey] || PLAN_TIERS.free
      defaults[org.id] = [...tier.modules]
    }
    setOrgModules(defaults)
  }, [organizations])

  const toggleModule = async (orgId: string, moduleId: string) => {
    setOrgModules(prev => {
      const current = prev[orgId] || []
      const updated = current.includes(moduleId)
        ? current.filter(m => m !== moduleId)
        : [...current, moduleId]
      // Persist to backend
      fetch('/api/admin/organizations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: orgId, data: { enabledModules: updated } }),
      }).catch(err => console.error('Failed to save module toggle:', err))
      return { ...prev, [orgId]: updated }
    })
  }

  const selectedOrgData = organizations.find(o => o.id === selectedOrg)
  const selectedPlan = selectedOrgData ? (selectedOrgData.plan || 'free') as PlanKey : 'free'
  const selectedTier = PLAN_TIERS[selectedPlan] || PLAN_TIERS.free

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-t1">Licenses & Modules</h1>
        <p className="text-sm text-t3 mt-1">Manage subscription plans and module access per organization</p>
      </div>

      {/* Plan Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {(Object.entries(PLAN_TIERS) as [PlanKey, typeof PLAN_TIERS[PlanKey]][]).map(([key, tier]) => {
          const count = organizations.filter(o => (o.plan || 'free') === key).length
          return (
            <div key={key} className="bg-white rounded-xl border border-border p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tier.color}`}>
                  {tier.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-t1">{tier.label}</p>
                  <p className="text-[0.65rem] text-t3">
                    {tier.maxEmployees >= 99999 ? 'Unlimited' : `Up to ${tier.maxEmployees}`} users
                  </p>
                </div>
              </div>
              <p className="text-2xl font-semibold text-t1">{count}</p>
              <p className="text-xs text-t3 mt-0.5">{count === 1 ? 'organization' : 'organizations'}</p>
            </div>
          )
        })}
      </div>

      {/* Org-level Module Management */}
      <div className="bg-white rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-t1">Module Access by Organization</h2>
            <select
              value={selectedOrg || ''}
              onChange={(e) => setSelectedOrg(e.target.value || null)}
              className="px-3 py-2 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 min-w-[200px]"
            >
              <option value="">Select organization</option>
              {organizations.map(org => (
                <option key={org.id} value={org.id}>{org.name} — {org.plan}</option>
              ))}
            </select>
          </div>
        </div>

        {!selectedOrg ? (
          <div className="px-6 py-12 text-center">
            <Package size={32} className="mx-auto text-t3 mb-3" />
            <p className="text-sm text-t3">Select an organization above to manage its modules</p>
          </div>
        ) : (
          <div className="p-6">
            {/* Org Info */}
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border">
              <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-sm">
                {selectedOrgData?.name?.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-t1">{selectedOrgData?.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${selectedTier.color}`}>
                    {selectedTier.icon} {selectedTier.label} Plan
                  </span>
                  <span className="text-xs text-t3">{selectedOrgData?.employeeCount} employees</span>
                </div>
              </div>
            </div>

            {/* Module Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {PLATFORM_MODULES.map(mod => {
                const isEnabled = (orgModules[selectedOrg] || []).includes(mod.id)
                const isAlwaysOn = mod.alwaysOn
                const isInPlan = selectedTier.modules.includes(mod.id)

                return (
                  <div
                    key={mod.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                      isEnabled
                        ? 'border-green-200 bg-green-50/50'
                        : 'border-border bg-white'
                    }`}
                  >
                    <span className="text-lg flex-shrink-0">{mod.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-t1">{mod.name}</p>
                      <p className="text-[0.65rem] text-t3 truncate">{mod.description}</p>
                    </div>
                    {isAlwaysOn ? (
                      <span className="text-xs text-green-600 font-medium px-2 py-0.5 rounded bg-green-100">Always On</span>
                    ) : (
                      <button
                        onClick={() => toggleModule(selectedOrg, mod.id)}
                        className={`w-10 h-5 rounded-full relative transition-colors ${
                          isEnabled ? 'bg-green-500' : 'bg-gray-200'
                        }`}
                      >
                        <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                          isEnabled ? 'left-5' : 'left-0.5'
                        }`} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-t3">
              <span className="w-3 h-3 rounded bg-green-100 border border-green-200 inline-block" /> Enabled
              <span className="w-3 h-3 rounded bg-white border border-border inline-block ml-3" /> Disabled
            </div>
          </div>
        )}
      </div>

      {/* All Orgs License Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-t1">License Summary</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase">Organization</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase">Plan</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase">Users</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase">User Limit</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase">Modules</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {organizations.map(org => {
              const planKey = (org.plan || 'free') as PlanKey
              const tier = PLAN_TIERS[planKey] || PLAN_TIERS.free
              const activeModules = (orgModules[org.id] || tier.modules).length
              const isOverLimit = org.employeeCount > tier.maxEmployees

              return (
                <tr key={org.id} className="hover:bg-surface/30">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 size={14} className="text-t3" />
                      <span className="text-sm font-medium text-t1">{org.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${tier.color}`}>
                      {tier.icon} {tier.label}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-center text-sm text-t1 font-medium">{org.employeeCount}</td>
                  <td className="px-6 py-3 text-center text-sm text-t3">
                    {tier.maxEmployees >= 99999 ? 'Unlimited' : tier.maxEmployees}
                  </td>
                  <td className="px-6 py-3 text-center text-sm text-t2">
                    {activeModules} / {PLATFORM_MODULES.length}
                  </td>
                  <td className="px-6 py-3 text-center">
                    {isOverLimit ? (
                      <span className="text-xs font-semibold text-red-600 bg-red-100 px-2 py-0.5 rounded-full">Over Limit</span>
                    ) : (
                      <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Active</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
