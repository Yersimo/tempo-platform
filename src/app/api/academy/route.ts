import { NextRequest, NextResponse } from 'next/server'
import {
  getAcademies, getAcademyById, getAcademyBySlug, createAcademy, updateAcademy, deleteAcademy,
  getCohorts, createCohort, updateCohort, deleteCohort,
  getParticipants, getParticipantById, createParticipant, updateParticipant, deleteParticipant,
  getAcademyCourses, addCourseToAcademy, removeCourseFromAcademy,
  getParticipantProgress, updateParticipantProgress, recalculateParticipantOverallProgress,
  getSessions, createSession, updateSession, deleteSession,
  rsvpSession, getSessionRsvps, markAttendance,
  getAssignments, createAssignment, updateAssignment, deleteAssignment,
  submitAssignment, gradeSubmission, getSubmissions, getParticipantSubmissions,
  getDiscussions, getDiscussionReplies, createDiscussion, deleteDiscussion, pinDiscussion,
  getResources, createResource, deleteResource,
  getAcademyCertificates, createAcademyCertificate, issueAcademyCertificate, updateCertificateRequirements,
  getCommunications, createCommunication, sendCommunication,
  getCommTriggers, createCommTrigger, updateCommTrigger, deleteCommTrigger,
  getAcademyDashboard, getProgramDashboard,
  validateEmail, validateSlug, validateDateRange, isSlugUnique,
} from '@/lib/academy-engine'

// GET /api/academy?action=...
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'
    const academyId = url.searchParams.get('academyId') || ''
    const participantId = url.searchParams.get('participantId') || ''
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const search = url.searchParams.get('search') || undefined
    const status = url.searchParams.get('status') || undefined

    switch (action) {
      case 'list': {
        const result = await getAcademies(orgId, { page, limit, search, status })
        return NextResponse.json(result)
      }

      case 'get': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const academy = await getAcademyById(orgId, academyId)
        if (!academy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: academy })
      }

      case 'get-by-slug': {
        const slug = url.searchParams.get('slug')
        if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
        const academy = await getAcademyBySlug(orgId, slug)
        if (!academy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: academy })
      }

      case 'cohorts': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const cohorts = await getCohorts(orgId, academyId)
        return NextResponse.json({ data: cohorts })
      }

      case 'participants': {
        const cohortId = url.searchParams.get('cohortId') || undefined
        const result = await getParticipants(orgId, {
          page, limit, academyId: academyId || undefined, cohortId, status, search,
        })
        return NextResponse.json(result)
      }

      case 'participant': {
        if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        const participant = await getParticipantById(orgId, participantId)
        if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: participant })
      }

      case 'courses': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const courses = await getAcademyCourses(orgId, academyId)
        return NextResponse.json({ data: courses })
      }

      case 'participant-progress': {
        if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        const progress = await getParticipantProgress(orgId, participantId)
        return NextResponse.json({ data: progress })
      }

      case 'sessions': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const sessions = await getSessions(orgId, academyId)
        return NextResponse.json({ data: sessions })
      }

      case 'session-rsvps': {
        const sessionId = url.searchParams.get('sessionId')
        if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        const rsvps = await getSessionRsvps(orgId, sessionId)
        return NextResponse.json({ data: rsvps })
      }

      case 'assignments': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const assignments = await getAssignments(orgId, academyId)
        return NextResponse.json({ data: assignments })
      }

      case 'submissions': {
        const assignmentId = url.searchParams.get('assignmentId')
        if (assignmentId) {
          const submissions = await getSubmissions(orgId, assignmentId)
          return NextResponse.json({ data: submissions })
        }
        if (participantId) {
          const submissions = await getParticipantSubmissions(orgId, participantId)
          return NextResponse.json({ data: submissions })
        }
        return NextResponse.json({ error: 'assignmentId or participantId required' }, { status: 400 })
      }

      case 'discussions': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const result = await getDiscussions(orgId, academyId, { page, limit })
        return NextResponse.json(result)
      }

      case 'discussion-replies': {
        const parentId = url.searchParams.get('parentId')
        if (!parentId) return NextResponse.json({ error: 'parentId required' }, { status: 400 })
        const replies = await getDiscussionReplies(orgId, parentId)
        return NextResponse.json({ data: replies })
      }

      case 'resources': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const resources = await getResources(orgId, academyId)
        return NextResponse.json({ data: resources })
      }

      case 'certificates': {
        const certs = await getAcademyCertificates(orgId, {
          academyId: academyId || undefined,
          participantId: participantId || undefined,
        })
        return NextResponse.json({ data: certs })
      }

      case 'communications': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const comms = await getCommunications(orgId, academyId)
        return NextResponse.json({ data: comms })
      }

      case 'comm-triggers': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const triggers = await getCommTriggers(orgId, academyId)
        return NextResponse.json({ data: triggers })
      }

      case 'dashboard': {
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const dashboard = await getAcademyDashboard(orgId, academyId)
        return NextResponse.json({ data: dashboard })
      }

      case 'program-dashboard': {
        const dashboard = await getProgramDashboard(orgId)
        return NextResponse.json({ data: dashboard })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy GET]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}

