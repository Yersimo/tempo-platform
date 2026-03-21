import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'
import { calculateNineBoxPosition, calculateBenchStrength, analyzeSkillsGap, calculateFlightRisk } from '@/lib/services/succession-engine'

function getOrgId(request: NextRequest): string | null {
  return request.headers.get('x-org-id')
}

const UUID_FORMAT = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'plans'

    // For demo orgs, return empty
    if (!UUID_FORMAT.test(orgId)) {
      return NextResponse.json({ data: [] })
    }

    switch (action) {
      case 'plans': {
        const plans = await db.select().from(schema.successionPlans).where(eq(schema.successionPlans.orgId, orgId))
        return NextResponse.json({ data: plans })
      }
      case 'candidates': {
        const planId = url.searchParams.get('planId')
        if (planId) {
          const candidates = await db.select().from(schema.successionCandidates).where(eq(schema.successionCandidates.planId, planId))
          return NextResponse.json({ data: candidates })
        }
        const allCandidates = await db.select().from(schema.successionCandidates)
        return NextResponse.json({ data: allCandidates })
      }
      case 'talent-reviews': {
        const reviews = await db.select().from(schema.talentReviews).where(eq(schema.talentReviews.orgId, orgId))
        return NextResponse.json({ data: reviews })
      }
      case 'talent-review-entries': {
        const reviewId = url.searchParams.get('reviewId')
        if (!reviewId) return NextResponse.json({ data: [] })
        const entries = await db.select().from(schema.talentReviewEntries).where(eq(schema.talentReviewEntries.reviewId, reviewId))
        return NextResponse.json({ data: entries })
      }
      case 'skills': {
        const skills = await db.select().from(schema.skills).where(eq(schema.skills.orgId, orgId))
        return NextResponse.json({ data: skills })
      }
      case 'employee-skills': {
        const employeeId = url.searchParams.get('employeeId')
        if (employeeId) {
          const empSkills = await db.select().from(schema.employeeSkills).where(and(eq(schema.employeeSkills.orgId, orgId), eq(schema.employeeSkills.employeeId, employeeId)))
          return NextResponse.json({ data: empSkills })
        }
        const allSkills = await db.select().from(schema.employeeSkills).where(eq(schema.employeeSkills.orgId, orgId))
        return NextResponse.json({ data: allSkills })
      }
      case 'bench-strength': {
        const plans = await db.select().from(schema.successionPlans).where(eq(schema.successionPlans.orgId, orgId))
        const candidates = await db.select().from(schema.successionCandidates)
        const results = plans.map(plan => calculateBenchStrength(
          { id: plan.id, position_title: plan.positionTitle, criticality: plan.criticality },
          candidates.map(c => ({ plan_id: c.planId, readiness: c.readiness }))
        ))
        return NextResponse.json({ data: results })
      }
      case 'skills-gap': {
        const employeeId = url.searchParams.get('employeeId')
        const jobTitle = url.searchParams.get('jobTitle')
        if (!employeeId || !jobTitle) return NextResponse.json({ data: [] })
        const empSkills = await db.select().from(schema.employeeSkills).where(and(eq(schema.employeeSkills.orgId, orgId), eq(schema.employeeSkills.employeeId, employeeId)))
        const reqs = await db.select().from(schema.roleSkillRequirements).where(and(eq(schema.roleSkillRequirements.orgId, orgId), eq(schema.roleSkillRequirements.jobTitle, jobTitle)))
        const allSkills = await db.select().from(schema.skills).where(eq(schema.skills.orgId, orgId))
        const lookup: Record<string, string> = {}
        allSkills.forEach(s => { lookup[s.id] = s.name })
        const gaps = analyzeSkillsGap(
          empSkills.map(s => ({ skill_id: s.skillId, current_level: s.currentLevel })),
          reqs.map(r => ({ skill_id: r.skillId, required_level: r.requiredLevel, importance: r.importance })),
          lookup
        )
        return NextResponse.json({ data: gaps })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/succession] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    if (!UUID_FORMAT.test(orgId)) return NextResponse.json({ error: 'Demo mode: read-only' }, { status: 403 })

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      case 'create-plan': {
        const [plan] = await db.insert(schema.successionPlans).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: plan })
      }
      case 'update-plan': {
        const { id, ...updates } = data
        const [plan] = await db.update(schema.successionPlans).set(updates).where(eq(schema.successionPlans.id, id)).returning()
        return NextResponse.json({ data: plan })
      }
      case 'add-candidate': {
        const [candidate] = await db.insert(schema.successionCandidates).values(data).returning()
        return NextResponse.json({ data: candidate })
      }
      case 'update-candidate': {
        const { id: cId, ...cUpdates } = data
        const [candidate] = await db.update(schema.successionCandidates).set(cUpdates).where(eq(schema.successionCandidates.id, cId)).returning()
        return NextResponse.json({ data: candidate })
      }
      case 'create-talent-review': {
        const [review] = await db.insert(schema.talentReviews).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: review })
      }
      case 'add-talent-review-entry': {
        const nineBoxPosition = calculateNineBoxPosition(data.performanceScore, data.potentialScore)
        const [entry] = await db.insert(schema.talentReviewEntries).values({ ...data, nineBoxPosition }).returning()
        return NextResponse.json({ data: entry })
      }
      case 'create-skill': {
        const [skill] = await db.insert(schema.skills).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: skill })
      }
      case 'add-employee-skill': {
        const [empSkill] = await db.insert(schema.employeeSkills).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: empSkill })
      }
      case 'update-employee-skill': {
        const { id: esId, ...esUpdates } = data
        const [empSkill] = await db.update(schema.employeeSkills).set(esUpdates).where(eq(schema.employeeSkills.id, esId)).returning()
        return NextResponse.json({ data: empSkill })
      }
      case 'create-development-plan': {
        const [plan] = await db.insert(schema.developmentPlans).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: plan })
      }
      case 'add-development-item': {
        const [item] = await db.insert(schema.developmentPlanItems).values(data).returning()
        return NextResponse.json({ data: item })
      }
      case 'add-role-requirement': {
        const [req] = await db.insert(schema.roleSkillRequirements).values({ ...data, orgId }).returning()
        return NextResponse.json({ data: req })
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/succession] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
