import { NextRequest, NextResponse } from 'next/server'
import { randomBytes, createHash } from 'crypto'
import {
  getMarketplaceApps,
  getAppDetails,
  installApp,
  uninstallApp,
  getInstalledApps,
  updateAppConfig,
  submitReview,
  getAppReviews,
  syncAppData,
  getSyncHistory,
  getMarketplaceStats,
  getCategories,
} from '@/lib/marketplace'

// ---------------------------------------------------------------------------
// In-memory stores for API keys, webhooks, and health data
// In production these would be backed by the DB tables
// ---------------------------------------------------------------------------

interface StoredApiKey {
  id: string
  orgId: string
  name: string
  keyHash: string
  keyPrefix: string
  scopes: string[]
  lastUsedAt: string | null
  expiresAt: string | null
  isActive: boolean
  createdBy: string
  createdAt: string
}

interface StoredWebhook {
  id: string
  orgId: string
  url: string
  secret: string
  events: string[]
  isActive: boolean
  lastDeliveryAt: string | null
  failureCount: number
  createdAt: string
}

interface HealthEntry {
  integrationSlug: string
  status: 'healthy' | 'degraded' | 'down'
  lastCheck: string
  errorCount: number
  successRate: number
  avgResponseTime: number
  recentErrors: Array<{ timestamp: string; message: string; code: string }>
}

const apiKeysStore: StoredApiKey[] = []
const webhooksStore: StoredWebhook[] = []

function generateApiKey(): string {
  return 'tempo_' + randomBytes(24).toString('hex')
}

function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

function generateId(): string {
  return 'id-' + randomBytes(8).toString('hex')
}

// Demo health data for installed integrations
function getHealthData(orgId: string): HealthEntry[] {
  const installed = getInstalledApps(orgId)
  return installed.map((inst) => {
    const isHealthy = inst.status === 'active'
    return {
      integrationSlug: inst.appId,
      status: isHealthy ? 'healthy' as const : inst.status === 'error' ? 'down' as const : 'degraded' as const,
      lastCheck: new Date(Date.now() - Math.random() * 300000).toISOString(),
      errorCount: isHealthy ? 0 : Math.floor(Math.random() * 10),
      successRate: isHealthy ? 99.5 + Math.random() * 0.5 : 75 + Math.random() * 20,
      avgResponseTime: Math.floor(50 + Math.random() * 200),
      recentErrors: isHealthy ? [] : [
        { timestamp: new Date(Date.now() - 60000).toISOString(), message: 'Connection timeout', code: 'TIMEOUT' },
        { timestamp: new Date(Date.now() - 120000).toISOString(), message: 'Rate limit exceeded', code: 'RATE_LIMIT' },
      ],
    }
  })
}

// Demo API usage analytics
function getApiUsageAnalytics(orgId: string) {
  return {
    totalCalls: Math.floor(Math.random() * 50000) + 10000,
    callsToday: Math.floor(Math.random() * 500) + 100,
    callsThisWeek: Math.floor(Math.random() * 3000) + 500,
    callsThisMonth: Math.floor(Math.random() * 12000) + 2000,
    rateLimit: { limit: 10000, remaining: Math.floor(Math.random() * 8000) + 1000, resetAt: new Date(Date.now() + 3600000).toISOString() },
    topEndpoints: [
      { path: '/api/v1/employees', calls: Math.floor(Math.random() * 5000) + 1000, avgLatency: 45 },
      { path: '/api/v1/payroll', calls: Math.floor(Math.random() * 3000) + 500, avgLatency: 120 },
      { path: '/api/v1/leave-requests', calls: Math.floor(Math.random() * 2000) + 300, avgLatency: 65 },
      { path: '/api/v1/departments', calls: Math.floor(Math.random() * 1000) + 100, avgLatency: 30 },
    ],
    errorRate: (Math.random() * 2).toFixed(2),
  }
}

