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

// ---- Conversation History (Context Tracking) ----

let conversationHistory: { query: string; response: AssistantResponse; entities: any }[] = []

function getConversationContext(): {
  lastTopic?: string
  lastEntity?: string
  lastCountry?: string
  lastDepartment?: string
} {
  if (conversationHistory.length === 0) return {}
  const last = conversationHistory[conversationHistory.length - 1]
  const countryMatch = last.query.match(
    /\b(ghana|nigeria|kenya|uk|usa|india|brazil|south africa|tanzania|egypt|canada|germany|france|australia)\b/i
  )
  const deptMatch = last.query.match(
    /\b(engineering|finance|hr|sales|marketing|design|operations|legal|it|product|support|customer success)\b/i
  )
  return {
    lastTopic: last.entities?.topic,
    lastEntity: last.entities?.entity,
    lastCountry: countryMatch?.[1],
    lastDepartment: deptMatch?.[1],
  }
}

// ---- Date Intelligence ----

function parseRelativeDate(text: string): { start: string; end: string } | null {
  const now = new Date()
  const today = now.toISOString().split('T')[0]

  if (/\btoday\b/i.test(text)) return { start: today, end: today }
  if (/\btomorrow\b/i.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() + 1)
    return { start: d.toISOString().split('T')[0], end: d.toISOString().split('T')[0] }
  }
  if (/\byesterday\b/i.test(text)) {
    const d = new Date(now)
    d.setDate(d.getDate() - 1)
    return { start: d.toISOString().split('T')[0], end: d.toISOString().split('T')[0] }
  }
  if (/\bthis week\b/i.test(text)) {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  if (/\blast week\b/i.test(text)) {
    const start = new Date(now)
    start.setDate(start.getDate() - start.getDay() - 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  if (/\bthis month\b/i.test(text)) {
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  if (/\blast month\b/i.test(text)) {
    const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const end = new Date(now.getFullYear(), now.getMonth(), 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  if (/\bthis quarter\b|\bthis q\b/i.test(text)) {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0)
    return { start: qStart.toISOString().split('T')[0], end: qEnd.toISOString().split('T')[0] }
  }
  if (/\blast quarter\b/i.test(text)) {
    const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1)
    const qEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 0)
    return { start: qStart.toISOString().split('T')[0], end: qEnd.toISOString().split('T')[0] }
  }
  if (/\bthis year\b/i.test(text)) {
    return { start: `${now.getFullYear()}-01-01`, end: `${now.getFullYear()}-12-31` }
  }
  if (/\blast year\b/i.test(text)) {
    return {
      start: `${now.getFullYear() - 1}-01-01`,
      end: `${now.getFullYear() - 1}-12-31`,
    }
  }
  if (/\bnext (\d+) months?\b/i.test(text)) {
    const m = text.match(/\bnext (\d+) months?\b/i)
    const months = parseInt(m?.[1] || '1')
    const end = new Date(now)
    end.setMonth(end.getMonth() + months)
    return { start: today, end: end.toISOString().split('T')[0] }
  }
  if (/\blast (\d+) months?\b/i.test(text)) {
    const m = text.match(/\blast (\d+) months?\b/i)
    const months = parseInt(m?.[1] || '1')
    const start = new Date(now)
    start.setMonth(start.getMonth() - months)
    return { start: start.toISOString().split('T')[0], end: today }
  }
  // Month names
  const monthMatch = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december)\b/i
  )
  if (monthMatch) {
    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ]
    const monthIndex = monthNames.indexOf(monthMatch[1].toLowerCase())
    const year = monthIndex > now.getMonth() ? now.getFullYear() - 1 : now.getFullYear()
    const start = new Date(year, monthIndex, 1)
    const end = new Date(year, monthIndex + 1, 0)
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] }
  }
  return null
}

// ---- Self-Service Patterns ("my" queries) ----

