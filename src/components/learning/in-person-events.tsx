'use client'

import { useState, useMemo, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { cn } from '@/lib/utils/cn'
import {
  MapPin, Clock, Users, Calendar, ChevronLeft, ChevronRight,
  Plus, ExternalLink, User, CheckCircle2, XCircle, AlertCircle,
  List, CalendarDays, ArrowLeft, FileText, ClipboardCheck
} from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type EventType = 'workshop' | 'seminar' | 'lab' | 'orientation'
type EventStatus = 'upcoming' | 'in_progress' | 'completed' | 'cancelled'
type RSVPStatus = 'registered' | 'waitlisted' | 'cancelled' | 'none'
type AttendanceStatus = 'present' | 'absent' | 'excused'

interface InPersonEvent {
  id: string
  title: string
  description: string
  date: string          // ISO date
  startTime: string     // HH:mm
  endTime: string       // HH:mm
  location: string
  room: string
  mapLink: string
  instructorId: string
  capacity: number
  eventType: EventType
  linkedCourseId: string | null
  status: EventStatus
  attendees: { employeeId: string; rsvp: RSVPStatus; attendance?: AttendanceStatus }[]
  materials: { name: string; url: string }[]
}

interface InPersonEventsProps {
  employees: any[]
  courses: any[]
  currentEmployeeId: string
  getEmployeeName: (id: string) => string
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void
}

/* ------------------------------------------------------------------ */
/*  Seed data                                                          */
/* ------------------------------------------------------------------ */

function seedEvents(employees: any[]): InPersonEvent[] {
  const empIds = employees.slice(0, 8).map(e => e.id)
  return [
    {
      id: 'evt-1', title: 'Leadership Workshop: Effective Delegation',
      description: 'Hands-on workshop exploring delegation frameworks, trust-building, and performance accountability. Includes group exercises and role-play scenarios.',
      date: '2026-03-20', startTime: '09:00', endTime: '12:30',
      location: '100 King St, London EC2V 8EQ', room: 'Training Room A — 3rd Floor',
      mapLink: 'https://maps.google.com/?q=100+King+St+London+EC2V+8EQ',
      instructorId: empIds[0] || 'emp-1', capacity: 20, eventType: 'workshop',
      linkedCourseId: 'course-1', status: 'upcoming',
      attendees: [
        { employeeId: empIds[1] || 'emp-2', rsvp: 'registered' },
        { employeeId: empIds[2] || 'emp-3', rsvp: 'registered' },
        { employeeId: empIds[3] || 'emp-4', rsvp: 'registered' },
        { employeeId: empIds[4] || 'emp-5', rsvp: 'registered' },
      ],
      materials: [{ name: 'Delegation Workbook.pdf', url: '#' }, { name: 'Exercise Handouts.pdf', url: '#' }],
    },
    {
      id: 'evt-2', title: 'AML Compliance Seminar — Q1 Update',
      description: 'Quarterly seminar covering the latest AML regulatory updates, case studies of recent enforcement actions, and updated KYC procedures.',
      date: '2026-03-25', startTime: '14:00', endTime: '16:00',
      location: '200 Aldersgate St, London EC1A 4HD', room: 'Auditorium B',
      mapLink: 'https://maps.google.com/?q=200+Aldersgate+St+London+EC1A+4HD',
      instructorId: empIds[2] || 'emp-3', capacity: 50, eventType: 'seminar',
      linkedCourseId: 'course-2', status: 'upcoming',
      attendees: empIds.slice(0, 6).map(id => ({ employeeId: id, rsvp: 'registered' as RSVPStatus })),
      materials: [{ name: 'Q1 AML Slide Deck.pptx', url: '#' }],
    },
    {
      id: 'evt-3', title: 'API Integration Lab',
      description: 'Hands-on coding lab where participants build integrations with the Tempo Banking API. Bring your laptop.',
      date: '2026-03-14', startTime: '10:00', endTime: '15:00',
      location: '100 King St, London EC2V 8EQ', room: 'Computer Lab 2 — 5th Floor',
      mapLink: 'https://maps.google.com/?q=100+King+St+London+EC2V+8EQ',
      instructorId: empIds[5] || 'emp-6', capacity: 15, eventType: 'lab',
      linkedCourseId: 'course-4', status: 'in_progress',
      attendees: empIds.slice(0, 5).map(id => ({ employeeId: id, rsvp: 'registered' as RSVPStatus })),
      materials: [{ name: 'API Starter Kit.zip', url: '#' }, { name: 'Lab Instructions.pdf', url: '#' }],
    },
    {
      id: 'evt-4', title: 'New Hire Orientation — March Cohort',
      description: 'Full-day orientation for new joiners covering company culture, HR policies, benefits enrolment, IT setup, and facility tour.',
      date: '2026-03-05', startTime: '09:00', endTime: '17:00',
      location: '100 King St, London EC2V 8EQ', room: 'Conference Hall — Ground Floor',
      mapLink: 'https://maps.google.com/?q=100+King+St+London+EC2V+8EQ',
      instructorId: empIds[0] || 'emp-1', capacity: 30, eventType: 'orientation',
      linkedCourseId: null, status: 'completed',
      attendees: [
        { employeeId: empIds[6] || 'emp-7', rsvp: 'registered', attendance: 'present' },
        { employeeId: empIds[7] || 'emp-8', rsvp: 'registered', attendance: 'present' },
        { employeeId: empIds[3] || 'emp-4', rsvp: 'registered', attendance: 'absent' },
      ],
      materials: [{ name: 'Welcome Pack.pdf', url: '#' }, { name: 'Benefits Guide.pdf', url: '#' }],
    },
    {
      id: 'evt-5', title: 'Data Privacy Deep-Dive',
      description: 'An intensive workshop on GDPR, data subject rights, breach notification timelines, and cross-border transfer mechanisms.',
      date: '2026-04-02', startTime: '13:00', endTime: '16:00',
      location: '200 Aldersgate St, London EC1A 4HD', room: 'Meeting Room 4A',
      mapLink: 'https://maps.google.com/?q=200+Aldersgate+St+London+EC1A+4HD',
      instructorId: empIds[1] || 'emp-2', capacity: 12, eventType: 'workshop',
      linkedCourseId: 'course-6', status: 'upcoming',
      attendees: empIds.slice(0, 12).map(id => ({ employeeId: id, rsvp: 'registered' as RSVPStatus })),
      materials: [],
    },
    {
      id: 'evt-6', title: 'Executive Presence Masterclass',
      description: 'Cancelled due to instructor availability.',
      date: '2026-03-18', startTime: '10:00', endTime: '13:00',
      location: '100 King St, London EC2V 8EQ', room: 'Boardroom — 8th Floor',
      mapLink: 'https://maps.google.com/?q=100+King+St+London+EC2V+8EQ',
      instructorId: empIds[0] || 'emp-1', capacity: 10, eventType: 'seminar',
      linkedCourseId: 'course-8', status: 'cancelled',
      attendees: [
        { employeeId: empIds[1] || 'emp-2', rsvp: 'cancelled' },
        { employeeId: empIds[4] || 'emp-5', rsvp: 'cancelled' },
      ],
      materials: [],
    },
  ]
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<EventStatus, { label: string; variant: 'info' | 'warning' | 'success' | 'error' }> = {
  upcoming: { label: 'Upcoming', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'error' },
}

const TYPE_LABELS: Record<EventType, string> = {
  workshop: 'Workshop', seminar: 'Seminar', lab: 'Lab', orientation: 'Orientation',
}

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function fmtTime(t: string) {
  const [h, m] = t.split(':').map(Number)
  const suffix = h >= 12 ? 'PM' : 'AM'
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${suffix}`
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function InPersonEvents({ employees, courses, currentEmployeeId, getEmployeeName, addToast }: InPersonEventsProps) {
  const [events, setEvents] = useState<InPersonEvent[]>(() => seedEvents(employees))
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [selectedEvent, setSelectedEvent] = useState<InPersonEvent | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)
  const [filterStatus, setFilterStatus] = useState<EventStatus | 'all'>('all')

  // Calendar state
  const today = new Date()
  const [calYear, setCalYear] = useState(today.getFullYear())
  const [calMonth, setCalMonth] = useState(today.getMonth())

  // Create form
  const [form, setForm] = useState({
    title: '', description: '', date: '', startTime: '09:00', endTime: '17:00',
    location: '', room: '', instructorId: employees[0]?.id || '',
    capacity: '20', eventType: 'workshop' as EventType, linkedCourseId: '',
  })

  const filteredEvents = useMemo(() => {
    let list = events
    if (filterStatus !== 'all') list = list.filter(e => e.status === filterStatus)
    return list.sort((a, b) => a.date.localeCompare(b.date))
  }, [events, filterStatus])

  /* ---- RSVP ---- */
  const handleRSVP = useCallback((eventId: string) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev
      const existing = ev.attendees.find(a => a.employeeId === currentEmployeeId)
      if (existing) {
        // Cancel registration
        return { ...ev, attendees: ev.attendees.filter(a => a.employeeId !== currentEmployeeId) }
      }
      const registeredCount = ev.attendees.filter(a => a.rsvp === 'registered').length
      const rsvp: RSVPStatus = registeredCount >= ev.capacity ? 'waitlisted' : 'registered'
      return { ...ev, attendees: [...ev.attendees, { employeeId: currentEmployeeId, rsvp }] }
    }))
    addToast('RSVP updated')
  }, [currentEmployeeId, addToast])

  /* ---- Create ---- */
  const handleCreate = useCallback(() => {
    if (!form.title || !form.date) return
    const newEvent: InPersonEvent = {
      id: `evt-${Date.now()}`,
      title: form.title,
      description: form.description,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      location: form.location,
      room: form.room,
      mapLink: `https://maps.google.com/?q=${encodeURIComponent(form.location)}`,
      instructorId: form.instructorId,
      capacity: parseInt(form.capacity) || 20,
      eventType: form.eventType,
      linkedCourseId: form.linkedCourseId || null,
      status: 'upcoming',
      attendees: [],
      materials: [],
    }
    setEvents(prev => [...prev, newEvent])
    setShowCreate(false)
    setForm({ title: '', description: '', date: '', startTime: '09:00', endTime: '17:00', location: '', room: '', instructorId: employees[0]?.id || '', capacity: '20', eventType: 'workshop', linkedCourseId: '' })
    addToast('Event created')
  }, [form, employees, addToast])

  /* ---- Attendance ---- */
  const handleAttendance = useCallback((eventId: string, employeeId: string, status: AttendanceStatus) => {
    setEvents(prev => prev.map(ev => {
      if (ev.id !== eventId) return ev
      return {
        ...ev,
        attendees: ev.attendees.map(a =>
          a.employeeId === employeeId ? { ...a, attendance: status } : a
        ),
      }
    }))
    // Update selectedEvent too
    setSelectedEvent(prev => {
      if (!prev || prev.id !== eventId) return prev
      return {
        ...prev,
        attendees: prev.attendees.map(a =>
          a.employeeId === employeeId ? { ...a, attendance: status } : a
        ),
      }
    })
  }, [])

  /* ---- Calendar nav ---- */
  const prevMonth = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1) } else setCalMonth(m => m - 1) }
  const nextMonth = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1) } else setCalMonth(m => m + 1) }

  const calendarDays = useMemo(() => {
    const days = daysInMonth(calYear, calMonth)
    const firstDay = firstDayOfMonth(calYear, calMonth)
    const offset = firstDay === 0 ? 6 : firstDay - 1 // Monday-start
    const cells: (number | null)[] = Array(offset).fill(null)
    for (let d = 1; d <= days; d++) cells.push(d)
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [calYear, calMonth])

  const eventsForDay = useCallback((day: number) => {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return events.filter(e => e.date === dateStr)
  }, [events, calYear, calMonth])

  /* ---- Detail view ---- */
  if (selectedEvent) {
    const ev = events.find(e => e.id === selectedEvent.id) || selectedEvent
    const registeredCount = ev.attendees.filter(a => a.rsvp === 'registered').length
    const myRSVP = ev.attendees.find(a => a.employeeId === currentEmployeeId)
    const meta = STATUS_META[ev.status]
    const linkedCourse = courses.find((c: any) => c.id === ev.linkedCourseId)

    return (
      <div className="space-y-6">
        <button onClick={() => setSelectedEvent(null)} className="flex items-center gap-1.5 text-xs text-t3 hover:text-t1 transition-colors">
          <ArrowLeft size={14} /> Back to events
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-t1">{ev.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={meta.variant}>{meta.label}</Badge>
              <Badge>{TYPE_LABELS[ev.eventType]}</Badge>
              {linkedCourse && <Badge variant="orange">{linkedCourse.title}</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            {ev.status === 'completed' && (
              <Button size="sm" variant="secondary" onClick={() => setShowAttendance(true)}>
                <ClipboardCheck size={14} /> Mark Attendance
              </Button>
            )}
            {(ev.status === 'upcoming' || ev.status === 'in_progress') && (
              <Button size="sm" onClick={() => handleRSVP(ev.id)}>
                {myRSVP ? 'Cancel RSVP' : registeredCount >= ev.capacity ? 'Join Waitlist' : 'Register'}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left — details */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">Description</h3>
              <p className="text-sm text-t2 leading-relaxed">{ev.description}</p>
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">Logistics</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="flex items-start gap-2">
                  <Calendar size={14} className="text-t3 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-t1 font-medium">{fmtDate(ev.date)}</p>
                    <p className="text-t3">{fmtTime(ev.startTime)} — {fmtTime(ev.endTime)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin size={14} className="text-t3 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-t1 font-medium">{ev.room}</p>
                    <p className="text-t3">{ev.location}</p>
                    <a href={ev.mapLink} target="_blank" rel="noopener noreferrer" className="text-tempo-600 hover:underline text-xs flex items-center gap-1 mt-0.5">
                      View on map <ExternalLink size={10} />
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <User size={14} className="text-t3 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-t1 font-medium">Instructor</p>
                    <p className="text-t3">{getEmployeeName(ev.instructorId)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Users size={14} className="text-t3 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-t1 font-medium">Capacity</p>
                    <p className="text-t3">{registeredCount} / {ev.capacity} spots</p>
                  </div>
                </div>
              </div>
            </Card>

            {ev.materials.length > 0 && (
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Materials & Resources</h3>
                <div className="space-y-2">
                  {ev.materials.map((m, i) => (
                    <a key={i} href={m.url} className="flex items-center gap-2 text-sm text-tempo-600 hover:underline">
                      <FileText size={14} /> {m.name}
                    </a>
                  ))}
                </div>
              </Card>
            )}
          </div>

          {/* Right — attendees */}
          <Card>
            <h3 className="text-sm font-semibold text-t1 mb-3">Attendees ({registeredCount})</h3>
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {ev.attendees.map(a => (
                <div key={a.employeeId} className="flex items-center justify-between text-sm py-1.5 border-b border-divider last:border-0">
                  <span className="text-t1">{getEmployeeName(a.employeeId)}</span>
                  <div className="flex items-center gap-1.5">
                    {a.attendance && (
                      <Badge variant={a.attendance === 'present' ? 'success' : a.attendance === 'absent' ? 'error' : 'warning'}>
                        {a.attendance}
                      </Badge>
                    )}
                    <Badge variant={a.rsvp === 'registered' ? 'success' : a.rsvp === 'waitlisted' ? 'warning' : 'default'}>
                      {a.rsvp}
                    </Badge>
                  </div>
                </div>
              ))}
              {ev.attendees.length === 0 && <p className="text-xs text-t3">No attendees yet.</p>}
            </div>
          </Card>
        </div>

        {/* Attendance modal */}
        <Modal open={showAttendance} onClose={() => setShowAttendance(false)} title="Mark Attendance" size="lg">
          <div className="space-y-3">
            {ev.attendees.filter(a => a.rsvp === 'registered').map(a => (
              <div key={a.employeeId} className="flex items-center justify-between py-2 border-b border-divider last:border-0">
                <span className="text-sm text-t1">{getEmployeeName(a.employeeId)}</span>
                <div className="flex gap-1.5">
                  {(['present', 'absent', 'excused'] as AttendanceStatus[]).map(s => (
                    <button
                      key={s}
                      onClick={() => handleAttendance(ev.id, a.employeeId, s)}
                      className={cn(
                        'px-2.5 py-1 text-xs rounded-md border transition-colors',
                        a.attendance === s
                          ? s === 'present' ? 'bg-green-50 border-green-300 text-green-700'
                            : s === 'absent' ? 'bg-red-50 border-red-300 text-red-700'
                            : 'bg-amber-50 border-amber-300 text-amber-700'
                          : 'border-divider text-t3 hover:text-t1 hover:bg-canvas'
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Button size="sm" onClick={() => { setShowAttendance(false); addToast('Attendance saved') }}>Done</Button>
          </div>
        </Modal>
      </div>
    )
  }

  /* ------------------------------------------------------------------ */
  /*  List / Calendar view                                               */
  /* ------------------------------------------------------------------ */

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-t1">In-Person Events</h2>
          <p className="text-xs text-t3 mt-0.5">{events.length} events scheduled</p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            options={[
              { value: 'all', label: 'All statuses' },
              { value: 'upcoming', label: 'Upcoming' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'completed', label: 'Completed' },
              { value: 'cancelled', label: 'Cancelled' },
            ]}
          />
          <div className="flex rounded-md border border-divider overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn('p-2 transition-colors', view === 'list' ? 'bg-tempo-600 text-white' : 'text-t3 hover:bg-canvas')}
            >
              <List size={14} />
            </button>
            <button
              onClick={() => setView('calendar')}
              className={cn('p-2 transition-colors', view === 'calendar' ? 'bg-tempo-600 text-white' : 'text-t3 hover:bg-canvas')}
            >
              <CalendarDays size={14} />
            </button>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus size={14} /> Create Event
          </Button>
        </div>
      </div>

      {/* List view */}
      {view === 'list' && (
        <div className="space-y-3">
          {filteredEvents.map(ev => {
            const meta = STATUS_META[ev.status]
            const registeredCount = ev.attendees.filter(a => a.rsvp === 'registered').length
            const myRSVP = ev.attendees.find(a => a.employeeId === currentEmployeeId)

            return (
              <Card key={ev.id} padding="none" className="overflow-hidden hover:border-tempo-300 transition-colors">
                <div className="flex">
                  {/* Date sidebar */}
                  <div className={cn(
                    'w-20 shrink-0 flex flex-col items-center justify-center py-4 border-r border-divider',
                    ev.status === 'cancelled' && 'opacity-50'
                  )}>
                    <span className="text-xs text-t3 uppercase">{new Date(ev.date + 'T00:00:00').toLocaleDateString('en-GB', { month: 'short' })}</span>
                    <span className="text-2xl font-bold text-t1">{new Date(ev.date + 'T00:00:00').getDate()}</span>
                    <span className="text-xs text-t3">{new Date(ev.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short' })}</span>
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <button onClick={() => setSelectedEvent(ev)} className="text-sm font-semibold text-t1 hover:text-tempo-600 transition-colors text-left">
                          {ev.title}
                        </button>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={meta.variant}>{meta.label}</Badge>
                          <Badge>{TYPE_LABELS[ev.eventType]}</Badge>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {(ev.status === 'upcoming' || ev.status === 'in_progress') && (
                          <Button size="sm" variant={myRSVP ? 'secondary' : 'primary'} onClick={() => handleRSVP(ev.id)}>
                            {myRSVP ? 'Cancel' : registeredCount >= ev.capacity ? 'Waitlist' : 'Register'}
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-t3">
                      <span className="flex items-center gap-1"><Clock size={12} /> {fmtTime(ev.startTime)} — {fmtTime(ev.endTime)}</span>
                      <span className="flex items-center gap-1"><MapPin size={12} /> {ev.room}</span>
                      <span className="flex items-center gap-1"><User size={12} /> {getEmployeeName(ev.instructorId)}</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} />
                        <span className={registeredCount >= ev.capacity ? 'text-error font-medium' : ''}>
                          {registeredCount}/{ev.capacity} spots
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}

          {filteredEvents.length === 0 && (
            <Card className="text-center py-12">
              <Calendar size={32} className="mx-auto text-t3 mb-3" />
              <p className="text-sm text-t3">No events match the current filter.</p>
            </Card>
          )}
        </div>
      )}

      {/* Calendar view */}
      {view === 'calendar' && (
        <Card padding="none">
          <div className="flex items-center justify-between px-6 py-4 border-b border-divider">
            <button onClick={prevMonth} className="p-1 text-t3 hover:text-t1 transition-colors"><ChevronLeft size={16} /></button>
            <h3 className="text-sm font-semibold text-t1">
              {new Date(calYear, calMonth).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </h3>
            <button onClick={nextMonth} className="p-1 text-t3 hover:text-t1 transition-colors"><ChevronRight size={16} /></button>
          </div>

          <div className="grid grid-cols-7">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
              <div key={d} className="px-2 py-2 text-center text-xs font-medium text-t3 border-b border-divider">{d}</div>
            ))}

            {calendarDays.map((day, i) => {
              const dayEvents = day ? eventsForDay(day) : []
              const isToday = day === today.getDate() && calMonth === today.getMonth() && calYear === today.getFullYear()

              return (
                <div
                  key={i}
                  className={cn(
                    'min-h-[80px] p-1.5 border-b border-r border-divider text-xs',
                    !day && 'bg-canvas/50',
                    isToday && 'bg-tempo-50/30'
                  )}
                >
                  {day && (
                    <>
                      <span className={cn(
                        'inline-flex items-center justify-center w-6 h-6 rounded-full text-t2',
                        isToday && 'bg-tempo-600 text-white font-semibold'
                      )}>
                        {day}
                      </span>
                      <div className="space-y-0.5 mt-0.5">
                        {dayEvents.slice(0, 2).map(ev => {
                          const color = ev.status === 'cancelled' ? 'bg-red-100 text-red-700'
                            : ev.status === 'completed' ? 'bg-green-100 text-green-700'
                            : ev.status === 'in_progress' ? 'bg-amber-100 text-amber-700'
                            : 'bg-blue-100 text-blue-700'
                          return (
                            <button
                              key={ev.id}
                              onClick={() => setSelectedEvent(ev)}
                              className={cn('block w-full text-left px-1 py-0.5 rounded text-[0.6rem] truncate', color)}
                            >
                              {ev.title}
                            </button>
                          )
                        })}
                        {dayEvents.length > 2 && (
                          <span className="text-[0.6rem] text-t3 pl-1">+{dayEvents.length - 2} more</span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* Create Event Modal */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create In-Person Event" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Title" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Leadership Workshop" />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Description" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="Event description..." />
          </div>
          <Input label="Date" type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />
          <div className="grid grid-cols-2 gap-2">
            <Input label="Start Time" type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} />
            <Input label="End Time" type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} />
          </div>
          <Input label="Location (Address)" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="123 Main St, London" />
          <Input label="Room / Building" value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="Training Room A" />
          <Select
            label="Instructor"
            value={form.instructorId}
            onChange={e => setForm(f => ({ ...f, instructorId: e.target.value }))}
            options={employees.map((emp: any) => ({ value: emp.id, label: getEmployeeName(emp.id) }))}
          />
          <Input label="Capacity" type="number" value={form.capacity} onChange={e => setForm(f => ({ ...f, capacity: e.target.value }))} min={1} />
          <Select
            label="Event Type"
            value={form.eventType}
            onChange={e => setForm(f => ({ ...f, eventType: e.target.value as EventType }))}
            options={[
              { value: 'workshop', label: 'Workshop' },
              { value: 'seminar', label: 'Seminar' },
              { value: 'lab', label: 'Lab' },
              { value: 'orientation', label: 'Orientation' },
            ]}
          />
          <Select
            label="Linked Course (Optional)"
            value={form.linkedCourseId}
            onChange={e => setForm(f => ({ ...f, linkedCourseId: e.target.value }))}
            options={[{ value: '', label: 'None' }, ...courses.map((c: any) => ({ value: c.id, label: c.title }))]}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="secondary" size="sm" onClick={() => setShowCreate(false)}>Cancel</Button>
          <Button size="sm" onClick={handleCreate} disabled={!form.title || !form.date}>Create Event</Button>
        </div>
      </Modal>
    </div>
  )
}
