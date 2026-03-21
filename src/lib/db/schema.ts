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
export const payrollStatusEnum = pgEnum('payroll_status', ['draft', 'pending_hr', 'pending_finance', 'approved', 'processing', 'paid', 'cancelled'])
export const leaveTypeEnum = pgEnum('leave_type', ['annual', 'sick', 'personal', 'maternity', 'paternity', 'unpaid', 'compassionate'])
export const leaveStatusEnum = pgEnum('leave_status', ['pending', 'approved', 'rejected', 'cancelled'])
export const benefitTypeEnum = pgEnum('benefit_type', ['medical', 'dental', 'vision', 'retirement', 'life', 'disability', 'wellness', 'hsa', 'fsa', 'commuter', 'voluntary', 'other'])
export const expenseStatusEnum = pgEnum('expense_status', ['draft', 'submitted', 'pending_approval', 'approved', 'rejected', 'reimbursed'])
export const jobTypeEnum = pgEnum('job_type', ['full_time', 'part_time', 'contract', 'internship'])
export const jobStatusEnum = pgEnum('job_status', ['draft', 'open', 'closed', 'filled'])
export const applicationStatusEnum = pgEnum('application_status', ['new', 'screening', 'phone_screen', 'technical', 'onsite', 'panel', 'assessment', 'reference_check', 'hiring_manager_review', 'offer', 'hired', 'rejected', 'withdrawn'])
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
  firstName: varchar('first_name', { length: 128 }),
  lastName: varchar('last_name', { length: 128 }),
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
  // Banking Details (for payroll disbursement)
  bankName: varchar('bank_name', { length: 255 }),
  bankCode: varchar('bank_code', { length: 50 }), // sort code, routing number, NIBSS bank code
  bankAccountNumber: varchar('bank_account_number', { length: 100 }), // encrypted at rest via DB-level encryption
  bankAccountName: varchar('bank_account_name', { length: 255 }), // account holder name as registered with bank
  bankCountry: varchar('bank_country', { length: 100 }), // may differ from work country for expatriates
  mobileMoneyProvider: varchar('mobile_money_provider', { length: 100 }), // MTN, Vodafone Cash, M-Pesa, etc.
  mobileMoneyNumber: varchar('mobile_money_number', { length: 50 }),
  // Tax & Employment Lifecycle
  taxIdNumber: varchar('tax_id_number', { length: 100 }), // TIN / KRA PIN / SSNIT number for tax forms
  terminationDate: date('termination_date'), // For pro-rata final pay calculations
  capabilities: varchar('capabilities', { length: 500 }), // comma-separated capability tags: payroll_officer,finance_approver,it_manager,recruiter
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
  acknowledgedAt: timestamp('acknowledged_at'),
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
  courseContentId: uuid('course_content_id').references(() => courseContent.id, { onDelete: 'cascade' }),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }),
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

// MENTORING: Sessions, Goals
export const mentoringSessionStatusEnum = pgEnum('mentoring_session_status', ['scheduled', 'completed', 'cancelled', 'no_show'])
export const mentoringGoalStatusEnum = pgEnum('mentoring_goal_status', ['not_started', 'in_progress', 'completed', 'deferred'])

