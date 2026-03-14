/**
 * Backup & Recovery Configuration for Tempo Platform
 *
 * Defines schedules, retention policies, table priorities, and exclusions
 * for the Neon PostgreSQL database backup system.
 */

// ─── Schedule ─────────────────────────────────────────────────────────────────

export const BACKUP_SCHEDULE = {
  /** Full backup — every day at 02:00 UTC */
  fullCron: '0 2 * * *',
  /** Incremental backup — every hour at :15 */
  incrementalCron: '15 * * * *',
} as const

// ─── Retention Policy ─────────────────────────────────────────────────────────

export const RETENTION_POLICY = {
  /** Number of daily full backups to keep */
  dailyCount: 30,
  /** Number of monthly backups to keep (first of each month) */
  monthlyCount: 12,
  /** Incremental backups older than this (days) are pruned */
  incrementalMaxAgeDays: 7,
  /** Neon branches older than this (days) are cleaned up */
  neonBranchMaxAgeDays: 7,
  /** Maximum number of Neon branches to keep */
  neonBranchMaxCount: 7,
} as const

// ─── Recovery Targets ─────────────────────────────────────────────────────────

export const RECOVERY_TARGETS = {
  /** Recovery Time Objective — maximum acceptable downtime */
  rtoMinutes: 30,
  /** Recovery Point Objective — maximum acceptable data loss */
  rpoMinutes: 60,
} as const

// ─── Table Priority List ──────────────────────────────────────────────────────
// Tables are backed up in this order. Critical tables first so that even a
// partial backup captures the most important data.

export const TABLE_PRIORITY: readonly string[] = [
  // Tier 1 — Core identity & auth (must restore first for FK integrity)
  'organizations',
  'departments',
  'employees',
  'sessions',
  'platform_admins',
  'admin_sessions',

  // Tier 2 — Financial & payroll (highest business impact)
  'payroll_runs',
  'employee_payroll_entries',
  'contractor_payments',
  'payroll_approvals',
  'payroll_approval_config',
  'payroll_schedules',
  'tax_configs',
  'tax_filings',
  'expense_reports',
  'expense_items',
  'expense_policies',
  'invoices',
  'budgets',
  'vendors',
  'corporate_cards',
  'card_transactions',
  'card_spend_limits',
  'bill_payments',
  'bill_pay_schedules',
  'purchase_orders',
  'purchase_order_items',
  'procurement_requests',
  'currency_accounts',
  'fx_transactions',
  'reimbursement_batches',
  'reimbursement_items',

  // Tier 3 — HR core
  'comp_bands',
  'salary_reviews',
  'benefit_plans',
  'benefit_enrollments',
  'benefit_dependents',
  'leave_requests',
  'life_events',
  'goals',
  'review_cycles',
  'reviews',
  'feedback',
  'approval_chains',
  'approval_steps',

  // Tier 4 — Recruiting & onboarding
  'job_postings',
  'applications',
  'background_checks',
  'referral_programs',
  'referrals',
  'knockout_questions',
  'candidate_scheduling',
  'interview_recordings',
  'interview_transcriptions',
  'video_screen_templates',
  'video_screen_invites',
  'video_screen_responses',
  'buddy_assignments',
  'preboarding_tasks',

  // Tier 5 — Learning & engagement
  'courses',
  'enrollments',
  'learning_paths',
  'course_content',
  'quiz_questions',
  'assessment_attempts',
  'auto_enroll_rules',
  'certificates',
  'content_block_progress',
  'course_prerequisites',
  'scorm_packages',
  'scorm_tracking',
  'content_library',
  'learner_badges',
  'learner_points',
  'surveys',
  'engagement_scores',
  'survey_templates',
  'survey_schedules',
  'survey_triggers',
  'survey_question_branching',
  'open_ended_responses',
  'mentoring_programs',
  'mentoring_pairs',
  'mentoring_sessions',
  'mentoring_goals',

  // Tier 6 — IT & devices
  'devices',
  'software_licenses',
  'it_requests',
  'managed_devices',
  'device_actions',
  'app_catalog',
  'app_assignments',
  'security_policies',
  'device_inventory',
  'deployment_profiles',
  'device_enrollment_tokens',
  'device_store_catalog',
  'device_orders',
  'buyback_requests',

  // Tier 7 — Compliance, identity, integrations
  'compliance_requirements',
  'compliance_documents',
  'compliance_alerts',
  'idp_configurations',
  'saml_apps',
  'mfa_policies',
  'mfa_enrollments',
  'sso_providers',
  'sso_sessions',
  'integrations',
  'integration_logs',
  'webhook_endpoints',
  'password_vaults',
  'vault_items',
  'signature_documents',
  'signature_signers',
  'signature_templates',
  'signature_audit_trail',
  'i9_forms',
  'i9_documents',
  'everify_cases',

  // Tier 8 — Strategy, projects, workflows
  'strategic_objectives',
  'key_results',
  'initiatives',
  'kpi_definitions',
  'kpi_measurements',
  'projects',
  'milestones',
  'tasks',
  'task_dependencies',
  'workflows',
  'workflow_steps',
  'workflow_runs',
  'workflow_templates',
  'automation_workflows',
  'automation_workflow_steps',
  'automation_workflow_runs',
  'automation_workflow_run_steps',

  // Tier 9 — Travel, benefits advanced, EOR/COR
  'travel_policies',
  'travel_requests',
  'travel_bookings',
  'retirement_plans',
  'retirement_contributions',
  'retirement_enrollments',
  'carrier_integrations',
  'enrollment_feeds',
  'open_enrollment_periods',
  'cobra_events',
  'aca_tracking',
  'flex_benefit_accounts',
  'flex_benefit_transactions',
  'eor_entities',
  'eor_employees',
  'eor_contracts',
  'cor_contractors',
  'cor_contracts',
  'cor_payments',
  'global_benefit_plans',
  'country_benefit_configs',
  'global_benefit_enrollments',
  'peo_configurations',
  'co_employment_records',
  'peo_employee_enrollments',
  'peo_workers_comp_codes',
  'peo_invoices',
  'workers_comp_policies',
  'workers_comp_claims',
  'workers_comp_class_codes',
  'workers_comp_audits',

  // Tier 10 — Time, attendance, offboarding
  'time_entries',
  'time_off_policies',
  'time_off_balances',
  'overtime_rules',
  'shifts',
  'geofence_zones',
  'geofence_events',
  'offboarding_checklists',
  'offboarding_checklist_items',
  'offboarding_processes',
  'offboarding_tasks',
  'exit_surveys',

  // Tier 11 — Performance advanced, custom fields, misc
  'performance_improvement_plans',
  'pip_check_ins',
  'merit_cycles',
  'merit_recommendations',
  'review_templates',
  'headcount_plans',
  'headcount_positions',
  'headcount_budget_items',
  'custom_field_definitions',
  'custom_field_values',
  'emergency_contacts',
  'equity_grants',
  'dynamic_groups',

  // Tier 12 — Chat & collaboration
  'chat_channels',
  'chat_participants',
  'chat_messages',
  'chat_channel_members',
  'chat_reactions',

  // Tier 13 — Notifications & files
  'notifications',
  'notification_preferences',
  'file_uploads',

  // Tier 14 — App Studio & Sandbox
  'custom_apps',
  'app_pages',
  'app_components',
  'app_data_sources',
  'saved_queries',
  'query_schedules',
  'sandbox_environments',
  'sandbox_snapshots',
  'sandbox_access_log',

  // Tier 15 — Expense advanced
  'receipt_matching',
  'mileage_entries',
  'advanced_expense_policies',
  'duplicate_detection',
] as const

