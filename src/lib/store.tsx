'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  demoOrg, demoUser, demoDepartments, demoEmployees,
  demoGoals, demoReviewCycles, demoReviews, demoFeedback,
  demoCompBands, demoSalaryReviews,
  demoCourses, demoEnrollments,
  demoSurveys, demoEngagementScores,
  demoMentoringPrograms, demoMentoringPairs,
  demoPayrollRuns, demoLeaveRequests,
  demoBenefitPlans, demoExpenseReports,
  demoJobPostings, demoApplications,
  demoDevices, demoSoftwareLicenses, demoITRequests,
  demoInvoices, demoBudgets, demoVendors,
  demoCredentials,
  demoProjects, demoMilestones, demoTasks, demoTaskDependencies,
  demoStrategicObjectives, demoKeyResults, demoInitiatives, demoKPIDefinitions, demoKPIMeasurements,
  demoWorkflows, demoWorkflowSteps, demoWorkflowRuns, demoWorkflowTemplates,
  demoNotifications,
} from './demo-data'
import type { DemoRole } from './demo-data'

// ---- Audit Log ----
export interface AuditEntry {
  id: string
  user: string
  action: string
  entity_type: string
  entity_id: string
  details: string
  timestamp: string
}

// ---- Toast ----
export interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

function genId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRecord = Record<string, any>

// Widen narrow literal union types so pages can set any valid value
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type WidenPrimitive<T> = T extends string ? string : T extends number ? number : T
type Widen<T> = { [K in keyof T]: WidenPrimitive<NonNullable<T[K]>> | Extract<T[K], null | undefined> }
type WidenArray<T extends readonly unknown[]> = Array<Widen<T[number]>>

export interface CurrentUser {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role: DemoRole
  department_id: string
  employee_id: string
  job_title: string
}

interface TempoState {
  // Organization
  org: typeof demoOrg
  user: typeof demoUser
  currentUser: CurrentUser | null
  currentEmployeeId: string
  departments: typeof demoDepartments
  employees: typeof demoEmployees

  // Performance
  goals: WidenArray<typeof demoGoals>
  reviewCycles: WidenArray<typeof demoReviewCycles>
  reviews: WidenArray<typeof demoReviews>
  feedback: typeof demoFeedback

  // Compensation
  compBands: typeof demoCompBands
  salaryReviews: WidenArray<typeof demoSalaryReviews>

  // Learning
  courses: typeof demoCourses
  enrollments: WidenArray<typeof demoEnrollments>

  // Engagement
  surveys: WidenArray<typeof demoSurveys>
  engagementScores: typeof demoEngagementScores

  // Mentoring
  mentoringPrograms: WidenArray<typeof demoMentoringPrograms>
  mentoringPairs: WidenArray<typeof demoMentoringPairs>

  // Payroll
  payrollRuns: WidenArray<typeof demoPayrollRuns>

  // Time
  leaveRequests: WidenArray<typeof demoLeaveRequests>

  // Benefits
  benefitPlans: WidenArray<typeof demoBenefitPlans>

  // Expense
  expenseReports: WidenArray<typeof demoExpenseReports>

  // Recruiting
  jobPostings: WidenArray<typeof demoJobPostings>
  applications: WidenArray<typeof demoApplications>

  // IT
  devices: WidenArray<typeof demoDevices>
  softwareLicenses: typeof demoSoftwareLicenses
  itRequests: WidenArray<typeof demoITRequests>

  // Finance
  invoices: WidenArray<typeof demoInvoices>
  budgets: WidenArray<typeof demoBudgets>
  vendors: typeof demoVendors

  // Project Management
  projects: WidenArray<typeof demoProjects>
  milestones: WidenArray<typeof demoMilestones>
  tasks: WidenArray<typeof demoTasks>
  taskDependencies: typeof demoTaskDependencies

  // Strategy Execution
  strategicObjectives: WidenArray<typeof demoStrategicObjectives>
  keyResults: WidenArray<typeof demoKeyResults>
  initiatives: WidenArray<typeof demoInitiatives>
  kpiDefinitions: WidenArray<typeof demoKPIDefinitions>
  kpiMeasurements: WidenArray<typeof demoKPIMeasurements>

  // Workflow Studio
  workflows: WidenArray<typeof demoWorkflows>
  workflowSteps: WidenArray<typeof demoWorkflowSteps>
  workflowRuns: WidenArray<typeof demoWorkflowRuns>
  workflowTemplates: WidenArray<typeof demoWorkflowTemplates>

  // Notifications
  notifications: WidenArray<typeof demoNotifications>
  unreadNotificationCount: number

  // Audit
  auditLog: AuditEntry[]

  // Toasts
  toasts: Toast[]

  // Loading state
  isLoading: boolean

  // ---- CRUD Functions ----
  // Generic
  addToast: (message: string, type?: Toast['type']) => void
  removeToast: (id: string) => void

  // Employees
  addEmployee: (data: AnyRecord) => void
  updateEmployee: (id: string, data: AnyRecord) => void
  deleteEmployee: (id: string) => void

  // Goals
  addGoal: (data: AnyRecord) => void
  updateGoal: (id: string, data: AnyRecord) => void
  deleteGoal: (id: string) => void

  // Reviews
  addReview: (data: AnyRecord) => void
  updateReview: (id: string, data: AnyRecord) => void

  // Review Cycles
  addReviewCycle: (data: AnyRecord) => void
  updateReviewCycle: (id: string, data: AnyRecord) => void

  // Feedback
  addFeedback: (data: AnyRecord) => void

  // Comp Bands
  addCompBand: (data: AnyRecord) => void
  updateCompBand: (id: string, data: AnyRecord) => void
  deleteCompBand: (id: string) => void

  // Salary Reviews
  addSalaryReview: (data: AnyRecord) => void
  updateSalaryReview: (id: string, data: AnyRecord) => void

  // Courses
  addCourse: (data: AnyRecord) => void
  updateCourse: (id: string, data: AnyRecord) => void

  // Enrollments
  addEnrollment: (data: AnyRecord) => void
  updateEnrollment: (id: string, data: AnyRecord) => void

  // Surveys
  addSurvey: (data: AnyRecord) => void
  updateSurvey: (id: string, data: AnyRecord) => void

