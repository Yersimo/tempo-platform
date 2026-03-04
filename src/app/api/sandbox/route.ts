import { NextRequest, NextResponse } from 'next/server'
import {
  createSandbox,
  provisionSandbox,
  pauseSandbox,
  resumeSandbox,
  deleteSandbox,
  createSnapshot,
  restoreSnapshot,
  resetSandboxData,
  getSandboxStatus,
  cloneSandboxFromProduction,
  listSandboxes,
  checkExpiredSandboxes,
} from '@/lib/services/sandbox-service'

// GET /api/sandbox - List sandboxes, get status, check expirations
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const status = url.searchParams.get('status') as any
        const result = await listSandboxes(orgId, status ? { status } : undefined)
        return NextResponse.json(result)
      }

      case 'status': {
        const sandboxId = url.searchParams.get('sandboxId')
        if (!sandboxId) {
          return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 })
        }
        const result = await getSandboxStatus(orgId, sandboxId)
        return NextResponse.json(result)
      }

      case 'check-expired': {
        const result = await checkExpiredSandboxes(orgId)
        return NextResponse.json(result)
      }

      case 'snapshots': {
        const sandboxId = url.searchParams.get('sandboxId')
        if (!sandboxId) {
          return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, desc } = await import('drizzle-orm')

        const snapshots = await db.select()
          .from(schema.sandboxSnapshots)
          .where(eq(schema.sandboxSnapshots.sandboxId, sandboxId))
          .orderBy(desc(schema.sandboxSnapshots.createdAt))

        return NextResponse.json({ snapshots, total: snapshots.length })
      }

      case 'access-log': {
        const sandboxId = url.searchParams.get('sandboxId')
        if (!sandboxId) {
          return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 })
        }

        const { db } = await import('@/lib/db')
        const { schema } = await import('@/lib/db')
        const { eq, desc } = await import('drizzle-orm')

        const limit = parseInt(url.searchParams.get('limit') || '50')
        const logs = await db.select()
          .from(schema.sandboxAccessLog)
          .where(eq(schema.sandboxAccessLog.sandboxId, sandboxId))
          .orderBy(desc(schema.sandboxAccessLog.timestamp))
          .limit(limit)

        return NextResponse.json({ logs, total: logs.length })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/sandbox] Error:', error)
    const message = error instanceof Error ? error.message : 'Sandbox operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/sandbox - Create, provision, pause, resume, snapshot, restore, reset, clone
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { name, description, modules, dataMaskingConfig, expiresInDays, maxStorageMb, createdBy } = body
        if (!name || !createdBy) {
          return NextResponse.json({ error: 'name and createdBy are required' }, { status: 400 })
        }
        const result = await createSandbox(orgId, createdBy, {
          name,
          description,
          modules,
          dataMaskingConfig,
          expiresInDays,
          maxStorageMb,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'provision': {
        const { sandboxId } = body
        if (!sandboxId) {
          return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 })
        }
        const result = await provisionSandbox(orgId, sandboxId)
        return NextResponse.json(result)
      }

      case 'pause': {
        const { sandboxId, pausedBy } = body
        if (!sandboxId || !pausedBy) {
          return NextResponse.json({ error: 'sandboxId and pausedBy are required' }, { status: 400 })
        }
        const result = await pauseSandbox(orgId, sandboxId, pausedBy)
        return NextResponse.json(result)
      }

      case 'resume': {
        const { sandboxId, resumedBy } = body
        if (!sandboxId || !resumedBy) {
          return NextResponse.json({ error: 'sandboxId and resumedBy are required' }, { status: 400 })
        }
        const result = await resumeSandbox(orgId, sandboxId, resumedBy)
        return NextResponse.json(result)
      }

      case 'create-snapshot': {
        const { sandboxId, createdBy, name, description } = body
        if (!sandboxId || !createdBy || !name) {
          return NextResponse.json({ error: 'sandboxId, createdBy, and name are required' }, { status: 400 })
        }
        const result = await createSnapshot(orgId, sandboxId, createdBy, name, description)
        return NextResponse.json(result, { status: 201 })
      }

      case 'restore-snapshot': {
        const { sandboxId, snapshotId, restoredBy } = body
        if (!sandboxId || !snapshotId || !restoredBy) {
          return NextResponse.json(
            { error: 'sandboxId, snapshotId, and restoredBy are required' },
            { status: 400 }
          )
        }
        const result = await restoreSnapshot(orgId, sandboxId, snapshotId, restoredBy)
        return NextResponse.json(result)
      }

      case 'reset': {
        const { sandboxId, resetBy } = body
        if (!sandboxId || !resetBy) {
          return NextResponse.json({ error: 'sandboxId and resetBy are required' }, { status: 400 })
        }
        const result = await resetSandboxData(orgId, sandboxId, resetBy)
        return NextResponse.json(result)
      }

      case 'clone-production': {
        const { createdBy, name, description, modules, dataMaskingConfig, expiresInDays, includeCustomFields, includeWorkflows, includeIntegrations } = body
        if (!createdBy || !name) {
          return NextResponse.json({ error: 'createdBy and name are required' }, { status: 400 })
        }
        const result = await cloneSandboxFromProduction(orgId, createdBy, {
          name,
          description,
          modules,
          dataMaskingConfig,
          expiresInDays,
          includeCustomFields,
          includeWorkflows,
          includeIntegrations,
        })
        return NextResponse.json(result, { status: 201 })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/sandbox] Error:', error)
    const message = error instanceof Error ? error.message : 'Sandbox operation failed'
    const status = error instanceof Error && 'code' in error ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/sandbox - Update sandbox settings
