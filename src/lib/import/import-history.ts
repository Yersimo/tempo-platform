/**
 * Import History & Rollback
 *
 * Tracks all imports with the ability to review and undo.
 * Works with both DB-backed and in-memory (demo) modes.
 */

export interface ImportError {
  row: number
  field: string
  message: string
}

export interface ImportRecord {
  id: string
  orgId: string
  entityType: string
  source: string // 'csv', 'xlsx', 'json', 'paste', 'gusto', 'deel', 'rippling', 'bamboohr', 'workday', 'sap'
  fileName?: string
  totalRows: number
  importedRows: number
  errorRows: number
  importedIds: string[] // IDs of created records (for rollback)
  status: 'completed' | 'partial' | 'failed' | 'rolled_back'
  importedBy: string
  importedAt: string
  errors?: ImportError[]
}

// ============================================================
// In-Memory Store (for client-side / demo mode)
// ============================================================

let importRecords: ImportRecord[] = []

export function getImportHistory(orgId?: string): ImportRecord[] {
  if (orgId) {
    return importRecords.filter(r => r.orgId === orgId).sort((a, b) =>
      new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
    )
  }
  return [...importRecords].sort((a, b) =>
    new Date(b.importedAt).getTime() - new Date(a.importedAt).getTime()
  )
}

export function addImportRecord(record: Omit<ImportRecord, 'id' | 'importedAt'>): ImportRecord {
  const newRecord: ImportRecord = {
    ...record,
    id: crypto.randomUUID(),
    importedAt: new Date().toISOString(),
  }
  importRecords = [newRecord, ...importRecords]
  return newRecord
}

export function updateImportStatus(id: string, status: ImportRecord['status']): void {
  importRecords = importRecords.map(r =>
    r.id === id ? { ...r, status } : r
  )
}

export function getImportRecord(id: string): ImportRecord | undefined {
  return importRecords.find(r => r.id === id)
}

// ============================================================
// Rollback Support
// ============================================================

export function canRollback(record: ImportRecord): boolean {
  return (
    record.status === 'completed' || record.status === 'partial'
  ) && record.importedIds.length > 0
}

/**
 * Mark an import as rolled back. In production, the API route
 * handler would delete the imported records from the database.
 */
export function rollbackImport(id: string): { success: boolean; error?: string } {
  const record = importRecords.find(r => r.id === id)
  if (!record) {
    return { success: false, error: 'Import record not found' }
  }
  if (!canRollback(record)) {
    return { success: false, error: 'This import cannot be rolled back' }
  }

  updateImportStatus(id, 'rolled_back')
  return { success: true }
}

// ============================================================
// Stats
// ============================================================

export function getImportStats(orgId: string): {
  totalImports: number
  totalRecordsImported: number
  totalErrors: number
  lastImportDate: string | null
  bySource: Record<string, number>
  byEntity: Record<string, number>
} {
  const records = getImportHistory(orgId)
  const bySource: Record<string, number> = {}
  const byEntity: Record<string, number> = {}

  let totalRecords = 0
  let totalErrors = 0

  for (const r of records) {
    totalRecords += r.importedRows
    totalErrors += r.errorRows
    bySource[r.source] = (bySource[r.source] || 0) + 1
    byEntity[r.entityType] = (byEntity[r.entityType] || 0) + 1
  }

  return {
    totalImports: records.length,
    totalRecordsImported: totalRecords,
    totalErrors,
    lastImportDate: records[0]?.importedAt || null,
    bySource,
    byEntity,
  }
}

// ============================================================
// Serialization (for API transport)
// ============================================================

export function serializeImportRecord(record: ImportRecord): Record<string, unknown> {
  return {
    ...record,
    importedIds: JSON.stringify(record.importedIds),
    errors: record.errors ? JSON.stringify(record.errors) : null,
  }
}

export function deserializeImportRecord(raw: Record<string, unknown>): ImportRecord {
  return {
    id: String(raw.id || ''),
    orgId: String(raw.orgId || raw.org_id || ''),
    entityType: String(raw.entityType || raw.entity_type || ''),
    source: String(raw.source || ''),
    fileName: raw.fileName as string || raw.file_name as string || undefined,
    totalRows: Number(raw.totalRows || raw.total_rows || 0),
    importedRows: Number(raw.importedRows || raw.imported_rows || 0),
    errorRows: Number(raw.errorRows || raw.error_rows || 0),
    importedIds: typeof raw.importedIds === 'string'
      ? JSON.parse(raw.importedIds || '[]')
      : (raw.imported_ids ? JSON.parse(String(raw.imported_ids)) : []),
    status: String(raw.status || 'completed') as ImportRecord['status'],
    importedBy: String(raw.importedBy || raw.imported_by || ''),
    importedAt: String(raw.importedAt || raw.created_at || new Date().toISOString()),
    errors: typeof raw.errors === 'string' && raw.errors
      ? JSON.parse(raw.errors)
      : undefined,
  }
}
