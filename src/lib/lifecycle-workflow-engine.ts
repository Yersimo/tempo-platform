export type LifecycleEventType = 'joiner' | 'mover' | 'leaver'
export type LifecycleOwner = 'hr' | 'manager' | 'it' | 'payroll' | 'learning' | 'security' | 'finance'
export type LifecycleBlockerSeverity = 'critical' | 'high' | 'medium'
export type LifecycleActionStatus = 'ready' | 'blocked'

export interface LifecycleEvidence {
  id: string
  label: string
  present: boolean
  owner: LifecycleOwner
}

export interface LifecycleBlocker {
  id: string
  label: string
  owner: LifecycleOwner
  severity: LifecycleBlockerSeverity
}

export interface LifecycleAction {
  id: string
  label: string
  owner: LifecycleOwner
  status: LifecycleActionStatus
  blockedBy: string[]
}

export interface LifecycleWave {
  id: string
  label: string
  sequence: number
  actions: LifecycleAction[]
}

export interface LifecycleOwnerSummary {
  owner: LifecycleOwner
  actions: number
  blockers: number
  readyActions: number
}

export interface LifecyclePlan {
  planId: string
  eventType: LifecycleEventType
  readinessScore: number
  waves: LifecycleWave[]
  blockers: LifecycleBlocker[]
  owners: LifecycleOwnerSummary[]
  evidence: LifecycleEvidence[]
  safeNextActions: LifecycleAction[]
}

export interface LifecycleWorker {
  id: string
  name?: string
  managerId?: string | null
  department?: string | null
  role?: string | null
  costCenter?: string | null
  location?: string | null
}

export interface JoinerPlanInput {
  eventId?: string
  worker: LifecycleWorker
  startDate?: string
  payrollProfile?: unknown
  learningAssignments?: unknown[]
  managerId?: string | null
  accessTemplateId?: string | null
  equipmentRequestId?: string | null
}

export interface MoverPlanInput {
  eventId?: string
  worker: LifecycleWorker
  effectiveDate?: string
  fromManagerId?: string | null
  toManagerId?: string | null
  fromAccessGroups?: string[]
  toAccessGroups?: string[]
  fromCostCenter?: string | null
  toCostCenter?: string | null
  learningAssignments?: unknown[]
}

export interface LeaverPlanInput {
  eventId?: string
  worker: LifecycleWorker
  terminationDate?: string
  managerAcknowledged?: boolean
  accessRevocationScheduled?: boolean
  finalPayrollReady?: boolean
  deviceReturnScheduled?: boolean
  openCriticalTasks?: number
}

export type LifecyclePlanInput =
  | ({ eventType: 'joiner' } & JoinerPlanInput)
  | ({ eventType: 'mover' } & MoverPlanInput)
  | ({ eventType: 'leaver' } & LeaverPlanInput)

interface PlanDraft {
  eventType: LifecycleEventType
  subjectId: string
  eventId?: string
  evidence: LifecycleEvidence[]
  blockers: LifecycleBlocker[]
  waves: LifecycleWave[]
}

function makePlanId(eventType: LifecycleEventType, subjectId: string, eventId?: string): string {
  return `lifecycle-${eventType}-${eventId || subjectId}`
}

function evidence(id: string, label: string, present: boolean, owner: LifecycleOwner): LifecycleEvidence {
  return { id, label, present, owner }
}

function blocker(
  id: string,
  label: string,
  owner: LifecycleOwner,
  severity: LifecycleBlockerSeverity
): LifecycleBlocker {
  return { id, label, owner, severity }
}

function action(
  id: string,
  label: string,
  owner: LifecycleOwner,
  blockedBy: string[] = []
): LifecycleAction {
  return {
    id,
    label,
    owner,
    blockedBy,
    status: blockedBy.length > 0 ? 'blocked' : 'ready',
  }
}

function compact<T>(items: Array<T | false | null | undefined>): T[] {
  return items.filter(Boolean) as T[]
}

