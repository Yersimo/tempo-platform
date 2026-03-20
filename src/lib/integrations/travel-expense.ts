// ============================================================
// Travel → Expense Auto-Creation Integration
// ============================================================
// Automatically generates draft expense reports from completed
// travel bookings, including flights, hotels, ground transport,
// and per diem calculations based on destination country.
// ============================================================

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Travel request as stored in the Tempo store (snake_case from DB). */
export interface TravelRequest {
  id: string
  org_id: string
  employee_id: string
  purpose: string
  destination: string
  departure_date: string // ISO date string
  return_date: string    // ISO date string
  estimated_cost?: number // cents
  actual_cost?: number   // cents
  currency: string
  status: 'draft' | 'pending_approval' | 'approved' | 'booked' | 'in_progress' | 'completed' | 'cancelled'
  approved_by?: string
  approved_at?: string
  policy_id?: string
  notes?: string
  created_at: string
  updated_at: string
}

/** Travel booking as stored in the Tempo store. */
export interface TravelBooking {
  id: string
  org_id: string
  travel_request_id: string
  type: 'flight' | 'hotel' | 'car_rental' | 'train' | 'other'
  status: 'pending' | 'confirmed' | 'checked_in' | 'completed' | 'cancelled' | 'refunded'
  provider?: string
  confirmation_number?: string
  amount: number  // cents
  currency: string
  details?: Record<string, unknown>
  start_date: string
  end_date?: string
  cancellation_policy?: string
  booked_at?: string
  created_at: string
}

/** Expense report shape expected by addExpenseReport(). */
export interface ExpenseReportInput {
  employee_id: string
  title: string
  total_amount: number // cents
  currency: string
  status: 'draft'
  items: ExpenseLineItem[]
  travel_request_id?: string
  metadata?: Record<string, unknown>
}

/** Individual line item within an expense report. */
export interface ExpenseLineItem {
  id: string
  description: string
  category: string
  amount: number // cents
  date: string   // ISO date
  metadata?: Record<string, unknown>
}

/** Per diem rate configuration for a destination. */
export interface PerDiemRate {
  country: string
  city?: string
  daily: number       // total daily rate in USD (whole dollars)
  meals: number       // meals portion
  lodging: number     // lodging portion
  incidentals: number // incidentals portion
}

/** Company per diem policy overrides. */
export interface PerDiemPolicy {
  /** Percentage of standard rate (100 = full rate, 75 = 75% of standard). */
  ratePercentage: number
  /** First/last day percentage (often 75% of full day). */
  travelDayPercentage: number
  /** Per diem is reduced when meals are provided. */
  mealDeductions: {
    breakfast: number // cents to deduct
    lunch: number
    dinner: number
  }
  /** Optional flat overrides by country ISO code. */
  countryOverrides?: Record<string, Partial<PerDiemRate>>
  /** Maximum per diem days (0 = unlimited). */
  maxDays: number
}

/** Result of a per diem calculation. */
export interface PerDiemResult {
  days: PerDiemDayBreakdown[]
  totalAmount: number // cents
  currency: string
}

export interface PerDiemDayBreakdown {
  date: string
  isTravelDay: boolean
  meals: number     // cents
  lodging: number   // cents
  incidentals: number // cents
  total: number     // cents
}

/** Summary returned by syncTravelExpenses(). */
export interface SyncResult {
  createdCount: number
  skippedCount: number
  totalAmount: number // cents
  reports: ExpenseReportInput[]
  errors: Array<{ travelRequestId: string; error: string }>
}

// ---------------------------------------------------------------------------
// Default per diem rates (US GSA-style, amounts in whole USD)
// ---------------------------------------------------------------------------

