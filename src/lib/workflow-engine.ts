// Tempo Workflow Execution Engine
// Executes workflow steps sequentially, manages run lifecycle, handles branching and approvals.

// ============================================================
// Types
// ============================================================

export type StepType = 'action' | 'condition' | 'delay' | 'notification' | 'approval'
export type RunStatus = 'running' | 'completed' | 'failed' | 'cancelled'
export type TriggerType = 'schedule' | 'event' | 'manual' | 'webhook'

export interface WorkflowStep {
  id: string
  workflow_id: string
  step_type: StepType
  title: string
  config: Record<string, unknown> | null
  position: number
  next_step_id: string | null
  created_at: string
}

export interface Workflow {
  id: string
  org_id: string
  title: string
  description: string | null
  status: string
  trigger_type: TriggerType
  trigger_config: Record<string, unknown> | null
  created_by: string | null
  created_at: string
  updated_at: string | null
}

export interface WorkflowRun {
  id: string
  org_id: string
  workflow_id: string
  status: RunStatus
  started_at: string
  completed_at: string | null
  triggered_by: string | null
  context: WorkflowContext | null
}

export interface WorkflowContext {
  trigger_data: Record<string, unknown>
  variables: Record<string, unknown>
  step_results: Record<string, StepResult>
  current_step_index: number
  started_at: string
  run_id: string
  waiting_step_id?: string
  error?: string
}

export interface StepResult {
  step_id: string
  step_title: string
  step_type: StepType
  status: 'completed' | 'failed' | 'waiting' | 'skipped'
  started_at: string
  completed_at: string | null
  output: Record<string, unknown>
  error?: string
}

export interface ApprovalRecord {
  run_id: string
  step_id: string
  approver_id: string | null
  status: 'pending' | 'approved' | 'rejected'
  comment: string | null
  requested_at: string
  resolved_at: string | null
}

export interface ExecuteWorkflowResult {
  run_id: string
  status: RunStatus
  context: WorkflowContext
  steps_executed: number
  error?: string
}

// ============================================================
// Condition Evaluator
// ============================================================

type ConditionOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in'

function resolveValue(field: string, context: WorkflowContext): unknown {
  // Support dot-notation: "trigger_data.employee_name" or "variables.amount"
  const parts = field.split('.')
  let current: unknown = context

  // First check trigger_data, then variables, then step_results
  if (parts[0] === 'trigger_data' || parts[0] === 'variables' || parts[0] === 'step_results') {
    current = context
  } else {
    // Shorthand: look in trigger_data first, then variables
    const fromTrigger = context.trigger_data[field]
    if (fromTrigger !== undefined) return fromTrigger
    const fromVars = context.variables[field]
    if (fromVars !== undefined) return fromVars
    return undefined
  }

  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[part]
    } else {
      return undefined
    }
  }
  return current
}

export function evaluateCondition(
  condition: { field: string; operator: ConditionOperator; value: unknown },
  context: WorkflowContext
): boolean {
  const resolved = resolveValue(condition.field, context)
  const target = condition.value

  switch (condition.operator) {
    case 'eq':
      return resolved == target
    case 'neq':
      return resolved != target
    case 'gt':
      return Number(resolved) > Number(target)
    case 'lt':
      return Number(resolved) < Number(target)
    case 'gte':
      return Number(resolved) >= Number(target)
    case 'lte':
      return Number(resolved) <= Number(target)
    case 'contains':
      if (typeof resolved === 'string') return resolved.includes(String(target))
      if (Array.isArray(resolved)) return resolved.includes(target)
      return false
    case 'in':
      if (Array.isArray(target)) return target.includes(resolved)
      if (typeof target === 'string') return target.split(',').map(s => s.trim()).includes(String(resolved))
      return false
    default:
      return false
  }
}

// ============================================================
// Step Executors
// ============================================================

async function executeApprovalStep(
  step: WorkflowStep,
  context: WorkflowContext
): Promise<StepResult> {
  const config = (step.config || {}) as Record<string, unknown>
  const approverId = config.approver_id as string | undefined
  const timeoutHours = config.timeout_hours as number | undefined

  // Create a pending approval - workflow pauses here
  const approval: ApprovalRecord = {
    run_id: context.run_id,
    step_id: step.id,
    approver_id: approverId || null,
    status: 'pending',
    comment: null,
    requested_at: new Date().toISOString(),
    resolved_at: null,
  }

  return {
    step_id: step.id,
    step_title: step.title,
    step_type: 'approval',
    status: 'waiting',
    started_at: new Date().toISOString(),
    completed_at: null,
    output: {
      approval,
      timeout_hours: timeoutHours || 48,
      message: `Approval requested from ${approverId || 'designated approver'}`,
    },
  }
}

