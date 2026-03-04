// Tempo Geofencing Service
// GPS-based zone management, clock-in/out validation, violation alerts, occupancy tracking.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, gte, lte, between } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export type GeofenceType = 'office' | 'warehouse' | 'job_site' | 'client_location' | 'restricted'
export type GeofenceEventType = 'entry' | 'exit' | 'clock_in' | 'clock_out' | 'violation'

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
}

export interface OperatingHours {
  [day: string]: { start: string; end: string } // e.g. { monday: { start: '09:00', end: '17:00' } }
}

export interface CreateZoneData {
  name: string
  type: GeofenceType
  latitude: number
  longitude: number
  radiusMeters: number
  address?: string
  requireClockInWithin?: boolean
  alertOnViolation?: boolean
  operatingHours?: OperatingHours
}

export interface GeofenceAnalytics {
  totalZones: number
  activeZones: number
  totalEvents: number
  complianceRate: number
  violationsByZone: Array<{ zoneId: string; zoneName: string; violations: number }>
  eventsByType: Record<string, number>
  averageOccupancy: number
  peakOccupancy: number
  topZonesByActivity: Array<{ zoneId: string; zoneName: string; eventCount: number }>
}

export interface LocationReport {
  employeeId: string
  employeeName: string
  entries: Array<{
    zoneId: string
    zoneName: string
    eventType: string
    timestamp: Date
    latitude: number
    longitude: number
    isWithinZone: boolean
    distanceFromCenter: number | null
  }>
  totalEvents: number
  zonesVisited: number
  complianceRate: number
}

// ============================================================
// Constants
// ============================================================

const EARTH_RADIUS_METERS = 6_371_000

// ============================================================
// Haversine Distance Calculation
// ============================================================

/**
 * Calculate the great-circle distance between two GPS coordinates using the Haversine formula.
 * Returns distance in meters.
 */
function haversineDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return EARTH_RADIUS_METERS * c
}

// ============================================================
// Zone Management
// ============================================================

/**
 * Create a new geofence zone with configurable radius, type, and operating hours.
 */
export async function createGeofenceZone(
  orgId: string,
  data: CreateZoneData
): Promise<{ success: boolean; zone?: typeof schema.geofenceZones.$inferSelect; error?: string }> {
  try {
    if (data.radiusMeters < 10 || data.radiusMeters > 100_000) {
      return { success: false, error: 'Radius must be between 10 and 100,000 meters' }
    }

    if (data.latitude < -90 || data.latitude > 90) {
      return { success: false, error: 'Latitude must be between -90 and 90' }
    }

    if (data.longitude < -180 || data.longitude > 180) {
      return { success: false, error: 'Longitude must be between -180 and 180' }
    }

    const [zone] = await db
      .insert(schema.geofenceZones)
      .values({
        orgId,
        name: data.name,
        type: data.type,
        latitude: data.latitude,
        longitude: data.longitude,
        radiusMeters: data.radiusMeters,
        address: data.address ?? null,
        requireClockInWithin: data.requireClockInWithin ?? false,
        alertOnViolation: data.alertOnViolation ?? true,
        operatingHours: data.operatingHours ?? null,
        isActive: true,
      })
      .returning()

    return { success: true, zone }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to create geofence zone',
    }
  }
}

/**
 * Update an existing geofence zone configuration.
 */
export async function updateZone(
  orgId: string,
  zoneId: string,
  updates: Partial<CreateZoneData> & { isActive?: boolean }
): Promise<{ success: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    if (updates.radiusMeters !== undefined && (updates.radiusMeters < 10 || updates.radiusMeters > 100_000)) {
      return { success: false, error: 'Radius must be between 10 and 100,000 meters' }
    }

    if (updates.latitude !== undefined && (updates.latitude < -90 || updates.latitude > 90)) {
      return { success: false, error: 'Latitude must be between -90 and 90' }
    }

    if (updates.longitude !== undefined && (updates.longitude < -180 || updates.longitude > 180)) {
      return { success: false, error: 'Longitude must be between -180 and 180' }
    }

    const setValues: Record<string, any> = {}
    if (updates.name !== undefined) setValues.name = updates.name
    if (updates.type !== undefined) setValues.type = updates.type
    if (updates.latitude !== undefined) setValues.latitude = updates.latitude
    if (updates.longitude !== undefined) setValues.longitude = updates.longitude
    if (updates.radiusMeters !== undefined) setValues.radiusMeters = updates.radiusMeters
    if (updates.address !== undefined) setValues.address = updates.address
    if (updates.requireClockInWithin !== undefined) setValues.requireClockInWithin = updates.requireClockInWithin
    if (updates.alertOnViolation !== undefined) setValues.alertOnViolation = updates.alertOnViolation
    if (updates.operatingHours !== undefined) setValues.operatingHours = updates.operatingHours
    if (updates.isActive !== undefined) setValues.isActive = updates.isActive

    if (Object.keys(setValues).length === 0) {
      return { success: false, error: 'No update fields provided' }
    }

    await db
      .update(schema.geofenceZones)
      .set(setValues)
      .where(eq(schema.geofenceZones.id, zoneId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to update geofence zone',
    }
  }
}

