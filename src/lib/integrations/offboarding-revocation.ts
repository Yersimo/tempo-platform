// ============================================================
// Offboarding → Automated Revocation Integration
// Cross-module revocation engine for employee offboarding:
//   - Devices (IT) → mark pending_return
//   - App Assignments (IT Apps) → mark for deprovisioning
//   - Software Licenses → decrement used count
//   - Identity/SSO (SAML apps) → flag for access removal
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Any record shape used across the Tempo store */
type AnyRecord = Record<string, any>

/** Individual revocation action with tracking */
export interface RevocationAction {
  id: string
  category: 'device' | 'app' | 'license' | 'access' | 'data'
  entityId: string
  entityLabel: string
  description: string
  status: 'pending' | 'completed' | 'failed' | 'skipped'
  /** ISO timestamp of when the action was executed or last updated */
  timestamp: string
  /** Optional error message if status is 'failed' */
  error?: string
  /** Additional metadata for downstream consumers */
  metadata?: Record<string, unknown>
}

/** Summary returned after executing auto-revocation */
export interface RevocationSummary {
  employeeId: string
  offboardingProcessId: string
  totalActions: number
  completedActions: number
  failedActions: number
  skippedActions: number
  actions: RevocationAction[]
  executedAt: string
}

/** Categorised checklist for pre-revocation review */
export interface RevocationChecklist {
  employeeId: string
  generatedAt: string
  categories: {
    devices: RevocationChecklistItem[]
    apps: RevocationChecklistItem[]
    access: RevocationChecklistItem[]
    data: RevocationChecklistItem[]
  }
  totalItems: number
}

export interface RevocationChecklistItem {
  entityId: string
  label: string
  description: string
  category: 'device' | 'app' | 'access' | 'data'
  priority: 'critical' | 'high' | 'medium' | 'low'
  /** Whether this item can be auto-revoked or needs manual action */
  autoRevocable: boolean
}

/** Status report for an in-progress revocation */
export interface RevocationStatusReport {
  offboardingProcessId: string
  tasks: RevocationTaskStatus[]
  completionPercentage: number
  summary: {
    total: number
    completed: number
    pending: number
    inProgress: number
    failed: number
    skipped: number
  }
}

export interface RevocationTaskStatus {
  taskId: string
  category: string
  description: string
  status: 'pending' | 'in_progress' | 'completed' | 'skipped' | 'failed'
  assigneeId: string | null
  completedAt: string | null
  notes: string | null
}

// ---------------------------------------------------------------------------
// Store interface — mirrors the subset of useTempo() this module needs
// ---------------------------------------------------------------------------

export interface OffboardingStoreSlice {
  // Data arrays
  employees: AnyRecord[]
  devices: AnyRecord[]
  softwareLicenses: AnyRecord[]
  appCatalog: AnyRecord[]
  appAssignments: AnyRecord[]
  samlApps: AnyRecord[]
  idpConfigurations: AnyRecord[]
  offboardingProcesses: AnyRecord[]
  offboardingTasks: AnyRecord[]

  // Mutators
  updateDevice: (id: string, data: AnyRecord) => void
  updateSoftwareLicense: (id: string, data: AnyRecord) => void
  updateAppAssignment: (id: string, data: AnyRecord) => void
  addOffboardingTask: (data: AnyRecord) => void
  updateOffboardingTask: (id: string, data: AnyRecord) => void
  updateOffboardingProcess: (id: string, data: AnyRecord) => void