async function executeNotificationStep(
  step: WorkflowStep,
  context: WorkflowContext,
  baseUrl?: string
): Promise<StepResult> {
  const config = (step.config || {}) as Record<string, unknown>
  const startedAt = new Date().toISOString()

  try {
    // In a real environment, POST to the notification API
    if (baseUrl) {
      try {
        await fetch(`${baseUrl}/api/notifications`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipient_id: config.recipient_id || config.to,
            recipient_role: config.recipient_role,
            title: config.title || `Workflow notification: ${step.title}`,
            message: config.message || config.template,
            channel: config.channel || 'in_app',
            workflow_run_id: context.run_id,
          }),
        })
      } catch {
        // Notification delivery is best-effort
      }
    }

    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'notification',
      status: 'completed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {
        template: config.template,
        recipient: config.to || config.recipient_id || config.recipient_role,
        message: `Notification "${step.title}" sent`,
      },
    }
  } catch (err) {
    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'notification',
      status: 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {},
      error: err instanceof Error ? err.message : 'Notification failed',
    }
  }
}

function executeConditionStep(
  step: WorkflowStep,
  context: WorkflowContext
): StepResult {
  const config = (step.config || {}) as Record<string, unknown>
  const startedAt = new Date().toISOString()

  const field = config.field as string
  const operator = (config.operator as string) || 'eq'
  const value = config.value

  // Normalize operator names from demo data
  const normalizedOperator = normalizeOperator(operator)

  const result = evaluateCondition(
    { field, operator: normalizedOperator, value },
    context
  )

  // Store condition result in variables for downstream steps
  context.variables[`condition_${step.id}`] = result

  return {
    step_id: step.id,
    step_title: step.title,
    step_type: 'condition',
    status: 'completed',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    output: {
      field,
      operator: normalizedOperator,
      value,
      resolved_value: resolveValue(field, context),
      result,
      true_step_id: config.true_step_id || null,
      false_step_id: config.false_step_id || null,
    },
  }
}

function normalizeOperator(op: string): ConditionOperator {
  const map: Record<string, ConditionOperator> = {
    equals: 'eq',
    eq: 'eq',
    not_equals: 'neq',
    neq: 'neq',
    greater_than: 'gt',
    gt: 'gt',
    less_than: 'lt',
    lt: 'lt',
    greater_than_or_equal: 'gte',
    gte: 'gte',
    less_than_or_equal: 'lte',
    lte: 'lte',
    contains: 'contains',
    in: 'in',
  }
  return map[op] || 'eq'
}

async function executeActionStep(
  step: WorkflowStep,
  context: WorkflowContext,
  baseUrl?: string
): Promise<StepResult> {
  const config = (step.config || {}) as Record<string, unknown>
  const startedAt = new Date().toISOString()

  try {
    // If there is an entity + operation, POST to the data API
    if (baseUrl && config.entity && config.operation) {
      try {
        await fetch(`${baseUrl}/api/data`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            entity: config.entity,
            action: config.operation,
            data: config.data || {},
          }),
        })
      } catch {
        // Best-effort data mutation
      }
    }

    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'action',
      status: 'completed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {
        action: config.action || config.operation || 'executed',
        entity: config.entity || null,
        message: `Action "${step.title}" completed`,
        config,
      },
    }
  } catch (err) {
    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'action',
      status: 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {},
      error: err instanceof Error ? err.message : 'Action failed',
    }
  }
}

function executeDelayStep(
  step: WorkflowStep,
  context: WorkflowContext
): StepResult {
  const config = (step.config || {}) as Record<string, unknown>
  const startedAt = new Date().toISOString()

  const duration = config.duration_hours || config.duration || 0
  const unit = config.unit || 'hours'

  // In demo mode, delays are instant (no real waiting)
  return {
    step_id: step.id,
    step_title: step.title,
    step_type: 'delay',
    status: 'completed',
    started_at: startedAt,
    completed_at: new Date().toISOString(),
    output: {
      duration,
      unit,
      message: `Delay of ${duration} ${unit} (completed instantly in demo mode)`,
    },
  }
}

