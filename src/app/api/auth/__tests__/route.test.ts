import { describe, expect, it, vi, beforeEach } from 'vitest'

const mocks = vi.hoisted(() => ({
  validateSession: vi.fn(),
}))

vi.mock('@/lib/db', () => ({
  db: {},
  schema: {
    employees: {},
    departments: {},
    sessions: {},
  },
}))

vi.mock('@/lib/auth', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
  createSession: vi.fn(),
  createToken: vi.fn(),
  validateSession: mocks.validateSession,
  revokeSession: vi.fn(),
  setSessionCookie: vi.fn(() => ({ name: 'tempo_session', value: 'token', options: {} })),
  getSessionCookieName: vi.fn(() => 'tempo_session'),
  getEmployeeFromSession: vi.fn(),
  createMFAToken: vi.fn(),
  verifyMFAToken: vi.fn(),
  validatePasswordPolicy: vi.fn(),
}))

vi.mock('@/lib/security/breach-detection', () => ({
  checkPasswordBreach: vi.fn(),
}))

vi.mock('@/lib/totp', () => ({
  verifyTOTP: vi.fn(),
}))

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn(),
}))

vi.mock('@/lib/org-seed', () => ({
  seedNewOrg: vi.fn(),
}))

vi.mock('@/lib/evaluator-demo-data', () => ({
  isEvaluatorAccount: vi.fn(() => false),
  getEvaluatorConfig: vi.fn(),
}))

vi.mock('@/lib/demo-data', () => ({
  DEMO_MODE: true,
  allDemoCredentials: [
    {
      email: 'amara.kone@ecobank.com',
      employeeId: 'emp-17',
      role: 'owner',
      label: 'CHRO (Owner)',
      title: 'CHRO',
      department: 'Human Resources',
      password: 'demo-password',
    },
  ],
  getDemoDataForOrg: vi.fn(() => ({
    employees: [
      {
        id: 'emp-17',
        role: 'owner',
        department_id: 'dept-5',
        job_title: 'CHRO',
        profile: {
          email: 'amara.kone@ecobank.com',
          full_name: 'Amara Kone',
          avatar_url: null,
        },
      },
    ],
  })),
}))

function makeRequest(body: unknown) {
  return {
    json: async () => body,
    cookies: {
      get: vi.fn(() => ({ value: 'session-token' })),
    },
  } as any
}

describe('POST /api/auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('resolves production demo sessions by email when the token contains a DB UUID employee ID', async () => {
    mocks.validateSession.mockResolvedValue({
      employeeId: '447aadb1-6087-4b79-9fba-16b47244da50',
      email: 'amara.kone@ecobank.com',
      role: 'owner',
      orgId: '1ace7c23-f65b-48aa-810e-cb11d29f8764',
      sessionId: 'demo-1780562099300',
    })

    const { POST } = await import('../route')
    const response = await POST(makeRequest({ action: 'me' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body.user).toMatchObject({
      id: 'user-emp-17',
      email: 'amara.kone@ecobank.com',
      full_name: 'Amara Kone',
      role: 'owner',
      department_id: 'dept-5',
      employee_id: 'emp-17',
      job_title: 'CHRO',
      department_name: 'Human Resources',
      org_id: 'org-1',
    })
  })

  it('rejects demo sessions that cannot resolve to a demo employee', async () => {
    mocks.validateSession.mockResolvedValue({
      employeeId: '447aadb1-6087-4b79-9fba-16b47244da50',
      email: 'unknown@example.com',
      role: 'owner',
      orgId: '1ace7c23-f65b-48aa-810e-cb11d29f8764',
      sessionId: 'demo-1780562099300',
    })

    const { POST } = await import('../route')
    const response = await POST(makeRequest({ action: 'me' }))
    const body = await response.json()

    expect(response.status).toBe(401)
    expect(body.user).toBeNull()
  })
})
