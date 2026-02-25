'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Laptop, Plus, Monitor, Smartphone, Wrench, UserCheck, UserX, Shield, CheckCircle, XCircle, Clock, FileCheck, ArrowRight } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard } from '@/components/ai'
import { predictDeviceRefresh, scoreSecurityPosture } from '@/lib/ai-engine'
import { demoComplianceFrameworks, demoSecurityPosture, demoProvisioningEvents } from '@/lib/demo-data'

export default function DevicesPage() {
  const t = useTranslations('devices')
  const tc = useTranslations('common')
  const { devices, employees, addDevice, updateDevice, getEmployeeName } = useTempo()

  const deviceInsights = useMemo(() => predictDeviceRefresh(devices), [devices])
  const securityScore = useMemo(() => scoreSecurityPosture(devices), [devices])

  const assignedCount = devices.filter(d => d.status === 'assigned').length
  const availableCount = devices.filter(d => d.status === 'available').length
  const maintenanceCount = devices.filter(d => d.status === 'maintenance').length

  // Add Device modal
  const [showAddModal, setShowAddModal] = useState(false)
  const [deviceForm, setDeviceForm] = useState({
    type: 'laptop',
    brand: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    warranty_end: '',
  })

  // Assign modal
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [assignDeviceId, setAssignDeviceId] = useState<string | null>(null)
  const [assignEmployeeId, setAssignEmployeeId] = useState('')

  const iconMap: Record<string, React.ReactNode> = {
    laptop: <Laptop size={16} />,
    phone: <Smartphone size={16} />,
    monitor: <Monitor size={16} />,
  }

  function openAddDevice() {
    setDeviceForm({ type: 'laptop', brand: '', model: '', serial_number: '', purchase_date: '', warranty_end: '' })
    setShowAddModal(true)
  }

  function submitDevice() {
    if (!deviceForm.brand || !deviceForm.model || !deviceForm.serial_number) return
    addDevice({
      type: deviceForm.type,
      brand: deviceForm.brand,
      model: deviceForm.model,
      serial_number: deviceForm.serial_number,
      status: 'available',
      assigned_to: null,
      purchase_date: deviceForm.purchase_date || new Date().toISOString().split('T')[0],
      warranty_end: deviceForm.warranty_end || '2028-12-31',
    })
    setShowAddModal(false)
  }

  function openAssign(deviceId: string) {
    setAssignDeviceId(deviceId)
    setAssignEmployeeId(employees[0]?.id || '')
    setShowAssignModal(true)
  }

  function submitAssign() {
    if (!assignDeviceId || !assignEmployeeId) return
    updateDevice(assignDeviceId, { assigned_to: assignEmployeeId, status: 'assigned' })
    setShowAssignModal(false)
    setAssignDeviceId(null)
  }

  function unassignDevice(deviceId: string) {
    updateDevice(deviceId, { assigned_to: null, status: 'available' })
  }

  function setMaintenance(deviceId: string) {
    updateDevice(deviceId, { status: 'maintenance' })
  }

  function setAvailable(deviceId: string) {
    updateDevice(deviceId, { assigned_to: null, status: 'available' })
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={<Button size="sm" onClick={openAddDevice}><Plus size={14} /> {t('addDevice')}</Button>}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('totalDevices')} value={devices.length} icon={<Laptop size={20} />} />
        <StatCard label={t('assigned')} value={assignedCount} change={t('available', { count: availableCount })} changeType="neutral" href="/people" />
        <StatCard label={t('inMaintenance')} value={maintenanceCount} icon={<Wrench size={20} />} />
        <StatCard label={t('availableLabel')} value={availableCount} change={t('readyToAssign')} changeType="positive" />
      </div>

      {/* AI Insights */}
      {deviceInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {deviceInsights.slice(0, 2).map(insight => (
            <AIInsightCard key={insight.id} insight={insight} compact />
          ))}
        </div>
      )}

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t('deviceInventory')}</CardTitle>
            <Button variant="secondary" size="sm">{tc('export')}</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">{t('tableDevice')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableType')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableSerial')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableAssignedTo')}</th>
                <th className="tempo-th text-left px-4 py-3">{t('tableWarranty')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('status')}</th>
                <th className="tempo-th text-center px-4 py-3">{tc('actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {devices.map(device => (
                <tr key={device.id} className="hover:bg-canvas/50">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-t2">
                        {iconMap[device.type] || <Laptop size={16} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-t1">{device.brand} {device.model}</p>
                        <p className="text-xs text-t3">{t('purchased', { date: device.purchase_date })}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><Badge>{device.type}</Badge></td>
                  <td className="px-4 py-3 text-sm text-t3 font-mono">{device.serial_number}</td>
                  <td className="px-4 py-3 text-sm text-t2">
                    {device.assigned_to ? getEmployeeName(device.assigned_to) : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-t2">{device.warranty_end}</td>
                  <td className="px-4 py-3 text-center">
                    <Badge variant={
                      device.status === 'assigned' ? 'success' :
                      device.status === 'available' ? 'info' :
                      device.status === 'maintenance' ? 'warning' : 'default'
                    }>
                      {device.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-center">
                      {device.status === 'available' && (
                        <Button size="sm" variant="primary" onClick={() => openAssign(device.id)}>
                          <UserCheck size={12} /> {tc('assign')}
                        </Button>
                      )}
                      {device.status === 'assigned' && (
                        <Button size="sm" variant="ghost" onClick={() => unassignDevice(device.id)}>
                          <UserX size={12} /> {tc('unassign')}
                        </Button>
                      )}
                      {device.status !== 'maintenance' && (
                        <Button size="sm" variant="ghost" onClick={() => setMaintenance(device.id)}>
                          <Wrench size={12} />
                        </Button>
                      )}
                      {device.status === 'maintenance' && (
                        <Button size="sm" variant="secondary" onClick={() => setAvailable(device.id)}>
                          {t('markAvailable')}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Section 1: Security Posture Dashboard ── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
          <Shield size={20} /> {t('securityPosture')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
          {/* Overall Score */}
          <Card>
            <div className="text-center">
              <p className="text-[0.6rem] text-t3 uppercase mb-1">{t('securityScore')}</p>
              <div className="relative w-16 h-16 mx-auto mb-2">
                <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 36 36">
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3" className="text-canvas" />
                  <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none" stroke="currentColor" strokeWidth="3"
                    strokeDasharray={`${securityScore.value}, 100`}
                    className={securityScore.value >= 80 ? 'text-success' : securityScore.value >= 60 ? 'text-warning' : 'text-error'} />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-t1">{securityScore.value}</span>
              </div>
              <Badge variant={securityScore.value >= 80 ? 'success' : securityScore.value >= 60 ? 'warning' : 'error'}>
                {securityScore.label}
              </Badge>
            </div>
          </Card>

          {/* OS Currency */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('osCurrency')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('upToDate')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.os_currency.up_to_date}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('outdated')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.os_currency.outdated}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.os_currency.up_to_date / demoSecurityPosture.os_currency.total * 100)} showLabel color="success" />
            </div>
          </Card>

          {/* Encryption */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('encryptionStatus')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('encrypted')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.encryption_status.encrypted}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('unencrypted')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.encryption_status.unencrypted}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.encryption_status.encrypted / demoSecurityPosture.encryption_status.total * 100)} showLabel color="success" />
            </div>
          </Card>

          {/* Endpoint Protection */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('endpointProtection')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><CheckCircle size={12} /> {t('protected')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.endpoint_protection.protected}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><XCircle size={12} /> {t('unprotected')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.endpoint_protection.unprotected}</span>
              </div>
              <Progress value={Math.round(demoSecurityPosture.endpoint_protection.protected / demoSecurityPosture.endpoint_protection.total * 100)} showLabel color={demoSecurityPosture.endpoint_protection.unprotected > 1 ? 'warning' : 'success'} />
            </div>
          </Card>

          {/* Last Check-in */}
          <Card>
            <p className="text-[0.6rem] text-t3 uppercase mb-2">{t('lastCheckin')}</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-success"><Clock size={12} /> {t('within24h')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.within_24h}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-warning"><Clock size={12} /> {t('within7d')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.within_7d}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-error"><Clock size={12} /> {t('older')}</span>
                <span className="font-medium text-t1">{demoSecurityPosture.last_checkin.older}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* ── Section 2: Compliance Templates ── */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
          <FileCheck size={20} /> {t('complianceTemplates')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demoComplianceFrameworks.map(framework => (
            <Card key={framework.id}>
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-sm font-semibold text-t1">{framework.name}</h3>
                <Badge variant={
                  framework.status === 'compliant' ? 'success' :
                  framework.status === 'partial' ? 'warning' :
                  framework.status === 'not_applicable' ? 'default' : 'error'
                }>
                  {framework.status === 'compliant' ? t('compliant') :
                   framework.status === 'partial' ? t('partial') : t('notApplicable')}
                </Badge>
              </div>
              <p className="text-xs text-t3 mb-3">{framework.description}</p>

              {framework.status !== 'not_applicable' && (
                <>
                  <div className="mb-3">
                    <Progress value={framework.compliance_score} showLabel color={framework.compliance_score >= 90 ? 'success' : framework.compliance_score >= 70 ? 'warning' : 'error'} />
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-success/5 rounded-lg">
                      <p className="text-xs text-success font-medium">{framework.passed_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('passed')}</p>
                    </div>
                    <div className="p-2 bg-error/5 rounded-lg">
                      <p className="text-xs text-error font-medium">{framework.failed_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('failed')}</p>
                    </div>
                    <div className="p-2 bg-warning/5 rounded-lg">
                      <p className="text-xs text-warning font-medium">{framework.pending_controls}</p>
                      <p className="text-[0.6rem] text-t3">{t('pending')}</p>
                    </div>
                  </div>
                  {framework.last_audit && (
                    <div className="mt-3 pt-3 border-t border-divider grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-t3">{t('lastAudit')}</p>
                        <p className="text-t1 font-medium">{framework.last_audit}</p>
                      </div>
                      <div>
                        <p className="text-t3">{t('nextAudit')}</p>
                        <p className="text-t1 font-medium">{framework.next_audit}</p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </Card>
          ))}
        </div>
      </div>

      {/* ── Section 3: Provisioning Workflows ── */}
      <div className="mt-8 mb-6">
        <h2 className="text-lg font-semibold text-t1 mb-4 flex items-center gap-2">
          <ArrowRight size={20} /> {t('provisioningWorkflows')}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* Onboarding flow */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                <UserCheck size={18} className="text-success" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('onboarding')}</h3>
                <p className="text-xs text-t3">Employee joins → Auto-assign device + apps</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-t3 mb-3">
              <Badge variant="info">New Employee</Badge>
              <ArrowRight size={12} />
              <Badge>Assign Device</Badge>
              <ArrowRight size={12} />
              <Badge>Provision Apps</Badge>
              <ArrowRight size={12} />
              <Badge variant="success">Ready</Badge>
            </div>
          </Card>

          {/* Offboarding flow */}
          <Card>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center">
                <UserX size={18} className="text-error" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-t1">{t('offboarding')}</h3>
                <p className="text-xs text-t3">Employee leaves → Auto-revoke access + recover device</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-t3 mb-3">
              <Badge variant="warning">Departing</Badge>
              <ArrowRight size={12} />
              <Badge>Revoke Apps</Badge>
              <ArrowRight size={12} />
              <Badge>Recover Device</Badge>
              <ArrowRight size={12} />
              <Badge variant="default">Completed</Badge>
            </div>
          </Card>
        </div>

        {/* Recent Provisioning Events */}
        <Card padding="none">
          <CardHeader>
            <CardTitle>{t('recentEvents')}</CardTitle>
          </CardHeader>
          <div className="divide-y divide-divider">
            {demoProvisioningEvents.map(event => (
              <div key={event.id} className="px-6 py-4 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${event.type === 'onboarding' ? 'bg-success/10' : 'bg-error/10'}`}>
                  {event.type === 'onboarding' ? <UserCheck size={18} className="text-success" /> : <UserX size={18} className="text-error" />}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{event.employee_name}</p>
                  <p className="text-xs text-t3">{event.date} - {event.type === 'onboarding' ? t('onboarding') : t('offboarding')}</p>
                </div>
                <div className="text-xs text-t3">
                  {event.devices_assigned.length > 0 && (
                    <span className="mr-2">{t('devicesAssigned')}: {event.devices_assigned.join(', ')}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-t3">
                    {t('provisioningSteps')}: {event.completed_steps}/{event.total_steps}
                  </div>
                  <Badge variant={
                    event.status === 'completed' ? 'success' :
                    event.status === 'in_progress' ? 'info' : 'warning'
                  }>
                    {event.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Add Device Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title={t('addDeviceModal')}>
        <div className="space-y-4">
          <Select
            label={t('deviceType')}
            value={deviceForm.type}
            onChange={(e) => setDeviceForm({ ...deviceForm, type: e.target.value })}
            options={[
              { value: 'laptop', label: t('typeLaptop') },
              { value: 'phone', label: t('typeSmartphone') },
              { value: 'monitor', label: t('typeMonitor') },
            ]}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('brand')} placeholder={t('brandPlaceholder')} value={deviceForm.brand} onChange={(e) => setDeviceForm({ ...deviceForm, brand: e.target.value })} />
            <Input label={t('model')} placeholder={t('modelPlaceholder')} value={deviceForm.model} onChange={(e) => setDeviceForm({ ...deviceForm, model: e.target.value })} />
          </div>
          <Input label={t('serialNumber')} placeholder={t('serialPlaceholder')} value={deviceForm.serial_number} onChange={(e) => setDeviceForm({ ...deviceForm, serial_number: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label={t('purchaseDate')} type="date" value={deviceForm.purchase_date} onChange={(e) => setDeviceForm({ ...deviceForm, purchase_date: e.target.value })} />
            <Input label={t('warrantyEnd')} type="date" value={deviceForm.warranty_end} onChange={(e) => setDeviceForm({ ...deviceForm, warranty_end: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAddModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitDevice}>{t('addDevice')}</Button>
          </div>
        </div>
      </Modal>

      {/* Assign Device Modal */}
      <Modal open={showAssignModal} onClose={() => setShowAssignModal(false)} title={t('assignDeviceModal')} size="sm">
        <div className="space-y-4">
          <p className="text-sm text-t2">{t('assignDeviceDesc')}</p>
          <Select
            label={tc('employee')}
            value={assignEmployeeId}
            onChange={(e) => setAssignEmployeeId(e.target.value)}
            options={employees.map(e => ({ value: e.id, label: e.profile?.full_name || '' }))}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAssignModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitAssign}>{tc('assign')}</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
