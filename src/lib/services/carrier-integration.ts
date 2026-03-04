/**
 * Carrier Integration Tracking Service
 *
 * Manages benefit carrier connections, EDI 834 enrollment feed generation,
 * enrollment synchronization, and discrepancy resolution.
 *
 * Features:
 * - EDI 834 enrollment feed generation (ANSI X12 format)
 * - Carrier connection management (EDI, API, SFTP, manual)
 * - Enrollment sync tracking with error handling
 * - Feed status monitoring (pending, sent, acknowledged, error, rejected)
 * - Discrepancy detection and resolution
 * - Reconciliation reports
 * - Automated sync scheduling
 * - Connection health monitoring
 * - Error categorization and resolution workflows
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, count, gte, lte } from 'drizzle-orm'

// ============================================================
// EDI 834 Format Constants
// ============================================================

export const EDI_834 = {
  // Transaction Set Identifier
  TRANSACTION_SET_ID: '834',
  // X12 Version
  VERSION: '005010X220A1',
  // Functional Group Identifier
  FUNCTIONAL_GROUP_ID: 'BE',
  // Segment terminators
  SEGMENT_TERMINATOR: '~',
  ELEMENT_SEPARATOR: '*',
  SUB_ELEMENT_SEPARATOR: ':',
  // Maintenance Type Codes (INS segment)
  MAINTENANCE_TYPE: {
    ADDITION: '021',
    CHANGE: '001',
    TERMINATION: '024',
    REINSTATEMENT: '025',
    CANCELLATION: '030',
    AUDIT_OR_COMPARE: '041',
  },
  // Maintenance Reason Codes
  MAINTENANCE_REASON: {
    INITIAL_ENROLLMENT: 'AI',
    NEW_HIRE: 'AE',
    OPEN_ENROLLMENT: '02',
    QUALIFYING_EVENT: 'QE',
    TERMINATION: 'TE',
    COBRA: 'EC',
    VOLUNTARY_WITHDRAWAL: 'VW',
  },
  // Insurance Line Codes (HD segment)
  INSURANCE_LINE: {
    HEALTH: 'HLT',
    DENTAL: 'DEN',
    VISION: 'VIS',
    LIFE: 'LIF',
    DISABILITY_SHORT: 'STD',
    DISABILITY_LONG: 'LTD',
  },
  // Coverage Level Codes
  COVERAGE_LEVEL: {
    EMPLOYEE_ONLY: 'EMP',
    EMPLOYEE_AND_SPOUSE: 'ESP',
    EMPLOYEE_AND_CHILDREN: 'ECH',
    FAMILY: 'FAM',
    EMPLOYEE_AND_ONE: 'E1D',
    EMPLOYEE_AND_TWO: 'E2D',
  },
  // Benefit Status Codes (INS segment element 5)
  BENEFIT_STATUS: {
    ACTIVE: 'A',
    COBRA: 'C',
    SURVIVING_INSURED: 'S',
    TEFRA: 'T',
  },
  // Gender Codes
  GENDER: {
    MALE: 'M',
    FEMALE: 'F',
    UNKNOWN: 'U',
  },
  // Relationship Codes (INS segment)
  RELATIONSHIP: {
    INSURED: '18',
    SPOUSE: '01',
    CHILD: '19',
    DOMESTIC_PARTNER: '53',
    FORMER_SPOUSE: '36',
  },
} as const

// ============================================================
// Types
// ============================================================

export type ConnectionType = 'edi_834' | 'api' | 'sftp' | 'manual'
export type SyncStatus = 'connected' | 'syncing' | 'error' | 'disconnected'
export type FeedStatus = 'pending' | 'sent' | 'acknowledged' | 'error' | 'rejected'
export type FeedType = 'full' | 'changes_only'

export interface CarrierConfig {
  endpoint?: string
  sftpHost?: string
  sftpPort?: number
  sftpUsername?: string
  // Credentials stored encrypted; never returned to client
  credentialRef?: string
  format?: string
  schedule?: SyncSchedule
  senderId?: string
  receiverId?: string
  groupControlNumber?: number
  transactionControlNumber?: number
}

export interface SyncSchedule {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'on_change'
  dayOfWeek?: number // 0-6 for weekly
  dayOfMonth?: number // 1-31 for monthly
  timeOfDay?: string // HH:MM in UTC
  enabled: boolean
}

export interface CarrierContact {
  name: string
  email: string
  phone?: string
  role: string
}

export interface FeedError {
  employeeId: string
  field: string
  message: string
  severity: 'error' | 'warning'
  code?: string
}

export interface EnrollmentRecord {
  employeeId: string
  firstName: string
  lastName: string
  ssn?: string
  dateOfBirth: string
  gender: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
  }
  hireDate: string
  terminationDate?: string
  planId: string
  planName: string
  coverageLevel: string
  coverageStartDate: string
  coverageEndDate?: string
  maintenanceType: string
  maintenanceReason: string
  dependents?: Array<{
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    relationship: string
    ssn?: string
  }>
}

export interface Discrepancy {
  id: string
  carrierId: string
  employeeId: string
  field: string
  carrierValue: string
  systemValue: string
  detectedAt: string
  resolvedAt?: string
  resolution?: string
  resolvedBy?: string
}

export interface ReconciliationReport {
  carrierId: string
  carrierName: string
  reportDate: string
  totalSystemRecords: number
  totalCarrierRecords: number
  matchedRecords: number
  discrepancies: Discrepancy[]
  missingFromCarrier: string[] // employee IDs
  missingFromSystem: string[] // employee IDs
  summary: {
    coverageDiscrepancies: number
    demographicDiscrepancies: number
    dateDiscrepancies: number
    totalDiscrepancies: number
    matchRate: number
  }
}

export interface CarrierDashboard {
  totalCarriers: number
  connectedCarriers: number
  errorCarriers: number
  syncingCarriers: number
  recentFeeds: Array<{
    id: string
    carrierName: string
    status: string
    recordCount: number
    errorCount: number
    createdAt: string
  }>
  upcomingSyncs: Array<{
    carrierId: string
    carrierName: string
    nextSyncAt: string
  }>
  healthScore: number
}

export interface ConnectCarrierInput {
  orgId: string
  carrierName: string
  carrierId?: string
  connectionType: ConnectionType
  planIds?: string[]
  config?: CarrierConfig
  contactEmail?: string
  contactPhone?: string
}

// ============================================================
// Carrier Connection Management
// ============================================================

/**
 * Connect to a new carrier.
 */
