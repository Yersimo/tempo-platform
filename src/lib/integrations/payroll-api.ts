// ============================================================
// Payroll API Connector (Generic REST)
// Connects to external payroll systems via configurable REST API
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

interface PayrollEmployee {
  employee_id: string
  full_name: string
  email?: string
  department?: string
  gross_salary: number
  net_salary: number
  deductions: number
  currency: string
  pay_period: string
  tax_amount?: number
  pension_amount?: number
  bonus?: number
  [key: string]: unknown
}

interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  total_pages: number
  next_page?: string
}

interface FieldMapping {
  tempoField: string
  externalField: string
  transform?: 'string' | 'number' | 'date' | 'boolean'
}

function buildAuthHeaders(config: Record<string, string>): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  switch (config.auth_type) {
    case 'bearer':
      headers['Authorization'] = `Bearer ${config.api_key}`
      break
    case 'basic': {
      const encoded = typeof Buffer !== 'undefined'
        ? Buffer.from(`${config.api_key}:${config.api_secret || ''}`).toString('base64')
        : btoa(`${config.api_key}:${config.api_secret || ''}`)
      headers['Authorization'] = `Basic ${encoded}`
      break
    }
    case 'api_key':
      headers['X-API-Key'] = config.api_key
      break
    default:
      headers['Authorization'] = `Bearer ${config.api_key}`
  }

  return headers
}

