// Core types for the Tempo platform

export type OrgPlan = 'free' | 'pro' | 'enterprise'
export type MemberRole = 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
export type MemberStatus = 'active' | 'invited' | 'deactivated'

export interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  plan: OrgPlan
  industry: string | null
  size: string | null
  country: string | null
  created_at: string
}

export interface Profile {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  phone: string | null
  created_at: string
}

export interface OrgMember {
  id: string
  org_id: string
  user_id: string
  role: MemberRole
  department_id: string | null
  job_title: string | null
  level: string | null
  hire_date: string | null
  manager_id: string | null
  country: string | null
  status: MemberStatus
  salary: number | null
  currency: string | null
  created_at: string
  profile?: Profile
}

export interface Department {
  id: string
  org_id: string
  name: string
  parent_id: string | null
  head_id: string | null
  created_at: string
}

export interface AuditLog {
  id: string
  org_id: string
  user_id: string
  action: string
  entity_type: string
  entity_id: string
  old_data: Record<string, unknown> | null
  new_data: Record<string, unknown> | null
  ip_address: string | null
  created_at: string
}

// Performance
export type GoalStatus = 'draft' | 'active' | 'completed' | 'cancelled'
export type GoalType = 'okr' | 'kpi'
export type ReviewType = 'self' | 'manager' | 'peer' | '360'
export type ReviewStatus = 'pending' | 'in_progress' | 'submitted' | 'calibrated'
export type CycleStatus = 'draft' | 'active' | 'calibration' | 'closed'
export type CycleType = 'annual' | 'midyear' | 'probation' | '360'

export interface Goal {
  id: string
  org_id: string
  employee_id: string
  title: string
  description: string | null
  type: GoalType
  weight: number
  status: GoalStatus
  progress: number
  parent_goal_id: string | null
  cycle_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  employee?: OrgMember
}

export interface ReviewCycle {
  id: string
  org_id: string
  name: string
  type: CycleType
  status: CycleStatus
  start_date: string
  end_date: string
  created_at: string
}

export interface Review {
  id: string
  org_id: string
  cycle_id: string
  employee_id: string
  reviewer_id: string
  type: ReviewType
  status: ReviewStatus
  overall_rating: number | null
  ratings: Record<string, number> | null
  comments: string | null
  submitted_at: string | null
  created_at: string
  employee?: OrgMember
  reviewer?: OrgMember
}

export interface Feedback {
  id: string
  org_id: string
  from_id: string
  to_id: string
  type: 'recognition' | 'feedback' | 'checkin'
  content: string
  is_public: boolean
  created_at: string
  from_member?: OrgMember
  to_member?: OrgMember
}

export interface Calibration {
  id: string
  org_id: string
  cycle_id: string
  employee_id: string
  performance_rating: number
  potential_rating: number
  nine_box_position: string
  calibrated_by: string
  notes: string | null
  created_at: string
}

// Compensation
export interface CompBand {
  id: string
  org_id: string
  role_title: string
  level: string
  country: string | null
  min_salary: number
  mid_salary: number
  max_salary: number
  currency: string
  p25: number | null
  p50: number | null
  p75: number | null
  effective_date: string
}

export interface SalaryReview {
  id: string
  org_id: string
  employee_id: string
  proposed_by: string
  current_salary: number
  proposed_salary: number
  currency: string
  justification: string | null
  status: 'draft' | 'pending_approval' | 'approved' | 'rejected'
  approved_by: string | null
  cycle: string | null
  created_at: string
  employee?: OrgMember
}

// Learning
export interface Course {
  id: string
  org_id: string
  title: string
  description: string | null
  category: string
  duration_hours: number
  format: 'online' | 'classroom' | 'blended'
  level: 'beginner' | 'intermediate' | 'advanced'
  is_mandatory: boolean
  created_at: string
}

export interface Enrollment {
  id: string
  org_id: string
  employee_id: string
  course_id: string
  status: 'enrolled' | 'in_progress' | 'completed' | 'dropped'
  progress: number
  enrolled_at: string
  completed_at: string | null
  course?: Course
}

export interface Skill {
  id: string
  org_id: string
  name: string
  category: string
}

// Engagement
export interface Survey {
  id: string
  org_id: string
  title: string
  type: 'annual' | 'pulse' | 'enps'
  status: 'draft' | 'active' | 'closed'
  start_date: string
  end_date: string
  anonymous: boolean
  created_at: string
}

