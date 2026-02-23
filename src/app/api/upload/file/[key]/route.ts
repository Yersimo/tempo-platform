import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// ---------------------------------------------------------------------------
// GET /api/upload/file/[key] -- Serve uploaded files for local development
// ---------------------------------------------------------------------------
// In production (S3), files are served via presigned URLs directly from the
// storage provider. This route only handles the local filesystem fallback.

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ key: string }> }
) {
  const { key } = await params
  const basePath = process.env.UPLOAD_DIR || '/tmp/tempo-uploads'
  const filePath = path.join(basePath, decodeURIComponent(key))

  // Prevent path traversal
  const resolved = path.resolve(filePath)
  if (!resolved.startsWith(path.resolve(basePath))) {
    return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
  }

  try {
    const data = await fs.readFile(resolved)

    // Determine content type from extension
    const ext = path.extname(resolved).toLowerCase()
    const contentTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.csv': 'text/csv',
      '.txt': 'text/plain',
    }
    const contentType = contentTypes[ext] || 'application/octet-stream'

    return new NextResponse(data, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
