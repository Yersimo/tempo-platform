// Tempo MDM (Mobile Device Management) Engine
// Device lifecycle, software licensing, compliance, offboarding, asset reporting, and security commands.

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, isNull } from 'drizzle-orm'

// ============================================================
// Types
// ============================================================

export type DeviceType = 'laptop' | 'desktop' | 'phone' | 'tablet' | 'monitor' | 'peripheral' | 'other'
export type DeviceStatus = 'available' | 'assigned' | 'maintenance' | 'retired'
export type SecurityCommand = 'lock' | 'wipe' | 'locate' | 'update' | 'restart' | 'enable_encryption'

export interface DeviceData {
  type: DeviceType
  brand?: string | null
  model?: string | null
  serialNumber?: string | null
  purchaseDate?: string | null
  warrantyEnd?: string | null
}

export interface DeviceFilters {
  type?: DeviceType
  status?: DeviceStatus
  assignedTo?: string | null
  search?: string
}

export interface DeviceInventoryResult {
  devices: Array<{
    id: string
    type: string
    brand: string | null
    model: string | null
    serialNumber: string | null
    status: string
    assignedTo: string | null
    assigneeName: string | null
    assigneeEmail: string | null
    purchaseDate: string | null
    warrantyEnd: string | null
    createdAt: Date
  }>
  summary: {
    total: number
    available: number
    assigned: number
    maintenance: number
    retired: number
    byType: Record<string, number>
  }
}

export interface LicenseOverviewResult {
  licenses: Array<{
    id: string
    name: string
    vendor: string | null
    totalLicenses: number
    usedLicenses: number
    availableLicenses: number
    utilizationPercent: number
    costPerLicense: number | null
    currency: string | null
    renewalDate: string | null
    totalCost: number
    createdAt: Date
  }>
  summary: {
    totalLicenses: number
    totalUsed: number
    totalAvailable: number
    overallUtilization: number
    totalAnnualCost: number
    upcomingRenewals: number
  }
}

export interface ComplianceIssue {
  deviceId: string
  deviceName: string
  serialNumber: string | null
  assigneeName: string | null
  issueType: 'warranty_expired' | 'warranty_expiring_soon' | 'no_warranty' | 'unassigned_active' | 'no_serial_number' | 'aged_device'
  severity: 'critical' | 'warning' | 'info'
  description: string
}

export interface ComplianceResult {
  complianceScore: number
  totalDevices: number
  compliantDevices: number
  issues: ComplianceIssue[]
  summary: {
    critical: number
    warning: number
    info: number
  }
}

export interface RecoveryTask {
  type: 'device' | 'license'
  id: string
  name: string
  details: string
  status: 'pending'
}

export interface DeviceRecoveryResult {
  employeeId: string
  employeeName: string
  employeeEmail: string
  devices: Array<{
    id: string
    type: string
    brand: string | null
    model: string | null
    serialNumber: string | null
  }>
  licenses: Array<{
    id: string
    name: string
    vendor: string | null
  }>
  recoveryTasks: RecoveryTask[]
  totalItemsToRecover: number
}

export interface AssetReportResult {
  overview: {
    totalDevices: number
    totalLicenses: number
    activeEmployees: number
    devicesPerEmployee: number
  }
  deviceValue: {
    estimatedTotalValue: number
    estimatedDepreciation: number
    estimatedCurrentValue: number
    currency: string
  }
  warranty: {
    expired: number
    expiringIn30Days: number
    expiringIn90Days: number
    covered: number
    noCoverage: number
  }
  licenseCosts: {
    totalAnnualCost: number
    averageCostPerLicense: number
    costPerEmployee: number
    currency: string
  }
  deviceDistribution: {
    byType: Record<string, number>
    byStatus: Record<string, number>
  }
}

export interface SecurityCommandResult {
  success: boolean
  commandId: string
  deviceId: string
  command: SecurityCommand
  status: 'queued' | 'sent' | 'acknowledged' | 'failed'
  message: string
  timestamp: string
}

// ============================================================
// 1. Device Lifecycle
// ============================================================

/**
 * Provision a new device into the organization's inventory.
 * Creates a device with status "available" by default.
 */
