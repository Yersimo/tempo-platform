/**
 * Academy Gamification Engine — Points, Badges, and Leaderboard.
 *
 * Handles point awarding, badge management, automatic badge checking,
 * and leaderboard generation for academy participants.
 *
 * All functions require orgId for RLS scoping.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, sql, inArray } from 'drizzle-orm'

// ============================================================
// CONSTANTS
// ============================================================

/** Default point values for common academy actions */
export const DEFAULT_POINTS: Record<string, number> = {
  course_completed: 100,
  assignment_graded: 0, // uses actual score from grading
  session_attended: 25,
  badge_earned: 0, // uses badge.pointsAwarded
  discussion_posted: 5,
  resource_viewed: 2,
}

// ============================================================
// POINTS
// ============================================================

/**
 * Award points to a participant. Creates an immutable ledger entry.
 * For `assignment_graded`, pass the actual score as `points`.
 * For `badge_earned`, the badge's pointsAwarded is added automatically by checkAndAwardBadges.
 */
export async function awardPoints(
  orgId: string,
  participantId: string,
  academyId: string,
  points: number,
  reason: string,
  entityId?: string,
) {
  if (points <= 0) return null

  const [row] = await db.insert(schema.academyPoints).values({
    orgId,
    participantId,
    academyId,
    points,
    reason,
    entityId: entityId || null,
  }).returning()

  return row
}

/**
 * Get a participant's total points and transaction history for an academy.
 */
export async function getParticipantPoints(
  orgId: string,
  participantId: string,
  academyId: string,
) {
  const [totalResult] = await db.select({
    total: sql<number>`COALESCE(SUM(${schema.academyPoints.points}), 0)::int`,
  }).from(schema.academyPoints)
    .where(and(
      eq(schema.academyPoints.orgId, orgId),
      eq(schema.academyPoints.participantId, participantId),
      eq(schema.academyPoints.academyId, academyId),
    ))

  const history = await db.select().from(schema.academyPoints)
    .where(and(
      eq(schema.academyPoints.orgId, orgId),
      eq(schema.academyPoints.participantId, participantId),
      eq(schema.academyPoints.academyId, academyId),
    ))
    .orderBy(desc(schema.academyPoints.createdAt))
    .limit(100)

  return {
    total: totalResult?.total || 0,
    history,
  }
}

// ============================================================
// BADGES — CRUD
// ============================================================

/**
 * Create a badge definition for an academy.
 */
export async function createBadge(orgId: string, data: {
  academyId: string
  name: string
  description?: string
  iconUrl?: string
  iconEmoji?: string
  criteria?: Record<string, unknown>
  pointsAwarded?: number
}) {
  const [row] = await db.insert(schema.academyBadges).values({
    orgId,
    academyId: data.academyId,
    name: data.name,
    description: data.description || null,
    iconUrl: data.iconUrl || null,
    iconEmoji: data.iconEmoji || null,
    criteria: data.criteria ? JSON.stringify(data.criteria) : null,
    pointsAwarded: data.pointsAwarded || 0,
    isActive: true,
  }).returning()

  return row
}

/**
 * Get all badges for an academy.
 */
export async function getBadges(orgId: string, academyId: string) {
  return db.select().from(schema.academyBadges)
    .where(and(
      eq(schema.academyBadges.orgId, orgId),
      eq(schema.academyBadges.academyId, academyId),
    ))
    .orderBy(asc(schema.academyBadges.name))
}

/**
 * Get a single badge by ID.
 */
export async function getBadgeById(orgId: string, badgeId: string) {
  const [row] = await db.select().from(schema.academyBadges)
    .where(and(
      eq(schema.academyBadges.id, badgeId),
      eq(schema.academyBadges.orgId, orgId),
    ))
  return row || null
}

/**
 * Update a badge definition.
 */
export async function updateBadge(orgId: string, badgeId: string, data: Partial<{
  name: string
  description: string
  iconUrl: string
  iconEmoji: string
  criteria: Record<string, unknown>
  pointsAwarded: number
  isActive: boolean
}>) {
  const updates: Record<string, unknown> = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.iconUrl !== undefined) updates.iconUrl = data.iconUrl
  if (data.iconEmoji !== undefined) updates.iconEmoji = data.iconEmoji
  if (data.criteria !== undefined) updates.criteria = JSON.stringify(data.criteria)
  if (data.pointsAwarded !== undefined) updates.pointsAwarded = data.pointsAwarded
  if (data.isActive !== undefined) updates.isActive = data.isActive

  if (Object.keys(updates).length === 0) return null

  const [row] = await db.update(schema.academyBadges).set(updates)
    .where(and(eq(schema.academyBadges.id, badgeId), eq(schema.academyBadges.orgId, orgId)))
    .returning()
  return row || null
}

/**
 * Delete a badge definition and all associated participant badges.
 */
