import { NextRequest, NextResponse } from 'next/server'
import {
  createMeeting,
  scheduleMeetingForInterview,
  cancelMeeting,
  getMeetingsByDate,
  getUpcomingMeetings,
  rsvpToMeeting,
  getMeetingWithParticipants,
} from '@/lib/services/video-conferencing'
import type { MeetingProvider, ParticipantRole } from '@/lib/services/video-conferencing'

function getOrgId(req: NextRequest): string | null {
  return req.headers.get('x-org-id')
}

function getEmployeeId(req: NextRequest): string | null {
  return req.headers.get('x-employee-id')
}

// ---------------------------------------------------------------------------
// GET /api/meetings?action=upcoming|by-date|get
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'upcoming'

    switch (action) {
      case 'upcoming': {
        const employeeId = url.searchParams.get('employeeId') || getEmployeeId(request) || undefined
        const meetings = await getUpcomingMeetings(orgId, employeeId)
        return NextResponse.json({ data: meetings })
      }

      case 'by-date': {
        const date = url.searchParams.get('date')
        if (!date) return NextResponse.json({ error: 'date parameter required' }, { status: 400 })
        const meetings = await getMeetingsByDate(orgId, date)
        return NextResponse.json({ data: meetings })
      }

      case 'get': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const meeting = await getMeetingWithParticipants(id)
        if (!meeting) return NextResponse.json({ error: 'Meeting not found' }, { status: 404 })
        return NextResponse.json({ data: meeting })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/meetings] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/meetings  { action: 'create' | 'schedule-interview' | 'cancel' | 'rsvp' }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    const employeeId = getEmployeeId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { title, description, provider, startTime, endTime, meetingType, relatedEntityType, relatedEntityId, participants } = body
        if (!title || !provider || !startTime || !endTime) {
          return NextResponse.json({ error: 'title, provider, startTime, endTime are required' }, { status: 400 })
        }
        const meeting = await createMeeting(orgId, employeeId || '', {
          title,
          description,
          provider: provider as MeetingProvider,
          startTime,
          endTime,
          meetingType,
          relatedEntityType,
          relatedEntityId,
          participants: (participants || []).map((p: any) => ({
            employeeId: p.employeeId || p.employee_id,
            email: p.email,
            role: (p.role || 'attendee') as ParticipantRole,
          })),
        })
        return NextResponse.json({ data: meeting }, { status: 201 })
      }

      case 'schedule-interview': {
        const { applicationId, interviewers, candidateEmail, startTime, endTime, provider } = body
        if (!applicationId || !interviewers?.length || !candidateEmail || !startTime || !endTime) {
          return NextResponse.json({ error: 'applicationId, interviewers, candidateEmail, startTime, endTime are required' }, { status: 400 })
        }
        const meeting = await scheduleMeetingForInterview(
          orgId,
          applicationId,
          interviewers,
          candidateEmail,
          startTime,
          endTime,
          (provider || 'internal') as MeetingProvider
        )
        return NextResponse.json({ data: meeting }, { status: 201 })
      }

      case 'cancel': {
        const { meetingId } = body
        if (!meetingId) return NextResponse.json({ error: 'meetingId is required' }, { status: 400 })
        await cancelMeeting(meetingId)
        return NextResponse.json({ success: true })
      }

      case 'rsvp': {
        const { meetingId, status } = body
        if (!meetingId || !status || !employeeId) {
          return NextResponse.json({ error: 'meetingId and status are required' }, { status: 400 })
        }
        await rsvpToMeeting(meetingId, employeeId, status)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/meetings] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process meeting request' }, { status: 500 })
  }
}