export async function provisionDevice(
  orgId: string,
  deviceData: DeviceData
): Promise<{ success: boolean; device?: typeof schema.devices.$inferSelect; error?: string }> {
  try {
    const [device] = await db
      .insert(schema.devices)
      .values({
        orgId,
        type: deviceData.type,
        brand: deviceData.brand ?? null,
        model: deviceData.model ?? null,
        serialNumber: deviceData.serialNumber ?? null,
        status: 'available',
        purchaseDate: deviceData.purchaseDate ?? null,
        warrantyEnd: deviceData.warrantyEnd ?? null,
      })
      .returning()

    return { success: true, device }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to provision device',
    }
  }
}

/**
 * Assign a device to an employee. Sets status to "assigned" and links the employee.
 * Validates that the device belongs to the org and is currently available.
 */
export async function assignDevice(
  orgId: string,
  deviceId: string,
  employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify device exists, belongs to org, and is available
    const [device] = await db
      .select()
      .from(schema.devices)
      .where(and(eq(schema.devices.id, deviceId), eq(schema.devices.orgId, orgId)))
      .limit(1)

    if (!device) {
      return { success: false, error: 'Device not found in this organization' }
    }

    if (device.status !== 'available') {
      return { success: false, error: `Device cannot be assigned: current status is "${device.status}"` }
    }

    // Verify employee exists and belongs to org
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) {
      return { success: false, error: 'Employee not found in this organization' }
    }

    if (!employee.isActive) {
      return { success: false, error: 'Cannot assign device to an inactive employee' }
    }

    // Assign the device
    await db
      .update(schema.devices)
      .set({ status: 'assigned', assignedTo: employeeId })
      .where(eq(schema.devices.id, deviceId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign device',
    }
  }
}

/**
 * Unassign a device from its current employee. Sets status back to "available".
 */
export async function unassignDevice(
  orgId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [device] = await db
      .select()
      .from(schema.devices)
      .where(and(eq(schema.devices.id, deviceId), eq(schema.devices.orgId, orgId)))
      .limit(1)

    if (!device) {
      return { success: false, error: 'Device not found in this organization' }
    }

    if (device.status !== 'assigned') {
      return { success: false, error: `Device is not currently assigned (status: "${device.status}")` }
    }

    await db
      .update(schema.devices)
      .set({ status: 'available', assignedTo: null })
      .where(eq(schema.devices.id, deviceId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to unassign device',
    }
  }
}

/**
 * Retire a device from active inventory. Unassigns if currently assigned.
 */
export async function retireDevice(
  orgId: string,
  deviceId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [device] = await db
      .select()
      .from(schema.devices)
      .where(and(eq(schema.devices.id, deviceId), eq(schema.devices.orgId, orgId)))
      .limit(1)

    if (!device) {
      return { success: false, error: 'Device not found in this organization' }
    }

    if (device.status === 'retired') {
      return { success: false, error: 'Device is already retired' }
    }

    await db
      .update(schema.devices)
      .set({ status: 'retired', assignedTo: null })
      .where(eq(schema.devices.id, deviceId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to retire device',
    }
  }
}

// ============================================================
// 2. Device Inventory
// ============================================================

/**
 * Get the full device inventory for an organization with optional filtering.
 * Returns device list with assigned employee details and summary statistics.
 */
