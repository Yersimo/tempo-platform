/**
 * Provisioning Orchestrator
 *
 * Atomic Day-1 provisioning across SSO, email, Slack, calendar, apps,
 * and equipment. Lets Tempo answer the J002 journey: "First morning
 * logging in for the first time" — by guaranteeing every system the
 * new joiner needs is live, tested, and ready before 8am local time
 * on Day 1.
 *
 * Provider abstraction follows the same pattern as calendar-provider:
 * real implementations (Okta, Slack API, Google Workspace, etc.) plug
 * in via the interfaces. Mock providers return realistic readiness
 * states so the demo works without external OAuth.
 *
 * Design move: the orchestrator runs OVERNIGHT (cron at 02:00 local
 * time) so by the time the new joiner logs in, every check is already
 * green. The Day-1 page shows the readiness state, not the provisioning
 * progress.
 */

export interface SystemReadiness {
  name: string
  ready: boolean
  testedAt: string | null
  detail: string | null
}

export interface ProvisioningResult {
  employeeId: string
  ssoTestedOvernight: boolean
  systems: {
    sso: SystemReadiness
    email: SystemReadiness
    slack: SystemReadiness
    calendar: SystemReadiness
    equipment: SystemReadiness
    apps: SystemReadiness[]
  }
  /** Composite readiness: 0..1 — fraction of systems green */
  readinessScore: number
  /** True if all critical systems (sso, email, equipment) are ready */
  readyForFirstDay: boolean
  /** Open issues that need HR/IT attention */
  blockers: string[]
}

// ─── Provider abstractions ──────────────────────────────────────────

export interface ProvisioningProvider {
  /** Return readiness state for a given employee. Idempotent. */
  checkReadiness(employeeId: string): Promise<ProvisioningResult>
  /** Trigger provisioning for a new joiner. Returns immediately;
   *  actual work happens asynchronously (overnight in production). */
  triggerProvisioning(employeeId: string): Promise<{ jobId: string; eta: string }>
}

// ─── Mock provider (demo) ───────────────────────────────────────────

const MOCK_NEW_JOINERS: Record<string, ProvisioningResult> = {
  'emp-new': {
    employeeId: 'emp-new',
    ssoTestedOvernight: true,
    systems: {
      sso: {
        name: 'SSO (Okta)',
        ready: true,
        testedAt: yesterdayAt('02:14'),
        detail: 'MFA enrolled · last successful test 02:14',
      },
      email: {
        name: 'Email & Calendar (Google Workspace)',
        ready: true,
        testedAt: yesterdayAt('02:18'),
        detail: 'kemi.adesina@ecobank.com · inbox provisioned',
      },
      slack: {
        name: 'Slack',
        ready: true,
        testedAt: yesterdayAt('02:22'),
        detail: 'Member of #strategy, #lagos-office, #welcome',
      },
      calendar: {
        name: 'Calendar',
        ready: true,
        testedAt: yesterdayAt('02:24'),
        detail: 'Linked to Outlook · 5 first-week meetings pre-scheduled',
      },
      equipment: {
        name: 'Equipment',
        ready: true,
        testedAt: yesterdayAt('17:42'),
        detail: 'MacBook Pro 14" · delivered to Lagos office reception',
      },
      apps: [
        { name: 'Notion', ready: true, testedAt: yesterdayAt('03:01'), detail: 'Workspace: ecobank-strategy' },
        { name: 'Figma', ready: true, testedAt: yesterdayAt('03:04'), detail: 'Team: Ecobank Group · Editor seat' },
        { name: '1Password', ready: true, testedAt: yesterdayAt('03:06'), detail: 'Vault: Strategy · 14 items shared' },
        { name: 'GitHub', ready: false, testedAt: null, detail: 'Pending SSO verification — auto-retry at 06:00' },
      ],
    },
    readinessScore: 0.93, // one app pending
    readyForFirstDay: true, // critical systems all green
    blockers: [],
  },
}

function yesterdayAt(hhmm: string): string {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.toISOString()
}

export const mockProvisioningProvider: ProvisioningProvider = {
  async checkReadiness(employeeId) {
    const cached = MOCK_NEW_JOINERS[employeeId]
    if (cached) return cached
    return buildDefaultProvisioningResult(employeeId)
  },
  async triggerProvisioning(employeeId) {
    void employeeId
    return {
      jobId: `prov-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      eta: yesterdayAt('02:00'), // we pretend overnight provisioning completes by 02:00
    }
  },
}

function buildDefaultProvisioningResult(employeeId: string): ProvisioningResult {
  return {
    employeeId,
    ssoTestedOvernight: true,
    systems: {
      sso: { name: 'SSO', ready: true, testedAt: yesterdayAt('02:00'), detail: 'Provisioned' },
      email: { name: 'Email', ready: true, testedAt: yesterdayAt('02:00'), detail: 'Provisioned' },
      slack: { name: 'Slack', ready: true, testedAt: yesterdayAt('02:00'), detail: 'Provisioned' },
      calendar: { name: 'Calendar', ready: true, testedAt: yesterdayAt('02:00'), detail: 'Linked' },
      equipment: { name: 'Equipment', ready: true, testedAt: yesterdayAt('17:00'), detail: 'Delivered' },
      apps: [],
    },
    readinessScore: 1,
    readyForFirstDay: true,
    blockers: [],
  }
}

// ─── Real provider stubs (Okta + Google Workspace + Slack) ──────────
/**
 * Production providers live behind env-gated implementations.
 * Outline:
 *   - Okta: API call to /api/v1/users/{id} to verify groups + MFA factors
 *   - Google: directory.users.get to verify mailbox + calendar
 *   - Slack: users.lookupByEmail + conversations.list for channel membership
 *   - GitHub: enterprise admin API to verify SSO-linked identity
 *   - Asset DB: query devices table for shipment status
 */
export const oktaProvisioningProvider: ProvisioningProvider = {
  async checkReadiness() {
    if (process.env.OKTA_API_TOKEN) {
      throw new Error('Okta provider not yet implemented')
    }
    throw new Error('OKTA_API_TOKEN not set')
  },
  async triggerProvisioning() {
    throw new Error('Okta provider not yet implemented')
  },
}

// ─── Public API ─────────────────────────────────────────────────────

export async function getProvisioningProvider(): Promise<ProvisioningProvider> {
  // TODO: env-flag to switch to real provider
  return mockProvisioningProvider
}

export async function getDayOneReadiness(employeeId: string): Promise<ProvisioningResult> {
  const provider = await getProvisioningProvider()
  return provider.checkReadiness(employeeId)
}
