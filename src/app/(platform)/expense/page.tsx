'use client'

import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Receipt, Plus, DollarSign, Clock } from 'lucide-react'
import { demoExpenseReports, demoEmployees } from '@/lib/demo-data'

export default function ExpensePage() {
  const totalPending = demoExpenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').reduce((a, e) => a + e.total_amount, 0)
  const totalApproved = demoExpenseReports.filter(e => e.status === 'approved' || e.status === 'reimbursed').reduce((a, e) => a + e.total_amount, 0)

  return (
    <>
      <Header title="Expense" subtitle="Submit, approve, and track expense reports" actions={<Button size="sm"><Plus size={14} /> New Report</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Pending Review" value={demoExpenseReports.filter(e => e.status === 'submitted' || e.status === 'pending_approval').length} icon={<Clock size={20} />} />
        <StatCard label="Pending Amount" value={`$${totalPending.toLocaleString()}`} change="Awaiting approval" changeType="neutral" icon={<DollarSign size={20} />} />
        <StatCard label="Approved/Reimbursed" value={`$${totalApproved.toLocaleString()}`} change="This quarter" changeType="positive" />
        <StatCard label="Total Reports" value={demoExpenseReports.length} icon={<Receipt size={20} />} />
      </div>

      <Card padding="none">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Expense Reports</CardTitle>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm">Export</Button>
            </div>
          </div>
        </CardHeader>
        <div className="divide-y divide-divider">
          {demoExpenseReports.map(report => {
            const emp = demoEmployees.find(e => e.id === report.employee_id)
            return (
              <div key={report.id} className="px-6 py-4">
                <div className="flex items-center gap-4 mb-3">
                  <Avatar name={emp?.profile?.full_name || ''} size="sm" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-t1">{report.title}</p>
                    <p className="text-xs text-t3">{emp?.profile?.full_name} - Submitted {new Date(report.submitted_at).toLocaleDateString()}</p>
                  </div>
                  <p className="text-lg font-semibold text-t1">${report.total_amount.toLocaleString()}</p>
                  <Badge variant={
                    report.status === 'approved' ? 'success' :
                    report.status === 'reimbursed' ? 'info' :
                    report.status === 'submitted' || report.status === 'pending_approval' ? 'warning' : 'default'
                  }>
                    {report.status.replace('_', ' ')}
                  </Badge>
                  {(report.status === 'submitted' || report.status === 'pending_approval') && (
                    <div className="flex gap-1">
                      <Button size="sm" variant="primary">Approve</Button>
                      <Button size="sm" variant="ghost">Reject</Button>
                    </div>
                  )}
                </div>
                {report.items.length > 0 && (
                  <div className="ml-12 grid grid-cols-1 md:grid-cols-3 gap-2">
                    {report.items.map(item => (
                      <div key={item.id} className="bg-canvas rounded-lg px-3 py-2 flex justify-between">
                        <div>
                          <p className="text-xs font-medium text-t1">{item.description}</p>
                          <p className="text-[0.6rem] text-t3">{item.category}</p>
                        </div>
                        <p className="text-xs font-semibold text-t1">${item.amount}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}
