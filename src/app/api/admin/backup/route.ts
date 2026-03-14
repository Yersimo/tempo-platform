import { NextRequest, NextResponse } from 'next/server'
import { validateAdminSession, getAdminCookieName } from '@/lib/admin-auth'
import {
  getBackupStats,
  exportAllTables,
  loadMetadata,
  saveMetadata,
  validateBackup,
} from '@/lib/backup/data-export'
import { BACKUP_PATHS, BACKUP_SCHEDULE, RETENTION_POLICY, RECOVERY_TARGETS } from '@/lib/backup/config'
import * as fs from 'fs'
import * as path from 'path'
import { createGzip } from 'zlib'

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requireAdmin(request: NextRequest): Promise<
  | { authorized: true; admin: { id: string; role: string } }
  | { authorized: false; response: NextResponse }
> {
  const cookieName = getAdminCookieName()
  const token = request.cookies.get(cookieName)?.value

  if (!token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 },
      ),
    }
  }

  try {
    const session = await validateAdminSession(token)
    if (!session) {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Invalid or expired session' },
          { status: 401 },
        ),
      }
    }

    // Only super_admin and admin roles can access backups
    if (session.role !== 'super_admin' && session.role !== 'admin') {
      return {
        authorized: false,
        response: NextResponse.json(
          { error: 'Insufficient permissions — admin role required' },
          { status: 403 },
        ),
      }
    }

    return { authorized: true, admin: { id: session.adminId, role: session.role } }
  } catch {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 },
      ),
    }
  }
}

// ─── GET: List backups ────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.response

  try {
    const projectRoot = process.cwd()
    const stats = getBackupStats(projectRoot)
    const metadata = loadMetadata(projectRoot)

    return NextResponse.json({
      backups: stats.backups.map((b) => ({
        filename: b.filename,
        type: b.type,
        createdAt: b.createdAt,
        sizeBytes: b.sizeBytes,
        sizeFormatted: formatBytes(b.sizeBytes),
      })),
      summary: {
        totalBackups: stats.backups.length,
        totalSizeBytes: stats.totalSizeBytes,
        totalSizeFormatted: formatBytes(stats.totalSizeBytes),
        lastFullBackup: stats.lastFullBackup,
        lastIncrementalBackup: stats.lastIncrementalBackup,
      },
      config: {
        schedule: BACKUP_SCHEDULE,
        retention: RETENTION_POLICY,
        recoveryTargets: RECOVERY_TARGETS,
      },
      metadata,
    })
  } catch (err) {
    console.error('[Backup API] GET error:', err)
    return NextResponse.json(
      { error: 'Failed to retrieve backup information' },
      { status: 500 },
    )
  }
}

// ─── POST: Trigger backup ─────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await requireAdmin(request)
  if (!auth.authorized) return auth.response

  try {
    const body = await request.json().catch(() => ({}))
    const backupType: 'full' | 'incremental' = body.type === 'incremental' ? 'incremental' : 'full'

    const projectRoot = process.cwd()
    const metadata = loadMetadata(projectRoot)

    // Determine since timestamp for incremental
    const since =
      backupType === 'incremental'
        ? metadata.lastIncrementalBackup ?? metadata.lastFullBackup ?? undefined
        : undefined

    if (backupType === 'incremental' && !since) {
      // Fall back to full backup
      return NextResponse.json(
        { error: 'No previous backup found — run a full backup first' },
        { status: 400 },
      )
    }

    // Create temp directory
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const subDir =
      backupType === 'incremental'
        ? BACKUP_PATHS.incrementalDir
        : BACKUP_PATHS.fullDir
    const archiveName =
      backupType === 'incremental'
        ? `backup-incr-${timestamp}`
        : `backup-${timestamp}`
    const tempDir = path.join(projectRoot, subDir, `_temp_${archiveName}`)
    const outputDir = path.join(projectRoot, subDir)

    fs.mkdirSync(outputDir, { recursive: true })
    fs.mkdirSync(tempDir, { recursive: true })

    try {
      // Export all tables
      const result = await exportAllTables({
        outputDir: tempDir,
        since,
      })

      // Create archive
      const archivePath = path.join(outputDir, `${archiveName}.tar.gz`)
      await createTarGzFromDir(tempDir, archivePath)
      const archiveSize = fs.statSync(archivePath).size

      // Update metadata
      const now = new Date().toISOString()
      if (backupType === 'incremental') {
        metadata.lastIncrementalBackup = now
      } else {
        metadata.lastFullBackup = now
      }
      saveMetadata(metadata, projectRoot)

      // Clean up temp
      fs.rmSync(tempDir, { recursive: true, force: true })

      return NextResponse.json({
        success: true,
        backup: {
          type: backupType,
          filename: `${archiveName}.tar.gz`,
          path: archivePath,
          createdAt: now,
          tables: result.manifest.tables.length,
          totalRows: result.manifest.totalRows,
          rawSizeBytes: result.manifest.totalSizeBytes,
          archiveSizeBytes: archiveSize,
          archiveSizeFormatted: formatBytes(archiveSize),
        },
      })
    } catch (err) {
      // Clean up temp on error
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true })
      }
      throw err
    }
  } catch (err) {
    console.error('[Backup API] POST error:', err)
    return NextResponse.json(
      { error: 'Backup failed', details: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}

// ─── Tar.gz helper (same as backup script) ────────────────────────────────────

async function createTarGzFromDir(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const gzip = createGzip({ level: 6 })

    gzip.pipe(output)

    output.on('finish', resolve)
    output.on('error', reject)
    gzip.on('error', reject)

    const files = fs.readdirSync(sourceDir)

    for (const filename of files) {
      const filePath = path.join(sourceDir, filename)
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) continue

      const content = fs.readFileSync(filePath)

      const header = Buffer.alloc(512)
      header.write(filename, 0, Math.min(filename.length, 100), 'utf8')
      header.write('0000644\0', 100, 8, 'utf8')
      header.write('0001000\0', 108, 8, 'utf8')
      header.write('0001000\0', 116, 8, 'utf8')
      header.write(stat.size.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8')
      const mtime = Math.floor(stat.mtimeMs / 1000)
      header.write(mtime.toString(8).padStart(11, '0') + '\0', 136, 12, 'utf8')
      header.write('0', 156, 1, 'utf8')
      header.write('ustar\0', 257, 6, 'utf8')
      header.write('00', 263, 2, 'utf8')

      header.write('        ', 148, 8, 'utf8')
      let checksum = 0
      for (let i = 0; i < 512; i++) checksum += header[i]
      header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')

      gzip.write(header)
      gzip.write(content)

      const remainder = content.length % 512
      if (remainder > 0) {
        gzip.write(Buffer.alloc(512 - remainder))
      }
    }

    gzip.write(Buffer.alloc(1024))
    gzip.end()
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
