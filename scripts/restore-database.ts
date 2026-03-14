#!/usr/bin/env npx tsx
/**
 * Tempo Platform — Database Restore Script
 *
 * Usage:
 *   npx tsx scripts/restore-database.ts backups/full/backup-2026-03-14T02-00-00.tar.gz
 *   npx tsx scripts/restore-database.ts backups/full/backup-2026-03-14T02-00-00.tar.gz --tables organizations,employees
 *   npx tsx scripts/restore-database.ts backups/full/backup-2026-03-14T02-00-00.tar.gz --dry-run
 *   npx tsx scripts/restore-database.ts backups/full/backup-2026-03-14T02-00-00.tar.gz --yes
 *
 * Options:
 *   --tables=t1,t2   Restore only specific tables
 *   --dry-run        Validate backup without restoring
 *   --yes            Skip confirmation prompt
 *   --merge          Upsert instead of truncate+insert (preserves existing data)
 */

import * as fs from 'fs'
import * as path from 'path'
import { createGunzip } from 'zlib'
import { neon } from '@neondatabase/serverless'
import { validateBackup } from '../src/lib/backup/data-export'
import { TABLE_PRIORITY } from '../src/lib/backup/config'
import type { BackupManifest } from '../src/lib/backup/config'

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
const archivePath = args.find((a) => !a.startsWith('--'))
const isDryRun = args.includes('--dry-run')
const skipConfirmation = args.includes('--yes') || args.includes('-y')
const isMerge = args.includes('--merge')
const tablesArg = args.find((a) => a.startsWith('--tables='))
const specificTables = tablesArg
  ? tablesArg.split('=')[1].split(',').map((t) => t.trim())
  : null