function buildPlan(draft: PlanDraft): LifecyclePlan {
  const allActions = draft.waves.flatMap(wave => wave.actions)
  const readyActions = allActions.filter(item => item.status === 'ready')
  const evidencePenalty = draft.evidence.filter(item => !item.present).length * 10
  const blockerPenalty = draft.blockers.reduce((total, item) => {
    if (item.severity === 'critical') return total + 25
    if (item.severity === 'high') return total + 15
    return total + 8
  }, 0)
  const readinessScore = Math.max(0, Math.min(100, 100 - evidencePenalty - blockerPenalty))

  const ownerNames = new Set<LifecycleOwner>()
  for (const item of allActions) ownerNames.add(item.owner)
  for (const item of draft.blockers) ownerNames.add(item.owner)

  const owners = Array.from(ownerNames)
    .sort()
    .map(owner => {
      const ownerActions = allActions.filter(item => item.owner === owner)
      return {
        owner,
        actions: ownerActions.length,
        blockers: draft.blockers.filter(item => item.owner === owner).length,
        readyActions: ownerActions.filter(item => item.status === 'ready').length,
      }
    })

  return {
    planId: makePlanId(draft.eventType, draft.subjectId, draft.eventId),
    eventType: draft.eventType,
    readinessScore,
    waves: draft.waves,
    blockers: draft.blockers,
    owners,
    evidence: draft.evidence,
    safeNextActions: readyActions,
  }
}

export function buildJoinerPlan(input: JoinerPlanInput): LifecyclePlan {
  const hasPayroll = Boolean(input.payrollProfile)
  const hasLearning = Boolean(input.learningAssignments?.length)
  const hasManager = Boolean(input.managerId || input.worker.managerId)
  const hasAccessTemplate = Boolean(input.accessTemplateId)
  const hasEquipment = Boolean(input.equipmentRequestId)

  const blockers = compact<LifecycleBlocker>([
    !hasPayroll && blocker('missing-payroll-profile', 'Payroll profile is missing', 'payroll', 'high'),
    !hasLearning && blocker('missing-learning-assignments', 'Learning assignments are missing', 'learning', 'medium'),
    !hasManager && blocker('missing-manager', 'Manager assignment is missing', 'hr', 'high'),
    !hasAccessTemplate && blocker('missing-access-template', 'Access template is missing', 'it', 'medium'),
  ])

  return buildPlan({
    eventType: 'joiner',
    subjectId: input.worker.id,
    eventId: input.eventId,
    evidence: [
      evidence('worker-record', 'Worker record', Boolean(input.worker.id), 'hr'),
      evidence('start-date', 'Start date', Boolean(input.startDate), 'hr'),
      evidence('manager', 'Manager assignment', hasManager, 'hr'),
      evidence('payroll-profile', 'Payroll profile', hasPayroll, 'payroll'),
      evidence('learning-assignments', 'Learning assignments', hasLearning, 'learning'),
      evidence('access-template', 'Access template', hasAccessTemplate, 'it'),
      evidence('equipment-request', 'Equipment request', hasEquipment, 'it'),
    ],
    blockers,
    waves: [
      {
        id: 'joiner-prestart',
        label: 'Pre-start setup',
        sequence: 1,
        actions: [
          action('confirm-worker-record', 'Confirm worker record', 'hr'),
          action('prepare-payroll-profile', 'Prepare payroll profile', 'payroll', hasPayroll ? [] : ['missing-payroll-profile']),
          action('assign-manager', 'Assign manager', 'hr', hasManager ? [] : ['missing-manager']),
        ],
      },
      {
        id: 'joiner-day-one',
        label: 'Day one enablement',
        sequence: 2,
        actions: [
          action('provision-access', 'Provision access from template', 'it', hasAccessTemplate ? [] : ['missing-access-template']),
          action('issue-equipment', 'Issue equipment', 'it', hasEquipment ? [] : []),
          action('enroll-learning', 'Enroll required learning', 'learning', hasLearning ? [] : ['missing-learning-assignments']),
        ],
      },
    ],
  })
}