const DEFAULT_PER_DIEM_RATES: PerDiemRate[] = [
  { country: 'Nigeria', city: 'Lagos', daily: 285, meals: 95, lodging: 160, incidentals: 30 },
  { country: 'Nigeria', city: 'Abuja', daily: 250, meals: 80, lodging: 145, incidentals: 25 },
  { country: 'Ghana', city: 'Accra', daily: 240, meals: 75, lodging: 140, incidentals: 25 },
  { country: 'Kenya', city: 'Nairobi', daily: 310, meals: 100, lodging: 180, incidentals: 30 },
  { country: 'Senegal', city: 'Dakar', daily: 260, meals: 85, lodging: 150, incidentals: 25 },
  { country: "Cote d'Ivoire", city: 'Abidjan', daily: 270, meals: 90, lodging: 155, incidentals: 25 },
  { country: 'South Africa', city: 'Johannesburg', daily: 295, meals: 95, lodging: 170, incidentals: 30 },
  { country: 'South Africa', city: 'Cape Town', daily: 280, meals: 90, lodging: 160, incidentals: 30 },
  { country: 'United States', city: 'New York', daily: 425, meals: 130, lodging: 260, incidentals: 35 },
  { country: 'United States', city: 'San Francisco', daily: 440, meals: 135, lodging: 270, incidentals: 35 },
  { country: 'United States', daily: 300, meals: 90, lodging: 180, incidentals: 30 },
  { country: 'United Kingdom', city: 'London', daily: 410, meals: 120, lodging: 255, incidentals: 35 },
  { country: 'United Kingdom', daily: 310, meals: 95, lodging: 185, incidentals: 30 },
  { country: 'France', city: 'Paris', daily: 380, meals: 115, lodging: 235, incidentals: 30 },
  { country: 'France', daily: 290, meals: 85, lodging: 175, incidentals: 30 },
  { country: 'Germany', city: 'Berlin', daily: 340, meals: 100, lodging: 210, incidentals: 30 },
  { country: 'Germany', daily: 310, meals: 95, lodging: 185, incidentals: 30 },
  { country: 'Japan', city: 'Tokyo', daily: 400, meals: 120, lodging: 245, incidentals: 35 },
  { country: 'Singapore', daily: 370, meals: 110, lodging: 230, incidentals: 30 },
  { country: 'UAE', city: 'Dubai', daily: 390, meals: 115, lodging: 240, incidentals: 35 },
  { country: 'Brazil', city: 'Sao Paulo', daily: 290, meals: 85, lodging: 175, incidentals: 30 },
  { country: 'India', city: 'Mumbai', daily: 230, meals: 70, lodging: 135, incidentals: 25 },
  { country: 'India', daily: 200, meals: 60, lodging: 115, incidentals: 25 },
]

/** Fallback rate when no country match is found. */
const FALLBACK_PER_DIEM: PerDiemRate = {
  country: 'Default',
  daily: 250,
  meals: 80,
  lodging: 145,
  incidentals: 25,
}

const DEFAULT_POLICY: PerDiemPolicy = {
  ratePercentage: 100,
  travelDayPercentage: 75,
  mealDeductions: { breakfast: 1500, lunch: 2000, dinner: 2500 }, // cents
  maxDays: 0, // unlimited
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

/** Parse an ISO date string to a Date at midnight UTC. */
function parseDate(dateStr: string): Date {
  const d = new Date(dateStr)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

/** Get all dates between start and end (inclusive). */
function getDateRange(startDate: string, endDate: string): string[] {
  const dates: string[] = []
  const start = parseDate(startDate)
  const end = parseDate(endDate)

  if (end < start) return [startDate]

  const current = new Date(start)
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0])
    current.setUTCDate(current.getUTCDate() + 1)
  }
  return dates
}

/** Convert whole dollars to cents. */
function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100)
}

/** Map booking type to expense category. */
function bookingTypeToCategory(type: TravelBooking['type']): string {
  switch (type) {
    case 'flight': return 'Travel - Airfare'
    case 'hotel': return 'Travel - Accommodation'
    case 'car_rental': return 'Travel - Ground Transport'
    case 'train': return 'Travel - Ground Transport'
    case 'other': return 'Travel - Other'
  }
}

