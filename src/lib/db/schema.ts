import {
  pgTable, text, varchar, integer, boolean, timestamp, date,
  real, jsonb, pgEnum, uuid, serial,
} from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

// ============================================================
// ENUMS
// ============================================================

export const orgPlanEnum = pgEnum('org_plan', ['free', 'starter', 'professional', 'enterprise'])
export const employeeRoleEnum = pgEnum('employee_role', ['owner', 'admin', 'hrbp', 'manager', 'employee'])
export const goalCategoryEnum = pgEnum('goal_category', ['business', 'project', 'development', 'compliance'])
export const goalStatusEnum = pgEnum('goal_status', ['not_started', 'on_track', 'at_risk', 'behind', 'completed'])
export const reviewTypeEnum = pgEnum('review_type', ['annual', 'mid_year', 'quarterly', 'probation', 'manager', 'peer', 'self'])
export const reviewStatusEnum = pgEnum('review_status', ['pending', 'in_progress', 'submitted', 'completed'])
export const reviewCycleTypeEnum = pgEnum('review_cycle_type', ['annual', 'mid_year', 'quarterly', 'probation'])
export const reviewCycleStatusEnum = pgEnum('review_cycle_status', ['draft', 'active', 'completed'])
export const feedbackTypeEnum = pgEnum('feedback_type', ['recognition', 'feedback', 'checkin'])
export const salaryReviewStatusEnum = pgEnum('salary_review_status', ['draft', 'pending_approval', 'approved', 'rejected'])
export const courseFormatEnum = pgEnum('course_format', ['online', 'classroom', 'blended'])
export const courseLevelEnum = pgEnum('course_level', ['beginner', 'intermediate', 'advanced'])
export const enrollmentStatusEnum = pgEnum('enrollment_status', ['enrolled', 'in_progress', 'completed', 'dropped'])
export const surveyTypeEnum = pgEnum('survey_type', ['pulse', 'enps', 'annual', 'custom'])
export const surveyStatusEnum = pgEnum('survey_status', ['draft', 'active', 'closed'])
export const mentoringTypeEnum = pgEnum('mentoring_type', ['one_on_one', 'group', 'reverse', 'peer'])
export const mentoringStatusEnum = pgEnum('mentoring_status', ['draft', 'active', 'completed', 'paused'])
export const pairStatusEnum = pgEnum('pair_status', ['pending', 'active', 'completed', 'cancelled'])
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'approved', 'processing', 'paid', 'cancelled'])
export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'compassionate'])
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled'])
export const benefitTypeEnum = pgEnum('benefit_type', ['medical', 'dental', 'vision', 'retirement', 'life', 'disability', 'wellness', 'hsa', 'fsa', 'commuter', 'voluntary', 'other'])
export const expenseStatusEnum = pgEnum('expense_status', ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed'])
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'internship'])
export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'filled'])
export const applicationStatusEnum = pgEnum('application_status', ['new', 'screening', 'interview', 'offer', 'hired', 'rejected', 'withdrawn'])
export const deviceTypeEnum = pgEnum('device_type', ['laptop', 'desktop', 'phone', 'tablet', 'monitor', 'peripheral', 'other'])
export const deviceStatusEnum = pgEnum('device_status', ['available', 'assigned', 'maintenance', 'retired'])
export const itRequestTypeEnum = pgEnum('it_request_type', ['hardware', 'software', 'access', 'support', 'other'])
export const itRequestPriorityEnum = pgEnum('it_request_priority', ['low', 'medium', 'high', 'critical'])
export const itRequestStatusEnum = pgEnum('it_request_status', ['open', 'in_progress', 'resolved', 'closed', 'cancelled'])
export const invoiceStatusEnum = pgEnum('invoice_status', ['draft', 'sent', 'paid', 'overdue', 'cancelled'])
export const budgetStatusEnum = pgEnum('budget_status', ['draft', 'active', 'closed'])
export const vendorStatusEnum = pgEnum('vendor_status', ['active', 'inactive'])
export const auditActionEnum = pgEnum('audit_action', ['create', 'update', 'delete', 'login', 'logout', 'approve', 'reject'])

// ============================================================
// CORE: Organizations & Employees
// ============================================================

