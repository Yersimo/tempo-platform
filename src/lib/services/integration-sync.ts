// ============================================================
// Integration Sync Engine - Generic bidirectional sync for all connectors
// ============================================================

import type { IntegrationConnector } from '../integrations/index'

// ---------------------------------------------------------------------------
// Core Types
// ---------------------------------------------------------------------------

export interface SyncConfig {
  connectorId: string
  orgId: string
  direction: 'inbound' | 'outbound' | 'bidirectional'
  entities: SyncEntityConfig[]
  schedule: 'realtime' | '5min' | '15min' | 'hourly' | 'daily'
  conflictResolution: 'source_wins' | 'target_wins' | 'newest_wins' | 'manual'
  lastSyncAt?: string
  webhookUrl?: string
}

export interface SyncEntityConfig {
  sourceEntity: string   // e.g., 'employees' in Tempo
  targetEntity: string   // e.g., 'Workers' in Workday
  fieldMapping: FieldMapping[]
  filterRules?: FilterRule[]
  transformRules?: TransformRule[]
}

export interface FieldMapping {
  sourceField: string
  targetField: string
  direction: 'inbound' | 'outbound' | 'bidirectional'
  transform?: 'uppercase' | 'lowercase' | 'date_iso' | 'cents_to_dollars' | 'dollars_to_cents' | 'boolean_to_string' | 'custom'
  customTransform?: string  // function name for custom transforms
  required: boolean
  defaultValue?: unknown
}

export interface FilterRule {
  field: string
  operator: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'in' | 'not_in' | 'exists'
  value: unknown
}

export interface TransformRule {
  type: 'rename' | 'compute' | 'concatenate' | 'split' | 'lookup' | 'default'
  sourceFields: string[]
  targetField: string
  expression?: string
  lookupTable?: Record<string, unknown>
}

export interface SyncError {
  recordId: string
  entity: string
  field?: string
  message: string
  code: 'VALIDATION' | 'TRANSFORM' | 'API_ERROR' | 'CONFLICT' | 'PERMISSION' | 'RATE_LIMIT' | 'TIMEOUT' | 'UNKNOWN'
  timestamp: string
  retryable: boolean
}

export interface SyncConflict {
  recordId: string
  entity: string
  field: string
  tempoValue: unknown
  externalValue: unknown
  tempoUpdatedAt: string
  externalUpdatedAt: string
  resolution?: 'tempo_wins' | 'external_wins' | 'manual'
  resolvedValue?: unknown
}

export interface SyncResult {
  connector: string
  direction: string
  startedAt: string
  completedAt: string
  recordsSynced: number
  recordsCreated: number
  recordsUpdated: number
  recordsSkipped: number
  recordsFailed: number
  errors: SyncError[]
  conflicts: SyncConflict[]
  entityResults: EntitySyncResult[]
}

export interface EntitySyncResult {
  entity: string
  direction: string
  created: number
  updated: number
  skipped: number
  failed: number
  errors: SyncError[]
}

export interface ChangeRecord {
  id: string
  entity: string
  action: 'create' | 'update' | 'delete'
  data: Record<string, unknown>
  updatedAt: string
  source: 'tempo' | 'external'
}

// ---------------------------------------------------------------------------
// Sync Log Storage (in-memory for demo, DB-backed in production)
// ---------------------------------------------------------------------------

const syncLogs: SyncResult[] = []

export function getSyncLogs(connectorId?: string, limit = 50): SyncResult[] {
  const filtered = connectorId
    ? syncLogs.filter(l => l.connector === connectorId)
    : syncLogs
  return filtered.slice(-limit).reverse()
}

export function addSyncLog(result: SyncResult): void {
  syncLogs.push(result)
  // Keep only last 500 logs in memory
  if (syncLogs.length > 500) {
    syncLogs.splice(0, syncLogs.length - 500)
  }
}

// ---------------------------------------------------------------------------
// Field Transform Engine
// ---------------------------------------------------------------------------

