import { NextRequest, NextResponse } from 'next/server'
import {
  createTemplate,
  updateTemplate,
  sendInvite,
  bulkSendInvites,
  recordResponse,
  processVideoResponse,
  analyzeResponse,
  reviewResponse,
  getVideoScreenAnalytics,
  generateComparisonReport,
  expireStaleInvites,
  createBrandedExperience,
} from '@/lib/services/video-screen'

// GET /api/video-screens - Analytics, comparison reports, or branded experience
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'analytics'

    switch (action) {
      case 'analytics': {
        const templateId = url.searchParams.get('templateId')
        if (!templateId) {
          return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
        }
        const result = await getVideoScreenAnalytics(orgId, templateId)
        return NextResponse.json(result)
      }

      case 'comparison': {
        const templateId = url.searchParams.get('templateId')
        if (!templateId) {
          return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
        }
        const applicationIds = url.searchParams.get('applicationIds')?.split(',').filter(Boolean)
        const result = await generateComparisonReport(orgId, templateId, applicationIds)
        return NextResponse.json(result)
      }

      case 'branded-experience': {
        const templateId = url.searchParams.get('templateId')
        const accessToken = url.searchParams.get('token')
        if (!templateId || !accessToken) {
          return NextResponse.json(
            { error: 'templateId and token are required' },
            { status: 400 }
          )
        }
        const result = await createBrandedExperience(orgId, templateId, accessToken)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/video-screens] Error:', error)
    const message = error instanceof Error ? error.message : 'Video screen query failed'
    const status = message.includes('not found') ? 404
      : message.includes('expired') ? 410
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/video-screens - Template CRUD, invites, responses, reviews
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-template': {
        const { name, description, questions, introVideoUrl, brandingConfig } = body
        if (!name || !questions?.length) {
          return NextResponse.json(
            { error: 'name and questions are required' },
            { status: 400 }
          )
        }
        const result = await createTemplate({
          orgId,
          name,
          description,
          questions,
          introVideoUrl,
          brandingConfig,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'update-template': {
        const { templateId, ...updates } = body
        if (!templateId) {
          return NextResponse.json({ error: 'templateId is required' }, { status: 400 })
        }
        // Remove action from updates
        const { action: _, ...updateData } = updates
        const result = await updateTemplate(orgId, templateId, updateData)
        return NextResponse.json(result)
      }

      case 'send-invite': {
        const { applicationId, templateId, expiresInDays, personalMessage } = body
        if (!applicationId || !templateId) {
          return NextResponse.json(
            { error: 'applicationId and templateId are required' },
            { status: 400 }
          )
        }
        const result = await sendInvite({
          orgId,
          applicationId,
          templateId,
          expiresInDays,
          personalMessage,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'bulk-send-invites': {
        const { templateId, applicationIds, expiresInDays } = body
        if (!templateId || !applicationIds?.length) {
          return NextResponse.json(
            { error: 'templateId and applicationIds are required' },
            { status: 400 }
          )
        }
        const result = await bulkSendInvites(orgId, templateId, applicationIds, expiresInDays)
        return NextResponse.json(result)
      }

      case 'record-response': {
        const { inviteId, questionIndex, videoUrl, thumbnailUrl, duration } = body
        if (!inviteId || questionIndex === undefined || !videoUrl || !duration) {
          return NextResponse.json(
            { error: 'inviteId, questionIndex, videoUrl, and duration are required' },
            { status: 400 }
          )
        }
        const result = await recordResponse({
          inviteId,
          questionIndex,
          videoUrl,
          thumbnailUrl,
          duration,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'process-response': {
        const { responseId } = body
        if (!responseId) {
          return NextResponse.json({ error: 'responseId is required' }, { status: 400 })
        }
        const result = await processVideoResponse(orgId, responseId)
        return NextResponse.json(result)
      }

      case 'analyze': {
        const { inviteId } = body
        if (!inviteId) {
          return NextResponse.json({ error: 'inviteId is required' }, { status: 400 })
        }
        const result = await analyzeResponse(orgId, inviteId)
        return NextResponse.json(result)
      }

      case 'review': {
        const { inviteId, questionIndex, reviewerId, rating, notes } = body
        if (!inviteId || questionIndex === undefined || !reviewerId || !rating) {
          return NextResponse.json(
            { error: 'inviteId, questionIndex, reviewerId, and rating are required' },
            { status: 400 }
          )
        }
        const result = await reviewResponse({
          inviteId,
          questionIndex,
          reviewerId,
          rating,
          notes,
        })
        return NextResponse.json(result)
      }

      case 'expire-stale': {
        const result = await expireStaleInvites(orgId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/video-screens] Error:', error)
    const message = error instanceof Error ? error.message : 'Video screen operation failed'
    const status = message.includes('not found') ? 404
      : message.includes('expired') ? 410
      : message.includes('Invalid') || message.includes('required') || message.includes('Cannot') || message.includes('already exists') ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
