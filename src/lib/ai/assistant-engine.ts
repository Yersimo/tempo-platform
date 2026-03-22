/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tempo AI Assistant Engine
 * Local pattern-matching query processor against store data.
 * No external AI API calls — everything runs client-side.
 */

// ---- Types ----

export interface AssistantQuery {
  text: string
  context: {
    orgId: string
    employeeId: string
    role: string
    currentPage: string
  }
}

export interface AssistantResponse {
  type: 'answer' | 'action' | 'insight' | 'navigation' | 'creation'
  text: string
  data?: any
  actions?: AssistantAction[]
  confidence: number
}

export interface AssistantAction {
  label: string
  type: 'navigate' | 'create' | 'approve' | 'generate'
  payload: any
  icon: string
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  response?: AssistantResponse
  timestamp: Date
}

export type { ChatMessage }

// ---- Helpers ----

function employeeName(emp: any): string {
  return emp?.profile?.full_name || emp?.full_name || 'Unknown'
}

function activeEmployees(store: any): any[] {
  return store.employees?.filter((e: any) => e.status === 'active' || !e.termination_date) || []
}

function formatAmount(cents: number, currency: string): string {
  return `${currency} ${(cents / 100).toLocaleString()}`
}

// ---- Query Patterns (Category 1: Data reads) ----

interface QueryPattern {
  pattern: RegExp
  handler: (store: any, match: RegExpMatchArray) => AssistantResponse
}

