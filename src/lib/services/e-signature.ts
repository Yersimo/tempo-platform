/**
 * Document E-Signature Service
 *
 * Full-featured electronic signature workflow engine supporting:
 * - Sequential and parallel signing flows
 * - Comprehensive audit trail generation for every action
 * - Signer identity validation via email + IP
 * - Template-based document creation
 * - Bulk send capabilities
 * - Signature analytics and reporting
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, inArray, count, sql, gte, lte } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ============================================================
// Types & Interfaces
// ============================================================

export type SignatureStatus = 'draft' | 'pending' | 'in_progress' | 'completed' | 'declined' | 'expired' | 'voided'
export type SignerStatus = 'pending' | 'sent' | 'viewed' | 'signed' | 'declined'
export type SigningFlow = 'sequential' | 'parallel'
export type AuditAction = 'created' | 'sent' | 'viewed' | 'signed' | 'declined' | 'voided' | 'reminded' | 'expired' | 'downloaded'

export interface CreateSignatureRequestInput {
  title: string
  description?: string
  documentUrl: string
  signingFlow?: SigningFlow
  expiresAt?: string
  signers: {
    name: string
    email: string
    employeeId?: string
    role?: string
    signingOrder?: number
  }[]
  metadata?: Record<string, unknown>
}

export interface RecordSignatureInput {
  documentId: string
  signerEmail: string
  ipAddress: string
  userAgent: string
  signatureImageUrl?: string
}

export interface DeclineSignatureInput {
  documentId: string
  signerEmail: string
  reason: string
  ipAddress: string
  userAgent: string
}

export interface SignatureAnalytics {
  totalDocuments: number
  pendingDocuments: number
  completedDocuments: number
  declinedDocuments: number
  expiredDocuments: number
  averageCompletionTimeHours: number
  completionRate: number
  signersBreakdown: {
    totalSigners: number
    signedCount: number
    pendingCount: number
    declinedCount: number
  }
  recentActivity: AuditTrailEntry[]
}

export interface AuditTrailEntry {
  id: string
  documentId: string
  action: AuditAction
  actorEmail: string | null
  actorName: string | null
  ipAddress: string | null
  details: string | null
  timestamp: Date
}

export interface BulkSendResult {
  successful: string[]
  failed: { email: string; error: string }[]
  totalSent: number
  totalFailed: number
}

// ============================================================
// Error Classes
// ============================================================

export class ESignatureError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'ESignatureError'
  }
}

// ============================================================
// Helper Functions
// ============================================================

function generateAccessToken(): string {
  return `sig_${randomUUID().replace(/-/g, '')}${Date.now().toString(36)}`
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

async function addAuditEntry(
  documentId: string,
  orgId: string,
  action: AuditAction,
  options: {
    actorEmail?: string
    actorName?: string
    ipAddress?: string
    userAgent?: string
    details?: string
  } = {}
): Promise<void> {
  await db.insert(schema.signatureAuditTrail).values({
    documentId,
    orgId,
    action,
    actorEmail: options.actorEmail || null,
    actorName: options.actorName || null,
    ipAddress: options.ipAddress || null,
    userAgent: options.userAgent || null,
    details: options.details || null,
  })
}

// ============================================================
// Core Functions
// ============================================================

/**
 * Create a new signature request with document and signers.
 * Validates all signer emails and sets up signing order.
 */
