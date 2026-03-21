// ============================================================
// Gusto Connector
// Syncs employee data, payroll, and departments from Gusto
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const GUSTO_API_BASE = 'https://api.gusto.com'

interface GustoEmployee {
  id: number
  uuid: string
  first_name: string
  last_name: string
  email: string | null
  company_id: number
  company_uuid: string
  manager_id: number | null
  department: string | null
  terminated: boolean
  two_percent_shareholder: boolean
  onboarded: boolean
  date_of_birth: string | null
  ssn: string | null
  phone: string | null
  preferred_first_name: string | null
  jobs: GustoJob[]
  home_address?: {
    street_1: string
    street_2: string | null
    city: string
    state: string
    zip: string
    country: string
  }
  payment_method: string
  current_employment_status: string
}

interface GustoJob {
  id: number
  title: string | null
  rate: string
  payment_unit: string
  current_compensation_id: number
  hire_date: string
  location_id: number
}

interface GustoPayroll {
  payroll_id: string
  pay_period: { start_date: string; end_date: string }
  check_date: string
  processed: boolean
  payroll_deadline: string
  totals: {
    company_debit: string
    net_pay: string
    tax_debit: string
    reimbursements: string
    child_support_debit: string
    gross_pay: string
    employee_taxes: string
    employer_taxes: string
    employee_benefits_deductions: string
  }
  employee_compensations: GustoEmployeeCompensation[]
}

interface GustoEmployeeCompensation {
  employee_id: number
  gross_pay: string
  net_pay: string
  payment_method: string
  taxes: { name: string; amount: string; employer: boolean }[]
  benefits: { name: string; employee_deduction: string; company_contribution: string }[]
}

interface GustoDepartment {
  uuid: string
  title: string
  employees: { id: number; uuid: string }[]
}

async function gustoGet<T>(
  accessToken: string,
  path: string
): Promise<T> {
  const response = await fetch(`${GUSTO_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gusto API error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function fetchGustoEmployees(
  accessToken: string,
  companyId: string
): Promise<GustoEmployee[]> {
  return gustoGet<GustoEmployee[]>(accessToken, `/v1/companies/${companyId}/employees`)
}

async function fetchGustoPayrolls(
  accessToken: string,
  companyId: string
): Promise<GustoPayroll[]> {
  return gustoGet<GustoPayroll[]>(accessToken, `/v1/companies/${companyId}/payrolls?processed=true`)
}

async function fetchGustoDepartments(
  accessToken: string,
  companyId: string
): Promise<GustoDepartment[]> {
  return gustoGet<GustoDepartment[]>(accessToken, `/v1/companies/${companyId}/departments`)
}

export function mapGustoEmployeeToEmployee(employee: GustoEmployee) {
  const primaryJob = employee.jobs?.[0]
  return {
    externalId: String(employee.uuid),
    fullName: [employee.preferred_first_name || employee.first_name, employee.last_name]
      .filter(Boolean)
      .join(' '),
    email: employee.email || null,
    jobTitle: primaryJob?.title || null,
    department: employee.department || null,
    country: employee.home_address?.country || 'US',
    phone: employee.phone || null,
    isActive: !employee.terminated && employee.current_employment_status === 'active',
    hireDate: primaryJob?.hire_date || null,
    dateOfBirth: employee.date_of_birth || null,
    streetAddress: employee.home_address?.street_1 || null,
    city: employee.home_address?.city || null,
    stateProvince: employee.home_address?.state || null,
    postalCode: employee.home_address?.zip || null,
    salary: primaryJob ? parseFloat(primaryJob.rate) : null,
    payFrequency: primaryJob?.payment_unit || null,
  }
}

export const gustoConnector: IntegrationConnector = {
  id: 'gusto',
  name: 'Gusto',
  description: 'Sync employees, payroll runs, and departments from Gusto.',
  icon: 'DollarSign',
  category: 'payroll',
  capabilities: ['Employee sync', 'Payroll sync', 'Department sync', 'Onboarding data'],

  configSchema: [
    { key: 'access_token', label: 'Access Token', type: 'password', required: true, placeholder: 'OAuth access token from Gusto' },
    { key: 'company_id', label: 'Company ID', type: 'text', required: true, placeholder: 'Your Gusto company UUID' },
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
      const { access_token, company_id } = config
      if (!access_token || !company_id) {
        return { success: false, error: 'Missing required fields: Access Token and Company ID are required.' }
      }

      const employees = await fetchGustoEmployees(access_token, company_id)

      return {
        success: true,
        metadata: {
          companyId: company_id,
          employeeCount: employees.length,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Gusto',
      }
    }
  },

  async disconnect(): Promise<void> {
    // OAuth token revocation handled externally
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to Gusto is not supported.'],
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
      const { access_token, company_id } = config
      if (!access_token || !company_id) return false
      await fetchGustoEmployees(access_token, company_id)
      return true
    } catch {
      return false
    }
  },
}

export async function syncGusto(
  config: Record<string, string>
): Promise<{
  employees: ReturnType<typeof mapGustoEmployeeToEmployee>[]
  payrolls: GustoPayroll[]
  departments: GustoDepartment[]
}> {
  const { access_token, company_id } = config

  const [rawEmployees, payrolls, departments] = await Promise.all([
    fetchGustoEmployees(access_token, company_id),
    fetchGustoPayrolls(access_token, company_id),
    fetchGustoDepartments(access_token, company_id),
  ])

  const employees = rawEmployees.map(mapGustoEmployeeToEmployee)
  return { employees, payrolls, departments }
}
