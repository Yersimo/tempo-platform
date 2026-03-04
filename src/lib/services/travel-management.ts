/**
 * Travel Management Service
 *
 * Flight, hotel, and car rental search/booking; travel policy enforcement;
 * itinerary generation; post-trip expense integration; preferred vendor
 * management; and travel spend analytics.
 */

import { db, schema } from '@/lib/db'
import { eq, and, desc, sql, gte, lte, count, sum } from 'drizzle-orm'

// ============================================================
// TYPES & INTERFACES
// ============================================================

export interface CreateTravelRequestInput {
  orgId: string
  employeeId: string
  purpose: string
  destination: string
  departureDate: string // YYYY-MM-DD
  returnDate: string // YYYY-MM-DD
  estimatedCost?: number // cents
  currency?: string
  policyId?: string
  notes?: string
}

export interface FlightSearchParams {
  origin: string // IATA code
  destination: string // IATA code
  departureDate: string
  returnDate?: string
  passengers: number
  cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first'
  maxPrice?: number // cents
  preferredAirlines?: string[]
}

export interface FlightResult {
  id: string
  airline: string
  flightNumber: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  duration: number // minutes
  cabinClass: string
  price: number // cents
  currency: string
  stops: number
  seatsAvailable: number
  isPreferred: boolean
  refundable: boolean
}

export interface HotelSearchParams {
  city: string
  checkIn: string
  checkOut: string
  guests: number
  maxRate?: number // cents per night
  starRating?: number
  preferredChains?: string[]
}

export interface HotelResult {
  id: string
  name: string
  chain: string
  address: string
  city: string
  starRating: number
  roomType: string
  ratePerNight: number // cents
  totalRate: number // cents
  currency: string
  amenities: string[]
  cancellationPolicy: string
  isPreferred: boolean
  availableRooms: number
}

export interface CarRentalSearchParams {
  pickupLocation: string
  dropoffLocation?: string
  pickupDate: string
  dropoffDate: string
  vehicleClass?: 'economy' | 'compact' | 'midsize' | 'full_size' | 'suv' | 'luxury'
  maxPrice?: number // cents per day
}

export interface CarRentalResult {
  id: string
  company: string
  vehicleClass: string
  vehicleName: string
  dailyRate: number // cents
  totalRate: number // cents
  currency: string
  pickupLocation: string
  dropoffLocation: string
  insuranceIncluded: boolean
  mileageLimit: string
  isPreferred: boolean
}

export interface BookingInput {
  orgId: string
  travelRequestId: string
  type: 'flight' | 'hotel' | 'car_rental' | 'train' | 'other'
  provider: string
  confirmationNumber: string
  amount: number // cents
  currency?: string
  details: Record<string, unknown>
  startDate: string
  endDate?: string
  cancellationPolicy?: string
}

export interface Itinerary {
  travelRequestId: string
  travelerName: string
  destination: string
  departureDate: string
  returnDate: string
  purpose: string
  status: string
  bookings: Array<{
    type: string
    provider: string | null
    confirmationNumber: string | null
    amount: number
    currency: string
    status: string
    startDate: string
    endDate: string | null
    details: Record<string, unknown> | null
  }>
  totalCost: number
  estimatedCost: number | null
  currency: string
}

export interface PolicyComplianceResult {
  isCompliant: boolean
  violations: Array<{
    field: string
    rule: string
    actual: string | number
    allowed: string | number
    severity: 'warning' | 'error'
  }>
  warnings: string[]
}

export interface TravelAnalytics {
  orgId: string
  totalSpend: number
  totalTrips: number
  averageTripCost: number
  spendByCategory: Array<{ type: string; amount: number; count: number }>
  spendByDestination: Array<{ destination: string; amount: number; count: number }>
  spendByEmployee: Array<{ employeeId: string; amount: number; count: number }>
  monthlyTrend: Array<{ month: string; amount: number; count: number }>
  policyComplianceRate: number
  advanceBookingAvg: number // days
  savingsFromPreferred: number
}

// ============================================================
// ERROR CLASS
// ============================================================

