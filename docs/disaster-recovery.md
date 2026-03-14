# Tempo Platform — Disaster Recovery Runbook

## Recovery Targets

| Target | Value | Notes |
|--------|-------|-------|
| **RTO** (Recovery Time Objective) | 30 minutes | Maximum acceptable downtime |
| **RPO** (Recovery Point Objective) | 60 minutes | Maximum acceptable data loss |

## Backup Strategy Overview

Tempo uses a layered backup approach:

1. **Neon Point-in-Time Recovery (PITR)** — Neon retains a continuous WAL stream. On paid plans, you can restore to any second within the retention window (up to 30 days). This is the fastest and most granular recovery method.

2. **Neon Branch Snapshots** — Lightweight copy-on-write branches created via the Neon API. Instant to create, zero-downtime, and can be promoted to primary.

3. **Application-Level JSON Backups** — Full and incremental exports of all tables to compressed `.tar.gz` archives. Portable and provider-independent.

## Recovery Procedures

### Scenario 1: Accidental Data Deletion (Single Table or Rows)

**Estimated recovery time: 5-10 minutes**

1. **Option A — Neon PITR (fastest)**
   - Open the Neon Console at `console.neon.tech`
   - Navigate to your project > Branches
   - Click "Create branch" and select a timestamp before the deletion
   - Connect to the new branch and export the affected data
   - Import the data back into the main branch

2. **Option B — Neon Branch Snapshot**
   ```bash
   npx tsx scripts/neon-branch-backup.ts list
   # Find a branch from before the deletion
   npx tsx scripts/neon-branch-backup.ts restore <branch-id>
   # Follow the printed instructions to export data
   ```

3. **Option C — JSON Backup Restore (selective)**
   ```bash
   npx tsx scripts/restore-database.ts backups/full/<latest>.tar.gz \
     --tables=<affected_table> --merge
   ```
   The `--merge` flag upserts data without truncating the table.

### Scenario 2: Database Corruption or Full Data Loss

**Estimated recovery time: 15-30 minutes**

1. **Step 1 — Assess the damage**
   - Check the Neon dashboard for project health
   - Verify which tables are affected

2. **Step 2 — Restore from Neon PITR** (preferred)
   - In the Neon Console, create a branch at a known-good timestamp
   - Update `DATABASE_URL` in your deployment environment to point to the new branch
   - Verify data integrity
   - Optionally promote the branch to primary

3. **Step 3 — Fallback: Restore from JSON backup**
   ```bash
   # Validate the backup first
   npx tsx scripts/restore-database.ts backups/full/<latest>.tar.gz --dry-run

   # Full restore (truncates all tables and re-inserts)
   npx tsx scripts/restore-database.ts backups/full/<latest>.tar.gz --yes
   ```

4. **Step 4 — Apply incremental backups** (if available)
   ```bash
   npx tsx scripts/restore-database.ts backups/incremental/<latest>.tar.gz --merge
   ```

5. **Step 5 — Verify**
   - Run the application and spot-check critical data
   - Check row counts against the backup manifest

### Scenario 3: Neon Service Outage

**Estimated recovery time: depends on Neon**

1. Monitor Neon status at `https://neonstatus.com`
2. The application gracefully degrades to demo data when the database is unreachable
3. If extended outage (>1 hour):
   - Consider deploying to an alternative PostgreSQL provider
   - Restore from the latest JSON backup to the new database
   - Update `DATABASE_URL` in your deployment

### Scenario 4: Accidental Schema Migration (Breaking Change)

**Estimated recovery time: 10-20 minutes**

1. Create a Neon branch from before the migration:
   ```bash
   npx tsx scripts/neon-branch-backup.ts create --name=pre-migration-rollback
   ```
2. Point the application at the branch while you fix the migration
3. Roll back the migration in your Drizzle schema and push again

## Backup Schedule

| Type | Frequency | Retention | Location |
|------|-----------|-----------|----------|
| Neon PITR | Continuous | 7-30 days (plan-dependent) | Neon infrastructure |
| Neon Branch | On-demand / pre-deploy | 7 branches | Neon infrastructure |
| Full JSON | Daily at 02:00 UTC | 30 daily + 12 monthly | `backups/full/` |
| Incremental JSON | Hourly at :15 | 7 days | `backups/incremental/` |

## Running Backups

### Manual Full Backup
```bash
npx tsx scripts/backup-database.ts
```

### Manual Incremental Backup
```bash
npx tsx scripts/backup-database.ts --incremental
```

### Specific Tables Only
```bash
npx tsx scripts/backup-database.ts --tables=organizations,employees,payroll_runs
```

### Neon Branch Snapshot
```bash
npx tsx scripts/neon-branch-backup.ts create
```

### Via API (admin only)
```bash
curl -X POST https://your-domain.com/api/admin/backup \
  -H "Cookie: tempo_admin_session=<token>" \
  -H "Content-Type: application/json" \
  -d '{"type": "full"}'
```

### List Backups via API
```bash
curl https://your-domain.com/api/admin/backup \
  -H "Cookie: tempo_admin_session=<token>"
```

## Table Priority for Restoration

Tables are restored in dependency order. The most critical tables are restored first:

1. **Core** — organizations, departments, employees, sessions
2. **Financial** — payroll_runs, employee_payroll_entries, expense_reports, invoices
3. **HR** — comp_bands, benefit_plans, leave_requests, goals, reviews
4. **Recruiting** — job_postings, applications
5. **Learning** — courses, enrollments, surveys
6. **IT** — devices, software_licenses
7. **Everything else** — in priority order defined in `src/lib/backup/config.ts`

## Escalation Contacts

| Role | Responsibility |
|------|----------------|
| **On-call Engineer** | First responder, executes recovery procedures |
| **Database Admin** | Neon console access, schema decisions |
| **Team Lead** | Approves full restores, communicates to stakeholders |
| **Neon Support** | Infrastructure-level issues — support@neon.tech |

## Post-Recovery Checklist

- [ ] Verify core tables have expected row counts
- [ ] Test authentication (login/logout)
- [ ] Verify payroll data integrity
- [ ] Check that RLS policies are functioning (`app.current_org_id`)
- [ ] Run a test query across each org to confirm scoping
- [ ] Review audit log for any gaps
- [ ] Notify affected users if there was data loss
- [ ] Create a post-incident report
- [ ] Take a fresh backup after recovery

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `NEON_API_KEY` | Neon API key for branch operations |
| `NEON_PROJECT_ID` | Neon project identifier |
