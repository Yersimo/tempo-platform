import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { db, schema } from '@/lib/db'
import { eq, and, isNull } from 'drizzle-orm'
import { randomUUID } from 'crypto'
import path from 'path'
import fs from 'fs/promises'

// ---------------------------------------------------------------------------
// Storage provider interface
// ---------------------------------------------------------------------------

interface StorageProvider {
  upload(key: string, data: Buffer, contentType: string): Promise<void>
  getUrl(key: string, expiresIn?: number): Promise<string>
  delete(key: string): Promise<void>
}

// ---------------------------------------------------------------------------
// S3-Compatible provider (AWS S3, Cloudflare R2, MinIO, DigitalOcean Spaces)
// ---------------------------------------------------------------------------

class S3Provider implements StorageProvider {
  private client: S3Client
  private bucket: string

  constructor() {
    this.bucket = process.env.S3_BUCKET || 'tempo-uploads'
    this.client = new S3Client({
      region: process.env.S3_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT, // For R2/MinIO
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
      },
      forcePathStyle: !!process.env.S3_ENDPOINT, // Required for R2/MinIO
    })
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<void> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: data,
        ContentType: contentType,
      })
    )
  }

  async getUrl(key: string, expiresIn = 3600): Promise<string> {
    // If public bucket configured, return direct URL
    const publicUrl = process.env.S3_PUBLIC_URL
    if (publicUrl) {
      return `${publicUrl}/${key}`
    }
    // Otherwise, generate presigned URL
    const command = new GetObjectCommand({ Bucket: this.bucket, Key: key })
    return getSignedUrl(this.client, command, { expiresIn })
  }

  async delete(key: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      })
    )
  }
}

// ---------------------------------------------------------------------------
// Local filesystem provider (development fallback)
// ---------------------------------------------------------------------------

class LocalProvider implements StorageProvider {
  private basePath: string

  constructor() {
    this.basePath = process.env.UPLOAD_DIR || '/tmp/tempo-uploads'
  }

  async upload(key: string, data: Buffer): Promise<void> {
    const filePath = path.join(this.basePath, key)
    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, data)
  }

  async getUrl(key: string): Promise<string> {
    // In development, serve from API route
    return `/api/upload/file/${encodeURIComponent(key)}`
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key)
    try {
      await fs.unlink(filePath)
    } catch {
      // File may already be gone
    }
  }
}

// ---------------------------------------------------------------------------
// Provider factory
// ---------------------------------------------------------------------------

function getProvider(): StorageProvider {
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return new S3Provider()
  }
  return new LocalProvider()
}

function getProviderName(): string {
  if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
    return 's3'
  }
  return 'local'
}

// ---------------------------------------------------------------------------
// Key generation
// ---------------------------------------------------------------------------

function generateKey(orgId: string, originalName: string): string {
  const ext = path.extname(originalName)
  const id = randomUUID()
  const date = new Date().toISOString().split('T')[0]
  return `${orgId}/${date}/${id}${ext}`
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface UploadResult {
  id: string
  filename: string
  original_name: string
  mime_type: string
  size: number
  url: string
  storage_provider: string
  created_at: string
}

export async function uploadFile(
  orgId: string,
  uploadedBy: string,
  file: { name: string; type: string; data: Buffer },
  options?: { entityType?: string; entityId?: string; isPublic?: boolean }
): Promise<UploadResult> {
  const provider = getProvider()
  const providerName = getProviderName()
  const storageKey = generateKey(orgId, file.name)

  // Upload to storage backend
  await provider.upload(storageKey, file.data, file.type)

  // Record in database
  const [record] = await db
    .insert(schema.fileUploads)
    .values({
      orgId,
      uploadedBy,
      filename: path.basename(storageKey),
      originalName: file.name,
      mimeType: file.type,
      size: file.data.length,
      storageKey,
      storageProvider: providerName,
      entityType: options?.entityType || null,
      entityId: options?.entityId || null,
      isPublic: options?.isPublic || false,
      metadata: {},
    })
    .returning()

  const url = await provider.getUrl(storageKey)

  return {
    id: record.id,
    filename: record.filename,
    original_name: record.originalName,
    mime_type: record.mimeType,
    size: record.size,
    url,
    storage_provider: providerName,
    created_at: record.createdAt.toISOString(),
  }
}

export async function getFileUrl(fileId: string): Promise<string | null> {
  const [record] = await db
    .select()
    .from(schema.fileUploads)
    .where(eq(schema.fileUploads.id, fileId))

  if (!record || record.deletedAt) return null

  const provider = getProvider()
  return provider.getUrl(record.storageKey)
}

export async function deleteFile(fileId: string): Promise<boolean> {
  const [record] = await db
    .select()
    .from(schema.fileUploads)
    .where(eq(schema.fileUploads.id, fileId))

  if (!record) return false

  const provider = getProvider()
  await provider.delete(record.storageKey)

  // Soft delete in DB
  await db
    .update(schema.fileUploads)
    .set({ deletedAt: new Date() })
    .where(eq(schema.fileUploads.id, fileId))

  return true
}

export async function getFilesByEntity(
  entityType: string,
  entityId: string
): Promise<UploadResult[]> {
  const rows = await db
    .select()
    .from(schema.fileUploads)
    .where(
      and(
        eq(schema.fileUploads.entityType, entityType),
        eq(schema.fileUploads.entityId, entityId),
        isNull(schema.fileUploads.deletedAt)
      )
    )

  const provider = getProvider()
  const results: UploadResult[] = []

  for (const row of rows) {
    const url = await provider.getUrl(row.storageKey)
    results.push({
      id: row.id,
      filename: row.filename,
      original_name: row.originalName,
      mime_type: row.mimeType,
      size: row.size,
      url,
      storage_provider: row.storageProvider,
      created_at: row.createdAt.toISOString(),
    })
  }

  return results
}
