import { NextRequest, NextResponse } from 'next/server'
import {
  createTravelRequest,
  approveTravelRequest,
  searchFlights,
  searchHotels,
  searchCarRentals,
  bookTravel,
  cancelBooking,
  modifyBooking,
  getItinerary,
  submitTravelExpense,
  checkPolicyCompliance,
  getTravelAnalytics,
  getPreferredVendors,
  calculateTravelBudget,
  generateTravelReport,
} from '@/lib/services/travel-management'

// ---------------------------------------------------------------------------
// GET /api/travel — query travel data by action
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    if (!action) {
      return NextResponse.json({ error: 'Missing required query param: action' }, { status: 400 })
    }

    switch (action) {
      case 'analytics': {
        const result = await getTravelAnalytics(orgId)
        return NextResponse.json(result)
      }

      case 'itinerary': {
        const requestId = url.searchParams.get('requestId')
        if (!requestId) {
          return NextResponse.json({ error: 'Missing required param: requestId' }, { status: 400 })
        }
        const result = await getItinerary(requestId, orgId)
        return NextResponse.json(result)
      }

      case 'preferred-vendors': {
        const result = await getPreferredVendors(orgId)
        return NextResponse.json(result)
      }

      case 'budget': {
        const destination = url.searchParams.get('destination')
        const departureDate = url.searchParams.get('departureDate')
        const returnDate = url.searchParams.get('returnDate')
        const policyId = url.searchParams.get('policyId') ?? undefined
        if (!destination || !departureDate || !returnDate) {
          return NextResponse.json(
            { error: 'Missing required params: destination, departureDate, returnDate' },
            { status: 400 },
          )
        }
        const result = await calculateTravelBudget(orgId, destination, departureDate, returnDate, policyId)
        return NextResponse.json(result)
      }

      case 'report': {
        const startDate = url.searchParams.get('startDate')
        const endDate = url.searchParams.get('endDate')
        if (!startDate || !endDate) {
          return NextResponse.json({ error: 'Missing required params: startDate, endDate' }, { status: 400 })
        }
        const result = await generateTravelReport(orgId, startDate, endDate)
        return NextResponse.json(result)
      }

      case 'search-flights': {
        const origin = url.searchParams.get('origin')
        const destination = url.searchParams.get('destination')
        const departureDate = url.searchParams.get('departureDate')
        if (!origin || !destination || !departureDate) {
          return NextResponse.json(
            { error: 'Missing required params: origin, destination, departureDate' },
            { status: 400 },
          )
        }
        const result = await searchFlights(orgId, {
          origin,
          destination,
          departureDate,
          returnDate: url.searchParams.get('returnDate') ?? undefined,
          passengers: parseInt(url.searchParams.get('passengers') ?? '1'),
          cabinClass: (url.searchParams.get('cabinClass') as any) ?? undefined,
          maxPrice: url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!) : undefined,
        })
        return NextResponse.json({ flights: result })
      }

      case 'search-hotels': {
        const city = url.searchParams.get('city')
        const checkIn = url.searchParams.get('checkIn')
        const checkOut = url.searchParams.get('checkOut')
        if (!city || !checkIn || !checkOut) {
          return NextResponse.json(
            { error: 'Missing required params: city, checkIn, checkOut' },
            { status: 400 },
          )
        }
        const result = await searchHotels(orgId, {
          city,
          checkIn,
          checkOut,
          guests: parseInt(url.searchParams.get('guests') ?? '1'),
          maxRate: url.searchParams.get('maxRate') ? parseInt(url.searchParams.get('maxRate')!) : undefined,
          starRating: url.searchParams.get('starRating') ? parseInt(url.searchParams.get('starRating')!) : undefined,
        })
        return NextResponse.json({ hotels: result })
      }

      case 'search-cars': {
        const pickupLocation = url.searchParams.get('pickupLocation')
        const pickupDate = url.searchParams.get('pickupDate')
        const dropoffDate = url.searchParams.get('dropoffDate')
        if (!pickupLocation || !pickupDate || !dropoffDate) {
          return NextResponse.json(
            { error: 'Missing required params: pickupLocation, pickupDate, dropoffDate' },
            { status: 400 },
          )
        }
        const result = await searchCarRentals(orgId, {
          pickupLocation,
          dropoffLocation: url.searchParams.get('dropoffLocation') ?? undefined,
          pickupDate,
          dropoffDate,
          vehicleClass: (url.searchParams.get('vehicleClass') as any) ?? undefined,
          maxPrice: url.searchParams.get('maxPrice') ? parseInt(url.searchParams.get('maxPrice')!) : undefined,
        })
        return NextResponse.json({ carRentals: result })
      }

      case 'check-policy': {
        const policyId = url.searchParams.get('policyId')
        const type = url.searchParams.get('type')
        if (!policyId || !type) {
          return NextResponse.json({ error: 'Missing required params: policyId, type' }, { status: 400 })
        }
        const booking = {
          type,
          cabinClass: url.searchParams.get('cabinClass') ?? undefined,
          hotelRate: url.searchParams.get('hotelRate') ? parseInt(url.searchParams.get('hotelRate')!) : undefined,
          carClass: url.searchParams.get('carClass') ?? undefined,
          departureDate: url.searchParams.get('departureDate') ?? undefined,
          amount: url.searchParams.get('amount') ? parseInt(url.searchParams.get('amount')!) : undefined,
        }
        const result = await checkPolicyCompliance(orgId, policyId, booking)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = (error as any)?.code ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}

