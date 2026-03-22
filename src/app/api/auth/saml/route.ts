import { NextRequest, NextResponse } from 'next/server'
import {
  generateAuthnRequest,
  parseSAMLResponse,
  generateSPMetadata,
  type SAMLConfig,
} from '@/lib/services/saml-handler'

// Default SP config — in production, load from DB per-org
function getSAMLConfig(orgId: string): SAMLConfig {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://theworktempo.com'
  return {
    entityId: `${baseUrl}/saml/metadata`,
    acsUrl: `${baseUrl}/api/auth/saml`,
    sloUrl: `${baseUrl}/api/auth/saml/logout`,
    idpMetadata: {
      entityId: process.env.SAML_IDP_ENTITY_ID || '',
      ssoUrl: process.env.SAML_IDP_SSO_URL || '',
      sloUrl: process.env.SAML_IDP_SLO_URL || '',
      certificate: process.env.SAML_IDP_CERTIFICATE || '',
    },
    signRequests: !!process.env.SAML_SP_PRIVATE_KEY,
    spPrivateKey: process.env.SAML_SP_PRIVATE_KEY,
    spCertificate: process.env.SAML_SP_CERTIFICATE,
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const action = searchParams.get('action')
  const orgId = request.headers.get('x-org-id') || 'default'

  const config = getSAMLConfig(orgId)

  if (action === 'metadata') {
    const metadata = generateSPMetadata(config)
    return new NextResponse(metadata, {
      status: 200,
      headers: { 'Content-Type': 'application/xml' },
    })
  }

  if (action === 'login') {
    if (!config.idpMetadata.ssoUrl) {
      return NextResponse.json(
        { error: 'SAML IdP SSO URL not configured' },
        { status: 500 }
      )
    }

    const { url, requestId } = generateAuthnRequest(config)

    // Store requestId in a cookie for validation on callback
    const response = NextResponse.redirect(url)
    response.cookies.set('saml_request_id', requestId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'none', // Required for cross-origin SAML POST
      maxAge: 300, // 5 minutes
      path: '/',
    })

    return response
  }

  return NextResponse.json(
    { error: 'Invalid action. Use action=metadata or action=login' },
    { status: 400 }
  )
}

export async function POST(request: NextRequest) {
  const orgId = request.headers.get('x-org-id') || 'default'
  const config = getSAMLConfig(orgId)

  // Parse the form-encoded SAML response
  const formData = await request.formData()
  const samlResponse = formData.get('SAMLResponse') as string | null
  const relayState = formData.get('RelayState') as string | null

  if (!samlResponse) {
    return NextResponse.json(
      { error: 'Missing SAMLResponse in POST body' },
      { status: 400 }
    )
  }

  const result = parseSAMLResponse(samlResponse, config)

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || 'SAML authentication failed' },
      { status: 401 }
    )
  }

  // In production: look up user by email, create session, set JWT cookie
  // For now, return the parsed SAML attributes
  const redirectUrl = relayState || '/'

  // Clear the SAML request ID cookie
  const response = NextResponse.redirect(new URL(redirectUrl, request.url))
  response.cookies.delete('saml_request_id')

  // Set a session indicator — in production, this would be a full JWT
  response.cookies.set('saml_session', JSON.stringify({
    email: result.email,
    nameId: result.nameId,
    sessionIndex: result.sessionIndex,
    attributes: result.attributes,
    authenticatedAt: new Date().toISOString(),
  }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400, // 24 hours
    path: '/',
  })

  return response
}