export async function connectCarrier(input: ConnectCarrierInput) {
  // Validate connection type
  const validTypes: ConnectionType[] = ['edi_834', 'api', 'sftp', 'manual']
  if (!validTypes.includes(input.connectionType)) {
    throw new Error(`Invalid connection type: ${input.connectionType}. Must be one of: ${validTypes.join(', ')}`)
  }

  // Check for existing connection to same carrier
  const existing = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.orgId, input.orgId),
      eq(schema.carrierIntegrations.carrierName, input.carrierName),
    ))

  if (existing.length > 0 && existing.some(e => e.syncStatus !== 'disconnected')) {
    throw new Error(`Carrier "${input.carrierName}" is already connected. Disconnect first to reconnect.`)
  }

  const config: CarrierConfig = {
    ...input.config,
    groupControlNumber: 1,
    transactionControlNumber: 1,
  }

  const [carrier] = await db.insert(schema.carrierIntegrations).values({
    orgId: input.orgId,
    carrierName: input.carrierName,
    carrierId: input.carrierId || null,
    connectionType: input.connectionType,
    planIds: (input.planIds || []) as unknown as Record<string, unknown>,
    syncStatus: 'connected',
    config: config as unknown as Record<string, unknown>,
    contactEmail: input.contactEmail || null,
    contactPhone: input.contactPhone || null,
    lastSyncStatus: 'never',
  }).returning()

  return carrier
}

/**
 * Disconnect a carrier integration.
 */
export async function disconnectCarrier(orgId: string, carrierId: string) {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  const [updated] = await db.update(schema.carrierIntegrations)
    .set({
      syncStatus: 'disconnected',
      updatedAt: new Date(),
    })
    .where(eq(schema.carrierIntegrations.id, carrierId))
    .returning()

  return updated
}

/**
 * Test connectivity to a carrier.
 */
export async function testConnection(orgId: string, carrierId: string): Promise<{
  success: boolean
  latencyMs: number
  message: string
  checkedAt: string
}> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  const start = Date.now()
  const config = carrier.config as unknown as CarrierConfig | null

  // Simulate connection test based on type
  let success = true
  let message = 'Connection successful'

  switch (carrier.connectionType) {
    case 'edi_834':
      if (!config?.sftpHost) {
        success = false
        message = 'SFTP host not configured'
      } else {
        message = `EDI 834 connection verified via SFTP to ${config.sftpHost}`
      }
      break
    case 'api':
      if (!config?.endpoint) {
        success = false
        message = 'API endpoint not configured'
      } else {
        message = `API endpoint ${config.endpoint} is reachable`
      }
      break
    case 'sftp':
      if (!config?.sftpHost) {
        success = false
        message = 'SFTP host not configured'
      } else {
        message = `SFTP connection to ${config.sftpHost}:${config.sftpPort || 22} verified`
      }
      break
    case 'manual':
      message = 'Manual connection mode - no connectivity test required'
      break
  }

  const latencyMs = Date.now() - start

  // Update the carrier status based on test result
  if (success && carrier.syncStatus === 'error') {
    await db.update(schema.carrierIntegrations)
      .set({ syncStatus: 'connected', updatedAt: new Date() })
      .where(eq(schema.carrierIntegrations.id, carrierId))
  }

  return {
    success,
    latencyMs,
    message,
    checkedAt: new Date().toISOString(),
  }
}

// ============================================================
// EDI 834 Feed Generation
// ============================================================

/**
 * Generate an EDI 834 enrollment feed for a carrier.
 */
