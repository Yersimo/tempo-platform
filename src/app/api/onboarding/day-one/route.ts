/**
 * GET /api/onboarding/day-one
 *
 * Returns the composed Day-1 readiness payload for a new joiner.
 * Composes provisioning state + buddy + peer matches + Day-1 tasks
 * into a single response that powers /onboarding/day-one.
 *
 * Query params:
 *   employeeId — optional, defaults to demo joiner emp-new
 */

import { NextResponse, type NextRequest } from 'next/server'
import { getDayOneReadiness } from '@/lib/services/provisioning-orchestrator'
import { findBuddy, findPeers } from '@/lib/services/buddy-matcher'
import { DEMO_NEW_JOINER, type NewJoinerProfile } from '@/lib/policies/ecobank-new-joiner'

interface DayOneTask {
  id: string
  title: string
  description: string
  deepLink: string
  priority: number
  estimatedMinutes: number
  category: 'sign' | 'meet' | 'learn' | 'setup'
}

function buildDayOneTasks(profile: NewJoinerProfile): DayOneTask[] {
  return [
    {
      id: 'task-1-sign-handbook',
      title: 'Acknowledge the Ecobank Handbook',
      description: 'A single signature, pre-filled with your details. Two minutes.',
      deepLink: '/documents?id=ecobank-handbook',
      priority: 1,
      estimatedMinutes: 2,
      category: 'sign',
    },
    {
      id: 'task-2-meet-buddy',
      title: `Meet Yemi at 10:00 — your Day-1 buddy`,
      description: 'Coffee on the 3rd floor lounge. Yemi has the calendar invite already.',
      deepLink: '/calendar?event=day-1-buddy-coffee',
      priority: 2,
      estimatedMinutes: 30,
      category: 'meet',
    },
    {
      id: 'task-3-safety',
      title: 'Complete Information Security training',
      description: 'Required by Ecobank Group · 11 minutes · do it before you log into client systems.',
      deepLink: '/learning?course=info-security-2026',
      priority: 3,
      estimatedMinutes: 11,
      category: 'learn',
    },
  ]
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const employeeId = searchParams.get('employeeId') ?? DEMO_NEW_JOINER.id
  const profile = employeeId === DEMO_NEW_JOINER.id ? DEMO_NEW_JOINER : null

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
  }

  // Compose the three async lookups in parallel
  const [readiness, buddyMatch, peerMatch] = await Promise.all([
    getDayOneReadiness(employeeId),
    findBuddy(employeeId),
    findPeers(employeeId),
  ])

  const tasks = buildDayOneTasks(profile)

  return NextResponse.json({
    profile,
    readiness,
    buddy: buddyMatch,
    peers: peerMatch,
    tasks,
    /** Local "good morning" greeting based on current time */
    greeting: greetingFor(new Date()),
  })
}

function greetingFor(d: Date): string {
  const h = d.getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}
