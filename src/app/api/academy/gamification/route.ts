/**
 * Academy Gamification API
 *
 * GET actions: leaderboard, participant-points, participant-badges, badges
 * POST actions: award-points, create-badge, update-badge, delete-badge, award-badge, check-badges
 *
 * Requires x-org-id header for org scoping.
 */

import { NextRequest, NextResponse } from 'next/server'
import {
  awardPoints,
  getParticipantPoints,
  createBadge,
  getBadges,
  getBadgeById,
  updateBadge,
  deleteBadge,
  awardBadge,
  getParticipantBadges,
  checkAndAwardBadges,
  getLeaderboard,
} from '@/lib/academy-gamification'

function getOrgId(request: NextRequest): string | null {
  return request.headers.get('x-org-id')
}

// ============================================================
// GET — Read operations
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) {
      return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    switch (action) {
      case 'leaderboard': {
        const academyId = searchParams.get('academyId')
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }

        const cohortId = searchParams.get('cohortId') || undefined
        const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : undefined

        const data = await getLeaderboard(orgId, academyId, { cohortId, limit })
        return NextResponse.json({ data })
      }

      case 'participant-points': {
        const participantId = searchParams.get('participantId')
        const academyId = searchParams.get('academyId')
        if (!participantId || !academyId) {
          return NextResponse.json({ error: 'participantId and academyId required' }, { status: 400 })
        }

        const data = await getParticipantPoints(orgId, participantId, academyId)
        return NextResponse.json({ data })
      }

      case 'participant-badges': {
        const participantId = searchParams.get('participantId')
        if (!participantId) {
          return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        }

        const data = await getParticipantBadges(orgId, participantId)
        return NextResponse.json({ data })
      }

      case 'badges': {
        const academyId = searchParams.get('academyId')
        if (!academyId) {
          return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        }

        const data = await getBadges(orgId, academyId)
        return NextResponse.json({ data })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use leaderboard, participant-points, participant-badges, or badges` },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('[Academy Gamification GET]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// ============================================================
// POST — Write operations
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) {
      return NextResponse.json({ error: 'Missing x-org-id header' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'award-points': {
        const { participantId, academyId, points, reason, entityId } = body
        if (!participantId || !academyId || !points || !reason) {
          return NextResponse.json(
            { error: 'participantId, academyId, points, and reason required' },
            { status: 400 },
          )
        }

        if (typeof points !== 'number' || points <= 0) {
          return NextResponse.json({ error: 'points must be a positive number' }, { status: 400 })
        }

        const data = await awardPoints(orgId, participantId, academyId, points, reason, entityId)
        return NextResponse.json({ data })
      }

      case 'create-badge': {
        const { academyId, name, description, iconUrl, iconEmoji, criteria, pointsAwarded } = body
        if (!academyId || !name) {
          return NextResponse.json({ error: 'academyId and name required' }, { status: 400 })
        }

        const data = await createBadge(orgId, {
          academyId, name, description, iconUrl, iconEmoji, criteria, pointsAwarded,
        })
        return NextResponse.json({ data }, { status: 201 })
      }

      case 'update-badge': {
        const { badgeId, name, description, iconUrl, iconEmoji, criteria, pointsAwarded, isActive } = body
        if (!badgeId) {
          return NextResponse.json({ error: 'badgeId required' }, { status: 400 })
        }

        const existing = await getBadgeById(orgId, badgeId)
        if (!existing) {
          return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
        }

        const data = await updateBadge(orgId, badgeId, {
          name, description, iconUrl, iconEmoji, criteria, pointsAwarded, isActive,
        })
        return NextResponse.json({ data })
      }

      case 'delete-badge': {
        const { badgeId } = body
        if (!badgeId) {
          return NextResponse.json({ error: 'badgeId required' }, { status: 400 })
        }

        const data = await deleteBadge(orgId, badgeId)
        if (!data) {
          return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
        }
        return NextResponse.json({ data })
      }

      case 'award-badge': {
        const { participantId, badgeId } = body
        if (!participantId || !badgeId) {
          return NextResponse.json({ error: 'participantId and badgeId required' }, { status: 400 })
        }

        const badge = await getBadgeById(orgId, badgeId)
        if (!badge) {
          return NextResponse.json({ error: 'Badge not found' }, { status: 404 })
        }

        const data = await awardBadge(orgId, participantId, badgeId)
        return NextResponse.json({ data })
      }

      case 'check-badges': {
        const { participantId, academyId } = body
        if (!participantId || !academyId) {
          return NextResponse.json({ error: 'participantId and academyId required' }, { status: 400 })
        }

        const newlyAwarded = await checkAndAwardBadges(orgId, participantId, academyId)
        return NextResponse.json({
          data: newlyAwarded,
          message: newlyAwarded.length > 0
            ? `Awarded ${newlyAwarded.length} new badge(s)`
            : 'No new badges earned',
        })
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Use award-points, create-badge, update-badge, delete-badge, award-badge, or check-badges` },
          { status: 400 },
        )
    }
  } catch (error: any) {
    console.error('[Academy Gamification POST]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
