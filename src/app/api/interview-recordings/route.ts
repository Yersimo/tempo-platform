import { NextRequest, NextResponse } from 'next/server'
import {
  scheduleRecording,
  startRecording,
  stopRecording,
  processRecording,
  getRecordingPlayback,
  shareRecording,
  generateHighlightReel,
  batchProcessRecordings,
  getInterviewInsights,
} from '@/lib/services/interview-recording'

// GET /api/interview-recordings - Playback, highlights, or insights
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'playback'

    switch (action) {
      case 'playback': {
        const recordingId = url.searchParams.get('recordingId')
        if (!recordingId) {
          return NextResponse.json({ error: 'recordingId is required' }, { status: 400 })
        }
        const result = await getRecordingPlayback(orgId, recordingId)
        return NextResponse.json(result)
      }

      case 'highlights': {
        const recordingId = url.searchParams.get('recordingId')
        if (!recordingId) {
          return NextResponse.json({ error: 'recordingId is required' }, { status: 400 })
        }
        const result = await generateHighlightReel(orgId, recordingId)
        return NextResponse.json(result)
      }

      case 'insights': {
        const applicationId = url.searchParams.get('applicationId')
        if (!applicationId) {
          return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
        }
        const result = await getInterviewInsights(orgId, applicationId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/interview-recordings] Error:', error)
    const message = error instanceof Error ? error.message : 'Interview recording query failed'
    const status = message.includes('not found') ? 404 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// POST /api/interview-recordings - Schedule, start, stop, process, share, batch
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'schedule': {
        const { applicationId, interviewType, interviewerIds, scheduledAt, platform, meetingId } = body
        if (!applicationId || !interviewType || !interviewerIds?.length || !scheduledAt) {
          return NextResponse.json(
            { error: 'applicationId, interviewType, interviewerIds, and scheduledAt are required' },
            { status: 400 }
          )
        }
        const result = await scheduleRecording({
          orgId,
          applicationId,
          interviewType,
          interviewerIds,
          scheduledAt,
          platform,
          meetingId,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'start': {
        const { recordingId } = body
        if (!recordingId) {
          return NextResponse.json({ error: 'recordingId is required' }, { status: 400 })
        }
        const result = await startRecording(orgId, recordingId)
        return NextResponse.json(result)
      }

      case 'stop': {
        const { recordingId, recordingUrl, durationSeconds } = body
        if (!recordingId || !recordingUrl || !durationSeconds) {
          return NextResponse.json(
            { error: 'recordingId, recordingUrl, and durationSeconds are required' },
            { status: 400 }
          )
        }
        const result = await stopRecording(orgId, recordingId, recordingUrl, durationSeconds)
        return NextResponse.json(result)
      }

      case 'process': {
        const { recordingId, language } = body
        if (!recordingId) {
          return NextResponse.json({ error: 'recordingId is required' }, { status: 400 })
        }
        const result = await processRecording(orgId, recordingId, language)
        return NextResponse.json(result)
      }

      case 'share': {
        const { recordingId, recipientEmails, includeTranscription, includeScorecard, includeHighlights, expiresInDays, message } = body
        if (!recordingId || !recipientEmails?.length) {
          return NextResponse.json(
            { error: 'recordingId and recipientEmails are required' },
            { status: 400 }
          )
        }
        const result = await shareRecording(orgId, recordingId, {
          recipientEmails,
          includeTranscription: includeTranscription ?? true,
          includeScorecard: includeScorecard ?? true,
          includeHighlights: includeHighlights ?? true,
          expiresInDays: expiresInDays ?? 7,
          message,
        })
        return NextResponse.json(result)
      }

      case 'batch-process': {
        const { language } = body
        const result = await batchProcessRecordings(orgId, language)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/interview-recordings] Error:', error)
    const message = error instanceof Error ? error.message : 'Interview recording operation failed'
    const status = message.includes('not found') ? 404
      : message.includes('Invalid') || message.includes('required') || message.includes('Cannot') ? 400
      : 500
    return NextResponse.json({ error: message }, { status })
  }
}
