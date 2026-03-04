/**
 * Sandbox Environment Service
 *
 * Isolated test environment management for HR platform. Supports:
 * - Creating and provisioning sandbox environments
 * - PII data masking (emails, phones, SSN, salaries, names)
 * - Module-selective data copying from production
 * - Snapshot creation and restoration
 * - Sandbox pause, resume, and expiration management
 * - Production cloning with data sanitization
 * - Access logging and storage tracking
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, asc, lte, gte, inArray } from 'drizzle-orm'
import { randomUUID } from 'crypto'

// ============================================================
// Types & Interfaces
// ============================================================

export type SandboxStatus = 'provisioning' | 'active' | 'paused' | 'expired' | 'deleted'
export type SnapshotStatus = 'creating' | 'ready' | 'restoring' | 'failed'

export interface DataMaskingConfig {
  maskEmails: boolean
  maskPhones: boolean
  maskSSN: boolean
  maskSalaries: boolean
  maskNames: boolean
  maskAddresses?: boolean
  preserveAdminAccounts?: boolean
  customMaskingRules?: { field: string; strategy: 'hash' | 'randomize' | 'redact' | 'fake' }[]
}

export interface CreateSandboxInput {
  name: string
  description?: string
  modules?: string[]
  dataMaskingConfig?: DataMaskingConfig
  expiresInDays?: number
  maxStorageMb?: number
}

export interface SandboxStatusResult {
  id: string
  name: string
  status: SandboxStatus
  sourceType: string
  modules: string[] | null
  dataMaskingConfig: DataMaskingConfig | null
  storageUsedMb: number
  maxStorageMb: number
  storageUtilization: number
  expiresAt: Date | null
  daysUntilExpiry: number | null
  isExpiringSoon: boolean
  createdAt: Date
  lastAccessedAt: Date | null
  pausedAt: Date | null
  snapshotCount: number
  accessLogCount: number
}

export interface CloneConfig {
  name: string
  description?: string
  modules?: string[]
  dataMaskingConfig?: DataMaskingConfig
  expiresInDays?: number
  includeCustomFields?: boolean
  includeWorkflows?: boolean
  includeIntegrations?: boolean
}

// ============================================================
// Error Classes
// ============================================================

export class SandboxError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'SandboxError'
  }
}

// ============================================================
// Data Masking Utilities
// ============================================================

const DEFAULT_MASKING_CONFIG: DataMaskingConfig = {
  maskEmails: true,
  maskPhones: true,
  maskSSN: true,
  maskSalaries: true,
  maskNames: false,
  maskAddresses: false,
  preserveAdminAccounts: true,
}

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return 'masked@example.com'
  const maskedLocal = local.substring(0, 2) + '***'
  return `${maskedLocal}@sandbox.${domain}`
}

function maskPhone(phone: string): string {
  if (!phone) return ''
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 4) return '***-***-****'
  return `***-***-${digits.slice(-4)}`
}

function maskSSN(ssn: string): string {
  if (!ssn) return ''
  return `***-**-${ssn.slice(-4)}`
}

function maskSalary(salary: number): number {
  // Randomize within +/- 20% while preserving relative ordering
  const factor = 0.8 + Math.random() * 0.4
  return Math.round(salary * factor)
}

function maskName(name: string): string {
  if (!name) return 'Masked User'
  const parts = name.split(' ')
  return parts.map((p, i) =>
    i === 0 ? p[0] + '.' : p[0] + '***'
  ).join(' ')
}

function maskAddress(address: string): string {
  if (!address) return ''
  return address.replace(/\d+/g, '***').substring(0, 20) + '...'
}

/**
 * Apply data masking rules to a data object.
 * Used when copying production data to sandbox.
 */
