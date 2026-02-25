'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/layout/header'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { StatCard } from '@/components/ui/stat-card'
import { Tabs } from '@/components/ui/tabs'
import { Modal } from '@/components/ui/modal'
import { Input, Select, Textarea } from '@/components/ui/input'
import { Briefcase, Users, Plus, Star, Pencil, ArrowRight, Globe, Send, Check, AlertCircle, ExternalLink } from 'lucide-react'
import { useTempo } from '@/lib/store'
import { AIScoreBadge, AIAlertBanner } from '@/components/ai'
import { scoreCandidateFit, analyzePipelineHealth, predictTimeToHire, scoreCareerSiteEffectiveness, recommendJobBoards } from '@/lib/ai-engine'
import { Progress } from '@/components/ui/progress'

const STAGES = ['applied', 'screening', 'interview', 'assessment', 'offer', 'hired', 'rejected'] as const

export default function RecruitingPage() {
  const t = useTranslations('recruiting')
  const tc = useTranslations('common')
  const {
    jobPostings, applications, employees, departments,
    addJobPosting, updateJobPosting,
    addApplication, updateApplication,
    getDepartmentName,
    careerSiteConfig, jobDistributions, updateCareerSiteConfig, addJobDistribution,
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

  // Career Site state
  const [showPreviewModal, setShowPreviewModal] = useState(false)
  const [careerForm, setCareerForm] = useState({
    enabled: careerSiteConfig?.enabled ?? false,
    hero_title: careerSiteConfig?.hero_title ?? '',
    hero_subtitle: careerSiteConfig?.hero_subtitle ?? '',
    theme: (careerSiteConfig?.theme ?? 'professional') as string,
    sections: (careerSiteConfig?.sections ?? ['about', 'benefits', 'positions']) as string[],
  })

  // Job Distribution state
  const [showDistModal, setShowDistModal] = useState(false)
  const [distJobId, setDistJobId] = useState('')
  const [selectedBoards, setSelectedBoards] = useState<string[]>([])

  const openPositions = jobPostings.filter(j => j.status === 'open').length
  const totalApplicants = jobPostings.reduce((a, j) => a + (j.application_count || 0), 0)
  const inInterview = applications.filter(a => a.stage === 'interview' || a.status === 'interview').length
  const offersExtended = applications.filter(a => a.stage === 'offer' || a.status === 'offer').length

  const tabs = [
    { id: 'postings', label: t('tabJobPostings'), count: openPositions },
    { id: 'pipeline', label: t('tabPipeline'), count: applications.length },
    { id: 'career_site', label: t('careerSite') },
  ]

  const pipelineInsights = useMemo(() => analyzePipelineHealth(applications, jobPostings), [applications, jobPostings])
  const careerSiteScore = useMemo(() => scoreCareerSiteEffectiveness(careerForm), [careerForm])

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

  // ---- Career Site ----
  function saveCareerSite() {
    updateCareerSiteConfig(careerForm)
  }

  function toggleSection(section: string) {
    setCareerForm(prev => ({
      ...prev,
      sections: prev.sections.includes(section)
        ? prev.sections.filter(s => s !== section)
        : [...prev.sections, section],
    }))
  }

  // ---- Job Distribution ----
  function openDistribution(jobId: string) {
    const existing = jobDistributions.find(d => d.job_id === jobId)
    setDistJobId(jobId)
    setSelectedBoards(existing ? [...existing.boards] : [])
    setShowDistModal(true)
  }

  function toggleBoard(boardId: string) {
    setSelectedBoards(prev =>
      prev.includes(boardId) ? prev.filter(b => b !== boardId) : [...prev, boardId]
    )
  }

  function submitDistribution() {
    if (!distJobId || selectedBoards.length === 0) return
    const statusPerBoard: Record<string, string> = {}
    selectedBoards.forEach(b => { statusPerBoard[b] = 'posted' })
    addJobDistribution({
      job_id: distJobId,
      boards: selectedBoards,
      status_per_board: statusPerBoard,
    })
    setShowDistModal(false)
  }

  return (
    <>
      <Header
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <div className="flex gap-2">
            {activeTab === 'postings' && (
              <Button size="sm" onClick={openNewJob}>
                <Plus size={14} /> {t('postJob')}
              </Button>
            )}
            {activeTab === 'pipeline' && (
              <Button size="sm" onClick={openNewApplication}>
                <Plus size={14} /> {t('addCandidate')}
              </Button>
            )}
            {activeTab === 'career_site' && (
              <Button size="sm" variant="outline" onClick={() => setShowPreviewModal(true)}>
                <ExternalLink size={14} /> {t('preview')}
              </Button>
            )}
          </div>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label={t('openPositions')} value={openPositions} icon={<Briefcase size={20} />} />
        <StatCard label={t('totalApplicants')} value={totalApplicants} change={t('acrossAllPostings')} changeType="neutral" icon={<Users size={20} />} href="/people" />
        <StatCard label={t('inInterview')} value={inInterview} change={t('activeCandidates')} changeType="neutral" />
        <StatCard label={t('offersExtended')} value={offersExtended} change={t('pendingAcceptance')} changeType="positive" />
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
              {t('noJobPostings')}
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
                  <p className="text-[0.6rem] text-t3 uppercase mb-1">{t('requirements')}</p>
                  <div className="flex flex-wrap gap-1">
                    {(typeof job.requirements === 'string' ? job.requirements.split(',').map(s => s.trim()) : job.requirements).slice(0, 3).map((req: string, i: number) => (
                      <span key={i} className="text-[0.6rem] bg-canvas text-t2 px-2 py-0.5 rounded-full">{req}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between pt-2 border-t border-divider">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-t3">{(job.application_count || 0) !== 1 ? t('applicantCountPlural', { count: job.application_count || 0 }) : t('applicantCount', { count: job.application_count || 0 })}</span>
                  {(() => {
                    const dist = jobDistributions.find(d => d.job_id === job.id)
                    return dist ? (
                      <Badge variant="info">{t('postedTo', { count: dist.boards.length })}</Badge>
                    ) : null
                  })()}
                </div>
                <div className="flex gap-2">
                  {job.status === 'open' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => closeJob(job.id)}>{t('closePosting')}</Button>
                      <Button size="sm" variant="ghost" onClick={() => openDistribution(job.id)}><Send size={12} /> {t('distribution')}</Button>
                    </>
                  ) : (
                    <Button size="sm" variant="secondary" onClick={() => reopenJob(job.id)}>{tc('reopen')}</Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => { setActiveTab('pipeline') }}>{t('viewApplicants')}</Button>
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
              <CardTitle>{t('candidatePipeline')}</CardTitle>
              <Button size="sm" onClick={openNewApplication}>
                <Plus size={14} /> {t('addCandidate')}
              </Button>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-divider bg-canvas">
                  <th className="tempo-th text-left px-6 py-3">{t('tableCandidate')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tablePosition')}</th>
                  <th className="tempo-th text-left px-4 py-3">{t('tableStage')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableRating')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableStatus')}</th>
                  <th className="tempo-th text-center px-4 py-3">{t('tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {applications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-t3">
                      {t('noApplications')}
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
                      <td className="px-4 py-3 text-sm text-t2">{job?.title || tc('unknown')}</td>
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
                          ) : <span className="text-xs text-t3">{tc('notAvailable')}</span>}
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
                              <ArrowRight size={12} /> {tc('move')}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => rejectApplication(app.id)}>
                              {tc('reject')}
                            </Button>
                          </div>
                        )}
                        {isHired && <span className="text-xs text-success font-medium">{t('hiredLabel')}</span>}
                        {isRejected && <span className="text-xs text-error font-medium">{t('rejectedLabel')}</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Career Site Tab */}
      {activeTab === 'career_site' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Configuration */}
          <div className="lg:col-span-2 space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-4">{t('careerSiteConfig')}</h3>
              <div className="space-y-4">
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={careerForm.enabled}
                    onChange={(e) => setCareerForm({ ...careerForm, enabled: e.target.checked })}
                    className="rounded border-divider"
                  />
                  <span className="text-sm text-t1">{t('enableCareerSite')}</span>
                </label>

                <Input label={t('heroTitle')} value={careerForm.hero_title} onChange={(e) => setCareerForm({ ...careerForm, hero_title: e.target.value })} />
                <Textarea label={t('heroSubtitle')} value={careerForm.hero_subtitle} onChange={(e) => setCareerForm({ ...careerForm, hero_subtitle: e.target.value })} rows={2} />

                <Select label={t('theme')} value={careerForm.theme} onChange={(e) => setCareerForm({ ...careerForm, theme: e.target.value })} options={[
                  { value: 'professional', label: t('professional') },
                  { value: 'modern', label: t('modern') },
                  { value: 'creative', label: t('creative') },
                ]} />

                <div>
                  <p className="text-xs font-medium text-t1 mb-2">{t('sections')}</p>
                  <div className="flex flex-wrap gap-2">
                    {['about', 'benefits', 'positions', 'team', 'testimonials'].map(section => (
                      <button
                        key={section}
                        onClick={() => toggleSection(section)}
                        className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                          careerForm.sections.includes(section)
                            ? 'bg-tempo-600 text-white'
                            : 'bg-canvas text-t3 hover:bg-tempo-50'
                        }`}
                      >
                        {t(section as 'about' | 'benefits' | 'positions' | 'team' | 'testimonials')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button onClick={saveCareerSite}>{tc('saveChanges')}</Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Sidebar: AI Score + Preview */}
          <div className="space-y-4">
            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('siteEffectiveness')}</h3>
              <div className="text-center mb-4">
                <div className="text-3xl font-bold text-tempo-600">{careerSiteScore.value}</div>
                <p className="text-xs text-t3">{careerSiteScore.label}</p>
              </div>
              {careerSiteScore.breakdown?.map(f => (
                <div key={f.factor} className="mb-2">
                  <div className="flex justify-between text-xs text-t3 mb-1">
                    <span>{f.factor}</span>
                    <span>{f.score}%</span>
                  </div>
                  <Progress value={f.score} />
                </div>
              ))}
            </Card>

            <Card>
              <h3 className="text-sm font-semibold text-t1 mb-3">{t('preview')}</h3>
              <div className="bg-canvas rounded-lg p-4 text-center">
                <Globe size={24} className="mx-auto mb-2 text-tempo-600" />
                <p className="text-xs font-medium text-t1 mb-1">{careerForm.hero_title || 'Your Career Site'}</p>
                <p className="text-[0.6rem] text-t3 mb-3">{careerForm.hero_subtitle || 'Add a subtitle...'}</p>
                <p className="text-[0.6rem] text-t3">{jobPostings.filter(j => j.status === 'open').length} {t('positions')}</p>
              </div>
              <Button className="w-full mt-3" variant="outline" size="sm" onClick={() => setShowPreviewModal(true)}>
                <ExternalLink size={12} /> {t('preview')}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* ---- MODALS ---- */}

      {/* Post/Edit Job Modal */}
      <Modal open={showJobModal} onClose={() => setShowJobModal(false)} title={editingJob ? t('editJobModal') : t('postJobModal')} size="lg">
        <div className="space-y-4">
          <Input
            label={t('jobTitleLabel')}
            placeholder={t('jobTitlePlaceholder')}
            value={jobForm.title}
            onChange={(e) => setJobForm({ ...jobForm, title: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('departmentLabel')}
              value={jobForm.department_id}
              onChange={(e) => setJobForm({ ...jobForm, department_id: e.target.value })}
              options={departments.map(d => ({ value: d.id, label: d.name }))}
            />
            <Input
              label={t('location')}
              placeholder={t('locationPlaceholder')}
              value={jobForm.location}
              onChange={(e) => setJobForm({ ...jobForm, location: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label={t('employmentType')}
              value={jobForm.type}
              onChange={(e) => setJobForm({ ...jobForm, type: e.target.value })}
              options={[
                { value: 'full_time', label: t('typeFullTime') },
                { value: 'part_time', label: t('typePartTime') },
                { value: 'contract', label: t('typeContract') },
                { value: 'internship', label: t('typeInternship') },
              ]}
            />
            <Select
              label={t('currencyLabel')}
              value={jobForm.currency}
              onChange={(e) => setJobForm({ ...jobForm, currency: e.target.value })}
              options={[
                { value: 'USD', label: tc('currencyUSD') },
                { value: 'NGN', label: tc('currencyNGN') },
                { value: 'GHS', label: tc('currencyGHS') },
                { value: 'KES', label: tc('currencyKES') },
                { value: 'XOF', label: tc('currencyXOF') },
              ]}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('salaryMin')}
              type="number"
              min={0}
              value={jobForm.salary_min}
              onChange={(e) => setJobForm({ ...jobForm, salary_min: Number(e.target.value) })}
            />
            <Input
              label={t('salaryMax')}
              type="number"
              min={0}
              value={jobForm.salary_max}
              onChange={(e) => setJobForm({ ...jobForm, salary_max: Number(e.target.value) })}
            />
          </div>
          <Textarea
            label={t('descriptionLabel')}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
            value={jobForm.description}
            onChange={(e) => setJobForm({ ...jobForm, description: e.target.value })}
          />
          <Textarea
            label={t('requirementsLabel')}
            placeholder={t('requirementsPlaceholder')}
            rows={4}
            value={jobForm.requirements}
            onChange={(e) => setJobForm({ ...jobForm, requirements: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowJobModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitJob}>{editingJob ? tc('saveChanges') : t('postJobButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Add Candidate Modal */}
      <Modal open={showAppModal} onClose={() => setShowAppModal(false)} title={t('addCandidateModal')}>
        <div className="space-y-4">
          <Select
            label={t('jobPosting')}
            value={appForm.job_id}
            onChange={(e) => setAppForm({ ...appForm, job_id: e.target.value })}
            options={jobPostings.filter(j => j.status === 'open').map(j => ({ value: j.id, label: j.title }))}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label={t('candidateName')}
              placeholder={t('candidateNamePlaceholder')}
              value={appForm.candidate_name}
              onChange={(e) => setAppForm({ ...appForm, candidate_name: e.target.value })}
            />
            <Input
              label={t('candidateEmail')}
              type="email"
              placeholder={t('candidateEmailPlaceholder')}
              value={appForm.candidate_email}
              onChange={(e) => setAppForm({ ...appForm, candidate_email: e.target.value })}
            />
          </div>
          <Input
            label={t('resumeUrl')}
            placeholder={t('resumeUrlPlaceholder')}
            value={appForm.resume_url}
            onChange={(e) => setAppForm({ ...appForm, resume_url: e.target.value })}
          />
          <Textarea
            label={t('coverLetter')}
            placeholder={t('coverLetterPlaceholder')}
            rows={3}
            value={appForm.cover_letter}
            onChange={(e) => setAppForm({ ...appForm, cover_letter: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowAppModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitApplication}>{t('addCandidateButton')}</Button>
          </div>
        </div>
      </Modal>

      {/* Move Stage Modal */}
      <Modal open={showStageModal} onClose={() => setShowStageModal(false)} title={t('moveStageModal')} size="sm">
        <div className="space-y-4">
          <Select
            label={t('moveToStage')}
            value={stageForm.stage}
            onChange={(e) => setStageForm({ ...stageForm, stage: e.target.value })}
            options={[
              { value: 'applied', label: t('stageApplied') },
              { value: 'screening', label: t('stageScreening') },
              { value: 'interview', label: t('stageInterview') },
              { value: 'assessment', label: t('stageAssessment') },
              { value: 'offer', label: t('stageOffer') },
              { value: 'hired', label: t('stageHired') },
            ]}
          />
          <Textarea
            label={t('notesOptional')}
            placeholder={t('notesPlaceholder')}
            rows={2}
            value={stageForm.notes}
            onChange={(e) => setStageForm({ ...stageForm, notes: e.target.value })}
          />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setShowStageModal(false)}>{tc('cancel')}</Button>
            <Button onClick={submitStageChange}>{t('moveStage')}</Button>
          </div>
        </div>
      </Modal>

      {/* Career Site Preview Modal */}
      <Modal open={showPreviewModal} onClose={() => setShowPreviewModal(false)} title={t('preview')} size="xl">
        <div className="bg-canvas rounded-lg overflow-hidden">
          {/* Hero */}
          <div className={`p-8 text-center ${careerForm.theme === 'modern' ? 'bg-gradient-to-r from-tempo-600 to-tempo-800' : careerForm.theme === 'creative' ? 'bg-gradient-to-r from-purple-600 to-pink-600' : 'bg-tempo-700'} text-white`}>
            <h2 className="text-xl font-bold mb-2">{careerForm.hero_title || 'Your Company'}</h2>
            <p className="text-sm opacity-80">{careerForm.hero_subtitle || 'Join our team'}</p>
          </div>
          {/* Open Positions */}
          <div className="p-6">
            <h3 className="text-sm font-semibold text-t1 mb-4">{t('positions')}</h3>
            <div className="space-y-3">
              {jobPostings.filter(j => j.status === 'open').map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-surface rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-t1">{job.title}</p>
                    <p className="text-xs text-t3">{job.location} - {job.type.replace(/_/g, ' ')}</p>
                  </div>
                  <Button size="sm" variant="primary">{tc('apply')}</Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      {/* Job Board Distribution Modal */}
      <Modal open={showDistModal} onClose={() => setShowDistModal(false)} title={t('postToBoards')}>
        <div className="space-y-4">
          {(() => {
            const job = jobPostings.find(j => j.id === distJobId)
            const recommendations = job ? recommendJobBoards(job) : []
            return (
              <>
                {job && <p className="text-xs text-t3 mb-2">{t('distribution')}: <span className="font-medium text-t1">{job.title}</span></p>}
                <div className="space-y-2">
                  {recommendations.map(board => (
                    <label key={board.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedBoards.includes(board.id) ? 'bg-tempo-50 border border-tempo-200' : 'bg-canvas hover:bg-tempo-50/50'}`}>
                      <input
                        type="checkbox"
                        checked={selectedBoards.includes(board.id)}
                        onChange={() => toggleBoard(board.id)}
                        className="rounded border-divider"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-t1">{board.name}</span>
                          {board.recommended && <Badge variant="success" className="text-[0.55rem]">{t('recommendedBoards')}</Badge>}
                        </div>
                        <p className="text-xs text-t3">{board.reason}</p>
                      </div>
                      <span className="text-xs font-medium text-tempo-600">{board.score}%</span>
                    </label>
                  ))}
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="secondary" onClick={() => setShowDistModal(false)}>{tc('cancel')}</Button>
                  <Button onClick={submitDistribution}><Send size={14} /> {t('postToBoards')} ({selectedBoards.length})</Button>
                </div>
              </>
            )
          })()}
        </div>
      </Modal>
    </>
  )
}
