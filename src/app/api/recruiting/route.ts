import { NextRequest, NextResponse } from 'next/server'
import {
  distributeToJobBoards,
  screenResume,
  scheduleInterview,
  getCandidatePipeline,
  generateOffer,
  getRecruitingMetrics,
  searchTalentPool,
  getRecruitingOverview,
  batchScreenApplications,
  advanceCandidateStage,
} from '@/lib/ats-engine'

// GET /api/recruiting - Overview, metrics, pipeline, or talent pool
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'overview'

    switch (action) {
      case 'overview': {
        const result = await getRecruitingOverview(orgId)
        return NextResponse.json(result)
      }

      case 'metrics': {
        const result = await getRecruitingMetrics(orgId)
        return NextResponse.json(result)
      }

      case 'pipeline': {
        const jobId = url.searchParams.get('jobId')
        if (!jobId) return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        const result = await getCandidatePipeline(orgId, jobId)
        return NextResponse.json(result)
      }

      case 'talent-pool': {
        const skills = url.searchParams.get('skills')?.split(',')
        const roleKeywords = url.searchParams.get('keywords')?.split(',')
        const minRating = url.searchParams.get('minRating')
        const result = await searchTalentPool(orgId, {
          skills,
          roleKeywords: roleKeywords || undefined,
          minRating: minRating ? parseInt(minRating) : undefined,
        })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/recruiting] Error:', error)
    return NextResponse.json({ error: 'Recruiting query failed' }, { status: 500 })
  }
}

// POST /api/recruiting - Distribute, screen, schedule, offer, advance
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'distribute': {
        const { jobId, boards } = body
        if (!jobId || !boards?.length) {
          return NextResponse.json({ error: 'jobId and boards are required' }, { status: 400 })
        }
        const result = await distributeToJobBoards(orgId, jobId, boards)
        return NextResponse.json(result)
      }

      case 'screen': {
        const { applicationId } = body
        if (!applicationId) {
          return NextResponse.json({ error: 'applicationId is required' }, { status: 400 })
        }
        const result = await screenResume(orgId, applicationId)
        return NextResponse.json(result)
      }

      case 'batch-screen': {
        const { jobId } = body
        if (!jobId) {
          return NextResponse.json({ error: 'jobId is required' }, { status: 400 })
        }
        const result = await batchScreenApplications(orgId, jobId)
        return NextResponse.json(result)
      }

      case 'schedule-interview': {
        const { applicationId, interviewerIds, timeSlot, type } = body
        if (!applicationId || !interviewerIds?.length || !timeSlot) {
          return NextResponse.json({ error: 'applicationId, interviewerIds, and timeSlot are required' }, { status: 400 })
        }
        const result = await scheduleInterview(orgId, applicationId, interviewerIds, timeSlot, type)
        return NextResponse.json(result)
      }

      case 'offer': {
        const { applicationId, offerDetails } = body
        if (!applicationId || !offerDetails) {
          return NextResponse.json({ error: 'applicationId and offerDetails are required' }, { status: 400 })
        }
        const result = await generateOffer(orgId, applicationId, offerDetails)
        return NextResponse.json(result)
      }

      case 'advance': {
        const { applicationId, targetStatus, notes } = body
        if (!applicationId || !targetStatus) {
          return NextResponse.json({ error: 'applicationId and targetStatus are required' }, { status: 400 })
        }
        const result = await advanceCandidateStage(orgId, applicationId, targetStatus, notes)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/recruiting] Error:', error)
    return NextResponse.json({ error: error?.message || 'Recruiting operation failed' }, { status: 500 })
  }
}