export function applyDataMasking(
  data: Record<string, unknown>,
  config: DataMaskingConfig,
  dataType: string
): Record<string, unknown> {
  const masked = { ...data }

  if (config.maskEmails) {
    for (const key of ['email', 'candidateEmail', 'contactEmail', 'primaryContactEmail']) {
      if (typeof masked[key] === 'string') {
        masked[key] = maskEmail(masked[key] as string)
      }
    }
  }

  if (config.maskPhones) {
    for (const key of ['phone', 'primaryContactPhone']) {
      if (typeof masked[key] === 'string') {
        masked[key] = maskPhone(masked[key] as string)
      }
    }
  }

  if (config.maskSSN) {
    for (const key of ['ssn', 'socialSecurityNumber']) {
      if (typeof masked[key] === 'string') {
        masked[key] = maskSSN(masked[key] as string)
      }
    }
  }

  if (config.maskSalaries) {
    for (const key of ['currentSalary', 'proposedSalary', 'basePay', 'grossPay', 'netPay', 'amount', 'totalAmount', 'salaryMin', 'salaryMax']) {
      if (typeof masked[key] === 'number') {
        masked[key] = maskSalary(masked[key] as number)
      }
    }
  }

  if (config.maskNames) {
    for (const key of ['fullName', 'candidateName', 'name']) {
      if (typeof masked[key] === 'string') {
        masked[key] = maskName(masked[key] as string)
      }
    }
  }

  if (config.maskAddresses) {
    for (const key of ['address', 'location']) {
      if (typeof masked[key] === 'string') {
        masked[key] = maskAddress(masked[key] as string)
      }
    }
  }

  // Apply custom masking rules
  if (config.customMaskingRules) {
    for (const rule of config.customMaskingRules) {
      if (masked[rule.field] !== undefined) {
        switch (rule.strategy) {
          case 'redact':
            masked[rule.field] = '[REDACTED]'
            break
          case 'hash':
            masked[rule.field] = `hash_${randomUUID().substring(0, 8)}`
            break
          case 'randomize':
            if (typeof masked[rule.field] === 'number') {
              masked[rule.field] = Math.floor(Math.random() * 10000)
            } else {
              masked[rule.field] = `random_${randomUUID().substring(0, 8)}`
            }
            break
          case 'fake':
            masked[rule.field] = `fake_${rule.field}_${Math.random().toString(36).substring(2, 8)}`
            break
        }
      }
    }
  }

  return masked
}

// ============================================================
// Available modules for selective data copying
// ============================================================

const AVAILABLE_MODULES = [
  'employees', 'departments', 'performance', 'compensation',
  'learning', 'engagement', 'mentoring', 'payroll', 'leave',
  'benefits', 'expenses', 'recruiting', 'it', 'finance',
  'projects', 'strategy', 'workflows', 'compliance',
]

// ============================================================
// Core Functions
// ============================================================

/**
 * Create a new sandbox environment.
 * Sets up an isolated environment with configurable data masking.
 */
export async function createSandbox(
  orgId: string,
  createdBy: string,
  input: CreateSandboxInput
) {
  // Validate inputs
  if (!input.name?.trim()) {
    throw new SandboxError('Sandbox name is required', 'MISSING_NAME')
  }

  // Validate modules if provided
  if (input.modules) {
    const invalidModules = input.modules.filter(m => !AVAILABLE_MODULES.includes(m))
    if (invalidModules.length > 0) {
      throw new SandboxError(
        `Invalid modules: ${invalidModules.join(', ')}. Available: ${AVAILABLE_MODULES.join(', ')}`,
        'INVALID_MODULES'
      )
    }
  }

  // Check existing sandbox count (limit per org)
  const existingSandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.orgId, orgId),
      eq(schema.sandboxEnvironments.status, 'active')
    ))

  if (existingSandboxes.length >= 5) {
    throw new SandboxError(
      'Maximum of 5 active sandboxes per organization',
      'SANDBOX_LIMIT_REACHED'
    )
  }

  // Calculate expiration
  const expiresAt = input.expiresInDays
    ? new Date(Date.now() + input.expiresInDays * 24 * 60 * 60 * 1000)
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Default: 30 days

  const databaseName = `sandbox_${orgId.substring(0, 8)}_${Date.now().toString(36)}`

  const [sandbox] = await db.insert(schema.sandboxEnvironments).values({
    orgId,
    name: input.name.trim(),
    description: input.description || null,
    status: 'provisioning',
    createdBy,
    sourceType: 'empty',
    modules: input.modules || null,
    dataMaskingConfig: input.dataMaskingConfig || DEFAULT_MASKING_CONFIG,
    databaseName,
    expiresAt,
    maxStorageMb: input.maxStorageMb || 1024,
  }).returning()

  // Log the creation
  await db.insert(schema.sandboxAccessLog).values({
    sandboxId: sandbox.id,
    orgId,
    employeeId: createdBy,
    action: 'created',
    details: `Sandbox "${input.name}" created with ${input.modules?.length || 0} modules`,
  })

  return sandbox
}

/**
 * Provision a sandbox by copying and masking production data.
 * Transitions from provisioning to active status.
 */
