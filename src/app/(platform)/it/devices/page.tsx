'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Laptop, Plus, Monitor, Smartphone, Wrench } from 'lucide-react'
import { demoDevices, demoEmployees } from '@/lib/demo-data'

export default function DevicesPage() {
  const assignedCount = demoDevices.filter(d => d.status === 'assigned').length
  const availableCount = demoDevices.filter(d => d.status === 'available').length
  const maintenanceCount = demoDevices.filter(d => d.status === 'maintenance').length

  const iconMap: Record<string, React.ReactNode> = {
    laptop: <Laptop size={16} />,
    phone: <Smartphone size={16} />,
    monitor: <Monitor size={16} />,
  }

  return (
    <>
      <Header title="Devices" subtitle="Device inventory, assignment, and lifecycle management" actions={<Button size="sm"><Plus size={14} /> Add Device</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Devices" value={demoDevices.length} icon={<Laptop size={20} />} />
        <StatCard label="Assigned" value={assignedCount} change={`${availableCount} available`} changeType="neutral" />
        <StatCard label="In Maintenance" value={maintenanceCount} icon={<Wrench size={20} />} />
        <StatCard label="Warranty Expiring" value={1} change="Next 90 days" changeType="negative" />
      </div>

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Device Inventory</CardTitle>
            <Button variant="secondary" size="sm">Export</Button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-divider bg-canvas">
                <th className="tempo-th text-left px-6 py-3">Device</th>
                <th className="tempo-th text-left px-4 py-3">Type</th>
                <th className="tempo-th text-left px-4 py-3">Serial #</th>
                <th className="tempo-th text-left px-4 py-3">Assigned To</th>
                <th className="tempo-th text-left px-4 py-3">Warranty</th>
                <th className="tempo-th text-center px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {demoDevices.map(device => {
                const emp = device.assigned_to ? demoEmployees.find(e => e.id === device.assigned_to) : null
                return (
                  <tr key={device.id} className="hover:bg-canvas/50">
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-canvas flex items-center justify-center text-t2">
                          {iconMap[device.type] || <Laptop size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-t1">{device.brand} {device.model}</p>
                          <p className="text-xs text-t3">Purchased {device.purchase_date}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><Badge>{device.type}</Badge></td>
                    <td className="px-4 py-3 text-sm text-t3 font-mono">{device.serial_number}</td>
                    <td className="px-4 py-3 text-sm text-t2">{emp?.profile?.full_name || '-'}</td>
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
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}
