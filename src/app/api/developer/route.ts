import { NextRequest, NextResponse } from 'next/server'
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  registerWebhookEndpoint,
  listWebhookEndpoints,
  deleteWebhookEndpoint,
  testWebhookEndpoint,
  registerOAuthApp,
  listOAuthApps,
  revokeOAuthApp,
  getRateLimitStatus,
  getApiUsageStats,
  getSDKConfig,
  SDK_LANGUAGES,
} from '@/lib/developer-portal'

// GET /api/developer - Keys, webhooks, OAuth apps, usage, SDK config
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'sdk-config'

    switch (action) {
      case 'keys': {
        const keys = await listApiKeys(orgId)
        return NextResponse.json({ keys })
      }

      case 'webhooks': {
        const endpoints = await listWebhookEndpoints(orgId)
        return NextResponse.json({ endpoints })
      }

      case 'oauth-apps': {
        const apps = await listOAuthApps(orgId)
        return NextResponse.json({ apps })
      }

      case 'usage': {
        const period = url.searchParams.get('period') as any
        const stats = await getApiUsageStats(orgId, period || undefined)
        return NextResponse.json(stats)
      }

      case 'rate-limit': {
        const keyId = url.searchParams.get('keyId')
        if (!keyId) return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
        const status = await getRateLimitStatus(keyId)
        return NextResponse.json(status)
      }

      case 'sdk-config': {
        const config = await getSDKConfig(orgId)
        return NextResponse.json(config)
      }

      case 'sdk-languages': {
        return NextResponse.json({ languages: SDK_LANGUAGES })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/developer] Error:', error)
    return NextResponse.json({ error: 'Developer portal query failed' }, { status: 500 })
  }
}

// POST /api/developer - Create keys, register webhooks/OAuth, test
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-key': {
        const { name, scopes, expiresIn } = body
        if (!name || !scopes?.length) {
          return NextResponse.json({ error: 'name and scopes are required' }, { status: 400 })
        }
        const result = await createApiKey(orgId, name, scopes, expiresIn)
        return NextResponse.json(result)
      }

      case 'revoke-key': {
        const { keyId } = body
        if (!keyId) return NextResponse.json({ error: 'keyId is required' }, { status: 400 })
        const result = await revokeApiKey(orgId, keyId)
        return NextResponse.json(result)
      }

      case 'register-webhook': {
        const { url, events, secret } = body
        if (!url || !events?.length) {
          return NextResponse.json({ error: 'url and events are required' }, { status: 400 })
        }
        const result = await registerWebhookEndpoint(orgId, url, events, secret)
        return NextResponse.json(result)
      }

      case 'delete-webhook': {
        const { endpointId } = body
        if (!endpointId) return NextResponse.json({ error: 'endpointId is required' }, { status: 400 })
        const result = await deleteWebhookEndpoint(orgId, endpointId)
        return NextResponse.json(result)
      }

      case 'test-webhook': {
        const { endpointId } = body
        if (!endpointId) return NextResponse.json({ error: 'endpointId is required' }, { status: 400 })
        const result = await testWebhookEndpoint(orgId, endpointId)
        return NextResponse.json(result)
      }

      case 'register-oauth': {
        const { appName, redirectUris, scopes } = body
        if (!appName || !redirectUris?.length || !scopes?.length) {
          return NextResponse.json({ error: 'appName, redirectUris, and scopes are required' }, { status: 400 })
        }
        const result = await registerOAuthApp(orgId, appName, redirectUris, scopes)
        return NextResponse.json(result)
      }

      case 'revoke-oauth': {
        const { appId } = body
        if (!appId) return NextResponse.json({ error: 'appId is required' }, { status: 400 })
        const result = await revokeOAuthApp(orgId, appId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/developer] Error:', error)
    return NextResponse.json({ error: error?.message || 'Developer portal operation failed' }, { status: 500 })
  }
}
