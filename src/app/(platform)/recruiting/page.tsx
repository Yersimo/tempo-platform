'use client'

import { useState, useMemo } from 'react'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Briefcase, Users, Plus, Star, Pencil, ArrowRight } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner } from '@/components/ai'
import { scoreCandidateFit, analyzePipelineHealth, predictTimeToHire } from '@/lib/ai-engine'

const STAGES = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'] as const

export default function RecruitingPage() {
  const {
    jobPostings, applications, employees, departments,
    addJobPosting, updateJobPosting,
    addApplication, updateApplication,
    getDepartmentName,
  } = useTempo()

  const [activeTab, setActiveTab] = useState('postings')

  // Job posting modal
  const [showJobModal, setShowJobModal] = useState(false)
  const [editingJob, setEditingJob] = useState<string | null>(null)
  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: '',
    location: '',
    type: 'full_time' as string,
    description: '',
    requirements: '',
    salary_min: 0,
    salary_max: 0,
    currency: 'USD',
  })

  // Application modal
  const [showAppModal, setShowAppModal] = useState(false)
  const [appForm, setAppForm] = useState({
    job_id: '',
    candidate_name: '',
    candidate_email: '',
    resume_url: '',
    cover_letter: '',
  })

  // Move stage modal
  const [showStageModal, setShowStageModal] = useState(false)
  const [stageForm, setStageForm] = useState({ app_id: '', stage: '', notes: '' })

  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const totalApplicants = jobPostings.reduce((a, j) => a + (j.application_count || 0), 0)
  const inInterview = applications.filter(a => a.stage === 'interview' || a.status === 'interview').length
  const offersExtended = applications.filter(a => a.stage === 'offer' || a.status === 'offer').length

  const tabs = [
    { id: 'postings', label: 'Job Postings', count: openPositions },
    { id: 'pipeline', label: 'Pipeline', count: applications.length },
  ]

  const pipelineInsights = useMemo(() => analyzePipelineHealth(applications, jobPostings), [applications, jobPostings])

  // ---- Job Posting CRUD ----
  function openNewJob() {
    setEditingJob(null)
    setJobForm({
      title: '',
      department_id: departments[0]?.id || '',
      location: '',
      type: 'full_time',
      description: '',
      requirements: '',
      salary_min: 0,
      salary_max: 0,
      currency: 'USD',
    })
    setShowJobModal(true)
  }

  function openEditJob(id: string) {
    const job = jobPostings.find(j => j.id === id)
    if (!job) return
    setEditingJob(id)
    setJobForm({
      title: job.title,
      department_id: job.department_id,
      location: job.location,
      type: job.type,
      description: job.description || '',
      requirements: Array.isArray(job.requirements) ? job.requirements.join('\n') : (job.requirements || ''),
      salary_min: job.salary_min,
      salary_max: job.salary_max,
      currency: job.currency || 'USD',
    })
    setShowJobModal(true)
  }

  function submitJob() {
    if (!jobForm.title || !jobForm.department_id || !jobForm.location) return
    const data = {
      title: jobForm.title,
      department_id: jobForm.department_id,
      location: jobForm.location,
      type: jobForm.type,
      description: jobForm.description,
      requirements: jobForm.requirements.split('\n').filter(r => r.trim()),
      salary_min: Number(jobForm.salary_min) || 0,
      salary_max: Number(jobForm.salary_max) || 0,
      currency: jobForm.currency,
      status: 'open',
    }
    if (editingJob) {
      updateJobPosting(editingJob, data)
    } else {
      addJobPosting(data)
    }
    setShowJobModal(false)
  }

  function closeJob(id: string) {
    updateJobPosting(id, { status: 'closed' })
  }

  function reopenJob(id: string) {
    updateJobPosting(id, { status: 'open' })
  }

  // ---- Application CRUD ----
  function openNewApplication() {
    setAppForm({
      job_id: jobPostings[0]?.id || '',
      candidate_name: '',
      candidate_email: '',
      resume_url: '',
      cover_letter: '',
    })
    setShowAppModal(true)
  }

  function submitApplication() {
    if (!appForm.job_id || !appForm.candidate_name || !appForm.candidate_email) return
    addApplication({
      job_id: appForm.job_id,
      candidate_name: appForm.candidate_name,
      candidate_email: appForm.candidate_email,
      resume_url: appForm.resume_url || null,
      cover_letter: appForm.cover_letter || null,
      stage: 'applied',
      status: 'applied',
      rating: null,
    })
    setShowAppModal(false)
  }

  // ---- Stage Movement ----
  function openStageModal(appId: string) {
    const app = applications.find(a => a.id === appId)
    if (!app) return
    const currentStage = app.stage || app.status || 'applied'
    const currentIndex = STAGES.indexOf(currentStage as typeof STAGES[number])
    const nextStage = currentIndex < STAGES.length - 2 ? STAGES[currentIndex + 1] : STAGES[currentIndex]
    setStageForm({ app_id: appId, stage: nextStage, notes: '' })
    setShowStageModal(true)
  }

  function submitStageChange() {
    if (!stageForm.app_id || !stageForm.stage) return
    updateApplication(stageForm.app_id, {
      stage: stageForm.stage,
      status: stageForm.stage,
      notes: stageForm.notes || undefined,
    })
    setShowStageModal(false)
  }

  function rejectApplication(id: string) {
    updateApplication(id, { stage: 'rejected', status: 'rejected' })
  }

  return (
    <>
      <Header
        title="Recruiting"
        subtitle="Job postings, pipeline, and hiring"
        actions={
          <div className="flex gap-2">
            {activeTab === 'postings' && (
              <Button size="sm" onClick={openNewJob}>
                <Plus size={14} /> Post Job
              </Button>
            )}
            {activeTab === 'pipeline' && (
              <Button size="sm" onClick={openNewApplication}>
                <Plus size={14} /> Add Candidate
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Open Positions" value={openPositions} icon={<Briefcase size={20} />} />
        <StatCard label="Total Applicants" value={totalApplicants} change="Across all postings" changeType="neutral" icon={<Users size={20} />} />
        <StatCard label="In Interview" value={inInterview} change="Active candidates" changeType="neutral" />
        <StatCard label="Offers Extended" value={offersExtended} change="Pending acceptance" changeType="positive" />
      </div>

      {/* AI Pipeline Alerts */}
      {pipelineInsights.length > 0 && (
        <AIAlertBanner insights={pipelineInsights} className="mb-4" />
      )}

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6" />

      {/* Job Postings Tab */}
      {activeTab === 'postings' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobPostings.length === 0 && (
            <div className="col-span-2 text-center py-12 text-sm text-t3">
              No job postings yet. Click &quot;Post Job&quot; to create one.
            </div>
          )}
          {jobPostings.map(job => (
            <Card key={job.id}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-sm font-semibold text-t1">{job.title}</h3>
                  <p className="text-xs text-t3">{getDepartmentName(job.department_id)} - {job.location}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={job.status === 'open' ? 'success' : 'default'}>{job.status}</Badge>
                  <button
                    onClick={() => openEditJob(job.id)}
                    className="p-1.5 text-t3 hover:text-t1 hover:bg-canvas rounded-lg transition-colors"
                  >
                    <Pencil size={14} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-t2 mb-3 line-clamp-2">{job.description}</p>
              <div className="flex items-center gap-3 mb-3">
                <Badge>{job.type.replace(/_/g, ' ')}</Badge>
                <span className="text-xs text-t3">
                  {job.currency || '$'}{job.salary_min?.toLocaleString()} - {job.currency || '$'}{job.salary_max?.toLocaleString()}
                </span>
              </div>
              {job.requirements && (
                <div className="mb-3">
                  <p className="text-[0.6rem] text-t3 uppercase mb-1">Requirements</p>
                  <div className="flex flex-wrap gap-1">
                    {(typeof job.requirements === 'string' ? job.requirements.split(',').map(s => s.trim()) : job.requirements).slice(0, 3).map((req: string, i: number) => (
                      <span key={i} className="text-[0.6rem] bg-canvas text-t2 px-2 py-0.5 rounded-full">{req}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-divider">
                <span className="text-xs text-t3">{job.application_count || 0} applicant{(job.application_count || 0) !== 1 ? 's' : ''}</span>
                <div className="flex gap-2">
                  {job.status === 'open' ? (
                    <Button size="sm" variant="ghost" onClick={() => closeJob(job.id)}>Close Posting</Button>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => reopenJob(job.id)}>Reopen</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setActiveTab('pipeline') }}>View Applicants</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Pipeline Tab */}
      {activeTab === 'pipeline' && (
        <Card padding="none">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Candidate Pipeline</CardTitle>
              <Button size="sm" onClick={openNewApplication}>
                <Plus size={14} /> Add Candidate
              </Button>
            </div>
          </CardHeader>
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
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-t3">
                      No applications yet. Click &quot;Add Candidate&quot; to add one.
                    </td>
                  </tr>
                )}
                {applications.map(app => {
                  const job = jobPostings.find(j => j.id === app.job_id)
                  const stage = app.stage || app.status || 'applied'
                  const isRejected = stage === 'rejected'
                  const isHired = stage === 'hired'
                  return (
                    <tr key={app.id} className="hover:bg-canvas/50">
                      <td className="px-6 py-3">
                        <p className="text-sm font-medium text-t1">{app.candidate_name}</p>
                        <p className="text-xs text-t3">{app.candidate_email}</p>
                      </td>
                      <td className="px-4 py-3 text-sm text-t2">{job?.title || 'Unknown'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          stage === 'offer' || stage === 'hired' ? 'success' :
                          stage === 'interview' || stage === 'assessment' ? 'info' :
                          stage === 'screening' ? 'warning' :
                          stage === 'rejected' ? 'error' : 'default'
                        }>
                          {stage}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          {app.rating ? (
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} size={12} className={s <= (app.rating || 0) ? 'fill-tempo-600 text-tempo-600' : 'text-t3'} />
                              ))}
                            </div>
                          ) : <span className="text-xs text-t3">N/A</span>}
                          <AIScoreBadge score={scoreCandidateFit(app, job)} size="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={
                          stage === 'offer' || stage === 'hired' ? 'success' :
                          stage === 'rejected' ? 'error' :
                          stage === 'interview' ? 'info' :
                          stage === 'screening' ? 'warning' : 'default'
                        }>
                          {stage}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {!isRejected && !isHired && (
                          <div className="flex gap-1 justify-center">
                            <Button size="sm" variant="secondary" onClick={() => openStageModal(app.id)}>
                              <ArrowRight size={12} /> Move
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectApplication(app.id)}>
                              Reject
                            </Button>
                          </div>
                        )}
                        {isHired && <span className="text-xs text-success font-medium">Hired</span>}
                        {isRejected && <span className="text-xs text-error font-medium">Rejected</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* ---- MODALS ---- */}

      {/* Post/Edit Job Modal */}
      <Modal open={showJobModal} onClose={() => setShowJobModal(false)} title={editingJob ? 'Edit Job Posting' : 'Post New Job'} size="lg">
        <div className="space-y-4">
          <Input
            label="Job Title"
            placeholder="e.g., Senior Software Engineer"
            value={jobForm.title}
            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Department"
              value={jobForm.department_id}
              onChange={(e) => setJobForm({ ...jobForm, department_id: e.target.value })}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
            <Input
              label="Location"
              placeholder="e.g., Lagos, Nigeria"
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Employment Type"
              value={jobForm.type}
              onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
              options={[
                { value: 'full_time', label: 'Full Time' },
                { value: 'part_time', label: 'Part Time' },
                { value: 'contract', label: 'Contract' },
                { value: 'internship', label: 'Internship' },
              ]}
            />
            <Select
              label="Currency"
              value={jobForm.currency}
              onChange={(e) => setJobForm({ ...jobForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: 'USD' },
                { value: 'NGN', label: 'NGN' },
                { value: 'GHS', label: 'GHS' },
                { value: 'KES', label: 'KES' },
                { value: 'XOF', label: 'XOF' },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Salary Min"
              type="number"
              min={0}
              value={jobForm.salary_min}
              onChange={(e) => setJobForm({ ...jobForm, salary_min: Number(e.target.value) })}
            />
            <Input
              label="Salary Max"
              type="number"
              min={0}
              value={jobForm.salary_max}
              onChange={(e) => setJobForm({ ...jobForm, salary_max: Number(e.target.value) })}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Describe the role, responsibilities, and what makes it great..."
            rows={4}
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
          />
          <Textarea
            label="Requirements (one per line)"
            placeholder="5+ years experience in software development&#10;Proficiency in React/TypeScript&#10;Experience with distributed systems"
            rows={4}
            value={jobForm.requirements}
            onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowJobModal(false)}>Cancel</Button>
            <Button onClick={submitJob}>{editingJob ? 'Save Changes' : 'Post Job'}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal open={showAppModal} onClose={() => setShowAppModal(false)} title="Add Candidate">
        <div className="space-y-4">
          <Select
            label="Job Posting"
            value={appForm.job_id}
            onChange={(e) => setAppForm({ ...appForm, job_id: e.target.value })}
            options={jobPostings.filter(j => j.status === 'open').map(j => ({ value: j.id, label: j.title }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Candidate Name"
              placeholder="e.g., Amara Okafor"
              value={appForm.candidate_name}
              onChange={(e) => setAppForm({ ...appForm, candidate_name: e.target.value })}
            />
            <Input
              label="Email"
              type="email"
              placeholder="e.g., amara@example.com"
              value={appForm.candidate_email}
              onChange={(e) => setAppForm({ ...appForm, candidate_email: e.target.value })}
            />
          </div>
          <Input
            label="Resume URL (optional)"
            placeholder="https://drive.google.com/..."
            value={appForm.resume_url}
            onChange={(e) => setAppForm({ ...appForm, resume_url: e.target.value })}
          />
          <Textarea
            label="Cover Letter / Notes (optional)"
            placeholder="Add any notes about this candidate..."
            rows={3}
            value={appForm.cover_letter}
            onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAppModal(false)}>Cancel</Button>
            <Button onClick={submitApplication}>Add Candidate</Button>
          </div>
        </div>
      </Modal>

      {/* Move Stage Modal */}
      <Modal open={showStageModal} onClose={() => setShowStageModal(false)} title="Move Candidate Stage" size="sm">
        <div className="space-y-4">
          <Select
            label="Move to Stage"
            value={stageForm.stage}
            onChange={(e) => setStageForm({ ...stageForm, stage: e.target.value })}
            options={STAGES.filter(s => s !== 'rejected').map(s => ({
              value: s,
              label: s.charAt(0).toUpperCase() + s.slice(1),
            }))}
          />
          <Textarea
            label="Notes (optional)"
            placeholder="Add notes about this stage transition..."
            rows={2}
            value={stageForm.notes}
            onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowStageModal(false)}>Cancel</Button>
            <Button onClick={submitStageChange}>Move Stage</Button>
          </div>
        </div>
      </Modal>
    </>
  )
}
