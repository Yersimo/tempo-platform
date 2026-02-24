import { NextRequest, NextResponse } from 'next/server'
import { generateOpenApiSpec, getApiExplorerData, resolveApiVersion, API_VERSIONS } from '@/lib/api-versioning'

// GET /api/docs/v2 - Interactive API documentation
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const format = url.searchParams.get('format') || 'explorer'

    switch (format) {
      case 'openapi': {
        const spec = generateOpenApiSpec()
        return NextResponse.json(spec, {
          headers: { 'Content-Type': 'application/json' },
        })
      }

      case 'explorer': {
        const data = getApiExplorerData()
        return NextResponse.json(data)
      }

      case 'versions': {
        const requestedVersion = url.searchParams.get('version') || undefined
        const resolved = resolveApiVersion(requestedVersion)
        return NextResponse.json({
          resolved: resolved.version,
          warnings: resolved.warnings,
          allVersions: API_VERSIONS,
        })
      }

      default:
        return NextResponse.json({ error: `Unknown format: ${format}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/docs/v2] Error:', error)
    return NextResponse.json({ error: 'Documentation generation failed' }, { status: 500 })
  }
}
