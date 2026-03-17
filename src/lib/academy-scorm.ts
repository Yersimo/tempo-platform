/**
 * Academy SCORM Engine — Import, manage, and track SCORM 1.2/2004 packages.
 *
 * Handles package import (manifest parsing), attempt tracking, and CMI data
 * persistence for external academy participants.
 *
 * All functions require orgId for RLS scoping.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql } from 'drizzle-orm'

// ============================================================
// TYPES
// ============================================================

/** Parsed SCORM manifest structure */
export interface ScormManifest {
  title: string
  version: string // SCORM 1.2 or 2004
  identifier: string
  organizations: ScormOrganization[]
  resources: ScormResource[]
  launchFile: string | null
}

interface ScormOrganization {
  identifier: string
  title: string
  items: ScormItem[]
}

interface ScormItem {
  identifier: string
  title: string
  identifierref?: string
  children?: ScormItem[]
}

interface ScormResource {
  identifier: string
  type: string
  href: string | null
  files: string[]
}

/** SCORM 1.2 CMI data model — subset of most-used fields */
export interface ScormCmiData {
  'cmi.core.lesson_status'?: 'passed' | 'completed' | 'failed' | 'incomplete' | 'browsed' | 'not attempted'
  'cmi.core.score.raw'?: number
  'cmi.core.score.min'?: number
  'cmi.core.score.max'?: number
  'cmi.core.session_time'?: string // HH:MM:SS format
  'cmi.core.total_time'?: string
  'cmi.core.lesson_location'?: string
  'cmi.core.exit'?: string
  'cmi.suspend_data'?: string
  'cmi.core.student_name'?: string
  'cmi.core.student_id'?: string
  'cmi.comments'?: string
  'cmi.objectives'?: Record<string, unknown>
  'cmi.interactions'?: Record<string, unknown>
  [key: string]: unknown
}

// ============================================================
// MANIFEST PARSING
// ============================================================

/**
 * Parse an imsmanifest.xml string into a structured ScormManifest.
 * Handles both SCORM 1.2 and 2004 manifest formats.
 */
export function parseManifest(xmlString: string): ScormManifest {
  // Simple XML parser — avoids heavy dependencies.
  // Extracts key elements from the imsmanifest.xml structure.

  const getTagContent = (xml: string, tag: string): string => {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
    const match = xml.match(regex)
    return match ? match[1].trim() : ''
  }

  const getAttr = (tag: string, attr: string): string => {
    const regex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i')
    const match = tag.match(regex)
    return match ? match[1] : ''
  }

  const getAllTags = (xml: string, tag: string): string[] => {
    const regex = new RegExp(`<${tag}[^>]*(?:>[\\s\\S]*?</${tag}>|/>)`, 'gi')
    return xml.match(regex) || []
  }

  // Detect SCORM version
  let version = '1.2'
  if (xmlString.includes('adlcp:scormType') || xmlString.includes('adlcp:scormtype')) {
    version = '1.2'
  }
  if (xmlString.includes('adlseq:') || xmlString.includes('imsss:') || xmlString.includes('2004')) {
    version = '2004'
  }

  // Parse manifest identifier
  const manifestMatch = xmlString.match(/<manifest[^>]*>/i)
  const identifier = manifestMatch ? getAttr(manifestMatch[0], 'identifier') : 'unknown'

  // Parse organizations
  const orgsBlock = getTagContent(xmlString, 'organizations')
  const orgTags = getAllTags(orgsBlock, 'organization')
  const organizations: ScormOrganization[] = orgTags.map((orgXml) => {
    const orgTag = orgXml.match(/<organization[^>]*>/i)?.[0] || ''
    const items = parseItems(orgXml)
    return {
      identifier: getAttr(orgTag, 'identifier'),
      title: getTagContent(orgXml, 'title'),
      items,
    }
  })

  function parseItems(parentXml: string): ScormItem[] {
    const itemTags = getAllTags(parentXml, 'item')
    return itemTags.map((itemXml) => {
      const itemTag = itemXml.match(/<item[^>]*>/i)?.[0] || ''
      return {
        identifier: getAttr(itemTag, 'identifier'),
        title: getTagContent(itemXml, 'title'),
        identifierref: getAttr(itemTag, 'identifierref') || undefined,
      }
    })
  }

  // Parse resources
  const resourcesBlock = getTagContent(xmlString, 'resources')
  const resourceTags = getAllTags(resourcesBlock, 'resource')
  const resources: ScormResource[] = resourceTags.map((resXml) => {
    const resTag = resXml.match(/<resource[^>]*>/i)?.[0] || ''
    const fileTags = getAllTags(resXml, 'file')
    const files = fileTags.map((f) => getAttr(f, 'href')).filter(Boolean)
    return {
      identifier: getAttr(resTag, 'identifier'),
      type: getAttr(resTag, 'type'),
      href: getAttr(resTag, 'href') || null,
      files,
    }
  })

  // Determine launch file: first resource with an href, or first identifierref from org items
  let launchFile: string | null = null
  if (organizations.length > 0 && organizations[0].items.length > 0) {
    const firstItemRef = organizations[0].items[0].identifierref
    if (firstItemRef) {
      const matchedResource = resources.find((r) => r.identifier === firstItemRef)
      if (matchedResource?.href) {
        launchFile = matchedResource.href
      }
    }
  }
  if (!launchFile && resources.length > 0) {
    launchFile = resources.find((r) => r.href)?.href || null
  }

  // Get title from first organization, or manifest-level metadata
  const title =
    (organizations.length > 0 ? organizations[0].title : '') ||
    getTagContent(xmlString, 'title') ||
    'Untitled SCORM Package'

  return { title, version, identifier, organizations, resources, launchFile }
}