export async function getDeviceInventory(
  orgId: string,
  filters?: DeviceFilters
): Promise<DeviceInventoryResult> {
  // Build conditions
  const conditions = [eq(schema.devices.orgId, orgId)]

  if (filters?.type) {
    conditions.push(eq(schema.devices.type, filters.type))
  }
  if (filters?.status) {
    conditions.push(eq(schema.devices.status, filters.status))
  }
  if (filters?.assignedTo) {
    conditions.push(eq(schema.devices.assignedTo, filters.assignedTo))
  }
  if (filters?.assignedTo === null) {
    conditions.push(isNull(schema.devices.assignedTo))
  }

  // Fetch devices with employee join
  const rows = await db
    .select({
      id: schema.devices.id,
      type: schema.devices.type,
      brand: schema.devices.brand,
      model: schema.devices.model,
      serialNumber: schema.devices.serialNumber,
      status: schema.devices.status,
      assignedTo: schema.devices.assignedTo,
      assigneeName: schema.employees.fullName,
      assigneeEmail: schema.employees.email,
      purchaseDate: schema.devices.purchaseDate,
      warrantyEnd: schema.devices.warrantyEnd,
      createdAt: schema.devices.createdAt,
    })
    .from(schema.devices)
    .leftJoin(schema.employees, eq(schema.devices.assignedTo, schema.employees.id))
    .where(and(...conditions))
    .orderBy(desc(schema.devices.createdAt))

  // Compute summary stats from a separate aggregate query for accuracy
  const statusCounts = await db
    .select({
      status: schema.devices.status,
      cnt: count(),
    })
    .from(schema.devices)
    .where(eq(schema.devices.orgId, orgId))
    .groupBy(schema.devices.status)

  const typeCounts = await db
    .select({
      type: schema.devices.type,
      cnt: count(),
    })
    .from(schema.devices)
    .where(eq(schema.devices.orgId, orgId))
    .groupBy(schema.devices.type)

  const statusMap: Record<string, number> = { available: 0, assigned: 0, maintenance: 0, retired: 0 }
  let total = 0
  for (const row of statusCounts) {
    statusMap[row.status] = Number(row.cnt)
    total += Number(row.cnt)
  }

  const byType: Record<string, number> = {}
  for (const row of typeCounts) {
    byType[row.type] = Number(row.cnt)
  }

  return {
    devices: rows.map(r => ({
      ...r,
      assigneeName: r.assigneeName ?? null,
      assigneeEmail: r.assigneeEmail ?? null,
    })),
    summary: {
      total,
      available: statusMap.available,
      assigned: statusMap.assigned,
      maintenance: statusMap.maintenance,
      retired: statusMap.retired,
      byType,
    },
  }
}

// ============================================================
// 3. Software License Management
// ============================================================

/**
 * Get an overview of all software licenses for the organization,
 * including utilization metrics and cost analysis.
 */
export async function getLicenseOverview(orgId: string): Promise<LicenseOverviewResult> {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

  const rows = await db
    .select()
    .from(schema.softwareLicenses)
    .where(eq(schema.softwareLicenses.orgId, orgId))
    .orderBy(desc(schema.softwareLicenses.createdAt))

  let totalLicenses = 0
  let totalUsed = 0
  let totalAnnualCost = 0
  let upcomingRenewals = 0

  const licenses = rows.map(row => {
    const available = row.totalLicenses - row.usedLicenses
    const utilization = row.totalLicenses > 0
      ? Math.round((row.usedLicenses / row.totalLicenses) * 100)
      : 0
    const totalCost = (row.costPerLicense ?? 0) * row.totalLicenses

    totalLicenses += row.totalLicenses
    totalUsed += row.usedLicenses
    totalAnnualCost += totalCost

    if (row.renewalDate) {
      const renewalDate = new Date(row.renewalDate)
      if (renewalDate <= thirtyDaysFromNow && renewalDate >= now) {
        upcomingRenewals++
      }
    }

    return {
      id: row.id,
      name: row.name,
      vendor: row.vendor,
      totalLicenses: row.totalLicenses,
      usedLicenses: row.usedLicenses,
      availableLicenses: available,
      utilizationPercent: utilization,
      costPerLicense: row.costPerLicense,
      currency: row.currency,
      renewalDate: row.renewalDate,
      totalCost,
      createdAt: row.createdAt,
    }
  })

  const totalAvailable = totalLicenses - totalUsed
  const overallUtilization = totalLicenses > 0
    ? Math.round((totalUsed / totalLicenses) * 100)
    : 0

  return {
    licenses,
    summary: {
      totalLicenses,
      totalUsed,
      totalAvailable,
      overallUtilization,
      totalAnnualCost,
      upcomingRenewals,
    },
  }
}

/**
 * Assign a software license to an employee. Increments usedLicenses count.
 * Validates capacity before assignment.
 */