// ─── Exclusion List ───────────────────────────────────────────────────────────
// Tables or data subsets to exclude from regular backups.

export const BACKUP_EXCLUSIONS = {
  /** Tables entirely skipped during backup */
  excludedTables: [
    // Audit log is append-only and very large; backed up separately
    'audit_log',
    // Payroll audit log same
    'payroll_audit_log',
    // Impersonation log is security-sensitive and handled separately
    'impersonation_log',
  ] as readonly string[],

  /** For these tables, only rows newer than the cutoff are backed up */
  ageFilteredTables: {
    audit_log: 90,        // days
    payroll_audit_log: 90,
    integration_logs: 30,
    impersonation_log: 90,
  } as Record<string, number>,
} as const

// ─── Backup Directories ──────────────────────────────────────────────────────

export const BACKUP_PATHS = {
  /** Root directory for all backups (relative to project root) */
  rootDir: 'backups',
  /** Subdirectory for full backups */
  fullDir: 'backups/full',
  /** Subdirectory for incremental backups */
  incrementalDir: 'backups/incremental',
  /** Metadata file tracking last backup timestamps per table */
  metadataFile: 'backups/.backup-metadata.json',
} as const

// ─── Types ────────────────────────────────────────────────────────────────────

export interface BackupMetadata {
  lastFullBackup: string | null
  lastIncrementalBackup: string | null
  tables: Record<string, {
    lastBackupAt: string
    rowCount: number
    sizeBytes: number
  }>
}

export interface BackupManifest {
  version: '1.0'
  type: 'full' | 'incremental'
  createdAt: string
  databaseUrl: string // redacted
  tables: {
    name: string
    rowCount: number
    sizeBytes: number
    hasUpdatedAt: boolean
  }[]
  totalRows: number
  totalSizeBytes: number
}

export function createEmptyMetadata(): BackupMetadata {
  return {
    lastFullBackup: null,
    lastIncrementalBackup: null,
    tables: {},
  }
}
