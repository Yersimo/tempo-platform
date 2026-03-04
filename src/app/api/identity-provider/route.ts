import { NextRequest, NextResponse } from 'next/server'
import {
  configureIdP,
  generateMetadata,
  handleSAMLRequest,
  generateSAMLAssertion,
  handleSAMLResponse,
  registerSAMLApp,
  configureMfaPolicy,
  enforceMfaPolicy,
  handleOIDCAuthorize,
  handleOIDCToken,
  handleOIDCUserinfo,
  revokeSession,
  getActiveSessionCount,
  syncUserDirectory,
  getUserDirectoryStatus,
  getIdPDashboard,
  getSecurityReport,
  rotateSigningCertificate,
  validateSAMLSignature,
  generateOIDCKeys,
} from '@/lib/services/identity-provider'

// GET /api/identity-provider - Dashboard, metadata, security report, sessions
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'dashboard'

    switch (action) {
      case 'dashboard': {
        const result = await getIdPDashboard(orgId)
        return NextResponse.json(result)
      }

      case 'metadata': {
        const result = await generateMetadata(orgId)
        if (!result.success) return NextResponse.json({ error: result.error }, { status: 400 })
        return new NextResponse(result.metadata, {
          headers: { 'Content-Type': 'application/xml' },
        })
      }

      case 'security-report': {
        const result = await getSecurityReport(orgId)
        return NextResponse.json(result)
      }

      case 'active-sessions': {
        const count = await getActiveSessionCount(orgId)
        return NextResponse.json({ activeSessions: count })
      }

      case 'directory-status': {
        const result = await getUserDirectoryStatus(orgId)
        return NextResponse.json(result)
      }

      case 'enforce-mfa': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await enforceMfaPolicy(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'userinfo': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await handleOIDCUserinfo(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'jwks': {
        const result = await generateOIDCKeys(orgId)
        return NextResponse.json(result.jwks || { error: result.error })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/identity-provider] Error:', error)
    return NextResponse.json({ error: error?.message || 'IdP query failed' }, { status: 500 })
  }
}

// POST /api/identity-provider - Configuration, SAML/OIDC flows, MFA, directory sync
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'configure-idp': {
        const { config } = body
        if (!config) return NextResponse.json({ error: 'config is required' }, { status: 400 })
        const result = await configureIdP(orgId, config)
        return NextResponse.json(result)
      }

      case 'register-app': {
        const { app } = body
        if (!app) return NextResponse.json({ error: 'app configuration is required' }, { status: 400 })
        const result = await registerSAMLApp(orgId, app)
        return NextResponse.json(result)
      }

      case 'saml-request': {
        const { samlRequest, relayState } = body
        if (!samlRequest) return NextResponse.json({ error: 'samlRequest is required' }, { status: 400 })
        const result = await handleSAMLRequest(orgId, samlRequest, relayState)
        return NextResponse.json(result)
      }

      case 'saml-assertion': {
        const { appId, employeeId, requestId } = body
        if (!appId || !employeeId) return NextResponse.json({ error: 'appId and employeeId are required' }, { status: 400 })
        const result = await generateSAMLAssertion(orgId, appId, employeeId, requestId)
        return NextResponse.json(result)
      }

      case 'saml-response': {
        const { samlResponse } = body
        if (!samlResponse) return NextResponse.json({ error: 'samlResponse is required' }, { status: 400 })
        const result = await handleSAMLResponse(orgId, samlResponse)
        return NextResponse.json(result)
      }

      case 'validate-signature': {
        const { signedXml } = body
        if (!signedXml) return NextResponse.json({ error: 'signedXml is required' }, { status: 400 })
        const result = await validateSAMLSignature(orgId, signedXml)
        return NextResponse.json(result)
      }

      case 'configure-mfa': {
        const { policy } = body
        if (!policy) return NextResponse.json({ error: 'policy is required' }, { status: 400 })
        const result = await configureMfaPolicy(orgId, policy)
        return NextResponse.json(result)
      }

      case 'oidc-authorize': {
        const { params } = body
        if (!params) return NextResponse.json({ error: 'params are required' }, { status: 400 })
        const result = await handleOIDCAuthorize(orgId, params)
        return NextResponse.json(result)
      }

      case 'oidc-token': {
        const { params } = body
        if (!params) return NextResponse.json({ error: 'params are required' }, { status: 400 })
        const result = await handleOIDCToken(orgId, params)
        return NextResponse.json(result)
      }

      case 'revoke-session': {
        const { sessionId } = body
        if (!sessionId) return NextResponse.json({ error: 'sessionId is required' }, { status: 400 })
        const result = await revokeSession(orgId, sessionId)
        return NextResponse.json(result)
      }

      case 'sync-directory': {
        const { users } = body
        if (!users || !Array.isArray(users)) return NextResponse.json({ error: 'users array is required' }, { status: 400 })
        const result = await syncUserDirectory(orgId, users)
        return NextResponse.json(result)
      }

      case 'rotate-certificate': {
        const { certificate, privateKey } = body
        if (!certificate) return NextResponse.json({ error: 'certificate is required' }, { status: 400 })
        const result = await rotateSigningCertificate(orgId, certificate, privateKey)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/identity-provider] Error:', error)
    return NextResponse.json({ error: error?.message || 'IdP operation failed' }, { status: 500 })
  }
}
