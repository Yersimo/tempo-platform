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
import { Plane, Hotel, MapPin, Calendar, DollarSign, Plus, CheckCircle, Clock, AlertTriangle, FileText, Car, Shield, ArrowRight, Receipt, Pencil } from 'lucide-react'
import { useTempo } from '@/lib/store'

export default function TravelManagementPage() {
  const tc = useTranslations('common')
  const { travelRequests, travelBookings, travelPolicies, employees, addTravelRequest, updateTravelRequest, addTravelBooking, updateTravelBooking, addTravelPolicy, updateTravelPolicy, ensureModulesLoaded } = useTempo()

  useEffect(() => {
    ensureModulesLoaded?.(['travelRequests', 'travelBookings'])
  }, [ensureModulesLoaded])

  const [activeTab, setActiveTab] = useState<'requests' | 'bookings' | 'policies' | 'expenses'>('requests')
  const [showRequestModal, setShowRequestModal] = useState(false)
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

  function submitRequest() {
    if (!requestForm.destination || !requestForm.purpose || !requestForm.estimated_cost) return
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
    { key: 'bookings' as const, label: 'Bookings', icon: <Plane size={14} /> },
    { key: 'policies' as const, label: 'Policies', icon: <Shield size={14} /> },
    { key: 'expenses' as const, label: 'Expense Integration', icon: <Receipt size={14} /> },
  ]

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
        <StatCard label="Total Spend" value={`$${(totalSpend / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`} icon={<DollarSign size={20} />} />
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
                {travelRequests.map((req: any) => (
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
                      </div>
                    </td>
                  </tr>
                ))}
                {travelRequests.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-xs text-t3">{tc('noResults')}</td>
                  </tr>
                )}
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
                {travelBookings.map((booking: any) => (
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
                {travelBookings.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-xs text-t3">{tc('noResults')}</td>
                  </tr>
                )}
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
          {travelPolicies.map((policy: any) => (
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
          {travelPolicies.length === 0 && (
            <Card>
              <p className="text-center text-xs text-t3 py-8">{tc('noResults')}</p>
            </Card>
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
