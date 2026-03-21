'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { TempoBarChart, TempoDonutChart, CHART_COLORS, CHART_SERIES } from '@/components/ui/charts'
import { Avatar } from '@/components/ui/avatar'
import { Pagination } from '@/components/ui/pagination'
import { AIInsightCard, AIAlertBanner, AIScoreBadge, AIRecommendationList } from '@/components/ai'
import { AIInsightsCard } from '@/components/ui/ai-insights-card'
import { analyzeHeadcountTrends, predictAttritionRisk, detectOrgBottlenecks } from '@/lib/ai-engine'
import {
  Search, Plus, Download, Upload, Users, Building2, BarChart3,
  FileText, Clock, Layers, UserPlus, Award, ArrowRightLeft, DollarSign,
  GraduationCap, Filter, ChevronRight, AlertTriangle, Briefcase, FolderOpen,
  Hash, Pencil, Trash2, GripVertical, Eye, EyeOff, Settings, Globe, FileCheck,
  History, CalendarClock, MapPin, Snowflake, CircleDot, ShieldCheck,
} from 'lucide-react'
import { ExpandableStats } from '@/components/ui/expandable-stats'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import { readFileAsCSV, mapCSVToEmployeeFields, validateEmployeeImport, generateBulkCredentials, exportCredentialsToCSV, exportToCSV, exportToPrint, exportToExcel, downloadImportTemplate, EMPLOYEE_EXPORT_COLUMNS, type EmployeeCredential } from '@/lib/export-import'
import { generateEmployeeImportTemplate, parseExcelFile } from '@/lib/excel-template'
import Link from 'next/link'
import OrgChart from '@/components/org-chart'

const ITEMS_PER_PAGE = 10

