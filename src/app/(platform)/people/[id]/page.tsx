'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Pencil, ArrowLeft, Mail, Phone, MapPin, Building2, Briefcase } from 'lucide-react'
import { useTempo } from '@/lib/store'
import Link from 'next/link'

export default function EmployeeDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const {
    employees, departments, goals, reviews, enrollments, courses,
    leaveRequests, devices, expenseReports, feedback,
    updateEmployee, getDepartmentName, getEmployeeName,
  } = useTempo()

  const emp = employees.find(e => e.id === id)
  const [activeTab, setActiveTab] = useState('overview')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editForm, setEditForm] = useState({
    full_name: '', email: '', phone: '', job_title: '', level: '',
    department_id: '', country: '', role: '',
  })

  if (!emp) {
    return (
      <div className="text-center py-20">
        <p className="text-t3 mb-4">Employee not found</p>
        <Link href="/people"><Button variant="secondary">Back to People</Button></Link>
      </div>
    )
  }

  const empGoals = goals.filter(g => g.employee_id === id)
  const empReviews = reviews.filter(r => r.employee_id === id)
  const empEnrollments = enrollments.filter(e => e.employee_id === id)
  const empLeave = leaveRequests.filter(lr => lr.employee_id === id)
  const empDevices = devices.filter(d => d.assigned_to === id)
  const empExpenses = expenseReports.filter(e => e.employee_id === id)
  const empFeedback = feedback.filter(f => f.to_id === id)

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'performance', label: 'Performance', count: empGoals.length },
    { id: 'learning', label: 'Learning', count: empEnrollments.length },
    { id: 'time', label: 'Time Off', count: empLeave.length },
    { id: 'devices', label: 'Devices', count: empDevices.length },
    { id: 'expenses', label: 'Expenses', count: empExpenses.length },
  ]

  function openEdit() {
    if (!emp) return
    setEditForm({
      full_name: emp.profile?.full_name || '',
      email: emp.profile?.email || '',
      phone: emp.profile?.phone || '',
      job_title: emp.job_title,
      level: emp.level,
      department_id: emp.department_id,
      country: emp.country,
      role: emp.role,
    })
    setShowEditModal(true)
  }

  function submitEdit() {
    if (!emp) return
    updateEmployee(id, {
      job_title: editForm.job_title,
      level: editForm.level,
      department_id: editForm.department_id,
      country: editForm.country,
      role: editForm.role,
      profile: { ...emp.profile, full_name: editForm.full_name, email: editForm.email, phone: editForm.phone },
    })
    setShowEditModal(false)
  }

  return (
    <>
      {/* Back + Header */}
      <div className="mb-4">
        <button onClick={() => router.push('/people')} className="flex items-center gap-1 text-xs text-t3 hover:text-t1 transition-colors">
          <ArrowLeft size={14} /> Back to People
        </button>
      </div>

      <div className="flex flex-col md:flex-row gap-6 mb-6">
        {/* Profile Card */}
        <Card className="md:w-80 flex-shrink-0">
          <div className="flex flex-col items-center text-center">
            <Avatar name={emp.profile?.full_name || ''} size="lg" />
            <h2 className="text-lg font-semibold text-t1 mt-3">{emp.profile?.full_name}</h2>
            <p className="text-sm text-t2">{emp.job_title}</p>
            <Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'} className="mt-2">{emp.role}</Badge>
            <Button size="sm" variant="secondary" className="mt-4" onClick={openEdit}><Pencil size={14} /> Edit Profile</Button>
          </div>
          <div className="mt-6 space-y-3 border-t border-divider pt-4">
            <div className="flex items-center gap-3 text-sm">
              <Mail size={14} className="text-t3" />
              <span className="text-t2">{emp.profile?.email}</span>
            </div>
            {emp.profile?.phone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone size={14} className="text-t3" />
                <span className="text-t2">{emp.profile.phone}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={14} className="text-t3" />
              <span className="text-t2">{emp.country}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Building2 size={14} className="text-t3" />
              <span className="text-t2">{getDepartmentName(emp.department_id)}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Briefcase size={14} className="text-t3" />
              <span className="text-t2">{emp.level}</span>
            </div>
          </div>
        </Card>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-4" />

          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Goals</h3>
                {empGoals.length > 0 ? empGoals.map(g => (
                  <div key={g.id} className="flex items-center gap-3 mb-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-t1">{g.title}</p>
                      <Progress value={g.progress} showLabel className="mt-1" />
                    </div>
                    <Badge variant={g.status === 'on_track' ? 'success' : g.status === 'at_risk' ? 'warning' : 'error'} />
                  </div>
                )) : <p className="text-xs text-t3">No goals assigned</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Reviews</h3>
                {empReviews.length > 0 ? empReviews.map(r => (
                  <div key={r.id} className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs font-medium text-t1">{r.type} review</p>
                      <p className="text-[0.65rem] text-t3">by {getEmployeeName(r.reviewer_id)}</p>
                    </div>
                    <div className="text-right">
                      {r.overall_rating && <span className="tempo-stat text-tempo-600">{r.overall_rating}/5</span>}
                      <Badge variant={r.status === 'submitted' ? 'success' : 'warning'} className="ml-2">{r.status.replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                )) : <p className="text-xs text-t3">No reviews yet</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Feedback Received</h3>
                {empFeedback.length > 0 ? empFeedback.slice(0, 3).map(f => (
                  <div key={f.id} className="mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-t1">{getEmployeeName(f.from_id)}</span>
                      <Badge variant={f.type === 'recognition' ? 'success' : 'info'}>{f.type}</Badge>
                    </div>
                    <p className="text-xs text-t2 mt-1 line-clamp-2">{f.content}</p>
                  </div>
                )) : <p className="text-xs text-t3">No feedback received</p>}
              </Card>
              <Card>
                <h3 className="text-sm font-semibold text-t1 mb-3">Devices</h3>
                {empDevices.length > 0 ? empDevices.map(d => (
                  <div key={d.id} className="flex items-center justify-between mb-2">
                    <span className="text-xs text-t1">{d.brand} {d.model}</span>
                    <Badge>{d.type}</Badge>
                  </div>
                )) : <p className="text-xs text-t3">No devices assigned</p>}
              </Card>
            </div>
          )}

          {activeTab === 'performance' && (
            <Card padding="none">
              <CardHeader><CardTitle>Goals</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empGoals.map(g => (
                  <div key={g.id} className="px-6 py-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium text-t1">{g.title}</p>
                      <Badge variant={g.status === 'on_track' ? 'success' : g.status === 'at_risk' ? 'warning' : 'error'}>{g.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    {g.description && <p className="text-xs text-t2 mb-2">{g.description}</p>}
                    <Progress value={g.progress} showLabel />
                    <p className="text-xs text-t3 mt-1">Due: {g.due_date}</p>
                  </div>
                ))}
                {empGoals.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">No goals</div>}
              </div>
            </Card>
          )}

          {activeTab === 'learning' && (
            <Card padding="none">
              <CardHeader><CardTitle>Course Enrollments</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empEnrollments.map(e => {
                  const course = courses.find(c => c.id === e.course_id)
                  return (
                    <div key={e.id} className="px-6 py-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-t1">{course?.title}</p>
                        <Badge variant={e.status === 'completed' ? 'success' : e.status === 'in_progress' ? 'warning' : 'default'}>{e.status.replace(/_/g, ' ')}</Badge>
                      </div>
                      <Progress value={e.progress} showLabel />
                    </div>
                  )
                })}
                {empEnrollments.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">No enrollments</div>}
              </div>
            </Card>
          )}

          {activeTab === 'time' && (
            <Card padding="none">
              <CardHeader><CardTitle>Leave Requests</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empLeave.map(lr => (
                  <div key={lr.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{lr.type} leave</p>
                      <p className="text-xs text-t3">{lr.start_date} to {lr.end_date} ({lr.days} days)</p>
                      {lr.reason && <p className="text-xs text-t2 mt-1">{lr.reason}</p>}
                    </div>
                    <Badge variant={lr.status === 'approved' ? 'success' : lr.status === 'pending' ? 'warning' : 'error'}>{lr.status}</Badge>
                  </div>
                ))}
                {empLeave.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">No leave requests</div>}
              </div>
            </Card>
          )}

          {activeTab === 'devices' && (
            <Card padding="none">
              <CardHeader><CardTitle>Assigned Devices</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empDevices.map(d => (
                  <div key={d.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{d.brand} {d.model}</p>
                      <p className="text-xs text-t3">S/N: {d.serial_number}</p>
                    </div>
                    <Badge>{d.type}</Badge>
                  </div>
                ))}
                {empDevices.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">No devices</div>}
              </div>
            </Card>
          )}

          {activeTab === 'expenses' && (
            <Card padding="none">
              <CardHeader><CardTitle>Expense Reports</CardTitle></CardHeader>
              <div className="divide-y divide-divider">
                {empExpenses.map(e => (
                  <div key={e.id} className="px-6 py-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-t1">{e.title}</p>
                      <p className="text-xs text-t3">${e.total_amount.toLocaleString()} {e.currency}</p>
                    </div>
                    <Badge variant={e.status === 'approved' || e.status === 'reimbursed' ? 'success' : e.status === 'submitted' || e.status === 'pending_approval' ? 'warning' : 'default'}>{e.status.replace(/_/g, ' ')}</Badge>
                  </div>
                ))}
                {empExpenses.length === 0 && <div className="px-6 py-8 text-center text-xs text-t3">No expense reports</div>}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Edit Profile Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Profile" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Full Name" value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })} />
            <Input label="Email" type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Job Title" value={editForm.job_title} onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })} />
            <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Select label="Department" value={editForm.department_id} onChange={(e) => setEditForm({ ...editForm, department_id: e.target.value })} options={departments.map(d => ({ value: d.id, label: d.name }))} />
            <Select label="Level" value={editForm.level} onChange={(e) => setEditForm({ ...editForm, level: e.target.value })} options={[
              { value: 'Junior', label: 'Junior' }, { value: 'Associate', label: 'Associate' },
              { value: 'Mid', label: 'Mid' }, { value: 'Senior', label: 'Senior' },
              { value: 'Manager', label: 'Manager' }, { value: 'Director', label: 'Director' },
              { value: 'Executive', label: 'Executive' },
            ]} />
            <Select label="Country" value={editForm.country} onChange={(e) => setEditForm({ ...editForm, country: e.target.value })} options={[
              { value: 'Nigeria', label: 'Nigeria' }, { value: 'Ghana', label: 'Ghana' },
              { value: "Cote d'Ivoire", label: "Cote d'Ivoire" }, { value: 'Kenya', label: 'Kenya' },
              { value: 'Senegal', label: 'Senegal' },
            ]} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowEditModal(false)}>Cancel</Button>
            <Button onClick={submitEdit}>Save Changes</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