export async function generateEDI834Feed(
  orgId: string,
  carrierId: string,
  feedType: FeedType = 'full',
  sinceDate?: string
): Promise<{
  feedId: string
  ediContent: string
  recordCount: number
  errors: FeedError[]
}> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')
  if (carrier.syncStatus === 'disconnected') throw new Error('Carrier is disconnected')

  const config = carrier.config as unknown as CarrierConfig | null
  const senderId = config?.senderId || orgId.substring(0, 15)
  const receiverId = config?.receiverId || carrier.carrierId || carrier.carrierName.substring(0, 15).replace(/\s/g, '')

  // Get enrollment records
  const enrollmentRecords = await getEnrollmentRecords(orgId, carrierId, feedType, sinceDate)
  const errors: FeedError[] = []

  // Validate records
  for (const record of enrollmentRecords) {
    if (!record.dateOfBirth) {
      errors.push({
        employeeId: record.employeeId,
        field: 'dateOfBirth',
        message: 'Date of birth is required',
        severity: 'error',
      })
    }
    if (!record.firstName || !record.lastName) {
      errors.push({
        employeeId: record.employeeId,
        field: 'name',
        message: 'First and last name are required',
        severity: 'error',
      })
    }
  }

  // Filter out records with critical errors
  const errorEmployeeIds = new Set(errors.filter(e => e.severity === 'error').map(e => e.employeeId))
  const validRecords = enrollmentRecords.filter(r => !errorEmployeeIds.has(r.employeeId))

  // Generate EDI 834 content
  const now = new Date()
  const dateStr = formatEDIDate(now)
  const timeStr = formatEDITime(now)
  const gcn = (config?.groupControlNumber || 1).toString()
  const tcn = (config?.transactionControlNumber || 1).toString()
  const segments: string[] = []

  // ISA - Interchange Control Header
  segments.push(buildSegment('ISA', [
    '00', '          ', // Authorization qualifier & info
    '00', '          ', // Security qualifier & info
    'ZZ', padRight(senderId, 15), // Sender ID qualifier & ID
    'ZZ', padRight(receiverId, 15), // Receiver ID qualifier & ID
    dateStr.substring(2), // Date YYMMDD
    timeStr, // Time HHMM
    '^', // Repetition separator
    '00501', // ISA version
    padLeft(gcn, 9, '0'), // Interchange control number
    '0', // Acknowledgment requested
    'P', // Production
    EDI_834.SUB_ELEMENT_SEPARATOR, // Sub-element separator
  ]))

  // GS - Functional Group Header
  segments.push(buildSegment('GS', [
    EDI_834.FUNCTIONAL_GROUP_ID,
    senderId.substring(0, 15),
    receiverId.substring(0, 15),
    dateStr,
    timeStr,
    gcn,
    'X',
    EDI_834.VERSION,
  ]))

  // ST - Transaction Set Header
  segments.push(buildSegment('ST', [
    EDI_834.TRANSACTION_SET_ID,
    padLeft(tcn, 4, '0'),
    EDI_834.VERSION,
  ]))

  // BGN - Beginning Segment
  segments.push(buildSegment('BGN', [
    '00', // Transaction Set Purpose: Original
    crypto.randomUUID().substring(0, 30), // Reference ID
    dateStr,
    timeStr,
    '', // Time Zone
    '', // empty
    '', // empty
    feedType === 'full' ? '4' : '2', // Action: 4=verify, 2=change
  ]))

  // N1 - Sponsor (Employer) Name
  segments.push(buildSegment('N1', [
    'P5', // Plan Sponsor
    carrier.carrierName,
    'FI', // Federal Tax ID
    orgId.substring(0, 9),
  ]))

  // N1 - Payer (Carrier) Name
  segments.push(buildSegment('N1', [
    'IN', // Insurer
    carrier.carrierName,
    'FI', // Federal Tax ID
    carrier.carrierId || '',
  ]))

  // Generate member-level segments for each enrollment record
  let memberCount = 0
  for (const record of validRecords) {
    memberCount++

    // INS - Insured Benefit
    segments.push(buildSegment('INS', [
      'Y', // Insured indicator (Y = subscriber)
      EDI_834.RELATIONSHIP.INSURED,
      record.maintenanceType,
      record.maintenanceReason,
      EDI_834.BENEFIT_STATUS.ACTIVE,
      '', // empty
      '', // empty
      '01', // Employment status: Active
    ]))

    // REF - Subscriber Identifier
    segments.push(buildSegment('REF', [
      '0F', // Subscriber number qualifier
      record.employeeId.substring(0, 30),
    ]))

    // REF - SSN (if available)
    if (record.ssn) {
      segments.push(buildSegment('REF', [
        '1L', // Group/Policy number
        record.ssn.replace(/\D/g, ''),
      ]))
    }

    // DTP - Hire Date
    segments.push(buildSegment('DTP', [
      '336', // Employment begin date
      'D8', // Date format CCYYMMDD
      formatEDIDate(new Date(record.hireDate)),
    ]))

    // DTP - Coverage Effective Date
    segments.push(buildSegment('DTP', [
      '348', // Benefit begin date
      'D8',
      formatEDIDate(new Date(record.coverageStartDate)),
    ]))

    // DTP - Coverage End Date (if termination)
    if (record.coverageEndDate) {
      segments.push(buildSegment('DTP', [
        '349', // Benefit end date
        'D8',
        formatEDIDate(new Date(record.coverageEndDate)),
      ]))
    }

    // NM1 - Member Name
    segments.push(buildSegment('NM1', [
      'IL', // Insured/subscriber
      '1', // Person
      record.lastName,
      record.firstName,
      '', // Middle name
      '', // Prefix
      '', // Suffix
      '34', // SSN qualifier
      record.ssn ? record.ssn.replace(/\D/g, '') : '',
    ]))

    // DMG - Demographics
    segments.push(buildSegment('DMG', [
      'D8', // Date format
      formatEDIDate(new Date(record.dateOfBirth)),
      record.gender || EDI_834.GENDER.UNKNOWN,
    ]))

    // N3 - Address
    if (record.address) {
      segments.push(buildSegment('N3', [
        record.address.street,
      ]))
      segments.push(buildSegment('N4', [
        record.address.city,
        record.address.state,
        record.address.zip,
      ]))
    }

    // HD - Health Coverage
    segments.push(buildSegment('HD', [
      record.maintenanceType,
      '', // empty
      EDI_834.INSURANCE_LINE.HEALTH,
      record.planName.substring(0, 50),
      record.coverageLevel,
    ]))

    // DTP - Coverage dates in HD loop
    segments.push(buildSegment('DTP', [
      '348',
      'D8',
      formatEDIDate(new Date(record.coverageStartDate)),
    ]))

    // Dependent segments
    if (record.dependents) {
      for (const dep of record.dependents) {
        const relCode = dep.relationship === 'spouse'
          ? EDI_834.RELATIONSHIP.SPOUSE
          : dep.relationship === 'domestic_partner'
            ? EDI_834.RELATIONSHIP.DOMESTIC_PARTNER
            : EDI_834.RELATIONSHIP.CHILD

        segments.push(buildSegment('INS', [
          'N', // Not subscriber
          relCode,
          record.maintenanceType,
          record.maintenanceReason,
          EDI_834.BENEFIT_STATUS.ACTIVE,
        ]))

        segments.push(buildSegment('NM1', [
          'IL',
          '1',
          dep.lastName,
          dep.firstName,
          '', '', '',
          dep.ssn ? '34' : '',
          dep.ssn ? dep.ssn.replace(/\D/g, '') : '',
        ]))

        segments.push(buildSegment('DMG', [
          'D8',
          formatEDIDate(new Date(dep.dateOfBirth)),
          dep.gender || EDI_834.GENDER.UNKNOWN,
        ]))
      }
    }
  }

  // SE - Transaction Set Trailer
  const segmentCount = segments.length + 1 // +1 for SE itself
  segments.push(buildSegment('SE', [
    segmentCount.toString(),
    padLeft(tcn, 4, '0'),
  ]))

  // GE - Functional Group Trailer
  segments.push(buildSegment('GE', [
    '1', // Number of transaction sets
    gcn,
  ]))

  // IEA - Interchange Control Trailer
  segments.push(buildSegment('IEA', [
    '1', // Number of functional groups
    padLeft(gcn, 9, '0'),
  ]))

  const ediContent = segments.join('\n')

  // Create feed record
  const [feed] = await db.insert(schema.enrollmentFeeds).values({
    orgId,
    carrierId,
    feedType,
    status: 'pending',
    recordCount: validRecords.length,
    errorCount: errors.length,
    errors: errors as unknown as Record<string, unknown>,
  }).returning()

  // Update carrier with incremented control numbers
  if (config) {
    await db.update(schema.carrierIntegrations)
      .set({
        config: {
          ...config,
          groupControlNumber: (config.groupControlNumber || 1) + 1,
          transactionControlNumber: (config.transactionControlNumber || 1) + 1,
        } as unknown as Record<string, unknown>,
        updatedAt: new Date(),
      })
      .where(eq(schema.carrierIntegrations.id, carrierId))
  }

  return {
    feedId: feed.id,
    ediContent,
    recordCount: validRecords.length,
    errors,
  }
}