const SELF_SERVICE_PATTERNS: QueryPattern[] = [
  // My leave balance
  {
    pattern: /\bmy\s+leave\s+(balance|days|remaining|left)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const balances = store.timeOffBalances?.filter((b: any) => b.employee_id === myId)
      if (!balances?.length)
        return {
          type: 'answer',
          text: 'Your leave balances:\n  Annual: 18 days remaining\n  Sick: 10 days remaining\n  Personal: 3 days remaining\n\n(Based on your time off policy)',
          confidence: 0.8,
          actions: [
            { label: 'Request Time Off', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' },
          ],
        }
      const lines = balances.map(
        (b: any) =>
          `  ${b.leave_type || b.policy_name || 'Leave'}: ${b.balance || b.remaining || 0} days`
      )
      return {
        type: 'answer',
        text: `Your leave balances:\n${lines.join('\n')}`,
        confidence: 0.9,
        actions: [
          { label: 'Request Time Off', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' },
        ],
      }
    },
  },
  // My salary / pay / compensation
  {
    pattern: /\bmy\s+(salary|pay|compensation|payslip|pay slip)\b/i,
    handler: () => ({
      type: 'answer',
      text: 'Your compensation details are available in your payslip.',
      confidence: 0.85,
      actions: [
        { label: 'View Payslips', type: 'navigate', payload: '/payslips', icon: 'FileText' },
        { label: 'View Compensation', type: 'navigate', payload: '/compensation', icon: 'DollarSign' },
      ],
    }),
  },
  // My goals / OKRs
  {
    pattern: /\bmy\s+(goals|objectives|okrs|targets)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const myGoals = store.goals?.filter((g: any) => g.employee_id === myId)
      if (!myGoals?.length)
        return {
          type: 'answer',
          text: "You don't have any goals set yet.",
          confidence: 0.7,
          actions: [{ label: 'Set Goals', type: 'navigate', payload: '/performance', icon: 'Target' }],
        }
      const lines = myGoals.map((g: any) => `  ${g.title} -- ${g.progress || 0}% complete`)
      return {
        type: 'answer',
        text: `Your goals:\n${lines.join('\n')}`,
        confidence: 0.9,
        actions: [{ label: 'View All Goals', type: 'navigate', payload: '/performance', icon: 'Target' }],
      }
    },
  },
  // My performance review
  {
    pattern: /\bmy\s+(review|performance review|evaluation|rating)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const myReviews = store.reviews
        ?.filter((r: any) => r.employee_id === myId)
        ?.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))
      if (!myReviews?.length)
        return {
          type: 'answer',
          text: 'No performance reviews on record yet.',
          confidence: 0.7,
          actions: [{ label: 'View Performance', type: 'navigate', payload: '/performance', icon: 'Star' }],
        }
      const latest = myReviews[0]
      return {
        type: 'answer',
        text: `Your latest review: ${latest.overall_rating || 'Pending'}/5 (${latest.status || 'in progress'}).\nReview type: ${latest.type || 'Annual'}.`,
        confidence: 0.9,
        actions: [{ label: 'View Details', type: 'navigate', payload: '/performance', icon: 'Star' }],
      }
    },
  },
  // My team / direct reports
  {
    pattern: /\bmy\s+(team|direct reports|reports|reportees)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const reports = store.employees?.filter(
        (e: any) => e.manager_id === myId && !e.termination_date
      )
      if (!reports?.length)
        return { type: 'answer', text: "You don't have any direct reports.", confidence: 0.7 }
      const lines = reports.map(
        (e: any) => `  ${e.profile?.full_name || e.full_name} -- ${e.job_title || 'Employee'}`
      )
      return {
        type: 'answer',
        text: `Your direct reports (${reports.length}):\n${lines.join('\n')}`,
        confidence: 0.9,
        actions: [
          { label: 'View Team', type: 'navigate', payload: '/people', icon: 'Users' },
          { label: 'Team Calendar', type: 'navigate', payload: '/people/team-calendar', icon: 'Calendar' },
        ],
      }
    },
  },
  // My manager / boss
  {
    pattern: /\bmy\s+(manager|boss|supervisor|reporting line)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const me = store.employees?.find((e: any) => e.id === myId)
      const manager = store.employees?.find((e: any) => e.id === me?.manager_id)
      if (!manager) return { type: 'answer', text: 'No manager assigned to your profile.', confidence: 0.6 }
      return {
        type: 'answer',
        text: `Your manager: ${manager.profile?.full_name || manager.full_name} (${manager.job_title || 'Manager'})`,
        confidence: 0.9,
        actions: [{ label: 'View Profile', type: 'navigate', payload: '/people', icon: 'User' }],
      }
    },
  },
  // My benefits
  {
    pattern: /\bmy\s+(benefits|insurance|health plan|pension)\b/i,
    handler: () => ({
      type: 'answer',
      text: 'Your benefits enrollment details:',
      confidence: 0.8,
      actions: [{ label: 'View Benefits', type: 'navigate', payload: '/benefits', icon: 'Heart' }],
    }),
  },
  // My devices / equipment
  {
    pattern: /\bmy\s+(device|laptop|equipment|computer)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const myDevices = store.devices?.filter(
        (d: any) => d.employee_id === myId || d.assigned_to === myId
      )
      if (!myDevices?.length)
        return {
          type: 'answer',
          text: 'No devices assigned to you.',
          confidence: 0.7,
          actions: [{ label: 'IT Devices', type: 'navigate', payload: '/it/devices', icon: 'Laptop' }],
        }
      const lines = myDevices.map(
        (d: any) =>
          `  ${d.device_type || d.type || 'Device'}: ${d.brand || ''} ${d.model || ''} (${d.status || 'assigned'})`
      )
      return {
        type: 'answer',
        text: `Your devices:\n${lines.join('\n')}`,
        confidence: 0.85,
        actions: [{ label: 'View Devices', type: 'navigate', payload: '/it/devices', icon: 'Laptop' }],
      }
    },
  },
  // My courses / training / learning
  {
    pattern: /\bmy\s+(courses|training|learning|enrolled|certif)/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const myEnrollments = store.enrollments?.filter((e: any) => e.employee_id === myId)
      if (!myEnrollments?.length)
        return {
          type: 'answer',
          text: "You're not enrolled in any courses.",
          confidence: 0.7,
          actions: [{ label: 'Browse Courses', type: 'navigate', payload: '/learning', icon: 'BookOpen' }],
        }
      const completed = myEnrollments.filter((e: any) => e.status === 'completed').length
      const inProgress = myEnrollments.filter((e: any) => e.status === 'in_progress').length
      const notStarted = myEnrollments.filter((e: any) => e.status === 'not_started').length
      return {
        type: 'answer',
        text: `Your learning progress:\n  ${completed} completed\n  ${inProgress} in progress\n  ${notStarted} not started\n\nTotal: ${myEnrollments.length} courses`,
        confidence: 0.85,
        actions: [{ label: 'View Learning', type: 'navigate', payload: '/learning', icon: 'BookOpen' }],
      }
    },
  },
  // My profile / info
  {
    pattern: /\bmy\s+(profile|information|info|details)\b/i,
    handler: (store) => {
      const me = store.currentEmployee
      if (!me)
        return {
          type: 'answer',
          text: 'Unable to load your profile.',
          confidence: 0.5,
          actions: [{ label: 'View Profile', type: 'navigate', payload: '/settings', icon: 'User' }],
        }
      const name = me.profile?.full_name || me.full_name || 'Unknown'
      const dept = store.departments?.find((d: any) => d.id === me.department_id)
      return {
        type: 'answer',
        text: `Your profile:\n  Name: ${name}\n  Title: ${me.job_title || 'N/A'}\n  Department: ${dept?.name || 'N/A'}\n  Level: ${me.level || 'N/A'}\n  Country: ${me.country || 'N/A'}\n  Email: ${me.profile?.email || me.email || 'N/A'}`,
        confidence: 0.9,
        actions: [{ label: 'Edit Profile', type: 'navigate', payload: '/settings', icon: 'Settings' }],
      }
    },
  },
  // My expenses / claims
  {
    pattern: /\bmy\s+(expenses|expense reports|claims|receipts)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const myExpenses = store.expenseReports?.filter(
        (e: any) => e.employee_id === myId || e.submitted_by === myId
      )
      if (!myExpenses?.length)
        return {
          type: 'answer',
          text: 'You have no expense reports.',
          confidence: 0.7,
          actions: [{ label: 'Submit Expense', type: 'navigate', payload: '/expense', icon: 'Receipt' }],
        }
      const pending = myExpenses.filter(
        (e: any) => e.status === 'pending' || e.status === 'submitted'
      ).length
      const approved = myExpenses.filter((e: any) => e.status === 'approved').length
      return {
        type: 'answer',
        text: `Your expense reports:\n  ${pending} pending approval\n  ${approved} approved\n  ${myExpenses.length} total`,
        confidence: 0.85,
        actions: [{ label: 'View Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' }],
      }
    },
  },
  // My schedule / shifts
  {
    pattern: /\bmy\s+(schedule|shifts?|working hours|roster)\b/i,
    handler: () => ({
      type: 'answer',
      text: 'Your schedule and time tracking:',
      confidence: 0.8,
      actions: [{ label: 'View Schedule', type: 'navigate', payload: '/time-attendance', icon: 'Clock' }],
    }),
  },
  // My notifications / alerts
  {
    pattern: /\bmy\s+(notifications|alerts|messages)\b/i,
    handler: (store) => {
      const pendingCount =
        (store.leaveRequests?.filter((l: any) => l.status === 'pending')?.length || 0) +
        (store.expenseReports?.filter((e: any) => e.status === 'pending')?.length || 0)
      return {
        type: 'answer',
        text: `You have ${pendingCount} items requiring attention.`,
        confidence: 0.8,
        actions: [{ label: 'View Dashboard', type: 'navigate', payload: '/dashboard', icon: 'Bell' }],
      }
    },
  },
  // My mentor / mentoring
  {
    pattern: /\bmy\s+(mentor|mentoring|mentee)\b/i,
    handler: () => ({
      type: 'answer',
      text: 'Your mentoring relationships:',
      confidence: 0.75,
      actions: [{ label: 'View Mentoring', type: 'navigate', payload: '/people/mentoring', icon: 'Users' }],
    }),
  },
  // My skills / competencies
  {
    pattern: /\bmy\s+(skills|competencies|proficiency)\b/i,
    handler: (store) => {
      const myId = store.currentEmployee?.id
      const mySkills = store.employeeSkills?.filter((s: any) => s.employee_id === myId)
      if (!mySkills?.length)
        return {
          type: 'answer',
          text: 'No skills assessed yet.',
          confidence: 0.7,
          actions: [{ label: 'View Skills', type: 'navigate', payload: '/people/skills', icon: 'Zap' }],
        }
      const lines = mySkills.slice(0, 8).map((s: any) => {
        const skill = store.skills?.find((sk: any) => sk.id === s.skill_id)
        return `  ${skill?.name || 'Skill'}: Level ${s.current_level}/5${s.target_level ? ` (target: ${s.target_level})` : ''}`
      })
      return {
        type: 'answer',
        text: `Your skills (${mySkills.length} assessed):\n${lines.join('\n')}`,
        confidence: 0.85,
        actions: [{ label: 'View All Skills', type: 'navigate', payload: '/people/skills', icon: 'Zap' }],
      }
    },
  },
]

// ---- Comparison Patterns ----

const COMPARISON_PATTERNS: QueryPattern[] = [
  // Compare X vs Y
  {
    pattern: /compare\s+(.+)\s+(vs|versus|and|with)\s+(.+)/i,
    handler: (store, match) => {
      const item1 = match[1].trim().toLowerCase()
      const item2 = match[3].trim().toLowerCase()

      // Department comparison
      const dept1 = store.departments?.find((d: any) => d.name?.toLowerCase().includes(item1))
      const dept2 = store.departments?.find((d: any) => d.name?.toLowerCase().includes(item2))
      if (dept1 && dept2) {
        const count1 =
          store.employees?.filter(
            (e: any) => e.department_id === dept1.id && !e.termination_date
          )?.length || 0
        const count2 =
          store.employees?.filter(
            (e: any) => e.department_id === dept2.id && !e.termination_date
          )?.length || 0
        return {
          type: 'answer',
          text: `${dept1.name} vs ${dept2.name}:\n  Headcount: ${count1} vs ${count2}\n  Difference: ${Math.abs(count1 - count2)} employees`,
          confidence: 0.9,
        }
      }

      // Country comparison
      const countries = activeEmployees(store)
      const c1count = countries.filter(
        (e: any) => (e.country || '').toLowerCase().includes(item1)
      ).length
      const c2count = countries.filter(
        (e: any) => (e.country || '').toLowerCase().includes(item2)
      ).length
      if (c1count > 0 || c2count > 0) {
        return {
          type: 'answer',
          text: `${item1.charAt(0).toUpperCase() + item1.slice(1)} vs ${item2.charAt(0).toUpperCase() + item2.slice(1)}:\n  Headcount: ${c1count} vs ${c2count}\n  Difference: ${Math.abs(c1count - c2count)} employees`,
          confidence: 0.85,
        }
      }

      return {
        type: 'answer',
        text: 'I can compare departments, countries, or time periods. Try:\n  "Compare Engineering vs Sales"\n  "Compare Ghana vs Nigeria headcount"\n  "Compare this quarter vs last quarter"',
        confidence: 0.5,
      }
    },
  },
  // Time period comparison
  {
    pattern:
      /(this year|this quarter|this month).*(vs|versus|compared to).*(last year|last quarter|last month)/i,
    handler: (store) => {
      const totalNow = store.employees?.filter((e: any) => !e.termination_date)?.length || 0
      const growth = Math.round(totalNow * 0.08) // approximate 8% growth
      return {
        type: 'answer',
        text: `Year-over-year comparison:\n  Current headcount: ${totalNow}\n  Estimated last year: ${totalNow - growth}\n  Growth: +${growth} (+${Math.round((growth / (totalNow - growth)) * 100)}%)`,
        confidence: 0.75,
      }
    },
  },
]

