/**
 * Data Export Utility for Tempo Platform
 *
 * Provides functions to export individual tables, the entire database,
 * validate backup integrity, and retrieve backup statistics.
 *
 * Uses the Neon serverless driver directly so it can run both inside
 * Next.js API routes and standalone scripts (via `npx tsx`).
 */

import { neon, type NeonQueryFunction } from '@neondatabase/serverless'
import * as fs from 'fs'
import * as path from 'path'
import {
  TABLE_PRIORITY,
  BACKUP_EXCLUSIONS,
  BACKUP_PATHS,
  type BackupManifest,
  type BackupMetadata,
  createEmptyMetadata,
} from './config'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSql(): NeonQueryFunction<false, false> {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL environment variable is not set')
  return neon(url)
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url)
    u.password = '***'
    return u.toString()
  } catch {
    return '***'
  }
}

/** Check whether a table has an `updated_at` column. */
async function tableHasUpdatedAt(
  sql: NeonQueryFunction<false, false>,
  tableName: string,
): Promise<boolean> {
  const rows = await sql`
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = ${tableName}
      AND column_name = 'updated_at'
    LIMIT 1
  `
  return rows.length > 0
}

/** Get all public tables that actually exist in the database. */
async function getExistingTables(
  sql: NeonQueryFunction<false, false>,
): Promise<string[]> {
  const rows = await sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `
  return rows.map((r: Record<string, unknown>) => r.table_name as string)
}

// ─── Export Functions ─────────────────────────────────────────────────────────

export interface ExportTableOptions {
  /** Only export rows updated after this ISO timestamp (for incremental) */
  since?: string
  /** Override SQL client (for testing) */
  sqlClient?: NeonQueryFunction<false, false>
  /** Progress callback */
  onProgress?: (table: string, rowCount: number) => void
}

/**
 * Export a single table to a JSON-serialisable array of rows.
 * Returns `{ rows, rowCount, sizeBytes, hasUpdatedAt }`.
 */
export async function exportTable(
  tableName: string,
  options: ExportTableOptions = {},
) {
  const sql = options.sqlClient ?? getSql()
  const hasUpdatedAt = await tableHasUpdatedAt(sql, tableName)

  let rows: Record<string, unknown>[]

  if (options.since && hasUpdatedAt) {
    // Incremental — only rows changed since last backup
    rows = await sql`
      SELECT * FROM ${sql.unsafe('"' + tableName + '"')}
      WHERE updated_at > ${options.since}::timestamptz
      ORDER BY updated_at ASC
    ` as Record<string, unknown>[]
  } else {
    // Full export
    rows = await sql`
      SELECT * FROM ${sql.unsafe('"' + tableName + '"')}
    ` as Record<string, unknown>[]
  }

  const json = JSON.stringify(rows)
  const sizeBytes = Buffer.byteLength(json, 'utf8')

  options.onProgress?.(tableName, rows.length)

  return {
    rows,
    rowCount: rows.length,
    sizeBytes,
    hasUpdatedAt,
  }
}

export interface ExportAllOptions extends ExportTableOptions {
  /** Directory to write JSON files into (one per table). */
  outputDir: string
  /** If true, only include tables listed in TABLE_PRIORITY config. */
  priorityOnly?: boolean
}

export interface ExportAllResult {
  manifest: BackupManifest
  /** Absolute paths to all written JSON files */
  files: string[]
}

/**
 * Export all (or priority) tables to individual JSON files.
 * Returns a manifest describing the backup.
 */
export async function exportAllTables(
  options: ExportAllOptions,
): Promise<ExportAllResult> {
  const sql = options.sqlClient ?? getSql()
  const existingTables = await getExistingTables(sql)

  // Determine which tables to back up
  let tablesToBackup: string[]
  if (options.priorityOnly) {
    tablesToBackup = TABLE_PRIORITY.filter((t) => existingTables.includes(t))
  } else {
    // Use priority order for known tables, then append any unknown ones
    const prioritySet = new Set(TABLE_PRIORITY)
    const excludedSet = new Set(BACKUP_EXCLUSIONS.excludedTables)
    const prioritized = TABLE_PRIORITY.filter(
      (t) => existingTables.includes(t) && !excludedSet.has(t),
    )
    const remaining = existingTables.filter(
      (t) => !prioritySet.has(t) && !excludedSet.has(t),
    )
    tablesToBackup = [...prioritized, ...remaining]
  }

  ensureDir(options.outputDir)

  const manifest: BackupManifest = {
    version: '1.0',
    type: options.since ? 'incremental' : 'full',
    createdAt: new Date().toISOString(),
    databaseUrl: redactUrl(process.env.DATABASE_URL ?? ''),
    tables: [],
    totalRows: 0,
    totalSizeBytes: 0,
  }

  const files: string[] = []

  for (const tableName of tablesToBackup) {
    const result = await exportTable(tableName, {
      since: options.since,
      sqlClient: sql,
      onProgress: options.onProgress,
    })

    // Skip empty tables in incremental mode
    if (options.since && result.rowCount === 0) continue

    const filePath = path.join(options.outputDir, `${tableName}.json`)
    fs.writeFileSync(filePath, JSON.stringify(result.rows, null, 2), 'utf8')
    files.push(filePath)

    manifest.tables.push({
      name: tableName,
      rowCount: result.rowCount,
      sizeBytes: result.sizeBytes,
      hasUpdatedAt: result.hasUpdatedAt,
    })
    manifest.totalRows += result.rowCount
    manifest.totalSizeBytes += result.sizeBytes
  }

  // Write manifest
  const manifestPath = path.join(options.outputDir, 'manifest.json')
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2), 'utf8')
  files.push(manifestPath)

  return { manifest, files }
}

// ─── Validation ───────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
  tableCount: number
  totalRows: number
}

/**
 * Validate a backup directory or extracted archive.
 * Checks for manifest presence, JSON parse-ability, row counts, etc.
 */
export async function validateBackup(
  backupDir: string,
): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    tableCount: 0,
    totalRows: 0,
  }

  // 1. Check manifest exists
  const manifestPath = path.join(backupDir, 'manifest.json')
  if (!fs.existsSync(manifestPath)) {
    result.valid = false
    result.errors.push('manifest.json not found in backup directory')
    return result
  }

  // 2. Parse manifest
  let manifest: BackupManifest
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'))
  } catch (e) {
    result.valid = false
    result.errors.push(`Failed to parse manifest.json: ${e}`)
    return result
  }

  if (manifest.version !== '1.0') {
    result.warnings.push(`Unknown manifest version: ${manifest.version}`)
  }

  // 3. Verify each table file
  for (const entry of manifest.tables) {
    const filePath = path.join(backupDir, `${entry.name}.json`)

    if (!fs.existsSync(filePath)) {
      result.valid = false
      result.errors.push(`Missing table file: ${entry.name}.json`)
      continue
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'))

      if (!Array.isArray(data)) {
        result.valid = false
        result.errors.push(`${entry.name}.json is not an array`)
        continue
      }

      if (data.length !== entry.rowCount) {
        result.warnings.push(
          `${entry.name}: manifest says ${entry.rowCount} rows, file has ${data.length}`,
        )
      }

      result.tableCount++
      result.totalRows += data.length
    } catch (e) {
      result.valid = false
      result.errors.push(`Failed to parse ${entry.name}.json: ${e}`)
    }
  }

  return result
}

// ─── Backup Statistics ────────────────────────────────────────────────────────

export interface BackupInfo {
  filename: string
  path: string
  type: 'full' | 'incremental' | 'unknown'
  createdAt: string
  sizeBytes: number
  tableCount?: number
  totalRows?: number
}

export interface BackupStats {
  backups: BackupInfo[]
  totalSizeBytes: number
  lastFullBackup: string | null
  lastIncrementalBackup: string | null
}

/**
 * Scan the backups directory and return information about all backups.
 */
export function getBackupStats(projectRoot?: string): BackupStats {
  const root = projectRoot ?? process.cwd()
  const backupsDir = path.join(root, BACKUP_PATHS.rootDir)

  const stats: BackupStats = {
    backups: [],
    totalSizeBytes: 0,
    lastFullBackup: null,
    lastIncrementalBackup: null,
  }

  if (!fs.existsSync(backupsDir)) return stats

  // Scan for .tar.gz files
  const scanDir = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir)
    for (const entry of entries) {
      const fullPath = path.join(dir, entry)
      const stat = fs.statSync(fullPath)

      if (stat.isDirectory()) {
        scanDir(fullPath)
        continue
      }

      if (!entry.endsWith('.tar.gz') && !entry.endsWith('.tgz')) continue

      const info: BackupInfo = {
        filename: entry,
        path: fullPath,
        type: entry.includes('incremental') ? 'incremental' : entry.includes('full') ? 'full' : 'unknown',
        createdAt: stat.mtime.toISOString(),
        sizeBytes: stat.size,
      }

      stats.backups.push(info)
      stats.totalSizeBytes += stat.size
    }
  }

  scanDir(backupsDir)

  // Sort newest first
  stats.backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  // Determine last backups
  const lastFull = stats.backups.find((b) => b.type === 'full')
  const lastIncr = stats.backups.find((b) => b.type === 'incremental')
  stats.lastFullBackup = lastFull?.createdAt ?? null
  stats.lastIncrementalBackup = lastIncr?.createdAt ?? null

  return stats
}

// ─── Metadata helpers ─────────────────────────────────────────────────────────

export function loadMetadata(projectRoot?: string): BackupMetadata {
  const root = projectRoot ?? process.cwd()
  const metaPath = path.join(root, BACKUP_PATHS.metadataFile)
  if (!fs.existsSync(metaPath)) return createEmptyMetadata()
  try {
    return JSON.parse(fs.readFileSync(metaPath, 'utf8'))
  } catch {
    return createEmptyMetadata()
  }
}

export function saveMetadata(
  metadata: BackupMetadata,
  projectRoot?: string,
): void {
  const root = projectRoot ?? process.cwd()
  const metaPath = path.join(root, BACKUP_PATHS.metadataFile)
  ensureDir(path.dirname(metaPath))
  fs.writeFileSync(metaPath, JSON.stringify(metadata, null, 2), 'utf8')
}
