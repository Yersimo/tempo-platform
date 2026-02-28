/**
 * Approval Chain Engine
 *
 * Reusable multi-step approval workflow for expenses, leave requests,
 * payroll runs, and any entity that requires one or more sign-offs
 * before proceeding.
 *
 * Each approval chain defines who can approve (by role and/or explicit
 * employee ID), how many approvals are required, and an optional
 * amount range so the correct chain is selected automatically.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, inArray } from 'drizzle-orm'

// ============================================================
// Types & Interfaces
// ============================================================

export type ApprovalStepStatus = 'pending' | 'approved' | 'rejected' | 'skipped'

export interface ApprovalChain {
  id: string
  orgId: string
  entityType: string
  name: string
  minAmount: number | null
  maxAmount: number | null
  approverRoles: string[] | null
  approverIds: string[] | null
  requiredApprovals: number
  isActive: boolean
  createdAt: Date
}

export interface ApprovalStep {
  id: string
  orgId: string
  chainId: string
  entityType: string
  entityId: string
  stepOrder: number
  approverId: string
  status: ApprovalStepStatus
  comments: string | null
  decidedAt: Date | null
  createdAt: Date
}

export interface ApprovalStatus {
  entityType: string
  entityId: string
  chainId: string
  chainName: string
  requiredApprovals: number
  currentApprovals: number
  currentRejections: number
  isFullyApproved: boolean
  isRejected: boolean
  isPending: boolean
  steps: ApprovalStep[]
}

export interface ApprovalDecisionResult {
  step: ApprovalStep
  entityFullyApproved: boolean
  entityRejected: boolean
  remainingApprovals: number
}

export interface PendingApproval {
  step: ApprovalStep
  chainName: string
  entityType: string
  entityId: string
  stepOrder: number
  createdAt: Date
}

export interface CreateApprovalChainInput {
  entityType: string
  name: string
  minAmount?: number | null
  maxAmount?: number | null
  approverRoles?: string[] | null
  approverIds?: string[] | null
  requiredApprovals: number
}

// ============================================================
// Error Classes
// ============================================================

export class ApprovalEngineError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ApprovalEngineError'
  }
}

// ============================================================
// 1. Find Approval Chain
// ============================================================

/**
 * Find the matching approval chain for an entity type and optional amount.
 *
 * Selection logic:
 *  - Must match orgId and entityType exactly.
 *  - Must be active.
 *  - If `amount` is provided, filter chains whose [minAmount, maxAmount]
 *    range includes that value. Null bounds are treated as unbounded.
 *  - When multiple chains match, the most specific (smallest range) wins.
 *    Ties are broken by the most recently created chain.
 */
export async function findApprovalChain(
  orgId: string,
  entityType: string,
  amount?: number,
): Promise<ApprovalChain | null> {
  // Fetch all active chains for this org + entity type
  const chains = await db
    .select()
    .from(schema.approvalChains)
    .where(
      and(
        eq(schema.approvalChains.orgId, orgId),
        eq(schema.approvalChains.entityType, entityType),
        eq(schema.approvalChains.isActive, true),
      ),
    )
    .orderBy(desc(schema.approvalChains.createdAt))

  if (chains.length === 0) return null

  // If no amount provided, return the first chain that has no amount bounds,
  // or fall back to the first chain overall.
  if (amount === undefined || amount === null) {
    const unbounded = chains.find(
      (c) => c.minAmount === null && c.maxAmount === null,
    )
    return (unbounded ?? chains[0]) as ApprovalChain
  }

  // Filter chains whose amount range includes the given amount
  const matching = chains.filter((c) => {
    const aboveMin = c.minAmount === null || amount >= c.minAmount
    const belowMax = c.maxAmount === null || amount <= c.maxAmount
    return aboveMin && belowMax
  })

  if (matching.length === 0) return null

  // Prefer the most specific chain (smallest range span)
  matching.sort((a, b) => {
    const rangeA =
      a.minAmount !== null && a.maxAmount !== null
        ? a.maxAmount - a.minAmount
        : Infinity
    const rangeB =
      b.minAmount !== null && b.maxAmount !== null
        ? b.maxAmount - b.minAmount
        : Infinity
    return rangeA - rangeB
  })

  return matching[0] as ApprovalChain
}

// ============================================================
// 2. Initiate Approval
// ============================================================

/**
 * Create approval steps for an entity based on the matching chain.
 *
 * Resolves approvers from:
 *  1. Explicit `approverIds` on the chain.
 *  2. Employees whose `role` matches one of the `approverRoles`.
 *
 * Each distinct approver gets a step, ordered first by explicit IDs
 * then by role-resolved employees. The total number of steps is capped
 * at `requiredApprovals` (or the total available approvers if fewer).
 */
