'use client'

import { Header } from '@/components/layout/header'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Settings, Building, Users, Shield, Bell, Palette, Globe } from 'lucide-react'
import { demoOrg } from '@/lib/demo-data'

export default function SettingsPage() {
  return (
    <>
      <Header title="Settings" subtitle="Organization settings and configuration" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Building size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Organization</h3>
              <p className="text-xs text-t3">Manage company details</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Company Name</span>
              <span className="text-sm font-medium text-t1">{demoOrg.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Industry</span>
              <span className="text-sm text-t1">{demoOrg.industry}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Plan</span>
              <Badge variant="orange">{demoOrg.plan}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Size</span>
              <span className="text-sm text-t1">{demoOrg.size}</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">Edit Organization</Button>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Users size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Team Management</h3>
              <p className="text-xs text-t3">Invite and manage users</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Total Users</span>
              <span className="text-sm font-medium text-t1">30</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Admins</span>
              <span className="text-sm text-t1">5</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Managers</span>
              <span className="text-sm text-t1">8</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Employees</span>
              <span className="text-sm text-t1">17</span>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">Invite Members</Button>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Security & Access</h3>
              <p className="text-xs text-t3">Roles, permissions, and audit</p>
            </div>
          </div>
          <div className="space-y-2">
            {['Role-Based Access Control (RBAC)', 'Two-Factor Authentication', 'Audit Logging', 'Session Management', 'IP Allowlisting'].map(item => (
              <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                <span className="text-xs text-t1">{item}</span>
                <Badge variant="success">Enabled</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Globe size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Regions & Countries</h3>
              <p className="text-xs text-t3">Multi-country configuration</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { region: 'UEMOA', countries: 8, active: true },
              { region: 'CESA', countries: 10, active: true },
              { region: 'AWA', countries: 7, active: true },
              { region: 'Nigeria', countries: 1, active: true },
              { region: 'Other', countries: 7, active: false },
            ].map(item => (
              <div key={item.region} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                <div>
                  <p className="text-xs font-medium text-t1">{item.region}</p>
                  <p className="text-[0.6rem] text-t3">{item.countries} countries</p>
                </div>
                <Badge variant={item.active ? 'success' : 'default'}>{item.active ? 'Active' : 'Planned'}</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Bell size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Notifications</h3>
              <p className="text-xs text-t3">Email and in-app preferences</p>
            </div>
          </div>
          <div className="space-y-2">
            {['Leave Approvals', 'Expense Submissions', 'Performance Reviews', 'Payroll Processing', 'IT Requests'].map(item => (
              <div key={item} className="flex items-center justify-between bg-canvas rounded-lg px-3 py-2">
                <span className="text-xs text-t1">{item}</span>
                <Badge variant="info">Email + Push</Badge>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-tempo-50 flex items-center justify-center text-tempo-600">
              <Palette size={20} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-t1">Branding</h3>
              <p className="text-xs text-t3">Customize appearance</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Primary Color</span>
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-tempo-600" />
                <span className="text-xs text-t1 font-mono">#ea580c</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Logo</span>
              <span className="text-xs text-t1">Tempo Rising T</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-t2">Theme</span>
              <Badge>Light</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" className="mt-4 w-full">Customize</Button>
        </Card>
      </div>
    </>
  )
}