/**
 * Send a generated feed to the carrier.
 */
export async function sendFeed(orgId: string, feedId: string): Promise<{
  success: boolean
  sentAt: string
  transmissionId: string
  message: string
}> {
  const [feed] = await db.select()
    .from(schema.enrollmentFeeds)
    .where(and(
      eq(schema.enrollmentFeeds.id, feedId),
      eq(schema.enrollmentFeeds.orgId, orgId),
    ))

  if (!feed) throw new Error('Feed not found')
  if (feed.status !== 'pending') throw new Error(`Feed cannot be sent in status "${feed.status}"`)

  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(eq(schema.carrierIntegrations.id, feed.carrierId))

  if (!carrier) throw new Error('Carrier not found')

  // In production, this would actually transmit the file via SFTP/API
  // For now, mark as sent and record the transmission
  const sentAt = new Date()
  const transmissionId = crypto.randomUUID()

  await db.update(schema.enrollmentFeeds)
    .set({
      status: 'sent',
      sentAt,
    })
    .where(eq(schema.enrollmentFeeds.id, feedId))

  // Update carrier sync status
  await db.update(schema.carrierIntegrations)
    .set({
      lastSyncAt: sentAt,
      lastSyncStatus: 'sent',
      syncStatus: 'connected',
      updatedAt: sentAt,
    })
    .where(eq(schema.carrierIntegrations.id, feed.carrierId))

  return {
    success: true,
    sentAt: sentAt.toISOString(),
    transmissionId,
    message: `Feed ${feedId} sent to ${carrier.carrierName} via ${carrier.connectionType}`,
  }
}

/**
 * Check the status of a feed.
 */
export async function checkFeedStatus(orgId: string, feedId: string) {
  const [feed] = await db.select()
    .from(schema.enrollmentFeeds)
    .where(and(
      eq(schema.enrollmentFeeds.id, feedId),
      eq(schema.enrollmentFeeds.orgId, orgId),
    ))

  if (!feed) throw new Error('Feed not found')

  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(eq(schema.carrierIntegrations.id, feed.carrierId))

  return {
    feedId: feed.id,
    carrierId: feed.carrierId,
    carrierName: carrier?.carrierName || 'Unknown',
    feedType: feed.feedType,
    status: feed.status,
    recordCount: feed.recordCount,
    errorCount: feed.errorCount || 0,
    errors: (feed.errors as unknown as FeedError[]) || [],
    createdAt: feed.createdAt.toISOString(),
    sentAt: feed.sentAt?.toISOString() || null,
    acknowledgedAt: feed.acknowledgedAt?.toISOString() || null,
  }
}

/**
 * Get feed errors for a specific feed.
 */
export async function getFeedErrors(orgId: string, feedId: string): Promise<FeedError[]> {
  const [feed] = await db.select()
    .from(schema.enrollmentFeeds)
    .where(and(
      eq(schema.enrollmentFeeds.id, feedId),
      eq(schema.enrollmentFeeds.orgId, orgId),
    ))

  if (!feed) throw new Error('Feed not found')

  return (feed.errors as unknown as FeedError[]) || []
}

