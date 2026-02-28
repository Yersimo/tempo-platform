import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { syncAllPendingPayroll } from '@/lib/integrations/quickbooks-sync'

// Vercel Cron Job: Runs every 6 hours to sync integrations
// Configured in vercel.json: { "path": "/api/cron/sync-integrations", "schedule": "0 */6 * * *" }

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from Vercel Cron (production) or allow in dev
    const authHeader = request.headers.get('authorization')
    if (process.env.NODE_ENV === 'production') {
      if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const results: Array<{
      orgId: string
      provider: string
      synced: number
      failed: number
      errors: string[]
    }> = []

    // Find all connected QuickBooks integrations
    const qbIntegrations = await db.select()
      .from(schema.integrations)
      .where(eq(schema.integrations.provider, 'quickbooks'))

    const connectedQB = qbIntegrations.filter(i => i.status === 'connected')

    // Sync payroll data for each connected QB integration
    for (const integration of connectedQB) {
      try {
        const syncResult = await syncAllPendingPayroll(integration.orgId)
        results.push({
          orgId: integration.orgId,
          provider: 'quickbooks',
          synced: syncResult.synced,
          failed: syncResult.failed,
          errors: syncResult.errors,
        })
      } catch (error) {
        results.push({
          orgId: integration.orgId,
          provider: 'quickbooks',
          synced: 0,
          failed: 1,
          errors: [error instanceof Error ? error.message : String(error)],
        })
      }
    }

    const totalSynced = results.reduce((sum, r) => sum + r.synced, 0)
    const totalFailed = results.reduce((sum, r) => sum + r.failed, 0)

    console.log(`[Cron] Integration sync complete: ${totalSynced} synced, ${totalFailed} failed across ${connectedQB.length} integrations`)

    return NextResponse.json({
      ok: true,
      integrations: connectedQB.length,
      totalSynced,
      totalFailed,
      results,
    })
  } catch (error) {
    console.error('[Cron] Integration sync failed:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sync failed' },
      { status: 500 }
    )
  }
}