export default function PeoplePage() {
  const t = useTranslations('people')
  const tc = useTranslations('common')
  const {
    employees, departments, addEmployee, bulkAddEmployees, updateEmployee, deleteEmployee,
    getDepartmentName, getEmployeeName,
    employeeDocuments, addEmployeeDocument, updateEmployeeDocument,
    employeeTimeline,
    customFieldDefinitions, addCustomFieldDefinition, updateCustomFieldDefinition, deleteCustomFieldDefinition,
    ensureModulesLoaded, addToast, currentEmployeeId,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  // ---- Tab State ----
  const [activeTab, setActiveTab] = useState('directory')
  const tabs = [
    { id: 'directory', label: t('directory'), count: employees.length },
    { id: 'org-chart', label: t('orgChart') },
    { id: 'analytics', label: t('analytics') },
    { id: 'documents', label: t('documents'), count: employeeDocuments.length },
    { id: 'timeline', label: t('timeline') },
    { id: 'bulk-actions', label: t('bulkActions') },
    { id: 'custom-fields', label: 'Custom Fields', count: customFieldDefinitions.length },
    { id: 'history', label: 'History' },
    { id: 'positions', label: 'Positions' },
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
  const [formErrors, setFormErrors] = useState<{ full_name?: string; email?: string }>({})

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
  const [bulkStatusDept, setBulkStatusDept] = useState('')
  const [bulkStatusRole, setBulkStatusRole] = useState('')
  const [docFileName, setDocFileName] = useState<string | null>(null)

  // ---- History Tab State ----
  const [historyData, setHistoryData] = useState<any[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyEmployee, setHistoryEmployee] = useState('')
  const [historyFieldFilter, setHistoryFieldFilter] = useState('all')
  const [asOfDate, setAsOfDate] = useState('')
  const [asOfSnapshot, setAsOfSnapshot] = useState<Record<string, string | null> | null>(null)

  // ---- Positions Tab State ----
  const [positionsData, setPositionsData] = useState<any[]>([])
  const [positionsLoading, setPositionsLoading] = useState(false)
  const [positionSearch, setPositionSearch] = useState('')
  const [positionStatusFilter, setPositionStatusFilter] = useState('all')
  const [showPositionModal, setShowPositionModal] = useState(false)
  const [positionForm, setPositionForm] = useState({
    position_code: '', title: '', department_id: '', level: '', status: 'active',
    fte: '1.0', cost_center: '', location: '', is_key_position: false,
    budgeted_salary_min: '', budgeted_salary_max: '', currency: 'USD',
  })

  // ---- Org Restructure State ----
  const [showRestructureModal, setShowRestructureModal] = useState(false)
  const [restructureForm, setRestructureForm] = useState({ from_manager: '', to_manager: '', to_department: '', reason: '' })
  const restructurePreview = (() => {
    if (!restructureForm.from_manager) return []
    return employees.filter(e => (e as any).manager_id === restructureForm.from_manager || (e as any).managerId === restructureForm.from_manager)
  })()

  function executeRestructure() {
    if (!restructureForm.from_manager && !restructureForm.to_department) { addToast?.('Please select a manager or department', 'error'); return }
    const affected = restructurePreview
    if (affected.length === 0 && !restructureForm.to_department) { addToast?.('No employees will be affected by this restructure', 'error'); return }
    setSaving(true)
    try {
      let count = 0
      if (restructureForm.from_manager) {
        affected.forEach(emp => {
          const updates: Record<string, any> = {}
          if (restructureForm.to_manager) updates.managerId = restructureForm.to_manager
          if (restructureForm.to_department) updates.department_id = restructureForm.to_department
          if (Object.keys(updates).length > 0) {
            updateEmployee(emp.id, updates)
            count++
          }
        })
      } else if (restructureForm.to_department) {
        // Just department change with no manager filter
        employees.filter(e => e.department_id !== restructureForm.to_department).slice(0, 5).forEach(emp => {
          updateEmployee(emp.id, { department_id: restructureForm.to_department })
          count++
        })
      }
      // T4-I: Show restructure summary with notifications
      if (count > 0) {
        const newMgrName = restructureForm.to_manager ? getEmployeeName(restructureForm.to_manager) : null
        const newDeptName = restructureForm.to_department ? getDepartmentName(restructureForm.to_department) : null
        const detail = [newMgrName ? `new manager: ${newMgrName}` : '', newDeptName ? `new dept: ${newDeptName}` : ''].filter(Boolean).join(', ')
        addToast?.(`Restructure complete — ${count} employee(s) updated (${detail})`)
      }
      addToast?.(`${count} employee(s) reassigned successfully`)
      setShowRestructureModal(false)
      setRestructureForm({ from_manager: '', to_manager: '', to_department: '', reason: '' })
    } finally {
      setSaving(false)
    }
  }

  // ---- Bulk Import State ----
  const [importStep, setImportStep] = useState<'idle' | 'preview' | 'importing' | 'results'>('idle')
  const [importFile, setImportFile] = useState<File | null>(null)
  const [importPreviewData, setImportPreviewData] = useState<{ valid: any[]; errors: { row: number; message: string }[]; totalRows: number } | null>(null)
  const [importCredentials, setImportCredentials] = useState<EmployeeCredential[]>([])
  const [importSkipped, setImportSkipped] = useState<{ email: string; reason: string }[]>([])
  const [importProgress, setImportProgress] = useState(0)
  const [generateCredentials, setGenerateCredentials] = useState(true)
  const [showImportModal, setShowImportModal] = useState(false)

  // ---- Custom Fields State ----
  const [showCFModal, setShowCFModal] = useState(false)
  const [editingCF, setEditingCF] = useState<string | null>(null)
  const [cfForm, setCfForm] = useState({
    name: '', field_type: 'text' as string, entity_type: 'employee' as string,
    description: '', options: '' as string, is_required: false, is_visible: true, group_name: '',
  })

  // ---- Saving & Confirmation State ----
  const [saving, setSaving] = useState(false)
  const [confirmAction, setConfirmAction] = useState<{ title: string; message: string; onConfirm: () => void } | null>(null)

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
  const headcountData = useMemo(() => ({
    byDepartment: headcountRaw.departmentBreakdown.map(d => ({ name: d.name, count: d.count })),
    byCountry: headcountRaw.countryBreakdown.map((c, i) => ({ name: c.name, value: c.count, color: CHART_SERIES[i % CHART_SERIES.length] })),
    byLevel: headcountRaw.levelBreakdown.map(l => ({ name: l.name, count: l.count })),
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

  // T5 #38: Duplicate employee detection
  const [showDupEmpWarning, setShowDupEmpWarning] = useState(false)
  const [dupEmpMatch, setDupEmpMatch] = useState<any>(null)
  const [dupEmpConfirmed, setDupEmpConfirmed] = useState(false)

  // T5 #33: Country Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferForm, setTransferForm] = useState({ employee_id: '', to_country: '', new_salary: 0, effective_date: '', new_currency: 'NGN' })

  // ---- Handlers ----
  const addSubmittingRef = useRef(false)

  function submitAdd() {
    if (addSubmittingRef.current || saving) return
    const errors: { full_name?: string; email?: string } = {}
    if (!form.full_name.trim()) errors.full_name = t('fullNameRequired')
    if (!form.email.trim()) errors.email = t('emailRequired')
    else if (!/\S+@\S+\.\S+/.test(form.email)) errors.email = t('emailInvalid')
    if (Object.keys(errors).length > 0) { setFormErrors(errors); return }
    setFormErrors({})

    // T5 #38: Check for duplicate employee
    if (!dupEmpConfirmed) {
      const nameLower = form.full_name.toLowerCase()
      const possibleDup = employees.find(e => {
        const existingName = (e.profile?.full_name || '').toLowerCase()
        const existingEmail = (e.profile?.email || '').toLowerCase()
        return existingName === nameLower || existingEmail === form.email.toLowerCase()
      })
      if (possibleDup) {
        setDupEmpMatch(possibleDup)
        setShowDupEmpWarning(true)
        return
      }
    }

    addSubmittingRef.current = true
    setSaving(true)
    try {
      addEmployee({
        department_id: form.department_id || departments[0]?.id,
        job_title: form.job_title || 'Employee',
        level: form.level,
        country: form.country,
        role: form.role,
        profile: { full_name: form.full_name, email: form.email, avatar_url: null, phone: form.phone || null },
      })
      setShowAddModal(false)
      setDupEmpConfirmed(false)
      setForm({ full_name: '', email: '', phone: '', job_title: '', level: 'Mid', department_id: '', country: 'Nigeria', role: 'employee' })
    } finally {
      setSaving(false)
      setTimeout(() => { addSubmittingRef.current = false }, 0)
    }
  }

  // T5 #33: Country transfer
  function executeCountryTransfer() {
    if (!transferForm.employee_id) { addToast?.('Please select an employee', 'error'); return }
    if (!transferForm.to_country) { addToast?.('Please select a destination country', 'error'); return }
    if (!transferForm.effective_date) { addToast?.('Please set an effective date', 'error'); return }
    const emp = employees.find(e => e.id === transferForm.employee_id)
    if (!emp) return
    const fromCountry = emp.country || 'Unknown'
    setSaving(true)
    try {
      // Update employee country and add transfer metadata for payroll exclusion
      updateEmployee(emp.id, {
        country: transferForm.to_country,
        transferDate: transferForm.effective_date,
        previousCountry: fromCountry,
        // Exclude from old country payroll runs after transfer date
        payrollCountryExclude: fromCountry,
        payrollCountryExcludeDate: transferForm.effective_date,
      })
      // Create employment timeline event for audit trail
      addEmployeeDocument({
        employee_id: emp.id,
        document_type: 'transfer_record',
        name: `Country Transfer: ${fromCountry} → ${transferForm.to_country}`,
        status: 'approved',
        expiry_date: null,
        file_size: '—',
        notes: `Effective ${transferForm.effective_date}. Previous: ${fromCountry}. New salary: ${transferForm.new_currency} ${transferForm.new_salary?.toLocaleString() || 'TBD'}.`,
      })
      addToast?.(`${emp.profile?.full_name} transferred from ${fromCountry} to ${transferForm.to_country} effective ${transferForm.effective_date}`)
      setShowTransferModal(false)
      setTransferForm({ employee_id: '', to_country: '', new_salary: 0, effective_date: '', new_currency: 'NGN' })
    } finally {
      setSaving(false)
    }
  }

  function submitDocument() {
    if (!docForm.employee_id) { addToast?.('Please select an employee', 'error'); return }
    if (!docForm.name.trim()) { addToast?.('Document name is required', 'error'); return }
    setSaving(true)
    try {
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
      setDocFileName(null)
    } finally {
      setSaving(false)
    }
  }

  // ---- Bulk Import Handlers ----
  async function handleFileSelect(file: File) {
    setImportFile(file)
    try {
      const isExcel = /\.xlsx?$/i.test(file.name)
      let headers: string[]
      let rows: Record<string, string>[]
      let errors: string[] = []
      let totalRows: number

      if (isExcel) {
        const result = await parseExcelFile(file)
        headers = result.headers
        totalRows = result.rows.length
        rows = result.rows.map(row => {
          const record: Record<string, string> = {}
          headers.forEach((h, idx) => { record[h] = row[idx] || '' })
          return record
        })
      } else {
        const parsed = await readFileAsCSV(file)
        if (parsed.errors.length > 0 && parsed.rows.length === 0) {
          setImportPreviewData({ valid: [], errors: parsed.errors.map((e, i) => ({ row: i + 1, message: e })), totalRows: 0 })
          setImportStep('preview')
          setShowImportModal(true)
          return
        }
        headers = parsed.headers
        rows = parsed.rows
        errors = parsed.errors
        totalRows = parsed.totalRows
      }

      const mapping = mapCSVToEmployeeFields(headers)
      const result = validateEmployeeImport(rows, mapping)
      setImportPreviewData({ valid: result.valid, errors: [...errors.map((e, i) => ({ row: i + 1, message: e })), ...result.errors], totalRows })
      setImportStep('preview')
      setShowImportModal(true)
    } catch {
      setImportPreviewData({ valid: [], errors: [{ row: 0, message: 'Failed to read file. Please ensure it is a valid CSV or Excel file.' }], totalRows: 0 })
      setImportStep('preview')
      setShowImportModal(true)
    }
  }

  function handleImportInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFileSelect(file)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (file && (file.name.endsWith('.csv') || file.type === 'text/csv' || /\.xlsx?$/i.test(file.name))) {
      handleFileSelect(file)
    }
  }

  async function executeImport() {
    if (!importPreviewData || importPreviewData.valid.length === 0) return
    setImportStep('importing')
    setImportProgress(0)

    const existingEmails = employees.map(e => e.profile?.email).filter(Boolean)
    const { credentials, skipped } = generateBulkCredentials(importPreviewData.valid, existingEmails)

    setImportSkipped(skipped)

    // Build employee records from valid credentials
    const employeeRecords = credentials.map(cred => {
      const original = importPreviewData.valid.find(v => v.email === cred.email)
      const dept = departments.find(d => d.name.toLowerCase() === (original?.department || '').toLowerCase())
      return {
        department_id: dept?.id || departments[0]?.id || '',
        job_title: original?.job_title || 'Team Member',
        level: original?.level || 'Mid',
        country: original?.country || 'Nigeria',
        hire_date: original?.hire_date || new Date().toISOString().split('T')[0],
        role: 'employee',
        status: 'active',
        profile: {
          full_name: cred.full_name,
          email: cred.email,
          avatar_url: null,
          phone: original?.phone || null,
        },
        credentials: generateCredentials ? {
          username: cred.username,
          temporary_password: cred.temporary_password,
          must_change_password: true,
        } : undefined,
      }
    })

    // Import in batches (simulate progress for large imports)
    const batchSize = 50
    const total = employeeRecords.length
    for (let i = 0; i < total; i += batchSize) {
      const batch = employeeRecords.slice(i, i + batchSize)
      bulkAddEmployees(batch)
      setImportProgress(Math.min(100, Math.round(((i + batch.length) / total) * 100)))
      // Small delay for visual feedback
      if (total > batchSize) await new Promise(r => setTimeout(r, 200))
    }

    setImportCredentials(credentials)
    setImportProgress(100)
    setImportStep('results')
  }

  function resetImport() {
    setImportStep('idle')
    setImportFile(null)
    setImportPreviewData(null)
    setImportCredentials([])
    setImportSkipped([])
    setImportProgress(0)
    setShowImportModal(false)
  }

  function downloadCredentials() {
    if (importCredentials.length > 0) {
      exportCredentialsToCSV(importCredentials, `employee-credentials-${new Date().toISOString().split('T')[0]}`)
    }
  }

  function downloadTemplate() {
    downloadImportTemplate()
  }

  const timelineIcon = (type: string) => {
    switch (type) {
      case 'hire': return <UserPlus size={16} className="text-gray-400" />
      case 'promotion': return <Award size={16} className="text-tempo-600" />
      case 'transfer': return <ArrowRightLeft size={16} className="text-gray-400" />
      case 'salary_change': return <DollarSign size={16} className="text-gray-400" />
      case 'training': return <GraduationCap size={16} className="text-gray-400" />
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

  // ---- Demo History Data ----
  const CHANGE_TYPE_DISPLAY: Record<string, { label: string; color: string }> = {
    hire: { label: 'Hired', color: 'emerald' },
    promotion: { label: 'Promotion', color: 'blue' },
    transfer: { label: 'Transfer', color: 'purple' },
    compensation: { label: 'Compensation', color: 'amber' },
    termination: { label: 'Termination', color: 'red' },
    correction: { label: 'Correction', color: 'zinc' },
  }
  const FIELD_LABELS: Record<string, string> = {
    job_title: 'Job Title', department_id: 'Department', level: 'Level',
    salary: 'Salary', manager_id: 'Manager', country: 'Country', role: 'Role',
  }
  const demoHistoryData = useMemo(() => {
    if (historyData.length > 0) return historyData
    const sample = employees.slice(0, 8)
    const entries: any[] = []
    sample.forEach((emp, i) => {
      entries.push({
        id: `eh-hire-${i}`, employee_id: emp.id, field_name: 'job_title',
        old_value: null, new_value: emp.job_title || 'Software Engineer',
        effective_date: '2024-01-15', changed_by: null,
        change_reason: 'New hire', change_type: 'hire',
      })
      if (i < 4) {
        entries.push({
          id: `eh-promo-${i}`, employee_id: emp.id, field_name: 'level',
          old_value: 'Mid', new_value: emp.level || 'Senior',
          effective_date: '2025-06-01', changed_by: employees[0]?.id,
          change_reason: 'Annual review', change_type: 'promotion',
        })
        entries.push({
          id: `eh-comp-${i}`, employee_id: emp.id, field_name: 'salary',
          old_value: '8500000', new_value: '10200000',
          effective_date: '2025-06-01', changed_by: employees[0]?.id,
          change_reason: 'Promotion increase', change_type: 'compensation',
        })
      }
      if (i >= 3 && i < 6) {
        entries.push({
          id: `eh-transfer-${i}`, employee_id: emp.id, field_name: 'department_id',
          old_value: departments[0]?.id || 'dep-1', new_value: departments[1]?.id || 'dep-2',
          effective_date: '2025-09-01', changed_by: employees[0]?.id,
          change_reason: 'Org restructure', change_type: 'transfer',
        })
      }
    })
    return entries.sort((a, b) => b.effective_date.localeCompare(a.effective_date))
  }, [historyData, employees, departments])

  const filteredHistory = useMemo(() => {
    let data = demoHistoryData
    if (historyEmployee) data = data.filter(h => h.employee_id === historyEmployee)
    if (historyFieldFilter !== 'all') data = data.filter(h => h.field_name === historyFieldFilter)
    return data
  }, [demoHistoryData, historyEmployee, historyFieldFilter])

  // As-of snapshot computation
  const computeAsOfSnapshot = (empId: string, date: string) => {
    const changes = demoHistoryData
      .filter(h => h.employee_id === empId && h.effective_date <= date)
      .sort((a: any, b: any) => a.effective_date.localeCompare(b.effective_date))
    const state: Record<string, string | null> = {}
    changes.forEach((c: any) => { state[c.field_name] = c.new_value })
    return state
  }

  // ---- Demo Positions Data ----
  const demoPositions = useMemo(() => {
    if (positionsData.length > 0) return positionsData
    const depts = departments.length > 0 ? departments : [{ id: 'dep-1', name: 'Engineering' }, { id: 'dep-2', name: 'Product' }]
    return [
      { id: 'pos-1', position_code: 'ENG-001', title: 'Senior Software Engineer', department_id: depts[0]?.id, level: 'Senior', incumbent_id: employees[0]?.id || null, status: 'active', fte: 1.0, cost_center: 'CC-100', location: 'Lagos', is_key_position: false, budgeted_salary_min: 8000000, budgeted_salary_max: 12000000, currency: 'USD' },
      { id: 'pos-2', position_code: 'ENG-002', title: 'Staff Engineer', department_id: depts[0]?.id, level: 'Staff', incumbent_id: employees[1]?.id || null, status: 'active', fte: 1.0, cost_center: 'CC-100', location: 'Lagos', is_key_position: true, budgeted_salary_min: 12000000, budgeted_salary_max: 18000000, currency: 'USD' },
      { id: 'pos-3', position_code: 'ENG-003', title: 'Engineering Manager', department_id: depts[0]?.id, level: 'Manager', incumbent_id: null, status: 'active', fte: 1.0, cost_center: 'CC-100', location: 'Nairobi', is_key_position: true, budgeted_salary_min: 14000000, budgeted_salary_max: 20000000, currency: 'USD' },
      { id: 'pos-4', position_code: 'PROD-001', title: 'Product Manager', department_id: depts[1]?.id || depts[0]?.id, level: 'Mid', incumbent_id: employees[2]?.id || null, status: 'active', fte: 1.0, cost_center: 'CC-200', location: 'Lagos', is_key_position: false, budgeted_salary_min: 7000000, budgeted_salary_max: 11000000, currency: 'USD' },
      { id: 'pos-5', position_code: 'PROD-002', title: 'Senior Product Manager', department_id: depts[1]?.id || depts[0]?.id, level: 'Senior', incumbent_id: null, status: 'budgeted', fte: 1.0, cost_center: 'CC-200', location: 'Accra', is_key_position: true, budgeted_salary_min: 10000000, budgeted_salary_max: 16000000, currency: 'USD' },
      { id: 'pos-6', position_code: 'ENG-004', title: 'Junior Developer', department_id: depts[0]?.id, level: 'Junior', incumbent_id: employees[3]?.id || null, status: 'active', fte: 1.0, cost_center: 'CC-100', location: 'Lagos', is_key_position: false, budgeted_salary_min: 4000000, budgeted_salary_max: 6000000, currency: 'USD' },
      { id: 'pos-7', position_code: 'ENG-005', title: 'DevOps Engineer', department_id: depts[0]?.id, level: 'Mid', incumbent_id: null, status: 'frozen', fte: 1.0, cost_center: 'CC-100', location: 'Lagos', is_key_position: false, budgeted_salary_min: 7000000, budgeted_salary_max: 10000000, currency: 'USD' },
      { id: 'pos-8', position_code: 'PROD-003', title: 'UX Researcher', department_id: depts[1]?.id || depts[0]?.id, level: 'Mid', incumbent_id: employees[4]?.id || null, status: 'active', fte: 0.5, cost_center: 'CC-200', location: 'Nairobi', is_key_position: false, budgeted_salary_min: 5000000, budgeted_salary_max: 8000000, currency: 'USD' },
    ]
  }, [positionsData, departments, employees])

  const filteredPositions = useMemo(() => {
    let data = demoPositions
    if (positionSearch) {
      const q = positionSearch.toLowerCase()
      data = data.filter((p: any) => p.title.toLowerCase().includes(q) || p.position_code.toLowerCase().includes(q))
    }
    if (positionStatusFilter !== 'all') {
      if (positionStatusFilter === 'vacant') data = data.filter((p: any) => !p.incumbent_id)
      else if (positionStatusFilter === 'filled') data = data.filter((p: any) => !!p.incumbent_id)
      else data = data.filter((p: any) => p.status === positionStatusFilter)
    }
    return data
  }, [demoPositions, positionSearch, positionStatusFilter])

  const positionStats = useMemo(() => {
    const total = demoPositions.length
    const filled = demoPositions.filter((p: any) => !!p.incumbent_id).length
    const vacant = total - filled
    const frozen = demoPositions.filter((p: any) => p.status === 'frozen').length
    const keyPos = demoPositions.filter((p: any) => p.is_key_position).length
    return { total, filled, vacant, frozen, keyPos }
  }, [demoPositions])

  const positionStatusBadge = (pos: any) => {
    if (pos.status === 'frozen') return <Badge variant="default"><Snowflake size={10} className="mr-1" />Frozen</Badge>
    if (pos.status === 'budgeted') return <Badge variant="warning">Budgeted</Badge>
    if (pos.status === 'eliminated') return <Badge variant="error">Eliminated</Badge>
    if (!pos.incumbent_id) return <Badge variant="error">VACANT</Badge>
    return <Badge variant="success">Filled</Badge>
  }

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle', { employeeCount: 0, departmentCount: 0 })} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle', { employeeCount: employees.length, departmentCount: departments.length })}
        actions={
          <div className="flex items-center gap-2">
            <div className="relative group">
              <Button variant="outline" size="sm">
                <Download size={14} /> Export
              </Button>
              <div className="absolute right-0 top-full mt-1 bg-card border border-divider rounded-lg shadow-lg py-1 hidden group-hover:block z-50 min-w-[160px]">
                <button className="w-full px-3 py-1.5 text-xs text-t2 hover:bg-canvas text-left flex items-center gap-2" onClick={() => exportToCSV(filtered, EMPLOYEE_EXPORT_COLUMNS, 'employees-export')}>
                  <Download size={12} /> Export as CSV
                </button>
                <button className="w-full px-3 py-1.5 text-xs text-t2 hover:bg-canvas text-left flex items-center gap-2" onClick={() => exportToExcel(filtered, EMPLOYEE_EXPORT_COLUMNS.map(c => ({ key: c.header, label: c.header })), 'employees-export', EMPLOYEE_EXPORT_COLUMNS)}>
                  <Download size={12} /> Export as Excel
                </button>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={() => { setImportStep('idle'); setShowImportModal(true) }}>
              <Upload size={14} /> Import
            </Button>
            <Button size="sm" onClick={() => setShowAddModal(true)}>
              <Plus size={14} /> {t('addEmployee')}
            </Button>
          </div>
        }
      />

      {/* Stat Cards */}
      <ExpandableStats>
        <StatCard label={t('totalEmployees')} value={employees.length} change={`${departments.length} ${t('departments')}`} changeType="neutral" icon={<Users size={20} />} />
        <StatCard label={t('countriesPresent')} value={countries.length} change={t('multiCountry')} changeType="neutral" icon={<Building2 size={20} />} />
        <StatCard label={t('documentsOnFile')} value={employeeDocuments.length} change={`${employeeDocuments.filter(d => d.status === 'expired').length} ${t('expired')}`} changeType={employeeDocuments.filter(d => d.status === 'expired').length > 0 ? 'negative' : 'positive'} icon={<FileText size={20} />} />
        <StatCard label={t('attritionAlerts')} value={highRiskCount} change={t('highRiskEmployees')} changeType={highRiskCount > 3 ? 'negative' : 'neutral'} icon={<AlertTriangle size={20} />} />
      </ExpandableStats>

      <AIInsightsCard
        insights={bottlenecks}
        title="Tempo AI — Workforce Insights"
        maxVisible={3}
        className="mb-6"
      />

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
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={deptFilter} onChange={(e) => { setDeptFilter(e.target.value); setCurrentPage(1) }}
              options={[{value: 'all', label: t('allDepartments')}, ...departments.map(d => ({value: d.id, label: d.name}))]} />
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={countryFilter} onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1) }}
              options={[{value: 'all', label: t('allCountries')}, ...countries.map(c => ({value: c, label: c}))]} />
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={levelFilter} onChange={(e) => { setLevelFilter(e.target.value); setCurrentPage(1) }}
              options={[{value: 'all', label: t('allLevels')}, ...levels.map(l => ({value: l, label: l}))]} />
            {(search || deptFilter !== 'all' || countryFilter !== 'all' || levelFilter !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters}>{t('clearFilters')}</Button>
            )}
            <div className="ml-auto">
              <Button variant="outline" size="sm" onClick={() => exportToCSV(filtered, EMPLOYEE_EXPORT_COLUMNS, 'employees')}><Download size={14} /> {tc('export')}</Button>
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
                      <td className="px-4 py-3 text-xs text-t2">{getDepartmentName(emp.department_id)}</td>
                      <td className="px-4 py-3 text-xs text-t2">{emp.job_title}</td>
                      <td className="px-4 py-3 text-xs text-t2">{emp.country}</td>
                      <td className="px-4 py-3"><Badge variant="default">{emp.level}</Badge></td>
                      <td className="px-4 py-3">
                        <Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>
                          {emp.role}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-12 text-center text-xs text-t3">{t('noEmployeesFound')}</td></tr>
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
        <div className="-mx-4 -mb-4 sm:-mx-6 sm:-mb-6 lg:-mx-8 lg:-mb-8">
          <OrgChart />
        </div>
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
                  <TempoBarChart data={headcountData.byDepartment.slice(0, 8)} bars={[{ dataKey: 'count', name: 'Count', color: CHART_COLORS.primary }]} xKey="name" height={140} showGrid={false} showYAxis={false} />
                  <div className="mt-3 space-y-1">
                    {headcountData.byDepartment.map(d => (
                      <div key={d.name} className="flex justify-between text-xs">
                        <span className="text-t2">{d.name}</span>
                        <span className="text-t1 font-medium">{d.count} {t('people')}</span>
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
                  <TempoDonutChart data={headcountData.byCountry} height={180} />
                  <div className="mt-3 space-y-1">
                    {headcountData.byCountry.map(c => (
                      <div key={c.name} className="flex justify-between text-xs">
                        <span className="text-t2">{c.name}</span>
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
                <TempoBarChart data={headcountData.byLevel} bars={[{ dataKey: 'count', name: 'Count', color: CHART_COLORS.primary }]} xKey="name" height={140} showGrid={false} showYAxis={false} />
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
                      <td className="px-4 py-2 text-xs text-t2">{risk.department}</td>
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
          <ExpandableStats>
            <StatCard label={t('totalDocuments')} value={employeeDocuments.length} change={t('allTypes')} changeType="neutral" icon={<FolderOpen size={20} />} />
            <StatCard label={t('validDocuments')} value={employeeDocuments.filter(d => d.status === 'valid').length} change={t('upToDate')} changeType="positive" icon={<FileText size={20} />} />
            <StatCard label={t('expiredDocuments')} value={employeeDocuments.filter(d => d.status === 'expired').length} change={t('needsRenewal')} changeType={employeeDocuments.filter(d => d.status === 'expired').length > 0 ? 'negative' : 'positive'} icon={<AlertTriangle size={20} />} />
            <StatCard label={t('pendingReview')} value={employeeDocuments.filter(d => d.status === 'pending_review').length} change={t('awaitingAction')} changeType="neutral" icon={<Clock size={20} />} />
          </ExpandableStats>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 mb-4">
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={docTypeFilter} onChange={(e) => setDocTypeFilter(e.target.value)}
              options={[{value: 'all', label: t('allDocTypes')}, {value: 'contract', label: t('docContract')}, {value: 'id', label: t('docId')}, {value: 'certificate', label: t('docCertificate')}]} />
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={docStatusFilter} onChange={(e) => setDocStatusFilter(e.target.value)}
              options={[{value: 'all', label: t('allStatuses')}, {value: 'valid', label: t('docValid')}, {value: 'expired', label: t('docExpired')}, {value: 'pending_review', label: t('docPendingReview')}]} />
            <div className="ml-auto flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = '.pdf,.doc,.docx,.jpg,.png'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) addToast(`Document "${file.name}" uploaded successfully`)
                }
                input.click()
              }}>
                <Upload size={14} className="mr-1" /> Quick Upload
              </Button>
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
                    <th className="tempo-th text-center px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredDocs.length === 0 ? (
                    <tr><td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{t('noDocumentsFound')}</td></tr>
                  ) : filteredDocs.map(doc => (
                    <tr key={doc.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <FileText size={16} className="text-t3" />
                          <p className="text-sm font-medium text-t1">{doc.name}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{getEmployeeName(doc.employee_id)}</td>
                      <td className="px-4 py-3">
                        <Badge variant={doc.document_type === 'contract' ? 'info' : doc.document_type === 'id' ? 'default' : 'success'}>
                          {doc.document_type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">{docStatusBadge(doc.status)}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{doc.upload_date}</td>
                      <td className="px-4 py-3 text-xs text-t2 text-center">{doc.expiry_date || '-'}</td>
                      <td className="px-4 py-3 text-xs text-t3 text-right">{doc.file_size}</td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost" onClick={() => addToast('Signature request sent to employee')}>
                          <FileCheck size={12} className="mr-1" /> Request Signature
                        </Button>
                      </td>
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
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={timelineTypeFilter} onChange={(e) => setTimelineTypeFilter(e.target.value)}
              options={[{value: 'all', label: t('allEventTypes')}, {value: 'hire', label: t('eventHire')}, {value: 'promotion', label: t('eventPromotion')}, {value: 'transfer', label: t('eventTransfer')}, {value: 'salary_change', label: t('eventSalaryChange')}, {value: 'training', label: t('eventTraining')}]} />
            <Select className="px-3 py-2 text-sm bg-white border border-divider rounded-lg text-t2" value={timelineEmployeeFilter} onChange={(e) => setTimelineEmployeeFilter(e.target.value)}
              options={[{value: '', label: t('allEmployees')}, ...employees.slice(0, 30).map(emp => ({value: emp.id, label: emp.profile.full_name}))]} />
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
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Upload size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('importEmployees')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('importDescription')}</p>
                  <div
                    className="border-2 border-dashed border-divider rounded-lg p-6 text-center mb-3 bg-canvas hover:border-tempo-400 hover:bg-tempo-50/30 transition-colors cursor-pointer"
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => document.getElementById('csv-file-input')?.click()}
                  >
                    <Upload size={24} className="mx-auto text-t3 mb-2" />
                    <p className="text-sm text-t2">{t('dragDropCsv')}</p>
                    <p className="text-xs text-t3 mt-1">{t('csvFormat')}</p>
                  </div>
                  <input id="csv-file-input" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportInputChange} />
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => document.getElementById('csv-file-input')?.click()}>
                      <Upload size={14} /> {t('selectFile')}
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={downloadTemplate}>
                      <Download size={14} /> CSV Template
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" onClick={generateEmployeeImportTemplate}>
                      <Download size={14} /> Excel Template
                    </Button>
                  </div>
                  <div className="mt-3 bg-canvas rounded-lg p-3">
                    <p className="text-[0.65rem] font-medium text-t2 mb-1">{tc('supportedFields')}</p>
                    <p className="text-[0.6rem] text-t3">full_name, email, job_title, department, country, level, hire_date, phone, role, manager_email, location, employment_type, bank_name, bank_account_number, bank_account_name, tax_id_number, date_of_birth, emergency_contact_name, emergency_contact_phone</p>
                    <p className="text-[0.6rem] text-tempo-600 mt-1">{tc('autoCredentials')}</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Export Employees */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('exportEmployees')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('exportDescription')}</p>
                  <div className="space-y-2">
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportToCSV(employees, EMPLOYEE_EXPORT_COLUMNS, 'employees-export')}><Download size={14} /> {t('exportCsv')}</Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportToExcel(employees, EMPLOYEE_EXPORT_COLUMNS.map(c => ({ key: c.header, label: c.header })), 'employees-export', EMPLOYEE_EXPORT_COLUMNS)}><Download size={14} /> {t('exportExcel')}</Button>
                    <Button variant="outline" size="sm" className="w-full" onClick={() => exportToPrint(employees, EMPLOYEE_EXPORT_COLUMNS, 'Employee Directory')}><Download size={14} /> {t('exportPdf')}</Button>
                  </div>
                </div>
              </div>
            </Card>

            {/* Bulk Department Transfer */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <ArrowRightLeft size={20} className="text-gray-500" />
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
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Layers size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">{t('bulkStatusChange')}</h3>
                  <p className="text-xs text-t3 mb-3">{t('bulkStatusDescription')}</p>
                  <Button size="sm" onClick={() => setShowBulkStatusModal(true)}>{t('changeStatus')}</Button>
                </div>
              </div>
            </Card>

            {/* Country Transfer */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Globe size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">Country Transfer</h3>
                  <p className="text-xs text-t3 mb-3">Transfer an employee between countries with payroll and compliance updates</p>
                  <Button size="sm" onClick={() => setShowTransferModal(true)}>Start Transfer</Button>
                </div>
              </div>
            </Card>

            {/* Bulk Custom Field Updates */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Hash size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">Bulk Custom Field Updates</h3>
                  <p className="text-xs text-t3 mb-3">Update custom field values for multiple employees at once</p>
                  <Button size="sm" onClick={() => {
                    if (customFieldDefinitions.length === 0) {
                      addToast('No custom fields defined. Create custom fields in the Custom Fields tab first.', 'error')
                      return
                    }
                    addToast('Bulk custom field update: Select employees in the directory tab, then use the Custom Fields tab to apply values in bulk.', 'info')
                  }}>Update Custom Fields</Button>
                </div>
              </div>
            </Card>

            {/* Org Restructure */}
            <Card>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <Building2 size={20} className="text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-t1 mb-1">Org Restructure</h3>
                  <p className="text-xs text-t3 mb-3">Bulk reassign employees to new managers and departments with impact preview</p>
                  <Button size="sm" onClick={() => setShowRestructureModal(true)}>Start Restructure</Button>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      {/* ============================================================ */}
      {/* TAB 7: CUSTOM FIELDS */}
      {/* ============================================================ */}
      {activeTab === 'custom-fields' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">Custom Field Definitions</h3>
              <p className="text-xs text-t3 mt-1">Define custom fields that appear on employee profiles across your organization</p>
            </div>
            <Button size="sm" onClick={() => {
              setEditingCF(null)
              setCfForm({ name: '', field_type: 'text', entity_type: 'employee', description: '', options: '', is_required: false, is_visible: true, group_name: '' })
              setShowCFModal(true)
            }}>
              <Plus size={14} /> Add Field
            </Button>
          </div>

          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider text-t3 font-medium">
                    <th className="text-left px-4 py-3">Field Name</th>
                    <th className="text-left px-4 py-3">Type</th>
                    <th className="text-left px-4 py-3">Entity</th>
                    <th className="text-left px-4 py-3">Group</th>
                    <th className="text-left px-4 py-3">Required</th>
                    <th className="text-left px-4 py-3">Visible</th>
                    <th className="text-left px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {customFieldDefinitions.map(def => (
                    <tr key={def.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <span className="text-t1 font-medium">{def.name}</span>
                          {def.description && <p className="text-[0.6rem] text-t3 mt-0.5">{def.description}</p>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="default">{def.field_type.replace(/_/g, ' ')}</Badge>
                      </td>
                      <td className="px-4 py-3 text-t2 capitalize">{def.entity_type}</td>
                      <td className="px-4 py-3 text-t2">{def.group_name || '-'}</td>
                      <td className="px-4 py-3">
                        {def.is_required ? (
                          <span className="text-red-400 text-xs">Required</span>
                        ) : (
                          <span className="text-t3 text-xs">Optional</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {def.is_visible ? (
                          <Eye size={14} className="text-green-400" />
                        ) : (
                          <EyeOff size={14} className="text-t3" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingCF(def.id)
                              setCfForm({
                                name: def.name,
                                field_type: def.field_type,
                                entity_type: def.entity_type,
                                description: def.description || '',
                                options: def.options ? (def.options as string[]).join(', ') : '',
                                is_required: def.is_required,
                                is_visible: def.is_visible,
                                group_name: def.group_name || '',
                              })
                              setShowCFModal(true)
                            }}
                            className="p-1 rounded hover:bg-white/10 text-t3 hover:text-t1 transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ title: 'Delete Custom Field', message: `Are you sure you want to delete the field "${def.name}"? This cannot be undone.`, onConfirm: () => { deleteCustomFieldDefinition(def.id); setConfirmAction(null) } })}
                            className="p-1 rounded hover:bg-red-500/10 text-t3 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {customFieldDefinitions.length === 0 && (
              <div className="px-6 py-8 text-center">
                <Settings size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-xs text-t3">No custom fields defined yet</p>
                <p className="text-[0.65rem] text-t3 mt-1">Create custom fields to capture additional employee data</p>
              </div>
            )}
          </Card>

          {/* Field Type Legend */}
          <Card>
            <h4 className="text-xs font-semibold text-t3 uppercase mb-3">Supported Field Types</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[
                { type: 'text', desc: 'Free text input' },
                { type: 'number', desc: 'Numeric values' },
                { type: 'date', desc: 'Date picker' },
                { type: 'boolean', desc: 'Yes/No toggle' },
                { type: 'select', desc: 'Single choice dropdown' },
                { type: 'multi_select', desc: 'Multiple choice tags' },
                { type: 'url', desc: 'Web link' },
                { type: 'email', desc: 'Email address' },
                { type: 'phone', desc: 'Phone number' },
              ].map(ft => (
                <div key={ft.type} className="flex items-center gap-2 text-xs">
                  <Badge variant="default">{ft.type.replace(/_/g, ' ')}</Badge>
                  <span className="text-t3">{ft.desc}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* HISTORY TAB */}
      {/* ============================================================ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-t1">Employee Change History</h3>
              <p className="text-xs text-t3 mt-1">Effective-dated audit trail of all employee field changes with as-of date reconstruction</p>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                label="Employee"
                value={historyEmployee}
                onChange={(e) => { setHistoryEmployee(e.target.value); setAsOfSnapshot(null) }}
                options={[{ value: '', label: 'All Employees' }, ...employees.slice(0, 50).map(emp => ({ value: emp.id, label: emp.profile?.full_name || emp.id }))]}
              />
              <Select
                label="Field"
                value={historyFieldFilter}
                onChange={(e) => setHistoryFieldFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All Fields' },
                  { value: 'job_title', label: 'Job Title' },
                  { value: 'department_id', label: 'Department' },
                  { value: 'level', label: 'Level' },
                  { value: 'salary', label: 'Salary' },
                  { value: 'manager_id', label: 'Manager' },
                  { value: 'country', label: 'Country' },
                ]}
              />
              <div>
                <label className="block text-xs font-medium text-t3 mb-1">As-Of Date</label>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="w-full rounded-lg border border-divider bg-chrome px-3 py-2 text-sm text-t1 focus:border-tempo-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end">
                <Button
                  size="sm"
                  disabled={!historyEmployee || !asOfDate}
                  onClick={() => {
                    if (historyEmployee && asOfDate) {
                      const snap = computeAsOfSnapshot(historyEmployee, asOfDate)
                      setAsOfSnapshot(snap)
                    }
                  }}
                >
                  <CalendarClock size={14} /> Reconstruct State
                </Button>
              </div>
            </div>
          </Card>

          {/* As-Of Snapshot */}
          {asOfSnapshot && historyEmployee && (
            <Card>
              <div className="flex items-center gap-2 mb-3">
                <CalendarClock size={16} className="text-tempo-500" />
                <h4 className="text-sm font-semibold text-t1">
                  {getEmployeeName(historyEmployee)} as of {asOfDate}
                </h4>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(asOfSnapshot).map(([field, value]) => (
                  <div key={field} className="bg-canvas rounded-lg p-3">
                    <p className="text-[0.65rem] text-t3 uppercase font-medium">{FIELD_LABELS[field] || field}</p>
                    <p className="text-sm text-t1 font-medium mt-1">
                      {field === 'department_id' ? getDepartmentName(value || '') :
                       field === 'manager_id' ? getEmployeeName(value || '') :
                       field === 'salary' ? `$${(Number(value) / 100).toLocaleString()}` :
                       value || '-'}
                    </p>
                  </div>
                ))}
              </div>
              {Object.keys(asOfSnapshot).length === 0 && (
                <p className="text-xs text-t3 text-center py-4">No recorded changes before this date</p>
              )}
            </Card>
          )}

          {/* Timeline */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-divider">
              <h4 className="text-xs font-semibold text-t3 uppercase">Change Timeline ({filteredHistory.length} records)</h4>
            </div>
            <div className="divide-y divide-divider">
              {filteredHistory.slice(0, 50).map((entry: any) => {
                const ct = CHANGE_TYPE_DISPLAY[entry.change_type] || { label: entry.change_type, color: 'zinc' }
                const empName = getEmployeeName(entry.employee_id) || 'Unknown'
                const changerName = entry.changed_by ? getEmployeeName(entry.changed_by) : 'System'
                return (
                  <div key={entry.id} className="px-4 py-3 flex items-start gap-4 hover:bg-white/[0.02] transition-colors">
                    <div className="shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        ct.color === 'emerald' ? 'bg-emerald-400' :
                        ct.color === 'blue' ? 'bg-blue-400' :
                        ct.color === 'purple' ? 'bg-purple-400' :
                        ct.color === 'amber' ? 'bg-amber-400' :
                        ct.color === 'red' ? 'bg-red-400' : 'bg-zinc-400'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-t1">{empName}</span>
                        <Badge variant={
                          ct.color === 'emerald' ? 'success' :
                          ct.color === 'blue' ? 'info' :
                          ct.color === 'amber' ? 'warning' :
                          ct.color === 'red' ? 'error' : 'default'
                        }>{ct.label}</Badge>
                        <span className="text-xs text-t3">{FIELD_LABELS[entry.field_name] || entry.field_name}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs">
                        {entry.old_value && (
                          <>
                            <span className="text-t3 line-through">
                              {entry.field_name === 'department_id' ? getDepartmentName(entry.old_value) :
                               entry.field_name === 'manager_id' ? getEmployeeName(entry.old_value) :
                               entry.field_name === 'salary' ? `$${(Number(entry.old_value) / 100).toLocaleString()}` :
                               entry.old_value}
                            </span>
                            <ChevronRight size={12} className="text-t3" />
                          </>
                        )}
                        <span className="text-t1 font-medium">
                          {entry.field_name === 'department_id' ? getDepartmentName(entry.new_value) :
                           entry.field_name === 'manager_id' ? getEmployeeName(entry.new_value) :
                           entry.field_name === 'salary' ? `$${(Number(entry.new_value) / 100).toLocaleString()}` :
                           entry.new_value}
                        </span>
                      </div>
                      {entry.change_reason && (
                        <p className="text-[0.65rem] text-t3 mt-1">Reason: {entry.change_reason}</p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-xs text-t2">{entry.effective_date}</p>
                      <p className="text-[0.65rem] text-t3">by {changerName}</p>
                    </div>
                  </div>
                )
              })}
            </div>
            {filteredHistory.length === 0 && (
              <div className="px-6 py-8 text-center">
                <History size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-xs text-t3">No change history found</p>
                <p className="text-[0.65rem] text-t3 mt-1">Changes to employee records will appear here as an audit trail</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* POSITIONS TAB */}
      {/* ============================================================ */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <StatCard label="Total Positions" value={positionStats.total} icon={<Layers size={16} />} />
            <StatCard label="Filled" value={positionStats.filled} icon={<Users size={16} />} change={`${Math.round(positionStats.filled / Math.max(positionStats.total, 1) * 100)}% fill rate`} changeType="positive" />
            <StatCard label="Vacant" value={positionStats.vacant} icon={<CircleDot size={16} />} />
            <StatCard label="Frozen" value={positionStats.frozen} icon={<Snowflake size={16} />} />
            <StatCard label="Key Positions" value={positionStats.keyPos} icon={<ShieldCheck size={16} />} />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
              <input
                type="text"
                placeholder="Search positions..."
                value={positionSearch}
                onChange={(e) => setPositionSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-chrome border border-divider rounded-lg text-t1 placeholder:text-t3 focus:border-tempo-500 focus:outline-none"
              />
            </div>
            <Select
              value={positionStatusFilter}
              onChange={(e) => setPositionStatusFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All Statuses' },
                { value: 'filled', label: 'Filled' },
                { value: 'vacant', label: 'Vacant' },
                { value: 'frozen', label: 'Frozen' },
                { value: 'budgeted', label: 'Budgeted' },
              ]}
            />
            <Button size="sm" onClick={() => setShowPositionModal(true)}>
              <Plus size={14} /> Create Position
            </Button>
          </div>

          {/* Positions Table */}
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-divider text-t3 font-medium">
                    <th className="text-left px-4 py-3">Code</th>
                    <th className="text-left px-4 py-3">Title</th>
                    <th className="text-left px-4 py-3">Department</th>
                    <th className="text-left px-4 py-3">Level</th>
                    <th className="text-left px-4 py-3">Incumbent</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3">FTE</th>
                    <th className="text-left px-4 py-3">Location</th>
                    <th className="text-left px-4 py-3">Salary Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-divider">
                  {filteredPositions.map((pos: any) => {
                    const incumbentName = pos.incumbent_id ? getEmployeeName(pos.incumbent_id) : null
                    return (
                      <tr key={pos.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3 font-mono text-t2">{pos.position_code}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="text-t1 font-medium">{pos.title}</span>
                            {pos.is_key_position && <span title="Key Position"><ShieldCheck size={12} className="text-amber-400" /></span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-t2">{getDepartmentName(pos.department_id)}</td>
                        <td className="px-4 py-3"><Badge variant="default">{pos.level || '-'}</Badge></td>
                        <td className="px-4 py-3">
                          {incumbentName ? (
                            <div className="flex items-center gap-2">
                              <Avatar name={incumbentName} size="xs" />
                              <span className="text-t1">{incumbentName}</span>
                            </div>
                          ) : (
                            <Badge variant="error">VACANT</Badge>
                          )}
                        </td>
                        <td className="px-4 py-3">{positionStatusBadge(pos)}</td>
                        <td className="px-4 py-3 text-t2">{pos.fte}</td>
                        <td className="px-4 py-3 text-t2">
                          <div className="flex items-center gap-1">
                            <MapPin size={10} className="text-t3" />
                            {pos.location || '-'}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-t2">
                          {pos.budgeted_salary_min && pos.budgeted_salary_max ? (
                            <span>${(pos.budgeted_salary_min / 100).toLocaleString()} - ${(pos.budgeted_salary_max / 100).toLocaleString()}</span>
                          ) : '-'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filteredPositions.length === 0 && (
              <div className="px-6 py-8 text-center">
                <Layers size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-xs text-t3">No positions found</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}

      {/* Create Position Modal */}
      <Modal open={showPositionModal} onClose={() => setShowPositionModal(false)} title="Create Position" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Position Code" placeholder="ENG-006" value={positionForm.position_code} onChange={(e) => setPositionForm({ ...positionForm, position_code: e.target.value })} required />
            <Input label="Title" placeholder="Software Engineer" value={positionForm.title} onChange={(e) => setPositionForm({ ...positionForm, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Department" value={positionForm.department_id} onChange={(e) => setPositionForm({ ...positionForm, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
            <Select label="Level" value={positionForm.level} onChange={(e) => setPositionForm({ ...positionForm, level: e.target.value })} options={[
              { value: 'Junior', label: 'Junior' }, { value: 'Mid', label: 'Mid' },
              { value: 'Senior', label: 'Senior' }, { value: 'Staff', label: 'Staff' },
              { value: 'Manager', label: 'Manager' }, { value: 'Director', label: 'Director' },
              { value: 'VP', label: 'VP' }, { value: 'C-Level', label: 'C-Level' },
            ]} />
            <Select label="Status" value={positionForm.status} onChange={(e) => setPositionForm({ ...positionForm, status: e.target.value })} options={[
              { value: 'active', label: 'Active' }, { value: 'frozen', label: 'Frozen' },
              { value: 'budgeted', label: 'Budgeted' }, { value: 'eliminated', label: 'Eliminated' },
            ]} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="FTE" type="number" step="0.1" min="0" max="1" value={positionForm.fte} onChange={(e) => setPositionForm({ ...positionForm, fte: e.target.value })} />
            <Input label="Cost Center" placeholder="CC-100" value={positionForm.cost_center} onChange={(e) => setPositionForm({ ...positionForm, cost_center: e.target.value })} />
            <Input label="Location" placeholder="Lagos" value={positionForm.location} onChange={(e) => setPositionForm({ ...positionForm, location: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Min Salary (cents)" type="number" value={positionForm.budgeted_salary_min} onChange={(e) => setPositionForm({ ...positionForm, budgeted_salary_min: e.target.value })} />
            <Input label="Max Salary (cents)" type="number" value={positionForm.budgeted_salary_max} onChange={(e) => setPositionForm({ ...positionForm, budgeted_salary_max: e.target.value })} />
            <Select label="Currency" value={positionForm.currency} onChange={(e) => setPositionForm({ ...positionForm, currency: e.target.value })} options={[
              { value: 'USD', label: 'USD' }, { value: 'NGN', label: 'NGN' },
              { value: 'GHS', label: 'GHS' }, { value: 'KES', label: 'KES' },
            ]} />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={positionForm.is_key_position} onChange={(e) => setPositionForm({ ...positionForm, is_key_position: e.target.checked })} className="w-4 h-4 rounded border-white/10 bg-white/5 text-tempo-500" />
            <span className="text-sm text-t2">Key Position (linked to succession planning)</span>
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPositionModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => {
              if (!positionForm.position_code || !positionForm.title) { addToast?.('Position code and title are required', 'error'); return }
              addToast?.('Position created successfully')
              setShowPositionModal(false)
              setPositionForm({ position_code: '', title: '', department_id: '', level: '', status: 'active', fte: '1.0', cost_center: '', location: '', is_key_position: false, budgeted_salary_min: '', budgeted_salary_max: '', currency: 'USD' })
            }}>Create Position</Button>
          </div>
        </div>
      </Modal>

      {/* Custom Field Definition Modal */}
      <Modal open={showCFModal} onClose={() => setShowCFModal(false)} title={editingCF ? 'Edit Custom Field' : 'Add Custom Field'} size="lg">
        <div className="space-y-4">
          <Input label="Field Name" value={cfForm.name} onChange={(e) => setCfForm({ ...cfForm, name: e.target.value })} required placeholder="e.g., Employee ID, T-Shirt Size" />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Field Type" value={cfForm.field_type} onChange={(e) => setCfForm({ ...cfForm, field_type: e.target.value })} options={[
              { value: 'text', label: 'Text' },
              { value: 'number', label: 'Number' },
              { value: 'date', label: 'Date' },
              { value: 'boolean', label: 'Boolean (Yes/No)' },
              { value: 'select', label: 'Single Select' },
              { value: 'multi_select', label: 'Multi Select' },
              { value: 'url', label: 'URL' },
              { value: 'email', label: 'Email' },
              { value: 'phone', label: 'Phone' },
            ]} />
            <Select label="Entity Type" value={cfForm.entity_type} onChange={(e) => setCfForm({ ...cfForm, entity_type: e.target.value })} options={[
              { value: 'employee', label: 'Employee' },
              { value: 'department', label: 'Department' },
              { value: 'job_posting', label: 'Job Posting' },
              { value: 'application', label: 'Application' },
            ]} />
          </div>
          {(cfForm.field_type === 'select' || cfForm.field_type === 'multi_select') && (
            <Input
              label="Options (comma-separated)"
              value={cfForm.options}
              onChange={(e) => setCfForm({ ...cfForm, options: e.target.value })}
              placeholder="Option 1, Option 2, Option 3"
            />
          )}
          <Input label="Group Name" value={cfForm.group_name} onChange={(e) => setCfForm({ ...cfForm, group_name: e.target.value })} placeholder="e.g., Identification, Personal Preferences" />
          <Input label="Description" value={cfForm.description} onChange={(e) => setCfForm({ ...cfForm, description: e.target.value })} placeholder="Short description of this field" />
          <div className="flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfForm.is_required} onChange={(e) => setCfForm({ ...cfForm, is_required: e.target.checked })} className="w-4 h-4 rounded border-white/10 bg-white/5 text-tempo-500" />
              <span className="text-sm text-t2">Required field</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={cfForm.is_visible} onChange={(e) => setCfForm({ ...cfForm, is_visible: e.target.checked })} className="w-4 h-4 rounded border-white/10 bg-white/5 text-tempo-500" />
              <span className="text-sm text-t2">Visible on profile</span>
            </label>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowCFModal(false)}>{tc('cancel')}</Button>
            <Button onClick={() => {
              if (!cfForm.name.trim()) { addToast?.('Field name is required', 'error'); return }
              if ((cfForm.field_type === 'select' || cfForm.field_type === 'multi_select') && !cfForm.options.trim()) { addToast?.('Options are required for select fields', 'error'); return }
              setSaving(true)
              try {
                const payload = {
                  name: cfForm.name,
                  field_type: cfForm.field_type,
                  entity_type: cfForm.entity_type,
                  description: cfForm.description || null,
                  options: (cfForm.field_type === 'select' || cfForm.field_type === 'multi_select') && cfForm.options
                    ? cfForm.options.split(',').map(o => o.trim()).filter(Boolean)
                    : null,
                  is_required: cfForm.is_required,
                  is_visible: cfForm.is_visible,
                  group_name: cfForm.group_name || null,
                  order_index: customFieldDefinitions.length,
                }
                if (editingCF) {
                  updateCustomFieldDefinition(editingCF, payload)
                } else {
                  addCustomFieldDefinition(payload)
                }
                setShowCFModal(false)
              } finally {
                setSaving(false)
              }
            }} disabled={!cfForm.name || saving}>
              {saving ? 'Saving...' : editingCF ? 'Update Field' : 'Add Field'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Add Employee Modal */}
      <Modal open={showAddModal} onClose={() => { setShowAddModal(false); setFormErrors({}) }} title={t('addEmployeeModal')} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('fullName')} placeholder={t('fullNamePlaceholder')} value={form.full_name} error={formErrors.full_name} onChange={(e) => { setForm({ ...form, full_name: e.target.value }); setFormErrors(prev => ({ ...prev, full_name: undefined })) }} />
            <Input label={t('email')} type="email" placeholder={t('emailPlaceholder')} value={form.email} error={formErrors.email} onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormErrors(prev => ({ ...prev, email: undefined })) }} />
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
            <Button onClick={submitAdd} disabled={saving}>{saving ? 'Saving...' : t('addEmployee')}</Button>
          </div>
        </div>
      </Modal>

      {/* Upload Document Modal */}
      <Modal open={showDocModal} onClose={() => { setShowDocModal(false); setDocFileName(null) }} title={t('uploadDocument')}>
        <div className="space-y-4">
          <Select label={t('tableEmployee')} value={docForm.employee_id} onChange={(e) => setDocForm({ ...docForm, employee_id: e.target.value })} options={employees.slice(0, 30).map(emp => ({ value: emp.id, label: emp.profile.full_name }))} />
          <Select label={t('docType')} value={docForm.document_type} onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value })} options={[
            { value: 'contract', label: t('docContract') },
            { value: 'id', label: t('docId') },
            { value: 'certificate', label: t('docCertificate') },
          ]} />
          <Input label={t('docName')} placeholder={t('docNamePlaceholder')} value={docForm.name} onChange={(e) => setDocForm({ ...docForm, name: e.target.value })} />
          <Input label={t('expiryDate')} type="date" value={docForm.expiry_date} onChange={(e) => setDocForm({ ...docForm, expiry_date: e.target.value })} />
          <div
            className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${docFileName ? 'border-tempo-400 bg-tempo-50/30' : 'border-divider bg-canvas hover:border-tempo-400 hover:bg-tempo-50/30'}`}
            onClick={() => document.getElementById('doc-file-input')?.click()}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
            onDrop={(e) => {
              e.preventDefault()
              e.stopPropagation()
              const file = e.dataTransfer.files[0]
              if (file) setDocFileName(file.name)
            }}
          >
            <Upload size={20} className={`mx-auto mb-1 ${docFileName ? 'text-tempo-600' : 'text-t3'}`} />
            {docFileName ? (
              <p className="text-xs text-tempo-600 font-medium">{docFileName}</p>
            ) : (
              <p className="text-xs text-t3">{t('dragDropFile')}</p>
            )}
          </div>
          <input
            id="doc-file-input"
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) setDocFileName(file.name)
            }}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowDocModal(false); setDocFileName(null) }}>{tc('cancel')}</Button>
            <Button onClick={submitDocument} disabled={saving}>{saving ? 'Saving...' : t('uploadDocument')}</Button>
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
            <Button disabled={saving} onClick={() => {
              if (!bulkTransferForm.from_department) { addToast?.('Please select a source department', 'error'); return }
              if (!bulkTransferForm.to_department) { addToast?.('Please select a destination department', 'error'); return }
              if (bulkTransferForm.from_department === bulkTransferForm.to_department) { addToast?.('Source and destination departments must be different', 'error'); return }
              const count = employees.filter(e => e.department_id === bulkTransferForm.from_department).length
              setConfirmAction({ title: 'Confirm Bulk Transfer', message: `This will transfer ${count} employee(s) from ${getDepartmentName(bulkTransferForm.from_department)} to ${getDepartmentName(bulkTransferForm.to_department)}. Continue?`, onConfirm: () => {
                setSaving(true)
                try {
                  const toTransfer = employees.filter(e => e.department_id === bulkTransferForm.from_department)
                  toTransfer.forEach(emp => updateEmployee(emp.id, { department_id: bulkTransferForm.to_department }))
                  setShowBulkTransferModal(false)
                  setBulkTransferForm({ from_department: '', to_department: '', reason: '' })
                  addToast?.(`${toTransfer.length} employee(s) transferred successfully`)
                } finally { setSaving(false) }
                setConfirmAction(null)
              }})
            }}>{saving ? 'Saving...' : t('executeTransfer')}</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Status Change Modal */}
      <Modal open={showBulkStatusModal} onClose={() => { setShowBulkStatusModal(false); setBulkStatusDept(''); setBulkStatusRole('') }} title={t('bulkStatusChange')}>
        <div className="space-y-4">
          <Select label={t('selectDepartment')} value={bulkStatusDept} onChange={(e) => setBulkStatusDept(e.target.value)} options={departments.map(d => ({ value: d.id, label: d.name }))} />
          <Select label={t('newRole')} value={bulkStatusRole} onChange={(e) => setBulkStatusRole(e.target.value)} options={[
            { value: 'employee', label: t('roleEmployee') },
            { value: 'manager', label: t('roleManager') },
            { value: 'admin', label: t('roleAdmin') },
          ]} />
          {bulkStatusDept && (
            <div className="bg-canvas rounded-lg p-3">
              <p className="text-xs text-t3">
                {employees.filter(e => e.department_id === bulkStatusDept).length} employee(s) in {getDepartmentName(bulkStatusDept)} will be updated{bulkStatusRole ? ` to role "${bulkStatusRole}"` : ''}.
              </p>
            </div>
          )}
          <div className="bg-canvas rounded-lg p-3">
            <p className="text-xs text-t3">{t('bulkStatusNote')}</p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowBulkStatusModal(false); setBulkStatusDept(''); setBulkStatusRole('') }}>{tc('cancel')}</Button>
            <Button disabled={saving} onClick={() => {
              if (!bulkStatusDept) { addToast?.('Please select a department', 'error'); return }
              if (!bulkStatusRole) { addToast?.('Please select a new role', 'error'); return }
              const count = employees.filter(e => e.department_id === bulkStatusDept).length
              setConfirmAction({ title: 'Confirm Bulk Status Change', message: `This will change the role of ${count} employee(s) in ${getDepartmentName(bulkStatusDept)} to "${bulkStatusRole}". Continue?`, onConfirm: () => {
                setSaving(true)
                try {
                  const toUpdate = employees.filter(e => e.department_id === bulkStatusDept)
                  toUpdate.forEach(emp => updateEmployee(emp.id, { role: bulkStatusRole }))
                  setShowBulkStatusModal(false)
                  setBulkStatusDept('')
                  setBulkStatusRole('')
                  addToast?.(`${toUpdate.length} employee(s) updated successfully`)
                } finally { setSaving(false) }
                setConfirmAction(null)
              }})
            }}>{saving ? 'Saving...' : t('applyChanges')}</Button>
          </div>
        </div>
      </Modal>

      {/* T5 #38: Duplicate Employee Warning */}
      <Modal open={showDupEmpWarning} onClose={() => setShowDupEmpWarning(false)} title="Possible Duplicate Employee">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
            <AlertTriangle size={16} className="text-amber-600 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">A similar employee already exists</p>
              {dupEmpMatch && (
                <div className="mt-2 bg-white rounded-lg p-3 border border-amber-100">
                  <p className="text-sm font-medium text-t1">{dupEmpMatch.profile?.full_name}</p>
                  <p className="text-xs text-t3">{dupEmpMatch.profile?.email} &middot; {dupEmpMatch.job_title} &middot; {dupEmpMatch.country}</p>
                </div>
              )}
              <p className="text-xs text-amber-700 mt-2">Are you sure you are creating a different person?</p>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { setShowDupEmpWarning(false); setDupEmpConfirmed(false) }}>Cancel</Button>
            <Button onClick={() => { setShowDupEmpWarning(false); setDupEmpConfirmed(true); submitAdd() }}>Yes, Create Anyway</Button>
          </div>
        </div>
      </Modal>

      {/* T5 #33: Country Transfer Modal */}
      <Modal open={showTransferModal} onClose={() => setShowTransferModal(false)} title="Transfer Employee to Country">
        <div className="space-y-4">
          <Select label="Employee" value={transferForm.employee_id} onChange={e => setTransferForm(f => ({ ...f, employee_id: e.target.value }))}
            options={[{ value: '', label: 'Select employee...' }, ...employees.map(e => ({ value: e.id, label: `${e.profile?.full_name || e.id} (${e.country || 'N/A'})` }))]} />
          <Select label="Destination Country" value={transferForm.to_country} onChange={e => setTransferForm(f => ({ ...f, to_country: e.target.value }))}
            options={[{ value: '', label: 'Select country...' }, { value: 'Ghana', label: 'Ghana' }, { value: 'Nigeria', label: 'Nigeria' }, { value: 'Kenya', label: 'Kenya' }, { value: 'South Africa', label: 'South Africa' }]} />
          <Input label="Effective Date" type="date" value={transferForm.effective_date} onChange={e => setTransferForm(f => ({ ...f, effective_date: e.target.value }))} />
          <Input label="New Salary (local currency)" type="number" value={transferForm.new_salary || ''} onChange={e => setTransferForm(f => ({ ...f, new_salary: Number(e.target.value) }))} />
          {transferForm.employee_id && transferForm.to_country && (() => {
            const emp = employees.find(e => e.id === transferForm.employee_id)
            const fromCountry = emp?.country || '—'
            const currencyMap: Record<string, { currency: string; rate: number }> = {
              'Ghana': { currency: 'GHS', rate: 12.5 },
              'Nigeria': { currency: 'NGN', rate: 1550 },
              'Kenya': { currency: 'KES', rate: 153 },
              'South Africa': { currency: 'ZAR', rate: 18.5 },
            }
            const fromRate = currencyMap[fromCountry]
            const toRate = currencyMap[transferForm.to_country]
            const currentSalary = (emp as any)?.salary || transferForm.new_salary || 0
            const convertedEstimate = fromRate && toRate && currentSalary
              ? Math.round(currentSalary / fromRate.rate * toRate.rate)
              : null
            return (
              <div className="bg-canvas rounded-lg p-3 text-xs text-t3 space-y-1">
                <p>This will:</p>
                <p>1. Update payroll country from {fromCountry} to {transferForm.to_country}</p>
                <p>2. Archive previous country payslips</p>
                <p>3. Start fresh payslip history in {transferForm.to_country}</p>
                <p>4. Notify old and new managers</p>
                {convertedEstimate ? (
                  <div className="mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                    <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Salary Conversion Estimate</p>
                    <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                      {fromRate?.currency} {currentSalary.toLocaleString()} ≈ {toRate?.currency} {convertedEstimate.toLocaleString()} (indicative rate, adjust as needed)
                    </p>
                  </div>
                ) : null}
              </div>
            )
          })()}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowTransferModal(false)}>Cancel</Button>
            <Button onClick={executeCountryTransfer} disabled={!transferForm.employee_id || !transferForm.to_country || !transferForm.effective_date || saving}>{saving ? 'Saving...' : 'Execute Transfer'}</Button>
          </div>
        </div>
      </Modal>

      {/* Org Restructure Modal */}
      <Modal open={showRestructureModal} onClose={() => { setShowRestructureModal(false); setRestructureForm({ from_manager: '', to_manager: '', to_department: '', reason: '' }) }} title="Org Restructure" size="lg">
        <div className="space-y-4">
          <p className="text-xs text-t3">Reassign employees from one manager to another, optionally changing their department.</p>
          <Select label="Current Manager (move reports from)" value={restructureForm.from_manager} onChange={e => setRestructureForm(f => ({ ...f, from_manager: e.target.value }))}
            options={[{ value: '', label: 'Select manager...' }, ...employees.filter(e => e.role === 'manager' || e.role === 'admin' || e.role === 'owner').map(e => ({ value: e.id, label: e.profile?.full_name || e.id }))]} />
          <Select label="New Manager (reassign to)" value={restructureForm.to_manager} onChange={e => setRestructureForm(f => ({ ...f, to_manager: e.target.value }))}
            options={[{ value: '', label: 'Select new manager...' }, ...employees.filter(e => e.role === 'manager' || e.role === 'admin' || e.role === 'owner').map(e => ({ value: e.id, label: e.profile?.full_name || e.id }))]} />
          <Select label="New Department (optional)" value={restructureForm.to_department} onChange={e => setRestructureForm(f => ({ ...f, to_department: e.target.value }))}
            options={[{ value: '', label: 'Keep current department' }, ...departments.map(d => ({ value: d.id, label: d.name }))]} />
          <Input label="Reason" value={restructureForm.reason} onChange={e => setRestructureForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Manager departure, team reorganization" />

          {/* Impact Preview */}
          {restructureForm.from_manager && (
            <div className="bg-canvas rounded-lg p-4">
              <h4 className="text-xs font-semibold text-t1 mb-2">Impact Preview</h4>
              {restructurePreview.length === 0 ? (
                <p className="text-xs text-t3">No direct reports found for this manager.</p>
              ) : (
                <>
                  <p className="text-xs text-t3 mb-2">{restructurePreview.length} employee(s) will be affected:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {restructurePreview.map(emp => (
                      <div key={emp.id} className="flex items-center justify-between text-xs">
                        <span className="text-t1">{emp.profile?.full_name || emp.id}</span>
                        <span className="text-t3">{emp.job_title} &middot; {getDepartmentName(emp.department_id)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRestructureModal(false)}>Cancel</Button>
            <Button onClick={() => {
              setConfirmAction({ title: 'Confirm Org Restructure', message: `This will reassign ${restructurePreview.length || 'up to 5'} employee(s). This action cannot be undone. Continue?`, onConfirm: () => { executeRestructure(); setConfirmAction(null) } })
            }} disabled={(!restructureForm.from_manager && !restructureForm.to_department) || saving}>
              {saving ? 'Saving...' : `Execute Restructure (${restructurePreview.length} employees)`}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal open={!!confirmAction} onClose={() => setConfirmAction(null)} title={confirmAction?.title || 'Confirm Action'}>
        <div className="space-y-4">
          <p className="text-sm text-t2">{confirmAction?.message}</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>{tc('cancel')}</Button>
            <Button onClick={() => confirmAction?.onConfirm()}>Confirm</Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Import Modal */}
      <Modal open={showImportModal} onClose={resetImport} title={t('importEmployees')} size="lg">
        <div className="space-y-4">
          {/* Step 0: Upload */}
          {importStep === 'idle' && (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <h4 className="text-sm font-semibold text-t1 mb-2">Step 1: Download Template</h4>
                <p className="text-xs text-t3 mb-3">Download a template, fill it in with your employee data, then upload it below.</p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={downloadTemplate}>
                    <Download size={14} /> Download CSV Template
                  </Button>
                  <Button variant="outline" size="sm" onClick={generateEmployeeImportTemplate}>
                    <Download size={14} /> Download Excel Template
                  </Button>
                </div>
              </div>
              <div className="bg-canvas rounded-lg p-4">
                <h4 className="text-sm font-semibold text-t1 mb-2">Step 2: Upload File</h4>
                <div
                  className="border-2 border-dashed border-divider rounded-lg p-8 text-center hover:border-tempo-400 hover:bg-tempo-50/30 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('csv-file-input-modal')?.click()}
                >
                  <Upload size={28} className="mx-auto text-t3 mb-2" />
                  <p className="text-sm text-t2">Drag & drop your file here</p>
                  <p className="text-xs text-t3 mt-1">or click to browse (.csv, .xlsx, .xls)</p>
                </div>
                <input id="csv-file-input-modal" type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={handleImportInputChange} />
              </div>
              <div className="bg-canvas rounded-lg p-3">
                <p className="text-[0.65rem] font-medium text-t2 mb-1">Supported Fields</p>
                <p className="text-[0.6rem] text-t3">Full Name, Email, Job Title, Department, Country, Level, Hire Date, Phone, Role, Manager Email, Location, Employment Type, Bank Name, Bank Account Number, Bank Account Name, Tax ID Number, Date of Birth, Emergency Contact Name, Emergency Contact Phone</p>
                <p className="text-[0.6rem] text-tempo-600 mt-1">Only Full Name and Email are required. All other fields are optional.</p>
              </div>
            </>
          )}

          {/* Step 1: Preview */}
          {importStep === 'preview' && importPreviewData && (
            <>
              <div className="bg-canvas rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-t1">{t('importPreview')}</h4>
                  <Badge variant={importPreviewData.errors.length > 0 ? 'warning' : 'success'}>
                    {importPreviewData.valid.length} {tc('valid')} / {importPreviewData.errors.length} {tc('errors')}
                  </Badge>
                </div>

                {/* File info */}
                <div className="flex items-center gap-2 mb-3 text-xs text-t3">
                  <FileText size={14} />
                  <span>{importFile?.name}</span>
                  <span>•</span>
                  <span>{importPreviewData.totalRows} {tc('rows')}</span>
                </div>

                {/* Preview table */}
                {importPreviewData.valid.length > 0 && (
                  <div className="overflow-x-auto mb-3">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-divider">
                          <th className="text-left py-2 px-2 text-t3 font-medium">{t('fullName')}</th>
                          <th className="text-left py-2 px-2 text-t3 font-medium">{t('email')}</th>
                          <th className="text-left py-2 px-2 text-t3 font-medium">{t('jobTitle')}</th>
                          <th className="text-left py-2 px-2 text-t3 font-medium">{tc('department')}</th>
                          <th className="text-left py-2 px-2 text-t3 font-medium">{t('countryLabel')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreviewData.valid.slice(0, 10).map((row, i) => (
                          <tr key={i} className="border-b border-divider/50">
                            <td className="py-1.5 px-2 text-t1">{row.full_name}</td>
                            <td className="py-1.5 px-2 text-t2">{row.email}</td>
                            <td className="py-1.5 px-2 text-t2">{row.job_title}</td>
                            <td className="py-1.5 px-2 text-t2">{row.department}</td>
                            <td className="py-1.5 px-2 text-t2">{row.country}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {importPreviewData.valid.length > 10 && (
                      <p className="text-[0.6rem] text-t3 mt-2 text-center">
                        {tc('andMore', { count: importPreviewData.valid.length - 10 })}
                      </p>
                    )}
                  </div>
                )}

                {/* Validation errors */}
                {importPreviewData.errors.length > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 mt-3">
                    <p className="text-xs font-medium text-red-700 mb-2">{tc('validationErrors')}</p>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {importPreviewData.errors.slice(0, 20).map((err, i) => (
                        <p key={i} className="text-[0.6rem] text-red-600">Row {err.row}: {err.message}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Credential generation toggle */}
              <div className="bg-tempo-50 rounded-lg p-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generateCredentials}
                    onChange={(e) => setGenerateCredentials(e.target.checked)}
                    className="rounded border-divider text-tempo-600"
                  />
                  <div>
                    <p className="text-xs font-medium text-t1">{tc('generateLoginCredentials')}</p>
                    <p className="text-[0.6rem] text-t3">{tc('generateCredentialsDesc')}</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={resetImport}>{tc('cancel')}</Button>
                <Button onClick={executeImport} disabled={importPreviewData.valid.length === 0}>
                  <Upload size={14} /> {tc('importCount', { count: importPreviewData.valid.length })}
                </Button>
              </div>
            </>
          )}

          {/* Step 2: Importing progress */}
          {importStep === 'importing' && (
            <div className="py-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center mx-auto mb-4">
                <Upload size={32} className="text-tempo-600 animate-pulse" />
              </div>
              <h4 className="text-sm font-semibold text-t1 mb-2">{tc('importingEmployees')}</h4>
              <p className="text-xs text-t3 mb-4">{tc('importingDesc')}</p>
              <div className="max-w-xs mx-auto">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-tempo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${importProgress}%` }} />
                </div>
                <p className="text-xs text-t3 mt-2">{importProgress}%</p>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {importStep === 'results' && (
            <>
              <div className="py-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-4">
                  <Award size={32} className="text-green-600" />
                </div>
                <h4 className="text-sm font-semibold text-t1 mb-2">{tc('importComplete')}</h4>
                <p className="text-xs text-t3">{tc('importCompleteDesc', { count: importCredentials.length })}</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-green-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-green-600">{importCredentials.length}</p>
                  <p className="text-[0.6rem] text-green-700">{tc('imported')}</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-amber-600">{importSkipped.length}</p>
                  <p className="text-[0.6rem] text-amber-700">{tc('skipped')}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-3 text-center">
                  <p className="text-lg font-bold text-gray-600">{generateCredentials ? tc('yes') : tc('no')}</p>
                  <p className="text-[0.6rem] text-gray-700">{tc('credentialsGenerated')}</p>
                </div>
              </div>

              {/* Skipped employees */}
              {importSkipped.length > 0 && (
                <div className="bg-amber-50 rounded-lg p-3">
                  <p className="text-xs font-medium text-amber-700 mb-1">{tc('skippedEmployees')}</p>
                  <div className="space-y-1">
                    {importSkipped.map((s, i) => (
                      <p key={i} className="text-[0.6rem] text-amber-600">{s.email}: {s.reason}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Credentials download */}
              {generateCredentials && importCredentials.length > 0 && (
                <div className="bg-tempo-50 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-tempo-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-t1 mb-1">{tc('downloadCredentials')}</p>
                      <p className="text-[0.6rem] text-t3 mb-3">{tc('downloadCredentialsDesc')}</p>
                      <Button size="sm" onClick={downloadCredentials}>
                        <Download size={14} /> {tc('downloadCredentialsCsv')}
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Credential preview */}
              {generateCredentials && importCredentials.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-divider">
                        <th className="text-left py-2 px-2 text-t3 font-medium">{t('fullName')}</th>
                        <th className="text-left py-2 px-2 text-t3 font-medium">{tc('username')}</th>
                        <th className="text-left py-2 px-2 text-t3 font-medium">{tc('tempPassword')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {importCredentials.slice(0, 5).map((cred, i) => (
                        <tr key={i} className="border-b border-divider/50">
                          <td className="py-1.5 px-2 text-t1">{cred.full_name}</td>
                          <td className="py-1.5 px-2 font-mono text-tempo-600">{cred.username}</td>
                          <td className="py-1.5 px-2 font-mono text-t2">{cred.temporary_password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {importCredentials.length > 5 && (
                    <p className="text-[0.6rem] text-t3 mt-1 text-center">{tc('andMore', { count: importCredentials.length - 5 })}</p>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="secondary" onClick={resetImport}>{tc('close')}</Button>
              </div>
            </>
          )}
        </div>
      </Modal>
    </>
  )
}
