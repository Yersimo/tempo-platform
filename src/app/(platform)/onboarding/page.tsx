'use client'

import { useState, useMemo, useEffect, useCallback, useRef as useRefReact } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Select } from '@/components/ui/input'
import { Tabs } from '@/components/ui/tabs'
import { Avatar } from '@/components/ui/avatar'
import { AIInsightCard } from '@/components/ai'
import { suggestOnboardingBuddy, generateOnboardingPlan } from '@/lib/ai-engine'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { useTempo } from '@/lib/store'
import {
  Rocket, Users, Target, Shield, BarChart3, ArrowRight, ArrowLeft,
  CheckCircle, Building, Briefcase, Globe, Zap, Check, Mail, Loader2,
  BookOpen, Heart, UserPlus, Clock, DollarSign, FolderKanban,
  Star, Lightbulb, Calendar, Laptop, Play, FileText, Package,
  GraduationCap, Send, Sparkles, Timer, ChevronRight, User,
  CheckSquare, Video, Coffee, MapPin, Upload, Download, AlertCircle, Table,
  Plus, X
} from 'lucide-react'
import { generateEmployeeImportTemplate, parseExcelFile } from '@/lib/excel-template'

// ─── Platform Setup Wizard (preserved from original) ─────────────────

const setupSteps = [
  {
    id: 'welcome',
    icon: <Rocket size={32} />,
    title: 'Welcome to Tempo',
    subtitle: 'Let\'s set up your workspace in a few quick steps',
  },
  {
    id: 'organization',
    icon: <Building size={32} />,
    title: 'Your Organization',
    subtitle: 'Tell us about your company so we can customize your experience',
  },
  {
    id: 'modules',
    icon: <Zap size={32} />,
    title: 'Choose Your Modules',
    subtitle: 'Select the modules you want to start with. You can always add more later.',
  },
  {
    id: 'team',
    icon: <Users size={32} />,
    title: 'Invite Your Team',
    subtitle: 'Add team members to get started collaborating',
  },
  {
    id: 'import',
    icon: <Upload size={32} />,
    title: 'Import Employees',
    subtitle: 'Bulk import from CSV or skip to add them later',
  },
  {
    id: 'complete',
    icon: <CheckCircle size={32} />,
    title: 'You\'re All Set!',
    subtitle: 'Your workspace is ready. Start exploring Tempo.',
  },
]

const availableModules = [
  { id: 'performance', name: 'Performance', desc: 'Goals, reviews, feedback', icon: <Target size={18} /> },
  { id: 'people', name: 'People', desc: 'Employee directory', icon: <Users size={18} /> },
  { id: 'recruiting', name: 'Recruiting', desc: 'Job postings, pipeline', icon: <UserPlus size={18} /> },
  { id: 'payroll', name: 'Payroll', desc: 'Pay runs, deductions', icon: <DollarSign size={18} /> },
  { id: 'time', name: 'Time & Attendance', desc: 'Leave, timesheets', icon: <Clock size={18} /> },
  { id: 'learning', name: 'Learning', desc: 'Courses, enrollment', icon: <BookOpen size={18} /> },
  { id: 'benefits', name: 'Benefits', desc: 'Plans, enrollment', icon: <Heart size={18} /> },
  { id: 'compensation', name: 'Compensation', desc: 'Bands, salary reviews', icon: <Briefcase size={18} /> },
  { id: 'engagement', name: 'Engagement', desc: 'Surveys, eNPS', icon: <BarChart3 size={18} /> },
  { id: 'expense', name: 'Expenses', desc: 'Reports, approvals', icon: <Globe size={18} /> },
  { id: 'projects', name: 'Projects', desc: 'Tasks, milestones', icon: <FolderKanban size={18} /> },
  { id: 'analytics', name: 'Analytics', desc: 'Insights, dashboards', icon: <Shield size={18} /> },
]

const valueIcons: Record<string, React.ReactNode> = {
  star: <Star size={18} />,
  shield: <Shield size={18} />,
  lightbulb: <Lightbulb size={18} />,
  users: <Users size={18} />,
  heart: <Heart size={18} />,
}

const categoryIcons: Record<string, React.ReactNode> = {
  documents: <FileText size={14} />,
  benefits: <Heart size={14} />,
  payroll: <DollarSign size={14} />,
  equipment: <Package size={14} />,
  training: <GraduationCap size={14} />,
  accounts: <Laptop size={14} />,
}