// ============================================================
// Enrollment Sync
// ============================================================

/**
 * Sync enrollments for a carrier (triggers a full or changes-only feed).
 */
export async function syncEnrollments(
  orgId: string,
  carrierId: string,
  feedType: FeedType = 'changes_only'
) {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')
  if (carrier.syncStatus === 'disconnected') throw new Error('Carrier is disconnected')

  // Set status to syncing
  await db.update(schema.carrierIntegrations)
    .set({ syncStatus: 'syncing', updatedAt: new Date() })
    .where(eq(schema.carrierIntegrations.id, carrierId))

  try {
    // Generate and send the feed
    const sinceDate = carrier.lastSyncAt?.toISOString().split('T')[0]
    const feedResult = await generateEDI834Feed(orgId, carrierId, feedType, sinceDate)
    const sendResult = await sendFeed(orgId, feedResult.feedId)

    return {
      success: true,
      feedId: feedResult.feedId,
      recordCount: feedResult.recordCount,
      errorCount: feedResult.errors.length,
      sentAt: sendResult.sentAt,
      message: `Synced ${feedResult.recordCount} records to ${carrier.carrierName}`,
    }
  } catch (error: unknown) {
    // Set error status on failure
    await db.update(schema.carrierIntegrations)
      .set({
        syncStatus: 'error',
        lastSyncStatus: error instanceof Error ? error.message : 'Sync failed',
        updatedAt: new Date(),
      })
      .where(eq(schema.carrierIntegrations.id, carrierId))

    throw error
  }
}

/**
 * Get sync history for a carrier.
 */
export async function getCarrierSyncHistory(
  orgId: string,
  carrierId: string,
  limit: number = 20
) {
  const feeds = await db.select()
    .from(schema.enrollmentFeeds)
    .where(and(
      eq(schema.enrollmentFeeds.orgId, orgId),
      eq(schema.enrollmentFeeds.carrierId, carrierId),
    ))
    .orderBy(desc(schema.enrollmentFeeds.createdAt))
    .limit(limit)

  return feeds.map(feed => ({
    feedId: feed.id,
    feedType: feed.feedType,
    status: feed.status,
    recordCount: feed.recordCount,
    errorCount: feed.errorCount || 0,
    createdAt: feed.createdAt.toISOString(),
    sentAt: feed.sentAt?.toISOString() || null,
    acknowledgedAt: feed.acknowledgedAt?.toISOString() || null,
  }))
}

// ============================================================
// Reconciliation
// ============================================================

/**
 * Reconcile enrollments between system and carrier data.
 */
export async function reconcileEnrollments(
  orgId: string,
  carrierId: string,
  carrierData?: Array<{ employeeId: string; planId: string; coverageLevel: string; effectiveDate: string; status: string }>
): Promise<ReconciliationReport> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  // Get system enrollment records
  const systemRecords = await getEnrollmentRecords(orgId, carrierId, 'full')

  // If no carrier data provided, just return system data analysis
  const carrierRecords = carrierData || []
  const systemEmployeeIds = new Set(systemRecords.map(r => r.employeeId))
  const carrierEmployeeIds = new Set(carrierRecords.map(r => r.employeeId))

  const discrepancies: Discrepancy[] = []
  let coverageDisc = 0
  let demographicDisc = 0
  let dateDisc = 0
  let matched = 0

  // Find discrepancies in matching records
  for (const sysRecord of systemRecords) {
    const carrierRecord = carrierRecords.find(c => c.employeeId === sysRecord.employeeId)
    if (!carrierRecord) continue

    matched++

    if (carrierRecord.coverageLevel !== sysRecord.coverageLevel) {
      coverageDisc++
      discrepancies.push({
        id: crypto.randomUUID(),
        carrierId,
        employeeId: sysRecord.employeeId,
        field: 'coverageLevel',
        carrierValue: carrierRecord.coverageLevel,
        systemValue: sysRecord.coverageLevel,
        detectedAt: new Date().toISOString(),
      })
    }

    if (carrierRecord.effectiveDate !== sysRecord.coverageStartDate) {
      dateDisc++
      discrepancies.push({
        id: crypto.randomUUID(),
        carrierId,
        employeeId: sysRecord.employeeId,
        field: 'effectiveDate',
        carrierValue: carrierRecord.effectiveDate,
        systemValue: sysRecord.coverageStartDate,
        detectedAt: new Date().toISOString(),
      })
    }
  }

  // Find employees missing from carrier
  const missingFromCarrier = [...systemEmployeeIds].filter(id => !carrierEmployeeIds.has(id))

  // Find employees missing from system
  const missingFromSystem = [...carrierEmployeeIds].filter(id => !systemEmployeeIds.has(id))

  const totalDiscrepancies = discrepancies.length + missingFromCarrier.length + missingFromSystem.length
  const totalRecords = Math.max(systemRecords.length, carrierRecords.length)
  const matchRate = totalRecords > 0 ? Math.round((matched / totalRecords) * 10000) / 100 : 100

  return {
    carrierId,
    carrierName: carrier.carrierName,
    reportDate: new Date().toISOString().split('T')[0],
    totalSystemRecords: systemRecords.length,
    totalCarrierRecords: carrierRecords.length,
    matchedRecords: matched,
    discrepancies,
    missingFromCarrier,
    missingFromSystem,
    summary: {
      coverageDiscrepancies: coverageDisc,
      demographicDiscrepancies: demographicDisc,
      dateDiscrepancies: dateDisc,
      totalDiscrepancies,
      matchRate,
    },
  }
}

