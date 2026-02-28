import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

const SLACK_TOKEN_URL = 'https://slack.com/api/oauth.v2.access'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.redirect(new URL('/settings/integrations?error=missing_params', request.url))
    }

    // Exchange code for access token
    const clientId = process.env.SLACK_CLIENT_ID
    const clientSecret = process.env.SLACK_CLIENT_SECRET
    
    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/settings/integrations?error=slack_not_configured', request.url))
    }

    const tokenResponse = await fetch(SLACK_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }).toString(),
    })

    const tokenData = await tokenResponse.json()
    if (!tokenData.ok) {
      console.error('[Slack OAuth] Token exchange failed:', tokenData.error)
      return NextResponse.redirect(new URL(`/settings/integrations?error=${tokenData.error}`, request.url))
    }

    // Parse the state to get orgId
    let orgId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      orgId = stateData.orgId
    } catch {
      return NextResponse.redirect(new URL('/settings/integrations?error=invalid_state', request.url))
    }

    // Upsert the integration record
    const [existing] = await db.select()
      .from(schema.integrations)
      .where(and(
        eq(schema.integrations.orgId, orgId),
        eq(schema.integrations.provider, 'slack')
      ))

    const credentials = {
      bot_token: tokenData.access_token,
      team_id: tokenData.team?.id,
      team_name: tokenData.team?.name,
      bot_user_id: tokenData.bot_user_id,
      app_id: tokenData.app_id,
    }

    const config = {
      default_channel: tokenData.incoming_webhook?.channel_id || null,
      webhook_url: tokenData.incoming_webhook?.url || null,
    }

    if (existing) {
      await db.update(schema.integrations)
        .set({
          status: 'connected',
          credentials,
          config,
          updatedAt: new Date(),
        })
        .where(eq(schema.integrations.id, existing.id))
    } else {
      await db.insert(schema.integrations).values({
        orgId,
        provider: 'slack',
        name: `Slack - ${tokenData.team?.name || 'Workspace'}`,
        status: 'connected',
        credentials,
        config,
        syncDirection: 'outbound',
      })
    }

    // Log the connection
    try {
      await db.insert(schema.integrationLogs).values({
        integrationId: existing?.id || orgId, // best effort
        orgId,
        action: 'connect',
        status: 'success',
        details: `Connected Slack workspace: ${tokenData.team?.name}`,
      })
    } catch { /* non-critical */ }

    return NextResponse.redirect(new URL('/settings/integrations?success=slack_connected', request.url))
  } catch (error) {
    console.error('[Slack OAuth] Error:', error)
    return NextResponse.redirect(new URL('/settings/integrations?error=slack_oauth_failed', request.url))
  }
}