  // Mentoring Programs
  addMentoringProgram: (data: AnyRecord) => void
  updateMentoringProgram: (id: string, data: AnyRecord) => void

  // Mentoring Pairs
  addMentoringPair: (data: AnyRecord) => void
  updateMentoringPair: (id: string, data: AnyRecord) => void

  // Payroll
  addPayrollRun: (data: AnyRecord) => void
  updatePayrollRun: (id: string, data: AnyRecord) => void

  // Leave Requests
  addLeaveRequest: (data: AnyRecord) => void
  updateLeaveRequest: (id: string, data: AnyRecord) => void

  // Benefit Plans
  addBenefitPlan: (data: AnyRecord) => void
  updateBenefitPlan: (id: string, data: AnyRecord) => void

  // Expense Reports
  addExpenseReport: (data: AnyRecord) => void
  updateExpenseReport: (id: string, data: AnyRecord) => void
  deleteExpenseReport: (id: string) => void

  // Job Postings
  addJobPosting: (data: AnyRecord) => void
  updateJobPosting: (id: string, data: AnyRecord) => void

  // Applications
  addApplication: (data: AnyRecord) => void
  updateApplication: (id: string, data: AnyRecord) => void

  // Devices
  addDevice: (data: AnyRecord) => void
  updateDevice: (id: string, data: AnyRecord) => void

  // Software Licenses
  addSoftwareLicense: (data: AnyRecord) => void
  updateSoftwareLicense: (id: string, data: AnyRecord) => void

  // IT Requests
  addITRequest: (data: AnyRecord) => void
  updateITRequest: (id: string, data: AnyRecord) => void

  // Invoices
  addInvoice: (data: AnyRecord) => void
  updateInvoice: (id: string, data: AnyRecord) => void

  // Budgets
  addBudget: (data: AnyRecord) => void
  updateBudget: (id: string, data: AnyRecord) => void

  // Vendors
  addVendor: (data: AnyRecord) => void
  updateVendor: (id: string, data: AnyRecord) => void

  // Departments
  addDepartment: (data: AnyRecord) => void
  updateDepartment: (id: string, data: AnyRecord) => void

  // Projects
  addProject: (data: AnyRecord) => void
  updateProject: (id: string, data: AnyRecord) => void
  deleteProject: (id: string) => void

  // Milestones
  addMilestone: (data: AnyRecord) => void
  updateMilestone: (id: string, data: AnyRecord) => void

  // Tasks
  addTask: (data: AnyRecord) => void
  updateTask: (id: string, data: AnyRecord) => void
  deleteTask: (id: string) => void

  // Strategic Objectives
  addStrategicObjective: (data: AnyRecord) => void
  updateStrategicObjective: (id: string, data: AnyRecord) => void
  deleteStrategicObjective: (id: string) => void

  // Key Results
  addKeyResult: (data: AnyRecord) => void
  updateKeyResult: (id: string, data: AnyRecord) => void
  deleteKeyResult: (id: string) => void

  // Initiatives
  addInitiative: (data: AnyRecord) => void
  updateInitiative: (id: string, data: AnyRecord) => void
  deleteInitiative: (id: string) => void

  // KPI Definitions
  addKPIDefinition: (data: AnyRecord) => void
  updateKPIDefinition: (id: string, data: AnyRecord) => void

  // KPI Measurements
  addKPIMeasurement: (data: AnyRecord) => void

  // Workflows
  addWorkflow: (data: AnyRecord) => void
  updateWorkflow: (id: string, data: AnyRecord) => void
  deleteWorkflow: (id: string) => void

  // Workflow Steps
  addWorkflowStep: (data: AnyRecord) => void
  updateWorkflowStep: (id: string, data: AnyRecord) => void
  deleteWorkflowStep: (id: string) => void

  // Workflow Runs
  addWorkflowRun: (data: AnyRecord) => void
  updateWorkflowRun: (id: string, data: AnyRecord) => void

  // Notifications
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void

  // Org
  updateOrg: (data: AnyRecord) => void

  // Auth
  login: (email: string, password: string) => Promise<boolean | { requiresMFA: true; mfaToken: string }>
  verifyMFA: (mfaToken: string, code: string) => Promise<boolean>
  logout: () => Promise<void> | void
  switchUser: (employeeId: string) => Promise<void> | void
  isLoggedIn: boolean

  // Helper
  getEmployeeName: (id: string) => string
  getDepartmentName: (id: string) => string
}

const TempoContext = createContext<TempoState | null>(null)

export function useTempo() {
  const ctx = useContext(TempoContext)
  if (!ctx) throw new Error('useTempo must be used within TempoProvider')
  return ctx
}

// Helper to build CurrentUser from an employee record
function buildCurrentUser(emp: typeof demoEmployees[number]): CurrentUser {
  return {
    id: `user-${emp.id}`,
    email: emp.profile.email,
    full_name: emp.profile.full_name,
    avatar_url: emp.profile.avatar_url,
    role: emp.role as DemoRole,
    department_id: emp.department_id,
    employee_id: emp.id,
    job_title: emp.job_title,
  }
}

// Try to restore session from cookie via API
async function fetchSessionUser(): Promise<CurrentUser | null> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'me' }),
    })
    if (res.ok) {
      const { user } = await res.json()
      return user || null
    }
  } catch { /* ignore */ }
  return null
}

// Fallback for SSR/initial render: check localStorage (will be reconciled with cookie session)
function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('tempo_current_user')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

// ---- API helpers ----
async function apiPost(entity: string, action: 'create' | 'update' | 'delete', data?: AnyRecord, id?: string) {
  try {
    const res = await fetch('/api/data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, entity, id, data }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      console.error(`API ${action} ${entity} failed:`, err)
    }
    return res
  } catch (err) {
    console.error(`API ${action} ${entity} network error:`, err)
    return null
  }
}

