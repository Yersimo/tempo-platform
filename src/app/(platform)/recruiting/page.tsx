'use client'

import { useState } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Briefcase, Users, Plus, Star } from 'lucide-react'
import { demoJobPostings, demoApplications, demoDepartments } from '@/lib/demo-data'

export default function RecruitingPage() {
  const [activeTab, setActiveTab] = useState('postings')
  const tabs = [
    { id: 'postings', label: 'Job Postings', count: demoJobPostings.filter(j => j.status === 'open').length },
    { id: 'pipeline', label: 'Pipeline', count: demoApplications.length },
  ]

  const totalApplicants = demoJobPostings.reduce((a, j) => a + j.application_count, 0)
  const openPositions = demoJobPostings.filter(j => j.status === 'open').length

  return (
    <>
      <Header title="Recruiting" subtitle="Job postings, pipeline, and hiring" actions={<Button size="sm"><Plus size={14} /> Post Job</Button>} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Positions" value={openPositions} icon={<Briefcase size={20} />} />
        <StatCard label="Total Applicants" value={totalApplicants} change="Across all postings" changeType="neutral" icon={<Users size={20} />} />
        <StatCard label="In Interview" value={demoApplications.filter(a => a.status === 'interview').length} change="Active candidates" changeType="neutral" />
        <StatCard label="Offers Extended" value={demoApplications.filter(a => a.status === 'offer').length} change="Pending acceptance" changeType="positive" />
      </div>
      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {activeTab === 'postings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {demoJobPostings.map(job => {
            const dept = demoDepartments.find(d => d.id === job.department_id)
            return (
              <Card key={job.id}>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-sm font-semibold text-t1">{job.title}</h3>
                    <p className="text-xs text-t3">{dept?.name} - {job.location}</p>
                  </div>
                  <Badge variant={job.status === 'open' ? 'success' : 'default'}>{job.status}</Badge>
                </div>
                <p className="text-xs text-t2 mb-3">{job.description}</p>
                <div className="flex items-center gap-3 mb-3">
                  <Badge>{job.type.replace('_', ' ')}</Badge>
                  <span className="text-xs text-t3">${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-t3">{job.application_count} applicants</span>
                  <Button size="sm" variant="outline">View Applicants</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {activeTab === 'pipeline' && (
        <Card padding="none">
          <CardHeader><CardTitle>Candidate Pipeline</CardTitle></CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">Candidate</th>
                  <th className="tempo-th text-left px-4 py-3">Position</th>
                  <th className="tempo-th text-left px-4 py-3">Stage</th>
                  <th className="tempo-th text-center px-4 py-3">Rating</th>
                  <th className="tempo-th text-center px-4 py-3">Status</th>
                  <th className="tempo-th text-center px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {demoApplications.map(app => {
                  const job = demoJobPostings.find(j => j.id === app.job_id)
                  return (
                    <tr key={app.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-t1">{app.candidate_name}</p>
                        <p className="text-xs text-t3">{app.candidate_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{job?.title}</td>
                      <td className="px-4 py-3 text-sm text-t2">{app.stage}</td>
                      <td className="px-4 py-3 text-center">
                        {app.rating ? (
                          <div className="flex items-center justify-center gap-0.5">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} size={12} className={s <= app.rating! ? 'fill-tempo-600 text-tempo-600' : 'text-t3'} />
                            ))}
                          </div>
                        ) : <span className="text-xs text-t3">N/A</span>}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          app.status === 'offer' ? 'success' :
                          app.status === 'interview' ? 'info' :
                          app.status === 'screening' ? 'warning' : 'default'
                        }>
                          {app.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Button size="sm" variant="ghost">View</Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </>
  )
}
