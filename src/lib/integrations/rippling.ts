// ============================================================
// Rippling Connector
// Syncs employees, departments, and payroll runs from Rippling
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const RIPPLING_API_BASE = 'https://api.rippling.com'

interface RipplingEmployee {
  id: string
  firstName: string
  lastName: string
  displayName: string | null
  workEmail: string
  personalEmail: string | null
  phone: string | null
  title: string | null
  department: string | null
  managerId: string | null
  startDate: string
  endDate: string | null
  employmentType: 'full_time' | 'part_time' | 'contractor' | 'intern'
  status: 'active' | 'inactive' | 'leave' | 'terminated'
  location: string | null
  level: string | null
  dateOfBirth: string | null
  address: {
    street1: string
    street2: string | null
    city: string
    state: string | null
    zipCode: string
    country: string
  } | null
  compensation: {
    amount: number
    currency: string
    frequency: string
    effectiveDate: string
  } | null
  ssn: string | null
  emergencyContact: {
    name: string
    phone: string
    relationship: string
  } | null
}

interface RipplingDepartment {
  id: string
  name: string
  parentId: string | null
  headId: string | null
  memberCount: number
}

interface RipplingPayRun {
  id: string
  companyId: string
  payPeriodStartDate: string
  payPeriodEndDate: string
  checkDate: string
  status: 'draft' | 'pending' | 'approved' | 'processed' | 'paid'
  type: 'regular' | 'off_cycle' | 'bonus' | 'correction'
  totals: {
    grossPay: number
    netPay: number
    employeeTaxes: number
    employerTaxes: number
    deductions: number
    reimbursements: number
  }
  employeeCount: number
  currency: string
  createdAt: string
}

async function ripplingGet<T>(
  apiKey: string,
  path: string
): Promise<T> {
  const response = await fetch(`${RIPPLING_API_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Rippling API error: ${response.status} - ${error}`)
  }

  const body = await response.json()
  return body.data ?? body
}

async function fetchRipplingEmployees(apiKey: string): Promise<RipplingEmployee[]> {
  return ripplingGet<RipplingEmployee[]>(apiKey, '/platform/api/employees')
}

async function fetchRipplingDepartments(apiKey: string): Promise<RipplingDepartment[]> {
  return ripplingGet<RipplingDepartment[]>(apiKey, '/platform/api/departments')
}

async function fetchRipplingPayRuns(apiKey: string): Promise<RipplingPayRun[]> {
  return ripplingGet<RipplingPayRun[]>(apiKey, '/platform/api/pay_runs')
}

export function mapRipplingEmployeeToEmployee(employee: RipplingEmployee) {
  return {
    externalId: employee.id,
    fullName: employee.displayName || `${employee.firstName} ${employee.lastName}`,
    email: employee.workEmail,
    personalEmail: employee.personalEmail || null,
    jobTitle: employee.title || null,
    department: employee.department || null,
    country: employee.address?.country || 'US',
    phone: employee.phone || null,
    isActive: employee.status === 'active',
    hireDate: employee.startDate,
    dateOfBirth: employee.dateOfBirth || null,
    employmentType: employee.employmentType,
    level: employee.level || null,
    location: employee.location || null,
    streetAddress: employee.address?.street1 || null,
    city: employee.address?.city || null,
    stateProvince: employee.address?.state || null,
    postalCode: employee.address?.zipCode || null,
    salary: employee.compensation?.amount || null,
    currency: employee.compensation?.currency || null,
    payFrequency: employee.compensation?.frequency || null,
    emergencyContactName: employee.emergencyContact?.name || null,
    emergencyContactPhone: employee.emergencyContact?.phone || null,
    emergencyContactRelationship: employee.emergencyContact?.relationship || null,
  }
}

export const ripplingConnector: IntegrationConnector = {
  id: 'rippling',
  name: 'Rippling',
  description: 'Sync employees, departments, and payroll data from Rippling.',
  icon: 'Layers',
  category: 'payroll',
  capabilities: ['Employee sync', 'Department sync', 'Payroll sync', 'Contractor sync'],

  configSchema: [
    { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Enter your Rippling API key' },
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

      const employees = await fetchRipplingEmployees(api_key)

      return {
        success: true,
        metadata: {
          employeeCount: employees.length,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Rippling',
      }
    }
  },

  async disconnect(): Promise<void> {
    // Token revocation handled in Rippling admin panel
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to Rippling is not supported.'],
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
      await fetchRipplingEmployees(api_key)
      return true
    } catch {
      return false
    }
  },
}

export async function syncRippling(
  config: Record<string, string>
): Promise<{
  employees: ReturnType<typeof mapRipplingEmployeeToEmployee>[]
  departments: RipplingDepartment[]
  payRuns: RipplingPayRun[]
}> {
  const { api_key } = config

  const [rawEmployees, departments, payRuns] = await Promise.all([
    fetchRipplingEmployees(api_key),
    fetchRipplingDepartments(api_key),
    fetchRipplingPayRuns(api_key),
  ])

  const employees = rawEmployees.map(mapRipplingEmployeeToEmployee)
  return { employees, departments, payRuns }
}
