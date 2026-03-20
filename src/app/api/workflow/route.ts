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
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Fallback in-memory store — used only when the DB table is unavailable
// (e.g. org hasn't run the migration yet).
// ---------------------------------------------------------------------------

const fallbackStore = new Map<string, {
  run: WorkflowRun
  workflow: Workflow
  steps: WorkflowStep[]
}>()

let dbAvailable: boolean | null = null // null = not yet probed

/**
 * Probe whether the workflow_runs table exists. Result is cached for the
 * lifetime of the serverless function instance.
 */
async function isDbAvailable(): Promise<boolean> {
  if (dbAvailable !== null) return dbAvailable
  try {
    // A lightweight query — just select one row (or zero). If the table
    // doesn't exist, the driver will throw.
    await db.select({ id: schema.workflowRuns.id })
      .from(schema.workflowRuns)
      .limit(1)
    dbAvailable = true
  } catch {
    dbAvailable = false
  }
  return dbAvailable
}

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

async function persistRun(run: WorkflowRun): Promise<void> {
  if (!(await isDbAvailable())) {
    return // caller uses fallback store
  }
  try {
    await db.insert(schema.workflowRuns).values({
      id: run.id,
      orgId: run.org_id,
      workflowId: run.workflow_id,
      status: run.status as 'running' | 'completed' | 'failed' | 'cancelled',
      startedAt: new Date(run.started_at),
      completedAt: run.completed_at ? new Date(run.completed_at) : null,
      triggeredBy: run.triggered_by?.slice(0, 100) ?? null,
      context: run.context as unknown as Record<string, unknown>,
    })
  } catch (err) {
    // If insert fails (e.g. table dropped mid-flight), fall through to
    // in-memory storage handled by the caller.
    console.error('[workflow] DB insert failed, falling back to in-memory', err)
    dbAvailable = false
  }
}

async function fetchRun(runId: string): Promise<WorkflowRun | null> {
  if (!(await isDbAvailable())) return null
  try {
    const rows = await db.select()
      .from(schema.workflowRuns)
      .where(eq(schema.workflowRuns.id, runId))
      .limit(1)
    if (rows.length === 0) return null
    const row = rows[0]
    return {
      id: row.id,
      org_id: row.orgId,
      workflow_id: row.workflowId,
      status: row.status as RunStatus,
      started_at: (row.startedAt as Date).toISOString(),
      completed_at: row.completedAt ? (row.completedAt as Date).toISOString() : null,
      triggered_by: row.triggeredBy,
      context: (row.context as WorkflowContext) ?? null,
    }
  } catch (err) {
    console.error('[workflow] DB select failed, falling back to in-memory', err)
    dbAvailable = false
    return null
  }
}

async function updateRun(run: WorkflowRun): Promise<void> {
  if (!(await isDbAvailable())) return
  try {
    await db.update(schema.workflowRuns)
      .set({
        status: run.status as 'running' | 'completed' | 'failed' | 'cancelled',
        completedAt: run.completed_at ? new Date(run.completed_at) : null,
        context: run.context as unknown as Record<string, unknown>,
      })
      .where(eq(schema.workflowRuns.id, run.id))
  } catch (err) {
    console.error('[workflow] DB update failed', err)
    dbAvailable = false
  }
}

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

  // Persist to DB (falls back to in-memory if table unavailable)
  await persistRun(run)
  fallbackStore.set(result.run_id, { run, workflow, steps })

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

  // Try DB first, then fall back to in-memory
  const dbRun = await fetchRun(runId)
  if (dbRun) {
    return NextResponse.json({ success: true, run: dbRun })
  }

  const stored = fallbackStore.get(runId)
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

  // Resolve the run — DB first, fallback store second
  let run: WorkflowRun | null = await fetchRun(runId)
  let stored = fallbackStore.get(runId)

  if (!run && !stored) {
    return NextResponse.json({ error: 'Run not found' }, { status: 404 })
  }

  // We need the workflow and steps from the fallback store for resolveApproval.
  // If only DB had the run, we still need those objects; the fallback store
  // keeps them alongside the run record.
  if (!stored) {
    return NextResponse.json(
      { error: 'Run found in DB but workflow/steps context unavailable for approval resolution' },
      { status: 422 }
    )
  }

  // Prefer the DB version of the run if available (more current than memory)
  if (run) {
    stored.run = run
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

  // Persist update to DB
  await updateRun(stored.run)

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

    // Persist to DB (falls back to in-memory if table unavailable)
    await persistRun(run)
    fallbackStore.set(result.run_id, { run, workflow: wf, steps: wfSteps })
    runs.push({ run_id: result.run_id, workflow_id: wf.id, status: result.status })
  }

  return NextResponse.json({
    success: true,
    matched: matched.length,
    runs,
  })
}