export async function assignLicense(
  orgId: string,
  licenseId: string,
  _employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Verify license exists and belongs to org
    const [license] = await db
      .select()
      .from(schema.softwareLicenses)
      .where(and(eq(schema.softwareLicenses.id, licenseId), eq(schema.softwareLicenses.orgId, orgId)))
      .limit(1)

    if (!license) {
      return { success: false, error: 'Software license not found in this organization' }
    }

    if (license.usedLicenses >= license.totalLicenses) {
      return { success: false, error: `No available licenses for "${license.name}" (${license.usedLicenses}/${license.totalLicenses} used)` }
    }

    // Verify employee exists and belongs to org
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, _employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) {
      return { success: false, error: 'Employee not found in this organization' }
    }

    // Increment used license count
    await db
      .update(schema.softwareLicenses)
      .set({ usedLicenses: license.usedLicenses + 1 })
      .where(eq(schema.softwareLicenses.id, licenseId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to assign license',
    }
  }
}

/**
 * Revoke a software license from an employee. Decrements usedLicenses count.
 */
export async function revokeLicense(
  orgId: string,
  licenseId: string,
  _employeeId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const [license] = await db
      .select()
      .from(schema.softwareLicenses)
      .where(and(eq(schema.softwareLicenses.id, licenseId), eq(schema.softwareLicenses.orgId, orgId)))
      .limit(1)

    if (!license) {
      return { success: false, error: 'Software license not found in this organization' }
    }

    if (license.usedLicenses <= 0) {
      return { success: false, error: `No licenses are currently assigned for "${license.name}"` }
    }

    // Verify employee exists and belongs to org
    const [employee] = await db
      .select()
      .from(schema.employees)
      .where(and(eq(schema.employees.id, _employeeId), eq(schema.employees.orgId, orgId)))
      .limit(1)

    if (!employee) {
      return { success: false, error: 'Employee not found in this organization' }
    }

    // Decrement used license count
    await db
      .update(schema.softwareLicenses)
      .set({ usedLicenses: license.usedLicenses - 1 })
      .where(eq(schema.softwareLicenses.id, licenseId))

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to revoke license',
    }
  }
}

// ============================================================
// 4. Device Compliance
// ============================================================

/**
 * Check all active (non-retired) devices for compliance issues.
 * Evaluates warranty status, serial number presence, assignment hygiene, and device age.
 * Returns a compliance score (0-100) along with categorized issues.
 */
export async function checkDeviceCompliance(orgId: string): Promise<ComplianceResult> {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const threeYearsAgo = new Date(now.getFullYear() - 3, now.getMonth(), now.getDate())

  // Fetch all non-retired devices with their assignees
  const devices = await db
    .select({
      id: schema.devices.id,
      type: schema.devices.type,
      brand: schema.devices.brand,
      model: schema.devices.model,
      serialNumber: schema.devices.serialNumber,
      status: schema.devices.status,
      assignedTo: schema.devices.assignedTo,
      assigneeName: schema.employees.fullName,
      purchaseDate: schema.devices.purchaseDate,
      warrantyEnd: schema.devices.warrantyEnd,
    })
    .from(schema.devices)
    .leftJoin(schema.employees, eq(schema.devices.assignedTo, schema.employees.id))
    .where(
      and(
        eq(schema.devices.orgId, orgId),
        sql`${schema.devices.status} != 'retired'`
      )
    )

  const issues: ComplianceIssue[] = []
  let compliantDevices = 0

  for (const device of devices) {
    const deviceName = [device.brand, device.model].filter(Boolean).join(' ') || `${device.type} device`
    let deviceHasIssue = false

    // Check: warranty expired
    if (device.warrantyEnd) {
      const warrantyDate = new Date(device.warrantyEnd)
      if (warrantyDate < now) {
        issues.push({
          deviceId: device.id,
          deviceName,
          serialNumber: device.serialNumber,
          assigneeName: device.assigneeName ?? null,
          issueType: 'warranty_expired',
          severity: 'critical',
          description: `Warranty expired on ${device.warrantyEnd}`,
        })
        deviceHasIssue = true
      } else if (warrantyDate <= thirtyDaysFromNow) {
        issues.push({
          deviceId: device.id,
          deviceName,
          serialNumber: device.serialNumber,
          assigneeName: device.assigneeName ?? null,
          issueType: 'warranty_expiring_soon',
          severity: 'warning',
          description: `Warranty expires on ${device.warrantyEnd} (within 30 days)`,
        })
        deviceHasIssue = true
      }
    } else {
      // No warranty info at all
      issues.push({
        deviceId: device.id,
        deviceName,
        serialNumber: device.serialNumber,
        assigneeName: device.assigneeName ?? null,
        issueType: 'no_warranty',
        severity: 'info',
        description: 'No warranty end date recorded',
      })
      deviceHasIssue = true
    }

    // Check: no serial number
    if (!device.serialNumber) {
      issues.push({
        deviceId: device.id,
        deviceName,
        serialNumber: null,
        assigneeName: device.assigneeName ?? null,
        issueType: 'no_serial_number',
        severity: 'warning',
        description: 'Device has no serial number recorded for tracking',
      })
      deviceHasIssue = true
    }

    // Check: device is available but should probably be assigned or maintained
    if (device.status === 'available' && device.purchaseDate) {
      const purchaseDate = new Date(device.purchaseDate)
      if (purchaseDate < threeYearsAgo) {
        issues.push({
          deviceId: device.id,
          deviceName,
          serialNumber: device.serialNumber,
          assigneeName: null,
          issueType: 'aged_device',
          severity: 'warning',
          description: `Unassigned device purchased on ${device.purchaseDate} is over 3 years old and may need review or retirement`,
        })
        deviceHasIssue = true
      }
    }

    if (!deviceHasIssue) {
      compliantDevices++
    }
  }

  const totalDevices = devices.length
  const complianceScore = totalDevices > 0
    ? Math.round((compliantDevices / totalDevices) * 100)
    : 100

  const summary = {
    critical: issues.filter(i => i.severity === 'critical').length,
    warning: issues.filter(i => i.severity === 'warning').length,
    info: issues.filter(i => i.severity === 'info').length,
  }

  return {
    complianceScore,
    totalDevices,
    compliantDevices,
    issues,
    summary,
  }
}

