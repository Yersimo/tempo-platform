/**
 * Calendar Context Provider
 *
 * Abstraction over Google Calendar / Outlook / mock so the rest of the
 * platform never needs to know which calendar the user is on.
 *
 * Used by the expense scan flow to answer: "what meeting was the user
 * in around this timestamp?" — which feeds business-purpose synthesis
 * and cost-center inference.
 *
 * Real OAuth implementations require client IDs/secrets per provider
 * (set in env). Mock provider returns realistic fixture data so the
 * end-to-end flow works without external auth in demo mode.
 */

export interface CalendarAttendee {
  email: string
  name: string | null
  /** External company derived from email domain (null if internal) */
  company: string | null
  responseStatus: 'accepted' | 'tentative' | 'declined' | 'needsAction'
  isOrganizer: boolean
}

export interface CalendarEvent {
  id: string
  providerId: string // event ID in the underlying provider
  title: string
  description: string | null
  startTime: string // ISO 8601
  endTime: string
  location: string | null
  attendees: CalendarAttendee[]
  /** Heuristic: derived from attendee domains + meeting title */
  classification: {
    isExternal: boolean
    isClientMeeting: boolean
    likelyAccount: string | null // e.g. "Ecobank Group"
    likelyProject: string | null
  }
}

export interface CalendarProvider {
  name: 'google' | 'outlook' | 'mock'
  /**
   * Find the most relevant event for a given timestamp. Returns the event
   * the user was likely in (within a 30-min window). null if no match.
   */
  findEventAt(
    employeeId: string,
    timestamp: string,
    windowMinutes?: number,
  ): Promise<CalendarEvent | null>
}

// ─── Domain → company mapping ────────────────────────────────────────
// This is a simple heuristic. Production: lookup against a clearbit-style
// company database, fall back to domain root.
const DOMAIN_COMPANY_MAP: Record<string, string> = {
  'ecobank.com': 'Ecobank Group',
  'mckinsey.com': 'McKinsey & Company',
  'kpmg.com': 'KPMG',
  'deloitte.com': 'Deloitte',
  'standardbank.com': 'Standard Bank',
  'mtn.com': 'MTN Group',
  'safaricom.com': 'Safaricom',
  'flutterwave.com': 'Flutterwave',
  'paystack.com': 'Paystack',
}

function inferCompanyFromEmail(email: string): string | null {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!domain) return null
  if (DOMAIN_COMPANY_MAP[domain]) return DOMAIN_COMPANY_MAP[domain]
  // Fallback: capitalize the domain root
  const root = domain.split('.')[0]
  return root ? root.charAt(0).toUpperCase() + root.slice(1) : null
}

/** Classify an event using attendees + title heuristics. */
function classifyEvent(
  title: string,
  attendees: CalendarAttendee[],
  employeeDomain: string,
): CalendarEvent['classification'] {
  const externalAttendees = attendees.filter((a) => {
    const dom = a.email.split('@')[1]?.toLowerCase()
    return dom && dom !== employeeDomain
  })

  const isExternal = externalAttendees.length > 0
  const titleLower = title.toLowerCase()

  // Client meeting heuristic: external attendees + business-y title
  const clientTitlePatterns = /\b(client|customer|account|review|qbr|partnership|deal|meeting|sync|workshop|dinner|lunch)\b/i
  const isClientMeeting =
    isExternal && (clientTitlePatterns.test(title) || externalAttendees.length >= 1)

  // Likely account: the most-attended external company
  const externalCompanies = externalAttendees
    .map((a) => a.company)
    .filter((c): c is string => Boolean(c))
  const likelyAccount =
    externalCompanies.length > 0
      ? mostFrequent(externalCompanies)
      : null

  // Likely project: detect bracketed project codes in title (e.g. "[Q3] meeting")
  const projectMatch = title.match(/\[([^\]]+)\]/) || title.match(/^([A-Z]{2,6}-\d+)/)
  const likelyProject = projectMatch ? projectMatch[1] : null

  return {
    isExternal,
    isClientMeeting,
    likelyAccount,
    likelyProject,
  }
}

function mostFrequent<T>(arr: T[]): T {
  const counts = new Map<T, number>()
  for (const item of arr) counts.set(item, (counts.get(item) ?? 0) + 1)
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]![0]
}

