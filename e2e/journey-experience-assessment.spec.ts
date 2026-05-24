import { expect, test } from '@playwright/test'
import { loginByApi } from './helpers/auth'
import { assertNoHorizontalOverflow } from './helpers/ux-rules'
import { capturePageProblems, gotoRoute } from './helpers/route-sweep'

type Persona = 'buyer' | 'candidate' | 'employee' | 'manager' | 'hr' | 'payroll' | 'finance' | 'it' | 'admin'

type Journey = {
  id: string
  persona: Persona
  name: string
  route: string
  public?: boolean
  expectation: string
  keywords: RegExp[]
  actionHints?: RegExp[]
  delightSignal: string
}

const journeys: Journey[] = [
  {
    id: 'buyer-home',
    persona: 'buyer',
    name: 'Evaluate the platform from the homepage',
    route: '/',
    public: true,
    expectation: 'A buyer quickly understands what Tempo is, who it serves, and why it feels enterprise-grade.',
    keywords: [/people|payroll|platform|operations|workforce/i],
    actionHints: [/demo|trial|contact|start/i],
    delightSignal: 'Immediate credibility, clear story, premium visual system.',
  },
  {
    id: 'buyer-pricing',
    persona: 'buyer',
    name: 'Compare pricing and packaging',
    route: '/pricing',
    public: true,
    expectation: 'A buyer can understand packages, compare value, and know how to proceed.',
    keywords: [/pricing|plan|enterprise|month|demo/i],
    actionHints: [/demo|contact|start|get|talk|request/i],
    delightSignal: 'No sales fog; pricing page feels confident and serious.',
  },
  {
    id: 'buyer-security',
    persona: 'buyer',
    name: 'Assess trust, security, privacy, and compliance',
    route: '/security',
    public: true,
    expectation: 'A security-conscious buyer sees credible controls and risk language.',
    keywords: [/security|compliance|privacy|audit|control/i],
    actionHints: [/contact|demo|learn|request/i],
    delightSignal: 'Trust is built before a sales call.',
  },
  {
    id: 'buyer-demo-request',
    persona: 'buyer',
    name: 'Request a demo',
    route: '/demo-request',
    public: true,
    expectation: 'The buyer can request a demo without friction or confusing fields.',
    keywords: [/demo|company|email|team|request/i],
    actionHints: [/submit|request|book|schedule/i],
    delightSignal: 'The form feels short, secure, and high intent.',
  },
  {
    id: 'candidate-signup',
    persona: 'candidate',
    name: 'Create or access an account',
    route: '/signup',
    public: true,
    expectation: 'A new user understands how to start and what account path to choose.',
    keywords: [/sign up|create|account|email|company/i],
    actionHints: [/sign up|create|continue|start/i],
    delightSignal: 'Secure, calm, not consumer-toyish.',
  },
  {
    id: 'employee-login',
    persona: 'employee',
    name: 'Log in securely',
    route: '/login',
    public: true,
    expectation: 'The employee can log in quickly and trust the environment.',
    keywords: [/login|sign in|email|password|demo/i],
    actionHints: [/sign in|login|demo/i],
    delightSignal: 'The entry point feels polished and safe.',
  },
  {
    id: 'employee-dashboard',
    persona: 'employee',
    name: 'Understand what needs attention today',
    route: '/dashboard',
    expectation: 'The user immediately sees priorities, approvals, status, and useful shortcuts.',
    keywords: [/dashboard|overview|leave|goals|learning/i],
    actionHints: [/request|submit|view|ask/i],
    delightSignal: 'A new user knows what to do in under 30 seconds.',
  },
  {
    id: 'employee-people-profile',
    persona: 'employee',
    name: 'Find people and understand the organization',
    route: '/people',
    expectation: 'The user can find employees, understand teams, and open profiles.',
    keywords: [/people|employee|department|manager|directory/i],
    actionHints: [/add|filter|search|view/i],
    delightSignal: 'The org feels searchable, structured, and alive.',
  },
  {
    id: 'employee-time-leave',
    persona: 'employee',
    name: 'Request time off and track attendance',
    route: '/time-attendance',
    expectation: 'Leave balances, request flow, attendance, and approval status are clear.',
    keywords: [/leave|time|attendance|balance|request/i],
    actionHints: [/request|approve|clock|submit|plan|review/i],
    delightSignal: 'No HR ticket needed for a simple leave question.',
  },
  {
    id: 'employee-benefits',
    persona: 'employee',
    name: 'Choose and manage benefits',
    route: '/benefits',
    expectation: 'The user can compare plans, understand cost, manage dependents, and enroll.',
    keywords: [/benefits|plan|coverage|dependent|enroll/i],
    actionHints: [/enroll|compare|add|manage/i],
    delightSignal: 'Benefits feel understandable instead of bureaucratic.',
  },
  {
    id: 'employee-expense',
    persona: 'employee',
    name: 'Submit and track expenses',
    route: '/expense',
    expectation: 'Submitting, reviewing, and approving expenses is obvious and fast.',
    keywords: [/expense|receipt|report|reimburse|approve/i],
    actionHints: [/submit|upload|approve|create|track|manage/i],
    delightSignal: 'The user trusts exactly what will happen next.',
  },
  {
    id: 'employee-learning',
    persona: 'employee',
    name: 'Learn a new skill',
    route: '/learning',
    expectation: 'The learner can discover courses, enroll, track progress, and see certificates.',
    keywords: [/learning|course|skill|progress|certificate/i],
    actionHints: [/enroll|start|continue|generate/i],
    delightSignal: 'Learning feels curated and modern, not checkbox compliance.',
  },
  {
    id: 'employee-performance',
    persona: 'employee',
    name: 'Manage goals, feedback, and reviews',
    route: '/performance',
    expectation: 'The employee sees goals, reviews, feedback, recognition, and next steps.',
    keywords: [/performance|goal|feedback|review|recognition/i],
    actionHints: [/create|give|schedule|view/i],
    delightSignal: 'Performance feels continuous and useful, not annual theater.',
  },
  {
    id: 'employee-chat',
    persona: 'employee',
    name: 'Ask HR or collaborate with colleagues',
    route: '/chat',
    expectation: 'The user can ask questions, message teams, and find help quickly.',
    keywords: [/chat|message|channel|assistant|help/i],
    actionHints: [/send|ask|attach|new/i],
    delightSignal: 'Answers feel close at hand.',
  },
  {
    id: 'employee-payslips',
    persona: 'employee',
    name: 'View pay history and payslips',
    route: '/payslips',
    expectation: 'The employee can understand pay history, deductions, and downloadable records.',
    keywords: [/pay|payslip|salary|deduction|net|stub/i],
    actionHints: [/view|download|print|export/i],
    delightSignal: 'Compensation data feels transparent and trustworthy.',
  },
  {
    id: 'manager-team',
    persona: 'manager',
    name: 'Manage team priorities',
    route: '/dashboard',
    expectation: 'A manager can switch from personal work to team oversight and act on approvals.',
    keywords: [/team|approval|dashboard|review|leave/i],
    actionHints: [/approve|view|request|review/i],
    delightSignal: 'Team management feels calm, not scattered.',
  },
  {
    id: 'manager-recruiting',
    persona: 'manager',
    name: 'Review recruiting pipeline',
    route: '/recruiting',
    expectation: 'Hiring work shows open roles, pipeline health, candidates, interviews, and offers.',
    keywords: [/recruiting|candidate|job|pipeline|interview/i],
    actionHints: [/create|post|schedule|offer|move/i],
    delightSignal: 'Hiring progress is obvious at a glance.',
  },
  {
    id: 'manager-analytics',
    persona: 'manager',
    name: 'Analyze team and business health',
    route: '/analytics',
    expectation: 'The manager can inspect insights, trends, and reports without exporting to spreadsheets.',
    keywords: [/analytics|report|insight|trend|workforce/i],
    actionHints: [/generate|export|view|ask/i],
    delightSignal: 'The product helps the user think, not just record.',
  },
  {
    id: 'hr-add-employee',
    persona: 'hr',
    name: 'Add, edit, import, and manage employees',
    route: '/people',
    expectation: 'HR can manage employee records with validation, search, imports, and clear next steps.',
    keywords: [/people|employee|import|department|status/i],
    actionHints: [/add|import|export|filter/i],
    delightSignal: 'The core HRIS feels dependable and efficient.',
  },
  {
    id: 'hr-onboarding',
    persona: 'hr',
    name: 'Onboard a new hire',
    route: '/onboarding',
    expectation: 'HR can start onboarding, assign tasks, invite teams, and track progress.',
    keywords: [/onboarding|new hire|task|journey|buddy/i],
    actionHints: [/start|create|assign|invite|welcome|plan/i],
    delightSignal: 'Starting a new employee feels like a guided system, not a checklist document.',
  },
  {
    id: 'hr-offboarding',
    persona: 'hr',
    name: 'Offboard an employee safely',
    route: '/offboarding',
    expectation: 'HR can start offboarding, track tasks, final pay, exit interviews, and IT revocation.',
    keywords: [/offboarding|exit|final pay|access|task/i],
    actionHints: [/start|initiate|complete|revoke/i],
    delightSignal: 'Sensitive transitions feel controlled and humane.',
  },
  {
    id: 'hr-engagement',
    persona: 'hr',
    name: 'Run engagement surveys and action plans',
    route: '/engagement',
    expectation: 'HR can create surveys, analyze sentiment, benchmark results, and assign actions.',
    keywords: [/engagement|survey|sentiment|action|enps/i],
    actionHints: [/create|send|analyze|view/i],
    delightSignal: 'Employee voice translates into visible action.',
  },
  {
    id: 'hr-compensation',
    persona: 'hr',
    name: 'Plan compensation and rewards',
    route: '/compensation',
    expectation: 'HR can review salary bands, rewards, merit cycles, and market position.',
    keywords: [/compensation|salary|reward|band|merit/i],
    actionHints: [/review|create|model|generate/i],
    delightSignal: 'Comp decisions feel analytical and fair.',
  },
  {
    id: 'payroll-run',
    persona: 'payroll',
    name: 'Run payroll and review variances',
    route: '/payroll',
    expectation: 'Payroll can create, review, approve, export, and audit pay runs.',
    keywords: [/payroll|run|gross|net|approval/i],
    actionHints: [/run|approve|export|review/i],
    delightSignal: 'Payroll feels controlled enough for enterprise buyers.',
  },
  {
    id: 'payroll-statutory',
    persona: 'payroll',
    name: 'Manage statutory deductions',
    route: '/payroll/statutory',
    expectation: 'Payroll teams can understand country rules, deductions, and compliance settings.',
    keywords: [/statutory|tax|deduction|compliance|country/i],
    actionHints: [/calculate|configure|view|export/i],
    delightSignal: 'Country complexity is presented with confidence.',
  },
  {
    id: 'finance-invoices',
    persona: 'finance',
    name: 'Manage invoices and collections',
    route: '/finance/invoices',
    expectation: 'Finance can see invoices, statuses, aging, and payment next steps.',
    keywords: [/invoice|payment|customer|amount|status/i],
    actionHints: [/create|send|mark|export/i],
    delightSignal: 'Revenue operations feel connected to people operations.',
  },
  {
    id: 'finance-budgets',
    persona: 'finance',
    name: 'Manage budgets and variance',
    route: '/finance/budgets',
    expectation: 'Finance can track budget, actuals, variance, and scenario decisions.',
    keywords: [/budget|variance|actual|forecast|spend/i],
    actionHints: [/create|forecast|model|export/i],
    delightSignal: 'Budget review feels analytical, not buried.',
  },
  {
    id: 'finance-cards',
    persona: 'finance',
    name: 'Control cards and spend',
    route: '/finance/cards',
    expectation: 'Finance can monitor card usage, limits, policy, and suspicious spend.',
    keywords: [/card|spend|limit|transaction|policy/i],
    actionHints: [/issue|freeze|approve|view/i],
    delightSignal: 'Spend control feels proactive.',
  },
  {
    id: 'it-cloud',
    persona: 'it',
    name: 'Operate IT command center',
    route: '/it-cloud',
    expectation: 'IT can see devices, apps, requests, access, and risk in one operational view.',
    keywords: [/it|device|app|security|request/i],
    actionHints: [/provision|assign|review|manage/i],
    delightSignal: 'IT feels as integrated as HR and payroll.',
  },
  {
    id: 'it-devices',
    persona: 'it',
    name: 'Manage device inventory',
    route: '/it/devices',
    expectation: 'IT can assign, track, secure, and retire devices.',
    keywords: [/device|inventory|assigned|security|status/i],
    actionHints: [/assign|add|retire|command/i],
    delightSignal: 'Device management feels practical and audit-ready.',
  },
  {
    id: 'it-apps',
    persona: 'it',
    name: 'Manage apps and licenses',
    route: '/it/apps',
    expectation: 'IT can manage app access, license utilization, spend, and provisioning.',
    keywords: [/app|license|provision|access|usage/i],
    actionHints: [/provision|assign|approve|manage/i],
    delightSignal: 'Access management feels joined up with onboarding and offboarding.',
  },
  {
    id: 'it-identity',
    persona: 'it',
    name: 'Manage identity and access',
    route: '/identity',
    expectation: 'Admins can inspect identity, SSO, SCIM, sessions, and security posture.',
    keywords: [/identity|sso|scim|session|access/i],
    actionHints: [/configure|sync|review|manage/i],
    delightSignal: 'Security admin feels credible to technical buyers.',
  },
  {
    id: 'ops-workflows',
    persona: 'admin',
    name: 'Create workflow automation',
    route: '/workflow-studio',
    expectation: 'Admins can build automations from templates or natural language.',
    keywords: [/workflow|automation|trigger|action|studio/i],
    actionHints: [/create|new|generate|publish|run/i],
    delightSignal: 'The creation loop feels closer to Replit: ask, build, iterate.',
  },
  {
    id: 'ops-app-studio',
    persona: 'admin',
    name: 'Create internal apps',
    route: '/app-studio',
    expectation: 'Power users can create, inspect, and iterate on internal app experiences.',
    keywords: [/app|studio|build|component|data/i],
    actionHints: [/create|generate|preview|publish/i],
    delightSignal: 'The platform feels expandable, not fixed.',
  },
  {
    id: 'ai-command-center',
    persona: 'admin',
    name: 'Ask Tempo to act across the platform',
    route: '/dashboard',
    expectation: 'The user can search, ask, generate, navigate, and execute useful platform actions.',
    keywords: [/dashboard|tempo|ai|ask|overview/i],
    actionHints: [/search|ask|request|submit/i],
    delightSignal: 'AI feels central and useful, not bolted on.',
  },
  {
    id: 'settings-org',
    persona: 'admin',
    name: 'Configure organization settings',
    route: '/settings',
    expectation: 'Admins can manage org preferences, users, localization, theme, and security controls.',
    keywords: [/settings|organization|security|locale|theme/i],
    actionHints: [/save|manage|configure|switch/i],
    delightSignal: 'Admin setup feels composed and enterprise-safe.',
  },
]

