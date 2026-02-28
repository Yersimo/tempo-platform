import { NextRequest, NextResponse } from 'next/server'

// GET /api/offboarding - List processes, get process details, get checklists
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'processes'

    switch (action) {
      case 'processes': {
        const status = url.searchParams.get('status')
        // In a real implementation, would query DB with filters
        return NextResponse.json({
          message: 'Use client-side store for demo data',
          filters: { status },
        })
      }

      case 'process-detail': {
        const processId = url.searchParams.get('id')
        if (!processId) {
          return NextResponse.json({ error: 'Process ID is required' }, { status: 400 })
        }
        return NextResponse.json({
          message: 'Use client-side store for demo data',
          processId,
        })
      }

      case 'checklists': {
        return NextResponse.json({
          message: 'Use client-side store for demo data',
        })
      }

      case 'exit-surveys': {
        return NextResponse.json({
          message: 'Use client-side store for demo data',
        })
      }

      case 'analytics': {
        return NextResponse.json({
          message: 'Use client-side store for demo data',
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

// POST /api/offboarding - Initiate process, update tasks, submit survey, create checklist
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'initiate': {
        const { employeeId, reason, lastWorkingDate, checklistId, notes } = body
        if (!employeeId || !reason || !lastWorkingDate) {
          return NextResponse.json(
            { error: 'employeeId, reason, and lastWorkingDate are required' },
            { status: 400 }
          )
        }
        // In a real implementation, would create process in DB and generate tasks from checklist
        return NextResponse.json({
          success: true,
          message: 'Offboarding process initiated',
          data: { employeeId, reason, lastWorkingDate, checklistId, notes },
        })
      }

      case 'update-task': {
        const { taskId, status, notes } = body
        if (!taskId || !status) {
          return NextResponse.json(
            { error: 'taskId and status are required' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Task status updated',
          data: { taskId, status, notes },
        })
      }

      case 'submit-survey': {
        const { processId, employeeId, responses, isAnonymous } = body
        if (!employeeId || !responses) {
          return NextResponse.json(
            { error: 'employeeId and responses are required' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Exit survey submitted',
          data: { processId, employeeId, isAnonymous },
        })
      }

      case 'create-checklist': {
        const { name, description, items } = body
        if (!name) {
          return NextResponse.json(
            { error: 'name is required' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Checklist created',
          data: { name, description, itemCount: items?.length || 0 },
        })
      }

      case 'update-process': {
        const { processId, status: processStatus, notes: processNotes } = body
        if (!processId) {
          return NextResponse.json(
            { error: 'processId is required' },
            { status: 400 }
          )
        }
        return NextResponse.json({
          success: true,
          message: 'Process updated',
          data: { processId, status: processStatus, notes: processNotes },
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/offboarding] Error:', error)
    return NextResponse.json({ error: 'Offboarding operation failed' }, { status: 500 })
  }
}
