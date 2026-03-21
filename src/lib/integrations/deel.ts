// ============================================================
// Deel Connector
// Syncs employees (FTE + contractors), contracts, and invoices
// from Deel. Handles multi-currency and contractor distinction.
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const DEEL_API_BASE = 'https://api.letsdeel.com'

interface DeelPerson {
  id: string
  first_name: string
  last_name: string
  email: string
  type: 'employee' | 'contractor'
  status: 'active' | 'inactive' | 'onboarding' | 'offboarding'
  country: string
  nationality: string | null
  start_date: string
  end_date: string | null
  job_title: string | null
  department: string | null
  team: string | null
  manager_id: string | null
  phone: string | null
  date_of_birth: string | null
  seniority_level: string | null
  compensation: {
    amount: number
    currency: string
    frequency: 'monthly' | 'semi_monthly' | 'bi_weekly' | 'weekly' | 'hourly'
    type: 'salary' | 'hourly_rate' | 'project_based'
  } | null
  address: {
    street: string
    city: string
    state: string | null
    postal_code: string
    country: string
  } | null
}

interface DeelContract {
  id: string
  person_id: string
  title: string
  type: 'employment' | 'contractor' | 'eor'
  status: 'active' | 'inactive' | 'pending' | 'terminated'
  start_date: string
  end_date: string | null
  currency: string
  amount: number
  payment_frequency: string
  country: string
  scope_of_work: string | null
  created_at: string
}

interface DeelInvoice {
  id: string
  contract_id: string
  person_id: string
  amount: number
  currency: string
  status: 'draft' | 'pending' | 'approved' | 'paid' | 'rejected'
  period_start: string
  period_end: string
  due_date: string
  paid_date: string | null
  description: string | null
  created_at: string
}

async function deelGet<T>(
  apiKey: string,
  path: string
): Promise<T> {
  const response = await fetch(`${DEEL_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Deel API error: ${response.status} - ${error}`)
  }

  const body = await response.json()
  return body.data ?? body
}

async function fetchDeelPeople(apiKey: string): Promise<DeelPerson[]> {
  return deelGet<DeelPerson[]>(apiKey, '/rest/v2/people')
}

async function fetchDeelContracts(apiKey: string): Promise<DeelContract[]> {
  return deelGet<DeelContract[]>(apiKey, '/rest/v2/contracts')
}

async function fetchDeelInvoices(apiKey: string): Promise<DeelInvoice[]> {
  return deelGet<DeelInvoice[]>(apiKey, '/rest/v2/invoices')
}

export function mapDeelPersonToEmployee(person: DeelPerson) {
  return {
    externalId: person.id,
    fullName: `${person.first_name} ${person.last_name}`,
    email: person.email,
    jobTitle: person.job_title || null,
    department: person.department || person.team || null,
    country: person.country,
    phone: person.phone || null,
    isActive: person.status === 'active',
    hireDate: person.start_date,
    dateOfBirth: person.date_of_birth || null,
    nationality: person.nationality || null,
    employmentType: person.type === 'contractor' ? 'contractor' : 'full_time',
    level: person.seniority_level || null,
    streetAddress: person.address?.street || null,
    city: person.address?.city || null,
    stateProvince: person.address?.state || null,
    postalCode: person.address?.postal_code || null,
    salary: person.compensation?.amount || null,
    currency: person.compensation?.currency || null,
    payFrequency: person.compensation?.frequency || null,
  }
}

export const deelConnector: IntegrationConnector = {
  id: 'deel',
  name: 'Deel',
  description: 'Sync employees, contractors, contracts, and invoices from Deel. Supports multi-currency.',
  icon: 'Globe',
  category: 'payroll',
  capabilities: ['Employee sync', 'Contractor sync', 'Contract management', 'Invoice sync', 'Multi-currency'],

  configSchema: [
    { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Enter your Deel API key' },
    {
      key: 'sync_interval',
      label: 'Sync Interval',
      type: 'select',
      required: true,
      options: [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
      ],
    },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { api_key } = config
      if (!api_key) {
        return { success: false, error: 'Missing required field: API Key is required.' }
      }

      const people = await fetchDeelPeople(api_key)

      return {
        success: true,
        metadata: {
          peopleCount: people.length,
          employees: people.filter(p => p.type === 'employee').length,
          contractors: people.filter(p => p.type === 'contractor').length,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Deel',
      }
    }
  },

  async disconnect(): Promise<void> {
    // API key revocation handled in Deel admin panel
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to Deel is not supported.'],
        duration: Date.now() - startTime,
      }
    }

    return {
      success: true,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors: [],
      duration: Date.now() - startTime,
    }
  },

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const { api_key } = config
      if (!api_key) return false
      await fetchDeelPeople(api_key)
      return true
    } catch {
      return false
    }
  },
}

export async function syncDeel(
  config: Record<string, string>
): Promise<{
  employees: ReturnType<typeof mapDeelPersonToEmployee>[]
  contracts: DeelContract[]
  invoices: DeelInvoice[]
}> {
  const { api_key } = config

  const [rawPeople, contracts, invoices] = await Promise.all([
    fetchDeelPeople(api_key),
    fetchDeelContracts(api_key),
    fetchDeelInvoices(api_key),
  ])

  const employees = rawPeople.map(mapDeelPersonToEmployee)
  return { employees, contracts, invoices }
}
