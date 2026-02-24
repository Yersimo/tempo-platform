import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// GET /api/health - Health check endpoint for monitoring & uptime
// ---------------------------------------------------------------------------

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'degraded' | 'down'; latencyMs?: number; error?: string }> = {}
  const start = Date.now()

  // Check database connectivity
  try {
    const dbStart = Date.now()
    await db.execute(sql`SELECT 1`)
    checks.database = { status: 'ok', latencyMs: Date.now() - dbStart }
  } catch (error: any) {
    checks.database = { status: 'down', error: error.message }
  }

  // Check environment configuration
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET']
  const missingEnv = requiredEnvVars.filter(v => !process.env[v])
  checks.config = missingEnv.length === 0
    ? { status: 'ok' }
    : { status: 'degraded', error: `Missing: ${missingEnv.join(', ')}` }

  // Optional service checks
  if (process.env.STRIPE_SECRET_KEY) {
    checks.stripe = { status: 'ok' }
  }
  if (process.env.RESEND_API_KEY || process.env.SENDGRID_API_KEY) {
    checks.email = { status: 'ok' }
  }
  if (process.env.S3_ACCESS_KEY_ID) {
    checks.storage = { status: 'ok' }
  }

  // Overall status
  const allChecks = Object.values(checks)
  const overallStatus = allChecks.some(c => c.status === 'down')
    ? 'down'
    : allChecks.some(c => c.status === 'degraded')
      ? 'degraded'
      : 'ok'

  const statusCode = overallStatus === 'down' ? 503 : 200

  return NextResponse.json(
    {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime: process.uptime?.() || 0,
      version: process.env.npm_package_version || '1.0.0',
      totalLatencyMs: Date.now() - start,
      checks,
    },
    {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    }
  )
}
