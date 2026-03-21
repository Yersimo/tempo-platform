import { NextRequest, NextResponse } from 'next/server'
import {
  createDocument,
  getDocument,
  listDocuments,
  saveDocument,
  pollDocument,
  getVersionHistory,
  getVersion,
  addCollaborator,
  removeCollaborator,
  getCollaborators,
  getActiveCollaborators,
  updateLastAccessed,
  addComment,
  getComments,
  resolveComment,
  deleteDocument,
} from '@/lib/services/collaborative-docs'
import type { Permission, DocumentType } from '@/lib/services/collaborative-docs'

function getOrgId(req: NextRequest): string | null {
  return req.headers.get('x-org-id')
}

function getEmployeeId(req: NextRequest): string | null {
  return req.headers.get('x-employee-id')
}

// ---------------------------------------------------------------------------
// GET /api/documents?action=list|get|poll|versions|version|collaborators|active-collaborators|comments
// ---------------------------------------------------------------------------
export async function GET(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const employeeId = getEmployeeId(request)
    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'list'

    switch (action) {
      case 'list': {
        const documentType = url.searchParams.get('type') || undefined
        const docs = await listDocuments(orgId, documentType)
        return NextResponse.json({ data: docs })
      }

      case 'get': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const doc = await getDocument(id)
        if (!doc) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        // Update last accessed for presence
        if (employeeId) {
          updateLastAccessed(id, employeeId).catch(() => {})
        }
        return NextResponse.json({ data: doc })
      }

      case 'poll': {
        const id = url.searchParams.get('id')
        const version = parseInt(url.searchParams.get('version') || '0')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        // Update last accessed for presence
        if (employeeId) {
          updateLastAccessed(id, employeeId).catch(() => {})
        }
        const result = await pollDocument(id, version)
        if (!result) return NextResponse.json({ error: 'Document not found' }, { status: 404 })
        return NextResponse.json({ data: result })
      }

      case 'versions': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const versions = await getVersionHistory(id)
        return NextResponse.json({ data: versions })
      }

      case 'version': {
        const id = url.searchParams.get('id')
        const version = parseInt(url.searchParams.get('version') || '0')
        if (!id || !version) return NextResponse.json({ error: 'id and version parameters required' }, { status: 400 })
        const v = await getVersion(id, version)
        if (!v) return NextResponse.json({ error: 'Version not found' }, { status: 404 })
        return NextResponse.json({ data: v })
      }

      case 'collaborators': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const collaborators = await getCollaborators(id)
        return NextResponse.json({ data: collaborators })
      }

      case 'active-collaborators': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const active = await getActiveCollaborators(id)
        return NextResponse.json({ data: active })
      }

      case 'comments': {
        const id = url.searchParams.get('id')
        if (!id) return NextResponse.json({ error: 'id parameter required' }, { status: 400 })
        const comments = await getComments(id)
        return NextResponse.json({ data: comments })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/documents] Error:', error)
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 })
  }
}

// ---------------------------------------------------------------------------
// POST /api/documents  { action: 'create' | 'save' | 'comment' | 'resolve-comment' | 'add-collaborator' | 'remove-collaborator' | 'delete' }
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const orgId = getOrgId(request)
    const employeeId = getEmployeeId(request)
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { title, content, documentType } = body
        if (!title) return NextResponse.json({ error: 'title is required' }, { status: 400 })
        const doc = await createDocument(orgId, employeeId || '', {
          title,
          content,
          documentType: documentType as DocumentType,
        })
        return NextResponse.json({ data: doc }, { status: 201 })
      }

      case 'save': {
        const { documentId, content, expectedVersion, changeSummary } = body
        if (!documentId || content === undefined || !expectedVersion) {
          return NextResponse.json({ error: 'documentId, content, and expectedVersion are required' }, { status: 400 })
        }
        const result = await saveDocument(orgId, employeeId || '', {
          documentId,
          content,
          expectedVersion,
          changeSummary,
        })
        if (result.conflict) {
          return NextResponse.json({ data: result }, { status: 409 })
        }
        return NextResponse.json({ data: result })
      }

      case 'comment': {
        const { documentId, content: commentContent, selectionStart, selectionEnd, parentId } = body
        if (!documentId || !commentContent) {
          return NextResponse.json({ error: 'documentId and content are required' }, { status: 400 })
        }
        const comment = await addComment(orgId, employeeId || '', {
          documentId,
          content: commentContent,
          selectionStart,
          selectionEnd,
          parentId,
        })
        return NextResponse.json({ data: comment }, { status: 201 })
      }

      case 'resolve-comment': {
        const { commentId } = body
        if (!commentId) return NextResponse.json({ error: 'commentId is required' }, { status: 400 })
        await resolveComment(commentId, employeeId || '')
        return NextResponse.json({ success: true })
      }

      case 'add-collaborator': {
        const { documentId, targetEmployeeId, permission } = body
        if (!documentId || !targetEmployeeId) {
          return NextResponse.json({ error: 'documentId and targetEmployeeId are required' }, { status: 400 })
        }
        await addCollaborator(documentId, targetEmployeeId, (permission || 'edit') as Permission)
        return NextResponse.json({ success: true })
      }

      case 'remove-collaborator': {
        const { documentId, targetEmployeeId } = body
        if (!documentId || !targetEmployeeId) {
          return NextResponse.json({ error: 'documentId and targetEmployeeId are required' }, { status: 400 })
        }
        await removeCollaborator(documentId, targetEmployeeId)
        return NextResponse.json({ success: true })
      }

      case 'delete': {
        const { documentId } = body
        if (!documentId) return NextResponse.json({ error: 'documentId is required' }, { status: 400 })
        await deleteDocument(orgId, documentId)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/documents] Error:', error)
    return NextResponse.json({ error: error.message || 'Failed to process document request' }, { status: 500 })
  }
}