export interface SurveyQuestion {
  id: string
  survey_id: string
  text: string
  type: 'rating' | 'text' | 'multiple_choice' | 'enps'
  options: string[] | null
  order: number
}

// Mentoring
export interface MentoringProgram {
  id: string
  org_id: string
  title: string
  type: 'one_on_one' | 'reverse' | 'group'
  status: 'active' | 'completed'
  duration_months: number
  start_date: string
  created_at: string
}

export interface MentoringPair {
  id: string
  org_id: string
  program_id: string
  mentor_id: string
  mentee_id: string
  status: 'matched' | 'active' | 'completed'
  match_score: number | null
  started_at: string | null
  mentor?: OrgMember
  mentee?: OrgMember
}

// Payroll
export interface PayrollRun {
  id: string
  org_id: string
  period: string
  status: 'draft' | 'processing' | 'approved' | 'paid'
  total_gross: number
  total_net: number
  total_deductions: number
  currency: string
  employee_count: number
  run_date: string | null
  created_at: string
}

export interface Payslip {
  id: string
  org_id: string
  payroll_run_id: string
  employee_id: string
  gross_pay: number
  net_pay: number
  deductions: Record<string, number>
  currency: string
  period: string
  created_at: string
}

// Time & Attendance
export interface TimeEntry {
  id: string
  org_id: string
  employee_id: string
  date: string
  clock_in: string | null
  clock_out: string | null
  hours_worked: number
  status: 'pending' | 'approved' | 'rejected'
  notes: string | null
}

export interface LeaveRequest {
  id: string
  org_id: string
  employee_id: string
  type: 'annual' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'unpaid'
  start_date: string
  end_date: string
  days: number
  status: 'pending' | 'approved' | 'rejected'
  reason: string | null
  approved_by: string | null
  created_at: string
  employee?: OrgMember
}

