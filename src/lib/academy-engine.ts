/**
 * Academy Engine — Production backend for external learning academies.
 *
 * Handles CRUD for academies, cohorts, participants, sessions, assignments,
 * discussions, resources, certificates, and communications.
 *
 * All functions require orgId for RLS. External participants authenticate
 * separately via academy_participants.password_hash.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, sql, ilike, or, inArray } from 'drizzle-orm'
import * as crypto from 'crypto'

// ============================================================
// TYPES
// ============================================================

interface PaginationOpts {
  page?: number
  limit?: number
}

function paginate(opts: PaginationOpts) {
  const page = Math.max(1, opts.page || 1)
  const limit = Math.min(200, Math.max(1, opts.limit || 50))
  return { page, limit, offset: (page - 1) * limit }
}

function paginationMeta(total: number, page: number, limit: number) {
  const totalPages = Math.ceil(total / limit)
  return { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 }
}

// ============================================================
// ACADEMIES — CRUD
// ============================================================

export async function getAcademies(orgId: string, opts?: PaginationOpts & { search?: string; status?: string }) {
  const { page, limit, offset } = paginate(opts || {})

  const conditions = [eq(schema.academies.orgId, orgId)]
  if (opts?.status) conditions.push(eq(schema.academies.status, opts.status as any))
  if (opts?.search) conditions.push(ilike(schema.academies.name, `%${opts.search}%`))

  const where = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.academies).where(where).orderBy(desc(schema.academies.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academies).where(where),
  ])

  return { data: rows, pagination: paginationMeta(countResult[0]?.count || 0, page, limit) }
}

export async function getAcademyById(orgId: string, academyId: string) {
  const [row] = await db.select().from(schema.academies)
    .where(and(eq(schema.academies.id, academyId), eq(schema.academies.orgId, orgId)))
  return row || null
}

export async function getAcademyBySlug(orgId: string, slug: string) {
  const [row] = await db.select().from(schema.academies)
    .where(and(eq(schema.academies.slug, slug), eq(schema.academies.orgId, orgId)))
  return row || null
}

export async function createAcademy(orgId: string, data: {
  name: string; description?: string; slug: string; logoUrl?: string;
  brandColor?: string; welcomeMessage?: string; enrollmentType?: 'public' | 'private';
  communityEnabled?: boolean; languages?: string[]; completionRules?: any;
  curriculumCourseIds?: string[]; curriculumPathIds?: string[]; createdBy?: string;
}) {
  const [row] = await db.insert(schema.academies).values({
    orgId,
    name: data.name,
    description: data.description || null,
    slug: data.slug,
    logoUrl: data.logoUrl || null,
    brandColor: data.brandColor || '#2563eb',
    welcomeMessage: data.welcomeMessage || null,
    enrollmentType: (data.enrollmentType || 'private') as any,
    communityEnabled: data.communityEnabled ?? true,
    languages: JSON.stringify(data.languages || ['en']),
    completionRules: data.completionRules ? JSON.stringify(data.completionRules) : null,
    curriculumCourseIds: JSON.stringify(data.curriculumCourseIds || []),
    curriculumPathIds: JSON.stringify(data.curriculumPathIds || []),
    createdBy: data.createdBy || null,
  }).returning()
  return row
}

export async function updateAcademy(orgId: string, academyId: string, data: Partial<{
  name: string; description: string; slug: string; logoUrl: string;
  brandColor: string; welcomeMessage: string; enrollmentType: 'public' | 'private';
  status: 'draft' | 'active' | 'archived'; communityEnabled: boolean;
  languages: string[]; completionRules: any; curriculumCourseIds: string[];
  curriculumPathIds: string[];
}>) {
  const updates: any = { updatedAt: new Date() }
  if (data.name !== undefined) updates.name = data.name
  if (data.description !== undefined) updates.description = data.description
  if (data.slug !== undefined) updates.slug = data.slug
  if (data.logoUrl !== undefined) updates.logoUrl = data.logoUrl
  if (data.brandColor !== undefined) updates.brandColor = data.brandColor
  if (data.welcomeMessage !== undefined) updates.welcomeMessage = data.welcomeMessage
  if (data.enrollmentType !== undefined) updates.enrollmentType = data.enrollmentType
  if (data.status !== undefined) updates.status = data.status
  if (data.communityEnabled !== undefined) updates.communityEnabled = data.communityEnabled
  if (data.languages !== undefined) updates.languages = JSON.stringify(data.languages)
  if (data.completionRules !== undefined) updates.completionRules = JSON.stringify(data.completionRules)
  if (data.curriculumCourseIds !== undefined) updates.curriculumCourseIds = JSON.stringify(data.curriculumCourseIds)
  if (data.curriculumPathIds !== undefined) updates.curriculumPathIds = JSON.stringify(data.curriculumPathIds)

  const [row] = await db.update(schema.academies).set(updates)
    .where(and(eq(schema.academies.id, academyId), eq(schema.academies.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteAcademy(orgId: string, academyId: string) {
  const [row] = await db.delete(schema.academies)
    .where(and(eq(schema.academies.id, academyId), eq(schema.academies.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// COHORTS
// ============================================================

export async function getCohorts(orgId: string, academyId: string) {
  return db.select().from(schema.academyCohorts)
    .where(and(eq(schema.academyCohorts.orgId, orgId), eq(schema.academyCohorts.academyId, academyId)))
    .orderBy(asc(schema.academyCohorts.startDate))
}

export async function createCohort(orgId: string, data: {
  academyId: string; name: string; startDate: string; endDate: string;
  facilitatorName?: string; facilitatorEmail?: string; maxParticipants?: number;
}) {
  const [row] = await db.insert(schema.academyCohorts).values({
    orgId,
    academyId: data.academyId,
    name: data.name,
    startDate: data.startDate,
    endDate: data.endDate,
    facilitatorName: data.facilitatorName || null,
    facilitatorEmail: data.facilitatorEmail || null,
    maxParticipants: data.maxParticipants || null,
    status: 'upcoming' as any,
  }).returning()
  return row
}

export async function updateCohort(orgId: string, cohortId: string, data: Partial<{
  name: string; startDate: string; endDate: string; facilitatorName: string;
  facilitatorEmail: string; maxParticipants: number; status: 'upcoming' | 'active' | 'completed';
}>) {
  const updates: any = {}
  if (data.name !== undefined) updates.name = data.name
  if (data.startDate !== undefined) updates.startDate = data.startDate
  if (data.endDate !== undefined) updates.endDate = data.endDate
  if (data.facilitatorName !== undefined) updates.facilitatorName = data.facilitatorName
  if (data.facilitatorEmail !== undefined) updates.facilitatorEmail = data.facilitatorEmail
  if (data.maxParticipants !== undefined) updates.maxParticipants = data.maxParticipants
  if (data.status !== undefined) updates.status = data.status

  const [row] = await db.update(schema.academyCohorts).set(updates)
    .where(and(eq(schema.academyCohorts.id, cohortId), eq(schema.academyCohorts.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteCohort(orgId: string, cohortId: string) {
  const [row] = await db.delete(schema.academyCohorts)
    .where(and(eq(schema.academyCohorts.id, cohortId), eq(schema.academyCohorts.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// PARTICIPANTS
// ============================================================

export async function getParticipants(orgId: string, opts?: PaginationOpts & {
  academyId?: string; cohortId?: string; status?: string; search?: string;
}) {
  const { page, limit, offset } = paginate(opts || {})

  const conditions = [eq(schema.academyParticipants.orgId, orgId)]
  if (opts?.academyId) conditions.push(eq(schema.academyParticipants.academyId, opts.academyId))
  if (opts?.cohortId) conditions.push(eq(schema.academyParticipants.cohortId, opts.cohortId))
  if (opts?.status) conditions.push(eq(schema.academyParticipants.status, opts.status as any))
  if (opts?.search) conditions.push(or(
    ilike(schema.academyParticipants.fullName, `%${opts.search}%`),
    ilike(schema.academyParticipants.email, `%${opts.search}%`),
    ilike(schema.academyParticipants.businessName, `%${opts.search}%`),
  )!)

  const where = and(...conditions)

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.academyParticipants).where(where)
      .orderBy(desc(schema.academyParticipants.createdAt)).limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyParticipants).where(where),
  ])

  return { data: rows, pagination: paginationMeta(countResult[0]?.count || 0, page, limit) }
}

export async function getParticipantById(orgId: string, participantId: string) {
  const [row] = await db.select().from(schema.academyParticipants)
    .where(and(eq(schema.academyParticipants.id, participantId), eq(schema.academyParticipants.orgId, orgId)))
  return row || null
}

export async function getParticipantByEmail(orgId: string, academyId: string, email: string) {
  const [row] = await db.select().from(schema.academyParticipants)
    .where(and(
      eq(schema.academyParticipants.orgId, orgId),
      eq(schema.academyParticipants.academyId, academyId),
      eq(schema.academyParticipants.email, email),
    ))
  return row || null
}

export async function createParticipant(orgId: string, data: {
  academyId: string; cohortId?: string; fullName: string; email: string;
  phone?: string; businessName?: string; country?: string; language?: string;
}) {
  const invitationToken = crypto.randomBytes(32).toString('hex')

  const [row] = await db.insert(schema.academyParticipants).values({
    orgId,
    academyId: data.academyId,
    cohortId: data.cohortId || null,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone || null,
    businessName: data.businessName || null,
    country: data.country || null,
    language: data.language || 'en',
    invitationToken,
    status: 'active' as any,
    progress: 0,
  }).returning()
  return row
}

export async function updateParticipant(orgId: string, participantId: string, data: Partial<{
  fullName: string; email: string; phone: string; businessName: string;
  country: string; language: string; cohortId: string; status: string;
  progress: number; passwordHash: string; emailVerified: boolean;
}>) {
  const updates: any = { updatedAt: new Date() }
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) updates[k] = v })

  const [row] = await db.update(schema.academyParticipants).set(updates)
    .where(and(eq(schema.academyParticipants.id, participantId), eq(schema.academyParticipants.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteParticipant(orgId: string, participantId: string) {
  const [row] = await db.delete(schema.academyParticipants)
    .where(and(eq(schema.academyParticipants.id, participantId), eq(schema.academyParticipants.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// ACADEMY COURSES (join table)
// ============================================================

export async function getAcademyCourses(orgId: string, academyId: string) {
  return db.select().from(schema.academyCourses)
    .where(and(eq(schema.academyCourses.orgId, orgId), eq(schema.academyCourses.academyId, academyId)))
    .orderBy(asc(schema.academyCourses.moduleNumber))
}

export async function addCourseToAcademy(orgId: string, data: {
  academyId: string; courseId: string; moduleNumber: number; isRequired?: boolean;
}) {
  const [row] = await db.insert(schema.academyCourses).values({
    orgId,
    academyId: data.academyId,
    courseId: data.courseId,
    moduleNumber: data.moduleNumber,
    isRequired: data.isRequired ?? true,
  }).returning()
  return row
}

export async function removeCourseFromAcademy(orgId: string, academyCourseId: string) {
  const [row] = await db.delete(schema.academyCourses)
    .where(and(eq(schema.academyCourses.id, academyCourseId), eq(schema.academyCourses.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// PARTICIPANT PROGRESS
// ============================================================

export async function getParticipantProgress(orgId: string, participantId: string) {
  return db.select().from(schema.academyParticipantProgress)
    .where(and(
      eq(schema.academyParticipantProgress.orgId, orgId),
      eq(schema.academyParticipantProgress.participantId, participantId),
    ))
    .orderBy(asc(schema.academyParticipantProgress.createdAt))
}

export async function updateParticipantProgress(orgId: string, data: {
  participantId: string; academyCourseId: string;
  status?: 'not_started' | 'in_progress' | 'completed'; progress?: number;
  score?: number; timeSpentMinutes?: number;
}) {
  // Upsert: find existing or create
  const [existing] = await db.select().from(schema.academyParticipantProgress)
    .where(and(
      eq(schema.academyParticipantProgress.orgId, orgId),
      eq(schema.academyParticipantProgress.participantId, data.participantId),
      eq(schema.academyParticipantProgress.academyCourseId, data.academyCourseId),
    ))

  if (existing) {
    const updates: any = { updatedAt: new Date() }
    if (data.status) updates.status = data.status
    if (data.progress !== undefined) updates.progress = data.progress
    if (data.score !== undefined) updates.score = data.score
    if (data.timeSpentMinutes !== undefined) updates.timeSpentMinutes = data.timeSpentMinutes
    if (data.status === 'in_progress' && !existing.startedAt) updates.startedAt = new Date()
    if (data.status === 'completed') updates.completedAt = new Date()

    const [row] = await db.update(schema.academyParticipantProgress).set(updates)
      .where(eq(schema.academyParticipantProgress.id, existing.id))
      .returning()
    return row
  } else {
    const [row] = await db.insert(schema.academyParticipantProgress).values({
      orgId,
      participantId: data.participantId,
      academyCourseId: data.academyCourseId,
      status: (data.status || 'not_started') as any,
      progress: data.progress || 0,
      score: data.score || null,
      timeSpentMinutes: data.timeSpentMinutes || 0,
      startedAt: data.status === 'in_progress' ? new Date() : null,
      completedAt: data.status === 'completed' ? new Date() : null,
    }).returning()
    return row
  }
}

// Recalculate overall progress for a participant based on course progress
export async function recalculateParticipantOverallProgress(orgId: string, participantId: string) {
  const progress = await db.select().from(schema.academyParticipantProgress)
    .where(and(
      eq(schema.academyParticipantProgress.orgId, orgId),
      eq(schema.academyParticipantProgress.participantId, participantId),
    ))

  if (progress.length === 0) return

  const totalProgress = progress.reduce((sum, p) => sum + (p.progress || 0), 0)
  const avg = Math.round(totalProgress / progress.length)

  await db.update(schema.academyParticipants).set({ progress: avg, updatedAt: new Date() })
    .where(eq(schema.academyParticipants.id, participantId))
}

// ============================================================
// SESSIONS
// ============================================================

export async function getSessions(orgId: string, academyId: string) {
  return db.select().from(schema.academySessions)
    .where(and(eq(schema.academySessions.orgId, orgId), eq(schema.academySessions.academyId, academyId)))
    .orderBy(asc(schema.academySessions.scheduledDate))
}

export async function createSession(orgId: string, data: {
  academyId: string; cohortId?: string; title: string; description?: string;
  type?: 'webinar' | 'workshop' | 'mentoring' | 'lecture' | 'qa';
  scheduledDate: string; scheduledTime?: string; durationMinutes?: number;
  instructor?: string; meetingUrl?: string; maxAttendees?: number;
}) {
  const [row] = await db.insert(schema.academySessions).values({
    orgId,
    academyId: data.academyId,
    cohortId: data.cohortId || null,
    title: data.title,
    description: data.description || null,
    type: (data.type || 'webinar') as any,
    scheduledDate: data.scheduledDate,
    scheduledTime: data.scheduledTime || null,
    durationMinutes: data.durationMinutes || 60,
    instructor: data.instructor || null,
    meetingUrl: data.meetingUrl || null,
    maxAttendees: data.maxAttendees || null,
  }).returning()
  return row
}

export async function updateSession(orgId: string, sessionId: string, data: Partial<{
  title: string; description: string; type: string; scheduledDate: string;
  scheduledTime: string; durationMinutes: number; instructor: string;
  meetingUrl: string; recordingUrl: string; maxAttendees: number;
}>) {
  const updates: any = {}
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) updates[k] = v })

  const [row] = await db.update(schema.academySessions).set(updates)
    .where(and(eq(schema.academySessions.id, sessionId), eq(schema.academySessions.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteSession(orgId: string, sessionId: string) {
  const [row] = await db.delete(schema.academySessions)
    .where(and(eq(schema.academySessions.id, sessionId), eq(schema.academySessions.orgId, orgId)))
    .returning()
  return row || null
}

// RSVP management
export async function rsvpSession(orgId: string, sessionId: string, participantId: string) {
  const [existing] = await db.select().from(schema.academySessionRsvps)
    .where(and(
      eq(schema.academySessionRsvps.orgId, orgId),
      eq(schema.academySessionRsvps.sessionId, sessionId),
      eq(schema.academySessionRsvps.participantId, participantId),
    ))
  if (existing) return existing

  const [row] = await db.insert(schema.academySessionRsvps).values({
    orgId, sessionId, participantId,
  }).returning()
  return row
}

export async function getSessionRsvps(orgId: string, sessionId: string) {
  return db.select().from(schema.academySessionRsvps)
    .where(and(
      eq(schema.academySessionRsvps.orgId, orgId),
      eq(schema.academySessionRsvps.sessionId, sessionId),
    ))
}

export async function markAttendance(orgId: string, sessionId: string, participantId: string, attended: boolean) {
  const [row] = await db.update(schema.academySessionRsvps).set({ attended })
    .where(and(
      eq(schema.academySessionRsvps.orgId, orgId),
      eq(schema.academySessionRsvps.sessionId, sessionId),
      eq(schema.academySessionRsvps.participantId, participantId),
    ))
    .returning()
  return row || null
}

// ============================================================
// ASSIGNMENTS
// ============================================================

export async function getAssignments(orgId: string, academyId: string) {
  return db.select().from(schema.academyAssignments)
    .where(and(eq(schema.academyAssignments.orgId, orgId), eq(schema.academyAssignments.academyId, academyId)))
    .orderBy(asc(schema.academyAssignments.dueDate))
}

export async function createAssignment(orgId: string, data: {
  academyId: string; academyCourseId?: string; title: string;
  description?: string; dueDate?: string; maxScore?: number;
}) {
  const [row] = await db.insert(schema.academyAssignments).values({
    orgId,
    academyId: data.academyId,
    academyCourseId: data.academyCourseId || null,
    title: data.title,
    description: data.description || null,
    dueDate: data.dueDate || null,
    maxScore: data.maxScore || 100,
  }).returning()
  return row
}

export async function updateAssignment(orgId: string, assignmentId: string, data: Partial<{
  title: string; description: string; dueDate: string; maxScore: number;
}>) {
  const updates: any = {}
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) updates[k] = v })

  const [row] = await db.update(schema.academyAssignments).set(updates)
    .where(and(eq(schema.academyAssignments.id, assignmentId), eq(schema.academyAssignments.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteAssignment(orgId: string, assignmentId: string) {
  const [row] = await db.delete(schema.academyAssignments)
    .where(and(eq(schema.academyAssignments.id, assignmentId), eq(schema.academyAssignments.orgId, orgId)))
    .returning()
  return row || null
}

// Submissions
export async function submitAssignment(orgId: string, data: {
  assignmentId: string; participantId: string; submissionUrl?: string; submissionText?: string;
}) {
  const [row] = await db.insert(schema.academyAssignmentSubmissions).values({
    orgId,
    assignmentId: data.assignmentId,
    participantId: data.participantId,
    submissionUrl: data.submissionUrl || null,
    submissionText: data.submissionText || null,
    status: 'submitted' as any,
    submittedAt: new Date(),
  }).returning()
  return row
}

export async function gradeSubmission(orgId: string, submissionId: string, data: {
  score: number; feedback?: string; gradedBy: string;
}) {
  const [row] = await db.update(schema.academyAssignmentSubmissions).set({
    score: data.score,
    feedback: data.feedback || null,
    gradedBy: data.gradedBy,
    status: 'graded' as any,
    gradedAt: new Date(),
  }).where(and(
    eq(schema.academyAssignmentSubmissions.id, submissionId),
    eq(schema.academyAssignmentSubmissions.orgId, orgId),
  )).returning()
  return row || null
}

export async function getSubmissions(orgId: string, assignmentId: string) {
  return db.select().from(schema.academyAssignmentSubmissions)
    .where(and(
      eq(schema.academyAssignmentSubmissions.orgId, orgId),
      eq(schema.academyAssignmentSubmissions.assignmentId, assignmentId),
    ))
    .orderBy(desc(schema.academyAssignmentSubmissions.submittedAt))
}

export async function getParticipantSubmissions(orgId: string, participantId: string) {
  return db.select().from(schema.academyAssignmentSubmissions)
    .where(and(
      eq(schema.academyAssignmentSubmissions.orgId, orgId),
      eq(schema.academyAssignmentSubmissions.participantId, participantId),
    ))
    .orderBy(desc(schema.academyAssignmentSubmissions.submittedAt))
}

// ============================================================
// DISCUSSIONS
// ============================================================

export async function getDiscussions(orgId: string, academyId: string, opts?: PaginationOpts) {
  const { page, limit, offset } = paginate(opts || {})

  const where = and(
    eq(schema.academyDiscussions.orgId, orgId),
    eq(schema.academyDiscussions.academyId, academyId),
    sql`${schema.academyDiscussions.parentId} IS NULL`, // top-level only
  )

  const [rows, countResult] = await Promise.all([
    db.select().from(schema.academyDiscussions).where(where)
      .orderBy(desc(schema.academyDiscussions.isPinned), desc(schema.academyDiscussions.createdAt))
      .limit(limit).offset(offset),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyDiscussions).where(where),
  ])

  return { data: rows, pagination: paginationMeta(countResult[0]?.count || 0, page, limit) }
}

export async function getDiscussionReplies(orgId: string, parentId: string) {
  return db.select().from(schema.academyDiscussions)
    .where(and(eq(schema.academyDiscussions.orgId, orgId), eq(schema.academyDiscussions.parentId, parentId)))
    .orderBy(asc(schema.academyDiscussions.createdAt))
}

export async function createDiscussion(orgId: string, data: {
  academyId: string; participantId?: string; parentId?: string;
  content: string; moduleTag?: string; isFacilitator?: boolean; facilitatorName?: string;
}) {
  const [row] = await db.insert(schema.academyDiscussions).values({
    orgId,
    academyId: data.academyId,
    participantId: data.participantId || null,
    parentId: data.parentId || null,
    content: data.content,
    moduleTag: data.moduleTag || null,
    isFacilitator: data.isFacilitator || false,
    facilitatorName: data.facilitatorName || null,
  }).returning()

  // If this is a reply, increment parent reply count
  if (data.parentId) {
    await db.update(schema.academyDiscussions)
      .set({ replyCount: sql`${schema.academyDiscussions.replyCount} + 1` })
      .where(eq(schema.academyDiscussions.id, data.parentId))
  }

  return row
}

export async function deleteDiscussion(orgId: string, discussionId: string) {
  const [row] = await db.delete(schema.academyDiscussions)
    .where(and(eq(schema.academyDiscussions.id, discussionId), eq(schema.academyDiscussions.orgId, orgId)))
    .returning()
  return row || null
}

export async function pinDiscussion(orgId: string, discussionId: string, isPinned: boolean) {
  const [row] = await db.update(schema.academyDiscussions).set({ isPinned })
    .where(and(eq(schema.academyDiscussions.id, discussionId), eq(schema.academyDiscussions.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// RESOURCES
// ============================================================

export async function getResources(orgId: string, academyId: string) {
  return db.select().from(schema.academyResources)
    .where(and(eq(schema.academyResources.orgId, orgId), eq(schema.academyResources.academyId, academyId)))
    .orderBy(desc(schema.academyResources.createdAt))
}

export async function createResource(orgId: string, data: {
  academyId: string; academyCourseId?: string; title: string;
  description?: string; type?: string; url?: string; fileSize?: number;
}) {
  const [row] = await db.insert(schema.academyResources).values({
    orgId,
    academyId: data.academyId,
    academyCourseId: data.academyCourseId || null,
    title: data.title,
    description: data.description || null,
    type: data.type || 'pdf',
    url: data.url || null,
    fileSize: data.fileSize || null,
  }).returning()
  return row
}

export async function deleteResource(orgId: string, resourceId: string) {
  const [row] = await db.delete(schema.academyResources)
    .where(and(eq(schema.academyResources.id, resourceId), eq(schema.academyResources.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// CERTIFICATES
// ============================================================

export async function getAcademyCertificates(orgId: string, opts?: { academyId?: string; participantId?: string }) {
  const conditions = [eq(schema.academyCertificates.orgId, orgId)]
  if (opts?.academyId) conditions.push(eq(schema.academyCertificates.academyId, opts.academyId))
  if (opts?.participantId) conditions.push(eq(schema.academyCertificates.participantId, opts.participantId))

  return db.select().from(schema.academyCertificates)
    .where(and(...conditions))
    .orderBy(desc(schema.academyCertificates.createdAt))
}

export async function createAcademyCertificate(orgId: string, data: {
  academyId: string; participantId: string; name: string;
  requirements?: { label: string; met: boolean }[];
}) {
  const certNumber = `ACAD-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`

  const [row] = await db.insert(schema.academyCertificates).values({
    orgId,
    academyId: data.academyId,
    participantId: data.participantId,
    name: data.name,
    certificateNumber: certNumber,
    requirements: data.requirements ? JSON.stringify(data.requirements) : null,
    status: 'in_progress' as any,
  }).returning()
  return row
}

export async function issueAcademyCertificate(orgId: string, certificateId: string, certificateUrl?: string) {
  const [row] = await db.update(schema.academyCertificates).set({
    status: 'earned' as any,
    issuedAt: new Date(),
    certificateUrl: certificateUrl || null,
  }).where(and(eq(schema.academyCertificates.id, certificateId), eq(schema.academyCertificates.orgId, orgId)))
    .returning()
  return row || null
}

export async function updateCertificateRequirements(orgId: string, certificateId: string, requirements: { label: string; met: boolean }[]) {
  const [row] = await db.update(schema.academyCertificates).set({
    requirements: JSON.stringify(requirements),
  }).where(and(eq(schema.academyCertificates.id, certificateId), eq(schema.academyCertificates.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// COMMUNICATIONS
// ============================================================

export async function getCommunications(orgId: string, academyId: string) {
  return db.select().from(schema.academyCommunications)
    .where(and(eq(schema.academyCommunications.orgId, orgId), eq(schema.academyCommunications.academyId, academyId)))
    .orderBy(desc(schema.academyCommunications.createdAt))
}

export async function createCommunication(orgId: string, data: {
  academyId: string; type?: 'broadcast' | 'automated'; triggerName?: string;
  subject: string; body?: string; recipientCount?: number; status?: string;
  scheduledAt?: string;
}) {
  const [row] = await db.insert(schema.academyCommunications).values({
    orgId,
    academyId: data.academyId,
    type: (data.type || 'broadcast') as any,
    triggerName: data.triggerName || null,
    subject: data.subject,
    body: data.body || null,
    recipientCount: data.recipientCount || 0,
    status: (data.status || 'draft') as any,
    scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
  }).returning()
  return row
}

export async function sendCommunication(orgId: string, communicationId: string, recipientCount: number) {
  const [row] = await db.update(schema.academyCommunications).set({
    status: 'sent' as any,
    sentAt: new Date(),
    recipientCount,
  }).where(and(eq(schema.academyCommunications.id, communicationId), eq(schema.academyCommunications.orgId, orgId)))
    .returning()
  return row || null
}

// Communication triggers
export async function getCommTriggers(orgId: string, academyId: string) {
  return db.select().from(schema.academyCommTriggers)
    .where(and(eq(schema.academyCommTriggers.orgId, orgId), eq(schema.academyCommTriggers.academyId, academyId)))
    .orderBy(asc(schema.academyCommTriggers.name))
}

export async function createCommTrigger(orgId: string, data: {
  academyId: string; name: string; triggerEvent: string;
  subjectTemplate: string; bodyTemplate?: string;
}) {
  const [row] = await db.insert(schema.academyCommTriggers).values({
    orgId,
    academyId: data.academyId,
    name: data.name,
    triggerEvent: data.triggerEvent,
    subjectTemplate: data.subjectTemplate,
    bodyTemplate: data.bodyTemplate || null,
  }).returning()
  return row
}

export async function updateCommTrigger(orgId: string, triggerId: string, data: Partial<{
  name: string; triggerEvent: string; subjectTemplate: string;
  bodyTemplate: string; isActive: boolean;
}>) {
  const updates: any = {}
  Object.entries(data).forEach(([k, v]) => { if (v !== undefined) updates[k] = v })

  const [row] = await db.update(schema.academyCommTriggers).set(updates)
    .where(and(eq(schema.academyCommTriggers.id, triggerId), eq(schema.academyCommTriggers.orgId, orgId)))
    .returning()
  return row || null
}

export async function deleteCommTrigger(orgId: string, triggerId: string) {
  const [row] = await db.delete(schema.academyCommTriggers)
    .where(and(eq(schema.academyCommTriggers.id, triggerId), eq(schema.academyCommTriggers.orgId, orgId)))
    .returning()
  return row || null
}

// ============================================================
// VALIDATION HELPERS
// ============================================================

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function validateEmail(email: string): string | null {
  if (!email || !EMAIL_RE.test(email)) return 'Invalid email format'
  return null
}

export function validateSlug(slug: string): string | null {
  if (!slug || slug.length < 2 || slug.length > 200) return 'Slug must be 2-200 characters'
  if (!SLUG_RE.test(slug)) return 'Slug must contain only lowercase letters, numbers, and hyphens'
  return null
}

export function validateDateRange(startDate: string, endDate: string): string | null {
  if (!DATE_RE.test(startDate)) return 'Start date must be YYYY-MM-DD format'
  if (!DATE_RE.test(endDate)) return 'End date must be YYYY-MM-DD format'
  if (new Date(startDate) >= new Date(endDate)) return 'Start date must be before end date'
  return null
}

export async function isSlugUnique(orgId: string, slug: string, excludeId?: string): Promise<boolean> {
  const existing = await getAcademyBySlug(orgId, slug)
  if (!existing) return true
  if (excludeId && existing.id === excludeId) return true
  return false
}

// ============================================================
// ANALYTICS / DASHBOARD
// ============================================================

export async function getAcademyDashboard(orgId: string, academyId: string) {
  const [
    participantCount,
    cohortCount,
    sessionCount,
    certCount,
  ] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyParticipants)
      .where(and(eq(schema.academyParticipants.orgId, orgId), eq(schema.academyParticipants.academyId, academyId))),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyCohorts)
      .where(and(eq(schema.academyCohorts.orgId, orgId), eq(schema.academyCohorts.academyId, academyId))),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academySessions)
      .where(and(eq(schema.academySessions.orgId, orgId), eq(schema.academySessions.academyId, academyId))),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyCertificates)
      .where(and(
        eq(schema.academyCertificates.orgId, orgId),
        eq(schema.academyCertificates.academyId, academyId),
        eq(schema.academyCertificates.status, 'earned'),
      )),
  ])

  // Average progress
  const [avgResult] = await db.select({
    avg: sql<number>`COALESCE(AVG(${schema.academyParticipants.progress}), 0)::int`,
  }).from(schema.academyParticipants)
    .where(and(
      eq(schema.academyParticipants.orgId, orgId),
      eq(schema.academyParticipants.academyId, academyId),
      eq(schema.academyParticipants.status, 'active'),
    ))

  // Status breakdown
  const statusBreakdown = await db.select({
    status: schema.academyParticipants.status,
    count: sql<number>`count(*)::int`,
  }).from(schema.academyParticipants)
    .where(and(eq(schema.academyParticipants.orgId, orgId), eq(schema.academyParticipants.academyId, academyId)))
    .groupBy(schema.academyParticipants.status)

  return {
    totalParticipants: participantCount[0]?.count || 0,
    totalCohorts: cohortCount[0]?.count || 0,
    totalSessions: sessionCount[0]?.count || 0,
    certificatesIssued: certCount[0]?.count || 0,
    averageProgress: avgResult?.avg || 0,
    participantsByStatus: Object.fromEntries(statusBreakdown.map(s => [s.status, s.count])),
  }
}

export async function getProgramDashboard(orgId: string) {
  // Across all academies for this org
  const [academyCount, totalParticipants, activeParticipants, completedCount] = await Promise.all([
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academies)
      .where(eq(schema.academies.orgId, orgId)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyParticipants)
      .where(eq(schema.academyParticipants.orgId, orgId)),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyParticipants)
      .where(and(eq(schema.academyParticipants.orgId, orgId), eq(schema.academyParticipants.status, 'active'))),
    db.select({ count: sql<number>`count(*)::int` }).from(schema.academyParticipants)
      .where(and(eq(schema.academyParticipants.orgId, orgId), eq(schema.academyParticipants.status, 'completed'))),
  ])

  const [avgProgress] = await db.select({
    avg: sql<number>`COALESCE(AVG(${schema.academyParticipants.progress}), 0)::int`,
  }).from(schema.academyParticipants)
    .where(eq(schema.academyParticipants.orgId, orgId))

  return {
    totalAcademies: academyCount[0]?.count || 0,
    totalParticipants: totalParticipants[0]?.count || 0,
    activeParticipants: activeParticipants[0]?.count || 0,
    completedParticipants: completedCount[0]?.count || 0,
    averageProgress: avgProgress?.avg || 0,
    completionRate: totalParticipants[0]?.count
      ? Math.round((completedCount[0]?.count || 0) / totalParticipants[0]!.count * 100)
      : 0,
  }
}

// ============================================================
// PARTICIPANT AUTH (external portal)
// ============================================================

export async function authenticateParticipant(email: string, passwordHash: string) {
  // Find participant across any academy
  const rows = await db.select().from(schema.academyParticipants)
    .where(and(
      eq(schema.academyParticipants.email, email),
      eq(schema.academyParticipants.passwordHash, passwordHash),
      eq(schema.academyParticipants.status, 'active'),
    ))
  return rows[0] || null
}

export async function setParticipantPassword(participantId: string, passwordHash: string) {
  const [row] = await db.update(schema.academyParticipants).set({
    passwordHash,
    emailVerified: true,
    updatedAt: new Date(),
  }).where(eq(schema.academyParticipants.id, participantId)).returning()
  return row || null
}

export async function verifyInvitationToken(token: string) {
  const [row] = await db.select().from(schema.academyParticipants)
    .where(eq(schema.academyParticipants.invitationToken, token))
  return row || null
}