/** Build a human-readable description from a booking. */
function buildBookingDescription(booking: TravelBooking): string {
  const details = booking.details as Record<string, unknown> | undefined
  const provider = booking.provider ? ` (${booking.provider})` : ''

  switch (booking.type) {
    case 'flight': {
      const airline = details?.airline ?? ''
      const flightNum = details?.flightNumber ?? details?.flight_number ?? ''
      const departure = details?.departure ?? ''
      const arrival = details?.arrival ?? ''
      const flightClass = details?.class ?? 'economy'
      const route = departure && arrival ? ` ${departure} → ${arrival}` : ''
      const num = flightNum ? ` #${flightNum}` : ''
      return `Flight${route}${airline ? ` - ${airline}` : ''}${num} (${flightClass})${provider}`.trim()
    }
    case 'hotel': {
      const hotel = details?.hotel ?? booking.provider ?? 'Hotel'
      const roomType = details?.roomType ?? details?.room_type ?? ''
      const nights = booking.end_date
        ? getDateRange(booking.start_date, booking.end_date).length - 1
        : 1
      return `${hotel}${roomType ? ` - ${roomType}` : ''} (${nights} night${nights !== 1 ? 's' : ''})${provider}`
    }
    case 'car_rental': {
      const company = details?.company ?? booking.provider ?? 'Car Rental'
      const vehicleClass = details?.vehicleClass ?? details?.vehicle_class ?? ''
      return `${company}${vehicleClass ? ` - ${vehicleClass}` : ''}${provider}`
    }
    case 'train': {
      const departure = details?.departure ?? ''
      const arrival = details?.arrival ?? ''
      const route = departure && arrival ? ` ${departure} → ${arrival}` : ''
      return `Train${route}${provider}`
    }
    default:
      return `Travel expense${provider}`
  }
}

// ---------------------------------------------------------------------------
// Per Diem Calculation
// ---------------------------------------------------------------------------

/**
 * Calculate per diem amounts for a trip based on destination, dates, and policy.
 *
 * @param destination  - Country name or "City, Country" string
 * @param startDate    - Trip start date (ISO string)
 * @param endDate      - Trip end date (ISO string)
 * @param policy       - Company per diem policy (uses defaults if omitted)
 * @param rates        - Per diem rate table (uses built-in rates if omitted)
 * @returns Per diem breakdown by day with totals in cents
 */
export function calculatePerDiem(
  destination: string,
  startDate: string,
  endDate: string,
  policy: Partial<PerDiemPolicy> = {},
  rates: PerDiemRate[] = DEFAULT_PER_DIEM_RATES,
): PerDiemResult {
  const mergedPolicy: PerDiemPolicy = { ...DEFAULT_POLICY, ...policy }
  const dates = getDateRange(startDate, endDate)

  if (dates.length === 0) {
    return { days: [], totalAmount: 0, currency: 'USD' }
  }

  // Enforce max days policy
  const effectiveDates = mergedPolicy.maxDays > 0
    ? dates.slice(0, mergedPolicy.maxDays)
    : dates

  // Resolve the rate: try city match first, then country, then fallback
  const rate = resolvePerDiemRate(destination, rates, mergedPolicy.countryOverrides)
  const pctMultiplier = mergedPolicy.ratePercentage / 100
  const travelDayMultiplier = mergedPolicy.travelDayPercentage / 100

  const days: PerDiemDayBreakdown[] = effectiveDates.map((date, index) => {
    const isFirstDay = index === 0
    const isLastDay = index === effectiveDates.length - 1
    const isTravelDay = isFirstDay || isLastDay

    const dayMultiplier = isTravelDay ? travelDayMultiplier : 1.0

    const meals = Math.round(dollarsToCents(rate.meals) * pctMultiplier * dayMultiplier)
    const lodging = Math.round(dollarsToCents(rate.lodging) * pctMultiplier * dayMultiplier)
    const incidentals = Math.round(dollarsToCents(rate.incidentals) * pctMultiplier * dayMultiplier)
    const total = meals + lodging + incidentals

    return { date, isTravelDay, meals, lodging, incidentals, total }
  })

  const totalAmount = days.reduce((sum, d) => sum + d.total, 0)

  return { days, totalAmount, currency: 'USD' }
}

/**
 * Resolve the best matching per diem rate for a destination string.
 * Supports "City, Country", "Country", or partial matches.
 */
function resolvePerDiemRate(
  destination: string,
  rates: PerDiemRate[],
  overrides?: Record<string, Partial<PerDiemRate>>,
): PerDiemRate {
  const normalized = destination.toLowerCase().trim()

  // Try exact city + country match first
  const cityMatch = rates.find(r => {
    if (!r.city) return false
    const cityCountry = `${r.city}, ${r.country}`.toLowerCase()
    return normalized.includes(cityCountry.toLowerCase()) ||
      cityCountry.includes(normalized)
  })
  if (cityMatch) return applyOverrides(cityMatch, overrides)

  // Try city-only match
  const cityOnly = rates.find(r =>
    r.city && normalized.includes(r.city.toLowerCase())
  )
  if (cityOnly) return applyOverrides(cityOnly, overrides)

  // Try country match (prefer country-level rate without city for general use)
  const countryGeneral = rates.find(r =>
    !r.city && normalized.includes(r.country.toLowerCase())
  )
  if (countryGeneral) return applyOverrides(countryGeneral, overrides)

  // Try any country match (with city, as fallback)
  const countryAny = rates.find(r =>
    normalized.includes(r.country.toLowerCase())
  )
  if (countryAny) return applyOverrides(countryAny, overrides)

  return applyOverrides(FALLBACK_PER_DIEM, overrides)
}