if (!archivePath) {
  console.error('Usage: npx tsx scripts/restore-database.ts <backup-archive.tar.gz> [options]')
  console.error()
  console.error('Options:')
  console.error('  --tables=t1,t2   Restore only specific tables')
  console.error('  --dry-run        Validate only, do not restore')
  console.error('  --yes            Skip confirmation prompt')
  console.error('  --merge          Upsert mode (preserves existing data)')
  process.exit(1)
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const startTime = Date.now()
  const projectRoot = path.resolve(__dirname, '..')
  const fullArchivePath = path.resolve(projectRoot, archivePath!)

  console.log('╔══════════════════════════════════════════════════════════╗')
  console.log('║       Tempo Platform — Database Restore                 ║')
  console.log('╚══════════════════════════════════════════════════════════╝')
  console.log()

  // Verify archive exists
  if (!fs.existsSync(fullArchivePath)) {
    console.error(`  Archive not found: ${fullArchivePath}`)
    process.exit(1)
  }

  const archiveSize = fs.statSync(fullArchivePath).size
  console.log(`  Archive:     ${fullArchivePath}`)
  console.log(`  Size:        ${formatBytes(archiveSize)}`)
  if (specificTables) {
    console.log(`  Tables:      ${specificTables.join(', ')}`)
  }
  console.log(`  Mode:        ${isMerge ? 'merge (upsert)' : 'replace (truncate + insert)'}`)
  console.log(`  Dry run:     ${isDryRun ? 'yes' : 'no'}`)
  console.log()

  // Extract archive to temp directory
  console.log('  Extracting archive...')
  const tempDir = path.join(projectRoot, 'backups', `_restore_temp_${Date.now()}`)
  fs.mkdirSync(tempDir, { recursive: true })

  try {
    await extractTarGz(fullArchivePath, tempDir)
    console.log('  Archive extracted.')
    console.log()

    // Validate backup
    console.log('  Validating backup integrity...')
    const validation = await validateBackup(tempDir)

    if (validation.errors.length > 0) {
      console.error('  Validation errors:')
      for (const err of validation.errors) {
        console.error(`    - ${err}`)
      }
    }
    if (validation.warnings.length > 0) {
      console.log('  Validation warnings:')
      for (const warn of validation.warnings) {
        console.log(`    - ${warn}`)
      }
    }

    if (!validation.valid) {
      console.error('\n  Backup validation failed. Aborting restore.')
      process.exit(1)
    }

    console.log(`  Validation passed: ${validation.tableCount} tables, ${validation.totalRows.toLocaleString()} rows`)
    console.log()

    // Read manifest
    const manifest: BackupManifest = JSON.parse(
      fs.readFileSync(path.join(tempDir, 'manifest.json'), 'utf8'),
    )

    // Determine tables to restore
    let tablesToRestore = manifest.tables.map((t) => t.name)
    if (specificTables) {
      tablesToRestore = tablesToRestore.filter((t) => specificTables.includes(t))
      if (tablesToRestore.length === 0) {
        console.error('  No matching tables found in backup.')
        process.exit(1)
      }
    }

    // Sort by priority (FK dependencies)
    const priorityIndex = new Map(TABLE_PRIORITY.map((t, i) => [t, i]))
    tablesToRestore.sort((a, b) => {
      const ia = priorityIndex.get(a) ?? 9999
      const ib = priorityIndex.get(b) ?? 9999
      return ia - ib
    })

    console.log(`  Tables to restore (${tablesToRestore.length}):`)
    for (const t of tablesToRestore) {
      const entry = manifest.tables.find((e) => e.name === t)
      console.log(`    - ${t.padEnd(40)} ${entry?.rowCount ?? '?'} rows`)
    }
    console.log()

    if (isDryRun) {
      console.log('  Dry run complete. No changes were made.')
      return
    }

    // Confirmation
    if (!skipConfirmation) {
      const mode = isMerge ? 'MERGE into' : 'TRUNCATE and REPLACE'
      console.log(`  WARNING: This will ${mode} ${tablesToRestore.length} tables.`)
      console.log('  Press Ctrl+C to abort, or pass --yes to skip this prompt.')
      console.log()
      await waitForConfirmation()
    }

    // Restore
    const sql = neon(process.env.DATABASE_URL!)
    let restored = 0
    let totalRowsRestored = 0

    for (const tableName of tablesToRestore) {
      const filePath = path.join(tempDir, `${tableName}.json`)
      if (!fs.existsSync(filePath)) {
        console.log(`  [SKIP] ${tableName} — file not found`)
        continue
      }

      const rows: Record<string, unknown>[] = JSON.parse(
        fs.readFileSync(filePath, 'utf8'),
      )

      if (rows.length === 0) {
        console.log(`  [SKIP] ${tableName} — 0 rows`)
        continue
      }

      process.stdout.write(`  Restoring ${tableName} (${rows.length} rows)...`)

      try {
        if (isMerge) {
          // Upsert mode — insert rows one at a time with ON CONFLICT
          await restoreTableMerge(sql, tableName, rows)
        } else {
          // Replace mode — truncate + bulk insert
          await restoreTableReplace(sql, tableName, rows)
        }

        restored++
        totalRowsRestored += rows.length
        console.log(' done')
      } catch (err) {
        console.log(` FAILED`)
        console.error(`    Error: ${err instanceof Error ? err.message : err}`)
        // Continue with next table instead of aborting
      }
    }

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
    console.log()
    console.log('  ────────────────────────────────────────────────────')
    console.log(`  Tables restored:  ${restored}`)
    console.log(`  Total rows:       ${totalRowsRestored.toLocaleString()}`)
    console.log(`  Time:             ${elapsed}s`)
    console.log()
    console.log('  Restore complete.')
  } finally {
    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true })
    }
  }
}

// ─── Restore Helpers ──────────────────────────────────────────────────────────

async function restoreTableReplace(
  sql: any,
  tableName: string,
  rows: Record<string, unknown>[],
) {
  // Truncate with CASCADE to handle FK constraints
  await sql`SELECT 1` // wake up connection
  await sql.query(`TRUNCATE TABLE "${tableName}" CASCADE`)

  // Insert in batches of 50 (neon-http has parameter limits)
  const batchSize = 50
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    await insertBatch(sql, tableName, batch)
  }
}

