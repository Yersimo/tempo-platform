import { NextRequest, NextResponse } from 'next/server'
import { scanCompliance, generateHandbook, generateEEOReport, getApplicableRules } from '@/lib/compliance'

// GET /api/compliance - Compliance scan results
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'scan'

    switch (action) {
      case 'scan': {
        const result = await scanCompliance(orgId)
        return NextResponse.json(result)
      }

      case 'rules': {
        const countries = url.searchParams.get('countries')?.split(',') || []
        const rules = getApplicableRules(countries)
        return NextResponse.json({ rules, total: rules.length })
      }

      case 'eeo': {
        const report = await generateEEOReport(orgId)
        return NextResponse.json(report)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/compliance] Error:', error)
    return NextResponse.json({ error: 'Compliance check failed' }, { status: 500 })
  }
}

// POST /api/compliance - Generate handbook
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    if (action === 'handbook') {
      const { countries, orgName } = body
      if (!countries?.length || !orgName) {
        return NextResponse.json({ error: 'countries and orgName are required' }, { status: 400 })
      }
      const sections = generateHandbook(countries, orgName)
      return NextResponse.json({ sections, total: sections.length })
    }

    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
  } catch (error) {
    console.error('[POST /api/compliance] Error:', error)
    return NextResponse.json({ error: 'Compliance operation failed' }, { status: 500 })
  }
}
