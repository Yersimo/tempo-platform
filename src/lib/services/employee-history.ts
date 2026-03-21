// ---------------------------------------------------------------------------
// Employee History Service
// Provides effective-dated change tracking and "as-of" reconstruction
// ---------------------------------------------------------------------------

import { db } from '@/lib/db'
import { employeeHistory } from '@/lib/db/schema'
import { eq, and, lte, desc, asc } from 'drizzle-orm'

// ---- Types ----

export interface ChangeRecord {
  employeeId: string
  fieldName: string
  oldValue: string | null
  newValue: string | null
  effectiveDate: string
  changedBy?: string | null
  changeReason?: string | null
  changeType: string
  orgId: string
}

export type ChangeType = 'hire' | 'promotion' | 'transfer' | 'compensation' | 'termination' | 'correction'

// Fields that can be tracked
export const TRACKED_FIELDS = [
  'job_title', 'department_id', 'level', 'salary', 'manager_id',
  'country', 'role', 'is_active', 'cost_center', 'fte',
] as const

// Human-readable labels for field names
export const FIELD_LABELS: Record<string, string> = {
  job_title: 'Job Title',
  department_id: 'Department',
  level: 'Level',
  salary: 'Salary',
  manager_id: 'Manager',
  country: 'Country',
  role: 'Role',
  is_active: 'Active Status',
  cost_center: 'Cost Center',
  fte: 'FTE',
}

// Human-readable labels for change types
export const CHANGE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  hire: { label: 'Hired', color: 'emerald' },
  promotion: { label: 'Promotion', color: 'blue' },
  transfer: { label: 'Transfer', color: 'purple' },
  compensation: { label: 'Compensation', color: 'amber' },
  termination: { label: 'Termination', color: 'red' },
  correction: { label: 'Correction', color: 'zinc' },
}

// ---- Core Functions ----

/**
 * Record a change to an employee field
 */
export async function recordChange(record: ChangeRecord) {
  const [inserted] = await db.insert(employeeHistory).values({
    orgId: record.orgId,
    employeeId: record.employeeId,
    fieldName: record.fieldName,
    oldValue: record.oldValue,
    newValue: record.newValue,
    effectiveDate: record.effectiveDate,
    changedBy: record.changedBy,
    changeReason: record.changeReason,
    changeType: record.changeType,
  }).returning()
  return inserted
}

/**
 * Record multiple field changes at once (e.g., promotion changes both title and salary)
 */
export async function recordBulkChanges(records: ChangeRecord[]) {
  if (records.length === 0) return []
  const inserted = await db.insert(employeeHistory).values(
    records.map(r => ({
      orgId: r.orgId,
      employeeId: r.employeeId,
      fieldName: r.fieldName,
      oldValue: r.oldValue,
      newValue: r.newValue,
      effectiveDate: r.effectiveDate,
      changedBy: r.changedBy,
      changeReason: r.changeReason,
      changeType: r.changeType,
    }))
  ).returning()
  return inserted
}

/**
 * Get full change history for an employee, optionally filtered by field
 */
export async function getChangeHistory(
  employeeId: string,
  fieldName?: string,
) {
  const conditions = [eq(employeeHistory.employeeId, employeeId)]
  if (fieldName) {
    conditions.push(eq(employeeHistory.fieldName, fieldName))
  }
  return db
    .select()
    .from(employeeHistory)
    .where(and(...conditions))
    .orderBy(desc(employeeHistory.effectiveDate), desc(employeeHistory.createdAt))
}

/**
 * Reconstruct an employee's field values as of a given date
 * Returns a map of fieldName -> value at that point in time
 */
export async function getEmployeeAsOf(employeeId: string, asOfDate: string) {
  // Get the most recent change for each field on or before the as-of date
  const changes = await db
    .select()
    .from(employeeHistory)
    .where(
      and(
        eq(employeeHistory.employeeId, employeeId),
        lte(employeeHistory.effectiveDate, asOfDate),
      )
    )
    .orderBy(asc(employeeHistory.effectiveDate), asc(employeeHistory.createdAt))

  // Build the state by replaying changes in order
  const state: Record<string, string | null> = {}
  for (const change of changes) {
    state[change.fieldName] = change.newValue
  }
  return state
}

/**
 * Get all changes across an org in a date range
 */
export async function getOrgChanges(
  orgId: string,
  startDate: string,
  endDate: string,
) {
  const { gte } = await import('drizzle-orm')
  return db
    .select()
    .from(employeeHistory)
    .where(
      and(
        eq(employeeHistory.orgId, orgId),
        gte(employeeHistory.effectiveDate, startDate),
        lte(employeeHistory.effectiveDate, endDate),
      )
    )
    .orderBy(desc(employeeHistory.effectiveDate))
}
