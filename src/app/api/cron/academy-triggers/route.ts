import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'
import {
  sendSessionReminder,
  sendAssignmentDueReminder,
  sendCohortStartReminder,
  findScheduledCommunications,
  markCommunicationSent,
  markCommunicationFailed,
  sendBroadcastEmail,
} from '@/lib/academy-email'
import { getParticipants, getAcademyById } from '@/lib/academy-engine'

// ============================================================
// GET /api/cron/academy-triggers
//
// Vercel Cron Job: Runs every hour to check for upcoming events
// and send automated email notifications.
//
// Checks:
//   1. Sessions starting within 24h  (session_reminder_24h)
//   2. Sessions starting within 1h   (session_reminder_1h)
//   3. Assignments due within 48h    (assignment_due_48h)
//   4. Cohorts starting within 24h   (cohort_start_24h)
//
// Idempotency: Checks academy_communications table for existing
// records with the same triggerName + academyId before sending.
// ============================================================

interface TriggerResult {
  trigger: string
  academyId: string
  entityId: string
  sent: number
  skipped: boolean
  error?: string
}

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const now = new Date()
    const results: TriggerResult[] = []

    // --------------------------------------------------------
    // Fetch all active academies
    // --------------------------------------------------------
    const activeAcademies = await db
      .select()
      .from(schema.academies)
      .where(eq(schema.academies.status, 'active'))

    if (activeAcademies.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active academies found',
        results: [],
        processedAt: now.toISOString(),
      })
    }

    for (const academy of activeAcademies) {
      const orgId = academy.orgId
      const academyId = academy.id

      const academyData = {
        id: academy.id,
        name: academy.name,
        slug: academy.slug,
        brandColor: academy.brandColor,
        logoUrl: academy.logoUrl,
        welcomeMessage: academy.welcomeMessage,
      }

      // Check if this academy has the relevant triggers active
      const triggers = await db
        .select()
        .from(schema.academyCommTriggers)
        .where(
          and(
            eq(schema.academyCommTriggers.orgId, orgId),
            eq(schema.academyCommTriggers.academyId, academyId),
            eq(schema.academyCommTriggers.isActive, true)
          )
        )

      const activeTriggerEvents = new Set(triggers.map((t) => t.triggerEvent))

      // --------------------------------------------------------
      // 1. SESSION REMINDERS (24h and 1h)
      // --------------------------------------------------------
      const sessions = await db
        .select()
        .from(schema.academySessions)
        .where(
          and(
            eq(schema.academySessions.orgId, orgId),
            eq(schema.academySessions.academyId, academyId)
          )
        )

      for (const session of sessions) {
        const sessionDate = new Date(session.scheduledDate)
        // If scheduledTime is set, parse it; otherwise use start of day
        if (session.scheduledTime) {
          const timeMatch = session.scheduledTime.match(/^(\d{1,2}):(\d{2})/)
          if (timeMatch) {
            sessionDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0)
          }
        }

        const hoursUntilSession = (sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60)

        // 24h reminder: between 23h and 25h away
        if (
          hoursUntilSession > 23 &&
          hoursUntilSession <= 25 &&
          activeTriggerEvents.has('session_reminder_24h')
        ) {
          const triggerKey = `session_reminder_24h:${session.id}`
          const alreadySent = await hasBeenSent(orgId, academyId, triggerKey)

          if (alreadySent) {
            results.push({ trigger: 'session_reminder_24h', academyId, entityId: session.id, sent: 0, skipped: true })
          } else {
            try {
              const participants = await getActiveParticipants(orgId, academyId, session.cohortId)
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
              }, '24h')
              results.push({ trigger: 'session_reminder_24h', academyId, entityId: session.id, sent: result.sent, skipped: false })
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              results.push({ trigger: 'session_reminder_24h', academyId, entityId: session.id, sent: 0, skipped: false, error: msg })
            }
          }
        }

        // 1h reminder: between 0.5h and 1.5h away
        if (
          hoursUntilSession > 0.5 &&
          hoursUntilSession <= 1.5 &&
          activeTriggerEvents.has('session_reminder_1h')
        ) {
          const triggerKey = `session_reminder_1h:${session.id}`
          const alreadySent = await hasBeenSent(orgId, academyId, triggerKey)

          if (alreadySent) {
            results.push({ trigger: 'session_reminder_1h', academyId, entityId: session.id, sent: 0, skipped: true })
          } else {
            try {
              const participants = await getActiveParticipants(orgId, academyId, session.cohortId)
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
              }, '1h')
              results.push({ trigger: 'session_reminder_1h', academyId, entityId: session.id, sent: result.sent, skipped: false })
            } catch (err) {
              const msg = err instanceof Error ? err.message : String(err)
              results.push({ trigger: 'session_reminder_1h', academyId, entityId: session.id, sent: 0, skipped: false, error: msg })
            }
          }
        }
      }

      // --------------------------------------------------------
      // 2. ASSIGNMENT DUE REMINDERS (48h)
      // --------------------------------------------------------
      if (activeTriggerEvents.has('assignment_due_48h')) {
        const assignments = await db
          .select()
          .from(schema.academyAssignments)
          .where(
            and(
              eq(schema.academyAssignments.orgId, orgId),
              eq(schema.academyAssignments.academyId, academyId)
            )
          )

        for (const assignment of assignments) {
          if (!assignment.dueDate) continue

          const dueDate = new Date(assignment.dueDate)
          const hoursUntilDue = (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          // 48h reminder: between 47h and 49h away
          if (hoursUntilDue > 47 && hoursUntilDue <= 49) {
            const triggerKey = `assignment_due_48h:${assignment.id}`
            const alreadySent = await hasBeenSent(orgId, academyId, triggerKey)

            if (alreadySent) {
              results.push({ trigger: 'assignment_due_48h', academyId, entityId: assignment.id, sent: 0, skipped: true })
            } else {
              try {
                const participants = await getActiveParticipants(orgId, academyId, null)
                const result = await sendAssignmentDueReminder(orgId, participants, academyData, {
                  id: assignment.id,
                  title: assignment.title,
                  description: assignment.description,
                  dueDate: assignment.dueDate,
                  maxScore: assignment.maxScore,
                })
                results.push({ trigger: 'assignment_due_48h', academyId, entityId: assignment.id, sent: result.sent, skipped: false })
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                results.push({ trigger: 'assignment_due_48h', academyId, entityId: assignment.id, sent: 0, skipped: false, error: msg })
              }
            }
          }
        }
      }

      // --------------------------------------------------------
      // 3. COHORT START REMINDERS (24h)
      // --------------------------------------------------------
      if (activeTriggerEvents.has('cohort_start_24h')) {
        const cohorts = await db
          .select()
          .from(schema.academyCohorts)
          .where(
            and(
              eq(schema.academyCohorts.orgId, orgId),
              eq(schema.academyCohorts.academyId, academyId),
              eq(schema.academyCohorts.status, 'upcoming')
            )
          )

        for (const cohort of cohorts) {
          const startDate = new Date(cohort.startDate)
          const hoursUntilStart = (startDate.getTime() - now.getTime()) / (1000 * 60 * 60)

          // 24h reminder: between 23h and 25h away
          if (hoursUntilStart > 23 && hoursUntilStart <= 25) {
            const triggerKey = `cohort_start_24h:${cohort.id}`
            const alreadySent = await hasBeenSent(orgId, academyId, triggerKey)

            if (alreadySent) {
              results.push({ trigger: 'cohort_start_24h', academyId, entityId: cohort.id, sent: 0, skipped: true })
            } else {
              try {
                const participants = await getActiveParticipants(orgId, academyId, cohort.id)
                const result = await sendCohortStartReminder(orgId, participants, academyData, {
                  id: cohort.id,
                  name: cohort.name,
                  startDate: cohort.startDate,
                  endDate: cohort.endDate,
                  facilitatorName: cohort.facilitatorName,
                  facilitatorEmail: cohort.facilitatorEmail,
                })
                results.push({ trigger: 'cohort_start_24h', academyId, entityId: cohort.id, sent: result.sent, skipped: false })
              } catch (err) {
                const msg = err instanceof Error ? err.message : String(err)
                results.push({ trigger: 'cohort_start_24h', academyId, entityId: cohort.id, sent: 0, skipped: false, error: msg })
              }
            }
          }
        }
      }
    }

    // --------------------------------------------------------
    // 4. SCHEDULED COMMUNICATIONS
    // --------------------------------------------------------
    const scheduledComms = await findScheduledCommunications()

    for (const comm of scheduledComms) {
      try {
        const academy = await getAcademyById(comm.orgId, comm.academyId)
        if (!academy) {
          await markCommunicationFailed(comm.id)
          results.push({
            trigger: 'scheduled_communication',
            academyId: comm.academyId,
            entityId: comm.id,
            sent: 0,
            skipped: false,
            error: 'Academy not found',
          })
          continue
        }

        const pResult = await getParticipants(comm.orgId, {
          academyId: comm.academyId,
          status: 'active',
          limit: 200,
        })

        const participants = pResult.data.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          email: p.email,
          language: p.language,
          academyId: p.academyId,
          cohortId: p.cohortId,
        }))

        if (participants.length === 0) {
          await markCommunicationFailed(comm.id)
          results.push({
            trigger: 'scheduled_communication',
            academyId: comm.academyId,
            entityId: comm.id,
            sent: 0,
            skipped: false,
            error: 'No active participants',
          })
          continue
        }

        const academyData = {
          id: academy.id,
          name: academy.name,
          slug: academy.slug,
          brandColor: academy.brandColor,
          logoUrl: academy.logoUrl,
          welcomeMessage: academy.welcomeMessage,
        }

        const sendResult = await sendBroadcastEmail(comm.orgId, academyData, participants, {
          subject: comm.subject,
          body: comm.body || '',
        })

        await markCommunicationSent(comm.id, sendResult.sent)

        results.push({
          trigger: 'scheduled_communication',
          academyId: comm.academyId,
          entityId: comm.id,
          sent: sendResult.sent,
          skipped: false,
        })
      } catch (err) {
        await markCommunicationFailed(comm.id)
        const msg = err instanceof Error ? err.message : String(err)
        results.push({
          trigger: 'scheduled_communication',
          academyId: comm.academyId,
          entityId: comm.id,
          sent: 0,
          skipped: false,
          error: msg,
        })
      }
    }

    const totalSent = results.reduce((sum, r) => sum + r.sent, 0)
    const totalSkipped = results.filter((r) => r.skipped).length
    const totalErrors = results.filter((r) => r.error).length

    console.log(
      `[AcademyTriggers] Processed ${activeAcademies.length} academies: ${totalSent} emails sent, ${totalSkipped} skipped, ${totalErrors} errors`
    )

    return NextResponse.json({
      success: true,
      processedAt: now.toISOString(),
      academiesProcessed: activeAcademies.length,
      totalSent,
      totalSkipped,
      totalErrors,
      results,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal error'
    console.error('[AcademyTriggers] Fatal error:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Check if a specific trigger has already been sent (idempotency).
 * Uses the triggerName field in academy_communications as a composite key
 * of "trigger_event:entity_id" to prevent duplicate sends.
 */
async function hasBeenSent(
  orgId: string,
  academyId: string,
  triggerKey: string
): Promise<boolean> {
  const [existing] = await db
    .select({ id: schema.academyCommunications.id })
    .from(schema.academyCommunications)
    .where(
      and(
        eq(schema.academyCommunications.orgId, orgId),
        eq(schema.academyCommunications.academyId, academyId),
        eq(schema.academyCommunications.triggerName, triggerKey),
        eq(schema.academyCommunications.status, 'sent')
      )
    )
    .limit(1)

  return !!existing
}

/**
 * Fetch active participants for an academy, optionally filtered by cohort.
 */
async function getActiveParticipants(
  orgId: string,
  academyId: string,
  cohortId: string | null
): Promise<Array<{
  id: string
  fullName: string
  email: string
  language: string
  academyId: string
  cohortId: string | null
}>> {
  const conditions = [
    eq(schema.academyParticipants.orgId, orgId),
    eq(schema.academyParticipants.academyId, academyId),
    eq(schema.academyParticipants.status, 'active'),
  ]

  if (cohortId) {
    conditions.push(eq(schema.academyParticipants.cohortId, cohortId))
  }

  const rows = await db
    .select({
      id: schema.academyParticipants.id,
      fullName: schema.academyParticipants.fullName,
      email: schema.academyParticipants.email,
      language: schema.academyParticipants.language,
      academyId: schema.academyParticipants.academyId,
      cohortId: schema.academyParticipants.cohortId,
    })
    .from(schema.academyParticipants)
    .where(and(...conditions))
    .limit(200)

  return rows
}