/**
 * Delete a geofence zone. Also removes all associated events.
 */
export async function deleteZone(
  orgId: string,
  zoneId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    await db.delete(schema.geofenceZones).where(eq(schema.geofenceZones.id, zoneId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to delete geofence zone',
    }
  }
}

// ============================================================
// Location Check & Distance
// ============================================================

/**
 * Check whether a set of coordinates falls within any active geofence zone for the organization.
 * Returns matched zones with distance calculations.
 */
export async function checkLocation(
  orgId: string,
  coords: Coordinates
): Promise<{
  zones: Array<{
    zoneId: string
    zoneName: string
    type: string
    isWithin: boolean
    distanceMeters: number
    radiusMeters: number
  }>
}> {
  const zones = await db
    .select()
    .from(schema.geofenceZones)
    .where(and(eq(schema.geofenceZones.orgId, orgId), eq(schema.geofenceZones.isActive, true)))

  const results = zones.map(zone => {
    const distance = haversineDistance(
      coords.latitude, coords.longitude,
      zone.latitude, zone.longitude
    )
    return {
      zoneId: zone.id,
      zoneName: zone.name,
      type: zone.type,
      isWithin: distance <= zone.radiusMeters,
      distanceMeters: Math.round(distance * 100) / 100,
      radiusMeters: zone.radiusMeters,
    }
  })

  return { zones: results }
}

/**
 * Calculate the distance in meters from a point to a specific geofence zone center.
 */
export async function calculateDistanceFromZone(
  orgId: string,
  zoneId: string,
  coords: Coordinates
): Promise<{ success: boolean; distanceMeters?: number; isWithin?: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found' }
    }

    const distance = haversineDistance(
      coords.latitude, coords.longitude,
      zone.latitude, zone.longitude
    )

    return {
      success: true,
      distanceMeters: Math.round(distance * 100) / 100,
      isWithin: distance <= zone.radiusMeters,
    }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to calculate distance',
    }
  }
}

/**
 * Determine if a coordinate is within a specific zone's radius.
 */
export async function isWithinZone(
  orgId: string,
  zoneId: string,
  coords: Coordinates
): Promise<boolean> {
  const result = await calculateDistanceFromZone(orgId, zoneId, coords)
  return result.isWithin === true
}

// ============================================================
// Event Recording
// ============================================================

/**
 * Record a geofence event (entry, exit, clock_in, clock_out, violation).
 * Calculates distance from zone center automatically.
 */
export async function recordGeofenceEvent(
  orgId: string,
  zoneId: string,
  employeeId: string,
  eventType: GeofenceEventType,
  coords: Coordinates,
  deviceInfo?: Record<string, string>,
  timeEntryId?: string
): Promise<{ success: boolean; event?: typeof schema.geofenceEvents.$inferSelect; error?: string }> {
  try {
    // Validate zone exists and belongs to org
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    // Validate employee exists and belongs to org
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) {
      return { success: false, error: 'Employee not found in this organization' }
    }

    const distance = haversineDistance(
      coords.latitude, coords.longitude,
      zone.latitude, zone.longitude
    )
    const withinZone = distance <= zone.radiusMeters

    const [event] = await db
      .insert(schema.geofenceEvents)
      .values({
        orgId,
        zoneId,
        employeeId,
        eventType,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy ?? null,
        distanceFromCenter: Math.round(distance * 100) / 100,
        isWithinZone: withinZone,
        deviceInfo: deviceInfo ?? null,
        timeEntryId: timeEntryId ?? null,
      })
      .returning()

    return { success: true, event }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record geofence event',
    }
  }
}