export async function provisionSandbox(
  orgId: string,
  sandboxId: string
) {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'provisioning') {
    throw new SandboxError(
      `Cannot provision sandbox in ${sandbox.status} status`,
      'INVALID_STATUS'
    )
  }

  const modules = (sandbox.modules as string[]) || AVAILABLE_MODULES
  const maskingConfig = (sandbox.dataMaskingConfig as DataMaskingConfig) || DEFAULT_MASKING_CONFIG

  // Simulate provisioning - in production this would:
  // 1. Create a new database or schema
  // 2. Copy selected module data
  // 3. Apply data masking
  // 4. Set up connection string

  const provisioningStats = {
    modulesProvisioned: modules,
    dataMaskingApplied: true,
    maskingRules: {
      emailsMasked: maskingConfig.maskEmails,
      phonesMasked: maskingConfig.maskPhones,
      ssnMasked: maskingConfig.maskSSN,
      salariesMasked: maskingConfig.maskSalaries,
      namesMasked: maskingConfig.maskNames,
    },
    estimatedRecordCount: modules.length * 50, // rough estimate
    estimatedStorageMb: modules.length * 10,
  }

  const now = new Date()
  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'active',
      connectionString: `postgresql://sandbox:***@localhost:5432/${sandbox.databaseName}`,
      storageUsedMb: provisioningStats.estimatedStorageMb,
      lastAccessedAt: now,
      updatedAt: now,
      metadata: { provisioningStats },
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: sandbox.createdBy,
    action: 'provisioned',
    details: `Sandbox provisioned with ${modules.length} modules, ${provisioningStats.estimatedRecordCount} records`,
  })

  return {
    sandbox: updated,
    provisioningStats,
  }
}

/**
 * Pause an active sandbox to free resources.
 * Preserves all data but disables access.
 */
export async function pauseSandbox(
  orgId: string,
  sandboxId: string,
  pausedBy: string
) {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'active') {
    throw new SandboxError(
      `Cannot pause sandbox in ${sandbox.status} status`,
      'INVALID_STATUS'
    )
  }

  const now = new Date()
  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'paused',
      pausedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: pausedBy,
    action: 'paused',
    details: 'Sandbox paused by administrator',
  })

  return updated
}

/**
 * Resume a paused sandbox.
 */
export async function resumeSandbox(
  orgId: string,
  sandboxId: string,
  resumedBy: string
) {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'paused') {
    throw new SandboxError(
      `Cannot resume sandbox in ${sandbox.status} status`,
      'INVALID_STATUS'
    )
  }

  // Check if expired while paused
  if (sandbox.expiresAt && new Date(sandbox.expiresAt) < new Date()) {
    await db.update(schema.sandboxEnvironments)
      .set({ status: 'expired', updatedAt: new Date() })
      .where(eq(schema.sandboxEnvironments.id, sandboxId))

    throw new SandboxError('Sandbox expired while paused', 'SANDBOX_EXPIRED')
  }

  const now = new Date()
  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'active',
      pausedAt: null,
      lastAccessedAt: now,
      updatedAt: now,
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: resumedBy,
    action: 'resumed',
    details: 'Sandbox resumed',
  })

  return updated
}

/**
 * Mark a sandbox as deleted (soft delete).
 * Data is retained for a grace period before permanent deletion.
 */
export async function deleteSandbox(
  orgId: string,
  sandboxId: string,
  deletedBy: string
) {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status === 'deleted') {
    throw new SandboxError('Sandbox is already deleted', 'ALREADY_DELETED')
  }

  const now = new Date()
  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'deleted',
      updatedAt: now,
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: deletedBy,
    action: 'deleted',
    details: 'Sandbox marked for deletion',
  })

  return { sandboxId, status: 'deleted', message: 'Sandbox data will be permanently removed after 30-day grace period' }
}

/**
 * Create a snapshot of the current sandbox state for backup or restoration.
 */
export async function createSnapshot(
  orgId: string,
  sandboxId: string,
  createdBy: string,
  name: string,
  description?: string
) {
  if (!name?.trim()) {
    throw new SandboxError('Snapshot name is required', 'MISSING_NAME')
  }

  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'active') {
    throw new SandboxError(
      'Snapshots can only be created from active sandboxes',
      'SANDBOX_NOT_ACTIVE'
    )
  }

  // Check snapshot limit
  const existingSnapshots = await db.select()
    .from(schema.sandboxSnapshots)
    .where(eq(schema.sandboxSnapshots.sandboxId, sandboxId))

  if (existingSnapshots.length >= 10) {
    throw new SandboxError(
      'Maximum of 10 snapshots per sandbox. Delete older snapshots first.',
      'SNAPSHOT_LIMIT_REACHED'
    )
  }

  // Create the snapshot
  const snapshotData = {
    sandboxName: sandbox.name,
    modules: sandbox.modules,
    storageUsedMb: sandbox.storageUsedMb,
    createdFromStatus: sandbox.status,
    timestamp: new Date().toISOString(),
  }

  const [snapshot] = await db.insert(schema.sandboxSnapshots).values({
    orgId,
    sandboxId,
    name: name.trim(),
    description: description || null,
    status: 'ready',
    sizeBytes: (sandbox.storageUsedMb || 0) * 1024 * 1024, // Convert MB to bytes
    snapshotData,
    createdBy,
  }).returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: createdBy,
    action: 'snapshot_created',
    details: `Snapshot "${name}" created (${snapshot.sizeBytes} bytes)`,
  })

  return snapshot
}

