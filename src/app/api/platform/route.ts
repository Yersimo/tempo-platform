import { NextRequest, NextResponse } from 'next/server'
import {
  // Status page
  getStatusPage,
  getIncidentHistory,
  reportIncident,
  updateIncident,
  getUptimeMetrics,
  // Push notifications
  sendPushNotification,
  getNotificationPreferences,
  updateNotificationPreferences,
  getNotificationHistory,
  markNotificationRead,
  getUnreadCount,
  NOTIFICATION_TEMPLATES,
  // E-signatures
  createSignatureRequest,
  getSignatureRequest,
  signDocument,
  declineDocument,
  voidSignatureRequest,
  getSignatureRequests,
  getSignatureAuditTrail,
  DOCUMENT_TEMPLATES,
  // Feature flags
  getFeatureFlags,
  evaluateFlag,
  updateFlag,
  createFlag,
  deleteFlag,
  getFlagHistory,
} from '@/lib/platform-features'

// GET /api/platform - Status, notifications, signatures, flags
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const section = url.searchParams.get('section') || 'status'
    const action = url.searchParams.get('action') || 'default'

    // Status page is public
    if (section === 'status') {
      switch (action) {
        case 'default':
        case 'page':
          return NextResponse.json(await getStatusPage())
        case 'incidents':
          const limit = parseInt(url.searchParams.get('limit') || '10')
          return NextResponse.json({ incidents: await getIncidentHistory(limit) })
        case 'uptime':
          const days = parseInt(url.searchParams.get('days') || '30')
          return NextResponse.json({ metrics: await getUptimeMetrics(days) })
        default:
          return NextResponse.json({ error: `Unknown status action: ${action}` }, { status: 400 })
      }
    }

    // All other sections require auth
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    switch (section) {
      case 'notifications': {
        const userId = url.searchParams.get('userId')
        if (!userId) return NextResponse.json({ error: 'userId is required' }, { status: 400 })

        switch (action) {
          case 'default':
          case 'history':
            const nlimit = parseInt(url.searchParams.get('limit') || '20')
            return NextResponse.json({ notifications: await getNotificationHistory(orgId, userId, nlimit) })
          case 'preferences':
            return NextResponse.json({ preferences: await getNotificationPreferences(orgId, userId) })
          case 'unread':
            return NextResponse.json({ count: await getUnreadCount(orgId, userId) })
          case 'templates':
            return NextResponse.json({ templates: NOTIFICATION_TEMPLATES })
          default:
            return NextResponse.json({ error: `Unknown notifications action: ${action}` }, { status: 400 })
        }
      }

      case 'signatures': {
        switch (action) {
          case 'default':
          case 'list': {
            const status = url.searchParams.get('status') || undefined
            return NextResponse.json({ requests: await getSignatureRequests(orgId, status as any) })
          }
          case 'detail': {
            const requestId = url.searchParams.get('requestId')
            if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
            const result = await getSignatureRequest(orgId, requestId)
            if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
            return NextResponse.json(result)
          }
          case 'audit': {
            const requestId = url.searchParams.get('requestId')
            if (!requestId) return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
            return NextResponse.json({ trail: await getSignatureAuditTrail(orgId, requestId) })
          }
          case 'templates':
            return NextResponse.json({ templates: DOCUMENT_TEMPLATES })
          default:
            return NextResponse.json({ error: `Unknown signatures action: ${action}` }, { status: 400 })
        }
      }

      case 'flags': {
        switch (action) {
          case 'default':
          case 'list':
            return NextResponse.json({ flags: await getFeatureFlags(orgId) })
          case 'evaluate': {
            const flagKey = url.searchParams.get('flag')
            if (!flagKey) return NextResponse.json({ error: 'flag is required' }, { status: 400 })
            const userId = url.searchParams.get('userId') || undefined
            const role = url.searchParams.get('role') || undefined
            const department = url.searchParams.get('department') || undefined
            const result = await evaluateFlag(orgId, flagKey, { userId, role, department })
            return NextResponse.json({ flag: flagKey, ...result })
          }
          case 'history': {
            const flagKey = url.searchParams.get('flag')
            if (!flagKey) return NextResponse.json({ error: 'flag is required' }, { status: 400 })
            return NextResponse.json({ history: await getFlagHistory(orgId, flagKey) })
          }
          default:
            return NextResponse.json({ error: `Unknown flags action: ${action}` }, { status: 400 })
        }
      }

      default:
        return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/platform] Error:', error)
    return NextResponse.json({ error: 'Platform query failed' }, { status: 500 })
  }
}