export async function deleteBadge(orgId: string, badgeId: string) {
  // Cascade will handle participant_badges via FK
  const [row] = await db.delete(schema.academyBadges)
    .where(and(eq(schema.academyBadges.id, badgeId), eq(schema.academyBadges.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// BADGE AWARDING
// ============================================================

/**
 * Award a specific badge to a participant. Idempotent — won't duplicate.
 */
export async function awardBadge(orgId: string, participantId: string, badgeId: string) {
  // Check if already awarded
  const [existing] = await db.select().from(schema.academyParticipantBadges)
    .where(and(
      eq(schema.academyParticipantBadges.orgId, orgId),
      eq(schema.academyParticipantBadges.participantId, participantId),
      eq(schema.academyParticipantBadges.badgeId, badgeId),
    ))

  if (existing) return existing

  const [row] = await db.insert(schema.academyParticipantBadges).values({
    orgId,
    participantId,
    badgeId,
  }).returning()

  return row
}

/**
 * Get all badges earned by a participant.
 */
export async function getParticipantBadges(orgId: string, participantId: string) {
  const earned = await db.select().from(schema.academyParticipantBadges)
    .where(and(
      eq(schema.academyParticipantBadges.orgId, orgId),
      eq(schema.academyParticipantBadges.participantId, participantId),
    ))
    .orderBy(desc(schema.academyParticipantBadges.earnedAt))

  if (earned.length === 0) return []

  // Fetch full badge details
  const badgeIds = earned.map(e => e.badgeId)
  const badges = await db.select().from(schema.academyBadges)
    .where(and(
      eq(schema.academyBadges.orgId, orgId),
      inArray(schema.academyBadges.id, badgeIds),
    ))

  const badgeMap = new Map(badges.map(b => [b.id, b]))

  return earned.map(e => ({
    ...e,
    badge: badgeMap.get(e.badgeId) || null,
  }))
}

// ============================================================
// AUTO-CHECK BADGES
// ============================================================

interface BadgeCriteria {
  type: string
  courseId?: string
  points?: number
  coursesCompleted?: number
  sessionsAttended?: number
}

/**
 * Check all active badge criteria for an academy against a participant's progress.
 * Awards any badges whose criteria are met. Returns newly awarded badges.
 */
export async function checkAndAwardBadges(
  orgId: string,
  participantId: string,
  academyId: string,
) {
  // Get all active badges for this academy
  const badges = await db.select().from(schema.academyBadges)
    .where(and(
      eq(schema.academyBadges.orgId, orgId),
      eq(schema.academyBadges.academyId, academyId),
      eq(schema.academyBadges.isActive, true),
    ))

  if (badges.length === 0) return []

  // Get already-earned badge IDs
  const earned = await db.select({ badgeId: schema.academyParticipantBadges.badgeId })
    .from(schema.academyParticipantBadges)
    .where(and(
      eq(schema.academyParticipantBadges.orgId, orgId),
      eq(schema.academyParticipantBadges.participantId, participantId),
    ))
  const earnedSet = new Set(earned.map(e => e.badgeId))

  // Filter to un-earned badges
  const unearnedBadges = badges.filter(b => !earnedSet.has(b.id))
  if (unearnedBadges.length === 0) return []

  // Fetch participant data needed for criteria checks
  const [progress, pointsResult, rsvps] = await Promise.all([
    db.select().from(schema.academyParticipantProgress)
      .where(and(
        eq(schema.academyParticipantProgress.orgId, orgId),
        eq(schema.academyParticipantProgress.participantId, participantId),
      )),
    db.select({
      total: sql<number>`COALESCE(SUM(${schema.academyPoints.points}), 0)::int`,
    }).from(schema.academyPoints)
      .where(and(
        eq(schema.academyPoints.orgId, orgId),
        eq(schema.academyPoints.participantId, participantId),
        eq(schema.academyPoints.academyId, academyId),
      )),
    db.select().from(schema.academySessionRsvps)
      .where(and(
        eq(schema.academySessionRsvps.orgId, orgId),
        eq(schema.academySessionRsvps.participantId, participantId),
        eq(schema.academySessionRsvps.attended, true),
      )),
  ])

  const totalPoints = pointsResult[0]?.total || 0
  const completedCourses = progress.filter(p => p.status === 'completed')
  const completedCourseIds = new Set(completedCourses.map(p => p.academyCourseId))
  const sessionsAttended = rsvps.length

  const newlyAwarded: typeof badges = []

  for (const badge of unearnedBadges) {
    const criteria = (typeof badge.criteria === 'string' ? JSON.parse(badge.criteria) : badge.criteria) as BadgeCriteria | null
    if (!criteria?.type) continue

    let met = false

    switch (criteria.type) {
      case 'course_complete':
        // Participant completed a specific course
        if (criteria.courseId) {
          met = completedCourseIds.has(criteria.courseId)
        }
        break

      case 'courses_completed':
        // Participant completed N courses total
        if (criteria.coursesCompleted) {
          met = completedCourses.length >= criteria.coursesCompleted
        }
        break

      case 'all_courses_completed':
        // Participant completed all courses in the academy
        {
          const academyCourses = await db.select().from(schema.academyCourses)
            .where(and(
              eq(schema.academyCourses.orgId, orgId),
              eq(schema.academyCourses.academyId, academyId),
              eq(schema.academyCourses.isRequired, true),
            ))
          if (academyCourses.length > 0) {
            met = academyCourses.every(ac => completedCourseIds.has(ac.id))
          }
        }
        break

      case 'points_threshold':
        // Participant reached a point threshold
        if (criteria.points) {
          met = totalPoints >= criteria.points
        }
        break

      case 'sessions_attended':
        // Participant attended N sessions
        if (criteria.sessionsAttended) {
          met = sessionsAttended >= criteria.sessionsAttended
        }
        break
    }

    if (met) {
      await awardBadge(orgId, participantId, badge.id)
      newlyAwarded.push(badge)

      // Award bonus points for earning the badge
      if (badge.pointsAwarded > 0) {
        await awardPoints(orgId, participantId, academyId, badge.pointsAwarded, 'badge_earned', badge.id)
      }
    }
  }

  return newlyAwarded
}

// ============================================================
// LEADERBOARD
// ============================================================

/**
 * Get the leaderboard for an academy — participants ranked by total points.
 * Optionally filter by cohortId and limit results.
 */
export async function getLeaderboard(
  orgId: string,
  academyId: string,
  options?: { cohortId?: string; limit?: number },
) {
  const limit = Math.min(200, Math.max(1, options?.limit || 50))

  // Build participant filter conditions
  const participantConditions = [
    eq(schema.academyParticipants.orgId, orgId),
    eq(schema.academyParticipants.academyId, academyId),
    eq(schema.academyParticipants.status, 'active'),
  ]
  if (options?.cohortId) {
    participantConditions.push(eq(schema.academyParticipants.cohortId, options.cohortId))
  }

  // Get participants with their total points via subquery
  const participants = await db.select({
    participantId: schema.academyParticipants.id,
    fullName: schema.academyParticipants.fullName,
    email: schema.academyParticipants.email,
    avatarUrl: schema.academyParticipants.avatarUrl,
    cohortId: schema.academyParticipants.cohortId,
    progress: schema.academyParticipants.progress,
  }).from(schema.academyParticipants)
    .where(and(...participantConditions))

  if (participants.length === 0) return []

  const participantIds = participants.map(p => p.participantId)

  // Get total points per participant
  const pointsRows = await db.select({
    participantId: schema.academyPoints.participantId,
    totalPoints: sql<number>`COALESCE(SUM(${schema.academyPoints.points}), 0)::int`,
  }).from(schema.academyPoints)
    .where(and(
      eq(schema.academyPoints.orgId, orgId),
      eq(schema.academyPoints.academyId, academyId),
      inArray(schema.academyPoints.participantId, participantIds),
    ))
    .groupBy(schema.academyPoints.participantId)

  const pointsMap = new Map(pointsRows.map(r => [r.participantId, r.totalPoints]))

  // Get badge counts per participant
  const badgeRows = await db.select({
    participantId: schema.academyParticipantBadges.participantId,
    badgeCount: sql<number>`count(*)::int`,
  }).from(schema.academyParticipantBadges)
    .where(and(
      eq(schema.academyParticipantBadges.orgId, orgId),
      inArray(schema.academyParticipantBadges.participantId, participantIds),
    ))
    .groupBy(schema.academyParticipantBadges.participantId)

  const badgeMap = new Map(badgeRows.map(r => [r.participantId, r.badgeCount]))

  // Combine and rank
  const leaderboard = participants.map(p => ({
    participantId: p.participantId,
    fullName: p.fullName,
    email: p.email,
    avatarUrl: p.avatarUrl,
    cohortId: p.cohortId,
    progress: p.progress,
    totalPoints: pointsMap.get(p.participantId) || 0,
    badgeCount: badgeMap.get(p.participantId) || 0,
    rank: 0, // computed below
  }))

  // Sort by points descending, then by badge count descending
  leaderboard.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints
    return b.badgeCount - a.badgeCount
  })

  // Assign ranks (handle ties: same points + badges = same rank)
  let currentRank = 1
  for (let i = 0; i < leaderboard.length; i++) {
    if (i > 0 &&
        leaderboard[i].totalPoints === leaderboard[i - 1].totalPoints &&
        leaderboard[i].badgeCount === leaderboard[i - 1].badgeCount) {
      leaderboard[i].rank = leaderboard[i - 1].rank
    } else {
      leaderboard[i].rank = currentRank
    }
    currentRank++
  }

  return leaderboard.slice(0, limit)
}
