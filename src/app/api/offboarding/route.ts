import { NextRequest, NextResponse } from 'next/server'
import { db, schema, withRetry } from '@/lib/db'
import { eq, and, desc, sql, count } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/offboarding — processes, process detail, checklists, exit surveys, analytics
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'processes'

    switch (action) {
      // ── 1. processes ──────────────────────────────────────────────────
      case 'processes': {
        const status = url.searchParams.get('status')

        const conditions = [eq(schema.offboardingProcesses.orgId, orgId)]
        if (status) {
          conditions.push(
            eq(
              schema.offboardingProcesses.status,
              status as 'pending' | 'in_progress' | 'completed' | 'cancelled',
            ),
          )
        }

        const processes = await withRetry(() =>
          db
            .select({
              id: schema.offboardingProcesses.id,
              employeeId: schema.offboardingProcesses.employeeId,
              employeeName: schema.employees.fullName,
              initiatedBy: schema.offboardingProcesses.initiatedBy,
              status: schema.offboardingProcesses.status,
              checklistId: schema.offboardingProcesses.checklistId,
              lastWorkingDate: schema.offboardingProcesses.lastWorkingDate,
              reason: schema.offboardingProcesses.reason,
              notes: schema.offboardingProcesses.notes,
              startedAt: schema.offboardingProcesses.startedAt,
              completedAt: schema.offboardingProcesses.completedAt,
            })
            .from(schema.offboardingProcesses)
            .leftJoin(
              schema.employees,
              eq(schema.offboardingProcesses.employeeId, schema.employees.id),
            )
            .where(and(...conditions))
            .orderBy(desc(schema.offboardingProcesses.startedAt)),
        )

        return NextResponse.json(processes)
      }

      // ── 2. process-detail ─────────────────────────────────────────────
      case 'process-detail': {
        const processId = url.searchParams.get('id')
        if (!processId) {
          return NextResponse.json({ error: 'Process ID is required' }, { status: 400 })
        }

        const [process] = await withRetry(() =>
          db
            .select({
              id: schema.offboardingProcesses.id,
              employeeId: schema.offboardingProcesses.employeeId,
              employeeName: schema.employees.fullName,
              initiatedBy: schema.offboardingProcesses.initiatedBy,
              status: schema.offboardingProcesses.status,
              checklistId: schema.offboardingProcesses.checklistId,
              lastWorkingDate: schema.offboardingProcesses.lastWorkingDate,
              reason: schema.offboardingProcesses.reason,
              notes: schema.offboardingProcesses.notes,
              startedAt: schema.offboardingProcesses.startedAt,
              completedAt: schema.offboardingProcesses.completedAt,
            })
            .from(schema.offboardingProcesses)
            .leftJoin(
              schema.employees,
              eq(schema.offboardingProcesses.employeeId, schema.employees.id),
            )
            .where(
              and(
                eq(schema.offboardingProcesses.orgId, orgId),
                eq(schema.offboardingProcesses.id, processId),
              ),
            ),
        )

        if (!process) {
          return NextResponse.json({ error: 'Process not found' }, { status: 404 })
        }

        // Fetch tasks for this process
        const tasks = await withRetry(() =>
          db
            .select({
              id: schema.offboardingTasks.id,
              processId: schema.offboardingTasks.processId,
              checklistItemId: schema.offboardingTasks.checklistItemId,
              assigneeId: schema.offboardingTasks.assigneeId,
              assigneeName: schema.employees.fullName,
              status: schema.offboardingTasks.status,
              completedAt: schema.offboardingTasks.completedAt,
              completedBy: schema.offboardingTasks.completedBy,
              notes: schema.offboardingTasks.notes,
              // Include checklist item details
              itemTitle: schema.offboardingChecklistItems.title,
              itemDescription: schema.offboardingChecklistItems.description,
              itemCategory: schema.offboardingChecklistItems.category,
              itemIsRequired: schema.offboardingChecklistItems.isRequired,
            })
            .from(schema.offboardingTasks)
            .leftJoin(
              schema.employees,
              eq(schema.offboardingTasks.assigneeId, schema.employees.id),
            )
            .leftJoin(
              schema.offboardingChecklistItems,
              eq(schema.offboardingTasks.checklistItemId, schema.offboardingChecklistItems.id),
            )
            .where(eq(schema.offboardingTasks.processId, processId))
            .orderBy(schema.offboardingChecklistItems.orderIndex),
        )

        return NextResponse.json({ ...process, tasks })
      }

      // ── 3. checklists ─────────────────────────────────────────────────
      case 'checklists': {
        const checklists = await withRetry(() =>
          db
            .select({
              id: schema.offboardingChecklists.id,
              name: schema.offboardingChecklists.name,
              description: schema.offboardingChecklists.description,
              isDefault: schema.offboardingChecklists.isDefault,
              createdAt: schema.offboardingChecklists.createdAt,
            })
            .from(schema.offboardingChecklists)
            .where(eq(schema.offboardingChecklists.orgId, orgId))
            .orderBy(desc(schema.offboardingChecklists.createdAt)),
        )

        // Fetch items for each checklist
        const checklistIds = checklists.map((c) => c.id)
        let items: Array<{
          id: string
          checklistId: string
          title: string
          description: string | null
          category: string
          assigneeRole: string | null
          orderIndex: number
          isRequired: boolean
        }> = []

        if (checklistIds.length > 0) {
          items = await withRetry(() =>
            db
              .select({
                id: schema.offboardingChecklistItems.id,
                checklistId: schema.offboardingChecklistItems.checklistId,
                title: schema.offboardingChecklistItems.title,
                description: schema.offboardingChecklistItems.description,
                category: schema.offboardingChecklistItems.category,
                assigneeRole: schema.offboardingChecklistItems.assigneeRole,
                orderIndex: schema.offboardingChecklistItems.orderIndex,
                isRequired: schema.offboardingChecklistItems.isRequired,
              })
              .from(schema.offboardingChecklistItems)
              .where(
                sql`${schema.offboardingChecklistItems.checklistId} IN (${sql.join(
                  checklistIds.map((id) => sql`${id}`),
                  sql`, `,
                )})`,
              )
              .orderBy(schema.offboardingChecklistItems.orderIndex),
          )
        }

        // Group items by checklist
        const itemsByChecklist = items.reduce(
          (acc, item) => {
            if (!acc[item.checklistId]) acc[item.checklistId] = []
            acc[item.checklistId].push(item)
            return acc
          },
          {} as Record<string, typeof items>,
        )

        const result = checklists.map((c) => ({
          ...c,
          items: itemsByChecklist[c.id] || [],
        }))

        return NextResponse.json(result)
      }

      // ── 4. exit-surveys ───────────────────────────────────────────────
      case 'exit-surveys': {
        const surveys = await withRetry(() =>
          db
            .select({
              id: schema.exitSurveys.id,
              processId: schema.exitSurveys.processId,
              employeeId: schema.exitSurveys.employeeId,
              employeeName: schema.employees.fullName,
              responses: schema.exitSurveys.responses,
              submittedAt: schema.exitSurveys.submittedAt,
              isAnonymous: schema.exitSurveys.isAnonymous,
            })
            .from(schema.exitSurveys)
            .leftJoin(
              schema.employees,
              eq(schema.exitSurveys.employeeId, schema.employees.id),
            )
            .where(eq(schema.exitSurveys.orgId, orgId))
            .orderBy(desc(schema.exitSurveys.submittedAt)),
        )

        return NextResponse.json(surveys)
      }

      // ── 5. analytics ──────────────────────────────────────────────────
      case 'analytics': {
        // Total offboardings by status
        const byStatus = await withRetry(() =>
          db
            .select({
              status: schema.offboardingProcesses.status,
              count: count(),
            })
            .from(schema.offboardingProcesses)
            .where(eq(schema.offboardingProcesses.orgId, orgId))
            .groupBy(schema.offboardingProcesses.status),
        )

        const statusCounts = byStatus.reduce(
          (acc, row) => {
            acc[row.status] = row.count
            return acc
          },
          {} as Record<string, number>,
        )

        const total =
          (statusCounts.pending || 0) +
          (statusCounts.in_progress || 0) +
          (statusCounts.completed || 0) +
          (statusCounts.cancelled || 0)

        // Average completion time (days between startedAt and completedAt for completed processes)
        const [avgResult] = await withRetry(() =>
          db
            .select({
              avgDays: sql<number>`COALESCE(
                AVG(
                  EXTRACT(EPOCH FROM (${schema.offboardingProcesses.completedAt} - ${schema.offboardingProcesses.startedAt})) / 86400
                ),
                0
              )`,
            })
            .from(schema.offboardingProcesses)
            .where(
              and(
                eq(schema.offboardingProcesses.orgId, orgId),
                eq(schema.offboardingProcesses.status, 'completed'),
              ),
            ),
        )

        // Completion rate
        const completedCount = statusCounts.completed || 0
        const completionRate = total > 0 ? Math.round((completedCount / total) * 100) : 0

        // By department
        const byDepartment = await withRetry(() =>
          db
            .select({
              departmentId: schema.employees.departmentId,
              departmentName: schema.departments.name,
              count: count(),
            })
            .from(schema.offboardingProcesses)
            .innerJoin(
              schema.employees,
              eq(schema.offboardingProcesses.employeeId, schema.employees.id),
            )
            .leftJoin(
              schema.departments,
              eq(schema.employees.departmentId, schema.departments.id),
            )
            .where(eq(schema.offboardingProcesses.orgId, orgId))
            .groupBy(schema.employees.departmentId, schema.departments.name),
        )

        // By reason
        const byReason = await withRetry(() =>
          db
            .select({
              reason: schema.offboardingProcesses.reason,
              count: count(),
            })
            .from(schema.offboardingProcesses)
            .where(eq(schema.offboardingProcesses.orgId, orgId))
            .groupBy(schema.offboardingProcesses.reason),
        )

        return NextResponse.json({
          total,
          statusCounts,
          avgCompletionDays: Math.round((avgResult?.avgDays || 0) * 10) / 10,
          completionRate,
          byDepartment,
          byReason,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/offboarding] Error:', error)
    return NextResponse.json({ error: 'Offboarding query failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/offboarding — initiate process, update tasks, submit survey, etc.
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      // ── initiate ────────────────────────────────────────────────────
      case 'initiate': {
        const { employeeId, reason, lastWorkingDate, checklistId, notes, initiatedBy } = body
        if (!employeeId || !reason || !lastWorkingDate) {
          return NextResponse.json(
            { error: 'employeeId, reason, and lastWorkingDate are required' },
            { status: 400 },
          )
        }

        // Create the offboarding process
        const [process] = await withRetry(() =>
          db
            .insert(schema.offboardingProcesses)
            .values({
              orgId,
              employeeId,
              initiatedBy: initiatedBy || null,
              reason,
              lastWorkingDate,
              checklistId: checklistId || null,
              notes: notes || null,
              status: 'pending',
            })
            .returning(),
        )

        // If a checklist was specified, create tasks from its items
        if (checklistId) {
          const checklistItems = await withRetry(() =>
            db
              .select()
              .from(schema.offboardingChecklistItems)
              .where(eq(schema.offboardingChecklistItems.checklistId, checklistId))
              .orderBy(schema.offboardingChecklistItems.orderIndex),
          )

          if (checklistItems.length > 0) {
            await withRetry(() =>
              db.insert(schema.offboardingTasks).values(
                checklistItems.map((item) => ({
                  processId: process.id,
                  checklistItemId: item.id,
                  assigneeId: null as string | null,
                  status: 'pending' as const,
                })),
              ),
            )
          }
        }

        return NextResponse.json({ success: true, data: process })
      }

      // ── update-task ─────────────────────────────────────────────────
      case 'update-task': {
        const { taskId, status, notes: taskNotes, completedBy } = body
        if (!taskId || !status) {
          return NextResponse.json(
            { error: 'taskId and status are required' },
            { status: 400 },
          )
        }

        const updateValues: Record<string, unknown> = {
          status,
          notes: taskNotes || null,
        }

        if (status === 'completed') {
          updateValues.completedAt = new Date()
          updateValues.completedBy = completedBy || null
        }

        const [updated] = await withRetry(() =>
          db
            .update(schema.offboardingTasks)
            .set(updateValues)
            .where(eq(schema.offboardingTasks.id, taskId))
            .returning(),
        )

        if (!updated) {
          return NextResponse.json({ error: 'Task not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: updated })
      }

      // ── submit-survey ───────────────────────────────────────────────
      case 'submit-survey': {
        const { processId, employeeId, responses, isAnonymous } = body
        if (!employeeId || !responses) {
          return NextResponse.json(
            { error: 'employeeId and responses are required' },
            { status: 400 },
          )
        }

        const [survey] = await withRetry(() =>
          db
            .insert(schema.exitSurveys)
            .values({
              orgId,
              processId: processId || null,
              employeeId,
              responses,
              isAnonymous: isAnonymous ?? false,
            })
            .returning(),
        )

        return NextResponse.json({ success: true, data: survey })
      }

      // ── create-checklist ────────────────────────────────────────────
      case 'create-checklist': {
        const { name, description, items, isDefault } = body
        if (!name) {
          return NextResponse.json({ error: 'name is required' }, { status: 400 })
        }

        const [checklist] = await withRetry(() =>
          db
            .insert(schema.offboardingChecklists)
            .values({
              orgId,
              name,
              description: description || null,
              isDefault: isDefault ?? false,
            })
            .returning(),
        )

        // Insert checklist items if provided
        if (items && Array.isArray(items) && items.length > 0) {
          await withRetry(() =>
            db.insert(schema.offboardingChecklistItems).values(
              items.map(
                (
                  item: {
                    title: string
                    description?: string
                    category: string
                    assigneeRole?: string
                    isRequired?: boolean
                  },
                  index: number,
                ) => ({
                  checklistId: checklist.id,
                  title: item.title,
                  description: item.description || null,
                  category: item.category as
                    | 'access_revocation'
                    | 'device_return'
                    | 'knowledge_transfer'
                    | 'exit_interview'
                    | 'final_pay'
                    | 'benefits'
                    | 'documents',
                  assigneeRole: item.assigneeRole || null,
                  orderIndex: index,
                  isRequired: item.isRequired ?? true,
                }),
              ),
            ),
          )
        }

        return NextResponse.json({ success: true, data: checklist })
      }

      // ── update-process ──────────────────────────────────────────────
      case 'update-process': {
        const { processId, status: processStatus, notes: processNotes } = body
        if (!processId) {
          return NextResponse.json({ error: 'processId is required' }, { status: 400 })
        }

        const updateValues: Record<string, unknown> = {}
        if (processStatus) updateValues.status = processStatus
        if (processNotes !== undefined) updateValues.notes = processNotes
        if (processStatus === 'completed') updateValues.completedAt = new Date()

        // Verify the process belongs to this org
        const [updated] = await withRetry(() =>
          db
            .update(schema.offboardingProcesses)
            .set(updateValues)
            .where(
              and(
                eq(schema.offboardingProcesses.id, processId),
                eq(schema.offboardingProcesses.orgId, orgId),
              ),
            )
            .returning(),
        )

        if (!updated) {
          return NextResponse.json({ error: 'Process not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: updated })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/offboarding] Error:', error)
    return NextResponse.json({ error: 'Offboarding operation failed' }, { status: 500 })
  }
}