// ============================================================
// 5. Offboarding Device Recovery
// ============================================================

/**
 * When an employee is leaving, retrieve all devices and software licenses
 * assigned to them and generate a recovery task list for IT to process.
 */
export async function initiateDeviceRecovery(
  orgId: string,
  employeeId: string
): Promise<DeviceRecoveryResult> {
  // Get employee info
  const [employee] = await db
    .select()
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))
    .limit(1)

  if (!employee) {
    throw new Error('Employee not found in this organization')
  }

  // Get all devices assigned to the employee
  const assignedDevices = await db
    .select({
      id: schema.devices.id,
      type: schema.devices.type,
      brand: schema.devices.brand,
      model: schema.devices.model,
      serialNumber: schema.devices.serialNumber,
    })
    .from(schema.devices)
    .where(
      and(
        eq(schema.devices.orgId, orgId),
        eq(schema.devices.assignedTo, employeeId),
        sql`${schema.devices.status} != 'retired'`
      )
    )

  // Get all software licenses for the org (the schema tracks used counts, not per-employee).
  // In a production system with a join table, we would query directly.
  // Here, we return all licenses that have usage, as candidates for review.
  const orgLicenses = await db
    .select({
      id: schema.softwareLicenses.id,
      name: schema.softwareLicenses.name,
      vendor: schema.softwareLicenses.vendor,
      usedLicenses: schema.softwareLicenses.usedLicenses,
    })
    .from(schema.softwareLicenses)
    .where(
      and(
        eq(schema.softwareLicenses.orgId, orgId),
        sql`${schema.softwareLicenses.usedLicenses} > 0`
      )
    )

  // Build recovery tasks
  const recoveryTasks: RecoveryTask[] = []

  for (const device of assignedDevices) {
    const deviceName = [device.brand, device.model].filter(Boolean).join(' ') || `${device.type} device`
    recoveryTasks.push({
      type: 'device',
      id: device.id,
      name: deviceName,
      details: `Recover ${deviceName}${device.serialNumber ? ` (S/N: ${device.serialNumber})` : ''} from ${employee.fullName}`,
      status: 'pending',
    })
  }

  for (const license of orgLicenses) {
    recoveryTasks.push({
      type: 'license',
      id: license.id,
      name: license.name,
      details: `Review and revoke "${license.name}" license access for ${employee.fullName}`,
      status: 'pending',
    })
  }

  return {
    employeeId: employee.id,
    employeeName: employee.fullName,
    employeeEmail: employee.email,
    devices: assignedDevices,
    licenses: orgLicenses.map(l => ({ id: l.id, name: l.name, vendor: l.vendor })),
    recoveryTasks,
    totalItemsToRecover: assignedDevices.length + orgLicenses.length,
  }
}

