import { NextRequest, NextResponse } from 'next/server'
import {
  getCourseLibrary,
  createAutoEnrollRule,
  getAutoEnrollRules,
  processAutoEnrollments,
  createLearningPath,
  getLearningPaths,
  getLearningPathProgress,
  updateProgress,
  getEmployeeLearningProfile,
  getComplianceTrainingStatus,
  recommendCourses,
  getLearningMetrics,
  enrollEmployee,
  dropEnrollment,
} from '@/lib/lms-engine'

// GET /api/learning - Library, paths, compliance, metrics, profile
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'library'

    switch (action) {
      case 'library': {
        const category = url.searchParams.get('category') || undefined
        const level = url.searchParams.get('level') as any
        const format = url.searchParams.get('format') as any
        const search = url.searchParams.get('search') || undefined
        const result = await getCourseLibrary(orgId, { category, level, format, search })
        return NextResponse.json(result)
      }

      case 'paths': {
        const result = await getLearningPaths(orgId)
        return NextResponse.json({ paths: result })
      }

      case 'path-progress': {
        const pathId = url.searchParams.get('pathId')
        const employeeId = url.searchParams.get('employeeId')
        if (!pathId || !employeeId) {
          return NextResponse.json({ error: 'pathId and employeeId are required' }, { status: 400 })
        }
        const result = await getLearningPathProgress(orgId, pathId, employeeId)
        return NextResponse.json(result)
      }

      case 'profile': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await getEmployeeLearningProfile(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'compliance': {
        const result = await getComplianceTrainingStatus(orgId)
        return NextResponse.json(result)
      }

      case 'recommendations': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await recommendCourses(orgId, employeeId)
        return NextResponse.json({ recommendations: result })
      }

      case 'metrics': {
        const result = await getLearningMetrics(orgId)
        return NextResponse.json(result)
      }

      case 'rules': {
        const result = await getAutoEnrollRules(orgId)
        return NextResponse.json({ rules: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/learning] Error:', error)
    return NextResponse.json({ error: 'Learning query failed' }, { status: 500 })
  }
}

// POST /api/learning - Enroll, create rules/paths, update progress
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'enroll': {
        const { employeeId, courseId } = body
        if (!employeeId || !courseId) {
          return NextResponse.json({ error: 'employeeId and courseId are required' }, { status: 400 })
        }
        const result = await enrollEmployee(orgId, employeeId, courseId)
        return NextResponse.json(result)
      }

      case 'drop': {
        const { enrollmentId } = body
        if (!enrollmentId) {
          return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
        }
        await dropEnrollment(orgId, enrollmentId)
        return NextResponse.json({ success: true })
      }

      case 'update-progress': {
        const { enrollmentId, progress } = body
        if (!enrollmentId || progress === undefined) {
          return NextResponse.json({ error: 'enrollmentId and progress are required' }, { status: 400 })
        }
        const result = await updateProgress(orgId, enrollmentId, progress)
        return NextResponse.json(result)
      }

      case 'create-rule': {
        const { rule } = body
        if (!rule) {
          return NextResponse.json({ error: 'rule is required' }, { status: 400 })
        }
        const result = await createAutoEnrollRule(orgId, rule)
        return NextResponse.json(result)
      }

      case 'process-auto-enroll': {
        const result = await processAutoEnrollments(orgId)
        return NextResponse.json(result)
      }

      case 'create-path': {
        const { path } = body
        if (!path) {
          return NextResponse.json({ error: 'path is required' }, { status: 400 })
        }
        const result = await createLearningPath(orgId, path)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/learning] Error:', error)
    return NextResponse.json({ error: error?.message || 'Learning operation failed' }, { status: 500 })
  }
}