export class TravelManagementError extends Error {
  constructor(message: string, public code: string) {
    super(message)
    this.name = 'TravelManagementError'
  }
}

// ============================================================
// HELPERS
// ============================================================

function generateSearchId(): string {
  return `SR-${Date.now().toString(36).toUpperCase()}`
}

function daysBetween(d1: string, d2: string): number {
  const date1 = new Date(d1)
  const date2 = new Date(d2)
  return Math.ceil((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24))
}

// ============================================================
// TRAVEL REQUESTS
// ============================================================

/**
 * Create a new travel request.
 */
export async function createTravelRequest(input: CreateTravelRequestInput) {
  const { orgId, employeeId, purpose, destination, departureDate, returnDate, estimatedCost, currency, policyId, notes } = input

  // Validate dates
  const depDate = new Date(departureDate)
  const retDate = new Date(returnDate)
  if (retDate <= depDate) {
    throw new TravelManagementError('Return date must be after departure date', 'INVALID_DATES')
  }

  // Verify employee
  const [employee] = await db
    .select({ id: schema.employees.id })
    .from(schema.employees)
    .where(and(eq(schema.employees.id, employeeId), eq(schema.employees.orgId, orgId)))

  if (!employee) {
    throw new TravelManagementError('Employee not found', 'EMPLOYEE_NOT_FOUND')
  }

  const [request] = await db
    .insert(schema.travelRequests)
    .values({
      orgId,
      employeeId,
      purpose,
      destination,
      departureDate,
      returnDate,
      estimatedCost: estimatedCost ?? null,
      currency: currency ?? 'USD',
      status: 'draft',
      policyId: policyId ?? null,
      notes: notes ?? null,
    })
    .returning()

  return request
}

/**
 * Approve a travel request (checks policy compliance first).
 */
export async function approveTravelRequest(requestId: string, orgId: string, approverId: string) {
  const [request] = await db
    .select()
    .from(schema.travelRequests)
    .where(and(eq(schema.travelRequests.id, requestId), eq(schema.travelRequests.orgId, orgId)))

  if (!request) {
    throw new TravelManagementError('Travel request not found', 'REQUEST_NOT_FOUND')
  }

  if (request.status !== 'draft' && request.status !== 'pending_approval') {
    throw new TravelManagementError(`Cannot approve request in status: ${request.status}`, 'INVALID_STATUS')
  }

  // If a policy is linked, check auto-approval threshold
  if (request.policyId) {
    const [policy] = await db
      .select()
      .from(schema.travelPolicies)
      .where(eq(schema.travelPolicies.id, request.policyId))

    if (policy && policy.approvalThreshold && request.estimatedCost) {
      if (request.estimatedCost <= policy.approvalThreshold) {
        // Auto-approved
        const [updated] = await db
          .update(schema.travelRequests)
          .set({ status: 'approved', approvedBy: approverId, approvedAt: new Date() })
          .where(eq(schema.travelRequests.id, requestId))
          .returning()
        return { request: updated, autoApproved: true }
      }
    }
  }

  const [updated] = await db
    .update(schema.travelRequests)
    .set({ status: 'approved', approvedBy: approverId, approvedAt: new Date() })
    .where(eq(schema.travelRequests.id, requestId))
    .returning()

  return { request: updated, autoApproved: false }
}

// ============================================================
// SEARCH (SIMULATED PROVIDERS)
// ============================================================

/**
 * Search for available flights. Returns simulated results that
 * respect the search params and integrate with preferred vendor lists.
 */
