'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Clock, Calendar, Plus, CheckCircle, LogIn } from 'lucide-react'
import { useTempo } from '@/lib/store'

export default function TimeAttendancePage() {
  const {
    leaveRequests, employees,
    addLeaveRequest, updateLeaveRequest,
    getEmployeeName,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('leave')

  // Leave request modal
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveForm, setLeaveForm] = useState({
    employee_id: '',
    type: 'annual' as string,
    start_date: '',
    end_date: '',
    days: 1,
    reason: '',
  })

  // Clock-in state
  const [clockedIn, setClockedIn] = useState(false)
  const [clockInTime, setClockInTime] = useState<string | null>(null)

  const pendingRequests = leaveRequests.filter(l => l.status === 'pending')
  const approvedRequests = leaveRequests.filter(l => l.status === 'approved')
  const today = new Date().toISOString().split('T')[0]
  const onLeaveToday = leaveRequests.filter(
    l => l.status === 'approved' && l.start_date <= today && l.end_date >= today
  ).length

  const tabs = [
    { id: 'leave', label: 'Leave Requests', count: pendingRequests.length },
    { id: 'timesheet', label: 'Timesheets' },
    { id: 'holidays', label: 'Holiday Calendar' },
  ]

  // ---- Leave Request CRUD ----
  function openNewLeaveRequest() {
    setLeaveForm({
      employee_id: employees[0]?.id || '',
      type: 'annual',
      start_date: '',
      end_date: '',
      days: 1,
      reason: '',
    })
    setShowLeaveModal(true)
  }

  function submitLeaveRequest() {
    if (!leaveForm.employee_id || !leaveForm.start_date || !leaveForm.end_date) return
    addLeaveRequest({
      employee_id: leaveForm.employee_id,
      type: leaveForm.type,
      start_date: leaveForm.start_date,
      end_date: leaveForm.end_date,
      days: Number(leaveForm.days) || 1,
      reason: leaveForm.reason,
      status: 'pending',
    })
    setShowLeaveModal(false)
  }

  function approveLeave(id: string) {
    updateLeaveRequest(id, { status: 'approved', approved_by: 'emp-17', approved_at: new Date().toISOString() })
  }

  function denyLeave(id: string) {
    updateLeaveRequest(id, { status: 'rejected', approved_by: 'emp-17', approved_at: new Date().toISOString() })
  }

  // ---- Clock In/Out ----
  function handleClockIn() {
    if (clockedIn) {
      setClockedIn(false)
      setClockInTime(null)
    } else {
      setClockedIn(true)
      setClockInTime(new Date().toLocaleTimeString())
    }
  }

  return (
    <>
      <Header
        title="Time & Attendance"
        subtitle="Leave management, timesheets, and scheduling"
        actions={
          <Button size="sm" onClick={openNewLeaveRequest}>
            <Plus size={14} /> Request Leave
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Requests" value={pendingRequests.length} change="Awaiting approval" changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label="Approved" value={approvedRequests.length} change="This quarter" changeType="positive" icon={<CheckCircle size={20} />} />
        <StatCard label="On Leave Today" value={onLeaveToday} change="Across all regions" changeType="neutral" icon={<Calendar size={20} />} />
        <StatCard label="Avg Leave Balance" value="14.5" change="Days remaining" changeType="neutral" />
      </div>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Leave Requests Tab */}
      {activeTab === 'leave' && (
        <Card padding="none">
          <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Employee</th>
                  <th className="tempo-th text-left px-4 py-3">Type</th>
                  <th className="tempo-th text-left px-4 py-3">Dates</th>
                  <th className="tempo-th text-right px-4 py-3">Days</th>
                  <th className="tempo-th text-left px-4 py-3">Reason</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">
                      No leave requests yet. Click &quot;Request Leave&quot; to create one.
                    </td>
                  </tr>
                )}
                {leaveRequests.map(lr => {
                  const emp = employees.find(e => e.id === lr.employee_id)
                  return (
                    <tr key={lr.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={getEmployeeName(lr.employee_id)} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{getEmployeeName(lr.employee_id)}</p>
                            <p className="text-xs text-t3">{emp?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          lr.type === 'sick' ? 'error' :
                          lr.type === 'maternity' ? 'info' :
                          lr.type === 'annual' ? 'success' : 'default'
                        }>
                          {lr.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{lr.start_date} to {lr.end_date}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{lr.days}</td>
                      <td className="px-4 py-3 text-sm text-t2 max-w-[200px] truncate">{lr.reason}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          lr.status === 'approved' ? 'success' :
                          lr.status === 'pending' ? 'warning' : 'error'
                        }>
                          {lr.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lr.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="primary" onClick={() => approveLeave(lr.id)}>Approve</Button>
                            <Button size="sm" variant="ghost" onClick={() => denyLeave(lr.id)}>Deny</Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Timesheets Tab */}
      {activeTab === 'timesheet' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Weekly Timesheet</h3>
          <div className="bg-canvas rounded-lg p-6 text-center">
            <Clock size={32} className="text-t3 mx-auto mb-2" />
            {clockedIn ? (
              <>
                <p className="text-sm text-t1 font-medium mb-1">You are clocked in</p>
                <p className="text-xs text-t3 mb-4">Since {clockInTime}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-t2 mb-2">Timesheet tracking for the current week</p>
                <p className="text-xs text-t3 mb-4">Employees can clock in/out and log hours against projects</p>
              </>
            )}
            <Button onClick={handleClockIn}>
              <LogIn size={14} /> {clockedIn ? 'Clock Out' : 'Clock In'}
            </Button>
          </div>

          {/* Weekly overview */}
          <div className="mt-6">
            <h4 className="text-xs font-medium text-t3 mb-3 uppercase tracking-wide">This Week</h4>
            <div className="grid grid-cols-5 gap-2">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                <div key={day} className="bg-canvas rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-t3 mb-1">{day}</p>
                  <p className="text-lg font-semibold text-t1">{i < 3 ? '8h' : i === 3 ? '6h' : '-'}</p>
                  {i < 3 && <p className="text-[0.6rem] text-success">Complete</p>}
                  {i === 3 && <p className="text-[0.6rem] text-warning">Partial</p>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Holiday Calendar Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Public Holidays 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { date: 'Jan 1', name: 'New Year', countries: ['All'] },
              { date: 'Mar 30', name: 'Eid al-Fitr', countries: ['Nigeria', 'Senegal', 'Mali'] },
              { date: 'Apr 3', name: 'Good Friday', countries: ['All'] },
              { date: 'Apr 6', name: 'Easter Monday', countries: ['All'] },
              { date: 'May 1', name: 'Labour Day', countries: ['All'] },
              { date: 'May 25', name: 'Africa Day', countries: ['All'] },
              { date: 'Jun 6', name: 'Eid al-Adha', countries: ['Nigeria', 'Senegal', 'Mali'] },
              { date: 'Jun 12', name: 'Democracy Day', countries: ['Nigeria'] },
              { date: 'Aug 7', name: "Independence Day", countries: ["Cote d'Ivoire"] },
              { date: 'Oct 1', name: 'Independence Day', countries: ['Nigeria'] },
              { date: 'Nov 4', name: "Independence Day", countries: ['Ghana'] },
              { date: 'Dec 25', name: 'Christmas Day', countries: ['All'] },
              { date: 'Dec 26', name: 'Boxing Day', countries: ['Nigeria', 'Ghana', 'Kenya'] },
            ].map(h => (
              <div key={h.date + h.name} className="flex items-center gap-3 bg-canvas rounded-lg px-4 py-3">
                <div className="w-12 h-12 rounded-lg bg-tempo-50 flex flex-col items-center justify-center text-tempo-600">
                  <span className="text-[0.6rem] font-semibold uppercase">{h.date.split(' ')[0]}</span>
                  <span className="text-sm font-bold">{h.date.split(' ')[1]}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{h.name}</p>
                  <p className="text-xs text-t3">{h.countries.join(', ')}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* ---- MODALS ---- */}

      {/* Request Leave Modal */}
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title="Request Leave">
        <div className="space-y-4">
          <Select
            label="Employee"
            value={leaveForm.employee_id}
            onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
          />
          <Select
            label="Leave Type"
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            options={[
              { value: 'annual', label: 'Annual Leave' },
              { value: 'sick', label: 'Sick Leave' },
              { value: 'personal', label: 'Personal Leave' },
              { value: 'maternity', label: 'Maternity Leave' },
              { value: 'paternity', label: 'Paternity Leave' },
              { value: 'compassionate', label: 'Compassionate Leave' },
              { value: 'unpaid', label: 'Unpaid Leave' },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
            />
          </div>
          <Input
            label="Number of Days"
            type="number"
            min={1}
            max={60}
            value={leaveForm.days}
            onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
          />
          <Textarea
            label="Reason"
            placeholder="Explain the reason for your leave request..."
            rows={3}
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>Cancel</Button>
            <Button onClick={submitLeaveRequest}>Submit Request</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