// ============================================================
// Clock-In / Clock-Out Validation
// ============================================================

/**
 * Validate a clock-in attempt against geofence zones.
 * Checks if the employee is within any zone that requires clock-in-within.
 * Also enforces operating hours if configured.
 */
export async function validateClockIn(
  orgId: string,
  employeeId: string,
  coords: Coordinates
): Promise<{
  allowed: boolean
  matchedZone?: { id: string; name: string; distance: number }
  reason?: string
  violations: string[]
}> {
  const violations: string[] = []

  // Get all active zones that require clock-in within
  const zones = await db
    .select()
    .from(schema.geofenceZones)
    .where(and(
      eq(schema.geofenceZones.orgId, orgId),
      eq(schema.geofenceZones.isActive, true),
      eq(schema.geofenceZones.requireClockInWithin, true)
    ))

  // If no zones require geofence-based clock-in, allow it
  if (zones.length === 0) {
    return { allowed: true, violations: [] }
  }

  // Check if employee is assigned to any of these zones
  const assignedZones = zones.filter(zone => {
    const assignedEmployees = (zone.assignedEmployees as string[] | null) ?? []
    const assignedDepts = (zone.assignedDepartments as string[] | null) ?? []
    // If no assignments, the zone applies to everyone
    if (assignedEmployees.length === 0 && assignedDepts.length === 0) return true
    return assignedEmployees.includes(employeeId)
  })

  if (assignedZones.length === 0) {
    // Employee is not assigned to any geofenced zone; allow clock-in
    return { allowed: true, violations: [] }
  }

  // Check each assigned zone for proximity
  let closestZone: { id: string; name: string; distance: number } | null = null

  for (const zone of assignedZones) {
    const distance = haversineDistance(
      coords.latitude, coords.longitude,
      zone.latitude, zone.longitude
    )

    if (!closestZone || distance < closestZone.distance) {
      closestZone = { id: zone.id, name: zone.name, distance: Math.round(distance) }
    }

    if (distance <= zone.radiusMeters) {
      // Within zone - check operating hours
      const operatingHours = zone.operatingHours as OperatingHours | null
      if (operatingHours) {
        const now = new Date()
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()]
        const dayHours = operatingHours[dayOfWeek]

        if (dayHours) {
          const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
          if (currentTime < dayHours.start || currentTime > dayHours.end) {
            violations.push(`Clock-in outside operating hours for zone "${zone.name}" (${dayHours.start} - ${dayHours.end})`)
          }
        } else {
          violations.push(`Zone "${zone.name}" is not configured for ${dayOfWeek}`)
        }
      }

      // Record the clock-in event
      await recordGeofenceEvent(orgId, zone.id, employeeId, 'clock_in', coords)

      return {
        allowed: violations.length === 0,
        matchedZone: { id: zone.id, name: zone.name, distance: Math.round(distance) },
        violations,
      }
    }
  }

  // Employee is not within any assigned zone
  const violationMsg = closestZone
    ? `Employee is ${closestZone.distance}m away from nearest zone "${closestZone.name}"`
    : 'Employee is not within any assigned geofence zone'

  violations.push(violationMsg)

  // Record violation event for the closest zone
  if (closestZone) {
    await recordGeofenceEvent(orgId, closestZone.id, employeeId, 'violation', coords)
  }

  return {
    allowed: false,
    matchedZone: closestZone ?? undefined,
    reason: violationMsg,
    violations,
  }
}

/**
 * Validate a clock-out attempt against geofence zones.
 * Records the exit event and checks for any anomalies.
 */
