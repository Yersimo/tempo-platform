import { NextRequest, NextResponse } from 'next/server'
import {
  connectCarrier,
  disconnectCarrier,
  syncEnrollments,
  generateEDI834Feed,
  sendFeed,
  checkFeedStatus,
  getCarrierSyncHistory,
  reconcileEnrollments,
  resolveDiscrepancy,
  getFeedErrors,
  getCarrierDashboard,
  scheduleSyncJobs,
  testConnection,
  validateFeedData,
  getCarrierContacts,
  generateReconciliationReport,
  auditCarrierData,
} from '@/lib/services/carrier-integration'

// GET /api/carrier-integrations - Dashboard, feed status, sync history, contacts, audit
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'dashboard'

    switch (action) {
      case 'dashboard': {
        const result = await getCarrierDashboard(orgId)
        return NextResponse.json(result)
      }

      case 'feed-status': {
        const feedId = url.searchParams.get('feedId')
        if (!feedId) {
          return NextResponse.json({ error: 'feedId is required' }, { status: 400 })
        }
        const result = await checkFeedStatus(orgId, feedId)
        return NextResponse.json(result)
      }

      case 'feed-errors': {
        const feedId = url.searchParams.get('feedId')
        if (!feedId) {
          return NextResponse.json({ error: 'feedId is required' }, { status: 400 })
        }
        const result = await getFeedErrors(orgId, feedId)
        return NextResponse.json({ errors: result, total: result.length })
      }

      case 'sync-history': {
        const carrierId = url.searchParams.get('carrierId')
        const limit = parseInt(url.searchParams.get('limit') || '20')
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await getCarrierSyncHistory(orgId, carrierId, limit)
        return NextResponse.json({ history: result, total: result.length })
      }

      case 'contacts': {
        const carrierId = url.searchParams.get('carrierId')
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await getCarrierContacts(orgId, carrierId)
        return NextResponse.json(result)
      }

      case 'validate': {
        const carrierId = url.searchParams.get('carrierId')
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await validateFeedData(orgId, carrierId)
        return NextResponse.json(result)
      }

      case 'reconciliation': {
        const carrierId = url.searchParams.get('carrierId')
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await generateReconciliationReport(orgId, carrierId)
        return NextResponse.json(result)
      }

      case 'audit': {
        const carrierId = url.searchParams.get('carrierId')
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await auditCarrierData(orgId, carrierId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('[GET /api/carrier-integrations] Error:', error)
    const message = error instanceof Error ? error.message : 'Carrier integration query failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/carrier-integrations - Connect, sync, generate feeds, reconcile
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'connect': {
        const {
          carrierName, carrierId, connectionType,
          planIds, config, contactEmail, contactPhone,
        } = body
        if (!carrierName || !connectionType) {
          return NextResponse.json(
            { error: 'carrierName and connectionType are required' },
            { status: 400 }
          )
        }
        const result = await connectCarrier({
          orgId, carrierName, carrierId, connectionType,
          planIds, config, contactEmail, contactPhone,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'disconnect': {
        const { carrierId } = body
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await disconnectCarrier(orgId, carrierId)
        return NextResponse.json(result)
      }

      case 'test-connection': {
        const { carrierId } = body
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await testConnection(orgId, carrierId)
        return NextResponse.json(result)
      }

      case 'sync': {
        const { carrierId, feedType } = body
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await syncEnrollments(orgId, carrierId, feedType || 'changes_only')
        return NextResponse.json(result)
      }

      case 'generate-feed': {
        const { carrierId, feedType, sinceDate } = body
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await generateEDI834Feed(orgId, carrierId, feedType || 'full', sinceDate)
        return NextResponse.json(result)
      }

      case 'send-feed': {
        const { feedId } = body
        if (!feedId) {
          return NextResponse.json({ error: 'feedId is required' }, { status: 400 })
        }
        const result = await sendFeed(orgId, feedId)
        return NextResponse.json(result)
      }

      case 'reconcile': {
        const { carrierId, carrierData } = body
        if (!carrierId) {
          return NextResponse.json({ error: 'carrierId is required' }, { status: 400 })
        }
        const result = await reconcileEnrollments(orgId, carrierId, carrierData)
        return NextResponse.json(result)
      }

      case 'resolve-discrepancy': {
        const { carrierId, discrepancyId, resolution, resolvedBy, manualValue } = body
        if (!carrierId || !discrepancyId || !resolution || !resolvedBy) {
          return NextResponse.json(
            { error: 'carrierId, discrepancyId, resolution, and resolvedBy are required' },
            { status: 400 }
          )
        }
        const result = await resolveDiscrepancy(
          orgId, carrierId, discrepancyId, resolution, resolvedBy, manualValue
        )
        return NextResponse.json(result)
      }

      case 'schedule-sync': {
        const { carrierId, schedule } = body
        if (!carrierId || !schedule) {
          return NextResponse.json(
            { error: 'carrierId and schedule are required' },
            { status: 400 }
          )
        }
        const result = await scheduleSyncJobs(orgId, carrierId, schedule)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    console.error('[POST /api/carrier-integrations] Error:', error)
    const message = error instanceof Error ? error.message : 'Carrier integration operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