  // Helpers
  getEmployeeName: (id: string) => string
  addToast: (message: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function genId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`
}

function now(): string {
  return new Date().toISOString()
}

/** Build a human-readable device label from a device record */
function deviceLabel(device: AnyRecord): string {
  const parts = [device.brand, device.model].filter(Boolean)
  if (parts.length === 0) return device.type ?? 'Unknown device'
  return parts.join(' ')
}

// ---------------------------------------------------------------------------
// 1. executeAutoRevocation
// ---------------------------------------------------------------------------

/**
 * Executes automated revocation for a departing employee.
 *
 * - Marks all assigned devices as `pending_return`
 * - Marks all app assignments as `removed`
 * - Decrements used license counts on software licenses tied to removed apps
 * - Creates offboarding tasks for each revocation action
 * - Returns a structured summary of all actions taken
 */
export function executeAutoRevocation(
  employeeId: string,
  offboardingProcessId: string,
  store: OffboardingStoreSlice,
): RevocationSummary {
  const actions: RevocationAction[] = []
  const timestamp = now()
  const employeeName = store.getEmployeeName(employeeId)

  // ── Devices ──────────────────────────────────────────────────
  const assignedDevices = store.devices.filter(
    (d) => d.assigned_to === employeeId && d.status === 'assigned',
  )

  for (const device of assignedDevices) {
    const label = deviceLabel(device)
    try {
      store.updateDevice(device.id, { status: 'pending_return' as any })

      store.addOffboardingTask({
        process_id: offboardingProcessId,
        checklist_item_id: null,
        assignee_id: null,
        status: 'pending',
        notes: `Auto-revocation: Device "${label}" (S/N: ${device.serial_number ?? 'N/A'}) marked pending return`,
      })

      actions.push({
        id: genId('rev-dev'),
        category: 'device',
        entityId: device.id,
        entityLabel: label,
        description: `Device "${label}" marked as pending_return`,
        status: 'completed',
        timestamp,
        metadata: { serialNumber: device.serial_number, type: device.type },
      })
    } catch (err) {
      actions.push({
        id: genId('rev-dev'),
        category: 'device',
        entityId: device.id,
        entityLabel: label,
        description: `Failed to mark device "${label}" as pending_return`,
        status: 'failed',
        timestamp,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── App Assignments ──────────────────────────────────────────
  const employeeAppAssignments = store.appAssignments.filter(
    (a) => a.employeeId === employeeId && a.status !== 'removed',
  )

  // Build a lookup for app catalog names
  const appCatalogMap = new Map<string, AnyRecord>()
  for (const app of store.appCatalog) {
    appCatalogMap.set(app.id, app)
  }

  for (const assignment of employeeAppAssignments) {
    const app = appCatalogMap.get(assignment.appId)
    const appName = app?.name ?? assignment.appId
    try {
      store.updateAppAssignment(assignment.id, { status: 'removed' })

      // Decrement the assigned count on the catalog entry where applicable
      if (app && typeof app.assignedCount === 'number' && app.assignedCount > 0) {
        // We don't have updateAppCatalogItem in our slice, so we track it via
        // the license pool below if there's a matching softwareLicense.
      }

      store.addOffboardingTask({
        process_id: offboardingProcessId,
        checklist_item_id: null,
        assignee_id: null,
        status: 'pending',
        notes: `Auto-revocation: App "${appName}" access removed for ${employeeName}`,
      })

      actions.push({
        id: genId('rev-app'),
        category: 'app',
        entityId: assignment.id,
        entityLabel: appName,
        description: `App "${appName}" assignment revoked`,
        status: 'completed',
        timestamp,
        metadata: { appId: assignment.appId, previousStatus: assignment.status },
      })
    } catch (err) {
      actions.push({
        id: genId('rev-app'),
        category: 'app',
        entityId: assignment.id,
        entityLabel: appName,
        description: `Failed to revoke app "${appName}"`,
        status: 'failed',
        timestamp,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── Software Licenses — reclaim seats ────────────────────────
  // For each removed app assignment, find the matching software license
  // by name/vendor and decrement usedLicenses
  const revokedAppNames = new Set(
    employeeAppAssignments.map((a) => appCatalogMap.get(a.appId)?.name?.toLowerCase()).filter(Boolean),
  )

  for (const license of store.softwareLicenses) {
    if (!revokedAppNames.has(license.name?.toLowerCase())) continue
    if (typeof license.usedLicenses !== 'number' || license.usedLicenses <= 0) continue

    try {
      store.updateSoftwareLicense(license.id, {
        usedLicenses: license.usedLicenses - 1,
      })

      actions.push({
        id: genId('rev-lic'),
        category: 'license',
        entityId: license.id,
        entityLabel: license.name,
        description: `License seat reclaimed for "${license.name}" (${license.usedLicenses - 1}/${license.totalLicenses} now used)`,
        status: 'completed',
        timestamp,
        metadata: { previousUsed: license.usedLicenses, vendor: license.vendor },
      })
    } catch (err) {
      actions.push({
        id: genId('rev-lic'),
        category: 'license',
        entityId: license.id,
        entityLabel: license.name,
        description: `Failed to reclaim license seat for "${license.name}"`,
        status: 'failed',
        timestamp,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  // ── Identity / SSO access ────────────────────────────────────
  // Create tasks for manual SSO deprovisioning (SAML apps, IdP configs)
  for (const samlApp of store.samlApps) {
    if (samlApp.status === 'inactive') continue

    store.addOffboardingTask({
      process_id: offboardingProcessId,
      checklist_item_id: null,
      assignee_id: null,
      status: 'pending',
      notes: `Manual action required: Remove ${employeeName} from SSO app "${samlApp.name ?? samlApp.entityId ?? 'Unknown'}"`,
    })

    actions.push({
      id: genId('rev-sso'),
      category: 'access',
      entityId: samlApp.id,
      entityLabel: samlApp.name ?? 'SSO App',
      description: `SSO access removal task created for "${samlApp.name ?? 'SSO App'}"`,
      status: 'completed',
      timestamp,
      metadata: { provider: samlApp.provider, entityId: samlApp.entityId },
    })
  }

  // ── Update process status ────────────────────────────────────
  store.updateOffboardingProcess(offboardingProcessId, {
    status: 'in_progress',
  })

  const completedCount = actions.filter((a) => a.status === 'completed').length
  const failedCount = actions.filter((a) => a.status === 'failed').length
  const skippedCount = actions.filter((a) => a.status === 'skipped').length

  store.addToast(
    `Auto-revocation complete: ${completedCount} actions executed, ${failedCount} failed`,
  )

  return {
    employeeId,
    offboardingProcessId,
    totalActions: actions.length,
    completedActions: completedCount,
    failedActions: failedCount,
    skippedActions: skippedCount,
    actions,
    executedAt: timestamp,
  }
}

// ---------------------------------------------------------------------------
// 2. generateRevocationChecklist
// ---------------------------------------------------------------------------

/**
 * Scans all modules to produce a comprehensive checklist of everything
 * that needs to be revoked for a departing employee. This is a read-only
 * preview — nothing is modified.
 */
export function generateRevocationChecklist(
  employeeId: string,
  store: OffboardingStoreSlice,
): RevocationChecklist {
  const devices: RevocationChecklistItem[] = []
  const apps: RevocationChecklistItem[] = []
  const access: RevocationChecklistItem[] = []
  const data: RevocationChecklistItem[] = []

  const employeeName = store.getEmployeeName(employeeId)

  // ── Devices ──────────────────────────────────────────────────
  const assignedDevices = store.devices.filter(
    (d) => d.assigned_to === employeeId && d.status !== 'retired',
  )

  for (const device of assignedDevices) {
    const label = deviceLabel(device)
    devices.push({
      entityId: device.id,
      label,
      description: `${label} (S/N: ${device.serial_number ?? 'N/A'}) — currently ${device.status}`,
      category: 'device',
      priority: device.type === 'laptop' || device.type === 'desktop' ? 'critical' : 'high',
      autoRevocable: true,
    })
  }

  // ── App Assignments ──────────────────────────────────────────
  const appCatalogMap = new Map<string, AnyRecord>()
  for (const app of store.appCatalog) {
    appCatalogMap.set(app.id, app)
  }

  const employeeAppAssignments = store.appAssignments.filter(
    (a) => a.employeeId === employeeId && a.status !== 'removed',
  )

  for (const assignment of employeeAppAssignments) {
    const app = appCatalogMap.get(assignment.appId)
    const appName = app?.name ?? assignment.appId
    const isSecurityApp = app?.category === 'security'

    apps.push({
      entityId: assignment.id,
      label: appName,
      description: `${appName} — ${assignment.status} (${app?.licenseType ?? 'unknown'} license)`,
      category: 'app',
      priority: isSecurityApp ? 'critical' : app?.isRequired ? 'high' : 'medium',
      autoRevocable: true,
    })
  }

  // ── Software Licenses (pool-level tracking) ──────────────────
  // Flag any licenses where name matches an assigned app so the
  // offboarding coordinator can verify seat reclamation
  const assignedAppNames = new Set(
    employeeAppAssignments
      .map((a) => appCatalogMap.get(a.appId)?.name?.toLowerCase())
      .filter(Boolean),
  )

  for (const license of store.softwareLicenses) {
    if (!assignedAppNames.has(license.name?.toLowerCase())) continue
    apps.push({
      entityId: license.id,
      label: `${license.name} license seat`,
      description: `${license.name} — ${license.usedLicenses}/${license.totalLicenses} seats used (vendor: ${license.vendor ?? 'N/A'})`,
      category: 'app',
      priority: 'medium',
      autoRevocable: true,
    })
  }

  // ── Identity / SSO ───────────────────────────────────────────
  for (const samlApp of store.samlApps) {
    if (samlApp.status === 'inactive') continue
    access.push({
      entityId: samlApp.id,
      label: samlApp.name ?? 'SSO Application',
      description: `SSO app "${samlApp.name ?? 'Unknown'}" — requires manual deprovisioning from identity provider`,
      category: 'access',
      priority: 'critical',
      autoRevocable: false,
    })
  }

  for (const idp of store.idpConfigurations) {
    if (idp.status === 'inactive') continue
    access.push({
      entityId: idp.id,
      label: `IdP: ${idp.name ?? idp.provider ?? 'Unknown'}`,
      description: `Identity provider "${idp.name ?? idp.provider ?? 'Unknown'}" — remove ${employeeName} from directory`,
      category: 'access',
      priority: 'critical',
      autoRevocable: false,
    })
  }

  // ── Data handover items ──────────────────────────────────────
  // These are generic checklist items that always apply
  data.push(
    {
      entityId: `data-email-${employeeId}`,
      label: 'Email account',
      description: `Disable or delegate ${employeeName}'s email account and set up auto-reply`,
      category: 'data',
      priority: 'critical',
      autoRevocable: false,
    },
    {
      entityId: `data-files-${employeeId}`,
      label: 'Shared files & drives',
      description: `Transfer ownership of ${employeeName}'s files and shared drives to manager or team lead`,
      category: 'data',
      priority: 'high',
      autoRevocable: false,
    },
    {
      entityId: `data-credentials-${employeeId}`,
      label: 'Shared credentials & vaults',
      description: `Rotate any shared passwords or secrets ${employeeName} had access to`,
      category: 'data',
      priority: 'critical',
      autoRevocable: false,
    },
  )

  const allItems = [...devices, ...apps, ...access, ...data]

  return {
    employeeId,
    generatedAt: now(),
    categories: { devices, apps, access, data },
    totalItems: allItems.length,
  }
}

