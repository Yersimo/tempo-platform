// Workflow Cross-System Triggers
// Enables third-party event triggers, cross-module actions, conditional branching

import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkflowTrigger {
  id: string
  type: 'internal' | 'webhook' | 'schedule' | 'third_party'
  source: string
  event: string
  description: string
  config?: Record<string, unknown>
}

export interface WorkflowAction {
  id: string
  type: 'internal' | 'webhook' | 'email' | 'slack' | 'api_call' | 'condition'
  target: string
  action: string
  description: string
  config?: Record<string, unknown>
}

export interface WebhookPayload {
  event: string
  source: string
  timestamp: string
  data: Record<string, unknown>
  metadata?: Record<string, unknown>
}

// ---------------------------------------------------------------------------
// Built-in Trigger Definitions
// ---------------------------------------------------------------------------

export const AVAILABLE_TRIGGERS: WorkflowTrigger[] = [
  // Internal triggers
  { id: 'employee.created', type: 'internal', source: 'tempo', event: 'employee.created', description: 'When a new employee is added' },
  { id: 'employee.updated', type: 'internal', source: 'tempo', event: 'employee.updated', description: 'When employee data changes' },
  { id: 'employee.offboarded', type: 'internal', source: 'tempo', event: 'employee.offboarded', description: 'When an employee is deactivated' },
  { id: 'leave.requested', type: 'internal', source: 'tempo', event: 'leave.requested', description: 'When a leave request is submitted' },
  { id: 'leave.approved', type: 'internal', source: 'tempo', event: 'leave.approved', description: 'When a leave request is approved' },
  { id: 'review.completed', type: 'internal', source: 'tempo', event: 'review.completed', description: 'When a performance review is submitted' },
  { id: 'goal.at_risk', type: 'internal', source: 'tempo', event: 'goal.at_risk', description: 'When a goal status changes to at-risk' },
  { id: 'salary.approved', type: 'internal', source: 'tempo', event: 'salary.approved', description: 'When a salary change is approved' },
  { id: 'expense.submitted', type: 'internal', source: 'tempo', event: 'expense.submitted', description: 'When an expense report is submitted' },
  { id: 'it_request.created', type: 'internal', source: 'tempo', event: 'it_request.created', description: 'When an IT request is created' },

  // Third-party triggers
  { id: 'github.pr_merged', type: 'third_party', source: 'github', event: 'pull_request.merged', description: 'When a GitHub PR is merged' },
  { id: 'github.issue_opened', type: 'third_party', source: 'github', event: 'issues.opened', description: 'When a GitHub issue is opened' },
  { id: 'slack.reaction_added', type: 'third_party', source: 'slack', event: 'reaction_added', description: 'When a Slack reaction is added' },
  { id: 'slack.message_posted', type: 'third_party', source: 'slack', event: 'message.posted', description: 'When a message is posted in Slack' },
  { id: 'jira.issue_created', type: 'third_party', source: 'jira', event: 'issue.created', description: 'When a Jira issue is created' },
  { id: 'jira.issue_resolved', type: 'third_party', source: 'jira', event: 'issue.resolved', description: 'When a Jira issue is resolved' },
  { id: 'zendesk.ticket_created', type: 'third_party', source: 'zendesk', event: 'ticket.created', description: 'When a Zendesk ticket is created' },
  { id: 'zendesk.low_csat', type: 'third_party', source: 'zendesk', event: 'satisfaction.low', description: 'When a low CSAT score is received' },
  { id: 'salesforce.deal_closed', type: 'third_party', source: 'salesforce', event: 'opportunity.closed_won', description: 'When a Salesforce deal is closed-won' },
  { id: 'calendar.meeting_ended', type: 'third_party', source: 'google_calendar', event: 'meeting.ended', description: 'When a calendar meeting ends' },

  // Webhook triggers
  { id: 'webhook.custom', type: 'webhook', source: 'custom', event: 'webhook.received', description: 'When a custom webhook is received' },

  // Schedule triggers
  { id: 'schedule.daily', type: 'schedule', source: 'cron', event: 'schedule.daily', description: 'Every day at a specified time' },
  { id: 'schedule.weekly', type: 'schedule', source: 'cron', event: 'schedule.weekly', description: 'Every week on a specified day' },
  { id: 'schedule.monthly', type: 'schedule', source: 'cron', event: 'schedule.monthly', description: 'Every month on a specified date' },
]

// ---------------------------------------------------------------------------
// Built-in Action Definitions
// ---------------------------------------------------------------------------

export const AVAILABLE_ACTIONS: WorkflowAction[] = [
  // Internal actions
  { id: 'create_employee', type: 'internal', target: 'employees', action: 'create', description: 'Create a new employee record' },
  { id: 'update_employee', type: 'internal', target: 'employees', action: 'update', description: 'Update an employee record' },
  { id: 'deactivate_employee', type: 'internal', target: 'employees', action: 'deactivate', description: 'Deactivate an employee (offboard)' },
  { id: 'create_task', type: 'internal', target: 'tasks', action: 'create', description: 'Create a project task' },
  { id: 'create_it_request', type: 'internal', target: 'itRequests', action: 'create', description: 'Create an IT request' },
  { id: 'assign_device', type: 'internal', target: 'devices', action: 'assign', description: 'Assign a device to an employee' },
  { id: 'revoke_device', type: 'internal', target: 'devices', action: 'revoke', description: 'Revoke device assignment' },
  { id: 'enroll_course', type: 'internal', target: 'enrollments', action: 'create', description: 'Enroll employee in a course' },
  { id: 'create_goal', type: 'internal', target: 'goals', action: 'create', description: 'Create a goal for employee' },
  { id: 'approve_leave', type: 'internal', target: 'leaveRequests', action: 'approve', description: 'Auto-approve a leave request' },

  // Notification actions
  { id: 'send_email', type: 'email', target: 'email', action: 'send', description: 'Send an email notification' },
  { id: 'send_notification', type: 'internal', target: 'notifications', action: 'create', description: 'Send an in-app notification' },

  // External actions
  { id: 'slack_message', type: 'slack', target: 'slack', action: 'post_message', description: 'Post a message to Slack' },
  { id: 'webhook_call', type: 'webhook', target: 'custom', action: 'post', description: 'Call a custom webhook URL' },
  { id: 'api_call', type: 'api_call', target: 'custom', action: 'request', description: 'Make an HTTP API call' },

  // Conditional
  { id: 'condition_check', type: 'condition', target: 'workflow', action: 'branch', description: 'Conditional branch (if/else)' },
]