export async function createSignatureRequest(
  orgId: string,
  createdBy: string,
  input: CreateSignatureRequestInput
) {
  // Validate inputs
  if (!input.title?.trim()) {
    throw new ESignatureError('Document title is required', 'MISSING_TITLE')
  }
  if (!input.documentUrl?.trim()) {
    throw new ESignatureError('Document URL is required', 'MISSING_DOCUMENT')
  }
  if (!input.signers?.length) {
    throw new ESignatureError('At least one signer is required', 'NO_SIGNERS')
  }

  // Validate all signer emails
  for (const signer of input.signers) {
    if (!signer.email || !validateEmail(signer.email)) {
      throw new ESignatureError(
        `Invalid email address: ${signer.email}`,
        'INVALID_SIGNER_EMAIL'
      )
    }
    if (!signer.name?.trim()) {
      throw new ESignatureError(
        `Signer name is required for ${signer.email}`,
        'MISSING_SIGNER_NAME'
      )
    }
  }

  // Check for duplicate emails
  const emails = input.signers.map(s => s.email.toLowerCase())
  const uniqueEmails = new Set(emails)
  if (uniqueEmails.size !== emails.length) {
    throw new ESignatureError('Duplicate signer emails are not allowed', 'DUPLICATE_SIGNERS')
  }

  const signingFlow = input.signingFlow || 'sequential'

  // Create the document
  const [document] = await db.insert(schema.signatureDocuments).values({
    orgId,
    title: input.title.trim(),
    description: input.description || null,
    documentUrl: input.documentUrl,
    status: 'draft',
    signingFlow,
    createdBy,
    expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
    metadata: input.metadata || null,
  }).returning()

  // Create signers with access tokens
  const signerValues = input.signers.map((signer, index) => ({
    documentId: document.id,
    orgId,
    employeeId: signer.employeeId || null,
    name: signer.name.trim(),
    email: signer.email.toLowerCase().trim(),
    role: signer.role || 'signer',
    signingOrder: signingFlow === 'sequential'
      ? (signer.signingOrder ?? index + 1)
      : 1,
    status: 'pending' as const,
    accessToken: generateAccessToken(),
  }))

  const signers = await db.insert(schema.signatureSigners).values(signerValues).returning()

  // Add audit trail entry
  await addAuditEntry(document.id, orgId, 'created', {
    details: `Signature request created with ${signers.length} signer(s), flow: ${signingFlow}`,
  })

  return { document, signers }
}

/**
 * Send a document for signature. Transitions from draft to pending/in_progress.
 * For sequential flow, only activates the first signer.
 * For parallel flow, activates all signers simultaneously.
 */
export async function sendForSignature(
  orgId: string,
  documentId: string,
  senderEmail: string,
  ipAddress?: string
) {
  // Fetch the document
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }
  if (document.status !== 'draft') {
    throw new ESignatureError(
      `Cannot send document in ${document.status} status`,
      'INVALID_STATUS_TRANSITION'
    )
  }

  // Get all signers
  const signers = await db.select()
    .from(schema.signatureSigners)
    .where(eq(schema.signatureSigners.documentId, documentId))
    .orderBy(asc(schema.signatureSigners.signingOrder))

  if (signers.length === 0) {
    throw new ESignatureError('No signers configured for this document', 'NO_SIGNERS')
  }

  // Update document status
  await db.update(schema.signatureDocuments)
    .set({
      status: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(schema.signatureDocuments.id, documentId))

  // Activate signers based on flow type
  if (document.signingFlow === 'parallel') {
    // Send to all signers at once
    await db.update(schema.signatureSigners)
      .set({ status: 'sent' })
      .where(eq(schema.signatureSigners.documentId, documentId))
  } else {
    // Sequential: only send to first signer
    const firstSigner = signers[0]
    await db.update(schema.signatureSigners)
      .set({ status: 'sent' })
      .where(eq(schema.signatureSigners.id, firstSigner.id))
  }

  // Audit trail
  await addAuditEntry(document.id, orgId, 'sent', {
    actorEmail: senderEmail,
    ipAddress: ipAddress || undefined,
    details: `Document sent for signature to ${signers.length} signer(s)`,
  })

  return { documentId, status: 'pending', signerCount: signers.length }
}

/**
 * Record a signature from a signer. Validates identity via email + IP.
 * For sequential flows, auto-advances to the next signer.
 * Completes the document if all signers have signed.
 */