// ============================================================
// 6. Asset Reports
// ============================================================

// Average estimated cost per device type (USD) for valuation when purchase price is unknown
const ESTIMATED_DEVICE_COST: Record<string, number> = {
  laptop: 1200,
  desktop: 1000,
  phone: 800,
  tablet: 600,
  monitor: 400,
  peripheral: 150,
  other: 300,
}

// Annual depreciation rate (straight-line, estimated useful life 3-5 years)
const DEPRECIATION_RATE = 0.25

/**
 * Generate a comprehensive asset report for the organization covering
 * device valuation, depreciation, warranty status, license costs, and cost per employee.
 */
export async function getAssetReport(orgId: string): Promise<AssetReportResult> {
  const now = new Date()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  const ninetyDaysFromNow = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000)
  const nowStr = now.toISOString().slice(0, 10)
  const thirtyStr = thirtyDaysFromNow.toISOString().slice(0, 10)
  const ninetyStr = ninetyDaysFromNow.toISOString().slice(0, 10)

  // Fetch all devices
  const devices = await db
    .select()
    .from(schema.devices)
    .where(eq(schema.devices.orgId, orgId))

  // Fetch all licenses
  const licenses = await db
    .select()
    .from(schema.softwareLicenses)
    .where(eq(schema.softwareLicenses.orgId, orgId))

  // Fetch active employee count
  const [empCount] = await db
    .select({ cnt: count() })
    .from(schema.employees)
    .where(and(eq(schema.employees.orgId, orgId), eq(schema.employees.isActive, true)))

  const activeEmployees = Number(empCount?.cnt ?? 0)
  const totalDevices = devices.length
  const totalLicenses = licenses.length

  // --- Device valuation & depreciation ---
  let estimatedTotalValue = 0
  let estimatedDepreciation = 0

  for (const device of devices) {
    const baseCost = ESTIMATED_DEVICE_COST[device.type] ?? ESTIMATED_DEVICE_COST.other
    estimatedTotalValue += baseCost

    if (device.purchaseDate) {
      const purchaseDate = new Date(device.purchaseDate)
      const yearsOwned = (now.getTime() - purchaseDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      const depreciated = Math.min(baseCost, baseCost * DEPRECIATION_RATE * yearsOwned)
      estimatedDepreciation += depreciated
    } else {
      // Assume 1 year of depreciation if no purchase date
      estimatedDepreciation += baseCost * DEPRECIATION_RATE
    }
  }

  const estimatedCurrentValue = Math.max(0, estimatedTotalValue - estimatedDepreciation)

  // --- Warranty analysis ---
  let warrantyExpired = 0
  let warrantyExpiring30 = 0
  let warrantyExpiring90 = 0
  let warrantyCovered = 0
  let warrantyNoCoverage = 0

  for (const device of devices) {
    if (!device.warrantyEnd) {
      warrantyNoCoverage++
      continue
    }
    const wEnd = new Date(device.warrantyEnd)
    if (wEnd < now) {
      warrantyExpired++
    } else if (wEnd <= thirtyDaysFromNow) {
      warrantyExpiring30++
    } else if (wEnd <= ninetyDaysFromNow) {
      warrantyExpiring90++
    } else {
      warrantyCovered++
    }
  }

  // --- License costs ---
  let totalAnnualCost = 0
  let licenseCount = 0

  for (const license of licenses) {
    const cost = (license.costPerLicense ?? 0) * license.totalLicenses
    totalAnnualCost += cost
    licenseCount += license.totalLicenses
  }

  const averageCostPerLicense = licenseCount > 0
    ? Math.round(totalAnnualCost / licenseCount)
    : 0
  const costPerEmployee = activeEmployees > 0
    ? Math.round(totalAnnualCost / activeEmployees)
    : 0

  // --- Distribution ---
  const byType: Record<string, number> = {}
  const byStatus: Record<string, number> = {}

  for (const device of devices) {
    byType[device.type] = (byType[device.type] || 0) + 1
    byStatus[device.status] = (byStatus[device.status] || 0) + 1
  }

  return {
    overview: {
      totalDevices,
      totalLicenses,
      activeEmployees,
      devicesPerEmployee: activeEmployees > 0
        ? Math.round((totalDevices / activeEmployees) * 100) / 100
        : 0,
    },
    deviceValue: {
      estimatedTotalValue: Math.round(estimatedTotalValue),
      estimatedDepreciation: Math.round(estimatedDepreciation),
      estimatedCurrentValue: Math.round(estimatedCurrentValue),
      currency: 'USD',
    },
    warranty: {
      expired: warrantyExpired,
      expiringIn30Days: warrantyExpiring30,
      expiringIn90Days: warrantyExpiring90,
      covered: warrantyCovered,
      noCoverage: warrantyNoCoverage,
    },
    licenseCosts: {
      totalAnnualCost: Math.round(totalAnnualCost),
      averageCostPerLicense,
      costPerEmployee,
      currency: 'USD',
    },
    deviceDistribution: {
      byType,
      byStatus,
    },
  }
}