export function applyFieldTransform(value: unknown, transform: FieldMapping['transform']): unknown {
  if (value === null || value === undefined) return value

  switch (transform) {
    case 'uppercase':
      return typeof value === 'string' ? value.toUpperCase() : value
    case 'lowercase':
      return typeof value === 'string' ? value.toLowerCase() : value
    case 'date_iso':
      try {
        return new Date(String(value)).toISOString()
      } catch {
        return value
      }
    case 'cents_to_dollars':
      return typeof value === 'number' ? value / 100 : value
    case 'dollars_to_cents':
      return typeof value === 'number' ? Math.round(value * 100) : value
    case 'boolean_to_string':
      return typeof value === 'boolean' ? (value ? 'true' : 'false') : value
    default:
      return value
  }
}

export function applyFieldMappings(
  record: Record<string, unknown>,
  mappings: FieldMapping[],
  direction: 'inbound' | 'outbound'
): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const mapping of mappings) {
    // Skip mappings that don't apply to this direction
    if (mapping.direction !== 'bidirectional' && mapping.direction !== direction) continue

    const sourceKey = direction === 'inbound' ? mapping.targetField : mapping.sourceField
    const targetKey = direction === 'inbound' ? mapping.sourceField : mapping.targetField

    let value = getNestedValue(record, sourceKey)

    if (value === undefined || value === null) {
      if (mapping.required && mapping.defaultValue !== undefined) {
        value = mapping.defaultValue
      } else if (value === undefined) {
        continue
      }
    }

    if (mapping.transform) {
      value = applyFieldTransform(value, mapping.transform)
    }

    setNestedValue(result, targetKey, value)
  }

  return result
}

// ---------------------------------------------------------------------------
// Filter Engine
// ---------------------------------------------------------------------------

export function applyFilterRules(record: Record<string, unknown>, rules: FilterRule[]): boolean {
  for (const rule of rules) {
    const value = getNestedValue(record, rule.field)

    switch (rule.operator) {
      case 'eq':
        if (value !== rule.value) return false
        break
      case 'neq':
        if (value === rule.value) return false
        break
      case 'gt':
        if (typeof value !== 'number' || value <= (rule.value as number)) return false
        break
      case 'lt':
        if (typeof value !== 'number' || value >= (rule.value as number)) return false
        break
      case 'gte':
        if (typeof value !== 'number' || value < (rule.value as number)) return false
        break
      case 'lte':
        if (typeof value !== 'number' || value > (rule.value as number)) return false
        break
      case 'contains':
        if (typeof value !== 'string' || !value.includes(String(rule.value))) return false
        break
      case 'in':
        if (!Array.isArray(rule.value) || !rule.value.includes(value)) return false
        break
      case 'not_in':
        if (!Array.isArray(rule.value) || rule.value.includes(value)) return false
        break
      case 'exists':
        if ((value !== null && value !== undefined) !== rule.value) return false
        break
    }
  }
  return true
}

// ---------------------------------------------------------------------------
// Conflict Detection & Resolution
// ---------------------------------------------------------------------------

export function detectConflicts(
  tempoChanges: ChangeRecord[],
  externalChanges: ChangeRecord[],
  keyField: string
): SyncConflict[] {
  const conflicts: SyncConflict[] = []
  const externalMap = new Map<string, ChangeRecord>()

  for (const ext of externalChanges) {
    const key = String(getNestedValue(ext.data, keyField) ?? ext.id)
    externalMap.set(key, ext)
  }

  for (const tempo of tempoChanges) {
    const key = String(getNestedValue(tempo.data, keyField) ?? tempo.id)
    const ext = externalMap.get(key)

    if (!ext) continue // No conflict - only changed in Tempo

    // Same record changed in both systems
    const tempoFields = Object.keys(tempo.data)
    const extFields = Object.keys(ext.data)
    const overlapping = tempoFields.filter(f => extFields.includes(f))

    for (const field of overlapping) {
      if (tempo.data[field] !== ext.data[field]) {
        conflicts.push({
          recordId: key,
          entity: tempo.entity,
          field,
          tempoValue: tempo.data[field],
          externalValue: ext.data[field],
          tempoUpdatedAt: tempo.updatedAt,
          externalUpdatedAt: ext.updatedAt,
        })
      }
    }
  }

  return conflicts
}