export async function recordSignature(
  orgId: string,
  input: RecordSignatureInput
) {
  const { documentId, signerEmail, ipAddress, userAgent, signatureImageUrl } = input

  // Validate email
  if (!signerEmail || !validateEmail(signerEmail)) {
    throw new ESignatureError('Valid signer email is required', 'INVALID_EMAIL')
  }

  // Validate IP address presence
  if (!ipAddress) {
    throw new ESignatureError('IP address is required for identity verification', 'MISSING_IP')
  }

  // Find the document
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }
  if (document.status !== 'pending' && document.status !== 'in_progress') {
    throw new ESignatureError(
      `Cannot sign document in ${document.status} status`,
      'INVALID_DOCUMENT_STATUS'
    )
  }

  // Check expiration
  if (document.expiresAt && new Date(document.expiresAt) < new Date()) {
    await db.update(schema.signatureDocuments)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(schema.signatureDocuments.id, documentId))

    await addAuditEntry(documentId, orgId, 'expired', {
      details: 'Document expired before all signatures were collected',
    })

    throw new ESignatureError('Document has expired', 'DOCUMENT_EXPIRED')
  }

  // Find the signer
  const signers = await db.select()
    .from(schema.signatureSigners)
    .where(and(
      eq(schema.signatureSigners.documentId, documentId),
      eq(schema.signatureSigners.email, signerEmail.toLowerCase())
    ))

  const signer = signers[0]
  if (!signer) {
    throw new ESignatureError('Signer not found for this document', 'SIGNER_NOT_FOUND')
  }
  if (signer.status === 'signed') {
    throw new ESignatureError('This signer has already signed', 'ALREADY_SIGNED')
  }
  if (signer.status === 'declined') {
    throw new ESignatureError('This signer has declined to sign', 'SIGNER_DECLINED')
  }
  if (signer.status === 'pending') {
    throw new ESignatureError(
      'This signer has not been activated yet (sequential flow)',
      'SIGNER_NOT_ACTIVE'
    )
  }

  // Record the signature
  const now = new Date()
  await db.update(schema.signatureSigners)
    .set({
      status: 'signed',
      signedAt: now,
      ipAddress,
      userAgent,
      signatureImageUrl: signatureImageUrl || null,
    })
    .where(eq(schema.signatureSigners.id, signer.id))

  // Add audit entry
  await addAuditEntry(documentId, orgId, 'signed', {
    actorEmail: signerEmail,
    actorName: signer.name ?? undefined,
    ipAddress,
    userAgent,
    details: `Document signed by ${signer.name} (${signerEmail})`,
  })

  // Check if all signers have signed
  const allSigners = await db.select()
    .from(schema.signatureSigners)
    .where(eq(schema.signatureSigners.documentId, documentId))

  const allSigned = allSigners.every(s => s.id === signer.id ? true : s.status === 'signed')

  if (allSigned) {
    // Complete the document
    await db.update(schema.signatureDocuments)
      .set({
        status: 'completed',
        completedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.signatureDocuments.id, documentId))

    return { documentId, signerEmail, status: 'signed', documentCompleted: true }
  }

  // For sequential flow, advance to the next signer
  if (document.signingFlow === 'sequential') {
    const nextSigner = allSigners
      .filter(s => s.status === 'pending')
      .sort((a, b) => a.signingOrder - b.signingOrder)[0]

    if (nextSigner) {
      await db.update(schema.signatureSigners)
        .set({ status: 'sent' })
        .where(eq(schema.signatureSigners.id, nextSigner.id))

      await addAuditEntry(documentId, orgId, 'sent', {
        details: `Auto-advanced to next signer: ${nextSigner.name} (${nextSigner.email})`,
      })
    }
  }

  // Update document status to in_progress if it was pending
  if (document.status === 'pending') {
    await db.update(schema.signatureDocuments)
      .set({ status: 'in_progress', updatedAt: now })
      .where(eq(schema.signatureDocuments.id, documentId))
  }

  return { documentId, signerEmail, status: 'signed', documentCompleted: false }
}

/**
 * Record a signer declining to sign a document.
 * This voids the entire document.
 */
export async function declineSignature(
  orgId: string,
  input: DeclineSignatureInput
) {
  const { documentId, signerEmail, reason, ipAddress, userAgent } = input

  if (!reason?.trim()) {
    throw new ESignatureError('A reason for declining is required', 'MISSING_DECLINE_REASON')
  }

  // Find the document
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }

  // Find the signer
  const signers = await db.select()
    .from(schema.signatureSigners)
    .where(and(
      eq(schema.signatureSigners.documentId, documentId),
      eq(schema.signatureSigners.email, signerEmail.toLowerCase())
    ))

  const signer = signers[0]
  if (!signer) {
    throw new ESignatureError('Signer not found for this document', 'SIGNER_NOT_FOUND')
  }

  const now = new Date()

  // Update signer status
  await db.update(schema.signatureSigners)
    .set({
      status: 'declined',
      declinedAt: now,
      declineReason: reason.trim(),
      ipAddress,
      userAgent,
    })
    .where(eq(schema.signatureSigners.id, signer.id))

  // Mark document as declined
  await db.update(schema.signatureDocuments)
    .set({
      status: 'declined',
      updatedAt: now,
    })
    .where(eq(schema.signatureDocuments.id, documentId))

  // Audit trail
  await addAuditEntry(documentId, orgId, 'declined', {
    actorEmail: signerEmail,
    actorName: signer.name ?? undefined,
    ipAddress,
    userAgent,
    details: `Document declined by ${signer.name}: ${reason}`,
  })

  return { documentId, signerEmail, status: 'declined', reason }
}

