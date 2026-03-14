/**
 * Permission Audit Trail — Enterprise Compliance Logging
 *
 * Provides a comprehensive audit log for all permission-related actions.
 * Designed to satisfy SOX, GDPR, and SOC 2 audit requirements.
 *
 * Features:
 * - In-memory log with configurable retention (async DB flush when available)
 * - Every permission check, role change, and data access is logged
 * - Denied access attempts are tracked separately for security review
 * - Compliance report generation for auditors
 * - Login history with IP and user-agent tracking
 *
 * Usage:
 *   logAudit({ actorId: '...', action: 'view_record', ... })
 *   const denials = getAccessDeniedLog()
 *   const report = generateComplianceReport('2025-01-01', '2025-03-31')
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export type AuditAction =
  | 'login' | 'logout' | 'login_failed'
  | 'view_record' | 'edit_record' | 'delete_record'
  | 'role_assigned' | 'role_removed' | 'role_created' | 'role_modified'
  | 'permission_granted' | 'permission_revoked'
  | 'delegation_created' | 'delegation_revoked'
  | 'data_exported' | 'report_generated'
  | 'field_accessed' | 'sensitive_data_viewed'
  | 'approval_action' | 'bulk_operation'
  | 'security_profile_changed' | 'access_denied';

export type AuditOutcome = 'success' | 'denied' | 'error';

export interface AuditEntry {
  id: string;
  /** ISO 8601 timestamp */
  timestamp: string;
  /** User who performed the action */
  actorId: string;
  /** Role of the actor at the time of the action */
  actorRole: string;
  /** What action was performed */
  action: AuditAction;
  /** Entity type affected (e.g. 'employee', 'payroll', 'role') */
  resourceType: string;
  /** Specific resource ID (if applicable) */
  resourceId?: string;
  /** Additional structured data about the action */
  details: Record<string, unknown>;
  /** Client IP address (when available) */
  ipAddress?: string;
  /** Client user-agent string (when available) */
  userAgent?: string;
  /** Whether the action succeeded, was denied, or errored */
  outcome: AuditOutcome;
}

