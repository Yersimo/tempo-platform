// ─── Help Registry ──────────────────────────────────────────────────────────
// Maps page routes to help content entries for contextual help display.
// Each entry provides quick-start info, common tasks, and tips
// that can be shown without loading the full ModuleDoc.

export interface HelpEntry {
  module: string
  title: string
  description: string
  quickStart: string[]
  commonTasks: { label: string; steps: string[] }[]
  tips: string[]
  relatedModules: string[]
}

// ─── Route-to-module slug mapping ───────────────────────────────────────────
// Maps pathname segments to doc registry slugs
export const ROUTE_TO_MODULE: Record<string, string> = {
  '/dashboard': 'dashboard',
  '/people': 'people',
  '/recruiting': 'recruiting',
  '/chat': 'chat',
  '/performance': 'performance',
  '/compensation': 'compensation',
  '/learning': 'learning',
  '/engagement': 'engagement',
  '/mentoring': 'mentoring',
  '/offboarding': 'offboarding',
  '/payroll': 'payroll',
  '/benefits': 'benefits',
  '/payslips': 'payslips',
  '/time-attendance': 'time-attendance',
  '/expense': 'expense',
  '/travel': 'travel',
  '/global-workforce': 'global-workforce',
  '/workers-comp': 'workers-comp',
  '/it-cloud': 'it-cloud',
  '/it/devices': 'it/devices',
  '/it/apps': 'it/apps',
  '/identity': 'identity',
  '/password-manager': 'password-manager',
  '/marketplace': 'marketplace',
  '/finance/invoices': 'finance/invoices',
  '/finance/budgets': 'finance/budgets',
  '/finance/cards': 'finance/cards',
  '/finance/bill-pay': 'finance/bill-pay',
  '/projects': 'projects',
  '/strategy': 'strategy',
  '/headcount': 'headcount',
  '/compliance': 'compliance',
  '/analytics': 'analytics',
  '/documents': 'documents',
  '/onboarding': 'onboarding',
  '/settings': 'settings',
  '/app-studio': 'app-studio',
  '/groups': 'groups',
  '/developer': 'developer',
}

/** Resolve a pathname to a module slug */
export function resolveModuleFromPath(pathname: string): string | null {
  // Try exact match first
  if (ROUTE_TO_MODULE[pathname]) return ROUTE_TO_MODULE[pathname]
  // Try matching with 2-segment paths (e.g. /finance/invoices)
  const segments = pathname.split('/').filter(Boolean)
  if (segments.length >= 2) {
    const twoSegment = '/' + segments.slice(0, 2).join('/')
    if (ROUTE_TO_MODULE[twoSegment]) return ROUTE_TO_MODULE[twoSegment]
  }
  // Try single segment
  if (segments.length >= 1) {
    const oneSegment = '/' + segments[0]
    if (ROUTE_TO_MODULE[oneSegment]) return ROUTE_TO_MODULE[oneSegment]
  }
  return null
}

// ─── Help entries for major modules ─────────────────────────────────────────

