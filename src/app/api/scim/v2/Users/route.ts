import { NextRequest, NextResponse } from 'next/server'
import { scimListUsers, scimCreateUser, scimError } from '@/lib/scim'

const SCIM_CONTENT_TYPE = 'application/scim+json'

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}/api`
}

function authenticateSCIM(request: NextRequest): { orgId: string } | null {
  // SCIM uses Bearer token auth (separate from session cookies)
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null

  const token = auth.slice(7)
  // In production, validate against stored SCIM tokens per org
  // For now, check x-org-id header or decode token
  const orgId = request.headers.get('x-org-id')
  if (!orgId) return null
  return { orgId }
}

// GET /api/scim/v2/Users - List users
export async function GET(request: NextRequest) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  const url = new URL(request.url)
  const startIndex = parseInt(url.searchParams.get('startIndex') || '1')
  const count = parseInt(url.searchParams.get('count') || '100')
  const filter = url.searchParams.get('filter') || undefined

  const result = await scimListUsers(auth.orgId, { startIndex, count, filter }, getBaseUrl(request))
  return NextResponse.json(result, { headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
}

// POST /api/scim/v2/Users - Create user
export async function POST(request: NextRequest) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  try {
    const body = await request.json()
    const user = await scimCreateUser(auth.orgId, body, getBaseUrl(request))
    return NextResponse.json(user, { status: 201, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
  } catch (error: any) {
    if (error?.status === 409) {
      return NextResponse.json(scimError(409, error.detail, error.scimType), { status: 409, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
    }
    return NextResponse.json(scimError(500, 'Failed to create user'), { status: 500, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
  }
}