export interface AuditQueryFilters {
  actorId?: string;
  action?: AuditAction;
  actions?: AuditAction[];
  resourceType?: string;
  resourceId?: string;
  outcome?: AuditOutcome;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface ComplianceReport {
  reportId: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  summary: {
    totalEvents: number;
    uniqueActors: number;
    accessDenials: number;
    sensitiveDataViews: number;
    roleChanges: number;
    delegations: number;
    dataExports: number;
    loginFailures: number;
  };
  topActors: Array<{ actorId: string; eventCount: number }>;
  actionBreakdown: Record<string, number>;
  denialDetails: AuditEntry[];
}

export interface AuditConfig {
  /** Maximum entries to keep in memory before auto-pruning (default: 10000) */
  maxEntries: number;
  /** Retention period in days (entries older than this are auto-pruned, default: 90) */
  retentionDays: number;
  /** Whether to log sensitive data field access (default: true) */
  logSensitiveAccess: boolean;
  /** Callback for async DB persistence (invoked after each log entry) */
  onPersist?: (entry: AuditEntry) => Promise<void>;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: AuditConfig = {
  maxEntries: 10000,
  retentionDays: 90,
  logSensitiveAccess: true,
};

let config: AuditConfig = { ...DEFAULT_CONFIG };

/**
 * Update audit log configuration.
 */
export function configureAuditLog(updates: Partial<AuditConfig>): void {
  config = { ...config, ...updates };
}

// ── In-Memory Store ───────────────────────────────────────────────────────────

let auditStore: AuditEntry[] = [];
let auditIdCounter = 1;

function generateAuditId(): string {
  return `aud_${Date.now()}_${auditIdCounter++}`;
}

// ── Core Logging ──────────────────────────────────────────────────────────────

/**
 * Log an audit event. This is the primary entry point for all audit logging.
 *
 * Automatically:
 * - Generates a unique ID and timestamp
 * - Enforces retention limits
 * - Invokes the async persistence callback (if configured)
 */
export function logAudit(
  entry: Omit<AuditEntry, 'id' | 'timestamp'>,
): AuditEntry {
  const auditEntry: AuditEntry = {
    id: generateAuditId(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  auditStore.push(auditEntry);

  // Auto-prune if over max
  if (auditStore.length > config.maxEntries) {
    const excess = auditStore.length - config.maxEntries;
    auditStore.splice(0, excess);
  }

  // Async persistence (fire-and-forget)
  if (config.onPersist) {
    config.onPersist(auditEntry).catch(() => {
      // Persistence failure is non-fatal; entries remain in memory
    });
  }

  return auditEntry;
}

/**
 * Convenience: log a successful record view.
 */
export function logRecordView(
  actorId: string,
  actorRole: string,
  resourceType: string,
  resourceId: string,
  details?: Record<string, unknown>,
): AuditEntry {
  return logAudit({
    actorId,
    actorRole,
    action: 'view_record',
    resourceType,
    resourceId,
    details: details ?? {},
    outcome: 'success',
  });
}

/**
 * Convenience: log an access denial.
 */
export function logAccessDenied(
  actorId: string,
  actorRole: string,
  resourceType: string,
  resourceId: string,
  reason: string,
): AuditEntry {
  return logAudit({
    actorId,
    actorRole,
    action: 'access_denied',
    resourceType,
    resourceId,
    details: { reason },
    outcome: 'denied',
  });
}

/**
 * Convenience: log sensitive data access (for GDPR / SOX compliance).
 */
export function logSensitiveDataAccess(
  actorId: string,
  actorRole: string,
  resourceType: string,
  resourceId: string,
  fields: string[],
): AuditEntry {
  if (!config.logSensitiveAccess) {
    // Return a stub entry without storing it
    return {
      id: 'skipped',
      timestamp: new Date().toISOString(),
      actorId,
      actorRole,
      action: 'sensitive_data_viewed',
      resourceType,
      resourceId,
      details: { fields },
      outcome: 'success',
    };
  }

  return logAudit({
    actorId,
    actorRole,
    action: 'sensitive_data_viewed',
    resourceType,
    resourceId,
    details: { fields },
    outcome: 'success',
  });
}

// ── Query Functions ───────────────────────────────────────────────────────────

/**
 * Query the audit log with optional filters.
 * Results are returned in reverse chronological order (newest first).
 */
export function getAuditLog(filters?: AuditQueryFilters): AuditEntry[] {
  let results = [...auditStore];

  if (filters) {
    if (filters.actorId) {
      results = results.filter((e) => e.actorId === filters.actorId);
    }
    if (filters.action) {
      results = results.filter((e) => e.action === filters.action);
    }
    if (filters.actions && filters.actions.length > 0) {
      const actionSet = new Set(filters.actions);
      results = results.filter((e) => actionSet.has(e.action));
    }
    if (filters.resourceType) {
      results = results.filter((e) => e.resourceType === filters.resourceType);
    }
    if (filters.resourceId) {
      results = results.filter((e) => e.resourceId === filters.resourceId);
    }
    if (filters.outcome) {
      results = results.filter((e) => e.outcome === filters.outcome);
    }
    if (filters.startDate) {
      const start = new Date(filters.startDate);
      results = results.filter((e) => new Date(e.timestamp) >= start);
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      results = results.filter((e) => new Date(e.timestamp) <= end);
    }
  }

  // Sort newest first
  results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Apply pagination
  const offset = filters?.offset ?? 0;
  const limit = filters?.limit ?? 100;
  return results.slice(offset, offset + limit);
}

/**
 * Get all audit entries for a specific user (as actor).
 */
export function getAuditLogForUser(userId: string, limit?: number): AuditEntry[] {
  return getAuditLog({ actorId: userId, limit: limit ?? 100 });
}

/**
 * Get all audit entries for a specific resource.
 */
export function getAuditLogForResource(
  resourceType: string,
  resourceId: string,
  limit?: number,
): AuditEntry[] {
  return getAuditLog({ resourceType, resourceId, limit: limit ?? 100 });
}

/**
 * Get all access denied entries (for security review).
 */
export function getAccessDeniedLog(limit?: number): AuditEntry[] {
  return getAuditLog({ outcome: 'denied', limit: limit ?? 100 });
}

/**
 * Get login history for a specific user.
 */
export function getLoginHistory(userId: string, limit?: number): AuditEntry[] {
  return getAuditLog({
    actorId: userId,
    actions: ['login', 'logout', 'login_failed'],
    limit: limit ?? 50,
  });
}

// ── Compliance Reporting ──────────────────────────────────────────────────────

/**
 * Generate a compliance report for a date range.
 * Provides summary statistics and detailed breakdowns suitable for
 * SOX, GDPR, and SOC 2 audits.
 */
export function generateComplianceReport(
  periodStart: string,
  periodEnd: string,
): ComplianceReport {
  const entries = getAuditLog({
    startDate: periodStart,
    endDate: periodEnd,
    limit: config.maxEntries, // get all entries in range
  });

  // Summary counters
  const actorSet = new Set<string>();
  let accessDenials = 0;
  let sensitiveDataViews = 0;
  let roleChanges = 0;
  let delegations = 0;
  let dataExports = 0;
  let loginFailures = 0;
  const actionCounts: Record<string, number> = {};
  const actorCounts: Record<string, number> = {};

  for (const entry of entries) {
    actorSet.add(entry.actorId);
    actionCounts[entry.action] = (actionCounts[entry.action] ?? 0) + 1;
    actorCounts[entry.actorId] = (actorCounts[entry.actorId] ?? 0) + 1;

    switch (entry.action) {
      case 'access_denied':
        accessDenials++;
        break;
      case 'sensitive_data_viewed':
        sensitiveDataViews++;
        break;
      case 'role_assigned':
      case 'role_removed':
      case 'role_created':
      case 'role_modified':
        roleChanges++;
        break;
      case 'delegation_created':
      case 'delegation_revoked':
        delegations++;
        break;
      case 'data_exported':
        dataExports++;
        break;
      case 'login_failed':
        loginFailures++;
        break;
    }
  }

  // Top actors by event count
  const topActors = Object.entries(actorCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([actorId, eventCount]) => ({ actorId, eventCount }));

  // Denial details
  const denialDetails = entries.filter((e) => e.outcome === 'denied');

  return {
    reportId: `rpt_${Date.now()}`,
    generatedAt: new Date().toISOString(),
    periodStart,
    periodEnd,
    summary: {
      totalEvents: entries.length,
      uniqueActors: actorSet.size,
      accessDenials,
      sensitiveDataViews,
      roleChanges,
      delegations,
      dataExports,
      loginFailures,
    },
    topActors,
    actionBreakdown: actionCounts,
    denialDetails,
  };
}

// ── Maintenance ───────────────────────────────────────────────────────────────

/**
 * Remove audit entries older than the configured retention period.
 * Returns the number of entries removed.
 */
export function pruneOldEntries(): number {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - config.retentionDays);

  const before = auditStore.length;
  auditStore = auditStore.filter((e) => new Date(e.timestamp) >= cutoff);
  return before - auditStore.length;
}

/**
 * Get the current audit log size.
 */
export function getAuditLogSize(): number {
  return auditStore.length;
}

/**
 * Clear the entire audit log. Used for testing only.
 * In production, this should never be called (use pruneOldEntries instead).
 */
export function clearAuditLog(): void {
  auditStore = [];
  auditIdCounter = 1;
}

/**
 * Export the entire audit log as a JSON-serializable array.
 * Used for GDPR data export requests or backup purposes.
 */
export function exportAuditLog(filters?: AuditQueryFilters): AuditEntry[] {
  // Log the export action itself
  logAudit({
    actorId: 'system',
    actorRole: 'system',
    action: 'data_exported',
    resourceType: 'audit_log',
    details: { filters: filters ?? 'full_export', entryCount: auditStore.length },
    outcome: 'success',
  });

  return getAuditLog({ ...filters, limit: config.maxEntries });
}

/**
 * GDPR helper: get all audit entries that reference a specific data subject.
 * This searches both actorId and resourceId fields, plus the details object.
 */
export function getEntriesForDataSubject(subjectId: string): AuditEntry[] {
  return auditStore.filter((e) => {
    if (e.actorId === subjectId) return true;
    if (e.resourceId === subjectId) return true;
    // Check details for subject references
    const detailsStr = JSON.stringify(e.details);
    return detailsStr.includes(subjectId);
  });
}

/**
 * GDPR helper: anonymize audit entries for a data subject.
 * Replaces PII but preserves the audit trail structure for compliance.
 * Returns the count of anonymized entries.
 */
export function anonymizeDataSubject(subjectId: string): number {
  const anonymized = `ANONYMIZED_${subjectId.slice(-4)}`;
  let count = 0;

  for (const entry of auditStore) {
    let modified = false;

    if (entry.actorId === subjectId) {
      entry.actorId = anonymized;
      modified = true;
    }
    if (entry.resourceId === subjectId) {
      entry.resourceId = anonymized;
      modified = true;
    }
    if (entry.ipAddress) {
      entry.ipAddress = '0.0.0.0';
      modified = true;
    }
    if (entry.userAgent) {
      entry.userAgent = 'REDACTED';
      modified = true;
    }

    if (modified) count++;
  }

  return count;
}
