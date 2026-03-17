import { NextRequest, NextResponse } from 'next/server'
import {
  sendBroadcastEmail,
  sendFromTriggerTemplate,
  previewEmailTemplate,
  sendEnrollmentConfirmation,
  sendSessionReminder,
  sendAssignmentDueReminder,
  sendCertificateIssued,
  sendCohortStartReminder,
  sendAcademyEmail,
  getEmailLog,
} from '@/lib/academy-email'
import {
  getAcademyById,
  getParticipants,
  getCommTriggers,
  getSessions,
  getAssignments,
  getCohorts,
  getAcademyCertificates,
  getParticipantById,
} from '@/lib/academy-engine'

// ============================================================
// GET /api/academy/email?action=email-log
//
// Actions:
//   email-log  — List sent communications for an academy
// ============================================================

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'email-log'
    const academyId = url.searchParams.get('academyId')
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '25')

    switch (action) {
      case 'email-log': {
        if (!academyId) {
          return NextResponse.json({ error: 'academyId is required' }, { status: 400 })
        }

        const academy = await getAcademyById(orgId, academyId)
        if (!academy) {
          return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
        }

        const result = await getEmailLog(orgId, academyId, { page, limit })
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('[Academy Email GET]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================================
// POST /api/academy/email
//
// Actions:
//   send-broadcast   — Send broadcast email to academy participants
//   send-test        — Send a test email to a single address
//   preview-template — Preview an email template (returns HTML)
//   trigger          — Manually fire an automated email trigger
// ============================================================

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body as { action: string }

    switch (action) {
      // ----------------------------------------------------------
      // SEND BROADCAST
      // ----------------------------------------------------------
      case 'send-broadcast': {
        const { academyId, subject, body: emailBody, cohortId, ctaLabel, ctaUrl } = body as {
          academyId: string
          subject: string
          body: string
          cohortId?: string
          ctaLabel?: string
          ctaUrl?: string
        }

        if (!academyId) {
          return NextResponse.json({ error: 'academyId is required' }, { status: 400 })
        }
        if (!subject?.trim()) {
          return NextResponse.json({ error: 'subject is required' }, { status: 400 })
        }
        if (!emailBody?.trim()) {
          return NextResponse.json({ error: 'body is required' }, { status: 400 })
        }

        const academy = await getAcademyById(orgId, academyId)
        if (!academy) {
          return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
        }

        // Fetch participants (optionally filtered by cohort)
        const participantsResult = await getParticipants(orgId, {
          academyId,
          cohortId: cohortId || undefined,
          status: 'active',
          limit: 200,
        })

        const participants = participantsResult.data.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          language: p.language,
          academyId: p.academyId,
          cohortId: p.cohortId,
        }))

        if (participants.length === 0) {
          return NextResponse.json({ error: 'No active participants found' }, { status: 400 })
        }

        const academyData = {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          brandColor: academy.brandColor,
          logoUrl: academy.logoUrl,
          welcomeMessage: academy.welcomeMessage,
        }

        const result = await sendBroadcastEmail(orgId, academyData, participants, {
          subject,
          body: emailBody,
          ctaLabel,
          ctaUrl,
        })

        return NextResponse.json({
          success: true,
          sent: result.sent,
          failed: result.failed,
          total: result.total,
          errors: result.errors.length > 0 ? result.errors : undefined,
        })
      }

      // ----------------------------------------------------------
      // SEND TEST — Send to a single email for testing
      // ----------------------------------------------------------
      case 'send-test': {
        const { academyId, to, subject, body: emailBody, type, variables } = body as {
          academyId: string
          to: string
          subject?: string
          body?: string
          type?: 'enrollment' | 'session_reminder' | 'assignment_due' | 'certificate' | 'cohort_start' | 'broadcast'
          variables?: Record<string, string>
        }

        if (!academyId) {
          return NextResponse.json({ error: 'academyId is required' }, { status: 400 })
        }
        if (!to?.trim()) {
          return NextResponse.json({ error: 'to (email address) is required' }, { status: 400 })
        }

        const academy = await getAcademyById(orgId, academyId)
        if (!academy) {
          return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
        }

        let testSubject: string
        let testHtml: string

        if (type) {
          // Use a template preview to generate the test email
          const preview = previewEmailTemplate({
            type,
            academy: {
              id: academy.id,
              name: academy.name,
              slug: academy.slug,
              brandColor: academy.brandColor,
              logoUrl: academy.logoUrl,
              welcomeMessage: academy.welcomeMessage,
            },
            variables,
          })
          testSubject = `[TEST] ${preview.subject}`
          testHtml = preview.html
        } else {
          // Use custom subject/body
          if (!subject?.trim()) {
            return NextResponse.json({ error: 'subject is required when type is not specified' }, { status: 400 })
          }
          testSubject = `[TEST] ${subject}`
          testHtml = emailBody || `<p>${subject}</p>`
        }

        const success = await sendAcademyEmail(orgId, to, testSubject, testHtml, {
          academyId,
          triggerName: 'test_send',
          type: 'broadcast',
        })

        return NextResponse.json({ success, sent: success ? 1 : 0 })
      }

      // ----------------------------------------------------------
      // PREVIEW TEMPLATE — Returns rendered HTML without sending
      // ----------------------------------------------------------
      case 'preview-template':
      case 'preview': {
        const { academyId, type, variables } = body as {
          academyId: string
          type: 'enrollment' | 'session_reminder' | 'assignment_due' | 'certificate' | 'cohort_start' | 'broadcast'
          variables?: Record<string, string>
        }

        if (!academyId) {
          return NextResponse.json({ error: 'academyId is required' }, { status: 400 })
        }
        if (!type) {
          return NextResponse.json({ error: 'type is required' }, { status: 400 })
        }

        const academy = await getAcademyById(orgId, academyId)
        if (!academy) {
          return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
        }

        const result = previewEmailTemplate({
          type,
          academy: {
            id: academy.id,
            name: academy.name,
            slug: academy.slug,
            brandColor: academy.brandColor,
            logoUrl: academy.logoUrl,
            welcomeMessage: academy.welcomeMessage,
          },
          variables,
        })

        return NextResponse.json({ subject: result.subject, html: result.html })
      }

      // ----------------------------------------------------------
      // TRIGGER — Manually fire an automated email
      // ----------------------------------------------------------
      case 'trigger': {
        const { academyId, triggerEvent, participantId, sessionId, assignmentId, cohortId, certificateId } = body as {
          academyId: string
          triggerEvent: string
          participantId?: string
          sessionId?: string
          assignmentId?: string
          cohortId?: string
          certificateId?: string
        }

        if (!academyId) {
          return NextResponse.json({ error: 'academyId is required' }, { status: 400 })
        }
        if (!triggerEvent) {
          return NextResponse.json({ error: 'triggerEvent is required' }, { status: 400 })
        }

        const academy = await getAcademyById(orgId, academyId)
        if (!academy) {
          return NextResponse.json({ error: 'Academy not found' }, { status: 404 })
        }

        const academyData = {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          brandColor: academy.brandColor,
          logoUrl: academy.logoUrl,
          welcomeMessage: academy.welcomeMessage,
        }

        // Handle built-in triggers
        switch (triggerEvent) {
          case 'enrollment_confirmation': {
            if (!participantId) {
              return NextResponse.json({ error: 'participantId required for enrollment trigger' }, { status: 400 })
            }
            const participant = await getParticipantById(orgId, participantId)
            if (!participant) {
              return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
            }
            const success = await sendEnrollmentConfirmation(orgId, {
              id: participant.id,
              fullName: participant.fullName,
              email: participant.email,
              language: participant.language,
              academyId: participant.academyId,
              cohortId: participant.cohortId,
            }, academyData)
            return NextResponse.json({ success, sent: success ? 1 : 0 })
          }

          case 'session_reminder_24h':
          case 'session_reminder_1h': {
            if (!sessionId) {
              return NextResponse.json({ error: 'sessionId required for session reminder' }, { status: 400 })
            }
            const sessions = await getSessions(orgId, academyId)
            const session = sessions.find((s) => s.id === sessionId)
            if (!session) {
              return NextResponse.json({ error: 'Session not found' }, { status: 404 })
            }

            const pResult = await getParticipants(orgId, {
              academyId,
              cohortId: session.cohortId || undefined,
              status: 'active',
              limit: 200,
            })
            const participants = pResult.data.map((p) => ({
              id: p.id, fullName: p.fullName, email: p.email,
              language: p.language, academyId: p.academyId, cohortId: p.cohortId,
            }))

            const reminderType = triggerEvent === 'session_reminder_24h' ? '24h' : '1h'
            const result = await sendSessionReminder(orgId, participants, academyData, {
              id: session.id,
              title: session.title,
              description: session.description,
              type: session.type,
              scheduledDate: session.scheduledDate,
              scheduledTime: session.scheduledTime,
              durationMinutes: session.durationMinutes,
              instructor: session.instructor,
              meetingUrl: session.meetingUrl,
            }, reminderType)

            return NextResponse.json({ success: true, sent: result.sent, failed: result.failed, total: result.total })
          }

          case 'assignment_due_48h': {
            if (!assignmentId) {
              return NextResponse.json({ error: 'assignmentId required for assignment reminder' }, { status: 400 })
            }
            const assignments = await getAssignments(orgId, academyId)
            const assignment = assignments.find((a) => a.id === assignmentId)
            if (!assignment) {
              return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
            }

            const pResult = await getParticipants(orgId, { academyId, status: 'active', limit: 200 })
            const participants = pResult.data.map((p) => ({
              id: p.id, fullName: p.fullName, email: p.email,
              language: p.language, academyId: p.academyId, cohortId: p.cohortId,
            }))

            const result = await sendAssignmentDueReminder(orgId, participants, academyData, {
              id: assignment.id,
              title: assignment.title,
              description: assignment.description,
              dueDate: assignment.dueDate,
              maxScore: assignment.maxScore,
            })

            return NextResponse.json({ success: true, sent: result.sent, failed: result.failed, total: result.total })
          }

          case 'certificate_issued': {
            if (!certificateId || !participantId) {
              return NextResponse.json({ error: 'certificateId and participantId required' }, { status: 400 })
            }
            const certs = await getAcademyCertificates(orgId, { academyId })
            const certificate = certs.find((c) => c.id === certificateId)
            if (!certificate) {
              return NextResponse.json({ error: 'Certificate not found' }, { status: 404 })
            }
            const participant = await getParticipantById(orgId, participantId)
            if (!participant) {
              return NextResponse.json({ error: 'Participant not found' }, { status: 404 })
            }

            const success = await sendCertificateIssued(orgId, {
              id: participant.id, fullName: participant.fullName, email: participant.email,
              language: participant.language, academyId: participant.academyId, cohortId: participant.cohortId,
            }, academyData, {
              id: certificate.id,
              name: certificate.name,
              certificateNumber: certificate.certificateNumber,
              certificateUrl: certificate.certificateUrl,
            })

            return NextResponse.json({ success, sent: success ? 1 : 0 })
          }

          case 'cohort_start_24h': {
            if (!cohortId) {
              return NextResponse.json({ error: 'cohortId required for cohort start reminder' }, { status: 400 })
            }
            const cohorts = await getCohorts(orgId, academyId)
            const cohort = cohorts.find((c) => c.id === cohortId)
            if (!cohort) {
              return NextResponse.json({ error: 'Cohort not found' }, { status: 404 })
            }

            const pResult = await getParticipants(orgId, { academyId, cohortId, status: 'active', limit: 200 })
            const participants = pResult.data.map((p) => ({
              id: p.id, fullName: p.fullName, email: p.email,
              language: p.language, academyId: p.academyId, cohortId: p.cohortId,
            }))

            const result = await sendCohortStartReminder(orgId, participants, academyData, {
              id: cohort.id,
              name: cohort.name,
              startDate: cohort.startDate,
              endDate: cohort.endDate,
              facilitatorName: cohort.facilitatorName,
              facilitatorEmail: cohort.facilitatorEmail,
            })

            return NextResponse.json({ success: true, sent: result.sent, failed: result.failed, total: result.total })
          }

          default: {
            // Try to find a custom trigger template
            const triggers = await getCommTriggers(orgId, academyId)
            const customTrigger = triggers.find(
              (t) => t.triggerEvent === triggerEvent && t.isActive
            )
            if (!customTrigger) {
              return NextResponse.json(
                { error: `Unknown trigger event: ${triggerEvent}. No matching active trigger found.` },
                { status: 400 }
              )
            }

            const pResult = await getParticipants(orgId, {
              academyId,
              cohortId: cohortId || undefined,
              status: 'active',
              limit: 200,
            })
            const participants = pResult.data.map((p) => ({
              id: p.id, fullName: p.fullName, email: p.email,
              language: p.language, academyId: p.academyId, cohortId: p.cohortId,
            }))

            const result = await sendFromTriggerTemplate(orgId, academyData, participants, {
              name: customTrigger.name,
              triggerEvent: customTrigger.triggerEvent,
              subjectTemplate: customTrigger.subjectTemplate,
              bodyTemplate: customTrigger.bodyTemplate,
            })

            return NextResponse.json({ success: true, sent: result.sent, failed: result.failed, total: result.total })
          }
        }
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('[Academy Email POST]', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