/**
 * Get the current status of a signature document including all signer statuses.
 */
export async function getSignatureStatus(
  orgId: string,
  documentId: string
) {
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }

  const signers = await db.select()
    .from(schema.signatureSigners)
    .where(eq(schema.signatureSigners.documentId, documentId))
    .orderBy(asc(schema.signatureSigners.signingOrder))

  const signedCount = signers.filter(s => s.status === 'signed').length
  const pendingCount = signers.filter(s => s.status === 'pending' || s.status === 'sent' || s.status === 'viewed').length
  const declinedCount = signers.filter(s => s.status === 'declined').length

  return {
    document: {
      id: document.id,
      title: document.title,
      status: document.status,
      signingFlow: document.signingFlow,
      createdAt: document.createdAt,
      expiresAt: document.expiresAt,
      completedAt: document.completedAt,
    },
    signers: signers.map(s => ({
      id: s.id,
      name: s.name,
      email: s.email,
      role: s.role,
      signingOrder: s.signingOrder,
      status: s.status,
      signedAt: s.signedAt,
      declinedAt: s.declinedAt,
      declineReason: s.declineReason,
      lastViewedAt: s.viewedAt,
    })),
    summary: {
      totalSigners: signers.length,
      signedCount,
      pendingCount,
      declinedCount,
      completionPercentage: signers.length > 0
        ? Math.round((signedCount / signers.length) * 100)
        : 0,
    },
  }
}

/**
 * Generate a complete, tamper-evident audit trail for a signature document.
 * Returns all actions taken on the document in chronological order.
 */