export async function initiateApproval(
  orgId: string,
  entityType: string,
  entityId: string,
  amount?: number,
): Promise<ApprovalStep[]> {
  const chain = await findApprovalChain(orgId, entityType, amount)

  if (!chain) {
    throw new ApprovalEngineError(
      `No active approval chain found for entity type "${entityType}"${amount !== undefined ? ` with amount ${amount}` : ''}`,
      'CHAIN_NOT_FOUND',
    )
  }

  // Collect unique approver IDs
  const approverIdSet = new Set<string>()

  // 1. Explicit approver IDs
  const explicitIds = (chain.approverIds as string[] | null) ?? []
  for (const id of explicitIds) {
    approverIdSet.add(id)
  }

  // 2. Role-based approvers
  const roles = (chain.approverRoles as string[] | null) ?? []
  if (roles.length > 0) {
    const roleEmployees = await db
      .select({ id: schema.employees.id })
      .from(schema.employees)
      .where(
        and(
          eq(schema.employees.orgId, orgId),
          eq(schema.employees.isActive, true),
          inArray(schema.employees.role, roles as unknown as ['owner' | 'admin' | 'hrbp' | 'manager' | 'employee', ...('owner' | 'admin' | 'hrbp' | 'manager' | 'employee')[]]),
        ),
      )

    for (const emp of roleEmployees) {
      approverIdSet.add(emp.id)
    }
  }

  const approverIds = Array.from(approverIdSet)

  if (approverIds.length === 0) {
    throw new ApprovalEngineError(
      `Approval chain "${chain.name}" has no resolvable approvers`,
      'NO_APPROVERS',
    )
  }

  // Cap the number of steps at requiredApprovals
  const stepsToCreate = approverIds.slice(0, chain.requiredApprovals)

  // Build step records
  const stepValues = stepsToCreate.map((approverId, index) => ({
    orgId,
    chainId: chain.id,
    entityType,
    entityId,
    stepOrder: index + 1,
    approverId,
    status: 'pending' as const,
  }))

  const createdSteps = await db
    .insert(schema.approvalSteps)
    .values(stepValues)
    .returning()

  return createdSteps as ApprovalStep[]
}

// ============================================================
// 3. Process Approval Decision
// ============================================================

/**
 * Record an approver's decision on a specific step and determine the
 * overall approval state for the entity.
 *
 * Rules:
 *  - Only the assigned approver can decide on their step.
 *  - A step can only be decided if it is currently `pending`.
 *  - A single rejection immediately marks the entity as rejected and
 *    sets all remaining pending steps to `skipped`.
 *  - The entity is fully approved once `requiredApprovals` steps are
 *    in the `approved` state.
 */
export async function processApprovalDecision(
  orgId: string,
  stepId: string,
  approverId: string,
  decision: 'approved' | 'rejected',
  comments?: string,
): Promise<ApprovalDecisionResult> {
  // Fetch the step
  const [step] = await db
    .select()
    .from(schema.approvalSteps)
    .where(
      and(
        eq(schema.approvalSteps.id, stepId),
        eq(schema.approvalSteps.orgId, orgId),
      ),
    )
    .limit(1)

  if (!step) {
    throw new ApprovalEngineError(
      `Approval step "${stepId}" not found`,
      'STEP_NOT_FOUND',
    )
  }

  if (step.approverId !== approverId) {
    throw new ApprovalEngineError(
      'You are not the assigned approver for this step',
      'UNAUTHORIZED_APPROVER',
    )
  }

  if (step.status !== 'pending') {
    throw new ApprovalEngineError(
      `Step has already been decided (current status: ${step.status})`,
      'STEP_ALREADY_DECIDED',
    )
  }

  // Update the step with the decision
  const now = new Date()
  const [updatedStep] = await db
    .update(schema.approvalSteps)
    .set({
      status: decision,
      comments: comments ?? null,
      decidedAt: now,
    })
    .where(eq(schema.approvalSteps.id, stepId))
    .returning()

  // Fetch the parent chain for requiredApprovals
  const [chain] = await db
    .select()
    .from(schema.approvalChains)
    .where(eq(schema.approvalChains.id, step.chainId))
    .limit(1)

  // Fetch all steps for the same entity
  const allSteps = await db
    .select()
    .from(schema.approvalSteps)
    .where(
      and(
        eq(schema.approvalSteps.orgId, orgId),
        eq(schema.approvalSteps.chainId, step.chainId),
        eq(schema.approvalSteps.entityType, step.entityType),
        eq(schema.approvalSteps.entityId, step.entityId),
      ),
    )
    .orderBy(schema.approvalSteps.stepOrder)

  const approvedCount = allSteps.filter((s) => s.status === 'approved').length
  const rejectedCount = allSteps.filter((s) => s.status === 'rejected').length
  const required = chain?.requiredApprovals ?? 1

  const entityRejected = rejectedCount > 0
  const entityFullyApproved = !entityRejected && approvedCount >= required

  // If rejected, skip all remaining pending steps
  if (entityRejected) {
    const pendingStepIds = allSteps
      .filter((s) => s.status === 'pending')
      .map((s) => s.id)

    if (pendingStepIds.length > 0) {
      await db
        .update(schema.approvalSteps)
        .set({ status: 'skipped', decidedAt: now })
        .where(
          and(
            eq(schema.approvalSteps.orgId, orgId),
            inArray(schema.approvalSteps.id, pendingStepIds as [string, ...string[]]),
          ),
        )
    }
  }

  return {
    step: updatedStep as ApprovalStep,
    entityFullyApproved,
    entityRejected,
    remainingApprovals: Math.max(0, required - approvedCount),
  }
}