export async function PUT(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { sandboxId, name, description, expiresAt, maxStorageMb, dataMaskingConfig } = body

    if (!sandboxId) {
      return NextResponse.json({ error: 'sandboxId is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    const { schema } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updates.name = name
    if (description !== undefined) updates.description = description
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null
    if (maxStorageMb !== undefined) updates.maxStorageMb = maxStorageMb
    if (dataMaskingConfig !== undefined) updates.dataMaskingConfig = dataMaskingConfig

    const result = await db.update(schema.sandboxEnvironments)
      .set(updates)
      .where(and(
        eq(schema.sandboxEnvironments.id, sandboxId),
        eq(schema.sandboxEnvironments.orgId, orgId)
      ))
      .returning()

    if (!result.length) {
      return NextResponse.json({ error: 'Sandbox not found' }, { status: 404 })
    }

    return NextResponse.json({ sandbox: result[0] })
  } catch (error) {
    console.error('[PUT /api/sandbox] Error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/sandbox - Delete a sandbox or snapshot
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const sandboxId = url.searchParams.get('sandboxId')
    const snapshotId = url.searchParams.get('snapshotId')
    const deletedBy = url.searchParams.get('deletedBy')

    if (snapshotId) {
      // Delete a specific snapshot
      const { db } = await import('@/lib/db')
      const { schema } = await import('@/lib/db')
      const { eq, and } = await import('drizzle-orm')

      const snapshots = await db.select()
        .from(schema.sandboxSnapshots)
        .where(and(
          eq(schema.sandboxSnapshots.id, snapshotId),
          eq(schema.sandboxSnapshots.orgId, orgId)
        ))

      if (!snapshots.length) {
        return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 })
      }

      if (snapshots[0].status === 'restoring') {
        return NextResponse.json(
          { error: 'Cannot delete a snapshot while it is being restored' },
          { status: 400 }
        )
      }

      await db.delete(schema.sandboxSnapshots).where(eq(schema.sandboxSnapshots.id, snapshotId))
      return NextResponse.json({ deleted: true, snapshotId })
    }

    if (sandboxId) {
      if (!deletedBy) {
        return NextResponse.json({ error: 'deletedBy is required' }, { status: 400 })
      }
      const result = await deleteSandbox(orgId, sandboxId, deletedBy)
      return NextResponse.json(result)
    }

    return NextResponse.json({ error: 'sandboxId or snapshotId is required' }, { status: 400 })
  } catch (error) {
    console.error('[DELETE /api/sandbox] Error:', error)
    const message = error instanceof Error ? error.message : 'Delete failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
