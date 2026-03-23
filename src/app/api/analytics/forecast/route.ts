import { NextRequest, NextResponse } from 'next/server'
import {
  computeDailySnapshot,
  generateRollingForecast,
  compareScenarios,
  ASSUMPTION_PRESETS,
  type ForecastAssumptions,
  type DailySnapshot,
} from '@/lib/analytics/aggregation-engine'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/analytics/forecast
// ---------------------------------------------------------------------------
// ?action=snapshot          — compute current daily snapshot
// ?action=forecast&scenario=base|aggressive|conservative|downturn
// ?action=compare&a=base&b=aggressive
// ?action=scenarios         — list saved scenarios
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'snapshot'

    // Build a lightweight store-like object from DB for snapshot computation
    // For demo orgs, use fallback data
    const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    let storeData: Record<string, any> = {}

    if (UUID_FORMAT.test(orgId)) {
      try {
        const [employees, departments, payrollRuns, jobPostings, applications, enrollments, complianceRequirements] = await Promise.all([
          db.select().from(schema.employees).where(eq(schema.employees.orgId, orgId)).limit(500),
          db.select().from(schema.departments).where(eq(schema.departments.orgId, orgId)).limit(100),
          db.select().from(schema.payrollRuns).where(eq(schema.payrollRuns.orgId, orgId)).limit(10),
          db.select().from(schema.jobPostings).where(eq(schema.jobPostings.orgId, orgId)).limit(50),
          db.select().from(schema.applications).where(eq(schema.applications.orgId, orgId)).limit(200),
          db.select().from(schema.enrollments).where(eq(schema.enrollments.orgId, orgId)).limit(200),
          db.select().from(schema.complianceRequirements).where(eq(schema.complianceRequirements.orgId, orgId)).limit(100),
        ])
        storeData = { employees, departments, payrollRuns, jobPostings, applications, enrollments, complianceRequirements }
      } catch {
        // Fallback: empty store for demo
      }
    }

    if (action === 'snapshot') {
      const snapshot = computeDailySnapshot(storeData)
      return NextResponse.json({ snapshot })
    }

    if (action === 'forecast') {
      const scenarioKey = url.searchParams.get('scenario') || 'base'
      const preset = ASSUMPTION_PRESETS[scenarioKey] || ASSUMPTION_PRESETS.base
      const snapshot = computeDailySnapshot(storeData)
      const forecast = generateRollingForecast(snapshot, preset.assumptions)
      return NextResponse.json({ scenario: scenarioKey, snapshot, forecast, assumptions: preset })
    }

    if (action === 'compare') {
      const keyA = url.searchParams.get('a') || 'base'
      const keyB = url.searchParams.get('b') || 'aggressive'
      const presetA = ASSUMPTION_PRESETS[keyA] || ASSUMPTION_PRESETS.base
      const presetB = ASSUMPTION_PRESETS[keyB] || ASSUMPTION_PRESETS.aggressive
      const snapshot = computeDailySnapshot(storeData)
      const forecastA = generateRollingForecast(snapshot, presetA.assumptions)
      const forecastB = generateRollingForecast(snapshot, presetB.assumptions)
      const comparison = compareScenarios(forecastA, forecastB)
      return NextResponse.json({
        scenarioA: { key: keyA, label: presetA.label, forecast: forecastA },
        scenarioB: { key: keyB, label: presetB.label, forecast: forecastB },
        comparison,
      })
    }

    if (action === 'scenarios') {
      if (UUID_FORMAT.test(orgId)) {
        try {
          const scenarios = await db
            .select()
            .from(schema.planningScenarios)
            .where(eq(schema.planningScenarios.orgId, orgId))
            .orderBy(desc(schema.planningScenarios.createdAt))
            .limit(50)
          return NextResponse.json({ scenarios })
        } catch {
          return NextResponse.json({ scenarios: [] })
        }
      }
      return NextResponse.json({ scenarios: [] })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    console.error('[forecast API]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/analytics/forecast
// ---------------------------------------------------------------------------
// body.action = 'save-scenario' | 'update-actuals'
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (action === 'save-scenario') {
      const { name, description, assumptions, projections } = body
      if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 })
      }

      if (UUID_FORMAT.test(orgId)) {
        try {
          const [scenario] = await db
            .insert(schema.planningScenarios)
            .values({
              orgId,
              name,
              description: description || null,
              baselineDate: new Date().toISOString().split('T')[0],
              status: 'draft',
              assumptions: JSON.stringify(assumptions),
              projections: JSON.stringify(projections),
            })
            .returning()
          return NextResponse.json({ scenario })
        } catch (err) {
          console.error('[save-scenario]', err)
          return NextResponse.json({ error: 'Failed to save scenario' }, { status: 500 })
        }
      }

      // Demo mode: return a mock
      return NextResponse.json({
        scenario: {
          id: crypto.randomUUID(),
          orgId,
          name,
          description,
          baselineDate: new Date().toISOString().split('T')[0],
          status: 'draft',
          assumptions: JSON.stringify(assumptions),
          projections: JSON.stringify(projections),
        },
      })
    }

    if (action === 'update-actuals') {
      const { entries } = body // Array of { period, category, actualAmount }
      if (!entries || !Array.isArray(entries)) {
        return NextResponse.json({ error: 'entries array is required' }, { status: 400 })
      }

      if (UUID_FORMAT.test(orgId)) {
        try {
          for (const entry of entries) {
            const forecastAmt = entry.forecastAmount || 0
            const actualAmt = entry.actualAmount
            const variance = actualAmt - forecastAmt
            const variancePercent =
              forecastAmt !== 0 ? Math.round((variance / forecastAmt) * 100) : 0

            await db
              .insert(schema.forecastEntries)
              .values({
                orgId,
                scenarioId: entry.scenarioId || null,
                period: entry.period,
                category: entry.category,
                subcategory: entry.subcategory || null,
                forecastAmount: forecastAmt,
                actualAmount: actualAmt,
                variance,
                variancePercent,
                assumptions: entry.assumptions || null,
              })
          }
          return NextResponse.json({ success: true, count: entries.length })
        } catch (err) {
          console.error('[update-actuals]', err)
          return NextResponse.json({ error: 'Failed to save actuals' }, { status: 500 })
        }
      }

      return NextResponse.json({ success: true, count: entries.length })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (err) {
    console.error('[forecast POST]', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
