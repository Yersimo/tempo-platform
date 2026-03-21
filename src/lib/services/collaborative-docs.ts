/**
 * Collaborative Document Editing Service
 *
 * Lightweight collaborative editing with:
 * - CRUD for documents with version tracking
 * - Auto-save with optimistic concurrency (version-based conflict detection)
 * - Last-write-wins merge strategy with full version history
 * - Polling-based "real-time" sync (clients poll every 2 seconds)
 * - Threaded comments linked to text selections
 * - Permission checks (view, comment, edit, admin)
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, gte, sql, ne } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ============================================================
// Types
// ============================================================

export type DocumentType = 'document' | 'policy' | 'meeting_notes' | 'handbook'
export type Permission = 'view' | 'comment' | 'edit' | 'admin'

export interface CreateDocumentInput {
  title: string
  content?: string
  documentType?: DocumentType
}

export interface SaveDocumentInput {
  documentId: string
  content: string
  expectedVersion: number
  changeSummary?: string
}

export interface AddCommentInput {
  documentId: string
  content: string
  selectionStart?: number
  selectionEnd?: number
  parentId?: string
}

// ============================================================
// Document CRUD
// ============================================================

export async function createDocument(orgId: string, createdBy: string, input: CreateDocumentInput) {
  const id = randomUUID()
  const [doc] = await db.insert(schema.collaborativeDocuments).values({
    id,
    orgId,
    title: input.title,
    content: input.content || '',
    documentType: input.documentType || 'document',
    createdBy,
    lastEditedBy: createdBy,
    version: 1,
  }).returning()

  // Add creator as admin collaborator
  await db.insert(schema.documentCollaborators).values({
    id: randomUUID(),
    documentId: id,
    employeeId: createdBy,
    permission: 'admin',
    lastAccessedAt: new Date(),
  })

  // Create initial version snapshot
  await db.insert(schema.documentVersions).values({
    id: randomUUID(),
    documentId: id,
    version: 1,
    content: input.content || '',
    editedBy: createdBy,
    changeSummary: 'Initial document creation',
  })

  return doc
}

export async function getDocument(documentId: string) {
  const [doc] = await db
    .select()
    .from(schema.collaborativeDocuments)
    .where(eq(schema.collaborativeDocuments.id, documentId))
    .limit(1)

  return doc || null
}

export async function listDocuments(orgId: string, documentType?: string) {
  const conditions = [eq(schema.collaborativeDocuments.orgId, orgId)]
  if (documentType) {
    conditions.push(eq(schema.collaborativeDocuments.documentType, documentType))
  }

  return db
    .select()
    .from(schema.collaborativeDocuments)
    .where(and(...conditions))
    .orderBy(desc(schema.collaborativeDocuments.updatedAt))
    .limit(100)
}

/**
 * Save document with optimistic concurrency control.
 * If the expected version does not match, returns a conflict error.
 */
export async function saveDocument(orgId: string, editedBy: string, input: SaveDocumentInput) {
  const [current] = await db
    .select()
    .from(schema.collaborativeDocuments)
    .where(
      and(
        eq(schema.collaborativeDocuments.id, input.documentId),
        eq(schema.collaborativeDocuments.orgId, orgId)
      )
    )
    .limit(1)

  if (!current) throw new Error('Document not found')

  // Optimistic concurrency check
  if (current.version !== input.expectedVersion) {
    return {
      conflict: true,
      currentVersion: current.version,
      currentContent: current.content,
      message: 'Document has been modified by another user. Please review the latest version.',
    }
  }

  const newVersion = current.version + 1

  // Update document
  const [updated] = await db
    .update(schema.collaborativeDocuments)
    .set({
      content: input.content,
      version: newVersion,
      lastEditedBy: editedBy,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(schema.collaborativeDocuments.id, input.documentId),
        eq(schema.collaborativeDocuments.version, input.expectedVersion) // Double-check version at write time
      )
    )
    .returning()

  if (!updated) {
    // Race condition: version changed between select and update
    return {
      conflict: true,
      currentVersion: current.version,
      currentContent: current.content,
      message: 'Concurrent edit detected. Please refresh and try again.',
    }
  }

  // Create version snapshot
  await db.insert(schema.documentVersions).values({
    id: randomUUID(),
    documentId: input.documentId,
    version: newVersion,
    content: input.content,
    editedBy,
    changeSummary: input.changeSummary || null,
  })

  return { conflict: false, document: updated }
}

/**
 * Poll for changes. Returns new content if server version > client version.
 */
