import { NextRequest, NextResponse } from 'next/server'
import {
  provisionDevice,
  assignDevice,
  unassignDevice,
  retireDevice,
  getDeviceInventory,
  getLicenseOverview,
  assignLicense,
  revokeLicense,
  checkDeviceCompliance,
  initiateDeviceRecovery,
  getAssetReport,
  sendDeviceCommand,
} from '@/lib/mdm-engine'

// GET /api/devices - Inventory, compliance, licenses, asset report
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'inventory'

    switch (action) {
      case 'inventory': {
        const type = url.searchParams.get('type') || undefined
        const status = url.searchParams.get('status') || undefined
        const assignedTo = url.searchParams.get('assignedTo') || undefined
        const result = await getDeviceInventory(orgId, { type: type as any, status: status as any, assignedTo })
        return NextResponse.json(result)
      }

      case 'compliance': {
        const result = await checkDeviceCompliance(orgId)
        return NextResponse.json(result)
      }

      case 'licenses': {
        const result = await getLicenseOverview(orgId)
        return NextResponse.json(result)
      }

      case 'asset-report': {
        const result = await getAssetReport(orgId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    console.error('[GET /api/devices] Error:', error)
    return NextResponse.json({ error: 'Device query failed' }, { status: 500 })
  }
}

// POST /api/devices - Provision, assign, retire, command, recovery
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'provision': {
        const { device } = body
        if (!device) {
          return NextResponse.json({ error: 'device data is required' }, { status: 400 })
        }
        const result = await provisionDevice(orgId, device)
        return NextResponse.json(result)
      }

      case 'assign': {
        const { deviceId, employeeId } = body
        if (!deviceId || !employeeId) {
          return NextResponse.json({ error: 'deviceId and employeeId are required' }, { status: 400 })
        }
        const result = await assignDevice(orgId, deviceId, employeeId)
        return NextResponse.json(result)
      }

      case 'unassign': {
        const { deviceId } = body
        if (!deviceId) {
          return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
        }
        const result = await unassignDevice(orgId, deviceId)
        return NextResponse.json(result)
      }

      case 'retire': {
        const { deviceId } = body
        if (!deviceId) {
          return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
        }
        const result = await retireDevice(orgId, deviceId)
        return NextResponse.json(result)
      }

      case 'command': {
        const { deviceId, command } = body
        if (!deviceId || !command) {
          return NextResponse.json({ error: 'deviceId and command are required' }, { status: 400 })
        }
        const result = await sendDeviceCommand(orgId, deviceId, command)
        return NextResponse.json(result)
      }

      case 'assign-license': {
        const { licenseId, employeeId } = body
        if (!licenseId || !employeeId) {
          return NextResponse.json({ error: 'licenseId and employeeId are required' }, { status: 400 })
        }
        const result = await assignLicense(orgId, licenseId, employeeId)
        return NextResponse.json(result)
      }

      case 'revoke-license': {
        const { licenseId, employeeId } = body
        if (!licenseId || !employeeId) {
          return NextResponse.json({ error: 'licenseId and employeeId are required' }, { status: 400 })
        }
        const result = await revokeLicense(orgId, licenseId, employeeId)
        return NextResponse.json(result)
      }

      case 'recovery': {
        const { employeeId } = body
        if (!employeeId) {
          return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        }
        const result = await initiateDeviceRecovery(orgId, employeeId)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/devices] Error:', error)
    return NextResponse.json({ error: error?.message || 'Device operation failed' }, { status: 500 })
  }
}
