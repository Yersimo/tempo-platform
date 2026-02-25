// Job Queue System - Database-backed with in-memory fallback for demo mode

export type JobType =
  | 'payroll.process'
  | 'payroll.calculate_taxes'
  | 'report.generate'
  | 'report.schedule'
  | 'import.bulk'
  | 'import.validate'
  | 'export.generate'
  | 'email.send'
  | 'email.bulk_send'
  | 'webhook.deliver'
  | 'notification.push'
  | 'sync.hris'
  | 'sync.accounting'
  | 'document.process'
  | 'analytics.aggregate';

export type JobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export type JobPriority = 'critical' | 'high' | 'normal' | 'low';

export interface Job {
  id: string;
  orgId: string;
  type: JobType;
  status: JobStatus;
  priority: JobPriority;
  payload: Record<string, unknown>;
  result: Record<string, unknown> | null;
  error: string | null;
  attempts: number;
  maxAttempts: number;
  scheduledAt: Date;
  startedAt: Date | null;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string | null;
}

// ---------------------------------------------------------------------------
// Exponential backoff delays (in ms): 30s, 2min, 10min, 30min, 1hr
// ---------------------------------------------------------------------------
const BACKOFF_DELAYS = [
  30 * 1000,
  2 * 60 * 1000,
  10 * 60 * 1000,
  30 * 60 * 1000,
  60 * 60 * 1000,
];

function getBackoffDelay(attempt: number): number {
  const index = Math.min(attempt, BACKOFF_DELAYS.length - 1);
  return BACKOFF_DELAYS[index];
}

// ---------------------------------------------------------------------------
// In-memory fallback for demo mode
// ---------------------------------------------------------------------------
const inMemoryJobs: Job[] = [];

function generateId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Job handlers registry
// ---------------------------------------------------------------------------
type JobHandler = (job: Job) => Promise<Record<string, unknown>>;

const jobHandlers: Record<JobType, JobHandler> = {
  'payroll.process': async (job) => {
    const { orgId, payload } = job;
    const employeeCount = (payload.employeeIds as string[] | undefined)?.length ?? 0;
    return { processed: employeeCount, orgId, runDate: new Date().toISOString() };
  },

  'payroll.calculate_taxes': async (job) => {
    const { payload } = job;
    return {
      employeeId: payload.employeeId,
      federal: 0,
      state: 0,
      local: 0,
      calculatedAt: new Date().toISOString(),
    };
  },

  'report.generate': async (job) => {
    const { payload } = job;
    return {
      reportType: payload.reportType ?? 'unknown',
      format: payload.format ?? 'pdf',
      url: `/reports/${job.id}.${payload.format ?? 'pdf'}`,
      generatedAt: new Date().toISOString(),
    };
  },

  'report.schedule': async (job) => {
    return {
      reportType: job.payload.reportType,
      cron: job.payload.cron ?? '0 8 * * 1',
      nextRunAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    };
  },

  'import.bulk': async (job) => {
    const rows = (job.payload.rows as unknown[]) ?? [];
    return {
      totalRows: rows.length,
      imported: rows.length,
      skipped: 0,
      errors: [],
    };
  },

  'import.validate': async (job) => {
    const rows = (job.payload.rows as unknown[]) ?? [];
    return {
      totalRows: rows.length,
      valid: rows.length,
      invalid: 0,
      warnings: [],
    };
  },

  'export.generate': async (job) => {
    return {
      format: job.payload.format ?? 'csv',
      url: `/exports/${job.id}.${job.payload.format ?? 'csv'}`,
      rowCount: 0,
      generatedAt: new Date().toISOString(),
    };
  },

  'email.send': async (job) => {
    const { payload } = job;
    return {
      to: payload.to,
      subject: payload.subject,
      sent: true,
      messageId: `msg_${Date.now()}`,
    };
  },

  'email.bulk_send': async (job) => {
    const recipients = (job.payload.recipients as string[]) ?? [];
    return {
      total: recipients.length,
      sent: recipients.length,
      failed: 0,
      messageIds: recipients.map((_, i) => `msg_${Date.now()}_${i}`),
    };
  },

  'webhook.deliver': async (job) => {
    const { payload } = job;
    return {
      url: payload.url,
      statusCode: 200,
      deliveredAt: new Date().toISOString(),
      attemptNumber: job.attempts + 1,
    };
  },

  'notification.push': async (job) => {
    return {
      userId: job.payload.userId,
      title: job.payload.title,
      delivered: true,
      deliveredAt: new Date().toISOString(),
    };
  },

  'sync.hris': async (job) => {
    return {
      provider: job.payload.provider ?? 'generic',
      recordsSynced: 0,
      syncedAt: new Date().toISOString(),
    };
  },

  'sync.accounting': async (job) => {
    return {
      provider: job.payload.provider ?? 'generic',
      transactionsSynced: 0,
      syncedAt: new Date().toISOString(),
    };
  },

  'document.process': async (job) => {
    return {
      documentId: job.payload.documentId,
      type: job.payload.documentType ?? 'unknown',
      pages: 0,
      processedAt: new Date().toISOString(),
    };
  },

  'analytics.aggregate': async (job) => {
    return {
      metric: job.payload.metric ?? 'general',
      period: job.payload.period ?? 'monthly',
      aggregatedAt: new Date().toISOString(),
      dataPoints: 0,
    };
  },
};