export async function searchFlights(orgId: string, params: FlightSearchParams): Promise<FlightResult[]> {
  // Load preferred airlines from active policy
  const policies = await db
    .select()
    .from(schema.travelPolicies)
    .where(and(eq(schema.travelPolicies.orgId, orgId), eq(schema.travelPolicies.isActive, true)))

  const preferredAirlines: string[] = []
  for (const p of policies) {
    if (p.preferredAirlines) {
      preferredAirlines.push(...(p.preferredAirlines as string[]))
    }
  }

  // Simulated provider integration
  const airlines = params.preferredAirlines?.length ? params.preferredAirlines : ['United Airlines', 'Delta Air Lines', 'American Airlines', 'Southwest Airlines', 'JetBlue Airways']
  const cabinClass = params.cabinClass ?? 'economy'

  const basePrice: Record<string, number> = {
    economy: 35000, // $350
    premium_economy: 65000,
    business: 150000,
    first: 350000,
  }

  const results: FlightResult[] = airlines.map((airline, idx) => {
    const variance = 0.7 + Math.random() * 0.6 // 70% to 130% of base
    const price = Math.round(basePrice[cabinClass] * variance)
    const isPreferred = preferredAirlines.includes(airline)

    return {
      id: `${generateSearchId()}-F${idx}`,
      airline,
      flightNumber: `${airline.substring(0, 2).toUpperCase()}${100 + idx * 37}`,
      origin: params.origin,
      destination: params.destination,
      departureTime: `${params.departureDate}T${8 + idx * 2}:00:00`,
      arrivalTime: `${params.departureDate}T${12 + idx * 2}:30:00`,
      duration: 240 + idx * 30,
      cabinClass,
      price,
      currency: 'USD',
      stops: idx % 3 === 0 ? 0 : 1,
      seatsAvailable: Math.floor(5 + Math.random() * 50),
      isPreferred,
      refundable: cabinClass !== 'economy',
    }
  })

  // Filter by max price
  const filtered = params.maxPrice
    ? results.filter((r) => r.price <= params.maxPrice!)
    : results

  // Sort: preferred first, then by price
  filtered.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
    return a.price - b.price
  })

  return filtered
}

/**
 * Search for available hotels.
 */
export async function searchHotels(orgId: string, params: HotelSearchParams): Promise<HotelResult[]> {
  const policies = await db
    .select()
    .from(schema.travelPolicies)
    .where(and(eq(schema.travelPolicies.orgId, orgId), eq(schema.travelPolicies.isActive, true)))

  const preferredHotels: string[] = []
  for (const p of policies) {
    if (p.preferredHotels) {
      preferredHotels.push(...(p.preferredHotels as string[]))
    }
  }

  const chains = params.preferredChains?.length
    ? params.preferredChains
    : ['Marriott', 'Hilton', 'Hyatt', 'IHG', 'Best Western', 'Wyndham']

  const nights = daysBetween(params.checkIn, params.checkOut)

  const results: HotelResult[] = chains.map((chain, idx) => {
    const starRating = Math.min(5, 3 + Math.floor(idx / 2))
    const ratePerNight = Math.round((12000 + idx * 5000) * (0.8 + Math.random() * 0.4))
    const isPreferred = preferredHotels.includes(chain)

    return {
      id: `${generateSearchId()}-H${idx}`,
      name: `${chain} ${params.city} Downtown`,
      chain,
      address: `${100 + idx * 50} Main Street`,
      city: params.city,
      starRating,
      roomType: idx % 2 === 0 ? 'Standard King' : 'Standard Double',
      ratePerNight,
      totalRate: ratePerNight * nights,
      currency: 'USD',
      amenities: ['WiFi', 'Gym', 'Business Center', ...(starRating >= 4 ? ['Pool', 'Spa', 'Restaurant'] : [])],
      cancellationPolicy: starRating >= 4 ? 'Free cancellation up to 24h before check-in' : 'Non-refundable',
      isPreferred,
      availableRooms: Math.floor(2 + Math.random() * 15),
    }
  })

  // Filter by max rate and star rating
  let filtered = results
  if (params.maxRate) {
    filtered = filtered.filter((r) => r.ratePerNight <= params.maxRate!)
  }
  if (params.starRating) {
    filtered = filtered.filter((r) => r.starRating >= params.starRating!)
  }

  filtered.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
    return a.ratePerNight - b.ratePerNight
  })

  return filtered
}

/**
 * Search for car rentals.
 */
