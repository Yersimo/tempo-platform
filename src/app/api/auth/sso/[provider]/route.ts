import { NextRequest, NextResponse } from 'next/server'
import { initiateSSOFlow, getOrgSSOProviders } from '@/lib/services/sso-handler'

// GET /api/auth/sso/google?org=org-slug-or-id
// GET /api/auth/sso/azure?org=org-slug-or-id
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  try {
    const { provider } = await params
    
    if (provider !== 'google' && provider !== 'azure') {
      return NextResponse.json(
        { error: `Unsupported SSO provider: ${provider}. Supported: google, azure` },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const orgSlugOrId = url.searchParams.get('org')
    const returnUrl = url.searchParams.get('returnUrl') || '/dashboard'

    if (!orgSlugOrId) {
      return NextResponse.json(
        { error: 'Organization ID or slug is required (pass as ?org=...)' },
        { status: 400 }
      )
    }

    // Build the redirect URI for the OAuth callback
    const redirectUri = `${url.origin}/api/auth/sso/${provider}/callback`

    const { authorizationUrl } = await initiateSSOFlow(
      provider,
      orgSlugOrId,
      redirectUri,
      returnUrl
    )

    // Redirect to the provider's login page
    return NextResponse.redirect(authorizationUrl)
  } catch (error: any) {
    console.error('[SSO Initiation] Error:', error instanceof Error ? error.message : 'Unknown error')
    
    if (error?.code === 'PROVIDER_NOT_FOUND') {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: error?.message || 'Failed to initiate SSO' },
      { status: 500 }
    )
  }
}

// POST /api/auth/sso/:provider - List available SSO providers for an org
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orgId } = body

    if (!orgId) {
      return NextResponse.json({ error: 'orgId is required' }, { status: 400 })
    }

    const providers = await getOrgSSOProviders(orgId)
    return NextResponse.json({ providers })
  } catch (error) {
    console.error('[SSO Providers] Error:', error instanceof Error ? error.message : 'Unknown error')
    return NextResponse.json({ error: 'Failed to fetch SSO providers' }, { status: 500 })
  }
}
