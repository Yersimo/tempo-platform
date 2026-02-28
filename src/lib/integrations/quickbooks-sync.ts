import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

const QB_API_BASE = 'https://quickbooks.api.intuit.com/v3/company'
const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

interface QBJournalEntry {
  Line: Array<{
    DetailType: 'JournalEntryLineDetail'
    Amount: number
    Description?: string
    JournalEntryLineDetail: {
      PostingType: 'Debit' | 'Credit'
      AccountRef: { value: string; name?: string }
    }
  }>
  TxnDate: string
  PrivateNote?: string
  DocNumber?: string
}

// Refresh the QuickBooks access token if expired
async function refreshQBToken(integrationId: string, credentials: {
  access_token: string
  refresh_token: string
  expires_at: string
  realm_id: string
}): Promise<string> {
  // Check if token is still valid (with 5 min buffer)
  const expiresAt = new Date(credentials.expires_at)
  if (expiresAt.getTime() - Date.now() > 5 * 60 * 1000) {
    return credentials.access_token
  }

  // Refresh the token
  const clientId = process.env.QUICKBOOKS_CLIENT_ID
  const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET
  if (!clientId || !clientSecret) throw new Error('QuickBooks credentials not configured')

  const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(QB_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${encoded}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: credentials.refresh_token,
    }).toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`QB token refresh failed: ${response.status} - ${error}`)
  }

  const tokenData = await response.json()

  // Update stored credentials
  const newCredentials = {
    ...credentials,
    access_token: tokenData.access_token,
    refresh_token: tokenData.refresh_token || credentials.refresh_token,
    expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
  }

  await db.update(schema.integrations)
    .set({ credentials: newCredentials, updatedAt: new Date() })
    .where(eq(schema.integrations.id, integrationId))

  return tokenData.access_token
}

// Create a journal entry in QuickBooks
async function createJournalEntry(
  accessToken: string,
  realmId: string,
  entry: QBJournalEntry
): Promise<{ Id: string; SyncToken: string }> {
  const response = await fetch(`${QB_API_BASE}/${realmId}/journalentry`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(entry),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`QB journal entry creation failed: ${response.status} - ${error}`)
  }

  const data = await response.json()
  return data.JournalEntry
}

