/**
 * Backup Scheduler Service
 *
 * Manages backup triggering, status checking, and history tracking
 * for the Neon PostgreSQL database. In production, `triggerBackup`
 * would call the Neon API to create a branch-based backup.
 */

import {
  BACKUP_SCHEDULE,
  RETENTION_POLICY,
  TABLE_PRIORITY,
  BACKUP_EXCLUSIONS,
  type BackupMetadata,
  createEmptyMetadata,
} from '@/lib/backup/config'

// ─── Types ──────────────────────────────────────────────────────────────────

export type BackupTier = 'full' | 'incremental'

export type BackupStatus = 'pending' | 'running' | 'completed' | 'failed'

export interface BackupRecord {
  id: string
  tier: BackupTier
  status: BackupStatus
  startedAt: string
  completedAt: string | null
  tableCount: number
  sizeBytes: number
  error: string | null
}

// ─── In-memory store (would be DB-backed in production) ─────────────────────

const backupHistory: BackupRecord[] = [
  {
    id: 'bk-001',
    tier: 'full',
    status: 'completed',
    startedAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    completedAt: new Date(Date.now() - 6 * 3600_000 + 420_000).toISOString(),
    tableCount: TABLE_PRIORITY.length - BACKUP_EXCLUSIONS.excludedTables.length,
    sizeBytes: 2_450_000_000,
    error: null,
  },
  {
    id: 'bk-002',
    tier: 'incremental',
    status: 'completed',
    startedAt: new Date(Date.now() - 1 * 3600_000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 3600_000 + 45_000).toISOString(),
    tableCount: 42,
    sizeBytes: 128_000_000,
    error: null,
  },
  {
    id: 'bk-003',
    tier: 'full',
    status: 'completed',
    startedAt: new Date(Date.now() - 30 * 3600_000).toISOString(),
    completedAt: new Date(Date.now() - 30 * 3600_000 + 390_000).toISOString(),
    tableCount: TABLE_PRIORITY.length - BACKUP_EXCLUSIONS.excludedTables.length,
    sizeBytes: 2_420_000_000,
    error: null,
  },
]

let metadata: BackupMetadata = {
  lastFullBackup: backupHistory[0].completedAt,
  lastIncrementalBackup: backupHistory[1].completedAt,
  tables: {},
}

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Trigger a backup of the specified tier.
 * In production this would call the Neon API to create a point-in-time
 * branch or pg_dump snapshot. Currently logs the trigger event.
 */
export async function triggerBackup(tier: BackupTier): Promise<BackupRecord> {
  const id = `bk-${Date.now().toString(36)}`
  const record: BackupRecord = {
    id,
    tier,
    status: 'running',
    startedAt: new Date().toISOString(),
    completedAt: null,
    tableCount: 0,
    sizeBytes: 0,
    error: null,
  }

  console.log(`[backup-scheduler] Triggering ${tier} backup (id=${id})`)

  // Simulate backup work
  const tables = tier === 'full'
    ? TABLE_PRIORITY.filter(t => !BACKUP_EXCLUSIONS.excludedTables.includes(t))
    : TABLE_PRIORITY.slice(0, 40) // incremental = subset

  record.tableCount = tables.length
  record.sizeBytes = tier === 'full' ? 2_500_000_000 : 130_000_000

  // In production: await neonApi.createBranch({ ... })
  console.log(`[backup-scheduler] ${tier} backup ${id}: ${tables.length} tables queued`)

  // Mark completed
  record.status = 'completed'
  record.completedAt = new Date().toISOString()

  // Update metadata
  if (tier === 'full') {
    metadata.lastFullBackup = record.completedAt
  } else {
    metadata.lastIncrementalBackup = record.completedAt
  }

  // Add to history
  backupHistory.unshift(record)

  console.log(`[backup-scheduler] ${tier} backup ${id} completed`)
  return record
}

/**
 * Check the current backup status including last run times
 * and next scheduled runs.
 */
export function checkBackupStatus(): {
  lastFullBackup: string | null
  lastIncrementalBackup: string | null
  nextFullBackup: string
  nextIncrementalBackup: string
  retentionPolicy: typeof RETENTION_POLICY
  schedule: typeof BACKUP_SCHEDULE
} {
  // Calculate next scheduled run from cron expressions
  const now = new Date()

  // Next full backup: daily at 02:00 UTC
  const nextFull = new Date(now)
  nextFull.setUTCHours(2, 0, 0, 0)
  if (nextFull <= now) nextFull.setUTCDate(nextFull.getUTCDate() + 1)

  // Next incremental: hourly at :15
  const nextIncr = new Date(now)
  nextIncr.setUTCMinutes(15, 0, 0)
  if (nextIncr <= now) nextIncr.setUTCHours(nextIncr.getUTCHours() + 1)

  return {
    lastFullBackup: metadata.lastFullBackup,
    lastIncrementalBackup: metadata.lastIncrementalBackup,
    nextFullBackup: nextFull.toISOString(),
    nextIncrementalBackup: nextIncr.toISOString(),
    retentionPolicy: RETENTION_POLICY,
    schedule: BACKUP_SCHEDULE,
  }
}

/**
 * Get recent backup history records.
 */
export function getBackupHistory(limit = 20): BackupRecord[] {
  return backupHistory.slice(0, limit)
}
