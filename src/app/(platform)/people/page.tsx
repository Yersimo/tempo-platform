'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { MiniBarChart, MiniDonutChart } from '@/components/ui/mini-chart'
import { Avatar } from '@/components/ui/avatar'
import { Pagination } from '@/components/ui/pagination'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { analyzeHeadcountTrends, predictAttritionRisk, detectOrgBottlenecks } from '@/lib/ai-engine'
import {
  Search, Plus, Download, Upload, Users, Building2, BarChart3,
  FileText, Clock, Layers, UserPlus, Award, ArrowRightLeft, DollarSign,
  GraduationCap, Filter, ChevronRight, AlertTriangle, Briefcase, FolderOpen,
} from 'lucide-react'
import { useTempo } from '@/lib/store'
import Link from 'next/link'

const ITEMS_PER_PAGE = 10

export default function PeoplePage() {
  const t = useTranslations('people')
  const tc = useTranslations('common')
  const {
    employees, departments, addEmployee, updateEmployee, deleteEmployee,
    getDepartmentName, getEmployeeName,
    employeeDocuments, addEmployeeDocument, updateEmployeeDocument,
    employeeTimeline,
  } = useTempo()

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('directory')
  const tabs = [
    { id: 'directory', label: t('directory'), count: employees.length },
    { id: 'org-chart', label: t('orgChart') },
    { id: 'analytics', label: t('analytics') },
    { id: 'documents', label: t('documents'), count: employeeDocuments.length },
    { id: 'timeline', label: t('timeline') },
    { id: 'bulk-actions', label: t('bulkActions') },
  ]

  // ---- Directory State ----
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('all')
  const [countryFilter, setCountryFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', job_title: '', level: 'Mid',
    department_id: '', country: 'Nigeria', role: 'employee' as string,
  })

  // ---- Documents State ----
  const [docTypeFilter, setDocTypeFilter] = useState('all')
  const [docStatusFilter, setDocStatusFilter] = useState('all')
  const [showDocModal, setShowDocModal] = useState(false)
  const [docForm, setDocForm] = useState({ employee_id: '', document_type: 'contract', name: '', expiry_date: '' })

  // ---- Timeline State ----
  const [timelineTypeFilter, setTimelineTypeFilter] = useState('all')
  const [timelineEmployeeFilter, setTimelineEmployeeFilter] = useState('')

  // ---- Bulk Actions State ----
  const [showBulkTransferModal, setShowBulkTransferModal] = useState(false)
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false)
  const [bulkTransferForm, setBulkTransferForm] = useState({ from_department: '', to_department: '', reason: '' })

  // ---- Computed: Countries & Levels ----
  const countries = useMemo(() => [...new Set(employees.map(e => e.country))].sort(), [employees])
  const levels = useMemo(() => {
    const order = ['Executive', 'Director', 'Senior Manager', 'Manager', 'Senior', 'Mid', 'Associate', 'Junior']
    return order.filter(l => employees.some(e => e.level === l))
  }, [employees])

  // ---- Directory Filtering ----
  const filtered = useMemo(() => {
    return employees.filter(emp => {
      const matchSearch = !search || emp.profile?.full_name.toLowerCase().includes(search.toLowerCase()) || emp.job_title.toLowerCase().includes(search.toLowerCase()) || emp.profile?.email.toLowerCase().includes(search.toLowerCase())
      const matchDept = deptFilter === 'all' || emp.department_id === deptFilter
      const matchCountry = countryFilter === 'all' || emp.country === countryFilter
      const matchLevel = levelFilter === 'all' || emp.level === levelFilter
      return matchSearch && matchDept && matchCountry && matchLevel
    })
  }, [employees, search, deptFilter, countryFilter, levelFilter])

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE)
  const paginatedEmployees = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  const resetFilters = () => { setSearch(''); setDeptFilter('all'); setCountryFilter('all'); setLevelFilter('all'); setCurrentPage(1) }
  const handleSearch = (val: string) => { setSearch(val); setCurrentPage(1) }

  // ---- AI Analytics ----
  const headcountRaw = useMemo(() => analyzeHeadcountTrends(employees as any, departments), [employees, departments])
  const colors = ['bg-tempo-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-purple-500']
  const headcountData = useMemo(() => ({
    byDepartment: headcountRaw.departmentBreakdown.map(d => ({ label: d.name, value: d.count })),
    byCountry: headcountRaw.countryBreakdown.map((c, i) => ({ label: c.name, value: c.count, color: colors[i % colors.length] })),
    byLevel: headcountRaw.levelBreakdown.map(l => ({ label: l.name, value: l.count })),
    insights: headcountRaw.insights,
  }), [headcountRaw])
  const attritionData = useMemo(() => predictAttritionRisk(employees as any, [] as any, [] as any), [employees])
  const attritionRisks = useMemo(() => attritionData.atRiskEmployees.map(r => {
    const emp = employees.find(e => e.id === r.employeeId)
    const dept = departments.find(d => d.id === emp?.department_id)
    return {
      employeeId: r.employeeId,
      employeeName: emp?.profile?.full_name || 'Unknown',
      department: dept?.name || 'Unknown',
      riskScore: r.risk,
      riskLevel: (r.risk >= 60 ? 'high' : r.risk >= 35 ? 'medium' : 'low') as 'high' | 'medium' | 'low',
      factors: r.factors,
    }
  }), [attritionData, employees, departments])
  const bottlenecks = useMemo(() => detectOrgBottlenecks(employees as any, departments as any), [employees, departments])
  const highRiskCount = useMemo(() => attritionRisks.filter(r => r.riskLevel === 'high').length, [attritionRisks])

  // ---- Org Chart Data ----
  const orgChartData = useMemo(() => {
    return departments.map(dept => {
      const deptEmployees = employees.filter(e => e.department_id === dept.id)
      const executives = deptEmployees.filter(e => e.level === 'Executive' || e.level === 'Director')
      const managers = deptEmployees.filter(e => e.level === 'Manager' || e.level === 'Senior Manager')
      const ics = deptEmployees.filter(e => !['Executive', 'Director', 'Manager', 'Senior Manager'].includes(e.level))
      return { department: dept, executives, managers, ics, total: deptEmployees.length }
    }).sort((a, b) => b.total - a.total)
  }, [departments, employees])

  // ---- Documents Filtering ----
  const filteredDocs = useMemo(() => {
    return employeeDocuments.filter(doc => {
      const matchType = docTypeFilter === 'all' || doc.document_type === docTypeFilter
      const matchStatus = docStatusFilter === 'all' || doc.status === docStatusFilter
      return matchType && matchStatus
    })
  }, [employeeDocuments, docTypeFilter, docStatusFilter])

  // ---- Timeline Filtering ----
  const filteredTimeline = useMemo(() => {
    return employeeTimeline.filter(event => {
      const matchType = timelineTypeFilter === 'all' || event.type === timelineTypeFilter
      const matchEmployee = !timelineEmployeeFilter || event.employee_id === timelineEmployeeFilter
      return matchType && matchEmployee
    })
  }, [employeeTimeline, timelineTypeFilter, timelineEmployeeFilter])

  // ---- Handlers ----
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

  function submitDocument() {
    if (!docForm.employee_id || !docForm.name) return
    addEmployeeDocument({
      employee_id: docForm.employee_id,
      document_type: docForm.document_type,
      name: docForm.name,
      status: 'pending_review',
      expiry_date: docForm.expiry_date || null,
      file_size: `${Math.floor(Math.random() * 900 + 100)} KB`,
    })
    setShowDocModal(false)
    setDocForm({ employee_id: '', document_type: 'contract', name: '', expiry_date: '' })
  }

  const timelineIcon = (type: string) => {
    switch (type) {
      case 'hire': return <UserPlus size={16} className="text-emerald-500" />
      case 'promotion': return <Award size={16} className="text-tempo-600" />
      case 'transfer': return <ArrowRightLeft size={16} className="text-blue-500" />
      case 'salary_change': return <DollarSign size={16} className="text-amber-500" />
      case 'training': return <GraduationCap size={16} className="text-purple-500" />
      default: return <Clock size={16} className="text-t3" />
    }
  }

  const docStatusBadge = (status: string) => {
    switch (status) {
      case 'valid': return <Badge variant="success">{t('docValid')}</Badge>
      case 'expired': return <Badge variant="error">{t('docExpired')}</Badge>
      case 'pending_review': return <Badge variant="warning">{t('docPendingReview')}</Badge>
      default: return <Badge variant="default">{status}</Badge>
    }
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle', { employeeCount: employees.length, departmentCount: departments.length })}
        actions={<Button size="sm" onClick={() => setShowAddModal(true)}><Plus size={14} /> {t('addEmployee')}</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalEmployees')} value={employees.length} change={`${departments.length} ${t('departments')}`} changeType="neutral" icon={<Users size={20} />} />
        <StatCard label={t('countriesPresent')} value={countries.length} change={t('multiCountry')} changeType="neutral" icon={<Building2 size={20} />} />
        <StatCard label={t('documentsOnFile')} value={employeeDocuments.length} change={`${employeeDocuments.filter(d => d.status === 'expired').length} ${t('expired')}`} changeType={employeeDocuments.filter(d => d.status === 'expired').length > 0 ? 'negative' : 'positive'} icon={<FileText size={20} />} />
        <StatCard label={t('attritionAlerts')} value={highRiskCount} change={t('highRiskEmployees')} changeType={highRiskCount > 3 ? 'negative' : 'neutral'} icon={<AlertTriangle size={20} />} />
      </div>

      {/* Tabs */}
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* ============================================================ */}
      {/* TAB 1: DIRECTORY */}
      {/* ============================================================ */}
      {activeTab === 'directory' && (
        <>
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
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1) }}>
              <option value="all">{t('allDepartments')}</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1) }}>
              <option value="all">{t('allCountries')}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1) }}>
              <option value="all">{t('allLevels')}</option>
              {levels.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
            {(search || deptFilter !== 'all' || countryFilter !== 'all' || levelFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>{t('clearFilters')}</Button>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm"><Download size={14} /> {tc('export')}</Button>
            </div>
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
                      <td className="px-4 py-3"><Badge variant="default">{emp.level}</Badge></td>
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
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 2: ORG CHART */}
      {/* ============================================================ */}
      {activeTab === 'org-chart' && (
        <>
          <div className="mb-4">
            <p className="text-sm text-t3">{t('orgChartDescription')}</p>
          </div>
          <div className="space-y-6">
            {orgChartData.map(({ department, executives, managers, ics, total }) => (
              <Card key={department.id}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center">
                      <Building2 size={20} className="text-tempo-600" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-t1">{department.name}</h3>
                      <p className="text-xs text-t3">{total} {t('members')}</p>
                    </div>
                  </div>
                  <Badge variant="info">{total} {t('people')}</Badge>
                </div>

                {/* Executive / Director Level */}
                {executives.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-2">{t('leadership')}</p>
                    <div className="flex flex-wrap gap-3">
                      {executives.map(emp => (
                        <Link key={emp.id} href={`/people/${emp.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-tempo-200 bg-tempo-50/50 hover:bg-tempo-50 transition-colors">
                          <Avatar name={emp.profile?.full_name || ''} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p>
                            <p className="text-xs text-t3">{emp.job_title}</p>
                          </div>
                          <Badge variant="orange" className="ml-2">{emp.level}</Badge>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Manager Level */}
                {managers.length > 0 && (
                  <div className="mb-4 ml-6 border-l-2 border-tempo-200 pl-4">
                    <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-2">{t('management')}</p>
                    <div className="flex flex-wrap gap-3">
                      {managers.map(emp => (
                        <Link key={emp.id} href={`/people/${emp.id}`} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-50 transition-colors">
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <div>
                            <p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p>
                            <p className="text-xs text-t3">{emp.job_title}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* Individual Contributors */}
                {ics.length > 0 && (
                  <div className="ml-12 border-l-2 border-border pl-4">
                    <p className="text-xs font-semibold text-t3 uppercase tracking-wider mb-2">{t('individualContributors')} ({ics.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {ics.map(emp => (
                        <Link key={emp.id} href={`/people/${emp.id}`} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border border-border bg-canvas hover:bg-white transition-colors">
                          <Avatar name={emp.profile?.full_name || ''} size="xs" />
                          <div>
                            <p className="text-xs font-medium text-t1">{emp.profile?.full_name}</p>
                            <p className="text-[0.65rem] text-t3">{emp.job_title} · {emp.country}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 3: ANALYTICS */}
      {/* ============================================================ */}
      {activeTab === 'analytics' && (
        <>
          {/* AI Alert Banner */}
          {headcountData.insights.length > 0 && <AIAlertBanner insights={headcountData.insights} className="mb-4" />}

          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByDepartment')}</h3>
              {headcountData.byDepartment.length > 0 ? (
                <>
                  <MiniBarChart data={headcountData.byDepartment.slice(0, 8)} showLabels height={140} />
                  <div className="mt-3 space-y-1">
                    {headcountData.byDepartment.map(d => (
                      <div key={d.label} className="flex justify-between text-xs">
                        <span className="text-t2">{d.label}</span>
                        <span className="text-t1 font-medium">{d.value} {t('people')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noData')}</p>}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByCountry')}</h3>
              {headcountData.byCountry.length > 0 ? (
                <>
                  <MiniDonutChart data={headcountData.byCountry} />
                  <div className="mt-3 space-y-1">
                    {headcountData.byCountry.map(c => (
                      <div key={c.label} className="flex justify-between text-xs">
                        <span className="text-t2">{c.label}</span>
                        <span className="text-t1 font-medium">{c.value} {t('people')}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : <p className="text-sm text-t3">{t('noData')}</p>}
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('headcountByLevel')}</h3>
              {headcountData.byLevel.length > 0 ? (
                <MiniBarChart data={headcountData.byLevel} showLabels height={140} />
              ) : <p className="text-sm text-t3">{t('noData')}</p>}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('diversityOverview')}</h3>
              <div className="flex items-center justify-center h-[140px] bg-canvas rounded-lg">
                <div className="text-center">
                  <Users size={24} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t3">{t('diversityComingSoon')}</p>
                  <p className="text-xs text-t3 mt-1">{t('diversityDescription')}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* AI Attrition Risk */}
          <Card className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-t1">{t('attritionRiskScoring')}</h3>
              <Badge variant="ai">{t('aiPowered')}</Badge>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider">
                    <th className="tempo-th text-left px-4 py-2">{t('tableEmployee')}</th>
                    <th className="tempo-th text-left px-4 py-2">{t('tableDepartment')}</th>
                    <th className="tempo-th text-center px-4 py-2">{t('riskScore')}</th>
                    <th className="tempo-th text-left px-4 py-2">{t('riskFactors')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {attritionRisks.slice(0, 10).map(risk => (
                    <tr key={risk.employeeId} className="hover:bg-canvas/50">
                      <td className="px-4 py-2">
                        <Link href={`/people/${risk.employeeId}`} className="text-sm font-medium text-t1 hover:text-tempo-600 transition-colors">
                          {risk.employeeName}
                        </Link>
                      </td>
                      <td className="px-4 py-2 text-sm text-t2">{risk.department}</td>
                      <td className="px-4 py-2 text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${
                          risk.riskLevel === 'high' ? 'bg-red-100 text-red-700' :
                          risk.riskLevel === 'medium' ? 'bg-amber-100 text-amber-700' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {risk.riskScore}%
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex flex-wrap gap-1">
                          {risk.factors.slice(0, 2).map((f, i) => (
                            <span key={i} className="text-[0.65rem] text-t3 bg-canvas px-1.5 py-0.5 rounded">{f}</span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* AI Org Bottleneck Insights */}
          {bottlenecks.length > 0 && (
            <Card>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-t1">{t('orgBottlenecks')}</h3>
                <Badge variant="ai">{t('aiInsights')}</Badge>
              </div>
              <div className="space-y-2">
                {bottlenecks.map(insight => (
                  <AIInsightCard key={insight.id} insight={insight} compact />
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 4: DOCUMENTS */}
      {/* ============================================================ */}
      {activeTab === 'documents' && (
        <>
          {/* Document Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <StatCard label={t('totalDocuments')} value={employeeDocuments.length} change={t('allTypes')} changeType="neutral" icon={<FolderOpen size={20} />} />
            <StatCard label={t('validDocuments')} value={employeeDocuments.filter(d => d.status === 'valid').length} change={t('upToDate')} changeType="positive" icon={<FileText size={20} />} />
            <StatCard label={t('expiredDocuments')} value={employeeDocuments.filter(d => d.status === 'expired').length} change={t('needsRenewal')} changeType={employeeDocuments.filter(d => d.status === 'expired').length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('pendingReview')} value={employeeDocuments.filter(d => d.status === 'pending_review').length} change={t('awaitingAction')} changeType="neutral" icon={<Clock size={20} />} />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}>
              <option value="all">{t('allDocTypes')}</option>
              <option value="contract">{t('docContract')}</option>
              <option value="id">{t('docId')}</option>
              <option value="certificate">{t('docCertificate')}</option>
            </select>
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={docStatusFilter} onChange={(e) => setDocStatusFilter(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              <option value="valid">{t('docValid')}</option>
              <option value="expired">{t('docExpired')}</option>
              <option value="pending_review">{t('docPendingReview')}</option>
            </select>
            <div className="ml-auto">
              <Button size="sm" onClick={() => setShowDocModal(true)}><Upload size={14} /> {t('uploadDocument')}</Button>
            </div>
          </div>

          {/* Documents Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">{t('docName')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('tableEmployee')}</th>
                    <th className="tempo-th text-left px-4 py-3">{t('docType')}</th>
                    <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('uploadDate')}</th>
                    <th className="tempo-th text-center px-4 py-3">{t('expiryDate')}</th>
                    <th className="tempo-th text-right px-4 py-3">{t('fileSize')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">{t('noDocumentsFound')}</td></tr>
                  ) : filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-t3" />
                          <p className="text-sm font-medium text-t1">{doc.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{getEmployeeName(doc.employee_id)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={doc.document_type === 'contract' ? 'info' : doc.document_type === 'id' ? 'default' : 'success'}>
                          {doc.document_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{docStatusBadge(doc.status)}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">{doc.upload_date}</td>
                      <td className="px-4 py-3 text-sm text-t2 text-center">{doc.expiry_date || '-'}</td>
                      <td className="px-4 py-3 text-sm text-t3 text-right">{doc.file_size}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 5: TIMELINE */}
      {/* ============================================================ */}
      {activeTab === 'timeline' && (
        <>
          <div className="flex flex-wrap gap-3 mb-6">
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={timelineTypeFilter} onChange={(e) => setTimelineTypeFilter(e.target.value)}>
              <option value="all">{t('allEventTypes')}</option>
              <option value="hire">{t('eventHire')}</option>
              <option value="promotion">{t('eventPromotion')}</option>
              <option value="transfer">{t('eventTransfer')}</option>
              <option value="salary_change">{t('eventSalaryChange')}</option>
              <option value="training">{t('eventTraining')}</option>
            </select>
            <select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={timelineEmployeeFilter} onChange={(e) => setTimelineEmployeeFilter(e.target.value)}>
              <option value="">{t('allEmployees')}</option>
              {employees.slice(0, 30).map(emp => (
                <option key={emp.id} value={emp.id}>{emp.profile.full_name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            {filteredTimeline.length === 0 ? (
              <Card><p className="text-sm text-t3 text-center py-8">{t('noTimelineEvents')}</p></Card>
            ) : filteredTimeline.map((event, index) => (
              <div key={event.id} className="flex gap-4">
                {/* Timeline line */}
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-white border-2 border-divider flex items-center justify-center flex-shrink-0">
                    {timelineIcon(event.type)}
                  </div>
                  {index < filteredTimeline.length - 1 && (
                    <div className="w-0.5 h-full bg-divider flex-grow min-h-[16px]" />
                  )}
                </div>

                {/* Timeline card */}
                <Card className="flex-1 mb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={
                          event.type === 'hire' ? 'success' :
                          event.type === 'promotion' ? 'info' :
                          event.type === 'transfer' ? 'default' :
                          event.type === 'salary_change' ? 'warning' :
                          'ai'
                        }>
                          {event.type.replace('_', ' ')}
                        </Badge>
                        <span className="text-xs text-t3">{event.department}</span>
                      </div>
                      <p className="text-sm text-t1">{event.description}</p>
                    </div>
                    <span className="text-xs text-t3 whitespace-nowrap ml-4">{event.date}</span>
                  </div>
                </Card>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 6: BULK ACTIONS */}
      {/* ============================================================ */}
      {activeTab === 'bulk-actions' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Import Employees */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                  <Upload size={20} className="text-emerald-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('importEmployees')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('importDescription')}</p>
                  <div className="border-2 border-dashed border-divider rounded-lg p-6 text-center mb-3 bg-canvas">
                    <Upload size={24} className="mx-auto text-t3 mb-2" />
                    <p className="text-sm text-t2">{t('dragDropCsv')}</p>
                    <p className="text-xs text-t3 mt-1">{t('csvFormat')}</p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full">{t('selectFile')}</Button>
                </div>
              </div>
            </Card>

            {/* Export Employees */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('exportEmployees')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('exportDescription')}</p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full"><Download size={14} /> {t('exportCsv')}</Button>
                    <Button variant="outline" size="sm" className="w-full"><Download size={14} /> {t('exportExcel')}</Button>
                    <Button variant="outline" size="sm" className="w-full"><Download size={14} /> {t('exportPdf')}</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bulk Department Transfer */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft size={20} className="text-amber-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('bulkDepartmentTransfer')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('bulkTransferDescription')}</p>
                  <Button size="sm" onClick={() => setShowBulkTransferModal(true)}>{t('startTransfer')}</Button>
                </div>
              </div>
            </Card>

            {/* Bulk Status Change */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <Layers size={20} className="text-purple-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('bulkStatusChange')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('bulkStatusDescription')}</p>
                  <Button size="sm" onClick={() => setShowBulkStatusModal(true)}>{t('changeStatus')}</Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

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

      {/* Upload Document Modal */}
      <Modal open={showDocModal} onClose={() => setShowDocModal(false)} title={t('uploadDocument')}>
        <div className="space-y-4">
          <Select label={t('tableEmployee')} value={docForm.employee_id} onChange={(e) => setDocForm({ ...docForm, employee_id: e.target.value })} options={employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <Select label={t('docType')} value={docForm.document_type} onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })} options={[
            { value: 'contract', label: t('docContract') },
            { value: 'id', label: t('docId') },
            { value: 'certificate', label: t('docCertificate') },
          ]} />
          <Input label={t('docName')} placeholder={t('docNamePlaceholder')} value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
          <Input label={t('expiryDate')} type="date" value={docForm.expiry_date} onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })} />
          <div className="border-2 border-dashed border-divider rounded-lg p-4 text-center bg-canvas">
            <Upload size={20} className="mx-auto text-t3 mb-1" />
            <p className="text-xs text-t3">{t('dragDropFile')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDocModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDocument}>{t('uploadDocument')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Department Transfer Modal */}
      <Modal open={showBulkTransferModal} onClose={() => setShowBulkTransferModal(false)} title={t('bulkDepartmentTransfer')}>
        <div className="space-y-4">
          <Select label={t('fromDepartment')} value={bulkTransferForm.from_department} onChange={(e) => setBulkTransferForm({ ...bulkTransferForm, from_department: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <Select label={t('toDepartment')} value={bulkTransferForm.to_department} onChange={(e) => setBulkTransferForm({ ...bulkTransferForm, to_department: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <Textarea label={t('transferReason')} placeholder={t('transferReasonPlaceholder')} value={bulkTransferForm.reason} onChange={(e) => setBulkTransferForm({ ...bulkTransferForm, reason: e.target.value })} />
          {bulkTransferForm.from_department && (
            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs text-t3">
                {t('transferPreview', {
                  count: employees.filter(e => e.department_id === bulkTransferForm.from_department).length,
                  from: getDepartmentName(bulkTransferForm.from_department),
                  to: bulkTransferForm.to_department ? getDepartmentName(bulkTransferForm.to_department) : '...',
                })}
              </p>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBulkTransferModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => {
              if (!bulkTransferForm.from_department || !bulkTransferForm.to_department) return
              const toTransfer = employees.filter(e => e.department_id === bulkTransferForm.from_department)
              toTransfer.forEach(emp => updateEmployee(emp.id, { department_id: bulkTransferForm.to_department }))
              setShowBulkTransferModal(false)
              setBulkTransferForm({ from_department: '', to_department: '', reason: '' })
            }}>{t('executeTransfer')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Status Change Modal */}
      <Modal open={showBulkStatusModal} onClose={() => setShowBulkStatusModal(false)} title={t('bulkStatusChange')}>
        <div className="space-y-4">
          <Select label={t('selectDepartment')} value="" onChange={() => {}} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <Select label={t('newRole')} value="" onChange={() => {}} options={[
            { value: 'employee', label: t('roleEmployee') },
            { value: 'manager', label: t('roleManager') },
            { value: 'admin', label: t('roleAdmin') },
          ]} />
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('bulkStatusNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBulkStatusModal(false)}>{tc('cancel')}</Button>
            <Button>{t('applyChanges')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
