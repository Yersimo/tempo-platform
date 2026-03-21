/**
 * Video Conferencing Service
 *
 * Provider abstraction for Zoom, Google Meet, and Microsoft Teams.
 * Manages meeting creation, cancellation, RSVP, and scheduling for
 * interviews, team meetings, and other events.
 *
 * When provider env vars are missing, returns mock meeting URLs.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, gte, lte, sql } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ============================================================
// Types
// ============================================================

export type MeetingProvider = 'zoom' | 'google_meet' | 'microsoft_teams' | 'internal'
export type MeetingStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
export type MeetingType = 'interview' | 'one_on_one' | 'team' | 'all_hands' | 'review' | 'general'
export type ParticipantRole = 'host' | 'co_host' | 'attendee' | 'interviewer'
export type RsvpStatus = 'pending' | 'accepted' | 'declined' | 'tentative'

export interface MeetingConfig {
  title: string
  description?: string
  provider: MeetingProvider
  startTime: string // ISO timestamp
  endTime: string
  meetingType?: MeetingType
  relatedEntityType?: string
  relatedEntityId?: string
  participants: {
    employeeId?: string
    email: string
    role?: ParticipantRole
  }[]
}

export interface MeetingDetails {
  id: string
  title: string
  meetingUrl: string
  provider: string
  startTime: string
  endTime: string
  status: string
}

// ============================================================
// Provider Abstraction
// ============================================================

interface VideoProvider {
  createMeeting(config: MeetingConfig): Promise<{ meetingUrl: string; externalId: string }>
  cancelMeeting(externalId: string): Promise<void>
  getMeetingDetails(externalId: string): Promise<MeetingDetails>
}

/**
 * Zoom Provider - Uses Zoom API v2
 * Requires ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, ZOOM_ACCOUNT_ID env vars
 */
class ZoomProvider implements VideoProvider {
  private baseUrl = 'https://api.zoom.us/v2'

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.ZOOM_CLIENT_ID
    const clientSecret = process.env.ZOOM_CLIENT_SECRET
    const accountId = process.env.ZOOM_ACCOUNT_ID

