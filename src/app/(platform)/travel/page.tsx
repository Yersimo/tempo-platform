'use client'

import { useState, useMemo, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { PageSkeleton } from '@/components/ui/page-skeleton'
import { Plane, Hotel, MapPin, Calendar, DollarSign, Plus, CheckCircle, Clock, AlertTriangle, FileText, Car, Shield, ArrowRight, Receipt, Pencil, Loader2, Search, Globe, Star, Wifi, Coffee, Users, ChevronDown, ChevronUp, MessageSquare, XCircle, Phone, Building2, Briefcase, PieChart, Tag } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useTempo, useOrgCurrency } from '@/lib/store'
import { formatCurrency } from '@/lib/utils/format-currency'

export default function TravelManagementPage() {
  const tc = useTranslations('common')
  const { travelRequests, travelBookings, travelPolicies, employees, addTravelRequest, updateTravelRequest, addTravelBooking, updateTravelBooking, addTravelPolicy, updateTravelPolicy, ensureModulesLoaded, addToast } = useTempo()
  const defaultCurrency = useOrgCurrency()

  const [pageLoading, setPageLoading] = useState(true)

  useEffect(() => {
    ensureModulesLoaded?.(['travelRequests', 'travelBookings', 'travelPolicies'])?.then?.(() => setPageLoading(false))?.catch?.(() => setPageLoading(false))
  }, [ensureModulesLoaded])
  useEffect(() => { const t = setTimeout(() => setPageLoading(false), 2000); return () => clearTimeout(t) }, [])

  const [activeTab, setActiveTab] = useState<'requests' | 'bookings' | 'policies' | 'expenses' | 'flights' | 'hotels' | 'duty-of-care' | 'cost-allocation'>('requests')
  const [showRequestModal, setShowRequestModal] = useState(false)

  // ---- Flight Search State ----
  const [flightSearch, setFlightSearch] = useState({ origin: '', destination: '', departDate: '', returnDate: '', passengers: '1', cabinClass: 'economy' })
  const [flightResults, setFlightResults] = useState<Array<{
    id: string; airline: string; flightNo: string; departure: string; arrival: string
    departTime: string; arriveTime: string; duration: string; stops: number
    price: number; cabinClass: string; seatsLeft: number
  }>>([])
  const [flightSearchDone, setFlightSearchDone] = useState(false)
  const [flightSearching, setFlightSearching] = useState(false)

  function searchFlights() {
    if (!flightSearch.origin || !flightSearch.destination || !flightSearch.departDate) {
      addToast('Origin, destination, and departure date are required', 'error')
      return
    }
    setFlightSearching(true)
    setFlightResults([])
    // Simulate flight search
    setTimeout(() => {
      const airlines = ['Air France', 'Ethiopian Airlines', 'Kenya Airways', 'Delta', 'United', 'Turkish Airlines', 'Emirates', 'British Airways']
      const results = Array.from({ length: 6 }, (_, i) => {
        const airline = airlines[Math.floor(Math.random() * airlines.length)]
        const code = airline.slice(0, 2).toUpperCase()
        const depHour = 6 + Math.floor(Math.random() * 14)
        const durHours = 2 + Math.floor(Math.random() * 10)
        const arrHour = (depHour + durHours) % 24
        const stops = Math.random() > 0.6 ? 1 : Math.random() > 0.8 ? 2 : 0
        const basePrice = flightSearch.cabinClass === 'business' ? 250000 : flightSearch.cabinClass === 'first' ? 500000 : 85000
        const price = basePrice + Math.floor(Math.random() * basePrice * 0.6)
        return {
          id: `flt-${i}`,
          airline,
          flightNo: `${code}${100 + Math.floor(Math.random() * 900)}`,
          departure: flightSearch.origin,
          arrival: flightSearch.destination,
          departTime: `${String(depHour).padStart(2, '0')}:${Math.random() > 0.5 ? '00' : '30'}`,
          arriveTime: `${String(arrHour).padStart(2, '0')}:${Math.random() > 0.5 ? '15' : '45'}`,
          duration: `${durHours}h ${Math.floor(Math.random() * 60)}m`,
          stops,
          price,
          cabinClass: flightSearch.cabinClass,
          seatsLeft: 1 + Math.floor(Math.random() * 8),
        }
      }).sort((a, b) => a.price - b.price)
      setFlightResults(results)
      setFlightSearchDone(true)
      setFlightSearching(false)
    }, 1200)
  }

  function checkFlightPolicy(price: number): { compliant: boolean; warnings: string[] } {
    const warnings: string[] = []
    const policy = travelPolicies[0] as any
    if (policy?.rules?.max_flight_cost && price > policy.rules.max_flight_cost) {
      warnings.push(`Exceeds max flight budget of ${formatCurrency(policy.rules.max_flight_cost, defaultCurrency, { cents: true })}`)
    }
    if (policy?.rules?.advance_booking_days && flightSearch.departDate) {
      const daysAhead = Math.ceil((new Date(flightSearch.departDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      if (daysAhead < policy.rules.advance_booking_days) {
        warnings.push(`Booked ${daysAhead} days ahead (policy requires ${policy.rules.advance_booking_days})`)
      }
    }
    if (flightSearch.cabinClass === 'business' || flightSearch.cabinClass === 'first') {
      warnings.push('Premium cabin may require VP approval')
    }
    return { compliant: warnings.length === 0, warnings }
  }

  function bookFlight(flight: typeof flightResults[0]) {
    addTravelBooking({
      type: 'flight',
      provider: flight.airline,
      confirmation_number: flight.flightNo + '-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      cost: flight.price,
      status: 'confirmed',
      travel_request_id: null,
      details: {
        departure: flight.departure,
        arrival: flight.arrival,
        depart_time: flight.departTime,
        arrive_time: flight.arriveTime,
        duration: flight.duration,
        stops: flight.stops,
        class: flight.cabinClass,
        check_in: flightSearch.departDate,
        check_out: flightSearch.returnDate || flightSearch.departDate,
      },
    })
    addToast(`Flight ${flight.flightNo} booked successfully`)
  }

  // ---- Hotel Search State ----
  const [hotelSearch, setHotelSearch] = useState({ city: '', checkIn: '', checkOut: '', rooms: '1', guests: '1' })
  const [hotelResults, setHotelResults] = useState<Array<{
    id: string; name: string; stars: number; pricePerNight: number; totalPrice: number
    amenities: string[]; rating: number; reviewCount: number; address: string; image: string
  }>>([])
  const [hotelSearchDone, setHotelSearchDone] = useState(false)
  const [hotelSearching, setHotelSearching] = useState(false)

  function searchHotels() {
    if (!hotelSearch.city || !hotelSearch.checkIn || !hotelSearch.checkOut) {
      addToast('City, check-in, and check-out dates are required', 'error')
      return
    }
    setHotelSearching(true)
    setHotelResults([])
    setTimeout(() => {
      const nights = Math.max(1, Math.ceil((new Date(hotelSearch.checkOut).getTime() - new Date(hotelSearch.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
      const hotels = [
        { prefix: 'Marriott', stars: 4 }, { prefix: 'Hilton Garden Inn', stars: 3 },
        { prefix: 'Novotel', stars: 4 }, { prefix: 'Radisson Blu', stars: 4 },
        { prefix: 'Holiday Inn', stars: 3 }, { prefix: 'Hyatt Regency', stars: 5 },
        { prefix: 'Best Western Plus', stars: 3 }, { prefix: 'Four Points Sheraton', stars: 4 },
      ]
      const amenityPool = ['Free WiFi', 'Pool', 'Gym', 'Restaurant', 'Business Center', 'Airport Shuttle', 'Spa', 'Parking', 'Breakfast Included', 'Room Service']
      const results = hotels.map((h, i) => {
        const baseRate = h.stars * 8000 + Math.floor(Math.random() * 15000)
        const numAmenities = 3 + Math.floor(Math.random() * 4)
        const shuffled = [...amenityPool].sort(() => Math.random() - 0.5)
        return {
          id: `htl-${i}`,
          name: `${h.prefix} ${hotelSearch.city}`,
          stars: h.stars,
          pricePerNight: baseRate,
          totalPrice: baseRate * nights,
          amenities: shuffled.slice(0, numAmenities),
          rating: Number((3.5 + Math.random() * 1.5).toFixed(1)),
          reviewCount: 50 + Math.floor(Math.random() * 950),
          address: `${Math.floor(Math.random() * 200) + 1} ${hotelSearch.city} Main Street`,
          image: '',
        }
      }).sort((a, b) => a.pricePerNight - b.pricePerNight)
      setHotelResults(results)
      setHotelSearchDone(true)
      setHotelSearching(false)
    }, 1000)
  }

  function checkHotelPolicy(pricePerNight: number): { compliant: boolean; warnings: string[] } {
    const warnings: string[] = []
    const policy = travelPolicies[0] as any
    if (policy?.rules?.max_hotel_rate && pricePerNight > policy.rules.max_hotel_rate) {
      warnings.push(`Nightly rate exceeds policy limit of ${formatCurrency(policy.rules.max_hotel_rate, defaultCurrency, { cents: true })}`)
    }
    return { compliant: warnings.length === 0, warnings }
  }

  function bookHotel(hotel: typeof hotelResults[0]) {
    addTravelBooking({
      type: 'hotel',
      provider: hotel.name,
      confirmation_number: 'HTL-' + Math.random().toString(36).slice(2, 8).toUpperCase(),
      cost: hotel.totalPrice,
      status: 'confirmed',
      travel_request_id: null,
      details: {
        check_in: hotelSearch.checkIn,
        check_out: hotelSearch.checkOut,
        room_type: 'standard',
        nightly_rate: hotel.pricePerNight,
      },
    })
    addToast(`${hotel.name} booked successfully`)
  }

  // ---- Pre-Trip Approval State ----
  const [approvalComment, setApprovalComment] = useState('')

  // ---- Duty of Care Data ----
  const destinationRiskLevels: Record<string, { level: 'low' | 'medium' | 'high' | 'critical'; advisory: string; emergency: string }> = useMemo(() => ({
    'Lagos': { level: 'medium', advisory: 'Exercise increased caution. Petty crime common in urban areas.', emergency: '+234-800-HELP' },
    'Abuja': { level: 'low', advisory: 'Normal precautions advised. Generally safe for business travelers.', emergency: '+234-800-HELP' },
    'Accra': { level: 'low', advisory: 'Normal precautions. Stable political environment.', emergency: '+233-800-HELP' },
    'Nairobi': { level: 'medium', advisory: 'Exercise caution in certain neighborhoods. Avoid traveling alone at night.', emergency: '+254-800-HELP' },
    'Dakar': { level: 'low', advisory: 'Normal precautions. Generally safe for business travelers.', emergency: '+221-800-HELP' },
    'Abidjan': { level: 'medium', advisory: 'Exercise increased caution. Political situation generally stable.', emergency: '+225-800-HELP' },
    'Johannesburg': { level: 'medium', advisory: 'Exercise caution. High crime rate in certain areas.', emergency: '+27-800-HELP' },
    'New York': { level: 'low', advisory: 'Normal precautions. Standard urban safety awareness.', emergency: '911' },
    'London': { level: 'low', advisory: 'Normal precautions. Generally safe.', emergency: '999' },
    'Paris': { level: 'low', advisory: 'Normal precautions. Be aware of pickpockets in tourist areas.', emergency: '112' },
  }), [])

  const travelerLocations = useMemo(() => {
    const locations: Array<{ employee: string; destination: string; startDate: string; endDate: string; status: string }> = []
    travelRequests.filter((r: any) => r.status === 'approved').forEach((req: any) => {
      const emp = employees.find((e: any) => e.id === req.employee_id)
      locations.push({
        employee: emp?.profile?.full_name || 'Unknown',
        destination: req.destination,
        startDate: req.travel_dates?.start || '',
        endDate: req.travel_dates?.end || '',
        status: 'active',
      })
    })
    return locations
  }, [travelRequests, employees])

  // ---- Cost Allocation State ----
  const [costAllocations, setCostAllocations] = useState<Record<string, { costCenter: string; project: string; client: string; splitDepts: Array<{ dept: string; pct: number }> }>>({})
  const [editingAllocationId, setEditingAllocationId] = useState<string | null>(null)
  const [allocationForm, setAllocationForm] = useState({ costCenter: '', project: '', client: '', splitDepts: [{ dept: '', pct: 100 }] as Array<{ dept: string; pct: number }> })

  function saveAllocation(bookingId: string) {
    setCostAllocations(prev => ({ ...prev, [bookingId]: { ...allocationForm } }))
    setEditingAllocationId(null)
    addToast('Cost allocation saved')
  }
  const [requestForm, setRequestForm] = useState({
    destination: '',
    purpose: '',
    start_date: '',
    end_date: '',
    estimated_cost: '',
    notes: '',
  })

  // Booking modal state
  const [showBookingModal, setShowBookingModal] = useState(false)
  const [editingBookingId, setEditingBookingId] = useState<string | null>(null)
  const [bookingForm, setBookingForm] = useState({
    type: 'flight',
    provider: '',
    confirmation_number: '',
    check_in_date: '',
    check_out_date: '',
    amount: '',
    status: 'confirmed',
    travel_request_id: '',
  })

  // Policy modal state
  const [showPolicyModal, setShowPolicyModal] = useState(false)
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null)
  const [policyForm, setPolicyForm] = useState({
    name: '',
    description: '',
    max_daily_hotel: '',
    max_flight_cost: '',
    advance_booking_days: '',
    requires_approval: 'true',
    status: 'active',
  })

  const [saving, setSaving] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [confirmAction, setConfirmAction] = useState<{show:boolean, type:string, id:string, label:string}|null>(null)

  // Stats
  const activeTrips = travelRequests.filter((r: any) => r.status === 'approved').length
  const pendingApproval = travelRequests.filter((r: any) => r.status === 'pending').length
  const totalSpend = travelBookings.reduce((sum: number, b: any) => sum + (b.cost || 0), 0)

  const policyViolations = useMemo(() => {
    if (!travelPolicies.length) return 0
    const policy = travelPolicies[0] as any
    let count = 0
    travelBookings.forEach((b: any) => {
      if (b.type === 'hotel' && policy.rules?.max_hotel_rate && b.cost > policy.rules.max_hotel_rate) count++
      if (b.type === 'flight' && policy.rules?.max_flight_class === 'economy' && b.details?.class === 'business') count++
    })
    return count
  }, [travelBookings, travelPolicies])

  const filteredRequests = useMemo(() => {
    if (!searchQuery) return travelRequests
    const q = searchQuery.toLowerCase()
    return travelRequests.filter((req: any) =>
      req.destination?.toLowerCase().includes(q) ||
      req.purpose?.toLowerCase().includes(q) ||
      req.status?.toLowerCase().includes(q)
    )
  }, [travelRequests, searchQuery])

  const filteredBookings = useMemo(() => {
    if (!searchQuery) return travelBookings
    const q = searchQuery.toLowerCase()
    return travelBookings.filter((b: any) =>
      b.provider?.toLowerCase().includes(q) ||
      b.confirmation_number?.toLowerCase().includes(q) ||
      b.type?.toLowerCase().includes(q)
    )
  }, [travelBookings, searchQuery])

  const filteredPolicies = useMemo(() => {
    if (!searchQuery) return travelPolicies
    const q = searchQuery.toLowerCase()
    return travelPolicies.filter((p: any) =>
      p.name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    )
  }, [travelPolicies, searchQuery])

  function getEmployeeName(empId: string) {
    const emp = employees.find((e: any) => e.id === empId)
    return emp?.profile?.full_name || tc('unknown')
  }

  function openNewRequest() {
    setRequestForm({
      destination: '',
      purpose: '',
      start_date: '',
      end_date: '',
      estimated_cost: '',
      notes: '',
    })
    setShowRequestModal(true)
  }

  async function submitRequest() {
    if (!requestForm.destination) { addToast('Destination is required', 'error'); return }
    if (!requestForm.purpose) { addToast('Purpose is required', 'error'); return }
    if (!requestForm.start_date) { addToast('Start date is required', 'error'); return }
    if (!requestForm.end_date) { addToast('End date is required', 'error'); return }
    if (!requestForm.estimated_cost) { addToast('Estimated cost is required', 'error'); return }
    setSaving(true)
    try {
      addTravelRequest({
        employee_id: employees[0]?.id || 'emp-1',
        destination: requestForm.destination,
        purpose: requestForm.purpose,
        travel_dates: { start: requestForm.start_date, end: requestForm.end_date },
        estimated_cost: Number(requestForm.estimated_cost),
        status: 'pending',
        approved_by: null,
        submitted_at: new Date().toISOString(),
      })
      setShowRequestModal(false)
    } finally {
      setSaving(false)
    }
  }

  function approveRequest(id: string) {
    updateTravelRequest(id, { status: 'approved', approved_by: employees[0]?.id || 'emp-1' })
  }

  function rejectRequest(id: string) {
    updateTravelRequest(id, { status: 'rejected' })
  }

  // ---- Booking CRUD ----
  function openNewBooking() {
    setEditingBookingId(null)
    setBookingForm({
      type: 'flight',
      provider: '',
      confirmation_number: '',
      check_in_date: '',
      check_out_date: '',
      amount: '',
      status: 'confirmed',
      travel_request_id: '',
    })
    setShowBookingModal(true)
  }

  function openEditBooking(id: string) {
    const booking = travelBookings.find((b: any) => b.id === id)
    if (!booking) return
    setEditingBookingId(id)
    setBookingForm({
      type: (booking as any).type || 'flight',
      provider: (booking as any).provider || '',
      confirmation_number: (booking as any).confirmation_number || '',
      check_in_date: (booking as any).details?.check_in || (booking as any).check_in_date || '',
      check_out_date: (booking as any).details?.check_out || (booking as any).check_out_date || '',
      amount: String((booking as any).cost || ''),
      status: (booking as any).status || 'confirmed',
      travel_request_id: (booking as any).travel_request_id || '',
    })
    setShowBookingModal(true)
  }

  function submitBooking() {
    if (!bookingForm.provider || !bookingForm.confirmation_number || !bookingForm.amount) return
    const payload: any = {
      type: bookingForm.type,
      provider: bookingForm.provider,
      confirmation_number: bookingForm.confirmation_number,
      cost: Number(bookingForm.amount),
      status: bookingForm.status,
      travel_request_id: bookingForm.travel_request_id || null,
      details: {
        check_in: bookingForm.check_in_date,
        check_out: bookingForm.check_out_date,
      },
    }
    if (editingBookingId) {
      updateTravelBooking(editingBookingId, payload)
    } else {
      addTravelBooking(payload)
    }
    setShowBookingModal(false)
  }

  // ---- Policy CRUD ----
  function openNewPolicy() {
    setEditingPolicyId(null)
    setPolicyForm({
      name: '',
      description: '',
      max_daily_hotel: '',
      max_flight_cost: '',
      advance_booking_days: '',
      requires_approval: 'true',
      status: 'active',
    })
    setShowPolicyModal(true)
  }

  function openEditPolicy(id: string) {
    const policy = travelPolicies.find((p: any) => p.id === id)
    if (!policy) return
    setEditingPolicyId(id)
    setPolicyForm({
      name: (policy as any).name || '',
      description: (policy as any).description || '',
      max_daily_hotel: String((policy as any).rules?.max_hotel_rate || ''),
      max_flight_cost: String((policy as any).rules?.max_flight_cost || ''),
      advance_booking_days: String((policy as any).rules?.advance_booking_days || ''),
      requires_approval: (policy as any).rules?.requires_approval_above ? 'true' : 'false',
      status: (policy as any).is_active ? 'active' : 'inactive',
    })
    setShowPolicyModal(true)
  }

  function submitPolicy() {
    if (!policyForm.name) return
    const payload: any = {
      name: policyForm.name,
      description: policyForm.description,
      is_active: policyForm.status === 'active',
      rules: {
        max_hotel_rate: policyForm.max_daily_hotel ? Number(policyForm.max_daily_hotel) : null,
        max_flight_cost: policyForm.max_flight_cost ? Number(policyForm.max_flight_cost) : null,
        advance_booking_days: policyForm.advance_booking_days ? Number(policyForm.advance_booking_days) : null,
        requires_approval_above: policyForm.requires_approval === 'true' ? 0 : null,
      },
    }
    if (editingPolicyId) {
      updateTravelPolicy(editingPolicyId, payload)
    } else {
      addTravelPolicy(payload)
    }
    setShowPolicyModal(false)
  }

  function getBookingTypeIcon(type: string) {
    switch (type) {
      case 'flight': return <Plane size={14} className="text-info" />
      case 'hotel': return <Hotel size={14} className="text-warning" />
      case 'car': return <Car size={14} className="text-success" />
      default: return <MapPin size={14} className="text-t3" />
    }
  }

  function formatBookingDetails(booking: any) {
    if (booking.type === 'flight') {
      return `${booking.details?.departure || '—'} → ${booking.details?.arrival || '—'} (${booking.details?.class || 'economy'})`
    }
    if (booking.type === 'hotel') {
      return `${booking.details?.check_in || '—'} to ${booking.details?.check_out || '—'} (${booking.details?.room_type || 'standard'})`
    }
    return '—'
  }

  const tabs = [
    { key: 'requests' as const, label: 'Requests', icon: <FileText size={14} /> },
    { key: 'flights' as const, label: 'Flight Search', icon: <Plane size={14} /> },
    { key: 'hotels' as const, label: 'Hotel Search', icon: <Hotel size={14} /> },
    { key: 'bookings' as const, label: 'Bookings', icon: <Plane size={14} /> },
    { key: 'duty-of-care' as const, label: 'Duty of Care', icon: <Shield size={14} /> },
    { key: 'cost-allocation' as const, label: 'Cost Allocation', icon: <PieChart size={14} /> },
    { key: 'policies' as const, label: 'Policies', icon: <Shield size={14} /> },
    { key: 'expenses' as const, label: 'Expense Integration', icon: <Receipt size={14} /> },
  ]

  if (pageLoading) {
    return (
      <>
        <Header title="Travel Management" subtitle="Book travel, manage policies & track expenses" actions={<Button size="sm" disabled><Plus size={14} /> New Request</Button>} />
        <div className="p-6"><PageSkeleton /></div>
      </>
    )
  }

  return (
    <>
      <Header
        title="Travel Management"
        subtitle="Book travel, manage policies & track expenses"
        actions={<Button size="sm" onClick={openNewRequest}><Plus size={14} /> New Request</Button>}
      />

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Active Trips" value={activeTrips} icon={<Plane size={20} />} />
        <StatCard label="Pending Approval" value={pendingApproval} icon={<Clock size={20} />} change={pendingApproval > 0 ? 'Needs review' : undefined} changeType={pendingApproval > 0 ? 'negative' : undefined} />
        <StatCard label="Total Spend" value={formatCurrency(totalSpend, defaultCurrency, { cents: true })} icon={<DollarSign size={20} />} />
        <StatCard label="Policy Violations" value={policyViolations} icon={<AlertTriangle size={20} />} change={policyViolations > 0 ? 'Requires attention' : 'All compliant'} changeType={policyViolations > 0 ? 'negative' : 'positive'} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-divider">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-brand text-brand'
                : 'border-transparent text-t3 hover:text-t1'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
        <input
          type="text"
          placeholder="Search requests, bookings, policies..."
          className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Requests Tab */}
      {activeTab === 'requests' && (
        <Card padding="none">
          <CardHeader>
            <CardTitle>Travel Requests</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{tc('employee')}</th>
                  <th className="tempo-th text-left px-4 py-3">Destination</th>
                  <th className="tempo-th text-left px-4 py-3">Purpose</th>
                  <th className="tempo-th text-left px-4 py-3">Dates</th>
                  <th className="tempo-th text-right px-4 py-3">Est. Cost</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-left px-4 py-3">Approved By</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-16 text-center">
                      <Plane size={32} className="mx-auto text-t3 mb-3" />
                      <p className="text-sm font-medium text-t2">{searchQuery ? 'No matching requests' : 'No travel requests yet'}</p>
                      <p className="text-xs text-t3 mt-1">{searchQuery ? 'Try a different search term' : 'Submit a travel request to get started'}</p>
                      {!searchQuery && <Button size="sm" className="mt-4" onClick={openNewRequest}><Plus size={14} /> New Request</Button>}
                    </td>
                  </tr>
                ) : filteredRequests.map((req: any) => (
                  <tr key={req.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs font-medium text-t1">{getEmployeeName(req.employee_id)}</td>
                    <td className="px-4 py-3 text-xs text-t2">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={12} className="text-t3" />
                        {req.destination}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2 max-w-[200px] truncate">{req.purpose}</td>
                    <td className="px-4 py-3 text-xs text-t2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-t3" />
                        {req.travel_dates?.start} — {req.travel_dates?.end}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                      ${(req.estimated_cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        req.status === 'approved' ? 'success' :
                        req.status === 'rejected' ? 'error' :
                        'warning'
                      }>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">
                      {req.approved_by ? getEmployeeName(req.approved_by) : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex gap-1 justify-center">
                        {req.status === 'pending' && (
                          <>
                            <Button size="sm" variant="primary" onClick={() => approveRequest(req.id)}>
                              <CheckCircle size={12} /> {tc('approve')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectRequest(req.id)}>
                              {tc('reject')}
                            </Button>
                          </>
                        )}
                        {req.status === 'approved' && (
                          <Badge variant="success">Pre-approved</Badge>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Bookings Tab */}
      {activeTab === 'bookings' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between w-full">
              <CardTitle>Travel Bookings</CardTitle>
              <Button size="sm" onClick={openNewBooking}><Plus size={14} /> New Booking</Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Confirmation #</th>
                  <th className="tempo-th text-left px-4 py-3">{tc('type')}</th>
                  <th className="tempo-th text-left px-4 py-3">Provider</th>
                  <th className="tempo-th text-left px-4 py-3">Details</th>
                  <th className="tempo-th text-right px-4 py-3">Cost</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredBookings.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center">
                      <Hotel size={32} className="mx-auto text-t3 mb-3" />
                      <p className="text-sm font-medium text-t2">{searchQuery ? 'No matching bookings' : 'No bookings yet'}</p>
                      <p className="text-xs text-t3 mt-1">{searchQuery ? 'Try a different search term' : 'Create a booking for flights, hotels, or car rentals'}</p>
                      {!searchQuery && <Button size="sm" className="mt-4" onClick={openNewBooking}><Plus size={14} /> New Booking</Button>}
                    </td>
                  </tr>
                ) : filteredBookings.map((booking: any) => (
                  <tr key={booking.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3 text-xs font-mono font-medium text-t1">{booking.confirmation_number}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-t2">
                        {getBookingTypeIcon(booking.type)}
                        <span className="capitalize">{booking.type}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-t2">{booking.provider}</td>
                    <td className="px-4 py-3 text-xs text-t2">{formatBookingDetails(booking)}</td>
                    <td className="px-4 py-3 text-xs font-semibold text-t1 text-right">
                      ${(booking.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={
                        booking.status === 'confirmed' ? 'success' :
                        booking.status === 'cancelled' ? 'error' :
                        'info'
                      }>
                        {booking.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => openEditBooking(booking.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors">
                        <Pencil size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Policies Tab */}
      {activeTab === 'policies' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={openNewPolicy}><Plus size={14} /> Add Policy</Button>
          </div>
          {filteredPolicies.map((policy: any) => (
            <Card key={policy.id}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-t1 flex items-center gap-2">
                    <Shield size={16} className="text-brand" />
                    {policy.name}
                  </h3>
                  <p className="text-xs text-t3 mt-1">{policy.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditPolicy(policy.id)} className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors">
                    <Pencil size={14} />
                  </button>
                  <Badge variant={policy.is_active ? 'success' : 'default'}>
                    {policy.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs text-t3 mb-1">Max Flight Class</p>
                  <p className="text-sm font-semibold text-t1 capitalize">{policy.rules?.max_flight_class || '—'}</p>
                </div>
                <div className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs text-t3 mb-1">Max Hotel Rate</p>
                  <p className="text-sm font-semibold text-t1">
                    ${((policy.rules?.max_hotel_rate || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs text-t3 font-normal"> /night</span>
                  </p>
                </div>
                <div className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs text-t3 mb-1">Meal Per Diem</p>
                  <p className="text-sm font-semibold text-t1">
                    ${((policy.rules?.meal_per_diem || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs text-t3 font-normal"> /day</span>
                  </p>
                </div>
                <div className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs text-t3 mb-1">Advance Booking</p>
                  <p className="text-sm font-semibold text-t1">
                    {policy.rules?.advance_booking_days || 0}
                    <span className="text-xs text-t3 font-normal"> days</span>
                  </p>
                </div>
                <div className="p-3 bg-canvas rounded-lg">
                  <p className="text-xs text-t3 mb-1">Approval Threshold</p>
                  <p className="text-sm font-semibold text-t1">
                    ${((policy.rules?.requires_approval_above || 0) / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              {policy.applicable_departments && (
                <div className="mt-4">
                  <p className="text-xs text-t3 mb-2">Applicable Departments</p>
                  <div className="flex gap-2 flex-wrap">
                    {policy.applicable_departments.map((dept: string) => (
                      <Badge key={dept} variant="default">{dept}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {!policy.applicable_departments && (
                <p className="text-xs text-t3 mt-4">Applies to all departments</p>
              )}
            </Card>
          ))}
          {filteredPolicies.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16">
              <Shield size={32} className="text-t3 mb-3" />
              <p className="text-sm font-medium text-t2">{searchQuery ? 'No matching policies' : 'No travel policies defined'}</p>
              <p className="text-xs text-t3 mt-1">{searchQuery ? 'Try a different search term' : 'Create policies to set travel spending limits and rules'}</p>
              {!searchQuery && <Button size="sm" className="mt-4" onClick={openNewPolicy}><Plus size={14} /> Add Policy</Button>}
            </div>
          )}
        </div>
      )}

      {/* Expense Integration Tab */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
              <Receipt size={16} className="text-brand" />
              Travel-to-Expense Pipeline
            </h3>
            <p className="text-xs text-t3 mb-4">
              Travel bookings automatically generate expense line items for reconciliation and reimbursement.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-canvas rounded-lg border border-divider">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center">
                    <Plane size={16} className="text-info" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-t1">1. Travel Booking</p>
                    <p className="text-xs text-t3">Flight, hotel, or car</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight size={16} className="text-t3" />
                </div>
              </div>

              <div className="p-4 bg-canvas rounded-lg border border-divider">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                    <FileText size={16} className="text-warning" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-t1">2. Expense Report</p>
                    <p className="text-xs text-t3">Auto-generated line items</p>
                  </div>
                </div>
                <div className="flex justify-center">
                  <ArrowRight size={16} className="text-t3" />
                </div>
              </div>

              <div className="p-4 bg-canvas rounded-lg border border-divider">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle size={16} className="text-success" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-t1">3. Reconciliation</p>
                    <p className="text-xs text-t3">Matched & reimbursed</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Linked Expenses</h3>
              <div className="space-y-3">
                {travelBookings.slice(0, 4).map((booking: any) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 bg-canvas rounded-lg">
                    <div className="flex items-center gap-3">
                      {getBookingTypeIcon(booking.type)}
                      <div>
                        <p className="text-xs font-medium text-t1">{booking.provider}</p>
                        <p className="text-xs text-t3">{booking.confirmation_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold text-t1">
                        ${(booking.cost / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                      <Badge variant="success">Matched</Badge>
                    </div>
                  </div>
                ))}
                {travelBookings.length === 0 && (
                  <p className="text-xs text-t3 text-center py-4">{tc('noResults')}</p>
                )}
              </div>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">Spend Breakdown</h3>
              <div className="space-y-3">
                {['flight', 'hotel', 'car'].map(type => {
                  const typeTotal = travelBookings
                    .filter((b: any) => b.type === type)
                    .reduce((sum: number, b: any) => sum + (b.cost || 0), 0)
                  const pct = totalSpend > 0 ? Math.round((typeTotal / totalSpend) * 100) : 0
                  return (
                    <div key={type}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-t2 capitalize flex items-center gap-1.5">
                          {getBookingTypeIcon(type)} {type}s
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-t1">
                            ${(typeTotal / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-t3">({pct}%)</span>
                        </div>
                      </div>
                      <Progress value={pct} color="orange" />
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* FLIGHT SEARCH TAB */}
      {/* ============================================================ */}
      {activeTab === 'flights' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Plane size={16} className="text-brand" />
              Search Flights
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Input label="Origin" placeholder="e.g. Lagos (LOS)" value={flightSearch.origin}
                onChange={e => setFlightSearch({ ...flightSearch, origin: e.target.value })} />
              <Input label="Destination" placeholder="e.g. Nairobi (NBO)" value={flightSearch.destination}
                onChange={e => setFlightSearch({ ...flightSearch, destination: e.target.value })} />
              <Input label="Departure Date" type="date" value={flightSearch.departDate}
                onChange={e => setFlightSearch({ ...flightSearch, departDate: e.target.value })} />
              <Input label="Return Date" type="date" value={flightSearch.returnDate}
                onChange={e => setFlightSearch({ ...flightSearch, returnDate: e.target.value })} />
              <Select label="Passengers" value={flightSearch.passengers}
                onChange={e => setFlightSearch({ ...flightSearch, passengers: e.target.value })}
                options={[{ value: '1', label: '1' }, { value: '2', label: '2' }, { value: '3', label: '3' }, { value: '4', label: '4' }]} />
              <Select label="Cabin Class" value={flightSearch.cabinClass}
                onChange={e => setFlightSearch({ ...flightSearch, cabinClass: e.target.value })}
                options={[{ value: 'economy', label: 'Economy' }, { value: 'premium_economy', label: 'Premium Economy' }, { value: 'business', label: 'Business' }, { value: 'first', label: 'First' }]} />
            </div>
            <Button onClick={searchFlights} disabled={flightSearching}>
              {flightSearching ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : <><Search size={14} /> Search Flights</>}
            </Button>
          </Card>

          {/* Flight Results */}
          {flightSearchDone && (
            <Card padding="none">
              <CardHeader>
                <div className="flex items-center justify-between w-full">
                  <CardTitle>{flightResults.length} Flights Found</CardTitle>
                  <span className="text-xs text-t3">{flightSearch.origin} to {flightSearch.destination} &middot; {flightSearch.departDate}</span>
                </div>
              </CardHeader>
              <div className="divide-y divide-divider">
                {flightResults.map(flight => {
                  const policy = checkFlightPolicy(flight.price)
                  return (
                    <div key={flight.id} className="px-6 py-4 hover:bg-canvas/50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
                          <Plane size={18} className="text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-t1">{flight.airline}</span>
                            <span className="text-xs text-t3 font-mono">{flight.flightNo}</span>
                            <Badge variant="default">{flight.cabinClass}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-t2">
                            <span className="font-medium">{flight.departTime}</span>
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-brand" />
                              <div className="w-16 h-px bg-border relative">
                                {flight.stops > 0 && (
                                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-amber-500" />
                                )}
                              </div>
                              <div className="w-2 h-2 rounded-full bg-success" />
                            </div>
                            <span className="font-medium">{flight.arriveTime}</span>
                            <span className="text-t3">{flight.duration}</span>
                            <span className="text-t3">{flight.stops === 0 ? 'Nonstop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-t1">{formatCurrency(flight.price, defaultCurrency, { cents: true })}</p>
                          <p className="text-xs text-t3">{flight.seatsLeft} seats left</p>
                        </div>
                        <div className="shrink-0 flex flex-col gap-1">
                          {!policy.compliant && (
                            <div className="flex items-center gap-1">
                              <AlertTriangle size={12} className="text-amber-500" />
                              <span className="text-[10px] text-amber-600 max-w-[120px] truncate">{policy.warnings[0]}</span>
                            </div>
                          )}
                          <Button size="sm" onClick={() => bookFlight(flight)}>Book</Button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}

          {flightSearchDone && flightResults.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Plane size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2">No flights found for this route</p>
                <p className="text-xs text-t3 mt-1">Try different dates or destinations</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* HOTEL SEARCH TAB */}
      {/* ============================================================ */}
      {activeTab === 'hotels' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Hotel size={16} className="text-brand" />
              Search Hotels
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <Input label="City" placeholder="e.g. Lagos, Nairobi" value={hotelSearch.city}
                onChange={e => setHotelSearch({ ...hotelSearch, city: e.target.value })} />
              <Input label="Check-in" type="date" value={hotelSearch.checkIn}
                onChange={e => setHotelSearch({ ...hotelSearch, checkIn: e.target.value })} />
              <Input label="Check-out" type="date" value={hotelSearch.checkOut}
                onChange={e => setHotelSearch({ ...hotelSearch, checkOut: e.target.value })} />
              <Select label="Rooms" value={hotelSearch.rooms}
                onChange={e => setHotelSearch({ ...hotelSearch, rooms: e.target.value })}
                options={[{ value: '1', label: '1 Room' }, { value: '2', label: '2 Rooms' }, { value: '3', label: '3 Rooms' }]} />
              <Select label="Guests" value={hotelSearch.guests}
                onChange={e => setHotelSearch({ ...hotelSearch, guests: e.target.value })}
                options={[{ value: '1', label: '1 Guest' }, { value: '2', label: '2 Guests' }, { value: '3', label: '3 Guests' }, { value: '4', label: '4 Guests' }]} />
            </div>
            <Button onClick={searchHotels} disabled={hotelSearching}>
              {hotelSearching ? <><Loader2 size={14} className="animate-spin" /> Searching...</> : <><Search size={14} /> Search Hotels</>}
            </Button>
          </Card>

          {/* Hotel Results */}
          {hotelSearchDone && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-t1">{hotelResults.length} Hotels in {hotelSearch.city}</h3>
                <span className="text-xs text-t3">{hotelSearch.checkIn} to {hotelSearch.checkOut}</span>
              </div>
              {hotelResults.map(hotel => {
                const policy = checkHotelPolicy(hotel.pricePerNight)
                const nights = Math.max(1, Math.ceil((new Date(hotelSearch.checkOut).getTime() - new Date(hotelSearch.checkIn).getTime()) / (1000 * 60 * 60 * 24)))
                return (
                  <Card key={hotel.id}>
                    <div className="flex gap-4">
                      {/* Hotel Image Placeholder */}
                      <div className="w-32 h-24 bg-canvas rounded-lg flex items-center justify-center shrink-0 border border-border">
                        <Hotel size={28} className="text-t3" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold text-t1">{hotel.name}</h4>
                          <div className="flex gap-0.5">
                            {Array.from({ length: hotel.stars }).map((_, i) => (
                              <Star key={i} size={10} className="text-amber-400 fill-amber-400" />
                            ))}
                          </div>
                          {!policy.compliant && (
                            <Badge variant="warning">Over Policy</Badge>
                          )}
                        </div>
                        <p className="text-xs text-t3 mb-2">{hotel.address}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {hotel.amenities.map(a => (
                            <span key={a} className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-canvas rounded text-[10px] text-t2 border border-border">
                              {a === 'Free WiFi' && <Wifi size={8} />}
                              {a === 'Breakfast Included' && <Coffee size={8} />}
                              {a}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-3 text-xs text-t3">
                          <span className="font-medium text-t1">{hotel.rating}/5</span>
                          <span>{hotel.reviewCount} reviews</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col justify-between">
                        <div>
                          <p className="text-lg font-bold text-t1">{formatCurrency(hotel.pricePerNight, defaultCurrency, { cents: true })}</p>
                          <p className="text-xs text-t3">per night</p>
                          <p className="text-xs font-medium text-t2 mt-1">{formatCurrency(hotel.totalPrice, defaultCurrency, { cents: true })} total ({nights} night{nights !== 1 ? 's' : ''})</p>
                        </div>
                        {!policy.compliant && (
                          <p className="text-[10px] text-amber-600 mt-1">{policy.warnings[0]}</p>
                        )}
                        <Button size="sm" onClick={() => bookHotel(hotel)} className="mt-2">Book</Button>
                      </div>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}

          {hotelSearchDone && hotelResults.length === 0 && (
            <Card>
              <div className="text-center py-8">
                <Hotel size={32} className="mx-auto text-t3 mb-3" />
                <p className="text-sm text-t2">No hotels found</p>
                <p className="text-xs text-t3 mt-1">Try a different city or dates</p>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* DUTY OF CARE TAB */}
      {/* ============================================================ */}
      {activeTab === 'duty-of-care' && (
        <div className="space-y-6">
          {/* Destination Risk Levels */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Shield size={16} className="text-brand" />
              Destination Risk Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(destinationRiskLevels).map(([city, info]) => (
                <div key={city} className={cn(
                  'p-4 rounded-lg border',
                  info.level === 'low' ? 'border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20' :
                  info.level === 'medium' ? 'border-amber-200 bg-amber-50/50 dark:bg-amber-950/20' :
                  info.level === 'high' ? 'border-teal-200 bg-teal-50/50 dark:bg-teal-950/20' :
                  'border-red-200 bg-red-50/50 dark:bg-red-950/20'
                )}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-t2" />
                      <span className="text-sm font-semibold text-t1">{city}</span>
                    </div>
                    <Badge variant={
                      info.level === 'low' ? 'success' :
                      info.level === 'medium' ? 'warning' :
                      info.level === 'high' ? 'orange' : 'error'
                    }>
                      {info.level.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-xs text-t2 mb-3">{info.advisory}</p>
                  <div className="flex items-center gap-1.5 text-xs text-t3">
                    <Phone size={10} />
                    Emergency: <span className="font-medium text-t1">{info.emergency}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Traveler Location Tracking */}
          <Card padding="none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Globe size={16} className="text-brand" />
                <CardTitle>Active Traveler Locations</CardTitle>
                <Badge variant="info">{travelerLocations.length} travelers</Badge>
              </div>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-divider bg-canvas">
                    <th className="tempo-th text-left px-6 py-3">Traveler</th>
                    <th className="tempo-th text-left px-4 py-3">Destination</th>
                    <th className="tempo-th text-left px-4 py-3">Risk Level</th>
                    <th className="tempo-th text-left px-4 py-3">Travel Dates</th>
                    <th className="tempo-th text-center px-4 py-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {travelerLocations.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-xs text-t3">No active travelers</td></tr>
                  ) : travelerLocations.map((loc, i) => {
                    const city = loc.destination?.split(',')[0]?.trim()
                    const risk = destinationRiskLevels[city]
                    return (
                      <tr key={i} className="hover:bg-canvas/50">
                        <td className="px-6 py-3 text-xs font-medium text-t1">{loc.employee}</td>
                        <td className="px-4 py-3 text-xs text-t2">
                          <div className="flex items-center gap-1.5">
                            <MapPin size={12} className="text-t3" /> {loc.destination}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {risk ? (
                            <Badge variant={risk.level === 'low' ? 'success' : risk.level === 'medium' ? 'warning' : 'error'}>
                              {risk.level}
                            </Badge>
                          ) : <Badge variant="default">Unknown</Badge>}
                        </td>
                        <td className="px-4 py-3 text-xs text-t2">{loc.startDate} - {loc.endDate}</td>
                        <td className="px-4 py-3 text-center"><Badge variant="info">In transit</Badge></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Emergency Contacts */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4 flex items-center gap-2">
              <Phone size={16} className="text-red-500" />
              Emergency Travel Contacts
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'Travel Assistance 24/7', number: '+1-800-TEMPO-SOS', desc: 'Medical, security, and evacuation support' },
                { title: 'HR Emergency Line', number: '+1-800-TEMPO-HR', desc: 'Employee welfare and support' },
                { title: 'Security Operations', number: '+1-800-TEMPO-SEC', desc: 'Security incidents and threat response' },
              ].map(contact => (
                <div key={contact.title} className="p-4 bg-canvas rounded-lg border border-border">
                  <p className="text-xs font-semibold text-t1 mb-1">{contact.title}</p>
                  <p className="text-sm font-bold text-brand mb-1">{contact.number}</p>
                  <p className="text-xs text-t3">{contact.desc}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================ */}
      {/* COST ALLOCATION TAB */}
      {/* ============================================================ */}
      {activeTab === 'cost-allocation' && (
        <div className="space-y-6">
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-2 flex items-center gap-2">
              <PieChart size={16} className="text-brand" />
              Travel Cost Allocation
            </h3>
            <p className="text-xs text-t3 mb-4">Assign travel costs to cost centers, projects, or clients. Split costs across multiple departments.</p>
          </Card>

          <Card padding="none">
            <CardHeader>
              <CardTitle>Booking Cost Allocations</CardTitle>
            </CardHeader>
            <div className="divide-y divide-divider">
              {travelBookings.length === 0 ? (
                <div className="px-6 py-12 text-center text-xs text-t3">No bookings to allocate</div>
              ) : travelBookings.map((booking: any) => {
                const allocation = costAllocations[booking.id]
                const isEditing = editingAllocationId === booking.id
                return (
                  <div key={booking.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        {getBookingTypeIcon(booking.type)}
                        <div>
                          <p className="text-sm font-medium text-t1">{booking.provider}</p>
                          <p className="text-xs text-t3">{booking.confirmation_number} &middot; {formatCurrency(booking.cost, defaultCurrency, { cents: true })}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {allocation ? (
                          <Badge variant="success">Allocated</Badge>
                        ) : (
                          <Badge variant="warning">Unallocated</Badge>
                        )}
                        <Button size="sm" variant="secondary" onClick={() => {
                          if (isEditing) {
                            setEditingAllocationId(null)
                          } else {
                            setEditingAllocationId(booking.id)
                            setAllocationForm(allocation || { costCenter: '', project: '', client: '', splitDepts: [{ dept: '', pct: 100 }] })
                          }
                        }}>
                          {isEditing ? 'Cancel' : allocation ? 'Edit' : 'Allocate'}
                        </Button>
                      </div>
                    </div>

                    {/* Show current allocation */}
                    {allocation && !isEditing && (
                      <div className="ml-7 grid grid-cols-3 gap-3">
                        {allocation.costCenter && (
                          <div className="bg-canvas rounded-lg p-2 border border-border">
                            <p className="text-[10px] uppercase text-t3 font-medium">Cost Center</p>
                            <p className="text-xs font-medium text-t1">{allocation.costCenter}</p>
                          </div>
                        )}
                        {allocation.project && (
                          <div className="bg-canvas rounded-lg p-2 border border-border">
                            <p className="text-[10px] uppercase text-t3 font-medium">Project</p>
                            <p className="text-xs font-medium text-t1">{allocation.project}</p>
                          </div>
                        )}
                        {allocation.client && (
                          <div className="bg-canvas rounded-lg p-2 border border-border">
                            <p className="text-[10px] uppercase text-t3 font-medium">Client</p>
                            <p className="text-xs font-medium text-t1">{allocation.client}</p>
                          </div>
                        )}
                        {allocation.splitDepts.length > 0 && allocation.splitDepts[0].dept && (
                          <div className="col-span-3 bg-canvas rounded-lg p-2 border border-border">
                            <p className="text-[10px] uppercase text-t3 font-medium mb-1">Department Split</p>
                            <div className="flex gap-2 flex-wrap">
                              {allocation.splitDepts.filter(s => s.dept).map((split, i) => (
                                <Badge key={i} variant="default">{split.dept}: {split.pct}%</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Edit allocation form */}
                    {isEditing && (
                      <div className="ml-7 mt-2 space-y-3 p-4 bg-canvas rounded-lg border border-border">
                        <div className="grid grid-cols-3 gap-3">
                          <Input label="Cost Center" placeholder="e.g. CC-1001" value={allocationForm.costCenter}
                            onChange={e => setAllocationForm({ ...allocationForm, costCenter: e.target.value })} />
                          <Input label="Project" placeholder="e.g. Q1 Expansion" value={allocationForm.project}
                            onChange={e => setAllocationForm({ ...allocationForm, project: e.target.value })} />
                          <Input label="Client" placeholder="e.g. Acme Corp" value={allocationForm.client}
                            onChange={e => setAllocationForm({ ...allocationForm, client: e.target.value })} />
                        </div>
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-xs font-medium text-t1">Department Split</label>
                            <Button size="sm" variant="secondary" onClick={() => setAllocationForm({
                              ...allocationForm,
                              splitDepts: [...allocationForm.splitDepts, { dept: '', pct: 0 }]
                            })}>
                              <Plus size={10} /> Add Split
                            </Button>
                          </div>
                          <div className="space-y-2">
                            {allocationForm.splitDepts.map((split, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <Input placeholder="Department" value={split.dept} className="flex-1"
                                  onChange={e => {
                                    const updated = [...allocationForm.splitDepts]
                                    updated[i] = { ...split, dept: e.target.value }
                                    setAllocationForm({ ...allocationForm, splitDepts: updated })
                                  }} />
                                <div className="w-20">
                                  <Input type="number" placeholder="%" value={split.pct}
                                    onChange={e => {
                                      const updated = [...allocationForm.splitDepts]
                                      updated[i] = { ...split, pct: Number(e.target.value) }
                                      setAllocationForm({ ...allocationForm, splitDepts: updated })
                                    }} />
                                </div>
                                <span className="text-xs text-t3">%</span>
                                {allocationForm.splitDepts.length > 1 && (
                                  <button onClick={() => setAllocationForm({
                                    ...allocationForm,
                                    splitDepts: allocationForm.splitDepts.filter((_, j) => j !== i)
                                  })} className="p-1 text-t3 hover:text-error">
                                    <XCircle size={14} />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                          {allocationForm.splitDepts.reduce((a, s) => a + s.pct, 0) !== 100 && allocationForm.splitDepts.some(s => s.dept) && (
                            <p className="text-[10px] text-amber-600 mt-1">Split percentages should total 100% (currently {allocationForm.splitDepts.reduce((a, s) => a + s.pct, 0)}%)</p>
                          )}
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                          <Button variant="secondary" size="sm" onClick={() => setEditingAllocationId(null)}>Cancel</Button>
                          <Button size="sm" onClick={() => saveAllocation(booking.id)}>
                            <CheckCircle size={12} /> Save Allocation
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Allocation Summary */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-4">Allocation Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-canvas rounded-lg p-4 text-center border border-border">
                <p className="text-2xl font-bold text-t1">{travelBookings.length}</p>
                <p className="text-xs text-t3 mt-1">Total Bookings</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center border border-border">
                <p className="text-2xl font-bold text-emerald-600">{Object.keys(costAllocations).length}</p>
                <p className="text-xs text-t3 mt-1">Allocated</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center border border-border">
                <p className="text-2xl font-bold text-amber-600">{travelBookings.length - Object.keys(costAllocations).length}</p>
                <p className="text-xs text-t3 mt-1">Unallocated</p>
              </div>
              <div className="bg-canvas rounded-lg p-4 text-center border border-border">
                <p className="text-2xl font-bold text-t1">{formatCurrency(totalSpend, defaultCurrency, { cents: true })}</p>
                <p className="text-xs text-t3 mt-1">Total Spend</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* New Travel Request Modal */}
      <Modal open={showRequestModal} onClose={() => setShowRequestModal(false)} title="New Travel Request">
        <div className="space-y-4">
          <Input
            label="Destination"
            placeholder="e.g. Lagos, Nigeria"
            value={requestForm.destination}
            onChange={(e) => setRequestForm({ ...requestForm, destination: e.target.value })}
          />
          <Input
            label="Purpose"
            placeholder="e.g. Client onsite meeting"
            value={requestForm.purpose}
            onChange={(e) => setRequestForm({ ...requestForm, purpose: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={requestForm.start_date}
              onChange={(e) => setRequestForm({ ...requestForm, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={requestForm.end_date}
              onChange={(e) => setRequestForm({ ...requestForm, end_date: e.target.value })}
            />
          </div>
          <Input
            label="Estimated Cost (cents)"
            type="number"
            placeholder="350000"
            value={requestForm.estimated_cost}
            onChange={(e) => setRequestForm({ ...requestForm, estimated_cost: e.target.value })}
          />
          <Textarea
            label="Notes"
            placeholder="Additional details about this trip..."
            rows={3}
            value={requestForm.notes}
            onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })}
          />

          {/* Pre-Trip Approval: Budget Impact */}
          {requestForm.estimated_cost && Number(requestForm.estimated_cost) > 0 && (
            <div className="p-4 bg-canvas rounded-lg border border-border">
              <h4 className="text-xs font-semibold text-t1 mb-2 flex items-center gap-1.5">
                <DollarSign size={12} className="text-brand" /> Budget Impact Preview
              </h4>
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-t3">Estimated Cost</p>
                  <p className="font-semibold text-t1">{formatCurrency(Number(requestForm.estimated_cost), defaultCurrency, { cents: true })}</p>
                </div>
                <div>
                  <p className="text-t3">Current Travel Spend</p>
                  <p className="font-semibold text-t1">{formatCurrency(totalSpend, defaultCurrency, { cents: true })}</p>
                </div>
                <div>
                  <p className="text-t3">Projected Total</p>
                  <p className="font-semibold text-brand">{formatCurrency(totalSpend + Number(requestForm.estimated_cost), defaultCurrency, { cents: true })}</p>
                </div>
              </div>
              {(() => {
                const warnings: string[] = []
                const policy = travelPolicies[0] as any
                if (policy?.rules?.advance_booking_days && requestForm.start_date) {
                  const daysAhead = Math.ceil((new Date(requestForm.start_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                  if (daysAhead < (policy.rules.advance_booking_days || 0)) {
                    warnings.push(`Booked only ${daysAhead} days ahead (policy requires ${policy.rules.advance_booking_days} days)`)
                  }
                }
                if (policy?.rules?.requires_approval_above && Number(requestForm.estimated_cost) > policy.rules.requires_approval_above) {
                  warnings.push('Exceeds auto-approval threshold - manager approval required')
                }
                if (warnings.length === 0) return null
                return (
                  <div className="mt-3 space-y-1">
                    {warnings.map((w, i) => (
                      <div key={i} className="flex items-center gap-1.5 text-xs text-amber-600">
                        <AlertTriangle size={10} /> {w}
                      </div>
                    ))}
                  </div>
                )
              })()}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowRequestModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitRequest}>{tc('submit')}</Button>
          </div>
        </div>
      </Modal>

      {/* New / Edit Booking Modal */}
      <Modal open={showBookingModal} onClose={() => setShowBookingModal(false)} title={editingBookingId ? 'Edit Booking' : 'New Booking'}>
        <div className="space-y-4">
          <Select
            label="Type"
            value={bookingForm.type}
            onChange={(e) => setBookingForm({ ...bookingForm, type: e.target.value })}
            options={[
              { value: 'flight', label: 'Flight' },
              { value: 'hotel', label: 'Hotel' },
              { value: 'car', label: 'Car' },
            ]}
          />
          <Input
            label="Provider"
            placeholder="e.g. United Airlines, Marriott"
            value={bookingForm.provider}
            onChange={(e) => setBookingForm({ ...bookingForm, provider: e.target.value })}
          />
          <Input
            label="Confirmation Number"
            placeholder="e.g. ABC123"
            value={bookingForm.confirmation_number}
            onChange={(e) => setBookingForm({ ...bookingForm, confirmation_number: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Check-in / Departure Date"
              type="date"
              value={bookingForm.check_in_date}
              onChange={(e) => setBookingForm({ ...bookingForm, check_in_date: e.target.value })}
            />
            <Input
              label="Check-out / Return Date"
              type="date"
              value={bookingForm.check_out_date}
              onChange={(e) => setBookingForm({ ...bookingForm, check_out_date: e.target.value })}
            />
          </div>
          <Input
            label="Amount (cents)"
            type="number"
            placeholder="150000"
            value={bookingForm.amount}
            onChange={(e) => setBookingForm({ ...bookingForm, amount: e.target.value })}
          />
          <Select
            label="Status"
            value={bookingForm.status}
            onChange={(e) => setBookingForm({ ...bookingForm, status: e.target.value })}
            options={[
              { value: 'confirmed', label: 'Confirmed' },
              { value: 'pending', label: 'Pending' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <Select
            label="Linked Travel Request"
            value={bookingForm.travel_request_id}
            onChange={(e) => setBookingForm({ ...bookingForm, travel_request_id: e.target.value })}
            options={[
              { value: '', label: 'None' },
              ...travelRequests.map((req: any) => ({
                value: req.id,
                label: `${req.destination} — ${getEmployeeName(req.employee_id)}`,
              })),
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowBookingModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitBooking}>{editingBookingId ? tc('save') : tc('submit')}</Button>
          </div>
        </div>
      </Modal>

      {/* New / Edit Policy Modal */}
      <Modal open={showPolicyModal} onClose={() => setShowPolicyModal(false)} title={editingPolicyId ? 'Edit Policy' : 'Add Policy'}>
        <div className="space-y-4">
          <Input
            label="Policy Name"
            placeholder="e.g. Standard Travel Policy"
            value={policyForm.name}
            onChange={(e) => setPolicyForm({ ...policyForm, name: e.target.value })}
          />
          <Textarea
            label="Description"
            placeholder="Describe the policy scope and rules..."
            rows={3}
            value={policyForm.description}
            onChange={(e) => setPolicyForm({ ...policyForm, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Max Daily Hotel Rate (cents)"
              type="number"
              placeholder="25000"
              value={policyForm.max_daily_hotel}
              onChange={(e) => setPolicyForm({ ...policyForm, max_daily_hotel: e.target.value })}
            />
            <Input
              label="Max Flight Cost (cents)"
              type="number"
              placeholder="100000"
              value={policyForm.max_flight_cost}
              onChange={(e) => setPolicyForm({ ...policyForm, max_flight_cost: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Advance Booking Days"
              type="number"
              placeholder="14"
              value={policyForm.advance_booking_days}
              onChange={(e) => setPolicyForm({ ...policyForm, advance_booking_days: e.target.value })}
            />
            <Select
              label="Requires Approval"
              value={policyForm.requires_approval}
              onChange={(e) => setPolicyForm({ ...policyForm, requires_approval: e.target.value })}
              options={[
                { value: 'true', label: 'Yes' },
                { value: 'false', label: 'No' },
              ]}
            />
          </div>
          <Select
            label="Status"
            value={policyForm.status}
            onChange={(e) => setPolicyForm({ ...policyForm, status: e.target.value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
            ]}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowPolicyModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitPolicy}>{editingPolicyId ? tc('save') : tc('submit')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
