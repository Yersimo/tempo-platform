import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { INTEGRATION_CATALOG, getConnector } from '@/lib/integrations'
import { activeDirectoryConnector } from '@/lib/integrations/active-directory'
import { googleWorkspaceConnector } from '@/lib/integrations/google-workspace'
import { payrollApiConnector } from '@/lib/integrations/payroll-api'
import { registerConnector } from '@/lib/integrations'

// Register all connectors on module load
registerConnector(activeDirectoryConnector)
registerConnector(googleWorkspaceConnector)
registerConnector(payrollApiConnector)

// ---------------------------------------------------------------------------
// POST /api/integrations - Integration management
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')
    const employeeRole = request.headers.get('x-employee-role')

    if (!orgId || !employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only owners and admins can manage integrations
    if (employeeRole !== 'owner' && employeeRole !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: admin or owner role required' }, { status: 403 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'list':
        return handleList(orgId)
      case 'connect':
        return handleConnect(orgId, employeeId, body)
      case 'disconnect':
        return handleDisconnect(orgId, body)
      case 'sync':
        return handleSync(orgId, body)
      case 'test':
        return handleTest(body)
      case 'logs':
        return handleLogs(orgId, body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('Integration API error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// List all available + connected integrations
async function handleList(orgId: string) {
  const connected = await db
    .select()
    .from(schema.integrations)
    .where(eq(schema.integrations.orgId, orgId))

  const connectedMap = new Map(connected.map(c => [c.provider, c]))

  const catalog = INTEGRATION_CATALOG.map(item => {
    const conn = connectedMap.get(item.id)
    return {
      ...item,
      connected: !!conn,
      connectionId: conn?.id || null,
      connectionStatus: conn?.status || 'disconnected',
      lastSyncAt: conn?.lastSyncAt || null,
      lastSyncStatus: conn?.lastSyncStatus || null,
      syncDirection: conn?.syncDirection || 'inbound',
      syncFrequencyMinutes: conn?.syncFrequencyMinutes || 60,
    }
  })

  return NextResponse.json({ integrations: catalog, connected })
}

// Connect an integration
async function handleConnect(
  orgId: string,
  employeeId: string,
  body: { provider: string; config: Record<string, string> }
) {
  const { provider, config } = body
  if (!provider || !config) {
    return NextResponse.json({ error: 'Missing provider or config' }, { status: 400 })
  }

  const connector = getConnector(provider)
  if (!connector) {
    return NextResponse.json({ error: `Unknown connector: ${provider}` }, { status: 400 })
  }

  // Test connection first
  const result = await connector.connect(config)
  if (!result.success) {
    return NextResponse.json({ error: result.error || 'Connection failed' }, { status: 400 })
  }

  // Check if already connected
  const existing = await db
    .select()
    .from(schema.integrations)
    .where(and(
      eq(schema.integrations.orgId, orgId),
      eq(schema.integrations.provider, provider)
    ))

  let integrationId: string

  if (existing.length > 0) {
    // Update existing
    await db
      .update(schema.integrations)
      .set({
        status: 'connected',
        config: config as unknown as Record<string, unknown>,
        credentials: { encrypted: true } as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(schema.integrations.id, existing[0].id))
    integrationId = existing[0].id
  } else {
    // Create new
    const catalogItem = INTEGRATION_CATALOG.find(c => c.id === provider)
    const [newIntegration] = await db
      .insert(schema.integrations)
      .values({
        orgId,
        provider,
        name: catalogItem?.name || provider,
        status: 'connected',
        config: config as unknown as Record<string, unknown>,
        credentials: { encrypted: true } as unknown as Record<string, unknown>,
        syncDirection: 'inbound',
        createdBy: employeeId,
      })
      .returning()
    integrationId = newIntegration.id
  }

  // Log the connection
  await db.insert(schema.integrationLogs).values({
    integrationId,
    orgId,
    action: 'connect',
    status: 'success',
    details: `Connected to ${connector.name}`,
  })

  return NextResponse.json({
    success: true,
    integrationId,
    metadata: result.metadata,
  })
}

// Disconnect an integration
async function handleDisconnect(orgId: string, body: { integrationId: string }) {
  const { integrationId } = body
  if (!integrationId) {
    return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 })
  }

  const [integration] = await db
    .select()
    .from(schema.integrations)
    .where(and(
      eq(schema.integrations.id, integrationId),
      eq(schema.integrations.orgId, orgId)
    ))

  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  const connector = getConnector(integration.provider)
  if (connector) {
    await connector.disconnect(integrationId)
  }

  await db
    .update(schema.integrations)
    .set({
      status: 'disconnected',
      credentials: null,
      updatedAt: new Date(),
    })
    .where(eq(schema.integrations.id, integrationId))

  // Log disconnection
  await db.insert(schema.integrationLogs).values({
    integrationId,
    orgId,
    action: 'disconnect',
    status: 'success',
    details: `Disconnected from ${integration.name}`,
  })

  return NextResponse.json({ success: true })
}

// Trigger a sync
async function handleSync(orgId: string, body: { integrationId: string; direction?: string }) {
  const { integrationId, direction = 'inbound' } = body
  if (!integrationId) {
    return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 })
  }

  const [integration] = await db
    .select()
    .from(schema.integrations)
    .where(and(
      eq(schema.integrations.id, integrationId),
      eq(schema.integrations.orgId, orgId)
    ))

  if (!integration) {
    return NextResponse.json({ error: 'Integration not found' }, { status: 404 })
  }

  if (integration.status !== 'connected') {
    return NextResponse.json({ error: 'Integration is not connected' }, { status: 400 })
  }

  // Mark as syncing
  await db
    .update(schema.integrations)
    .set({ status: 'syncing', updatedAt: new Date() })
    .where(eq(schema.integrations.id, integrationId))

  const connector = getConnector(integration.provider)
  if (!connector) {
    return NextResponse.json({ error: 'Connector not found' }, { status: 400 })
  }

  const syncDir = direction as 'inbound' | 'outbound'
  const result = await connector.sync(integrationId, syncDir)

  // Update integration with sync results
  await db
    .update(schema.integrations)
    .set({
      status: result.success ? 'connected' : 'error',
      lastSyncAt: new Date(),
      lastSyncStatus: result.success ? 'success' : 'error',
      lastSyncDetails: result.errors.length > 0 ? result.errors.join('; ') : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.integrations.id, integrationId))

  // Log the sync
  await db.insert(schema.integrationLogs).values({
    integrationId,
    orgId,
    action: 'sync',
    status: result.success ? 'success' : 'error',
    recordsProcessed: result.recordsProcessed,
    recordsFailed: result.recordsFailed,
    details: `Sync ${syncDir}: ${result.recordsProcessed} processed, ${result.recordsFailed} failed`,
    errorMessage: result.errors.length > 0 ? result.errors.join('; ') : null,
    duration: result.duration,
  })

  return NextResponse.json({ success: result.success, result })
}

// Test connection without saving
async function handleTest(body: { provider: string; config: Record<string, string> }) {
  const { provider, config } = body
  if (!provider || !config) {
    return NextResponse.json({ error: 'Missing provider or config' }, { status: 400 })
  }

  const connector = getConnector(provider)
  if (!connector) {
    return NextResponse.json({ error: `Unknown connector: ${provider}` }, { status: 400 })
  }

  const success = await connector.testConnection(config)
  return NextResponse.json({ success })
}

// Get sync logs for an integration
async function handleLogs(orgId: string, body: { integrationId: string; limit?: number }) {
  const { integrationId, limit = 20 } = body
  if (!integrationId) {
    return NextResponse.json({ error: 'Missing integrationId' }, { status: 400 })
  }

  const logs = await db
    .select()
    .from(schema.integrationLogs)
    .where(and(
      eq(schema.integrationLogs.integrationId, integrationId),
      eq(schema.integrationLogs.orgId, orgId)
    ))
    .orderBy(desc(schema.integrationLogs.createdAt))
    .limit(limit)

  return NextResponse.json({ logs })
}
