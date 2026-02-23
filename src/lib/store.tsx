'use client'

import React, { createContext, useContext, useState, useCallback, useRef } from 'react'
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

  // Audit
  auditLog: AuditEntry[]

  // Toasts
  toasts: Toast[]

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

  // Org
  updateOrg: (data: AnyRecord) => void

  // Auth
  login: (email: string, password: string) => boolean
  logout: () => void
  switchUser: (employeeId: string) => void
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

// Try to restore session from localStorage
function getStoredUser(): CurrentUser | null {
  if (typeof window === 'undefined') return null
  try {
    const stored = localStorage.getItem('tempo_current_user')
    if (stored) return JSON.parse(stored)
  } catch { /* ignore */ }
  return null
}

export function TempoProvider({ children }: { children: React.ReactNode }) {
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
  const [engagementScores] = useState(demoEngagementScores)
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
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())

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
  }, [logAudit, addToast])

  const updateEmployee = useCallback((id: string, data: AnyRecord) => {
    setEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'employee', id, `Updated employee: ${getEmployeeName(id)}`)
    addToast(`Employee updated`)
  }, [logAudit, addToast, getEmployeeName])

  const deleteEmployee = useCallback((id: string) => {
    const name = getEmployeeName(id)
    setEmployees(prev => prev.filter(e => e.id !== id))
    // Cascade: remove from devices, leave requests, etc.
    setDevices(prev => prev.map(d => d.assigned_to === id ? { ...d, assigned_to: null, status: 'available' as const } : d) as typeof prev)
    setGoals(prev => prev.filter(g => g.employee_id !== id))
    setLeaveRequests(prev => prev.filter(lr => lr.employee_id !== id))
    logAudit('delete', 'employee', id, `Removed employee: ${name}`)
    addToast(`Employee ${name} removed`)
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Goals ----
  const addGoal = useCallback((data: AnyRecord) => {
    const id = genId('goal')
    setGoals(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'goal', id, `Created goal: ${data.title}`)
    addToast('Goal created')
  }, [logAudit, addToast])

  const updateGoal = useCallback((id: string, data: AnyRecord) => {
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev)
    logAudit('update', 'goal', id, `Updated goal`)
    addToast('Goal updated')
  }, [logAudit, addToast])

  const deleteGoal = useCallback((id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id))
    logAudit('delete', 'goal', id, 'Deleted goal')
    addToast('Goal deleted')
  }, [logAudit, addToast])

  // ---- CRUD: Reviews ----
  const addReview = useCallback((data: AnyRecord) => {
    const id = genId('rev')
    setReviews(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'review', id, `Created review`)
    addToast('Review created')
  }, [logAudit, addToast])

  const updateReview = useCallback((id: string, data: AnyRecord) => {
    setReviews(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'review', id, `Updated review`)
    addToast('Review updated')
  }, [logAudit, addToast])

  // ---- CRUD: Review Cycles ----
  const addReviewCycle = useCallback((data: AnyRecord) => {
    const id = genId('cycle')
    setReviewCycles(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'review_cycle', id, `Created review cycle: ${data.title}`)
    addToast('Review cycle created')
  }, [logAudit, addToast])

  const updateReviewCycle = useCallback((id: string, data: AnyRecord) => {
    setReviewCycles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'review_cycle', id, 'Updated review cycle')
    addToast('Review cycle updated')
  }, [logAudit, addToast])

  // ---- CRUD: Feedback ----
  const addFeedback = useCallback((data: AnyRecord) => {
    const id = genId('fb')
    setFeedback(prev => [{ id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }, ...prev] as typeof prev)
    logAudit('create', 'feedback', id, `Gave feedback to ${getEmployeeName(data.to_id)}`)
    addToast('Feedback sent')
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Comp Bands ----
  const addCompBand = useCallback((data: AnyRecord) => {
    const id = genId('band')
    setCompBands(prev => [...prev, { id, org_id: 'org-1', ...data }] as typeof prev)
    logAudit('create', 'comp_band', id, `Created comp band: ${data.role_title}`)
    addToast('Compensation band created')
  }, [logAudit, addToast])

  const updateCompBand = useCallback((id: string, data: AnyRecord) => {
    setCompBands(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'comp_band', id, 'Updated comp band')
    addToast('Compensation band updated')
  }, [logAudit, addToast])

  const deleteCompBand = useCallback((id: string) => {
    setCompBands(prev => prev.filter(b => b.id !== id))
    logAudit('delete', 'comp_band', id, 'Deleted comp band')
    addToast('Compensation band deleted')
  }, [logAudit, addToast])

  // ---- CRUD: Salary Reviews ----
  const addSalaryReview = useCallback((data: AnyRecord) => {
    const id = genId('sr')
    setSalaryReviews(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'salary_review', id, `Proposed salary review for ${getEmployeeName(data.employee_id)}`)
    addToast('Salary review submitted')
  }, [logAudit, addToast, getEmployeeName])

  const updateSalaryReview = useCallback((id: string, data: AnyRecord) => {
    setSalaryReviews(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'
    logAudit('update', 'salary_review', id, `${action} salary review`)
    addToast(`Salary review ${action.toLowerCase()}`)
  }, [logAudit, addToast])

  // ---- CRUD: Courses ----
  const addCourse = useCallback((data: AnyRecord) => {
    const id = genId('course')
    setCourses(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'course', id, `Created course: ${data.title}`)
    addToast('Course created')
  }, [logAudit, addToast])

  const updateCourse = useCallback((id: string, data: AnyRecord) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'course', id, 'Updated course')
    addToast('Course updated')
  }, [logAudit, addToast])

  // ---- CRUD: Enrollments ----
  const addEnrollment = useCallback((data: AnyRecord) => {
    const id = genId('enr')
    setEnrollments(prev => [...prev, { id, org_id: 'org-1', enrolled_at: new Date().toISOString(), completed_at: null, ...data }] as typeof prev)
    logAudit('create', 'enrollment', id, `Enrolled in course`)
    addToast('Enrolled in course')
  }, [logAudit, addToast])

  const updateEnrollment = useCallback((id: string, data: AnyRecord) => {
    setEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'enrollment', id, 'Updated enrollment')
    addToast('Enrollment updated')
  }, [logAudit, addToast])

  // ---- CRUD: Surveys ----
  const addSurvey = useCallback((data: AnyRecord) => {
    const id = genId('survey')
    setSurveys(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'survey', id, `Created survey: ${data.title}`)
    addToast('Survey created')
  }, [logAudit, addToast])

  const updateSurvey = useCallback((id: string, data: AnyRecord) => {
    setSurveys(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'survey', id, 'Updated survey')
    addToast('Survey updated')
  }, [logAudit, addToast])

  // ---- CRUD: Mentoring ----
  const addMentoringProgram = useCallback((data: AnyRecord) => {
    const id = genId('mp')
    setMentoringPrograms(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mentoring_program', id, `Created program: ${data.title}`)
    addToast('Mentoring program created')
  }, [logAudit, addToast])

  const updateMentoringProgram = useCallback((id: string, data: AnyRecord) => {
    setMentoringPrograms(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'mentoring_program', id, 'Updated mentoring program')
    addToast('Mentoring program updated')
  }, [logAudit, addToast])

  const addMentoringPair = useCallback((data: AnyRecord) => {
    const id = genId('pair')
    setMentoringPairs(prev => [...prev, { id, org_id: 'org-1', started_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mentoring_pair', id, `Matched ${getEmployeeName(data.mentor_id)} with ${getEmployeeName(data.mentee_id)}`)
    addToast('Mentoring pair matched')
  }, [logAudit, addToast, getEmployeeName])

  const updateMentoringPair = useCallback((id: string, data: AnyRecord) => {
    setMentoringPairs(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'mentoring_pair', id, 'Updated mentoring pair')
    addToast('Mentoring pair updated')
  }, [logAudit, addToast])

  // ---- CRUD: Payroll ----
  const addPayrollRun = useCallback((data: AnyRecord) => {
    const id = genId('pr')
    setPayrollRuns(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'payroll_run', id, `Created pay run: ${data.period}`)
    addToast('Payroll run created')
  }, [logAudit, addToast])

  const updatePayrollRun = useCallback((id: string, data: AnyRecord) => {
    setPayrollRuns(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'payroll_run', id, 'Updated payroll run')
    addToast('Payroll run updated')
  }, [logAudit, addToast])

  // ---- CRUD: Leave Requests ----
  const addLeaveRequest = useCallback((data: AnyRecord) => {
    const id = genId('lr')
    setLeaveRequests(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'leave_request', id, `Submitted leave request`)
    addToast('Leave request submitted')
  }, [logAudit, addToast])

  const updateLeaveRequest = useCallback((id: string, data: AnyRecord) => {
    setLeaveRequests(prev => prev.map(lr => lr.id === id ? { ...lr, ...data } : lr) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'
    logAudit('update', 'leave_request', id, `${action} leave request`)
    addToast(`Leave request ${action.toLowerCase()}`)
  }, [logAudit, addToast])

  // ---- CRUD: Benefits ----
  const addBenefitPlan = useCallback((data: AnyRecord) => {
    const id = genId('bp')
    setBenefitPlans(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'benefit_plan', id, `Created benefit plan: ${data.name}`)
    addToast('Benefit plan created')
  }, [logAudit, addToast])

  const updateBenefitPlan = useCallback((id: string, data: AnyRecord) => {
    setBenefitPlans(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'benefit_plan', id, 'Updated benefit plan')
    addToast('Benefit plan updated')
  }, [logAudit, addToast])

  // ---- CRUD: Expenses ----
  const addExpenseReport = useCallback((data: AnyRecord) => {
    const id = genId('exp')
    setExpenseReports(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'expense_report', id, `Created expense: ${data.title}`)
    addToast('Expense report created')
  }, [logAudit, addToast])

  const updateExpenseReport = useCallback((id: string, data: AnyRecord) => {
    setExpenseReports(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    const action = data.status === 'approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : data.status === 'reimbursed' ? 'Reimbursed' : 'Updated'
    logAudit('update', 'expense_report', id, `${action} expense report`)
    addToast(`Expense report ${action.toLowerCase()}`)
  }, [logAudit, addToast])

  const deleteExpenseReport = useCallback((id: string) => {
    setExpenseReports(prev => prev.filter(e => e.id !== id))
    logAudit('delete', 'expense_report', id, 'Deleted expense report')
    addToast('Expense report deleted')
  }, [logAudit, addToast])

  // ---- CRUD: Recruiting ----
  const addJobPosting = useCallback((data: AnyRecord) => {
    const id = genId('job')
    setJobPostings(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), application_count: 0, ...data }] as typeof prev)
    logAudit('create', 'job_posting', id, `Created job posting: ${data.title}`)
    addToast('Job posting created')
  }, [logAudit, addToast])

  const updateJobPosting = useCallback((id: string, data: AnyRecord) => {
    setJobPostings(prev => prev.map(j => j.id === id ? { ...j, ...data } : j) as typeof prev)
    logAudit('update', 'job_posting', id, 'Updated job posting')
    addToast('Job posting updated')
  }, [logAudit, addToast])

  const addApplication = useCallback((data: AnyRecord) => {
    const id = genId('app')
    setApplications(prev => [...prev, { id, org_id: 'org-1', applied_at: new Date().toISOString(), ...data }] as typeof prev)
    // Increment application count on job
    if (data.job_id) {
      setJobPostings(prev => prev.map(j => j.id === data.job_id ? { ...j, application_count: (j.application_count || 0) + 1 } : j))
    }
    logAudit('create', 'application', id, `New application from ${data.candidate_name}`)
    addToast('Application added')
  }, [logAudit, addToast])

  const updateApplication = useCallback((id: string, data: AnyRecord) => {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'application', id, `Updated application status to ${data.status || data.stage || 'updated'}`)
    addToast('Application updated')
  }, [logAudit, addToast])

  // ---- CRUD: IT ----
  const addDevice = useCallback((data: AnyRecord) => {
    const id = genId('dev')
    setDevices(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'device', id, `Added device: ${data.brand} ${data.model}`)
    addToast('Device added')
  }, [logAudit, addToast])

  const updateDevice = useCallback((id: string, data: AnyRecord) => {
    setDevices(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'device', id, 'Updated device')
    addToast('Device updated')
  }, [logAudit, addToast])

  const addSoftwareLicense = useCallback((data: AnyRecord) => {
    const id = genId('sl')
    setSoftwareLicenses(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'software_license', id, `Added license: ${data.name}`)
    addToast('Software license added')
  }, [logAudit, addToast])

  const updateSoftwareLicense = useCallback((id: string, data: AnyRecord) => {
    setSoftwareLicenses(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'software_license', id, 'Updated software license')
    addToast('Software license updated')
  }, [logAudit, addToast])

  const addITRequest = useCallback((data: AnyRecord) => {
    const id = genId('itr')
    setITRequests(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'it_request', id, `Created IT request: ${data.title}`)
    addToast('IT request submitted')
  }, [logAudit, addToast])

  const updateITRequest = useCallback((id: string, data: AnyRecord) => {
    setITRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'it_request', id, 'Updated IT request')
    addToast('IT request updated')
  }, [logAudit, addToast])

  // ---- CRUD: Finance ----
  const addInvoice = useCallback((data: AnyRecord) => {
    const id = genId('inv')
    setInvoices(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'invoice', id, `Created invoice: ${data.invoice_number}`)
    addToast('Invoice created')
  }, [logAudit, addToast])

  const updateInvoice = useCallback((id: string, data: AnyRecord) => {
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'invoice', id, 'Updated invoice')
    addToast('Invoice updated')
  }, [logAudit, addToast])

  const addBudget = useCallback((data: AnyRecord) => {
    const id = genId('bud')
    setBudgets(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'budget', id, `Created budget: ${data.name}`)
    addToast('Budget created')
  }, [logAudit, addToast])

  const updateBudget = useCallback((id: string, data: AnyRecord) => {
    setBudgets(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'budget', id, 'Updated budget')
    addToast('Budget updated')
  }, [logAudit, addToast])

  const addVendor = useCallback((data: AnyRecord) => {
    const id = genId('vnd')
    setVendors(prev => [...prev, { id, org_id: 'org-1', created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'vendor', id, `Added vendor: ${data.name}`)
    addToast('Vendor added')
  }, [logAudit, addToast])

  const updateVendor = useCallback((id: string, data: AnyRecord) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...data } : v) as typeof prev)
    logAudit('update', 'vendor', id, 'Updated vendor')
    addToast('Vendor updated')
  }, [logAudit, addToast])

  // ---- CRUD: Departments ----
  const addDepartment = useCallback((data: AnyRecord) => {
    const id = genId('dept')
    setDepartments(prev => [...prev, { id, org_id: 'org-1', ...data }] as typeof prev)
    logAudit('create', 'department', id, `Created department: ${data.name}`)
    addToast('Department created')
  }, [logAudit, addToast])

  const updateDepartment = useCallback((id: string, data: AnyRecord) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'department', id, 'Updated department')
    addToast('Department updated')
  }, [logAudit, addToast])

  // ---- CRUD: Org ----
  const updateOrg = useCallback((data: AnyRecord) => {
    setOrg(prev => ({ ...prev, ...data }))
    logAudit('update', 'organization', 'org-1', 'Updated organization settings')
    addToast('Organization settings updated')
  }, [logAudit, addToast])

  // ---- Auth ----
  const login = useCallback((email: string, password: string): boolean => {
    const cred = demoCredentials.find(c => c.email === email && c.password === password)
    if (!cred) return false
    const emp = employees.find(e => e.id === cred.employeeId)
    if (!emp) return false
    const user = buildCurrentUser(emp)
    setCurrentUser(user)
    try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
    return true
  }, [employees])

  const logout = useCallback(() => {
    setCurrentUser(null)
    try { localStorage.removeItem('tempo_current_user') } catch { /* ignore */ }
  }, [])

  const switchUser = useCallback((employeeId: string) => {
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
    auditLog, toasts,
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
    updateOrg,
    login, logout, switchUser, isLoggedIn,
    getEmployeeName, getDepartmentName,
  }

  return <TempoContext.Provider value={value}>{children}</TempoContext.Provider>
}
