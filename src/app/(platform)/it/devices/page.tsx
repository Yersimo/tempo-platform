'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Modal } from '@/components/ui/modal'
import { Input, Select } from '@/components/ui/input'
import { Laptop, Plus, Monitor, Smartphone, Wrench, UserCheck, UserX } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIInsightCard } from '@/components/ai'
import { predictDeviceRefresh } from '@/lib/ai-engine'

export default function DevicesPage() {
  const t = useTranslations('devices')
  const tc = useTranslations('common')
  const { devices, employees, addDevice, updateDevice, getEmployeeName } = useTempo()

  const deviceInsights = useMemo(() => predictDeviceRefresh(devices), [devices])

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
