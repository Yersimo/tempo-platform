import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// POST /api/gdpr - GDPR data subject requests (export, deletion)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')
    if (!orgId || !employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    switch (action) {
      // ─── Data Export (Art. 15 & 20) ────────────────────────────
      case 'export': {
        // Gather all personal data for this employee
        const [employee] = await db.select().from(schema.employees)
          .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))

        if (!employee) {
          return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        }

        // Fetch related data in parallel
        const [
          goals, reviews, feedback, leaveRequests,
          enrollments, salaryReviews, notifications,
        ] = await Promise.all([
          db.select().from(schema.goals).where(eq(schema.goals.employeeId, employeeId)),
          db.select().from(schema.reviews).where(eq(schema.reviews.employeeId, employeeId)),
          db.select().from(schema.feedback).where(eq(schema.feedback.fromId, employeeId)),
          db.select().from(schema.leaveRequests).where(eq(schema.leaveRequests.employeeId, employeeId)),
          db.select().from(schema.enrollments).where(eq(schema.enrollments.employeeId, employeeId)),
          db.select().from(schema.salaryReviews).where(eq(schema.salaryReviews.employeeId, employeeId)),
          db.select().from(schema.notifications).where(eq(schema.notifications.recipientId, employeeId)),
        ])

        const exportData = {
          exportDate: new Date().toISOString(),
          format: 'GDPR Data Subject Access Request',
          personalData: {
            id: employee.id,
            fullName: employee.fullName,
            email: employee.email,
            phone: employee.phone,
            jobTitle: employee.jobTitle,
            level: employee.level,
            country: employee.country,
            role: employee.role,
            hireDate: employee.hireDate,
            isActive: employee.isActive,
            createdAt: employee.createdAt,
          },
          goals: goals.map(g => ({ id: g.id, title: g.title, status: g.status, progress: g.progress })),
          reviews: reviews.map(r => ({ id: r.id, status: r.status, overallRating: r.overallRating, submittedAt: r.submittedAt })),
          feedback: feedback.map(f => ({ id: f.id, type: f.type, content: f.content, createdAt: f.createdAt })),
          leaveRequests: leaveRequests.map(l => ({ id: l.id, type: l.type, startDate: l.startDate, endDate: l.endDate, status: l.status })),
          enrollments: enrollments.map(e => ({ id: e.id, courseId: e.courseId, status: e.status, progress: e.progress })),
          compensation: salaryReviews.map(s => ({ id: s.id, currentSalary: s.currentSalary, proposedSalary: s.proposedSalary, status: s.status })),
          notifications: notifications.length,
        }

        // Audit the export request
        await db.insert(schema.auditLog).values({
          orgId,
          userId: employeeId,
          action: 'create',
          entityType: 'gdpr_export',
          entityId: employeeId,
          details: JSON.stringify({ type: 'data_export' }),
        })

        return NextResponse.json(exportData, {
          headers: {
            'Content-Disposition': `attachment; filename="tempo-data-export-${employeeId}.json"`,
          },
        })
      }

      // ─── Data Deletion (Art. 17) ───────────────────────────────
      case 'delete': {
        const role = request.headers.get('x-employee-role')

        // Only the employee themselves or an admin/owner can request deletion
        const targetId = body.targetEmployeeId || employeeId
        if (targetId !== employeeId && role !== 'owner' && role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden: cannot delete other users\' data' }, { status: 403 })
        }

        // Audit the deletion request BEFORE deleting
        await db.insert(schema.auditLog).values({
          orgId,
          userId: employeeId,
          action: 'delete',
          entityType: 'gdpr_erasure',
          entityId: targetId,
          details: JSON.stringify({ type: 'data_deletion_request', requestedBy: employeeId }),
        })

        // Anonymize personal data (soft deletion - preserves referential integrity)
        await db.update(schema.employees)
          .set({
            fullName: '[Deleted User]',
            email: `deleted-${targetId.slice(0, 8)}@redacted.local`,
            phone: null,
            avatarUrl: null,
            isActive: false,
            updatedAt: new Date(),
          })
          .where(and(eq(schema.employees.id, targetId), eq(schema.employees.orgId, orgId)))

        // Delete notifications
        await db.delete(schema.notifications)
          .where(eq(schema.notifications.recipientId, targetId))

        // Delete feedback from this user
        await db.delete(schema.feedback)
          .where(eq(schema.feedback.fromId, targetId))

        return NextResponse.json({
          success: true,
          message: 'Personal data has been anonymized. Audit records are retained per legal requirements.',
        })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/gdpr] Error:', error)
    return NextResponse.json({ error: 'GDPR request failed' }, { status: 500 })
  }
}
