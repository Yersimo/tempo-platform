/**
 * Payroll Audit Trail — Immutable logging for all payroll status transitions.
 *
 * The underlying `payroll_audit_log` table has DB-level rules preventing
 * UPDATE and DELETE, making entries truly append-only.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type PayrollAuditAction =
  | 'created'
  | 'submitted'
  | 'approved_hr'
  | 'approved_finance'
  | 'rejected'
  | 'processing'
  | 'paid'
  | 'cancelled'
  | 'entry_modified'

export interface LogPayrollAuditParams {
  orgId: string
  payrollRunId?: string
  employeePayrollEntryId?: string
  action: PayrollAuditAction
  actorId: string
  oldValue?: Record<string, unknown>
  newValue?: Record<string, unknown>
  reason?: string
}

export interface AuditTrailEntry {
  id: string
  payrollRunId: string | null
  employeePayrollEntryId: string | null
  action: string
  actorId: string
  actorName: string
  oldValue: unknown
  newValue: unknown
  reason: string | null
  createdAt: Date
}

// ---------------------------------------------------------------------------
// Helper – resolve actor name from employees table
// ---------------------------------------------------------------------------

async function resolveActorName(actorId: string): Promise<string> {
  try {
    const [emp] = await db
      .select({ fullName: schema.employees.fullName })
      .from(schema.employees)
      .where(eq(schema.employees.id, actorId))
      .limit(1)
    return emp?.fullName || 'System'
  } catch {
    return 'System'
  }
}

// ---------------------------------------------------------------------------
// Core logging function
// ---------------------------------------------------------------------------

/**
 * Insert an immutable audit log entry for a payroll event.
 * Automatically looks up the actor's name from the employees table.
 */
export async function logPayrollAudit(params: LogPayrollAuditParams): Promise<void> {
  const actorName = await resolveActorName(params.actorId)

  await db.insert(schema.payrollAuditLog).values({
    orgId: params.orgId,
    payrollRunId: params.payrollRunId || null,
    employeePayrollEntryId: params.employeePayrollEntryId || null,
    action: params.action,
    actorId: params.actorId,
    actorName,
    oldValue: params.oldValue || null,
    newValue: params.newValue || null,
    reason: params.reason || null,
  })
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Retrieve the full audit trail for a specific payroll run, ordered chronologically.
 */
export async function getPayrollRunAuditTrail(
  orgId: string,
  payrollRunId: string,
): Promise<AuditTrailEntry[]> {
  const rows = await db
    .select()
    .from(schema.payrollAuditLog)
    .where(
      and(
        eq(schema.payrollAuditLog.orgId, orgId),
        eq(schema.payrollAuditLog.payrollRunId, payrollRunId),
      ),
    )
    .orderBy(schema.payrollAuditLog.createdAt)

  return rows.map((row) => ({
    id: row.id,
    payrollRunId: row.payrollRunId,
    employeePayrollEntryId: row.employeePayrollEntryId,
    action: row.action,
    actorId: row.actorId,
    actorName: row.actorName,
    oldValue: row.oldValue,
    newValue: row.newValue,
    reason: row.reason,
    createdAt: row.createdAt,
  }))
}

/**
 * Retrieve all audit log entries for an org, most recent first.
 * Useful for a global audit dashboard.
 */
export async function getOrgPayrollAuditLog(
  orgId: string,
  limit = 100,
): Promise<AuditTrailEntry[]> {
  const rows = await db
    .select()
    .from(schema.payrollAuditLog)
    .where(eq(schema.payrollAuditLog.orgId, orgId))
    .orderBy(desc(schema.payrollAuditLog.createdAt))
    .limit(limit)

  return rows.map((row) => ({
    id: row.id,
    payrollRunId: row.payrollRunId,
    employeePayrollEntryId: row.employeePayrollEntryId,
    action: row.action,
    actorId: row.actorId,
    actorName: row.actorName,
    oldValue: row.oldValue,
    newValue: row.newValue,
    reason: row.reason,
    createdAt: row.createdAt,
  }))
}
