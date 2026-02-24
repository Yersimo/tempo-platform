'use client'

import { useEffect, useState, useMemo } from 'react'
import { useAdmin } from '@/lib/admin-store'
import type { AdminOrgEmployee, AdminOrg } from '@/lib/admin-store'
import {
  Users, Search, Upload, Download, Shield, Briefcase, UserCheck, User as UserIcon,
  Building2, LogIn, Filter,
} from 'lucide-react'

const roleIcons: Record<string, React.ReactNode> = {
  owner: <Shield size={14} />,
  admin: <Briefcase size={14} />,
  hrbp: <Users size={14} />,
  manager: <UserCheck size={14} />,
  employee: <UserIcon size={14} />,
}

const roleColors: Record<string, string> = {
  owner: 'bg-amber-100 text-amber-700',
  admin: 'bg-blue-100 text-blue-700',
  hrbp: 'bg-purple-100 text-purple-700',
  manager: 'bg-emerald-100 text-emerald-700',
  employee: 'bg-gray-100 text-gray-600',
}

export default function UsersPage() {
  const { organizations, fetchOrganizations, getOrgEmployees, impersonateUser } = useAdmin()
  const [search, setSearch] = useState('')
  const [filterOrg, setFilterOrg] = useState<string>('all')
  const [filterRole, setFilterRole] = useState<string>('all')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  // Build unified employee list across all orgs
  const allEmployees = useMemo(() => {
    const result: (AdminOrgEmployee & { orgName: string; orgId: string })[] = []
    for (const org of organizations) {
      const emps = getOrgEmployees(org.id)
      for (const emp of emps) {
        result.push({ ...emp, orgName: org.name, orgId: org.id })
      }
    }
    return result
  }, [organizations, getOrgEmployees])

  const filtered = allEmployees.filter(emp => {
    if (filterOrg !== 'all' && emp.orgId !== filterOrg) return false
    if (filterRole !== 'all' && emp.role !== filterRole) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        emp.profile.full_name.toLowerCase().includes(q) ||
        emp.profile.email.toLowerCase().includes(q) ||
        emp.job_title.toLowerCase().includes(q) ||
        emp.orgName.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleImpersonate = async (emp: AdminOrgEmployee & { orgId: string }) => {
    setImpersonating(emp.id)
    const result = await impersonateUser(emp.id, emp.orgId)
    if (result.ok) {
      window.location.href = '/dashboard'
    } else {
      setImpersonating(null)
      alert(result.error || 'Impersonation failed')
    }
  }

  const uniqueRoles = [...new Set(allEmployees.map(e => e.role))]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-t1">Users</h1>
          <p className="text-sm text-t3 mt-1">{allEmployees.length} users across {organizations.length} organizations</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm text-t2 hover:bg-surface transition-colors"
          >
            <Upload size={14} /> Bulk Upload
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-border rounded-lg text-sm text-t2 hover:bg-surface transition-colors">
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, title, or company..."
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
          />
        </div>
        <select
          value={filterOrg}
          onChange={(e) => setFilterOrg(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">All Organizations</option>
          {organizations.map(org => (
            <option key={org.id} value={org.id}>{org.name}</option>
          ))}
        </select>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
        >
          <option value="all">All Roles</option>
          {uniqueRoles.map(r => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Users', value: allEmployees.length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Owners', value: allEmployees.filter(e => e.role === 'owner').length, color: 'text-amber-600 bg-amber-50' },
          { label: 'Admins', value: allEmployees.filter(e => e.role === 'admin').length, color: 'text-blue-600 bg-blue-50' },
          { label: 'Employees', value: allEmployees.filter(e => e.role === 'employee').length, color: 'text-gray-600 bg-gray-50' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg border border-border p-4">
            <p className="text-2xl font-semibold text-t1">{s.value}</p>
            <p className="text-xs text-t3 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">User</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Organization</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Title</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Role</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Country</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-t3">
                  {search || filterOrg !== 'all' || filterRole !== 'all' ? 'No users match your filters' : 'Loading...'}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const initials = emp.profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr key={`${emp.orgId}-${emp.id}`} className="hover:bg-surface/30 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-amber-600 text-xs font-semibold flex-shrink-0">
                          {initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">{emp.profile.full_name}</p>
                          <p className="text-xs text-t3">{emp.profile.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-1.5">
                        <Building2 size={12} className="text-t3" />
                        <span className="text-sm text-t2">{emp.orgName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-3 text-sm text-t2">{emp.job_title}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[emp.role] || roleColors.employee}`}>
                        {roleIcons[emp.role] || roleIcons.employee}
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-t2">{emp.country}</td>
                    <td className="px-6 py-3 text-right">
                      <button
                        onClick={() => handleImpersonate(emp)}
                        disabled={impersonating === emp.id}
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 disabled:text-amber-300 transition-colors"
                      >
                        <LogIn size={14} />
                        {impersonating === emp.id ? 'Logging in...' : 'Login as'}
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
        {filtered.length > 0 && (
          <div className="px-6 py-3 border-t border-border text-xs text-t3">
            Showing {filtered.length} of {allEmployees.length} users
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl border border-border p-6 max-w-lg w-full mx-4">
            <h2 className="text-lg font-semibold text-t1 mb-1">Bulk Upload Users</h2>
            <p className="text-sm text-t3 mb-4">Upload a CSV file to onboard users to an organization</p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-t2 mb-1.5">Organization</label>
                <select className="w-full px-3 py-2.5 rounded-lg border border-border bg-white text-sm text-t1">
                  <option value="">Select organization</option>
                  {organizations.map(org => (
                    <option key={org.id} value={org.id}>{org.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-t2 mb-1.5">CSV File</label>
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-amber-300 transition-colors cursor-pointer">
                  <Upload size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t2">Drag & drop a CSV file here, or click to browse</p>
                  <p className="text-xs text-t3 mt-1">Required columns: full_name, email, job_title, department, role</p>
                </div>
              </div>

              <div className="bg-surface rounded-lg p-3">
                <p className="text-xs font-semibold text-t2 mb-1">CSV Template</p>
                <code className="text-[0.7rem] text-t3 block">
                  full_name,email,job_title,department,role,country<br />
                  John Doe,john@company.com,Engineer,Technology,employee,Nigeria
                </code>
              </div>
            </div>

            <div className="flex items-center gap-3 mt-6">
              <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors">
                <Upload size={14} /> Upload & Preview
              </button>
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-4 py-2 text-sm text-t3 hover:text-t1 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
