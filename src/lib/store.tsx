'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import {
  demoOrg, demoUser, demoDepartments, demoEmployees,
  demoGoals, demoReviewCycles, demoReviews, demoFeedback,
  demoCompBands, demoSalaryReviews, demoEquityGrants, demoCompPlanningCycles,
  demoCourses, demoEnrollments,
  demoSurveys, demoEngagementScores, demoActionPlans, demoSurveyResponses,
  demoMentoringPrograms, demoMentoringPairs, demoMentoringSessions, demoMentoringGoals,
  demoPayrollRuns, demoLeaveRequests,
  demoBenefitPlans, demoBenefitEnrollments, demoBenefitDependents, demoLifeEvents, demoExpenseReports, demoExpensePolicies, demoMileageLogs,
  demoJobPostings, demoApplications, demoInterviews, demoTalentPools, demoScoreCards,
  demoDevices, demoSoftwareLicenses, demoITRequests,
  demoInvoices, demoBudgets, demoVendors,
  demoProjects, demoMilestones, demoTasks, demoTaskDependencies,
  demoStrategicObjectives, demoKeyResults, demoInitiatives, demoKPIDefinitions, demoKPIMeasurements,
  demoWorkflows, demoWorkflowSteps, demoWorkflowRuns, demoWorkflowTemplates,
  demoNotifications,
  demoLearningPaths, demoLiveSessions, demoCourseBlocks, demoQuizQuestions, demoDiscussions, demoStudyGroups, demoCareerSiteConfig, demoJobDistributions,
  demoEmployeePayrollEntries, demoContractorPayments, demoPayrollSchedules, demoTaxConfigs, demoComplianceIssues, demoTaxFilings,
  demoEmployeeDocuments, demoEmployeeTimeline,
  demoOneOnOnes, demoRecognitions, demoCompetencyFramework, demoCompetencyRatings,
  demoBuddyAssignments, demoPreboardingTasks, demoWelcomeContent,
  demoAutomationRules, demoAutomationLog,
  demoOffers, demoCareerTracks, demoMarketBenchmarks, demoWidgetPreferences, demoJourneys,
  getDemoDataForOrg, allDemoCredentials,
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
  oneOnOnes: WidenArray<typeof demoOneOnOnes>
  recognitions: WidenArray<typeof demoRecognitions>
  competencyFramework: typeof demoCompetencyFramework
  competencyRatings: WidenArray<typeof demoCompetencyRatings>

  // Compensation
  compBands: typeof demoCompBands
  salaryReviews: WidenArray<typeof demoSalaryReviews>
  equityGrants: WidenArray<typeof demoEquityGrants>
  compPlanningCycles: WidenArray<typeof demoCompPlanningCycles>

  // Learning
  courses: typeof demoCourses
  enrollments: WidenArray<typeof demoEnrollments>
  learningPaths: WidenArray<typeof demoLearningPaths>
  liveSessions: WidenArray<typeof demoLiveSessions>
  courseBlocks: WidenArray<typeof demoCourseBlocks>
  quizQuestions: WidenArray<typeof demoQuizQuestions>
  discussions: WidenArray<typeof demoDiscussions>
  studyGroups: WidenArray<typeof demoStudyGroups>

  // Engagement
  surveys: WidenArray<typeof demoSurveys>
  engagementScores: typeof demoEngagementScores
  actionPlans: WidenArray<typeof demoActionPlans>
  surveyResponses: WidenArray<typeof demoSurveyResponses>

  // Mentoring
  mentoringPrograms: WidenArray<typeof demoMentoringPrograms>
  mentoringPairs: WidenArray<typeof demoMentoringPairs>
  mentoringSessions: WidenArray<typeof demoMentoringSessions>
  mentoringGoals: WidenArray<typeof demoMentoringGoals>

  // Payroll
  payrollRuns: WidenArray<typeof demoPayrollRuns>
  employeePayrollEntries: WidenArray<typeof demoEmployeePayrollEntries>
  contractorPayments: WidenArray<typeof demoContractorPayments>
  payrollSchedules: WidenArray<typeof demoPayrollSchedules>
  taxConfigs: WidenArray<typeof demoTaxConfigs>
  complianceIssues: WidenArray<typeof demoComplianceIssues>
  taxFilings: WidenArray<typeof demoTaxFilings>

  // Time
  leaveRequests: WidenArray<typeof demoLeaveRequests>

  // Benefits
  benefitPlans: WidenArray<typeof demoBenefitPlans>
  benefitEnrollments: WidenArray<typeof demoBenefitEnrollments>
  benefitDependents: WidenArray<typeof demoBenefitDependents>
  lifeEvents: WidenArray<typeof demoLifeEvents>

  // Expense
  expenseReports: WidenArray<typeof demoExpenseReports>
  expensePolicies: WidenArray<typeof demoExpensePolicies>
  mileageLogs: WidenArray<typeof demoMileageLogs>

  // Recruiting
  jobPostings: WidenArray<typeof demoJobPostings>
  applications: WidenArray<typeof demoApplications>
  careerSiteConfig: typeof demoCareerSiteConfig
  jobDistributions: WidenArray<typeof demoJobDistributions>
  interviews: WidenArray<typeof demoInterviews>
  talentPools: WidenArray<typeof demoTalentPools>
  scoreCards: WidenArray<typeof demoScoreCards>

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
  automationRules: WidenArray<typeof demoAutomationRules>
  automationLog: WidenArray<typeof demoAutomationLog>

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

  // People / HR
  employeeDocuments: WidenArray<typeof demoEmployeeDocuments>
  employeeTimeline: WidenArray<typeof demoEmployeeTimeline>

  // Onboarding
  buddyAssignments: WidenArray<typeof demoBuddyAssignments>
  preboardingTasks: WidenArray<typeof demoPreboardingTasks>
  welcomeContent: typeof demoWelcomeContent

  // Offers
  offers: WidenArray<typeof demoOffers>

  // Career Tracks
  careerTracks: typeof demoCareerTracks

  // Market Benchmarks
  marketBenchmarks: WidenArray<typeof demoMarketBenchmarks>

  // Guided Journeys
  journeys: import('@/lib/demo-data').Journey[]

  // Widget Preferences
  widgetPreferences: typeof demoWidgetPreferences

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
  bulkAddEmployees: (data: AnyRecord[]) => string[]
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

  // 1:1 Meetings
  addOneOnOne: (data: AnyRecord) => void
  updateOneOnOne: (id: string, data: AnyRecord) => void

  // Recognitions
  addRecognition: (data: AnyRecord) => void

  // Competency Ratings
  addCompetencyRating: (data: AnyRecord) => void
  updateCompetencyRating: (id: string, data: AnyRecord) => void

  // Comp Bands
  addCompBand: (data: AnyRecord) => void
  updateCompBand: (id: string, data: AnyRecord) => void
  deleteCompBand: (id: string) => void

  // Salary Reviews
  addSalaryReview: (data: AnyRecord) => void
  updateSalaryReview: (id: string, data: AnyRecord) => void

  // Equity Grants
  addEquityGrant: (data: AnyRecord) => void
  updateEquityGrant: (id: string, data: AnyRecord) => void

  // Comp Planning Cycles
  addCompPlanningCycle: (data: AnyRecord) => void
  updateCompPlanningCycle: (id: string, data: AnyRecord) => void

  // Courses
  addCourse: (data: AnyRecord) => void
  updateCourse: (id: string, data: AnyRecord) => void

  // Enrollments
  addEnrollment: (data: AnyRecord) => void
  updateEnrollment: (id: string, data: AnyRecord) => void

  // Learning Paths
  addLearningPath: (data: AnyRecord) => void
  updateLearningPath: (id: string, data: AnyRecord) => void
  deleteLearningPath: (id: string) => void

  // Live Sessions
  addLiveSession: (data: AnyRecord) => void
  updateLiveSession: (id: string, data: AnyRecord) => void

  // Course Blocks
  addCourseBlock: (data: AnyRecord) => void
  updateCourseBlock: (id: string, data: AnyRecord) => void
  deleteCourseBlock: (id: string) => void

  // Quiz Questions
  addQuizQuestion: (data: AnyRecord) => void
  updateQuizQuestion: (id: string, data: AnyRecord) => void
  deleteQuizQuestion: (id: string) => void

  // Discussions
  addDiscussion: (data: AnyRecord) => void
  updateDiscussion: (id: string, data: AnyRecord) => void

  // Study Groups
  addStudyGroup: (data: AnyRecord) => void
  updateStudyGroup: (id: string, data: AnyRecord) => void

  // Surveys
  addSurvey: (data: AnyRecord) => void
  updateSurvey: (id: string, data: AnyRecord) => void

  // Action Plans
  addActionPlan: (data: AnyRecord) => void
  updateActionPlan: (id: string, data: AnyRecord) => void

  // Mentoring Programs
  addMentoringProgram: (data: AnyRecord) => void
  updateMentoringProgram: (id: string, data: AnyRecord) => void

  // Mentoring Pairs
  addMentoringPair: (data: AnyRecord) => void
  updateMentoringPair: (id: string, data: AnyRecord) => void

  // Mentoring Sessions
  addMentoringSession: (data: AnyRecord) => void
  updateMentoringSession: (id: string, data: AnyRecord) => void

  // Mentoring Goals
  addMentoringGoal: (data: AnyRecord) => void
  updateMentoringGoal: (id: string, data: AnyRecord) => void

  // Payroll
  addPayrollRun: (data: AnyRecord) => void
  updatePayrollRun: (id: string, data: AnyRecord) => void
  addContractorPayment: (data: AnyRecord) => void
  updateContractorPayment: (id: string, data: AnyRecord) => void
  addPayrollSchedule: (data: AnyRecord) => void
  updatePayrollSchedule: (id: string, data: AnyRecord) => void
  addTaxConfig: (data: AnyRecord) => void
  updateTaxConfig: (id: string, data: AnyRecord) => void
  resolveComplianceIssue: (id: string) => void
  updateTaxFiling: (id: string, data: AnyRecord) => void
  addEmployeePayrollEntry: (data: AnyRecord) => void

  // Leave Requests
  addLeaveRequest: (data: AnyRecord) => void
  updateLeaveRequest: (id: string, data: AnyRecord) => void

  // Benefit Plans
  addBenefitPlan: (data: AnyRecord) => void
  updateBenefitPlan: (id: string, data: AnyRecord) => void

  // Benefit Enrollments
  addBenefitEnrollment: (data: AnyRecord) => void
  updateBenefitEnrollment: (id: string, data: AnyRecord) => void

  // Benefit Dependents
  addBenefitDependent: (data: AnyRecord) => void
  updateBenefitDependent: (id: string, data: AnyRecord) => void

  // Life Events
  addLifeEvent: (data: AnyRecord) => void
  updateLifeEvent: (id: string, data: AnyRecord) => void

  // Expense Reports
  addExpenseReport: (data: AnyRecord) => void
  updateExpenseReport: (id: string, data: AnyRecord) => void
  deleteExpenseReport: (id: string) => void

  // Expense Policies
  addExpensePolicy: (data: AnyRecord) => void
  updateExpensePolicy: (id: string, data: AnyRecord) => void

  // Mileage Logs
  addMileageLog: (data: AnyRecord) => void
  updateMileageLog: (id: string, data: AnyRecord) => void

  // Job Postings
  addJobPosting: (data: AnyRecord) => void
  updateJobPosting: (id: string, data: AnyRecord) => void

  // Applications
  addApplication: (data: AnyRecord) => void
  updateApplication: (id: string, data: AnyRecord) => void

  // Career Site
  updateCareerSiteConfig: (data: AnyRecord) => void

  // Job Distributions
  addJobDistribution: (data: AnyRecord) => void
  updateJobDistribution: (id: string, data: AnyRecord) => void

  // Interviews
  addInterview: (data: AnyRecord) => void
  updateInterview: (id: string, data: AnyRecord) => void

  // Talent Pools
  addTalentPool: (data: AnyRecord) => void
  updateTalentPool: (id: string, data: AnyRecord) => void

  // Score Cards
  addScoreCard: (data: AnyRecord) => void
  updateScoreCard: (id: string, data: AnyRecord) => void

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

  // Automation Rules
  addAutomationRule: (data: AnyRecord) => void
  updateAutomationRule: (id: string, data: AnyRecord) => void
  toggleAutomationRule: (id: string) => void

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

  // Employee Documents
  addEmployeeDocument: (data: AnyRecord) => void
  updateEmployeeDocument: (id: string, data: AnyRecord) => void

  // Onboarding
  addBuddyAssignment: (data: AnyRecord) => void
  updateBuddyAssignment: (id: string, data: AnyRecord) => void
  addPreboardingTask: (data: AnyRecord) => void
  updatePreboardingTask: (id: string, data: AnyRecord) => void

  // Offers
  addOffer: (data: AnyRecord) => void
  updateOffer: (id: string, data: AnyRecord) => void

  // Journeys
  updateJourneyStep: (journeyId: string, stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => void

  // Widget Preferences
  updateWidgetPreferences: (data: AnyRecord) => void

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

/** Like useTempo but returns null instead of throwing when outside TempoProvider */
export function useTempoSafe(): TempoState | null {
  return useContext(TempoContext)
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
// Returns { user, apiDown } so the caller can decide whether to fall back to localStorage
async function fetchSessionUser(): Promise<{ user: CurrentUser | null; apiDown: boolean }> {
  try {
    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'me' }),
    })
    if (res.ok) {
      const { user } = await res.json()
      return { user: user || null, apiDown: false }
    }
    // 401 means session is explicitly invalid (not an API error)
    if (res.status === 401) {
      return { user: null, apiDown: false }
    }
    // 5xx or other errors mean the API is down
    return { user: null, apiDown: true }
  } catch {
    // Network error = API is down
    return { user: null, apiDown: true }
  }
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
      // 401/500 are expected in demo mode (no org context / no DB) — don't spam console
      // The store uses optimistic updates so the UI works regardless
      if (res.status !== 401 && res.status !== 500) {
        const err = await res.json().catch(() => ({}))
        console.error(`API ${action} ${entity} failed:`, err)
      }
    }
    return res
  } catch (err) {
    // Network errors are expected when DB is unavailable in demo mode
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
  const [oneOnOnes, setOneOnOnes] = useState(demoOneOnOnes)
  const [recognitions, setRecognitions] = useState(demoRecognitions)
  const [competencyFramework] = useState(demoCompetencyFramework)
  const [competencyRatings, setCompetencyRatings] = useState(demoCompetencyRatings)
  const [compBands, setCompBands] = useState(demoCompBands)
  const [salaryReviews, setSalaryReviews] = useState(demoSalaryReviews)
  const [equityGrants, setEquityGrants] = useState(demoEquityGrants)
  const [compPlanningCycles, setCompPlanningCycles] = useState(demoCompPlanningCycles)
  const [courses, setCourses] = useState(demoCourses)
  const [enrollments, setEnrollments] = useState(demoEnrollments)
  const [learningPaths, setLearningPaths] = useState(demoLearningPaths)
  const [liveSessions, setLiveSessions] = useState(demoLiveSessions)
  const [courseBlocks, setCourseBlocks] = useState(demoCourseBlocks)
  const [quizQuestions, setQuizQuestions] = useState(demoQuizQuestions)
  const [discussions, setDiscussions] = useState(demoDiscussions)
  const [studyGroups, setStudyGroups] = useState(demoStudyGroups)
  const [surveys, setSurveys] = useState(demoSurveys)
  const [engagementScores, setEngagementScores] = useState(demoEngagementScores)
  const [actionPlans, setActionPlans] = useState(demoActionPlans)
  const [surveyResponses, setSurveyResponses] = useState(demoSurveyResponses)
  const [mentoringPrograms, setMentoringPrograms] = useState(demoMentoringPrograms)
  const [mentoringPairs, setMentoringPairs] = useState(demoMentoringPairs)
  const [mentoringSessions, setMentoringSessions] = useState(demoMentoringSessions)
  const [mentoringGoals, setMentoringGoals] = useState(demoMentoringGoals)
  const [payrollRuns, setPayrollRuns] = useState(demoPayrollRuns)
  const [employeePayrollEntries, setEmployeePayrollEntries] = useState(demoEmployeePayrollEntries)
  const [contractorPayments, setContractorPayments] = useState(demoContractorPayments)
  const [payrollSchedules, setPayrollSchedules] = useState(demoPayrollSchedules)
  const [taxConfigs, setTaxConfigs] = useState(demoTaxConfigs)
  const [complianceIssues, setComplianceIssues] = useState(demoComplianceIssues)
  const [taxFilings, setTaxFilings] = useState(demoTaxFilings)
  const [leaveRequests, setLeaveRequests] = useState(demoLeaveRequests)
  const [benefitPlans, setBenefitPlans] = useState(demoBenefitPlans)
  const [benefitEnrollments, setBenefitEnrollments] = useState(demoBenefitEnrollments)
  const [benefitDependents, setBenefitDependents] = useState(demoBenefitDependents)
  const [lifeEvents, setLifeEvents] = useState(demoLifeEvents)
  const [expenseReports, setExpenseReports] = useState(demoExpenseReports)
  const [expensePolicies, setExpensePolicies] = useState(demoExpensePolicies)
  const [mileageLogs, setMileageLogs] = useState(demoMileageLogs)
  const [jobPostings, setJobPostings] = useState(demoJobPostings)
  const [applications, setApplications] = useState(demoApplications)
  const [careerSiteConfig, setCareerSiteConfig] = useState(demoCareerSiteConfig)
  const [jobDistributions, setJobDistributions] = useState(demoJobDistributions)
  const [interviews, setInterviews] = useState(demoInterviews)
  const [talentPools, setTalentPools] = useState(demoTalentPools)
  const [scoreCards, setScoreCards] = useState(demoScoreCards)
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
  const [automationRules, setAutomationRules] = useState(demoAutomationRules)
  const [automationLog, setAutomationLog] = useState(demoAutomationLog)
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
  // People / HR
  const [employeeDocuments, setEmployeeDocuments] = useState(demoEmployeeDocuments)
  const [employeeTimeline, setEmployeeTimeline] = useState(demoEmployeeTimeline)
  // Onboarding
  const [buddyAssignments, setBuddyAssignments] = useState(demoBuddyAssignments)
  const [preboardingTasks, setPreboardingTasks] = useState(demoPreboardingTasks)
  const [welcomeContent] = useState(demoWelcomeContent)
  // Notifications
  const [notifications, setNotifications] = useState(demoNotifications)
  // Offers, Career Tracks, Market Benchmarks, Widget Preferences
  const [offers, setOffers] = useState(demoOffers)
  const [careerTracks] = useState(demoCareerTracks)
  const [marketBenchmarks, setMarketBenchmarks] = useState(demoMarketBenchmarks)
  const [widgetPreferences, setWidgetPreferences] = useState(demoWidgetPreferences)
  const [journeys, setJourneys] = useState(demoJourneys)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const hasFetched = useRef(false)
  // Track current org ID for CRUD operations without causing re-renders
  const orgIdRef = useRef(org.id)
  useEffect(() => { orgIdRef.current = org.id }, [org.id])

  // Load all demo data for a specific org (used when switching between demo tenants)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadDemoData = useCallback((orgId: string) => {
    const data = getDemoDataForOrg(orgId)
    // Use type assertions to handle narrowed literal type differences between orgs
    /* eslint-disable @typescript-eslint/no-explicit-any */
    setOrg(data.org as any)
    setDepartments(data.departments as any)
    setEmployees(data.employees as any)
    setGoals(data.goals as any)
    setReviewCycles(data.reviewCycles as any)
    setReviews(data.reviews as any)
    setFeedback(data.feedback as any)
    setCompBands(data.compBands as any)
    setSalaryReviews(data.salaryReviews as any)
    setEquityGrants(data.equityGrants as any)
    setCompPlanningCycles(data.compPlanningCycles as any)
    setCourses(data.courses as any)
    setEnrollments(data.enrollments as any)
    setLearningPaths(data.learningPaths as any)
    setLiveSessions(data.liveSessions as any)
    if ((data as any).courseBlocks) setCourseBlocks((data as any).courseBlocks)
    if ((data as any).quizQuestions) setQuizQuestions((data as any).quizQuestions)
    if ((data as any).discussions) setDiscussions((data as any).discussions)
    if ((data as any).studyGroups) setStudyGroups((data as any).studyGroups)
    setSurveys(data.surveys as any)
    setEngagementScores(data.engagementScores as any)
    setActionPlans(data.actionPlans as any)
    setSurveyResponses(data.surveyResponses as any)
    setMentoringPrograms(data.mentoringPrograms as any)
    setMentoringPairs(data.mentoringPairs as any)
    if ((data as any).mentoringSessions) setMentoringSessions((data as any).mentoringSessions)
    if ((data as any).mentoringGoals) setMentoringGoals((data as any).mentoringGoals)
    setPayrollRuns(data.payrollRuns as any)
    setEmployeePayrollEntries(data.employeePayrollEntries as any)
    setContractorPayments(data.contractorPayments as any)
    setPayrollSchedules(data.payrollSchedules as any)
    setTaxConfigs(data.taxConfigs as any)
    setComplianceIssues(data.complianceIssues as any)
    setTaxFilings(data.taxFilings as any)
    setLeaveRequests(data.leaveRequests as any)
    setBenefitPlans(data.benefitPlans as any)
    setBenefitEnrollments(data.benefitEnrollments as any)
    setBenefitDependents(data.benefitDependents as any)
    setLifeEvents(data.lifeEvents as any)
    setExpenseReports(data.expenseReports as any)
    if (data.expensePolicies) setExpensePolicies(data.expensePolicies as any)
    if (data.mileageLogs) setMileageLogs(data.mileageLogs as any)
    setJobPostings(data.jobPostings as any)
    setApplications(data.applications as any)
    setCareerSiteConfig(data.careerSiteConfig as any)
    setJobDistributions(data.jobDistributions as any)
    if ((data as any).interviews) setInterviews((data as any).interviews)
    if ((data as any).talentPools) setTalentPools((data as any).talentPools)
    if ((data as any).scoreCards) setScoreCards((data as any).scoreCards)
    setDevices(data.devices as any)
    setSoftwareLicenses(data.softwareLicenses as any)
    setITRequests(data.itRequests as any)
    setInvoices(data.invoices as any)
    setBudgets(data.budgets as any)
    setVendors(data.vendors as any)
    setProjects(data.projects as any)
    setMilestones(data.milestones as any)
    setTasks(data.tasks as any)
    setTaskDependencies(data.taskDependencies as any)
    setStrategicObjectives(data.strategicObjectives as any)
    setKeyResults(data.keyResults as any)
    setInitiatives(data.initiatives as any)
    setKPIDefinitions(data.kpiDefinitions as any)
    setKPIMeasurements(data.kpiMeasurements as any)
    setWorkflows(data.workflows as any)
    setWorkflowSteps(data.workflowSteps as any)
    setWorkflowRuns(data.workflowRuns as any)
    setWorkflowTemplates(data.workflowTemplates as any)
    setNotifications(data.notifications as any)
    if (data.employeeDocuments) setEmployeeDocuments(data.employeeDocuments as any)
    if (data.employeeTimeline) setEmployeeTimeline(data.employeeTimeline as any)
    /* eslint-enable @typescript-eslint/no-explicit-any */
    setAuditLog([])
    try { localStorage.setItem('tempo_current_org', orgId) } catch { /* ignore */ }
  }, [])

  // ---- Validate session and fetch data on mount ----
  useEffect(() => {
    if (hasFetched.current) return
    hasFetched.current = true

    async function initSession() {
      try {
        // Step 1: Validate session with server (cookie-based)
        const { user: sessionUser, apiDown } = await fetchSessionUser()
        let isDemoUser = false
        if (sessionUser) {
          // Load correct org's demo data if this is a demo user
          // Detect demo users by employee ID prefix (emp- for Ecobank, kemp- for Kash & Co)
          const sessEmpId = sessionUser.employee_id || ''
          isDemoUser = sessEmpId.startsWith('emp-') || sessEmpId.startsWith('kemp-')
          if (isDemoUser) {
            const sessOrgId = sessEmpId.startsWith('kemp-') ? 'org-2' : 'org-1'
            loadDemoData(sessOrgId)
          }
          setCurrentUser(sessionUser)
          try { localStorage.setItem('tempo_current_user', JSON.stringify(sessionUser)) } catch { /* ignore */ }
        } else if (apiDown) {
          // API is down (503/network error) — use localStorage cache as fallback
          // This prevents redirect loops when Vercel functions are temporarily unavailable
          const cachedUser = getStoredUser()
          if (cachedUser) {
            console.warn('API unavailable, using cached session')
            setCurrentUser(cachedUser)
            // Load correct org's demo data based on cached user's employee ID
            const cachedEmpId = cachedUser.employee_id || ''
            isDemoUser = cachedEmpId.startsWith('emp-') || cachedEmpId.startsWith('kemp-')
            if (isDemoUser) {
              const cachedOrgId = cachedEmpId.startsWith('kemp-') ? 'org-2' : 'org-1'
              loadDemoData(cachedOrgId)
            }
          } else {
            // No cached user and API is down — can't authenticate
            setCurrentUser(null)
            setIsLoading(false)
            return
          }
        } else {
          // Server explicitly said no valid session (401)
          setCurrentUser(null)
          try { localStorage.removeItem('tempo_current_user') } catch { /* ignore */ }
          // Don't fetch data if not authenticated
          setIsLoading(false)
          return
        }

        // Step 2: Fetch all data from DB (session cookie sent automatically)
        // Skip DB fetch for demo users — their data was already loaded by loadDemoData()
        if (!isDemoUser) {
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
          if (data.learningPaths?.length) {
            setLearningPaths(data.learningPaths)
          } else if (data.courses?.length) {
            // Remap demo learning path course_ids to actual DB course IDs
            const dbCourses = data.courses as Array<{ id: string }>
            const idMap = new Map<string, string>()
            dbCourses.forEach((c, i) => { idMap.set(`course-${i + 1}`, c.id) })
            setLearningPaths(prev => prev.map(lp => ({
              ...lp,
              course_ids: (lp as any).course_ids.map((cid: string) => idMap.get(cid) || cid),
            })) as typeof prev)
          }
          if (data.liveSessions?.length) {
            setLiveSessions(data.liveSessions)
          } else if (data.courses?.length) {
            // Remap demo live session course_id to actual DB course IDs
            const dbCourses2 = data.courses as Array<{ id: string }>
            const cMap = new Map<string, string>()
            dbCourses2.forEach((c, i) => { cMap.set(`course-${i + 1}`, c.id) })
            setLiveSessions(prev => prev.map(s => ({
              ...s,
              course_id: cMap.get((s as any).course_id) || (s as any).course_id,
            })) as typeof prev)
          }
          if (data.surveys?.length) setSurveys(data.surveys)
          if (data.engagementScores?.length) setEngagementScores(data.engagementScores)
          if (data.actionPlans?.length) setActionPlans(data.actionPlans)
          if (data.surveyResponses?.length) setSurveyResponses(data.surveyResponses)
          if (data.mentoringPrograms?.length) setMentoringPrograms(data.mentoringPrograms)
          if (data.mentoringPairs?.length) setMentoringPairs(data.mentoringPairs)
          if (data.mentoringSessions?.length) setMentoringSessions(data.mentoringSessions)
          if (data.mentoringGoals?.length) setMentoringGoals(data.mentoringGoals)
          if (data.payrollRuns?.length) setPayrollRuns(data.payrollRuns)
          if (data.employeePayrollEntries?.length) setEmployeePayrollEntries(data.employeePayrollEntries)
          if (data.contractorPayments?.length) setContractorPayments(data.contractorPayments)
          if (data.payrollSchedules?.length) setPayrollSchedules(data.payrollSchedules)
          if (data.taxConfigs?.length) setTaxConfigs(data.taxConfigs)
          if (data.complianceIssues?.length) setComplianceIssues(data.complianceIssues)
          if (data.taxFilings?.length) setTaxFilings(data.taxFilings)
          if (data.leaveRequests?.length) setLeaveRequests(data.leaveRequests)
          if (data.benefitPlans?.length) setBenefitPlans(data.benefitPlans)
          if (data.benefitEnrollments?.length) setBenefitEnrollments(data.benefitEnrollments)
          if (data.benefitDependents?.length) setBenefitDependents(data.benefitDependents)
          if (data.lifeEvents?.length) setLifeEvents(data.lifeEvents)
          if (data.expenseReports?.length) setExpenseReports(data.expenseReports)
          if (data.expensePolicies?.length) setExpensePolicies(data.expensePolicies)
          if (data.mileageLogs?.length) setMileageLogs(data.mileageLogs)
          if (data.jobPostings?.length) setJobPostings(data.jobPostings)
          if (data.applications?.length) setApplications(data.applications)
          if (data.careerSiteConfig) setCareerSiteConfig(data.careerSiteConfig)
          if (data.jobDistributions?.length) {
            setJobDistributions(data.jobDistributions)
          } else if (data.jobPostings?.length) {
            // Remap demo job distribution job_id to actual DB job IDs
            const dbJobs = data.jobPostings as Array<{ id: string }>
            const jMap = new Map<string, string>()
            dbJobs.forEach((j, i) => { jMap.set(`job-${i + 1}`, j.id) })
            setJobDistributions(prev => prev.map(d => ({
              ...d,
              job_id: jMap.get((d as any).job_id) || (d as any).job_id,
            })) as typeof prev)
          }
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
        }
      } catch (err) {
        console.warn('Failed to initialize session:', err)
      } finally {
        setIsLoading(false)
      }
    }

    initSession()
  }, [])

  // Remap journey employee IDs when DB employees have different IDs (UUIDs vs demo emp-N)
  useEffect(() => {
    if (!isLoading && employees.length > 0 && employees[0]?.id && !employees[0].id.startsWith('emp-')) {
      setJourneys(prev => prev.map(j => {
        const demoEmp = demoEmployees.find(e => e.id === j.employee_id)
        const actualEmp = demoEmp ? employees.find(e => e.profile.full_name === demoEmp.profile.full_name) : null
        const demoAssigner = demoEmployees.find(e => e.id === j.assigned_by)
        const actualAssigner = demoAssigner ? employees.find(e => e.profile.full_name === demoAssigner.profile.full_name) : null
        return {
          ...j,
          employee_id: actualEmp?.id || j.employee_id,
          assigned_by: actualAssigner?.id || j.assigned_by,
        }
      }))
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading])

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
    const emp = { id, org_id: orgIdRef.current, ...data }
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

  const bulkAddEmployees = useCallback((employeesData: AnyRecord[]) => {
    const newEmployees = employeesData.map(data => {
      const id = genId('emp')
      return { id, org_id: orgIdRef.current, ...data }
    })
    setEmployees(prev => [...prev, ...newEmployees] as typeof prev)
    logAudit('create', 'employee', 'bulk', `Bulk imported ${newEmployees.length} employees`)
    addToast(`${newEmployees.length} employees imported successfully`)
    apiPost('employees', 'create', { bulk: true, employees: employeesData })
    return newEmployees.map(e => e.id)
  }, [logAudit, addToast])

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

  // ---- CRUD: Employee Documents ----
  const addEmployeeDocument = useCallback((data: AnyRecord) => {
    const id = genId('doc')
    setEmployeeDocuments(prev => [...prev, { id, upload_date: new Date().toISOString().split('T')[0], ...data }] as typeof prev)
    logAudit('create', 'employee_document', id, `Uploaded document: ${data.name}`)
    addToast('Document uploaded')
  }, [logAudit, addToast])

  const updateEmployeeDocument = useCallback((id: string, data: AnyRecord) => {
    setEmployeeDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'employee_document', id, 'Updated document')
    addToast('Document updated')
  }, [logAudit, addToast])

  // ---- CRUD: Onboarding ----
  const addBuddyAssignment = useCallback((data: AnyRecord) => {
    const id = genId('buddy')
    setBuddyAssignments(prev => [...prev, { id, org_id: orgIdRef.current, assigned_date: new Date().toISOString().split('T')[0], ...data }] as typeof prev)
    logAudit('create', 'buddy_assignment', id, `Assigned buddy for ${data.new_hire_id}`)
    addToast('Buddy assigned')
  }, [logAudit, addToast])

  const updateBuddyAssignment = useCallback((id: string, data: AnyRecord) => {
    setBuddyAssignments(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'buddy_assignment', id, 'Updated buddy assignment')
    addToast('Buddy assignment updated')
  }, [logAudit, addToast])

  const addPreboardingTask = useCallback((data: AnyRecord) => {
    const id = genId('pbt')
    setPreboardingTasks(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'preboarding_task', id, `Created preboarding task: ${data.title}`)
    addToast('Preboarding task created')
  }, [logAudit, addToast])

  const updatePreboardingTask = useCallback((id: string, data: AnyRecord) => {
    setPreboardingTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'preboarding_task', id, 'Updated preboarding task')
    addToast('Preboarding task updated')
  }, [logAudit, addToast])

  // ---- CRUD: Offers ----
  const addOffer = useCallback((data: AnyRecord) => {
    const id = genId('offer')
    setOffers(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'offer', id, `Created offer for: ${data.candidate_name}`)
    addToast('Offer created')
  }, [logAudit, addToast])

  const updateOffer = useCallback((id: string, data: AnyRecord) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o) as typeof prev)
    logAudit('update', 'offer', id, 'Updated offer')
    addToast('Offer updated')
  }, [logAudit, addToast])

  // ---- Journeys ----
  const updateJourneyStep = useCallback((journeyId: string, stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => {
    setJourneys(prev => prev.map(j => {
      if (j.id !== journeyId) return j
      const updatedSteps = j.steps.map(s => s.id === stepId ? { ...s, status } : s)
      const completedCount = updatedSteps.filter(s => s.status === 'completed').length
      const currentStep = updatedSteps.findIndex(s => s.status !== 'completed' && s.status !== 'skipped')
      const allDone = updatedSteps.every(s => s.status === 'completed' || s.status === 'skipped')
      return {
        ...j,
        steps: updatedSteps,
        current_step: currentStep >= 0 ? currentStep : updatedSteps.length - 1,
        status: allDone ? 'completed' as const : j.status === 'not_started' ? 'in_progress' as const : j.status,
        started_at: j.started_at || new Date().toISOString(),
      }
    }))
    addToast('Journey step updated')
  }, [addToast])

  // ---- Widget Preferences ----
  const updateWidgetPreferences = useCallback((data: AnyRecord) => {
    setWidgetPreferences(prev => ({ ...prev, ...data }) as typeof prev)
    addToast('Dashboard layout updated')
  }, [addToast])

  // ---- CRUD: Goals ----
  const addGoal = useCallback((data: AnyRecord) => {
    const id = genId('goal')
    setGoals(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setReviews(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setReviewCycles(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setFeedback(prev => [{ id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }, ...prev] as typeof prev)
    logAudit('create', 'feedback', id, `Gave feedback to ${getEmployeeName(data.to_id)}`)
    addToast('Feedback sent')
    apiPost('feedback', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: 1:1 Meetings ----
  const addOneOnOne = useCallback((data: AnyRecord) => {
    const id = genId('oo')
    setOneOnOnes(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'one_on_one', id, `Scheduled 1:1 with ${getEmployeeName(data.employee_id)}`)
    addToast('1:1 meeting scheduled')
  }, [logAudit, addToast, getEmployeeName])

  const updateOneOnOne = useCallback((id: string, data: AnyRecord) => {
    setOneOnOnes(prev => prev.map(o => o.id === id ? { ...o, ...data } : o) as typeof prev)
    logAudit('update', 'one_on_one', id, 'Updated 1:1 meeting')
    addToast('1:1 meeting updated')
  }, [logAudit, addToast])

  // ---- CRUD: Recognitions ----
  const addRecognition = useCallback((data: AnyRecord) => {
    const id = genId('rec')
    setRecognitions(prev => [{ id, org_id: orgIdRef.current, created_at: new Date().toISOString(), likes: 0, ...data }, ...prev] as typeof prev)
    logAudit('create', 'recognition', id, `Gave kudos to ${getEmployeeName(data.to_id)}`)
    addToast('Recognition sent!')
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Competency Ratings ----
  const addCompetencyRating = useCallback((data: AnyRecord) => {
    const id = genId('cr')
    setCompetencyRatings(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'competency_rating', id, `Rated competency for ${getEmployeeName(data.employee_id)}`)
    addToast('Competency rating added')
  }, [logAudit, addToast, getEmployeeName])

  const updateCompetencyRating = useCallback((id: string, data: AnyRecord) => {
    setCompetencyRatings(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'competency_rating', id, 'Updated competency rating')
    addToast('Competency rating updated')
  }, [logAudit, addToast])

  // ---- CRUD: Comp Bands ----
  const addCompBand = useCallback((data: AnyRecord) => {
    const id = genId('band')
    setCompBands(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
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
    setSalaryReviews(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
  const addEquityGrant = useCallback((data: AnyRecord) => {
    const id = genId('eq')
    setEquityGrants(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'equity_grant', id, `Created equity grant for ${getEmployeeName(data.employee_id)}`)
    addToast('Equity grant created')
  }, [logAudit, addToast, getEmployeeName])
  const updateEquityGrant = useCallback((id: string, data: AnyRecord) => {
    setEquityGrants(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev)
    logAudit('update', 'equity_grant', id, 'Updated equity grant')
    addToast('Equity grant updated')
  }, [logAudit, addToast])
  const addCompPlanningCycle = useCallback((data: AnyRecord) => {
    const id = genId('cpc')
    setCompPlanningCycles(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'comp_planning_cycle', id, `Created planning cycle: ${data.name}`)
    addToast('Comp planning cycle created')
  }, [logAudit, addToast])
  const updateCompPlanningCycle = useCallback((id: string, data: AnyRecord) => {
    setCompPlanningCycles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'comp_planning_cycle', id, 'Updated comp planning cycle')
    addToast('Comp planning cycle updated')
  }, [logAudit, addToast])

  // ---- CRUD: Courses ----
  const addCourse = useCallback((data: AnyRecord) => {
    const id = genId('course')
    setCourses(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setEnrollments(prev => [...prev, { id, org_id: orgIdRef.current, enrolled_at: new Date().toISOString(), completed_at: null, ...data }] as typeof prev)
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

  // ---- CRUD: Learning Paths ----
  const addLearningPath = useCallback((data: AnyRecord) => {
    const id = genId('lp')
    setLearningPaths(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'learning_path', id, `Created learning path: ${data.title}`)
    addToast('Learning path created')
    apiPost('learning_paths', 'create', data)
  }, [logAudit, addToast])

  const updateLearningPath = useCallback((id: string, data: AnyRecord) => {
    setLearningPaths(prev => prev.map(lp => lp.id === id ? { ...lp, ...data } : lp) as typeof prev)
    logAudit('update', 'learning_path', id, 'Updated learning path')
    addToast('Learning path updated')
    apiPost('learning_paths', 'update', data, id)
  }, [logAudit, addToast])

  const deleteLearningPath = useCallback((id: string) => {
    setLearningPaths(prev => prev.filter(lp => lp.id !== id))
    logAudit('delete', 'learning_path', id, 'Deleted learning path')
    addToast('Learning path deleted')
    apiPost('learning_paths', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Live Sessions ----
  const addLiveSession = useCallback((data: AnyRecord) => {
    const id = genId('ls')
    setLiveSessions(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'live_session', id, `Scheduled session: ${data.title}`)
    addToast('Live session scheduled')
    apiPost('live_sessions', 'create', data)
  }, [logAudit, addToast])

  const updateLiveSession = useCallback((id: string, data: AnyRecord) => {
    setLiveSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'live_session', id, 'Updated live session')
    addToast('Live session updated')
    apiPost('live_sessions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Course Blocks ----
  const addCourseBlock = useCallback((data: AnyRecord) => { const id = genId('block'); setCourseBlocks(prev => [...prev, { id, ...data }] as typeof prev); logAudit('create', 'course_block', id, `Added block: ${data.title}`); addToast('Content block added') }, [logAudit, addToast])
  const updateCourseBlock = useCallback((id: string, data: AnyRecord) => { setCourseBlocks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev); logAudit('update', 'course_block', id, 'Updated content block'); addToast('Content block updated') }, [logAudit, addToast])
  const deleteCourseBlock = useCallback((id: string) => { setCourseBlocks(prev => prev.filter(b => b.id !== id)); logAudit('delete', 'course_block', id, 'Deleted content block'); addToast('Content block deleted') }, [logAudit, addToast])
  const addQuizQuestion = useCallback((data: AnyRecord) => { const id = genId('quiz-q'); setQuizQuestions(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev); logAudit('create', 'quiz_question', id, 'Added question'); addToast('Question added') }, [logAudit, addToast])
  const updateQuizQuestion = useCallback((id: string, data: AnyRecord) => { setQuizQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q) as typeof prev); logAudit('update', 'quiz_question', id, 'Updated question'); addToast('Question updated') }, [logAudit, addToast])
  const deleteQuizQuestion = useCallback((id: string) => { setQuizQuestions(prev => prev.filter(q => q.id !== id)); logAudit('delete', 'quiz_question', id, 'Deleted question'); addToast('Question deleted') }, [logAudit, addToast])
  const addDiscussion = useCallback((data: AnyRecord) => { const id = genId('disc'); setDiscussions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), replies: 0, likes: 0, ...data }] as typeof prev); logAudit('create', 'discussion', id, `Started discussion: ${data.title}`); addToast('Discussion created') }, [logAudit, addToast])
  const updateDiscussion = useCallback((id: string, data: AnyRecord) => { setDiscussions(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev); logAudit('update', 'discussion', id, 'Updated discussion'); addToast('Discussion updated') }, [logAudit, addToast])
  const addStudyGroup = useCallback((data: AnyRecord) => { const id = genId('sg'); setStudyGroups(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'study_group', id, `Created group: ${data.name}`); addToast('Study group created') }, [logAudit, addToast])
  const updateStudyGroup = useCallback((id: string, data: AnyRecord) => { setStudyGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev); logAudit('update', 'study_group', id, 'Updated study group'); addToast('Study group updated') }, [logAudit, addToast])

  // ---- CRUD: Surveys ----
  const addSurvey = useCallback((data: AnyRecord) => {
    const id = genId('survey')
    setSurveys(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Action Plans ----
  const addActionPlan = useCallback((data: AnyRecord) => {
    const id = genId('ap')
    setActionPlans(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'action_plan', id, `Created action plan: ${data.title}`)
    addToast('Action plan created')
    apiPost('action_plans', 'create', data)
  }, [logAudit, addToast])

  const updateActionPlan = useCallback((id: string, data: AnyRecord) => {
    setActionPlans(prev => prev.map(ap => ap.id === id ? { ...ap, ...data } : ap) as typeof prev)
    logAudit('update', 'action_plan', id, 'Updated action plan')
    addToast('Action plan updated')
    apiPost('action_plans', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Mentoring ----
  const addMentoringProgram = useCallback((data: AnyRecord) => {
    const id = genId('mp')
    setMentoringPrograms(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setMentoringPairs(prev => [...prev, { id, org_id: orgIdRef.current, started_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Mentoring Sessions ----
  const addMentoringSession = useCallback((data: AnyRecord) => {
    const id = genId('ms')
    setMentoringSessions(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'mentoring_session', id, 'Logged mentoring session')
    addToast('Mentoring session logged')
    apiPost('mentoringSessions', 'create', data)
  }, [logAudit, addToast])
  const updateMentoringSession = useCallback((id: string, data: AnyRecord) => {
    setMentoringSessions(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'mentoring_session', id, 'Updated mentoring session')
    addToast('Mentoring session updated')
    apiPost('mentoringSessions', 'update', data, id)
  }, [logAudit, addToast])
  const addMentoringGoal = useCallback((data: AnyRecord) => {
    const id = genId('mg')
    setMentoringGoals(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'mentoring_goal', id, `Created goal: ${data.title}`)
    addToast('Mentoring goal created')
    apiPost('mentoringGoals', 'create', data)
  }, [logAudit, addToast])
  const updateMentoringGoal = useCallback((id: string, data: AnyRecord) => {
    setMentoringGoals(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev)
    logAudit('update', 'mentoring_goal', id, 'Updated mentoring goal')
    addToast('Mentoring goal updated')
    apiPost('mentoringGoals', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Payroll ----
  const addPayrollRun = useCallback((data: AnyRecord) => {
    const id = genId('pr')
    setPayrollRuns(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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

  const addEmployeePayrollEntry = useCallback((data: AnyRecord) => {
    const id = genId('epe')
    setEmployeePayrollEntries(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'employee_payroll_entry', id, `Added payroll entry for ${data.employee_name}`)
    addToast('Payroll entry added')
  }, [logAudit, addToast])

  const addContractorPayment = useCallback((data: AnyRecord) => {
    const id = genId('cp')
    setContractorPayments(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'contractor_payment', id, `Added contractor payment: ${data.contractor_name}`)
    addToast('Contractor payment added')
  }, [logAudit, addToast])

  const updateContractorPayment = useCallback((id: string, data: AnyRecord) => {
    setContractorPayments(prev => prev.map(cp => cp.id === id ? { ...cp, ...data } : cp) as typeof prev)
    logAudit('update', 'contractor_payment', id, 'Updated contractor payment')
    addToast('Contractor payment updated')
  }, [logAudit, addToast])

  const addPayrollSchedule = useCallback((data: AnyRecord) => {
    const id = genId('ps')
    setPayrollSchedules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'payroll_schedule', id, `Created payroll schedule: ${data.name}`)
    addToast('Payroll schedule created')
  }, [logAudit, addToast])

  const updatePayrollSchedule = useCallback((id: string, data: AnyRecord) => {
    setPayrollSchedules(prev => prev.map(ps => ps.id === id ? { ...ps, ...data } : ps) as typeof prev)
    logAudit('update', 'payroll_schedule', id, 'Updated payroll schedule')
    addToast('Payroll schedule updated')
  }, [logAudit, addToast])

  const addTaxConfig = useCallback((data: AnyRecord) => {
    const id = genId('tc')
    setTaxConfigs(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'tax_config', id, `Added tax config for ${data.country}`)
    addToast('Tax configuration added')
  }, [logAudit, addToast])

  const updateTaxConfig = useCallback((id: string, data: AnyRecord) => {
    setTaxConfigs(prev => prev.map(tc => tc.id === id ? { ...tc, ...data } : tc) as typeof prev)
    logAudit('update', 'tax_config', id, 'Updated tax configuration')
    addToast('Tax configuration updated')
  }, [logAudit, addToast])

  const resolveComplianceIssue = useCallback((id: string) => {
    setComplianceIssues(prev => prev.map(ci => ci.id === id ? { ...ci, status: 'resolved' as const } : ci) as typeof prev)
    logAudit('update', 'compliance_issue', id, 'Resolved compliance issue')
    addToast('Compliance issue resolved')
  }, [logAudit, addToast])

  const updateTaxFiling = useCallback((id: string, data: AnyRecord) => {
    setTaxFilings(prev => prev.map(tf => tf.id === id ? { ...tf, ...data } : tf) as typeof prev)
    logAudit('update', 'tax_filing', id, 'Updated tax filing')
    addToast('Tax filing updated')
  }, [logAudit, addToast])

  // ---- CRUD: Leave Requests ----
  const addLeaveRequest = useCallback((data: AnyRecord) => {
    const id = genId('lr')
    setLeaveRequests(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setBenefitPlans(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Benefit Enrollments ----
  const addBenefitEnrollment = useCallback((data: AnyRecord) => {
    const id = genId('benr')
    setBenefitEnrollments(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'benefit_enrollment', id, 'Created benefit enrollment')
    addToast('Benefit enrollment created')
    apiPost('benefitEnrollments', 'create', data)
  }, [logAudit, addToast])

  const updateBenefitEnrollment = useCallback((id: string, data: AnyRecord) => {
    setBenefitEnrollments(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'benefit_enrollment', id, 'Updated benefit enrollment')
    addToast('Benefit enrollment updated')
    apiPost('benefitEnrollments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Benefit Dependents ----
  const addBenefitDependent = useCallback((data: AnyRecord) => {
    const id = genId('bdep')
    setBenefitDependents(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'benefit_dependent', id, 'Added dependent')
    addToast('Dependent added')
    apiPost('benefitDependents', 'create', data)
  }, [logAudit, addToast])

  const updateBenefitDependent = useCallback((id: string, data: AnyRecord) => {
    setBenefitDependents(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'benefit_dependent', id, 'Updated dependent')
    addToast('Dependent updated')
    apiPost('benefitDependents', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Life Events ----
  const addLifeEvent = useCallback((data: AnyRecord) => {
    const id = genId('le')
    setLifeEvents(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'life_event', id, 'Recorded life event')
    addToast('Life event recorded')
    apiPost('lifeEvents', 'create', data)
  }, [logAudit, addToast])

  const updateLifeEvent = useCallback((id: string, data: AnyRecord) => {
    setLifeEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'life_event', id, 'Updated life event')
    addToast('Life event updated')
    apiPost('lifeEvents', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Expenses ----
  const addExpenseReport = useCallback((data: AnyRecord) => {
    const id = genId('exp')
    setExpenseReports(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Expense Policies ----
  const addExpensePolicy = useCallback((data: AnyRecord) => {
    const id = genId('epol')
    setExpensePolicies(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'expense_policy', id, `Created expense policy: ${data.category}`)
    addToast('Expense policy created')
  }, [logAudit, addToast])

  const updateExpensePolicy = useCallback((id: string, data: AnyRecord) => {
    setExpensePolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'expense_policy', id, 'Updated expense policy')
    addToast('Expense policy updated')
  }, [logAudit, addToast])

  // ---- CRUD: Mileage Logs ----
  const addMileageLog = useCallback((data: AnyRecord) => {
    const id = genId('ml')
    setMileageLogs(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mileage_log', id, 'Created mileage log entry')
    addToast('Mileage entry added')
  }, [logAudit, addToast])

  const updateMileageLog = useCallback((id: string, data: AnyRecord) => {
    setMileageLogs(prev => prev.map(m => m.id === id ? { ...m, ...data } : m) as typeof prev)
    logAudit('update', 'mileage_log', id, 'Updated mileage log')
    addToast('Mileage entry updated')
  }, [logAudit, addToast])

  // ---- CRUD: Recruiting ----
  const addJobPosting = useCallback((data: AnyRecord) => {
    const id = genId('job')
    setJobPostings(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), application_count: 0, ...data }] as typeof prev)
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
    setApplications(prev => [...prev, { id, org_id: orgIdRef.current, applied_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Career Site ----
  const updateCareerSiteConfig = useCallback((data: AnyRecord) => {
    setCareerSiteConfig(prev => ({ ...prev, ...data }))
    logAudit('update', 'career_site', 'config', 'Updated career site configuration')
    addToast('Career site updated')
    apiPost('career_site', 'update', data)
  }, [logAudit, addToast])

  // ---- CRUD: Job Distributions ----
  const addJobDistribution = useCallback((data: AnyRecord) => {
    const id = genId('dist')
    setJobDistributions(prev => [...prev, { id, org_id: orgIdRef.current, posted_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'job_distribution', id, `Distributed job to ${(data.boards || []).length} boards`)
    addToast('Job posted to boards')
    apiPost('job_distributions', 'create', data)
  }, [logAudit, addToast])

  const updateJobDistribution = useCallback((id: string, data: AnyRecord) => {
    setJobDistributions(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'job_distribution', id, 'Updated job distribution')
    addToast('Distribution updated')
    apiPost('job_distributions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Interviews ----
  const addInterview = useCallback((data: AnyRecord) => {
    const id = genId('intv')
    setInterviews(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'interview', id, `Scheduled interview for ${data.candidate_name || 'candidate'}`)
    addToast('Interview scheduled')
    apiPost('interviews', 'create', data)
  }, [logAudit, addToast])

  const updateInterview = useCallback((id: string, data: AnyRecord) => {
    setInterviews(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'interview', id, 'Updated interview')
    addToast('Interview updated')
    apiPost('interviews', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Talent Pools ----
  const addTalentPool = useCallback((data: AnyRecord) => {
    const id = genId('tp')
    setTalentPools(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), candidates: [], ...data }] as typeof prev)
    logAudit('create', 'talent_pool', id, `Created talent pool: ${data.name}`)
    addToast('Talent pool created')
    apiPost('talent_pools', 'create', data)
  }, [logAudit, addToast])

  const updateTalentPool = useCallback((id: string, data: AnyRecord) => {
    setTalentPools(prev => prev.map(tp => tp.id === id ? { ...tp, ...data } : tp) as typeof prev)
    logAudit('update', 'talent_pool', id, 'Updated talent pool')
    addToast('Talent pool updated')
    apiPost('talent_pools', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Score Cards ----
  const addScoreCard = useCallback((data: AnyRecord) => {
    const id = genId('sc')
    setScoreCards(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'score_card', id, `Created scorecard for ${data.candidate_name || 'candidate'}`)
    addToast('Scorecard submitted')
    apiPost('score_cards', 'create', data)
  }, [logAudit, addToast])

  const updateScoreCard = useCallback((id: string, data: AnyRecord) => {
    setScoreCards(prev => prev.map(sc => sc.id === id ? { ...sc, ...data } : sc) as typeof prev)
    logAudit('update', 'score_card', id, 'Updated scorecard')
    addToast('Scorecard updated')
    apiPost('score_cards', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT ----
  const addDevice = useCallback((data: AnyRecord) => {
    const id = genId('dev')
    setDevices(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setSoftwareLicenses(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setITRequests(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setInvoices(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setBudgets(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setVendors(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setDepartments(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
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
    setProjects(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setMilestones(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setTasks(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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

  // ---- CRUD: Automation Rules ----
  const addAutomationRule = useCallback((data: AnyRecord) => {
    const id = genId('rule')
    setAutomationRules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), executions: 0, last_executed: null, ...data }] as typeof prev)
    logAudit('create', 'automation_rule', id, `Created automation rule: ${data.name}`)
    addToast('Automation rule created')
  }, [logAudit, addToast])

  const updateAutomationRule = useCallback((id: string, data: AnyRecord) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'automation_rule', id, 'Updated automation rule')
    addToast('Automation rule updated')
  }, [logAudit, addToast])

  const toggleAutomationRule = useCallback((id: string) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r) as typeof prev)
    const rule = automationRules.find(r => r.id === id)
    const newState = rule ? !rule.is_active : true
    logAudit('update', 'automation_rule', id, `${newState ? 'Activated' : 'Deactivated'} automation rule`)
    addToast(`Automation rule ${newState ? 'activated' : 'deactivated'}`)
  }, [logAudit, addToast, automationRules])

  // ---- CRUD: Strategic Objectives ----
  const addStrategicObjective = useCallback((data: AnyRecord) => {
    const id = genId('obj')
    setStrategicObjectives(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setKeyResults(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setInitiatives(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setKPIDefinitions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setWorkflows(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
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
    setWorkflowRuns(prev => [...prev, { id, org_id: orgIdRef.current, started_at: new Date().toISOString(), ...data }] as typeof prev)
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
    logAudit('update', 'organization', orgIdRef.current, 'Updated organization settings')
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
        // For demo users, load the correct org's demo data (module data)
        const empId = data.user?.employee_id || ''
        if (empId.startsWith('emp-') || empId.startsWith('kemp-')) {
          const demoOrgId = empId.startsWith('kemp-') ? 'org-2' : 'org-1'
          loadDemoData(demoOrgId)
        }
        setCurrentUser(data.user)
        // Keep localStorage as client-side cache for instant hydration
        try { localStorage.setItem('tempo_current_user', JSON.stringify(data.user)) } catch { /* ignore */ }
        return true
      }
    } catch {
      // Fall back to demo credentials for offline/development
    }

    // Fallback: demo credentials for offline/development (searches both orgs)
    const cred = allDemoCredentials.find(c => c.email === email && c.password === password)
    if (!cred) return false
    // Determine which org this credential belongs to
    const orgId = cred.employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
    // Load the correct org's demo data
    loadDemoData(orgId)
    const orgData = getDemoDataForOrg(orgId)
    const emp = orgData.employees.find((e: { id: string }) => e.id === cred.employeeId)
    if (!emp) return false
    const user = buildCurrentUser(emp)
    setCurrentUser(user)
    try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
    return true
  }, [loadDemoData])

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
    // Fallback to local - check current employees first, then try other org
    let emp = employees.find(e => e.id === employeeId)
    if (!emp) {
      const orgId = employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
      loadDemoData(orgId)
      const orgData = getDemoDataForOrg(orgId)
      emp = orgData.employees.find((e: { id: string }) => e.id === employeeId)
    }
    if (!emp) return
    const user = buildCurrentUser(emp)
    setCurrentUser(user)
    try { localStorage.setItem('tempo_current_user', JSON.stringify(user)) } catch { /* ignore */ }
  }, [employees, loadDemoData])

  const currentEmployeeId = currentUser?.employee_id || 'emp-17'
  const isLoggedIn = currentUser !== null

  const value: TempoState = {
    org, user: demoUser, currentUser, currentEmployeeId, departments, employees,
    goals, reviewCycles, reviews, feedback,
    oneOnOnes, recognitions, competencyFramework, competencyRatings,
    compBands, salaryReviews, equityGrants, compPlanningCycles,
    courses, enrollments, learningPaths, liveSessions, courseBlocks, quizQuestions, discussions, studyGroups,
    surveys, engagementScores, actionPlans, surveyResponses,
    mentoringPrograms, mentoringPairs, mentoringSessions, mentoringGoals,
    payrollRuns, employeePayrollEntries, contractorPayments, payrollSchedules, taxConfigs, complianceIssues, taxFilings,
    leaveRequests,
    benefitPlans, benefitEnrollments, benefitDependents, lifeEvents, expenseReports, expensePolicies, mileageLogs,
    jobPostings, applications, careerSiteConfig, jobDistributions,
    devices, softwareLicenses, itRequests,
    invoices, budgets, vendors,
    projects, milestones, tasks, taskDependencies, automationRules, automationLog,
    strategicObjectives, keyResults, initiatives, kpiDefinitions, kpiMeasurements,
    workflows, workflowSteps, workflowRuns, workflowTemplates,
    notifications, unreadNotificationCount,
    auditLog, toasts,
    isLoading,
    addToast, removeToast,
    addEmployee, bulkAddEmployees, updateEmployee, deleteEmployee,
    addGoal, updateGoal, deleteGoal,
    addReview, updateReview,
    addReviewCycle, updateReviewCycle,
    addFeedback,
    addOneOnOne, updateOneOnOne,
    addRecognition,
    addCompetencyRating, updateCompetencyRating,
    addCompBand, updateCompBand, deleteCompBand,
    addSalaryReview, updateSalaryReview,
    addEquityGrant, updateEquityGrant,
    addCompPlanningCycle, updateCompPlanningCycle,
    addCourse, updateCourse,
    addEnrollment, updateEnrollment,
    addLearningPath, updateLearningPath, deleteLearningPath,
    addLiveSession, updateLiveSession,
    addCourseBlock, updateCourseBlock, deleteCourseBlock,
    addQuizQuestion, updateQuizQuestion, deleteQuizQuestion,
    addDiscussion, updateDiscussion,
    addStudyGroup, updateStudyGroup,
    addSurvey, updateSurvey,
    addActionPlan, updateActionPlan,
    addMentoringProgram, updateMentoringProgram,
    addMentoringPair, updateMentoringPair,
    addMentoringSession, updateMentoringSession,
    addMentoringGoal, updateMentoringGoal,
    addPayrollRun, updatePayrollRun,
    addEmployeePayrollEntry,
    addContractorPayment, updateContractorPayment,
    addPayrollSchedule, updatePayrollSchedule,
    addTaxConfig, updateTaxConfig,
    resolveComplianceIssue, updateTaxFiling,
    addLeaveRequest, updateLeaveRequest,
    addBenefitPlan, updateBenefitPlan,
    addBenefitEnrollment, updateBenefitEnrollment,
    addBenefitDependent, updateBenefitDependent,
    addLifeEvent, updateLifeEvent,
    addExpenseReport, updateExpenseReport, deleteExpenseReport,
    addExpensePolicy, updateExpensePolicy,
    addMileageLog, updateMileageLog,
    addJobPosting, updateJobPosting,
    addApplication, updateApplication,
    updateCareerSiteConfig,
    addJobDistribution, updateJobDistribution,
    interviews, talentPools, scoreCards,
    addInterview, updateInterview,
    addTalentPool, updateTalentPool,
    addScoreCard, updateScoreCard,
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
    addAutomationRule, updateAutomationRule, toggleAutomationRule,
    addStrategicObjective, updateStrategicObjective, deleteStrategicObjective,
    addKeyResult, updateKeyResult, deleteKeyResult,
    addInitiative, updateInitiative, deleteInitiative,
    addKPIDefinition, updateKPIDefinition,
    addKPIMeasurement,
    addWorkflow, updateWorkflow, deleteWorkflow,
    addWorkflowStep, updateWorkflowStep, deleteWorkflowStep,
    addWorkflowRun, updateWorkflowRun,
    employeeDocuments, employeeTimeline,
    addEmployeeDocument, updateEmployeeDocument,
    buddyAssignments, preboardingTasks, welcomeContent,
    addBuddyAssignment, updateBuddyAssignment,
    addPreboardingTask, updatePreboardingTask,
    offers, careerTracks, marketBenchmarks, widgetPreferences,
    addOffer, updateOffer, updateWidgetPreferences, journeys, updateJourneyStep,
    markNotificationRead, markAllNotificationsRead,
    updateOrg,
    login, verifyMFA, logout, switchUser, isLoggedIn,
    getEmployeeName, getDepartmentName,
  }

  return <TempoContext.Provider value={value}>{children}</TempoContext.Provider>
}