export const organizations = pgTable('organizations', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  logoUrl: text('logo_url'),
  plan: orgPlanEnum('plan').default('free').notNull(),
  industry: varchar('industry', { length: 255 }),
  size: varchar('size', { length: 50 }),
  country: varchar('country', { length: 100 }),
  isActive: boolean('is_active').default(true).notNull(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
  enabledModules: jsonb('enabled_modules'), // string[] of module ids
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const departments = pgTable('departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  parentId: uuid('parent_id'), // self-reference, FK managed at DB level
  headId: uuid('head_id'), // FK to employees, managed at DB level
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const employees = pgTable('employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  jobTitle: varchar('job_title', { length: 255 }),
  level: varchar('level', { length: 100 }),
  country: varchar('country', { length: 100 }),
  role: employeeRoleEnum('role').default('employee').notNull(),
  managerId: uuid('manager_id'), // self-reference, FK managed at DB level
  hireDate: date('hire_date'),
  passwordHash: text('password_hash'), // for auth
  isActive: boolean('is_active').default(true).notNull(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  invitedBy: uuid('invited_by'), // FK to employees, managed at DB level
  invitationToken: varchar('invitation_token', { length: 500 }),
  invitationExpiresAt: timestamp('invitation_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// PERFORMANCE: Goals, Reviews, Feedback
// ============================================================

export const goals = pgTable('goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: goalCategoryEnum('category').default('business').notNull(),
  status: goalStatusEnum('status').default('not_started').notNull(),
  progress: integer('progress').default(0).notNull(),
  startDate: date('start_date'),
  dueDate: date('due_date'),
  parentGoalId: uuid('parent_goal_id'), // self-reference for OKR cascading, FK managed at DB level
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const reviewCycles = pgTable('review_cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  type: reviewCycleTypeEnum('type').notNull(),
  status: reviewCycleStatusEnum('status').default('draft').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const reviews = pgTable('reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  cycleId: uuid('cycle_id').references(() => reviewCycles.id),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  reviewerId: uuid('reviewer_id').references(() => employees.id),
  type: reviewTypeEnum('type').notNull(),
  status: reviewStatusEnum('status').default('pending').notNull(),
  overallRating: integer('overall_rating'),
  ratings: jsonb('ratings'), // { leadership: 4, execution: 5, ... }
  comments: text('comments'),
  submittedAt: timestamp('submitted_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const feedback = pgTable('feedback', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  fromId: uuid('from_id').references(() => employees.id).notNull(),
  toId: uuid('to_id').references(() => employees.id).notNull(),
  type: feedbackTypeEnum('type').notNull(),
  content: text('content').notNull(),
  isPublic: boolean('is_public').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// COMPENSATION: Bands, Salary Reviews
// ============================================================

export const compBands = pgTable('comp_bands', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  roleTitle: varchar('role_title', { length: 255 }).notNull(),
  level: varchar('level', { length: 100 }),
  country: varchar('country', { length: 100 }),
  minSalary: integer('min_salary').notNull(),
  midSalary: integer('mid_salary').notNull(),
  maxSalary: integer('max_salary').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  p25: integer('p25'),
  p50: integer('p50'),
  p75: integer('p75'),
  effectiveDate: date('effective_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const salaryReviews = pgTable('salary_reviews', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  proposedBy: uuid('proposed_by').references(() => employees.id),
  currentSalary: integer('current_salary').notNull(),
  proposedSalary: integer('proposed_salary').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  justification: text('justification'),
  status: salaryReviewStatusEnum('status').default('draft').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  cycle: varchar('cycle', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// LEARNING: Courses, Enrollments
// ============================================================

export const courses = pgTable('courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  durationHours: integer('duration_hours'),
  format: courseFormatEnum('format').default('online').notNull(),
  level: courseLevelEnum('level').default('beginner').notNull(),
  isMandatory: boolean('is_mandatory').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const enrollments = pgTable('enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  status: enrollmentStatusEnum('status').default('enrolled').notNull(),
  progress: integer('progress').default(0).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

// ============================================================
// LEARNING: Paths, Content, Assessments, Certificates, Rules
// ============================================================

export const contentTypeEnum = pgEnum('content_type', ['video', 'document', 'slides', 'quiz', 'assignment', 'interactive'])

export const learningPaths = pgTable('learning_paths', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  courseIds: jsonb('course_ids').notNull(), // ordered string[]
  targetRoles: jsonb('target_roles'), // string[]
  estimatedHours: real('estimated_hours'),
  isPublished: boolean('is_published').default(false).notNull(),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const courseContent = pgTable('course_content', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  type: contentTypeEnum('type').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  contentUrl: text('content_url'), // S3 URL or external link
  durationMinutes: integer('duration_minutes'),
  position: integer('position').default(0).notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  passingScore: integer('passing_score'), // for quiz type, percentage needed to pass
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const quizQuestions = pgTable('quiz_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  courseContentId: uuid('course_content_id').references(() => courseContent.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(),
  options: jsonb('options').notNull(), // { label: string, value: string }[]
  correctAnswer: varchar('correct_answer', { length: 255 }).notNull(),
  explanation: text('explanation'),
  points: integer('points').default(1).notNull(),
  position: integer('position').default(0).notNull(),
})

export const assessmentAttempts = pgTable('assessment_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  courseContentId: uuid('course_content_id').references(() => courseContent.id, { onDelete: 'cascade' }).notNull(),
  answers: jsonb('answers'), // { questionId: string, answer: string, isCorrect: boolean }[]
  score: integer('score').notNull(),
  maxScore: integer('max_score').notNull(),
  percentage: real('percentage').notNull(),
  passed: boolean('passed').notNull(),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  completedAt: timestamp('completed_at').defaultNow().notNull(),
})

export const autoEnrollRules = pgTable('auto_enroll_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  departmentId: uuid('department_id').references(() => departments.id),
  role: varchar('role', { length: 100 }),
  jobTitle: varchar('job_title', { length: 255 }),
  courseIds: jsonb('course_ids').notNull(), // string[]
  triggerEvent: varchar('trigger_event', { length: 50 }).notNull(), // new_hire, role_change, department_change, manual
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const certificates = pgTable('certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: uuid('enrollment_id').references(() => enrollments.id),
  certificateNumber: varchar('certificate_number', { length: 100 }).notNull(),
  certificateUrl: text('certificate_url'),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  expiresAt: timestamp('expires_at'), // null = never expires
})

// ============================================================
// LEARNING: Content Block Progress Tracking
// ============================================================

export const blockProgressStatusEnum = pgEnum('block_progress_status', ['not_started', 'in_progress', 'completed'])

export const contentBlockProgress = pgTable('content_block_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: uuid('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  blockId: uuid('block_id').references(() => courseContent.id, { onDelete: 'cascade' }).notNull(),
  blockType: contentTypeEnum('block_type').notNull(),
  status: blockProgressStatusEnum('status').default('not_started').notNull(),
  progressPercent: integer('progress_percent').default(0).notNull(),
  timeSpentMinutes: integer('time_spent_minutes').default(0).notNull(),
  score: integer('score'),
  attempts: integer('attempts'),
  completedAt: timestamp('completed_at'),
  lastAccessedAt: timestamp('last_accessed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// ENGAGEMENT: Surveys, Scores
// ============================================================

export const surveys = pgTable('surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  type: surveyTypeEnum('type').notNull(),
  status: surveyStatusEnum('status').default('draft').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  anonymous: boolean('anonymous').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const engagementScores = pgTable('engagement_scores', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  countryId: varchar('country_id', { length: 100 }),
  period: varchar('period', { length: 50 }).notNull(),
  overallScore: integer('overall_score').notNull(),
  enpsScore: integer('enps_score'),
  responseRate: integer('response_rate'),
  themes: jsonb('themes'), // string[]
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// MENTORING: Programs, Pairs
// ============================================================

export const mentoringPrograms = pgTable('mentoring_programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  type: mentoringTypeEnum('type').notNull(),
  status: mentoringStatusEnum('status').default('draft').notNull(),
  durationMonths: integer('duration_months'),
  startDate: date('start_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const mentoringPairs = pgTable('mentoring_pairs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  programId: uuid('program_id').references(() => mentoringPrograms.id, { onDelete: 'cascade' }).notNull(),
  mentorId: uuid('mentor_id').references(() => employees.id).notNull(),
  menteeId: uuid('mentee_id').references(() => employees.id).notNull(),
  status: pairStatusEnum('status').default('pending').notNull(),
  matchScore: integer('match_score'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
})

// ============================================================
// PAYROLL
// ============================================================

export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  period: varchar('period', { length: 100 }).notNull(),
  status: payrollStatusEnum('status').default('draft').notNull(),
  totalGross: integer('total_gross').notNull(),
  totalNet: integer('total_net').notNull(),
  totalDeductions: integer('total_deductions').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  employeeCount: integer('employee_count').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  paymentReference: varchar('payment_reference', { length: 255 }),
  cancellationReason: text('cancellation_reason'),
  runDate: timestamp('run_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const employeePayrollEntries = pgTable('employee_payroll_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  grossPay: integer('gross_pay').notNull(),
  basePay: integer('base_pay').notNull(),
  overtimePay: integer('overtime_pay').default(0).notNull(),
  overtimeHours: real('overtime_hours').default(0),
  overtimeRate: real('overtime_rate').default(1.5),
  bonusPay: integer('bonus_pay').default(0).notNull(),
  bonusDetails: jsonb('bonus_details'), // { type: string, amount: number, description: string }[]
  federalTax: integer('federal_tax').notNull(),
  stateTax: integer('state_tax').default(0).notNull(),
  socialSecurity: integer('social_security').default(0).notNull(),
  medicare: integer('medicare').default(0).notNull(),
  pension: integer('pension').default(0).notNull(),
  additionalTaxes: jsonb('additional_taxes'), // Record<string, number>
  garnishments: jsonb('garnishments'), // { type: string, amount: number, caseNumber?: string, priority: number }[]
  garnishmentTotal: integer('garnishment_total').default(0).notNull(),
  benefitDeductions: integer('benefit_deductions').default(0).notNull(),
  totalDeductions: integer('total_deductions').notNull(),
  netPay: integer('net_pay').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  country: varchar('country', { length: 10 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// TIME & ATTENDANCE
// ============================================================

export const leaveRequests = pgTable('leave_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  type: leaveTypeEnum('type').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  days: integer('days').notNull(),
  status: leaveStatusEnum('status').default('pending').notNull(),
  reason: text('reason'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// BENEFITS
// ============================================================

export const benefitPlans = pgTable('benefit_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: benefitTypeEnum('type').notNull(),
  provider: varchar('provider', { length: 255 }),
  costEmployee: integer('cost_employee').default(0).notNull(),
  costEmployer: integer('cost_employer').default(0).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const benefitEnrollments = pgTable('benefit_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => benefitPlans.id, { onDelete: 'cascade' }).notNull(),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  cancelledAt: timestamp('cancelled_at'),
})

// ============================================================
// EXPENSE
// ============================================================

export const expenseReports = pgTable('expense_reports', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: expenseStatusEnum('status').default('draft').notNull(),
  submittedAt: timestamp('submitted_at'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const expenseItems = pgTable('expense_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  reportId: uuid('report_id').references(() => expenseReports.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  description: text('description'),
  amount: integer('amount').notNull(),
  receiptUrl: text('receipt_url'),
  ocrData: jsonb('ocr_data'), // { vendor, amount, date, category, confidence }
  metadata: jsonb('metadata'), // additional item metadata
})

export const expensePolicies = pgTable('expense_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(),
  maxAmount: integer('max_amount'), // per-item limit in cents
  maxDailyAmount: integer('max_daily_amount'), // per-day limit
  requiresReceipt: boolean('requires_receipt').default(true).notNull(),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  autoApproveBelow: integer('auto_approve_below'), // auto-approve items below this amount
  allowedRoles: jsonb('allowed_roles'), // string[] of employee roles that can claim
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// APPROVAL CHAINS (reusable across modules)
// ============================================================

export const approvalStatusEnum = pgEnum('approval_status', ['pending', 'approved', 'rejected', 'skipped'])

export const approvalChains = pgTable('approval_chains', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // 'expense', 'leave', 'payroll', etc.
  name: varchar('name', { length: 255 }).notNull(),
  minAmount: integer('min_amount'), // trigger threshold (in cents)
  maxAmount: integer('max_amount'), // upper bound for this chain
  approverRoles: jsonb('approver_roles'), // string[] of roles that can approve at each level
  approverIds: jsonb('approver_ids'), // string[] of specific employee IDs
  requiredApprovals: integer('required_approvals').default(1).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const approvalSteps = pgTable('approval_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  chainId: uuid('chain_id').references(() => approvalChains.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(),
  entityId: uuid('entity_id').notNull(),
  stepOrder: integer('step_order').default(1).notNull(),
  approverId: uuid('approver_id').references(() => employees.id).notNull(),
  status: approvalStatusEnum('status').default('pending').notNull(),
  comments: text('comments'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// RECRUITING
// ============================================================

export const jobPostings = pgTable('job_postings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  location: varchar('location', { length: 255 }),
  type: jobTypeEnum('type').default('full_time').notNull(),
  description: text('description'),
  requirements: text('requirements'),
  salaryMin: integer('salary_min'),
  salaryMax: integer('salary_max'),
  currency: varchar('currency', { length: 10 }).default('USD'),
  status: jobStatusEnum('status').default('draft').notNull(),
  applicationCount: integer('application_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const applications = pgTable('applications', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  jobId: uuid('job_id').references(() => jobPostings.id, { onDelete: 'cascade' }).notNull(),
  candidateName: varchar('candidate_name', { length: 255 }).notNull(),
  candidateEmail: varchar('candidate_email', { length: 255 }).notNull(),
  status: applicationStatusEnum('status').default('new').notNull(),
  stage: varchar('stage', { length: 255 }),
  rating: integer('rating'),
  notes: text('notes'),
  resumeUrl: text('resume_url'),
  appliedAt: timestamp('applied_at').defaultNow().notNull(),
})

// ============================================================
// IT: Devices, Licenses, Requests
// ============================================================

export const devices = pgTable('devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  type: deviceTypeEnum('type').notNull(),
  brand: varchar('brand', { length: 100 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  status: deviceStatusEnum('status').default('available').notNull(),
  assignedTo: uuid('assigned_to').references(() => employees.id),
  purchaseDate: date('purchase_date'),
  warrantyEnd: date('warranty_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const softwareLicenses = pgTable('software_licenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  totalLicenses: integer('total_licenses').notNull(),
  usedLicenses: integer('used_licenses').default(0).notNull(),
  costPerLicense: real('cost_per_license'),
  currency: varchar('currency', { length: 10 }).default('USD'),
  renewalDate: date('renewal_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const itRequests = pgTable('it_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  requesterId: uuid('requester_id').references(() => employees.id).notNull(),
  type: itRequestTypeEnum('type').notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  priority: itRequestPriorityEnum('priority').default('medium').notNull(),
  status: itRequestStatusEnum('status').default('open').notNull(),
  assignedTo: uuid('assigned_to').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  resolvedAt: timestamp('resolved_at'),
})

// ============================================================
// FINANCE: Invoices, Budgets, Vendors
// ============================================================

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  contactEmail: varchar('contact_email', { length: 255 }),
  category: varchar('category', { length: 100 }),
  status: vendorStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const invoices = pgTable('invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: invoiceStatusEnum('status').default('draft').notNull(),
  dueDate: date('due_date'),
  issuedDate: date('issued_date'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const budgets = pgTable('budgets', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  totalAmount: integer('total_amount').notNull(),
  spentAmount: integer('spent_amount').default(0).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
  status: budgetStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// AUDIT LOG
// ============================================================

export const auditLog = pgTable('audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid('user_id').references(() => employees.id),
  action: auditActionEnum('action').notNull(),
  entityType: varchar('entity_type', { length: 100 }).notNull(),
  entityId: varchar('entity_id', { length: 255 }),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// ============================================================
// SESSIONS (for auth)
// ============================================================

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// PHASE 3: PROJECT MANAGEMENT
// ============================================================

export const projectStatusEnum = pgEnum('project_status', ['planning', 'active', 'on_hold', 'completed', 'cancelled'])
export const taskStatusEnum = pgEnum('task_status', ['todo', 'in_progress', 'review', 'done'])
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high', 'critical'])

export const projects = pgTable('projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: projectStatusEnum('status').default('planning').notNull(),
  ownerId: uuid('owner_id').references(() => employees.id),
  startDate: date('start_date'),
  endDate: date('end_date'),
  budget: integer('budget'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const milestones = pgTable('milestones', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  dueDate: date('due_date'),
  status: taskStatusEnum('status').default('todo').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  milestoneId: uuid('milestone_id').references(() => milestones.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: taskStatusEnum('status').default('todo').notNull(),
  priority: taskPriorityEnum('priority').default('medium').notNull(),
  assigneeId: uuid('assignee_id').references(() => employees.id),
  dueDate: date('due_date'),
  estimatedHours: real('estimated_hours'),
  actualHours: real('actual_hours'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const taskDependencies = pgTable('task_dependencies', {
  id: uuid('id').defaultRandom().primaryKey(),
  taskId: uuid('task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
  dependsOnTaskId: uuid('depends_on_task_id').references(() => tasks.id, { onDelete: 'cascade' }).notNull(),
})

// ============================================================
// PHASE 3: STRATEGY EXECUTION
// ============================================================

export const objectiveStatusEnum = pgEnum('objective_status', ['draft', 'active', 'completed', 'archived'])
export const initiativeStatusEnum = pgEnum('initiative_status', ['proposed', 'approved', 'in_progress', 'completed', 'cancelled'])
export const kpiFrequencyEnum = pgEnum('kpi_frequency', ['daily', 'weekly', 'monthly', 'quarterly', 'annual'])

export const strategicObjectives = pgTable('strategic_objectives', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: objectiveStatusEnum('status').default('draft').notNull(),
  ownerId: uuid('owner_id').references(() => employees.id),
  period: varchar('period', { length: 50 }),
  progress: integer('progress').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const keyResults = pgTable('key_results', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  objectiveId: uuid('objective_id').references(() => strategicObjectives.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  targetValue: real('target_value').notNull(),
  currentValue: real('current_value').default(0).notNull(),
  unit: varchar('unit', { length: 50 }),
  ownerId: uuid('owner_id').references(() => employees.id),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const initiatives = pgTable('initiatives', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  objectiveId: uuid('objective_id').references(() => strategicObjectives.id),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: initiativeStatusEnum('status').default('proposed').notNull(),
  ownerId: uuid('owner_id').references(() => employees.id),
  startDate: date('start_date'),
  endDate: date('end_date'),
  progress: integer('progress').default(0).notNull(),
  budget: integer('budget'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const kpiDefinitions = pgTable('kpi_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  unit: varchar('unit', { length: 50 }),
  targetValue: real('target_value'),
  frequency: kpiFrequencyEnum('frequency').default('monthly').notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  ownerId: uuid('owner_id').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const kpiMeasurements = pgTable('kpi_measurements', {
  id: uuid('id').defaultRandom().primaryKey(),
  kpiId: uuid('kpi_id').references(() => kpiDefinitions.id, { onDelete: 'cascade' }).notNull(),
  value: real('value').notNull(),
  period: varchar('period', { length: 50 }).notNull(),
  recordedAt: timestamp('recorded_at').defaultNow().notNull(),
  notes: text('notes'),
})

// ============================================================
// PHASE 3: WORKFLOW STUDIO
// ============================================================

export const workflowStatusEnum = pgEnum('workflow_status', ['draft', 'active', 'paused', 'archived'])
export const stepTypeEnum = pgEnum('step_type', ['action', 'condition', 'delay', 'notification', 'approval'])
export const triggerTypeEnum = pgEnum('trigger_type', ['schedule', 'event', 'manual', 'webhook'])
export const runStatusEnum = pgEnum('run_status', ['running', 'completed', 'failed', 'cancelled'])

export const workflows = pgTable('workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: workflowStatusEnum('status').default('draft').notNull(),
  triggerType: triggerTypeEnum('trigger_type').default('manual').notNull(),
  triggerConfig: jsonb('trigger_config'),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
})

export const workflowSteps = pgTable('workflow_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').references(() => workflows.id, { onDelete: 'cascade' }).notNull(),
  stepType: stepTypeEnum('step_type').default('action').notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  config: jsonb('config'),
  position: integer('position').default(0).notNull(),
  nextStepId: uuid('next_step_id'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workflowRuns = pgTable('workflow_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  workflowId: uuid('workflow_id').references(() => workflows.id).notNull(),
  status: runStatusEnum('status').default('running').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  triggeredBy: varchar('triggered_by', { length: 100 }),
  context: jsonb('context'),
})

export const workflowTemplates = pgTable('workflow_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }),
  config: jsonb('config'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// NOTIFICATIONS
// ============================================================

export const notificationTypeEnum = pgEnum('notification_type', [
  'info', 'success', 'warning', 'action_required', 'mention', 'approval', 'reminder'
])

export const notificationChannelEnum = pgEnum('notification_channel', ['in_app', 'email', 'both'])

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  recipientId: uuid('recipient_id').references(() => employees.id).notNull(),
  senderId: uuid('sender_id').references(() => employees.id),
  type: notificationTypeEnum('type').notNull().default('info'),
  channel: notificationChannelEnum('channel').notNull().default('in_app'),
  title: varchar('title', { length: 255 }).notNull(),
  message: text('message').notNull(),
  link: varchar('link', { length: 500 }),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  isRead: boolean('is_read').notNull().default(false),
  readAt: timestamp('read_at'),
  emailSentAt: timestamp('email_sent_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const notificationPreferences = pgTable('notification_preferences', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  inApp: boolean('in_app').notNull().default(true),
  email: boolean('email').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

// ============================================================
// FILE UPLOADS
// ============================================================

export const fileUploads = pgTable('file_uploads', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  uploadedBy: uuid('uploaded_by').notNull().references(() => employees.id),
  filename: varchar('filename', { length: 255 }).notNull(),
  originalName: varchar('original_name', { length: 255 }).notNull(),
  mimeType: varchar('mime_type', { length: 100 }).notNull(),
  size: integer('size').notNull(),
  storageKey: varchar('storage_key', { length: 500 }).notNull(),
  storageProvider: varchar('storage_provider', { length: 50 }).notNull().default('local'),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  isPublic: boolean('is_public').notNull().default(false),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  deletedAt: timestamp('deleted_at'),
})

// ============================================================
// MFA & SSO
// ============================================================

export const mfaMethodEnum = pgEnum('mfa_method', ['totp', 'sms', 'email'])

export const mfaEnrollments = pgTable('mfa_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  employeeId: uuid('employee_id').notNull().references(() => employees.id),
  method: mfaMethodEnum('method').notNull().default('totp'),
  secret: varchar('secret', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  backupCodes: jsonb('backup_codes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  lastUsedAt: timestamp('last_used_at'),
})

export const ssoProviders = pgTable('sso_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  name: varchar('name', { length: 100 }).notNull(),
  provider: varchar('provider', { length: 50 }).notNull(),
  entityId: varchar('entity_id', { length: 500 }),
  ssoUrl: varchar('sso_url', { length: 500 }),
  certificate: text('certificate'),
  metadataUrl: varchar('metadata_url', { length: 500 }),
  clientId: varchar('client_id', { length: 255 }),
  clientSecret: varchar('client_secret', { length: 255 }),
  isActive: boolean('is_active').notNull().default(true),
  config: jsonb('config'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const ssoSessions = pgTable('sso_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  providerId: uuid('provider_id').notNull().references(() => ssoProviders.id),
  employeeId: uuid('employee_id').references(() => employees.id),
  state: varchar('state', { length: 255 }).notNull(),
  redirectUrl: varchar('redirect_url', { length: 500 }),
  expiresAt: timestamp('expires_at').notNull(),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================
// INTEGRATIONS
// ============================================================

export const integrationStatusEnum = pgEnum('integration_status', ['disconnected', 'connected', 'error', 'syncing'])
export const syncDirectionEnum = pgEnum('sync_direction', ['inbound', 'outbound', 'bidirectional'])

export const integrations = pgTable('integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  provider: varchar('provider', { length: 50 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  status: integrationStatusEnum('status').notNull().default('disconnected'),
  config: jsonb('config'),
  credentials: jsonb('credentials'),
  syncDirection: syncDirectionEnum('sync_direction').notNull().default('inbound'),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: varchar('last_sync_status', { length: 50 }),
  lastSyncDetails: text('last_sync_details'),
  syncFrequencyMinutes: integer('sync_frequency_minutes').default(60),
  mappings: jsonb('mappings'),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
})

export const integrationLogs = pgTable('integration_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  integrationId: uuid('integration_id').notNull().references(() => integrations.id),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  action: varchar('action', { length: 50 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(),
  recordsProcessed: integer('records_processed').default(0),
  recordsFailed: integer('records_failed').default(0),
  details: text('details'),
  errorMessage: text('error_message'),
  duration: integer('duration_ms'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

export const webhookEndpoints = pgTable('webhook_endpoints', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').notNull().references(() => organizations.id),
  integrationId: uuid('integration_id').references(() => integrations.id),
  url: varchar('url', { length: 500 }).notNull(),
  secret: varchar('secret', { length: 255 }).notNull(),
  events: jsonb('events').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  lastCalledAt: timestamp('last_called_at'),
  failureCount: integer('failure_count').default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
})

// ============================================================
// PLATFORM ADMINISTRATION
// ============================================================

export const platformAdminRoleEnum = pgEnum('platform_admin_role', ['super_admin', 'support', 'viewer'])

export const platformAdmins = pgTable('platform_admins', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  passwordHash: text('password_hash'),
  role: platformAdminRoleEnum('role').default('viewer').notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const adminSessions = pgTable('admin_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => platformAdmins.id, { onDelete: 'cascade' }).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const impersonationLog = pgTable('impersonation_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  adminId: uuid('admin_id').references(() => platformAdmins.id).notNull(),
  targetEmployeeId: text('target_employee_id').notNull(),
  targetOrgId: text('target_org_id').notNull(),
  reason: text('reason'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  endedAt: timestamp('ended_at'),
})

// Offboarding
export const offboardingChecklistCategoryEnum = pgEnum('offboarding_checklist_category', ['access_revocation', 'device_return', 'knowledge_transfer', 'exit_interview', 'final_pay', 'benefits', 'documents'])
export const offboardingProcessStatusEnum = pgEnum('offboarding_process_status', ['pending', 'in_progress', 'completed', 'cancelled'])
export const offboardingReasonEnum = pgEnum('offboarding_reason', ['resignation', 'termination', 'layoff', 'retirement', 'end_of_contract'])
export const offboardingTaskStatusEnum = pgEnum('offboarding_task_status', ['pending', 'in_progress', 'completed', 'skipped'])

// OFFBOARDING: Checklists, Processes, Tasks, Exit Surveys
// ============================================================

export const offboardingChecklists = pgTable('offboarding_checklists', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isDefault: boolean('is_default').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const offboardingChecklistItems = pgTable('offboarding_checklist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  checklistId: uuid('checklist_id').references(() => offboardingChecklists.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: offboardingChecklistCategoryEnum('category').notNull(),
  assigneeRole: varchar('assignee_role', { length: 100 }),
  orderIndex: integer('order_index').default(0).notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
})

export const offboardingProcesses = pgTable('offboarding_processes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  initiatedBy: uuid('initiated_by').references(() => employees.id),
  status: offboardingProcessStatusEnum('status').default('pending').notNull(),
  checklistId: uuid('checklist_id').references(() => offboardingChecklists.id),
  lastWorkingDate: date('last_working_date'),
  reason: offboardingReasonEnum('reason').notNull(),
  notes: text('notes'),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const offboardingTasks = pgTable('offboarding_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  processId: uuid('process_id').references(() => offboardingProcesses.id, { onDelete: 'cascade' }).notNull(),
  checklistItemId: uuid('checklist_item_id').references(() => offboardingChecklistItems.id),
  assigneeId: uuid('assignee_id').references(() => employees.id),
  status: offboardingTaskStatusEnum('status').default('pending').notNull(),
  completedAt: timestamp('completed_at'),
  completedBy: uuid('completed_by').references(() => employees.id),
  notes: text('notes'),
})

export const exitSurveys = pgTable('exit_surveys', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  processId: uuid('process_id').references(() => offboardingProcesses.id),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  responses: jsonb('responses'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  isAnonymous: boolean('is_anonymous').default(false).notNull(),
})

// ============================================================

export const openEnrollmentStatusEnum = pgEnum('open_enrollment_status', ['upcoming', 'active', 'closed'])
export const cobraQualifyingEventEnum = pgEnum('cobra_qualifying_event', ['termination', 'hours_reduction', 'divorce', 'dependent_aging_out', 'death'])
export const cobraStatusEnum = pgEnum('cobra_status', ['pending_notification', 'notified', 'elected', 'declined', 'expired'])
export const form1095StatusEnum = pgEnum('form_1095_status', ['pending', 'generated', 'filed', 'corrected'])
export const flexAccountTypeEnum = pgEnum('flex_account_type', ['hsa', 'fsa_health', 'fsa_dependent', 'commuter_transit', 'commuter_parking'])
export const flexAccountStatusEnum = pgEnum('flex_account_status', ['active', 'inactive', 'closed'])
export const flexTransactionTypeEnum = pgEnum('flex_transaction_type', ['contribution', 'expense', 'reimbursement', 'rollover'])
export const flexTransactionStatusEnum = pgEnum('flex_transaction_status', ['pending', 'approved', 'denied'])

// OPEN ENROLLMENT
export const openEnrollmentPeriods = pgTable('open_enrollment_periods', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  effectiveDate: date('effective_date').notNull(),
  status: openEnrollmentStatusEnum('status').default('upcoming').notNull(),
  planIds: jsonb('plan_ids'),
  remindersSent: integer('reminders_sent').default(0).notNull(),
})

// COBRA ADMINISTRATION
export const cobraEvents = pgTable('cobra_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  qualifyingEvent: cobraQualifyingEventEnum('qualifying_event').notNull(),
  eventDate: date('event_date').notNull(),
  electionDeadline: date('election_deadline').notNull(),
  status: cobraStatusEnum('status').default('pending_notification').notNull(),
  coveragePlans: jsonb('coverage_plans'),
  premiumAmount: integer('premium_amount'),
  subsidyPercent: integer('subsidy_percent').default(0),
  coverageStartDate: date('coverage_start_date'),
  coverageEndDate: date('coverage_end_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ACA COMPLIANCE
export const acaTracking = pgTable('aca_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  measurementPeriod: varchar('measurement_period', { length: 100 }),
  avgWeeklyHours: real('avg_weekly_hours'),
  isFTE: boolean('is_fte').default(false).notNull(),
  isEligible: boolean('is_eligible').default(false).notNull(),
  offeredCoverage: boolean('offered_coverage').default(false).notNull(),
  enrolledCoverage: boolean('enrolled_coverage').default(false).notNull(),
  form1095Status: form1095StatusEnum('form_1095_status').default('pending').notNull(),
  taxYear: integer('tax_year').notNull(),
})

// FLEX BENEFIT ACCOUNTS (HSA/FSA/COMMUTER)
export const flexBenefitAccounts = pgTable('flex_benefit_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  type: flexAccountTypeEnum('type').notNull(),
  planYear: varchar('plan_year', { length: 10 }).notNull(),
  employeeContribution: integer('employee_contribution').default(0).notNull(),
  employerContribution: integer('employer_contribution').default(0).notNull(),
  currentBalance: integer('current_balance').default(0).notNull(),
  ytdExpenses: integer('ytd_expenses').default(0).notNull(),
  maxContribution: integer('max_contribution').notNull(),
  rolloverAmount: integer('rollover_amount').default(0),
  status: flexAccountStatusEnum('status').default('active').notNull(),
})

export const flexBenefitTransactions = pgTable('flex_benefit_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  accountId: uuid('account_id').references(() => flexBenefitAccounts.id, { onDelete: 'cascade' }).notNull(),
  type: flexTransactionTypeEnum('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  date: date('date').notNull(),
  receiptUrl: text('receipt_url'),
  status: flexTransactionStatusEnum('status').default('pending').notNull(),
  category: varchar('category', { length: 100 }),
})
// EXPENSE
// ============================================================



// ============================================================


// ============================================================
// TIME & ATTENDANCE
// ============================================================

export const timeEntryStatusEnum = pgEnum('time_entry_status', ['pending', 'approved', 'rejected'])
export const timeOffTypeEnum = pgEnum('time_off_type', ['annual', 'sick', 'personal', 'maternity', 'paternity', 'bereavement', 'jury_duty', 'military'])
export const accrualPeriodEnum = pgEnum('accrual_period', ['monthly', 'quarterly', 'annually'])
export const shiftStatusEnum = pgEnum('shift_status', ['scheduled', 'completed', 'no_show', 'swapped'])

export const timeEntries = pgTable('time_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  date: date('date').notNull(),
  clockIn: timestamp('clock_in').notNull(),
  clockOut: timestamp('clock_out'),
  breakMinutes: integer('break_minutes').default(0).notNull(),
  totalHours: real('total_hours'),
  overtimeHours: real('overtime_hours').default(0),
  status: timeEntryStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  location: text('location'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const timeOffPolicies = pgTable('time_off_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: timeOffTypeEnum('type').notNull(),
  accrualRate: real('accrual_rate').notNull(),
  accrualPeriod: accrualPeriodEnum('accrual_period').default('monthly').notNull(),
  maxBalance: real('max_balance').notNull(),
  carryoverLimit: real('carryover_limit').default(0).notNull(),
  waitingPeriodDays: integer('waiting_period_days').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const timeOffBalances = pgTable('time_off_balances', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  policyId: uuid('policy_id').references(() => timeOffPolicies.id).notNull(),
  balance: real('balance').default(0).notNull(),
  used: real('used').default(0).notNull(),
  pending: real('pending').default(0).notNull(),
  carryover: real('carryover').default(0).notNull(),
  asOfDate: date('as_of_date').notNull(),
})

export const overtimeRules = pgTable('overtime_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  dailyThresholdHours: real('daily_threshold_hours').default(8).notNull(),
  weeklyThresholdHours: real('weekly_threshold_hours').default(40).notNull(),
  multiplier: real('multiplier').default(1.5).notNull(),
  doubleOvertimeThreshold: real('double_overtime_threshold'),
  doubleOvertimeMultiplier: real('double_overtime_multiplier'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const shifts = pgTable('shifts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  date: date('date').notNull(),
  startTime: varchar('start_time', { length: 10 }).notNull(),
  endTime: varchar('end_time', { length: 10 }).notNull(),
  breakDuration: integer('break_duration').default(0).notNull(),
  role: varchar('role', { length: 255 }),
  location: varchar('location', { length: 255 }),
  status: shiftStatusEnum('status').default('scheduled').notNull(),
  swappedWith: uuid('swapped_with').references(() => employees.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// CUSTOM FIELDS
// ============================================================

export const customFieldTypeEnum = pgEnum('custom_field_type', ['text', 'number', 'date', 'boolean', 'select', 'multi_select', 'url', 'email', 'phone'])
export const customFieldEntityEnum = pgEnum('custom_field_entity', ['employee', 'department', 'job_posting', 'application'])

export const customFieldDefinitions = pgTable('custom_field_definitions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fieldType: customFieldTypeEnum('field_type').notNull(),
  entityType: customFieldEntityEnum('entity_type').notNull(),
  description: text('description'),
  options: jsonb('options'), // for select/multi_select types: string[]
  isRequired: boolean('is_required').default(false).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  groupName: varchar('group_name', { length: 255 }),
  orderIndex: integer('order_index').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const customFieldValues = pgTable('custom_field_values', {
  id: uuid('id').defaultRandom().primaryKey(),
  fieldDefinitionId: uuid('field_definition_id').references(() => customFieldDefinitions.id, { onDelete: 'cascade' }).notNull(),
  entityId: uuid('entity_id').notNull(), // employee ID, department ID, etc.
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  value: text('value'), // stored as text, parsed by field type
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

})

// ============================================================
// EMERGENCY CONTACTS
// ============================================================

export const emergencyContactRelationshipEnum = pgEnum('emergency_contact_relationship', ['spouse', 'parent', 'sibling', 'child', 'friend', 'other'])

export const emergencyContacts = pgTable('emergency_contacts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  relationship: emergencyContactRelationshipEnum('relationship').notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }),
  address: text('address'),
  isPrimary: boolean('is_primary').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// COMPLIANCE MANAGEMENT
// ============================================================

export const complianceCategoryEnum = pgEnum('compliance_category', ['labor_law', 'data_privacy', 'safety', 'financial', 'immigration', 'licensing'])
export const complianceFrequencyEnum = pgEnum('compliance_frequency', ['one_time', 'monthly', 'quarterly', 'annually'])
export const complianceStatusEnum = pgEnum('compliance_status', ['compliant', 'at_risk', 'non_compliant', 'not_applicable'])
export const complianceDocStatusEnum = pgEnum('compliance_doc_status', ['valid', 'expired', 'pending_review'])
export const complianceAlertTypeEnum = pgEnum('compliance_alert_type', ['upcoming_deadline', 'expiring_document', 'violation', 'reminder'])
export const complianceAlertSeverityEnum = pgEnum('compliance_alert_severity', ['critical', 'high', 'medium', 'low'])

export const complianceRequirements = pgTable('compliance_requirements', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  category: complianceCategoryEnum('category').notNull(),
  country: varchar('country', { length: 100 }),
  description: text('description'),
  frequency: complianceFrequencyEnum('frequency').notNull(),
  dueDate: date('due_date'),
  status: complianceStatusEnum('status').default('compliant').notNull(),
  assignedTo: uuid('assigned_to').references(() => employees.id),
  evidence: text('evidence'),
  lastChecked: date('last_checked'),
  nextDue: date('next_due'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const complianceDocuments = pgTable('compliance_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  requirementId: uuid('requirement_id').references(() => complianceRequirements.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  fileUrl: text('file_url'),
  uploadedBy: uuid('uploaded_by').references(() => employees.id),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  expiresAt: date('expires_at'),
  status: complianceDocStatusEnum('status').default('valid').notNull(),
})

export const complianceAlerts = pgTable('compliance_alerts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  requirementId: uuid('requirement_id').references(() => complianceRequirements.id, { onDelete: 'cascade' }),
  type: complianceAlertTypeEnum('type').notNull(),
  severity: complianceAlertSeverityEnum('severity').notNull(),
  message: text('message').notNull(),
  isRead: boolean('is_read').default(false).notNull(),
  dueDate: date('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})


// ============================================================
// PERFORMANCE: PIPs, Merit Cycles, Review Templates
// ============================================================

export const pipStatusEnum = pgEnum('pip_status', ['draft', 'active', 'extended', 'completed_success', 'completed_failure', 'cancelled'])
export const pipCheckInFrequencyEnum = pgEnum('pip_checkin_frequency', ['weekly', 'biweekly', 'monthly'])
export const pipProgressEnum = pgEnum('pip_progress', ['on_track', 'behind', 'at_risk', 'improved'])
export const meritCycleTypeEnum = pgEnum('merit_cycle_type', ['annual_merit', 'promotion', 'market_adjustment', 'bonus'])
export const meritCycleStatusEnum = pgEnum('merit_cycle_status', ['planning', 'budgeting', 'manager_allocation', 'review', 'approved', 'completed'])
export const meritRecommendationStatusEnum = pgEnum('merit_recommendation_status', ['pending', 'manager_approved', 'hr_approved', 'final_approved', 'rejected'])
export const reviewTemplateTypeEnum = pgEnum('review_template_type', ['annual', 'mid_year', 'quarterly', 'probation', '360', 'self', 'manager', 'peer'])

export const performanceImprovementPlans = pgTable('performance_improvement_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  reason: text('reason').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  status: pipStatusEnum('status').default('draft').notNull(),
  objectives: jsonb('objectives'), // Array<{ title, description, targetDate, status, measure }>
  supportProvided: text('support_provided'),
  checkInFrequency: pipCheckInFrequencyEnum('checkin_frequency').default('weekly').notNull(),
  nextCheckIn: date('next_checkin'),
  outcome: text('outcome'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const pipCheckIns = pgTable('pip_check_ins', {
  id: uuid('id').defaultRandom().primaryKey(),
  pipId: uuid('pip_id').references(() => performanceImprovementPlans.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  conductedBy: uuid('conducted_by').references(() => employees.id).notNull(),
  progress: pipProgressEnum('progress').notNull(),
  notes: text('notes'),
  objectivesStatus: jsonb('objectives_status'), // snapshot of objective statuses
  nextSteps: text('next_steps'),
})

export const meritCycles = pgTable('merit_cycles', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: meritCycleTypeEnum('type').notNull(),
  status: meritCycleStatusEnum('status').default('planning').notNull(),
  fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
  totalBudget: integer('total_budget').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  guidelinesConfig: jsonb('guidelines_config'), // rating-to-raise mapping
  startDate: date('start_date'),
  endDate: date('end_date'),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const meritRecommendations = pgTable('merit_recommendations', {
  id: uuid('id').defaultRandom().primaryKey(),
  cycleId: uuid('cycle_id').references(() => meritCycles.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  managerId: uuid('manager_id').references(() => employees.id),
  currentSalary: integer('current_salary').notNull(),
  proposedSalary: integer('proposed_salary').notNull(),
  increasePercent: real('increase_percent').notNull(),
  increaseAmount: integer('increase_amount').notNull(),
  rating: integer('rating'),
  justification: text('justification'),
  status: meritRecommendationStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
})

export const reviewTemplates = pgTable('review_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: reviewTemplateTypeEnum('type').notNull(),
  sections: jsonb('sections'), // Array<{ title, description, questions: [{ text, type, required, options?, scale? }] }>
  isDefault: boolean('is_default').default(false).notNull(),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// IT Cloud / MDM enums
export const managedDeviceStatusEnum = pgEnum('managed_device_status', ['active', 'inactive', 'lost', 'retired', 'pending_setup'])
export const managedDevicePlatformEnum = pgEnum('managed_device_platform', ['macos', 'windows', 'ios', 'android', 'linux'])
export const deviceActionTypeEnum = pgEnum('device_action_type', ['lock', 'wipe', 'restart', 'update_os', 'install_app', 'remove_app', 'push_config'])
export const deviceActionStatusEnum = pgEnum('device_action_status', ['pending', 'in_progress', 'completed', 'failed'])
export const appCategoryEnum = pgEnum('app_category', ['productivity', 'communication', 'security', 'development', 'design', 'finance', 'hr', 'custom'])
export const appLicenseTypeEnum = pgEnum('app_license_type', ['free', 'per_seat', 'enterprise', 'site'])
export const appAssignmentStatusEnum = pgEnum('app_assignment_status', ['assigned', 'installed', 'pending', 'failed', 'removed'])
export const securityPolicyTypeEnum = pgEnum('security_policy_type', ['password', 'encryption', 'firewall', 'screensaver', 'os_update', 'app_restriction'])
export const policyAppliesToEnum = pgEnum('policy_applies_to', ['all', 'department', 'role', 'level'])
export const inventoryStatusEnum = pgEnum('inventory_status', ['in_warehouse', 'assigned', 'in_transit', 'retired', 'lost'])
export const inventoryConditionEnum = pgEnum('inventory_condition', ['new', 'good', 'fair', 'poor'])

// IT CLOUD: Managed Devices, Actions, App Catalog, Security Policies, Inventory
// ============================================================

export const managedDevices = pgTable('managed_devices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // laptop|desktop|tablet|phone
  platform: managedDevicePlatformEnum('platform').notNull(),
  manufacturer: varchar('manufacturer', { length: 100 }),
  model: varchar('model', { length: 255 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  osVersion: varchar('os_version', { length: 100 }),
  lastSeen: timestamp('last_seen'),
  status: managedDeviceStatusEnum('status').default('active').notNull(),
  isEncrypted: boolean('is_encrypted').default(false).notNull(),
  isCompliant: boolean('is_compliant').default(true).notNull(),
  storageCapacityGb: integer('storage_capacity_gb'),
  enrolledAt: timestamp('enrolled_at').defaultNow().notNull(),
  mdmProfileInstalled: boolean('mdm_profile_installed').default(false).notNull(),
})

export const deviceActions = pgTable('device_actions', {
  id: uuid('id').defaultRandom().primaryKey(),
  deviceId: uuid('device_id').references(() => managedDevices.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  actionType: deviceActionTypeEnum('action_type').notNull(),
  status: deviceActionStatusEnum('status').default('pending').notNull(),
  initiatedBy: uuid('initiated_by').references(() => employees.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
})

export const appCatalog = pgTable('app_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  vendor: varchar('vendor', { length: 255 }),
  category: appCategoryEnum('category').notNull(),
  icon: varchar('icon', { length: 100 }),
  platform: varchar('platform', { length: 100 }),
  version: varchar('version', { length: 50 }),
  licenseType: appLicenseTypeEnum('license_type').default('free').notNull(),
  licenseCost: real('license_cost').default(0),
  licenseCount: integer('license_count').default(0),
  assignedCount: integer('assigned_count').default(0),
  isRequired: boolean('is_required').default(false).notNull(),
  autoInstall: boolean('auto_install').default(false).notNull(),
})

export const appAssignments = pgTable('app_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => appCatalog.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  status: appAssignmentStatusEnum('status').default('assigned').notNull(),
  assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  installedAt: timestamp('installed_at'),
})

export const securityPolicies = pgTable('security_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: securityPolicyTypeEnum('type').notNull(),
  settings: jsonb('settings'),
  isActive: boolean('is_active').default(true).notNull(),
  appliesTo: policyAppliesToEnum('applies_to').default('all').notNull(),
  targetValue: varchar('target_value', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const deviceInventory = pgTable('device_inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  platform: varchar('platform', { length: 50 }),
  serialNumber: varchar('serial_number', { length: 255 }),
  status: inventoryStatusEnum('status').default('in_warehouse').notNull(),
  condition: inventoryConditionEnum('condition').default('new').notNull(),
  purchaseDate: date('purchase_date'),
  purchaseCost: real('purchase_cost'),
  warrantyExpiry: date('warranty_expiry'),
  assignedTo: uuid('assigned_to').references(() => employees.id),
  warehouseLocation: varchar('warehouse_location', { length: 255 }),
  notes: text('notes'),
})

// ============================================================

// ============================================================
// EXPENSE: Receipt Matching, Mileage, Policies, Reimbursement, Duplicates
// ============================================================

export const receiptMatchStatusEnum = pgEnum('receipt_match_status', ['matched', 'mismatch_amount', 'mismatch_vendor', 'mismatch_date', 'no_receipt', 'pending'])
export const mileageVehicleTypeEnum = pgEnum('mileage_vehicle_type', ['personal', 'company'])
export const mileageTripTypeEnum = pgEnum('mileage_trip_type', ['round_trip', 'one_way'])
export const mileageStatusEnum = pgEnum('mileage_status', ['pending', 'approved', 'rejected'])
export const policyRuleActionEnum = pgEnum('policy_rule_action', ['block', 'warn', 'require_approval'])
export const reimbursementBatchStatusEnum = pgEnum('reimbursement_batch_status', ['pending', 'processing', 'completed', 'failed'])
export const reimbursementMethodEnum = pgEnum('reimbursement_method', ['payroll', 'direct_deposit', 'manual'])
export const reimbursementItemStatusEnum = pgEnum('reimbursement_item_status', ['pending', 'processed', 'failed'])
export const duplicateStatusEnum = pgEnum('duplicate_status', ['flagged', 'confirmed_duplicate', 'dismissed'])

export const receiptMatching = pgTable('receipt_matching', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  expenseItemId: uuid('expense_item_id').references(() => expenseItems.id),
  receiptUrl: text('receipt_url'),
  extractedAmount: real('extracted_amount'),
  extractedCurrency: varchar('extracted_currency', { length: 10 }),
  extractedVendor: varchar('extracted_vendor', { length: 255 }),
  extractedDate: date('extracted_date'),
  matchStatus: receiptMatchStatusEnum('match_status').default('pending').notNull(),
  confidence: real('confidence'),
  discrepancyNotes: text('discrepancy_notes'),
})

export const mileageEntries = pgTable('mileage_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  date: date('date').notNull(),
  startLocation: varchar('start_location', { length: 255 }).notNull(),
  endLocation: varchar('end_location', { length: 255 }).notNull(),
  distanceMiles: real('distance_miles').notNull(),
  rate: real('rate').notNull(),
  amount: real('amount').notNull(),
  purpose: text('purpose'),
  vehicleType: mileageVehicleTypeEnum('vehicle_type').default('personal').notNull(),
  tripType: mileageTripTypeEnum('trip_type').default('one_way').notNull(),
  status: mileageStatusEnum('status').default('pending').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
export const advancedExpensePolicies = pgTable('advanced_expense_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  rules: jsonb('rules'), // Array of {field, operator, value, action}
  appliesTo: policyAppliesToEnum('applies_to').default('all').notNull(),
  targetValues: jsonb('target_values'), // department IDs, role names, etc.
})

export const reimbursementBatches = pgTable('reimbursement_batches', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  status: reimbursementBatchStatusEnum('status').default('pending').notNull(),
  method: reimbursementMethodEnum('method').default('payroll').notNull(),
  totalAmount: real('total_amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  employeeCount: integer('employee_count').notNull(),
  processedAt: timestamp('processed_at'),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const reimbursementItems = pgTable('reimbursement_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  batchId: uuid('batch_id').references(() => reimbursementBatches.id, { onDelete: 'cascade' }).notNull(),
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  amount: real('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: reimbursementItemStatusEnum('status').default('pending').notNull(),
  notes: text('notes'),
})

export const duplicateDetection = pgTable('duplicate_detection', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  expenseItemId: uuid('expense_item_id').references(() => expenseItems.id),
  duplicateOfId: uuid('duplicate_of_id').references(() => expenseItems.id),
  similarity: real('similarity'),
  fields: jsonb('fields'), // which fields match
  status: duplicateStatusEnum('status').default('flagged').notNull(),
  reviewedBy: uuid('reviewed_by').references(() => employees.id),

})

export const headcountPlanStatusEnum = pgEnum('headcount_plan_status', ['draft', 'active', 'approved', 'closed'])
export const headcountPositionTypeEnum = pgEnum('headcount_position_type', ['new', 'backfill', 'conversion'])
export const headcountPositionStatusEnum = pgEnum('headcount_position_status', ['planned', 'approved', 'open', 'filled', 'cancelled'])
export const headcountPriorityEnum = pgEnum('headcount_priority', ['critical', 'high', 'medium', 'low'])
export const headcountBudgetCategoryEnum = pgEnum('headcount_budget_category', ['base_salary', 'benefits', 'equity', 'signing_bonus', 'relocation', 'equipment'])

// ============================================================
// HEADCOUNT PLANNING
// ============================================================

export const headcountPlans = pgTable('headcount_plans', {
  id: text('id').primaryKey(),
  orgId: text('org_id').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  fiscalYear: varchar('fiscal_year', { length: 10 }).notNull(),
  status: headcountPlanStatusEnum('status').default('draft').notNull(),
  totalBudget: real('total_budget').notNull().default(0),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  createdBy: text('created_by'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const headcountPositions = pgTable('headcount_positions', {
  id: text('id').primaryKey(),
  planId: text('plan_id').notNull(),
  orgId: text('org_id').notNull(),
  departmentId: text('department_id').notNull(),
  jobTitle: varchar('job_title', { length: 255 }).notNull(),
  level: varchar('level', { length: 50 }),
  type: headcountPositionTypeEnum('type').default('new').notNull(),
  status: headcountPositionStatusEnum('status').default('planned').notNull(),
  priority: headcountPriorityEnum('priority').default('medium').notNull(),
  salaryMin: real('salary_min').default(0),
  salaryMax: real('salary_max').default(0),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  targetStartDate: date('target_start_date'),
  filledBy: text('filled_by'),
  filledAt: timestamp('filled_at'),
  justification: text('justification'),
  approvedBy: text('approved_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

})

export const headcountBudgetItems = pgTable('headcount_budget_items', {
  id: text('id').primaryKey(),
  positionId: text('position_id').notNull(),
  category: headcountBudgetCategoryEnum('category').notNull(),
  amount: real('amount').notNull().default(0),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  notes: text('notes'),
})

// ============================================================
// WORKFLOW AUTOMATION ENGINE
// ============================================================

export const workflowTriggerEnum = pgEnum('workflow_trigger', [
  'employee_hired', 'employee_terminated', 'role_changed', 'department_changed',
  'review_completed', 'leave_approved', 'expense_submitted', 'payroll_completed', 'custom',
])

export const workflowStepTypeEnum = pgEnum('workflow_step_type', ['action', 'condition', 'delay', 'approval'])

export const workflowActionTypeEnum = pgEnum('workflow_action_type', [
  'send_email', 'send_slack', 'create_task', 'assign_app', 'revoke_app',
  'assign_device', 'update_field', 'notify_manager', 'add_to_group',
  'schedule_meeting', 'create_review', 'enroll_course',
])

export const workflowRunStatusEnum = pgEnum('workflow_run_status', ['running', 'completed', 'failed', 'cancelled'])

export const workflowRunStepStatusEnum = pgEnum('workflow_run_step_status', ['pending', 'running', 'completed', 'failed', 'skipped'])

export const automationWorkflows = pgTable('automation_workflows', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  trigger: workflowTriggerEnum('trigger').notNull(),
  triggerConfig: jsonb('trigger_config'),
  isActive: boolean('is_active').default(false).notNull(),
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),

})

export const automationWorkflowSteps = pgTable('automation_workflow_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').references(() => automationWorkflows.id, { onDelete: 'cascade' }).notNull(),
  orderIndex: integer('order_index').notNull(),
  type: workflowStepTypeEnum('type').notNull(),
  config: jsonb('config'),
  nextStepOnTrue: uuid('next_step_on_true'),
  nextStepOnFalse: uuid('next_step_on_false'),
})

export const automationWorkflowRuns = pgTable('automation_workflow_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workflowId: uuid('workflow_id').references(() => automationWorkflows.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  triggeredBy: varchar('triggered_by', { length: 255 }),
  triggerData: jsonb('trigger_data'),
  status: workflowRunStatusEnum('status').default('running').notNull(),
  startedAt: timestamp('started_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  error: text('error'),
})

export const automationWorkflowRunSteps = pgTable('automation_workflow_run_steps', {
  id: uuid('id').defaultRandom().primaryKey(),
  runId: uuid('run_id').references(() => automationWorkflowRuns.id, { onDelete: 'cascade' }).notNull(),
  stepId: uuid('step_id').references(() => automationWorkflowSteps.id).notNull(),
  status: workflowRunStepStatusEnum('status').default('pending').notNull(),
  input: jsonb('input'),
  output: jsonb('output'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
})

// ============================================================
// RECRUITING ENHANCEMENTS: Background Checks, Referrals, Knockout Questions, Self-Scheduling
// ============================================================

export const bgCheckTypeEnum = pgEnum('bg_check_type', ['criminal', 'employment', 'education', 'credit', 'reference', 'identity'])
export const bgCheckProviderEnum = pgEnum('bg_check_provider', ['checkr', 'goodhire', 'internal'])
export const bgCheckStatusEnum = pgEnum('bg_check_status', ['pending', 'in_progress', 'completed', 'failed', 'flagged'])
export const bgCheckResultEnum = pgEnum('bg_check_result', ['clear', 'review_needed', 'adverse'])

export const backgroundChecks = pgTable('background_checks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id),
  candidateName: varchar('candidate_name', { length: 255 }).notNull(),
  candidateEmail: varchar('candidate_email', { length: 255 }).notNull(),
  type: bgCheckTypeEnum('type').notNull(),
  provider: bgCheckProviderEnum('provider').notNull(),
  status: bgCheckStatusEnum('status').default('pending').notNull(),
  result: bgCheckResultEnum('result'),
  reportUrl: text('report_url'),
  requestedBy: uuid('requested_by').references(() => employees.id),
  requestedAt: timestamp('requested_at').defaultNow().notNull(),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),

})

export const referralBonusTriggerEnum = pgEnum('referral_bonus_trigger', ['hire', '90_day_retention', '180_day_retention'])

export const referralPrograms = pgTable('referral_programs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  bonusAmount: integer('bonus_amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  bonusTrigger: referralBonusTriggerEnum('bonus_trigger').notNull(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const referralStatusEnum = pgEnum('referral_status', ['submitted', 'reviewing', 'interviewing', 'hired', 'rejected', 'bonus_pending', 'bonus_paid'])

export const referrals = pgTable('referrals', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  referrerId: uuid('referrer_id').references(() => employees.id).notNull(),
  candidateName: varchar('candidate_name', { length: 255 }).notNull(),
  candidateEmail: varchar('candidate_email', { length: 255 }).notNull(),
  jobId: uuid('job_id').references(() => jobPostings.id),
  status: referralStatusEnum('status').default('submitted').notNull(),
  bonusAmount: integer('bonus_amount'),
  bonusPaidAt: timestamp('bonus_paid_at'),
  submittedAt: timestamp('submitted_at').defaultNow().notNull(),
  notes: text('notes'),
})

export const knockoutQuestionTypeEnum = pgEnum('knockout_question_type', ['yes_no', 'multiple_choice', 'numeric'])

export const knockoutQuestions = pgTable('knockout_questions', {
  id: uuid('id').defaultRandom().primaryKey(),
  jobId: uuid('job_id').references(() => jobPostings.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  question: text('question').notNull(),
  type: knockoutQuestionTypeEnum('type').notNull(),
  options: jsonb('options'), // string[] for multiple choice
  correctAnswer: text('correct_answer').notNull(),
  isRequired: boolean('is_required').default(true).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  eliminateOnWrong: boolean('eliminate_on_wrong').default(true).notNull(),
})

export const candidateSchedulingStatusEnum = pgEnum('candidate_scheduling_status', ['slots_offered', 'candidate_selected', 'confirmed', 'cancelled'])

export const candidateScheduling = pgTable('candidate_scheduling', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id),
  interviewType: varchar('interview_type', { length: 100 }).notNull(),
  availableSlots: jsonb('available_slots').notNull(), // Array<{ date: string, startTime: string, endTime: string }>
  selectedSlot: jsonb('selected_slot'), // { date: string, startTime: string, endTime: string } | null
  interviewerIds: jsonb('interviewer_ids').notNull(), // string[]
  meetingUrl: text('meeting_url'),
  status: candidateSchedulingStatusEnum('status').default('slots_offered').notNull(),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const coursePrerequisites = pgTable('course_prerequisites', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  prerequisiteCourseId: uuid('prerequisite_course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 20 }).default('required').notNull(), // required | recommended
  minimumScore: integer('minimum_score'),
})

export const scormPackages = pgTable('scorm_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  packageUrl: text('package_url').notNull(),
  version: varchar('version', { length: 20 }).default('scorm_2004').notNull(), // scorm_1_2 | scorm_2004 | xapi
  entryPoint: varchar('entry_point', { length: 500 }),
  metadata: jsonb('metadata'), // { title, description, duration, mastery_score }
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
  status: varchar('status', { length: 20 }).default('processing').notNull(), // processing | ready | error
})

export const scormTracking = pgTable('scorm_tracking', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  packageId: uuid('package_id').references(() => scormPackages.id, { onDelete: 'cascade' }).notNull(),
  enrollmentId: uuid('enrollment_id').references(() => enrollments.id, { onDelete: 'cascade' }).notNull(),
  lessonStatus: varchar('lesson_status', { length: 20 }).default('not_attempted').notNull(), // not_attempted | incomplete | completed | passed | failed
  scoreRaw: real('score_raw'),
  scoreMin: real('score_min'),
  scoreMax: real('score_max'),
  totalTime: varchar('total_time', { length: 50 }),
  suspendData: text('suspend_data'),
  lastAccessed: timestamp('last_accessed').defaultNow().notNull(),
})

export const contentLibrary = pgTable('content_library', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  provider: varchar('provider', { length: 50 }).default('internal').notNull(), // internal | go1 | linkedin_learning | udemy_business | coursera | custom
  externalId: varchar('external_id', { length: 255 }),
  category: varchar('category', { length: 100 }),
  level: varchar('level', { length: 20 }),
  durationMinutes: integer('duration_minutes'),
  format: varchar('format', { length: 50 }),
  thumbnailUrl: text('thumbnail_url'),
  contentUrl: text('content_url'),
  rating: real('rating'),
  enrollmentCount: integer('enrollment_count').default(0),
  isFeatured: boolean('is_featured').default(false).notNull(),
  tags: jsonb('tags'), // string[]
  language: varchar('language', { length: 50 }).default('English'),
  addedAt: timestamp('added_at').defaultNow().notNull(),
})

export const learnerBadges = pgTable('learner_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  badgeType: varchar('badge_type', { length: 50 }).notNull(),
  badgeName: varchar('badge_name', { length: 255 }).notNull(),
  badgeIcon: varchar('badge_icon', { length: 50 }),
  description: text('description'),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
  courseId: uuid('course_id').references(() => courses.id),
  metadata: jsonb('metadata'),
})

export const learnerPoints = pgTable('learner_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  points: integer('points').notNull(),
  source: varchar('source', { length: 50 }).notNull(), // course_complete | quiz_score | streak_bonus | discussion_post | peer_help
  description: text('description'),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),

})

export const surveyTemplateTypeEnum = pgEnum('survey_template_type', ['pulse', 'enps', 'onboarding', 'exit', 'custom', 'annual', 'dei'])
export const surveyQuestionTypeEnum = pgEnum('survey_question_type', ['rating', 'text', 'multiple_choice', 'nps', 'matrix'])
export const surveyFrequencyEnum = pgEnum('survey_frequency', ['weekly', 'biweekly', 'monthly', 'quarterly', 'annually'])
export const surveyTriggerEventEnum = pgEnum('survey_trigger_event', ['employee_hired', 'employee_terminated', 'review_completed', 'anniversary', 'promotion', 'transfer', 'return_from_leave'])
export const branchingActionEnum = pgEnum('branching_action', ['skip_to', 'hide', 'show', 'end_survey'])
export const sentimentEnum = pgEnum('sentiment', ['positive', 'neutral', 'negative'])
// ENGAGEMENT: Surveys, Scores


export const surveyTemplates = pgTable('survey_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  type: surveyTemplateTypeEnum('type').notNull(),
  questions: jsonb('questions').notNull(), // Array of {id, text, type, required, options?, branchLogic?}
  isDefault: boolean('is_default').default(false).notNull(),
  usageCount: integer('usage_count').default(0).notNull(),
})

export const surveySchedules = pgTable('survey_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }),
  frequency: surveyFrequencyEnum('frequency').notNull(),
  startDate: date('start_date').notNull(),
  nextRunDate: date('next_run_date'),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  targetAudience: jsonb('target_audience'), // {department?, role?, country?}
  lastRunAt: timestamp('last_run_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const surveyTriggers = pgTable('survey_triggers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  templateId: uuid('template_id').references(() => surveyTemplates.id, { onDelete: 'cascade' }),
  triggerEvent: surveyTriggerEventEnum('trigger_event').notNull(),
  delayDays: integer('delay_days').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  targetAudience: jsonb('target_audience'), // {department?, role?, country?}
})

export const surveyQuestionBranching = pgTable('survey_question_branching', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  questionId: varchar('question_id', { length: 100 }).notNull(),
  surveyId: uuid('survey_id').references(() => surveys.id, { onDelete: 'cascade' }),
  condition: jsonb('condition').notNull(), // {field, operator, value}
  action: branchingActionEnum('action').notNull(),
  targetQuestionId: varchar('target_question_id', { length: 100 }),
})

export const openEndedResponses = pgTable('open_ended_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  surveyResponseId: varchar('survey_response_id', { length: 100 }),
  questionId: varchar('question_id', { length: 100 }),
  text: text('text').notNull(),
  sentiment: sentimentEnum('sentiment'),
  analyzedAt: timestamp('analyzed_at'),

})