export function resolveConflict(
  conflict: SyncConflict,
  strategy: SyncConfig['conflictResolution']
): unknown {
  switch (strategy) {
    case 'source_wins':
      conflict.resolution = 'external_wins'
      conflict.resolvedValue = conflict.externalValue
      return conflict.externalValue

    case 'target_wins':
      conflict.resolution = 'tempo_wins'
      conflict.resolvedValue = conflict.tempoValue
      return conflict.tempoValue

    case 'newest_wins': {
      const tempoTime = new Date(conflict.tempoUpdatedAt).getTime()
      const extTime = new Date(conflict.externalUpdatedAt).getTime()
      if (tempoTime >= extTime) {
        conflict.resolution = 'tempo_wins'
        conflict.resolvedValue = conflict.tempoValue
        return conflict.tempoValue
      } else {
        conflict.resolution = 'external_wins'
        conflict.resolvedValue = conflict.externalValue
        return conflict.externalValue
      }
    }

    case 'manual':
      conflict.resolution = 'manual'
      return undefined // Requires manual intervention
  }
}

// ---------------------------------------------------------------------------
// Bidirectional Sync Executor
// ---------------------------------------------------------------------------

export async function executeBidirectionalSync(
  config: SyncConfig,
  connector: IntegrationConnector,
  fetchExternalChanges: (since?: string) => Promise<ChangeRecord[]>,
  fetchTempoChanges: (since?: string) => Promise<ChangeRecord[]>,
  pushToExternal: (records: ChangeRecord[]) => Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }>,
  pushToTempo: (records: ChangeRecord[]) => Promise<{ success: string[]; failed: Array<{ id: string; error: string }> }>
): Promise<SyncResult> {
  const startedAt = new Date().toISOString()
  const errors: SyncError[] = []
  const allConflicts: SyncConflict[] = []
  const entityResults: EntitySyncResult[] = []
  let totalCreated = 0
  let totalUpdated = 0
  let totalSkipped = 0
  let totalFailed = 0

  try {
    // Step 1: Pull changes from external system since lastSyncAt
    const externalChanges = await fetchExternalChanges(config.lastSyncAt)

    // Step 2: Pull changes from Tempo since lastSyncAt
    const tempoChanges = await fetchTempoChanges(config.lastSyncAt)

    // Process each entity config
    for (const entityConfig of config.entities) {
      const entityErrors: SyncError[] = []
      let created = 0
      let updated = 0
      let skipped = 0
      let failed = 0

      // Filter changes for this entity
      const entityExtChanges = externalChanges.filter(c => c.entity === entityConfig.targetEntity)
      const entityTempoChanges = tempoChanges.filter(c => c.entity === entityConfig.sourceEntity)

      // Step 3: Detect conflicts (same record changed in both)
      if (config.direction === 'bidirectional') {
        const conflicts = detectConflicts(entityTempoChanges, entityExtChanges, 'id')

        // Step 4: Apply conflict resolution strategy
        for (const conflict of conflicts) {
          resolveConflict(conflict, config.conflictResolution)
          allConflicts.push(conflict)
        }
      }

      // Step 5: Apply field mappings and filter rules
      const mappedInbound: ChangeRecord[] = []
      const mappedOutbound: ChangeRecord[] = []

      if (config.direction === 'inbound' || config.direction === 'bidirectional') {
        for (const change of entityExtChanges) {
          if (entityConfig.filterRules && !applyFilterRules(change.data, entityConfig.filterRules)) {
            skipped++
            continue
          }

          const mappedData = applyFieldMappings(change.data, entityConfig.fieldMapping, 'inbound')
          mappedInbound.push({ ...change, data: mappedData, entity: entityConfig.sourceEntity })
        }
      }

      if (config.direction === 'outbound' || config.direction === 'bidirectional') {
        for (const change of entityTempoChanges) {
          if (entityConfig.filterRules && !applyFilterRules(change.data, entityConfig.filterRules)) {
            skipped++
            continue
          }

          const mappedData = applyFieldMappings(change.data, entityConfig.fieldMapping, 'outbound')
          mappedOutbound.push({ ...change, data: mappedData, entity: entityConfig.targetEntity })
        }
      }

      // Step 6: Push changes
      if (mappedOutbound.length > 0) {
        const outResult = await pushToExternal(mappedOutbound)
        created += outResult.success.filter((_, i) => mappedOutbound[i]?.action === 'create').length
        updated += outResult.success.filter((_, i) => mappedOutbound[i]?.action === 'update').length
        failed += outResult.failed.length

        for (const f of outResult.failed) {
          entityErrors.push({
            recordId: f.id,
            entity: entityConfig.targetEntity,
            message: f.error,
            code: 'API_ERROR',
            timestamp: new Date().toISOString(),
            retryable: true,
          })
        }
      }

      if (mappedInbound.length > 0) {
        const inResult = await pushToTempo(mappedInbound)
        created += inResult.success.filter((_, i) => mappedInbound[i]?.action === 'create').length
        updated += inResult.success.filter((_, i) => mappedInbound[i]?.action === 'update').length
        failed += inResult.failed.length

        for (const f of inResult.failed) {
          entityErrors.push({
            recordId: f.id,
            entity: entityConfig.sourceEntity,
            message: f.error,
            code: 'API_ERROR',
            timestamp: new Date().toISOString(),
            retryable: true,
          })
        }
      }

      totalCreated += created
      totalUpdated += updated
      totalSkipped += skipped
      totalFailed += failed
      errors.push(...entityErrors)

      entityResults.push({
        entity: entityConfig.sourceEntity,
        direction: config.direction,
        created,
        updated,
        skipped,
        failed,
        errors: entityErrors,
      })
    }
  } catch (err) {
    errors.push({
      recordId: '',
      entity: '',
      message: err instanceof Error ? err.message : 'Unknown sync error',
      code: 'UNKNOWN',
      timestamp: new Date().toISOString(),
      retryable: true,
    })
  }

  const result: SyncResult = {
    connector: config.connectorId,
    direction: config.direction,
    startedAt,
    completedAt: new Date().toISOString(),
    recordsSynced: totalCreated + totalUpdated,
    recordsCreated: totalCreated,
    recordsUpdated: totalUpdated,
    recordsSkipped: totalSkipped,
    recordsFailed: totalFailed,
    errors,
    conflicts: allConflicts,
    entityResults,
  }

  // Step 7: Log results
  addSyncLog(result)

  return result
}