// POST /api/platform - Report incidents, send notifications, manage signatures/flags
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { section, action } = body

    switch (section) {
      case 'status': {
        switch (action) {
          case 'report-incident': {
            const { title, affectedServices, severity, message } = body
            if (!title || !affectedServices?.length || !severity || !message) {
              return NextResponse.json({ error: 'title, affectedServices, severity, and message are required' }, { status: 400 })
            }
            const result = await reportIncident(title, affectedServices, severity, message)
            return NextResponse.json(result)
          }
          case 'update-incident': {
            const { incidentId, status, message } = body
            if (!incidentId || !status || !message) {
              return NextResponse.json({ error: 'incidentId, status, and message are required' }, { status: 400 })
            }
            const result = await updateIncident(incidentId, status, message)
            return NextResponse.json(result)
          }
          default:
            return NextResponse.json({ error: `Unknown status action: ${action}` }, { status: 400 })
        }
      }

      case 'notifications': {
        switch (action) {
          case 'send': {
            const { recipientId, templateId, data } = body
            if (!recipientId || !templateId) {
              return NextResponse.json({ error: 'recipientId and templateId are required' }, { status: 400 })
            }
            const result = await sendPushNotification(orgId, recipientId, templateId, data)
            return NextResponse.json(result)
          }
          case 'update-preferences': {
            const { userId, preferences } = body
            if (!userId || !preferences) {
              return NextResponse.json({ error: 'userId and preferences are required' }, { status: 400 })
            }
            const result = await updateNotificationPreferences(orgId, userId, preferences)
            return NextResponse.json(result)
          }
          case 'mark-read': {
            const { notificationId } = body
            if (!notificationId) {
              return NextResponse.json({ error: 'notificationId is required' }, { status: 400 })
            }
            await markNotificationRead(orgId, notificationId)
            return NextResponse.json({ success: true })
          }
          default:
            return NextResponse.json({ error: `Unknown notifications action: ${action}` }, { status: 400 })
        }
      }

      case 'signatures': {
        switch (action) {
          case 'create': {
            const { templateId, signers, fields, expiresIn } = body
            if (!templateId || !signers?.length) {
              return NextResponse.json({ error: 'templateId and signers are required' }, { status: 400 })
            }
            const result = await createSignatureRequest(orgId, templateId, signers, fields, expiresIn)
            return NextResponse.json(result)
          }
          case 'sign': {
            const { requestId, signerId, signature } = body
            if (!requestId || !signerId || !signature) {
              return NextResponse.json({ error: 'requestId, signerId, and signature are required' }, { status: 400 })
            }
            const result = await signDocument(orgId, requestId, signerId, signature)
            return NextResponse.json(result)
          }
          case 'decline': {
            const { requestId, signerId, reason } = body
            if (!requestId || !signerId) {
              return NextResponse.json({ error: 'requestId and signerId are required' }, { status: 400 })
            }
            const result = await declineDocument(orgId, requestId, signerId, reason)
            return NextResponse.json(result)
          }
          case 'void': {
            const { requestId } = body
            if (!requestId) {
              return NextResponse.json({ error: 'requestId is required' }, { status: 400 })
            }
            const result = await voidSignatureRequest(orgId, requestId)
            return NextResponse.json(result)
          }
          default:
            return NextResponse.json({ error: `Unknown signatures action: ${action}` }, { status: 400 })
        }
      }

      case 'flags': {
        switch (action) {
          case 'update': {
            const { flagKey, enabled, targeting } = body
            if (!flagKey || enabled === undefined) {
              return NextResponse.json({ error: 'flagKey and enabled are required' }, { status: 400 })
            }
            const result = await updateFlag(orgId, flagKey, enabled, targeting)
            return NextResponse.json(result)
          }
          case 'create': {
            const { key, name, description, variants } = body
            if (!key || !name) {
              return NextResponse.json({ error: 'key and name are required' }, { status: 400 })
            }
            const result = await createFlag(orgId, key, name, description, variants)
            return NextResponse.json(result)
          }
          case 'delete': {
            const { flagKey } = body
            if (!flagKey) {
              return NextResponse.json({ error: 'flagKey is required' }, { status: 400 })
            }
            const result = await deleteFlag(orgId, flagKey)
            return NextResponse.json(result)
          }
          default:
            return NextResponse.json({ error: `Unknown flags action: ${action}` }, { status: 400 })
        }
      }

      default:
        return NextResponse.json({ error: `Unknown section: ${section}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/platform] Error:', error)
    return NextResponse.json({ error: error?.message || 'Platform operation failed' }, { status: 500 })
  }
}
