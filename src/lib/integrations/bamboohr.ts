// ============================================================
// BambooHR Connector
// Syncs employee data, org structure, and time-off from BambooHR
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const BAMBOO_API_BASE = 'https://api.bamboohr.com/api/gateway.php'

interface BambooEmployee {
  id: string
  displayName: string
  firstName: string
  lastName: string
  workEmail: string
  jobTitle?: string
  department?: string
  division?: string
  location?: string
  workPhone?: string
  mobilePhone?: string
  status: string
  hireDate?: string
  supervisorId?: string
}

interface BambooTimeOff {
  id: string
  employeeId: string
  type: string
  start: string
  end: string
  status: string
  amount: number
}

async function bambooGet<T>(
  subdomain: string,
  apiKey: string,
  path: string
): Promise<T> {
  const encoded = typeof Buffer !== 'undefined'
    ? Buffer.from(`${apiKey}:x`).toString('base64')
    : btoa(`${apiKey}:x`)

  const response = await fetch(`${BAMBOO_API_BASE}/${subdomain}/v1${path}`, {
    headers: {
      Authorization: `Basic ${encoded}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`BambooHR API error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function fetchBambooEmployees(
  subdomain: string,
  apiKey: string
): Promise<BambooEmployee[]> {
  const data = await bambooGet<{ employees: BambooEmployee[] }>(
    subdomain,
    apiKey,
    '/employees/directory'
  )
  return data.employees || []
}

async function fetchBambooTimeOff(
  subdomain: string,
  apiKey: string,
  startDate: string,
  endDate: string
): Promise<BambooTimeOff[]> {
  const data = await bambooGet<BambooTimeOff[]>(
    subdomain,
    apiKey,
    `/time_off/requests/?start=${startDate}&end=${endDate}&status=approved`
  )
  return data || []
}

export function mapBambooEmployeeToEmployee(employee: BambooEmployee) {
  return {
    externalId: employee.id,
    fullName: employee.displayName || `${employee.firstName} ${employee.lastName}`,
    email: employee.workEmail,
    jobTitle: employee.jobTitle || null,
    department: employee.department || null,
    country: employee.location || null,
    phone: employee.mobilePhone || employee.workPhone || null,
    isActive: employee.status === 'Active',
    division: employee.division || null,
    hireDate: employee.hireDate || null,
    supervisorId: employee.supervisorId || null,
  }
}

export const bambooHRConnector: IntegrationConnector = {
  id: 'bamboohr',
  name: 'BambooHR',
  description: 'Sync employee records, organizational structure, and time-off data from BambooHR.',
  icon: 'Users',
  category: 'identity',
  capabilities: ['Employee sync', 'Org structure', 'Time-off sync', 'Onboarding data'],

  configSchema: [
    { key: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'Enter your BambooHR API key' },
    { key: 'subdomain', label: 'Subdomain', type: 'text', required: true, placeholder: 'yourcompany (from yourcompany.bamboohr.com)' },
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
      const { api_key, subdomain } = config
      if (!api_key || !subdomain) {
        return { success: false, error: 'Missing required fields: API Key and Subdomain are required.' }
      }

      // Verify by fetching the employee directory
      const employees = await fetchBambooEmployees(subdomain, api_key)

      return {
        success: true,
        metadata: {
          subdomain,
          employeeCount: employees.length,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to BambooHR',
      }
    }
  },

  async disconnect(): Promise<void> {
    // API key revocation is handled in BambooHR admin panel
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to BambooHR is not supported in this version.'],
        duration: Date.now() - startTime,
      }
    }

    // In production, the API route handler loads config and calls syncBambooHR()
    return {
      success: true,
      recordsProcessed: 0,
      recordsFailed: 0,
      errors,
      duration: Date.now() - startTime,
    }
  },

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const { api_key, subdomain } = config
      if (!api_key || !subdomain) return false

      await fetchBambooEmployees(subdomain, api_key)
      return true
    } catch {
      return false
    }
  },
}

// Full sync helper callable with credentials
export async function syncBambooHR(
  config: Record<string, string>
): Promise<{
  employees: ReturnType<typeof mapBambooEmployeeToEmployee>[]
  timeOff: BambooTimeOff[]
}> {
  const { api_key, subdomain } = config

  const now = new Date()
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  const endDate = new Date(now.getFullYear(), now.getMonth() + 3, 0).toISOString().split('T')[0]

  const [rawEmployees, timeOff] = await Promise.all([
    fetchBambooEmployees(subdomain, api_key),
    fetchBambooTimeOff(subdomain, api_key, startDate, endDate),
  ])

  const employees = rawEmployees.map(mapBambooEmployeeToEmployee)
  return { employees, timeOff }
}
