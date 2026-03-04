import { NextRequest, NextResponse } from 'next/server'
import {
  createSignatureRequest,
  sendForSignature,
  recordSignature,
  declineSignature,
  getSignatureStatus,
  generateSignatureAuditTrail,
  createFromTemplate,
  bulkSendForSignature,
  getSignatureAnalytics,
  listSignatureDocuments,
  voidDocument,
} from '@/lib/services/e-signature'

// GET /api/e-signatures - List documents, get status, analytics, audit trail
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const status = url.searchParams.get('status') as any
        const createdBy = url.searchParams.get('createdBy') || undefined
        const limit = parseInt(url.searchParams.get('limit') || '50')
        const offset = parseInt(url.searchParams.get('offset') || '0')
        const result = await listSignatureDocuments(orgId, { status, createdBy, limit, offset })
        return NextResponse.json(result)
      }

      case 'status': {
        const documentId = url.searchParams.get('documentId')
        if (!documentId) {
          return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
        }
        const result = await getSignatureStatus(orgId, documentId)
        return NextResponse.json(result)
      }

      case 'audit-trail': {
        const documentId = url.searchParams.get('documentId')
        if (!documentId) {
          return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
        }
        const result = await generateSignatureAuditTrail(orgId, documentId)
        return NextResponse.json(result)
      }

      case 'analytics': {
        const from = url.searchParams.get('from') || undefined
        const to = url.searchParams.get('to') || undefined
        const dateRange = from && to ? { from, to } : undefined
        const result = await getSignatureAnalytics(orgId, dateRange)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/e-signatures] Error:', error)
    const message = error instanceof Error ? error.message : 'E-signature operation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

// POST /api/e-signatures - Create, send, sign, decline, void, bulk send, create from template
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { title, description, documentUrl, signingFlow, expiresAt, signers, metadata, createdBy } = body
        if (!createdBy) {
          return NextResponse.json({ error: 'createdBy is required' }, { status: 400 })
        }
        const result = await createSignatureRequest(orgId, createdBy, {
          title,
          description,
          documentUrl,
          signingFlow,
          expiresAt,
          signers,
          metadata,
        })
        return NextResponse.json(result, { status: 201 })
      }

      case 'send': {
        const { documentId, senderEmail, ipAddress } = body
        if (!documentId || !senderEmail) {
          return NextResponse.json({ error: 'documentId and senderEmail are required' }, { status: 400 })
        }
        const result = await sendForSignature(orgId, documentId, senderEmail, ipAddress)
        return NextResponse.json(result)
      }

      case 'sign': {
        const { documentId, signerEmail, ipAddress, userAgent, signatureImageUrl } = body
        if (!documentId || !signerEmail || !ipAddress) {
          return NextResponse.json({ error: 'documentId, signerEmail, and ipAddress are required' }, { status: 400 })
        }
        const result = await recordSignature(orgId, {
          documentId,
          signerEmail,
          ipAddress,
          userAgent: userAgent || '',
          signatureImageUrl,
        })
        return NextResponse.json(result)
      }

      case 'decline': {
        const { documentId, signerEmail, reason, ipAddress, userAgent } = body
        if (!documentId || !signerEmail || !reason) {
          return NextResponse.json({ error: 'documentId, signerEmail, and reason are required' }, { status: 400 })
        }
        const result = await declineSignature(orgId, {
          documentId,
          signerEmail,
          reason,
          ipAddress: ipAddress || '',
          userAgent: userAgent || '',
        })
        return NextResponse.json(result)
      }

      case 'void': {
        const { documentId, reason, actorEmail, ipAddress } = body
        if (!documentId || !reason || !actorEmail) {
          return NextResponse.json({ error: 'documentId, reason, and actorEmail are required' }, { status: 400 })
        }
        const result = await voidDocument(orgId, documentId, reason, actorEmail, ipAddress)
        return NextResponse.json(result)
      }

      case 'create-from-template': {
        const { templateId, createdBy, signerAssignments, metadata } = body
        if (!templateId || !createdBy || !signerAssignments?.length) {
          return NextResponse.json(
            { error: 'templateId, createdBy, and signerAssignments are required' },
            { status: 400 }
          )
        }
        const result = await createFromTemplate(orgId, createdBy, templateId, signerAssignments, metadata)
        return NextResponse.json(result, { status: 201 })
      }

      case 'bulk-send': {
        const { templateId, createdBy, recipients, senderEmail, ipAddress } = body
        if (!templateId || !createdBy || !recipients?.length || !senderEmail) {
          return NextResponse.json(
            { error: 'templateId, createdBy, recipients, and senderEmail are required' },
            { status: 400 }
          )
        }
        const result = await bulkSendForSignature(orgId, createdBy, templateId, recipients, senderEmail, ipAddress)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[POST /api/e-signatures] Error:', error)
    const message = error instanceof Error ? error.message : 'E-signature operation failed'
    const status = error instanceof Error && 'code' in error ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// PUT /api/e-signatures - Update document metadata
export async function PUT(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { documentId, title, description, expiresAt } = body

    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    const { schema } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (title !== undefined) updates.title = title
    if (description !== undefined) updates.description = description
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null

    const result = await db.update(schema.signatureDocuments)
      .set(updates)
      .where(and(
        eq(schema.signatureDocuments.id, documentId),
        eq(schema.signatureDocuments.orgId, orgId)
      ))
      .returning()

    if (!result.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({ document: result[0] })
  } catch (error) {
    console.error('[PUT /api/e-signatures] Error:', error)
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE /api/e-signatures - Delete a draft document
export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const documentId = url.searchParams.get('documentId')
    if (!documentId) {
      return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
    }

    const { db } = await import('@/lib/db')
    const { schema } = await import('@/lib/db')
    const { eq, and } = await import('drizzle-orm')

    // Only allow deleting draft documents
    const docs = await db.select()
      .from(schema.signatureDocuments)
      .where(and(
        eq(schema.signatureDocuments.id, documentId),
        eq(schema.signatureDocuments.orgId, orgId)
      ))

    if (!docs.length) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    if (docs[0].status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft documents can be deleted. Use void for sent documents.' },
        { status: 400 }
      )
    }

    // Delete signers and audit trail first (cascade should handle this)
    await db.delete(schema.signatureDocuments)
      .where(eq(schema.signatureDocuments.id, documentId))

    return NextResponse.json({ deleted: true, documentId })
  } catch (error) {
    console.error('[DELETE /api/e-signatures] Error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
