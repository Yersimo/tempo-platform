/**
 * Buddy & Peer Matcher
 *
 * Pairs a new joiner with:
 *   1. ONE primary buddy — experienced peer in same dept, tenure >12mo,
 *      same timezone, similar role. Nudged on Slack to message the joiner.
 *   2. TWO peers for an optional virtual coffee — broader matching:
 *      same role globally, or shared interests.
 *
 * Match scoring is explainable: every recommendation cites the reason.
 * Production: queries employees table + Slack activity + interest tags.
 * Demo: returns realistic fixtures.
 */

export interface BuddyCandidate {
  employeeId: string
  fullName: string
  title: string
  department: string
  country: string
  photoUrl: string | null
  slackHandle: string
  matchScore: number
  reasons: string[]
}

export interface BuddyMatch {
  buddy: BuddyCandidate | null
  introMessage: string
  /** Whether Tempo has already nudged the buddy on Slack */
  buddyNotified: boolean
}

export interface PeerMatch {
  peers: BuddyCandidate[]
  /** Coffee slot Tempo suggests, in ISO 8601 */
  suggestedTime: string | null
}

// ─── Mock candidates ─────────────────────────────────────────────────

const MOCK_BUDDIES: Record<string, BuddyMatch> = {
  'emp-new': {
    buddy: {
      employeeId: 'emp-yemi',
      fullName: 'Yemi Okonkwo',
      title: 'Group Head — Strategy',
      department: 'Strategy',
      country: 'Nigeria',
      photoUrl: '/images/academy/sme-empowerment.png',
      slackHandle: '@yemi.okonkwo',
      matchScore: 0.94,
      reasons: [
        'Same department (Strategy)',
        'Same office (Lagos)',
        '7 years at Ecobank — strong institutional context',
        'Has buddied 3 joiners in the past 18 months, all rated 5/5',
      ],
    },
    introMessage:
      'Hi Kemi — welcome to the Strategy team! I\'m Yemi, your Day-1 buddy. I\'ve blocked 30 minutes on your calendar for 10am for a coffee. Slack me any time before then if anything is unclear.',
    buddyNotified: true,
  },
}

const MOCK_PEERS: Record<string, PeerMatch> = {
  'emp-new': {
    peers: [
      {
        employeeId: 'emp-18',
        fullName: 'Folake Adebayo',
        title: 'Talent Acquisition Manager',
        department: 'Human Resources',
        country: 'Nigeria',
        photoUrl: '/images/academy/sme-real-businesses.png',
        slackHandle: '@folake.adebayo',
        matchScore: 0.81,
        reasons: ['Both joined within last 24 months', 'Same office (Lagos)', 'Shares interest tag "strategy"'],
      },
      {
        employeeId: 'emp-3',
        fullName: 'Kwame Asante',
        title: 'Relationship Manager',
        department: 'Retail Banking',
        country: 'Ghana',
        photoUrl: '/images/academy/confident-entrepreneur.png',
        slackHandle: '@kwame.asante',
        matchScore: 0.74,
        reasons: ['Same level (Manager)', 'Different department — useful cross-pollination'],
      },
    ],
    // Day 3 at 11:00am — gives the joiner a few days to settle first
    suggestedTime: dayPlusAt(3, '11:00'),
  },
}

function dayPlusAt(daysAhead: number, hhmm: string): string {
  const d = new Date()
  d.setDate(d.getDate() + daysAhead)
  const [h, m] = hhmm.split(':').map(Number)
  d.setHours(h ?? 0, m ?? 0, 0, 0)
  return d.toISOString()
}

// ─── Public API ──────────────────────────────────────────────────────

export async function findBuddy(employeeId: string): Promise<BuddyMatch> {
  // TODO: production query employees table with scoring
  // Score = sameDept(0.4) + sameOffice(0.2) + tenureGap(0.2) + buddyHistory(0.2)
  return MOCK_BUDDIES[employeeId] ?? {
    buddy: null,
    introMessage: '',
    buddyNotified: false,
  }
}

export async function findPeers(employeeId: string, count = 2): Promise<PeerMatch> {
  const match = MOCK_PEERS[employeeId]
  if (!match) return { peers: [], suggestedTime: null }
  return { ...match, peers: match.peers.slice(0, count) }
}