function Confetti() {
  const [particles, setParticles] = useState<Array<{ id: number; x: number; color: string; delay: number; duration: number }>>([])

  useEffect(() => {
    const colors = ['#f97316', '#8b5cf6', '#22c55e', '#3b82f6', '#eab308', '#ec4899']
    const p = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      delay: Math.random() * 0.5,
      duration: 1.5 + Math.random() * 2,
    }))
    setParticles(p)
  }, [])

  return (
    <>
      <style>{`
        @keyframes confetti-fall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        .confetti-particle {
          animation: confetti-fall linear forwards;
        }
      `}</style>
      <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute w-2 h-2 rounded-full confetti-particle"
            style={{
              left: `${p.x}%`,
              backgroundColor: p.color,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>
    </>
  )
}

export default function OnboardingPage() {
  const router = useRouter()
  const t = useTranslations('onboarding')
  const tc = useTranslations('common')
  const {
    org, updateOrg, employees, departments,
    buddyAssignments, preboardingTasks, welcomeContent,
    addBuddyAssignment, updateBuddyAssignment,
    addPreboardingTask, updatePreboardingTask,
    getEmployeeName, getDepartmentName, addToast,
    ensureModulesLoaded, currentUser, currentEmployeeId,
  } = useTempo()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['employees', 'departments', 'buddyAssignments', 'preboardingTasks'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
    const _t = setTimeout(() => setPageLoading(false), 2000)
    return () => clearTimeout(_t)
  }, [ensureModulesLoaded])

  // ─── Wizard State ────────────────────────────────────────────────
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  const [selectedModules, setSelectedModules] = useState<string[]>(['performance', 'people', 'analytics'])
  const [companySize, setCompanySize] = useState(org?.size || '')
  const [industry, setIndustry] = useState(org?.industry || '')
  const [companyCountry, setCompanyCountry] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('USD')
  const [inviteEmails, setInviteEmails] = useState('')
  const [saving, setSaving] = useState(false)
  const [invitesSent, setInvitesSent] = useState(false)
  const [inviteError, setInviteError] = useState('')

  // ─── CSV Import State ──────────────────────────────────────────────
  const csvInputRef = useRefReact<HTMLInputElement>(null)
  const [csvData, setCsvData] = useState<Array<Record<string, string>>>([])
  const [csvHeaders, setCsvHeaders] = useState<string[]>([])
  const [csvColumnMap, setCsvColumnMap] = useState<Record<string, string>>({})
  const [csvImportStatus, setCsvImportStatus] = useState<'idle' | 'preview' | 'mapping' | 'importing' | 'done'>('idle')
  const [csvImportCount, setCsvImportCount] = useState(0)
  const [csvErrors, setCsvErrors] = useState<string[]>([])

  // ─── Progress Persistence ──────────────────────────────────────────
  const WIZARD_STORAGE_KEY = 'tempo_onboarding_wizard'

  useEffect(() => {
    try {
      const saved = localStorage.getItem(WIZARD_STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.currentStep !== undefined) setCurrentStep(data.currentStep)
        if (data.selectedModules) setSelectedModules(data.selectedModules)
        if (data.companySize) setCompanySize(data.companySize)
        if (data.industry) setIndustry(data.industry)
        if (data.companyCountry) setCompanyCountry(data.companyCountry)
        if (data.defaultCurrency) setDefaultCurrency(data.defaultCurrency)
        if (data.showSetupWizard) setShowSetupWizard(true)
      }
    } catch {}
  }, [])

  const persistWizardState = useCallback((overrides?: Record<string, unknown>) => {
    try {
      localStorage.setItem(WIZARD_STORAGE_KEY, JSON.stringify({
        currentStep, selectedModules, companySize, industry,
        companyCountry, defaultCurrency, showSetupWizard: true,
        ...overrides,
      }))
    } catch {}
  }, [currentStep, selectedModules, companySize, industry, companyCountry, defaultCurrency])

  // ─── CSV Parser ────────────────────────────────────────────────────
  const requiredFields = ['first_name', 'last_name', 'email']
  const optionalFields = ['department', 'job_title', 'start_date', 'phone', 'location', 'manager_email', 'employee_id']
  const allFieldOptions = [...requiredFields, ...optionalFields]

  const parseCSV = useCallback((text: string) => {
    const lines = text.trim().split('\n')
    if (lines.length < 2) { setCsvErrors(['CSV must have a header row and at least one data row']); return }
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''))
    setCsvHeaders(headers)
    // Auto-map columns
    const autoMap: Record<string, string> = {}
    const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '_')
    headers.forEach(h => {
      const norm = normalizeHeader(h)
      const match = allFieldOptions.find(f => {
        const fNorm = f.replace(/_/g, '')
        const hNorm = norm.replace(/_/g, '')
        return hNorm.includes(fNorm) || fNorm.includes(hNorm) || norm === f
      })
      if (match) autoMap[h] = match
    })
    setCsvColumnMap(autoMap)
    const rows = lines.slice(1).filter(l => l.trim()).map(line => {
      const values: string[] = []
      let current = '', inQuotes = false
      for (const char of line) {
        if (char === '"') { inQuotes = !inQuotes }
        else if (char === ',' && !inQuotes) { values.push(current.trim()); current = '' }
        else { current += char }
      }
      values.push(current.trim())
      const row: Record<string, string> = {}
      headers.forEach((h, i) => { row[h] = values[i] || '' })
      return row
    })
    setCsvData(rows)
    setCsvImportStatus('preview')
  }, [])

  const handleCSVFile = useCallback(async (file: File) => {
    setCsvErrors([])
    const isExcel = /\.xlsx?$/i.test(file.name)
    if (isExcel) {
      try {
        const result = await parseExcelFile(file)
        if (result.headers.length === 0) {
          setCsvErrors(['Excel file is empty or has no headers'])
          return
        }
        setCsvHeaders(result.headers)
        const autoMap: Record<string, string> = {}
        const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, '_')
        result.headers.forEach(h => {
          const norm = normalizeHeader(h)
          const match = allFieldOptions.find(f => {
            const fNorm = f.replace(/_/g, '')
            const hNorm = norm.replace(/_/g, '')
            return hNorm.includes(fNorm) || fNorm.includes(hNorm) || norm === f
          })
          if (match) autoMap[h] = match
        })
        setCsvColumnMap(autoMap)
        const rows = result.rows.filter(r => r.some(cell => cell.trim())).map(row => {
          const record: Record<string, string> = {}
          result.headers.forEach((h, i) => { record[h] = row[i] || '' })
          return record
        })
        setCsvData(rows)
        setCsvImportStatus('preview')
      } catch {
        setCsvErrors(['Failed to parse Excel file. Please ensure it is a valid .xlsx or .xls file.'])
      }
    } else {
      const reader = new FileReader()
      reader.onload = (e) => { parseCSV(e.target?.result as string) }
      reader.readAsText(file)
    }
  }, [parseCSV, allFieldOptions])

  const importCSVEmployees = useCallback(async () => {
    setCsvImportStatus('importing')
    setCsvErrors([])
    const errors: string[] = []
    let imported = 0

    // Validate mapping has required fields
    const mappedFields = Object.values(csvColumnMap)
    const missingRequired = requiredFields.filter(f => !mappedFields.includes(f))
    if (missingRequired.length > 0) {
      setCsvErrors([`Missing required column mappings: ${missingRequired.join(', ')}`])
      setCsvImportStatus('mapping')
      return
    }

    const reverseMap: Record<string, string> = {}
    Object.entries(csvColumnMap).forEach(([csvCol, field]) => { reverseMap[field] = csvCol })

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i]
      const firstName = row[reverseMap['first_name']]?.trim()
      const lastName = row[reverseMap['last_name']]?.trim()
      const email = row[reverseMap['email']]?.trim()

      if (!firstName || !lastName || !email) {
        errors.push(`Row ${i + 2}: Missing required fields (first_name, last_name, or email)`)
        continue
      }
      if (!email.includes('@')) {
        errors.push(`Row ${i + 2}: Invalid email "${email}"`)
        continue
      }

      const fullName = `${firstName} ${lastName}`.trim()
      try {
        await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: 'employees',
            action: 'create',
            data: {
              full_name: fullName,
              email,
              job_title: row[reverseMap['job_title']]?.trim() || '',
              phone: row[reverseMap['phone']]?.trim() || '',
              location: row[reverseMap['location']]?.trim() || '',
              hire_date: row[reverseMap['start_date']]?.trim() || row[reverseMap['hire_date']]?.trim() || new Date().toISOString().split('T')[0],
              department: row[reverseMap['department']]?.trim() || '',
              country: row[reverseMap['country']]?.trim() || '',
              level: row[reverseMap['level']]?.trim() || '',
              role: row[reverseMap['role']]?.trim() || 'employee',
              is_active: true,
            },
          }),
        })
        imported++
      } catch {
        errors.push(`Row ${i + 2}: Failed to import ${fullName}`)
      }
    }

    setCsvImportCount(imported)
    setCsvErrors(errors)
    setCsvImportStatus('done')
  }, [csvData, csvColumnMap])

  // ─── Module Tab State ──────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState('my-onboarding')
  const tabs = [
    { id: 'my-onboarding', label: 'My Onboarding' },
    { id: 'welcome-portal', label: t('welcomePortal') },
    { id: 'buddy-system', label: t('buddySystem'), count: buddyAssignments.filter(b => b.status === 'active').length },
    { id: 'preboarding', label: t('preboarding'), count: preboardingTasks.length },
    { id: 'onboarding-plan', label: t('onboardingPlan') },
  ]

  // ─── Buddy State ───────────────────────────────────────────────────
  const [showAssignBuddyModal, setShowAssignBuddyModal] = useState(false)
  const [buddyForm, setBuddyForm] = useState({ new_hire_id: '', buddy_id: '' })
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false)
  const [selectedNewHireForSuggestion, setSelectedNewHireForSuggestion] = useState('')

  // ─── Preboarding State ─────────────────────────────────────────────
  const [preboardCategoryFilter, setPreboardCategoryFilter] = useState('all')
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ employee_id: '', title: '', category: 'documents', priority: 'medium', due_date: '' })

  // ─── Template Builder State ─────────────────────────────────────────
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [templateName, setTemplateName] = useState('')
  const [templateCategory, setTemplateCategory] = useState('documents')
  const [templateItems, setTemplateItems] = useState<{ title: string; description: string; due_days: number; assignee: string }[]>([])
  const [templateItemForm, setTemplateItemForm] = useState({ title: '', description: '', due_days: 7, assignee: '' })

  // ─── Bulk Preboarding Tasks State ────────────────────────────────
  const [showBulkTaskModal, setShowBulkTaskModal] = useState(false)
  const [bulkTaskStep, setBulkTaskStep] = useState<1 | 2>(1)
  const [bulkTaskMode, setBulkTaskMode] = useState<'individual' | 'department' | 'all'>('individual')
  const [bulkTaskSearch, setBulkTaskSearch] = useState('')
  const [bulkTaskSelectedEmpIds, setBulkTaskSelectedEmpIds] = useState<Set<string>>(new Set())
  const [bulkTaskSelectedDepts, setBulkTaskSelectedDepts] = useState<Set<string>>(new Set())
  const [bulkTaskTemplate, setBulkTaskTemplate] = useState<string[]>([])
  const [bulkTaskCategory, setBulkTaskCategory] = useState('documents')
  const [bulkTaskPriority, setBulkTaskPriority] = useState('medium')
  const [bulkTaskDueDate, setBulkTaskDueDate] = useState('')

  // ─── Onboarding Plan State ─────────────────────────────────────────
  const [planRole, setPlanRole] = useState('')
  const [planDepartment, setPlanDepartment] = useState('')

  // ─── Production-grade: Confirm, Search/Filter, Saving ─────────────
  const [confirmAction, setConfirmAction] = useState<{ show: boolean; action: string; id: string; label: string } | null>(null)
  const [onboardingSearch, setOnboardingSearch] = useState('')
  const [onboardingStatusFilter, setOnboardingStatusFilter] = useState<'all' | 'in_progress' | 'completed' | 'not_started'>('all')
  const [formSaving, setFormSaving] = useState(false)

  // ─── Computed Stats ────────────────────────────────────────────────
  const activeBuddyCount = useMemo(() => buddyAssignments.filter(b => b.status === 'active').length, [buddyAssignments])
  const completedBuddyCount = useMemo(() => buddyAssignments.filter(b => b.status === 'completed').length, [buddyAssignments])
  const pendingBuddyCount = useMemo(() => buddyAssignments.filter(b => b.status === 'pending').length, [buddyAssignments])

  const completedTaskCount = useMemo(() => preboardingTasks.filter(t => t.status === 'completed').length, [preboardingTasks])
  const inProgressTaskCount = useMemo(() => preboardingTasks.filter(t => t.status === 'in_progress').length, [preboardingTasks])
  const pendingTaskCount = useMemo(() => preboardingTasks.filter(t => t.status === 'pending').length, [preboardingTasks])
  const taskCompletionPct = useMemo(() => preboardingTasks.length > 0 ? Math.round((completedTaskCount / preboardingTasks.length) * 100) : 0, [preboardingTasks, completedTaskCount])

  const filteredTasks = useMemo(() => {
    let tasks = preboardingTasks
    if (preboardCategoryFilter !== 'all') tasks = tasks.filter(t => t.category === preboardCategoryFilter)
    if (onboardingSearch.trim()) {
      const q = onboardingSearch.toLowerCase()
      tasks = tasks.filter(t => {
        const emp = employees.find(e => e.id === t.employee_id)
        return emp?.profile?.full_name?.toLowerCase().includes(q) || t.title.toLowerCase().includes(q)
      })
    }
    if (onboardingStatusFilter !== 'all') {
      const statusMap: Record<string, string> = { in_progress: 'in_progress', completed: 'completed', not_started: 'pending' }
      tasks = tasks.filter(t => t.status === statusMap[onboardingStatusFilter])
    }
    return tasks
  }, [preboardingTasks, preboardCategoryFilter, onboardingSearch, onboardingStatusFilter, employees])

  const filteredBuddyAssignments = useMemo(() => {
    let assignments = buddyAssignments
    if (onboardingSearch.trim()) {
      const q = onboardingSearch.toLowerCase()
      assignments = assignments.filter(a => {
        const newHire = employees.find(e => e.id === a.new_hire_id)
        const buddy = employees.find(e => e.id === a.buddy_id)
        return newHire?.profile?.full_name?.toLowerCase().includes(q) || buddy?.profile?.full_name?.toLowerCase().includes(q)
      })
    }
    if (onboardingStatusFilter !== 'all') {
      const statusMap: Record<string, string> = { in_progress: 'active', completed: 'completed', not_started: 'pending' }
      assignments = assignments.filter(a => a.status === statusMap[onboardingStatusFilter])
    }
    return assignments
  }, [buddyAssignments, onboardingSearch, onboardingStatusFilter, employees])

  // ─── Bulk Task Computed Data ──────────────────────────────────────
  const taskTemplates: Record<string, string[]> = {
    documents: ['Sign employment contract', 'Submit ID documents', 'Complete tax forms', 'Sign NDA agreement'],
    benefits: ['Review benefits options', 'Enroll in health plan', 'Set up retirement account'],
    payroll: ['Submit bank details', 'Review compensation package', 'Complete payroll onboarding form'],
    equipment: ['Collect laptop', 'Set up workstation', 'Receive access badge'],
    training: ['Complete compliance training', 'Watch orientation video', 'Take safety training'],
    accounts: ['Set up email account', 'Get Slack access', 'Configure VPN'],
  }

  const bulkTaskTargetEmployees = useMemo(() => {
    switch (bulkTaskMode) {
      case 'individual':
        return employees.filter(emp => {
          if (!bulkTaskSearch) return true
          const q = bulkTaskSearch.toLowerCase()
          const name = emp.profile?.full_name?.toLowerCase() || ''
          return name.includes(q)
        })
      case 'department':
        return bulkTaskSelectedDepts.size > 0 ? employees.filter(e => bulkTaskSelectedDepts.has(e.department_id)) : []
      case 'all':
        return employees
      default: return []
    }
  }, [employees, bulkTaskMode, bulkTaskSearch, bulkTaskSelectedDepts])

  const bulkTaskSelectedEmployees = useMemo(() => {
    if (bulkTaskMode === 'individual') return employees.filter(e => bulkTaskSelectedEmpIds.has(e.id))
    return bulkTaskTargetEmployees
  }, [bulkTaskMode, employees, bulkTaskSelectedEmpIds, bulkTaskTargetEmployees])

  function toggleBulkSet<T>(set: Set<T>, setter: React.Dispatch<React.SetStateAction<Set<T>>>, item: T) {
    setter(prev => { const next = new Set(prev); if (next.has(item)) next.delete(item); else next.add(item); return next })
  }

  function toggleBulkTemplate(task: string) {
    setBulkTaskTemplate(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task])
  }

  function resetBulkTask() {
    setShowBulkTaskModal(false); setBulkTaskStep(1); setBulkTaskMode('individual')
    setBulkTaskSearch(''); setBulkTaskSelectedEmpIds(new Set()); setBulkTaskSelectedDepts(new Set())
    setBulkTaskTemplate([]); setBulkTaskCategory('documents'); setBulkTaskPriority('medium'); setBulkTaskDueDate('')
  }

  function submitBulkTasks() {
    if (bulkTaskSelectedEmployees.length === 0 || bulkTaskTemplate.length === 0) return
    let count = 0
    bulkTaskSelectedEmployees.forEach(emp => {
      bulkTaskTemplate.forEach(title => {
        addPreboardingTask({
          employee_id: emp.id, title, category: bulkTaskCategory,
          status: 'pending', priority: bulkTaskPriority,
          due_date: bulkTaskDueDate || new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
          completed_date: null,
        })
        count++
      })
    })
    addToast(`Successfully created ${count} preboarding tasks for ${bulkTaskSelectedEmployees.length} employees`)
    resetBulkTask()
  }

  // AI suggestions
  const buddySuggestions = useMemo(() => {
    if (!selectedNewHireForSuggestion) return []
    const newHire = employees.find(e => e.id === selectedNewHireForSuggestion)
    if (!newHire) return []
    return suggestOnboardingBuddy(newHire, employees)
  }, [selectedNewHireForSuggestion, employees])

  const onboardingPlan = useMemo(() => {
    if (!planRole || !planDepartment) return null
    return generateOnboardingPlan(planRole, planDepartment)
  }, [planRole, planDepartment])

  // ─── Wizard Handlers (preserved from original) ─────────────────────
  const step = setupSteps[currentStep]
  const isLast = currentStep === setupSteps.length - 1
  const isFirst = currentStep === 0

  const saveOrgDetails = async () => {
    if (!companySize && !industry) return
    setSaving(true)
    try {
      const data: Record<string, string> = { size: companySize, industry }
      if (companyCountry) data.country = companyCountry
      if (defaultCurrency) data.default_currency = defaultCurrency
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data,
        }),
      })
      if (res.ok) {
        if (updateOrg) {
          updateOrg({ size: companySize, industry })
        }
      } else {
        console.error('Failed to save org details:', await res.text())
      }
    } catch (err) {
      console.error('Failed to save org details:', err)
    } finally {
      setSaving(false)
    }
  }

  const saveModules = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data: { enabled_modules: selectedModules },
        }),
      })
      if (!res.ok) {
        console.error('Failed to save modules:', await res.text())
      }
    } catch (err) {
      console.error('Failed to save modules:', err)
    } finally {
      setSaving(false)
    }
  }

  const sendInvites = async () => {
    const emails = inviteEmails
      .split('\n')
      .map(e => e.trim())
      .filter(e => e && e.includes('@'))

    if (emails.length === 0) return

    setSaving(true)
    setInviteError('')
    try {
      const res = await fetch('/api/employees/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emails, role: 'employee' }),
      })
      if (res.ok) {
        setInvitesSent(true)
      } else {
        const data = await res.json()
        setInviteError(data.error || 'Failed to send invitations')
      }
    } catch {
      setInviteError('Failed to send invitations. You can invite people later from Settings.')
    } finally {
      setSaving(false)
    }
  }

  const completeOnboarding = async () => {
    setSaving(true)
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entity: 'organizations',
          action: 'update',
          id: org?.id,
          data: { onboarding_completed: true },
        }),
      })
    } catch {
      // Non-blocking — they can still proceed
    } finally {
      setSaving(false)
    }
    try { localStorage.removeItem(WIZARD_STORAGE_KEY) } catch {}
    router.push('/dashboard')
  }

  const nextStep = async () => {
    if (isLast) {
      await completeOnboarding()
      return
    }
    if (step.id === 'organization') {
      await saveOrgDetails()
    } else if (step.id === 'modules') {
      await saveModules()
    }
    const next = Math.min(currentStep + 1, setupSteps.length - 1)
    setCurrentStep(next)
    persistWizardState({ currentStep: next })
  }

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 0))

  const toggleModule = (id: string) => {
    setSelectedModules(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  // ─── Buddy Handlers ────────────────────────────────────────────────
  const handleAssignBuddy = async () => {
    if (!buddyForm.new_hire_id) { addToast('Please select a new hire', 'error'); return }
    if (!buddyForm.buddy_id) { addToast('Please select a buddy', 'error'); return }
    if (buddyForm.new_hire_id === buddyForm.buddy_id) { addToast('New hire and buddy cannot be the same person', 'error'); return }
    setFormSaving(true)
    try {
      const newHire = employees.find(e => e.id === buddyForm.new_hire_id)
      addBuddyAssignment({
        new_hire_id: buddyForm.new_hire_id,
        buddy_id: buddyForm.buddy_id,
        status: 'active',
        match_score: 80,
        department_id: newHire?.department_id || '',
        checklist: [
          { task: 'Introduce to team members', done: false },
          { task: 'Office tour and facilities walkthrough', done: false },
          { task: 'Lunch together on first day', done: false },
          { task: 'Explain team communication channels', done: false },
          { task: 'Review key tools and systems', done: false },
        ],
        meetings: [
          { date: new Date(Date.now() + 86400000).toISOString(), topic: 'Welcome and introductions', completed: false },
          { date: new Date(Date.now() + 86400000 * 8).toISOString(), topic: 'First week check-in', completed: false },
        ],
      })
      addToast('Buddy assignment created successfully')
      setBuddyForm({ new_hire_id: '', buddy_id: '' })
      setShowAssignBuddyModal(false)
    } finally {
      setFormSaving(false)
    }
  }

  const handleAddTask = async () => {
    if (!taskForm.title.trim()) { addToast('Task title is required', 'error'); return }
    if (!taskForm.due_date) { addToast('Due date is required', 'error'); return }
    if (!taskForm.employee_id) { addToast('Please select an employee to assign this task to', 'error'); return }
    setFormSaving(true)
    try {
      addPreboardingTask({
        employee_id: taskForm.employee_id,
        title: taskForm.title,
        category: taskForm.category,
        status: 'pending',
        due_date: taskForm.due_date,
        completed_date: null,
        priority: taskForm.priority,
      })
      addToast('Preboarding task created successfully')
      setTaskForm({ employee_id: '', title: '', category: 'documents', priority: 'medium', due_date: '' })
      setShowAddTaskModal(false)
    } finally {
      setFormSaving(false)
    }
  }

  const addTemplateItem = () => {
    if (!templateItemForm.title.trim()) { addToast('Item title is required', 'error'); return }
    setTemplateItems(prev => [...prev, { ...templateItemForm }])
    setTemplateItemForm({ title: '', description: '', due_days: 7, assignee: '' })
  }

  const removeTemplateItem = (idx: number) => {
    setTemplateItems(prev => prev.filter((_, i) => i !== idx))
  }

  const applyTemplate = (employeeId: string) => {
    if (!templateName.trim()) { addToast('Template name is required', 'error'); return }
    if (!templateCategory) { addToast('Template category is required', 'error'); return }
    if (!employeeId || templateItems.length === 0) return
    const today = new Date()
    templateItems.forEach(item => {
      const dueDate = new Date(today.getTime() + item.due_days * 86400000).toISOString().split('T')[0]
      addPreboardingTask({
        employee_id: employeeId,
        title: item.title,
        category: templateCategory,
        status: 'pending',
        priority: 'medium',
        due_date: dueDate,
        completed_date: null,
      })
    })
    addToast(`Applied template "${templateName}" with ${templateItems.length} tasks`)
    setShowTemplateModal(false)
    setTemplateName('')
    setTemplateCategory('documents')
    setTemplateItems([])
  }

  // ─── Confirm Action Handler ────────────────────────────────────────
  const executeConfirmAction = () => {
    if (!confirmAction) return
    const { action, id } = confirmAction
    if (action === 'remove_buddy') {
      updateBuddyAssignment(id, { status: 'completed' })
      addToast('Buddy assignment removed')
    } else if (action === 'delete_task') {
      updatePreboardingTask(id, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
      addToast('Preboarding task deleted')
    } else if (action === 'archive_onboarding') {
      updatePreboardingTask(id, { status: 'completed', completed_date: new Date().toISOString().split('T')[0] })
      addToast('Onboarding process archived')
    }
    setConfirmAction(null)
  }

  // ─── Setup Wizard Render ───────────────────────────────────────────
  if (showSetupWizard) {
    return (
      <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
        <div className="w-full max-w-2xl">
          {/* Progress Bar */}
          <div className="flex items-center gap-2 mb-8">
            {setupSteps.map((s, i) => (
              <div key={s.id} className="flex-1 flex items-center gap-2">
                <div className={`h-1 flex-1 rounded-full transition-colors ${i <= currentStep ? 'bg-tempo-600' : 'bg-border'}`} />
              </div>
            ))}
          </div>

          {/* Step Content */}
          <div className="bg-card rounded-[14px] border border-border p-8 min-h-[400px] flex flex-col">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
                {step.icon}
              </div>
              <h1 className="text-2xl font-light text-t1 tracking-tight mb-2">{step.title}</h1>
              <p className="text-sm text-t3">{step.subtitle}</p>
            </div>

            {/* Step-specific content */}
            <div className="flex-1">
              {step.id === 'welcome' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                    <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-t1">16 Integrated Modules</p>
                      <p className="text-xs text-t3">HR, Performance, Payroll, Benefits, and more — all unified.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                    <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-t1">AI-Powered Insights</p>
                      <p className="text-xs text-t3">Get intelligent recommendations for your workforce decisions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-canvas border border-border">
                    <CheckCircle size={18} className="text-success mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-t1">Enterprise Security</p>
                      <p className="text-xs text-t3">RBAC, MFA, audit logging, and encryption built in.</p>
                    </div>
                  </div>
                </div>
              )}

              {step.id === 'organization' && (
                <div className="space-y-4 max-w-md mx-auto">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-t1 block mb-1.5">Company Size</label>
                      <select
                        value={companySize}
                        onChange={e => setCompanySize(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                      >
                        <option value="">Select size...</option>
                        <option value="1-10">1-10 employees</option>
                        <option value="11-50">11-50 employees</option>
                        <option value="51-200">51-200 employees</option>
                        <option value="201-1000">201-1,000 employees</option>
                        <option value="1001-5000">1,001-5,000 employees</option>
                        <option value="5000+">5,000+ employees</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-t1 block mb-1.5">Industry</label>
                      <select
                        value={industry}
                        onChange={e => setIndustry(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                      >
                        <option value="">Select industry...</option>
                        <option value="technology">Technology</option>
                        <option value="finance">Finance & Banking</option>
                        <option value="healthcare">Healthcare</option>
                        <option value="manufacturing">Manufacturing</option>
                        <option value="retail">Retail & E-commerce</option>
                        <option value="education">Education</option>
                        <option value="consulting">Consulting & Professional Services</option>
                        <option value="energy">Energy & Utilities</option>
                        <option value="telecom">Telecommunications</option>
                        <option value="government">Government & Public Sector</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-t1 block mb-1.5">Country / Region</label>
                      <select
                        value={companyCountry}
                        onChange={e => setCompanyCountry(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                      >
                        <option value="">Select country...</option>
                        <option value="NG">Nigeria</option>
                        <option value="KE">Kenya</option>
                        <option value="GH">Ghana</option>
                        <option value="ZA">South Africa</option>
                        <option value="SN">Senegal</option>
                        <option value="CI">Cote d&apos;Ivoire</option>
                        <option value="TZ">Tanzania</option>
                        <option value="UG">Uganda</option>
                        <option value="RW">Rwanda</option>
                        <option value="ET">Ethiopia</option>
                        <option value="US">United States</option>
                        <option value="GB">United Kingdom</option>
                        <option value="CA">Canada</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-t1 block mb-1.5">Default Currency</label>
                      <select
                        value={defaultCurrency}
                        onChange={e => setDefaultCurrency(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="NGN">NGN - Nigerian Naira</option>
                        <option value="KES">KES - Kenyan Shilling</option>
                        <option value="GHS">GHS - Ghanaian Cedi</option>
                        <option value="ZAR">ZAR - South African Rand</option>
                        <option value="XOF">XOF - West African CFA</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>
                  <p className="text-xs text-t3 text-center mt-2">These settings determine payroll compliance rules and default formatting across the platform.</p>
                </div>
              )}

              {step.id === 'modules' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-xl mx-auto">
                  {availableModules.map(mod => {
                    const selected = selectedModules.includes(mod.id)
                    return (
                      <button
                        key={mod.id}
                        onClick={() => toggleModule(mod.id)}
                        className={`flex items-start gap-3 p-3 rounded-lg border text-left transition-all ${
                          selected
                            ? 'bg-tempo-50 border-tempo-600/30 ring-1 ring-tempo-600/20'
                            : 'bg-canvas border-border hover:border-tempo-600/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${selected ? 'bg-tempo-600 text-white' : 'bg-canvas border border-border text-t3'}`}>
                          {selected ? <Check size={14} /> : mod.icon}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">{mod.name}</p>
                          <p className="text-xs text-t3">{mod.desc}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
              )}

              {step.id === 'team' && (
                <div className="space-y-4 max-w-md mx-auto">
                  {invitesSent ? (
                    <div className="text-center py-4">
                      <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <Mail size={24} className="text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-t1">Invitations sent!</p>
                      <p className="text-xs text-t3 mt-1">Your team members will receive an email with a link to join.</p>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm font-medium text-t1 block mb-1.5">Email Addresses</label>
                        <textarea
                          value={inviteEmails}
                          onChange={e => setInviteEmails(e.target.value)}
                          placeholder={"alice@company.com\nbob@company.com\ncarol@company.com"}
                          className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none h-32 resize-none"
                        />
                        <p className="text-xs text-t3 mt-1.5">Enter one email per line. They&apos;ll receive an invitation to join your workspace.</p>
                      </div>
                      {inviteError && (
                        <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{inviteError}</p>
                      )}
                      {inviteEmails.trim() && (
                        <Button onClick={sendInvites} disabled={saving} className="w-full">
                          {saving ? <><Loader2 size={14} className="animate-spin" /> Sending...</> : <><Mail size={14} /> Send Invitations</>}
                        </Button>
                      )}
                    </>
                  )}
                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="text-sm text-t3 hover:text-t1 font-medium block mx-auto"
                  >
                    Skip — I&apos;ll invite people later
                  </button>
                </div>
              )}

              {step.id === 'import' && (
                <div className="space-y-4 max-w-lg mx-auto">
                  {csvImportStatus === 'idle' && (
                    <>
                      <div
                        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-tempo-600/40 transition-colors cursor-pointer"
                        onClick={() => csvInputRef.current?.click()}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation() }}
                        onDrop={(e) => { e.preventDefault(); e.stopPropagation(); const f = e.dataTransfer.files[0]; if (f && (f.name.endsWith('.csv') || /\.xlsx?$/i.test(f.name))) handleCSVFile(f) }}
                      >
                        <Upload size={32} className="mx-auto text-t3 mb-3" />
                        <p className="text-sm font-medium text-t1 mb-1">Drop a file here, or click to browse</p>
                        <p className="text-xs text-t3">Supports .csv, .xlsx, and .xls files with employee data</p>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCSVFile(f) }}
                        />
                      </div>
                      <div className="text-center flex items-center justify-center gap-4">
                        <button
                          onClick={() => {
                            const csv = 'first_name,last_name,email,department,job_title,start_date\nJane,Doe,jane@example.com,Engineering,Software Engineer,2026-03-01\nJohn,Smith,john@example.com,Marketing,Marketing Lead,2026-03-01'
                            const blob = new Blob([csv], { type: 'text/csv' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url; a.download = 'tempo_employee_template.csv'; a.click()
                            URL.revokeObjectURL(url)
                          }}
                          className="text-xs text-tempo-600 hover:text-tempo-700 font-medium inline-flex items-center gap-1"
                        >
                          <Download size={12} /> Download CSV Template
                        </button>
                        <button
                          onClick={generateEmployeeImportTemplate}
                          className="text-xs text-tempo-600 hover:text-tempo-700 font-medium inline-flex items-center gap-1"
                        >
                          <Download size={12} /> Download Excel Template
                        </button>
                      </div>
                      {csvErrors.length > 0 && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          {csvErrors.map((e, i) => <p key={i} className="text-xs text-red-700">{e}</p>)}
                        </div>
                      )}
                    </>
                  )}

                  {csvImportStatus === 'preview' && (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-t1">
                          <Table size={14} className="inline mr-1.5" />
                          {csvData.length} employees found
                        </p>
                        <button onClick={() => { setCsvImportStatus('idle'); setCsvData([]); setCsvHeaders([]) }} className="text-xs text-t3 hover:text-t1">
                          Upload different file
                        </button>
                      </div>
                      <div className="border border-border rounded-lg overflow-hidden max-h-[200px] overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-canvas border-b border-border">
                              {csvHeaders.slice(0, 5).map(h => (
                                <th key={h} className="px-3 py-2 text-left font-medium text-t3">{h}</th>
                              ))}
                              {csvHeaders.length > 5 && <th className="px-3 py-2 text-left font-medium text-t3">+{csvHeaders.length - 5} more</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {csvData.slice(0, 5).map((row, i) => (
                              <tr key={i}>
                                {csvHeaders.slice(0, 5).map(h => (
                                  <td key={h} className="px-3 py-1.5 text-t2 truncate max-w-[120px]">{row[h]}</td>
                                ))}
                                {csvHeaders.length > 5 && <td className="px-3 py-1.5 text-t3">...</td>}
                              </tr>
                            ))}
                            {csvData.length > 5 && (
                              <tr><td colSpan={Math.min(csvHeaders.length, 6)} className="px-3 py-1.5 text-t3 text-center">...and {csvData.length - 5} more rows</td></tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-medium text-t3 uppercase tracking-wider">Column Mapping</p>
                        <div className="grid grid-cols-2 gap-2">
                          {csvHeaders.map(h => (
                            <div key={h} className="flex items-center gap-2">
                              <span className="text-xs text-t2 w-28 truncate shrink-0">{h}</span>
                              <select
                                value={csvColumnMap[h] || ''}
                                onChange={e => setCsvColumnMap(prev => ({ ...prev, [h]: e.target.value }))}
                                className="flex-1 px-2 py-1 bg-canvas border border-border rounded text-xs text-t1 focus:border-tempo-600 outline-none"
                              >
                                <option value="">— skip —</option>
                                {allFieldOptions.map(f => (
                                  <option key={f} value={f}>{f.replace(/_/g, ' ')}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                        {!Object.values(csvColumnMap).includes('first_name') || !Object.values(csvColumnMap).includes('last_name') || !Object.values(csvColumnMap).includes('email') ? (
                          <div className="flex items-start gap-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                            <AlertCircle size={14} className="text-amber-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-amber-700">Map at least first_name, last_name, and email columns to proceed.</p>
                          </div>
                        ) : (
                          <Button
                            onClick={importCSVEmployees}
                            className="w-full"
                          >
                            <Upload size={14} /> Import {csvData.length} Employees
                          </Button>
                        )}
                      </div>
                    </>
                  )}

                  {csvImportStatus === 'importing' && (
                    <div className="text-center py-8">
                      <Loader2 size={32} className="mx-auto text-tempo-600 animate-spin mb-3" />
                      <p className="text-sm font-medium text-t1">Importing employees...</p>
                      <p className="text-xs text-t3 mt-1">This may take a moment</p>
                    </div>
                  )}

                  {csvImportStatus === 'done' && (
                    <div className="text-center py-4">
                      <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-3">
                        <CheckCircle size={28} className="text-green-600" />
                      </div>
                      <p className="text-sm font-medium text-t1 mb-1">{csvImportCount} employees imported</p>
                      {csvErrors.length > 0 && (
                        <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg text-left max-h-[120px] overflow-y-auto">
                          <p className="text-xs font-medium text-amber-800 mb-1">{csvErrors.length} row(s) skipped:</p>
                          {csvErrors.map((e, i) => <p key={i} className="text-xs text-amber-700">{e}</p>)}
                        </div>
                      )}
                      <button
                        onClick={() => { setCsvImportStatus('idle'); setCsvData([]); setCsvHeaders([]); setCsvImportCount(0); setCsvErrors([]) }}
                        className="text-xs text-tempo-600 hover:text-tempo-700 font-medium mt-3"
                      >
                        Import more employees
                      </button>
                    </div>
                  )}

                  <button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    className="text-sm text-t3 hover:text-t1 font-medium block mx-auto mt-2"
                  >
                    Skip — I&apos;ll add employees later
                  </button>
                </div>
              )}

              {step.id === 'complete' && (
                <div className="space-y-4 max-w-md mx-auto text-center">
                  <Confetti />
                  <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                    <CheckCircle size={40} className="text-green-600" />
                  </div>
                  <div className="grid grid-cols-3 gap-3 mt-6">
                    <div className="p-3 rounded-lg bg-canvas border border-border">
                      <p className="text-xs text-t3">Modules</p>
                      <p className="text-lg font-semibold text-t1">{selectedModules.length}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-canvas border border-border">
                      <p className="text-xs text-t3">Organization</p>
                      <p className="text-lg font-semibold text-t1 truncate">{org?.name || 'Ready'}</p>
                    </div>
                    {csvImportCount > 0 && (
                      <div className="p-3 rounded-lg bg-canvas border border-border">
                        <p className="text-xs text-t3">Imported</p>
                        <p className="text-lg font-semibold text-t1">{csvImportCount}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
              <Button
                variant="ghost"
                onClick={prevStep}
                disabled={isFirst || saving}
                className={isFirst ? 'invisible' : ''}
              >
                <ArrowLeft size={14} /> Back
              </Button>
              <div className="flex items-center gap-1.5">
                {setupSteps.map((_, i) => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${i === currentStep ? 'bg-tempo-600' : 'bg-border'}`} />
                ))}
              </div>
              {step.id !== 'team' && step.id !== 'import' && (
                <Button onClick={nextStep} disabled={saving}>
                  {saving ? (
                    <><Loader2 size={14} className="animate-spin" /> Saving...</>
                  ) : isLast ? (
                    <>Go to Dashboard <ArrowRight size={14} /></>
                  ) : (
                    <>Continue <ArrowRight size={14} /></>
                  )}
                </Button>
              )}
              {step.id === 'team' && !invitesSent && !inviteEmails.trim() && (
                <Button onClick={nextStep}>
                  Continue <ArrowRight size={14} />
                </Button>
              )}
              {step.id === 'team' && invitesSent && (
                <Button onClick={nextStep}>
                  Continue <ArrowRight size={14} />
                </Button>
              )}
              {step.id === 'import' && csvImportStatus === 'done' && (
                <Button onClick={nextStep}>
                  Continue <ArrowRight size={14} />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Employee Onboarding Module ────────────────────────────────────

  if (pageLoading) {
    return (
      <>
        <Header title={t('title')} subtitle={t('subtitle')} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={() => setShowBulkTaskModal(true)}>
              <CheckSquare size={14} /> Bulk Tasks
            </Button>
            <Button variant="ghost" onClick={() => setShowSetupWizard(true)}>
              <Rocket size={14} /> Platform Setup
            </Button>
          </div>
        }
      />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Search & Status Filter */}
      {(activeTab === 'buddy-system' || activeTab === 'preboarding') && (
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 relative">
            <input
              type="text"
              value={onboardingSearch}
              onChange={e => setOnboardingSearch(e.target.value)}
              placeholder="Search by employee name..."
              className="w-full pl-9 pr-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
            />
            <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
          </div>
          <div className="flex gap-1">
            {(['all', 'in_progress', 'completed', 'not_started'] as const).map(status => (
              <button
                key={status}
                onClick={() => setOnboardingStatusFilter(status)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                  onboardingStatusFilter === status
                    ? 'bg-tempo-600 text-white'
                    : 'bg-canvas border border-border text-t2 hover:bg-tempo-50'
                }`}
              >
                {status === 'all' ? 'All' : status === 'in_progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Not Started'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════ MY ONBOARDING TAB ═══════════════════ */}
      {activeTab === 'my-onboarding' && (
        <div className="space-y-6">
          {/* My Progress Overview */}
          {(() => {
            const myTasks = preboardingTasks.filter(t => t.employee_id === currentEmployeeId)
            const myCompleted = myTasks.filter(t => t.status === 'completed').length
            const myTotal = myTasks.length
            const myPct = myTotal > 0 ? Math.round((myCompleted / myTotal) * 100) : 0
            const myBuddy = buddyAssignments.find(b => b.new_hire_id === currentEmployeeId && b.status === 'active')
            const buddyEmp = myBuddy ? employees.find(e => e.id === myBuddy.buddy_id) : null

            return (
              <>
                {/* Progress Card */}
                <Card>
                  <div className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 shrink-0">
                        <Rocket size={24} />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-sm font-semibold text-t1 mb-1">Welcome to your onboarding journey!</h2>
                        <p className="text-sm text-t2 mb-4">Complete your tasks below to get set up and ready to go.</p>
                        <div className="flex items-center gap-3">
                          <Progress value={myPct} size="md" className="flex-1" />
                          <span className="text-sm font-semibold text-tempo-600 shrink-0">{myPct}%</span>
                        </div>
                        <p className="text-xs text-t3 mt-1">{myCompleted} of {myTotal} tasks completed</p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatCard label="My Tasks" value={myTotal} icon={<FileText size={18} />} />
                  <StatCard label="Completed" value={myCompleted} icon={<CheckCircle size={18} />} />
                  <StatCard label="In Progress" value={myTasks.filter(t => t.status === 'in_progress').length} icon={<Clock size={18} />} />
                  <StatCard label="Pending" value={myTasks.filter(t => t.status === 'pending').length} icon={<Timer size={18} />} />
                </div>

                {/* My Buddy */}
                {myBuddy && buddyEmp && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Your Onboarding Buddy</CardTitle>
                    </CardHeader>
                    <div className="px-5 pb-5">
                      <div className="flex items-center gap-4 p-4 bg-canvas border border-border rounded-lg">
                        <Avatar name={buddyEmp.profile.full_name} size="lg" />
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-t1">{buddyEmp.profile.full_name}</p>
                          <p className="text-xs text-t3">{buddyEmp.job_title} · {getDepartmentName(buddyEmp.department_id)}</p>
                          {buddyEmp.profile?.email && (
                            <p className="text-xs text-tempo-600 mt-1">{buddyEmp.profile.email}</p>
                          )}
                        </div>
                        <Badge variant="success">Active Buddy</Badge>
                      </div>
                      {/* Buddy checklist */}
                      {(myBuddy.checklist || []).length > 0 && (
                        <div className="mt-4 space-y-2">
                          <p className="text-xs font-medium text-t1">Buddy Checklist</p>
                          {(myBuddy.checklist || []).map((item: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                              <div className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${item.done ? 'bg-tempo-600 border-tempo-600 text-white' : 'border-border'}`}>
                                {item.done && <Check size={10} />}
                              </div>
                              <span className={`text-xs ${item.done ? 'text-t3 line-through' : 'text-t1'}`}>{item.task}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Card>
                )}

                {/* My Tasks */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">My Onboarding Tasks</CardTitle>
                  </CardHeader>
                  <div className="px-5 pb-5">
                    {myTasks.length === 0 ? (
                      <div className="text-center py-8">
                        <CheckCircle size={40} className="text-t3 mx-auto mb-3" />
                        <p className="text-sm text-t3">No onboarding tasks assigned yet.</p>
                        <p className="text-xs text-t3 mt-1">Your HR team will assign tasks as part of your onboarding.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {myTasks.map(task => (
                          <div key={task.id} className="flex items-center gap-4 p-3 bg-canvas border border-border rounded-lg">
                            <button
                              onClick={() => {
                                if (task.status === 'completed') return
                                const newStatus = task.status === 'pending' ? 'in_progress' : 'completed'
                                updatePreboardingTask(task.id, {
                                  status: newStatus,
                                  completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
                                })
                              }}
                              className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                task.status === 'completed' ? 'bg-green-500 border-green-500 text-white' :
                                task.status === 'in_progress' ? 'border-amber-400 bg-amber-50' :
                                'border-border hover:border-tempo-400'
                              }`}
                            >
                              {task.status === 'completed' && <Check size={12} />}
                              {task.status === 'in_progress' && <Clock size={10} className="text-amber-500" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-t3 line-through' : 'text-t1'}`}>{task.title}</p>
                              <div className="flex items-center gap-3 mt-0.5">
                                <span className="text-xs text-t3 flex items-center gap-1">
                                  {categoryIcons[task.category] || <FileText size={12} />}
                                  {task.category}
                                </span>
                                {task.due_date && <span className="text-xs text-t3">Due: {task.due_date}</span>}
                              </div>
                            </div>
                            <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'}>
                              {task.status === 'completed' ? 'Done' : task.status === 'in_progress' ? 'In Progress' : 'To Do'}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* First Week Schedule */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Your First Week</CardTitle>
                  </CardHeader>
                  <div className="px-5 pb-5">
                    <div className="space-y-3">
                      {(welcomeContent.first_week_schedule || []).map((day, i) => (
                        <div key={i} className="flex gap-4">
                          <div className="w-24 shrink-0">
                            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 mb-1">
                              <Calendar size={16} />
                            </div>
                            <p className="text-xs font-semibold text-t1">{day.day}</p>
                          </div>
                          <div className="flex-1 space-y-1">
                            {day.items.map((item, j) => (
                              <div key={j} className="flex items-center gap-2 text-xs text-t2">
                                <ChevronRight size={12} className="text-t3 shrink-0" />
                                <span>{item}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                {/* Key Contacts */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Key Contacts</CardTitle>
                  </CardHeader>
                  <div className="px-5 pb-5">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {employees.slice(0, 5).map(emp => (
                        <div key={emp.id} className="p-3 bg-canvas border border-border rounded-lg text-center">
                          <Avatar name={emp.profile.full_name} size="md" className="mx-auto mb-2" />
                          <p className="text-xs font-medium text-t1 truncate">{emp.profile.full_name}</p>
                          <p className="text-[0.6rem] text-t3 truncate">{emp.job_title}</p>
                          <Badge variant="default" className="mt-1 text-[0.5rem]">{getDepartmentName(emp.department_id)}</Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </>
            )
          })()}
        </div>
      )}

      {/* ═══════════════════ WELCOME PORTAL TAB ═══════════════════ */}
      {activeTab === 'welcome-portal' && (
        <div className="space-y-6">
          {/* Welcome Message */}
          <Card>
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 shrink-0">
                  <Rocket size={24} />
                </div>
                <div className="flex-1">
                  <h2 className="text-sm font-semibold text-t1 mb-1">{t('welcomeMessage')}</h2>
                  <p className="text-sm text-t2 leading-relaxed">{welcomeContent.welcome_message}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Mission Statement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('missionStatement')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="p-4 bg-tempo-50 rounded-lg border border-tempo-100">
                <p className="text-sm text-tempo-800 italic leading-relaxed">{welcomeContent.mission_statement}</p>
              </div>
            </div>
          </Card>

          {/* Company Values */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('companyValues')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(welcomeContent.company_values || []).map((value, i) => (
                  <div key={i} className="p-4 bg-canvas border border-border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
                        {valueIcons[value.icon] || <Star size={18} />}
                      </div>
                      <h3 className="text-sm font-semibold text-t1">{value.title}</h3>
                    </div>
                    <p className="text-xs text-t3 leading-relaxed">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Team Introductions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('teamIntroductions')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {employees.slice(0, 10).map(emp => (
                  <div key={emp.id} className="p-3 bg-canvas border border-border rounded-lg text-center">
                    <Avatar name={emp.profile.full_name} size="md" className="mx-auto mb-2" />
                    <p className="text-xs font-medium text-t1 truncate">{emp.profile.full_name}</p>
                    <p className="text-[0.6rem] text-t3 truncate">{emp.job_title}</p>
                    <Badge variant="default" className="mt-1 text-[0.5rem]">{getDepartmentName(emp.department_id)}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* First Week Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('firstWeekSchedule')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="space-y-3">
                {(welcomeContent.first_week_schedule || []).map((day, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-24 shrink-0">
                      <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 mb-1">
                        <Calendar size={16} />
                      </div>
                      <p className="text-xs font-semibold text-t1">{day.day}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      {day.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-t2">
                          <ChevronRight size={12} className="text-t3 shrink-0" />
                          <span>{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* IT Readiness Checklist */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('itReadiness')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="space-y-2">
                {(welcomeContent.it_checklist || []).map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-canvas border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        item.status === 'done' ? 'bg-green-100 text-green-600' :
                        item.status === 'in_progress' ? 'bg-amber-100 text-amber-600' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {item.status === 'done' ? <Check size={12} /> :
                         item.status === 'in_progress' ? <Clock size={12} /> :
                         <Timer size={12} />}
                      </div>
                      <span className="text-xs text-t1">{item.item}</span>
                    </div>
                    <Badge variant={item.status === 'done' ? 'success' : item.status === 'in_progress' ? 'warning' : 'default'}>
                      {item.status === 'done' ? tc('completed') : item.status === 'in_progress' ? tc('inProgress') : tc('pending')}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Welcome Video Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('welcomeVideo')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="aspect-video bg-canvas border border-border rounded-lg flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-full bg-tempo-50 flex items-center justify-center text-tempo-600">
                  <Play size={32} />
                </div>
                <p className="text-sm text-t2">{t('watchWelcomeVideo')}</p>
                <p className="text-xs text-t3">{t('videoComingSoon')}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ═══════════════════ BUDDY SYSTEM TAB ═══════════════════ */}
      {activeTab === 'buddy-system' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={t('activeBuddies')} value={activeBuddyCount} icon={<Users size={18} />} />
            <StatCard label={t('completedPairings')} value={completedBuddyCount} icon={<CheckCircle size={18} />} />
            <StatCard label={t('pendingPairings')} value={pendingBuddyCount} icon={<Clock size={18} />} />
            <StatCard label={t('matchScore')} value={`${buddyAssignments.length > 0 ? Math.round(buddyAssignments.reduce((s, b) => s + b.match_score, 0) / buddyAssignments.length) : 0}%`} icon={<Sparkles size={18} />} />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => setShowAssignBuddyModal(true)}>
              <UserPlus size={14} /> {t('assignBuddy')}
            </Button>
            <Button variant="secondary" onClick={() => setShowSuggestionsModal(true)}>
              <Sparkles size={14} /> {t('viewSuggestions')}
            </Button>
          </div>

          {/* Buddy Assignments List */}
          <div className="space-y-4">
            {filteredBuddyAssignments.length === 0 ? (
              <Card>
                <div className="p-8 text-center">
                  <Users size={40} className="text-t3 mx-auto mb-3" />
                  <p className="text-sm font-medium text-t2">No buddy assignments yet</p>
                  <p className="text-xs text-t3 mt-1">Pair new hires with experienced team members to help them settle in faster.</p>
                </div>
              </Card>
            ) : (
              filteredBuddyAssignments.map(assignment => {
                const newHire = employees.find(e => e.id === assignment.new_hire_id)
                const buddy = employees.find(e => e.id === assignment.buddy_id)
                const checklist = assignment.checklist || []
                const meetings = assignment.meetings || []
                const checklistDone = checklist.filter((c: any) => c.done).length
                const checklistTotal = checklist.length
                const meetingsDone = meetings.filter((m: any) => m.completed).length
                const meetingsTotal = meetings.length

                return (
                  <Card key={assignment.id}>
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-4">
                          {/* New Hire */}
                          <div className="text-center">
                            <Avatar name={newHire?.profile.full_name || 'Unknown'} size="md" />
                            <p className="text-xs font-medium text-t1 mt-1">{newHire?.profile.full_name || 'Unknown'}</p>
                            <p className="text-[0.6rem] text-t3">{t('newHire')}</p>
                          </div>
                          <ArrowRight size={16} className="text-t3 mt-2" />
                          {/* Buddy */}
                          <div className="text-center">
                            <Avatar name={buddy?.profile.full_name || 'Unknown'} size="md" />
                            <p className="text-xs font-medium text-t1 mt-1">{buddy?.profile.full_name || 'Unknown'}</p>
                            <p className="text-[0.6rem] text-t3">{t('buddy')}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={assignment.status === 'active' ? 'success' : assignment.status === 'completed' ? 'default' : 'warning'}>
                            {assignment.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-xs text-t3">
                            <Sparkles size={12} className="text-tempo-600" />
                            <span>{assignment.match_score}%</span>
                          </div>
                          {assignment.status === 'active' && (
                            <button
                              onClick={() => setConfirmAction({ show: true, action: 'remove_buddy', id: assignment.id, label: `Remove buddy pairing: ${newHire?.profile.full_name || 'Unknown'} & ${buddy?.profile.full_name || 'Unknown'}` })}
                              className="text-xs text-red-500 hover:text-red-700 ml-1"
                              title="Remove assignment"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Checklist */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-xs font-medium text-t1">{t('checklistProgress')}</p>
                            <span className="text-xs text-t3">{checklistDone}/{checklistTotal}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={checklistDone} max={checklistTotal} size="sm" showLabel className="flex-1" />
                            <span className="text-xs font-semibold text-tempo-600 shrink-0">{checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0}%</span>
                          </div>
                          <div className="mt-2 space-y-1">
                            {checklist.map((item: any, i: number) => (
                              <div key={i} className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const updated = [...checklist]
                                    updated[i] = { ...updated[i], done: !updated[i].done }
                                    updateBuddyAssignment(assignment.id, { checklist: updated })
                                  }}
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                                    item.done ? 'bg-tempo-600 border-tempo-600 text-white' : 'border-border'
                                  }`}
                                >
                                  {item.done && <Check size={10} />}
                                </button>
                                <span className={`text-xs ${item.done ? 'text-t3 line-through' : 'text-t1'}`}>{item.task}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Meetings */}
                        <div>
                          <p className="text-xs font-medium text-t1 mb-2">{t('meetingSchedule')}</p>
                          <div className="space-y-2">
                            {meetings.map((meeting: any, i: number) => (
                              <div key={i} className="flex items-center gap-3 p-2 bg-canvas border border-border rounded-lg">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  meeting.completed ? 'bg-green-100 text-green-600' : 'bg-tempo-50 text-tempo-600'
                                }`}>
                                  {meeting.completed ? <Check size={12} /> : <Calendar size={12} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-t1 truncate">{meeting.topic}</p>
                                  <p className="text-[0.6rem] text-t3">{new Date(meeting.date).toLocaleDateString()}</p>
                                </div>
                                {!meeting.completed && (
                                  <button
                                    onClick={() => {
                                      const updated = [...meetings]
                                      updated[i] = { ...updated[i], completed: true }
                                      updateBuddyAssignment(assignment.id, { meetings: updated })
                                    }}
                                    className="text-[0.6rem] text-tempo-600 hover:underline"
                                  >
                                    {tc('complete')}
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          {/* Assign Buddy Modal */}
          <Modal open={showAssignBuddyModal} onClose={() => setShowAssignBuddyModal(false)} title={t('assignBuddy')}>
            <div className="space-y-4">
              <Select label={t('selectNewHire')} value={buddyForm.new_hire_id} onChange={e => setBuddyForm(f => ({ ...f, new_hire_id: e.target.value }))} options={[
                { value: '', label: t('selectNewHire') },
                ...employees.map(e => ({ value: e.id, label: `${e.profile.full_name} — ${e.job_title}` })),
              ]} />
              <Select label={t('selectBuddy')} value={buddyForm.buddy_id} onChange={e => setBuddyForm(f => ({ ...f, buddy_id: e.target.value }))} options={[
                { value: '', label: t('selectBuddy') },
                ...employees.filter(e => e.id !== buddyForm.new_hire_id).map(e => ({ value: e.id, label: `${e.profile.full_name} — ${e.job_title}` })),
              ]} />
              <Button onClick={handleAssignBuddy} disabled={!buddyForm.new_hire_id || !buddyForm.buddy_id || formSaving} className="w-full">
                {formSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><UserPlus size={14} /> {t('assignBuddy')}</>}
              </Button>
            </div>
          </Modal>

          {/* AI Suggestions Modal */}
          <Modal open={showSuggestionsModal} onClose={() => setShowSuggestionsModal(false)} title={t('aiSuggestedMatch')}>
            <div className="space-y-4">
              <Select label={t('selectNewHire')} value={selectedNewHireForSuggestion} onChange={e => setSelectedNewHireForSuggestion(e.target.value)} options={[
                { value: '', label: t('selectNewHire') },
                ...employees.map(e => ({ value: e.id, label: `${e.profile.full_name} — ${e.job_title}` })),
              ]} />
              {buddySuggestions.length > 0 && (
                <div className="space-y-2">
                  {buddySuggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-canvas border border-border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar name={suggestion.name} size="sm" />
                        <div>
                          <p className="text-xs font-medium text-t1">{suggestion.name}</p>
                          <div className="flex flex-wrap gap-1 mt-0.5">
                            {suggestion.reasons.map((r, j) => (
                              <Badge key={j} variant="default" className="text-[0.5rem]">{r}</Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right">
                          <p className="text-sm font-semibold text-tempo-600">{suggestion.score}%</p>
                          <p className="text-[0.5rem] text-t3">{t('matchScore')}</p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            setBuddyForm({ new_hire_id: selectedNewHireForSuggestion, buddy_id: suggestion.employee_id })
                            setShowSuggestionsModal(false)
                            setShowAssignBuddyModal(true)
                          }}
                        >
                          {tc('assign')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Modal>
        </div>
      )}

      {/* ═══════════════════ PREBOARDING TAB ═══════════════════ */}
      {activeTab === 'preboarding' && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard label={t('totalTasks')} value={preboardingTasks.length} icon={<FileText size={18} />} />
            <StatCard label={t('completedTasks')} value={completedTaskCount} icon={<CheckCircle size={18} />} />
            <StatCard label={t('inProgressTasks')} value={inProgressTaskCount} icon={<Clock size={18} />} />
            <StatCard label={t('pendingTasks')} value={pendingTaskCount} icon={<Timer size={18} />} />
            <StatCard label={t('taskProgress')} value={`${taskCompletionPct}%`} icon={<Target size={18} />} />
          </div>

          {/* Progress Bar */}
          <Card>
            <div className="p-5">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-t1">{t('taskProgress')}</p>
                <span className="text-sm font-semibold text-tempo-600">{taskCompletionPct}%</span>
              </div>
              <Progress value={taskCompletionPct} size="md" />
            </div>
          </Card>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              {['all', 'documents', 'benefits', 'payroll', 'equipment', 'training', 'accounts'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setPreboardCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    preboardCategoryFilter === cat
                      ? 'bg-tempo-600 text-white'
                      : 'bg-canvas border border-border text-t2 hover:bg-tempo-50'
                  }`}
                >
                  {cat === 'all' ? t('allCategories') : t(`${cat}Category` as 'documentsCategory' | 'benefitsCategory' | 'payrollCategory' | 'equipmentCategory' | 'trainingCategory' | 'accountsCategory')}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setShowTemplateModal(true)}>
                <Table size={14} /> Create Template
              </Button>
              <Button onClick={() => setShowAddTaskModal(true)}>
                <FileText size={14} /> {tc('add')}
              </Button>
            </div>
          </div>

          {/* Task List */}
          <div className="space-y-2">
            {filteredTasks.length === 0 && (
              <Card>
                <div className="p-8 text-center">
                  <FileText size={40} className="text-t3 mx-auto mb-3" />
                  <p className="text-sm font-medium text-t2">No preboarding tasks</p>
                  <p className="text-xs text-t3 mt-1">Set up tasks to complete before day one so new hires are ready to go.</p>
                </div>
              </Card>
            )}
            {filteredTasks.map(task => {
              const emp = employees.find(e => e.id === task.employee_id)
              return (
                <Card key={task.id}>
                  <div className="p-4 flex items-center gap-4">
                    <button
                      onClick={() => {
                        if (task.status === 'completed') return
                        const newStatus = task.status === 'pending' ? 'in_progress' : 'completed'
                        updatePreboardingTask(task.id, {
                          status: newStatus,
                          completed_date: newStatus === 'completed' ? new Date().toISOString().split('T')[0] : null,
                        })
                      }}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                        task.status === 'completed'
                          ? 'bg-green-500 border-green-500 text-white'
                          : task.status === 'in_progress'
                          ? 'border-amber-400 bg-amber-50'
                          : 'border-border'
                      }`}
                    >
                      {task.status === 'completed' && <Check size={12} />}
                      {task.status === 'in_progress' && <Clock size={10} className="text-amber-500" />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-medium ${task.status === 'completed' ? 'text-t3 line-through' : 'text-t1'}`}>{task.title}</p>
                        <Badge variant={task.priority === 'high' ? 'error' : task.priority === 'medium' ? 'warning' : 'default'} className="text-[0.5rem]">
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-t3 flex items-center gap-1">
                          {categoryIcons[task.category] || <FileText size={12} />}
                          {task.category}
                        </span>
                        {emp && <span className="text-xs text-t3">{emp.profile.full_name}</span>}
                        <span className="text-xs text-t3">{tc('date')}: {task.due_date}</span>
                      </div>
                    </div>
                    <Badge variant={task.status === 'completed' ? 'success' : task.status === 'in_progress' ? 'warning' : 'default'}>
                      {task.status === 'completed' ? tc('completed') : task.status === 'in_progress' ? tc('inProgress') : tc('pending')}
                    </Badge>
                    {task.status !== 'completed' && (
                      <button
                        onClick={() => setConfirmAction({ show: true, action: 'delete_task', id: task.id, label: `Delete task: ${task.title}` })}
                        className="text-t3 hover:text-red-500 shrink-0 ml-1"
                        title="Delete task"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Communication Templates */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('communicationTemplates')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="space-y-2">
                {(welcomeContent.communication_templates || []).map(tpl => (
                  <div key={tpl.id} className="flex items-center justify-between p-3 bg-canvas border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center bg-gray-100 text-gray-500`}>
                        {tpl.type === 'email' ? <Mail size={14} /> : <FileText size={14} />}
                      </div>
                      <div>
                        <p className="text-xs font-medium text-t1">{tpl.name}</p>
                        <p className="text-[0.6rem] text-t3">{tpl.subject}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => addToast(`${tpl.subject || tpl.name} sent successfully`)}>
                      <Send size={12} /> {tc('send')}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Template Builder Modal */}
          <Modal open={showTemplateModal} onClose={() => setShowTemplateModal(false)} title="Create Checklist Template" size="lg">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Template Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  placeholder="e.g. Engineering Onboarding Checklist"
                />
              </div>
              <Select label="Category" value={templateCategory} onChange={e => setTemplateCategory(e.target.value)} options={[
                { value: 'documents', label: t('documentsCategory') },
                { value: 'benefits', label: t('benefitsCategory') },
                { value: 'payroll', label: t('payrollCategory') },
                { value: 'equipment', label: t('equipmentCategory') },
                { value: 'training', label: t('trainingCategory') },
                { value: 'accounts', label: t('accountsCategory') },
              ]} />

              {/* Existing template items */}
              {templateItems.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-t1">Checklist Items ({templateItems.length})</p>
                  {templateItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-canvas border border-border rounded-lg">
                      <CheckSquare size={14} className="text-tempo-600 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-t1 truncate">{item.title}</p>
                        {item.description && <p className="text-xs text-t3 truncate">{item.description}</p>}
                      </div>
                      <span className="text-xs text-t3 shrink-0">Due: +{item.due_days}d</span>
                      <button onClick={() => removeTemplateItem(idx)} className="text-t3 hover:text-error shrink-0">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add new item form */}
              <div className="p-3 bg-canvas border border-dashed border-border rounded-lg space-y-3">
                <p className="text-xs font-medium text-t2">Add Checklist Item</p>
                <input
                  type="text"
                  value={templateItemForm.title}
                  onChange={e => setTemplateItemForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  placeholder="Item title..."
                />
                <input
                  type="text"
                  value={templateItemForm.description}
                  onChange={e => setTemplateItemForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  placeholder="Description (optional)..."
                />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-t1 block mb-1">Due (days after start)</label>
                    <input
                      type="number"
                      min={1}
                      value={templateItemForm.due_days}
                      onChange={e => setTemplateItemForm(f => ({ ...f, due_days: parseInt(e.target.value) || 7 }))}
                      className="w-full px-3 py-2 bg-white border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                    />
                  </div>
                  <Select label="Assignee" value={templateItemForm.assignee} onChange={e => setTemplateItemForm(f => ({ ...f, assignee: e.target.value }))} options={[
                    { value: '', label: 'New Hire (self)' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'hr', label: 'HR Team' },
                    { value: 'it', label: 'IT Team' },
                  ]} />
                </div>
                <Button variant="secondary" onClick={addTemplateItem} disabled={!templateItemForm.title} className="w-full">
                  <Plus size={14} /> Add Item
                </Button>
              </div>

              {/* Apply template to employee */}
              {templateItems.length > 0 && (
                <div className="border-t border-divider pt-4 space-y-3">
                  <p className="text-xs font-medium text-t1">Apply Template to New Hire</p>
                  <Select label={t('newHire')} value="" onChange={e => { if (e.target.value) applyTemplate(e.target.value) }} options={[
                    { value: '', label: t('selectNewHire') },
                    ...employees.map(e => ({ value: e.id, label: e.profile.full_name })),
                  ]} />
                  <p className="text-xs text-t3">Select a new hire to create {templateItems.length} tasks from this template</p>
                </div>
              )}
            </div>
          </Modal>

          {/* Add Task Modal */}
          <Modal open={showAddTaskModal} onClose={() => setShowAddTaskModal(false)} title={t('preboardingTasks')}>
            <div className="space-y-4">
              <Select label={t('newHire')} value={taskForm.employee_id} onChange={e => setTaskForm(f => ({ ...f, employee_id: e.target.value }))} options={[
                { value: '', label: t('selectNewHire') },
                ...employees.map(e => ({ value: e.id, label: e.profile.full_name })),
              ]} />
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Task Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={e => setTaskForm(f => ({ ...f, title: e.target.value }))}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  placeholder="Enter task title..."
                />
              </div>
              <Select label="Category" value={taskForm.category} onChange={e => setTaskForm(f => ({ ...f, category: e.target.value }))} options={[
                { value: 'documents', label: t('documentsCategory') },
                { value: 'benefits', label: t('benefitsCategory') },
                { value: 'payroll', label: t('payrollCategory') },
                { value: 'equipment', label: t('equipmentCategory') },
                { value: 'training', label: t('trainingCategory') },
                { value: 'accounts', label: t('accountsCategory') },
              ]} />
              <Select label="Priority" value={taskForm.priority} onChange={e => setTaskForm(f => ({ ...f, priority: e.target.value }))} options={[
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]} />
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">{t('startDate')}</label>
                <input
                  type="date"
                  value={taskForm.due_date}
                  onChange={e => setTaskForm(f => ({ ...f, due_date: e.target.value }))}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                />
              </div>
              <Button onClick={handleAddTask} disabled={!taskForm.employee_id || !taskForm.title || formSaving} className="w-full">
                {formSaving ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : tc('create')}
              </Button>
            </div>
          </Modal>
        </div>
      )}

      {/* ═══════════════════ ONBOARDING PLAN TAB ═══════════════════ */}
      {activeTab === 'onboarding-plan' && (
        <div className="space-y-6">
          {/* Plan Generator */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">{t('generatePlan')}</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-medium text-t1 block mb-1">Role</label>
                  <input
                    type="text"
                    value={planRole}
                    onChange={e => setPlanRole(e.target.value)}
                    placeholder="e.g. Software Engineer"
                    className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none"
                  />
                </div>
                <Select label={tc('department')} value={planDepartment} onChange={e => setPlanDepartment(e.target.value)} options={[
                  { value: '', label: 'Select department' },
                  ...departments.map(d => ({ value: d.name, label: d.name })),
                ]} />
                <div className="flex items-end">
                  <Button onClick={() => {
                    if (onboardingPlan) {
                      addToast('Onboarding plan generated successfully')
                      document.getElementById('generated-plan')?.scrollIntoView({ behavior: 'smooth' })
                    }
                  }} disabled={!planRole || !planDepartment} className="w-full">
                    <Sparkles size={14} /> {t('generatePlan')}
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          {/* Generated Plan */}
          {onboardingPlan && (
            <div id="generated-plan">
              {/* AI Insights */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {onboardingPlan.insights.map(insight => (
                  <AIInsightCard key={insight.id} insight={insight} />
                ))}
              </div>

              {/* Phases */}
              <div className="space-y-4">
                {onboardingPlan.phases.map((phase, i) => (
                  <Card key={i}>
                    <div className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600 text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-t1">{phase.name}</h3>
                          <p className="text-xs text-t3">{t('duration')}: {phase.duration}</p>
                        </div>
                      </div>
                      <div className="space-y-2 ml-11">
                        {phase.tasks.map((task, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-t2">
                            <div className="w-1.5 h-1.5 rounded-full bg-tempo-600 shrink-0" />
                            <span>{task}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Default view when no plan generated */}
          {!onboardingPlan && (
            <Card>
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-2xl bg-tempo-50 flex items-center justify-center text-tempo-600 mx-auto mb-4">
                  <Sparkles size={32} />
                </div>
                <h3 className="text-sm font-semibold text-t1 mb-1">{t('generatePlan')}</h3>
                <p className="text-xs text-t3 max-w-md mx-auto">
                  Enter a role and department above to generate a structured onboarding plan with AI-powered recommendations.
                </p>
              </div>
            </Card>
          )}
        </div>
      )}
      {/* Bulk Preboarding Tasks Modal */}
      <Modal open={showBulkTaskModal} onClose={resetBulkTask} title="Bulk Preboarding Tasks" size="xl">
        <p className="text-xs text-t3 mb-4">Assign preboarding tasks to multiple new hires at once</p>
        {/* Step indicator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkTaskStep === 1 ? 'bg-tempo-500 text-white' : 'bg-success/20 text-success'}`}>
              {bulkTaskStep > 1 ? '✓' : '1'}
            </div>
            <span className={`text-xs font-medium ${bulkTaskStep === 1 ? 'text-t1' : 'text-success'}`}>Select Employees</span>
          </div>
          <div className="flex-1 h-px bg-divider" />
          <div className="flex items-center gap-2">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${bulkTaskStep === 2 ? 'bg-tempo-500 text-white' : 'bg-canvas text-t3'}`}>2</div>
            <span className={`text-xs font-medium ${bulkTaskStep === 2 ? 'text-t1' : 'text-t3'}`}>Select Tasks</span>
          </div>
        </div>

        {bulkTaskStep === 1 && (
          <>
            <div className="flex gap-2 mb-4">
              {(['individual', 'department', 'all'] as const).map(mode => (
                <button key={mode} onClick={() => setBulkTaskMode(mode)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkTaskMode === mode ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                  {mode === 'individual' && <><Users size={12} className="inline mr-1" />Individual</>}
                  {mode === 'department' && <><Building size={12} className="inline mr-1" />Department</>}
                  {mode === 'all' && <><CheckCircle size={12} className="inline mr-1" />Entire Company</>}
                </button>
              ))}
            </div>

            {bulkTaskMode === 'individual' && (
              <>
                <input type="text" placeholder="Search employees..." value={bulkTaskSearch} onChange={e => setBulkTaskSearch(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none mb-2" />
                <div className="max-h-[220px] overflow-y-auto divide-y divide-divider">
                  {bulkTaskTargetEmployees.map(emp => (
                    <label key={emp.id} className="flex items-center gap-3 px-2 py-2 hover:bg-canvas cursor-pointer">
                      <input type="checkbox" className="rounded border-border"
                        checked={bulkTaskSelectedEmpIds.has(emp.id)}
                        onChange={() => toggleBulkSet(bulkTaskSelectedEmpIds, setBulkTaskSelectedEmpIds, emp.id)} />
                      <Avatar name={emp.profile?.full_name || ''} size="xs" />
                      <div className="flex-1">
                        <p className="text-xs font-medium text-t1">{emp.profile?.full_name}</p>
                        <p className="text-[0.65rem] text-t3">{emp.job_title} · {getDepartmentName(emp.department_id)}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}

            {bulkTaskMode === 'department' && (
              <div className="flex flex-wrap gap-2 mb-3">
                {departments.map(dept => {
                  const count = employees.filter(e => e.department_id === dept.id).length
                  return (
                    <button key={dept.id} onClick={() => toggleBulkSet(bulkTaskSelectedDepts, setBulkTaskSelectedDepts, dept.id)}
                      className={`px-3 py-1.5 text-xs rounded-full border transition-all ${bulkTaskSelectedDepts.has(dept.id) ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                      {dept.name} ({count})
                    </button>
                  )
                })}
              </div>
            )}

            {bulkTaskMode === 'all' && (
              <div className="border border-border rounded-lg p-6 text-center">
                <Users size={32} className="mx-auto mb-2 text-tempo-500" />
                <h3 className="text-sm font-semibold text-t1">Entire Company Selected</h3>
                <p className="text-xs text-t3 mt-1">All {employees.length} employees will receive the selected tasks</p>
              </div>
            )}

            {(bulkTaskMode !== 'individual' && bulkTaskSelectedEmployees.length > 0) && (
              <div className="max-h-[100px] overflow-y-auto divide-y divide-divider border border-border rounded-lg mt-2">
                {bulkTaskSelectedEmployees.slice(0, 5).map(emp => (
                  <div key={emp.id} className="flex items-center gap-2 px-3 py-1.5">
                    <Avatar name={emp.profile?.full_name || ''} size="xs" />
                    <span className="text-xs text-t1">{emp.profile?.full_name}</span>
                    <span className="text-[0.65rem] text-t3 ml-auto">{getDepartmentName(emp.department_id)}</span>
                  </div>
                ))}
                {bulkTaskSelectedEmployees.length > 5 && <p className="px-3 py-1.5 text-xs text-t3">+{bulkTaskSelectedEmployees.length - 5} more</p>}
              </div>
            )}
          </>
        )}

        {bulkTaskStep === 2 && (
          <>
            {/* Category selector */}
            <div className="flex flex-wrap gap-2 mb-4">
              {Object.keys(taskTemplates).map(cat => (
                <button key={cat} onClick={() => { setBulkTaskCategory(cat); setBulkTaskTemplate([]) }}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all flex items-center gap-1 ${bulkTaskCategory === cat ? 'bg-tempo-500 text-white border-tempo-500' : 'border-border text-t2 hover:border-tempo-300'}`}>
                  {categoryIcons[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </button>
              ))}
            </div>

            {/* Task checkboxes */}
            <div className="space-y-2 mb-4">
              <p className="text-xs font-medium text-t1 mb-2">Select tasks to assign:</p>
              {taskTemplates[bulkTaskCategory]?.map(task => (
                <label key={task} className="flex items-center gap-3 px-3 py-2 border border-border rounded-lg hover:bg-canvas cursor-pointer">
                  <input type="checkbox" className="rounded border-border"
                    checked={bulkTaskTemplate.includes(task)}
                    onChange={() => toggleBulkTemplate(task)} />
                  <span className="text-xs text-t1">{task}</span>
                </label>
              ))}
            </div>

            {/* Priority & Due Date */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Select label="Priority" value={bulkTaskPriority} onChange={e => setBulkTaskPriority(e.target.value)} options={[
                { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
              ]} />
              <div>
                <label className="text-xs font-medium text-t1 block mb-1">Due Date</label>
                <input type="date" value={bulkTaskDueDate} onChange={e => setBulkTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-canvas border border-border rounded-lg text-sm text-t1 focus:border-tempo-600 focus:ring-1 focus:ring-tempo-600/20 outline-none" />
              </div>
            </div>

            {/* Summary */}
            <div className="border border-border rounded-lg p-4">
              <h4 className="text-xs font-semibold text-t1 mb-2">Summary</h4>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-lg font-bold text-t1">{bulkTaskSelectedEmployees.length}</p>
                  <p className="text-[0.65rem] text-t3">Employees</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-tempo-500">{bulkTaskTemplate.length}</p>
                  <p className="text-[0.65rem] text-t3">Tasks Each</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-success">{bulkTaskSelectedEmployees.length * bulkTaskTemplate.length}</p>
                  <p className="text-[0.65rem] text-t3">Total Tasks</p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-divider">
          <p className="text-xs text-t3">{bulkTaskSelectedEmployees.length} employee(s) selected</p>
          <div className="flex gap-2">
            {bulkTaskStep === 2 && <Button variant="secondary" size="sm" onClick={() => setBulkTaskStep(1)}>{tc('back')}</Button>}
            <Button variant="secondary" size="sm" onClick={resetBulkTask}>{tc('cancel')}</Button>
            {bulkTaskStep === 1 && (
              <Button size="sm" disabled={bulkTaskSelectedEmployees.length === 0} onClick={() => setBulkTaskStep(2)}>
                Next: Select Tasks →
              </Button>
            )}
            {bulkTaskStep === 2 && (
              <Button size="sm" disabled={bulkTaskTemplate.length === 0 || bulkTaskSelectedEmployees.length === 0} onClick={submitBulkTasks}>
                Create {bulkTaskSelectedEmployees.length * bulkTaskTemplate.length} Tasks
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* ═══════════════════ CONFIRMATION DIALOG ═══════════════════ */}
      <Modal open={!!confirmAction?.show} onClose={() => setConfirmAction(null)} title="Confirm Action">
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900">Are you sure?</p>
              <p className="text-xs text-amber-700 mt-1">{confirmAction?.label}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
            <Button onClick={executeConfirmAction} className="bg-red-600 hover:bg-red-700">Confirm</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