// GET /api/marketplace - Browse apps, get details, installed, stats
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'apps'

    switch (action) {
      case 'apps': {
        const category = url.searchParams.get('category') || undefined
        const search = url.searchParams.get('search') || undefined
        const pricing = url.searchParams.get('pricing') || undefined
        const result = await getMarketplaceApps({
          category: category as any,
          search,
          pricing: pricing as any,
        })
        return NextResponse.json(result)
      }

      case 'categories': {
        const result = await getCategories()
        return NextResponse.json({ categories: result })
      }

      case 'details': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await getAppDetails(appId)
        if (!result) return NextResponse.json({ error: 'App not found' }, { status: 404 })
        return NextResponse.json(result)
      }

      case 'installed': {
        const result = await getInstalledApps(orgId)
        return NextResponse.json({ apps: result })
      }

      case 'reviews': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await getAppReviews(appId)
        return NextResponse.json(result)
      }

      case 'sync-history': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await getSyncHistory(orgId, appId)
        return NextResponse.json(result)
      }

      case 'stats': {
        const result = await getMarketplaceStats(orgId)
        return NextResponse.json(result)
      }

      case 'api-keys': {
        const keys = apiKeysStore.filter((k) => k.orgId === orgId)
        return NextResponse.json({ keys })
      }

      case 'webhooks': {
        const hooks = webhooksStore.filter((w) => w.orgId === orgId)
        return NextResponse.json({ webhooks: hooks })
      }

      case 'health': {
        const health = getHealthData(orgId)
        return NextResponse.json({ health })
      }

      case 'api-usage': {
        const usage = getApiUsageAnalytics(orgId)
        return NextResponse.json(usage)
      }

      case 'config': {
        const appId = url.searchParams.get('appId')
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const installed = getInstalledApps(orgId)
        const inst = installed.find((i) => i.appId === appId)
        if (!inst) return NextResponse.json({ error: 'Integration not installed' }, { status: 404 })
        return NextResponse.json({ config: inst.config, status: inst.status, lastSyncAt: inst.lastSyncAt })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/marketplace] Error:', error)
    return NextResponse.json({ error: 'Marketplace query failed' }, { status: 500 })
  }
}

// POST /api/marketplace - Install, uninstall, review, sync, configure
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'install': {
        const { appId, config } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await installApp(orgId, appId, config)
        return NextResponse.json(result)
      }

      case 'uninstall': {
        const { appId } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await uninstallApp(orgId, appId)
        return NextResponse.json(result)
      }

      case 'configure': {
        const { appId, config } = body
        if (!appId || !config) {
          return NextResponse.json({ error: 'appId and config are required' }, { status: 400 })
        }
        const result = await updateAppConfig(orgId, appId, config)
        return NextResponse.json(result)
      }

      case 'review': {
        const { appId, rating, review } = body
        if (!appId || !rating || !review) {
          return NextResponse.json({ error: 'appId, rating, and review are required' }, { status: 400 })
        }
        const result = await submitReview(orgId, appId, rating, review)
        return NextResponse.json(result)
      }

      case 'sync': {
        const { appId } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await syncAppData(orgId, appId)
        return NextResponse.json(result)
      }

      case 'create-api-key': {
        const { name, scopes, expiresAt } = body
        if (!name) return NextResponse.json({ error: 'name is required' }, { status: 400 })
        const rawKey = generateApiKey()
        const newKey: StoredApiKey = {
          id: generateId(),
          orgId,
          name,
          keyHash: hashApiKey(rawKey),
          keyPrefix: rawKey.substring(0, 12),
          scopes: scopes || ['employees:read'],
          lastUsedAt: null,
          expiresAt: expiresAt || null,
          isActive: true,
          createdBy: body.createdBy || 'system',
          createdAt: new Date().toISOString(),
        }
        apiKeysStore.push(newKey)
        // Return the raw key only on creation (never again)
        return NextResponse.json({ key: { ...newKey, rawKey }, success: true })
      }

      case 'revoke-api-key': {
        const { keyId } = body
        if (!keyId) return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
        const keyIdx = apiKeysStore.findIndex((k) => k.id === keyId && k.orgId === orgId)
        if (keyIdx === -1) return NextResponse.json({ error: 'API key not found' }, { status: 404 })
        apiKeysStore[keyIdx].isActive = false
        return NextResponse.json({ success: true })
      }

      case 'create-webhook': {
        const { url, events } = body
        if (!url || !events) return NextResponse.json({ error: 'url and events are required' }, { status: 400 })
        const secret = 'whsec_' + randomBytes(16).toString('hex')
        const newWebhook: StoredWebhook = {
          id: generateId(),
          orgId,
          url,
          secret,
          events: events || [],
          isActive: true,
          lastDeliveryAt: null,
          failureCount: 0,
          createdAt: new Date().toISOString(),
        }
        webhooksStore.push(newWebhook)
        return NextResponse.json({ webhook: newWebhook, success: true })
      }

      case 'delete-webhook': {
        const { webhookId } = body
        if (!webhookId) return NextResponse.json({ error: 'webhookId is required' }, { status: 400 })
        const idx = webhooksStore.findIndex((w) => w.id === webhookId && w.orgId === orgId)
        if (idx === -1) return NextResponse.json({ error: 'Webhook not found' }, { status: 404 })
        webhooksStore.splice(idx, 1)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/marketplace] Error:', error)
    return NextResponse.json({ error: error?.message || 'Marketplace operation failed' }, { status: 500 })
  }
}
