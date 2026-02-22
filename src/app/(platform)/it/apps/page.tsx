'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Progress } from '@/components/ui/progress'
import { AppWindow, Plus, Key, AlertTriangle } from 'lucide-react'
import { demoSoftwareLicenses, demoITRequests, demoEmployees } from '@/lib/demo-data'

export default function AppsPage() {
  const totalLicenses = demoSoftwareLicenses.reduce((a, l) => a + l.total_licenses, 0)
  const usedLicenses = demoSoftwareLicenses.reduce((a, l) => a + l.used_licenses, 0)
  const monthlyCost = demoSoftwareLicenses.reduce((a, l) => a + l.used_licenses * l.cost_per_license, 0)

  return (
    <>
      <Header title="Apps & Licenses" subtitle="Software licenses, provisioning, and IT requests" actions={<Button size="sm"><Plus size={14} /> Add License</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Licenses" value={totalLicenses} icon={<Key size={20} />} />
        <StatCard label="Utilization" value={`${Math.round(usedLicenses / totalLicenses * 100)}%`} change={`${usedLicenses} in use`} changeType="neutral" />
        <StatCard label="Monthly Cost" value={`$${Math.round(monthlyCost).toLocaleString()}`} icon={<AppWindow size={20} />} />
        <StatCard label="Open IT Requests" value={demoITRequests.filter(r => r.status === 'open').length} icon={<AlertTriangle size={20} />} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {demoSoftwareLicenses.map(license => (
          <Card key={license.id}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold text-t1">{license.name}</h3>
                <p className="text-xs text-t3">{license.vendor}</p>
              </div>
              <Badge variant="success">Active</Badge>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div>
                <p className="text-[0.6rem] text-t3 uppercase">Used</p>
                <p className="text-sm font-semibold text-t1">{license.used_licenses} / {license.total_licenses}</p>
              </div>
              <div>
                <p className="text-[0.6rem] text-t3 uppercase">Cost/License</p>
                <p className="text-sm font-semibold text-t1">${license.cost_per_license}/mo</p>
              </div>
              <div>
                <p className="text-[0.6rem] text-t3 uppercase">Renewal</p>
                <p className="text-sm font-semibold text-t1">{license.renewal_date}</p>
              </div>
            </div>
            <Progress value={Math.round(license.used_licenses / license.total_licenses * 100)} showLabel color={license.used_licenses / license.total_licenses > 0.9 ? 'error' : 'orange'} />
          </Card>
        ))}
      </div>

      <Card padding="none">
        <CardHeader><CardTitle>IT Support Requests</CardTitle></CardHeader>
        <div className="divide-y divide-divider">
          {demoITRequests.map(req => {
            const requester = demoEmployees.find(e => e.id === req.requester_id)
            const assignee = req.assigned_to ? demoEmployees.find(e => e.id === req.assigned_to) : null
            return (
              <div key={req.id} className="px-6 py-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-canvas flex items-center justify-center text-t2">
                  <AppWindow size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-t1">{req.title}</p>
                  <p className="text-xs text-t3">{requester?.profile?.full_name} - {req.description}</p>
                </div>
                <Badge variant={req.priority === 'high' ? 'error' : req.priority === 'medium' ? 'warning' : 'default'}>
                  {req.priority}
                </Badge>
                <Badge variant={req.status === 'resolved' ? 'success' : req.status === 'in_progress' ? 'info' : 'warning'}>
                  {req.status.replace('_', ' ')}
                </Badge>
                {assignee && <span className="text-xs text-t3">Assigned: {assignee.profile?.full_name}</span>}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