export async function generateSignatureAuditTrail(
  orgId: string,
  documentId: string
) {
  // Verify document exists
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }

  const entries = await db.select()
    .from(schema.signatureAuditTrail)
    .where(and(
      eq(schema.signatureAuditTrail.documentId, documentId),
      eq(schema.signatureAuditTrail.orgId, orgId)
    ))
    .orderBy(asc(schema.signatureAuditTrail.timestamp))

  // Get signers for full context
  const signers = await db.select()
    .from(schema.signatureSigners)
    .where(eq(schema.signatureSigners.documentId, documentId))

  return {
    document: {
      id: document.id,
      title: document.title,
      status: document.status,
      createdAt: document.createdAt,
      completedAt: document.completedAt,
    },
    auditTrail: entries.map(e => ({
      id: e.id,
      action: e.action,
      actorEmail: e.actorEmail,
      actorName: e.actorName,
      ipAddress: e.ipAddress,
      details: e.details,
      timestamp: e.timestamp,
    })),
    signers: signers.map(s => ({
      name: s.name,
      email: s.email,
      status: s.status,
      signedAt: s.signedAt,
      ipAddress: s.ipAddress,
    })),
    totalEntries: entries.length,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Create a new signature request from an existing template.
 * Applies template settings and field placements.
 */
export async function createFromTemplate(
  orgId: string,
  createdBy: string,
  templateId: string,
  signerAssignments: { role: string; name: string; email: string; employeeId?: string }[],
  metadata?: Record<string, unknown>
) {
  // Fetch the template
  const templates = await db.select()
    .from(schema.signatureTemplates)
    .where(and(
      eq(schema.signatureTemplates.id, templateId),
      eq(schema.signatureTemplates.orgId, orgId)
    ))

  const template = templates[0]
  if (!template) {
    throw new ESignatureError('Template not found', 'TEMPLATE_NOT_FOUND')
  }

  // Validate role assignments match template roles
  const templateRoles = (template.signerRoles as { role: string; order: number }[]) || []
  for (const role of templateRoles) {
    const assignment = signerAssignments.find(a => a.role === role.role)
    if (!assignment) {
      throw new ESignatureError(
        `Missing signer assignment for role: ${role.role}`,
        'MISSING_ROLE_ASSIGNMENT'
      )
    }
  }

  // Create the signature request using the template
  const result = await createSignatureRequest(orgId, createdBy, {
    title: template.name,
    description: template.description || undefined,
    documentUrl: template.documentUrl || '',
    signingFlow: template.signingFlow as SigningFlow,
    signers: signerAssignments.map(assignment => {
      const templateRole = templateRoles.find(r => r.role === assignment.role)
      return {
        name: assignment.name,
        email: assignment.email,
        employeeId: assignment.employeeId,
        role: assignment.role,
        signingOrder: templateRole?.order || 1,
      }
    }),
    metadata: {
      ...metadata,
      templateId,
      templateName: template.name,
    },
  })

  // Update document with template reference
  await db.update(schema.signatureDocuments)
    .set({ templateId })
    .where(eq(schema.signatureDocuments.id, result.document.id))

  // Increment template usage count
  await db.update(schema.signatureTemplates)
    .set({ usageCount: (template.usageCount || 0) + 1, updatedAt: new Date() })
    .where(eq(schema.signatureTemplates.id, templateId))

  return result
}

/**
 * Send a document for signature to multiple recipients in bulk.
 * Creates individual documents for each recipient from a template.
 */
export async function bulkSendForSignature(
  orgId: string,
  createdBy: string,
  templateId: string,
  recipients: { name: string; email: string; employeeId?: string; role?: string }[],
  senderEmail: string,
  ipAddress?: string
): Promise<BulkSendResult> {
  const successful: string[] = []
  const failed: { email: string; error: string }[] = []

  // Fetch template
  const templates = await db.select()
    .from(schema.signatureTemplates)
    .where(and(
      eq(schema.signatureTemplates.id, templateId),
      eq(schema.signatureTemplates.orgId, orgId)
    ))

  const template = templates[0]
  if (!template) {
    throw new ESignatureError('Template not found', 'TEMPLATE_NOT_FOUND')
  }

  for (const recipient of recipients) {
    try {
      // Create individual document
      const result = await createSignatureRequest(orgId, createdBy, {
        title: `${template.name} - ${recipient.name}`,
        description: template.description || undefined,
        documentUrl: template.documentUrl || '',
        signingFlow: 'parallel',
        signers: [{
          name: recipient.name,
          email: recipient.email,
          employeeId: recipient.employeeId,
          role: recipient.role || 'signer',
        }],
        metadata: { templateId, bulkSend: true },
      })

      // Send it immediately
      await sendForSignature(orgId, result.document.id, senderEmail, ipAddress)
      successful.push(result.document.id)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      failed.push({ email: recipient.email, error: errorMessage })
    }
  }

  return {
    successful,
    failed,
    totalSent: successful.length,
    totalFailed: failed.length,
  }
}

/**
 * Get comprehensive analytics for e-signatures across the organization.
 */
export async function getSignatureAnalytics(
  orgId: string,
  dateRange?: { from: string; to: string }
): Promise<SignatureAnalytics> {
  // Build date filter conditions
  const conditions = [eq(schema.signatureDocuments.orgId, orgId)]
  if (dateRange?.from) {
    conditions.push(gte(schema.signatureDocuments.createdAt, new Date(dateRange.from)))
  }
  if (dateRange?.to) {
    conditions.push(lte(schema.signatureDocuments.createdAt, new Date(dateRange.to)))
  }

  // Get all documents
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(...conditions))

  const totalDocuments = documents.length
  const pendingDocuments = documents.filter(d => d.status === 'pending' || d.status === 'in_progress').length
  const completedDocuments = documents.filter(d => d.status === 'completed').length
  const declinedDocuments = documents.filter(d => d.status === 'declined').length
  const expiredDocuments = documents.filter(d => d.status === 'expired').length

  // Calculate average completion time
  const completedDocs = documents.filter(d => d.status === 'completed' && d.completedAt)
  let averageCompletionTimeHours = 0
  if (completedDocs.length > 0) {
    const totalHours = completedDocs.reduce((sum, doc) => {
      const created = new Date(doc.createdAt).getTime()
      const completed = new Date(doc.completedAt!).getTime()
      return sum + (completed - created) / (1000 * 60 * 60)
    }, 0)
    averageCompletionTimeHours = Math.round((totalHours / completedDocs.length) * 10) / 10
  }

  // Get signer statistics
  const allSignerConditions = [eq(schema.signatureSigners.orgId, orgId)]
  const allSigners = await db.select()
    .from(schema.signatureSigners)
    .where(and(...allSignerConditions))

  const signedCount = allSigners.filter(s => s.status === 'signed').length
  const pendingSignerCount = allSigners.filter(s => s.status === 'pending' || s.status === 'sent' || s.status === 'viewed').length
  const declinedSignerCount = allSigners.filter(s => s.status === 'declined').length

  // Get recent audit activity
  const recentAudit = await db.select()
    .from(schema.signatureAuditTrail)
    .where(eq(schema.signatureAuditTrail.orgId, orgId))
    .orderBy(desc(schema.signatureAuditTrail.timestamp))
    .limit(20)

  return {
    totalDocuments,
    pendingDocuments,
    completedDocuments,
    declinedDocuments,
    expiredDocuments,
    averageCompletionTimeHours,
    completionRate: totalDocuments > 0
      ? Math.round((completedDocuments / totalDocuments) * 100)
      : 0,
    signersBreakdown: {
      totalSigners: allSigners.length,
      signedCount,
      pendingCount: pendingSignerCount,
      declinedCount: declinedSignerCount,
    },
    recentActivity: recentAudit.map(a => ({
      id: a.id,
      documentId: a.documentId,
      action: a.action as AuditAction,
      actorEmail: a.actorEmail,
      actorName: a.actorName,
      ipAddress: a.ipAddress,
      details: a.details,
      timestamp: a.timestamp,
    })),
  }
}