// ============================================================
// SCORM PACKAGE CRUD
// ============================================================

/**
 * Import a SCORM package from a URL. Parses the manifest XML and stores metadata.
 * The caller is responsible for uploading/extracting the zip and providing the manifest XML.
 */
export async function importScormPackage(
  orgId: string,
  academyId: string,
  packageUrl: string,
  manifestXml: string,
  courseId?: string,
): Promise<{ id: string; title: string; launchUrl: string | null }> {
  const manifest = parseManifest(manifestXml)

  const [pkg] = await db
    .insert(schema.academyScormPackages)
    .values({
      orgId,
      academyId,
      academyCourseId: courseId || null,
      title: manifest.title,
      version: manifest.version,
      packageUrl,
      launchUrl: manifest.launchFile,
      manifestData: manifest as unknown as Record<string, unknown>,
      status: 'ready',
    })
    .returning()

  return { id: pkg.id, title: pkg.title, launchUrl: pkg.launchUrl }
}

/** Get a single SCORM package by ID */
export async function getScormPackage(orgId: string, packageId: string) {
  const [pkg] = await db
    .select()
    .from(schema.academyScormPackages)
    .where(and(eq(schema.academyScormPackages.id, packageId), eq(schema.academyScormPackages.orgId, orgId)))
  return pkg || null
}

/** List all SCORM packages for an academy */
export async function getScormPackages(orgId: string, academyId: string) {
  return db
    .select()
    .from(schema.academyScormPackages)
    .where(and(eq(schema.academyScormPackages.academyId, academyId), eq(schema.academyScormPackages.orgId, orgId)))
    .orderBy(desc(schema.academyScormPackages.createdAt))
}

/** Delete a SCORM package and all associated attempts */
export async function deleteScormPackage(orgId: string, packageId: string) {
  const [deleted] = await db
    .delete(schema.academyScormPackages)
    .where(and(eq(schema.academyScormPackages.id, packageId), eq(schema.academyScormPackages.orgId, orgId)))
    .returning({ id: schema.academyScormPackages.id })
  return !!deleted
}

// ============================================================
// SCORM ATTEMPTS — learner progress tracking
// ============================================================

/**
 * Initialize or resume a SCORM attempt for a participant.
 * If an active (non-completed) attempt exists, it's resumed. Otherwise a new one is created.
 */
export async function initScormAttempt(orgId: string, packageId: string, participantId: string) {
  // Check for existing active attempt
  const [existing] = await db
    .select()
    .from(schema.academyScormAttempts)
    .where(
      and(
        eq(schema.academyScormAttempts.packageId, packageId),
        eq(schema.academyScormAttempts.participantId, participantId),
        eq(schema.academyScormAttempts.orgId, orgId),
        sql`${schema.academyScormAttempts.status} NOT IN ('completed', 'passed', 'failed')`,
      ),
    )
    .orderBy(desc(schema.academyScormAttempts.createdAt))
    .limit(1)

  if (existing) {
    return existing
  }

  // Create a new attempt
  const [attempt] = await db
    .insert(schema.academyScormAttempts)
    .values({
      orgId,
      packageId,
      participantId,
      cmiData: {},
      status: 'not attempted',
      startedAt: new Date(),
    })
    .returning()

  return attempt
}