    if (!clientId || !clientSecret || !accountId) {
      throw new Error('ZOOM_CREDENTIALS_MISSING')
    }

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const res = await fetch('https://zoom.us/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=account_credentials&account_id=${accountId}`,
    })

    if (!res.ok) throw new Error('Failed to obtain Zoom access token')
    const data = await res.json()
    return data.access_token
  }

  async createMeeting(config: MeetingConfig) {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}/users/me/meetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: config.title,
        type: 2, // scheduled meeting
        start_time: config.startTime,
        duration: Math.round((new Date(config.endTime).getTime() - new Date(config.startTime).getTime()) / 60000),
        timezone: 'UTC',
        agenda: config.description || '',
        settings: {
          join_before_host: true,
          waiting_room: false,
          auto_recording: 'cloud',
        },
      }),
    })

    if (!res.ok) throw new Error('Failed to create Zoom meeting')
    const data = await res.json()
    return { meetingUrl: data.join_url, externalId: String(data.id) }
  }

  async cancelMeeting(externalId: string) {
    const token = await this.getAccessToken()
    await fetch(`${this.baseUrl}/meetings/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async getMeetingDetails(externalId: string): Promise<MeetingDetails> {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.baseUrl}/meetings/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to get Zoom meeting details')
    const data = await res.json()
    return {
      id: String(data.id),
      title: data.topic,
      meetingUrl: data.join_url,
      provider: 'zoom',
      startTime: data.start_time,
      endTime: new Date(new Date(data.start_time).getTime() + data.duration * 60000).toISOString(),
      status: data.status === 'waiting' ? 'scheduled' : data.status === 'started' ? 'in_progress' : 'completed',
    }
  }
}

/**
 * Google Meet Provider - Uses Google Calendar API
 * Requires GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REFRESH_TOKEN env vars
 */
class GoogleMeetProvider implements VideoProvider {
  private calendarApi = 'https://www.googleapis.com/calendar/v3'

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('GOOGLE_CREDENTIALS_MISSING')
    }

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    })

    if (!res.ok) throw new Error('Failed to obtain Google access token')
    const data = await res.json()
    return data.access_token
  }

  async createMeeting(config: MeetingConfig) {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.calendarApi}/calendars/primary/events?conferenceDataVersion=1`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: config.title,
        description: config.description || '',
        start: { dateTime: config.startTime, timeZone: 'UTC' },
        end: { dateTime: config.endTime, timeZone: 'UTC' },
        conferenceData: {
          createRequest: {
            requestId: randomUUID(),
            conferenceSolutionKey: { type: 'hangoutsMeet' },
          },
        },
        attendees: config.participants.map(p => ({ email: p.email })),
      }),
    })

    if (!res.ok) throw new Error('Failed to create Google Meet event')
    const data = await res.json()
    const meetUrl = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || ''
    return { meetingUrl: meetUrl, externalId: data.id }
  }

  async cancelMeeting(externalId: string) {
    const token = await this.getAccessToken()
    await fetch(`${this.calendarApi}/calendars/primary/events/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async getMeetingDetails(externalId: string): Promise<MeetingDetails> {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.calendarApi}/calendars/primary/events/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to get Google Meet event details')
    const data = await res.json()
    const meetUrl = data.conferenceData?.entryPoints?.find((e: any) => e.entryPointType === 'video')?.uri || ''
    return {
      id: data.id,
      title: data.summary,
      meetingUrl: meetUrl,
      provider: 'google_meet',
      startTime: data.start.dateTime,
      endTime: data.end.dateTime,
      status: data.status === 'cancelled' ? 'cancelled' : 'scheduled',
    }
  }
}

/**
 * Microsoft Teams Provider - Uses Microsoft Graph API
 * Requires TEAMS_CLIENT_ID, TEAMS_CLIENT_SECRET, TEAMS_TENANT_ID env vars
 */
class TeamsProvider implements VideoProvider {
  private graphApi = 'https://graph.microsoft.com/v1.0'

  private async getAccessToken(): Promise<string> {
    const clientId = process.env.TEAMS_CLIENT_ID
    const clientSecret = process.env.TEAMS_CLIENT_SECRET
    const tenantId = process.env.TEAMS_TENANT_ID

    if (!clientId || !clientSecret || !tenantId) {
      throw new Error('TEAMS_CREDENTIALS_MISSING')
    }

    const res = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials',
      }),
    })

    if (!res.ok) throw new Error('Failed to obtain Teams access token')
    const data = await res.json()
    return data.access_token
  }

  async createMeeting(config: MeetingConfig) {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.graphApi}/me/onlineMeetings`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        subject: config.title,
        startDateTime: config.startTime,
        endDateTime: config.endTime,
        isEntryExitAnnounced: true,
        allowedPresenters: 'everyone',
      }),
    })

    if (!res.ok) throw new Error('Failed to create Teams meeting')
    const data = await res.json()
    return { meetingUrl: data.joinWebUrl, externalId: data.id }
  }

  async cancelMeeting(externalId: string) {
    const token = await this.getAccessToken()
    await fetch(`${this.graphApi}/me/onlineMeetings/${externalId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
  }

  async getMeetingDetails(externalId: string): Promise<MeetingDetails> {
    const token = await this.getAccessToken()
    const res = await fetch(`${this.graphApi}/me/onlineMeetings/${externalId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error('Failed to get Teams meeting details')
    const data = await res.json()
    return {
      id: data.id,
      title: data.subject,
      meetingUrl: data.joinWebUrl,
      provider: 'microsoft_teams',
      startTime: data.startDateTime,
      endTime: data.endDateTime,
      status: 'scheduled',
    }
  }
}

// ============================================================
// Mock Provider (when credentials are missing)
// ============================================================

class MockProvider implements VideoProvider {
  private providerName: string
  constructor(providerName: string) {
    this.providerName = providerName
  }

  async createMeeting(config: MeetingConfig) {
    const mockId = randomUUID()
    return {
      meetingUrl: `https://meet.tempo.app/mock-${mockId}`,
      externalId: `mock-${mockId}`,
    }
  }

  async cancelMeeting() {
    // no-op for mock
  }

  async getMeetingDetails(externalId: string): Promise<MeetingDetails> {
    return {
      id: externalId,
      title: 'Mock Meeting',
      meetingUrl: `https://meet.tempo.app/${externalId}`,
      provider: this.providerName,
      startTime: new Date().toISOString(),
      endTime: new Date(Date.now() + 3600000).toISOString(),
      status: 'scheduled',
    }
  }
}

// ============================================================
// Provider Factory
// ============================================================

function getProvider(provider: MeetingProvider): VideoProvider {
  try {
    switch (provider) {
      case 'zoom':
        if (!process.env.ZOOM_CLIENT_ID) return new MockProvider('zoom')
        return new ZoomProvider()
      case 'google_meet':
        if (!process.env.GOOGLE_CLIENT_ID) return new MockProvider('google_meet')
        return new GoogleMeetProvider()
      case 'microsoft_teams':
        if (!process.env.TEAMS_CLIENT_ID) return new MockProvider('microsoft_teams')
        return new TeamsProvider()
      default:
        return new MockProvider('internal')
    }
  } catch {
    return new MockProvider(provider)
  }
}

// ============================================================
// Exported Functions
// ============================================================

export async function createMeeting(orgId: string, hostId: string, config: MeetingConfig) {
  const provider = getProvider(config.provider)

  let meetingUrl = ''
  let externalMeetingId = ''

  if (config.provider !== 'internal') {
    try {
      const result = await provider.createMeeting(config)
      meetingUrl = result.meetingUrl
      externalMeetingId = result.externalId
    } catch {
      // Fall back to mock URL
      const mockId = randomUUID()
      meetingUrl = `https://meet.tempo.app/mock-${mockId}`
      externalMeetingId = `mock-${mockId}`
    }
  } else {
    const mockId = randomUUID()
    meetingUrl = `https://meet.tempo.app/${mockId}`
    externalMeetingId = `internal-${mockId}`
  }

  const meetingId = randomUUID()

  const [meeting] = await db.insert(schema.meetings).values({
    id: meetingId,
    orgId,
    title: config.title,
    description: config.description || null,
    provider: config.provider,
    externalMeetingId,
    meetingUrl,
    hostId,
    startTime: new Date(config.startTime),
    endTime: new Date(config.endTime),
    status: 'scheduled',
    meetingType: config.meetingType || 'general',
    relatedEntityType: config.relatedEntityType || null,
    relatedEntityId: config.relatedEntityId || null,
  }).returning()

  // Insert participants
  if (config.participants.length > 0) {
    await db.insert(schema.meetingParticipants).values(
      config.participants.map(p => ({
        id: randomUUID(),
        meetingId,
        employeeId: p.employeeId || null,
        email: p.email,
        role: p.role || 'attendee',
        rsvpStatus: 'pending' as const,
      }))
    )
  }

  return { ...meeting, participants: config.participants }
}

export async function scheduleMeetingForInterview(
  orgId: string,
  applicationId: string,
  interviewers: { employeeId: string; email: string }[],
  candidateEmail: string,
  startTime: string,
  endTime: string,
  provider: MeetingProvider = 'internal'
) {
  const participants = [
    ...interviewers.map(i => ({
      employeeId: i.employeeId,
      email: i.email,
      role: 'interviewer' as ParticipantRole,
    })),
    { email: candidateEmail, role: 'attendee' as ParticipantRole },
  ]

  return createMeeting(orgId, interviewers[0]?.employeeId || '', {
    title: `Interview - ${candidateEmail}`,
    description: `Interview for application ${applicationId}`,
    provider,
    startTime,
    endTime,
    meetingType: 'interview',
    relatedEntityType: 'application',
    relatedEntityId: applicationId,
    participants,
  })
}

export async function cancelMeeting(meetingId: string) {
  const [meeting] = await db
    .select()
    .from(schema.meetings)
    .where(eq(schema.meetings.id, meetingId))
    .limit(1)

  if (!meeting) throw new Error('Meeting not found')

  // Cancel on provider if external
  if (meeting.externalMeetingId && !meeting.externalMeetingId.startsWith('mock-') && !meeting.externalMeetingId.startsWith('internal-')) {
    try {
      const provider = getProvider(meeting.provider as MeetingProvider)
      await provider.cancelMeeting(meeting.externalMeetingId)
    } catch {
      // Provider cancellation failed, still mark as cancelled locally
    }
  }

  await db
    .update(schema.meetings)
    .set({ status: 'cancelled' })
    .where(eq(schema.meetings.id, meetingId))
}

export async function getMeetingsByDate(orgId: string, date: string) {
  const startOfDay = new Date(date)
  startOfDay.setHours(0, 0, 0, 0)
  const endOfDay = new Date(date)
  endOfDay.setHours(23, 59, 59, 999)

  return db
    .select()
    .from(schema.meetings)
    .where(
      and(
        eq(schema.meetings.orgId, orgId),
        gte(schema.meetings.startTime, startOfDay),
        lte(schema.meetings.startTime, endOfDay)
      )
    )
    .orderBy(schema.meetings.startTime)
}

export async function getUpcomingMeetings(orgId: string, employeeId?: string) {
  const now = new Date()

  if (employeeId) {
    // Get meeting IDs for this participant
    const participantMeetings = await db
      .select({ meetingId: schema.meetingParticipants.meetingId })
      .from(schema.meetingParticipants)
      .where(eq(schema.meetingParticipants.employeeId, employeeId))

    const meetingIds = participantMeetings.map(p => p.meetingId)

    // Also include meetings where this employee is host
    const hosted = await db
      .select()
      .from(schema.meetings)
      .where(
        and(
          eq(schema.meetings.orgId, orgId),
          eq(schema.meetings.hostId, employeeId),
          gte(schema.meetings.startTime, now),
          eq(schema.meetings.status, 'scheduled')
        )
      )
      .orderBy(schema.meetings.startTime)
      .limit(20)

    if (meetingIds.length === 0) return hosted

    const asParticipant = await db
      .select()
      .from(schema.meetings)
      .where(
        and(
          eq(schema.meetings.orgId, orgId),
          gte(schema.meetings.startTime, now),
          eq(schema.meetings.status, 'scheduled'),
          sql`${schema.meetings.id} IN (${sql.join(meetingIds.map(id => sql`${id}`), sql`, `)})`
        )
      )
      .orderBy(schema.meetings.startTime)
      .limit(20)

    // Dedupe and sort
    const map = new Map<string, typeof hosted[0]>()
    for (const m of [...hosted, ...asParticipant]) map.set(m.id, m)
    return Array.from(map.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    ).slice(0, 20)
  }

  return db
    .select()
    .from(schema.meetings)
    .where(
      and(
        eq(schema.meetings.orgId, orgId),
        gte(schema.meetings.startTime, now),
        eq(schema.meetings.status, 'scheduled')
      )
    )
    .orderBy(schema.meetings.startTime)
    .limit(20)
}

export async function rsvpToMeeting(meetingId: string, employeeId: string, status: RsvpStatus) {
  const [participant] = await db
    .select()
    .from(schema.meetingParticipants)
    .where(
      and(
        eq(schema.meetingParticipants.meetingId, meetingId),
        eq(schema.meetingParticipants.employeeId, employeeId)
      )
    )
    .limit(1)

  if (!participant) throw new Error('Participant not found for this meeting')

  await db
    .update(schema.meetingParticipants)
    .set({ rsvpStatus: status })
    .where(eq(schema.meetingParticipants.id, participant.id))
}

export async function getMeetingWithParticipants(meetingId: string) {
  const [meeting] = await db
    .select()
    .from(schema.meetings)
    .where(eq(schema.meetings.id, meetingId))
    .limit(1)

  if (!meeting) return null

  const participants = await db
    .select()
    .from(schema.meetingParticipants)
    .where(eq(schema.meetingParticipants.meetingId, meetingId))

  return { ...meeting, participants }
}