export async function validateClockOut(
  orgId: string,
  employeeId: string,
  coords: Coordinates
): Promise<{
  allowed: boolean
  matchedZone?: { id: string; name: string; distance: number }
  isRemoteClockOut: boolean
  violations: string[]
}> {
  const violations: string[] = []

  // Get all active zones
  const zones = await db
    .select()
    .from(schema.geofenceZones)
    .where(and(eq(schema.geofenceZones.orgId, orgId), eq(schema.geofenceZones.isActive, true)))

  let matchedZone: { id: string; name: string; distance: number } | null = null
  let isRemoteClockOut = true

  for (const zone of zones) {
    const distance = haversineDistance(
      coords.latitude, coords.longitude,
      zone.latitude, zone.longitude
    )

    if (distance <= zone.radiusMeters) {
      matchedZone = { id: zone.id, name: zone.name, distance: Math.round(distance) }
      isRemoteClockOut = false

      // Record the clock-out event
      await recordGeofenceEvent(orgId, zone.id, employeeId, 'clock_out', coords)
      break
    }

    if (!matchedZone || distance < matchedZone.distance) {
      matchedZone = { id: zone.id, name: zone.name, distance: Math.round(distance) }
    }
  }

  // If remote clock-out, record it as a potential violation on nearest zone
  if (isRemoteClockOut && matchedZone) {
    violations.push(`Clock-out occurred ${matchedZone.distance}m away from nearest zone "${matchedZone.name}"`)
    await recordGeofenceEvent(orgId, matchedZone.id, employeeId, 'clock_out', coords)
  }

  // Clock-out is always allowed, but remote clock-outs are flagged
  return {
    allowed: true,
    matchedZone: matchedZone ?? undefined,
    isRemoteClockOut,
    violations,
  }
}

// ============================================================
// Employee Location & Zone Occupancy
// ============================================================

/**
 * Get the most recent location of an employee based on geofence events.
 */