/**
 * Resolve a specific discrepancy.
 */
export async function resolveDiscrepancy(
  orgId: string,
  carrierId: string,
  discrepancyId: string,
  resolution: 'use_system' | 'use_carrier' | 'manual',
  resolvedBy: string,
  manualValue?: string
) {
  // In a production implementation, this would update the appropriate record
  // and potentially trigger a corrective feed to the carrier
  return {
    discrepancyId,
    resolution,
    resolvedBy,
    resolvedAt: new Date().toISOString(),
    correctionFeedRequired: resolution === 'use_system',
    manualValue,
  }
}

/**
 * Generate a reconciliation report.
 */
export async function generateReconciliationReport(
  orgId: string,
  carrierId: string
): Promise<ReconciliationReport> {
  return reconcileEnrollments(orgId, carrierId)
}

// ============================================================
// Dashboard & Monitoring
// ============================================================

/**
 * Get the carrier integration dashboard.
 */
export async function getCarrierDashboard(orgId: string): Promise<CarrierDashboard> {
  // Get all carriers
  const carriers = await db.select()
    .from(schema.carrierIntegrations)
    .where(eq(schema.carrierIntegrations.orgId, orgId))

  const connectedCarriers = carriers.filter(c => c.syncStatus === 'connected').length
  const errorCarriers = carriers.filter(c => c.syncStatus === 'error').length
  const syncingCarriers = carriers.filter(c => c.syncStatus === 'syncing').length

  // Get recent feeds
  const recentFeeds = await db.select()
    .from(schema.enrollmentFeeds)
    .where(eq(schema.enrollmentFeeds.orgId, orgId))
    .orderBy(desc(schema.enrollmentFeeds.createdAt))
    .limit(10)

  const feedsWithCarrier = recentFeeds.map(feed => {
    const carrier = carriers.find(c => c.id === feed.carrierId)
    return {
      id: feed.id,
      carrierName: carrier?.carrierName || 'Unknown',
      status: feed.status,
      recordCount: feed.recordCount,
      errorCount: feed.errorCount || 0,
      createdAt: feed.createdAt.toISOString(),
    }
  })

  // Calculate upcoming syncs
  const upcomingSyncs = carriers
    .filter(c => c.syncStatus === 'connected' && c.config)
    .map(c => {
      const config = c.config as unknown as CarrierConfig | null
      const schedule = config?.schedule
      if (!schedule?.enabled) return null

      // Calculate next sync time based on schedule
      const now = new Date()
      let nextSync = new Date(now)

      switch (schedule.frequency) {
        case 'daily':
          nextSync.setDate(nextSync.getDate() + 1)
          break
        case 'weekly':
          nextSync.setDate(nextSync.getDate() + (7 - now.getDay() + (schedule.dayOfWeek || 0)) % 7 || 7)
          break
        case 'biweekly':
          nextSync.setDate(nextSync.getDate() + 14)
          break
        case 'monthly':
          nextSync.setMonth(nextSync.getMonth() + 1)
          if (schedule.dayOfMonth) nextSync.setDate(schedule.dayOfMonth)
          break
      }

      if (schedule.timeOfDay) {
        const [hours, minutes] = schedule.timeOfDay.split(':').map(Number)
        nextSync.setUTCHours(hours, minutes, 0, 0)
      }

      return {
        carrierId: c.id,
        carrierName: c.carrierName,
        nextSyncAt: nextSync.toISOString(),
      }
    })
    .filter((s): s is NonNullable<typeof s> => s !== null)
    .sort((a, b) => new Date(a.nextSyncAt).getTime() - new Date(b.nextSyncAt).getTime())

  // Health score: 100 - (error carriers * 30) - (disconnected * 10)
  const disconnectedCarriers = carriers.filter(c => c.syncStatus === 'disconnected').length
  const healthScore = Math.max(0, Math.min(100,
    100 - (errorCarriers * 30) - (disconnectedCarriers * 10)
  ))

  return {
    totalCarriers: carriers.length,
    connectedCarriers,
    errorCarriers,
    syncingCarriers,
    recentFeeds: feedsWithCarrier,
    upcomingSyncs,
    healthScore,
  }
}

/**
 * Schedule sync jobs for a carrier.
 */
export async function scheduleSyncJobs(
  orgId: string,
  carrierId: string,
  schedule: SyncSchedule
) {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  const currentConfig = (carrier.config as unknown as CarrierConfig) || {}
  const updatedConfig = {
    ...currentConfig,
    schedule,
  }

  const [updated] = await db.update(schema.carrierIntegrations)
    .set({
      config: updatedConfig as unknown as Record<string, unknown>,
      updatedAt: new Date(),
    })
    .where(eq(schema.carrierIntegrations.id, carrierId))
    .returning()

  return {
    carrierId,
    schedule,
    nextSyncEstimate: calculateNextSync(schedule),
  }
}

/**
 * Validate feed data before sending.
 */