const QUERY_PATTERNS: QueryPattern[] = [
  // People — headcount
  {
    pattern: /how many (employees|people|staff|team members)|headcount$|total headcount/i,
    handler: (store) => {
      const active = activeEmployees(store)
      const deptSet = new Set(active.map((e: any) => e.department_id))
      return {
        type: 'answer',
        text: `You have ${active.length} active employees across ${deptSet.size} departments.`,
        data: { count: active.length, departments: [...deptSet] },
        confidence: 0.95,
      }
    },
  },
  // People — who's on leave
  {
    pattern: /who.*(on leave|off|away|out of office).*(today|this week|tomorrow)?/i,
    handler: (store) => {
      const today = new Date().toISOString().split('T')[0]
      const onLeave =
        store.leaveRequests?.filter(
          (l: any) => l.status === 'approved' && l.start_date <= today && l.end_date >= today
        ) || []
      const names = onLeave.map((l: any) => {
        const emp = store.employees?.find((e: any) => e.id === l.employee_id)
        return employeeName(emp)
      })
      return {
        type: 'answer',
        text:
          onLeave.length > 0
            ? `${onLeave.length} people are on leave today: ${names.join(', ')}.`
            : 'No one is on leave today.',
        data: { onLeave },
        confidence: 0.9,
      }
    },
  },
  // People — turnover rate
  {
    pattern: /turnover rate|attrition rate/i,
    handler: (store) => {
      const total = store.employees?.length || 1
      const terminated = store.employees?.filter((e: any) => e.termination_date)?.length || 0
      const rate = Math.round((terminated / total) * 100)
      return {
        type: 'answer',
        text: `Current turnover rate is ${rate}% (${terminated} departures out of ${total} total employees).`,
        data: { rate, terminated, total },
        confidence: 0.9,
      }
    },
  },
  // People — headcount by department
  {
    pattern: /headcount by (department|dept|team)/i,
    handler: (store) => {
      const byDept: Record<string, number> = {}
      activeEmployees(store).forEach((e: any) => {
        const dept = store.departments?.find((d: any) => d.id === e.department_id)
        const name = dept?.name || 'Unassigned'
        byDept[name] = (byDept[name] || 0) + 1
      })
      const rows = Object.entries(byDept).sort((a, b) => b[1] - a[1])
      return {
        type: 'answer',
        text: `Headcount by department:\n${rows.map(([d, c]) => `  ${d}: ${c}`).join('\n')}`,
        data: { departments: rows },
        confidence: 0.95,
      }
    },
  },
  // People — new hires this month
  {
    pattern: /new hires|recent hires|who (joined|started) (this|last) month/i,
    handler: (store) => {
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
      const newHires =
        store.employees?.filter(
          (e: any) => e.start_date && e.start_date >= startOfMonth && !e.termination_date
        ) || []
      const names = newHires.map((e: any) => employeeName(e))
      return {
        type: 'answer',
        text:
          newHires.length > 0
            ? `${newHires.length} new hires this month: ${names.join(', ')}.`
            : 'No new hires this month.',
        data: { newHires },
        confidence: 0.85,
      }
    },
  },
  // People — employees in country
  {
    pattern: /employees? in (\w+)|staff in (\w+)|people in (\w+)/i,
    handler: (store, match) => {
      const country = (match[1] || match[2] || match[3])?.toLowerCase()
      const inCountry = activeEmployees(store).filter(
        (e: any) => (e.country || e.profile?.country || '').toLowerCase().includes(country)
      )
      return {
        type: 'answer',
        text: `${inCountry.length} employees in ${country.charAt(0).toUpperCase() + country.slice(1)}.`,
        data: { employees: inCountry },
        confidence: 0.85,
      }
    },
  },
  // People — find employee
  {
    pattern: /find (employee|person|someone named)\s+(.+)/i,
    handler: (store, match) => {
      const name = match[2]?.trim().toLowerCase()
      const found = store.employees?.filter((e: any) =>
        employeeName(e).toLowerCase().includes(name)
      ) || []
      if (found.length === 0) {
        return { type: 'answer', text: `No employee found matching "${match[2]?.trim()}".`, confidence: 0.7 }
      }
      const details = found.map((e: any) => {
        const dept = store.departments?.find((d: any) => d.id === e.department_id)
        return `  ${employeeName(e)} — ${e.job_title || 'N/A'}, ${dept?.name || 'N/A'}`
      })
      return {
        type: 'answer',
        text: `Found ${found.length} match${found.length > 1 ? 'es' : ''}:\n${details.join('\n')}`,
        data: { employees: found },
        confidence: 0.9,
        actions: found.length === 1
          ? [{ label: 'View Profile', type: 'navigate' as const, payload: `/people/${found[0].id}`, icon: 'User' }]
          : [{ label: 'View People', type: 'navigate' as const, payload: '/people', icon: 'Users' }],
      }
    },
  },
  // People — birthdays / anniversaries
  {
    pattern: /birthday|anniversar/i,
    handler: (store) => {
      const now = new Date()
      const thisMonth = now.getMonth()
      const birthdays = store.employees?.filter((e: any) => {
        if (!e.date_of_birth && !e.profile?.date_of_birth) return false
        const dob = new Date(e.date_of_birth || e.profile?.date_of_birth)
        return dob.getMonth() === thisMonth
      }) || []
      const anniversaries = store.employees?.filter((e: any) => {
        if (!e.start_date) return false
        const start = new Date(e.start_date)
        return start.getMonth() === thisMonth && start.getFullYear() < now.getFullYear()
      }) || []
      const parts: string[] = []
      if (birthdays.length > 0) parts.push(`${birthdays.length} birthday${birthdays.length > 1 ? 's' : ''} this month`)
      if (anniversaries.length > 0) parts.push(`${anniversaries.length} work anniversar${anniversaries.length > 1 ? 'ies' : 'y'} this month`)
      return {
        type: 'answer',
        text: parts.length > 0 ? parts.join(' and ') + '.' : 'No birthdays or anniversaries this month.',
        confidence: 0.8,
      }
    },
  },

  // Finance — payroll cost
  {
    pattern: /payroll cost|total payroll|payroll spend|payroll run/i,
    handler: (store) => {
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const latestRun = store.payrollRuns
        ?.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))?.[0]
      const total = latestRun?.total_gross || latestRun?.totalGross || 0
      return {
        type: 'answer',
        text: `Latest payroll run: ${formatAmount(total, currency)} gross. ${store.payrollRuns?.length || 0} payroll runs on record.`,
        data: { latestRun, total },
        confidence: 0.9,
        actions: [{ label: 'View Payroll', type: 'navigate', payload: '/payroll', icon: 'DollarSign' }],
      }
    },
  },
  // Finance — budget utilization
  {
    pattern: /budget (utilization|usage|spend)|how much budget/i,
    handler: (store) => {
      const budgets = store.budgets || []
      if (budgets.length === 0) {
        return { type: 'answer', text: 'No budget data available.', confidence: 0.5 }
      }
      const totalBudget = budgets.reduce((s: number, b: any) => s + (b.amount || b.total || 0), 0)
      const totalSpent = budgets.reduce((s: number, b: any) => s + (b.spent || b.used || 0), 0)
      const pct = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0
      return {
        type: 'answer',
        text: `Budget utilization: ${pct}% spent across ${budgets.length} budgets.`,
        data: { totalBudget, totalSpent, pct },
        confidence: 0.85,
        actions: [{ label: 'View Budgets', type: 'navigate', payload: '/finance', icon: 'BarChart3' }],
      }
    },
  },
  // Finance — pending expenses
  {
    pattern: /pending expense|expense reports? (pending|awaiting|to review)/i,
    handler: (store) => {
      const pending =
        store.expenseReports?.filter(
          (e: any) => e.status === 'pending' || e.status === 'submitted'
        ) || []
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const totalAmt = pending.reduce(
        (s: number, e: any) => s + (e.total_amount || e.totalAmount || 0),
        0
      )
      return {
        type: 'answer',
        text: `${pending.length} pending expense reports totaling ${formatAmount(totalAmt, currency)}.`,
        data: { pending },
        confidence: 0.9,
        actions: [{ label: 'Review Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' }],
      }
    },
  },
  // Finance — outstanding invoices
  {
    pattern: /outstanding invoices|accounts receivable|unpaid invoices|overdue invoices/i,
    handler: (store) => {
      const outstanding = store.invoices?.filter(
        (i: any) => i.status === 'sent' || i.status === 'overdue' || i.status === 'pending'
      ) || []
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const total = outstanding.reduce((s: number, i: any) => s + (i.amount || i.total || 0), 0)
      return {
        type: 'answer',
        text: `${outstanding.length} outstanding invoices totaling ${formatAmount(total, currency)}.`,
        data: { outstanding },
        confidence: 0.85,
        actions: [{ label: 'View Invoices', type: 'navigate', payload: '/finance', icon: 'FileText' }],
      }
    },
  },
  // Finance — revenue
  {
    pattern: /revenue (this|last) (quarter|month|year)/i,
    handler: (store) => {
      const invoices = store.invoices?.filter((i: any) => i.status === 'paid') || []
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const total = invoices.reduce((s: number, i: any) => s + (i.amount || i.total || 0), 0)
      return {
        type: 'answer',
        text: `Total paid invoices: ${formatAmount(total, currency)} across ${invoices.length} invoices.`,
        confidence: 0.7,
        actions: [{ label: 'View Finance', type: 'navigate', payload: '/finance', icon: 'TrendingUp' }],
      }
    },
  },
  // Finance — cost per employee
  {
    pattern: /cost per employee|per.?head cost/i,
    handler: (store) => {
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const latestRun = store.payrollRuns
        ?.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))?.[0]
      const total = latestRun?.total_gross || latestRun?.totalGross || 0
      const headcount = activeEmployees(store).length || 1
      const costPerHead = Math.round(total / headcount)
      return {
        type: 'answer',
        text: `Average cost per employee (latest payroll): ${formatAmount(costPerHead, currency)}.`,
        confidence: 0.8,
      }
    },
  },

  // Operations — pending approvals
  {
    pattern: /pending (approvals|requests)|what needs (my |)approval/i,
    handler: (store) => {
      const pendingLeave = store.leaveRequests?.filter((l: any) => l.status === 'pending')?.length || 0
      const pendingExpense =
        store.expenseReports?.filter(
          (e: any) => e.status === 'pending' || e.status === 'submitted'
        )?.length || 0
      return {
        type: 'answer',
        text: `You have ${pendingLeave + pendingExpense} pending approvals: ${pendingLeave} leave requests and ${pendingExpense} expense reports.`,
        confidence: 0.95,
        actions: [
          { label: 'View Leave Requests', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' },
          { label: 'View Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' },
        ],
      }
    },
  },
  // Operations — open positions
  {
    pattern: /open (positions|roles|jobs|vacancies)|job (openings|postings)/i,
    handler: (store) => {
      const open =
        store.jobPostings?.filter(
          (j: any) => j.status === 'published' || j.status === 'open' || j.status === 'active'
        ) || []
      return {
        type: 'answer',
        text:
          open.length > 0
            ? `${open.length} open positions:\n${open.map((j: any) => `  ${j.title} — ${j.department || j.location || 'General'}`).join('\n')}`
            : 'No open positions right now.',
        data: { openPositions: open },
        confidence: 0.9,
        actions: [{ label: 'View Recruiting', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' }],
      }
    },
  },
  // Operations — compliance score
  {
    pattern: /compliance (score|status|overview)/i,
    handler: (store) => {
      const total = store.complianceRequirements?.length || 0
      const compliant =
        store.complianceRequirements?.filter((r: any) => r.status === 'compliant')?.length || 0
      const score = total > 0 ? Math.round((compliant / total) * 100) : 85
      return {
        type: 'answer',
        text: `Global compliance score: ${score}%. ${compliant} of ${total} requirements are compliant.`,
        confidence: 0.9,
        actions: [{ label: 'View Compliance', type: 'navigate', payload: '/compliance', icon: 'Shield' }],
      }
    },
  },
  // Operations — overdue training
  {
    pattern: /overdue training|expired certif|training compliance/i,
    handler: (store) => {
      const now = new Date().toISOString().split('T')[0]
      const overdue =
        store.enrollments?.filter(
          (e: any) => e.status === 'overdue' || (e.due_date && e.due_date < now && e.status !== 'completed')
        ) || []
      return {
        type: 'answer',
        text: `${overdue.length} employees have overdue or expired training.`,
        data: { overdue },
        confidence: 0.85,
        actions: [{ label: 'View Learning', type: 'navigate', payload: '/learning', icon: 'GraduationCap' }],
      }
    },
  },
  // Operations — devices out of warranty
  {
    pattern: /devices? (out of warranty|expir|old)|warranty/i,
    handler: (store) => {
      const now = new Date().toISOString().split('T')[0]
      const expired = store.devices?.filter(
        (d: any) => d.warranty_end && d.warranty_end < now
      ) || []
      return {
        type: 'answer',
        text: `${expired.length} devices are out of warranty.`,
        data: { expired },
        confidence: 0.8,
        actions: [{ label: 'View IT Assets', type: 'navigate', payload: '/it', icon: 'Laptop' }],
      }
    },
  },
  // Operations — IT requests / support tickets
  {
    pattern: /support tickets|it requests|open tickets/i,
    handler: (store) => {
      const open = store.itRequests?.filter(
        (r: any) => r.status === 'open' || r.status === 'in_progress' || r.status === 'pending'
      ) || []
      return {
        type: 'answer',
        text: `${open.length} open IT requests.`,
        data: { tickets: open },
        confidence: 0.85,
        actions: [{ label: 'View IT Requests', type: 'navigate', payload: '/it', icon: 'Headphones' }],
      }
    },
  },
  // Engagement score
  {
    pattern: /engagement score|employee engagement|eNPS/i,
    handler: (store) => {
      const scores = store.engagementScores || []
      if (scores.length === 0) {
        return { type: 'answer', text: 'No engagement score data available yet.', confidence: 0.5 }
      }
      const latest = scores[scores.length - 1]
      const score = latest?.overall_score || latest?.score || latest?.value || 'N/A'
      return {
        type: 'answer',
        text: `Current engagement score: ${score}${typeof score === 'number' ? '/100' : ''}.`,
        confidence: 0.8,
        actions: [{ label: 'View Engagement', type: 'navigate', payload: '/engagement', icon: 'Heart' }],
      }
    },
  },
  // Learning completion
  {
    pattern: /learning completion|training completion|course completion/i,
    handler: (store) => {
      const total = store.enrollments?.length || 0
      const completed = store.enrollments?.filter((e: any) => e.status === 'completed')?.length || 0
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0
      return {
        type: 'answer',
        text: `Learning completion rate: ${rate}% (${completed} of ${total} enrollments completed).`,
        confidence: 0.85,
        actions: [{ label: 'View Learning', type: 'navigate', payload: '/learning', icon: 'BookOpen' }],
      }
    },
  },
  // Top performers
  {
    pattern: /top performers|best (employees|performers|rated)/i,
    handler: (store) => {
      const reviews = store.reviews?.filter((r: any) => r.overall_rating || r.rating) || []
      const sorted = reviews
        .sort((a: any, b: any) => (b.overall_rating || b.rating || 0) - (a.overall_rating || a.rating || 0))
        .slice(0, 5)
      const names = sorted.map((r: any) => {
        const emp = store.employees?.find((e: any) => e.id === r.employee_id)
        return `  ${employeeName(emp)} — rating: ${r.overall_rating || r.rating}`
      })
      return {
        type: 'answer',
        text:
          names.length > 0
            ? `Top performers:\n${names.join('\n')}`
            : 'No performance review data available.',
        confidence: 0.8,
        actions: [{ label: 'View Performance', type: 'navigate', payload: '/performance', icon: 'Award' }],
      }
    },
  },
  // Salary range for role
  {
    pattern: /salary (range|band) for (.+)/i,
    handler: (store, match) => {
      const role = match[2]?.trim().toLowerCase()
      const bands = store.compBands?.filter((b: any) =>
        (b.title || b.job_title || b.role || '').toLowerCase().includes(role)
      ) || []
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      if (bands.length === 0) {
        return { type: 'answer', text: `No salary band found for "${match[2]?.trim()}".`, confidence: 0.5 }
      }
      const details = bands.map((b: any) =>
        `  ${b.title || b.job_title || b.role}: ${formatAmount(b.min_salary || b.min || 0, currency)} — ${formatAmount(b.max_salary || b.max || 0, currency)}`
      )
      return {
        type: 'answer',
        text: `Salary ranges:\n${details.join('\n')}`,
        data: { bands },
        confidence: 0.85,
        actions: [{ label: 'View Compensation', type: 'navigate', payload: '/compensation', icon: 'DollarSign' }],
      }
    },
  },
  // Upcoming reviews
  {
    pattern: /upcoming reviews|next review cycle|performance review/i,
    handler: (store) => {
      const now = new Date().toISOString().split('T')[0]
      const upcoming = store.reviewCycles?.filter(
        (c: any) => c.start_date && c.start_date >= now
      ) || []
      const current = store.reviewCycles?.filter(
        (c: any) => c.status === 'active' || c.status === 'in_progress'
      ) || []
      return {
        type: 'answer',
        text: current.length > 0
          ? `${current.length} active review cycle${current.length > 1 ? 's' : ''} in progress. ${upcoming.length} upcoming.`
          : upcoming.length > 0
            ? `${upcoming.length} upcoming review cycle${upcoming.length > 1 ? 's' : ''}.`
            : 'No upcoming review cycles scheduled.',
        confidence: 0.8,
        actions: [{ label: 'View Performance', type: 'navigate', payload: '/performance', icon: 'ClipboardCheck' }],
      }
    },
  },
]

// ---- Action Patterns (Category 2: Commands) ----

const ACTION_PATTERNS: QueryPattern[] = [
  // Create job posting
  {
    pattern: /create.*(job|posting|requisition).*(for|titled)\s+(.+)/i,
    handler: (_store, match) => {
      const titleRaw = match[3]?.split(/\s+(in|with|at)\s+/)[0]?.trim()
      const location = match[3]?.match(/in\s+(\w+)/)?.[1]
      return {
        type: 'creation',
        text: `I'll create a job posting for "${titleRaw}"${location ? ` in ${location}` : ''}.`,
        data: { title: titleRaw, location },
        confidence: 0.85,
        actions: [
          {
            label: 'Create Job Posting',
            type: 'create',
            payload: { entity: 'jobPosting', data: { title: titleRaw, location } },
            icon: 'Briefcase',
          },
          { label: 'Edit Before Creating', type: 'navigate', payload: '/recruiting', icon: 'Edit' },
        ],
      }
    },
  },
  // Approve expenses under threshold
  {
    pattern: /approve.*(all|every).*expense.*(under|below)\s*\$?(\d+)/i,
    handler: (store, match) => {
      const threshold = parseInt(match[3]) * 100
      const qualifying =
        store.expenseReports?.filter(
          (e: any) =>
            (e.status === 'pending' || e.status === 'submitted') &&
            (e.total_amount || e.totalAmount || 0) < threshold
        ) || []
      return {
        type: 'action',
        text: `Found ${qualifying.length} pending expense reports under $${match[3]}. Approve all?`,
        confidence: 0.9,
        actions: [
          {
            label: `Approve ${qualifying.length} Reports`,
            type: 'approve',
            payload: { entity: 'expenseReports', ids: qualifying.map((e: any) => e.id) },
            icon: 'CheckCircle',
          },
          { label: 'Review Individually', type: 'navigate', payload: '/expense', icon: 'Eye' },
        ],
      }
    },
  },
  // Create leave request
  {
    pattern: /create.*(leave|time.?off|pto|vacation).*(for|on|next|from)\s+(.+)/i,
    handler: () => {
      return {
        type: 'creation',
        text: "I'll help you create a leave request. Head to Time & Attendance to fill in the details.",
        confidence: 0.8,
        actions: [
          { label: 'Create Leave Request', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' },
        ],
      }
    },
  },
  // Schedule 1:1
  {
    pattern: /schedule.*(1:1|one.?on.?one|meeting|check.?in).*(with)\s+(.+)/i,
    handler: (store, match) => {
      const personName = match[3]?.trim()
      const person = store.employees?.find((e: any) =>
        employeeName(e).toLowerCase().includes(personName.toLowerCase())
      )
      return {
        type: 'action',
        text: person
          ? `I'll schedule a 1:1 with ${employeeName(person)}.`
          : `I couldn't find "${personName}" in the directory. Did you mean someone else?`,
        confidence: person ? 0.85 : 0.4,
        actions: person
          ? [{ label: 'Schedule Now', type: 'navigate', payload: '/performance', icon: 'Calendar' }]
          : [],
      }
    },
  },
  // Generate board report
  {
    pattern: /generate.*(board|quarterly|monthly).*(report|pack|deck)/i,
    handler: () => {
      return {
        type: 'creation',
        text: "I'll generate a board report with the latest data across all modules.",
        confidence: 0.85,
        actions: [
          {
            label: 'Generate Board Pack',
            type: 'navigate',
            payload: '/analytics/board-reports',
            icon: 'FileText',
          },
        ],
      }
    },
  },
  // Run payroll
  {
    pattern: /run payroll|process payroll|start payroll/i,
    handler: () => {
      return {
        type: 'action',
        text: "I'll take you to the payroll module to start a new payroll run.",
        confidence: 0.85,
        actions: [
          { label: 'Go to Payroll', type: 'navigate', payload: '/payroll', icon: 'DollarSign' },
        ],
      }
    },
  },
]

// ---- Navigation Shortcuts ----

const NAV_SHORTCUTS: Record<string, string> = {
  dashboard: '/dashboard',
  people: '/people',
  payroll: '/payroll',
  recruiting: '/recruiting',
  performance: '/performance',
  learning: '/learning',
  expenses: '/expense',
  expense: '/expense',
  compliance: '/compliance',
  settings: '/settings',
  'org chart': '/people/org-chart',
  'team calendar': '/people/team-calendar',
  analytics: '/analytics/predictions',
  'board reports': '/analytics/board-reports',
  benefits: '/benefits',
  compensation: '/compensation',
  engagement: '/engagement',
  finance: '/finance',
  it: '/it',
  'time attendance': '/time-attendance',
  'time off': '/time-attendance',
  documents: '/documents',
  onboarding: '/onboarding',
  offboarding: '/offboarding',
  chat: '/chat',
  workflows: '/workflow-studio',
}

// ---- Proactive Insights ----

export function getProactiveInsights(store: any): AssistantResponse[] {
  const insights: AssistantResponse[] = []

  // Expired/overdue training
  const now = new Date().toISOString().split('T')[0]
  const expiredCerts =
    store.enrollments?.filter(
      (e: any) => e.status === 'overdue' || (e.due_date && e.due_date < now && e.status !== 'completed')
    ) || []
  if (expiredCerts.length > 0) {
    insights.push({
      type: 'insight',
      text: `${expiredCerts.length} employees have expired or overdue training certifications.`,
      confidence: 0.9,
      actions: [{ label: 'View Compliance', type: 'navigate', payload: '/learning', icon: 'AlertTriangle' }],
    })
  }

  // Pending approvals
  const pendingLeave = store.leaveRequests?.filter((l: any) => l.status === 'pending')?.length || 0
  const pendingExpense =
    store.expenseReports?.filter(
      (e: any) => e.status === 'pending' || e.status === 'submitted'
    )?.length || 0
  const pending = pendingLeave + pendingExpense
  if (pending > 0) {
    insights.push({
      type: 'insight',
      text: `You have ${pending} pending approvals waiting (${pendingLeave} leave, ${pendingExpense} expense).`,
      confidence: 0.95,
      actions: [{ label: 'Review Now', type: 'navigate', payload: '/dashboard', icon: 'CheckSquare' }],
    })
  }

  // Upcoming payroll
  const nextPayroll = store.payrollSchedules?.find(
    (s: any) => s.next_run_date && s.next_run_date >= now
  )
  if (nextPayroll) {
    insights.push({
      type: 'insight',
      text: `Next payroll run scheduled for ${nextPayroll.next_run_date}.`,
      confidence: 0.8,
      actions: [{ label: 'View Payroll', type: 'navigate', payload: '/payroll', icon: 'Calendar' }],
    })
  }

  // Compliance alerts
  const criticalAlerts =
    store.complianceAlerts?.filter((a: any) => a.severity === 'critical' || a.severity === 'high') || []
  if (criticalAlerts.length > 0) {
    insights.push({
      type: 'insight',
      text: `${criticalAlerts.length} critical compliance alerts need attention.`,
      confidence: 0.95,
      actions: [{ label: 'View Alerts', type: 'navigate', payload: '/compliance', icon: 'Shield' }],
    })
  }

  // Open positions without applications
  const openJobs = store.jobPostings?.filter(
    (j: any) => j.status === 'published' || j.status === 'open' || j.status === 'active'
  ) || []
  if (openJobs.length > 3) {
    insights.push({
      type: 'insight',
      text: `${openJobs.length} open positions — review your recruiting pipeline.`,
      confidence: 0.7,
      actions: [{ label: 'View Recruiting', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' }],
    })
  }

  // Budget overspend
  const overBudget = store.budgets?.filter((b: any) => {
    const spent = b.spent || b.used || 0
    const total = b.amount || b.total || 1
    return spent > total
  }) || []
  if (overBudget.length > 0) {
    insights.push({
      type: 'insight',
      text: `${overBudget.length} budget${overBudget.length > 1 ? 's' : ''} over-spent. Review immediately.`,
      confidence: 0.9,
      actions: [{ label: 'View Budgets', type: 'navigate', payload: '/finance', icon: 'AlertTriangle' }],
    })
  }

  return insights
}

// ---- Main Processor ----

export function processAssistantQuery(query: string, store: any): AssistantResponse {
  const trimmed = query.trim()

  // Try action patterns first (higher specificity)
  for (const { pattern, handler } of ACTION_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return handler(store, match)
  }

  // Try data query patterns
  for (const { pattern, handler } of QUERY_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return handler(store, match)
  }

  // Navigation shortcuts
  const lower = trimmed.toLowerCase()
  // Sort by length descending so "board reports" matches before generic "board"
  const sortedNavEntries = Object.entries(NAV_SHORTCUTS).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, path] of sortedNavEntries) {
    if (lower.includes(keyword)) {
      return {
        type: 'navigation',
        text: `Opening ${keyword}...`,
        confidence: 0.8,
        actions: [
          {
            label: `Go to ${keyword.charAt(0).toUpperCase() + keyword.slice(1)}`,
            type: 'navigate',
            payload: path,
            icon: 'ArrowRight',
          },
        ],
      }
    }
  }

  // Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(lower)) {
    const active = activeEmployees(store)
    return {
      type: 'answer',
      text: `Hello! I'm Tempo AI. Your organization has ${active.length} active employees. How can I help you today?`,
      confidence: 0.9,
    }
  }

  // Help / what can you do
  if (/^(help|what can you|what do you|how to use|commands|capabilities)/i.test(lower)) {
    return {
      type: 'answer',
      text: `I can help you with:\n\n  People: headcount, leave, turnover, find employees\n  Finance: payroll, budgets, expenses, invoices\n  Operations: approvals, compliance, training, IT\n  Actions: create job postings, approve expenses, schedule meetings\n  Navigate: just say any module name\n\nTry asking: "How many employees?" or "Show pending approvals"`,
      confidence: 1.0,
    }
  }

  // Fallback
  return {
    type: 'answer',
    text: `I'm not sure how to answer that. Try asking:\n  "How many employees do we have?"\n  "Who's on leave today?"\n  "What's our turnover rate?"\n  "Show pending approvals"\n  "Create a job posting for Senior Analyst"\n  "Headcount by department"`,
    confidence: 0.3,
  }
}