export function TempoProvider({ children }: { children: React.ReactNode }) {
  // Initialize with demo data as fallback, but will be overwritten by DB data
  const [org, setOrg] = useState(demoOrg)
  const [departments, setDepartments] = useState(demoDepartments)
  const [employees, setEmployees] = useState(demoEmployees)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredUser())
  const [goals, setGoals] = useState(demoGoals)
  const [reviewCycles, setReviewCycles] = useState(demoReviewCycles)
  const [reviews, setReviews] = useState(demoReviews)
  const [feedback, setFeedback] = useState(demoFeedback)
  const [compBands, setCompBands] = useState(demoCompBands)
  const [salaryReviews, setSalaryReviews] = useState(demoSalaryReviews)
  const [courses, setCourses] = useState(demoCourses)
  const [enrollments, setEnrollments] = useState(demoEnrollments)
  const [surveys, setSurveys] = useState(demoSurveys)
  const [engagementScores, setEngagementScores] = useState(demoEngagementScores)
  const [mentoringPrograms, setMentoringPrograms] = useState(demoMentoringPrograms)
  const [mentoringPairs, setMentoringPairs] = useState(demoMentoringPairs)
  const [payrollRuns, setPayrollRuns] = useState(demoPayrollRuns)
  const [leaveRequests, setLeaveRequests] = useState(demoLeaveRequests)
  const [benefitPlans, setBenefitPlans] = useState(demoBenefitPlans)
  const [expenseReports, setExpenseReports] = useState(demoExpenseReports)
  const [jobPostings, setJobPostings] = useState(demoJobPostings)
  const [applications, setApplications] = useState(demoApplications)
  const [devices, setDevices] = useState(demoDevices)
  const [softwareLicenses, setSoftwareLicenses] = useState(demoSoftwareLicenses)
  const [itRequests, setITRequests] = useState(demoITRequests)
  const [invoices, setInvoices] = useState(demoInvoices)
  const [budgets, setBudgets] = useState(demoBudgets)
  const [vendors, setVendors] = useState(demoVendors)
  // Project Management
  const [projects, setProjects] = useState(demoProjects)
  const [milestones, setMilestones] = useState(demoMilestones)
  const [tasks, setTasks] = useState(demoTasks)
  const [taskDependencies, setTaskDependencies] = useState(demoTaskDependencies)
  // Strategy Execution
  const [strategicObjectives, setStrategicObjectives] = useState(demoStrategicObjectives)
  const [keyResults, setKeyResults] = useState(demoKeyResults)
  const [initiatives, setInitiatives] = useState(demoInitiatives)
  const [kpiDefinitions, setKPIDefinitions] = useState(demoKPIDefinitions)
  const [kpiMeasurements, setKPIMeasurements] = useState(demoKPIMeasurements)
  // Workflow Studio
  const [workflows, setWorkflows] = useState(demoWorkflows)
  const [workflowSteps, setWorkflowSteps] = useState(demoWorkflowSteps)
  const [workflowRuns, setWorkflowRuns] = useState(demoWorkflowRuns)
  const [workflowTemplates, setWorkflowTemplates] = useState(demoWorkflowTemplates)
  // Notifications
  const [notifications, setNotifications] = useState(demoNotifications)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const hasFetched = useRef(false)

  // ---- Validate session and fetch data on mount ----
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function initSession() {
      try {
        // Step 1: Validate session with server (cookie-based)
        const sessionUser = await fetchSessionUser()
        if (sessionUser) {
          setCurrentUser(sessionUser)
          try { localStorage.setItem('tempo_current_user', JSON.stringify(sessionUser)) } catch { /* ignore */ }
        } else {
          // No valid server session - clear local state
          setCurrentUser(null)
          try { localStorage.removeItem('tempo_current_user') } catch { /* ignore */ }
          // Don't fetch data if not authenticated
          setIsLoading(false)
          return
        }

        // Step 2: Fetch all data from DB (session cookie sent automatically)
        const res = await fetch('/api/data')
        if (!res.ok) {
          console.warn('Failed to load data from DB, using demo data')
          setIsLoading(false)
          return
        }
        const data = await res.json()

        if (data.org) setOrg(data.org)
        if (data.departments?.length) setDepartments(data.departments)
        if (data.employees?.length) setEmployees(data.employees)
        if (data.goals?.length) setGoals(data.goals)
        if (data.reviewCycles?.length) setReviewCycles(data.reviewCycles)
        if (data.reviews?.length) setReviews(data.reviews)
        if (data.feedback?.length) setFeedback(data.feedback)
        if (data.compBands?.length) setCompBands(data.compBands)
        if (data.salaryReviews?.length) setSalaryReviews(data.salaryReviews)
        if (data.courses?.length) setCourses(data.courses)
        if (data.enrollments?.length) setEnrollments(data.enrollments)
        if (data.surveys?.length) setSurveys(data.surveys)
        if (data.engagementScores?.length) setEngagementScores(data.engagementScores)
        if (data.mentoringPrograms?.length) setMentoringPrograms(data.mentoringPrograms)
        if (data.mentoringPairs?.length) setMentoringPairs(data.mentoringPairs)
        if (data.payrollRuns?.length) setPayrollRuns(data.payrollRuns)
        if (data.leaveRequests?.length) setLeaveRequests(data.leaveRequests)
        if (data.benefitPlans?.length) setBenefitPlans(data.benefitPlans)
        if (data.expenseReports?.length) setExpenseReports(data.expenseReports)
        if (data.jobPostings?.length) setJobPostings(data.jobPostings)
        if (data.applications?.length) setApplications(data.applications)
        if (data.devices?.length) setDevices(data.devices)
        if (data.softwareLicenses?.length) setSoftwareLicenses(data.softwareLicenses)
        if (data.itRequests?.length) setITRequests(data.itRequests)
        if (data.invoices?.length) setInvoices(data.invoices)
        if (data.budgets?.length) setBudgets(data.budgets)
        if (data.vendors?.length) setVendors(data.vendors)
        // Phase 3: Project Management
        if (data.projects?.length) setProjects(data.projects)
        if (data.milestones?.length) setMilestones(data.milestones)
        if (data.tasks?.length) setTasks(data.tasks)
        if (data.taskDependencies?.length) setTaskDependencies(data.taskDependencies)
        // Phase 3: Strategy Execution
        if (data.strategicObjectives?.length) setStrategicObjectives(data.strategicObjectives)
        if (data.keyResults?.length) setKeyResults(data.keyResults)
        if (data.initiatives?.length) setInitiatives(data.initiatives)
        if (data.kpiDefinitions?.length) setKPIDefinitions(data.kpiDefinitions)
        if (data.kpiMeasurements?.length) setKPIMeasurements(data.kpiMeasurements)
        // Phase 3: Workflow Studio
        if (data.workflows?.length) setWorkflows(data.workflows)
        if (data.workflowSteps?.length) setWorkflowSteps(data.workflowSteps)
        if (data.workflowRuns?.length) setWorkflowRuns(data.workflowRuns)
        if (data.workflowTemplates?.length) setWorkflowTemplates(data.workflowTemplates)
        // Notifications
        if (data.notifications?.length) setNotifications(data.notifications)
        if (data.auditLog?.length) setAuditLog(data.auditLog.map((a: AnyRecord) => ({
          id: a.id,
          user: a.user_id || '',
          action: a.action,
          entity_type: a.entity_type,
          entity_id: a.entity_id || '',
          details: a.details || '',
          timestamp: a.timestamp,
        })))
      } catch (err) {
        console.warn('Failed to initialize session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  // ---- Helpers ----
  const getEmployeeName = useCallback((id: string) => {
    const emp = employees.find(e => e.id === id)
    return emp?.profile.full_name || 'Unknown'
  }, [employees])

  const getDepartmentName = useCallback((id: string) => {
    const dept = departments.find(d => d.id === id)
    return dept?.name || 'Unknown'
  }, [departments])

  const logAudit = useCallback((action: string, entity_type: string, entity_id: string, details: string) => {
    setAuditLog(prev => [{
      id: genId('audit'),
      user: currentUser?.full_name || demoUser.full_name,
      action,
      entity_type,
      entity_id,
      details,
      timestamp: new Date().toISOString(),
    }, ...prev])
  }, [currentUser])

  // ---- Toasts ----
  const addToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = genId('toast')
    setToasts(prev => [...prev, { id, message, type }])
    const timer = setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
      toastTimers.current.delete(id)
    }, 4000)
    toastTimers.current.set(id, timer)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    const timer = toastTimers.current.get(id)
    if (timer) { clearTimeout(timer); toastTimers.current.delete(id) }
  }, [])

  // ---- CRUD: Employees ----
  const addEmployee = useCallback((data: AnyRecord) => {
    const id = genId('emp')
    const emp = { id, org_id: 'org-1', ...data }
    setEmployees(prev => [...prev, emp] as typeof prev)
    logAudit('create', 'employee', id, `Added employee: ${data.profile?.full_name || 'New Employee'}`)
    addToast(`Employee ${data.profile?.full_name || ''} added`)
    apiPost('employees', 'create', data)
  }, [logAudit, addToast])

  const updateEmployee = useCallback((id: string, data: AnyRecord) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'employee', id, `Updated employee: ${getEmployeeName(id)}`)
    addToast(`Employee updated`)
    apiPost('employees', 'update', data, id)
  }, [logAudit, addToast, getEmployeeName])

  const deleteEmployee = useCallback((id: string) => {
    const name = getEmployeeName(id)
    setEmployees(prev => prev.filter(e => e.id !== id))
    setDevices(prev => prev.map(d => d.assigned_to === id ? { ...d, assigned_to: null, status: 'available' as const } : d) as typeof prev)
    setGoals(prev => prev.filter(g => g.employee_id !== id))
    setLeaveRequests(prev => prev.filter(lr => lr.employee_id !== id))
    logAudit('delete', 'employee', id, `Removed employee: ${name}`)
    addToast(`Employee ${name} removed`)
    apiPost('employees', 'delete', undefined, id)
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Goals ----
  const addGoal = useCallback((data: AnyRecord) => {
    const id = genId('goal')
    setGoals(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'goal', id, `Created goal: ${data.title}`)
    addToast('Goal created')
    apiPost('goals', 'create', data)
  }, [logAudit, addToast])

  const updateGoal = useCallback((id: string, data: AnyRecord) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev)
    logAudit('update', 'goal', id, `Updated goal`)
    addToast('Goal updated')
    apiPost('goals', 'update', data, id)
  }, [logAudit, addToast])

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    logAudit('delete', 'goal', id, 'Deleted goal')
    addToast('Goal deleted')
    apiPost('goals', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Reviews ----
  const addReview = useCallback((data: AnyRecord) => {
    const id = genId('rev')
    setReviews(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'review', id, `Created review`)
    addToast('Review created')
    apiPost('reviews', 'create', data)
  }, [logAudit, addToast])

  const updateReview = useCallback((id: string, data: AnyRecord) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'review', id, `Updated review`)
    addToast('Review updated')
    apiPost('reviews', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Review Cycles ----
  const addReviewCycle = useCallback((data: AnyRecord) => {
    const id = genId('cycle')
    setReviewCycles(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'review_cycle', id, `Created review cycle: ${data.title}`)
    addToast('Review cycle created')
    apiPost('reviewCycles', 'create', data)
  }, [logAudit, addToast])

  const updateReviewCycle = useCallback((id: string, data: AnyRecord) => {
    setReviewCycles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'review_cycle', id, 'Updated review cycle')
    addToast('Review cycle updated')
    apiPost('reviewCycles', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Feedback ----
  const addFeedback = useCallback((data: AnyRecord) => {
    const id = genId('fb')
    setFeedback(prev => [{ id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }, ...prev] as typeof prev)
    logAudit('create', 'feedback', id, `Gave feedback to ${getEmployeeName(data.to_id)}`)
    addToast('Feedback sent')
    apiPost('feedback', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Comp Bands ----
  const addCompBand = useCallback((data: AnyRecord) => {
    const id = genId('band')
    setCompBands(prev => [...prev, { id, org_id: 'org-1', ...data }] as typeof prev)
    logAudit('create', 'comp_band', id, `Created comp band: ${data.role_title}`)
    addToast('Compensation band created')
    apiPost('compBands', 'create', data)
  }, [logAudit, addToast])

  const updateCompBand = useCallback((id: string, data: AnyRecord) => {
    setCompBands(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'comp_band', id, 'Updated comp band')
    addToast('Compensation band updated')
    apiPost('compBands', 'update', data, id)
  }, [logAudit, addToast])

  const deleteCompBand = useCallback((id: string) => {
    setCompBands(prev => prev.filter(b => b.id !== id))
    logAudit('delete', 'comp_band', id, 'Deleted comp band')
    addToast('Compensation band deleted')
    apiPost('compBands', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Salary Reviews ----
  const addSalaryReview = useCallback((data: AnyRecord) => {
    const id = genId('sr')
    setSalaryReviews(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'salary_review', id, `Proposed salary review for ${getEmployeeName(data.employee_id)}`)
    addToast('Salary review submitted')
    apiPost('salaryReviews', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  const updateSalaryReview = useCallback((id: string, data: AnyRecord) => {
    setSalaryReviews(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'
    logAudit('update', 'salary_review', id, `${action} salary review`)
    addToast(`Salary review ${action.toLowerCase()}`)
    apiPost('salaryReviews', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Courses ----
  const addCourse = useCallback((data: AnyRecord) => {
    const id = genId('course')
    setCourses(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'course', id, `Created course: ${data.title}`)
    addToast('Course created')
    apiPost('courses', 'create', data)
  }, [logAudit, addToast])

  const updateCourse = useCallback((id: string, data: AnyRecord) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'course', id, 'Updated course')
    addToast('Course updated')
    apiPost('courses', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Enrollments ----
  const addEnrollment = useCallback((data: AnyRecord) => {
    const id = genId('enr')
    setEnrollments(prev => [...prev, { id, org_id: 'org-1', enrolled_at: new Date().toISOString(), completed_at: null, ...data }] as typeof prev)
    logAudit('create', 'enrollment', id, `Enrolled in course`)
    addToast('Enrolled in course')
    apiPost('enrollments', 'create', data)
  }, [logAudit, addToast])

  const updateEnrollment = useCallback((id: string, data: AnyRecord) => {
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'enrollment', id, 'Updated enrollment')
    addToast('Enrollment updated')
    apiPost('enrollments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Surveys ----
  const addSurvey = useCallback((data: AnyRecord) => {
    const id = genId('survey')
    setSurveys(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'survey', id, `Created survey: ${data.title}`)
    addToast('Survey created')
    apiPost('surveys', 'create', data)
  }, [logAudit, addToast])

  const updateSurvey = useCallback((id: string, data: AnyRecord) => {
    setSurveys(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'survey', id, 'Updated survey')
    addToast('Survey updated')
    apiPost('surveys', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Mentoring ----
  const addMentoringProgram = useCallback((data: AnyRecord) => {
    const id = genId('mp')
    setMentoringPrograms(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mentoring_program', id, `Created program: ${data.title}`)
    addToast('Mentoring program created')
    apiPost('mentoringPrograms', 'create', data)
  }, [logAudit, addToast])

  const updateMentoringProgram = useCallback((id: string, data: AnyRecord) => {
    setMentoringPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'mentoring_program', id, 'Updated mentoring program')
    addToast('Mentoring program updated')
    apiPost('mentoringPrograms', 'update', data, id)
  }, [logAudit, addToast])

  const addMentoringPair = useCallback((data: AnyRecord) => {
    const id = genId('pair')
    setMentoringPairs(prev => [...prev, { id, org_id: 'org-1', started_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mentoring_pair', id, `Matched ${getEmployeeName(data.mentor_id)} with ${getEmployeeName(data.mentee_id)}`)
    addToast('Mentoring pair matched')
    apiPost('mentoringPairs', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  const updateMentoringPair = useCallback((id: string, data: AnyRecord) => {
    setMentoringPairs(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'mentoring_pair', id, 'Updated mentoring pair')
    addToast('Mentoring pair updated')
    apiPost('mentoringPairs', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Payroll ----
  const addPayrollRun = useCallback((data: AnyRecord) => {
    const id = genId('pr')
    setPayrollRuns(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'payroll_run', id, `Created pay run: ${data.period}`)
    addToast('Payroll run created')
    apiPost('payrollRuns', 'create', data)
  }, [logAudit, addToast])

  const updatePayrollRun = useCallback((id: string, data: AnyRecord) => {
    setPayrollRuns(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'payroll_run', id, 'Updated payroll run')
    addToast('Payroll run updated')
    apiPost('payrollRuns', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Leave Requests ----
  const addLeaveRequest = useCallback((data: AnyRecord) => {
    const id = genId('lr')
    setLeaveRequests(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'leave_request', id, `Submitted leave request`)
    addToast('Leave request submitted')
    apiPost('leaveRequests', 'create', data)
  }, [logAudit, addToast])

  const updateLeaveRequest = useCallback((id: string, data: AnyRecord) => {
    setLeaveRequests(prev => prev.map(lr => lr.id === id ? { ...lr, ...data } : lr) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'
    logAudit('update', 'leave_request', id, `${action} leave request`)
    addToast(`Leave request ${action.toLowerCase()}`)
    apiPost('leaveRequests', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Benefits ----
  const addBenefitPlan = useCallback((data: AnyRecord) => {
    const id = genId('bp')
    setBenefitPlans(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'benefit_plan', id, `Created benefit plan: ${data.name}`)
    addToast('Benefit plan created')
    apiPost('benefitPlans', 'create', data)
  }, [logAudit, addToast])

  const updateBenefitPlan = useCallback((id: string, data: AnyRecord) => {
    setBenefitPlans(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'benefit_plan', id, 'Updated benefit plan')
    addToast('Benefit plan updated')
    apiPost('benefitPlans', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Expenses ----
  const addExpenseReport = useCallback((data: AnyRecord) => {
    const id = genId('exp')
    setExpenseReports(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'expense_report', id, `Created expense: ${data.title}`)
    addToast('Expense report created')
    apiPost('expenseReports', 'create', data)
  }, [logAudit, addToast])

  const updateExpenseReport = useCallback((id: string, data: AnyRecord) => {
    setExpenseReports(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status === 'reimbursed' ? 'Reimbursed' : 'Updated'
    logAudit('update', 'expense_report', id, `${action} expense report`)
    addToast(`Expense report ${action.toLowerCase()}`)
    apiPost('expenseReports', 'update', data, id)
  }, [logAudit, addToast])

  const deleteExpenseReport = useCallback((id: string) => {
    setExpenseReports(prev => prev.filter(e => e.id !== id))
    logAudit('delete', 'expense_report', id, 'Deleted expense report')
    addToast('Expense report deleted')
    apiPost('expenseReports', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Recruiting ----
  const addJobPosting = useCallback((data: AnyRecord) => {
    const id = genId('job')
    setJobPostings(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), application_count: 0, ...data }] as typeof prev)
    logAudit('create', 'job_posting', id, `Created job posting: ${data.title}`)
    addToast('Job posting created')
    apiPost('jobPostings', 'create', data)
  }, [logAudit, addToast])

  const updateJobPosting = useCallback((id: string, data: AnyRecord) => {
    setJobPostings(prev => prev.map(j => j.id === id ? { ...j, ...data } : j) as typeof prev)
    logAudit('update', 'job_posting', id, 'Updated job posting')
    addToast('Job posting updated')
    apiPost('jobPostings', 'update', data, id)
  }, [logAudit, addToast])

  const addApplication = useCallback((data: AnyRecord) => {
    const id = genId('app')
    setApplications(prev => [...prev, { id, org_id: 'org-1', applied_at: new Date().toISOString(), ...data }] as typeof prev)
    if (data.job_id) {
      setJobPostings(prev => prev.map(j => j.id === data.job_id ? { ...j, application_count: (j.application_count || 0) + 1 } : j))
    }
    logAudit('create', 'application', id, `New application from ${data.candidate_name}`)
    addToast('Application added')
    apiPost('applications', 'create', data)
  }, [logAudit, addToast])

  const updateApplication = useCallback((id: string, data: AnyRecord) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'application', id, `Updated application status to ${data.status || data.stage || 'updated'}`)
    addToast('Application updated')
    apiPost('applications', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT ----
  const addDevice = useCallback((data: AnyRecord) => {
    const id = genId('dev')
    setDevices(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'device', id, `Added device: ${data.brand} ${data.model}`)
    addToast('Device added')
    apiPost('devices', 'create', data)
  }, [logAudit, addToast])

  const updateDevice = useCallback((id: string, data: AnyRecord) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'device', id, 'Updated device')
    addToast('Device updated')
    apiPost('devices', 'update', data, id)
  }, [logAudit, addToast])

  const addSoftwareLicense = useCallback((data: AnyRecord) => {
    const id = genId('sl')
    setSoftwareLicenses(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'software_license', id, `Added license: ${data.name}`)
    addToast('Software license added')
    apiPost('softwareLicenses', 'create', data)
  }, [logAudit, addToast])

  const updateSoftwareLicense = useCallback((id: string, data: AnyRecord) => {
    setSoftwareLicenses(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'software_license', id, 'Updated software license')
    addToast('Software license updated')
    apiPost('softwareLicenses', 'update', data, id)
  }, [logAudit, addToast])

  const addITRequest = useCallback((data: AnyRecord) => {
    const id = genId('itr')
    setITRequests(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'it_request', id, `Created IT request: ${data.title}`)
    addToast('IT request submitted')
    apiPost('itRequests', 'create', data)
  }, [logAudit, addToast])

  const updateITRequest = useCallback((id: string, data: AnyRecord) => {
    setITRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'it_request', id, 'Updated IT request')
    addToast('IT request updated')
    apiPost('itRequests', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Finance ----
  const addInvoice = useCallback((data: AnyRecord) => {
    const id = genId('inv')
    setInvoices(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'invoice', id, `Created invoice: ${data.invoice_number}`)
    addToast('Invoice created')
    apiPost('invoices', 'create', data)
  }, [logAudit, addToast])

  const updateInvoice = useCallback((id: string, data: AnyRecord) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'invoice', id, 'Updated invoice')
    addToast('Invoice updated')
    apiPost('invoices', 'update', data, id)
  }, [logAudit, addToast])

  const addBudget = useCallback((data: AnyRecord) => {
    const id = genId('bud')
    setBudgets(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'budget', id, `Created budget: ${data.name}`)
    addToast('Budget created')
    apiPost('budgets', 'create', data)
  }, [logAudit, addToast])

  const updateBudget = useCallback((id: string, data: AnyRecord) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'budget', id, 'Updated budget')
    addToast('Budget updated')
    apiPost('budgets', 'update', data, id)
  }, [logAudit, addToast])

  const addVendor = useCallback((data: AnyRecord) => {
    const id = genId('vnd')
    setVendors(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'vendor', id, `Added vendor: ${data.name}`)
    addToast('Vendor added')
    apiPost('vendors', 'create', data)
  }, [logAudit, addToast])

  const updateVendor = useCallback((id: string, data: AnyRecord) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...data } : v) as typeof prev)
    logAudit('update', 'vendor', id, 'Updated vendor')
    addToast('Vendor updated')
    apiPost('vendors', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Departments ----
  const addDepartment = useCallback((data: AnyRecord) => {
    const id = genId('dept')
    setDepartments(prev => [...prev, { id, org_id: 'org-1', ...data }] as typeof prev)
    logAudit('create', 'department', id, `Created department: ${data.name}`)
    addToast('Department created')
    apiPost('departments', 'create', data)
  }, [logAudit, addToast])

  const updateDepartment = useCallback((id: string, data: AnyRecord) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'department', id, 'Updated department')
    addToast('Department updated')
    apiPost('departments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Projects ----
  const addProject = useCallback((data: AnyRecord) => {
    const id = genId('proj')
    setProjects(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'project', id, `Created project: ${data.title}`)
    addToast('Project created')
    apiPost('projects', 'create', data)
  }, [logAudit, addToast])

  const updateProject = useCallback((id: string, data: AnyRecord) => {
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'project', id, 'Updated project')
    addToast('Project updated')
    apiPost('projects', 'update', data, id)
  }, [logAudit, addToast])

  const deleteProject = useCallback((id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id))
    setMilestones(prev => prev.filter(m => m.project_id !== id))
    setTasks(prev => prev.filter(t => t.project_id !== id))
    logAudit('delete', 'project', id, 'Deleted project')
    addToast('Project deleted')
    apiPost('projects', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Milestones ----
  const addMilestone = useCallback((data: AnyRecord) => {
    const id = genId('mile')
    setMilestones(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'milestone', id, `Created milestone: ${data.title}`)
    addToast('Milestone created')
    apiPost('milestones', 'create', data)
  }, [logAudit, addToast])

  const updateMilestone = useCallback((id: string, data: AnyRecord) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, ...data } : m) as typeof prev)
    logAudit('update', 'milestone', id, 'Updated milestone')
    addToast('Milestone updated')
    apiPost('milestones', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Tasks ----
  const addTask = useCallback((data: AnyRecord) => {
    const id = genId('task')
    setTasks(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'task', id, `Created task: ${data.title}`)
    addToast('Task created')
    apiPost('tasks', 'create', data)
  }, [logAudit, addToast])

  const updateTask = useCallback((id: string, data: AnyRecord) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'task', id, 'Updated task')
    addToast('Task updated')
    apiPost('tasks', 'update', data, id)
  }, [logAudit, addToast])

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id))
    setTaskDependencies(prev => prev.filter(d => d.task_id !== id && d.depends_on_task_id !== id))
    logAudit('delete', 'task', id, 'Deleted task')
    addToast('Task deleted')
    apiPost('tasks', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Strategic Objectives ----
  const addStrategicObjective = useCallback((data: AnyRecord) => {
    const id = genId('obj')
    setStrategicObjectives(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'strategic_objective', id, `Created objective: ${data.title}`)
    addToast('Strategic objective created')
    apiPost('strategicObjectives', 'create', data)
  }, [logAudit, addToast])

  const updateStrategicObjective = useCallback((id: string, data: AnyRecord) => {
    setStrategicObjectives(prev => prev.map(o => o.id === id ? { ...o, ...data } : o) as typeof prev)
    logAudit('update', 'strategic_objective', id, 'Updated strategic objective')
    addToast('Objective updated')
    apiPost('strategicObjectives', 'update', data, id)
  }, [logAudit, addToast])

  const deleteStrategicObjective = useCallback((id: string) => {
    setStrategicObjectives(prev => prev.filter(o => o.id !== id) as typeof prev)
    setKeyResults(prev => prev.filter(kr => kr.objective_id !== id) as typeof prev)
    logAudit('delete', 'strategic_objective', id, 'Deleted strategic objective')
    addToast('Objective deleted')
    apiPost('strategicObjectives', 'delete', {}, id)
  }, [logAudit, addToast])

  // ---- CRUD: Key Results ----
  const addKeyResult = useCallback((data: AnyRecord) => {
    const id = genId('kr')
    setKeyResults(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'key_result', id, `Created key result: ${data.title}`)
    addToast('Key result created')
    apiPost('keyResults', 'create', data)
  }, [logAudit, addToast])

  const updateKeyResult = useCallback((id: string, data: AnyRecord) => {
    setKeyResults(prev => prev.map(kr => kr.id === id ? { ...kr, ...data } : kr) as typeof prev)
    logAudit('update', 'key_result', id, 'Updated key result')
    addToast('Key result updated')
    apiPost('keyResults', 'update', data, id)
  }, [logAudit, addToast])

  const deleteKeyResult = useCallback((id: string) => {
    setKeyResults(prev => prev.filter(kr => kr.id !== id) as typeof prev)
    logAudit('delete', 'key_result', id, 'Deleted key result')
    addToast('Key result deleted')
    apiPost('keyResults', 'delete', {}, id)
  }, [logAudit, addToast])

  // ---- CRUD: Initiatives ----
  const addInitiative = useCallback((data: AnyRecord) => {
    const id = genId('init')
    setInitiatives(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'initiative', id, `Created initiative: ${data.title}`)
    addToast('Initiative created')
    apiPost('initiatives', 'create', data)
  }, [logAudit, addToast])

  const updateInitiative = useCallback((id: string, data: AnyRecord) => {
    setInitiatives(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'initiative', id, 'Updated initiative')
    addToast('Initiative updated')
    apiPost('initiatives', 'update', data, id)
  }, [logAudit, addToast])

  const deleteInitiative = useCallback((id: string) => {
    setInitiatives(prev => prev.filter(i => i.id !== id) as typeof prev)
    logAudit('delete', 'initiative', id, 'Deleted initiative')
    addToast('Initiative deleted')
    apiPost('initiatives', 'delete', {}, id)
  }, [logAudit, addToast])

  // ---- CRUD: KPI Definitions ----
  const addKPIDefinition = useCallback((data: AnyRecord) => {
    const id = genId('kpi')
    setKPIDefinitions(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'kpi_definition', id, `Created KPI: ${data.name}`)
    addToast('KPI created')
    apiPost('kpiDefinitions', 'create', data)
  }, [logAudit, addToast])

  const updateKPIDefinition = useCallback((id: string, data: AnyRecord) => {
    setKPIDefinitions(prev => prev.map(k => k.id === id ? { ...k, ...data } : k) as typeof prev)
    logAudit('update', 'kpi_definition', id, 'Updated KPI')
    addToast('KPI updated')
    apiPost('kpiDefinitions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: KPI Measurements ----
  const addKPIMeasurement = useCallback((data: AnyRecord) => {
    const id = genId('kpim')
    setKPIMeasurements(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'kpi_measurement', id, 'Recorded KPI measurement')
    addToast('Measurement recorded')
    apiPost('kpiMeasurements', 'create', data)
  }, [logAudit, addToast])

  // ---- CRUD: Workflows ----
  const addWorkflow = useCallback((data: AnyRecord) => {
    const id = genId('wf')
    setWorkflows(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'workflow', id, `Created workflow: ${data.title}`)
    addToast('Workflow created')
    apiPost('workflows', 'create', data)
  }, [logAudit, addToast])

  const updateWorkflow = useCallback((id: string, data: AnyRecord) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...data } : w) as typeof prev)
    logAudit('update', 'workflow', id, 'Updated workflow')
    addToast('Workflow updated')
    apiPost('workflows', 'update', data, id)
  }, [logAudit, addToast])

  const deleteWorkflow = useCallback((id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id))
    setWorkflowSteps(prev => prev.filter(s => s.workflow_id !== id))
    logAudit('delete', 'workflow', id, 'Deleted workflow')
    addToast('Workflow deleted')
    apiPost('workflows', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Workflow Steps ----
  const addWorkflowStep = useCallback((data: AnyRecord) => {
    const id = genId('wfs')
    setWorkflowSteps(prev => [...prev, { id, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'workflow_step', id, `Created step: ${data.title}`)
    addToast('Step added')
    apiPost('workflowSteps', 'create', data)
  }, [logAudit, addToast])

  const updateWorkflowStep = useCallback((id: string, data: AnyRecord) => {
    setWorkflowSteps(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'workflow_step', id, 'Updated step')
    addToast('Step updated')
    apiPost('workflowSteps', 'update', data, id)
  }, [logAudit, addToast])

  const deleteWorkflowStep = useCallback((id: string) => {
    setWorkflowSteps(prev => prev.filter(s => s.id !== id))
    logAudit('delete', 'workflow_step', id, 'Deleted step')
    addToast('Step removed')
    apiPost('workflowSteps', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Workflow Runs ----
  const addWorkflowRun = useCallback((data: AnyRecord) => {
    const id = genId('wfr')
    setWorkflowRuns(prev => [...prev, { id, org_id: 'org-1', started_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'workflow_run', id, 'Started workflow run')
    addToast('Workflow started')
    apiPost('workflowRuns', 'create', data)
  }, [logAudit, addToast])

  const updateWorkflowRun = useCallback((id: string, data: AnyRecord) => {
    setWorkflowRuns(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'workflow_run', id, 'Updated workflow run')
    apiPost('workflowRuns', 'update', data, id)
  }, [logAudit])

  // ---- Notifications ----
  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n) as typeof prev)
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })) as typeof prev)
  }, [])

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length

  // ---- CRUD: Org ----
  const updateOrg = useCallback((data: AnyRecord) => {
    setOrg(prev => ({ ...prev, ...data }))
    logAudit('update', 'organization', 'org-1', 'Updated organization settings')
    addToast('Organization settings updated')
    apiPost('organizations', 'update', data, org.id)
  }, [logAudit, addToast, org.id])

  // ---- Auth ----
  const login = useCallback(async (email: string, password: string): Promise<boolean | { requiresMFA: true; mfaToken: string }> => {
    // API auth with httpOnly cookie session
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      })
      if (res.ok) {
        const data = await res.json()
        // Check if MFA is required
        if (data.requiresMFA && data.mfaToken) {
          return { requiresMFA: true, mfaToken: data.mfaToken }
        }
        setCurrentUser(data.user)
        // Keep localStorage as client-side cache for instant hydration
        try { localStorage.setItem('tempo_current_user', JSON.stringify(data.user)) } catch { /* ignore */ }
        return true
      }
    } catch {
      // Fall back to demo credentials for offline/development
    }

    // Fallback: demo credentials for offline/development
    const cred = demoCredentials.find(c => c.email === email && c.password === password)
    if (!cred) return false
    const emp = employees.find(e => e.id === cred.employeeId)
    if (!emp) return false
    const user = buildCurrentUser(emp)
    setCurrentUser(user)
    try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
    return true
  }, [employees])

  const verifyMFA = useCallback(async (mfaToken: string, code: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'verify_mfa', mfaToken, code }),
      })
      if (res.ok) {
        const { user } = await res.json()
        setCurrentUser(user)
        try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
        return true
      }
    } catch { /* ignore */ }
    return false
  }, [])

  const logout = useCallback(async () => {
    // API logout (revokes session, clears httpOnly cookie)
    try {
      await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'logout' }),
      })
    } catch { /* ignore */ }
    setCurrentUser(null)
    try { localStorage.removeItem('tempo_current_user') } catch { /* ignore */ }
  }, [])

  const switchUser = useCallback(async (employeeId: string) => {
    // API switch user (creates new session, sets cookie)
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'switch_user', employeeId }),
      })
      if (res.ok) {
        const { user } = await res.json()
        setCurrentUser(user)
        try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
        return
      }
    } catch { /* ignore */ }
    // Fallback to local
    const emp = employees.find(e => e.id === employeeId)
    if (!emp) return
    const user = buildCurrentUser(emp)
    setCurrentUser(user)
    try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
  }, [employees])

  const currentEmployeeId = currentUser?.employee_id || 'emp-17'
  const isLoggedIn = currentUser !== null

  const value: TempoState = {
    org, user: demoUser, currentUser, currentEmployeeId, departments, employees,
    goals, reviewCycles, reviews, feedback,
    compBands, salaryReviews,
    courses, enrollments,
    surveys, engagementScores,
    mentoringPrograms, mentoringPairs,
    payrollRuns, leaveRequests,
    benefitPlans, expenseReports,
    jobPostings, applications,
    devices, softwareLicenses, itRequests,
    invoices, budgets, vendors,
    projects, milestones, tasks, taskDependencies,
    strategicObjectives, keyResults, initiatives, kpiDefinitions, kpiMeasurements,
    workflows, workflowSteps, workflowRuns, workflowTemplates,
    notifications, unreadNotificationCount,
    auditLog, toasts,
    isLoading,
    addToast, removeToast,
    addEmployee, updateEmployee, deleteEmployee,
    addGoal, updateGoal, deleteGoal,
    addReview, updateReview,
    addReviewCycle, updateReviewCycle,
    addFeedback,
    addCompBand, updateCompBand, deleteCompBand,
    addSalaryReview, updateSalaryReview,
    addCourse, updateCourse,
    addEnrollment, updateEnrollment,
    addSurvey, updateSurvey,
    addMentoringProgram, updateMentoringProgram,
    addMentoringPair, updateMentoringPair,
    addPayrollRun, updatePayrollRun,
    addLeaveRequest, updateLeaveRequest,
    addBenefitPlan, updateBenefitPlan,
    addExpenseReport, updateExpenseReport, deleteExpenseReport,
    addJobPosting, updateJobPosting,
    addApplication, updateApplication,
    addDevice, updateDevice,
    addSoftwareLicense, updateSoftwareLicense,
    addITRequest, updateITRequest,
    addInvoice, updateInvoice,
    addBudget, updateBudget,
    addVendor, updateVendor,
    addDepartment, updateDepartment,
    addProject, updateProject, deleteProject,
    addMilestone, updateMilestone,
    addTask, updateTask, deleteTask,
    addStrategicObjective, updateStrategicObjective, deleteStrategicObjective,
    addKeyResult, updateKeyResult, deleteKeyResult,
    addInitiative, updateInitiative, deleteInitiative,
    addKPIDefinition, updateKPIDefinition,
    addKPIMeasurement,
    addWorkflow, updateWorkflow, deleteWorkflow,
    addWorkflowStep, updateWorkflowStep, deleteWorkflowStep,
    addWorkflowRun, updateWorkflowRun,
    markNotificationRead, markAllNotificationsRead,
    updateOrg,
    login, verifyMFA, logout, switchUser, isLoggedIn,
    getEmployeeName, getDepartmentName,
  }

  return <TempoContext.Provider value={value}>{children}</TempoContext.Provider>
}