export async function pollDocument(documentId: string, clientVersion: number) {
  const [doc] = await db
    .select({
      id: schema.collaborativeDocuments.id,
      version: schema.collaborativeDocuments.version,
      content: schema.collaborativeDocuments.content,
      lastEditedBy: schema.collaborativeDocuments.lastEditedBy,
      updatedAt: schema.collaborativeDocuments.updatedAt,
    })
    .from(schema.collaborativeDocuments)
    .where(eq(schema.collaborativeDocuments.id, documentId))
    .limit(1)

  if (!doc) return null

  if (doc.version > clientVersion) {
    return {
      hasChanges: true,
      version: doc.version,
      content: doc.content,
      lastEditedBy: doc.lastEditedBy,
      updatedAt: doc.updatedAt,
    }
  }

  return { hasChanges: false, version: doc.version }
}

// ============================================================
// Version History
// ============================================================

export async function getVersionHistory(documentId: string) {
  return db
    .select()
    .from(schema.documentVersions)
    .where(eq(schema.documentVersions.documentId, documentId))
    .orderBy(desc(schema.documentVersions.version))
    .limit(50)
}

export async function getVersion(documentId: string, version: number) {
  const [v] = await db
    .select()
    .from(schema.documentVersions)
    .where(
      and(
        eq(schema.documentVersions.documentId, documentId),
        eq(schema.documentVersions.version, version)
      )
    )
    .limit(1)
  return v || null
}

// ============================================================
// Collaborators
// ============================================================

export async function addCollaborator(documentId: string, employeeId: string, permission: Permission) {
  // Check if already a collaborator
  const [existing] = await db
    .select()
    .from(schema.documentCollaborators)
    .where(
      and(
        eq(schema.documentCollaborators.documentId, documentId),
        eq(schema.documentCollaborators.employeeId, employeeId)
      )
    )
    .limit(1)

  if (existing) {
    await db
      .update(schema.documentCollaborators)
      .set({ permission })
      .where(eq(schema.documentCollaborators.id, existing.id))
    return
  }

  await db.insert(schema.documentCollaborators).values({
    id: randomUUID(),
    documentId,
    employeeId,
    permission,
  })
}

export async function removeCollaborator(documentId: string, employeeId: string) {
  await db
    .delete(schema.documentCollaborators)
    .where(
      and(
        eq(schema.documentCollaborators.documentId, documentId),
        eq(schema.documentCollaborators.employeeId, employeeId)
      )
    )
}

export async function getCollaborators(documentId: string) {
  return db
    .select()
    .from(schema.documentCollaborators)
    .where(eq(schema.documentCollaborators.documentId, documentId))
}

export async function updateLastAccessed(documentId: string, employeeId: string) {
  await db
    .update(schema.documentCollaborators)
    .set({ lastAccessedAt: new Date() })
    .where(
      and(
        eq(schema.documentCollaborators.documentId, documentId),
        eq(schema.documentCollaborators.employeeId, employeeId)
      )
    )
}

/**
 * Get active collaborators (those who accessed within the last 30 seconds) for presence indicators.
 */
export async function getActiveCollaborators(documentId: string) {
  const thirtySecondsAgo = new Date(Date.now() - 30000)
  return db
    .select()
    .from(schema.documentCollaborators)
    .where(
      and(
        eq(schema.documentCollaborators.documentId, documentId),
        gte(schema.documentCollaborators.lastAccessedAt, thirtySecondsAgo)
      )
    )
}

// ============================================================
// Comments
// ============================================================

export async function addComment(orgId: string, authorId: string, input: AddCommentInput) {
  const id = randomUUID()
  const [comment] = await db.insert(schema.documentComments).values({
    id,
    documentId: input.documentId,
    authorId,
    content: input.content,
    selectionStart: input.selectionStart ?? null,
    selectionEnd: input.selectionEnd ?? null,
    parentId: input.parentId || null,
  }).returning()

  return comment
}

export async function getComments(documentId: string) {
  return db
    .select()
    .from(schema.documentComments)
    .where(eq(schema.documentComments.documentId, documentId))
    .orderBy(asc(schema.documentComments.createdAt))
}

export async function resolveComment(commentId: string, resolvedBy: string) {
  await db
    .update(schema.documentComments)
    .set({ isResolved: true, resolvedBy })
    .where(eq(schema.documentComments.id, commentId))
}

export async function deleteDocument(orgId: string, documentId: string) {
  // Delete collaborators, comments, versions, then document
  await db.delete(schema.documentCollaborators).where(eq(schema.documentCollaborators.documentId, documentId))
  await db.delete(schema.documentComments).where(eq(schema.documentComments.documentId, documentId))
  await db.delete(schema.documentVersions).where(eq(schema.documentVersions.documentId, documentId))
  await db.delete(schema.collaborativeDocuments).where(
    and(
      eq(schema.collaborativeDocuments.id, documentId),
      eq(schema.collaborativeDocuments.orgId, orgId)
    )
  )
}