// ============================================================
// 7. Security Commands
// ============================================================

/**
 * Send a security command to a managed device (simulated).
 * In production, this would integrate with an MDM provider API (e.g., Jamf, Intune, Kandji).
 * Supported commands: lock, wipe, locate, update, restart, enable_encryption.
 */
export async function sendDeviceCommand(
  orgId: string,
  deviceId: string,
  command: SecurityCommand
): Promise<SecurityCommandResult> {
  const timestamp = new Date().toISOString()
  const commandId = `cmd-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  try {
    // Verify device exists and belongs to org
    const [device] = await db
      .select()
      .from(schema.devices)
      .where(and(eq(schema.devices.id, deviceId), eq(schema.devices.orgId, orgId)))
      .limit(1)

    if (!device) {
      return {
        success: false,
        commandId,
        deviceId,
        command,
        status: 'failed',
        message: 'Device not found in this organization',
        timestamp,
      }
    }

    if (device.status === 'retired') {
      return {
        success: false,
        commandId,
        deviceId,
        command,
        status: 'failed',
        message: 'Cannot send commands to a retired device',
        timestamp,
      }
    }

    // Validate command applicability
    const validCommands: SecurityCommand[] = ['lock', 'wipe', 'locate', 'update', 'restart', 'enable_encryption']
    if (!validCommands.includes(command)) {
      return {
        success: false,
        commandId,
        deviceId,
        command,
        status: 'failed',
        message: `Unknown command: "${command}". Valid commands: ${validCommands.join(', ')}`,
        timestamp,
      }
    }

    // Wipe requires special confirmation logic in a real system; here we simulate
    const deviceName = [device.brand, device.model].filter(Boolean).join(' ') || `${device.type} device`

    const commandMessages: Record<SecurityCommand, string> = {
      lock: `Lock command queued for ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). Device will be locked on next check-in.`,
      wipe: `Remote wipe command queued for ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). All data will be erased on next check-in.`,
      locate: `Locate command sent to ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). Location will be available once device responds.`,
      update: `OS update command queued for ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). Update will install on next check-in.`,
      restart: `Restart command queued for ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). Device will restart on next check-in.`,
      enable_encryption: `Encryption enablement queued for ${deviceName} (S/N: ${device.serialNumber ?? 'N/A'}). FileVault/BitLocker will be enabled on next check-in.`,
    }

    // If device is assigned, update status to maintenance for wipe command
    if (command === 'wipe' && device.status === 'assigned') {
      await db
        .update(schema.devices)
        .set({ status: 'maintenance', assignedTo: null })
        .where(eq(schema.devices.id, deviceId))
    }

    return {
      success: true,
      commandId,
      deviceId,
      command,
      status: 'queued',
      message: commandMessages[command],
      timestamp,
    }
  } catch (err) {
    return {
      success: false,
      commandId,
      deviceId,
      command,
      status: 'failed',
      message: err instanceof Error ? err.message : 'Failed to send device command',
      timestamp,
    }
  }
}
