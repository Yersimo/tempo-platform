import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'
import path from 'path'

// ---------------------------------------------------------------------------
// POST /api/academy/upload/presign -- Generate pre-signed S3 upload URL
// ---------------------------------------------------------------------------
// For direct browser-to-S3 uploads (bypasses server for large files).
// Falls back to returning the direct upload endpoint if S3 not configured.

type UploadType = 'assignment-submission' | 'resource' | 'certificate' | 'academy-logo'

const VALID_UPLOAD_TYPES = new Set<string>([
  'assignment-submission',
  'resource',
  'certificate',
  'academy-logo',
])

// Size limits (same as the direct upload route)
const SIZE_LIMITS: Record<UploadType, number> = {
  'assignment-submission': 10 * 1024 * 1024,
  'resource':             10 * 1024 * 1024,
  'certificate':          10 * 1024 * 1024,
  'academy-logo':          2 * 1024 * 1024,
}

// Allowed MIME types (same as the direct upload route)
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

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileName, fileType, uploadType, academyId } = body as {
      fileName?: string
      fileType?: string
      uploadType?: string
      academyId?: string
    }

    // Validate required fields
    if (!fileName || !fileType || !uploadType) {
      return NextResponse.json(
        { error: 'fileName, fileType, and uploadType are required' },
        { status: 400 }
      )
    }

    if (!VALID_UPLOAD_TYPES.has(uploadType)) {
      return NextResponse.json(
        { error: `Invalid uploadType. Must be one of: ${Array.from(VALID_UPLOAD_TYPES).join(', ')}` },
        { status: 400 }
      )
    }

    const type = uploadType as UploadType

    // Validate MIME type
    const allowedTypes = ALLOWED_TYPES[type]
    if (!allowedTypes.has(fileType)) {
      return NextResponse.json(
        { error: `File type "${fileType}" is not allowed for ${type}` },
        { status: 400 }
      )
    }

    // Check if S3 is configured
    const accessKeyId = process.env.S3_ACCESS_KEY_ID
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY
    const bucket = process.env.S3_BUCKET || 'tempo-uploads'

    if (!accessKeyId || !secretAccessKey) {
      // S3 not configured -- return fallback to the direct upload endpoint
      return NextResponse.json({
        uploadUrl: '/api/academy/upload',
        fileUrl: null,
        key: null,
        method: 'POST',
        provider: 'local',
        maxSize: SIZE_LIMITS[type],
        note: 'S3 not configured. Use multipart/form-data POST to the uploadUrl instead.',
      })
    }

    // Generate S3 key: academy/{orgId}/{academyId}/{type}/{uuid}{ext}
    const ext = path.extname(fileName)
    const uniqueId = randomUUID()
    const key = `academy/${orgId}/${academyId || '_general'}/${type}/${uniqueId}${ext}`

    // Create S3 client
    const client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: { accessKeyId, secretAccessKey },
      forcePathStyle: !!process.env.S3_ENDPOINT,
    })

    // Generate pre-signed PUT URL (expires in 15 minutes)
    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: fileType,
    })
    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 900 })

    // Build the public GET URL
    const publicUrl = process.env.S3_PUBLIC_URL
    const fileUrl = publicUrl
      ? `${publicUrl}/${key}`
      : null // Caller should use getFileUrl() to get a signed GET URL

    return NextResponse.json({
      uploadUrl,
      fileUrl,
      key,
      method: 'PUT',
      provider: 's3',
      maxSize: SIZE_LIMITS[type],
      headers: {
        'Content-Type': fileType,
      },
    })
  } catch (error) {
    console.error('[Academy Presign] Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate pre-signed URL' },
      { status: 500 }
    )
  }
}