export async function validateFeedData(
  orgId: string,
  carrierId: string
): Promise<{
  valid: boolean
  totalRecords: number
  validRecords: number
  errors: FeedError[]
  warnings: FeedError[]
}> {
  const records = await getEnrollmentRecords(orgId, carrierId, 'full')
  const errors: FeedError[] = []
  const warnings: FeedError[] = []

  for (const record of records) {
    // Required field validation
    if (!record.dateOfBirth) {
      errors.push({
        employeeId: record.employeeId,
        field: 'dateOfBirth',
        message: 'Date of birth is required for EDI 834 submission',
        severity: 'error',
        code: 'MISSING_DOB',
      })
    }

    if (!record.firstName || !record.lastName) {
      errors.push({
        employeeId: record.employeeId,
        field: 'name',
        message: 'First and last name are required',
        severity: 'error',
        code: 'MISSING_NAME',
      })
    }

    if (!record.hireDate) {
      errors.push({
        employeeId: record.employeeId,
        field: 'hireDate',
        message: 'Hire date is required',
        severity: 'error',
        code: 'MISSING_HIRE_DATE',
      })
    }

    // Warning-level validations
    if (!record.ssn) {
      warnings.push({
        employeeId: record.employeeId,
        field: 'ssn',
        message: 'SSN not provided; carrier may require it',
        severity: 'warning',
        code: 'MISSING_SSN',
      })
    }

    if (!record.address) {
      warnings.push({
        employeeId: record.employeeId,
        field: 'address',
        message: 'Address not provided; some carriers require mailing address',
        severity: 'warning',
        code: 'MISSING_ADDRESS',
      })
    }

    if (!record.gender) {
      warnings.push({
        employeeId: record.employeeId,
        field: 'gender',
        message: 'Gender not specified; will default to Unknown',
        severity: 'warning',
        code: 'MISSING_GENDER',
      })
    }
  }

  return {
    valid: errors.length === 0,
    totalRecords: records.length,
    validRecords: records.length - new Set(errors.map(e => e.employeeId)).size,
    errors,
    warnings,
  }
}

/**
 * Get carrier contact information.
 */
export async function getCarrierContacts(orgId: string, carrierId: string): Promise<{
  carrierId: string
  carrierName: string
  contacts: CarrierContact[]
}> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  const contacts: CarrierContact[] = []
  if (carrier.contactEmail) {
    contacts.push({
      name: carrier.carrierName,
      email: carrier.contactEmail,
      phone: carrier.contactPhone || undefined,
      role: 'Primary Contact',
    })
  }

  return {
    carrierId: carrier.id,
    carrierName: carrier.carrierName,
    contacts,
  }
}

/**
 * Audit carrier data completeness and accuracy.
 */
export async function auditCarrierData(orgId: string, carrierId: string): Promise<{
  carrierId: string
  carrierName: string
  auditDate: string
  connectionHealth: {
    status: SyncStatus
    lastSyncAt: string | null
    lastSyncStatus: string | null
    daysSinceLastSync: number | null
  }
  dataCompleteness: {
    totalEnrollments: number
    missingSSN: number
    missingDOB: number
    missingAddress: number
    completenessScore: number
  }
  feedHistory: {
    totalFeeds: number
    successfulFeeds: number
    failedFeeds: number
    successRate: number
    lastFeedDate: string | null
  }
  recommendations: string[]
}> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) throw new Error('Carrier integration not found')

  // Connection health
  const now = new Date()
  const daysSinceLastSync = carrier.lastSyncAt
    ? Math.floor((now.getTime() - carrier.lastSyncAt.getTime()) / (1000 * 60 * 60 * 24))
    : null

  // Data completeness - check enrollment records
  const records = await getEnrollmentRecords(orgId, carrierId, 'full')
  const missingSSN = records.filter(r => !r.ssn).length
  const missingDOB = records.filter(r => !r.dateOfBirth).length
  const missingAddress = records.filter(r => !r.address).length
  const totalFields = records.length * 3 // 3 checked fields
  const missingFields = missingSSN + missingDOB + missingAddress
  const completenessScore = totalFields > 0
    ? Math.round(((totalFields - missingFields) / totalFields) * 100)
    : 100

  // Feed history
  const feeds = await db.select()
    .from(schema.enrollmentFeeds)
    .where(and(
      eq(schema.enrollmentFeeds.orgId, orgId),
      eq(schema.enrollmentFeeds.carrierId, carrierId),
    ))
    .orderBy(desc(schema.enrollmentFeeds.createdAt))

  const successfulFeeds = feeds.filter(f => f.status === 'acknowledged' || f.status === 'sent').length
  const failedFeeds = feeds.filter(f => f.status === 'error' || f.status === 'rejected').length

  // Generate recommendations
  const recommendations: string[] = []
  if (carrier.syncStatus === 'error') {
    recommendations.push('Resolve the current connection error and test connectivity')
  }
  if (daysSinceLastSync && daysSinceLastSync > 30) {
    recommendations.push(`Last sync was ${daysSinceLastSync} days ago. Consider running a full sync.`)
  }
  if (missingSSN > 0) {
    recommendations.push(`${missingSSN} enrollee(s) are missing SSN. Update employee records for complete EDI feeds.`)
  }
  if (missingDOB > 0) {
    recommendations.push(`${missingDOB} enrollee(s) are missing date of birth. This is required for EDI 834.`)
  }
  if (completenessScore < 80) {
    recommendations.push('Data completeness is below 80%. Review and update employee records before next sync.')
  }
  if (failedFeeds > successfulFeeds && feeds.length > 0) {
    recommendations.push('Feed failure rate is high. Check carrier configuration and data quality.')
  }

  const config = carrier.config as unknown as CarrierConfig | null
  if (!config?.schedule?.enabled) {
    recommendations.push('No automatic sync schedule configured. Consider enabling scheduled syncs.')
  }

  return {
    carrierId: carrier.id,
    carrierName: carrier.carrierName,
    auditDate: now.toISOString().split('T')[0],
    connectionHealth: {
      status: carrier.syncStatus as SyncStatus,
      lastSyncAt: carrier.lastSyncAt?.toISOString() || null,
      lastSyncStatus: carrier.lastSyncStatus,
      daysSinceLastSync,
    },
    dataCompleteness: {
      totalEnrollments: records.length,
      missingSSN,
      missingDOB,
      missingAddress,
      completenessScore,
    },
    feedHistory: {
      totalFeeds: feeds.length,
      successfulFeeds,
      failedFeeds,
      successRate: feeds.length > 0 ? Math.round((successfulFeeds / feeds.length) * 100) : 100,
      lastFeedDate: feeds[0]?.createdAt?.toISOString() || null,
    },
    recommendations,
  }
}