function scoreJourney({
  loadMs,
  hasExpectedContent,
  hasUsefulAction,
  interactiveCount,
  noOverflow,
  problemCount,
}: {
  loadMs: number
  hasExpectedContent: boolean
  hasUsefulAction: boolean
  interactiveCount: number
  noOverflow: boolean
  problemCount: number
}) {
  let score = 10
  if (loadMs > 5_000) score -= 2
  else if (loadMs > 3_000) score -= 1
  if (!hasExpectedContent) score -= 3
  if (!hasUsefulAction) score -= 2
  if (interactiveCount < 3) score -= 1
  if (!noOverflow) score -= 2
  if (problemCount > 0) score -= 3
  return Math.max(0, score)
}

test.describe('Journey experience assessment', () => {
  for (const journey of journeys) {
    test(`${journey.persona}: ${journey.name}`, async ({ page }, testInfo) => {
      test.setTimeout(60_000)
      const problems = capturePageProblems(page)

      if (!journey.public) await loginByApi(page)

      const started = Date.now()
      await gotoRoute(page, journey.route)
      const loadMs = Date.now() - started
      await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => undefined)
      await page.waitForTimeout(750)

      const bodyText = await page.locator('body').innerText({ timeout: 10_000 })
      const hasExpectedContent = journey.keywords.some((pattern) => pattern.test(bodyText))

      const actionText = await page.locator('button:visible, a[href]:visible, input:visible, textarea:visible, select:visible')
        .evaluateAll((els) => els.map((el) => `${el.textContent || ''} ${(el as HTMLInputElement).placeholder || ''} ${el.getAttribute('aria-label') || ''}`).join(' '))
      const interactiveCount = await page.locator('button:visible, a[href]:visible, input:visible, textarea:visible, select:visible').count()
      const hasUsefulAction = !journey.actionHints || journey.actionHints.length === 0 || journey.actionHints.some((pattern) => pattern.test(`${actionText} ${bodyText}`))

      const noOverflow = await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)
      await assertNoHorizontalOverflow(page)

      const score = scoreJourney({
        loadMs,
        hasExpectedContent,
        hasUsefulAction,
        interactiveCount,
        noOverflow,
        problemCount: problems.length,
      })

      await testInfo.attach('journey-assessment.json', {
        contentType: 'application/json',
        body: JSON.stringify({
          id: journey.id,
          persona: journey.persona,
          name: journey.name,
          route: journey.route,
          expectation: journey.expectation,
          delightSignal: journey.delightSignal,
          loadMs,
          hasExpectedContent,
          hasUsefulAction,
          interactiveCount,
          noOverflow,
          problemCount: problems.length,
          score,
        }, null, 2),
      })

      expect(problems.slice(0, 3), problems.join('\n')).toEqual([])
      expect(hasExpectedContent, `${journey.name} should communicate expected value: ${journey.expectation}`).toBe(true)
      expect(hasUsefulAction, `${journey.name} should expose a clear action`).toBe(true)
      expect(interactiveCount, `${journey.name} should have enough useful interaction points`).toBeGreaterThanOrEqual(3)
      expect(loadMs, `${journey.name} should feel fast`).toBeLessThanOrEqual(5_000)
      expect(score, `${journey.name} should meet an 8/10 journey experience bar`).toBeGreaterThanOrEqual(8)
    })
  }
})