async function fetchPaginated<T>(
  baseUrl: string,
  endpoint: string,
  headers: HeadersInit,
  maxPages: number = 50
): Promise<T[]> {
  const allRecords: T[] = []
  let currentPage = 1
  let hasMore = true

  while (hasMore && currentPage <= maxPages) {
    const separator = endpoint.includes('?') ? '&' : '?'
    const url = `${baseUrl}${endpoint}${separator}page=${currentPage}&per_page=100`

    const response = await fetch(url, { headers })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Payroll API error ${response.status}: ${error}`)
    }

    const data = await response.json()

    // Support both paginated and flat array responses
    if (Array.isArray(data)) {
      allRecords.push(...data)
      hasMore = false
    } else if (data.data && Array.isArray(data.data)) {
      const paginated = data as PaginatedResponse<T>
      allRecords.push(...paginated.data)
      hasMore = currentPage < (paginated.total_pages || 1)
      currentPage++
    } else if (data.results && Array.isArray(data.results)) {
      allRecords.push(...data.results)
      hasMore = !!data.next_page || !!data.next
      currentPage++
    } else {
      // Single object response
      allRecords.push(data as T)
      hasMore = false
    }
  }

  return allRecords
}

function applyFieldMappings(
  records: Record<string, unknown>[],
  mappings: FieldMapping[]
): Record<string, unknown>[] {
  if (!mappings || mappings.length === 0) return records

  return records.map(record => {
    const mapped: Record<string, unknown> = {}
    for (const m of mappings) {
      let value = record[m.externalField]
      if (value !== undefined && m.transform) {
        switch (m.transform) {
          case 'number':
            value = Number(value)
            break
          case 'string':
            value = String(value)
            break
          case 'date':
            value = new Date(value as string).toISOString()
            break
          case 'boolean':
            value = Boolean(value)
            break
        }
      }
      mapped[m.tempoField] = value
    }
    return mapped
  })
}

export const payrollApiConnector: IntegrationConnector = {
  id: 'payroll-api',
  name: 'Payroll API (REST)',
  description: 'Connect to external payroll systems via REST API. Supports custom field mapping.',
  icon: 'Banknote',
  category: 'payroll',
  capabilities: ['Payroll sync', 'Tax data', 'Salary export', 'Custom mapping'],

  configSchema: [
    { key: 'api_url', label: 'API Base URL', type: 'url', required: true, placeholder: 'https://payroll.example.com/api/v1' },
    { key: 'api_key', label: 'API Key / Token', type: 'password', required: true, placeholder: 'Enter API key or token' },
    { key: 'api_secret', label: 'API Secret (for Basic auth)', type: 'password', required: false, placeholder: 'Optional for Basic authentication' },
    {
      key: 'auth_type',
      label: 'Authentication Type',
      type: 'select',
      required: true,
      options: [
        { label: 'Bearer Token', value: 'bearer' },
        { label: 'Basic Auth', value: 'basic' },
        { label: 'API Key Header', value: 'api_key' },
      ],
    },
    { key: 'employees_endpoint', label: 'Employees Endpoint', type: 'text', required: false, placeholder: '/employees (default)' },
    { key: 'payroll_endpoint', label: 'Payroll Endpoint', type: 'text', required: false, placeholder: '/payroll (default)' },
    { key: 'health_endpoint', label: 'Health Check Endpoint', type: 'text', required: false, placeholder: '/health or /status (default)' },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { api_url, api_key, auth_type } = config
      if (!api_url || !api_key || !auth_type) {
        return { success: false, error: 'Missing required fields: API URL, API Key, and Auth Type are required.' }
      }

      const headers = buildAuthHeaders(config)
      const healthEndpoint = config.health_endpoint || '/health'

      // Try health endpoint first
      let response: Response
      try {
        response = await fetch(`${api_url}${healthEndpoint}`, { headers })
      } catch {
        // If health endpoint fails, try root
        response = await fetch(api_url, { headers })
      }

      if (!response.ok && response.status !== 404) {
        return {
          success: false,
          error: `Payroll API returned status ${response.status}. Verify your API URL and credentials.`,
        }
      }

      return {
        success: true,
        metadata: {
          apiUrl: api_url,
          authType: auth_type,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to payroll API',
      }
    }
  },

  async disconnect(): Promise<void> {
    // API key revocation is external
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []
    let recordsProcessed = 0
    let recordsFailed = 0

    try {
      // In production, the API route loads config from DB
      // and calls syncPayrollInbound() or syncPayrollOutbound()

      if (direction === 'outbound') {
        // Outbound: push salary data to external payroll
        // Would be called with employee salary data
        return {
          success: true,
          recordsProcessed,
          recordsFailed,
          errors,
          duration: Date.now() - startTime,
        }
      }

      // Inbound: pull payroll results
      return {
        success: true,
        recordsProcessed,
        recordsFailed,
        errors,
        duration: Date.now() - startTime,
      }
    } catch (err) {
      errors.push(err instanceof Error ? err.message : 'Unknown sync error')
      return {
        success: false,
        recordsProcessed,
        recordsFailed: recordsFailed + 1,
        errors,
        duration: Date.now() - startTime,
      }
    }
  },

  async testConnection(config: Record<string, string>): Promise<boolean> {
    try {
      const { api_url, api_key, auth_type } = config
      if (!api_url || !api_key || !auth_type) return false

      const headers = buildAuthHeaders(config)
      const healthEndpoint = config.health_endpoint || '/health'

      let response: Response
      try {
        response = await fetch(`${api_url}${healthEndpoint}`, {
          headers,
          signal: AbortSignal.timeout(10000),
        })
      } catch {
        response = await fetch(api_url, {
          headers,
          signal: AbortSignal.timeout(10000),
        })
      }

      return response.ok || response.status === 404
    } catch {
      return false
    }
  },
}

// Inbound sync: Pull payroll data from external API
export async function syncPayrollInbound(
  config: Record<string, string>,
  fieldMappings?: FieldMapping[]
): Promise<{ employees: PayrollEmployee[] | Record<string, unknown>[] }> {
  const { api_url } = config
  const headers = buildAuthHeaders(config)
  const endpoint = config.payroll_endpoint || '/payroll'

  const rawRecords = await fetchPaginated<Record<string, unknown>>(api_url, endpoint, headers)

  if (fieldMappings && fieldMappings.length > 0) {
    return { employees: applyFieldMappings(rawRecords, fieldMappings) }
  }

  return { employees: rawRecords as PayrollEmployee[] }
}

// Outbound sync: Push salary data to external payroll API
export async function syncPayrollOutbound(
  config: Record<string, string>,
  employeeData: Array<Record<string, unknown>>,
  fieldMappings?: FieldMapping[]
): Promise<{ success: boolean; errors: string[] }> {
  const { api_url } = config
  const headers = buildAuthHeaders(config)
  const endpoint = config.employees_endpoint || '/employees'
  const errors: string[] = []

  const dataToSend = fieldMappings && fieldMappings.length > 0
    ? applyFieldMappings(employeeData, fieldMappings)
    : employeeData

  // Batch send (some APIs support bulk, try single if bulk fails)
  try {
    const response = await fetch(`${api_url}${endpoint}/bulk`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ employees: dataToSend }),
    })

    if (response.ok) {
      return { success: true, errors }
    }

    // Fall back to individual sends
    if (response.status === 404) {
      for (const record of dataToSend) {
        try {
          const res = await fetch(`${api_url}${endpoint}`, {
            method: 'POST',
            headers,
            body: JSON.stringify(record),
          })
          if (!res.ok) {
            errors.push(`Failed to sync record: ${res.status}`)
          }
        } catch (err) {
          errors.push(err instanceof Error ? err.message : 'Failed to sync record')
        }
      }
      return { success: errors.length === 0, errors }
    }

    errors.push(`Bulk endpoint error: ${response.status}`)
    return { success: false, errors }
  } catch (err) {
    errors.push(err instanceof Error ? err.message : 'Outbound sync failed')
    return { success: false, errors }
  }
}