// ---------------------------------------------------------------------------
// POST /api/travel — mutate travel data by action
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const orgId = request.headers.get('x-org-id')
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized: no org context' }, { status: 401 })
    }

    const body = await request.json()
    const { action, ...data } = body

    if (!action) {
      return NextResponse.json({ error: 'Missing required field: action' }, { status: 400 })
    }

    switch (action) {
      case 'create-request': {
        if (!data.employeeId || !data.purpose || !data.destination || !data.departureDate || !data.returnDate) {
          return NextResponse.json(
            { error: 'Missing required fields: employeeId, purpose, destination, departureDate, returnDate' },
            { status: 400 },
          )
        }
        const result = await createTravelRequest({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'approve-request': {
        if (!data.requestId || !data.approverId) {
          return NextResponse.json({ error: 'Missing required fields: requestId, approverId' }, { status: 400 })
        }
        const result = await approveTravelRequest(data.requestId, orgId, data.approverId)
        return NextResponse.json(result)
      }

      case 'book': {
        if (!data.travelRequestId || !data.type || !data.provider || !data.confirmationNumber || !data.amount || !data.startDate) {
          return NextResponse.json(
            { error: 'Missing required fields: travelRequestId, type, provider, confirmationNumber, amount, startDate' },
            { status: 400 },
          )
        }
        const result = await bookTravel({ orgId, ...data })
        return NextResponse.json(result, { status: 201 })
      }

      case 'cancel-booking': {
        if (!data.bookingId) {
          return NextResponse.json({ error: 'Missing required field: bookingId' }, { status: 400 })
        }
        const result = await cancelBooking(data.bookingId, orgId)
        return NextResponse.json(result)
      }

      case 'modify-booking': {
        if (!data.bookingId) {
          return NextResponse.json({ error: 'Missing required field: bookingId' }, { status: 400 })
        }
        const { bookingId, ...updates } = data
        const result = await modifyBooking(bookingId, orgId, updates)
        return NextResponse.json(result)
      }

      case 'submit-expenses': {
        if (!data.requestId || !data.expenses || !Array.isArray(data.expenses)) {
          return NextResponse.json(
            { error: 'Missing required fields: requestId, expenses (array)' },
            { status: 400 },
          )
        }
        const result = await submitTravelExpense(data.requestId, orgId, data.expenses)
        return NextResponse.json(result)
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    const status = (error as any)?.code ? 400 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
