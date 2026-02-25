import { NextResponse } from 'next/server';
import {
  enqueueJob,
  processNextJob,
  cancelJob,
  retryJob,
  getJobStatus,
  listJobs,
  type JobType,
  type JobStatus,
} from '@/lib/job-queue';

// ---------------------------------------------------------------------------
// GET /api/jobs – List jobs for an organisation
// ---------------------------------------------------------------------------
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orgId = request.headers.get('x-org-id');

  if (!orgId) {
    return NextResponse.json(
      { error: 'Missing x-org-id header' },
      { status: 400 },
    );
  }

  const status = searchParams.get('status') as JobStatus | null;
  const type = searchParams.get('type') as JobType | null;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0;

  try {
    const { jobs, total } = await listJobs({
      orgId,
      status: status ?? undefined,
      type: type ?? undefined,
      limit,
      offset,
    });

    return NextResponse.json({
      jobs,
      total,
      pagination: {
        limit,
        offset,
        hasMore: offset + jobs.length < total,
      },
    });
  } catch (err) {
    console.error('[api/jobs] GET error:', err);
    return NextResponse.json(
      { error: 'Failed to list jobs' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/jobs – Perform queue actions
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  const orgId = request.headers.get('x-org-id');
  const employeeId = request.headers.get('x-employee-id');

  if (!orgId || !employeeId) {
    return NextResponse.json(
      { error: 'Missing x-org-id or x-employee-id header' },
      { status: 400 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 },
    );
  }

  const { action } = body;

  try {
    switch (action) {
      // ---------------------------------------------------------------
      // Enqueue a new job
      // ---------------------------------------------------------------
      case 'enqueue': {
        const { type, payload, priority, maxAttempts, scheduledAt } = body as {
          type?: JobType;
          payload?: Record<string, unknown>;
          priority?: 'critical' | 'high' | 'normal' | 'low';
          maxAttempts?: number;
          scheduledAt?: string;
        };

        if (!type) {
          return NextResponse.json(
            { error: 'Missing required field: type' },
            { status: 400 },
          );
        }

        const job = await enqueueJob({
          orgId,
          type,
          payload: payload ?? {},
          priority,
          maxAttempts,
          scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
          createdBy: employeeId,
        });

        return NextResponse.json({ job }, { status: 201 });
      }

      // ---------------------------------------------------------------
      // Process next pending job
      // ---------------------------------------------------------------
      case 'process': {
        const job = await processNextJob();
        if (!job) {
          return NextResponse.json({ message: 'No pending jobs' });
        }
        return NextResponse.json({ job });
      }

      // ---------------------------------------------------------------
      // Cancel a job
      // ---------------------------------------------------------------
      case 'cancel': {
        const { jobId } = body as { jobId?: string };
        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing required field: jobId' },
            { status: 400 },
          );
        }
        const job = await cancelJob(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found or cannot be cancelled' },
            { status: 404 },
          );
        }
        return NextResponse.json({ job });
      }

      // ---------------------------------------------------------------
      // Retry a failed job
      // ---------------------------------------------------------------
      case 'retry': {
        const { jobId } = body as { jobId?: string };
        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing required field: jobId' },
            { status: 400 },
          );
        }
        const job = await retryJob(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found or is not in a failed state' },
            { status: 404 },
          );
        }
        return NextResponse.json({ job });
      }

      // ---------------------------------------------------------------
      // Get status of a specific job
      // ---------------------------------------------------------------
      case 'status': {
        const { jobId } = body as { jobId?: string };
        if (!jobId) {
          return NextResponse.json(
            { error: 'Missing required field: jobId' },
            { status: 400 },
          );
        }
        const job = await getJobStatus(jobId);
        if (!job) {
          return NextResponse.json(
            { error: 'Job not found' },
            { status: 404 },
          );
        }
        return NextResponse.json({ job });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}. Valid actions: enqueue, process, cancel, retry, status` },
          { status: 400 },
        );
    }
  } catch (err) {
    console.error('[api/jobs] POST error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
