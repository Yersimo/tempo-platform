import { NextRequest, NextResponse } from 'next/server'
import {
  createProfile,
  updateProfile,
  deleteProfile,
  generateEnrollmentToken,
  assignTokenToEmployee,
  activateDevice,
  configureDevice,
  installApps,
  applySecurityPolicies,
  getDeploymentStatus,
  getDeploymentAnalytics,
  createBulkTokens,
  retryFailedDeployment,
  getDeviceSetupProgress,
  linkToABM,
  linkToWindowsAutopilot,
  validateProfile,
} from '@/lib/services/zero-touch-deployment'

// GET /api/zero-touch - Analytics, deployment status, profile validation
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'analytics'

    switch (action) {
      case 'analytics': {
        const result = await getDeploymentAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'deployment-status': {
        const tokenId = url.searchParams.get('tokenId')
        if (!tokenId) return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
        const result = await getDeploymentStatus(orgId, tokenId)
        return NextResponse.json(result)
      }

      case 'device-progress': {
        const deviceId = url.searchParams.get('deviceId')
        if (!deviceId) return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
        const result = await getDeviceSetupProgress(orgId, deviceId)
        return NextResponse.json(result)
      }

      case 'validate-profile': {
        const profileId = url.searchParams.get('profileId')
        if (!profileId) return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
        const result = await validateProfile(orgId, profileId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/zero-touch] Error:', error)
    return NextResponse.json({ error: error?.message || 'Zero-touch query failed' }, { status: 500 })
  }
}

// POST /api/zero-touch - Profile management, token operations, device activation
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-profile': {
        const { profile } = body
        if (!profile) return NextResponse.json({ error: 'profile data is required' }, { status: 400 })
        const result = await createProfile(orgId, profile)
        return NextResponse.json(result)
      }

      case 'update-profile': {
        const { profileId, updates } = body
        if (!profileId || !updates) return NextResponse.json({ error: 'profileId and updates are required' }, { status: 400 })
        const result = await updateProfile(orgId, profileId, updates)
        return NextResponse.json(result)
      }

      case 'delete-profile': {
        const { profileId } = body
        if (!profileId) return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
        const result = await deleteProfile(orgId, profileId)
        return NextResponse.json(result)
      }

      case 'generate-token': {
        const { profileId, expiresInHours } = body
        if (!profileId) return NextResponse.json({ error: 'profileId is required' }, { status: 400 })
        const result = await generateEnrollmentToken(orgId, profileId, expiresInHours)
        return NextResponse.json(result)
      }

      case 'assign-token': {
        const { tokenId, employeeId } = body
        if (!tokenId || !employeeId) return NextResponse.json({ error: 'tokenId and employeeId are required' }, { status: 400 })
        const result = await assignTokenToEmployee(orgId, tokenId, employeeId)
        return NextResponse.json(result)
      }

      case 'bulk-tokens': {
        const { profileId, count: tokenCount, expiresInHours } = body
        if (!profileId || !tokenCount) return NextResponse.json({ error: 'profileId and count are required' }, { status: 400 })
        const result = await createBulkTokens(orgId, profileId, tokenCount, expiresInHours)
        return NextResponse.json(result)
      }

      case 'activate-device': {
        const { token, deviceId } = body
        if (!token || !deviceId) return NextResponse.json({ error: 'token and deviceId are required' }, { status: 400 })
        const result = await activateDevice(orgId, token, deviceId)
        return NextResponse.json(result)
      }

      case 'configure-device': {
        const { profileId, deviceId } = body
        if (!profileId || !deviceId) return NextResponse.json({ error: 'profileId and deviceId are required' }, { status: 400 })
        const result = await configureDevice(orgId, profileId, deviceId)
        return NextResponse.json(result)
      }

      case 'install-apps': {
        const { profileId, deviceId } = body
        if (!profileId || !deviceId) return NextResponse.json({ error: 'profileId and deviceId are required' }, { status: 400 })
        const result = await installApps(orgId, profileId, deviceId)
        return NextResponse.json(result)
      }

      case 'apply-policies': {
        const { profileId, deviceId } = body
        if (!profileId || !deviceId) return NextResponse.json({ error: 'profileId and deviceId are required' }, { status: 400 })
        const result = await applySecurityPolicies(orgId, profileId, deviceId)
        return NextResponse.json(result)
      }

      case 'retry-deployment': {
        const { tokenId } = body
        if (!tokenId) return NextResponse.json({ error: 'tokenId is required' }, { status: 400 })
        const result = await retryFailedDeployment(orgId, tokenId)
        return NextResponse.json(result)
      }

      case 'link-abm': {
        const { profileId, abmConfig } = body
        if (!profileId || !abmConfig) return NextResponse.json({ error: 'profileId and abmConfig are required' }, { status: 400 })
        const result = await linkToABM(orgId, profileId, abmConfig)
        return NextResponse.json(result)
      }

      case 'link-autopilot': {
        const { profileId, autopilotConfig } = body
        if (!profileId || !autopilotConfig) return NextResponse.json({ error: 'profileId and autopilotConfig are required' }, { status: 400 })
        const result = await linkToWindowsAutopilot(orgId, profileId, autopilotConfig)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/zero-touch] Error:', error)
    return NextResponse.json({ error: error?.message || 'Zero-touch operation failed' }, { status: 500 })
  }
}
