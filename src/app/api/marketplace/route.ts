import { NextRequest, NextResponse } from 'next/server'
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

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/marketplace] Error:', error)
    return NextResponse.json({ error: error?.message || 'Marketplace operation failed' }, { status: 500 })
  }
}