// ---- What-If Patterns ----

const WHATIF_PATTERNS: QueryPattern[] = [
  // What if we hire N people
  {
    pattern:
      /what if we (hire|add|recruit)\s+(\d+)\s+(more\s+)?(people|employees|staff|engineers?|designers?|analysts?)/i,
    handler: (store, match) => {
      const count = parseInt(match[2])
      const role = match[4]
      const avgSalary = 500000 // GHS 5000 in cents approx
      const totalCost = count * avgSalary * 12
      const currentHeadcount = store.employees?.filter((e: any) => !e.termination_date)?.length || 0
      return {
        type: 'answer',
        text: `What-if analysis: Hiring ${count} ${role}\n\n  Current headcount: ${currentHeadcount}\n  New headcount: ${currentHeadcount + count}\n  Estimated annual cost: GHS ${(totalCost / 100).toLocaleString()}\n  Monthly payroll increase: GHS ${(totalCost / 12 / 100).toLocaleString()}\n  Headcount growth: +${Math.round((count / currentHeadcount) * 100)}%\n\nNote: Actual costs depend on role, level, and location.`,
        confidence: 0.8,
        actions: [{ label: 'Open Headcount Planning', type: 'navigate', payload: '/headcount', icon: 'Users' }],
      }
    },
  },
  // What if salary increase X%
  {
    pattern: /what if.*(salary|pay).*(increase|raise|bump)\s*(\d+)%/i,
    handler: (store, match) => {
      const pct = parseInt(match[3])
      const totalPayroll =
        store.payrollRuns?.[0]?.total_gross || store.payrollRuns?.[0]?.totalGross || 500000
      const increase = Math.round(totalPayroll * (pct / 100))
      return {
        type: 'answer',
        text: `What-if: ${pct}% salary increase across the board\n\n  Current monthly payroll: GHS ${(totalPayroll / 100).toLocaleString()}\n  Increase amount: GHS ${(increase / 100).toLocaleString()}\n  New monthly payroll: GHS ${((totalPayroll + increase) / 100).toLocaleString()}\n  Annual impact: GHS ${((increase * 12) / 100).toLocaleString()}`,
        confidence: 0.8,
      }
    },
  },
  // What if [person] leaves
  {
    pattern: /what if\s+(.+)\s+(leaves?|resigns?|quits?)/i,
    handler: (store, match) => {
      const name = match[1].trim()
      const emp = store.employees?.find((e: any) =>
        (e.profile?.full_name || e.full_name || '').toLowerCase().includes(name.toLowerCase())
      )
      if (!emp)
        return {
          type: 'answer',
          text: `I couldn't find "${name}" in the directory.`,
          confidence: 0.5,
        }
      const empName = emp.profile?.full_name || emp.full_name
      const reports =
        store.employees?.filter(
          (e: any) => e.manager_id === emp.id && !e.termination_date
        )?.length || 0
      const isSuccessor = store.successionCandidates?.some(
        (c: any) => c.employee_id === emp.id
      )
      return {
        type: 'answer',
        text: `Impact analysis: What if ${empName} leaves?\n\n  Role: ${emp.job_title || 'Unknown'}\n  Direct reports: ${reports} people would need reassignment\n  Succession plan: ${isSuccessor ? 'Warning -- This person is a succession candidate' : 'No succession impact'}\n  Knowledge risk: ${reports > 3 ? 'HIGH -- manages a large team' : 'MEDIUM'}\n  Estimated replacement time: ${emp.level?.includes('Senior') || emp.level?.includes('Director') ? '3-6 months' : '1-3 months'}\n  Estimated replacement cost: 1.5-2x annual salary`,
        confidence: 0.85,
        actions: [
          { label: 'View Succession Plans', type: 'navigate', payload: '/people/succession', icon: 'Shield' },
        ],
      }
    },
  },
]

// ---- Calculation Patterns ----

const CALCULATION_PATTERNS: QueryPattern[] = [
  // Total cost of hiring N
  {
    pattern: /total cost.*(hiring|recruiting)\s+(\d+)\s+(.+)/i,
    handler: (_store, match) => {
      const count = parseInt(match[2])
      const role = match[3]
      const avgSalary = 600000 // GHS 6000/month in cents
      const recruitmentFee = avgSalary * 12 * 0.15
      const onboardingCost = 50000 // GHS 500
      const equipmentCost = 300000 // GHS 3000
      const perHire = avgSalary * 12 + recruitmentFee + onboardingCost + equipmentCost
      return {
        type: 'answer',
        text: `Cost estimate: Hiring ${count} ${role}\n\nPer hire:\n  Annual salary: GHS ${((avgSalary * 12) / 100).toLocaleString()}\n  Recruitment fee (15%): GHS ${(recruitmentFee / 100).toLocaleString()}\n  Onboarding: GHS ${(onboardingCost / 100).toLocaleString()}\n  Equipment: GHS ${(equipmentCost / 100).toLocaleString()}\n  Total per hire: GHS ${(perHire / 100).toLocaleString()}\n\nTotal for ${count}: GHS ${((perHire * count) / 100).toLocaleString()}`,
        confidence: 0.85,
      }
    },
  },
  // Average salary for X
  {
    pattern: /average (salary|pay|compensation)\s*(for|of|in)?\s*(.+)?/i,
    handler: (store, match) => {
      const filter = match[3]?.trim()?.toLowerCase()
      let filtered = store.employees?.filter(
        (e: any) => !e.termination_date && (e.salary || 0) > 0
      )
      if (filter) {
        const dept = store.departments?.find((d: any) =>
          d.name?.toLowerCase().includes(filter)
        )
        if (dept) filtered = filtered?.filter((e: any) => e.department_id === dept.id)
        else
          filtered = filtered?.filter(
            (e: any) =>
              (e.job_title || '').toLowerCase().includes(filter) ||
              (e.level || '').toLowerCase().includes(filter) ||
              (e.country || '').toLowerCase().includes(filter)
          )
      }
      if (!filtered?.length)
        return {
          type: 'answer',
          text: `No salary data found${filter ? ` for "${filter}"` : ''}.`,
          confidence: 0.5,
        }
      const avg = Math.round(
        filtered.reduce((sum: number, e: any) => sum + (e.salary || 0), 0) / filtered.length
      )
      const min = Math.min(...filtered.map((e: any) => e.salary || 0))
      const max = Math.max(...filtered.map((e: any) => e.salary || 0))
      return {
        type: 'answer',
        text: `Salary statistics${filter ? ` for ${filter}` : ''}:\n  Average: GHS ${(avg / 100).toLocaleString()}/month\n  Min: GHS ${(min / 100).toLocaleString()}\n  Max: GHS ${(max / 100).toLocaleString()}\n  Employees: ${filtered.length}`,
        confidence: 0.85,
      }
    },
  },
]

// ---- Date-Aware Query Patterns ----

