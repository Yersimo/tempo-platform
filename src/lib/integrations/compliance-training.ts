/**
 * Compliance Training -> Compliance Integration
 *
 * When compliance training is completed or overdue:
 * 1. Update the compliance module's training status
 * 2. Generate compliance report entries
 * 3. Flag overdue training as a compliance risk
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Compliance training status entry to create/update */
export interface ComplianceTrainingStatus {
  employeeId: string
  trainingId: string
  courseId: string
  courseName: string
  requirementId: string
  status: 'completed' | 'overdue' | 'expiring_soon' | 'assigned'
  completedAt?: string
  dueDate?: string
  regulationType?: string
}

/** Compliance report entry generated from training events */
export interface ComplianceReportEntry {
  type: 'training_completed' | 'training_overdue' | 'training_expiring'
  severity: 'info' | 'warning' | 'critical'
  title: string
  description: string
  employeeId: string
  requirementId: string
  regulationType?: string
  timestamp: string
  metadata: Record<string, unknown>
}

/** Compliance risk flag for overdue training */
export interface ComplianceRiskFlag {
  employeeId: string
  riskType: 'overdue_training'
  severity: 'high' | 'critical'
  title: string
  description: string
  requirementId: string
  courseId: string
  courseName: string
  dueDate: string
  daysOverdue: number
}

/** Result of processing a compliance training status change */
export interface ComplianceTrainingResult {
  employeeId: string
  trainingId: string
  reportEntries: ComplianceReportEntry[]
  riskFlags: ComplianceRiskFlag[]
  statusUpdate: ComplianceTrainingStatus
}

/** Store slice needed for compliance training operations */
export interface ComplianceTrainingStoreSlice {
  addComplianceAlert?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Process a compliance training status change.
 *
 * Handles three scenarios:
 * - Training completed: generates a positive compliance report entry
 * - Training overdue: generates a risk flag and critical report entry
 * - Training expiring soon: generates a warning report entry
 *
 * @param status - The training status change data
 * @returns Processing result with report entries and risk flags
 */
export function processComplianceTrainingChange(
  status: ComplianceTrainingStatus,
): ComplianceTrainingResult {
  const now = new Date()
  const reportEntries: ComplianceReportEntry[] = []
  const riskFlags: ComplianceRiskFlag[] = []

  if (status.status === 'completed') {
    reportEntries.push({
      type: 'training_completed',
      severity: 'info',
      title: `Compliance Training Completed: ${status.courseName}`,
      description: `Employee completed required compliance training "${status.courseName}"${status.regulationType ? ` (${status.regulationType})` : ''}.`,
      employeeId: status.employeeId,
      requirementId: status.requirementId,
      regulationType: status.regulationType,
      timestamp: status.completedAt || now.toISOString(),
      metadata: {
        training_id: status.trainingId,
        course_id: status.courseId,
        source: 'compliance-training-integration',
      },
    })
  }

  if (status.status === 'overdue') {
    const dueDate = status.dueDate ? new Date(status.dueDate) : now
    const daysOverdue = Math.max(0, Math.ceil((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)))
    const severity = daysOverdue > 30 ? 'critical' as const : 'high' as const

    reportEntries.push({
      type: 'training_overdue',
      severity: daysOverdue > 30 ? 'critical' : 'warning',
      title: `OVERDUE: Compliance Training "${status.courseName}"`,
      description: `Required compliance training "${status.courseName}" is ${daysOverdue} day(s) overdue${status.regulationType ? ` (${status.regulationType})` : ''}. Immediate action required.`,
      employeeId: status.employeeId,
      requirementId: status.requirementId,
      regulationType: status.regulationType,
      timestamp: now.toISOString(),
      metadata: {
        training_id: status.trainingId,
        course_id: status.courseId,
        days_overdue: daysOverdue,
        source: 'compliance-training-integration',
      },
    })

    riskFlags.push({
      employeeId: status.employeeId,
      riskType: 'overdue_training',
      severity,
      title: `Overdue Compliance Training: ${status.courseName}`,
      description: `${daysOverdue} day(s) past due. Required by ${status.regulationType || 'company policy'}.`,
      requirementId: status.requirementId,
      courseId: status.courseId,
      courseName: status.courseName,
      dueDate: status.dueDate || now.toISOString().split('T')[0],
      daysOverdue,
    })
  }

  if (status.status === 'expiring_soon') {
    reportEntries.push({
      type: 'training_expiring',
      severity: 'warning',
      title: `Compliance Training Expiring: ${status.courseName}`,
      description: `Compliance training "${status.courseName}" certification is expiring soon (due: ${status.dueDate})${status.regulationType ? ` (${status.regulationType})` : ''}. Renewal recommended.`,
      employeeId: status.employeeId,
      requirementId: status.requirementId,
      regulationType: status.regulationType,
      timestamp: now.toISOString(),
      metadata: {
        training_id: status.trainingId,
        course_id: status.courseId,
        due_date: status.dueDate,
        source: 'compliance-training-integration',
      },
    })
  }

  return {
    employeeId: status.employeeId,
    trainingId: status.trainingId,
    reportEntries,
    riskFlags,
    statusUpdate: status,
  }
}

/**
 * Apply compliance training results to the store.
 *
 * @param result - Output from processComplianceTrainingChange
 * @param store  - Store actions for persisting
 * @returns Number of alerts/entries created
 */
export function applyComplianceTrainingAlerts(
  result: ComplianceTrainingResult,
  store: ComplianceTrainingStoreSlice,
): number {
  let created = 0

  // Create compliance alerts for risk flags
  for (const flag of result.riskFlags) {
    if (store.addComplianceAlert) {
      store.addComplianceAlert({
        type: 'overdue_training',
        severity: flag.severity,
        title: flag.title,
        description: flag.description,
        employee_id: flag.employeeId,
        requirement_id: flag.requirementId,
        course_id: flag.courseId,
        days_overdue: flag.daysOverdue,
        status: 'open',
        source: 'compliance-training-integration',
        auto_generated: true,
        created_at: new Date().toISOString(),
      })
      created++
    }
  }

  // Create compliance alerts for report entries with warning/critical severity
  for (const entry of result.reportEntries) {
    if (entry.severity !== 'info' && store.addComplianceAlert) {
      store.addComplianceAlert({
        type: entry.type,
        severity: entry.severity === 'critical' ? 'high' : 'medium',
        title: entry.title,
        description: entry.description,
        employee_id: entry.employeeId,
        requirement_id: entry.requirementId,
        regulation_type: entry.regulationType,
        status: 'open',
        source: 'compliance-training-integration',
        auto_generated: true,
        created_at: entry.timestamp,
      })
      created++
    }
  }

  return created
}