// ─── Mock provider (demo fixtures) ───────────────────────────────────
/**
 * Returns deterministic fixture meetings so the snap-expense demo flow
 * works without OAuth. Production replaces this with the Google or
 * Outlook provider.
 *
 * The fixtures are keyed by employee ID + hour-of-day so the demo always
 * produces the same "you were at this meeting" result for a given
 * scenario.
 */
const MOCK_EVENTS: Record<string, CalendarEvent[]> = {
  'emp-17': [ // Amara Kone, CHRO
    {
      id: 'evt-mock-amara-dinner',
      providerId: 'google-mock-1',
      title: 'Q3 Expansion strategy dinner',
      description: 'Quarterly check-in with Ecobank strategy team',
      startTime: '__TODAY__T19:30:00.000Z',
      endTime: '__TODAY__T21:00:00.000Z',
      location: 'Roma Bistro, Lagos',
      attendees: [
        {
          email: 'amara.kone@ecobank.com',
          name: 'Amara Kone',
          company: null,
          responseStatus: 'accepted',
          isOrganizer: true,
        },
        {
          email: 'david.owusu@ecobank.com',
          name: 'David Owusu',
          company: 'Ecobank Group',
          responseStatus: 'accepted',
          isOrganizer: false,
        },
        {
          email: 'sarah.chen@mckinsey.com',
          name: 'Sarah Chen',
          company: 'McKinsey & Company',
          responseStatus: 'accepted',
          isOrganizer: false,
        },
      ],
      classification: {
        isExternal: true,
        isClientMeeting: true,
        likelyAccount: 'McKinsey & Company',
        likelyProject: 'Q3 Expansion',
      },
    },
    {
      id: 'evt-mock-amara-1on1',
      providerId: 'google-mock-2',
      title: '1:1 with CFO',
      description: null,
      startTime: '__TODAY__T10:00:00.000Z',
      endTime: '__TODAY__T10:30:00.000Z',
      location: null,
      attendees: [
        {
          email: 'amara.kone@ecobank.com',
          name: 'Amara Kone',
          company: null,
          responseStatus: 'accepted',
          isOrganizer: false,
        },
        {
          email: 'i.agu@ecobank.com',
          name: 'Ifeanyi Agu',
          company: null,
          responseStatus: 'accepted',
          isOrganizer: true,
        },
      ],
      classification: {
        isExternal: false,
        isClientMeeting: false,
        likelyAccount: null,
        likelyProject: null,
      },
    },
  ],
}

function expandTodayPlaceholders(evt: CalendarEvent): CalendarEvent {
  const today = new Date().toISOString().slice(0, 10)
  return {
    ...evt,
    startTime: evt.startTime.replace('__TODAY__', today),
    endTime: evt.endTime.replace('__TODAY__', today),
  }
}

export const mockCalendarProvider: CalendarProvider = {
  name: 'mock',
  async findEventAt(employeeId, timestamp, windowMinutes = 30) {
    const events = MOCK_EVENTS[employeeId] ?? []
    const target = new Date(timestamp).getTime()
    const windowMs = windowMinutes * 60_000

    let best: { event: CalendarEvent; distance: number } | null = null
    for (const raw of events) {
      const evt = expandTodayPlaceholders(raw)
      const start = new Date(evt.startTime).getTime()
      const end = new Date(evt.endTime).getTime()

      // Event overlaps with the timestamp ±window
      const inWindow =
        target >= start - windowMs && target <= end + windowMs

      if (inWindow) {
        const distance = Math.min(
          Math.abs(target - start),
          Math.abs(target - end),
        )
        if (!best || distance < best.distance) {
          best = { event: evt, distance }
        }
      }
    }

    return best?.event ?? null
  },
}

// ─── Google Calendar provider (production-real) ──────────────────────
/**
 * Real Google Calendar implementation. Uses ensureFreshToken to refresh
 * tokens automatically, then calls calendar.events.list.
 *
 * Requires env: GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET.
 * Employee must have completed /api/auth/calendar/google/start flow.
 */
