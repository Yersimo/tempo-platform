'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, Plus, Filter, Download } from 'lucide-react'
import { demoEmployees, demoDepartments } from '@/lib/demo-data'

export default function PeoplePage() {
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')

  const filtered = demoEmployees.filter(emp => {
    const matchSearch = !search || emp.profile?.full_name.toLowerCase().includes(search.toLowerCase()) || emp.job_title.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || emp.department_id === deptFilter
    return matchSearch && matchDept
  })

  return (
    <>
      <Header
        title="People"
        subtitle={`${demoEmployees.length} employees across ${demoDepartments.length} departments`}
        actions={<Button size="sm"><Plus size={14} /> Add Employee</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <input
            type="text"
            placeholder="Search by name, title, or department..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">All Departments</option>
          {demoDepartments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
        <Button variant="outline" size="sm"><Download size={14} /> Export</Button>
      </div>

      {/* Employee Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Employee</th>
                <th className="tempo-th text-left px-4 py-3">Department</th>
                <th className="tempo-th text-left px-4 py-3">Title</th>
                <th className="tempo-th text-left px-4 py-3">Country</th>
                <th className="tempo-th text-left px-4 py-3">Level</th>
                <th className="tempo-th text-left px-4 py-3">Status</th>
                <th className="tempo-th text-center px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((emp) => {
                const dept = demoDepartments.find(d => d.id === emp.department_id)
                return (
                  <tr key={emp.id} className="hover:bg-canvas/50 transition-colors">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={emp.profile?.full_name || ''} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p>
                          <p className="text-xs text-t3">{emp.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-t2">{dept?.name}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp.job_title}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp.country}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp.level}</td>
                    <td className="px-4 py-3">
                      <Badge variant="success">Active</Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>
                        {emp.role}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