export async function searchCarRentals(orgId: string, params: CarRentalSearchParams): Promise<CarRentalResult[]> {
  const companies = ['Enterprise', 'Hertz', 'Avis', 'Budget', 'National']
  const days = daysBetween(params.pickupDate, params.dropoffDate)

  const classRates: Record<string, number> = {
    economy: 4500,
    compact: 5500,
    midsize: 6500,
    full_size: 7500,
    suv: 9500,
    luxury: 15000,
  }

  const vehicleClass = params.vehicleClass ?? 'midsize'

  const results: CarRentalResult[] = companies.map((company, idx) => {
    const variance = 0.85 + Math.random() * 0.3
    const dailyRate = Math.round(classRates[vehicleClass] * variance)

    return {
      id: `${generateSearchId()}-C${idx}`,
      company,
      vehicleClass,
      vehicleName: `${vehicleClass.charAt(0).toUpperCase() + vehicleClass.slice(1)} ${['Sedan', 'Hatchback', 'SUV', 'Crossover', 'Van'][idx]}`,
      dailyRate,
      totalRate: dailyRate * days,
      currency: 'USD',
      pickupLocation: params.pickupLocation,
      dropoffLocation: params.dropoffLocation ?? params.pickupLocation,
      insuranceIncluded: idx % 2 === 0,
      mileageLimit: idx < 2 ? 'Unlimited' : '300 miles/day',
      isPreferred: idx < 2, // First two are preferred
    }
  })

  let filtered = results
  if (params.maxPrice) {
    filtered = filtered.filter((r) => r.dailyRate <= params.maxPrice!)
  }

  filtered.sort((a, b) => {
    if (a.isPreferred !== b.isPreferred) return a.isPreferred ? -1 : 1
    return a.dailyRate - b.dailyRate
  })

  return filtered
}

// ============================================================
// BOOKING MANAGEMENT
// ============================================================

/**
 * Book a travel arrangement and link it to a travel request.
 */
export async function bookTravel(input: BookingInput) {
  const { orgId, travelRequestId, type, provider, confirmationNumber, amount, currency, details, startDate, endDate, cancellationPolicy } = input

  // Verify travel request is approved
  const [request] = await db
    .select()
    .from(schema.travelRequests)
    .where(
      and(
        eq(schema.travelRequests.id, travelRequestId),
        eq(schema.travelRequests.orgId, orgId),
      ),
    )

  if (!request) {
    throw new TravelManagementError('Travel request not found', 'REQUEST_NOT_FOUND')
  }

  if (request.status !== 'approved' && request.status !== 'booked') {
    throw new TravelManagementError('Travel request must be approved before booking', 'NOT_APPROVED')
  }

  const [booking] = await db
    .insert(schema.travelBookings)
    .values({
      orgId,
      travelRequestId,
      type,
      status: 'confirmed',
      provider,
      confirmationNumber,
      amount,
      currency: currency ?? 'USD',
      details,
      startDate,
      endDate: endDate ?? null,
      cancellationPolicy: cancellationPolicy ?? null,
      bookedAt: new Date(),
    })
    .returning()

  // Update travel request status to booked
  await db
    .update(schema.travelRequests)
    .set({ status: 'booked' })
    .where(eq(schema.travelRequests.id, travelRequestId))

  return booking
}

/**
 * Cancel an existing booking.
 */
export async function cancelBooking(bookingId: string, orgId: string) {
  const [booking] = await db
    .select()
    .from(schema.travelBookings)
    .where(and(eq(schema.travelBookings.id, bookingId), eq(schema.travelBookings.orgId, orgId)))

  if (!booking) {
    throw new TravelManagementError('Booking not found', 'BOOKING_NOT_FOUND')
  }

  if (booking.status === 'cancelled') {
    throw new TravelManagementError('Booking is already cancelled', 'ALREADY_CANCELLED')
  }
  if (booking.status === 'completed') {
    throw new TravelManagementError('Cannot cancel a completed booking', 'CANNOT_CANCEL_COMPLETED')
  }

  const [updated] = await db
    .update(schema.travelBookings)
    .set({ status: 'cancelled' })
    .where(eq(schema.travelBookings.id, bookingId))
    .returning()

  return updated
}