// ---------------------------------------------------------------------------
// Demo Mode Sync (when no real credentials are provided)
// ---------------------------------------------------------------------------

export async function executeDemoSync(
  connectorId: string,
  direction: 'inbound' | 'outbound' | 'bidirectional',
  entities: string[]
): Promise<SyncResult> {
  const startedAt = new Date().toISOString()

  // Simulate processing time
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))

  const created = Math.floor(Math.random() * 20) + 5
  const updated = Math.floor(Math.random() * 30) + 10
  const skipped = Math.floor(Math.random() * 5)

  const result: SyncResult = {
    connector: connectorId,
    direction,
    startedAt,
    completedAt: new Date().toISOString(),
    recordsSynced: created + updated,
    recordsCreated: created,
    recordsUpdated: updated,
    recordsSkipped: skipped,
    recordsFailed: 0,
    errors: [],
    conflicts: [],
    entityResults: entities.map(entity => ({
      entity,
      direction,
      created: Math.floor(created / entities.length),
      updated: Math.floor(updated / entities.length),
      skipped: Math.floor(skipped / entities.length),
      failed: 0,
      errors: [],
    })),
  }

  addSyncLog(result)
  return result
}

// ---------------------------------------------------------------------------
// Retry Logic
// ---------------------------------------------------------------------------

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))

      // Don't retry non-retryable errors
      if (lastError.message.includes('401') || lastError.message.includes('403')) {
        throw lastError
      }

      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  throw lastError!
}

