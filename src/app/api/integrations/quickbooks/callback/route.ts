import { NextRequest, NextResponse } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and } from 'drizzle-orm'

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const code = url.searchParams.get('code')
    const state = url.searchParams.get('state')
    const realmId = url.searchParams.get('realmId')
    const error = url.searchParams.get('error')

    if (error) {
      return NextResponse.redirect(new URL(`/settings/integrations?error=${encodeURIComponent(error)}`, request.url))
    }

    if (!code || !state || !realmId) {
      return NextResponse.redirect(new URL('/settings/integrations?error=missing_params', request.url))
    }

    const clientId = process.env.QUICKBOOKS_CLIENT_ID
    const clientSecret = process.env.QUICKBOOKS_CLIENT_SECRET

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(new URL('/settings/integrations?error=quickbooks_not_configured', request.url))
    }

    // Exchange code for tokens
    const encoded = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
    const redirectUri = `${url.origin}/api/integrations/quickbooks/callback`

    const tokenResponse = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${encoded}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }).toString(),
    })

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text()
      console.error('[QuickBooks OAuth] Token exchange failed:', errText)
      return NextResponse.redirect(new URL('/settings/integrations?error=qb_token_failed', request.url))
    }

    const tokenData = await tokenResponse.json()

    // Parse state to get orgId
    let orgId: string
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString())
      orgId = stateData.orgId
    } catch {
      return NextResponse.redirect(new URL('/settings/integrations?error=invalid_state', request.url))
    }

    // Upsert integration
    const [existing] = await db.select()
      .from(schema.integrations)
      .where(and(
        eq(schema.integrations.orgId, orgId),
        eq(schema.integrations.provider, 'quickbooks')
      ))

    const credentials = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type,
      expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
      realm_id: realmId,
    }

    const config = {
      company_id: realmId,
      sync_payroll: true,
      sync_employees: true,
    }

    if (existing) {
      await db.update(schema.integrations)
        .set({
          status: 'connected',
          credentials,
          config: { ...((existing.config as object) || {}), ...config },
          updatedAt: new Date(),
        })
        .where(eq(schema.integrations.id, existing.id))
    } else {
      await db.insert(schema.integrations).values({
        orgId,
        provider: 'quickbooks',
        name: 'QuickBooks Online',
        status: 'connected',
        credentials,
        config,
        syncDirection: 'bidirectional',
      })
    }

    return NextResponse.redirect(new URL('/settings/integrations?success=quickbooks_connected', request.url))
  } catch (error) {
    console.error('[QuickBooks OAuth] Error:', error)
    return NextResponse.redirect(new URL('/settings/integrations?error=qb_oauth_failed', request.url))
  }
}
