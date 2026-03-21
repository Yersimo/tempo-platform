import { NextRequest, NextResponse } from 'next/server'
import {
  createScenario, updateScenario, listScenarios, getScenario, deleteScenario,
  addChange, listChanges, removeChange,
  calculateScenarioImpact, compareScenarios,
  snapshotCurrentOrg, getScenarioOrgTree,
  applyScenario, listSnapshots,
} from '@/lib/services/org-designer'

// ---------------------------------------------------------------------------
// POST /api/org-design — Org Design Scenario operations
// GET  /api/org-design — Query org design data
// ---------------------------------------------------------------------------

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: [] })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list-scenarios'
    const scenarioId = url.searchParams.get('scenarioId') || ''

    switch (action) {
      case 'list-scenarios': {
        const scenarios = await listScenarios(orgId)
        return NextResponse.json({ data: scenarios })
      }
      case 'get-scenario': {
        if (!scenarioId) return NextResponse.json({ error: 'scenarioId required' }, { status: 400 })
        const scenario = await getScenario(scenarioId)
        return NextResponse.json({ data: scenario })
      }
      case 'list-changes': {
        if (!scenarioId) return NextResponse.json({ error: 'scenarioId required' }, { status: 400 })
        const changes = await listChanges(scenarioId)
        return NextResponse.json({ data: changes })
      }
      case 'calculate-impact': {
        if (!scenarioId) return NextResponse.json({ error: 'scenarioId required' }, { status: 400 })
        const impact = await calculateScenarioImpact(scenarioId)
        return NextResponse.json({ data: impact })
      }
      case 'org-tree': {
        if (!scenarioId) return NextResponse.json({ error: 'scenarioId required' }, { status: 400 })
        const tree = await getScenarioOrgTree(scenarioId)
        return NextResponse.json({ data: tree })
      }
      case 'list-snapshots': {
        if (!scenarioId) return NextResponse.json({ error: 'scenarioId required' }, { status: 400 })
        const snapshots = await listSnapshots(scenarioId)
        return NextResponse.json({ data: snapshots })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/org-design]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id') || ''
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ data: null })

    const body = await request.json()
    const { action, ...payload } = body

    switch (action) {
      case 'create-scenario': {
        const scenario = await createScenario(orgId, employeeId, payload)
        return NextResponse.json({ data: scenario })
      }
      case 'update-scenario': {
        const scenario = await updateScenario(payload.scenarioId, payload)
        return NextResponse.json({ data: scenario })
      }
      case 'delete-scenario': {
        await deleteScenario(payload.scenarioId)
        return NextResponse.json({ data: { success: true } })
      }
      case 'add-change': {
        const change = await addChange(payload.scenarioId, payload)
        return NextResponse.json({ data: change })
      }
      case 'remove-change': {
        await removeChange(payload.changeId)
        return NextResponse.json({ data: { success: true } })
      }
      case 'compare-scenarios': {
        const comparison = await compareScenarios(payload.scenarioIds)
        return NextResponse.json({ data: comparison })
      }
      case 'snapshot-org': {
        const snapshot = await snapshotCurrentOrg(orgId, payload.scenarioId)
        return NextResponse.json({ data: snapshot })
      }
      case 'apply-scenario': {
        const result = await applyScenario(payload.scenarioId)
        return NextResponse.json({ data: result })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/org-design]', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