export const googleCalendarProvider: CalendarProvider = {
  name: 'google',
  async findEventAt(employeeId, timestamp, windowMinutes = 30) {
    const { ensureFreshToken } = await import('./calendar-oauth')
    const token = await ensureFreshToken(employeeId, 'google')
    if (!token) return null

    const target = new Date(timestamp)
    const timeMin = new Date(target.getTime() - windowMinutes * 60_000)
    const timeMax = new Date(target.getTime() + windowMinutes * 60_000)

    const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
    url.searchParams.set('timeMin', timeMin.toISOString())
    url.searchParams.set('timeMax', timeMax.toISOString())
    url.searchParams.set('singleEvents', 'true')
    url.searchParams.set('orderBy', 'startTime')
    url.searchParams.set('maxResults', '10')

    try {
      const res = await fetch(url.toString(), {
        headers: { Authorization: `Bearer ${token.accessToken}` },
      })
      if (!res.ok) return null
      const data = (await res.json()) as {
        items?: Array<{
          id: string
          summary?: string
          description?: string
          start?: { dateTime?: string; date?: string }
          end?: { dateTime?: string; date?: string }
          location?: string
          attendees?: Array<{
            email: string
            displayName?: string
            responseStatus: 'accepted' | 'tentative' | 'declined' | 'needsAction'
            organizer?: boolean
          }>
          organizer?: { email: string }
        }>
      }

      const items = data.items ?? []
      if (items.length === 0) return null

      // Get the closest event by start time
      const targetMs = target.getTime()
      const employeeEmail = await getEmployeeEmail(employeeId)
      const employeeDomain = employeeEmail.split('@')[1] ?? ''

      let best: CalendarEvent | null = null
      let bestDistance = Infinity

      for (const item of items) {
        const startIso = item.start?.dateTime ?? item.start?.date
        const endIso = item.end?.dateTime ?? item.end?.date
        if (!startIso) continue

        const startMs = new Date(startIso).getTime()
        const distance = Math.abs(targetMs - startMs)

        if (distance < bestDistance) {
          bestDistance = distance
          const attendees: CalendarAttendee[] = (item.attendees ?? []).map((a) => ({
            email: a.email,
            name: a.displayName ?? null,
            company: inferCompanyFromEmail(a.email),
            responseStatus: a.responseStatus,
            isOrganizer: Boolean(a.organizer),
          }))
          best = {
            id: item.id,
            providerId: item.id,
            title: item.summary ?? 'Untitled',
            description: item.description ?? null,
            startTime: startIso,
            endTime: endIso ?? startIso,
            location: item.location ?? null,
            attendees,
            classification: classifyEvent(item.summary ?? '', attendees, employeeDomain),
          }
        }
      }

      return best
    } catch (err) {
      console.error('[google calendar] fetch failed:', err)
      return null
    }
  },
}

/** Stub helper — production: SELECT email FROM employees WHERE id = ?. */
async function getEmployeeEmail(employeeId: string): Promise<string> {
  // For demo employees, return the known email
  if (employeeId === 'emp-17') return 'amara.kone@ecobank.com'
  return ''
}

// ─── Outlook / Microsoft Graph provider (stub) ───────────────────────
export const outlookCalendarProvider: CalendarProvider = {
  name: 'outlook',
  async findEventAt() {
    if (process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_SECRET) {
      // TODO: implement real Microsoft Graph /me/calendar/events call
      throw new Error('Outlook provider not yet implemented')
    }
    return null
  },
}

// ─── Resolver: pick the right provider per employee ──────────────────
/**
 * In production, employees opt-in to one provider via OAuth. The
 * `calendar_tokens` table records which provider they're on. For now we
 * fall back to mock provider — guarantees the demo flow works.
 */
export async function getCalendarProvider(
  employeeId: string,
): Promise<CalendarProvider> {
  // If Google OAuth is configured AND the employee has a stored token,
  // use the real Google provider. Otherwise fall back to mock for demo.
  if (process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_CLIENT_SECRET) {
    const { loadCalendarToken } = await import('./calendar-oauth')
    const token = await loadCalendarToken(employeeId, 'google')
    if (token) return googleCalendarProvider
  }
  if (process.env.MS_GRAPH_CLIENT_ID && process.env.MS_GRAPH_CLIENT_SECRET) {
    const { loadCalendarToken } = await import('./calendar-oauth')
    const token = await loadCalendarToken(employeeId, 'outlook')
    if (token) return outlookCalendarProvider
  }
  return mockCalendarProvider
}

// ─── Re-export the helpers used by other services ────────────────────
export { inferCompanyFromEmail, classifyEvent }