function applyOverrides(
  rate: PerDiemRate,
  overrides?: Record<string, Partial<PerDiemRate>>,
): PerDiemRate {
  if (!overrides) return rate
  const override = overrides[rate.country]
  if (!override) return rate
  return { ...rate, ...override }
}

// ---------------------------------------------------------------------------
// Generate Expense Report from a Single Travel Booking Set
// ---------------------------------------------------------------------------

/**
 * Generate a draft expense report from a completed/approved travel request
 * and its associated bookings.
 *
 * @param request   - The travel request (must be completed or approved)
 * @param bookings  - All bookings linked to this travel request
 * @param options   - Optional configuration
 * @returns The expense report input ready to be passed to addExpenseReport()
 * @throws If the travel request is not in a valid state for expense generation
 */
export function generateExpenseFromTravel(
  request: TravelRequest,
  bookings: TravelBooking[],
  options: {
    includePerDiem?: boolean
    perDiemPolicy?: Partial<PerDiemPolicy>
    perDiemRates?: PerDiemRate[]
    currency?: string
  } = {},
): ExpenseReportInput {
  const {
    includePerDiem = true,
    perDiemPolicy,
    perDiemRates,
    currency = request.currency || 'USD',
  } = options

  // Validate travel request state
  const validStatuses: TravelRequest['status'][] = ['completed', 'approved', 'booked', 'in_progress']
  if (!validStatuses.includes(request.status)) {
    throw new Error(
      `Cannot generate expense from travel request ${request.id}: ` +
      `status "${request.status}" is not eligible. ` +
      `Expected one of: ${validStatuses.join(', ')}`
    )
  }

  // Filter to non-cancelled bookings for this request
  const eligibleBookings = bookings.filter(b =>
    b.travel_request_id === request.id &&
    b.status !== 'cancelled' &&
    b.status !== 'refunded'
  )

  // Create line items from bookings
  const lineItems: ExpenseLineItem[] = eligibleBookings.map(booking => ({
    id: generateId(),
    description: buildBookingDescription(booking),
    category: bookingTypeToCategory(booking.type),
    amount: booking.amount, // already in cents
    date: booking.start_date,
    metadata: {
      booking_id: booking.id,
      booking_type: booking.type,
      provider: booking.provider,
      confirmation_number: booking.confirmation_number,
      auto_generated: true,
    },
  }))

  // Calculate and add per diem if requested
  if (includePerDiem && request.departure_date && request.return_date) {
    const perDiemResult = calculatePerDiem(
      request.destination,
      request.departure_date,
      request.return_date,
      perDiemPolicy,
      perDiemRates,
    )

    if (perDiemResult.totalAmount > 0) {
      // Group per diem into a single line item with day-by-day breakdown in metadata
      lineItems.push({
        id: generateId(),
        description: `Per diem - ${request.destination} (${perDiemResult.days.length} day${perDiemResult.days.length !== 1 ? 's' : ''})`,
        category: 'Travel - Per Diem',
        amount: perDiemResult.totalAmount,
        date: request.departure_date,
        metadata: {
          auto_generated: true,
          per_diem: true,
          day_breakdown: perDiemResult.days,
        },
      })
    }
  }

  const totalAmount = lineItems.reduce((sum, item) => sum + item.amount, 0)

  const report: ExpenseReportInput = {
    employee_id: request.employee_id,
    title: `Travel Expense: ${request.destination} - ${request.purpose}`,
    total_amount: totalAmount,
    currency,
    status: 'draft',
    items: lineItems,
    travel_request_id: request.id,
    metadata: {
      auto_generated: true,
      source: 'travel-expense-integration',
      travel_request_id: request.id,
      destination: request.destination,
      departure_date: request.departure_date,
      return_date: request.return_date,
      generated_at: new Date().toISOString(),
    },
  }

  return report
}

