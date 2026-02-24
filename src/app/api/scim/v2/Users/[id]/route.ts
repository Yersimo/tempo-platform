import { NextRequest, NextResponse } from 'next/server'
import { scimGetUser, scimUpdateUser, scimPatchUser, scimDeleteUser, scimError } from '@/lib/scim'

const SCIM_CONTENT_TYPE = 'application/scim+json'

function getBaseUrl(request: NextRequest): string {
  const proto = request.headers.get('x-forwarded-proto') || 'http'
  const host = request.headers.get('host') || 'localhost:3000'
  return `${proto}://${host}/api`
}

function authenticateSCIM(request: NextRequest): { orgId: string } | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const orgId = request.headers.get('x-org-id')
  if (!orgId) return null
  return { orgId }
}

// GET /api/scim/v2/Users/:id
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  const { id } = await params
  const user = await scimGetUser(auth.orgId, id, getBaseUrl(request))
  if (!user) return NextResponse.json(scimError(404, 'User not found'), { status: 404, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  return NextResponse.json(user, { headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
}

// PUT /api/scim/v2/Users/:id
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  const { id } = await params
  const body = await request.json()
  const user = await scimUpdateUser(auth.orgId, id, body, getBaseUrl(request))
  if (!user) return NextResponse.json(scimError(404, 'User not found'), { status: 404, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  return NextResponse.json(user, { headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
}

// PATCH /api/scim/v2/Users/:id
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  const { id } = await params
  const body = await request.json()
  const user = await scimPatchUser(auth.orgId, id, body, getBaseUrl(request))
  if (!user) return NextResponse.json(scimError(404, 'User not found'), { status: 404, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  return NextResponse.json(user, { headers: { 'Content-Type': SCIM_CONTENT_TYPE } })
}

// DELETE /api/scim/v2/Users/:id
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = authenticateSCIM(request)
  if (!auth) return NextResponse.json(scimError(401, 'Unauthorized'), { status: 401, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  const { id } = await params
  const deleted = await scimDeleteUser(auth.orgId, id)
  if (!deleted) return NextResponse.json(scimError(404, 'User not found'), { status: 404, headers: { 'Content-Type': SCIM_CONTENT_TYPE } })

  return new NextResponse(null, { status: 204 })
}
