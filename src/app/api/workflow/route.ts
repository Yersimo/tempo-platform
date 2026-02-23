import { NextRequest, NextResponse } from 'next/server'
import {
  executeWorkflow,
  resolveApproval,
  matchWorkflowsForEvent,
} from '@/lib/workflow-engine'
import type {
  Workflow,
  WorkflowStep,
  WorkflowRun,
  WorkflowContext,
  RunStatus,
} from '@/lib/workflow-engine'

// ---------------------------------------------------------------------------
// In-memory run store (supplements the client-side store for API access)
// In production this would be backed by the database via Drizzle.
// ---------------------------------------------------------------------------

const runStore = new Map<string, {
  run: WorkflowRun
  workflow: Workflow
  steps: WorkflowStep[]
}>()

// ---------------------------------------------------------------------------
// POST /api/workflow
// Actions: execute, status, approve, trigger
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const employeeId = request.headers.get('x-employee-id')
    const orgId = request.headers.get('x-org-id')

    if (!employeeId || !orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'execute':
        return handleExecute(body, orgId, employeeId, request)
      case 'status':
        return handleStatus(body)
      case 'approve':
        return handleApprove(body, employeeId, request)
      case 'trigger':
        return handleTrigger(body, orgId, employeeId, request)
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// Execute a workflow
// ---------------------------------------------------------------------------

async function handleExecute(
  body: Record<string, unknown>,
  orgId: string,
  employeeId: string,
  request: NextRequest
) {
  const { workflow, steps, triggerData } = body as {
    workflow: Workflow
    steps: WorkflowStep[]
    triggerData?: Record<string, unknown>
  }

  if (!workflow || !steps) {
    return NextResponse.json(
      { error: 'Missing workflow or steps data' },
      { status: 400 }
    )
  }

  // Determine base URL for internal API calls
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  const result = await executeWorkflow(
    workflow,
    steps,
    triggerData || {},
    employeeId,
    baseUrl
  )

  // Build the run record
  const run: WorkflowRun = {
    id: result.run_id,
    org_id: orgId,
    workflow_id: workflow.id,
    status: result.status,
    started_at: result.context.started_at,
    completed_at: result.status === 'completed' || result.status === 'failed'
      ? new Date().toISOString()
      : null,
    triggered_by: employeeId,
    context: result.context,
  }

  // Store in memory for later status/approve lookups
  runStore.set(result.run_id, { run, workflow, steps })

  return NextResponse.json({
    success: true,
    run_id: result.run_id,
    status: result.status,
    steps_executed: result.steps_executed,
    context: result.context,
    error: result.error || null,
  })
}

// ---------------------------------------------------------------------------
// Get run status
// ---------------------------------------------------------------------------

async function handleStatus(body: Record<string, unknown>) {
  const { runId } = body as { runId: string }

  if (!runId) {
    return NextResponse.json({ error: 'Missing runId' }, { status: 400 })
  }

  const stored = runStore.get(runId)
  if (!stored) {
    return NextResponse.json(
      { error: 'Run not found. It may be stored in the client-side state only.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    success: true,
    run: stored.run,
  })
}

// ---------------------------------------------------------------------------
// Approve/reject a pending step
// ---------------------------------------------------------------------------

async function handleApprove(
  body: Record<string, unknown>,
  employeeId: string,
  request: NextRequest
) {
  const { runId, stepId, approved, comment } = body as {
    runId: string
    stepId: string
    approved: boolean
    comment?: string
  }

  if (!runId || !stepId || approved === undefined) {
    return NextResponse.json(
      { error: 'Missing runId, stepId, or approved flag' },
      { status: 400 }
    )
  }

  const stored = runStore.get(runId)
  if (!stored) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  const result = await resolveApproval(
    stored.run,
    stored.steps,
    stepId,
    approved,
    comment || null,
    baseUrl
  )

  // Update stored run
  stored.run.status = result.status
  stored.run.context = result.context
  if (result.status === 'completed' || result.status === 'failed') {
    stored.run.completed_at = new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    run_id: runId,
    status: result.status,
    steps_executed: result.steps_executed,
    context: result.context,
    error: result.error || null,
  })
}

// ---------------------------------------------------------------------------
// Fire an event trigger - find matching workflows and execute them
// ---------------------------------------------------------------------------

async function handleTrigger(
  body: Record<string, unknown>,
  orgId: string,
  employeeId: string,
  request: NextRequest
) {
  const { event, data, workflows, allSteps } = body as {
    event: string
    data: Record<string, unknown>
    workflows: Workflow[]
    allSteps: WorkflowStep[]
  }

  if (!event || !workflows) {
    return NextResponse.json(
      { error: 'Missing event or workflows data' },
      { status: 400 }
    )
  }

  const matched = matchWorkflowsForEvent(workflows, event)

  if (matched.length === 0) {
    return NextResponse.json({
      success: true,
      matched: 0,
      runs: [],
      message: `No active workflows matched event "${event}"`,
    })
  }

  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  const baseUrl = `${proto}://${host}`

  const runs: Array<{ run_id: string; workflow_id: string; status: RunStatus }> = []

  for (const wf of matched) {
    const wfSteps = (allSteps || []).filter(
      (s: WorkflowStep) => s.workflow_id === wf.id
    )

    const result = await executeWorkflow(wf, wfSteps, data || {}, `event:${event}`, baseUrl)

    const run: WorkflowRun = {
      id: result.run_id,
      org_id: orgId,
      workflow_id: wf.id,
      status: result.status,
      started_at: result.context.started_at,
      completed_at: result.status === 'completed' || result.status === 'failed'
        ? new Date().toISOString()
        : null,
      triggered_by: `event:${event}`,
      context: result.context,
    }

    runStore.set(result.run_id, { run, workflow: wf, steps: wfSteps })
    runs.push({ run_id: result.run_id, workflow_id: wf.id, status: result.status })
  }

  return NextResponse.json({
    success: true,
    matched: matched.length,
    runs,
  })
}