// ---------------------------------------------------------------------------
// 3. getRevocationStatus
// ---------------------------------------------------------------------------

/**
 * Returns the real-time status of all revocation-related offboarding tasks
 * for a given process, along with an overall completion percentage.
 */
export function getRevocationStatus(
  offboardingProcessId: string,
  store: OffboardingStoreSlice,
): RevocationStatusReport {
  // Filter tasks belonging to this process
  const processTasks = store.offboardingTasks.filter(
    (t) => t.process_id === offboardingProcessId,
  )

  const tasks: RevocationTaskStatus[] = processTasks.map((t) => ({
    taskId: t.id,
    category: categorizeTaskFromNotes(t.notes),
    description: t.notes ?? 'Offboarding task',
    status: t.status as RevocationTaskStatus['status'],
    assigneeId: t.assignee_id ?? null,
    completedAt: t.completed_at ?? null,
    notes: t.notes ?? null,
  }))

  const total = tasks.length
  const completed = tasks.filter((t) => t.status === 'completed').length
  const pending = tasks.filter((t) => t.status === 'pending').length
  const inProgress = tasks.filter((t) => t.status === 'in_progress').length
  const failed = tasks.filter((t) => t.status === 'failed').length
  const skipped = tasks.filter((t) => t.status === 'skipped').length

  // Completed + skipped both count toward "done" for percentage calculation
  const doneCount = completed + skipped
  const completionPercentage = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return {
    offboardingProcessId,
    tasks,
    completionPercentage,
    summary: { total, completed, pending, inProgress, failed, skipped },
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Infer a human-readable category from the task notes (best-effort) */
function categorizeTaskFromNotes(notes: string | null | undefined): string {
  if (!notes) return 'general'
  const lower = notes.toLowerCase()
  if (lower.includes('device')) return 'device_return'
  if (lower.includes('app') || lower.includes('license')) return 'access_revocation'
  if (lower.includes('sso') || lower.includes('identity') || lower.includes('idp')) return 'access_revocation'
  if (lower.includes('email') || lower.includes('file') || lower.includes('credential')) return 'data_handover'
  return 'general'
}
