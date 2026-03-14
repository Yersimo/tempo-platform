#!/usr/bin/env npx tsx
/**
 * Tempo Platform — Database Backup Script
 *
 * Usage:
 *   npx tsx scripts/backup-database.ts              # full backup
 *   npx tsx scripts/backup-database.ts --incremental # incremental (changed rows only)
 *   npx tsx scripts/backup-database.ts --tables organizations,employees
 *
 * Output: backups/full/backup-YYYY-MM-DDTHH-MM-SS.tar.gz
 *         backups/incremental/backup-incr-YYYY-MM-DDTHH-MM-SS.tar.gz
 */

import * as fs from 'fs'
import * as path from 'path'
import { createGzip } from 'zlib'
import {
  exportAllTables,
  exportTable,
  loadMetadata,
  saveMetadata,
} from '../src/lib/backup/data-export'
import { BACKUP_PATHS } from '../src/lib/backup/config'

// ─── Load .env.local ──────────────────────────────────────────────────────────

const envPath = path.resolve(__dirname, '../.env.local')
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const value = trimmed.slice(eqIdx + 1).trim()
    if (!process.env[key]) process.env[key] = value
  }
}

// ─── Parse CLI args ───────────────────────────────────────────────────────────

const args = process.argv.slice(2)
const isIncremental = args.includes('--incremental') || args.includes('-i')
const tablesArg = args.find((a) => a.startsWith('--tables='))
const specificTables = tablesArg
  ? tablesArg.split('=')[1].split(',').map((t) => t.trim())
  : null

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const projectRoot = path.resolve(__dirname, '..')
  const startTime = Date.now()

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       Tempo Platform — Database Backup                  ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()

  const backupType = isIncremental ? 'incremental' : 'full'
  console.log(`  Type:        ${backupType}`)
  console.log(`  Started:     ${new Date().toISOString()}`)
  if (specificTables) {
    console.log(`  Tables:      ${specificTables.join(', ')}`)
  }
  console.log()

  // Load metadata for incremental
  const metadata = loadMetadata(projectRoot)
  const since = isIncremental ? metadata.lastIncrementalBackup ?? metadata.lastFullBackup : null

  if (isIncremental && !since) {
    console.log('  ⚠ No previous backup found — running full backup instead.')
  }

  // Create temp directory for export
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const subDir = isIncremental && since
    ? BACKUP_PATHS.incrementalDir
    : BACKUP_PATHS.fullDir
  const archiveName = isIncremental && since
    ? `backup-incr-${timestamp}`
    : `backup-${timestamp}`
  const tempDir = path.join(projectRoot, subDir, `_temp_${archiveName}`)

  // Ensure output directories exist
  const outputDir = path.join(projectRoot, subDir)
  fs.mkdirSync(outputDir, { recursive: true })
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    let tableCount = 0
    let totalRows = 0
    let totalBytes = 0

    if (specificTables) {
      // Export specific tables
      for (const tableName of specificTables) {
        process.stdout.write(`  Exporting ${tableName}...`)
        const result = await exportTable(tableName, {
          since: since ?? undefined,
        })
        const filePath = path.join(tempDir, `${tableName}.json`)
        fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2), 'utf8')
        tableCount++
        totalRows += result.rowCount
        totalBytes += result.sizeBytes
        console.log(` ${result.rowCount} rows (${formatBytes(result.sizeBytes)})`)
      }

      // Write a basic manifest
      const manifest = {
        version: '1.0' as const,
        type: backupType as 'full' | 'incremental',
        createdAt: new Date().toISOString(),
        databaseUrl: '***',
        tables: specificTables.map((t) => ({
          name: t,
          rowCount: 0,
          sizeBytes: 0,
          hasUpdatedAt: false,
        })),
        totalRows,
        totalSizeBytes: totalBytes,
      }
      fs.writeFileSync(
        path.join(tempDir, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8',
      )
    } else {
      // Export all tables
      const result = await exportAllTables({
        outputDir: tempDir,
        since: since ?? undefined,
        onProgress: (table, rowCount) => {
          tableCount++
          totalRows += rowCount
          const status = rowCount === 0 ? 'empty' : `${rowCount} rows`
          console.log(`  [${tableCount.toString().padStart(3)}] ${table.padEnd(40)} ${status}`)
        },
      })
      totalBytes = result.manifest.totalSizeBytes
    }

    // Create tar.gz archive
    console.log()
    process.stdout.write('  Creating archive...')
    const archivePath = path.join(outputDir, `${archiveName}.tar.gz`)
    await createTarGz(tempDir, archivePath)
    const archiveSize = fs.statSync(archivePath).size
    console.log(` done (${formatBytes(archiveSize)})`)

    // Clean up temp directory
    fs.rmSync(tempDir, { recursive: true, force: true })

    // Update metadata
    const now = new Date().toISOString()
    if (isIncremental && since) {
      metadata.lastIncrementalBackup = now
    } else {
      metadata.lastFullBackup = now
    }
    saveMetadata(metadata, projectRoot)

    // Summary
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log()
    console.log('  ────────────────────────────────────────────────────')
    console.log(`  Tables exported:  ${tableCount}`)
    console.log(`  Total rows:       ${totalRows.toLocaleString()}`)
    console.log(`  Raw size:         ${formatBytes(totalBytes)}`)
    console.log(`  Archive size:     ${formatBytes(archiveSize)}`)
    console.log(`  Compression:      ${totalBytes > 0 ? ((1 - archiveSize / totalBytes) * 100).toFixed(1) : 0}%`)
    console.log(`  Time:             ${elapsed}s`)
    console.log(`  Archive:          ${archivePath}`)
    console.log()
    console.log('  Backup complete.')
  } catch (err) {
    // Clean up temp dir on error
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
    throw err
  }
}