/** Get a specific SCORM attempt */
export async function getScormAttempt(orgId: string, attemptId: string) {
  const [attempt] = await db
    .select()
    .from(schema.academyScormAttempts)
    .where(and(eq(schema.academyScormAttempts.id, attemptId), eq(schema.academyScormAttempts.orgId, orgId)))
  return attempt || null
}

/** Get all attempts for a participant on a package */
export async function getParticipantAttempts(orgId: string, packageId: string, participantId: string) {
  return db
    .select()
    .from(schema.academyScormAttempts)
    .where(
      and(
        eq(schema.academyScormAttempts.packageId, packageId),
        eq(schema.academyScormAttempts.participantId, participantId),
        eq(schema.academyScormAttempts.orgId, orgId),
      ),
    )
    .orderBy(desc(schema.academyScormAttempts.createdAt))
}

/**
 * Update SCORM CMI data for an attempt.
 * Merges incoming data with existing CMI data and updates derived fields
 * (score, status, timeSpent, completedAt).
 */
export async function updateScormData(
  orgId: string,
  attemptId: string,
  cmiData: Partial<ScormCmiData>,
): Promise<{ success: boolean; attempt: typeof schema.academyScormAttempts.$inferSelect | null }> {
  const existing = await getScormAttempt(orgId, attemptId)
  if (!existing) return { success: false, attempt: null }

  // Merge CMI data
  const existingCmi = (existing.cmiData || {}) as Record<string, unknown>
  const mergedCmi = { ...existingCmi, ...cmiData }

  // Extract derived fields from CMI data
  const lessonStatus = (mergedCmi['cmi.core.lesson_status'] as string) || existing.status
  const scoreRaw = mergedCmi['cmi.core.score.raw'] as number | undefined

  // Parse session time (HHHH:MM:SS or HH:MM:SS format) into seconds
  let additionalSeconds = 0
  const sessionTime = cmiData['cmi.core.session_time']
  if (sessionTime) {
    additionalSeconds = parseScormTime(sessionTime)
  }

  // Determine completion
  const isCompleted = ['completed', 'passed', 'failed'].includes(lessonStatus)

  const [updated] = await db
    .update(schema.academyScormAttempts)
    .set({
      cmiData: mergedCmi,
      status: lessonStatus,
      score: scoreRaw !== undefined ? Math.round(scoreRaw) : existing.score,
      timeSpent: existing.timeSpent + additionalSeconds,
      completedAt: isCompleted && !existing.completedAt ? new Date() : existing.completedAt,
      updatedAt: new Date(),
    })
    .where(and(eq(schema.academyScormAttempts.id, attemptId), eq(schema.academyScormAttempts.orgId, orgId)))
    .returning()

  return { success: true, attempt: updated }
}

// ============================================================
// HELPERS
// ============================================================

/**
 * Parse SCORM time format (HHHH:MM:SS or HH:MM:SS.ss) into total seconds.
 * SCORM 1.2 uses HH:MM:SS, SCORM 2004 uses P[yY][mM][dD]T[hH][nM][sS] (ISO 8601 duration).
 */
export function parseScormTime(timeString: string): number {
  if (!timeString) return 0

  // SCORM 2004 ISO 8601 duration: PT1H30M15S
  const isoMatch = timeString.match(/^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:([\d.]+)S)?$/i)
  if (isoMatch) {
    const hours = parseInt(isoMatch[4] || '0')
    const minutes = parseInt(isoMatch[5] || '0')
    const seconds = parseFloat(isoMatch[6] || '0')
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  // SCORM 1.2 format: HHHH:MM:SS.ss
  const parts = timeString.split(':')
  if (parts.length >= 2) {
    const hours = parseInt(parts[0] || '0')
    const minutes = parseInt(parts[1] || '0')
    const seconds = parseFloat(parts[2] || '0')
    return Math.round(hours * 3600 + minutes * 60 + seconds)
  }

  return 0
}

/**
 * Format seconds into SCORM 1.2 time format: HHHH:MM:SS
 */
export function formatScormTime(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(4, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}
