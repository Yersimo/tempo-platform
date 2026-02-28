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
  submitQuiz,
  issueCertificate,
  getCourseContent,
  getEmployeeCertificates,
  trackBlockProgress,
  getDetailedProgress,
  getContentAnalytics,
  getLearnerHeatmap,
  getCourseCompletionFunnel,
} from '@/lib/lms-engine'
import { db, schema } from '@/lib/db'
import { eq, asc } from 'drizzle-orm'
import { learningPostBody } from '@/lib/validations/learning'
import { formatZodError } from '@/lib/validations/common'

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

      case 'course-content': {
        const courseId = url.searchParams.get('courseId')
        if (!courseId) {
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
        }
        const result = await getCourseContent(courseId)
        return NextResponse.json({ content: result })
      }

      case 'certificates': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await getEmployeeCertificates(orgId, employeeId)
        return NextResponse.json({ certificates: result })
      }

      case 'quiz-questions': {
        const courseContentId = url.searchParams.get('courseContentId')
        if (!courseContentId) {
          return NextResponse.json({ error: 'courseContentId is required' }, { status: 400 })
        }
        // Return questions without correct answers for security
        const questions = await db
          .select({
            id: schema.quizQuestions.id,
            courseContentId: schema.quizQuestions.courseContentId,
            question: schema.quizQuestions.question,
            options: schema.quizQuestions.options,
            points: schema.quizQuestions.points,
            position: schema.quizQuestions.position,
          })
          .from(schema.quizQuestions)
          .where(eq(schema.quizQuestions.courseContentId, courseContentId))
          .orderBy(asc(schema.quizQuestions.position))
        return NextResponse.json({ questions })
      }

      case 'detailed-progress': {
        const enrollmentId = url.searchParams.get('enrollmentId')
        if (!enrollmentId) {
          return NextResponse.json({ error: 'enrollmentId is required' }, { status: 400 })
        }
        const result = await getDetailedProgress(orgId, enrollmentId)
        if (!result) {
          return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 })
        }
        return NextResponse.json(result)
      }

      case 'content-analytics': {
        const courseId = url.searchParams.get('courseId')
        if (!courseId) {
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
        }
        const result = await getContentAnalytics(orgId, courseId)
        if (!result) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }
        return NextResponse.json(result)
      }

      case 'learner-heatmap': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await getLearnerHeatmap(orgId, employeeId)
        if (!result) {
          return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
        }
        return NextResponse.json(result)
      }

      case 'completion-funnel': {
        const courseId = url.searchParams.get('courseId')
        if (!courseId) {
          return NextResponse.json({ error: 'courseId is required' }, { status: 400 })
        }
        const result = await getCourseCompletionFunnel(orgId, courseId)
        if (!result) {
          return NextResponse.json({ error: 'Course not found' }, { status: 404 })
        }
        return NextResponse.json(result)
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
    const parsed = learningPostBody.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 })
    }

    switch (parsed.data.action) {
      case 'enroll': {
        const result = await enrollEmployee(orgId, parsed.data.employeeId, parsed.data.courseId)
        return NextResponse.json(result)
      }

      case 'drop': {
        await dropEnrollment(orgId, parsed.data.enrollmentId)
        return NextResponse.json({ success: true })
      }

      case 'update-progress': {
        const result = await updateProgress(orgId, parsed.data.enrollmentId, parsed.data.progress)
        return NextResponse.json(result)
      }

      case 'create-rule': {
        const result = await createAutoEnrollRule(orgId, parsed.data.rule)
        return NextResponse.json(result)
      }

      case 'process-auto-enroll': {
        const result = await processAutoEnrollments(orgId)
        return NextResponse.json(result)
      }

      case 'create-path': {
        const result = await createLearningPath(orgId, parsed.data.path)
        return NextResponse.json(result)
      }

      case 'submit-quiz': {
        const result = await submitQuiz(
          orgId,
          parsed.data.employeeId,
          parsed.data.courseContentId,
          parsed.data.answers
        )
        return NextResponse.json(result)
      }

      case 'issue-certificate': {
        const result = await issueCertificate(
          orgId,
          parsed.data.employeeId,
          parsed.data.courseId,
          parsed.data.enrollmentId || ''
        )
        if (!result) {
          return NextResponse.json({ error: 'Failed to issue certificate' }, { status: 500 })
        }
        return NextResponse.json(result)
      }

      case 'track-block-progress': {
        const result = await trackBlockProgress(
          orgId,
          parsed.data.enrollmentId,
          parsed.data.blockId,
          parsed.data.data
        )
        if (!result) {
          return NextResponse.json({ error: 'Failed to track block progress' }, { status: 500 })
        }
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/learning] Error:', error)
    return NextResponse.json({ error: error?.message || 'Learning operation failed' }, { status: 500 })
  }
}
