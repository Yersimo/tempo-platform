/**
 * Strategy -> Projects Integration
 *
 * When a strategic initiative is created/updated:
 * 1. Auto-generate project tasks from strategy milestones
 * 2. Link project KPIs to strategy OKRs
 *
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Strategy milestone */
export interface StrategyMilestone {
  id: string
  title: string
  targetDate: string
  status: string
}

/** Strategy OKR */
export interface StrategyOKR {
  id: string
  objective: string
  keyResults: Array<{
    id: string
    title: string
    target: number
    current: number
  }>
}

/** Project task to be created from a strategy milestone */
export interface StrategyProjectTask {
  title: string
  description: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'not_started' | 'in_progress' | 'completed'
  due_date: string
  category: 'strategy'
  initiative_id: string
  milestone_id: string
  linked_okr_ids: string[]
  metadata: Record<string, unknown>
}

/** KPI linkage connecting a project metric to a strategy OKR key result */
export interface KPILinkage {
  initiativeId: string
  okrId: string
  keyResultId: string
  keyResultTitle: string
  target: number
  current: number
  description: string
}

/** Result of processing a strategy initiative update */
export interface StrategyProjectResult {
  initiativeId: string
  initiativeTitle: string
  tasksGenerated: StrategyProjectTask[]
  kpiLinkages: KPILinkage[]
  summary: {
    totalTasks: number
    totalKPIs: number
  }
}

/** Store slice needed for strategy->projects operations */
export interface StrategyProjectsStoreSlice {
  addTask?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate project tasks from strategy initiative milestones.
 *
 * Each milestone becomes a project task with:
 * - Due date matching the milestone target date
 * - Priority derived from how close the deadline is
 * - Linkage back to the initiative and any related OKRs
 *
 * @param initiativeId    - The strategic initiative ID
 * @param initiativeTitle - Title of the initiative
 * @param milestones      - Milestones from the initiative
 * @param okrs            - OKRs from the initiative (for KPI linking)
 * @param options         - Optional overrides
 * @returns Strategy-to-project mapping result
 */
export function generateProjectTasksFromStrategy(
  initiativeId: string,
  initiativeTitle: string,
  milestones: StrategyMilestone[],
  okrs: StrategyOKR[],
  options: { departmentId?: string; ownerId?: string } = {},
): StrategyProjectResult {
  const tasks: StrategyProjectTask[] = []
  const kpiLinkages: KPILinkage[] = []
  const now = new Date()

  // Generate tasks from milestones
  for (const milestone of milestones) {
    if (milestone.status === 'completed') continue

    const targetDate = new Date(milestone.targetDate)
    const daysUntilDue = Math.ceil((targetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // Derive priority from urgency
    let priority: 'critical' | 'high' | 'medium' | 'low'
    if (daysUntilDue <= 7) priority = 'critical'
    else if (daysUntilDue <= 30) priority = 'high'
    else if (daysUntilDue <= 90) priority = 'medium'
    else priority = 'low'

    // Find OKRs related to this milestone (simple: link all initiative OKRs)
    const linkedOkrIds = okrs.map(o => o.id)

    const task: StrategyProjectTask = {
      title: `[Strategy] ${milestone.title}`,
      description: `Auto-generated from strategic initiative "${initiativeTitle}". Milestone: ${milestone.title}. Target: ${milestone.targetDate}.`,
      priority,
      status: milestone.status === 'in_progress' ? 'in_progress' : 'not_started',
      due_date: milestone.targetDate,
      category: 'strategy',
      initiative_id: initiativeId,
      milestone_id: milestone.id,
      linked_okr_ids: linkedOkrIds,
      metadata: {
        auto_created: true,
        source_integration: 'strategy-projects',
        department_id: options.departmentId,
        owner_id: options.ownerId,
        created_at: now.toISOString(),
      },
    }

    tasks.push(task)
  }

  // Generate KPI linkages from OKRs
  for (const okr of okrs) {
    for (const kr of okr.keyResults) {
      kpiLinkages.push({
        initiativeId,
        okrId: okr.id,
        keyResultId: kr.id,
        keyResultTitle: kr.title,
        target: kr.target,
        current: kr.current,
        description: `Strategy OKR: "${okr.objective}" -> KR: "${kr.title}" (${kr.current}/${kr.target})`,
      })
    }
  }

  return {
    initiativeId,
    initiativeTitle,
    tasksGenerated: tasks,
    kpiLinkages,
    summary: {
      totalTasks: tasks.length,
      totalKPIs: kpiLinkages.length,
    },
  }
}

/**
 * Apply strategy project tasks to the store.
 *
 * @param result - Output from generateProjectTasksFromStrategy
 * @param store  - Store actions for persisting
 * @returns Number of tasks created
 */
export function applyStrategyProjectTasks(
  result: StrategyProjectResult,
  store: StrategyProjectsStoreSlice,
): number {
  let created = 0

  for (const task of result.tasksGenerated) {
    if (store.addTask) {
      store.addTask(task as unknown as Record<string, unknown>)
      created++
    }
  }

  return created
}