// ---------------------------------------------------------------------------
// Webhook Processing
// ---------------------------------------------------------------------------

export async function processWebhook(
  orgId: string,
  source: string,
  payload: WebhookPayload
): Promise<{ triggered: number; workflowIds: string[] }> {
  // Find workflows matching this trigger
  const workflows = await db.select().from(schema.workflows)
    .where(and(eq(schema.workflows.orgId, orgId), eq(schema.workflows.status, 'active')))

  const triggeredWorkflows: string[] = []

  for (const workflow of workflows) {
    const triggerConfig = workflow.triggerConfig as Record<string, unknown> | null
    if (!triggerConfig) continue

    // Match trigger source and event
    const triggerSource = triggerConfig.source as string
    const triggerEvent = triggerConfig.event as string

    if (triggerSource === source && triggerEvent === payload.event) {
      // Execute workflow
      await executeWorkflow(orgId, workflow.id, payload.data)
      triggeredWorkflows.push(workflow.id)
    }
  }

  return { triggered: triggeredWorkflows.length, workflowIds: triggeredWorkflows }
}

async function executeWorkflow(orgId: string, workflowId: string, context: Record<string, unknown>): Promise<void> {
  // Create workflow run
  const [run] = await db.insert(schema.workflowRuns).values({
    orgId,
    workflowId,
    status: 'running',
    startedAt: new Date(),
    triggeredBy: 'webhook',
    context,
  }).returning()

  try {
    // Get workflow steps
    const steps = await db.select().from(schema.workflowSteps)
      .where(eq(schema.workflowSteps.workflowId, workflowId))

    // Sort by position
    steps.sort((a, b) => a.position - b.position)

    // Execute each step
    for (const step of steps) {
      const config = step.config as Record<string, unknown> | null

      switch (step.stepType) {
        case 'action':
          await executeAction(orgId, config || {}, context)
          break
        case 'condition':
          const conditionMet = evaluateCondition(config || {}, context)
          if (!conditionMet && step.nextStepId) {
            // Skip to next step id (branch)
            continue
          }
          break
        case 'delay':
          // In production, queue this for delayed execution
          break
        case 'notification':
          if (config?.recipientId && config?.message) {
            await db.insert(schema.notifications).values({
              orgId,
              recipientId: config.recipientId as string,
              type: 'info',
              channel: 'in_app',
              title: (config.title as string) || 'Workflow Notification',
              message: config.message as string,
            })
          }
          break
      }
    }

    // Mark run as completed
    await db.update(schema.workflowRuns)
      .set({ status: 'completed', completedAt: new Date() })
      .where(eq(schema.workflowRuns.id, run.id))

  } catch (error) {
    console.error(`[Workflow] Execution failed for ${workflowId}:`, error)
    await db.update(schema.workflowRuns)
      .set({ status: 'failed', completedAt: new Date() })
      .where(eq(schema.workflowRuns.id, run.id))
  }
}

async function executeAction(orgId: string, config: Record<string, unknown>, context: Record<string, unknown>): Promise<void> {
  const actionType = config.actionType as string

  switch (actionType) {
    case 'webhook_call': {
      const url = config.url as string
      if (!url) break
      await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'tempo-workflow', context, timestamp: new Date().toISOString() }),
      }).catch(err => console.error('[Workflow Action] Webhook call failed:', err))
      break
    }

    case 'slack_message': {
      const webhookUrl = config.slackWebhookUrl as string
      const message = config.message as string
      if (!webhookUrl || !message) break
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: interpolateTemplate(message, context) }),
      }).catch(err => console.error('[Workflow Action] Slack post failed:', err))
      break
    }

    case 'api_call': {
      const url = config.url as string
      const method = (config.method as string) || 'POST'
      const headers = (config.headers as Record<string, string>) || {}
      if (!url) break
      await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...headers },
        body: method !== 'GET' ? JSON.stringify(context) : undefined,
      }).catch(err => console.error('[Workflow Action] API call failed:', err))
      break
    }
  }
}

function evaluateCondition(config: Record<string, unknown>, context: Record<string, unknown>): boolean {
  const field = config.field as string
  const operator = config.operator as string
  const value = config.value

  const actual = context[field]

  switch (operator) {
    case 'eq': return actual === value
    case 'neq': return actual !== value
    case 'gt': return Number(actual) > Number(value)
    case 'gte': return Number(actual) >= Number(value)
    case 'lt': return Number(actual) < Number(value)
    case 'lte': return Number(actual) <= Number(value)
    case 'contains': return String(actual).includes(String(value))
    case 'exists': return actual !== undefined && actual !== null
    default: return false
  }
}

function interpolateTemplate(template: string, context: Record<string, unknown>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(context[key] || ''))
}