// ---------------------------------------------------------------------------
// Database helpers – lazy initialisation
// ---------------------------------------------------------------------------
let dbAvailable: boolean | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let dbModule: any = null;

async function getDb() {
  if (dbAvailable === false) return null;
  try {
    dbModule = await import('@/lib/db');
    dbAvailable = true;
    return dbModule;
  } catch {
    dbAvailable = false;
    return null;
  }
}

async function ensureTable() {
  const db = await getDb();
  if (!db) return;

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown> };

  await sql`
    CREATE TABLE IF NOT EXISTS tempo_jobs (
      id            TEXT PRIMARY KEY,
      org_id        TEXT NOT NULL,
      type          TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      priority      TEXT NOT NULL DEFAULT 'normal',
      payload       JSONB NOT NULL DEFAULT '{}',
      result        JSONB,
      error         TEXT,
      attempts      INTEGER NOT NULL DEFAULT 0,
      max_attempts  INTEGER NOT NULL DEFAULT 3,
      scheduled_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      started_at    TIMESTAMPTZ,
      completed_at  TIMESTAMPTZ,
      created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_by    TEXT
    )
  `;
}

let tableEnsured = false;

async function ensureTableOnce() {
  if (tableEnsured) return;
  await ensureTable();
  tableEnsured = true;
}

// ---------------------------------------------------------------------------
// Core queue operations
// ---------------------------------------------------------------------------

export async function enqueueJob(params: {
  orgId: string;
  type: JobType;
  payload?: Record<string, unknown>;
  priority?: JobPriority;
  maxAttempts?: number;
  scheduledAt?: Date;
  createdBy?: string;
}): Promise<Job> {
  const now = new Date();
  const job: Job = {
    id: generateId(),
    orgId: params.orgId,
    type: params.type,
    status: 'pending',
    priority: params.priority ?? 'normal',
    payload: params.payload ?? {},
    result: null,
    error: null,
    attempts: 0,
    maxAttempts: params.maxAttempts ?? 3,
    scheduledAt: params.scheduledAt ?? now,
    startedAt: null,
    completedAt: null,
    createdAt: now,
    updatedAt: now,
    createdBy: params.createdBy ?? null,
  };

  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    // Demo mode – run inline
    const handler = jobHandlers[job.type];
    if (handler) {
      job.status = 'processing';
      job.startedAt = new Date();
      job.attempts = 1;
      try {
        job.result = await handler(job);
        job.status = 'completed';
        job.completedAt = new Date();
      } catch (err) {
        job.status = 'failed';
        job.error = err instanceof Error ? err.message : String(err);
      }
      job.updatedAt = new Date();
    }
    inMemoryJobs.push(job);
    return job;
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<unknown> };

  await sql`
    INSERT INTO tempo_jobs (id, org_id, type, status, priority, payload, attempts, max_attempts, scheduled_at, created_at, updated_at, created_by)
    VALUES (${job.id}, ${job.orgId}, ${job.type}, ${job.status}, ${job.priority}, ${JSON.stringify(job.payload)}, ${job.attempts}, ${job.maxAttempts}, ${job.scheduledAt.toISOString()}, ${job.createdAt.toISOString()}, ${job.updatedAt.toISOString()}, ${job.createdBy})
  `;

  return job;
}

