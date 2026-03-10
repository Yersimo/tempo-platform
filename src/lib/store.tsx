'use client'

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { fetchModules as fetchModulesFromAPI, MODULE_SLUGS, clearModuleCache } from '@/lib/hooks/use-module-data'
// Type-only imports: erased at compile time, no bundle impact
import type { DemoRole } from './demo-data'
// DemoData gives us the types of all demo exports without including the runtime data (~323KB)
type DemoData = typeof import('./demo-data')
/** Lazy-load demo-data module. Returns the full module; bundler code-splits it into a separate chunk. */
const loadDemoModule = () => import('./demo-data')

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
  org: DemoData['demoOrg']
  user: DemoData['demoUser']
  currentUser: CurrentUser | null
  currentEmployeeId: string
  departments: DemoData['demoDepartments']
  employees: DemoData['demoEmployees']

  // Performance
  goals: WidenArray<DemoData['demoGoals']>
  reviewCycles: WidenArray<DemoData['demoReviewCycles']>
  reviews: WidenArray<DemoData['demoReviews']>
  feedback: DemoData['demoFeedback']
  oneOnOnes: WidenArray<DemoData['demoOneOnOnes']>
  recognitions: WidenArray<DemoData['demoRecognitions']>
  competencyFramework: DemoData['demoCompetencyFramework']
  competencyRatings: WidenArray<DemoData['demoCompetencyRatings']>

  // PIPs, Merit Cycles, Review Templates
  pips: WidenArray<DemoData['demoPIPs']>
  pipCheckIns: WidenArray<DemoData['demoPIPCheckIns']>
  meritCycles: WidenArray<DemoData['demoMeritCycles']>
  meritRecommendations: WidenArray<DemoData['demoMeritRecommendations']>
  reviewTemplates: WidenArray<DemoData['demoReviewTemplates']>

  // Compensation
  compBands: DemoData['demoCompBands']
  salaryReviews: WidenArray<DemoData['demoSalaryReviews']>
  equityGrants: WidenArray<DemoData['demoEquityGrants']>
  compPlanningCycles: WidenArray<DemoData['demoCompPlanningCycles']>

  // Learning
  courses: DemoData['demoCourses']
  enrollments: WidenArray<DemoData['demoEnrollments']>
  learningPaths: WidenArray<DemoData['demoLearningPaths']>
  liveSessions: WidenArray<DemoData['demoLiveSessions']>
  courseBlocks: WidenArray<DemoData['demoCourseBlocks']>
  quizQuestions: WidenArray<DemoData['demoQuizQuestions']>
  discussions: WidenArray<DemoData['demoDiscussions']>
  studyGroups: WidenArray<DemoData['demoStudyGroups']>
  complianceTraining: WidenArray<DemoData['demoComplianceTraining']>
  autoEnrollRules: WidenArray<DemoData['demoAutoEnrollRules']>
  assessmentAttempts: WidenArray<DemoData['demoAssessmentAttempts']>
  learningAssignments: WidenArray<DemoData['demoLearningAssignments']>
  coursePrerequisites: WidenArray<DemoData['demoCoursePrerequisites']>
  scormPackages: WidenArray<DemoData['demoScormPackages']>
  scormTracking: WidenArray<DemoData['demoScormTracking']>
  contentLibrary: WidenArray<DemoData['demoContentLibrary']>
  learnerBadges: WidenArray<DemoData['demoLearnerBadges']>
  learnerPoints: WidenArray<DemoData['demoLearnerPoints']>
  certificateTemplates: WidenArray<DemoData['demoCertificateTemplates']>

  // Engagement
  surveys: WidenArray<DemoData['demoSurveys']>
  engagementScores: DemoData['demoEngagementScores']
  actionPlans: WidenArray<DemoData['demoActionPlans']>
  surveyResponses: WidenArray<DemoData['demoSurveyResponses']>
  surveyTemplates: WidenArray<DemoData['demoSurveyTemplates']>
  surveySchedules: WidenArray<DemoData['demoSurveySchedules']>
  surveyTriggers: WidenArray<DemoData['demoSurveyTriggers']>
  openEndedResponses: WidenArray<DemoData['demoOpenEndedResponses']>

  // Mentoring
  mentoringPrograms: WidenArray<DemoData['demoMentoringPrograms']>
  mentoringPairs: WidenArray<DemoData['demoMentoringPairs']>
  mentoringSessions: WidenArray<DemoData['demoMentoringSessions']>
  mentoringGoals: WidenArray<DemoData['demoMentoringGoals']>

  // Payroll
  payrollRuns: WidenArray<DemoData['demoPayrollRuns']>
  employeePayrollEntries: WidenArray<DemoData['demoEmployeePayrollEntries']>
  setPayrollRuns: (fn: (prev: any[]) => any[]) => void
  setEmployeePayrollEntries: (fn: (prev: any[]) => any[]) => void
  contractorPayments: WidenArray<DemoData['demoContractorPayments']>
  payrollSchedules: WidenArray<DemoData['demoPayrollSchedules']>
  taxConfigs: WidenArray<DemoData['demoTaxConfigs']>
  complianceIssues: WidenArray<DemoData['demoComplianceIssues']>
  taxFilings: WidenArray<DemoData['demoTaxFilings']>
  payrollApprovals: any[]
  payrollApprovalConfig: any[]

  // Time & Attendance
  leaveRequests: WidenArray<DemoData['demoLeaveRequests']>
  timeEntries: WidenArray<DemoData['demoTimeEntries']>
  timeOffPolicies: WidenArray<DemoData['demoTimeOffPolicies']>
  timeOffBalances: WidenArray<DemoData['demoTimeOffBalances']>
  overtimeRules: WidenArray<DemoData['demoOvertimeRules']>
  shifts: WidenArray<DemoData['demoShifts']>

  // Benefits
  benefitPlans: WidenArray<DemoData['demoBenefitPlans']>
  benefitEnrollments: WidenArray<DemoData['demoBenefitEnrollments']>
  benefitDependents: WidenArray<DemoData['demoBenefitDependents']>
  lifeEvents: WidenArray<DemoData['demoLifeEvents']>
  openEnrollmentPeriods: WidenArray<DemoData['demoOpenEnrollmentPeriods']>
  cobraEvents: WidenArray<DemoData['demoCobraEvents']>
  acaTracking: WidenArray<DemoData['demoAcaTracking']>
  flexBenefitAccounts: WidenArray<DemoData['demoFlexBenefitAccounts']>
  flexBenefitTransactions: WidenArray<DemoData['demoFlexBenefitTransactions']>

  // Expense
  expenseReports: WidenArray<DemoData['demoExpenseReports']>
  expensePolicies: WidenArray<DemoData['demoExpensePolicies']>
  mileageLogs: WidenArray<DemoData['demoMileageLogs']>
  receiptMatches: WidenArray<DemoData['demoReceiptMatches']>
  mileageEntries: WidenArray<DemoData['demoMileageEntries']>
  advancedExpensePolicies: WidenArray<DemoData['demoAdvancedExpensePolicies']>
  reimbursementBatches: WidenArray<DemoData['demoReimbursementBatches']>
  duplicateDetections: WidenArray<DemoData['demoDuplicateDetections']>

  // Recruiting
  jobPostings: WidenArray<DemoData['demoJobPostings']>
  applications: WidenArray<DemoData['demoApplications']>
  careerSiteConfig: DemoData['demoCareerSiteConfig']
  jobDistributions: WidenArray<DemoData['demoJobDistributions']>
  interviews: WidenArray<DemoData['demoInterviews']>
  talentPools: WidenArray<DemoData['demoTalentPools']>
  scoreCards: WidenArray<DemoData['demoScoreCards']>
  backgroundChecks: WidenArray<DemoData['demoBackgroundChecks']>
  referralProgram: Widen<DemoData['demoReferralProgram']>
  referrals: WidenArray<DemoData['demoReferrals']>
  knockoutQuestions: WidenArray<DemoData['demoKnockoutQuestions']>
  candidateScheduling: WidenArray<DemoData['demoCandidateScheduling']>

  // IT
  devices: WidenArray<DemoData['demoDevices']>
  softwareLicenses: DemoData['demoSoftwareLicenses']
  itRequests: WidenArray<DemoData['demoITRequests']>
  managedDevices: WidenArray<DemoData['demoManagedDevices']>
  deviceActions: WidenArray<DemoData['demoDeviceActions']>
  appCatalog: WidenArray<DemoData['demoAppCatalog']>
  appAssignments: WidenArray<DemoData['demoAppAssignments']>
  securityPoliciesIT: WidenArray<DemoData['demoSecurityPoliciesIT']>
  deviceInventory: WidenArray<DemoData['demoDeviceInventory']>

  // Finance
  invoices: WidenArray<DemoData['demoInvoices']>
  budgets: WidenArray<DemoData['demoBudgets']>
  vendors: DemoData['demoVendors']

  // Project Management
  projects: WidenArray<DemoData['demoProjects']>
  milestones: WidenArray<DemoData['demoMilestones']>
  tasks: WidenArray<DemoData['demoTasks']>
  taskDependencies: DemoData['demoTaskDependencies']
  automationRules: WidenArray<DemoData['demoAutomationRules']>
  automationLog: WidenArray<DemoData['demoAutomationLog']>

  // Strategy Execution
  strategicObjectives: WidenArray<DemoData['demoStrategicObjectives']>
  keyResults: WidenArray<DemoData['demoKeyResults']>
  initiatives: WidenArray<DemoData['demoInitiatives']>
  kpiDefinitions: WidenArray<DemoData['demoKPIDefinitions']>
  kpiMeasurements: WidenArray<DemoData['demoKPIMeasurements']>

  // Workflow Studio
  workflows: WidenArray<DemoData['demoWorkflows']>
  workflowSteps: WidenArray<DemoData['demoWorkflowSteps']>
  workflowRuns: WidenArray<DemoData['demoWorkflowRuns']>
  workflowTemplates: WidenArray<DemoData['demoWorkflowTemplates']>

  // Workflow Automation Engine
  automationWorkflows: WidenArray<DemoData['demoAutomationWorkflows']>
  automationWorkflowSteps: WidenArray<DemoData['demoAutomationWorkflowSteps']>
  automationWorkflowRuns: WidenArray<DemoData['demoAutomationWorkflowRuns']>
  automationWorkflowRunSteps: WidenArray<DemoData['demoAutomationWorkflowRunSteps']>
  automationWorkflowTemplates: WidenArray<DemoData['demoAutomationWorkflowTemplates']>

  // Headcount Planning
  headcountPlans: WidenArray<DemoData['demoHeadcountPlans']>
  headcountPositions: WidenArray<DemoData['demoHeadcountPositions']>
  headcountBudgetItems: WidenArray<DemoData['demoHeadcountBudgetItems']>

  // Custom Fields
  customFieldDefinitions: WidenArray<DemoData['demoCustomFieldDefinitions']>
  customFieldValues: WidenArray<DemoData['demoCustomFieldValues']>

  // Emergency Contacts
  emergencyContacts: WidenArray<DemoData['demoEmergencyContacts']>

  // Compliance Management
  complianceRequirements: WidenArray<DemoData['demoComplianceRequirements']>
  complianceDocuments: WidenArray<DemoData['demoComplianceDocuments']>
  complianceAlerts: WidenArray<DemoData['demoComplianceAlerts']>

  // People / HR
  employeeDocuments: WidenArray<DemoData['demoEmployeeDocuments']>
  employeeTimeline: WidenArray<DemoData['demoEmployeeTimeline']>

  // Onboarding
  buddyAssignments: WidenArray<DemoData['demoBuddyAssignments']>
  preboardingTasks: WidenArray<DemoData['demoPreboardingTasks']>
  welcomeContent: DemoData['demoWelcomeContent']

  // Offboarding
  offboardingChecklists: WidenArray<DemoData['demoOffboardingChecklists']>
  offboardingChecklistItems: WidenArray<DemoData['demoOffboardingChecklistItems']>
  offboardingProcesses: WidenArray<DemoData['demoOffboardingProcesses']>
  offboardingTasks: WidenArray<DemoData['demoOffboardingTasks']>
  exitSurveys: WidenArray<DemoData['demoExitSurveys']>

  // Offers
  offers: WidenArray<DemoData['demoOffers']>

  // Career Tracks
  careerTracks: DemoData['demoCareerTracks']

  // Market Benchmarks
  marketBenchmarks: WidenArray<DemoData['demoMarketBenchmarks']>

  // Guided Journeys
  journeys: import('@/lib/demo-data').Journey[]

  // Widget Preferences
  widgetPreferences: DemoData['demoWidgetPreferences']

  // Notifications
  notifications: WidenArray<DemoData['demoNotifications']>
  unreadNotificationCount: number

  // Audit
  auditLog: AuditEntry[]

  // Toasts
  toasts: Toast[]

  // Loading state
  isLoading: boolean
  /** Lazily load modules from DB. No-op for already-loaded modules or demo users. */
  ensureModulesLoaded: (modules: string[]) => Promise<void>

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

  // PIPs
  addPIP: (data: AnyRecord) => void
  updatePIP: (id: string, data: AnyRecord) => void
  deletePIP: (id: string) => void

  // PIP Check-Ins
  addPIPCheckIn: (data: AnyRecord) => void

  // Merit Cycles
  addMeritCycle: (data: AnyRecord) => void
  updateMeritCycle: (id: string, data: AnyRecord) => void

  // Merit Recommendations
  addMeritRecommendation: (data: AnyRecord) => void
  updateMeritRecommendation: (id: string, data: AnyRecord) => void

  // Review Templates
  addReviewTemplate: (data: AnyRecord) => void
  updateReviewTemplate: (id: string, data: AnyRecord) => void
  deleteReviewTemplate: (id: string) => void

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

  // Compliance Training
  addComplianceTraining: (data: AnyRecord) => void
  updateComplianceTraining: (id: string, data: AnyRecord) => void

  // Auto-Enrollment Rules
  addAutoEnrollRule: (data: AnyRecord) => void
  updateAutoEnrollRule: (id: string, data: AnyRecord) => void
  deleteAutoEnrollRule: (id: string) => void

  // Assessment Attempts
  addAssessmentAttempt: (data: AnyRecord) => void
  updateAssessmentAttempt: (id: string, data: AnyRecord) => void

  // Learning Assignments
  addLearningAssignment: (data: AnyRecord) => void
  updateLearningAssignment: (id: string, data: AnyRecord) => void

  // Course Prerequisites
  addCoursePrerequisite: (data: AnyRecord) => void
  deleteCoursePrerequisite: (id: string) => void

  // SCORM Packages
  addScormPackage: (data: AnyRecord) => void
  updateScormPackage: (id: string, data: AnyRecord) => void

  // SCORM Tracking
  addScormTracking: (data: AnyRecord) => void
  updateScormTracking: (id: string, data: AnyRecord) => void

  // Content Library
  addContentLibraryItem: (data: AnyRecord) => void
  updateContentLibraryItem: (id: string, data: AnyRecord) => void
  deleteContentLibraryItem: (id: string) => void

  // Learner Badges
  addLearnerBadge: (data: AnyRecord) => void

  // Learner Points
  addLearnerPoints: (data: AnyRecord) => void

  // Certificate Templates
  addCertificateTemplate: (data: AnyRecord) => void
  updateCertificateTemplate: (id: string, data: AnyRecord) => void

  // Surveys
  addSurvey: (data: AnyRecord) => void
  updateSurvey: (id: string, data: AnyRecord) => void

  // Action Plans
  addActionPlan: (data: AnyRecord) => void
  updateActionPlan: (id: string, data: AnyRecord) => void

  // Survey Templates
  addSurveyTemplate: (data: AnyRecord) => void
  updateSurveyTemplate: (id: string, data: AnyRecord) => void
  deleteSurveyTemplate: (id: string) => void

  // Survey Schedules
  addSurveySchedule: (data: AnyRecord) => void
  updateSurveySchedule: (id: string, data: AnyRecord) => void
  deleteSurveySchedule: (id: string) => void

  // Survey Triggers
  addSurveyTrigger: (data: AnyRecord) => void
  updateSurveyTrigger: (id: string, data: AnyRecord) => void
  deleteSurveyTrigger: (id: string) => void

  // Open-Ended Responses
  addOpenEndedResponse: (data: AnyRecord) => void
  updateOpenEndedResponse: (id: string, data: AnyRecord) => void

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

  // Time Entries
  addTimeEntry: (data: AnyRecord) => void
  updateTimeEntry: (id: string, data: AnyRecord) => void
  deleteTimeEntry: (id: string) => void

  // Time Off Policies
  addTimeOffPolicy: (data: AnyRecord) => void
  updateTimeOffPolicy: (id: string, data: AnyRecord) => void
  deleteTimeOffPolicy: (id: string) => void

  // Time Off Balances
  addTimeOffBalance: (data: AnyRecord) => void
  updateTimeOffBalance: (id: string, data: AnyRecord) => void

  // Overtime Rules
  addOvertimeRule: (data: AnyRecord) => void
  updateOvertimeRule: (id: string, data: AnyRecord) => void
  deleteOvertimeRule: (id: string) => void

  // Shifts
  addShift: (data: AnyRecord) => void
  updateShift: (id: string, data: AnyRecord) => void
  deleteShift: (id: string) => void

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

  // Open Enrollment Periods
  addOpenEnrollmentPeriod: (data: AnyRecord) => void
  updateOpenEnrollmentPeriod: (id: string, data: AnyRecord) => void

  // COBRA Events
  addCobraEvent: (data: AnyRecord) => void
  updateCobraEvent: (id: string, data: AnyRecord) => void

  // ACA Tracking
  addAcaTracking: (data: AnyRecord) => void
  updateAcaTracking: (id: string, data: AnyRecord) => void

  // Flex Benefit Accounts
  addFlexBenefitAccount: (data: AnyRecord) => void
  updateFlexBenefitAccount: (id: string, data: AnyRecord) => void

  // Flex Benefit Transactions
  addFlexBenefitTransaction: (data: AnyRecord) => void
  updateFlexBenefitTransaction: (id: string, data: AnyRecord) => void

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

  // Receipt Matches
  addReceiptMatch: (data: AnyRecord) => void
  updateReceiptMatch: (id: string, data: AnyRecord) => void

  // Mileage Entries
  addMileageEntry: (data: AnyRecord) => void
  updateMileageEntry: (id: string, data: AnyRecord) => void

  // Advanced Expense Policies
  addAdvancedExpensePolicy: (data: AnyRecord) => void
  updateAdvancedExpensePolicy: (id: string, data: AnyRecord) => void
  deleteAdvancedExpensePolicy: (id: string) => void

  // Reimbursement Batches
  addReimbursementBatch: (data: AnyRecord) => void
  updateReimbursementBatch: (id: string, data: AnyRecord) => void

  // Duplicate Detections
  addDuplicateDetection: (data: AnyRecord) => void
  updateDuplicateDetection: (id: string, data: AnyRecord) => void

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

  // Background Checks
  addBackgroundCheck: (data: AnyRecord) => void
  updateBackgroundCheck: (id: string, data: AnyRecord) => void

  // Referral Program
  updateReferralProgram: (data: AnyRecord) => void

  // Referrals
  addReferral: (data: AnyRecord) => void
  updateReferral: (id: string, data: AnyRecord) => void

  // Knockout Questions
  addKnockoutQuestion: (data: AnyRecord) => void
  updateKnockoutQuestion: (id: string, data: AnyRecord) => void
  deleteKnockoutQuestion: (id: string) => void

  // Candidate Scheduling
  addCandidateScheduling: (data: AnyRecord) => void
  updateCandidateScheduling: (id: string, data: AnyRecord) => void

  // Devices
  addDevice: (data: AnyRecord) => void
  updateDevice: (id: string, data: AnyRecord) => void

  // Software Licenses
  addSoftwareLicense: (data: AnyRecord) => void
  updateSoftwareLicense: (id: string, data: AnyRecord) => void

  // IT Requests
  addITRequest: (data: AnyRecord) => void
  updateITRequest: (id: string, data: AnyRecord) => void

  // IT Cloud: Managed Devices
  addManagedDevice: (data: AnyRecord) => void
  updateManagedDevice: (id: string, data: AnyRecord) => void
  deleteManagedDevice: (id: string) => void

  // IT Cloud: Device Actions
  addDeviceAction: (data: AnyRecord) => void
  updateDeviceAction: (id: string, data: AnyRecord) => void

  // IT Cloud: App Catalog
  addAppCatalogItem: (data: AnyRecord) => void
  updateAppCatalogItem: (id: string, data: AnyRecord) => void
  deleteAppCatalogItem: (id: string) => void

  // IT Cloud: App Assignments
  addAppAssignment: (data: AnyRecord) => void
  updateAppAssignment: (id: string, data: AnyRecord) => void
  deleteAppAssignment: (id: string) => void

  // IT Cloud: Security Policies
  addSecurityPolicyIT: (data: AnyRecord) => void
  updateSecurityPolicyIT: (id: string, data: AnyRecord) => void
  deleteSecurityPolicyIT: (id: string) => void

  // IT Cloud: Device Inventory
  addDeviceInventoryItem: (data: AnyRecord) => void
  updateDeviceInventoryItem: (id: string, data: AnyRecord) => void
  deleteDeviceInventoryItem: (id: string) => void

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

  // Automation Workflows
  addAutomationWorkflow: (data: AnyRecord) => string
  updateAutomationWorkflow: (id: string, data: AnyRecord) => void
  deleteAutomationWorkflow: (id: string) => void

  // Automation Workflow Steps
  addAutomationWorkflowStep: (data: AnyRecord) => void
  updateAutomationWorkflowStep: (id: string, data: AnyRecord) => void
  deleteAutomationWorkflowStep: (id: string) => void

  // Automation Workflow Runs
  addAutomationWorkflowRun: (data: AnyRecord) => void
  updateAutomationWorkflowRun: (id: string, data: AnyRecord) => void

  // Headcount Planning
  addHeadcountPlan: (data: AnyRecord) => void
  updateHeadcountPlan: (id: string, data: AnyRecord) => void
  addHeadcountPosition: (data: AnyRecord) => void
  updateHeadcountPosition: (id: string, data: AnyRecord) => void
  deleteHeadcountPosition: (id: string) => void
  addHeadcountBudgetItem: (data: AnyRecord) => void
  updateHeadcountBudgetItem: (id: string, data: AnyRecord) => void
  deleteHeadcountBudgetItem: (id: string) => void

  // Custom Fields
  addCustomFieldDefinition: (data: AnyRecord) => void
  updateCustomFieldDefinition: (id: string, data: AnyRecord) => void
  deleteCustomFieldDefinition: (id: string) => void
  addCustomFieldValue: (data: AnyRecord) => void
  updateCustomFieldValue: (id: string, data: AnyRecord) => void

  // Emergency Contacts
  addEmergencyContact: (data: AnyRecord) => void
  updateEmergencyContact: (id: string, data: AnyRecord) => void
  deleteEmergencyContact: (id: string) => void

  // Compliance Management
  addComplianceRequirement: (data: AnyRecord) => void
  updateComplianceRequirement: (id: string, data: AnyRecord) => void
  deleteComplianceRequirement: (id: string) => void
  addComplianceDocument: (data: AnyRecord) => void
  updateComplianceDocument: (id: string, data: AnyRecord) => void
  deleteComplianceDocument: (id: string) => void
  addComplianceAlert: (data: AnyRecord) => void
  updateComplianceAlert: (id: string, data: AnyRecord) => void
  dismissComplianceAlert: (id: string) => void

  // Employee Documents
  addEmployeeDocument: (data: AnyRecord) => void
  updateEmployeeDocument: (id: string, data: AnyRecord) => void

  // Onboarding
  addBuddyAssignment: (data: AnyRecord) => void
  updateBuddyAssignment: (id: string, data: AnyRecord) => void
  addPreboardingTask: (data: AnyRecord) => void
  updatePreboardingTask: (id: string, data: AnyRecord) => void

  // Offboarding
  addOffboardingChecklist: (data: AnyRecord) => void
  updateOffboardingChecklist: (id: string, data: AnyRecord) => void
  addOffboardingChecklistItem: (data: AnyRecord) => void
  updateOffboardingChecklistItem: (id: string, data: AnyRecord) => void
  deleteOffboardingChecklistItem: (id: string) => void
  addOffboardingProcess: (data: AnyRecord) => void
  updateOffboardingProcess: (id: string, data: AnyRecord) => void
  addOffboardingTask: (data: AnyRecord) => void
  updateOffboardingTask: (id: string, data: AnyRecord) => void
  addExitSurvey: (data: AnyRecord) => void

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

  // ============================================================
  // GAP CLOSURE: New Features State & CRUD
  // ============================================================

  // E-Signatures
  signatureDocuments: AnyRecord[]
  signatureTemplates: AnyRecord[]
  addSignatureDocument: (data: AnyRecord) => void
  updateSignatureDocument: (id: string, data: AnyRecord) => void
  deleteSignatureDocument: (id: string) => void
  addSignatureTemplate: (data: AnyRecord) => void
  updateSignatureTemplate: (id: string, data: AnyRecord) => void

  // E-Verify / I-9
  i9Forms: AnyRecord[]
  everifyCases: AnyRecord[]
  addI9Form: (data: AnyRecord) => void
  updateI9Form: (id: string, data: AnyRecord) => void
  addEVerifyCase: (data: AnyRecord) => void
  updateEVerifyCase: (id: string, data: AnyRecord) => void

  // PEO / Co-employment
  peoConfigurations: AnyRecord[]
  coEmploymentRecords: AnyRecord[]
  addPeoConfiguration: (data: AnyRecord) => void
  updatePeoConfiguration: (id: string, data: AnyRecord) => void
  addCoEmploymentRecord: (data: AnyRecord) => void
  updateCoEmploymentRecord: (id: string, data: AnyRecord) => void

  // Sandbox Environment
  sandboxEnvironments: AnyRecord[]
  addSandboxEnvironment: (data: AnyRecord) => void
  updateSandboxEnvironment: (id: string, data: AnyRecord) => void
  deleteSandboxEnvironment: (id: string) => void

  // Built-in Chat
  chatChannels: AnyRecord[]
  chatMessages: AnyRecord[]
  chatParticipants: AnyRecord[]
  addChatChannel: (data: AnyRecord) => void
  updateChatChannel: (id: string, data: AnyRecord) => void
  addChatMessage: (data: AnyRecord) => void
  updateChatMessage: (id: string, data: AnyRecord) => void
  deleteChatMessage: (id: string) => void

  // AI Interview Recording
  interviewRecordings: AnyRecord[]
  interviewTranscriptions: AnyRecord[]
  addInterviewRecording: (data: AnyRecord) => void
  updateInterviewRecording: (id: string, data: AnyRecord) => void

  // AI Video Screens
  videoScreenTemplates: AnyRecord[]
  videoScreenInvites: AnyRecord[]
  videoScreenResponses: AnyRecord[]
  addVideoScreenTemplate: (data: AnyRecord) => void
  updateVideoScreenTemplate: (id: string, data: AnyRecord) => void
  addVideoScreenInvite: (data: AnyRecord) => void
  updateVideoScreenInvite: (id: string, data: AnyRecord) => void
  addVideoScreenResponse: (data: AnyRecord) => void
  updateVideoScreenResponse: (id: string, data: AnyRecord) => void

  // Corporate Cards
  corporateCards: AnyRecord[]
  cardTransactions: AnyRecord[]
  addCorporateCard: (data: AnyRecord) => void
  updateCorporateCard: (id: string, data: AnyRecord) => void
  addCardTransaction: (data: AnyRecord) => void
  updateCardTransaction: (id: string, data: AnyRecord) => void

  // Bill Pay
  billPayments: AnyRecord[]
  billPaySchedules: AnyRecord[]
  addBillPayment: (data: AnyRecord) => void
  updateBillPayment: (id: string, data: AnyRecord) => void
  addBillPaySchedule: (data: AnyRecord) => void
  updateBillPaySchedule: (id: string, data: AnyRecord) => void

  // Travel Management
  travelRequests: AnyRecord[]
  travelBookings: AnyRecord[]
  travelPolicies: AnyRecord[]
  addTravelRequest: (data: AnyRecord) => void
  updateTravelRequest: (id: string, data: AnyRecord) => void
  addTravelBooking: (data: AnyRecord) => void
  updateTravelBooking: (id: string, data: AnyRecord) => void
  addTravelPolicy: (data: AnyRecord) => void
  updateTravelPolicy: (id: string, data: AnyRecord) => void

  // Procurement / Purchase Orders
  purchaseOrders: AnyRecord[]
  purchaseOrderItems: AnyRecord[]
  procurementRequests: AnyRecord[]
  addPurchaseOrder: (data: AnyRecord) => void
  updatePurchaseOrder: (id: string, data: AnyRecord) => void
  addProcurementRequest: (data: AnyRecord) => void
  updateProcurementRequest: (id: string, data: AnyRecord) => void

  // Multi-currency
  currencyAccounts: AnyRecord[]
  fxTransactions: AnyRecord[]
  addCurrencyAccount: (data: AnyRecord) => void
  updateCurrencyAccount: (id: string, data: AnyRecord) => void
  deleteCurrencyAccount: (id: string) => void
  addFxTransaction: (data: AnyRecord) => void

  // 401(k) Administration
  retirementPlans: AnyRecord[]
  retirementEnrollments: AnyRecord[]
  retirementContributions: AnyRecord[]
  addRetirementPlan: (data: AnyRecord) => void
  updateRetirementPlan: (id: string, data: AnyRecord) => void
  addRetirementEnrollment: (data: AnyRecord) => void
  updateRetirementEnrollment: (id: string, data: AnyRecord) => void
  addRetirementContribution: (data: AnyRecord) => void

  // Carrier Integration
  carrierIntegrations: AnyRecord[]
  enrollmentFeeds: AnyRecord[]
  addCarrierIntegration: (data: AnyRecord) => void
  updateCarrierIntegration: (id: string, data: AnyRecord) => void
  addEnrollmentFeed: (data: AnyRecord) => void

  // Geofencing
  geofenceZones: AnyRecord[]
  geofenceEvents: AnyRecord[]
  addGeofenceZone: (data: AnyRecord) => void
  updateGeofenceZone: (id: string, data: AnyRecord) => void
  deleteGeofenceZone: (id: string) => void
  addGeofenceEvent: (data: AnyRecord) => void

  // Identity Provider
  idpConfigurations: AnyRecord[]
  samlApps: AnyRecord[]
  mfaPolicies: AnyRecord[]
  addIdpConfiguration: (data: AnyRecord) => void
  updateIdpConfiguration: (id: string, data: AnyRecord) => void
  addSamlApp: (data: AnyRecord) => void
  updateSamlApp: (id: string, data: AnyRecord) => void
  addMfaPolicy: (data: AnyRecord) => void
  updateMfaPolicy: (id: string, data: AnyRecord) => void

  // Zero-touch Deployment
  deploymentProfiles: AnyRecord[]
  enrollmentTokens: AnyRecord[]
  addDeploymentProfile: (data: AnyRecord) => void
  updateDeploymentProfile: (id: string, data: AnyRecord) => void
  addEnrollmentToken: (data: AnyRecord) => void
  updateEnrollmentToken: (id: string, data: AnyRecord) => void

  // Password Manager
  passwordVaults: AnyRecord[]
  vaultItems: AnyRecord[]
  addPasswordVault: (data: AnyRecord) => void
  updatePasswordVault: (id: string, data: AnyRecord) => void
  addVaultItem: (data: AnyRecord) => void
  updateVaultItem: (id: string, data: AnyRecord) => void
  deleteVaultItem: (id: string) => void

  // Device Store / Buyback
  deviceStoreCatalog: AnyRecord[]
  deviceOrders: AnyRecord[]
  buybackRequests: AnyRecord[]
  addDeviceStoreCatalogItem: (data: AnyRecord) => void
  updateDeviceStoreCatalogItem: (id: string, data: AnyRecord) => void
  addDeviceOrder: (data: AnyRecord) => void
  updateDeviceOrder: (id: string, data: AnyRecord) => void
  addBuybackRequest: (data: AnyRecord) => void
  updateBuybackRequest: (id: string, data: AnyRecord) => void

  // No-code App Builder
  customApps: AnyRecord[]
  appPages: AnyRecord[]
  appComponents: AnyRecord[]
  appDataSources: AnyRecord[]
  addCustomApp: (data: AnyRecord) => void
  updateCustomApp: (id: string, data: AnyRecord) => void
  deleteCustomApp: (id: string) => void
  addAppPage: (data: AnyRecord) => void
  updateAppPage: (id: string, data: AnyRecord) => void
  addAppComponent: (data: AnyRecord) => void
  updateAppComponent: (id: string, data: AnyRecord) => void
  addAppDataSource: (data: AnyRecord) => void
  updateAppDataSource: (id: string, data: AnyRecord) => void

  // RQL / Custom Query Language
  savedQueries: AnyRecord[]
  querySchedules: AnyRecord[]
  addSavedQuery: (data: AnyRecord) => void
  updateSavedQuery: (id: string, data: AnyRecord) => void
  deleteSavedQuery: (id: string) => void
  addQuerySchedule: (data: AnyRecord) => void
  updateQuerySchedule: (id: string, data: AnyRecord) => void

  // EOR (Employer of Record)
  eorEntities: AnyRecord[]
  eorEmployees: AnyRecord[]
  eorContracts: AnyRecord[]
  addEorEntity: (data: AnyRecord) => void
  updateEorEntity: (id: string, data: AnyRecord) => void
  addEorEmployee: (data: AnyRecord) => void
  updateEorEmployee: (id: string, data: AnyRecord) => void
  addEorContract: (data: AnyRecord) => void
  updateEorContract: (id: string, data: AnyRecord) => void

  // Contractor of Record
  corContractors: AnyRecord[]
  corContracts: AnyRecord[]
  corPayments: AnyRecord[]
  addCorContractor: (data: AnyRecord) => void
  updateCorContractor: (id: string, data: AnyRecord) => void
  addCorContract: (data: AnyRecord) => void
  updateCorContract: (id: string, data: AnyRecord) => void
  addCorPayment: (data: AnyRecord) => void
  updateCorPayment: (id: string, data: AnyRecord) => void

  // Global Benefits
  globalBenefitPlans: AnyRecord[]
  countryBenefitConfigs: AnyRecord[]
  globalBenefitEnrollments: AnyRecord[]
  addGlobalBenefitPlan: (data: AnyRecord) => void
  updateGlobalBenefitPlan: (id: string, data: AnyRecord) => void
  addCountryBenefitConfig: (data: AnyRecord) => void
  updateCountryBenefitConfig: (id: string, data: AnyRecord) => void
  addGlobalBenefitEnrollment: (data: AnyRecord) => void
  updateGlobalBenefitEnrollment: (id: string, data: AnyRecord) => void

  // Workers' Compensation
  workersCompPolicies: AnyRecord[]
  workersCompClaims: AnyRecord[]
  workersCompClassCodes: AnyRecord[]
  workersCompAudits: AnyRecord[]
  addWorkersCompPolicy: (data: AnyRecord) => void
  updateWorkersCompPolicy: (id: string, data: AnyRecord) => void
  addWorkersCompClaim: (data: AnyRecord) => void
  updateWorkersCompClaim: (id: string, data: AnyRecord) => void
  addWorkersCompClassCode: (data: AnyRecord) => void
  updateWorkersCompClassCode: (id: string, data: AnyRecord) => void
  addWorkersCompAudit: (data: AnyRecord) => void
  updateWorkersCompAudit: (id: string, data: AnyRecord) => void
  // Groups
  groups: AnyRecord[]
  addGroup: (data: AnyRecord) => void
  updateGroup: (id: string, data: AnyRecord) => void
  deleteGroup: (id: string) => void

  // Provisioning Rules
  provisioningRules: AnyRecord[]
  addProvisioningRule: (data: AnyRecord) => void
  updateProvisioningRule: (id: string, data: AnyRecord) => void
  deleteProvisioningRule: (id: string) => void

  // Encryption Policies
  encryptionPolicies: AnyRecord[]
  addEncryptionPolicy: (data: AnyRecord) => void
  updateEncryptionPolicy: (id: string, data: AnyRecord) => void
  deleteEncryptionPolicy: (id: string) => void

  // SCIM Providers
  scimProviders: AnyRecord[]
  addScimProvider: (data: AnyRecord) => void
  updateScimProvider: (id: string, data: AnyRecord) => void
  deleteScimProvider: (id: string) => void

  // Auto Detection Scans
  autoDetectionScans: AnyRecord[]
  addAutoDetectionScan: (data: AnyRecord) => void
  updateAutoDetectionScan: (id: string, data: AnyRecord) => void
  deleteAutoDetectionScan: (id: string) => void

  // Shadow IT Detections
  shadowITDetections: AnyRecord[]
  addShadowITDetection: (data: AnyRecord) => void
  updateShadowITDetection: (id: string, data: AnyRecord) => void
  deleteShadowITDetection: (id: string) => void
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
function buildCurrentUser(emp: DemoData['demoEmployees'][number]): CurrentUser {
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
  const [org, setOrg] = useState<any>({ id: '', name: '', slug: '', logo_url: null, plan: 'enterprise', industry: '', size: '', country: '', created_at: '', updated_at: '' })
  const [departments, setDepartments] = useState<any[]>([])
  const [employees, setEmployees] = useState<any[]>([])
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => getStoredUser())
  const [goals, setGoals] = useState<any[]>([])
  const [reviewCycles, setReviewCycles] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [feedback, setFeedback] = useState<any[]>([])
  const [oneOnOnes, setOneOnOnes] = useState<any[]>([])
  const [recognitions, setRecognitions] = useState<any[]>([])
  const [competencyFramework, setCompetencyFramework] = useState<any[]>([])
  const [competencyRatings, setCompetencyRatings] = useState<any[]>([])
  const [pips, setPIPs] = useState<any[]>([])
  const [pipCheckIns, setPIPCheckIns] = useState<any[]>([])
  const [meritCycles, setMeritCycles] = useState<any[]>([])
  const [meritRecommendations, setMeritRecommendations] = useState<any[]>([])
  const [reviewTemplates, setReviewTemplates] = useState<any[]>([])
  const [compBands, setCompBands] = useState<any[]>([])
  const [salaryReviews, setSalaryReviews] = useState<any[]>([])
  const [equityGrants, setEquityGrants] = useState<any[]>([])
  const [compPlanningCycles, setCompPlanningCycles] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [learningPaths, setLearningPaths] = useState<any[]>([])
  const [liveSessions, setLiveSessions] = useState<any[]>([])
  const [courseBlocks, setCourseBlocks] = useState<any[]>([])
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [discussions, setDiscussions] = useState<any[]>([])
  const [studyGroups, setStudyGroups] = useState<any[]>([])
  const [complianceTraining, setComplianceTraining] = useState<any[]>([])
  const [autoEnrollRules, setAutoEnrollRules] = useState<any[]>([])
  const [assessmentAttempts, setAssessmentAttempts] = useState<any[]>([])
  const [learningAssignments, setLearningAssignments] = useState<any[]>([])
  const [coursePrerequisites, setCoursePrerequisites] = useState<any[]>([])
  const [scormPackages, setScormPackages] = useState<any[]>([])
  const [scormTracking, setScormTracking] = useState<any[]>([])
  const [contentLibrary, setContentLibrary] = useState<any[]>([])
  const [learnerBadges, setLearnerBadges] = useState<any[]>([])
  const [learnerPoints, setLearnerPoints] = useState<any[]>([])
  const [certificateTemplates, setCertificateTemplates] = useState<any[]>([])
  const [surveys, setSurveys] = useState<any[]>([])
  const [engagementScores, setEngagementScores] = useState<any[]>([])
  const [actionPlans, setActionPlans] = useState<any[]>([])
  const [surveyResponses, setSurveyResponses] = useState<any[]>([])
  const [surveyTemplates, setSurveyTemplates] = useState<any[]>([])
  const [surveySchedules, setSurveySchedules] = useState<any[]>([])
  const [surveyTriggers, setSurveyTriggers] = useState<any[]>([])
  const [openEndedResponses, setOpenEndedResponses] = useState<any[]>([])
  const [mentoringPrograms, setMentoringPrograms] = useState<any[]>([])
  const [mentoringPairs, setMentoringPairs] = useState<any[]>([])
  const [mentoringSessions, setMentoringSessions] = useState<any[]>([])
  const [mentoringGoals, setMentoringGoals] = useState<any[]>([])
  const [payrollRuns, setPayrollRuns] = useState<any[]>([])
  const [employeePayrollEntries, setEmployeePayrollEntries] = useState<any[]>([])
  const [contractorPayments, setContractorPayments] = useState<any[]>([])
  const [payrollSchedules, setPayrollSchedules] = useState<any[]>([])
  const [taxConfigs, setTaxConfigs] = useState<any[]>([])
  const [complianceIssues, setComplianceIssues] = useState<any[]>([])
  const [taxFilings, setTaxFilings] = useState<any[]>([])
  const [payrollApprovals, setPayrollApprovals] = useState<any[]>([])
  const [payrollApprovalConfig, setPayrollApprovalConfig] = useState<any[]>([])
  const [leaveRequests, setLeaveRequests] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [timeOffPolicies, setTimeOffPolicies] = useState<any[]>([])
  const [timeOffBalances, setTimeOffBalances] = useState<any[]>([])
  const [overtimeRules, setOvertimeRules] = useState<any[]>([])
  const [shifts_data, setShiftsData] = useState<any[]>([])
  const [benefitPlans, setBenefitPlans] = useState<any[]>([])
  const [benefitEnrollments, setBenefitEnrollments] = useState<any[]>([])
  const [benefitDependents, setBenefitDependents] = useState<any[]>([])
  const [lifeEvents, setLifeEvents] = useState<any[]>([])
  const [openEnrollmentPeriods, setOpenEnrollmentPeriods] = useState<any[]>([])
  const [cobraEvents, setCobraEvents] = useState<any[]>([])
  const [acaTracking, setAcaTracking] = useState<any[]>([])
  const [flexBenefitAccounts, setFlexBenefitAccounts] = useState<any[]>([])
  const [flexBenefitTransactions, setFlexBenefitTransactions] = useState<any[]>([])
  const [expenseReports, setExpenseReports] = useState<any[]>([])
  const [expensePolicies, setExpensePolicies] = useState<any[]>([])
  const [mileageLogs, setMileageLogs] = useState<any[]>([])
  const [receiptMatches, setReceiptMatches] = useState<any[]>([])
  const [mileageEntries, setMileageEntries] = useState<any[]>([])
  const [advancedExpensePolicies, setAdvancedExpensePolicies] = useState<any[]>([])
  const [reimbursementBatches, setReimbursementBatches] = useState<any[]>([])
  const [duplicateDetections, setDuplicateDetections] = useState<any[]>([])
  const [jobPostings, setJobPostings] = useState<any[]>([])
  const [applications, setApplications] = useState<any[]>([])
  const [careerSiteConfig, setCareerSiteConfig] = useState<any>({})
  const [jobDistributions, setJobDistributions] = useState<any[]>([])
  const [interviews, setInterviews] = useState<any[]>([])
  const [talentPools, setTalentPools] = useState<any[]>([])
  const [scoreCards, setScoreCards] = useState<any[]>([])
  const [backgroundChecks, setBackgroundChecks] = useState<any[]>([])
  const [referralProgram, setReferralProgram] = useState<any>({})
  const [referrals, setReferrals] = useState<any[]>([])
  const [knockoutQuestions, setKnockoutQuestions] = useState<any[]>([])
  const [candidateScheduling, setCandidateScheduling] = useState<any[]>([])
  const [devices, setDevices] = useState<any[]>([])
  const [softwareLicenses, setSoftwareLicenses] = useState<any[]>([])
  const [itRequests, setITRequests] = useState<any[]>([])
  const [managedDevices, setManagedDevices] = useState<any[]>([])
  const [deviceActions, setDeviceActions] = useState<any[]>([])
  const [appCatalog, setAppCatalog] = useState<any[]>([])
  const [appAssignments, setAppAssignments] = useState<any[]>([])
  const [securityPoliciesIT, setSecurityPoliciesIT] = useState<any[]>([])
  const [deviceInventory, setDeviceInventory] = useState<any[]>([])
  const [invoices, setInvoices] = useState<any[]>([])
  const [budgets, setBudgets] = useState<any[]>([])
  const [vendors, setVendors] = useState<any[]>([])
  // Project Management
  const [projects, setProjects] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [taskDependencies, setTaskDependencies] = useState<any[]>([])
  const [automationRules, setAutomationRules] = useState<any[]>([])
  const [automationLog, setAutomationLog] = useState<any[]>([])
  // Strategy Execution
  const [strategicObjectives, setStrategicObjectives] = useState<any[]>([])
  const [keyResults, setKeyResults] = useState<any[]>([])
  const [initiatives, setInitiatives] = useState<any[]>([])
  const [kpiDefinitions, setKPIDefinitions] = useState<any[]>([])
  const [kpiMeasurements, setKPIMeasurements] = useState<any[]>([])
  // Workflow Studio
  const [workflows, setWorkflows] = useState<any[]>([])
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([])
  const [workflowRuns, setWorkflowRuns] = useState<any[]>([])
  const [workflowTemplates, setWorkflowTemplates] = useState<any[]>([])
  // Automation Workflows
  const [automationWorkflows, setAutomationWorkflows] = useState<any[]>([])
  const [automationWorkflowSteps, setAutomationWorkflowSteps] = useState<any[]>([])
  const [automationWorkflowRuns, setAutomationWorkflowRuns] = useState<any[]>([])
  const [automationWorkflowRunSteps, setAutomationWorkflowRunSteps] = useState<any[]>([])
  const [automationWorkflowTemplates] = useState<any[]>([])
  // Headcount Planning
  const [headcountPlans, setHeadcountPlans] = useState<any[]>([])
  const [headcountPositions, setHeadcountPositions] = useState<any[]>([])
  const [headcountBudgetItems, setHeadcountBudgetItems] = useState<any[]>([])
  // Custom Fields
  const [customFieldDefinitions, setCustomFieldDefinitions] = useState<any[]>([])
  const [customFieldValues, setCustomFieldValues] = useState<any[]>([])
  // Emergency Contacts
  const [emergencyContacts, setEmergencyContacts] = useState<any[]>([])
  // Compliance Management
  const [complianceRequirements, setComplianceRequirements] = useState<any[]>([])
  const [complianceDocuments, setComplianceDocuments] = useState<any[]>([])
  const [complianceAlerts, setComplianceAlerts] = useState<any[]>([])
  // People / HR
  const [employeeDocuments, setEmployeeDocuments] = useState<any[]>([])
  const [employeeTimeline, setEmployeeTimeline] = useState<any[]>([])
  // Onboarding
  const [buddyAssignments, setBuddyAssignments] = useState<any[]>([])
  const [preboardingTasks, setPreboardingTasks] = useState<any[]>([])
  const [welcomeContent] = useState<any>({
    welcome_message: 'Welcome to the team! We\'re excited to have you on board.',
    mission_statement: 'Empowering organizations to build exceptional teams and drive meaningful impact across Africa and beyond.',
    company_values: [
      { icon: 'star', title: 'Excellence', description: 'We strive for the highest quality in everything we do.' },
      { icon: 'users', title: 'Collaboration', description: 'Together we achieve more than we ever could alone.' },
      { icon: 'lightbulb', title: 'Innovation', description: 'We embrace new ideas and creative solutions.' },
      { icon: 'heart', title: 'Empathy', description: 'We lead with understanding and compassion.' },
      { icon: 'shield', title: 'Integrity', description: 'We act with honesty, transparency, and accountability.' },
    ],
    first_week_schedule: [
      { day: 'Day 1', items: ['Team introduction & welcome', 'Office tour & workstation setup', 'Lunch with your buddy'] },
      { day: 'Day 2', items: ['HR orientation & benefits overview', 'IT systems access & training', 'Meet your manager 1:1'] },
      { day: 'Day 3', items: ['Department deep dive', 'Product walkthrough', 'Team standup participation'] },
      { day: 'Day 4', items: ['Shadow a colleague', 'Complete compliance training', 'First project introduction'] },
      { day: 'Day 5', items: ['Week 1 check-in with manager', 'Set 30-60-90 day goals', 'Team social'] },
    ],
    it_checklist: [
      { label: 'Email account setup', status: 'complete' },
      { label: 'Laptop provisioned', status: 'complete' },
      { label: 'Slack & Teams access', status: 'complete' },
      { label: 'VPN configuration', status: 'pending' },
      { label: 'Security training', status: 'pending' },
    ],
    communication_templates: [
      { id: 'welcome', name: 'Welcome Email', type: 'email', description: 'Sent to new hires before day 1' },
      { id: 'intro', name: 'Team Introduction', type: 'slack', description: 'Announces new hire to the team' },
      { id: 'checkin', name: '30-Day Check-in', type: 'email', description: 'Automated follow-up after first month' },
    ],
  })
  // Offboarding
  const [offboardingChecklists, setOffboardingChecklists] = useState<any[]>([])
  const [offboardingChecklistItems, setOffboardingChecklistItems] = useState<any[]>([])
  const [offboardingProcesses, setOffboardingProcesses] = useState<any[]>([])
  const [offboardingTasks, setOffboardingTasks] = useState<any[]>([])
  const [exitSurveys, setExitSurveys] = useState<any[]>([])
  // Notifications
  const [notifications, setNotifications] = useState<any[]>([])
  // Offers, Career Tracks, Market Benchmarks, Widget Preferences
  const [offers, setOffers] = useState<any[]>([])
  const [careerTracks] = useState<any[]>([])
  const [marketBenchmarks, setMarketBenchmarks] = useState<any[]>([])
  const [widgetPreferences, setWidgetPreferences] = useState<any>({})
  const [journeys, setJourneys] = useState<any[]>([])
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // ============================================================
  // GAP CLOSURE: New Feature State
  // ============================================================
  const [signatureDocuments, setSignatureDocuments] = useState<any[]>([])
  const [signatureTemplates, setSignatureTemplates] = useState<any[]>([])
  const [i9Forms, setI9Forms] = useState<any[]>([])
  const [everifyCases, setEverifyCases] = useState<any[]>([])
  const [peoConfigurations, setPeoConfigurations] = useState<any[]>([])
  const [coEmploymentRecords, setCoEmploymentRecords] = useState<any[]>([])
  const [sandboxEnvironments, setSandboxEnvironments] = useState<any[]>([])
  const [chatChannels, setChatChannels] = useState<any[]>([])
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatParticipants, setChatParticipants] = useState<any[]>([])
  const [interviewRecordings, setInterviewRecordings] = useState<any[]>([])
  const [interviewTranscriptions, setInterviewTranscriptions] = useState<any[]>([])
  const [videoScreenTemplates, setVideoScreenTemplates] = useState<any[]>([])
  const [videoScreenInvites, setVideoScreenInvites] = useState<any[]>([])
  const [videoScreenResponses, setVideoScreenResponses] = useState<any[]>([])
  const [corporateCards, setCorporateCards] = useState<any[]>([])
  const [cardTransactions, setCardTransactions] = useState<any[]>([])
  const [billPayments, setBillPayments] = useState<any[]>([])
  const [billPaySchedules, setBillPaySchedules] = useState<any[]>([])
  const [travelRequests, setTravelRequests] = useState<any[]>([])
  const [travelBookings, setTravelBookings] = useState<any[]>([])
  const [travelPolicies, setTravelPolicies] = useState<any[]>([])
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([])
  const [purchaseOrderItems, setPurchaseOrderItems] = useState<any[]>([])
  const [procurementRequests, setProcurementRequests] = useState<any[]>([])
  const [currencyAccounts, setCurrencyAccounts] = useState<any[]>([])
  const [fxTransactions, setFxTransactions] = useState<any[]>([])
  const [retirementPlans, setRetirementPlans] = useState<any[]>([])
  const [retirementEnrollments, setRetirementEnrollments] = useState<any[]>([])
  const [retirementContributions, setRetirementContributions] = useState<any[]>([])
  const [carrierIntegrations, setCarrierIntegrations] = useState<any[]>([])
  const [enrollmentFeeds, setEnrollmentFeeds] = useState<any[]>([])
  const [geofenceZones, setGeofenceZones] = useState<any[]>([])
  const [geofenceEvents, setGeofenceEvents] = useState<any[]>([])
  const [idpConfigurations, setIdpConfigurations] = useState<any[]>([])
  const [samlApps, setSamlApps] = useState<any[]>([])
  const [mfaPolicies, setMfaPolicies] = useState<any[]>([])
  const [deploymentProfiles, setDeploymentProfiles] = useState<any[]>([])
  const [enrollmentTokens, setEnrollmentTokens] = useState<any[]>([])
  const [passwordVaults, setPasswordVaults] = useState<any[]>([])
  const [vaultItems, setVaultItems] = useState<any[]>([])
  const [deviceStoreCatalog, setDeviceStoreCatalog] = useState<any[]>([])
  const [deviceOrders, setDeviceOrders] = useState<any[]>([])
  const [buybackRequests, setBuybackRequests] = useState<any[]>([])
  const [customApps, setCustomApps] = useState<any[]>([])
  const [appPages, setAppPages] = useState<any[]>([])
  const [appComponents, setAppComponents] = useState<any[]>([])
  const [appDataSources, setAppDataSources] = useState<any[]>([])
  const [savedQueries, setSavedQueries] = useState<any[]>([])
  const [querySchedules, setQuerySchedules] = useState<any[]>([])
  const [eorEntities, setEorEntities] = useState<any[]>([])
  const [eorEmployees, setEorEmployees] = useState<any[]>([])
  const [eorContracts, setEorContracts] = useState<any[]>([])
  const [corContractors, setCorContractors] = useState<any[]>([])
  const [corContracts, setCorContracts] = useState<any[]>([])
  const [corPayments, setCorPayments] = useState<any[]>([])
  const [globalBenefitPlans, setGlobalBenefitPlans] = useState<any[]>([])
  const [countryBenefitConfigs, setCountryBenefitConfigs] = useState<any[]>([])
  const [globalBenefitEnrollments, setGlobalBenefitEnrollments] = useState<any[]>([])
  const [workersCompPolicies, setWorkersCompPolicies] = useState<any[]>([])
  const [workersCompClaims, setWorkersCompClaims] = useState<any[]>([])
  const [workersCompClassCodes, setWorkersCompClassCodes] = useState<any[]>([])
  const [workersCompAudits, setWorkersCompAudits] = useState<any[]>([])
  const [groups, setGroups] = useState<any[]>([])
  const [provisioningRules, setProvisioningRules] = useState<any[]>([])
  const [encryptionPolicies, setEncryptionPolicies] = useState<any[]>([])
  const [scimProviders, setScimProviders] = useState<any[]>([])
  const [autoDetectionScans, setAutoDetectionScans] = useState<any[]>([])
  const [shadowITDetections, setShadowITDetections] = useState<any[]>([])

  const toastTimers = useRef<Map<string, NodeJS.Timeout>>(new Map())
  const hasFetched = useRef(false)
  const isDemoUserRef = useRef(false)
  const loadedModulesRef = useRef(new Set<string>())
  // Track current org ID for CRUD operations without causing re-renders
  const orgIdRef = useRef(org.id)
  useEffect(() => { orgIdRef.current = org.id }, [org.id])

  // Load all demo data for a specific org (used when switching between demo tenants)
  // Uses dynamic import so demo-data.ts (~323KB) is code-split into a separate chunk
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loadDemoData = useCallback(async (orgId: string) => {
    const mod = await loadDemoModule()
    const data = mod.getDemoDataForOrg(orgId)
    // Load top-level demo arrays that aren't org-specific
    if (mod.demoOneOnOnes) setOneOnOnes(mod.demoOneOnOnes as any)
    if (mod.demoRecognitions) setRecognitions(mod.demoRecognitions as any)
    if (mod.demoCompetencyFramework) setCompetencyFramework(mod.demoCompetencyFramework as any)
    if (mod.demoCompetencyRatings) setCompetencyRatings(mod.demoCompetencyRatings as any)
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
    if ((data as any).complianceTraining) setComplianceTraining((data as any).complianceTraining)
    if ((data as any).autoEnrollRules) setAutoEnrollRules((data as any).autoEnrollRules)
    if ((data as any).assessmentAttempts) setAssessmentAttempts((data as any).assessmentAttempts)
    if ((data as any).learningAssignments) setLearningAssignments((data as any).learningAssignments)
    if ((data as any).certificateTemplates) setCertificateTemplates((data as any).certificateTemplates)
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
    // Offboarding
    if ((data as any).offboardingChecklists) setOffboardingChecklists((data as any).offboardingChecklists)
    if ((data as any).offboardingChecklistItems) setOffboardingChecklistItems((data as any).offboardingChecklistItems)
    if ((data as any).offboardingProcesses) setOffboardingProcesses((data as any).offboardingProcesses)
    if ((data as any).offboardingTasks) setOffboardingTasks((data as any).offboardingTasks)
    if ((data as any).exitSurveys) setExitSurveys((data as any).exitSurveys)
    // Time & Attendance
    if ((data as any).timeEntries) setTimeEntries((data as any).timeEntries)
    if ((data as any).timeOffPolicies) setTimeOffPolicies((data as any).timeOffPolicies)
    if ((data as any).timeOffBalances) setTimeOffBalances((data as any).timeOffBalances)
    if ((data as any).overtimeRules) setOvertimeRules((data as any).overtimeRules)
    if ((data as any).shifts) setShiftsData((data as any).shifts)
    // Benefits enhancements
    if ((data as any).openEnrollmentPeriods) setOpenEnrollmentPeriods((data as any).openEnrollmentPeriods)
    if ((data as any).cobraEvents) setCobraEvents((data as any).cobraEvents)
    if ((data as any).acaTracking) setAcaTracking((data as any).acaTracking)
    if ((data as any).flexBenefitAccounts) setFlexBenefitAccounts((data as any).flexBenefitAccounts)
    if ((data as any).flexBenefitTransactions) setFlexBenefitTransactions((data as any).flexBenefitTransactions)
    // Expense enhancements
    if ((data as any).receiptMatches) setReceiptMatches((data as any).receiptMatches)
    if ((data as any).mileageEntries) setMileageEntries((data as any).mileageEntries)
    if ((data as any).advancedExpensePolicies) setAdvancedExpensePolicies((data as any).advancedExpensePolicies)
    if ((data as any).reimbursementBatches) setReimbursementBatches((data as any).reimbursementBatches)
    if ((data as any).duplicateDetections) setDuplicateDetections((data as any).duplicateDetections)
    // Recruiting enhancements
    if ((data as any).backgroundChecks) setBackgroundChecks((data as any).backgroundChecks)
    if ((data as any).referralProgram) setReferralProgram((data as any).referralProgram)
    if ((data as any).referrals) setReferrals((data as any).referrals)
    if ((data as any).knockoutQuestions) setKnockoutQuestions((data as any).knockoutQuestions)
    if ((data as any).candidateScheduling) setCandidateScheduling((data as any).candidateScheduling)
    // IT Cloud
    if ((data as any).managedDevices) setManagedDevices((data as any).managedDevices)
    if ((data as any).deviceActions) setDeviceActions((data as any).deviceActions)
    if ((data as any).appCatalog) setAppCatalog((data as any).appCatalog)
    if ((data as any).appAssignments) setAppAssignments((data as any).appAssignments)
    if ((data as any).securityPoliciesIT) setSecurityPoliciesIT((data as any).securityPoliciesIT)
    if ((data as any).deviceInventory) setDeviceInventory((data as any).deviceInventory)
    // PIPs/Merit/Templates
    if ((data as any).pips) setPIPs((data as any).pips)
    if ((data as any).pipCheckIns) setPIPCheckIns((data as any).pipCheckIns)
    if ((data as any).meritCycles) setMeritCycles((data as any).meritCycles)
    if ((data as any).meritRecommendations) setMeritRecommendations((data as any).meritRecommendations)
    if ((data as any).reviewTemplates) setReviewTemplates((data as any).reviewTemplates)
    // LMS enhancements
    if ((data as any).coursePrerequisites) setCoursePrerequisites((data as any).coursePrerequisites)
    if ((data as any).scormPackages) setScormPackages((data as any).scormPackages)
    if ((data as any).scormTracking) setScormTracking((data as any).scormTracking)
    if ((data as any).contentLibrary) setContentLibrary((data as any).contentLibrary)
    if ((data as any).learnerBadges) setLearnerBadges((data as any).learnerBadges)
    if ((data as any).learnerPoints) setLearnerPoints((data as any).learnerPoints)
    // Survey enhancements
    if ((data as any).surveyTemplates) setSurveyTemplates((data as any).surveyTemplates)
    if ((data as any).surveySchedules) setSurveySchedules((data as any).surveySchedules)
    if ((data as any).surveyTriggers) setSurveyTriggers((data as any).surveyTriggers)
    if ((data as any).openEndedResponses) setOpenEndedResponses((data as any).openEndedResponses)
    // Automation Workflows
    if ((data as any).automationWorkflows) setAutomationWorkflows((data as any).automationWorkflows)
    if ((data as any).automationWorkflowSteps) setAutomationWorkflowSteps((data as any).automationWorkflowSteps)
    if ((data as any).automationWorkflowRuns) setAutomationWorkflowRuns((data as any).automationWorkflowRuns)
    if ((data as any).automationWorkflowRunSteps) setAutomationWorkflowRunSteps((data as any).automationWorkflowRunSteps)
    // Headcount Planning
    if ((data as any).headcountPlans) setHeadcountPlans((data as any).headcountPlans)
    if ((data as any).headcountPositions) setHeadcountPositions((data as any).headcountPositions)
    if ((data as any).headcountBudgetItems) setHeadcountBudgetItems((data as any).headcountBudgetItems)
    // Custom Fields/Compliance
    if ((data as any).customFieldDefinitions) setCustomFieldDefinitions((data as any).customFieldDefinitions)
    if ((data as any).customFieldValues) setCustomFieldValues((data as any).customFieldValues)
    if ((data as any).emergencyContacts) setEmergencyContacts((data as any).emergencyContacts)
    if ((data as any).complianceRequirements) setComplianceRequirements((data as any).complianceRequirements)
    if ((data as any).complianceDocuments) setComplianceDocuments((data as any).complianceDocuments)
    if ((data as any).complianceAlerts) setComplianceAlerts((data as any).complianceAlerts)
    // GAP CLOSURE: Hydrate new feature state
    if ((data as any).signatureDocuments) setSignatureDocuments((data as any).signatureDocuments)
    if ((data as any).signatureTemplates) setSignatureTemplates((data as any).signatureTemplates)
    if ((data as any).i9Forms) setI9Forms((data as any).i9Forms)
    if ((data as any).everifyCases) setEverifyCases((data as any).everifyCases)
    if ((data as any).peoConfigurations) setPeoConfigurations((data as any).peoConfigurations)
    if ((data as any).coEmploymentRecords) setCoEmploymentRecords((data as any).coEmploymentRecords)
    if ((data as any).sandboxEnvironments) setSandboxEnvironments((data as any).sandboxEnvironments)
    if ((data as any).chatChannels) setChatChannels((data as any).chatChannels)
    if ((data as any).chatMessages) setChatMessages((data as any).chatMessages)
    if ((data as any).chatParticipants) setChatParticipants((data as any).chatParticipants)
    if ((data as any).interviewRecordings) setInterviewRecordings((data as any).interviewRecordings)
    if ((data as any).interviewTranscriptions) setInterviewTranscriptions((data as any).interviewTranscriptions)
    if ((data as any).videoScreenTemplates) setVideoScreenTemplates((data as any).videoScreenTemplates)
    if ((data as any).videoScreenInvites) setVideoScreenInvites((data as any).videoScreenInvites)
    if ((data as any).videoScreenResponses) setVideoScreenResponses((data as any).videoScreenResponses)
    if ((data as any).corporateCards) setCorporateCards((data as any).corporateCards)
    if ((data as any).cardTransactions) setCardTransactions((data as any).cardTransactions)
    if ((data as any).billPayments) setBillPayments((data as any).billPayments)
    if ((data as any).billPaySchedules) setBillPaySchedules((data as any).billPaySchedules)
    if ((data as any).travelRequests) setTravelRequests((data as any).travelRequests)
    if ((data as any).travelBookings) setTravelBookings((data as any).travelBookings)
    if ((data as any).travelPolicies) setTravelPolicies((data as any).travelPolicies)
    if ((data as any).purchaseOrders) setPurchaseOrders((data as any).purchaseOrders)
    if ((data as any).purchaseOrderItems) setPurchaseOrderItems((data as any).purchaseOrderItems)
    if ((data as any).procurementRequests) setProcurementRequests((data as any).procurementRequests)
    if ((data as any).currencyAccounts) setCurrencyAccounts((data as any).currencyAccounts)
    if ((data as any).fxTransactions) setFxTransactions((data as any).fxTransactions)
    if ((data as any).retirementPlans) setRetirementPlans((data as any).retirementPlans)
    if ((data as any).retirementEnrollments) setRetirementEnrollments((data as any).retirementEnrollments)
    if ((data as any).retirementContributions) setRetirementContributions((data as any).retirementContributions)
    if ((data as any).carrierIntegrations) setCarrierIntegrations((data as any).carrierIntegrations)
    if ((data as any).enrollmentFeeds) setEnrollmentFeeds((data as any).enrollmentFeeds)
    if ((data as any).geofenceZones) setGeofenceZones((data as any).geofenceZones)
    if ((data as any).geofenceEvents) setGeofenceEvents((data as any).geofenceEvents)
    if ((data as any).idpConfigurations) setIdpConfigurations((data as any).idpConfigurations)
    if ((data as any).samlApps) setSamlApps((data as any).samlApps)
    if ((data as any).mfaPolicies) setMfaPolicies((data as any).mfaPolicies)
    if ((data as any).deploymentProfiles) setDeploymentProfiles((data as any).deploymentProfiles)
    if ((data as any).enrollmentTokens) setEnrollmentTokens((data as any).enrollmentTokens)
    if ((data as any).passwordVaults) setPasswordVaults((data as any).passwordVaults)
    if ((data as any).vaultItems) setVaultItems((data as any).vaultItems)
    if ((data as any).deviceStoreCatalog) setDeviceStoreCatalog((data as any).deviceStoreCatalog)
    if ((data as any).deviceOrders) setDeviceOrders((data as any).deviceOrders)
    if ((data as any).buybackRequests) setBuybackRequests((data as any).buybackRequests)
    if ((data as any).customApps) setCustomApps((data as any).customApps)
    if ((data as any).appPages) setAppPages((data as any).appPages)
    if ((data as any).appComponents) setAppComponents((data as any).appComponents)
    if ((data as any).appDataSources) setAppDataSources((data as any).appDataSources)
    if ((data as any).savedQueries) setSavedQueries((data as any).savedQueries)
    if ((data as any).querySchedules) setQuerySchedules((data as any).querySchedules)
    if ((data as any).eorEntities) setEorEntities((data as any).eorEntities)
    if ((data as any).eorEmployees) setEorEmployees((data as any).eorEmployees)
    if ((data as any).eorContracts) setEorContracts((data as any).eorContracts)
    if ((data as any).corContractors) setCorContractors((data as any).corContractors)
    if ((data as any).corContracts) setCorContracts((data as any).corContracts)
    if ((data as any).corPayments) setCorPayments((data as any).corPayments)
    if ((data as any).globalBenefitPlans) setGlobalBenefitPlans((data as any).globalBenefitPlans)
    if ((data as any).countryBenefitConfigs) setCountryBenefitConfigs((data as any).countryBenefitConfigs)
    if ((data as any).globalBenefitEnrollments) setGlobalBenefitEnrollments((data as any).globalBenefitEnrollments)
    if ((data as any).workersCompPolicies) setWorkersCompPolicies((data as any).workersCompPolicies)
    if ((data as any).workersCompClaims) setWorkersCompClaims((data as any).workersCompClaims)
    if ((data as any).workersCompClassCodes) setWorkersCompClassCodes((data as any).workersCompClassCodes)
    if ((data as any).workersCompAudits) setWorkersCompAudits((data as any).workersCompAudits)
    if ((data as any).groups) setGroups((data as any).groups)
    if ((data as any).provisioningRules) setProvisioningRules((data as any).provisioningRules)
    if ((data as any).encryptionPolicies) setEncryptionPolicies((data as any).encryptionPolicies)
    if ((data as any).scimProviders) setScimProviders((data as any).scimProviders)
    if ((data as any).autoDetectionScans) setAutoDetectionScans((data as any).autoDetectionScans)
    if ((data as any).shadowITDetections) setShadowITDetections((data as any).shadowITDetections)
    /* eslint-enable @typescript-eslint/no-explicit-any */
    setAuditLog([])
    try { localStorage.setItem('tempo_current_org', orgId) } catch { /* ignore */ }
  }, [])

  // ---- Module setter registry for lazy loading ----
  // Maps store keys to their useState setter functions.
  // useState setters are stable references, so this object can be built once.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const moduleSetters = useRef<Record<string, (data: any) => void>>({})
  // Build once on first render
  if (Object.keys(moduleSetters.current).length === 0) {
    moduleSetters.current = {
      employees: (d) => setEmployees(d),
      departments: (d) => setDepartments(d),
      goals: (d) => setGoals(d),
      reviewCycles: (d) => setReviewCycles(d),
      reviews: (d) => setReviews(d),
      feedback: (d) => setFeedback(d),
      compBands: (d) => setCompBands(d),
      salaryReviews: (d) => setSalaryReviews(d),
      courses: (d) => setCourses(d),
      enrollments: (d) => setEnrollments(d),
      surveys: (d) => setSurveys(d),
      engagementScores: (d) => setEngagementScores(d),
      mentoringPrograms: (d) => setMentoringPrograms(d),
      mentoringPairs: (d) => setMentoringPairs(d),
      payrollRuns: (d) => setPayrollRuns(d),
      leaveRequests: (d) => setLeaveRequests(d),
      benefitPlans: (d) => setBenefitPlans(d),
      benefitEnrollments: (d) => setBenefitEnrollments(d),
      expenseReports: (d) => setExpenseReports(d),
      jobPostings: (d) => setJobPostings(d),
      applications: (d) => setApplications(d),
      devices: (d) => setDevices(d),
      softwareLicenses: (d) => setSoftwareLicenses(d),
      itRequests: (d) => setITRequests(d),
      invoices: (d) => setInvoices(d),
      budgets: (d) => setBudgets(d),
      vendors: (d) => setVendors(d),
      projects: (d) => setProjects(d),
      milestones: (d) => setMilestones(d),
      tasks: (d) => setTasks(d),
      strategicObjectives: (d) => setStrategicObjectives(d),
      keyResults: (d) => setKeyResults(d),
      initiatives: (d) => setInitiatives(d),
      kpiDefinitions: (d) => setKPIDefinitions(d),
      workflows: (d) => setWorkflows(d),
      workflowTemplates: (d) => setWorkflowTemplates(d),
      auditLog: (d) => setAuditLog(d),
      // Identity & Access
      idpConfigurations: (d) => setIdpConfigurations(d),
      samlApps: (d) => setSamlApps(d),
      mfaPolicies: (d) => setMfaPolicies(d),
      // Chat
      chatChannels: (d) => setChatChannels(d),
      chatMessages: (d) => setChatMessages(d),
      // Finance
      corporateCards: (d) => setCorporateCards(d),
      cardTransactions: (d) => setCardTransactions(d),
      billPayments: (d) => setBillPayments(d),
      currencyAccounts: (d) => setCurrencyAccounts(d),
      fxTransactions: (d) => setFxTransactions(d),
      // Travel
      travelRequests: (d) => setTravelRequests(d),
      travelBookings: (d) => setTravelBookings(d),
      // Documents
      signatureDocuments: (d) => setSignatureDocuments(d),
      signatureTemplates: (d) => setSignatureTemplates(d),
      // Workers' Compensation
      workersCompPolicies: (d) => setWorkersCompPolicies(d),
      workersCompClaims: (d) => setWorkersCompClaims(d),
      workersCompClassCodes: (d) => setWorkersCompClassCodes(d),
      workersCompAudits: (d) => setWorkersCompAudits(d),
      // Equity Grants
      equityGrants: (d) => setEquityGrants(d),
      // Payroll
      employeePayrollEntries: (d) => setEmployeePayrollEntries(d),
      contractorPayments: (d) => setContractorPayments(d),
      payrollSchedules: (d) => setPayrollSchedules(d),
      taxConfigs: (d) => setTaxConfigs(d),
      taxFilings: (d) => setTaxFilings(d),
      payrollApprovals: (d) => setPayrollApprovals(d),
      payrollApprovalConfig: (d) => setPayrollApprovalConfig(d),
      // Benefits (extended)
      benefitDependents: (d) => setBenefitDependents(d),
      lifeEvents: (d) => setLifeEvents(d),
      openEnrollmentPeriods: (d) => setOpenEnrollmentPeriods(d),
      cobraEvents: (d) => setCobraEvents(d),
      acaTracking: (d) => setAcaTracking(d),
      flexBenefitAccounts: (d) => setFlexBenefitAccounts(d),
      flexBenefitTransactions: (d) => setFlexBenefitTransactions(d),
      // Compliance
      complianceRequirements: (d) => setComplianceRequirements(d),
      complianceDocuments: (d) => setComplianceDocuments(d),
      complianceAlerts: (d) => setComplianceAlerts(d),
      // Engagement (extended)
      actionPlans: (d) => setActionPlans(d),
      surveyTemplates: (d) => setSurveyTemplates(d),
      surveySchedules: (d) => setSurveySchedules(d),
      surveyTriggers: (d) => setSurveyTriggers(d),
      openEndedResponses: (d) => setOpenEndedResponses(d),
      // Headcount Planning
      headcountPlans: (d) => setHeadcountPlans(d),
      headcountPositions: (d) => setHeadcountPositions(d),
      headcountBudgetItems: (d) => setHeadcountBudgetItems(d),
      // Compensation Planning
      compPlanningCycles: (d) => setCompPlanningCycles(d),
      // Mentoring (extended)
      mentoringSessions: (d) => setMentoringSessions(d),
      mentoringGoals: (d) => setMentoringGoals(d),
      // IT Devices (extended)
      deviceActions: (d) => setDeviceActions(d),
      appCatalog: (d) => setAppCatalog(d),
      appAssignments: (d) => setAppAssignments(d),
      deviceInventory: (d) => setDeviceInventory(d),
      deviceStoreCatalog: (d) => setDeviceStoreCatalog(d),
      deviceOrders: (d) => setDeviceOrders(d),
      // KPI Measurements
      kpiMeasurements: (d) => setKPIMeasurements(d),
      // Onboarding
      buddyAssignments: (d) => setBuddyAssignments(d),
      preboardingTasks: (d) => setPreboardingTasks(d),
      // Offboarding
      offboardingChecklists: (d) => setOffboardingChecklists(d),
      offboardingChecklistItems: (d) => setOffboardingChecklistItems(d),
      offboardingProcesses: (d) => setOffboardingProcesses(d),
      offboardingTasks: (d) => setOffboardingTasks(d),
      exitSurveys: (d) => setExitSurveys(d),
      // Time & Attendance
      timeEntries: (d) => setTimeEntries(d),
      timeOffPolicies: (d) => setTimeOffPolicies(d),
      timeOffBalances: (d) => setTimeOffBalances(d),
      overtimeRules: (d) => setOvertimeRules(d),
      shifts: (d) => setShiftsData(d),
      // Password Manager
      passwordVaults: (d) => setPasswordVaults(d),
      vaultItems: (d) => setVaultItems(d),
      // Bill Pay Schedules
      billPaySchedules: (d) => setBillPaySchedules(d),
      // Travel Policies
      travelPolicies: (d) => setTravelPolicies(d),
      // Groups
      groups: (d) => setGroups(d),
      // Identity (extended)
      scimProviders: (d) => setScimProviders(d),
      // IT Cloud (extended)
      managedDevices: (d) => setManagedDevices(d),
      securityPoliciesIT: (d) => setSecurityPoliciesIT(d),
      provisioningRules: (d) => setProvisioningRules(d),
      encryptionPolicies: (d) => setEncryptionPolicies(d),
      // Expense (extended)
      expensePolicies: (d) => setExpensePolicies(d),
      mileageLogs: (d) => setMileageLogs(d),
      mileageEntries: (d) => setMileageEntries(d),
      receiptMatches: (d) => setReceiptMatches(d),
      advancedExpensePolicies: (d) => setAdvancedExpensePolicies(d),
      reimbursementBatches: (d) => setReimbursementBatches(d),
      duplicateDetections: (d) => setDuplicateDetections(d),
      // Global Workforce (EOR/COR/PEO)
      eorEntities: (d) => setEorEntities(d),
      eorEmployees: (d) => setEorEmployees(d),
      eorContracts: (d) => setEorContracts(d),
      corContractors: (d) => setCorContractors(d),
      corContracts: (d) => setCorContracts(d),
      corPayments: (d) => setCorPayments(d),
      peoConfigurations: (d) => setPeoConfigurations(d),
      coEmploymentRecords: (d) => setCoEmploymentRecords(d),
      globalBenefitPlans: (d) => setGlobalBenefitPlans(d),
      countryBenefitConfigs: (d) => setCountryBenefitConfigs(d),
      // Workflow Studio (extended)
      workflowSteps: (d) => setWorkflowSteps(d),
      workflowRuns: (d) => setWorkflowRuns(d),
      // Automation Workflows
      automationWorkflows: (d) => setAutomationWorkflows(d),
      automationWorkflowSteps: (d) => setAutomationWorkflowSteps(d),
      automationWorkflowRuns: (d) => setAutomationWorkflowRuns(d),
      // App Studio
      customApps: (d) => setCustomApps(d),
      appPages: (d) => setAppPages(d),
      appComponents: (d) => setAppComponents(d),
      appDataSources: (d) => setAppDataSources(d),
      // Sandbox
      sandboxEnvironments: (d) => setSandboxEnvironments(d),
    }
  }

  /**
   * Lazily load modules from the per-module API.
   * - No-op for demo users (all data loaded from demo-data.ts)
   * - No-op for modules already loaded from DB
   * - Fetches missing modules in parallel and updates store state
   */
  const ensureModulesLoaded = useCallback(async (modules: string[]) => {
    // Demo users already have all data from loadDemoData()
    if (isDemoUserRef.current) return

    // Filter to modules that: (1) have a per-module API endpoint, (2) haven't been loaded yet
    const toFetch = modules.filter(
      (m) => MODULE_SLUGS[m] && !loadedModulesRef.current.has(m),
    )
    if (toFetch.length === 0) return

    try {
      const results = await fetchModulesFromAPI(toFetch)
      for (const [key, result] of Object.entries(results)) {
        const setter = moduleSetters.current[key]
        if (setter && result.data.length > 0) {
          setter(result.data as any)
        }
        // Mark as loaded even if empty (no data in DB for this org)
        loadedModulesRef.current.add(key)
      }
    } catch (err) {
      console.warn('Failed to load modules:', toFetch, err)
    }
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
            await loadDemoData(sessOrgId)
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
              await loadDemoData(cachedOrgId)
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

        // Step 2: Fetch core data from DB via per-module endpoints (not monolithic)
        // Skip DB fetch for demo users — their data was already loaded by loadDemoData()
        isDemoUserRef.current = isDemoUser
        if (!isDemoUser) {
          try {
            // Only fetch universally-needed modules on init (~2-3 queries instead of 40+)
            // Other modules are loaded lazily via ensureModulesLoaded() when their page mounts
            const coreData = await fetchModulesFromAPI(['employees', 'departments'])
            if (coreData.employees?.data?.length) setEmployees(coreData.employees.data as any)
            if (coreData.departments?.data?.length) setDepartments(coreData.departments.data as any)
            loadedModulesRef.current.add('employees')
            loadedModulesRef.current.add('departments')
          } catch (err) {
            console.warn('Failed to load core data from DB, using demo data:', err)
          }
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
      loadDemoModule().then(({ demoEmployees: demoEmps }) => {
        setJourneys(prev => prev.map(j => {
          const demoEmp = demoEmps.find(e => e.id === j.employee_id)
          const actualEmp = demoEmp ? employees.find(e => e.profile.full_name === demoEmp.profile.full_name) : null
          const demoAssigner = demoEmps.find(e => e.id === j.assigned_by)
          const actualAssigner = demoAssigner ? employees.find(e => e.profile.full_name === demoAssigner.profile.full_name) : null
          return {
            ...j,
            employee_id: actualEmp?.id || j.employee_id,
            assigned_by: actualAssigner?.id || j.assigned_by,
          }
        }))
      })
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
    const entry = {
      id: genId('audit'),
      user: currentUser?.full_name || 'Unknown User',
      action,
      entity_type,
      entity_id,
      details,
      timestamp: new Date().toISOString(),
    }
    setAuditLog(prev => [entry, ...prev])
    apiPost('auditLog', 'create', entry)
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
    apiPost('employeeDocuments', 'create', data)
  }, [logAudit, addToast])

  const updateEmployeeDocument = useCallback((id: string, data: AnyRecord) => {
    setEmployeeDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'employee_document', id, 'Updated document')
    addToast('Document updated')
    apiPost('employeeDocuments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Onboarding ----
  const addBuddyAssignment = useCallback((data: AnyRecord) => {
    const id = genId('buddy')
    setBuddyAssignments(prev => [...prev, { id, org_id: orgIdRef.current, assigned_date: new Date().toISOString().split('T')[0], ...data }] as typeof prev)
    logAudit('create', 'buddy_assignment', id, `Assigned buddy for ${data.new_hire_id}`)
    addToast('Buddy assigned')
    apiPost('buddyAssignments', 'create', data)
  }, [logAudit, addToast])

  const updateBuddyAssignment = useCallback((id: string, data: AnyRecord) => {
    setBuddyAssignments(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'buddy_assignment', id, 'Updated buddy assignment')
    addToast('Buddy assignment updated')
    apiPost('buddyAssignments', 'update', data, id)
  }, [logAudit, addToast])

  const addPreboardingTask = useCallback((data: AnyRecord) => {
    const id = genId('pbt')
    setPreboardingTasks(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'preboarding_task', id, `Created preboarding task: ${data.title}`)
    addToast('Preboarding task created')
    apiPost('preboarding_tasks', 'create', data)
  }, [logAudit, addToast])

  const updatePreboardingTask = useCallback((id: string, data: AnyRecord) => {
    setPreboardingTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'preboarding_task', id, 'Updated preboarding task')
    addToast('Preboarding task updated')
    apiPost('preboarding_tasks', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Offers ----
  const addOffer = useCallback((data: AnyRecord) => {
    const id = genId('offer')
    setOffers(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'offer', id, `Created offer for: ${data.candidate_name}`)
    addToast('Offer created')
    apiPost('offers', 'create', data)
  }, [logAudit, addToast])

  const updateOffer = useCallback((id: string, data: AnyRecord) => {
    setOffers(prev => prev.map(o => o.id === id ? { ...o, ...data } : o) as typeof prev)
    logAudit('update', 'offer', id, 'Updated offer')
    addToast('Offer updated')
    apiPost('offers', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Offboarding ----
  const addOffboardingChecklist = useCallback((data: AnyRecord) => {
    const id = genId('ob-cl')
    setOffboardingChecklists(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'offboarding_checklist', id, `Created checklist: ${data.name}`)
    addToast('Offboarding checklist created')
    apiPost('offboarding_checklists', 'create', data)
  }, [logAudit, addToast])

  const updateOffboardingChecklist = useCallback((id: string, data: AnyRecord) => {
    setOffboardingChecklists(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'offboarding_checklist', id, 'Updated offboarding checklist')
    addToast('Checklist updated')
    apiPost('offboarding_checklists', 'update', data, id)
  }, [logAudit, addToast])

  const addOffboardingChecklistItem = useCallback((data: AnyRecord) => {
    const id = genId('ob-cli')
    setOffboardingChecklistItems(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'offboarding_checklist_item', id, `Added item: ${data.title}`)
    addToast('Checklist item added')
    apiPost('offboarding_checklist_items', 'create', data)
  }, [logAudit, addToast])

  const updateOffboardingChecklistItem = useCallback((id: string, data: AnyRecord) => {
    setOffboardingChecklistItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'offboarding_checklist_item', id, 'Updated checklist item')
    addToast('Checklist item updated')
    apiPost('offboarding_checklist_items', 'update', data, id)
  }, [logAudit, addToast])

  const deleteOffboardingChecklistItem = useCallback((id: string) => {
    setOffboardingChecklistItems(prev => prev.filter(i => i.id !== id))
    logAudit('delete', 'offboarding_checklist_item', id, 'Deleted checklist item')
    addToast('Checklist item removed')
    apiPost('offboardingChecklistItems', 'delete', undefined, id)
  }, [logAudit, addToast])

  const addOffboardingProcess = useCallback((data: AnyRecord) => {
    const id = genId('ob-proc')
    setOffboardingProcesses(prev => [...prev, { id, org_id: orgIdRef.current, started_at: new Date().toISOString(), completed_at: null, ...data }] as typeof prev)
    logAudit('create', 'offboarding_process', id, `Initiated offboarding for ${getEmployeeName(data.employee_id)}`)
    addToast('Offboarding process initiated')
    apiPost('offboardingProcesses', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  const updateOffboardingProcess = useCallback((id: string, data: AnyRecord) => {
    setOffboardingProcesses(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'offboarding_process', id, 'Updated offboarding process')
    addToast('Offboarding process updated')
    apiPost('offboardingProcesses', 'update', data, id)
  }, [logAudit, addToast])

  const addOffboardingTask = useCallback((data: AnyRecord) => {
    const id = genId('ob-task')
    setOffboardingTasks(prev => [...prev, { id, completed_at: null, completed_by: null, notes: null, ...data }] as typeof prev)
    logAudit('create', 'offboarding_task', id, 'Created offboarding task')
    addToast('Offboarding task created')
    apiPost('offboardingTasks', 'create', data)
  }, [logAudit, addToast])

  const updateOffboardingTask = useCallback((id: string, data: AnyRecord) => {
    setOffboardingTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'offboarding_task', id, 'Updated offboarding task')
    addToast('Task updated')
    apiPost('offboardingTasks', 'update', data, id)
  }, [logAudit, addToast])

  const addExitSurvey = useCallback((data: AnyRecord) => {
    const id = genId('exit-survey')
    setExitSurveys(prev => [...prev, { id, org_id: orgIdRef.current, submitted_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'exit_survey', id, 'Exit survey submitted')
    addToast('Exit survey submitted')
    apiPost('exitSurveys', 'create', data)
  }, [logAudit, addToast])

  // ---- CRUD: Time Entries ----
  const addTimeEntry = useCallback((data: AnyRecord) => {
    const id = genId('te')
    setTimeEntries(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'time_entry', id, 'Logged time entry')
    addToast('Time entry recorded')
    apiPost('timeEntries', 'create', data)
  }, [logAudit, addToast])
  const updateTimeEntry = useCallback((id: string, data: AnyRecord) => {
    setTimeEntries(prev => prev.map(te => te.id === id ? { ...te, ...data } : te) as typeof prev)
    logAudit('update', 'time_entry', id, 'Updated time entry')
    addToast('Time entry updated')
    apiPost('timeEntries', 'update', data, id)
  }, [logAudit, addToast])
  const deleteTimeEntry = useCallback((id: string) => {
    setTimeEntries(prev => prev.filter(te => te.id !== id))
    logAudit('delete', 'time_entry', id, 'Deleted time entry')
    addToast('Time entry deleted')
    apiPost('timeEntries', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Time Off Policies ----
  const addTimeOffPolicy = useCallback((data: AnyRecord) => {
    const id = genId('top')
    setTimeOffPolicies(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'time_off_policy', id, `Created time off policy: ${data.name}`)
    addToast('Time off policy created')
    apiPost('timeOffPolicies', 'create', data)
  }, [logAudit, addToast])
  const updateTimeOffPolicy = useCallback((id: string, data: AnyRecord) => {
    setTimeOffPolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'time_off_policy', id, 'Updated time off policy')
    addToast('Time off policy updated')
    apiPost('timeOffPolicies', 'update', data, id)
  }, [logAudit, addToast])
  const deleteTimeOffPolicy = useCallback((id: string) => {
    setTimeOffPolicies(prev => prev.filter(p => p.id !== id))
    logAudit('delete', 'time_off_policy', id, 'Deleted time off policy')
    addToast('Time off policy deleted')
    apiPost('timeOffPolicies', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Time Off Balances ----
  const addTimeOffBalance = useCallback((data: AnyRecord) => {
    const id = genId('tob')
    setTimeOffBalances(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'time_off_balance', id, 'Added time off balance')
    addToast('Balance updated')
    apiPost('timeOffBalances', 'create', data)
  }, [logAudit, addToast])
  const updateTimeOffBalance = useCallback((id: string, data: AnyRecord) => {
    setTimeOffBalances(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'time_off_balance', id, 'Updated time off balance')
    addToast('Balance updated')
    apiPost('timeOffBalances', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Overtime Rules ----
  const addOvertimeRule = useCallback((data: AnyRecord) => {
    const id = genId('otr')
    setOvertimeRules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'overtime_rule', id, `Created overtime rule: ${data.name}`)
    addToast('Overtime rule created')
    apiPost('overtimeRules', 'create', data)
  }, [logAudit, addToast])
  const updateOvertimeRule = useCallback((id: string, data: AnyRecord) => {
    setOvertimeRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'overtime_rule', id, 'Updated overtime rule')
    addToast('Overtime rule updated')
    apiPost('overtimeRules', 'update', data, id)
  }, [logAudit, addToast])
  const deleteOvertimeRule = useCallback((id: string) => {
    setOvertimeRules(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'overtime_rule', id, 'Deleted overtime rule')
    addToast('Overtime rule deleted')
    apiPost('overtimeRules', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Shifts ----
  const addShift = useCallback((data: AnyRecord) => {
    const id = genId('sh')
    setShiftsData(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'shift', id, 'Created shift')
    addToast('Shift created')
    apiPost('shifts', 'create', data)
  }, [logAudit, addToast])
  const updateShift = useCallback((id: string, data: AnyRecord) => {
    setShiftsData(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'shift', id, 'Updated shift')
    addToast('Shift updated')
    apiPost('shifts', 'update', data, id)
  }, [logAudit, addToast])
  const deleteShift = useCallback((id: string) => {
    setShiftsData(prev => prev.filter(s => s.id !== id))
    logAudit('delete', 'shift', id, 'Deleted shift')
    addToast('Shift deleted')
    apiPost('shifts', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Open Enrollment Periods ----
  const addOpenEnrollmentPeriod = useCallback((data: AnyRecord) => {
    const id = genId('oep')
    setOpenEnrollmentPeriods(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), reminders_sent: 0, ...data }] as typeof prev)
    logAudit('create', 'open_enrollment', id, `Created enrollment period: ${data.name}`)
    addToast('Open enrollment period created')
    apiPost('openEnrollmentPeriods', 'create', data)
  }, [logAudit, addToast])
  const updateOpenEnrollmentPeriod = useCallback((id: string, data: AnyRecord) => {
    setOpenEnrollmentPeriods(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'open_enrollment', id, 'Updated enrollment period')
    addToast('Enrollment period updated')
    apiPost('openEnrollmentPeriods', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: COBRA Events ----
  const addCobraEvent = useCallback((data: AnyRecord) => {
    const id = genId('cobra')
    setCobraEvents(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'cobra_event', id, `Created COBRA event for ${getEmployeeName(data.employee_id)}`)
    addToast('COBRA event created')
    apiPost('cobraEvents', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updateCobraEvent = useCallback((id: string, data: AnyRecord) => {
    setCobraEvents(prev => prev.map(e => e.id === id ? { ...e, ...data } : e) as typeof prev)
    logAudit('update', 'cobra_event', id, 'Updated COBRA event')
    addToast('COBRA event updated')
    apiPost('cobraEvents', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: ACA Tracking ----
  const addAcaTracking = useCallback((data: AnyRecord) => {
    const id = genId('aca')
    setAcaTracking(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'aca_tracking', id, `Added ACA tracking for ${getEmployeeName(data.employee_id)}`)
    addToast('ACA tracking record added')
    apiPost('acaTracking', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updateAcaTracking = useCallback((id: string, data: AnyRecord) => {
    setAcaTracking(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'aca_tracking', id, 'Updated ACA tracking')
    addToast('ACA tracking updated')
    apiPost('acaTracking', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Flex Benefit Accounts ----
  const addFlexBenefitAccount = useCallback((data: AnyRecord) => {
    const id = genId('fba')
    setFlexBenefitAccounts(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'flex_benefit_account', id, `Created flex account for ${getEmployeeName(data.employee_id)}`)
    addToast('Flex benefit account created')
    apiPost('flexBenefitAccounts', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updateFlexBenefitAccount = useCallback((id: string, data: AnyRecord) => {
    setFlexBenefitAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'flex_benefit_account', id, 'Updated flex account')
    addToast('Flex benefit account updated')
    apiPost('flexBenefitAccounts', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Flex Benefit Transactions ----
  const addFlexBenefitTransaction = useCallback((data: AnyRecord) => {
    const id = genId('fbt')
    setFlexBenefitTransactions(prev => [...prev, { id, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'flex_transaction', id, `Added flex transaction: ${data.description}`)
    addToast('Transaction recorded')
    apiPost('flexBenefitTransactions', 'create', data)
  }, [logAudit, addToast])
  const updateFlexBenefitTransaction = useCallback((id: string, data: AnyRecord) => {
    setFlexBenefitTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'flex_transaction', id, 'Updated flex transaction')
    addToast('Transaction updated')
    apiPost('flexBenefitTransactions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Receipt Matches ----
  const addReceiptMatch = useCallback((data: AnyRecord) => {
    const id = genId('rm')
    setReceiptMatches(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'receipt_match', id, 'Created receipt match')
    addToast('Receipt match created')
    apiPost('receiptMatches', 'create', data)
  }, [logAudit, addToast])
  const updateReceiptMatch = useCallback((id: string, data: AnyRecord) => {
    setReceiptMatches(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'receipt_match', id, 'Updated receipt match')
    addToast('Receipt match updated')
    apiPost('receiptMatches', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Mileage Entries ----
  const addMileageEntry = useCallback((data: AnyRecord) => {
    const id = genId('me')
    setMileageEntries(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mileage_entry', id, 'Created mileage entry')
    addToast('Mileage entry added')
    apiPost('mileageEntries', 'create', data)
  }, [logAudit, addToast])
  const updateMileageEntry = useCallback((id: string, data: AnyRecord) => {
    setMileageEntries(prev => prev.map(m => m.id === id ? { ...m, ...data } : m) as typeof prev)
    logAudit('update', 'mileage_entry', id, 'Updated mileage entry')
    apiPost('mileageEntries', 'update', data, id)
  }, [logAudit])

  // ---- CRUD: Advanced Expense Policies ----
  const addAdvancedExpensePolicy = useCallback((data: AnyRecord) => {
    const id = genId('aep')
    setAdvancedExpensePolicies(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'advanced_expense_policy', id, `Created advanced policy: ${data.name}`)
    addToast('Expense policy created')
    apiPost('advancedExpensePolicies', 'create', data)
  }, [logAudit, addToast])
  const updateAdvancedExpensePolicy = useCallback((id: string, data: AnyRecord) => {
    setAdvancedExpensePolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'advanced_expense_policy', id, 'Updated advanced expense policy')
    addToast('Expense policy updated')
    apiPost('advancedExpensePolicies', 'update', data, id)
  }, [logAudit, addToast])
  const deleteAdvancedExpensePolicy = useCallback((id: string) => {
    setAdvancedExpensePolicies(prev => prev.filter(p => p.id !== id))
    logAudit('delete', 'advanced_expense_policy', id, 'Deleted advanced expense policy')
    addToast('Expense policy deleted')
    apiPost('advancedExpensePolicies', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Reimbursement Batches ----
  const addReimbursementBatch = useCallback((data: AnyRecord) => {
    const id = genId('rb')
    setReimbursementBatches(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'reimbursement_batch', id, 'Created reimbursement batch')
    addToast('Reimbursement batch created')
    apiPost('reimbursementBatches', 'create', data)
  }, [logAudit, addToast])
  const updateReimbursementBatch = useCallback((id: string, data: AnyRecord) => {
    setReimbursementBatches(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'reimbursement_batch', id, 'Updated reimbursement batch')
    addToast('Reimbursement batch updated')
    apiPost('reimbursementBatches', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Duplicate Detections ----
  const addDuplicateDetection = useCallback((data: AnyRecord) => {
    const id = genId('dd')
    setDuplicateDetections(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'duplicate_detection', id, 'Flagged duplicate expense')
    addToast('Duplicate expense flagged')
    apiPost('duplicateDetections', 'create', data)
  }, [logAudit, addToast])
  const updateDuplicateDetection = useCallback((id: string, data: AnyRecord) => {
    setDuplicateDetections(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    const action = data.status === 'confirmed_duplicate' ? 'Confirmed duplicate' : data.status === 'dismissed' ? 'Dismissed flag' : 'Updated'
    logAudit('update', 'duplicate_detection', id, action)
    addToast(`Duplicate ${action.toLowerCase()}`)
    apiPost('duplicateDetections', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Background Checks ----
  const addBackgroundCheck = useCallback((data: AnyRecord) => {
    const id = genId('bgc')
    setBackgroundChecks(prev => [...prev, { id, org_id: orgIdRef.current, requested_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'background_check', id, `Requested background check for ${data.candidate_name || 'candidate'}`)
    addToast('Background check requested')
    apiPost('backgroundChecks', 'create', data)
  }, [logAudit, addToast])
  const updateBackgroundCheck = useCallback((id: string, data: AnyRecord) => {
    setBackgroundChecks(prev => prev.map(bc => bc.id === id ? { ...bc, ...data } : bc) as typeof prev)
    logAudit('update', 'background_check', id, 'Updated background check')
    addToast('Background check updated')
    apiPost('backgroundChecks', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Referral Program ----
  const updateReferralProgram = useCallback((data: AnyRecord) => {
    setReferralProgram((prev: any) => ({ ...prev, ...data }))
    logAudit('update', 'referral_program', 'config', 'Updated referral program')
    addToast('Referral program updated')
    apiPost('referralProgram', 'update', data)
  }, [logAudit, addToast])

  // ---- CRUD: Referrals ----
  const addReferral = useCallback((data: AnyRecord) => {
    const id = genId('ref')
    setReferrals(prev => [...prev, { id, org_id: orgIdRef.current, submitted_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'referral', id, `Submitted referral: ${data.candidate_name}`)
    addToast('Referral submitted')
    apiPost('referrals', 'create', data)
  }, [logAudit, addToast])
  const updateReferral = useCallback((id: string, data: AnyRecord) => {
    setReferrals(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'referral', id, 'Updated referral')
    addToast('Referral updated')
    apiPost('referrals', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Knockout Questions ----
  const addKnockoutQuestion = useCallback((data: AnyRecord) => {
    const id = genId('kq')
    setKnockoutQuestions(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'knockout_question', id, 'Added screening question')
    addToast('Screening question added')
    apiPost('knockoutQuestions', 'create', data)
  }, [logAudit, addToast])
  const updateKnockoutQuestion = useCallback((id: string, data: AnyRecord) => {
    setKnockoutQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q) as typeof prev)
    logAudit('update', 'knockout_question', id, 'Updated screening question')
    addToast('Screening question updated')
    apiPost('knockoutQuestions', 'update', data, id)
  }, [logAudit, addToast])
  const deleteKnockoutQuestion = useCallback((id: string) => {
    setKnockoutQuestions(prev => prev.filter(q => q.id !== id))
    logAudit('delete', 'knockout_question', id, 'Deleted screening question')
    addToast('Screening question removed')
    apiPost('knockoutQuestions', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Candidate Scheduling ----
  const addCandidateScheduling = useCallback((data: AnyRecord) => {
    const id = genId('cs')
    setCandidateScheduling(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'candidate_scheduling', id, 'Sent scheduling link to candidate')
    addToast('Scheduling link sent')
    apiPost('candidateScheduling', 'create', data)
  }, [logAudit, addToast])
  const updateCandidateScheduling = useCallback((id: string, data: AnyRecord) => {
    setCandidateScheduling(prev => prev.map(cs => cs.id === id ? { ...cs, ...data } : cs) as typeof prev)
    logAudit('update', 'candidate_scheduling', id, 'Updated scheduling')
    addToast('Scheduling updated')
    apiPost('candidateScheduling', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT Cloud — Managed Devices ----
  const addManagedDevice = useCallback((data: AnyRecord) => {
    const id = genId('md')
    setManagedDevices(prev => [...prev, { id, org_id: orgIdRef.current, enrolledAt: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'managed_device', id, `Enrolled device: ${data.name}`)
    addToast('Device enrolled')
    apiPost('managedDevices', 'create', data)
  }, [logAudit, addToast])
  const updateManagedDevice = useCallback((id: string, data: AnyRecord) => {
    setManagedDevices(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'managed_device', id, 'Updated managed device')
    addToast('Device updated')
    apiPost('managedDevices', 'update', data, id)
  }, [logAudit, addToast])
  const deleteManagedDevice = useCallback((id: string) => {
    setManagedDevices(prev => prev.filter(d => d.id !== id))
    setDeviceActions(prev => prev.filter(a => a.deviceId !== id))
    logAudit('delete', 'managed_device', id, 'Removed managed device')
    addToast('Device removed')
    apiPost('managedDevices', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT Cloud — Device Actions ----
  const addDeviceAction = useCallback((data: AnyRecord) => {
    const id = genId('da')
    setDeviceActions(prev => [...prev, { id, org_id: orgIdRef.current, createdAt: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'device_action', id, `Initiated ${data.actionType} on device`)
    addToast(`Device action "${data.actionType}" initiated`)
    apiPost('deviceActions', 'create', data)
  }, [logAudit, addToast])
  const updateDeviceAction = useCallback((id: string, data: AnyRecord) => {
    setDeviceActions(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'device_action', id, 'Updated device action')
    addToast('Device action updated')
    apiPost('deviceActions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT Cloud — App Catalog ----
  const addAppCatalogItem = useCallback((data: AnyRecord) => {
    const id = genId('app')
    setAppCatalog(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'app_catalog', id, `Added app: ${data.name}`)
    addToast(`App "${data.name}" added to catalog`)
    apiPost('appCatalog', 'create', data)
  }, [logAudit, addToast])
  const updateAppCatalogItem = useCallback((id: string, data: AnyRecord) => {
    setAppCatalog(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'app_catalog', id, 'Updated app catalog entry')
    addToast('App updated')
    apiPost('appCatalog', 'update', data, id)
  }, [logAudit, addToast])
  const deleteAppCatalogItem = useCallback((id: string) => {
    setAppCatalog(prev => prev.filter(a => a.id !== id))
    setAppAssignments(prev => prev.filter(a => a.appId !== id))
    logAudit('delete', 'app_catalog', id, 'Removed app from catalog')
    addToast('App removed from catalog')
    apiPost('appCatalog', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT Cloud — App Assignments ----
  const addAppAssignment = useCallback((data: AnyRecord) => {
    const id = genId('aa')
    setAppAssignments(prev => [...prev, { id, org_id: orgIdRef.current, assignedAt: new Date().toISOString(), ...data }] as typeof prev)
    if (data.appId) {
      setAppCatalog(prev => prev.map(a => a.id === data.appId ? { ...a, assignedCount: (a.assignedCount || 0) + 1 } : a) as typeof prev)
    }
    logAudit('create', 'app_assignment', id, `Assigned app ${data.appId} to employee`)
    addToast('App assigned')
    apiPost('appAssignments', 'create', data)
  }, [logAudit, addToast])
  const updateAppAssignment = useCallback((id: string, data: AnyRecord) => {
    setAppAssignments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'app_assignment', id, 'Updated app assignment')
    addToast('App assignment updated')
    apiPost('appAssignments', 'update', data, id)
  }, [logAudit, addToast])
  const deleteAppAssignment = useCallback((id: string) => {
    const assignment = appAssignments.find(a => a.id === id)
    setAppAssignments(prev => prev.filter(a => a.id !== id))
    if (assignment?.appId) {
      setAppCatalog(prev => prev.map(a => a.id === assignment.appId ? { ...a, assignedCount: Math.max(0, (a.assignedCount || 0) - 1) } : a) as typeof prev)
    }
    logAudit('delete', 'app_assignment', id, 'Removed app assignment')
    addToast('App unassigned')
    apiPost('appAssignments', 'delete', undefined, id)
  }, [logAudit, addToast, appAssignments])

  // ---- CRUD: IT Cloud — Security Policies ----
  const addSecurityPolicyIT = useCallback((data: AnyRecord) => {
    const id = genId('sp')
    setSecurityPoliciesIT(prev => [...prev, { id, org_id: orgIdRef.current, createdAt: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'security_policy', id, `Created policy: ${data.name}`)
    addToast('Security policy created')
    apiPost('securityPoliciesIT', 'create', data)
  }, [logAudit, addToast])
  const updateSecurityPolicyIT = useCallback((id: string, data: AnyRecord) => {
    setSecurityPoliciesIT(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'security_policy', id, 'Updated security policy')
    addToast('Security policy updated')
    apiPost('securityPoliciesIT', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSecurityPolicyIT = useCallback((id: string) => {
    setSecurityPoliciesIT(prev => prev.filter(p => p.id !== id))
    logAudit('delete', 'security_policy', id, 'Deleted security policy')
    addToast('Security policy deleted')
    apiPost('securityPoliciesIT', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: IT Cloud — Device Inventory ----
  const addDeviceInventoryItem = useCallback((data: AnyRecord) => {
    const id = genId('inv-it')
    setDeviceInventory(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'device_inventory', id, `Added inventory item: ${data.name}`)
    addToast('Inventory item added')
    apiPost('deviceInventory', 'create', data)
  }, [logAudit, addToast])
  const updateDeviceInventoryItem = useCallback((id: string, data: AnyRecord) => {
    setDeviceInventory(prev => prev.map(i => i.id === id ? { ...i, ...data } : i) as typeof prev)
    logAudit('update', 'device_inventory', id, 'Updated inventory item')
    addToast('Inventory item updated')
    apiPost('deviceInventory', 'update', data, id)
  }, [logAudit, addToast])
  const deleteDeviceInventoryItem = useCallback((id: string) => {
    setDeviceInventory(prev => prev.filter(i => i.id !== id))
    logAudit('delete', 'device_inventory', id, 'Deleted inventory item')
    addToast('Inventory item deleted')
    apiPost('deviceInventory', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: PIPs ----
  const addPIP = useCallback((data: AnyRecord) => {
    const id = genId('pip')
    setPIPs(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'pip', id, `Created PIP for ${getEmployeeName(data.employee_id)}`)
    addToast('Performance Improvement Plan created')
    apiPost('pips', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updatePIP = useCallback((id: string, data: AnyRecord) => {
    setPIPs(prev => prev.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p) as typeof prev)
    logAudit('update', 'pip', id, 'Updated PIP')
    addToast('PIP updated')
    apiPost('pips', 'update', data, id)
  }, [logAudit, addToast])
  const deletePIP = useCallback((id: string) => {
    setPIPs(prev => prev.filter(p => p.id !== id))
    setPIPCheckIns(prev => prev.filter(c => c.pip_id !== id))
    logAudit('delete', 'pip', id, 'Deleted PIP')
    addToast('PIP deleted')
    apiPost('pips', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: PIP Check-Ins ----
  const addPIPCheckIn = useCallback((data: AnyRecord) => {
    const id = genId('pip-ci')
    setPIPCheckIns(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'pip_checkin', id, 'Added PIP check-in')
    addToast('PIP check-in recorded')
    apiPost('pipCheckIns', 'create', data)
  }, [logAudit, addToast])

  // ---- CRUD: Merit Cycles ----
  const addMeritCycle = useCallback((data: AnyRecord) => {
    const id = genId('merit')
    setMeritCycles(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'merit_cycle', id, `Created merit cycle: ${data.name}`)
    addToast('Merit cycle created')
    apiPost('meritCycles', 'create', data)
  }, [logAudit, addToast])
  const updateMeritCycle = useCallback((id: string, data: AnyRecord) => {
    setMeritCycles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'merit_cycle', id, 'Updated merit cycle')
    addToast('Merit cycle updated')
    apiPost('meritCycles', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Merit Recommendations ----
  const addMeritRecommendation = useCallback((data: AnyRecord) => {
    const id = genId('mr')
    setMeritRecommendations(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'merit_recommendation', id, `Submitted merit recommendation for ${getEmployeeName(data.employee_id)}`)
    addToast('Merit recommendation submitted')
    apiPost('meritRecommendations', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updateMeritRecommendation = useCallback((id: string, data: AnyRecord) => {
    setMeritRecommendations(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    const action = data.status === 'final_approved' ? 'Approved' : data.status === 'rejected' ? 'Rejected' : 'Updated'
    logAudit('update', 'merit_recommendation', id, `${action} merit recommendation`)
    addToast(`Merit recommendation ${action.toLowerCase()}`)
    apiPost('meritRecommendations', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Review Templates ----
  const addReviewTemplate = useCallback((data: AnyRecord) => {
    const id = genId('rt')
    setReviewTemplates(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'review_template', id, `Created review template: ${data.name}`)
    addToast('Review template created')
    apiPost('reviewTemplates', 'create', data)
  }, [logAudit, addToast])
  const updateReviewTemplate = useCallback((id: string, data: AnyRecord) => {
    setReviewTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'review_template', id, 'Updated review template')
    addToast('Review template updated')
    apiPost('reviewTemplates', 'update', data, id)
  }, [logAudit, addToast])
  const deleteReviewTemplate = useCallback((id: string) => {
    setReviewTemplates(prev => prev.filter(t => t.id !== id))
    logAudit('delete', 'review_template', id, 'Deleted review template')
    addToast('Review template deleted')
    apiPost('reviewTemplates', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Course Prerequisites ----
  const addCoursePrerequisite = useCallback((data: AnyRecord) => { const id = genId('prereq'); setCoursePrerequisites(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev); logAudit('create', 'course_prerequisite', id, 'Added prerequisite'); addToast('Prerequisite added'); apiPost('coursePrerequisites', 'create', data) }, [logAudit, addToast])
  const deleteCoursePrerequisite = useCallback((id: string) => { setCoursePrerequisites(prev => prev.filter(p => p.id !== id)); logAudit('delete', 'course_prerequisite', id, 'Removed prerequisite'); addToast('Prerequisite removed'); apiPost('coursePrerequisites', 'delete', undefined, id) }, [logAudit, addToast])

  // ---- CRUD: SCORM Packages ----
  const addScormPackage = useCallback((data: AnyRecord) => { const id = genId('scorm'); setScormPackages(prev => [...prev, { id, org_id: orgIdRef.current, uploaded_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'scorm_package', id, 'Uploaded SCORM package'); addToast('SCORM package uploaded'); apiPost('scormPackages', 'create', data) }, [logAudit, addToast])
  const updateScormPackage = useCallback((id: string, data: AnyRecord) => { setScormPackages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev); logAudit('update', 'scorm_package', id, 'Updated SCORM package'); apiPost('scormPackages', 'update', data, id) }, [logAudit])

  // ---- CRUD: SCORM Tracking ----
  const addScormTracking = useCallback((data: AnyRecord) => { const id = genId('st'); setScormTracking(prev => [...prev, { id, org_id: orgIdRef.current, last_accessed: new Date().toISOString(), ...data }] as typeof prev); apiPost('scormTracking', 'create', data) }, [])
  const updateScormTracking = useCallback((id: string, data: AnyRecord) => { setScormTracking(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev); apiPost('scormTracking', 'update', data, id) }, [])

  // ---- CRUD: Content Library ----
  const addContentLibraryItem = useCallback((data: AnyRecord) => { const id = genId('cl'); setContentLibrary(prev => [...prev, { id, org_id: orgIdRef.current, added_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'content_library', id, `Added content: ${data.title}`); addToast('Content added to library'); apiPost('contentLibrary', 'create', data) }, [logAudit, addToast])
  const updateContentLibraryItem = useCallback((id: string, data: AnyRecord) => { setContentLibrary(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev); logAudit('update', 'content_library', id, 'Updated content'); addToast('Content updated'); apiPost('contentLibrary', 'update', data, id) }, [logAudit, addToast])
  const deleteContentLibraryItem = useCallback((id: string) => { setContentLibrary(prev => prev.filter(c => c.id !== id)); logAudit('delete', 'content_library', id, 'Removed content'); addToast('Content removed'); apiPost('contentLibrary', 'delete', undefined, id) }, [logAudit, addToast])

  // ---- CRUD: Learner Badges ----
  const addLearnerBadge = useCallback((data: AnyRecord) => { const id = genId('badge'); setLearnerBadges(prev => [...prev, { id, org_id: orgIdRef.current, earned_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'learner_badge', id, `Awarded badge: ${data.badge_name}`); addToast(`Badge earned: ${data.badge_name}`); apiPost('learnerBadges', 'create', data) }, [logAudit, addToast])

  // ---- CRUD: Learner Points ----
  const addLearnerPoints = useCallback((data: AnyRecord) => { const id = genId('lp'); setLearnerPoints(prev => [...prev, { id, org_id: orgIdRef.current, earned_at: new Date().toISOString(), ...data }] as typeof prev); apiPost('learnerPoints', 'create', data) }, [])

  // ---- CRUD: Certificate Templates ----
  const addCertificateTemplate = useCallback((data: AnyRecord) => { const id = genId('cert-tpl'); setCertificateTemplates(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'certificate_template', id, `Created template: ${data.name}`); addToast('Certificate template created'); apiPost('certificateTemplates', 'create', data) }, [logAudit, addToast])
  const updateCertificateTemplate = useCallback((id: string, data: AnyRecord) => { setCertificateTemplates(prev => prev.map(ct => ct.id === id ? { ...ct, ...data } : ct) as typeof prev); logAudit('update', 'certificate_template', id, 'Updated certificate template'); addToast('Certificate template updated'); apiPost('certificateTemplates', 'update', data, id) }, [logAudit, addToast])

  // ---- CRUD: Survey Templates ----
  const addSurveyTemplate = useCallback((data: AnyRecord) => {
    const id = genId('tpl')
    setSurveyTemplates(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), usageCount: 0, isDefault: false, ...data }] as typeof prev)
    logAudit('create', 'survey_template', id, `Created survey template: ${data.name}`)
    addToast('Survey template created')
    apiPost('surveyTemplates', 'create', data)
  }, [logAudit, addToast])
  const updateSurveyTemplate = useCallback((id: string, data: AnyRecord) => {
    setSurveyTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'survey_template', id, 'Updated survey template')
    addToast('Survey template updated')
    apiPost('surveyTemplates', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSurveyTemplate = useCallback((id: string) => {
    setSurveyTemplates(prev => prev.filter(t => t.id !== id))
    logAudit('delete', 'survey_template', id, 'Deleted survey template')
    addToast('Survey template deleted')
    apiPost('surveyTemplates', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Survey Schedules ----
  const addSurveySchedule = useCallback((data: AnyRecord) => {
    const id = genId('sched')
    setSurveySchedules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), is_active: true, ...data }] as typeof prev)
    logAudit('create', 'survey_schedule', id, 'Created survey schedule')
    addToast('Survey schedule created')
    apiPost('surveySchedules', 'create', data)
  }, [logAudit, addToast])
  const updateSurveySchedule = useCallback((id: string, data: AnyRecord) => {
    setSurveySchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'survey_schedule', id, 'Updated survey schedule')
    addToast('Survey schedule updated')
    apiPost('surveySchedules', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSurveySchedule = useCallback((id: string) => {
    setSurveySchedules(prev => prev.filter(s => s.id !== id))
    logAudit('delete', 'survey_schedule', id, 'Deleted survey schedule')
    addToast('Survey schedule deleted')
    apiPost('surveySchedules', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Survey Triggers ----
  const addSurveyTrigger = useCallback((data: AnyRecord) => {
    const id = genId('trig')
    setSurveyTriggers(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), is_active: true, recent_firings: [], ...data }] as typeof prev)
    logAudit('create', 'survey_trigger', id, 'Created survey trigger')
    addToast('Survey trigger created')
    apiPost('surveyTriggers', 'create', data)
  }, [logAudit, addToast])
  const updateSurveyTrigger = useCallback((id: string, data: AnyRecord) => {
    setSurveyTriggers(prev => prev.map(t => t.id === id ? { ...t, ...data } : t) as typeof prev)
    logAudit('update', 'survey_trigger', id, 'Updated survey trigger')
    addToast('Survey trigger updated')
    apiPost('surveyTriggers', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSurveyTrigger = useCallback((id: string) => {
    setSurveyTriggers(prev => prev.filter(t => t.id !== id))
    logAudit('delete', 'survey_trigger', id, 'Deleted survey trigger')
    addToast('Survey trigger deleted')
    apiPost('surveyTriggers', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Open-Ended Responses ----
  const addOpenEndedResponse = useCallback((data: AnyRecord) => {
    const id = genId('oer')
    setOpenEndedResponses(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    apiPost('openEndedResponses', 'create', data)
  }, [])
  const updateOpenEndedResponse = useCallback((id: string, data: AnyRecord) => {
    setOpenEndedResponses(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    apiPost('openEndedResponses', 'update', data, id)
  }, [])

  // ---- CRUD: Automation Workflows ----
  const addAutomationWorkflow = useCallback((data: AnyRecord) => {
    const id = genId('awf')
    setAutomationWorkflows(prev => [...prev, { id, org_id: orgIdRef.current, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'automation_workflow', id, `Created automation workflow: ${data.name}`)
    addToast('Workflow created')
    apiPost('automationWorkflows', 'create', data)
    return id
  }, [logAudit, addToast])
  const updateAutomationWorkflow = useCallback((id: string, data: AnyRecord) => {
    setAutomationWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...data, updatedAt: new Date().toISOString() } : w) as typeof prev)
    logAudit('update', 'automation_workflow', id, 'Updated automation workflow')
    addToast('Workflow updated')
    apiPost('automationWorkflows', 'update', data, id)
  }, [logAudit, addToast])
  const deleteAutomationWorkflow = useCallback((id: string) => {
    setAutomationWorkflows(prev => prev.filter(w => w.id !== id))
    setAutomationWorkflowSteps(prev => prev.filter(s => s.workflowId !== id))
    logAudit('delete', 'automation_workflow', id, 'Deleted automation workflow')
    addToast('Workflow deleted')
    apiPost('automationWorkflows', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Automation Workflow Steps ----
  const addAutomationWorkflowStep = useCallback((data: AnyRecord) => {
    const id = genId('aws')
    setAutomationWorkflowSteps(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'automation_workflow_step', id, 'Added step to workflow')
    addToast('Step added')
    apiPost('automationWorkflowSteps', 'create', data)
  }, [logAudit, addToast])
  const updateAutomationWorkflowStep = useCallback((id: string, data: AnyRecord) => {
    setAutomationWorkflowSteps(prev => prev.map(s => s.id === id ? { ...s, ...data } : s) as typeof prev)
    logAudit('update', 'automation_workflow_step', id, 'Updated automation step')
    apiPost('automationWorkflowSteps', 'update', data, id)
  }, [logAudit])
  const deleteAutomationWorkflowStep = useCallback((id: string) => {
    setAutomationWorkflowSteps(prev => prev.filter(s => s.id !== id))
    logAudit('delete', 'automation_workflow_step', id, 'Deleted automation step')
    addToast('Step removed')
    apiPost('automationWorkflowSteps', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Automation Workflow Runs ----
  const addAutomationWorkflowRun = useCallback((data: AnyRecord) => {
    const id = genId('awr')
    setAutomationWorkflowRuns(prev => [...prev, { id, orgId: orgIdRef.current, startedAt: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'automation_workflow_run', id, 'Started automation workflow run')
    addToast('Workflow run started')
    apiPost('automationWorkflowRuns', 'create', data)
  }, [logAudit, addToast])
  const updateAutomationWorkflowRun = useCallback((id: string, data: AnyRecord) => {
    setAutomationWorkflowRuns(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'automation_workflow_run', id, 'Updated automation workflow run')
    apiPost('automationWorkflowRuns', 'update', data, id)
  }, [logAudit])

  // ---- CRUD: Headcount Planning ----
  const addHeadcountPlan = useCallback((data: AnyRecord) => {
    const id = genId('hcp')
    setHeadcountPlans(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'headcount_plan', id, `Created headcount plan: ${data.name}`)
    addToast('Headcount plan created')
    apiPost('headcountPlans', 'create', data)
  }, [logAudit, addToast])
  const updateHeadcountPlan = useCallback((id: string, data: AnyRecord) => {
    setHeadcountPlans(prev => prev.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p) as typeof prev)
    logAudit('update', 'headcount_plan', id, 'Updated headcount plan')
    addToast('Headcount plan updated')
    apiPost('headcountPlans', 'update', data, id)
  }, [logAudit, addToast])
  const addHeadcountPosition = useCallback((data: AnyRecord) => {
    const id = genId('hcpos')
    setHeadcountPositions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'headcount_position', id, `Created position: ${data.job_title}`)
    addToast('Position created')
    apiPost('headcountPositions', 'create', data)
  }, [logAudit, addToast])
  const updateHeadcountPosition = useCallback((id: string, data: AnyRecord) => {
    setHeadcountPositions(prev => prev.map(p => p.id === id ? { ...p, ...data, updated_at: new Date().toISOString() } : p) as typeof prev)
    logAudit('update', 'headcount_position', id, 'Updated position')
    addToast('Position updated')
    apiPost('headcountPositions', 'update', data, id)
  }, [logAudit, addToast])
  const deleteHeadcountPosition = useCallback((id: string) => {
    setHeadcountPositions(prev => prev.filter(p => p.id !== id) as typeof prev)
    setHeadcountBudgetItems(prev => prev.filter(b => b.position_id !== id) as typeof prev)
    logAudit('delete', 'headcount_position', id, 'Deleted position')
    addToast('Position deleted')
    apiPost('headcountPositions', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addHeadcountBudgetItem = useCallback((data: AnyRecord) => {
    const id = genId('hcbi')
    setHeadcountBudgetItems(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'headcount_budget_item', id, `Created budget item: ${data.category}`)
    addToast('Budget item added')
    apiPost('headcountBudgetItems', 'create', data)
  }, [logAudit, addToast])
  const updateHeadcountBudgetItem = useCallback((id: string, data: AnyRecord) => {
    setHeadcountBudgetItems(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev)
    logAudit('update', 'headcount_budget_item', id, 'Updated budget item')
    addToast('Budget item updated')
    apiPost('headcountBudgetItems', 'update', data, id)
  }, [logAudit, addToast])
  const deleteHeadcountBudgetItem = useCallback((id: string) => {
    setHeadcountBudgetItems(prev => prev.filter(b => b.id !== id) as typeof prev)
    logAudit('delete', 'headcount_budget_item', id, 'Deleted budget item')
    addToast('Budget item deleted')
    apiPost('headcountBudgetItems', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Custom Field Definitions ----
  const addCustomFieldDefinition = useCallback((data: AnyRecord) => {
    const id = genId('cfd')
    setCustomFieldDefinitions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'custom_field_definition', id, `Created custom field: ${data.name}`)
    addToast('Custom field created')
    apiPost('customFieldDefinitions', 'create', data)
  }, [logAudit, addToast])
  const updateCustomFieldDefinition = useCallback((id: string, data: AnyRecord) => {
    setCustomFieldDefinitions(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'custom_field_definition', id, 'Updated custom field definition')
    addToast('Custom field updated')
    apiPost('customFieldDefinitions', 'update', data, id)
  }, [logAudit, addToast])
  const deleteCustomFieldDefinition = useCallback((id: string) => {
    setCustomFieldDefinitions(prev => prev.filter(d => d.id !== id))
    setCustomFieldValues(prev => prev.filter(v => v.field_definition_id !== id))
    logAudit('delete', 'custom_field_definition', id, 'Deleted custom field definition')
    addToast('Custom field deleted')
    apiPost('customFieldDefinitions', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Custom Field Values ----
  const addCustomFieldValue = useCallback((data: AnyRecord) => {
    const id = genId('cfv')
    setCustomFieldValues(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...data }] as typeof prev)
    apiPost('customFieldValues', 'create', data)
  }, [])
  const updateCustomFieldValue = useCallback((id: string, data: AnyRecord) => {
    setCustomFieldValues(prev => prev.map(v => v.id === id ? { ...v, ...data, updated_at: new Date().toISOString() } : v) as typeof prev)
    apiPost('customFieldValues', 'update', data, id)
  }, [])

  // ---- CRUD: Emergency Contacts ----
  const addEmergencyContact = useCallback((data: AnyRecord) => {
    const id = genId('ec')
    setEmergencyContacts(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'emergency_contact', id, `Added emergency contact: ${data.name}`)
    addToast('Emergency contact added')
    apiPost('emergencyContacts', 'create', data)
  }, [logAudit, addToast])
  const updateEmergencyContact = useCallback((id: string, data: AnyRecord) => {
    setEmergencyContacts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'emergency_contact', id, 'Updated emergency contact')
    addToast('Emergency contact updated')
    apiPost('emergencyContacts', 'update', data, id)
  }, [logAudit, addToast])
  const deleteEmergencyContact = useCallback((id: string) => {
    setEmergencyContacts(prev => prev.filter(c => c.id !== id))
    logAudit('delete', 'emergency_contact', id, 'Deleted emergency contact')
    addToast('Emergency contact removed')
    apiPost('emergencyContacts', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Compliance Requirements ----
  const addComplianceRequirement = useCallback((data: AnyRecord) => {
    const id = genId('creq')
    setComplianceRequirements(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'compliance_requirement', id, `Created requirement: ${data.name}`)
    addToast('Compliance requirement created')
    apiPost('complianceRequirements', 'create', data)
  }, [logAudit, addToast])
  const updateComplianceRequirement = useCallback((id: string, data: AnyRecord) => {
    setComplianceRequirements(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'compliance_requirement', id, 'Updated compliance requirement')
    addToast('Compliance requirement updated')
    apiPost('complianceRequirements', 'update', data, id)
  }, [logAudit, addToast])
  const deleteComplianceRequirement = useCallback((id: string) => {
    setComplianceRequirements(prev => prev.filter(r => r.id !== id))
    setComplianceDocuments(prev => prev.filter(d => d.requirement_id !== id))
    setComplianceAlerts(prev => prev.filter(a => a.requirement_id !== id))
    logAudit('delete', 'compliance_requirement', id, 'Deleted compliance requirement')
    addToast('Compliance requirement deleted')
    apiPost('complianceRequirements', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Compliance Documents ----
  const addComplianceDocument = useCallback((data: AnyRecord) => {
    const id = genId('cdoc')
    setComplianceDocuments(prev => [...prev, { id, org_id: orgIdRef.current, uploaded_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'compliance_document', id, `Uploaded document: ${data.name}`)
    addToast('Compliance document uploaded')
    apiPost('complianceDocuments', 'create', data)
  }, [logAudit, addToast])
  const updateComplianceDocument = useCallback((id: string, data: AnyRecord) => {
    setComplianceDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev)
    logAudit('update', 'compliance_document', id, 'Updated compliance document')
    addToast('Compliance document updated')
    apiPost('complianceDocuments', 'update', data, id)
  }, [logAudit, addToast])
  const deleteComplianceDocument = useCallback((id: string) => {
    setComplianceDocuments(prev => prev.filter(d => d.id !== id))
    logAudit('delete', 'compliance_document', id, 'Deleted compliance document')
    addToast('Compliance document deleted')
    apiPost('complianceDocuments', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- CRUD: Compliance Alerts ----
  const addComplianceAlert = useCallback((data: AnyRecord) => {
    const id = genId('calert')
    setComplianceAlerts(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'compliance_alert', id, `Created compliance alert: ${data.title || 'Alert'}`)
    addToast('Compliance alert created', 'info')
    apiPost('complianceAlerts', 'create', data)
  }, [logAudit, addToast])
  const updateComplianceAlert = useCallback((id: string, data: AnyRecord) => {
    setComplianceAlerts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev)
    logAudit('update', 'compliance_alert', id, 'Updated compliance alert')
    apiPost('complianceAlerts', 'update', data, id)
  }, [logAudit])
  const dismissComplianceAlert = useCallback((id: string) => {
    setComplianceAlerts(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a) as typeof prev)
    logAudit('update', 'compliance_alert', id, 'Dismissed compliance alert')
    addToast('Alert dismissed')
    apiPost('complianceAlerts', 'update', { is_read: true }, id)
  }, [logAudit, addToast])

  // ---- Journeys ----
  const updateJourneyStep = useCallback((journeyId: string, stepId: string, status: 'pending' | 'in_progress' | 'completed' | 'skipped') => {
    setJourneys(prev => prev.map(j => {
      if (j.id !== journeyId) return j
      const updatedSteps = j.steps.map((s: any) => s.id === stepId ? { ...s, status } : s)
      const completedCount = updatedSteps.filter((s: any) => s.status === 'completed').length
      const currentStep = updatedSteps.findIndex((s: any) => s.status !== 'completed' && s.status !== 'skipped')
      const allDone = updatedSteps.every((s: any) => s.status === 'completed' || s.status === 'skipped')
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
    setWidgetPreferences((prev: any) => ({ ...prev, ...data }))
    logAudit('update', 'widget_preferences', 'prefs', 'Updated dashboard layout')
    addToast('Dashboard layout updated')
    apiPost('widgetPreferences', 'update', data)
  }, [logAudit, addToast])

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
    apiPost('oneOnOnes', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  const updateOneOnOne = useCallback((id: string, data: AnyRecord) => {
    setOneOnOnes(prev => prev.map(o => o.id === id ? { ...o, ...data } : o) as typeof prev)
    logAudit('update', 'one_on_one', id, 'Updated 1:1 meeting')
    addToast('1:1 meeting updated')
    apiPost('oneOnOnes', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Recognitions ----
  const addRecognition = useCallback((data: AnyRecord) => {
    const id = genId('rec')
    setRecognitions(prev => [{ id, org_id: orgIdRef.current, created_at: new Date().toISOString(), likes: 0, ...data }, ...prev] as typeof prev)
    logAudit('create', 'recognition', id, `Gave kudos to ${getEmployeeName(data.to_id)}`)
    addToast('Recognition sent!')
    apiPost('recognitions', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  // ---- CRUD: Competency Ratings ----
  const addCompetencyRating = useCallback((data: AnyRecord) => {
    const id = genId('cr')
    setCompetencyRatings(prev => [...prev, { id, ...data }] as typeof prev)
    logAudit('create', 'competency_rating', id, `Rated competency for ${getEmployeeName(data.employee_id)}`)
    addToast('Competency rating added')
    apiPost('competencyRatings', 'create', data)
  }, [logAudit, addToast, getEmployeeName])

  const updateCompetencyRating = useCallback((id: string, data: AnyRecord) => {
    setCompetencyRatings(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'competency_rating', id, 'Updated competency rating')
    addToast('Competency rating updated')
    apiPost('competencyRatings', 'update', data, id)
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
    apiPost('equityGrants', 'create', data)
  }, [logAudit, addToast, getEmployeeName])
  const updateEquityGrant = useCallback((id: string, data: AnyRecord) => {
    setEquityGrants(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev)
    logAudit('update', 'equity_grant', id, 'Updated equity grant')
    addToast('Equity grant updated')
    apiPost('equityGrants', 'update', data, id)
  }, [logAudit, addToast])
  const addCompPlanningCycle = useCallback((data: AnyRecord) => {
    const id = genId('cpc')
    setCompPlanningCycles(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'comp_planning_cycle', id, `Created planning cycle: ${data.name}`)
    addToast('Comp planning cycle created')
    apiPost('compPlanningCycles', 'create', data)
  }, [logAudit, addToast])
  const updateCompPlanningCycle = useCallback((id: string, data: AnyRecord) => {
    setCompPlanningCycles(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev)
    logAudit('update', 'comp_planning_cycle', id, 'Updated comp planning cycle')
    addToast('Comp planning cycle updated')
    apiPost('compPlanningCycles', 'update', data, id)
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
  const addCourseBlock = useCallback((data: AnyRecord) => { const id = genId('block'); setCourseBlocks(prev => [...prev, { id, ...data }] as typeof prev); logAudit('create', 'course_block', id, `Added block: ${data.title}`); addToast('Content block added'); apiPost('courseBlocks', 'create', data) }, [logAudit, addToast])
  const updateCourseBlock = useCallback((id: string, data: AnyRecord) => { setCourseBlocks(prev => prev.map(b => b.id === id ? { ...b, ...data } : b) as typeof prev); logAudit('update', 'course_block', id, 'Updated content block'); addToast('Content block updated'); apiPost('courseBlocks', 'update', data, id) }, [logAudit, addToast])
  const deleteCourseBlock = useCallback((id: string) => { setCourseBlocks(prev => prev.filter(b => b.id !== id)); logAudit('delete', 'course_block', id, 'Deleted content block'); addToast('Content block deleted'); apiPost('courseBlocks', 'delete', undefined, id) }, [logAudit, addToast])
  const addQuizQuestion = useCallback((data: AnyRecord) => { const id = genId('quiz-q'); setQuizQuestions(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev); logAudit('create', 'quiz_question', id, 'Added question'); addToast('Question added'); apiPost('quizQuestions', 'create', data) }, [logAudit, addToast])
  const updateQuizQuestion = useCallback((id: string, data: AnyRecord) => { setQuizQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q) as typeof prev); logAudit('update', 'quiz_question', id, 'Updated question'); addToast('Question updated'); apiPost('quizQuestions', 'update', data, id) }, [logAudit, addToast])
  const deleteQuizQuestion = useCallback((id: string) => { setQuizQuestions(prev => prev.filter(q => q.id !== id)); logAudit('delete', 'quiz_question', id, 'Deleted question'); addToast('Question deleted'); apiPost('quizQuestions', 'delete', undefined, id) }, [logAudit, addToast])
  const addDiscussion = useCallback((data: AnyRecord) => { const id = genId('disc'); setDiscussions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), replies: 0, likes: 0, ...data }] as typeof prev); logAudit('create', 'discussion', id, `Started discussion: ${data.title}`); addToast('Discussion created'); apiPost('discussions', 'create', data) }, [logAudit, addToast])
  const updateDiscussion = useCallback((id: string, data: AnyRecord) => { setDiscussions(prev => prev.map(d => d.id === id ? { ...d, ...data } : d) as typeof prev); logAudit('update', 'discussion', id, 'Updated discussion'); addToast('Discussion updated'); apiPost('discussions', 'update', data, id) }, [logAudit, addToast])
  const addStudyGroup = useCallback((data: AnyRecord) => { const id = genId('sg'); setStudyGroups(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'study_group', id, `Created group: ${data.name}`); addToast('Study group created'); apiPost('studyGroups', 'create', data) }, [logAudit, addToast])
  const updateStudyGroup = useCallback((id: string, data: AnyRecord) => { setStudyGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g) as typeof prev); logAudit('update', 'study_group', id, 'Updated study group'); addToast('Study group updated'); apiPost('studyGroups', 'update', data, id) }, [logAudit, addToast])

  // ---- CRUD: Compliance Training ----
  const addComplianceTraining = useCallback((data: AnyRecord) => { const id = genId('ct'); setComplianceTraining(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev); logAudit('create', 'compliance_training', id, `Added compliance: ${data.title}`); addToast('Compliance training added'); apiPost('complianceTraining', 'create', data) }, [logAudit, addToast])
  const updateComplianceTraining = useCallback((id: string, data: AnyRecord) => { setComplianceTraining(prev => prev.map(c => c.id === id ? { ...c, ...data } : c) as typeof prev); logAudit('update', 'compliance_training', id, 'Updated compliance training'); apiPost('complianceTraining', 'update', data, id) }, [logAudit])

  // ---- CRUD: Auto-Enrollment Rules ----
  const addAutoEnrollRule = useCallback((data: AnyRecord) => { const id = genId('aer'); setAutoEnrollRules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), triggered_count: 0, ...data }] as typeof prev); logAudit('create', 'auto_enroll_rule', id, `Created rule: ${data.name}`); addToast('Auto-enrollment rule created'); apiPost('autoEnrollRules', 'create', data) }, [logAudit, addToast])
  const updateAutoEnrollRule = useCallback((id: string, data: AnyRecord) => { setAutoEnrollRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev); logAudit('update', 'auto_enroll_rule', id, 'Updated rule'); addToast('Rule updated'); apiPost('autoEnrollRules', 'update', data, id) }, [logAudit, addToast])
  const deleteAutoEnrollRule = useCallback((id: string) => { setAutoEnrollRules(prev => prev.filter(r => r.id !== id)); logAudit('delete', 'auto_enroll_rule', id, 'Deleted rule'); addToast('Rule deleted'); apiPost('autoEnrollRules', 'delete', undefined, id) }, [logAudit, addToast])

  // ---- CRUD: Assessment Attempts ----
  const addAssessmentAttempt = useCallback((data: AnyRecord) => { const id = genId('att'); setAssessmentAttempts(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev); logAudit('create', 'assessment_attempt', id, 'Assessment submitted'); addToast('Assessment submitted'); apiPost('assessmentAttempts', 'create', data) }, [logAudit, addToast])
  const updateAssessmentAttempt = useCallback((id: string, data: AnyRecord) => { setAssessmentAttempts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev); apiPost('assessmentAttempts', 'update', data, id) }, [])

  // ---- CRUD: Learning Assignments ----
  const addLearningAssignment = useCallback((data: AnyRecord) => { const id = genId('la'); setLearningAssignments(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev); logAudit('create', 'learning_assignment', id, `Assigned learning: ${data.course_id}`); addToast('Learning assigned'); apiPost('learningAssignments', 'create', data) }, [logAudit, addToast])
  const updateLearningAssignment = useCallback((id: string, data: AnyRecord) => { setLearningAssignments(prev => prev.map(a => a.id === id ? { ...a, ...data } : a) as typeof prev); logAudit('update', 'learning_assignment', id, 'Updated assignment'); addToast('Assignment updated'); apiPost('learningAssignments', 'update', data, id) }, [logAudit, addToast])

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
    apiPost('employeePayrollEntries', 'create', data)
  }, [logAudit, addToast])

  const addContractorPayment = useCallback((data: AnyRecord) => {
    const id = genId('cp')
    setContractorPayments(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'contractor_payment', id, `Added contractor payment: ${data.contractor_name}`)
    addToast('Contractor payment added')
    apiPost('contractorPayments', 'create', data)
  }, [logAudit, addToast])

  const updateContractorPayment = useCallback((id: string, data: AnyRecord) => {
    setContractorPayments(prev => prev.map(cp => cp.id === id ? { ...cp, ...data } : cp) as typeof prev)
    logAudit('update', 'contractor_payment', id, 'Updated contractor payment')
    addToast('Contractor payment updated')
    apiPost('contractorPayments', 'update', data, id)
  }, [logAudit, addToast])

  const addPayrollSchedule = useCallback((data: AnyRecord) => {
    const id = genId('ps')
    setPayrollSchedules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'payroll_schedule', id, `Created payroll schedule: ${data.name}`)
    addToast('Payroll schedule created')
    apiPost('payrollSchedules', 'create', data)
  }, [logAudit, addToast])

  const updatePayrollSchedule = useCallback((id: string, data: AnyRecord) => {
    setPayrollSchedules(prev => prev.map(ps => ps.id === id ? { ...ps, ...data } : ps) as typeof prev)
    logAudit('update', 'payroll_schedule', id, 'Updated payroll schedule')
    addToast('Payroll schedule updated')
    apiPost('payrollSchedules', 'update', data, id)
  }, [logAudit, addToast])

  const addTaxConfig = useCallback((data: AnyRecord) => {
    const id = genId('tc')
    setTaxConfigs(prev => [...prev, { id, org_id: orgIdRef.current, ...data }] as typeof prev)
    logAudit('create', 'tax_config', id, `Added tax config for ${data.country}`)
    addToast('Tax configuration added')
    apiPost('taxConfigs', 'create', data)
  }, [logAudit, addToast])

  const updateTaxConfig = useCallback((id: string, data: AnyRecord) => {
    setTaxConfigs(prev => prev.map(tc => tc.id === id ? { ...tc, ...data } : tc) as typeof prev)
    logAudit('update', 'tax_config', id, 'Updated tax configuration')
    addToast('Tax configuration updated')
    apiPost('taxConfigs', 'update', data, id)
  }, [logAudit, addToast])

  const resolveComplianceIssue = useCallback((id: string) => {
    setComplianceIssues(prev => prev.map(ci => ci.id === id ? { ...ci, status: 'resolved' as const } : ci) as typeof prev)
    logAudit('update', 'compliance_issue', id, 'Resolved compliance issue')
    addToast('Compliance issue resolved')
    apiPost('complianceIssues', 'update', { status: 'resolved' }, id)
  }, [logAudit, addToast])

  const updateTaxFiling = useCallback((id: string, data: AnyRecord) => {
    setTaxFilings(prev => prev.map(tf => tf.id === id ? { ...tf, ...data } : tf) as typeof prev)
    logAudit('update', 'tax_filing', id, 'Updated tax filing')
    addToast('Tax filing updated')
    apiPost('taxFilings', 'update', data, id)
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
    apiPost('expensePolicies', 'create', data)
  }, [logAudit, addToast])

  const updateExpensePolicy = useCallback((id: string, data: AnyRecord) => {
    setExpensePolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p) as typeof prev)
    logAudit('update', 'expense_policy', id, 'Updated expense policy')
    addToast('Expense policy updated')
    apiPost('expensePolicies', 'update', data, id)
  }, [logAudit, addToast])

  // ---- CRUD: Mileage Logs ----
  const addMileageLog = useCallback((data: AnyRecord) => {
    const id = genId('ml')
    setMileageLogs(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }] as typeof prev)
    logAudit('create', 'mileage_log', id, 'Created mileage log entry')
    addToast('Mileage entry added')
    apiPost('mileageLogs', 'create', data)
  }, [logAudit, addToast])

  const updateMileageLog = useCallback((id: string, data: AnyRecord) => {
    setMileageLogs(prev => prev.map(m => m.id === id ? { ...m, ...data } : m) as typeof prev)
    logAudit('update', 'mileage_log', id, 'Updated mileage log')
    addToast('Mileage entry updated')
    apiPost('mileageLogs', 'update', data, id)
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
    setCareerSiteConfig((prev: any) => ({ ...prev, ...data }))
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
    apiPost('automationRules', 'create', data)
  }, [logAudit, addToast])

  const updateAutomationRule = useCallback((id: string, data: AnyRecord) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r) as typeof prev)
    logAudit('update', 'automation_rule', id, 'Updated automation rule')
    addToast('Automation rule updated')
    apiPost('automationRules', 'update', data, id)
  }, [logAudit, addToast])

  const toggleAutomationRule = useCallback((id: string) => {
    setAutomationRules(prev => prev.map(r => r.id === id ? { ...r, is_active: !r.is_active } : r) as typeof prev)
    const rule = automationRules.find(r => r.id === id)
    const newState = rule ? !rule.is_active : true
    logAudit('update', 'automation_rule', id, `${newState ? 'Activated' : 'Deactivated'} automation rule`)
    addToast(`Automation rule ${newState ? 'activated' : 'deactivated'}`)
    apiPost('automationRules', 'update', { is_active: newState }, id)
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
    logAudit('update', 'notification', id, 'Marked notification as read')
    apiPost('notifications', 'update', { is_read: true }, id)
  }, [logAudit])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })) as typeof prev)
    logAudit('update', 'notification', 'all', 'Marked all notifications as read')
    addToast('All notifications marked as read')
    apiPost('notifications', 'update', { is_read: true, bulk: true })
  }, [logAudit, addToast])

  const unreadNotificationCount = notifications.filter(n => !n.is_read).length

  // ---- CRUD: Org ----
  const updateOrg = useCallback((data: AnyRecord) => {
    setOrg((prev: any) => ({ ...prev, ...data }))
    logAudit('update', 'organization', orgIdRef.current, 'Updated organization settings')
    addToast('Organization settings updated')
    apiPost('organizations', 'update', data, org.id)
  }, [logAudit, addToast, org.id])

  // ============================================================
  // GAP CLOSURE: CRUD Callbacks for New Features
  // ============================================================

  // ---- E-Signatures ----
  const addSignatureDocument = useCallback((data: AnyRecord) => {
    const id = genId('sig-doc')
    setSignatureDocuments(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'signature_document', id, `Created signature document: ${data.title || 'Untitled'}`)
    addToast('Signature document created')
    apiPost('signatureDocuments', 'create', data)
  }, [logAudit, addToast])
  const updateSignatureDocument = useCallback((id: string, data: AnyRecord) => {
    setSignatureDocuments(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
    logAudit('update', 'signature_document', id, 'Updated signature document')
    addToast('Signature document updated')
    apiPost('signatureDocuments', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSignatureDocument = useCallback((id: string) => {
    setSignatureDocuments(prev => prev.filter(d => d.id !== id))
    logAudit('delete', 'signature_document', id, 'Deleted signature document')
    addToast('Signature document removed')
    apiPost('signatureDocuments', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addSignatureTemplate = useCallback((data: AnyRecord) => {
    const id = genId('sig-tpl')
    setSignatureTemplates(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'signature_template', id, `Created signature template: ${data.name || 'Untitled'}`)
    addToast('Signature template created')
    apiPost('signatureTemplates', 'create', data)
  }, [logAudit, addToast])
  const updateSignatureTemplate = useCallback((id: string, data: AnyRecord) => {
    setSignatureTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    logAudit('update', 'signature_template', id, 'Updated signature template')
    addToast('Signature template updated')
    apiPost('signatureTemplates', 'update', data, id)
  }, [logAudit, addToast])

  // ---- E-Verify / I-9 ----
  const addI9Form = useCallback((data: AnyRecord) => {
    const id = genId('i9')
    setI9Forms(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'i9_form', id, `Created I-9 form for employee ${data.employee_id}`)
    addToast('I-9 form created')
    apiPost('i9Forms', 'create', data)
  }, [logAudit, addToast])
  const updateI9Form = useCallback((id: string, data: AnyRecord) => {
    setI9Forms(prev => prev.map(f => f.id === id ? { ...f, ...data } : f))
    logAudit('update', 'i9_form', id, 'Updated I-9 form')
    addToast('I-9 form updated')
    apiPost('i9Forms', 'update', data, id)
  }, [logAudit, addToast])
  const addEVerifyCase = useCallback((data: AnyRecord) => {
    const id = genId('everify')
    setEverifyCases(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'everify_case', id, `Created E-Verify case for ${data.employee_id}`)
    addToast('E-Verify case created')
    apiPost('eVerifyCases', 'create', data)
  }, [logAudit, addToast])
  const updateEVerifyCase = useCallback((id: string, data: AnyRecord) => {
    setEverifyCases(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'everify_case', id, 'Updated E-Verify case')
    addToast('E-Verify case updated')
    apiPost('eVerifyCases', 'update', data, id)
  }, [logAudit, addToast])

  // ---- PEO / Co-employment ----
  const addPeoConfiguration = useCallback((data: AnyRecord) => {
    const id = genId('peo')
    setPeoConfigurations(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'peo_configuration', id, `Created PEO config: ${data.provider_name || 'PEO'}`)
    addToast('PEO configuration created')
    apiPost('peoConfigurations', 'create', data)
  }, [logAudit, addToast])
  const updatePeoConfiguration = useCallback((id: string, data: AnyRecord) => {
    setPeoConfigurations(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'peo_configuration', id, 'Updated PEO configuration')
    addToast('PEO configuration updated')
    apiPost('peoConfigurations', 'update', data, id)
  }, [logAudit, addToast])
  const addCoEmploymentRecord = useCallback((data: AnyRecord) => {
    const id = genId('coemp')
    setCoEmploymentRecords(prev => [...prev, { id, org_id: orgIdRef.current, ...data }])
    logAudit('create', 'co_employment_record', id, `Created co-employment record`)
    addToast('Co-employment record created')
    apiPost('coEmploymentRecords', 'create', data)
  }, [logAudit, addToast])
  const updateCoEmploymentRecord = useCallback((id: string, data: AnyRecord) => {
    setCoEmploymentRecords(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'co_employment_record', id, 'Updated co-employment record')
    addToast('Co-employment record updated')
    apiPost('coEmploymentRecords', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Sandbox Environment ----
  const addSandboxEnvironment = useCallback((data: AnyRecord) => {
    const id = genId('sandbox')
    setSandboxEnvironments(prev => [...prev, { id, org_id: orgIdRef.current, status: 'provisioning', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'sandbox', id, `Created sandbox: ${data.name || 'Sandbox'}`)
    addToast('Sandbox environment created')
    apiPost('sandboxEnvironments', 'create', data)
  }, [logAudit, addToast])
  const updateSandboxEnvironment = useCallback((id: string, data: AnyRecord) => {
    setSandboxEnvironments(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    logAudit('update', 'sandbox', id, 'Updated sandbox environment')
    addToast('Sandbox environment updated')
    apiPost('sandboxEnvironments', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSandboxEnvironment = useCallback((id: string) => {
    setSandboxEnvironments(prev => prev.filter(s => s.id !== id))
    logAudit('delete', 'sandbox', id, 'Deleted sandbox environment')
    addToast('Sandbox environment removed')
    apiPost('sandboxEnvironments', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- Built-in Chat ----
  const addChatChannel = useCallback((data: AnyRecord) => {
    const id = genId('chan')
    setChatChannels(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'chat_channel', id, `Created channel: ${data.name || '#general'}`)
    addToast('Chat channel created')
    apiPost('chatChannels', 'create', data)
  }, [logAudit, addToast])
  const updateChatChannel = useCallback((id: string, data: AnyRecord) => {
    setChatChannels(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'chat_channel', id, 'Updated chat channel')
    addToast('Chat channel updated')
    apiPost('chatChannels', 'update', data, id)
  }, [logAudit, addToast])
  const addChatMessage = useCallback((data: AnyRecord) => {
    const id = genId('msg')
    setChatMessages(prev => [...prev, { id, sent_at: new Date().toISOString(), ...data }])
  }, [])
  const updateChatMessage = useCallback((id: string, data: AnyRecord) => {
    setChatMessages(prev => prev.map(m => m.id === id ? { ...m, ...data, edited_at: new Date().toISOString() } : m))
  }, [])
  const deleteChatMessage = useCallback((id: string) => {
    setChatMessages(prev => prev.filter(m => m.id !== id))
  }, [])

  // ---- AI Interview Recording ----
  const addInterviewRecording = useCallback((data: AnyRecord) => {
    const id = genId('rec')
    setInterviewRecordings(prev => [...prev, { id, org_id: orgIdRef.current, status: 'scheduled', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'interview_recording', id, 'Scheduled interview recording')
    addToast('Interview recording scheduled')
    apiPost('interviewRecordings', 'create', data)
  }, [logAudit, addToast])
  const updateInterviewRecording = useCallback((id: string, data: AnyRecord) => {
    setInterviewRecordings(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'interview_recording', id, 'Updated interview recording')
    addToast('Interview recording updated')
    apiPost('interviewRecordings', 'update', data, id)
  }, [logAudit, addToast])

  // ---- AI Video Screens ----
  const addVideoScreenTemplate = useCallback((data: AnyRecord) => {
    const id = genId('vst')
    setVideoScreenTemplates(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'video_screen_template', id, `Created video screen template: ${data.title || 'Untitled'}`)
    addToast('Video screen template created')
    apiPost('videoScreenTemplates', 'create', data)
  }, [logAudit, addToast])
  const updateVideoScreenTemplate = useCallback((id: string, data: AnyRecord) => {
    setVideoScreenTemplates(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    logAudit('update', 'video_screen_template', id, 'Updated video screen template')
    addToast('Video screen template updated')
    apiPost('videoScreenTemplates', 'update', data, id)
  }, [logAudit, addToast])
  const addVideoScreenInvite = useCallback((data: AnyRecord) => {
    const id = genId('vsi')
    setVideoScreenInvites(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending', sent_at: new Date().toISOString(), ...data }])
    logAudit('create', 'video_screen_invite', id, `Sent video screen invite to ${data.candidate_email}`)
    addToast('Video screen invite sent')
    apiPost('videoScreenInvites', 'create', data)
  }, [logAudit, addToast])
  const updateVideoScreenInvite = useCallback((id: string, data: AnyRecord) => {
    setVideoScreenInvites(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
    logAudit('update', 'video_screen_invite', id, 'Updated video screen invite')
    addToast('Video screen invite updated')
    apiPost('videoScreenInvites', 'update', data, id)
  }, [logAudit, addToast])
  const addVideoScreenResponse = useCallback((data: AnyRecord) => {
    const id = genId('vsr')
    setVideoScreenResponses(prev => [...prev, { id, org_id: orgIdRef.current, submitted_at: new Date().toISOString(), ...data }])
    logAudit('create', 'video_screen_response', id, 'Video screen response submitted')
    addToast('Video screen response recorded')
    apiPost('videoScreenResponses', 'create', data)
  }, [logAudit, addToast])
  const updateVideoScreenResponse = useCallback((id: string, data: AnyRecord) => {
    setVideoScreenResponses(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'video_screen_response', id, 'Updated video screen response')
    addToast('Video screen response updated')
    apiPost('videoScreenResponses', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Corporate Cards ----
  const addCorporateCard = useCallback((data: AnyRecord) => {
    const id = genId('card')
    setCorporateCards(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', issued_at: new Date().toISOString(), ...data }])
    logAudit('create', 'corporate_card', id, `Issued corporate card ending ${data.last_four || '****'}`)
    addToast('Corporate card issued')
    apiPost('corporateCards', 'create', data)
  }, [logAudit, addToast])
  const updateCorporateCard = useCallback((id: string, data: AnyRecord) => {
    setCorporateCards(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'corporate_card', id, 'Updated corporate card')
    addToast('Corporate card updated')
    apiPost('corporateCards', 'update', data, id)
  }, [logAudit, addToast])
  const addCardTransaction = useCallback((data: AnyRecord) => {
    const id = genId('txn')
    setCardTransactions(prev => [...prev, { id, org_id: orgIdRef.current, transaction_date: new Date().toISOString(), ...data }])
    logAudit('create', 'card_transaction', id, `Card transaction: ${data.merchant || 'Unknown'}`)
    addToast('Card transaction recorded')
    apiPost('cardTransactions', 'create', data)
  }, [logAudit, addToast])
  const updateCardTransaction = useCallback((id: string, data: AnyRecord) => {
    setCardTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    logAudit('update', 'card_transaction', id, 'Updated card transaction')
    addToast('Card transaction updated')
    apiPost('cardTransactions', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Bill Pay ----
  const addBillPayment = useCallback((data: AnyRecord) => {
    const id = genId('bp')
    setBillPayments(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'bill_payment', id, `Created bill payment: $${((data.amount || 0) / 100).toFixed(2)}`)
    addToast('Bill payment created')
    apiPost('billPayments', 'create', data)
  }, [logAudit, addToast])
  const updateBillPayment = useCallback((id: string, data: AnyRecord) => {
    setBillPayments(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'bill_payment', id, 'Updated bill payment')
    addToast('Bill payment updated')
    apiPost('billPayments', 'update', data, id)
  }, [logAudit, addToast])
  const addBillPaySchedule = useCallback((data: AnyRecord) => {
    const id = genId('bps')
    setBillPaySchedules(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, ...data }])
    logAudit('create', 'bill_pay_schedule', id, 'Created recurring payment schedule')
    addToast('Payment schedule created')
    apiPost('billPaySchedules', 'create', data)
  }, [logAudit, addToast])
  const updateBillPaySchedule = useCallback((id: string, data: AnyRecord) => {
    setBillPaySchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    logAudit('update', 'bill_pay_schedule', id, 'Updated payment schedule')
    addToast('Payment schedule updated')
    apiPost('billPaySchedules', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Travel Management ----
  const addTravelRequest = useCallback((data: AnyRecord) => {
    const id = genId('travel')
    setTravelRequests(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending', submitted_at: new Date().toISOString(), ...data }])
    logAudit('create', 'travel_request', id, `Created travel request: ${data.destination || 'Trip'}`)
    addToast('Travel request submitted')
    apiPost('travelRequests', 'create', data)
  }, [logAudit, addToast])
  const updateTravelRequest = useCallback((id: string, data: AnyRecord) => {
    setTravelRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'travel_request', id, 'Updated travel request')
    addToast('Travel request updated')
    apiPost('travelRequests', 'update', data, id)
  }, [logAudit, addToast])
  const addTravelBooking = useCallback((data: AnyRecord) => {
    const id = genId('booking')
    setTravelBookings(prev => [...prev, { id, org_id: orgIdRef.current, booked_at: new Date().toISOString(), ...data }])
    logAudit('create', 'travel_booking', id, `Booked: ${data.type || 'travel'}`)
    addToast('Travel booking confirmed')
    apiPost('travelBookings', 'create', data)
  }, [logAudit, addToast])
  const updateTravelBooking = useCallback((id: string, data: AnyRecord) => {
    setTravelBookings(prev => prev.map(b => b.id === id ? { ...b, ...data } : b))
    logAudit('update', 'travel_booking', id, 'Updated travel booking')
    addToast('Travel booking updated')
    apiPost('travelBookings', 'update', data, id)
  }, [logAudit, addToast])
  const addTravelPolicy = useCallback((data: AnyRecord) => {
    const id = genId('tpol')
    setTravelPolicies(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, ...data }])
    logAudit('create', 'travel_policy', id, `Created travel policy: ${data.name || 'Policy'}`)
    addToast('Travel policy created')
    apiPost('travelPolicies', 'create', data)
  }, [logAudit, addToast])
  const updateTravelPolicy = useCallback((id: string, data: AnyRecord) => {
    setTravelPolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'travel_policy', id, 'Updated travel policy')
    addToast('Travel policy updated')
    apiPost('travelPolicies', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Procurement / Purchase Orders ----
  const addPurchaseOrder = useCallback((data: AnyRecord) => {
    const id = genId('po')
    setPurchaseOrders(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'purchase_order', id, `Created PO: ${data.po_number || id}`)
    addToast('Purchase order created')
    apiPost('purchaseOrders', 'create', data)
  }, [logAudit, addToast])
  const updatePurchaseOrder = useCallback((id: string, data: AnyRecord) => {
    setPurchaseOrders(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'purchase_order', id, 'Updated purchase order')
    addToast('Purchase order updated')
    apiPost('purchaseOrders', 'update', data, id)
  }, [logAudit, addToast])
  const addProcurementRequest = useCallback((data: AnyRecord) => {
    const id = genId('preq')
    setProcurementRequests(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending', submitted_at: new Date().toISOString(), ...data }])
    logAudit('create', 'procurement_request', id, `Created procurement request: ${data.title || 'Request'}`)
    addToast('Procurement request submitted')
    apiPost('procurementRequests', 'create', data)
  }, [logAudit, addToast])
  const updateProcurementRequest = useCallback((id: string, data: AnyRecord) => {
    setProcurementRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'procurement_request', id, 'Updated procurement request')
    addToast('Procurement request updated')
    apiPost('procurementRequests', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Multi-currency ----
  const addCurrencyAccount = useCallback((data: AnyRecord) => {
    const id = genId('fxacct')
    setCurrencyAccounts(prev => [...prev, { id, org_id: orgIdRef.current, ...data }])
    logAudit('create', 'currency_account', id, `Created ${data.currency || 'FX'} account`)
    addToast('Currency account created')
    apiPost('currencyAccounts', 'create', data)
  }, [logAudit, addToast])
  const updateCurrencyAccount = useCallback((id: string, data: AnyRecord) => {
    setCurrencyAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    logAudit('update', 'currency_account', id, 'Updated currency account')
    addToast('Currency account updated')
    apiPost('currencyAccounts', 'update', data, id)
  }, [logAudit, addToast])
  const deleteCurrencyAccount = useCallback((id: string) => {
    setCurrencyAccounts(prev => prev.filter(a => a.id !== id))
    logAudit('delete', 'currency_account', id, 'Deleted currency account')
    addToast('Currency account deleted')
    apiPost('currencyAccounts', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addFxTransaction = useCallback((data: AnyRecord) => {
    const id = genId('fx')
    setFxTransactions(prev => [...prev, { id, org_id: orgIdRef.current, executed_at: new Date().toISOString(), ...data }])
    logAudit('create', 'fx_transaction', id, `FX: ${data.from_currency}→${data.to_currency}`)
    addToast('FX transaction executed')
    apiPost('fxTransactions', 'create', data)
  }, [logAudit, addToast])

  // ---- 401(k) Administration ----
  const addRetirementPlan = useCallback((data: AnyRecord) => {
    const id = genId('rplan')
    setRetirementPlans(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'retirement_plan', id, `Created retirement plan: ${data.name || 'Plan'}`)
    addToast('Retirement plan created')
    apiPost('retirementPlans', 'create', data)
  }, [logAudit, addToast])
  const updateRetirementPlan = useCallback((id: string, data: AnyRecord) => {
    setRetirementPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'retirement_plan', id, 'Updated retirement plan')
    addToast('Retirement plan updated')
    apiPost('retirementPlans', 'update', data, id)
  }, [logAudit, addToast])
  const addRetirementEnrollment = useCallback((data: AnyRecord) => {
    const id = genId('renr')
    setRetirementEnrollments(prev => [...prev, { id, org_id: orgIdRef.current, enrolled_at: new Date().toISOString(), ...data }])
    logAudit('create', 'retirement_enrollment', id, 'Employee enrolled in retirement plan')
    addToast('Retirement enrollment created')
    apiPost('retirementEnrollments', 'create', data)
  }, [logAudit, addToast])
  const updateRetirementEnrollment = useCallback((id: string, data: AnyRecord) => {
    setRetirementEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    logAudit('update', 'retirement_enrollment', id, 'Updated retirement enrollment')
    addToast('Retirement enrollment updated')
    apiPost('retirementEnrollments', 'update', data, id)
  }, [logAudit, addToast])
  const addRetirementContribution = useCallback((data: AnyRecord) => {
    const id = genId('rcon')
    setRetirementContributions(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'retirement_contribution', id, 'Retirement contribution recorded')
    addToast('Contribution recorded')
    apiPost('retirementContributions', 'create', data)
  }, [logAudit, addToast])

  // ---- Carrier Integration ----
  const addCarrierIntegration = useCallback((data: AnyRecord) => {
    const id = genId('carrier')
    setCarrierIntegrations(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'carrier_integration', id, `Added carrier: ${data.carrier_name || 'Carrier'}`)
    addToast('Carrier integration added')
    apiPost('carrierIntegrations', 'create', data)
  }, [logAudit, addToast])
  const updateCarrierIntegration = useCallback((id: string, data: AnyRecord) => {
    setCarrierIntegrations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'carrier_integration', id, 'Updated carrier integration')
    addToast('Carrier integration updated')
    apiPost('carrierIntegrations', 'update', data, id)
  }, [logAudit, addToast])
  const addEnrollmentFeed = useCallback((data: AnyRecord) => {
    const id = genId('feed')
    setEnrollmentFeeds(prev => [...prev, { id, org_id: orgIdRef.current, generated_at: new Date().toISOString(), ...data }])
    logAudit('create', 'enrollment_feed', id, 'Enrollment feed generated')
    addToast('Enrollment feed generated')
    apiPost('enrollmentFeeds', 'create', data)
  }, [logAudit, addToast])

  // ---- Geofencing ----
  const addGeofenceZone = useCallback((data: AnyRecord) => {
    const id = genId('zone')
    setGeofenceZones(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, ...data }])
    logAudit('create', 'geofence_zone', id, `Created geofence zone: ${data.name || 'Zone'}`)
    addToast('Geofence zone created')
    apiPost('geofenceZones', 'create', data)
  }, [logAudit, addToast])
  const updateGeofenceZone = useCallback((id: string, data: AnyRecord) => {
    setGeofenceZones(prev => prev.map(z => z.id === id ? { ...z, ...data } : z))
    logAudit('update', 'geofence_zone', id, 'Updated geofence zone')
    addToast('Geofence zone updated')
    apiPost('geofenceZones', 'update', data, id)
  }, [logAudit, addToast])
  const deleteGeofenceZone = useCallback((id: string) => {
    setGeofenceZones(prev => prev.filter(z => z.id !== id))
    logAudit('delete', 'geofence_zone', id, 'Deleted geofence zone')
    addToast('Geofence zone removed')
    apiPost('geofenceZones', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addGeofenceEvent = useCallback((data: AnyRecord) => {
    const id = genId('gfev')
    setGeofenceEvents(prev => [...prev, { id, org_id: orgIdRef.current, timestamp: new Date().toISOString(), ...data }])
  }, [])

  // ---- Identity Provider ----
  const addIdpConfiguration = useCallback((data: AnyRecord) => {
    const id = genId('idp')
    setIdpConfigurations(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'idp_configuration', id, `Created IdP: ${data.name || 'Provider'}`)
    addToast('Identity provider configured')
    apiPost('idpConfigurations', 'create', data)
  }, [logAudit, addToast])
  const updateIdpConfiguration = useCallback((id: string, data: AnyRecord) => {
    setIdpConfigurations(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'idp_configuration', id, 'Updated IdP configuration')
    addToast('Identity provider updated')
    apiPost('idpConfigurations', 'update', data, id)
  }, [logAudit, addToast])
  const addSamlApp = useCallback((data: AnyRecord) => {
    const id = genId('saml')
    setSamlApps(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'saml_app', id, `Added SAML app: ${data.name || 'App'}`)
    addToast('SAML app added')
    apiPost('samlApps', 'create', data)
  }, [logAudit, addToast])
  const updateSamlApp = useCallback((id: string, data: AnyRecord) => {
    setSamlApps(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    logAudit('update', 'saml_app', id, 'Updated SAML app')
    addToast('SAML app updated')
    apiPost('samlApps', 'update', data, id)
  }, [logAudit, addToast])
  const addMfaPolicy = useCallback((data: AnyRecord) => {
    const id = genId('mfa')
    setMfaPolicies(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, ...data }])
    logAudit('create', 'mfa_policy', id, `Created MFA policy: ${data.name || 'Policy'}`)
    addToast('MFA policy created')
    apiPost('mfaPolicies', 'create', data)
  }, [logAudit, addToast])
  const updateMfaPolicy = useCallback((id: string, data: AnyRecord) => {
    setMfaPolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'mfa_policy', id, 'Updated MFA policy')
    addToast('MFA policy updated')
    apiPost('mfaPolicies', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Zero-touch Deployment ----
  const addDeploymentProfile = useCallback((data: AnyRecord) => {
    const id = genId('deploy')
    setDeploymentProfiles(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'deployment_profile', id, `Created deployment profile: ${data.name || 'Profile'}`)
    addToast('Deployment profile created')
    apiPost('deploymentProfiles', 'create', data)
  }, [logAudit, addToast])
  const updateDeploymentProfile = useCallback((id: string, data: AnyRecord) => {
    setDeploymentProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'deployment_profile', id, 'Updated deployment profile')
    addToast('Deployment profile updated')
    apiPost('deploymentProfiles', 'update', data, id)
  }, [logAudit, addToast])
  const addEnrollmentToken = useCallback((data: AnyRecord) => {
    const id = genId('token')
    setEnrollmentTokens(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'enrollment_token', id, 'Generated device enrollment token')
    addToast('Enrollment token generated')
    apiPost('enrollmentTokens', 'create', data)
  }, [logAudit, addToast])
  const updateEnrollmentToken = useCallback((id: string, data: AnyRecord) => {
    setEnrollmentTokens(prev => prev.map(t => t.id === id ? { ...t, ...data } : t))
    logAudit('update', 'enrollment_token', id, 'Updated enrollment token')
    addToast('Enrollment token updated')
    apiPost('enrollmentTokens', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Password Manager ----
  const addPasswordVault = useCallback((data: AnyRecord) => {
    const id = genId('vault')
    setPasswordVaults(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'password_vault', id, `Created vault: ${data.name || 'Vault'}`)
    addToast('Password vault created')
    apiPost('passwordVaults', 'create', data)
  }, [logAudit, addToast])
  const updatePasswordVault = useCallback((id: string, data: AnyRecord) => {
    setPasswordVaults(prev => prev.map(v => v.id === id ? { ...v, ...data } : v))
    logAudit('update', 'password_vault', id, 'Updated password vault')
    addToast('Password vault updated')
    apiPost('passwordVaults', 'update', data, id)
  }, [logAudit, addToast])
  const addVaultItem = useCallback((data: AnyRecord) => {
    const id = genId('vi')
    setVaultItems(prev => [...prev, { id, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'vault_item', id, `Added credential: ${data.name || 'Item'}`)
    addToast('Vault item added')
    apiPost('vaultItems', 'create', data)
  }, [logAudit, addToast])
  const updateVaultItem = useCallback((id: string, data: AnyRecord) => {
    setVaultItems(prev => prev.map(i => i.id === id ? { ...i, ...data } : i))
    logAudit('update', 'vault_item', id, 'Updated vault item')
    addToast('Vault item updated')
    apiPost('vaultItems', 'update', data, id)
  }, [logAudit, addToast])
  const deleteVaultItem = useCallback((id: string) => {
    setVaultItems(prev => prev.filter(i => i.id !== id))
    logAudit('delete', 'vault_item', id, 'Deleted vault item')
    addToast('Vault item removed')
    apiPost('vaultItems', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- Device Store / Buyback ----
  const addDeviceStoreCatalogItem = useCallback((data: AnyRecord) => {
    const id = genId('dsc')
    setDeviceStoreCatalog(prev => [...prev, { id, org_id: orgIdRef.current, ...data }])
    logAudit('create', 'device_catalog', id, `Added device: ${data.name || 'Device'}`)
    addToast('Device added to catalog')
    apiPost('deviceStoreCatalog', 'create', data)
  }, [logAudit, addToast])
  const updateDeviceStoreCatalogItem = useCallback((id: string, data: AnyRecord) => {
    setDeviceStoreCatalog(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
    logAudit('update', 'device_catalog', id, 'Updated catalog item')
    addToast('Catalog item updated')
    apiPost('deviceStoreCatalog', 'update', data, id)
  }, [logAudit, addToast])
  const addDeviceOrder = useCallback((data: AnyRecord) => {
    const id = genId('dord')
    setDeviceOrders(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending', ordered_at: new Date().toISOString(), ...data }])
    logAudit('create', 'device_order', id, 'Device order placed')
    addToast('Device order placed')
    apiPost('deviceOrders', 'create', data)
  }, [logAudit, addToast])
  const updateDeviceOrder = useCallback((id: string, data: AnyRecord) => {
    setDeviceOrders(prev => prev.map(o => o.id === id ? { ...o, ...data } : o))
    logAudit('update', 'device_order', id, 'Updated device order')
    addToast('Device order updated')
    apiPost('deviceOrders', 'update', data, id)
  }, [logAudit, addToast])
  const addBuybackRequest = useCallback((data: AnyRecord) => {
    const id = genId('bb')
    setBuybackRequests(prev => [...prev, { id, org_id: orgIdRef.current, status: 'submitted', submitted_at: new Date().toISOString(), ...data }])
    logAudit('create', 'buyback_request', id, 'Buyback request submitted')
    addToast('Buyback request submitted')
    apiPost('buybackRequests', 'create', data)
  }, [logAudit, addToast])
  const updateBuybackRequest = useCallback((id: string, data: AnyRecord) => {
    setBuybackRequests(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'buyback_request', id, 'Updated buyback request')
    addToast('Buyback request updated')
    apiPost('buybackRequests', 'update', data, id)
  }, [logAudit, addToast])

  // ---- No-code App Builder ----
  const addCustomApp = useCallback((data: AnyRecord) => {
    const id = genId('app')
    setCustomApps(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', version: 1, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'custom_app', id, `Created app: ${data.name || 'App'}`)
    addToast('Custom app created')
    apiPost('customApps', 'create', data)
  }, [logAudit, addToast])
  const updateCustomApp = useCallback((id: string, data: AnyRecord) => {
    setCustomApps(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    logAudit('update', 'custom_app', id, 'Updated custom app')
    addToast('Custom app updated')
    apiPost('customApps', 'update', data, id)
  }, [logAudit, addToast])
  const deleteCustomApp = useCallback((id: string) => {
    setCustomApps(prev => prev.filter(a => a.id !== id))
    setAppPages(prev => prev.filter(p => p.app_id !== id))
    logAudit('delete', 'custom_app', id, 'Deleted custom app')
    addToast('Custom app removed')
    apiPost('customApps', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addAppPage = useCallback((data: AnyRecord) => {
    const id = genId('page')
    setAppPages(prev => [...prev, { id, ...data }])
    logAudit('create', 'app_page', id, `Added page: ${data.name || 'Page'}`)
    addToast('App page added')
    apiPost('appPages', 'create', data)
  }, [logAudit, addToast])
  const updateAppPage = useCallback((id: string, data: AnyRecord) => {
    setAppPages(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'app_page', id, `Updated app page`)
    addToast('App page updated')
    apiPost('appPages', 'update', data, id)
  }, [logAudit, addToast])
  const addAppComponent = useCallback((data: AnyRecord) => {
    const id = genId('comp')
    setAppComponents(prev => [...prev, { id, ...data }])
    logAudit('create', 'app_component', id, `Added component: ${data.name || 'Component'}`)
    addToast('Component added')
    apiPost('appComponents', 'create', data)
  }, [logAudit, addToast])
  const updateAppComponent = useCallback((id: string, data: AnyRecord) => {
    setAppComponents(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'app_component', id, `Updated component`)
    addToast('Component updated')
    apiPost('appComponents', 'update', data, id)
  }, [logAudit, addToast])
  const addAppDataSource = useCallback((data: AnyRecord) => {
    const id = genId('ds')
    setAppDataSources(prev => [...prev, { id, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'app_data_source', id, `Added data source: ${data.name || 'Source'}`)
    addToast('Data source added')
    apiPost('appDataSources', 'create', data)
  }, [logAudit, addToast])
  const updateAppDataSource = useCallback((id: string, data: AnyRecord) => {
    setAppDataSources(prev => prev.map(d => d.id === id ? { ...d, ...data } : d))
    logAudit('update', 'app_data_source', id, `Updated data source`)
    addToast('Data source updated')
    apiPost('appDataSources', 'update', data, id)
  }, [logAudit, addToast])

  // ---- RQL / Custom Query Language ----
  const addSavedQuery = useCallback((data: AnyRecord) => {
    const id = genId('query')
    setSavedQueries(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', run_count: 0, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'saved_query', id, `Created query: ${data.name || 'Query'}`)
    addToast('Query saved')
    apiPost('savedQueries', 'create', data)
  }, [logAudit, addToast])
  const updateSavedQuery = useCallback((id: string, data: AnyRecord) => {
    setSavedQueries(prev => prev.map(q => q.id === id ? { ...q, ...data } : q))
    logAudit('update', 'saved_query', id, 'Updated saved query')
    addToast('Query updated')
    apiPost('savedQueries', 'update', data, id)
  }, [logAudit, addToast])
  const deleteSavedQuery = useCallback((id: string) => {
    setSavedQueries(prev => prev.filter(q => q.id !== id))
    setQuerySchedules(prev => prev.filter(s => s.query_id !== id))
    logAudit('delete', 'saved_query', id, 'Deleted saved query')
    addToast('Query removed')
    apiPost('savedQueries', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addQuerySchedule = useCallback((data: AnyRecord) => {
    const id = genId('qsched')
    setQuerySchedules(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, ...data }])
    logAudit('create', 'query_schedule', id, 'Created query schedule')
    addToast('Query schedule created')
    apiPost('querySchedules', 'create', data)
  }, [logAudit, addToast])
  const updateQuerySchedule = useCallback((id: string, data: AnyRecord) => {
    setQuerySchedules(prev => prev.map(s => s.id === id ? { ...s, ...data } : s))
    logAudit('update', 'query_schedule', id, 'Updated query schedule')
    addToast('Query schedule updated')
    apiPost('querySchedules', 'update', data, id)
  }, [logAudit, addToast])

  // ---- EOR (Employer of Record) ----
  const addEorEntity = useCallback((data: AnyRecord) => {
    const id = genId('eor')
    setEorEntities(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending_setup', employee_count: 0, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'eor_entity', id, `Created EOR entity in ${data.country || 'Unknown'}`)
    addToast('EOR entity created')
    apiPost('eorEntities', 'create', data)
  }, [logAudit, addToast])
  const updateEorEntity = useCallback((id: string, data: AnyRecord) => {
    setEorEntities(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    logAudit('update', 'eor_entity', id, 'Updated EOR entity')
    addToast('EOR entity updated')
    apiPost('eorEntities', 'update', data, id)
  }, [logAudit, addToast])
  const addEorEmployee = useCallback((data: AnyRecord) => {
    const id = genId('eoremp')
    setEorEmployees(prev => [...prev, { id, org_id: orgIdRef.current, status: 'onboarding', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'eor_employee', id, `Added EOR employee: ${data.full_name}`)
    addToast('EOR employee added')
    apiPost('eorEmployees', 'create', data)
  }, [logAudit, addToast])
  const updateEorEmployee = useCallback((id: string, data: AnyRecord) => {
    setEorEmployees(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    logAudit('update', 'eor_employee', id, 'Updated EOR employee')
    addToast('EOR employee updated')
    apiPost('eorEmployees', 'update', data, id)
  }, [logAudit, addToast])
  const addEorContract = useCallback((data: AnyRecord) => {
    const id = genId('eorc')
    setEorContracts(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'eor_contract', id, 'Created EOR contract')
    addToast('EOR contract created')
    apiPost('eorContracts', 'create', data)
  }, [logAudit, addToast])
  const updateEorContract = useCallback((id: string, data: AnyRecord) => {
    setEorContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'eor_contract', id, 'Updated EOR contract')
    addToast('EOR contract updated')
    apiPost('eorContracts', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Contractor of Record ----
  const addCorContractor = useCallback((data: AnyRecord) => {
    const id = genId('cor')
    setCorContractors(prev => [...prev, { id, org_id: orgIdRef.current, status: 'onboarding', compliance_status: 'pending', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'cor_contractor', id, `Added contractor: ${data.full_name}`)
    addToast('Contractor added')
    apiPost('corContractors', 'create', data)
  }, [logAudit, addToast])
  const updateCorContractor = useCallback((id: string, data: AnyRecord) => {
    setCorContractors(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'cor_contractor', id, 'Updated contractor')
    addToast('Contractor updated')
    apiPost('corContractors', 'update', data, id)
  }, [logAudit, addToast])
  const addCorContract = useCallback((data: AnyRecord) => {
    const id = genId('corc')
    setCorContracts(prev => [...prev, { id, org_id: orgIdRef.current, status: 'draft', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'cor_contract', id, `Created contractor agreement: ${data.title || 'Contract'}`)
    addToast('Contractor agreement created')
    apiPost('corContracts', 'create', data)
  }, [logAudit, addToast])
  const updateCorContract = useCallback((id: string, data: AnyRecord) => {
    setCorContracts(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'cor_contract', id, 'Updated contractor agreement')
    addToast('Contractor agreement updated')
    apiPost('corContracts', 'update', data, id)
  }, [logAudit, addToast])
  const addCorPayment = useCallback((data: AnyRecord) => {
    const id = genId('corp')
    setCorPayments(prev => [...prev, { id, org_id: orgIdRef.current, status: 'pending', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'cor_payment', id, 'Contractor payment created')
    addToast('Contractor payment created')
    apiPost('corPayments', 'create', data)
  }, [logAudit, addToast])
  const updateCorPayment = useCallback((id: string, data: AnyRecord) => {
    setCorPayments(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'cor_payment', id, 'Updated contractor payment')
    addToast('Contractor payment updated')
    apiPost('corPayments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Global Benefits ----
  const addGlobalBenefitPlan = useCallback((data: AnyRecord) => {
    const id = genId('gbp')
    setGlobalBenefitPlans(prev => [...prev, { id, org_id: orgIdRef.current, is_active: true, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'global_benefit_plan', id, `Created global benefit: ${data.name || 'Plan'} (${data.country})`)
    addToast('Global benefit plan created')
    apiPost('globalBenefitPlans', 'create', data)
  }, [logAudit, addToast])
  const updateGlobalBenefitPlan = useCallback((id: string, data: AnyRecord) => {
    setGlobalBenefitPlans(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'global_benefit_plan', id, 'Updated global benefit plan')
    addToast('Global benefit plan updated')
    apiPost('globalBenefitPlans', 'update', data, id)
  }, [logAudit, addToast])
  const addCountryBenefitConfig = useCallback((data: AnyRecord) => {
    const id = genId('cbc')
    setCountryBenefitConfigs(prev => [...prev, { id, org_id: orgIdRef.current, updated_at: new Date().toISOString(), ...data }])
    logAudit('create', 'country_benefit_config', id, `Configured benefits for ${data.country || 'country'}`)
    addToast('Country benefits configured')
    apiPost('countryBenefitConfigs', 'create', data)
  }, [logAudit, addToast])
  const updateCountryBenefitConfig = useCallback((id: string, data: AnyRecord) => {
    setCountryBenefitConfigs(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'country_benefit_config', id, 'Updated country benefit config')
    addToast('Country benefit config updated')
    apiPost('countryBenefitConfigs', 'update', data, id)
  }, [logAudit, addToast])
  const addGlobalBenefitEnrollment = useCallback((data: AnyRecord) => {
    const id = genId('gbe')
    setGlobalBenefitEnrollments(prev => [...prev, { id, org_id: orgIdRef.current, enrolled_at: new Date().toISOString().split('T')[0], ...data }])
    logAudit('create', 'global_benefit_enrollment', id, 'Employee enrolled in global benefit')
    addToast('Global benefit enrollment created')
    apiPost('globalBenefitEnrollments', 'create', data)
  }, [logAudit, addToast])
  const updateGlobalBenefitEnrollment = useCallback((id: string, data: AnyRecord) => {
    setGlobalBenefitEnrollments(prev => prev.map(e => e.id === id ? { ...e, ...data } : e))
    logAudit('update', 'global_benefit_enrollment', id, 'Updated global benefit enrollment')
    addToast('Global benefit enrollment updated')
    apiPost('globalBenefitEnrollments', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Workers' Compensation ----
  const addWorkersCompPolicy = useCallback((data: AnyRecord) => {
    const id = genId('wcpol')
    setWorkersCompPolicies(prev => [...prev, { id, org_id: orgIdRef.current, status: 'active', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'workers_comp_policy', id, `Created workers comp policy: ${data.name || 'Policy'}`)
    addToast('Workers comp policy created')
    apiPost('workersCompPolicies', 'create', data)
  }, [logAudit, addToast])
  const updateWorkersCompPolicy = useCallback((id: string, data: AnyRecord) => {
    setWorkersCompPolicies(prev => prev.map(p => p.id === id ? { ...p, ...data } : p))
    logAudit('update', 'workers_comp_policy', id, 'Updated workers comp policy')
    addToast('Workers comp policy updated')
    apiPost('workersCompPolicies', 'update', data, id)
  }, [logAudit, addToast])
  const addWorkersCompClaim = useCallback((data: AnyRecord) => {
    const id = genId('wccl')
    setWorkersCompClaims(prev => [...prev, { id, org_id: orgIdRef.current, status: 'open', filed_date: new Date().toISOString().split('T')[0], created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'workers_comp_claim', id, `Filed workers comp claim for ${data.employee_name || 'Unknown'}`)
    addToast('Workers comp claim filed')
    apiPost('workersCompClaims', 'create', data)
  }, [logAudit, addToast])
  const updateWorkersCompClaim = useCallback((id: string, data: AnyRecord) => {
    setWorkersCompClaims(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'workers_comp_claim', id, 'Updated workers comp claim')
    addToast('Workers comp claim updated')
    apiPost('workersCompClaims', 'update', data, id)
  }, [logAudit, addToast])
  const addWorkersCompClassCode = useCallback((data: AnyRecord) => {
    const id = genId('wccc')
    setWorkersCompClassCodes(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'workers_comp_class_code', id, `Added class code: ${data.code || 'Unknown'}`)
    addToast('Class code added')
    apiPost('workersCompClassCodes', 'create', data)
  }, [logAudit, addToast])
  const updateWorkersCompClassCode = useCallback((id: string, data: AnyRecord) => {
    setWorkersCompClassCodes(prev => prev.map(c => c.id === id ? { ...c, ...data } : c))
    logAudit('update', 'workers_comp_class_code', id, 'Updated class code')
    addToast('Class code updated')
    apiPost('workersCompClassCodes', 'update', data, id)
  }, [logAudit, addToast])
  const addWorkersCompAudit = useCallback((data: AnyRecord) => {
    const id = genId('wcaud')
    setWorkersCompAudits(prev => [...prev, { id, org_id: orgIdRef.current, status: 'scheduled', created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'workers_comp_audit', id, 'Scheduled workers comp audit')
    addToast('Workers comp audit scheduled')
    apiPost('workersCompAudits', 'create', data)
  }, [logAudit, addToast])
  const updateWorkersCompAudit = useCallback((id: string, data: AnyRecord) => {
    setWorkersCompAudits(prev => prev.map(a => a.id === id ? { ...a, ...data } : a))
    logAudit('update', 'workers_comp_audit', id, 'Updated workers comp audit')
    addToast('Workers comp audit updated')
    apiPost('workersCompAudits', 'update', data, id)
  }, [logAudit, addToast])

  // ---- Groups ----
  const addGroup = useCallback((data: AnyRecord) => {
    const id = genId('grp')
    setGroups(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'group', id, `Created group ${data.name || ''}`)
    addToast('Group created')
    apiPost('groups', 'create', data)
  }, [logAudit, addToast])
  const updateGroup = useCallback((id: string, data: AnyRecord) => {
    setGroups(prev => prev.map(g => g.id === id ? { ...g, ...data } : g))
    logAudit('update', 'group', id, 'Updated group')
    addToast('Group updated')
    apiPost('groups', 'update', data, id)
  }, [logAudit, addToast])
  const deleteGroup = useCallback((id: string) => {
    setGroups(prev => prev.filter(g => g.id !== id))
    logAudit('delete', 'group', id, 'Deleted group')
    addToast('Group deleted')
    apiPost('groups', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- Provisioning Rules ----
  const addProvisioningRule = useCallback((data: AnyRecord) => {
    const id = genId('pr')
    setProvisioningRules(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'provisioning_rule', id, `Created provisioning rule ${data.name || ''}`)
    addToast('Provisioning rule created')
    apiPost('provisioningRules', 'create', data)
  }, [logAudit, addToast])
  const updateProvisioningRule = useCallback((id: string, data: AnyRecord) => {
    setProvisioningRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'provisioning_rule', id, 'Updated provisioning rule')
    addToast('Provisioning rule updated')
    apiPost('provisioningRules', 'update', data, id)
  }, [logAudit, addToast])
  const deleteProvisioningRule = useCallback((id: string) => {
    setProvisioningRules(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'provisioning_rule', id, 'Deleted provisioning rule')
    addToast('Provisioning rule deleted')
    apiPost('provisioningRules', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- Encryption Policies ----
  const addEncryptionPolicy = useCallback((data: AnyRecord) => {
    const id = genId('ep')
    setEncryptionPolicies(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'encryption_policy', id, `Created encryption policy ${data.name || ''}`)
    addToast('Encryption policy created')
    apiPost('encryptionPolicies', 'create', data)
  }, [logAudit, addToast])
  const updateEncryptionPolicy = useCallback((id: string, data: AnyRecord) => {
    setEncryptionPolicies(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'encryption_policy', id, 'Updated encryption policy')
    addToast('Encryption policy updated')
    apiPost('encryptionPolicies', 'update', data, id)
  }, [logAudit, addToast])
  const deleteEncryptionPolicy = useCallback((id: string) => {
    setEncryptionPolicies(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'encryption_policy', id, 'Deleted encryption policy')
    addToast('Encryption policy deleted')
    apiPost('encryptionPolicies', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- SCIM Providers ----
  const addScimProvider = useCallback((data: AnyRecord) => {
    const id = genId('scim')
    setScimProviders(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'scim_provider', id, `Created SCIM provider ${data.name || ''}`)
    addToast('SCIM provider created')
    apiPost('scimProviders', 'create', data)
  }, [logAudit, addToast])
  const updateScimProvider = useCallback((id: string, data: AnyRecord) => {
    setScimProviders(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'scim_provider', id, 'Updated SCIM provider')
    addToast('SCIM provider updated')
    apiPost('scimProviders', 'update', data, id)
  }, [logAudit, addToast])
  const deleteScimProvider = useCallback((id: string) => {
    setScimProviders(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'scim_provider', id, 'Deleted SCIM provider')
    addToast('SCIM provider deleted')
    apiPost('scimProviders', 'delete', undefined, id)
  }, [logAudit, addToast])

  // ---- Auto Detection Scans ----
  const addAutoDetectionScan = useCallback((data: AnyRecord) => {
    const id = genId('ad')
    setAutoDetectionScans(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'auto_detection_scan', id, `Created auto detection scan ${data.name || ''}`)
    addToast('Auto detection scan created')
    apiPost('autoDetectionScans', 'create', data)
  }, [logAudit, addToast])
  const updateAutoDetectionScan = useCallback((id: string, data: AnyRecord) => {
    setAutoDetectionScans(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'auto_detection_scan', id, 'Updated auto detection scan')
    addToast('Auto detection scan updated')
    apiPost('autoDetectionScans', 'update', data, id)
  }, [logAudit, addToast])
  const deleteAutoDetectionScan = useCallback((id: string) => {
    setAutoDetectionScans(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'auto_detection_scan', id, 'Deleted auto detection scan')
    addToast('Auto detection scan deleted')
    apiPost('autoDetectionScans', 'delete', undefined, id)
  }, [logAudit, addToast])
  const addShadowITDetection = useCallback((data: AnyRecord) => {
    const id = genId('sit')
    setShadowITDetections(prev => [...prev, { id, org_id: orgIdRef.current, created_at: new Date().toISOString(), ...data }])
    logAudit('create', 'shadow_it_detection', id, `Detected shadow IT: ${data.app_name || ''}`)
    addToast('Shadow IT detection added')
    apiPost('shadowITDetections', 'create', data)
  }, [logAudit, addToast])
  const updateShadowITDetection = useCallback((id: string, data: AnyRecord) => {
    setShadowITDetections(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    logAudit('update', 'shadow_it_detection', id, 'Updated shadow IT detection')
    addToast('Shadow IT detection updated')
    apiPost('shadowITDetections', 'update', data, id)
  }, [logAudit, addToast])
  const deleteShadowITDetection = useCallback((id: string) => {
    setShadowITDetections(prev => prev.filter(r => r.id !== id))
    logAudit('delete', 'shadow_it_detection', id, 'Deleted shadow IT detection')
    addToast('Shadow IT detection deleted')
    apiPost('shadowITDetections', 'delete', undefined, id)
  }, [logAudit, addToast])

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
          await loadDemoData(demoOrgId)
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
    const demoModule = await loadDemoModule()
    const cred = demoModule.allDemoCredentials.find(c => c.email === email && c.password === password)
    if (!cred) return false
    // Determine which org this credential belongs to
    const orgId = cred.employeeId.startsWith('kemp-') ? 'org-2' : 'org-1'
    // Load the correct org's demo data
    await loadDemoData(orgId)
    const orgData = demoModule.getDemoDataForOrg(orgId)
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
      await loadDemoData(orgId)
      const demoModule = await loadDemoModule()
      const orgData = demoModule.getDemoDataForOrg(orgId)
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
    org, user: { full_name: currentUser?.full_name || 'User', email: currentUser?.email || '' } as any, currentUser, currentEmployeeId, departments, employees,
    goals, reviewCycles, reviews, feedback,
    oneOnOnes, recognitions, competencyFramework, competencyRatings,
    compBands, salaryReviews, equityGrants, compPlanningCycles,
    courses, enrollments, learningPaths, liveSessions, courseBlocks, quizQuestions, discussions, studyGroups, complianceTraining, autoEnrollRules, assessmentAttempts, learningAssignments,
    surveys, engagementScores, actionPlans, surveyResponses,
    mentoringPrograms, mentoringPairs, mentoringSessions, mentoringGoals,
    payrollRuns, employeePayrollEntries, setPayrollRuns: (fn: (prev: any[]) => any[]) => setPayrollRuns(fn as any), setEmployeePayrollEntries: (fn: (prev: any[]) => any[]) => setEmployeePayrollEntries(fn as any), contractorPayments, payrollSchedules, taxConfigs, complianceIssues, taxFilings, payrollApprovals, payrollApprovalConfig,
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
    isLoading, ensureModulesLoaded,
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
    addComplianceTraining, updateComplianceTraining,
    addAutoEnrollRule, updateAutoEnrollRule, deleteAutoEnrollRule,
    addAssessmentAttempt, updateAssessmentAttempt,
    addLearningAssignment, updateLearningAssignment,
    coursePrerequisites, addCoursePrerequisite, deleteCoursePrerequisite,
    scormPackages, addScormPackage, updateScormPackage,
    scormTracking, addScormTracking, updateScormTracking,
    contentLibrary, addContentLibraryItem, updateContentLibraryItem, deleteContentLibraryItem,
    learnerBadges, addLearnerBadge,
    learnerPoints, addLearnerPoints,
    certificateTemplates, addCertificateTemplate, updateCertificateTemplate,
    addSurvey, updateSurvey,
    addActionPlan, updateActionPlan,
    surveyTemplates, surveySchedules, surveyTriggers, openEndedResponses,
    addSurveyTemplate, updateSurveyTemplate, deleteSurveyTemplate,
    addSurveySchedule, updateSurveySchedule, deleteSurveySchedule,
    addSurveyTrigger, updateSurveyTrigger, deleteSurveyTrigger,
    addOpenEndedResponse, updateOpenEndedResponse,
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
    timeEntries, timeOffPolicies, timeOffBalances, overtimeRules, shifts: shifts_data,
    addTimeEntry, updateTimeEntry, deleteTimeEntry,
    addTimeOffPolicy, updateTimeOffPolicy, deleteTimeOffPolicy,
    addTimeOffBalance, updateTimeOffBalance,
    addOvertimeRule, updateOvertimeRule, deleteOvertimeRule,
    addShift, updateShift, deleteShift,
    addBenefitPlan, updateBenefitPlan,
    addBenefitEnrollment, updateBenefitEnrollment,
    addBenefitDependent, updateBenefitDependent,
    addLifeEvent, updateLifeEvent,
    openEnrollmentPeriods, cobraEvents, acaTracking, flexBenefitAccounts, flexBenefitTransactions,
    addOpenEnrollmentPeriod, updateOpenEnrollmentPeriod,
    addCobraEvent, updateCobraEvent,
    addAcaTracking, updateAcaTracking,
    addFlexBenefitAccount, updateFlexBenefitAccount,
    addFlexBenefitTransaction, updateFlexBenefitTransaction,
    addExpenseReport, updateExpenseReport, deleteExpenseReport,
    addExpensePolicy, updateExpensePolicy,
    addMileageLog, updateMileageLog,
    receiptMatches, addReceiptMatch, updateReceiptMatch,
    mileageEntries, addMileageEntry, updateMileageEntry,
    advancedExpensePolicies, addAdvancedExpensePolicy, updateAdvancedExpensePolicy, deleteAdvancedExpensePolicy,
    reimbursementBatches, addReimbursementBatch, updateReimbursementBatch,
    duplicateDetections, addDuplicateDetection, updateDuplicateDetection,
    addJobPosting, updateJobPosting,
    addApplication, updateApplication,
    updateCareerSiteConfig,
    addJobDistribution, updateJobDistribution,
    interviews, talentPools, scoreCards,
    addInterview, updateInterview,
    addTalentPool, updateTalentPool,
    addScoreCard, updateScoreCard,
    backgroundChecks, referralProgram, referrals, knockoutQuestions, candidateScheduling,
    addBackgroundCheck, updateBackgroundCheck,
    updateReferralProgram,
    addReferral, updateReferral,
    addKnockoutQuestion, updateKnockoutQuestion, deleteKnockoutQuestion,
    addCandidateScheduling, updateCandidateScheduling,
    addDevice, updateDevice,
    addSoftwareLicense, updateSoftwareLicense,
    addITRequest, updateITRequest,
    managedDevices, deviceActions, appCatalog, appAssignments, securityPoliciesIT, deviceInventory,
    addManagedDevice, updateManagedDevice, deleteManagedDevice,
    addDeviceAction, updateDeviceAction,
    addAppCatalogItem, updateAppCatalogItem, deleteAppCatalogItem,
    addAppAssignment, updateAppAssignment, deleteAppAssignment,
    addSecurityPolicyIT, updateSecurityPolicyIT, deleteSecurityPolicyIT,
    addDeviceInventoryItem, updateDeviceInventoryItem, deleteDeviceInventoryItem,
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
    automationWorkflows, automationWorkflowSteps, automationWorkflowRuns, automationWorkflowRunSteps, automationWorkflowTemplates,
    addAutomationWorkflow, updateAutomationWorkflow, deleteAutomationWorkflow,
    addAutomationWorkflowStep, updateAutomationWorkflowStep, deleteAutomationWorkflowStep,
    addAutomationWorkflowRun, updateAutomationWorkflowRun,
    employeeDocuments, employeeTimeline,
    addEmployeeDocument, updateEmployeeDocument,
    buddyAssignments, preboardingTasks, welcomeContent,
    addBuddyAssignment, updateBuddyAssignment,
    addPreboardingTask, updatePreboardingTask,
    offboardingChecklists, offboardingChecklistItems, offboardingProcesses, offboardingTasks, exitSurveys,
    addOffboardingChecklist, updateOffboardingChecklist,
    addOffboardingChecklistItem, updateOffboardingChecklistItem, deleteOffboardingChecklistItem,
    addOffboardingProcess, updateOffboardingProcess,
    addOffboardingTask, updateOffboardingTask,
    addExitSurvey,
    headcountPlans, headcountPositions, headcountBudgetItems,
    addHeadcountPlan, updateHeadcountPlan,
    addHeadcountPosition, updateHeadcountPosition, deleteHeadcountPosition,
    addHeadcountBudgetItem, updateHeadcountBudgetItem, deleteHeadcountBudgetItem,
    pips, pipCheckIns, meritCycles, meritRecommendations, reviewTemplates,
    addPIP, updatePIP, deletePIP, addPIPCheckIn,
    addMeritCycle, updateMeritCycle, addMeritRecommendation, updateMeritRecommendation,
    addReviewTemplate, updateReviewTemplate, deleteReviewTemplate,
    offers, careerTracks, marketBenchmarks, widgetPreferences,
    addOffer, updateOffer, updateWidgetPreferences, journeys, updateJourneyStep,
    customFieldDefinitions, customFieldValues,
    addCustomFieldDefinition, updateCustomFieldDefinition, deleteCustomFieldDefinition,
    addCustomFieldValue, updateCustomFieldValue,
    emergencyContacts,
    addEmergencyContact, updateEmergencyContact, deleteEmergencyContact,
    complianceRequirements, complianceDocuments, complianceAlerts,
    addComplianceRequirement, updateComplianceRequirement, deleteComplianceRequirement,
    addComplianceDocument, updateComplianceDocument, deleteComplianceDocument,
    addComplianceAlert, updateComplianceAlert, dismissComplianceAlert,
    markNotificationRead, markAllNotificationsRead,
    updateOrg,
    // GAP CLOSURE: New feature state & CRUD
    signatureDocuments, signatureTemplates,
    addSignatureDocument, updateSignatureDocument, deleteSignatureDocument,
    addSignatureTemplate, updateSignatureTemplate,
    i9Forms, everifyCases,
    addI9Form, updateI9Form, addEVerifyCase, updateEVerifyCase,
    peoConfigurations, coEmploymentRecords,
    addPeoConfiguration, updatePeoConfiguration, addCoEmploymentRecord, updateCoEmploymentRecord,
    sandboxEnvironments, addSandboxEnvironment, updateSandboxEnvironment, deleteSandboxEnvironment,
    chatChannels, chatMessages, chatParticipants,
    addChatChannel, updateChatChannel, addChatMessage, updateChatMessage, deleteChatMessage,
    interviewRecordings, interviewTranscriptions,
    addInterviewRecording, updateInterviewRecording,
    videoScreenTemplates, videoScreenInvites, videoScreenResponses,
    addVideoScreenTemplate, updateVideoScreenTemplate,
    addVideoScreenInvite, updateVideoScreenInvite,
    addVideoScreenResponse, updateVideoScreenResponse,
    corporateCards, cardTransactions,
    addCorporateCard, updateCorporateCard, addCardTransaction, updateCardTransaction,
    billPayments, billPaySchedules,
    addBillPayment, updateBillPayment, addBillPaySchedule, updateBillPaySchedule,
    travelRequests, travelBookings, travelPolicies,
    addTravelRequest, updateTravelRequest, addTravelBooking, updateTravelBooking, addTravelPolicy, updateTravelPolicy,
    purchaseOrders, purchaseOrderItems, procurementRequests,
    addPurchaseOrder, updatePurchaseOrder, addProcurementRequest, updateProcurementRequest,
    currencyAccounts, fxTransactions,
    addCurrencyAccount, updateCurrencyAccount, deleteCurrencyAccount, addFxTransaction,
    retirementPlans, retirementEnrollments, retirementContributions,
    addRetirementPlan, updateRetirementPlan, addRetirementEnrollment, updateRetirementEnrollment, addRetirementContribution,
    carrierIntegrations, enrollmentFeeds,
    addCarrierIntegration, updateCarrierIntegration, addEnrollmentFeed,
    geofenceZones, geofenceEvents,
    addGeofenceZone, updateGeofenceZone, deleteGeofenceZone, addGeofenceEvent,
    idpConfigurations, samlApps, mfaPolicies,
    addIdpConfiguration, updateIdpConfiguration, addSamlApp, updateSamlApp, addMfaPolicy, updateMfaPolicy,
    deploymentProfiles, enrollmentTokens,
    addDeploymentProfile, updateDeploymentProfile, addEnrollmentToken, updateEnrollmentToken,
    passwordVaults, vaultItems,
    addPasswordVault, updatePasswordVault, addVaultItem, updateVaultItem, deleteVaultItem,
    deviceStoreCatalog, deviceOrders, buybackRequests,
    addDeviceStoreCatalogItem, updateDeviceStoreCatalogItem, addDeviceOrder, updateDeviceOrder, addBuybackRequest, updateBuybackRequest,
    customApps, appPages, appComponents, appDataSources,
    addCustomApp, updateCustomApp, deleteCustomApp, addAppPage, updateAppPage, addAppComponent, updateAppComponent, addAppDataSource, updateAppDataSource,
    savedQueries, querySchedules,
    addSavedQuery, updateSavedQuery, deleteSavedQuery, addQuerySchedule, updateQuerySchedule,
    eorEntities, eorEmployees, eorContracts,
    addEorEntity, updateEorEntity, addEorEmployee, updateEorEmployee, addEorContract, updateEorContract,
    corContractors, corContracts, corPayments,
    addCorContractor, updateCorContractor, addCorContract, updateCorContract, addCorPayment, updateCorPayment,
    globalBenefitPlans, countryBenefitConfigs, globalBenefitEnrollments,
    addGlobalBenefitPlan, updateGlobalBenefitPlan, addCountryBenefitConfig, updateCountryBenefitConfig, addGlobalBenefitEnrollment, updateGlobalBenefitEnrollment,
    workersCompPolicies, workersCompClaims, workersCompClassCodes, workersCompAudits,
    addWorkersCompPolicy, updateWorkersCompPolicy, addWorkersCompClaim, updateWorkersCompClaim,
    addWorkersCompClassCode, updateWorkersCompClassCode, addWorkersCompAudit, updateWorkersCompAudit,
    groups, addGroup, updateGroup, deleteGroup,
    provisioningRules, addProvisioningRule, updateProvisioningRule, deleteProvisioningRule,
    encryptionPolicies, addEncryptionPolicy, updateEncryptionPolicy, deleteEncryptionPolicy,
    scimProviders, addScimProvider, updateScimProvider, deleteScimProvider,
    autoDetectionScans, addAutoDetectionScan, updateAutoDetectionScan, deleteAutoDetectionScan,
    shadowITDetections, addShadowITDetection, updateShadowITDetection, deleteShadowITDetection,
    login, verifyMFA, logout, switchUser, isLoggedIn,
    getEmployeeName, getDepartmentName,
  }

  return <TempoContext.Provider value={value}>{children}</TempoContext.Provider>
}