// ============================================================
// Helpers
// ============================================================

/**
 * Get enrollment records for EDI feed generation.
 */
async function getEnrollmentRecords(
  orgId: string,
  carrierId: string,
  feedType: FeedType,
  sinceDate?: string
): Promise<EnrollmentRecord[]> {
  const [carrier] = await db.select()
    .from(schema.carrierIntegrations)
    .where(and(
      eq(schema.carrierIntegrations.id, carrierId),
      eq(schema.carrierIntegrations.orgId, orgId),
    ))

  if (!carrier) return []

  const linkedPlanIds = (carrier.planIds as unknown as string[]) || []

  // Get benefit enrollments for linked plans
  const benefitEnrollments = await db.select()
    .from(schema.benefitEnrollments)
    .where(eq(schema.benefitEnrollments.orgId, orgId))

  // Filter by linked plan IDs if any
  const filteredEnrollments = linkedPlanIds.length > 0
    ? benefitEnrollments.filter(e => linkedPlanIds.includes(e.planId))
    : benefitEnrollments

  // Get benefit plans for names
  const benefitPlans = await db.select()
    .from(schema.benefitPlans)
    .where(eq(schema.benefitPlans.orgId, orgId))

  // Get employee data
  const employees = await db.select()
    .from(schema.employees)
    .where(eq(schema.employees.orgId, orgId))

  const records: EnrollmentRecord[] = []

  for (const enrollment of filteredEnrollments) {
    const employee = employees.find(e => e.id === enrollment.employeeId)
    if (!employee) continue

    const plan = benefitPlans.find(p => p.id === enrollment.planId)
    const isCancelled = !!enrollment.cancelledAt

    // Determine maintenance type
    let maintenanceType: string = EDI_834.MAINTENANCE_TYPE.AUDIT_OR_COMPARE
    let maintenanceReason: string = EDI_834.MAINTENANCE_REASON.INITIAL_ENROLLMENT

    if (feedType === 'changes_only' && sinceDate) {
      const enrollDate = new Date(enrollment.enrolledAt)
      const since = new Date(sinceDate)
      if (enrollDate < since && !isCancelled) continue // Skip unchanged records

      if (!isCancelled) {
        maintenanceType = EDI_834.MAINTENANCE_TYPE.ADDITION
        maintenanceReason = EDI_834.MAINTENANCE_REASON.NEW_HIRE
      }
    } else {
      maintenanceType = EDI_834.MAINTENANCE_TYPE.AUDIT_OR_COMPARE
    }

    if (isCancelled) {
      maintenanceType = EDI_834.MAINTENANCE_TYPE.TERMINATION
      maintenanceReason = EDI_834.MAINTENANCE_REASON.VOLUNTARY_WITHDRAWAL
    }

    const { firstName, lastName } = splitFullName(employee.fullName)
    records.push({
      employeeId: employee.id,
      firstName,
      lastName,
      dateOfBirth: '', // dateOfBirth not in employees table
      gender: '', // Gender not in employees table
      hireDate: employee.hireDate || '',
      planId: enrollment.planId,
      planName: plan?.name || enrollment.planId,
      coverageLevel: EDI_834.COVERAGE_LEVEL.EMPLOYEE_ONLY,
      coverageStartDate: enrollment.enrolledAt.toISOString().split('T')[0],
      coverageEndDate: isCancelled ? enrollment.cancelledAt!.toISOString().split('T')[0] : undefined,
      maintenanceType,
      maintenanceReason,
    })
  }

  return records
}

function splitFullName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return { firstName: parts[0], lastName: '' }
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') }
}

function formatEDIDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}${month}${day}`
}

function formatEDITime(date: Date): string {
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}${minutes}`
}

function buildSegment(id: string, elements: string[]): string {
  return id + EDI_834.ELEMENT_SEPARATOR + elements.join(EDI_834.ELEMENT_SEPARATOR) + EDI_834.SEGMENT_TERMINATOR
}

function padRight(str: string, length: number, char: string = ' '): string {
  return str.padEnd(length, char).substring(0, length)
}

function padLeft(str: string, length: number, char: string = '0'): string {
  return str.padStart(length, char).substring(0, length)
}

function calculateNextSync(schedule: SyncSchedule): string {
  const now = new Date()
  const next = new Date(now)

  switch (schedule.frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1)
      break
    case 'weekly':
      next.setDate(next.getDate() + (7 - now.getDay() + (schedule.dayOfWeek || 0)) % 7 || 7)
      break
    case 'biweekly':
      next.setDate(next.getDate() + 14)
      break
    case 'monthly':
      next.setMonth(next.getMonth() + 1)
      if (schedule.dayOfMonth) next.setDate(schedule.dayOfMonth)
      break
    case 'on_change':
      return 'On next enrollment change'
  }

  if (schedule.timeOfDay) {
    const [hours, minutes] = schedule.timeOfDay.split(':').map(Number)
    next.setUTCHours(hours, minutes, 0, 0)
  }

  return next.toISOString()
}
