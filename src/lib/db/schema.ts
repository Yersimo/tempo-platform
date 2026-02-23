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
export const benefitTypeEnum = pgEnum('benefit_type', ['medical', 'dental', 'vision', 'retirement', 'life', 'disability', 'wellness', 'other'])
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
  runDate: timestamp('run_date'),
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