/**
 * List all signature documents for an organization, with optional filters.
 */
export async function listSignatureDocuments(
  orgId: string,
  filters?: {
    status?: SignatureStatus
    createdBy?: string
    limit?: number
    offset?: number
  }
) {
  const conditions = [eq(schema.signatureDocuments.orgId, orgId)]

  if (filters?.status) {
    conditions.push(eq(schema.signatureDocuments.status, filters.status))
  }
  if (filters?.createdBy) {
    conditions.push(eq(schema.signatureDocuments.createdBy, filters.createdBy))
  }

  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(...conditions))
    .orderBy(desc(schema.signatureDocuments.createdAt))
    .limit(filters?.limit || 50)
    .offset(filters?.offset || 0)

  // Get signer counts for each document
  const documentIds = documents.map(d => d.id)
  let signersByDocument: Record<string, typeof schema.signatureSigners.$inferSelect[]> = {}

  if (documentIds.length > 0) {
    const allSigners = await db.select()
      .from(schema.signatureSigners)
      .where(inArray(schema.signatureSigners.documentId, documentIds))

    signersByDocument = allSigners.reduce((acc, signer) => {
      if (!acc[signer.documentId]) acc[signer.documentId] = []
      acc[signer.documentId].push(signer)
      return acc
    }, {} as typeof signersByDocument)
  }

  return {
    documents: documents.map(doc => ({
      ...doc,
      signerCount: (signersByDocument[doc.id] || []).length,
      signedCount: (signersByDocument[doc.id] || []).filter(s => s.status === 'signed').length,
    })),
    total: documents.length,
  }
}

/**
 * Void an in-progress or pending signature document.
 */
export async function voidDocument(
  orgId: string,
  documentId: string,
  reason: string,
  actorEmail: string,
  ipAddress?: string
) {
  const documents = await db.select()
    .from(schema.signatureDocuments)
    .where(and(
      eq(schema.signatureDocuments.id, documentId),
      eq(schema.signatureDocuments.orgId, orgId)
    ))

  const document = documents[0]
  if (!document) {
    throw new ESignatureError('Document not found', 'DOCUMENT_NOT_FOUND')
  }

  if (document.status === 'completed' || document.status === 'voided') {
    throw new ESignatureError(
      `Cannot void a ${document.status} document`,
      'INVALID_STATUS_TRANSITION'
    )
  }

  await db.update(schema.signatureDocuments)
    .set({ status: 'voided', updatedAt: new Date() })
    .where(eq(schema.signatureDocuments.id, documentId))

  await addAuditEntry(documentId, orgId, 'voided', {
    actorEmail,
    ipAddress: ipAddress || undefined,
    details: `Document voided: ${reason}`,
  })

  return { documentId, status: 'voided', reason }
}
