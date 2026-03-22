'use client'

import { useEffect, useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin-store'
import type { AdminOrgEmployee } from '@/lib/admin-store'
import {
  ArrowLeft, Building2, Users, Globe, Briefcase, LogIn, Search,
  Shield, UserCheck, User as UserIcon, Mail, RotateCw,
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

export default function OrgDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { organizations, fetchOrganizations, getOrgEmployees, impersonateUser } = useAdmin()
  const [employees, setEmployees] = useState<AdminOrgEmployee[]>([])
  const [search, setSearch] = useState('')
  const [impersonating, setImpersonating] = useState<string | null>(null)
  const [resendingEmail, setResendingEmail] = useState<string | null>(null)
  const [resendResult, setResendResult] = useState<{ empId: string; ok: boolean; message: string } | null>(null)

  const handleResendWelcomeEmail = async (emp: AdminOrgEmployee) => {
    if (!org) return
    setResendingEmail(emp.id)
    setResendResult(null)
    try {
      const res = await fetch('/api/admin/organizations/resend-welcome', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: emp.id,
          orgId: org.id,
          orgName: org.name,
          email: emp.profile.email,
          fullName: emp.profile.full_name,
        }),
      })
      const data = await res.json()
      setResendResult({
        empId: emp.id,
        ok: res.ok && data.ok,
        message: res.ok && data.ok ? 'Welcome email resent' : (data.error || 'Failed to send'),
      })
    } catch {
      setResendResult({ empId: emp.id, ok: false, message: 'Network error' })
    } finally {
      setResendingEmail(null)
      // Auto-clear result after 4 seconds
      setTimeout(() => setResendResult(null), 4000)
    }
  }

  useEffect(() => {
    if (organizations.length === 0) {
      fetchOrganizations()
    }
  }, [organizations.length, fetchOrganizations])

  const org = useMemo(() =>
    organizations.find(o => o.slug === slug),
    [organizations, slug]
  )

  useEffect(() => {
    if (org) {
      const emps = getOrgEmployees(org.id)
      setEmployees(emps)
    }
  }, [org, getOrgEmployees])

  const filtered = employees.filter(emp =>
    emp.profile.full_name.toLowerCase().includes(search.toLowerCase()) ||
    emp.profile.email.toLowerCase().includes(search.toLowerCase()) ||
    emp.job_title.toLowerCase().includes(search.toLowerCase())
  )

  const handleImpersonate = async (emp: AdminOrgEmployee) => {
    if (!org) return
    setImpersonating(emp.id)
    const result = await impersonateUser(emp.id, org.id)
    if (result.ok) {
      // Redirect to the platform dashboard as the impersonated user
      window.location.href = '/dashboard'
    } else {
      setImpersonating(null)
      alert(result.error || 'Impersonation failed')
    }
  }

  if (!org && organizations.length > 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-t1 font-medium">Organization not found</p>
          <Link href="/admin/organizations" className="text-sm text-amber-600 hover:underline mt-2 inline-block">
            Back to organizations
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/admin/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-t3 hover:text-t1 transition-colors"
      >
        <ArrowLeft size={14} /> Back to organizations
      </Link>

      {/* Org Header */}
      {org && (
        <div className="bg-white rounded-xl border border-border p-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-xl flex-shrink-0">
              {org.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-semibold text-t1">{org.name}</h1>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  org.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}>
                  {org.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-t3">
                {org.industry && (
                  <span className="flex items-center gap-1.5">
                    <Building2 size={14} /> {org.industry}
                  </span>
                )}
                {org.country && (
                  <span className="flex items-center gap-1.5">
                    <Globe size={14} /> {org.country}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Users size={14} /> {org.employeeCount} employees
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-surface text-t2 capitalize">
                  {org.plan} plan
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee List */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-t1">Employees ({employees.length})</h2>
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employees..."
              className="w-full pl-8 pr-3 py-2 rounded-lg border border-border bg-white text-xs text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            />
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Employee</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Title</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Country</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Role</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-t3">
                  {search ? 'No employees match your search' : 'Loading...'}
                </td>
              </tr>
            ) : (
              filtered.map((emp) => {
                const initials = emp.profile.full_name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                return (
                  <tr key={emp.id} className="hover:bg-surface/30 transition-colors">
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
                    <td className="px-6 py-3 text-sm text-t2">{emp.job_title}</td>
                    <td className="px-6 py-3 text-sm text-t2">{emp.country}</td>
                    <td className="px-6 py-3 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${roleColors[emp.role] || roleColors.employee}`}>
                        {roleIcons[emp.role] || roleIcons.employee}
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <button
                          onClick={() => handleResendWelcomeEmail(emp)}
                          disabled={resendingEmail === emp.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 disabled:text-blue-300 transition-colors"
                          title="Resend welcome email with new temporary password"
                        >
                          {resendingEmail === emp.id ? <RotateCw size={13} className="animate-spin" /> : <Mail size={13} />}
                          <span className="hidden sm:inline">{resendingEmail === emp.id ? 'Sending...' : 'Resend'}</span>
                        </button>
                        {resendResult?.empId === emp.id && (
                          <span className={`text-xs ${resendResult.ok ? 'text-green-600' : 'text-red-500'}`}>
                            {resendResult.message}
                          </span>
                        )}
                        <button
                          onClick={() => handleImpersonate(emp)}
                          disabled={impersonating === emp.id}
                          className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 hover:text-amber-700 disabled:text-amber-300 transition-colors"
                        >
                          <LogIn size={14} />
                          <span className="hidden sm:inline">{impersonating === emp.id ? 'Logging in...' : 'Login as'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
