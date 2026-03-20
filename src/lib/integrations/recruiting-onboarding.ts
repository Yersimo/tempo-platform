/**
 * Recruiting → Onboarding Integration
 *
 * When a candidate is hired (status changes to 'hired'), auto-creates
 * an onboarding checklist with IT, HR, manager, and department-specific tasks.
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Onboarding checklist item to be created */
export interface OnboardingChecklistItem {
  title: string
  description: string
  category: 'it_setup' | 'hr' | 'manager' | 'department' | 'compliance'
  priority: 'critical' | 'high' | 'medium' | 'low'
  due_days_after_start: number
  assignee_type: 'it' | 'hr' | 'manager' | 'employee' | 'department_lead'
}

/** Result of generating an onboarding checklist */
export interface OnboardingChecklistResult {
  employeeName: string
  departmentId: string
  jobTitle: string
  tasks: OnboardingChecklistItem[]
  totalTasks: number
  byCategory: Record<string, number>
}

/** Store slice needed for recruiting→onboarding operations */
export interface RecruitingOnboardingStoreSlice {
  departments: Array<{ id: string; name: string }>
  addOffboardingChecklistItem?: (data: Record<string, unknown>) => void
  addPreboardingTask?: (data: Record<string, unknown>) => void
  addOnboardingProcess?: (data: Record<string, unknown>) => void
  addOffboardingTask?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Department-specific task templates
// ---------------------------------------------------------------------------

const DEPARTMENT_TASKS: Record<string, OnboardingChecklistItem[]> = {
  engineering: [
    { title: 'Set up development environment', description: 'Install IDE, CLI tools, and configure local dev environment', category: 'department', priority: 'high', due_days_after_start: 1, assignee_type: 'employee' },
    { title: 'Grant repository access', description: 'Add to GitHub/GitLab org and relevant repositories', category: 'department', priority: 'critical', due_days_after_start: 0, assignee_type: 'department_lead' },
    { title: 'Review coding standards', description: 'Read through the team coding standards and PR review guidelines', category: 'department', priority: 'medium', due_days_after_start: 3, assignee_type: 'employee' },
    { title: 'Complete codebase walkthrough', description: 'Schedule architecture walkthrough with tech lead', category: 'department', priority: 'high', due_days_after_start: 5, assignee_type: 'manager' },
  ],
  product: [
    { title: 'Access product analytics tools', description: 'Set up Amplitude, Mixpanel, or equivalent analytics access', category: 'department', priority: 'high', due_days_after_start: 1, assignee_type: 'it' },
    { title: 'Review product roadmap', description: 'Walk through current product roadmap and quarterly OKRs', category: 'department', priority: 'high', due_days_after_start: 3, assignee_type: 'manager' },
    { title: 'Meet key stakeholders', description: 'Schedule intro meetings with engineering, design, and marketing leads', category: 'department', priority: 'medium', due_days_after_start: 5, assignee_type: 'employee' },
  ],
  sales: [
    { title: 'CRM access and training', description: 'Set up Salesforce/HubSpot access and complete CRM training', category: 'department', priority: 'critical', due_days_after_start: 1, assignee_type: 'it' },
    { title: 'Review sales playbook', description: 'Read through the sales playbook and objection handling guide', category: 'department', priority: 'high', due_days_after_start: 3, assignee_type: 'employee' },
    { title: 'Shadow senior rep', description: 'Shadow a senior sales rep for at least 3 client calls', category: 'department', priority: 'high', due_days_after_start: 5, assignee_type: 'manager' },
  ],
  finance: [
    { title: 'ERP system access', description: 'Grant access to ERP and financial reporting tools', category: 'department', priority: 'critical', due_days_after_start: 1, assignee_type: 'it' },
    { title: 'Review financial policies', description: 'Review expense policies, approval thresholds, and audit procedures', category: 'department', priority: 'high', due_days_after_start: 3, assignee_type: 'employee' },
  ],
  hr: [
    { title: 'HRIS admin access', description: 'Set up admin access to HR information system', category: 'department', priority: 'critical', due_days_after_start: 1, assignee_type: 'it' },
    { title: 'Review HR policies', description: 'Complete review of all company HR policies and procedures', category: 'department', priority: 'high', due_days_after_start: 5, assignee_type: 'employee' },
  ],
  marketing: [
    { title: 'Brand guidelines review', description: 'Review brand guidelines, tone of voice, and style guide', category: 'department', priority: 'high', due_days_after_start: 2, assignee_type: 'employee' },
    { title: 'Marketing tools access', description: 'Set up access to marketing automation, social media, and analytics tools', category: 'department', priority: 'high', due_days_after_start: 1, assignee_type: 'it' },
  ],
}

// ---------------------------------------------------------------------------
// Core IT setup tasks (universal)
// ---------------------------------------------------------------------------

const IT_SETUP_TASKS: OnboardingChecklistItem[] = [
  { title: 'Provision laptop/workstation', description: 'Order and configure laptop or desktop based on role requirements', category: 'it_setup', priority: 'critical', due_days_after_start: -3, assignee_type: 'it' },
  { title: 'Create email account', description: 'Create company email account and add to relevant distribution lists', category: 'it_setup', priority: 'critical', due_days_after_start: -1, assignee_type: 'it' },
  { title: 'Issue access card/badge', description: 'Create building access card and configure door access', category: 'it_setup', priority: 'high', due_days_after_start: 0, assignee_type: 'it' },
  { title: 'Set up VPN access', description: 'Configure VPN client and provide connection credentials', category: 'it_setup', priority: 'high', due_days_after_start: 0, assignee_type: 'it' },
  { title: 'Provision collaboration tools', description: 'Add to Slack/Teams, Zoom, project management tools', category: 'it_setup', priority: 'high', due_days_after_start: 0, assignee_type: 'it' },
]

// ---------------------------------------------------------------------------
// HR tasks (universal)
// ---------------------------------------------------------------------------

const HR_TASKS: OnboardingChecklistItem[] = [
  { title: 'Complete employment contract', description: 'Ensure signed employment contract is filed', category: 'hr', priority: 'critical', due_days_after_start: -5, assignee_type: 'hr' },
  { title: 'Submit tax forms', description: 'Complete and submit all required tax documentation (W-4, P45, etc.)', category: 'hr', priority: 'critical', due_days_after_start: 0, assignee_type: 'employee' },
  { title: 'Benefits enrollment', description: 'Complete benefits enrollment (health, dental, vision, retirement)', category: 'hr', priority: 'high', due_days_after_start: 5, assignee_type: 'employee' },
  { title: 'Emergency contact information', description: 'Submit emergency contact and next-of-kin details', category: 'hr', priority: 'high', due_days_after_start: 1, assignee_type: 'employee' },
  { title: 'Bank details for payroll', description: 'Provide bank account details for salary payments', category: 'hr', priority: 'critical', due_days_after_start: 1, assignee_type: 'employee' },
]

// ---------------------------------------------------------------------------
// Manager tasks (universal)
// ---------------------------------------------------------------------------

const MANAGER_TASKS: OnboardingChecklistItem[] = [
  { title: 'Schedule team introduction', description: 'Introduce new hire to the team (in-person or virtual)', category: 'manager', priority: 'high', due_days_after_start: 0, assignee_type: 'manager' },
  { title: 'Assign onboarding buddy', description: 'Assign an onboarding buddy from the team to help with questions', category: 'manager', priority: 'high', due_days_after_start: 0, assignee_type: 'manager' },
  { title: 'Create first-week plan', description: 'Prepare a structured plan for the first week with key meetings and tasks', category: 'manager', priority: 'high', due_days_after_start: -2, assignee_type: 'manager' },
  { title: 'Set 30-60-90 day goals', description: 'Define clear expectations and goals for the first 90 days', category: 'manager', priority: 'medium', due_days_after_start: 5, assignee_type: 'manager' },
  { title: 'Schedule weekly 1:1s', description: 'Set up recurring weekly 1:1 meetings for the probation period', category: 'manager', priority: 'medium', due_days_after_start: 3, assignee_type: 'manager' },
]

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate a complete onboarding checklist for a newly hired candidate.
 *
 * Creates tasks across four categories:
 * 1. IT setup (laptop, email, access cards, tools)
 * 2. HR (contracts, tax forms, benefits enrollment)
 * 3. Manager (team intro, buddy, first-week plan)
 * 4. Department-specific (based on department name)
 *
 * @param candidateName - Name of the hired candidate
 * @param departmentId  - Department ID for the hire
 * @param departmentName - Department name (used for department-specific tasks)
 * @param jobTitle      - Job title for context
 * @returns Structured checklist result
 */
export function generateOnboardingChecklist(
  candidateName: string,
  departmentId: string,
  departmentName: string,
  jobTitle: string,
): OnboardingChecklistResult {
  const tasks: OnboardingChecklistItem[] = []

  // 1. IT setup tasks
  tasks.push(...IT_SETUP_TASKS)

  // 2. HR tasks
  tasks.push(...HR_TASKS)

  // 3. Manager tasks
  tasks.push(...MANAGER_TASKS)

  // 4. Department-specific tasks
  const deptKey = departmentName.toLowerCase().replace(/[^a-z]/g, '')
  const deptTasks = DEPARTMENT_TASKS[deptKey] || []
  tasks.push(...deptTasks)

  // Count by category
  const byCategory: Record<string, number> = {}
  for (const task of tasks) {
    byCategory[task.category] = (byCategory[task.category] || 0) + 1
  }

  return {
    employeeName: candidateName,
    departmentId,
    jobTitle,
    tasks,
    totalTasks: tasks.length,
    byCategory,
  }
}

/**
 * Apply onboarding checklist to the store by creating preboarding tasks.
 *
 * @param result - Output from generateOnboardingChecklist
 * @param employeeId - The ID of the new employee
 * @param startDate - The employee's start date
 * @param store - Store actions for persisting tasks
 * @returns Number of tasks created
 */
export function applyOnboardingChecklist(
  result: OnboardingChecklistResult,
  employeeId: string,
  startDate: string,
  store: RecruitingOnboardingStoreSlice,
): number {
  let created = 0

  for (const task of result.tasks) {
    // Calculate due date from start date
    const due = new Date(startDate)
    due.setDate(due.getDate() + task.due_days_after_start)
    const dueDate = due.toISOString().split('T')[0]

    if (store.addPreboardingTask) {
      store.addPreboardingTask({
        title: task.title,
        description: task.description,
        category: task.category,
        priority: task.priority,
        status: 'pending',
        employee_id: employeeId,
        due_date: dueDate,
        assignee_type: task.assignee_type,
      })
      created++
    }
  }

  return created
}