export async function getEmployeeLocation(
  orgId: string,
  employeeId: string
): Promise<{
  lastKnown: {
    latitude: number
    longitude: number
    timestamp: Date
    zoneId: string
    zoneName: string
    isWithinZone: boolean
    eventType: string
  } | null
}> {
  const [latest] = await db
    .select({
      latitude: schema.geofenceEvents.latitude,
      longitude: schema.geofenceEvents.longitude,
      timestamp: schema.geofenceEvents.timestamp,
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      isWithinZone: schema.geofenceEvents.isWithinZone,
      eventType: schema.geofenceEvents.eventType,
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(
      eq(schema.geofenceEvents.orgId, orgId),
      eq(schema.geofenceEvents.employeeId, employeeId)
    ))
    .orderBy(desc(schema.geofenceEvents.timestamp))
    .limit(1)

  return { lastKnown: latest ?? null }
}

/**
 * Get current occupancy for a specific geofence zone.
 * Calculates by looking at recent entry/exit events within the last 24 hours.
 */
export async function getZoneOccupancy(
  orgId: string,
  zoneId: string
): Promise<{
  zoneId: string
  zoneName: string
  currentOccupancy: number
  employeesPresent: Array<{ employeeId: string; employeeName: string; enteredAt: Date }>
}> {
  const [zone] = await db
    .select()
    .from(schema.geofenceZones)
    .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
    .limit(1)

  if (!zone) {
    return { zoneId, zoneName: 'Unknown', currentOccupancy: 0, employeesPresent: [] }
  }

  // Get the most recent event per employee within the last 24 hours for this zone
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

  const recentEvents = await db
    .select({
      employeeId: schema.geofenceEvents.employeeId,
      employeeName: schema.employees.fullName,
      eventType: schema.geofenceEvents.eventType,
      timestamp: schema.geofenceEvents.timestamp,
      isWithinZone: schema.geofenceEvents.isWithinZone,
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.employees, eq(schema.geofenceEvents.employeeId, schema.employees.id))
    .where(and(
      eq(schema.geofenceEvents.orgId, orgId),
      eq(schema.geofenceEvents.zoneId, zoneId),
      gte(schema.geofenceEvents.timestamp, twentyFourHoursAgo)
    ))
    .orderBy(desc(schema.geofenceEvents.timestamp))

  // Determine who is currently "in" the zone based on their last event
  const lastEventPerEmployee = new Map<string, { employeeName: string; eventType: string; timestamp: Date; isWithinZone: boolean }>()

  for (const event of recentEvents) {
    if (!lastEventPerEmployee.has(event.employeeId)) {
      lastEventPerEmployee.set(event.employeeId, {
        employeeName: event.employeeName,
        eventType: event.eventType,
        timestamp: event.timestamp,
        isWithinZone: event.isWithinZone,
      })
    }
  }

  const employeesPresent: Array<{ employeeId: string; employeeName: string; enteredAt: Date }> = []

  for (const [employeeId, data] of lastEventPerEmployee.entries()) {
    // Employee is present if their last event was an entry or clock_in and they were within the zone
    if ((data.eventType === 'entry' || data.eventType === 'clock_in') && data.isWithinZone) {
      employeesPresent.push({
        employeeId,
        employeeName: data.employeeName,
        enteredAt: data.timestamp,
      })
    }
  }

  return {
    zoneId,
    zoneName: zone.name,
    currentOccupancy: employeesPresent.length,
    employeesPresent,
  }
}

// ============================================================
// Violation Alerts
// ============================================================

/**
 * Get all violation alerts for the organization, optionally filtered by date range.
 */
export async function getViolationAlerts(
  orgId: string,
  options?: { startDate?: Date; endDate?: Date; limit?: number }
): Promise<{
  violations: Array<{
    id: string
    employeeId: string
    employeeName: string
    zoneId: string
    zoneName: string
    eventType: string
    latitude: number
    longitude: number
    distanceFromCenter: number | null
    timestamp: Date
  }>
  totalViolations: number
}> {
  const conditions = [
    eq(schema.geofenceEvents.orgId, orgId),
    eq(schema.geofenceEvents.eventType, 'violation'),
  ]

  if (options?.startDate) {
    conditions.push(gte(schema.geofenceEvents.timestamp, options.startDate))
  }

  if (options?.endDate) {
    conditions.push(lte(schema.geofenceEvents.timestamp, options.endDate))
  }

  const [countResult] = await db
    .select({ cnt: count() })
    .from(schema.geofenceEvents)
    .where(and(...conditions))

  const violations = await db
    .select({
      id: schema.geofenceEvents.id,
      employeeId: schema.geofenceEvents.employeeId,
      employeeName: schema.employees.fullName,
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      eventType: schema.geofenceEvents.eventType,
      latitude: schema.geofenceEvents.latitude,
      longitude: schema.geofenceEvents.longitude,
      distanceFromCenter: schema.geofenceEvents.distanceFromCenter,
      timestamp: schema.geofenceEvents.timestamp,
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.employees, eq(schema.geofenceEvents.employeeId, schema.employees.id))
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(...conditions))
    .orderBy(desc(schema.geofenceEvents.timestamp))
    .limit(options?.limit ?? 100)

  return {
    violations,
    totalViolations: Number(countResult?.cnt ?? 0),
  }
}

// ============================================================
// Analytics & Reporting
// ============================================================

/**
 * Generate comprehensive geofencing analytics for the organization.
 */
export async function getGeofenceAnalytics(
  orgId: string,
  dateRange?: { start: Date; end: Date }
): Promise<GeofenceAnalytics> {
  // Get all zones
  const zones = await db
    .select()
    .from(schema.geofenceZones)
    .where(eq(schema.geofenceZones.orgId, orgId))

  const totalZones = zones.length
  const activeZones = zones.filter(z => z.isActive).length

  // Event conditions
  const eventConditions = [eq(schema.geofenceEvents.orgId, orgId)]
  if (dateRange?.start) eventConditions.push(gte(schema.geofenceEvents.timestamp, dateRange.start))
  if (dateRange?.end) eventConditions.push(lte(schema.geofenceEvents.timestamp, dateRange.end))

  // Total events
  const [eventCountResult] = await db
    .select({ cnt: count() })
    .from(schema.geofenceEvents)
    .where(and(...eventConditions))

  const totalEvents = Number(eventCountResult?.cnt ?? 0)

  // Events by type
  const eventsByTypeRows = await db
    .select({
      eventType: schema.geofenceEvents.eventType,
      cnt: count(),
    })
    .from(schema.geofenceEvents)
    .where(and(...eventConditions))
    .groupBy(schema.geofenceEvents.eventType)

  const eventsByType: Record<string, number> = {}
  for (const row of eventsByTypeRows) {
    eventsByType[row.eventType] = Number(row.cnt)
  }

  // Violations by zone
  const violationsByZoneRows = await db
    .select({
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      cnt: count(),
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(...eventConditions, eq(schema.geofenceEvents.eventType, 'violation')))
    .groupBy(schema.geofenceEvents.zoneId, schema.geofenceZones.name)
    .orderBy(desc(count()))

  const violationsByZone = violationsByZoneRows.map(r => ({
    zoneId: r.zoneId,
    zoneName: r.zoneName,
    violations: Number(r.cnt),
  }))

  // Top zones by activity
  const topZonesRows = await db
    .select({
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      cnt: count(),
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(...eventConditions))
    .groupBy(schema.geofenceEvents.zoneId, schema.geofenceZones.name)
    .orderBy(desc(count()))
    .limit(10)

  const topZonesByActivity = topZonesRows.map(r => ({
    zoneId: r.zoneId,
    zoneName: r.zoneName,
    eventCount: Number(r.cnt),
  }))

  // Compliance rate: (total non-violation events) / total events
  const violationCount = Number(eventsByType['violation'] ?? 0)
  const complianceRate = totalEvents > 0
    ? Math.round(((totalEvents - violationCount) / totalEvents) * 100)
    : 100

  // Occupancy metrics - approximate based on entry events in the last 24h
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const occupancyRows = await db
    .select({
      zoneId: schema.geofenceEvents.zoneId,
      cnt: count(),
    })
    .from(schema.geofenceEvents)
    .where(and(
      eq(schema.geofenceEvents.orgId, orgId),
      eq(schema.geofenceEvents.eventType, 'entry'),
      gte(schema.geofenceEvents.timestamp, twentyFourHoursAgo)
    ))
    .groupBy(schema.geofenceEvents.zoneId)

  const occupancyCounts = occupancyRows.map(r => Number(r.cnt))
  const averageOccupancy = occupancyCounts.length > 0
    ? Math.round(occupancyCounts.reduce((a, b) => a + b, 0) / occupancyCounts.length)
    : 0
  const peakOccupancy = occupancyCounts.length > 0
    ? Math.max(...occupancyCounts)
    : 0

  return {
    totalZones,
    activeZones,
    totalEvents,
    complianceRate,
    violationsByZone,
    eventsByType,
    averageOccupancy,
    peakOccupancy,
    topZonesByActivity,
  }
}

// ============================================================
// Zone Assignments
// ============================================================

/**
 * Assign a geofence zone to specific employees.
 */
export async function assignZoneToEmployees(
  orgId: string,
  zoneId: string,
  employeeIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    // Validate all employees belong to org
    for (const empId of employeeIds) {
      const [emp] = await db
        .select({ id: schema.employees.id })
        .from(schema.employees)
        .where(and(eq(schema.employees.id, empId), eq(schema.employees.orgId, orgId)))
        .limit(1)

      if (!emp) {
        return { success: false, error: `Employee ${empId} not found in this organization` }
      }
    }

    const existing = (zone.assignedEmployees as string[] | null) ?? []
    const merged = [...new Set([...existing, ...employeeIds])]

    await db
      .update(schema.geofenceZones)
      .set({ assignedEmployees: merged })
      .where(eq(schema.geofenceZones.id, zoneId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign zone to employees',
    }
  }
}

/**
 * Assign a geofence zone to specific departments.
 */
export async function assignZoneToDepartments(
  orgId: string,
  zoneId: string,
  departmentIds: string[]
): Promise<{ success: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    // Validate departments
    for (const deptId of departmentIds) {
      const [dept] = await db
        .select({ id: schema.departments.id })
        .from(schema.departments)
        .where(and(eq(schema.departments.id, deptId), eq(schema.departments.orgId, orgId)))
        .limit(1)

      if (!dept) {
        return { success: false, error: `Department ${deptId} not found in this organization` }
      }
    }

    const existing = (zone.assignedDepartments as string[] | null) ?? []
    const merged = [...new Set([...existing, ...departmentIds])]

    await db
      .update(schema.geofenceZones)
      .set({ assignedDepartments: merged })
      .where(eq(schema.geofenceZones.id, zoneId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign zone to departments',
    }
  }
}

// ============================================================
// Location History & Operating Hours
// ============================================================

/**
 * Get the location history for an employee within a date range.
 */
export async function getLocationHistory(
  orgId: string,
  employeeId: string,
  options?: { startDate?: Date; endDate?: Date; limit?: number }
): Promise<{
  events: Array<{
    id: string
    zoneId: string
    zoneName: string
    eventType: string
    latitude: number
    longitude: number
    isWithinZone: boolean
    distanceFromCenter: number | null
    timestamp: Date
  }>
  totalEvents: number
}> {
  const conditions = [
    eq(schema.geofenceEvents.orgId, orgId),
    eq(schema.geofenceEvents.employeeId, employeeId),
  ]

  if (options?.startDate) {
    conditions.push(gte(schema.geofenceEvents.timestamp, options.startDate))
  }

  if (options?.endDate) {
    conditions.push(lte(schema.geofenceEvents.timestamp, options.endDate))
  }

  const [countResult] = await db
    .select({ cnt: count() })
    .from(schema.geofenceEvents)
    .where(and(...conditions))

  const events = await db
    .select({
      id: schema.geofenceEvents.id,
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      eventType: schema.geofenceEvents.eventType,
      latitude: schema.geofenceEvents.latitude,
      longitude: schema.geofenceEvents.longitude,
      isWithinZone: schema.geofenceEvents.isWithinZone,
      distanceFromCenter: schema.geofenceEvents.distanceFromCenter,
      timestamp: schema.geofenceEvents.timestamp,
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(...conditions))
    .orderBy(desc(schema.geofenceEvents.timestamp))
    .limit(options?.limit ?? 500)

  return {
    events,
    totalEvents: Number(countResult?.cnt ?? 0),
  }
}

/**
 * Configure operating hours for a geofence zone.
 */
export async function configureOperatingHours(
  orgId: string,
  zoneId: string,
  operatingHours: OperatingHours
): Promise<{ success: boolean; error?: string }> {
  try {
    const [zone] = await db
      .select()
      .from(schema.geofenceZones)
      .where(and(eq(schema.geofenceZones.id, zoneId), eq(schema.geofenceZones.orgId, orgId)))
      .limit(1)

    if (!zone) {
      return { success: false, error: 'Geofence zone not found in this organization' }
    }

    // Validate operating hours format
    const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/

    for (const [day, hours] of Object.entries(operatingHours)) {
      if (!validDays.includes(day)) {
        return { success: false, error: `Invalid day: ${day}` }
      }
      if (!timeRegex.test(hours.start) || !timeRegex.test(hours.end)) {
        return { success: false, error: `Invalid time format for ${day}. Use HH:MM format.` }
      }
      if (hours.start >= hours.end) {
        return { success: false, error: `Start time must be before end time for ${day}` }
      }
    }

    await db
      .update(schema.geofenceZones)
      .set({ operatingHours })
      .where(eq(schema.geofenceZones.id, zoneId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to configure operating hours',
    }
  }
}

/**
 * Export a location report for an employee, aggregating zone activity and compliance metrics.
 */
export async function exportLocationReport(
  orgId: string,
  employeeId: string,
  options?: { startDate?: Date; endDate?: Date }
): Promise<LocationReport> {
  // Get employee info
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
    .limit(1)

  if (!employee) {
    throw new Error('Employee not found in this organization')
  }

  const conditions = [
    eq(schema.geofenceEvents.orgId, orgId),
    eq(schema.geofenceEvents.employeeId, employeeId),
  ]

  if (options?.startDate) conditions.push(gte(schema.geofenceEvents.timestamp, options.startDate))
  if (options?.endDate) conditions.push(lte(schema.geofenceEvents.timestamp, options.endDate))

  const events = await db
    .select({
      zoneId: schema.geofenceEvents.zoneId,
      zoneName: schema.geofenceZones.name,
      eventType: schema.geofenceEvents.eventType,
      timestamp: schema.geofenceEvents.timestamp,
      latitude: schema.geofenceEvents.latitude,
      longitude: schema.geofenceEvents.longitude,
      isWithinZone: schema.geofenceEvents.isWithinZone,
      distanceFromCenter: schema.geofenceEvents.distanceFromCenter,
    })
    .from(schema.geofenceEvents)
    .innerJoin(schema.geofenceZones, eq(schema.geofenceEvents.zoneId, schema.geofenceZones.id))
    .where(and(...conditions))
    .orderBy(desc(schema.geofenceEvents.timestamp))

  const uniqueZones = new Set(events.map(e => e.zoneId))
  const totalEvents = events.length
  const violationEvents = events.filter(e => e.eventType === 'violation').length
  const complianceRate = totalEvents > 0
    ? Math.round(((totalEvents - violationEvents) / totalEvents) * 100)
    : 100

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    entries: events,
    totalEvents,
    zonesVisited: uniqueZones.size,
    complianceRate,
  }
}