// POST /api/academy
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action, ...data } = body

    switch (action) {
      // Academies
      case 'create-academy': {
        if (!data.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!data.slug?.trim()) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })
        const slugErr = validateSlug(data.slug)
        if (slugErr) return NextResponse.json({ error: slugErr }, { status: 400 })
        const slugOk = await isSlugUnique(orgId, data.slug)
        if (!slugOk) return NextResponse.json({ error: 'Slug already in use for this organization' }, { status: 409 })
        const academy = await createAcademy(orgId, data)
        return NextResponse.json({ data: academy }, { status: 201 })
      }
      case 'update-academy': {
        const { academyId, ...updates } = data
        if (!academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const academy = await updateAcademy(orgId, academyId, updates)
        if (!academy) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: academy })
      }
      case 'delete-academy': {
        if (!data.academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        const deleted = await deleteAcademy(orgId, data.academyId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      // Cohorts
      case 'create-cohort': {
        if (!data.academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        if (!data.name?.trim()) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
        if (!data.startDate || !data.endDate) return NextResponse.json({ error: 'Start and end dates required' }, { status: 400 })
        const dateErr = validateDateRange(data.startDate, data.endDate)
        if (dateErr) return NextResponse.json({ error: dateErr }, { status: 400 })
        const cohort = await createCohort(orgId, data)
        return NextResponse.json({ data: cohort }, { status: 201 })
      }
      case 'update-cohort': {
        const { cohortId, ...updates } = data
        if (!cohortId) return NextResponse.json({ error: 'cohortId required' }, { status: 400 })
        const cohort = await updateCohort(orgId, cohortId, updates)
        if (!cohort) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: cohort })
      }
      case 'delete-cohort': {
        if (!data.cohortId) return NextResponse.json({ error: 'cohortId required' }, { status: 400 })
        const deleted = await deleteCohort(orgId, data.cohortId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      // Participants
      case 'create-participant': {
        if (!data.academyId) return NextResponse.json({ error: 'academyId required' }, { status: 400 })
        if (!data.fullName?.trim()) return NextResponse.json({ error: 'Full name required' }, { status: 400 })
        if (!data.email?.trim()) return NextResponse.json({ error: 'Email required' }, { status: 400 })
        const emailErr = validateEmail(data.email)
        if (emailErr) return NextResponse.json({ error: emailErr }, { status: 400 })
        const participant = await createParticipant(orgId, data)
        return NextResponse.json({ data: participant }, { status: 201 })
      }
      case 'update-participant': {
        const { participantId, ...updates } = data
        if (!participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        const participant = await updateParticipant(orgId, participantId, updates)
        if (!participant) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: participant })
      }
      case 'delete-participant': {
        if (!data.participantId) return NextResponse.json({ error: 'participantId required' }, { status: 400 })
        const deleted = await deleteParticipant(orgId, data.participantId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      // Academy courses
      case 'add-course': {
        const course = await addCourseToAcademy(orgId, data)
        return NextResponse.json({ data: course }, { status: 201 })
      }
      case 'remove-course': {
        if (!data.academyCourseId) return NextResponse.json({ error: 'academyCourseId required' }, { status: 400 })
        const deleted = await removeCourseFromAcademy(orgId, data.academyCourseId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      // Progress
      case 'update-progress': {
        const progress = await updateParticipantProgress(orgId, data)
        // Recalculate overall
        if (data.participantId) {
          await recalculateParticipantOverallProgress(orgId, data.participantId)
        }
        return NextResponse.json({ data: progress })
      }

      // Sessions
      case 'create-session': {
        const session = await createSession(orgId, data)
        return NextResponse.json({ data: session }, { status: 201 })
      }
      case 'update-session': {
        const { sessionId, ...updates } = data
        if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        const session = await updateSession(orgId, sessionId, updates)
        if (!session) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: session })
      }
      case 'delete-session': {
        if (!data.sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 })
        const deleted = await deleteSession(orgId, data.sessionId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }
      case 'rsvp-session': {
        if (!data.sessionId || !data.participantId) return NextResponse.json({ error: 'sessionId and participantId required' }, { status: 400 })
        const rsvp = await rsvpSession(orgId, data.sessionId, data.participantId)
        return NextResponse.json({ data: rsvp })
      }
      case 'mark-attendance': {
        if (!data.sessionId || !data.participantId) return NextResponse.json({ error: 'sessionId and participantId required' }, { status: 400 })
        const result = await markAttendance(orgId, data.sessionId, data.participantId, data.attended)
        return NextResponse.json({ data: result })
      }

      // Assignments
      case 'create-assignment': {
        const assignment = await createAssignment(orgId, data)
        return NextResponse.json({ data: assignment }, { status: 201 })
      }
      case 'update-assignment': {
        const { assignmentId, ...updates } = data
        if (!assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
        const assignment = await updateAssignment(orgId, assignmentId, updates)
        if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: assignment })
      }
      case 'delete-assignment': {
        if (!data.assignmentId) return NextResponse.json({ error: 'assignmentId required' }, { status: 400 })
        const deleted = await deleteAssignment(orgId, data.assignmentId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }
      case 'submit-assignment': {
        if (!data.assignmentId || !data.participantId) return NextResponse.json({ error: 'assignmentId and participantId required' }, { status: 400 })
        const submission = await submitAssignment(orgId, data)
        return NextResponse.json({ data: submission }, { status: 201 })
      }
      case 'grade-submission': {
        if (!data.submissionId) return NextResponse.json({ error: 'submissionId required' }, { status: 400 })
        const graded = await gradeSubmission(orgId, data.submissionId, data)
        if (!graded) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: graded })
      }

      // Discussions
      case 'create-discussion': {
        const post = await createDiscussion(orgId, data)
        return NextResponse.json({ data: post }, { status: 201 })
      }
      case 'delete-discussion': {
        if (!data.discussionId) return NextResponse.json({ error: 'discussionId required' }, { status: 400 })
        const deleted = await deleteDiscussion(orgId, data.discussionId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }
      case 'pin-discussion': {
        if (!data.discussionId) return NextResponse.json({ error: 'discussionId required' }, { status: 400 })
        const pinned = await pinDiscussion(orgId, data.discussionId, data.isPinned ?? true)
        return NextResponse.json({ data: pinned })
      }

      // Resources
      case 'create-resource': {
        const resource = await createResource(orgId, data)
        return NextResponse.json({ data: resource }, { status: 201 })
      }
      case 'delete-resource': {
        if (!data.resourceId) return NextResponse.json({ error: 'resourceId required' }, { status: 400 })
        const deleted = await deleteResource(orgId, data.resourceId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      // Certificates
      case 'create-certificate': {
        const cert = await createAcademyCertificate(orgId, data)
        return NextResponse.json({ data: cert }, { status: 201 })
      }
      case 'issue-certificate': {
        if (!data.certificateId) return NextResponse.json({ error: 'certificateId required' }, { status: 400 })
        const cert = await issueAcademyCertificate(orgId, data.certificateId, data.certificateUrl)
        if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: cert })
      }
      case 'update-certificate-requirements': {
        if (!data.certificateId) return NextResponse.json({ error: 'certificateId required' }, { status: 400 })
        const cert = await updateCertificateRequirements(orgId, data.certificateId, data.requirements)
        if (!cert) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: cert })
      }

      // Communications
      case 'create-communication': {
        const comm = await createCommunication(orgId, data)
        return NextResponse.json({ data: comm }, { status: 201 })
      }
      case 'send-communication': {
        if (!data.communicationId) return NextResponse.json({ error: 'communicationId required' }, { status: 400 })
        const comm = await sendCommunication(orgId, data.communicationId, data.recipientCount || 0)
        if (!comm) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: comm })
      }

      // Communication triggers
      case 'create-comm-trigger': {
        const trigger = await createCommTrigger(orgId, data)
        return NextResponse.json({ data: trigger }, { status: 201 })
      }
      case 'update-comm-trigger': {
        const { triggerId, ...updates } = data
        if (!triggerId) return NextResponse.json({ error: 'triggerId required' }, { status: 400 })
        const trigger = await updateCommTrigger(orgId, triggerId, updates)
        if (!trigger) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: trigger })
      }
      case 'delete-comm-trigger': {
        if (!data.triggerId) return NextResponse.json({ error: 'triggerId required' }, { status: 400 })
        const deleted = await deleteCommTrigger(orgId, data.triggerId)
        if (!deleted) return NextResponse.json({ error: 'Not found' }, { status: 404 })
        return NextResponse.json({ data: deleted })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[Academy POST]', error)
    return NextResponse.json({ error: error.message || 'Internal error' }, { status: 500 })
  }
}