// ============================================================
// 4. Get Approval Status
// ============================================================

/**
 * Return the full approval status for a specific entity, including
 * every step and aggregate counts.
 */
export async function getApprovalStatus(
  orgId: string,
  entityType: string,
  entityId: string,
): Promise<ApprovalStatus | null> {
  // Fetch all steps for this entity
  const steps = await db
    .select()
    .from(schema.approvalSteps)
    .where(
      and(
        eq(schema.approvalSteps.orgId, orgId),
        eq(schema.approvalSteps.entityType, entityType),
        eq(schema.approvalSteps.entityId, entityId),
      ),
    )
    .orderBy(schema.approvalSteps.stepOrder)

  if (steps.length === 0) return null

  // All steps should reference the same chain
  const chainId = steps[0].chainId

  const [chain] = await db
    .select()
    .from(schema.approvalChains)
    .where(eq(schema.approvalChains.id, chainId))
    .limit(1)

  if (!chain) return null

  const approvedCount = steps.filter((s) => s.status === 'approved').length
  const rejectedCount = steps.filter((s) => s.status === 'rejected').length
  const pendingCount = steps.filter((s) => s.status === 'pending').length

  const isRejected = rejectedCount > 0
  const isFullyApproved = !isRejected && approvedCount >= chain.requiredApprovals

  return {
    entityType,
    entityId,
    chainId: chain.id,
    chainName: chain.name,
    requiredApprovals: chain.requiredApprovals,
    currentApprovals: approvedCount,
    currentRejections: rejectedCount,
    isFullyApproved,
    isRejected,
    isPending: !isFullyApproved && !isRejected && pendingCount > 0,
    steps: steps as ApprovalStep[],
  }
}

// ============================================================
// 5. Get Pending Approvals
// ============================================================

/**
 * Retrieve every pending approval step assigned to a specific approver,
 * enriched with the parent chain name for display purposes.
 */
export async function getPendingApprovals(
  orgId: string,
  approverId: string,
): Promise<PendingApproval[]> {
  const rows = await db
    .select({
      step: schema.approvalSteps,
      chainName: schema.approvalChains.name,
    })
    .from(schema.approvalSteps)
    .innerJoin(
      schema.approvalChains,
      eq(schema.approvalSteps.chainId, schema.approvalChains.id),
    )
    .where(
      and(
        eq(schema.approvalSteps.orgId, orgId),
        eq(schema.approvalSteps.approverId, approverId),
        eq(schema.approvalSteps.status, 'pending'),
      ),
    )
    .orderBy(schema.approvalSteps.createdAt)

  return rows.map((row) => ({
    step: row.step as ApprovalStep,
    chainName: row.chainName,
    entityType: row.step.entityType,
    entityId: row.step.entityId,
    stepOrder: row.step.stepOrder,
    createdAt: row.step.createdAt,
  }))
}

// ============================================================
// 6. Create Approval Chain
// ============================================================

/**
 * Create a new approval chain for an organization. Validates that at
 * least one approver source (roles or IDs) is provided and that the
 * amount range is logically consistent.
 */
export async function createApprovalChain(
  orgId: string,
  input: CreateApprovalChainInput,
): Promise<ApprovalChain> {
  // Validate: must have at least one approver source
  const hasRoles = input.approverRoles && input.approverRoles.length > 0
  const hasIds = input.approverIds && input.approverIds.length > 0

  if (!hasRoles && !hasIds) {
    throw new ApprovalEngineError(
      'At least one of approverRoles or approverIds must be provided',
      'INVALID_CHAIN_CONFIG',
    )
  }

  // Validate: amount range consistency
  if (
    input.minAmount !== undefined &&
    input.minAmount !== null &&
    input.maxAmount !== undefined &&
    input.maxAmount !== null &&
    input.minAmount > input.maxAmount
  ) {
    throw new ApprovalEngineError(
      'minAmount cannot be greater than maxAmount',
      'INVALID_AMOUNT_RANGE',
    )
  }

  // Validate: requiredApprovals must be positive
  if (!input.requiredApprovals || input.requiredApprovals < 1) {
    throw new ApprovalEngineError(
      'requiredApprovals must be at least 1',
      'INVALID_REQUIRED_APPROVALS',
    )
  }

  const [chain] = await db
    .insert(schema.approvalChains)
    .values({
      orgId,
      entityType: input.entityType,
      name: input.name,
      minAmount: input.minAmount ?? null,
      maxAmount: input.maxAmount ?? null,
      approverRoles: input.approverRoles ?? null,
      approverIds: input.approverIds ?? null,
      requiredApprovals: input.requiredApprovals,
      isActive: true,
    })
    .returning()

  return chain as ApprovalChain
}
