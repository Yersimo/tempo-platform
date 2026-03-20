/**
 * Device Store -> IT Asset Integration
 *
 * When a device is ordered/provisioned from the device store:
 * 1. Auto-create an IT asset record for the device
 * 2. Assign it to the employee
 *
 * All amounts are in CENTS (e.g. 500000 = $5,000).
 * All integrations are event-driven via the cross-module event bus.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** IT asset record to be created */
export interface ITAssetRecord {
  name: string
  asset_type: 'laptop' | 'desktop' | 'monitor' | 'phone' | 'tablet' | 'accessory'
  serial_number: string
  status: 'active' | 'in_storage' | 'decommissioned' | 'in_repair'
  assigned_to: string
  assigned_date: string
  purchase_cost_cents: number
  currency: string
  purchase_date: string
  warranty_expiry?: string
  source: string
  order_id?: string
  metadata: Record<string, unknown>
}

/** Result of creating an IT asset from a device provision */
export interface DeviceAssetResult {
  employeeId: string
  deviceId: string
  asset: ITAssetRecord
  warrantyMonths: number
}

/** Store slice needed for device-store -> IT asset operations */
export interface DeviceStoreAssetStoreSlice {
  addDevice?: (data: Record<string, unknown>) => void
  addToast?: (toast: { type: string; title: string; description?: string }) => void
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Default warranty periods by device type (in months) */
const WARRANTY_MONTHS: Record<string, number> = {
  laptop: 36,
  desktop: 36,
  monitor: 36,
  phone: 24,
  tablet: 24,
  accessory: 12,
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

/**
 * Generate an IT asset record from a provisioned device.
 *
 * Creates a fully populated asset record ready for persistence, including:
 * - Asset classification by device type
 * - Automatic warranty expiry calculation
 * - Cost tracking in cents
 * - Assignment to the receiving employee
 *
 * @param employeeId   - Employee receiving the device
 * @param deviceId     - Unique ID from the device store
 * @param deviceType   - Type of device provisioned
 * @param deviceName   - Human-readable name (e.g. "MacBook Pro 16-inch")
 * @param options      - Optional fields (serial, cost, order ID)
 * @returns Asset creation result
 */
export function generateITAssetFromProvision(
  employeeId: string,
  deviceId: string,
  deviceType: 'laptop' | 'desktop' | 'monitor' | 'phone' | 'tablet' | 'accessory',
  deviceName: string,
  options: {
    serialNumber?: string
    costCents?: number
    currency?: string
    orderId?: string
  } = {},
): DeviceAssetResult {
  const now = new Date()
  const warrantyMonths = WARRANTY_MONTHS[deviceType] || 12
  const warrantyExpiry = new Date(now)
  warrantyExpiry.setMonth(warrantyExpiry.getMonth() + warrantyMonths)

  const asset: ITAssetRecord = {
    name: deviceName,
    asset_type: deviceType,
    serial_number: options.serialNumber || `SN-${deviceId}`,
    status: 'active',
    assigned_to: employeeId,
    assigned_date: now.toISOString().split('T')[0],
    purchase_cost_cents: options.costCents || 0,
    currency: options.currency || 'USD',
    purchase_date: now.toISOString().split('T')[0],
    warranty_expiry: warrantyExpiry.toISOString().split('T')[0],
    source: 'device-store',
    order_id: options.orderId,
    metadata: {
      auto_created: true,
      source_integration: 'device-store-asset',
      device_store_id: deviceId,
      created_at: now.toISOString(),
    },
  }

  return {
    employeeId,
    deviceId,
    asset,
    warrantyMonths,
  }
}

/**
 * Apply the IT asset record to the store.
 *
 * @param result - Output from generateITAssetFromProvision
 * @param store  - Store actions for persisting
 * @returns Whether the asset was created
 */
export function applyITAssetCreation(
  result: DeviceAssetResult,
  store: DeviceStoreAssetStoreSlice,
): boolean {
  if (store.addDevice) {
    store.addDevice(result.asset as unknown as Record<string, unknown>)
    return true
  }
  return false
}