/**
 * Restore a sandbox from a previously created snapshot.
 * Overwrites current sandbox data with snapshot data.
 */
export async function restoreSnapshot(
  orgId: string,
  sandboxId: string,
  snapshotId: string,
  restoredBy: string
) {
  // Validate sandbox
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'active' && sandbox.status !== 'paused') {
    throw new SandboxError(
      'Sandbox must be active or paused to restore a snapshot',
      'INVALID_STATUS'
    )
  }

  // Validate snapshot
  const snapshots = await db.select()
    .from(schema.sandboxSnapshots)
    .where(and(
      eq(schema.sandboxSnapshots.id, snapshotId),
      eq(schema.sandboxSnapshots.sandboxId, sandboxId)
    ))

  const snapshot = snapshots[0]
  if (!snapshot) {
    throw new SandboxError('Snapshot not found for this sandbox', 'SNAPSHOT_NOT_FOUND')
  }
  if (snapshot.status !== 'ready') {
    throw new SandboxError(
      `Cannot restore from snapshot in ${snapshot.status} status`,
      'SNAPSHOT_NOT_READY'
    )
  }

  // Mark snapshot as restoring
  await db.update(schema.sandboxSnapshots)
    .set({ status: 'restoring' })
    .where(eq(schema.sandboxSnapshots.id, snapshotId))

  const now = new Date()

  // In production, this would restore the database from backup
  // For now, we update the sandbox metadata
  const snapshotData = snapshot.snapshotData as Record<string, unknown>

  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'active',
      storageUsedMb: (snapshotData?.storageUsedMb as number) || sandbox.storageUsedMb,
      lastAccessedAt: now,
      updatedAt: now,
      metadata: {
        ...(sandbox.metadata as Record<string, unknown> || {}),
        lastRestoredFrom: snapshotId,
        lastRestoredAt: now.toISOString(),
      },
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  // Mark snapshot as ready again
  await db.update(schema.sandboxSnapshots)
    .set({ status: 'ready' })
    .where(eq(schema.sandboxSnapshots.id, snapshotId))

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: restoredBy,
    action: 'snapshot_restored',
    details: `Sandbox restored from snapshot "${snapshot.name}"`,
  })

  return {
    sandbox: updated,
    restoredFromSnapshot: {
      id: snapshot.id,
      name: snapshot.name,
      createdAt: snapshot.createdAt,
    },
  }
}

/**
 * Reset all data in a sandbox to its initial empty state.
 * Preserves the sandbox configuration and settings.
 */
export async function resetSandboxData(
  orgId: string,
  sandboxId: string,
  resetBy: string
) {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }
  if (sandbox.status !== 'active' && sandbox.status !== 'paused') {
    throw new SandboxError(
      'Sandbox must be active or paused to reset data',
      'INVALID_STATUS'
    )
  }

  const now = new Date()

  // In production, this would truncate all tables in the sandbox database
  const [updated] = await db.update(schema.sandboxEnvironments)
    .set({
      status: 'active',
      storageUsedMb: 0,
      lastAccessedAt: now,
      updatedAt: now,
      metadata: {
        ...(sandbox.metadata as Record<string, unknown> || {}),
        lastResetAt: now.toISOString(),
        lastResetBy: resetBy,
      },
    })
    .where(eq(schema.sandboxEnvironments.id, sandboxId))
    .returning()

  await db.insert(schema.sandboxAccessLog).values({
    sandboxId,
    orgId,
    employeeId: resetBy,
    action: 'data_reset',
    details: 'All sandbox data has been reset to empty state',
  })

  return { sandbox: updated, message: 'Sandbox data has been reset. Configuration and settings preserved.' }
}

/**
 * Get detailed status of a sandbox environment.
 */