export async function processNextJob(): Promise<Job | null> {
  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    // Demo mode – process first pending in memory
    const pending = inMemoryJobs.find((j) => j.status === 'pending' && j.scheduledAt <= new Date());
    if (!pending) return null;

    pending.status = 'processing';
    pending.startedAt = new Date();
    pending.attempts += 1;
    pending.updatedAt = new Date();

    const handler = jobHandlers[pending.type];
    if (handler) {
      try {
        pending.result = await handler(pending);
        pending.status = 'completed';
        pending.completedAt = new Date();
      } catch (err) {
        pending.error = err instanceof Error ? err.message : String(err);
        if (pending.attempts >= pending.maxAttempts) {
          pending.status = 'failed';
        } else {
          pending.status = 'pending';
          pending.scheduledAt = new Date(Date.now() + getBackoffDelay(pending.attempts));
        }
      }
      pending.updatedAt = new Date();
    }

    return pending;
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<{ id: string; org_id: string; type: JobType; status: JobStatus; priority: JobPriority; payload: Record<string, unknown>; result: Record<string, unknown> | null; error: string | null; attempts: number; max_attempts: number; scheduled_at: string; started_at: string | null; completed_at: string | null; created_at: string; updated_at: string; created_by: string | null }[]> };

  // Atomically claim the next pending job
  const rows = await sql`
    UPDATE tempo_jobs
    SET status = 'processing', started_at = NOW(), attempts = attempts + 1, updated_at = NOW()
    WHERE id = (
      SELECT id FROM tempo_jobs
      WHERE status = 'pending' AND scheduled_at <= NOW()
      ORDER BY
        CASE priority
          WHEN 'critical' THEN 0
          WHEN 'high' THEN 1
          WHEN 'normal' THEN 2
          WHEN 'low' THEN 3
        END,
        scheduled_at ASC
      LIMIT 1
      FOR UPDATE SKIP LOCKED
    )
    RETURNING *
  `;

  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;

  const row = rows[0];
  const job = rowToJob(row);

  const handler = jobHandlers[job.type];
  if (!handler) {
    await sql`
      UPDATE tempo_jobs SET status = 'failed', error = 'No handler registered', updated_at = NOW() WHERE id = ${job.id}
    `;
    job.status = 'failed';
    job.error = 'No handler registered';
    return job;
  }

  try {
    const result = await handler(job);
    await sql`
      UPDATE tempo_jobs SET status = 'completed', result = ${JSON.stringify(result)}, completed_at = NOW(), updated_at = NOW() WHERE id = ${job.id}
    `;
    job.status = 'completed';
    job.result = result;
    job.completedAt = new Date();
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    if (job.attempts >= job.maxAttempts) {
      await sql`
        UPDATE tempo_jobs SET status = 'failed', error = ${errorMessage}, updated_at = NOW() WHERE id = ${job.id}
      `;
      job.status = 'failed';
      job.error = errorMessage;
    } else {
      const nextRun = new Date(Date.now() + getBackoffDelay(job.attempts));
      await sql`
        UPDATE tempo_jobs SET status = 'pending', error = ${errorMessage}, scheduled_at = ${nextRun.toISOString()}, updated_at = NOW() WHERE id = ${job.id}
      `;
      job.status = 'pending';
      job.error = errorMessage;
      job.scheduledAt = nextRun;
    }
  }

  job.updatedAt = new Date();
  return job;
}

export async function getJobStatus(jobId: string): Promise<Job | null> {
  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    return inMemoryJobs.find((j) => j.id === jobId) ?? null;
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]> };

  const rows = await sql`SELECT * FROM tempo_jobs WHERE id = ${jobId} LIMIT 1`;
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  return rowToJob(rows[0]);
}

export async function cancelJob(jobId: string): Promise<Job | null> {
  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    const job = inMemoryJobs.find((j) => j.id === jobId);
    if (!job) return null;
    if (job.status === 'completed' || job.status === 'cancelled') return job;
    job.status = 'cancelled';
    job.updatedAt = new Date();
    return job;
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]> };

  const rows = await sql`
    UPDATE tempo_jobs SET status = 'cancelled', updated_at = NOW()
    WHERE id = ${jobId} AND status IN ('pending', 'processing')
    RETURNING *
  `;
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  return rowToJob(rows[0]);
}

export async function retryJob(jobId: string): Promise<Job | null> {
  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    const job = inMemoryJobs.find((j) => j.id === jobId);
    if (!job || job.status !== 'failed') return null;
    job.status = 'pending';
    job.error = null;
    job.scheduledAt = new Date();
    job.updatedAt = new Date();
    return job;
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]> };

  const rows = await sql`
    UPDATE tempo_jobs SET status = 'pending', error = NULL, scheduled_at = NOW(), updated_at = NOW()
    WHERE id = ${jobId} AND status = 'failed'
    RETURNING *
  `;
  if (!rows || !Array.isArray(rows) || rows.length === 0) return null;
  return rowToJob(rows[0]);
}