// Benefits
export interface BenefitPlan {
  id: string
  org_id: string
  name: string
  type: 'medical' | 'dental' | 'vision' | 'retirement' | 'life' | 'other'
  provider: string
  cost_employee: number
  cost_employer: number
  currency: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface BenefitEnrollment {
  id: string
  org_id: string
  employee_id: string
  plan_id: string
  status: 'active' | 'pending' | 'cancelled'
  enrolled_at: string
  plan?: BenefitPlan
}

// Expense
export interface ExpenseReport {
  id: string
  org_id: string
  employee_id: string
  title: string
  total_amount: number
  currency: string
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'reimbursed'
  submitted_at: string | null
  approved_by: string | null
  created_at: string
  items?: ExpenseItem[]
  employee?: OrgMember
}

export interface ExpenseItem {
  id: string
  report_id: string
  category: string
  description: string
  amount: number
  currency: string
  date: string
  receipt_url: string | null
}

// Recruiting
export type JobStatus = 'draft' | 'open' | 'closed' | 'filled'
export type ApplicationStatus = 'new' | 'screening' | 'interview' | 'offer' | 'hired' | 'rejected'

export interface JobPosting {
  id: string
  org_id: string
  title: string
  department_id: string | null
  location: string | null
  type: 'full_time' | 'part_time' | 'contract'
  description: string | null
  requirements: string | null
  salary_min: number | null
  salary_max: number | null
  currency: string | null
  status: JobStatus
  created_at: string
  department?: Department
  application_count?: number
}

export interface Application {
  id: string
  org_id: string
  job_id: string
  candidate_name: string
  candidate_email: string
  resume_url: string | null
  status: ApplicationStatus
  stage: string
  rating: number | null
  notes: string | null
  applied_at: string
  job?: JobPosting
}

// IT / Device Management
export interface Device {
  id: string
  org_id: string
  type: 'laptop' | 'phone' | 'tablet' | 'monitor' | 'other'
  brand: string
  model: string
  serial_number: string
  status: 'available' | 'assigned' | 'maintenance' | 'retired'
  assigned_to: string | null
  purchase_date: string | null
  warranty_end: string | null
  created_at: string
  assignee?: OrgMember
}

export interface SoftwareLicense {
  id: string
  org_id: string
  name: string
  vendor: string
  total_licenses: number
  used_licenses: number
  cost_per_license: number
  currency: string
  renewal_date: string | null
  created_at: string
}

export interface ITRequest {
  id: string
  org_id: string
  requester_id: string
  type: 'hardware' | 'software' | 'access' | 'support'
  title: string
  description: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  assigned_to: string | null
  created_at: string
  requester?: OrgMember
}

// Finance
export interface Invoice {
  id: string
  org_id: string
  invoice_number: string
  vendor_id: string | null
  amount: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  issued_date: string
  description: string | null
  created_at: string
  vendor?: Vendor
}

export interface Budget {
  id: string
  org_id: string
  name: string
  department_id: string | null
  total_amount: number
  spent_amount: number
  currency: string
  fiscal_year: string
  status: 'active' | 'closed'
  created_at: string
  department?: Department
}

export interface Vendor {
  id: string
  org_id: string
  name: string
  contact_email: string | null
  contact_phone: string | null
  category: string | null
  status: 'active' | 'inactive'
  created_at: string
}

// Analytics
export interface DashboardMetrics {
  headcount: number
  active_employees: number
  new_hires_this_month: number
  attrition_rate: number
  avg_compa_ratio: number
  review_completion: number
  enps_score: number
  active_learners: number
  open_positions: number
  pending_expenses: number
  active_mentoring_pairs: number
  total_payroll: number
}

// ============================================================
// PHASE 3: PROJECT MANAGEMENT
// ============================================================

export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical'

export interface Project {
  id: string
  org_id: string
  title: string
  description: string | null
  status: ProjectStatus
  owner_id: string | null
  start_date: string | null
  end_date: string | null
  budget: number | null
  currency: string
  created_at: string
  updated_at: string | null
  owner?: OrgMember
}

export interface Milestone {
  id: string
  org_id: string
  project_id: string
  title: string
  due_date: string | null
  status: TaskStatus
  created_at: string
}

export interface ProjectTask {
  id: string
  org_id: string
  project_id: string
  milestone_id: string | null
  title: string
  description: string | null
  status: TaskStatus
  priority: TaskPriority
  assignee_id: string | null
  due_date: string | null
  estimated_hours: number | null
  actual_hours: number | null
  created_at: string
  updated_at: string | null
  assignee?: OrgMember
}

export interface TaskDependency {
  id: string
  task_id: string
  depends_on_task_id: string
}

// ============================================================
// PHASE 3: STRATEGY EXECUTION
// ============================================================

export type ObjectiveStatus = 'draft' | 'active' | 'completed' | 'archived'
export type InitiativeStatus = 'proposed' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
export type KPIFrequency = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual'

export interface StrategicObjective {
  id: string
  org_id: string
  title: string
  description: string | null
  status: ObjectiveStatus
  owner_id: string | null
  period: string | null
  progress: number
  created_at: string
  updated_at: string | null
  owner?: OrgMember
  key_results?: KeyResult[]
}

export interface KeyResult {
  id: string
  org_id: string
  objective_id: string
  title: string
  target_value: number
  current_value: number
  unit: string | null
  owner_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string | null
}

export interface Initiative {
  id: string
  org_id: string
  objective_id: string | null
  title: string
  description: string | null
  status: InitiativeStatus
  owner_id: string | null
  start_date: string | null
  end_date: string | null
  progress: number
  budget: number | null
  currency: string
  created_at: string
  updated_at: string | null
}

export interface KPIDefinition {
  id: string
  org_id: string
  name: string
  description: string | null
  unit: string | null
  target_value: number | null
  frequency: KPIFrequency
  department_id: string | null
  owner_id: string | null
  created_at: string
}

export interface KPIMeasurement {
  id: string
  kpi_id: string
  value: number
  period: string
  recorded_at: string
  notes: string | null
}

// ============================================================
// PHASE 3: WORKFLOW STUDIO
// ============================================================

export type WorkflowStatus = 'draft' | 'active' | 'paused' | 'archived'
export type StepType = 'action' | 'condition' | 'delay' | 'notification' | 'approval'
export type TriggerType = 'schedule' | 'event' | 'manual' | 'webhook'
export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled'

export interface Workflow {
  id: string
  org_id: string
  title: string
  description: string | null
  status: WorkflowStatus
  trigger_type: TriggerType
  trigger_config: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string | null
  steps?: WorkflowStep[]
}

export interface WorkflowStep {
  id: string
  workflow_id: string
  step_type: StepType
  title: string
  config: Record<string, unknown> | null
  position: number
  next_step_id: string | null
  created_at: string
}

export interface WorkflowRun {
  id: string
  org_id: string
  workflow_id: string
  status: RunStatus
  started_at: string
  completed_at: string | null
  triggered_by: string | null
  context: Record<string, unknown> | null
}

export interface WorkflowTemplate {
  id: string
  org_id: string
  title: string
  description: string | null
  category: string | null
  config: Record<string, unknown> | null
  created_at: string
}
