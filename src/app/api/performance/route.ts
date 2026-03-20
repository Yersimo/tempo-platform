import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'
import { dispatchNotification } from '@/lib/services/notification-dispatcher'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ReviewLifecycleStatus =
  | 'self_review'
  | 'pending_manager'
  | 'pending_calibration'
  | 'calibrated'
  | 'shared'

/** Roles with elevated performance-management permissions. */
const ADMIN_ROLES = new Set(['owner', 'admin', 'hrbp'])

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getEmployee(orgId: string, employeeId: string) {
  const [emp] = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
    .limit(1)
  return emp ?? null
}

async function getActiveCycle(orgId: string) {
  const [cycle] = await db
    .select()
    .from(schema.reviewCycles)
    .where(and(eq(schema.reviewCycles.orgId, orgId), eq(schema.reviewCycles.status, 'active')))
    .orderBy(desc(schema.reviewCycles.createdAt))
    .limit(1)
  return cycle ?? null
}

function isAdmin(role: string): boolean {
  return ADMIN_ROLES.has(role)
}

/**
 * Map the lifecycle status string used by this API to the underlying
 * `review_status` enum values stored in the DB.
 *
 * DB enum: 'pending' | 'in_progress' | 'submitted' | 'completed'
 *
 * We repurpose these four values for the richer lifecycle:
 *   self_review        → 'pending'           (awaiting self-assessment)
 *   pending_manager    → 'in_progress'       (self done, manager next)
 *   pending_calibration→ 'submitted'         (manager done, awaiting cal)
 *   calibrated         → 'completed'         (calibrated, not yet shared)
 *   shared             → 'completed'         (shared – distinguished via acknowledgedAt)
 */
function lifecycleToDbStatus(lifecycle: ReviewLifecycleStatus): 'pending' | 'in_progress' | 'submitted' | 'completed' {
  switch (lifecycle) {
    case 'self_review':
      return 'pending'
    case 'pending_manager':
      return 'in_progress'
    case 'pending_calibration':
      return 'submitted'
    case 'calibrated':
    case 'shared':
      return 'completed'
  }
}

function dbStatusToLifecycle(
  dbStatus: string,
  acknowledgedAt: Date | null,
): ReviewLifecycleStatus {
  switch (dbStatus) {
    case 'pending':
      return 'self_review'
    case 'in_progress':
      return 'pending_manager'
    case 'submitted':
      return 'pending_calibration'
    case 'completed':
      return acknowledgedAt ? 'shared' : 'calibrated'
    default:
      return 'self_review'
  }
}

