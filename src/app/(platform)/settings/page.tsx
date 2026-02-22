'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Building, Users, Shield, Bell, Palette, Globe, Search, Clock } from 'lucide-react'
import { useTempo } from '@/lib/store'

export default function SettingsPage() {
  const { org, employees, departments, auditLog, updateOrg, addDepartment, getEmployeeName, getDepartmentName } = useTempo()
  const [activeTab, setActiveTab] = useState('general')
  const [showOrgModal, setShowOrgModal] = useState(false)
  const [showDeptModal, setShowDeptModal] = useState(false)
  const [orgForm, setOrgForm] = useState({ name: org.name, industry: org.industry, size: org.size, country: org.country })
  const [deptForm, setDeptForm] = useState({ name: '', parent_id: null as string | null, head_id: '' })
  const [auditSearch, setAuditSearch] = useState('')

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'team', label: 'Team', count: employees.length },
    { id: 'departments', label: 'Departments', count: departments.length },
    { id: 'audit', label: 'Audit Log', count: auditLog.length },
    { id: 'security', label: 'Security' },
  ]

  const admins = employees.filter(e => e.role === 'admin' || e.role === 'owner')
  const managers = employees.filter(e => e.role === 'manager')
  const regularEmployees = employees.filter(e => e.role === 'employee')

  const filteredAudit = auditLog.filter(entry =>
    !auditSearch ||
    entry.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    entry.entity_type.toLowerCase().includes(auditSearch.toLowerCase())
  )

  function submitOrg() {
    updateOrg(orgForm)
    setShowOrgModal(false)
  }

  function submitDept() {
    if (!deptForm.name) return
    addDepartment({ name: deptForm.name, parent_id: deptForm.parent_id, head_id: deptForm.head_id || null })
    setShowDeptModal(false)
    setDeptForm({ name: '', parent_id: null, head_id: '' })
  }

  return (
    <>
      <Header title="Settings" subtitle="Organization settings and configuration" />

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'general' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Building size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">Organization</h3>
                <p className="text-xs text-t3">Manage company details</p>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Company Name</span><span className="text-sm font-medium text-t1">{org.name}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Industry</span><span className="text-sm text-t1">{org.industry}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Plan</span><Badge variant="orange">{org.plan}</Badge></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Size</span><span className="text-sm text-t1">{org.size}</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Country</span><span className="text-sm text-t1">{org.country}</span></div>
            </div>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => { setOrgForm({ name: org.name, industry: org.industry, size: org.size, country: org.country }); setShowOrgModal(true) }}>Edit Organization</Button>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Globe size={20} /></div>
              <div>
                <h3 className="text-sm font-semibold text-t1">Regions & Countries</h3>
                <p className="text-xs text-t3">Multi-country configuration</p>
              </div>
            </div>
            <div className="space-y-2">
              {[{ region: 'UEMOA', countries: 8 }, { region: 'CESA', countries: 10 }, { region: 'AWA', countries: 7 }, { region: 'Nigeria', countries: 1 }].map(item => (
                <div key={item.region} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <div><p className="text-xs font-medium text-t1">{item.region}</p><p className="text-[0.6rem] text-t3">{item.countries} countries</p></div>
                  <Badge variant="success">Active</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Bell size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">Notifications</h3><p className="text-xs text-t3">Email and in-app preferences</p></div>
            </div>
            <div className="space-y-2">
              {['Leave Approvals', 'Expense Submissions', 'Performance Reviews', 'Payroll Processing', 'IT Requests'].map(item => (
                <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                  <span className="text-xs text-t1">{item}</span><Badge variant="info">Email + Push</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Palette size={20} /></div>
              <div><h3 className="text-sm font-semibold text-t1">Branding</h3><p className="text-xs text-t3">Customize appearance</p></div>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Primary Color</span><div className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-tempo-600" /><span className="text-xs text-t1 font-mono">#ea580c</span></div></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Logo</span><span className="text-xs text-t1">Tempo Rising T</span></div>
              <div className="flex justify-between items-center"><span className="text-xs text-t2">Theme</span><Badge>Light</Badge></div>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'team' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Team Members ({employees.length})</CardTitle>
              <div className="flex gap-2">
                <Badge variant="orange">{admins.length} admins</Badge>
                <Badge variant="info">{managers.length} managers</Badge>
                <Badge>{regularEmployees.length} employees</Badge>
              </div>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead><tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Member</th>
                <th className="tempo-th text-left px-4 py-3">Department</th>
                <th className="tempo-th text-left px-4 py-3">Title</th>
                <th className="tempo-th text-left px-4 py-3">Role</th>
              </tr></thead>
              <tbody className="divide-y divide-border">
                {employees.map(emp => (
                  <tr key={emp.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3"><div className="flex items-center gap-3"><Avatar name={emp.profile?.full_name || ''} size="sm" /><div><p className="text-sm font-medium text-t1">{emp.profile?.full_name}</p><p className="text-xs text-t3">{emp.profile?.email}</p></div></div></td>
                    <td className="px-4 py-3 text-sm text-t2">{getDepartmentName(emp.department_id)}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp.job_title}</td>
                    <td className="px-4 py-3"><Badge variant={emp.role === 'admin' || emp.role === 'owner' ? 'orange' : emp.role === 'manager' ? 'info' : 'default'}>{emp.role}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {activeTab === 'departments' && (
        <div>
          <div className="flex justify-end mb-4">
            <Button size="sm" onClick={() => setShowDeptModal(true)}>Add Department</Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const empCount = employees.filter(e => e.department_id === dept.id).length
              const head = dept.head_id ? getEmployeeName(dept.head_id) : 'Unassigned'
              return (
                <Card key={dept.id}>
                  <h3 className="text-sm font-semibold text-t1 mb-1">{dept.name}</h3>
                  <p className="text-xs text-t3 mb-3">Head: {head}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-t2">{empCount} employees</span>
                    <Badge variant="success">Active</Badge>
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div>
          <div className="relative mb-4 max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-t3" />
            <input type="text" placeholder="Search audit log..." className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-divider rounded-lg text-t1 placeholder:text-t3 focus:outline-none focus:ring-2 focus:ring-tempo-600/20" value={auditSearch} onChange={(e) => setAuditSearch(e.target.value)} />
          </div>
          <Card padding="none">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Timestamp</th>
                  <th className="tempo-th text-left px-4 py-3">User</th>
                  <th className="tempo-th text-left px-4 py-3">Action</th>
                  <th className="tempo-th text-left px-4 py-3">Entity</th>
                  <th className="tempo-th text-left px-4 py-3">Details</th>
                </tr></thead>
                <tbody className="divide-y divide-border">
                  {filteredAudit.length > 0 ? filteredAudit.slice(0, 50).map(entry => (
                    <tr key={entry.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3 text-xs text-t3 whitespace-nowrap">
                        <div className="flex items-center gap-1"><Clock size={12} />{new Date(entry.timestamp).toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-t1">{entry.user}</td>
                      <td className="px-4 py-3">
                        <Badge variant={entry.action === 'create' ? 'success' : entry.action === 'update' ? 'info' : 'error'}>{entry.action}</Badge>
                      </td>
                      <td className="px-4 py-3 text-xs text-t2">{entry.entity_type}</td>
                      <td className="px-4 py-3 text-xs text-t2 max-w-[300px] truncate">{entry.details}</td>
                    </tr>
                  )) : (
                    <tr><td colSpan={5} className="px-6 py-12 text-center text-sm text-t3">
                      {auditLog.length === 0 ? 'No audit entries yet. Actions will be logged as you use the platform.' : 'No matching entries'}
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'security' && (
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600"><Shield size={20} /></div>
            <div><h3 className="text-sm font-semibold text-t1">Security & Access</h3><p className="text-xs text-t3">Roles, permissions, and audit</p></div>
          </div>
          <div className="space-y-2">
            {['Role-Based Access Control (RBAC)', 'Two-Factor Authentication', 'Audit Logging', 'Session Management', 'IP Allowlisting'].map(item => (
              <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                <span className="text-xs text-t1">{item}</span><Badge variant="success">Enabled</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Edit Org Modal */}
      <Modal open={showOrgModal} onClose={() => setShowOrgModal(false)} title="Edit Organization">
        <div className="space-y-4">
          <Input label="Company Name" value={orgForm.name} onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })} />
          <Input label="Industry" value={orgForm.industry || ''} onChange={(e) => setOrgForm({ ...orgForm, industry: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Size" value={orgForm.size || ''} onChange={(e) => setOrgForm({ ...orgForm, size: e.target.value })} />
            <Input label="Country" value={orgForm.country || ''} onChange={(e) => setOrgForm({ ...orgForm, country: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowOrgModal(false)}>Cancel</Button>
            <Button onClick={submitOrg}>Save Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Add Department Modal */}
      <Modal open={showDeptModal} onClose={() => setShowDeptModal(false)} title="Add Department">
        <div className="space-y-4">
          <Input label="Department Name" value={deptForm.name} onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })} />
          <Select label="Department Head" value={deptForm.head_id} onChange={(e) => setDeptForm({ ...deptForm, head_id: e.target.value })} options={[{ value: '', label: 'Select head...' }, ...employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))]} />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowDeptModal(false)}>Cancel</Button>
            <Button onClick={submitDept}>Add Department</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