async function executeWebhookStep(
  step: WorkflowStep,
  context: WorkflowContext
): Promise<StepResult> {
  const config = (step.config || {}) as Record<string, unknown>
  const startedAt = new Date().toISOString()

  const url = config.url as string | undefined
  const method = (config.method as string) || 'POST'
  const headers = (config.headers as Record<string, string>) || { 'Content-Type': 'application/json' }

  if (!url) {
    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'action', // webhook uses action type in schema
      status: 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {},
      error: 'Webhook URL not configured',
    }
  }

  try {
    // Build body from template if provided
    let body: string | undefined
    if (config.body_template) {
      // Simple template interpolation: replace {{key}} with context values
      body = String(config.body_template).replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_match, key) => {
        const val = resolveValue(key, context)
        return val !== undefined ? String(val) : ''
      })
    } else {
      body = JSON.stringify({
        run_id: context.run_id,
        trigger_data: context.trigger_data,
        variables: context.variables,
      })
    }

    const response = await fetch(url, {
      method: method.toUpperCase(),
      headers,
      body: method.toUpperCase() !== 'GET' ? body : undefined,
    })

    const responseText = await response.text()
    let responseData: unknown
    try { responseData = JSON.parse(responseText) } catch { responseData = responseText }

    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'action',
      status: response.ok ? 'completed' : 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: {
        status_code: response.status,
        response: responseData,
        url,
      },
      error: response.ok ? undefined : `Webhook returned ${response.status}`,
    }
  } catch (err) {
    return {
      step_id: step.id,
      step_title: step.title,
      step_type: 'action',
      status: 'failed',
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      output: { url },
      error: err instanceof Error ? err.message : 'Webhook call failed',
    }
  }
}

// ============================================================
// Step Router
// ============================================================

export async function executeStep(
  step: WorkflowStep,
  context: WorkflowContext,
  baseUrl?: string
): Promise<StepResult> {
  const config = (step.config || {}) as Record<string, unknown>

  // Check if this is a webhook step (action with url in config)
  if (step.step_type === 'action' && config.url) {
    return executeWebhookStep(step, context)
  }

  switch (step.step_type) {
    case 'approval':
      return executeApprovalStep(step, context)
    case 'notification':
      return executeNotificationStep(step, context, baseUrl)
    case 'condition':
      return executeConditionStep(step, context)
    case 'action':
      return executeActionStep(step, context, baseUrl)
    case 'delay':
      return executeDelayStep(step, context)
    default:
      return {
        step_id: step.id,
        step_title: step.title,
        step_type: step.step_type,
        status: 'failed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        output: {},
        error: `Unknown step type: ${step.step_type}`,
      }
  }
}

// ============================================================
// Main Execution Engine
// ============================================================

