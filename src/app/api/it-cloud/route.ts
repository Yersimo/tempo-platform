import { NextRequest, NextResponse } from 'next/server'

// GET /api/it-cloud - IT Cloud module data
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview': {
        return NextResponse.json({
          message: 'IT Cloud module — data served from client store in demo mode',
          orgId,
        })
      }

      case 'compliance-report': {
        // Generate a compliance snapshot
        return NextResponse.json({
          generatedAt: new Date().toISOString(),
          orgId,
          message: 'Compliance report generated from client-side data in demo mode',
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('IT Cloud API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/it-cloud - IT Cloud CRUD operations
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, entity, data, id } = body

    // In demo mode, mutations are handled by the client store.
    // This endpoint is for future DB persistence.
    switch (action) {
      case 'create':
      case 'update':
      case 'delete':
        return NextResponse.json({
          success: true,
          action,
          entity,
          id: id || `${entity}-${Date.now()}`,
          message: `${action} ${entity} — persisted in client store (demo mode)`,
        })

      case 'device-action': {
        // Execute a remote device action (lock/wipe/restart etc.)
        const { deviceId, actionType, notes } = data || {}
        if (!deviceId || !actionType) {
          return NextResponse.json({ error: 'deviceId and actionType required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          actionId: `da-${Date.now()}`,
          deviceId,
          actionType,
          status: 'pending',
          message: `Device action "${actionType}" queued`,
        })
      }

      case 'bulk-app-assign': {
        const { appId, employeeIds } = data || {}
        if (!appId || !employeeIds?.length) {
          return NextResponse.json({ error: 'appId and employeeIds required' }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          assigned: employeeIds.length,
          appId,
          message: `App assigned to ${employeeIds.length} employees`,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err) {
    console.error('IT Cloud API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