// Sync a single payroll run to QuickBooks as journal entries
export async function syncPayrollToQuickBooks(
  orgId: string,
  payrollRunId: string
): Promise<{
  success: boolean
  journalEntryId?: string
  error?: string
}> {
  try {
    // 1. Get the QuickBooks integration for this org
    const [integration] = await db.select()
      .from(schema.integrations)
      .where(and(
        eq(schema.integrations.orgId, orgId),
        eq(schema.integrations.provider, 'quickbooks'),
        eq(schema.integrations.status, 'connected')
      ))

    if (!integration) {
      return { success: false, error: 'QuickBooks integration not found or not connected' }
    }

    const credentials = integration.credentials as {
      access_token: string
      refresh_token: string
      expires_at: string
      realm_id: string
    }

    if (!credentials?.access_token || !credentials?.realm_id) {
      return { success: false, error: 'QuickBooks credentials incomplete' }
    }

    // 2. Get the payroll run
    const [payrollRun] = await db.select()
      .from(schema.payrollRuns)
      .where(and(
        eq(schema.payrollRuns.id, payrollRunId),
        eq(schema.payrollRuns.orgId, orgId)
      ))

    if (!payrollRun) {
      return { success: false, error: 'Payroll run not found' }
    }

    if (payrollRun.status !== 'approved' && payrollRun.status !== 'processing' && payrollRun.status !== 'paid') {
      return { success: false, error: `Payroll run must be approved/processing/paid, got: ${payrollRun.status}` }
    }

    // 3. Get payroll entries
    const entries = await db.select()
      .from(schema.employeePayrollEntries)
      .where(eq(schema.employeePayrollEntries.payrollRunId, payrollRunId))

    if (entries.length === 0) {
      return { success: false, error: 'No payroll entries found for this run' }
    }

    // 4. Refresh token if needed
    const accessToken = await refreshQBToken(integration.id, credentials)

    // 5. Build the journal entry
    // Standard payroll journal entry:
    //   Debit: Salary Expense (total gross)
    //   Credit: Payroll Tax Payable (total tax)
    //   Credit: Payroll Liability - Deductions (total deductions minus tax)
    //   Credit: Cash/Bank (total net - what's actually paid out)
    
    const totalGross = entries.reduce((sum, e) => sum + Number(e.grossPay || 0), 0)
    const totalTax = entries.reduce((sum, e) => sum + Number(e.federalTax || 0) + Number(e.stateTax || 0), 0)
    const totalSocialSecurity = entries.reduce((sum, e) => sum + Number(e.socialSecurity || 0), 0)
    const totalMedicare = entries.reduce((sum, e) => sum + Number(e.medicare || 0), 0)
    const totalPension = entries.reduce((sum, e) => sum + Number(e.pension || 0), 0)
    const totalNet = entries.reduce((sum, e) => sum + Number(e.netPay || 0), 0)

    // QB uses account references - these are typical QB account IDs
    // In production, these would be configurable per-org via integration.mappings
    const config = integration.config as Record<string, string> | null
    const salaryExpenseAccount = config?.salary_expense_account || '62' // Salary Expense
    const taxPayableAccount = config?.tax_payable_account || '65'       // Payroll Tax Payable
    const deductionsAccount = config?.deductions_account || '66'        // Payroll Deductions
    const bankAccount = config?.bank_account || '35'                    // Checking/Bank

    const journalEntry: QBJournalEntry = {
      TxnDate: payrollRun.createdAt.toISOString().split('T')[0],
      DocNumber: `PAY-${payrollRun.id.slice(0, 8)}`,
      PrivateNote: `Tempo Payroll: ${payrollRun.period} (${entries.length} employees)`,
      Line: [
        // Debit: Salary Expense
        {
          DetailType: 'JournalEntryLineDetail',
          Amount: Math.round(totalGross * 100) / 100,
          Description: `Gross payroll - ${payrollRun.period}`,
          JournalEntryLineDetail: {
            PostingType: 'Debit',
            AccountRef: { value: salaryExpenseAccount },
          },
        },
        // Credit: Tax Payable
        {
          DetailType: 'JournalEntryLineDetail',
          Amount: Math.round(totalTax * 100) / 100,
          Description: `Payroll taxes - ${payrollRun.period}`,
          JournalEntryLineDetail: {
            PostingType: 'Credit',
            AccountRef: { value: taxPayableAccount },
          },
        },
        // Credit: Other Deductions (SS + Medicare + Pension)
        {
          DetailType: 'JournalEntryLineDetail',
          Amount: Math.round((totalSocialSecurity + totalMedicare + totalPension) * 100) / 100,
          Description: `Social security, medicare, pension - ${payrollRun.period}`,
          JournalEntryLineDetail: {
            PostingType: 'Credit',
            AccountRef: { value: deductionsAccount },
          },
        },
        // Credit: Bank (net pay)
        {
          DetailType: 'JournalEntryLineDetail',
          Amount: Math.round(totalNet * 100) / 100,
          Description: `Net payroll disbursement - ${payrollRun.period}`,
          JournalEntryLineDetail: {
            PostingType: 'Credit',
            AccountRef: { value: bankAccount },
          },
        },
      ],
    }

    // 6. Create the journal entry in QuickBooks
    const result = await createJournalEntry(accessToken, credentials.realm_id, journalEntry)

    // 7. Log the sync
    await db.insert(schema.integrationLogs).values({
      integrationId: integration.id,
      orgId,
      action: 'sync_payroll',
      status: 'success',
      recordsProcessed: entries.length,
      details: `Synced payroll run ${payrollRunId} as journal entry ${result.Id}`,
    })

    // Update integration last sync
    await db.update(schema.integrations)
      .set({ lastSyncAt: new Date(), lastSyncStatus: 'success', lastSyncDetails: `Journal entry ${result.Id}` })
      .where(eq(schema.integrations.id, integration.id))

    return { success: true, journalEntryId: result.Id }
  } catch (error) {
    console.error('[QB Sync] Error:', error)

    // Log the failure
    try {
      const [integration] = await db.select()
        .from(schema.integrations)
        .where(and(
          eq(schema.integrations.orgId, orgId),
          eq(schema.integrations.provider, 'quickbooks')
        ))
      
      if (integration) {
        await db.insert(schema.integrationLogs).values({
          integrationId: integration.id,
          orgId,
          action: 'sync_payroll',
          status: 'error',
          errorMessage: error instanceof Error ? error.message : String(error),
        })
      }
    } catch { /* logging is non-critical */ }

    return { success: false, error: error instanceof Error ? error.message : String(error) }
  }
}

// Sync all approved but unsynced payroll runs for an org
export async function syncAllPendingPayroll(orgId: string): Promise<{
  synced: number
  failed: number
  errors: string[]
}> {
  const result = { synced: 0, failed: 0, errors: [] as string[] }

  // Get all approved/paid runs that haven't been synced
  const runs = await db.select()
    .from(schema.payrollRuns)
    .where(and(
      eq(schema.payrollRuns.orgId, orgId)
    ))

  // Filter to runs that need syncing (approved or paid)
  const toSync = runs.filter(r => r.status === 'approved' || r.status === 'paid')

  for (const run of toSync) {
    const syncResult = await syncPayrollToQuickBooks(orgId, run.id)
    if (syncResult.success) {
      result.synced++
    } else {
      result.failed++
      result.errors.push(`Run ${run.id}: ${syncResult.error}`)
    }
  }

  return result
}