export function buildMoverPlan(input: MoverPlanInput): LifecyclePlan {
  const managerChanged = Boolean(input.toManagerId && input.toManagerId !== input.fromManagerId)
  const accessAdded = (input.toAccessGroups || []).filter(group => !(input.fromAccessGroups || []).includes(group))
  const accessRemoved = (input.fromAccessGroups || []).filter(group => !(input.toAccessGroups || []).includes(group))
  const hasAccessDelta = accessAdded.length > 0 || accessRemoved.length > 0
  const costCenterChanged = Boolean(input.toCostCenter && input.toCostCenter !== input.fromCostCenter)
  const hasLearning = Boolean(input.learningAssignments?.length)

  const blockers = compact<LifecycleBlocker>([
    !managerChanged && blocker('missing-manager-delta', 'Manager delta is missing', 'manager', 'high'),
    !hasAccessDelta && blocker('missing-access-delta', 'Access delta is missing', 'it', 'high'),
  ])

  return buildPlan({
    eventType: 'mover',
    subjectId: input.worker.id,
    eventId: input.eventId,
    evidence: [
      evidence('worker-record', 'Worker record', Boolean(input.worker.id), 'hr'),
      evidence('effective-date', 'Effective date', Boolean(input.effectiveDate), 'hr'),
      evidence('manager-delta', 'Manager delta', managerChanged, 'manager'),
      evidence('access-delta', 'Access delta', hasAccessDelta, 'it'),
      evidence('cost-center-delta', 'Cost center delta', costCenterChanged, 'finance'),
      evidence('learning-assignments', 'Learning assignments', hasLearning, 'learning'),
    ],
    blockers,
    waves: [
      {
        id: 'mover-approval',
        label: 'Change confirmation',
        sequence: 1,
        actions: [
          action('confirm-manager-change', 'Confirm manager change', 'manager', managerChanged ? [] : ['missing-manager-delta']),
          action('confirm-cost-center', 'Confirm cost center', 'finance'),
        ],
      },
      {
        id: 'mover-effective-date',
        label: 'Effective date updates',
        sequence: 2,
        actions: [
          action('add-new-access', `Add access groups: ${accessAdded.join(', ') || 'none'}`, 'it', hasAccessDelta ? [] : ['missing-access-delta']),
          action('remove-old-access', `Remove access groups: ${accessRemoved.join(', ') || 'none'}`, 'it', hasAccessDelta ? [] : ['missing-access-delta']),
          action('refresh-learning', 'Refresh role learning', 'learning'),
        ],
      },
    ],
  })
}

export function buildLeaverPlan(input: LeaverPlanInput): LifecyclePlan {
  const managerAcknowledged = input.managerAcknowledged === true
  const accessRevocationScheduled = input.accessRevocationScheduled === true
  const finalPayrollReady = input.finalPayrollReady === true
  const deviceReturnScheduled = input.deviceReturnScheduled === true
  const openCriticalTasks = input.openCriticalTasks || 0

  const blockers = compact<LifecycleBlocker>([
    !managerAcknowledged && blocker('missing-manager-acknowledgement', 'Manager has not acknowledged the departure', 'manager', 'critical'),
    !accessRevocationScheduled && blocker('missing-access-revocation', 'Access revocation is not scheduled', 'security', 'critical'),
    !finalPayrollReady && blocker('missing-final-payroll', 'Final payroll is not ready', 'payroll', 'critical'),
    openCriticalTasks > 0 && blocker('open-critical-tasks', 'Critical closure tasks remain open', 'hr', 'critical'),
  ])

  return buildPlan({
    eventType: 'leaver',
    subjectId: input.worker.id,
    eventId: input.eventId,
    evidence: [
      evidence('worker-record', 'Worker record', Boolean(input.worker.id), 'hr'),
      evidence('termination-date', 'Termination date', Boolean(input.terminationDate), 'hr'),
      evidence('manager-acknowledgement', 'Manager acknowledgement', managerAcknowledged, 'manager'),
      evidence('access-revocation', 'Access revocation scheduled', accessRevocationScheduled, 'security'),
      evidence('final-payroll', 'Final payroll ready', finalPayrollReady, 'payroll'),
      evidence('device-return', 'Device return scheduled', deviceReturnScheduled, 'it'),
      evidence('critical-task-closure', 'Critical tasks closed', openCriticalTasks === 0, 'hr'),
    ],
    blockers,
    waves: [
      {
        id: 'leaver-before-last-day',
        label: 'Before last day',
        sequence: 1,
        actions: [
          action('collect-manager-signoff', 'Collect manager signoff', 'manager', managerAcknowledged ? [] : ['missing-manager-acknowledgement']),
          action('prepare-final-payroll', 'Prepare final payroll', 'payroll', finalPayrollReady ? [] : ['missing-final-payroll']),
          action('schedule-device-return', 'Schedule device return', 'it'),
        ],
      },
      {
        id: 'leaver-last-day',
        label: 'Last day controls',
        sequence: 2,
        actions: [
          action('revoke-access', 'Revoke access', 'security', accessRevocationScheduled ? [] : ['missing-access-revocation']),
          action('close-critical-tasks', 'Close critical tasks', 'hr', openCriticalTasks === 0 ? [] : ['open-critical-tasks']),
        ],
      },
    ],
  })
}

export function buildLifecyclePlan(input: LifecyclePlanInput): LifecyclePlan {
  switch (input.eventType) {
    case 'joiner':
      return buildJoinerPlan(input)
    case 'mover':
      return buildMoverPlan(input)
    case 'leaver':
      return buildLeaverPlan(input)
    default: {
      const exhaustive: never = input
      return exhaustive
    }
  }
}
