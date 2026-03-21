'use client'

import { useState, useMemo } from 'react'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Video, Calendar, Clock, Users, Link2, Plus, X, Search, Loader2, Check, ExternalLink,
} from 'lucide-react'
import { useTempo } from '@/lib/store'

interface Participant {
  employeeId?: string
  email: string
  name: string
  role: 'host' | 'co_host' | 'attendee' | 'interviewer'
}

interface MeetingSchedulerProps {
  open: boolean
  onClose: () => void
  onCreated?: (meeting: any) => void
  defaultProvider?: string
  defaultType?: string
  relatedEntityType?: string
  relatedEntityId?: string
  preSelectedParticipants?: Participant[]
}

const PROVIDER_OPTIONS = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'google_meet', label: 'Google Meet' },
  { value: 'microsoft_teams', label: 'Microsoft Teams' },
  { value: 'internal', label: 'No Video (In-Person)' },
]

const TYPE_OPTIONS = [
  { value: 'general', label: 'General Meeting' },
  { value: 'interview', label: 'Interview' },
  { value: 'one_on_one', label: '1:1 Meeting' },
  { value: 'team', label: 'Team Meeting' },
  { value: 'all_hands', label: 'All Hands' },
  { value: 'review', label: 'Performance Review' },
]

const ROLE_OPTIONS = [
  { value: 'attendee', label: 'Attendee' },
  { value: 'co_host', label: 'Co-Host' },
  { value: 'interviewer', label: 'Interviewer' },
]

