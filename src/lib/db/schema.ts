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
