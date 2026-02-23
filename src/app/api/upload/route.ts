import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as schema from '@/lib/db/schema'
import { uploadFile, getFileUrl, deleteFile } from '@/lib/storage'

// ---------------------------------------------------------------------------
// POST /api/upload   -- Upload a file to S3 or local storage
// GET  /api/upload   -- Get upload config (no params) or file URL (?fileId=)
// DELETE /api/upload  -- Soft-delete a file (?fileId=)
// ---------------------------------------------------------------------------

// File size limit: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed MIME types
const ALLOWED_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/csv',
])

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')

    if (!orgId || !employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const entityType = formData.get('entityType') as string | null
    const entityId = formData.get('entityId') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    // Validate MIME type
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `File type ${file.type} is not allowed` },
        { status: 400 }
      )
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage (S3 or local) and persist metadata
    const result = await uploadFile(orgId, employeeId, {
      name: file.name,
      type: file.type,
      data: buffer,
    }, {
      entityType: entityType || undefined,
      entityId: entityId || undefined,
    })

    // Audit log the upload
    try {
      await db.insert(schema.auditLog).values({
        orgId,
        userId: employeeId,
        action: 'create',
        entityType: 'file_upload',
        entityId: result.id,
        details: JSON.stringify({
          fileName: result.original_name,
          fileSize: result.size,
          fileType: result.mime_type,
          storageProvider: result.storage_provider,
          linkedEntity: entityType,
          linkedEntityId: entityId,
        }),
      })
    } catch {
      console.warn('[AUDIT] Upload audit failed (non-blocking)')
    }

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('[Upload] Error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('fileId')

  // If fileId provided, return presigned URL for that file
  if (fileId) {
    try {
      const url = await getFileUrl(fileId)
      if (!url) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
      return NextResponse.json({ url })
    } catch (error) {
      console.error('[Upload] Get URL error:', error)
      return NextResponse.json({ error: 'Failed to get file URL' }, { status: 500 })
    }
  }

  // No fileId: return upload configuration
  const provider = process.env.S3_ACCESS_KEY_ID ? 's3' : 'local'
  return NextResponse.json({
    maxFileSize: MAX_FILE_SIZE,
    allowedTypes: Array.from(ALLOWED_TYPES),
    provider,
  })
}

export async function DELETE(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')

    if (!orgId || !employeeId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const fileId = request.nextUrl.searchParams.get('fileId')
    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    const deleted = await deleteFile(fileId)
    if (!deleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Audit log the deletion
    try {
      await db.insert(schema.auditLog).values({
        orgId,
        userId: employeeId,
        action: 'delete',
        entityType: 'file_upload',
        entityId: fileId,
        details: JSON.stringify({ softDelete: true }),
      })
    } catch {
      console.warn('[AUDIT] Delete audit failed (non-blocking)')
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Upload] Delete error:', error)
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
