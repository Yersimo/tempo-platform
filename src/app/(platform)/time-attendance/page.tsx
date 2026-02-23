'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
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
import { AIAlertBanner, AIInsightCard } from '@/components/ai'
import { detectCoverageGaps, analyzeLeavePatterns } from '@/lib/ai-engine'

export default function TimeAttendancePage() {
  const t = useTranslations('timeAttendance')
  const tc = useTranslations('common')
  const {
    leaveRequests, employees,
    addLeaveRequest, updateLeaveRequest,
    getEmployeeName, currentEmployeeId,
  } = useTempo()

  const coverageInsights = useMemo(() => detectCoverageGaps(leaveRequests, employees), [leaveRequests, employees])
  const leaveInsights = useMemo(() => analyzeLeavePatterns(leaveRequests), [leaveRequests])

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
    { id: 'leave', label: t('tabLeaveRequests'), count: pendingRequests.length },
    { id: 'timesheet', label: t('tabTimesheets') },
    { id: 'holidays', label: t('tabHolidayCalendar') },
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
    updateLeaveRequest(id, { status: 'approved', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
  }

  function denyLeave(id: string) {
    updateLeaveRequest(id, { status: 'rejected', approved_by: currentEmployeeId, approved_at: new Date().toISOString() })
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
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <Button size="sm" onClick={openNewLeaveRequest}>
            <Plus size={14} /> {t('requestLeave')}
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('pendingRequests')} value={pendingRequests.length} change="Awaiting approval" changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label={t('approvedLabel')} value={approvedRequests.length} change={tc('thisQuarter')} changeType="positive" icon={<CheckCircle size={20} />} />
        <StatCard label={t('onLeaveToday')} value={onLeaveToday} change={t('acrossAllRegions')} changeType="neutral" icon={<Calendar size={20} />} />
        <StatCard label={t('avgLeaveBalance')} value="14.5" change={t('daysRemaining')} changeType="neutral" />
      </div>

      {/* AI Insights */}
      <AIAlertBanner insights={coverageInsights} className="mb-4" />
      {leaveInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {leaveInsights.map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Leave Requests Tab */}
      {activeTab === 'leave' && (
        <Card padding="none">
          <CardHeader><CardTitle>{t('leaveRequestsTitle')}</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableEmployee')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableDates')}</th>
                  <th className="tempo-th text-right px-4 py-3">{t('tableDays')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableReason')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                  <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {leaveRequests.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-sm text-t3">
                      {t('noLeaveRequests')}
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
                      <td className="px-4 py-3 text-sm text-t2">{lr.start_date} {tc('to')} {lr.end_date}</td>
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
                            <Button size="sm" variant="primary" onClick={() => approveLeave(lr.id)}>{tc('approve')}</Button>
                            <Button size="sm" variant="ghost" onClick={() => denyLeave(lr.id)}>{tc('deny')}</Button>
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
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('weeklyTimesheet')}</h3>
          <div className="bg-canvas rounded-lg p-6 text-center">
            <Clock size={32} className="text-t3 mx-auto mb-2" />
            {clockedIn ? (
              <>
                <p className="text-sm text-t1 font-medium mb-1">{t('clockedIn')}</p>
                <p className="text-xs text-t3 mb-4">{t('clockedInSince', { time: clockInTime ?? '' })}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-t2 mb-2">{t('timesheetDesc')}</p>
                <p className="text-xs text-t3 mb-4">{t('timesheetSubDesc')}</p>
              </>
            )}
            <Button onClick={handleClockIn}>
              <LogIn size={14} /> {clockedIn ? t('clockOut') : t('clockIn')}
            </Button>
          </div>

          {/* Weekly overview */}
          <div className="mt-6">
            <h4 className="text-xs font-medium text-t3 mb-3 uppercase tracking-wide">{t('thisWeek')}</h4>
            <div className="grid grid-cols-5 gap-2">
              {[t('weekdayMon'), t('weekdayTue'), t('weekdayWed'), t('weekdayThu'), t('weekdayFri')].map((day, i) => (
                <div key={day} className="bg-canvas rounded-lg p-3 text-center">
                  <p className="text-xs font-medium text-t3 mb-1">{day}</p>
                  <p className="text-lg font-semibold text-t1">{i < 3 ? '8h' : i === 3 ? '6h' : '-'}</p>
                  {i < 3 && <p className="text-[0.6rem] text-success">{t('statusComplete')}</p>}
                  {i === 3 && <p className="text-[0.6rem] text-warning">{t('statusPartial')}</p>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Holiday Calendar Tab */}
      {activeTab === 'holidays' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">{t('publicHolidays')}</h3>
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
      <Modal open={showLeaveModal} onClose={() => setShowLeaveModal(false)} title={t('requestLeaveModal')}>
        <div className="space-y-4">
          <Select
            label={tc('employee')}
            value={leaveForm.employee_id}
            onChange={(e) => setLeaveForm({ ...leaveForm, employee_id: e.target.value })}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
          />
          <Select
            label={t('leaveType')}
            value={leaveForm.type}
            onChange={(e) => setLeaveForm({ ...leaveForm, type: e.target.value })}
            options={[
              { value: 'annual', label: t('leaveAnnual') },
              { value: 'sick', label: t('leaveSick') },
              { value: 'personal', label: t('leavePersonal') },
              { value: 'maternity', label: t('leaveMaternity') },
              { value: 'paternity', label: t('leavePaternity') },
              { value: 'compassionate', label: t('leaveCompassionate') },
              { value: 'unpaid', label: t('leaveUnpaid') },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('startDate')}
              type="date"
              value={leaveForm.start_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, start_date: e.target.value })}
            />
            <Input
              label={t('endDate')}
              type="date"
              value={leaveForm.end_date}
              onChange={(e) => setLeaveForm({ ...leaveForm, end_date: e.target.value })}
            />
          </div>
          <Input
            label={t('numberOfDays')}
            type="number"
            min={1}
            max={60}
            value={leaveForm.days}
            onChange={(e) => setLeaveForm({ ...leaveForm, days: Number(e.target.value) })}
          />
          <Textarea
            label={t('reason')}
            placeholder={t('reasonPlaceholder')}
            rows={3}
            value={leaveForm.reason}
            onChange={(e) => setLeaveForm({ ...leaveForm, reason: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowLeaveModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitLeaveRequest}>{t('submitRequest')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