// ---------------------------------------------------------------------------
// Batch Sync: Scan and Generate Missing Expense Reports
// ---------------------------------------------------------------------------

/**
 * Scan all completed travel bookings and generate expense reports for any
 * that don't already have a linked expense report.
 *
 * @param travelRequests   - All travel requests in the org
 * @param travelBookings   - All travel bookings in the org
 * @param expenseReports   - Existing expense reports (to check for duplicates)
 * @param options          - Configuration options
 * @returns Summary of created reports, skipped items, and any errors
 */
export function syncTravelExpenses(
  travelRequests: TravelRequest[],
  travelBookings: TravelBooking[],
  expenseReports: Array<{ id: string; travel_request_id?: string; metadata?: Record<string, unknown> }>,
  options: {
    includePerDiem?: boolean
    perDiemPolicy?: Partial<PerDiemPolicy>
    perDiemRates?: PerDiemRate[]
    /** Only process requests completed after this date (ISO string). */
    since?: string
    /** Dry run: calculate but don't return reports for creation. */
    dryRun?: boolean
  } = {},
): SyncResult {
  const {
    includePerDiem = true,
    perDiemPolicy,
    perDiemRates,
    since,
  } = options

  // Build a set of travel request IDs that already have expense reports
  const coveredRequestIds = new Set<string>()
  for (const report of expenseReports) {
    if (report.travel_request_id) {
      coveredRequestIds.add(report.travel_request_id)
    }
    // Also check metadata for backward compatibility
    const meta = report.metadata as Record<string, unknown> | undefined
    if (meta?.travel_request_id && typeof meta.travel_request_id === 'string') {
      coveredRequestIds.add(meta.travel_request_id)
    }
  }

  // Find eligible travel requests (completed/approved, not yet expensed)
  const eligibleStatuses: TravelRequest['status'][] = ['completed', 'approved', 'booked', 'in_progress']
  const eligible = travelRequests.filter(req => {
    if (!eligibleStatuses.includes(req.status)) return false
    if (coveredRequestIds.has(req.id)) return false
    if (since && req.updated_at < since) return false
    return true
  })

  const result: SyncResult = {
    createdCount: 0,
    skippedCount: 0,
    totalAmount: 0,
    reports: [],
    errors: [],
  }

  for (const request of eligible) {
    try {
      // Get bookings for this request
      const requestBookings = travelBookings.filter(
        b => b.travel_request_id === request.id
      )

      // Skip if no bookings at all
      if (requestBookings.length === 0) {
        result.skippedCount++
        continue
      }

      // Skip if all bookings are cancelled/refunded
      const activeBookings = requestBookings.filter(
        b => b.status !== 'cancelled' && b.status !== 'refunded'
      )
      if (activeBookings.length === 0) {
        result.skippedCount++
        continue
      }

      const report = generateExpenseFromTravel(request, requestBookings, {
        includePerDiem,
        perDiemPolicy,
        perDiemRates,
      })

      result.reports.push(report)
      result.createdCount++
      result.totalAmount += report.total_amount
    } catch (err) {
      result.errors.push({
        travelRequestId: request.id,
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }

  result.skippedCount += travelRequests.length - eligible.length - result.skippedCount

  return result
}

// ---------------------------------------------------------------------------
// Utilities exposed for external use
// ---------------------------------------------------------------------------

/** Get the built-in per diem rate table. */
export function getDefaultPerDiemRates(): PerDiemRate[] {
  return [...DEFAULT_PER_DIEM_RATES]
}

/** Look up a per diem rate for a destination string. */
export function lookupPerDiemRate(
  destination: string,
  rates: PerDiemRate[] = DEFAULT_PER_DIEM_RATES,
): PerDiemRate {
  return resolvePerDiemRate(destination, rates)
}

/** Get the number of travel days between two dates. */
export function getTravelDayCount(startDate: string, endDate: string): number {
  return getDateRange(startDate, endDate).length
}

/** Check whether a travel request already has a linked expense report. */
export function hasLinkedExpenseReport(
  travelRequestId: string,
  expenseReports: Array<{ travel_request_id?: string; metadata?: Record<string, unknown> }>,
): boolean {
  return expenseReports.some(r => {
    if (r.travel_request_id === travelRequestId) return true
    const meta = r.metadata as Record<string, unknown> | undefined
    return meta?.travel_request_id === travelRequestId
  })
}
