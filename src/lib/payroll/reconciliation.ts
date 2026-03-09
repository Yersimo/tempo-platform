/**
 * Payroll Reconciliation & Variance Reporting
 *
 * Compares two payroll runs (period-over-period) to identify changes in
 * employee gross pay, new hires, exits, and significant variances.
 */

import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ReconciliationRow {
  employeeId: string
  employeeName: string
  country: string
  previousGross: number | null  // cents
  currentGross: number | null   // cents
  variance: number              // cents
  variancePercent: number
  status: 'new' | 'exited' | 'increase_significant' | 'decrease_significant' | 'stable'
}

export interface ReconciliationSummary {
  previousPeriod: string
  currentPeriod: string
  previousRunId: string
  currentRunId: string
  totalPreviousGross: number  // cents
  totalCurrentGross: number   // cents
  totalVariance: number       // cents
  totalVariancePercent: number
  significantVarianceCount: number
  newEmployeeCount: number
  exitedEmployeeCount: number
  rows: ReconciliationRow[]
}

// ---------------------------------------------------------------------------
// Threshold for "significant" variance (± 20%)
// ---------------------------------------------------------------------------
const SIGNIFICANT_VARIANCE_THRESHOLD = 0.20

// ---------------------------------------------------------------------------
// Main reconciliation function
// ---------------------------------------------------------------------------

export async function generateReconciliation(
  orgId: string,
  previousRunId: string,
  currentRunId: string,
): Promise<ReconciliationSummary> {
  // Validate both runs exist and are paid
  const [prevRun] = await db.select().from(schema.payrollRuns)
    .where(and(eq(schema.payrollRuns.id, previousRunId), eq(schema.payrollRuns.orgId, orgId)))
    .limit(1)
  if (!prevRun) throw new Error('Previous payroll run not found')
  if (prevRun.status !== 'paid') throw new Error(`Previous run must be in 'paid' status (current: '${prevRun.status}')`)

  const [currRun] = await db.select().from(schema.payrollRuns)
    .where(and(eq(schema.payrollRuns.id, currentRunId), eq(schema.payrollRuns.orgId, orgId)))
    .limit(1)
  if (!currRun) throw new Error('Current payroll run not found')
  if (currRun.status !== 'paid') throw new Error(`Current run must be in 'paid' status (current: '${currRun.status}')`)

  // Get entries for both runs joined with employee data
  const prevEntries = await db.select({
    employeeId: schema.employeePayrollEntries.employeeId,
    grossPay: schema.employeePayrollEntries.grossPay,
    fullName: schema.employees.fullName,
    country: schema.employees.country,
  })
    .from(schema.employeePayrollEntries)
    .innerJoin(schema.employees, eq(schema.employeePayrollEntries.employeeId, schema.employees.id))
    .where(eq(schema.employeePayrollEntries.payrollRunId, previousRunId))

  const currEntries = await db.select({
    employeeId: schema.employeePayrollEntries.employeeId,
    grossPay: schema.employeePayrollEntries.grossPay,
    fullName: schema.employees.fullName,
    country: schema.employees.country,
  })
    .from(schema.employeePayrollEntries)
    .innerJoin(schema.employees, eq(schema.employeePayrollEntries.employeeId, schema.employees.id))
    .where(eq(schema.employeePayrollEntries.payrollRunId, currentRunId))

  // Build maps by employeeId
  const prevMap = new Map(prevEntries.map(e => [e.employeeId, e]))
  const currMap = new Map(currEntries.map(e => [e.employeeId, e]))

  // Collect all unique employee IDs
  const allEmployeeIds = new Set([...prevMap.keys(), ...currMap.keys()])

  const rows: ReconciliationRow[] = []
  let totalPreviousGross = 0
  let totalCurrentGross = 0
  let significantVarianceCount = 0
  let newEmployeeCount = 0
  let exitedEmployeeCount = 0

  for (const empId of allEmployeeIds) {
    const prev = prevMap.get(empId)
    const curr = currMap.get(empId)

    const previousGross = prev?.grossPay ?? null
    const currentGross = curr?.grossPay ?? null
    const employeeName = curr?.fullName || prev?.fullName || 'Unknown'
    const country = curr?.country || prev?.country || '-'

    if (previousGross !== null) totalPreviousGross += previousGross
    if (currentGross !== null) totalCurrentGross += currentGross

    // Calculate variance
    const variance = (currentGross ?? 0) - (previousGross ?? 0)
    const variancePercent = previousGross && previousGross !== 0
      ? variance / previousGross
      : currentGross ? 1 : 0

    // Determine status
    let status: ReconciliationRow['status']
    if (previousGross === null) {
      status = 'new'
      newEmployeeCount++
    } else if (currentGross === null) {
      status = 'exited'
      exitedEmployeeCount++
    } else if (variancePercent >= SIGNIFICANT_VARIANCE_THRESHOLD) {
      status = 'increase_significant'
      significantVarianceCount++
    } else if (variancePercent <= -SIGNIFICANT_VARIANCE_THRESHOLD) {
      status = 'decrease_significant'
      significantVarianceCount++
    } else {
      status = 'stable'
    }

    rows.push({
      employeeId: empId,
      employeeName,
      country,
      previousGross,
      currentGross,
      variance,
      variancePercent,
      status,
    })
  }

  // Sort: significant changes first, then new/exited, then stable
  const statusOrder: Record<string, number> = {
    increase_significant: 0,
    decrease_significant: 1,
    new: 2,
    exited: 3,
    stable: 4,
  }
  rows.sort((a, b) => (statusOrder[a.status] ?? 5) - (statusOrder[b.status] ?? 5))

  const totalVariance = totalCurrentGross - totalPreviousGross
  const totalVariancePercent = totalPreviousGross !== 0
    ? totalVariance / totalPreviousGross
    : 0

  return {
    previousPeriod: prevRun.period,
    currentPeriod: currRun.period,
    previousRunId,
    currentRunId,
    totalPreviousGross,
    totalCurrentGross,
    totalVariance,
    totalVariancePercent,
    significantVarianceCount,
    newEmployeeCount,
    exitedEmployeeCount,
    rows,
  }
}
