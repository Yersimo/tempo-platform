'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAdmin } from '@/lib/admin-store'
import { Building2, Search, Users, Eye, Plus } from 'lucide-react'

export default function OrganizationsPage() {
  const { organizations, fetchOrganizations, toggleOrgActive } = useAdmin()
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrganizations()
  }, [fetchOrganizations])

  const filtered = organizations.filter(org =>
    org.name.toLowerCase().includes(search.toLowerCase()) ||
    org.slug.toLowerCase().includes(search.toLowerCase()) ||
    (org.country || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-t1">Organizations</h1>
          <p className="text-sm text-t3 mt-1">{organizations.length} organizations on the platform</p>
        </div>
        <Link
          href="/admin/organizations/new"
          className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> Create Organization
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search organizations..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-border bg-white text-sm text-t1 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-border overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-surface/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Organization</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Plan</th>
              <th className="text-left px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Country</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Employees</th>
              <th className="text-center px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-t3 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-sm text-t3">
                  {search ? 'No organizations match your search' : 'Loading...'}
                </td>
              </tr>
            ) : (
              filtered.map((org) => (
                <tr key={org.id} className="hover:bg-surface/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 font-semibold text-sm flex-shrink-0">
                        {org.name.charAt(0)}
                      </div>
                      <div>
                        <Link
                          href={`/admin/organizations/${org.slug}`}
                          className="text-sm font-medium text-t1 hover:text-amber-600 transition-colors"
                        >
                          {org.name}
                        </Link>
                        <p className="text-xs text-t3">{org.industry || '—'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold px-2 py-1 rounded-full bg-surface text-t2 capitalize">
                      {org.plan}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-t2">{org.country || '—'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <Users size={14} className="text-t3" />
                      <span className="text-sm font-medium text-t1">{org.employeeCount}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => toggleOrgActive(org.id, !org.isActive)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full transition-colors ${
                        org.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-600 hover:bg-red-200'
                      }`}
                    >
                      {org.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/admin/organizations/${org.slug}`}
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 hover:text-amber-700 transition-colors"
                    >
                      <Eye size={14} /> View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
