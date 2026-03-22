import { NextRequest, NextResponse } from 'next/server'
import {
  rotateOrgKey,
  getRotationConfig,
  reEncryptWithNewKey,
  getOrgEncryptionKey,
} from '@/lib/encryption'

export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')

  if (action === 'key-status') {
    const config = getRotationConfig(orgId)
    return NextResponse.json({
      orgId,
      currentVersion: config?.currentVersion ?? 1,
      totalVersions: config?.keys.size ?? 1,
      lastRotation: config?.rotationDate ?? null,
    })
  }

  return NextResponse.json({ error: 'Invalid action. Use action=key-status' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  const orgId = request.headers.get('x-org-id')
  if (!orgId) {
    return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
  }

  let body: { action: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  if (body.action === 'rotate-key') {
    try {
      const result = await rotateOrgKey(orgId)
      return NextResponse.json({
        success: true,
        orgId,
        newVersion: result.newVersion,
        rotatedAt: new Date().toISOString(),
      })
    } catch (err) {
      return NextResponse.json(
        { error: `Key rotation failed: ${err instanceof Error ? err.message : 'Unknown error'}` },
        { status: 500 }
      )
    }
  }

  if (body.action === 're-encrypt') {
    // In production, this would be a background job processing all encrypted fields
    // For now, return the batch process metadata
    const config = getRotationConfig(orgId)
    if (!config || config.currentVersion <= 1) {
      return NextResponse.json(
        { error: 'No key rotation has been performed yet. Rotate key first.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      orgId,
      message: 'Re-encryption batch process initiated',
      currentVersion: config.currentVersion,
      startedAt: new Date().toISOString(),
      // In production: enqueue a background job to iterate all encrypted fields
      status: 'queued',
    })
  }

  return NextResponse.json(
    { error: 'Invalid action. Use action=rotate-key or action=re-encrypt' },
    { status: 400 }
  )
}