async function restoreTableMerge(
  sql: any,
  tableName: string,
  rows: Record<string, unknown>[],
) {
  // Upsert one row at a time using ON CONFLICT on primary key (id)
  for (const row of rows) {
    const columns = Object.keys(row)
    const values = serializeValues(columns, row)
    const colList = columns.map((c) => `"${c}"`).join(', ')
    const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ')
    const updateSet = columns
      .filter((c) => c !== 'id')
      .map((c) => `"${c}" = EXCLUDED."${c}"`)
      .join(', ')

    const query = updateSet
      ? `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO UPDATE SET ${updateSet}`
      : `INSERT INTO "${tableName}" (${colList}) VALUES (${placeholders}) ON CONFLICT (id) DO NOTHING`

    await sql.query(query, values)
  }
}

async function insertBatch(
  sql: any,
  tableName: string,
  rows: Record<string, unknown>[],
) {
  if (rows.length === 0) return

  const columns = Object.keys(rows[0])
  const colList = columns.map((c) => `"${c}"`).join(', ')

  // Build multi-row VALUES clause
  const allValues: unknown[] = []
  const rowPlaceholders: string[] = []

  for (let r = 0; r < rows.length; r++) {
    const placeholders = columns.map((_, c) => `$${r * columns.length + c + 1}`)
    rowPlaceholders.push(`(${placeholders.join(', ')})`)
    const serialized = serializeValues(columns, rows[r])
    allValues.push(...serialized)
  }

  const query = `INSERT INTO "${tableName}" (${colList}) VALUES ${rowPlaceholders.join(', ')}`
  await sql.query(query, allValues)
}

/** Serialize row values — convert objects/arrays to JSON strings for jsonb columns. */
function serializeValues(columns: string[], row: Record<string, unknown>): unknown[] {
  return columns.map((col) => {
    const val = row[col]
    if (val !== null && typeof val === 'object') {
      return JSON.stringify(val)
    }
    return val
  })
}

// ─── Tar.gz Extraction (no external deps) ─────────────────────────────────────

async function extractTarGz(archivePath: string, outputDir: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const input = fs.createReadStream(archivePath)
    const gunzip = createGunzip()
    const chunks: Buffer[] = []

    input.pipe(gunzip)

    gunzip.on('data', (chunk: Buffer) => chunks.push(chunk))
    gunzip.on('error', reject)
    gunzip.on('end', () => {
      try {
        const data = Buffer.concat(chunks)
        let offset = 0

        while (offset + 512 <= data.length) {
          const header = data.subarray(offset, offset + 512)

          // Check for end-of-archive (all zeros)
          if (header.every((b) => b === 0)) break

          // Parse filename (first 100 bytes, null-terminated)
          const nameEnd = header.indexOf(0, 0)
          const filename = header.subarray(0, Math.min(nameEnd >= 0 ? nameEnd : 100, 100)).toString('utf8')

          // Parse file size (12 bytes at offset 124, octal)
          const sizeStr = header.subarray(124, 136).toString('utf8').trim().replace(/\0/g, '')
          const fileSize = parseInt(sizeStr, 8) || 0

          // Parse type flag (1 byte at offset 156)
          const typeFlag = header.subarray(156, 157).toString('utf8')

          offset += 512 // skip header

          if (typeFlag === '0' || typeFlag === '\0' || typeFlag === '') {
            // Regular file
            if (filename && fileSize > 0) {
              const content = data.subarray(offset, offset + fileSize)
              const outPath = path.join(outputDir, path.basename(filename))
              fs.writeFileSync(outPath, content)
            }
          }

          // Advance past file data (padded to 512 bytes)
          offset += Math.ceil(fileSize / 512) * 512
        }

        resolve()
      } catch (err) {
        reject(err)
      }
    })
  })
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function waitForConfirmation(): Promise<void> {
  return new Promise((resolve) => {
    process.stdout.write('  Type "yes" to continue: ')
    process.stdin.setEncoding('utf8')
    process.stdin.once('data', (data: string) => {
      if (data.trim().toLowerCase() === 'yes') {
        resolve()
      } else {
        console.log('  Aborted.')
        process.exit(0)
      }
    })
    // If stdin is not a TTY (piped), proceed with --yes flag behavior check
    if (!process.stdin.isTTY) {
      console.log('\n  Non-interactive mode. Use --yes to skip confirmation.')
      process.exit(1)
    }
  })
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

main().catch((err) => {
  console.error('\n  Restore failed:', err)
  process.exit(1)
})
