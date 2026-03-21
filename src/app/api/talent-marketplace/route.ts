import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/talent-marketplace -- Fetch gigs, applications, career paths
// POST /api/talent-marketplace -- Create gig, apply, update career interests
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(orgId)) {
      return NextResponse.json({ gigs: [], applications: [], careerPaths: [], careerInterests: [] })
    }

    const url = new URL(request.url)
    const type = url.searchParams.get('type') // gigs, applications, career-paths, career-interests

    if (type === 'applications') {
      const employeeId = url.searchParams.get('employee_id')
      const rows = employeeId
        ? await db.select().from(schema.gigApplications).where(eq(schema.gigApplications.employeeId, employeeId))
        : await db.select().from(schema.gigApplications)
      return NextResponse.json({ data: rows })
    }

    if (type === 'career-paths') {
      const rows = await db.select().from(schema.careerPaths).where(eq(schema.careerPaths.orgId, orgId))
      return NextResponse.json({ data: rows })
    }

    if (type === 'career-interests') {
      const employeeId = url.searchParams.get('employee_id')
      if (employeeId) {
        const rows = await db.select().from(schema.careerInterests).where(
          and(eq(schema.careerInterests.orgId, orgId), eq(schema.careerInterests.employeeId, employeeId))
        )
        return NextResponse.json({ data: rows })
      }
      const rows = await db.select().from(schema.careerInterests).where(eq(schema.careerInterests.orgId, orgId))
      return NextResponse.json({ data: rows })
    }

    // Default: gigs
    const gigs = await db.select().from(schema.internalGigs).where(eq(schema.internalGigs.orgId, orgId))
    const applications = await db.select().from(schema.gigApplications)
    const careerPaths = await db.select().from(schema.careerPaths).where(eq(schema.careerPaths.orgId, orgId))
    const careerInterests = await db.select().from(schema.careerInterests).where(eq(schema.careerInterests.orgId, orgId))

    return NextResponse.json({ gigs, applications, careerPaths, careerInterests })
  } catch (error) {
    console.error('Talent marketplace GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(orgId)) {
      return NextResponse.json({ error: 'Demo mode - write not supported' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body

    if (action === 'create_gig') {
      const { title, description, gigType, departmentId, commitment, hoursPerWeek, duration, startDate, endDate, maxParticipants, requiredSkills, preferredLevel, isRemote, compensationType, compensationAmount } = body
      const [gig] = await db.insert(schema.internalGigs).values({
        orgId,
        title,
        description,
        gigType,
        departmentId: departmentId || null,
        postedBy: employeeId || orgId,
        status: 'open',
        commitment: commitment || 'part_time',
        hoursPerWeek: hoursPerWeek || null,
        duration: duration || null,
        startDate: startDate || null,
        endDate: endDate || null,
        maxParticipants: maxParticipants || 1,
        requiredSkills: requiredSkills ? JSON.stringify(requiredSkills) : null,
        preferredLevel: preferredLevel || null,
        isRemote: isRemote || false,
        compensationType: compensationType || 'none',
        compensationAmount: compensationAmount || null,
      }).returning()
      return NextResponse.json({ gig })
    }

    if (action === 'apply') {
      const { gigId, coverLetter, matchScore } = body
      const [app] = await db.insert(schema.gigApplications).values({
        gigId,
        employeeId: employeeId || body.employeeId,
        coverLetter: coverLetter || null,
        matchScore: matchScore || null,
        status: 'applied',
      }).returning()
      return NextResponse.json({ application: app })
    }

    if (action === 'update_application') {
      const { applicationId, status } = body
      await db.update(schema.gigApplications)
        .set({ status, updatedAt: new Date() })
        .where(eq(schema.gigApplications.id, applicationId))
      return NextResponse.json({ success: true })
    }

    if (action === 'update_gig') {
      const { gigId, ...updates } = body
      delete updates.action
      await db.update(schema.internalGigs)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(schema.internalGigs.id, gigId))
      return NextResponse.json({ success: true })
    }

    if (action === 'save_career_interest') {
      const { targetRole, targetDepartment, careerPathId, interestedInMentoring, interestedInGigs, openToTransfer, skills } = body
      const eid = employeeId || body.employeeId
      // Upsert
      const existing = await db.select().from(schema.careerInterests).where(
        and(eq(schema.careerInterests.orgId, orgId), eq(schema.careerInterests.employeeId, eid))
      )
      if (existing.length > 0) {
        await db.update(schema.careerInterests)
          .set({ targetRole, targetDepartment, careerPathId, interestedInMentoring, interestedInGigs, openToTransfer, skills: skills ? JSON.stringify(skills) : null, updatedAt: new Date() })
          .where(eq(schema.careerInterests.id, existing[0].id))
      } else {
        await db.insert(schema.careerInterests).values({
          employeeId: eid,
          orgId,
          targetRole, targetDepartment, careerPathId, interestedInMentoring, interestedInGigs, openToTransfer,
          skills: skills ? JSON.stringify(skills) : null,
        })
      }
      return NextResponse.json({ success: true })
    }

    if (action === 'create_career_path') {
      const { name, description, steps, departmentId } = body
      const [path] = await db.insert(schema.careerPaths).values({
        orgId,
        name,
        description: description || null,
        steps: JSON.stringify(steps),
        departmentId: departmentId || null,
      }).returning()
      return NextResponse.json({ careerPath: path })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (error) {
    console.error('Talent marketplace POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