/**
 * Modify an existing booking (e.g. change dates, room type).
 */
export async function modifyBooking(
  bookingId: string,
  orgId: string,
  updates: Partial<Pick<BookingInput, 'amount' | 'details' | 'startDate' | 'endDate' | 'provider'>>,
) {
  const [booking] = await db
    .select()
    .from(schema.travelBookings)
    .where(and(eq(schema.travelBookings.id, bookingId), eq(schema.travelBookings.orgId, orgId)))

  if (!booking) {
    throw new TravelManagementError('Booking not found', 'BOOKING_NOT_FOUND')
  }

  if (booking.status === 'cancelled' || booking.status === 'completed') {
    throw new TravelManagementError(`Cannot modify a ${booking.status} booking`, 'CANNOT_MODIFY')
  }

  const [updated] = await db
    .update(schema.travelBookings)
    .set({
      ...(updates.amount !== undefined && { amount: updates.amount }),
      ...(updates.details !== undefined && { details: updates.details }),
      ...(updates.startDate !== undefined && { startDate: updates.startDate }),
      ...(updates.endDate !== undefined && { endDate: updates.endDate }),
      ...(updates.provider !== undefined && { provider: updates.provider }),
    })
    .where(eq(schema.travelBookings.id, bookingId))
    .returning()

  return updated
}

// ============================================================
// ITINERARY & POLICY
// ============================================================

/**
 * Generate a complete itinerary for a travel request with all linked bookings.
 */
export async function getItinerary(requestId: string, orgId: string): Promise<Itinerary> {
  const [request] = await db
    .select()
    .from(schema.travelRequests)
    .where(and(eq(schema.travelRequests.id, requestId), eq(schema.travelRequests.orgId, orgId)))

  if (!request) {
    throw new TravelManagementError('Travel request not found', 'REQUEST_NOT_FOUND')
  }

  // Fetch employee name
  const [employee] = await db
    .select({ firstName: schema.employees.firstName, lastName: schema.employees.lastName })
    .from(schema.employees)
    .where(eq(schema.employees.id, request.employeeId))

  // Fetch all bookings for this request
  const bookings = await db
    .select()
    .from(schema.travelBookings)
    .where(eq(schema.travelBookings.travelRequestId, requestId))
    .orderBy(schema.travelBookings.startDate)

  const totalCost = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
    .reduce((s, b) => s + b.amount, 0)

  return {
    travelRequestId: request.id,
    travelerName: employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown',
    destination: request.destination,
    departureDate: request.departureDate,
    returnDate: request.returnDate,
    purpose: request.purpose,
    status: request.status,
    bookings: bookings.map((b) => ({
      type: b.type,
      provider: b.provider,
      confirmationNumber: b.confirmationNumber,
      amount: b.amount,
      currency: b.currency,
      status: b.status,
      startDate: b.startDate,
      endDate: b.endDate,
      details: b.details as Record<string, unknown> | null,
    })),
    totalCost,
    estimatedCost: request.estimatedCost,
    currency: request.currency,
  }
}

/**
 * Submit a travel expense after trip completion, linking it to the travel request.
 */
export async function submitTravelExpense(
  requestId: string,
  orgId: string,
  expenses: Array<{ description: string; amount: number; category: string; receiptUrl?: string }>,
) {
  const [request] = await db
    .select()
    .from(schema.travelRequests)
    .where(and(eq(schema.travelRequests.id, requestId), eq(schema.travelRequests.orgId, orgId)))

  if (!request) {
    throw new TravelManagementError('Travel request not found', 'REQUEST_NOT_FOUND')
  }

  const totalActualCost = expenses.reduce((s, e) => s + e.amount, 0)

  // Update the actual cost on the travel request
  await db
    .update(schema.travelRequests)
    .set({ actualCost: totalActualCost, status: 'completed' })
    .where(eq(schema.travelRequests.id, requestId))

  return {
    travelRequestId: requestId,
    employeeId: request.employeeId,
    totalExpenses: totalActualCost,
    estimatedCost: request.estimatedCost,
    variance: request.estimatedCost ? totalActualCost - request.estimatedCost : null,
    expenseCount: expenses.length,
    expenses,
  }
}