export const HELP_REGISTRY: Record<string, HelpEntry> = {
  dashboard: {
    module: 'dashboard',
    title: 'Dashboard',
    description: 'Your central command center for workforce intelligence with KPI cards, AI insights, and real-time analytics.',
    quickStart: [
      'Review the KPI summary cards at the top for headcount, attrition, open roles, and payroll spend',
      'Check the AI Insights panel for automatically detected patterns and anomalies',
      'Click any KPI card to drill down into its detailed module',
      'Use the Pending Actions widget to handle urgent items',
    ],
    commonTasks: [
      { label: 'Export dashboard to PDF', steps: ['Click the export icon in the top-right corner', 'Select PDF format', 'Choose date range', 'Download the report'] },
      { label: 'Filter by department', steps: ['Click the department dropdown', 'Select one or more departments', 'Dashboard refreshes automatically'] },
    ],
    tips: [
      'Press "?" anywhere to open contextual help',
      'KPI cards show period-over-period change with trend arrows',
      'The dashboard adapts content based on your role and permissions',
    ],
    relatedModules: ['analytics', 'people', 'payroll'],
  },
  people: {
    module: 'people',
    title: 'People Management',
    description: 'Manage your workforce directory, employee profiles, org chart, and team structures.',
    quickStart: [
      'Browse the employee directory with search and filters',
      'Click any employee to view their full profile',
      'Use the Org Chart tab to visualize reporting relationships',
      'Add new employees via the "+ Add Employee" button',
    ],
    commonTasks: [
      { label: 'Search for an employee', steps: ['Use the search bar at the top', 'Type name, email, or job title', 'Click on a result to view their profile'] },
      { label: 'Update employee details', steps: ['Navigate to the employee profile', 'Click "Edit" on any section', 'Make changes and save'] },
      { label: 'View org chart', steps: ['Click the "Org Chart" tab', 'Use zoom controls to navigate', 'Click on a node to see that person\'s details'] },
    ],
    tips: [
      'Use filters to narrow by department, location, or employment type',
      'Employee profiles show performance history, compensation, and time-off balances',
      'Bulk actions are available via the checkbox column',
    ],
    relatedModules: ['recruiting', 'performance', 'compensation', 'offboarding'],
  },
  payroll: {
    module: 'payroll',
    title: 'Payroll',
    description: 'Process payroll runs, manage tax withholdings, handle garnishments, and ensure compliance.',
    quickStart: [
      'Review the current pay period summary at the top',
      'Check for pending items that need resolution before running payroll',
      'Use the "Run Payroll" button to initiate a new payroll cycle',
      'Review the payroll history for past runs and adjustments',
    ],
    commonTasks: [
      { label: 'Run a payroll cycle', steps: ['Click "Run Payroll"', 'Select the pay period', 'Review earnings and deductions', 'Approve and submit'] },
      { label: 'Handle off-cycle payments', steps: ['Click "Off-Cycle"', 'Select employee(s)', 'Enter payment details', 'Submit for processing'] },
    ],
    tips: [
      'Always review the payroll preview before final submission',
      'Off-cycle payments can be processed outside regular pay periods',
      'Multi-state and multi-country payroll is supported for global teams',
    ],
    relatedModules: ['benefits', 'compensation', 'time-attendance', 'payslips'],
  },
  recruiting: {
    module: 'recruiting',
    title: 'Recruiting',
    description: 'Manage job postings, applicant tracking, interviews, and hiring pipelines.',
    quickStart: [
      'View your active job postings and their pipeline status',
      'Click on a requisition to see all candidates in the pipeline',
      'Use the Kanban board to drag candidates between interview stages',
      'Schedule interviews directly from a candidate\'s profile',
    ],
    commonTasks: [
      { label: 'Create a job posting', steps: ['Click "+ New Requisition"', 'Fill in the job details, requirements, and compensation range', 'Select hiring team members', 'Publish to job boards'] },
      { label: 'Move a candidate forward', steps: ['Open the candidate profile', 'Review their application and resume', 'Click "Advance" to move to the next stage', 'Add interview feedback'] },
    ],
    tips: [
      'Use scorecards to standardize candidate evaluation across interviewers',
      'Email templates can automate candidate communication',
      'The analytics tab shows time-to-fill and source-of-hire metrics',
    ],
    relatedModules: ['people', 'headcount', 'onboarding'],
  },
  learning: {
    module: 'learning',
    title: 'Learning & Development',
    description: 'Manage training programs, course assignments, certifications, and skill development paths.',
    quickStart: [
      'Browse the course catalog to find available training',
      'Check your assigned courses and completion deadlines',
      'Track certification expiration dates for compliance',
      'Create learning paths for team development',
    ],
    commonTasks: [
      { label: 'Assign a course', steps: ['Select the course from the catalog', 'Click "Assign"', 'Choose individuals or groups', 'Set a due date and send notification'] },
      { label: 'Track team progress', steps: ['Open the Learning Dashboard', 'Filter by team or department', 'Review completion rates and scores'] },
    ],
    tips: [
      'Courses with expiring certifications are highlighted automatically',
      'Managers can view learning progress for their direct reports',
      'SCORM and xAPI course formats are supported for import',
    ],
    relatedModules: ['performance', 'compliance', 'people'],
  },
  performance: {
    module: 'performance',
    title: 'Performance',
    description: 'Goal setting, performance reviews, 360-degree feedback, and improvement plans.',
    quickStart: [
      'Set your goals and OKRs aligned to team objectives',
      'Check the review cycle timeline and your upcoming reviews',
      'Provide or request 360-degree feedback',
      'View your performance history and trends',
    ],
    commonTasks: [
      { label: 'Create a goal', steps: ['Click "+ New Goal"', 'Enter title, description, and key results', 'Align to a parent objective', 'Set the due date'] },
      { label: 'Submit a review', steps: ['Open your pending review', 'Complete each section (self-assessment, ratings, comments)', 'Submit for manager review'] },
    ],
    tips: [
      'Align goals to company objectives to show strategic contribution',
      'Regular check-ins between reviews help track progress',
      'Peer recognition badges contribute to the culture feed',
    ],
    relatedModules: ['compensation', 'learning', 'people'],
  },
  benefits: {
    module: 'benefits',
    title: 'Benefits',
    description: 'Manage health insurance, retirement plans, voluntary benefits, and open enrollment.',
    quickStart: [
      'Review your current benefit elections and coverage details',
      'Check for upcoming open enrollment periods',
      'View plan comparisons to evaluate coverage options',
      'Update beneficiary information and life events',
    ],
    commonTasks: [
      { label: 'Enroll in a plan', steps: ['Navigate to open enrollment', 'Compare available plans', 'Select your coverage level', 'Add dependents if applicable', 'Confirm and submit'] },
      { label: 'Report a life event', steps: ['Click "Life Event"', 'Select the event type (marriage, birth, etc.)', 'Upload supporting documentation', 'Review updated benefit options'] },
    ],
    tips: [
      'Life events trigger a special enrollment window outside open enrollment',
      'Use the plan comparison tool to evaluate cost vs. coverage',
      'Benefits changes take effect on the first of the following month',
    ],
    relatedModules: ['payroll', 'people', 'compensation'],
  },
  'time-attendance': {
    module: 'time-attendance',
    title: 'Time & Attendance',
    description: 'Track work hours, manage schedules, handle leave requests, and monitor attendance patterns.',
    quickStart: [
      'Clock in and out using the timer widget',
      'Submit time-off requests from the calendar view',
      'Review your timesheet for the current pay period',
      'Check your leave balances and accruals',
    ],
    commonTasks: [
      { label: 'Submit a time-off request', steps: ['Click "+ Time Off"', 'Select leave type (vacation, sick, personal)', 'Choose dates', 'Add notes for your manager', 'Submit for approval'] },
      { label: 'Approve timesheets', steps: ['Open the approval queue', 'Review employee hours and notes', 'Approve or request corrections'] },
    ],
    tips: [
      'Timesheets must be submitted before the payroll cutoff date',
      'Managers can set up automatic schedule templates',
      'Overtime alerts notify managers when employees approach thresholds',
    ],
    relatedModules: ['payroll', 'people', 'compliance'],
  },
  expense: {
    module: 'expense',
    title: 'Expenses',
    description: 'Submit expense reports, scan receipts, manage approvals, and track reimbursements.',
    quickStart: [
      'Submit a new expense report by clicking "+ New Expense"',
      'Scan receipts using the OCR feature for automatic data extraction',
      'Track the approval status of your submitted expenses',
      'View reimbursement history and pending payments',
    ],
    commonTasks: [
      { label: 'Submit an expense', steps: ['Click "+ New Expense"', 'Upload or scan the receipt', 'Verify extracted details (amount, vendor, date)', 'Select expense category and project', 'Submit for approval'] },
      { label: 'Approve expenses', steps: ['Open the approval queue', 'Review expense details and receipt images', 'Approve, reject, or request more information'] },
    ],
    tips: [
      'Receipt OCR automatically extracts vendor, amount, and date',
      'Expenses can be linked to projects for cost allocation',
      'Policy violations are flagged automatically before submission',
    ],
    relatedModules: ['finance/cards', 'travel', 'projects'],
  },
  'it/devices': {
    module: 'it/devices',
    title: 'IT Devices',
    description: 'Manage hardware inventory, device assignments, MDM policies, and lifecycle tracking.',
    quickStart: [
      'View the device inventory with filters for type, status, and assignment',
      'Assign devices to employees from the inventory',
      'Track device lifecycle from procurement to retirement',
      'Monitor MDM compliance status across the fleet',
    ],
    commonTasks: [
      { label: 'Assign a device', steps: ['Select a device from inventory', 'Click "Assign"', 'Choose the employee', 'Confirm the assignment and generate a receipt'] },
      { label: 'Request a new device', steps: ['Click "+ Request Device"', 'Select device type and specifications', 'Add justification', 'Submit for IT approval'] },
    ],
    tips: [
      'Devices nearing end-of-life are highlighted for replacement planning',
      'MDM policies can be applied in bulk to device groups',
      'Asset tags are generated automatically on device registration',
    ],
    relatedModules: ['it/apps', 'it-cloud', 'people'],
  },
  projects: {
    module: 'projects',
    title: 'Projects',
    description: 'Plan and track projects with Kanban boards, Gantt timelines, milestones, and team workload views.',
    quickStart: [
      'View your active projects on the dashboard',
      'Switch between Kanban, List, and Timeline views',
      'Create tasks and assign team members',
      'Track project milestones and deadlines',
    ],
    commonTasks: [
      { label: 'Create a project', steps: ['Click "+ New Project"', 'Enter project name, description, and timeline', 'Add team members and roles', 'Create initial milestones'] },
      { label: 'Update task status', steps: ['Open the task', 'Change the status or drag on the Kanban board', 'Add comments or attachments', 'Log time if applicable'] },
    ],
    tips: [
      'Use the workload view to balance team capacity across projects',
      'Milestones can trigger automated notifications to stakeholders',
      'Expenses and time entries can be linked to specific projects',
    ],
    relatedModules: ['people', 'headcount', 'analytics'],
  },
  compliance: {
    module: 'compliance',
    title: 'Compliance',
    description: 'Monitor regulatory compliance, manage audits, track policy acknowledgments, and handle risk assessments.',
    quickStart: [
      'Review the compliance dashboard for your current risk score',
      'Check upcoming audit deadlines and required actions',
      'View policy acknowledgment status across the organization',
      'Monitor regulatory changes that affect your industry',
    ],
    commonTasks: [
      { label: 'Initiate an audit', steps: ['Click "+ New Audit"', 'Select the audit type and scope', 'Assign auditors and set deadlines', 'Track findings and remediation'] },
      { label: 'Deploy a policy', steps: ['Create or update the policy document', 'Select the audience (all employees, specific departments)', 'Set acknowledgment deadline', 'Monitor completion rates'] },
    ],
    tips: [
      'Compliance scores update in real-time as items are resolved',
      'Automated alerts notify you of upcoming regulatory deadlines',
      'Policy templates are available for common compliance frameworks',
    ],
    relatedModules: ['people', 'learning', 'documents'],
  },
  onboarding: {
    module: 'onboarding',
    title: 'Onboarding',
    description: 'Automate new hire onboarding with task checklists, document collection, and welcome workflows.',
    quickStart: [
      'View active onboarding workflows for new hires',
      'Create onboarding templates for different roles',
      'Track checklist completion for each new employee',
      'Set up automated welcome emails and task assignments',
    ],
    commonTasks: [
      { label: 'Start onboarding for a new hire', steps: ['Click "+ New Onboarding"', 'Select the employee and start date', 'Choose an onboarding template', 'Assign a buddy or mentor', 'Launch the workflow'] },
      { label: 'Customize a template', steps: ['Open the template editor', 'Add or remove tasks and milestones', 'Set task owners and due dates', 'Save the template'] },
    ],
    tips: [
      'Onboarding templates can vary by department, role, or location',
      'Automated reminders keep tasks on track without manual follow-up',
      'Pre-boarding tasks (before day one) can be assigned to IT and facilities',
    ],
    relatedModules: ['people', 'it/devices', 'learning', 'recruiting'],
  },
  offboarding: {
    module: 'offboarding',
    title: 'Offboarding',
    description: 'Manage employee exits with structured checklists, knowledge transfer, and access revocation.',
    quickStart: [
      'Initiate offboarding from the employee profile',
      'Track exit checklist completion across departments',
      'Schedule exit interviews for departing employees',
      'Ensure access revocation and equipment return',
    ],
    commonTasks: [
      { label: 'Start offboarding', steps: ['Open the employee profile', 'Click "Initiate Offboarding"', 'Set the last working date', 'Assign tasks to HR, IT, and the manager'] },
      { label: 'Conduct exit interview', steps: ['Schedule the interview from the offboarding workflow', 'Complete the exit interview form', 'Submit feedback and notes'] },
    ],
    tips: [
      'Automated access revocation occurs on the last working date',
      'Knowledge transfer tasks ensure critical information is preserved',
      'Exit interview data feeds into attrition analytics',
    ],
    relatedModules: ['people', 'it/devices', 'compliance'],
  },
  analytics: {
    module: 'analytics',
    title: 'Reports & Analytics',
    description: 'Build custom reports, analyze workforce trends, and export data for strategic decision-making.',
    quickStart: [
      'Browse pre-built report templates for common metrics',
      'Create a custom report using the report builder',
      'Schedule recurring reports for automatic delivery',
      'Export data in CSV, Excel, or PDF format',
    ],
    commonTasks: [
      { label: 'Create a custom report', steps: ['Click "+ New Report"', 'Select data sources and metrics', 'Add filters and grouping', 'Choose visualization type', 'Save and share'] },
      { label: 'Schedule a recurring report', steps: ['Open an existing report', 'Click "Schedule"', 'Set frequency (daily, weekly, monthly)', 'Add recipients', 'Enable the schedule'] },
    ],
    tips: [
      'Saved reports can be pinned to your dashboard as widgets',
      'Data exports respect your permission level and data access rules',
      'Use the comparison feature to benchmark across time periods',
    ],
    relatedModules: ['dashboard', 'people', 'payroll', 'compliance'],
  },
  compensation: {
    module: 'compensation',
    title: 'Compensation',
    description: 'Manage salary bands, merit cycles, equity grants, and total rewards statements.',
    quickStart: [
      'Review salary bands and compa-ratios for your team',
      'View the current or upcoming merit cycle',
      'Generate total rewards statements for employees',
      'Analyze compensation equity across demographics',
    ],
    commonTasks: [
      { label: 'Propose a salary adjustment', steps: ['Navigate to the employee profile', 'Click "Compensation"', 'Submit a change request with justification', 'Route to approval workflow'] },
      { label: 'Run a merit cycle', steps: ['Click "Start Merit Cycle"', 'Set the budget pool and guidelines', 'Managers submit recommendations', 'Review and approve in calibration'] },
    ],
    tips: [
      'Compa-ratio helps identify employees below or above market rate',
      'Merit cycle budgets cascade from company to department level',
      'Total rewards statements include salary, bonus, equity, and benefits value',
    ],
    relatedModules: ['payroll', 'performance', 'people', 'benefits'],
  },
  headcount: {
    module: 'headcount',
    title: 'Headcount Planning',
    description: 'Plan workforce growth, manage position budgets, and track hiring against targets.',
    quickStart: [
      'View the headcount plan for the current fiscal year',
      'Track approved vs. filled positions by department',
      'Submit new headcount requests for budget approval',
      'Monitor hiring velocity against plan targets',
    ],
    commonTasks: [
      { label: 'Request new headcount', steps: ['Click "+ New Request"', 'Specify role, level, and department', 'Add business justification', 'Submit for finance and leadership approval'] },
      { label: 'Review department plans', steps: ['Select a department', 'View approved, open, and filled positions', 'Compare actuals to budget'] },
    ],
    tips: [
      'Headcount plans link to recruiting for seamless requisition creation',
      'Budget impact is calculated automatically based on compensation bands',
      'Scenario modeling helps evaluate different hiring strategies',
    ],
    relatedModules: ['recruiting', 'people', 'strategy', 'analytics'],
  },
  travel: {
    module: 'travel',
    title: 'Travel',
    description: 'Book travel, manage itineraries, enforce travel policies, and handle expense reconciliation.',
    quickStart: [
      'Search for flights, hotels, and car rentals',
      'View your upcoming travel itineraries',
      'Submit travel requests for pre-approval',
      'Track travel spend against policy limits',
    ],
    commonTasks: [
      { label: 'Book a trip', steps: ['Click "+ New Trip"', 'Enter destination and dates', 'Search and compare options', 'Select and book', 'Expenses auto-link to the trip'] },
      { label: 'Submit a travel request', steps: ['Click "Request Approval"', 'Enter trip details and estimated costs', 'Submit to your manager', 'Book once approved'] },
    ],
    tips: [
      'Travel policy limits are shown during booking to avoid violations',
      'Receipts from travel expenses can be auto-linked to the trip',
      'Frequent traveler profiles save time on repeat bookings',
    ],
    relatedModules: ['expense', 'compliance', 'finance/cards'],
  },
}

/** Get help entry for a module slug */
export function getHelpEntry(moduleSlug: string): HelpEntry | null {
  return HELP_REGISTRY[moduleSlug] ?? null
}

/** Get all module slugs that have help entries */
export function getHelpModuleSlugs(): string[] {
  return Object.keys(HELP_REGISTRY)
}