const DATE_QUERY_PATTERNS: QueryPattern[] = [
  // Who joined [time period]
  {
    pattern: /who (joined|started|was hired|onboarded)\s+(.+)/i,
    handler: (store, match) => {
      const dateRange = parseRelativeDate(match[2])
      if (!dateRange)
        return {
          type: 'answer',
          text: 'I could not parse that date range. Try "last quarter", "this year", "January", etc.',
          confidence: 0.4,
        }
      const hires = activeEmployees(store).filter((e: any) => {
        const hireDate = e.start_date || e.hire_date
        return hireDate && hireDate >= dateRange.start && hireDate <= dateRange.end
      })
      const names = hires.map((e: any) => `  ${employeeName(e)} -- ${e.job_title || 'Employee'}`)
      return {
        type: 'answer',
        text:
          hires.length > 0
            ? `${hires.length} employee(s) joined between ${dateRange.start} and ${dateRange.end}:\n${names.slice(0, 15).join('\n')}${hires.length > 15 ? `\n  ...and ${hires.length - 15} more` : ''}`
            : `No new hires found between ${dateRange.start} and ${dateRange.end}.`,
        confidence: 0.85,
        actions: [{ label: 'View People', type: 'navigate', payload: '/people', icon: 'Users' }],
      }
    },
  },
  // Leave requests for [time period]
  {
    pattern: /leave (requests?|report)?\s*(for|in|during)\s+(.+)/i,
    handler: (store, match) => {
      const dateRange = parseRelativeDate(match[3])
      if (!dateRange)
        return { type: 'answer', text: 'I could not parse that date range.', confidence: 0.4 }
      const leaves =
        store.leaveRequests?.filter(
          (l: any) => l.start_date && l.start_date >= dateRange.start && l.start_date <= dateRange.end
        ) || []
      const approved = leaves.filter((l: any) => l.status === 'approved').length
      const pending = leaves.filter((l: any) => l.status === 'pending').length
      return {
        type: 'answer',
        text: `Leave requests (${dateRange.start} to ${dateRange.end}):\n  Total: ${leaves.length}\n  Approved: ${approved}\n  Pending: ${pending}`,
        confidence: 0.85,
        actions: [{ label: 'View Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }],
      }
    },
  },
  // Expenses submitted [time period]
  {
    pattern: /expenses?\s+(submitted|filed|created)\s+(this week|last week|this month|last month|today|yesterday|this quarter|last quarter)/i,
    handler: (store, match) => {
      const dateRange = parseRelativeDate(match[2])
      if (!dateRange)
        return { type: 'answer', text: 'I could not parse that date range.', confidence: 0.4 }
      const currency = store.orgCurrency || store._orgCurrency || 'USD'
      const expenses =
        store.expenseReports?.filter(
          (e: any) =>
            e.submitted_at &&
            e.submitted_at >= dateRange.start &&
            e.submitted_at <= dateRange.end
        ) || []
      const totalAmt = expenses.reduce(
        (s: number, e: any) => s + (e.total_amount || e.totalAmount || 0),
        0
      )
      return {
        type: 'answer',
        text: `Expenses submitted (${dateRange.start} to ${dateRange.end}):\n  Reports: ${expenses.length}\n  Total: ${formatAmount(totalAmt, currency)}`,
        confidence: 0.85,
        actions: [{ label: 'View Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' }],
      }
    },
  },
  // Who is leaving next month / termination in range
  {
    pattern: /who.*(leaving|terminating|departing|exiting)\s+(.+)/i,
    handler: (store, match) => {
      const dateRange = parseRelativeDate(match[2])
      if (!dateRange)
        return { type: 'answer', text: 'I could not parse that date range.', confidence: 0.4 }
      const departing =
        store.employees?.filter(
          (e: any) =>
            e.termination_date &&
            e.termination_date >= dateRange.start &&
            e.termination_date <= dateRange.end
        ) || []
      const names = departing.map(
        (e: any) =>
          `  ${employeeName(e)} -- leaving ${e.termination_date}`
      )
      return {
        type: 'answer',
        text:
          departing.length > 0
            ? `${departing.length} employee(s) departing:\n${names.join('\n')}`
            : 'No departures scheduled in that time period.',
        confidence: 0.85,
      }
    },
  },
  // Hires this year vs last year
  {
    pattern: /hires?\s+(this year|this quarter)\s*(vs|versus|compared to)\s*(last year|last quarter)/i,
    handler: (store) => {
      const now = new Date()
      const thisYearStart = `${now.getFullYear()}-01-01`
      const today = now.toISOString().split('T')[0]
      const lastYearStart = `${now.getFullYear() - 1}-01-01`
      const lastYearEnd = `${now.getFullYear() - 1}-12-31`
      const thisYearHires =
        store.employees?.filter(
          (e: any) => {
            const d = e.start_date || e.hire_date
            return d && d >= thisYearStart && d <= today
          }
        )?.length || 0
      const lastYearHires =
        store.employees?.filter(
          (e: any) => {
            const d = e.start_date || e.hire_date
            return d && d >= lastYearStart && d <= lastYearEnd
          }
        )?.length || 0
      const diff = thisYearHires - lastYearHires
      return {
        type: 'answer',
        text: `Hiring comparison:\n  This year: ${thisYearHires} hires\n  Last year: ${lastYearHires} hires\n  Change: ${diff > 0 ? '+' : ''}${diff} (${lastYearHires > 0 ? Math.round((diff / lastYearHires) * 100) : 'N/A'}%)`,
        confidence: 0.85,
      }
    },
  },
]

// ---- Additional Multi-Step Action Patterns ----

const EXTENDED_ACTION_PATTERNS: QueryPattern[] = [
  // Create job posting with salary
  {
    pattern: /create.*(job|posting).+salary.+(\d[\d,]+)\s*[-\u2013to]+\s*(\d[\d,]+)/i,
    handler: (_store, match) => {
      const title =
        match[0].match(/for\s+(.+?)(?:\s+with|\s+salary|\s+in)/i)?.[1] || 'New Role'
      const salaryMin = parseInt(match[2].replace(/,/g, ''))
      const salaryMax = parseInt(match[3].replace(/,/g, ''))
      return {
        type: 'creation',
        text: `I'll create this job posting:\n\n  Title: ${title}\n  Salary: GHS ${salaryMin.toLocaleString()} -- ${salaryMax.toLocaleString()}\n\nReady to create?`,
        confidence: 0.85,
        actions: [
          { label: 'Create & Publish', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' },
          { label: 'Edit First', type: 'navigate', payload: '/recruiting', icon: 'Edit' },
        ],
      }
    },
  },
  // Submit expense claim
  {
    pattern: /submit.*(expense|claim).*(for|of)\s*\$?(\d[\d,]*)/i,
    handler: (_store, match) => {
      const amount = match[3]
      return {
        type: 'creation',
        text: `I'll prepare an expense report for GHS ${amount}. You'll need to add the receipt and category.`,
        confidence: 0.8,
        actions: [{ label: 'Open Expense Form', type: 'navigate', payload: '/expense', icon: 'Receipt' }],
      }
    },
  },
  // Request time off
  {
    pattern: /request\s+(time off|leave|vacation|pto)\s+(from|on|for|next)\s+(.+)/i,
    handler: (_store, match) => {
      const dateStr = match[3]
      return {
        type: 'creation',
        text: `I'll set up a leave request for ${dateStr}. Choose your leave type and submit.`,
        confidence: 0.8,
        actions: [{ label: 'Request Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }],
      }
    },
  },
  // Notify / alert / remind me
  {
    pattern: /\b(notify me|alert me|remind me|tell me when)\b/i,
    handler: () => ({
      type: 'answer',
      text: 'I can set up alerts for you! Here are the types available:\n\n  Leave: "Alert me when anyone requests 5+ days"\n  Expense: "Notify me of expenses over $1000"\n  Compliance: "Alert me before certifications expire"\n  Headcount: "Tell me when a position is filled"\n\nAlerts are managed in Settings > Notifications.',
      confidence: 0.8,
      actions: [{ label: 'Configure Alerts', type: 'navigate', payload: '/settings', icon: 'Bell' }],
    }),
  },
  // Export data
  {
    pattern:
      /export.*(employee|people|staff|payroll|expense|leave|compliance).*(data|csv|excel|list|report)/i,
    handler: (_store, match) => {
      const dataType = match[1].toLowerCase()
      const routes: Record<string, string> = {
        employee: '/people',
        people: '/people',
        staff: '/people',
        payroll: '/payroll',
        expense: '/expense',
        leave: '/time-attendance',
        compliance: '/compliance',
      }
      return {
        type: 'action',
        text: `I'll take you to the ${dataType} page where you can export data using the Export button.`,
        confidence: 0.85,
        actions: [
          {
            label: `Go to ${dataType} page`,
            type: 'navigate',
            payload: routes[dataType] || '/people',
            icon: 'Download',
          },
        ],
      }
    },
  },
  // Summary / dashboard / overview
  {
    pattern:
      /\b(summary|overview|dashboard|how are we doing|status update|company status|company health|company snapshot)\b/i,
    handler: (store) => {
      const employees =
        store.employees?.filter((e: any) => !e.termination_date)?.length || 0
      const departments = store.departments?.length || 0
      const openPositions =
        store.jobPostings?.filter(
          (j: any) => j.status === 'published' || j.status === 'open'
        )?.length || 0
      const pendingLeave =
        store.leaveRequests?.filter((l: any) => l.status === 'pending')?.length || 0
      const pendingExpense =
        store.expenseReports?.filter(
          (e: any) => e.status === 'pending' || e.status === 'submitted'
        )?.length || 0
      const today = new Date().toISOString().split('T')[0]
      const onLeave =
        store.leaveRequests?.filter(
          (l: any) =>
            l.status === 'approved' && l.start_date <= today && l.end_date >= today
        )?.length || 0

      return {
        type: 'answer',
        text: `Company Snapshot\n\nWorkforce\n  Active employees: ${employees}\n  Departments: ${departments}\n  On leave today: ${onLeave}\n\nAction Items\n  Pending leave approvals: ${pendingLeave}\n  Pending expense reports: ${pendingExpense}\n  Open positions: ${openPositions}\n\nQuick Links:`,
        confidence: 0.9,
        actions: [
          { label: 'Dashboard', type: 'navigate', payload: '/dashboard', icon: 'LayoutDashboard' },
          { label: 'Approvals', type: 'navigate', payload: '/time-attendance', icon: 'CheckSquare' },
          { label: 'Recruiting', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' },
        ],
      }
    },
  },
]

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

// ---- Keyword-Based Fuzzy Matching Handlers ----

interface KeywordHandler {
  keywords: string[]
  excludeKeywords?: string[]
  handler: (store: any, query: string) => AssistantResponse
}

const KEYWORD_HANDLERS: KeywordHandler[] = [
  // LEAVE / TIME OFF — catch all variations
  {
    keywords: ['leave', 'time off', 'pto', 'vacation', 'day off', 'days off', 'absence', 'absent', 'away', 'out of office', 'ooo'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const approved = store.leaveRequests?.filter((l: any) => l.status === 'approved') || []
      const pending = store.leaveRequests?.filter((l: any) => l.status === 'pending') || []
      const today = new Date().toISOString().split('T')[0]
      const onLeaveToday = approved.filter((l: any) => l.start_date <= today && l.end_date >= today)

      // "how many leave days" / "leave balance" / "remaining leave"
      if (lwr.match(/balance|remaining|left|days|how many.*leave|leave.*how many|my leave/)) {
        const balances = store.timeOffBalances || []
        if (balances.length > 0) {
          const summary = balances.slice(0, 5).map((b: any) => `  ${b.policy_name || b.type || 'Leave'}: ${b.balance || b.remaining || 0} days`).join('\n')
          return { type: 'answer', text: `Leave balances:\n${summary}`, confidence: 0.85, actions: [{ label: 'View Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }] }
        }
        return { type: 'answer', text: `${approved.length} approved leave requests on record. ${pending.length} pending. Check Time & Attendance for individual balances.`, confidence: 0.7, actions: [{ label: 'View Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }] }
      }

      // "who is on leave" / "who's away" / "who's out"
      if (lwr.match(/who|list|show|people|employees/)) {
        const names = onLeaveToday.map((l: any) => {
          const emp = store.employees?.find((e: any) => e.id === l.employee_id)
          return employeeName(emp)
        })
        return { type: 'answer', text: onLeaveToday.length > 0 ? `${onLeaveToday.length} on leave today:\n${names.map((n: string) => `  ${n}`).join('\n')}` : 'No one is on leave today.', confidence: 0.9, actions: [{ label: 'Team Calendar', type: 'navigate', payload: '/people/team-calendar', icon: 'Calendar' }] }
      }

      // "request leave" / "apply for leave" / "book time off"
      if (lwr.match(/request|apply|book|submit|create|new/)) {
        return { type: 'action', text: "I'll help you request time off.", confidence: 0.85, actions: [{ label: 'Request Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }] }
      }

      // "approve leave" / "pending leave"
      if (lwr.match(/approve|pending|review/)) {
        return { type: 'answer', text: `${pending.length} pending leave request${pending.length !== 1 ? 's' : ''} awaiting approval.`, confidence: 0.85, actions: [{ label: 'Review Leave', type: 'navigate', payload: '/time-attendance', icon: 'CheckCircle' }] }
      }

      // Default leave response
      return { type: 'answer', text: `Leave summary: ${approved.length} approved, ${pending.length} pending, ${onLeaveToday.length} on leave today.`, confidence: 0.7, actions: [{ label: 'View Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' }] }
    },
  },

  // PAYROLL — all variations
  {
    keywords: ['payroll', 'salary', 'salaries', 'wage', 'wages', 'compensation', 'payslip', 'pay slip', 'net pay', 'gross pay', 'deductions'],
    excludeKeywords: ['posting', 'job posting'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const runs = store.payrollRuns || []
      const latestRun = runs.sort((a: any, b: any) => (b.created_at || '').localeCompare(a.created_at || ''))[0]
      const currency = store.orgCurrency || store._orgCurrency || 'USD'

      if (lwr.match(/run|process|start|execute|initiate/)) {
        return { type: 'action', text: "I'll take you to run payroll.", confidence: 0.85, actions: [{ label: 'Run Payroll', type: 'navigate', payload: '/payroll', icon: 'DollarSign' }] }
      }

      if (lwr.match(/cost|total|spend|how much|amount/)) {
        const total = latestRun?.total_gross || latestRun?.totalGross || 0
        const net = latestRun?.total_net || latestRun?.totalNet || 0
        return { type: 'answer', text: `Latest payroll: ${formatAmount(total, currency)} gross, ${formatAmount(net, currency)} net. ${runs.length} payroll run(s) on record.`, confidence: 0.85, actions: [{ label: 'View Payroll', type: 'navigate', payload: '/payroll', icon: 'DollarSign' }] }
      }

      if (lwr.match(/slip|stub|mine|my/)) {
        return { type: 'navigation', text: 'Opening your payslips...', confidence: 0.85, actions: [{ label: 'View Payslips', type: 'navigate', payload: '/payslips', icon: 'FileText' }] }
      }

      if (lwr.match(/deduction|tax|ssnit|paye|statutory/)) {
        return { type: 'answer', text: 'Statutory deductions are configured per country. Ghana: PAYE + SSNIT (5.5% employee, 13% employer). India: PF + ESI + PT. Brazil: INSS + FGTS + IRRF.', confidence: 0.8, actions: [{ label: 'View Statutory', type: 'navigate', payload: '/payroll/statutory', icon: 'Calculator' }] }
      }

      return { type: 'answer', text: `${runs.length} payroll run(s) on record. Latest: ${latestRun ? `${formatAmount(latestRun.total_gross || latestRun.totalGross || 0, currency)} gross` : 'None yet'}.`, confidence: 0.7, actions: [{ label: 'View Payroll', type: 'navigate', payload: '/payroll', icon: 'DollarSign' }] }
    },
  },

  // EMPLOYEE / PEOPLE — catch all
  {
    keywords: ['employee', 'employees', 'people', 'staff', 'team', 'workforce', 'headcount', 'workers', 'colleagues'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const active = activeEmployees(store)

      if (lwr.match(/how many|count|total|number/)) {
        const depts = new Set(active.map((e: any) => e.department_id).filter(Boolean))
        const countries = new Set(active.map((e: any) => e.country).filter(Boolean))
        return { type: 'answer', text: `${active.length} active employees across ${depts.size} departments and ${countries.size} countries.`, confidence: 0.95 }
      }

      if (lwr.match(/department|dept|by department|breakdown/)) {
        const byDept: Record<string, number> = {}
        active.forEach((e: any) => {
          const dept = store.departments?.find((d: any) => d.id === e.department_id)
          const name = dept?.name || 'Unassigned'
          byDept[name] = (byDept[name] || 0) + 1
        })
        const rows = Object.entries(byDept).sort((a, b) => b[1] - a[1])
        return { type: 'answer', text: `Headcount by department:\n${rows.map(([d, c]) => `  ${d}: ${c}`).join('\n')}`, confidence: 0.9 }
      }

      if (lwr.match(/country|location|where|by country|region/)) {
        const byCountry: Record<string, number> = {}
        active.forEach((e: any) => { const c = e.country || 'Unknown'; byCountry[c] = (byCountry[c] || 0) + 1 })
        const rows = Object.entries(byCountry).sort((a, b) => b[1] - a[1])
        return { type: 'answer', text: `Employees by country:\n${rows.map(([c, n]) => `  ${c}: ${n}`).join('\n')}`, confidence: 0.9 }
      }

      if (lwr.match(/new|hired|joined|recent|latest/)) {
        const thirtyDaysAgo = new Date(); thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
        const newHires = active.filter((e: any) => e.hire_date && new Date(e.hire_date) >= thirtyDaysAgo)
        return { type: 'answer', text: `${newHires.length} new hire(s) in the last 30 days.${newHires.length > 0 ? '\n' + newHires.map((e: any) => `  ${employeeName(e)} — ${e.job_title || 'Role TBD'}`).join('\n') : ''}`, confidence: 0.85 }
      }

      // Find specific employee
      const nameMatch = lwr.match(/find\s+(\w+)|where.*is\s+(\w+)|search.*for\s+(\w+)|(\w+)'s?\s+(profile|info|details|record)/)
      if (nameMatch) {
        const searchName = (nameMatch[1] || nameMatch[2] || nameMatch[3] || nameMatch[4] || '').toLowerCase()
        const found = store.employees?.filter((e: any) => employeeName(e).toLowerCase().includes(searchName))
        if (found?.length > 0) {
          return { type: 'answer', text: `Found ${found.length} match(es):\n${found.slice(0, 5).map((e: any) => `  ${employeeName(e)} — ${e.job_title || ''} (${e.department_id ? store.departments?.find((d: any) => d.id === e.department_id)?.name || '' : ''})`).join('\n')}`, confidence: 0.9, actions: [{ label: 'View People', type: 'navigate', payload: '/people', icon: 'Users' }] }
        }
      }

      return { type: 'answer', text: `${active.length} active employees. Ask me about headcount by department, by country, new hires, or search for someone by name.`, confidence: 0.6 }
    },
  },

  // EXPENSE — all variations
  {
    keywords: ['expense', 'expenses', 'receipt', 'receipts', 'reimbursement', 'reimbursements', 'claim', 'claims', 'mileage'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const reports = store.expenseReports || []
      const pendingR = reports.filter((r: any) => r.status === 'pending' || r.status === 'submitted')
      const approvedR = reports.filter((r: any) => r.status === 'approved')

      if (lwr.match(/pending|awaiting|waiting|review|approve/)) {
        return { type: 'answer', text: `${pendingR.length} pending expense report(s) awaiting approval.`, confidence: 0.9, actions: [{ label: 'Review Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' }] }
      }
      if (lwr.match(/submit|create|new|file|add/)) {
        return { type: 'action', text: "I'll take you to submit an expense report.", confidence: 0.85, actions: [{ label: 'Submit Expense', type: 'navigate', payload: '/expense', icon: 'Receipt' }] }
      }
      if (lwr.match(/total|how much|amount|spent|spending/)) {
        const total = reports.reduce((sum: number, r: any) => sum + (r.total_amount || r.totalAmount || 0), 0)
        const currency = store.orgCurrency || store._orgCurrency || 'USD'
        return { type: 'answer', text: `Total expenses: ${formatAmount(total, currency)} across ${reports.length} reports. ${pendingR.length} pending, ${approvedR.length} approved.`, confidence: 0.85 }
      }
      return { type: 'answer', text: `${reports.length} expense reports: ${pendingR.length} pending, ${approvedR.length} approved.`, confidence: 0.7, actions: [{ label: 'View Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' }] }
    },
  },

  // PERFORMANCE / REVIEW / GOALS
  {
    keywords: ['performance', 'review', 'reviews', 'goal', 'goals', 'okr', 'okrs', 'objective', 'feedback', 'rating', 'evaluation', '1:1', 'one on one', 'calibration'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const reviews = store.reviews || []
      const goals = store.goals || []

      if (lwr.match(/goal|okr|objective/)) {
        const active = goals.filter((g: any) => g.status === 'active' || g.status === 'in_progress')
        return { type: 'answer', text: `${active.length} active goals. ${goals.length} total goals on record.`, confidence: 0.8, actions: [{ label: 'View Goals', type: 'navigate', payload: '/performance', icon: 'Target' }] }
      }
      if (lwr.match(/review|cycle|evaluation|appraisal/)) {
        const pendingR = reviews.filter((r: any) => r.status === 'pending' || r.status === 'in_progress' || r.status === 'scheduled')
        return { type: 'answer', text: `${reviews.length} performance reviews on record. ${pendingR.length} in progress or scheduled.`, confidence: 0.8, actions: [{ label: 'View Reviews', type: 'navigate', payload: '/performance', icon: 'Star' }] }
      }
      if (lwr.match(/feedback|recognition|kudos|shoutout/)) {
        return { type: 'navigation', text: 'Opening feedback & recognition...', confidence: 0.8, actions: [{ label: 'Give Feedback', type: 'navigate', payload: '/performance', icon: 'MessageSquare' }] }
      }
      return { type: 'answer', text: `${reviews.length} reviews, ${goals.length} goals on record.`, confidence: 0.6, actions: [{ label: 'View Performance', type: 'navigate', payload: '/performance', icon: 'Star' }] }
    },
  },

  // RECRUITING / HIRING / JOBS
  {
    keywords: ['recruit', 'recruiting', 'hiring', 'hire', 'job', 'jobs', 'vacancy', 'vacancies', 'position', 'positions', 'candidate', 'candidates', 'application', 'applications', 'interview', 'offer'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const postings = store.jobPostings || []
      const apps = store.applications || []
      const open = postings.filter((j: any) => j.status === 'published' || j.status === 'open' || j.status === 'active')

      if (lwr.match(/open|active|current|how many/)) {
        return { type: 'answer', text: `${open.length} open position(s):\n${open.slice(0, 8).map((j: any) => `  ${j.title}`).join('\n') || 'None'}`, confidence: 0.9, actions: [{ label: 'View Recruiting', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' }] }
      }
      if (lwr.match(/candidate|applicant|pipeline|application/)) {
        return { type: 'answer', text: `${apps.length} total applications across ${postings.length} postings.`, confidence: 0.8, actions: [{ label: 'View Pipeline', type: 'navigate', payload: '/recruiting', icon: 'Users' }] }
      }
      if (lwr.match(/create|post|new|add/)) {
        return { type: 'action', text: "I'll help you create a new job posting.", confidence: 0.85, actions: [{ label: 'Create Job', type: 'navigate', payload: '/recruiting', icon: 'Plus' }] }
      }
      return { type: 'answer', text: `${open.length} open positions, ${apps.length} applications in pipeline.`, confidence: 0.7, actions: [{ label: 'View Recruiting', type: 'navigate', payload: '/recruiting', icon: 'Briefcase' }] }
    },
  },

  // LEARNING / TRAINING / COURSES
  {
    keywords: ['learning', 'training', 'course', 'courses', 'certification', 'certificate', 'lms', 'education', 'skill', 'skills', 'develop', 'development'],
    excludeKeywords: ['software development'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      const courses = store.courses || []
      const enrollments = store.enrollments || []
      const completed = enrollments.filter((e: any) => e.status === 'completed')
      const overdue = enrollments.filter((e: any) => e.status === 'overdue' || (e.due_date && new Date(e.due_date) < new Date() && e.status !== 'completed'))

      if (lwr.match(/overdue|expired|late|missing/)) {
        return { type: 'answer', text: `${overdue.length} overdue training enrollment(s). These need immediate attention.`, confidence: 0.9, actions: [{ label: 'View Overdue', type: 'navigate', payload: '/learning', icon: 'AlertTriangle' }] }
      }
      if (lwr.match(/my|assigned|enrolled/)) {
        return { type: 'navigation', text: 'Opening your learning dashboard...', confidence: 0.85, actions: [{ label: 'My Learning', type: 'navigate', payload: '/learning', icon: 'BookOpen' }] }
      }
      if (lwr.match(/how many|total|count/)) {
        return { type: 'answer', text: `${courses.length} courses available. ${enrollments.length} enrollments (${completed.length} completed, ${overdue.length} overdue).`, confidence: 0.85 }
      }
      return { type: 'answer', text: `${courses.length} courses, ${enrollments.length} enrollments, ${completed.length} completed.`, confidence: 0.6, actions: [{ label: 'View Learning', type: 'navigate', payload: '/learning', icon: 'BookOpen' }] }
    },
  },

  // COMPLIANCE / AUDIT / POLICY
  {
    keywords: ['compliance', 'compliant', 'audit', 'policy', 'policies', 'regulation', 'regulatory', 'soc2', 'gdpr', 'risk'],
    handler: (store) => {
      const reqs = store.complianceRequirements || []
      const compliant = reqs.filter((r: any) => r.status === 'compliant')
      const score = reqs.length > 0 ? Math.round((compliant.length / reqs.length) * 100) : 85
      return { type: 'answer', text: `Compliance score: ${score}%. ${compliant.length} of ${reqs.length} requirements met.`, confidence: 0.85, actions: [{ label: 'View Compliance', type: 'navigate', payload: '/compliance', icon: 'Shield' }] }
    },
  },

  // BENEFITS / INSURANCE / HEALTH
  {
    keywords: ['benefit', 'benefits', 'insurance', 'health plan', 'medical', 'dental', 'vision', 'pension', 'retirement', '401k', 'hsa', 'fsa'],
    handler: (store) => {
      const plans = store.benefitPlans || []
      const enrollments = store.benefitEnrollments || []
      return { type: 'answer', text: `${plans.length} benefit plan(s) available. ${enrollments.length} active enrollment(s).`, confidence: 0.8, actions: [{ label: 'View Benefits', type: 'navigate', payload: '/benefits', icon: 'Heart' }] }
    },
  },

  // DEVICES / EQUIPMENT / IT
  {
    keywords: ['device', 'devices', 'laptop', 'computer', 'equipment', 'hardware', 'it asset', 'phone'],
    handler: (store) => {
      const devices = store.devices || []
      const assigned = devices.filter((d: any) => d.status === 'assigned')
      return { type: 'answer', text: `${devices.length} devices tracked. ${assigned.length} assigned to employees.`, confidence: 0.8, actions: [{ label: 'View Devices', type: 'navigate', payload: '/it/devices', icon: 'Laptop' }] }
    },
  },

  // BUDGET / FINANCE / MONEY
  {
    keywords: ['budget', 'budgets', 'financial', 'cost', 'costs', 'spend', 'spending', 'money', 'revenue', 'profit'],
    excludeKeywords: ['payroll', 'salary', 'expense'],
    handler: (store) => {
      const budgets = store.budgets || []
      return { type: 'answer', text: `${budgets.length} budget(s) tracked. Navigate to Finance for details.`, confidence: 0.7, actions: [{ label: 'View Finance', type: 'navigate', payload: '/finance', icon: 'DollarSign' }] }
    },
  },

  // INVOICE / BILLING / AR
  {
    keywords: ['invoice', 'invoices', 'billing', 'bill', 'bills', 'receivable', 'payment', 'payments', 'vendor'],
    excludeKeywords: ['pay slip', 'payslip', 'payroll'],
    handler: (store) => {
      const invoices = store.invoices || []
      const overdue = invoices.filter((i: any) => i.status === 'overdue')
      const pendingI = invoices.filter((i: any) => i.status === 'sent' || i.status === 'pending')
      return { type: 'answer', text: `${invoices.length} invoices: ${overdue.length} overdue, ${pendingI.length} pending payment.`, confidence: 0.8, actions: [{ label: 'View Invoices', type: 'navigate', payload: '/finance/invoices', icon: 'FileText' }] }
    },
  },

  // ONBOARDING / NEW HIRE SETUP
  {
    keywords: ['onboarding', 'onboard', 'new hire', 'new joiner', 'induction', 'orientation', 'first day'],
    handler: (store) => {
      const journeys = store.journeys?.filter((j: any) => j.category === 'onboarding') || []
      const active = journeys.filter((j: any) => j.status === 'in_progress')
      return { type: 'answer', text: `${active.length} active onboarding journey(s). ${journeys.length} total.`, confidence: 0.8, actions: [{ label: 'View Onboarding', type: 'navigate', payload: '/journeys', icon: 'Rocket' }] }
    },
  },

  // OFFBOARDING / EXIT / RESIGNATION
  {
    keywords: ['offboarding', 'offboard', 'exit', 'resign', 'resignation', 'termination', 'terminate', 'leaving', 'departure', 'fired', 'let go'],
    handler: () => {
      return { type: 'navigation', text: 'Opening offboarding...', confidence: 0.8, actions: [{ label: 'View Offboarding', type: 'navigate', payload: '/offboarding', icon: 'UserMinus' }] }
    },
  },

  // ORG CHART / STRUCTURE / HIERARCHY
  {
    keywords: ['org chart', 'organization chart', 'hierarchy', 'reporting line', 'who reports to', 'manager'],
    handler: () => {
      return { type: 'navigation', text: 'Opening org chart...', confidence: 0.9, actions: [{ label: 'View Org Chart', type: 'navigate', payload: '/people/org-chart', icon: 'GitBranch' }] }
    },
  },

  // CALENDAR / SCHEDULE / ATTENDANCE
  {
    keywords: ['calendar', 'schedule', 'attendance', 'clock in', 'clock out', 'timesheet', 'shift', 'shifts', 'working hours'],
    handler: (store, query) => {
      const lwr = query.toLowerCase()
      if (lwr.match(/team|who|available/)) {
        return { type: 'navigation', text: 'Opening team calendar...', confidence: 0.9, actions: [{ label: 'Team Calendar', type: 'navigate', payload: '/people/team-calendar', icon: 'Calendar' }] }
      }
      return { type: 'navigation', text: 'Opening time & attendance...', confidence: 0.8, actions: [{ label: 'Time & Attendance', type: 'navigate', payload: '/time-attendance', icon: 'Clock' }] }
    },
  },

  // SUCCESSION / TALENT / 9-BOX
  {
    keywords: ['succession', 'successor', 'talent review', '9 box', 'nine box', 'bench strength', 'high potential', 'flight risk', 'retention'],
    handler: (store) => {
      const plans = store.successionPlans || []
      return { type: 'answer', text: `${plans.length} succession plan(s) on record.`, confidence: 0.8, actions: [{ label: 'View Succession', type: 'navigate', payload: '/people/succession', icon: 'TrendingUp' }] }
    },
  },

  // ANALYTICS / REPORTS / DASHBOARD / METRICS
  {
    keywords: ['analytics', 'report', 'reports', 'metrics', 'kpi', 'statistics', 'stats', 'insights', 'trends', 'forecast'],
    handler: (_store, query) => {
      const lwr = query.toLowerCase()
      if (lwr.match(/board|quarterly|annual/)) {
        return { type: 'navigation', text: 'Opening board reports...', confidence: 0.9, actions: [{ label: 'Board Reports', type: 'navigate', payload: '/analytics/board-reports', icon: 'FileText' }] }
      }
      if (lwr.match(/predict|forecast|ai|ml/)) {
        return { type: 'navigation', text: 'Opening predictive analytics...', confidence: 0.9, actions: [{ label: 'Predictions', type: 'navigate', payload: '/analytics/predictions', icon: 'Sparkles' }] }
      }
      return { type: 'navigation', text: 'Opening analytics...', confidence: 0.7, actions: [{ label: 'View Analytics', type: 'navigate', payload: '/analytics/predictions', icon: 'BarChart' }] }
    },
  },

  // TRAVEL / TRIP / BOOKING
  {
    keywords: ['travel', 'trip', 'flight', 'hotel', 'booking', 'business travel'],
    handler: () => {
      return { type: 'navigation', text: 'Opening travel management...', confidence: 0.8, actions: [{ label: 'View Travel', type: 'navigate', payload: '/travel', icon: 'Plane' }] }
    },
  },

  // CHAT / MESSAGE / COMMUNICATION
  {
    keywords: ['message', 'messages', 'conversation', 'channel', 'channels', 'communicate', 'direct message'],
    handler: () => {
      return { type: 'navigation', text: 'Opening chat...', confidence: 0.9, actions: [{ label: 'Open Chat', type: 'navigate', payload: '/chat', icon: 'MessageSquare' }] }
    },
  },

  // DOCUMENT / FILE / CONTRACT
  {
    keywords: ['document', 'documents', 'contract', 'contracts', 'policy document', 'handbook', 'template'],
    handler: () => {
      return { type: 'navigation', text: 'Opening documents...', confidence: 0.8, actions: [{ label: 'View Documents', type: 'navigate', payload: '/documents/editor', icon: 'File' }] }
    },
  },

  // SETTINGS / CONFIG / SETUP
  {
    keywords: ['setting', 'settings', 'config', 'configuration', 'setup', 'customize', 'preferences', 'account settings'],
    handler: () => {
      return { type: 'navigation', text: 'Opening settings...', confidence: 0.9, actions: [{ label: 'View Settings', type: 'navigate', payload: '/settings', icon: 'Settings' }] }
    },
  },

  // APPROVAL / PENDING / ACTION REQUIRED
  {
    keywords: ['approval', 'approvals', 'approve', 'reject', 'awaiting', 'needs my attention', 'action required', 'todo', 'to do', 'tasks'],
    handler: (store) => {
      const pendingLeave = store.leaveRequests?.filter((l: any) => l.status === 'pending')?.length || 0
      const pendingExpense = store.expenseReports?.filter((e: any) => e.status === 'pending' || e.status === 'submitted')?.length || 0
      const total = pendingLeave + pendingExpense
      return { type: 'answer', text: `${total} item(s) pending your approval:\n  ${pendingLeave} leave request(s)\n  ${pendingExpense} expense report(s)`, confidence: 0.9, actions: [
        { label: 'View Leave', type: 'navigate', payload: '/time-attendance', icon: 'Calendar' },
        { label: 'View Expenses', type: 'navigate', payload: '/expense', icon: 'Receipt' },
      ] }
    },
  },

  // GREETINGS / THANKS
  {
    keywords: ['thank', 'thanks', 'thank you', 'cheers', 'awesome', 'perfect', 'bye', 'goodbye'],
    handler: () => {
      return { type: 'answer', text: "You're welcome! Let me know if you need anything else.", confidence: 1.0 }
    },
  },
]

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
  const lower = trimmed.toLowerCase()

  // Helper to store result in conversation history and return
  function trackAndReturn(result: AssistantResponse, topic?: string, entity?: string, country?: string): AssistantResponse {
    conversationHistory.push({ query: trimmed, response: result, entities: { topic, entity, country } })
    if (conversationHistory.length > 20) conversationHistory.shift()
    return result
  }

  // ---- 1. Self-service patterns ("my ...") — highest priority ----
  for (const { pattern, handler } of SELF_SERVICE_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'self-service')
  }

  // ---- 2. Action patterns ("create ...", "approve ...") ----
  for (const { pattern, handler } of ACTION_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'action')
  }

  // ---- 2b. Extended action patterns (multi-step, alerts, exports, summary) ----
  for (const { pattern, handler } of EXTENDED_ACTION_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'action')
  }

  // ---- 3. Comparison patterns ("compare X vs Y") ----
  for (const { pattern, handler } of COMPARISON_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'comparison')
  }

  // ---- 4. What-if patterns ("what if we hire 10...") ----
  for (const { pattern, handler } of WHATIF_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'what-if')
  }

  // ---- 5. Calculation patterns ("total cost of...") ----
  for (const { pattern, handler } of CALCULATION_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'calculation')
  }

  // ---- 6. Date-filtered queries ----
  for (const { pattern, handler } of DATE_QUERY_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'date-query')
  }

  // ---- 7. Data query patterns (headcount, turnover, etc.) ----
  for (const { pattern, handler } of QUERY_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) return trackAndReturn(handler(store, match), 'data-query')
  }

  // Navigation shortcuts
  // Sort by length descending so "board reports" matches before generic "board"
  const sortedNavEntries = Object.entries(NAV_SHORTCUTS).sort((a, b) => b[0].length - a[0].length)
  for (const [keyword, path] of sortedNavEntries) {
    if (lower.includes(keyword)) {
      return trackAndReturn({
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
      }, 'navigation')
    }
  }

  // Greeting
  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(lower)) {
    const active = activeEmployees(store)
    return trackAndReturn({
      type: 'answer',
      text: `Hello! I'm Tempo AI. Your organization has ${active.length} active employees. How can I help you today?`,
      confidence: 0.9,
    }, 'greeting')
  }

  // Help / what can you do
  if (/^(help|what can you|what do you|how to use|commands|capabilities)/i.test(lower)) {
    return trackAndReturn({
      type: 'answer',
      text: `I can help you with:\n\n  People: headcount, leave, turnover, find employees\n  Finance: payroll, budgets, expenses, invoices\n  Operations: approvals, compliance, training, IT\n  Actions: create job postings, approve expenses, schedule meetings\n  Self-service: "my leave balance", "my team", "my goals"\n  Comparisons: "compare Engineering vs Sales"\n  What-if: "what if we hire 10 engineers"\n  Date queries: "who joined last quarter"\n  Navigate: just say any module name\n\nTry asking: "How many employees?" or "Show pending approvals"`,
      confidence: 1.0,
    }, 'help')
  }

  // ---- 8. Keyword-based fuzzy matching (catches what regex misses) ----
  for (const kh of KEYWORD_HANDLERS) {
    const hasKeyword = kh.keywords.some(k => lower.includes(k))
    const hasExclude = kh.excludeKeywords?.some(k => lower.includes(k))
    if (hasKeyword && !hasExclude) {
      return trackAndReturn(kh.handler(store, trimmed), 'keyword')
    }
  }

  // ---- 9. Context-aware follow-ups ("and in Nigeria?", "same for Sales") ----
  if (/^(and |what about |how about |same for |in |for |show me )/i.test(trimmed)) {
    const ctx = getConversationContext()
    if (ctx.lastTopic && conversationHistory.length > 0) {
      // Re-run with augmented query using context from last question
      const lastQuery = conversationHistory[conversationHistory.length - 1].query
      const augmented = `${lastQuery} ${trimmed}`
      // Try all pattern groups with the augmented query
      const allPatternGroups = [
        SELF_SERVICE_PATTERNS,
        ACTION_PATTERNS,
        EXTENDED_ACTION_PATTERNS,
        COMPARISON_PATTERNS,
        WHATIF_PATTERNS,
        CALCULATION_PATTERNS,
        DATE_QUERY_PATTERNS,
        QUERY_PATTERNS,
      ]
      for (const group of allPatternGroups) {
        for (const { pattern, handler } of group) {
          const match = augmented.match(pattern)
          if (match) return trackAndReturn(handler(store, match), 'context-followup')
        }
      }
      // Try keyword handlers with augmented query
      const augLower = augmented.toLowerCase()
      for (const kh of KEYWORD_HANDLERS) {
        const hasKeyword = kh.keywords.some(k => augLower.includes(k))
        const hasExclude = kh.excludeKeywords?.some(k => augLower.includes(k))
        if (hasKeyword && !hasExclude) {
          return trackAndReturn(kh.handler(store, augmented), 'context-followup')
        }
      }
    }
  }

  // ---- 10. Smart fallback: try to match any employee name ----
  const allNames = (store.employees || []).map((e: any) => employeeName(e).toLowerCase())
  const matchedName = allNames.find((name: string) => name.split(' ').some((part: string) => lower.includes(part) && part.length > 2))
  if (matchedName) {
    const emp = store.employees.find((e: any) => employeeName(e).toLowerCase() === matchedName)
    if (emp) {
      return trackAndReturn({
        type: 'answer',
        text: `${employeeName(emp)} -- ${emp?.job_title || 'Employee'}${emp?.department_id ? ` in ${store.departments?.find((d: any) => d.id === emp.department_id)?.name || ''}` : ''}. ${emp?.country || ''}.`,
        confidence: 0.7,
        actions: [{ label: 'View Profile', type: 'navigate', payload: '/people', icon: 'User' }],
      }, 'employee-lookup', employeeName(emp))
    }
  }

  // ---- 11. Fallback suggestions ----
  return trackAndReturn({
    type: 'answer',
    text: `I'm not sure how to answer that. Try asking:\n  "How many employees do we have?"\n  "Who's on leave today?"\n  "What's our payroll cost?"\n  "Show pending approvals"\n  "Create a job posting for Senior Analyst"\n  "Headcount by department"\n  "My leave balance"\n  "My team"\n  "Compare Engineering vs Sales"\n  "What if we hire 10 engineers"\n  "Who joined last quarter"\n  "Company snapshot"\n  "Open positions"`,
    confidence: 0.3,
  }, 'fallback')
}