// ---------------------------------------------------------------------------
// GET /api/performance — query performance data by action
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Missing required query param: action' }, { status: 400 })
    }

    switch (action) {
      // ── 1. cycle-status ─────────────────────────────────────────────
      case 'cycle-status': {
        const cycle = await getActiveCycle(orgId)
        if (!cycle) {
          return NextResponse.json({ cycle: null, stats: null })
        }

        // Gather all reviews in this cycle
        const cycleReviews = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.orgId, orgId),
              eq(schema.reviews.cycleId, cycle.id),
            ),
          )

        // Self-reviews are type='self', manager reviews are type='manager'
        const selfReviews = cycleReviews.filter((r) => r.type === 'self')
        const managerReviews = cycleReviews.filter((r) => r.type === 'manager')

        const totalReviewees = Array.from(new Set(cycleReviews.map((r) => r.employeeId))).length
        const completedSelfReviews = selfReviews.filter(
          (r) => r.status !== 'pending',
        ).length
        const completedManagerReviews = managerReviews.filter(
          (r) => r.status === 'submitted' || r.status === 'completed',
        ).length
        const calibratedCount = cycleReviews.filter(
          (r) => r.status === 'completed',
        ).length

        return NextResponse.json({
          cycle,
          stats: {
            totalReviewees,
            completedSelfReviews,
            completedManagerReviews,
            calibratedCount,
          },
        })
      }

      // ── 2. my-reviews ──────────────────────────────────────────────
      case 'my-reviews': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'Missing required query param: employeeId' }, { status: 400 })
        }

        const myReviews = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.orgId, orgId),
              sql`(${schema.reviews.employeeId} = ${employeeId} OR ${schema.reviews.reviewerId} = ${employeeId})`,
            ),
          )
          .orderBy(desc(schema.reviews.createdAt))

        const enriched = myReviews.map((r) => ({
          ...r,
          lifecycleStatus: dbStatusToLifecycle(r.status, r.acknowledgedAt),
        }))

        return NextResponse.json({ reviews: enriched })
      }

      // ── 3. team-reviews ────────────────────────────────────────────
      case 'team-reviews': {
        const managerId = url.searchParams.get('managerId')
        if (!managerId) {
          return NextResponse.json({ error: 'Missing required query param: managerId' }, { status: 400 })
        }

        const cycle = await getActiveCycle(orgId)
        if (!cycle) {
          return NextResponse.json({ reviews: [], cycle: null })
        }

        // Get direct reports
        const directReports = await db
          .select({ id: schema.employees.id, fullName: schema.employees.fullName })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.orgId, orgId),
              eq(schema.employees.managerId, managerId),
              eq(schema.employees.isActive, true),
            ),
          )

        const reportIds = directReports.map((e) => e.id)
        if (reportIds.length === 0) {
          return NextResponse.json({ reviews: [], cycle })
        }

        const teamReviews = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.orgId, orgId),
              eq(schema.reviews.cycleId, cycle.id),
              sql`${schema.reviews.employeeId} IN ${reportIds}`,
            ),
          )
          .orderBy(desc(schema.reviews.createdAt))

        const enriched = teamReviews.map((r) => ({
          ...r,
          lifecycleStatus: dbStatusToLifecycle(r.status, r.acknowledgedAt),
          employeeName: directReports.find((e) => e.id === r.employeeId)?.fullName ?? null,
        }))

        return NextResponse.json({ reviews: enriched, cycle })
      }

      // ── 4. calibration-data ────────────────────────────────────────
      case 'calibration-data': {
        const employeeId = url.searchParams.get('employeeId')
        const cycleId = url.searchParams.get('cycleId')

        if (!employeeId) {
          return NextResponse.json({ error: 'Missing required query param: employeeId' }, { status: 400 })
        }

        // Verify caller is HRBP/admin/owner
        const caller = await getEmployee(orgId, employeeId)
        if (!caller || !isAdmin(caller.role)) {
          return NextResponse.json({ error: 'Only HRBP/admin/owner can access calibration data' }, { status: 403 })
        }

        const targetCycleId = cycleId ?? (await getActiveCycle(orgId))?.id
        if (!targetCycleId) {
          return NextResponse.json({ error: 'No active review cycle found' }, { status: 404 })
        }

        const allReviews = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.orgId, orgId),
              eq(schema.reviews.cycleId, targetCycleId),
            ),
          )
          .orderBy(schema.reviews.employeeId)

        // Join employee names
        const employeeIds = Array.from(new Set(allReviews.map((r) => r.employeeId)))
        const employees = employeeIds.length > 0
          ? await db
              .select({ id: schema.employees.id, fullName: schema.employees.fullName, departmentId: schema.employees.departmentId })
              .from(schema.employees)
              .where(sql`${schema.employees.id} IN ${employeeIds}`)
          : []

        const empMap = new Map<string, { id: string; fullName: string; departmentId: string | null }>(
          employees.map((e) => [e.id, e]),
        )

        const enriched = allReviews.map((r) => ({
          ...r,
          lifecycleStatus: dbStatusToLifecycle(r.status, r.acknowledgedAt),
          employeeName: empMap.get(r.employeeId)?.fullName ?? null,
          departmentId: empMap.get(r.employeeId)?.departmentId ?? null,
        }))

        return NextResponse.json({ reviews: enriched, cycleId: targetCycleId })
      }

      // ── 5. 360-feedback ────────────────────────────────────────────
      case '360-feedback': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'Missing required query param: employeeId' }, { status: 400 })
        }

        // Get all 360 feedback (type='feedback' or type='recognition') for this employee
        const feedbackItems = await db
          .select()
          .from(schema.feedback)
          .where(
            and(
              eq(schema.feedback.orgId, orgId),
              eq(schema.feedback.toId, employeeId),
            ),
          )
          .orderBy(desc(schema.feedback.createdAt))

        return NextResponse.json({ feedback: feedbackItems })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/performance] Error:', error)
    return NextResponse.json({ error: 'Performance query failed' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/performance — performance lifecycle mutations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action: string }

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      // ── 1. create-cycle ────────────────────────────────────────────
      case 'create-cycle': {
        const { employeeId, title, type, startDate, endDate } = body as {
          employeeId: string
          title: string
          type: 'annual' | 'mid_year' | 'quarterly' | 'probation'
          startDate?: string
          endDate?: string
        }

        if (!employeeId || !title || !type) {
          return NextResponse.json(
            { error: 'Missing required fields: employeeId, title, type' },
            { status: 400 },
          )
        }

        // Verify caller is HRBP/admin/owner
        const caller = await getEmployee(orgId, employeeId)
        if (!caller || !isAdmin(caller.role)) {
          return NextResponse.json(
            { error: 'Only HRBP/admin/owner can create review cycles' },
            { status: 403 },
          )
        }

        // Check for existing active cycle
        const existingActive = await getActiveCycle(orgId)
        if (existingActive) {
          return NextResponse.json(
            { error: `An active review cycle already exists: "${existingActive.title}". Close it before creating a new one.` },
            { status: 409 },
          )
        }

        // Create the cycle
        const [cycle] = await db
          .insert(schema.reviewCycles)
          .values({
            orgId,
            title,
            type,
            status: 'active',
            startDate: startDate ?? null,
            endDate: endDate ?? null,
          })
          .returning()

        // Get all active employees in the org
        const activeEmployees = await db
          .select({
            id: schema.employees.id,
            managerId: schema.employees.managerId,
            fullName: schema.employees.fullName,
          })
          .from(schema.employees)
          .where(
            and(
              eq(schema.employees.orgId, orgId),
              eq(schema.employees.isActive, true),
            ),
          )

        // Auto-generate self-review and manager-review records for every employee
        const reviewInserts: Array<{
          orgId: string
          cycleId: string
          employeeId: string
          reviewerId: string | null
          type: 'self' | 'manager'
          status: 'pending'
        }> = []

        for (const emp of activeEmployees) {
          // Self-review record
          reviewInserts.push({
            orgId,
            cycleId: cycle.id,
            employeeId: emp.id,
            reviewerId: emp.id, // self
            type: 'self',
            status: 'pending',
          })

          // Manager-review record (only if employee has a manager)
          if (emp.managerId) {
            reviewInserts.push({
              orgId,
              cycleId: cycle.id,
              employeeId: emp.id,
              reviewerId: emp.managerId,
              type: 'manager',
              status: 'pending',
            })
          }
        }

        if (reviewInserts.length > 0) {
          await db.insert(schema.reviews).values(reviewInserts)
        }

        // Notify all employees that the cycle has started
        const allEmployeeIds = activeEmployees.map((e) => e.id)
        if (allEmployeeIds.length > 0) {
          await dispatchNotification({
            orgId,
            recipientIds: allEmployeeIds,
            senderId: employeeId,
            event: 'review_assigned',
            title: 'Performance Review Cycle Started',
            message: `${title} has started. Please complete your self-review.`,
            link: '/performance',
            entityType: 'review_cycle',
            entityId: cycle.id,
          }).catch((err) => {
            console.error('[POST /api/performance] Notification dispatch error:', err)
          })
        }

        return NextResponse.json(
          {
            cycle,
            reviewsCreated: reviewInserts.length,
            employeesIncluded: activeEmployees.length,
          },
          { status: 201 },
        )
      }

      // ── 2. submit-self-review ──────────────────────────────────────
      case 'submit-self-review': {
        const { reviewId, employeeId, overallRating, ratings, comments } = body as {
          reviewId: string
          employeeId: string
          overallRating: number
          ratings?: Record<string, number>
          comments?: string
        }

        if (!reviewId || !employeeId || overallRating == null) {
          return NextResponse.json(
            { error: 'Missing required fields: reviewId, employeeId, overallRating' },
            { status: 400 },
          )
        }

        // Fetch the review
        const [review] = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.id, reviewId),
              eq(schema.reviews.orgId, orgId),
            ),
          )
          .limit(1)

        if (!review) {
          return NextResponse.json({ error: 'Review not found' }, { status: 404 })
        }

        // Enforce: must be a self-review and the caller must be the reviewee
        if (review.type !== 'self') {
          return NextResponse.json(
            { error: 'This review is not a self-review' },
            { status: 400 },
          )
        }

        if (review.employeeId !== employeeId) {
          return NextResponse.json(
            { error: 'Only the reviewee can submit their self-review' },
            { status: 403 },
          )
        }

        // Enforce lifecycle: must be in self_review phase (DB status 'pending')
        if (review.status !== 'pending') {
          return NextResponse.json(
            { error: `Self-review already submitted (current status: ${review.status})` },
            { status: 400 },
          )
        }

        // Update the self-review
        const now = new Date()
        const [updated] = await db
          .update(schema.reviews)
          .set({
            overallRating,
            ratings: ratings ?? null,
            comments: comments ?? null,
            status: lifecycleToDbStatus('pending_manager'), // 'in_progress'
            submittedAt: now,
          })
          .where(eq(schema.reviews.id, reviewId))
          .returning()

        // Also move the corresponding manager review to 'in_progress' if it exists
        // (so the manager knows it's their turn)
        if (review.cycleId) {
          await db
            .update(schema.reviews)
            .set({ status: 'in_progress' })
            .where(
              and(
                eq(schema.reviews.orgId, orgId),
                eq(schema.reviews.cycleId, review.cycleId),
                eq(schema.reviews.employeeId, employeeId),
                eq(schema.reviews.type, 'manager'),
                eq(schema.reviews.status, 'pending'),
              ),
            )
        }

        // Notify the employee's manager
        const employee = await getEmployee(orgId, employeeId)
        if (employee?.managerId) {
          await dispatchNotification({
            orgId,
            recipientIds: [employee.managerId],
            senderId: employeeId,
            event: 'review_assigned',
            title: 'Self-Review Submitted',
            message: `${employee.fullName} has submitted their self-review. Please complete your manager review.`,
            link: '/performance',
            entityType: 'review',
            entityId: reviewId,
          }).catch((err) => {
            console.error('[POST /api/performance] Notification dispatch error:', err)
          })
        }

        return NextResponse.json({
          review: { ...updated, lifecycleStatus: 'pending_manager' },
        })
      }

      // ── 3. submit-manager-review ───────────────────────────────────
      case 'submit-manager-review': {
        const { reviewId, reviewerId, overallRating, ratings, comments } = body as {
          reviewId: string
          reviewerId: string
          overallRating: number
          ratings?: Record<string, number>
          comments?: string
        }

        if (!reviewId || !reviewerId || overallRating == null) {
          return NextResponse.json(
            { error: 'Missing required fields: reviewId, reviewerId, overallRating' },
            { status: 400 },
          )
        }

        // Fetch the manager review
        const [review] = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.id, reviewId),
              eq(schema.reviews.orgId, orgId),
            ),
          )
          .limit(1)

        if (!review) {
          return NextResponse.json({ error: 'Review not found' }, { status: 404 })
        }

        if (review.type !== 'manager') {
          return NextResponse.json(
            { error: 'This review is not a manager review' },
            { status: 400 },
          )
        }

        // Only the assigned reviewer can submit
        if (review.reviewerId !== reviewerId) {
          return NextResponse.json(
            { error: 'Only the assigned reviewer (manager) can submit this review' },
            { status: 403 },
          )
        }

        // Enforce lifecycle: self-review for this employee must be submitted first
        if (review.cycleId) {
          const [selfReview] = await db
            .select({ status: schema.reviews.status })
            .from(schema.reviews)
            .where(
              and(
                eq(schema.reviews.orgId, orgId),
                eq(schema.reviews.cycleId, review.cycleId),
                eq(schema.reviews.employeeId, review.employeeId),
                eq(schema.reviews.type, 'self'),
              ),
            )
            .limit(1)

          if (selfReview && selfReview.status === 'pending') {
            return NextResponse.json(
              { error: 'Self-review has not been submitted yet. Self-review must be completed before manager review.' },
              { status: 400 },
            )
          }
        }

        // Enforce lifecycle: manager review must be in 'in_progress' (pending_manager)
        if (review.status !== 'in_progress') {
          return NextResponse.json(
            { error: `Manager review cannot be submitted in current status: ${review.status}` },
            { status: 400 },
          )
        }

        const now = new Date()
        const [updated] = await db
          .update(schema.reviews)
          .set({
            overallRating,
            ratings: ratings ?? null,
            comments: comments ?? null,
            status: lifecycleToDbStatus('pending_calibration'), // 'submitted'
            submittedAt: now,
          })
          .where(eq(schema.reviews.id, reviewId))
          .returning()

        // Check if all manager reviews in this department are done → notify HRBP
        if (review.cycleId) {
          const reviewee = await getEmployee(orgId, review.employeeId)
          if (reviewee?.departmentId) {
            // Get all employees in same department
            const deptEmployees = await db
              .select({ id: schema.employees.id })
              .from(schema.employees)
              .where(
                and(
                  eq(schema.employees.orgId, orgId),
                  eq(schema.employees.departmentId, reviewee.departmentId),
                  eq(schema.employees.isActive, true),
                ),
              )

            const deptEmployeeIds = deptEmployees.map((e) => e.id)

            if (deptEmployeeIds.length > 0) {
              // Check manager reviews for these employees in this cycle
              const deptManagerReviews = await db
                .select({ status: schema.reviews.status })
                .from(schema.reviews)
                .where(
                  and(
                    eq(schema.reviews.orgId, orgId),
                    eq(schema.reviews.cycleId, review.cycleId),
                    eq(schema.reviews.type, 'manager'),
                    sql`${schema.reviews.employeeId} IN ${deptEmployeeIds}`,
                  ),
                )

              const allDone = deptManagerReviews.every(
                (r) => r.status === 'submitted' || r.status === 'completed',
              )

              if (allDone && deptManagerReviews.length > 0) {
                // Find department name
                const [dept] = await db
                  .select({ name: schema.departments.name })
                  .from(schema.departments)
                  .where(eq(schema.departments.id, reviewee.departmentId))
                  .limit(1)

                // Find HRBP/admin users to notify
                const hrbpUsers = await db
                  .select({ id: schema.employees.id })
                  .from(schema.employees)
                  .where(
                    and(
                      eq(schema.employees.orgId, orgId),
                      eq(schema.employees.isActive, true),
                      sql`${schema.employees.role} IN ('hrbp', 'admin', 'owner')`,
                    ),
                  )

                if (hrbpUsers.length > 0) {
                  await dispatchNotification({
                    orgId,
                    recipientIds: hrbpUsers.map((u) => u.id),
                    senderId: reviewerId,
                    event: 'review_assigned',
                    title: 'Department Reviews Ready for Calibration',
                    message: `All manager reviews for ${dept?.name ?? 'the department'} are complete and ready for calibration.`,
                    link: '/performance',
                    entityType: 'review_cycle',
                    entityId: review.cycleId,
                  }).catch((err) => {
                    console.error('[POST /api/performance] Notification dispatch error:', err)
                  })
                }
              }
            }
          }
        }

        return NextResponse.json({
          review: { ...updated, lifecycleStatus: 'pending_calibration' },
        })
      }

      // ── 4. calibrate ───────────────────────────────────────────────
      case 'calibrate': {
        const { employeeId, reviewId, finalRating, calibrationNotes } = body as {
          employeeId: string
          reviewId: string
          finalRating: number
          calibrationNotes?: string
        }

        if (!employeeId || !reviewId || finalRating == null) {
          return NextResponse.json(
            { error: 'Missing required fields: employeeId, reviewId, finalRating' },
            { status: 400 },
          )
        }

        // Verify caller is HRBP/admin/owner
        const caller = await getEmployee(orgId, employeeId)
        if (!caller || !isAdmin(caller.role)) {
          return NextResponse.json(
            { error: 'Only HRBP/admin/owner can calibrate reviews' },
            { status: 403 },
          )
        }

        // Fetch the review (should be a manager review in 'submitted' status)
        const [review] = await db
          .select()
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.id, reviewId),
              eq(schema.reviews.orgId, orgId),
            ),
          )
          .limit(1)

        if (!review) {
          return NextResponse.json({ error: 'Review not found' }, { status: 404 })
        }

        // Enforce lifecycle: manager review must be submitted before calibration
        if (review.status !== 'submitted') {
          return NextResponse.json(
            { error: `Review must be in 'pending_calibration' status to calibrate (current: ${review.status})` },
            { status: 400 },
          )
        }

        const [updated] = await db
          .update(schema.reviews)
          .set({
            overallRating: finalRating,
            comments: calibrationNotes
              ? `${review.comments ?? ''}\n\n--- Calibration Notes ---\n${calibrationNotes}`
              : review.comments,
            status: lifecycleToDbStatus('calibrated'), // 'completed'
          })
          .where(eq(schema.reviews.id, reviewId))
          .returning()

        return NextResponse.json({
          review: { ...updated, lifecycleStatus: 'calibrated' },
        })
      }

      // ── 5. share-reviews ───────────────────────────────────────────
      case 'share-reviews': {
        const { employeeId, cycleId, reviewIds } = body as {
          employeeId: string
          cycleId?: string
          reviewIds?: string[]
        }

        if (!employeeId) {
          return NextResponse.json(
            { error: 'Missing required field: employeeId' },
            { status: 400 },
          )
        }

        // Verify caller is HRBP/admin/owner
        const caller = await getEmployee(orgId, employeeId)
        if (!caller || !isAdmin(caller.role)) {
          return NextResponse.json(
            { error: 'Only HRBP/admin/owner can share reviews' },
            { status: 403 },
          )
        }

        const targetCycleId = cycleId ?? (await getActiveCycle(orgId))?.id
        if (!targetCycleId) {
          return NextResponse.json({ error: 'No active review cycle found' }, { status: 404 })
        }

        // Get calibrated reviews to share
        let reviewsToShare
        if (reviewIds && reviewIds.length > 0) {
          // Share specific reviews
          reviewsToShare = await db
            .select()
            .from(schema.reviews)
            .where(
              and(
                eq(schema.reviews.orgId, orgId),
                eq(schema.reviews.cycleId, targetCycleId),
                eq(schema.reviews.status, 'completed'), // calibrated
                sql`${schema.reviews.acknowledgedAt} IS NULL`,
                sql`${schema.reviews.id} IN ${reviewIds}`,
              ),
            )
        } else {
          // Share all calibrated reviews in the cycle
          reviewsToShare = await db
            .select()
            .from(schema.reviews)
            .where(
              and(
                eq(schema.reviews.orgId, orgId),
                eq(schema.reviews.cycleId, targetCycleId),
                eq(schema.reviews.status, 'completed'), // calibrated
                sql`${schema.reviews.acknowledgedAt} IS NULL`,
              ),
            )
        }

        if (reviewsToShare.length === 0) {
          return NextResponse.json(
            { error: 'No calibrated reviews found to share' },
            { status: 400 },
          )
        }

        // Validate all are calibrated (status='completed' with no acknowledgedAt)
        const now = new Date()
        const sharedIds = reviewsToShare.map((r) => r.id)

        await db
          .update(schema.reviews)
          .set({ acknowledgedAt: now })
          .where(sql`${schema.reviews.id} IN ${sharedIds}`)

        // Notify each reviewee
        const revieweeIds = Array.from(new Set(reviewsToShare.map((r) => r.employeeId)))
        if (revieweeIds.length > 0) {
          await dispatchNotification({
            orgId,
            recipientIds: revieweeIds,
            senderId: employeeId,
            event: 'review_assigned',
            title: 'Performance Review Available',
            message: 'Your performance review is ready. Please review your feedback.',
            link: '/performance',
            entityType: 'review_cycle',
            entityId: targetCycleId,
          }).catch((err) => {
            console.error('[POST /api/performance] Notification dispatch error:', err)
          })
        }

        return NextResponse.json({
          sharedCount: sharedIds.length,
          revieweeCount: revieweeIds.length,
        })
      }

      // ── 6. request-360 ─────────────────────────────────────────────
      case 'request-360': {
        const { requesterId, targetEmployeeId, peerIds, message } = body as {
          requesterId: string
          targetEmployeeId: string
          peerIds: string[]
          message?: string
        }

        if (!requesterId || !targetEmployeeId || !peerIds || peerIds.length === 0) {
          return NextResponse.json(
            { error: 'Missing required fields: requesterId, targetEmployeeId, peerIds' },
            { status: 400 },
          )
        }

        // Verify the target employee exists in this org
        const targetEmployee = await getEmployee(orgId, targetEmployeeId)
        if (!targetEmployee) {
          return NextResponse.json({ error: 'Target employee not found' }, { status: 404 })
        }

        // Create feedback records for each peer
        const feedbackInserts = peerIds.map((peerId) => ({
          orgId,
          fromId: peerId,
          toId: targetEmployeeId,
          type: 'feedback' as const,
          content: '', // placeholder until peer submits
          isPublic: false,
        }))

        const inserted = await db
          .insert(schema.feedback)
          .values(feedbackInserts)
          .returning()

        // Notify each peer
        await dispatchNotification({
          orgId,
          recipientIds: peerIds,
          senderId: requesterId,
          event: 'review_assigned',
          title: '360 Feedback Request',
          message: `You've been asked to provide feedback on ${targetEmployee.fullName}.${message ? ` Note: ${message}` : ''}`,
          link: '/performance',
          entityType: 'feedback',
          entityId: targetEmployeeId,
        }).catch((err) => {
          console.error('[POST /api/performance] Notification dispatch error:', err)
        })

        return NextResponse.json(
          { feedbackRequests: inserted, count: inserted.length },
          { status: 201 },
        )
      }

      // ── 7. submit-360 ──────────────────────────────────────────────
      case 'submit-360': {
        const { feedbackId, fromId, content, ratings } = body as {
          feedbackId: string
          fromId: string
          content: string
          ratings?: Record<string, number>
        }

        if (!feedbackId || !fromId || !content) {
          return NextResponse.json(
            { error: 'Missing required fields: feedbackId, fromId, content' },
            { status: 400 },
          )
        }

        // Fetch the feedback record
        const [fb] = await db
          .select()
          .from(schema.feedback)
          .where(
            and(
              eq(schema.feedback.id, feedbackId),
              eq(schema.feedback.orgId, orgId),
            ),
          )
          .limit(1)

        if (!fb) {
          return NextResponse.json({ error: 'Feedback request not found' }, { status: 404 })
        }

        // Verify the caller is the assigned peer
        if (fb.fromId !== fromId) {
          return NextResponse.json(
            { error: 'Only the assigned peer can submit this feedback' },
            { status: 403 },
          )
        }

        // Verify it hasn't already been submitted (content is empty for pending)
        if (fb.content && fb.content.length > 0) {
          return NextResponse.json(
            { error: 'This 360 feedback has already been submitted' },
            { status: 400 },
          )
        }

        const [updated] = await db
          .update(schema.feedback)
          .set({ content })
          .where(eq(schema.feedback.id, feedbackId))
          .returning()

        return NextResponse.json({ feedback: updated })
      }

      // ── 8. close-cycle ─────────────────────────────────────────────
      case 'close-cycle': {
        const { employeeId, cycleId } = body as {
          employeeId: string
          cycleId?: string
        }

        if (!employeeId) {
          return NextResponse.json(
            { error: 'Missing required field: employeeId' },
            { status: 400 },
          )
        }

        // Verify caller is HRBP/admin/owner
        const caller = await getEmployee(orgId, employeeId)
        if (!caller || !isAdmin(caller.role)) {
          return NextResponse.json(
            { error: 'Only HRBP/admin/owner can close review cycles' },
            { status: 403 },
          )
        }

        const targetCycleId = cycleId ?? (await getActiveCycle(orgId))?.id
        if (!targetCycleId) {
          return NextResponse.json({ error: 'No active review cycle found' }, { status: 404 })
        }

        // Validate all reviews in the cycle are shared (status='completed' with acknowledgedAt set)
        const unsharedReviews = await db
          .select({ id: schema.reviews.id, status: schema.reviews.status, acknowledgedAt: schema.reviews.acknowledgedAt })
          .from(schema.reviews)
          .where(
            and(
              eq(schema.reviews.orgId, orgId),
              eq(schema.reviews.cycleId, targetCycleId),
              eq(schema.reviews.type, 'manager'), // only check manager reviews for closure
            ),
          )

        const notShared = unsharedReviews.filter(
          (r) => r.status !== 'completed' || !r.acknowledgedAt,
        )

        if (notShared.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot close cycle: ${notShared.length} manager review(s) have not been shared yet.`,
              unsharedCount: notShared.length,
            },
            { status: 400 },
          )
        }

        // Close the cycle
        const [updatedCycle] = await db
          .update(schema.reviewCycles)
          .set({ status: 'completed' })
          .where(
            and(
              eq(schema.reviewCycles.id, targetCycleId),
              eq(schema.reviewCycles.orgId, orgId),
            ),
          )
          .returning()

        return NextResponse.json({ cycle: updatedCycle })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/performance] Error:', error)
    return NextResponse.json(
      { error: error?.message || 'Performance operation failed' },
      { status: 500 },
    )
  }
}
