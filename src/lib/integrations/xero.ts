// ============================================================
// Xero Connector
// Payroll sync, invoice sync, expense tracking, and tax reporting
// ============================================================

import type { IntegrationConnector, ConnectionResult, SyncResult, ConfigField } from './index'

const XERO_API_BASE = 'https://api.xero.com/api.xro/2.0'
const XERO_PAYROLL_BASE = 'https://api.xero.com/payroll.xro/2.0'
const XERO_TOKEN_URL = 'https://identity.xero.com/connect/token'

interface XeroEmployee {
  EmployeeID: string
  FirstName: string
  LastName: string
  Email?: string
  DateOfBirth?: string
  Gender?: string
  Phone?: string
  StartDate?: string
  Status: string
  PayTemplate?: {
    EarningsLines: Array<{
      EarningsRateID: string
      AnnualSalary?: number
      RatePerUnit?: number
    }>
  }
}

interface XeroInvoice {
  InvoiceID: string
  InvoiceNumber: string
  Type: 'ACCREC' | 'ACCPAY'
  Contact: { ContactID: string; Name: string }
  DateString: string
  DueDateString: string
  Status: string
  Total: number
  AmountDue: number
  CurrencyCode: string
}

interface XeroPayRun {
  PayRunID: string
  PayPeriodStartDate: string
  PayPeriodEndDate: string
  PayRunStatus: string
  Wages: number
  Deductions: number
  Tax: number
  NetPay: number
}

interface TokenResponse {
  access_token: string
  token_type: string
  expires_in: number
  refresh_token?: string
}

async function getXeroAccessToken(
  clientId: string,
  clientSecret: string
): Promise<string> {
  const encoded = typeof Buffer !== 'undefined'
    ? Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    : btoa(`${clientId}:${clientSecret}`)

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'accounting.transactions accounting.contacts payroll.employees payroll.payruns',
  })

  const response = await fetch(XERO_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to acquire Xero access token: ${response.status} - ${error}`)
  }

  const data: TokenResponse = await response.json()
  return data.access_token
}

async function xeroGet<T>(
  accessToken: string,
  baseUrl: string,
  path: string,
  organizationId: string
): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Xero-Tenant-Id': organizationId,
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Xero API error: ${response.status} - ${error}`)
  }

  return response.json()
}

async function fetchXeroEmployees(
  accessToken: string,
  organizationId: string
): Promise<XeroEmployee[]> {
  const data = await xeroGet<{ Employees: XeroEmployee[] }>(
    accessToken,
    XERO_PAYROLL_BASE,
    '/Employees',
    organizationId
  )
  return data.Employees || []
}

async function fetchXeroInvoices(
  accessToken: string,
  organizationId: string
): Promise<XeroInvoice[]> {
  const data = await xeroGet<{ Invoices: XeroInvoice[] }>(
    accessToken,
    XERO_API_BASE,
    '/Invoices?Statuses=AUTHORISED,PAID&page=1',
    organizationId
  )
  return data.Invoices || []
}

async function fetchXeroPayRuns(
  accessToken: string,
  organizationId: string
): Promise<XeroPayRun[]> {
  const data = await xeroGet<{ PayRuns: XeroPayRun[] }>(
    accessToken,
    XERO_PAYROLL_BASE,
    '/PayRuns',
    organizationId
  )
  return data.PayRuns || []
}

export function mapXeroEmployeeToEmployee(employee: XeroEmployee) {
  const salary = employee.PayTemplate?.EarningsLines?.[0]?.AnnualSalary || null

  return {
    externalId: employee.EmployeeID,
    fullName: `${employee.FirstName} ${employee.LastName}`,
    email: employee.Email || null,
    phone: employee.Phone || null,
    isActive: employee.Status === 'ACTIVE',
    startDate: employee.StartDate || null,
    annualSalary: salary,
  }
}

export const xeroConnector: IntegrationConnector = {
  id: 'xero',
  name: 'Xero',
  description: 'Sync payroll data, invoices, expenses, and tax reporting from Xero.',
  icon: 'Receipt',
  category: 'payroll',
  capabilities: ['Payroll sync', 'Invoice sync', 'Expense tracking', 'Tax reporting'],

  configSchema: [
    { key: 'client_id', label: 'Client ID', type: 'text', required: true, placeholder: 'Enter Xero app client ID' },
    { key: 'client_secret', label: 'Client Secret', type: 'password', required: true, placeholder: 'Enter Xero app client secret' },
    { key: 'organization_id', label: 'Organization ID', type: 'text', required: true, placeholder: 'Xero tenant/organization ID' },
  ] as ConfigField[],

  async connect(config: Record<string, string>): Promise<ConnectionResult> {
    try {
      const { client_id, client_secret, organization_id } = config
      if (!client_id || !client_secret || !organization_id) {
        return { success: false, error: 'Missing required fields: Client ID, Client Secret, and Organization ID are required.' }
      }

      const accessToken = await getXeroAccessToken(client_id, client_secret)

      // Verify by fetching organization info
      const orgInfo = await xeroGet<{ Organisations: Array<{ Name: string; OrganisationID: string }> }>(
        accessToken,
        XERO_API_BASE,
        '/Organisation',
        organization_id
      )
      const org = orgInfo.Organisations?.[0]

      return {
        success: true,
        metadata: {
          organizationName: org?.Name || 'Unknown',
          organizationId: organization_id,
          connectedAt: new Date().toISOString(),
        },
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to connect to Xero',
      }
    }
  },

  async disconnect(): Promise<void> {
    // OAuth app disconnection is handled in Xero settings
  },

  async sync(_integrationId: string, direction: 'inbound' | 'outbound'): Promise<SyncResult> {
    const startTime = Date.now()
    const errors: string[] = []

    if (direction === 'outbound') {
      return {
        success: false,
        recordsProcessed: 0,
        recordsFailed: 0,
        errors: ['Outbound sync to Xero is not supported in this version.'],
        duration: Date.now() - startTime,
      }
    }

    // In production, the API route handler loads config and calls syncXero()
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
      const { client_id, client_secret, organization_id } = config
      if (!client_id || !client_secret || !organization_id) return false

      const accessToken = await getXeroAccessToken(client_id, client_secret)
      await xeroGet(accessToken, XERO_API_BASE, '/Organisation', organization_id)
      return true
    } catch {
      return false
    }
  },
}

// Full sync helper callable with credentials
export async function syncXero(
  config: Record<string, string>
): Promise<{
  employees: ReturnType<typeof mapXeroEmployeeToEmployee>[]
  invoices: XeroInvoice[]
  payRuns: XeroPayRun[]
}> {
  const { client_id, client_secret, organization_id } = config
  const accessToken = await getXeroAccessToken(client_id, client_secret)

  const [rawEmployees, invoices, payRuns] = await Promise.all([
    fetchXeroEmployees(accessToken, organization_id),
    fetchXeroInvoices(accessToken, organization_id),
    fetchXeroPayRuns(accessToken, organization_id),
  ])

  const employees = rawEmployees.map(mapXeroEmployeeToEmployee)
  return { employees, invoices, payRuns }
}
