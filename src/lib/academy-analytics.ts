/**
 * Academy Analytics Engine — Comprehensive analytics beyond basic dashboards.
 *
 * Provides deep-dive analytics for academies: completion rates, engagement
 * trends, cohort comparisons, participant-level insights, course drop-off
 * analysis, and CSV export.
 *
 * All functions require orgId for RLS. Uses Drizzle ORM with proper joins
 * and aggregations against the academy_* tables.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, sql, gte, lte, between, isNull, isNotNull } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

interface DateRange {
  from?: string // ISO date string YYYY-MM-DD
  to?: string   // ISO date string YYYY-MM-DD
}

interface AnalyticsOverview {
  totalParticipants: number
  activeParticipants: number
  completedParticipants: number
  droppedParticipants: number
  completionRate: number
  averageProgress: number
  averageScore: number | null
  totalTimeSpentMinutes: number
  totalCourses: number
  totalAssignments: number
  totalSubmissions: number
  totalCertificatesIssued: number
  engagementTrends: {
    newEnrollmentsLast7d: number
    newEnrollmentsLast30d: number
    completionsLast7d: number
    completionsLast30d: number
    activeUsersLast7d: number
  }
}

interface CohortStats {
  cohortId: string
  cohortName: string
  status: string
  startDate: string
  endDate: string
  participantCount: number
  avgProgress: number
  avgScore: number | null
  completionRate: number
  totalTimeSpentMinutes: number
}

interface ParticipantAnalyticsResult {
  participant: {
    id: string
    fullName: string
    email: string
    status: string
    progress: number
    enrolledDate: string
    lastActiveAt: string | null
    cohortId: string | null
  }
  courseProgress: Array<{
    academyCourseId: string
    courseId: string
    moduleNumber: number
    status: string
    progress: number
    score: number | null
    timeSpentMinutes: number
    startedAt: string | null
    completedAt: string | null
  }>
  submissions: Array<{
    assignmentId: string
    assignmentTitle: string
    status: string
    score: number | null
    maxScore: number
    submittedAt: string | null
    gradedAt: string | null
  }>
  strengths: string[]
  weaknesses: string[]
  avgScore: number | null
  totalTimeSpentMinutes: number
  daysActive: number
}

interface CourseAnalyticsResult {
  courseId: string
  academyCourseId: string
  moduleNumber: number
  isRequired: boolean
  totalEnrolled: number
  notStarted: number
  inProgress: number
  completed: number
  completionRate: number
  avgScore: number | null
  avgTimeSpentMinutes: number
  dropOffPoints: Array<{
    progressBucket: string
    count: number
  }>
}

interface EngagementPoint {
  period: string
  activeUsers: number
  completions: number
  submissions: number
  newEnrollments: number
}

interface TopPerformer {
  participantId: string
  fullName: string
  email: string
  cohortId: string | null
  progress: number
  avgScore: number | null
  totalTimeSpentMinutes: number
  coursesCompleted: number
  compositeScore: number
}

interface AtRiskParticipant {
  participantId: string
  fullName: string
  email: string
  cohortId: string | null
  progress: number
  lastActiveAt: string | null
  daysSinceActive: number | null
  riskReason: string
}

// ============================================================
// HELPER: Date filtering
// ============================================================

function buildDateConditions(table: { createdAt: any }, range?: DateRange) {
  const conditions: any[] = []
  if (range?.from) conditions.push(gte(table.createdAt, new Date(range.from)))
  if (range?.to) conditions.push(lte(table.createdAt, new Date(range.to + 'T23:59:59.999Z')))
  return conditions
}

function daysAgo(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

// ============================================================
// 1. FULL ANALYTICS OVERVIEW
// ============================================================

export async function getAcademyAnalytics(
  orgId: string,
  academyId: string,
  dateRange?: DateRange,
): Promise<AnalyticsOverview> {
  const orgCond = eq(schema.academyParticipants.orgId, orgId)
  const acadCond = eq(schema.academyParticipants.academyId, academyId)
  const baseWhere = and(orgCond, acadCond)

  // Core participant counts
  const [
    participantCounts,
    avgProgressResult,
    courseCount,
    assignmentCount,
    submissionCount,
    certCount,
    scoreResult,
    timeResult,
  ] = await Promise.all([
    db.select({
      status: schema.academyParticipants.status,
      count: sql<number>`count(*)::int`,
    })
      .from(schema.academyParticipants)
      .where(baseWhere)
      .groupBy(schema.academyParticipants.status),

    db.select({
      avg: sql<number>`COALESCE(AVG(${schema.academyParticipants.progress}), 0)::int`,
    })
      .from(schema.academyParticipants)
      .where(baseWhere),

    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyCourses)
      .where(and(eq(schema.academyCourses.orgId, orgId), eq(schema.academyCourses.academyId, academyId))),

    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyAssignments)
      .where(and(eq(schema.academyAssignments.orgId, orgId), eq(schema.academyAssignments.academyId, academyId))),

    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyAssignmentSubmissions)
      .where(eq(schema.academyAssignmentSubmissions.orgId, orgId))
      .innerJoin(
        schema.academyAssignments,
        and(
          eq(schema.academyAssignmentSubmissions.assignmentId, schema.academyAssignments.id),
          eq(schema.academyAssignments.academyId, academyId),
        ),
      ),

    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyCertificates)
      .where(and(
        eq(schema.academyCertificates.orgId, orgId),
        eq(schema.academyCertificates.academyId, academyId),
        eq(schema.academyCertificates.status, 'earned'),
      )),

    db.select({
      avg: sql<number>`AVG(${schema.academyParticipantProgress.score})`,
    })
      .from(schema.academyParticipantProgress)
      .where(eq(schema.academyParticipantProgress.orgId, orgId))
      .innerJoin(
        schema.academyCourses,
        and(
          eq(schema.academyParticipantProgress.academyCourseId, schema.academyCourses.id),
          eq(schema.academyCourses.academyId, academyId),
        ),
      ),

    db.select({
      total: sql<number>`COALESCE(SUM(${schema.academyParticipantProgress.timeSpentMinutes}), 0)::int`,
    })
      .from(schema.academyParticipantProgress)
      .where(eq(schema.academyParticipantProgress.orgId, orgId))
      .innerJoin(
        schema.academyCourses,
        and(
          eq(schema.academyParticipantProgress.academyCourseId, schema.academyCourses.id),
          eq(schema.academyCourses.academyId, academyId),
        ),
      ),
  ])

  const statusMap: Record<string, number> = {}
  let totalParticipants = 0
  for (const row of participantCounts) {
    statusMap[row.status] = row.count
    totalParticipants += row.count
  }

  const completedParticipants = statusMap['completed'] || 0
  const activeParticipants = statusMap['active'] || 0
  const droppedParticipants = statusMap['dropped'] || 0

  // Engagement trends
  const now7 = daysAgo(7)
  const now30 = daysAgo(30)

  const [enroll7, enroll30, comp7, comp30, active7] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipants)
      .where(and(baseWhere, gte(schema.academyParticipants.createdAt, now7))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipants)
      .where(and(baseWhere, gte(schema.academyParticipants.createdAt, now30))),
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipantProgress)
      .where(and(
        eq(schema.academyParticipantProgress.orgId, orgId),
        eq(schema.academyParticipantProgress.status, 'completed'),
        gte(schema.academyParticipantProgress.completedAt, now7),
      )),
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipantProgress)
      .where(and(
        eq(schema.academyParticipantProgress.orgId, orgId),
        eq(schema.academyParticipantProgress.status, 'completed'),
        gte(schema.academyParticipantProgress.completedAt, now30),
      )),
    db.select({ count: sql<number>`count(DISTINCT ${schema.academyParticipants.id})::int` })
      .from(schema.academyParticipants)
      .where(and(baseWhere, gte(schema.academyParticipants.lastActiveAt, now7))),
  ])

  return {
    totalParticipants,
    activeParticipants,
    completedParticipants,
    droppedParticipants,
    completionRate: totalParticipants > 0 ? Math.round((completedParticipants / totalParticipants) * 100) : 0,
    averageProgress: avgProgressResult[0]?.avg || 0,
    averageScore: scoreResult[0]?.avg != null ? Math.round(scoreResult[0].avg) : null,
    totalTimeSpentMinutes: timeResult[0]?.total || 0,
    totalCourses: courseCount[0]?.count || 0,
    totalAssignments: assignmentCount[0]?.count || 0,
    totalSubmissions: submissionCount[0]?.count || 0,
    totalCertificatesIssued: certCount[0]?.count || 0,
    engagementTrends: {
      newEnrollmentsLast7d: enroll7[0]?.count || 0,
      newEnrollmentsLast30d: enroll30[0]?.count || 0,
      completionsLast7d: comp7[0]?.count || 0,
      completionsLast30d: comp30[0]?.count || 0,
      activeUsersLast7d: active7[0]?.count || 0,
    },
  }
}

// ============================================================
// 2. COHORT COMPARISON
// ============================================================

export async function getCohortComparison(
  orgId: string,
  academyId: string,
): Promise<CohortStats[]> {
  const cohorts = await db.select()
    .from(schema.academyCohorts)
    .where(and(eq(schema.academyCohorts.orgId, orgId), eq(schema.academyCohorts.academyId, academyId)))
    .orderBy(asc(schema.academyCohorts.startDate))

  const results: CohortStats[] = []

  for (const cohort of cohorts) {
    const cohortWhere = and(
      eq(schema.academyParticipants.orgId, orgId),
      eq(schema.academyParticipants.academyId, academyId),
      eq(schema.academyParticipants.cohortId, cohort.id),
    )

    const [countResult, avgResult, completedResult, timeResult, scoreResult] = await Promise.all([
      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.academyParticipants)
        .where(cohortWhere),

      db.select({ avg: sql<number>`COALESCE(AVG(${schema.academyParticipants.progress}), 0)::int` })
        .from(schema.academyParticipants)
        .where(cohortWhere),

      db.select({ count: sql<number>`count(*)::int` })
        .from(schema.academyParticipants)
        .where(and(cohortWhere, eq(schema.academyParticipants.status, 'completed'))),

      db.select({
        total: sql<number>`COALESCE(SUM(${schema.academyParticipantProgress.timeSpentMinutes}), 0)::int`,
      })
        .from(schema.academyParticipantProgress)
        .where(eq(schema.academyParticipantProgress.orgId, orgId))
        .innerJoin(
          schema.academyParticipants,
          and(
            eq(schema.academyParticipantProgress.participantId, schema.academyParticipants.id),
            eq(schema.academyParticipants.cohortId, cohort.id),
          ),
        ),

      db.select({
        avg: sql<number>`AVG(${schema.academyParticipantProgress.score})`,
      })
        .from(schema.academyParticipantProgress)
        .where(and(
          eq(schema.academyParticipantProgress.orgId, orgId),
          isNotNull(schema.academyParticipantProgress.score),
        ))
        .innerJoin(
          schema.academyParticipants,
          and(
            eq(schema.academyParticipantProgress.participantId, schema.academyParticipants.id),
            eq(schema.academyParticipants.cohortId, cohort.id),
          ),
        ),
    ])

    const total = countResult[0]?.count || 0
    const completed = completedResult[0]?.count || 0

    results.push({
      cohortId: cohort.id,
      cohortName: cohort.name,
      status: cohort.status,
      startDate: cohort.startDate,
      endDate: cohort.endDate,
      participantCount: total,
      avgProgress: avgResult[0]?.avg || 0,
      avgScore: scoreResult[0]?.avg != null ? Math.round(scoreResult[0].avg) : null,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      totalTimeSpentMinutes: timeResult[0]?.total || 0,
    })
  }

  return results
}

// ============================================================
// 3. PARTICIPANT ANALYTICS (individual deep dive)
// ============================================================

export async function getParticipantAnalytics(
  orgId: string,
  participantId: string,
): Promise<ParticipantAnalyticsResult | null> {
  const [participant] = await db.select()
    .from(schema.academyParticipants)
    .where(and(
      eq(schema.academyParticipants.orgId, orgId),
      eq(schema.academyParticipants.id, participantId),
    ))

  if (!participant) return null

  // Course progress with academy_courses join for module info
  const progressRows = await db.select({
    id: schema.academyParticipantProgress.id,
    academyCourseId: schema.academyParticipantProgress.academyCourseId,
    status: schema.academyParticipantProgress.status,
    progress: schema.academyParticipantProgress.progress,
    score: schema.academyParticipantProgress.score,
    timeSpentMinutes: schema.academyParticipantProgress.timeSpentMinutes,
    startedAt: schema.academyParticipantProgress.startedAt,
    completedAt: schema.academyParticipantProgress.completedAt,
    courseId: schema.academyCourses.courseId,
    moduleNumber: schema.academyCourses.moduleNumber,
  })
    .from(schema.academyParticipantProgress)
    .where(and(
      eq(schema.academyParticipantProgress.orgId, orgId),
      eq(schema.academyParticipantProgress.participantId, participantId),
    ))
    .innerJoin(
      schema.academyCourses,
      eq(schema.academyParticipantProgress.academyCourseId, schema.academyCourses.id),
    )
    .orderBy(asc(schema.academyCourses.moduleNumber))

  // Assignment submissions
  const submissions = await db.select({
    assignmentId: schema.academyAssignmentSubmissions.assignmentId,
    status: schema.academyAssignmentSubmissions.status,
    score: schema.academyAssignmentSubmissions.score,
    submittedAt: schema.academyAssignmentSubmissions.submittedAt,
    gradedAt: schema.academyAssignmentSubmissions.gradedAt,
    assignmentTitle: schema.academyAssignments.title,
    maxScore: schema.academyAssignments.maxScore,
  })
    .from(schema.academyAssignmentSubmissions)
    .where(and(
      eq(schema.academyAssignmentSubmissions.orgId, orgId),
      eq(schema.academyAssignmentSubmissions.participantId, participantId),
    ))
    .innerJoin(
      schema.academyAssignments,
      eq(schema.academyAssignmentSubmissions.assignmentId, schema.academyAssignments.id),
    )
    .orderBy(desc(schema.academyAssignmentSubmissions.submittedAt))

  // Compute strengths/weaknesses based on scores
  const scoredCourses = progressRows.filter(r => r.score != null)
  const sortedByScore = [...scoredCourses].sort((a, b) => (b.score || 0) - (a.score || 0))
  const strengths = sortedByScore.slice(0, 3).map(r => `Module ${r.moduleNumber} (score: ${r.score})`)
  const weaknesses = sortedByScore.slice(-3).reverse().map(r => `Module ${r.moduleNumber} (score: ${r.score})`)

  const scores = scoredCourses.map(r => r.score!).filter(Boolean)
  const avgScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  const totalTime = progressRows.reduce((sum, r) => sum + (r.timeSpentMinutes || 0), 0)

  // Days active: count distinct days where lastActiveAt changed
  const enrolledDate = new Date(participant.enrolledDate)
  const lastActive = participant.lastActiveAt ? new Date(participant.lastActiveAt) : new Date()
  const daysActive = Math.max(1, Math.ceil((lastActive.getTime() - enrolledDate.getTime()) / (1000 * 60 * 60 * 24)))

  return {
    participant: {
      id: participant.id,
      fullName: participant.fullName,
      email: participant.email,
      status: participant.status,
      progress: participant.progress,
      enrolledDate: participant.enrolledDate,
      lastActiveAt: participant.lastActiveAt?.toISOString() || null,
      cohortId: participant.cohortId,
    },
    courseProgress: progressRows.map(r => ({
      academyCourseId: r.academyCourseId,
      courseId: r.courseId,
      moduleNumber: r.moduleNumber,
      status: r.status,
      progress: r.progress,
      score: r.score,
      timeSpentMinutes: r.timeSpentMinutes,
      startedAt: r.startedAt?.toISOString() || null,
      completedAt: r.completedAt?.toISOString() || null,
    })),
    submissions: submissions.map(s => ({
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignmentTitle,
      status: s.status,
      score: s.score,
      maxScore: s.maxScore,
      submittedAt: s.submittedAt?.toISOString() || null,
      gradedAt: s.gradedAt?.toISOString() || null,
    })),
    strengths,
    weaknesses,
    avgScore,
    totalTimeSpentMinutes: totalTime,
    daysActive,
  }
}

// ============================================================
// 4. COURSE ANALYTICS
// ============================================================

export async function getCourseAnalytics(
  orgId: string,
  academyId: string,
  courseId: string,
): Promise<CourseAnalyticsResult | null> {
  // Find the academy_course entry
  const [academyCourse] = await db.select()
    .from(schema.academyCourses)
    .where(and(
      eq(schema.academyCourses.orgId, orgId),
      eq(schema.academyCourses.academyId, academyId),
      eq(schema.academyCourses.courseId, courseId),
    ))

  if (!academyCourse) return null

  // Get progress stats for this course
  const progressWhere = and(
    eq(schema.academyParticipantProgress.orgId, orgId),
    eq(schema.academyParticipantProgress.academyCourseId, academyCourse.id),
  )

  const [statusCounts, avgResult, timeResult, totalEnrolled] = await Promise.all([
    db.select({
      status: schema.academyParticipantProgress.status,
      count: sql<number>`count(*)::int`,
    })
      .from(schema.academyParticipantProgress)
      .where(progressWhere)
      .groupBy(schema.academyParticipantProgress.status),

    db.select({ avg: sql<number>`AVG(${schema.academyParticipantProgress.score})` })
      .from(schema.academyParticipantProgress)
      .where(and(progressWhere, isNotNull(schema.academyParticipantProgress.score))),

    db.select({
      avg: sql<number>`COALESCE(AVG(${schema.academyParticipantProgress.timeSpentMinutes}), 0)::int`,
    })
      .from(schema.academyParticipantProgress)
      .where(progressWhere),

    // Total enrolled = participants in the academy
    db.select({ count: sql<number>`count(*)::int` })
      .from(schema.academyParticipants)
      .where(and(
        eq(schema.academyParticipants.orgId, orgId),
        eq(schema.academyParticipants.academyId, academyId),
      )),
  ])

  const statusMap: Record<string, number> = {}
  for (const row of statusCounts) statusMap[row.status] = row.count

  const notStarted = statusMap['not_started'] || 0
  const inProgress = statusMap['in_progress'] || 0
  const completed = statusMap['completed'] || 0
  const total = totalEnrolled[0]?.count || 0

  // Drop-off analysis: bucket progress into ranges
  const dropOffData = await db.select({
    bucket: sql<string>`
      CASE
        WHEN ${schema.academyParticipantProgress.progress} = 0 THEN '0%'
        WHEN ${schema.academyParticipantProgress.progress} BETWEEN 1 AND 25 THEN '1-25%'
        WHEN ${schema.academyParticipantProgress.progress} BETWEEN 26 AND 50 THEN '26-50%'
        WHEN ${schema.academyParticipantProgress.progress} BETWEEN 51 AND 75 THEN '51-75%'
        WHEN ${schema.academyParticipantProgress.progress} BETWEEN 76 AND 99 THEN '76-99%'
        ELSE '100%'
      END`,
    count: sql<number>`count(*)::int`,
  })
    .from(schema.academyParticipantProgress)
    .where(and(progressWhere, sql`${schema.academyParticipantProgress.status} != 'completed'`))
    .groupBy(sql`1`)
    .orderBy(sql`1`)

  return {
    courseId,
    academyCourseId: academyCourse.id,
    moduleNumber: academyCourse.moduleNumber,
    isRequired: academyCourse.isRequired,
    totalEnrolled: total,
    notStarted,
    inProgress,
    completed,
    completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    avgScore: avgResult[0]?.avg != null ? Math.round(avgResult[0].avg) : null,
    avgTimeSpentMinutes: timeResult[0]?.avg || 0,
    dropOffPoints: dropOffData.map(d => ({
      progressBucket: d.bucket,
      count: d.count,
    })),
  }
}

// ============================================================
// 5. ENGAGEMENT TIMELINE
// ============================================================

export async function getEngagementTimeline(
  orgId: string,
  academyId: string,
  period: 'daily' | 'weekly' | 'monthly' = 'daily',
): Promise<EngagementPoint[]> {
  const truncFn = period === 'daily'
    ? sql`date_trunc('day', t.ts)`
    : period === 'weekly'
      ? sql`date_trunc('week', t.ts)`
      : sql`date_trunc('month', t.ts)`

  // Use a CTE approach to compute engagement per period
  // Active users: participants with lastActiveAt in period
  // Completions: progress records completed in period
  // Submissions: assignment submissions in period
  // New enrollments: participants created in period

  const dateCol = period === 'daily' ? '30 days' : period === 'weekly' ? '12 weeks' : '12 months'

  const result = await db.execute(sql`
    WITH periods AS (
      SELECT generate_series(
        date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, NOW() - interval '${sql.raw(dateCol)}'),
        date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, NOW()),
        interval '1 ${sql.raw(period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month')}'
      ) AS period_start
    ),
    active_users AS (
      SELECT date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, last_active_at) AS p,
             count(DISTINCT id)::int AS cnt
      FROM academy_participants
      WHERE org_id = ${orgId} AND academy_id = ${academyId} AND last_active_at IS NOT NULL
      GROUP BY 1
    ),
    completions AS (
      SELECT date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, app.completed_at) AS p,
             count(*)::int AS cnt
      FROM academy_participant_progress app
      JOIN academy_courses ac ON app.academy_course_id = ac.id
      WHERE app.org_id = ${orgId} AND ac.academy_id = ${academyId} AND app.status = 'completed' AND app.completed_at IS NOT NULL
      GROUP BY 1
    ),
    subs AS (
      SELECT date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, asub.submitted_at) AS p,
             count(*)::int AS cnt
      FROM academy_assignment_submissions asub
      JOIN academy_assignments aa ON asub.assignment_id = aa.id
      WHERE asub.org_id = ${orgId} AND aa.academy_id = ${academyId} AND asub.submitted_at IS NOT NULL
      GROUP BY 1
    ),
    enrollments AS (
      SELECT date_trunc(${period === 'daily' ? 'day' : period === 'weekly' ? 'week' : 'month'}, created_at) AS p,
             count(*)::int AS cnt
      FROM academy_participants
      WHERE org_id = ${orgId} AND academy_id = ${academyId}
      GROUP BY 1
    )
    SELECT
      periods.period_start::text AS period,
      COALESCE(au.cnt, 0)::int AS active_users,
      COALESCE(c.cnt, 0)::int AS completions,
      COALESCE(s.cnt, 0)::int AS submissions,
      COALESCE(e.cnt, 0)::int AS new_enrollments
    FROM periods
    LEFT JOIN active_users au ON au.p = periods.period_start
    LEFT JOIN completions c ON c.p = periods.period_start
    LEFT JOIN subs s ON s.p = periods.period_start
    LEFT JOIN enrollments e ON e.p = periods.period_start
    ORDER BY periods.period_start
  `)

  return (result.rows as any[]).map(r => ({
    period: r.period,
    activeUsers: r.active_users,
    completions: r.completions,
    submissions: r.submissions,
    newEnrollments: r.new_enrollments,
  }))
}

// ============================================================
// 6. TOP PERFORMERS
// ============================================================

export async function getTopPerformers(
  orgId: string,
  academyId: string,
  limit: number = 10,
): Promise<TopPerformer[]> {
  // Composite score = (progress * 0.4) + (avg_score * 0.4) + (courses_completed_pct * 0.2)
  const result = await db.execute(sql`
    WITH participant_stats AS (
      SELECT
        p.id AS participant_id,
        p.full_name,
        p.email,
        p.cohort_id,
        p.progress,
        COALESCE(AVG(pp.score), 0) AS avg_score,
        COALESCE(SUM(pp.time_spent_minutes), 0)::int AS total_time,
        count(CASE WHEN pp.status = 'completed' THEN 1 END)::int AS courses_completed,
        count(pp.id)::int AS total_courses
      FROM academy_participants p
      LEFT JOIN academy_participant_progress pp ON pp.participant_id = p.id AND pp.org_id = p.org_id
      WHERE p.org_id = ${orgId}
        AND p.academy_id = ${academyId}
        AND p.status IN ('active', 'completed')
      GROUP BY p.id, p.full_name, p.email, p.cohort_id, p.progress
    )
    SELECT *,
      (progress * 0.4
       + COALESCE(avg_score, 0) * 0.4
       + CASE WHEN total_courses > 0 THEN (courses_completed::float / total_courses * 100) * 0.2 ELSE 0 END
      )::int AS composite_score
    FROM participant_stats
    ORDER BY composite_score DESC
    LIMIT ${limit}
  `)

  return (result.rows as any[]).map(r => ({
    participantId: r.participant_id,
    fullName: r.full_name,
    email: r.email,
    cohortId: r.cohort_id,
    progress: r.progress,
    avgScore: r.avg_score != null ? Math.round(r.avg_score) : null,
    totalTimeSpentMinutes: r.total_time,
    coursesCompleted: r.courses_completed,
    compositeScore: r.composite_score,
  }))
}

// ============================================================
// 7. AT-RISK PARTICIPANTS
// ============================================================

export async function getAtRiskParticipants(
  orgId: string,
  academyId: string,
): Promise<AtRiskParticipant[]> {
  // At-risk criteria:
  // 1. Inactive > 7 days (has lastActiveAt but it's old)
  // 2. Progress < 20% and enrolled > 14 days ago
  // 3. Status = 'inactive'
  const sevenDaysAgo = daysAgo(7)
  const fourteenDaysAgo = daysAgo(14)

  const result = await db.execute(sql`
    SELECT
      id AS participant_id,
      full_name,
      email,
      cohort_id,
      progress,
      last_active_at,
      CASE
        WHEN last_active_at IS NOT NULL
          THEN EXTRACT(EPOCH FROM (NOW() - last_active_at)) / 86400
        ELSE NULL
      END::int AS days_since_active,
      CASE
        WHEN status = 'inactive' THEN 'Status is inactive'
        WHEN last_active_at IS NOT NULL AND last_active_at < ${sevenDaysAgo}
          THEN 'Inactive for more than 7 days'
        WHEN last_active_at IS NULL AND created_at < ${sevenDaysAgo}
          THEN 'Never active since enrollment'
        WHEN progress < 20 AND created_at < ${fourteenDaysAgo}
          THEN 'Low progress after 14+ days'
        ELSE 'Low engagement'
      END AS risk_reason
    FROM academy_participants
    WHERE org_id = ${orgId}
      AND academy_id = ${academyId}
      AND status NOT IN ('completed', 'dropped')
      AND (
        status = 'inactive'
        OR (last_active_at IS NOT NULL AND last_active_at < ${sevenDaysAgo})
        OR (last_active_at IS NULL AND created_at < ${sevenDaysAgo})
        OR (progress < 20 AND created_at < ${fourteenDaysAgo})
      )
    ORDER BY
      CASE WHEN last_active_at IS NULL THEN 1 ELSE 0 END DESC,
      last_active_at ASC NULLS FIRST,
      progress ASC
  `)

  return (result.rows as any[]).map(r => ({
    participantId: r.participant_id,
    fullName: r.full_name,
    email: r.email,
    cohortId: r.cohort_id,
    progress: r.progress,
    lastActiveAt: r.last_active_at?.toISOString?.() || r.last_active_at || null,
    daysSinceActive: r.days_since_active,
    riskReason: r.risk_reason,
  }))
}

// ============================================================
// 8. CSV EXPORT
// ============================================================

type ReportType = 'overview' | 'participants' | 'progress' | 'submissions' | 'cohorts'

export async function exportAnalyticsCSV(
  orgId: string,
  academyId: string,
  reportType: ReportType,
): Promise<{ filename: string; headers: string[]; rows: string[][] }> {
  const timestamp = new Date().toISOString().slice(0, 10)

  switch (reportType) {
    case 'participants': {
      const participants = await db.select()
        .from(schema.academyParticipants)
        .where(and(
          eq(schema.academyParticipants.orgId, orgId),
          eq(schema.academyParticipants.academyId, academyId),
        ))
        .orderBy(asc(schema.academyParticipants.fullName))

      return {
        filename: `academy-participants-${timestamp}.csv`,
        headers: ['Name', 'Email', 'Business', 'Country', 'Status', 'Progress', 'Enrolled Date', 'Last Active'],
        rows: participants.map(p => [
          p.fullName,
          p.email,
          p.businessName || '',
          p.country || '',
          p.status,
          `${p.progress}%`,
          p.enrolledDate,
          p.lastActiveAt?.toISOString() || '',
        ]),
      }
    }

    case 'progress': {
      const progress = await db.select({
        participantName: schema.academyParticipants.fullName,
        participantEmail: schema.academyParticipants.email,
        moduleNumber: schema.academyCourses.moduleNumber,
        courseId: schema.academyCourses.courseId,
        status: schema.academyParticipantProgress.status,
        progress: schema.academyParticipantProgress.progress,
        score: schema.academyParticipantProgress.score,
        timeSpent: schema.academyParticipantProgress.timeSpentMinutes,
        startedAt: schema.academyParticipantProgress.startedAt,
        completedAt: schema.academyParticipantProgress.completedAt,
      })
        .from(schema.academyParticipantProgress)
        .where(eq(schema.academyParticipantProgress.orgId, orgId))
        .innerJoin(
          schema.academyCourses,
          and(
            eq(schema.academyParticipantProgress.academyCourseId, schema.academyCourses.id),
            eq(schema.academyCourses.academyId, academyId),
          ),
        )
        .innerJoin(
          schema.academyParticipants,
          eq(schema.academyParticipantProgress.participantId, schema.academyParticipants.id),
        )
        .orderBy(asc(schema.academyParticipants.fullName), asc(schema.academyCourses.moduleNumber))

      return {
        filename: `academy-progress-${timestamp}.csv`,
        headers: ['Participant', 'Email', 'Module #', 'Status', 'Progress', 'Score', 'Time (min)', 'Started', 'Completed'],
        rows: progress.map(r => [
          r.participantName,
          r.participantEmail,
          String(r.moduleNumber),
          r.status,
          `${r.progress}%`,
          r.score != null ? String(r.score) : '',
          String(r.timeSpent),
          r.startedAt?.toISOString() || '',
          r.completedAt?.toISOString() || '',
        ]),
      }
    }

    case 'submissions': {
      const subs = await db.select({
        participantName: schema.academyParticipants.fullName,
        participantEmail: schema.academyParticipants.email,
        assignmentTitle: schema.academyAssignments.title,
        status: schema.academyAssignmentSubmissions.status,
        score: schema.academyAssignmentSubmissions.score,
        maxScore: schema.academyAssignments.maxScore,
        submittedAt: schema.academyAssignmentSubmissions.submittedAt,
        gradedAt: schema.academyAssignmentSubmissions.gradedAt,
        feedback: schema.academyAssignmentSubmissions.feedback,
      })
        .from(schema.academyAssignmentSubmissions)
        .where(eq(schema.academyAssignmentSubmissions.orgId, orgId))
        .innerJoin(
          schema.academyAssignments,
          and(
            eq(schema.academyAssignmentSubmissions.assignmentId, schema.academyAssignments.id),
            eq(schema.academyAssignments.academyId, academyId),
          ),
        )
        .innerJoin(
          schema.academyParticipants,
          eq(schema.academyAssignmentSubmissions.participantId, schema.academyParticipants.id),
        )
        .orderBy(desc(schema.academyAssignmentSubmissions.submittedAt))

      return {
        filename: `academy-submissions-${timestamp}.csv`,
        headers: ['Participant', 'Email', 'Assignment', 'Status', 'Score', 'Max Score', 'Submitted', 'Graded', 'Feedback'],
        rows: subs.map(s => [
          s.participantName,
          s.participantEmail,
          s.assignmentTitle,
          s.status,
          s.score != null ? String(s.score) : '',
          String(s.maxScore),
          s.submittedAt?.toISOString() || '',
          s.gradedAt?.toISOString() || '',
          s.feedback || '',
        ]),
      }
    }

    case 'cohorts': {
      const cohortData = await getCohortComparison(orgId, academyId)
      return {
        filename: `academy-cohorts-${timestamp}.csv`,
        headers: ['Cohort', 'Status', 'Start Date', 'End Date', 'Participants', 'Avg Progress', 'Avg Score', 'Completion Rate', 'Total Time (min)'],
        rows: cohortData.map(c => [
          c.cohortName,
          c.status,
          c.startDate,
          c.endDate,
          String(c.participantCount),
          `${c.avgProgress}%`,
          c.avgScore != null ? String(c.avgScore) : '',
          `${c.completionRate}%`,
          String(c.totalTimeSpentMinutes),
        ]),
      }
    }

    case 'overview':
    default: {
      const overview = await getAcademyAnalytics(orgId, academyId)
      return {
        filename: `academy-overview-${timestamp}.csv`,
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Participants', String(overview.totalParticipants)],
          ['Active Participants', String(overview.activeParticipants)],
          ['Completed Participants', String(overview.completedParticipants)],
          ['Dropped Participants', String(overview.droppedParticipants)],
          ['Completion Rate', `${overview.completionRate}%`],
          ['Average Progress', `${overview.averageProgress}%`],
          ['Average Score', overview.averageScore != null ? String(overview.averageScore) : 'N/A'],
          ['Total Time Spent (min)', String(overview.totalTimeSpentMinutes)],
          ['Total Courses', String(overview.totalCourses)],
          ['Total Assignments', String(overview.totalAssignments)],
          ['Total Submissions', String(overview.totalSubmissions)],
          ['Certificates Issued', String(overview.totalCertificatesIssued)],
          ['New Enrollments (7d)', String(overview.engagementTrends.newEnrollmentsLast7d)],
          ['New Enrollments (30d)', String(overview.engagementTrends.newEnrollmentsLast30d)],
          ['Completions (7d)', String(overview.engagementTrends.completionsLast7d)],
          ['Completions (30d)', String(overview.engagementTrends.completionsLast30d)],
          ['Active Users (7d)', String(overview.engagementTrends.activeUsersLast7d)],
        ],
      }
    }
  }
}