// ─── Tar.gz helper (no external deps) ─────────────────────────────────────────

async function createTarGz(sourceDir: string, outputPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputPath)
    const gzip = createGzip({ level: 6 })

    gzip.pipe(output)

    output.on('finish', resolve)
    output.on('error', reject)
    gzip.on('error', reject)

    const files = fs.readdirSync(sourceDir)

    // Write a simple tar archive
    for (const filename of files) {
      const filePath = path.join(sourceDir, filename)
      const stat = fs.statSync(filePath)
      if (!stat.isFile()) continue

      const content = fs.readFileSync(filePath)

      // TAR header (512 bytes)
      const header = Buffer.alloc(512)
      // filename (100 bytes)
      header.write(filename, 0, Math.min(filename.length, 100), 'utf8')
      // file mode (8 bytes at offset 100)
      header.write('0000644\0', 100, 8, 'utf8')
      // owner ID (8 bytes at offset 108)
      header.write('0001000\0', 108, 8, 'utf8')
      // group ID (8 bytes at offset 116)
      header.write('0001000\0', 116, 8, 'utf8')
      // file size in octal (12 bytes at offset 124)
      header.write(stat.size.toString(8).padStart(11, '0') + '\0', 124, 12, 'utf8')
      // modification time in octal (12 bytes at offset 136)
      const mtime = Math.floor(stat.mtimeMs / 1000)
      header.write(mtime.toString(8).padStart(11, '0') + '\0', 136, 12, 'utf8')
      // type flag (1 byte at offset 156): '0' = regular file
      header.write('0', 156, 1, 'utf8')
      // USTAR indicator (6 bytes at offset 257)
      header.write('ustar\0', 257, 6, 'utf8')
      // USTAR version (2 bytes at offset 263)
      header.write('00', 263, 2, 'utf8')

      // Compute checksum (8 bytes at offset 148)
      // First fill checksum field with spaces
      header.write('        ', 148, 8, 'utf8')
      let checksum = 0
      for (let i = 0; i < 512; i++) checksum += header[i]
      header.write(checksum.toString(8).padStart(6, '0') + '\0 ', 148, 8, 'utf8')

      gzip.write(header)
      gzip.write(content)

      // Pad to 512-byte boundary
      const remainder = content.length % 512
      if (remainder > 0) {
        gzip.write(Buffer.alloc(512 - remainder))
      }
    }

    // Two 512-byte zero blocks to mark end of archive
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

main().catch((err) => {
  console.error('\n  Backup failed:', err)
  process.exit(1)
})