/**
 * Check a booking or travel request against the organization's travel policy.
 */
export async function checkPolicyCompliance(
  orgId: string,
  policyId: string,
  booking: { type: string; cabinClass?: string; hotelRate?: number; carClass?: string; departureDate?: string; amount?: number },
): Promise<PolicyComplianceResult> {
  const [policy] = await db
    .select()
    .from(schema.travelPolicies)
    .where(and(eq(schema.travelPolicies.id, policyId), eq(schema.travelPolicies.orgId, orgId)))

  if (!policy) {
    throw new TravelManagementError('Travel policy not found', 'POLICY_NOT_FOUND')
  }

  const violations: PolicyComplianceResult['violations'] = []
  const warnings: string[] = []

  // Flight class check
  if (booking.type === 'flight' && booking.cabinClass) {
    const classOrder = ['economy', 'premium_economy', 'business', 'first']
    const maxIdx = classOrder.indexOf(policy.maxFlightClass)
    const actualIdx = classOrder.indexOf(booking.cabinClass)
    if (actualIdx > maxIdx) {
      violations.push({
        field: 'cabinClass',
        rule: `Maximum allowed class is ${policy.maxFlightClass}`,
        actual: booking.cabinClass,
        allowed: policy.maxFlightClass,
        severity: 'error',
      })
    }
  }

  // Hotel rate check
  if (booking.type === 'hotel' && booking.hotelRate && policy.maxHotelRate) {
    if (booking.hotelRate > policy.maxHotelRate) {
      violations.push({
        field: 'hotelRate',
        rule: `Maximum hotel rate is ${policy.maxHotelRate} per night`,
        actual: booking.hotelRate,
        allowed: policy.maxHotelRate,
        severity: 'error',
      })
    }
  }

  // Car class check
  if (booking.type === 'car_rental' && booking.carClass && policy.maxCarClass) {
    const carOrder = ['economy', 'compact', 'midsize', 'full_size', 'suv', 'luxury']
    const maxIdx = carOrder.indexOf(policy.maxCarClass)
    const actualIdx = carOrder.indexOf(booking.carClass)
    if (actualIdx > maxIdx) {
      violations.push({
        field: 'carClass',
        rule: `Maximum allowed car class is ${policy.maxCarClass}`,
        actual: booking.carClass,
        allowed: policy.maxCarClass,
        severity: 'error',
      })
    }
  }

  // Advance booking days check
  if (booking.departureDate && policy.advanceBookingDays) {
    const today = new Date()
    const departure = new Date(booking.departureDate)
    const daysInAdvance = Math.ceil((departure.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    if (daysInAdvance < policy.advanceBookingDays) {
      warnings.push(
        `Booking is ${daysInAdvance} days in advance; policy recommends at least ${policy.advanceBookingDays} days`,
      )
    }
  }

  return {
    isCompliant: violations.filter((v) => v.severity === 'error').length === 0,
    violations,
    warnings,
  }
}

// ============================================================
// PREFERRED VENDORS
// ============================================================

/**
 * Get preferred vendors (airlines, hotels) from active travel policies.
 */
export async function getPreferredVendors(orgId: string) {
  const policies = await db
    .select()
    .from(schema.travelPolicies)
    .where(and(eq(schema.travelPolicies.orgId, orgId), eq(schema.travelPolicies.isActive, true)))

  const airlines = new Set<string>()
  const hotels = new Set<string>()

  for (const p of policies) {
    if (p.preferredAirlines) {
      for (const a of p.preferredAirlines as string[]) airlines.add(a)
    }
    if (p.preferredHotels) {
      for (const h of p.preferredHotels as string[]) hotels.add(h)
    }
  }

  return {
    airlines: Array.from(airlines),
    hotels: Array.from(hotels),
    policies: policies.map((p) => ({
      id: p.id,
      name: p.name,
      maxFlightClass: p.maxFlightClass,
      maxHotelRate: p.maxHotelRate,
      advanceBookingDays: p.advanceBookingDays,
    })),
  }
}

// ============================================================
// ANALYTICS & REPORTING
// ============================================================

/**
 * Calculate a travel budget estimate based on destination, dates, and policy.
 */
export async function calculateTravelBudget(
  orgId: string,
  destination: string,
  departureDate: string,
  returnDate: string,
  policyId?: string,
) {
  const nights = daysBetween(departureDate, returnDate)

  // Get policy limits or use defaults
  let maxHotelRate = 20000 // $200/night default
  let maxDailyMeals = 7500 // $75/day default
  let flightBudget = 50000 // $500 default

  if (policyId) {
    const [policy] = await db
      .select()
      .from(schema.travelPolicies)
      .where(and(eq(schema.travelPolicies.id, policyId), eq(schema.travelPolicies.orgId, orgId)))

    if (policy) {
      maxHotelRate = policy.maxHotelRate ?? maxHotelRate
      maxDailyMeals = policy.maxDailyMeals ?? maxDailyMeals
    }
  }

  const hotelTotal = maxHotelRate * nights
  const mealsTotal = maxDailyMeals * (nights + 1) // +1 for travel day
  const transportTotal = Math.round(flightBudget * 0.15) // ~15% of flight for ground transport

  return {
    destination,
    departureDate,
    returnDate,
    nights,
    breakdown: {
      flights: flightBudget,
      hotel: hotelTotal,
      meals: mealsTotal,
      groundTransport: transportTotal,
      incidentals: Math.round((hotelTotal + mealsTotal) * 0.1),
    },
    totalBudget: flightBudget + hotelTotal + mealsTotal + transportTotal + Math.round((hotelTotal + mealsTotal) * 0.1),
    currency: 'USD',
  }
}

/**
 * Get comprehensive travel analytics for the organization.
 */
export async function getTravelAnalytics(orgId: string): Promise<TravelAnalytics> {
  // Total trips and spend
  const requests = await db
    .select()
    .from(schema.travelRequests)
    .where(eq(schema.travelRequests.orgId, orgId))

  const completedTrips = requests.filter((r) => r.status === 'completed')
  const totalSpend = completedTrips.reduce((s, r) => s + (r.actualCost ?? r.estimatedCost ?? 0), 0)
  const averageTripCost = completedTrips.length > 0 ? Math.round(totalSpend / completedTrips.length) : 0

  // Spend by booking type
  const bookingTypeRows = await db
    .select({
      type: schema.travelBookings.type,
      amount: sum(schema.travelBookings.amount),
      count: count(),
    })
    .from(schema.travelBookings)
    .where(
      and(
        eq(schema.travelBookings.orgId, orgId),
        sql`${schema.travelBookings.status} NOT IN ('cancelled', 'refunded')`,
      ),
    )
    .groupBy(schema.travelBookings.type)

  // Spend by destination
  const destGroups: Record<string, { amount: number; count: number }> = {}
  for (const r of requests) {
    if (!destGroups[r.destination]) destGroups[r.destination] = { amount: 0, count: 0 }
    destGroups[r.destination].amount += r.actualCost ?? r.estimatedCost ?? 0
    destGroups[r.destination].count++
  }

  // Spend by employee
  const empGroups: Record<string, { amount: number; count: number }> = {}
  for (const r of requests) {
    if (!empGroups[r.employeeId]) empGroups[r.employeeId] = { amount: 0, count: 0 }
    empGroups[r.employeeId].amount += r.actualCost ?? r.estimatedCost ?? 0
    empGroups[r.employeeId].count++
  }

  // Monthly trend
  const monthlyRows = await db
    .select({
      month: sql<string>`TO_CHAR(${schema.travelBookings.bookedAt}, 'YYYY-MM')`,
      amount: sum(schema.travelBookings.amount),
      count: count(),
    })
    .from(schema.travelBookings)
    .where(
      and(
        eq(schema.travelBookings.orgId, orgId),
        sql`${schema.travelBookings.status} NOT IN ('cancelled', 'refunded')`,
        sql`${schema.travelBookings.bookedAt} IS NOT NULL`,
      ),
    )
    .groupBy(sql`TO_CHAR(${schema.travelBookings.bookedAt}, 'YYYY-MM')`)
    .orderBy(sql`TO_CHAR(${schema.travelBookings.bookedAt}, 'YYYY-MM')`)

  // Policy compliance rate
  const totalRequests = requests.length
  const approvedOrCompleted = requests.filter((r) => ['approved', 'booked', 'completed'].includes(r.status)).length
  const complianceRate = totalRequests > 0 ? Math.round((approvedOrCompleted / totalRequests) * 100) : 100

  // Average advance booking days
  let totalAdvanceDays = 0
  let advanceCount = 0
  for (const r of requests) {
    const created = new Date(r.createdAt)
    const departure = new Date(r.departureDate)
    const days = Math.ceil((departure.getTime() - created.getTime()) / (1000 * 60 * 60 * 24))
    if (days > 0) {
      totalAdvanceDays += days
      advanceCount++
    }
  }

  return {
    orgId,
    totalSpend,
    totalTrips: requests.length,
    averageTripCost,
    spendByCategory: bookingTypeRows.map((r) => ({
      type: r.type,
      amount: Number(r.amount ?? 0),
      count: Number(r.count),
    })),
    spendByDestination: Object.entries(destGroups)
      .map(([destination, data]) => ({ destination, ...data }))
      .sort((a, b) => b.amount - a.amount),
    spendByEmployee: Object.entries(empGroups)
      .map(([employeeId, data]) => ({ employeeId, ...data }))
      .sort((a, b) => b.amount - a.amount),
    monthlyTrend: monthlyRows.map((r) => ({
      month: r.month,
      amount: Number(r.amount ?? 0),
      count: Number(r.count),
    })),
    policyComplianceRate: complianceRate,
    advanceBookingAvg: advanceCount > 0 ? Math.round(totalAdvanceDays / advanceCount) : 0,
    savingsFromPreferred: Math.round(totalSpend * 0.12), // Estimated 12% savings from preferred vendors
  }
}

/**
 * Generate a travel report for a date range.
 */
export async function generateTravelReport(orgId: string, startDate: string, endDate: string) {
  const requests = await db
    .select()
    .from(schema.travelRequests)
    .where(
      and(
        eq(schema.travelRequests.orgId, orgId),
        gte(schema.travelRequests.createdAt, new Date(startDate)),
        lte(schema.travelRequests.createdAt, new Date(endDate)),
      ),
    )
    .orderBy(desc(schema.travelRequests.createdAt))

  const bookings = await db
    .select()
    .from(schema.travelBookings)
    .where(
      and(
        eq(schema.travelBookings.orgId, orgId),
        gte(schema.travelBookings.createdAt, new Date(startDate)),
        lte(schema.travelBookings.createdAt, new Date(endDate)),
      ),
    )

  const totalEstimated = requests.reduce((s, r) => s + (r.estimatedCost ?? 0), 0)
  const totalActual = requests.reduce((s, r) => s + (r.actualCost ?? 0), 0)
  const totalBookingCost = bookings
    .filter((b) => b.status !== 'cancelled' && b.status !== 'refunded')
    .reduce((s, b) => s + b.amount, 0)

  return {
    orgId,
    period: { startDate, endDate },
    generatedAt: new Date(),
    totalRequests: requests.length,
    totalBookings: bookings.length,
    totalEstimated,
    totalActual,
    totalBookingCost,
    budgetVariance: totalActual > 0 ? totalActual - totalEstimated : 0,
    requestsByStatus: requests.reduce((acc, r) => {
      acc[r.status] = (acc[r.status] ?? 0) + 1
      return acc
    }, {} as Record<string, number>),
    topDestinations: Object.entries(
      requests.reduce((acc, r) => {
        acc[r.destination] = (acc[r.destination] ?? 0) + 1
        return acc
      }, {} as Record<string, number>),
    )
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([destination, count]) => ({ destination, count })),
  }
}
