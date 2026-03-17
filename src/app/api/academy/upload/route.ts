import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

// ---------------------------------------------------------------------------
// POST /api/academy/upload -- Upload a file for academy module
// ---------------------------------------------------------------------------
// Supports: assignment-submission, resource, certificate, academy-logo
// Uses shared storage layer (S3 or local dev fallback)

type UploadType = 'assignment-submission' | 'resource' | 'certificate' | 'academy-logo'

// File size limits per upload type
const SIZE_LIMITS: Record<UploadType, number> = {
  'assignment-submission': 10 * 1024 * 1024, // 10MB
  'resource':             10 * 1024 * 1024, // 10MB
  'certificate':          10 * 1024 * 1024, // 10MB
  'academy-logo':          2 * 1024 * 1024, // 2MB
}

// Allowed MIME types per upload type
const ALLOWED_TYPES: Record<UploadType, Set<string>> = {
  'assignment-submission': new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
  ]),
  'resource': new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'text/csv',
    'application/zip',
    'video/mp4',
  ]),
  'certificate': new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
  ]),
  'academy-logo': new Set([
    'application/pdf',
    'image/png',
    'image/jpeg',
  ]),
}

const VALID_UPLOAD_TYPES = new Set<string>(Object.keys(SIZE_LIMITS))

function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(0)}MB`
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`
  return `${bytes}B`
}

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    const employeeId = request.headers.get('x-employee-id')

    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const uploadType = formData.get('uploadType') as string | null
    const academyId = formData.get('academyId') as string | null
    const entityId = formData.get('entityId') as string | null

    // Validate required fields
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!uploadType || !VALID_UPLOAD_TYPES.has(uploadType)) {
      return NextResponse.json(
        { error: `Invalid uploadType. Must be one of: ${Array.from(VALID_UPLOAD_TYPES).join(', ')}` },
        { status: 400 }
      )
    }

    const type = uploadType as UploadType

    // Validate file size
    const maxSize = SIZE_LIMITS[type]
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: `File too large. Maximum size for ${type} is ${formatFileSize(maxSize)}` },
        { status: 400 }
      )
    }

    // Validate MIME type
    const allowedTypes = ALLOWED_TYPES[type]
    if (!allowedTypes.has(file.type)) {
      return NextResponse.json(
        {
          error: `File type "${file.type}" is not allowed for ${type}. Allowed: ${Array.from(allowedTypes).join(', ')}`,
        },
        { status: 400 }
      )
    }

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Check if S3 is configured -- use shared storage layer
    const useS3 = !!(process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY)

    if (useS3) {
      // Use shared storage layer which handles S3 upload + DB record
      const result = await uploadFile(orgId, employeeId || 'system', {
        name: file.name,
        type: file.type,
        data: buffer,
      }, {
        entityType: `academy-${type}`,
        entityId: entityId || academyId || undefined,
      })

      return NextResponse.json({
        id: result.id,
        url: result.url,
        filename: result.original_name,
        mimeType: result.mime_type,
        size: result.size,
        uploadType: type,
        storageProvider: 's3',
      }, { status: 201 })
    }

    // Local filesystem fallback (dev mode)
    // Path: public/uploads/academy/{orgId}/{academyId}/{type}/{uuid}{ext}
    const ext = path.extname(file.name)
    const uniqueName = `${randomUUID()}${ext}`
    const relativePath = path.join(
      'academy',
      orgId,
      academyId || '_general',
      type,
      uniqueName
    )
    const fullDir = path.join(
      process.cwd(),
      'public',
      'uploads',
      'academy',
      orgId,
      academyId || '_general',
      type
    )
    const fullPath = path.join(fullDir, uniqueName)

    await fs.mkdir(fullDir, { recursive: true })
    await fs.writeFile(fullPath, buffer)

    const fileUrl = `/uploads/${relativePath}`

    return NextResponse.json({
      id: uniqueName.replace(ext, ''),
      url: fileUrl,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadType: type,
      storageProvider: 'local',
    }, { status: 201 })
  } catch (error) {
    console.error('[Academy Upload] Error:', error)
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    )
  }
}

// GET /api/academy/upload -- Return upload configuration for academy
export async function GET(request: NextRequest) {
  const orgId = request.headers.get('x-org-id')
  if (!orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const provider = (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) ? 's3' : 'local'

  return NextResponse.json({
    provider,
    limits: Object.fromEntries(
      Object.entries(SIZE_LIMITS).map(([k, v]) => [k, { maxBytes: v, maxLabel: formatFileSize(v) }])
    ),
    allowedTypes: Object.fromEntries(
      Object.entries(ALLOWED_TYPES).map(([k, v]) => [k, Array.from(v)])
    ),
  })
}