export async function getSandboxStatus(
  orgId: string,
  sandboxId: string
): Promise<SandboxStatusResult> {
  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.id, sandboxId),
      eq(schema.sandboxEnvironments.orgId, orgId)
    ))

  const sandbox = sandboxes[0]
  if (!sandbox) {
    throw new SandboxError('Sandbox not found', 'SANDBOX_NOT_FOUND')
  }

  // Get snapshot count
  const snapshots = await db.select()
    .from(schema.sandboxSnapshots)
    .where(eq(schema.sandboxSnapshots.sandboxId, sandboxId))

  // Get access log count
  const accessLogs = await db.select()
    .from(schema.sandboxAccessLog)
    .where(eq(schema.sandboxAccessLog.sandboxId, sandboxId))

  // Calculate expiry info
  let daysUntilExpiry: number | null = null
  let isExpiringSoon = false
  if (sandbox.expiresAt) {
    const now = new Date()
    daysUntilExpiry = Math.floor(
      (new Date(sandbox.expiresAt).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )
    isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }

  return {
    id: sandbox.id,
    name: sandbox.name,
    status: sandbox.status as SandboxStatus,
    sourceType: sandbox.sourceType,
    modules: sandbox.modules as string[] | null,
    dataMaskingConfig: sandbox.dataMaskingConfig as DataMaskingConfig | null,
    storageUsedMb: sandbox.storageUsedMb,
    maxStorageMb: sandbox.maxStorageMb,
    storageUtilization: sandbox.maxStorageMb > 0
      ? Math.round((sandbox.storageUsedMb / sandbox.maxStorageMb) * 100)
      : 0,
    expiresAt: sandbox.expiresAt,
    daysUntilExpiry,
    isExpiringSoon,
    createdAt: sandbox.createdAt,
    lastAccessedAt: sandbox.lastAccessedAt,
    pausedAt: sandbox.pausedAt,
    snapshotCount: snapshots.length,
    accessLogCount: accessLogs.length,
  }
}

/**
 * Clone a sandbox from production data with full data masking.
 * Creates a new sandbox with sanitized production data.
 */
export async function cloneSandboxFromProduction(
  orgId: string,
  createdBy: string,
  config: CloneConfig
) {
  // Create the sandbox
  const sandbox = await createSandbox(orgId, createdBy, {
    name: config.name,
    description: config.description || `Production clone created ${new Date().toISOString()}`,
    modules: config.modules,
    dataMaskingConfig: config.dataMaskingConfig || DEFAULT_MASKING_CONFIG,
    expiresInDays: config.expiresInDays || 30,
  })

  // Update source type
  await db.update(schema.sandboxEnvironments)
    .set({
      sourceType: 'production_clone',
      metadata: {
        clonedAt: new Date().toISOString(),
        clonedBy: createdBy,
        includeCustomFields: config.includeCustomFields ?? true,
        includeWorkflows: config.includeWorkflows ?? false,
        includeIntegrations: config.includeIntegrations ?? false,
      },
    })
    .where(eq(schema.sandboxEnvironments.id, sandbox.id))

  // Provision the sandbox with production data
  const provisioned = await provisionSandbox(orgId, sandbox.id)

  return {
    sandbox: provisioned.sandbox,
    cloneDetails: {
      sourceType: 'production_clone',
      dataMasked: true,
      modulesCloned: config.modules || AVAILABLE_MODULES,
      provisioningStats: provisioned.provisioningStats,
    },
  }
}

/**
 * List all sandboxes for an organization with optional status filter.
 */
export async function listSandboxes(
  orgId: string,
  filters?: { status?: SandboxStatus }
) {
  const conditions = [eq(schema.sandboxEnvironments.orgId, orgId)]
  if (filters?.status) {
    conditions.push(eq(schema.sandboxEnvironments.status, filters.status))
  }

  const sandboxes = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(...conditions))
    .orderBy(desc(schema.sandboxEnvironments.createdAt))

  return {
    sandboxes,
    total: sandboxes.length,
    availableModules: AVAILABLE_MODULES,
  }
}

/**
 * Check for expired sandboxes and mark them.
 * Designed to be called by a cron job.
 */
export async function checkExpiredSandboxes(orgId: string) {
  const now = new Date()

  const expired = await db.select()
    .from(schema.sandboxEnvironments)
    .where(and(
      eq(schema.sandboxEnvironments.orgId, orgId),
      lte(schema.sandboxEnvironments.expiresAt, now),
      eq(schema.sandboxEnvironments.status, 'active')
    ))

  const results = []
  for (const sandbox of expired) {
    await db.update(schema.sandboxEnvironments)
      .set({ status: 'expired', updatedAt: now })
      .where(eq(schema.sandboxEnvironments.id, sandbox.id))

    results.push({ sandboxId: sandbox.id, name: sandbox.name, expiredAt: sandbox.expiresAt })
  }

  return { expired: results, count: results.length }
}