export const mentoringSessions = pgTable('mentoring_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  pairId: uuid('pair_id').references(() => mentoringPairs.id, { onDelete: 'cascade' }).notNull(),
  scheduledAt: timestamp('scheduled_at').notNull(),
  duration: integer('duration').default(60), // minutes
  status: mentoringSessionStatusEnum('status').default('scheduled').notNull(),
  notes: text('notes'),
  topics: text('topics'),
  rating: integer('rating'), // 1-5
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const mentoringGoals = pgTable('mentoring_goals', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  pairId: uuid('pair_id').references(() => mentoringPairs.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  status: mentoringGoalStatusEnum('status').default('not_started').notNull(),
  targetDate: date('target_date'),
  completedAt: timestamp('completed_at'),
  progress: integer('progress').default(0), // 0-100
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// PAYROLL
// ============================================================

export const payrollRuns = pgTable('payroll_runs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  period: varchar('period', { length: 100 }).notNull(),
  status: payrollStatusEnum('status').default('draft').notNull(),
  country: varchar('country', { length: 10 }), // ISO country code — filters employees in this run
  totalGross: integer('total_gross').notNull(),
  totalNet: integer('total_net').notNull(),
  totalDeductions: integer('total_deductions').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  employeeCount: integer('employee_count').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  rejectedBy: uuid('rejected_by').references(() => employees.id),
  rejectionReason: text('rejection_reason'),
  // rejectionCount lives in optimistic state only (column not in DB yet)
  paymentReference: varchar('payment_reference', { length: 255 }),
  cancellationReason: text('cancellation_reason'),
  runDate: timestamp('run_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Payroll approval chain records (multi-level)
export const payrollApprovals = pgTable('payroll_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id, { onDelete: 'cascade' }).notNull(),
  approverId: uuid('approver_id').references(() => employees.id).notNull(),
  level: integer('level').notNull(), // 1 = HR, 2 = Finance
  role: varchar('role', { length: 50 }).notNull(), // 'hr' | 'finance'
  decision: varchar('decision', { length: 20 }).default('pending').notNull(), // 'approved' | 'rejected' | 'pending'
  comment: text('comment'),
  decidedAt: timestamp('decided_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Per-org approval chain configuration
export const payrollApprovalConfig = pgTable('payroll_approval_config', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  level: integer('level').notNull(), // 1 or 2
  requiredRole: varchar('required_role', { length: 50 }).notNull(), // 'hr' | 'finance' | 'owner' | 'admin'
  isRequired: boolean('is_required').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// PAYROLL AUDIT LOG (immutable — UPDATE and DELETE blocked by DB rules)
export const payrollAuditLog = pgTable('payroll_audit_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id, { onDelete: 'cascade' }),
  employeePayrollEntryId: uuid('employee_payroll_entry_id'),
  action: varchar('action', { length: 100 }).notNull(), // created | submitted | approved_hr | approved_finance | rejected | processing | paid | cancelled | entry_modified
  actorId: uuid('actor_id').notNull(),
  actorName: varchar('actor_name', { length: 255 }).notNull(),
  oldValue: jsonb('old_value'),
  newValue: jsonb('new_value'),
  reason: text('reason'),
  ipAddress: varchar('ip_address', { length: 50 }),
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
  // Pro-rata & leave tracking
  payType: varchar('pay_type', { length: 50 }).default('full_month'), // full_month | pro_rata_new | pro_rata_exit | final_pay | maternity | paternity | unpaid_leave
  unpaidLeaveDays: real('unpaid_leave_days').default(0),
  leaveType: varchar('leave_type', { length: 50 }), // maternity | paternity | null
  workingDaysInMonth: integer('working_days_in_month'),
  workingDaysEmployed: integer('working_days_employed'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// CONTRACTOR PAYMENTS
export const contractorPayments = pgTable('contractor_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  contractorName: varchar('contractor_name', { length: 255 }).notNull(),
  company: varchar('company', { length: 255 }),
  serviceType: varchar('service_type', { length: 255 }),
  invoiceNumber: varchar('invoice_number', { length: 100 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  dueDate: date('due_date'),
  paidDate: date('paid_date'),
  paymentMethod: varchar('payment_method', { length: 50 }),
  taxForm: varchar('tax_form', { length: 50 }),
  country: varchar('country', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// PAYROLL SCHEDULES
export const payrollSchedules = pgTable('payroll_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(),
  nextRunDate: date('next_run_date'),
  employeeGroup: varchar('employee_group', { length: 255 }),
  autoApprove: boolean('auto_approve').default(false).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  lastRunDate: date('last_run_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// TAX CONFIGURATIONS
export const taxConfigs = pgTable('tax_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  taxType: varchar('tax_type', { length: 255 }).notNull(),
  rate: real('rate').notNull(),
  description: text('description'),
  employerContribution: real('employer_contribution').default(0),
  employeeContribution: real('employee_contribution').default(0),
  effectiveDate: date('effective_date'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// TAX FILINGS
export const taxFilings = pgTable('tax_filings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  formName: varchar('form_name', { length: 255 }).notNull(),
  description: text('description'),
  deadline: date('deadline'),
  frequency: varchar('frequency', { length: 50 }),
  status: varchar('status', { length: 50 }).default('upcoming').notNull(),
  filedDate: date('filed_date'),
  filingPeriod: varchar('filing_period', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// BENEFIT DEPENDENTS
export const benefitDependents = pgTable('benefit_dependents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  relationship: varchar('relationship', { length: 50 }).notNull(),
  dateOfBirth: date('date_of_birth'),
  gender: varchar('gender', { length: 20 }),
  planIds: jsonb('plan_ids'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// LIFE EVENTS
export const lifeEvents = pgTable('life_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(),
  eventDate: date('event_date').notNull(),
  reportedDate: date('reported_date'),
  deadline: date('deadline'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  notes: text('notes'),
  benefitChanges: jsonb('benefit_changes'),
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
  userId: uuid('user_id').references(() => employees.id),
  method: mfaMethodEnum('method').notNull().default('totp'),
  secret: varchar('secret', { length: 255 }).notNull(),
  isVerified: boolean('is_verified').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
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

// ONBOARDING: Buddy Assignments, Preboarding Tasks
// ============================================================

export const buddyAssignments = pgTable('buddy_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  newHireId: uuid('new_hire_id').references(() => employees.id).notNull(),
  buddyId: uuid('buddy_id').references(() => employees.id).notNull(),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  matchScore: integer('match_score'),
  assignedDate: date('assigned_date').defaultNow(),
  completedDate: date('completed_date'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const preboardingTasks = pgTable('preboarding_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  category: varchar('category', { length: 100 }).default('general'),
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  assigneeId: uuid('assignee_id').references(() => employees.id),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
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
  'schedule_meeting', 'create_review', 'enroll_course', 'trigger_webhook',
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

// ============================================================
// E-SIGNATURES
// ============================================================

export const signatureRequestStatusEnum = pgEnum('signature_request_status', ['draft', 'pending', 'partially_signed', 'completed', 'declined', 'expired', 'cancelled'])
export const signatureStatusEnum = pgEnum('signature_status', ['draft', 'pending', 'in_progress', 'completed', 'declined', 'expired', 'voided'])
export const signingFlowEnum = pgEnum('signing_flow', ['sequential', 'parallel'])
export const signatureAuditActionEnum = pgEnum('signature_audit_action', ['created', 'sent', 'viewed', 'signed', 'declined', 'voided', 'reminded', 'expired', 'downloaded'])
export const signerStatusEnum = pgEnum('signer_status', ['pending', 'sent', 'viewed', 'signed', 'declined'])

export const signatureDocuments = pgTable('signature_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  documentUrl: text('document_url'),
  status: signatureStatusEnum('status').default('draft').notNull(),
  signingFlow: signingFlowEnum('signing_flow').default('sequential').notNull(),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  templateId: uuid('template_id'),
  expiresAt: timestamp('expires_at'),
  completedAt: timestamp('completed_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const signatureSigners = pgTable('signature_signers', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => signatureDocuments.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id),
  email: varchar('email', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }),
  externalEmail: varchar('external_email', { length: 255 }),
  externalName: varchar('external_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('signer').notNull(),
  signingOrder: integer('signing_order').default(0).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  status: signerStatusEnum('status').default('pending').notNull(),
  signedAt: timestamp('signed_at'),
  signatureDataUrl: text('signature_data_url'),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  signatureImageUrl: text('signature_image_url'),
  accessToken: varchar('access_token', { length: 255 }),
  declineReason: text('decline_reason'),
  declinedAt: timestamp('declined_at'),
  viewedAt: timestamp('viewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const signatureTemplates = pgTable('signature_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  documentUrl: text('document_url'),
  signingFlow: signingFlowEnum('signing_flow').default('sequential').notNull(),
  signerRoles: jsonb('signer_roles'),
  fieldPlacements: jsonb('field_placements'),
  isActive: boolean('is_active').default(true).notNull(),
  createdBy: uuid('created_by').references(() => employees.id),
  usageCount: integer('usage_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const signatureAuditTrail = pgTable('signature_audit_trail', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentId: uuid('document_id').references(() => signatureDocuments.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  actorId: uuid('actor_id').references(() => employees.id),
  actorEmail: varchar('actor_email', { length: 255 }),
  actorName: varchar('actor_name', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 50 }),
  userAgent: text('user_agent'),
  details: text('details'),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// ============================================================
// E-VERIFY / I-9
// ============================================================

export const i9StatusEnum = pgEnum('i9_status', ['not_started', 'section1_pending', 'section1_complete', 'section2_pending', 'section2_complete', 'everify_pending', 'everify_submitted', 'verified', 'tnc_issued', 'tnc_contested', 'final_nonconfirmation', 'closed', 'reverification_needed', 'complete', 'expired'])
export const everifyStatusEnum = pgEnum('everify_status', ['not_submitted', 'pending', 'initial_case_created', 'employment_authorized', 'tentative_non_confirmation', 'case_closed', 'final_non_confirmation'])
export const i9DocumentCategoryEnum = pgEnum('i9_document_category', ['list_a', 'list_b', 'list_c'])
export const everifyCaseStatusEnum = pgEnum('everify_case_status', ['open', 'initial_verification', 'employment_authorized', 'tentative_nonconfirmation', 'case_in_continuance', 'close_case_authorized', 'close_case_unauthorized', 'final_nonconfirmation'])

export const i9Forms = pgTable('i9_forms', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  status: i9StatusEnum('status').default('not_started').notNull(),
  hireDate: date('hire_date').notNull(),
  startDate: date('start_date'),
  section1CompletedAt: timestamp('section1_completed_at'),
  section2CompletedAt: timestamp('section2_completed_at'),
  section1Data: jsonb('section1_data'),
  section2Data: jsonb('section2_data'),
  verifiedBy: uuid('verified_by').references(() => employees.id),
  reverificationDate: date('reverification_date'),
  reverificationDocType: varchar('reverification_doc_type', { length: 255 }),
  reverificationDocNumber: varchar('reverification_doc_number', { length: 255 }),
  reverificationExpirationDate: date('reverification_expiration_date'),
  completedAt: timestamp('completed_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const everifyCases = pgTable('everify_cases', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  i9FormId: uuid('i9_form_id').references(() => i9Forms.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  caseNumber: varchar('case_number', { length: 100 }),
  status: everifyCaseStatusEnum('status').default('open').notNull(),
  submittedAt: timestamp('submitted_at'),
  submittedBy: uuid('submitted_by').references(() => employees.id),
  resolvedAt: timestamp('resolved_at'),
  verificationResult: varchar('verification_result', { length: 100 }),
  tncIssueDate: date('tnc_issue_date'),
  tncReferralDate: date('tnc_referral_date'),
  tncContestDeadline: date('tnc_contest_deadline'),
  employeeContesting: boolean('employee_contesting').default(false).notNull(),
  closedAt: timestamp('closed_at'),
  closureReason: text('closure_reason'),
  photoMatchResult: varchar('photo_match_result', { length: 50 }),
  responseDetails: jsonb('response_details'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// PEO / CO-EMPLOYMENT
// ============================================================

export const peoStatusEnum = pgEnum('peo_status', ['active', 'inactive', 'pending', 'pending_setup', 'suspended', 'terminated'])
export const peoServiceEnum = pgEnum('peo_service', ['payroll', 'benefits', 'workers_comp', 'hr_compliance', 'tax_filing', 'risk_management'])
export const peoServiceTypeEnum = pgEnum('peo_service_type', ['full_peo', 'aso', 'payroll_only', 'benefits_only', 'compliance_only'])
export const coEmploymentStatusEnum = pgEnum('co_employment_status', ['pending', 'active', 'terminated', 'transferred'])

export const peoConfigurations = pgTable('peo_configurations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  peoProviderName: varchar('peo_provider_name', { length: 255 }).notNull(),
  status: peoStatusEnum('status').default('pending').notNull(),
  serviceType: peoServiceTypeEnum('service_type').default('full_peo').notNull(),
  contractStartDate: date('contract_start_date').notNull(),
  contractEndDate: date('contract_end_date'),
  fein: varchar('fein', { length: 20 }),
  stateRegistrations: jsonb('state_registrations'),
  services: jsonb('services'),
  adminFeeStructure: jsonb('admin_fee_structure'),
  workersCompPolicy: jsonb('workers_comp_policy'),
  payrollSchedule: varchar('payroll_schedule', { length: 50 }),
  primaryContactName: varchar('primary_contact_name', { length: 255 }),
  primaryContactEmail: varchar('primary_contact_email', { length: 255 }),
  primaryContactPhone: varchar('primary_contact_phone', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const coEmploymentRecords = pgTable('co_employment_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  peoConfigId: uuid('peo_config_id').references(() => peoConfigurations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  enrolledAt: date('enrolled_at').notNull(),
  terminatedAt: date('terminated_at'),
  status: varchar('status', { length: 50 }).default('active').notNull(),
  workersCompCode: varchar('workers_comp_code', { length: 50 }),
  stateUnemploymentId: varchar('state_unemployment_id', { length: 100 }),
  notes: text('notes'),
})

// ============================================================
// SANDBOX ENVIRONMENT
// ============================================================

export const sandboxStatusEnum = pgEnum('sandbox_status', ['provisioning', 'active', 'paused', 'expired', 'deleted'])
export const sandboxSnapshotStatusEnum = pgEnum('sandbox_snapshot_status', ['creating', 'ready', 'restoring', 'failed'])

export const sandboxEnvironments = pgTable('sandbox_environments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: sandboxStatusEnum('status').default('provisioning').notNull(),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  sourceType: varchar('source_type', { length: 50 }).default('empty').notNull(),
  sourceSnapshotId: uuid('source_snapshot_id'),
  modules: jsonb('modules'),
  dataMaskingConfig: jsonb('data_masking_config'),
  connectionString: text('connection_string'),
  databaseName: varchar('database_name', { length: 255 }),
  expiresAt: timestamp('expires_at'),
  pausedAt: timestamp('paused_at'),
  lastAccessedAt: timestamp('last_accessed_at'),
  storageUsedMb: integer('storage_used_mb').default(0).notNull(),
  maxStorageMb: integer('max_storage_mb').default(1024).notNull(),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const sandboxSnapshots = pgTable('sandbox_snapshots', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  sandboxId: uuid('sandbox_id').references(() => sandboxEnvironments.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  status: sandboxSnapshotStatusEnum('status').default('creating').notNull(),
  sizeBytes: integer('size_bytes').default(0).notNull(),
  snapshotData: jsonb('snapshot_data'),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// BUILT-IN CHAT / MESSAGING
// ============================================================

export const chatChannelTypeEnum = pgEnum('chat_channel_type', ['direct', 'group', 'department', 'announcement', 'project', 'public'])
export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read'])
export const chatMessageTypeEnum = pgEnum('chat_message_type', ['text', 'file', 'system', 'announcement'])

export const chatChannels = pgTable('chat_channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }),
  type: chatChannelTypeEnum('type').default('group').notNull(),
  description: text('description'),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  isArchived: boolean('is_archived').default(false).notNull(),
  lastMessageAt: timestamp('last_message_at'),
  departmentId: uuid('department_id').references(() => departments.id),
  pinnedMessageIds: jsonb('pinned_message_ids'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const chatParticipants = pgTable('chat_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => chatChannels.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 20 }).default('member').notNull(), // owner | admin | member
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  mutedUntil: timestamp('muted_until'),
  lastReadAt: timestamp('last_read_at'),
})

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => chatChannels.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid('sender_id').references(() => employees.id).notNull(),
  type: chatMessageTypeEnum('type').default('text').notNull(),
  content: text('content').notNull(),
  threadId: uuid('thread_id'),
  parentMessageId: uuid('parent_message_id'),
  isEdited: boolean('is_edited').default(false).notNull(),
  editedAt: timestamp('edited_at'),
  isDeleted: boolean('is_deleted').default(false).notNull(),
  deletedAt: timestamp('deleted_at'),
  isPinned: boolean('is_pinned').default(false).notNull(),
  pinnedAt: timestamp('pinned_at'),
  pinnedBy: uuid('pinned_by').references(() => employees.id),
  fileUrl: text('file_url'),
  fileName: varchar('file_name', { length: 255 }),
  fileSize: integer('file_size'),
  fileMimeType: varchar('file_mime_type', { length: 100 }),
  mentions: jsonb('mentions'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// AI INTERVIEW RECORDING & TRANSCRIPTION
// ============================================================

export const interviewRecordingStatusEnum = pgEnum('interview_recording_status', ['scheduled', 'recording', 'processing', 'completed', 'failed'])

export const interviewRecordings = pgTable('interview_recordings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  interviewType: varchar('interview_type', { length: 100 }).notNull(),
  interviewerIds: jsonb('interviewer_ids').notNull(), // string[]
  status: interviewRecordingStatusEnum('status').default('scheduled').notNull(),
  recordingUrl: text('recording_url'),
  duration: integer('duration'), // seconds
  scheduledAt: timestamp('scheduled_at'),
  recordedAt: timestamp('recorded_at'),
  metadata: jsonb('metadata'), // { platform, meetingId, resolution, fileSize }
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const interviewTranscriptions = pgTable('interview_transcriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  recordingId: uuid('recording_id').references(() => interviewRecordings.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  fullText: text('full_text'),
  segments: jsonb('segments'), // Array<{ speaker, startTime, endTime, text, confidence }>
  summary: text('summary'),
  keyTopics: jsonb('key_topics'), // string[]
  sentiment: jsonb('sentiment'), // { overall, perSpeaker: Record<string, score> }
  aiScorecard: jsonb('ai_scorecard'), // { technicalSkills, communication, problemSolving, cultureFit, overall, strengths, concerns }
  language: varchar('language', { length: 20 }).default('en').notNull(),
  processedAt: timestamp('processed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// AI VIDEO SCREENS (ONE-WAY)
// ============================================================

export const videoScreenStatusEnum = pgEnum('video_screen_status', ['draft', 'sent', 'in_progress', 'completed', 'expired', 'reviewed'])

export const videoScreenTemplates = pgTable('video_screen_templates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  questions: jsonb('questions').notNull(), // Array<{ text, thinkTime, responseTime, maxRetakes }>
  introVideoUrl: text('intro_video_url'),
  brandingConfig: jsonb('branding_config'), // { logoUrl, primaryColor, welcomeMessage }
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const videoScreenInvites = pgTable('video_screen_invites', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  applicationId: uuid('application_id').references(() => applications.id, { onDelete: 'cascade' }).notNull(),
  templateId: uuid('template_id').references(() => videoScreenTemplates.id).notNull(),
  status: videoScreenStatusEnum('status').default('draft').notNull(),
  accessToken: varchar('access_token', { length: 255 }).notNull(),
  sentAt: timestamp('sent_at'),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const videoScreenResponses = pgTable('video_screen_responses', {
  id: uuid('id').defaultRandom().primaryKey(),
  inviteId: uuid('invite_id').references(() => videoScreenInvites.id, { onDelete: 'cascade' }).notNull(),
  questionIndex: integer('question_index').notNull(),
  videoUrl: text('video_url'),
  thumbnailUrl: text('thumbnail_url'),
  duration: integer('duration'), // seconds
  transcription: text('transcription'),
  aiAnalysis: jsonb('ai_analysis'), // { relevance, clarity, confidence, sentiment, keywords, score }
  reviewerNotes: text('reviewer_notes'),
  reviewerRating: integer('reviewer_rating'), // 1-5
  reviewedBy: uuid('reviewed_by').references(() => employees.id),
  reviewedAt: timestamp('reviewed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// CORPORATE CARDS
// ============================================================

export const cardStatusEnum = pgEnum('card_status', ['active', 'frozen', 'cancelled', 'pending_activation', 'expired'])
export const cardTypeEnum = pgEnum('card_type', ['physical', 'virtual'])
export const cardTransactionStatusEnum = pgEnum('card_transaction_status', ['pending', 'posted', 'declined', 'refunded', 'disputed'])

export const corporateCards = pgTable('corporate_cards', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  cardType: cardTypeEnum('card_type').default('virtual').notNull(),
  last4: varchar('last_4', { length: 4 }).notNull(),
  cardName: varchar('card_name', { length: 255 }).notNull(),
  status: cardStatusEnum('status').default('pending_activation').notNull(),
  spendLimit: integer('spend_limit').notNull(), // cents
  monthlyLimit: integer('monthly_limit'), // cents
  currentBalance: integer('current_balance').default(0).notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  allowedCategories: jsonb('allowed_categories'), // string[] or null for all
  expiryMonth: integer('expiry_month'),
  expiryYear: integer('expiry_year'),
  cashbackRate: real('cashback_rate').default(1.75), // percent
  totalCashback: integer('total_cashback').default(0).notNull(),
  issuedAt: timestamp('issued_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cardTransactions = pgTable('card_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  cardId: uuid('card_id').references(() => corporateCards.id, { onDelete: 'cascade' }).notNull(),
  amount: integer('amount').notNull(), // cents
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  merchantName: varchar('merchant_name', { length: 255 }).notNull(),
  merchantCategory: varchar('merchant_category', { length: 100 }),
  mcc: varchar('mcc', { length: 10 }), // Merchant Category Code
  status: cardTransactionStatusEnum('status').default('pending').notNull(),
  receiptUrl: text('receipt_url'),
  receiptMatched: boolean('receipt_matched').default(false).notNull(),
  expenseReportId: uuid('expense_report_id').references(() => expenseReports.id),
  cashbackAmount: integer('cashback_amount').default(0),
  transactedAt: timestamp('transacted_at').notNull(),
  postedAt: timestamp('posted_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const cardSpendLimits = pgTable('card_spend_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  cardId: uuid('card_id').references(() => corporateCards.id, { onDelete: 'cascade' }).notNull(),
  category: varchar('category', { length: 100 }),
  dailyLimit: integer('daily_limit'),
  weeklyLimit: integer('weekly_limit'),
  monthlyLimit: integer('monthly_limit'),
  perTransactionLimit: integer('per_transaction_limit'),
  isActive: boolean('is_active').default(true).notNull(),
})

// ============================================================
// BILL PAY
// ============================================================

export const billPayStatusEnum = pgEnum('bill_pay_status', ['draft', 'scheduled', 'processing', 'paid', 'failed', 'cancelled'])
export const billPayMethodEnum = pgEnum('bill_pay_method', ['ach', 'wire', 'check', 'virtual_card'])

export const billPayments = pgTable('bill_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  invoiceId: uuid('invoice_id').references(() => invoices.id),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  method: billPayMethodEnum('method').default('ach').notNull(),
  status: billPayStatusEnum('status').default('draft').notNull(),
  scheduledDate: date('scheduled_date'),
  paidDate: date('paid_date'),
  referenceNumber: varchar('reference_number', { length: 255 }),
  bankAccountLast4: varchar('bank_account_last4', { length: 4 }),
  routingNumber: varchar('routing_number', { length: 20 }),
  checkNumber: varchar('check_number', { length: 50 }),
  memo: text('memo'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const billPaySchedules = pgTable('bill_pay_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  method: billPayMethodEnum('method').default('ach').notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // weekly | biweekly | monthly | quarterly
  nextPaymentDate: date('next_payment_date'),
  endDate: date('end_date'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// TRAVEL MANAGEMENT
// ============================================================

export const travelRequestStatusEnum = pgEnum('travel_request_status', ['draft', 'pending_approval', 'approved', 'booked', 'in_progress', 'completed', 'cancelled'])
export const travelBookingTypeEnum = pgEnum('travel_booking_type', ['flight', 'hotel', 'car_rental', 'train', 'other'])
export const travelBookingStatusEnum = pgEnum('travel_booking_status', ['pending', 'confirmed', 'checked_in', 'completed', 'cancelled', 'refunded'])

export const travelPolicies = pgTable('travel_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  maxFlightClass: varchar('max_flight_class', { length: 50 }).default('economy').notNull(), // economy | premium_economy | business | first
  maxHotelRate: integer('max_hotel_rate'), // per night, cents
  maxCarClass: varchar('max_car_class', { length: 50 }),
  maxDailyMeals: integer('max_daily_meals'), // cents
  advanceBookingDays: integer('advance_booking_days').default(14),
  requiresApproval: boolean('requires_approval').default(true).notNull(),
  approvalThreshold: integer('approval_threshold'), // auto-approve below this amount
  preferredAirlines: jsonb('preferred_airlines'), // string[]
  preferredHotels: jsonb('preferred_hotels'), // string[]
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const travelRequests = pgTable('travel_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  purpose: text('purpose').notNull(),
  destination: varchar('destination', { length: 255 }).notNull(),
  departureDate: date('departure_date').notNull(),
  returnDate: date('return_date').notNull(),
  estimatedCost: integer('estimated_cost'), // cents
  actualCost: integer('actual_cost'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: travelRequestStatusEnum('status').default('draft').notNull(),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  policyId: uuid('policy_id').references(() => travelPolicies.id),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const travelBookings = pgTable('travel_bookings', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  travelRequestId: uuid('travel_request_id').references(() => travelRequests.id, { onDelete: 'cascade' }).notNull(),
  type: travelBookingTypeEnum('type').notNull(),
  status: travelBookingStatusEnum('status').default('pending').notNull(),
  provider: varchar('provider', { length: 255 }),
  confirmationNumber: varchar('confirmation_number', { length: 255 }),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  details: jsonb('details'), // { airline, flightNumber, departure, arrival, class } | { hotel, roomType, checkIn, checkOut } | { company, vehicleClass, pickup, dropoff }
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  cancellationPolicy: text('cancellation_policy'),
  bookedAt: timestamp('booked_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// PROCUREMENT / PURCHASE ORDERS
// ============================================================

export const purchaseOrderStatusEnum = pgEnum('purchase_order_status', ['draft', 'pending_approval', 'approved', 'sent_to_vendor', 'partially_received', 'received', 'closed', 'cancelled'])
export const procurementRequestStatusEnum = pgEnum('procurement_request_status', ['submitted', 'under_review', 'approved', 'rejected', 'fulfilled'])
export const procurementPriorityEnum = pgEnum('procurement_priority', ['low', 'medium', 'high', 'urgent'])

export const purchaseOrders = pgTable('purchase_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  poNumber: varchar('po_number', { length: 50 }).notNull(),
  vendorId: uuid('vendor_id').references(() => vendors.id).notNull(),
  status: purchaseOrderStatusEnum('status').default('draft').notNull(),
  totalAmount: integer('total_amount').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  shippingAddress: text('shipping_address'),
  billingAddress: text('billing_address'),
  terms: text('terms'),
  deliveryDate: date('delivery_date'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const purchaseOrderItems = pgTable('purchase_order_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  poId: uuid('po_id').references(() => purchaseOrders.id, { onDelete: 'cascade' }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  sku: varchar('sku', { length: 100 }),
  quantity: integer('quantity').notNull(),
  unitPrice: integer('unit_price').notNull(), // cents
  totalPrice: integer('total_price').notNull(),
  receivedQuantity: integer('received_quantity').default(0).notNull(),
  category: varchar('category', { length: 100 }),
})

export const procurementRequests = pgTable('procurement_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  requesterId: uuid('requester_id').references(() => employees.id).notNull(),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  estimatedAmount: integer('estimated_amount'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  priority: procurementPriorityEnum('priority').default('medium').notNull(),
  status: procurementRequestStatusEnum('status').default('submitted').notNull(),
  departmentId: uuid('department_id').references(() => departments.id),
  purchaseOrderId: uuid('purchase_order_id').references(() => purchaseOrders.id),
  neededBy: date('needed_by'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// MULTI-CURRENCY SPEND (ENHANCED)
// ============================================================

export const currencyAccounts = pgTable('currency_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  balance: integer('balance').default(0).notNull(), // in minor units (cents, pence, etc.)
  accountName: varchar('account_name', { length: 255 }),
  bankName: varchar('bank_name', { length: 255 }),
  bankAccountNumber: varchar('bank_account_number', { length: 50 }),
  routingNumber: varchar('routing_number', { length: 20 }),
  iban: varchar('iban', { length: 50 }),
  swiftCode: varchar('swift_code', { length: 20 }),
  isDefault: boolean('is_default').default(false).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const fxTransactions = pgTable('fx_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  fromCurrency: varchar('from_currency', { length: 10 }).notNull(),
  toCurrency: varchar('to_currency', { length: 10 }).notNull(),
  fromAmount: integer('from_amount').notNull(),
  toAmount: integer('to_amount').notNull(),
  exchangeRate: real('exchange_rate').notNull(),
  fee: integer('fee').default(0),
  purpose: varchar('purpose', { length: 255 }),
  reference: varchar('reference', { length: 255 }),
  executedAt: timestamp('executed_at').defaultNow().notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// 401(K) ADMINISTRATION
// ============================================================

export const retirementPlanTypeEnum = pgEnum('retirement_plan_type', ['traditional_401k', 'roth_401k', 'safe_harbor_401k', '403b', '457b', 'simple_ira', 'sep_ira'])
export const retirementPlanStatusEnum = pgEnum('retirement_plan_status', ['active', 'frozen', 'terminated'])
export const vestingScheduleTypeEnum = pgEnum('vesting_schedule_type', ['immediate', 'cliff', 'graded', 'custom'])

export const retirementPlans = pgTable('retirement_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: retirementPlanTypeEnum('type').notNull(),
  status: retirementPlanStatusEnum('status').default('active').notNull(),
  provider: varchar('provider', { length: 255 }).notNull(),
  planNumber: varchar('plan_number', { length: 100 }),
  employeeContributionLimit: integer('employee_contribution_limit').notNull(), // annual max, cents
  catchUpContributionLimit: integer('catch_up_contribution_limit'), // for 50+ employees
  employerMatchPercent: real('employer_match_percent').default(0), // e.g. 100 = 100% match
  employerMatchCap: real('employer_match_cap').default(0), // max % of salary matched
  vestingType: vestingScheduleTypeEnum('vesting_type').default('graded').notNull(),
  vestingSchedule: jsonb('vesting_schedule'), // Array<{ year, percent }> e.g. [{1, 20}, {2, 40}, {3, 60}, {4, 80}, {5, 100}]
  autoEnroll: boolean('auto_enroll').default(false).notNull(),
  autoEnrollPercent: real('auto_enroll_percent'),
  autoEscalate: boolean('auto_escalate').default(false).notNull(),
  escalationPercent: real('escalation_percent'),
  escalationCap: real('escalation_cap'),
  effectiveDate: date('effective_date'),
  terminationDate: date('termination_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const retirementContributions = pgTable('retirement_contributions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => retirementPlans.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  payrollRunId: uuid('payroll_run_id').references(() => payrollRuns.id),
  employeeAmount: integer('employee_amount').notNull(),
  employerAmount: integer('employer_amount').notNull(),
  employeePercent: real('employee_percent').notNull(),
  isPreTax: boolean('is_pre_tax').default(true).notNull(),
  ytdEmployeeTotal: integer('ytd_employee_total').default(0).notNull(),
  ytdEmployerTotal: integer('ytd_employer_total').default(0).notNull(),
  vestingPercent: real('vesting_percent').default(0).notNull(),
  period: varchar('period', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const retirementEnrollments = pgTable('retirement_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => retirementPlans.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  contributionPercent: real('contribution_percent').notNull(),
  isRoth: boolean('is_roth').default(false).notNull(),
  enrolledAt: date('enrolled_at').notNull(),
  terminatedAt: date('terminated_at'),
  beneficiaries: jsonb('beneficiaries'), // Array<{ name, relationship, percent }>
  investmentElections: jsonb('investment_elections'), // Array<{ fundId, fundName, percent }>
})

// ============================================================
// CARRIER INTEGRATION TRACKING
// ============================================================

export const carrierSyncStatusEnum = pgEnum('carrier_sync_status', ['connected', 'syncing', 'error', 'disconnected'])
export const enrollmentFeedStatusEnum = pgEnum('enrollment_feed_status', ['pending', 'sent', 'acknowledged', 'error', 'rejected'])

export const carrierIntegrations = pgTable('carrier_integrations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  carrierName: varchar('carrier_name', { length: 255 }).notNull(),
  carrierId: varchar('carrier_id', { length: 100 }),
  planIds: jsonb('plan_ids'), // benefit plan IDs linked to this carrier
  connectionType: varchar('connection_type', { length: 50 }).notNull(), // edi_834 | api | sftp | manual
  syncStatus: carrierSyncStatusEnum('sync_status').default('disconnected').notNull(),
  lastSyncAt: timestamp('last_sync_at'),
  lastSyncStatus: varchar('last_sync_status', { length: 50 }),
  config: jsonb('config'), // { endpoint, credentials, format, schedule }
  contactEmail: varchar('contact_email', { length: 255 }),
  contactPhone: varchar('contact_phone', { length: 50 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const enrollmentFeeds = pgTable('enrollment_feeds', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  carrierId: uuid('carrier_id').references(() => carrierIntegrations.id, { onDelete: 'cascade' }).notNull(),
  feedType: varchar('feed_type', { length: 50 }).notNull(), // full | changes_only
  status: enrollmentFeedStatusEnum('status').default('pending').notNull(),
  recordCount: integer('record_count').default(0).notNull(),
  errorCount: integer('error_count').default(0),
  errors: jsonb('errors'), // Array<{ employeeId, field, message }>
  fileUrl: text('file_url'),
  sentAt: timestamp('sent_at'),
  acknowledgedAt: timestamp('acknowledged_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// GEOFENCING
// ============================================================

export const geofenceTypeEnum = pgEnum('geofence_type', ['office', 'warehouse', 'job_site', 'client_location', 'restricted'])
export const geofenceEventTypeEnum = pgEnum('geofence_event_type', ['entry', 'exit', 'clock_in', 'clock_out', 'violation'])

export const geofenceZones = pgTable('geofence_zones', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: geofenceTypeEnum('type').default('office').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  radiusMeters: integer('radius_meters').notNull(),
  address: text('address'),
  isActive: boolean('is_active').default(true).notNull(),
  requireClockInWithin: boolean('require_clock_in_within').default(false).notNull(),
  alertOnViolation: boolean('alert_on_violation').default(true).notNull(),
  assignedDepartments: jsonb('assigned_departments'), // string[] department IDs
  assignedEmployees: jsonb('assigned_employees'), // string[] employee IDs
  operatingHours: jsonb('operating_hours'), // { [day]: { start, end } }
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const geofenceEvents = pgTable('geofence_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  zoneId: uuid('zone_id').references(() => geofenceZones.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  eventType: geofenceEventTypeEnum('event_type').notNull(),
  latitude: real('latitude').notNull(),
  longitude: real('longitude').notNull(),
  accuracy: real('accuracy'), // GPS accuracy in meters
  distanceFromCenter: real('distance_from_center'), // meters
  isWithinZone: boolean('is_within_zone').notNull(),
  deviceInfo: jsonb('device_info'), // { platform, model, osVersion }
  timeEntryId: uuid('time_entry_id').references(() => timeEntries.id),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

// ============================================================
// FULL IDENTITY PROVIDER (IdP) - SSO/SAML/MFA
// ============================================================

export const idpProtocolEnum = pgEnum('idp_protocol', ['saml', 'oidc', 'ldap', 'scim'])
export const idpAppStatusEnum = pgEnum('idp_app_status', ['active', 'inactive', 'pending_setup'])
export const mfaPolicyEnforcementEnum = pgEnum('mfa_policy_enforcement', ['required', 'optional', 'disabled'])

export const idpConfigurations = pgTable('idp_configurations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  isEnabled: boolean('is_enabled').default(false).notNull(),
  defaultProtocol: idpProtocolEnum('default_protocol').default('saml').notNull(),
  entityId: varchar('entity_id', { length: 500 }).notNull(),
  ssoUrl: varchar('sso_url', { length: 500 }).notNull(),
  sloUrl: varchar('slo_url', { length: 500 }),
  certificate: text('certificate').notNull(),
  privateKey: text('private_key'),
  metadataUrl: varchar('metadata_url', { length: 500 }),
  sessionTimeout: integer('session_timeout').default(480), // minutes
  forceReauth: boolean('force_reauth').default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const samlApps = pgTable('saml_apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  idpConfigId: uuid('idp_config_id').references(() => idpConfigurations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  logo: varchar('logo', { length: 500 }),
  protocol: idpProtocolEnum('protocol').default('saml').notNull(),
  spEntityId: varchar('sp_entity_id', { length: 500 }),
  acsUrl: varchar('acs_url', { length: 500 }),
  sloUrl: varchar('slo_url', { length: 500 }),
  nameIdFormat: varchar('name_id_format', { length: 255 }).default('email'),
  attributeMappings: jsonb('attribute_mappings'), // Record<string, string>
  status: idpAppStatusEnum('status').default('pending_setup').notNull(),
  assignedGroups: jsonb('assigned_groups'), // string[] department/role
  loginCount: integer('login_count').default(0),
  lastLoginAt: timestamp('last_login_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const mfaPolicies = pgTable('mfa_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  enforcement: mfaPolicyEnforcementEnum('enforcement').default('required').notNull(),
  allowedMethods: jsonb('allowed_methods').notNull(), // ['totp', 'sms', 'email', 'webauthn', 'push']
  gracePeriodhours: integer('grace_period_hours').default(0),
  rememberDeviceDays: integer('remember_device_days').default(30),
  appliesTo: policyAppliesToEnum('applies_to').default('all').notNull(),
  targetValue: varchar('target_value', { length: 255 }),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// ZERO-TOUCH DEPLOYMENT
// ============================================================

export const deploymentProfileStatusEnum = pgEnum('deployment_profile_status', ['active', 'draft', 'archived'])

export const deploymentProfiles = pgTable('deployment_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  platform: managedDevicePlatformEnum('platform').notNull(),
  status: deploymentProfileStatusEnum('status').default('draft').notNull(),
  config: jsonb('config').notNull(), // { wifiConfig, vpnConfig, securitySettings, apps, scripts, wallpaper, ... }
  appsToInstall: jsonb('apps_to_install'), // string[] app IDs from catalog
  securityPolicyIds: jsonb('security_policy_ids'), // string[] security policy IDs
  welcomeMessage: text('welcome_message'),
  skipSetupSteps: jsonb('skip_setup_steps'), // string[] e.g. ['location_services', 'siri', 'apple_pay']
  isDefault: boolean('is_default').default(false).notNull(),
  deviceCount: integer('device_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const deviceEnrollmentTokens = pgTable('device_enrollment_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  profileId: uuid('profile_id').references(() => deploymentProfiles.id, { onDelete: 'cascade' }).notNull(),
  token: varchar('token', { length: 500 }).notNull(),
  assignedTo: uuid('assigned_to').references(() => employees.id),
  isUsed: boolean('is_used').default(false).notNull(),
  usedAt: timestamp('used_at'),
  deviceId: uuid('device_id').references(() => managedDevices.id),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// PASSWORD MANAGER
// ============================================================

export const vaultItemTypeEnum = pgEnum('vault_item_type', ['login', 'secure_note', 'credit_card', 'identity', 'ssh_key', 'api_key'])

export const passwordVaults = pgTable('password_vaults', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  isShared: boolean('is_shared').default(false).notNull(),
  ownerId: uuid('owner_id').references(() => employees.id).notNull(),
  sharedWith: jsonb('shared_with'), // Array<{ employeeId | departmentId, role: 'viewer' | 'editor' }>
  encryptionKeyId: varchar('encryption_key_id', { length: 255 }),
  itemCount: integer('item_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const vaultItems = pgTable('vault_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  vaultId: uuid('vault_id').references(() => passwordVaults.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  type: vaultItemTypeEnum('type').default('login').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  url: varchar('url', { length: 500 }),
  username: varchar('username', { length: 255 }),
  encryptedPassword: text('encrypted_password'),
  notes: text('notes'),
  customFields: jsonb('custom_fields'), // Array<{ name, value, isHidden }>
  tags: jsonb('tags'), // string[]
  passwordStrength: varchar('password_strength', { length: 20 }), // weak | fair | strong | very_strong
  lastUsedAt: timestamp('last_used_at'),
  passwordChangedAt: timestamp('password_changed_at'),
  autoFill: boolean('auto_fill').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// DEVICE STORE / BUYBACK
// ============================================================

export const deviceCatalogStatusEnum = pgEnum('device_catalog_status', ['available', 'out_of_stock', 'discontinued', 'coming_soon'])
export const deviceOrderStatusEnum = pgEnum('device_order_status', ['pending_approval', 'approved', 'ordered', 'shipped', 'delivered', 'cancelled'])
export const buybackStatusEnum = pgEnum('buyback_status', ['submitted', 'evaluating', 'quote_sent', 'accepted', 'rejected', 'completed'])

export const deviceStoreCatalog = pgTable('device_store_catalog', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  manufacturer: varchar('manufacturer', { length: 100 }).notNull(),
  model: varchar('model', { length: 255 }).notNull(),
  category: varchar('category', { length: 100 }).notNull(), // laptop | desktop | phone | tablet | monitor | accessories
  platform: varchar('platform', { length: 50 }),
  specs: jsonb('specs'), // { cpu, ram, storage, display, battery }
  price: integer('price').notNull(), // cents
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  imageUrl: text('image_url'),
  status: deviceCatalogStatusEnum('status').default('available').notNull(),
  stockCount: integer('stock_count').default(0).notNull(),
  supplier: varchar('supplier', { length: 255 }),
  warrantyMonths: integer('warranty_months').default(12),
  isApproved: boolean('is_approved').default(true).notNull(),
  allowedRoles: jsonb('allowed_roles'), // string[] or null for all
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const deviceOrders = pgTable('device_orders', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  catalogItemId: uuid('catalog_item_id').references(() => deviceStoreCatalog.id).notNull(),
  requesterId: uuid('requester_id').references(() => employees.id).notNull(),
  forEmployeeId: uuid('for_employee_id').references(() => employees.id).notNull(),
  quantity: integer('quantity').default(1).notNull(),
  totalPrice: integer('total_price').notNull(),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: deviceOrderStatusEnum('status').default('pending_approval').notNull(),
  shippingAddress: text('shipping_address'),
  trackingNumber: varchar('tracking_number', { length: 255 }),
  approvedBy: uuid('approved_by').references(() => employees.id),
  approvedAt: timestamp('approved_at'),
  orderedAt: timestamp('ordered_at'),
  deliveredAt: timestamp('delivered_at'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const buybackRequests = pgTable('buyback_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  deviceId: uuid('device_id').references(() => managedDevices.id),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  deviceName: varchar('device_name', { length: 255 }).notNull(),
  condition: inventoryConditionEnum('condition').notNull(),
  originalPrice: integer('original_price'),
  buybackPrice: integer('buyback_price'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  status: buybackStatusEnum('status').default('submitted').notNull(),
  photos: jsonb('photos'), // string[] URLs
  employeeNotes: text('employee_notes'),
  evaluationNotes: text('evaluation_notes'),
  evaluatedBy: uuid('evaluated_by').references(() => employees.id),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// NO-CODE APP BUILDER (APP STUDIO)
// ============================================================

export const customAppStatusEnum = pgEnum('custom_app_status', ['draft', 'published', 'archived'])
export const appComponentTypeEnum = pgEnum('app_component_type', ['form', 'table', 'chart', 'text', 'image', 'button', 'container', 'list', 'detail', 'filter', 'tabs', 'modal'])
export const appDataSourceTypeEnum = pgEnum('app_data_source_type', ['database', 'api', 'csv', 'google_sheets', 'airtable', 'manual'])

export const customApps = pgTable('custom_apps', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  icon: varchar('icon', { length: 50 }),
  slug: varchar('slug', { length: 100 }).notNull(),
  status: customAppStatusEnum('status').default('draft').notNull(),
  version: integer('version').default(1).notNull(),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  publishedBy: uuid('published_by').references(() => employees.id),
  publishedAt: timestamp('published_at'),
  accessRoles: jsonb('access_roles'), // string[] or null for all
  theme: jsonb('theme'), // { primaryColor, headerStyle, layout }
  settings: jsonb('settings'), // { showInSidebar, requireAuth, analytics }
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const appPages = pgTable('app_pages', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => customApps.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull(),
  layout: jsonb('layout'), // { type: 'single' | 'sidebar' | 'tabs', config }
  isHomePage: boolean('is_home_page').default(false).notNull(),
  orderIndex: integer('order_index').default(0).notNull(),
  icon: varchar('icon', { length: 50 }),
  isVisible: boolean('is_visible').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const appComponents = pgTable('app_components', {
  id: uuid('id').defaultRandom().primaryKey(),
  pageId: uuid('page_id').references(() => appPages.id, { onDelete: 'cascade' }).notNull(),
  type: appComponentTypeEnum('type').notNull(),
  label: varchar('label', { length: 255 }),
  config: jsonb('config').notNull(), // type-specific configuration
  dataSourceId: uuid('data_source_id'),
  position: jsonb('position'), // { x, y, width, height }
  orderIndex: integer('order_index').default(0).notNull(),
  isVisible: boolean('is_visible').default(true).notNull(),
  conditionalVisibility: jsonb('conditional_visibility'), // { field, operator, value }
  style: jsonb('style'), // CSS-like properties
})

export const appDataSources = pgTable('app_data_sources', {
  id: uuid('id').defaultRandom().primaryKey(),
  appId: uuid('app_id').references(() => customApps.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  type: appDataSourceTypeEnum('type').notNull(),
  config: jsonb('config').notNull(), // { table, columns, filters, sorting } | { url, method, headers } | etc.
  schema: jsonb('schema'), // Array<{ name, type, required, defaultValue }>
  refreshInterval: integer('refresh_interval'), // seconds, null = manual
  lastRefreshedAt: timestamp('last_refreshed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// RQL / CUSTOM QUERY LANGUAGE
// ============================================================

export const savedQueryStatusEnum = pgEnum('saved_query_status', ['active', 'archived'])

export const savedQueries = pgTable('saved_queries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  query: text('query').notNull(), // RQL query string
  parsedAst: jsonb('parsed_ast'), // parsed query AST for execution
  resultColumns: jsonb('result_columns'), // Array<{ name, type, label }>
  parameters: jsonb('parameters'), // Array<{ name, type, defaultValue, label }>
  tags: jsonb('tags'), // string[]
  isPublic: boolean('is_public').default(false).notNull(),
  status: savedQueryStatusEnum('status').default('active').notNull(),
  createdBy: uuid('created_by').references(() => employees.id).notNull(),
  lastRunAt: timestamp('last_run_at'),
  runCount: integer('run_count').default(0).notNull(),
  avgExecutionMs: integer('avg_execution_ms'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const querySchedules = pgTable('query_schedules', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  queryId: uuid('query_id').references(() => savedQueries.id, { onDelete: 'cascade' }).notNull(),
  frequency: varchar('frequency', { length: 50 }).notNull(), // hourly | daily | weekly | monthly
  recipients: jsonb('recipients'), // Array<{ employeeId?, email?, channel: 'email' | 'slack' }>
  format: varchar('format', { length: 20 }).default('csv').notNull(), // csv | xlsx | json | pdf
  nextRunAt: timestamp('next_run_at'),
  lastRunAt: timestamp('last_run_at'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// EOR (EMPLOYER OF RECORD)
// ============================================================

export const eorEntityStatusEnum = pgEnum('eor_entity_status', ['active', 'pending_setup', 'suspended', 'terminated'])
export const eorEmployeeStatusEnum = pgEnum('eor_employee_status', ['onboarding', 'active', 'on_leave', 'offboarding', 'terminated'])

export const eorEntities = pgTable('eor_entities', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 5 }).notNull(),
  legalEntityName: varchar('legal_entity_name', { length: 500 }).notNull(),
  partnerName: varchar('partner_name', { length: 255 }).notNull(), // EOR provider name
  status: eorEntityStatusEnum('status').default('pending_setup').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  taxId: varchar('tax_id', { length: 100 }),
  registrationNumber: varchar('registration_number', { length: 100 }),
  address: text('address'),
  monthlyFee: integer('monthly_fee'), // per employee, cents
  setupFee: integer('setup_fee'),
  employeeCount: integer('employee_count').default(0).notNull(),
  contractStartDate: date('contract_start_date'),
  contractEndDate: date('contract_end_date'),
  benefits: jsonb('benefits'), // { health, retirement, leave, other }
  complianceNotes: text('compliance_notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const eorEmployees = pgTable('eor_employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  eorEntityId: uuid('eor_entity_id').references(() => eorEntities.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  jobTitle: varchar('job_title', { length: 255 }),
  department: varchar('department', { length: 255 }),
  status: eorEmployeeStatusEnum('status').default('onboarding').notNull(),
  salary: integer('salary').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  contractType: varchar('contract_type', { length: 50 }).default('full_time').notNull(),
  localBenefits: jsonb('local_benefits'), // country-specific benefits
  taxSetup: jsonb('tax_setup'), // local tax configuration
  visaRequired: boolean('visa_required').default(false),
  visaStatus: varchar('visa_status', { length: 50 }),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const eorContracts = pgTable('eor_contracts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  eorEmployeeId: uuid('eor_employee_id').references(() => eorEmployees.id, { onDelete: 'cascade' }).notNull(),
  contractType: varchar('contract_type', { length: 50 }).notNull(), // employment_agreement | amendment | termination | nda
  documentUrl: text('document_url'),
  status: varchar('status', { length: 50 }).default('draft').notNull(), // draft | pending_signature | active | terminated
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  terms: jsonb('terms'), // { probationPeriod, noticePeriod, nonCompete, ip_assignment }
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// CONTRACTOR OF RECORD
// ============================================================

export const corContractorStatusEnum = pgEnum('cor_contractor_status', ['onboarding', 'active', 'paused', 'terminated'])
export const corPaymentFrequencyEnum = pgEnum('cor_payment_frequency', ['weekly', 'biweekly', 'monthly', 'milestone', 'on_completion'])

export const corContractors = pgTable('cor_contractors', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  status: corContractorStatusEnum('status').default('onboarding').notNull(),
  jobTitle: varchar('job_title', { length: 255 }),
  department: varchar('department', { length: 255 }),
  rate: integer('rate').notNull(), // hourly/daily/project rate in cents
  rateType: varchar('rate_type', { length: 20 }).notNull(), // hourly | daily | monthly | project
  currency: varchar('currency', { length: 10 }).notNull(),
  paymentFrequency: corPaymentFrequencyEnum('payment_frequency').default('monthly').notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date'),
  complianceStatus: varchar('compliance_status', { length: 50 }).default('pending').notNull(), // pending | compliant | at_risk | non_compliant
  taxClassification: varchar('tax_classification', { length: 50 }), // independent_contractor | sole_proprietor | llc | corporation
  taxDocuments: jsonb('tax_documents'), // Array<{ type: 'w9' | 'w8ben' | 'local_tax_form', url, uploadedAt }>
  misclassificationRisk: varchar('misclassification_risk', { length: 20 }), // low | medium | high
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const corContracts = pgTable('cor_contracts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  contractorId: uuid('contractor_id').references(() => corContractors.id, { onDelete: 'cascade' }).notNull(),
  contractType: varchar('contract_type', { length: 50 }).notNull(), // sow | msa | nda | ip_assignment
  title: varchar('title', { length: 255 }).notNull(),
  documentUrl: text('document_url'),
  status: varchar('status', { length: 50 }).default('draft').notNull(),
  scopeOfWork: text('scope_of_work'),
  deliverables: jsonb('deliverables'), // Array<{ title, dueDate, amount }>
  totalValue: integer('total_value'),
  currency: varchar('currency', { length: 10 }).default('USD').notNull(),
  startDate: date('start_date'),
  endDate: date('end_date'),
  signedAt: timestamp('signed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const corPayments = pgTable('cor_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  contractorId: uuid('contractor_id').references(() => corContractors.id, { onDelete: 'cascade' }).notNull(),
  contractId: uuid('contract_id').references(() => corContracts.id),
  amount: integer('amount').notNull(),
  currency: varchar('currency', { length: 10 }).notNull(),
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending | approved | processing | paid | failed
  periodStart: date('period_start'),
  periodEnd: date('period_end'),
  hoursWorked: real('hours_worked'),
  invoiceUrl: text('invoice_url'),
  paymentMethod: varchar('payment_method', { length: 50 }), // bank_transfer | paypal | wise | crypto
  paidAt: timestamp('paid_at'),
  approvedBy: uuid('approved_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// GLOBAL BENEFITS
// ============================================================

export const globalBenefitCategoryEnum = pgEnum('global_benefit_category', ['health', 'retirement', 'life_insurance', 'disability', 'wellness', 'meal_allowance', 'transportation', 'housing', 'education', 'childcare', 'statutory'])

export const globalBenefitPlans = pgTable('global_benefit_plans', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  category: globalBenefitCategoryEnum('category').notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 5 }).notNull(),
  provider: varchar('provider', { length: 255 }),
  description: text('description'),
  isStatutory: boolean('is_statutory').default(false).notNull(), // government-mandated benefit
  statutoryReference: text('statutory_reference'), // law/regulation reference
  costEmployee: integer('cost_employee').default(0),
  costEmployer: integer('cost_employer').default(0),
  currency: varchar('currency', { length: 10 }).notNull(),
  coverageDetails: jsonb('coverage_details'), // country-specific coverage structure
  eligibilityCriteria: jsonb('eligibility_criteria'), // { minTenure, employmentType, roles }
  isActive: boolean('is_active').default(true).notNull(),
  effectiveDate: date('effective_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const countryBenefitConfigs = pgTable('country_benefit_configs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  countryCode: varchar('country_code', { length: 5 }).notNull(),
  mandatoryBenefits: jsonb('mandatory_benefits'), // Array<{ name, category, description, employerCost, employeeCost }>
  supplementaryBenefits: jsonb('supplementary_benefits'), // same structure, optional additions
  taxImplications: jsonb('tax_implications'), // { deductible, taxable, thresholds }
  complianceNotes: text('compliance_notes'),
  lastReviewedAt: timestamp('last_reviewed_at'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const globalBenefitEnrollments = pgTable('global_benefit_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  planId: uuid('plan_id').references(() => globalBenefitPlans.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  country: varchar('country', { length: 100 }).notNull(),
  coverageLevel: varchar('coverage_level', { length: 50 }).default('employee_only'),
  dependentCount: integer('dependent_count').default(0),
  employeeContribution: integer('employee_contribution').default(0),
  employerContribution: integer('employer_contribution').default(0),
  currency: varchar('currency', { length: 10 }).notNull(),
  enrolledAt: date('enrolled_at').notNull(),
  terminatedAt: date('terminated_at'),
})

// ─── HR Cloud Agent Schema Additions ──────────────────────────────────────

export const i9Documents = pgTable('i9_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  i9FormId: uuid('i9_form_id').references(() => i9Forms.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  category: i9DocumentCategoryEnum('category').notNull(),
  documentTitle: varchar('document_title', { length: 255 }).notNull(),
  documentNumber: varchar('document_number', { length: 255 }),
  issuingAuthority: varchar('issuing_authority', { length: 255 }),
  expirationDate: date('expiration_date'),
  fileUrl: text('file_url'),
  isVerified: boolean('is_verified').default(false).notNull(),
  verifiedBy: uuid('verified_by').references(() => employees.id),
  verifiedAt: timestamp('verified_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const peoEmployeeEnrollments = pgTable('peo_employee_enrollments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  peoConfigId: uuid('peo_config_id').references(() => peoConfigurations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  status: coEmploymentStatusEnum('status').default('pending').notNull(),
  workState: varchar('work_state', { length: 50 }),
  workCountry: varchar('work_country', { length: 100 }).default('US').notNull(),
  workersCompCode: varchar('workers_comp_code', { length: 20 }),
  workersCompDescription: varchar('workers_comp_description', { length: 255 }),
  enrolledAt: timestamp('enrolled_at'),
  terminatedAt: timestamp('terminated_at'),
  terminationReason: text('termination_reason'),
  peoEmployeeId: varchar('peo_employee_id', { length: 100 }),
  syncStatus: varchar('sync_status', { length: 50 }).default('pending'),
  lastSyncAt: timestamp('last_sync_at'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const peoWorkersCompCodes = pgTable('peo_workers_comp_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  peoConfigId: uuid('peo_config_id').references(() => peoConfigurations.id, { onDelete: 'cascade' }).notNull(),
  classCode: varchar('class_code', { length: 20 }).notNull(),
  description: varchar('description', { length: 500 }).notNull(),
  state: varchar('state', { length: 50 }).notNull(),
  rate: real('rate').notNull(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  isActive: boolean('is_active').default(true).notNull(),
})

export const peoInvoices = pgTable('peo_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  peoConfigId: uuid('peo_config_id').references(() => peoConfigurations.id, { onDelete: 'cascade' }).notNull(),
  invoiceNumber: varchar('invoice_number', { length: 100 }).notNull(),
  period: varchar('period', { length: 50 }).notNull(),
  adminFees: real('admin_fees').notNull(),
  workersCompPremium: real('workers_comp_premium').default(0).notNull(),
  benefitsCost: real('benefits_cost').default(0).notNull(),
  payrollTaxes: real('payroll_taxes').default(0).notNull(),
  totalAmount: real('total_amount').notNull(),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  dueDate: date('due_date'),
  paidAt: timestamp('paid_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const sandboxAccessLog = pgTable('sandbox_access_log', {
  id: uuid('id').defaultRandom().primaryKey(),
  sandboxId: uuid('sandbox_id').references(() => sandboxEnvironments.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id).notNull(),
  action: varchar('action', { length: 50 }).notNull(),
  details: text('details'),
  ipAddress: varchar('ip_address', { length: 50 }),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
})

export const chatChannelMembers = pgTable('chat_channel_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').references(() => chatChannels.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  role: varchar('role', { length: 50 }).default('member').notNull(),
  isMuted: boolean('is_muted').default(false).notNull(),
  lastReadAt: timestamp('last_read_at'),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
})

export const chatReactions = pgTable('chat_reactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  messageId: uuid('message_id').references(() => chatMessages.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }).notNull(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  emoji: varchar('emoji', { length: 50 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// Workers' Compensation
// ============================================================

export const workersCompPolicies = pgTable('workers_comp_policies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  carrier: varchar('carrier', { length: 255 }),
  policyNumber: varchar('policy_number', { length: 100 }),
  status: varchar('status', { length: 20 }).default('active').notNull(),
  effectiveDate: date('effective_date'),
  expiryDate: date('expiry_date'),
  premium: integer('premium'),
  coveredEmployees: integer('covered_employees'),
  classCodes: jsonb('class_codes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workersCompClaims = pgTable('workers_comp_claims', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  policyId: uuid('policy_id').references(() => workersCompPolicies.id, { onDelete: 'cascade' }),
  employeeName: varchar('employee_name', { length: 255 }),
  incidentDate: date('incident_date'),
  description: text('description'),
  injuryType: varchar('injury_type', { length: 100 }),
  bodyPart: varchar('body_part', { length: 100 }),
  status: varchar('status', { length: 20 }).default('open').notNull(),
  reserveAmount: integer('reserve_amount'),
  paidAmount: integer('paid_amount').default(0),
  filedDate: date('filed_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workersCompClassCodes = pgTable('workers_comp_class_codes', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  code: varchar('code', { length: 20 }).notNull(),
  description: varchar('description', { length: 500 }),
  rate: real('rate'),
  employeeCount: integer('employee_count'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const workersCompAudits = pgTable('workers_comp_audits', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  auditDate: date('audit_date'),
  period: varchar('period', { length: 100 }),
  auditor: varchar('auditor', { length: 255 }),
  status: varchar('status', { length: 20 }).default('pending').notNull(),
  findings: text('findings'),
  adjustmentAmount: integer('adjustment_amount'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// EQUITY GRANTS
// ============================================================

export const equityGrantTypeEnum = pgEnum('equity_grant_type', ['RSU', 'stock_option', 'phantom', 'SAR', 'ESPP'])
export const equityGrantStatusEnum = pgEnum('equity_grant_status', ['active', 'fully_vested', 'cancelled', 'expired'])

export const equityGrants = pgTable('equity_grants', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  employeeId: uuid('employee_id').references(() => employees.id, { onDelete: 'cascade' }),
  grantType: equityGrantTypeEnum('grant_type').default('RSU').notNull(),
  shares: integer('shares').default(0).notNull(),
  strikePrice: real('strike_price').default(0),
  vestingSchedule: varchar('vesting_schedule', { length: 255 }),
  vestedShares: integer('vested_shares').default(0),
  currentValue: integer('current_value').default(0),
  grantDate: date('grant_date'),
  status: equityGrantStatusEnum('status').default('active').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// Dynamic Groups
// ============================================================

export const dynamicGroups = pgTable('dynamic_groups', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 20 }).default('dynamic').notNull(),
  rule: jsonb('rule'),
  memberCount: integer('member_count').default(0),
  createdBy: uuid('created_by').references(() => employees.id),
  lastSyncedAt: timestamp('last_synced_at'),
  modules: jsonb('modules'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// ACADEMIES: External Learning Academies
// ============================================================

export const academyStatusEnum = pgEnum('academy_status', ['draft', 'active', 'archived'])
export const academyEnrollmentTypeEnum = pgEnum('academy_enrollment_type', ['public', 'private'])
export const cohortStatusEnum = pgEnum('cohort_status', ['upcoming', 'active', 'completed'])
export const academyParticipantStatusEnum = pgEnum('academy_participant_status', ['active', 'inactive', 'completed', 'dropped'])
export const academySessionTypeEnum = pgEnum('academy_session_type', ['webinar', 'workshop', 'mentoring', 'lecture', 'qa'])
export const academyAssignmentStatusEnum = pgEnum('academy_assignment_status', ['pending', 'submitted', 'graded', 'overdue'])
export const academyCommTypeEnum = pgEnum('academy_comm_type', ['broadcast', 'automated'])
export const academyCommStatusEnum = pgEnum('academy_comm_status', ['sent', 'scheduled', 'failed', 'draft'])
export const academyCertStatusEnum = pgEnum('academy_cert_status', ['earned', 'in_progress', 'revoked'])

// Core academy entity — white-label learning programs for external participants
export const academies = pgTable('academies', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 500 }).notNull(),
  description: text('description'),
  slug: varchar('slug', { length: 200 }).notNull(), // URL-friendly, unique per org
  logoUrl: text('logo_url'),
  brandColor: varchar('brand_color', { length: 20 }).default('#2563eb').notNull(),
  welcomeMessage: text('welcome_message'),
  enrollmentType: academyEnrollmentTypeEnum('enrollment_type').default('private').notNull(),
  status: academyStatusEnum('status').default('draft').notNull(),
  communityEnabled: boolean('community_enabled').default(true).notNull(),
  languages: jsonb('languages').default('["en"]').notNull(), // string[]
  completionRules: jsonb('completion_rules'), // { min_courses, require_assessment, require_certificate }
  curriculumCourseIds: jsonb('curriculum_course_ids').default('[]').notNull(), // string[] — FK to courses
  curriculumPathIds: jsonb('curriculum_path_ids').default('[]').notNull(), // string[] — FK to learning_paths
  createdBy: uuid('created_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Cohorts within an academy — time-bound groups of participants
export const academyCohorts = pgTable('academy_cohorts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  startDate: date('start_date').notNull(),
  endDate: date('end_date').notNull(),
  facilitatorName: varchar('facilitator_name', { length: 255 }),
  facilitatorEmail: varchar('facilitator_email', { length: 255 }),
  maxParticipants: integer('max_participants'),
  status: cohortStatusEnum('status').default('upcoming').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// External participants — separate from employees, with their own auth
export const academyParticipants = pgTable('academy_participants', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  cohortId: uuid('cohort_id').references(() => academyCohorts.id),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  avatarUrl: text('avatar_url'),
  businessName: varchar('business_name', { length: 255 }),
  country: varchar('country', { length: 100 }),
  language: varchar('language', { length: 10 }).default('en').notNull(),
  passwordHash: text('password_hash'), // for participant portal auth
  status: academyParticipantStatusEnum('status').default('active').notNull(),
  progress: integer('progress').default(0).notNull(), // 0-100 overall
  enrolledDate: date('enrolled_date').defaultNow().notNull(),
  lastActiveAt: timestamp('last_active_at'),
  invitationToken: varchar('invitation_token', { length: 500 }),
  invitationSentAt: timestamp('invitation_sent_at'),
  emailVerified: boolean('email_verified').default(false).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Join table: which courses are assigned to which academy (with ordering)
export const academyCourses = pgTable('academy_courses', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  courseId: uuid('course_id').references(() => courses.id, { onDelete: 'cascade' }).notNull(),
  moduleNumber: integer('module_number').default(1).notNull(), // ordering within academy
  isRequired: boolean('is_required').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Participant progress on individual courses within an academy
export const academyParticipantProgress = pgTable('academy_participant_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  academyCourseId: uuid('academy_course_id').references(() => academyCourses.id, { onDelete: 'cascade' }).notNull(),
  status: blockProgressStatusEnum('status').default('not_started').notNull(),
  progress: integer('progress').default(0).notNull(), // 0-100
  score: integer('score'), // assessment score if applicable
  timeSpentMinutes: integer('time_spent_minutes').default(0).notNull(),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Live sessions — webinars, workshops, mentoring within an academy
export const academySessions = pgTable('academy_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  cohortId: uuid('cohort_id').references(() => academyCohorts.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: academySessionTypeEnum('type').default('webinar').notNull(),
  scheduledDate: date('scheduled_date').notNull(),
  scheduledTime: varchar('scheduled_time', { length: 50 }), // e.g., "10:00 AM WAT"
  durationMinutes: integer('duration_minutes').default(60).notNull(),
  instructor: varchar('instructor', { length: 255 }),
  meetingUrl: text('meeting_url'),
  recordingUrl: text('recording_url'),
  maxAttendees: integer('max_attendees'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// RSVP tracking for sessions
export const academySessionRsvps = pgTable('academy_session_rsvps', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  sessionId: uuid('session_id').references(() => academySessions.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  attended: boolean('attended').default(false).notNull(),
  rsvpdAt: timestamp('rsvpd_at').defaultNow().notNull(),
})

// Assignments — graded work within an academy
export const academyAssignments = pgTable('academy_assignments', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  academyCourseId: uuid('academy_course_id').references(() => academyCourses.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  dueDate: date('due_date'),
  maxScore: integer('max_score').default(100).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Participant assignment submissions
export const academyAssignmentSubmissions = pgTable('academy_assignment_submissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  assignmentId: uuid('assignment_id').references(() => academyAssignments.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  status: academyAssignmentStatusEnum('status').default('pending').notNull(),
  submissionUrl: text('submission_url'),
  submissionText: text('submission_text'),
  score: integer('score'),
  feedback: text('feedback'),
  submittedAt: timestamp('submitted_at'),
  gradedAt: timestamp('graded_at'),
  gradedBy: uuid('graded_by').references(() => employees.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Community discussion posts
export const academyDiscussions = pgTable('academy_discussions', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id'), // self-ref for replies, FK managed at DB level
  content: text('content').notNull(),
  moduleTag: varchar('module_tag', { length: 255 }),
  isPinned: boolean('is_pinned').default(false).notNull(),
  isFacilitator: boolean('is_facilitator').default(false).notNull(), // posted by facilitator/admin
  facilitatorName: varchar('facilitator_name', { length: 255 }), // only if isFacilitator
  replyCount: integer('reply_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Resources — downloadable files and links
export const academyResources = pgTable('academy_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  academyCourseId: uuid('academy_course_id').references(() => academyCourses.id),
  title: varchar('title', { length: 500 }).notNull(),
  description: text('description'),
  type: varchar('type', { length: 50 }).default('pdf').notNull(), // pdf, link, video, document
  url: text('url'),
  fileSize: integer('file_size'), // bytes
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Certificates earned by participants
export const academyCertificates = pgTable('academy_certificates', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 500 }).notNull(), // e.g., "SME Academy Certificate of Completion"
  certificateNumber: varchar('certificate_number', { length: 100 }).notNull(),
  certificateUrl: text('certificate_url'), // PDF download URL
  status: academyCertStatusEnum('status').default('in_progress').notNull(),
  requirements: jsonb('requirements'), // { label: string, met: boolean }[]
  issuedAt: timestamp('issued_at'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Communication logs — broadcast emails, automated triggers
export const academyCommunications = pgTable('academy_communications', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  type: academyCommTypeEnum('type').default('broadcast').notNull(),
  triggerName: varchar('trigger_name', { length: 255 }), // e.g., "Enrollment Confirmation"
  subject: varchar('subject', { length: 500 }).notNull(),
  body: text('body'),
  recipientCount: integer('recipient_count').default(0).notNull(),
  status: academyCommStatusEnum('status').default('draft').notNull(),
  scheduledAt: timestamp('scheduled_at'),
  sentAt: timestamp('sent_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Automated communication triggers — templates for auto-sends
export const academyCommTriggers = pgTable('academy_comm_triggers', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(), // e.g., "Enrollment Confirmation"
  triggerEvent: varchar('trigger_event', { length: 100 }).notNull(), // enrollment, session_reminder_24h, etc.
  subjectTemplate: varchar('subject_template', { length: 500 }).notNull(),
  bodyTemplate: text('body_template'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// GAMIFICATION — Badges, Points, Leaderboard
// ============================================================

// Badge definitions per academy
export const academyBadges = pgTable('academy_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  iconUrl: text('icon_url'),
  iconEmoji: varchar('icon_emoji', { length: 10 }),
  criteria: jsonb('criteria'), // { type: 'course_complete', courseId: '...' } or { type: 'points_threshold', points: 100 }
  pointsAwarded: integer('points_awarded').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// Badges earned by participants
export const academyParticipantBadges = pgTable('academy_participant_badges', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  badgeId: uuid('badge_id').references(() => academyBadges.id, { onDelete: 'cascade' }).notNull(),
  earnedAt: timestamp('earned_at').defaultNow().notNull(),
})

// Point transactions — immutable ledger of all points earned
export const academyPoints = pgTable('academy_points', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  points: integer('points').notNull(),
  reason: varchar('reason', { length: 255 }).notNull(), // course_completed, assignment_graded, session_attended, badge_earned, etc.
  entityId: uuid('entity_id'), // reference to course/assignment/session that earned points
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// ACADEMY WEBHOOKS
// ============================================================

export const academyWebhookStatusEnum = pgEnum('academy_webhook_status', ['active', 'inactive', 'failed'])

export const academyWebhooks = pgTable('academy_webhooks', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  url: text('url').notNull(),
  secret: varchar('secret', { length: 500 }).notNull(),
  events: jsonb('events').default('[]').notNull(), // array of subscribed event names
  status: academyWebhookStatusEnum('status').default('active').notNull(),
  lastTriggeredAt: timestamp('last_triggered_at'),
  failCount: integer('fail_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const academyWebhookLogs = pgTable('academy_webhook_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  webhookId: uuid('webhook_id').references(() => academyWebhooks.id, { onDelete: 'cascade' }).notNull(),
  event: varchar('event', { length: 100 }).notNull(),
  payload: jsonb('payload'),
  responseStatus: integer('response_status'),
  responseBody: text('response_body'),
  success: boolean('success').default(false).notNull(),
  attemptNumber: integer('attempt_number').default(1).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// ============================================================
// ACADEMY CUSTOM DOMAINS (White-Label)
// ============================================================

export const academyDomainStatusEnum = pgEnum('academy_domain_status', ['pending', 'verifying', 'active', 'failed', 'expired'])

export const academyCustomDomains = pgTable('academy_custom_domains', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  domain: varchar('domain', { length: 500 }).notNull(), // e.g., academy.ecobank.com
  status: academyDomainStatusEnum('status').default('pending').notNull(),
  sslStatus: varchar('ssl_status', { length: 50 }).default('pending').notNull(),
  verificationToken: varchar('verification_token', { length: 500 }),
  verificationMethod: varchar('verification_method', { length: 50 }).default('cname').notNull(), // cname or txt
  verifiedAt: timestamp('verified_at'),
  sslIssuedAt: timestamp('ssl_issued_at'),
  sslExpiresAt: timestamp('ssl_expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// ACADEMY SCORM PACKAGES
// ============================================================

export const academyScormPackages = pgTable('academy_scorm_packages', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  academyCourseId: uuid('academy_course_id').references(() => academyCourses.id),
  title: varchar('title', { length: 500 }).notNull(),
  version: varchar('version', { length: 50 }).default('1.2').notNull(), // SCORM 1.2 or 2004
  packageUrl: text('package_url').notNull(),
  launchUrl: text('launch_url'), // relative path within package to launch file
  manifestData: jsonb('manifest_data'), // parsed imsmanifest.xml
  status: varchar('status', { length: 50 }).default('processing').notNull(), // processing, ready, error
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

// SCORM attempt tracking — CMI data model for learner progress
export const academyScormAttempts = pgTable('academy_scorm_attempts', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  packageId: uuid('package_id').references(() => academyScormPackages.id, { onDelete: 'cascade' }).notNull(),
  participantId: uuid('participant_id').references(() => academyParticipants.id, { onDelete: 'cascade' }).notNull(),
  cmiData: jsonb('cmi_data').default('{}').notNull(), // SCORM CMI data model
  score: integer('score'),
  status: varchar('status', { length: 50 }).default('not attempted').notNull(),
  timeSpent: integer('time_spent').default(0).notNull(), // seconds
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// ACADEMY TRANSLATIONS — multi-language content
// ============================================================

export const academyTranslations = pgTable('academy_translations', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  academyId: uuid('academy_id').references(() => academies.id, { onDelete: 'cascade' }).notNull(),
  entityType: varchar('entity_type', { length: 50 }).notNull(), // academy, course, session, assignment, resource
  entityId: uuid('entity_id').notNull(),
  field: varchar('field', { length: 100 }).notNull(), // name, description, title, body, etc.
  language: varchar('language', { length: 10 }).notNull(), // en, fr, es, pt, ar, sw
  value: text('value').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// ============================================================
// JOURNAL ENTRIES — persisted GL postings
// ============================================================

export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  orgId: uuid('org_id').references(() => organizations.id, { onDelete: 'cascade' }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'payroll' | 'expense' | 'manual'
  reference: varchar('reference', { length: 100 }), // e.g., 'PAY-{runId}', 'EXP-{reportId}'
  description: text('description'),
  date: date('date').notNull(),
  totalDebitCents: integer('total_debit_cents').notNull(),
  totalCreditCents: integer('total_credit_cents').notNull(),
  currency: varchar('currency', { length: 10 }).notNull().default('USD'),
  status: varchar('status', { length: 20 }).notNull().default('posted'), // draft | posted | reversed
  sourceEntityType: varchar('source_entity_type', { length: 50 }), // 'payroll_run' | 'expense_report'
  sourceEntityId: uuid('source_entity_id'),
  postedBy: uuid('posted_by'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const journalEntryLines = pgTable('journal_entry_lines', {
  id: uuid('id').defaultRandom().primaryKey(),
  journalEntryId: uuid('journal_entry_id').references(() => journalEntries.id, { onDelete: 'cascade' }).notNull(),
  accountCode: varchar('account_code', { length: 20 }).notNull(),
  accountName: varchar('account_name', { length: 100 }).notNull(),
  costCenter: varchar('cost_center', { length: 50 }),
  departmentId: uuid('department_id'),
  debitCents: integer('debit_cents').notNull().default(0),
  creditCents: integer('credit_cents').notNull().default(0),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})