export async function listJobs(params: {
  orgId: string;
  status?: JobStatus;
  type?: JobType;
  limit?: number;
  offset?: number;
}): Promise<{ jobs: Job[]; total: number }> {
  const { orgId, status, type, limit = 20, offset = 0 } = params;

  await ensureTableOnce();
  const db = await getDb();

  if (!db) {
    let filtered = inMemoryJobs.filter((j) => j.orgId === orgId);
    if (status) filtered = filtered.filter((j) => j.status === status);
    if (type) filtered = filtered.filter((j) => j.type === type);

    const total = filtered.length;
    const jobs = filtered
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);

    return { jobs, total };
  }

  const { sql } = db as { sql: (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Record<string, unknown>[]> };

  // Build a simple query – we rely on the tagged template for safety
  let rows: Record<string, unknown>[];
  let countRows: Record<string, unknown>[];

  if (status && type) {
    rows = await sql`
      SELECT * FROM tempo_jobs WHERE org_id = ${orgId} AND status = ${status} AND type = ${type}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*)::int as count FROM tempo_jobs WHERE org_id = ${orgId} AND status = ${status} AND type = ${type}
    `;
  } else if (status) {
    rows = await sql`
      SELECT * FROM tempo_jobs WHERE org_id = ${orgId} AND status = ${status}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*)::int as count FROM tempo_jobs WHERE org_id = ${orgId} AND status = ${status}
    `;
  } else if (type) {
    rows = await sql`
      SELECT * FROM tempo_jobs WHERE org_id = ${orgId} AND type = ${type}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*)::int as count FROM tempo_jobs WHERE org_id = ${orgId} AND type = ${type}
    `;
  } else {
    rows = await sql`
      SELECT * FROM tempo_jobs WHERE org_id = ${orgId}
      ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}
    `;
    countRows = await sql`
      SELECT COUNT(*)::int as count FROM tempo_jobs WHERE org_id = ${orgId}
    `;
  }

  const total = (countRows?.[0]?.count as number) ?? 0;
  const jobs = (rows ?? []).map(rowToJob);

  return { jobs, total };
}

// ---------------------------------------------------------------------------
// Polling runner
// ---------------------------------------------------------------------------

let runnerInterval: ReturnType<typeof setInterval> | null = null;

export function startJobRunner(pollIntervalMs = 5000): { stop: () => void } {
  if (runnerInterval) {
    return { stop: () => stopJobRunner() };
  }

  runnerInterval = setInterval(async () => {
    try {
      await processNextJob();
    } catch (err) {
      console.error('[job-queue] Runner error:', err);
    }
  }, pollIntervalMs);

  console.log(`[job-queue] Runner started – polling every ${pollIntervalMs}ms`);

  return {
    stop: () => stopJobRunner(),
  };
}

function stopJobRunner() {
  if (runnerInterval) {
    clearInterval(runnerInterval);
    runnerInterval = null;
    console.log('[job-queue] Runner stopped');
  }
}

// ---------------------------------------------------------------------------
// Row mapping helper
// ---------------------------------------------------------------------------

function rowToJob(row: Record<string, unknown>): Job {
  return {
    id: row.id as string,
    orgId: (row.org_id ?? row.orgId) as string,
    type: row.type as JobType,
    status: row.status as JobStatus,
    priority: (row.priority ?? 'normal') as JobPriority,
    payload: (typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload ?? {}) as Record<string, unknown>,
    result: row.result ? (typeof row.result === 'string' ? JSON.parse(row.result) : row.result) as Record<string, unknown> : null,
    error: (row.error as string) ?? null,
    attempts: (row.attempts as number) ?? 0,
    maxAttempts: (row.max_attempts ?? row.maxAttempts ?? 3) as number,
    scheduledAt: new Date((row.scheduled_at ?? row.scheduledAt ?? new Date()) as string),
    startedAt: row.started_at || row.startedAt ? new Date((row.started_at ?? row.startedAt) as string) : null,
    completedAt: row.completed_at || row.completedAt ? new Date((row.completed_at ?? row.completedAt) as string) : null,
    createdAt: new Date((row.created_at ?? row.createdAt ?? new Date()) as string),
    updatedAt: new Date((row.updated_at ?? row.updatedAt ?? new Date()) as string),
    createdBy: (row.created_by ?? row.createdBy ?? null) as string | null,
  };
}
