import { NextRequest, NextResponse } from 'next/server'
import {
  addCustomDomain,
  verifyDomain,
  removeDomain,
  getDomains,
  getVerificationInstructions,
  checkDomainStatus,
} from '@/lib/academy-domains'

// GET /api/academy/domains?action=...
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'
    const academyId = url.searchParams.get('academyId') || ''
    const domainId = url.searchParams.get('domainId') || ''

    switch (action) {
      case 'list': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const domains = await getDomains(orgId, academyId)
        return NextResponse.json({ data: domains })
      }

      case 'check-status': {
        if (!domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 })
        const domain = await checkDomainStatus(orgId, domainId)
        return NextResponse.json({ data: domain })
      }

      case 'verification-instructions': {
        if (!domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 })
        const instructions = await getVerificationInstructions(orgId, domainId)
        return NextResponse.json({ data: instructions })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy Domains GET]', error)
    const status = error.message?.includes('not found') ? 404 : 500
    return NextResponse.json({ error: error.message || 'Internal error' }, { status })
  }
}

// POST /api/academy/domains
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'add-domain': {
        if (!data.academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        if (!data.domain) return NextResponse.json({ error: 'domain required' }, { status: 400 })
        const domain = await addCustomDomain(orgId, data.academyId, data.domain, data.method)
        return NextResponse.json({ data: domain }, { status: 201 })
      }

      case 'verify-domain': {
        if (!data.domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 })
        const domain = await verifyDomain(orgId, data.domainId)
        return NextResponse.json({ data: domain })
      }

      case 'remove-domain': {
        if (!data.domainId) return NextResponse.json({ error: 'domainId required' }, { status: 400 })
        const domain = await removeDomain(orgId, data.domainId)
        return NextResponse.json({ data: domain })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy Domains POST]', error)
    const message = error.message || 'Internal error'
    let status = 500
    if (message.includes('not found')) status = 404
    else if (message.includes('already registered') || message.includes('Maximum of')) status = 409
    else if (message.includes('Invalid') || message.includes('Cannot use') || message.includes('required')) status = 400
    return NextResponse.json({ error: message }, { status })
  }
}