// ---------------------------------------------------------------------------
// Webhook Signature Verification
// ---------------------------------------------------------------------------

export async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha1' = 'sha256'
): Promise<boolean> {
  try {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: algorithm === 'sha256' ? 'SHA-256' : 'SHA-1' },
      false,
      ['sign']
    )

    const signatureBuffer = await crypto.subtle.sign('HMAC', key, encoder.encode(payload))
    const computed = Array.from(new Uint8Array(signatureBuffer))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')

    // Constant-time comparison
    const sigHex = signature.replace(/^(sha256=|sha1=)/, '')
    if (computed.length !== sigHex.length) return false

    let mismatch = 0
    for (let i = 0; i < computed.length; i++) {
      mismatch |= computed.charCodeAt(i) ^ sigHex.charCodeAt(i)
    }
    return mismatch === 0
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Default Field Mapping Presets
// ---------------------------------------------------------------------------

export const DEFAULT_FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  'employees-basic': [
    { sourceField: 'profile.full_name', targetField: 'fullName', direction: 'bidirectional', required: true },
    { sourceField: 'profile.email', targetField: 'email', direction: 'bidirectional', required: true },
    { sourceField: 'profile.phone', targetField: 'phone', direction: 'bidirectional', required: false },
    { sourceField: 'job_title', targetField: 'jobTitle', direction: 'bidirectional', required: false },
    { sourceField: 'department_id', targetField: 'department', direction: 'bidirectional', required: false },
    { sourceField: 'country', targetField: 'country', direction: 'bidirectional', required: false },
    { sourceField: 'level', targetField: 'level', direction: 'outbound', required: false },
  ],
  'invoices': [
    { sourceField: 'invoice_number', targetField: 'InvoiceNumber', direction: 'bidirectional', required: true },
    { sourceField: 'amount', targetField: 'Total', direction: 'bidirectional', transform: 'cents_to_dollars', required: true },
    { sourceField: 'due_date', targetField: 'DueDate', direction: 'bidirectional', transform: 'date_iso', required: true },
    { sourceField: 'status', targetField: 'Status', direction: 'bidirectional', required: true },
    { sourceField: 'vendor_id', targetField: 'VendorRef', direction: 'outbound', required: false },
  ],
  'payroll': [
    { sourceField: 'employee_id', targetField: 'workerId', direction: 'outbound', required: true },
    { sourceField: 'gross_amount', targetField: 'grossPay', direction: 'outbound', transform: 'cents_to_dollars', required: true },
    { sourceField: 'net_amount', targetField: 'netPay', direction: 'outbound', transform: 'cents_to_dollars', required: true },
    { sourceField: 'period_start', targetField: 'payPeriodStart', direction: 'outbound', transform: 'date_iso', required: true },
    { sourceField: 'period_end', targetField: 'payPeriodEnd', direction: 'outbound', transform: 'date_iso', required: true },
  ],
  'leave-requests': [
    { sourceField: 'employee_id', targetField: 'employeeId', direction: 'bidirectional', required: true },
    { sourceField: 'leave_type', targetField: 'timeOffType', direction: 'bidirectional', required: true },
    { sourceField: 'start_date', targetField: 'startDate', direction: 'bidirectional', transform: 'date_iso', required: true },
    { sourceField: 'end_date', targetField: 'endDate', direction: 'bidirectional', transform: 'date_iso', required: true },
    { sourceField: 'status', targetField: 'status', direction: 'bidirectional', required: true },
  ],
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.')
  let current: unknown = obj
  for (const part of parts) {
    if (current === null || current === undefined || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let current = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (!(parts[i] in current) || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {}
    }
    current = current[parts[i]] as Record<string, unknown>
  }
  current[parts[parts.length - 1]] = value
}
