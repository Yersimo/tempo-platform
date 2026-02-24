'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Search, Plus, Download } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { Pagination } from '@/components/ui/pagination'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

export default function PeoplePage() {
  const t = useTranslations('people')
  const tc = useTranslations('common')
  const { employees, departments, addEmployee, getDepartmentName } = useTempo()
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', job_title: '', level: 'Mid',
    department_id: '', country: 'Nigeria', role: 'employee' as string,
  })

  const filtered = employees.filter(emp => {
    const matchSearch = !search || emp.profile?.full_name.toLowerCase().includes(search.toLowerCase()) || emp.job_title.toLowerCase().includes(search.toLowerCase())
    const matchDept = deptFilter === 'all' || emp.department_id === deptFilter
    return matchSearch && matchDept
  })

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedEmployees = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // Reset page when filters change
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }
  const handleDeptFilter = (val: string) => { setDeptFilter(val); setCurrentPage(1) }

  function submitAdd() {
    if (!form.full_name || !form.email) return
    addEmployee({
      department_id: form.department_id || departments[0]?.id,
      job_title: form.job_title || 'Employee',
      level: form.level,
      country: form.country,
      role: form.role,
      profile: { full_name: form.full_name, email: form.email, avatar_url: null, phone: form.phone || null },
    })
    setShowAddModal(false)
    setForm({ full_name: '', email: '', phone: '', job_title: '', level: 'Mid', department_id: '', country: 'Nigeria', role: 'employee' })
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle', { employeeCount: employees.length, departmentCount: departments.length })}
        actions={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> {t('addEmployee')}</Button>}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
          />
        </div>
        <select
          className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2"
          value={deptFilter}
          onChange={(e) => handleDeptFilter(e.target.value)}
        >
          <option value="all">{t('allDepartments')}</option>
          {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
        <Button variant="outline" size="sm"><Download size={14} /> {tc('export')}</Button>
      </div>

      {/* Employee Table */}
      <Card padding="none">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableDepartment')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableTitle')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableCountry')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableLevel')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableRole')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-canvas/50 transition-colors cursor-pointer">
                  <td className="px-6 py-3">
                    <Link href={`/people/${emp.id}`} className="flex items-center gap-3">
                      <Avatar name={emp.profile?.full_name || ''} size="sm" />
                      <div>
                        <p className="text-sm font-medium text-t1 hover:text-tempo-600 transition-colors">{emp.profile?.full_name}</p>
                        <p className="text-xs text-t3">{emp.profile?.email}</p>
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-t2">{getDepartmentName(emp.department_id)}</td>
                  <td className="px-4 py-3 text-sm text-t2">{emp.job_title}</td>
                  <td className="px-4 py-3 text-sm text-t2">{emp.country}</td>
                  <td className="px-4 py-3 text-sm text-t2">{emp.level}</td>
                  <td className="px-4 py-3">
                    <Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>
                      {emp.role}
                    </Badge>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-sm text-t3">{t('noEmployeesFound')}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalItems={filtered.length}
          itemsPerPage={ITEMS_PER_PAGE}
        />
      </Card>

      {/* Add Employee Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('addEmployeeModal')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('fullName')} placeholder={t('fullNamePlaceholder')} value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <Input label={t('email')} type="email" placeholder={t('emailPlaceholder')} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('jobTitle')} placeholder={t('jobTitlePlaceholder')} value={form.job_title} onChange={(e) => setForm({ ...form, job_title: e.target.value })} />
            <Input label={t('phone')} placeholder={t('phonePlaceholder')} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label={tc('department')} value={form.department_id} onChange={(e) => setForm({ ...form, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
            <Select label={t('levelLabel')} value={form.level} onChange={(e) => setForm({ ...form, level: e.target.value })} options={[
              { value: 'Junior', label: t('levelJunior') }, { value: 'Associate', label: t('levelAssociate') },
              { value: 'Mid', label: t('levelMid') }, { value: 'Senior', label: t('levelSenior') },
              { value: 'Manager', label: t('levelManager') }, { value: 'Senior Manager', label: t('levelSeniorManager') },
              { value: 'Director', label: t('levelDirector') }, { value: 'Executive', label: t('levelExecutive') },
            ]} />
            <Select label={t('countryLabel')} value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} options={[
              { value: 'Nigeria', label: tc('countryNigeria') }, { value: 'Ghana', label: tc('countryGhana') },
              { value: "Cote d'Ivoire", label: tc('countryCoteDIvoire') }, { value: 'Kenya', label: tc('countryKenya') },
              { value: 'Senegal', label: tc('countrySenegal') }, { value: 'South Africa', label: tc('countrySouthAfrica') },
            ]} />
          </div>
          <Select label={t('roleLabel')} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} options={[
            { value: 'employee', label: t('roleEmployee') }, { value: 'manager', label: t('roleManager') },
            { value: 'admin', label: t('roleAdmin') },
          ]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAdd}>{t('addEmployee')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