export function MeetingScheduler({
  open,
  onClose,
  onCreated,
  defaultProvider = 'zoom',
  defaultType = 'general',
  relatedEntityType,
  relatedEntityId,
  preSelectedParticipants = [],
}: MeetingSchedulerProps) {
  const { employees, org, addToast, currentEmployeeId } = useTempo()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [provider, setProvider] = useState(defaultProvider)
  const [meetingType, setMeetingType] = useState(defaultType)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [participants, setParticipants] = useState<Participant[]>(preSelectedParticipants)
  const [participantSearch, setParticipantSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [createdMeeting, setCreatedMeeting] = useState<any>(null)

  const filteredEmployees = useMemo(() => {
    if (!participantSearch.trim()) return []
    const q = participantSearch.toLowerCase()
    const participantEmails = new Set(participants.map(p => p.email))
    return (employees || [])
      .filter((e: any) => {
        const name = (e.profile?.full_name || e.full_name || '').toLowerCase()
        const email = (e.profile?.email || e.email || '').toLowerCase()
        return (name.includes(q) || email.includes(q)) && !participantEmails.has(email)
      })
      .slice(0, 8)
  }, [participantSearch, employees, participants])

  function addParticipant(emp: any) {
    const email = emp.profile?.email || emp.email || ''
    const name = emp.profile?.full_name || emp.full_name || ''
    setParticipants(prev => [...prev, { employeeId: emp.id, email, name, role: 'attendee' }])
    setParticipantSearch('')
  }

  function removeParticipant(index: number) {
    setParticipants(prev => prev.filter((_, i) => i !== index))
  }

  function updateParticipantRole(index: number, role: string) {
    setParticipants(prev => prev.map((p, i) => i === index ? { ...p, role: role as Participant['role'] } : p))
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setProvider(defaultProvider)
    setMeetingType(defaultType)
    setDate('')
    setStartTime('09:00')
    setEndTime('10:00')
    setParticipants(preSelectedParticipants)
    setParticipantSearch('')
    setCreatedMeeting(null)
  }

  async function handleCreate() {
    if (!title.trim() || !date || !startTime || !endTime) {
      addToast?.('Please fill in all required fields', 'error')
      return
    }

    const startDateTime = new Date(`${date}T${startTime}:00`).toISOString()
    const endDateTime = new Date(`${date}T${endTime}:00`).toISOString()

    setSaving(true)
    try {
      const res = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-org-id': org.id },
        body: JSON.stringify({
          action: 'create',
          title: title.trim(),
          description: description.trim() || undefined,
          provider,
          startTime: startDateTime,
          endTime: endDateTime,
          meetingType,
          relatedEntityType,
          relatedEntityId,
          participants: participants.map(p => ({
            employeeId: p.employeeId,
            email: p.email,
            role: p.role,
          })),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to create meeting')
      }

      const { data } = await res.json()
      setCreatedMeeting(data)
      addToast?.('Meeting scheduled successfully', 'success')
      onCreated?.(data)
    } catch (err: any) {
      addToast?.(err.message || 'Failed to create meeting', 'error')
    } finally {
      setSaving(false)
    }
  }

  function handleClose() {
    resetForm()
    onClose()
  }

  // Success view after meeting creation
  if (createdMeeting) {
    return (
      <Modal open={open} onClose={handleClose} title="Meeting Scheduled" size="md">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
            <Check className="text-emerald-600 shrink-0" size={20} />
            <div>
              <p className="text-sm font-medium text-t1">{createdMeeting.title}</p>
              <p className="text-xs text-t3 mt-0.5">Meeting has been created and participants will be notified</p>
            </div>
          </div>

          {createdMeeting.meetingUrl && (
            <div className="p-3 bg-canvas rounded-lg border border-border">
              <label className="text-xs text-t3 font-medium">Meeting Link</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  readOnly
                  value={createdMeeting.meetingUrl}
                  className="flex-1 text-xs bg-transparent text-t1 outline-none font-mono"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(createdMeeting.meetingUrl); addToast?.('Link copied', 'success') }}
                  className="text-t3 hover:text-t1 p-1"
                >
                  <Link2 size={14} />
                </button>
                <a href={createdMeeting.meetingUrl} target="_blank" rel="noopener noreferrer" className="text-t3 hover:text-t1 p-1">
                  <ExternalLink size={14} />
                </a>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => { resetForm(); setCreatedMeeting(null) }}>
              Schedule Another
            </Button>
            <Button onClick={handleClose}>Done</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal open={open} onClose={handleClose} title="Schedule Meeting" size="lg">
      <div className="space-y-4">
        {/* Title */}
        <Input
          label="Meeting Title"
          placeholder="e.g., Weekly Team Standup"
          value={title}
          onChange={e => setTitle(e.target.value)}
        />

        {/* Provider & Type */}
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Video Provider"
            options={PROVIDER_OPTIONS}
            value={provider}
            onChange={e => setProvider(e.target.value)}
          />
          <Select
            label="Meeting Type"
            options={TYPE_OPTIONS}
            value={meetingType}
            onChange={e => setMeetingType(e.target.value)}
          />
        </div>

        {/* Date & Time */}
        <div className="grid grid-cols-3 gap-3">
          <Input
            label="Date"
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
          <Input
            label="Start Time"
            type="time"
            value={startTime}
            onChange={e => setStartTime(e.target.value)}
          />
          <Input
            label="End Time"
            type="time"
            value={endTime}
            onChange={e => setEndTime(e.target.value)}
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-t2 mb-1 block">Description (optional)</label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Meeting agenda or notes..."
            rows={2}
            className="w-full rounded-lg border border-border bg-canvas px-3 py-2 text-sm text-t1 placeholder:text-t4 focus:outline-none focus:ring-2 focus:ring-ring resize-none"
          />
        </div>

        {/* Participants */}
        <div>
          <label className="text-xs font-medium text-t2 mb-1 block">Participants</label>
          {/* Participant search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t4" />
            <input
              type="text"
              placeholder="Search employees to add..."
              value={participantSearch}
              onChange={e => setParticipantSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-canvas text-sm text-t1 placeholder:text-t4 focus:outline-none focus:ring-2 focus:ring-ring"
            />
            {filteredEmployees.length > 0 && (
              <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                {filteredEmployees.map((emp: any) => (
                  <button
                    key={emp.id}
                    onClick={() => addParticipant(emp)}
                    className="w-full px-3 py-2 text-left hover:bg-canvas flex items-center gap-2 text-sm"
                  >
                    <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                      {(emp.profile?.full_name || emp.full_name || '?')[0]}
                    </div>
                    <div className="min-w-0">
                      <span className="text-t1 truncate block">{emp.profile?.full_name || emp.full_name}</span>
                      <span className="text-t4 text-xs truncate block">{emp.profile?.email || emp.email}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Participant list */}
          {participants.length > 0 && (
            <div className="mt-2 space-y-1">
              {participants.map((p, i) => (
                <div key={`${p.email}-${i}`} className="flex items-center gap-2 px-3 py-1.5 bg-canvas rounded-lg border border-border">
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-medium text-accent shrink-0">
                    {p.name[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs text-t1 truncate block">{p.name}</span>
                    <span className="text-[10px] text-t4 truncate block">{p.email}</span>
                  </div>
                  <select
                    value={p.role}
                    onChange={e => updateParticipantRole(i, e.target.value)}
                    className="text-[10px] bg-transparent border border-border rounded px-1 py-0.5 text-t2"
                  >
                    {ROLE_OPTIONS.map(o => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  <button onClick={() => removeParticipant(i)} className="text-t4 hover:text-red-500 p-0.5">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
          {participants.length === 0 && (
            <p className="text-xs text-t4 mt-1">No participants added yet. Search above to add team members.</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2 border-t border-divider">
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} disabled={saving || !title.trim() || !date}>
            {saving ? (
              <span className="flex items-center gap-2"><Loader2 size={14} className="animate-spin" /> Scheduling...</span>
            ) : (
              <span className="flex items-center gap-2"><Video size={14} /> Schedule Meeting</span>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
