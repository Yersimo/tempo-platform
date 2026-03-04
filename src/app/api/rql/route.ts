import { NextRequest, NextResponse } from 'next/server'
import {
  parseQuery,
  validateQuery,
  executeQuery,
  explainQuery,
  getSuggestions,
  autocomplete,
  saveQuery,
  deleteQuery,
  scheduleQuery,
  unscheduleQuery,
  getQueryHistory,
  shareQuery,
  exportResults,
  getAvailableEntities,
  getEntitySchema,
  formatResults,
  getQueryAnalytics,
  createVisualization,
} from '@/lib/services/rql-engine'

// GET /api/rql - Entities, schema, history, suggestions
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'entities'

    switch (action) {
      case 'entities':
        return NextResponse.json({ entities: getAvailableEntities() })

      case 'schema': {
        const entity = url.searchParams.get('entity')
        if (!entity) return NextResponse.json({ error: 'entity is required' }, { status: 400 })
        const result = getEntitySchema(entity)
        return NextResponse.json(result)
      }

      case 'history': {
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const createdBy = url.searchParams.get('createdBy') || undefined
        const result = await getQueryHistory(orgId, { limit, createdBy })
        return NextResponse.json({ queries: result })
      }

      case 'suggestions': {
        const query = url.searchParams.get('query') || ''
        const cursor = parseInt(url.searchParams.get('cursor') || String(query.length))
        const result = getSuggestions(query, cursor)
        return NextResponse.json({ suggestions: result })
      }

      case 'autocomplete': {
        const query = url.searchParams.get('query') || ''
        const cursor = parseInt(url.searchParams.get('cursor') || String(query.length))
        const result = autocomplete(query, cursor)
        return NextResponse.json({ suggestions: result })
      }

      case 'analytics': {
        const result = getQueryAnalytics(orgId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/rql] Error:', error)
    return NextResponse.json({ error: error?.message || 'RQL query failed' }, { status: 500 })
  }
}

// POST /api/rql - Execute, validate, parse, save, schedule queries
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'execute': {
        const { query, parameters } = body
        if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })
        const result = await executeQuery(orgId, query, parameters)
        return NextResponse.json(result)
      }

      case 'validate': {
        const { query } = body
        if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })
        const result = validateQuery(query)
        return NextResponse.json(result)
      }

      case 'parse': {
        const { query } = body
        if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })
        const ast = parseQuery(query)
        return NextResponse.json({ ast })
      }

      case 'explain': {
        const { query } = body
        if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })
        const result = explainQuery(query)
        return NextResponse.json(result)
      }

      case 'save': {
        const { name, description, query, parameters, tags, isPublic, createdBy } = body
        if (!name || !query || !createdBy) return NextResponse.json({ error: 'name, query, and createdBy are required' }, { status: 400 })
        const result = await saveQuery(orgId, createdBy, { name, description, query, parameters, tags, isPublic })
        return NextResponse.json(result)
      }

      case 'delete': {
        const { queryId } = body
        if (!queryId) return NextResponse.json({ error: 'queryId is required' }, { status: 400 })
        const result = await deleteQuery(orgId, queryId)
        return NextResponse.json(result)
      }

      case 'share': {
        const { queryId, isPublic } = body
        if (!queryId || isPublic === undefined) return NextResponse.json({ error: 'queryId and isPublic are required' }, { status: 400 })
        const result = await shareQuery(orgId, queryId, isPublic)
        return NextResponse.json(result)
      }

      case 'schedule': {
        const { queryId, frequency, recipients, format } = body
        if (!queryId || !frequency || !recipients) return NextResponse.json({ error: 'queryId, frequency, and recipients are required' }, { status: 400 })
        const result = await scheduleQuery(orgId, { queryId, frequency, recipients, format: format || 'csv' })
        return NextResponse.json(result)
      }

      case 'unschedule': {
        const { scheduleId } = body
        if (!scheduleId) return NextResponse.json({ error: 'scheduleId is required' }, { status: 400 })
        const result = await unscheduleQuery(orgId, scheduleId)
        return NextResponse.json(result)
      }

      case 'export': {
        const { query, parameters, format } = body
        if (!query || !format) return NextResponse.json({ error: 'query and format are required' }, { status: 400 })
        const queryResult = await executeQuery(orgId, query, parameters)
        const result = exportResults(queryResult, format)
        return NextResponse.json(result)
      }

      case 'format': {
        const { query, parameters, format } = body
        if (!query || !format) return NextResponse.json({ error: 'query and format are required' }, { status: 400 })
        const queryResult = await executeQuery(orgId, query, parameters)
        const formatted = formatResults(queryResult, format)
        return NextResponse.json({ formatted })
      }

      case 'visualize': {
        const { query, parameters, chartType } = body
        if (!query) return NextResponse.json({ error: 'query is required' }, { status: 400 })
        const queryResult = await executeQuery(orgId, query, parameters)
        const visualization = createVisualization(queryResult, chartType || 'bar')
        return NextResponse.json({ data: queryResult, visualization })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/rql] Error:', error)
    return NextResponse.json({ error: error?.message || 'RQL operation failed' }, { status: 500 })
  }
}