function generateRunId(): string {
  return `wfr-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

export async function executeWorkflow(
  workflow: Workflow,
  steps: WorkflowStep[],
  triggerData: Record<string, unknown> = {},
  triggeredBy: string = 'manual',
  baseUrl?: string
): Promise<ExecuteWorkflowResult> {
  const runId = generateRunId()
  const now = new Date().toISOString()

  // Initialize execution context
  const context: WorkflowContext = {
    trigger_data: triggerData,
    variables: {},
    step_results: {},
    current_step_index: 0,
    started_at: now,
    run_id: runId,
  }

  // Sort steps by position
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position)

  if (sortedSteps.length === 0) {
    return {
      run_id: runId,
      status: 'completed',
      context,
      steps_executed: 0,
    }
  }

  let stepsExecuted = 0

  try {
    for (let i = 0; i < sortedSteps.length; i++) {
      const step = sortedSteps[i]
      context.current_step_index = i

      // Execute the step
      const result = await executeStep(step, context, baseUrl)
      context.step_results[step.id] = result
      stepsExecuted++

      // If step is waiting (approval), pause the run
      if (result.status === 'waiting') {
        context.waiting_step_id = step.id
        return {
          run_id: runId,
          status: 'running', // still running, waiting for approval
          context,
          steps_executed: stepsExecuted,
        }
      }

      // If step failed, mark run as failed
      if (result.status === 'failed') {
        context.error = result.error
        return {
          run_id: runId,
          status: 'failed',
          context,
          steps_executed: stepsExecuted,
          error: result.error,
        }
      }

      // Handle condition branching
      if (step.step_type === 'condition' && result.output) {
        const condResult = result.output.result as boolean
        const trueStepId = result.output.true_step_id as string | null
        const falseStepId = result.output.false_step_id as string | null
        const targetStepId = condResult ? trueStepId : falseStepId

        if (targetStepId) {
          // Find the target step index and jump to it
          const targetIdx = sortedSteps.findIndex(s => s.id === targetStepId)
          if (targetIdx >= 0) {
            // Skip steps between current and target by adjusting loop counter
            // We set i so the next iteration processes targetIdx
            i = targetIdx - 1 // -1 because the loop will increment
            continue
          }
        }
        // If no branch target, continue sequentially
      }

      // Store step output in variables for downstream use
      if (result.output) {
        context.variables[`step_${step.id}_output`] = result.output
      }
    }

    // All steps completed
    return {
      run_id: runId,
      status: 'completed',
      context,
      steps_executed: stepsExecuted,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unexpected execution error'
    context.error = errorMsg
    return {
      run_id: runId,
      status: 'failed',
      context,
      steps_executed: stepsExecuted,
      error: errorMsg,
    }
  }
}

// ============================================================
// Approval Resolution
// ============================================================

export async function resolveApproval(
  run: WorkflowRun,
  steps: WorkflowStep[],
  stepId: string,
  approved: boolean,
  comment: string | null = null,
  baseUrl?: string
): Promise<ExecuteWorkflowResult> {
  const context = (run.context || {}) as WorkflowContext

  // Update the approval step result
  const stepResult = context.step_results[stepId]
  if (!stepResult || stepResult.status !== 'waiting') {
    return {
      run_id: run.id,
      status: 'failed',
      context,
      steps_executed: 0,
      error: 'Step is not waiting for approval',
    }
  }

  // Mark the approval as resolved
  stepResult.status = approved ? 'completed' : 'failed'
  stepResult.completed_at = new Date().toISOString()
  stepResult.output = {
    ...stepResult.output,
    approval_status: approved ? 'approved' : 'rejected',
    comment,
    resolved_at: new Date().toISOString(),
  }

  // Store approval result in context variables
  context.variables.approval_status = approved ? 'approved' : 'rejected'
  context.variables.approval_comment = comment

  // Clear waiting state
  delete context.waiting_step_id

  if (!approved) {
    context.error = `Approval rejected${comment ? ': ' + comment : ''}`
    return {
      run_id: run.id,
      status: 'failed',
      context,
      steps_executed: 0,
      error: context.error,
    }
  }

  // Resume execution from the next step
  const sortedSteps = [...steps].sort((a, b) => a.position - b.position)
  const approvalStepIdx = sortedSteps.findIndex(s => s.id === stepId)
  const remainingSteps = sortedSteps.slice(approvalStepIdx + 1)

  if (remainingSteps.length === 0) {
    return {
      run_id: run.id,
      status: 'completed',
      context,
      steps_executed: 0,
    }
  }

  let stepsExecuted = 0

  try {
    for (let i = 0; i < remainingSteps.length; i++) {
      const step = remainingSteps[i]
      context.current_step_index = approvalStepIdx + 1 + i

      const result = await executeStep(step, context, baseUrl)
      context.step_results[step.id] = result
      stepsExecuted++

      if (result.status === 'waiting') {
        context.waiting_step_id = step.id
        return {
          run_id: run.id,
          status: 'running',
          context,
          steps_executed: stepsExecuted,
        }
      }

      if (result.status === 'failed') {
        context.error = result.error
        return {
          run_id: run.id,
          status: 'failed',
          context,
          steps_executed: stepsExecuted,
          error: result.error,
        }
      }

      if (step.step_type === 'condition' && result.output) {
        const condResult = result.output.result as boolean
        const targetStepId = condResult
          ? (result.output.true_step_id as string | null)
          : (result.output.false_step_id as string | null)
        if (targetStepId) {
          const targetIdx = remainingSteps.findIndex(s => s.id === targetStepId)
          if (targetIdx >= 0) {
            i = targetIdx - 1
            continue
          }
        }
      }

      if (result.output) {
        context.variables[`step_${step.id}_output`] = result.output
      }
    }

    return {
      run_id: run.id,
      status: 'completed',
      context,
      steps_executed: stepsExecuted,
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Unexpected error during resumed execution'
    context.error = errorMsg
    return {
      run_id: run.id,
      status: 'failed',
      context,
      steps_executed: stepsExecuted,
      error: errorMsg,
    }
  }
}

// ============================================================
// Event Trigger Matching
// ============================================================

export function matchWorkflowsForEvent(
  workflows: Workflow[],
  event: string
): Workflow[] {
  return workflows.filter(wf => {
    if (wf.status !== 'active') return false
    if (wf.trigger_type !== 'event') return false
    const config = wf.trigger_config as Record<string, unknown> | null
    if (!config) return false
    // Match against the event field in trigger_config
    return config.event === event
  })
}

// ============================================================
// Schedule Parser (for demo)
// ============================================================

export function parseSchedule(config: Record<string, unknown>): {
  description: string
  next_run: string | null
} {
  const cron = config.cron as string | undefined
  const interval = config.interval as string | undefined
  const day = config.day as string | undefined
  const time = config.time as string | undefined

  if (cron) {
    return {
      description: `Cron: ${cron}`,
      next_run: null, // Full cron parsing omitted for demo
    }
  }

  if (interval) {
    const now = new Date()
    let nextRun: Date | null = null

    switch (interval) {
      case 'daily':
        nextRun = new Date(now.getTime() + 24 * 60 * 60 * 1000)
        break
      case 'weekly':
        nextRun = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'monthly':
        nextRun = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate())
        break
    }

    return {
      description: `${interval}${day ? ` on ${day}` : ''}${time ? ` at ${time}` : ''}`,
      next_run: nextRun ? nextRun.toISOString() : null,
    }
  }

  return { description: 'No schedule configured', next_run: null }
}
