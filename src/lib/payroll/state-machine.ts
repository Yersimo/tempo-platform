// Payroll State Machine
// Enforces valid status transitions with guard conditions

export type PayrollStatus = 'draft' | 'approved' | 'processing' | 'paid' | 'cancelled'

export interface PayrollRun {
  payrollRunId: string
  status: PayrollStatus
  entryCount: number
  approvedAt?: Date
  processedAt?: Date
  paidAt?: Date
  cancelledAt?: Date
  paymentReference?: string
}

export interface TransitionContext {
  approverId?: string
  approverRole?: 'owner' | 'admin' | 'hrbp' | 'manager' | 'employee'
  paymentReference?: string
  cancellationReason?: string
  processingTimestamp?: Date
}

export type TransitionSuccess = {
  success: true
  newStatus: PayrollStatus
}

export type TransitionFailure = {
  success: false
  error: string
}

export type TransitionResult = TransitionSuccess | TransitionFailure

// ---------------------------------------------------------------------------
// Guard condition type
// ---------------------------------------------------------------------------

type GuardFn = (run: PayrollRun, ctx: TransitionContext) => string | null

// ---------------------------------------------------------------------------
// Transition definitions
// ---------------------------------------------------------------------------

interface TransitionDef {
  from: PayrollStatus[]
  to: PayrollStatus
  guards: GuardFn[]
}

const FINANCE_ROLES: TransitionContext['approverRole'][] = ['owner', 'admin']

// Guard: all entries must be calculated (entryCount > 0)
function requireEntries(run: PayrollRun, _ctx: TransitionContext): string | null {
  if (run.entryCount <= 0) {
    return 'Cannot approve a payroll run with no calculated entries'
  }
  return null
}

// Guard: approver must have a finance-level role (owner or admin)
function requireFinanceApprover(_run: PayrollRun, ctx: TransitionContext): string | null {
  if (!ctx.approverId) {
    return 'Approver ID is required'
  }
  if (!ctx.approverRole) {
    return 'Approver role is required'
  }
  if (!FINANCE_ROLES.includes(ctx.approverRole)) {
    return `Approver role '${ctx.approverRole}' is not authorised to approve payroll runs. Required: ${FINANCE_ROLES.join(' or ')}`
  }
  return null
}

// Guard: a processing timestamp must be provided
function requireProcessingTimestamp(_run: PayrollRun, ctx: TransitionContext): string | null {
  if (!ctx.processingTimestamp) {
    return 'Processing timestamp is required to move to processing status'
  }
  return null
}

// Guard: a payment reference must be provided
function requirePaymentReference(_run: PayrollRun, ctx: TransitionContext): string | null {
  if (!ctx.paymentReference || ctx.paymentReference.trim() === '') {
    return 'Payment reference number is required to mark payroll as paid'
  }
  return null
}

// Guard: a cancellation reason must be provided for audit purposes
function requireCancellationReason(_run: PayrollRun, ctx: TransitionContext): string | null {
  if (!ctx.cancellationReason || ctx.cancellationReason.trim() === '') {
    return 'A cancellation reason is required for audit purposes'
  }
  return null
}

// ---------------------------------------------------------------------------
// Transition map
// ---------------------------------------------------------------------------

const TRANSITIONS: TransitionDef[] = [
  {
    from: ['draft'],
    to: 'approved',
    guards: [requireEntries, requireFinanceApprover],
  },
  {
    from: ['approved'],
    to: 'processing',
    guards: [requireProcessingTimestamp],
  },
  {
    from: ['processing'],
    to: 'paid',
    guards: [requirePaymentReference],
  },
  {
    from: ['draft', 'approved'],
    to: 'cancelled',
    guards: [requireCancellationReason],
  },
]

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Attempt to transition a payroll run to a new status.
 *
 * Returns `{ success: true, newStatus }` when the transition is valid and all
 * guard conditions are satisfied, or `{ success: false, error }` with a
 * human-readable explanation when it is not.
 */
export function transitionPayrollStatus(
  run: PayrollRun,
  targetStatus: PayrollStatus,
  ctx: TransitionContext = {},
): TransitionResult {
  // Prevent no-op transitions
  if (run.status === targetStatus) {
    return { success: false, error: `Payroll run is already in '${targetStatus}' status` }
  }

  // Find a matching transition definition
  const transition = TRANSITIONS.find(
    (t) => t.from.includes(run.status) && t.to === targetStatus,
  )

  if (!transition) {
    const available = getAvailableTransitions(run.status)
    const hint =
      available.length > 0
        ? `. Valid transitions from '${run.status}': ${available.join(', ')}`
        : `. There are no valid transitions from '${run.status}'`
    return {
      success: false,
      error: `Transition from '${run.status}' to '${targetStatus}' is not allowed${hint}`,
    }
  }

  // Run every guard — collect all violations so callers can fix them in one pass
  const errors: string[] = []
  for (const guard of transition.guards) {
    const err = guard(run, ctx)
    if (err !== null) {
      errors.push(err)
    }
  }

  if (errors.length > 0) {
    return { success: false, error: errors.join('; ') }
  }

  return { success: true, newStatus: targetStatus }
}

/**
 * Return the set of statuses that are reachable from the given status,
 * ignoring guard conditions (useful for rendering UI controls).
 */
export function getAvailableTransitions(status: PayrollStatus): PayrollStatus[] {
  return TRANSITIONS
    .filter((t) => t.from.includes(status))
    .map((t) => t.to)
}
