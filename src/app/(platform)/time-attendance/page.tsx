'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Clock, Calendar, Plus, CheckCircle } from 'lucide-react'
import { demoLeaveRequests, demoEmployees } from '@/lib/demo-data'

export default function TimeAttendancePage() {
  const [activeTab, setActiveTab] = useState('leave')
  const tabs = [
    { id: 'leave', label: 'Leave Requests', count: demoLeaveRequests.filter(l => l.status === 'pending').length },
    { id: 'timesheet', label: 'Timesheets' },
    { id: 'holidays', label: 'Holiday Calendar' },
  ]

  const pendingCount = demoLeaveRequests.filter(l => l.status === 'pending').length
  const approvedCount = demoLeaveRequests.filter(l => l.status === 'approved').length

  return (
    <>
      <Header title="Time & Attendance" subtitle="Leave management, timesheets, and scheduling" actions={<Button size="sm"><Plus size={14} /> Request Leave</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Requests" value={pendingCount} change="Awaiting approval" changeType="neutral" icon={<Clock size={20} />} />
        <StatCard label="Approved" value={approvedCount} change="This quarter" changeType="positive" icon={<CheckCircle size={20} />} />
        <StatCard label="On Leave Today" value={1} change="Across all regions" changeType="neutral" icon={<Calendar size={20} />} />
        <StatCard label="Avg Leave Balance" value="14.5" change="Days remaining" changeType="neutral" />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

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
                {demoLeaveRequests.map(lr => {
                  const emp = demoEmployees.find(e => e.id === lr.employee_id)
                  return (
                    <tr key={lr.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-t1">{emp?.profile?.full_name}</p>
                            <p className="text-xs text-t3">{emp?.job_title}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={lr.type === 'sick' ? 'error' : lr.type === 'maternity' ? 'info' : 'default'}>
                          {lr.type}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{lr.start_date} to {lr.end_date}</td>
                      <td className="px-4 py-3 text-sm text-t1 text-right font-medium">{lr.days}</td>
                      <td className="px-4 py-3 text-sm text-t2 max-w-[200px] truncate">{lr.reason}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={lr.status === 'approved' ? 'success' : lr.status === 'pending' ? 'warning' : 'error'}>
                          {lr.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {lr.status === 'pending' && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="primary">Approve</Button>
                            <Button size="sm" variant="ghost">Deny</Button>
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

      {activeTab === 'timesheet' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Weekly Timesheet</h3>
          <div className="bg-canvas rounded-lg p-6 text-center">
            <Clock size={32} className="text-t3 mx-auto mb-2" />
            <p className="text-sm text-t2 mb-2">Timesheet tracking for the current week</p>
            <p className="text-xs text-t3 mb-4">Employees can clock in/out and log hours against projects</p>
            <Button>Clock In</Button>
          </div>
        </Card>
      )}

      {activeTab === 'holidays' && (
        <Card>
          <h3 className="text-sm font-semibold text-t1 mb-4">Public Holidays 2026</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { date: 'Jan 1', name: 'New Year', countries: ['All'] },
              { date: 'Mar 30', name: 'Eid al-Fitr', countries: ['Nigeria', 'Senegal'] },
              { date: 'Apr 3', name: 'Good Friday', countries: ['All'] },
              { date: 'May 1', name: 'Labour Day', countries: ['All'] },
              { date: 'Jun 6', name: 'Eid al-Adha', countries: ['Nigeria', 'Senegal'] },
              { date: 'Jun 1', name: 'Madaraka Day', countries: ['Kenya'] },
              { date: 'Aug 7', name: "Independence Day", countries: ["Cote d'Ivoire"] },
              { date: 'Oct 1', name: 'Independence Day', countries: ['Nigeria'] },
              { date: 'Dec 25', name: 'Christmas Day', countries: ['All'] },
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
    </>
  )
}
