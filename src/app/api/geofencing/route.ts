import { NextRequest, NextResponse } from 'next/server'
import {
  createGeofenceZone,
  updateZone,
  deleteZone,
  checkLocation,
  recordGeofenceEvent,
  validateClockIn,
  validateClockOut,
  getEmployeeLocation,
  getZoneOccupancy,
  getViolationAlerts,
  getGeofenceAnalytics,
  assignZoneToEmployees,
  assignZoneToDepartments,
  getLocationHistory,
  configureOperatingHours,
  exportLocationReport,
  calculateDistanceFromZone,
  isWithinZone,
} from '@/lib/services/geofencing'

// GET /api/geofencing - Zone queries, analytics, location history, violations
export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(request.url)
    const action = url.searchParams.get('action') || 'analytics'

    switch (action) {
      case 'analytics': {
        const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined
        const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined
        const dateRange = startDate && endDate ? { start: startDate, end: endDate } : undefined
        const result = await getGeofenceAnalytics(orgId, dateRange)
        return NextResponse.json(result)
      }

      case 'violations': {
        const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined
        const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
        const result = await getViolationAlerts(orgId, { startDate, endDate, limit })
        return NextResponse.json(result)
      }

      case 'occupancy': {
        const zoneId = url.searchParams.get('zoneId')
        if (!zoneId) return NextResponse.json({ error: 'zoneId is required' }, { status: 400 })
        const result = await getZoneOccupancy(orgId, zoneId)
        return NextResponse.json(result)
      }

      case 'employee-location': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const result = await getEmployeeLocation(orgId, employeeId)
        return NextResponse.json(result)
      }

      case 'location-history': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined
        const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined
        const limit = url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined
        const result = await getLocationHistory(orgId, employeeId, { startDate, endDate, limit })
        return NextResponse.json(result)
      }

      case 'location-report': {
        const employeeId = url.searchParams.get('employeeId')
        if (!employeeId) return NextResponse.json({ error: 'employeeId is required' }, { status: 400 })
        const startDate = url.searchParams.get('startDate') ? new Date(url.searchParams.get('startDate')!) : undefined
        const endDate = url.searchParams.get('endDate') ? new Date(url.searchParams.get('endDate')!) : undefined
        const result = await exportLocationReport(orgId, employeeId, { startDate, endDate })
        return NextResponse.json(result)
      }

      case 'check-location': {
        const lat = parseFloat(url.searchParams.get('latitude') || '')
        const lon = parseFloat(url.searchParams.get('longitude') || '')
        if (isNaN(lat) || isNaN(lon)) return NextResponse.json({ error: 'latitude and longitude are required' }, { status: 400 })
        const result = await checkLocation(orgId, { latitude: lat, longitude: lon })
        return NextResponse.json(result)
      }

      case 'distance': {
        const zoneId = url.searchParams.get('zoneId')
        const lat = parseFloat(url.searchParams.get('latitude') || '')
        const lon = parseFloat(url.searchParams.get('longitude') || '')
        if (!zoneId || isNaN(lat) || isNaN(lon)) return NextResponse.json({ error: 'zoneId, latitude, and longitude are required' }, { status: 400 })
        const result = await calculateDistanceFromZone(orgId, zoneId, { latitude: lat, longitude: lon })
        return NextResponse.json(result)
      }

      case 'is-within': {
        const zoneId = url.searchParams.get('zoneId')
        const lat = parseFloat(url.searchParams.get('latitude') || '')
        const lon = parseFloat(url.searchParams.get('longitude') || '')
        if (!zoneId || isNaN(lat) || isNaN(lon)) return NextResponse.json({ error: 'zoneId, latitude, and longitude are required' }, { status: 400 })
        const result = await isWithinZone(orgId, zoneId, { latitude: lat, longitude: lon })
        return NextResponse.json({ isWithinZone: result })
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[GET /api/geofencing] Error:', error)
    return NextResponse.json({ error: error?.message || 'Geofencing query failed' }, { status: 500 })
  }
}

// POST /api/geofencing - Zone CRUD, event recording, clock-in/out validation
export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create-zone': {
        const { zone } = body
        if (!zone) return NextResponse.json({ error: 'zone data is required' }, { status: 400 })
        const result = await createGeofenceZone(orgId, zone)
        return NextResponse.json(result)
      }

      case 'update-zone': {
        const { zoneId, updates } = body
        if (!zoneId || !updates) return NextResponse.json({ error: 'zoneId and updates are required' }, { status: 400 })
        const result = await updateZone(orgId, zoneId, updates)
        return NextResponse.json(result)
      }

      case 'delete-zone': {
        const { zoneId } = body
        if (!zoneId) return NextResponse.json({ error: 'zoneId is required' }, { status: 400 })
        const result = await deleteZone(orgId, zoneId)
        return NextResponse.json(result)
      }

      case 'record-event': {
        const { zoneId, employeeId, eventType, coordinates, deviceInfo, timeEntryId } = body
        if (!zoneId || !employeeId || !eventType || !coordinates) {
          return NextResponse.json({ error: 'zoneId, employeeId, eventType, and coordinates are required' }, { status: 400 })
        }
        const result = await recordGeofenceEvent(orgId, zoneId, employeeId, eventType, coordinates, deviceInfo, timeEntryId)
        return NextResponse.json(result)
      }

      case 'validate-clock-in': {
        const { employeeId, coordinates } = body
        if (!employeeId || !coordinates) {
          return NextResponse.json({ error: 'employeeId and coordinates are required' }, { status: 400 })
        }
        const result = await validateClockIn(orgId, employeeId, coordinates)
        return NextResponse.json(result)
      }

      case 'validate-clock-out': {
        const { employeeId, coordinates } = body
        if (!employeeId || !coordinates) {
          return NextResponse.json({ error: 'employeeId and coordinates are required' }, { status: 400 })
        }
        const result = await validateClockOut(orgId, employeeId, coordinates)
        return NextResponse.json(result)
      }

      case 'assign-employees': {
        const { zoneId, employeeIds } = body
        if (!zoneId || !employeeIds?.length) {
          return NextResponse.json({ error: 'zoneId and employeeIds are required' }, { status: 400 })
        }
        const result = await assignZoneToEmployees(orgId, zoneId, employeeIds)
        return NextResponse.json(result)
      }

      case 'assign-departments': {
        const { zoneId, departmentIds } = body
        if (!zoneId || !departmentIds?.length) {
          return NextResponse.json({ error: 'zoneId and departmentIds are required' }, { status: 400 })
        }
        const result = await assignZoneToDepartments(orgId, zoneId, departmentIds)
        return NextResponse.json(result)
      }

      case 'configure-hours': {
        const { zoneId, operatingHours } = body
        if (!zoneId || !operatingHours) {
          return NextResponse.json({ error: 'zoneId and operatingHours are required' }, { status: 400 })
        }
        const result = await configureOperatingHours(orgId, zoneId, operatingHours)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error: any) {
    console.error('[POST /api/geofencing] Error:', error)
    return NextResponse.json({ error: error?.message || 'Geofencing operation failed' }, { status: 500 })
  }
}
